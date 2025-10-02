import OpenAI from 'openai';
import { z } from 'zod';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

// Sentiment Analysis Schema
const SentimentOutputSchema = z.object({
  sentiment: z.number().min(-1).max(1),
  scores: z.object({
    positive: z.number().min(0).max(1),
    negative: z.number().min(0).max(1),
    neutral: z.number().min(0).max(1),
  }),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export type SentimentOutput = z.infer<typeof SentimentOutputSchema>;

export interface ContentItem {
  id: string;
  type: 'post' | 'comment';
  text: string;
  context?: string; // For posts, the title; for comments, the post title
}

export class SentimentService {
  private static instance: SentimentService;
  private openai: OpenAI;
  private readonly CACHE_TTL_DAYS = 7;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  static getInstance(): SentimentService {
    if (!SentimentService.instance) {
      SentimentService.instance = new SentimentService();
    }
    return SentimentService.instance;
  }

  // Generate cache key from content
  private generateCacheKey(text: string, context?: string): string {
    const content = context ? `${context}|${text}` : text;
    return createHash('sha256').update(content).digest('hex');
  }

  // Check if sentiment is cached (within 7 days)
  private async getCachedSentiment(cacheKey: string): Promise<SentimentOutput | null> {
    const cached = await prisma.sentimentResult.findUnique({
      where: { cacheKey },
    });

    if (!cached) return null;

    const ageInDays = (Date.now() - cached.analyzedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > this.CACHE_TTL_DAYS) {
      return null;
    }

    return {
      sentiment: cached.sentiment,
      scores: {
        positive: cached.positiveScore,
        negative: cached.negativeScore,
        neutral: cached.neutralScore,
      },
      confidence: cached.confidence,
      reasoning: cached.reasoning || '',
    };
  }

  // Analyze single item with OpenAI
  async analyzeSingle(item: ContentItem): Promise<SentimentOutput> {
    const cacheKey = this.generateCacheKey(item.text, item.context);

    // Check cache first
    const cached = await this.getCachedSentiment(cacheKey);
    if (cached) return cached;

    // Prepare prompt
    const systemPrompt = `You are a sentiment analysis expert specializing in analyzing developer and AI community discussions.
Analyze the sentiment of Reddit posts and comments about Claude, Claude Code, and Anthropic products.

Provide:
1. Overall sentiment score from -1 (very negative) to +1 (very positive)
2. Breakdown scores (positive, negative, neutral) that sum to 1.0
3. Confidence level (0-1)
4. Brief reasoning for the sentiment classification

Consider:
- Technical feedback and bug reports (may be constructive rather than negative)
- Feature requests (usually neutral to positive)
- User satisfaction and frustration
- Comparison with competitors
- Community tone and helpfulness`;

    const userPrompt = item.context
      ? `Context: "${item.context}"\n\nContent: "${item.text}"\n\nAnalyze the sentiment of this ${item.type}.`
      : `Content: "${item.text}"\n\nAnalyze the sentiment of this ${item.type}.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'sentiment_analysis',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                sentiment: {
                  type: 'number',
                  description: 'Overall sentiment from -1 to +1',
                },
                scores: {
                  type: 'object',
                  properties: {
                    positive: { type: 'number' },
                    negative: { type: 'number' },
                    neutral: { type: 'number' },
                  },
                  required: ['positive', 'negative', 'neutral'],
                  additionalProperties: false,
                },
                confidence: {
                  type: 'number',
                  description: 'Confidence level from 0 to 1',
                },
                reasoning: {
                  type: 'string',
                  description: 'Brief explanation of sentiment classification',
                },
              },
              required: ['sentiment', 'scores', 'confidence', 'reasoning'],
              additionalProperties: false,
            },
          },
        },
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);
      const result = SentimentOutputSchema.parse(parsed);

      // Save to database with cache key
      await prisma.sentimentResult.create({
        data: {
          itemId: item.id,
          itemType: item.type,
          sentiment: result.sentiment,
          positiveScore: result.scores.positive,
          negativeScore: result.scores.negative,
          neutralScore: result.scores.neutral,
          confidence: result.confidence,
          reasoning: result.reasoning,
          cacheKey,
        },
      });

      return result;
    } catch (error) {
      console.error(`Sentiment analysis failed for ${item.type} ${item.id}:`, error);
      throw error;
    }
  }

  // Batch analyze multiple items
  async analyzeBatch(
    items: ContentItem[],
    options: {
      batchSize?: number;
      onProgress?: (processed: number, total: number) => void;
    } = {}
  ): Promise<Map<string, SentimentOutput>> {
    const { batchSize = 20, onProgress } = options;
    const results = new Map<string, SentimentOutput>();

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map((item) => this.analyzeSingle(item))
      );

      batchResults.forEach((result, idx) => {
        const item = batch[idx];
        if (result.status === 'fulfilled') {
          results.set(item.id, result.value);
        } else {
          console.error(`Failed to analyze ${item.type} ${item.id}:`, result.reason);
        }
      });

      if (onProgress) {
        onProgress(Math.min(i + batchSize, items.length), items.length);
      }

      // Rate limiting: small delay between batches
      if (i + batchSize < items.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  // Get sentiment for existing item from database
  async getSentiment(itemId: string): Promise<SentimentOutput | null> {
    const result = await prisma.sentimentResult.findUnique({
      where: { itemId },
    });

    if (!result) return null;

    return {
      sentiment: result.sentiment,
      scores: {
        positive: result.positiveScore,
        negative: result.negativeScore,
        neutral: result.neutralScore,
      },
      confidence: result.confidence,
      reasoning: result.reasoning || '',
    };
  }

  // Get sentiment statistics
  async getStatistics(
    filters: {
      subreddit?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{
    avgSentiment: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    totalCount: number;
  }> {
    const where: Record<string, unknown> = {};

    if (filters.startDate || filters.endDate) {
      where.analyzedAt = {};
      if (filters.startDate) {
        (where.analyzedAt as Record<string, unknown>).gte = filters.startDate;
      }
      if (filters.endDate) {
        (where.analyzedAt as Record<string, unknown>).lte = filters.endDate;
      }
    }

    const results = await prisma.sentimentResult.findMany({
      where,
      include: {
        post: filters.subreddit ? { where: { subreddit: filters.subreddit } } : false,
        comment: filters.subreddit ? { where: { subreddit: filters.subreddit } } : false,
      },
    });

    const filtered = filters.subreddit
      ? results.filter((r) => r.post || r.comment)
      : results;

    const totalCount = filtered.length;
    if (totalCount === 0) {
      return {
        avgSentiment: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        totalCount: 0,
      };
    }

    const avgSentiment =
      filtered.reduce((sum, r) => sum + r.sentiment, 0) / totalCount;

    const positiveCount = filtered.filter((r) => r.sentiment > 0.2).length;
    const negativeCount = filtered.filter((r) => r.sentiment < -0.2).length;
    const neutralCount = totalCount - positiveCount - negativeCount;

    return {
      avgSentiment,
      positiveCount,
      negativeCount,
      neutralCount,
      totalCount,
    };
  }
}

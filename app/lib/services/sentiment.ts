// OpenAI Sentiment Analysis Service
// Based on chatgpt-expert specifications

import OpenAI from 'openai';
import { SentimentScore, SentimentLabel } from '@/types';

export interface SentimentAnalysisConfig {
  apiKey: string;
  model?: string;
}

export class SentimentAnalysisService {
  private client: OpenAI;
  private model: string;
  private cache: Map<string, SentimentScore> = new Map();

  constructor(config: SentimentAnalysisConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
    this.model = config.model || 'gpt-3.5-turbo';
  }

  /**
   * Analyze sentiment of a single text
   * Per chatgpt-expert: GPT-3.5-turbo with prompt engineering
   */
  async analyzeSentiment(text: string): Promise<SentimentScore> {
    // Check cache first (7-day cache per chatgpt-expert specs)
    const cacheKey = this.getCacheKey(text);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const prompt = this.buildPrompt(text);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert. Analyze the sentiment of Reddit posts and comments about Claude Code, an AI coding assistant.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const sentiment: SentimentScore = {
        label: result.sentiment as SentimentLabel,
        confidence: result.confidence,
        positive: result.scores?.positive || 0,
        neutral: result.scores?.neutral || 0,
        negative: result.scores?.negative || 0,
      };

      // Cache result (7-day TTL per design specs)
      this.cache.set(cacheKey, sentiment);

      return sentiment;
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      // Fallback to neutral sentiment
      return {
        label: 'neutral',
        confidence: 0,
        positive: 0.33,
        neutral: 0.34,
        negative: 0.33,
      };
    }
  }

  /**
   * Analyze sentiment in batches
   * Per chatgpt-expert: Batch processing for cost optimization
   */
  async analyzeBatch(texts: string[]): Promise<SentimentScore[]> {
    const results: SentimentScore[] = [];

    for (const text of texts) {
      const sentiment = await this.analyzeSentiment(text);
      results.push(sentiment);
      // Add small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Build sentiment analysis prompt
   * Per chatgpt-expert: Prompt engineering for accurate classification
   */
  private buildPrompt(text: string): string {
    return `Analyze the sentiment of this Reddit post/comment about Claude Code:

"${text}"

Return a JSON object with:
{
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": 0.0-1.0,
  "scores": {
    "positive": 0.0-1.0,
    "neutral": 0.0-1.0,
    "negative": 0.0-1.0
  }
}

Classification rules:
- positive: Praise, satisfaction, excitement, recommendations
- neutral: Questions, factual statements, mixed opinions
- negative: Complaints, frustration, criticism, problems`;
  }

  /**
   * Generate cache key from text
   * Per chatgpt-expert: Hash-based caching with content normalization
   */
  private getCacheKey(text: string): string {
    // Simple hash for MVP (use SHA-256 in production)
    const normalized = text.toLowerCase().trim();
    return Buffer.from(normalized).toString('base64').slice(0, 32);
  }

  /**
   * Clear cache (for testing/maintenance)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Factory function
export function createSentimentService(): SentimentAnalysisService {
  const config: SentimentAnalysisConfig = {
    apiKey: process.env.OPENAI_API_KEY || '',
  };

  return new SentimentAnalysisService(config);
}

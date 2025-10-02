# OpenAI API Integration Plan
## Claude Code Sentiment Monitor - AI-Powered Sentiment Analysis

**Project:** Claude Code Sentiment Monitor (Reddit)
**Document Version:** 1.0
**Date:** 2025-10-02
**Target Model:** GPT-3.5-turbo (cost-optimized) with GPT-4o-mini fallback

---

## Table of Contents

1. [OpenAI Integration Strategy](#1-openai-integration-strategy)
2. [Sentiment Analysis Design](#2-sentiment-analysis-design)
3. [7-Day Caching Strategy](#3-7-day-caching-strategy)
4. [Cost Optimization](#4-cost-optimization)
5. [TypeScript Implementation](#5-typescript-implementation)
6. [Quality Assurance](#6-quality-assurance)
7. [Production Deployment](#7-production-deployment)

---

## 1. OpenAI Integration Strategy

### 1.1 Model Selection

**Primary Model:** GPT-3.5-turbo
**Reasoning:**
- Cost-effective: $0.50/1M input tokens, $1.50/1M output tokens
- Fast inference: 117.1 tokens/second
- Sufficient accuracy for sentiment classification (3 categories)
- Supports JSON mode for structured outputs

**Fallback Model:** GPT-4o-mini
**When to use:**
- Complex/ambiguous sentiment cases (sarcasm, mixed emotions)
- Low confidence scores (<70%) from GPT-3.5-turbo
- Validation sampling for quality assurance

### 1.2 API Configuration

```typescript
// Environment variables (user-provided)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo  // Default model
OPENAI_FALLBACK_MODEL=gpt-4o-mini
OPENAI_MAX_RETRIES=3
OPENAI_TIMEOUT_MS=30000
```

### 1.3 Rate Limiting & Quotas

- **Tier 1 (Free tier):** 3 RPM, 200 RPD
- **Tier 2:** 50 RPM, 1M tokens/day
- **Strategy:** Implement exponential backoff, queue requests, batch processing

---

## 2. Sentiment Analysis Design

### 2.1 Prompt Engineering Approach

**CRITICAL PRINCIPLE:** Show, Don't Tell - Provide EXACT JSON structure with examples.

#### System Prompt (Consistent across all requests)

```typescript
const SYSTEM_PROMPT = `You are a sentiment analysis expert specializing in analyzing social media discussions about software development tools.

Your task is to classify Reddit posts and comments about Claude Code into sentiment categories with confidence scores.

IMPORTANT CONTEXT:
- Claude Code is an AI-powered coding assistant from Anthropic
- Posts may discuss features, bugs, comparisons with competitors, user experiences
- Be sensitive to technical jargon, sarcasm, and mixed sentiments
- Consider context: "This is a problem" in bug reports vs. general complaints

CLASSIFICATION RULES:
- POSITIVE: Praise, satisfaction, recommendations, excitement, problem solved
- NEUTRAL: Questions, factual statements, feature requests without emotion, mixed balanced sentiment
- NEGATIVE: Complaints, frustration, bugs, disappointment, switching to competitors

Return analysis as JSON only. No additional commentary.`;
```

#### User Prompt Template (With Explicit JSON Example)

```typescript
const USER_PROMPT_TEMPLATE = `Analyze the sentiment of this Reddit content about Claude Code.

CONTENT TO ANALYZE:
---
Subreddit: {subreddit}
Type: {type}  // "post" or "comment"
Author: {author}
Score: {score}
Text: {text}
---

Return JSON with this EXACT structure:
{
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": 85,  // 0-100, how confident you are
  "reasoning": "Brief explanation of why this sentiment was chosen",
  "keywords": ["keyword1", "keyword2"],  // 2-5 relevant keywords
  "hasComplexSentiment": false,  // true if sarcasm/mixed/ambiguous
  "emotionalIntensity": 7  // 1-10, how strong the emotion is
}

EXAMPLE RESPONSE for "Claude Code just saved me 3 hours of debugging! Best tool ever!":
{
  "sentiment": "positive",
  "confidence": 95,
  "reasoning": "Strong praise with specific benefit and superlative language",
  "keywords": ["saved time", "debugging", "best tool"],
  "hasComplexSentiment": false,
  "emotionalIntensity": 9
}

Now analyze the content above:`;
```

### 2.2 Zod Schema for Validation

```typescript
import { z } from 'zod';

export const SentimentAnalysisSchema = z.object({
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  confidence: z.number().min(0).max(100),
  reasoning: z.string().min(10).max(500),
  keywords: z.array(z.string()).min(1).max(5),  // Flexible: 1-5 keywords
  hasComplexSentiment: z.boolean(),
  emotionalIntensity: z.number().min(1).max(10),
});

export type SentimentAnalysis = z.infer<typeof SentimentAnalysisSchema>;
```

### 2.3 Edge Case Handling

| Edge Case | Detection Strategy | Handling Approach |
|-----------|-------------------|-------------------|
| **Sarcasm** | Exclamation marks + negative keywords | Flag `hasComplexSentiment: true`, consider GPT-4o-mini re-analysis |
| **Mixed Sentiment** | Both positive and negative phrases | Classify as "neutral" if balanced, otherwise dominant sentiment |
| **Technical Jargon** | Context-specific terms (e.g., "breaking changes") | System prompt includes technical context awareness |
| **Non-English** | Language detection pre-filter | Skip or translate before analysis (out of scope for MVP) |
| **Bot/Spam** | Pre-filtered by data pipeline | Already removed before sentiment analysis |
| **Very Short Text** | <10 words | Lower confidence threshold, consider context (parent post) |

---

## 3. 7-Day Caching Strategy

### 3.1 Cache Architecture

**Storage:** SQLite database with indexed lookups (lightweight, self-hosted)
**TTL:** 7 days (604,800 seconds)
**Cache Key:** SHA-256 hash of normalized content + model version

```typescript
interface CachedSentiment {
  contentHash: string;        // SHA-256(normalizedText + modelVersion)
  sentiment: string;          // positive/neutral/negative
  confidence: number;
  reasoning: string;
  keywords: string[];
  hasComplexSentiment: boolean;
  emotionalIntensity: number;
  modelVersion: string;       // e.g., "gpt-3.5-turbo-2025-01"
  cachedAt: Date;
  expiresAt: Date;
  redditItemId: string;       // For tracing back to source
}
```

### 3.2 Cache Normalization

To maximize cache hits, normalize content before hashing:

```typescript
function normalizeContent(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/[^\w\s]/g, '')        // Remove punctuation
    .replace(/https?:\/\/\S+/g, '') // Remove URLs
    .trim();
}

function generateCacheKey(text: string, modelVersion: string): string {
  const normalized = normalizeContent(text);
  const combined = `${normalized}::${modelVersion}`;
  return createHash('sha256').update(combined).digest('hex');
}
```

### 3.3 Cache Invalidation Rules

1. **TTL Expiration:** Automatically expire after 7 days
2. **Model Version Change:** New model = new cache keys (no collision)
3. **Manual Invalidation:** Admin endpoint to clear cache for reprocessing
4. **Disk Space Management:** Keep max 100,000 entries, LRU eviction

### 3.4 Cache Hit Rate Optimization

**Expected Performance:**
- **Initial Run (90-day backfill):** 0% hit rate (cold cache)
- **Daily Updates:** ~60-70% hit rate (reposts, similar comments)
- **Weekly Refreshes:** ~80% hit rate (stable discussions)

**Monitoring:**
```typescript
interface CacheMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;        // hits / total
  avgLookupTimeMs: number;
  apiCallsSaved: number;
  costSaved: number;      // in USD
}
```

---

## 4. Cost Optimization

### 4.1 Token Usage Minimization

**Input Token Reduction Strategies:**

1. **Truncate Long Content:**
   ```typescript
   const MAX_CONTENT_LENGTH = 500; // ~375 tokens

   function truncateContent(text: string): string {
     if (text.length <= MAX_CONTENT_LENGTH) return text;
     return text.substring(0, MAX_CONTENT_LENGTH) + '...';
   }
   ```

2. **Remove Redundant Metadata:**
   - Don't send Reddit JSON structure, only relevant fields
   - Skip author karma, awards, gilding (not needed for sentiment)

3. **Batch Context Sharing:**
   - Send system prompt once per batch, not per item

**Output Token Reduction:**
- JSON-only responses (no markdown formatting)
- Strict schema prevents verbose explanations
- Estimated output: ~100 tokens per analysis

### 4.2 Token Counting

```typescript
import { encoding_for_model } from 'tiktoken';

export class TokenCounter {
  private encoder;

  constructor(model: string = 'gpt-3.5-turbo') {
    this.encoder = encoding_for_model(model);
  }

  countTokens(text: string): number {
    return this.encoder.encode(text).length;
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    // GPT-3.5-turbo pricing
    const inputCost = (inputTokens / 1_000_000) * 0.50;
    const outputCost = (outputTokens / 1_000_000) * 1.50;
    return inputCost + outputCost;
  }

  free() {
    this.encoder.free();
  }
}
```

### 4.3 Batch Processing Optimization

**Strategy:** Process multiple items in parallel with rate limiting

```typescript
interface BatchConfig {
  batchSize: number;      // Items per batch
  maxConcurrent: number;  // Parallel API calls
  delayMs: number;        // Delay between batches
}

const BATCH_CONFIG: BatchConfig = {
  batchSize: 10,          // 10 items per batch
  maxConcurrent: 3,       // 3 concurrent API calls
  delayMs: 1000,          // 1 second between batches
};

// For Tier 1: 3 RPM = process 30 items/min
// For Tier 2: 50 RPM = process 500 items/min
```

### 4.4 Cost Estimation for 90-Day Data

**Assumptions:**
- **r/ClaudeAI:** ~100 posts/day, ~500 comments/day
- **r/ClaudeCode:** ~20 posts/day, ~100 comments/day
- **r/Anthropic:** ~50 posts/day, ~200 comments/day
- **Total:** ~170 posts/day, ~800 comments/day = **970 items/day**
- **90 days:** 970 × 90 = **87,300 items**

**Token Usage per Item:**
- System prompt: 200 tokens (amortized across batch)
- User prompt template: 100 tokens
- Content: ~200 tokens (average)
- **Total Input:** ~500 tokens/item
- **Output:** ~100 tokens/item

**Total Tokens (90 days, no cache):**
- Input: 87,300 × 500 = **43.65M tokens**
- Output: 87,300 × 100 = **8.73M tokens**

**Cost Calculation:**
- Input: (43.65M / 1M) × $0.50 = **$21.83**
- Output: (8.73M / 1M) × $1.50 = **$13.10**
- **Total: $34.93** (one-time backfill)

**Daily Ongoing Cost (with 70% cache hit rate):**
- New items: 970 × 0.30 = 291 items/day
- Input: (291 × 500) / 1M × $0.50 = **$0.07**
- Output: (291 × 100) / 1M × $1.50 = **$0.04**
- **Daily: $0.11** (~$3.30/month)

**Annual Cost Estimate:** ~$40/year (backfill + ongoing)

---

## 5. TypeScript Implementation

### 5.1 Project Structure

```
src/
├── services/
│   ├── openai/
│   │   ├── OpenAIService.ts          // Main service
│   │   ├── SentimentAnalyzer.ts      // Sentiment-specific logic
│   │   ├── TokenCounter.ts           // Token counting utilities
│   │   ├── PromptTemplates.ts        // Prompt management
│   │   └── types.ts                  // TypeScript interfaces
│   └── cache/
│       ├── SentimentCache.ts         // Cache implementation
│       └── CacheMetrics.ts           // Metrics tracking
├── models/
│   └── schemas.ts                     // Zod schemas
└── utils/
    ├── rateLimiter.ts                 // Rate limiting
    └── retry.ts                       // Retry logic
```

### 5.2 Core Implementation

#### 5.2.1 OpenAI Service (OpenAIService.ts)

```typescript
import OpenAI from 'openai';
import { RateLimiter } from '../utils/rateLimiter';
import { retryWithBackoff } from '../utils/retry';

export class OpenAIService {
  private client: OpenAI;
  private rateLimiter: RateLimiter;
  private model: string;
  private fallbackModel: string;

  constructor(config: {
    apiKey: string;
    model?: string;
    fallbackModel?: string;
    maxRetries?: number;
    timeout?: number;
  }) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 30000,
    });

    this.model = config.model || 'gpt-3.5-turbo';
    this.fallbackModel = config.fallbackModel || 'gpt-4o-mini';

    // Rate limiter: 3 RPM for Tier 1, adjust based on your tier
    this.rateLimiter = new RateLimiter({
      requestsPerMinute: 3,
      requestsPerDay: 200,
    });
  }

  async createChatCompletion(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      responseFormat?: { type: 'json_object' };
      useFallback?: boolean;
    }
  ): Promise<OpenAI.Chat.ChatCompletion> {
    await this.rateLimiter.waitForSlot();

    const model = options?.useFallback ? this.fallbackModel : this.model;

    return retryWithBackoff(async () => {
      try {
        const completion = await this.client.chat.completions.create({
          model,
          messages,
          temperature: options?.temperature || 0.3,
          max_tokens: options?.maxTokens || 500,
          response_format: options?.responseFormat || { type: 'json_object' },
        });

        return completion;
      } catch (error: any) {
        if (error?.status === 429) {
          // Rate limit hit, throw to trigger retry
          throw new Error('Rate limit exceeded');
        }
        throw error;
      }
    }, {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.models.retrieve(this.model);
      return true;
    } catch {
      return false;
    }
  }
}
```

#### 5.2.2 Sentiment Analyzer (SentimentAnalyzer.ts)

```typescript
import { OpenAIService } from './OpenAIService';
import { SentimentCache } from '../cache/SentimentCache';
import { TokenCounter } from './TokenCounter';
import { SYSTEM_PROMPT, getUserPrompt } from './PromptTemplates';
import { SentimentAnalysisSchema, type SentimentAnalysis } from '../models/schemas';

export interface RedditContent {
  id: string;
  subreddit: string;
  type: 'post' | 'comment';
  author: string;
  score: number;
  text: string;
  createdAt: Date;
}

export interface AnalysisResult extends SentimentAnalysis {
  redditItemId: string;
  modelUsed: string;
  tokensUsed: {
    input: number;
    output: number;
  };
  cacheHit: boolean;
  processingTimeMs: number;
}

export class SentimentAnalyzer {
  private openaiService: OpenAIService;
  private cache: SentimentCache;
  private tokenCounter: TokenCounter;
  private modelVersion: string;

  constructor(
    openaiService: OpenAIService,
    cache: SentimentCache,
    modelVersion: string = 'gpt-3.5-turbo-2025-01'
  ) {
    this.openaiService = openaiService;
    this.cache = cache;
    this.tokenCounter = new TokenCounter();
    this.modelVersion = modelVersion;
  }

  async analyzeSentiment(content: RedditContent): Promise<AnalysisResult> {
    const startTime = Date.now();

    // Check cache first
    const cached = await this.cache.get(content.text, this.modelVersion);
    if (cached) {
      return {
        ...cached,
        redditItemId: content.id,
        modelUsed: cached.modelVersion,
        tokensUsed: { input: 0, output: 0 },
        cacheHit: true,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Truncate long content
    const truncatedText = this.truncateContent(content.text);

    // Prepare messages
    const userPrompt = getUserPrompt(content, truncatedText);
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: userPrompt },
    ];

    // Count tokens
    const inputTokens = this.tokenCounter.countTokens(
      SYSTEM_PROMPT + userPrompt
    );

    // Call OpenAI API
    const completion = await this.openaiService.createChatCompletion(messages, {
      temperature: 0.3,
      maxTokens: 500,
      responseFormat: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse and validate response
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate with Zod
    let validatedResponse: SentimentAnalysis;
    try {
      validatedResponse = SentimentAnalysisSchema.parse(parsedResponse);
    } catch (error) {
      console.error('Zod validation failed for response:', parsedResponse);
      console.error('Validation error:', error);
      throw new Error('Response does not match expected schema');
    }

    // Cache the result
    await this.cache.set(content.text, validatedResponse, this.modelVersion);

    const outputTokens = completion.usage?.completion_tokens || 100;

    // Handle complex sentiment with fallback model
    if (validatedResponse.hasComplexSentiment && validatedResponse.confidence < 70) {
      console.log(`Low confidence (${validatedResponse.confidence}%) for complex sentiment, using fallback model`);
      return this.analyzeWithFallback(content, validatedResponse, startTime);
    }

    return {
      ...validatedResponse,
      redditItemId: content.id,
      modelUsed: this.modelVersion,
      tokensUsed: {
        input: inputTokens,
        output: outputTokens,
      },
      cacheHit: false,
      processingTimeMs: Date.now() - startTime,
    };
  }

  async analyzeBatch(contents: RedditContent[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    const batchSize = 10;

    for (let i = 0; i < contents.length; i += batchSize) {
      const batch = contents.slice(i, i + batchSize);

      // Process batch in parallel with concurrency limit
      const batchPromises = batch.map(content =>
        this.analyzeSentiment(content).catch(error => {
          console.error(`Failed to analyze ${content.id}:`, error);
          return this.createFallbackResult(content, error);
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Rate limiting delay between batches
      if (i + batchSize < contents.length) {
        await this.sleep(1000);
      }
    }

    return results;
  }

  private async analyzeWithFallback(
    content: RedditContent,
    initialResult: SentimentAnalysis,
    startTime: number
  ): Promise<AnalysisResult> {
    try {
      const userPrompt = getUserPrompt(content, this.truncateContent(content.text));
      const messages = [
        { role: 'system' as const, content: SYSTEM_PROMPT },
        { role: 'user' as const, content: userPrompt },
      ];

      const completion = await this.openaiService.createChatCompletion(messages, {
        temperature: 0.3,
        maxTokens: 500,
        responseFormat: { type: 'json_object' },
        useFallback: true,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (responseText) {
        const fallbackResult = SentimentAnalysisSchema.parse(JSON.parse(responseText));

        // Cache fallback result
        await this.cache.set(content.text, fallbackResult, 'gpt-4o-mini-2025-01');

        return {
          ...fallbackResult,
          redditItemId: content.id,
          modelUsed: 'gpt-4o-mini-2025-01',
          tokensUsed: {
            input: completion.usage?.prompt_tokens || 0,
            output: completion.usage?.completion_tokens || 0,
          },
          cacheHit: false,
          processingTimeMs: Date.now() - startTime,
        };
      }
    } catch (error) {
      console.error('Fallback model also failed:', error);
    }

    // Return initial result if fallback fails
    return {
      ...initialResult,
      redditItemId: content.id,
      modelUsed: this.modelVersion,
      tokensUsed: { input: 0, output: 0 },
      cacheHit: false,
      processingTimeMs: Date.now() - startTime,
    };
  }

  private truncateContent(text: string, maxLength: number = 500): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  private createFallbackResult(content: RedditContent, error: Error): AnalysisResult {
    // Return neutral sentiment on error
    return {
      sentiment: 'neutral',
      confidence: 0,
      reasoning: `Error during analysis: ${error.message}`,
      keywords: [],
      hasComplexSentiment: true,
      emotionalIntensity: 5,
      redditItemId: content.id,
      modelUsed: 'error-fallback',
      tokensUsed: { input: 0, output: 0 },
      cacheHit: false,
      processingTimeMs: 0,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### 5.2.3 Prompt Templates (PromptTemplates.ts)

```typescript
import type { RedditContent } from './SentimentAnalyzer';

export const SYSTEM_PROMPT = `You are a sentiment analysis expert specializing in analyzing social media discussions about software development tools.

Your task is to classify Reddit posts and comments about Claude Code into sentiment categories with confidence scores.

IMPORTANT CONTEXT:
- Claude Code is an AI-powered coding assistant from Anthropic
- Posts may discuss features, bugs, comparisons with competitors, user experiences
- Be sensitive to technical jargon, sarcasm, and mixed sentiments
- Consider context: "This is a problem" in bug reports vs. general complaints

CLASSIFICATION RULES:
- POSITIVE: Praise, satisfaction, recommendations, excitement, problem solved
- NEUTRAL: Questions, factual statements, feature requests without emotion, mixed balanced sentiment
- NEGATIVE: Complaints, frustration, bugs, disappointment, switching to competitors

Return analysis as JSON only. No additional commentary.`;

export function getUserPrompt(content: RedditContent, truncatedText: string): string {
  return `Analyze the sentiment of this Reddit content about Claude Code.

CONTENT TO ANALYZE:
---
Subreddit: ${content.subreddit}
Type: ${content.type}
Author: ${content.author}
Score: ${content.score}
Text: ${truncatedText}
---

Return JSON with this EXACT structure:
{
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": 85,
  "reasoning": "Brief explanation of why this sentiment was chosen",
  "keywords": ["keyword1", "keyword2"],
  "hasComplexSentiment": false,
  "emotionalIntensity": 7
}

EXAMPLE RESPONSE for "Claude Code just saved me 3 hours of debugging! Best tool ever!":
{
  "sentiment": "positive",
  "confidence": 95,
  "reasoning": "Strong praise with specific benefit and superlative language",
  "keywords": ["saved time", "debugging", "best tool"],
  "hasComplexSentiment": false,
  "emotionalIntensity": 9
}

Now analyze the content above:`;
}
```

#### 5.2.4 Sentiment Cache (SentimentCache.ts)

```typescript
import { createHash } from 'crypto';
import Database from 'better-sqlite3';
import type { SentimentAnalysis } from '../models/schemas';

export interface CachedSentiment extends SentimentAnalysis {
  contentHash: string;
  modelVersion: string;
  cachedAt: Date;
  expiresAt: Date;
}

export class SentimentCache {
  private db: Database.Database;
  private ttlSeconds: number;

  constructor(dbPath: string = './data/sentiment-cache.db', ttlDays: number = 7) {
    this.db = new Database(dbPath);
    this.ttlSeconds = ttlDays * 24 * 60 * 60;
    this.initializeDatabase();
  }

  private initializeDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sentiment_cache (
        content_hash TEXT PRIMARY KEY,
        sentiment TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        reasoning TEXT NOT NULL,
        keywords TEXT NOT NULL,
        has_complex_sentiment INTEGER NOT NULL,
        emotional_intensity INTEGER NOT NULL,
        model_version TEXT NOT NULL,
        cached_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_expires_at ON sentiment_cache(expires_at);
      CREATE INDEX IF NOT EXISTS idx_model_version ON sentiment_cache(model_version);
    `);
  }

  async get(content: string, modelVersion: string): Promise<CachedSentiment | null> {
    const contentHash = this.generateHash(content, modelVersion);
    const now = Math.floor(Date.now() / 1000);

    const row = this.db.prepare(`
      SELECT * FROM sentiment_cache
      WHERE content_hash = ? AND expires_at > ?
    `).get(contentHash, now);

    if (!row) return null;

    return {
      contentHash: row.content_hash,
      sentiment: row.sentiment,
      confidence: row.confidence,
      reasoning: row.reasoning,
      keywords: JSON.parse(row.keywords),
      hasComplexSentiment: Boolean(row.has_complex_sentiment),
      emotionalIntensity: row.emotional_intensity,
      modelVersion: row.model_version,
      cachedAt: new Date(row.cached_at * 1000),
      expiresAt: new Date(row.expires_at * 1000),
    };
  }

  async set(content: string, analysis: SentimentAnalysis, modelVersion: string): Promise<void> {
    const contentHash = this.generateHash(content, modelVersion);
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + this.ttlSeconds;

    this.db.prepare(`
      INSERT OR REPLACE INTO sentiment_cache (
        content_hash, sentiment, confidence, reasoning, keywords,
        has_complex_sentiment, emotional_intensity, model_version,
        cached_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      contentHash,
      analysis.sentiment,
      analysis.confidence,
      analysis.reasoning,
      JSON.stringify(analysis.keywords),
      analysis.hasComplexSentiment ? 1 : 0,
      analysis.emotionalIntensity,
      modelVersion,
      now,
      expiresAt
    );
  }

  async cleanup(): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    const result = this.db.prepare(`
      DELETE FROM sentiment_cache WHERE expires_at <= ?
    `).run(now);

    return result.changes;
  }

  async getMetrics(): Promise<{
    totalEntries: number;
    expiredEntries: number;
    sizeBytes: number;
  }> {
    const now = Math.floor(Date.now() / 1000);

    const total = this.db.prepare('SELECT COUNT(*) as count FROM sentiment_cache').get();
    const expired = this.db.prepare('SELECT COUNT(*) as count FROM sentiment_cache WHERE expires_at <= ?').get(now);

    const stats = this.db.prepare('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()').get();

    return {
      totalEntries: total.count,
      expiredEntries: expired.count,
      sizeBytes: stats.size,
    };
  }

  private generateHash(content: string, modelVersion: string): string {
    const normalized = this.normalizeContent(content);
    const combined = `${normalized}::${modelVersion}`;
    return createHash('sha256').update(combined).digest('hex');
  }

  private normalizeContent(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();
  }

  close() {
    this.db.close();
  }
}
```

#### 5.2.5 Rate Limiter (rateLimiter.ts)

```typescript
export interface RateLimiterConfig {
  requestsPerMinute: number;
  requestsPerDay: number;
}

export class RateLimiter {
  private requestTimestamps: number[] = [];
  private dailyRequests: number = 0;
  private lastResetDate: string;
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.lastResetDate = this.getCurrentDate();
  }

  async waitForSlot(): Promise<void> {
    this.resetDailyCountIfNeeded();

    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts > oneMinuteAgo);

    // Check daily limit
    if (this.dailyRequests >= this.config.requestsPerDay) {
      throw new Error('Daily rate limit exceeded');
    }

    // Check per-minute limit
    if (this.requestTimestamps.length >= this.config.requestsPerMinute) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = oldestTimestamp + 60000 - now;

      if (waitTime > 0) {
        console.log(`Rate limit reached, waiting ${waitTime}ms`);
        await this.sleep(waitTime);
      }
    }

    // Record this request
    this.requestTimestamps.push(now);
    this.dailyRequests++;
  }

  private resetDailyCountIfNeeded() {
    const currentDate = this.getCurrentDate();
    if (currentDate !== this.lastResetDate) {
      this.dailyRequests = 0;
      this.lastResetDate = currentDate;
    }
  }

  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMetrics() {
    return {
      requestsInLastMinute: this.requestTimestamps.length,
      requestsToday: this.dailyRequests,
      limitPerMinute: this.config.requestsPerMinute,
      limitPerDay: this.config.requestsPerDay,
    };
  }
}
```

#### 5.2.6 Retry Logic (retry.ts)

```typescript
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier?: number;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  const backoffMultiplier = config.backoffMultiplier || 2;
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt === config.maxRetries) {
        break;
      }

      // Calculate exponential backoff delay
      const delay = Math.min(
        config.initialDelayMs * Math.pow(backoffMultiplier, attempt),
        config.maxDelayMs
      );

      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error.message);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Failed after ${config.maxRetries + 1} attempts: ${lastError!.message}`);
}
```

#### 5.2.7 Token Counter (TokenCounter.ts)

```typescript
import { encoding_for_model, type Tiktoken } from 'tiktoken';

export class TokenCounter {
  private encoder: Tiktoken;

  constructor(model: string = 'gpt-3.5-turbo') {
    this.encoder = encoding_for_model(model as any);
  }

  countTokens(text: string): number {
    return this.encoder.encode(text).length;
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    // GPT-3.5-turbo pricing (as of 2025)
    const inputCost = (inputTokens / 1_000_000) * 0.50;
    const outputCost = (outputTokens / 1_000_000) * 1.50;
    return inputCost + outputCost;
  }

  free() {
    this.encoder.free();
  }
}
```

### 5.3 Usage Example

```typescript
import { OpenAIService } from './services/openai/OpenAIService';
import { SentimentAnalyzer } from './services/openai/SentimentAnalyzer';
import { SentimentCache } from './services/cache/SentimentCache';

// Initialize services
const openaiService = new OpenAIService({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-3.5-turbo',
  fallbackModel: 'gpt-4o-mini',
});

const cache = new SentimentCache('./data/sentiment-cache.db', 7);
const analyzer = new SentimentAnalyzer(openaiService, cache);

// Analyze single Reddit post
const redditPost = {
  id: 'abc123',
  subreddit: 'ClaudeAI',
  type: 'post' as const,
  author: 'user123',
  score: 42,
  text: 'Claude Code just saved me 3 hours of debugging! Best tool ever!',
  createdAt: new Date(),
};

const result = await analyzer.analyzeSentiment(redditPost);
console.log('Sentiment:', result.sentiment);
console.log('Confidence:', result.confidence);
console.log('Cache hit:', result.cacheHit);
console.log('Tokens used:', result.tokensUsed);

// Batch processing
const redditPosts = [/* ... array of posts ... */];
const results = await analyzer.analyzeBatch(redditPosts);

// Cache maintenance (run daily)
const expiredCount = await cache.cleanup();
console.log(`Cleaned up ${expiredCount} expired cache entries`);

const metrics = await cache.getMetrics();
console.log('Cache metrics:', metrics);
```

---

## 6. Quality Assurance

### 6.1 Validation Workflow

**Weekly Review Process (per PRD requirement):**

1. **Sample Selection:**
   - Random sample of 200 items per week
   - Stratified by subreddit and sentiment category
   - Include edge cases (low confidence, complex sentiment)

2. **Human Annotation:**
   - Annotators classify same content independently
   - Use web interface for efficient review
   - Track inter-annotator agreement (IAA)

3. **Accuracy Calculation:**
   ```typescript
   interface ValidationMetrics {
     totalSamples: number;
     correctPredictions: number;
     accuracy: number;              // correctPredictions / totalSamples
     precisionByClass: {
       positive: number;
       neutral: number;
       negative: number;
     };
     recallByClass: {
       positive: number;
       neutral: number;
       negative: number;
     };
     f1ScoreByClass: {
       positive: number;
       neutral: number;
       negative: number;
     };
     confusionMatrix: number[][];   // 3x3 matrix
   }
   ```

4. **Threshold for Re-tuning:**
   - If accuracy drops below 80%, investigate
   - Analyze common failure patterns
   - Update prompts or switch models

### 6.2 Validation Implementation

```typescript
export class SentimentValidator {
  private db: Database.Database;

  constructor(dbPath: string = './data/validation.db') {
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS validation_samples (
        id TEXT PRIMARY KEY,
        reddit_item_id TEXT NOT NULL,
        text TEXT NOT NULL,
        predicted_sentiment TEXT NOT NULL,
        predicted_confidence INTEGER NOT NULL,
        human_sentiment TEXT,
        annotator_id TEXT,
        annotated_at INTEGER,
        is_correct INTEGER,
        notes TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_annotated ON validation_samples(annotated_at);
    `);
  }

  async selectRandomSamples(count: number): Promise<any[]> {
    // Implementation: Select stratified random samples
    // Ensure representation across subreddits and sentiment categories
  }

  async recordHumanAnnotation(sampleId: string, humanSentiment: string, annotatorId: string, notes?: string) {
    // Implementation: Store human annotation and calculate if prediction was correct
  }

  async calculateWeeklyMetrics(weekStartDate: Date): Promise<ValidationMetrics> {
    // Implementation: Calculate accuracy, precision, recall, F1 for the week
  }

  async generateConfusionMatrix(weekStartDate: Date): Promise<number[][]> {
    // Implementation: Generate 3x3 confusion matrix
    // Rows = predicted, Columns = actual
  }
}
```

### 6.3 Model Performance Monitoring

```typescript
export interface PerformanceMetrics {
  timestamp: Date;
  period: string;              // 'daily' | 'weekly' | 'monthly'
  totalAnalyses: number;
  avgConfidence: number;
  avgProcessingTimeMs: number;
  cacheHitRate: number;
  apiCallCount: number;
  totalCost: number;
  errorRate: number;
  complexSentimentRate: number; // % flagged as complex
  fallbackModelUsageRate: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];

  async recordAnalysis(result: AnalysisResult) {
    // Track metrics for each analysis
  }

  async generateDailyReport(): Promise<PerformanceMetrics> {
    // Aggregate daily metrics
  }

  async detectAnomalies(): Promise<string[]> {
    // Detect unusual patterns (e.g., sudden drop in confidence, spike in errors)
  }
}
```

### 6.4 Fallback Strategies

| Failure Scenario | Detection | Fallback Action |
|------------------|-----------|----------------|
| **API Quota Exceeded** | 429 status code | Queue requests, retry after window, show cached data |
| **API Timeout** | Request timeout | Retry with exponential backoff (3 attempts max) |
| **Invalid Response** | Zod validation failure | Log for review, return neutral sentiment with 0% confidence |
| **Network Error** | Connection failure | Retry 3 times, then mark as "error" in database |
| **Low Confidence** | confidence < 50% | Flag for human review, use GPT-4o-mini fallback |
| **Model Deprecation** | API version error | Automatically switch to recommended model, alert admin |

---

## 7. Production Deployment

### 7.1 Environment Configuration

```bash
# .env file
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_FALLBACK_MODEL=gpt-4o-mini
OPENAI_MAX_RETRIES=3
OPENAI_TIMEOUT_MS=30000

# Rate limiting (adjust based on your OpenAI tier)
OPENAI_REQUESTS_PER_MINUTE=3
OPENAI_REQUESTS_PER_DAY=200

# Caching
SENTIMENT_CACHE_TTL_DAYS=7
SENTIMENT_CACHE_DB_PATH=./data/sentiment-cache.db

# Monitoring
PERFORMANCE_METRICS_ENABLED=true
VALIDATION_SAMPLE_SIZE=200
```

### 7.2 Deployment Checklist

- [ ] Set OPENAI_API_KEY environment variable
- [ ] Verify OpenAI API tier and adjust rate limits
- [ ] Initialize cache database (run migrations)
- [ ] Test OpenAI connectivity (health check)
- [ ] Verify token counting accuracy
- [ ] Set up error alerting (e.g., Sentry)
- [ ] Configure logging (structured JSON logs)
- [ ] Set up cache cleanup cron job (daily)
- [ ] Enable performance monitoring
- [ ] Set up weekly validation workflow
- [ ] Document methodology for transparency

### 7.3 Monitoring & Alerts

```typescript
// Alert conditions
const ALERT_THRESHOLDS = {
  errorRate: 0.05,              // Alert if >5% errors
  avgConfidence: 60,            // Alert if avg confidence <60%
  cacheHitRate: 0.40,           // Alert if cache hit rate <40%
  apiResponseTimeMs: 5000,      // Alert if avg response time >5s
  dailyCost: 1.00,              // Alert if daily cost >$1
};

export class AlertManager {
  async checkThresholds(metrics: PerformanceMetrics) {
    const alerts: string[] = [];

    if (metrics.errorRate > ALERT_THRESHOLDS.errorRate) {
      alerts.push(`High error rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
    }

    if (metrics.avgConfidence < ALERT_THRESHOLDS.avgConfidence) {
      alerts.push(`Low average confidence: ${metrics.avgConfidence.toFixed(2)}%`);
    }

    if (metrics.cacheHitRate < ALERT_THRESHOLDS.cacheHitRate) {
      alerts.push(`Low cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(2)}%`);
    }

    if (metrics.totalCost > ALERT_THRESHOLDS.dailyCost) {
      alerts.push(`Daily cost exceeded: $${metrics.totalCost.toFixed(2)}`);
    }

    return alerts;
  }
}
```

### 7.4 Maintenance Tasks

**Daily:**
- Clean up expired cache entries
- Generate performance report
- Check for API errors

**Weekly:**
- Perform validation review (200 samples)
- Calculate accuracy metrics
- Review low-confidence predictions
- Check cost trends

**Monthly:**
- Audit cache size and hit rates
- Review model performance trends
- Consider prompt adjustments
- Update model version if needed

---

## Summary & Recommendations

### Key Design Decisions

1. **GPT-3.5-turbo as Primary Model:**
   - Cost-effective: ~$35 for 90-day backfill, ~$3/month ongoing
   - Sufficient accuracy for 3-category sentiment
   - Fast inference (117 tokens/sec)

2. **7-Day Caching with SQLite:**
   - Lightweight, self-hosted, no external dependencies
   - Expected 60-70% cache hit rate after initial backfill
   - Automatic cleanup and monitoring

3. **Explicit JSON Structure in Prompts:**
   - **CRITICAL:** Always show exact JSON format with examples
   - Prevents Zod validation errors
   - Ensures consistent field names

4. **GPT-4o-mini Fallback for Edge Cases:**
   - Handles sarcasm, mixed sentiment, ambiguity
   - Triggered by low confidence (<70%) + complex sentiment flag
   - Minimal additional cost (~5% of requests)

5. **Batch Processing with Rate Limiting:**
   - Respects OpenAI API tiers (3 RPM for Tier 1)
   - Exponential backoff for 429 errors
   - Queue-based processing for reliability

### Success Criteria

- **>80% Accuracy:** Validated weekly with human-annotated samples
- **Cost Efficiency:** ~$3/month ongoing after backfill
- **Cache Hit Rate:** >60% for daily updates
- **API Reliability:** <5% error rate with retry logic
- **Processing Speed:** ~1000 items/hour on Tier 1 limits

### Next Steps

1. Implement core TypeScript services (OpenAIService, SentimentAnalyzer)
2. Set up cache database and validation workflow
3. Test with small Reddit dataset (100 items)
4. Validate accuracy with manual annotation
5. Run 90-day backfill with cost monitoring
6. Deploy to production with monitoring

### Cost Transparency

**One-Time Backfill (90 days):**
- 87,300 items × 500 input tokens × $0.50/1M = $21.83
- 87,300 items × 100 output tokens × $1.50/1M = $13.10
- **Total: $34.93**

**Ongoing Daily Cost (with 70% cache hit rate):**
- 291 new items × 500 input tokens × $0.50/1M = $0.07
- 291 new items × 100 output tokens × $1.50/1M = $0.04
- **Daily: $0.11 (~$3.30/month)**

**Annual Estimate:** ~$40/year (backfill + 12 months ongoing)

---

## References

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Pricing](https://openai.com/api/pricing/)
- [Structured Outputs Guide](https://platform.openai.com/docs/guides/structured-outputs)
- [tiktoken (Token Counting)](https://github.com/openai/tiktoken)
- [Zod (Schema Validation)](https://zod.dev)

---

**Document Status:** Ready for Implementation
**Last Updated:** 2025-10-02
**Author:** ChatGPT Expert Agent
**Review Status:** Pending Technical Review

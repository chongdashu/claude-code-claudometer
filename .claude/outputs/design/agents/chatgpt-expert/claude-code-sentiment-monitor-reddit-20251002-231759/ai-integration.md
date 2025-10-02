# OpenAI API Integration for Reddit Sentiment Analysis

**Project:** Claude Code Sentiment Monitor (Reddit)
**Created:** 2025-10-02 23:17:59
**Target:** >80% sentiment accuracy, cost-optimized processing with 7-day caching

---

## Table of Contents

1. [OpenAI API Strategy](#1-openai-api-strategy)
2. [Sentiment Analysis Prompt Engineering](#2-sentiment-analysis-prompt-engineering)
3. [Caching Strategy (7-Day)](#3-caching-strategy-7-day)
4. [Cost Optimization](#4-cost-optimization)
5. [Sentiment Scoring Schema](#5-sentiment-scoring-schema)
6. [Error Handling & Retry Logic](#6-error-handling--retry-logic)
7. [Quality Validation](#7-quality-validation)
8. [TypeScript Implementation](#8-typescript-implementation)

---

## 1. OpenAI API Strategy

### Model Selection: GPT-4o-mini (Recommended)

**Rationale:**
- **GPT-4o-mini** is the most cost-effective model for sentiment analysis in 2025
- **Pricing:** $0.15 per 1M input tokens, $0.60 per 1M output tokens (60%+ cheaper than GPT-3.5-turbo)
- **Capabilities:** 128K context window, structured outputs support, 100% JSON schema adherence
- **Performance:** More capable than GPT-3.5-turbo with better accuracy on nuanced sentiment

**Alternative:** GPT-3.5-turbo (Legacy fallback)
- Only use if GPT-4o-mini is unavailable
- Higher cost, lower accuracy
- Being phased out by OpenAI

### API Features to Leverage

1. **Structured Outputs (JSON Schema Mode)**
   - Guarantees 100% schema adherence
   - Use `response_format: { type: "json_schema", json_schema: {...} }`
   - Eliminates parsing errors and validation issues

2. **Token Optimization**
   - Average Reddit post: 100-500 tokens
   - Average comment: 50-200 tokens
   - Batch multiple items when possible (up to 5-10 per request)
   - Target output: ~150 tokens per sentiment analysis

3. **Rate Limits (Tier 1 Free Account)**
   - 500 RPM (requests per minute)
   - 200,000 TPM (tokens per minute)
   - For high-volume processing, monitor and implement queuing

---

## 2. Sentiment Analysis Prompt Engineering

### Critical Principle: Show, Don't Tell

**ALWAYS provide exact JSON structure with examples. NEVER just describe the schema.**

### System Prompt

```typescript
const SYSTEM_PROMPT = `You are a sentiment analysis expert specializing in Reddit discussions about developer tools and AI assistants.

Your task: Analyze Reddit posts and comments about Claude Code (an AI coding assistant by Anthropic) and classify sentiment accurately.

Key considerations:
- Developer community tone (technical, direct, sometimes sarcastic)
- Distinguish constructive criticism from negativity
- Identify genuine praise vs generic positive reactions
- Flag mixed sentiment (e.g., "Love the idea but execution is buggy")

Output: Return ONLY valid JSON matching the exact schema provided. No markdown formatting, no explanations outside the JSON.`;
```

### User Prompt Template (with Explicit JSON Example)

```typescript
const USER_PROMPT_TEMPLATE = `Analyze the sentiment of this Reddit content about Claude Code:

SUBREDDIT: {subreddit}
TYPE: {type} (post or comment)
TITLE: {title}
CONTENT: {content}
{contextInfo}

Return JSON with this EXACT structure:

{
  "sentiment": "positive",
  "scores": {
    "positive": 0.75,
    "neutral": 0.15,
    "negative": 0.10
  },
  "confidence": 0.88,
  "reasoning": "Expresses satisfaction with feature improvements and workflow efficiency. Positive tone with specific examples.",
  "primaryEmotion": "satisfaction",
  "topics": ["feature_request", "workflow", "productivity"]
}

Field requirements:
- sentiment: Must be "positive", "neutral", or "negative" (the dominant sentiment)
- scores: Object with positive/neutral/negative as numbers 0-1 (must sum to ~1.0)
- confidence: Number 0-1 indicating analysis certainty
- reasoning: 1-2 sentence explanation of the classification
- primaryEmotion: One of: satisfaction, frustration, excitement, confusion, disappointment, enthusiasm, concern, appreciation
- topics: Array of 1-5 relevant topic tags from: feature_request, bug_report, comparison, workflow, pricing, performance, documentation, support, integration, general_feedback

Example for NEGATIVE sentiment:
{
  "sentiment": "negative",
  "scores": {
    "positive": 0.05,
    "neutral": 0.20,
    "negative": 0.75
  },
  "confidence": 0.92,
  "reasoning": "Reports critical bugs and expresses frustration with reliability issues affecting production work.",
  "primaryEmotion": "frustration",
  "topics": ["bug_report", "performance", "support"]
}

Example for NEUTRAL sentiment:
{
  "sentiment": "neutral",
  "scores": {
    "positive": 0.30,
    "neutral": 0.55,
    "negative": 0.15
  },
  "confidence": 0.78,
  "reasoning": "Asks factual question about feature availability without expressing strong opinion either way.",
  "primaryEmotion": "confusion",
  "topics": ["feature_request", "documentation"]
}

Now analyze the content above and return ONLY the JSON response.`;
```

### Context Inclusion Strategy

For **comments**, include parent context when available:

```typescript
const contextInfo = parentComment
  ? `PARENT COMMENT: "${truncate(parentComment, 200)}"`
  : '';
```

For **posts**, the title + body provide sufficient context.

### Edge Case Handling

**Sarcasm Detection:**
```
"Oh great, another AI tool that breaks my code. Just what I needed."
→ sentiment: "negative", primaryEmotion: "frustration"
```

**Mixed Sentiment:**
```
"Love the idea and UI is great, but crashes constantly and support is slow."
→ sentiment: "negative" (problems outweigh praise)
   scores: { positive: 0.30, neutral: 0.10, negative: 0.60 }
   reasoning: "Appreciates concept but critical issues dominate experience"
```

**Generic Positivity (low confidence):**
```
"Nice!"
→ sentiment: "positive"
   confidence: 0.45 (flag for potential filtering)
```

---

## 3. Caching Strategy (7-Day)

### Why 7 Days?

- Reddit content is immutable after posting (edits are rare)
- Sentiment won't change for the same text
- Balance between cost savings and storage overhead
- Aligns with PRD's 90-day historical view (process once, cache, reuse)

### Cache Key Generation

```typescript
import crypto from 'crypto';

function generateCacheKey(text: string, modelVersion: string): string {
  // Normalize text to ensure consistent hashing
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' '); // Collapse whitespace

  // Include model version to invalidate cache on model upgrades
  const content = `${normalized}:${modelVersion}`;

  return `sentiment:${crypto.createHash('sha256').update(content).digest('hex')}`;
}

// Example:
// Input: "This is amazing!" + "gpt-4o-mini-2024-07-18"
// Output: "sentiment:a3f5b2c8d1e4f7g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2"
```

### Storage Backend Options

#### Option A: Redis (Recommended for Production)

**Pros:**
- Built-in TTL support
- High performance (sub-millisecond reads)
- Easy to scale horizontally
- Atomic operations

**Cons:**
- Additional infrastructure dependency
- Memory-based (cost increases with dataset size)

```typescript
import Redis from 'ioredis';

export class RedisCache implements CacheLayer {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async get(key: string): Promise<SentimentResult | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: SentimentResult, ttlSeconds: number): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async getStats(): Promise<{ hits: number; misses: number }> {
    const hits = await this.redis.get('cache:hits') || '0';
    const misses = await this.redis.get('cache:misses') || '0';
    return { hits: parseInt(hits), misses: parseInt(misses) };
  }
}
```

#### Option B: Database Cache (PostgreSQL)

**Pros:**
- No additional infrastructure (reuse existing DB)
- Persistent storage
- Easy to query and analyze cache effectiveness

**Cons:**
- Slower than Redis (10-50ms reads)
- Requires cleanup job for expired entries

```sql
CREATE TABLE sentiment_cache (
  cache_key VARCHAR(128) PRIMARY KEY,
  sentiment_data JSONB NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_expires_at (expires_at)
);

-- Cleanup job (run daily)
DELETE FROM sentiment_cache WHERE expires_at < NOW();
```

#### Option C: File-Based Cache (MVP/Development)

**Pros:**
- Zero dependencies
- Simple implementation
- Good for development/testing

**Cons:**
- Not suitable for production (slow, no atomicity)
- Manual cleanup required

```typescript
import fs from 'fs/promises';
import path from 'path';

export class FileCache implements CacheLayer {
  constructor(private cacheDir: string) {}

  private getCachePath(key: string): string {
    return path.join(this.cacheDir, `${key}.json`);
  }

  async get(key: string): Promise<SentimentResult | null> {
    try {
      const data = await fs.readFile(this.getCachePath(key), 'utf-8');
      const cached = JSON.parse(data);

      // Check expiration
      if (Date.now() > cached.expiresAt) {
        await this.delete(key);
        return null;
      }

      return cached.value;
    } catch {
      return null;
    }
  }

  async set(key: string, value: SentimentResult, ttlSeconds: number): Promise<void> {
    const cached = {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    };
    await fs.writeFile(this.getCachePath(key), JSON.stringify(cached));
  }
}
```

### Cache Hit/Miss Handling

```typescript
async analyzeSentiment(text: string): Promise<SentimentResult> {
  const cacheKey = this.generateCacheKey(text, this.modelVersion);

  // Try cache first
  const cached = await this.cache.get(cacheKey);
  if (cached) {
    await this.metrics.incrementCacheHits();
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached;
  }

  // Cache miss - call OpenAI
  await this.metrics.incrementCacheMisses();
  console.log(`[CACHE MISS] ${cacheKey} - Calling OpenAI API`);

  const result = await this.callOpenAI(text);

  // Store in cache (7 days = 604800 seconds)
  await this.cache.set(cacheKey, result, 604800);

  return result;
}
```

### Cost Savings Estimation

**Assumptions:**
- 10,000 Reddit posts/comments per 90-day period
- Average 150 tokens per item
- Cache hit rate: 70% after initial processing (reprocessing, backfills, analytics queries)

**Without Cache:**
- API calls: 10,000
- Input tokens: 1.5M
- Output tokens: 500K
- Cost: (1.5M × $0.15/1M) + (500K × $0.60/1M) = $0.225 + $0.30 = **$0.525**

**With Cache (70% hit rate):**
- API calls: 3,000 (30% misses)
- Input tokens: 450K
- Output tokens: 150K
- Cost: (450K × $0.15/1M) + (150K × $0.60/1M) = $0.0675 + $0.09 = **$0.1575**

**Savings: 70% reduction ($0.3675 saved per 10K items)**

---

## 4. Cost Optimization

### Token Optimization Techniques

#### 1. Text Truncation for Long Posts

Reddit posts can be 10,000+ characters. Truncate intelligently:

```typescript
function truncateForSentiment(text: string, maxTokens: number = 1000): string {
  // Rough estimate: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4;

  if (text.length <= maxChars) {
    return text;
  }

  // Take first 60% and last 40% to capture intro and conclusion
  const firstPart = text.slice(0, maxChars * 0.6);
  const lastPart = text.slice(-(maxChars * 0.4));

  return `${firstPart}\n\n[... content truncated ...]\n\n${lastPart}`;
}
```

#### 2. Batch Processing

Process multiple items in a single API call when they're from the same context:

```typescript
async analyzeBatch(items: RedditItem[]): Promise<SentimentResult[]> {
  // Check cache for all items first
  const uncachedItems = await this.filterUncached(items);

  if (uncachedItems.length === 0) {
    return items.map(item => this.getCached(item.text)); // All cached
  }

  // Process 5 items at a time (balance between efficiency and token limits)
  const batchSize = 5;
  const results: SentimentResult[] = [];

  for (let i = 0; i < uncachedItems.length; i += batchSize) {
    const batch = uncachedItems.slice(i, i + batchSize);
    const batchResults = await this.callOpenAIBatch(batch);
    results.push(...batchResults);

    // Cache each result
    for (let j = 0; j < batch.length; j++) {
      await this.cache.set(
        this.generateCacheKey(batch[j].text, this.modelVersion),
        batchResults[j],
        604800
      );
    }
  }

  return results;
}

private async callOpenAIBatch(items: RedditItem[]): Promise<SentimentResult[]> {
  const batchPrompt = items.map((item, idx) =>
    `--- ITEM ${idx + 1} ---\n${item.text}\n`
  ).join('\n');

  // Adjust schema to return array of results
  // ... (see implementation section)
}
```

**Trade-off:** Batching increases complexity. Only use for bulk backfill operations, not real-time processing.

#### 3. Confidence-Based Filtering

Skip re-analysis for items with high confidence scores:

```typescript
async reanalyzeIfNeeded(item: RedditItem, threshold: number = 0.85): Promise<boolean> {
  const cached = await this.getCached(item.text);

  if (cached && cached.confidence >= threshold) {
    console.log(`Skipping reanalysis - high confidence (${cached.confidence})`);
    return false;
  }

  return true; // Needs (re)analysis
}
```

### Budget Management

```typescript
export class CostTracker {
  private totalInputTokens = 0;
  private totalOutputTokens = 0;

  // GPT-4o-mini pricing (per million tokens)
  private readonly INPUT_COST = 0.15;
  private readonly OUTPUT_COST = 0.60;

  trackUsage(inputTokens: number, outputTokens: number) {
    this.totalInputTokens += inputTokens;
    this.totalOutputTokens += outputTokens;
  }

  getTotalCost(): number {
    const inputCost = (this.totalInputTokens / 1_000_000) * this.INPUT_COST;
    const outputCost = (this.totalOutputTokens / 1_000_000) * this.OUTPUT_COST;
    return inputCost + outputCost;
  }

  getCostPerItem(itemCount: number): number {
    return this.getTotalCost() / itemCount;
  }

  estimateCost(itemCount: number, avgTokensPerItem: number = 150): number {
    // Estimate: 150 input tokens, 50 output tokens per item
    const inputCost = (itemCount * avgTokensPerItem / 1_000_000) * this.INPUT_COST;
    const outputCost = (itemCount * 50 / 1_000_000) * this.OUTPUT_COST;
    return inputCost + outputCost;
  }

  shouldAlert(dailyBudget: number): boolean {
    const dailyCost = this.getTotalCost();
    return dailyCost >= dailyBudget * 0.8; // Alert at 80% of budget
  }
}
```

### Cost Estimates (Per 1000 Items)

| Scenario | Input Tokens | Output Tokens | Cost |
|----------|--------------|---------------|------|
| Short comments (avg 100 tokens) | 100K | 50K | $0.045 |
| Medium posts (avg 300 tokens) | 300K | 50K | $0.075 |
| Long posts (avg 1000 tokens) | 1M | 50K | $0.18 |
| **With 70% cache hit rate** | 300K | 15K | **$0.054** |

**Target for 90-day backfill (10K items): < $1.00**

---

## 5. Sentiment Scoring Schema

### TypeScript Types

```typescript
export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export type PrimaryEmotion =
  | 'satisfaction'
  | 'frustration'
  | 'excitement'
  | 'confusion'
  | 'disappointment'
  | 'enthusiasm'
  | 'concern'
  | 'appreciation';

export type TopicTag =
  | 'feature_request'
  | 'bug_report'
  | 'comparison'
  | 'workflow'
  | 'pricing'
  | 'performance'
  | 'documentation'
  | 'support'
  | 'integration'
  | 'general_feedback';

export interface SentimentScores {
  positive: number;  // 0-1
  neutral: number;   // 0-1
  negative: number;  // 0-1
  // Sum should be ~1.0
}

export interface SentimentResult {
  sentiment: SentimentLabel;
  scores: SentimentScores;
  confidence: number; // 0-1
  reasoning: string;
  primaryEmotion: PrimaryEmotion;
  topics: TopicTag[];
}

export interface RedditItem {
  id: string;
  type: 'post' | 'comment';
  subreddit: string;
  title?: string;
  content: string;
  author: string;
  score: number;
  createdAt: Date;
  parentId?: string;
}

export interface SentimentAnalysisRecord extends SentimentResult {
  itemId: string;
  analyzedAt: Date;
  modelVersion: string;
  cacheHit: boolean;
}
```

### Zod Schema for Validation

```typescript
import { z } from 'zod';

export const SentimentResultSchema = z.object({
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  scores: z.object({
    positive: z.number().min(0).max(1),
    neutral: z.number().min(0).max(1),
    negative: z.number().min(0).max(1),
  }).refine(
    (scores) => {
      const sum = scores.positive + scores.neutral + scores.negative;
      return Math.abs(sum - 1.0) < 0.01; // Allow for floating point errors
    },
    { message: 'Sentiment scores must sum to approximately 1.0' }
  ),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(10).max(500),
  primaryEmotion: z.enum([
    'satisfaction',
    'frustration',
    'excitement',
    'confusion',
    'disappointment',
    'enthusiasm',
    'concern',
    'appreciation',
  ]),
  topics: z.array(z.enum([
    'feature_request',
    'bug_report',
    'comparison',
    'workflow',
    'pricing',
    'performance',
    'documentation',
    'support',
    'integration',
    'general_feedback',
  ])).min(1).max(5),
});

// OpenAI JSON Schema format (for structured outputs)
export const OPENAI_SENTIMENT_SCHEMA = {
  type: 'object',
  properties: {
    sentiment: {
      type: 'string',
      enum: ['positive', 'neutral', 'negative'],
    },
    scores: {
      type: 'object',
      properties: {
        positive: { type: 'number', minimum: 0, maximum: 1 },
        neutral: { type: 'number', minimum: 0, maximum: 1 },
        negative: { type: 'number', minimum: 0, maximum: 1 },
      },
      required: ['positive', 'neutral', 'negative'],
      additionalProperties: false,
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    reasoning: { type: 'string', minLength: 10, maxLength: 500 },
    primaryEmotion: {
      type: 'string',
      enum: [
        'satisfaction',
        'frustration',
        'excitement',
        'confusion',
        'disappointment',
        'enthusiasm',
        'concern',
        'appreciation',
      ],
    },
    topics: {
      type: 'array',
      items: {
        type: 'string',
        enum: [
          'feature_request',
          'bug_report',
          'comparison',
          'workflow',
          'pricing',
          'performance',
          'documentation',
          'support',
          'integration',
          'general_feedback',
        ],
      },
      minItems: 1,
      maxItems: 5,
    },
  },
  required: ['sentiment', 'scores', 'confidence', 'reasoning', 'primaryEmotion', 'topics'],
  additionalProperties: false,
};
```

### Confidence Thresholding

```typescript
export class SentimentFilter {
  // Filter low-confidence results for analytics
  static filterHighConfidence(
    results: SentimentResult[],
    threshold: number = 0.70
  ): SentimentResult[] {
    return results.filter(r => r.confidence >= threshold);
  }

  // Flag ambiguous results for manual review
  static flagAmbiguous(result: SentimentResult): boolean {
    const { scores } = result;
    const sortedScores = [scores.positive, scores.neutral, scores.negative].sort((a, b) => b - a);

    // If top two scores are within 0.15 of each other, it's ambiguous
    return (sortedScores[0] - sortedScores[1]) < 0.15;
  }

  // Adjust displayed sentiment based on confidence
  static getDisplaySentiment(result: SentimentResult): {
    label: SentimentLabel | 'mixed';
    confidence: number;
  } {
    if (result.confidence < 0.60 || this.flagAmbiguous(result)) {
      return { label: 'mixed', confidence: result.confidence };
    }

    return { label: result.sentiment, confidence: result.confidence };
  }
}
```

---

## 6. Error Handling & Retry Logic

### OpenAI API Error Types

```typescript
export enum OpenAIErrorType {
  RATE_LIMIT = 'rate_limit_exceeded',
  INVALID_REQUEST = 'invalid_request_error',
  API_ERROR = 'api_error',
  TIMEOUT = 'timeout',
  NETWORK = 'network_error',
}

export class OpenAIError extends Error {
  constructor(
    public type: OpenAIErrorType,
    public message: string,
    public statusCode?: number,
    public retryAfter?: number // seconds
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}
```

### Exponential Backoff with Jitter

```typescript
export class RetryStrategy {
  constructor(
    private maxRetries: number = 3,
    private baseDelay: number = 1000, // 1 second
    private maxDelay: number = 60000   // 60 seconds
  ) {}

  async executeWithRetry<T>(
    fn: () => Promise<T>,
    errorHandler?: (error: any, attempt: number) => void
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Don't retry on non-retryable errors
        if (!this.isRetryable(error)) {
          throw error;
        }

        if (attempt === this.maxRetries) {
          break; // Exhausted retries
        }

        // Calculate delay with exponential backoff + jitter
        const delay = this.calculateDelay(attempt, error);

        if (errorHandler) {
          errorHandler(error, attempt + 1);
        }

        console.log(`[RETRY] Attempt ${attempt + 1}/${this.maxRetries} - Waiting ${delay}ms`);
        await this.sleep(delay);
      }
    }

    throw new Error(`Max retries (${this.maxRetries}) exceeded: ${lastError.message}`);
  }

  private isRetryable(error: any): boolean {
    // Retry on rate limits, timeouts, and temporary API errors
    if (error instanceof OpenAIError) {
      return [
        OpenAIErrorType.RATE_LIMIT,
        OpenAIErrorType.API_ERROR,
        OpenAIErrorType.TIMEOUT,
        OpenAIErrorType.NETWORK,
      ].includes(error.type);
    }

    // Retry on 5xx errors and 429 (rate limit)
    const statusCode = error.status || error.statusCode;
    return statusCode === 429 || (statusCode >= 500 && statusCode < 600);
  }

  private calculateDelay(attempt: number, error: any): number {
    // If API provides Retry-After header, use it
    if (error instanceof OpenAIError && error.retryAfter) {
      return error.retryAfter * 1000;
    }

    // Exponential backoff: delay = baseDelay * 2^attempt
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt);

    // Add jitter (±25%) to avoid thundering herd
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);

    return Math.min(exponentialDelay + jitter, this.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Rate Limit Handling

```typescript
export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private activeRequests = 0;

  constructor(
    private maxConcurrent: number = 10,
    private requestsPerMinute: number = 500
  ) {}

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    // Wait if we've hit concurrent limit
    while (this.activeRequests >= this.maxConcurrent) {
      await this.sleep(100);
    }

    this.activeRequests++;

    try {
      return await fn();
    } finally {
      this.activeRequests--;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Fallback Strategies

```typescript
export class SentimentAnalyzerWithFallback {
  constructor(
    private primaryAnalyzer: SentimentAnalyzer,
    private fallbackToCache: boolean = true,
    private fallbackToDefault: boolean = true
  ) {}

  async analyze(item: RedditItem): Promise<SentimentResult | null> {
    try {
      return await this.primaryAnalyzer.analyzeSentiment(item.content);
    } catch (error) {
      console.error(`[FALLBACK] Primary analysis failed for ${item.id}:`, error);

      // Fallback 1: Return stale cache if available
      if (this.fallbackToCache) {
        const stale = await this.getStaleCache(item.content);
        if (stale) {
          console.log(`[FALLBACK] Using stale cache for ${item.id}`);
          return stale;
        }
      }

      // Fallback 2: Return neutral default
      if (this.fallbackToDefault) {
        console.log(`[FALLBACK] Using default neutral sentiment for ${item.id}`);
        return this.getDefaultSentiment();
      }

      // No fallback - return null to skip this item
      return null;
    }
  }

  private async getStaleCache(text: string): Promise<SentimentResult | null> {
    // Query cache even if expired
    // Implementation depends on cache backend
    return null;
  }

  private getDefaultSentiment(): SentimentResult {
    return {
      sentiment: 'neutral',
      scores: { positive: 0.33, neutral: 0.34, negative: 0.33 },
      confidence: 0.10, // Very low confidence
      reasoning: 'Default neutral sentiment (analysis failed)',
      primaryEmotion: 'confusion',
      topics: ['general_feedback'],
    };
  }
}
```

### Logging and Monitoring

```typescript
export interface SentimentMetrics {
  totalAnalyses: number;
  cacheHits: number;
  cacheMisses: number;
  errors: { [key: string]: number };
  averageConfidence: number;
  sentimentDistribution: { positive: number; neutral: number; negative: number };
  averageLatency: number;
  totalCost: number;
}

export class MetricsCollector {
  private metrics: SentimentMetrics = {
    totalAnalyses: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: {},
    averageConfidence: 0,
    sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
    averageLatency: 0,
    totalCost: 0,
  };

  recordAnalysis(result: SentimentResult, latency: number, cacheHit: boolean) {
    this.metrics.totalAnalyses++;

    if (cacheHit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    // Update rolling average confidence
    this.metrics.averageConfidence =
      (this.metrics.averageConfidence * (this.metrics.totalAnalyses - 1) + result.confidence)
      / this.metrics.totalAnalyses;

    // Update sentiment distribution
    this.metrics.sentimentDistribution[result.sentiment]++;

    // Update average latency
    this.metrics.averageLatency =
      (this.metrics.averageLatency * (this.metrics.totalAnalyses - 1) + latency)
      / this.metrics.totalAnalyses;
  }

  recordError(errorType: string) {
    this.metrics.errors[errorType] = (this.metrics.errors[errorType] || 0) + 1;
  }

  getMetrics(): SentimentMetrics {
    return { ...this.metrics };
  }

  getCacheHitRate(): number {
    return this.metrics.totalAnalyses > 0
      ? this.metrics.cacheHits / this.metrics.totalAnalyses
      : 0;
  }
}
```

---

## 7. Quality Validation

### Weekly Human Review Process (200 Samples)

```typescript
export class QualityValidator {
  async generateValidationSample(
    items: SentimentAnalysisRecord[],
    sampleSize: number = 200
  ): Promise<ValidationSample[]> {
    // Stratified sampling: ensure representation across sentiment types
    const positive = items.filter(i => i.sentiment === 'positive');
    const neutral = items.filter(i => i.sentiment === 'neutral');
    const negative = items.filter(i => i.sentiment === 'negative');

    const positiveSample = this.randomSample(positive, Math.floor(sampleSize * 0.4));
    const neutralSample = this.randomSample(neutral, Math.floor(sampleSize * 0.3));
    const negativeSample = this.randomSample(negative, Math.floor(sampleSize * 0.3));

    return [...positiveSample, ...neutralSample, ...negativeSample].map(item => ({
      itemId: item.itemId,
      text: '', // Fetch from DB
      predictedSentiment: item.sentiment,
      confidence: item.confidence,
      actualSentiment: null, // To be filled by human reviewer
      reviewedBy: null,
      reviewedAt: null,
    }));
  }

  private randomSample<T>(array: T[], size: number): T[] {
    const shuffled = array.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, size);
  }

  // Calculate accuracy after human review
  calculateAccuracy(validations: ValidationSample[]): ValidationMetrics {
    const reviewed = validations.filter(v => v.actualSentiment !== null);
    const correct = reviewed.filter(v => v.predictedSentiment === v.actualSentiment);

    return {
      accuracy: correct.length / reviewed.length,
      totalReviewed: reviewed.length,
      confusionMatrix: this.buildConfusionMatrix(reviewed),
      confidenceCorrelation: this.analyzeConfidenceCorrelation(reviewed),
    };
  }

  private buildConfusionMatrix(validations: ValidationSample[]): ConfusionMatrix {
    const matrix: ConfusionMatrix = {
      positive: { positive: 0, neutral: 0, negative: 0 },
      neutral: { positive: 0, neutral: 0, negative: 0 },
      negative: { positive: 0, neutral: 0, negative: 0 },
    };

    for (const v of validations) {
      matrix[v.actualSentiment!][v.predictedSentiment]++;
    }

    return matrix;
  }

  private analyzeConfidenceCorrelation(validations: ValidationSample[]): number {
    // Check if higher confidence correlates with higher accuracy
    const correct = validations.filter(v => v.predictedSentiment === v.actualSentiment);
    const incorrect = validations.filter(v => v.predictedSentiment !== v.actualSentiment);

    const avgConfidenceCorrect = correct.reduce((sum, v) => sum + v.confidence, 0) / correct.length;
    const avgConfidenceIncorrect = incorrect.reduce((sum, v) => sum + v.confidence, 0) / incorrect.length;

    // Positive correlation means higher confidence = more accurate
    return avgConfidenceCorrect - avgConfidenceIncorrect;
  }
}

interface ValidationSample {
  itemId: string;
  text: string;
  predictedSentiment: SentimentLabel;
  confidence: number;
  actualSentiment: SentimentLabel | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
}

interface ConfusionMatrix {
  [actual: string]: { [predicted: string]: number };
}

interface ValidationMetrics {
  accuracy: number;
  totalReviewed: number;
  confusionMatrix: ConfusionMatrix;
  confidenceCorrelation: number;
}
```

### Model Tuning Workflow

```typescript
export class ModelTuner {
  // Analyze validation results to identify improvement opportunities
  analyzeErrors(validations: ValidationSample[]): TuningRecommendations {
    const errors = validations.filter(v => v.predictedSentiment !== v.actualSentiment);

    // Group errors by pattern
    const falsePositives = errors.filter(v =>
      v.predictedSentiment === 'positive' && v.actualSentiment !== 'positive'
    );
    const falseNegatives = errors.filter(v =>
      v.predictedSentiment === 'negative' && v.actualSentiment !== 'negative'
    );
    const neutralMisclassified = errors.filter(v =>
      v.predictedSentiment === 'neutral' && v.actualSentiment !== 'neutral'
    );

    return {
      needsMorePositiveExamples: falsePositives.length > errors.length * 0.4,
      needsMoreNegativeExamples: falseNegatives.length > errors.length * 0.4,
      neutralThresholdTooLow: neutralMisclassified.length > errors.length * 0.5,
      errorSamples: {
        falsePositives: falsePositives.slice(0, 10), // Show top 10
        falseNegatives: falseNegatives.slice(0, 10),
        neutralMisclassified: neutralMisclassified.slice(0, 10),
      },
    };
  }

  // Generate few-shot examples from validated data
  generateFewShotExamples(validations: ValidationSample[]): string {
    const positiveExamples = validations
      .filter(v => v.actualSentiment === 'positive')
      .slice(0, 3);
    const neutralExamples = validations
      .filter(v => v.actualSentiment === 'neutral')
      .slice(0, 3);
    const negativeExamples = validations
      .filter(v => v.actualSentiment === 'negative')
      .slice(0, 3);

    // Format as few-shot prompt examples
    // ... implementation
    return '';
  }
}

interface TuningRecommendations {
  needsMorePositiveExamples: boolean;
  needsMoreNegativeExamples: boolean;
  neutralThresholdTooLow: boolean;
  errorSamples: {
    falsePositives: ValidationSample[];
    falseNegatives: ValidationSample[];
    neutralMisclassified: ValidationSample[];
  };
}
```

---

## 8. TypeScript Implementation

### Complete Production-Ready Code

```typescript
// ============================================================================
// FILE: src/lib/sentiment/openai-analyzer.ts
// ============================================================================

import OpenAI from 'openai';
import { z } from 'zod';
import crypto from 'crypto';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export type PrimaryEmotion =
  | 'satisfaction'
  | 'frustration'
  | 'excitement'
  | 'confusion'
  | 'disappointment'
  | 'enthusiasm'
  | 'concern'
  | 'appreciation';

export type TopicTag =
  | 'feature_request'
  | 'bug_report'
  | 'comparison'
  | 'workflow'
  | 'pricing'
  | 'performance'
  | 'documentation'
  | 'support'
  | 'integration'
  | 'general_feedback';

export interface SentimentScores {
  positive: number;
  neutral: number;
  negative: number;
}

export interface SentimentResult {
  sentiment: SentimentLabel;
  scores: SentimentScores;
  confidence: number;
  reasoning: string;
  primaryEmotion: PrimaryEmotion;
  topics: TopicTag[];
}

export interface RedditItem {
  id: string;
  type: 'post' | 'comment';
  subreddit: string;
  title?: string;
  content: string;
  author: string;
  score: number;
  createdAt: Date;
  parentId?: string;
}

// Zod validation schema
export const SentimentResultSchema = z.object({
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  scores: z.object({
    positive: z.number().min(0).max(1),
    neutral: z.number().min(0).max(1),
    negative: z.number().min(0).max(1),
  }),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(10).max(500),
  primaryEmotion: z.enum([
    'satisfaction',
    'frustration',
    'excitement',
    'confusion',
    'disappointment',
    'enthusiasm',
    'concern',
    'appreciation',
  ]),
  topics: z.array(z.enum([
    'feature_request',
    'bug_report',
    'comparison',
    'workflow',
    'pricing',
    'performance',
    'documentation',
    'support',
    'integration',
    'general_feedback',
  ])).min(1).max(5),
});

// OpenAI JSON Schema (for structured outputs)
const OPENAI_SENTIMENT_SCHEMA = {
  type: 'object' as const,
  properties: {
    sentiment: {
      type: 'string' as const,
      enum: ['positive', 'neutral', 'negative'],
    },
    scores: {
      type: 'object' as const,
      properties: {
        positive: { type: 'number' as const, minimum: 0, maximum: 1 },
        neutral: { type: 'number' as const, minimum: 0, maximum: 1 },
        negative: { type: 'number' as const, minimum: 0, maximum: 1 },
      },
      required: ['positive', 'neutral', 'negative'],
      additionalProperties: false,
    },
    confidence: { type: 'number' as const, minimum: 0, maximum: 1 },
    reasoning: { type: 'string' as const, minLength: 10, maxLength: 500 },
    primaryEmotion: {
      type: 'string' as const,
      enum: [
        'satisfaction',
        'frustration',
        'excitement',
        'confusion',
        'disappointment',
        'enthusiasm',
        'concern',
        'appreciation',
      ],
    },
    topics: {
      type: 'array' as const,
      items: {
        type: 'string' as const,
        enum: [
          'feature_request',
          'bug_report',
          'comparison',
          'workflow',
          'pricing',
          'performance',
          'documentation',
          'support',
          'integration',
          'general_feedback',
        ],
      },
      minItems: 1,
      maxItems: 5,
    },
  },
  required: ['sentiment', 'scores', 'confidence', 'reasoning', 'primaryEmotion', 'topics'],
  additionalProperties: false,
};

// ============================================================================
// CACHE INTERFACE
// ============================================================================

export interface CacheLayer {
  get(key: string): Promise<SentimentResult | null>;
  set(key: string, value: SentimentResult, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

// ============================================================================
// REDIS CACHE IMPLEMENTATION
// ============================================================================

import Redis from 'ioredis';

export class RedisCache implements CacheLayer {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async get(key: string): Promise<SentimentResult | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: SentimentResult, ttlSeconds: number): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// ============================================================================
// IN-MEMORY CACHE (FOR TESTING/DEVELOPMENT)
// ============================================================================

export class InMemoryCache implements CacheLayer {
  private cache = new Map<string, { value: SentimentResult; expiresAt: number }>();

  async get(key: string): Promise<SentimentResult | null> {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  async set(key: string, value: SentimentResult, ttlSeconds: number): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000),
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// ============================================================================
// COST TRACKER
// ============================================================================

export class CostTracker {
  private totalInputTokens = 0;
  private totalOutputTokens = 0;

  // GPT-4o-mini pricing (per million tokens)
  private readonly INPUT_COST = 0.15;
  private readonly OUTPUT_COST = 0.60;

  trackUsage(inputTokens: number, outputTokens: number): void {
    this.totalInputTokens += inputTokens;
    this.totalOutputTokens += outputTokens;
  }

  getTotalCost(): number {
    const inputCost = (this.totalInputTokens / 1_000_000) * this.INPUT_COST;
    const outputCost = (this.totalOutputTokens / 1_000_000) * this.OUTPUT_COST;
    return inputCost + outputCost;
  }

  getCostPerItem(itemCount: number): number {
    return itemCount > 0 ? this.getTotalCost() / itemCount : 0;
  }

  getStats() {
    return {
      totalInputTokens: this.totalInputTokens,
      totalOutputTokens: this.totalOutputTokens,
      totalCost: this.getTotalCost(),
      avgInputTokensPerRequest: this.totalInputTokens,
      avgOutputTokensPerRequest: this.totalOutputTokens,
    };
  }
}

// ============================================================================
// RETRY STRATEGY
// ============================================================================

export class RetryStrategy {
  constructor(
    private maxRetries: number = 3,
    private baseDelay: number = 1000,
    private maxDelay: number = 60000
  ) {}

  async executeWithRetry<T>(
    fn: () => Promise<T>,
    errorHandler?: (error: any, attempt: number) => void
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        if (!this.isRetryable(error) || attempt === this.maxRetries) {
          throw error;
        }

        const delay = this.calculateDelay(attempt);

        if (errorHandler) {
          errorHandler(error, attempt + 1);
        }

        console.log(`[RETRY] Attempt ${attempt + 1}/${this.maxRetries} - Waiting ${delay}ms`);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private isRetryable(error: any): boolean {
    const statusCode = error.status || error.statusCode || 0;
    return statusCode === 429 || (statusCode >= 500 && statusCode < 600);
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt);
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
    return Math.min(exponentialDelay + jitter, this.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// MAIN SENTIMENT ANALYZER
// ============================================================================

export interface SentimentAnalyzerConfig {
  apiKey: string;
  model?: string;
  cache?: CacheLayer;
  maxRetries?: number;
  temperature?: number;
  cacheTTL?: number; // seconds
}

export class OpenAISentimentAnalyzer {
  private openai: OpenAI;
  private cache: CacheLayer;
  private costTracker: CostTracker;
  private retryStrategy: RetryStrategy;
  private model: string;
  private temperature: number;
  private cacheTTL: number;
  private readonly MODEL_VERSION = 'gpt-4o-mini-2024-07-18';

  // Prompts
  private readonly SYSTEM_PROMPT = `You are a sentiment analysis expert specializing in Reddit discussions about developer tools and AI assistants.

Your task: Analyze Reddit posts and comments about Claude Code (an AI coding assistant by Anthropic) and classify sentiment accurately.

Key considerations:
- Developer community tone (technical, direct, sometimes sarcastic)
- Distinguish constructive criticism from negativity
- Identify genuine praise vs generic positive reactions
- Flag mixed sentiment (e.g., "Love the idea but execution is buggy")

Output: Return ONLY valid JSON matching the exact schema provided. No markdown formatting, no explanations outside the JSON.`;

  private readonly USER_PROMPT_TEMPLATE = `Analyze the sentiment of this Reddit content about Claude Code:

SUBREDDIT: {{subreddit}}
TYPE: {{type}} (post or comment)
{{title}}CONTENT: {{content}}
{{context}}

Return JSON with this EXACT structure:

{
  "sentiment": "positive",
  "scores": {
    "positive": 0.75,
    "neutral": 0.15,
    "negative": 0.10
  },
  "confidence": 0.88,
  "reasoning": "Expresses satisfaction with feature improvements and workflow efficiency. Positive tone with specific examples.",
  "primaryEmotion": "satisfaction",
  "topics": ["feature_request", "workflow", "productivity"]
}

Field requirements:
- sentiment: Must be "positive", "neutral", or "negative" (the dominant sentiment)
- scores: Object with positive/neutral/negative as numbers 0-1 (must sum to ~1.0)
- confidence: Number 0-1 indicating analysis certainty
- reasoning: 1-2 sentence explanation of the classification
- primaryEmotion: One of: satisfaction, frustration, excitement, confusion, disappointment, enthusiasm, concern, appreciation
- topics: Array of 1-5 relevant topic tags from: feature_request, bug_report, comparison, workflow, pricing, performance, documentation, support, integration, general_feedback

Example for NEGATIVE sentiment:
{
  "sentiment": "negative",
  "scores": {
    "positive": 0.05,
    "neutral": 0.20,
    "negative": 0.75
  },
  "confidence": 0.92,
  "reasoning": "Reports critical bugs and expresses frustration with reliability issues affecting production work.",
  "primaryEmotion": "frustration",
  "topics": ["bug_report", "performance", "support"]
}

Example for NEUTRAL sentiment:
{
  "sentiment": "neutral",
  "scores": {
    "positive": 0.30,
    "neutral": 0.55,
    "negative": 0.15
  },
  "confidence": 0.78,
  "reasoning": "Asks factual question about feature availability without expressing strong opinion either way.",
  "primaryEmotion": "confusion",
  "topics": ["feature_request", "documentation"]
}

Now analyze the content above and return ONLY the JSON response.`;

  constructor(config: SentimentAnalyzerConfig) {
    this.openai = new OpenAI({ apiKey: config.apiKey });
    this.cache = config.cache || new InMemoryCache();
    this.costTracker = new CostTracker();
    this.retryStrategy = new RetryStrategy(config.maxRetries || 3);
    this.model = config.model || 'gpt-4o-mini';
    this.temperature = config.temperature || 0.3;
    this.cacheTTL = config.cacheTTL || 604800; // 7 days
  }

  /**
   * Analyze sentiment for a single Reddit item
   */
  async analyzeSentiment(item: RedditItem): Promise<SentimentResult> {
    const text = this.formatItemText(item);
    const cacheKey = this.generateCacheKey(text);

    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      console.log(`[CACHE HIT] ${item.id}`);
      return cached;
    }

    // Cache miss - call OpenAI
    console.log(`[CACHE MISS] ${item.id} - Calling OpenAI API`);

    const result = await this.retryStrategy.executeWithRetry(
      () => this.callOpenAI(item),
      (error, attempt) => {
        console.error(`[ERROR] Attempt ${attempt} failed for ${item.id}:`, error.message);
      }
    );

    // Validate result
    const validated = SentimentResultSchema.parse(result);

    // Store in cache
    await this.cache.set(cacheKey, validated, this.cacheTTL);

    return validated;
  }

  /**
   * Batch analyze multiple items (processes sequentially with caching)
   */
  async analyzeBatch(items: RedditItem[]): Promise<SentimentResult[]> {
    const results: SentimentResult[] = [];

    for (const item of items) {
      try {
        const result = await this.analyzeSentiment(item);
        results.push(result);
      } catch (error: any) {
        console.error(`[ERROR] Failed to analyze ${item.id}:`, error.message);
        // Return neutral default for failed items
        results.push(this.getDefaultSentiment());
      }
    }

    return results;
  }

  /**
   * Call OpenAI API with structured output
   */
  private async callOpenAI(item: RedditItem): Promise<SentimentResult> {
    const userPrompt = this.buildUserPrompt(item);

    const startTime = Date.now();

    const response = await this.openai.chat.completions.create({
      model: this.model,
      temperature: this.temperature,
      messages: [
        { role: 'system', content: this.SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'sentiment_analysis',
          strict: true,
          schema: OPENAI_SENTIMENT_SCHEMA,
        },
      },
    });

    const latency = Date.now() - startTime;

    // Track token usage
    const usage = response.usage;
    if (usage) {
      this.costTracker.trackUsage(usage.prompt_tokens, usage.completion_tokens);
      console.log(`[TOKENS] Input: ${usage.prompt_tokens}, Output: ${usage.completion_tokens}, Cost: $${this.costTracker.getTotalCost().toFixed(4)}`);
    }

    // Parse JSON response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('[ERROR] Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }
  }

  /**
   * Build user prompt from Reddit item
   */
  private buildUserPrompt(item: RedditItem): string {
    const titleLine = item.title ? `TITLE: ${item.title}\n` : '';
    const contextLine = item.type === 'comment' && item.parentId
      ? `PARENT CONTEXT: [Comment replying to another discussion]\n`
      : '';

    return this.USER_PROMPT_TEMPLATE
      .replace('{{subreddit}}', item.subreddit)
      .replace('{{type}}', item.type)
      .replace('{{title}}', titleLine)
      .replace('{{content}}', this.truncateText(item.content, 2000))
      .replace('{{context}}', contextLine);
  }

  /**
   * Format item for cache key generation
   */
  private formatItemText(item: RedditItem): string {
    return `${item.type}:${item.subreddit}:${item.title || ''}:${item.content}`;
  }

  /**
   * Generate cache key from text
   */
  private generateCacheKey(text: string): string {
    const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
    const content = `${normalized}:${this.MODEL_VERSION}`;
    return `sentiment:${crypto.createHash('sha256').update(content).digest('hex')}`;
  }

  /**
   * Truncate long text intelligently
   */
  private truncateText(text: string, maxChars: number): string {
    if (text.length <= maxChars) {
      return text;
    }

    // Take first 60% and last 40%
    const firstPart = text.slice(0, maxChars * 0.6);
    const lastPart = text.slice(-(maxChars * 0.4));

    return `${firstPart}\n\n[... content truncated ...]\n\n${lastPart}`;
  }

  /**
   * Default neutral sentiment for errors
   */
  private getDefaultSentiment(): SentimentResult {
    return {
      sentiment: 'neutral',
      scores: { positive: 0.33, neutral: 0.34, negative: 0.33 },
      confidence: 0.10,
      reasoning: 'Default neutral sentiment (analysis failed)',
      primaryEmotion: 'confusion',
      topics: ['general_feedback'],
    };
  }

  /**
   * Get cost statistics
   */
  getCostStats() {
    return this.costTracker.getStats();
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

export async function exampleUsage() {
  // Initialize with Redis cache (production)
  const cache = new RedisCache(process.env.REDIS_URL || 'redis://localhost:6379');

  // Or use in-memory cache (development)
  // const cache = new InMemoryCache();

  const analyzer = new OpenAISentimentAnalyzer({
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o-mini',
    cache,
    maxRetries: 3,
    temperature: 0.3,
    cacheTTL: 604800, // 7 days
  });

  // Example Reddit post
  const post: RedditItem = {
    id: 'abc123',
    type: 'post',
    subreddit: 'r/ClaudeAI',
    title: 'Claude Code has been amazing for my workflow',
    content: 'I\'ve been using Claude Code for the past week and it\'s significantly improved my productivity. The code suggestions are accurate and the debugging help is fantastic. Highly recommend!',
    author: 'user123',
    score: 45,
    createdAt: new Date(),
  };

  // Analyze single item
  const result = await analyzer.analyzeSentiment(post);
  console.log('Sentiment:', result.sentiment);
  console.log('Confidence:', result.confidence);
  console.log('Topics:', result.topics);

  // Analyze batch
  const posts: RedditItem[] = [post, /* ... more items */];
  const results = await analyzer.analyzeBatch(posts);
  console.log(`Analyzed ${results.length} items`);

  // Get cost statistics
  const stats = analyzer.getCostStats();
  console.log('Total cost:', stats.totalCost);
  console.log('Total input tokens:', stats.totalInputTokens);
  console.log('Total output tokens:', stats.totalOutputTokens);
}
```

### Database Schema for Storing Results

```sql
-- Sentiment analysis results table
CREATE TABLE sentiment_analyses (
  id SERIAL PRIMARY KEY,
  reddit_item_id VARCHAR(50) NOT NULL UNIQUE,
  reddit_type VARCHAR(10) NOT NULL, -- 'post' or 'comment'
  subreddit VARCHAR(50) NOT NULL,

  sentiment VARCHAR(20) NOT NULL, -- 'positive', 'neutral', 'negative'
  score_positive DECIMAL(4,3) NOT NULL,
  score_neutral DECIMAL(4,3) NOT NULL,
  score_negative DECIMAL(4,3) NOT NULL,
  confidence DECIMAL(4,3) NOT NULL,
  reasoning TEXT,
  primary_emotion VARCHAR(50),
  topics TEXT[], -- Array of topic tags

  model_version VARCHAR(50) NOT NULL,
  analyzed_at TIMESTAMP DEFAULT NOW(),
  cache_hit BOOLEAN DEFAULT FALSE,

  INDEX idx_subreddit (subreddit),
  INDEX idx_sentiment (sentiment),
  INDEX idx_analyzed_at (analyzed_at),
  INDEX idx_confidence (confidence)
);

-- Daily aggregates (for dashboard)
CREATE TABLE daily_sentiment_aggregates (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  subreddit VARCHAR(50) NOT NULL,

  total_items INTEGER NOT NULL,
  positive_count INTEGER NOT NULL,
  neutral_count INTEGER NOT NULL,
  negative_count INTEGER NOT NULL,

  avg_score_positive DECIMAL(4,3),
  avg_score_neutral DECIMAL(4,3),
  avg_score_negative DECIMAL(4,3),
  avg_confidence DECIMAL(4,3),

  top_topics TEXT[],

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(date, subreddit),
  INDEX idx_date (date),
  INDEX idx_subreddit (subreddit)
);

-- Quality validation samples
CREATE TABLE validation_samples (
  id SERIAL PRIMARY KEY,
  reddit_item_id VARCHAR(50) NOT NULL,
  predicted_sentiment VARCHAR(20) NOT NULL,
  actual_sentiment VARCHAR(20),
  confidence DECIMAL(4,3),

  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMP,
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_reviewed (reviewed_at)
);
```

---

## Summary & Next Steps

### Implementation Checklist

- [ ] Install dependencies: `npm install openai ioredis zod`
- [ ] Set up environment variables: `OPENAI_API_KEY`, `REDIS_URL`
- [ ] Implement `OpenAISentimentAnalyzer` class from above
- [ ] Create database tables for storing results
- [ ] Set up Redis cache (or use in-memory for development)
- [ ] Integrate with Reddit data ingestion pipeline
- [ ] Implement daily aggregation job
- [ ] Set up weekly validation sample generation
- [ ] Create dashboard to display sentiment trends
- [ ] Monitor cost and accuracy metrics

### Expected Performance

| Metric | Target | Notes |
|--------|--------|-------|
| Accuracy | >80% | Based on weekly validation |
| Cache hit rate | 70%+ | After initial backfill |
| Cost per 1K items | <$0.10 | With 70% cache hit rate |
| Latency per item | <2s | Including cache lookup |
| API error rate | <1% | With retry logic |

### Cost Projection (90-Day Operation)

- Initial backfill (10K items): ~$0.50 (no cache)
- Daily processing (100 new items/day): ~$0.30/month (with cache)
- Reprocessing/analytics queries: ~$0.20/month (high cache hit rate)
- **Total monthly cost: ~$0.50/month**

### Monitoring Dashboard

Track these metrics:
- Total API calls and cost
- Cache hit/miss rate
- Average confidence score
- Sentiment distribution (pos/neu/neg)
- Error rate by error type
- Average latency
- Top failing items (for prompt tuning)

---

## Conclusion

This integration provides a production-ready, cost-optimized sentiment analysis system for Reddit discussions about Claude Code. Key features:

1. **GPT-4o-mini** for best cost/performance ratio ($0.15/$0.60 per 1M tokens)
2. **7-day caching** for 70%+ cost savings on repeat analyses
3. **Structured outputs** with JSON Schema for 100% reliability
4. **Comprehensive error handling** with exponential backoff
5. **Quality validation** framework for >80% accuracy
6. **Complete TypeScript implementation** ready to deploy

The system is designed to process 10,000+ items for under $1.00, with high accuracy and robust error handling suitable for production use.


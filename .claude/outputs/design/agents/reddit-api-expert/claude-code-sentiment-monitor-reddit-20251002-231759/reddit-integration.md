# Reddit API Integration Strategy
**Project:** Claude Code Sentiment Monitor (Reddit)
**Date:** 2025-10-02
**Target Subreddits:** r/ClaudeAI, r/ClaudeCode, r/Anthropic
**Data Window:** Last 90 days rolling
**Polling Frequency:** Every 30 minutes + initial backfill

---

## 1. Reddit API Strategy

### 1.1 OAuth 2.0 Authentication Flow

Reddit uses OAuth 2.0 with the **Application Only** flow (script-type apps) for server-side applications:

**Flow:**
1. Register a "script" app at https://www.reddit.com/prefs/apps
2. Obtain `client_id` and `client_secret`
3. Use password grant or client credentials grant to get access token
4. Include token in `Authorization: Bearer <token>` header
5. Refresh token before expiry (typically 1 hour)

**Best Practices:**
- Store credentials in environment variables (never commit to repo)
- Implement automatic token refresh before expiry
- Use a dedicated Reddit account for the bot with clear identification
- Set a descriptive User-Agent: `<platform>:<app_id>:<version> (by /u/<username>)`

### 1.2 API Endpoint Selection

**Primary Endpoints:**

1. **Get Subreddit Posts (New/Hot):**
   - `GET /r/{subreddit}/new.json?limit=100&after={after}`
   - Returns newest posts, paginated with `after` cursor
   - Use for initial backfill and ongoing polling

2. **Get Post Comments:**
   - `GET /r/{subreddit}/comments/{article_id}.json`
   - Returns full comment tree for a post
   - Extract only top-level comments (depth=0)

3. **Get Subreddit Posts by Time (Experimental):**
   - For backfill, iterate through `/new` with pagination
   - Reddit API doesn't provide time-based queries directly
   - Alternative: Use Pushshift API for historical data (if available)

**Endpoint Limitations:**
- `/new` endpoint returns max 1000 posts via pagination (10 pages × 100 items)
- Historical data beyond ~1000 most recent posts requires workarounds
- Deleted/removed content may not be accessible via API

### 1.3 Rate Limiting and Quota Management

**Reddit API Limits (OAuth Apps):**
- **60 requests per minute** per OAuth token
- Burst allowance: can make requests faster if under limit
- Rate limit headers: `X-Ratelimit-Remaining`, `X-Ratelimit-Reset`

**Management Strategy:**
- Track requests per minute using sliding window counter
- Implement token bucket algorithm for smooth rate limiting
- Parse rate limit headers from responses
- Exponential backoff when approaching limits
- Queue requests if rate limit exhausted

**Daily Quota Planning:**
- 60 req/min × 60 min = 3,600 requests/hour
- 3 subreddits × 2 polls/hour = 6 polls/hour
- Budget: ~10 requests per poll (posts + comments) = 60 req/hour
- Leaves ample headroom for backfill and error retries

### 1.4 Request Throttling Strategy

**Implementation:**
1. **Token Bucket Rate Limiter:**
   - Bucket capacity: 60 tokens
   - Refill rate: 60 tokens/minute (1 token/second)
   - Consume 1 token per request
   - Block requests when bucket empty

2. **Request Queue:**
   - Queue requests when rate limit approached
   - Process queue with proper delays
   - Priority: new content polls > backfill > retries

3. **Dynamic Throttling:**
   - Monitor `X-Ratelimit-Remaining` header
   - If remaining < 10, slow down requests
   - If remaining = 0, wait until `X-Ratelimit-Reset` time

### 1.5 Error Handling and Retry Logic

**HTTP Status Codes:**
- `200 OK`: Success
- `401 Unauthorized`: Token expired, re-authenticate
- `403 Forbidden`: Banned or suspended subreddit/user
- `429 Too Many Requests`: Rate limit exceeded, back off
- `500/502/503`: Reddit server error, retry with backoff
- `404 Not Found`: Post/comment deleted or doesn't exist

**Retry Strategy:**
- **Exponential Backoff:** 1s, 2s, 4s, 8s, 16s (max 5 retries)
- **Jitter:** Add random delay (0-1s) to avoid thundering herd
- **Circuit Breaker:** After 10 consecutive failures, pause for 5 minutes
- **Graceful Degradation:** If API unavailable, serve cached data

**Error Logging:**
- Log all API errors with context (endpoint, params, status code)
- Track error rates and alert if >5% of requests fail
- Store failed request metadata for manual review

---

## 2. Data Collection Approach

### 2.1 Initial Backfill (90-Day Historical Data)

**Challenge:** Reddit API limits pagination to ~1000 most recent posts per subreddit.

**Strategy:**

1. **Primary Method (Reddit API):**
   - Fetch `/new.json` with pagination (`after` cursor)
   - Continue until reaching posts older than 90 days or hitting 1000-post limit
   - For high-volume subreddits, may only get 7-30 days of history

2. **Fallback Method (Pushshift/PRAW):**
   - Use Pushshift API (if available): `https://api.pushshift.io/reddit/search/submission/`
   - Query with `subreddit`, `after` (Unix timestamp 90 days ago), `before` (now)
   - Note: Pushshift has been unreliable; verify availability before relying on it

3. **Hybrid Approach:**
   - Use Reddit API for last 30 days (most reliable)
   - Accept limited historical data for MVP
   - Backfill older data opportunistically if Pushshift available

**Backfill Process:**
```
For each subreddit:
  1. Fetch /new.json with limit=100
  2. For each post:
     - If post.created_utc < 90 days ago, STOP
     - Store post data
     - Fetch post comments (top-level only)
     - Store comments
  3. Use 'after' cursor to get next page
  4. Repeat until no more pages or 90-day threshold reached
  5. Rate limit between requests (1 req/second)
```

**Time Estimate:**
- 3 subreddits × 1000 posts = 3,000 posts
- 3,000 posts × 1.5 requests (post + comments) = 4,500 requests
- At 60 req/min = 75 minutes for full backfill
- Run backfill once during initial setup

### 2.2 Ongoing Polling (Every 30 Minutes)

**Incremental Update Strategy:**

1. **Track Last Poll Time:**
   - Store `last_poll_timestamp` for each subreddit
   - Use to filter new content since last poll

2. **Fetch New Posts:**
   - Query `/new.json?limit=100`
   - Filter posts where `created_utc > last_poll_timestamp`
   - Typically expect 0-50 new posts per subreddit per 30 min

3. **Fetch New Comments:**
   - For each post from last 24 hours, re-fetch comments
   - Check for new top-level comments since last poll
   - Use comment `created_utc` to identify new items

4. **Deduplication:**
   - Use post/comment `id` (or `name` like "t3_abc123") as primary key
   - Skip items already in database
   - Update existing items if `edited` timestamp changed

**Polling Process:**
```
Every 30 minutes:
  For each subreddit:
    1. Fetch /new.json (limit=100)
    2. Filter posts created after last_poll_timestamp
    3. For each new post:
       - Store post data
       - Fetch and store top-level comments
    4. For recent posts (last 24h):
       - Re-fetch comments
       - Store any new comments not in DB
    5. Update last_poll_timestamp to now
  Total requests: ~3 subreddits × 5 requests = 15 req/poll
```

### 2.3 Data Points to Collect

**For Posts:**
```typescript
interface RedditPost {
  id: string;                    // Unique post ID (e.g., "abc123")
  name: string;                  // Full ID with prefix (e.g., "t3_abc123")
  subreddit: string;             // e.g., "ClaudeAI"
  author: string;                // Username (may be "[deleted]")
  title: string;                 // Post title
  selftext: string;              // Post body (for text posts)
  url: string;                   // Link URL (for link posts)
  permalink: string;             // Reddit permalink
  created_utc: number;           // Unix timestamp
  score: number;                 // Upvotes - downvotes
  num_comments: number;          // Comment count
  link_flair_text: string | null; // Post flair
  is_self: boolean;              // True if text post
  removed_by_category: string | null; // Removal reason if deleted
  author_flair_text: string | null;
  edited: boolean | number;      // False or edit timestamp
}
```

**For Comments:**
```typescript
interface RedditComment {
  id: string;                    // Unique comment ID
  name: string;                  // Full ID (e.g., "t1_xyz789")
  post_id: string;               // Parent post ID
  subreddit: string;
  author: string;
  body: string;                  // Comment text
  permalink: string;             // Direct link to comment
  created_utc: number;
  score: number;
  edited: boolean | number;
  depth: number;                 // 0 for top-level (only collect depth=0)
  parent_id: string;             // Parent comment/post ID
  removed_by_category: string | null;
  is_submitter: boolean;         // True if comment by OP
}
```

**Metadata Tracking:**
```typescript
interface PollMetadata {
  subreddit: string;
  last_poll_timestamp: number;   // Unix timestamp
  last_successful_poll: number;
  total_posts_collected: number;
  total_comments_collected: number;
  errors_count: number;
  last_error: string | null;
}
```

---

## 3. Quality Filtering

### 3.1 Language Detection (English Only)

**Method 1: Fast Heuristic (Recommended):**
- Use lightweight library like `franc-min` (0.5KB)
- Check first 200 characters of text
- Accept if confidence > 0.7 for English

**Method 2: Unicode Range Check:**
- Reject if >30% characters outside ASCII/Latin-1 range
- Fast but less accurate

**Implementation:**
```typescript
import { franc } from 'franc-min';

function isEnglish(text: string): boolean {
  if (!text || text.length < 10) return false;
  const sample = text.slice(0, 200);
  const lang = franc(sample);
  return lang === 'eng' || lang === 'und'; // 'und' = undefined (short text)
}
```

### 3.2 Bot/Spam Detection Patterns

**Heuristics:**

1. **Low Karma Threshold:**
   - Flag users with account karma < 50 (fetch from `/user/{username}/about.json`)
   - Weight: reduce sentiment weight by 50%

2. **High Posting Frequency:**
   - Fetch user's recent posts: `/user/{username}/submitted.json`
   - If >20 posts in last 24 hours, flag as potential bot
   - Cache user flags for 7 days

3. **Link Ratio Detection:**
   - Calculate: `num_links / total_words`
   - If >0.3 (30% of content is links), flag as spam
   - Exception: legitimate resource sharing

4. **Template/Pattern Matching:**
   - Check for repetitive phrases: "click here", "check out my", "join our Discord"
   - Use regex patterns for common spam templates
   - Flag if >3 spam patterns found

5. **Suspicious Username Patterns:**
   - Generated usernames: `[A-Z][a-z]+_[A-Z][a-z]+\d+` (e.g., "Happy_Dog123")
   - Flag for manual review, don't auto-exclude

**Scoring System:**
```typescript
interface QualityScore {
  is_bot: boolean;           // Hard exclude if true
  is_spam: boolean;          // Hard exclude if true
  is_low_quality: boolean;   // Soft exclude (low confidence)
  confidence_weight: number; // 0.0-1.0, multiply by sentiment confidence
  flags: string[];           // Reasons for flagging
}

function calculateQualityScore(item: RedditPost | RedditComment, userInfo: UserInfo): QualityScore {
  const flags: string[] = [];
  let weight = 1.0;

  // Low karma
  if (userInfo.comment_karma + userInfo.link_karma < 50) {
    flags.push('low_karma');
    weight *= 0.5;
  }

  // High post frequency
  if (userInfo.posts_last_24h > 20) {
    flags.push('high_frequency');
    weight *= 0.3;
  }

  // Link spam
  const linkRatio = countLinks(item.text) / countWords(item.text);
  if (linkRatio > 0.3) {
    flags.push('link_spam');
    weight *= 0.2;
  }

  // Template matching
  const spamPatterns = [
    /click here/i,
    /check out my/i,
    /join our discord/i,
    /dm me for/i,
    /limited time offer/i
  ];
  const spamMatches = spamPatterns.filter(p => p.test(item.text)).length;
  if (spamMatches >= 3) {
    return { is_bot: false, is_spam: true, is_low_quality: false, confidence_weight: 0, flags: ['spam_template'] };
  }

  return {
    is_bot: userInfo.posts_last_24h > 50, // Hard bot threshold
    is_spam: linkRatio > 0.5,
    is_low_quality: weight < 0.5,
    confidence_weight: weight,
    flags
  };
}
```

### 3.3 Duplicate Content Detection

**Near-Duplicate Detection:**

1. **Exact Duplicates:**
   - Hash normalized text (lowercase, remove punctuation/whitespace)
   - Store hashes in Set, skip if seen before

2. **Fuzzy Duplicates:**
   - Use MinHash/LSH (Locality-Sensitive Hashing) for similarity
   - Library: `minhash` or `simhash-js`
   - Threshold: >85% similarity = duplicate

3. **Cross-Post Detection:**
   - Reddit provides `crosspost_parent` field
   - Mark as duplicate if cross-posted from non-target subreddit

**Implementation:**
```typescript
import crypto from 'crypto';

function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function textHash(text: string): string {
  const normalized = normalizeText(text);
  return crypto.createHash('md5').update(normalized).digest('hex');
}

class DuplicateDetector {
  private seenHashes = new Set<string>();

  isDuplicate(text: string): boolean {
    const hash = textHash(text);
    if (this.seenHashes.has(hash)) {
      return true;
    }
    this.seenHashes.add(hash);
    return false;
  }

  // Fuzzy matching using Jaccard similarity (simple approach)
  isFuzzyDuplicate(text1: string, text2: string, threshold = 0.85): boolean {
    const words1 = new Set(normalizeText(text1).split(' '));
    const words2 = new Set(normalizeText(text2).split(' '));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    const similarity = intersection.size / union.size;
    return similarity >= threshold;
  }
}
```

### 3.4 Removed/Deleted Content Handling

**Detection:**
- `author === "[deleted]"` and `body === "[removed]"`: Content removed by mods
- `author === "[deleted]"` and `body === "[deleted]"`: User deleted their account
- `removed_by_category` field provides removal reason

**Handling Strategy:**
- **Exclude from sentiment analysis** (no meaningful text)
- **Include in volume metrics** (shows moderation activity)
- **Log removal patterns** for transparency reporting
- **Mark as "removed" in database** for audit trail

```typescript
function isRemovedOrDeleted(item: RedditPost | RedditComment): boolean {
  return (
    item.author === '[deleted]' ||
    item.removed_by_category !== null ||
    (item.selftext || item.body) === '[removed]' ||
    (item.selftext || item.body) === '[deleted]'
  );
}
```

---

## 4. Caching Strategy

### 4.1 Cache Raw Reddit Responses

**What to Cache:**
1. **Subreddit post listings** (`/new.json`)
2. **Post comment trees** (`/comments/{id}.json`)
3. **User info** (`/user/{username}/about.json`)

**Why Cache:**
- Reduce redundant API calls during development/testing
- Replay data for debugging sentiment analysis
- Survive API outages by serving stale data
- Speed up repeated queries during backfill

### 4.2 TTL for Cached Data

**Cache TTL by Data Type:**

| Data Type | TTL | Reasoning |
|-----------|-----|-----------|
| Post listings (`/new`) | 15 minutes | Rapidly changing, poll every 30 min |
| Comment trees | 6 hours | Comments stabilize after a few hours |
| User info | 7 days | Karma changes slowly |
| Historical posts (>7 days old) | Infinite | Immutable historical data |

**Implementation:**
```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class Cache<T> {
  private store = new Map<string, CacheEntry<T>>();

  set(key: string, data: T, ttl: number): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}
```

### 4.3 Cache Invalidation

**When to Invalidate:**
1. **Manual Refresh:** User triggers refresh on dashboard
2. **Post Edited:** If `edited` timestamp changes, invalidate comment cache
3. **Error Recovery:** After API outage recovery, invalidate all caches
4. **Schema Changes:** When upgrading cache format version

**Invalidation Strategy:**
```typescript
class CacheManager {
  private postCache: Cache<RedditPost[]>;
  private commentCache: Cache<RedditComment[]>;

  invalidatePostCache(subreddit: string): void {
    this.postCache.delete(`posts:${subreddit}`);
  }

  invalidateCommentCache(postId: string): void {
    this.commentCache.delete(`comments:${postId}`);
  }

  invalidateAll(): void {
    this.postCache.clear();
    this.commentCache.clear();
  }

  // Periodic cleanup of expired entries
  cleanupExpired(): void {
    // Trigger every hour
    for (const [key, entry] of this.postCache.entries()) {
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.postCache.delete(key);
      }
    }
  }
}
```

### 4.4 Storage Format

**Option 1: File-Based Cache (Recommended for MVP):**
```
.cache/
  reddit/
    posts/
      ClaudeAI_1696248000.json
      ClaudeCode_1696248000.json
    comments/
      abc123.json
      def456.json
    users/
      username_hash.json
```

**Format:**
```json
{
  "cached_at": 1696248000,
  "ttl": 900000,
  "data": { ... }
}
```

**Option 2: Redis (For Production Scale):**
- Key pattern: `reddit:posts:{subreddit}:{timestamp}`
- Value: JSON string of response
- Use Redis TTL for automatic expiration
- Benefit: shared cache across multiple instances

**Option 3: SQLite (Hybrid):**
```sql
CREATE TABLE reddit_cache (
  cache_key TEXT PRIMARY KEY,
  data TEXT NOT NULL, -- JSON blob
  cached_at INTEGER NOT NULL,
  ttl INTEGER NOT NULL,
  expires_at INTEGER GENERATED ALWAYS AS (cached_at + ttl)
);

CREATE INDEX idx_expires_at ON reddit_cache(expires_at);
```

**Recommendation:** Start with file-based cache for simplicity, migrate to Redis if scaling needed.

---

## 5. Data Pipeline Architecture

### 5.1 Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Reddit API (Source)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. RAW INGESTION (reddit-client.ts)                            │
│  - OAuth authentication                                          │
│  - Rate limiting & throttling                                    │
│  - Fetch posts & comments                                        │
│  - Cache responses                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. NORMALIZATION (normalizer.ts)                               │
│  - Extract relevant fields                                       │
│  - Convert timestamps                                            │
│  - Parse markdown/formatting                                     │
│  - Store in database (posts & comments tables)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. QUALITY FILTERING (filter.ts)                               │
│  - Language detection                                            │
│  - Bot/spam detection                                            │
│  - Duplicate detection                                           │
│  - Remove deleted/removed content                                │
│  - Calculate quality scores                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. SENTIMENT ANALYSIS (sentiment.ts)                           │
│  - Run transformer model (DistilBERT/RoBERTa)                   │
│  - Assign pos/neu/neg scores                                     │
│  - Calculate confidence                                          │
│  - Store sentiment results                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. AGGREGATION (aggregator.ts)                                 │
│  - Group by date & subreddit                                     │
│  - Calculate weighted sentiment averages                         │
│  - Extract keyword frequencies                                   │
│  - Store daily aggregates                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. API/DASHBOARD (Next.js API routes)                          │
│  - Serve aggregated data                                         │
│  - Drill-down to raw posts/comments                              │
│  - CSV export                                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Database Schema

**Using PostgreSQL or SQLite:**

```sql
-- Raw posts table
CREATE TABLE posts (
  id TEXT PRIMARY KEY,                -- Reddit post ID
  name TEXT UNIQUE NOT NULL,          -- Full name (t3_xxx)
  subreddit TEXT NOT NULL,
  author TEXT NOT NULL,
  title TEXT NOT NULL,
  selftext TEXT,
  url TEXT,
  permalink TEXT NOT NULL,
  created_utc INTEGER NOT NULL,
  score INTEGER,
  num_comments INTEGER,
  link_flair_text TEXT,
  is_self BOOLEAN,
  removed_by_category TEXT,
  edited INTEGER,
  collected_at INTEGER NOT NULL,      -- When we fetched it
  updated_at INTEGER NOT NULL,        -- Last update time

  INDEX idx_subreddit (subreddit),
  INDEX idx_created_utc (created_utc),
  INDEX idx_author (author)
);

-- Raw comments table
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  post_id TEXT NOT NULL,
  subreddit TEXT NOT NULL,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  permalink TEXT NOT NULL,
  created_utc INTEGER NOT NULL,
  score INTEGER,
  edited INTEGER,
  depth INTEGER,
  parent_id TEXT,
  removed_by_category TEXT,
  is_submitter BOOLEAN,
  collected_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  FOREIGN KEY (post_id) REFERENCES posts(id),
  INDEX idx_post_id (post_id),
  INDEX idx_subreddit (subreddit),
  INDEX idx_created_utc (created_utc)
);

-- Quality scores
CREATE TABLE quality_scores (
  item_id TEXT PRIMARY KEY,           -- post or comment ID
  item_type TEXT NOT NULL,            -- 'post' or 'comment'
  is_english BOOLEAN NOT NULL,
  is_bot BOOLEAN NOT NULL,
  is_spam BOOLEAN NOT NULL,
  is_low_quality BOOLEAN NOT NULL,
  confidence_weight REAL NOT NULL,
  flags TEXT,                         -- JSON array of flags
  calculated_at INTEGER NOT NULL
);

-- Sentiment scores
CREATE TABLE sentiment_scores (
  item_id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL,
  positive REAL NOT NULL,
  neutral REAL NOT NULL,
  negative REAL NOT NULL,
  overall_sentiment TEXT NOT NULL,    -- 'positive', 'neutral', 'negative'
  confidence REAL NOT NULL,
  calculated_at INTEGER NOT NULL
);

-- Daily aggregates
CREATE TABLE daily_aggregates (
  date TEXT NOT NULL,                 -- YYYY-MM-DD
  subreddit TEXT NOT NULL,
  total_items INTEGER NOT NULL,
  filtered_items INTEGER NOT NULL,    -- After quality filtering
  avg_sentiment REAL NOT NULL,        -- Weighted average
  positive_pct REAL NOT NULL,
  neutral_pct REAL NOT NULL,
  negative_pct REAL NOT NULL,
  keywords TEXT,                      -- JSON array of {word, count}
  calculated_at INTEGER NOT NULL,

  PRIMARY KEY (date, subreddit),
  INDEX idx_date (date)
);

-- Polling metadata
CREATE TABLE poll_metadata (
  subreddit TEXT PRIMARY KEY,
  last_poll_timestamp INTEGER NOT NULL,
  last_successful_poll INTEGER NOT NULL,
  total_posts_collected INTEGER DEFAULT 0,
  total_comments_collected INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  last_error TEXT
);

-- User info cache
CREATE TABLE user_cache (
  username TEXT PRIMARY KEY,
  comment_karma INTEGER,
  link_karma INTEGER,
  created_utc INTEGER,
  posts_last_24h INTEGER,
  cached_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
```

### 5.3 Handling API Quota Exhaustion

**Graceful Degradation Strategy:**

1. **Detect Quota Exhaustion:**
   - Monitor `X-Ratelimit-Remaining` header
   - Catch 429 (Too Many Requests) responses
   - Log quota exhaustion events

2. **Fallback Actions:**
   - Pause polling until rate limit resets
   - Serve cached/stale data from database
   - Display warning banner: "Data may be delayed due to API limits"
   - Queue pending requests for later processing

3. **Priority System:**
   - Priority 1: User-triggered refresh requests
   - Priority 2: Scheduled polls for recent data
   - Priority 3: Backfill historical data
   - Priority 4: Re-fetching edited posts

4. **Recovery:**
   - After rate limit reset, resume with Priority 1 requests
   - Gradually catch up with missed polls
   - Skip redundant backfill if data already fresh

```typescript
class QuotaManager {
  private remainingRequests = 60;
  private resetTime = 0;
  private isPaused = false;

  updateFromHeaders(headers: Headers): void {
    this.remainingRequests = parseInt(headers.get('X-Ratelimit-Remaining') || '60');
    this.resetTime = parseInt(headers.get('X-Ratelimit-Reset') || '0') * 1000;
  }

  canMakeRequest(): boolean {
    if (this.isPaused && Date.now() < this.resetTime) {
      return false;
    }
    if (Date.now() >= this.resetTime) {
      this.isPaused = false;
      this.remainingRequests = 60;
    }
    return this.remainingRequests > 5; // Keep 5 request buffer
  }

  pauseUntilReset(): void {
    this.isPaused = true;
    const waitTime = this.resetTime - Date.now();
    console.warn(`Rate limit exhausted. Pausing for ${waitTime}ms`);
  }
}
```

### 5.4 Fallback to Last Loaded Data

**Scenario:** API is down or quota exhausted.

**Implementation:**
```typescript
class DataService {
  async getAggregates(dateRange: string, subreddit: string) {
    try {
      // Try to fetch fresh data
      await this.pollIfNeeded();
      return await this.db.getAggregates(dateRange, subreddit);
    } catch (error) {
      if (error instanceof APIQuotaError || error instanceof APIUnavailableError) {
        // Serve stale data with warning
        const staleData = await this.db.getAggregates(dateRange, subreddit);
        return {
          ...staleData,
          isStale: true,
          lastUpdated: await this.db.getLastPollTime(subreddit),
          warning: 'Data may be outdated due to API limitations'
        };
      }
      throw error;
    }
  }
}
```

---

## 6. Implementation Code (TypeScript)

### 6.1 Reddit API Client

**File: `src/lib/reddit/client.ts`**

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import { RateLimiter } from './rate-limiter';
import { Cache } from './cache';

export interface RedditConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  userAgent: string;
}

export interface RedditPost {
  id: string;
  name: string;
  subreddit: string;
  author: string;
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  created_utc: number;
  score: number;
  num_comments: number;
  link_flair_text: string | null;
  is_self: boolean;
  removed_by_category: string | null;
  edited: boolean | number;
}

export interface RedditComment {
  id: string;
  name: string;
  post_id: string;
  subreddit: string;
  author: string;
  body: string;
  permalink: string;
  created_utc: number;
  score: number;
  edited: boolean | number;
  depth: number;
  parent_id: string;
  removed_by_category: string | null;
  is_submitter: boolean;
}

export interface RedditListing<T> {
  data: T[];
  after: string | null;
  before: string | null;
}

export class RedditAPIClient {
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private rateLimiter: RateLimiter;
  private cache: Cache<any>;
  private config: RedditConfig;

  constructor(config: RedditConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: 'https://oauth.reddit.com',
      headers: {
        'User-Agent': config.userAgent,
      },
      timeout: 30000,
    });

    this.rateLimiter = new RateLimiter({
      maxRequests: 60,
      windowMs: 60000, // 1 minute
    });

    this.cache = new Cache<any>();

    // Add response interceptor to update rate limits
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const remaining = response.headers['x-ratelimit-remaining'];
        const reset = response.headers['x-ratelimit-reset'];
        if (remaining && reset) {
          this.rateLimiter.updateFromHeaders(
            parseInt(remaining),
            parseInt(reset) * 1000
          );
        }
        return response;
      },
      (error) => {
        if (error.response?.status === 429) {
          this.rateLimiter.pauseUntilReset();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticate with Reddit API using OAuth 2.0
   */
  async authenticate(): Promise<void> {
    // Check if token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return;
    }

    try {
      const authString = Buffer.from(
        `${this.config.clientId}:${this.config.clientSecret}`
      ).toString('base64');

      const response = await axios.post(
        'https://www.reddit.com/api/v1/access_token',
        new URLSearchParams({
          grant_type: 'password',
          username: this.config.username,
          password: this.config.password,
        }),
        {
          headers: {
            Authorization: `Basic ${authString}`,
            'User-Agent': this.config.userAgent,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000 - 60000; // 1 min buffer

      // Update axios instance with new token
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;

      console.log('✓ Reddit API authenticated');
    } catch (error) {
      console.error('Failed to authenticate with Reddit API:', error);
      throw new Error('Reddit authentication failed');
    }
  }

  /**
   * Make a rate-limited request to Reddit API
   */
  private async makeRequest<T>(
    endpoint: string,
    params?: Record<string, any>,
    useCache = true
  ): Promise<T> {
    await this.authenticate();

    // Check cache first
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log(`Cache hit: ${cacheKey}`);
        return cached;
      }
    }

    // Wait for rate limiter
    await this.rateLimiter.waitForToken();

    try {
      const response = await this.axiosInstance.get<T>(endpoint, { params });

      // Cache the response
      const ttl = this.getCacheTTL(endpoint);
      if (ttl > 0) {
        this.cache.set(cacheKey, response.data, ttl);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          // Token expired, re-authenticate and retry
          this.accessToken = null;
          await this.authenticate();
          return this.makeRequest<T>(endpoint, params, false);
        }
        if (axiosError.response?.status === 429) {
          // Rate limit exceeded, wait and retry
          await this.rateLimiter.pauseUntilReset();
          return this.makeRequest<T>(endpoint, params, false);
        }
        console.error(`Reddit API error: ${axiosError.response?.status} ${endpoint}`);
        throw new Error(`Reddit API error: ${axiosError.response?.status}`);
      }
      throw error;
    }
  }

  /**
   * Get cache TTL based on endpoint type
   */
  private getCacheTTL(endpoint: string): number {
    if (endpoint.includes('/new')) return 15 * 60 * 1000; // 15 minutes
    if (endpoint.includes('/comments/')) return 6 * 60 * 60 * 1000; // 6 hours
    if (endpoint.includes('/user/')) return 7 * 24 * 60 * 60 * 1000; // 7 days
    return 0; // No cache
  }

  /**
   * Fetch posts from a subreddit
   */
  async fetchSubredditPosts(
    subreddit: string,
    options: {
      limit?: number;
      after?: string;
      before?: string;
    } = {}
  ): Promise<RedditListing<RedditPost>> {
    const { limit = 100, after, before } = options;

    interface RedditAPIResponse {
      data: {
        children: Array<{ data: any }>;
        after: string | null;
        before: string | null;
      };
    }

    const response = await this.makeRequest<RedditAPIResponse>(
      `/r/${subreddit}/new`,
      { limit, after, before }
    );

    const posts: RedditPost[] = response.data.children.map((child) => {
      const post = child.data;
      return {
        id: post.id,
        name: post.name,
        subreddit: post.subreddit,
        author: post.author,
        title: post.title,
        selftext: post.selftext || '',
        url: post.url,
        permalink: post.permalink,
        created_utc: post.created_utc,
        score: post.score,
        num_comments: post.num_comments,
        link_flair_text: post.link_flair_text || null,
        is_self: post.is_self,
        removed_by_category: post.removed_by_category || null,
        edited: post.edited || false,
      };
    });

    return {
      data: posts,
      after: response.data.after,
      before: response.data.before,
    };
  }

  /**
   * Fetch comments for a specific post
   */
  async fetchPostComments(
    subreddit: string,
    postId: string
  ): Promise<RedditComment[]> {
    interface RedditAPIResponse {
      data: {
        children: Array<{ data: any }>;
      };
    }

    // Reddit returns [post, comments] array
    const response = await this.makeRequest<RedditAPIResponse[]>(
      `/r/${subreddit}/comments/${postId}`,
      { limit: 500 }
    );

    if (!response[1] || !response[1].data) {
      return [];
    }

    const comments: RedditComment[] = [];

    // Recursively extract all comments
    const extractComments = (children: any[], depth = 0) => {
      for (const child of children) {
        if (child.kind === 't1') {
          // t1 = comment
          const comment = child.data;

          // Only collect top-level comments (depth 0) or adjust as needed
          if (depth === 0) {
            comments.push({
              id: comment.id,
              name: comment.name,
              post_id: postId,
              subreddit: comment.subreddit,
              author: comment.author,
              body: comment.body || '',
              permalink: comment.permalink,
              created_utc: comment.created_utc,
              score: comment.score,
              edited: comment.edited || false,
              depth: depth,
              parent_id: comment.parent_id,
              removed_by_category: comment.removed_by_category || null,
              is_submitter: comment.is_submitter || false,
            });
          }

          // Recursively process replies
          if (comment.replies && comment.replies.data) {
            extractComments(comment.replies.data.children, depth + 1);
          }
        }
      }
    };

    extractComments(response[1].data.children);

    return comments;
  }

  /**
   * Backfill historical posts and comments (up to 90 days)
   */
  async backfillHistorical(
    subreddit: string,
    days: number = 90,
    onProgress?: (progress: { totalPosts: number; totalComments: number }) => void
  ): Promise<{ posts: RedditPost[]; comments: RedditComment[] }> {
    const cutoffTime = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
    let after: string | null = null;
    let allPosts: RedditPost[] = [];
    let allComments: RedditComment[] = [];
    let pageCount = 0;
    const maxPages = 10; // Reddit limits to ~1000 posts via pagination

    console.log(`Starting backfill for r/${subreddit} (last ${days} days)...`);

    while (pageCount < maxPages) {
      try {
        const listing = await this.fetchSubredditPosts(subreddit, {
          limit: 100,
          after: after || undefined,
        });

        if (listing.data.length === 0) {
          console.log('No more posts available');
          break;
        }

        // Filter posts within time window
        const recentPosts = listing.data.filter(
          (post) => post.created_utc >= cutoffTime
        );

        if (recentPosts.length === 0) {
          console.log('Reached posts older than cutoff time');
          break;
        }

        allPosts.push(...recentPosts);

        // Fetch comments for each post
        for (const post of recentPosts) {
          try {
            const comments = await this.fetchPostComments(subreddit, post.id);
            allComments.push(...comments);

            // Throttle to avoid hitting rate limits
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 req/sec
          } catch (error) {
            console.error(`Failed to fetch comments for post ${post.id}:`, error);
            // Continue with next post
          }
        }

        if (onProgress) {
          onProgress({
            totalPosts: allPosts.length,
            totalComments: allComments.length,
          });
        }

        after = listing.after;
        pageCount++;

        if (!after) {
          console.log('No more pages available');
          break;
        }

        // Check if oldest post in this batch is beyond cutoff
        const oldestPost = recentPosts[recentPosts.length - 1];
        if (oldestPost.created_utc < cutoffTime) {
          console.log('Reached cutoff time');
          break;
        }

      } catch (error) {
        console.error(`Backfill error on page ${pageCount}:`, error);
        throw error;
      }
    }

    console.log(
      `✓ Backfill complete: ${allPosts.length} posts, ${allComments.length} comments`
    );

    return { posts: allPosts, comments: allComments };
  }

  /**
   * Poll for new content since last poll timestamp
   */
  async pollNewContent(
    subreddit: string,
    lastPollTimestamp: number
  ): Promise<{ posts: RedditPost[]; comments: RedditComment[] }> {
    console.log(`Polling r/${subreddit} for new content since ${new Date(lastPollTimestamp * 1000).toISOString()}...`);

    // Fetch latest posts
    const listing = await this.fetchSubredditPosts(subreddit, { limit: 100 });

    // Filter new posts since last poll
    const newPosts = listing.data.filter(
      (post) => post.created_utc > lastPollTimestamp
    );

    console.log(`Found ${newPosts.length} new posts`);

    // Fetch comments for new posts
    let allComments: RedditComment[] = [];
    for (const post of newPosts) {
      try {
        const comments = await this.fetchPostComments(subreddit, post.id);
        allComments.push(...comments);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Throttle
      } catch (error) {
        console.error(`Failed to fetch comments for post ${post.id}:`, error);
      }
    }

    // Also check recent posts (last 24h) for new comments
    const recentPosts = listing.data.filter(
      (post) => post.created_utc > Math.floor(Date.now() / 1000) - 24 * 60 * 60
    );

    for (const post of recentPosts) {
      if (!newPosts.includes(post)) {
        // Re-fetch comments to find new ones
        try {
          const comments = await this.fetchPostComments(subreddit, post.id);
          const newComments = comments.filter(
            (comment) => comment.created_utc > lastPollTimestamp
          );
          allComments.push(...newComments);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to fetch updated comments for post ${post.id}:`, error);
        }
      }
    }

    console.log(`✓ Poll complete: ${newPosts.length} new posts, ${allComments.length} new comments`);

    return { posts: newPosts, comments: allComments };
  }

  /**
   * Fetch user information (for quality scoring)
   */
  async fetchUserInfo(username: string): Promise<{
    comment_karma: number;
    link_karma: number;
    created_utc: number;
  }> {
    interface RedditUserResponse {
      data: {
        comment_karma: number;
        link_karma: number;
        created_utc: number;
      };
    }

    try {
      const response = await this.makeRequest<RedditUserResponse>(
        `/user/${username}/about`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch user info for ${username}:`, error);
      return { comment_karma: 0, link_karma: 0, created_utc: 0 };
    }
  }

  /**
   * Invalidate cache for a specific key or all caches
   */
  invalidateCache(pattern?: string): void {
    if (pattern) {
      this.cache.invalidate(pattern);
    } else {
      this.cache.clear();
    }
  }
}
```

### 6.2 Rate Limiter

**File: `src/lib/reddit/rate-limiter.ts`**

```typescript
export interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
}

export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private tokens: number;
  private lastRefill: number;
  private resetTime: number;
  private isPaused: boolean;

  constructor(config: RateLimiterConfig) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
    this.tokens = config.maxRequests;
    this.lastRefill = Date.now();
    this.resetTime = 0;
    this.isPaused = false;
  }

  /**
   * Wait until a token is available
   */
  async waitForToken(): Promise<void> {
    while (!this.tryConsume()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Try to consume a token (non-blocking)
   */
  private tryConsume(): boolean {
    if (this.isPaused && Date.now() < this.resetTime) {
      return false;
    }

    if (Date.now() >= this.resetTime) {
      this.isPaused = false;
      this.tokens = this.maxRequests;
    }

    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / this.windowMs) * this.maxRequests;

    this.tokens = Math.min(this.tokens + tokensToAdd, this.maxRequests);
    this.lastRefill = now;
  }

  /**
   * Update rate limits from Reddit API headers
   */
  updateFromHeaders(remaining: number, resetTimestamp: number): void {
    this.tokens = remaining;
    this.resetTime = resetTimestamp;

    if (remaining === 0) {
      this.pauseUntilReset();
    }
  }

  /**
   * Pause requests until rate limit resets
   */
  pauseUntilReset(): void {
    this.isPaused = true;
    const waitTime = Math.max(0, this.resetTime - Date.now());
    console.warn(`Rate limit exhausted. Pausing for ${waitTime}ms`);
  }

  /**
   * Get remaining tokens
   */
  getRemaining(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}
```

### 6.3 Cache Layer

**File: `src/lib/reddit/cache.ts`**

```typescript
import fs from 'fs/promises';
import path from 'path';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class Cache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private cacheDir: string;
  private persistToDisk: boolean;

  constructor(cacheDir = '.cache/reddit', persistToDisk = true) {
    this.cacheDir = cacheDir;
    this.persistToDisk = persistToDisk;

    if (persistToDisk) {
      this.ensureCacheDir();
    }
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  /**
   * Set a cache entry
   */
  async set(key: string, data: T, ttl: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    this.store.set(key, entry);

    if (this.persistToDisk) {
      await this.persistEntry(key, entry);
    }
  }

  /**
   * Get a cache entry
   */
  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      if (this.persistToDisk) {
        this.deleteFile(key);
      }
      return null;
    }

    return entry.data;
  }

  /**
   * Check if cache has valid entry
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific cache entry
   */
  async delete(key: string): Promise<void> {
    this.store.delete(key);
    if (this.persistToDisk) {
      await this.deleteFile(key);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.store.clear();
    if (this.persistToDisk) {
      try {
        const files = await fs.readdir(this.cacheDir);
        await Promise.all(
          files.map((file) => fs.unlink(path.join(this.cacheDir, file)))
        );
      } catch (error) {
        console.error('Failed to clear cache directory:', error);
      }
    }
  }

  /**
   * Invalidate cache entries matching pattern
   */
  invalidate(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.delete(key);
      }
    }
  }

  /**
   * Persist cache entry to disk
   */
  private async persistEntry(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      const filename = this.keyToFilename(key);
      const filepath = path.join(this.cacheDir, filename);
      await fs.writeFile(filepath, JSON.stringify(entry), 'utf8');
    } catch (error) {
      console.error(`Failed to persist cache entry ${key}:`, error);
    }
  }

  /**
   * Load cache entry from disk
   */
  private async loadEntry(key: string): Promise<CacheEntry<T> | null> {
    try {
      const filename = this.keyToFilename(key);
      const filepath = path.join(this.cacheDir, filename);
      const content = await fs.readFile(filepath, 'utf8');
      return JSON.parse(content) as CacheEntry<T>;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete cache file from disk
   */
  private async deleteFile(key: string): Promise<void> {
    try {
      const filename = this.keyToFilename(key);
      const filepath = path.join(this.cacheDir, filename);
      await fs.unlink(filepath);
    } catch (error) {
      // Ignore errors (file may not exist)
    }
  }

  /**
   * Convert cache key to safe filename
   */
  private keyToFilename(key: string): string {
    return Buffer.from(key).toString('base64').replace(/[/+=]/g, '_') + '.json';
  }

  /**
   * Cleanup expired entries (run periodically)
   */
  async cleanupExpired(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    await Promise.all(keysToDelete.map((key) => this.delete(key)));

    console.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
  }
}
```

### 6.4 Example Usage

**File: `src/scripts/reddit-ingestion.ts`**

```typescript
import { RedditAPIClient } from '../lib/reddit/client';

async function main() {
  // Initialize Reddit client
  const client = new RedditAPIClient({
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    username: process.env.REDDIT_USERNAME!,
    password: process.env.REDDIT_PASSWORD!,
    userAgent: 'ClaudeSentimentMonitor/1.0.0 (by /u/your_username)',
  });

  const subreddits = ['ClaudeAI', 'ClaudeCode', 'Anthropic'];

  // Example 1: Initial backfill
  console.log('=== Starting Initial Backfill ===');
  for (const subreddit of subreddits) {
    try {
      const result = await client.backfillHistorical(subreddit, 90, (progress) => {
        console.log(`Progress: ${progress.totalPosts} posts, ${progress.totalComments} comments`);
      });

      console.log(`Backfill complete for r/${subreddit}:`);
      console.log(`  Posts: ${result.posts.length}`);
      console.log(`  Comments: ${result.comments.length}`);

      // Save to database (implement your storage logic)
      // await saveToDB(result.posts, result.comments);

    } catch (error) {
      console.error(`Backfill failed for r/${subreddit}:`, error);
    }
  }

  // Example 2: Ongoing polling (run every 30 minutes)
  console.log('\n=== Starting Polling ===');
  const lastPollTimestamp = Math.floor(Date.now() / 1000) - 30 * 60; // 30 min ago

  for (const subreddit of subreddits) {
    try {
      const result = await client.pollNewContent(subreddit, lastPollTimestamp);

      console.log(`Poll complete for r/${subreddit}:`);
      console.log(`  New posts: ${result.posts.length}`);
      console.log(`  New comments: ${result.comments.length}`);

      // Save new content to database
      // await saveToDB(result.posts, result.comments);

    } catch (error) {
      console.error(`Poll failed for r/${subreddit}:`, error);
    }
  }

  // Example 3: Fetch user info for quality scoring
  const username = 'example_user';
  const userInfo = await client.fetchUserInfo(username);
  console.log(`\nUser ${username}:`);
  console.log(`  Comment Karma: ${userInfo.comment_karma}`);
  console.log(`  Link Karma: ${userInfo.link_karma}`);
}

// Run the script
main().catch(console.error);
```

### 6.5 Scheduled Polling Service

**File: `src/services/polling-service.ts`**

```typescript
import { RedditAPIClient } from '../lib/reddit/client';
import { Database } from '../lib/database';
import cron from 'node-cron';

export class PollingService {
  private client: RedditAPIClient;
  private db: Database;
  private subreddits: string[];
  private isRunning: boolean = false;

  constructor(client: RedditAPIClient, db: Database, subreddits: string[]) {
    this.client = client;
    this.db = db;
    this.subreddits = subreddits;
  }

  /**
   * Start polling every 30 minutes
   */
  start(): void {
    if (this.isRunning) {
      console.log('Polling service already running');
      return;
    }

    console.log('Starting polling service (every 30 minutes)...');

    // Run immediately on start
    this.poll();

    // Schedule every 30 minutes
    cron.schedule('*/30 * * * *', () => {
      this.poll();
    });

    this.isRunning = true;
  }

  /**
   * Stop polling service
   */
  stop(): void {
    this.isRunning = false;
    console.log('Polling service stopped');
  }

  /**
   * Poll all subreddits for new content
   */
  private async poll(): Promise<void> {
    console.log(`\n[${new Date().toISOString()}] Starting poll...`);

    for (const subreddit of this.subreddits) {
      try {
        // Get last poll timestamp from database
        const metadata = await this.db.getPollMetadata(subreddit);
        const lastPollTimestamp = metadata?.last_poll_timestamp ||
          Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60; // 90 days ago

        // Fetch new content
        const result = await this.client.pollNewContent(subreddit, lastPollTimestamp);

        // Save to database
        if (result.posts.length > 0 || result.comments.length > 0) {
          await this.db.savePosts(result.posts);
          await this.db.saveComments(result.comments);

          console.log(`✓ r/${subreddit}: ${result.posts.length} posts, ${result.comments.length} comments`);
        } else {
          console.log(`✓ r/${subreddit}: No new content`);
        }

        // Update poll metadata
        await this.db.updatePollMetadata({
          subreddit,
          last_poll_timestamp: Math.floor(Date.now() / 1000),
          last_successful_poll: Math.floor(Date.now() / 1000),
          total_posts_collected: (metadata?.total_posts_collected || 0) + result.posts.length,
          total_comments_collected: (metadata?.total_comments_collected || 0) + result.comments.length,
          errors_count: 0,
          last_error: null,
        });

      } catch (error) {
        console.error(`✗ r/${subreddit}: Poll failed:`, error);

        // Update error metadata
        const metadata = await this.db.getPollMetadata(subreddit);
        await this.db.updatePollMetadata({
          subreddit,
          last_poll_timestamp: metadata?.last_poll_timestamp || Math.floor(Date.now() / 1000),
          last_successful_poll: metadata?.last_successful_poll || 0,
          total_posts_collected: metadata?.total_posts_collected || 0,
          total_comments_collected: metadata?.total_comments_collected || 0,
          errors_count: (metadata?.errors_count || 0) + 1,
          last_error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.log(`Poll complete at ${new Date().toISOString()}\n`);
  }
}
```

---

## 7. Production Deployment Checklist

### 7.1 Environment Variables

Create `.env` file:
```bash
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USERNAME=your_bot_username
REDDIT_PASSWORD=your_bot_password
REDDIT_USER_AGENT="ClaudeSentimentMonitor/1.0.0 (by /u/your_username)"

DATABASE_URL=postgresql://user:pass@localhost:5432/sentiment_db
# or
DATABASE_PATH=./data/sentiment.db

CACHE_DIR=.cache/reddit
NODE_ENV=production
```

### 7.2 Security Best Practices

1. **Never commit credentials to repo**
2. **Use read-only Reddit API access** (don't request write permissions)
3. **Implement request signing** for public API endpoints
4. **Rate limit your own API** to prevent abuse
5. **Log all API errors** for security monitoring
6. **Encrypt cache files** if storing on shared infrastructure

### 7.3 Monitoring & Alerts

Set up alerts for:
- **API quota exhaustion** (>90% of rate limit used)
- **Authentication failures** (token expiry issues)
- **High error rates** (>5% of requests failing)
- **Stale data** (last successful poll >2 hours ago)
- **Database storage** (>80% capacity)

### 7.4 Performance Optimization

1. **Use connection pooling** for database
2. **Batch database inserts** (100-500 records at a time)
3. **Index frequently queried fields** (created_utc, subreddit, author)
4. **Compress old cache files** (gzip JSON files >7 days old)
5. **Archive old data** (move posts >180 days to cold storage)

### 7.5 Testing Strategy

1. **Unit tests** for rate limiter, cache, quality filters
2. **Integration tests** with mock Reddit API responses
3. **End-to-end test** with test subreddit (r/test)
4. **Load testing** to verify rate limiting works
5. **Failure testing** (API down, database unavailable, quota exhausted)

---

## 8. Known Limitations & Workarounds

### 8.1 Reddit API Limitations

**Limitation 1: Pagination Limit**
- Reddit API only returns ~1000 most recent posts via `/new` pagination
- **Workaround:** Accept limited historical data for MVP, or use Pushshift API if available

**Limitation 2: Comment Depth**
- Full comment trees can be massive (>10,000 comments)
- **Workaround:** Only fetch top-level comments (depth=0) for sentiment analysis

**Limitation 3: Deleted Content**
- API doesn't return content of deleted/removed posts
- **Workaround:** Store content immediately when fetched, before deletion

**Limitation 4: Rate Limits**
- 60 requests/minute may be insufficient for high-volume subreddits
- **Workaround:** Implement request prioritization and caching

### 8.2 Data Quality Issues

**Issue 1: Edited Content**
- Users can edit posts/comments after initial fetch
- **Workaround:** Re-fetch recent posts periodically to catch edits

**Issue 2: Bot Detection**
- Some sophisticated bots mimic human behavior
- **Workaround:** Combine multiple heuristics and manual review

**Issue 3: Language Detection**
- Short texts (1-2 words) hard to classify
- **Workaround:** Skip items with <10 characters

### 8.3 Recommended Next Steps

1. **Implement quality filters** (Section 3) before sentiment analysis
2. **Add monitoring dashboard** for API health and data quality metrics
3. **Set up automated testing** with mock Reddit API
4. **Document methodology** for transparency (as per PRD)
5. **Implement CSV export** for daily aggregates
6. **Add webhook support** for real-time alerts on sentiment spikes

---

## Conclusion

This Reddit API integration strategy provides a production-ready, scalable approach to ingesting and processing Reddit data for sentiment analysis. The implementation handles rate limiting, caching, quality filtering, and graceful error recovery.

**Key Highlights:**
- OAuth 2.0 authentication with automatic token refresh
- Token bucket rate limiting (60 req/min)
- Multi-layer caching (memory + disk)
- Comprehensive quality filtering (language, bots, spam, duplicates)
- Initial 90-day backfill + ongoing 30-minute polling
- Graceful degradation when API quota exhausted
- Production-ready TypeScript implementation

**Next Steps:**
1. Set up Reddit app credentials at https://www.reddit.com/prefs/apps
2. Implement database schema (Section 5.2)
3. Integrate sentiment analysis model (separate module)
4. Build aggregation pipeline (daily rollups)
5. Deploy polling service with cron/scheduler
6. Set up monitoring and alerts

The code is modular, testable, and ready for integration with the rest of the sentiment monitoring pipeline.

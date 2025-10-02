import { z } from 'zod';

// Reddit API Response Types
const RedditPostSchema = z.object({
  id: z.string(),
  subreddit: z.string(),
  author: z.string(),
  title: z.string(),
  selftext: z.string().optional(),
  score: z.number(),
  created_utc: z.number(),
  permalink: z.string(),
  num_comments: z.number(),
  is_self: z.boolean(),
  url: z.string(),
});

const RedditCommentSchema = z.object({
  id: z.string(),
  author: z.string(),
  body: z.string(),
  score: z.number(),
  created_utc: z.number(),
  parent_id: z.string().optional(),
  link_id: z.string(),
});

type RedditPost = z.infer<typeof RedditPostSchema>;
type RedditComment = z.infer<typeof RedditCommentSchema>;

interface RedditListing<T> {
  data: {
    children: Array<{ data: T }>;
    after: string | null;
    before: string | null;
  };
}

// Token Bucket Rate Limiter
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + timePassed * this.refillRate);
    this.lastRefill = now;

    if (this.tokens < 1) {
      const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.tokens = 1;
    }

    this.tokens -= 1;
  }
}

// In-memory cache
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

export class RedditService {
  private static instance: RedditService;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private rateLimiter: TokenBucket;
  private cache: MemoryCache;

  private readonly CLIENT_ID = process.env.REDDIT_CLIENT_ID!;
  private readonly CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET!;
  private readonly USER_AGENT = process.env.REDDIT_USER_AGENT || 'ClaudeCodeMonitor/1.0';

  private constructor() {
    this.rateLimiter = new TokenBucket(60, 1); // 60 requests per minute
    this.cache = new MemoryCache();
  }

  static getInstance(): RedditService {
    if (!RedditService.instance) {
      RedditService.instance = new RedditService();
    }
    return RedditService.instance;
  }

  // OAuth 2.0 Authentication
  private async authenticate(): Promise<void> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return;
    }

    const auth = Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString('base64');

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': this.USER_AGENT,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Reddit auth failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60000; // 1 minute buffer
  }

  // Make authenticated request with rate limiting
  private async request<T>(url: string): Promise<T> {
    await this.authenticate();
    await this.rateLimiter.acquire();

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'User-Agent': this.USER_AGENT,
      },
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return this.request<T>(url);
    }

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Fetch posts from subreddit with pagination
  async fetchPosts(
    subreddit: string,
    options: {
      after?: string;
      limit?: number;
      since?: Date;
    } = {}
  ): Promise<{ posts: RedditPost[]; after: string | null }> {
    const { after, limit = 100, since } = options;

    const cacheKey = `posts:${subreddit}:${after || 'initial'}`;
    const cached = this.cache.get<{ posts: RedditPost[]; after: string | null }>(cacheKey);
    if (cached) return cached;

    const url = new URL(`https://oauth.reddit.com/r/${subreddit}/new`);
    url.searchParams.set('limit', limit.toString());
    if (after) url.searchParams.set('after', after);

    const listing = await this.request<RedditListing<RedditPost>>(url.toString());

    const posts = listing.data.children
      .map((child) => child.data)
      .filter((post) => {
        // Filter out bot posts and deleted content
        if (post.author === '[deleted]' || post.author.toLowerCase().includes('bot')) {
          return false;
        }
        // Filter by date if specified
        if (since && post.created_utc < since.getTime() / 1000) {
          return false;
        }
        return true;
      });

    const result = {
      posts: posts.map((post) => RedditPostSchema.parse(post)),
      after: listing.data.after,
    };

    // Cache for 15 minutes
    this.cache.set(cacheKey, result, 15 * 60);

    return result;
  }

  // Fetch comments for a specific post
  async fetchComments(
    subreddit: string,
    postId: string
  ): Promise<RedditComment[]> {
    const cacheKey = `comments:${postId}`;
    const cached = this.cache.get<RedditComment[]>(cacheKey);
    if (cached) return cached;

    const url = `https://oauth.reddit.com/r/${subreddit}/comments/${postId}`;
    const [, commentListing] = await this.request<
      [RedditListing<RedditPost>, RedditListing<RedditComment>]
    >(url);

    const comments = this.flattenComments(commentListing);

    const filtered = comments.filter((comment) => {
      return (
        comment.author !== '[deleted]' &&
        !comment.author.toLowerCase().includes('bot') &&
        comment.body.length > 10
      );
    });

    const validated = filtered.map((comment) => RedditCommentSchema.parse(comment));

    // Cache for 6 hours
    this.cache.set(cacheKey, validated, 6 * 60 * 60);

    return validated;
  }

  // Flatten nested comment tree
  private flattenComments(
    listing: RedditListing<RedditComment>,
    result: RedditComment[] = []
  ): RedditComment[] {
    for (const child of listing.data.children) {
      if (child.data.body) {
        result.push(child.data);
      }
      // @ts-expect-error - Reddit API has nested replies
      if (child.data.replies && typeof child.data.replies === 'object') {
        // @ts-expect-error - Reddit API type definitions don't include nested structure
        this.flattenComments(child.data.replies, result);
      }
    }
    return result;
  }

  // Backfill historical data (90 days)
  async backfill(
    subreddit: string,
    daysBack: number = 90,
    onProgress?: (processed: number, total: number) => void
  ): Promise<{ posts: RedditPost[]; comments: RedditComment[] }> {
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const allPosts: RedditPost[] = [];
    const allComments: RedditComment[] = [];

    let after: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const { posts, after: nextAfter } = await this.fetchPosts(subreddit, {
        after: after || undefined,
        limit: 100,
        since,
      });

      if (posts.length === 0) {
        hasMore = false;
        break;
      }

      // Check if we've gone past the date range
      const oldestPostDate = Math.min(...posts.map((p) => p.created_utc));
      if (oldestPostDate < since.getTime() / 1000) {
        // Filter posts within range
        const filteredPosts = posts.filter(
          (p) => p.created_utc >= since.getTime() / 1000
        );
        allPosts.push(...filteredPosts);
        hasMore = false;
        break;
      }

      allPosts.push(...posts);

      // Fetch comments for each post
      for (const post of posts) {
        try {
          const comments = await this.fetchComments(subreddit, post.id);
          allComments.push(...comments);
        } catch (error) {
          console.error(`Failed to fetch comments for post ${post.id}:`, error);
        }
      }

      if (onProgress) {
        onProgress(allPosts.length, allPosts.length + 100);
      }

      after = nextAfter;
      if (!after) {
        hasMore = false;
      }
    }

    return { posts: allPosts, comments: allComments };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

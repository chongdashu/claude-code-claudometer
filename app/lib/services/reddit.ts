// Reddit API Service
// Based on reddit-api-expert specifications

import { RedditPost, RedditComment } from '@/types';

export interface RedditAPIConfig {
  clientId: string;
  clientSecret: string;
  userAgent: string;
}

export class RedditAPIService {
  private config: RedditAPIConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: RedditAPIConfig) {
    this.config = config;
  }

  /**
   * Authenticate with Reddit OAuth
   * Per reddit-api-expert: OAuth 2.0 client credentials flow
   */
  private async authenticate(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': this.config.userAgent,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Reddit OAuth failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min early

    return this.accessToken!;
  }

  /**
   * Fetch posts from a subreddit
   * Per reddit-api-expert: Fetch posts with pagination support
   */
  async fetchPosts(subreddit: string, limit: number = 100, after?: string): Promise<RedditPost[]> {
    const token = await this.authenticate();

    const url = new URL(`https://oauth.reddit.com/r/${subreddit}/new`);
    url.searchParams.set('limit', limit.toString());
    if (after) {
      url.searchParams.set('after', after);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': this.config.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    const data = await response.json();

    return data.data.children.map((child: Record<string, any>) => {
      const childData = child.data as any;
      return {
        id: childData.id,
        subreddit: childData.subreddit,
        timestamp: childData.created_utc,
        author: childData.author,
        title: childData.title,
        body: childData.selftext || '',
        score: childData.score,
        numComments: childData.num_comments,
        flair: childData.link_flair_text,
        permalink: `https://reddit.com${childData.permalink}`,
        isDeleted: childData.author === '[deleted]',
        isRemoved: childData.removed_by_category !== null,
      };
    });
  }

  /**
   * Fetch top-level comments for a post
   * Per reddit-api-expert: Fetch comments with filtering
   */
  async fetchComments(subreddit: string, postId: string): Promise<RedditComment[]> {
    const token = await this.authenticate();

    const response = await fetch(
      `https://oauth.reddit.com/r/${subreddit}/comments/${postId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': this.config.userAgent,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    const data = await response.json();
    const comments: RedditComment[] = [];

    // Extract top-level comments only (second element of response)
    if (data[1]?.data?.children) {
      for (const child of data[1].data.children) {
        if (child.kind === 't1') { // Comment type
          comments.push({
            id: child.data.id,
            subreddit: child.data.subreddit,
            timestamp: child.data.created_utc,
            author: child.data.author,
            body: child.data.body || '',
            score: child.data.score,
            parentId: child.data.parent_id,
            permalink: `https://reddit.com${child.data.permalink}`,
            isDeleted: child.data.author === '[deleted]',
          });
        }
      }
    }

    return comments;
  }

  /**
   * Fetch posts from multiple subreddits
   * Per PRD: r/ClaudeAI, r/ClaudeCode, r/Anthropic
   */
  async fetchFromAllSubreddits(limit: number = 100): Promise<Map<string, RedditPost[]>> {
    const subreddits = ['ClaudeAI', 'ClaudeCode', 'Anthropic'];
    const results = new Map<string, RedditPost[]>();

    for (const subreddit of subreddits) {
      try {
        const posts = await this.fetchPosts(subreddit, limit);
        results.set(subreddit, posts);
      } catch (error) {
        console.error(`Failed to fetch from r/${subreddit}:`, error);
        results.set(subreddit, []);
      }
    }

    return results;
  }
}

// Factory function
export function createRedditService(): RedditAPIService {
  const config: RedditAPIConfig = {
    clientId: process.env.REDDIT_CLIENT_ID || '',
    clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
    userAgent: process.env.REDDIT_USER_AGENT || 'ClaudeCodeSentimentMonitor/1.0',
  };

  return new RedditAPIService(config);
}

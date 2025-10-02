// Database utility for SQLite/PostgreSQL
// Based on system-architect specifications

import { ScoredItem, DailyAggregate } from '@/types';

export interface Database {
  // Raw posts table
  insertRawPost(post: Record<string, unknown>): Promise<void>;
  getRawPosts(subreddit: string, startDate: Date, endDate: Date): Promise<Record<string, unknown>[]>;

  // Scored posts table
  insertScoredItem(item: ScoredItem): Promise<void>;
  getScoredItems(subreddit: string, date: string): Promise<ScoredItem[]>;

  // Daily aggregates table
  upsertDailyAggregate(aggregate: DailyAggregate): Promise<void>;
  getDailyAggregates(subreddit: string, startDate: string, endDate: string): Promise<DailyAggregate[]>;

  // Utility
  close(): Promise<void>;
}

// In-memory implementation for MVP (will be replaced with SQLite/PostgreSQL)
class InMemoryDatabase implements Database {
  private rawPosts: Map<string, Record<string, unknown>[]> = new Map();
  private scoredItems: Map<string, ScoredItem[]> = new Map();
  private dailyAggregates: Map<string, DailyAggregate> = new Map();

  async insertRawPost(post: Record<string, unknown>): Promise<void> {
    const key = post.subreddit as string;
    if (!this.rawPosts.has(key)) {
      this.rawPosts.set(key, []);
    }
    this.rawPosts.get(key)!.push(post);
  }

  async getRawPosts(subreddit: string, startDate: Date, endDate: Date): Promise<Record<string, unknown>[]> {
    const posts = this.rawPosts.get(subreddit) || [];
    return posts.filter(p => {
      const postDate = new Date((p.timestamp as number) * 1000);
      return postDate >= startDate && postDate <= endDate;
    });
  }

  async insertScoredItem(item: ScoredItem): Promise<void> {
    const key = `${item.subreddit}-${new Date(item.timestamp).toISOString().split('T')[0]}`;
    if (!this.scoredItems.has(key)) {
      this.scoredItems.set(key, []);
    }
    this.scoredItems.get(key)!.push(item);
  }

  async getScoredItems(subreddit: string, date: string): Promise<ScoredItem[]> {
    const key = `${subreddit}-${date}`;
    return this.scoredItems.get(key) || [];
  }

  async upsertDailyAggregate(aggregate: DailyAggregate): Promise<void> {
    const key = `${aggregate.subreddit}-${aggregate.date}`;
    this.dailyAggregates.set(key, aggregate);
  }

  async getDailyAggregates(subreddit: string, startDate: string, endDate: string): Promise<DailyAggregate[]> {
    const aggregates: DailyAggregate[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    this.dailyAggregates.forEach((aggregate) => {
      if (aggregate.subreddit === subreddit || subreddit === 'all') {
        const aggDate = new Date(aggregate.date);
        if (aggDate >= start && aggDate <= end) {
          aggregates.push(aggregate);
        }
      }
    });

    return aggregates.sort((a, b) => a.date.localeCompare(b.date));
  }

  async close(): Promise<void> {
    // No-op for in-memory
  }
}

// Singleton instance
let db: Database | null = null;

export function getDatabase(): Database {
  if (!db) {
    db = new InMemoryDatabase();
  }
  return db;
}

export function clearDatabase(): void {
  db = null;
}

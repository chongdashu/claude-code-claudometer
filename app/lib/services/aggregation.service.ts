import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, format } from 'date-fns';

export interface DailyAggregateData {
  date: Date;
  subreddit: string;
  avgSentiment: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  totalCount: number;
  volumePosts: number;
  volumeComments: number;
}

export interface TimeRangeData {
  subreddit: string;
  data: Array<{
    date: string;
    avgSentiment: number;
    volume: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
  }>;
}

export class AggregationService {
  private static instance: AggregationService;

  private constructor() {}

  static getInstance(): AggregationService {
    if (!AggregationService.instance) {
      AggregationService.instance = new AggregationService();
    }
    return AggregationService.instance;
  }

  // Compute daily aggregate for a specific date and subreddit
  async computeDailyAggregate(
    date: Date,
    subreddit: string
  ): Promise<DailyAggregateData> {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Get all posts for this day
    const posts = await prisma.rawPost.findMany({
      where: {
        subreddit,
        createdAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        sentiment: true,
      },
    });

    // Get all comments for this day
    const comments = await prisma.rawComment.findMany({
      where: {
        subreddit,
        createdAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        sentiment: true,
      },
    });

    // Combine all items with sentiment
    const allItems = [
      ...posts.filter((p) => p.sentiment).map((p) => p.sentiment!),
      ...comments.filter((c) => c.sentiment).map((c) => c.sentiment!),
    ];

    const totalCount = allItems.length;

    if (totalCount === 0) {
      return {
        date: dayStart,
        subreddit,
        avgSentiment: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        totalCount: 0,
        volumePosts: posts.length,
        volumeComments: comments.length,
      };
    }

    // Calculate aggregates
    const avgSentiment =
      allItems.reduce((sum, item) => sum + item.sentiment, 0) / totalCount;

    const positiveCount = allItems.filter((item) => item.sentiment > 0.2).length;
    const negativeCount = allItems.filter((item) => item.sentiment < -0.2).length;
    const neutralCount = totalCount - positiveCount - negativeCount;

    return {
      date: dayStart,
      subreddit,
      avgSentiment,
      positiveCount,
      negativeCount,
      neutralCount,
      totalCount,
      volumePosts: posts.length,
      volumeComments: comments.length,
    };
  }

  // Save daily aggregate to database (upsert)
  async saveDailyAggregate(data: DailyAggregateData): Promise<void> {
    await prisma.dailyAggregate.upsert({
      where: {
        date_subreddit: {
          date: data.date,
          subreddit: data.subreddit,
        },
      },
      create: {
        date: data.date,
        subreddit: data.subreddit,
        avgSentiment: data.avgSentiment,
        positiveCount: data.positiveCount,
        negativeCount: data.negativeCount,
        neutralCount: data.neutralCount,
        totalCount: data.totalCount,
        volumePosts: data.volumePosts,
        volumeComments: data.volumeComments,
      },
      update: {
        avgSentiment: data.avgSentiment,
        positiveCount: data.positiveCount,
        negativeCount: data.negativeCount,
        neutralCount: data.neutralCount,
        totalCount: data.totalCount,
        volumePosts: data.volumePosts,
        volumeComments: data.volumeComments,
      },
    });
  }

  // Recompute aggregates for a date range
  async recomputeRange(
    startDate: Date,
    endDate: Date,
    subreddits: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    const days: Date[] = [];
    let currentDate = startOfDay(startDate);
    const end = startOfDay(endDate);

    while (currentDate <= end) {
      days.push(new Date(currentDate));
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    const totalTasks = days.length * subreddits.length;
    let completed = 0;

    for (const day of days) {
      for (const subreddit of subreddits) {
        const aggregate = await this.computeDailyAggregate(day, subreddit);
        await this.saveDailyAggregate(aggregate);
        completed++;
        if (onProgress) {
          onProgress(completed, totalTasks);
        }
      }
    }
  }

  // Get aggregates for a time range
  async getAggregatesForRange(
    startDate: Date,
    endDate: Date,
    subreddit: string
  ): Promise<TimeRangeData> {
    const aggregates = await prisma.dailyAggregate.findMany({
      where: {
        subreddit,
        date: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return {
      subreddit,
      data: aggregates.map((agg) => ({
        date: format(agg.date, 'yyyy-MM-dd'),
        avgSentiment: agg.avgSentiment,
        volume: agg.totalCount,
        positiveCount: agg.positiveCount,
        negativeCount: agg.negativeCount,
        neutralCount: agg.neutralCount,
      })),
    };
  }

  // Get aggregates for all subreddits combined
  async getCombinedAggregates(
    startDate: Date,
    endDate: Date,
    subreddits: string[]
  ): Promise<TimeRangeData> {
    const allData = await Promise.all(
      subreddits.map((sub) => this.getAggregatesForRange(startDate, endDate, sub))
    );

    // Merge data by date
    const dateMap = new Map<
      string,
      {
        avgSentiment: number;
        volume: number;
        positiveCount: number;
        negativeCount: number;
        neutralCount: number;
        count: number;
      }
    >();

    for (const subData of allData) {
      for (const dayData of subData.data) {
        const existing = dateMap.get(dayData.date) || {
          avgSentiment: 0,
          volume: 0,
          positiveCount: 0,
          negativeCount: 0,
          neutralCount: 0,
          count: 0,
        };

        existing.avgSentiment += dayData.avgSentiment;
        existing.volume += dayData.volume;
        existing.positiveCount += dayData.positiveCount;
        existing.negativeCount += dayData.negativeCount;
        existing.neutralCount += dayData.neutralCount;
        existing.count += 1;

        dateMap.set(dayData.date, existing);
      }
    }

    // Average the sentiment scores
    const data = Array.from(dateMap.entries())
      .map(([date, values]) => ({
        date,
        avgSentiment: values.avgSentiment / values.count,
        volume: values.volume,
        positiveCount: values.positiveCount,
        negativeCount: values.negativeCount,
        neutralCount: values.neutralCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      subreddit: 'all',
      data,
    };
  }

  // Get drill-down data for a specific day
  async getDrillDownData(
    date: Date,
    subreddit: string
  ): Promise<{
    posts: Array<{
      id: string;
      title: string;
      author: string;
      score: number;
      numComments: number;
      sentiment: number | null;
      url: string;
      createdAt: Date;
    }>;
    comments: Array<{
      id: string;
      postId: string;
      postTitle: string;
      author: string;
      body: string;
      score: number;
      sentiment: number | null;
      createdAt: Date;
    }>;
  }> {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const posts = await prisma.rawPost.findMany({
      where: {
        subreddit,
        createdAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        sentiment: true,
      },
      orderBy: {
        score: 'desc',
      },
      take: 50,
    });

    const comments = await prisma.rawComment.findMany({
      where: {
        subreddit,
        createdAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        sentiment: true,
        post: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        score: 'desc',
      },
      take: 50,
    });

    return {
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title,
        author: p.author,
        score: p.score,
        numComments: p.numComments,
        sentiment: p.sentiment?.sentiment ?? null,
        url: p.url,
        createdAt: p.createdAt,
      })),
      comments: comments.map((c) => ({
        id: c.id,
        postId: c.postId,
        postTitle: c.post.title,
        author: c.author,
        body: c.body,
        score: c.score,
        sentiment: c.sentiment?.sentiment ?? null,
        createdAt: c.createdAt,
      })),
    };
  }

  // Export data to CSV format
  async exportToCSV(
    startDate: Date,
    endDate: Date,
    subreddits: string[]
  ): Promise<string> {
    const allData = await Promise.all(
      subreddits.map((sub) => this.getAggregatesForRange(startDate, endDate, sub))
    );

    const rows: string[] = [
      'Date,Subreddit,Avg Sentiment,Volume,Positive Count,Negative Count,Neutral Count',
    ];

    for (const subData of allData) {
      for (const dayData of subData.data) {
        rows.push(
          `${dayData.date},${subData.subreddit},${dayData.avgSentiment.toFixed(3)},${dayData.volume},${dayData.positiveCount},${dayData.negativeCount},${dayData.neutralCount}`
        );
      }
    }

    return rows.join('\n');
  }
}

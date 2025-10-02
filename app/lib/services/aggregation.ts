// Aggregation Service
// Based on system-architect specifications

import { ScoredItem, DailyAggregate } from '@/types';
import { getDatabase } from '@/lib/db';

export class AggregationService {
  /**
   * Aggregate scored items into daily summaries
   * Per system-architect: Daily rollups with keyword extraction
   */
  async aggregateDay(subreddit: string, date: string): Promise<DailyAggregate> {
    const db = getDatabase();
    const items = await db.getScoredItems(subreddit, date);

    if (items.length === 0) {
      return {
        date,
        subreddit,
        sentimentScore: 0,
        positiveCount: 0,
        neutralCount: 0,
        negativeCount: 0,
        totalCount: 0,
        averageConfidence: 0,
        topKeywords: [],
      };
    }

    // Count sentiments
    const positiveCount = items.filter(i => i.sentiment.label === 'positive').length;
    const neutralCount = items.filter(i => i.sentiment.label === 'neutral').length;
    const negativeCount = items.filter(i => i.sentiment.label === 'negative').length;

    // Calculate weighted sentiment score (-1 to 1)
    const sentimentScore = items.reduce((sum, item) => {
      const score = item.sentiment.positive - item.sentiment.negative;
      return sum + (score * item.sentiment.confidence);
    }, 0) / items.length;

    // Calculate average confidence
    const averageConfidence = items.reduce((sum, item) => sum + item.sentiment.confidence, 0) / items.length;

    // Extract top keywords
    const topKeywords = this.extractKeywords(items);

    const aggregate: DailyAggregate = {
      date,
      subreddit,
      sentimentScore,
      positiveCount,
      neutralCount,
      negativeCount,
      totalCount: items.length,
      averageConfidence,
      topKeywords,
    };

    // Save to database
    await db.upsertDailyAggregate(aggregate);

    return aggregate;
  }

  /**
   * Extract top keywords from scored items
   * Per system-architect: Keyword frequency analysis
   */
  private extractKeywords(items: ScoredItem[]): Array<{ keyword: string; count: number }> {
    const keywordCounts = new Map<string, number>();

    // Common words to exclude
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from', 'it', 'this', 'that', 'was', 'are', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might']);

    for (const item of items) {
      const words = item.content
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word));

      for (const word of words) {
        keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1);
      }
    }

    // Sort by count and return top 10
    return Array.from(keywordCounts.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Aggregate multiple days for a date range
   */
  async aggregateRange(subreddit: string, startDate: string, endDate: string): Promise<DailyAggregate[]> {
    const db = getDatabase();
    const aggregates = await db.getDailyAggregates(subreddit, startDate, endDate);

    // If requesting "all", combine aggregates by date
    if (subreddit === 'all') {
      const dateMap = new Map<string, DailyAggregate[]>();

      // Group aggregates by date
      for (const agg of aggregates) {
        if (!dateMap.has(agg.date)) {
          dateMap.set(agg.date, []);
        }
        dateMap.get(agg.date)!.push(agg);
      }

      // Combine aggregates for each date
      const combinedAggregates: DailyAggregate[] = [];
      for (const [date, dateAggs] of dateMap) {
        const totalCount = dateAggs.reduce((sum, agg) => sum + agg.totalCount, 0);
        const positiveCount = dateAggs.reduce((sum, agg) => sum + agg.positiveCount, 0);
        const neutralCount = dateAggs.reduce((sum, agg) => sum + agg.neutralCount, 0);
        const negativeCount = dateAggs.reduce((sum, agg) => sum + agg.negativeCount, 0);

        // Weighted average for sentiment score
        const sentimentScore = dateAggs.reduce((sum, agg) =>
          sum + (agg.sentimentScore * agg.totalCount), 0) / totalCount;

        // Weighted average for confidence
        const averageConfidence = dateAggs.reduce((sum, agg) =>
          sum + (agg.averageConfidence * agg.totalCount), 0) / totalCount;

        // Combine top keywords from all subreddits
        const keywordMap = new Map<string, number>();
        for (const agg of dateAggs) {
          for (const kw of agg.topKeywords) {
            keywordMap.set(kw.keyword, (keywordMap.get(kw.keyword) || 0) + kw.count);
          }
        }
        const topKeywords = Array.from(keywordMap.entries())
          .map(([keyword, count]) => ({ keyword, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        combinedAggregates.push({
          date,
          subreddit: 'all',
          sentimentScore,
          positiveCount,
          neutralCount,
          negativeCount,
          totalCount,
          averageConfidence,
          topKeywords,
        });
      }

      return combinedAggregates.sort((a, b) => a.date.localeCompare(b.date));
    }

    return aggregates;
  }

  /**
   * Calculate summary metrics for a time range
   */
  calculateSummary(aggregates: DailyAggregate[]) {
    if (aggregates.length === 0) {
      return {
        averageSentiment: 0,
        totalVolume: 0,
        positivePercentage: 0,
        negativePercentage: 0,
        trendDirection: 'stable' as const,
      };
    }

    const totalVolume = aggregates.reduce((sum, agg) => sum + agg.totalCount, 0);
    const averageSentiment = aggregates.reduce((sum, agg) => sum + agg.sentimentScore, 0) / aggregates.length;

    const totalPositive = aggregates.reduce((sum, agg) => sum + agg.positiveCount, 0);
    const totalNegative = aggregates.reduce((sum, agg) => sum + agg.negativeCount, 0);

    const positivePercentage = (totalPositive / totalVolume) * 100;
    const negativePercentage = (totalNegative / totalVolume) * 100;

    // Calculate trend (comparing first half to second half)
    const midpoint = Math.floor(aggregates.length / 2);
    const firstHalf = aggregates.slice(0, midpoint);
    const secondHalf = aggregates.slice(midpoint);

    const firstHalfAvg = firstHalf.reduce((sum, agg) => sum + agg.sentimentScore, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, agg) => sum + agg.sentimentScore, 0) / secondHalf.length;

    const trendDirection = secondHalfAvg > firstHalfAvg + 0.1 ? 'up' : secondHalfAvg < firstHalfAvg - 0.1 ? 'down' : 'stable';

    return {
      averageSentiment,
      totalVolume,
      positivePercentage,
      negativePercentage,
      trendDirection,
    };
  }
}

// Factory function
export function createAggregationService(): AggregationService {
  return new AggregationService();
}

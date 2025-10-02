// Core types for Claude Code Sentiment Monitor

export type Subreddit = 'ClaudeAI' | 'ClaudeCode' | 'Anthropic' | 'All';

export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export type TimeRange = '7d' | '30d' | '90d';

export interface RedditPost {
  id: string;
  subreddit: string;
  timestamp: number;
  author: string;
  title: string;
  body: string;
  score: number;
  numComments: number;
  flair?: string;
  permalink: string;
  isDeleted: boolean;
  isRemoved: boolean;
}

export interface RedditComment {
  id: string;
  subreddit: string;
  timestamp: number;
  author: string;
  body: string;
  score: number;
  parentId: string;
  permalink: string;
  isDeleted: boolean;
}

export interface SentimentScore {
  label: SentimentLabel;
  confidence: number;
  positive: number;
  neutral: number;
  negative: number;
}

export interface ScoredItem {
  id: string;
  subreddit: string;
  timestamp: number;
  author: string;
  content: string;
  score: number;
  permalink: string;
  sentiment: SentimentScore;
  type: 'post' | 'comment';
}

export interface DailyAggregate {
  date: string; // YYYY-MM-DD
  subreddit: string;
  sentimentScore: number; // Weighted average (-1 to 1)
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  totalCount: number;
  averageConfidence: number;
  topKeywords: Array<{ keyword: string; count: number }>;
}

export interface DashboardMetrics {
  averageSentiment: number;
  totalVolume: number;
  positivePercentage: number;
  negativePercentage: number;
  trendDirection: 'up' | 'down' | 'stable';
}

export interface ChartDataPoint {
  date: string;
  sentiment: number;
  volume: number;
  subreddit?: string;
}

export interface SampleItem {
  id: string;
  author: string;
  content: string;
  sentiment: SentimentLabel;
  confidence: number;
  score: number;
  permalink: string;
  timestamp: number;
}

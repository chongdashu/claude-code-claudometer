// Initialize sample data for demonstration
// This simulates Reddit data and sentiment analysis results

import { getDatabase } from './db';
import { ScoredItem, SentimentLabel } from '@/types';

const subreddits = ['ClaudeAI', 'ClaudeCode', 'Anthropic'];

const sampleTexts = [
  { text: 'Claude Code is amazing! It helps me code so much faster.', sentiment: 'positive' as SentimentLabel },
  { text: 'I love using Claude Code for my projects.', sentiment: 'positive' as SentimentLabel },
  { text: 'Claude Code has some bugs that need fixing.', sentiment: 'negative' as SentimentLabel },
  { text: 'How do I use Claude Code with TypeScript?', sentiment: 'neutral' as SentimentLabel },
  { text: 'Claude Code is the best AI coding assistant!', sentiment: 'positive' as SentimentLabel },
  { text: 'Having issues with Claude Code crashing.', sentiment: 'negative' as SentimentLabel },
  { text: 'Claude Code works well for most tasks.', sentiment: 'neutral' as SentimentLabel },
  { text: 'Great experience with Claude Code so far!', sentiment: 'positive' as SentimentLabel },
  { text: 'Claude Code needs better documentation.', sentiment: 'negative' as SentimentLabel },
  { text: 'Just started using Claude Code.', sentiment: 'neutral' as SentimentLabel },
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateSentimentScore(label: SentimentLabel) {
  const confidence = 0.6 + Math.random() * 0.4; // 0.6-1.0

  switch (label) {
    case 'positive':
      return {
        label,
        confidence,
        positive: 0.6 + Math.random() * 0.4,
        neutral: Math.random() * 0.2,
        negative: Math.random() * 0.2,
      };
    case 'negative':
      return {
        label,
        confidence,
        positive: Math.random() * 0.2,
        neutral: Math.random() * 0.2,
        negative: 0.6 + Math.random() * 0.4,
      };
    default:
      return {
        label,
        confidence,
        positive: Math.random() * 0.4,
        neutral: 0.4 + Math.random() * 0.3,
        negative: Math.random() * 0.4,
      };
  }
}

export async function initializeSampleData(days: number = 30) {
  const db = getDatabase();
  const now = Date.now();

  console.log(`Initializing ${days} days of sample data...`);

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const date = new Date(now - dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];

    // Generate 5-15 posts per subreddit per day
    for (const subreddit of subreddits) {
      const postCount = 5 + Math.floor(Math.random() * 10);

      for (let i = 0; i < postCount; i++) {
        const sample = getRandomElement(sampleTexts);
        const timestamp = Math.floor(date.getTime() / 1000) + Math.floor(Math.random() * 86400);

        const scoredItem: ScoredItem = {
          id: `${subreddit}-${dateStr}-${i}`,
          subreddit,
          timestamp,
          author: `user_${Math.floor(Math.random() * 1000)}`,
          content: sample.text,
          score: Math.floor(Math.random() * 100),
          permalink: `https://reddit.com/r/${subreddit}/comments/sample${i}`,
          sentiment: generateSentimentScore(sample.sentiment),
          type: Math.random() > 0.5 ? 'post' : 'comment',
        };

        await db.insertScoredItem(scoredItem);
      }

      // Aggregate the day
      const { createAggregationService } = await import('./services/aggregation');
      const aggregationService = createAggregationService();
      await aggregationService.aggregateDay(subreddit, dateStr);
    }
  }

  console.log('Sample data initialization complete!');
}

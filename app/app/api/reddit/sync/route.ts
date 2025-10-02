// API Route: POST /api/reddit/sync
// Manual sync endpoint to fetch real Reddit data and analyze sentiment

import { NextRequest, NextResponse } from 'next/server';
import { createRedditService } from '@/lib/services/reddit';
import { createSentimentService } from '@/lib/services/sentiment';
import { createAggregationService } from '@/lib/services/aggregation';
import { getDatabase } from '@/lib/db';
import { ScoredItem } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Check if credentials are configured
    if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reddit API credentials not configured. Please set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in .env.local',
        },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in .env.local',
        },
        { status: 400 }
      );
    }

    const { days = 7 } = await request.json().catch(() => ({}));

    // Initialize services
    const redditService = createRedditService();
    const sentimentService = createSentimentService();
    const aggregationService = createAggregationService();
    const db = getDatabase();

    console.log(`Starting Reddit sync for last ${days} days...`);

    // Fetch posts from all subreddits
    const subredditPosts = await redditService.fetchFromAllSubreddits(100);

    let totalProcessed = 0;
    const processedDates = new Set<string>();

    // Process each subreddit's posts
    for (const [subreddit, posts] of subredditPosts.entries()) {
      console.log(`Processing ${posts.length} posts from r/${subreddit}`);

      for (const post of posts) {
        // Analyze sentiment
        const content = `${post.title} ${post.body}`.trim();
        const sentiment = await sentimentService.analyzeSentiment(content);

        // Create scored item
        const scoredItem: ScoredItem = {
          id: post.id,
          subreddit: post.subreddit,
          timestamp: post.timestamp,
          author: post.author,
          content: content,
          score: post.score,
          permalink: post.permalink,
          sentiment: sentiment,
          type: 'post',
        };

        // Save to database
        await db.insertScoredItem(scoredItem);
        totalProcessed++;

        // Track dates for aggregation
        const date = new Date(post.timestamp * 1000).toISOString().split('T')[0];
        processedDates.add(`${subreddit}-${date}`);
      }
    }

    // Aggregate all processed dates
    console.log('Aggregating daily data...');
    for (const key of processedDates) {
      const [subreddit, date] = key.split('-');
      await aggregationService.aggregateDay(subreddit, date);
    }

    console.log(`Sync complete! Processed ${totalProcessed} items`);

    return NextResponse.json({
      success: true,
      message: 'Reddit data synced successfully',
      stats: {
        totalProcessed,
        subreddits: Array.from(subredditPosts.keys()),
        datesAggregated: processedDates.size,
      },
    });
  } catch (error) {
    console.error('Reddit sync failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

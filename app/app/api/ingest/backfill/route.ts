import { NextRequest, NextResponse } from 'next/server';
import { RedditService } from '@/lib/services/reddit.service';
import { SentimentService } from '@/lib/services/sentiment.service';
import { AggregationService } from '@/lib/services/aggregation.service';
import { prisma } from '@/lib/prisma';
import { subDays, startOfDay } from 'date-fns';

const SUBREDDITS = ['ClaudeAI', 'ClaudeCode', 'Anthropic'];

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const daysBack = body.daysBack || 90;

    const redditService = RedditService.getInstance();
    const sentimentService = SentimentService.getInstance();
    const aggregationService = AggregationService.getInstance();

    const results = {
      subreddits: [] as Array<{
        subreddit: string;
        totalPosts: number;
        totalComments: number;
        analyzed: number;
      }>,
    };

    // Backfill each subreddit
    for (const subreddit of SUBREDDITS) {
      try {
        console.log(`Starting backfill for r/${subreddit} (${daysBack} days)...`);

        const { posts, comments } = await redditService.backfill(
          subreddit,
          daysBack,
          (processed, total) => {
            console.log(`  Progress: ${processed}/${total} posts processed`);
          }
        );

        console.log(
          `Fetched ${posts.length} posts and ${comments.length} comments`
        );

        // Save posts to database
        for (const post of posts) {
          await prisma.rawPost.upsert({
            where: { id: post.id },
            create: {
              id: post.id,
              subreddit: post.subreddit,
              author: post.author,
              title: post.title,
              body: post.selftext || null,
              score: post.score,
              createdAt: new Date(post.created_utc * 1000),
              url: post.url,
              numComments: post.num_comments,
            },
            update: {
              score: post.score,
              numComments: post.num_comments,
            },
          });
        }

        // Save comments to database
        for (const comment of comments) {
          await prisma.rawComment.upsert({
            where: { id: comment.id },
            create: {
              id: comment.id,
              postId: comment.link_id.replace('t3_', ''),
              subreddit,
              author: comment.author,
              body: comment.body,
              score: comment.score,
              createdAt: new Date(comment.created_utc * 1000),
              parentId: comment.parent_id || null,
            },
            update: {
              score: comment.score,
            },
          });
        }

        console.log(`Analyzing sentiment for ${posts.length + comments.length} items...`);

        // Analyze sentiment
        const itemsToAnalyze = [
          ...posts.map((post) => ({
            id: post.id,
            type: 'post' as const,
            text: `${post.title} ${post.selftext || ''}`.trim(),
            context: post.title,
          })),
          ...comments.map((comment) => ({
            id: comment.id,
            type: 'comment' as const,
            text: comment.body,
          })),
        ];

        const analyzed = await sentimentService.analyzeBatch(itemsToAnalyze, {
          batchSize: 20,
          onProgress: (processed, total) => {
            console.log(`  Sentiment analysis: ${processed}/${total}`);
          },
        });

        console.log(`Analyzed ${analyzed.size} items`);

        // Recompute aggregates for the entire range
        const endDate = new Date();
        const startDate = subDays(startOfDay(endDate), daysBack);
        await aggregationService.recomputeRange(startDate, endDate, [subreddit]);

        console.log(`Completed backfill for r/${subreddit}`);

        results.subreddits.push({
          subreddit,
          totalPosts: posts.length,
          totalComments: comments.length,
          analyzed: analyzed.size,
        });
      } catch (error) {
        console.error(`Failed to backfill subreddit ${subreddit}:`, error);
        results.subreddits.push({
          subreddit,
          totalPosts: 0,
          totalComments: 0,
          analyzed: 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      daysBack,
      results,
    });
  } catch (error) {
    console.error('Backfill API error:', error);
    return NextResponse.json({ error: 'Backfill failed' }, { status: 500 });
  }
}

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

    const redditService = RedditService.getInstance();
    const sentimentService = SentimentService.getInstance();
    const aggregationService = AggregationService.getInstance();

    const results = {
      subreddits: [] as Array<{
        subreddit: string;
        newPosts: number;
        newComments: number;
        analyzed: number;
      }>,
    };

    // Poll each subreddit for new content (last 30 minutes)
    for (const subreddit of SUBREDDITS) {
      try {
        const since = subDays(new Date(), 1); // Get posts from last day to catch up

        // Fetch new posts
        const { posts } = await redditService.fetchPosts(subreddit, {
          limit: 25,
          since,
        });

        let newPosts = 0;
        let newComments = 0;
        const itemsToAnalyze: Array<{
          id: string;
          type: 'post' | 'comment';
          text: string;
          context?: string;
        }> = [];

        // Save posts to database
        for (const post of posts) {
          const existing = await prisma.rawPost.findUnique({
            where: { id: post.id },
          });

          if (!existing) {
            await prisma.rawPost.create({
              data: {
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
            });
            newPosts++;

            // Queue for sentiment analysis
            itemsToAnalyze.push({
              id: post.id,
              type: 'post',
              text: `${post.title} ${post.selftext || ''}`.trim(),
              context: post.title,
            });
          }

          // Fetch comments for each post
          try {
            const comments = await redditService.fetchComments(
              subreddit,
              post.id
            );

            for (const comment of comments) {
              const existingComment = await prisma.rawComment.findUnique({
                where: { id: comment.id },
              });

              if (!existingComment) {
                await prisma.rawComment.create({
                  data: {
                    id: comment.id,
                    postId: post.id,
                    subreddit,
                    author: comment.author,
                    body: comment.body,
                    score: comment.score,
                    createdAt: new Date(comment.created_utc * 1000),
                    parentId: comment.parent_id || null,
                  },
                });
                newComments++;

                // Queue for sentiment analysis
                itemsToAnalyze.push({
                  id: comment.id,
                  type: 'comment',
                  text: comment.body,
                  context: post.title,
                });
              }
            }
          } catch (error) {
            console.error(`Failed to fetch comments for post ${post.id}:`, error);
          }
        }

        // Analyze sentiment for new items
        const analyzed = await sentimentService.analyzeBatch(itemsToAnalyze, {
          batchSize: 20,
        });

        results.subreddits.push({
          subreddit,
          newPosts,
          newComments,
          analyzed: analyzed.size,
        });

        // Recompute aggregates for today and yesterday
        const today = startOfDay(new Date());
        const yesterday = subDays(today, 1);
        await aggregationService.recomputeRange(yesterday, today, [subreddit]);
      } catch (error) {
        console.error(`Failed to poll subreddit ${subreddit}:`, error);
        results.subreddits.push({
          subreddit,
          newPosts: 0,
          newComments: 0,
          analyzed: 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('Poll API error:', error);
    return NextResponse.json({ error: 'Poll failed' }, { status: 500 });
  }
}

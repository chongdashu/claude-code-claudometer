import { NextRequest, NextResponse } from 'next/server';
import { AggregationService } from '@/lib/services/aggregation.service';
import { subDays } from 'date-fns';

const SUBREDDITS = ['ClaudeAI', 'ClaudeCode', 'Anthropic'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '7d';
    const subreddit = searchParams.get('subreddit') || 'all';

    // Parse time range
    let daysBack = 7;
    if (range === '30d') daysBack = 30;
    else if (range === '90d') daysBack = 90;

    const endDate = new Date();
    const startDate = subDays(endDate, daysBack);

    const aggregationService = AggregationService.getInstance();

    // Get data based on subreddit filter
    let data;
    if (subreddit === 'all') {
      data = await aggregationService.getCombinedAggregates(
        startDate,
        endDate,
        SUBREDDITS
      );
    } else {
      data = await aggregationService.getAggregatesForRange(
        startDate,
        endDate,
        subreddit
      );
    }

    // Cache for 30 minutes
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Dashboard data API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

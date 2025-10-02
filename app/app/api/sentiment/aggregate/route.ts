// API Route: GET /api/sentiment/aggregate
// Based on system-architect specifications

import { NextRequest, NextResponse } from 'next/server';
import { createAggregationService } from '@/lib/services/aggregation';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const subreddit = searchParams.get('subreddit') || 'all';
  const timeRange = searchParams.get('timeRange') || '30d';

  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch aggregates
    const aggregationService = createAggregationService();
    const aggregates = await aggregationService.aggregateRange(subreddit, startDateStr, endDateStr);
    const summary = aggregationService.calculateSummary(aggregates);

    return NextResponse.json({
      success: true,
      data: {
        subreddit,
        timeRange,
        aggregates,
        summary,
      },
      meta: {
        lastUpdated: new Date().toISOString(),
        cacheHit: false,
      },
    });
  } catch (error) {
    console.error('Failed to fetch aggregates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sentiment data',
      },
      { status: 500 }
    );
  }
}

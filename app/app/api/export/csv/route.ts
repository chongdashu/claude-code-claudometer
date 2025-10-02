// API Route: GET /api/export/csv
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
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch aggregates
    const aggregationService = createAggregationService();
    const aggregates = await aggregationService.aggregateRange(subreddit, startDateStr, endDateStr);

    // Generate CSV
    const csvRows = [
      'Date,Subreddit,Sentiment Score,Volume,Positive Count,Neutral Count,Negative Count,Positive %,Negative %,Avg Confidence',
    ];

    for (const agg of aggregates) {
      const posPercent = ((agg.positiveCount / agg.totalCount) * 100).toFixed(1);
      const negPercent = ((agg.negativeCount / agg.totalCount) * 100).toFixed(1);

      csvRows.push(
        `${agg.date},${agg.subreddit},${agg.sentimentScore.toFixed(3)},${agg.totalCount},${agg.positiveCount},${agg.neutralCount},${agg.negativeCount},${posPercent}%,${negPercent}%,${agg.averageConfidence.toFixed(3)}`
      );
    }

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="sentiment-${subreddit}-${timeRange}.csv"`,
      },
    });
  } catch (error) {
    console.error('Failed to export CSV:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export data',
      },
      { status: 500 }
    );
  }
}

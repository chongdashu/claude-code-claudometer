import { NextRequest, NextResponse } from 'next/server';
import { AggregationService } from '@/lib/services/aggregation.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get('date');
    const subreddit = searchParams.get('subreddit');

    if (!dateStr || !subreddit) {
      return NextResponse.json(
        { error: 'Missing required parameters: date and subreddit' },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const aggregationService = AggregationService.getInstance();
    const data = await aggregationService.getDrillDownData(date, subreddit);

    // Cache for 5 minutes
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Drill-down API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drill-down data' },
      { status: 500 }
    );
  }
}

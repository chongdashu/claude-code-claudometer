import { NextRequest, NextResponse } from 'next/server';
import { AggregationService } from '@/lib/services/aggregation.service';
import { subDays } from 'date-fns';

const SUBREDDITS = ['ClaudeAI', 'ClaudeCode', 'Anthropic'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '7d';

    // Parse time range
    let daysBack = 7;
    if (range === '30d') daysBack = 30;
    else if (range === '90d') daysBack = 90;

    const endDate = new Date();
    const startDate = subDays(endDate, daysBack);

    const aggregationService = AggregationService.getInstance();
    const csv = await aggregationService.exportToCSV(startDate, endDate, SUBREDDITS);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="sentiment-data-${range}.csv"`,
        'Cache-Control': 'public, s-maxage=1800',
      },
    });
  } catch (error) {
    console.error('CSV export API error:', error);
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    );
  }
}

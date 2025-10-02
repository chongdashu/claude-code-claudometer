// API Route: GET /api/sentiment/samples
// Based on system-architect specifications

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const subreddit = searchParams.get('subreddit') || 'all';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const db = getDatabase();
    const scoredItems = await db.getScoredItems(subreddit, date);

    // Map to sample format
    const samples = scoredItems.map(item => ({
      id: item.id,
      author: item.author,
      content: item.content.slice(0, 200) + (item.content.length > 200 ? '...' : ''),
      sentiment: item.sentiment.label,
      confidence: item.sentiment.confidence,
      score: item.score,
      permalink: item.permalink,
      timestamp: item.timestamp,
    }));

    return NextResponse.json({
      success: true,
      data: {
        subreddit,
        date,
        samples,
        totalCount: samples.length,
      },
      meta: {
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to fetch samples:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sample data',
      },
      { status: 500 }
    );
  }
}

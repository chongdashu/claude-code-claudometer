// API Route: POST /api/data/clear
// Clear all data from the database

import { NextResponse } from 'next/server';
import { clearDatabase } from '@/lib/db';

export async function POST() {
  try {
    // Clear the in-memory database
    clearDatabase();

    return NextResponse.json({
      success: true,
      message: 'All data cleared successfully. Database will be re-initialized on next use.',
    });
  } catch (error) {
    console.error('Failed to clear data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear data',
      },
      { status: 500 }
    );
  }
}

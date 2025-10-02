// API Route: GET /api/init
// Initialize sample data for demonstration

import { NextResponse } from 'next/server';
import { initializeSampleData } from '@/lib/init-data';

export async function GET() {
  try {
    await initializeSampleData(90); // 90 days of sample data

    return NextResponse.json({
      success: true,
      message: 'Sample data initialized successfully',
    });
  } catch (error) {
    console.error('Failed to initialize data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize sample data',
      },
      { status: 500 }
    );
  }
}

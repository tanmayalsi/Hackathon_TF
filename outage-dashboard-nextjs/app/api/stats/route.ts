import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { StatsResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hours = parseInt(searchParams.get('hours') || '24');

    const timeFilter = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Query to get statistics
    const query = `
      SELECT
        COUNT(DISTINCT cd.call_id) as total_calls,
        COUNT(DISTINCT cd.customer_id) as unique_customers,
        AVG(EXTRACT(EPOCH FROM (cd.enddatetime - cd.startdatetime)) / 60) as avg_duration,
        MAX(cd.startdatetime) as last_call_time
      FROM team_thread_forge.call_data cd
      JOIN team_thread_forge.transcript_data td ON cd.call_id = td.call_id
      WHERE td.call_reason = 'technical_support'
        AND cd.startdatetime >= $1
    `;

    const results = await prisma.$queryRawUnsafe<any[]>(query, timeFilter);
    const row = results[0];

    const response: StatsResponse = {
      total_calls: parseInt(row?.total_calls || '0'),
      unique_customers: parseInt(row?.unique_customers || '0'),
      avg_duration_minutes: parseFloat(row?.avg_duration || '0'),
      last_call_time: row?.last_call_time ? new Date(row.last_call_time).toISOString() : null,
      time_range_hours: hours,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: String(error) },
      { status: 500 }
    );
  }
}

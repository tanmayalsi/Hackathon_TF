import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { TimelineDataResponse, TimelineDataPoint } from '@/types';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hours = parseInt(searchParams.get('hours') || '24');

    const timeFilter = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Query to get hourly call counts
    const query = `
      SELECT
        DATE_TRUNC('hour', cd.startdatetime) as hour_bucket,
        COUNT(DISTINCT cd.call_id) as call_count
      FROM team_thread_forge.call_data cd
      JOIN team_thread_forge.transcript_data td ON cd.call_id = td.call_id
      WHERE td.call_reason = 'technical_support'
        AND cd.startdatetime >= $1
      GROUP BY hour_bucket
      ORDER BY hour_bucket ASC
    `;

    const results = await prisma.$queryRawUnsafe<any[]>(query, timeFilter);

    const data: TimelineDataPoint[] = results.map((row) => {
      const timestamp = new Date(row.hour_bucket);
      return {
        timestamp: timestamp.toISOString(),
        call_count: parseInt(row.call_count),
        hour_label: format(timestamp, 'MMM d, ha'),
      };
    });

    const response: TimelineDataResponse = {
      data,
      time_range_hours: hours,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching timeline data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline data', details: String(error) },
      { status: 500 }
    );
  }
}

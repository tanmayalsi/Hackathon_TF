import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const zip = searchParams.get('zip');
    const hours = parseInt(searchParams.get('hours') || '24');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!zip) {
      return NextResponse.json(
        { error: 'ZIP code is required' },
        { status: 400 }
      );
    }

    // Calculate time range (same logic as outage-data route)
    let timeFilter: Date;
    if (startDate && endDate) {
      timeFilter = new Date(startDate);
    } else {
      timeFilter = new Date(Date.now() - hours * 60 * 60 * 1000);
    }

    console.log(`Fetching transcripts for ZIP ${zip}, time filter: ${timeFilter.toISOString()}`);

    // Query to get all transcripts for this outage
    const query = `
      SELECT
        cd.call_id,
        cd.customer_id,
        cd.startdatetime,
        cd.enddatetime,
        td.call_reason,
        td.transcript,
        c.location as customer_location,
        c.service_address
      FROM team_thread_forge.call_data cd
      JOIN team_thread_forge.transcript_data td ON cd.call_id = td.call_id
      JOIN public.customers c ON cd.customer_id = c.customer_id
      WHERE td.call_reason = 'technical_support'
        AND cd.startdatetime >= $1
        AND SUBSTRING(c.service_address FROM '\\d{5}$') = $2
      ORDER BY cd.startdatetime DESC
    `;

    const results = await prisma.$queryRawUnsafe<any[]>(query, timeFilter, zip);
    console.log(`Found ${results.length} transcripts for ZIP ${zip}`);

    // Transform results
    const transcripts = results.map((row) => {
      const startTime = new Date(row.startdatetime);
      const endTime = new Date(row.enddatetime);
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

      return {
        call_id: row.call_id,
        customer_id: row.customer_id,
        started_at: startTime.toISOString(),
        ended_at: endTime.toISOString(),
        duration_minutes: Math.round(durationMinutes * 10) / 10,
        call_reason: row.call_reason,
        transcript: row.transcript,
        customer_location: row.customer_location,
        service_address: row.service_address,
      };
    });

    return NextResponse.json({
      zip_code: zip,
      time_range_hours: hours,
      call_count: transcripts.length,
      transcripts,
    });
  } catch (error) {
    console.error('Error fetching outage transcripts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outage transcripts', details: String(error) },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { prisma, getZipCoordinates } from '@/lib/db';
import type { OutageDataResponse, OutageDataPoint } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hours = parseInt(searchParams.get('hours') || '24');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Calculate time range
    let timeFilter: Date;
    if (startDate && endDate) {
      timeFilter = new Date(startDate);
    } else {
      timeFilter = new Date(Date.now() - hours * 60 * 60 * 1000);
    }

    console.log(`Fetching outage data for time filter: ${timeFilter.toISOString()}`);

    // Query to get call data joined with customer location
    // Extract ZIP code from service_address (last 5 digits)
    const query = `
      SELECT
        SUBSTRING(c.service_address FROM '\\d{5}$') as zip_code,
        COUNT(DISTINCT cd.call_id) as call_count,
        AVG(EXTRACT(EPOCH FROM (cd.enddatetime - cd.startdatetime)) / 60) as avg_duration,
        ARRAY_AGG(DISTINCT cd.customer_id) as customer_ids
      FROM team_thread_forge.call_data cd
      JOIN team_thread_forge.transcript_data td ON cd.call_id = td.call_id
      JOIN public.customers c ON cd.customer_id = c.customer_id
      WHERE td.call_reason = 'technical_support'
        AND cd.startdatetime >= $1
      GROUP BY 1
      HAVING SUBSTRING(c.service_address FROM '\\d{5}$') IS NOT NULL
      ORDER BY call_count DESC
    `;

    const results = await prisma.$queryRawUnsafe<any[]>(query, timeFilter);
    console.log(`Query returned ${results.length} ZIP codes with technical support calls`);

    // Load ZIP coordinates from CSV
    const ZIP_COORDINATES = getZipCoordinates();

    // Transform results with coordinates
    const missingZipCodes: string[] = [];
    const data: OutageDataPoint[] = results
      .map((row) => {
        const zipCode = row.zip_code;
        const coordinates = ZIP_COORDINATES[zipCode];

        if (!coordinates) {
          missingZipCodes.push(zipCode);
          return null;
        }

        return {
          zip_code: zipCode,
          call_count: parseInt(row.call_count),
          avg_duration: parseFloat(row.avg_duration) || 0,
          coordinates,
          customer_ids: row.customer_ids || [],
        };
      })
      .filter((item): item is OutageDataPoint => item !== null);

    if (missingZipCodes.length > 0) {
      console.warn(`Missing coordinates for ZIP codes: ${missingZipCodes.join(', ')}`);
    }

    console.log(`Returning ${data.length} outage data points after coordinate mapping`);

    const response: OutageDataResponse = {
      data,
      timestamp: new Date().toISOString(),
      time_range_hours: hours,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching outage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outage data', details: String(error) },
      { status: 500 }
    );
  }
}

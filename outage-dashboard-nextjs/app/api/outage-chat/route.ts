import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  zip: string;
  hours?: number;
  start_date?: string;
  end_date?: string;
  messages: Message[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { zip, hours = 24, start_date, end_date, messages } = body;

    if (!zip || !messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'ZIP code and messages are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Calculate time filter (same logic as other routes)
    let timeFilter: Date;
    if (start_date && end_date) {
      timeFilter = new Date(start_date);
    } else {
      timeFilter = new Date(Date.now() - hours * 60 * 60 * 1000);
    }

    console.log(`Fetching transcripts for Claude chat - ZIP ${zip}, time filter: ${timeFilter.toISOString()}`);

    // Fetch transcripts for this outage
    const query = `
      SELECT
        cd.call_id,
        cd.customer_id,
        cd.startdatetime,
        cd.enddatetime,
        td.transcript,
        c.location as customer_location
      FROM team_thread_forge.call_data cd
      JOIN team_thread_forge.transcript_data td ON cd.call_id = td.call_id
      JOIN public.customers c ON cd.customer_id = c.customer_id
      WHERE td.call_reason = 'technical_support'
        AND cd.startdatetime >= $1
        AND SUBSTRING(c.service_address FROM '\\d{5}$') = $2
      ORDER BY cd.startdatetime DESC
      LIMIT 50
    `;

    const results = await prisma.$queryRawUnsafe<any[]>(query, timeFilter, zip);
    console.log(`Found ${results.length} transcripts for Claude context`);

    // Build context summary (truncate transcripts to avoid token limits)
    const MAX_TRANSCRIPT_LENGTH = 2000;
    const transcriptSummaries = results.map((row, idx) => {
      const transcript = row.transcript.length > MAX_TRANSCRIPT_LENGTH
        ? row.transcript.substring(0, MAX_TRANSCRIPT_LENGTH) + '...[truncated]'
        : row.transcript;
      
      const startTime = new Date(row.startdatetime);
      const endTime = new Date(row.enddatetime);
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60) * 10) / 10;

      return `Call ${idx + 1} (ID: ${row.call_id}, Customer: ${row.customer_id}, Location: ${row.customer_location}, Duration: ${durationMinutes} min, Time: ${startTime.toLocaleString()}):\n${transcript}`;
    }).join('\n\n---\n\n');

    // Build system prompt
    const systemPrompt = `You are an AI assistant analyzing technical support call transcripts for a network outage in ZIP code ${zip}.

You have access to ${results.length} call transcript(s) from this outage. Your role is to:
- Answer questions about the calls based ONLY on the provided transcripts
- Identify patterns, common issues, or themes across multiple calls
- Provide specific examples and quote from transcripts when relevant
- Summarize key information when asked
- Be concise and factual

Here are the call transcripts:

${transcriptSummaries}

Remember: Only use information from these transcripts. If you don't have enough information to answer a question, say so clearly.`;

    // Prepare messages for Claude API
    const anthropicMessages = messages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role, // Claude doesn't have 'system' role in messages
      content: msg.content,
    }));

    // Call Anthropic API
    console.log('Calling Anthropic API with claude-haiku-4-5-20251001...');
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: systemPrompt,
        messages: anthropicMessages,
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API error:', errorText);
      return NextResponse.json(
        { error: 'AI service error', details: errorText },
        { status: anthropicResponse.status }
      );
    }

    const anthropicData = await anthropicResponse.json();
    const reply = anthropicData.content[0].text;

    return NextResponse.json({
      reply,
      contextUsed: {
        transcriptCount: results.length,
        zipCode: zip,
        timeRangeHours: hours,
      },
    });
  } catch (error) {
    console.error('Error in outage chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request', details: String(error) },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { CallTranscriptAnalysis, CallTranscriptAnalysisResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { callId, includeTranscript = false } = body;

    console.log(`📞 Received request to analyze call_id: ${callId}`);

    if (!callId) {
      console.error('❌ Error: callId is required');
      return NextResponse.json(
        { error: 'callId is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('❌ Error: Anthropic API key not configured');
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    console.log(`🔍 Analyzing call transcript for call_id ${callId} using Claude AI...`);

    // READ-ONLY: Fetch call data with transcript
    console.log(`📊 Fetching call data from database...`);
    const callData = await prisma.$queryRaw<any[]>`
      SELECT 
        cd.call_id,
        cd.customer_id,
        cd.startdatetime,
        cd.enddatetime,
        EXTRACT(EPOCH FROM (cd.enddatetime - cd.startdatetime)) / 60 as duration_minutes,
        td.call_reason,
        td.transcript,
        c.customer_name
      FROM team_thread_forge.call_data cd
      JOIN team_thread_forge.transcript_data td ON cd.call_id = td.call_id
      JOIN public.customers c ON cd.customer_id = c.customer_id
      WHERE cd.call_id = ${callId}
      LIMIT 1
    `;

    if (callData.length === 0) {
      console.error(`❌ Error: Call with ID ${callId} not found.`);
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      );
    }

    const call = callData[0];
    console.log(`✅ Call data retrieved for customer ${call.customer_name}`);

    // Prepare prompt for Claude
    console.log(`🤖 Preparing Claude API request...`);
    const prompt = `You are an expert customer service analyst. Analyze this customer support call transcript and provide detailed insights.

**Call Information:**
- Customer: ${call.customer_name}
- Call Date: ${new Date(call.startdatetime).toLocaleString()}
- Duration: ${Math.round(call.duration_minutes)} minutes
- Call Reason: ${call.call_reason}

**Transcript:**
${call.transcript}

Please provide a comprehensive analysis in the following JSON format:

{
  "sentimentAnalysis": {
    "overallScore": <number 0-100, where 0=very negative, 50=neutral, 100=very positive>,
    "sentiment": "<very_positive|positive|neutral|negative|very_negative>",
    "confidence": <number 0-1>,
    "emotionalTone": ["<array of emotions detected, e.g., frustrated, anxious, satisfied, angry, hopeful>"]
  },
  "churnLikelihood": {
    "score": <number 0-100, likelihood of customer churning>,
    "level": "<very_low|low|medium|high|critical>",
    "confidence": <number 0-1>,
    "reasoning": "<brief explanation of why this churn score was assigned>"
  },
  "keyInsights": {
    "mainIssues": ["<primary problems discussed>"],
    "customerConcerns": ["<what the customer is worried about>"],
    "positiveSignals": ["<any positive indicators or satisfaction points>"],
    "negativeSignals": ["<red flags or concerning statements>"],
    "urgency": "<low|medium|high>"
  },
  "recommendedActions": [
    {
      "action": "<specific action to take>",
      "priority": "<low|medium|high>",
      "rationale": "<why this action is recommended>"
    }
  ],
  "summary": "<2-3 sentence summary of the call>"
}

Focus on detecting:
1. Explicit churn signals (mentions of canceling, switching providers, dissatisfaction)
2. Emotional tone (frustration, anger, satisfaction, confusion)
3. Unresolved issues that might lead to churn
4. Positive aspects that indicate customer loyalty

Be objective and base your analysis strictly on the transcript content.`;

    // Call Claude API
    console.log(`🌐 Calling Claude API...`);
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error(`❌ Claude API error: ${claudeResponse.status}`, errorText);
      throw new Error(`Claude API request failed: ${claudeResponse.status} - ${errorText}`);
    }

    const claudeData = await claudeResponse.json();
    const analysisText = claudeData.content[0].text;
    console.log('📝 Raw Claude response content:', analysisText);

    // Parse Claude's response
    let analysis;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = analysisText.match(/```json\n?([\s\S]*?)\n?```/) || 
                        analysisText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : analysisText;
      analysis = JSON.parse(jsonText);
      console.log('✅ Parsed AI analysis successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse Claude response:', analysisText);
      console.error('Parse Error:', parseError);
      throw new Error(`Failed to parse AI analysis: ${String(parseError)}`);
    }

    // Construct the response
    const result: CallTranscriptAnalysis = {
      callId: call.call_id,
      customerId: call.customer_id,
      customerName: call.customer_name,
      callDate: new Date(call.startdatetime).toISOString(),
      duration: Math.round(call.duration_minutes),
      callReason: call.call_reason,
      sentimentAnalysis: analysis.sentimentAnalysis,
      churnLikelihood: analysis.churnLikelihood,
      keyInsights: analysis.keyInsights,
      recommendedActions: analysis.recommendedActions,
      summary: analysis.summary,
    };

    // Optionally include the full transcript
    if (includeTranscript) {
      result.transcript = call.transcript;
    }

    console.log(`✅ Call ${callId} analyzed: Sentiment=${result.sentimentAnalysis.sentiment}, Churn=${result.churnLikelihood.level}`);

    const response: CallTranscriptAnalysisResponse = {
      analysis: result,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in analyze-call-transcript API:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to analyze call transcript', 
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

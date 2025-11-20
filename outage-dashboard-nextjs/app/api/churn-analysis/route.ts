import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { loadSocialMediaData } from '@/lib/social-data-loader';
import type { ChurnAnalysis, ChurnSignal } from '@/types';

interface CallSentimentAnalysis {
  callId: number;
  callNumber: number;
  score: number; // 0-100
  sentiment: 'positive' | 'neutral' | 'negative' | 'very_negative';
  reasoning: string;
  churnIndicators: string[];
}

// Churn keywords to detect in transcripts
const CHURN_KEYWORDS = {
  high: ['cancel', 'canceling', 'disconnect', 'terminate', 'switching', 'competitor', 'terrible', 'worst', 'done', 'fed up'],
  medium: ['frustrated', 'upset', 'angry', 'disappointed', 'unhappy', 'problem', 'issue', 'complaint'],
  low: ['concerned', 'worried', 'question', 'wondering', 'confused'],
};

function detectChurnKeywords(transcript: string): { found: boolean; keywords: string[]; severity: 'low' | 'medium' | 'high' } {
  const lowerTranscript = transcript.toLowerCase();
  const foundKeywords: string[] = [];
  let highestSeverity: 'low' | 'medium' | 'high' = 'low';

  // Check for high severity keywords
  for (const keyword of CHURN_KEYWORDS.high) {
    if (lowerTranscript.includes(keyword)) {
      foundKeywords.push(keyword);
      highestSeverity = 'high';
    }
  }

  // Check for medium severity if no high found
  if (highestSeverity !== 'high') {
    for (const keyword of CHURN_KEYWORDS.medium) {
      if (lowerTranscript.includes(keyword)) {
        foundKeywords.push(keyword);
        highestSeverity = 'medium';
      }
    }
  }

  // Check for low severity if no medium or high found
  if (highestSeverity === 'low') {
    for (const keyword of CHURN_KEYWORDS.low) {
      if (lowerTranscript.includes(keyword)) {
        foundKeywords.push(keyword);
      }
    }
  }

  return {
    found: foundKeywords.length > 0,
    keywords: foundKeywords,
    severity: highestSeverity,
  };
}

function calculateRiskScore(signals: ChurnSignal[], callHistory: any): number {
  let score = 0;

  // Base score from churn signals
  signals.forEach(signal => {
    if (signal.severity === 'high') score += 30;
    else if (signal.severity === 'medium') score += 15;
    else score += 5;
  });

  // Adjust for call frequency (more technical calls = higher risk)
  if (callHistory.technicalCalls > 5) score += 20;
  else if (callHistory.technicalCalls > 3) score += 10;

  // Cap at 100
  return Math.min(100, score);
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// NEW: AI-powered sentiment analysis for all calls
async function analyzeCallsSentimentWithAI(calls: any[], apiKey: string): Promise<CallSentimentAnalysis[]> {
  if (!calls || calls.length === 0) {
    return [];
  }

  console.log(`🤖 Analyzing ${calls.length} calls with Claude AI...`);

  // Prepare batch prompt for Claude
  const callsContext = calls.map((call, index) => {
    const duration = Math.round((new Date(call.enddatetime).getTime() - new Date(call.startdatetime).getTime()) / 60000);
    return `
Call #${index + 1}:
- Call ID: ${call.call_id}
- Date: ${new Date(call.startdatetime).toLocaleString()}
- Duration: ${duration} minutes
- Reason: ${call.call_reason}
- Transcript: "${call.transcript.substring(0, 1500)}${call.transcript.length > 1500 ? '...' : ''}"
`;
  }).join('\n---\n');

  const prompt = `You are analyzing customer support call transcripts to assess sentiment and churn risk. 

Analyze each of the following ${calls.length} calls and provide a sentiment score and churn assessment for EACH call.

${callsContext}

For EACH call, provide analysis in this exact JSON format:

{
  "callAnalyses": [
    {
      "callNumber": 1,
      "score": <number 0-100, where 0=very negative, 50=neutral, 100=very positive>,
      "sentiment": "<positive|neutral|negative|very_negative>",
      "reasoning": "<1-2 sentence explanation of the sentiment>",
      "churnIndicators": ["<any specific churn signals detected, e.g., 'mentioned canceling', 'comparing to competitors'>"]
    }
  ]
}

Guidelines:
- Score 70-100: Customer is satisfied, issue resolved, positive tone
- Score 50-69: Neutral, routine inquiry, no strong emotions
- Score 30-49: Customer frustrated but issue being addressed
- Score 0-29: Very negative, angry, threatening to cancel

Return ONLY the JSON, no other text.`;

  try {
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      console.error('Claude API error:', await claudeResponse.text());
      throw new Error('Claude API request failed');
    }

    const claudeData = await claudeResponse.json();
    const analysisText = claudeData.content[0].text;

    // Parse Claude's response
    let parsedAnalysis;
    try {
      const jsonMatch = analysisText.match(/```json\n?([\s\S]*?)\n?```/) || 
                        analysisText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : analysisText;
      parsedAnalysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', analysisText);
      throw new Error('Failed to parse AI sentiment analysis');
    }

    // Map to our format with call IDs
    const sentimentAnalyses: CallSentimentAnalysis[] = parsedAnalysis.callAnalyses.map((analysis: any, index: number) => ({
      callId: calls[index].call_id,
      callNumber: index + 1,
      score: analysis.score,
      sentiment: analysis.sentiment,
      reasoning: analysis.reasoning,
      churnIndicators: analysis.churnIndicators || [],
    }));

    console.log(`✅ AI sentiment analysis complete: ${sentimentAnalyses.length} calls analyzed`);
    return sentimentAnalyses;

  } catch (error) {
    console.error('Error in AI sentiment analysis:', error);
    // Fallback to keyword-based analysis if AI fails
    console.log('⚠️ Falling back to keyword-based analysis');
    return calls.map((call, index) => {
      const keywords = detectChurnKeywords(call.transcript || '');
      let score = 75; // Default neutral-positive
      
      if (keywords.found) {
        if (keywords.severity === 'high') score = 25;
        else if (keywords.severity === 'medium') score = 50;
        else score = 65;
      }

      return {
        callId: call.call_id,
        callNumber: index + 1,
        score,
        sentiment: score >= 70 ? 'positive' : score >= 50 ? 'neutral' : score >= 30 ? 'negative' : 'very_negative',
        reasoning: keywords.found ? `Detected keywords: ${keywords.keywords.join(', ')}` : 'No significant sentiment detected',
        churnIndicators: keywords.found ? keywords.keywords : [],
      };
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, hours = 720, includeRetentionPlan = false } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    console.log(`Analyzing churn risk for customer ${customerId}...`);

    const timeFilter = new Date(Date.now() - hours * 60 * 60 * 1000);

    // READ-ONLY: Fetch customer data
    const customer = await prisma.customer.findUnique({
      where: { customer_id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // READ-ONLY: Fetch call history with transcripts
    const calls = await prisma.$queryRaw<any[]>`
      SELECT 
        cd.call_id,
        cd.startdatetime,
        cd.enddatetime,
        td.call_reason,
        td.transcript
      FROM team_thread_forge.call_data cd
      JOIN team_thread_forge.transcript_data td ON cd.call_id = td.call_id
      WHERE cd.customer_id = ${customerId}
        AND cd.startdatetime >= ${timeFilter}
      ORDER BY cd.startdatetime DESC
      LIMIT 50
    `;

    // Analyze call history
    const callHistory = {
      totalCalls: calls.length,
      technicalCalls: calls.filter(c => c.call_reason === 'technical_support').length,
      billingCalls: calls.filter(c => c.call_reason === 'billing_inquiry').length,
      recentCallDates: calls.slice(0, 5).map(c => c.startdatetime.toISOString()),
    };

    // Detect churn signals from transcripts
    const churnSignals: ChurnSignal[] = [];

    // Analyze transcripts for keywords
    calls.forEach(call => {
      const keywordAnalysis = detectChurnKeywords(call.transcript);
      if (keywordAnalysis.found) {
        churnSignals.push({
          type: 'transcript_keyword',
          severity: keywordAnalysis.severity,
          evidence: `Used words: "${keywordAnalysis.keywords.join('", "')}" in call about ${call.call_reason}`,
          timestamp: call.startdatetime.toISOString(),
          callId: call.call_id,
        });
      }
    });

    // Detect repeat issues
    const issuesByReason = calls.reduce((acc: any, call) => {
      acc[call.call_reason] = (acc[call.call_reason] || 0) + 1;
      return acc;
    }, {});

    Object.entries(issuesByReason).forEach(([reason, count]: [string, any]) => {
      if (count >= 3) {
        churnSignals.push({
          type: 'repeat_issue',
          severity: count >= 5 ? 'high' : 'medium',
          evidence: `${count} calls about ${reason.replace('_', ' ')} - possible unresolved problem`,
        });
      }
    });

    // Check for high call frequency (sign of frustration)
    if (callHistory.totalCalls >= 8) {
      churnSignals.push({
        type: 'call_frequency',
        severity: callHistory.totalCalls >= 12 ? 'high' : 'medium',
        evidence: `${callHistory.totalCalls} calls in ${hours} hours - unusually high contact frequency`,
      });
    }

    // Load social media data and correlate
    const socialData = loadSocialMediaData();
    const customerLocation = customer.location;
    
    // Try to find social media posts that might be from this customer (by location/context)
    const potentialSocialPosts = socialData.filter(post => {
      const postDate = new Date(post.timestamp);
      return postDate >= timeFilter && 
             post.location.includes(customerLocation) &&
             (post.category === 'Service Issue' || 
              post.category === 'Billing Issue' || 
              post.category === 'Customer Service Complaint');
    });

    if (potentialSocialPosts.length > 0) {
      churnSignals.push({
        type: 'social_negative',
        severity: potentialSocialPosts.length >= 3 ? 'high' : 'medium',
        evidence: `${potentialSocialPosts.length} negative social media posts from ${customerLocation} area match timeframe`,
        posts: potentialSocialPosts.slice(0, 3),
      });
    }

    // AI-powered sentiment analysis for all calls
    const apiKey = process.env.ANTHROPIC_API_KEY;
    let sentimentJourney = [];
    let aiChurnAnalysis = {
      overallReasoning: '',
      keyChurnFactors: [] as string[],
    };

    if (apiKey && calls.length > 0) {
      try {
        // Analyze ALL calls with Claude AI
        const aiSentimentAnalyses = await analyzeCallsSentimentWithAI(calls, apiKey);
        
        // Convert to sentiment journey format
        sentimentJourney = aiSentimentAnalyses.map((analysis, index) => ({
          callId: analysis.callId,
          callNumber: analysis.callNumber,
          date: calls.find(c => c.call_id === analysis.callId)?.startdatetime.toISOString().split('T')[0] || '',
          timestamp: calls.find(c => c.call_id === analysis.callId)?.startdatetime.toISOString() || '',
          score: analysis.score,
          sentiment: analysis.sentiment,
          aiReasoning: analysis.reasoning, // NEW: Add AI reasoning to each point
          churnIndicators: analysis.churnIndicators, // NEW: Add specific churn indicators
        }));

        // Extract churn signals from AI analysis
        aiSentimentAnalyses.forEach(analysis => {
          if (analysis.churnIndicators.length > 0 && analysis.score < 50) {
            churnSignals.push({
              type: 'transcript_keyword',
              severity: analysis.score < 30 ? 'high' : 'medium',
              evidence: `AI detected: ${analysis.churnIndicators.join(', ')} - ${analysis.reasoning}`,
              timestamp: calls.find(c => c.call_id === analysis.callId)?.startdatetime.toISOString(),
              callId: analysis.callId,
            });
          }
        });

        // Generate overall churn analysis using Claude
        const allChurnIndicators = aiSentimentAnalyses.flatMap(a => a.churnIndicators).filter(Boolean);
        if (allChurnIndicators.length > 0) {
          aiChurnAnalysis.keyChurnFactors = [...new Set(allChurnIndicators)]; // Unique factors
        }

        console.log(`✅ AI sentiment journey generated: ${sentimentJourney.length} calls analyzed`);
      } catch (error) {
        console.error('Failed to analyze calls with AI:', error);
        // Fallback to keyword-based if AI fails
        sentimentJourney = calculateSentimentJourney(calls);
      }
    } else {
      // Fallback to keyword-based if no API key
      console.log('⚠️ No API key found, using keyword-based sentiment analysis');
      sentimentJourney = calculateSentimentJourney(calls);
    }

    // Calculate risk score
    const riskScore = calculateRiskScore(churnSignals, callHistory);
    const riskLevel = getRiskLevel(riskScore);

    // Estimate account value (mock calculation)
    const accountValue = calculateAccountValue(customer.service_plan);

    // Generate overall call history analysis with Claude
    let overallCallAnalysis = null;
    // Reuse apiKey from above (already defined at line 331)
    if (apiKey && calls.length > 0) {
      try {
        console.log('🔍 Generating comprehensive call history analysis...');
        overallCallAnalysis = await generateOverallCallAnalysis(calls, customer, apiKey);
      } catch (error) {
        console.error('Failed to generate overall call analysis:', error);
      }
    }

    const analysis: ChurnAnalysis = {
      customer: {
        customerId: customer.customer_id,
        name: customer.customer_name,
        location: customer.location,
        accountValue,
        servicePlan: customer.service_plan,
        accountStatus: customer.account_status,
      },
      riskScore,
      riskLevel,
      churnSignals,
      sentimentJourney,
      overallCallAnalysis: overallCallAnalysis || undefined,
      callHistory,
    };

    // Generate retention strategy if requested and risk is medium/high
    if (includeRetentionPlan && (riskLevel === 'high' || riskLevel === 'medium')) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      
      if (apiKey) {
        try {
          const retentionStrategy = await generateRetentionStrategy(
            customer,
            churnSignals,
            callHistory,
            accountValue,
            apiKey
          );
          analysis.retentionStrategy = retentionStrategy;
        } catch (error) {
          console.error('Failed to generate retention strategy:', error);
        }
      }
    }

    console.log(`✅ Churn analysis complete for ${customerId}: Risk ${riskLevel} (${riskScore})`);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error in churn analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze churn risk', details: String(error) },
      { status: 500 }
    );
  }
}

function calculateSentimentJourney(calls: any[]) {
  if (!calls || calls.length === 0) {
    return [];
  }

  // Create one sentiment point per call (don't group by date)
  const sentimentPoints = calls.map((call, index) => {
    // Calculate sentiment based on keywords in this specific call
    let sentimentScore = 75; // Start neutral-positive
    
    const keywords = detectChurnKeywords(call.transcript || '');
    if (keywords.found) {
      if (keywords.severity === 'high') sentimentScore -= 30;
      else if (keywords.severity === 'medium') sentimentScore -= 15;
      else sentimentScore -= 5;
    } else {
      // No issues found - positive sentiment
      sentimentScore = 85;
    }

    sentimentScore = Math.max(0, Math.min(100, sentimentScore));

    let sentiment: 'positive' | 'neutral' | 'negative' | 'very_negative';
    if (sentimentScore >= 70) sentiment = 'positive';
    else if (sentimentScore >= 50) sentiment = 'neutral';
    else if (sentimentScore >= 30) sentiment = 'negative';
    else sentiment = 'very_negative';

    // Use full datetime for better granularity
    const datetime = call.startdatetime instanceof Date 
      ? call.startdatetime.toISOString()
      : new Date(call.startdatetime).toISOString();

    return { 
      date: datetime, 
      score: sentimentScore, 
      sentiment,
      callId: call.call_id,
      callNumber: index + 1
    };
  });

  // Sort by datetime (already sorted DESC from query, so reverse for chronological)
  sentimentPoints.reverse();

  console.log(`📊 Generated ${sentimentPoints.length} sentiment data points from ${calls.length} calls`);
  return sentimentPoints;
}

function calculateAccountValue(servicePlan: string): number {
  // Rough estimation based on service plan
  const planValues: Record<string, number> = {
    'enterprise': 5000,
    'business': 3000,
    'premium': 2000,
    'standard': 1200,
    'basic': 600,
  };

  const planLower = servicePlan.toLowerCase();
  for (const [key, value] of Object.entries(planValues)) {
    if (planLower.includes(key)) {
      return value;
    }
  }

  return 1200; // Default
}

async function generateOverallCallAnalysis(
  calls: any[],
  customer: any,
  apiKey: string
): Promise<any> {
  if (calls.length === 0) {
    return null;
  }

  // Prepare call history summary for Claude
  const callsSummary = calls.map((call, index) => {
    return `Call ${index + 1} - ${new Date(call.startdatetime).toLocaleDateString()}:
Reason: ${call.call_reason}
Duration: ${Math.round((new Date(call.enddatetime).getTime() - new Date(call.startdatetime).getTime()) / 60000)} minutes
Transcript: "${call.transcript.substring(0, 500)}${call.transcript.length > 500 ? '...' : ''}"`;
  }).join('\n\n---\n\n');

  const prompt = `You are an expert customer success analyst for a telecom company. Analyze this customer's complete call history to provide comprehensive insights about their overall experience, sentiment trends, and churn risk.

Customer: ${customer.customer_name}
Location: ${customer.location}
Service Plan: ${customer.service_plan}
Total Calls: ${calls.length}

COMPLETE CALL HISTORY:
${callsSummary}

Provide a comprehensive analysis in JSON format:

{
  "summary": "<2-3 sentence overview of the customer's overall experience and current state>",
  "keyThemes": ["<recurring theme 1>", "<recurring theme 2>", "<theme 3>"],
  "sentimentTrend": "<describe how sentiment has evolved across calls - improving, declining, stable, fluctuating>",
  "escalationPattern": "<describe if issues are escalating, recurring, resolving, or one-off>",
  "churnRiskFactors": ["<factor 1 that increases churn risk>", "<factor 2>"],
  "positiveIndicators": ["<positive sign 1>", "<positive sign 2>"],
  "recommendedActions": ["<action 1>", "<action 2>", "<action 3>"]
}

Focus on:
1. Patterns across multiple calls (not individual calls)
2. Evolution of issues over time
3. Customer's overall sentiment trajectory
4. Root causes that span multiple interactions
5. Specific, actionable insights`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error for overall analysis:', response.status, errorText);
      throw new Error(`Claude API failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Parse JSON from response
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    const analysis = JSON.parse(jsonText);
    
    console.log('✅ Overall call history analysis generated by Claude');
    return analysis;
  } catch (error) {
    console.error('Failed to generate overall call analysis:', error);
    return null;
  }
}

async function generateRetentionStrategy(
  customer: any,
  churnSignals: ChurnSignal[],
  callHistory: any,
  accountValue: number,
  apiKey: string
) {
  const signalsSummary = churnSignals.map(s => `- ${s.severity.toUpperCase()}: ${s.evidence}`).join('\n');

  const prompt = `You are a customer retention expert analyzing a telecom customer at risk of churning.

Customer Profile:
- Name: ${customer.customer_name}
- Service Plan: ${customer.service_plan}
- Location: ${customer.location}
- Account Value: $${accountValue}/year

Recent Activity:
- Total Calls: ${callHistory.totalCalls}
- Technical Support Calls: ${callHistory.technicalCalls}
- Billing Inquiry Calls: ${callHistory.billingCalls}

Churn Risk Signals:
${signalsSummary}

Based on this information, provide a retention strategy in JSON format with:
{
  "rootCause": "Brief explanation of the main reason for churn risk",
  "recommendedActions": ["List of 3-4 specific actions to take immediately"],
  "talkingPoints": ["List of 3-4 key points to mention when contacting customer"],
  "estimatedCost": <number: estimated cost of retention actions in dollars>,
  "customerLifetimeValue": ${accountValue * 3},
  "successProbability": <number between 0 and 1: probability of successful retention>
}

Focus on practical, actionable recommendations. Be empathetic and solution-oriented.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error('Claude API request failed');
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error('Failed to parse retention strategy from Claude response');
}


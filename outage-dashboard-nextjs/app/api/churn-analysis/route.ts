import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { loadSocialMediaData } from '@/lib/social-data-loader';
import type { ChurnAnalysis, ChurnSignal } from '@/types';

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

    // Calculate sentiment journey (mock based on call patterns)
    const sentimentJourney = calculateSentimentJourney(calls);

    // Calculate risk score
    const riskScore = calculateRiskScore(churnSignals, callHistory);
    const riskLevel = getRiskLevel(riskScore);

    // Estimate account value (mock calculation)
    const accountValue = calculateAccountValue(customer.service_plan);

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
  // Group calls by date and calculate sentiment
  const callsByDate = calls.reduce((acc: any, call) => {
    const date = call.startdatetime.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(call);
    return acc;
  }, {});

  return Object.entries(callsByDate)
    .map(([date, dateCalls]: [string, any]) => {
      // Calculate sentiment based on keywords
      let sentimentScore = 75; // Start neutral
      dateCalls.forEach((call: any) => {
        const keywords = detectChurnKeywords(call.transcript);
        if (keywords.severity === 'high') sentimentScore -= 30;
        else if (keywords.severity === 'medium') sentimentScore -= 15;
      });

      sentimentScore = Math.max(0, Math.min(100, sentimentScore));

      let sentiment: 'positive' | 'neutral' | 'negative' | 'very_negative';
      if (sentimentScore >= 70) sentiment = 'positive';
      else if (sentimentScore >= 50) sentiment = 'neutral';
      else if (sentimentScore >= 30) sentiment = 'negative';
      else sentiment = 'very_negative';

      return { date, score: sentimentScore, sentiment };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
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


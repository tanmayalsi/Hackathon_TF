import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { ChurnBatchAnalysisResponse, AtRiskCustomer } from '@/types';

// Import the churn detection logic (simplified version for batch)
const CHURN_KEYWORDS_HIGH = ['cancel', 'canceling', 'disconnect', 'terminate', 'switching', 'competitor', 'terrible', 'worst'];

function quickChurnCheck(transcript: string): number {
  const lowerTranscript = transcript.toLowerCase();
  let score = 0;
  
  for (const keyword of CHURN_KEYWORDS_HIGH) {
    if (lowerTranscript.includes(keyword)) {
      score += 25;
    }
  }
  
  return Math.min(score, 100);
}

function calculateAccountValue(servicePlan: string): number {
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

  return 1200;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hours = 720, riskThreshold = 'medium', limit = 50 } = body;

    console.log(`Starting batch churn analysis for last ${hours} hours...`);

    const timeFilter = new Date(Date.now() - hours * 60 * 60 * 1000);

    // READ-ONLY: Get only customers who have transcripts
    const callActivity = await prisma.$queryRaw<any[]>`
      SELECT 
        cd.customer_id,
        COUNT(DISTINCT cd.call_id) as total_calls,
        COUNT(DISTINCT CASE WHEN td.call_reason = 'technical_support' THEN cd.call_id END) as tech_calls,
        MAX(cd.startdatetime) as last_call,
        STRING_AGG(DISTINCT td.transcript, ' ||| ') as combined_transcripts
      FROM team_thread_forge.call_data cd
      JOIN team_thread_forge.transcript_data td ON cd.call_id = td.call_id
      WHERE cd.startdatetime >= ${timeFilter}
      GROUP BY cd.customer_id
      HAVING COUNT(DISTINCT cd.call_id) >= 1
    `;

    console.log(`Analyzing ${callActivity.length} customers with transcripts...`);

    // READ-ONLY: Get customer details for those with call activity
    const customerIds = callActivity.map(a => a.customer_id);
    const allCustomers = await prisma.customer.findMany({
      where: {
        customer_id: {
          in: customerIds
        }
      }
    });

    // Analyze each customer
    const customerRisks: AtRiskCustomer[] = [];

    for (const activity of callActivity) {
      const customer = allCustomers.find(c => c.customer_id === activity.customer_id);
      if (!customer) continue;

      let riskScore = 0;
      let primaryIssue = 'General concerns';

      // Check for churn keywords in transcripts
      const keywordScore = quickChurnCheck(activity.combined_transcripts || '');
      riskScore += keywordScore;

      // High call frequency (lowered threshold)
      if (activity.total_calls >= 5) {
        riskScore += 30;
        primaryIssue = `${activity.total_calls} calls in ${Math.floor(hours / 24)} days - high contact frequency`;
      }

      // Many technical calls (lowered threshold)
      if (activity.tech_calls >= 3) {
        riskScore += 35;
        primaryIssue = 'Recurring technical issues';
      }

      // Billing issues (inferred from non-technical calls)
      const billingCalls = activity.total_calls - activity.tech_calls;
      if (billingCalls >= 2) {
        riskScore += 25;
        primaryIssue = 'Billing concerns';
      }

      riskScore = Math.min(100, riskScore);

      let riskLevel: 'low' | 'medium' | 'high';
      if (riskScore >= 70) riskLevel = 'high';
      else if (riskScore >= 40) riskLevel = 'medium';
      else riskLevel = 'low';

      // Only include if meets threshold
      const thresholdScore = riskThreshold === 'high' ? 70 : riskThreshold === 'medium' ? 40 : 0;
      if (riskScore >= thresholdScore) {
        customerRisks.push({
          customerId: customer.customer_id,
          name: customer.customer_name,
          riskScore,
          riskLevel,
          primaryIssue,
          accountValue: calculateAccountValue(customer.service_plan),
          lastActivity: activity.last_call.toISOString(),
          location: customer.location,
        });
      }
    }

    // Sort by risk score (highest first)
    customerRisks.sort((a, b) => b.riskScore - a.riskScore);

    // Apply limit
    const limitedRisks = customerRisks.slice(0, limit);

    // Calculate summary stats
    const summary = {
      totalCustomers: allCustomers.length,
      analyzed: callActivity.length,
      highRisk: customerRisks.filter(c => c.riskLevel === 'high').length,
      mediumRisk: customerRisks.filter(c => c.riskLevel === 'medium').length,
      lowRisk: customerRisks.filter(c => c.riskLevel === 'low').length,
      totalRevAtRisk: customerRisks
        .filter(c => c.riskLevel === 'high' || c.riskLevel === 'medium')
        .reduce((sum, c) => sum + c.accountValue, 0),
    };

    const response: ChurnBatchAnalysisResponse = {
      summary,
      atRiskCustomers: limitedRisks,
      generatedAt: new Date().toISOString(),
    };

    console.log(`✅ Batch analysis complete: ${summary.highRisk} high risk, ${summary.mediumRisk} medium risk`);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in batch churn analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze customers', details: String(error) },
      { status: 500 }
    );
  }
}


// Outage data types
export interface OutageData {
  zip: string;
  count: number;
  avgDuration: number;
  coordinates: [number, number];
  customerIds: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface TimelineData {
  timestamp: string;
  callCount: number;
}

export interface Stats {
  totalCalls: number;
  uniqueCustomers: number;
  avgDuration: number;
  lastCallTime: string;
}

export interface OutageTranscript {
  call_id: number;
  customer_id: string;
  call_reason: string;
  transcript: string;
  startdatetime: Date;
  enddatetime: Date;
  customer_name: string;
  location: string;
  duration_minutes: number;
}

// Social Media types
export interface SocialMediaPost {
  id: number;
  username: string;
  social_media: string;
  comment: string;
  location: string;
  timestamp: string;
  category: string;
}

export interface SocialMediaDataResponse {
  data: SocialMediaPost[];
  total: number;
  page: number;
  pageSize: number;
  timestamp: string;
}

export interface SentimentDataPoint {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
}

export interface CategoryCount {
  category: string;
  count: number;
  percentage: number;
}

export interface LocationSentiment {
  location: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export interface PlatformCount {
  platform: string;
  count: number;
}

export interface SentimentDataResponse {
  timeSeries: SentimentDataPoint[];
  categoryBreakdown: CategoryCount[];
  locationSentiment: LocationSentiment[];
  platformDistribution: PlatformCount[];
  overallSentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  department: 'customer_service' | 'technical' | 'pr' | 'sales' | 'product';
  estimatedImpact: string;
  relatedPostIds: number[];
  relatedPosts?: SocialMediaPost[];
  status: 'pending' | 'in_progress' | 'done' | 'dismissed';
}

export interface ActionItemsResponse {
  actionItems: ActionItem[];
  generatedAt: string;
  postsAnalyzed: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SocialChatRequest {
  messages: ChatMessage[];
  filters?: {
    platform?: string;
    category?: string;
    location?: string;
    hours?: number;
  };
}

export interface SocialChatResponse {
  reply: string;
  contextUsed: {
    postCount: number;
    timeRangeHours: number;
  };
}

export interface ResponseDraft {
  postId: number;
  originalPost: {
    username: string;
    platform: string;
    comment: string;
  };
  suggestedResponse: string;
  tone: string;
  keyPoints: string[];
}

export interface ResponseGeneratorRequest {
  postIds: number[];
  tone: 'professional' | 'friendly' | 'apologetic' | 'promotional';
  template?: string;
}

export interface ResponseGeneratorResponse {
  responses: ResponseDraft[];
  generatedAt: string;
}

// Churn Analysis types
export interface ChurnSignal {
  type: 'transcript_keyword' | 'repeat_issue' | 'social_negative' | 'sentiment_decline' | 'call_frequency';
  severity: 'low' | 'medium' | 'high';
  evidence: string;
  timestamp?: string;
  callId?: number;
  posts?: SocialMediaPost[];
}

export interface RetentionStrategy {
  rootCause: string;
  recommendedActions: string[];
  talkingPoints: string[];
  estimatedCost: number;
  customerLifetimeValue: number;
  successProbability: number;
}

export interface ChurnAnalysis {
  customer: {
    customerId: string;
    name: string;
    location: string;
    accountValue: number;
    servicePlan?: string;
    accountStatus?: string;
  };
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  churnSignals: ChurnSignal[];
  sentimentJourney: Array<{
    callId: number;
    callNumber: number;
    date: string;
    timestamp: string;
    score: number;
    sentiment: 'positive' | 'neutral' | 'negative' | 'very_negative';
    aiReasoning?: string; // NEW: AI's explanation for this sentiment
    churnIndicators?: string[]; // NEW: Specific churn signals detected by AI
  }>;
  retentionStrategy?: RetentionStrategy;
  callHistory: {
    totalCalls: number;
    technicalCalls: number;
    billingCalls: number;
    recentCallDates: string[];
  };
}

export interface AtRiskCustomer {
  customerId: string;
  name: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  primaryIssue: string;
  accountValue: number;
  lastActivity: string;
  location: string;
}

export interface ChurnBatchAnalysisResponse {
  summary: {
    totalCustomers: number;
    analyzed: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    totalRevAtRisk: number;
  };
  atRiskCustomers: AtRiskCustomer[];
  generatedAt: string;
}

export interface ChurnInsightsResponse {
  topChurnReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  geographicPatterns: Array<{
    location: string;
    highRiskCount: number;
    mediumRiskCount: number;
    avgRiskScore: number;
  }>;
  trends: {
    weekOverWeek: {
      change: string;
      direction: 'increasing' | 'decreasing' | 'stable';
    };
    prediction: string;
  };
  recommendations: string[];
  timeRangeHours: number;
}

// NEW: Deep Call Analysis types
export interface CallTranscriptAnalysis {
  callId: number;
  customerId: string;
  customerName: string;
  callDate: string;
  duration: number;
  callReason: string;
  
  // AI-powered sentiment analysis
  sentimentAnalysis: {
    overallScore: number; // 0-100
    sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
    confidence: number; // 0-1
    emotionalTone: string[]; // e.g., ['frustrated', 'anxious', 'hopeful']
  };
  
  // AI-powered churn prediction
  churnLikelihood: {
    score: number; // 0-100
    level: 'very_low' | 'low' | 'medium' | 'high' | 'critical';
    confidence: number; // 0-1
    reasoning: string;
  };
  
  // Key insights from Claude
  keyInsights: {
    mainIssues: string[];
    customerConcerns: string[];
    positiveSignals: string[];
    negativeSignals: string[];
    urgency: 'low' | 'medium' | 'high';
  };
  
  // Recommended actions
  recommendedActions: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    rationale: string;
  }>;
  
  // Transcript summary
  summary: string;
  
  // Raw transcript (optional)
  transcript?: string;
}

export interface CallTranscriptAnalysisRequest {
  callId: number;
  includeTranscript?: boolean;
}

export interface CallTranscriptAnalysisResponse {
  analysis: CallTranscriptAnalysis;
  generatedAt: string;
}

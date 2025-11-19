// Database types
export interface CallData {
  call_id: number;
  customer_id: string;
  startdatetime: Date;
  enddatetime: Date;
}

export interface TranscriptData {
  call_id: number;
  customer_id: string;
  call_reason: string;
  transcript: string;
}

export interface Customer {
  customer_id: string;
  customer_name: string;
  service_plan: string;
  service_address: string;
  provisioned_bandwidth_down_mbps: number;
  provisioned_bandwidth_up_mbps: number;
  router_serial_number: string;
  account_status: string;
  email: string;
  location: string; // ZIP code
  created_at: Date;
  updated_at: Date;
  contact_phone: string;
  multi_site: boolean;
  subscription_tier: string;
  industry: string;
}

// API Response types
export interface ZipCoordinate {
  lat: number;
  lon: number;
  city: string;
}

export interface OutageDataPoint {
  zip_code: string;
  call_count: number;
  avg_duration: number;
  coordinates: ZipCoordinate;
  customer_ids: string[];
}

export interface OutageDataResponse {
  data: OutageDataPoint[];
  timestamp: string;
  time_range_hours: number;
}

export interface TimelineDataPoint {
  timestamp: string;
  call_count: number;
  hour_label: string;
}

export interface TimelineDataResponse {
  data: TimelineDataPoint[];
  time_range_hours: number;
}

export interface StatsResponse {
  total_calls: number;
  unique_customers: number;
  avg_duration_minutes: number;
  last_call_time: string | null;
  time_range_hours: number;
}

// Component Props types
export interface TimeRangeOption {
  label: string;
  hours: number;
}

export interface MapMarkerData {
  position: [number, number];
  zipCode: string;
  callCount: number;
  avgDuration: number;
  city: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
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
  total: number;
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
  percentage: number;
}

export interface SentimentDataResponse {
  timeSeriesData: SentimentDataPoint[];
  categoryBreakdown: CategoryCount[];
  locationSentiment: LocationSentiment[];
  platformDistribution: PlatformCount[];
  overallStats: {
    totalPosts: number;
    positivePercentage: number;
    negativePercentage: number;
    neutralPercentage: number;
  };
  timeRangeHours: number;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  department: 'Sales' | 'Support' | 'PR' | 'Tech';
  relatedPostIds: number[];
  relatedPosts?: SocialMediaPost[];
  status?: 'pending' | 'done' | 'dismissed';
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
  originalComment: string;
  draftResponse: string;
  tone: string;
}

export interface ResponseGeneratorRequest {
  postIds: number[];
  tone?: 'professional' | 'empathetic' | 'promotional';
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
    date: string;
    score: number;
    sentiment: 'positive' | 'neutral' | 'negative' | 'very_negative';
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

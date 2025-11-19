'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ChurnAnalysis,
  ChurnBatchAnalysisResponse,
  ChurnInsightsResponse,
} from '@/types';

interface ChurnAnalysisRequest {
  customerId: string;
  hours?: number;
  includeRetentionPlan?: boolean;
}

interface ChurnBatchRequest {
  hours?: number;
  riskThreshold?: 'low' | 'medium' | 'high';
  limit?: number;
}

export function useChurnAnalysis(customerId: string | null, hours: number = 720) {
  return useQuery({
    queryKey: ['churn-analysis', customerId, hours],
    queryFn: async (): Promise<ChurnAnalysis> => {
      if (!customerId) {
        throw new Error('Customer ID is required');
      }
      const response = await fetch('/api/churn-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          hours,
          includeRetentionPlan: true,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch churn analysis');
      }
      return response.json();
    },
    enabled: !!customerId, // Only run if customerId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBatchChurnAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ChurnBatchRequest = {}): Promise<ChurnBatchAnalysisResponse> => {
      const response = await fetch('/api/churn-batch-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze customers');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Cache the result
      queryClient.setQueryData(['batch-churn-analysis'], data);
    },
  });
}

export function useBatchChurnData() {
  return useQuery<ChurnBatchAnalysisResponse | null>({
    queryKey: ['batch-churn-analysis'],
    queryFn: () => null, // Start with no data, trigger via mutation
    staleTime: Infinity, // Don't auto-refetch, only via manual generation
  });
}

export function useChurnInsights(hours: number = 720) {
  return useQuery({
    queryKey: ['churn-insights', hours],
    queryFn: async (): Promise<ChurnInsightsResponse> => {
      const response = await fetch(`/api/churn-insights?hours=${hours}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch churn insights');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGenerateRetentionPlan() {
  return useMutation({
    mutationFn: async (request: ChurnAnalysisRequest): Promise<ChurnAnalysis> => {
      const response = await fetch('/api/churn-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          includeRetentionPlan: true,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate retention plan');
      }
      return response.json();
    },
  });
}


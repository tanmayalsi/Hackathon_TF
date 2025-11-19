'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  SocialMediaDataResponse,
  SentimentDataResponse,
  ActionItemsResponse,
  SocialChatResponse,
  ResponseGeneratorResponse,
  SocialChatRequest,
  ResponseGeneratorRequest,
} from '@/types';

interface SocialMediaFilters {
  platform?: string;
  category?: string;
  location?: string;
  hours?: number;
  page?: number;
  pageSize?: number;
  search?: string;
}

export function useSocialMediaData(filters: SocialMediaFilters) {
  const queryParams = new URLSearchParams();
  
  if (filters.platform) queryParams.append('platform', filters.platform);
  if (filters.category) queryParams.append('category', filters.category);
  if (filters.location) queryParams.append('location', filters.location);
  if (filters.hours) queryParams.append('hours', filters.hours.toString());
  if (filters.page) queryParams.append('page', filters.page.toString());
  if (filters.pageSize) queryParams.append('pageSize', filters.pageSize.toString());
  if (filters.search) queryParams.append('search', filters.search);

  return useQuery({
    queryKey: ['social-media-data', filters],
    queryFn: async (): Promise<SocialMediaDataResponse> => {
      const response = await fetch(`/api/social-media-data?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch social media data');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 50000,
  });
}

export function useSentimentData(hours: number = 168) {
  return useQuery({
    queryKey: ['social-sentiment', hours],
    queryFn: async (): Promise<SentimentDataResponse> => {
      const response = await fetch(`/api/social-sentiment?hours=${hours}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sentiment data');
      }
      return response.json();
    },
    refetchInterval: 60000,
    staleTime: 50000,
  });
}

export function useGenerateActionItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hours: number = 168): Promise<ActionItemsResponse> => {
      const response = await fetch('/api/social-action-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hours }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate action items');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Cache the result
      queryClient.setQueryData(['action-items'], data);
    },
  });
}

export function useActionItems() {
  return useQuery<ActionItemsResponse | null>({
    queryKey: ['action-items'],
    queryFn: () => null, // Start with no data, trigger via mutation
    staleTime: Infinity, // Don't auto-refetch, only via manual generation
  });
}

export function useSocialChat() {
  return useMutation({
    mutationFn: async (request: SocialChatRequest): Promise<SocialChatResponse> => {
      const response = await fetch('/api/social-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        throw new Error('Failed to get chat response');
      }
      return response.json();
    },
  });
}

export function useGenerateResponses() {
  return useMutation({
    mutationFn: async (request: ResponseGeneratorRequest): Promise<ResponseGeneratorResponse> => {
      const response = await fetch('/api/social-response-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        throw new Error('Failed to generate responses');
      }
      return response.json();
    },
  });
}


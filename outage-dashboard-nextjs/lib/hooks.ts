'use client';

import { useQuery } from '@tanstack/react-query';
import type { OutageDataResponse, TimelineDataResponse, StatsResponse } from '@/types';

async function fetchAPI<T>(endpoint: string, hours: number): Promise<T> {
  const response = await fetch(`/api/${endpoint}?hours=${hours}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}`);
  }
  return response.json();
}

export function useOutageData(hours: number) {
  return useQuery({
    queryKey: ['outage-data', hours],
    queryFn: () => fetchAPI<OutageDataResponse>('outage-data', hours),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 25000,
  });
}

export function useTimelineData(hours: number) {
  return useQuery({
    queryKey: ['timeline-data', hours],
    queryFn: () => fetchAPI<TimelineDataResponse>('timeline-data', hours),
    refetchInterval: 30000,
    staleTime: 25000,
  });
}

export function useStats(hours: number) {
  return useQuery({
    queryKey: ['stats', hours],
    queryFn: () => fetchAPI<StatsResponse>('stats', hours),
    refetchInterval: 30000,
    staleTime: 25000,
  });
}

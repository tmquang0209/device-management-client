"use client";

import {
  dashboardApi,
  type EntityCounts,
  type RecentActivity,
} from "@/shared/data/dashboard.api";
import { useQuery } from "@tanstack/react-query";

export type { EntityCounts, RecentActivity };

export function useAdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardApi.getStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    counts: data?.counts || null,
    activities: data?.recent || [],
    loading: isLoading,
    error: error?.message || null,
  } as const;
}

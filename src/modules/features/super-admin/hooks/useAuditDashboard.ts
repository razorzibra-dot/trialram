/**
 * Audit Dashboard Hooks - React Query Integration
 * Layer 7: Custom hooks for audit dashboard data fetching and management
 * 
 * Provides React Query hooks with caching, state management, and error handling
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { auditDashboardServiceModule } from '../services/auditDashboardService';
import {
  AuditDashboardMetrics,
  ActionByType,
  ActionByUser,
  TimelineEvent,
  AuditDashboardData,
} from '@/types';
import { message } from 'antd';

/**
 * Cache key factory for hierarchical cache management
 */
export const auditDashboardKeys = {
  all: ['auditDashboard'] as const,
  metrics: () => [...auditDashboardKeys.all, 'metrics'] as const,
  metricsWithDateRange: (from: string, to: string) =>
    [...auditDashboardKeys.metrics(), from, to] as const,
  actionsByType: () => [...auditDashboardKeys.all, 'actionsByType'] as const,
  actionsByTypeWithDateRange: (from: string, to: string) =>
    [...auditDashboardKeys.actionsByType(), from, to] as const,
  actionsByUser: () => [...auditDashboardKeys.all, 'actionsByUser'] as const,
  actionsByUserWithDateRange: (from: string, to: string, limit?: number) =>
    [...auditDashboardKeys.actionsByUser(), from, to, limit] as const,
  timeline: () => [...auditDashboardKeys.all, 'timeline'] as const,
  timelineWithDateRange: (from: string, to: string, limit?: number) =>
    [...auditDashboardKeys.timeline(), from, to, limit] as const,
  topUnauthorized: () => [...auditDashboardKeys.all, 'topUnauthorized'] as const,
  topUnauthorizedWithDateRange: (from: string, to: string, limit?: number) =>
    [...auditDashboardKeys.topUnauthorized(), from, to, limit] as const,
  dashboardData: () => [...auditDashboardKeys.all, 'dashboardData'] as const,
  dashboardDataWithDateRange: (from: string, to: string) =>
    [...auditDashboardKeys.dashboardData(), from, to] as const,
};

/**
 * Hook: Fetch dashboard metrics
 */
export function useDashboardMetrics(dateFrom: string, dateTo: string, tenantId?: string) {
  return useQuery({
    queryKey: [...auditDashboardKeys.metricsWithDateRange(dateFrom, dateTo), tenantId],
    queryFn: () => auditDashboardServiceModule.getDashboardMetrics(dateFrom, dateTo, tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook: Fetch actions by type
 */
export function useActionsByType(dateFrom: string, dateTo: string, tenantId?: string) {
  return useQuery({
    queryKey: [...auditDashboardKeys.actionsByTypeWithDateRange(dateFrom, dateTo), tenantId],
    queryFn: () => auditDashboardServiceModule.getActionsByType(dateFrom, dateTo, tenantId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook: Fetch actions by user
 */
export function useActionsByUser(
  dateFrom: string,
  dateTo: string,
  limit: number = 10,
  tenantId?: string
) {
  return useQuery({
    queryKey: [...auditDashboardKeys.actionsByUserWithDateRange(dateFrom, dateTo, limit), tenantId],
    queryFn: () => auditDashboardServiceModule.getActionsByUser(dateFrom, dateTo, limit, tenantId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook: Fetch timeline events
 */
export function useTimeline(
  dateFrom: string,
  dateTo: string,
  limit: number = 50,
  tenantId?: string
) {
  return useQuery({
    queryKey: [...auditDashboardKeys.timelineWithDateRange(dateFrom, dateTo, limit), tenantId],
    queryFn: () => auditDashboardServiceModule.getTimeline(dateFrom, dateTo, limit, tenantId),
    staleTime: 3 * 60 * 1000, // 3 minutes (fresher than other data)
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook: Fetch top unauthorized users
 */
export function useTopUnauthorizedUsers(
  dateFrom: string,
  dateTo: string,
  limit: number = 5,
  tenantId?: string
) {
  return useQuery({
    queryKey: [...auditDashboardKeys.topUnauthorizedWithDateRange(dateFrom, dateTo, limit), tenantId],
    queryFn: () => auditDashboardServiceModule.getTopUnauthorizedUsers(dateFrom, dateTo, limit, tenantId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook: Fetch complete dashboard data
 */
export function useDashboardData(dateFrom: string, dateTo: string, tenantId?: string) {
  return useQuery({
    queryKey: [...auditDashboardKeys.dashboardDataWithDateRange(dateFrom, dateTo), tenantId],
    queryFn: () => auditDashboardServiceModule.getDashboardData(dateFrom, dateTo, tenantId),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000, // Longer cache for complete data
  });
}

/**
 * Hook: Get dashboard data for last N days
 */
export function useDashboardDataLastDays(days: number = 7, tenantId?: string) {
  return useQuery({
    queryKey: [...auditDashboardKeys.all, 'lastDays', days, tenantId],
    queryFn: () => auditDashboardServiceModule.getDashboardDataLastDays(days, tenantId),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Hook: Get dashboard data for current month
 */
export function useDashboardDataCurrentMonth(tenantId?: string) {
  return useQuery({
    queryKey: [...auditDashboardKeys.all, 'currentMonth', tenantId],
    queryFn: () => auditDashboardServiceModule.getDashboardDataCurrentMonth(tenantId),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Hook: Get high severity events
 */
export function useHighSeverityEvents(
  dateFrom: string,
  dateTo: string,
  tenantId?: string
) {
  return useQuery({
    queryKey: [...auditDashboardKeys.all, 'highSeverity', dateFrom, dateTo, tenantId],
    queryFn: () => auditDashboardServiceModule.getHighSeverityEvents(dateFrom, dateTo, tenantId),
    staleTime: 2 * 60 * 1000, // 2 minutes (high severity data refreshes more frequently)
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Combined hook: Dashboard with metrics, timeline, and user actions
 */
export function useAuditDashboard(dateFrom: string, dateTo: string, tenantId?: string) {
  const metricsQuery = useDashboardMetrics(dateFrom, dateTo, tenantId);
  const timelineQuery = useTimeline(dateFrom, dateTo, 50, tenantId);
  const usersQuery = useActionsByUser(dateFrom, dateTo, 10, tenantId);
  const highSeverityQuery = useHighSeverityEvents(dateFrom, dateTo, tenantId);

  return {
    metrics: metricsQuery.data,
    timeline: timelineQuery.data,
    topUsers: usersQuery.data,
    highSeverityEvents: highSeverityQuery.data,
    isLoading: metricsQuery.isLoading || timelineQuery.isLoading || usersQuery.isLoading,
    isError: metricsQuery.isError || timelineQuery.isError || usersQuery.isError,
    error: metricsQuery.error || timelineQuery.error || usersQuery.error,
    isFetching:
      metricsQuery.isFetching ||
      timelineQuery.isFetching ||
      usersQuery.isFetching ||
      highSeverityQuery.isFetching,
  };
}

/**
 * Combined hook: All dashboard visualizations
 */
export function useDashboardVisualizations(dateFrom: string, dateTo: string, tenantId?: string) {
  const metricsQuery = useDashboardMetrics(dateFrom, dateTo, tenantId);
  const actionsByTypeQuery = useActionsByType(dateFrom, dateTo, tenantId);
  const actionsByUserQuery = useActionsByUser(dateFrom, dateTo, 10, tenantId);
  const unauthorizedQuery = useTopUnauthorizedUsers(dateFrom, dateTo, 5, tenantId);

  return {
    metrics: metricsQuery.data,
    actionsByType: actionsByTypeQuery.data,
    actionsByUser: actionsByUserQuery.data,
    topUnauthorized: unauthorizedQuery.data,
    isLoading:
      metricsQuery.isLoading ||
      actionsByTypeQuery.isLoading ||
      actionsByUserQuery.isLoading ||
      unauthorizedQuery.isLoading,
    isError:
      metricsQuery.isError ||
      actionsByTypeQuery.isError ||
      actionsByUserQuery.isError ||
      unauthorizedQuery.isError,
    error: metricsQuery.error || actionsByTypeQuery.error || actionsByUserQuery.error,
  };
}

/**
 * Hook: Use query client for manual cache management
 */
export function useAuditDashboardCache() {
  const queryClient = useQueryClient();

  return {
    invalidateMetrics: (dateFrom?: string, dateTo?: string) => {
      if (dateFrom && dateTo) {
        queryClient.invalidateQueries({
          queryKey: auditDashboardKeys.metricsWithDateRange(dateFrom, dateTo),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: auditDashboardKeys.metrics() });
      }
    },
    invalidateActionsByType: (dateFrom?: string, dateTo?: string) => {
      if (dateFrom && dateTo) {
        queryClient.invalidateQueries({
          queryKey: auditDashboardKeys.actionsByTypeWithDateRange(dateFrom, dateTo),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: auditDashboardKeys.actionsByType() });
      }
    },
    invalidateTimeline: (dateFrom?: string, dateTo?: string) => {
      if (dateFrom && dateTo) {
        queryClient.invalidateQueries({
          queryKey: auditDashboardKeys.timelineWithDateRange(dateFrom, dateTo),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: auditDashboardKeys.timeline() });
      }
    },
    invalidateDashboard: () => {
      queryClient.invalidateQueries({ queryKey: auditDashboardKeys.all });
    },
    prefetchDashboardData: (dateFrom: string, dateTo: string, tenantId?: string) => {
      return queryClient.prefetchQuery({
        queryKey: [...auditDashboardKeys.dashboardDataWithDateRange(dateFrom, dateTo), tenantId],
        queryFn: () => auditDashboardServiceModule.getDashboardData(dateFrom, dateTo, tenantId),
        staleTime: 5 * 60 * 1000,
      });
    },
  };
}
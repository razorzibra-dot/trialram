/**
 * Dashboard Hooks
 * React hooks for dashboard operations using React Query
 */

import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '../services/dashboardService';
import { useService } from '@/modules/core/hooks/useService';

// Query Keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  activity: () => [...dashboardKeys.all, 'activity'] as const,
  salesTrend: () => [...dashboardKeys.all, 'salesTrend'] as const,
  ticketStats: () => [...dashboardKeys.all, 'ticketStats'] as const,
  topCustomers: () => [...dashboardKeys.all, 'topCustomers'] as const,
  widget: (type: string) => [...dashboardKeys.all, 'widget', type] as const,
  performance: () => [...dashboardKeys.all, 'performance'] as const,
};

/**
 * Hook for fetching dashboard statistics
 */
export const useDashboardStats = () => {
  const dashboardService = useService<DashboardService>('dashboardService');

  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardService.getDashboardStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for fetching recent activity
 */
export const useRecentActivity = (limit: number = 10) => {
  const dashboardService = useService<DashboardService>('dashboardService');

  return useQuery({
    queryKey: [...dashboardKeys.activity(), limit],
    queryFn: () => dashboardService.getRecentActivity(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook for fetching sales trend
 */
export const useSalesTrend = (period: 'week' | 'month' | 'quarter' | 'year' = 'month') => {
  const dashboardService = useService<DashboardService>('dashboardService');

  return useQuery({
    queryKey: [...dashboardKeys.salesTrend(), period],
    queryFn: () => dashboardService.getSalesTrend(period),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for fetching ticket statistics
 */
export const useTicketStats = () => {
  const dashboardService = useService<DashboardService>('dashboardService');

  return useQuery({
    queryKey: dashboardKeys.ticketStats(),
    queryFn: () => dashboardService.getTicketStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching top customers
 */
export const useTopCustomers = (limit: number = 5) => {
  const dashboardService = useService<DashboardService>('dashboardService');

  return useQuery({
    queryKey: [...dashboardKeys.topCustomers(), limit],
    queryFn: () => dashboardService.getTopCustomers(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for fetching widget data
 */
export const useWidgetData = (widgetType: string) => {
  const dashboardService = useService<DashboardService>('dashboardService');

  return useQuery({
    queryKey: dashboardKeys.widget(widgetType),
    queryFn: () => dashboardService.getWidgetData(widgetType),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!widgetType,
  });
};

/**
 * Hook for fetching sales pipeline
 */
export const useSalesPipeline = () => {
  const dashboardService = useService<DashboardService>('dashboardService');

  return useQuery({
    queryKey: [...dashboardKeys.all, 'salesPipeline'],
    queryFn: () => dashboardService.getSalesPipeline(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for fetching performance metrics
 */
export const usePerformanceMetrics = () => {
  const dashboardService = useService<DashboardService>('dashboardService');

  return useQuery({
    queryKey: dashboardKeys.performance(),
    queryFn: () => dashboardService.getPerformanceMetrics(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

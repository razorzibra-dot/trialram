/**
 * Dashboard Hooks
 * React hooks for dashboard operations using React Query
 * Aggregates data from multiple services instead of using a dedicated dashboard service
 */

import { useQuery } from '@tanstack/react-query';
import { useService } from '@/modules/core/hooks/useService';
import { useTenantContext } from '@/hooks/useTenantContext';
import { STATS_QUERY_CONFIG, LISTS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';
import type { ICustomerService } from '@/modules/features/customers/services/customerService';
import type { ISalesService } from '@/modules/features/sales/services/salesService';

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
 * Aggregates stats from customers, sales, and tickets services
 */
export const useDashboardStats = () => {
  const customerService = useService<ICustomerService>('customerService');
  const salesService = useService<ISalesService>('salesService');
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      // Fetch stats from all services in parallel
      const [customerStats, salesStats] = await Promise.allSettled([
        customerService.getCustomerStats(),
        salesService.getSalesStats(),
      ]);

      // Aggregate the results
      const stats = {
        totalCustomers: customerStats.status === 'fulfilled' ? customerStats.value.total : 0,
        totalDeals: salesStats.status === 'fulfilled' ? salesStats.value.total : 0,
        totalTickets: 0, // Placeholder - tickets service doesn't have getTicketStats
        totalRevenue: salesStats.status === 'fulfilled' ? salesStats.value.totalValue : 0,
      };

      return stats;
    },
    ...STATS_QUERY_CONFIG,
    enabled: isInitialized,
  });
};

/**
 * Hook for fetching recent activity
 * Placeholder implementation - returns empty array
 */
export const useRecentActivity = (limit: number = 10) => {
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: [...dashboardKeys.activity(), limit],
    queryFn: () => Promise.resolve([]), // Placeholder
    ...LISTS_QUERY_CONFIG,
    enabled: isInitialized,
  });
};

/**
 * Hook for fetching sales trend
 * Placeholder implementation
 */
export const useSalesTrend = (period: 'week' | 'month' | 'quarter' | 'year' = 'month') => {
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: [...dashboardKeys.salesTrend(), period],
    queryFn: () => Promise.resolve([]), // Placeholder
    ...STATS_QUERY_CONFIG,
    enabled: isInitialized,
  });
};

/**
 * Hook for fetching ticket statistics
 * Placeholder implementation
 */
export const useTicketStats = () => {
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: dashboardKeys.ticketStats(),
    queryFn: () => Promise.resolve({
      open: 0,
      resolved: 0,
      inProgress: 0,
      closed: 0,
      resolutionRate: 0,
    }),
    ...STATS_QUERY_CONFIG,
    enabled: isInitialized,
  });
};

/**
 * Hook for fetching top customers
 * Placeholder implementation
 */
export const useTopCustomers = (limit: number = 5) => {
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: [...dashboardKeys.topCustomers(), limit],
    queryFn: () => Promise.resolve([]), // Placeholder
    ...STATS_QUERY_CONFIG,
    enabled: isInitialized,
  });
};

/**
 * Hook for fetching widget data
 * Placeholder implementation
 */
export const useWidgetData = (widgetType: string) => {
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: dashboardKeys.widget(widgetType),
    queryFn: () => Promise.resolve(null), // Placeholder
    ...STATS_QUERY_CONFIG,
    enabled: !!widgetType && isInitialized,
  });
};

/**
 * Hook for fetching sales pipeline
 * Placeholder implementation
 */
export const useSalesPipeline = () => {
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: [...dashboardKeys.all, 'salesPipeline'],
    queryFn: () => Promise.resolve({
      qualification: { value: 0, percentage: 0 },
      proposal: { value: 0, percentage: 0 },
      negotiation: { value: 0, percentage: 0 },
    }),
    ...STATS_QUERY_CONFIG,
    enabled: isInitialized,
  });
};

/**
 * Hook for fetching performance metrics
 * Placeholder implementation
 */
export const usePerformanceMetrics = () => {
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: dashboardKeys.performance(),
    queryFn: () => Promise.resolve({}), // Placeholder
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    enabled: isInitialized,
  });
};

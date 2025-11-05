/**
 * Tenant Metrics Hook
 * Custom React hook for tenant statistics and analytics
 * Handles: fetching metrics, comparisons, trends with time-series support
 *
 * @module useTenantMetrics
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TenantStatisticType } from '@/types/superUserModule';
import { tenantMetricsService as factoryTenantMetricsService } from '@/services/serviceFactory';

// Query keys for React Query cache management
export const TENANT_METRICS_QUERY_KEYS = {
  all: ['tenantMetrics'] as const,
  lists: () => [...TENANT_METRICS_QUERY_KEYS.all, 'list'] as const,
  list: (tenantId: string) =>
    [...TENANT_METRICS_QUERY_KEYS.lists(), tenantId] as const,
  comparisons: () => [...TENANT_METRICS_QUERY_KEYS.all, 'comparison'] as const,
  comparison: (tenantIds: string[]) => [
    ...TENANT_METRICS_QUERY_KEYS.comparisons(),
    tenantIds.sort().join(','),
  ] as const,
  trends: () => [...TENANT_METRICS_QUERY_KEYS.all, 'trend'] as const,
  trend: (
    tenantId: string,
    metricType: string,
    days: number
  ) => [...TENANT_METRICS_QUERY_KEYS.trends(), tenantId, metricType, days] as const,
};

/**
 * Metric comparison data
 */
interface MetricComparison {
  tenantId: string;
  tenantName: string;
  metrics: Record<string, number>;
}

/**
 * Tenant metrics hook state
 */
interface UseTenantMetricsState {
  // Data
  metrics: TenantStatisticType[];
  comparisonData: MetricComparison[];
  trendData: TenantStatisticType[];

  // Filters
  selectedTenantId: string | null;
  selectedMetricType: string | null;
  trendDays: number;

  // Loading states
  loading: boolean;
  isLoadingComparison: boolean;
  isLoadingTrend: boolean;
  isRecording: boolean;

  // Error state
  error: string | null;

  // Actions
  loadMetrics: (tenantId: string) => Promise<void>;
  loadComparison: (tenantIds: string[]) => Promise<void>;
  loadTrend: (
    tenantId: string,
    metricType: string,
    days?: number
  ) => Promise<void>;
  recordMetric: (
    tenantId: string,
    metricType: 'active_users' | 'total_contracts' | 'total_sales' | 'total_transactions' | 'disk_usage' | 'api_calls_daily',
    value: number
  ) => Promise<void>;
  setSelectedMetricType: (type: string) => void;
  setTrendDays: (days: number) => void;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing tenant metrics and analytics
 * @returns Tenant metrics management state and actions
 */
export const useTenantMetrics = (): UseTenantMetricsState => {
  const queryClient = useQueryClient();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedMetricType, setSelectedMetricType] = useState<string | null>(null);
  const [trendDays, setTrendDays] = useState(30);
  const [error, setError] = useState<string | null>(null);

  // Query: Fetch metrics for specific tenant or all tenants if none selected
  const {
    data: metrics = [],
    isLoading: loading,
    refetch: refetchMetrics,
    isError: hasMetricsError,
    error: metricsError,
  } = useQuery({
    queryKey: TENANT_METRICS_QUERY_KEYS.list(selectedTenantId || 'all'),
    queryFn: async () => {
      try {
        // If no tenant is selected, fetch metrics for a representative tenant or all
        // For now, we'll use mock data for 'all' case
        const tenantToFetch = selectedTenantId || 'all_tenants';
        const data = await factoryTenantMetricsService.getTenantMetrics(tenantToFetch);
        setError(null);
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch metrics';
        setError(message);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    refetchOnMount: true,  // Always fetch when component mounts
  });

  // Query: Fetch comparison metrics
  const {
    data: comparisonData = [],
    isLoading: isLoadingComparison,
    refetch: refetchComparison,
  } = useQuery({
    queryKey:
      selectedTenantId && [selectedTenantId]
        ? TENANT_METRICS_QUERY_KEYS.comparison([selectedTenantId])
        : TENANT_METRICS_QUERY_KEYS.comparison(['all_tenants']),
    queryFn: async () => {
      try {
        const tenantIds = selectedTenantId ? [selectedTenantId] : ['all_tenants'];
        const comparisonMap = await factoryTenantMetricsService.getComparisonMetrics(tenantIds);
        const result: MetricComparison[] = [];
        comparisonMap.forEach((metrics, tenantId) => {
          result.push({
            tenantId,
            tenantName: tenantId, // In real app, would fetch tenant name
            metrics: metrics.reduce(
              (acc, m) => {
                acc[m.metricType] = m.metricValue;
                return acc;
              },
              {} as Record<string, number>
            ),
          });
        });
        return result;
      } catch (err) {
        console.error('Failed to fetch comparison metrics:', err);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,  // Always fetch when component mounts
  });

  // Query: Fetch trend data
  const {
    data: trendData = [],
    isLoading: isLoadingTrend,
    refetch: refetchTrend,
  } = useQuery({
    queryKey:
      selectedTenantId && selectedMetricType
        ? TENANT_METRICS_QUERY_KEYS.trend(
            selectedTenantId,
            selectedMetricType,
            trendDays
          )
        : TENANT_METRICS_QUERY_KEYS.trend(
            'all_tenants',
            'active_users',
            trendDays
          ),
    queryFn: async () => {
      try {
        const tenantId = selectedTenantId || 'all_tenants';
        const metricType = selectedMetricType || 'active_users';
        const data = await factoryTenantMetricsService.getMetricsTrend(
          tenantId,
          metricType as any,
          trendDays
        );
        setError(null);
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch trend data';
        setError(message);
        throw err;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnMount: true,  // Always fetch when component mounts
  });

  // Mutation: Record metric
  const recordMutation = useMutation({
    mutationFn: async ({
      tenantId,
      metricType,
      value,
    }: {
      tenantId: string;
      metricType: 'active_users' | 'total_contracts' | 'total_sales' | 'total_transactions' | 'disk_usage' | 'api_calls_daily';
      value: number;
    }) => {
      try {
        const metric = await factoryTenantMetricsService.recordMetric(
          tenantId,
          metricType,
          value
        );
        return metric;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to record metric';
        setError(message);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: selectedTenantId
          ? TENANT_METRICS_QUERY_KEYS.list(selectedTenantId)
          : TENANT_METRICS_QUERY_KEYS.all,
      });
      setError(null);
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to record metric';
      setError(message);
    },
  });

  // Callback: Load metrics for tenant
  const handleLoadMetrics = useCallback(async (tenantId: string) => {
    try {
      setSelectedTenantId(tenantId);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load metrics';
      setError(message);
    }
  }, []);

  // Callback: Load comparison metrics
  const handleLoadComparison = useCallback(async (tenantIds: string[]) => {
    try {
      if (tenantIds.length === 0) {
        setError('Please select at least one tenant');
        return;
      }
      if (tenantIds.length === 1) {
        setSelectedTenantId(tenantIds[0]);
      }
      await refetchComparison();
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load comparison';
      setError(message);
    }
  }, [refetchComparison]);

  // Callback: Load trend data
  const handleLoadTrend = useCallback(
    async (tenantId: string, metricType: string, days = 30) => {
      try {
        setSelectedTenantId(tenantId);
        setSelectedMetricType(metricType);
        setTrendDays(days);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load trend';
        setError(message);
      }
    },
    []
  );

  // Callback: Record metric
  const handleRecordMetric = useCallback(
    async (
      tenantId: string,
      metricType: 'active_users' | 'total_contracts' | 'total_sales' | 'total_transactions' | 'disk_usage' | 'api_calls_daily',
      value: number
    ) => {
      await recordMutation.mutateAsync({
        tenantId,
        metricType,
        value,
      });
    },
    [recordMutation]
  );

  // Callback: Refetch
  const handleRefetch = useCallback(async () => {
    try {
      await refetchMetrics();
      await refetchComparison();
      await refetchTrend();
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refetch';
      setError(message);
    }
  }, [refetchMetrics, refetchComparison, refetchTrend]);

  return {
    // Data
    metrics,
    comparisonData,
    trendData,

    // Filters
    selectedTenantId,
    selectedMetricType,
    trendDays,

    // Loading states
    loading: loading || recordMutation.isPending,
    isLoadingComparison,
    isLoadingTrend,
    isRecording: recordMutation.isPending,

    // Error
    error:
      error ||
      (hasMetricsError
        ? metricsError instanceof Error
          ? metricsError.message
          : 'Unknown error'
        : null),

    // Actions
    loadMetrics: handleLoadMetrics,
    loadComparison: handleLoadComparison,
    loadTrend: handleLoadTrend,
    recordMetric: handleRecordMetric,
    setSelectedMetricType,
    setTrendDays,
    refetch: handleRefetch,
  };
};

export default useTenantMetrics;
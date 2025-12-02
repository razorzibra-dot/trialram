/**
 * Sales Pipeline Hooks
 * React Query hooks for sales pipeline analytics and management
 *
 * Pattern: Custom hooks providing data fetching, caching, and mutations
 * All hooks use React Query for efficient data management
 *
 * Last Updated: 2025-01-30
 * Version: 1.0.0
 */

import { useQuery } from '@tanstack/react-query';
import { useSalesStore } from '../store/dealStore';
import { ISalesService } from '../services/salesService';
import { useService } from '@/modules/core/hooks/useService';
import { STATS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';
import { handleError } from '@/modules/core/utils/errorHandler';

/**
 * Query key factory for consistent cache management
 * Ensures all queries can be invalidated correctly
 */
export const pipelineKeys = {
  all: ['sales-pipeline'] as const,
  stats: () => [...pipelineKeys.all, 'stats'] as const,
  analytics: (period?: string) => [...pipelineKeys.all, 'analytics', period] as const,
  stages: () => [...pipelineKeys.all, 'stages'] as const,
} as const;

/**
 * Fetch sales pipeline statistics
 * Provides stage-by-stage breakdown of deals
 *
 * @returns Query result with pipeline stats
 *
 * @example
 * const { data: pipelineStats } = useSalesPipeline();
 */
export const useSalesPipeline = () => {
  const service = useService<ISalesService>('dealsService');
  const { setStats } = useSalesStore();

  return useQuery({
    queryKey: pipelineKeys.stats(),
    queryFn: async () => {
      const stats = await service.getSalesStats();
      setStats(stats);
      return stats;
    },
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Fetch sales analytics with period filtering
 * Provides comprehensive sales performance metrics
 *
 * @param period - Optional time period ('month', 'quarter', 'year')
 * @returns Query result with analytics data
 *
 * @example
 * const { data: analytics } = useSalesAnalytics('quarter');
 */
export const useSalesAnalytics = (period?: string) => {
  const service = useService<ISalesService>('dealsService');

  return useQuery({
    queryKey: pipelineKeys.analytics(period),
    queryFn: () => service.getSalesAnalytics(period),
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Fetch deal stages configuration
 * Provides available pipeline stages
 *
 * @returns Query result with stages data
 *
 * @example
 * const { data: stages } = useDealStages();
 */
export const useDealStages = () => {
  const service = useService<ISalesService>('dealsService');

  return useQuery({
    queryKey: pipelineKeys.stages(),
    queryFn: () => service.getDealStages(),
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Fetch pipeline stages with metadata
 * Provides stages with order and display information
 *
 * @returns Query result with pipeline stages
 *
 * @example
 * const { data: pipelineStages } = usePipelineStages();
 */
export const usePipelineStages = () => {
  const service = useService<ISalesService>('dealsService');

  return useQuery({
    queryKey: [...pipelineKeys.stages(), 'with-metadata'],
    queryFn: () => service.getPipelineStages(),
    ...STATS_QUERY_CONFIG,
  });
};

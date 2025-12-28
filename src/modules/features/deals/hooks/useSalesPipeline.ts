/**
 * Sales Pipeline Hooks
 * React Query hooks for sales analytics
 *
 * Pattern: Custom hooks providing data fetching, caching, and mutations
 * All hooks use React Query for efficient data management
 * 
 * NOTE: Deals have status (won/lost/cancelled), not pipeline stages.
 * Pipeline stages belong to Opportunities. The "pipeline" here refers to
 * analytics/statistics, not stage progression.
 *
 * Last Updated: 2025-12-17
 * Version: 1.1.0
 */

import { useQuery } from '@tanstack/react-query';
import { useSalesStore } from '../store/dealStore';
import { ISalesService } from '../services/salesService';
import { useService } from '@/modules/core/hooks/useService';
import { STATS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';

/**
 * Query key factory for consistent cache management
 * Ensures all queries can be invalidated correctly
 */
export const pipelineKeys = {
  all: ['sales-pipeline'] as const,
  stats: () => [...pipelineKeys.all, 'stats'] as const,
  analytics: (period?: string) => [...pipelineKeys.all, 'analytics', period] as const,
} as const;

/**
 * Fetch sales statistics
 * Provides status-based breakdown of deals (won/lost/cancelled)
 *
 * @returns Query result with sales stats
 *
 * @example
 * const { data: salesStats } = useSalesPipeline();
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
    queryFn: () => service.getSalesStats(),
    ...STATS_QUERY_CONFIG,
  });
};

// NOTE: useDealStages and usePipelineStages removed - Deals have status (won/lost/cancelled), 
// not pipeline stages. Pipeline stages belong to Opportunities. See types/crm.ts.

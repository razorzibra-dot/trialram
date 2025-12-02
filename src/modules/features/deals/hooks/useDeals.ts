/**
 * Deals Hooks
 * React Query hooks for deal operations
 *
 * Pattern: Custom hooks providing data fetching, caching, and mutations
 * All hooks use React Query for efficient data management
 *
 * Last Updated: 2025-01-30
 * Version: 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSalesStore, SalesFilters } from '../store/dealStore';
import { ISalesService } from '../services/salesService';
import { useService } from '@/modules/core/hooks/useService';
import { LISTS_QUERY_CONFIG, DETAIL_QUERY_CONFIG, STATS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';
import { handleError } from '@/modules/core/utils/errorHandler';
import type { Deal, CreateDealDTO } from '@/types';

/**
 * Query key factory for consistent cache management
 * Ensures all queries can be invalidated correctly
 */
export const dealKeys = {
  all: ['deals'] as const,
  lists: () => [...dealKeys.all, 'list'] as const,
  list: (filters: DealFilters) => [...dealKeys.lists(), filters] as const,
  details: () => [...dealKeys.all, 'detail'] as const,
  detail: (id: string) => [...dealKeys.details(), id] as const,
  stats: () => [...dealKeys.all, 'stats'] as const,
} as const;

/**
 * Fetch deals with filters and pagination
 * Uses store for local state management
 *
 * @param filters - Optional filters (search, status, etc.)
 * @returns Query result with data, loading, error states
 *
 * @example
 * const { data: deals, isLoading, error } = useDeals({
 *   stage: 'negotiation'
 * });
 */
export const useDeals = (filters: SalesFilters = {}) => {
  const service = useService<ISalesService>('dealsService');
  const { setDeals, setLoading, setError } = useSalesStore();

  return useQuery({
    queryKey: dealKeys.list(filters),
    queryFn: async () => {
      try {
        setLoading(true);
        const response = await service.getDeals(filters);
        setDeals(response.data);
        return response;
      } catch (error) {
        const message = handleError(error, 'useDeals');
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Fetch single deal by ID
 *
 * @param id - Deal ID
 * @returns Query result with deal data
 *
 * @example
 * const { data: deal } = useDeal(dealId);
 */
export const useDeal = (id: string) => {
  const service = useService<ISalesService>('dealsService');
  const { setSelectedDeal } = useSalesStore();

  return useQuery({
    queryKey: dealKeys.detail(id),
    queryFn: async () => {
      const deal = await service.getDeal(id);
      setSelectedDeal(deal);
      return deal;
    },
    ...DETAIL_QUERY_CONFIG,
    enabled: !!id,
  });
};

/**
 * Create new deal mutation
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * const { mutate: createDeal } = useCreateDeal();
 * createDeal({ title: 'New Deal', value: 50000 });
 */
export const useCreateDeal = () => {
  const queryClient = useQueryClient();
  const service = useService<ISalesService>('dealsService');
  const store = useSalesStore();

  return useMutation({
    mutationFn: (data: CreateDealDTO) => service.createDeal(data),
    onSuccess: (newDeal) => {
      (store as any).addDeal(newDeal);
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() });
    },
    onError: (error) => {
      handleError(error, 'useCreateDeal');
    },
  });
};

/**
 * Update deal mutation
 */
export const useUpdateDeal = () => {
  const queryClient = useQueryClient();
  const service = useService<ISalesService>('dealsService');
  const store = useSalesStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDealDTO> }) =>
      service.updateDeal(id, data),
    onSuccess: (updatedDeal) => {
      (store as any).updateDeal(updatedDeal.id, updatedDeal);
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(updatedDeal.id) });
    },
    onError: (error) => {
      handleError(error, 'useUpdateDeal');
    },
  });
};

/**
 * Delete deal mutation
 */
export const useDeleteDeal = () => {
  const queryClient = useQueryClient();
  const service = useService<ISalesService>('dealsService');
  const store = useSalesStore();

  return useMutation({
    mutationFn: (id: string) => service.deleteDeal(id),
    onSuccess: (_, id) => {
      (store as any).removeDeal(id);
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() });
    },
    onError: (error) => {
      handleError(error, 'useDeleteDeal');
    },
  });
};

/**
 * Update deal stage mutation
 */
export const useUpdateDealStage = () => {
  const queryClient = useQueryClient();
  const service = useService<ISalesService>('dealsService');

  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      service.updateDealStage(id, stage),
    onSuccess: (updatedDeal) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(updatedDeal.id) });
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() });
    },
    onError: (error) => {
      handleError(error, 'useUpdateDealStage');
    },
  });
};

/**
 * Bulk deal operations mutation
 */
export const useBulkDealOperations = () => {
  const queryClient = useQueryClient();
  const service = useService<ISalesService>('dealsService');
  const store = useSalesStore();

  return useMutation({
    mutationFn: async ({
      operation,
      ids,
      updates
    }: {
      operation: 'delete' | 'update';
      ids: string[];
      updates?: Partial<CreateDealDTO>
    }) => {
      if (operation === 'delete') {
        return service.bulkDeleteDeals(ids);
      } else if (operation === 'update' && updates) {
        return service.bulkUpdateDeals(ids, updates);
      }
      throw new Error('Invalid bulk operation');
    },
    onSuccess: (_, { operation, ids, updates }) => {
      if (operation === 'delete') {
        ids.forEach(id => (store as any).removeDeal(id));
      } else if (operation === 'update' && updates) {
        // For updates, we need to refetch since we don't have the updated data
        queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      }
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() });
    },
    onError: (error) => {
      handleError(error, 'useBulkDealOperations');
    },
  });
};

/**
 * Fetch deal statistics
 * Provides summary metrics for deals dashboard
 */
export const useSalesStats = () => {
  const service = useService<ISalesService>('dealsService');
  const { setStats, setLoading: setStatsLoading, setError: setStatsError } = useSalesStore();

  return useQuery({
    queryKey: dealKeys.stats(),
    queryFn: async () => {
      try {
        const stats = await service.getDealStats();
        setStats(stats);
        return stats;
      } catch (error) {
        setStatsError((error as any).message);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Export deals mutation
 */
export const useDealExport = () => {
  const service = useService<ISalesService>('dealsService');

  return useMutation({
    mutationFn: (format: 'csv' | 'json') => service.exportDeals(format),
    onError: (error) => {
      handleError(error, 'useDealExport');
    },
  });
};

/**
 * Import deals mutation
 */
export const useDealImport = () => {
  const queryClient = useQueryClient();
  const service = useService<ISalesService>('dealsService');

  return useMutation({
    mutationFn: (data: string) => service.importDeals(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() });
    },
    onError: (error) => {
      handleError(error, 'useDealImport');
    },
  });
};

/**
 * Aliases for backward compatibility
 */
export const useBulkDeals = () => useBulkDealOperations();
export const useExportDeals = () => useDealExport();

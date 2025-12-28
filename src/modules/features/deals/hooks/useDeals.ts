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
import type { Deal, CreateDealDTO, DealFiltersDTO } from '@/types';
import { useNotification } from '@/hooks/useNotification';

/**
 * Query key factory for consistent cache management
 * Ensures all queries can be invalidated correctly
 */
export const dealKeys = {
  all: ['deals'] as const,
  lists: () => [...dealKeys.all, 'list'] as const,
  list: (filters: SalesFilters) => [...dealKeys.lists(), filters] as const,
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

        // Normalize response: service implementations may return an array
        // or a paginated object with a `data` property. Support both shapes.
        let dealsData: any[] = [];
        if (Array.isArray(response)) {
          dealsData = response as any[];
        } else if (response && Array.isArray((response as any).data)) {
          dealsData = (response as any).data;
        } else if (response && (response as any).data) {
          // In some implementations data may be present but not an array
          dealsData = Array.isArray((response as any).data) ? (response as any).data : [];
        }

        // Debug: log normalized deals before setting store
        try {
          console.log('[useDeals] 🔁 Normalized deals count:', (dealsData || []).length, 'ids:', (dealsData || []).map(d => d.id).slice(0,5));
        } catch (e) {
          // ignore
        }

        setDeals(dealsData);

        // Normalize return shape: if service returned an array, return a paginated-like object
        if (Array.isArray(response)) {
          const paginated = {
            data: dealsData,
            page: 1,
            pageSize: dealsData.length,
            total: dealsData.length,
            totalPages: 1
          } as const;
          return paginated;
        }

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
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: (data: CreateDealDTO) => service.createDeal(data),
    onSuccess: (newDeal) => {
      (store as any).addDeal(newDeal);
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() });
      success('Deal created successfully');
    },
    onError: (error) => {
      const message = handleError(err, 'useCreateDeal');
      error(message);
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
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDealDTO> }) =>
      service.updateDeal(id, data),
    onSuccess: (updatedDeal) => {
      (store as any).updateDeal(updatedDeal.id, updatedDeal);
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(updatedDeal.id) });
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() });
      success('Deal updated successfully');
    },
    onError: (error) => {
      const message = handleError(err, 'useUpdateDeal');
      error(message);
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
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: (id: string) => service.deleteDeal(id),
    onSuccess: (_, id) => {
      (store as any).removeDeal(id);
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() });
      success('Deal deleted successfully');
    },
    onError: (error) => {
      const message = handleError(err, 'useDeleteDeal');
      error(message);
    },
  });
};

// NOTE: useUpdateDealStage removed - Deals have status (won/lost/cancelled), not pipeline stages.
// Pipeline stages belong to Opportunities. See types/crm.ts for reference.

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
        const stats = await service.getSalesStats();
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

/**
 * Handle deal closure (convert won deals to orders/contracts)
 */
export const useHandleDealClosure = () => {
  const queryClient = useQueryClient();
  const service = useService<ISalesService>('dealsService');

  return useMutation({
    mutationFn: (dealId: string) => (service as any).handleDealClosure(dealId),
    onSuccess: (updatedDeal: any) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(updatedDeal.id) });
      queryClient.invalidateQueries({ queryKey: dealKeys.stats() });
    },
    onError: (error) => {
      handleError(error, 'useHandleDealClosure');
    }
  });
};

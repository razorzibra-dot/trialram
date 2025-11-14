/**
 * Sales Hooks
 * React hooks for sales operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Deal } from '@/types/crm';
import { SalesFilters, CreateDealData } from '../services/salesService';
import { useSalesStore } from '../store/salesStore';
import { salesService as factorySalesService } from '@/services/serviceFactory';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/useNotification';
import { LISTS_QUERY_CONFIG, DETAIL_QUERY_CONFIG, STATS_QUERY_CONFIG } from '@/modules/core/constants';

// Query Keys
export const salesKeys = {
  all: ['sales'] as const,
  deals: () => [...salesKeys.all, 'deals'] as const,
  deal: (id: string) => [...salesKeys.deals(), id] as const,
  dealsByCustomer: (customerId: string) => [...salesKeys.all, 'deals-by-customer', customerId] as const,
  stats: () => [...salesKeys.all, 'stats'] as const,
  stages: () => [...salesKeys.all, 'stages'] as const,
};

/**
 * Hook for fetching deals with filters
 */
export const useDeals = (filters: SalesFilters = {}) => {
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenant_id;
  const { setDeals, setLoading, setPagination } = useSalesStore();

  return useQuery({
    queryKey: [...salesKeys.deals(), filters, tenantId],
    queryFn: async () => {
      setLoading(true);
      try {
        const response = await factorySalesService.getDeals(filters);
        setDeals(response.data);
        setPagination({ 
          page: response.page, 
          pageSize: response.pageSize, 
          totalPages: response.totalPages, 
          total: response.total 
        });
        return response;
      } catch (error) {
        console.error('[useDeals] Error fetching deals:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching a single deal
 */
export const useDeal = (id: string) => {
  const { setSelectedDeal } = useSalesStore();

  return useQuery({
    queryKey: salesKeys.deal(id),
    queryFn: async () => {
      const deal = await factorySalesService.getDeal(id);
      setSelectedDeal(deal);
      return deal;
    },
    enabled: !!id,
    ...DETAIL_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching deals by customer ID
 */
export const useSalesByCustomer = (customerId: string, filters: SalesFilters = {}) => {
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenant_id;

  return useQuery({
    queryKey: [...salesKeys.dealsByCustomer(customerId), filters, tenantId],
    queryFn: async () => {
      const response = await factorySalesService.getDealsByCustomer(customerId, filters);
      return response;
    },
    enabled: !!customerId,
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching sales statistics
 */
export const useSalesStats = () => {
  const { setStats } = useSalesStore();

  return useQuery({
    queryKey: salesKeys.stats(),
    queryFn: async () => {
      const stats = await factorySalesService.getSalesStats();
      setStats(stats);
      return stats;
    },
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching deal stages
 */
export const useDealStages = () => {
  return useQuery({
    queryKey: salesKeys.stages(),
    queryFn: () => factorySalesService.getDealStages(),
    staleTime: 60 * 60 * 1000, // 1 hour - rarely changes
  });
};

/**
 * Hook for creating a new deal
 */
export const useCreateDeal = () => {
  const queryClient = useQueryClient();
  const { addDeal, setCreating } = useSalesStore();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (data: CreateDealData) => {
      setCreating(true);
      try {
        return await factorySalesService.createDeal(data);
      } finally {
        setCreating(false);
      }
    },
    onSuccess: (newDeal) => {
      addDeal(newDeal);
      queryClient.invalidateQueries({ queryKey: salesKeys.deals() });
      queryClient.invalidateQueries({ queryKey: salesKeys.stats() });
      success('Deal created successfully');
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to create deal');
    },
  });
};

/**
 * Hook for updating a deal
 */
export const useUpdateDeal = () => {
  const queryClient = useQueryClient();
  const { updateDeal, setUpdating } = useSalesStore();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateDealData> }) => {
      setUpdating(true);
      try {
        return await factorySalesService.updateDeal(id, data);
      } catch (err) {
        console.error('[useUpdateDeal] Error updating deal:', err);
        throw err;
      } finally {
        setUpdating(false);
      }
    },
    onSuccess: (updatedDeal) => {
      updateDeal(updatedDeal.id, updatedDeal);
      queryClient.invalidateQueries({ queryKey: salesKeys.deal(updatedDeal.id) });
      queryClient.invalidateQueries({ queryKey: salesKeys.deals() });
      queryClient.invalidateQueries({ queryKey: salesKeys.stats() });
      success('Deal updated successfully');
    },
    onError: (err) => {
      console.error('[useUpdateDeal] Error in mutation:', err);
      error(err instanceof Error ? err.message : 'Failed to update deal');
    },
  });
};

/**
 * Hook for deleting a deal
 */
export const useDeleteDeal = () => {
  const queryClient = useQueryClient();
  const { removeDeal, setDeleting } = useSalesStore();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (id: string) => {
      setDeleting(true);
      try {
        await factorySalesService.deleteDeal(id);
        return id;
      } finally {
        setDeleting(false);
      }
    },
    onSuccess: (deletedId) => {
      removeDeal(deletedId);
      queryClient.invalidateQueries({ queryKey: salesKeys.deals() });
      queryClient.invalidateQueries({ queryKey: salesKeys.stats() });
      success('Deal deleted successfully');
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to delete deal');
    },
  });
};

/**
 * Hook for updating deal stage
 */
export const useUpdateDealStage = () => {
  const queryClient = useQueryClient();
  const { updateDeal } = useSalesStore();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      return await factorySalesService.updateDealStage(id, stage);
    },
    onSuccess: (updatedDeal) => {
      updateDeal(updatedDeal.id, updatedDeal);
      queryClient.invalidateQueries({ queryKey: salesKeys.deals() });
      queryClient.invalidateQueries({ queryKey: salesKeys.stats() });
      success('Deal stage updated successfully');
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to update deal stage');
    },
  });
};

/**
 * Hook for bulk operations
 */
export const useBulkDeals = () => {
  const queryClient = useQueryClient();
  const { clearSelection } = useSalesStore();
  const { success, error } = useNotification();

  const bulkUpdate = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<CreateDealData> }) => {
      return await factorySalesService.bulkUpdateDeals(ids, updates);
    },
    onSuccess: (updatedDeals) => {
      clearSelection();
      queryClient.invalidateQueries({ queryKey: salesKeys.deals() });
      queryClient.invalidateQueries({ queryKey: salesKeys.stats() });
      success(`${updatedDeals.length} deals updated successfully`);
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to update deals');
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      await factorySalesService.bulkDeleteDeals(ids);
      return ids;
    },
    onSuccess: (deletedIds) => {
      clearSelection();
      queryClient.invalidateQueries({ queryKey: salesKeys.deals() });
      queryClient.invalidateQueries({ queryKey: salesKeys.stats() });
      success(`${deletedIds.length} deals deleted successfully`);
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to delete deals');
    },
  });

  return {
    bulkUpdate,
    bulkDelete,
  };
};

/**
 * Hook for searching deals
 */
export const useSearchDeals = () => {
  return useCallback(
    async (query: string) => {
      if (!query.trim()) return [];
      return await factorySalesService.searchDeals(query);
    },
    []
  );
};

/**
 * Hook for exporting deals
 */
export const useExportDeals = () => {
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (format: 'csv' | 'json' = 'csv') => {
      return await factorySalesService.exportDeals(format);
    },
    onSuccess: (data, format) => {
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `deals.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success('Deals exported successfully');
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to export deals');
    },
  });
};

/**
 * Hook for importing deals
 */
export const useImportDeals = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (csv: string) => {
      return await factorySalesService.importDeals(csv);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.deals() });
      queryClient.invalidateQueries({ queryKey: salesKeys.stats() });
      
      const message = `${result.success} deals imported successfully${
        result.errors.length > 0 ? `, ${result.errors.length} errors` : ''
      }`;
      success(message);
    },
    onError: (err) => {
      error(err instanceof Error ? err.message : 'Failed to import deals');
    },
  });
};

/**
 * Sales Hooks
 * React hooks for sales operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Deal } from '@/types/crm';
import { SalesService, SalesFilters, CreateDealData, DealStats } from '../services/salesService';
import { useSalesStore } from '../store/salesStore';
import { useService } from '@/modules/core/hooks/useService';
import { useToast } from '@/hooks/use-toast';

// Query Keys
export const salesKeys = {
  all: ['sales'] as const,
  deals: () => [...salesKeys.all, 'deals'] as const,
  deal: (id: string) => [...salesKeys.deals(), id] as const,
  stats: () => [...salesKeys.all, 'stats'] as const,
  stages: () => [...salesKeys.all, 'stages'] as const,
};

/**
 * Hook for fetching deals with filters
 */
export const useDeals = (filters: SalesFilters = {}) => {
  const salesService = useService<SalesService>('salesService');
  const { setDeals, setLoading, setPagination } = useSalesStore();

  return useQuery({
    queryKey: [...salesKeys.deals(), filters],
    queryFn: async () => {
      setLoading(true);
      try {
        const response = await salesService.getDeals(filters);
        setDeals(response.data);
        setPagination({ 
          page: response.page, 
          pageSize: response.pageSize, 
          totalPages: response.totalPages, 
          total: response.total 
        });
        return response;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for fetching a single deal
 */
export const useDeal = (id: string) => {
  const salesService = useService<SalesService>('salesService');
  const { setSelectedDeal } = useSalesStore();

  return useQuery({
    queryKey: salesKeys.deal(id),
    queryFn: async () => {
      const deal = await salesService.getDeal(id);
      setSelectedDeal(deal);
      return deal;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for fetching sales statistics
 */
export const useSalesStats = () => {
  const salesService = useService<SalesService>('salesService');
  const { setStats } = useSalesStore();

  return useQuery({
    queryKey: salesKeys.stats(),
    queryFn: async () => {
      const stats = await salesService.getSalesStats();
      setStats(stats);
      return stats;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for fetching deal stages
 */
export const useDealStages = () => {
  const salesService = useService<SalesService>('salesService');

  return useQuery({
    queryKey: salesKeys.stages(),
    queryFn: () => salesService.getDealStages(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * Hook for creating a new deal
 */
export const useCreateDeal = () => {
  const queryClient = useQueryClient();
  const salesService = useService<SalesService>('salesService');
  const { addDeal, setCreating } = useSalesStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateDealData) => {
      setCreating(true);
      try {
        return await salesService.createDeal(data);
      } finally {
        setCreating(false);
      }
    },
    onSuccess: (newDeal) => {
      addDeal(newDeal);
      queryClient.invalidateQueries({ queryKey: salesKeys.deals() });
      queryClient.invalidateQueries({ queryKey: salesKeys.stats() });
      toast({
        title: 'Success',
        description: 'Deal created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create deal',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for updating a deal
 */
export const useUpdateDeal = () => {
  const queryClient = useQueryClient();
  const salesService = useService<SalesService>('salesService');
  const { updateDeal, setUpdating } = useSalesStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateDealData> }) => {
      setUpdating(true);
      try {
        return await salesService.updateDeal(id, data);
      } finally {
        setUpdating(false);
      }
    },
    onSuccess: (updatedDeal) => {
      updateDeal(updatedDeal.id, updatedDeal);
      queryClient.invalidateQueries({ queryKey: salesKeys.deal(updatedDeal.id) });
      queryClient.invalidateQueries({ queryKey: salesKeys.deals() });
      queryClient.invalidateQueries({ queryKey: salesKeys.stats() });
      toast({
        title: 'Success',
        description: 'Deal updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update deal',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for deleting a deal
 */
export const useDeleteDeal = () => {
  const queryClient = useQueryClient();
  const salesService = useService<SalesService>('salesService');
  const { removeDeal, setDeleting } = useSalesStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      setDeleting(true);
      try {
        await salesService.deleteDeal(id);
        return id;
      } finally {
        setDeleting(false);
      }
    },
    onSuccess: (deletedId) => {
      removeDeal(deletedId);
      queryClient.invalidateQueries({ queryKey: salesKeys.deals() });
      queryClient.invalidateQueries({ queryKey: salesKeys.stats() });
      toast({
        title: 'Success',
        description: 'Deal deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete deal',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for updating deal stage
 */
export const useUpdateDealStage = () => {
  const queryClient = useQueryClient();
  const salesService = useService<SalesService>('salesService');
  const { updateDeal } = useSalesStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      return await salesService.updateDealStage(id, stage);
    },
    onSuccess: (updatedDeal) => {
      updateDeal(updatedDeal.id, updatedDeal);
      queryClient.invalidateQueries({ queryKey: salesKeys.deals() });
      queryClient.invalidateQueries({ queryKey: salesKeys.stats() });
      toast({
        title: 'Success',
        description: 'Deal stage updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update deal stage',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for bulk operations
 */
export const useBulkDeals = () => {
  const queryClient = useQueryClient();
  const salesService = useService<SalesService>('salesService');
  const { clearSelection } = useSalesStore();
  const { toast } = useToast();

  const bulkUpdate = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<CreateDealData> }) => {
      return await salesService.bulkUpdateDeals(ids, updates);
    },
    onSuccess: (updatedDeals) => {
      clearSelection();
      queryClient.invalidateQueries({ queryKey: salesKeys.deals() });
      queryClient.invalidateQueries({ queryKey: salesKeys.stats() });
      toast({
        title: 'Success',
        description: `${updatedDeals.length} deals updated successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update deals',
        variant: 'destructive',
      });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      await salesService.bulkDeleteDeals(ids);
      return ids;
    },
    onSuccess: (deletedIds) => {
      clearSelection();
      queryClient.invalidateQueries({ queryKey: salesKeys.deals() });
      queryClient.invalidateQueries({ queryKey: salesKeys.stats() });
      toast({
        title: 'Success',
        description: `${deletedIds.length} deals deleted successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete deals',
        variant: 'destructive',
      });
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
  const salesService = useService<SalesService>('salesService');

  return useCallback(
    async (query: string) => {
      if (!query.trim()) return [];
      return await salesService.searchDeals(query);
    },
    [salesService]
  );
};

/**
 * Hook for exporting deals
 */
export const useExportDeals = () => {
  const salesService = useService<SalesService>('salesService');
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (format: 'csv' | 'json' = 'csv') => {
      return await salesService.exportDeals(format);
    },
    onSuccess: (data, format) => {
      // Create download link
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

      toast({
        title: 'Success',
        description: 'Deals exported successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to export deals',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for importing deals
 */
export const useImportDeals = () => {
  const queryClient = useQueryClient();
  const salesService = useService<SalesService>('salesService');
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (csv: string) => {
      return await salesService.importDeals(csv);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.deals() });
      queryClient.invalidateQueries({ queryKey: salesKeys.stats() });
      
      toast({
        title: 'Import Complete',
        description: `${result.success} deals imported successfully${
          result.errors.length > 0 ? `, ${result.errors.length} errors` : ''
        }`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to import deals',
        variant: 'destructive',
      });
    },
  });
};

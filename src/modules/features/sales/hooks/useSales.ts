/**
 * Sales Hooks
 * React hooks for sales operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { Deal } from '@/types/crm';
import { SalesService, SalesFilters, CreateDealData, DealStats } from '../services/salesService';
import { useSalesStore } from '../store/salesStore';
import { salesService as factorySalesService } from '@/services/serviceFactory';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Module service instance
const moduleSalesService = new SalesService();

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
  console.log('[useDeals] 🚀 Hook called with filters:', filters);
  
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenant_id;
  console.log('[useDeals] ✅ Factory SalesService obtained with tenantId:', tenantId);
  
  const { setDeals, setLoading, setPagination } = useSalesStore();

  return useQuery({
    queryKey: [...salesKeys.deals(), filters, tenantId],
    queryFn: async () => {
      console.log('[useDeals] 🔄 queryFn executing with tenantId:', tenantId);
      setLoading(true);
      try {
        console.log('[useDeals] 📞 Calling factorySalesService.getDeals...');
        const response = await factorySalesService.getDeals(filters);
        console.log('[useDeals] ✅ Got response:', { dataCount: response.data?.length, total: response.total });
        setDeals(response.data);
        setPagination({ 
          page: response.page, 
          pageSize: response.pageSize, 
          totalPages: response.totalPages, 
          total: response.total 
        });
        return response;
      } catch (error) {
        console.error('[useDeals] ❌ Error:', error);
        throw error;
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
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenant_id;
  const { setSelectedDeal } = useSalesStore();

  return useQuery({
    queryKey: salesKeys.deal(id),
    queryFn: async () => {
      const deal = await factorySalesService.getDeal(id);
      setSelectedDeal(deal);
      return deal;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for fetching sales statistics
 */
export const useSalesStats = () => {
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenant_id;
  const { setStats } = useSalesStore();

  return useQuery({
    queryKey: salesKeys.stats(),
    queryFn: async () => {
      // Use module service which transforms data to expected format
      const stats = await moduleSalesService.getSalesStats();
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
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenant_id;

  return useQuery({
    queryKey: salesKeys.stages(),
    queryFn: () => factorySalesService.getDealStages(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * Hook for creating a new deal
 */
export const useCreateDeal = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenant_id;
  const { addDeal, setCreating } = useSalesStore();
  const { toast } = useToast();

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
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenant_id;
  const { updateDeal, setUpdating } = useSalesStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateDealData> }) => {
      setUpdating(true);
      try {
        console.log('🎯 [useUpdateDeal] mutationFn starting:', { id, dataKeys: Object.keys(data || {}) });
        const result = await factorySalesService.updateDeal(id, data);
        console.log('✅ [useUpdateDeal] mutationFn completed:', { id, resultId: result.id });
        return result;
      } catch (error) {
        console.error('❌ [useUpdateDeal] mutationFn error:', error);
        throw error;
      } finally {
        setUpdating(false);
      }
    },
    onSuccess: (updatedDeal) => {
      console.log('✅ [useUpdateDeal] onSuccess triggered:', updatedDeal.id);
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
      console.error('❌ [useUpdateDeal] onError triggered:', error);
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
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenant_id;
  const { removeDeal, setDeleting } = useSalesStore();
  const { toast } = useToast();

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
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenant_id;
  const { updateDeal } = useSalesStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      return await factorySalesService.updateDealStage(id, stage);
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
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenant_id;
  const { clearSelection } = useSalesStore();
  const { toast } = useToast();

  const bulkUpdate = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<CreateDealData> }) => {
      return await factorySalesService.bulkUpdateDeals(ids, updates);
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
      await factorySalesService.bulkDeleteDeals(ids);
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
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenant_id;

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
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenant_id;
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (format: 'csv' | 'json' = 'csv') => {
      return await factorySalesService.exportDeals(format);
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
  const { currentUser } = useAuth();
  const tenantId = currentUser?.tenant_id;
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (csv: string) => {
      return await factorySalesService.importDeals(csv);
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

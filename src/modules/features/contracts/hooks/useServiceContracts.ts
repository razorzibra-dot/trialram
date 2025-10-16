/**
 * Service Contract Hooks
 * React hooks for service contract operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ServiceContractService } from '../services/serviceContractService';
import { useService } from '@/modules/core/hooks/useService';
import { ServiceContract, ServiceContractFilters } from '@/types/productSales';

// Query Keys
export const serviceContractKeys = {
  all: ['serviceContracts'] as const,
  lists: () => [...serviceContractKeys.all, 'list'] as const,
  list: (filters: ServiceContractFilters) => [...serviceContractKeys.lists(), filters] as const,
  details: () => [...serviceContractKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceContractKeys.details(), id] as const,
  stats: () => [...serviceContractKeys.all, 'stats'] as const,
  types: () => [...serviceContractKeys.all, 'types'] as const,
  statuses: () => [...serviceContractKeys.all, 'statuses'] as const,
};

/**
 * Hook for fetching service contracts with filters
 */
export const useServiceContracts = (filters: ServiceContractFilters = {}) => {
  const serviceContractService = useService<ServiceContractService>('serviceContractService');

  return useQuery({
    queryKey: serviceContractKeys.list(filters),
    queryFn: () => serviceContractService.getServiceContracts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching a single service contract
 */
export const useServiceContract = (id: string) => {
  const serviceContractService = useService<ServiceContractService>('serviceContractService');

  return useQuery({
    queryKey: serviceContractKeys.detail(id),
    queryFn: () => serviceContractService.getServiceContract(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching service contract statistics
 */
export const useServiceContractStats = () => {
  const serviceContractService = useService<ServiceContractService>('serviceContractService');

  return useQuery({
    queryKey: serviceContractKeys.stats(),
    queryFn: () => serviceContractService.getServiceContractStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for fetching service types
 */
export const useServiceTypes = () => {
  const serviceContractService = useService<ServiceContractService>('serviceContractService');

  return useQuery({
    queryKey: serviceContractKeys.types(),
    queryFn: () => serviceContractService.getServiceTypes(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * Hook for fetching service contract statuses
 */
export const useServiceContractStatuses = () => {
  const serviceContractService = useService<ServiceContractService>('serviceContractService');

  return useQuery({
    queryKey: serviceContractKeys.statuses(),
    queryFn: () => serviceContractService.getServiceContractStatuses(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * Hook for creating a service contract
 */
export const useCreateServiceContract = () => {
  const queryClient = useQueryClient();
  const serviceContractService = useService<ServiceContractService>('serviceContractService');

  return useMutation({
    mutationFn: (data: Partial<ServiceContract>) => serviceContractService.createServiceContract(data),
    onSuccess: (newContract) => {
      // Invalidate and refetch service contracts list
      queryClient.invalidateQueries({ queryKey: serviceContractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceContractKeys.stats() });
      
      toast.success('Service contract created successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create service contract');
    },
  });
};

/**
 * Hook for updating a service contract
 */
export const useUpdateServiceContract = () => {
  const queryClient = useQueryClient();
  const serviceContractService = useService<ServiceContractService>('serviceContractService');

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceContract> }) =>
      serviceContractService.updateServiceContract(id, data),
    onSuccess: (updatedContract) => {
      // Update the specific service contract in cache
      queryClient.setQueryData(
        serviceContractKeys.detail(updatedContract.id),
        updatedContract
      );
      
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: serviceContractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceContractKeys.stats() });
      
      toast.success('Service contract updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update service contract');
    },
  });
};

/**
 * Hook for deleting a service contract
 */
export const useDeleteServiceContract = () => {
  const queryClient = useQueryClient();
  const serviceContractService = useService<ServiceContractService>('serviceContractService');

  return useMutation({
    mutationFn: (id: string) => serviceContractService.deleteServiceContract(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: serviceContractKeys.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: serviceContractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceContractKeys.stats() });
      
      toast.success('Service contract deleted successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete service contract');
    },
  });
};

/**
 * Hook for updating service contract status
 */
export const useUpdateServiceContractStatus = () => {
  const queryClient = useQueryClient();
  const serviceContractService = useService<ServiceContractService>('serviceContractService');

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      serviceContractService.updateServiceContractStatus(id, status),
    onSuccess: (updatedContract) => {
      // Update the specific service contract in cache
      queryClient.setQueryData(
        serviceContractKeys.detail(updatedContract.id),
        updatedContract
      );
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: serviceContractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceContractKeys.stats() });
      
      toast.success('Service contract status updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update service contract status');
    },
  });
};

/**
 * Hook for bulk operations on service contracts
 */
export const useBulkServiceContractOperations = () => {
  const queryClient = useQueryClient();
  const serviceContractService = useService<ServiceContractService>('serviceContractService');

  const bulkUpdate = useMutation({
    mutationFn: ({ ids, updates }: { ids: string[]; updates: Partial<ServiceContract> }) =>
      serviceContractService.bulkUpdateServiceContracts(ids, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceContractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceContractKeys.stats() });
      toast.success('Service contracts updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update service contracts');
    },
  });

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => serviceContractService.bulkDeleteServiceContracts(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceContractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceContractKeys.stats() });
      toast.success('Service contracts deleted successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete service contracts');
    },
  });

  return { bulkUpdate, bulkDelete };
};

/**
 * Hook for exporting service contracts
 */
export const useExportServiceContracts = () => {
  const serviceContractService = useService<ServiceContractService>('serviceContractService');

  return useMutation({
    mutationFn: (format: 'csv' | 'json' = 'csv') => serviceContractService.exportServiceContracts(format),
    onSuccess: (data, format) => {
      // Create and download file
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `service-contracts.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Service contracts exported successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to export service contracts');
    },
  });
};

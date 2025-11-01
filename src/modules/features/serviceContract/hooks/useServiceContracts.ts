/**
 * Service Contract Hooks
 * React Query hooks for service contract operations
 * 
 * Pattern: Custom hooks providing data fetching, caching, and mutations
 * All hooks use React Query for efficient data management
 * 
 * Last Updated: 2025-01-30
 * Version: 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { moduleServiceContractService } from '../services/serviceContractService';
import {
  ServiceContractType,
  ServiceContractDocumentType,
  ServiceDeliveryMilestoneType,
  ServiceContractIssueType,
  ServiceContractCreateInput,
  ServiceContractUpdateInput,
  ServiceContractFilters,
  ServiceContractDocumentCreateInput,
  ServiceDeliveryMilestoneCreateInput,
  ServiceContractIssueCreateInput,
} from '@/types/serviceContract';

/**
 * Query key factory for consistent cache management
 */
export const serviceContractKeys = {
  all: ['serviceContracts'] as const,
  lists: () => [...serviceContractKeys.all, 'list'] as const,
  list: (filters: ServiceContractFilters) => [...serviceContractKeys.lists(), filters] as const,
  details: () => [...serviceContractKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceContractKeys.details(), id] as const,
  detailWithRelations: (id: string) => [...serviceContractKeys.detail(id), 'with_relations'] as const,
  stats: () => [...serviceContractKeys.all, 'stats'] as const,
  documents: (contractId: string) => [...serviceContractKeys.detail(contractId), 'documents'] as const,
  milestones: (contractId: string) => [...serviceContractKeys.detail(contractId), 'milestones'] as const,
  issues: (contractId: string) => [...serviceContractKeys.detail(contractId), 'issues'] as const,
};

/**
 * Hook for fetching service contracts with filters and pagination
 */
export const useServiceContracts = (filters: ServiceContractFilters = {}) => {
  return useQuery({
    queryKey: serviceContractKeys.list(filters),
    queryFn: () => moduleServiceContractService.getServiceContracts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

/**
 * Hook for fetching single service contract
 */
export const useServiceContract = (id: string) => {
  return useQuery({
    queryKey: serviceContractKeys.detail(id),
    queryFn: () => moduleServiceContractService.getServiceContract(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for fetching service contract with all related data
 */
export const useServiceContractWithDetails = (id: string) => {
  return useQuery({
    queryKey: serviceContractKeys.detailWithRelations(id),
    queryFn: () => moduleServiceContractService.getServiceContractWithDetails(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  });
};

/**
 * Hook for fetching service contract statistics
 */
export const useServiceContractStats = () => {
  return useQuery({
    queryKey: serviceContractKeys.stats(),
    queryFn: () => moduleServiceContractService.getServiceContractStats(),
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Hook for creating service contract
 */
export const useCreateServiceContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ServiceContractCreateInput) =>
      moduleServiceContractService.createServiceContract(data),
    onSuccess: (newContract) => {
      // Invalidate and refetch lists
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
 * Hook for updating service contract
 */
export const useUpdateServiceContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceContractUpdateInput }) =>
      moduleServiceContractService.updateServiceContract(id, data),
    onSuccess: (updatedContract) => {
      // Update specific contract in cache
      queryClient.setQueryData(
        serviceContractKeys.detail(updatedContract.id),
        updatedContract
      );

      // Invalidate lists and stats
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
 * Hook for deleting service contract
 */
export const useDeleteServiceContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => moduleServiceContractService.deleteServiceContract(id),
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

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      moduleServiceContractService.updateServiceContractStatus(id, status),
    onSuccess: (updatedContract) => {
      queryClient.setQueryData(
        serviceContractKeys.detail(updatedContract.id),
        updatedContract
      );
      queryClient.invalidateQueries({ queryKey: serviceContractKeys.lists() });

      toast.success('Service contract status updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    },
  });
};

/**
 * Hook for fetching service contract documents
 */
export const useServiceContractDocuments = (contractId: string) => {
  return useQuery({
    queryKey: serviceContractKeys.documents(contractId),
    queryFn: () => moduleServiceContractService.getServiceContractDocuments(contractId),
    enabled: !!contractId,
  });
};

/**
 * Hook for adding document to service contract
 */
export const useAddServiceContractDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ServiceContractDocumentCreateInput) =>
      moduleServiceContractService.addServiceContractDocument(data),
    onSuccess: (newDocument) => {
      // Invalidate documents for this contract
      queryClient.invalidateQueries({
        queryKey: serviceContractKeys.documents(newDocument.serviceContractId),
      });

      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to upload document');
    },
  });
};

/**
 * Hook for fetching service delivery milestones
 */
export const useServiceDeliveryMilestones = (contractId: string) => {
  return useQuery({
    queryKey: serviceContractKeys.milestones(contractId),
    queryFn: () => moduleServiceContractService.getServiceDeliveryMilestones(contractId),
    enabled: !!contractId,
  });
};

/**
 * Hook for adding milestone to service contract
 */
export const useAddServiceDeliveryMilestone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ServiceDeliveryMilestoneCreateInput) =>
      moduleServiceContractService.addServiceDeliveryMilestone(data),
    onSuccess: (newMilestone) => {
      // Invalidate milestones for this contract
      queryClient.invalidateQueries({
        queryKey: serviceContractKeys.milestones(newMilestone.serviceContractId),
      });

      toast.success('Milestone created successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create milestone');
    },
  });
};

/**
 * Hook for fetching service contract issues
 */
export const useServiceContractIssues = (contractId: string) => {
  return useQuery({
    queryKey: serviceContractKeys.issues(contractId),
    queryFn: () => moduleServiceContractService.getServiceContractIssues(contractId),
    enabled: !!contractId,
  });
};

/**
 * Hook for adding issue to service contract
 */
export const useAddServiceContractIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ServiceContractIssueCreateInput) =>
      moduleServiceContractService.addServiceContractIssue(data),
    onSuccess: (newIssue) => {
      // Invalidate issues for this contract
      queryClient.invalidateQueries({
        queryKey: serviceContractKeys.issues(newIssue.serviceContractId),
      });

      toast.success('Issue reported successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to report issue');
    },
  });
};

/**
 * Hook for bulk operations
 */
export const useBulkServiceContractOperations = () => {
  const queryClient = useQueryClient();

  const bulkUpdate = useMutation({
    mutationFn: ({ ids, updates }: { ids: string[]; updates: ServiceContractUpdateInput }) =>
      moduleServiceContractService.bulkUpdateServiceContracts(ids, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceContractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceContractKeys.stats() });
      toast.success('Service contracts updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update contracts');
    },
  });

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => moduleServiceContractService.bulkDeleteServiceContracts(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceContractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceContractKeys.stats() });
      toast.success('Service contracts deleted successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete contracts');
    },
  });

  return { bulkUpdate, bulkDelete };
};

/**
 * Hook for exporting service contracts
 */
export const useExportServiceContracts = () => {
  return useMutation({
    mutationFn: (format: 'csv' | 'json' = 'csv') =>
      moduleServiceContractService.exportServiceContracts(format),
    onSuccess: (data, format) => {
      // Create and download file
      const blob = new Blob([data], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `service-contracts-${new Date().getTime()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Contracts exported as ${format.toUpperCase()}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to export contracts');
    },
  });
};
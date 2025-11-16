/**
 * Contract Hooks
 * React hooks for contract operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ContractService } from '../services/contractService';
import { useService } from '@/modules/core/hooks/useService';
import { Contract, ContractFilters, ContractFormData } from '@/types/contracts';
import { LISTS_QUERY_CONFIG, DETAIL_QUERY_CONFIG, STATS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';

// Query Keys
export const contractKeys = {
  all: ['contracts'] as const,
  lists: () => [...contractKeys.all, 'list'] as const,
  list: (filters: ContractFilters) => [...contractKeys.lists(), filters] as const,
  details: () => [...contractKeys.all, 'detail'] as const,
  detail: (id: string) => [...contractKeys.details(), id] as const,
  byCustomer: (customerId: string) => [...contractKeys.all, 'by-customer', customerId] as const,
  stats: () => [...contractKeys.all, 'stats'] as const,
  expiring: (days: number) => [...contractKeys.all, 'expiring', days] as const,
  renewals: (days: number) => [...contractKeys.all, 'renewals', days] as const,
};

/**
 * Hook for fetching contracts with filters
 */
export const useContracts = (filters: ContractFilters = {}) => {
  const contractService = useService<ContractService>('contractService');

  const query = useQuery({
    queryKey: contractKeys.list(filters),
    queryFn: () => contractService.getContracts(filters),
    ...LISTS_QUERY_CONFIG,
  });

  const data = query.data;
  const contracts = data?.data || [];
  const pagination = {
    page: data?.page || 1,
    pageSize: data?.pageSize || 20,
    total: data?.total || 0,
    totalPages: data?.totalPages || 1,
  };

  return {
    contracts,
    pagination,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching a single contract
 */
export const useContract = (id: string) => {
  const contractService = useService<ContractService>('contractService');

  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => contractService.getContract(id),
    ...DETAIL_QUERY_CONFIG,
    enabled: !!id,
  });
};

/**
 * Hook for fetching contracts by customer ID
 */
export const useContractsByCustomer = (customerId: string, filters: ContractFilters = {}) => {
  const contractService = useService<ContractService>('contractService');

  const query = useQuery({
    queryKey: [...contractKeys.byCustomer(customerId), filters],
    queryFn: () => contractService.getContractsByCustomer(customerId, filters),
    ...LISTS_QUERY_CONFIG,
    enabled: !!customerId,
  });

  const data = query.data;
  const contracts = data?.data || [];
  const pagination = {
    page: data?.page || 1,
    pageSize: data?.pageSize || 20,
    total: data?.total || 0,
    totalPages: data?.totalPages || 1,
  };

  return {
    contracts,
    pagination,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for fetching contract statistics
 */
export const useContractStats = () => {
  const contractService = useService<ContractService>('contractService');

  return useQuery({
    queryKey: contractKeys.stats(),
    queryFn: () => contractService.getContractStats(),
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching expiring contracts
 */
export const useExpiringContracts = (days: number = 30) => {
  const contractService = useService<ContractService>('contractService');

  return useQuery({
    queryKey: contractKeys.expiring(days),
    queryFn: () => contractService.getExpiringContracts(days),
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching contracts due for renewal
 */
export const useContractsDueForRenewal = (days: number = 30) => {
  const contractService = useService<ContractService>('contractService');

  return useQuery({
    queryKey: contractKeys.renewals(days),
    queryFn: () => contractService.getContractsDueForRenewal(days),
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Hook for creating a contract
 */
export const useCreateContract = () => {
  const queryClient = useQueryClient();
  const contractService = useService<ContractService>('contractService');

  return useMutation({
    mutationFn: (data: ContractFormData) => contractService.createContract(data),
    onSuccess: (newContract) => {
      // Invalidate and refetch contracts list
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractKeys.stats() });
      queryClient.invalidateQueries({ queryKey: contractKeys.expiring(30) });
      queryClient.invalidateQueries({ queryKey: contractKeys.renewals(30) });
      
      toast.success('Contract created successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create contract');
    },
  });
};

/**
 * Hook for updating a contract
 */
export const useUpdateContract = () => {
  const queryClient = useQueryClient();
  const contractService = useService<ContractService>('contractService');

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContractFormData> }) =>
      contractService.updateContract(id, data),
    onSuccess: (updatedContract) => {
      // Update the specific contract in cache
      queryClient.setQueryData(
        contractKeys.detail(updatedContract.id),
        updatedContract
      );
      
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractKeys.stats() });
      queryClient.invalidateQueries({ queryKey: contractKeys.expiring(30) });
      queryClient.invalidateQueries({ queryKey: contractKeys.renewals(30) });
      
      toast.success('Contract updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update contract');
    },
  });
};

/**
 * Hook for deleting a contract
 */
export const useDeleteContract = () => {
  const queryClient = useQueryClient();
  const contractService = useService<ContractService>('contractService');

  return useMutation({
    mutationFn: (id: string) => contractService.deleteContract(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: contractKeys.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractKeys.stats() });
      queryClient.invalidateQueries({ queryKey: contractKeys.expiring(30) });
      queryClient.invalidateQueries({ queryKey: contractKeys.renewals(30) });
      
      toast.success('Contract deleted successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete contract');
    },
  });
};

/**
 * Hook for updating contract status
 */
export const useUpdateContractStatus = () => {
  const queryClient = useQueryClient();
  const contractService = useService<ContractService>('contractService');

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      contractService.updateContractStatus(id, status),
    onSuccess: (updatedContract) => {
      // Update the specific contract in cache
      queryClient.setQueryData(
        contractKeys.detail(updatedContract.id),
        updatedContract
      );
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractKeys.stats() });
      
      toast.success('Contract status updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update contract status');
    },
  });
};

/**
 * Hook for approving a contract
 */
export const useApproveContract = () => {
  const queryClient = useQueryClient();
  const contractService = useService<ContractService>('contractService');

  return useMutation({
    mutationFn: ({ id, approvalData }: { id: string; approvalData: { stage: string; comments?: string } }) =>
      contractService.approveContract(id, approvalData),
    onSuccess: (updatedContract) => {
      // Update the specific contract in cache
      queryClient.setQueryData(
        contractKeys.detail(updatedContract.id),
        updatedContract
      );
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractKeys.stats() });
      
      toast.success('Contract approved successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to approve contract');
    },
  });
};

/**
 * Hook for exporting contracts
 */
export const useExportContracts = () => {
  const contractService = useService<ContractService>('contractService');

  return useMutation({
    mutationFn: (format: 'csv' | 'json' = 'csv') => contractService.exportContracts(format),
    onSuccess: (data, format) => {
      // Create and download file
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contracts.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Contracts exported successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to export contracts');
    },
  });
};

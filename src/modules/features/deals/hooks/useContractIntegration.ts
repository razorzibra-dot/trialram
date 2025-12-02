/**
 * Contract Integration Hooks
 * React Query hooks for deal-contract integration operations
 *
 * Pattern: Custom hooks providing data fetching, caching, and mutations
 * All hooks use React Query for efficient data management
 *
 * Last Updated: 2025-01-30
 * Version: 1.0.0
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useService } from '@/modules/core/hooks/useService';
import { ISalesService } from '../services/salesService';
import { handleError } from '@/modules/core/utils/errorHandler';
import type { Deal } from '@/types';

/**
 * Query key factory for consistent cache management
 */
export const contractKeys = {
  all: ['contracts'] as const,
  deal: (dealId: string) => [...contractKeys.all, 'deal', dealId] as const,
  byContract: (contractId: string) => [...contractKeys.all, 'byContract', contractId] as const,
};

/**
 * Link contract to deal mutation
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * const { mutate: linkContract } = useLinkContract();
 * linkContract({
 *   dealId: 'deal-123',
 *   contractId: 'contract-456'
 * });
 */
export const useLinkContract = () => {
  const queryClient = useQueryClient();
  const service = useService<ISalesService>('dealsService');

  return useMutation({
    mutationFn: ({
      dealId,
      contractId
    }: {
      dealId: string;
      contractId: string;
    }) => service.linkContract(dealId, contractId),
    onSuccess: (updatedDeal: Deal) => {
      // Invalidate deal and contract queries
      queryClient.invalidateQueries({ queryKey: contractKeys.deal(updatedDeal.id) });
      queryClient.invalidateQueries({ queryKey: contractKeys.byContract(updatedDeal.contract_id!) });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (error) => {
      handleError(error, 'useLinkContract');
    },
  });
};

/**
 * Get deals by contract query
 *
 * @param contractId - Contract ID
 * @returns Query result with deals data
 *
 * @example
 * const { data: deals } = useDealsByContract('contract-456');
 */
export const useDealsByContract = (contractId: string) => {
  const service = useService<ISalesService>('dealsService');

  return useQuery({
    queryKey: contractKeys.byContract(contractId),
    queryFn: () => service.getDealsByContract(contractId),
    enabled: !!contractId,
    onError: (error) => {
      handleError(error, 'useDealsByContract');
    },
  });
};

/**
 * Create contract from deal mutation
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * const { mutate: createContractFromDeal } = useCreateContractFromDeal();
 * createContractFromDeal({
 *   dealId: 'deal-123',
 *   contractData: {
 *     start_date: '2024-01-15',
 *     end_date: '2025-01-15',
 *     auto_renew: true
 *   }
 * });
 */
export const useCreateContractFromDeal = () => {
  const queryClient = useQueryClient();
  const service = useService<ISalesService>('dealsService');

  return useMutation({
    mutationFn: ({
      dealId,
      contractData
    }: {
      dealId: string;
      contractData?: {
        template_id?: string;
        start_date?: string;
        end_date?: string;
        auto_renew?: boolean;
        renewal_terms?: string;
        notes?: string;
      };
    }) => service.createContractFromDeal(dealId, contractData),
    onSuccess: ({ deal, contract }) => {
      // Invalidate deal and contract queries
      queryClient.invalidateQueries({ queryKey: contractKeys.deal(deal.id) });
      queryClient.invalidateQueries({ queryKey: contractKeys.byContract(contract.id) });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      // Also invalidate contract service queries if they exist
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
    onError: (error) => {
      handleError(error, 'useCreateContractFromDeal');
    },
  });
};

/**
 * Convert deal to contract mutation
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * const { mutate: convertDealToContract } = useConvertDealToContract();
 * convertDealToContract({
 *   dealId: 'deal-123',
 *   options: {
 *     createContract: true,
 *     contractTemplate: 'template-1'
 *   }
 * });
 */
export const useConvertDealToContract = () => {
  const queryClient = useQueryClient();
  const service = useService<ISalesService>('dealsService');

  return useMutation({
    mutationFn: ({
      dealId,
      options
    }: {
      dealId: string;
      options?: {
        createContract?: boolean;
        contractTemplate?: string;
        contractData?: any;
      };
    }) => service.convertDealToContract(dealId, options),
    onSuccess: ({ deal, contract }) => {
      // Invalidate deal and contract queries
      queryClient.invalidateQueries({ queryKey: contractKeys.deal(deal.id) });
      if (contract) {
        queryClient.invalidateQueries({ queryKey: contractKeys.byContract(contract.id) });
      }
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      // Also invalidate contract service queries if they exist
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
    onError: (error) => {
      handleError(error, 'useConvertDealToContract');
    },
  });
};

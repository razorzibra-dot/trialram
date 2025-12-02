/**
 * Payment Processing Hooks
 * React Query hooks for deal payment operations
 *
 * Pattern: Custom hooks providing data fetching, caching, and mutations
 * All hooks use React Query for efficient data management
 *
 * Last Updated: 2025-01-30
 * Version: 1.0.0
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useService } from '@/modules/core/hooks/useService';
import { ISalesService } from '../services/salesService';
import { handleError } from '@/modules/core/utils/errorHandler';
import type { Deal } from '@/types';

/**
 * Query key factory for consistent cache management
 */
export const paymentKeys = {
  all: ['payments'] as const,
  deal: (dealId: string) => [...paymentKeys.all, 'deal', dealId] as const,
};

/**
 * Process payment for a deal mutation
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * const { mutate: processPayment } = useProcessPayment();
 * processPayment({
 *   dealId: 'deal-123',
 *   amount: 5000,
 *   payment_date: '2024-01-15',
 *   payment_method: 'bank_transfer'
 * });
 */
export const useProcessPayment = () => {
  const queryClient = useQueryClient();
  const service = useService<ISalesService>('salesService');

  return useMutation({
    mutationFn: ({
      dealId,
      paymentData
    }: {
      dealId: string;
      paymentData: {
        amount: number;
        payment_date: string;
        payment_method: string;
        reference_number?: string;
        notes?: string;
      };
    }) => service.processPayment(dealId, paymentData),
    onSuccess: (updatedDeal: Deal) => {
      // Invalidate deal queries
      queryClient.invalidateQueries({ queryKey: paymentKeys.deal(updatedDeal.id) });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (error) => {
      handleError(error, 'useProcessPayment');
    },
  });
};

/**
 * Update payment status mutation
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * const { mutate: updatePaymentStatus } = useUpdatePaymentStatus();
 * updatePaymentStatus({
 *   dealId: 'deal-123',
 *   status: 'paid'
 * });
 */
export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();
  const service = useService<ISalesService>('salesService');

  return useMutation({
    mutationFn: ({
      dealId,
      status
    }: {
      dealId: string;
      status: 'pending' | 'partial' | 'paid' | 'overdue';
    }) => service.updatePaymentStatus(dealId, status),
    onSuccess: (updatedDeal: Deal) => {
      // Invalidate deal queries
      queryClient.invalidateQueries({ queryKey: paymentKeys.deal(updatedDeal.id) });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (error) => {
      handleError(error, 'useUpdatePaymentStatus');
    },
  });
};
/**
 * Revenue Recognition Hooks
 * React Query hooks for deal revenue operations
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
import type { Deal, RevenueRecognitionSchedule } from '@/types';

/**
 * Query key factory for consistent cache management
 */
export const revenueKeys = {
  all: ['revenue'] as const,
  schedule: (dealId: string) => [...revenueKeys.all, 'schedule', dealId] as const,
};

/**
 * Recognize revenue for a deal mutation
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * const { mutate: recognizeRevenue } = useRecognizeRevenue();
 * recognizeRevenue({
 *   dealId: 'deal-123',
 *   amount: 10000,
 *   recognition_date: '2024-01-15',
 *   method: 'milestone',
 *   description: 'Project completion milestone'
 * });
 */
export const useRecognizeRevenue = () => {
  const queryClient = useQueryClient();
  const service = useService<ISalesService>('salesService');

  return useMutation({
    mutationFn: ({
      dealId,
      recognitionData
    }: {
      dealId: string;
      recognitionData: {
        amount: number;
        recognition_date: string;
        method: 'immediate' | 'installments' | 'milestone' | 'time_based';
        description?: string;
      };
    }) => service.recognizeRevenue(dealId, recognitionData),
    onSuccess: (updatedDeal: Deal) => {
      // Invalidate deal and revenue queries
      queryClient.invalidateQueries({ queryKey: revenueKeys.schedule(updatedDeal.id) });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (error) => {
      handleError(error, 'useRecognizeRevenue');
    },
  });
};

/**
 * Create revenue recognition schedule mutation
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * const { mutate: createRevenueSchedule } = useCreateRevenueSchedule();
 * createRevenueSchedule({
 *   dealId: 'deal-123',
 *   scheduleData: {
 *     installments: [
 *       { amount: 5000, recognition_date: '2024-01-15', description: 'Initial payment' },
 *       { amount: 5000, recognition_date: '2024-03-15', description: 'Final delivery' }
 *     ]
 *   }
 * });
 */
export const useCreateRevenueSchedule = () => {
  const queryClient = useQueryClient();
  const service = useService<ISalesService>('salesService');

  return useMutation({
    mutationFn: ({
      dealId,
      scheduleData
    }: {
      dealId: string;
      scheduleData: {
        installments: Array<{
          amount: number;
          recognition_date: string;
          description?: string;
          milestone?: string;
        }>;
      };
    }) => service.createRevenueSchedule(dealId, scheduleData),
    onSuccess: (_, { dealId }) => {
      // Invalidate revenue schedule queries
      queryClient.invalidateQueries({ queryKey: revenueKeys.schedule(dealId) });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (error) => {
      handleError(error, 'useCreateRevenueSchedule');
    },
  });
};

/**
 * Get revenue recognition schedule query
 *
 * @param dealId - Deal ID
 * @returns Query result with revenue schedule data
 *
 * @example
 * const { data: schedule } = useRevenueSchedule('deal-123');
 */
export const useRevenueSchedule = (dealId: string) => {
  const service = useService<ISalesService>('salesService');

  return useQuery({
    queryKey: revenueKeys.schedule(dealId),
    queryFn: () => service.getRevenueSchedule(dealId),
    enabled: !!dealId,
    onError: (error) => {
      handleError(error, 'useRevenueSchedule');
    },
  });
};
/**
 * useProductSale Hook
 * Fetches a single product sale by ID
 * Uses React Query for caching with proper cache invalidation
 */

import { useQuery } from '@tanstack/react-query';
import { ProductSale } from '@/types/productSales';
import { useProductSalesStore } from '../store/productSalesStore';
import { useService } from '@/modules/core/hooks/useService';
import { productSalesKeys } from './useProductSales';

/**
 * Hook for fetching a single product sale by ID
 * @param id Product Sale ID
 * @returns Query result with data, loading, error
 */
export const useProductSale = (id: string) => {
  const { setSelectedSale, setError, clearError } = useProductSalesStore();
  const service = useService<any>('productSaleService');

  return useQuery({
    queryKey: productSalesKeys.detail(id),
    queryFn: async () => {
      clearError();
      try {
        if (!id) {
          throw new Error('Product sale ID is required');
        }

        const sale: ProductSale = await service.getProductSale(id);

        // Update store with selected sale
        setSelectedSale(sale);

        return sale;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch product sale';
        setError(errorMessage);
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for fetching product sale with related contract data
 * @param id Product Sale ID
 * @returns Query result with extended data including contract information
 */
export const useProductSaleWithContract = (id: string) => {
  const service = useService<any>('productSaleService');

  return useQuery({
    queryKey: [...productSalesKeys.detail(id), 'with-contract'],
    queryFn: async () => {
      if (!id) {
        throw new Error('Product sale ID is required');
      }

      return service.getProductSaleWithContract(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
};
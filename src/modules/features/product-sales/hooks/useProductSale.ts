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
import type { IProductSalesService } from '../services/productSalesService';
import { DETAIL_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';

/**
 * Hook for fetching a single product sale by ID
 * @param id Product Sale ID
 * @returns Query result with data, loading, error
 */
export const useProductSale = (id: string) => {
  const { setSelectedSale, setError, clearError } = useProductSalesStore();
  const service = useService<IProductSalesService>('productSaleService');

  return useQuery({
    queryKey: productSalesKeys.detail(id),
    queryFn: async () => {
      clearError();
      try {
        if (!id) {
          throw new Error('Product sale ID is required');
        }

        const sale: ProductSale = await service.getProductSale(id);
        setSelectedSale(sale);
        return sale;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch product sale';
        setError(errorMessage);
        throw error;
      }
    },
    ...DETAIL_QUERY_CONFIG,
    enabled: !!id,
  });
};

/**
 * Hook for fetching product sale with related contract data
 * @param id Product Sale ID
 * @returns Query result with extended data including contract information
 */
export const useProductSaleWithContract = (id: string) => {
  const service = useService<IProductSalesService>('productSaleService');

  return useQuery({
    queryKey: [...productSalesKeys.detail(id), 'with-contract'],
    queryFn: async () => {
      if (!id) {
        throw new Error('Product sale ID is required');
      }
      return service.getProductSaleWithContract(id);
    },
    ...DETAIL_QUERY_CONFIG,
    enabled: !!id,
  });
};
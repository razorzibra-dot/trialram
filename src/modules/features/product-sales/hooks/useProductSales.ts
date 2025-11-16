/**
 * Product Sales Hooks
 * Standardized React hooks for product sales operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductSale, ProductSaleFilters, ProductSalesResponse } from '@/types/productSales';
import { useProductSalesStore } from '../store/productSalesStore';
import { useService } from '@/modules/core/hooks/useService';
import type { IProductSalesService } from '../services/productSalesService';
import { LISTS_QUERY_CONFIG, DETAIL_QUERY_CONFIG, STATS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';
import { handleError } from '@/modules/core/utils/errorHandler';

/**
 * Query key factory for consistent cache management
 * Ensures all queries can be invalidated correctly
 */
export const productSalesKeys = {
  all: ['productSales'] as const,
  lists: () => [...productSalesKeys.all, 'list'] as const,
  list: (filters: ProductSaleFilters) => [...productSalesKeys.lists(), filters] as const,
  details: () => [...productSalesKeys.all, 'detail'] as const,
  detail: (id: string) => [...productSalesKeys.details(), id] as const,
  analytics: () => [...productSalesKeys.all, 'analytics'] as const,
} as const;

/**
 * Hook for fetching product sales with filters and pagination
 * @param filters Optional ProductSaleFilters for filtering
 * @param page Page number (1-indexed)
 * @param pageSize Items per page
 * @returns Query result with data, loading, error, and refetch
 */
export const useProductSales = (
  filters: ProductSaleFilters = {},
  page: number = 1,
  pageSize: number = 20
) => {
  const { setSales, setLoading, setPagination, setError, clearError } = useProductSalesStore();
  const service = useService<IProductSalesService>('productSaleService');

  return useQuery({
    queryKey: productSalesKeys.list(filters),
    queryFn: async () => {
      try {
        clearError();
        setLoading(true);
        const response: ProductSalesResponse = await service.getProductSales(
          filters,
          page,
          pageSize
        );

        setSales(response.data);
        setPagination({
          currentPage: response.page,
          pageSize: response.limit,
          totalCount: response.total,
          totalPages: response.totalPages,
        });

        return response;
      } catch (error) {
        const message = handleError(error, 'useProductSales');
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching product sales by customer
 * @param customerId Customer ID
 * @param filters Optional ProductSaleFilters
 * @returns Query result
 */
export const useProductSalesByCustomer = (
  customerId: string,
  filters: ProductSaleFilters = {}
) => {
  const service = useService<IProductSalesService>('productSaleService');

  return useQuery({
    queryKey: [...productSalesKeys.list(filters), 'customer', customerId],
    queryFn: async () => {
      if (!customerId) {
        throw new Error('Customer ID is required');
      }
      return service.getProductSales(
        { ...filters, customer_id: customerId },
        1,
        100 // Get more for customer view
      );
    },
    ...LISTS_QUERY_CONFIG,
    enabled: !!customerId,
  });
};

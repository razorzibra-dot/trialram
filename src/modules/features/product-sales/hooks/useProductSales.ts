/**
 * useProductSales Hook
 * Fetches all product sales with optional filters
 * Uses React Query for caching and refetch capabilities
 */

import { useQuery } from '@tanstack/react-query';
import { ProductSale, ProductSaleFilters, ProductSalesResponse } from '@/types/productSales';
import { useProductSalesStore } from '../store/productSalesStore';
import { useService } from '@/modules/core/hooks/useService';
import type { IProductSalesService } from '../services/productSalesService';
import { LISTS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';

/** Query keys for product sales */
export const productSalesKeys = {
  all: ['productSales'] as const,
  list: () => [...productSalesKeys.all, 'list'] as const,
  filtered: (filters: ProductSaleFilters) => [...productSalesKeys.list(), filters] as const,
  detail: (id: string) => [...productSalesKeys.all, 'detail', id] as const,
  analytics: () => [...productSalesKeys.all, 'analytics'] as const,
};

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
    queryKey: productSalesKeys.filtered({ ...filters, page, pageSize }),
    queryFn: async () => {
      clearError();
      setLoading(true);
      try {
        const response: ProductSalesResponse = await service.getProductSales(
          filters,
          page,
          pageSize
        );

        setSales(response.data);
        setPagination({
          currentPage: response.page,
          pageSize: response.pageSize,
          totalCount: response.total,
          totalPages: response.totalPages,
        });

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch product sales';
        setError(errorMessage);
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
    queryKey: [...productSalesKeys.filtered(filters), 'customer', customerId],
    queryFn: async () => {
      if (!customerId) {
        throw new Error('Customer ID is required');
      }
      return service.getProductSalesByCustomer(customerId, filters);
    },
    ...LISTS_QUERY_CONFIG,
    enabled: !!customerId,
  });
};
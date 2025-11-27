/**
 * Product Hooks
 * Standardized React hooks for product operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services';
import { LISTS_QUERY_CONFIG, DETAIL_QUERY_CONFIG, STATS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';
import { handleError } from '@/modules/core/utils/errorHandler';
import type { Product, ProductFormData } from '@/types/masters';

/**
 * Query key factory for consistent cache management
 * Ensures all queries can be invalidated correctly
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: any) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  stats: () => [...productKeys.all, 'stats'] as const,
} as const;

/**
 * Fetch products with filters and pagination
 *
 * @param filters - Optional filters (category, status, search, type)
 * @returns Query result with data, loading, error states
 */
export const useProducts = (filters: any = {}) => {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      try {
        const response = await productService.getProducts(1, 10, filters);
        return response;
      } catch (error) {
        handleError(error, 'useProducts');
        throw error;
      }
    },
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Fetch single product by ID
 *
 * @param id - Product ID
 * @returns Query result with product data
 */
export const useProduct = (id: string) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const product = await productService.getProduct(id);
      return product;
    },
    ...DETAIL_QUERY_CONFIG,
    enabled: !!id,
  });
};

/**
 * Create new product mutation
 *
 * @returns Mutation object with mutate function
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductFormData) => productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
    onError: (error) => {
      handleError(error, 'useCreateProduct');
    },
  });
};

/**
 * Update product mutation
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) =>
      productService.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
    },
    onError: (error) => {
      handleError(error, 'useUpdateProduct');
    },
  });
};

/**
 * Delete product mutation
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
    onError: (error) => {
      handleError(error, 'useDeleteProduct');
    },
  });
};

/**
 * Export products mutation
 */
export const useProductExport = () => {
  return useMutation({
    mutationFn: (filters?: any) => productService.exportProducts(filters),
    onError: (error) => {
      handleError(error, 'useProductExport');
    },
  });
};
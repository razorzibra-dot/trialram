/**
 * Product Hooks
 * React hooks for product operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ProductService } from '../services/productService';
import { useService } from '@/modules/core/hooks/useService';
import { Product, ProductFormData, ProductFilters } from '@/types/masters';
import { LISTS_QUERY_CONFIG, DETAIL_QUERY_CONFIG, STATS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';

// Query Keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  stats: () => [...productKeys.all, 'stats'] as const,
  statuses: () => [...productKeys.all, 'statuses'] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
  types: () => [...productKeys.all, 'types'] as const,
  lowStock: () => [...productKeys.all, 'lowStock'] as const,
  outOfStock: () => [...productKeys.all, 'outOfStock'] as const,
};

/**
 * Hook for fetching products with filters
 */
export const useProducts = (filters: ProductFilters = {}) => {
  const productService = useService<ProductService>('productService');

  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productService.getProducts(filters),
    ...LISTS_QUERY_CONFIG,
  });
};

export const useProduct = (id: string) => {
  const productService = useService<ProductService>('productService');

  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productService.getProduct(id),
    ...DETAIL_QUERY_CONFIG,
    enabled: !!id,
  });
};

export const useProductStats = () => {
  const productService = useService<ProductService>('productService');

  return useQuery({
    queryKey: productKeys.stats(),
    queryFn: () => productService.getProductStats(),
    ...STATS_QUERY_CONFIG,
  });
};

export const useProductStatuses = () => {
  const productService = useService<ProductService>('productService');

  return useQuery({
    queryKey: productKeys.statuses(),
    queryFn: () => productService.getProductStatuses(),
    staleTime: 60 * 60 * 1000,
  });
};

export const useProductCategories = () => {
  const productService = useService<ProductService>('productService');

  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: () => productService.getProductCategories(),
    staleTime: 60 * 60 * 1000,
  });
};

export const useProductTypes = () => {
  const productService = useService<ProductService>('productService');

  return useQuery({
    queryKey: productKeys.types(),
    queryFn: () => productService.getProductTypes(),
    staleTime: 60 * 60 * 1000,
  });
};

export const useLowStockProducts = () => {
  const productService = useService<ProductService>('productService');

  return useQuery({
    queryKey: productKeys.lowStock(),
    queryFn: () => productService.getLowStockProducts(),
    ...LISTS_QUERY_CONFIG,
  });
};

export const useOutOfStockProducts = () => {
  const productService = useService<ProductService>('productService');

  return useQuery({
    queryKey: productKeys.outOfStock(),
    queryFn: () => productService.getOutOfStockProducts(),
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Hook for creating a product
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const productService = useService<ProductService>('productService');

  return useMutation({
    mutationFn: (data: ProductFormData) => productService.createProduct(data),
    onSuccess: (newProduct) => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: productKeys.outOfStock() });
      
      toast.success('Product created successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create product');
    },
  });
};

/**
 * Hook for updating a product
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const productService = useService<ProductService>('productService');

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) =>
      productService.updateProduct(id, data),
    onSuccess: (updatedProduct) => {
      // Update the specific product in cache
      queryClient.setQueryData(
        productKeys.detail(updatedProduct.id),
        updatedProduct
      );
      
      // Invalidate lists to reflect changes
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: productKeys.outOfStock() });
      
      toast.success('Product updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update product');
    },
  });
};

/**
 * Hook for deleting a product
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const productService = useService<ProductService>('productService');

  return useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: productKeys.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: productKeys.outOfStock() });
      
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete product');
    },
  });
};

/**
 * Hook for updating product status
 */
export const useUpdateProductStatus = () => {
  const queryClient = useQueryClient();
  const productService = useService<ProductService>('productService');

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      productService.updateProductStatus(id, status),
    onSuccess: (updatedProduct) => {
      // Update the specific product in cache
      queryClient.setQueryData(
        productKeys.detail(updatedProduct.id),
        updatedProduct
      );
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      
      toast.success('Product status updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update product status');
    },
  });
};

/**
 * Hook for updating product stock
 */
export const useUpdateProductStock = () => {
  const queryClient = useQueryClient();
  const productService = useService<ProductService>('productService');

  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      productService.updateProductStock(id, quantity),
    onSuccess: (updatedProduct) => {
      // Update the specific product in cache
      queryClient.setQueryData(
        productKeys.detail(updatedProduct.id),
        updatedProduct
      );
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: productKeys.outOfStock() });
      
      toast.success('Product stock updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update product stock');
    },
  });
};

/**
 * Hook for bulk operations on products
 */
export const useBulkProductOperations = () => {
  const queryClient = useQueryClient();
  const productService = useService<ProductService>('productService');

  const bulkUpdate = useMutation({
    mutationFn: ({ ids, updates }: { ids: string[]; updates: Partial<ProductFormData> }) =>
      productService.bulkUpdateProducts(ids, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: productKeys.outOfStock() });
      toast.success('Products updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update products');
    },
  });

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => productService.bulkDeleteProducts(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: productKeys.outOfStock() });
      toast.success('Products deleted successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete products');
    },
  });

  return { bulkUpdate, bulkDelete };
};

/**
 * Hook for exporting products
 */
export const useExportProducts = () => {
  const productService = useService<ProductService>('productService');

  return useMutation({
    mutationFn: (format: 'csv' | 'json' = 'csv') => productService.exportProducts(format),
    onSuccess: (data, format) => {
      // Create and download file
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Products exported successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to export products');
    },
  });
};

/**
 * Hook for importing products
 */
export const useImportProducts = () => {
  const queryClient = useQueryClient();
  const productService = useService<ProductService>('productService');

  return useMutation({
    mutationFn: (csv: string) => productService.importProducts(csv),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: productKeys.outOfStock() });
      
      if (result.errors.length > 0) {
        toast.warning(`Imported ${result.success} products with ${result.errors.length} errors`);
      } else {
        toast.success(`Successfully imported ${result.success} products`);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to import products');
    },
  });
};

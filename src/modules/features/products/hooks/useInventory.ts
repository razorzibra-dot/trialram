/**
 * Inventory Hooks
 * React hooks for inventory management operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/serviceFactory';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/useNotification';
import { LISTS_QUERY_CONFIG, DETAIL_QUERY_CONFIG, STATS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';
import { handleError } from '@/modules/core/utils/errorHandler';
import type { Product } from '@/types/masters';

// Query Keys
export const inventoryKeys = {
  all: ['inventory'] as const,
  products: () => [...inventoryKeys.all, 'products'] as const,
  product: (id: string) => [...inventoryKeys.products(), id] as const,
  lowStock: () => [...inventoryKeys.all, 'low-stock'] as const,
  outOfStock: () => [...inventoryKeys.all, 'out-of-stock'] as const,
};

/**
 * Hook for fetching products with inventory information
 */
export const useInventory = (filters: {
  lowStock?: boolean;
  outOfStock?: boolean;
  category?: string;
  search?: string;
} = {}) => {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  return useQuery({
    queryKey: [...inventoryKeys.products(), filters, tenantId],
    queryFn: async () => {
      const response = await productService.getProducts(1, 100, filters, tenantId);
      return response.data;
    },
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching low stock products
 */
export const useLowStockProducts = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  return useQuery({
    queryKey: [...inventoryKeys.lowStock(), tenantId],
    queryFn: async () => {
      const response = await productService.getProducts(1, 100, { lowStock: true }, tenantId);
      return response.data.filter(product =>
        product.stock_quantity <= product.min_stock_level
      );
    },
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching out of stock products
 */
export const useOutOfStockProducts = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  return useQuery({
    queryKey: [...inventoryKeys.outOfStock(), tenantId],
    queryFn: async () => {
      const response = await productService.getProducts(1, 100, { outOfStock: true }, tenantId);
      return response.data.filter(product =>
        product.stock_quantity === 0
      );
    },
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Hook for updating product stock levels
 */
export const useUpdateStock = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async ({
      productId,
      stockQuantity,
      minStockLevel,
      maxStockLevel
    }: {
      productId: string;
      stockQuantity?: number;
      minStockLevel?: number;
      maxStockLevel?: number;
    }) => {
      const updateData: Partial<{
        stock_quantity: number;
        min_stock_level: number;
        max_stock_level: number;
      }> = {};

      if (stockQuantity !== undefined) updateData.stock_quantity = stockQuantity;
      if (minStockLevel !== undefined) updateData.min_stock_level = minStockLevel;
      if (maxStockLevel !== undefined) updateData.max_stock_level = maxStockLevel;

      return await productService.updateProduct(productId, updateData);
    },
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.products() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.product(updatedProduct.id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.outOfStock() });
      success('Stock levels updated successfully');
    },
    onError: (err) => {
      console.error('[useUpdateStock] Error:', err);
      error(err instanceof Error ? err.message : 'Failed to update stock levels');
    },
  });
};

/**
 * Hook for bulk stock updates
 */
export const useBulkUpdateStock = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (updates: Array<{
      productId: string;
      stockQuantity?: number;
      minStockLevel?: number;
      maxStockLevel?: number;
    }>) => {
      const promises = updates.map(update =>
        productService.updateProduct(update.productId, {
          stock_quantity: update.stockQuantity,
          min_stock_level: update.minStockLevel,
          max_stock_level: update.maxStockLevel,
        })
      );
      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.products() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.outOfStock() });
      success('Bulk stock update completed successfully');
    },
    onError: (err) => {
      console.error('[useBulkUpdateStock] Error:', err);
      error(err instanceof Error ? err.message : 'Failed to update stock levels');
    },
  });
};

/**
 * Hook for inventory statistics
 */
export const useInventoryStats = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  return useQuery({
    queryKey: [...inventoryKeys.all, 'stats', tenantId],
    queryFn: async () => {
      const response = await productService.getProducts(1, 1000, {}, tenantId);
      const products = response.data;

      const totalProducts = products.length;
      const inStock = products.filter(p => p.stock_quantity > 0).length;
      const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level).length;
      const outOfStock = products.filter(p => p.stock_quantity === 0).length;
      const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);

      return {
        totalProducts,
        inStock,
        lowStock,
        outOfStock,
        totalValue,
      };
    },
    ...STATS_QUERY_CONFIG,
  });
};
/**
 * Product Variants Hooks
 * React Query hooks for product variant operations
 */

import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services';
import { DETAIL_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';
import { handleError } from '@/modules/core/utils/errorHandler';
import type { Product } from '@/types/masters';

/**
 * Query key factory for product variants
 */
export const productVariantKeys = {
  all: ['products', 'variants'] as const,
  variants: (baseProductId: string) => [...productVariantKeys.all, baseProductId] as const,
  children: (parentId: string) => [...productVariantKeys.all, 'children', parentId] as const,
  parent: (childId: string) => [...productVariantKeys.all, 'parent', childId] as const,
  hierarchy: (productId: string) => [...productVariantKeys.all, 'hierarchy', productId] as const,
  root: () => [...productVariantKeys.all, 'root'] as const,
} as const;

/**
 * Fetch product variants for a base product
 *
 * @param baseProductId - ID of the base product
 * @returns Query result with variant products array
 */
export const useProductVariants = (baseProductId: string) => {
  return useQuery({
    queryKey: productVariantKeys.variants(baseProductId),
    queryFn: async () => {
      try {
        const variants = await productService.getProductVariants(baseProductId);
        return variants;
      } catch (error) {
        handleError(error, 'useProductVariants');
        throw error;
      }
    },
    ...DETAIL_QUERY_CONFIG,
    enabled: !!baseProductId,
  });
};

/**
 * Fetch product children (direct descendants)
 *
 * @param parentId - ID of the parent product
 * @returns Query result with child products array
 */
export const useProductChildren = (parentId: string) => {
  return useQuery({
    queryKey: productVariantKeys.children(parentId),
    queryFn: async () => {
      try {
        const children = await productService.getProductChildren(parentId);
        return children;
      } catch (error) {
        handleError(error, 'useProductChildren');
        throw error;
      }
    },
    ...DETAIL_QUERY_CONFIG,
    enabled: !!parentId,
  });
};

/**
 * Fetch product parent
 *
 * @param childId - ID of the child product
 * @returns Query result with parent product or null
 */
export const useProductParent = (childId: string) => {
  return useQuery({
    queryKey: productVariantKeys.parent(childId),
    queryFn: async () => {
      try {
        const parent = await productService.getProductParent(childId);
        return parent;
      } catch (error) {
        handleError(error, 'useProductParent');
        throw error;
      }
    },
    ...DETAIL_QUERY_CONFIG,
    enabled: !!childId,
  });
};

/**
 * Fetch complete product hierarchy information
 *
 * @param productId - ID of the product
 * @returns Query result with hierarchy data (product, parent, children, siblings)
 */
export const useProductHierarchy = (productId: string) => {
  return useQuery({
    queryKey: productVariantKeys.hierarchy(productId),
    queryFn: async () => {
      try {
        const hierarchy = await productService.getProductHierarchy(productId);
        return hierarchy;
      } catch (error) {
        handleError(error, 'useProductHierarchy');
        throw error;
      }
    },
    ...DETAIL_QUERY_CONFIG,
    enabled: !!productId,
  });
};

/**
 * Fetch root products (products with no parent)
 *
 * @returns Query result with root products array
 */
export const useRootProducts = () => {
  return useQuery({
    queryKey: productVariantKeys.root(),
    queryFn: async () => {
      try {
        const rootProducts = await productService.getRootProducts();
        return rootProducts;
      } catch (error) {
        handleError(error, 'useRootProducts');
        throw error;
      }
    },
    ...DETAIL_QUERY_CONFIG,
  });
};
/**
 * Categories Hooks
 * React hooks for product category operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductCategory, CreateProductCategoryDTO, UpdateProductCategoryDTO } from '@/types/referenceData.types';
import { referenceDataService } from '@/services/serviceFactory';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/useNotification';
import { LISTS_QUERY_CONFIG, DETAIL_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';
import { handleError } from '@/modules/core/utils/errorHandler';

// Query Keys
export const categoriesKeys = {
  all: ['categories'] as const,
  categories: () => [...categoriesKeys.all, 'categories'] as const,
  category: (id: string) => [...categoriesKeys.categories(), id] as const,
};

/**
 * Hook for fetching product categories
 */
export const useCategories = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  return useQuery({
    queryKey: [...categoriesKeys.categories(), tenantId],
    queryFn: async () => {
      const response = await referenceDataService.getCategories(tenantId);
      return response;
    },
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Hook for fetching a single category
 */
export const useCategory = (id: string) => {
  return useQuery({
    queryKey: categoriesKeys.category(id),
    queryFn: async () => {
      // Since referenceDataService doesn't have getCategory, we'll get all and filter
      const categories = await referenceDataService.getCategories();
      const category = categories.find(c => c.id === id);
      if (!category) {
        throw new Error('Category not found');
      }
      return category;
    },
    enabled: !!id,
    ...DETAIL_QUERY_CONFIG,
  });
};

/**
 * Hook for creating a new category
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (data: CreateProductCategoryDTO) => {
      const categoryData = {
        ...data,
        tenantId: user?.tenantId || ''
      };
      return await referenceDataService.createCategory(categoryData);
    },
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.categories() });
      success('Category created successfully');
    },
    onError: (err) => {
      console.error('[useCreateCategory] Error:', err);
      error(err instanceof Error ? err.message : 'Failed to create category');
    },
  });
};

/**
 * Hook for updating a category
 */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductCategoryDTO }) => {
      return await referenceDataService.updateCategory(id, data);
    },
    onSuccess: (updatedCategory) => {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.category(updatedCategory.id) });
      queryClient.invalidateQueries({ queryKey: categoriesKeys.categories() });
      success('Category updated successfully');
    },
    onError: (err) => {
      console.error('[useUpdateCategory] Error:', err);
      error(err instanceof Error ? err.message : 'Failed to update category');
    },
  });
};

/**
 * Hook for deleting a category
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: async (id: string) => {
      await referenceDataService.deleteCategory(id);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: categoriesKeys.categories() });
      success('Category deleted successfully');
    },
    onError: (err) => {
      console.error('[useDeleteCategory] Error:', err);
      error(err instanceof Error ? err.message : 'Failed to delete category');
    },
  });
};
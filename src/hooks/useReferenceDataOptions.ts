/**
 * LAYER 7: CUSTOM HOOKS - Reference Data Options
 * ============================================================================
 * Custom React hooks for loading and filtering reference data
 * Part of 8-layer sync pattern for dynamic data loading architecture
 * 
 * ✅ SYNCHRONIZATION:
 * - Uses referenceDataLoader from factory (Layer 5)
 * - Returns types from referenceData.types.ts (Layer 2)
 * - Memoized for performance
 * - Proper error handling and loading states
 */

import { useMemo, useCallback } from 'react';
import { referenceDataLoader } from '@/services/serviceFactory';
import {
  StatusOption,
  ReferenceData,
  ProductCategory,
  Supplier,
} from '@/types/referenceData.types';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook for loading and memoizing categories
 * @param tenantId - Tenant ID
 * @param staleTime - Cache stale time in milliseconds (default: 5 minutes)
 * @returns Object with categories, loading, error, and refetch
 */
export function useCategories(
  tenantId: string,
  staleTime = 5 * 60 * 1000
) {
  const { data: categories = [], isLoading, error, refetch } = useQuery({
    queryKey: ['referenceData', 'categories', tenantId],
    queryFn: () => referenceDataLoader.loadCategories(tenantId),
    staleTime,
  });

  // Memoize category options for select dropdown
  const categoryOptions = useMemo(
    () => categories.map(cat => ({
      label: cat.name,
      value: cat.id,
      description: cat.description,
    })),
    [categories]
  );

  return {
    categories,
    categoryOptions,
    loading: isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for loading and memoizing suppliers
 * @param tenantId - Tenant ID
 * @param staleTime - Cache stale time in milliseconds (default: 5 minutes)
 * @returns Object with suppliers, loading, error, and refetch
 */
export function useSuppliers(
  tenantId: string,
  staleTime = 5 * 60 * 1000
) {
  const { data: suppliers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['referenceData', 'suppliers', tenantId],
    queryFn: () => referenceDataLoader.loadSuppliers(tenantId),
    staleTime,
  });

  // Memoize supplier options for select dropdown
  const supplierOptions = useMemo(
    () => suppliers.map(supplier => ({
      label: supplier.name,
      value: supplier.id,
      email: supplier.email,
      phone: supplier.phone,
    })),
    [suppliers]
  );

  return {
    suppliers,
    supplierOptions,
    loading: isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for loading and memoizing status options for a specific module
 * @param tenantId - Tenant ID
 * @param module - Module name (e.g., 'sales', 'tickets', 'contracts')
 * @param staleTime - Cache stale time in milliseconds (default: 5 minutes)
 * @returns Object with statuses, loading, error, and refetch
 */
export function useStatusOptions(
  tenantId: string,
  module: string,
  staleTime = 5 * 60 * 1000
) {
  const { data: statuses = [], isLoading, error, refetch } = useQuery({
    queryKey: ['referenceData', 'statusOptions', tenantId, module],
    queryFn: () => referenceDataLoader.loadStatusOptions(tenantId, module),
    staleTime,
  });

  // Memoize status options for select dropdown with colors
  const statusOptions = useMemo(
    () => statuses.map(status => ({
      label: status.displayLabel,
      value: status.statusKey,
      color: status.colorCode,
      description: status.description,
    })),
    [statuses]
  );

  return {
    statuses,
    statusOptions,
    loading: isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for loading and memoizing reference data by category
 * @param tenantId - Tenant ID
 * @param category - Category name (e.g., 'priority', 'severity', 'department')
 * @param staleTime - Cache stale time in milliseconds (default: 5 minutes)
 * @returns Object with reference data items, loading, error, and refetch
 */
export function useReferenceDataByCategory(
  tenantId: string,
  category: string,
  staleTime = 5 * 60 * 1000
) {
  const { data: items = [], isLoading, error, refetch } = useQuery({
    queryKey: ['referenceData', 'items', tenantId, category],
    queryFn: () => referenceDataLoader.loadReferenceData(tenantId, category),
    staleTime,
  });

  // Memoize options for select dropdown
  const options = useMemo(
    () => items.map(item => ({
      label: item.label,
      value: item.key,
      metadata: item.metadata,
      description: item.description,
    })),
    [items]
  );

  return {
    items,
    options,
    loading: isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for loading all reference data at once
 * Used by context providers or when all data is needed
 * @param tenantId - Tenant ID
 * @param staleTime - Cache stale time in milliseconds (default: 5 minutes)
 * @returns Object with all reference data
 */
export function useAllReferenceData(
  tenantId: string,
  staleTime = 5 * 60 * 1000
) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['referenceData', 'all', tenantId],
    queryFn: () => referenceDataLoader.loadAllReferenceData(tenantId),
    staleTime,
  });

  const allData = data || {
    statusOptions: [],
    referenceData: [],
    categories: [],
    suppliers: [],
  };

  return {
    statusOptions: allData.statusOptions,
    referenceData: allData.referenceData,
    categories: allData.categories,
    suppliers: allData.suppliers,
    loading: isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting reference data options organized by category
 * @param tenantId - Tenant ID
 * @param categories - Array of category names to load
 * @param staleTime - Cache stale time in milliseconds (default: 5 minutes)
 * @returns Object with options organized by category
 */
export function useReferenceDataOptions(
  tenantId: string,
  categories: string[] = [],
  staleTime = 5 * 60 * 1000
) {
  const { data: items = [], isLoading, error, refetch } = useQuery({
    queryKey: ['referenceData', 'options', tenantId, categories.join(',')],
    queryFn: async () => {
      if (categories.length === 0) {
        return referenceDataLoader.loadReferenceData(tenantId);
      }

      // Load data for all specified categories
      const results = await Promise.all(
        categories.map(cat =>
          referenceDataLoader.loadReferenceData(tenantId, cat)
        )
      );
      return results.flat();
    },
    staleTime,
    enabled: categories.length > 0,
  });

  // Organize items by category
  const optionsByCategory = useMemo(() => {
    const organized: Record<string, Array<{
      label: string;
      value: string;
      metadata?: Record<string, any>;
    }>> = {};

    items.forEach(item => {
      if (!organized[item.category]) {
        organized[item.category] = [];
      }
      organized[item.category].push({
        label: item.label,
        value: item.key,
        metadata: item.metadata,
      });
    });

    return organized;
  }, [items]);

  return {
    items,
    optionsByCategory,
    loading: isLoading,
    error,
    refetch,
  };
}

export default {
  useCategories,
  useSuppliers,
  useStatusOptions,
  useReferenceDataByCategory,
  useAllReferenceData,
  useReferenceDataOptions,
};

/**
 * LAYER 7: CUSTOM HOOKS - Reference Data Options
 * ============================================================================
 * Custom React hooks for loading and filtering reference data
 * Part of 8-layer sync pattern for dynamic data loading architecture
 * 
 * ✅ SYNCHRONIZATION:
 * - Uses ReferenceDataContext (Layer 6) which caches Supabase results
 * - Returns types from referenceData.types.ts (Layer 2)
 * - Memoized for performance
 * - Proper error handling and loading states
 */

import { useMemo } from 'react';
import {
  StatusOption,
  ReferenceData,
  ProductCategory,
  Supplier,
} from '@/types/referenceData.types';
import { useReferenceData } from '@/contexts/ReferenceDataContext';

/**
 * Hook for loading and memoizing categories
 * @param tenantId - Tenant ID
 * @param staleTime - Cache stale time in milliseconds (default: 5 minutes)
 * @returns Object with categories, loading, error, and refetch
 */
export function useCategories(
  tenantId?: string,
  staleTime = 5 * 60 * 1000
) {
  const {
    categories,
    isLoading,
    error,
    refreshCategories,
  } = useReferenceData();

  const categoryOptions = useMemo(
    () => categories.map(cat => ({
      label: cat.name,
      value: cat.id,
      description: cat.description,
    })),
    [categories, tenantId, staleTime]
  );

  return {
    categories,
    categoryOptions,
    loading: isLoading,
    error,
    refetch: refreshCategories,
  };
}

/**
 * Hook for loading and memoizing suppliers
 * @param tenantId - Tenant ID
 * @param staleTime - Cache stale time in milliseconds (default: 5 minutes)
 * @returns Object with suppliers, loading, error, and refetch
 */
export function useSuppliers(
  tenantId?: string,
  staleTime = 5 * 60 * 1000
) {
  const {
    suppliers,
    isLoading,
    error,
    refreshSuppliers,
  } = useReferenceData();

  const supplierOptions = useMemo(
    () => suppliers.map(supplier => ({
      label: supplier.name,
      value: supplier.id,
      email: supplier.email,
      phone: supplier.phone,
    })),
    [suppliers, tenantId, staleTime]
  );

  return {
    suppliers,
    supplierOptions,
    loading: isLoading,
    error,
    refetch: refreshSuppliers,
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
  const {
    statusOptions: allStatusOptions,
    isLoading,
    error,
    refreshStatusOptions,
    getStatusesByModule,
  } = useReferenceData();

  const statuses = useMemo(
    () => (module ? getStatusesByModule(module) : allStatusOptions),
    [allStatusOptions, getStatusesByModule, module, tenantId, staleTime]
  );

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
    refetch: refreshStatusOptions,
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
  const {
    getRefDataByCategory,
    isLoading,
    error,
    refreshReferenceData,
  } = useReferenceData();

  const items = useMemo(
    () => getRefDataByCategory(category),
    [category, getRefDataByCategory, tenantId, staleTime]
  );

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
    refetch: refreshReferenceData,
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
  tenantId?: string,
  staleTime = 5 * 60 * 1000
) {
  const {
    statusOptions,
    referenceData,
    categories,
    suppliers,
    isLoading,
    error,
    refreshData,
  } = useReferenceData();

  return {
    statusOptions,
    referenceData,
    categories,
    suppliers,
    loading: isLoading,
    error,
    refetch: refreshData,
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
  const {
    referenceData,
    getRefDataByCategory,
    isLoading,
    error,
    refreshReferenceData,
  } = useReferenceData();

  const items = useMemo(() => {
    if (!categories.length) {
      return referenceData;
    }
    return categories.flatMap(cat => getRefDataByCategory(cat));
  }, [categories.join(','), referenceData, getRefDataByCategory, tenantId, staleTime]);

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
    refetch: refreshReferenceData,
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

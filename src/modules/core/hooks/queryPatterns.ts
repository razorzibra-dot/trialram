/**
 * React Query Pattern Utilities
 * Standard patterns for consistent query hook implementation across all modules
 */

import { useCallback } from 'react';
import { QueryKey, UseQueryOptions, UseMutationOptions, MutationFunction } from '@tanstack/react-query';

/**
 * Pattern 1: Standard Query Configuration
 * Use for simple data fetching without complex state management
 */
export const createQueryOptions = <TData>(
  staleTime: number = 5 * 60 * 1000, // 5 minutes default
  gcTime: number = 10 * 60 * 1000,   // 10 minutes default
): Partial<UseQueryOptions<TData>> => ({
  staleTime,
  gcTime,
  retry: 1,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

/**
 * Pattern 2: Query Key Factory
 * Use to create consistent, hierarchical query keys
 * 
 * Example:
 * const customerKeys = createQueryKeyFactory('customers');
 * queryKey: customerKeys.list(filters)
 */
export const createQueryKeyFactory = (feature: string) => ({
  all: [feature] as const,
  lists: () => [...[feature], 'list'] as const,
  list: (filters: Record<string, unknown>) => [...[feature, 'list'], filters] as const,
  details: () => [...[feature], 'detail'] as const,
  detail: (id: string) => [...[feature, 'detail'], id] as const,
  stats: () => [...[feature], 'stats'] as const,
});

/**
 * Pattern 3: Error Handler Wrapper
 * Standardize error handling across modules
 */
export const createErrorHandler = (
  onError?: (error: Error) => void,
  showNotification?: (message: string) => void
) => {
  return (error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    console.error('Query error:', error);
    
    if (showNotification) {
      showNotification(errorMessage);
    }
    
    if (onError && error instanceof Error) {
      onError(error);
    }
  };
};

/**
 * Pattern 4: Success Handler Wrapper
 * Standardize success handling across modules
 */
export const createSuccessHandler = <T>(
  onSuccess?: (data: T) => void,
  showNotification?: (message: string) => void
) => {
  return (data: T) => {
    console.log('Query success:', data);
    
    if (showNotification) {
      showNotification('Operation completed successfully');
    }
    
    if (onSuccess) {
      onSuccess(data);
    }
  };
};

/**
 * Pattern 5: Mutation Options Factory
 * Create consistent mutation configuration
 */
export const createMutationOptions = <TData, TError, TVariables>(
  config: {
    onSuccess?: (data: TData) => void;
    onError?: (error: TError) => void;
    successMessage?: string;
    errorMessage?: string;
    showNotifications?: boolean;
  } = {}
): UseMutationOptions<TData, TError, TVariables> => ({
  retry: 1,
  ...config,
});

/**
 * Pattern 6: Service Injection Pattern
 * Type-safe service injection in hooks
 * 
 * Usage:
 * const service = injectService<MyService>('myService');
 */
export const injectService = <T>(serviceName: string): T => {
  // This would be implemented by your dependency injection container
  // For now, it's a type-safe wrapper
  const container = (globalThis as any).__serviceContainer;
  if (!container || !container[serviceName]) {
    throw new Error(`Service ${serviceName} not found in container`);
  }
  return container[serviceName] as T;
};

/**
 * Pattern 7: Loading State Manager
 * Unified loading state handling
 */
export const useLoadingState = () => {
  const states = new Map<string, boolean>();

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    states.set(key, isLoading);
  }, []);

  const isLoading = useCallback((key: string) => {
    return states.get(key) ?? false;
  }, []);

  const isAnyLoading = useCallback(() => {
    return Array.from(states.values()).some((v) => v);
  }, []);

  return { setLoading, isLoading, isAnyLoading };
};

/**
 * Pattern 8: Pagination Helper
 * Standard pagination handling
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}

export const createPaginationHelper = (initial: PaginationState = { page: 1, pageSize: 50, total: 0 }) => {
  const goToPage = (page: number) => ({
    ...initial,
    page,
  });

  const nextPage = () => ({
    ...initial,
    page: initial.page + 1,
  });

  const previousPage = () => ({
    ...initial,
    page: Math.max(1, initial.page - 1),
  });

  return {
    goToPage,
    nextPage,
    previousPage,
    canNext: () => initial.page < (initial.totalPages ?? Math.ceil(initial.total / initial.pageSize)),
    canPrevious: () => initial.page > 1,
  };
};

/**
 * Pattern 9: Filter Helper
 * Type-safe filter management
 */
export const createFilterHelper = <TFilters extends Record<string, unknown>>(initialFilters: TFilters) => {
  const updateFilter = (key: keyof TFilters, value: unknown) => ({
    ...initialFilters,
    [key]: value,
  });

  const updateFilters = (updates: Partial<TFilters>) => ({
    ...initialFilters,
    ...updates,
  });

  const resetFilters = () => ({ ...initialFilters });

  return {
    updateFilter,
    updateFilters,
    resetFilters,
    current: initialFilters,
  };
};

/**
 * Pattern 10: Callback Deduplication (Used in Custom Wrapper)
 * Reference implementation for callback deduplication
 * 
 * This pattern is automatically handled in /src/modules/core/hooks/useQuery.ts
 * Reference this when creating custom query wrappers
 */
export interface CallbackDeduplicationConfig {
  /**
   * Track if callback has fired for current data
   */
  callbackFiredRef: React.MutableRefObject<boolean>;
  
  /**
   * Check if callback already fired
   */
  hasCallbackFired: () => boolean;
  
  /**
   * Mark callback as fired
   */
  markCallbackFired: () => void;
  
  /**
   * Reset for new query
   */
  resetCallback: () => void;
}

export const createCallbackDeduplication = (): CallbackDeduplicationConfig => {
  const callbackFiredRef = new Map<string, boolean>();

  return {
    callbackFiredRef: { current: false },
    hasCallbackFired: () => callbackFiredRef.get('default') ?? false,
    markCallbackFired: () => callbackFiredRef.set('default', true),
    resetCallback: () => callbackFiredRef.set('default', false),
  };
};

/**
 * Documentation: When to Use Each Pattern
 * 
 * Pattern 1 (Query Options):
 * - When creating queries with standard stale/gc times
 * - Reduces configuration boilerplate
 * 
 * Pattern 2 (Query Key Factory):
 * - Every module creating queries
 * - Ensures consistent key structure
 * 
 * Pattern 3-4 (Error/Success Handlers):
 * - When you need custom error/success logic
 * - Avoid duplicating notification code
 * 
 * Pattern 5 (Mutation Options):
 * - For all mutations
 * - Standardizes notification handling
 * 
 * Pattern 6 (Service Injection):
 * - In all hooks using services
 * - Type-safe service access
 * 
 * Pattern 7 (Loading State Manager):
 * - Complex forms with multiple loading states
 * - Track different operations simultaneously
 * 
 * Pattern 8 (Pagination Helper):
 * - Any module with paginated lists
 * - Consistent pagination logic
 * 
 * Pattern 9 (Filter Helper):
 * - Modules with complex filtering
 * - Type-safe filter updates
 * 
 * Pattern 10 (Callback Deduplication):
 * - Reference only - handled automatically in core hook
 * - Use if creating custom query wrapper
 */

/**
 * Complete Hook Implementation Example
 * 
 * import { useQuery } from '@tanstack/react-query';
 * import { createQueryKeyFactory, createQueryOptions } from './queryPatterns';
 * 
 * const customerKeys = createQueryKeyFactory('customers');
 * 
 * export const useCustomers = (filters = {}) => {
 *   const service = useService<CustomerService>('customerService');
 *   
 *   return useQuery({
 *     queryKey: customerKeys.list(filters),
 *     queryFn: () => service.getCustomers(filters),
 *     ...createQueryOptions(),
 *   });
 * };
 */
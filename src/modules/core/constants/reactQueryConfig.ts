/**
 * React Query Configuration Constants
 * Standardized configuration for all React Query hooks across the application
 */

/**
 * Base React Query configuration with default values
 * Used as a foundation for all query configurations
 */
export const REACT_QUERY_CONFIG = {
  // Cache configuration - how long data is considered fresh
  staleTime: 5 * 60 * 1000,        // 5 minutes - data becomes stale after this time
  gcTime: 10 * 60 * 1000,           // 10 minutes - cache is garbage collected after this time

  // Retry configuration - handles failed requests
  retry: 2,                         // Retry failed requests 2 times
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s

  // Refetch configuration - when to refresh data
  refetchOnMount: true,             // Refetch on component mount
  refetchOnWindowFocus: false,      // Don't refetch when window regains focus
  refetchOnReconnect: true,         // Refetch when connection is restored
} as const;

/**
 * Configuration for list queries
 * Used for fetching collections of data
 * Shorter stale time for more frequent updates
 */
export const LISTS_QUERY_CONFIG = {
  ...REACT_QUERY_CONFIG,
  staleTime: 5 * 60 * 1000,  // 5 minutes - more frequent staleness for lists
} as const;

/**
 * Configuration for detail/single item queries
 * Used for fetching individual items
 * Slightly longer stale time than lists
 */
export const DETAIL_QUERY_CONFIG = {
  ...REACT_QUERY_CONFIG,
  staleTime: 10 * 60 * 1000, // 10 minutes - longer staleness for stable detail views
} as const;

/**
 * Configuration for statistics/analytics queries
 * Used for dashboard stats, analytics, and summary data
 * Longest stale time as this data changes less frequently
 */
export const STATS_QUERY_CONFIG = {
  ...REACT_QUERY_CONFIG,
  staleTime: 15 * 60 * 1000, // 15 minutes - longest staleness for relatively stable stats
} as const;

/**
 * Configuration for search queries
 * Used for search operations with user input
 */
export const SEARCH_QUERY_CONFIG = {
  ...REACT_QUERY_CONFIG,
  staleTime: 2 * 60 * 1000,  // 2 minutes - shorter stale time for search results
} as const;

/**
 * Configuration for pagination
 * Used when paginating through results
 */
export const PAGINATION_QUERY_CONFIG = {
  ...REACT_QUERY_CONFIG,
  staleTime: 5 * 60 * 1000,  // 5 minutes - standard for paginated lists
} as const;

/**
 * Usage Example:
 * 
 * import { LISTS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';
 * import { useQuery } from '@tanstack/react-query';
 * 
 * export function useProducts() {
 *   return useQuery({
 *     queryKey: ['products'],
 *     queryFn: () => productService.getProducts(),
 *     ...LISTS_QUERY_CONFIG,
 *   });
 * }
 */

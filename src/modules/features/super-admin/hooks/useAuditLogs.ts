/**
 * Audit Logs Hooks - Layer 7 React Hooks
 * 
 * **Architecture**: Layer 7 (React Hooks) in 8-layer pattern
 * - Uses React Query for data management and caching
 * - Integrates with Layer 6 module service (auditServiceModule)
 * - Implements proper loading, error, and cache invalidation
 * - Provides both query and mutation hooks
 * 
 * **Caching Strategy**:
 * - Query cache: 5 minutes stale time, 10 minutes cache time
 * - Key structure: ['audit', action, ...params] for precise invalidation
 * - Automatic refetch on window focus
 * 
 * @example
 * ```typescript
 * import { useAuditLogs, useAuditStats, useExportAuditLogs } from '@/modules/features/super-admin/hooks';
 * 
 * function AuditComponent() {
 *   const { data, isLoading, error, refetch } = useAuditLogs();
 *   const { data: stats } = useAuditStats();
 *   const { mutate: exportLogs } = useExportAuditLogs();
 *   
 *   return (
 *     // Component rendering audit data
 *   );
 * }
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import auditServiceModule, { AuditFilterOptions, AuditSearchQuery } from '../services/auditService';
import type { AuditLog } from '@/types';

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

/**
 * Query key factory for audit logs
 * Ensures consistent cache key structure for precise invalidation
 */
const auditQueryKeys = {
  all: () => ['audit'] as const,
  lists: () => [...auditQueryKeys.all(), 'list'] as const,
  list: (limit?: number, offset?: number) => [...auditQueryKeys.lists(), { limit, offset }] as const,
  byUser: (userId: string) => [...auditQueryKeys.all(), 'byUser', userId] as const,
  byAction: (action: string) => [...auditQueryKeys.all(), 'byAction', action] as const,
  byResource: (resource: string) => [...auditQueryKeys.all(), 'byResource', resource] as const,
  byDateRange: (startDate: string, endDate: string) => [...auditQueryKeys.all(), 'dateRange', { startDate, endDate }] as const,
  search: (query: string) => [...auditQueryKeys.all(), 'search', query] as const,
  detail: (id: string) => [...auditQueryKeys.all(), 'detail', id] as const,
  stats: () => [...auditQueryKeys.all(), 'stats'] as const,
  recent: (count: number) => [...auditQueryKeys.all(), 'recent', count] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch audit logs with pagination
 * @param limit - Max records to fetch (default: 50)
 * @param offset - Pagination offset (default: 0)
 */
export function useAuditLogs(limit = 50, offset = 0) {
  return useQuery({
    queryKey: auditQueryKeys.list(limit, offset),
    queryFn: () => auditServiceModule.getAuditLogs(limit, offset),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to fetch single audit log entry
 * @param logId - Audit log ID to fetch
 */
export function useAuditLogDetail(logId: string) {
  return useQuery({
    queryKey: auditQueryKeys.detail(logId),
    queryFn: () => auditServiceModule.getAuditLog(logId),
    enabled: !!logId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook to search audit logs
 * @param searchQuery - Search parameters
 */
export function useSearchAuditLogs(searchQuery: AuditSearchQuery) {
  return useQuery({
    queryKey: auditQueryKeys.search(searchQuery.query),
    queryFn: () => auditServiceModule.searchAuditLogs(searchQuery),
    enabled: !!searchQuery.query && searchQuery.query.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook to fetch audit logs by date range
 * @param startDate - Start date (ISO format)
 * @param endDate - End date (ISO format)
 * @param limit - Max records (default: 100)
 */
export function useAuditLogsByDateRange(startDate: string, endDate: string, limit = 100) {
  return useQuery({
    queryKey: auditQueryKeys.byDateRange(startDate, endDate),
    queryFn: () => auditServiceModule.getAuditLogsByDateRange(startDate, endDate, limit),
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook to fetch audit logs for specific user
 * @param userId - User ID to filter by
 * @param limit - Max records (default: 50)
 */
export function useAuditLogsByUser(userId: string, limit = 50) {
  return useQuery({
    queryKey: auditQueryKeys.byUser(userId),
    queryFn: () => auditServiceModule.getAuditLogsByUser(userId, limit),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook to fetch audit logs for specific resource
 * @param resource - Resource type (e.g., 'customer')
 * @param limit - Max records (default: 50)
 */
export function useAuditLogsByResource(resource: string, limit = 50) {
  return useQuery({
    queryKey: auditQueryKeys.byResource(resource),
    queryFn: () => auditServiceModule.getAuditLogsByResource(resource, limit),
    enabled: !!resource,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook to fetch audit logs by action type
 * @param action - Action type (CREATE, UPDATE, DELETE, etc.)
 * @param limit - Max records (default: 50)
 */
export function useAuditLogsByAction(action: string, limit = 50) {
  return useQuery({
    queryKey: auditQueryKeys.byAction(action),
    queryFn: () => auditServiceModule.getAuditLogsByAction(action, limit),
    enabled: !!action,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook to fetch audit statistics
 */
export function useAuditStats() {
  return useQuery({
    queryKey: auditQueryKeys.stats(),
    queryFn: () => auditServiceModule.getAuditStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes (stats can be stale longer)
    gcTime: 20 * 60 * 1000, // 20 minutes
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

/**
 * Hook to fetch recent audit logs
 * Useful for dashboard summaries
 * @param count - Number of recent logs to fetch (default: 10)
 */
export function useRecentAuditLogs(count = 10) {
  return useQuery({
    queryKey: auditQueryKeys.recent(count),
    queryFn: () => auditServiceModule.getRecentAuditLogs(count),
    staleTime: 2 * 60 * 1000, // 2 minutes (recent logs are more fresh)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

/**
 * Hook to fetch audit logs with combined filters
 * @param options - Filter options
 */
export function useAuditLogsWithFilters(options: AuditFilterOptions) {
  return useQuery({
    queryKey: ['audit', 'filters', options],
    queryFn: () => auditServiceModule.getAuditLogsWithFilters(options),
    enabled: !!options,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to export audit logs
 * Mutation hook with loading state and error handling
 */
export function useExportAuditLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ format, filters }: { format: 'csv' | 'json'; filters?: AuditFilterOptions }) =>
      auditServiceModule.exportAuditLogs(format, filters),
    onSuccess: () => {
      // Invalidate audit queries after export
      queryClient.invalidateQueries({ queryKey: auditQueryKeys.all() });
    },
    onError: (error) => {
      console.error('[useExportAuditLogs] Export failed:', error);
    },
  });
}

/**
 * Hook to log an action
 * Mutation hook for recording new audit entries
 */
export function useLogAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => auditServiceModule.logAction(data),
    onSuccess: () => {
      // Invalidate all audit queries to refetch
      queryClient.invalidateQueries({ queryKey: auditQueryKeys.all() });
    },
    onError: (error) => {
      console.error('[useLogAction] Failed to log action:', error);
    },
  });
}

// ============================================================================
// COMBINED HOOKS
// ============================================================================

/**
 * Combined hook for audit logs and statistics
 * Useful for dashboard/summary pages
 */
export function useAuditDashboard() {
  const logs = useAuditLogs(10, 0); // Recent 10 logs
  const stats = useAuditStats();
  const recent = useRecentAuditLogs(5); // 5 most recent

  return {
    logs: logs.data || [],
    logsLoading: logs.isLoading,
    logsError: logs.error,
    stats: stats.data,
    statsLoading: stats.isLoading,
    statsError: stats.error,
    recent: recent.data || [],
    recentLoading: recent.isLoading,
    recentError: recent.error,
    refetch: () => {
      logs.refetch();
      stats.refetch();
      recent.refetch();
    },
  };
}

/**
 * Combined hook for filtering audit logs
 * Handles search, date range, and user filters together
 */
export function useAuditLogsFiltered({
  searchQuery,
  startDate,
  endDate,
  userId,
  action,
  resource,
}: {
  searchQuery?: AuditSearchQuery;
  startDate?: string;
  endDate?: string;
  userId?: string;
  action?: string;
  resource?: string;
}) {
  const search = useSearchAuditLogs(searchQuery || { query: '' });
  const dateRange = useAuditLogsByDateRange(startDate || '', endDate || '');
  const byUser = useAuditLogsByUser(userId || '');
  const byAction = useAuditLogsByAction(action || '');
  const byResource = useAuditLogsByResource(resource || '');

  // Determine which query to use based on what filters are provided
  let activeQuery = useAuditLogs();

  if (searchQuery?.query) {
    activeQuery = search;
  } else if (startDate && endDate) {
    activeQuery = dateRange;
  } else if (userId) {
    activeQuery = byUser;
  } else if (action) {
    activeQuery = byAction;
  } else if (resource) {
    activeQuery = byResource;
  }

  return {
    data: activeQuery.data || [],
    isLoading: activeQuery.isLoading,
    error: activeQuery.error,
    refetch: activeQuery.refetch,
  };
}

// ============================================================================
// CACHE MANAGEMENT HOOKS
// ============================================================================

/**
 * Hook to manually invalidate and refetch audit logs
 * Useful when you know data has changed
 */
export function useInvalidateAuditLogs() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: auditQueryKeys.all() }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: auditQueryKeys.lists() }),
    invalidateStats: () => queryClient.invalidateQueries({ queryKey: auditQueryKeys.stats() }),
    refetchAll: () => queryClient.refetchQueries({ queryKey: auditQueryKeys.all() }),
  };
}

export { auditQueryKeys };
export type { AuditLog };
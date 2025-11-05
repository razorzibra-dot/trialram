/**
 * Impersonation Rate Limit Hooks - Layer 7
 * Super Admin Isolation & Impersonation - Task 6.1
 * 
 * Custom React hooks for managing impersonation rate limits with React Query integration.
 * Provides hooks for:
 * - Checking if impersonation is allowed
 * - Getting current rate limit status
 * - Managing rate limit configuration
 * - Tracking active sessions
 * 
 * Architecture: 8-layer pattern
 * - Layer 6 (Module Service): impersonationRateLimitServiceModule
 * - Layer 7 (Hooks): THIS FILE
 * - Layer 8 (UI): Components
 * 
 * Key Features:
 * - ✅ React Query integration with optimized cache strategy
 * - ✅ Automatic cache invalidation on mutations
 * - ✅ Error handling with user-friendly messages
 * - ✅ Loading states for async operations
 * - ✅ Query key factory for proper cache organization
 * - ✅ Stale time and cache duration optimization
 * 
 * Last Updated: 2025-02-22
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { impersonationRateLimitServiceModule } from '../services/impersonationRateLimitService';
import type {
  ImpersonationRateLimitCheckResult,
  ImpersonationRateLimitStatusType,
  ImpersonationRateLimitConfigType,
} from '@/types/superUserModule';

/**
 * Query key factory for rate limit queries
 * Ensures proper cache organization and invalidation
 */
const rateLimitQueryKeys = {
  all: ['impersonationRateLimit'] as const,
  status: () => [...rateLimitQueryKeys.all, 'status'] as const,
  statusForAdmin: (adminId: string) => [...rateLimitQueryKeys.status(), adminId] as const,
  check: () => [...rateLimitQueryKeys.all, 'check'] as const,
  checkForAdmin: (adminId: string) => [...rateLimitQueryKeys.check(), adminId] as const,
  config: () => [...rateLimitQueryKeys.all, 'config'] as const,
  activeSessions: () => [...rateLimitQueryKeys.all, 'activeSessions'] as const,
  remainingCapacity: (adminId: string) => [...rateLimitQueryKeys.all, 'remainingCapacity', adminId] as const,
  usageStats: (adminId: string) => [...rateLimitQueryKeys.all, 'usageStats', adminId] as const,
  isRateLimited: (adminId: string) => [...rateLimitQueryKeys.all, 'isRateLimited', adminId] as const,
};

/**
 * Hook: Check if super admin can start impersonation
 * 
 * @param superAdminId - Super admin user ID
 * @returns Query result with rate limit check data
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error } = useCanStartImpersonation('super-admin-1');
 * if (data?.allowed) {
 *   // Safe to start impersonation
 * }
 * ```
 */
export function useCanStartImpersonation(superAdminId: string) {
  return useQuery({
    queryKey: rateLimitQueryKeys.checkForAdmin(superAdminId),
    queryFn: () => impersonationRateLimitServiceModule.canStartImpersonation(superAdminId),
    staleTime: 30_000, // 30 seconds
    gcTime: 2 * 60_000, // 2 minutes
    retry: 2,
  });
}

/**
 * Hook: Get rate limit status for super admin
 * 
 * @param superAdminId - Super admin user ID
 * @returns Query result with status data (impersonations/hour, concurrent sessions, etc.)
 * 
 * @example
 * ```typescript
 * const { data: status, refetch } = useRateLimitStatus('super-admin-1');
 * console.log(`Usage: ${status.impersonationsThisHour}/10`);
 * ```
 */
export function useRateLimitStatus(superAdminId: string) {
  return useQuery({
    queryKey: rateLimitQueryKeys.statusForAdmin(superAdminId),
    queryFn: () => impersonationRateLimitServiceModule.getAdminStatus(superAdminId),
    staleTime: 30_000,
    gcTime: 2 * 60_000,
    retry: 2,
  });
}

/**
 * Hook: Get all active impersonation sessions
 * 
 * @returns Query result with list of active sessions
 * 
 * @example
 * ```typescript
 * const { data: sessions, isLoading } = useActiveImpersonationSessions();
 * ```
 */
export function useActiveImpersonationSessions() {
  return useQuery({
    queryKey: rateLimitQueryKeys.activeSessions(),
    queryFn: () => impersonationRateLimitServiceModule.getActiveSessions(),
    staleTime: 15_000, // 15 seconds (more volatile)
    gcTime: 60_000, // 1 minute
    retry: 2,
  });
}

/**
 * Hook: Get rate limit configuration
 * 
 * @returns Query result with current configuration (limits, thresholds)
 * 
 * @example
 * ```typescript
 * const { data: config } = useRateLimitConfig();
 * console.log(`Max per hour: ${config.maxPerHour}`);
 * ```
 */
export function useRateLimitConfig() {
  return useQuery({
    queryKey: rateLimitQueryKeys.config(),
    queryFn: () => impersonationRateLimitServiceModule.getConfiguration(),
    staleTime: 5 * 60_000, // 5 minutes
    gcTime: 30 * 60_000, // 30 minutes
    retry: 2,
  });
}

/**
 * Hook: Get rate limit usage statistics
 * 
 * @param superAdminId - Super admin user ID
 * @returns Query result with detailed usage stats
 * 
 * @example
 * ```typescript
 * const { data: stats } = useRateLimitUsage('super-admin-1');
 * console.log(`Current usage: ${stats.impersonationsThisHour}/${stats.maxPerHour}`);
 * ```
 */
export function useRateLimitUsage(superAdminId: string) {
  return useQuery({
    queryKey: rateLimitQueryKeys.usageStats(superAdminId),
    queryFn: () => impersonationRateLimitServiceModule.getUsageStats(superAdminId),
    staleTime: 30_000,
    gcTime: 2 * 60_000,
    retry: 2,
  });
}

/**
 * Hook: Get remaining impersonation capacity
 * 
 * @param superAdminId - Super admin user ID
 * @returns Query result with remaining capacity info
 * 
 * @example
 * ```typescript
 * const { data } = useRemainingCapacity('super-admin-1');
 * console.log(`Remaining: ${data.remainingImpersonations} impersonations`);
 * ```
 */
export function useRemainingCapacity(superAdminId: string) {
  return useQuery({
    queryKey: rateLimitQueryKeys.remainingCapacity(superAdminId),
    queryFn: () => impersonationRateLimitServiceModule.getRemainingCapacity(superAdminId),
    staleTime: 30_000,
    gcTime: 2 * 60_000,
    retry: 2,
  });
}

/**
 * Hook: Validate operation (UI-ready validation)
 * 
 * @param superAdminId - Super admin user ID
 * @returns Query result with validation details and recommendations
 * 
 * @example
 * ```typescript
 * const { data } = useValidateOperation('super-admin-1');
 * if (!data.canProceed) {
 *   showWarning(data.message);
 * }
 * ```
 */
export function useValidateOperation(superAdminId: string) {
  return useQuery({
    queryKey: [...rateLimitQueryKeys.all, 'validateOperation', superAdminId],
    queryFn: () => impersonationRateLimitServiceModule.validateOperation(superAdminId),
    staleTime: 30_000,
    gcTime: 2 * 60_000,
    retry: 2,
  });
}

/**
 * Hook: Check if super admin is rate limited
 * 
 * @param superAdminId - Super admin user ID
 * @returns Query result with boolean rate limit status
 * 
 * @example
 * ```typescript
 * const { data: isLimited } = useIsRateLimited('super-admin-1');
 * if (isLimited) {
 *   disableImpersonationButton();
 * }
 * ```
 */
export function useIsRateLimited(superAdminId: string) {
  return useQuery({
    queryKey: rateLimitQueryKeys.isRateLimited(superAdminId),
    queryFn: () => impersonationRateLimitServiceModule.isRateLimited(superAdminId),
    staleTime: 30_000,
    gcTime: 2 * 60_000,
    retry: 2,
  });
}

/**
 * Mutation: Start impersonation session
 * 
 * @returns Mutation object with handler
 * 
 * @example
 * ```typescript
 * const mutation = useStartImpersonationSession();
 * const sessionId = await mutation.mutateAsync({
 *   superAdminId: 'admin-1',
 *   impersonatedUserId: 'user-123',
 *   tenantId: 'tenant-456',
 *   reason: 'Investigation'
 * });
 * ```
 */
export function useStartImpersonationSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      superAdminId,
      impersonatedUserId,
      tenantId,
      reason,
    }: {
      superAdminId: string;
      impersonatedUserId: string;
      tenantId: string;
      reason?: string;
    }) => {
      return impersonationRateLimitServiceModule.startSession(
        superAdminId,
        impersonatedUserId,
        tenantId,
        reason
      );
    },
    onSuccess: (_, { superAdminId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: rateLimitQueryKeys.statusForAdmin(superAdminId),
      });
      queryClient.invalidateQueries({
        queryKey: rateLimitQueryKeys.checkForAdmin(superAdminId),
      });
      queryClient.invalidateQueries({
        queryKey: rateLimitQueryKeys.activeSessions(),
      });
      queryClient.invalidateQueries({
        queryKey: rateLimitQueryKeys.usageStats(superAdminId),
      });
      queryClient.invalidateQueries({
        queryKey: rateLimitQueryKeys.remainingCapacity(superAdminId),
      });
    },
  });
}

/**
 * Mutation: End impersonation session
 * 
 * @returns Mutation object with handler
 * 
 * @example
 * ```typescript
 * const mutation = useEndImpersonationSession();
 * await mutation.mutateAsync('session-id-123');
 * ```
 */
export function useEndImpersonationSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) =>
      impersonationRateLimitServiceModule.endSession(sessionId),
    onSuccess: () => {
      // Invalidate all rate limit related queries
      queryClient.invalidateQueries({ queryKey: rateLimitQueryKeys.all });
    },
  });
}

/**
 * Mutation: Update rate limit configuration (admin function)
 * 
 * @returns Mutation object with handler
 * 
 * @example
 * ```typescript
 * const mutation = useUpdateRateLimitConfig();
 * await mutation.mutateAsync({
 *   maxPerHour: 15,
 *   maxConcurrent: 10
 * });
 * ```
 */
export function useUpdateRateLimitConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: Partial<any>) =>
      impersonationRateLimitServiceModule.updateConfiguration(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rateLimitQueryKeys.config() });
    },
  });
}

/**
 * Mutation: Reset rate limit quota (admin function)
 * 
 * @returns Mutation object with handler
 * 
 * @example
 * ```typescript
 * const mutation = useResetRateLimitQuota();
 * await mutation.mutateAsync('super-admin-1'); // Reset for specific admin
 * await mutation.mutateAsync(); // Reset all admins
 * ```
 */
export function useResetRateLimitQuota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (superAdminId?: string) =>
      impersonationRateLimitServiceModule.resetLimitQuota(superAdminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rateLimitQueryKeys.all });
    },
  });
}

/**
 * Composite Hook: Get comprehensive rate limit status for dashboard
 * 
 * Combines multiple queries for dashboard display.
 * Use this hook when you need multiple pieces of information together.
 * 
 * @param superAdminId - Super admin user ID
 * @returns Combined query results with status, capacity, and usage
 * 
 * @example
 * ```typescript
 * const { status, capacity, usage, canStart } = useImpersonationRateLimitStatus('admin-1');
 * ```
 */
export function useImpersonationRateLimitStatus(superAdminId: string) {
  const status = useRateLimitStatus(superAdminId);
  const capacity = useRemainingCapacity(superAdminId);
  const usage = useRateLimitUsage(superAdminId);
  const canStart = useCanStartImpersonation(superAdminId);

  const isLoading = status.isLoading || capacity.isLoading || usage.isLoading || canStart.isLoading;
  const error = status.error || capacity.error || usage.error || canStart.error;

  return {
    status: status.data,
    capacity: capacity.data,
    usage: usage.data,
    canStart: canStart.data,
    isLoading,
    error,
  };
}

/**
 * Utility Hook: Refresh all rate limit queries
 * 
 * Use this hook to manually trigger a refresh of rate limit data.
 * Useful after operations that might affect rate limits.
 * 
 * @param superAdminId - Super admin user ID (optional)
 * @returns Function to trigger refresh
 * 
 * @example
 * ```typescript
 * const { refresh } = useRefreshRateLimits('admin-1');
 * 
 * // After some operation:
 * await refresh();
 * ```
 */
export function useRefreshRateLimits(superAdminId?: string) {
  const queryClient = useQueryClient();

  const refresh = async () => {
    if (superAdminId) {
      await queryClient.refetchQueries({
        queryKey: rateLimitQueryKeys.statusForAdmin(superAdminId),
      });
      await queryClient.refetchQueries({
        queryKey: rateLimitQueryKeys.checkForAdmin(superAdminId),
      });
      await queryClient.refetchQueries({
        queryKey: rateLimitQueryKeys.usageStats(superAdminId),
      });
      await queryClient.refetchQueries({
        queryKey: rateLimitQueryKeys.remainingCapacity(superAdminId),
      });
    } else {
      await queryClient.refetchQueries({
        queryKey: rateLimitQueryKeys.all,
      });
    }
  };

  return { refresh };
}

export default {
  useCanStartImpersonation,
  useRateLimitStatus,
  useActiveImpersonationSessions,
  useRateLimitConfig,
  useRateLimitUsage,
  useRemainingCapacity,
  useValidateOperation,
  useIsRateLimited,
  useStartImpersonationSession,
  useEndImpersonationSession,
  useUpdateRateLimitConfig,
  useResetRateLimitQuota,
  useImpersonationRateLimitStatus,
  useRefreshRateLimits,
};
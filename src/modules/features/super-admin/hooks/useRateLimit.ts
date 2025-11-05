/**
 * Rate Limit Hooks - Layer 7: React Query Integration
 * ✅ Phase 6.1: Implement Rate Limiting for Impersonation
 *
 * Comprehensive React Query hooks with hierarchical caching, automatic
 * invalidation, and proper state management for rate limiting operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rateLimitService } from '../services/rateLimitService';
import type {
  RateLimitCheckResult,
  RateLimitViolation,
  RateLimitStats,
  ActiveSession,
} from '@/types';

// ============================================================================
// CACHE KEY FACTORY
// ============================================================================

/**
 * Hierarchical cache key factory for rate limit operations
 * Ensures proper cache invalidation and prevents stale data
 */
export const rateLimitQueryKeys = {
  root: () => ['rateLimit'] as const,
  checkLimit: (superAdminId: string, tenantId: string, targetUserId: string) =>
    [...rateLimitQueryKeys.root(), 'checkLimit', superAdminId, tenantId, targetUserId] as const,
  stats: (superAdminId: string, tenantId: string) =>
    [...rateLimitQueryKeys.root(), 'stats', superAdminId, tenantId] as const,
  activeSessions: (superAdminId: string, tenantId: string) =>
    [...rateLimitQueryKeys.root(), 'activeSessions', superAdminId, tenantId] as const,
  violations: (superAdminId: string, tenantId: string, limitDays?: number) =>
    [...rateLimitQueryKeys.root(), 'violations', superAdminId, tenantId, limitDays] as const,
  sessionDuration: (sessionId: string, tenantId: string) =>
    [...rateLimitQueryKeys.root(), 'sessionDuration', sessionId, tenantId] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Check if impersonation is allowed for the current user
 * Validates all three rate limit checks (hourly, concurrent, duration)
 *
 * @param superAdminId - Super admin user ID
 * @param tenantId - Current tenant ID
 * @param targetUserId - User to be impersonated
 * @param enabled - Enable/disable the query (default: true)
 * @returns Query with RateLimitCheckResult
 */
export const useCheckRateLimit = (
  superAdminId: string,
  tenantId: string,
  targetUserId: string,
  enabled = true
) => {
  return useQuery({
    queryKey: rateLimitQueryKeys.checkLimit(superAdminId, tenantId, targetUserId),
    queryFn: async () =>
      rateLimitService.checkImpersonationRateLimit(superAdminId, tenantId, targetUserId),
    enabled: enabled && !!superAdminId && !!tenantId && !!targetUserId,
    staleTime: 5 * 1000, // 5 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};

/**
 * Get comprehensive rate limit statistics for a super admin
 * Includes usage percentages and remaining quota
 * Auto-refreshes every 30 seconds to stay current
 *
 * @param superAdminId - Super admin user ID
 * @param tenantId - Current tenant ID
 * @param enabled - Enable/disable polling (default: true)
 * @returns Query with RateLimitStats
 */
export const useRateLimitStats = (
  superAdminId: string,
  tenantId: string,
  enabled = true
) => {
  return useQuery({
    queryKey: rateLimitQueryKeys.stats(superAdminId, tenantId),
    queryFn: async () =>
      rateLimitService.getRateLimitStats(superAdminId, tenantId),
    enabled: enabled && !!superAdminId && !!tenantId,
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    retry: 1,
  });
};

/**
 * Get all active impersonation sessions for a super admin
 * Auto-refreshes every 20 seconds to show current sessions
 *
 * @param superAdminId - Super admin user ID
 * @param tenantId - Current tenant ID
 * @param enabled - Enable/disable polling (default: true)
 * @returns Query with array of ActiveSession
 */
export const useActiveSessions = (
  superAdminId: string,
  tenantId: string,
  enabled = true
) => {
  return useQuery({
    queryKey: rateLimitQueryKeys.activeSessions(superAdminId, tenantId),
    queryFn: async () =>
      rateLimitService.getActiveSessions(superAdminId, tenantId),
    enabled: enabled && !!superAdminId && !!tenantId,
    staleTime: 5 * 1000, // 5 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 20 * 1000, // Poll every 20 seconds
    retry: 1,
  });
};

/**
 * Get rate limit violations for a super admin
 * Shows all times when limits were exceeded
 *
 * @param superAdminId - Super admin user ID
 * @param tenantId - Current tenant ID
 * @param limitDays - Only return violations from last N days (default: 30)
 * @param enabled - Enable/disable the query (default: true)
 * @returns Query with array of RateLimitViolation
 */
export const useGetViolations = (
  superAdminId: string,
  tenantId: string,
  limitDays = 30,
  enabled = true
) => {
  return useQuery({
    queryKey: rateLimitQueryKeys.violations(superAdminId, tenantId, limitDays),
    queryFn: async () =>
      rateLimitService.getViolations(superAdminId, tenantId, limitDays),
    enabled: enabled && !!superAdminId && !!tenantId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};

/**
 * Check if a session has exceeded the 30-minute duration limit
 *
 * @param sessionId - Session ID to check
 * @param tenantId - Current tenant ID
 * @param enabled - Enable/disable the query (default: true)
 * @returns Query with boolean (exceeded or not)
 */
export const useCheckSessionDuration = (
  sessionId: string,
  tenantId: string,
  enabled = true
) => {
  return useQuery({
    queryKey: rateLimitQueryKeys.sessionDuration(sessionId, tenantId),
    queryFn: async () =>
      rateLimitService.checkSessionDurationExceeded(sessionId, tenantId),
    enabled: enabled && !!sessionId && !!tenantId,
    staleTime: 5 * 1000, // 5 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Record the start of an impersonation session
 * Creates active session record and updates rate limit counters
 *
 * @returns Mutation function and state
 */
export const useRecordImpersonationStart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      superAdminId: string;
      tenantId: string;
      targetUserId: string;
      targetUserEmail: string;
    }) =>
      rateLimitService.recordImpersonationStart(
        variables.superAdminId,
        variables.tenantId,
        variables.targetUserId,
        variables.targetUserEmail
      ),
    onSuccess: (_data, variables) => {
      // Invalidate related caches
      queryClient.invalidateQueries({
        queryKey: rateLimitQueryKeys.stats(variables.superAdminId, variables.tenantId),
      });
      queryClient.invalidateQueries({
        queryKey: rateLimitQueryKeys.activeSessions(variables.superAdminId, variables.tenantId),
      });
    },
  });
};

/**
 * Record the end of an impersonation session
 * Removes from active sessions and cleans up counters
 *
 * @returns Mutation function and state
 */
export const useRecordImpersonationEnd = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { sessionId: string; tenantId: string }) =>
      rateLimitService.recordImpersonationEnd(variables.sessionId, variables.tenantId),
    onSuccess: (_data, variables) => {
      // Invalidate active sessions cache
      queryClient.invalidateQueries({
        queryKey: rateLimitQueryKeys.root(),
        type: 'active',
      });
    },
  });
};

/**
 * Force terminate an active impersonation session (admin override)
 * Used by super admins to revoke sessions immediately
 *
 * @returns Mutation function and state
 */
export const useForceTerminateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      sessionId: string;
      tenantId: string;
      reason: string;
    }) =>
      rateLimitService.forceTerminateSession(
        variables.sessionId,
        variables.tenantId,
        variables.reason
      ),
    onSuccess: () => {
      // Invalidate all rate limit caches
      queryClient.invalidateQueries({
        queryKey: rateLimitQueryKeys.root(),
      });
    },
  });
};

/**
 * Clear violations for a super admin (admin reset)
 * Removes violation records to allow operations again
 *
 * @returns Mutation function and state
 */
export const useClearViolations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { superAdminId: string; tenantId: string }) =>
      rateLimitService.clearViolations(variables.superAdminId, variables.tenantId),
    onSuccess: (_data, variables) => {
      // Invalidate violations cache
      queryClient.invalidateQueries({
        queryKey: rateLimitQueryKeys.violations(variables.superAdminId, variables.tenantId),
      });
    },
  });
};

/**
 * Clean up expired sessions and old violation records
 * Should be called periodically or on-demand by admins
 * Takes care of maintenance tasks to prevent data buildup
 *
 * @returns Mutation function and state
 */
export const useCleanupExpiredSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { tenantId: string; daysToKeep?: number }) =>
      rateLimitService.cleanupExpiredSessions(variables.tenantId, variables.daysToKeep),
    onSuccess: () => {
      // Invalidate all caches after cleanup
      queryClient.invalidateQueries({
        queryKey: rateLimitQueryKeys.root(),
      });
    },
  });
};

/**
 * Reset all rate limits for a super admin (admin override)
 * Clears active sessions, counters, and recent violations
 * Used when admin needs complete reset (e.g., after incident review)
 *
 * @returns Mutation function and state
 */
export const useResetRateLimits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      superAdminId: string;
      tenantId: string;
      reason: string;
    }) =>
      rateLimitService.resetRateLimits(
        variables.superAdminId,
        variables.tenantId,
        variables.reason
      ),
    onSuccess: (_data, variables) => {
      // Invalidate all rate limit caches for this admin
      queryClient.invalidateQueries({
        queryKey: rateLimitQueryKeys.stats(variables.superAdminId, variables.tenantId),
      });
      queryClient.invalidateQueries({
        queryKey: rateLimitQueryKeys.activeSessions(variables.superAdminId, variables.tenantId),
      });
      queryClient.invalidateQueries({
        queryKey: rateLimitQueryKeys.violations(variables.superAdminId, variables.tenantId),
      });
    },
  });
};

// ============================================================================
// COMPOSITE HOOKS (CONVENIENCE)
// ============================================================================

/**
 * Complete hook for impersonation workflow
 * Checks rate limits, starts session, and provides mutation for ending
 *
 * @param superAdminId - Super admin user ID
 * @param tenantId - Current tenant ID
 * @param targetUserId - User being impersonated
 * @returns Object with check result, start mutation, and end mutation
 */
export const useImpersonationSession = (
  superAdminId: string,
  tenantId: string,
  targetUserId: string
) => {
  const checkLimit = useCheckRateLimit(superAdminId, tenantId, targetUserId);
  const startSession = useRecordImpersonationStart();
  const endSession = useRecordImpersonationEnd();

  return {
    checkLimit,
    startSession,
    endSession,
    isAllowed: checkLimit.data?.allowed ?? false,
    isLoading: checkLimit.isLoading || startSession.isPending || endSession.isPending,
    error: checkLimit.error || startSession.error || endSession.error,
  };
};

/**
 * Complete hook for rate limit monitoring
 * Provides stats, active sessions, and violations in one place
 *
 * @param superAdminId - Super admin user ID
 * @param tenantId - Current tenant ID
 * @returns Object with stats, sessions, violations, and mutations
 */
export const useRateLimitMonitoring = (
  superAdminId: string,
  tenantId: string
) => {
  const stats = useRateLimitStats(superAdminId, tenantId);
  const sessions = useActiveSessions(superAdminId, tenantId);
  const violations = useGetViolations(superAdminId, tenantId);
  const terminateSession = useForceTerminateSession();
  const clearViolations = useClearViolations();
  const resetLimits = useResetRateLimits();

  return {
    // Queries
    stats,
    sessions,
    violations,
    // Mutations
    terminateSession,
    clearViolations,
    resetLimits,
    // Combined state
    isLoading: stats.isLoading || sessions.isLoading || violations.isLoading,
    isUpdating:
      terminateSession.isPending ||
      clearViolations.isPending ||
      resetLimits.isPending,
    error: stats.error || sessions.error || violations.error,
  };
};
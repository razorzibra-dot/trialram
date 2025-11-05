/**
 * Rate Limit Service - Layer 6: Module Service
 * ✅ Phase 6.1: Implement Rate Limiting for Impersonation
 *
 * Factory-only delegation pattern (ZERO direct service imports)
 * All calls routed through service factory for proper multi-mode support
 */

import { rateLimitService as factoryRateLimitService } from '@/services/serviceFactory';
import type {
  RateLimitCheckResult,
  RateLimitViolation,
  RateLimitStats,
  ActiveSession,
  RateLimitConfig,
} from '@/types';

/**
 * Rate Limit Service - Module facade for impersonation rate limiting
 * 
 * Provides convenience methods for checking and enforcing rate limits
 * on super admin impersonation operations.
 *
 * Layer 6 Service Pattern:
 * - Factory-only delegation (no direct mock/supabase imports)
 * - Type-safe method forwarding using Parameters<typeof>
 * - Comprehensive JSDoc for all methods
 * - Multi-tenant support through factory
 * - Cache invalidation handled by Layer 7 hooks
 */
export const rateLimitService = {
  /**
   * Check if impersonation is allowed based on rate limits
   * Validates against:
   * - Hourly limit (10 per hour)
   * - Concurrent session limit (5 concurrent)
   * - Session duration limit (30 minutes max)
   *
   * @param superAdminId - Super admin user ID
   * @param tenantId - Current tenant ID
   * @param targetUserId - User being impersonated
   * @returns RateLimitCheckResult with allowed status and violation details
   */
  checkImpersonationRateLimit: (
    ...args: Parameters<typeof factoryRateLimitService.checkImpersonationRateLimit>
  ) => factoryRateLimitService.checkImpersonationRateLimit(...args),

  /**
   * Record the start of an impersonation session
   * Creates an active session record and updates counters
   *
   * @param superAdminId - Super admin user ID
   * @param tenantId - Current tenant ID
   * @param targetUserId - User being impersonated
   * @param targetUserEmail - Email of user being impersonated
   * @returns ActiveSession with session ID and start time
   */
  recordImpersonationStart: (
    ...args: Parameters<typeof factoryRateLimitService.recordImpersonationStart>
  ) => factoryRateLimitService.recordImpersonationStart(...args),

  /**
   * Record the end of an impersonation session
   * Removes from active sessions and cleans up counters
   *
   * @param sessionId - Session ID from recordImpersonationStart
   * @param tenantId - Current tenant ID
   * @returns True if session was successfully ended
   */
  recordImpersonationEnd: (
    ...args: Parameters<typeof factoryRateLimitService.recordImpersonationEnd>
  ) => factoryRateLimitService.recordImpersonationEnd(...args),

  /**
   * Check if a session has exceeded the 30-minute duration limit
   *
   * @param sessionId - Session ID to check
   * @param tenantId - Current tenant ID
   * @returns True if session duration exceeded limit
   */
  checkSessionDurationExceeded: (
    ...args: Parameters<typeof factoryRateLimitService.checkSessionDurationExceeded>
  ) => factoryRateLimitService.checkSessionDurationExceeded(...args),

  /**
   * Get comprehensive statistics for a super admin's rate limit usage
   *
   * @param superAdminId - Super admin user ID
   * @param tenantId - Current tenant ID
   * @returns RateLimitStats including usage percentages and remaining quota
   */
  getRateLimitStats: (
    ...args: Parameters<typeof factoryRateLimitService.getRateLimitStats>
  ) => factoryRateLimitService.getRateLimitStats(...args),

  /**
   * Get all active impersonation sessions for a super admin
   *
   * @param superAdminId - Super admin user ID
   * @param tenantId - Current tenant ID
   * @returns Array of active sessions with details
   */
  getActiveSessions: (
    ...args: Parameters<typeof factoryRateLimitService.getActiveSessions>
  ) => factoryRateLimitService.getActiveSessions(...args),

  /**
   * Force terminate an active impersonation session (admin override)
   * Used when admin needs to revoke a session immediately
   *
   * @param sessionId - Session ID to terminate
   * @param tenantId - Current tenant ID
   * @param reason - Reason for termination (for audit)
   * @returns True if session was successfully terminated
   */
  forceTerminateSession: (
    ...args: Parameters<typeof factoryRateLimitService.forceTerminateSession>
  ) => factoryRateLimitService.forceTerminateSession(...args),

  /**
   * Get rate limit violations for a super admin
   * Violations recorded when limits are exceeded
   *
   * @param superAdminId - Super admin user ID
   * @param tenantId - Current tenant ID
   * @param limitDays - Only return violations from last N days (default: 30)
   * @returns Array of RateLimitViolation records
   */
  getViolations: (
    ...args: Parameters<typeof factoryRateLimitService.getViolations>
  ) => factoryRateLimitService.getViolations(...args),

  /**
   * Clear violations for a super admin (admin reset)
   *
   * @param superAdminId - Super admin user ID
   * @param tenantId - Current tenant ID
   * @returns Number of violations cleared
   */
  clearViolations: (
    ...args: Parameters<typeof factoryRateLimitService.clearViolations>
  ) => factoryRateLimitService.clearViolations(...args),

  /**
   * Clean up expired sessions and old violation records
   * Should be called periodically via cron job or admin action
   *
   * @param tenantId - Current tenant ID
   * @param daysToKeep - Keep violations from last N days (default: 90)
   * @returns Object with cleanup statistics
   */
  cleanupExpiredSessions: (
    ...args: Parameters<typeof factoryRateLimitService.cleanupExpiredSessions>
  ) => factoryRateLimitService.cleanupExpiredSessions(...args),

  /**
   * Reset all rate limits for a super admin (admin override)
   * Clears active sessions, counters, and recent violations
   *
   * @param superAdminId - Super admin user ID
   * @param tenantId - Current tenant ID
   * @param reason - Reason for reset (for audit)
   * @returns Confirmation of reset
   */
  resetRateLimits: (
    ...args: Parameters<typeof factoryRateLimitService.resetRateLimits>
  ) => factoryRateLimitService.resetRateLimits(...args),
};

export type { RateLimitCheckResult, RateLimitViolation, RateLimitStats, ActiveSession, RateLimitConfig };
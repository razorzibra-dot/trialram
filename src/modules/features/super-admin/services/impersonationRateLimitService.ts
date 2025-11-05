/**
 * Impersonation Rate Limit Service Module - Layer 6
 * Super Admin Isolation & Impersonation - Task 6.1
 * 
 * Provides convenience methods for managing impersonation rate limits.
 * Delegates to factory-routed service (Layer 5) which chooses between:
 * - Mock service (development)
 * - Supabase service (production)
 * 
 * **CRITICAL**: Never imports directly from mock or Supabase services.
 * Always use factory service: `impersonationRateLimitService as factoryRateLimitService`
 * 
 * Architecture: 8-layer pattern
 * - Layer 1 (DB): super_user_impersonation_logs table + configuration
 * - Layer 2 (Types): ImpersonationRateLimitConfigType, ImpersonationRateLimitStatusType
 * - Layer 3 (Mock): src/services/impersonationRateLimitService.ts
 * - Layer 4 (Supabase): src/services/api/supabase/impersonationRateLimitService.ts
 * - Layer 5 (Factory): src/services/serviceFactory.ts ✅
 * - Layer 6 (Module): THIS FILE ✅
 * - Layer 7 (Hooks): useImpersonationRateLimit, useRateLimitStatus, etc.
 * - Layer 8 (UI): Components for displaying rate limit info
 * 
 * Last Updated: 2025-02-22
 */

import { impersonationRateLimitService as factoryRateLimitService } from '@/services/serviceFactory';
import type {
  ImpersonationRateLimitConfigType,
  ImpersonationRateLimitStatusType,
  ImpersonationRateLimitCheckResult,
  ImpersonationRateLimitConfigCreateInput,
} from '@/types/superUserModule';

/**
 * Impersonation Rate Limit Service Module
 * 
 * Manages rate limiting for super admin impersonation sessions.
 * Enforces three key limits:
 * - Max 10 impersonations per hour per super admin
 * - Max 5 concurrent sessions per super admin
 * - Max 30 minutes per session
 * 
 * All methods use the factory service (never direct imports).
 * @example
 * ```typescript
 * import { impersonationRateLimitServiceModule } from '@/modules/features/super-admin/services';
 * 
 * // Check if super admin can start impersonation
 * const result = await impersonationRateLimitServiceModule.canStartImpersonation('super-admin-1');
 * if (!result.allowed) {
 *   console.error(`Cannot start: ${result.reason}`);
 * }
 * 
 * // Record session
 * const sessionId = await impersonationRateLimitServiceModule.startSession(
 *   'super-admin-1',
 *   'user-123',
 *   'tenant-456',
 *   'Investigating customer issue'
 * );
 * 
 * // End session
 * await impersonationRateLimitServiceModule.endSession(sessionId);
 * 
 * // Get status
 * const status = await impersonationRateLimitServiceModule.getAdminStatus('super-admin-1');
 * console.log(`Usage: ${status.impersonationsThisHour}/10`);
 * ```
 */
class ImpersonationRateLimitServiceModule {
  /**
   * Check if super admin can start impersonation
   * Verifies all rate limits are not exceeded
   * 
   * @param superAdminId - Super admin user ID
   * @returns Check result with allowed status and usage information
   */
  async canStartImpersonation(superAdminId: string): Promise<ImpersonationRateLimitCheckResult> {
    return factoryRateLimitService.checkRateLimit(superAdminId);
  }

  /**
   * Start impersonation session (records in rate limit tracking)
   * 
   * @param superAdminId - Super admin user ID
   * @param impersonatedUserId - User being impersonated
   * @param tenantId - Tenant context
   * @param reason - Optional reason for impersonation
   * @returns Session ID for later reference
   * @throws Error if rate limit exceeded
   */
  async startSession(
    superAdminId: string,
    impersonatedUserId: string,
    tenantId: string,
    reason?: string
  ): Promise<string> {
    return factoryRateLimitService.recordSessionStart(
      superAdminId,
      impersonatedUserId,
      tenantId,
      reason
    );
  }

  /**
   * End impersonation session (completes rate limit tracking)
   * 
   * @param sessionId - Session ID from startSession
   */
  async endSession(sessionId: string): Promise<void> {
    return factoryRateLimitService.recordSessionEnd(sessionId);
  }

  /**
   * Get current rate limit status for super admin
   * 
   * @param superAdminId - Super admin user ID
   * @returns Current usage and limits
   */
  async getAdminStatus(superAdminId: string): Promise<ImpersonationRateLimitStatusType> {
    return factoryRateLimitService.getStatus(superAdminId);
  }

  /**
   * Get all active impersonation sessions
   * 
   * @returns List of active sessions with details
   */
  async getActiveSessions(): Promise<Array<any>> {
    return factoryRateLimitService.getActiveSessions();
  }

  /**
   * Get current rate limit configuration
   * 
   * @returns Current configuration (max impersonations/hour, concurrent limit, etc.)
   */
  async getConfiguration(): Promise<ImpersonationRateLimitConfigType> {
    return factoryRateLimitService.getConfig();
  }

  /**
   * Update rate limit configuration (admin function)
   * Use with caution - affects all super admins
   * 
   * @param config - Partial configuration updates
   * @returns Updated configuration
   */
  async updateConfiguration(
    config: Partial<ImpersonationRateLimitConfigCreateInput>
  ): Promise<ImpersonationRateLimitConfigType> {
    return factoryRateLimitService.updateConfig(config);
  }

  /**
   * Reset rate limits (admin function)
   * Clears historical data to give super admins fresh quota
   * 
   * @param superAdminId - Optional: reset only for specific admin
   */
  async resetLimitQuota(superAdminId?: string): Promise<void> {
    return factoryRateLimitService.resetLimits(superAdminId);
  }

  /**
   * Check if super admin is currently rate limited
   * 
   * @param superAdminId - Super admin user ID
   * @returns true if rate limited, false otherwise
   */
  async isRateLimited(superAdminId: string): Promise<boolean> {
    const status = await factoryRateLimitService.getStatus(superAdminId);
    return status.isRateLimited;
  }

  /**
   * Get remaining impersonation capacity for super admin
   * 
   * @param superAdminId - Super admin user ID
   * @returns Object with remaining slots and impersonations
   */
  async getRemainingCapacity(superAdminId: string): Promise<{
    remainingImpersonations: number;
    remainingConcurrentSlots: number;
    resetAtTime: string;
  }> {
    const check = await factoryRateLimitService.checkRateLimit(superAdminId);
    const status = await factoryRateLimitService.getStatus(superAdminId);
    
    return {
      remainingImpersonations: check.remainingCapacity.impersonations,
      remainingConcurrentSlots: check.remainingCapacity.concurrentSlots,
      resetAtTime: status.resetAt,
    };
  }

  /**
   * Get detailed usage statistics for super admin
   * 
   * @param superAdminId - Super admin user ID
   * @returns Detailed usage information
   */
  async getUsageStats(superAdminId: string): Promise<{
    impersonationsThisHour: number;
    concurrentSessions: number;
    longestSessionMinutes: number;
    maxPerHour: number;
    maxConcurrent: number;
    maxDurationMinutes: number;
    isRateLimited: boolean;
  }> {
    const check = await factoryRateLimitService.checkRateLimit(superAdminId);
    const status = await factoryRateLimitService.getStatus(superAdminId);
    
    return {
      impersonationsThisHour: check.currentUsage.impersonationsThisHour,
      concurrentSessions: check.currentUsage.concurrentSessions,
      longestSessionMinutes: check.currentUsage.longestSessionMinutes,
      maxPerHour: check.limits.maxPerHour,
      maxConcurrent: check.limits.maxConcurrent,
      maxDurationMinutes: check.limits.maxDurationMinutes,
      isRateLimited: !check.allowed,
    };
  }

  /**
   * Validate if super admin can perform operation
   * Returns detailed information for UI decision-making
   * 
   * @param superAdminId - Super admin user ID
   * @returns Validation result with recommendations
   */
  async validateOperation(superAdminId: string): Promise<{
    canProceed: boolean;
    message: string;
    limitType?: 'hourly' | 'concurrent' | 'duration';
    usagePercentage: {
      hourly: number;
      concurrent: number;
    };
  }> {
    const check = await factoryRateLimitService.checkRateLimit(superAdminId);
    
    if (check.allowed) {
      return {
        canProceed: true,
        message: 'Rate limit check passed',
        usagePercentage: {
          hourly: Math.round(
            (check.currentUsage.impersonationsThisHour / check.limits.maxPerHour) * 100
          ),
          concurrent: Math.round(
            (check.currentUsage.concurrentSessions / check.limits.maxConcurrent) * 100
          ),
        },
      };
    }

    const limitType = check.currentUsage.impersonationsThisHour >= check.limits.maxPerHour
      ? 'hourly'
      : check.currentUsage.concurrentSessions >= check.limits.maxConcurrent
      ? 'concurrent'
      : 'duration';

    return {
      canProceed: false,
      message: check.reason || 'Rate limit exceeded',
      limitType,
      usagePercentage: {
        hourly: Math.round(
          (check.currentUsage.impersonationsThisHour / check.limits.maxPerHour) * 100
        ),
        concurrent: Math.round(
          (check.currentUsage.concurrentSessions / check.limits.maxConcurrent) * 100
        ),
      },
    };
  }
}

/**
 * Singleton instance of the module service
 * Exported for use in components and hooks
 */
export const impersonationRateLimitServiceModule = new ImpersonationRateLimitServiceModule();

export default impersonationRateLimitServiceModule;
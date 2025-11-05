/**
 * Impersonation Rate Limiting Service - Mock Implementation
 * Layer 3: Mock Service (Development)
 * 
 * Enforces rate limits on super admin impersonation sessions to prevent abuse.
 * 
 * Rate Limits (Task 6.1):
 * - Max 10 impersonations per hour per super admin
 * - Max 5 concurrent sessions per super admin
 * - Max 30 min per session
 * 
 * Last Updated: 2025-02-22
 */

import {
  ImpersonationRateLimitConfigType,
  ImpersonationRateLimitStatusType,
  ImpersonationRateLimitCheckResult,
  ImpersonationRateLimitConfigCreateInput,
  validateRateLimitConfig,
  validateRateLimitCheckResult,
  ImpersonationSession as ImpersonationSessionType,
  ImpersonationAction,
  ImpersonationRateLimit
} from '@/types/superUserModule';

/**
 * Default rate limit configuration
 * These are the default limits applied to all super admins
 */
const DEFAULT_CONFIG: ImpersonationRateLimitConfigType = {
  id: 'default-rate-limit-config',
  maxImpersonationsPerHour: 10,
  maxConcurrentSessions: 5,
  maxSessionDurationMinutes: 30,
  enabled: true,
  createdAt: new Date('2025-02-22').toISOString(),
  updatedAt: new Date('2025-02-22').toISOString(),
};

/**
 * In-memory storage for super admin impersonation sessions
 * Tracks all active and historical sessions for rate limiting
 */
interface ImpersonationSession {
  id: string;
  superAdminId: string;
  impersonatedUserId: string;
  tenantId: string;
  startedAt: Date;
  endedAt?: Date;
  reason?: string;
}

class ImpersonationRateLimitService {
  private config: ImpersonationRateLimitConfigType = { ...DEFAULT_CONFIG };
  private sessions: Map<string, ImpersonationSession> = new Map();
  private sessionCounter: number = 0;

  /**
   * Initialize with default configuration
   */
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * Get current rate limit configuration
   * 
   * @returns Current rate limit config
   */
  async getConfig(): Promise<ImpersonationRateLimitConfigType> {
    return validateRateLimitConfig(this.config);
  }

  /**
   * Update rate limit configuration
   * 
   * @param input - New configuration values
   * @returns Updated configuration
   */
  async updateConfig(
    input: Partial<ImpersonationRateLimitConfigCreateInput>
  ): Promise<ImpersonationRateLimitConfigType> {
    this.config = {
      ...this.config,
      maxImpersonationsPerHour: input.maxImpersonationsPerHour ?? this.config.maxImpersonationsPerHour,
      maxConcurrentSessions: input.maxConcurrentSessions ?? this.config.maxConcurrentSessions,
      maxSessionDurationMinutes: input.maxSessionDurationMinutes ?? this.config.maxSessionDurationMinutes,
      enabled: input.enabled ?? this.config.enabled,
      updatedAt: new Date().toISOString(),
    };

    return validateRateLimitConfig(this.config);
  }

  /**
   * Check if super admin can start impersonation
   * Verifies all rate limits are not exceeded
   * 
   * @param superAdminId - Super admin user ID
   * @returns Check result with allowed status and reasons
   */
  async checkRateLimit(superAdminId: string): Promise<ImpersonationRateLimitCheckResult> {
    if (!this.config.enabled) {
      return {
        allowed: true,
        currentUsage: {
          impersonationsThisHour: 0,
          concurrentSessions: 0,
          longestSessionMinutes: 0,
        },
        limits: {
          maxPerHour: this.config.maxImpersonationsPerHour,
          maxConcurrent: this.config.maxConcurrentSessions,
          maxDurationMinutes: this.config.maxSessionDurationMinutes,
        },
        remainingCapacity: {
          impersonations: this.config.maxImpersonationsPerHour,
          concurrentSlots: this.config.maxConcurrentSessions,
        },
      };
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get all sessions for this super admin
    const adminSessions = Array.from(this.sessions.values())
      .filter(s => s.superAdminId === superAdminId);

    // Count impersonations in last hour
    const impersonationsThisHour = adminSessions.filter(
      s => s.startedAt >= oneHourAgo && (!s.endedAt || s.endedAt >= oneHourAgo)
    ).length;

    // Count concurrent sessions (active sessions)
    const concurrentSessions = adminSessions.filter(s => !s.endedAt).length;

    // Find longest session duration
    const longestSession = adminSessions
      .filter(s => s.endedAt)
      .map(s => (s.endedAt!.getTime() - s.startedAt.getTime()) / 1000 / 60) // Convert to minutes
      .sort((a, b) => b - a)[0] || 0;

    // Check rate limits
    const exceedsHourlyLimit = impersonationsThisHour >= this.config.maxImpersonationsPerHour;
    const exceedsConcurrentLimit = concurrentSessions >= this.config.maxConcurrentSessions;

    const allowed = !exceedsHourlyLimit && !exceedsConcurrentLimit;

    const result: ImpersonationRateLimitCheckResult = {
      allowed,
      reason: !allowed
        ? exceedsHourlyLimit
          ? `Rate limit exceeded: ${impersonationsThisHour}/${this.config.maxImpersonationsPerHour} impersonations in last hour`
          : `Concurrent session limit exceeded: ${concurrentSessions}/${this.config.maxConcurrentSessions} active sessions`
        : undefined,
      currentUsage: {
        impersonationsThisHour,
        concurrentSessions,
        longestSessionMinutes: Math.ceil(longestSession),
      },
      limits: {
        maxPerHour: this.config.maxImpersonationsPerHour,
        maxConcurrent: this.config.maxConcurrentSessions,
        maxDurationMinutes: this.config.maxSessionDurationMinutes,
      },
      remainingCapacity: {
        impersonations: Math.max(0, this.config.maxImpersonationsPerHour - impersonationsThisHour),
        concurrentSlots: Math.max(0, this.config.maxConcurrentSessions - concurrentSessions),
      },
    };

    return validateRateLimitCheckResult(result);
  }

  /**
   * Record start of impersonation session
   * Called when super admin starts impersonating a user
   * 
   * @param superAdminId - Super admin user ID
   * @param impersonatedUserId - User being impersonated
   * @param tenantId - Tenant context
   * @param reason - Optional reason
   * @returns Session ID for tracking
   */
  async recordSessionStart(
    superAdminId: string,
    impersonatedUserId: string,
    tenantId: string,
    reason?: string
  ): Promise<string> {
    // Check rate limit first
    const check = await this.checkRateLimit(superAdminId);
    if (!check.allowed) {
      throw new Error(`Rate limit violation: ${check.reason}`);
    }

    const sessionId = `session-${++this.sessionCounter}`;
    const session: ImpersonationSession = {
      id: sessionId,
      superAdminId,
      impersonatedUserId,
      tenantId,
      startedAt: new Date(),
      reason,
    };

    this.sessions.set(sessionId, session);

    console.log('[ImpersonationRateLimitService] Session started:', {
      sessionId,
      superAdminId,
      impersonatedUserId,
      tenantId,
    });

    return sessionId;
  }

  /**
   * Record end of impersonation session
   * Called when super admin ends impersonation
   * 
   * @param sessionId - Session ID from recordSessionStart
   */
  async recordSessionEnd(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const durationMinutes = (new Date().getTime() - session.startedAt.getTime()) / 1000 / 60;

    // Check if session exceeded max duration
    if (durationMinutes > this.config.maxSessionDurationMinutes) {
      console.warn('[ImpersonationRateLimitService] Session exceeded max duration:', {
        sessionId,
        durationMinutes,
        maxDuration: this.config.maxSessionDurationMinutes,
      });
    }

    session.endedAt = new Date();

    console.log('[ImpersonationRateLimitService] Session ended:', {
      sessionId,
      durationMinutes: Math.round(durationMinutes),
    });
  }

  /**
   * Get status for a super admin
   * Returns current rate limit usage and statistics
   * 
   * @param superAdminId - Super admin user ID
   * @returns Rate limit status
   */
  async getStatus(superAdminId: string): Promise<ImpersonationRateLimitStatusType> {
    const check = await this.checkRateLimit(superAdminId);

    const now = new Date();
    const resetTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    return {
      superAdminId,
      impersonationsThisHour: check.currentUsage.impersonationsThisHour,
      concurrentSessionCount: check.currentUsage.concurrentSessions,
      longestSessionDurationSeconds: check.currentUsage.longestSessionMinutes * 60,
      configId: this.config.id,
      isRateLimited: !check.allowed,
      rateLimitReason: check.reason,
      resetAt: resetTime.toISOString(),
      checkedAt: now.toISOString(),
    };
  }

  /**
   * Get all active sessions
   * Returns list of currently active impersonation sessions
   * 
   * @returns Active sessions
   */
  async getActiveSessions(): Promise<Array<any>> {
    return Array.from(this.sessions.values())
      .filter(s => !s.endedAt)
      .map(s => ({
        sessionId: s.id,
        superAdminId: s.superAdminId,
        impersonatedUserId: s.impersonatedUserId,
        tenantId: s.tenantId,
        startedAt: s.startedAt.toISOString(),
        durationSeconds: Math.round((new Date().getTime() - s.startedAt.getTime()) / 1000),
        reason: s.reason,
      }));
  }

  /**
   * Reset rate limits (admin function)
   * Clears all historical data - use with caution!
   * 
   * @param superAdminId - Optional: clear only for specific admin
   */
  async resetLimits(superAdminId?: string): Promise<void> {
    if (superAdminId) {
      // Remove only sessions for specific admin
      const keysToDelete: string[] = [];
      this.sessions.forEach((session, key) => {
        if (session.superAdminId === superAdminId && session.endedAt) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.sessions.delete(key));
    } else {
      // Clear all completed sessions
      const keysToDelete: string[] = [];
      this.sessions.forEach((session, key) => {
        if (session.endedAt) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.sessions.delete(key));
    }

    console.log('[ImpersonationRateLimitService] Rate limits reset:', { superAdminId });
  }
}

/**
 * Singleton instance of the rate limit service
 */
export const mockImpersonationRateLimitService = new ImpersonationRateLimitService();

export default mockImpersonationRateLimitService;
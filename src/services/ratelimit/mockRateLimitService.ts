/**
 * Rate Limiting Service - Mock Implementation
 * 
 * Manages rate limiting for impersonation operations with configurable thresholds
 * and multi-tenant support.
 * 
 * Layer 3: Mock Service Implementation
 * 
 * Rate Limits:
 * - Max 10 impersonations per hour per super admin
 * - Max 5 concurrent sessions per super admin
 * - Max 30 minutes per session
 * 
 * @module services/rateLimitService
 */

import {
  RateLimitConfig,
  RateLimitViolation,
  RateLimitStats,
  ActiveSession
} from '@/types';

// In-memory store for mock implementation
const activeSessions = new Map<string, ActiveSession>();
const rateLimitCounts = new Map<string, { timestamp: Date; count: number }[]>();
const violations = new Map<string, RateLimitViolation[]>();

// Default configuration
const defaultConfig: RateLimitConfig = {
  maxImpersonationsPerHour: 10,
  maxConcurrentSessions: 5,
  maxSessionDurationMinutes: 30,
  windowSizeMinutes: 60
};

/**
 * Check if user can start impersonation session
 * Validates against all rate limit rules
 * 
 * @param userId - Super admin user ID
 * @param tenantId - Tenant ID for multi-tenant support
 * @param config - Rate limit configuration (uses defaults if not provided)
 * @returns Rate limit check result
 */
export async function checkImpersonationRateLimit(
  userId: string,
  tenantId: string,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitCheckResult> {
  const finalConfig = { ...defaultConfig, ...config };

  try {
    // Check 1: Concurrent sessions limit
    const concurrentCount = Array.from(activeSessions.values()).filter(
      s => s.userId === userId && s.tenantId === tenantId
    ).length;

    if (concurrentCount >= finalConfig.maxConcurrentSessions) {
      recordViolation(userId, 'concurrent', 'error', tenantId);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(),
        reason: `Cannot start impersonation: already have ${concurrentCount}/${finalConfig.maxConcurrentSessions} concurrent sessions`,
        limitType: 'concurrent'
      };
    }

    // Check 2: Hourly limit
    const now = new Date();
    const hourAgo = new Date(now.getTime() - finalConfig.windowSizeMinutes * 60 * 1000);
    
    const userKey = `${tenantId}:${userId}`;
    const timestamps = rateLimitCounts.get(userKey) || [];
    const recentCounts = timestamps.filter(t => t.timestamp > hourAgo);

    const hourlyCount = recentCounts.reduce((sum, t) => sum + t.count, 0);

    if (hourlyCount >= finalConfig.maxImpersonationsPerHour) {
      recordViolation(userId, 'hourly', 'error', tenantId);
      const nextReset = new Date(Math.max(...recentCounts.map(t => t.timestamp.getTime())) + finalConfig.windowSizeMinutes * 60 * 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt: nextReset,
        reason: `Cannot start impersonation: reached ${hourlyCount}/${finalConfig.maxImpersonationsPerHour} impersonations per hour limit`,
        limitType: 'hourly'
      };
    }

    const remaining = finalConfig.maxImpersonationsPerHour - hourlyCount - 1;
    const resetAt = new Date(hourAgo.getTime() + finalConfig.windowSizeMinutes * 60 * 1000);

    return {
      allowed: true,
      remaining: Math.max(0, remaining),
      resetAt
    };
  } catch (error) {
    console.error('[RateLimit] Error checking impersonation rate limit:', error);
    throw error;
  }
}

/**
 * Record an impersonation session start
 * Updates rate limit counters
 * 
 * @param userId - Super admin user ID
 * @param impersonatingUserId - User being impersonated
 * @param tenantId - Tenant ID
 * @param durationMinutes - Session duration in minutes
 * @returns Active session record
 */
export async function recordImpersonationStart(
  userId: string,
  impersonatingUserId: string,
  tenantId: string,
  durationMinutes: number = 30
): Promise<ActiveSession> {
  try {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const session: ActiveSession = {
      id: sessionId,
      userId,
      startedAt: now,
      expiresAt,
      impersonatingUser: impersonatingUserId,
      tenantId
    };

    activeSessions.set(sessionId, session);

    // Update rate limit counters
    const userKey = `${tenantId}:${userId}`;
    const counts = rateLimitCounts.get(userKey) || [];
    counts.push({ timestamp: now, count: 1 });
    rateLimitCounts.set(userKey, counts);

    console.log(`[RateLimit] Impersonation session started: ${sessionId}`);
    return session;
  } catch (error) {
    console.error('[RateLimit] Error recording impersonation start:', error);
    throw error;
  }
}

/**
 * Record an impersonation session end
 * Cleans up session record
 * 
 * @param sessionId - Session ID to end
 * @param tenantId - Tenant ID
 * @returns Session duration in minutes
 */
export async function recordImpersonationEnd(
  sessionId: string,
  tenantId: string
): Promise<number> {
  try {
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.tenantId !== tenantId) {
      throw new Error(`Tenant mismatch for session: ${sessionId}`);
    }

    const duration = (session.expiresAt.getTime() - session.startedAt.getTime()) / (1000 * 60);
    activeSessions.delete(sessionId);

    console.log(`[RateLimit] Impersonation session ended: ${sessionId}, duration: ${duration}min`);
    return duration;
  } catch (error) {
    console.error('[RateLimit] Error recording impersonation end:', error);
    throw error;
  }
}

/**
 * Check if session has exceeded max duration
 * 
 * @param sessionId - Session ID to check
 * @returns true if session duration exceeded
 */
export async function checkSessionDurationExceeded(
  sessionId: string,
  maxDurationMinutes: number = 30
): Promise<boolean> {
  try {
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      return false;
    }

    const elapsedMinutes = (new Date().getTime() - session.startedAt.getTime()) / (1000 * 60);
    return elapsedMinutes > maxDurationMinutes;
  } catch (error) {
    console.error('[RateLimit] Error checking session duration:', error);
    throw error;
  }
}

/**
 * Get rate limit statistics for user
 * 
 * @param userId - User ID
 * @param tenantId - Tenant ID
 * @param config - Rate limit configuration
 * @returns Rate limit statistics
 */
export async function getRateLimitStats(
  userId: string,
  tenantId: string,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitStats> {
  try {
    const finalConfig = { ...defaultConfig, ...config };
    const now = new Date();
    const hourAgo = new Date(now.getTime() - finalConfig.windowSizeMinutes * 60 * 1000);

    // Get hourly count
    const userKey = `${tenantId}:${userId}`;
    const timestamps = rateLimitCounts.get(userKey) || [];
    const recentCounts = timestamps.filter(t => t.timestamp > hourAgo);
    const hourlyCount = recentCounts.reduce((sum, t) => sum + t.count, 0);

    // Get concurrent sessions
    const userSessions = Array.from(activeSessions.values()).filter(
      s => s.userId === userId && s.tenantId === tenantId
    );
    const concurrentSessions = userSessions.length;

    // Get oldest session age
    const oldestSessionAge = userSessions.length > 0
      ? (now.getTime() - Math.min(...userSessions.map(s => s.startedAt.getTime()))) / (1000 * 60)
      : 0;

    // Get next reset time
    const nextResetAt = recentCounts.length > 0
      ? new Date(Math.max(...recentCounts.map(t => t.timestamp.getTime())) + finalConfig.windowSizeMinutes * 60 * 1000)
      : new Date(now.getTime() + finalConfig.windowSizeMinutes * 60 * 1000);

    // Get violation count
    const userViolations = violations.get(`${tenantId}:${userId}`) || [];

    return {
      userId,
      hourlyCount,
      concurrentSessions,
      oldestSessionAge,
      nextResetAt,
      violations: userViolations.length,
      tenantId
    };
  } catch (error) {
    console.error('[RateLimit] Error getting statistics:', error);
    throw error;
  }
}

/**
 * Get all active sessions for user
 * 
 * @param userId - User ID
 * @param tenantId - Tenant ID
 * @returns Array of active sessions
 */
export async function getActiveSessions(
  userId: string,
  tenantId: string
): Promise<ActiveSession[]> {
  try {
    return Array.from(activeSessions.values()).filter(
      s => s.userId === userId && s.tenantId === tenantId
    );
  } catch (error) {
    console.error('[RateLimit] Error getting active sessions:', error);
    throw error;
  }
}

/**
 * Force terminate a session
 * Used for admin override or security enforcement
 * 
 * @param sessionId - Session ID to terminate
 * @param tenantId - Tenant ID
 * @returns true if session was terminated
 */
export async function forceTerminateSession(
  sessionId: string,
  tenantId: string
): Promise<boolean> {
  try {
    const session = activeSessions.get(sessionId);
    
    if (!session || session.tenantId !== tenantId) {
      return false;
    }

    activeSessions.delete(sessionId);
    console.log(`[RateLimit] Session force terminated: ${sessionId}`);
    return true;
  } catch (error) {
    console.error('[RateLimit] Error force terminating session:', error);
    throw error;
  }
}

/**
 * Get violations for user
 * 
 * @param userId - User ID
 * @param tenantId - Tenant ID
 * @returns Array of rate limit violations
 */
export async function getViolations(
  userId: string,
  tenantId: string
): Promise<RateLimitViolation[]> {
  try {
    return violations.get(`${tenantId}:${userId}`) || [];
  } catch (error) {
    console.error('[RateLimit] Error getting violations:', error);
    throw error;
  }
}

/**
 * Clear violations for user
 * 
 * @param userId - User ID
 * @param tenantId - Tenant ID
 * @returns true if cleared
 */
export async function clearViolations(
  userId: string,
  tenantId: string
): Promise<boolean> {
  try {
    violations.delete(`${tenantId}:${userId}`);
    console.log(`[RateLimit] Violations cleared for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('[RateLimit] Error clearing violations:', error);
    throw error;
  }
}

/**
 * Clean up expired sessions
 * Runs periodically to remove expired session records
 * 
 * @returns Number of sessions cleaned up
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const now = new Date();
    let cleaned = 0;

    for (const [sessionId, session] of activeSessions.entries()) {
      if (session.expiresAt < now) {
        activeSessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[RateLimit] Cleaned up ${cleaned} expired sessions`);
    }

    return cleaned;
  } catch (error) {
    console.error('[RateLimit] Error cleaning up expired sessions:', error);
    throw error;
  }
}

/**
 * Reset rate limits for user
 * Admin operation to clear rate limit state
 * 
 * @param userId - User ID
 * @param tenantId - Tenant ID
 * @returns true if reset
 */
export async function resetRateLimits(
  userId: string,
  tenantId: string
): Promise<boolean> {
  try {
    const userKey = `${tenantId}:${userId}`;
    rateLimitCounts.delete(userKey);
    violations.delete(userKey);

    // Also end all active sessions for this user
    for (const [sessionId, session] of activeSessions.entries()) {
      if (session.userId === userId && session.tenantId === tenantId) {
        activeSessions.delete(sessionId);
      }
    }

    console.log(`[RateLimit] Rate limits reset for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('[RateLimit] Error resetting rate limits:', error);
    throw error;
  }
}

/**
 * Record a rate limit violation
 * 
 * @param userId - User ID
 * @param limitType - Type of limit violated
 * @param severity - Violation severity
 * @param tenantId - Tenant ID
 */
function recordViolation(
  userId: string,
  limitType: 'hourly' | 'concurrent' | 'duration',
  severity: 'warning' | 'error',
  tenantId: string
): void {
  const violation: RateLimitViolation = {
    id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    limitType,
    severity,
    violatedAt: new Date(),
    tenantId
  };

  const userKey = `${tenantId}:${userId}`;
  const userViolations = violations.get(userKey) || [];
  userViolations.push(violation);
  violations.set(userKey, userViolations);

  console.log(`[RateLimit] Violation recorded: ${violation.id}`);
}

// Export mock service object
export const mockRateLimitService = {
  checkImpersonationRateLimit,
  recordImpersonationStart,
  recordImpersonationEnd,
  checkSessionDurationExceeded,
  getRateLimitStats,
  getActiveSessions,
  forceTerminateSession,
  getViolations,
  clearViolations,
  cleanupExpiredSessions,
  resetRateLimits
};

export default mockRateLimitService;
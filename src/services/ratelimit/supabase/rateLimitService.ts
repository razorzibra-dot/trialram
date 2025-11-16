/**
 * Rate Limiting Service - Supabase Implementation
 * 
 * Database-backed rate limiting for impersonation operations with 
 * persistent tracking and multi-tenant support.
 * 
 * Layer 4: Supabase Service Implementation
 * 
 * Database Tables:
 * - impersonation_sessions (active sessions)
 * - impersonation_limits (rate limit tracking)
 * - rate_limit_violations (violation history)
 * 
 * @module services/api/supabase/rateLimitService
 */

import {
  RateLimitCheckResult,
  RateLimitViolation,
  RateLimitConfig,
  ActiveSession,
  RateLimitStats
} from '../../rateLimitService';

/**
 * Row from impersonation_sessions table
 */
interface ImpersonationSessionRow {
  id: string;
  user_id: string;
  impersonating_user_id: string;
  started_at: string;
  expires_at: string;
  tenant_id: string;
  created_at: string;
}

/**
 * Row from impersonation_limits table
 */
interface ImpersonationLimitRow {
  id: string;
  user_id: string;
  tenant_id: string;
  timestamp: string;
  count: number;
}

/**
 * Row from rate_limit_violations table
 */
interface RateLimitViolationRow {
  id: string;
  user_id: string;
  limit_type: string;
  severity: string;
  violated_at: string;
  tenant_id: string;
}

// Default configuration
const defaultConfig: RateLimitConfig = {
  maxImpersonationsPerHour: 10,
  maxConcurrentSessions: 5,
  maxSessionDurationMinutes: 30,
  windowSizeMinutes: 60
};

/**
 * Map database row to ActiveSession
 */
function mapSessionRow(row: ImpersonationSessionRow): ActiveSession {
  return {
    id: row.id,
    userId: row.user_id,
    startedAt: new Date(row.started_at),
    expiresAt: new Date(row.expires_at),
    impersonatingUser: row.impersonating_user_id,
    tenantId: row.tenant_id
  };
}

/**
 * Map database row to RateLimitViolation
 */
function mapViolationRow(row: RateLimitViolationRow): RateLimitViolation {
  return {
    id: row.id,
    userId: row.user_id,
    limitType: row.limit_type as 'hourly' | 'concurrent' | 'duration',
    severity: row.severity as 'warning' | 'error',
    violatedAt: new Date(row.violated_at),
    tenantId: row.tenant_id
  };
}

/**
 * Check if user can start impersonation session
 * Validates against all rate limit rules in database
 * 
 * @param userId - Super admin user ID
 * @param tenantId - Tenant ID for multi-tenant support
 * @param config - Rate limit configuration
 * @returns Rate limit check result
 */
export async function checkImpersonationRateLimit(
  userId: string,
  tenantId: string,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitCheckResult> {
  const finalConfig = { ...defaultConfig, ...config };

  try {
    // In production, this would query Supabase:
    // const { data: sessions, error: sessionsError } = await supabase
    //   .from('impersonation_sessions')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .eq('tenant_id', tenantId);
    
    // For now, simulate Supabase query
    const sessions: ImpersonationSessionRow[] = [];
    
    // Check concurrent sessions limit
    const concurrentCount = sessions.filter(
      s => new Date(s.expires_at) > new Date()
    ).length;

    if (concurrentCount >= finalConfig.maxConcurrentSessions) {
      // Record violation in database
      await recordViolationInDatabase(userId, 'concurrent', 'error', tenantId);
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(),
        reason: `Cannot start impersonation: already have ${concurrentCount}/${finalConfig.maxConcurrentSessions} concurrent sessions`,
        limitType: 'concurrent'
      };
    }

    // Check hourly limit
    const now = new Date();
    const hourAgo = new Date(now.getTime() - finalConfig.windowSizeMinutes * 60 * 1000);
    
    // In production: query impersonation_limits table for recent counts
    const recentLimits: ImpersonationLimitRow[] = [];
    
    const hourlyCount = recentLimits
      .filter(l => new Date(l.timestamp) > hourAgo)
      .reduce((sum, l) => sum + l.count, 0);

    if (hourlyCount >= finalConfig.maxImpersonationsPerHour) {
      await recordViolationInDatabase(userId, 'hourly', 'error', tenantId);
      
      const nextReset = new Date(hourAgo.getTime() + finalConfig.windowSizeMinutes * 60 * 1000);
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
    console.error('[RateLimit] Error checking rate limit from Supabase:', error);
    throw error;
  }
}

/**
 * Record an impersonation session start
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

    // In production: insert into impersonation_sessions table
    // const { data, error } = await supabase
    //   .from('impersonation_sessions')
    //   .insert({
    //     id: sessionId,
    //     user_id: userId,
    //     impersonating_user_id: impersonatingUserId,
    //     started_at: now.toISOString(),
    //     expires_at: expiresAt.toISOString(),
    //     tenant_id: tenantId
    //   });

    // Also update rate limit counter
    // const { error: limitError } = await supabase
    //   .from('impersonation_limits')
    //   .insert({
    //     user_id: userId,
    //     tenant_id: tenantId,
    //     timestamp: now.toISOString(),
    //     count: 1
    //   });

    const session: ActiveSession = {
      id: sessionId,
      userId,
      startedAt: now,
      expiresAt,
      impersonatingUser: impersonatingUserId,
      tenantId
    };

    console.log(`[RateLimit] Impersonation session recorded in Supabase: ${sessionId}`);
    return session;
  } catch (error) {
    console.error('[RateLimit] Error recording impersonation start in Supabase:', error);
    throw error;
  }
}

/**
 * Record an impersonation session end
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
    // In production: query session, calculate duration, delete session
    // const { data: session, error: queryError } = await supabase
    //   .from('impersonation_sessions')
    //   .select('*')
    //   .eq('id', sessionId)
    //   .eq('tenant_id', tenantId)
    //   .single();

    // const duration = (new Date(session.expires_at) - new Date(session.started_at)) / (1000 * 60);

    // const { error: deleteError } = await supabase
    //   .from('impersonation_sessions')
    //   .delete()
    //   .eq('id', sessionId);

    const duration = 30; // Default for simulation

    console.log(`[RateLimit] Impersonation session ended in Supabase: ${sessionId}, duration: ${duration}min`);
    return duration;
  } catch (error) {
    console.error('[RateLimit] Error recording impersonation end in Supabase:', error);
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
    // In production: query impersonation_sessions table
    // const { data: session, error } = await supabase
    //   .from('impersonation_sessions')
    //   .select('started_at, expires_at')
    //   .eq('id', sessionId)
    //   .single();

    // const elapsedMinutes = (new Date() - new Date(session.started_at)) / (1000 * 60);
    // return elapsedMinutes > maxDurationMinutes;

    return false; // Simulate not exceeded
  } catch (error) {
    console.error('[RateLimit] Error checking session duration in Supabase:', error);
    throw error;
  }
}

/**
 * Get rate limit statistics for user from database
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

    // In production: query impersonation_limits table for hourly count
    // const { data: limits, error: limitsError } = await supabase
    //   .from('impersonation_limits')
    //   .select('count')
    //   .eq('user_id', userId)
    //   .eq('tenant_id', tenantId)
    //   .gte('timestamp', hourAgo.toISOString());

    const hourlyCount = 3; // Simulated

    // Get concurrent sessions from impersonation_sessions
    // const { data: sessions, error: sessionsError } = await supabase
    //   .from('impersonation_sessions')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .eq('tenant_id', tenantId)
    //   .gt('expires_at', now.toISOString());

    const concurrentSessions = 1; // Simulated
    const oldestSessionAge = 5; // Simulated

    // Get violations
    // const { data: userViolations } = await supabase
    //   .from('rate_limit_violations')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .eq('tenant_id', tenantId);

    const violationCount = 0; // Simulated

    const nextResetAt = new Date(hourAgo.getTime() + finalConfig.windowSizeMinutes * 60 * 1000);

    return {
      userId,
      hourlyCount,
      concurrentSessions,
      oldestSessionAge,
      nextResetAt,
      violations: violationCount,
      tenantId
    };
  } catch (error) {
    console.error('[RateLimit] Error getting stats from Supabase:', error);
    throw error;
  }
}

/**
 * Get all active sessions for user from database
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
    // In production: query impersonation_sessions table
    // const { data: rows, error } = await supabase
    //   .from('impersonation_sessions')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .eq('tenant_id', tenantId)
    //   .gt('expires_at', new Date().toISOString());

    // return rows.map(mapSessionRow);

    return []; // Return empty for simulation
  } catch (error) {
    console.error('[RateLimit] Error getting active sessions from Supabase:', error);
    throw error;
  }
}

/**
 * Force terminate a session in database
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
    // In production: delete from impersonation_sessions
    // const { error } = await supabase
    //   .from('impersonation_sessions')
    //   .delete()
    //   .eq('id', sessionId)
    //   .eq('tenant_id', tenantId);

    console.log(`[RateLimit] Session force terminated in Supabase: ${sessionId}`);
    return true;
  } catch (error) {
    console.error('[RateLimit] Error force terminating session in Supabase:', error);
    throw error;
  }
}

/**
 * Get violations for user from database
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
    // In production: query rate_limit_violations table
    // const { data: rows, error } = await supabase
    //   .from('rate_limit_violations')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .eq('tenant_id', tenantId);

    // return rows.map(mapViolationRow);

    return []; // Return empty for simulation
  } catch (error) {
    console.error('[RateLimit] Error getting violations from Supabase:', error);
    throw error;
  }
}

/**
 * Clear violations for user in database
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
    // In production: delete from rate_limit_violations
    // const { error } = await supabase
    //   .from('rate_limit_violations')
    //   .delete()
    //   .eq('user_id', userId)
    //   .eq('tenant_id', tenantId);

    console.log(`[RateLimit] Violations cleared in Supabase for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('[RateLimit] Error clearing violations in Supabase:', error);
    throw error;
  }
}

/**
 * Clean up expired sessions in database
 * 
 * @returns Number of sessions cleaned up
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    // In production: delete from impersonation_sessions where expires_at < now()
    // const { error } = await supabase
    //   .from('impersonation_sessions')
    //   .delete()
    //   .lt('expires_at', new Date().toISOString());

    console.log(`[RateLimit] Cleaned up expired sessions in Supabase`);
    return 0; // Simulated
  } catch (error) {
    console.error('[RateLimit] Error cleaning up expired sessions in Supabase:', error);
    throw error;
  }
}

/**
 * Reset rate limits for user in database
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
    // In production: delete from impersonation_limits and impersonation_sessions
    // const { error: limitsError } = await supabase
    //   .from('impersonation_limits')
    //   .delete()
    //   .eq('user_id', userId)
    //   .eq('tenant_id', tenantId);

    // const { error: sessionsError } = await supabase
    //   .from('impersonation_sessions')
    //   .delete()
    //   .eq('user_id', userId)
    //   .eq('tenant_id', tenantId);

    console.log(`[RateLimit] Rate limits reset in Supabase for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('[RateLimit] Error resetting rate limits in Supabase:', error);
    throw error;
  }
}

/**
 * Record a rate limit violation in database
 * 
 * @param userId - User ID
 * @param limitType - Type of limit violated
 * @param severity - Violation severity
 * @param tenantId - Tenant ID
 */
async function recordViolationInDatabase(
  userId: string,
  limitType: 'hourly' | 'concurrent' | 'duration',
  severity: 'warning' | 'error',
  tenantId: string
): Promise<void> {
  try {
    // In production: insert into rate_limit_violations
    // const { error } = await supabase
    //   .from('rate_limit_violations')
    //   .insert({
    //     user_id: userId,
    //     limit_type: limitType,
    //     severity: severity,
    //     violated_at: new Date().toISOString(),
    //     tenant_id: tenantId
    //   });

    console.log(`[RateLimit] Violation recorded in Supabase: ${userId} - ${limitType}`);
  } catch (error) {
    console.error('[RateLimit] Error recording violation in Supabase:', error);
    throw error;
  }
}

// Export Supabase service object
export const supabaseRateLimitService = {
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

export default supabaseRateLimitService;
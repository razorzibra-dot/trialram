/**
 * Impersonation Rate Limiting Service - Supabase Implementation
 * Layer 4: Supabase Service (Production)
 * 
 * Enforces rate limits on super admin impersonation sessions using Supabase backend.
 * Persists configuration and tracks sessions in PostgreSQL for audit trail.
 * 
 * Database Tables Used:
 * - impersonation_rate_limit_config: Stores rate limit configuration
 * - super_user_impersonation_logs: Used to count sessions for rate limiting
 * 
 * Last Updated: 2025-02-22
 */

import { supabaseClient as supabase } from '@/services/supabase/client';
import {
  ImpersonationRateLimitConfigType,
  ImpersonationRateLimitStatusType,
  ImpersonationRateLimitCheckResult,
  ImpersonationRateLimitConfigCreateInput,
  validateRateLimitConfig,
  validateRateLimitCheckResult,
} from '@/types/superUserModule';

/**
 * Default rate limit configuration
 * Applied when no config exists in database
 */
const DEFAULT_CONFIG = {
  maxImpersonationsPerHour: 10,
  maxConcurrentSessions: 5,
  maxSessionDurationMinutes: 30,
  enabled: true,
};

/**
 * Row mapper: Maps database snake_case to TypeScript camelCase
 * CRITICAL: Keep synchronized with database schema
 */
function mapConfigRow(row: any): ImpersonationRateLimitConfigType {
  return {
    id: row.id,
    maxImpersonationsPerHour: row.max_impersonations_per_hour,
    maxConcurrentSessions: row.max_concurrent_sessions,
    maxSessionDurationMinutes: row.max_session_duration_minutes,
    enabled: row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Supabase implementation of Impersonation Rate Limiting Service
 */
export const supabaseImpersonationRateLimitService = {
  /**
   * Get current rate limit configuration
   * Returns default if no custom config exists
   * 
   * @returns Current rate limit config
   */
  async getConfig(): Promise<ImpersonationRateLimitConfigType> {
    try {
      const { data, error } = await supabase
        .from('impersonation_rate_limit_config')
        .select(`
          id,
          max_impersonations_per_hour as maxImpersonationsPerHour,
          max_concurrent_sessions as maxConcurrentSessions,
          max_session_duration_minutes as maxSessionDurationMinutes,
          enabled,
          created_at as createdAt,
          updated_at as updatedAt
        `)
        .eq('is_default', true)
        .single();

      if (error) {
        console.warn('[SupabaseRateLimitService] Using default config:', error.message);
        return {
          id: 'default',
          ...DEFAULT_CONFIG,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      return mapConfigRow(data);
    } catch (err) {
      console.error('[SupabaseRateLimitService] Error fetching config:', err);
      throw err;
    }
  },

  /**
   * Update rate limit configuration
   * Creates new config version if doesn't exist
   * 
   * @param input - New configuration values
   * @returns Updated configuration
   */
  async updateConfig(
    input: Partial<ImpersonationRateLimitConfigCreateInput>
  ): Promise<ImpersonationRateLimitConfigType> {
    try {
      // Get current config first
      const current = await this.getConfig();

      // Prepare updated config
      const updated = {
        max_impersonations_per_hour: input.maxImpersonationsPerHour ?? current.maxImpersonationsPerHour,
        max_concurrent_sessions: input.maxConcurrentSessions ?? current.maxConcurrentSessions,
        max_session_duration_minutes: input.maxSessionDurationMinutes ?? current.maxSessionDurationMinutes,
        enabled: input.enabled ?? current.enabled,
        updated_at: new Date().toISOString(),
      };

      // Upsert configuration
      const { data, error } = await supabase
        .from('impersonation_rate_limit_config')
        .upsert(
          {
            id: current.id,
            is_default: true,
            ...updated,
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update config: ${error.message}`);
      }

      return mapConfigRow(data);
    } catch (err) {
      console.error('[SupabaseRateLimitService] Error updating config:', err);
      throw err;
    }
  },

  /**
   * Check if super admin can start impersonation
   * Verifies all rate limits are not exceeded
   * 
   * @param superAdminId - Super admin user ID
   * @returns Check result with allowed status and reasons
   */
  async checkRateLimit(superAdminId: string): Promise<ImpersonationRateLimitCheckResult> {
    try {
      const config = await this.getConfig();

      if (!config.enabled) {
        return {
          allowed: true,
          currentUsage: {
            impersonationsThisHour: 0,
            concurrentSessions: 0,
            longestSessionMinutes: 0,
          },
          limits: {
            maxPerHour: config.maxImpersonationsPerHour,
            maxConcurrent: config.maxConcurrentSessions,
            maxDurationMinutes: config.maxSessionDurationMinutes,
          },
          remainingCapacity: {
            impersonations: config.maxImpersonationsPerHour,
            concurrentSlots: config.maxConcurrentSessions,
          },
        };
      }

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Query: Sessions started in last hour
      const { data: recentSessions, error: recentError } = await supabase
        .from('super_user_impersonation_logs')
        .select('id, started_at, ended_at')
        .eq('super_admin_id', superAdminId)
        .gte('started_at', oneHourAgo.toISOString());

      if (recentError) {
        throw new Error(`Failed to fetch recent sessions: ${recentError.message}`);
      }

      // Count sessions from last hour
      const impersonationsThisHour = (recentSessions || []).length;

      // Query: Currently active sessions
      const { data: activeSessions, error: activeError } = await supabase
        .from('super_user_impersonation_logs')
        .select('id, started_at, ended_at')
        .eq('super_admin_id', superAdminId)
        .is('ended_at', null);

      if (activeError) {
        throw new Error(`Failed to fetch active sessions: ${activeError.message}`);
      }

      const concurrentSessions = (activeSessions || []).length;

      // Query: Get longest completed session
      const { data: longestSession } = await supabase
        .from('super_user_impersonation_logs')
        .select('id, started_at, ended_at')
        .eq('super_admin_id', superAdminId)
        .not('ended_at', 'is', null)
        .order('id', { ascending: false })
        .limit(1);

      const longestSessionMinutes = longestSession && longestSession.length > 0
        ? Math.ceil(
            (new Date(longestSession[0].ended_at).getTime() -
              new Date(longestSession[0].started_at).getTime()) /
            1000 /
            60
          )
        : 0;

      // Check rate limits
      const exceedsHourlyLimit = impersonationsThisHour >= config.maxImpersonationsPerHour;
      const exceedsConcurrentLimit = concurrentSessions >= config.maxConcurrentSessions;

      const allowed = !exceedsHourlyLimit && !exceedsConcurrentLimit;

      const result: ImpersonationRateLimitCheckResult = {
        allowed,
        reason: !allowed
          ? exceedsHourlyLimit
            ? `Rate limit exceeded: ${impersonationsThisHour}/${config.maxImpersonationsPerHour} impersonations in last hour`
            : `Concurrent session limit exceeded: ${concurrentSessions}/${config.maxConcurrentSessions} active sessions`
          : undefined,
        currentUsage: {
          impersonationsThisHour,
          concurrentSessions,
          longestSessionMinutes,
        },
        limits: {
          maxPerHour: config.maxImpersonationsPerHour,
          maxConcurrent: config.maxConcurrentSessions,
          maxDurationMinutes: config.maxSessionDurationMinutes,
        },
        remainingCapacity: {
          impersonations: Math.max(0, config.maxImpersonationsPerHour - impersonationsThisHour),
          concurrentSlots: Math.max(0, config.maxConcurrentSessions - concurrentSessions),
        },
      };

      return validateRateLimitCheckResult(result);
    } catch (err) {
      console.error('[SupabaseRateLimitService] Error checking rate limit:', err);
      throw err;
    }
  },

  /**
   * Get status for a super admin
   * Returns current rate limit usage and statistics
   * 
   * @param superAdminId - Super admin user ID
   * @returns Rate limit status
   */
  async getStatus(superAdminId: string): Promise<ImpersonationRateLimitStatusType> {
    try {
      const config = await this.getConfig();
      const check = await this.checkRateLimit(superAdminId);

      const now = new Date();
      const resetTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      return {
        superAdminId,
        impersonationsThisHour: check.currentUsage.impersonationsThisHour,
        concurrentSessionCount: check.currentUsage.concurrentSessions,
        longestSessionDurationSeconds: check.currentUsage.longestSessionMinutes * 60,
        configId: config.id,
        isRateLimited: !check.allowed,
        rateLimitReason: check.reason,
        resetAt: resetTime.toISOString(),
        checkedAt: now.toISOString(),
      };
    } catch (err) {
      console.error('[SupabaseRateLimitService] Error getting status:', err);
      throw err;
    }
  },

  /**
   * Get all active sessions
   * Returns list of currently active impersonation sessions
   * 
   * @returns Active sessions
   */
  async getActiveSessions(): Promise<Array<any>> {
    try {
      const { data, error } = await supabase
        .from('super_user_impersonation_logs')
        .select(`
          id,
          super_admin_id as superAdminId,
          impersonated_user_id as impersonatedUserId,
          tenant_id as tenantId,
          started_at as startedAt,
          reason
        `)
        .is('ended_at', null)
        .order('started_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch active sessions: ${error.message}`);
      }

      const now = new Date();

      return (data || []).map(session => ({
        sessionId: session.id,
        superAdminId: session.superAdminId,
        impersonatedUserId: session.impersonatedUserId,
        tenantId: session.tenantId,
        startedAt: session.startedAt,
        durationSeconds: Math.round(
          (now.getTime() - new Date(session.startedAt).getTime()) / 1000
        ),
        reason: session.reason,
      }));
    } catch (err) {
      console.error('[SupabaseRateLimitService] Error fetching active sessions:', err);
      throw err;
    }
  },
};

export default supabaseImpersonationRateLimitService;
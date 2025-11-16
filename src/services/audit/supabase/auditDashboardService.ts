/**
 * Supabase Audit Dashboard Service
 * Layer 4: Supabase implementation for audit dashboard metrics
 * 
 * Aggregates and analyzes audit logs from Supabase for dashboard visualization
 */

import { getSupabaseClient } from '@/services/supabase/client';
import {
  AuditDashboardMetrics,
  ActionByType,
  ActionByUser,
  TimelineEvent,
  AuditDashboardData,
} from '../../../services/auditDashboardService';

/**
 * Row mapper: converts snake_case from DB to camelCase
 */
const mapMetricsRow = (row: Record<string, unknown>): AuditDashboardMetrics => ({
  periodStart: row.period_start as string,
  periodEnd: row.period_end as string,
  totalImpersonationSessions: (row.total_impersonation_sessions as number) || 0,
  activeImpersonationSessions: (row.active_impersonation_sessions as number) || 0,
  unauthorizedAccessAttempts: (row.unauthorized_access_attempts as number) || 0,
  totalAuditLogEntries: (row.total_audit_log_entries as number) || 0,
  averageSessionDuration: (row.average_session_duration as number) || 0,
  peakActivityHour: (row.peak_activity_hour as number) || 0,
});

const mapActionByTypeRow = (row: Record<string, unknown>): ActionByType => ({
  type: row.action_type as string,
  count: (row.count as number) || 0,
  percentage: (row.percentage as number) || 0,
});

const mapActionByUserRow = (row: Record<string, unknown>): ActionByUser => ({
  userId: row.user_id as string,
  userName: row.user_name as string,
  userEmail: row.user_email as string,
  actionCount: (row.action_count as number) || 0,
  sessionCount: row.session_count as number,
  unauthorizedAttempts: row.unauthorized_attempts as number,
});

const mapTimelineRow = (row: Record<string, unknown>): TimelineEvent => ({
  timestamp: row.timestamp as string,
  eventType: row.event_type as string,
  description: row.description as string,
  userId: row.user_id as string,
  impersonatedUserId: row.impersonated_user_id as string,
  severity: (row.severity as string) || 'low',
});

/**
 * Supabase Audit Dashboard Service
 */
class SupabaseAuditDashboardService {
  /**
   * Get dashboard metrics for a date range
   */
  async getDashboardMetrics(
    dateFrom: string,
    dateTo: string,
    tenantId?: string
  ): Promise<AuditDashboardMetrics> {
    console.log('[AuditDashboard] Fetching dashboard metrics from Supabase:', {
      dateFrom,
      dateTo,
      tenantId,
    });

    try {
      const supabase = getSupabaseClient();

      // Query impersonation logs for session counts and duration
      let query = supabase
        .from('super_user_impersonation_logs')
        .select('*', { count: 'exact' })
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data: impersonationLogs, count: logCount } = await query;

      // Query audit logs for unauthorized attempts
      let auditQuery = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .gte('timestamp', dateFrom)
        .lte('timestamp', dateTo)
        .eq('action', 'UNAUTHORIZED_ACCESS');

      if (tenantId) {
        auditQuery = auditQuery.eq('tenant_id', tenantId);
      }

      const { data: unauthorizedLogs, count: unauthorizedCount } = await auditQuery;

      // Calculate metrics
      const activeSessions = impersonationLogs?.filter(l => !l.ended_at).length || 0;
      const durations = (impersonationLogs || [])
        .filter(l => l.started_at && l.ended_at)
        .map(l => {
          const start = new Date(l.started_at).getTime();
          const end = new Date(l.ended_at).getTime();
          return (end - start) / (1000 * 60); // minutes
        });

      const averageDuration =
        durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

      return {
        periodStart: dateFrom,
        periodEnd: dateTo,
        totalImpersonationSessions: logCount || 0,
        activeImpersonationSessions: activeSessions,
        unauthorizedAccessAttempts: unauthorizedCount || 0,
        totalAuditLogEntries: logCount || 0,
        averageSessionDuration: averageDuration,
        peakActivityHour: await this.calculatePeakHour(dateFrom, dateTo, tenantId),
      };
    } catch (error) {
      console.error('[AuditDashboard] Error fetching dashboard metrics:', error);
      throw new Error('Failed to fetch dashboard metrics');
    }
  }

  /**
   * Get actions grouped by type
   */
  async getActionsByType(
    dateFrom: string,
    dateTo: string,
    tenantId?: string
  ): Promise<ActionByType[]> {
    console.log('[AuditDashboard] Fetching actions by type from Supabase:', {
      dateFrom,
      dateTo,
      tenantId,
    });

    try {
      let query = supabase
        .from('audit_logs')
        .select('action')
        .gte('timestamp', dateFrom)
        .lte('timestamp', dateTo);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data } = await query;

      if (!data || data.length === 0) {
        return [];
      }

      // Group by action type and count
      const grouped = data.reduce(
        (acc, row) => {
          const action = row.action || 'UNKNOWN';
          acc[action] = (acc[action] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const total = Object.values(grouped).reduce((sum, count) => sum + count, 0);

      return Object.entries(grouped).map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / total) * 100),
      }));
    } catch (error) {
      console.error('[AuditDashboard] Error fetching actions by type:', error);
      throw new Error('Failed to fetch actions by type');
    }
  }

  /**
   * Get actions grouped by user
   */
  async getActionsByUser(
    dateFrom: string,
    dateTo: string,
    limit: number = 10,
    tenantId?: string
  ): Promise<ActionByUser[]> {
    console.log('[AuditDashboard] Fetching actions by user from Supabase:', {
      dateFrom,
      dateTo,
      limit,
      tenantId,
    });

    try {
      let query = supabase
        .from('audit_logs')
        .select('user_id, users(id, email, first_name, last_name)')
        .gte('timestamp', dateFrom)
        .lte('timestamp', dateTo)
        .limit(limit);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data } = await query;

      if (!data || data.length === 0) {
        return [];
      }

      // Group by user and count actions
      const grouped = data.reduce(
        (acc, row) => {
          const userId = row.user_id;
          if (!acc[userId]) {
            acc[userId] = {
              userId,
              actionCount: 0,
              sessions: 0,
              unauthorized: 0,
              user: row.users,
            };
          }
          acc[userId].actionCount++;
          return acc;
        },
        {} as Record<string, { userId: string; actionCount: number; sessions: number; unauthorized: number; user: unknown }>
      );

      return Object.values(grouped)
        .slice(0, limit)
        .map((item: { userId: string; actionCount: number; sessions: number; unauthorized: number; user: unknown }) => ({
          userId: item.userId,
          userName: item.user
            ? `${(item.user as { first_name?: string; last_name?: string }).first_name || ''} ${(item.user as { first_name?: string; last_name?: string }).last_name || ''}`.trim()
            : 'Unknown',
          userEmail: (item.user as { email?: string })?.email || 'unknown@example.com',
          actionCount: item.actionCount,
          sessionCount: item.sessions,
          unauthorizedAttempts: item.unauthorized,
        }));
    } catch (error) {
      console.error('[AuditDashboard] Error fetching actions by user:', error);
      throw new Error('Failed to fetch actions by user');
    }
  }

  /**
   * Get timeline events
   */
  async getTimeline(
    dateFrom: string,
    dateTo: string,
    limit: number = 50,
    tenantId?: string
  ): Promise<TimelineEvent[]> {
    console.log('[AuditDashboard] Fetching timeline from Supabase:', {
      dateFrom,
      dateTo,
      limit,
      tenantId,
    });

    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .gte('timestamp', dateFrom)
        .lte('timestamp', dateTo)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data } = await query;

      if (!data) {
        return [];
      }

      return data.map(row => ({
        timestamp: row.timestamp,
        eventType: row.action as string,
        description: row.description || `${row.action} performed`,
        userId: row.user_id,
        impersonatedUserId: row.impersonated_user_id,
        severity: this.calculateSeverity(row.action),
      }));
    } catch (error) {
      console.error('[AuditDashboard] Error fetching timeline:', error);
      throw new Error('Failed to fetch timeline');
    }
  }

  /**
   * Get top unauthorized access attempts
   */
  async getTopUnauthorizedUsers(
    dateFrom: string,
    dateTo: string,
    limit: number = 5,
    tenantId?: string
  ): Promise<ActionByUser[]> {
    console.log('[AuditDashboard] Fetching top unauthorized users from Supabase:', {
      dateFrom,
      dateTo,
      limit,
      tenantId,
    });

    try {
      let query = supabase
        .from('audit_logs')
        .select('user_id, users(id, email, first_name, last_name)')
        .eq('action', 'UNAUTHORIZED_ACCESS')
        .gte('timestamp', dateFrom)
        .lte('timestamp', dateTo);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data } = await query;

      if (!data || data.length === 0) {
        return [];
      }

      // Group by user
      const grouped = data.reduce(
        (acc, row) => {
          const userId = row.user_id;
          if (!acc[userId]) {
            acc[userId] = {
              userId,
              count: 0,
              user: row.users,
            };
          }
          acc[userId].count++;
          return acc;
        },
        {} as Record<string, { userId: string; count: number; user: unknown }>
      );

      return (Object.values(grouped) as { userId: string; count: number; user: unknown }[])
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map((item) => ({
          userId: item.userId,
          userName: item.user
            ? `${(item.user as { first_name?: string; last_name?: string }).first_name || ''} ${(item.user as { first_name?: string; last_name?: string }).last_name || ''}`.trim()
            : 'Unknown',
          userEmail: (item.user as { email?: string })?.email || 'unknown@example.com',
          actionCount: item.count,
          unauthorizedAttempts: item.count,
          sessionCount: 0,
        }));
    } catch (error) {
      console.error('[AuditDashboard] Error fetching top unauthorized users:', error);
      throw new Error('Failed to fetch unauthorized users');
    }
  }

  /**
   * Get complete dashboard data
   */
  async getDashboardData(
    dateFrom: string,
    dateTo: string,
    tenantId?: string
  ): Promise<AuditDashboardData> {
    console.log('[AuditDashboard] Fetching complete dashboard data from Supabase:', {
      dateFrom,
      dateTo,
      tenantId,
    });

    try {
      const [metrics, actionsByType, actionsByUser, timeline, topUnauthorizedUsers] = await Promise.all([
        this.getDashboardMetrics(dateFrom, dateTo, tenantId),
        this.getActionsByType(dateFrom, dateTo, tenantId),
        this.getActionsByUser(dateFrom, dateTo, 10, tenantId),
        this.getTimeline(dateFrom, dateTo, 50, tenantId),
        this.getTopUnauthorizedUsers(dateFrom, dateTo, 5, tenantId),
      ]);

      return {
        metrics,
        actionsByType,
        actionsByUser,
        timeline,
        topUnauthorizedUsers,
      };
    } catch (error) {
      console.error('[AuditDashboard] Error fetching dashboard data:', error);
      throw error;
    }
  }

  /**
   * Export dashboard data
   */
  async exportDashboardData(
    dateFrom: string,
    dateTo: string,
    format: 'csv' | 'json' | 'pdf' = 'json',
    tenantId?: string
  ): Promise<string> {
    console.log('[AuditDashboard] Exporting dashboard data:', { dateFrom, dateTo, format, tenantId });

    const data = await this.getDashboardData(dateFrom, dateTo, tenantId);

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data);
      case 'pdf':
        return JSON.stringify({ message: 'PDF export would be generated server-side' });
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Calculate peak activity hour
   */
  private async calculatePeakHour(dateFrom: string, dateTo: string, tenantId?: string): Promise<number> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('timestamp')
        .gte('timestamp', dateFrom)
        .lte('timestamp', dateTo);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data } = await query;

      if (!data || data.length === 0) {
        return 0;
      }

      // Group by hour and find max
      const hourCounts: Record<number, number> = {};
      data.forEach(log => {
        const hour = new Date(log.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      return Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
    } catch (error) {
      console.error('[AuditDashboard] Error calculating peak hour:', error);
      return 0;
    }
  }

  /**
   * Calculate severity based on action type
   */
  private calculateSeverity(action: string): 'low' | 'medium' | 'high' | 'critical' {
    if (action === 'UNAUTHORIZED_ACCESS') return 'critical';
    if (action === 'IMPERSONATION_START') return 'high';
    if (action.includes('DELETE')) return 'high';
    if (action.includes('MODIFY') || action.includes('UPDATE')) return 'medium';
    return 'low';
  }

  /**
   * Convert dashboard data to CSV format
   */
  private convertToCSV(data: AuditDashboardData): string {
    const lines: string[] = [];

    // Metrics section
    lines.push('AUDIT DASHBOARD REPORT');
    lines.push(`Period: ${data.metrics.periodStart} to ${data.metrics.periodEnd}`);
    lines.push('');
    lines.push('METRICS');
    lines.push(`Total Impersonation Sessions,${data.metrics.totalImpersonationSessions}`);
    lines.push(`Active Sessions,${data.metrics.activeImpersonationSessions}`);
    lines.push(`Unauthorized Access Attempts,${data.metrics.unauthorizedAccessAttempts}`);
    lines.push(`Total Audit Entries,${data.metrics.totalAuditLogEntries}`);
    lines.push('');

    // Actions by type
    lines.push('ACTIONS BY TYPE');
    lines.push('Type,Count,Percentage');
    data.actionsByType.forEach(a => {
      lines.push(`${a.type},${a.count},${a.percentage}%`);
    });
    lines.push('');

    // Actions by user
    lines.push('TOP USERS');
    lines.push('User Name,Email,Action Count,Sessions,Unauthorized Attempts');
    data.actionsByUser.forEach(u => {
      lines.push(`"${u.userName}","${u.userEmail}",${u.actionCount},${u.sessionCount || 0},${u.unauthorizedAttempts || 0}`);
    });

    return lines.join('\n');
  }
}

// Export singleton instance
export const supabaseAuditDashboardService = new SupabaseAuditDashboardService();
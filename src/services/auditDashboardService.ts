/**
 * Mock Audit Dashboard Service
 * Layer 3: Mock implementation for audit dashboard metrics
 * 
 * Provides aggregated audit metrics and statistics for dashboard visualization
 */

import {
  AuditDashboardMetrics,
  ActionByType,
  ActionByUser,
  TimelineEvent,
  AuditDashboardData,
  DashboardFilterOptions
} from '@/types';

/**
 * Mock Audit Dashboard Service
 */
class MockAuditDashboardService {
  /**
   * Get dashboard metrics for a date range
   */
  async getDashboardMetrics(
    dateFrom: string,
    dateTo: string,
    tenantId?: string
  ): Promise<AuditDashboardMetrics> {
    console.log('[AuditDashboard] Fetching dashboard metrics:', { dateFrom, dateTo, tenantId });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      periodStart: dateFrom,
      periodEnd: dateTo,
      totalImpersonationSessions: 24,
      activeImpersonationSessions: 3,
      unauthorizedAccessAttempts: 7,
      totalAuditLogEntries: 156,
      averageSessionDuration: 45,
      peakActivityHour: 14,
    };
  }

  /**
   * Get actions grouped by type
   */
  async getActionsByType(
    dateFrom: string,
    dateTo: string,
    tenantId?: string
  ): Promise<ActionByType[]> {
    console.log('[AuditDashboard] Fetching actions by type:', { dateFrom, dateTo, tenantId });

    await new Promise(resolve => setTimeout(resolve, 200));

    const types = [
      { type: 'IMPERSONATION_START', count: 24 },
      { type: 'IMPERSONATION_END', count: 21 },
      { type: 'UNAUTHORIZED_ACCESS', count: 7 },
      { type: 'CONFIG_CHANGE', count: 45 },
      { type: 'USER_CREATED', count: 12 },
      { type: 'USER_MODIFIED', count: 28 },
      { type: 'ROLE_ASSIGNED', count: 18 },
    ];

    const total = types.reduce((sum, t) => sum + t.count, 0);

    return types.map(t => ({
      type: t.type,
      count: t.count,
      percentage: Math.round((t.count / total) * 100),
    }));
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
    console.log('[AuditDashboard] Fetching actions by user:', { dateFrom, dateTo, limit, tenantId });

    await new Promise(resolve => setTimeout(resolve, 250));

    return [
      {
        userId: 'user-1',
        userName: 'John Admin',
        userEmail: 'john@example.com',
        actionCount: 45,
        sessionCount: 12,
        unauthorizedAttempts: 0,
      },
      {
        userId: 'user-2',
        userName: 'Jane Manager',
        userEmail: 'jane@example.com',
        actionCount: 38,
        sessionCount: 8,
        unauthorizedAttempts: 1,
      },
      {
        userId: 'super-admin-1',
        userName: 'Super Admin',
        userEmail: 'admin@platform.com',
        actionCount: 32,
        sessionCount: 6,
        unauthorizedAttempts: 0,
      },
      {
        userId: 'user-3',
        userName: 'Bob Operator',
        userEmail: 'bob@example.com',
        actionCount: 28,
        sessionCount: 5,
        unauthorizedAttempts: 2,
      },
      {
        userId: 'user-4',
        userName: 'Alice Analyst',
        userEmail: 'alice@example.com',
        actionCount: 13,
        sessionCount: 3,
        unauthorizedAttempts: 4,
      },
    ].slice(0, limit);
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
    console.log('[AuditDashboard] Fetching timeline:', { dateFrom, dateTo, limit, tenantId });

    await new Promise(resolve => setTimeout(resolve, 300));

    const now = new Date();
    const events: TimelineEvent[] = [
      {
        timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
        eventType: 'IMPERSONATION_START',
        description: 'Super admin started impersonating user john@example.com',
        userId: 'super-admin-1',
        impersonatedUserId: 'user-1',
        severity: 'high',
      },
      {
        timestamp: new Date(now.getTime() - 4 * 60000).toISOString(),
        eventType: 'AUDIT_LOG',
        description: 'User configuration updated',
        userId: 'user-1',
        severity: 'medium',
      },
      {
        timestamp: new Date(now.getTime() - 3 * 60000).toISOString(),
        eventType: 'UNAUTHORIZED_ACCESS',
        description: 'Unauthorized access attempt detected',
        userId: 'user-5',
        severity: 'critical',
      },
      {
        timestamp: new Date(now.getTime() - 2 * 60000).toISOString(),
        eventType: 'IMPERSONATION_END',
        description: 'Super admin ended impersonation session',
        userId: 'super-admin-1',
        severity: 'high',
      },
      {
        timestamp: new Date(now.getTime() - 60000).toISOString(),
        eventType: 'AUDIT_LOG',
        description: 'Role assignment: Manager added to user-3',
        userId: 'admin-1',
        severity: 'medium',
      },
    ];

    return events.slice(0, limit);
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
    console.log('[AuditDashboard] Fetching top unauthorized users:', { dateFrom, dateTo, limit, tenantId });

    await new Promise(resolve => setTimeout(resolve, 200));

    return [
      {
        userId: 'user-5',
        userName: 'Unknown User',
        userEmail: 'unknown@example.com',
        actionCount: 12,
        unauthorizedAttempts: 12,
        sessionCount: 0,
      },
      {
        userId: 'user-4',
        userName: 'Alice Analyst',
        userEmail: 'alice@example.com',
        actionCount: 15,
        unauthorizedAttempts: 4,
        sessionCount: 3,
      },
      {
        userId: 'user-2',
        userName: 'Jane Manager',
        userEmail: 'jane@example.com',
        actionCount: 40,
        unauthorizedAttempts: 1,
        sessionCount: 8,
      },
    ].slice(0, limit);
  }

  /**
   * Get complete dashboard data
   */
  async getDashboardData(
    dateFrom: string,
    dateTo: string,
    tenantId?: string
  ): Promise<AuditDashboardData> {
    console.log('[AuditDashboard] Fetching complete dashboard data:', { dateFrom, dateTo, tenantId });

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
export const auditDashboardService = new MockAuditDashboardService();
/**
 * Mock Audit Service
 * Provides audit logging and tracking functionality for development
 */

import { authService } from './authService';

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  changes?: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  tenantId: string;
}

class AuditService {
  private baseUrl = '/api/audit';
  
  // Mock audit logs
  private mockAuditLogs: AuditLog[] = [
    {
      id: '1',
      action: 'CREATE',
      resource: 'customer',
      resourceId: '1',
      userId: '1',
      user: {
        id: '1',
        name: 'John Admin',
        email: 'admin@company.com'
      },
      changes: {
        before: {},
        after: {
          company_name: 'TechCorp Solutions',
          contact_name: 'Alice Johnson',
          email: 'alice@techcorp.com'
        }
      },
      metadata: {
        source: 'web_app',
        sessionId: 'sess_123'
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: '2024-01-15T10:00:00Z',
      tenantId: 'tenant_1'
    },
    {
      id: '2',
      action: 'UPDATE',
      resource: 'customer',
      resourceId: '1',
      userId: '2',
      user: {
        id: '2',
        name: 'Sarah Manager',
        email: 'manager@company.com'
      },
      changes: {
        before: {
          status: 'prospect'
        },
        after: {
          status: 'active'
        }
      },
      metadata: {
        source: 'web_app',
        reason: 'Customer signed contract'
      },
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      createdAt: '2024-01-16T14:30:00Z',
      tenantId: 'tenant_1'
    },
    {
      id: '3',
      action: 'DELETE',
      resource: 'deal',
      resourceId: '5',
      userId: '1',
      user: {
        id: '1',
        name: 'John Admin',
        email: 'admin@company.com'
      },
      changes: {
        before: {
          title: 'Duplicate Deal',
          value: 5000,
          stage: 'lead'
        },
        after: {}
      },
      metadata: {
        source: 'web_app',
        reason: 'Duplicate entry'
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: '2024-01-17T09:15:00Z',
      tenantId: 'tenant_1'
    },
    {
      id: '4',
      action: 'LOGIN',
      resource: 'auth',
      resourceId: '2',
      userId: '2',
      user: {
        id: '2',
        name: 'Sarah Manager',
        email: 'manager@company.com'
      },
      metadata: {
        source: 'web_app',
        loginMethod: 'email_password'
      },
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      createdAt: '2024-01-18T08:00:00Z',
      tenantId: 'tenant_1'
    },
    {
      id: '5',
      action: 'EXPORT',
      resource: 'customer',
      resourceId: 'bulk',
      userId: '1',
      user: {
        id: '1',
        name: 'John Admin',
        email: 'admin@company.com'
      },
      metadata: {
        source: 'web_app',
        format: 'csv',
        recordCount: 150
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: '2024-01-19T16:45:00Z',
      tenantId: 'tenant_1'
    }
  ];

  async getAuditLogs(filters?: {
    action?: string;
    resource?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<AuditLog[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('read') && user.role !== 'Admin') {
      throw new Error('Insufficient permissions to view audit logs');
    }

    let logs = this.mockAuditLogs.filter(log => log.tenantId === user.tenant_id);

    if (filters) {
      if (filters.action) {
        logs = logs.filter(log => log.action.toLowerCase().includes(filters.action!.toLowerCase()));
      }
      if (filters.resource) {
        logs = logs.filter(log => log.resource.toLowerCase().includes(filters.resource!.toLowerCase()));
      }
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.dateFrom) {
        logs = logs.filter(log => new Date(log.createdAt) >= new Date(filters.dateFrom!));
      }
      if (filters.dateTo) {
        logs = logs.filter(log => new Date(log.createdAt) <= new Date(filters.dateTo!));
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        logs = logs.filter(log => 
          log.action.toLowerCase().includes(search) ||
          log.resource.toLowerCase().includes(search) ||
          log.user.name.toLowerCase().includes(search) ||
          log.user.email.toLowerCase().includes(search) ||
          JSON.stringify(log.metadata || {}).toLowerCase().includes(search)
        );
      }
    }

    // Sort by most recent first
    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    if (filters?.page && filters?.limit) {
      const start = (filters.page - 1) * filters.limit;
      const end = start + filters.limit;
      logs = logs.slice(start, end);
    }

    return logs;
  }

  async exportAuditLogs(filters?: {
    action?: string;
    resource?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    format?: 'csv' | 'json';
  }): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('read') && user.role !== 'Admin') {
      throw new Error('Insufficient permissions to export audit logs');
    }

    const logs = await this.getAuditLogs(filters);
    const format = filters?.format || 'csv';

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    // CSV format
    const headers = [
      'ID', 'Action', 'Resource', 'Resource ID', 'User Name', 'User Email',
      'IP Address', 'User Agent', 'Created At', 'Changes'
    ];

    const rows = logs.map(log => [
      log.id,
      log.action,
      log.resource,
      log.resourceId,
      log.user.name,
      log.user.email,
      log.ipAddress,
      log.userAgent,
      log.createdAt,
      log.changes ? JSON.stringify(log.changes) : ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell?.toString().replace(/"/g, '""') || ''}"`).join(','))
      .join('\r\n');
  }

  async searchAuditLogs(query: string): Promise<AuditLog[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('read') && user.role !== 'Admin') {
      throw new Error('Insufficient permissions to search audit logs');
    }

    return this.getAuditLogs({ search: query });
  }

  async getAuditStats(): Promise<{
    totalLogs: number;
    actionBreakdown: { action: string; count: number }[];
    resourceBreakdown: { resource: string; count: number }[];
    userActivity: { userId: string; userName: string; count: number }[];
    recentActivity: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('read') && user.role !== 'Admin') {
      throw new Error('Insufficient permissions to view audit statistics');
    }

    const logs = this.mockAuditLogs.filter(log => log.tenantId === user.tenant_id);

    // Action breakdown
    const actions = [...new Set(logs.map(log => log.action))];
    const actionBreakdown = actions.map(action => ({
      action,
      count: logs.filter(log => log.action === action).length
    }));

    // Resource breakdown
    const resources = [...new Set(logs.map(log => log.resource))];
    const resourceBreakdown = resources.map(resource => ({
      resource,
      count: logs.filter(log => log.resource === resource).length
    }));

    // User activity
    const users = [...new Set(logs.map(log => log.userId))];
    const userActivity = users.map(userId => {
      const userLogs = logs.filter(log => log.userId === userId);
      const userName = userLogs[0]?.user.name || 'Unknown User';
      return {
        userId,
        userName,
        count: userLogs.length
      };
    });

    // Recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const recentActivity = logs.filter(log => new Date(log.createdAt) > yesterday).length;

    return {
      totalLogs: logs.length,
      actionBreakdown,
      resourceBreakdown,
      userActivity,
      recentActivity
    };
  }

  // Method to log an action (for internal use)
  async logAction(
    action: string,
    resource: string,
    resourceId: string,
    changes?: { before: unknown; after: unknown },
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) return; // Don't log if no user

    const newLog: AuditLog = {
      id: Date.now().toString(),
      action,
      resource,
      resourceId,
      userId: user.id,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      },
      changes,
      metadata,
      ipAddress: '127.0.0.1', // Mock IP
      userAgent: navigator?.userAgent || 'Unknown',
      createdAt: new Date().toISOString(),
      tenantId: user.tenant_id
    };

    this.mockAuditLogs.push(newLog);
  }
}

export const auditService = new AuditService();

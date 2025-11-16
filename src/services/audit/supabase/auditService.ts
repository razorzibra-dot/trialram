/**
 * Supabase Audit Service
 * Layer 4: Supabase implementation for audit logging
 * 
 * **Database Schema** (Layer 1):
 * ```sql
 * TABLE audit_logs (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
 *   action VARCHAR(50) NOT NULL (CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, IMPERSONATE, etc)
 *   resource VARCHAR(100) NOT NULL (customer, deal, contract, auth, user, etc)
 *   resource_id VARCHAR(255) NOT NULL
 *   user_id UUID NOT NULL REFERENCES auth.users(id)
 *   user_name VARCHAR(255)
 *   user_email VARCHAR(255)
 *   changes JSONB (before/after snapshots)
 *   metadata JSONB (source, session_id, reason, etc)
 *   ip_address INET
 *   user_agent TEXT
 *   created_at TIMESTAMP DEFAULT now()
 *   tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE
 * )
 * ```
 */

import { createClient } from '@supabase/supabase-js';

const supabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

const getSupabaseClient = () => supabaseClient;
import { AuditLog } from '../../../services/auditService';

/**
 * Row mapper: converts snake_case from DB to camelCase for TypeScript
 * Ensures consistent field naming across layers
 */
const mapAuditLogRow = (row: any): AuditLog => ({
  id: row.id,
  action: row.action,
  resource: row.resource,
  resourceId: row.resource_id,
  userId: row.user_id,
  user: {
    id: row.user_id,
    name: row.user_name || 'Unknown',
    email: row.user_email || 'unknown@example.com'
  },
  changes: row.changes || undefined,
  metadata: row.metadata || undefined,
  ipAddress: row.ip_address || '0.0.0.0',
  userAgent: row.user_agent || 'Unknown',
  createdAt: row.created_at,
  tenantId: row.tenant_id
});

/**
 * Supabase Audit Service
 * Provides audit logging functionality using Supabase PostgreSQL
 * 
 * **Row-Level Security**:
 * - Users can only see audit logs for their tenant
 * - Super admins can see all audit logs
 * - Audit logs are immutable (no updates)
 */
class SupabaseAuditService {
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
    try {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.action) {
        query = query.ilike('action', `%${filters.action}%`);
      }
      if (filters?.resource) {
        query = query.ilike('resource', `%${filters.resource}%`);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Apply pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      query = query.range(start, end);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
      }

      return (data || []).map(mapAuditLogRow);
    } catch (error) {
      console.error('Supabase audit service error:', error);
      throw error;
    }
  }

  async getAuditLog(id: string): Promise<AuditLog | null> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }

      return data ? mapAuditLogRow(data) : null;
    } catch (error) {
      console.error('Error fetching audit log:', error);
      throw error;
    }
  }

  async searchAuditLogs(query: string): Promise<AuditLog[]> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .or(
          `action.ilike.%${query}%,resource.ilike.%${query}%,user_name.ilike.%${query}%,user_email.ilike.%${query}%`
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      return (data || []).map(mapAuditLogRow);
    } catch (error) {
      console.error('Error searching audit logs:', error);
      throw error;
    }
  }

  async getAuditStats(): Promise<{
    totalLogs: number;
    actionBreakdown: { action: string; count: number }[];
    resourceBreakdown: { resource: string; count: number }[];
    userActivity: { userId: string; userName: string; count: number }[];
    recentActivity: number;
  }> {
    try {
      // Get total logs
      const { count: totalLogs } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      // Get action breakdown
      const { data: actionData } = await supabase
        .from('audit_logs')
        .select('action')
        .limit(10000); // Load all for analysis

      const actionBreakdown = actionData
        ? Array.from(
            actionData.reduce((acc: Map<string, number>, log: any) => {
              acc.set(log.action, (acc.get(log.action) || 0) + 1);
              return acc;
            }, new Map())
          ).map(([action, count]) => ({ action, count }))
        : [];

      // Get resource breakdown
      const { data: resourceData } = await supabase
        .from('audit_logs')
        .select('resource')
        .limit(10000);

      const resourceBreakdown = resourceData
        ? Array.from(
            resourceData.reduce((acc: Map<string, number>, log: any) => {
              acc.set(log.resource, (acc.get(log.resource) || 0) + 1);
              return acc;
            }, new Map())
          ).map(([resource, count]) => ({ resource, count }))
        : [];

      // Get user activity
      const { data: userData } = await supabase
        .from('audit_logs')
        .select('user_id, user_name')
        .limit(10000);

      const userActivity = userData
        ? Array.from(
            userData.reduce((acc: Map<string, any>, log: any) => {
              const existing = acc.get(log.user_id) || { count: 0, name: log.user_name };
              acc.set(log.user_id, { ...existing, count: existing.count + 1 });
              return acc;
            }, new Map())
          ).map(([userId, { count, name }]) => ({
            userId,
            userName: name || 'Unknown User',
            count
          }))
        : [];

      // Get recent activity (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { count: recentCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      return {
        totalLogs: totalLogs || 0,
        actionBreakdown,
        resourceBreakdown,
        userActivity,
        recentActivity: recentCount || 0
      };
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      throw error;
    }
  }

  async exportAuditLogs(filters?: {
    action?: string;
    resource?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    format?: 'csv' | 'json';
  }): Promise<string> {
    try {
      const logs = await this.getAuditLogs(filters);
      const format = filters?.format || 'csv';

      if (format === 'json') {
        return JSON.stringify(logs, null, 2);
      }

      // CSV format
      const headers = [
        'ID',
        'Action',
        'Resource',
        'Resource ID',
        'User Name',
        'User Email',
        'IP Address',
        'User Agent',
        'Created At',
        'Changes'
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
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }

  async logAction(
    action: string,
    resource: string,
    resourceId: string,
    changes?: { before: unknown; after: unknown },
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const supabase = getSupabaseClient();

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase.from('audit_logs').insert({
        action,
        resource,
        resource_id: resourceId,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email,
        user_email: user.email,
        changes,
        metadata,
        ip_address: '127.0.0.1', // In production, capture from request
        user_agent: navigator?.userAgent || 'Unknown',
        created_at: new Date().toISOString()
      });

      if (error) {
        console.error('Error logging action:', error);
      }
    } catch (error) {
      console.error('Error in logAction:', error);
    }
  }
}

export const supabaseAuditService = new SupabaseAuditService();
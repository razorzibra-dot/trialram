/**
 * Audit Log Repository
 * Layer 4: Database access layer using GenericRepository pattern
 * 
 * Extends GenericRepository to provide audit-log-specific database operations
 * with built-in tenant isolation, filtering, and search capabilities.
 */

import { GenericRepository } from '@/services/core/GenericRepository';
import { AuditLog } from '@/types/audit';
import { RepositoryConfig } from '@/types/generic';

/**
 * Database row type for audit_logs table (snake_case from DB)
 */
export interface AuditLogRow {
  id: string;
  action: string;
  resource: string;
  resource_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  changes?: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at?: string;
  tenant_id: string;
}

/**
 * Mapper: Converts snake_case DB row to camelCase TypeScript type
 */
const mapAuditLogRow = (row: AuditLogRow): AuditLog => ({
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
  changes: row.changes ? {
    before: row.changes.before || {},
    after: row.changes.after || {}
  } : undefined,
  metadata: row.metadata || undefined,
  ipAddress: row.ip_address || '0.0.0.0',
  userAgent: row.user_agent || 'Unknown',
  createdAt: row.created_at,
  tenantId: row.tenant_id
});

/**
 * AuditLogRepository
 * 
 * Repository configuration:
 * - Table: audit_logs
 * - Search fields: action, resource, user_name, user_email
 * - Soft delete: No (audit logs are immutable)
 * - Mapper: mapAuditLogRow
 */
export class AuditLogRepository extends GenericRepository<AuditLog, Partial<AuditLog>, Partial<AuditLog>, AuditLogRow> {
  constructor() {
    const config: RepositoryConfig<AuditLog, AuditLogRow> = {
      tableName: 'audit_logs',
      searchFields: ['action', 'resource', 'user_name', 'user_email'],
      softDelete: {
        enabled: false,
        field: 'deleted_at'
      },
      mapper: mapAuditLogRow,
      readOnlyFields: ['id', 'created_at', 'updated_at', 'tenant_id'] // All fields are read-only for audit logs
    };
    
    super(config);
  }

  /**
   * Override create to prevent modification of audit logs
   * Audit logs should only be created by the system, not by users
   */
  async create(): Promise<AuditLog> {
    throw new Error('Direct creation of audit logs is not allowed. Use system audit service.');
  }

  /**
   * Override update to prevent modification of audit logs
   * Audit logs are immutable once created
   */
  async update(): Promise<AuditLog> {
    throw new Error('Audit logs are immutable and cannot be updated');
  }

  /**
   * Override delete to prevent deletion of audit logs
   * Audit logs should be archived, not deleted
   */
  async delete(): Promise<void> {
    throw new Error('Audit logs cannot be deleted. Use archive functionality instead.');
  }
}

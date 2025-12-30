/**
 * Audit Log Service
 * Layer 5: Business logic layer using GenericCrudService pattern
 * 
 * Extends GenericCrudService to provide audit-log-specific business logic
 * with lifecycle hooks for validation and authorization.
 */

import { GenericCrudService } from '@/services/core/GenericCrudService';
import { AuditLogRepository, AuditLogRow } from './AuditLogRepository';
import { AuditLog } from '@/types/audit';
import { QueryFilters, ServiceContext } from '@/types/generic';
import { UnauthorizedError } from '@/services/core/errors';

/**
 * AuditLogService
 * 
 * Provides business logic for audit log operations:
 * - Read-only access to audit logs
 * - Filtering by action, resource, user, date range
 * - Search across action, resource, and user fields
 * - Authorization checks for tenant isolation
 */
export class AuditLogService extends GenericCrudService<AuditLog, Partial<AuditLog>, Partial<AuditLog>, QueryFilters, AuditLogRow> {
  private auditLogRepository: AuditLogRepository;

  constructor() {
    const repository = new AuditLogRepository();
    super(repository);
    this.auditLogRepository = repository;
  }

  /**
   * Lifecycle hook: Before getting all audit logs
   * Add custom filtering for action, resource, userId, date ranges
   */
  protected async beforeGetAll(filters?: QueryFilters): Promise<void> {
    if (!filters) return;

    const customFilters = (filters as Record<string, unknown>).customFilters as
      | {
          action?: string;
          resource?: string;
          userId?: string;
          dateFrom?: string;
          dateTo?: string;
        }
      | undefined;

    if (!customFilters) return;

    const filterGroup = (filters as Record<string, any>).filters || {};

    if (customFilters.action) {
      filterGroup.action = customFilters.action;
    }

    if (customFilters.resource) {
      filterGroup.resource = customFilters.resource;
    }

    if (customFilters.userId) {
      filterGroup.user_id = customFilters.userId;
    }

    if (customFilters.dateFrom) {
      filterGroup.created_at_gte = customFilters.dateFrom;
    }

    if (customFilters.dateTo) {
      filterGroup.created_at_lte = customFilters.dateTo;
    }

    (filters as Record<string, any>).filters = filterGroup;
  }

  /**
   * Lifecycle hook: Check read authorization
   * Ensure users can only access audit logs within their tenant
   * Super admins can access all audit logs
   */
  protected async checkReadAuthorization(_entity: AuditLog): Promise<void> {
    // RLS + service-layer context enforce tenant scoping; no additional checks
  }

  /**
   * Lifecycle hook: Check update authorization
   * Audit logs are immutable - no updates allowed
   */
  protected async checkUpdateAuthorization(_entity: AuditLog): Promise<void> {
    throw new UnauthorizedError('Audit logs are immutable and cannot be updated');
  }

  /**
   * Lifecycle hook: Check delete authorization
   * Audit logs cannot be deleted - only archived
   */
  protected async checkDeleteAuthorization(_entity: AuditLog): Promise<void> {
    throw new UnauthorizedError('Audit logs cannot be deleted. Use archive functionality instead.');
  }

  /**
   * Override create method to prevent direct creation
   * Audit logs should only be created by system audit service
   */
  async create(_data: Partial<AuditLog>): Promise<AuditLog> {
    throw new UnauthorizedError('Direct creation of audit logs is not allowed. Use system audit service.');
  }

  /**
   * Override update method to enforce immutability
   */
  async update(_id: string, _data: Partial<AuditLog>): Promise<AuditLog> {
    throw new UnauthorizedError('Audit logs are immutable and cannot be updated');
  }

  /**
   * Override delete method to prevent deletion
   */
  async delete(_id: string): Promise<void> {
    throw new UnauthorizedError('Audit logs cannot be deleted. Use archive functionality instead.');
  }

  /**
   * Custom method: Get audit logs by action
   */
  async getByAction(
    action: string,
    page: number = 1,
    limit: number = 10,
    context: ServiceContext
  ): Promise<{ data: AuditLog[]; total: number }> {
    const filters: QueryFilters = {
      page,
      limit,
      customFilters: { action }
    };

    return this.getAll(filters, context);
  }

  /**
   * Custom method: Get audit logs by resource
   */
  async getByResource(
    resource: string,
    page: number = 1,
    limit: number = 10,
    context: ServiceContext
  ): Promise<{ data: AuditLog[]; total: number }> {
    const filters: QueryFilters = {
      page,
      limit,
      customFilters: { resource }
    };

    return this.getAll(filters, context);
  }

  /**
   * Custom method: Get audit logs by user
   */
  async getByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
    context: ServiceContext
  ): Promise<{ data: AuditLog[]; total: number }> {
    const filters: QueryFilters = {
      page,
      limit,
      customFilters: { userId }
    };

    return this.getAll(filters, context);
  }

  /**
   * Custom method: Get audit logs by date range
   */
  async getByDateRange(
    dateFrom: string,
    dateTo: string,
    page: number = 1,
    limit: number = 10,
    context: ServiceContext
  ): Promise<{ data: AuditLog[]; total: number }> {
    const filters: QueryFilters = {
      page,
      limit,
      customFilters: { dateFrom, dateTo }
    };

    return this.getAll(filters, context);
  }
}

// Export singleton instance
export const auditLogService = new AuditLogService();

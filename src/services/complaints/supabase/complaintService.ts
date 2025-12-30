/**
 * Complaint Service - REFACTORED
 * Layer 5: Business logic layer using GenericCrudService pattern
 * 
 * Extends GenericCrudService to provide complaint-specific business logic
 * with lifecycle hooks for validation and authorization.
 */

import { GenericCrudService } from '@/services/core/GenericCrudService';
import { ComplaintRepository, ComplaintRow } from './ComplaintRepository';
import { Complaint } from '@/types/complaints';
import { QueryFilters, ServiceContext } from '@/types/generic';

/**
 * ComplaintService
 * 
 * Provides business logic for complaint operations:
 * - CRUD operations with tenant isolation
 * - Filtering by status, category, priority, assigned user
 * - Search across title and description
 * - Role-based authorization (agents see only assigned complaints)
 */
export class ComplaintService extends GenericCrudService<Complaint, Partial<Complaint>, Partial<Complaint>, QueryFilters, ComplaintRow> {
  private complaintRepository: ComplaintRepository;

  constructor() {
    const repository = new ComplaintRepository();
    super(repository);
    this.complaintRepository = repository;
  }

  /**
   * Lifecycle hook: Before getting all complaints
   * Add custom filtering for status, type, priority, assignedEngineerId
   */
  protected async beforeGetAll(filters?: QueryFilters): Promise<void> {
    if (!filters) return;

    const customFilters = (filters as Record<string, unknown>).customFilters as
      | {
          status?: string;
          type?: string;
          priority?: string;
          assignedEngineerId?: string;
          customerId?: string;
        }
      | undefined;

    if (!customFilters) return;

    const filterGroup = (filters as Record<string, any>).filters || {};

    if (customFilters.status) {
      filterGroup.status = customFilters.status;
    }

    if (customFilters.type) {
      filterGroup.type = customFilters.type;
    }

    if (customFilters.priority) {
      filterGroup.priority = customFilters.priority;
    }

    if (customFilters.assignedEngineerId) {
      filterGroup.assigned_engineer_id = customFilters.assignedEngineerId;
    }

    if (customFilters.customerId) {
      filterGroup.customer_id = customFilters.customerId;
    }

    (filters as Record<string, any>).filters = filterGroup;
  }

  /**
   * Lifecycle hook: Validate complaint on creation
   */
  protected async validateCreate(data: Partial<Complaint>): Promise<void> {
    const errors: Record<string, string> = {};

    if (!data.title || data.title.trim() === '') {
      errors.title = 'Title is required';
    }

    if (!data.description || data.description.trim() === '') {
      errors.description = 'Description is required';
    }

    if (!data.priority) {
      errors.priority = 'Priority is required';
    }

    if (Object.keys(errors).length > 0) {
      const error = new Error('Validation failed');
      (error as any).validationErrors = errors;
      throw error;
    }
  }

  /**
   * Lifecycle hook: Validate complaint on update
   */
  protected async validateUpdate(
    id: string,
    data: Partial<Complaint>
  ): Promise<void> {
    const errors: Record<string, string> = {};

    if (data.title !== undefined && data.title.trim() === '') {
      errors.title = 'Title cannot be empty';
    }

    if (data.description !== undefined && data.description.trim() === '') {
      errors.description = 'Description cannot be empty';
    }

    if (Object.keys(errors).length > 0) {
      const error = new Error('Validation failed');
      (error as any).validationErrors = errors;
      throw error;
    }
  }

  /**
   * Custom method: Get complaints by status
   */
  async getByStatus(
    status: string,
    page: number = 1,
    limit: number = 10,
    context: ServiceContext
  ): Promise<{ data: Complaint[]; total: number }> {
    const filters: QueryFilters = {
      page,
      limit,
      customFilters: { status }
    };

    return this.getAll(filters, context);
  }

  /**
   * Custom method: Get complaints by priority
   */
  async getByPriority(
    priority: string,
    page: number = 1,
    limit: number = 10,
    context: ServiceContext
  ): Promise<{ data: Complaint[]; total: number }> {
    const filters: QueryFilters = {
      page,
      limit,
      customFilters: { priority }
    };

    return this.getAll(filters, context);
  }

  /**
   * Custom method: Get complaints assigned to an engineer
   */
  async getAssignedToEngineer(
    engineerId: string,
    page: number = 1,
    limit: number = 10,
    context: ServiceContext
  ): Promise<{ data: Complaint[]; total: number }> {
    const filters: QueryFilters = {
      page,
      limit,
      customFilters: { assignedEngineerId: engineerId }
    };

    return this.getAll(filters, context);
  }

  /**
   * Custom method: Resolve complaint
   */
  async resolveComplaint(
    id: string,
    resolution: string,
    context: ServiceContext
  ): Promise<Complaint> {
    return this.update(id, { status: 'closed', engineerResolution: resolution }, context);
  }

  /**
   * Custom method: Assign complaint to engineer
   */
  async assignToEngineer(
    id: string,
    engineerId: string,
    context: ServiceContext
  ): Promise<Complaint> {
    return this.update(id, { assignedEngineerId: engineerId }, context);
  }
}

// Export singleton instance
export const complaintService = new ComplaintService();

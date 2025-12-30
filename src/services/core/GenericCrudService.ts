/**
 * Generic CRUD Service
 * Base service class with lifecycle hooks for business logic customization
 * 
 * Usage:
 * ```typescript
 * export class DealService extends GenericCrudService<
 *   Deal, DealCreateInput, DealUpdateInput, DealFilters
 * > {
 *   constructor() {
 *     super(dealRepository);
 *   }
 * 
 *   // Override hooks to add business logic
 *   protected async validateCreate(data: DealCreateInput): Promise<void> {
 *     if (data.value < 0) throw new ValidationError('Invalid value');
 *   }
 * 
 *   protected async afterCreate(deal: Deal): Promise<void> {
 *     await this.notifyTeam(deal);
 *   }
 * }
 * ```
 */

import {
  PaginatedResponse,
  QueryFilters,
} from '@/types/generic';
import { GenericRepository } from './GenericRepository';
import {
  ServiceError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ErrorHandler,
} from './errors';

export abstract class GenericCrudService<
  T,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
  TFilters extends QueryFilters = QueryFilters,
  TRow = Record<string, unknown>
> {
  protected repository: GenericRepository<T, TCreate, TUpdate, TRow>;

  constructor(repository: GenericRepository<T, TCreate, TUpdate, TRow>) {
    this.repository = repository;
  }

  /**
   * Get all entities with filters and pagination
   */
  async getAll(filters?: TFilters, context?: any): Promise<PaginatedResponse<T>> {
    try {
      // Pre-hook
      await this.beforeGetAll?.(filters);

      // Fetch from repository
      const result = await this.repository.findMany(filters);

      // Post-hook
      await this.afterGetAll?.(result);

      return result;
    } catch (error) {
      ErrorHandler.log(error, { operation: 'getAll', filters });
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * Get single entity by ID
   */
  async getById(id: string, context?: any): Promise<T> {
    try {
      // Pre-hook
      await this.beforeGetById?.(id);

      // Fetch from repository
      const entity = await this.repository.findById(id);

      // Check authorization
      await this.checkReadAuthorization?.(entity);

      // Post-hook
      await this.afterGetById?.(entity);

      return entity;
    } catch (error) {
      ErrorHandler.log(error, { operation: 'getById', id });
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * Create new entity
   */
  async create(data: TCreate, context?: any): Promise<T> {
    try {
      // Validate input
      await this.validateCreate?.(data);

      // Pre-hook
      await this.beforeCreate?.(data);

      // Create in repository
      const entity = await this.repository.create(data);

      // Post-hook
      await this.afterCreate?.(entity);

      // Trigger events (async, don't wait)
      this.onCreated?.(entity).catch((error) => {
        console.error('Error in onCreated hook:', error);
      });

      return entity;
    } catch (error) {
      ErrorHandler.log(error, { operation: 'create', data });
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * Update existing entity
   */
  async update(id: string, data: TUpdate, context?: any): Promise<T> {
    try {
      // Fetch existing entity
      const existing = await this.repository.findById(id);

      // Check authorization
      await this.checkUpdateAuthorization?.(existing);

      // Validate update
      await this.validateUpdate?.(id, data);

      // Pre-hook
      await this.beforeUpdate?.(existing, data);

      // Update in repository
      const updated = await this.repository.update(id, data);

      // Post-hook
      await this.afterUpdate?.(updated);

      // Trigger events (async, don't wait)
      this.onUpdated?.(existing, updated).catch((error) => {
        console.error('Error in onUpdated hook:', error);
      });

      return updated;
    } catch (error) {
      ErrorHandler.log(error, { operation: 'update', id, data });
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * Delete entity
   */
  async delete(id: string, context?: any): Promise<void> {
    try {
      // Fetch existing entity
      const entity = await this.repository.findById(id);

      // Check authorization
      await this.checkDeleteAuthorization?.(entity);

      // Pre-hook
      await this.beforeDelete?.(entity);

      // Delete from repository
      await this.repository.delete(id);

      // Post-hook
      await this.afterDelete?.(entity);

      // Trigger events (async, don't wait)
      this.onDeleted?.(entity).catch((error) => {
        console.error('Error in onDeleted hook:', error);
      });
    } catch (error) {
      ErrorHandler.log(error, { operation: 'delete', id });
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * Count entities matching filters
   */
  async count(filters?: TFilters): Promise<number> {
    try {
      return await this.repository.count(filters);
    } catch (error) {
      ErrorHandler.log(error, { operation: 'count', filters });
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      return await this.repository.exists(id);
    } catch (error) {
      ErrorHandler.log(error, { operation: 'exists', id });
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * Batch delete multiple entities
   * Returns result with success/failure details for each ID
   */
  async batchDelete(ids: string[], context?: any): Promise<BatchDeleteResult> {
    const result: BatchDeleteResult = {
      successIds: [],
      failedIds: [],
      errors: [],
      total: ids.length,
      successCount: 0,
      failureCount: 0,
    };

    if (ids.length === 0) {
      return result;
    }

    try {
      // Pre-hook for batch validation
      await this.beforeBatchDelete?.(ids);

      // Process each ID
      for (const id of ids) {
        try {
          // Fetch entity for authorization and hooks
          const entity = await this.repository.findById(id);

          // Check authorization
          await this.checkDeleteAuthorization?.(entity);

          // Pre-hook
          await this.beforeDelete?.(entity);

          // Delete from repository
          await this.repository.delete(id);

          // Post-hook
          await this.afterDelete?.(entity);

          // Track success
          result.successIds.push(id);
          result.successCount++;

          // Trigger events (async, don't wait)
          this.onDeleted?.(entity).catch((error) => {
            console.error('Error in onDeleted hook:', error);
          });
        } catch (error: any) {
          // Track failure
          result.failedIds.push(id);
          result.failureCount++;
          result.errors.push({
            id,
            message: error.message || 'Delete failed',
            error,
          });

          console.error(`Failed to delete entity ${id}:`, error);
        }
      }

      // Post-hook for batch
      await this.afterBatchDelete?.(result);

      return result;
    } catch (error) {
      ErrorHandler.log(error, { operation: 'batchDelete', ids });
      throw ErrorHandler.handle(error);
    }
  }

  // ============================================
  // Lifecycle Hooks (Override in subclasses)
  // ============================================

  /**
   * Called before getAll
   * Use for: query optimization, caching checks
   */
  protected beforeGetAll?(filters?: TFilters): Promise<void>;

  /**
   * Called after getAll
   * Use for: additional data enrichment
   */
  protected afterGetAll?(result: PaginatedResponse<T>): Promise<void>;

  /**
   * Called before getById
   * Use for: analytics, logging
   */
  protected beforeGetById?(id: string): Promise<void>;

  /**
   * Called after getById
   * Use for: related data loading
   */
  protected afterGetById?(entity: T): Promise<void>;

  /**
   * Validate create input
   * Throw ValidationError if invalid
   */
  protected validateCreate?(data: TCreate): Promise<void>;

  /**
   * Called before create
   * Use for: data transformation, defaults
   */
  protected beforeCreate?(data: TCreate): Promise<void>;

  /**
   * Called after create (within transaction)
   * Use for: related record creation
   */
  protected afterCreate?(entity: T): Promise<void>;

  /**
   * Called after create (async, outside transaction)
   * Use for: notifications, webhooks, audit logs
   */
  protected onCreated?(entity: T): Promise<void>;

  /**
   * Validate update input
   * Throw ValidationError if invalid
   */
  protected validateUpdate?(id: string, data: TUpdate): Promise<void>;

  /**
   * Called before update
   * Use for: business rule validation
   */
  protected beforeUpdate?(existing: T, data: TUpdate): Promise<void>;

  /**
   * Called after update (within transaction)
   * Use for: related record updates
   */
  protected afterUpdate?(entity: T): Promise<void>;

  /**
   * Called after update (async, outside transaction)
   * Use for: change notifications, audit trail
   */
  protected onUpdated?(before: T, after: T): Promise<void>;

  /**
   * Called before delete
   * Use for: deletion validation, dependency checks
   */
  protected beforeDelete?(entity: T): Promise<void>;

  /**
   * Called after delete (within transaction)
   * Use for: cascade deletes
   */
  protected afterDelete?(entity: T): Promise<void>;

  /**
   * Called after delete (async, outside transaction)
   * Use for: cleanup tasks, notifications
   */
  protected onDeleted?(entity: T): Promise<void>;

  /**
   * Called before batch delete
   * Use for: batch validation, authorization checks
   */
  protected beforeBatchDelete?(ids: string[]): Promise<void>;

  /**
   * Called after batch delete completes
   * Use for: cache clearing, notifications
   */
  protected afterBatchDelete?(result: BatchDeleteResult): Promise<void>;

  /**
   * Check if current user can read this entity
   * Throw UnauthorizedError if not allowed
   */
  protected checkReadAuthorization?(entity: T): Promise<void>;

  /**
   * Check if current user can update this entity
   * Throw UnauthorizedError if not allowed
   */
  protected checkUpdateAuthorization?(entity: T): Promise<void>;

  /**
   * Check if current user can delete this entity
   * Throw UnauthorizedError if not allowed
   */
  protected checkDeleteAuthorization?(entity: T): Promise<void>;

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Get changes between two entities
   * Useful for audit logging
   */
  protected getChanges(before: T, after: T): Record<string, { before: unknown; after: unknown }> {
    const changes: Record<string, { before: unknown; after: unknown }> = {};

    const beforeObj = before as Record<string, unknown>;
    const afterObj = after as Record<string, unknown>;

    Object.keys(afterObj).forEach((key) => {
      if (beforeObj[key] !== afterObj[key]) {
        changes[key] = {
          before: beforeObj[key],
          after: afterObj[key],
        };
      }
    });

    return changes;
  }

  /**
   * Validate that required fields are present
   */
  protected validateRequiredFields(
    data: Record<string, unknown>,
    requiredFields: string[]
  ): void {
    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      const errors: Record<string, string[]> = {};
      missingFields.forEach((field) => {
        errors[field] = [`${field} is required`];
      });
      throw ValidationError.fromFields(errors);
    }
  }

  /**
   * Validate field constraints (min/max length, format, etc.)
   */
  protected validateFieldConstraints(
    data: Record<string, unknown>,
    constraints: Record<string, FieldConstraint>
  ): void {
    const errors: Record<string, string[]> = {};

    Object.entries(constraints).forEach(([field, constraint]) => {
      const value = data[field];

      // Skip if field is not present (use validateRequiredFields for that)
      if (value === undefined || value === null) return;

      const fieldErrors: string[] = [];

      // Min length
      if (constraint.minLength && typeof value === 'string') {
        if (value.length < constraint.minLength) {
          fieldErrors.push(`Minimum length is ${constraint.minLength}`);
        }
      }

      // Max length
      if (constraint.maxLength && typeof value === 'string') {
        if (value.length > constraint.maxLength) {
          fieldErrors.push(`Maximum length is ${constraint.maxLength}`);
        }
      }

      // Min value
      if (constraint.min !== undefined && typeof value === 'number') {
        if (value < constraint.min) {
          fieldErrors.push(`Minimum value is ${constraint.min}`);
        }
      }

      // Max value
      if (constraint.max !== undefined && typeof value === 'number') {
        if (value > constraint.max) {
          fieldErrors.push(`Maximum value is ${constraint.max}`);
        }
      }

      // Pattern
      if (constraint.pattern && typeof value === 'string') {
        if (!constraint.pattern.test(value)) {
          fieldErrors.push(
            constraint.patternMessage || `Invalid format for ${field}`
          );
        }
      }

      // Custom validator
      if (constraint.validator) {
        const error = constraint.validator(value);
        if (error) {
          fieldErrors.push(error);
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    });

    if (Object.keys(errors).length > 0) {
      throw ValidationError.fromFields(errors);
    }
  }
}

/**
 * Field constraint interface
 */
export interface FieldConstraint {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  patternMessage?: string;
  validator?: (value: unknown) => string | null;
}

/**
 * Batch delete result interface
 */
export interface BatchDeleteResult {
  /**
   * IDs successfully deleted
   */
  successIds: string[];
  
  /**
   * IDs that failed to delete
   */
  failedIds: string[];
  
  /**
   * Error details for failed deletions
   */
  errors: BatchDeleteError[];
  
  /**
   * Total attempted
   */
  total: number;
  
  /**
   * Success count
   */
  successCount: number;
  
  /**
   * Failure count
   */
  failureCount: number;
}

/**
 * Batch delete error interface
 */
export interface BatchDeleteError {
  /**
   * ID that failed to delete
   */
  id: string;
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Original error object
   */
  error?: any;
}

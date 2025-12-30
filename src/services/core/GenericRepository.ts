/**
 * Generic Repository Pattern
 * Handles all database CRUD operations with tenant isolation and filtering
 * 
 * Usage:
 * ```typescript
 * const dealRepo = new GenericRepository('deals', supabaseClient, {
 *   tenantScoped: true,
 *   searchFields: ['title', 'description'],
 *   mapper: mapDealRow,
 * });
 * 
 * const deals = await dealRepo.findMany({ search: 'acme', status: 'open' });
 * ```
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  PaginatedResponse,
  QueryFilters,
  RepositoryConfig,
  createPaginatedResponse,
  extractQueryFilters,
} from '@/types/generic';
import {
  RepositoryError,
  NotFoundError,
  TenantIsolationError,
} from './errors';
import { getSupabaseClient } from '@/services/supabase/client';
import { serviceFactory } from '@/services/serviceFactory';

export class GenericRepository<
  T,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
  TRow = Record<string, unknown>
> {
  protected tableName: string;
  protected client: SupabaseClient;
  protected config: RepositoryConfig<T, TRow>;

  /**
   * Constructor supports two patterns:
   * 1. New pattern: super(config) - config includes tableName
   * 2. Legacy pattern: super(tableName, client, config)
   */
  constructor(
    tableNameOrConfig: string | RepositoryConfig<T, TRow>,
    client?: SupabaseClient,
    config?: RepositoryConfig<T, TRow>
  ) {
    // Determine which pattern is being used
    if (typeof tableNameOrConfig === 'string') {
      // Legacy pattern: (tableName, client, config)
      this.tableName = tableNameOrConfig;
      this.client = client!;
      this.config = {
        mapper: (config?.mapper as ((row: TRow) => T)) || ((row: TRow) => row as unknown as T),
        tenantScoped: true,
        softDelete: {
          enabled: true,
          field: 'deleted_at',
        },
        selectFields: '*',
        ...(config || {}),
      };
    } else {
      // New pattern: (config) - config has tableName
      const configObj = tableNameOrConfig as RepositoryConfig<T, TRow>;
      this.tableName = configObj.tableName || 'unknown_table';
      this.client = getSupabaseClient();
      
      // Normalize softDelete config - convert shorthand to full form if needed
      let softDeleteConfig = configObj.softDelete;
      if (configObj.softDeleteField && !softDeleteConfig) {
        softDeleteConfig = {
          enabled: true,
          field: configObj.softDeleteField,
        };
      }
      
      this.config = {
        mapper: (configObj.mapper as ((row: TRow) => T)) || ((row: TRow) => row as unknown as T),
        tenantScoped: true,
        softDelete: softDeleteConfig || {
          enabled: true,
          field: 'deleted_at',
        },
        selectFields: '*',
        ...configObj,
      };
    }
  }

  /**
   * Find many entities with filters and pagination
   */
  async findMany(filters?: QueryFilters): Promise<PaginatedResponse<T>> {
    try {
      const { pagination, sorting, search } = extractQueryFilters(filters);
      
      // Build query
      let query = this.client
        .from(this.tableName)
        .select(this.config.selectFields || '*', { count: 'exact' });

      // Apply tenant filter
      query = this.applyTenantFilter(query);

      // Apply soft delete filter
      query = this.applySoftDeleteFilter(query);

      // Apply search
      if (search && this.config.searchFields && this.config.searchFields.length > 0) {
        const searchConditions = this.config.searchFields
          .map((field) => `${field}.ilike.%${search}%`)
          .join(',');
        query = query.or(searchConditions);
      }

      // Apply standard filters
      query = this.applyStandardFilters(query, filters);

      // Apply custom filters
      query = this.applyCustomFilters(query, filters);

      // Apply sorting - convert camelCase field names to snake_case for database
      const sortFieldRaw = sorting.sortBy || this.config.defaultSort?.field || 'created_at';
      const sortField = this.camelToSnake(sortFieldRaw);
      const sortOrder = sorting.sortOrder || this.config.defaultSort?.order || 'desc';
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const offset = (pagination.page - 1) * pagination.pageSize;
      query = query.range(offset, offset + pagination.pageSize - 1);

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        throw new RepositoryError(
          `Failed to fetch ${this.tableName}`,
          error,
          { filters }
        );
      }

      // Map results
      const mappedData = (data || []).map((row) => this.config.mapper(row as TRow));

      return createPaginatedResponse(
        mappedData,
        count || 0,
        pagination.page,
        pagination.pageSize
      );
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(
        `Unexpected error fetching ${this.tableName}`,
        error
      );
    }
  }

  /**
   * Find single entity by ID
   */
  async findById(id: string): Promise<T> {
    try {
      let query = this.client
        .from(this.tableName)
        .select(this.config.selectFields || '*')
        .eq('id', id);

      // Apply tenant filter
      query = this.applyTenantFilter(query);

      // Apply soft delete filter
      query = this.applySoftDeleteFilter(query);

      const { data, error } = await query.single();

      if (error || !data) {
        throw new NotFoundError(this.tableName, id);
      }

      return this.config.mapper(data as TRow);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new RepositoryError(
        `Failed to fetch ${this.tableName} by ID`,
        error,
        { id }
      );
    }
  }

  /**
   * Create new entity
   */
  async create(data: TCreate): Promise<T> {
    try {
      // Prepare insert data
      const insertData: Record<string, unknown> = this.config.reverseMapper
        ? (this.config.reverseMapper(data as Partial<T>) as Record<string, unknown>)
        : (data as Record<string, unknown>);

      // Add tenant ID
      if (this.config.tenantScoped) {
        insertData.tenant_id = this.getTenantId();
      }

      // Add audit fields
      const userId = this.getUserId();
      insertData.created_by = userId;
      // Some tables (like customers) don't have updated_by column
      if (!this.config.readOnlyFields?.includes('updated_by')) {
        insertData.updated_by = userId;
      }

      // Execute insert
      const { data: result, error } = await this.client
        .from(this.tableName)
        .insert([insertData])
        .select(this.config.selectFields || '*')
        .single();

      if (error || !result) {
        throw new RepositoryError(
          `Failed to create ${this.tableName}`,
          error,
          { data: insertData }
        );
      }

      return this.config.mapper(result as TRow);
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(
        `Unexpected error creating ${this.tableName}`,
        error
      );
    }
  }

  /**
   * Update existing entity
   */
  async update(id: string, data: TUpdate): Promise<T> {
    try {
      // Verify entity exists
      await this.findById(id);

      // Prepare update data
      const updateData: Record<string, unknown> = this.config.reverseMapper
        ? (this.config.reverseMapper(data as Partial<T>) as Record<string, unknown>)
        : (data as Record<string, unknown>);

      // Remove read-only fields
      if (this.config.readOnlyFields) {
        this.config.readOnlyFields.forEach((field) => {
          delete updateData[field];
        });
      }

      // Add audit fields (only if they exist in the table)
      // Note: Some tables (like customers) don't have updated_by column
      if (!this.config.readOnlyFields?.includes('updated_by')) {
        updateData.updated_by = this.getUserId();
      }
      updateData.updated_at = new Date().toISOString();

      // Build query
      let query = this.client
        .from(this.tableName)
        .update(updateData)
        .eq('id', id);

      // Apply tenant filter
      query = this.applyTenantFilter(query);

      // Execute update
      const { data: result, error } = await query
        .select(this.config.selectFields || '*')
        .single();

      if (error || !result) {
        throw new RepositoryError(
          `Failed to update ${this.tableName}`,
          error,
          { id, data: updateData }
        );
      }

      return this.config.mapper(result as TRow);
    } catch (error) {
      if (error instanceof RepositoryError || error instanceof NotFoundError) {
        throw error;
      }
      throw new RepositoryError(
        `Unexpected error updating ${this.tableName}`,
        error
      );
    }
  }

  /**
   * Delete entity (soft or hard delete)
   */
  async delete(id: string): Promise<void> {
    try {
      // Verify entity exists
      await this.findById(id);

      if (this.config.softDelete?.enabled) {
        // Soft delete
        const updateData: Record<string, unknown> = {
          [this.config.softDelete.field]: new Date().toISOString(),
        };
        // Add updated_by only if table supports it
        if (!this.config.readOnlyFields?.includes('updated_by')) {
          updateData.updated_by = this.getUserId();
        }

        let query = this.client
          .from(this.tableName)
          .update(updateData)
          .eq('id', id);

        query = this.applyTenantFilter(query);

        const { error } = await query;

        if (error) {
          throw new RepositoryError(
            `Failed to soft delete ${this.tableName}`,
            error,
            { id }
          );
        }
      } else {
        // Hard delete
        let query = this.client
          .from(this.tableName)
          .delete()
          .eq('id', id);

        query = this.applyTenantFilter(query);

        const { error } = await query;

        if (error) {
          throw new RepositoryError(
            `Failed to delete ${this.tableName}`,
            error,
            { id }
          );
        }
      }
    } catch (error) {
      if (error instanceof RepositoryError || error instanceof NotFoundError) {
        throw error;
      }
      throw new RepositoryError(
        `Unexpected error deleting ${this.tableName}`,
        error
      );
    }
  }

  /**
   * Count entities matching filters
   */
  async count(filters?: QueryFilters): Promise<number> {
    try {
      let query = this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      query = this.applyTenantFilter(query);
      query = this.applySoftDeleteFilter(query);
      query = this.applyStandardFilters(query, filters);
      query = this.applyCustomFilters(query, filters);

      const { count, error } = await query;

      if (error) {
        throw new RepositoryError(
          `Failed to count ${this.tableName}`,
          error
        );
      }

      return count || 0;
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(
        `Unexpected error counting ${this.tableName}`,
        error
      );
    }
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      await this.findById(id);
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  // Protected helper methods

  protected applyTenantFilter(query: any): any {
    if (this.config.tenantScoped) {
      const tenantId = this.getTenantId();
      if (tenantId) {
        return query.eq('tenant_id', tenantId);
      }
    }
    return query;
  }

  protected applySoftDeleteFilter(query: any): any {
    if (this.config.softDelete?.enabled) {
      return query.is(this.config.softDelete.field, null);
    }
    return query;
  }

  protected applyStandardFilters(query: any, filters?: QueryFilters): any {
    if (!filters) return query;

    // Status filter (case-insensitive)
    if (filters.status) {
      query = query.ilike('status', filters.status);
    }

    // Date range filters
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // User filters
    if (filters.createdBy) {
      query = query.eq('created_by', filters.createdBy);
    }
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    return query;
  }

  protected applyCustomFilters(query: any, filters?: QueryFilters): any {
    if (!filters || !this.config.filterHandlers) return query;

    Object.entries(this.config.filterHandlers).forEach(([key, handler]) => {
      if (filters[key] !== undefined) {
        query = handler(query, filters[key]);
      }
    });

    return query;
  }

  protected getTenantId(): string {
    // Get tenant from current auth service
    const authService = serviceFactory.getService('auth');
    const user = authService.getCurrentUser();
    if (!user?.tenantId) {
      throw new TenantIsolationError(
        'No tenant context available',
        'unknown'
      );
    }
    return user.tenantId;
  }

  protected getUserId(): string {
    // Get user from current auth service
    const authService = serviceFactory.getService('auth');
    const user = authService.getCurrentUser();
    if (!user?.id) {
      throw new Error('No user context available');
    }
    return user.id;
  }

  /**
   * Helper: Convert camelCase to snake_case for database field names
   */
  protected camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`).toLowerCase();
  }

  /**
   * Custom query builder for complex operations
   * Subclasses can override this for special cases
   */
  protected buildCustomQuery(filters?: QueryFilters): any {
    return this.client
      .from(this.tableName)
      .select(this.config.selectFields || '*');
  }
}

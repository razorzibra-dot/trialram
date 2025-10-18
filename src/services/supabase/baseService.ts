/**
 * Base Supabase Service Class
 * Provides common functionality for all Supabase services:
 * - CRUD operations
 * - Real-time subscriptions
 * - Pagination and filtering
 * - Error handling and logging
 * - Data transformation
 */

import { SupabaseClient, PostgrestFilterBuilder } from '@supabase/supabase-js';
import { getSupabaseClient } from './client';

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}

export interface QueryOptions {
  filters?: Record<string, any>;
  sort?: { field: string; ascending?: boolean }[];
  pagination?: PaginationOptions;
  select?: string;
}

export interface SubscriptionOptions {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  table: string;
  filter?: string;
}

/**
 * Base service class for all Supabase services
 * Extends this class to inherit common Supabase functionality
 */
export abstract class BaseSupabaseService {
  protected client: SupabaseClient;
  protected tableName: string;
  protected logEnabled: boolean;

  constructor(tableName: string, logEnabled: boolean = true) {
    this.client = getSupabaseClient();
    this.tableName = tableName;
    this.logEnabled = logEnabled;
  }

  /**
   * Log messages with service prefix
   */
  protected log(message: string, data?: any): void {
    if (!this.logEnabled) return;
    
    const prefix = `[${this.tableName}]`;
    if (data) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  }

  /**
   * Log errors with service prefix
   */
  protected logError(message: string, error?: any): void {
    const prefix = `[${this.tableName}]`;
    console.error(prefix, message, error);
  }

  /**
   * Create a new record
   */
  async create<T>(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    try {
      this.log('Creating record', data);

      const { data: result, error } = await this.client
        .from(this.tableName)
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      this.log('Record created', result);
      return result;
    } catch (error) {
      this.logError('Error creating record', error);
      throw error;
    }
  }

  /**
   * Create multiple records
   */
  async createBatch<T>(items: Omit<T, 'id' | 'created_at' | 'updated_at'>[]): Promise<T[]> {
    try {
      this.log('Creating batch', { count: items.length });

      const { data: result, error } = await this.client
        .from(this.tableName)
        .insert(items)
        .select();

      if (error) throw error;

      this.log('Batch created', { count: result?.length });
      return result || [];
    } catch (error) {
      this.logError('Error creating batch', error);
      throw error;
    }
  }

  /**
   * Read a single record by ID
   */
  async getById<T>(id: string | number): Promise<T | null> {
    try {
      this.log('Fetching record', { id });

      const { data, error } = await this.client
        .from(this.tableName)
        .select()
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      this.logError('Error fetching record', error);
      throw error;
    }
  }

  /**
   * Read all records with optional filtering and pagination
   */
  async getAll<T>(options?: QueryOptions): Promise<T[]> {
    try {
      this.log('Fetching all records', options);

      let query = this.client.from(this.tableName).select(options?.select || '*');

      // Apply filters
      if (options?.filters) {
        for (const [field, value] of Object.entries(options.filters)) {
          if (Array.isArray(value)) {
            query = query.in(field, value);
          } else {
            query = query.eq(field, value);
          }
        }
      }

      // Apply sorting
      if (options?.sort && options.sort.length > 0) {
        for (const sort of options.sort) {
          query = query.order(sort.field, { ascending: sort.ascending !== false });
        }
      }

      // Apply pagination
      if (options?.pagination) {
        const { page, pageSize, offset, limit } = options.pagination;
        const pageNum = page || 0;
        const size = pageSize || limit || 10;
        const start = offset || pageNum * size;

        query = query.range(start, start + size - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      this.log('Records fetched', { count: data?.length });
      return data || [];
    } catch (error) {
      this.logError('Error fetching records', error);
      throw error;
    }
  }

  /**
   * Update a record
   */
  async update<T>(id: string | number, updates: Partial<T>): Promise<T> {
    try {
      this.log('Updating record', { id, updates });

      const { data, error } = await this.client
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      this.log('Record updated', data);
      return data;
    } catch (error) {
      this.logError('Error updating record', error);
      throw error;
    }
  }

  /**
   * Update multiple records
   */
  async updateBatch<T>(
    ids: (string | number)[],
    updates: Partial<T>
  ): Promise<T[]> {
    try {
      this.log('Updating batch', { ids, updates });

      const { data, error } = await this.client
        .from(this.tableName)
        .update(updates)
        .in('id', ids)
        .select();

      if (error) throw error;

      this.log('Batch updated', { count: data?.length });
      return data || [];
    } catch (error) {
      this.logError('Error updating batch', error);
      throw error;
    }
  }

  /**
   * Delete a record (soft delete by default)
   */
  async delete(id: string | number, softDelete: boolean = true): Promise<void> {
    try {
      this.log('Deleting record', { id, softDelete });

      if (softDelete) {
        // Soft delete - mark as deleted
        await this.update(id, { deleted_at: new Date().toISOString() } as any);
      } else {
        // Hard delete - permanently remove
        const { error } = await this.client
          .from(this.tableName)
          .delete()
          .eq('id', id);

        if (error) throw error;
      }

      this.log('Record deleted', { id });
    } catch (error) {
      this.logError('Error deleting record', error);
      throw error;
    }
  }

  /**
   * Delete multiple records
   */
  async deleteBatch(ids: (string | number)[], softDelete: boolean = true): Promise<void> {
    try {
      this.log('Deleting batch', { ids, softDelete });

      if (softDelete) {
        await this.updateBatch(ids, { deleted_at: new Date().toISOString() } as any);
      } else {
        const { error } = await this.client
          .from(this.tableName)
          .delete()
          .in('id', ids);

        if (error) throw error;
      }

      this.log('Batch deleted', { count: ids.length });
    } catch (error) {
      this.logError('Error deleting batch', error);
      throw error;
    }
  }

  /**
   * Get count of records with optional filtering
   */
  async getCount(filters?: Record<string, any>): Promise<number> {
    try {
      let query = this.client.from(this.tableName).select('*', { count: 'exact', head: true });

      if (filters) {
        for (const [field, value] of Object.entries(filters)) {
          query = query.eq(field, value);
        }
      }

      const { count, error } = await query;

      if (error) throw error;

      return count || 0;
    } catch (error) {
      this.logError('Error getting count', error);
      throw error;
    }
  }

  /**
   * Search records by multiple fields
   */
  async search<T>(
    searchTerm: string,
    searchFields: string[],
    options?: QueryOptions
  ): Promise<T[]> {
    try {
      this.log('Searching records', { searchTerm, searchFields });

      let query = this.client
        .from(this.tableName)
        .select(options?.select || '*');

      // Use full-text search or ILIKE for pattern matching
      const filters = searchFields
        .map((field) => `${field}.ilike.%${searchTerm}%`)
        .join(',');

      query = query.or(filters);

      // Apply additional options
      if (options?.filters) {
        for (const [field, value] of Object.entries(options.filters)) {
          query = query.eq(field, value);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      this.log('Search completed', { count: data?.length });
      return data || [];
    } catch (error) {
      this.logError('Error searching records', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time changes
   */
  subscribeToChanges<T>(
    options: SubscriptionOptions,
    callback: (payload: any) => void
  ): () => void {
    try {
      this.log('Subscribing to changes', options);

      const channel = this.client
        .channel(`public:${options.table}`)
        .on(
          'postgres_changes',
          {
            event: options.event,
            schema: options.schema || 'public',
            table: options.table,
            filter: options.filter,
          },
          (payload) => {
            this.log('Change received', payload);
            callback(payload);
          }
        )
        .subscribe();

      // Return unsubscribe function
      return () => {
        this.log('Unsubscribing from changes', options);
        this.client.removeChannel(channel);
      };
    } catch (error) {
      this.logError('Error subscribing to changes', error);
      throw error;
    }
  }

  /**
   * Execute raw SQL query (for complex operations)
   */
  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    try {
      this.log('Executing query', { sql });

      const { data, error } = await this.client.rpc('query', { sql, params });

      if (error) throw error;

      return data || [];
    } catch (error) {
      this.logError('Error executing query', error);
      throw error;
    }
  }

  /**
   * Begin transaction (for multiple operations)
   */
  async transaction<T>(callback: (client: SupabaseClient) => Promise<T>): Promise<T> {
    try {
      this.log('Starting transaction');
      const result = await callback(this.client);
      this.log('Transaction completed');
      return result;
    } catch (error) {
      this.logError('Transaction failed', error);
      throw error;
    }
  }
}

export default BaseSupabaseService;
/**
 * Query Builders for Supabase Operations
 * Provides common query patterns with type safety
 */

import type { PostgrestQueryBuilder, PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { multiTenantService } from './multiTenantService';

/**
 * Add tenant filter to any query
 */
export function addTenantFilter<T extends PostgrestFilterBuilder<any, any, any>>(
  query: T,
  tenantId?: string
): T {
  const id = tenantId || multiTenantService.getCurrentTenantId();
  return query.eq('tenant_id', id) as T;
}

/**
 * Apply pagination to query
 */
export function applyPagination<T extends PostgrestFilterBuilder<any, any, any>>(
  query: T,
  page: number = 1,
  pageSize: number = 10
): T {
  const offset = (page - 1) * pageSize;
  return query.range(offset, offset + pageSize - 1) as T;
}

/**
 * Apply sorting to query
 */
export function applySorting<T extends PostgrestFilterBuilder<any, any, any>>(
  query: T,
  sortBy: string,
  ascending: boolean = true
): T {
  return query.order(sortBy, { ascending }) as T;
}

/**
 * Build service contracts query
 */
export function buildServiceContractQuery(
  query: PostgrestFilterBuilder<any, any, any>,
  filters?: {
    status?: string;
    customerName?: string;
    serviceLevel?: string;
    expiryFrom?: string;
    expiryTo?: string;
  }
) {
  let q = query;

  if (filters?.status) {
    q = q.eq('status', filters.status) as any;
  }

  if (filters?.customerName) {
    q = q.ilike('customer_name', `%${filters.customerName}%`) as any;
  }

  if (filters?.serviceLevel) {
    q = q.eq('service_level', filters.serviceLevel) as any;
  }

  if (filters?.expiryFrom) {
    q = q.gte('end_date', filters.expiryFrom) as any;
  }

  if (filters?.expiryTo) {
    q = q.lte('end_date', filters.expiryTo) as any;
  }

  return q;
}

/**
 * Build product sales query
 */
export function buildProductSalesQuery(
  query: PostgrestFilterBuilder<any, any, any>,
  filters?: {
    status?: string;
    customerName?: string;
    productName?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) {
  let q = query;

  if (filters?.status) {
    q = q.eq('status', filters.status) as any;
  }

  if (filters?.customerName) {
    q = q.ilike('customer_name', `%${filters.customerName}%`) as any;
  }

  if (filters?.productName) {
    q = q.ilike('product_name', `%${filters.productName}%`) as any;
  }

  if (filters?.dateFrom) {
    q = q.gte('delivery_date', filters.dateFrom) as any;
  }

  if (filters?.dateTo) {
    q = q.lte('delivery_date', filters.dateTo) as any;
  }

  return q;
}

/**
 * Build customer query
 */
export function buildCustomerQuery(
  query: PostgrestFilterBuilder<any, any, any>,
  filters?: {
    name?: string;
    industry?: string;
    status?: string;
  }
) {
  let q = query;

  if (filters?.name) {
    q = q.ilike('name', `%${filters.name}%`) as any;
  }

  if (filters?.industry) {
    q = q.eq('industry', filters.industry) as any;
  }

  if (filters?.status) {
    q = q.eq('status', filters.status) as any;
  }

  return q;
}

/**
 * Handle database error and return user-friendly message
 */
export function handleSupabaseError(error: any): string {
  if (!error) return 'Unknown error occurred';
  
  if (typeof error === 'string') return error;
  
  if (error.message) {
    // Handle specific error messages
    if (error.message.includes('duplicate')) {
      return 'This record already exists';
    }
    if (error.message.includes('not found')) {
      return 'Record not found';
    }
    if (error.message.includes('permission')) {
      return 'You do not have permission to perform this action';
    }
    return error.message;
  }
  
  return 'An error occurred while processing your request';
}

/**
 * Retry logic for failed queries
 */
export async function retryQuery<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry for specific errors
      if (error instanceof Error && error.message.includes('permission')) {
        throw error;
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError || new Error('Query failed after retries');
}

/**
 * Build real-time subscription filter
 */
export function buildRealtimeFilter(
  table: string,
  tenantId?: string
): {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  filter: string;
} {
  const id = tenantId || multiTenantService.getCurrentTenantId();

  return {
    event: '*',
    schema: 'public',
    table,
    filter: `tenant_id=eq.${id}`,
  };
}

/**
 * Count records query
 */
export async function countRecords(
  table: string,
  tenantId?: string
): Promise<number> {
  const { supabaseClient } = await import('./client');
  const id = tenantId || multiTenantService.getCurrentTenantId();

  const { count, error } = await supabaseClient
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', id);

  if (error) {
    throw new Error(`Failed to count records: ${error.message}`);
  }

  return count || 0;
}

/**
 * Search records across multiple fields
 */
export function buildSearchQuery(
  query: PostgrestFilterBuilder<any, any, any>,
  searchTerm: string,
  fields: string[]
): PostgrestFilterBuilder<any, any, any> {
  if (!searchTerm) return query;

  // Build OR condition for multiple fields
  const searchFilters = fields
    .map(field => `${field}.ilike.%${searchTerm}%`)
    .join(',');

  return query.or(searchFilters) as any;
}
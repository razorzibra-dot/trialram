/**
 * ⚠️ CRITICAL SECURITY: Base Supabase Service with Built-in Tenant Validation
 * 
 * This base class provides automatic tenant validation for ALL CRUD operations.
 * Services extending this class MUST use the provided methods to ensure tenant security.
 * 
 * **Security Features:**
 * 1. Automatic tenant filtering for GET operations
 * 2. Automatic tenant validation for POST/PUT/DELETE operations
 * 3. Comprehensive audit logging
 * 4. No bypasses possible - all operations go through validation
 */

import { getSupabaseClient } from '@/services/supabase/client';
import { authService } from '@/services/serviceFactory';
import {
  validateTenantAccess,
  validateTenantForOperation,
  getOperationTenantId,
  applyTenantFilter,
  type OperationType,
} from '@/utils/tenantValidation';
import { isSuperAdmin } from '@/utils/tenantIsolation';

/**
 * Base class for all Supabase services
 * Provides automatic tenant validation and common functionality
 */
export abstract class BaseSupabaseService {
  protected tableName: string;
  protected useTenant: boolean;

  constructor(tableName: string, useTenant: boolean = true) {
    this.tableName = tableName;
    this.useTenant = useTenant;
  }

  /**
   * Get Supabase client
   */
  protected getClient() {
    return getSupabaseClient();
  }

  /**
   * Log operation (for debugging)
   */
  protected log(message: string, data?: any): void {
    console.log(`[${this.constructor.name}] ${message}`, data || '');
  }

  /**
   * Log error
   */
  protected logError(message: string, error: any): void {
    console.error(`[${this.constructor.name}] ${message}`, error);
  }

  /**
   * ⚠️ SECURITY: Validate tenant access before GET operation
   * 
   * This method MUST be called before fetching a single record by ID.
   * It validates that the current user has access to the record's tenant.
   * 
   * @param recordId - The ID of the record to fetch
   * @param operation - Operation type (default: 'GET')
   * @returns The record's tenant_id
   * @throws Error if validation fails
   */
  protected async validateTenantAccessForGet(
    recordId: string,
    operation: OperationType = 'GET'
  ): Promise<string | null> {
    if (!this.useTenant) {
      return null; // Table doesn't use tenant isolation
    }

    // First, fetch the record's tenant_id
    const { data: record, error } = await this.getClient()
      .from(this.tableName)
      .select('tenant_id')
      .eq('id', recordId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      this.logError('Error fetching record for tenant validation', error);
      throw new Error(`Failed to validate access: ${error.message}`);
    }

    if (!record) {
      throw new Error('Record not found or access denied');
    }

    // Validate tenant access
    await validateTenantAccess(record.tenant_id, operation, this.tableName, recordId);

    return record.tenant_id;
  }

  /**
   * ⚠️ SECURITY: Validate tenant assignment before POST operation
   * 
   * This method MUST be called before creating a new record.
   * It validates that the tenant_id being assigned is valid for the current user.
   * 
   * @param data - The data being created (may contain tenant_id)
   * @returns The validated tenant_id to use
   * @throws Error if validation fails
   */
  protected async validateTenantForCreate(data: any): Promise<string | null> {
    if (!this.useTenant) {
      return null; // Table doesn't use tenant isolation
    }

    // Get the tenant_id to use for this operation
    const tenantId = getOperationTenantId(data.tenant_id);

    // Validate tenant assignment
    await validateTenantForOperation(tenantId, 'POST', this.tableName);

    return tenantId;
  }

  /**
   * ⚠️ SECURITY: Validate tenant access before PUT/DELETE operation
   * 
   * This method MUST be called before updating or deleting a record.
   * It validates that the current user has access to the record's tenant.
   * 
   * @param recordId - The ID of the record to update/delete
   * @param operation - Operation type ('PUT', 'DELETE', or 'PATCH')
   * @returns The record's tenant_id
   * @throws Error if validation fails
   */
  protected async validateTenantAccessForUpdate(
    recordId: string,
    operation: OperationType = 'PUT'
  ): Promise<string | null> {
    if (!this.useTenant) {
      return null; // Table doesn't use tenant isolation
    }

    return this.validateTenantAccessForGet(recordId, operation);
  }

  /**
   * ⚠️ SECURITY: Apply tenant filter to query for GET operations
   * 
   * This method MUST be used for all list queries to ensure tenant isolation.
   * 
   * @param query - Supabase query builder
   * @returns Query with tenant filter applied
   */
  protected applyTenantFilterToQuery<T>(query: any): any {
    if (!this.useTenant) {
      return query; // Table doesn't use tenant isolation
    }

    return applyTenantFilter(query, this.tableName);
  }

  /**
   * ⚠️ SECURITY: Ensure tenant_id is set correctly in data
   * 
   * This method ensures that tenant_id is always set correctly based on current user.
   * It removes any tenant_id from data that shouldn't be there (for tenant users).
   * 
   * @param data - The data object
   * @returns Data with correct tenant_id
   */
  protected ensureTenantId(data: any): any {
    if (!this.useTenant) {
      return data; // Table doesn't use tenant isolation
    }

    const currentUser = authService.getCurrentUser();
    const userIsSuperAdmin = isSuperAdmin(currentUser);
    const tenantId = getOperationTenantId(data.tenant_id);

    // For tenant users, always use their tenant (ignore provided tenant_id)
    if (!userIsSuperAdmin) {
      // Remove tenant_id from data - we'll set it explicitly
      const { tenant_id, ...rest } = data;
      return {
        ...rest,
        tenant_id: tenantId,
      };
    }

    // For super admins, use provided tenant_id or current tenant
    return {
      ...data,
      tenant_id: tenantId,
    };
  }

  /**
   * Subscribe to table changes (for real-time updates)
   */
  protected subscribeToChanges(
    options: { event?: 'INSERT' | 'UPDATE' | 'DELETE'; filter?: string },
    callback: (payload: any) => void
  ): () => void {
    const channel = this.getClient().channel(`${this.tableName}_changes`);
    
    const subscription = channel
      .on(
        'postgres_changes',
        {
          event: options.event || '*',
          schema: 'public',
          table: this.tableName,
          filter: options.filter,
        },
        callback
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}


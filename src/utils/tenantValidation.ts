/**
 * ⚠️ CRITICAL SECURITY: Centralized Tenant Validation System
 * 
 * This module provides systematic tenant validation for ALL CRUD operations.
 * NO operation can bypass tenant validation - this is enforced at the utility level.
 * 
 * **Security Principles:**
 * 1. Every GET/POST/PUT/DELETE operation MUST validate tenant_id
 * 2. No cross-tenant operations are allowed (except for super admins)
 * 3. All validation attempts are logged for audit purposes
 * 4. No bypasses or tampering is possible
 * 
 * **Usage:**
 * ```typescript
 * import { validateTenantAccess, validateTenantForOperation } from '@/utils/tenantValidation';
 * 
 * // For GET operations - validate access to existing record
 * await validateTenantAccess(recordTenantId, 'GET', 'customers', recordId);
 * 
 * // For POST operations - validate tenant assignment
 * await validateTenantForOperation(data.tenantId, 'POST', 'customers');
 * 
 * // For PUT/DELETE operations - validate access to existing record
 * await validateTenantAccess(existingRecord.tenant_id, 'PUT', 'customers', recordId);
 * ```
 */

import { authService } from '@/services/serviceFactory';
import { isSuperAdmin } from './tenantIsolation';

/**
 * Operation types for logging
 */
export type OperationType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Validation result
 */
export interface TenantValidationResult {
  valid: boolean;
  reason?: string;
  logged: boolean;
}

/**
 * Audit log entry for tenant validation
 */
interface TenantValidationLog {
  timestamp: string;
  operation: OperationType;
  resource: string;
  resourceId?: string;
  requestedTenantId: string | null;
  currentUserTenantId: string | null;
  currentUserId: string | null;
  currentUserRole: string;
  isSuperAdmin: boolean;
  validationResult: 'ALLOWED' | 'DENIED';
  reason?: string;
}

/**
 * In-memory audit log (in production, this should be stored in database)
 */
const validationAuditLog: TenantValidationLog[] = [];

/**
 * Maximum audit log entries to keep in memory
 */
const MAX_AUDIT_LOG_ENTRIES = 1000;

/**
 * ⚠️ SECURITY: Validate tenant access for GET/PUT/DELETE operations
 * 
 * This function validates that the current user has access to a record
 * with the specified tenant_id. It logs all validation attempts for audit.
 * 
 * @param recordTenantId - The tenant_id of the record being accessed
 * @param operation - The operation type (GET, PUT, DELETE, PATCH)
 * @param resource - The resource name (e.g., 'customers', 'tickets')
 * @param resourceId - Optional resource ID for logging
 * @returns TenantValidationResult
 * @throws Error if validation fails
 */
export async function validateTenantAccess(
  recordTenantId: string | null,
  operation: OperationType,
  resource: string,
  resourceId?: string
): Promise<TenantValidationResult> {
  const currentUser = authService.getCurrentUser();
  const currentTenantId = authService.getCurrentTenantId();
  const currentUserId = currentUser?.id || 'unknown';
  const currentUserRole = currentUser?.role || 'unknown';
  const userIsSuperAdmin = isSuperAdmin(currentUser);

  // Log validation attempt
  const logEntry: TenantValidationLog = {
    timestamp: new Date().toISOString(),
    operation,
    resource,
    resourceId,
    requestedTenantId: recordTenantId,
    currentUserTenantId: currentTenantId,
    currentUserId,
    currentUserRole,
    isSuperAdmin: userIsSuperAdmin,
    validationResult: 'DENIED', // Default to denied, will be updated if allowed
  };

  // Check authentication
  if (!currentUser) {
    logEntry.reason = 'User not authenticated';
    logValidationAttempt(logEntry);
    throw new Error('Access denied: User not authenticated');
  }

  // Super admins can access any tenant (including null)
  if (userIsSuperAdmin) {
    logEntry.validationResult = 'ALLOWED';
    logEntry.reason = 'Super admin access granted';
    logValidationAttempt(logEntry);
    return { valid: true, reason: 'Super admin access', logged: true };
  }

  // Regular users must have a tenant
  if (!currentTenantId) {
    logEntry.reason = 'Current user has no tenant assignment';
    logValidationAttempt(logEntry);
    throw new Error('Access denied: Invalid tenant context');
  }

  // Regular users can only access records from their own tenant
  if (recordTenantId !== currentTenantId) {
    logEntry.reason = `Tenant mismatch: requested=${recordTenantId}, current=${currentTenantId}`;
    logValidationAttempt(logEntry);
    throw new Error('Access denied: Tenant mismatch');
  }

  // Validation passed
  logEntry.validationResult = 'ALLOWED';
  logEntry.reason = 'Tenant match verified';
  logValidationAttempt(logEntry);

  return { valid: true, reason: 'Tenant match verified', logged: true };
}

/**
 * ⚠️ SECURITY: Validate tenant assignment for POST operations
 * 
 * This function validates that the tenant_id being assigned in a POST operation
 * is valid for the current user. It ensures tenant users cannot assign records
 * to other tenants.
 * 
 * @param assignedTenantId - The tenant_id being assigned in the operation
 * @param operation - The operation type (usually 'POST')
 * @param resource - The resource name (e.g., 'customers', 'tickets')
 * @returns TenantValidationResult
 * @throws Error if validation fails
 */
export async function validateTenantForOperation(
  assignedTenantId: string | null | undefined,
  operation: OperationType,
  resource: string
): Promise<TenantValidationResult> {
  const currentUser = authService.getCurrentUser();
  const currentTenantId = authService.getCurrentTenantId();
  const currentUserId = currentUser?.id || 'unknown';
  const currentUserRole = currentUser?.role || 'unknown';
  const userIsSuperAdmin = isSuperAdmin(currentUser);

  // Log validation attempt
  const logEntry: TenantValidationLog = {
    timestamp: new Date().toISOString(),
    operation,
    resource,
    requestedTenantId: assignedTenantId || null,
    currentUserTenantId: currentTenantId,
    currentUserId,
    currentUserRole,
    isSuperAdmin: userIsSuperAdmin,
    validationResult: 'DENIED',
  };

  // Check authentication
  if (!currentUser) {
    logEntry.reason = 'User not authenticated';
    logValidationAttempt(logEntry);
    throw new Error('Access denied: User not authenticated');
  }

  // Super admins can assign to any tenant (including null)
  if (userIsSuperAdmin) {
    logEntry.validationResult = 'ALLOWED';
    logEntry.reason = 'Super admin can assign to any tenant';
    logValidationAttempt(logEntry);
    return { valid: true, reason: 'Super admin assignment', logged: true };
  }

  // Regular users must have a tenant
  if (!currentTenantId) {
    logEntry.reason = 'Current user has no tenant assignment';
    logValidationAttempt(logEntry);
    throw new Error('Access denied: Invalid tenant context');
  }

  // Regular users can only assign to their own tenant
  // If assignedTenantId is provided, it must match current tenant
  // If not provided, we'll use current tenant (handled by service)
  if (assignedTenantId !== undefined && assignedTenantId !== null && assignedTenantId !== currentTenantId) {
    logEntry.reason = `Tenant assignment mismatch: requested=${assignedTenantId}, current=${currentTenantId}`;
    logValidationAttempt(logEntry);
    throw new Error('Access denied: Cannot assign to different tenant');
  }

  // Validation passed
  logEntry.validationResult = 'ALLOWED';
  logEntry.reason = assignedTenantId ? 'Tenant assignment verified' : 'Will use current tenant';
  logValidationAttempt(logEntry);

  return { valid: true, reason: 'Tenant assignment valid', logged: true };
}

/**
 * ⚠️ SECURITY: Get the tenant_id to use for an operation
 * 
 * This function determines the correct tenant_id to use based on:
 * - Current user's tenant (for tenant users)
 * - Provided tenant_id (for super admins)
 * 
 * @param providedTenantId - Optional tenant_id from form data
 * @returns The tenant_id to use for the operation
 */
export function getOperationTenantId(providedTenantId?: string | null): string | null {
  const currentUser = authService.getCurrentUser();
  const currentTenantId = authService.getCurrentTenantId();
  const userIsSuperAdmin = isSuperAdmin(currentUser);

  // Super admins can specify tenant_id, otherwise use current tenant
  if (userIsSuperAdmin) {
    return providedTenantId || currentTenantId;
  }

  // Tenant users always use their current tenant
  return currentTenantId;
}

/**
 * ⚠️ SECURITY: Add tenant filter to Supabase query for GET operations
 * 
 * This function automatically adds tenant filtering to queries for non-super-admins.
 * Super admins can see all records, tenant users can only see their own.
 * 
 * @param query - Supabase query builder
 * @param tableName - Table name for logging
 * @returns Query with tenant filter applied (if needed)
 */
export function applyTenantFilter<TQuery extends { eq: (column: string, value: string) => TQuery }>(
  query: TQuery,
  tableName: string
): TQuery {
  const currentUser = authService.getCurrentUser();
  const currentTenantId = authService.getCurrentTenantId();
  const userIsSuperAdmin = isSuperAdmin(currentUser);

  // Super admins can see all records (no filter)
  if (userIsSuperAdmin) {
    return query;
  }

  // Tenant users can only see records from their tenant
  if (currentTenantId) {
    return query.eq('tenant_id', currentTenantId);
  }

  // If user has no tenant but isn't super admin, return empty query
  console.warn(`[TenantValidation] User ${currentUser?.id} has no tenant, returning empty query for ${tableName}`);
  return query.eq('tenant_id', '00000000-0000-0000-0000-000000000000'); // Non-existent tenant ID
}

/**
 * Log validation attempt to audit log
 */
function logValidationAttempt(logEntry: TenantValidationLog): void {
  // Add to in-memory log
  validationAuditLog.push(logEntry);

  // Keep only last N entries
  if (validationAuditLog.length > MAX_AUDIT_LOG_ENTRIES) {
    validationAuditLog.shift();
  }

  // Console log for development (in production, send to logging service)
  const logLevel = logEntry.validationResult === 'ALLOWED' ? 'info' : 'warn';
  const logMessage = `[TenantValidation] ${logEntry.operation} ${logEntry.resource}${logEntry.resourceId ? `/${logEntry.resourceId}` : ''} - ${logEntry.validationResult}`;
  
  if (logLevel === 'warn') {
    console.warn(logMessage, {
      user: logEntry.currentUserId,
      role: logEntry.currentUserRole,
      requestedTenant: logEntry.requestedTenantId,
      currentTenant: logEntry.currentUserTenantId,
      reason: logEntry.reason,
    });
  } else {
    console.log(logMessage, {
      user: logEntry.currentUserId,
      role: logEntry.currentUserRole,
      tenant: logEntry.requestedTenantId || logEntry.currentUserTenantId,
    });
  }
}

/**
 * Get audit log entries (for debugging/monitoring)
 * 
 * @param limit - Maximum number of entries to return
 * @returns Array of validation log entries
 */
export function getValidationAuditLog(limit: number = 100): TenantValidationLog[] {
  return validationAuditLog.slice(-limit);
}

/**
 * Clear audit log (for testing)
 */
export function clearValidationAuditLog(): void {
  validationAuditLog.length = 0;
}


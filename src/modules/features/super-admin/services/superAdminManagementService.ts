/**
 * Super Admin Management Service - Module Service Interface
 * Orchestrates super admin lifecycle operations
 * ✅ Uses factory pattern for multi-backend support
 * ✅ Full layer synchronization (Types → Mock → Supabase → Factory → Hooks → UI)
 */

import {
  SuperAdminDTO,
  CreateSuperAdminInput,
  PromoteSuperAdminInput,
  SuperAdminTenantAccess,
  GrantTenantAccessInput,
  RevokeTenantAccessInput,
  SuperAdminStatsDTO,
  SuperAdminActionLog
} from '../types/superAdminManagement';

/**
 * Super Admin Management Service Interface
 * Provides methods for creating, managing, and monitoring super administrators
 */
export interface ISuperAdminManagementService {
  /**
   * Create a new super administrator user
   * @param data - Super admin creation input
   * @returns Created super admin DTO
   * @throws Error if email already exists or validation fails
   */
  createSuperAdmin(data: CreateSuperAdminInput): Promise<SuperAdminDTO>;

  /**
   * Promote an existing user to super admin
   * @param data - Promotion input with user ID
   * @returns Promoted user as SuperAdminDTO
   * @throws Error if user not found or already super admin
   */
  promoteSuperAdmin(data: PromoteSuperAdminInput): Promise<SuperAdminDTO>;

  /**
   * Get super administrator by ID
   * @param superAdminId - Super admin user ID
   * @returns Super admin user DTO or null if not found
   */
  getSuperAdmin(superAdminId: string): Promise<SuperAdminDTO | null>;

  /**
   * Get all super administrators
   * @returns List of all super admins
   */
  getAllSuperAdmins(): Promise<SuperAdminDTO[]>;

  /**
   * Grant super admin access to a specific tenant
   * @param data - Grant access input
   * @returns Created tenant access record
   * @throws Error if user not super admin or tenant not found
   */
  grantTenantAccess(data: GrantTenantAccessInput): Promise<SuperAdminTenantAccess>;

  /**
   * Revoke super admin access from a specific tenant
   * @param data - Revoke access input
   * @throws Error if access record not found
   */
  revokeTenantAccess(data: RevokeTenantAccessInput): Promise<void>;

  /**
   * Get all tenants a super admin has access to
   * @param superAdminId - Super admin user ID
   * @returns List of tenant accesses
   */
  getSuperAdminTenantAccess(superAdminId: string): Promise<SuperAdminTenantAccess[]>;

  /**
   * Get super admin statistics
   * @returns Aggregated stats about super admin operations
   */
  getSuperAdminStats(): Promise<SuperAdminStatsDTO>;

  /**
   * Get audit logs for super admin actions
   * @param superAdminId - Optional filter by super admin
   * @param limit - Maximum number of logs to return
   * @returns List of action logs
   */
  getActionLogs(superAdminId?: string, limit?: number): Promise<SuperAdminActionLog[]>;

  /**
   * Demote a super admin back to regular user
   * @param superAdminId - Super admin user ID
   * @param newRole - New role for the user
   * @param reason - Reason for demotion
   * @returns Updated user DTO
   */
  demoteSuperAdmin(
    superAdminId: string,
    newRole: Exclude<'super_admin'>,
    reason?: string
  ): Promise<SuperAdminDTO>;

  /**
   * Check if user is a super admin
   * @param userId - User ID to check
   * @returns True if user is super admin
   */
  isSuperAdmin(userId: string): Promise<boolean>;

  /**
   * Get all super admin tenant accesses (admin view)
   * @param limit - Maximum number of records
   * @returns List of all tenant accesses across all super admins
   */
  getAllTenantAccesses(limit?: number): Promise<SuperAdminTenantAccess[]>;
}

/**
 * Super Admin Management Service Factory
 * Returns appropriate implementation based on API mode
 * Used internally by serviceFactory.ts
 */
export interface ISuperAdminManagementServiceFactory {
  getInstance(): ISuperAdminManagementService;
}
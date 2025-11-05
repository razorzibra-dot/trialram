/**
 * Super Admin Management Types
 * Extends user types for super admin specific operations
 */

import { UserDTO, UserRole, UserStatus } from '@/types/dtos/userDtos';

/**
 * Super Admin DTO
 * Represents a platform-wide super administrator user
 */
export interface SuperAdminDTO extends UserDTO {
  /** Must be true for super admin */
  isSuperAdmin: true;
  /** Must be null for super admin (platform-wide) */
  tenantId: null;
  /** Role must be super_admin */
  role: 'super_admin';
}

/**
 * Create Super Admin Input
 * Fields required for creating a new super administrator
 */
export interface CreateSuperAdminInput {
  /** Email address for the super admin */
  email: string;
  /** Display name */
  name: string;
  /** First name */
  firstName?: string;
  /** Last name */
  lastName?: string;
  /** Status - defaults to 'active' */
  status?: UserStatus;
  /** Avatar URL */
  avatarUrl?: string;
  /** Phone number */
  phone?: string;
  /** Mobile number */
  mobile?: string;
}

/**
 * Promote User to Super Admin Input
 * Fields required for promoting an existing user
 */
export interface PromoteSuperAdminInput {
  /** User ID to promote */
  userId: string;
  /** Promotion reason/notes */
  reason?: string;
}

/**
 * Super Admin Tenant Access
 * Represents a super admin's access to a specific tenant
 */
export interface SuperAdminTenantAccess {
  /** Unique identifier */
  id: string;
  /** Super admin user ID */
  superAdminId: string;
  /** Tenant ID being accessed */
  tenantId: string;
  /** Access level (full/read-only/admin) */
  accessLevel: 'full' | 'read_only' | 'admin';
  /** When access was granted */
  grantedAt: string;
  /** When access expires (null = no expiry) */
  expiresAt?: string | null;
  /** Access grant reason */
  reason?: string;
}

/**
 * Grant Tenant Access Input
 * Fields required for granting super admin access to a tenant
 */
export interface GrantTenantAccessInput {
  /** Super admin user ID */
  superAdminId: string;
  /** Tenant ID to grant access to */
  tenantId: string;
  /** Access level */
  accessLevel: 'full' | 'read_only' | 'admin';
  /** Optional expiry date for temporary access */
  expiresAt?: string;
  /** Reason for access grant */
  reason?: string;
}

/**
 * Revoke Tenant Access Input
 * Fields required for revoking super admin access
 */
export interface RevokeTenantAccessInput {
  /** Super admin user ID */
  superAdminId: string;
  /** Tenant ID to revoke access from */
  tenantId: string;
  /** Reason for revocation */
  reason?: string;
}

/**
 * Super Admin Stats
 * Analytics for super admin operations
 */
export interface SuperAdminStatsDTO {
  /** Total super admins */
  totalSuperAdmins: number;
  /** Total active super admins */
  activeSuperAdmins: number;
  /** Total inactive super admins */
  inactiveSuperAdmins: number;
  /** Total super admin tenant accesses */
  totalTenantAccesses: number;
  /** Total active tenant accesses */
  activeTenantAccesses: number;
  /** Tenants with super admin access */
  tenantsWithAccess: number;
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Super Admin Action Log
 * Audit log entry for super admin actions
 */
export interface SuperAdminActionLog {
  /** Log entry ID */
  id: string;
  /** Super admin performing action */
  superAdminId: string;
  /** Action type (e.g., 'promote', 'grant_access', 'revoke_access') */
  action: string;
  /** Target resource (user ID, tenant ID, etc) */
  targetId: string;
  /** Action details */
  details?: Record<string, any>;
  /** Timestamp of action */
  timestamp: string;
}
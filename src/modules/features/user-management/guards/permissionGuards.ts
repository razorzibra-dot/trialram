/**
 * Permission Guards & Decorators for User Management Module
 * Enforces RBAC at UI level for user management operations
 * 
 * Layer Sync: Type-safe permission checks matching database roles and permissions
 * Database Role → TypeScript Enum → Guard Function → UI Component
 */

import { UserRole } from '@/types/dtos/userDtos';
import { rbacService as factoryRbacService } from '@/services/serviceFactory';

/**
 * User Management Permissions
 * Maps to database permission definitions in rbacService
 */
export enum UserPermission {
  // List and View Permissions
  USER_LIST = 'user:list',
  USER_VIEW = 'user:view',
  
  // Create and Edit Permissions
  USER_CREATE = 'user:create',
  USER_EDIT = 'user:edit',
  
  // Admin Permissions
  USER_DELETE = 'user:delete',
  USER_RESET_PASSWORD = 'user:reset_password',
  USER_MANAGE_ROLES = 'user:manage_roles',
  
  // System Permissions
  ROLE_MANAGE = 'role:manage',
  PERMISSION_MANAGE = 'permission:manage',
  
  // Tenant Admin
  TENANT_USERS = 'tenant:users',
}

/**
 * Role-Based Permissions Map
 * Defines which permissions are granted to each role
 * Synced with database role definitions
 */
export const ROLE_PERMISSIONS: Record<UserRole, UserPermission[]> = {
  'super-admin': [
    UserPermission.USER_LIST,
    UserPermission.USER_VIEW,
    UserPermission.USER_CREATE,
    UserPermission.USER_EDIT,
    UserPermission.USER_DELETE,
    UserPermission.USER_RESET_PASSWORD,
    UserPermission.USER_MANAGE_ROLES,
    UserPermission.ROLE_MANAGE,
    UserPermission.PERMISSION_MANAGE,
    UserPermission.TENANT_USERS,
  ],
  
  'admin': [
    UserPermission.USER_LIST,
    UserPermission.USER_VIEW,
    UserPermission.USER_CREATE,
    UserPermission.USER_EDIT,
    UserPermission.USER_DELETE,
    UserPermission.USER_RESET_PASSWORD,
    UserPermission.USER_MANAGE_ROLES,
    UserPermission.ROLE_MANAGE,
    UserPermission.TENANT_USERS,
  ],
  
  'manager': [
    UserPermission.USER_LIST,
    UserPermission.USER_VIEW,
    UserPermission.USER_EDIT,
    UserPermission.TENANT_USERS,
  ],
  
  'user': [
    UserPermission.USER_VIEW,
  ],
  
  'guest': [
    // No permissions for guest
  ],
};

/**
 * Check if user has specific permission
 * @param userRole Current user's role
 * @param permission Permission to check
 * @returns true if user has permission
 */
export function hasPermission(userRole: UserRole, permission: UserPermission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

/**
 * Check if user has any of the provided permissions
 * @param userRole Current user's role
 * @param permissions Array of permissions to check
 * @returns true if user has at least one permission
 */
export function hasAnyPermission(userRole: UserRole, permissions: UserPermission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if user has all of the provided permissions
 * @param userRole Current user's role
 * @param permissions Array of permissions to check
 * @returns true if user has all permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: UserPermission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Permission Guard Hook
 * Use in components to enforce permission-based UI rendering
 */
export interface PermissionGuardResult {
  hasPermission: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageRoles: boolean;
  canResetPassword: boolean;
  canViewList: boolean;
}

/**
 * Get permission guard result for current user role
 * @param userRole Current user's role
 * @returns Object with boolean flags for each permission
 */
export function getPermissionGuard(userRole: UserRole): PermissionGuardResult {
  return {
    hasPermission: getRolePermissions(userRole).length > 0,
    canCreate: hasPermission(userRole, UserPermission.USER_CREATE),
    canEdit: hasPermission(userRole, UserPermission.USER_EDIT),
    canDelete: hasPermission(userRole, UserPermission.USER_DELETE),
    canManageRoles: hasPermission(userRole, UserPermission.USER_MANAGE_ROLES),
    canResetPassword: hasPermission(userRole, UserPermission.USER_RESET_PASSWORD),
    canViewList: hasPermission(userRole, UserPermission.USER_LIST),
  };
}

/**
 * Assert that user has required permission
 * Throws error if permission denied
 * @param userRole Current user's role
 * @param permission Required permission
 * @throws Error if permission denied
 */
export function assertPermission(userRole: UserRole, permission: UserPermission): void {
  if (!hasPermission(userRole, permission)) {
    throw new Error(
      `Permission denied: User with role '${userRole}' does not have '${permission}' permission`
    );
  }
}

/**
 * Get all permissions for a role
 * @param userRole User's role
 * @returns Array of permissions
 */
export function getRolePermissions(userRole: UserRole): UserPermission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Check if user can perform action on target user
 * Rules:
 * - Super-admins can manage any user
 * - Admins can manage users in their tenant
 * - Managers can view/edit users in their tenant (not delete)
 * - Users can only view own profile
 * 
 * @param currentUserRole Actor's role
 * @param currentUserTenantId Actor's tenant ID
 * @param targetUserRole Target user's role
 * @param targetUserTenantId Target user's tenant ID
 * @param action Action to perform (create, edit, delete)
 * @returns true if action is allowed
 */
export function canPerformUserAction(
  currentUserRole: UserRole,
  currentUserTenantId: string,
  targetUserRole: UserRole,
  targetUserTenantId: string,
  action: 'create' | 'edit' | 'delete' | 'reset_password'
): boolean {
  // Super-admin can do everything
  if (currentUserRole === 'super-admin') {
    return true;
  }

  // Cross-tenant access denied for non-super-admins
  if (currentUserTenantId !== targetUserTenantId && currentUserRole !== 'super-admin') {
    return false;
  }

  // Admin can do all actions on non-admin users
  if (currentUserRole === 'admin') {
    if (action === 'delete' && targetUserRole === 'admin') {
      return false; // Admins can't delete other admins
    }
    return true;
  }

  // Manager can edit but not delete
  if (currentUserRole === 'manager') {
    return action === 'edit' || action === 'reset_password';
  }

  // Regular users can only update own profile
  if (currentUserRole === 'user') {
    return false; // Would need to check if target is self
  }

  // Default deny
  return false;
}
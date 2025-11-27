/**
 * Permission Guards & Decorators for User Management Module
 * Enforces RBAC at UI level for user management operations
 * 
 * Layer Sync: Type-safe permission checks matching database roles and permissions
 * Database Role → TypeScript Enum → Guard Function → UI Component
 * 
 * ⭐ CENTRALIZED: Now uses the unified RBAC service for all permission validation
 * ⭐ DATABASE-DRIVEN: Uses dynamic permissions from database, NOT hardcoded role maps
 */

import { UserRole } from '@/types/dtos/userDtos';
import { authService } from '@/services/serviceFactory';

/**
 * User Management Permissions
 * Maps to database permission definitions in rbacService
 * Updated to use {resource}:{action} format
 */
export enum UserPermission {
  // List and View Permissions
  USER_LIST = 'users:read',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values -- View uses same scope as list
  USER_VIEW = 'users:read',
  
  // Create and Edit Permissions
  USER_CREATE = 'users:create',
  USER_EDIT = 'users:update',
  
  // Admin Permissions
  USER_DELETE = 'users:delete',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values -- Reset password leverages update scope
  USER_RESET_PASSWORD = 'users:update',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values -- Role management maps to roles:update
  USER_MANAGE_ROLES = 'roles:update',
  
  // System Permissions
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values -- Same scope as USER_MANAGE_ROLES
  ROLE_MANAGE = 'roles:update',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values -- Same scope as ROLE_MANAGE
  PERMISSION_MANAGE = 'roles:update',
  
  // Tenant Admin
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values -- Tenant view uses read scope
  TENANT_USERS = 'users:read',
}

/**
 * ⚠️ DEPRECATED: ROLE_PERMISSIONS map removed - use database-driven permissions instead
 * Permissions are now loaded from database via user.permissions array
 * This map is kept only for reference/documentation purposes
 * 
 * @deprecated Use authService.hasPermission() instead
 */

/**
 * Check if user has specific permission
 * ⭐ DATABASE-DRIVEN: Uses dynamic permissions from database, not hardcoded role maps
 * @param userRole Current user's role (for logging/fallback only)
 * @param permission Permission to check
 * @returns true if user has permission
 */
export function hasPermission(userRole: UserRole, permission: UserPermission): boolean {
  // Use dynamic permissions from database via authService
  // This checks user.permissions array loaded from database at login
  return authService.hasPermission(permission);
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
 * Get permission guard result for current user
 * ⭐ DATABASE-DRIVEN: Uses dynamic permissions from database, not hardcoded role maps
 * @param userRole Current user's role (for logging/fallback only)
 * @returns Object with boolean flags for each permission
 */
export function getPermissionGuard(userRole: UserRole): PermissionGuardResult {
  console.log('[getPermissionGuard] ⚡ Function called with role:', userRole);
  
  // Use dynamic permissions from database via authService
  // Checks user.permissions array loaded from database at login
  const user = authService.getCurrentUser();
  const userPerms = user?.permissions || [];
  
  console.log('[getPermissionGuard] User:', { id: user?.id, email: user?.email, role: user?.role });
  console.log('[getPermissionGuard] User permissions array:', userPerms);
  console.log('[getPermissionGuard] UserPermission.USER_EDIT enum value:', UserPermission.USER_EDIT);
  
  // Test each permission check individually
  const check1 = authService.hasPermission(UserPermission.USER_EDIT);
  const check2 = authService.hasPermission('users:update');
  const check3 = authService.hasPermission('users:manage');
  
  console.log('[getPermissionGuard] Individual permission checks:', {
    'UserPermission.USER_EDIT (users:update)': check1,
    'users:update (string)': check2,
    'users:manage (string)': check3
  });
  
  const canEditCheck = check1 || check2 || check3;
  
  console.log('[getPermissionGuard] ✅ Final canEdit result:', canEditCheck);
  
  return {
    hasPermission: authService.hasPermission(UserPermission.USER_LIST) || 
                   authService.hasPermission('users:manage'),
    canCreate: authService.hasPermission(UserPermission.USER_CREATE) || 
               authService.hasPermission('users:manage'),
    canEdit: canEditCheck,
    canDelete: authService.hasPermission(UserPermission.USER_DELETE) || 
               authService.hasPermission('users:manage'),
    canManageRoles: authService.hasPermission(UserPermission.USER_MANAGE_ROLES) || 
                    authService.hasPermission('roles:update') || 
                    authService.hasPermission('roles:manage'),
    canResetPassword: authService.hasPermission(UserPermission.USER_RESET_PASSWORD) || 
                     authService.hasPermission('users:update') || 
                     authService.hasPermission('users:manage'),
    canViewList: authService.hasPermission(UserPermission.USER_LIST) || 
                 authService.hasPermission('users:read') || 
                 authService.hasPermission('users:manage'),
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
 * Get all permissions for current user
 * ⭐ DATABASE-DRIVEN: Returns permissions from database, not hardcoded role maps
 * @param userRole User's role (for logging/fallback only)
 * @returns Array of permissions from database
 */
export function getRolePermissions(userRole: UserRole): UserPermission[] {
  // Get permissions from current user object (loaded from database at login)
  const user = authService.getCurrentUser();
  if (!user || !user.permissions) {
    return [];
  }
  
  // Filter to only user management related permissions
  const userPerms = user.permissions.filter(p => 
    p.startsWith('users:') || 
    p.startsWith('roles:') || 
    p === 'user_management:read'
  );
  
  // Map database permission names to UserPermission enum values
  const permissionMap: Record<string, UserPermission> = {
    'users:read': UserPermission.USER_LIST,
    'users:create': UserPermission.USER_CREATE,
    'users:update': UserPermission.USER_EDIT,
    'users:delete': UserPermission.USER_DELETE,
    'users:manage': UserPermission.USER_EDIT, // manage includes all user operations
    'roles:update': UserPermission.USER_MANAGE_ROLES,
    'roles:manage': UserPermission.USER_MANAGE_ROLES,
    'user_management:read': UserPermission.USER_LIST,
  };
  
  const mappedPerms = userPerms
    .map(p => permissionMap[p])
    .filter((p): p is UserPermission => p !== undefined);
  
  // Deduplicate
  return Array.from(new Set(mappedPerms));
}

/**
 * Check if user can perform action on target user
 * ⭐ SECURITY: Enhanced tenant isolation and role-based access control
 * Rules:
 * - Admins can manage users in their tenant (cannot delete other admins)
 * - Managers can view/edit users in their tenant (cannot delete, cannot change roles)
 * - Users can only view own profile
 *
 * @param currentUserRole Actor's role
 * @param currentUserTenantId Actor's tenant ID
 * @param targetUserRole Target user's role
 * @param targetUserTenantId Target user's tenant ID
 * @param action Action to perform (create, edit, delete, reset_password)
 * @returns true if action is allowed
 */
export function canPerformUserAction(
  currentUserRole: UserRole,
  currentUserTenantId: string | null,
  targetUserRole: UserRole,
  targetUserTenantId: string | null,
  action: 'create' | 'edit' | 'delete' | 'reset_password'
): boolean {
  // Strict tenant isolation applies
  if (currentUserTenantId !== targetUserTenantId) {
    return false; // Cross-tenant access denied
  }

  // Admin permissions within tenant - full access to manage users
  if (currentUserRole === 'admin') {
    // Cannot delete other admins (to prevent lockout)
    if (action === 'delete' && targetUserRole === 'admin') {
      return false;
    }
    // Can perform all other actions on users within tenant
    return true;
  }

  // Manager permissions within tenant
  if (currentUserRole === 'manager') {
    // Managers can edit and reset passwords, but cannot delete or change roles
    if (action === 'edit' || action === 'reset_password') {
      return true;
    }
    return false;
  }

  // User permissions within tenant
  if (currentUserRole === 'user') {
    // Users can edit users but cannot delete or reset passwords
    if (action === 'edit') {
      return true;
    }
    return false;
  }

  // Engineer permissions within tenant
  if (currentUserRole === 'engineer') {
    // Engineers can edit users but cannot delete or reset passwords
    if (action === 'edit') {
      return true;
    }
    return false;
  }

  // Regular users and customers can only view (no management actions)
  return false;
}
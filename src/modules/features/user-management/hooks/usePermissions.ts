/**
 * Permission Hook for User Management Module
 * Provides permission checks in React components
 * 
 * Usage:
 * const permissions = usePermissions();
 * if (permissions.canCreate) show create button
 */

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/serviceFactory';
import {
  getPermissionGuard,
  canPerformUserAction,
  hasPermission,
  UserPermission,
  PermissionGuardResult,
} from '../guards/permissionGuards';

/**
 * Hook return type for permission checks
 */
export interface UsePermissionsReturn extends PermissionGuardResult {
  /** Can perform action on target user */
  canPerformAction: (
    targetUserRole: string,
    targetUserTenantId: string,
    action: 'create' | 'edit' | 'delete' | 'reset_password'
  ) => boolean;
  
  /** Check single permission */
  hasPermission: (permission: UserPermission) => boolean;
  
  /** Current user role */
  userRole: string;
  
  /** Current user tenant ID */
  userTenantId: string;
  
  /** Loading state - true while auth is loading user data */
  isLoading: boolean;
  
  /** Can manage users (view, create, or edit) */
  canManageUsers: boolean;
}

/**
 * Hook: Use permissions in components
 * @returns Object with permission checks
 */
export function usePermissions(): UsePermissionsReturn {
  const auth = useAuth();
  const currentUser = auth?.user;
  const userRole = currentUser?.role || 'guest';
  const userTenantId = currentUser?.tenantId || '';

  // ⭐ DATABASE-DRIVEN: Use dynamic permissions from database, not hardcoded role checks
  // Include permissions in dependencies so it updates when permissions are loaded
  const userPermissions = currentUser?.permissions || [];
  const permissionGuard = useMemo(() => {
    // getPermissionGuard now uses authService.hasPermission() which checks database permissions
    console.log('[usePermissions] Recomputing permission guard. User permissions:', userPermissions);
    return getPermissionGuard(userRole as any);
  }, [userRole, userPermissions]);

  const canPerformActionFn = useMemo(
    () => (
      targetUserRole: string,
      targetUserTenantId: string,
      action: 'create' | 'edit' | 'delete' | 'reset_password'
    ) => {
      // Check if user has permission for this action via database permissions
      // Super admins should have all permissions in database, not hardcoded bypass
      const hasManagePermission = authService.hasPermission('users:manage');
      if (hasManagePermission) {
        // Users with users:manage can perform all actions (except delete other admins)
        if (action === 'delete' && targetUserRole === 'admin') {
          return false; // Prevent lockout
        }
        return true;
      }
      
      // Fallback to role-based action checks (for tenant isolation)
      return canPerformUserAction(
        userRole as any,
        userTenantId,
        targetUserRole as any,
        targetUserTenantId,
        action
      );
    },
    [userRole, userTenantId, userPermissions]
  );

  const hasPermissionFn = useMemo(
    () => (permission: UserPermission) => {
      // Use dynamic permissions from database via authService
      // This checks user.permissions array loaded from database at login
      return hasPermission(userRole as any, permission);
    },
    [userRole, userPermissions]
  );

  const result = useMemo(
    () => {
      const res = {
        ...permissionGuard,
        canPerformAction: canPerformActionFn,
        hasPermission: hasPermissionFn,
        userRole,
        userTenantId,
        isLoading: auth?.isLoading || false,
        canManageUsers: permissionGuard.canViewList || permissionGuard.canCreate || permissionGuard.canEdit,
        // Backward compatibility aliases
        canCreateUsers: permissionGuard.canCreate,
        canEditUsers: permissionGuard.canEdit,
        canDeleteUsers: permissionGuard.canDelete,
        canResetPasswords: permissionGuard.canResetPassword,
      };
      console.log('[usePermissions] ✅ Returning permission result:', {
        canCreate: res.canCreate,
        canEdit: res.canEdit,
        canEditUsers: res.canEditUsers,
        canDelete: res.canDelete,
        canViewList: res.canViewList,
        permissionGuardCanEdit: permissionGuard.canEdit
      });
      return res;
    },
    [permissionGuard, canPerformActionFn, hasPermissionFn, userRole, userTenantId, auth?.isLoading]
  );
  
  return result;
}

/**
 * Hook: Use specific permission check
 * Simpler hook when you only need to check one permission
 * 
 * @param permission Permission to check
 * @returns true if user has permission
 */
export function useHasPermission(permission: UserPermission): boolean {
  const permissions = usePermissions();
  return permissions.hasPermission(permission);
}

/**
 * Hook: Restrict render based on permission
 * Returns element only if user has permission
 * 
 * @param permission Required permission
 * @param children Element to render if permitted
 * @param fallback Element to render if denied (optional)
 * @returns JSX element or null
 */
export function useRenderIfPermitted(
  permission: UserPermission,
  children: React.ReactNode,
  fallback?: React.ReactNode
): React.ReactNode {
  const hasPermission = useHasPermission(permission);
  return hasPermission ? children : fallback;
}

/**
 * Backward compatibility alias for usePermissions
 * Provides user management specific permission checks
 */
export function useUserManagementPermissions() {
  const permissions = usePermissions();
  return {
    canCreate: permissions.canCreate,
    canEdit: permissions.canEdit,
    canDelete: permissions.canDelete,
    canManageRoles: permissions.canManageRoles,
    canResetPassword: permissions.canResetPassword,
    canViewList: permissions.canViewList,
    canCreateUsers: permissions.canCreate,
    canEditUsers: permissions.canEdit,
    canDeleteUsers: permissions.canDelete,
    canResetPasswords: permissions.canResetPassword,
    canManageUsers: permissions.canViewList || permissions.canCreate || permissions.canEdit,
    isLoading: false,
    userRole: permissions.userRole,
    userTenantId: permissions.userTenantId,
  };
}

/**
 * Check if user requires permission to perform action
 * Returns function that validates permission
 */
export function useRequirePermission(permission: UserPermission) {
  const permissions = usePermissions();
  return {
    required: permission,
    hasPermission: permissions.hasPermission(permission),
    assertPermission: () => {
      if (!permissions.hasPermission(permission)) {
        throw new Error(`Permission denied: ${permission}`);
      }
    },
  };
}
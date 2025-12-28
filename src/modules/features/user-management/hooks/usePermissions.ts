/**
 * Permission Hook for User Management Module
 * Provides permission checks in React components
 * 
 * Usage:
 * const permissions = usePermissions();
 * if (permissions.canCreate) show create button
 */

import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/serviceFactory';
import { useCurrentUser, useCurrentTenant } from '@/hooks';
// supabase queries for element-level permissions are centralized in AuthContext
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
export interface UsePermissionsReturn {
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

  /** Permission guard results */
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageRoles: boolean;
  canResetPassword: boolean;
  canViewList: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canViewUsers: boolean;
}

/**
 * Hook: Use permissions in components
 * @returns Object with permission checks
 */
export function usePermissions(): UsePermissionsReturn {
  const auth = useAuth();
  const currentUser = useCurrentUser();
  const currentTenant = useCurrentTenant();
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

  // Also check element permissions for UI controls using direct database queries
  const [elementPermissions, setElementPermissions] = useState({
    canCreateUser: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewUsers: false,
  });

  useEffect(() => {
    const checkElementPermissions = async () => {
      if (!currentUser || !currentTenant) {
        setElementPermissions({
          canCreateUser: false,
          canEditUsers: false,
          canDeleteUsers: false,
          canViewUsers: false,
        });
        return;
      }

      try {
        // If permissions are already attached to the current user (loaded at login/restore),
        // use them directly to avoid repeated DB queries from multiple components mounting.
        const userPerms: string[] = currentUser.permissions || [];

        if (Array.isArray(userPerms) && userPerms.length > 0) {
          setElementPermissions({
            canViewUsers: userPerms.includes('crm:user:list:view:accessible'),
            canCreateUser: userPerms.includes('crm:user:list:button.create:visible'),
            canEditUsers: userPerms.includes('crm:user:record:update'),
            canDeleteUsers: userPerms.includes('crm:user:record:delete'),
          });

          console.log('[usePermissions] Element permissions derived from user.permissions:', {
            hasPermissionsLoaded: true,
            canViewUsers: userPerms.includes('crm:user:list:view:accessible'),
            canCreateUser: userPerms.includes('crm:user:list:button.create:visible'),
            canEditUsers: userPerms.includes('crm:user:record:update'),
            canDeleteUsers: userPerms.includes('crm:user:record:delete'),
          });
          return;
        }

        // Fallback: use ElementPermissionService which includes caching to avoid repeated DB calls
        // This evaluates permissions using cached userRoles and role_permissions.
        const evalFn = auth.evaluateElementPermission;
        const [canViewUsers, canCreateUser, canEditUsers, canDeleteUsers] = await Promise.all([
          evalFn ? evalFn('user:list', 'accessible', undefined) : Promise.resolve(false),
          evalFn ? evalFn('user:list:button.create', 'visible', undefined) : Promise.resolve(false),
          evalFn ? evalFn('user:record', 'editable', undefined) : Promise.resolve(false),
          evalFn ? evalFn('user:record', 'editable', undefined) : Promise.resolve(false),
        ]);

        setElementPermissions({
          canViewUsers,
          canCreateUser,
          canEditUsers,
          canDeleteUsers,
        });

        console.log('[usePermissions] Element permissions loaded (fallback via ElementPermissionService):', {
          canViewUsers,
          canCreateUser,
          canEditUsers,
          canDeleteUsers,
        });
      } catch (error) {
        console.error('[usePermissions] Error checking element permissions:', error);
        setElementPermissions({
          canCreateUser: false,
          canEditUsers: false,
          canDeleteUsers: false,
          canViewUsers: false,
        });
      }
    };

    checkElementPermissions();
  }, [currentUser?.id, currentTenant?.id]);

  const canPerformActionFn = useMemo(
    () => (
      targetUserRole: string,
      targetUserTenantId: string,
      action: 'create' | 'edit' | 'delete' | 'reset_password'
    ) => {
      // Check if user has permission for this action via database permissions
      // Super admins should have all permissions in database, not hardcoded bypass
      const hasManagePermission = authService.hasPermission('crm:user:record:update');
      if (hasManagePermission) {
        // Users with crm:user:record:update can perform all actions (except delete other admins)
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
        // Override with element permissions for UI controls
        canCreateUsers: elementPermissions.canCreateUser || permissionGuard.canCreate,
        canEditUsers: elementPermissions.canEditUsers || permissionGuard.canEdit,
        canDeleteUsers: elementPermissions.canDeleteUsers || permissionGuard.canDelete,
        canViewList: elementPermissions.canViewUsers || permissionGuard.canViewList,
        canViewUsers: elementPermissions.canViewUsers || permissionGuard.canViewList,
        // Backward compatibility aliases
        canResetPasswords: permissionGuard.canResetPassword,
      };
      console.log('[usePermissions] ✅ Returning permission result:', {
        canCreate: res.canCreate,
        canEdit: res.canEdit,
        canEditUsers: res.canEditUsers,
        canDelete: res.canDelete,
        canViewList: res.canViewList,
        permissionGuardCanEdit: permissionGuard.canEdit,
        elementPermissions
      });
      return res;
    },
    [permissionGuard, canPerformActionFn, hasPermissionFn, userRole, userTenantId, auth?.isLoading, elementPermissions]
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
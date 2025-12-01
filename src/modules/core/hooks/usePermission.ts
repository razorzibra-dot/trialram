/**
 * usePermission Hook
 * React hook for permission validation and role checking
 * Provides permission validation, role checking, feature access control, and UI component gating
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface PermissionCheckResult {
  hasPermission: boolean;
  hasRole: boolean;
  canAccessFeature: boolean;
  canAccessModule: boolean;
  isSuperAdmin: boolean;
  isImpersonating: boolean;
}

/**
 * Hook for permission validation and role checking
 * Provides comprehensive access control functionality
 */
export const usePermission = () => {
  const auth = useAuth();

  /**
   * Check if user has a specific permission
   * @param permission - Permission string (e.g., 'crm:customer:record:read', 'crm:sales:deal:create')
   * @returns boolean indicating if user has the permission
   */
  const checkPermission = useCallback((permission: string): boolean => {
    if (!auth.isAuthenticated) return false;
    return auth.hasPermission(permission);
  }, [auth]);

  /**
   * Check if user has a specific role
   * @param role - Role name (e.g., 'admin', 'manager', 'agent')
   * @returns boolean indicating if user has the role
   */
  const checkRole = useCallback((role: string): boolean => {
    if (!auth.isAuthenticated) return false;
    return auth.hasRole(role);
  }, [auth]);

  /**
   * Check if user can access a specific feature
   * Features are mapped to permissions for granular control
   * @param feature - Feature name (e.g., 'customer_management', 'sales_pipeline')
   * @returns boolean indicating if user can access the feature
   */
  const checkFeatureAccess = useCallback((feature: string): boolean => {
    if (!auth.isAuthenticated) return false;

    // ✅ ACCEPTABLE: Feature-to-permission mapping (not role mapping)
    // This maps application features to database permissions, which is acceptable.
    // Features are application concepts, permissions are database-driven.
    // If new permissions are added to database, they can be mapped here.
    const featurePermissions: Record<string, string[]> = {
      customer_management: ['crm:customer:record:read'],
      customer_creation: ['crm:customer:record:create'],
      customer_editing: ['crm:customer:record:update'],
      customer_deletion: ['crm:customer:record:delete'],

      sales_pipeline: ['crm:sales:deal:read'],
      sales_creation: ['crm:sales:deal:create'],
      sales_editing: ['crm:sales:deal:update'],
      sales_deletion: ['crm:sales:deal:delete'],

      ticket_management: ['crm:support:ticket:read'],
      ticket_creation: ['crm:support:ticket:create'],
      ticket_assignment: ['crm:support:ticket:update'],
      ticket_escalation: ['crm:support:ticket:update'],

      product_catalog: ['crm:product:record:read'],
      product_management: ['crm:product:record:update'],
      inventory_management: ['crm:product:record:update'],

      contract_management: ['crm:contract:record:read'],
      contract_creation: ['crm:contract:record:create'],
      contract_approval: ['crm:contract:record:update'],

      user_management: ['crm:user:record:read'],
      role_management: ['crm:role:record:read'],
      audit_logs: ['audit:read'],

      notifications: ['notifications:read'],
      system_settings: ['crm:system:config:read'],
    };

    const requiredPermissions = featurePermissions[feature];
    if (!requiredPermissions) {
      console.warn(`Unknown feature: ${feature}`);
      return false;
    }

    return requiredPermissions.some(permission => auth.hasPermission(permission));
  }, [auth]);

  /**
   * Check if user can access a specific module
   * @param moduleName - Module name (e.g., 'customers', 'sales', 'tickets')
   * @returns boolean indicating if user can access the module
   */
  const checkModuleAccess = useCallback((moduleName: string): boolean => {
    if (!auth.isAuthenticated) return false;
    return auth.canAccessModule(moduleName);
  }, [auth]);

  /**
   * Get comprehensive permission check result
   * @param options - Permission check options
   * @returns PermissionCheckResult object with all checks
   */
  const getPermissionResult = useCallback((
    options: {
      permission?: string;
      role?: string;
      feature?: string;
      module?: string;
    }
  ): PermissionCheckResult => {
    return {
      hasPermission: options.permission ? checkPermission(options.permission) : false,
      hasRole: options.role ? checkRole(options.role) : false,
      canAccessFeature: options.feature ? checkFeatureAccess(options.feature) : false,
      canAccessModule: options.module ? checkModuleAccess(options.module) : false,
      isSuperAdmin: auth.isSuperAdmin(),
      isImpersonating: auth.isImpersonating(),
    };
  }, [auth, checkPermission, checkRole, checkFeatureAccess, checkModuleAccess]);

  /**
   * Check if user has any of the provided permissions
   * @param permissions - Array of permission strings
   * @returns boolean indicating if user has at least one permission
   */
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!auth.isAuthenticated) return false;
    return permissions.some(permission => auth.hasPermission(permission));
  }, [auth]);

  /**
   * Check if user has all of the provided permissions
   * @param permissions - Array of permission strings
   * @returns boolean indicating if user has all permissions
   */
  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!auth.isAuthenticated) return false;
    return permissions.every(permission => auth.hasPermission(permission));
  }, [auth]);

  /**
   * Check if user has any of the provided roles
   * @param roles - Array of role names
   * @returns boolean indicating if user has at least one role
   */
  const hasAnyRole = useCallback((roles: string[]): boolean => {
    if (!auth.isAuthenticated) return false;
    return roles.some(role => auth.hasRole(role));
  }, [auth]);

  /**
   * Get user's current role hierarchy level
   * ⚠️ NOTE: Role hierarchy levels are business rules for UI/hierarchy comparison ONLY.
   * For security checks, use permission-based checks instead of role hierarchy.
   * 
   * ⚠️ TODO: This should be database-driven. Add hierarchy_level column to roles table
   * and fetch it dynamically via rbacService.getRoles().
   * 
   * ⚠️ FALLBACK: This is a hardcoded fallback for UI display purposes only.
   * It should NOT be used for security checks. Use authService.hasPermission() for security.
   * 
   * @returns number representing role level (higher = more permissions)
   */
  const getRoleLevel = useCallback((): number => {
    if (!auth.isAuthenticated || !auth.user) return 0;

    // ⚠️ FALLBACK: Hardcoded hierarchy for UI display only (not for security)
    // This should be removed once roles table has hierarchy_level column
    // TODO: Fetch from database when hierarchy_level column is added to roles table
    const roleLevels: Record<string, number> = {
      super_admin: 6,
      admin: 5,
      manager: 4,
      engineer: 3,
      user: 1,
      customer: 0,
    };

    return roleLevels[auth.user.role] || 0;
  }, [auth]);

  /**
   * Check if user can manage another user (role hierarchy)
   * ⚠️ NOTE: For security checks, use permission-based checks instead:
   * return authService.hasPermission('crm:user:record:update');
   * 
   * This hierarchy check is for UI/hierarchy comparison ONLY.
   * 
   * ⚠️ FALLBACK: This uses hardcoded hierarchy for UI display purposes only.
   * It should NOT be used for security checks. Use authService.hasPermission() for security.
   * 
   * ⚠️ TODO: Make this fully database-driven by adding hierarchy_level to roles table.
   * @param targetUserRole - Role of the user to be managed
   * @returns boolean indicating if current user can manage target user
   */
  const canManageUser = useCallback((targetUserRole: string): boolean => {
    if (!auth.isAuthenticated) return false;
    if (auth.isSuperAdmin()) return true;

    // ⚠️ FALLBACK: Hardcoded hierarchy for UI display only (not for security)
    // This should be removed once roles table has hierarchy_level column
    // TODO: Fetch from database when hierarchy_level column is added to roles table
    const currentLevel = getRoleLevel();
    const targetLevel = {
      super_admin: 6,
      admin: 5,
      manager: 4,
      engineer: 3,
      user: 1,
      customer: 0,
    }[targetUserRole] || 0;

    return currentLevel > targetLevel;
  }, [auth, getRoleLevel]);

  // Memoized permission utilities for performance
  const permissionUtils = useMemo(() => ({
    checkPermission,
    checkRole,
    checkFeatureAccess,
    checkModuleAccess,
    getPermissionResult,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    getRoleLevel,
    canManageUser,
  }), [
    checkPermission,
    checkRole,
    checkFeatureAccess,
    checkModuleAccess,
    getPermissionResult,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    getRoleLevel,
    canManageUser,
  ]);

  return permissionUtils;
};

/**
 * Hook for role-based access control
 * Simplified interface focused on role checking
 */
export const useRole = () => {
  const { checkRole, hasAnyRole, getRoleLevel, canManageUser } = usePermission();

  return {
    checkRole,
    hasAnyRole,
    getRoleLevel,
    canManageUser,
  };
};

/**
 * Hook for feature access control
 * Simplified interface focused on feature access
 */
export const useFeatureAccess = () => {
  const { checkFeatureAccess, checkModuleAccess } = usePermission();

  return {
    checkFeatureAccess,
    checkModuleAccess,
  };
};

/**
 * Hook for module access control
 * Simplified interface focused on module access
 */
export const useModuleAccess = () => {
  const { checkModuleAccess } = usePermission();

  return {
    checkModuleAccess,
  };
};
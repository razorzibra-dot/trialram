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
   * @param permission - Permission string (e.g., 'customers:read', 'sales:create')
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

    // Map features to required permissions
    const featurePermissions: Record<string, string[]> = {
      customer_management: ['customers:read'],
      customer_creation: ['customers:create'],
      customer_editing: ['customers:update'],
      customer_deletion: ['customers:delete'],

      sales_pipeline: ['sales:read'],
      sales_creation: ['sales:create'],
      sales_editing: ['sales:update'],
      sales_deletion: ['sales:delete'],

      ticket_management: ['tickets:read'],
      ticket_creation: ['tickets:create'],
      ticket_assignment: ['tickets:update'],
      ticket_escalation: ['tickets:update'],

      product_catalog: ['products:read'],
      product_management: ['products:update'],
      inventory_management: ['products:update'],

      contract_management: ['contracts:read'],
      contract_creation: ['contracts:create'],
      contract_approval: ['contracts:update'],

      user_management: ['users:read'],
      role_management: ['roles:read'],
      audit_logs: ['audit:read'],

      notifications: ['notifications:read'],
      system_settings: ['settings:read'],
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
   * @returns number representing role level (higher = more permissions)
   */
  const getRoleLevel = useCallback((): number => {
    if (!auth.isAuthenticated || !auth.user) return 0;

    const roleLevels: Record<string, number> = {
      super_admin: 6,
      admin: 5,
      manager: 4,
      engineer: 3,
      agent: 2,
      user: 1,
      customer: 0,
    };

    return roleLevels[auth.user.role] || 0;
  }, [auth]);

  /**
   * Check if user can manage another user (role hierarchy)
   * @param targetUserRole - Role of the user to be managed
   * @returns boolean indicating if current user can manage target user
   */
  const canManageUser = useCallback((targetUserRole: string): boolean => {
    if (!auth.isAuthenticated) return false;
    if (auth.isSuperAdmin()) return true;

    const currentLevel = getRoleLevel();
    const targetLevel = {
      super_admin: 6,
      admin: 5,
      manager: 4,
      engineer: 3,
      agent: 2,
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
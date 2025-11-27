/**
 * usePermission Hook
 * Permission validation, role checking, feature access control, UI component gating
 *
 * Provides React hooks for permission-based access control throughout the application.
 * Integrates with AuthContext for centralized permission management.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

/**
 * Hook for checking a specific permission
 *
 * @param permission - The permission string to check (e.g., 'customers:read', 'sales:create')
 * @returns boolean indicating if the current user has the permission
 *
 * @example
 * const canReadCustomers = usePermission('customers:read');
 * const canCreateSales = usePermission('sales:create');
 */
export const usePermission = (permission: string): boolean => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

/**
 * Hook for checking if user has a specific role
 *
 * @param roleName - The role name to check (e.g., 'admin', 'manager', 'user')
 * @returns boolean indicating if the current user has the role
 *
 * @example
 * const isAdmin = useRole('admin');
 * const isManager = useRole('manager');
 */
export const useRole = (roleName: string): boolean => {
  const { hasRole } = useAuth();
  return hasRole(roleName);
};

/**
 * Hook for checking module access
 *
 * @param moduleName - The module name to check access for
 * @returns boolean indicating if the current user can access the module
 *
 * @example
 * const canAccessCustomers = useModuleAccess('customers');
 * const canAccessSales = useModuleAccess('sales');
 */
export const useModuleAccess = (moduleName: string): boolean => {
  const { canAccessModule } = useAuth();
  return canAccessModule(moduleName);
};

/**
 * Hook for checking if user is a super admin
 *
 * @returns boolean indicating if the current user is a super admin
 *
 * @example
 * const isSuperAdmin = useIsSuperAdmin();
 */
export const useIsSuperAdmin = (): boolean => {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin();
};

/**
 * Hook for checking if user is currently impersonating
 *
 * @returns boolean indicating if the current user is impersonating another user
 *
 * @example
 * const isImpersonating = useIsImpersonating();
 */
export const useIsImpersonating = (): boolean => {
  const { isImpersonating } = useAuth();
  return isImpersonating();
};

/**
 * Hook for getting current impersonation session
 *
 * @returns The current impersonation session or null
 *
 * @example
 * const session = useCurrentImpersonationSession();
 */
export const useCurrentImpersonationSession = () => {
  const { getCurrentImpersonationSession } = useAuth();
  return getCurrentImpersonationSession();
};

/**
 * Hook for checking if user is authenticated
 *
 * @returns boolean indicating if the current user is authenticated
 *
 * @example
 * const isAuthenticated = useIsAuthenticated();
 */
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

/**
 * Hook for getting current user
 *
 * @returns The current user object or null
 *
 * @example
 * const user = useCurrentUser();
 */
export const useCurrentUser = () => {
  const { user } = useAuth();
  return user;
};

/**
 * Hook for getting current tenant ID
 *
 * @returns The current tenant ID or undefined
 *
 * @example
 * const tenantId = useCurrentTenantId();
 */
export const useCurrentTenantId = (): string | undefined => {
  const { getTenantId } = useAuth();
  return getTenantId();
};

/**
 * Hook for permission-based conditional rendering
 * Provides multiple permission checking utilities in one hook
 *
 * @returns Object with permission checking functions
 *
 * @example
 * const { canView, canEdit, canDelete, hasAnyRole } = usePermissionGate();
 *
 * return (
 *   <div>
 *     {canView('customers') && <CustomerList />}
 *     {canEdit('customers') && <EditButton />}
 *     {canDelete('customers') && <DeleteButton />}
 *   </div>
 * );
 */
export const usePermissionGate = () => {
  const { hasPermission, hasRole, canAccessModule } = useAuth();

  const canView = useMemo(() => (resource: string) => hasPermission(`${resource}:read`), [hasPermission]);
  const canCreate = useMemo(() => (resource: string) => hasPermission(`${resource}:create`), [hasPermission]);
  const canEdit = useMemo(() => (resource: string) => hasPermission(`${resource}:update`), [hasPermission]);
  const canDelete = useMemo(() => (resource: string) => hasPermission(`${resource}:delete`), [hasPermission]);

  const hasAnyRole = useMemo(() => (roles: string[]) => roles.some(role => hasRole(role)), [hasRole]);

  const canAccessModuleWithFallback = useMemo(() =>
    (moduleName: string, fallbackPermissions: string[] = []) =>
      canAccessModule(moduleName) || fallbackPermissions.some(permission => hasPermission(permission)),
    [canAccessModule, hasPermission]
  );

  return {
    canView,
    canCreate,
    canEdit,
    canDelete,
    hasAnyRole,
    canAccessModuleWithFallback,
  };
};

/**
 * Hook for checking multiple permissions at once
 *
 * @param permissions - Array of permission strings to check
 * @returns Object with permission status for each permission
 *
 * @example
 * const { canReadCustomers, canCreateSales } = usePermissions([
 *   'customers:read',
 *   'sales:create'
 * ]);
 */
export const usePermissions = (permissions: string[]) => {
  const { hasPermission } = useAuth();

  return useMemo(() => {
    const result: Record<string, boolean> = {};
    permissions.forEach(permission => {
      const key = permission.replace(':', '_').replace('-', '_');
      result[key] = hasPermission(permission);
    });
    return result;
  }, [permissions, hasPermission]);
};

/**
 * Hook for checking feature access based on permissions
 * Useful for feature toggling based on user permissions
 *
 * @param featurePermissions - Object mapping feature names to required permissions
 * @returns Object with feature access status
 *
 * @example
 * const features = useFeatureAccess({
 *   customerManagement: ['customers:read', 'customers:create'],
 *   salesPipeline: ['sales:read', 'sales:update'],
 *   adminPanel: ['admin:access']
 * });
 *
 * return (
 *   <div>
 *     {features.customerManagement && <CustomerManagement />}
 *     {features.salesPipeline && <SalesPipeline />}
 *     {features.adminPanel && <AdminPanel />}
 *   </div>
 * );
 */
export const useFeatureAccess = (featurePermissions: Record<string, string[]>) => {
  const { hasPermission } = useAuth();

  return useMemo(() => {
    const result: Record<string, boolean> = {};
    Object.entries(featurePermissions).forEach(([feature, permissions]) => {
      result[feature] = permissions.every(permission => hasPermission(permission));
    });
    return result;
  }, [featurePermissions, hasPermission]);
};
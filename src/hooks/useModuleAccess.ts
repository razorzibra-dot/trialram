/**
 * useModuleAccess Hook
 * 
 * Provides module-level access checking for users.
 * 
 * **Super Admin Access Rules**:
 * - Super admins (isSuperAdmin=true) can ONLY access the 'super-admin' module
 * - Super admins CANNOT access regular tenant modules (customers, sales, contracts, etc.)
 * - Super admins can impersonate users and manage system-wide settings
 * 
 * **Regular User Access Rules**:
 * - Regular users (isSuperAdmin=false) can access regular tenant modules
 * - Regular users CANNOT access the 'super-admin' module
 * - Regular users access is controlled by RBAC permissions
 * 
 * **Usage**:
 * ```typescript
 * const { canAccess, isLoading, error } = useModuleAccess('customers');
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 * if (!canAccess) return <AccessDenied />;
 * 
 * return <CustomerModule />;
 * ```
 * 
 * @param moduleName - Name of the module to check access for
 * @returns Object containing canAccess boolean, loading state, and error
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services';
import { MODULE_PERMISSION_MAP } from '@/constants/modulePermissionMap';

/**
 * Module access check result
 * @interface ModuleAccessResult
 */
export interface ModuleAccessResult {
  /** Whether user can access this module */
  canAccess: boolean;
  /** Loading state during permission check */
  isLoading: boolean;
  /** Error message if access check failed */
  error: Error | null;
  /** User's super admin status */
  isSuperAdmin: boolean;
  /** Reason for access denial (for logging/debugging) */
  reason?: string;
}

/**
 * List of modules that are super-admin only
 */
const SUPER_ADMIN_ONLY_MODULES = ['super-admin', 'system-admin', 'admin-panel'];

/**
 * List of regular modules that super admins cannot access
 */
const TENANT_MODULES = [
  'customers',
  'sales',
  'contracts',
  'service-contracts',
  'products',
  'product-sales',
  'tickets',
  'complaints',
  'job-works',
  'notifications',
  'reports',
  'settings',
  'dashboard',
  'masters',
  'user-management',
];

/**
 * Check if a module is a super-admin only module
 * @param moduleName - Name of the module to check
 * @returns true if module is super-admin only
 */
function isSuperAdminModule(moduleName: string): boolean {
  return SUPER_ADMIN_ONLY_MODULES.includes(moduleName.toLowerCase());
}

/**
 * Check if a module is a tenant module
 * @param moduleName - Name of the module to check
 * @returns true if module is a tenant module
 */
function isTenantModule(moduleName: string): boolean {
  return TENANT_MODULES.includes(moduleName.toLowerCase());
}

/**
 * useModuleAccess Hook
 * 
 * Provides async module access checking with React Query
 * 
 * @param moduleName - Name of the module to check access for
 * @returns ModuleAccessResult with canAccess, isLoading, error, and isSuperAdmin
 */
export function useModuleAccess(moduleName: string): ModuleAccessResult {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['moduleAccess', moduleName, user?.id],
    queryFn: async (): Promise<ModuleAccessResult> => {
      // Ensure user is authenticated
      if (!user) {
        return {
          canAccess: false,
          isLoading: false,
          error: new Error('User not authenticated'),
          isSuperAdmin: false,
          reason: 'User not authenticated',
        };
      }

      // Determine user's super admin status
      const userIsSuperAdmin = user.isSuperAdmin === true;
      const normalizedModuleName = moduleName.toLowerCase();

      // RULE 1: Super admin accessing super-admin module
      if (userIsSuperAdmin && isSuperAdminModule(normalizedModuleName)) {
        console.log(
          `[useModuleAccess] ✅ Super admin accessing super-admin module: ${moduleName}`
        );
        return {
          canAccess: true,
          isLoading: false,
          error: null,
          isSuperAdmin: true,
          reason: 'Super admin accessing super-admin module',
        };
      }

      // RULE 2: Super admin accessing tenant module
      if (userIsSuperAdmin && isTenantModule(normalizedModuleName)) {
        console.warn(
          `[useModuleAccess] ❌ Super admin blocked from accessing tenant module: ${moduleName}`
        );
        return {
          canAccess: false,
          isLoading: false,
          error: null,
          isSuperAdmin: true,
          reason: 'Super admins cannot access regular tenant modules',
        };
      }

      // RULE 3: Super admin accessing unknown module
      if (userIsSuperAdmin) {
        console.warn(
          `[useModuleAccess] ❌ Super admin blocked from accessing unknown module: ${moduleName}`
        );
        return {
          canAccess: false,
          isLoading: false,
          error: null,
          isSuperAdmin: true,
          reason: 'Super admins cannot access this module',
        };
      }

      // RULE 4: Regular user accessing super-admin module
      if (isSuperAdminModule(normalizedModuleName)) {
        console.warn(
          `[useModuleAccess] ❌ Regular user blocked from accessing super-admin module: ${moduleName}`
        );
        return {
          canAccess: false,
          isLoading: false,
          error: null,
          isSuperAdmin: false,
          reason: 'Regular users cannot access super-admin module',
        };
      }

      // RULE 5: Regular user accessing tenant module - check RBAC permissions
      if (isTenantModule(normalizedModuleName)) {
        try {
          // Get FRS-compliant permission key for the module
          const readPermissionKey = MODULE_PERMISSION_MAP[normalizedModuleName];

          if (!readPermissionKey) {
            console.warn(`[useModuleAccess] No FRS permission mapping found for module: ${moduleName}`);
            return {
              canAccess: false,
              isLoading: false,
              error: null,
              isSuperAdmin: false,
              reason: 'No permission mapping configured for this module',
            };
          }

          const canAccessModule = authService.hasPermission(readPermissionKey);

          if (canAccessModule) {
            console.log(
              `[useModuleAccess] ✅ Regular user granted access to module: ${moduleName}`
            );
            return {
              canAccess: true,
              isLoading: false,
              error: null,
              isSuperAdmin: false,
              reason: 'User has required permissions',
            };
          } else {
            console.warn(
              `[useModuleAccess] ❌ Regular user denied access to module: ${moduleName} - insufficient permissions`
            );
            return {
              canAccess: false,
              isLoading: false,
              error: null,
              isSuperAdmin: false,
              reason: 'Insufficient permissions to access this module',
            };
          }
        } catch (err) {
          console.error(`[useModuleAccess] Error checking permissions for ${moduleName}:`, err);
          return {
            canAccess: false,
            isLoading: false,
            error: err instanceof Error ? err : new Error('Failed to check permissions'),
            isSuperAdmin: false,
            reason: 'Error checking permissions',
          };
        }
      }

      // Default: deny access to unknown module
      console.warn(`[useModuleAccess] ❌ Access denied to unknown module: ${moduleName}`);
      return {
        canAccess: false,
        isLoading: false,
        error: null,
        isSuperAdmin: false,
        reason: 'Unknown module or access not configured',
      };
    },
    enabled: !!user && !authLoading, // Only query when user is loaded
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
    retry: false, // Don't retry permission checks
  });

  // Invalidate cache when user changes (logout, login, role change)
  if (user && data && (data as ModuleAccessResult).isSuperAdmin !== user.isSuperAdmin) {
    queryClient.invalidateQueries({ queryKey: ['moduleAccess'] });
  }

  return {
    canAccess: (data as ModuleAccessResult)?.canAccess ?? false,
    isLoading: authLoading || isLoading,
    error: (data as ModuleAccessResult)?.error || (error instanceof Error ? error : null),
    isSuperAdmin: (data as ModuleAccessResult)?.isSuperAdmin ?? false,
    reason: (data as ModuleAccessResult)?.reason,
  };
}

/**
 * Hook to get list of accessible modules for current user
 * 
 * **Usage**:
 * ```typescript
 * const { modules, isLoading } = useAccessibleModules();
 * 
 * return (
 *   <nav>
 *     {modules.map(module => (
 *       <Link key={module} to={`/${module}`}>{module}</Link>
 *     ))}
 *   </nav>
 * );
 * ```
 * 
 * @returns Object containing accessible modules array and loading state
 */
export function useAccessibleModules() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: accessibleModules = [], isLoading } = useQuery({
    queryKey: ['accessibleModules', user?.id],
    queryFn: async (): Promise<string[]> => {
      if (!user) {
        return [];
      }

      const userIsSuperAdmin = user.isSuperAdmin === true;
      const modules: string[] = [];

      // Super admins can only access super-admin modules
      if (userIsSuperAdmin) {
        return SUPER_ADMIN_ONLY_MODULES;
      }

      // Regular users can access tenant modules (with permission checks)
      for (const module of TENANT_MODULES) {
        const readPermissionKey = MODULE_PERMISSION_MAP[module];

        if (!readPermissionKey) {
          console.warn(`[useAccessibleModules] No FRS permission mapping found for module: ${module}`);
          continue;
        }

        const hasAccess = authService.hasPermission(readPermissionKey);

        if (hasAccess) {
          modules.push(module);
        }
      }

      console.log(
        `[useAccessibleModules] User ${user.id} has access to modules:`,
        modules
      );
      return modules;
    },
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
  });

  return {
    modules: accessibleModules,
    isLoading: authLoading || isLoading,
    isSuperAdmin: user?.isSuperAdmin ?? false,
  };
}

export default useModuleAccess;
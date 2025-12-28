/**
 * ModuleProtectedRoute Component
 * 
 * Route guard component that enforces module-level access control.
 * 
 * **Functionality**:
 * - Checks if user has access to specified module using useModuleAccess hook
 * - Shows loading spinner while permission check is in progress
 * - Shows "Access Denied" UI if user lacks permission
 * - Logs unauthorized access attempts to audit trail
 * - Renders children if access is granted
 * 
 * **Super Admin Isolation**:
 * - Super admins can only access super-admin module
 * - Regular users cannot access super-admin module
 * - Access is controlled by isSuperAdmin field and RBAC permissions
 * 
 * **Usage**:
 * ```typescript
 * <ModuleProtectedRoute moduleName="customers">
 *   <CustomerModule />
 * </ModuleProtectedRoute>
 * 
 * // With custom fallback
 * <ModuleProtectedRoute 
 *   moduleName="customers"
 *   fallback={<CustomAccessDenied />}
 * >
 *   <CustomerModule />
 * </ModuleProtectedRoute>
 * ```
 * 
 * @see useModuleAccess - Hook that provides access checking logic
 * @see ProtectedRoute - Component-level authentication guard
 */

import React, { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useModuleAccess } from '@/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { auditService } from '@/services';

/**
 * Props for ModuleProtectedRoute component
 * @interface ModuleProtectedRouteProps
 */
interface ModuleProtectedRouteProps {
  /** Name of the module to check access for */
  moduleName: string;
  
  /** Child components to render if access granted */
  children: React.ReactNode;
  
  /** Optional custom fallback UI for access denied */
  fallback?: React.ReactNode;
  
  /** Optional callback when access is denied */
  onAccessDenied?: (reason: string) => void;
}

/**
 * Default Access Denied UI Component
 * Used when no custom fallback is provided
 * 
 * @component
 * @param reason - Reason why access was denied
 */
function DefaultAccessDenied({ reason }: { reason?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
      <div className="text-center max-w-md px-6">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M13.477 14.89A6 6 0 015.11 2.697m0 11.192A6 6 0 0014.89 5.11M1.414 1.414a6 6 0 018.485 8.485m0-8.485a6 6 0 018.485 8.485"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        
        <p className="text-gray-600 mb-6">
          You don't have permission to access this module.
        </p>
        
        {reason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">
              <span className="font-semibold">Reason:</span> {reason}
            </p>
          </div>
        )}
        
        <p className="text-sm text-gray-500">
          If you believe this is a mistake, please contact your administrator.
        </p>
      </div>
    </div>
  );
}

/**
 * Loading Spinner Component
 * Displayed while module access is being verified
 * 
 * @component
 */
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center mb-6">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 bg-blue-200 rounded-full animate-pulse"></div>
            <div className="absolute inset-1 bg-blue-100 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="absolute inset-2 bg-white rounded-full"></div>
          </div>
        </div>
        
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Checking Access</h2>
        <p className="text-gray-600">Verifying your permissions...</p>
      </div>
    </div>
  );
}

/**
 * ModuleProtectedRoute Component
 * 
 * Enforces module-level access control using the useModuleAccess hook.
 * Handles all states: loading, access granted, access denied.
 * 
 * **Access Rules**:
 * - Super admins: Can only access super-admin module
 * - Regular users: Subject to RBAC permissions for tenant modules
 * 
 * **States Handled**:
 * 1. **Loading**: Permission check in progress
 * 2. **Granted**: User has access to module
 * 3. **Denied**: User lacks permission (logs to audit trail)
 * 
 * @component
 * @param props - Component props
 * @returns Rendered component or access denied/loading UI
 * 
 * @example
 * // Basic usage
 * <ModuleProtectedRoute moduleName="customers">
 *   <CustomerModule />
 * </ModuleProtectedRoute>
 * 
 * @example
 * // With custom fallback
 * <ModuleProtectedRoute 
 *   moduleName="customers"
 *   fallback={<CustomDenied />}
 * >
 *   <CustomerModule />
 * </ModuleProtectedRoute>
 */
const ModuleProtectedRoute: React.FC<ModuleProtectedRouteProps> = ({
  moduleName,
  children,
  fallback,
  onAccessDenied,
}) => {
  const { canAccess, isLoading, error, isSuperAdmin, reason } = useModuleAccess(moduleName);
  const { user } = useAuth();

  // Log unauthorized access attempts
  useEffect(() => {
    if (!isLoading && !canAccess && user) {
      console.warn(
        `[ModuleProtectedRoute] Unauthorized access attempt by user ${user.id} to module ${moduleName}. Reason: ${reason}`
      );

      // Try to log to audit trail
      try {
        auditService.logAction(
          'UNAUTHORIZED_MODULE_ACCESS',
          `module:${moduleName}`,
          moduleName,
          undefined, // changes
          {
            reason,
            isSuperAdmin,
            module: moduleName,
            userId: user.id,
            status: 'denied',
          }
        );
      } catch (auditError) {
        console.error('[ModuleProtectedRoute] Failed to log unauthorized access:', auditError);
      }

      // Call optional callback
      if (onAccessDenied) {
        onAccessDenied(reason || 'Unknown');
      }
    }
  }, [isLoading, canAccess, user, reason, isSuperAdmin, moduleName, onAccessDenied]);

  // Handle error state
  if (error) {
    console.error(
      `[ModuleProtectedRoute] Error checking module access for ${moduleName}:`,
      error
    );
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="text-center max-w-md px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">
            An error occurred while checking your access permissions.
          </p>
          <p className="text-sm text-gray-500">
            {error.message || 'Please try again later.'}
          </p>
        </div>
      </div>
    );
  }

  // Show loading spinner while checking access
  if (isLoading) {
    console.log(`[ModuleProtectedRoute] Checking access for module: ${moduleName}`);
    return <LoadingSpinner />;
  }

  // Access granted - render children
  if (canAccess) {
    console.log(`[ModuleProtectedRoute] ✅ Access granted to module: ${moduleName}`);
    return <>{children}</>;
  }

  // Access denied - show fallback UI
  console.warn(
    `[ModuleProtectedRoute] ❌ Access denied to module: ${moduleName}. Reason: ${reason}`
  );

  return (
    <>
      {fallback || <DefaultAccessDenied reason={reason} />}
    </>
  );
};

ModuleProtectedRoute.displayName = 'ModuleProtectedRoute';

export default ModuleProtectedRoute;

/**
 * Export helper components for advanced use cases
 */
export { DefaultAccessDenied, LoadingSpinner };
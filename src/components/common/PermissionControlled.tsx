/**
 * PermissionControlled Component
 * Conditionally renders children based on element-level permissions
 *
 * Follows strict layer synchronization rules:
 * - Uses factory service pattern (no direct imports)
 * - Handles loading/error states properly
 * - Supports fallback rendering
 * - Database-driven permission evaluation
 */

import React, { useState, useEffect } from 'react';
import { elementPermissionService } from '@/services/serviceFactory';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';
import { PermissionContext } from '@/types/rbac';

interface PermissionControlledProps {
  /** Element path (e.g., "contacts:list:button.create") */
  elementPath: string;
  /** Action to check ('visible' | 'enabled' | 'editable' | 'accessible') */
  action: 'visible' | 'enabled' | 'editable' | 'accessible';
  /** Fallback content to render when permission is denied */
  fallback?: React.ReactNode;
  /** Additional context for permission evaluation */
  context?: Partial<PermissionContext>;
  /** Children to render when permission is granted */
  children: React.ReactNode;
  /** Whether to show loading state */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
}

export const PermissionControlled: React.FC<PermissionControlledProps> = ({
  elementPath,
  action,
  fallback = null,
  context: additionalContext = {},
  children,
  showLoading = true,
  loadingComponent
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useCurrentUser();
  const currentTenant = useCurrentTenant();

  useEffect(() => {
    const evaluatePermission = async () => {
      if (!currentUser || !currentTenant) {
        setHasPermission(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const permissionContext: PermissionContext = {
          user: currentUser,
          tenant: currentTenant,
          elementPath,
          action,
          ...additionalContext
        };

        const result = await elementPermissionService.evaluateElementPermission(
          elementPath,
          action,
          permissionContext
        );

        setHasPermission(result);
      } catch (err) {
        console.error('[PermissionControlled] Error evaluating permission:', err);
        setError(err instanceof Error ? err.message : 'Permission evaluation failed');
        setHasPermission(false); // Fail-safe: deny access on error
      } finally {
        setIsLoading(false);
      }
    };

    evaluatePermission();
  }, [currentUser, currentTenant, elementPath, action, additionalContext]);

  // Show loading state
  if (isLoading && showLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    return (
      <div className="permission-loading" aria-live="polite">
        <div className="animate-pulse bg-gray-200 rounded h-4 w-20"></div>
      </div>
    );
  }

  // Show error state (only in development)
  if (error && process.env.NODE_ENV === 'development') {
    console.warn(`[PermissionControlled] Permission evaluation error for ${elementPath}:${action}:`, error);
  }

  // Render based on permission
  if (hasPermission === true) {
    return <>{children}</>;
  }

  // Render fallback or nothing
  return <>{fallback}</>;
};

// Higher-order component for class components
export function withPermission<P extends object>(
  elementPath: string,
  action: 'visible' | 'enabled' | 'editable' | 'accessible',
  fallback?: React.ComponentType<P> | React.ReactNode
) {
  return function (WrappedComponent: React.ComponentType<P>) {
    return function WithPermissionComponent(props: P) {
      return (
        <PermissionControlled
          elementPath={elementPath}
          action={action}
          fallback={typeof fallback === 'function' ? React.createElement(fallback, props) : fallback}
        >
          <WrappedComponent {...props} />
        </PermissionControlled>
      );
    };
  };
}

// Hook version for conditional logic
export const usePermissionControlled = (
  elementPath: string,
  action: 'visible' | 'enabled' | 'editable' | 'accessible',
  context?: Partial<PermissionContext>
): {
  hasPermission: boolean | null;
  isLoading: boolean;
  error: string | null;
} => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useCurrentUser();
  const currentTenant = useCurrentTenant();

  useEffect(() => {
    const evaluatePermission = async () => {
      if (!currentUser || !currentTenant) {
        setHasPermission(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const permissionContext: PermissionContext = {
          user: currentUser,
          tenant: currentTenant,
          elementPath,
          action,
          ...context
        };

        const result = await elementPermissionService.evaluateElementPermission(
          elementPath,
          action,
          permissionContext
        );

        setHasPermission(result);
      } catch (err) {
        console.error('[usePermissionControlled] Error evaluating permission:', err);
        setError(err instanceof Error ? err.message : 'Permission evaluation failed');
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    };

    evaluatePermission();
  }, [currentUser, currentTenant, elementPath, action, context]);

  return { hasPermission, isLoading, error };
};
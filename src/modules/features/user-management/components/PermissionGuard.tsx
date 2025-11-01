/**
 * Permission Guard Component
 * Conditionally renders content based on user permissions
 * 
 * Usage:
 * <PermissionGuard permission="user:create">
 *   <Button>Create User</Button>
 * </PermissionGuard>
 */

import { ReactNode } from 'react';
import { Alert } from 'antd';
import { usePermissions } from '../hooks/usePermissions';
import { UserPermission } from '../guards/permissionGuards';

export interface PermissionGuardProps {
  /** Permission(s) required to render children */
  permission?: UserPermission | UserPermission[];
  
  /** Check mode: 'any' (OR) or 'all' (AND) */
  mode?: 'any' | 'all';
  
  /** Content to render if permitted */
  children: ReactNode;
  
  /** Content to render if denied (defaults to nothing) */
  fallback?: ReactNode;
  
  /** Show alert if denied (instead of rendering nothing) */
  showAlert?: boolean;
  
  /** Alert message if denied */
  alertMessage?: string;
}

/**
 * Permission Guard Component
 * Renders children only if user has required permission(s)
 */
export function PermissionGuard({
  permission,
  mode = 'any',
  children,
  fallback,
  showAlert = false,
  alertMessage = 'You do not have permission to access this feature',
}: PermissionGuardProps): ReactNode {
  const permissions = usePermissions();

  // If no permission specified, render children
  if (!permission) {
    return children;
  }

  // Check if user has required permission(s)
  let hasAccess = false;

  if (Array.isArray(permission)) {
    if (mode === 'all') {
      hasAccess = permission.every(p => permissions.hasPermission(p));
    } else {
      hasAccess = permission.some(p => permissions.hasPermission(p));
    }
  } else {
    hasAccess = permissions.hasPermission(permission);
  }

  // Render based on access
  if (hasAccess) {
    return children;
  }

  // Render denied state
  if (showAlert) {
    return (
      <Alert
        type="warning"
        message="Permission Denied"
        description={alertMessage}
        showIcon
        style={{ marginBottom: '16px' }}
      />
    );
  }

  return fallback;
}

export interface PermissionGateProps {
  /** Permission(s) required */
  permission?: UserPermission | UserPermission[];
  
  /** Children to render if permitted */
  children?: ReactNode;
  
  /** Render function for more control */
  render?: (hasPermission: boolean) => ReactNode;
}

/**
 * Permission Gate Component (Render Props Pattern)
 * Provides more control over rendering logic
 */
export function PermissionGate({
  permission,
  children,
  render,
}: PermissionGateProps): ReactNode {
  const permissions = usePermissions();

  let hasAccess = false;

  if (permission) {
    if (Array.isArray(permission)) {
      hasAccess = permission.every(p => permissions.hasPermission(p));
    } else {
      hasAccess = permissions.hasPermission(permission);
    }
  }

  if (render) {
    return render(hasAccess);
  }

  return children;
}

export interface RequirePermissionProps {
  /** Required permission */
  permission: UserPermission;
  
  /** Children to render */
  children: ReactNode;
  
  /** Trigger or UI element that requires permission */
  fallback?: ReactNode;
}

/**
 * Require Permission HOC
 * Disables or hides element if permission not granted
 */
export function RequirePermission({
  permission,
  children,
  fallback,
}: RequirePermissionProps): ReactNode {
  const permissions = usePermissions();
  const hasAccess = permissions.hasPermission(permission);

  if (!hasAccess) {
    return fallback;
  }

  return children;
}
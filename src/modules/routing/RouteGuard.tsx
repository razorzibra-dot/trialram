/**
 * Route Guard Component
 * Handles route protection and permission checking
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/core/store';
import { LoadingSpinner } from '@/modules/core/components/LoadingSpinner';

interface RouteGuardProps {
  children: React.ReactNode;
  permissions?: string[];
  roles?: string[];
  requireAuth?: boolean;
  fallbackPath?: string;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  permissions = [],
  roles = [],
  requireAuth = true,
  fallbackPath = '/login',
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  // Redirect to login if authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role requirements
  if (roles.length > 0 && user) {
    const hasRequiredRole = roles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check permission requirements
  if (permissions.length > 0 && user) {
    const hasRequiredPermission = permissions.some(permission => hasPermission(permission));
    if (!hasRequiredPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

// HOC for route protection
export function withRouteGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps?: Omit<RouteGuardProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <RouteGuard {...guardProps}>
      <Component {...props} />
    </RouteGuard>
  );

  WrappedComponent.displayName = `withRouteGuard(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Specific guards for common use cases
export const AdminRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard roles={['admin', 'super_admin']}>
    {children}
  </RouteGuard>
);

export const SuperAdminRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard roles={['super_admin']}>
    {children}
  </RouteGuard>
);

export const ManagerRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard roles={['manager', 'admin', 'super_admin']}>
    {children}
  </RouteGuard>
);

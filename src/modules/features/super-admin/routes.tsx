/**
 * Super Admin Routes
 * 
 * Routes are protected with ModuleProtectedRoute to enforce super admin isolation.
 * Regular users cannot access these routes and will see "Access Denied" message.
 * 
 * **Route Protection**:
 * - All super-admin routes are wrapped with ModuleProtectedRoute('super-admin')
 * - Access is controlled by User.isSuperAdmin flag
 * - Unauthorized access attempts are logged to audit trail
 * 
 * **Error Handling**:
 * - Loading state: Shows "Checking Access..." spinner
 * - Access denied: Shows "Access Denied" UI with reason
 * - Component errors: Shows error boundary UI
 * - Suspense: Shows "Loading..." while lazy loading component
 */
import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';
import ModuleProtectedRoute from '@/components/auth/ModuleProtectedRoute';

// Lazy load components
const SuperAdminDashboardPage = lazy(() => import('./views/SuperAdminDashboardPage'));
const SuperAdminTenantsPage = lazy(() => import('./views/SuperAdminTenantsPage'));
const SuperAdminUsersPage = lazy(() => import('./views/SuperAdminUsersPage'));
const SuperAdminAnalyticsPage = lazy(() => import('./views/SuperAdminAnalyticsPage'));
const SuperAdminHealthPage = lazy(() => import('./views/SuperAdminHealthPage'));
const SuperAdminConfigurationPage = lazy(() => import('./views/SuperAdminConfigurationPage'));
const SuperAdminRoleRequestsPage = lazy(() => import('./views/SuperAdminRoleRequestsPage'));
const SuperAdminImpersonationHistoryPage = lazy(() => import('./views/SuperAdminImpersonationHistoryPage'));
const SuperAdminLogsPage = lazy(() => import('./views/SuperAdminLogsPage'));

/**
 * Route wrapper with error boundary and module protection
 * 
 * Ensures super admin module access is enforced at route level.
 * Handles loading states during permission checks and component lazy loading.
 * 
 * @component
 * @param children - Child component to render
 */
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      {children}
    </React.Suspense>
  </ErrorBoundary>
);

/**
 * Super admin routes configuration
 * 
 * All routes are wrapped with ModuleProtectedRoute to ensure:
 * 1. Only super admins can access these routes
 * 2. Unauthorized access attempts are logged
 * 3. Regular users see access denied message
 * 
 * @constant
 */
export const superAdminRoutes: RouteObject[] = [
  {
    path: 'super-admin',
    element: (
      <ModuleProtectedRoute moduleName="super-admin">
        <div />
      </ModuleProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: (
          <ModuleProtectedRoute moduleName="super-admin">
            <RouteWrapper>
              <SuperAdminDashboardPage />
            </RouteWrapper>
          </ModuleProtectedRoute>
        ),
      },
      {
        path: 'tenants',
        element: (
          <ModuleProtectedRoute moduleName="super-admin">
            <RouteWrapper>
              <SuperAdminTenantsPage />
            </RouteWrapper>
          </ModuleProtectedRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <ModuleProtectedRoute moduleName="super-admin">
            <RouteWrapper>
              <SuperAdminUsersPage />
            </RouteWrapper>
          </ModuleProtectedRoute>
        ),
      },
      {
        path: 'analytics',
        element: (
          <ModuleProtectedRoute moduleName="super-admin">
            <RouteWrapper>
              <SuperAdminAnalyticsPage />
            </RouteWrapper>
          </ModuleProtectedRoute>
        ),
      },
      {
        path: 'health',
        element: (
          <ModuleProtectedRoute moduleName="super-admin">
            <RouteWrapper>
              <SuperAdminHealthPage />
            </RouteWrapper>
          </ModuleProtectedRoute>
        ),
      },
      {
        path: 'configuration',
        element: (
          <ModuleProtectedRoute moduleName="super-admin">
            <RouteWrapper>
              <SuperAdminConfigurationPage />
            </RouteWrapper>
          </ModuleProtectedRoute>
        ),
      },
      {
        path: 'role-requests',
        element: (
          <ModuleProtectedRoute moduleName="super-admin">
            <RouteWrapper>
              <SuperAdminRoleRequestsPage />
            </RouteWrapper>
          </ModuleProtectedRoute>
        ),
      },
      {
        path: 'impersonation-history',
        element: (
          <ModuleProtectedRoute moduleName="super-admin">
            <RouteWrapper>
              <SuperAdminImpersonationHistoryPage />
            </RouteWrapper>
          </ModuleProtectedRoute>
        ),
      },
      {
        path: 'logs',
        element: (
          <ModuleProtectedRoute moduleName="super-admin">
            <RouteWrapper>
              <SuperAdminLogsPage />
            </RouteWrapper>
          </ModuleProtectedRoute>
        ),
      },
    ],
  },
];
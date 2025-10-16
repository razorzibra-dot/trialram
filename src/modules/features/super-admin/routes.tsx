/**
 * Super Admin Routes
 */
import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';

// Lazy load components
const SuperAdminDashboardPage = lazy(() => import('./views/SuperAdminDashboardPage'));
const SuperAdminTenantsPage = lazy(() => import('./views/SuperAdminTenantsPage'));
const SuperAdminUsersPage = lazy(() => import('./views/SuperAdminUsersPage'));
const SuperAdminAnalyticsPage = lazy(() => import('./views/SuperAdminAnalyticsPage'));
const SuperAdminHealthPage = lazy(() => import('./views/SuperAdminHealthPage'));
const SuperAdminConfigurationPage = lazy(() => import('./views/SuperAdminConfigurationPage'));
const SuperAdminRoleRequestsPage = lazy(() => import('./views/SuperAdminRoleRequestsPage'));

// Route wrapper with error boundary
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <React.Suspense fallback={<div>Loading...</div>}>
      {children}
    </React.Suspense>
  </ErrorBoundary>
);

export const superAdminRoutes: RouteObject[] = [
  {
    path: 'super-admin',
    children: [
      {
        path: 'dashboard',
        element: (
          <RouteWrapper>
            <SuperAdminDashboardPage />
          </RouteWrapper>
        ),
      },
      {
        path: 'tenants',
        element: (
          <RouteWrapper>
            <SuperAdminTenantsPage />
          </RouteWrapper>
        ),
      },
      {
        path: 'users',
        element: (
          <RouteWrapper>
            <SuperAdminUsersPage />
          </RouteWrapper>
        ),
      },
      {
        path: 'analytics',
        element: (
          <RouteWrapper>
            <SuperAdminAnalyticsPage />
          </RouteWrapper>
        ),
      },
      {
        path: 'health',
        element: (
          <RouteWrapper>
            <SuperAdminHealthPage />
          </RouteWrapper>
        ),
      },
      {
        path: 'configuration',
        element: (
          <RouteWrapper>
            <SuperAdminConfigurationPage />
          </RouteWrapper>
        ),
      },
      {
        path: 'role-requests',
        element: (
          <RouteWrapper>
            <SuperAdminRoleRequestsPage />
          </RouteWrapper>
        ),
      },
    ],
  },
];
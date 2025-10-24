/**
 * User Management Routes
 * Nested routes structure matching navigation config
 * Creates routes: /tenant/users/list, /tenant/users/roles, /tenant/users/permissions
 */
import React, { lazy, Suspense } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';
import { LoadingSpinner } from '@/modules/core/components/LoadingSpinner';

// Lazy load components for code splitting
const UsersPage = lazy(() => import('./views/UsersPage'));
const UserManagementPage = lazy(() => import('./views/UserManagementPage'));
const RoleManagementPage = lazy(() => import('./views/RoleManagementPage'));
const PermissionMatrixPage = lazy(() => import('./views/PermissionMatrixPage'));

// Route wrapper with error boundary and suspense
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner text="Loading..." />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const userManagementRoutes: RouteObject[] = [
  {
    path: 'users',
    children: [
      {
        index: true,
        element: <Navigate to="list" replace />,
      },
      {
        path: 'list',
        element: (
          <RouteWrapper>
            <UsersPage />
          </RouteWrapper>
        ),
      },
      {
        path: 'roles',
        element: (
          <RouteWrapper>
            <RoleManagementPage />
          </RouteWrapper>
        ),
      },
      {
        path: 'permissions',
        element: (
          <RouteWrapper>
            <PermissionMatrixPage />
          </RouteWrapper>
        ),
      },
    ],
  },
  // Keep user-management route for backward compatibility if referenced elsewhere
  {
    path: 'user-management',
    element: (
      <RouteWrapper>
        <UserManagementPage />
      </RouteWrapper>
    ),
  },
];
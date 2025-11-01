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
const RoleManagementPage = lazy(() => import('./views/RoleManagementPage'));
const PermissionMatrixPage = lazy(() => import('./views/PermissionMatrixPage'));

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
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner text="Loading..." />}>
              <UsersPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'roles',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner text="Loading..." />}>
              <RoleManagementPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'permissions',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner text="Loading..." />}>
              <PermissionMatrixPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
    ],
  },
  // Backward compatibility: redirect legacy user-management route to new users/list route
  {
    path: 'user-management',
    element: <Navigate to="/users/list" replace />,
  },
];
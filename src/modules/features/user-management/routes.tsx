/**
 * User Management Routes
 */
import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';

// Lazy load components
const UsersPage = lazy(() => import('./views/UsersPage'));
const UserManagementPage = lazy(() => import('./views/UserManagementPage'));
const RoleManagementPage = lazy(() => import('./views/RoleManagementPage'));
const PermissionMatrixPage = lazy(() => import('./views/PermissionMatrixPage'));

// Route wrapper with error boundary
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <React.Suspense fallback={<div>Loading...</div>}>
      {children}
    </React.Suspense>
  </ErrorBoundary>
);

export const userManagementRoutes: RouteObject[] = [
  {
    path: 'users',
    element: (
      <RouteWrapper>
        <UsersPage />
      </RouteWrapper>
    ),
  },
  {
    path: 'user-management',
    element: (
      <RouteWrapper>
        <UserManagementPage />
      </RouteWrapper>
    ),
  },
  {
    path: 'role-management',
    element: (
      <RouteWrapper>
        <RoleManagementPage />
      </RouteWrapper>
    ),
  },
  {
    path: 'permission-matrix',
    element: (
      <RouteWrapper>
        <PermissionMatrixPage />
      </RouteWrapper>
    ),
  },
];
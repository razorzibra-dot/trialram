/**
 * Customer Routes
 * Route configuration for customer module
 */

import React from 'react';
import { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';

// Lazy load components
const CustomerListPage = React.lazy(() => import('./views/CustomerListPage'));
const CustomerDetailPage = React.lazy(() => import('./views/CustomerDetailPage'));
const CustomerCreatePage = React.lazy(() => import('./views/CustomerCreatePage'));
const CustomerEditPage = React.lazy(() => import('./views/CustomerEditPage'));

// Route wrapper with error boundary
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <React.Suspense fallback={<div>Loading...</div>}>
      {children}
    </React.Suspense>
  </ErrorBoundary>
);

export const customerRoutes: RouteObject[] = [
  {
    path: 'customers',
    children: [
      {
        index: true,
        element: (
          <RouteWrapper>
            <CustomerListPage />
          </RouteWrapper>
        ),
      },
      {
        path: 'new',
        element: (
          <RouteWrapper>
            <CustomerCreatePage />
          </RouteWrapper>
        ),
      },
      {
        path: ':id',
        element: (
          <RouteWrapper>
            <CustomerDetailPage />
          </RouteWrapper>
        ),
      },
      {
        path: ':id/edit',
        element: (
          <RouteWrapper>
            <CustomerEditPage />
          </RouteWrapper>
        ),
      },
    ],
  },
];

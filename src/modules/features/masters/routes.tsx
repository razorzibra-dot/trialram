/**
 * Masters Routes
 * Route definitions for the masters module
 */

import React, { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';
import { LoadingSpinner } from '@/modules/core/components/LoadingSpinner';

// Lazy load components for code splitting
const CompaniesPage = lazy(() => import('./views/CompaniesPage').then(m => ({ default: m.CompaniesPage })));
const ProductsPage = lazy(() => import('./views/ProductsPage').then(m => ({ default: m.ProductsPage })));

// Route wrapper with error boundary and suspense
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner text="Loading..." />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const mastersRoutes: RouteObject[] = [
  {
    path: 'masters',
    children: [
      {
        path: 'companies',
        element: (
          <RouteWrapper>
            <CompaniesPage />
          </RouteWrapper>
        ),
      },
      {
        path: 'products',
        element: (
          <RouteWrapper>
            <ProductsPage />
          </RouteWrapper>
        ),
      },
    ],
  },
];

export default mastersRoutes;

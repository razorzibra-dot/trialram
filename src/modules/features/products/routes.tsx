/**
 * Product Routes
 * Route configuration for product module
 */

import React from 'react';
import { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';

// Lazy load components
const ProductListPage = React.lazy(() => import('./components/views/ProductListPage'));

// Route wrapper with error boundary
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <React.Suspense fallback={<div>Loading...</div>}>
      {children}
    </React.Suspense>
  </ErrorBoundary>
);

export const productRoutes: RouteObject[] = [
  {
    path: 'products',
    children: [
      {
        index: true,
        element: (
          <RouteWrapper>
            <ProductListPage />
          </RouteWrapper>
        ),
      },
    ],
  },
];
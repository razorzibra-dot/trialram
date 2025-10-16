/**
 * Product Sales Module Routes
 * Defines routing for product sales pages
 */

import React, { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';
import { LoadingSpinner } from '@/modules/core/components/LoadingSpinner';

// Lazy load product sales pages
const ProductSalesPage = lazy(() => import('./views/ProductSalesPage').then(m => ({ default: m.ProductSalesPage })));

// Route wrapper with error boundary and suspense
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner text="Loading product sales..." />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const productSalesRoutes = [
  {
    path: 'product-sales',
    element: (
      <RouteWrapper>
        <ProductSalesPage />
      </RouteWrapper>
    )
  }
];

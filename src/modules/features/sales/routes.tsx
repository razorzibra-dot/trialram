/**
 * Sales Routes
 * Route definitions for the sales module
 */

import React, { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';
import { LoadingSpinner } from '@/modules/core/components/LoadingSpinner';

// Lazy load components for code splitting
const SalesPage = lazy(() => import('./views/SalesPage').then(m => ({ default: m.SalesPage })));
const LeadsPage = lazy(() => import('./views/LeadsPage').then(m => ({ default: m.LeadsPage })));

// Route wrapper with error boundary and suspense
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner text="Loading sales..." />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const salesRoutes: RouteObject[] = [
  {
    path: 'sales',
    element: (
      <RouteWrapper>
        <SalesPage />
      </RouteWrapper>
    ),
  },
  {
    path: 'leads',
    element: (
      <RouteWrapper>
        <LeadsPage />
      </RouteWrapper>
    ),
  },
];

export default salesRoutes;

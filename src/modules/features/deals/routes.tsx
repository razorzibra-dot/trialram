/**
 * Deals Routes
 * Route definitions for the deals module
 */

import React, { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';
import { LoadingSpinner } from '@/modules/core/components/LoadingSpinner';

// Lazy load components for code splitting
const DealsPage = lazy(() => import('./views/DealsPage').then(m => ({ default: m.DealsPage })));
const LeadsPage = lazy(() => import('./views/LeadsPage').then(m => ({ default: m.LeadsPage })));

// Route wrapper with error boundary and suspense
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner text="Loading deals..." />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const dealsRoutes: RouteObject[] = [
  {
    path: 'deals',
    element: (
      <RouteWrapper>
        <DealsPage />
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

export default dealsRoutes;

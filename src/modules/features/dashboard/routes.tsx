/**
 * Dashboard Routes
 * Route definitions for the dashboard module
 */

import React, { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';
import { LoadingSpinner } from '@/modules/core/components/LoadingSpinner';

// Lazy load components for code splitting
const DashboardPage = lazy(() => import('./views/DashboardPage').then(m => ({ default: m.DashboardPage })));

// Route wrapper with error boundary and suspense
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner text="Loading dashboard..." />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: (
      <RouteWrapper>
        <DashboardPage />
      </RouteWrapper>
    ),
  },
];

export default dashboardRoutes;

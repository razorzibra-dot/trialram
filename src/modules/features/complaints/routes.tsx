/**
 * Complaints Routes
 * Route definitions for the complaints module
 */

import React, { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';
import { LoadingSpinner } from '@/modules/core/components/LoadingSpinner';

// Lazy load components for code splitting
const ComplaintsPage = lazy(() => import('./views/ComplaintsPage').then(m => ({ default: m.ComplaintsPage })));

// Route wrapper with error boundary and suspense
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner text="Loading complaints..." />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const complaintsRoutes: RouteObject[] = [
  {
    path: 'complaints',
    element: (
      <RouteWrapper>
        <ComplaintsPage />
      </RouteWrapper>
    ),
  },
];

export default complaintsRoutes;
/**
 * Complaints Routes
 */
import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';

// Lazy load components
const ComplaintsPage = lazy(() => import('./views/ComplaintsPage'));

// Route wrapper with error boundary
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <React.Suspense fallback={<div>Loading...</div>}>
      {children}
    </React.Suspense>
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
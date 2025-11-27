/**
 * Job Works Routes
 * Routes for job work and project management functionality
 */
import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';

// Lazy load components (to be created)
const JobWorksPage = lazy(() => import('./views/JobWorksPage'));
const JobWorkDetailPage = lazy(() => import('./views/JobWorkDetailPage'));

/**
 * Route wrapper with error boundary
 */
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      {children}
    </React.Suspense>
  </ErrorBoundary>
);

/**
 * Job Works routes configuration
 */
export const jobWorksRoutes: RouteObject[] = [
  {
    path: 'job-works',
    element: <div />, // Parent route container
    children: [
      {
        path: '',
        element: (
          <RouteWrapper>
            <JobWorksPage />
          </RouteWrapper>
        ),
      },
      {
        path: ':id',
        element: (
          <RouteWrapper>
            <JobWorkDetailPage />
          </RouteWrapper>
        ),
      },
    ],
  },
];
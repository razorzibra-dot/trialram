/**
 * JobWorks Routes
 * Route definitions for the jobworks module
 */

import React, { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';
import { LoadingSpinner } from '@/modules/core/components/LoadingSpinner';

// Lazy load components for code splitting
const JobWorksPage = lazy(() => import('./views/JobWorksPage').then(m => ({ default: m.JobWorksPage })));

// Route wrapper with error boundary and suspense
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner text="Loading job works..." />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const jobWorksRoutes: RouteObject[] = [
  {
    path: 'job-works',
    element: (
      <RouteWrapper>
        <JobWorksPage />
      </RouteWrapper>
    ),
  },
];

export default jobWorksRoutes;

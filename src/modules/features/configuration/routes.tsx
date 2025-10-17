/**
 * Configuration Routes
 */
import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';

// Lazy load components
const TenantConfigurationPage = lazy(() => import('./views/TenantConfigurationPage'));
const ConfigurationTestPage = lazy(() => import('./views/ConfigurationTestPage'));

export const configurationRoutes: RouteObject[] = [
  {
    path: 'configuration',
    element: (
      <ErrorBoundary>
        <React.Suspense fallback={<div>Loading...</div>}>
          <TenantConfigurationPage />
        </React.Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: 'tenant-configuration',
    element: (
      <ErrorBoundary>
        <React.Suspense fallback={<div>Loading...</div>}>
          <TenantConfigurationPage />
        </React.Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: 'configuration-test',
    element: (
      <ErrorBoundary>
        <React.Suspense fallback={<div>Loading...</div>}>
          <ConfigurationTestPage />
        </React.Suspense>
      </ErrorBoundary>
    ),
  },
];
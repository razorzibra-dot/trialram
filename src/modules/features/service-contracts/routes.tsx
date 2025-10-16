/**
 * Service Contracts Routes
 */
import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';

// Lazy load components
const ServiceContractsPage = lazy(() => import('./views/ServiceContractsPage'));
const ServiceContractDetailPage = lazy(() => import('./views/ServiceContractDetailPage'));

// Route wrapper with error boundary
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <React.Suspense fallback={<div>Loading...</div>}>
      {children}
    </React.Suspense>
  </ErrorBoundary>
);

export const serviceContractsRoutes: RouteObject[] = [
  {
    path: 'service-contracts',
    children: [
      {
        index: true,
        element: (
          <RouteWrapper>
            <ServiceContractsPage />
          </RouteWrapper>
        ),
      },
      {
        path: ':id',
        element: (
          <RouteWrapper>
            <ServiceContractDetailPage />
          </RouteWrapper>
        ),
      },
    ],
  },
];
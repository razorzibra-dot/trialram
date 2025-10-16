/**
 * Contracts Routes
 * Route definitions for the contracts module
 */

import React, { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';
import { LoadingSpinner } from '@/modules/core/components/LoadingSpinner';

// Lazy load components for code splitting
const ContractsPage = lazy(() => import('./views/ContractsPage').then(m => ({ default: m.ContractsPage })));
const ContractDetailPage = lazy(() => import('./views/ContractDetailPage').then(m => ({ default: m.ContractDetailPage })));

// Route wrapper with error boundary and suspense
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner text="Loading contracts..." />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const contractsRoutes: RouteObject[] = [
  {
    path: 'contracts',
    element: (
      <RouteWrapper>
        <ContractsPage />
      </RouteWrapper>
    ),
  },
  {
    path: 'contracts/:id',
    element: (
      <RouteWrapper>
        <ContractDetailPage />
      </RouteWrapper>
    ),
  },
];

export default contractsRoutes;

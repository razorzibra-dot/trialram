/**
 * Tickets Routes
 * Route definitions for the tickets module
 */

import React, { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';
import { LoadingSpinner } from '@/modules/core/components/LoadingSpinner';

// Lazy load components for code splitting
const TicketsPage = lazy(() => import('./views/TicketsPage').then(m => ({ default: m.TicketsPage })));

// Route wrapper with error boundary and suspense
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner text="Loading tickets..." />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const ticketsRoutes: RouteObject[] = [
  {
    path: 'tickets',
    element: (
      <RouteWrapper>
        <TicketsPage />
      </RouteWrapper>
    ),
  },
];

export default ticketsRoutes;

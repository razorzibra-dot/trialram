/**
 * Customer Routes
 * Route configuration for customer module
 */

import React from 'react';
import { RouteObject } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';
import { ModuleDataProvider } from '@/contexts/ModuleDataContext';
import { PageDataRequirements } from '@/services/page/PageDataService';

// Lazy load components
const CustomerListPage = React.lazy(() => import('./views/CustomerListPage'));
const CustomerAnalyticsPage = React.lazy(() => import('./views/CustomerAnalyticsPage'));

const CUSTOMERS_PAGE_REQUIREMENTS: PageDataRequirements = {
  session: true,
  // Do not fetch reference data here; it's prewarmed by ReferenceDataContext
  module: {
    customers: true,
    users: true,
  },
};

// Route wrapper with error boundary
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <React.Suspense fallback={<div>Loading...</div>}>
      {children}
    </React.Suspense>
  </ErrorBoundary>
);

export const customerRoutes: RouteObject[] = [
  {
    path: 'customers',
    children: [
      {
        index: true,
        element: (
          <RouteWrapper>
            <ModuleDataProvider requirements={CUSTOMERS_PAGE_REQUIREMENTS}>
              <CustomerListPage />
            </ModuleDataProvider>
          </RouteWrapper>
        ),
      },
      {
        path: 'analytics',
        element: (
          <RouteWrapper>
            <ModuleDataProvider requirements={CUSTOMERS_PAGE_REQUIREMENTS}>
              <CustomerAnalyticsPage />
            </ModuleDataProvider>
          </RouteWrapper>
        ),
      },
    ],
  },
];

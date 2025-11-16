/**
 * Configuration Routes
 * 
 * Nested routing structure for Configuration module:
 * - /tenant/configuration (parent) → redirects to /tenant/configuration/tenant
 * - /tenant/configuration/tenant → TenantConfigurationPage (Tenant Settings)
 * - /tenant/configuration/pdf-templates → PDFTemplatesPage (PDF Templates)
 * 
 * Backward compatible routes maintained:
 * - /tenant/tenant-configuration (old route, still works)
 * 
 * This structure aligns with:
 * 1. Navigation configuration in src/config/navigationPermissions.ts
 * 2. Application routing patterns (Masters, User Management modules)
 * 3. React Router nested routing best practices
 */
import React, { lazy, Suspense } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';
import { LoadingSpinner } from '@/modules/core/components/LoadingSpinner';

// Lazy load components
const TenantConfigurationPage = lazy(() => import('./views/TenantConfigurationPage'));
const ConfigurationTestPage = lazy(() => import('./views/ConfigurationTestPage'));

/**
 * Route wrapper component with error boundary and loading spinner
 * Provides consistent error handling and loading UI across all routes
 */
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner size="lg" text="Loading configuration..." />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

/**
 * Configuration module routes with nested structure
 * Parent path: 'configuration'
 * Children: tenant (index), pdf-templates, test (for backward compatibility)
 */
export const configurationRoutes: RouteObject[] = [
  {
    path: 'configuration',
    children: [
      {
        index: true,
        element: <Navigate to="tenant" replace />,
      },
      {
        path: 'tenant',
        element: (
          <RouteWrapper>
            <TenantConfigurationPage />
          </RouteWrapper>
        ),
      },
      {
        path: 'test',
        element: (
          <RouteWrapper>
            <ConfigurationTestPage />
          </RouteWrapper>
        ),
      },
    ],
  },
  // Backward compatibility: old flat routes still work
  {
    path: 'tenant-configuration',
    element: (
      <RouteWrapper>
        <TenantConfigurationPage />
      </RouteWrapper>
    ),
  },
  {
    path: 'configuration-test',
    element: (
      <RouteWrapper>
        <ConfigurationTestPage />
      </RouteWrapper>
    ),
  },
];
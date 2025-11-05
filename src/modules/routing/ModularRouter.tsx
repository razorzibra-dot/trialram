/**
 * Modular Router
 * Creates router configuration from registered modules with access control guards
 * 
 * **Module Access Control**:
 * - All module routes are wrapped with ModuleProtectedRoute
 * - Super admin routes enforced to super admins only (isSuperAdmin=true, tenantId=null)
 * - Tenant routes enforced based on RBAC permissions
 * - Unauthorized access attempts are logged to audit trail
 */

import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { moduleRegistry } from '../ModuleRegistry';
import { ErrorBoundary } from '@/modules/core/components/ErrorBoundary';
import { RootRedirect } from './RootRedirect';

// Import existing layouts
import RootLayout from '@/components/layout/RootLayout';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ModuleProtectedRoute from '@/components/auth/ModuleProtectedRoute';
import AppProviders from '@/components/providers/AppProviders';

// Import modular auth pages
import LoginPage from '@/modules/features/auth/views/LoginPage';
import NotFoundPage from '@/modules/features/auth/views/NotFoundPage';
import DemoAccountsPage from '@/modules/features/auth/views/DemoAccountsPage';

// Import modular components (lazy loaded)
import { Suspense, lazy } from 'react';
import { LoadingSpinner } from '@/modules/core/components/LoadingSpinner';

// Lazy load modular pages
const DashboardPage = lazy(() => import('@/modules/features/dashboard/views/DashboardPage').then(m => ({ default: m.DashboardPage })));
const SalesPage = lazy(() => import('@/modules/features/sales/views/SalesPage').then(m => ({ default: m.SalesPage })));
const TicketsPage = lazy(() => import('@/modules/features/tickets/views/TicketsPage').then(m => ({ default: m.TicketsPage })));
const JobWorksPage = lazy(() => import('@/modules/features/jobworks/views/JobWorksPage').then(m => ({ default: m.JobWorksPage })));
const CustomersPage = lazy(() => import('@/modules/features/customers/views/CustomerListPage'));
const CompaniesPage = lazy(() => import('@/modules/features/masters/views/CompaniesPage').then(m => ({ default: m.CompaniesPage })));
const ProductsPage = lazy(() => import('@/modules/features/masters/views/ProductsPage').then(m => ({ default: m.ProductsPage })));
const ContractsPage = lazy(() => import('@/modules/features/contracts/views/ContractsPage').then(m => ({ default: m.ContractsPage })));

// Lazy load additional modular pages
const ComplaintsPage = lazy(() => import('@/modules/features/complaints/views/ComplaintsPage'));
const UsersPage = lazy(() => import('@/modules/features/user-management/views/UsersPage'));
// ✅ CONSOLIDATED: UserManagementPage removed (legacy duplicate, consolidated into UsersPage)
const RoleManagementPage = lazy(() => import('@/modules/features/user-management/views/RoleManagementPage'));
const PermissionMatrixPage = lazy(() => import('@/modules/features/user-management/views/PermissionMatrixPage'));
const LogsPage = lazy(() => import('@/modules/features/audit-logs/views/LogsPage'));
const ServiceContractsPage = lazy(() => import('@/modules/features/service-contracts/views/ServiceContractsPage'));
const ServiceContractDetailPage = lazy(() => import('@/modules/features/service-contracts/views/ServiceContractDetailPage'));
const NotificationsPage = lazy(() => import('@/modules/features/notifications/views/NotificationsPage'));
const TenantConfigurationPage = lazy(() => import('@/modules/features/configuration/views/TenantConfigurationPage'));
const ConfigurationTestPage = lazy(() => import('@/modules/features/configuration/views/ConfigurationTestPage'));
const PDFTemplatesPage = lazy(() => import('@/modules/features/pdf-templates/views/PDFTemplatesPage'));
const ProductSalesPage = lazy(() => import('@/modules/features/product-sales/views/ProductSalesPage'));
const ContractDetailPage = lazy(() => import('@/modules/features/contracts/views/ContractDetailPage'));

// Super Admin modular pages
const SuperAdminDashboardPage = lazy(() => import('@/modules/features/super-admin/views/SuperAdminDashboardPage'));
const SuperAdminTenantsPage = lazy(() => import('@/modules/features/super-admin/views/SuperAdminTenantsPage'));
const SuperAdminUsersPage = lazy(() => import('@/modules/features/super-admin/views/SuperAdminUsersPage'));
const SuperAdminRoleRequestsPage = lazy(() => import('@/modules/features/super-admin/views/SuperAdminRoleRequestsPage'));
const SuperAdminAnalyticsPage = lazy(() => import('@/modules/features/super-admin/views/SuperAdminAnalyticsPage'));
const SuperAdminHealthPage = lazy(() => import('@/modules/features/super-admin/views/SuperAdminHealthPage'));
const SuperAdminConfigurationPage = lazy(() => import('@/modules/features/super-admin/views/SuperAdminConfigurationPage'));

// Keep some non-modular pages for now (utility pages)
// Note: Tenants page will be migrated to modular structure in future updates

/**
 * Wraps a route recursively with ModuleProtectedRoute guard
 * Ensures all nested routes are protected by module access control
 * 
 * @param route - The route to wrap
 * @param moduleName - The module name for access control
 * @returns Wrapped route with access guards
 */
function wrapRouteWithModuleGuard(route: any, moduleName: string): any {
  // Don't wrap if it's just a redirect or navigation route
  if (route.path === '' || route.index === true) {
    return route;
  }

  // Clone the route to avoid mutations
  const wrappedRoute = { ...route };

  // If the route has children, recursively wrap them too
  if (route.children && Array.isArray(route.children)) {
    wrappedRoute.children = route.children.map((childRoute: any) => {
      // Preserve index routes and nested routes
      if (childRoute.index === true || (childRoute.path === '' && childRoute.element)) {
        return childRoute;
      }
      return wrapRouteWithModuleGuard(childRoute, moduleName);
    });
  }

  // Wrap the element with ModuleProtectedRoute
  if (wrappedRoute.element && !wrappedRoute.element.type?.name?.includes('Navigate')) {
    wrappedRoute.element = (
      <ModuleProtectedRoute moduleName={moduleName}>
        {wrappedRoute.element}
      </ModuleProtectedRoute>
    );
  }

  return wrappedRoute;
}

/**
 * Extracts module name from route path
 * Maps paths like 'dashboard', 'customers', 'sales' to their module names
 * 
 * @param path - The route path
 * @returns The module name, or null if unable to determine
 */
function getModuleNameFromPath(path?: string): string | null {
  if (!path) return null;

  // Handle special cases
  const pathMap: Record<string, string> = {
    'dashboard': 'dashboard',
    'customers': 'customers',
    'sales': 'sales',
    'product-sales': 'product-sales',
    'contracts': 'contracts',
    'service-contracts': 'service-contracts',
    'products': 'products',
    'tickets': 'tickets',
    'complaints': 'complaints',
    'job-works': 'job-works',
    'notifications': 'notifications',
    'logs': 'audit-logs',
    'configuration': 'configuration',
    'tenant-configuration': 'configuration',
    'users': 'user-management',
    'roles': 'user-management',
    'permissions': 'user-management',
    'pdf-templates': 'pdf-templates',
  };

  return pathMap[path] || path;
}

/**
 * Create router with modular routes
 */
export function createModularRouter() {
  // Get routes from all registered modules, excluding super-admin routes
  // Super-admin routes are handled separately in the super-admin section
  const allModuleRoutes = moduleRegistry.getAllRoutes();
  const moduleRoutes = allModuleRoutes.filter((route) => {
    // Filter out super-admin routes - they have 'super-admin' path at root level
    return route.path !== 'super-admin';
  }).map((route) => {
    // Wrap module routes with access guards
    const moduleName = getModuleNameFromPath(route.path);
    if (moduleName) {
      return wrapRouteWithModuleGuard(route, moduleName);
    }
    return route;
  });

  const routes = [
    {
      path: "/",
      element: <RootLayout />,
      errorBoundary: ErrorBoundary,
      children: [
        {
          index: true,
          element: <RootRedirect />,
        },
        {
          path: "login",
          element: <LoginPage />,
        },
        {
          path: "demo-accounts",
          element: <DemoAccountsPage />,
        },
        // Direct route redirects for common paths
        {
          path: "dashboard",
          element: <Navigate to="/tenant/dashboard" replace />,
        },
        {
          path: "customers",
          element: <Navigate to="/tenant/customers" replace />,
        },
        {
          path: "sales",
          element: <Navigate to="/tenant/sales" replace />,
        },
        {
          path: "product-sales",
          element: <Navigate to="/tenant/product-sales" replace />,
        },
        {
          path: "tickets",
          element: <Navigate to="/tenant/tickets" replace />,
        },
        {
          path: "complaints",
          element: <Navigate to="/tenant/complaints" replace />,
        },
        {
          path: "job-works",
          element: <Navigate to="/tenant/job-works" replace />,
        },
        {
          path: "contracts",
          element: <Navigate to="/tenant/contracts" replace />,
        },
        {
          path: "notifications",
          element: <Navigate to="/tenant/notifications" replace />,
        },
        {
          path: "users",
          element: <Navigate to="/tenant/users" replace />,
        },
        {
          path: "logs",
          element: <Navigate to="/tenant/logs" replace />,
        },
        {
          path: "configuration",
          element: <Navigate to="/tenant/configuration" replace />,
        },
        {
          path: "tenant-configuration",
          element: <Navigate to="/tenant/tenant-configuration" replace />,
        },
        // Tenant Portal Routes
        // All child routes are wrapped with ModuleProtectedRoute via moduleRoutes processing
        // This ensures RBAC-based access control at the module level
        {
          path: "tenant",
          element: (
            <ProtectedRoute>
              <AppProviders>
                <EnterpriseLayout>
                  <Outlet />
                </EnterpriseLayout>
              </AppProviders>
            </ProtectedRoute>
          ),
          children: [
            {
              index: true,
              element: <Navigate to="dashboard" replace />,
            },
            // All modular routes are collected from registered modules
            // Routes are pre-wrapped with ModuleProtectedRoute for module access control
            // This includes: dashboard, customers, sales, tickets, contracts, 
            // service-contracts, complaints, notifications, configuration, 
            // pdf-templates, audit-logs, user-management, job-works, masters, product-sales
            ...moduleRoutes,
          ],
        },
        // Super Admin Portal Routes
        // ⚠️ CRITICAL: All super-admin routes are wrapped with ModuleProtectedRoute
        // to enforce super admin isolation and prevent unauthorized access
        {
          path: "super-admin",
          element: (
            <ProtectedRoute>
              <ModuleProtectedRoute moduleName="super-admin">
                <AppProviders>
                  <SuperAdminLayout>
                    <Outlet />
                  </SuperAdminLayout>
                </AppProviders>
              </ModuleProtectedRoute>
            </ProtectedRoute>
          ),
          children: [
            {
              index: true,
              element: <Navigate to="dashboard" replace />,
            },
            {
              path: "dashboard",
              element: (
                <Suspense fallback={<LoadingSpinner />}>
                  <SuperAdminDashboardPage />
                </Suspense>
              ),
            },
            {
              path: "tenants",
              element: (
                <Suspense fallback={<LoadingSpinner />}>
                  <SuperAdminTenantsPage />
                </Suspense>
              ),
            },
            {
              path: "users",
              element: (
                <Suspense fallback={<LoadingSpinner />}>
                  <SuperAdminUsersPage />
                </Suspense>
              ),
            },
            {
              path: "role-requests",
              element: (
                <Suspense fallback={<LoadingSpinner />}>
                  <SuperAdminRoleRequestsPage />
                </Suspense>
              ),
            },
            {
              path: "analytics",
              element: (
                <Suspense fallback={<LoadingSpinner />}>
                  <SuperAdminAnalyticsPage />
                </Suspense>
              ),
            },
            {
              path: "health",
              element: (
                <Suspense fallback={<LoadingSpinner />}>
                  <SuperAdminHealthPage />
                </Suspense>
              ),
            },
            {
              path: "configuration",
              element: (
                <Suspense fallback={<LoadingSpinner />}>
                  <SuperAdminConfigurationPage />
                </Suspense>
              ),
            },
          ],
        },
        {
          path: "*",
          element: <NotFoundPage />,
        },
      ],
    },
  ];

  return createBrowserRouter(routes, {
    future: {
      v7_startTransition: true,
    },
  });
}

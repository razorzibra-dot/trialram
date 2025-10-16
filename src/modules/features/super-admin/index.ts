/**
 * Super Admin Module
 * Handles all super admin functionality
 */
import { FeatureModule } from '@/modules/core/types';
import { superAdminRoutes } from './routes';

export const superAdminModule: FeatureModule = {
  name: 'super-admin',
  routes: superAdminRoutes,
  services: [],
  components: {},
  dependencies: ['core', 'shared'],
  async initialize() {
    console.log('Super Admin module initialized');
  },
  async cleanup() {
    console.log('Super Admin module cleanup');
  },
};

// Export views for direct imports if needed
export { default as SuperAdminDashboardPage } from './views/SuperAdminDashboardPage';
export { default as SuperAdminTenantsPage } from './views/SuperAdminTenantsPage';
export { default as SuperAdminUsersPage } from './views/SuperAdminUsersPage';
export { default as SuperAdminAnalyticsPage } from './views/SuperAdminAnalyticsPage';
export { default as SuperAdminHealthPage } from './views/SuperAdminHealthPage';
export { default as SuperAdminConfigurationPage } from './views/SuperAdminConfigurationPage';
export { default as SuperAdminRoleRequestsPage } from './views/SuperAdminRoleRequestsPage';
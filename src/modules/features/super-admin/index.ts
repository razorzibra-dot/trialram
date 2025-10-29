/**
 * Super Admin Module - Module Container Pattern
 * Handles all super admin functionality with standardized service management
 */
import { FeatureModule } from '@/modules/core/types';
import { superAdminRoutes } from './routes';
import { getServiceContainer } from '@/modules/core/serviceContainer';
import { userService, tenantService, rbacService } from '@/services/serviceFactory';
import { roleRequestService } from './services/roleRequestService';
import { healthService } from './services/healthService';

export const superAdminModule: FeatureModule = {
  name: 'super-admin',
  path: '/super-admin',
  routes: superAdminRoutes,
  services: ['userService', 'tenantService', 'rbacService', 'roleRequestService', 'healthService'],
  components: {},
  dependencies: ['core', 'shared'],
  async initialize() {
    try {
      const container = getServiceContainer();
      
      // Register all services for this module
      container.registerService('userService', userService);
      container.registerService('tenantService', tenantService);
      container.registerService('rbacService', rbacService);
      container.registerService('roleRequestService', roleRequestService);
      container.registerService('healthService', healthService);
      
      console.log('[Super Admin Module] Initialized with services: userService, tenantService, rbacService, roleRequestService, healthService');
    } catch (error) {
      console.error('[Super Admin Module] Initialization failed:', error);
      throw error;
    }
  },
  async cleanup() {
    try {
      const container = getServiceContainer();
      
      // Unregister services
      container.unregisterService('userService');
      container.unregisterService('tenantService');
      container.unregisterService('rbacService');
      container.unregisterService('roleRequestService');
      container.unregisterService('healthService');
      
      console.log('[Super Admin Module] Cleanup complete');
    } catch (error) {
      console.error('[Super Admin Module] Cleanup failed:', error);
    }
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
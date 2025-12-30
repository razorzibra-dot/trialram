/**
 * User Management Module
 * Handles user, role, and permission management
 */
import { FeatureModule } from '@/modules/core/types';
import { userManagementRoutes } from './routes';
import { registerServiceInstance, unregisterService } from '@/modules/core/services/ServiceContainer';
import { userService, rbacService } from '@/services/serviceFactory';

export const userManagementModule: FeatureModule = {
  name: 'user-management',
  path: '/user-management',
  routes: userManagementRoutes,
  services: ['userService', 'rbacService'],
  components: {},
  dependencies: ['core', 'shared'],
  async initialize() {
    try {
      // Services are factory-routed instances, not constructors
      registerServiceInstance('userService', userService);
      registerServiceInstance('rbacService', rbacService);
    } catch (error) {
      console.error('[User Management] ❌ Initialization failed:', error);
      throw error;
    }
  },
  async cleanup() {
    try {
      unregisterService('userService');
      unregisterService('rbacService');
    } catch (error) {
      console.error('[User Management] ❌ Cleanup failed:', error);
    }
  },
};

// Export service types only
export type { IUserService } from './services/userService';

// Export hooks
export * from './hooks';

// Views are lazy-loaded via routes; avoid static re-exports to preserve chunking
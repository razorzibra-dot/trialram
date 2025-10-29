/**
 * User Management Module
 * Handles user, role, and permission management
 */
import { FeatureModule } from '@/modules/core/types';
import { userManagementRoutes } from './routes';

export const userManagementModule: FeatureModule = {
  name: 'user-management',
  path: '/user-management',
  routes: userManagementRoutes,
  services: ['userService', 'rbacService'],
  components: {},
  dependencies: ['core', 'shared'],
  async initialize() {
    try {
      const { registerServiceInstance } = await import('@/modules/core/services/ServiceContainer');
      const { userService, rbacService } = await import('@/services/serviceFactory');
      
      // Services are factory-routed instances, not constructors
      registerServiceInstance('userService', userService);
      registerServiceInstance('rbacService', rbacService);
      
      console.log('[User Management] ✅ userService registered');
      console.log('[User Management] ✅ rbacService registered');
      console.log('[User Management] ✅ Module initialized successfully');
    } catch (error) {
      console.error('[User Management] ❌ Initialization failed:', error);
      throw error;
    }
  },
  async cleanup() {
    try {
      const { unregisterService } = await import('@/modules/core/services/ServiceContainer');
      unregisterService('userService');
      unregisterService('rbacService');
      console.log('[User Management] ✅ Services unregistered');
    } catch (error) {
      console.error('[User Management] ❌ Cleanup failed:', error);
    }
  },
};

// Export views for direct imports if needed
export { default as UsersPage } from './views/UsersPage';
export { default as UserManagementPage } from './views/UserManagementPage';
export { default as RoleManagementPage } from './views/RoleManagementPage';
export { default as PermissionMatrixPage } from './views/PermissionMatrixPage';
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
    } catch (error) {
      console.error('[User Management] ❌ Cleanup failed:', error);
    }
  },
};

// Export service types only
export type { IUserService } from './services/userService';

// Export hooks
export * from './hooks';

// Export views for direct imports if needed
export { default as UsersPage } from './views/UsersPage';
// ✅ CONSOLIDATED: UserManagementPage (legacy) consolidated into UsersPage
// Routes redirect /user-management to /users/list for backward compatibility
export { default as RoleManagementPage } from './views/RoleManagementPage';
export { default as PermissionMatrixPage } from './views/PermissionMatrixPage';
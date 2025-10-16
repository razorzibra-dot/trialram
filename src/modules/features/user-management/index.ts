/**
 * User Management Module
 * Handles user, role, and permission management
 */
import { FeatureModule } from '@/modules/core/types';
import { userManagementRoutes } from './routes';

export const userManagementModule: FeatureModule = {
  name: 'user-management',
  routes: userManagementRoutes,
  services: [],
  components: {},
  dependencies: ['core', 'shared'],
  async initialize() {
    console.log('User Management module initialized');
  },
  async cleanup() {
    console.log('User Management module cleanup');
  },
};

// Export views for direct imports if needed
export { default as UsersPage } from './views/UsersPage';
export { default as UserManagementPage } from './views/UserManagementPage';
export { default as RoleManagementPage } from './views/RoleManagementPage';
export { default as PermissionMatrixPage } from './views/PermissionMatrixPage';
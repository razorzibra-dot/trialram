/**
 * Notifications Module
 * Comprehensive notification management system
 */

// Views are lazy-loaded via routes; avoid static re-exports to preserve chunking

// Routes
export { notificationsRoutes } from './routes';
import { notificationsRoutes } from './routes';
import { FeatureModule } from '@/modules/core/types';
import { registerServiceInstance, unregisterService } from '@/modules/core/services/ServiceContainer';
import { notificationService } from '@/services/serviceFactory';

// Module configuration  
export const notificationsModule: FeatureModule = {
  name: 'notifications',
  path: '/notifications',
  services: ['notificationService'],
  dependencies: ['core', 'shared'],
  routes: notificationsRoutes,
  components: {},
  
  // Initialize the module
  async initialize() {
    try {
      // Register notification service (as instance, not constructor)
      registerServiceInstance('notificationService', notificationService);
      console.log('[Notifications] ✅ notificationService registered');
      console.log('[Notifications] ✅ Module initialized successfully');
    } catch (error) {
      console.error('[Notifications] ❌ Initialization failed:', error);
      throw error;
    }
  },
  
  // Cleanup the module
  async cleanup() {
    try {
      unregisterService('notificationService');
      console.log('[Notifications] ✅ Services unregistered');
    } catch (error) {
      console.error('[Notifications] ❌ Cleanup failed:', error);
    }
  },
};

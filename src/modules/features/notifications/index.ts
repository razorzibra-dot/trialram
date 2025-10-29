/**
 * Notifications Module
 * Comprehensive notification management system
 */

// Views exported
export * from './views/NotificationsPage';

// Routes
export { notificationsRoutes } from './routes';
import { notificationsRoutes } from './routes';
import { FeatureModule } from '@/modules/core/types';

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
      const { registerServiceInstance } = await import('@/modules/core/services/ServiceContainer');
      const { notificationService } = await import('@/services/serviceFactory');
      
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
      const { unregisterService } = await import('@/modules/core/services/ServiceContainer');
      unregisterService('notificationService');
      console.log('[Notifications] ✅ Services unregistered');
    } catch (error) {
      console.error('[Notifications] ❌ Cleanup failed:', error);
    }
  },
};

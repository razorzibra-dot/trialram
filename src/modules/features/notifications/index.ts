/**
 * Notifications Module
 * Comprehensive notification management system
 */

// Views exported
export * from './views/NotificationsPage';

// Routes
export { notificationsRoutes } from './routes';

// Module configuration  
export const notificationsModule = {
  name: 'notifications',
  path: '/notifications',
  dependencies: ['core', 'shared'],
  routes: notificationsRoutes,
  
  // Initialize the module
  async initialize() {
    console.log('Notifications module initialized');
  },
  
  // Cleanup the module
  async cleanup() {
    console.log('Notifications module cleaned up');
  },
};

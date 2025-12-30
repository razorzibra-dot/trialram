/**
 * Dashboard Module
 * Main dashboard with analytics and widgets
 */

// Service exports
export * from './services/dashboardService';

// Hook exports
export * from './hooks/useDashboard';

// Component exports
export * from './components/DashboardWidgets';

// Routes
export { dashboardRoutes } from './routes';
import { dashboardRoutes } from './routes';
import { serviceContainer } from '@/modules/core/services/ServiceContainer';

// Module configuration
export const dashboardModule = {
  name: 'dashboard',
  path: '/dashboard',
  services: ['dashboardService'],
  dependencies: ['core', 'shared'],
  routes: dashboardRoutes,
  components: {},
  
  // Initialize the module
  async initialize() {
    // Dashboard module doesn't require service registration
    // It aggregates data from other modules' services
    console.log('Dashboard module initialized');
  },
  
  // Cleanup the module
  async cleanup() {
    // Remove dashboard service
    serviceContainer.remove('dashboardService');
    
    console.log('Dashboard module cleaned up');
  },
};

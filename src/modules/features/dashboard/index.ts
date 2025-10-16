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
    const { registerService } = await import('@/modules/core/services/ServiceContainer');
    const { DashboardService } = await import('./services/dashboardService');
    
    // Register dashboard service
    registerService('dashboardService', DashboardService);
    
    console.log('Dashboard module initialized');
  },
  
  // Cleanup the module
  async cleanup() {
    const { serviceContainer } = await import('@/modules/core/services/ServiceContainer');
    
    // Remove dashboard service
    serviceContainer.remove('dashboardService');
    
    console.log('Dashboard module cleaned up');
  },
};

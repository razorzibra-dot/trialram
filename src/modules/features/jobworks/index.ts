/**
 * JobWorks Module
 * Job work management and tracking with enterprise-grade architecture
 * Pattern: Service → Hook → Component (3-layer architecture)
 */

// Service exports
export * from './services/jobWorksService';

// Hook exports
export * from './hooks/useJobWorks';

// Component exports (new drawer-based UI)
export { JobWorksDetailPanel } from './components/JobWorksDetailPanel';
export { JobWorksFormPanel } from './components/JobWorksFormPanel';
export { JobWorksFormPanelEnhanced } from './components/JobWorksFormPanelEnhanced';

// Routes
export { jobWorksRoutes } from './routes';
import { jobWorksRoutes } from './routes';

// Module configuration
export const jobWorksModule = {
  name: 'jobworks',
  path: '/jobworks',
  services: ['jobWorksService'],
  dependencies: ['core', 'shared'],
  routes: jobWorksRoutes,
  components: {},
  
  // Initialize the module
  async initialize() {
    const { registerService } = await import('@/modules/core/services/ServiceContainer');
    const { JobWorksService } = await import('./services/jobWorksService');
    
    // Register jobworks service
    registerService('jobWorksService', JobWorksService);
    
    console.log('JobWorks module initialized');
  },
  
  // Cleanup the module
  async cleanup() {
    const { serviceContainer } = await import('@/modules/core/services/ServiceContainer');
    
    // Remove jobworks service
    serviceContainer.remove('jobWorksService');
    
    console.log('JobWorks module cleaned up');
  },
};

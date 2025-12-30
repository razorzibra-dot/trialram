/**
 * JobWorks Module
 * Job work management and tracking with enterprise-grade architecture
 * Pattern: Service → Hook → Component (3-layer architecture)
 */

// Services are registered via initialize; avoid re-exporting to prevent static imports

// Hook exports
export * from './hooks/useJobWorks';

// Component exports (new drawer-based UI)
export { JobWorksDetailPanel } from './components/JobWorksDetailPanel';
export { JobWorksFormPanel } from './components/JobWorksFormPanel';

// Routes
export { jobWorksRoutes } from './routes';
import { jobWorksRoutes } from './routes';
import { registerService, serviceContainer } from '@/modules/core/services/ServiceContainer';
import { JobWorksService } from './services/jobWorksService';

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
    // Register jobworks service
    registerService('jobWorksService', JobWorksService);
    console.log('JobWorks module initialized');
  },
  
  // Cleanup the module
  async cleanup() {
    // Remove jobworks service
    serviceContainer.remove('jobWorksService');
    console.log('JobWorks module cleaned up');
  },
};

/**
 * Deals Module Exports
 * Central export point for deals module
 */

// Store exports (specific exports to avoid conflicts)
export { 
  useSalesStore, 
  useSelectedDeal, 
  useSalesFilters, 
  useSalesPagination, 
  useSalesSelection, 
  useSalesLoading 
} from './store/dealStore';

// Service exports (types only)
export type { ISalesService } from './services/salesService';

// Hook exports (these are the main ones we want to expose)
export * from './hooks/useDeals';


// Routes
export { dealsRoutes } from './routes';
import { dealsRoutes } from './routes';
import { registerServiceInstance, serviceContainer } from '@/modules/core/services/ServiceContainer';
import { dealsService } from '@/services/serviceFactory';

// Module configuration
export const dealsModule = {
  name: 'deals',
  path: '/deals',
  services: ['dealsService'],
  dependencies: ['core', 'shared'],
  routes: dealsRoutes,
  components: {},

  // Initialize the module
  async initialize() {
    console.log('[Deals Module] Initializing...');
    try {
      console.log('[Deals Module] Registering DealsService...');
      registerServiceInstance('dealsService', dealsService);
      const registered = serviceContainer.has('dealsService');
      console.log('[Deals Module] DealsService registered:', registered);
      console.log('[Deals Module] Registered services:', serviceContainer.getRegisteredServices());
      console.log('[Deals Module] Deals module initialized successfully');
    } catch (error) {
      console.error('[Deals Module] Failed to initialize:', error);
      throw error;
    }
  },

  // Cleanup the module
  async cleanup() {
    serviceContainer.remove('dealsService');
    console.log('Deals module cleaned up');
  },
};

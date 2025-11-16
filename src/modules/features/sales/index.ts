/**
 * Sales Module Exports
 * Central export point for sales module
 */

// Store exports (specific exports to avoid conflicts)
export { 
  useSalesStore, 
  useSelectedDeal, 
  useSalesFilters, 
  useSalesPagination, 
  useSalesSelection, 
  useSalesLoading 
} from './store/salesStore';

// Service exports (types only)
export type { ISalesService } from './services/salesService';

// Hook exports (these are the main ones we want to expose)
export * from './hooks/useSales';

// Component exports
export * from './components/SalesList';

// Routes
export { salesRoutes } from './routes';
import { salesRoutes } from './routes';

// Module configuration
export const salesModule = {
  name: 'sales',
  path: '/sales',
  services: ['salesService'],
  dependencies: ['core', 'shared'],
  routes: salesRoutes,
  components: {},

  // Initialize the module
  async initialize() {
    console.log('[Sales Module] Initializing...');
    try {
      const { registerServiceInstance, serviceContainer } = await import('@/modules/core/services/ServiceContainer');
      const { salesService } = await import('@/services/serviceFactory');

      console.log('[Sales Module] Registering SalesService...');
      registerServiceInstance('salesService', salesService);
      
      const registered = serviceContainer.has('salesService');
      console.log('[Sales Module] SalesService registered:', registered);
      console.log('[Sales Module] Registered services:', serviceContainer.getRegisteredServices());

      console.log('[Sales Module] Sales module initialized successfully');
    } catch (error) {
      console.error('[Sales Module] Failed to initialize:', error);
      throw error;
    }
  },

  // Cleanup the module
  async cleanup() {
    const { serviceContainer } = await import('@/modules/core/services/ServiceContainer');
    serviceContainer.remove('salesService');
    console.log('Sales module cleaned up');
  },
};

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

// Service exports (avoiding duplicates with hooks)
export type { CreateDealData } from './services/salesService';
export { SalesService } from './services/salesService';

// Hook exports (these are the main ones we want to expose)
export * from './hooks/useSales';

// Component exports
export * from './components/SalesList';

// Routes
export { salesRoutes } from './routes';

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
    const { registerService } = await import('@/modules/core/services/ServiceContainer');
    const { SalesService } = await import('./services/salesService');

    // Register sales service
    registerService('salesService', SalesService);

    console.log('Sales module initialized');
  },

  // Cleanup the module
  async cleanup() {
    const { serviceContainer } = await import('@/modules/core/services/ServiceContainer');

    // Remove sales service
    serviceContainer.remove('salesService');

    console.log('Sales module cleaned up');
  },
};

/**
 * Customer Module Exports
 * Central export point for customer module
 */

// Store exports
export { 
  useCustomerStore, 
  useCustomerFilters, 
  useCustomerPagination,
  useCustomerSelection
} from './store/customerStore';
export type { CustomerFilters, CustomerState } from './store/customerStore';

// Service type exports only
export type { 
  CreateCustomerData, 
  UpdateCustomerData, 
  CustomerFilters, 
  CustomerStats, 
  ICustomerService 
} from './services/customerService';

// Hook exports
export { 
  useCustomers, 
  useCustomer, 
  useCustomerTags,
  useCustomerStats,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useBulkCustomerOperations
} from './hooks/useCustomers';

// Component exports
export * from './components/CustomerList';

// Routes
export { customerRoutes } from './routes';
import { customerRoutes } from './routes';

// Module configuration
export const customerModule = {
  name: 'customers',
  path: '/customers',
  services: ['customerService'],
  dependencies: ['core', 'shared'],
  routes: customerRoutes,
  
  // Initialize the module
  async initialize() {
    console.log('[customerModule.initialize] Starting customer module initialization', {
      timestamp: new Date().toISOString()
    });
    
    try {
      const { registerServiceInstance } = await import('@/modules/core/services/ServiceContainer');
      const { CustomerService } = await import('./services/customerService');
      
      // Register layered customer service (which internally routes via service factory)
      registerServiceInstance('customerService', new CustomerService());
      
      console.log('[customerModule.initialize] Customer module initialized successfully', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[customerModule.initialize] Failed to initialize customer module:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },
  
  // Cleanup the module
  async cleanup() {
    const { serviceContainer } = await import('@/modules/core/services/ServiceContainer');
    
    // Remove customer service
    serviceContainer.remove('customerService');
    
    console.log('Customer module cleaned up');
  },
};

/**
 * Customer Module Exports
 * Central export point for customer module
 */

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

// Routes
export { customerRoutes } from './routes';
import { customerRoutes } from './routes';
import { registerServiceInstance, serviceContainer } from '@/modules/core/services/ServiceContainer';
import { customerService } from '@/services/serviceFactory';

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
      // Register factory-backed customer service once
      registerServiceInstance('customerService', customerService);
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
    // Remove customer service
    serviceContainer.remove('customerService');
    console.log('Customer module cleaned up');
  },
};

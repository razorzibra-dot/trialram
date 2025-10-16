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

// Service exports
export { CustomerService } from './services/customerService';
export type { CreateCustomerData, UpdateCustomerData } from './services/customerService';

// Hook exports
export { 
  useCustomers, 
  useCustomer, 
  useCustomerTags,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer 
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
    const { registerService } = await import('@/modules/core/services/ServiceContainer');
    const { CustomerService } = await import('./services/customerService');
    
    // Register customer service
    registerService('customerService', CustomerService);
    
    console.log('Customer module initialized');
  },
  
  // Cleanup the module
  async cleanup() {
    const { serviceContainer } = await import('@/modules/core/services/ServiceContainer');
    
    // Remove customer service
    serviceContainer.remove('customerService');
    
    console.log('Customer module cleaned up');
  },
};

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
    console.log('[customerModule.initialize] ▶ Starting customer module initialization', {
      timestamp: new Date().toISOString()
    });
    
    try {
      const startImport = performance.now();
      const { registerService } = await import('@/modules/core/services/ServiceContainer');
      const importTime1 = performance.now() - startImport;
      console.log(`[customerModule.initialize] Imported registerService (${importTime1.toFixed(2)}ms)`);
      
      const startImport2 = performance.now();
      const { CustomerService } = await import('./services/customerService');
      const importTime2 = performance.now() - startImport2;
      
      // Check for getCustomerStats method on the class
      const protoMethods = Object.getOwnPropertyNames(CustomerService.prototype || {});
      const hasGetCustomerStats = protoMethods.includes('getCustomerStats');
      
      // Try to instantiate and check the instance methods
      let instanceMethods: string[] = [];
      try {
        const testInstance = new CustomerService();
        instanceMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(testInstance) || {});
      } catch (e) {
        console.log('[customerModule.initialize] Could not create test instance:', e);
      }
      
      console.log(`[customerModule.initialize] Imported CustomerService (${importTime2.toFixed(2)}ms)`, {
        isClass: CustomerService.prototype !== undefined,
        hasPrototype: !!CustomerService.prototype,
        name: CustomerService.name,
        type: typeof CustomerService,
        isConstructor: typeof CustomerService === 'function',
        hasGetCustomerStats,
        protoMethodsCount: protoMethods.length,
        prototypeMethods: protoMethods,
        instanceMethodsCount: instanceMethods.length,
        instanceMethods: instanceMethods,
        hasGetCustomerStatsOnInstance: instanceMethods.includes('getCustomerStats'),
        toString: String(CustomerService).substring(0, 200)
      });
      
      // Verify CustomerService is valid before registering
      if (typeof CustomerService !== 'function') {
        throw new Error(`CustomerService is not a function! Got type: ${typeof CustomerService}`);
      }
      
      if (!CustomerService.prototype) {
        throw new Error(`CustomerService has no prototype!`);
      }
      
      // Register customer service
      console.log('[customerModule.initialize] Calling registerService for customerService', {
        serviceName: 'customerService',
        serviceType: typeof CustomerService,
        serviceHasProto: !!CustomerService.prototype
      });
      
      const startRegister = performance.now();
      registerService('customerService', CustomerService);
      const registerTime = performance.now() - startRegister;
      
      console.log(`[customerModule.initialize] ✓ Customer module initialized successfully (${registerTime.toFixed(2)}ms)`, {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[customerModule.initialize] ✗ Failed to initialize customer module:', {
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

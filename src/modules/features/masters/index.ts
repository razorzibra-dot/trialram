/**
 * Masters Module
 * Master data management for companies and products
 */

// Services are registered via initialize; avoid re-exporting to prevent static imports

// Hook exports
export * from './hooks/useCompanies';
export * from './hooks/useProducts';

// Routes
export { mastersRoutes } from './routes';
import { mastersRoutes } from './routes';
import { registerService, serviceContainer } from '@/modules/core/services/ServiceContainer';
import { CompanyService } from './services/companyService';
import { ProductService } from './services/productService';

// Module configuration
export const mastersModule = {
  name: 'masters',
  path: '/masters',
  services: ['companyService', 'productService'],
  dependencies: ['core', 'shared'],
  routes: mastersRoutes,
  components: {},
  
  // Initialize the module
  async initialize() {
    // Register services
    registerService('companyService', CompanyService);
    registerService('productService', ProductService);
    console.log('Masters module initialized');
  },
  
  // Cleanup the module
  async cleanup() {
    // Remove services
    serviceContainer.remove('companyService');
    serviceContainer.remove('productService');
    console.log('Masters module cleaned up');
  },
};

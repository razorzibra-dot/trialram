/**
 * Masters Module
 * Master data management for companies and products
 */

// Service exports
export * from './services/companyService';
export * from './services/productService';

// Hook exports
export * from './hooks/useCompanies';
export * from './hooks/useProducts';

// Component exports
export * from './components/CompaniesList';
export * from './components/ProductsList';

// Routes
export { mastersRoutes } from './routes';
import { mastersRoutes } from './routes';

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
    const { registerService } = await import('@/modules/core/services/ServiceContainer');
    const { CompanyService } = await import('./services/companyService');
    const { ProductService } = await import('./services/productService');
    
    // Register services
    registerService('companyService', CompanyService);
    registerService('productService', ProductService);
    
    console.log('Masters module initialized');
  },
  
  // Cleanup the module
  async cleanup() {
    const { serviceContainer } = await import('@/modules/core/services/ServiceContainer');
    
    // Remove services
    serviceContainer.remove('companyService');
    serviceContainer.remove('productService');
    
    console.log('Masters module cleaned up');
  },
};

/**
 * Product Sales Module
 * Handles product sales management and service contract generation
 * 
 * ✅ Follows Module Service Standardization Pattern:
 * - All services registered in initialize()
 * - Components use useService() hook
 * - No direct service imports in components
 */

export { ProductSalesPage } from './views/ProductSalesPage';
export { productSalesRoutes } from './routes';

import { productSalesRoutes } from './routes';
import { FeatureModule } from '@/modules/core/types';

export const productSalesModule: FeatureModule = {
  name: 'product-sales',
  path: '/product-sales',
  services: ['productSaleService', 'productService', 'customerService'],
  dependencies: ['core', 'shared'],
  routes: productSalesRoutes,
  components: {},
  
  async initialize() {
    console.log('[Product Sales] 🚀 Initializing...');
    try {
      const { registerServiceInstance } = await import('../../core/services/ServiceContainer');
      const { productSaleService, productService, customerService } = await import('../../../services/serviceFactory');
      
      // Register product sales service (as instance, not constructor)
      registerServiceInstance('productSaleService', productSaleService);
      console.log('[Product Sales] ✅ productSaleService registered');
      
      // Register product service (as instance, not constructor)
      registerServiceInstance('productService', productService);
      console.log('[Product Sales] ✅ productService registered');
      
      // Customer service already registered by customers module
      // but we'll ensure it's available if needed
      registerServiceInstance('customerService', customerService);
      console.log('[Product Sales] ✅ customerService registered');
      
      console.log('[Product Sales] ✅ Module initialized successfully');
    } catch (error) {
      console.error('[Product Sales] ❌ Failed to initialize:', error);
      throw error;
    }
  },

  async cleanup() {
    console.log('[Product Sales] 🧹 Cleaning up...');
    const { serviceContainer } = await import('../../core/services/ServiceContainer');
    
    serviceContainer.remove('productSaleService');
    serviceContainer.remove('productService');
    serviceContainer.remove('customerService');
    
    console.log('[Product Sales] ✅ Module cleaned up');
  },
};

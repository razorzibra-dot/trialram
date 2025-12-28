/**
 * Product Module Exports
 * Central export point for product module
 */

// NOTE: Product hooks have been moved to masters module
// Use imports from '@/modules/features/masters/hooks/useProducts' instead
// This consolidates product management and avoids duplication

// Hook exports - NOW DEPRECATED, use masters module instead
// export {
//   useProducts,
//   useProduct,
//   useCreateProduct,
//   useUpdateProduct,
//   useDeleteProduct,
//   useProductExport
// } from './hooks/useProducts';

// Routes
export { productRoutes } from './routes';
import { productRoutes } from './routes';

// Module configuration
export const productModule = {
  name: 'products',
  path: '/products',
  services: ['productService'],
  dependencies: ['core', 'shared'],
  routes: productRoutes as Array<Record<string, unknown>>,

  // Initialize the module
  async initialize() {
    console.log('[productModule.initialize] Starting product module initialization', {
      timestamp: new Date().toISOString()
    });

    try {
      const { registerServiceInstance } = await import('@/modules/core/services/ServiceContainer');
      const { productService } = await import('@/services/serviceFactory');

      // Register product service from factory
      registerServiceInstance('productService', productService);

      console.log('[productModule.initialize] Product module initialized successfully', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[productModule.initialize] Failed to initialize product module:', {
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

    // Remove product service
    serviceContainer.remove('productService');

    console.log('Product module cleaned up');
  },
};
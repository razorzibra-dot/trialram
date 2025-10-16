/**
 * Product Sales Module
 * Handles product sales management and service contract generation
 */

export { ProductSalesPage } from './views/ProductSalesPage';
export { productSalesRoutes } from './routes';

import { productSalesRoutes } from './routes';

export const productSalesModule = {
  name: 'product-sales',
  path: '/product-sales',
  services: ['productSaleService'],
  dependencies: ['core', 'shared'],
  routes: productSalesRoutes,
  
  async initialize() {
    // Product sales module initialization
    console.log('Product sales module initialized');
  },
};

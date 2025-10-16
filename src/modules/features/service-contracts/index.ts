/**
 * Service Contracts Module
 * Handles service contract management
 */
import { FeatureModule } from '@/modules/core/types';
import { serviceContractsRoutes } from './routes';

export const serviceContractsModule: FeatureModule = {
  name: 'service-contracts',
  routes: serviceContractsRoutes,
  services: [],
  components: {},
  dependencies: ['core', 'shared'],
  async initialize() {
    console.log('Service Contracts module initialized');
  },
  async cleanup() {
    console.log('Service Contracts module cleanup');
  },
};

// Export views for direct imports if needed
export { default as ServiceContractsPage } from './views/ServiceContractsPage';
export { default as ServiceContractDetailPage } from './views/ServiceContractDetailPage';
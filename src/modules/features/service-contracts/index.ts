/**
 * Service Contracts Module
 * Handles service contract management
 * 
 * ✅ Follows Module Service Standardization Pattern:
 * - All services registered in initialize()
 * - Components use useService() hook
 * - No direct service imports in components
 */
import { FeatureModule } from '@/modules/core/types';
import { serviceContractsRoutes } from './routes';
import { registerServiceInstance, serviceContainer } from '@/modules/core/services/ServiceContainer';
import { serviceContractService } from '@/services/serviceFactory';

export const serviceContractsModule: FeatureModule = {
  name: 'service-contracts',
  path: '/service-contracts',
  routes: serviceContractsRoutes,
  services: ['serviceContractService'],
  components: {},
  dependencies: ['core', 'shared'],
  
  async initialize() {
    console.log('[Service Contracts] 🚀 Initializing...');
    try {
      // Register service contract service (as instance, not constructor)
      registerServiceInstance('serviceContractService', serviceContractService);
      console.log('[Service Contracts] ✅ serviceContractService registered');
      console.log('[Service Contracts] ✅ Module initialized successfully');
    } catch (error) {
      console.error('[Service Contracts] ❌ Failed to initialize:', error);
      throw error;
    }
  },
  
  async cleanup() {
    console.log('[Service Contracts] 🧹 Cleaning up...');
    serviceContainer.remove('serviceContractService');
    console.log('[Service Contracts] ✅ Module cleaned up');
  },
};

// Views are lazy-loaded via routes; avoid static re-exports to preserve chunking

// Export components
export { default as ServiceContractFormModal } from './components/ServiceContractFormModal';

// Export hooks
export {
  useServiceContracts,
  useServiceContract,
  useCreateServiceContract,
  useUpdateServiceContract,
  useDeleteServiceContract,
  useServiceContractStats,
  useServiceContractDocuments,
  useAddServiceContractDocument,
  useServiceDeliveryMilestones,
  useAddServiceDeliveryMilestone,
  useServiceContractIssues,
  useAddServiceContractIssue,
} from './hooks/useServiceContracts';

// Export services
export { moduleServiceContractService } from './services/serviceContractService';

// Export types
export type {
  ServiceContractType,
  ServiceContractCreateInput,
  ServiceContractUpdateInput,
  ServiceContractFilters,
  ServiceContractStats,
} from '@/types/serviceContract';

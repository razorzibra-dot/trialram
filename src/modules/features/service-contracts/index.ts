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
      const { registerServiceInstance } = await import('@/modules/core/services/ServiceContainer');
      const { serviceContractService } = await import('@/services/serviceFactory');
      
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
    const { serviceContainer } = await import('@/modules/core/services/ServiceContainer');
    
    serviceContainer.remove('serviceContractService');
    
    console.log('[Service Contracts] ✅ Module cleaned up');
  },
};

// Export views for direct imports if needed
export { default as ServiceContractsPage } from './views/ServiceContractsPage';
export { default as ServiceContractDetailPage } from './views/ServiceContractDetailPage';

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

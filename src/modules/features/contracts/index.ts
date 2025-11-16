/**
 * Contracts Module Exports
 * Central export point for contracts module
 */

// Store exports
export { 
  useContractStore, 
  useContractFilters, 
  useContractPagination,
  useContractSelection
} from './store/contractStore';
export type { ContractFilters, ContractState } from './store/contractStore';

// Service exports (types only)
// export type { ContractFormData } from './services/contractService'; // TODO: Add when service is implemented

// Hook exports
export { 
  useContracts, 
  useContract, 
  useContractStats,
  useExpiringContracts,
  useContractsDueForRenewal,
  useCreateContract,
  useUpdateContract,
  useDeleteContract,
  useUpdateContractStatus,
  useApproveContract,
  useExportContracts
} from './hooks/useContracts';

// Component exports
export { ContractFormPanel } from './components/ContractFormPanel';
export { ContractDetailPanel } from './components/ContractDetailPanel';
export { ContractsList } from './components/ContractsList';

// Routes
export { contractsRoutes } from './routes';
import { contractsRoutes } from './routes';

// Module configuration
export const contractsModule = {
  name: 'contracts',
  path: '/contracts',
  services: ['contractService', 'serviceContractService'],
  dependencies: ['core', 'shared'],
  routes: contractsRoutes,
  
  // Initialize the module
  async initialize() {
    const { registerServiceInstance } = await import('@/modules/core/services/ServiceContainer');
    const { contractService } = await import('@/services/serviceFactory');
    const { serviceContractService } = await import('@/services/serviceFactory');

    registerServiceInstance('contractService', contractService);
    registerServiceInstance('serviceContractService', serviceContractService);

    console.log('Contracts module initialized');
  },
  
  // Cleanup the module
  async cleanup() {
    const { serviceContainer } = await import('@/modules/core/services/ServiceContainer');
    
    serviceContainer.remove('contractService');
    serviceContainer.remove('serviceContractService');
    
    console.log('Contracts module cleaned up');
  },
};
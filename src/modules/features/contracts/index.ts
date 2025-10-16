/**
 * Contracts Module
 * Contract management and lifecycle tracking
 */

// Service exports
export * from './services/contractService';
export * from './services/serviceContractService';

// Hook exports
export * from './hooks/useContracts';
export * from './hooks/useServiceContracts';

// Component exports
export * from './components/ContractsList';

// View exports
export { ContractsPage } from './views/ContractsPage';
export { ContractDetailPage } from './views/ContractDetailPage';

// Routes
export { contractsRoutes } from './routes';

// Module configuration
export const contractsModule = {
  name: 'contracts',
  path: '/contracts',
  services: ['contractService', 'serviceContractService'],
  dependencies: ['core', 'shared'],
  routes: contractsRoutes,
  components: {},
  
  // Initialize the module
  async initialize() {
    const { registerService } = await import('@/modules/core/services/ServiceContainer');
    const { ContractService } = await import('./services/contractService');
    const { ServiceContractService } = await import('./services/serviceContractService');
    
    // Register services
    registerService('contractService', ContractService);
    registerService('serviceContractService', ServiceContractService);
    
    console.log('Contracts module initialized');
  },
  
  // Cleanup the module
  async cleanup() {
    const { serviceContainer } = await import('@/modules/core/services/ServiceContainer');
    
    // Remove services
    serviceContainer.remove('contractService');
    serviceContainer.remove('serviceContractService');
    
    console.log('Contracts module cleaned up');
  },
};

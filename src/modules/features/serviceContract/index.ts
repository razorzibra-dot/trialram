/**
 * Service Contract Module Exports
 * Central export point for all service contract functionality
 * 
 * Last Updated: 2025-01-30
 * Version: 1.0.0
 */

// Components
export { ServiceContractWizardForm } from './components/ServiceContractWizardForm';
export { ServiceContractFormPanel } from './components/ServiceContractFormPanel';
export { ServiceContractDetailPanel } from './components/ServiceContractDetailPanel';
export { ServiceContractsList } from './components/ServiceContractsList';
export { ServiceContractDocumentManager } from './components/ServiceContractDocumentManager';
export { ServiceDeliveryMilestonePanel } from './components/ServiceDeliveryMilestonePanel';
export { ServiceContractIssuePanel } from './components/ServiceContractIssuePanel';

// Hooks
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

// Services
export { moduleServiceContractService } from './services/serviceContractService';

// Types
export type {
  ServiceContractType,
  ServiceContractDocumentType,
  ServiceDeliveryMilestoneType,
  ServiceContractIssueType,
  ServiceContractCreateInput,
  ServiceContractUpdateInput,
  ServiceContractFilters,
  ServiceContractStats,
  ServiceContractWizardData,
} from '@/types/serviceContract';

// Pages
export { ServiceContractsPage } from './views/ServiceContractsPage';
export { ServiceContractDetailPage } from './views/ServiceContractDetailPage';
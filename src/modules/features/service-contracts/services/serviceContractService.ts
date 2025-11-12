/**
 * Service Contract Module Service Layer
 * Coordinates between UI/Hooks and backend services
 * 
 * Pattern: Uses Service Factory pattern to route to correct backend
 * - Mock: Development mode
 * - Supabase: Production mode
 * 
 * Last Updated: 2025-01-30
 * Version: 1.0.0
 */

import { mockServiceContractService } from '@/services/serviceContractService';
import { supabaseServiceContractService } from '@/services/supabase/serviceContractService';
import {
  ServiceContractType,
  ServiceContractDocumentType,
  ServiceDeliveryMilestoneType,
  ServiceContractIssueType,
  ServiceContractCreateInput,
  ServiceContractUpdateInput,
  ServiceContractFilters,
  ServiceContractStats,
  ServiceContractDocumentCreateInput,
  ServiceDeliveryMilestoneCreateInput,
  ServiceContractIssueCreateInput,
} from '@/types/serviceContract';
import { PaginatedResponse } from '@/modules/core/types';

/**
 * Determine which service to use based on API mode
 */
const apiMode = import.meta.env.VITE_API_MODE || 'mock';

function getServiceContractService() {
  return apiMode === 'supabase' ? supabaseServiceContractService : mockServiceContractService;
}

/**
 * Module-level Service Contract Service
 * Provides high-level business operations
 */
export const moduleServiceContractService = {
  /**
   * Get service contracts with filtering and pagination
   */
  async getServiceContracts(filters?: ServiceContractFilters): Promise<PaginatedResponse<ServiceContractType>> {
    return getServiceContractService().getServiceContracts(filters);
  },

  /**
   * Get single service contract with all related data
   */
  async getServiceContract(id: string): Promise<ServiceContractType> {
    return getServiceContractService().getServiceContract(id);
  },

  /**
   * Get service contract with all related data (documents, milestones, issues)
   */
  async getServiceContractWithDetails(id: string) {
    const contract = await getServiceContractService().getServiceContract(id);
    const documents = await getServiceContractService().getServiceContractDocuments(id);
    const milestones = await getServiceContractService().getServiceDeliveryMilestones(id);
    const issues = await getServiceContractService().getServiceContractIssues(id);

    return {
      contract,
      documents,
      milestones,
      issues,
    };
  },

  /**
   * Create new service contract
   */
  async createServiceContract(data: ServiceContractCreateInput): Promise<ServiceContractType> {
    return getServiceContractService().createServiceContract(data);
  },

  /**
   * Update existing service contract
   */
  async updateServiceContract(id: string, data: ServiceContractUpdateInput): Promise<ServiceContractType> {
    return getServiceContractService().updateServiceContract(id, data);
  },

  /**
   * Delete service contract
   */
  async deleteServiceContract(id: string): Promise<void> {
    return getServiceContractService().deleteServiceContract(id);
  },

  /**
   * Update service contract status
   */
  async updateServiceContractStatus(id: string, status: string): Promise<ServiceContractType> {
    return getServiceContractService().updateServiceContractStatus(id, status);
  },

  /**
   * Get service contract statistics
   */
  async getServiceContractStats(): Promise<ServiceContractStats> {
    return getServiceContractService().getServiceContractStats();
  },

  /**
   * Get service contract documents
   */
  async getServiceContractDocuments(contractId: string): Promise<ServiceContractDocumentType[]> {
    return getServiceContractService().getServiceContractDocuments(contractId);
  },

  /**
   * Add document to service contract
   */
  async addServiceContractDocument(data: ServiceContractDocumentCreateInput): Promise<ServiceContractDocumentType> {
    return getServiceContractService().addServiceContractDocument(data);
  },

  /**
   * Get service delivery milestones
   */
  async getServiceDeliveryMilestones(contractId: string): Promise<ServiceDeliveryMilestoneType[]> {
    return getServiceContractService().getServiceDeliveryMilestones(contractId);
  },

  /**
   * Add milestone to service contract
   */
  async addServiceDeliveryMilestone(data: ServiceDeliveryMilestoneCreateInput): Promise<ServiceDeliveryMilestoneType> {
    return getServiceContractService().addServiceDeliveryMilestone(data);
  },

  /**
   * Get service contract issues
   */
  async getServiceContractIssues(contractId: string): Promise<ServiceContractIssueType[]> {
    return getServiceContractService().getServiceContractIssues(contractId);
  },

  /**
   * Add issue to service contract
   */
  async addServiceContractIssue(data: ServiceContractIssueCreateInput): Promise<ServiceContractIssueType> {
    return getServiceContractService().addServiceContractIssue(data);
  },

  /**
   * Export service contracts
   */
  async exportServiceContracts(format: 'csv' | 'json' = 'csv'): Promise<string> {
    return getServiceContractService().exportServiceContracts(format);
  },

  /**
   * Bulk update service contracts
   */
  async bulkUpdateServiceContracts(
    ids: string[],
    updates: ServiceContractUpdateInput
  ): Promise<ServiceContractType[]> {
    return getServiceContractService().bulkUpdateServiceContracts(ids, updates);
  },

  /**
   * Bulk delete service contracts
   */
  async bulkDeleteServiceContracts(ids: string[]): Promise<void> {
    return getServiceContractService().bulkDeleteServiceContracts(ids);
  },
};

/**
 * Contract Service - Module Layer
 * Business logic for contract management and lifecycle
 * ⚠️ IMPORTANT: This is for the Contracts module (/src/modules/features/contracts/)
 * For Service Contracts, use serviceContractService from serviceFactory instead
 *
 * This service uses the Service Factory pattern to route between mock and Supabase implementations
 * based on VITE_API_MODE environment variable
 */

import { BaseService } from '@/modules/core/services/BaseService';
import { PaginatedResponse } from '@/modules/core/types';
import { Contract, ContractFilters, ApprovalRecord } from '@/types/contracts';

// Define ContractFormData interface locally since it might not exist in types
export interface ContractFormData {
  title: string;
  description?: string;
  type: 'service_agreement' | 'nda' | 'purchase_order' | 'employment' | 'custom';
  status: 'draft' | 'pending_approval' | 'active' | 'renewed' | 'expired' | 'terminated';
  customer_id: string;
  customer_name?: string;
  customer_contact?: string;
  parties: Array<Record<string, unknown>>;
  value: number;
  total_value: number;
  currency: string;
  payment_terms?: string;
  delivery_terms?: string;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  renewal_period_months?: number;
  renewal_terms?: string;
  terms?: string;
  compliance_status: 'compliant' | 'non_compliant' | 'pending_review';
  created_by: string;
  assigned_to?: string;
  assigned_to_name?: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reminder_days: number[];
  notes?: string;
}

// Import factory-routed service for multi-backend support
import { contractService as factoryContractService } from '@/services/serviceFactory';

export interface ContractStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  activeContracts: number;
  pendingApproval: number;
  expiringContracts: number;
  totalValue: number;
  averageValue: number;
  renewalsDue: number;
}

export class ContractService extends BaseService {
  /**
   * Get contracts with filtering and pagination
   * Routes to mock or Supabase service based on VITE_API_MODE
   */
  async getContracts(filters: ContractFilters = {}): Promise<PaginatedResponse<Contract>> {
    try {
      try {
        // Use factory service for multi-backend support
        return await factoryContractService.getContracts(filters);
      } catch (error) {
        // Handle tenant context not initialized gracefully
        if (error instanceof Error && error.message.includes('Tenant context not initialized')) {
          // Return empty response instead of throwing
          const { page = 1, pageSize = 20 } = filters;
          return {
            data: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
          };
        }
        throw error;
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }
  }

  /**
   * Get a single contract by ID
   */
  async getContract(id: string): Promise<Contract> {
    try {
      return await factoryContractService.getContract(id);
    } catch (error) {
      this.handleError(`Failed to fetch contract ${id}`, error);
      throw error;
    }
  }

  /**
   * Create a new contract
   */
  async createContract(data: ContractFormData): Promise<Contract> {
    try {
      return await factoryContractService.createContract(data as any);
    } catch (error) {
      this.handleError('Failed to create contract', error);
      throw error;
    }
  }

  /**
   * Update an existing contract
   */
  async updateContract(id: string, data: Partial<ContractFormData>): Promise<Contract> {
    try {
      return await factoryContractService.updateContract(id, data as any);
    } catch (error) {
      this.handleError(`Failed to update contract ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete a contract
   */
  async deleteContract(id: string): Promise<void> {
    try {
      await factoryContractService.deleteContract(id);
    } catch (error) {
      this.handleError(`Failed to delete contract ${id}`, error);
      throw error;
    }
  }

  /**
   * Update contract status
   */
  async updateContractStatus(id: string, status: string): Promise<Contract> {
    try {
      const contractStatus = status as 'draft' | 'pending_approval' | 'active' | 'renewed' | 'expired' | 'terminated';
      return await this.updateContract(id, { status: contractStatus });
    } catch (error) {
      this.handleError(`Failed to update contract status for ${id}`, error);
      throw error;
    }
  }

  /**
   * Approve contract
   */
  async approveContract(id: string, approvalData: { stage: string; comments?: string }): Promise<Contract> {
    try {
      const contract = await this.getContract(id);
      const approvalRecord: ApprovalRecord = {
        id: Date.now().toString(),
        stage: approvalData.stage,
        approver: 'current_user',
        approver_name: 'Current User',
        status: 'approved',
        comments: approvalData.comments,
        approved_at: new Date().toISOString(),
      };
      
      const updatedContract: Contract = {
        ...contract,
        approval_stage: 'approved',
        approval_history: [...contract.approval_history, approvalRecord],
        status: 'active',
        updated_at: new Date().toISOString(),
      };
      
      return updatedContract;
    } catch (error) {
      this.handleError(`Failed to approve contract ${id}`, error);
      throw error;
    }
  }

  /**
   * Get contract statistics
   */
  async getContractStats(): Promise<ContractStats> {
    try {
      // Use factory service for stats calculation
      // The service handles all stat calculations and aggregations
      return await factoryContractService.getContractStats();
    } catch (error) {
      this.handleError('Failed to fetch contract statistics', error);
      throw error;
    }
  }

  /**
   * Get contracts by customer ID
   */
  async getContractsByCustomer(
    customerId: string,
    filters: ContractFilters = {}
  ): Promise<PaginatedResponse<Contract>> {
    try {
      // Use factory service with customer_id filter
      return await factoryContractService.getContracts({ ...filters, customer_id: customerId });
    } catch (error) {
      console.error(`Failed to fetch contracts for customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Get expiring contracts
   */
  async getExpiringContracts(days: number = 30): Promise<Contract[]> {
    try {
      // Use factory service with expiring_soon filter
      const response = await factoryContractService.getExpiringContracts({ expiring_soon: true }, days);
      
      // Safely handle response - could be array or object with data property
      let contracts: Contract[] = [];
      
      if (Array.isArray(response)) {
        contracts = response;
      } else if (response?.data && Array.isArray(response.data)) {
        contracts = response.data;
      }
      
      return contracts;
    } catch (error) {
      this.handleError('Failed to fetch expiring contracts', error);
      throw error;
    }
  }

  /**
   * Get contracts due for renewal
   */
  async getContractsDueForRenewal(days: number = 30): Promise<Contract[]> {
    try {
      // Use factory service to get contracts with auto_renew flag
      const response = await factoryContractService.getContracts({ 
        auto_renew: true,
        pageSize: 1000 
      });
      
      // Safely handle response structure - ensure data is an array
      const contracts = response?.data || response || [];
      
      // Guard against non-array responses
      if (!Array.isArray(contracts)) {
        console.warn('getContractsDueForRenewal: response.data is not an array', { response, contracts });
        return [];
      }
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + days);
      
      return contracts.filter(contract => 
        contract.next_renewal_date && 
        new Date(contract.next_renewal_date) <= cutoffDate &&
        contract.status === 'active'
      );
    } catch (error) {
      this.handleError('Failed to fetch contracts due for renewal', error);
      throw error;
    }
  }

  /**
   * Export contracts
   */
  async exportContracts(format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      const response = await this.getContracts({ pageSize: 10000 });
      const contracts = response.data;

      if (format === 'json') {
        return JSON.stringify(contracts, null, 2);
      }

      // CSV format
      const headers = ['ID', 'Contract Number', 'Title', 'Type', 'Status', 'Customer', 'Value', 'Start Date', 'End Date'];
      const rows = contracts.map(contract => [
        contract.id,
        contract.contract_number || '',
        contract.title,
        contract.type || '',
        contract.status || '',
        contract.customer_name || '',
        contract.value || 0,
        contract.start_date || '',
        contract.end_date || ''
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\r\n');

      return csv;
    } catch (error) {
      this.handleError('Failed to export contracts', error);
      throw error;
    }
  }
}

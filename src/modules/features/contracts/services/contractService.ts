/**
 * Contract Service
 * Business logic for contract management and lifecycle
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
// Import legacy service for actual data fetching
import { contractService as legacyContractService } from '@/services';

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
   */
  async getContracts(filters: ContractFilters = {}): Promise<PaginatedResponse<Contract>> {
    try {
      try {
        // Use the legacy service to fetch real data
        const contracts = await legacyContractService.getContracts(filters);
        
        // Transform to paginated response
        const { page = 1, pageSize = 20 } = filters;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = contracts.slice(startIndex, endIndex);
        
        return {
          data: paginatedData,
          total: contracts.length,
          page,
          pageSize,
          totalPages: Math.ceil(contracts.length / pageSize),
        };
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
      return await legacyContractService.getContract(id);
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
      return await legacyContractService.createContract(data as any);
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
      return await legacyContractService.updateContract(id, data as any);
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
      await legacyContractService.deleteContract(id);
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
      // Get all contracts for stats calculation
      const response = await this.getContracts({ pageSize: 1000 });
      const contracts = response.data;

      const stats: ContractStats = {
        total: contracts.length,
        byStatus: {},
        byType: {},
        activeContracts: 0,
        pendingApproval: 0,
        expiringContracts: 0,
        totalValue: 0,
        averageValue: 0,
        renewalsDue: 0,
      };

      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      // Calculate statistics
      contracts.forEach(contract => {
        // Status stats
        const status = contract.status || 'draft';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

        // Type stats
        const type = contract.type || 'custom';
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        // Status counts
        if (status === 'active') stats.activeContracts++;
        if (status === 'pending_approval') stats.pendingApproval++;

        // Value calculations
        const value = contract.value || 0;
        stats.totalValue += value;

        // Expiring contracts (within 30 days)
        if (contract.end_date && new Date(contract.end_date) <= thirtyDaysFromNow) {
          stats.expiringContracts++;
        }

        // Renewals due
        if (contract.next_renewal_date && new Date(contract.next_renewal_date) <= thirtyDaysFromNow) {
          stats.renewalsDue++;
        }
      });

      // Calculate average value
      stats.averageValue = contracts.length > 0 ? stats.totalValue / contracts.length : 0;

      return stats;
    } catch (error) {
      this.handleError('Failed to fetch contract statistics', error);
      throw error;
    }
  }

  /**
   * Get expiring contracts
   */
  async getExpiringContracts(days: number = 30): Promise<Contract[]> {
    try {
      const response = await this.getContracts({ pageSize: 1000 });
      const contracts = response.data;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + days);
      
      return contracts.filter(contract => 
        contract.end_date && 
        new Date(contract.end_date) <= cutoffDate &&
        contract.status === 'active'
      );
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
      const response = await this.getContracts({ pageSize: 1000 });
      const contracts = response.data;
      
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

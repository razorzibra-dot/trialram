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
  parties: any[];
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
// Import legacy service - will be replaced with actual API calls
// import { contractService as legacyContractService } from '@/services';

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
      // Mock data for now - replace with actual API calls
      const mockContracts: Contract[] = [
        {
          id: '1',
          contract_number: 'CNT-2024-001',
          title: 'Software Development Agreement',
          description: 'Custom software development project for client portal',
          type: 'service_agreement',
          status: 'active',
          customer_id: 'cust1',
          customer_name: 'Acme Corporation',
          customer_contact: 'john.doe@acme.com',
          parties: [
            {
              id: 'party1',
              name: 'John Doe',
              email: 'john.doe@acme.com',
              company: 'Acme Corporation',
              role: 'client',
              is_primary: true,
              signature_required: true,
              signature_status: 'signed',
            }
          ],
          value: 50000,
          total_value: 50000,
          currency: 'USD',
          payment_terms: 'Net 30',
          delivery_terms: '6 months',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          signed_date: '2024-01-01',
          next_renewal_date: '2024-11-01',
          auto_renew: true,
          renewal_period_months: 12,
          approval_stage: 'approved',
          approval_history: [],
          compliance_status: 'compliant',
          created_by: 'user1',
          assigned_to: 'user2',
          assigned_to_name: 'Jane Smith',
          version: 1,
          tags: ['software', 'development', 'portal'],
          priority: 'high',
          reminder_days: [30, 7],
          signature_status: {
            overall_status: 'completed',
            signatures: []
          },
          attachments: [],
          tenant_id: 'tenant1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          contract_number: 'CNT-2024-002',
          title: 'Maintenance Service Agreement',
          description: 'Annual maintenance and support services',
          type: 'service_agreement',
          status: 'pending_approval',
          customer_id: 'cust2',
          customer_name: 'Tech Solutions Inc',
          customer_contact: 'admin@techsolutions.com',
          parties: [],
          value: 25000,
          total_value: 25000,
          currency: 'USD',
          payment_terms: 'Net 15',
          start_date: '2024-02-01',
          end_date: '2025-01-31',
          auto_renew: false,
          approval_stage: 'pending',
          approval_history: [],
          compliance_status: 'pending_review',
          created_by: 'user1',
          version: 1,
          tags: ['maintenance', 'support'],
          priority: 'medium',
          reminder_days: [30],
          signature_status: {
            overall_status: 'pending',
            signatures: []
          },
          attachments: [],
          tenant_id: 'tenant1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      // Apply filters
      let filteredContracts = mockContracts;
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredContracts = filteredContracts.filter(contract =>
          contract.title.toLowerCase().includes(search) ||
          contract.contract_number?.toLowerCase().includes(search) ||
          contract.customer_name?.toLowerCase().includes(search) ||
          (contract.description && contract.description.toLowerCase().includes(search))
        );
      }
      
      if (filters.status) {
        filteredContracts = filteredContracts.filter(contract => contract.status === filters.status);
      }
      
      if (filters.type) {
        filteredContracts = filteredContracts.filter(contract => contract.type === filters.type);
      }
      
      if (filters.customer_id) {
        filteredContracts = filteredContracts.filter(contract => contract.customer_id === filters.customer_id);
      }
      
      // Apply pagination
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = filteredContracts.slice(startIndex, endIndex);
      
      return {
        data: paginatedData,
        total: filteredContracts.length,
        page,
        pageSize,
        totalPages: Math.ceil(filteredContracts.length / pageSize),
      };
    } catch (error) {
      this.handleError('Failed to fetch contracts', error);
      throw error;
    }
  }

  /**
   * Get a single contract by ID
   */
  async getContract(id: string): Promise<Contract> {
    try {
      // Mock implementation - replace with actual API call
      const contracts = await this.getContracts();
      const contract = contracts.data.find(c => c.id === id);
      if (!contract) {
        throw new Error(`Contract with ID ${id} not found`);
      }
      return contract;
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
      // Mock implementation - replace with actual API call
      const newContract: Contract = {
        id: Date.now().toString(),
        contract_number: `CNT-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
        ...data,
        approval_history: [],
        signature_status: {
          overall_status: 'pending',
          signatures: []
        },
        attachments: [],
        version: 1,
        tenant_id: 'tenant1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return newContract;
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
      // Mock implementation - replace with actual API call
      const contract = await this.getContract(id);
      const updatedContract: Contract = {
        ...contract,
        ...data,
        updated_at: new Date().toISOString(),
      };
      return updatedContract;
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
      // Mock implementation - replace with actual API call
      console.log(`Deleting contract ${id}`);
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
      return await this.updateContract(id, { status: status as any });
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

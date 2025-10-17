/**
 * Service Contract Service
 * Business logic for service contract management
 */

import { BaseService } from '@/modules/core/services/BaseService';
import { PaginatedResponse } from '@/modules/core/types';
import { ServiceContract, ServiceContractFilters } from '@/types/productSales';

export interface ServiceContractStats {
  total: number;
  byStatus: Record<string, number>;
  activeContracts: number;
  pendingContracts: number;
  expiredContracts: number;
  totalValue: number;
  averageValue: number;
}

export class ServiceContractService extends BaseService {
  /**
   * Get service contracts with filtering and pagination
   */
  async getServiceContracts(filters: ServiceContractFilters = {}): Promise<PaginatedResponse<ServiceContract>> {
    try {
      // Mock data for now - replace with actual API calls
      const mockServiceContracts: ServiceContract[] = [
        {
          id: '1',
          contract_number: 'SVC-2024-001',
          customer_id: 'cust1',
          customer_name: 'Acme Corporation',
          product_id: 'prod1',
          product_name: 'Premium Support Package',
          service_type: 'support',
          status: 'active',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          value: 12000,
          currency: 'USD',
          billing_frequency: 'monthly',
          auto_renew: true,
          renewal_terms: 'Automatic renewal for 12 months',
          sla_terms: '24/7 support with 4-hour response time',
          description: 'Premium support package with dedicated account manager',
          assigned_to: 'user1',
          assigned_to_name: 'John Smith',
          tenant_id: 'tenant1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'user1',
        },
        {
          id: '2',
          contract_number: 'SVC-2024-002',
          customer_id: 'cust2',
          customer_name: 'Tech Solutions Inc',
          product_id: 'prod2',
          product_name: 'Basic Maintenance',
          service_type: 'maintenance',
          status: 'pending',
          start_date: '2024-02-01',
          end_date: '2025-01-31',
          value: 6000,
          currency: 'USD',
          billing_frequency: 'quarterly',
          auto_renew: false,
          description: 'Basic maintenance services for software systems',
          assigned_to: 'user2',
          assigned_to_name: 'Jane Doe',
          tenant_id: 'tenant1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'user1',
        },
      ];
      
      // Apply filters
      let filteredContracts = mockServiceContracts;
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredContracts = filteredContracts.filter(contract =>
          contract.contract_number?.toLowerCase().includes(search) ||
          contract.customer_name?.toLowerCase().includes(search) ||
          contract.product_name?.toLowerCase().includes(search) ||
          (contract.description && contract.description.toLowerCase().includes(search))
        );
      }
      
      if (filters.status) {
        filteredContracts = filteredContracts.filter(contract => contract.status === filters.status);
      }
      
      if (filters.service_type) {
        filteredContracts = filteredContracts.filter(contract => contract.service_type === filters.service_type);
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
      this.handleError('Failed to fetch service contracts', error);
      throw error;
    }
  }

  /**
   * Get a single service contract by ID
   */
  async getServiceContract(id: string): Promise<ServiceContract> {
    try {
      // Mock implementation - replace with actual API call
      const contracts = await this.getServiceContracts();
      const contract = contracts.data.find(c => c.id === id);
      if (!contract) {
        throw new Error(`Service contract with ID ${id} not found`);
      }
      return contract;
    } catch (error) {
      this.handleError(`Failed to fetch service contract ${id}`, error);
      throw error;
    }
  }

  /**
   * Create a new service contract
   */
  async createServiceContract(data: Partial<ServiceContract>): Promise<ServiceContract> {
    try {
      // Mock implementation - replace with actual API call
      const newContract: ServiceContract = {
        id: Date.now().toString(),
        contract_number: `SVC-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
        ...data,
        tenant_id: 'tenant1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'current_user',
      } as ServiceContract;
      return newContract;
    } catch (error) {
      this.handleError('Failed to create service contract', error);
      throw error;
    }
  }

  /**
   * Update an existing service contract
   */
  async updateServiceContract(id: string, data: Partial<ServiceContract>): Promise<ServiceContract> {
    try {
      // Mock implementation - replace with actual API call
      const contract = await this.getServiceContract(id);
      const updatedContract: ServiceContract = {
        ...contract,
        ...data,
        updated_at: new Date().toISOString(),
      };
      return updatedContract;
    } catch (error) {
      this.handleError(`Failed to update service contract ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete a service contract
   */
  async deleteServiceContract(id: string): Promise<void> {
    try {
      // Mock implementation - replace with actual API call
      console.log(`Deleting service contract ${id}`);
    } catch (error) {
      this.handleError(`Failed to delete service contract ${id}`, error);
      throw error;
    }
  }

  /**
   * Update service contract status
   */
  async updateServiceContractStatus(id: string, status: string): Promise<ServiceContract> {
    try {
      const contractStatus = status as 'draft' | 'active' | 'completed' | 'cancelled' | 'on_hold';
      return await this.updateServiceContract(id, { status: contractStatus });
    } catch (error) {
      this.handleError(`Failed to update service contract status for ${id}`, error);
      throw error;
    }
  }

  /**
   * Get service contract statistics
   */
  async getServiceContractStats(): Promise<ServiceContractStats> {
    try {
      // Get all service contracts for stats calculation
      const response = await this.getServiceContracts({ pageSize: 1000 });
      const contracts = response.data;

      const stats: ServiceContractStats = {
        total: contracts.length,
        byStatus: {},
        activeContracts: 0,
        pendingContracts: 0,
        expiredContracts: 0,
        totalValue: 0,
        averageValue: 0,
      };

      // Calculate statistics
      contracts.forEach(contract => {
        // Status stats
        const status = contract.status || 'pending';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

        // Status counts
        if (status === 'active') stats.activeContracts++;
        if (status === 'pending') stats.pendingContracts++;
        if (status === 'expired') stats.expiredContracts++;

        // Value calculations
        const value = contract.value || 0;
        stats.totalValue += value;
      });

      // Calculate average value
      stats.averageValue = contracts.length > 0 ? stats.totalValue / contracts.length : 0;

      return stats;
    } catch (error) {
      this.handleError('Failed to fetch service contract statistics', error);
      throw error;
    }
  }

  /**
   * Get service contract types
   */
  async getServiceTypes(): Promise<string[]> {
    return ['support', 'maintenance', 'consulting', 'training', 'hosting', 'custom'];
  }

  /**
   * Get service contract statuses
   */
  async getServiceContractStatuses(): Promise<string[]> {
    return ['pending', 'active', 'suspended', 'expired', 'cancelled'];
  }

  /**
   * Export service contracts
   */
  async exportServiceContracts(format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      const response = await this.getServiceContracts({ pageSize: 10000 });
      const contracts = response.data;

      if (format === 'json') {
        return JSON.stringify(contracts, null, 2);
      }

      // CSV format
      const headers = ['ID', 'Contract Number', 'Customer', 'Product', 'Service Type', 'Status', 'Value', 'Start Date', 'End Date'];
      const rows = contracts.map(contract => [
        contract.id,
        contract.contract_number || '',
        contract.customer_name || '',
        contract.product_name || '',
        contract.service_type || '',
        contract.status || '',
        contract.value || 0,
        contract.start_date || '',
        contract.end_date || ''
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\r\n');

      return csv;
    } catch (error) {
      this.handleError('Failed to export service contracts', error);
      throw error;
    }
  }

  /**
   * Bulk update service contracts
   */
  async bulkUpdateServiceContracts(ids: string[], updates: Partial<ServiceContract>): Promise<ServiceContract[]> {
    try {
      const promises = ids.map(id => this.updateServiceContract(id, updates));
      return await Promise.all(promises);
    } catch (error) {
      this.handleError('Failed to bulk update service contracts', error);
      throw error;
    }
  }

  /**
   * Bulk delete service contracts
   */
  async bulkDeleteServiceContracts(ids: string[]): Promise<void> {
    try {
      const promises = ids.map(id => this.deleteServiceContract(id));
      await Promise.all(promises);
    } catch (error) {
      this.handleError('Failed to bulk delete service contracts', error);
      throw error;
    }
  }
}

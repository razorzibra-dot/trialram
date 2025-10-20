/**
 * Customer Service
 * Business logic for customer operations
 */

import { BaseService } from '@/modules/core/services/BaseService';
import { Customer, CustomerTag } from '@/types/crm';
import { FilterOptions, PaginatedResponse } from '@/modules/core/types';
import { customerService as legacyCustomerService } from '@/services';

export interface CreateCustomerData {
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'enterprise';
  status?: 'active' | 'inactive' | 'prospect';
  customer_type?: 'business' | 'individual';
  credit_limit?: number;
  payment_terms?: string;
  tax_id?: string;
  notes?: string;
  assigned_to?: string;
  source?: string;
  rating?: string;
  tags?: CustomerTag[];
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  id: string;
}

export interface CustomerFilters extends FilterOptions {
  status?: string;
  industry?: string;
  size?: string;
  assignedTo?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export class CustomerService extends BaseService {
  /**
   * Get paginated customers with filters
   */
  async getCustomers(filters: CustomerFilters = {}): Promise<PaginatedResponse<Customer>> {
    try {
      try {
        // For now, use the legacy service
        const customers = await legacyCustomerService.getCustomers(filters);
        
        // Transform to paginated response
        const { page = 1, pageSize = 20 } = filters;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = customers.slice(startIndex, endIndex);
        
        return {
          data: paginatedData,
          total: customers.length,
          page,
          pageSize,
          totalPages: Math.ceil(customers.length / pageSize),
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
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  /**
   * Get a single customer by ID
   */
  async getCustomer(id: string): Promise<Customer> {
    try {
      return await legacyCustomerService.getCustomer(id);
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    try {
      return await legacyCustomerService.createCustomer(data);
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(id: string, data: Partial<CreateCustomerData>): Promise<Customer> {
    try {
      return await legacyCustomerService.updateCustomer(id, data);
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(id: string): Promise<void> {
    try {
      await legacyCustomerService.deleteCustomer(id);
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  /**
   * Bulk delete customers
   */
  async bulkDeleteCustomers(ids: string[]): Promise<void> {
    try {
      await Promise.all(ids.map(id => this.deleteCustomer(id)));
    } catch (error) {
      console.error('Error bulk deleting customers:', error);
      throw error;
    }
  }

  /**
   * Bulk update customers
   */
  async bulkUpdateCustomers(ids: string[], updates: Partial<CreateCustomerData>): Promise<Customer[]> {
    try {
      const results = await Promise.all(
        ids.map(id => this.updateCustomer(id, updates))
      );
      return results;
    } catch (error) {
      console.error('Error bulk updating customers:', error);
      throw error;
    }
  }

  /**
   * Get customer tags
   */
  async getTags(): Promise<CustomerTag[]> {
    try {
      return await legacyCustomerService.getTags();
    } catch (error) {
      console.error('Error fetching customer tags:', error);
      throw error;
    }
  }

  /**
   * Create a new tag
   */
  async createTag(name: string, color: string): Promise<CustomerTag> {
    try {
      return await legacyCustomerService.createTag(name, color);
    } catch (error) {
      console.error('Error creating customer tag:', error);
      throw error;
    }
  }

  /**
   * Get available industries
   */
  async getIndustries(): Promise<string[]> {
    try {
      return await legacyCustomerService.getIndustries();
    } catch (error) {
      console.error('Error fetching industries:', error);
      throw error;
    }
  }

  /**
   * Get available company sizes
   */
  async getSizes(): Promise<string[]> {
    try {
      return await legacyCustomerService.getSizes();
    } catch (error) {
      console.error('Error fetching company sizes:', error);
      throw error;
    }
  }

  /**
   * Export customers
   */
  async exportCustomers(format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      return await legacyCustomerService.exportCustomers(format);
    } catch (error) {
      console.error('Error exporting customers:', error);
      throw error;
    }
  }

  /**
   * Import customers from CSV
   */
  async importCustomers(csv: string): Promise<{ success: number; errors: string[] }> {
    try {
      return await legacyCustomerService.importCustomers(csv);
    } catch (error) {
      console.error('Error importing customers:', error);
      throw error;
    }
  }

  /**
   * Search customers
   */
  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      const filters = { search: query };
      const result = await this.getCustomers(filters);
      return result.data;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    prospects: number;
    byIndustry: Record<string, number>;
    bySize: Record<string, number>;
    recentlyAdded: number;
  }> {
    try {
      try {
        const customers = await legacyCustomerService.getCustomers();
        
        const stats = {
          total: customers.length,
          active: customers.filter(c => c.status === 'active').length,
          inactive: customers.filter(c => c.status === 'inactive').length,
          prospects: customers.filter(c => c.status === 'prospect').length,
          byIndustry: {} as Record<string, number>,
          bySize: {} as Record<string, number>,
          recentlyAdded: 0,
        };

        // Calculate industry distribution
        customers.forEach(customer => {
          const industry = customer.industry || 'Unknown';
          stats.byIndustry[industry] = (stats.byIndustry[industry] || 0) + 1;
        });

        // Calculate size distribution
        customers.forEach(customer => {
          const size = customer.size || 'Unknown';
          stats.bySize[size] = (stats.bySize[size] || 0) + 1;
        });

        // Calculate recently added (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        stats.recentlyAdded = customers.filter(c => 
          new Date(c.created_at) > thirtyDaysAgo
        ).length;

        return stats;
      } catch (error) {
        // Handle tenant context not initialized gracefully
        if (error instanceof Error && error.message.includes('Tenant context not initialized')) {
          // Return empty stats instead of throwing
          return {
            total: 0,
            active: 0,
            inactive: 0,
            prospects: 0,
            byIndustry: {},
            bySize: {},
            recentlyAdded: 0,
          };
        }
        throw error;
      }
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      throw error;
    }
  }
}

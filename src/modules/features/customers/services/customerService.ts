/**
 * Customer Service
 * Business logic for customer operations
 * Uses the API Service Factory to respect VITE_API_MODE configuration
 */

import { BaseService } from '@/modules/core/services/BaseService';
import { Customer, CustomerTag } from '@/types/crm';
import { FilterOptions, PaginatedResponse } from '@/modules/core/types';
import { apiServiceFactory } from '@/services/api/apiServiceFactory';

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
      console.log('[CustomerService] getCustomers called with filters:', filters);
      
      // Use the API Service Factory to respect VITE_API_MODE configuration
      const result = await apiServiceFactory.getCustomerService().getCustomers(filters);
      
      console.log('[CustomerService] Received result from factory:', result);
      
      // Handle both array and paginated response formats
      let allCustomers: Customer[] = [];
      if (Array.isArray(result)) {
        console.log('[CustomerService] Result is array, length:', result.length);
        allCustomers = result;
      } else if (result && typeof result === 'object' && 'data' in result && Array.isArray(result.data)) {
        console.log('[CustomerService] Result is paginated response, data length:', result.data.length);
        allCustomers = result.data;
      } else {
        console.error('[CustomerService] Unexpected result format:', result);
        allCustomers = [];
      }
      
      // Transform to paginated response
      const { page = 1, pageSize = 20 } = filters;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = allCustomers.slice(startIndex, endIndex);
      
      console.log('[CustomerService] Returning paginated response - total:', allCustomers.length, 'page:', page, 'data:', paginatedData.length);
      
      return {
        data: paginatedData,
        total: allCustomers.length,
        page,
        pageSize,
        totalPages: Math.ceil(allCustomers.length / pageSize),
      };
    } catch (error) {
      // Handle authorization/tenant context errors gracefully by returning empty response
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[CustomerService] Error fetching customers:', errorMsg);
      
      if (errorMsg.includes('Tenant context not initialized') || errorMsg.includes('Unauthorized')) {
        // Return empty response instead of throwing when auth context is not ready
        const { page = 1, pageSize = 20 } = filters;
        console.log('[CustomerService] ✅ Auth context not ready - returning empty response gracefully');
        return {
          data: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        };
      }
      
      // For other errors, log and re-throw
      console.error('[CustomerService] ❌ Unexpected error, rethrowing:', error);
      throw error;
    }
  }

  /**
   * Get a single customer by ID
   */
  async getCustomer(id: string): Promise<Customer | null> {
    try {
      return await apiServiceFactory.getCustomerService().getCustomer(id);
    } catch (error) {
      // Handle authorization/tenant context errors gracefully by returning null
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[CustomerService] Error fetching customer:', errorMsg);
      
      if (errorMsg.includes('Tenant context not initialized') || errorMsg.includes('Unauthorized')) {
        console.log('[CustomerService] ✅ Auth context not ready - returning null for customer');
        return null;
      }
      
      // For other errors, log and re-throw
      console.error('[CustomerService] ❌ Unexpected error, rethrowing:', error);
      throw error;
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    try {
      return await apiServiceFactory.getCustomerService().createCustomer(data);
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
      return await apiServiceFactory.getCustomerService().updateCustomer(id, data);
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
      await apiServiceFactory.getCustomerService().deleteCustomer(id);
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
      return await apiServiceFactory.getCustomerService().getTags();
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
      return await apiServiceFactory.getCustomerService().createTag(name, color);
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
      return await apiServiceFactory.getCustomerService().getIndustries();
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
      return await apiServiceFactory.getCustomerService().getSizes();
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
      return await apiServiceFactory.getCustomerService().exportCustomers(format);
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
      return await apiServiceFactory.getCustomerService().importCustomers(csv);
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
      console.log('[CustomerService] getCustomerStats() called');
      
      // Try to use the factory's getCustomerStats if available
      const factoryService = apiServiceFactory.getCustomerService();
      if (factoryService.getCustomerStats) {
        console.log('[CustomerService] Using factory service getCustomerStats()');
        const factoryStats = await factoryService.getCustomerStats();
        
        // Map factory stats to wrapper format
        return {
          total: (factoryStats as any).totalCustomers || 0,
          active: (factoryStats as any).activeCustomers || 0,
          inactive: (factoryStats as any).inactiveCustomers || 0,
          prospects: (factoryStats as any).prospectCustomers || 0,
          byIndustry: (factoryStats as any).byIndustry || {},
          bySize: (factoryStats as any).bySize || {},
          recentlyAdded: 0, // Factory doesn't calculate this, would need additional logic
        };
      }
      
      // Fallback: fetch customers and calculate stats manually
      console.log('[CustomerService] Falling back to manual calculation via getCustomers()');
      try {
        const customers = await apiServiceFactory.getCustomerService().getCustomers();
        
        console.log('[CustomerService] Got customers array, length:', customers?.length || 0);
        console.log('[CustomerService] Customers data type:', typeof customers, 'Is array?', Array.isArray(customers));
        
        // Safety check: handle both array and paginated response
        let customerArray: any[] = [];
        if (Array.isArray(customers)) {
          customerArray = customers;
        } else if (customers && typeof customers === 'object' && 'data' in customers) {
          console.log('[CustomerService] ⚠️ Got paginated response instead of array!');
          customerArray = (customers as any).data || [];
        } else {
          console.error('[CustomerService] ❌ Unexpected response format:', customers);
          customerArray = [];
        }
        
        const stats = {
          total: customerArray.length,
          active: customerArray.filter(c => (c as any).status === 'active').length,
          inactive: customerArray.filter(c => (c as any).status === 'inactive').length,
          prospects: customerArray.filter(c => (c as any).status === 'prospect').length,
          byIndustry: {} as Record<string, number>,
          bySize: {} as Record<string, number>,
          recentlyAdded: 0,
        };

        // Calculate industry distribution
        customerArray.forEach(customer => {
          const industry = (customer as any).industry || 'Unknown';
          stats.byIndustry[industry] = (stats.byIndustry[industry] || 0) + 1;
        });

        // Calculate size distribution
        customerArray.forEach(customer => {
          const size = (customer as any).size || 'Unknown';
          stats.bySize[size] = (stats.bySize[size] || 0) + 1;
        });

        // Calculate recently added (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        stats.recentlyAdded = customerArray.filter(c => 
          new Date((c as any).created_at) > thirtyDaysAgo
        ).length;

        console.log('[CustomerService] Calculated stats:', stats);
        return stats;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[CustomerService] ❌ Error calculating stats:', errorMsg, error);
        
        // Handle tenant context not initialized gracefully
        if (errorMsg.includes('Tenant context not initialized') || errorMsg.includes('Unauthorized')) {
          console.log('[CustomerService] 📋 Returning empty stats due to auth/tenant context');
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
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[CustomerService] ❌ CRITICAL Error fetching customer stats:', errorMsg, error);
      throw error;
    }
  }
}

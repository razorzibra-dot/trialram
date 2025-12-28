/**
 * Customer Service
 * Business logic for customer operations
 * ⚠️ CRITICAL: Uses Service Factory Pattern for multi-backend routing
 * 
 * This module delegates all customer operations through the centralized Service Factory
 * which routes requests to mock (development) or Supabase (production) based on VITE_API_MODE.
 * 
 * See: /src/services/serviceFactory.ts for factory routing logic
 * 
 * Module Distinction:
 * - This module manages CUSTOMER entity and business logic
 * - NOT to be confused with Product/Product Sales or other modules
 */

import { BaseService } from '@/modules/core/services/BaseService';
import { Customer, CustomerTag } from '@/types/crm';
import { FilterOptions, PaginatedResponse } from '@/modules/core/types';
import { customerService as factoryCustomerService } from '@/services/serviceFactory';

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

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  prospectCustomers: number;
  byIndustry: Record<string, number>;
  bySize: Record<string, number>;
  byStatus: Record<string, number>;
  recentlyAdded: number;
}

export interface ICustomerService {
  getCustomers(filters?: CustomerFilters): Promise<PaginatedResponse<Customer>>;
  getCustomer(id: string): Promise<Customer | null>;
  createCustomer(data: CreateCustomerData): Promise<Customer>;
  updateCustomer(id: string, data: Partial<CreateCustomerData>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  bulkDeleteCustomers(ids: string[]): Promise<void>;
  bulkUpdateCustomers(ids: string[], updates: Partial<CreateCustomerData>): Promise<Customer[]>;
  getTags(): Promise<CustomerTag[]>;
  createTag(name: string, color: string): Promise<CustomerTag>;
  getIndustries(): Promise<string[]>;
  getSizes(): Promise<string[]>;
  exportCustomers(format?: 'csv' | 'json'): Promise<string>;
  importCustomers(csv: string): Promise<{ success: number; errors: string[] }>;
  searchCustomers(query: string): Promise<Customer[]>;
  getCustomerStats(): Promise<CustomerStats>;
  // Advanced analytics methods
  getCustomerAnalytics(filters?: {
    dateRange?: { start: string; end: string };
    segment?: string;
    industry?: string;
  }): Promise<{
    totalRevenue: number;
    averageOrderValue: number;
    customerLifetimeValue: number;
    churnRate: number;
    retentionRate: number;
    acquisitionRate: number;
    customerSatisfaction: number;
    npsScore: number;
    topCustomers: Array<{ id: string; name: string; value: number }>;
    revenueByMonth: Record<string, number>;
    customerGrowth: Record<string, number>;
  }>;
  getCustomerSegmentationAnalytics(): Promise<{
    segments: Array<{
      name: string;
      customerCount: number;
      averageValue: number;
      churnRisk: number;
      engagementScore: number;
    }>;
    segmentTrends: Record<string, Record<string, number>>;
    segmentPerformance: Record<string, {
      revenue: number;
      growth: number;
      satisfaction: number;
    }>;
  }>;
  getCustomerLifecycleAnalytics(): Promise<{
    lifecycleStages: Array<{
      stage: string;
      customerCount: number;
      averageDays: number;
      conversionRate: number;
      dropOffRate: number;
    }>;
    lifecycleTrends: Record<string, Record<string, number>>;
    stageTransitions: Record<string, Record<string, number>>;
  }>;
  getCustomerBehaviorAnalytics(): Promise<{
    engagementMetrics: {
      averageInteractionsPerCustomer: number;
      mostActiveTime: string;
      preferredChannels: Record<string, number>;
      responseTimes: {
        average: number;
        median: number;
        p95: number;
      };
    };
    purchasePatterns: {
      averageOrderFrequency: number;
      commonProductCategories: Record<string, number>;
      seasonalTrends: Record<string, number>;
      basketAnalysis: Array<{
        product: string;
        frequentlyBoughtWith: string[];
        confidence: number;
      }>;
    };
    churnIndicators: Array<{
      customerId: string;
      riskScore: number;
      indicators: string[];
      predictedChurnDate?: string;
    }>;
  }>;
}

export class CustomerService extends BaseService implements ICustomerService {
  /**
   * Get paginated customers with filters
   */
  async getCustomers(filters: CustomerFilters = {}): Promise<PaginatedResponse<Customer>> {
    try {
      console.log('[CustomerService] getCustomers called with filters:', filters);
      
      // Delegate to factory service (routes to mock or Supabase based on VITE_API_MODE)
      const result = await factoryCustomerService.getCustomers(filters);
      
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
      return await factoryCustomerService.getCustomer(id);
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
      return await factoryCustomerService.createCustomer(data);
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
      return await factoryCustomerService.updateCustomer(id, data);
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
      await factoryCustomerService.deleteCustomer(id);
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
      return await factoryCustomerService.getTags();
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
      return await factoryCustomerService.createTag(name, color);
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
      return await factoryCustomerService.getIndustries();
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
      return await factoryCustomerService.getSizes();
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
      return await factoryCustomerService.exportCustomers(format);
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
      return await factoryCustomerService.importCustomers(csv);
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
  async getCustomerStats(): Promise<CustomerStats> {
    try {
      console.log('[CustomerService] getCustomerStats() called');
      
      // Try to use the factory's getCustomerStats if available
      const factoryService = factoryCustomerService;
      if (factoryService.getCustomerStats) {
        console.log('[CustomerService] Using factory service getCustomerStats()');
        const factoryStats = await factoryService.getCustomerStats();
        
        // Map factory stats to wrapper format
        return {
          totalCustomers: (factoryStats as any).totalCustomers || (factoryStats as any).total || 0,
          activeCustomers: (factoryStats as any).activeCustomers || (factoryStats as any).active || 0,
          inactiveCustomers: (factoryStats as any).inactiveCustomers || (factoryStats as any).inactive || 0,
          prospectCustomers: (factoryStats as any).prospectCustomers || (factoryStats as any).prospects || 0,
          byIndustry: (factoryStats as any).byIndustry || {},
          bySize: (factoryStats as any).bySize || {},
          byStatus: (factoryStats as any).byStatus || {},
          recentlyAdded: (factoryStats as any).recentlyAdded || 0,
        };
      }
      
      // Fallback: fetch customers and calculate stats manually
      console.log('[CustomerService] Falling back to manual calculation via getCustomers()');
      try {
        const customers = await factoryCustomerService.getCustomers();
        
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
        
        const stats: CustomerStats = {
          totalCustomers: customerArray.length,
          activeCustomers: customerArray.filter(c => (c as any).status === 'active').length,
          inactiveCustomers: customerArray.filter(c => (c as any).status === 'inactive').length,
          prospectCustomers: customerArray.filter(c => (c as any).status === 'prospect').length,
          byIndustry: {} as Record<string, number>,
          bySize: {} as Record<string, number>,
          byStatus: {} as Record<string, number>,
          recentlyAdded: 0,
        };

        // Calculate industry distribution
        customerArray.forEach(customer => {
          // Normalize industry to lowercase for consistent grouping
          const industry = ((customer as any).industry || 'unknown').toLowerCase();
          stats.byIndustry[industry] = (stats.byIndustry[industry] || 0) + 1;
        });

        // Calculate size distribution
        customerArray.forEach(customer => {
          const size = ((customer as any).size || 'unknown').toLowerCase();
          stats.bySize[size] = (stats.bySize[size] || 0) + 1;
        });

        // Calculate status distribution
        customerArray.forEach(customer => {
          const status = ((customer as any).status || 'unknown').toLowerCase();
          stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
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
          totalCustomers: 0,
          activeCustomers: 0,
          inactiveCustomers: 0,
          prospectCustomers: 0,
          byIndustry: {},
          bySize: {},
          byStatus: {},
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

  /**
   * Get advanced customer analytics
   */
  async getCustomerAnalytics(filters?: {
    dateRange?: { start: string; end: string };
    segment?: string;
    industry?: string;
  }): Promise<{
    totalRevenue: number;
    averageOrderValue: number;
    customerLifetimeValue: number;
    churnRate: number;
    retentionRate: number;
    acquisitionRate: number;
    customerSatisfaction: number;
    npsScore: number;
    topCustomers: Array<{ id: string; name: string; value: number }>;
    revenueByMonth: Record<string, number>;
    customerGrowth: Record<string, number>;
  }> {
    try {
      return await factoryCustomerService.getCustomerAnalytics(filters);
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      throw error;
    }
  }

  /**
   * Get customer segmentation analytics
   */
  async getCustomerSegmentationAnalytics(): Promise<{
    segments: Array<{
      name: string;
      customerCount: number;
      averageValue: number;
      churnRisk: number;
      engagementScore: number;
    }>;
    segmentTrends: Record<string, Record<string, number>>;
    segmentPerformance: Record<string, {
      revenue: number;
      growth: number;
      satisfaction: number;
    }>;
  }> {
    try {
      return await factoryCustomerService.getCustomerSegmentationAnalytics();
    } catch (error) {
      console.error('Error fetching customer segmentation analytics:', error);
      throw error;
    }
  }

  /**
   * Get customer lifecycle analytics
   */
  async getCustomerLifecycleAnalytics(): Promise<{
    lifecycleStages: Array<{
      stage: string;
      customerCount: number;
      averageDays: number;
      conversionRate: number;
      dropOffRate: number;
    }>;
    lifecycleTrends: Record<string, Record<string, number>>;
    stageTransitions: Record<string, Record<string, number>>;
  }> {
    try {
      return await factoryCustomerService.getCustomerLifecycleAnalytics();
    } catch (error) {
      console.error('Error fetching customer lifecycle analytics:', error);
      throw error;
    }
  }

  /**
   * Get customer behavior analytics
   */
  async getCustomerBehaviorAnalytics(): Promise<{
    engagementMetrics: {
      averageInteractionsPerCustomer: number;
      mostActiveTime: string;
      preferredChannels: Record<string, number>;
      responseTimes: {
        average: number;
        median: number;
        p95: number;
      };
    };
    purchasePatterns: {
      averageOrderFrequency: number;
      commonProductCategories: Record<string, number>;
      seasonalTrends: Record<string, number>;
      basketAnalysis: Array<{
        product: string;
        frequentlyBoughtWith: string[];
        confidence: number;
      }>;
    };
    churnIndicators: Array<{
      customerId: string;
      riskScore: number;
      indicators: string[];
      predictedChurnDate?: string;
    }>;
  }> {
    try {
      return await factoryCustomerService.getCustomerBehaviorAnalytics();
    } catch (error) {
      console.error('Error fetching customer behavior analytics:', error);
      throw error;
    }
  }
}

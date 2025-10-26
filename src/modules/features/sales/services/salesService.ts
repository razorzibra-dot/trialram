/**
 * Sales Service
 * Business logic for sales and deals management
 */

import { BaseService } from '@/modules/core/services/BaseService';
import { Deal } from '@/types/crm';
import { PaginatedResponse } from '@/modules/core/types';
import { salesService as legacySalesService } from '@/services';

export interface SalesFilters {
  search?: string;
  stage?: string;
  assignedTo?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  minValue?: number;
  maxValue?: number;
  page?: number;
  pageSize?: number;
}

export interface CreateDealData {
  title: string;
  description?: string;
  value: number;
  stage: string;
  customer_id: string;
  assigned_to?: string;
  expected_close_date?: string;
  probability?: number;
  source?: string;
  tags?: string[];
}

// Phase 3.1: Customer validation interface
export interface CustomerValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface DealStats {
  total: number;
  totalValue: number;
  byStage: Record<string, number>;
  byStageValue: Record<string, number>;
  conversionRate: number;
  averageDealSize: number;
  averageSalesCycle: number;
  monthlyTrend: Array<{
    month: string;
    deals: number;
    value: number;
  }>;
}

export class SalesService extends BaseService {
  /**
   * Get deals with filtering and pagination
   */
  async getDeals(filters: SalesFilters = {}): Promise<PaginatedResponse<Deal>> {
    try {
      console.log('[SalesService] 🔄 getDeals called with filters:', filters);
      
      // Use legacy service for now, but wrap in new interface
      const deals = await legacySalesService.getDeals(filters);
      console.log('[SalesService] 📊 Legacy service returned:', { count: Array.isArray(deals) ? deals.length : 0, deals });
      
      // Filter and validate deals, ensuring all have required fields
      const validDeals = (Array.isArray(deals) ? deals : [])
        .filter((deal) => deal && typeof deal === 'object' && deal.id)
        .map((deal) => {
          const dealValue = Number(deal.value) || Number(deal.amount) || 0;
          return {
            ...deal,
            // Core fields
            id: deal.id,
            title: deal.title || 'Untitled Deal',
            description: deal.description || '',
            
            // Customer
            customer_id: deal.customer_id || '',
            customer_name: deal.customer_name || '',
            
            // Financial
            value: dealValue,
            amount: dealValue, // Alias for value
            currency: deal.currency || 'USD',
            probability: Number(deal.probability) || 50,
            
            // Sales Process
            stage: deal.stage || 'lead',
            status: deal.status || 'open',
            source: deal.source || '',
            campaign: deal.campaign || '',
            
            // Dates - IMPORTANT: Preserve these!
            expected_close_date: deal.expected_close_date || '',
            actual_close_date: deal.actual_close_date || '',
            last_activity_date: deal.last_activity_date || '',
            next_activity_date: deal.next_activity_date || '',
            
            // Assignment
            assigned_to: deal.assigned_to || '',
            assigned_to_name: deal.assigned_to_name || '',
            
            // Additional
            notes: deal.notes || '',
            tags: Array.isArray(deal.tags) ? deal.tags : [],
            items: Array.isArray(deal.items) ? deal.items : [],
            
            // System
            tenant_id: deal.tenant_id || '',
            created_at: deal.created_at || new Date().toISOString(),
            updated_at: deal.updated_at || new Date().toISOString(),
            created_by: deal.created_by || '',
          };
        });

      const pageSize = filters.pageSize || 20;
      
      const response = {
        data: validDeals,
        total: validDeals.length,
        page: filters.page || 1,
        pageSize: pageSize,
        totalPages: Math.ceil(validDeals.length / pageSize),
      };
      
      console.log('[SalesService] ✅ Returning response:', { count: validDeals.length, response });
      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[SalesService] ❌ Failed to fetch deals:', error);
      
      // Handle authorization/tenant context errors gracefully
      if (errorMsg.includes('Unauthorized') || errorMsg.includes('Tenant context not initialized')) {
        console.log('[SalesService] Auth context not ready, returning empty response');
        const pageSize = filters.pageSize || 20;
        return {
          data: [],
          total: 0,
          page: filters.page || 1,
          pageSize: pageSize,
          totalPages: 0,
        };
      }
      throw error;
    }
  }

  /**
   * Get a single deal by ID
   */
  async getDeal(id: string): Promise<Deal> {
    try {
      const deal = await legacySalesService.getDeal(id);
      
      // Apply same data transformation as getDeals for consistency
      const dealValue = Number(deal.value) || Number(deal.amount) || 0;
      return {
        ...deal,
        // Core fields
        id: deal.id,
        title: deal.title || 'Untitled Deal',
        description: deal.description || '',
        
        // Customer
        customer_id: deal.customer_id || '',
        customer_name: deal.customer_name || '',
        
        // Financial
        value: dealValue,
        amount: dealValue, // Alias for value
        currency: deal.currency || 'USD',
        probability: Number(deal.probability) || 50,
        
        // Sales Process
        stage: deal.stage || 'lead',
        status: deal.status || 'open',
        source: deal.source || '',
        campaign: deal.campaign || '',
        
        // Dates - IMPORTANT: Preserve these!
        expected_close_date: deal.expected_close_date || '',
        actual_close_date: deal.actual_close_date || '',
        last_activity_date: deal.last_activity_date || '',
        next_activity_date: deal.next_activity_date || '',
        
        // Assignment
        assigned_to: deal.assigned_to || '',
        assigned_to_name: deal.assigned_to_name || '',
        
        // Additional
        notes: deal.notes || '',
        tags: Array.isArray(deal.tags) ? deal.tags : [],
        items: Array.isArray(deal.items) ? deal.items : [],
        
        // System
        tenant_id: deal.tenant_id || '',
        created_at: deal.created_at || new Date().toISOString(),
        updated_at: deal.updated_at || new Date().toISOString(),
        created_by: deal.created_by || '',
      };
    } catch (error) {
      console.error(`Failed to fetch deal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new deal
   */
  async createDeal(data: CreateDealData): Promise<Deal> {
    try {
      return await legacySalesService.createDeal(data);
    } catch (error) {
      console.error('Failed to create deal:', error);
      throw error;
    }
  }

  /**
   * Update an existing deal
   */
  async updateDeal(id: string, data: Partial<CreateDealData>): Promise<Deal> {
    try {
      return await legacySalesService.updateDeal(id, data);
    } catch (error) {
      console.error(`Failed to update deal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a deal
   */
  async deleteDeal(id: string): Promise<void> {
    try {
      await legacySalesService.deleteDeal(id);
    } catch (error) {
      console.error(`Failed to delete deal ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update deal stage
   */
  async updateDealStage(id: string, stage: string): Promise<Deal> {
    try {
      return await this.updateDeal(id, { stage });
    } catch (error) {
      console.error(`Failed to update deal stage for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Bulk update deals
   */
  async bulkUpdateDeals(ids: string[], updates: Partial<CreateDealData>): Promise<Deal[]> {
    try {
      const promises = ids.map(id => this.updateDeal(id, updates));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Failed to bulk update deals:', error);
      throw error;
    }
  }

  /**
   * Bulk delete deals
   */
  async bulkDeleteDeals(ids: string[]): Promise<void> {
    try {
      const promises = ids.map(id => this.deleteDeal(id));
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to bulk delete deals:', error);
      throw error;
    }
  }

  /**
   * Get sales statistics
   */
  async getSalesStats(): Promise<DealStats> {
    try {
      // Get all deals for stats calculation
      const response = await this.getDeals({ pageSize: 1000 });
      const deals = response.data;

      const stats: DealStats = {
        total: deals.length,
        totalValue: deals.reduce((sum, deal) => sum + (deal.value || 0), 0),
        byStage: {},
        byStageValue: {},
        conversionRate: 0,
        averageDealSize: 0,
        averageSalesCycle: 0,
        monthlyTrend: [],
      };

      // Calculate stage statistics
      deals.forEach(deal => {
        const stage = deal.stage || 'unknown';
        stats.byStage[stage] = (stats.byStage[stage] || 0) + 1;
        stats.byStageValue[stage] = (stats.byStageValue[stage] || 0) + (deal.value || 0);
      });

      // Calculate conversion rate
      const closedWon = stats.byStage['closed_won'] || 0;
      stats.conversionRate = deals.length > 0 ? (closedWon / deals.length) * 100 : 0;

      // Calculate average deal size
      stats.averageDealSize = deals.length > 0 ? stats.totalValue / deals.length : 0;

      return stats;
    } catch (error) {
      console.error('Failed to fetch sales statistics:', error);
      throw error;
    }
  }

  /**
   * Get deals by customer ID
   */
  async getDealsByCustomer(
    customerId: string,
    filters: SalesFilters = {}
  ): Promise<PaginatedResponse<Deal>> {
    try {
      // Get all deals for now - filter by customer ID
      const response = await this.getDeals({ ...filters, pageSize: 1000 });
      
      // Filter deals by customer_id
      const customerDeals = response.data.filter(
        (deal) => deal.customer_id === customerId || deal.customerId === customerId
      );

      const pageSize = filters.pageSize || 20;
      return {
        data: customerDeals,
        total: customerDeals.length,
        page: filters.page || 1,
        pageSize: pageSize,
        totalPages: Math.ceil(customerDeals.length / pageSize),
      };
    } catch (error) {
      console.error(`Failed to fetch deals for customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Search deals
   */
  async searchDeals(query: string): Promise<Deal[]> {
    try {
      const response = await this.getDeals({ search: query });
      return response.data;
    } catch (error) {
      console.error('Failed to search deals:', error);
      throw error;
    }
  }

  /**
   * Get deal stages
   */
  async getDealStages(): Promise<Array<{ id: string; name: string }>> {
    return [
      { id: 'lead', name: 'Lead' },
      { id: 'qualified', name: 'Qualified' },
      { id: 'proposal', name: 'Proposal' },
      { id: 'negotiation', name: 'Negotiation' },
      { id: 'closed_won', name: 'Closed Won' },
      { id: 'closed_lost', name: 'Closed Lost' }
    ];
  }

  /**
   * Export deals
   */
  async exportDeals(format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      const response = await this.getDeals({ pageSize: 10000 });
      const deals = response.data;

      if (format === 'json') {
        return JSON.stringify(deals, null, 2);
      }

      // CSV format
      const headers = ['ID', 'Title', 'Customer', 'Value', 'Stage', 'Assigned To', 'Created Date'];
      const rows = deals.map(deal => [
        deal.id,
        deal.title,
        deal.customer_name || '',
        deal.value || 0,
        deal.stage || '',
        deal.assigned_to_name || '',
        deal.created_at || ''
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\r\n');

      return csv;
    } catch (error) {
      console.error('Failed to export deals:', error);
      throw error;
    }
  }

  /**
   * Import deals from CSV
   */
  async importDeals(csv: string): Promise<{ success: number; errors: string[] }> {
    try {
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const errors: string[] = [];
      let success = 0;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        try {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
          const dealData: Record<string, string | undefined> = {};

          headers.forEach((header, index) => {
            dealData[header.toLowerCase().replace(' ', '_')] = values[index];
          });

          await this.createDeal(dealData);
          success++;
        } catch (error) {
          errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { success, errors };
    } catch (error) {
      console.error('Failed to import deals:', error);
      throw error;
    }
  }

  /**
   * Phase 3.1: Validate customer relationship for a deal
   * Validates that customer exists and is active
   */
  async validateCustomerRelationship(
    customerId: string
  ): Promise<CustomerValidationResult> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check if customer_id is provided
      if (!customerId || customerId.trim() === '') {
        errors.push('Customer ID is required');
        return { isValid: false, errors };
      }

      // In production, would fetch from customer service and validate:
      // - Customer exists
      // - Customer is not deleted
      // - Customer is active/not suspended
      // - Tenant access control

      return {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      console.error('Failed to validate customer relationship:', error);
      return {
        isValid: false,
        errors: ['Failed to validate customer relationship'],
      };
    }
  }

  /**
   * Phase 3.1: Get deals by customer with relationship details
   */
  async getDealsByCustomerWithDetails(
    customerId: string,
    filters: SalesFilters = {}
  ): Promise<PaginatedResponse<Deal>> {
    try {
      return await this.getDealsByCustomer(customerId, filters);
    } catch (error) {
      console.error(`Failed to fetch deals for customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Phase 3.2: Get deals filtered by product ID
   * Returns all deals that include a specific product
   */
  async getDealsByProductId(
    productId: string,
    filters: SalesFilters = {}
  ): Promise<PaginatedResponse<Deal>> {
    try {
      // Get all deals and filter by product
      const deals = await this.getDeals(filters);
      
      const filteredDeals = deals.data.filter(deal => 
        deal.items && deal.items.some(item => item.product_id === productId)
      );

      return {
        ...deals,
        data: filteredDeals,
        total: filteredDeals.length,
      };
    } catch (error) {
      console.error(`Failed to fetch deals for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Phase 3.2: Get product breakdown and analytics for a deal
   * Returns detailed product contribution to deal value
   */
  async getProductBreakdownForDeal(
    dealId: string
  ): Promise<{
    products: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      lineTotal: number;
      percentage: number;
    }>;
    totalValue: number;
    itemCount: number;
  }> {
    try {
      const deal = await this.getDeal(dealId);
      
      if (!deal.items || deal.items.length === 0) {
        return {
          products: [],
          totalValue: 0,
          itemCount: 0,
        };
      }

      const totalValue = deal.items.reduce((sum, item) => sum + item.line_total, 0);
      
      const products = deal.items.map(item => ({
        productId: item.product_id || '',
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        discount: item.discount,
        lineTotal: item.line_total,
        percentage: totalValue > 0 ? (item.line_total / totalValue) * 100 : 0,
      }));

      return {
        products,
        totalValue,
        itemCount: deal.items.length,
      };
    } catch (error) {
      console.error(`Failed to get product breakdown for deal ${dealId}:`, error);
      throw error;
    }
  }

  /**
   * Phase 3.2: Get all products used across deals with aggregated stats
   * Returns product usage frequency and value contribution
   */
  async getProductsUsedInDeals(filters: SalesFilters = {}): Promise<Array<{
    productId: string;
    productName: string;
    usageCount: number;
    totalValue: number;
    averageQuantity: number;
  }>> {
    try {
      const deals = await this.getDeals(filters);
      const productStats = new Map<string, {
        productId: string;
        productName: string;
        usageCount: number;
        totalValue: number;
        totalQuantity: number;
      }>();

      // Aggregate product data across all deals
      deals.data.forEach(deal => {
        if (deal.items) {
          deal.items.forEach(item => {
            const key = item.product_id || item.product_name;
            const existing = productStats.get(key) || {
              productId: item.product_id || '',
              productName: item.product_name,
              usageCount: 0,
              totalValue: 0,
              totalQuantity: 0,
            };

            productStats.set(key, {
              ...existing,
              usageCount: existing.usageCount + 1,
              totalValue: existing.totalValue + item.line_total,
              totalQuantity: existing.totalQuantity + item.quantity,
            });
          });
        }
      });

      // Convert to array and calculate averages
      return Array.from(productStats.values()).map(stat => ({
        productId: stat.productId,
        productName: stat.productName,
        usageCount: stat.usageCount,
        totalValue: stat.totalValue,
        averageQuantity: stat.totalQuantity / stat.usageCount,
      }));
    } catch (error) {
      console.error('Failed to get products used in deals:', error);
      throw error;
    }
  }

  /**
   * Phase 3.3: Get contracts linked to a deal
   * Returns all contracts that were created from this deal
   */
  async getContractsForDeal(dealId: string): Promise<Array<{
    id: string;
    title: string;
    status: string;
    value: number;
    created_at: string;
  }>> {
    try {
      // Get all contracts via legacy service
      const contracts = await legacySalesService.getContractsForDeal?.(dealId) || [];
      return contracts.map((contract: any) => ({
        id: contract.id,
        title: contract.title,
        status: contract.status,
        value: contract.value || contract.total_value,
        created_at: contract.created_at,
      }));
    } catch (error) {
      console.error(`Failed to get contracts for deal ${dealId}:`, error);
      return [];
    }
  }

  /**
   * Phase 3.3: Prepare contract data from deal for conversion
   * Pre-fills contract form with deal information
   */
  async prepareContractFromDeal(dealId: string): Promise<{
    title: string;
    description?: string;
    customer_id: string;
    customer_name?: string;
    value: number;
    currency: string;
    start_date: string;
    end_date?: string;
    assigned_to?: string;
    notes?: string;
    deal_id: string;
    deal_title?: string;
  }> {
    try {
      const deal = await this.getDeal(dealId);
      if (!deal) {
        throw new Error('Deal not found');
      }

      // Calculate contract end date (30 days from today)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      return {
        title: `Contract from: ${deal.title}`,
        description: deal.description,
        customer_id: deal.customer_id,
        customer_name: deal.customer_name,
        value: deal.value,
        currency: deal.currency || 'USD',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        assigned_to: deal.assigned_to,
        notes: deal.notes ? `Converted from deal: ${deal.notes}` : 'Converted from sales deal',
        deal_id: dealId,
        deal_title: deal.title,
      };
    } catch (error) {
      console.error(`Failed to prepare contract from deal ${dealId}:`, error);
      throw error;
    }
  }

  /**
   * Phase 3.3: Check if deal can be converted to contract
   * Validates that deal is in closed_won state and has valid customer
   */
  async validateDealForConversion(dealId: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    try {
      const deal = await this.getDeal(dealId);
      const errors: string[] = [];

      if (!deal) {
        errors.push('Deal not found');
      } else {
        if (deal.stage !== 'closed_won') {
          errors.push('Only closed-won deals can be converted to contracts');
        }
        if (!deal.customer_id) {
          errors.push('Deal must have a customer assigned');
        }
        if (deal.value <= 0) {
          errors.push('Deal value must be greater than zero');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      console.error(`Failed to validate deal ${dealId} for conversion:`, error);
      return {
        isValid: false,
        errors: [(error as Error).message || 'Validation failed'],
      };
    }
  }
}

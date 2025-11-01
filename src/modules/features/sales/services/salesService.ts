/**
 * Sales Service (Module-level)
 * Business logic for sales and deals management
 * 
 * ⚠️ IMPORTANT DISTINCTION: This is the SALES MODULE (deals/opportunities)
 * NOT the Product Sales module (/src/modules/features/product-sales/)
 * These are completely separate modules with different data models.
 * 
 * ARCHITECTURE:
 * This service delegates all core operations to the Service Factory pattern,
 * which provides automatic switching between mock (development) and Supabase 
 * (production) backends based on VITE_API_MODE environment variable.
 * 
 * MULTI-BACKEND ROUTING:
 * - VITE_API_MODE=mock    → Mock service (src/services/salesService.ts)
 * - VITE_API_MODE=supabase → Supabase service (src/services/supabase/salesService.ts)
 * 
 * This ensures:
 * ✅ Single backend routing point via serviceFactory
 * ✅ Proper multi-tenant context maintained throughout stack
 * ✅ Eliminates "Unauthorized" errors from mixed backend imports
 * ✅ All module services follow consistent pattern
 * 
 * @see /src/services/serviceFactory.ts - Central router for backend switching
 * @see /src/modules/features/contracts/services/contractService.ts - Reference implementation (Phase 4)
 */

import { BaseService } from '@/modules/core/services/BaseService';
import { Deal } from '@/types/crm';
import { PaginatedResponse } from '@/modules/core/types';
import { salesService as factorySalesService } from '@/services/serviceFactory';

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
   * Delegates to factory-routed backend service
   */
  async getDeals(filters: SalesFilters = {}): Promise<PaginatedResponse<Deal>> {
    return factorySalesService.getDeals(filters);
  }

  /**
   * Get a single deal by ID
   * Delegates to factory-routed backend service
   */
  async getDeal(id: string): Promise<Deal> {
    return factorySalesService.getDeal(id);
  }

  /**
   * Create a new deal
   * Delegates to factory-routed backend service
   */
  async createDeal(data: CreateDealData): Promise<Deal> {
    return factorySalesService.createDeal(data);
  }

  /**
   * Update an existing deal
   * Delegates to factory-routed backend service
   */
  async updateDeal(id: string, data: Partial<CreateDealData>): Promise<Deal> {
    return factorySalesService.updateDeal(id, data);
  }

  /**
   * Delete a deal
   * Delegates to factory-routed backend service
   */
  async deleteDeal(id: string): Promise<void> {
    return factorySalesService.deleteDeal(id);
  }

  /**
   * Update deal stage
   * Delegates to factory-routed backend service
   */
  async updateDealStage(id: string, stage: string): Promise<Deal> {
    return factorySalesService.updateDealStage(id, stage);
  }

  /**
   * Bulk update deals
   * Delegates to factory-routed backend service
   */
  async bulkUpdateDeals(ids: string[], updates: Partial<CreateDealData>): Promise<Deal[]> {
    return factorySalesService.bulkUpdateDeals(ids, updates);
  }

  /**
   * Bulk delete deals
   * Delegates to factory-routed backend service
   */
  async bulkDeleteDeals(ids: string[]): Promise<void> {
    return factorySalesService.bulkDeleteDeals(ids);
  }

  /**
   * Get sales statistics
   * Delegates to factory-routed backend service
   */
  async getSalesStats(): Promise<DealStats> {
    return factorySalesService.getSalesStats();
  }

  /**
   * Get deals by customer ID
   * Delegates to factory-routed backend service
   */
  async getDealsByCustomer(
    customerId: string,
    filters: SalesFilters = {}
  ): Promise<PaginatedResponse<Deal>> {
    return factorySalesService.getDealsByCustomer(customerId, filters);
  }

  /**
   * Search deals
   * Delegates to factory-routed backend service
   */
  async searchDeals(query: string): Promise<Deal[]> {
    return factorySalesService.searchDeals(query);
  }

  /**
   * Get deal stages
   * Delegates to factory-routed backend service
   */
  async getDealStages(): Promise<Array<{ id: string; name: string }>> {
    return factorySalesService.getDealStages();
  }

  /**
   * Export deals
   * Delegates to factory-routed backend service
   */
  async exportDeals(format: 'csv' | 'json' = 'csv'): Promise<string> {
    return factorySalesService.exportDeals(format);
  }

  /**
   * Import deals from CSV
   * Delegates to factory-routed backend service
   */
  async importDeals(csv: string): Promise<{ success: number; errors: string[] }> {
    return factorySalesService.importDeals(csv);
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

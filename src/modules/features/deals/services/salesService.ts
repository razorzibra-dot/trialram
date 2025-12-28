/**
 * Sales Service Interface
 * Defines the contract for sales/deals operations
 * 
 * NOTE: Deals have status (won/lost/cancelled), not pipeline stages.
 * Pipeline stages belong to Opportunities. See types/crm.ts for reference.
 */

import { Deal, CreateDealData, SalesFilters, PaginatedResponse, DealStats, CustomerValidationResult } from '@/types';
import { dealsService } from '@/services/serviceFactory';

// Module-level delegator: always use serviceFactory-provided `deals` service
const salesService = {
  async getDeals(filters?: SalesFilters): Promise<PaginatedResponse<Deal>> {
    const data = await dealsService.getDeals(filters as any);
    return { data, page: 1, pageSize: data.length, total: data.length, totalPages: 1 };
  },
  async getDeal(id: string): Promise<Deal> {
    return dealsService.getDeal(id);
  },
  async createDeal(data: CreateDealData): Promise<Deal> {
    return dealsService.createDeal(data as any);
  },
  async updateDeal(id: string, data: Partial<CreateDealData>): Promise<Deal> {
    return dealsService.updateDeal(id, data as any);
  },
  async deleteDeal(id: string): Promise<void> {
    return dealsService.deleteDeal(id);
  },
  async bulkUpdateDeals(ids: string[], updates: Partial<CreateDealData>): Promise<Deal[]> {
    return dealsService.bulkUpdateDeals(ids, updates as any);
  },
  async bulkDeleteDeals(ids: string[]): Promise<void> {
    return dealsService.bulkDeleteDeals(ids);
  },
  async getSalesStats(): Promise<DealStats> {
    return dealsService.getSalesAnalytics();
  },
  async getDealsByCustomer(customerId: string, filters?: SalesFilters) {
    return dealsService.getDealsByCustomer(customerId, filters as any);
  },
  async searchDeals(query: string): Promise<Deal[]> {
    return dealsService.searchDeals(query);
  },
  async exportDeals(format?: 'csv' | 'json'): Promise<string> {
    // Delegate to lower-level service if implemented, otherwise fallback
    if ((dealsService as any).exportDeals) return (dealsService as any).exportDeals(format);
    return '';
  },
  async importDeals(csv: string): Promise<{ success: number; errors: string[] }> {
    if ((dealsService as any).importDeals) return (dealsService as any).importDeals(csv);
    return { success: 0, errors: ['Not implemented'] };
  },
  async validateCustomerRelationship(customerId: string) {
    if ((dealsService as any).validateCustomerRelationship) return (dealsService as any).validateCustomerRelationship(customerId);
    return { isValid: true, errors: [] } as CustomerValidationResult;
  },
  async getDealsByCustomerWithDetails(customerId: string, filters?: SalesFilters) {
    return this.getDealsByCustomer(customerId, filters as any);
  },
  async getDealsByProductId(productId: string, filters?: SalesFilters) {
    if ((dealsService as any).getDealsByProductId) return (dealsService as any).getDealsByProductId(productId, filters as any);
    return { data: [], page: 1, pageSize: 0, total: 0, totalPages: 0 } as PaginatedResponse<Deal>;
  },
  async getProductBreakdownForDeal(dealId: string) {
    if ((dealsService as any).getProductBreakdownForDeal) return (dealsService as any).getProductBreakdownForDeal(dealId);
    return { products: [], totalValue: 0, itemCount: 0 };
  },
  async getProductsUsedInDeals(filters?: SalesFilters) {
    if ((dealsService as any).getProductsUsedInDeals) return (dealsService as any).getProductsUsedInDeals(filters as any);
    return [] as any[];
  },
  async getContractsForDeal(dealId: string) {
    if ((dealsService as any).getContractsForDeal) return (dealsService as any).getContractsForDeal(dealId);
    return [];
  },
  async prepareContractFromDeal(dealId: string) {
    if ((dealsService as any).prepareContractFromDeal) return (dealsService as any).prepareContractFromDeal(dealId);
    throw new Error('Not implemented');
  },
  async validateDealForConversion(dealId: string) {
    if ((dealsService as any).validateDealForConversion) return (dealsService as any).validateDealForConversion(dealId);
    return { isValid: true, errors: [] };
  }
};

export default salesService;

/**
 * Sales Service Interface
 * All sales operations must implement this interface
 * 
 * NOTE: Deals have status (won/lost/cancelled), not pipeline stages.
 * Pipeline stages belong to Opportunities. See types/crm.ts.
 */
export interface ISalesService {
  getDeals(filters?: SalesFilters): Promise<PaginatedResponse<Deal>>;
  getDeal(id: string): Promise<Deal>;
  createDeal(data: CreateDealData): Promise<Deal>;
  updateDeal(id: string, data: Partial<CreateDealData>): Promise<Deal>;
  deleteDeal(id: string): Promise<void>;
  bulkUpdateDeals(ids: string[], updates: Partial<CreateDealData>): Promise<Deal[]>;
  bulkDeleteDeals(ids: string[]): Promise<void>;
  getSalesStats(): Promise<DealStats>;
  getDealsByCustomer(customerId: string, filters?: SalesFilters): Promise<PaginatedResponse<Deal>>;
  searchDeals(query: string): Promise<Deal[]>;
  exportDeals(format?: 'csv' | 'json'): Promise<string>;
  importDeals(csv: string): Promise<{ success: number; errors: string[] }>;
  validateCustomerRelationship(customerId: string): Promise<CustomerValidationResult>;
  getDealsByCustomerWithDetails(customerId: string, filters?: SalesFilters): Promise<PaginatedResponse<Deal>>;
  getDealsByProductId(productId: string, filters?: SalesFilters): Promise<PaginatedResponse<Deal>>;
  getProductBreakdownForDeal(dealId: string): Promise<{ 
    products: Array<{ 
      productId: string; 
      productName: string; 
      quantity: number; 
      unitPrice: number; 
      discount: number; 
      lineTotal: number; 
      percentage: number 
    }>; 
    totalValue: number; 
    itemCount: number 
  }>;
  getProductsUsedInDeals(filters?: SalesFilters): Promise<Array<{ 
    productId: string; 
    productName: string; 
    usageCount: number; 
    totalValue: number; 
    averageQuantity: number 
  }>>;
  getContractsForDeal(dealId: string): Promise<Array<{ 
    id: string; 
    title: string; 
    status: string; 
    value: number; 
    created_at: string 
  }>>;
  prepareContractFromDeal(dealId: string): Promise<{ 
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
    deal_title?: string 
  }>;
  validateDealForConversion(dealId: string): Promise<{ 
    isValid: boolean; 
    errors: string[] 
  }>;
}

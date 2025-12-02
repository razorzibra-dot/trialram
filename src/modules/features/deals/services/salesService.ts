/**
 * Sales Service Interface
 * Defines the contract for sales/deals operations
 */

import { Deal, CreateDealData, SalesFilters, PaginatedResponse, DealStats, CustomerValidationResult } from '@/types';

/**
 * Sales Service Interface
 * All sales operations must implement this interface
 */
export interface ISalesService {
  getDeals(filters?: SalesFilters): Promise<PaginatedResponse<Deal>>;
  getDeal(id: string): Promise<Deal>;
  createDeal(data: CreateDealData): Promise<Deal>;
  updateDeal(id: string, data: Partial<CreateDealData>): Promise<Deal>;
  deleteDeal(id: string): Promise<void>;
  updateDealStage(id: string, stage: string): Promise<Deal>;
  bulkUpdateDeals(ids: string[], updates: Partial<CreateDealData>): Promise<Deal[]>;
  bulkDeleteDeals(ids: string[]): Promise<void>;
  getSalesStats(): Promise<DealStats>;
  getDealsByCustomer(customerId: string, filters?: SalesFilters): Promise<PaginatedResponse<Deal>>;
  searchDeals(query: string): Promise<Deal[]>;
  getDealStages(): Promise<Array<{ id: string; name: string }>>;
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

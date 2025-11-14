/**
 * Product Sales Service Interface
 * Defines the contract for product sales operations
 * 
 * This service delegates to the factory service which routes to
 * mock or Supabase implementation based on VITE_API_MODE
 */

import { 
  ProductSale, 
  ProductSaleFormData, 
  ProductSaleFilters, 
  ProductSalesResponse,
  FileAttachment
} from '@/types/productSales';
import type { ProductSalesAnalyticsDTO } from '@/types/dtos/productSalesDtos';

/**
 * Product Sales Service Interface
 * All product sales operations must implement this interface
 */
export interface IProductSalesService {
  /**
   * Get all product sales with filtering and pagination
   */
  getProductSales(
    filters?: ProductSaleFilters, 
    page?: number, 
    limit?: number
  ): Promise<ProductSalesResponse>;

  /**
   * Get single product sale by ID
   */
  getProductSaleById(id: string): Promise<ProductSale>;

  /**
   * Create a new product sale
   */
  createProductSale(data: ProductSaleFormData): Promise<ProductSale>;

  /**
   * Update an existing product sale
   */
  updateProductSale(id: string, data: Partial<ProductSaleFormData>): Promise<ProductSale>;

  /**
   * Delete a product sale
   */
  deleteProductSale(id: string): Promise<void>;

  /**
   * Get product sales analytics
   */
  getProductSalesAnalytics(tenantId?: string): Promise<ProductSalesAnalyticsDTO>;

  /**
   * Upload an attachment to a product sale
   */
  uploadAttachment(saleId: string, file: File): Promise<FileAttachment>;
}

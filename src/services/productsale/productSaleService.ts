/**
 * Product Sales Module Service
 * Uses service factory pattern for backend abstraction
 * Follows strict layer synchronization rules
 */

import {
  ProductSale,
  ProductSaleWithDetails,
  ProductSaleFormData,
  ProductSaleFilters,
  ProductSalesResponse,
  FileAttachment
} from '@/types/productSales';
import type { ProductSalesAnalyticsDTO } from '@/types/dtos/productSalesDtos';
import { PDFGenerationResponse } from '@/types/pdfTemplates';

import { productSaleService as backendService } from '../serviceFactory';

/**
 * Product Sales Service - Module Layer
 * Delegates to appropriate backend service via factory
 * Provides additional business logic and data transformation
 */
class ProductSaleService {
  /**
   * Get all product sales with filtering and pagination
   */
  async getProductSales(
    filters: ProductSaleFilters = {},
    page: number = 1,
    limit: number = 10,
    tenantId?: string
  ): Promise<ProductSalesResponse> {
    return backendService.getProductSales(filters, page, limit, tenantId);
  }

  /**
   * Get single product sale by ID
   */
  async getProductSaleById(id: string, tenantId?: string): Promise<ProductSale> {
    return backendService.getProductSaleById(id, tenantId);
  }

  /**
   * Create new product sale
   */
  async createProductSale(data: ProductSaleFormData, tenantId?: string): Promise<ProductSale> {
    return backendService.createProductSale(data, tenantId);
  }

  /**
   * Update existing product sale
   */
  async updateProductSale(id: string, data: Partial<ProductSaleFormData>, tenantId?: string): Promise<ProductSale> {
    return backendService.updateProductSale(id, data, tenantId);
  }

  /**
   * Delete product sale
   */
  async deleteProductSale(id: string, tenantId?: string): Promise<void> {
    return backendService.deleteProductSale(id, tenantId);
  }

  /**
   * Get product sales analytics
   */
  async getProductSalesAnalytics(tenantId?: string): Promise<ProductSalesAnalyticsDTO> {
    return backendService.getProductSalesAnalytics(tenantId);
  }

  /**
   * Upload file attachment
   */
  async uploadAttachment(saleId: string, file: File): Promise<FileAttachment> {
    return backendService.uploadAttachment(saleId, file);
  }

  /**
   * Delete file attachment
   */
  async deleteAttachment(saleId: string, attachmentId: string): Promise<void> {
    return backendService.deleteAttachment(saleId, attachmentId);
  }

  /**
   * Generate PDF for product sale (if supported by backend)
   */
  async generatePdf?(saleId: string): Promise<PDFGenerationResponse> {
    if (typeof backendService.generatePdf === 'function') {
      return backendService.generatePdf(saleId);
    }
    throw new Error('PDF generation not supported by current backend');
  }

  /**
   * Generate PDF for product sales report (if supported by backend)
   */
  async generateReportPdf?(filters: ProductSaleFilters): Promise<PDFGenerationResponse> {
    if (typeof backendService.generateReportPdf === 'function') {
      return backendService.generateReportPdf(filters);
    }
    throw new Error('Report PDF generation not supported by current backend');
  }

  /**
   * Generate service contract from product sale (if supported by backend)
   */
  async generateServiceContract?(saleId: string): Promise<any> {
    if (typeof backendService.generateServiceContract === 'function') {
      return backendService.generateServiceContract(saleId);
    }
    throw new Error('Service contract generation not supported by current backend');
  }

  /**
   * Generate Contract PDF for product sale (if supported by backend)
   */
  async generateContractPDF?(saleId: string): Promise<PDFGenerationResponse> {
    if (typeof backendService.generateContractPDF === 'function') {
      return backendService.generateContractPDF(saleId);
    }
    throw new Error('Contract PDF generation not supported by current backend');
  }

  /**
   * Generate Receipt PDF for product sale (if supported by backend)
   */
  async generateReceiptPDF?(saleId: string): Promise<PDFGenerationResponse> {
    if (typeof backendService.generateReceiptPDF === 'function') {
      return backendService.generateReceiptPDF(saleId);
    }
    throw new Error('Receipt PDF generation not supported by current backend');
  }
}

export const productSaleService = new ProductSaleService();
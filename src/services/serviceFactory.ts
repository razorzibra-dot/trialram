/**
 * Service Factory
 * Switches between mock and Supabase service implementations
 * based on environment configuration
 */

import { ServiceContractService } from './serviceContractService'; // Mock implementation
import { supabaseServiceContractService } from './supabase/serviceContractService'; // Supabase implementation
import { supabaseProductSaleService } from './supabase/productSaleService';
import { supabaseCustomerService } from './supabase/customerService';
import { productSaleService as mockProductSaleService } from './productSaleService';
import { customerService as mockCustomerService } from './customerService';

type ApiMode = 'mock' | 'supabase' | 'real';

class ServiceFactory {
  private apiMode: ApiMode;

  constructor() {
    // Determine API mode from environment
    this.apiMode = (import.meta.env.VITE_API_MODE as ApiMode) || 'mock';
    
    console.log(`📦 Service Factory initialized with mode: ${this.apiMode}`);
    
    if (this.apiMode === 'supabase') {
      console.log('✅ Using Supabase backend');
    } else if (this.apiMode === 'real') {
      console.log('✅ Using Real API backend');
    } else {
      console.log('✅ Using Mock data backend');
    }
  }

  /**
   * Get API mode
   */
  getApiMode(): ApiMode {
    return this.apiMode;
  }

  /**
   * Set API mode (for testing/switching)
   */
  setApiMode(mode: ApiMode): void {
    this.apiMode = mode;
    console.log(`🔄 API mode switched to: ${mode}`);
  }

  /**
   * Get Service Contract Service
   */
  getServiceContractService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseServiceContractService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to mock');
        return new ServiceContractService();
      case 'mock':
      default:
        return new ServiceContractService();
    }
  }

  /**
   * Get Product Sale Service
   */
  getProductSaleService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseProductSaleService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to Supabase');
        return supabaseProductSaleService;
      case 'mock':
      default:
        return mockProductSaleService;
    }
  }

  /**
   * Get Customer Service
   */
  getCustomerService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseCustomerService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to Supabase');
        return supabaseCustomerService;
      case 'mock':
      default:
        return mockCustomerService;
    }
  }

  /**
   * Get Service (generic method for future extensibility)
   */
  getService(serviceName: string) {
    switch (serviceName.toLowerCase()) {
      case 'servicecontract':
        return this.getServiceContractService();
      case 'productsale':
      case 'product_sale':
        return this.getProductSaleService();
      case 'customer':
        return this.getCustomerService();
      // Add other services as needed
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  }

  /**
   * Check if using real backend
   */
  isUsingRealBackend(): boolean {
    return this.apiMode !== 'mock';
  }

  /**
   * Check if using Supabase
   */
  isUsingSupabase(): boolean {
    return this.apiMode === 'supabase';
  }

  /**
   * Get backend info for debugging
   */
  getBackendInfo() {
    return {
      mode: this.apiMode,
      supabaseUrl: this.apiMode === 'supabase' ? import.meta.env.VITE_SUPABASE_URL : undefined,
      apiBaseUrl: this.apiMode === 'real' ? import.meta.env.VITE_API_BASE_URL : undefined,
    };
  }
}

// Export singleton instance
export const serviceFactory = new ServiceFactory();

// Export for convenience - Service Contract Service
export const serviceContractService = {
  get instance() {
    return serviceFactory.getServiceContractService();
  },
  getServiceContracts: (...args: Parameters<typeof supabaseServiceContractService.getServiceContracts>) =>
    serviceFactory.getServiceContractService().getServiceContracts(...args),
  getServiceContractById: (...args: Parameters<typeof supabaseServiceContractService.getServiceContractById>) =>
    serviceFactory.getServiceContractService().getServiceContractById(...args),
  createServiceContract: (...args: Parameters<typeof supabaseServiceContractService.createServiceContract>) =>
    serviceFactory.getServiceContractService().createServiceContract(...args),
  updateServiceContract: (...args: Parameters<typeof supabaseServiceContractService.updateServiceContract>) =>
    serviceFactory.getServiceContractService().updateServiceContract(...args),
  renewServiceContract: (...args: Parameters<typeof supabaseServiceContractService.renewServiceContract>) =>
    serviceFactory.getServiceContractService().renewServiceContract(...args),
  cancelServiceContract: (...args: Parameters<typeof supabaseServiceContractService.cancelServiceContract>) =>
    serviceFactory.getServiceContractService().cancelServiceContract(...args),
  getServiceContractByProductSaleId: (...args: Parameters<typeof supabaseServiceContractService.getServiceContractByProductSaleId>) =>
    serviceFactory.getServiceContractService().getServiceContractByProductSaleId(...args),
  getContractTemplates: (...args: Parameters<typeof supabaseServiceContractService.getContractTemplates>) =>
    serviceFactory.getServiceContractService().getContractTemplates(...args),
  generateContractPDF: (...args: Parameters<typeof supabaseServiceContractService.generateContractPDF>) =>
    serviceFactory.getServiceContractService().generateContractPDF(...args),
  getExpiringContracts: (...args: Parameters<typeof supabaseServiceContractService.getExpiringContracts>) =>
    serviceFactory.getServiceContractService().getExpiringContracts(...args),
};

// Export for convenience - Product Sale Service
export const productSaleService = {
  get instance() {
    return serviceFactory.getProductSaleService();
  },
  getProductSales: (...args: Parameters<typeof supabaseProductSaleService.getProductSales>) =>
    serviceFactory.getProductSaleService().getProductSales(...args),
  getProductSaleById: (...args: Parameters<typeof supabaseProductSaleService.getProductSaleById>) =>
    serviceFactory.getProductSaleService().getProductSaleById(...args),
  createProductSale: (...args: Parameters<typeof supabaseProductSaleService.createProductSale>) =>
    serviceFactory.getProductSaleService().createProductSale(...args),
  updateProductSale: (...args: Parameters<typeof supabaseProductSaleService.updateProductSale>) =>
    serviceFactory.getProductSaleService().updateProductSale(...args),
  deleteProductSale: (...args: Parameters<typeof supabaseProductSaleService.deleteProductSale>) =>
    serviceFactory.getProductSaleService().deleteProductSale(...args),
  getProductSalesAnalytics: (...args: Parameters<typeof supabaseProductSaleService.getProductSalesAnalytics>) =>
    serviceFactory.getProductSaleService().getProductSalesAnalytics(...args),
  uploadAttachment: (...args: Parameters<typeof supabaseProductSaleService.uploadAttachment>) =>
    serviceFactory.getProductSaleService().uploadAttachment(...args),
};

// Export for convenience - Customer Service
export const customerService = {
  get instance() {
    return serviceFactory.getCustomerService();
  },
  getCustomers: (...args: Parameters<typeof supabaseCustomerService.getCustomers>) =>
    serviceFactory.getCustomerService().getCustomers(...args),
  getCustomer: (...args: Parameters<typeof supabaseCustomerService.getCustomer>) =>
    serviceFactory.getCustomerService().getCustomer(...args),
  createCustomer: (...args: Parameters<typeof supabaseCustomerService.createCustomer>) =>
    serviceFactory.getCustomerService().createCustomer(...args),
  updateCustomer: (...args: Parameters<typeof supabaseCustomerService.updateCustomer>) =>
    serviceFactory.getCustomerService().updateCustomer(...args),
  deleteCustomer: (...args: Parameters<typeof supabaseCustomerService.deleteCustomer>) =>
    serviceFactory.getCustomerService().deleteCustomer(...args),
  bulkDeleteCustomers: (...args: Parameters<typeof supabaseCustomerService.bulkDeleteCustomers>) =>
    serviceFactory.getCustomerService().bulkDeleteCustomers(...args),
  bulkUpdateCustomers: (...args: Parameters<typeof supabaseCustomerService.bulkUpdateCustomers>) =>
    serviceFactory.getCustomerService().bulkUpdateCustomers(...args),
  getTags: (...args: Parameters<typeof supabaseCustomerService.getTags>) =>
    serviceFactory.getCustomerService().getTags(...args),
  createTag: (...args: Parameters<typeof supabaseCustomerService.createTag>) =>
    serviceFactory.getCustomerService().createTag(...args),
  exportCustomers: (...args: Parameters<typeof supabaseCustomerService.exportCustomers>) =>
    serviceFactory.getCustomerService().exportCustomers(...args),
  importCustomers: (...args: Parameters<typeof supabaseCustomerService.importCustomers>) =>
    serviceFactory.getCustomerService().importCustomers(...args),
  getIndustries: (...args: Parameters<typeof supabaseCustomerService.getIndustries>) =>
    serviceFactory.getCustomerService().getIndustries(...args),
  getSizes: (...args: Parameters<typeof supabaseCustomerService.getSizes>) =>
    serviceFactory.getCustomerService().getSizes(...args),
};

export type { ApiMode };
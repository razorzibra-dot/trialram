/**
 * Service Factory
 * Switches between mock and Supabase service implementations
 * based on environment configuration
 */

import { ServiceContractService } from './serviceContractService'; // Mock implementation
import { supabaseServiceContractService } from './supabase/serviceContractService'; // Supabase implementation
import { supabaseProductSaleService } from './supabase/productSaleService';
import { supabaseSalesService } from './api/supabase/salesService';
import { supabaseCustomerService } from './supabase/customerService';
import { supabaseJobWorkService } from './supabase/jobWorkService';
import { supabaseProductService } from './supabase/productService';
import { supabaseCompanyService } from './supabase/companyService';
import { supabaseUserService } from './api/supabase/userService';
import { supabaseRbacService } from './api/supabase/rbacService';
import { supabaseNotificationService } from './supabase/notificationService';
import { supabaseTenantService } from './supabase/tenantService';
import { productSaleService as mockProductSaleService } from './productSaleService';
import { salesService as mockSalesService } from './salesService';
import { customerService as mockCustomerService } from './customerService';
import { jobWorkService as mockJobWorkService } from './jobWorkService';
import { productService as mockProductService } from './productService';
import { companyService as mockCompanyService } from './companyService';
import { userService as mockUserService } from './userService';
import { rbacService as mockRbacService } from './rbacService';
import { notificationService as mockNotificationService } from './notificationService';
import { tenantService as mockTenantService } from './tenantService';

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
   * Get Sales Service (for deal management)
   */
  getSalesService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseSalesService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to Supabase');
        return supabaseSalesService;
      case 'mock':
      default:
        return mockSalesService;
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
   * Get Job Work Service
   */
  getJobWorkService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseJobWorkService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to Supabase');
        return supabaseJobWorkService;
      case 'mock':
      default:
        return mockJobWorkService;
    }
  }

  /**
   * Get Product Service
   */
  getProductService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseProductService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to Supabase');
        return supabaseProductService;
      case 'mock':
      default:
        return mockProductService;
    }
  }

  /**
   * Get Company Service
   */
  getCompanyService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseCompanyService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to Supabase');
        return supabaseCompanyService;
      case 'mock':
      default:
        return mockCompanyService;
    }
  }

  /**
   * Get User Service
   */
  getUserService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseUserService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to Supabase');
        return supabaseUserService;
      case 'mock':
      default:
        return mockUserService;
    }
  }

  /**
   * Get RBAC Service
   */
  getRbacService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseRbacService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to Supabase');
        return supabaseRbacService;
      case 'mock':
      default:
        return mockRbacService;
    }
  }

  /**
   * Get Notification Service
   */
  getNotificationService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseNotificationService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to Supabase');
        return supabaseNotificationService;
      case 'mock':
      default:
        return mockNotificationService;
    }
  }

  /**
   * Get Tenant Service
   */
  getTenantService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseTenantService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to Supabase');
        return supabaseTenantService;
      case 'mock':
      default:
        return mockTenantService;
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
      case 'sales':
      case 'sale':
        return this.getSalesService();
      case 'customer':
        return this.getCustomerService();
      case 'jobwork':
      case 'job_work':
        return this.getJobWorkService();
      case 'product':
      case 'products':
        return this.getProductService();
      case 'company':
      case 'companies':
        return this.getCompanyService();
      case 'user':
      case 'users':
        return this.getUserService();
      case 'rbac':
      case 'role_based_access_control':
        return this.getRbacService();
      case 'notification':
      case 'notifications':
        return this.getNotificationService();
      case 'tenant':
      case 'tenants':
        return this.getTenantService();
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

// Export for convenience - Sales Service (Deal Management)
export const salesService = {
  get instance() {
    return serviceFactory.getSalesService();
  },
  getDeals: (...args: Parameters<typeof supabaseSalesService.getDeals>) =>
    serviceFactory.getSalesService().getDeals(...args),
  getDeal: (...args: Parameters<typeof supabaseSalesService.getDeal>) =>
    serviceFactory.getSalesService().getDeal(...args),
  createDeal: (...args: Parameters<typeof supabaseSalesService.createDeal>) =>
    serviceFactory.getSalesService().createDeal(...args),
  updateDeal: (...args: Parameters<typeof supabaseSalesService.updateDeal>) =>
    serviceFactory.getSalesService().updateDeal(...args),
  deleteDeal: (...args: Parameters<typeof supabaseSalesService.deleteDeal>) =>
    serviceFactory.getSalesService().deleteDeal(...args),
  getDealsByCustomer: (...args: Parameters<typeof supabaseSalesService.getDealsByCustomer>) =>
    serviceFactory.getSalesService().getDealsByCustomer(...args),
  getSalesStats: (...args: Parameters<typeof supabaseSalesService.getSalesStats>) =>
    serviceFactory.getSalesService().getSalesStats(...args),
  getDealStages: (...args: Parameters<typeof supabaseSalesService.getDealStages>) =>
    serviceFactory.getSalesService().getDealStages(...args),
  updateDealStage: (...args: Parameters<typeof supabaseSalesService.updateDealStage>) =>
    serviceFactory.getSalesService().updateDealStage(...args),
  bulkUpdateDeals: (...args: Parameters<typeof supabaseSalesService.bulkUpdateDeals>) =>
    serviceFactory.getSalesService().bulkUpdateDeals(...args),
  bulkDeleteDeals: (...args: Parameters<typeof supabaseSalesService.bulkDeleteDeals>) =>
    serviceFactory.getSalesService().bulkDeleteDeals(...args),
  searchDeals: (...args: Parameters<typeof supabaseSalesService.searchDeals>) =>
    serviceFactory.getSalesService().searchDeals(...args),
  exportDeals: (...args: Parameters<typeof supabaseSalesService.exportDeals>) =>
    serviceFactory.getSalesService().exportDeals(...args),
  importDeals: (...args: Parameters<typeof supabaseSalesService.importDeals>) =>
    serviceFactory.getSalesService().importDeals(...args),
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
  getCustomerStats: (...args: Parameters<typeof supabaseCustomerService.getCustomerStats>) =>
    serviceFactory.getCustomerService().getCustomerStats(...args),
  searchCustomers: (...args: Parameters<typeof supabaseCustomerService.searchCustomers>) =>
    serviceFactory.getCustomerService().searchCustomers(...args),
};

// Export for convenience - Job Work Service
export const jobWorkService = {
  get instance() {
    return serviceFactory.getJobWorkService();
  },
  getJobWorks: (...args: Parameters<typeof supabaseJobWorkService.getJobWorks>) =>
    serviceFactory.getJobWorkService().getJobWorks(...args),
  getJobWork: (...args: Parameters<typeof supabaseJobWorkService.getJobWork>) =>
    serviceFactory.getJobWorkService().getJobWork(...args),
  createJobWork: (...args: Parameters<typeof supabaseJobWorkService.createJobWork>) =>
    serviceFactory.getJobWorkService().createJobWork(...args),
  updateJobWork: (...args: Parameters<typeof supabaseJobWorkService.updateJobWork>) =>
    serviceFactory.getJobWorkService().updateJobWork(...args),
  deleteJobWork: (...args: Parameters<typeof supabaseJobWorkService.deleteJobWork>) =>
    serviceFactory.getJobWorkService().deleteJobWork(...args),
  getJobWorkStats: (...args: Parameters<typeof supabaseJobWorkService.getJobWorkStats>) =>
    serviceFactory.getJobWorkService().getJobWorkStats(...args),
};

// Export for convenience - Product Service
export const productService = {
  get instance() {
    return serviceFactory.getProductService();
  },
  getProducts: (...args: Parameters<typeof supabaseProductService.getProducts>) =>
    serviceFactory.getProductService().getProducts(...args),
  getProduct: (...args: Parameters<typeof supabaseProductService.getProduct>) =>
    serviceFactory.getProductService().getProduct(...args),
  createProduct: (...args: Parameters<typeof supabaseProductService.createProduct>) =>
    serviceFactory.getProductService().createProduct(...args),
  updateProduct: (...args: Parameters<typeof supabaseProductService.updateProduct>) =>
    serviceFactory.getProductService().updateProduct(...args),
  deleteProduct: (...args: Parameters<typeof supabaseProductService.deleteProduct>) =>
    serviceFactory.getProductService().deleteProduct(...args),
  searchProducts: (...args: Parameters<typeof supabaseProductService.searchProducts>) =>
    serviceFactory.getProductService().searchProducts(...args),
  getLowStockProducts: (...args: Parameters<typeof supabaseProductService.getLowStockProducts>) =>
    serviceFactory.getProductService().getLowStockProducts(...args),
  updateStock: (...args: Parameters<typeof supabaseProductService.updateStock>) =>
    serviceFactory.getProductService().updateStock(...args),
  getProductStats: (...args: Parameters<typeof supabaseProductService.getProductStats>) =>
    serviceFactory.getProductService().getProductStats(...args),
  subscribeToProducts: (...args: Parameters<typeof supabaseProductService.subscribeToProducts>) =>
    serviceFactory.getProductService().subscribeToProducts(...args),
};

// Export for convenience - Company Service
export const companyService = {
  get instance() {
    return serviceFactory.getCompanyService();
  },
  getCompanies: (...args: Parameters<typeof supabaseCompanyService.getCompanies>) =>
    serviceFactory.getCompanyService().getCompanies(...args),
  getCompany: (...args: Parameters<typeof supabaseCompanyService.getCompany>) =>
    serviceFactory.getCompanyService().getCompany(...args),
  getCompanyByDomain: (...args: Parameters<typeof supabaseCompanyService.getCompanyByDomain>) =>
    serviceFactory.getCompanyService().getCompanyByDomain(...args),
  createCompany: (...args: Parameters<typeof supabaseCompanyService.createCompany>) =>
    serviceFactory.getCompanyService().createCompany(...args),
  updateCompany: (...args: Parameters<typeof supabaseCompanyService.updateCompany>) =>
    serviceFactory.getCompanyService().updateCompany(...args),
  deleteCompany: (...args: Parameters<typeof supabaseCompanyService.deleteCompany>) =>
    serviceFactory.getCompanyService().deleteCompany(...args),
  searchCompanies: (...args: Parameters<typeof supabaseCompanyService.searchCompanies>) =>
    serviceFactory.getCompanyService().searchCompanies(...args),
  updateSubscription: (...args: Parameters<typeof supabaseCompanyService.updateSubscription>) =>
    serviceFactory.getCompanyService().updateSubscription(...args),
  getCompanyStats: (...args: Parameters<typeof supabaseCompanyService.getCompanyStats>) =>
    serviceFactory.getCompanyService().getCompanyStats(...args),
  subscribeToCompanies: (...args: Parameters<typeof supabaseCompanyService.subscribeToCompanies>) =>
    serviceFactory.getCompanyService().subscribeToCompanies(...args),
};

// Export for convenience - User Service
export const userService = {
  get instance() {
    return serviceFactory.getUserService();
  },
  getUsers: (...args: Parameters<typeof mockUserService.getUsers>) =>
    serviceFactory.getUserService().getUsers(...args),
  getUser: (...args: Parameters<typeof mockUserService.getUser>) =>
    serviceFactory.getUserService().getUser(...args),
  createUser: (...args: Parameters<typeof mockUserService.createUser>) =>
    serviceFactory.getUserService().createUser(...args),
  updateUser: (...args: Parameters<typeof mockUserService.updateUser>) =>
    serviceFactory.getUserService().updateUser(...args),
  deleteUser: (...args: Parameters<typeof mockUserService.deleteUser>) =>
    serviceFactory.getUserService().deleteUser(...args),
  resetPassword: (...args: Parameters<typeof mockUserService.resetPassword>) =>
    serviceFactory.getUserService().resetPassword(...args),
  getRoles: (...args: Parameters<typeof mockUserService.getRoles>) =>
    serviceFactory.getUserService().getRoles(...args),
  getPermissions: (...args: Parameters<typeof mockUserService.getPermissions>) =>
    serviceFactory.getUserService().getPermissions(...args),
  getStatuses: (...args: Parameters<typeof mockUserService.getStatuses>) =>
    serviceFactory.getUserService().getStatuses(...args),
  getTenants: (...args: Parameters<typeof mockUserService.getTenants>) =>
    serviceFactory.getUserService().getTenants(...args),
};

// Export for convenience - RBAC Service
export const rbacService = {
  get instance() {
    return serviceFactory.getRbacService();
  },
  getPermissions: (...args: Parameters<typeof mockRbacService.getPermissions>) =>
    serviceFactory.getRbacService().getPermissions(...args),
  getRoles: (...args: Parameters<typeof mockRbacService.getRoles>) =>
    serviceFactory.getRbacService().getRoles(...args),
  createRole: (...args: Parameters<typeof mockRbacService.createRole>) =>
    serviceFactory.getRbacService().createRole(...args),
  updateRole: (...args: Parameters<typeof mockRbacService.updateRole>) =>
    serviceFactory.getRbacService().updateRole(...args),
  deleteRole: (...args: Parameters<typeof mockRbacService.deleteRole>) =>
    serviceFactory.getRbacService().deleteRole(...args),
  assignUserRole: (...args: Parameters<typeof mockRbacService.assignUserRole>) =>
    serviceFactory.getRbacService().assignUserRole(...args),
  removeUserRole: (...args: Parameters<typeof mockRbacService.removeUserRole>) =>
    serviceFactory.getRbacService().removeUserRole(...args),
  getPermissionMatrix: (...args: Parameters<typeof mockRbacService.getPermissionMatrix>) =>
    serviceFactory.getRbacService().getPermissionMatrix(...args),
  getRoleTemplates: (...args: Parameters<typeof mockRbacService.getRoleTemplates>) =>
    serviceFactory.getRbacService().getRoleTemplates(...args),
  createRoleFromTemplate: (...args: Parameters<typeof mockRbacService.createRoleFromTemplate>) =>
    serviceFactory.getRbacService().createRoleFromTemplate(...args),
  getAuditLogs: (...args: Parameters<typeof mockRbacService.getAuditLogs>) =>
    serviceFactory.getRbacService().getAuditLogs(...args),
  logAction: (...args: Parameters<typeof mockRbacService.logAction>) =>
    serviceFactory.getRbacService().logAction(...args),
  getUsersByRole: (...args: Parameters<typeof mockRbacService.getUsersByRole>) =>
    serviceFactory.getRbacService().getUsersByRole(...args),
  bulkAssignRole: (...args: Parameters<typeof mockRbacService.bulkAssignRole>) =>
    serviceFactory.getRbacService().bulkAssignRole(...args),
  bulkRemoveRole: (...args: Parameters<typeof mockRbacService.bulkRemoveRole>) =>
    serviceFactory.getRbacService().bulkRemoveRole(...args),
  validateRolePermissions: (...args: Parameters<typeof mockRbacService.validateRolePermissions>) =>
    serviceFactory.getRbacService().validateRolePermissions(...args),
};

// Export for convenience - Notification Service
export const notificationService = {
  get instance() {
    return serviceFactory.getNotificationService();
  },
  getNotifications: (...args: Parameters<typeof mockNotificationService.getNotifications>) =>
    serviceFactory.getNotificationService().getNotifications(...args),
  getNotificationPreferences: (...args: Parameters<typeof mockNotificationService.getNotificationPreferences>) =>
    serviceFactory.getNotificationService().getNotificationPreferences(...args),
  updateNotificationPreferences: (...args: Parameters<typeof mockNotificationService.updateNotificationPreferences>) =>
    serviceFactory.getNotificationService().updateNotificationPreferences(...args),
  markAsRead: (...args: Parameters<typeof mockNotificationService.markAsRead>) =>
    serviceFactory.getNotificationService().markAsRead(...args),
  markAllAsRead: (...args: Parameters<typeof mockNotificationService.markAllAsRead>) =>
    serviceFactory.getNotificationService().markAllAsRead(...args),
  deleteNotification: (...args: Parameters<typeof mockNotificationService.deleteNotification>) =>
    serviceFactory.getNotificationService().deleteNotification(...args),
  clearAllNotifications: (...args: Parameters<typeof mockNotificationService.clearAllNotifications>) =>
    serviceFactory.getNotificationService().clearAllNotifications(...args),
  subscribeToNotifications: (...args: Parameters<typeof mockNotificationService.subscribeToNotifications>) =>
    serviceFactory.getNotificationService().subscribeToNotifications(...args),
  getUnreadCount: (...args: Parameters<typeof mockNotificationService.getUnreadCount>) =>
    serviceFactory.getNotificationService().getUnreadCount(...args),
  getNotificationStats: (...args: Parameters<typeof mockNotificationService.getNotificationStats>) =>
    serviceFactory.getNotificationService().getNotificationStats(...args),
};

// Export for convenience - Tenant Service
export const tenantService = {
  get instance() {
    return serviceFactory.getTenantService();
  },
  getTenants: (...args: Parameters<typeof mockTenantService.getTenants>) =>
    serviceFactory.getTenantService().getTenants(...args),
  getTenant: (...args: Parameters<typeof mockTenantService.getTenant>) =>
    serviceFactory.getTenantService().getTenant(...args),
  getCurrentTenant: (...args: Parameters<typeof mockTenantService.getCurrentTenant>) =>
    serviceFactory.getTenantService().getCurrentTenant(...args),
  updateTenantSettings: (...args: Parameters<typeof mockTenantService.updateTenantSettings>) =>
    serviceFactory.getTenantService().updateTenantSettings(...args),
  getTenantUsers: (...args: Parameters<typeof mockTenantService.getTenantUsers>) =>
    serviceFactory.getTenantService().getTenantUsers(...args),
  addUserToTenant: (...args: Parameters<typeof mockTenantService.addUserToTenant>) =>
    serviceFactory.getTenantService().addUserToTenant(...args),
  removeUserFromTenant: (...args: Parameters<typeof mockTenantService.removeUserFromTenant>) =>
    serviceFactory.getTenantService().removeUserFromTenant(...args),
  updateUserRole: (...args: Parameters<typeof mockTenantService.updateUserRole>) =>
    serviceFactory.getTenantService().updateUserRole(...args),
  getTenantUsage: (...args: Parameters<typeof mockTenantService.getTenantUsage>) =>
    serviceFactory.getTenantService().getTenantUsage(...args),
  getTenantAnalytics: (...args: Parameters<typeof mockTenantService.getTenantAnalytics>) =>
    serviceFactory.getTenantService().getTenantAnalytics(...args),
  createTenant: (...args: Parameters<typeof mockTenantService.createTenant>) =>
    serviceFactory.getTenantService().createTenant(...args),
  updateTenantStatus: (...args: Parameters<typeof mockTenantService.updateTenantStatus>) =>
    serviceFactory.getTenantService().updateTenantStatus(...args),
  deleteTenant: (...args: Parameters<typeof mockTenantService.deleteTenant>) =>
    serviceFactory.getTenantService().deleteTenant(...args),
  getTenantBranding: (...args: Parameters<typeof mockTenantService.getTenantBranding>) =>
    serviceFactory.getTenantService().getTenantBranding(...args),
  updateTenantBranding: (...args: Parameters<typeof mockTenantService.updateTenantBranding>) =>
    serviceFactory.getTenantService().updateTenantBranding(...args),
  getTenantFeatures: (...args: Parameters<typeof mockTenantService.getTenantFeatures>) =>
    serviceFactory.getTenantService().getTenantFeatures(...args),
  updateTenantFeatures: (...args: Parameters<typeof mockTenantService.updateTenantFeatures>) =>
    serviceFactory.getTenantService().updateTenantFeatures(...args),
};

export type { ApiMode };
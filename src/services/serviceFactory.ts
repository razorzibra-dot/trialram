/**
 * Service Factory - Phase 3 Optimized
 * Uses ES6 Proxy pattern for zero-boilerplate service delegation
 * Supports 24 unified services with mock/supabase switching
 */

import { ApiMode } from '@/types';

// Import all mock services
import { authService as mockAuthService } from './auth/authService';
import { mockServiceContractService } from './servicecontract/serviceContractService';
import { productSaleService as mockProductSaleService } from './productsale/productSaleService';
import { salesService as mockSalesService } from './sales/salesService';
import { leadsService as mockLeadsService } from './sales/leadsService';
import { customerService as mockCustomerService } from './customer/customerService';
import { jobWorkService as mockJobWorkService } from './jobwork/jobWorkService';
import { productService as mockProductService } from './product/productService';
import { companyService as mockCompanyService } from './company/companyService';
import { userService as mockUserService } from './user/userService';
import { rbacService as mockRbacService } from './rbac/rbacService';
import { uiNotificationService as mockUINotificationService } from './uiNotificationService';
import { notificationService as mockNotificationService } from './notification/notificationService';
import { tenantService as mockTenantService } from './tenant/tenantService';
import { ticketService as mockTicketService } from './ticket/ticketService';
import { superAdminManagementService as mockSuperAdminManagementService } from './superadminmanagement/superAdminManagementService';
import { superAdminService as mockSuperAdminService } from './superadmin/superAdminService';
import { contractService as mockContractService } from './contract/contractService';
import { mockRoleRequestService } from './rolerequest/roleRequestService';
import { auditService as mockAuditService } from './audit/auditService';
import { mockComplianceNotificationService } from './compliancenotification/complianceNotificationService';
import { mockRateLimitService } from './ratelimit/rateLimitService';
import { mockReferenceDataService } from './referencedata/referenceDataService';
import { mockReferenceDataLoader } from './referencedata/referenceDataLoader';
import { sessionConfigService as mockSessionConfigService } from './sessionConfigService';
import { complaintService as mockComplaintService } from './complaints/complaintService';
import { productCategoryService as mockProductCategoryService } from './productcategory/productCategoryService';

// Import all supabase services
import { supabaseServiceContractService } from './servicecontract/supabase/serviceContractService';
import { supabaseProductSaleService } from './productsale/supabase/productSaleService';
import { supabaseSalesService } from './sales/supabase/salesService';
import { supabaseLeadsService } from './sales/supabase/leadsService';
import { supabaseCustomerService } from './customer/supabase/customerService';
import { supabaseJobWorkService } from './jobwork/supabase/jobWorkService';
import { supabaseProductService } from './product/supabase/productService';
import { supabaseCompanyService } from './company/supabase/companyService';
import { supabaseUserService } from './user/supabase/userService';
import { supabaseRbacService } from './rbac/supabase/rbacService';
import { supabaseNotificationService } from './notification/supabase/notificationService';
import { supabaseTenantService } from './tenant/supabase/tenantService';
import { multiTenantService as supabaseMultiTenantService } from './multitenant/supabase/multiTenantService';
import { supabaseTicketService } from './ticket/supabase/ticketService';
import { supabaseAdminManagementService as supabaseSuperAdminManagementService } from './superadminmanagement/supabase/superAdminManagementService';
import { supabaseContractService } from './contract/supabase/contractService';
import { supabaseRoleRequestService } from './rolerequest/supabase/roleRequestService';
import { supabaseAuditService } from './audit/supabase/auditService';
import { supabaseComplianceNotificationService } from './compliancenotification/supabase/complianceNotificationService';
import { supabaseImpersonationService } from './impersonation/supabase/impersonationService';
import { supabaseRateLimitService } from './ratelimit/supabase/rateLimitService';
import { supabaseReferenceDataService } from './referencedata/supabase/referenceDataService';
import { supabaseReferenceDataLoader } from './referencedata/supabase/referenceDataLoader';
import { supabaseAuthService } from './auth/supabase/authService';
import { supabaseSuperAdminService } from './superadmin/supabase/superAdminService';
import { supabaseComplaintService } from './complaints/supabase/complaintService';
import { supabaseProductCategoryService } from './productcategory/supabase/productCategoryService';
import { ticketCommentService as mockTicketCommentService } from './ticketCommentService';
import { ticketCommentService as supabaseTicketCommentService } from './supabase/ticketCommentService';
import { ticketAttachmentService as mockTicketAttachmentService } from './ticketAttachmentService';
import { ticketAttachmentService as supabaseTicketAttachmentService } from './supabase/ticketAttachmentService';
import { mockDealsService } from './deals/mock/dealsService';
import { supabaseDealsService } from './deals/supabase/dealsService';
import { mockSalesActivityService } from './sales-activities/mock/salesActivityService';
import { supabaseSalesActivityService } from './sales-activities/supabase/salesActivityService';
import { opportunityService as mockOpportunityService } from './opportunities/opportunityService';
import { supabaseOpportunityService } from './opportunities/supabase/opportunityService';
import { purchaseOrderService as mockPurchaseOrderService } from './purchaseorder/purchaseOrderService';
import { supabasePurchaseOrderService } from './purchaseorder/supabase/purchaseOrderService';

// Service Registry Entry Interface
interface ServiceRegistryEntry {
  mock?: any;
  supabase?: any;
  special?: (factory: ServiceFactory) => any;
  description?: string;
}

// Service Registry Type
type ServiceRegistry = Record<string, ServiceRegistryEntry>;

/**
 * ES6 Proxy-based service factory
 * Eliminates 900+ lines of boilerplate method forwarding
 */
function createServiceProxy(serviceRegistryKey: string): any {
  return new Proxy(
    { get instance() { return serviceFactory.getService(serviceRegistryKey); } },
    {
      get(target, prop) {
        if (prop === 'instance') return target.instance;

        const service = serviceFactory.getService(serviceRegistryKey);
        if (!service || !(prop in service)) {
          console.warn(`Property "${String(prop)}" not found on ${serviceRegistryKey}`);
          return undefined;
        }

        const value = service[prop];
        return typeof value === 'function' ? value.bind(service) : value;
      },
    }
  );
}

/**
 * Service Factory Class
 * Manages 24 services with unified mock/supabase switching
 */
class ServiceFactory {
  private apiMode: ApiMode;
  private serviceRegistry: ServiceRegistry;

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

    // Initialize service registry
    this.serviceRegistry = this.buildServiceRegistry();
  }

  /**
   * Build the service registry with all 24 services
   */
  private buildServiceRegistry(): ServiceRegistry {
    return {
      auth: {
        mock: mockAuthService,
        supabase: supabaseAuthService,
        description: 'Authentication & session management'
      },
      servicecontract: {
        mock: mockServiceContractService,
        supabase: supabaseServiceContractService,
        description: 'Service contract lifecycle'
      },
      productsale: {
        mock: mockProductSaleService,
        supabase: supabaseProductSaleService,
        description: 'Product sales operations'
      },
      sales: {
        mock: mockSalesService,
        supabase: supabaseSalesService,
        description: 'Sales & deal management'
      },
      leads: {
        mock: mockLeadsService,
        supabase: supabaseLeadsService,
        description: 'Lead management and prospect tracking'
      },
      customer: {
        mock: mockCustomerService,
        supabase: supabaseCustomerService,
        description: 'Customer management'
      },
      jobwork: {
        mock: mockJobWorkService,
        supabase: supabaseJobWorkService,
        description: 'Job work operations'
      },
      product: {
        mock: mockProductService,
        supabase: supabaseProductService,
        description: 'Product catalog & inventory'
      },
      company: {
        mock: mockCompanyService,
        supabase: supabaseCompanyService,
        description: 'Company/organization management'
      },
      user: {
        mock: mockUserService,
        supabase: supabaseUserService,
        description: 'User management'
      },
      rbac: {
        mock: mockRbacService,
        supabase: supabaseRbacService,
        description: 'Role-based access control'
      },
      uinotification: {
        special: () => mockUINotificationService,
        description: 'Client-side UI notifications'
      },
      notification: {
        mock: mockNotificationService,
        supabase: supabaseNotificationService,
        description: 'Backend notifications'
      },
      tenant: {
        mock: mockTenantService,
        supabase: supabaseTenantService,
        description: 'Tenant management + metrics + directory'
      },
      multitenant: {
        special: () => supabaseMultiTenantService,
        description: 'Tenant context (infrastructure-level)'
      },
      ticket: {
        mock: mockTicketService,
        supabase: supabaseTicketService,
        description: 'Ticket/issue tracking'
      },
      superadminmanagement: {
        mock: mockSuperAdminManagementService,
        supabase: supabaseSuperAdminManagementService,
        description: 'Super admin lifecycle'
      },
      superadmin: {
        mock: mockSuperAdminService,
        supabase: supabaseSuperAdminService,
        description: 'Super admin dashboard'
      },
      contract: {
        mock: mockContractService,
        supabase: supabaseContractService,
        description: 'Contract module'
      },
      rolerequest: {
        mock: mockRoleRequestService,
        supabase: supabaseRoleRequestService,
        description: 'Role elevation requests'
      },
      audit: {
        mock: mockAuditService,
        supabase: supabaseAuditService,
        description: 'Audit logs, compliance, metrics, retention'
      },
      compliancenotification: {
        mock: mockComplianceNotificationService,
        supabase: supabaseComplianceNotificationService,
        description: 'Compliance alerts'
      },
      impersonation: {
        special: () => {
          if (this.apiMode === 'supabase') return supabaseImpersonationService;
          return {
            getImpersonationLogs: async () => [],
            getActiveImpersonations: async () => []
          };
        },
        description: 'Impersonation session management'
      },
      ratelimit: {
        mock: mockRateLimitService,
        supabase: supabaseRateLimitService,
        description: 'Rate limiting & session controls'
      },
      referencedata: {
        mock: mockReferenceDataService,
        supabase: supabaseReferenceDataService,
        description: 'Reference data & dropdowns'
      },
      referencedataloader: {
        mock: mockReferenceDataLoader,
        supabase: supabaseReferenceDataLoader,
        description: 'Reference data loader'
      },
      sessionconfig: {
        special: () => mockSessionConfigService,
        description: 'Session configuration'
      },
      complaint: {
        mock: mockComplaintService,
        supabase: supabaseComplaintService,
        description: 'Customer complaints management'
      },
      productcategory: {
        mock: mockProductCategoryService,
        supabase: supabaseProductCategoryService,
        description: 'Product category management'
      },
      ticketcomment: {
        mock: mockTicketCommentService,
        supabase: supabaseTicketCommentService,
        description: 'Ticket comment management'
      },
      deals: {
        mock: mockDealsService,
        supabase: supabaseDealsService,
        description: 'Sales deals and closed opportunities management'
      },
      salesactivities: {
        mock: mockSalesActivityService,
        supabase: supabaseSalesActivityService,
        description: 'Sales activity tracking and follow-up management'
      },
      opportunities: {
        mock: mockOpportunityService,
        supabase: supabaseOpportunityService,
        description: 'Sales opportunities and pipeline management'
      },
      purchaseorder: {
        mock: mockPurchaseOrderService,
        supabase: supabasePurchaseOrderService,
        description: 'Purchase orders for inventory restocking'
      }
    };
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
   * Get service from registry
   */
  getService(serviceName: string): any {
    const entry = this.serviceRegistry[serviceName.toLowerCase()];
    if (!entry) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    if (entry.special) {
      return entry.special(this);
    }

    switch (this.apiMode) {
      case 'supabase':
        return entry.supabase || entry.mock;
      case 'real':
        // TODO: Implement real API services
        console.warn('Real API service not yet implemented, falling back to Supabase');
        return entry.supabase || entry.mock;
      case 'mock':
      default:
        return entry.mock;
    }
  }

  /**
   * List all available services
   */
  listAvailableServices() {
    return Object.entries(this.serviceRegistry).map(([key, entry]) => ({
      name: key,
      description: entry.description || 'No description'
    }));
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

// Export all services using proxy pattern
export const authService = createServiceProxy('auth');
export const serviceContractService = createServiceProxy('servicecontract');
export const contractService = createServiceProxy('contract');
export const productSaleService = createServiceProxy('productsale');
export const salesService = createServiceProxy('sales');
export const leadsService = createServiceProxy('leads');
export const customerService = createServiceProxy('customer');
export const jobWorkService = createServiceProxy('jobwork');
export const productService = createServiceProxy('product');
export const companyService = createServiceProxy('company');
export const userService = createServiceProxy('user');
export const rbacService = createServiceProxy('rbac');
export const uiNotificationService = createServiceProxy('uinotification');
export const notificationService = createServiceProxy('notification');
export const tenantService = createServiceProxy('tenant');
export const multiTenantService = createServiceProxy('multitenant');
export const ticketService = createServiceProxy('ticket');
export const superAdminManagementService = createServiceProxy('superadminmanagement');
export const superAdminService = createServiceProxy('superadmin');
export const roleRequestService = createServiceProxy('rolerequest');
export const auditService = createServiceProxy('audit');
export const complianceNotificationService = createServiceProxy('compliancenotification');
export const impersonationService = createServiceProxy('impersonation');
export const rateLimitService = createServiceProxy('ratelimit');
export const referenceDataService = createServiceProxy('referencedata');
export const referenceDataLoader = createServiceProxy('referencedataloader');
export const sessionConfigService = createServiceProxy('sessionconfig');
export const complaintService = createServiceProxy('complaint');
export const productCategoryService = createServiceProxy('productcategory');
export const ticketCommentService = createServiceProxy('ticketcomment');
export const dealsService = createServiceProxy('deals');
export const salesActivityService = createServiceProxy('salesactivities');
export const opportunityService = createServiceProxy('opportunities');
export const purchaseOrderService = createServiceProxy('purchaseorder');

// Backward compatibility aliases
export const auditDashboardService = auditService;
export const auditRetentionService = auditService;
export const auditComplianceReportService = auditService;
export const impersonationActionTracker = auditService;
export const tenantMetricsService = tenantService;
export const tenantDirectoryService = tenantService;
export const impersonationRateLimitService = rateLimitService;

export type { ApiMode };
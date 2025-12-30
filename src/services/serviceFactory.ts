/**
 * Service Factory - Phase 3 Optimized
 * Uses ES6 Proxy pattern for zero-boilerplate service delegation
 * Supports 24 unified services with mock/supabase switching
 */

import { ApiMode } from '@/types';

// Import all mock services
import { mockAuthService } from './auth/mockAuthService';
import { mockServiceContractService } from './servicecontract/mockServiceContractService';
import { mockProductSaleService } from './productsale/mockProductSaleService';
import { mockDealsService } from './deals/mockDealsService';
import { mockLeadsService } from './deals/mockLeadsService';
import { mockCustomerService } from './customer/mockCustomerService';
import { mockJobWorkService } from './jobwork/mockJobWorkService';
import { mockProductService } from './product/mockProductService';
import { mockCompanyService } from './company/mockCompanyService';
import { mockUserService } from './user/mockUserService';
import { mockRbacService } from './rbac/mockRbacService';
import { mockNotificationService } from './notification/mockNotificationService';
import { mockTenantService } from './tenant/mockTenantService';
import { mockTicketService } from './ticket/mockTicketService';
import { mockSuperAdminManagementService } from './superadminmanagement/mockSuperAdminManagementService';
import { mockSuperAdminService } from './superadmin/mockSuperAdminService';
import { mockContractService } from './contract/mockContractService';
import { mockRoleRequestService } from './rolerequest/mockRoleRequestService';
import { mockAuditService } from './audit/mockAuditService';
import { mockComplianceNotificationService } from './compliancenotification/mockComplianceNotificationService';
import { mockRateLimitService } from './ratelimit/mockRateLimitService';
import { mockReferenceDataService } from './referencedata/mockReferenceDataService';
import { mockReferenceDataLoader } from './referencedata/mockReferenceDataLoader';
import { mockComplaintService } from './complaints/mockComplaintService';
import { mockProductCategoryService } from './productcategory/mockProductCategoryService';

// Import all supabase services
import { supabaseServiceContractService } from './servicecontract/supabase/serviceContractService';
import { supabaseProductSaleService } from './productsale/supabase/productSaleService';
import { supabaseDealsService } from './deals/supabase/dealsService';
import { supabaseLeadsService } from './deals/supabase/leadsService';
import { customerService as supabaseCustomerService } from './customer/supabase/customerService';
import { supabaseJobWorkService } from './jobwork/supabase/jobWorkService';
import { supabaseProductService } from './product/supabase/productService';
import { supabaseCompanyService } from './company/supabase/companyService';
import { supabaseUserService } from './user/supabase/userService';
import { supabaseRbacService } from './rbac/supabase/rbacService';
import { supabaseNotificationService } from './notification/supabase/notificationService';
import { supabaseTenantService } from './tenant/supabase/tenantService';
import { multiTenantService as supabaseMultiTenantService } from './multitenant/supabase/multiTenantService';
import { ticketService as refactoredSupabaseTicketService } from './ticket/supabase/TicketService';
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
import { supabaseProductCategoryService } from './productcategory/supabase/productCategoryService';
import { complaintService as supabaseComplaintService } from './complaints/supabase/complaintService';
import { ticketCommentService as mockTicketCommentService } from './ticketcomment/mockTicketCommentService';
import { ticketCommentService as supabaseTicketCommentService } from './ticketcomment/supabase/ticketCommentService';
import { ticketAttachmentService as mockTicketAttachmentService } from './ticketattachment/mockTicketAttachmentService';
import { ticketAttachmentService as supabaseTicketAttachmentService } from './ticketattachment/supabase/ticketAttachmentService';
import { mockSalesActivityService } from './sales-activities/mockSalesActivityService';
import { supabaseSalesActivityService } from './sales-activities/supabase/salesActivityService';
import { mockOpportunityService } from './opportunities/mockOpportunityService';
import { supabaseOpportunityService } from './opportunities/supabase/opportunityService';
import { mockPurchaseOrderService } from './purchaseorder/mockPurchaseOrderService';
import { supabasePurchaseOrderService } from './purchaseorder/supabase/purchaseOrderService';
import { mockNavigationService } from './navigation/mockNavigationService';
import { supabaseNavigationService } from './navigation/supabase/navigationService';
import { mockSessionConfigService } from './sessionConfigService';
import { mockUINotificationService } from './uinotification/mockUINotificationService';
import { elementPermissionService as elementPermissionServiceImpl } from './rbac/elementPermissionService';
import { dynamicPermissionManager } from './rbac/dynamicPermissionManager';

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
      deals: {
        mock: mockDealsService,
        supabase: supabaseDealsService,
        description: 'Deal management & sales pipeline'
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
      elementpermission: {
        special: () => elementPermissionServiceImpl,
        description: 'Element-level permission evaluation and management'
      },
      dynamicpermission: {
        special: () => dynamicPermissionManager,
        description: 'Dynamic permission evaluation with business rules and context'
      },
      uinotification: {
        special: () => mockUINotificationService,
        description: 'UI notifications (client-side toast and notification messages)'
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
        supabase: refactoredSupabaseTicketService,
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
      navigation: {
        mock: mockNavigationService,
        supabase: supabaseNavigationService,
        description: 'Navigation items management'
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
      ticketattachment: {
        mock: mockTicketAttachmentService,
        supabase: supabaseTicketAttachmentService,
        description: 'Ticket attachment management'
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
export const dealsService = createServiceProxy('deals');
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
export const navigationService = createServiceProxy('navigation');
export const sessionConfigService = createServiceProxy('sessionconfig');
export const complaintService = createServiceProxy('complaint');
export const productCategoryService = createServiceProxy('productcategory');
export const ticketCommentService = createServiceProxy('ticketcomment');
export const ticketAttachmentService = createServiceProxy('ticketattachment');
export const salesActivityService = createServiceProxy('salesactivities');
export const opportunityService = createServiceProxy('opportunities');
export const purchaseOrderService = createServiceProxy('purchaseorder');
export const elementPermissionService = createServiceProxy('elementpermission');
export const dynamicPermissionService = createServiceProxy('dynamicpermission');

// Backward compatibility aliases
export const auditDashboardService = auditService;
export const auditRetentionService = auditService;
export const auditComplianceReportService = auditService;
export const impersonationActionTracker = auditService;
export const tenantMetricsService = tenantService;
export const tenantDirectoryService = tenantService;
export const impersonationRateLimitService = rateLimitService;

export type { ApiMode };
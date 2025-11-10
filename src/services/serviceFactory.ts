/**
 * Service Factory
 * Switches between mock and Supabase service implementations
 * based on environment configuration
 */

import { ApiMode } from '@/types';
import { mockServiceContractService } from './serviceContractService'; // Mock implementation
import { supabaseServiceContractService } from './supabase/serviceContractService'; // Supabase implementation
import { supabaseContractService } from './supabase/contractService'; // Supabase contract service (Contract module)
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
import { supabaseTicketService } from './supabase/ticketService';
import { supabaseAdminManagementService } from './api/supabase/superAdminManagementService';
import { superAdminManagementService as mockSuperAdminManagementService } from './superAdminManagementService';
import { mockRoleRequestService } from './roleRequestService';
import { supabaseRoleRequestService } from './api/supabase/roleRequestService';
import { productSaleService as mockProductSaleService } from './productSaleService';
import { salesService as mockSalesService } from './salesService';
import { contractService as mockContractService } from './contractService'; // Mock contract service (Contract module)
import { customerService as mockCustomerService } from './customerService';
import { jobWorkService as mockJobWorkService } from './jobWorkService';
import { productService as mockProductService } from './productService';
import { companyService as mockCompanyService } from './companyService';
import { userService as mockUserService } from './userService';
import { rbacService as mockRbacService } from './rbacService';
import { notificationService as mockNotificationService } from './notificationService';
import { uiNotificationService as mockUINotificationService } from './uiNotificationService';
import { tenantService as mockTenantService } from './tenantService';
import { ticketService as mockTicketService } from './ticketService';
import { complaintService as mockComplaintService } from './complaintService';
import { impersonationActionTracker as mockImpersonationActionTracker } from './impersonationActionTracker';
import { superAdminService as mockSuperAdminService } from './superAdminService';
import { supabaseImpersonationActionTracker } from './api/supabase/impersonationActionTracker';
import { auditService as mockAuditService } from './auditService';
import { supabaseAuditService } from './api/supabase/auditService';
import mockComplianceReportService from './complianceReportService';
import { supabaseComplianceReportService } from './api/supabase/complianceReportService';
import { auditRetentionService as mockAuditRetentionService } from './auditRetentionService';
import { supabaseAuditRetentionService } from './api/supabase/auditRetentionService';
import { auditDashboardService as mockAuditDashboardService } from './auditDashboardService';
import { supabaseAuditDashboardService } from './api/supabase/auditDashboardService';
import { mockComplianceNotificationService } from './complianceNotificationService';
import { supabaseComplianceNotificationService } from './api/supabase/complianceNotificationService';
import { mockRateLimitService } from './rateLimitService';
import { supabaseRateLimitService } from './api/supabase/rateLimitService';
import { mockImpersonationRateLimitService } from './impersonationRateLimitService';
import { supabaseImpersonationRateLimitService } from './api/supabase/impersonationRateLimitService';
import { supabaseImpersonationService } from './api/supabase/impersonationService';
import { supabaseTenantMetricsService } from './api/supabase/tenantMetricsService';
import { supabaseTenantDirectoryService } from './api/supabase/tenantDirectoryService';
import { mockTenantDirectoryService } from './tenantDirectoryService';
import { multiTenantService as supabaseMultiTenantService } from './supabase/multiTenantService';
import { authService as mockAuthService } from './authService';
import { supabaseAuthService } from './supabase/authService';
import { sessionConfigService as mockSessionConfigService } from './sessionConfigService';
import { mockReferenceDataService } from './referenceDataService';
import { supabaseReferenceDataService } from './api/supabase/referenceDataService';
import { mockReferenceDataLoader } from './referenceDataLoader';
import { supabaseReferenceDataLoader } from './api/supabase/referenceDataLoader';

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
   * Get Auth Service
   * Handles user authentication, login/logout, token management, and role-based access
   */
  getAuthService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseAuthService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to Supabase');
        return supabaseAuthService;
      case 'mock':
      default:
        return mockAuthService;
    }
  }

  /**
   * Get Session Config Service
   * Manages session configuration with environment presets and dynamic updates
   * Note: This service is client-side only, no backend differentiation needed
   */
  getSessionConfigService() {
    // Session configuration is client-side and doesn't depend on backend
    return mockSessionConfigService;
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
        return mockServiceContractService;
      case 'mock':
      default:
        return mockServiceContractService;
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
   * Get Complaint Service
   * Handles complaint/ticket management
   */
  getComplaintService() {
    switch (this.apiMode) {
      case 'supabase':
        // TODO: Implement Supabase complaint service
        console.warn('Supabase complaint service not yet implemented, falling back to mock');
        return mockComplaintService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to mock');
        return mockComplaintService;
      case 'mock':
      default:
        return mockComplaintService;
    }
  }

  /**
   * Get UI Notification Service
   * Handles UI notifications and messages (Ant Design based)
   */
  getUINotificationService() {
    // UI notifications are stateless and don't need backend switching
    return mockUINotificationService;
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
   * Get Multi-Tenant Service
   * Manages tenant context initialization and session management
   * Note: Currently Supabase-only; mock mode returns singleton instance
   */
  getMultiTenantService() {
    // Multi-tenant context is infrastructure-level and only works with Supabase
    // Mock mode uses same instance to maintain consistency during development
    return supabaseMultiTenantService;
  }

  /**
   * Get Ticket Service
   */
  getTicketService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseTicketService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to Supabase');
        return supabaseTicketService;
      case 'mock':
      default:
        return mockTicketService;
    }
  }

  /**
   * Get Super Admin Management Service
   * ✅ Phase 2: Implementation Gaps - Super Admin Lifecycle Management
   */
  getSuperAdminManagementService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseAdminManagementService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to mock');
        return mockSuperAdminManagementService;
      case 'mock':
      default:
        return mockSuperAdminManagementService;
    }
  }

  /**
   * Get Super Admin Service
   * Tenant and global admin operations (getTenants, createTenant, getGlobalUsers, etc.)
   * ⚠️ TODO: Supabase implementation needed
   */
  getSuperAdminService() {
    switch (this.apiMode) {
      case 'supabase':
        // TODO: Implement Supabase super admin service
        console.warn('Supabase SuperAdmin service not yet implemented, falling back to mock');
        return mockSuperAdminService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to mock');
        return mockSuperAdminService;
      case 'mock':
      default:
        return mockSuperAdminService;
    }
  }

  /**
   * Get Contract Service (Contract module - not Service Contract)
   * ⚠️ IMPORTANT: This is for the Contracts module (/src/modules/features/contracts/)
   * For Service Contracts, use getServiceContractService() instead
   */
  getContractService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseContractService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to Supabase');
        return supabaseContractService;
      case 'mock':
      default:
        return mockContractService;
    }
  }

  /**
   * Get Impersonation Action Tracker
   * Tracks actions performed during super admin impersonation sessions
   */
  getImpersonationActionTracker() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseImpersonationActionTracker;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to mock');
        return mockImpersonationActionTracker;
      case 'mock':
      default:
        return mockImpersonationActionTracker;
    }
  }

  /**
   * Get Role Request Service
   * Manages role elevation requests from users
   */
  getRoleRequestService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseRoleRequestService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to mock');
        return mockRoleRequestService;
      case 'mock':
      default:
        return mockRoleRequestService;
    }
  }

  /**
   * Get Audit Service
   * Provides audit logging and tracking functionality
   */
  getAuditService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseAuditService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to Supabase');
        return supabaseAuditService;
      case 'mock':
      default:
        return mockAuditService;
    }
  }

  /**
   * Get Compliance Report Service
   * Provides compliance report generation and export functionality
   */
  getComplianceReportService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseComplianceReportService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to mock');
        return mockComplianceReportService;
      case 'mock':
      default:
        return mockComplianceReportService;
    }
  }

  /**
   * Get Audit Retention Service
   * Manages audit log retention policies and cleanup
   */
  getAuditRetentionService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseAuditRetentionService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to mock');
        return mockAuditRetentionService;
      case 'mock':
      default:
        return mockAuditRetentionService;
    }
  }

  /**
   * Get Audit Dashboard Service
   * Provides aggregated metrics and statistics for audit dashboards
   */
  getAuditDashboardService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseAuditDashboardService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to mock');
        return mockAuditDashboardService;
      case 'mock':
      default:
        return mockAuditDashboardService;
    }
  }

  /**
   * Get Compliance Notification Service
   * Provides alert system for suspicious activity detection
   */
  getComplianceNotificationService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseComplianceNotificationService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to mock');
        return mockComplianceNotificationService;
      case 'mock':
      default:
        return mockComplianceNotificationService;
    }
  }

  /**
   * Get Impersonation Service
   * Manages super user impersonation audit logs and session tracking
   */
  getImpersonationService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseImpersonationService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to mock');
        // Mock implementation from hooks
        return { getImpersonationLogs: async () => [], getActiveImpersonations: async () => [] };
      case 'mock':
      default:
        // Mock implementation from hooks - will be set by hook
        return { getImpersonationLogs: async () => [], getActiveImpersonations: async () => [] };
    }
  }

  /**
   * Get Tenant Metrics Service
   * Manages tenant statistics and analytics
   */
  getTenantMetricsService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseTenantMetricsService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to mock');
        // Mock implementation from hooks
        return { getTenantMetrics: async () => [] };
      case 'mock':
      default:
        // Mock implementation from hooks - will be set by hook
        return { getTenantMetrics: async () => [] };
    }
  }

  /**
   * Get Tenant Directory Service
   * Manages tenant directory and listings
   */
  getTenantDirectoryService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseTenantDirectoryService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to mock');
        return mockTenantDirectoryService;
      case 'mock':
      default:
        return mockTenantDirectoryService;
    }
  }

  /**
   * Get Rate Limit Service
   * Manages rate limiting for impersonation operations
   */
  getRateLimitService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseRateLimitService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to mock');
        return mockRateLimitService;
      case 'mock':
      default:
        return mockRateLimitService;
    }
  }

  /**
   * Get Impersonation Rate Limit Service
   * ✅ Phase 6.1: Implement Rate Limiting for Impersonation (Layer 5: Factory)
   * Manages rate limiting specifically for super admin impersonation sessions
   * Enforces: 10/hour, 5 concurrent, 30 min duration limits
   */
  getImpersonationRateLimitService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseImpersonationRateLimitService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to mock');
        return mockImpersonationRateLimitService;
      case 'mock':
      default:
        return mockImpersonationRateLimitService;
    }
  }

  /**
   * Get Reference Data Service
   * ✅ Phase 1.5: Dynamic Data Loading Architecture
   * Loads all reference data (dropdowns, statuses, categories, suppliers) from database
   * Replaces hardcoded enums and static dropdown options
   */
  getReferenceDataService() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseReferenceDataService;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to Supabase');
        return supabaseReferenceDataService;
      case 'mock':
      default:
        return mockReferenceDataService;
    }
  }

  /**
   * Get Reference Data Loader Service
   * ✅ Phase 1.5.2: Reference Data Loader
   * Loads status options, categories, suppliers, and generic reference data
   * Optimized for UI dropdown population with filtering and sorting
   */
  getReferenceDataLoader() {
    switch (this.apiMode) {
      case 'supabase':
        return supabaseReferenceDataLoader;
      case 'real':
        // TODO: Implement real API service
        console.warn('Real API service not yet implemented, falling back to mock');
        return mockReferenceDataLoader;
      case 'mock':
      default:
        return mockReferenceDataLoader;
    }
  }

  /**
   * Get Service (generic method for future extensibility)
   */
  getService(serviceName: string) {
    switch (serviceName.toLowerCase()) {
      case 'sessionconfig':
      case 'session_config':
      case 'session-config':
        return this.getSessionConfigService();
      case 'contract':
      case 'contracts':
        return this.getContractService();
      case 'servicecontract':
      case 'service_contract':
        return this.getServiceContractService();
      case 'productsale':
      case 'product_sale':
        return this.getProductSaleService();
      case 'sales':
      case 'sale':
        return this.getSalesService();
      case 'complaint':
      case 'complaints':
        return this.getComplaintService();
      case 'uinotification':
      case 'ui_notification':
      case 'ui-notification':
        return this.getUINotificationService();
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
      case 'ticket':
      case 'tickets':
        return this.getTicketService();
      case 'superuser':
      case 'super_user':
        return this.getSuperUserService();
      case 'superadminmanagement':
      case 'super_admin_management':
      case 'admin_management':
        return this.getSuperAdminManagementService();
      case 'audit':
      case 'auditlog':
      case 'audit_log':
        return this.getAuditService();
      case 'auditretention':
      case 'audit_retention':
      case 'retention':
        return this.getAuditRetentionService();
      case 'auditdashboard':
      case 'audit_dashboard':
      case 'dashboard':
        return this.getAuditDashboardService();
      case 'compliancenotification':
      case 'compliance_notification':
      case 'notification_compliance':
      case 'alert':
        return this.getComplianceNotificationService();
      case 'ratelimit':
      case 'rate_limit':
      case 'rate-limit':
        return this.getRateLimitService();
      case 'impersonationratelimit':
      case 'impersonation_rate_limit':
      case 'impersonation-rate-limit':
      case 'impersonationlimit':
      case 'impersonation_limit':
        return this.getImpersonationRateLimitService();
      case 'referencedata':
      case 'reference_data':
      case 'reference-data':
        return this.getReferenceDataService();
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

// Export for convenience - Auth Service
// Handles user authentication, login/logout, token management, role-based access
export const authService = {
  get instance() {
    return serviceFactory.getAuthService();
  },
  login: (...args: Parameters<typeof mockAuthService.login>) =>
    serviceFactory.getAuthService().login(...args),
  logout: (...args: Parameters<typeof mockAuthService.logout>) =>
    serviceFactory.getAuthService().logout(...args),
  restoreSession: (...args: Parameters<typeof mockAuthService.restoreSession>) =>
    serviceFactory.getAuthService().restoreSession(...args),
  getCurrentUser: (...args: Parameters<typeof mockAuthService.getCurrentUser>) =>
    serviceFactory.getAuthService().getCurrentUser(...args),
  getToken: (...args: Parameters<typeof mockAuthService.getToken>) =>
    serviceFactory.getAuthService().getToken(...args),
  isAuthenticated: (...args: Parameters<typeof mockAuthService.isAuthenticated>) =>
    serviceFactory.getAuthService().isAuthenticated(...args),
  hasRole: (...args: Parameters<typeof mockAuthService.hasRole>) =>
    serviceFactory.getAuthService().hasRole(...args),
  hasPermission: (...args: Parameters<typeof mockAuthService.hasPermission>) =>
    serviceFactory.getAuthService().hasPermission(...args),
  isSuperAdmin: (...args: Parameters<typeof mockAuthService.isSuperAdmin>) =>
    serviceFactory.getAuthService().isSuperAdmin(...args),
  canAccessSuperAdminPortal: (...args: Parameters<typeof mockAuthService.canAccessSuperAdminPortal>) =>
    serviceFactory.getAuthService().canAccessSuperAdminPortal(...args),
  canAccessTenantPortal: (...args: Parameters<typeof mockAuthService.canAccessTenantPortal>) =>
    serviceFactory.getAuthService().canAccessTenantPortal(...args),
  hasAnyRole: (...args: Parameters<typeof mockAuthService.hasAnyRole>) =>
    serviceFactory.getAuthService().hasAnyRole(...args),
  hasAllPermissions: (...args: Parameters<typeof mockAuthService.hasAllPermissions>) =>
    serviceFactory.getAuthService().hasAllPermissions(...args),
  hasAnyPermission: (...args: Parameters<typeof mockAuthService.hasAnyPermission>) =>
    serviceFactory.getAuthService().hasAnyPermission(...args),
  getUserTenant: (...args: Parameters<typeof mockAuthService.getUserTenant>) =>
    serviceFactory.getAuthService().getUserTenant(...args),
  getTenantUsers: (...args: Parameters<typeof mockAuthService.getTenantUsers>) =>
    serviceFactory.getAuthService().getTenantUsers(...args),
  getAllTenants: (...args: Parameters<typeof mockAuthService.getAllTenants>) =>
    serviceFactory.getAuthService().getAllTenants(...args),
  getUserPermissions: (...args: Parameters<typeof mockAuthService.getUserPermissions>) =>
    serviceFactory.getAuthService().getUserPermissions(...args),
  getAvailableRoles: (...args: Parameters<typeof mockAuthService.getAvailableRoles>) =>
    serviceFactory.getAuthService().getAvailableRoles(...args),
  refreshToken: (...args: Parameters<typeof mockAuthService.refreshToken>) =>
    serviceFactory.getAuthService().refreshToken(...args),
  getDemoAccounts: (...args: Parameters<typeof mockAuthService.getDemoAccounts>) =>
    serviceFactory.getAuthService().getDemoAccounts(...args),
  getPermissionDescription: (...args: Parameters<typeof mockAuthService.getPermissionDescription>) =>
    serviceFactory.getAuthService().getPermissionDescription(...args),
  getRoleHierarchy: (...args: Parameters<typeof mockAuthService.getRoleHierarchy>) =>
    serviceFactory.getAuthService().getRoleHierarchy(...args),
  canManageUser: (...args: Parameters<typeof mockAuthService.canManageUser>) =>
    serviceFactory.getAuthService().canManageUser(...args),
};

// Export for convenience - Service Contract Service (Service Contracts module)
export const serviceContractService = {
  get instance() {
    return serviceFactory.getServiceContractService();
  },
  getServiceContracts: (...args: Parameters<typeof supabaseServiceContractService.getServiceContracts>) =>
    serviceFactory.getServiceContractService().getServiceContracts(...args),
  getServiceContract: (...args: Parameters<typeof supabaseServiceContractService.getServiceContract>) =>
    serviceFactory.getServiceContractService().getServiceContract(...args),
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

// Export for convenience - Contract Service (Contracts module - NOT Service Contracts)
// ⚠️ IMPORTANT: This is for the Contracts module (/src/modules/features/contracts/)
// For Service Contracts, use serviceContractService instead
export const contractService = {
  get instance() {
    return serviceFactory.getContractService();
  },
  getContracts: (...args: Parameters<typeof supabaseContractService.getContracts>) =>
    serviceFactory.getContractService().getContracts(...args),
  getContract: (...args: Parameters<typeof supabaseContractService.getContract>) =>
    serviceFactory.getContractService().getContract(...args),
  createContract: (...args: Parameters<typeof supabaseContractService.createContract>) =>
    serviceFactory.getContractService().createContract(...args),
  updateContract: (...args: Parameters<typeof supabaseContractService.updateContract>) =>
    serviceFactory.getContractService().updateContract(...args),
  deleteContract: (...args: Parameters<typeof supabaseContractService.deleteContract>) =>
    serviceFactory.getContractService().deleteContract(...args),
  getContractStats: (...args: Parameters<typeof supabaseContractService.getContractStats>) =>
    serviceFactory.getContractService().getContractStats(...args),
  getExpiringContracts: (...args: Parameters<typeof supabaseContractService.getExpiringContracts>) =>
    serviceFactory.getContractService().getExpiringContracts(...args),
  getContractsByCustomer: (customerId: string, filters?: any) =>
    serviceFactory.getContractService().getContractsByCustomer(customerId, filters),
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

// Duplicate productSaleService export removed - already defined above (line ~931)
// Using the same factory-routed export for consistency

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

// Export factory getter for user service
export function getUserService() {
  return serviceFactory.getUserService();
}

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
  getUserStats: (...args: Parameters<typeof mockUserService.getUserStats>) =>
    serviceFactory.getUserService().getUserStats(...args),
  getRoles: (...args: Parameters<typeof mockUserService.getRoles>) =>
    serviceFactory.getUserService().getRoles(...args),
  getStatuses: (...args: Parameters<typeof mockUserService.getStatuses>) =>
    serviceFactory.getUserService().getStatuses(...args),
  getUserActivity: (...args: Parameters<typeof mockUserService.getUserActivity>) =>
    serviceFactory.getUserService().getUserActivity(...args),
  logActivity: (...args: Parameters<typeof mockUserService.logActivity>) =>
    serviceFactory.getUserService().logActivity(...args),
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

// Export for convenience - Complaint Service
export const complaintService = {
  get instance() {
    return serviceFactory.getComplaintService();
  },
  getComplaints: (...args: Parameters<typeof mockComplaintService.getComplaints>) =>
    serviceFactory.getComplaintService().getComplaints(...args),
  getComplaint: (...args: Parameters<typeof mockComplaintService.getComplaint>) =>
    serviceFactory.getComplaintService().getComplaint(...args),
  createComplaint: (...args: Parameters<typeof mockComplaintService.createComplaint>) =>
    serviceFactory.getComplaintService().createComplaint(...args),
  updateComplaint: (...args: Parameters<typeof mockComplaintService.updateComplaint>) =>
    serviceFactory.getComplaintService().updateComplaint(...args),
  closeComplaint: (...args: Parameters<typeof mockComplaintService.closeComplaint>) =>
    serviceFactory.getComplaintService().closeComplaint(...args),
  addComment: (...args: Parameters<typeof mockComplaintService.addComment>) =>
    serviceFactory.getComplaintService().addComment(...args),
  getComplaintStats: (...args: Parameters<typeof mockComplaintService.getComplaintStats>) =>
    serviceFactory.getComplaintService().getComplaintStats(...args),
  getComplaintTypes: (...args: Parameters<typeof mockComplaintService.getComplaintTypes>) =>
    serviceFactory.getComplaintService().getComplaintTypes(...args),
  getComplaintStatuses: (...args: Parameters<typeof mockComplaintService.getComplaintStatuses>) =>
    serviceFactory.getComplaintService().getComplaintStatuses(...args),
  getPriorities: (...args: Parameters<typeof mockComplaintService.getPriorities>) =>
    serviceFactory.getComplaintService().getPriorities(...args),
  getEngineers: (...args: Parameters<typeof mockComplaintService.getEngineers>) =>
    serviceFactory.getComplaintService().getEngineers(...args),
  reopenComplaint: (...args: Parameters<typeof mockComplaintService.reopenComplaint>) =>
    serviceFactory.getComplaintService().reopenComplaint(...args),
};

// Export for convenience - UI Notification Service
export const uiNotificationService = {
  get instance() {
    return serviceFactory.getUINotificationService();
  },
  // Quick messages (auto-dismiss)
  success: (...args: Parameters<typeof mockUINotificationService.success>) =>
    serviceFactory.getUINotificationService().success(...args),
  error: (...args: Parameters<typeof mockUINotificationService.error>) =>
    serviceFactory.getUINotificationService().error(...args),
  warning: (...args: Parameters<typeof mockUINotificationService.warning>) =>
    serviceFactory.getUINotificationService().warning(...args),
  info: (...args: Parameters<typeof mockUINotificationService.info>) =>
    serviceFactory.getUINotificationService().info(...args),
  loading: (...args: Parameters<typeof mockUINotificationService.loading>) =>
    serviceFactory.getUINotificationService().loading(...args),
  
  // Persistent notifications (with title + description)
  notify: (...args: Parameters<typeof mockUINotificationService.notify>) =>
    serviceFactory.getUINotificationService().notify(...args),
  successNotify: (...args: Parameters<typeof mockUINotificationService.successNotify>) =>
    serviceFactory.getUINotificationService().successNotify(...args),
  errorNotify: (...args: Parameters<typeof mockUINotificationService.errorNotify>) =>
    serviceFactory.getUINotificationService().errorNotify(...args),
  warningNotify: (...args: Parameters<typeof mockUINotificationService.warningNotify>) =>
    serviceFactory.getUINotificationService().warningNotify(...args),
  infoNotify: (...args: Parameters<typeof mockUINotificationService.infoNotify>) =>
    serviceFactory.getUINotificationService().infoNotify(...args),
  
  // Utilities
  closeAll: (...args: Parameters<typeof mockUINotificationService.closeAll>) =>
    serviceFactory.getUINotificationService().closeAll(...args),
  config: mockUINotificationService.config,
  message: mockUINotificationService.message,
  notification: mockUINotificationService.notification,
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

// Export for convenience - Ticket Service
export const ticketService = {
  get instance() {
    return serviceFactory.getTicketService();
  },
  getTickets: (...args: Parameters<typeof mockTicketService.getTickets>) =>
    serviceFactory.getTicketService().getTickets(...args),
  getTicket: (...args: Parameters<typeof mockTicketService.getTicket>) =>
    serviceFactory.getTicketService().getTicket(...args),
  createTicket: (...args: Parameters<typeof mockTicketService.createTicket>) =>
    serviceFactory.getTicketService().createTicket(...args),
  updateTicket: (...args: Parameters<typeof mockTicketService.updateTicket>) =>
    serviceFactory.getTicketService().updateTicket(...args),
  deleteTicket: (...args: Parameters<typeof mockTicketService.deleteTicket>) =>
    serviceFactory.getTicketService().deleteTicket(...args),
  getStatuses: (...args: Parameters<typeof mockTicketService.getStatuses>) =>
    serviceFactory.getTicketService().getStatuses(...args),
  getPriorities: (...args: Parameters<typeof mockTicketService.getPriorities>) =>
    serviceFactory.getTicketService().getPriorities(...args),
  getCategories: (...args: Parameters<typeof mockTicketService.getCategories>) =>
    serviceFactory.getTicketService().getCategories(...args),
  getTicketStats: (...args: Parameters<typeof mockTicketService.getTicketStats>) =>
    serviceFactory.getTicketService().getTicketStats(...args),
  getTicketCategories: (...args: Parameters<typeof mockTicketService.getTicketCategories>) =>
    serviceFactory.getTicketService().getTicketCategories(...args),
  getTicketPriorities: (...args: Parameters<typeof mockTicketService.getTicketPriorities>) =>
    serviceFactory.getTicketService().getTicketPriorities(...args),
};

// Export for convenience - Super Admin Management Service
// ✅ Phase 2: Implementation Gaps - Super Admin Lifecycle Management
export const superAdminManagementService = {
  get instance() {
    return serviceFactory.getSuperAdminManagementService();
  },
  createSuperAdmin: (...args: Parameters<typeof mockSuperAdminManagementService.createSuperAdmin>) =>
    serviceFactory.getSuperAdminManagementService().createSuperAdmin(...args),
  promoteSuperAdmin: (...args: Parameters<typeof mockSuperAdminManagementService.promoteSuperAdmin>) =>
    serviceFactory.getSuperAdminManagementService().promoteSuperAdmin(...args),
  getSuperAdmin: (...args: Parameters<typeof mockSuperAdminManagementService.getSuperAdmin>) =>
    serviceFactory.getSuperAdminManagementService().getSuperAdmin(...args),
  getAllSuperAdmins: (...args: Parameters<typeof mockSuperAdminManagementService.getAllSuperAdmins>) =>
    serviceFactory.getSuperAdminManagementService().getAllSuperAdmins(...args),
  grantTenantAccess: (...args: Parameters<typeof mockSuperAdminManagementService.grantTenantAccess>) =>
    serviceFactory.getSuperAdminManagementService().grantTenantAccess(...args),
  revokeTenantAccess: (...args: Parameters<typeof mockSuperAdminManagementService.revokeTenantAccess>) =>
    serviceFactory.getSuperAdminManagementService().revokeTenantAccess(...args),
  getSuperAdminTenantAccess: (...args: Parameters<typeof mockSuperAdminManagementService.getSuperAdminTenantAccess>) =>
    serviceFactory.getSuperAdminManagementService().getSuperAdminTenantAccess(...args),
  getSuperAdminStats: (...args: Parameters<typeof mockSuperAdminManagementService.getSuperAdminStats>) =>
    serviceFactory.getSuperAdminManagementService().getSuperAdminStats(...args),
  getActionLogs: (...args: Parameters<typeof mockSuperAdminManagementService.getActionLogs>) =>
    serviceFactory.getSuperAdminManagementService().getActionLogs(...args),
  demoteSuperAdmin: (...args: Parameters<typeof mockSuperAdminManagementService.demoteSuperAdmin>) =>
    serviceFactory.getSuperAdminManagementService().demoteSuperAdmin(...args),
  isSuperAdmin: (...args: Parameters<typeof mockSuperAdminManagementService.isSuperAdmin>) =>
    serviceFactory.getSuperAdminManagementService().isSuperAdmin(...args),
  getAllTenantAccesses: (...args: Parameters<typeof mockSuperAdminManagementService.getAllTenantAccesses>) =>
    serviceFactory.getSuperAdminManagementService().getAllTenantAccesses(...args),
};

// Export for convenience - Super Admin Service
// Tenant and global admin operations (getTenants, createTenant, getGlobalUsers, etc.)
export const superAdminService = {
  get instance() {
    return serviceFactory.getSuperAdminService();
  },
  getTenants: (...args: Parameters<typeof mockSuperAdminService.getTenants>) =>
    serviceFactory.getSuperAdminService().getTenants(...args),
  createTenant: (...args: Parameters<typeof mockSuperAdminService.createTenant>) =>
    serviceFactory.getSuperAdminService().createTenant(...args),
  updateTenant: (...args: Parameters<typeof mockSuperAdminService.updateTenant>) =>
    serviceFactory.getSuperAdminService().updateTenant(...args),
  deleteTenant: (...args: Parameters<typeof mockSuperAdminService.deleteTenant>) =>
    serviceFactory.getSuperAdminService().deleteTenant(...args),
  getGlobalUsers: (...args: Parameters<typeof mockSuperAdminService.getGlobalUsers>) =>
    serviceFactory.getSuperAdminService().getGlobalUsers(...args),
  updateGlobalUser: (...args: Parameters<typeof mockSuperAdminService.updateGlobalUser>) =>
    serviceFactory.getSuperAdminService().updateGlobalUser(...args),
  getRoleRequests: (...args: Parameters<typeof mockSuperAdminService.getRoleRequests>) =>
    serviceFactory.getSuperAdminService().getRoleRequests(...args),
  approveRoleRequest: (...args: Parameters<typeof mockSuperAdminService.approveRoleRequest>) =>
    serviceFactory.getSuperAdminService().approveRoleRequest(...args),
  rejectRoleRequest: (...args: Parameters<typeof mockSuperAdminService.rejectRoleRequest>) =>
    serviceFactory.getSuperAdminService().rejectRoleRequest(...args),
  getPlatformUsage: (...args: Parameters<typeof mockSuperAdminService.getPlatformUsage>) =>
    serviceFactory.getSuperAdminService().getPlatformUsage(...args),
  getSystemHealth: (...args: Parameters<typeof mockSuperAdminService.getSystemHealth>) =>
    serviceFactory.getSuperAdminService().getSystemHealth(...args),
  getAnalyticsData: (...args: Parameters<typeof mockSuperAdminService.getAnalyticsData>) =>
    serviceFactory.getSuperAdminService().getAnalyticsData(...args),
  getAvailablePlans: (...args: Parameters<typeof mockSuperAdminService.getAvailablePlans>) =>
    serviceFactory.getSuperAdminService().getAvailablePlans(...args),
  getAvailableFeatures: (...args: Parameters<typeof mockSuperAdminService.getAvailableFeatures>) =>
    serviceFactory.getSuperAdminService().getAvailableFeatures(...args),
  getTenantStatuses: (...args: Parameters<typeof mockSuperAdminService.getTenantStatuses>) =>
    serviceFactory.getSuperAdminService().getTenantStatuses(...args),
  getUserRoles: (...args: Parameters<typeof mockSuperAdminService.getUserRoles>) =>
    serviceFactory.getSuperAdminService().getUserRoles(...args),
  getUserStatuses: (...args: Parameters<typeof mockSuperAdminService.getUserStatuses>) =>
    serviceFactory.getSuperAdminService().getUserStatuses(...args),
};

// Export for convenience - Impersonation Action Tracker
// ✅ Phase 3.10: Track Actions During Impersonation
export const impersonationActionTracker = {
  get instance() {
    return serviceFactory.getImpersonationActionTracker();
  },
  trackPageView: (...args: Parameters<typeof mockImpersonationActionTracker.trackPageView>) =>
    serviceFactory.getImpersonationActionTracker().trackPageView(...args),
  trackApiCall: (...args: Parameters<typeof mockImpersonationActionTracker.trackApiCall>) =>
    serviceFactory.getImpersonationActionTracker().trackApiCall(...args),
  trackCrudAction: (...args: Parameters<typeof mockImpersonationActionTracker.trackCrudAction>) =>
    serviceFactory.getImpersonationActionTracker().trackCrudAction(...args),
  trackExport: (...args: Parameters<typeof mockImpersonationActionTracker.trackExport>) =>
    serviceFactory.getImpersonationActionTracker().trackExport(...args),
  trackSearch: (...args: Parameters<typeof mockImpersonationActionTracker.trackSearch>) =>
    serviceFactory.getImpersonationActionTracker().trackSearch(...args),
  trackPrint: (...args: Parameters<typeof mockImpersonationActionTracker.trackPrint>) =>
    serviceFactory.getImpersonationActionTracker().trackPrint(...args),
  getSessionActions: (...args: Parameters<typeof mockImpersonationActionTracker.getSessionActions>) =>
    serviceFactory.getImpersonationActionTracker().getSessionActions(...args),
  getActionCount: (...args: Parameters<typeof mockImpersonationActionTracker.getActionCount>) =>
    serviceFactory.getImpersonationActionTracker().getActionCount(...args),
  getActionSummary: (...args: Parameters<typeof mockImpersonationActionTracker.getActionSummary>) =>
    serviceFactory.getImpersonationActionTracker().getActionSummary(...args),
  clearSessionActions: (...args: Parameters<typeof mockImpersonationActionTracker.clearSessionActions>) =>
    serviceFactory.getImpersonationActionTracker().clearSessionActions(...args),
};

// Export for convenience - Role Request Service
// ✅ Phase 4.7: Create Role Request Review UI
export const roleRequestService = {
  get instance() {
    return serviceFactory.getRoleRequestService();
  },
  getRoleRequests: (...args: Parameters<typeof mockRoleRequestService.getRoleRequests>) =>
    serviceFactory.getRoleRequestService().getRoleRequests(...args),
  getRoleRequest: (...args: Parameters<typeof mockRoleRequestService.getRoleRequest>) =>
    serviceFactory.getRoleRequestService().getRoleRequest(...args),
  getPendingRoleRequests: (...args: Parameters<typeof mockRoleRequestService.getPendingRoleRequests>) =>
    serviceFactory.getRoleRequestService().getPendingRoleRequests(...args),
  getRoleRequestsByUserId: (...args: Parameters<typeof mockRoleRequestService.getRoleRequestsByUserId>) =>
    serviceFactory.getRoleRequestService().getRoleRequestsByUserId(...args),
  createRoleRequest: (...args: Parameters<typeof mockRoleRequestService.createRoleRequest>) =>
    serviceFactory.getRoleRequestService().createRoleRequest(...args),
  reviewRoleRequest: (...args: Parameters<typeof mockRoleRequestService.reviewRoleRequest>) =>
    serviceFactory.getRoleRequestService().reviewRoleRequest(...args),
  cancelRoleRequest: (...args: Parameters<typeof mockRoleRequestService.cancelRoleRequest>) =>
    serviceFactory.getRoleRequestService().cancelRoleRequest(...args),
  getRoleRequestStats: (...args: Parameters<typeof mockRoleRequestService.getRoleRequestStats>) =>
    serviceFactory.getRoleRequestService().getRoleRequestStats(...args),
};

// Export for convenience - Audit Service
// ✅ Phase 5.1: Create Audit Log Viewer UI
export const auditService = {
  get instance() {
    return serviceFactory.getAuditService();
  },
  getAuditLogs: (...args: Parameters<typeof mockAuditService.getAuditLogs>) =>
    serviceFactory.getAuditService().getAuditLogs(...args),
  getAuditLog: (...args: Parameters<typeof supabaseAuditService.getAuditLog>) =>
    serviceFactory.getAuditService().getAuditLog?.(...args),
  searchAuditLogs: (...args: Parameters<typeof mockAuditService.searchAuditLogs>) =>
    serviceFactory.getAuditService().searchAuditLogs(...args),
  getAuditStats: (...args: Parameters<typeof mockAuditService.getAuditStats>) =>
    serviceFactory.getAuditService().getAuditStats(...args),
  exportAuditLogs: (...args: Parameters<typeof mockAuditService.exportAuditLogs>) =>
    serviceFactory.getAuditService().exportAuditLogs(...args),
  logAction: (...args: Parameters<typeof mockAuditService.logAction>) =>
    serviceFactory.getAuditService().logAction(...args),
};

// Export for convenience - Compliance Report Service
// ✅ Phase 5.3: Create Compliance Report Generator (Layer 5: Factory)
export const complianceReportService = {
  get instance() {
    return serviceFactory.getComplianceReportService();
  },
  generateReport: (...args: Parameters<typeof mockComplianceReportService.generateReport>) =>
    serviceFactory.getComplianceReportService().generateReport(...args),
  exportReport: (...args: Parameters<typeof mockComplianceReportService.exportReport>) =>
    serviceFactory.getComplianceReportService().exportReport(...args),
  downloadReport: (...args: Parameters<typeof mockComplianceReportService.downloadReport>) =>
    serviceFactory.getComplianceReportService().downloadReport(...args),
};

// Export for convenience - Audit Retention Service
// ✅ Phase 5.5: Implement Audit Log Retention Policy (Layer 5: Factory)
export const auditRetentionService = {
  get instance() {
    return serviceFactory.getAuditRetentionService();
  },
  getRetentionPolicies: (...args: Parameters<typeof mockAuditRetentionService.getRetentionPolicies>) =>
    serviceFactory.getAuditRetentionService().getRetentionPolicies(...args),
  getRetentionPolicy: (...args: Parameters<typeof mockAuditRetentionService.getRetentionPolicy>) =>
    serviceFactory.getAuditRetentionService().getRetentionPolicy(...args),
  createRetentionPolicy: (...args: Parameters<typeof mockAuditRetentionService.createRetentionPolicy>) =>
    serviceFactory.getAuditRetentionService().createRetentionPolicy(...args),
  updateRetentionPolicy: (...args: Parameters<typeof mockAuditRetentionService.updateRetentionPolicy>) =>
    serviceFactory.getAuditRetentionService().updateRetentionPolicy(...args),
  deleteRetentionPolicy: (...args: Parameters<typeof mockAuditRetentionService.deleteRetentionPolicy>) =>
    serviceFactory.getAuditRetentionService().deleteRetentionPolicy(...args),
  executeRetentionCleanup: (...args: Parameters<typeof mockAuditRetentionService.executeRetentionCleanup>) =>
    serviceFactory.getAuditRetentionService().executeRetentionCleanup(...args),
  getRetentionStats: (...args: Parameters<typeof mockAuditRetentionService.getRetentionStats>) =>
    serviceFactory.getAuditRetentionService().getRetentionStats(...args),
  getArchives: (...args: Parameters<typeof mockAuditRetentionService.getArchives>) =>
    serviceFactory.getAuditRetentionService().getArchives(...args),
  getCleanupHistory: (...args: Parameters<typeof mockAuditRetentionService.getCleanupHistory>) =>
    serviceFactory.getAuditRetentionService().getCleanupHistory(...args),
  scheduleRetentionCleanup: (...args: Parameters<typeof mockAuditRetentionService.scheduleRetentionCleanup>) =>
    serviceFactory.getAuditRetentionService().scheduleRetentionCleanup(...args),
};

// Export for convenience - Audit Dashboard Service
// ✅ Phase 5.6: Create Audit Summary Dashboard (Layer 5: Factory)
export const auditDashboardService = {
  get instance() {
    return serviceFactory.getAuditDashboardService();
  },
  getDashboardMetrics: (...args: Parameters<typeof mockAuditDashboardService.getDashboardMetrics>) =>
    serviceFactory.getAuditDashboardService().getDashboardMetrics(...args),
  getActionsByType: (...args: Parameters<typeof mockAuditDashboardService.getActionsByType>) =>
    serviceFactory.getAuditDashboardService().getActionsByType(...args),
  getActionsByUser: (...args: Parameters<typeof mockAuditDashboardService.getActionsByUser>) =>
    serviceFactory.getAuditDashboardService().getActionsByUser(...args),
  getTimeline: (...args: Parameters<typeof mockAuditDashboardService.getTimeline>) =>
    serviceFactory.getAuditDashboardService().getTimeline(...args),
  getTopUnauthorizedUsers: (...args: Parameters<typeof mockAuditDashboardService.getTopUnauthorizedUsers>) =>
    serviceFactory.getAuditDashboardService().getTopUnauthorizedUsers(...args),
  getDashboardData: (...args: Parameters<typeof mockAuditDashboardService.getDashboardData>) =>
    serviceFactory.getAuditDashboardService().getDashboardData(...args),
  exportDashboardData: (...args: Parameters<typeof mockAuditDashboardService.exportDashboardData>) =>
    serviceFactory.getAuditDashboardService().exportDashboardData(...args),
};

// Export for convenience - Compliance Notification Service
// ✅ Phase 5.7: Add Compliance Notifications (Layer 5: Factory)
export const complianceNotificationService = {
  get instance() {
    return serviceFactory.getComplianceNotificationService();
  },
  getAlertRules: (...args: Parameters<typeof mockComplianceNotificationService.getAlertRules>) =>
    serviceFactory.getComplianceNotificationService().getAlertRules(...args),
  getAlertRule: (...args: Parameters<typeof mockComplianceNotificationService.getAlertRule>) =>
    serviceFactory.getComplianceNotificationService().getAlertRule(...args),
  createAlertRule: (...args: Parameters<typeof mockComplianceNotificationService.createAlertRule>) =>
    serviceFactory.getComplianceNotificationService().createAlertRule(...args),
  updateAlertRule: (...args: Parameters<typeof mockComplianceNotificationService.updateAlertRule>) =>
    serviceFactory.getComplianceNotificationService().updateAlertRule(...args),
  deleteAlertRule: (...args: Parameters<typeof mockComplianceNotificationService.deleteAlertRule>) =>
    serviceFactory.getComplianceNotificationService().deleteAlertRule(...args),
  toggleAlertRule: (...args: Parameters<typeof mockComplianceNotificationService.toggleAlertRule>) =>
    serviceFactory.getComplianceNotificationService().toggleAlertRule(...args),
  checkAndNotifyAlerts: (...args: Parameters<typeof mockComplianceNotificationService.checkAndNotifyAlerts>) =>
    serviceFactory.getComplianceNotificationService().checkAndNotifyAlerts(...args),
  getGeneratedAlerts: (...args: Parameters<typeof mockComplianceNotificationService.getGeneratedAlerts>) =>
    serviceFactory.getComplianceNotificationService().getGeneratedAlerts(...args),
  getAlertHistory: (...args: Parameters<typeof mockComplianceNotificationService.getAlertHistory>) =>
    serviceFactory.getComplianceNotificationService().getAlertHistory(...args),
  getAlertStats: (...args: Parameters<typeof mockComplianceNotificationService.getAlertStats>) =>
    serviceFactory.getComplianceNotificationService().getAlertStats(...args),
  sendTestNotification: (...args: Parameters<typeof mockComplianceNotificationService.sendTestNotification>) =>
    serviceFactory.getComplianceNotificationService().sendTestNotification(...args),
  acknowledgeAlert: (...args: Parameters<typeof mockComplianceNotificationService.acknowledgeAlert>) =>
    serviceFactory.getComplianceNotificationService().acknowledgeAlert(...args),
};

// Export for convenience - Rate Limit Service
// ✅ Phase 6.1: Implement Rate Limiting for Impersonation (Layer 5: Factory)
export const rateLimitService = {
  get instance() {
    return serviceFactory.getRateLimitService();
  },
  checkImpersonationRateLimit: (...args: Parameters<typeof mockRateLimitService.checkImpersonationRateLimit>) =>
    serviceFactory.getRateLimitService().checkImpersonationRateLimit(...args),
  recordImpersonationStart: (...args: Parameters<typeof mockRateLimitService.recordImpersonationStart>) =>
    serviceFactory.getRateLimitService().recordImpersonationStart(...args),
  recordImpersonationEnd: (...args: Parameters<typeof mockRateLimitService.recordImpersonationEnd>) =>
    serviceFactory.getRateLimitService().recordImpersonationEnd(...args),
  checkSessionDurationExceeded: (...args: Parameters<typeof mockRateLimitService.checkSessionDurationExceeded>) =>
    serviceFactory.getRateLimitService().checkSessionDurationExceeded(...args),
  getRateLimitStats: (...args: Parameters<typeof mockRateLimitService.getRateLimitStats>) =>
    serviceFactory.getRateLimitService().getRateLimitStats(...args),
  getActiveSessions: (...args: Parameters<typeof mockRateLimitService.getActiveSessions>) =>
    serviceFactory.getRateLimitService().getActiveSessions(...args),
  forceTerminateSession: (...args: Parameters<typeof mockRateLimitService.forceTerminateSession>) =>
    serviceFactory.getRateLimitService().forceTerminateSession(...args),
  getViolations: (...args: Parameters<typeof mockRateLimitService.getViolations>) =>
    serviceFactory.getRateLimitService().getViolations(...args),
  clearViolations: (...args: Parameters<typeof mockRateLimitService.clearViolations>) =>
    serviceFactory.getRateLimitService().clearViolations(...args),
  cleanupExpiredSessions: (...args: Parameters<typeof mockRateLimitService.cleanupExpiredSessions>) =>
    serviceFactory.getRateLimitService().cleanupExpiredSessions(...args),
  resetRateLimits: (...args: Parameters<typeof mockRateLimitService.resetRateLimits>) =>
    serviceFactory.getRateLimitService().resetRateLimits(...args),
};

// Export for convenience - Impersonation Rate Limit Service
// ✅ Phase 6.1: Implement Rate Limiting for Impersonation (Layer 5: Factory)
export const impersonationRateLimitService = {
  get instance() {
    return serviceFactory.getImpersonationRateLimitService();
  },
  getConfig: (...args: Parameters<typeof mockImpersonationRateLimitService.getConfig>) =>
    serviceFactory.getImpersonationRateLimitService().getConfig(...args),
  updateConfig: (...args: Parameters<typeof mockImpersonationRateLimitService.updateConfig>) =>
    serviceFactory.getImpersonationRateLimitService().updateConfig(...args),
  checkRateLimit: (...args: Parameters<typeof mockImpersonationRateLimitService.checkRateLimit>) =>
    serviceFactory.getImpersonationRateLimitService().checkRateLimit(...args),
  recordSessionStart: (...args: Parameters<typeof mockImpersonationRateLimitService.recordSessionStart>) =>
    serviceFactory.getImpersonationRateLimitService().recordSessionStart(...args),
  recordSessionEnd: (...args: Parameters<typeof mockImpersonationRateLimitService.recordSessionEnd>) =>
    serviceFactory.getImpersonationRateLimitService().recordSessionEnd(...args),
  getStatus: (...args: Parameters<typeof mockImpersonationRateLimitService.getStatus>) =>
    serviceFactory.getImpersonationRateLimitService().getStatus(...args),
  getActiveSessions: (...args: Parameters<typeof mockImpersonationRateLimitService.getActiveSessions>) =>
    serviceFactory.getImpersonationRateLimitService().getActiveSessions(...args),
  resetLimits: (...args: Parameters<typeof mockImpersonationRateLimitService.resetLimits>) =>
    serviceFactory.getImpersonationRateLimitService().resetLimits(...args),
};

// Export for convenience - Impersonation Service
// Manages super user impersonation audit logs and session tracking
export const impersonationService = {
  get instance() {
    return serviceFactory.getImpersonationService();
  },
  getImpersonationLogs: (...args: Parameters<typeof supabaseImpersonationService.getImpersonationLogs>) =>
    serviceFactory.getImpersonationService().getImpersonationLogs(...args),
  getImpersonationLogsByUserId: (...args: Parameters<typeof supabaseImpersonationService.getImpersonationLogsByUserId>) =>
    serviceFactory.getImpersonationService().getImpersonationLogsByUserId(...args),
  getImpersonationLogById: (...args: Parameters<typeof supabaseImpersonationService.getImpersonationLogById>) =>
    serviceFactory.getImpersonationService().getImpersonationLogById(...args),
  startImpersonation: (...args: Parameters<typeof supabaseImpersonationService.startImpersonation>) =>
    serviceFactory.getImpersonationService().startImpersonation(...args),
  endImpersonation: (...args: Parameters<typeof supabaseImpersonationService.endImpersonation>) =>
    serviceFactory.getImpersonationService().endImpersonation(...args),
  getActiveImpersonations: (...args: Parameters<typeof supabaseImpersonationService.getActiveImpersonations>) =>
    serviceFactory.getImpersonationService().getActiveImpersonations(...args),
};

// Export for convenience - Tenant Metrics Service
// Manages tenant statistics and analytics
export const tenantMetricsService = {
  get instance() {
    return serviceFactory.getTenantMetricsService();
  },
  getTenantMetrics: (...args: Parameters<typeof supabaseTenantMetricsService.getTenantMetrics>) =>
    serviceFactory.getTenantMetricsService().getTenantMetrics(...args),
  getComparisonMetrics: (...args: Parameters<typeof supabaseTenantMetricsService.getComparisonMetrics>) =>
    serviceFactory.getTenantMetricsService().getComparisonMetrics(...args),
  getMetricsTrend: (...args: Parameters<typeof supabaseTenantMetricsService.getMetricsTrend>) =>
    serviceFactory.getTenantMetricsService().getMetricsTrend(...args),
  recordMetric: (...args: Parameters<typeof supabaseTenantMetricsService.recordMetric>) =>
    serviceFactory.getTenantMetricsService().recordMetric(...args),
};

// Export for convenience - Tenant Directory Service
// Manages tenant directory and listings
export const tenantDirectoryService = {
  get instance() {
    return serviceFactory.getTenantDirectoryService();
  },
  getAllTenants: (...args: Parameters<typeof supabaseTenantDirectoryService.getAllTenants>) =>
    serviceFactory.getTenantDirectoryService().getAllTenants(...args),
  getTenant: (...args: Parameters<typeof supabaseTenantDirectoryService.getTenant>) =>
    serviceFactory.getTenantDirectoryService().getTenant(...args),
  getTenantsByStatus: (...args: Parameters<typeof supabaseTenantDirectoryService.getTenantsByStatus>) =>
    serviceFactory.getTenantDirectoryService().getTenantsByStatus(...args),
  getTenantStats: (...args: Parameters<typeof supabaseTenantDirectoryService.getTenantStats>) =>
    serviceFactory.getTenantDirectoryService().getTenantStats(...args),
  updateTenantStats: (...args: Parameters<typeof supabaseTenantDirectoryService.updateTenantStats>) =>
    serviceFactory.getTenantDirectoryService().updateTenantStats(...args),
};

// Export for convenience - Session Config Service
// Manages session configuration with environment presets and dynamic updates
export const sessionConfigService = {
  get instance() {
    return serviceFactory.getSessionConfigService();
  },
  getConfig: (...args: Parameters<typeof mockSessionConfigService.getConfig>) =>
    serviceFactory.getSessionConfigService().getConfig(...args),
  setConfig: (...args: Parameters<typeof mockSessionConfigService.setConfig>) =>
    serviceFactory.getSessionConfigService().setConfig(...args),
  loadPreset: (...args: Parameters<typeof mockSessionConfigService.loadPreset>) =>
    serviceFactory.getSessionConfigService().loadPreset(...args),
  updateConfigValue: (...args: Parameters<typeof mockSessionConfigService.updateConfigValue>) =>
    serviceFactory.getSessionConfigService().updateConfigValue(...args),
  resetToDefault: (...args: Parameters<typeof mockSessionConfigService.resetToDefault>) =>
    serviceFactory.getSessionConfigService().resetToDefault(...args),
  getConfigAsString: (...args: Parameters<typeof mockSessionConfigService.getConfigAsString>) =>
    serviceFactory.getSessionConfigService().getConfigAsString(...args),
  onConfigChange: (...args: Parameters<typeof mockSessionConfigService.onConfigChange>) =>
    serviceFactory.getSessionConfigService().onConfigChange(...args),
  validateConfig: (...args: Parameters<typeof mockSessionConfigService.validateConfig>) =>
    serviceFactory.getSessionConfigService().validateConfig(...args),
  initializeFromEnvironment: (...args: Parameters<typeof mockSessionConfigService.initializeFromEnvironment>) =>
    serviceFactory.getSessionConfigService().initializeFromEnvironment(...args),
};

// Export for convenience - Multi-Tenant Service
// Manages tenant context initialization and session management
export const multiTenantService = {
  get instance() {
    return serviceFactory.getMultiTenantService();
  },
  initializeTenantContext: (...args: Parameters<typeof supabaseMultiTenantService.initializeTenantContext>) =>
    serviceFactory.getMultiTenantService().initializeTenantContext(...args),
  getCurrentTenant: (...args: Parameters<typeof supabaseMultiTenantService.getCurrentTenant>) =>
    serviceFactory.getMultiTenantService().getCurrentTenant(...args),
  getCurrentTenantId: (...args: Parameters<typeof supabaseMultiTenantService.getCurrentTenantId>) =>
    serviceFactory.getMultiTenantService().getCurrentTenantId(...args),
  getCurrentUserId: (...args: Parameters<typeof supabaseMultiTenantService.getCurrentUserId>) =>
    serviceFactory.getMultiTenantService().getCurrentUserId(...args),
  setCurrentTenant: (...args: Parameters<typeof supabaseMultiTenantService.setCurrentTenant>) =>
    serviceFactory.getMultiTenantService().setCurrentTenant(...args),
  subscribe: (...args: Parameters<typeof supabaseMultiTenantService.subscribe>) =>
    serviceFactory.getMultiTenantService().subscribe(...args),
  clearTenantContext: (...args: Parameters<typeof supabaseMultiTenantService.clearTenantContext>) =>
    serviceFactory.getMultiTenantService().clearTenantContext(...args),
  hasRole: (...args: Parameters<typeof supabaseMultiTenantService.hasRole>) =>
    serviceFactory.getMultiTenantService().hasRole(...args),
  getUserTenants: (...args: Parameters<typeof supabaseMultiTenantService.getUserTenants>) =>
    serviceFactory.getMultiTenantService().getUserTenants(...args),
  switchTenant: (...args: Parameters<typeof supabaseMultiTenantService.switchTenant>) =>
    serviceFactory.getMultiTenantService().switchTenant(...args),
};

// Export for convenience - Reference Data Service
// ✅ PHASE 1.5: DYNAMIC DATA LOADING - Layer 5 (Factory)
export const referenceDataService = {
  get instance() {
    return serviceFactory.getReferenceDataService();
  },
  getAllReferenceData: (...args: Parameters<typeof mockReferenceDataService.getAllReferenceData>) =>
    serviceFactory.getReferenceDataService().getAllReferenceData(...args),
  loadAllReferenceData: (...args: Parameters<typeof mockReferenceDataService.loadAllReferenceData>) =>
    serviceFactory.getReferenceDataService().loadAllReferenceData(...args),
  getStatusOptions: (...args: Parameters<typeof mockReferenceDataService.getStatusOptions>) =>
    serviceFactory.getReferenceDataService().getStatusOptions(...args),
  getReferenceData: (...args: Parameters<typeof mockReferenceDataService.getReferenceData>) =>
    serviceFactory.getReferenceDataService().getReferenceData(...args),
  getCategories: (...args: Parameters<typeof mockReferenceDataService.getCategories>) =>
    serviceFactory.getReferenceDataService().getCategories(...args),
  getSuppliers: (...args: Parameters<typeof mockReferenceDataService.getSuppliers>) =>
    serviceFactory.getReferenceDataService().getSuppliers(...args),
  createStatusOption: (...args: Parameters<typeof mockReferenceDataService.createStatusOption>) =>
    serviceFactory.getReferenceDataService().createStatusOption(...args),
  createReferenceData: (...args: Parameters<typeof mockReferenceDataService.createReferenceData>) =>
    serviceFactory.getReferenceDataService().createReferenceData(...args),
  createCategory: (...args: Parameters<typeof mockReferenceDataService.createCategory>) =>
    serviceFactory.getReferenceDataService().createCategory(...args),
  createSupplier: (...args: Parameters<typeof mockReferenceDataService.createSupplier>) =>
    serviceFactory.getReferenceDataService().createSupplier(...args),
  updateStatusOption: (...args: Parameters<typeof mockReferenceDataService.updateStatusOption>) =>
    serviceFactory.getReferenceDataService().updateStatusOption(...args),
  updateReferenceData: (...args: Parameters<typeof mockReferenceDataService.updateReferenceData>) =>
    serviceFactory.getReferenceDataService().updateReferenceData(...args),
  updateCategory: (...args: Parameters<typeof mockReferenceDataService.updateCategory>) =>
    serviceFactory.getReferenceDataService().updateCategory(...args),
  updateSupplier: (...args: Parameters<typeof mockReferenceDataService.updateSupplier>) =>
    serviceFactory.getReferenceDataService().updateSupplier(...args),
  deleteStatusOption: (...args: Parameters<typeof mockReferenceDataService.deleteStatusOption>) =>
    serviceFactory.getReferenceDataService().deleteStatusOption(...args),
  deleteReferenceData: (...args: Parameters<typeof mockReferenceDataService.deleteReferenceData>) =>
    serviceFactory.getReferenceDataService().deleteReferenceData(...args),
  deleteCategory: (...args: Parameters<typeof mockReferenceDataService.deleteCategory>) =>
    serviceFactory.getReferenceDataService().deleteCategory(...args),
  deleteSupplier: (...args: Parameters<typeof mockReferenceDataService.deleteSupplier>) =>
    serviceFactory.getReferenceDataService().deleteSupplier(...args),
};

// Export for convenience - Reference Data Loader
// ✅ PHASE 1.5.2: DYNAMIC DATA LOADING - Layer 5 (Factory)
// Optimized for initial data loading and UI dropdown population
export const referenceDataLoader = {
  get instance() {
    return serviceFactory.getReferenceDataLoader();
  },
  loadAllReferenceData: (...args: Parameters<typeof mockReferenceDataLoader.loadAllReferenceData>) =>
    serviceFactory.getReferenceDataLoader().loadAllReferenceData(...args),
  loadStatusOptions: (...args: Parameters<typeof mockReferenceDataLoader.loadStatusOptions>) =>
    serviceFactory.getReferenceDataLoader().loadStatusOptions(...args),
  loadReferenceData: (...args: Parameters<typeof mockReferenceDataLoader.loadReferenceData>) =>
    serviceFactory.getReferenceDataLoader().loadReferenceData(...args),
  loadCategories: (...args: Parameters<typeof mockReferenceDataLoader.loadCategories>) =>
    serviceFactory.getReferenceDataLoader().loadCategories(...args),
  loadSuppliers: (...args: Parameters<typeof mockReferenceDataLoader.loadSuppliers>) =>
    serviceFactory.getReferenceDataLoader().loadSuppliers(...args),
  createStatusOption: (...args: Parameters<typeof mockReferenceDataLoader.createStatusOption>) =>
    serviceFactory.getReferenceDataLoader().createStatusOption(...args),
  createReferenceData: (...args: Parameters<typeof mockReferenceDataLoader.createReferenceData>) =>
    serviceFactory.getReferenceDataLoader().createReferenceData(...args),
  createCategory: (...args: Parameters<typeof mockReferenceDataLoader.createCategory>) =>
    serviceFactory.getReferenceDataLoader().createCategory(...args),
  createSupplier: (...args: Parameters<typeof mockReferenceDataLoader.createSupplier>) =>
    serviceFactory.getReferenceDataLoader().createSupplier(...args),
};

export type { ApiMode };
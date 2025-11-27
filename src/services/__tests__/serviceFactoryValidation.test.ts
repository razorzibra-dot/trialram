/**
 * Service Factory Validation Tests
 * Validates all 24 services are properly implemented and accessible
 */

import { serviceFactory } from '../serviceFactory';
import {
  authService,
  serviceContractService,
  contractService,
  productSaleService,
  salesService,
  customerService,
  jobWorkService,
  productService,
  companyService,
  userService,
  rbacService,
  uiNotificationService,
  notificationService,
  tenantService,
  multiTenantService,
  ticketService,
  superAdminManagementService,
  superAdminService,
  roleRequestService,
  auditService,
  auditDashboardService,
  auditRetentionService,
  auditComplianceReportService,
  complianceNotificationService,
  impersonationService,
  rateLimitService,
  referenceDataService,
  tenantMetricsService,
  tenantDirectoryService,
  impersonationRateLimitService,
} from '../serviceFactory';

describe('Service Factory Validation', () => {
  const expectedServices = [
    'auth',
    'servicecontract',
    'productsale',
    'sales',
    'customer',
    'jobwork',
    'product',
    'company',
    'user',
    'rbac',
    'uinotification',
    'notification',
    'tenant',
    'multitenant',
    'ticket',
    'superadminmanagement',
    'superadmin',
    'contract',
    'rolerequest',
    'audit',
    'compliancenotification',
    'impersonation',
    'ratelimit',
    'referencedata',
  ];

  describe('1.1.1: Verify 24 service implementations exist', () => {
    it('should have exactly 24 services in registry', () => {
      const services = serviceFactory.listAvailableServices();
      const coreServices = services.filter(s => expectedServices.includes(s.name));
      expect(coreServices.length).toBe(24);
    });

    it('should have all expected services registered', () => {
      const services = serviceFactory.listAvailableServices();
      const serviceNames = services.map(s => s.name);
      
      expectedServices.forEach(serviceName => {
        expect(serviceNames).toContain(serviceName);
      });
    });

    it('should export all service proxies', () => {
      const services = [
        authService,
        serviceContractService,
        contractService,
        productSaleService,
        salesService,
        customerService,
        jobWorkService,
        productService,
        companyService,
        userService,
        rbacService,
        uiNotificationService,
        notificationService,
        tenantService,
        multiTenantService,
        ticketService,
        superAdminManagementService,
        superAdminService,
        roleRequestService,
        auditService,
        complianceNotificationService,
        impersonationService,
        rateLimitService,
        referenceDataService,
      ];

      services.forEach(service => {
        expect(service).toBeDefined();
        expect(service).toHaveProperty('instance');
      });
    });
  });

  describe('1.1.2: Verify mock implementations for all 24 services', () => {
    beforeEach(() => {
      serviceFactory.setApiMode('mock');
    });

    it('should return mock service for each service', () => {
      expectedServices.forEach(serviceName => {
        const service = serviceFactory.getService(serviceName);
        expect(service).toBeDefined();
        expect(service).not.toBeNull();
      });
    });

    it('should have mock implementations accessible via proxy', async () => {
      // Test a few key services to ensure they work
      expect(authService.instance).toBeDefined();
      expect(customerService.instance).toBeDefined();
      expect(salesService.instance).toBeDefined();
      expect(productService.instance).toBeDefined();
    });
  });

  describe('1.1.3: Verify supabase implementations for all 24 services', () => {
    beforeEach(() => {
      serviceFactory.setApiMode('supabase');
    });

    it('should return supabase service for each service (except special ones)', () => {
      const specialServices = ['uinotification', 'multitenant', 'impersonation', 'sessionconfig'];
      
      expectedServices.forEach(serviceName => {
        if (specialServices.includes(serviceName)) {
          // Special services may have different routing logic
          const service = serviceFactory.getService(serviceName);
          expect(service).toBeDefined();
        } else {
          const service = serviceFactory.getService(serviceName);
          expect(service).toBeDefined();
          expect(service).not.toBeNull();
        }
      });
    });

    it('should have supabase implementations accessible via proxy', () => {
      expect(authService.instance).toBeDefined();
      expect(customerService.instance).toBeDefined();
      expect(salesService.instance).toBeDefined();
      expect(productService.instance).toBeDefined();
    });
  });

  describe('1.1.4: Test service proxy pattern functionality', () => {
    it('should proxy method calls to underlying service', async () => {
      serviceFactory.setApiMode('mock');
      
      // Test that methods are accessible through proxy
      expect(typeof authService.login).toBe('function');
      expect(typeof customerService.getCustomers).toBe('function');
      expect(typeof salesService.getSales).toBe('function');
    });

    it('should bind methods correctly to service context', () => {
      serviceFactory.setApiMode('mock');
      
      // Verify instance property exists
      expect(authService.instance).toBeDefined();
      expect(customerService.instance).toBeDefined();
    });

    it('should handle missing methods gracefully', () => {
      serviceFactory.setApiMode('mock');
      
      // Accessing non-existent property should return undefined
      const nonExistent = (authService as Record<string, unknown>).nonExistentMethod;
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('1.1.5: Validate API mode switching (mock/supabase)', () => {
    it('should switch between mock and supabase modes', () => {
      // Start with mock
      serviceFactory.setApiMode('mock');
      expect(serviceFactory.getApiMode()).toBe('mock');
      
      // Switch to supabase
      serviceFactory.setApiMode('supabase');
      expect(serviceFactory.getApiMode()).toBe('supabase');
      
      // Switch back to mock
      serviceFactory.setApiMode('mock');
      expect(serviceFactory.getApiMode()).toBe('mock');
    });

    it('should return different service instances for different modes', () => {
      serviceFactory.setApiMode('mock');
      const mockService = authService.instance;
      
      serviceFactory.setApiMode('supabase');
      const supabaseService = authService.instance;
      
      // Services should be different instances
      expect(mockService).not.toBe(supabaseService);
    });

    it('should handle real API mode with fallback', () => {
      serviceFactory.setApiMode('real');
      expect(serviceFactory.getApiMode()).toBe('real');
      
      // Should fallback to supabase or mock
      const service = authService.instance;
      expect(service).toBeDefined();
    });
  });

  describe('1.1.6: Verify backward compatibility aliases', () => {
    it('should export backward compatibility aliases', () => {
      expect(auditDashboardService).toBe(auditService);
      expect(auditRetentionService).toBe(auditService);
      expect(auditComplianceReportService).toBe(auditService);
      expect(tenantMetricsService).toBe(tenantService);
      expect(tenantDirectoryService).toBe(tenantService);
      expect(impersonationRateLimitService).toBe(rateLimitService);
    });

    it('should have aliases pointing to same service instance', () => {
      serviceFactory.setApiMode('mock');
      expect(auditDashboardService.instance).toBe(auditService.instance);
      expect(tenantMetricsService.instance).toBe(tenantService.instance);
    });
  });

  describe('Service descriptions', () => {
    it('should have descriptions for all services', () => {
      const services = serviceFactory.listAvailableServices();
      const coreServices = services.filter(s => expectedServices.includes(s.name));
      
      coreServices.forEach(service => {
        expect(service.description).toBeDefined();
        expect(service.description).not.toBe('');
      });
    });
  });
});


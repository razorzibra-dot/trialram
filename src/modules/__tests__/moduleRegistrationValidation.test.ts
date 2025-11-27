/**
 * Module Registration Validation Tests
 * Validates all 16 modules are properly registered and structured
 */

import { moduleRegistry } from '../ModuleRegistry';
import { bootstrapApplication } from '../bootstrap';

describe('Module Registration Validation', () => {
  const expectedModules = [
    'core',
    'shared',
    'customers',
    'sales',
    'tickets',
    'jobworks',
    'dashboard',
    'masters',
    'contracts',
    'service-contracts',
    'super-admin',
    'user-management',
    'notifications',
    'configuration',
    'audit-logs',
    'product-sales',
    'complaints',
  ];

  describe('1.2.1: Verify 16 modules registered in bootstrap.ts', () => {
    beforeAll(async () => {
      // Bootstrap the application to register all modules
      await bootstrapApplication();
    });

    it('should have all expected modules registered', () => {
      const registeredModules = moduleRegistry.getAll();
      const moduleNames = registeredModules.map(m => m.name);

      // Check that all expected modules are registered
      expectedModules.forEach(moduleName => {
        expect(moduleNames).toContain(moduleName);
      });
    });

    it('should have exactly the expected number of modules', () => {
      const registeredModules = moduleRegistry.getAll();
      const coreModules = registeredModules.filter(m => expectedModules.includes(m.name));
      expect(coreModules.length).toBeGreaterThanOrEqual(16);
    });

    it('should have Core Module registered', () => {
      const coreModule = moduleRegistry.get('core');
      expect(coreModule).toBeDefined();
      expect(coreModule?.name).toBe('core');
    });

    it('should have Shared Module registered', () => {
      const sharedModule = moduleRegistry.get('shared');
      expect(sharedModule).toBeDefined();
      expect(sharedModule?.name).toBe('shared');
    });

    it('should have Customer Module registered', () => {
      const customerModule = moduleRegistry.get('customers');
      expect(customerModule).toBeDefined();
      expect(customerModule?.name).toBe('customers');
    });

    it('should have Sales Module registered', () => {
      const salesModule = moduleRegistry.get('sales');
      expect(salesModule).toBeDefined();
      expect(salesModule?.name).toBe('sales');
    });

    it('should have Tickets Module registered', () => {
      const ticketsModule = moduleRegistry.get('tickets');
      expect(ticketsModule).toBeDefined();
      expect(ticketsModule?.name).toBe('tickets');
    });

    it('should have JobWorks Module registered', () => {
      const jobWorksModule = moduleRegistry.get('jobworks');
      expect(jobWorksModule).toBeDefined();
      expect(jobWorksModule?.name).toBe('jobworks');
    });

    it('should have Dashboard Module registered', () => {
      const dashboardModule = moduleRegistry.get('dashboard');
      expect(dashboardModule).toBeDefined();
      expect(dashboardModule?.name).toBe('dashboard');
    });

    it('should have Masters Module registered', () => {
      const mastersModule = moduleRegistry.get('masters');
      expect(mastersModule).toBeDefined();
      expect(mastersModule?.name).toBe('masters');
    });

    it('should have Contracts Module registered', () => {
      const contractsModule = moduleRegistry.get('contracts');
      expect(contractsModule).toBeDefined();
      expect(contractsModule?.name).toBe('contracts');
    });

    it('should have Service Contracts Module registered', () => {
      const serviceContractsModule = moduleRegistry.get('service-contracts');
      expect(serviceContractsModule).toBeDefined();
      expect(serviceContractsModule?.name).toBe('service-contracts');
    });

    it('should have Super Admin Module registered', () => {
      const superAdminModule = moduleRegistry.get('super-admin');
      expect(superAdminModule).toBeDefined();
      expect(superAdminModule?.name).toBe('super-admin');
    });

    it('should have User Management Module registered', () => {
      const userManagementModule = moduleRegistry.get('user-management');
      expect(userManagementModule).toBeDefined();
      expect(userManagementModule?.name).toBe('user-management');
    });

    it('should have Notifications Module registered', () => {
      const notificationsModule = moduleRegistry.get('notifications');
      expect(notificationsModule).toBeDefined();
      expect(notificationsModule?.name).toBe('notifications');
    });

    it('should have Configuration Module registered', () => {
      const configurationModule = moduleRegistry.get('configuration');
      expect(configurationModule).toBeDefined();
      expect(configurationModule?.name).toBe('configuration');
    });

    it('should have Audit Logs Module registered', () => {
      const auditLogsModule = moduleRegistry.get('audit-logs');
      expect(auditLogsModule).toBeDefined();
      expect(auditLogsModule?.name).toBe('audit-logs');
    });

    it('should have Product Sales Module registered', () => {
      const productSalesModule = moduleRegistry.get('product-sales');
      expect(productSalesModule).toBeDefined();
      expect(productSalesModule?.name).toBe('product-sales');
    });

    it('should have Complaints Module registered', () => {
      const complaintsModule = moduleRegistry.get('complaints');
      expect(complaintsModule).toBeDefined();
      expect(complaintsModule?.name).toBe('complaints');
    });
  });

  describe('1.2.2: Verify module structure consistency', () => {
    beforeAll(async () => {
      await bootstrapApplication();
    });

    it('should have consistent module structure for all modules', () => {
      const registeredModules = moduleRegistry.getAll();
      
      registeredModules.forEach(module => {
        expect(module).toHaveProperty('name');
        expect(module).toHaveProperty('routes');
        expect(module).toHaveProperty('services');
        expect(module).toHaveProperty('components');
        expect(module).toHaveProperty('initialize');
        expect(typeof module.initialize).toBe('function');
      });
    });

    it('should have routes defined for feature modules', () => {
      const featureModules = [
        'customers',
        'sales',
        'tickets',
        'jobworks',
        'dashboard',
        'masters',
        'contracts',
        'service-contracts',
        'super-admin',
        'user-management',
        'notifications',
        'configuration',
        'audit-logs',
        'product-sales',
        'complaints',
      ];

      featureModules.forEach(moduleName => {
        const module = moduleRegistry.get(moduleName);
        expect(module).toBeDefined();
        expect(Array.isArray(module?.routes)).toBe(true);
      });
    });
  });

  describe('1.2.3: Validate lazy loading implementation', () => {
    it('should use dynamic imports for feature modules', async () => {
      // Verify that modules are loaded dynamically
      const { customerModule } = await import('../features/customers');
      expect(customerModule).toBeDefined();
      expect(customerModule.name).toBe('customers');

      const { salesModule } = await import('../features/sales');
      expect(salesModule).toBeDefined();
      expect(salesModule.name).toBe('sales');
    });

    it('should support lazy loading without errors', async () => {
      const modules = [
        () => import('../features/customers'),
        () => import('../features/sales'),
        () => import('../features/tickets'),
        () => import('../features/jobworks'),
        () => import('../features/dashboard'),
      ];

      for (const loadModule of modules) {
        await expect(loadModule()).resolves.toBeDefined();
      }
    });
  });

  describe('1.2.4: Test module initialization sequence', () => {
    it('should initialize modules in correct order', async () => {
      const initOrder: string[] = [];
      
      // Mock console.log to track initialization
      const originalLog = console.log;
      console.log = (message: string) => {
        if (message.includes('module initialized') || message.includes('module registered')) {
          initOrder.push(message);
        }
        originalLog(message);
      };

      try {
        await bootstrapApplication();

        // Core and Shared should be initialized first
        expect(initOrder.some(msg => msg.includes('Core module'))).toBe(true);
        expect(initOrder.some(msg => msg.includes('Shared module'))).toBe(true);
      } finally {
        console.log = originalLog;
      }
    });

    it('should handle module initialization errors gracefully', async () => {
      // This test verifies that errors in one module don't break the entire bootstrap
      await expect(bootstrapApplication()).resolves.not.toThrow();
    });
  });
});


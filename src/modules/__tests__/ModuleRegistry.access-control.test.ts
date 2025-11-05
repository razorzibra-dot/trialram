/**
 * ModuleRegistry Access Control Tests
 * 
 * Comprehensive test suite for module access control functionality
 * Tests super admin isolation and RBAC permission checking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModuleRegistry, canUserAccessModule, getAccessibleModules, getAccessibleModuleNames } from '../ModuleRegistry';
import { User, FeatureModule } from '@/modules/core/types';
import { authService } from '@/services';

// Mock authService
vi.mock('@/services', () => ({
  authService: {
    hasPermission: vi.fn(),
  },
}));

describe('ModuleRegistry - Access Control', () => {
  let registry: ModuleRegistry;
  let mockModules: Map<string, FeatureModule>;

  // Test data
  const superAdmin: User = {
    id: 'super-admin-1',
    email: 'super@admin.com',
    name: 'Super Admin',
    role: 'super_admin',
    status: 'active',
    tenantId: null,
    isSuperAdmin: true,
    createdAt: '2025-02-20T00:00:00Z',
  };

  const regularUser: User = {
    id: 'user-1',
    email: 'user@tenant.com',
    name: 'Regular User',
    role: 'manager',
    status: 'active',
    tenantId: 'tenant-1',
    isSuperAdmin: false,
    createdAt: '2025-02-20T00:00:00Z',
  };

  const mockModuleConfig: FeatureModule[] = [
    // Super admin modules
    { name: 'super-admin', path: '/super-admin' },
    { name: 'system-admin', path: '/system-admin' },
    { name: 'admin-panel', path: '/admin-panel' },
    // Tenant modules
    { name: 'customers', path: '/customers' },
    { name: 'sales', path: '/sales' },
    { name: 'contracts', path: '/contracts' },
    { name: 'products', path: '/products' },
    { name: 'notifications', path: '/notifications' },
  ];

  beforeEach(() => {
    // Create fresh registry instance for each test
    registry = ModuleRegistry.getInstance();
    registry.clear();

    // Register mock modules
    for (const module of mockModuleConfig) {
      registry.register(module);
    }

    // Reset mock
    vi.clearAllMocks();
  });

  describe('canUserAccessModule', () => {
    describe('Super Admin Access', () => {
      it('should allow super admin to access super-admin module', () => {
        const canAccess = registry.canUserAccessModule(superAdmin, 'super-admin');
        expect(canAccess).toBe(true);
      });

      it('should allow super admin to access system-admin module', () => {
        const canAccess = registry.canUserAccessModule(superAdmin, 'system-admin');
        expect(canAccess).toBe(true);
      });

      it('should allow super admin to access admin-panel module', () => {
        const canAccess = registry.canUserAccessModule(superAdmin, 'admin-panel');
        expect(canAccess).toBe(true);
      });

      it('should block super admin from accessing tenant modules', () => {
        const canAccess = registry.canUserAccessModule(superAdmin, 'customers');
        expect(canAccess).toBe(false);
      });

      it('should block super admin from accessing sales module', () => {
        const canAccess = registry.canUserAccessModule(superAdmin, 'sales');
        expect(canAccess).toBe(false);
      });

      it('should block super admin from accessing products module', () => {
        const canAccess = registry.canUserAccessModule(superAdmin, 'products');
        expect(canAccess).toBe(false);
      });

      it('should handle case-insensitive module names for super admin', () => {
        const canAccess1 = registry.canUserAccessModule(superAdmin, 'SUPER-ADMIN');
        const canAccess2 = registry.canUserAccessModule(superAdmin, 'Super-Admin');
        expect(canAccess1).toBe(true);
        expect(canAccess2).toBe(true);
      });
    });

    describe('Regular User Access', () => {
      beforeEach(() => {
        // Mock authService.hasPermission for regular user tests
        (authService.hasPermission as any).mockImplementation((permission: string) => {
          // Simulate user having manage_customers and customers:read permissions
          return ['manage_customers', 'customers:read'].includes(permission);
        });
      });

      it('should block regular user from accessing super-admin module', () => {
        const canAccess = registry.canUserAccessModule(regularUser, 'super-admin');
        expect(canAccess).toBe(false);
      });

      it('should block regular user from accessing system-admin module', () => {
        const canAccess = registry.canUserAccessModule(regularUser, 'system-admin');
        expect(canAccess).toBe(false);
      });

      it('should allow regular user to access module with manage_module permission', () => {
        const canAccess = registry.canUserAccessModule(regularUser, 'customers');
        expect(canAccess).toBe(true);
      });

      it('should allow regular user with only read permission', () => {
        (authService.hasPermission as any).mockImplementation((permission: string) => {
          return permission === 'customers:read' || permission === 'read';
        });
        const canAccess = registry.canUserAccessModule(regularUser, 'customers');
        expect(canAccess).toBe(true);
      });

      it('should block regular user without permissions', () => {
        (authService.hasPermission as any).mockReturnValue(false);
        const canAccess = registry.canUserAccessModule(regularUser, 'customers');
        expect(canAccess).toBe(false);
      });

      it('should handle case-insensitive module names for regular user', () => {
        (authService.hasPermission as any).mockImplementation((permission: string) => {
          return ['manage_customers', 'customers:read'].includes(permission.toLowerCase());
        });
        const canAccess1 = registry.canUserAccessModule(regularUser, 'CUSTOMERS');
        const canAccess2 = registry.canUserAccessModule(regularUser, 'Customers');
        expect(canAccess1).toBe(true);
        expect(canAccess2).toBe(true);
      });
    });

    describe('Error Handling', () => {
      it('should return false for invalid user (null)', () => {
        const canAccess = registry.canUserAccessModule(null as any, 'customers');
        expect(canAccess).toBe(false);
      });

      it('should return false for invalid user (no id)', () => {
        const invalidUser = { ...regularUser, id: undefined };
        const canAccess = registry.canUserAccessModule(invalidUser as any, 'customers');
        expect(canAccess).toBe(false);
      });

      it('should return false for invalid module name (null)', () => {
        const canAccess = registry.canUserAccessModule(regularUser, null as any);
        expect(canAccess).toBe(false);
      });

      it('should return false for invalid module name (empty string)', () => {
        const canAccess = registry.canUserAccessModule(regularUser, '');
        expect(canAccess).toBe(false);
      });

      it('should return false for unregistered module', () => {
        const canAccess = registry.canUserAccessModule(regularUser, 'non-existent-module');
        expect(canAccess).toBe(false);
      });

      it('should fail securely when authService throws error', () => {
        (authService.hasPermission as any).mockImplementation(() => {
          throw new Error('Permission check failed');
        });
        const canAccess = registry.canUserAccessModule(regularUser, 'customers');
        expect(canAccess).toBe(false);
      });
    });
  });

  describe('getAccessibleModules', () => {
    describe('Super Admin Modules', () => {
      it('should return only super-admin modules for super admin', () => {
        const modules = registry.getAccessibleModules(superAdmin);
        const moduleNames = modules.map(m => m.name);

        expect(modules.length).toBe(3);
        expect(moduleNames).toContain('super-admin');
        expect(moduleNames).toContain('system-admin');
        expect(moduleNames).toContain('admin-panel');
        expect(moduleNames).not.toContain('customers');
        expect(moduleNames).not.toContain('sales');
      });

      it('should not include tenant modules for super admin', () => {
        const modules = registry.getAccessibleModules(superAdmin);
        const moduleNames = modules.map(m => m.name);

        // Verify none of the tenant modules are included
        const tenantModules = ['customers', 'sales', 'contracts', 'products', 'notifications'];
        for (const tenantModule of tenantModules) {
          expect(moduleNames).not.toContain(tenantModule);
        }
      });
    });

    describe('Regular User Modules', () => {
      beforeEach(() => {
        // Regular user has access to customers and sales
        (authService.hasPermission as any).mockImplementation((permission: string) => {
          const allowedPermissions = ['manage_customers', 'customers:read', 'manage_sales', 'sales:read'];
          return allowedPermissions.includes(permission);
        });
      });

      it('should return accessible modules for regular user with permissions', () => {
        const modules = registry.getAccessibleModules(regularUser);
        const moduleNames = modules.map(m => m.name);

        expect(modules.length).toBe(2);
        expect(moduleNames).toContain('customers');
        expect(moduleNames).toContain('sales');
        expect(moduleNames).not.toContain('super-admin');
      });

      it('should not include super-admin modules', () => {
        const modules = registry.getAccessibleModules(regularUser);
        const moduleNames = modules.map(m => m.name);

        expect(moduleNames).not.toContain('super-admin');
        expect(moduleNames).not.toContain('system-admin');
        expect(moduleNames).not.toContain('admin-panel');
      });

      it('should return empty array for user with no permissions', () => {
        (authService.hasPermission as any).mockReturnValue(false);
        const modules = registry.getAccessibleModules(regularUser);

        expect(modules).toEqual([]);
      });

      it('should return empty array for user with generic read permission', () => {
        (authService.hasPermission as any).mockImplementation((permission: string) => {
          return permission === 'read';
        });
        const modules = registry.getAccessibleModules(regularUser);

        // User has generic read permission, should have access to all tenant modules
        expect(modules.length).toBeGreaterThan(0);
      });
    });

    describe('Error Handling', () => {
      it('should return empty array for invalid user (null)', () => {
        const modules = registry.getAccessibleModules(null as any);
        expect(modules).toEqual([]);
      });

      it('should return empty array for invalid user (no id)', () => {
        const invalidUser = { ...regularUser, id: undefined };
        const modules = registry.getAccessibleModules(invalidUser as any);
        expect(modules).toEqual([]);
      });

      it('should fail securely when permission check throws', () => {
        (authService.hasPermission as any).mockImplementation(() => {
          throw new Error('Permission check failed');
        });
        const modules = registry.getAccessibleModules(regularUser);
        expect(modules).toEqual([]);
      });

      it('should handle empty module registry', () => {
        registry.clear();
        const modules = registry.getAccessibleModules(regularUser);
        expect(modules).toEqual([]);
      });
    });
  });

  describe('getAccessibleModuleNames', () => {
    beforeEach(() => {
      (authService.hasPermission as any).mockImplementation((permission: string) => {
        return ['manage_customers', 'customers:read'].includes(permission);
      });
    });

    it('should return only module names for super admin', () => {
      const names = registry.getAccessibleModuleNames(superAdmin);

      expect(names).toEqual(['super-admin', 'system-admin', 'admin-panel']);
    });

    it('should return only module names for regular user', () => {
      const names = registry.getAccessibleModuleNames(regularUser);

      expect(names).toEqual(['customers']);
    });

    it('should return empty array for user with no access', () => {
      (authService.hasPermission as any).mockReturnValue(false);
      const names = registry.getAccessibleModuleNames(regularUser);

      expect(names).toEqual([]);
    });

    it('should return string array (not objects)', () => {
      const names = registry.getAccessibleModuleNames(superAdmin);

      for (const name of names) {
        expect(typeof name).toBe('string');
      }
    });
  });

  describe('Module Helper Functions', () => {
    beforeEach(() => {
      (authService.hasPermission as any).mockImplementation((permission: string) => {
        return ['manage_customers', 'customers:read'].includes(permission);
      });
    });

    it('should export canUserAccessModule function', () => {
      expect(typeof canUserAccessModule).toBe('function');
      const result = canUserAccessModule(superAdmin, 'super-admin');
      expect(result).toBe(true);
    });

    it('should export getAccessibleModules function', () => {
      expect(typeof getAccessibleModules).toBe('function');
      const modules = getAccessibleModules(superAdmin);
      expect(Array.isArray(modules)).toBe(true);
      expect(modules.length).toBe(3);
    });

    it('should export getAccessibleModuleNames function', () => {
      expect(typeof getAccessibleModuleNames).toBe('function');
      const names = getAccessibleModuleNames(superAdmin);
      expect(Array.isArray(names)).toBe(true);
      expect(names[0]).toEqual('super-admin');
    });
  });

  describe('Permission Format Support', () => {
    describe('manage_* format', () => {
      it('should grant access with manage_module permission', () => {
        (authService.hasPermission as any).mockImplementation((permission: string) => {
          return permission === 'manage_customers';
        });
        const canAccess = registry.canUserAccessModule(regularUser, 'customers');
        expect(canAccess).toBe(true);
      });
    });

    describe('*:read format', () => {
      it('should grant access with module:read permission', () => {
        (authService.hasPermission as any).mockImplementation((permission: string) => {
          return permission === 'customers:read';
        });
        const canAccess = registry.canUserAccessModule(regularUser, 'customers');
        expect(canAccess).toBe(true);
      });
    });

    describe('generic read format', () => {
      it('should grant access with generic read permission', () => {
        (authService.hasPermission as any).mockImplementation((permission: string) => {
          return permission === 'read';
        });
        const canAccess = registry.canUserAccessModule(regularUser, 'customers');
        expect(canAccess).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with isSuperAdmin=false explicitly', () => {
      const user = { ...regularUser, isSuperAdmin: false };
      (authService.hasPermission as any).mockReturnValue(false);
      const canAccess = registry.canUserAccessModule(user, 'customers');
      expect(canAccess).toBe(false);
    });

    it('should handle user with isSuperAdmin=undefined (defaults to false)', () => {
      const user = { ...regularUser, isSuperAdmin: undefined };
      (authService.hasPermission as any).mockReturnValue(false);
      const canAccess = registry.canUserAccessModule(user as any, 'customers');
      expect(canAccess).toBe(false);
    });

    it('should handle mixed case module names consistently', () => {
      (authService.hasPermission as any).mockImplementation((permission: string) => {
        return permission.toLowerCase() === 'manage_customers' || permission.toLowerCase() === 'customers:read';
      });

      const canAccess1 = registry.canUserAccessModule(regularUser, 'customers');
      const canAccess2 = registry.canUserAccessModule(regularUser, 'CUSTOMERS');
      const canAccess3 = registry.canUserAccessModule(regularUser, 'Customers');

      expect(canAccess1).toBe(canAccess2);
      expect(canAccess2).toBe(canAccess3);
    });

    it('should return consistent results on repeated calls', () => {
      (authService.hasPermission as any).mockReturnValue(false);

      const result1 = registry.canUserAccessModule(regularUser, 'customers');
      const result2 = registry.canUserAccessModule(regularUser, 'customers');
      const result3 = registry.canUserAccessModule(regularUser, 'customers');

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });
});
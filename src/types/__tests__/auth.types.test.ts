/**
 * Tests for User type with Super Admin Isolation fields
 * Phase 2, Task 2.1: Verify User type accepts super admin fields
 * 
 * @file auth.types.test.ts
 * @status PASSING ✅
 */

import { User, AuthResponse } from '../auth';
import { describe, it, expect } from 'vitest';

describe('User Type - Super Admin Isolation Fields', () => {
  
  describe('Regular User Type Validation', () => {
    it('should compile and validate regular user without super admin fields', () => {
      // ✅ Regular users don't need super admin fields
      const regularUser: User = {
        id: 'user-1',
        email: 'user@company.com',
        name: 'John Doe',
        role: 'manager',
        status: 'active',
        tenantId: 'company-123',
        createdAt: new Date().toISOString(),
        isSuperAdmin: false, // Regular users always false
      };

      expect(regularUser.isSuperAdmin).toBe(false);
      expect(regularUser.tenantId).toBe('company-123');
      expect(regularUser.impersonatedAsUserId).toBeUndefined();
    });
  });

  describe('Super Admin User Type Validation', () => {
    it('should compile and validate super admin user with all fields', () => {
      // ✅ Super admin with all fields
      const superAdmin: User = {
        id: 'super_admin_1',
        email: 'admin@platform.com',
        name: 'Platform Administrator',
        role: 'super_admin',
        status: 'active',
        tenantId: null, // ← Super admins have NULL tenantId
        createdAt: new Date().toISOString(),
        // ⭐ NEW: Super Admin Isolation Fields
        isSuperAdmin: true,
        isSuperAdminMode: false,
        impersonatedAsUserId: undefined,
        impersonationLogId: undefined,
      };

      expect(superAdmin.isSuperAdmin).toBe(true);
      expect(superAdmin.tenantId).toBeNull();
      expect(superAdmin.isSuperAdminMode).toBe(false);
      expect(superAdmin.impersonatedAsUserId).toBeUndefined();
      expect(superAdmin.impersonationLogId).toBeUndefined();
    });

    it('should compile super admin in impersonation mode', () => {
      // ✅ Super admin actively impersonating a user
      const impersonatingAdmin: User = {
        id: 'super_admin_1',
        email: 'admin@platform.com',
        name: 'Platform Administrator',
        role: 'super_admin',
        status: 'active',
        tenantId: null,
        createdAt: new Date().toISOString(),
        isSuperAdmin: true,
        isSuperAdminMode: true, // ← Currently impersonating
        impersonatedAsUserId: 'user-123',
        impersonationLogId: 'log-456',
      };

      expect(impersonatingAdmin.isSuperAdminMode).toBe(true);
      expect(impersonatingAdmin.impersonatedAsUserId).toBe('user-123');
      expect(impersonatingAdmin.impersonationLogId).toBe('log-456');
    });
  });

  describe('AuthResponse Type Validation', () => {
    it('should compile AuthResponse with super admin user', () => {
      // ✅ Auth response with super admin user
      const authResponse: AuthResponse = {
        user: {
          id: 'super_admin_1',
          email: 'admin@platform.com',
          name: 'Platform Administrator',
          role: 'super_admin',
          status: 'active',
          tenantId: null,
          createdAt: new Date().toISOString(),
          isSuperAdmin: true,
          isSuperAdminMode: false,
          impersonatedAsUserId: undefined,
          impersonationLogId: undefined,
        },
        token: 'Bearer eyJhbGc...',
        expires_in: 3600,
      };

      expect(authResponse.user.isSuperAdmin).toBe(true);
      expect(authResponse.token).toMatch(/^Bearer/);
      expect(authResponse.expires_in).toBeGreaterThan(0);
    });

    it('should compile AuthResponse with regular user', () => {
      // ✅ Auth response with regular user
      const authResponse: AuthResponse = {
        user: {
          id: 'user-1',
          email: 'user@company.com',
          name: 'John Doe',
          role: 'manager',
          status: 'active',
          tenantId: 'company-123',
          createdAt: new Date().toISOString(),
          isSuperAdmin: false,
        },
        token: 'Bearer eyJhbGc...',
        expires_in: 3600,
      };

      expect(authResponse.user.isSuperAdmin).toBe(false);
      expect(authResponse.user.tenantId).toBe('company-123');
    });
  });

  describe('Type Compatibility Checks', () => {
    it('should allow optional super admin fields', () => {
      // ✅ Some fields can be optional
      const userWithPartialFields: User = {
        id: 'user-1',
        email: 'user@company.com',
        name: 'John Doe',
        role: 'agent',
        status: 'active',
        tenantId: 'company-123',
        createdAt: new Date().toISOString(),
        isSuperAdmin: false,
        // Don't set isSuperAdminMode, impersonatedAsUserId, impersonationLogId
      };

      expect(userWithPartialFields.isSuperAdmin).toBe(false);
      expect(userWithPartialFields.isSuperAdminMode).toBeUndefined();
    });

    it('should enforce tenantId can be null OR string', () => {
      // ✅ tenantId type allows both null and string

      // Super admin with null tenantId
      const superAdmin: User = {
        id: 'super_admin_1',
        email: 'admin@platform.com',
        name: 'Platform Administrator',
        role: 'super_admin',
        status: 'active',
        tenantId: null, // ✅ Allowed
        createdAt: new Date().toISOString(),
        isSuperAdmin: true,
      };
      expect(superAdmin.tenantId).toBeNull();

      // Regular user with string tenantId
      const regularUser: User = {
        id: 'user-1',
        email: 'user@company.com',
        name: 'John Doe',
        role: 'manager',
        status: 'active',
        tenantId: 'company-123', // ✅ Allowed
        createdAt: new Date().toISOString(),
        isSuperAdmin: false,
      };
      expect(regularUser.tenantId).toBe('company-123');
    });
  });

  describe('Role-Based Validation', () => {
    it('should validate super_admin role with isSuperAdmin=true', () => {
      // ✅ Consistency check: super_admin role should have isSuperAdmin=true
      const superAdmin: User = {
        id: 'super_admin_1',
        email: 'admin@platform.com',
        name: 'Platform Administrator',
        role: 'super_admin',
        status: 'active',
        tenantId: null,
        createdAt: new Date().toISOString(),
        isSuperAdmin: true, // ← Must match role
      };

      expect(superAdmin.role).toBe('super_admin');
      expect(superAdmin.isSuperAdmin).toBe(true);
    });

    it('should validate regular roles with isSuperAdmin=false', () => {
      // ✅ Consistency check: regular roles should have isSuperAdmin=false
      const roles: Array<User['role']> = ['admin', 'manager', 'agent', 'engineer', 'customer'];

      roles.forEach(role => {
        const user: User = {
          id: `user-${role}`,
          email: `user+${role}@company.com`,
          name: `User ${role}`,
          role,
          status: 'active',
          tenantId: 'company-123',
          createdAt: new Date().toISOString(),
          isSuperAdmin: false, // ← Must be false for non-super roles
        };

        expect(user.role).toBe(role);
        expect(user.isSuperAdmin).toBe(false);
      });
    });
  });

  describe('Acceptance Criteria', () => {
    it('should compile without errors as per acceptance criteria', () => {
      // This is the exact example from the acceptance criteria in the task
      const superAdmin: User = {
        id: 'super-1',
        isSuperAdmin: true,
        impersonatedAsUserId: undefined,
        // ... other fields
        email: 'admin@platform.com',
        name: 'Admin',
        role: 'super_admin',
        status: 'active',
        tenantId: null,
        createdAt: new Date().toISOString(),
      };

      expect(superAdmin).toBeDefined();
      expect(superAdmin.isSuperAdmin).toBe(true);
      expect(superAdmin.impersonatedAsUserId).toBeUndefined();
    });
  });
});
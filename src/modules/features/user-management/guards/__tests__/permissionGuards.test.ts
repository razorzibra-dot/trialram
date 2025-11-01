/**
 * Permission Guards Tests
 * Validates RBAC permission system for user management
 */

import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissionGuard,
  assertPermission,
  getRolePermissions,
  canPerformUserAction,
  UserPermission,
  ROLE_PERMISSIONS,
} from '../permissionGuards';

describe('Permission Guards', () => {
  // ====== hasPermission Tests ======
  describe('hasPermission', () => {
    it('should return true when super-admin has permission', () => {
      expect(hasPermission('super-admin', UserPermission.USER_CREATE)).toBe(true);
    });

    it('should return true when admin has permission', () => {
      expect(hasPermission('admin', UserPermission.USER_EDIT)).toBe(true);
    });

    it('should return false when user does not have permission', () => {
      expect(hasPermission('user', UserPermission.USER_CREATE)).toBe(false);
    });

    it('should return false when guest has permission', () => {
      expect(hasPermission('guest', UserPermission.USER_LIST)).toBe(false);
    });

    it('should handle all user permissions for super-admin', () => {
      const allPermissions = Object.values(UserPermission);
      const hasAll = allPermissions.every(perm =>
        hasPermission('super-admin', perm)
      );
      expect(hasAll).toBe(true);
    });
  });

  // ====== hasAnyPermission Tests ======
  describe('hasAnyPermission', () => {
    it('should return true if user has any permission', () => {
      const permissions = [
        UserPermission.USER_CREATE,
        UserPermission.USER_DELETE,
        UserPermission.ROLE_MANAGE,
      ];
      expect(hasAnyPermission('admin', permissions)).toBe(true);
    });

    it('should return false if user has no permissions', () => {
      const permissions = [
        UserPermission.PERMISSION_MANAGE,
        UserPermission.ROLE_MANAGE,
      ];
      expect(hasAnyPermission('user', permissions)).toBe(false);
    });

    it('should return true if user has at least one permission', () => {
      const permissions = [
        UserPermission.USER_DELETE, // admin doesn't have this
        UserPermission.USER_EDIT, // admin has this
      ];
      expect(hasAnyPermission('admin', permissions)).toBe(true);
    });
  });

  // ====== hasAllPermissions Tests ======
  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      const permissions = [
        UserPermission.USER_CREATE,
        UserPermission.USER_EDIT,
      ];
      expect(hasAllPermissions('admin', permissions)).toBe(true);
    });

    it('should return false if user missing one permission', () => {
      const permissions = [
        UserPermission.USER_CREATE,
        UserPermission.PERMISSION_MANAGE, // admin doesn't have this
      ];
      expect(hasAllPermissions('admin', permissions)).toBe(false);
    });

    it('should return true for super-admin with any permissions', () => {
      const permissions = [
        UserPermission.USER_CREATE,
        UserPermission.ROLE_MANAGE,
        UserPermission.PERMISSION_MANAGE,
      ];
      expect(hasAllPermissions('super-admin', permissions)).toBe(true);
    });
  });

  // ====== getPermissionGuard Tests ======
  describe('getPermissionGuard', () => {
    it('should return correct guard for super-admin', () => {
      const guard = getPermissionGuard('super-admin');
      expect(guard.canCreate).toBe(true);
      expect(guard.canEdit).toBe(true);
      expect(guard.canDelete).toBe(true);
      expect(guard.canManageRoles).toBe(true);
      expect(guard.canResetPassword).toBe(true);
      expect(guard.canViewList).toBe(true);
    });

    it('should return correct guard for admin', () => {
      const guard = getPermissionGuard('admin');
      expect(guard.canCreate).toBe(true);
      expect(guard.canEdit).toBe(true);
      expect(guard.canDelete).toBe(true);
      expect(guard.canManageRoles).toBe(true);
      expect(guard.canResetPassword).toBe(true);
    });

    it('should return correct guard for manager', () => {
      const guard = getPermissionGuard('manager');
      expect(guard.canCreate).toBe(false);
      expect(guard.canEdit).toBe(true);
      expect(guard.canDelete).toBe(false);
      expect(guard.canManageRoles).toBe(false);
    });

    it('should return correct guard for user', () => {
      const guard = getPermissionGuard('user');
      expect(guard.canCreate).toBe(false);
      expect(guard.canEdit).toBe(false);
      expect(guard.canDelete).toBe(false);
      expect(guard.canViewList).toBe(false);
    });

    it('should return correct guard for guest', () => {
      const guard = getPermissionGuard('guest');
      expect(guard.hasPermission).toBe(false);
    });
  });

  // ====== assertPermission Tests ======
  describe('assertPermission', () => {
    it('should not throw when user has permission', () => {
      expect(() =>
        assertPermission('admin', UserPermission.USER_CREATE)
      ).not.toThrow();
    });

    it('should throw when user does not have permission', () => {
      expect(() =>
        assertPermission('user', UserPermission.USER_CREATE)
      ).toThrow(/Permission denied/);
    });

    it('should throw with meaningful message', () => {
      expect(() =>
        assertPermission('guest', UserPermission.USER_LIST)
      ).toThrow(/user:list/);
    });
  });

  // ====== getRolePermissions Tests ======
  describe('getRolePermissions', () => {
    it('should return all permissions for super-admin', () => {
      const perms = getRolePermissions('super-admin');
      expect(perms.length).toBeGreaterThan(0);
      expect(perms).toContain(UserPermission.USER_CREATE);
      expect(perms).toContain(UserPermission.PERMISSION_MANAGE);
    });

    it('should return limited permissions for user', () => {
      const perms = getRolePermissions('user');
      expect(perms.length).toBeLessThan(
        getRolePermissions('super-admin').length
      );
    });

    it('should return empty array for unknown role', () => {
      const perms = getRolePermissions('unknown' as any);
      expect(perms).toEqual([]);
    });
  });

  // ====== canPerformUserAction Tests ======
  describe('canPerformUserAction', () => {
    // Super-admin tests
    it('should allow super-admin to create users', () => {
      expect(
        canPerformUserAction(
          'super-admin',
          'tenant-1',
          'user',
          'tenant-1',
          'create'
        )
      ).toBe(true);
    });

    it('should allow super-admin to edit users across tenants', () => {
      expect(
        canPerformUserAction(
          'super-admin',
          'tenant-1',
          'user',
          'tenant-2',
          'edit'
        )
      ).toBe(true);
    });

    it('should allow super-admin to delete users', () => {
      expect(
        canPerformUserAction(
          'super-admin',
          'tenant-1',
          'admin',
          'tenant-1',
          'delete'
        )
      ).toBe(true);
    });

    // Admin tests
    it('should allow admin to create users in own tenant', () => {
      expect(
        canPerformUserAction(
          'admin',
          'tenant-1',
          'user',
          'tenant-1',
          'create'
        )
      ).toBe(true);
    });

    it('should deny admin from creating users in different tenant', () => {
      expect(
        canPerformUserAction(
          'admin',
          'tenant-1',
          'user',
          'tenant-2',
          'create'
        )
      ).toBe(false);
    });

    it('should deny admin from deleting other admin', () => {
      expect(
        canPerformUserAction(
          'admin',
          'tenant-1',
          'admin',
          'tenant-1',
          'delete'
        )
      ).toBe(false);
    });

    it('should allow admin to delete regular users', () => {
      expect(
        canPerformUserAction(
          'admin',
          'tenant-1',
          'user',
          'tenant-1',
          'delete'
        )
      ).toBe(true);
    });

    // Manager tests
    it('should allow manager to edit users', () => {
      expect(
        canPerformUserAction(
          'manager',
          'tenant-1',
          'user',
          'tenant-1',
          'edit'
        )
      ).toBe(true);
    });

    it('should deny manager from creating users', () => {
      expect(
        canPerformUserAction(
          'manager',
          'tenant-1',
          'user',
          'tenant-1',
          'create'
        )
      ).toBe(false);
    });

    it('should deny manager from deleting users', () => {
      expect(
        canPerformUserAction(
          'manager',
          'tenant-1',
          'user',
          'tenant-1',
          'delete'
        )
      ).toBe(false);
    });

    it('should allow manager to reset password', () => {
      expect(
        canPerformUserAction(
          'manager',
          'tenant-1',
          'user',
          'tenant-1',
          'reset_password'
        )
      ).toBe(true);
    });

    // Regular user tests
    it('should deny user from any user action', () => {
      expect(
        canPerformUserAction(
          'user',
          'tenant-1',
          'user',
          'tenant-1',
          'create'
        )
      ).toBe(false);
    });
  });

  // ====== Permission Hierarchy Tests ======
  describe('Permission Hierarchy', () => {
    it('should have super-admin with most permissions', () => {
      const superAdminPerms = getRolePermissions('super-admin');
      const adminPerms = getRolePermissions('admin');
      expect(superAdminPerms.length).toBeGreaterThanOrEqual(
        adminPerms.length
      );
    });

    it('should have admin with more permissions than manager', () => {
      const adminPerms = getRolePermissions('admin');
      const managerPerms = getRolePermissions('manager');
      expect(adminPerms.length).toBeGreaterThan(managerPerms.length);
    });

    it('should have manager with more permissions than user', () => {
      const managerPerms = getRolePermissions('manager');
      const userPerms = getRolePermissions('user');
      expect(managerPerms.length).toBeGreaterThan(userPerms.length);
    });

    it('should have guest with no permissions', () => {
      const guestPerms = getRolePermissions('guest');
      expect(guestPerms.length).toBe(0);
    });
  });

  // ====== Permission Consistency Tests ======
  describe('Permission Consistency', () => {
    it('should have all roles defined in ROLE_PERMISSIONS', () => {
      expect(ROLE_PERMISSIONS).toHaveProperty('super-admin');
      expect(ROLE_PERMISSIONS).toHaveProperty('admin');
      expect(ROLE_PERMISSIONS).toHaveProperty('manager');
      expect(ROLE_PERMISSIONS).toHaveProperty('user');
      expect(ROLE_PERMISSIONS).toHaveProperty('guest');
    });

    it('should have valid permission strings', () => {
      Object.values(ROLE_PERMISSIONS).forEach(perms => {
        perms.forEach(perm => {
          expect(typeof perm).toBe('string');
          expect(perm.includes(':')).toBe(true); // All perms should have format: resource:action
        });
      });
    });
  });
});
/**
 * Mock User Service Tests
 * Comprehensive test suite for mock user service validation and functionality
 * 
 * Coverage:
 * - Field validation (required, format, length)
 * - CRUD operations
 * - Error handling
 * - Data transformation
 */

import { userService } from '../userService';
import { UserDTO, CreateUserDTO, UpdateUserDTO } from '@/types/dtos/userDtos';

describe('Mock User Service', () => {
  describe('getUsers', () => {
    it('should return all users', async () => {
      const users = await userService.getUsers();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    });

    it('should return UserDTO objects with correct structure', async () => {
      const users = await userService.getUsers();
      const user = users[0];
      
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('status');
      expect(user).toHaveProperty('tenantId');
      expect(user).toHaveProperty('createdAt');
    });

    it('should filter users by status', async () => {
      const users = await userService.getUsers({ status: ['active'] });
      expect(users.every(u => u.status === 'active')).toBe(true);
    });

    it('should filter users by role', async () => {
      const users = await userService.getUsers({ role: ['admin'] });
      expect(users.every(u => u.role === 'admin')).toBe(true);
    });

    it('should search users by name', async () => {
      const users = await userService.getUsers({ search: 'admin' });
      expect(users.length).toBeGreaterThan(0);
      expect(users.some(u => 
        u.name.toLowerCase().includes('admin') ||
        u.email.toLowerCase().includes('admin')
      )).toBe(true);
    });
  });

  describe('getUser', () => {
    it('should return a single user by ID', async () => {
      const users = await userService.getUsers();
      const user = await userService.getUser(users[0].id);
      expect(user.id).toBe(users[0].id);
    });

    it('should throw error for non-existent user', async () => {
      await expect(userService.getUser('non-existent-id')).rejects.toThrow();
    });
  });

  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      const userData: CreateUserDTO = {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
        phone: '+1-555-0100',
        position: 'Test Agent',
      };

      const user = await userService.createUser(userData);
      
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.role).toBe(userData.role);
      expect(user.status).toBe(userData.status);
      expect(user.createdAt).toBeDefined();
    });

    it('should throw error when email is missing', async () => {
      const userData: any = {
        name: 'Test User',
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
      };

      await expect(userService.createUser(userData)).rejects.toThrow('Email is required');
    });

    it('should throw error when name is missing', async () => {
      const userData: any = {
        email: 'test@example.com',
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
      };

      await expect(userService.createUser(userData)).rejects.toThrow('Name is required');
    });

    it('should throw error when role is missing', async () => {
      const userData: any = {
        email: 'test@example.com',
        name: 'Test User',
        status: 'active',
        tenantId: 'tenant_1',
      };

      await expect(userService.createUser(userData)).rejects.toThrow('Role is required');
    });

    it('should throw error when status is missing', async () => {
      const userData: any = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'agent',
        tenantId: 'tenant_1',
      };

      await expect(userService.createUser(userData)).rejects.toThrow('Status is required');
    });

    it('should throw error when tenantId is missing', async () => {
      const userData: any = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'agent',
        status: 'active',
      };

      await expect(userService.createUser(userData)).rejects.toThrow('Tenant ID is required');
    });

    it('should throw error for invalid email format', async () => {
      const userData: CreateUserDTO = {
        email: 'invalid-email',
        name: 'Test User',
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
      };

      await expect(userService.createUser(userData)).rejects.toThrow('Invalid email format');
    });

    it('should throw error for duplicate email', async () => {
      const userData: CreateUserDTO = {
        email: 'admin@company.com', // Already exists in mock data
        name: 'Test User',
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
      };

      await expect(userService.createUser(userData)).rejects.toThrow('Email already exists');
    });

    it('should throw error for name exceeding max length', async () => {
      const userData: CreateUserDTO = {
        email: `test-${Date.now()}@example.com`,
        name: 'x'.repeat(256),
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
      };

      await expect(userService.createUser(userData)).rejects.toThrow('Name cannot exceed 255 characters');
    });

    it('should throw error for firstName exceeding max length', async () => {
      const userData: CreateUserDTO = {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        firstName: 'x'.repeat(101),
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
      };

      await expect(userService.createUser(userData)).rejects.toThrow('First name cannot exceed 100 characters');
    });

    it('should throw error for phone exceeding max length', async () => {
      const userData: CreateUserDTO = {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        phone: 'x'.repeat(51),
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
      };

      await expect(userService.createUser(userData)).rejects.toThrow('Phone cannot exceed 50 characters');
    });

    it('should throw error for invalid role', async () => {
      const userData: any = {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        role: 'invalid-role',
        status: 'active',
        tenantId: 'tenant_1',
      };

      await expect(userService.createUser(userData)).rejects.toThrow(/Invalid role/);
    });

    it('should throw error for invalid status', async () => {
      const userData: any = {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        role: 'agent',
        status: 'invalid-status',
        tenantId: 'tenant_1',
      };

      await expect(userService.createUser(userData)).rejects.toThrow(/Invalid status/);
    });
  });

  describe('updateUser', () => {
    it('should update user with valid data', async () => {
      const users = await userService.getUsers();
      const userId = users[0].id;
      
      const updateData: UpdateUserDTO = {
        position: 'Updated Position',
      };

      const updated = await userService.updateUser(userId, updateData);
      expect(updated.position).toBe('Updated Position');
      expect(updated.id).toBe(userId);
    });

    it('should throw error when user not found', async () => {
      const updateData: UpdateUserDTO = {
        name: 'Updated Name',
      };

      await expect(userService.updateUser('non-existent-id', updateData)).rejects.toThrow();
    });

    it('should throw error for invalid email format', async () => {
      const users = await userService.getUsers();
      const userId = users[0].id;

      await expect(
        userService.updateUser(userId, { email: 'invalid-email' })
      ).rejects.toThrow('Invalid email format');
    });

    it('should throw error for duplicate email on update', async () => {
      const users = await userService.getUsers();
      const userId = users[1].id;
      const existingEmail = users[0].email;

      await expect(
        userService.updateUser(userId, { email: existingEmail })
      ).rejects.toThrow('Email already exists');
    });

    it('should throw error for name exceeding max length', async () => {
      const users = await userService.getUsers();
      const userId = users[0].id;

      await expect(
        userService.updateUser(userId, { name: 'x'.repeat(256) })
      ).rejects.toThrow('Name cannot exceed 255 characters');
    });

    it('should throw error for invalid role', async () => {
      const users = await userService.getUsers();
      const userId = users[0].id;

      await expect(
        userService.updateUser(userId, { role: 'invalid-role' as any })
      ).rejects.toThrow(/Invalid role/);
    });

    it('should throw error for invalid status', async () => {
      const users = await userService.getUsers();
      const userId = users[0].id;

      await expect(
        userService.updateUser(userId, { status: 'invalid-status' as any })
      ).rejects.toThrow(/Invalid status/);
    });
  });

  describe('deleteUser', () => {
    it('should delete an existing user', async () => {
      // Create a user first
      const userData: CreateUserDTO = {
        email: `test-delete-${Date.now()}@example.com`,
        name: 'Test Delete User',
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
      };

      const created = await userService.createUser(userData);
      
      // Delete the user
      await userService.deleteUser(created.id);
      
      // Try to fetch it (should fail)
      await expect(userService.getUser(created.id)).rejects.toThrow();
    });

    it('should throw error when deleting non-existent user', async () => {
      await expect(userService.deleteUser('non-existent-id')).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should reset password for existing user', async () => {
      const users = await userService.getUsers();
      
      // Should not throw
      await expect(userService.resetPassword(users[0].id)).resolves.not.toThrow();
    });

    it('should throw error when user not found', async () => {
      await expect(userService.resetPassword('non-existent-id')).rejects.toThrow();
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const stats = await userService.getUserStats();
      
      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('activeUsers');
      expect(stats).toHaveProperty('inactiveUsers');
      expect(stats).toHaveProperty('suspendedUsers');
      expect(stats).toHaveProperty('usersByRole');
      expect(stats).toHaveProperty('newUsersLast30Days');
      
      expect(typeof stats.totalUsers).toBe('number');
      expect(stats.totalUsers).toBeGreaterThanOrEqual(0);
    });

    it('should have valid role counts', async () => {
      const stats = await userService.getUserStats();
      
      expect(stats.usersByRole).toHaveProperty('super_admin');
      expect(stats.usersByRole).toHaveProperty('admin');
      expect(stats.usersByRole).toHaveProperty('manager');
      expect(stats.usersByRole).toHaveProperty('agent');
      expect(stats.usersByRole).toHaveProperty('engineer');
      expect(stats.usersByRole).toHaveProperty('customer');
    });
  });

  describe('getRoles', () => {
    it('should return available roles', async () => {
      const roles = await userService.getRoles();
      
      expect(Array.isArray(roles)).toBe(true);
      expect(roles).toContain('super_admin');
      expect(roles).toContain('admin');
      expect(roles).toContain('manager');
      expect(roles).toContain('agent');
      expect(roles).toContain('engineer');
      expect(roles).toContain('customer');
    });
  });

  describe('getStatuses', () => {
    it('should return available statuses', async () => {
      const statuses = await userService.getStatuses();
      
      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses).toContain('active');
      expect(statuses).toContain('inactive');
      expect(statuses).toContain('suspended');
    });
  });

  describe('getUserActivity', () => {
    it('should return activity logs for a user', async () => {
      const users = await userService.getUsers();
      const activity = await userService.getUserActivity(users[0].id);
      
      expect(Array.isArray(activity)).toBe(true);
    });
  });

  describe('logActivity', () => {
    it('should log user activity', async () => {
      const users = await userService.getUsers();
      const activityLog = await userService.logActivity({
        userId: users[0].id,
        action: 'login',
        resource: 'auth',
        details: { method: 'password' },
        timestamp: new Date().toISOString(),
      });

      expect(activityLog.id).toBeDefined();
      expect(activityLog.userId).toBe(users[0].id);
      expect(activityLog.action).toBe('login');
    });
  });

  describe('getTenants', () => {
    it('should return available tenants', async () => {
      const tenants = await userService.getTenants();
      
      expect(Array.isArray(tenants)).toBe(true);
      expect(tenants.length).toBeGreaterThan(0);
    });

    it('should have valid tenant structure', async () => {
      const tenants = await userService.getTenants();
      
      if (tenants.length > 0) {
        const tenant = tenants[0];
        expect(tenant).toHaveProperty('id');
        expect(tenant).toHaveProperty('name');
        expect(tenant).toHaveProperty('status');
      }
    });
  });
});
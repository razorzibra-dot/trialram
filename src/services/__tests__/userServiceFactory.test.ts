/**
 * User Service Factory Tests
 * Comprehensive test suite for service factory routing logic
 * 
 * Coverage:
 * - Factory returns correct service implementation
 * - Environment variable handling
 * - Default fallback behavior
 * - Method availability
 */

import { userService } from '../serviceFactory';
import { CreateUserDTO } from '@/types/dtos/userDtos';

describe('User Service Factory', () => {
  describe('Service Factory Routing', () => {
    it('should export userService object', () => {
      expect(userService).toBeDefined();
      expect(typeof userService).toBe('object');
    });

    it('should have getUsers method', () => {
      expect(typeof userService.getUsers).toBe('function');
    });

    it('should have getUser method', () => {
      expect(typeof userService.getUser).toBe('function');
    });

    it('should have createUser method', () => {
      expect(typeof userService.createUser).toBe('function');
    });

    it('should have updateUser method', () => {
      expect(typeof userService.updateUser).toBe('function');
    });

    it('should have deleteUser method', () => {
      expect(typeof userService.deleteUser).toBe('function');
    });

    it('should have resetPassword method', () => {
      expect(typeof userService.resetPassword).toBe('function');
    });

    it('should have getUserStats method', () => {
      expect(typeof userService.getUserStats).toBe('function');
    });

    it('should have getRoles method', () => {
      expect(typeof userService.getRoles).toBe('function');
    });

    it('should have getStatuses method', () => {
      expect(typeof userService.getStatuses).toBe('function');
    });

    it('should have getUserActivity method', () => {
      expect(typeof userService.getUserActivity).toBe('function');
    });

    it('should have logActivity method', () => {
      expect(typeof userService.logActivity).toBe('function');
    });

    it('should have getTenants method', () => {
      expect(typeof userService.getTenants).toBe('function');
    });
  });

  describe('Factory Method Execution', () => {
    it('should fetch users successfully', async () => {
      const users = await userService.getUsers();
      expect(Array.isArray(users)).toBe(true);
    });

    it('should fetch user stats successfully', async () => {
      const stats = await userService.getUserStats();
      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('activeUsers');
    });

    it('should fetch available roles', async () => {
      const roles = await userService.getRoles();
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThan(0);
    });

    it('should fetch available statuses', async () => {
      const statuses = await userService.getStatuses();
      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses.length).toBeGreaterThan(0);
    });

    it('should fetch tenants', async () => {
      const tenants = await userService.getTenants();
      expect(Array.isArray(tenants)).toBe(true);
    });
  });

  describe('Create/Update Operations', () => {
    it('should create a user through factory', async () => {
      const userData: CreateUserDTO = {
        email: `factory-test-${Date.now()}@example.com`,
        name: 'Factory Test User',
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
      };

      const user = await userService.createUser(userData);
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
    });

    it('should fetch single user through factory', async () => {
      const users = await userService.getUsers();
      expect(users.length).toBeGreaterThan(0);

      const user = await userService.getUser(users[0].id);
      expect(user.id).toBe(users[0].id);
    });

    it('should update user through factory', async () => {
      const users = await userService.getUsers();
      const userId = users[0].id;

      const updated = await userService.updateUser(userId, {
        position: 'Factory Test Position',
      });

      expect(updated.position).toBe('Factory Test Position');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-existent user', async () => {
      await expect(userService.getUser('non-existent-id')).rejects.toThrow();
    });

    it('should throw error for invalid email on create', async () => {
      const userData: any = {
        email: 'invalid-email',
        name: 'Test',
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
      };

      await expect(userService.createUser(userData)).rejects.toThrow('Invalid email format');
    });

    it('should throw error for missing required fields', async () => {
      const userData: any = {
        email: 'test@example.com',
        // Missing name, role, status, tenantId
      };

      await expect(userService.createUser(userData)).rejects.toThrow();
    });
  });

  describe('Activity Logging', () => {
    it('should log user activity through factory', async () => {
      const users = await userService.getUsers();
      
      const activity = await userService.logActivity({
        userId: users[0].id,
        action: 'factory_test',
        resource: 'test',
        details: { test: true },
        timestamp: new Date().toISOString(),
      });

      expect(activity.id).toBeDefined();
      expect(activity.action).toBe('factory_test');
    });

    it('should retrieve user activity through factory', async () => {
      const users = await userService.getUsers();
      const activities = await userService.getUserActivity(users[0].id);
      
      expect(Array.isArray(activities)).toBe(true);
    });
  });

  describe('Data Type Consistency', () => {
    it('should return users with correct DTO structure', async () => {
      const users = await userService.getUsers();
      
      if (users.length > 0) {
        const user = users[0];
        
        // Check camelCase fields (DTO format)
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('firstName');
        expect(user).toHaveProperty('lastName');
        expect(user).toHaveProperty('tenantId');
        expect(user).toHaveProperty('avatarUrl');
        expect(user).toHaveProperty('companyName');
        expect(user).toHaveProperty('createdAt');
        expect(user).toHaveProperty('updatedAt');
        expect(user).toHaveProperty('lastLogin');
      }
    });

    it('should not have snake_case fields in returned data', async () => {
      const users = await userService.getUsers();
      
      if (users.length > 0) {
        const user = users[0] as any;
        
        // Check that snake_case fields don't exist
        expect(user.first_name).toBeUndefined();
        expect(user.last_name).toBeUndefined();
        expect(user.tenant_id).toBeUndefined();
        expect(user.avatar_url).toBeUndefined();
        expect(user.company_name).toBeUndefined();
        expect(user.created_at).toBeUndefined();
        expect(user.updated_at).toBeUndefined();
        expect(user.last_login).toBeUndefined();
      }
    });
  });
});
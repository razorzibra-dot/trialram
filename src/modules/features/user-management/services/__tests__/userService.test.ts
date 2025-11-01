/**
 * User Management Module Service Tests
 * Tests factory delegation, error handling, and return types
 * Ensures all 12+ methods properly delegate to backend service
 */

import { userService } from '../userService';
import * as serviceFactory from '@/services/serviceFactory';
import {
  UserDTO,
  UserStatsDTO,
  CreateUserDTO,
  UpdateUserDTO,
  UserActivityDTO,
} from '@/types/dtos/userDtos';

// Mock the service factory
jest.mock('@/services/serviceFactory');

describe('User Management Module Service', () => {
  const mockGetUserService = serviceFactory.getUserService as jest.MockedFunction<
    typeof serviceFactory.getUserService
  >;

  const mockBackendService = {
    getUsers: jest.fn(),
    getUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    resetPassword: jest.fn(),
    getUserStats: jest.fn(),
    getRoles: jest.fn(),
    getStatuses: jest.fn(),
    getUserActivity: jest.fn(),
    logActivity: jest.fn(),
    getTenants: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserService.mockReturnValue(mockBackendService);
  });

  // ========================================================================
  // Factory Delegation Tests
  // ========================================================================

  describe('Factory Delegation', () => {
    it('should call getUserService() for each method', async () => {
      mockBackendService.getUsers.mockResolvedValue([]);

      await userService.getUsers();

      expect(mockGetUserService).toHaveBeenCalled();
      expect(mockBackendService.getUsers).toHaveBeenCalled();
    });

    it('should delegate to factory service without modification', async () => {
      const filters = { status: 'active' };
      mockBackendService.getUsers.mockResolvedValue([]);

      await userService.getUsers(filters);

      expect(mockBackendService.getUsers).toHaveBeenCalledWith(filters);
    });
  });

  // ========================================================================
  // getUsers() Tests
  // ========================================================================

  describe('getUsers()', () => {
    it('should return list of users', async () => {
      const mockUsers: UserDTO[] = [
        {
          id: '1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'admin',
          status: 'active',
          tenantId: 'tenant_1',
          tenantName: 'Company A',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          email: 'user2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'manager',
          status: 'active',
          tenantId: 'tenant_1',
          tenantName: 'Company A',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      mockBackendService.getUsers.mockResolvedValue(mockUsers);

      const result = await userService.getUsers();

      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
    });

    it('should support filtering by status', async () => {
      const activeUsers: UserDTO[] = [
        {
          id: '1',
          email: 'active@example.com',
          firstName: 'Active',
          lastName: 'User',
          role: 'agent',
          status: 'active',
          tenantId: 'tenant_1',
          tenantName: 'Company A',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      mockBackendService.getUsers.mockResolvedValue(activeUsers);

      const result = await userService.getUsers({ status: 'active' });

      expect(result).toEqual(activeUsers);
      expect(mockBackendService.getUsers).toHaveBeenCalledWith({ status: 'active' });
    });

    it('should return empty array when no users', async () => {
      mockBackendService.getUsers.mockResolvedValue([]);

      const result = await userService.getUsers();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should propagate errors from backend', async () => {
      const error = new Error('Database connection failed');
      mockBackendService.getUsers.mockRejectedValue(error);

      await expect(userService.getUsers()).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  // ========================================================================
  // getUser() Tests
  // ========================================================================

  describe('getUser()', () => {
    it('should return single user by ID', async () => {
      const mockUser: UserDTO = {
        id: '1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'admin',
        status: 'active',
        tenantId: 'tenant_1',
        tenantName: 'Company A',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockBackendService.getUser.mockResolvedValue(mockUser);

      const result = await userService.getUser('1');

      expect(result).toEqual(mockUser);
      expect(mockBackendService.getUser).toHaveBeenCalledWith('1');
    });

    it('should propagate not found error', async () => {
      const error = new Error('User not found');
      mockBackendService.getUser.mockRejectedValue(error);

      await expect(userService.getUser('invalid-id')).rejects.toThrow(
        'User not found'
      );
    });

    it('should return user with all fields populated', async () => {
      const mockUser: UserDTO = {
        id: '1',
        email: 'full@example.com',
        firstName: 'Full',
        lastName: 'User',
        role: 'manager',
        status: 'active',
        tenantId: 'tenant_1',
        tenantName: 'Company A',
        phone: '555-1234',
        mobile: '555-5678',
        department: 'Sales',
        position: 'Senior Manager',
        companyName: 'ABC Corp',
        avatarUrl: 'https://example.com/avatar.jpg',
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockBackendService.getUser.mockResolvedValue(mockUser);

      const result = await userService.getUser('1');

      expect(result.email).toBe('full@example.com');
      expect(result.phone).toBe('555-1234');
      expect(result.department).toBe('Sales');
    });
  });

  // ========================================================================
  // createUser() Tests
  // ========================================================================

  describe('createUser()', () => {
    it('should create and return new user', async () => {
      const createData: CreateUserDTO = {
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
      };

      const createdUser: UserDTO = {
        id: 'new-id-123',
        ...createData,
        tenantName: 'Company A',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockBackendService.createUser.mockResolvedValue(createdUser);

      const result = await userService.createUser(createData);

      expect(result).toEqual(createdUser);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(mockBackendService.createUser).toHaveBeenCalledWith(createData);
    });

    it('should propagate validation errors', async () => {
      const invalidData: CreateUserDTO = {
        email: 'invalid-email',
        firstName: 'Invalid',
        lastName: 'User',
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
      };

      const error = new Error('Invalid email format');
      mockBackendService.createUser.mockRejectedValue(error);

      await expect(userService.createUser(invalidData)).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should propagate duplicate email error', async () => {
      const createData: CreateUserDTO = {
        email: 'existing@example.com',
        firstName: 'Duplicate',
        lastName: 'User',
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
      };

      const error = new Error('Email already exists');
      mockBackendService.createUser.mockRejectedValue(error);

      await expect(userService.createUser(createData)).rejects.toThrow(
        'Email already exists'
      );
    });

    it('should generate ID and timestamps for new user', async () => {
      const createData: CreateUserDTO = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
      };

      const now = new Date();
      const createdUser: UserDTO = {
        id: 'uuid-123',
        ...createData,
        tenantName: 'Tenant',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      mockBackendService.createUser.mockResolvedValue(createdUser);

      const result = await userService.createUser(createData);

      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });
  });

  // ========================================================================
  // updateUser() Tests
  // ========================================================================

  describe('updateUser()', () => {
    it('should update and return user', async () => {
      const updateData: UpdateUserDTO = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const updatedUser: UserDTO = {
        id: '1',
        email: 'user@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        role: 'admin',
        status: 'active',
        tenantId: 'tenant_1',
        tenantName: 'Company A',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockBackendService.updateUser.mockResolvedValue(updatedUser);

      const result = await userService.updateUser('1', updateData);

      expect(result).toEqual(updatedUser);
      expect(result.firstName).toBe('Updated');
      expect(mockBackendService.updateUser).toHaveBeenCalledWith('1', updateData);
    });

    it('should propagate not found error', async () => {
      const error = new Error('User not found');
      mockBackendService.updateUser.mockRejectedValue(error);

      await expect(
        userService.updateUser('invalid-id', { firstName: 'Test' })
      ).rejects.toThrow('User not found');
    });

    it('should validate email if being changed', async () => {
      const updateData: UpdateUserDTO = {
        email: 'invalid-email',
      };

      const error = new Error('Invalid email format');
      mockBackendService.updateUser.mockRejectedValue(error);

      await expect(userService.updateUser('1', updateData)).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should prevent duplicate email', async () => {
      const updateData: UpdateUserDTO = {
        email: 'existing@example.com',
      };

      const error = new Error('Email already exists');
      mockBackendService.updateUser.mockRejectedValue(error);

      await expect(userService.updateUser('1', updateData)).rejects.toThrow(
        'Email already exists'
      );
    });

    it('should update timestamp on change', async () => {
      const updateData: UpdateUserDTO = {
        department: 'New Department',
      };

      const now = new Date();
      const updatedUser: UserDTO = {
        id: '1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'admin',
        status: 'active',
        tenantId: 'tenant_1',
        tenantName: 'Company A',
        department: 'New Department',
        createdAt: new Date(now.getTime() - 86400000).toISOString(),
        updatedAt: now.toISOString(),
      };

      mockBackendService.updateUser.mockResolvedValue(updatedUser);

      const result = await userService.updateUser('1', updateData);

      expect(result.updatedAt).toBeDefined();
    });
  });

  // ========================================================================
  // deleteUser() Tests
  // ========================================================================

  describe('deleteUser()', () => {
    it('should delete user without error', async () => {
      mockBackendService.deleteUser.mockResolvedValue(undefined);

      await expect(userService.deleteUser('1')).resolves.toBeUndefined();
      expect(mockBackendService.deleteUser).toHaveBeenCalledWith('1');
    });

    it('should propagate not found error', async () => {
      const error = new Error('User not found');
      mockBackendService.deleteUser.mockRejectedValue(error);

      await expect(userService.deleteUser('invalid-id')).rejects.toThrow(
        'User not found'
      );
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockBackendService.deleteUser.mockRejectedValue(error);

      await expect(userService.deleteUser('1')).rejects.toThrow('Database error');
    });
  });

  // ========================================================================
  // resetPassword() Tests
  // ========================================================================

  describe('resetPassword()', () => {
    it('should reset password without error', async () => {
      mockBackendService.resetPassword.mockResolvedValue(undefined);

      await expect(userService.resetPassword('1')).resolves.toBeUndefined();
      expect(mockBackendService.resetPassword).toHaveBeenCalledWith('1');
    });

    it('should propagate user not found error', async () => {
      const error = new Error('User not found');
      mockBackendService.resetPassword.mockRejectedValue(error);

      await expect(userService.resetPassword('invalid-id')).rejects.toThrow(
        'User not found'
      );
    });
  });

  // ========================================================================
  // getUserStats() Tests
  // ========================================================================

  describe('getUserStats()', () => {
    it('should return user statistics', async () => {
      const mockStats: UserStatsDTO = {
        totalUsers: 50,
        activeUsers: 45,
        inactiveUsers: 3,
        suspendedUsers: 2,
        adminCount: 2,
        managerCount: 5,
        agentCount: 38,
        engineerCount: 5,
      };

      mockBackendService.getUserStats.mockResolvedValue(mockStats);

      const result = await userService.getUserStats();

      expect(result).toEqual(mockStats);
      expect(result.totalUsers).toBe(50);
      expect(result.activeUsers).toBe(45);
    });

    it('should propagate backend errors', async () => {
      const error = new Error('Cannot fetch statistics');
      mockBackendService.getUserStats.mockRejectedValue(error);

      await expect(userService.getUserStats()).rejects.toThrow(
        'Cannot fetch statistics'
      );
    });
  });

  // ========================================================================
  // getRoles() Tests
  // ========================================================================

  describe('getRoles()', () => {
    it('should return list of available roles', async () => {
      const mockRoles = ['super_admin', 'admin', 'manager', 'agent', 'engineer', 'customer'];
      mockBackendService.getRoles.mockResolvedValue(mockRoles);

      const result = await userService.getRoles();

      expect(result).toEqual(mockRoles);
      expect(result).toHaveLength(6);
    });

    it('should return array type', async () => {
      mockBackendService.getRoles.mockResolvedValue([]);

      const result = await userService.getRoles();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ========================================================================
  // getStatuses() Tests
  // ========================================================================

  describe('getStatuses()', () => {
    it('should return list of available statuses', async () => {
      const mockStatuses = ['active', 'inactive', 'suspended'];
      mockBackendService.getStatuses.mockResolvedValue(mockStatuses);

      const result = await userService.getStatuses();

      expect(result).toEqual(mockStatuses);
      expect(result).toHaveLength(3);
    });

    it('should return array type', async () => {
      mockBackendService.getStatuses.mockResolvedValue([]);

      const result = await userService.getStatuses();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ========================================================================
  // getUserActivity() Tests
  // ========================================================================

  describe('getUserActivity()', () => {
    it('should return activity log for user', async () => {
      const mockActivity: UserActivityDTO[] = [
        {
          id: 'act1',
          userId: 'user1',
          action: 'login',
          details: 'User logged in',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: 'act2',
          userId: 'user1',
          action: 'update_profile',
          details: 'Updated department',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];

      mockBackendService.getUserActivity.mockResolvedValue(mockActivity);

      const result = await userService.getUserActivity('user1');

      expect(result).toEqual(mockActivity);
      expect(result).toHaveLength(2);
      expect(mockBackendService.getUserActivity).toHaveBeenCalledWith('user1');
    });

    it('should return empty array if no activity', async () => {
      mockBackendService.getUserActivity.mockResolvedValue([]);

      const result = await userService.getUserActivity('user-no-activity');

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should propagate errors', async () => {
      const error = new Error('User not found');
      mockBackendService.getUserActivity.mockRejectedValue(error);

      await expect(userService.getUserActivity('invalid-id')).rejects.toThrow(
        'User not found'
      );
    });
  });

  // ========================================================================
  // logActivity() Tests
  // ========================================================================

  describe('logActivity()', () => {
    it('should log activity and return created record', async () => {
      const activityData = {
        userId: 'user1',
        action: 'login',
        details: 'User logged in',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date().toISOString(),
      };

      const createdActivity: UserActivityDTO = {
        id: 'act-123',
        ...activityData,
        createdAt: new Date().toISOString(),
      };

      mockBackendService.logActivity.mockResolvedValue(createdActivity);

      const result = await userService.logActivity(activityData);

      expect(result).toEqual(createdActivity);
      expect(result.id).toBeDefined();
      expect(mockBackendService.logActivity).toHaveBeenCalledWith(activityData);
    });

    it('should propagate errors', async () => {
      const activityData = {
        userId: 'user1',
        action: 'login',
        details: 'User logged in',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date().toISOString(),
      };

      const error = new Error('Failed to log activity');
      mockBackendService.logActivity.mockRejectedValue(error);

      await expect(userService.logActivity(activityData)).rejects.toThrow(
        'Failed to log activity'
      );
    });
  });

  // ========================================================================
  // getTenants() Tests
  // ========================================================================

  describe('getTenants()', () => {
    it('should return list of tenants', async () => {
      const mockTenants = [
        { id: 'tenant_1', name: 'Company A' },
        { id: 'tenant_2', name: 'Company B' },
      ];

      mockBackendService.getTenants.mockResolvedValue(mockTenants);

      const result = await userService.getTenants();

      expect(result).toEqual(mockTenants);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no tenants', async () => {
      mockBackendService.getTenants.mockResolvedValue([]);

      const result = await userService.getTenants();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should propagate errors', async () => {
      const error = new Error('Cannot fetch tenants');
      mockBackendService.getTenants.mockRejectedValue(error);

      await expect(userService.getTenants()).rejects.toThrow(
        'Cannot fetch tenants'
      );
    });
  });

  // ========================================================================
  // Error Handling & Type Safety
  // ========================================================================

  describe('Error Handling & Type Safety', () => {
    it('should preserve error messages from backend', async () => {
      const originalError = new Error('Original error message');
      mockBackendService.getUsers.mockRejectedValue(originalError);

      await expect(userService.getUsers()).rejects.toThrow('Original error message');
    });

    it('should maintain type consistency across methods', async () => {
      const mockUser: UserDTO = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
        tenantName: 'Company A',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockBackendService.getUser.mockResolvedValue(mockUser);

      const result = await userService.getUser('1');

      // Verify all required fields are present
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('firstName');
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('tenantId');
      expect(result).toHaveProperty('createdAt');
    });

    it('should not leak snake_case fields to module service', async () => {
      const mockUser: UserDTO = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
        tenantName: 'Company A',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockBackendService.getUser.mockResolvedValue(mockUser);

      const result = await userService.getUser('1');

      // Verify no snake_case fields exist
      expect(result).not.toHaveProperty('first_name');
      expect(result).not.toHaveProperty('last_name');
      expect(result).not.toHaveProperty('tenant_id');
      expect(result).not.toHaveProperty('created_at');
      expect(result).not.toHaveProperty('updated_at');
    });
  });
});
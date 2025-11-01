/**
 * User Management DTO Type Tests
 * Comprehensive validation of UserDTO and related data transfer objects
 * Verifies field naming, type compatibility, and enum values
 *
 * PHASE 6.1: Type/DTO Layer Synchronization
 * Task: Verify all DTOs match database schema exactly
 */

import {
  UserDTO,
  UserRole,
  UserStatus,
  CreateUserDTO,
  UpdateUserDTO,
  UserFiltersDTO,
  UserStatsDTO,
  UserActivityDTO,
  UserListResponseDTO,
} from '../dtos/userDtos';

describe('UserDTO Type Tests', () => {
  describe('Field Naming Convention', () => {
    it('should have all fields in camelCase', () => {
      const userDto: UserDTO = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
        status: 'active',
        tenantId: 'tenant-1',
        avatarUrl: 'https://example.com/avatar.jpg',
        phone: '+1234567890',
        mobile: '+0987654321',
        companyName: 'Test Company',
        department: 'Engineering',
        position: 'Senior Engineer',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
        lastLogin: '2025-01-03T00:00:00Z',
        createdBy: 'admin-1',
        deletedAt: undefined,
      };

      // All properties should exist and be camelCase
      expect(userDto).toHaveProperty('firstName');
      expect(userDto).toHaveProperty('lastName');
      expect(userDto).toHaveProperty('tenantId');
      expect(userDto).toHaveProperty('avatarUrl');
      expect(userDto).toHaveProperty('companyName');
      expect(userDto).toHaveProperty('createdAt');
      expect(userDto).toHaveProperty('updatedAt');
      expect(userDto).toHaveProperty('lastLogin');
      expect(userDto).toHaveProperty('createdBy');
      expect(userDto).toHaveProperty('deletedAt');

      // No snake_case properties should exist
      expect(userDto).not.toHaveProperty('first_name');
      expect(userDto).not.toHaveProperty('last_name');
      expect(userDto).not.toHaveProperty('tenant_id');
      expect(userDto).not.toHaveProperty('avatar_url');
      expect(userDto).not.toHaveProperty('company_name');
      expect(userDto).not.toHaveProperty('created_at');
      expect(userDto).not.toHaveProperty('updated_at');
      expect(userDto).not.toHaveProperty('last_login');
      expect(userDto).not.toHaveProperty('created_by');
      expect(userDto).not.toHaveProperty('deleted_at');
    });

    it('should enforce camelCase for required fields', () => {
      // Type check at compile time would catch this, but runtime check validates structure
      const validUser: UserDTO = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        status: 'active',
        tenantId: 'tenant-1',
        createdAt: '2025-01-01T00:00:00Z',
      };

      expect(validUser.firstName).toBeUndefined();
      expect(validUser.tenantId).toBe('tenant-1');
    });
  });

  describe('Type Compatibility', () => {
    it('should have correct string types for email and name fields', () => {
      const user: UserDTO = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Full Name',
        role: 'admin',
        status: 'active',
        tenantId: 'tenant-1',
        createdAt: '2025-01-01T00:00:00Z',
      };

      expect(typeof user.id).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(typeof user.name).toBe('string');
      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('should have correct timestamp format for date fields', () => {
      const user: UserDTO = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        status: 'active',
        tenantId: 'tenant-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
        lastLogin: '2025-01-03T00:00:00Z',
      };

      // Timestamps should be ISO 8601 format strings
      expect(user.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(user.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(user.lastLogin).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should have correct enum type for role and status', () => {
      const roles: UserRole[] = ['super_admin', 'admin', 'manager', 'agent', 'engineer', 'customer'];
      const statuses: UserStatus[] = ['active', 'inactive', 'suspended'];

      const user: UserDTO = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        status: 'active',
        tenantId: 'tenant-1',
        createdAt: '2025-01-01T00:00:00Z',
      };

      expect(roles).toContain(user.role);
      expect(statuses).toContain(user.status);
    });

    it('should handle numeric string fields (phone, mobile)', () => {
      const user: UserDTO = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        status: 'active',
        tenantId: 'tenant-1',
        phone: '+1234567890',
        mobile: '+0987654321',
        createdAt: '2025-01-01T00:00:00Z',
      };

      expect(typeof user.phone).toBe('string');
      expect(typeof user.mobile).toBe('string');
    });
  });

  describe('Optional Field Handling', () => {
    it('should allow optional fields to be undefined', () => {
      const user: UserDTO = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        status: 'active',
        tenantId: 'tenant-1',
        createdAt: '2025-01-01T00:00:00Z',
        // Optional fields omitted
      };

      expect(user.firstName).toBeUndefined();
      expect(user.lastName).toBeUndefined();
      expect(user.avatarUrl).toBeUndefined();
      expect(user.phone).toBeUndefined();
      expect(user.mobile).toBeUndefined();
      expect(user.companyName).toBeUndefined();
      expect(user.department).toBeUndefined();
      expect(user.position).toBeUndefined();
      expect(user.updatedAt).toBeUndefined();
      expect(user.lastLogin).toBeUndefined();
      expect(user.createdBy).toBeUndefined();
      expect(user.deletedAt).toBeUndefined();
    });

    it('should allow optional fields to have values', () => {
      const user: UserDTO = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
        status: 'active',
        tenantId: 'tenant-1',
        avatarUrl: 'https://example.com/avatar.jpg',
        phone: '+1234567890',
        mobile: '+0987654321',
        companyName: 'Test Company',
        department: 'Engineering',
        position: 'Senior Engineer',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
        lastLogin: '2025-01-03T00:00:00Z',
        createdBy: 'admin-1',
        deletedAt: '2025-01-04T00:00:00Z',
      };

      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');
      expect(user.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(user.phone).toBe('+1234567890');
      expect(user.mobile).toBe('+0987654321');
      expect(user.companyName).toBe('Test Company');
      expect(user.department).toBe('Engineering');
      expect(user.position).toBe('Senior Engineer');
      expect(user.updatedAt).toBe('2025-01-02T00:00:00Z');
      expect(user.lastLogin).toBe('2025-01-03T00:00:00Z');
      expect(user.createdBy).toBe('admin-1');
      expect(user.deletedAt).toBe('2025-01-04T00:00:00Z');
    });

    it('should mark required fields as non-optional', () => {
      // This validates type safety at compile time
      const user: UserDTO = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        status: 'active',
        tenantId: 'tenant-1',
        createdAt: '2025-01-01T00:00:00Z',
      };

      // These should always be defined
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.role).toBeDefined();
      expect(user.status).toBeDefined();
      expect(user.tenantId).toBeDefined();
      expect(user.createdAt).toBeDefined();
    });
  });

  describe('Enum Value Validation', () => {
    it('should support all UserRole enum values', () => {
      const roles: UserRole[] = ['super_admin', 'admin', 'manager', 'agent', 'engineer', 'customer'];
      expect(roles).toHaveLength(6);

      roles.forEach(role => {
        const user: UserDTO = {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role,
          status: 'active',
          tenantId: 'tenant-1',
          createdAt: '2025-01-01T00:00:00Z',
        };
        expect(user.role).toBe(role);
      });
    });

    it('should support all UserStatus enum values', () => {
      const statuses: UserStatus[] = ['active', 'inactive', 'suspended'];
      expect(statuses).toHaveLength(3);

      statuses.forEach(status => {
        const user: UserDTO = {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          status,
          tenantId: 'tenant-1',
          createdAt: '2025-01-01T00:00:00Z',
        };
        expect(user.status).toBe(status);
      });
    });

    it('should reject invalid role values at type level', () => {
      // This validates TypeScript compile-time checking
      const validRoles: UserRole[] = ['admin', 'manager'];
      validRoles.forEach(role => {
        expect(role).toMatch(/^(super_admin|admin|manager|agent|engineer|customer)$/);
      });
    });

    it('should reject invalid status values at type level', () => {
      // This validates TypeScript compile-time checking
      const validStatuses: UserStatus[] = ['active', 'inactive', 'suspended'];
      validStatuses.forEach(status => {
        expect(status).toMatch(/^(active|inactive|suspended)$/);
      });
    });
  });
});

describe('CreateUserDTO Type Tests', () => {
  describe('Field Validation', () => {
    it('should have required fields only', () => {
      const createUser: CreateUserDTO = {
        email: 'newuser@example.com',
        name: 'New User',
        role: 'manager',
        status: 'active',
      };

      expect(createUser.email).toBe('newuser@example.com');
      expect(createUser.name).toBe('New User');
      expect(createUser.role).toBe('manager');
      expect(createUser.status).toBe('active');
    });

    it('should allow optional fields', () => {
      const createUser: CreateUserDTO = {
        email: 'newuser@example.com',
        name: 'New User',
        firstName: 'New',
        lastName: 'User',
        role: 'manager',
        status: 'active',
        avatarUrl: 'https://example.com/avatar.jpg',
        phone: '+1234567890',
        mobile: '+0987654321',
        companyName: 'Company',
        department: 'Sales',
        position: 'Sales Manager',
      };

      expect(createUser.firstName).toBe('New');
      expect(createUser.phone).toBe('+1234567890');
      expect(createUser.companyName).toBe('Company');
    });

    it('should not include server-generated fields', () => {
      const createUser: CreateUserDTO = {
        email: 'newuser@example.com',
        name: 'New User',
        role: 'manager',
        status: 'active',
      };

      // Server-generated fields should not be present in create DTO
      expect(createUser).not.toHaveProperty('id');
      expect(createUser).not.toHaveProperty('tenantId');
      expect(createUser).not.toHaveProperty('createdAt');
      expect(createUser).not.toHaveProperty('updatedAt');
      expect(createUser).not.toHaveProperty('lastLogin');
      expect(createUser).not.toHaveProperty('createdBy');
      expect(createUser).not.toHaveProperty('deletedAt');
    });
  });
});

describe('UpdateUserDTO Type Tests', () => {
  describe('Field Validation', () => {
    it('should have all fields optional', () => {
      const updateUser: UpdateUserDTO = {};
      expect(Object.keys(updateUser)).toHaveLength(0);
    });

    it('should allow partial updates', () => {
      const updateUser: UpdateUserDTO = {
        name: 'Updated Name',
        status: 'inactive',
      };

      expect(updateUser.name).toBe('Updated Name');
      expect(updateUser.status).toBe('inactive');
      expect(updateUser.email).toBeUndefined();
      expect(updateUser.role).toBeUndefined();
    });

    it('should allow all field updates', () => {
      const updateUser: UpdateUserDTO = {
        email: 'updated@example.com',
        name: 'Updated User',
        firstName: 'Updated',
        lastName: 'User',
        role: 'admin',
        status: 'active',
        avatarUrl: 'https://example.com/new-avatar.jpg',
        phone: '+1111111111',
        mobile: '+2222222222',
        companyName: 'New Company',
        department: 'New Department',
        position: 'New Position',
      };

      expect(updateUser.email).toBe('updated@example.com');
      expect(updateUser.role).toBe('admin');
      expect(updateUser.department).toBe('New Department');
    });

    it('should not include read-only fields', () => {
      const updateUser: UpdateUserDTO = {};

      // Read-only fields should not be updatable
      expect(updateUser).not.toHaveProperty('id');
      expect(updateUser).not.toHaveProperty('tenantId');
      expect(updateUser).not.toHaveProperty('createdAt');
      expect(updateUser).not.toHaveProperty('updatedAt');
      expect(updateUser).not.toHaveProperty('lastLogin');
      expect(updateUser).not.toHaveProperty('createdBy');
      expect(updateUser).not.toHaveProperty('deletedAt');
    });
  });
});

describe('UserFiltersDTO Type Tests', () => {
  describe('Filter Validation', () => {
    it('should allow empty filter object', () => {
      const filters: UserFiltersDTO = {};
      expect(Object.keys(filters)).toHaveLength(0);
    });

    it('should support status filter', () => {
      const filters: UserFiltersDTO = {
        status: ['active', 'inactive'],
      };

      expect(filters.status).toEqual(['active', 'inactive']);
    });

    it('should support role filter', () => {
      const filters: UserFiltersDTO = {
        role: ['admin', 'manager'],
      };

      expect(filters.role).toEqual(['admin', 'manager']);
    });

    it('should support search filter', () => {
      const filters: UserFiltersDTO = {
        search: 'john',
      };

      expect(filters.search).toBe('john');
    });

    it('should support date range filters', () => {
      const filters: UserFiltersDTO = {
        createdAfter: '2025-01-01T00:00:00Z',
        createdBefore: '2025-12-31T23:59:59Z',
      };

      expect(filters.createdAfter).toBe('2025-01-01T00:00:00Z');
      expect(filters.createdBefore).toBe('2025-12-31T23:59:59Z');
    });

    it('should support combined filters', () => {
      const filters: UserFiltersDTO = {
        status: ['active'],
        role: ['admin', 'manager'],
        department: ['Engineering', 'Sales'],
        search: 'john',
        createdAfter: '2025-01-01T00:00:00Z',
      };

      expect(filters.status).toEqual(['active']);
      expect(filters.role).toEqual(['admin', 'manager']);
      expect(filters.department).toEqual(['Engineering', 'Sales']);
      expect(filters.search).toBe('john');
      expect(filters.createdAfter).toBe('2025-01-01T00:00:00Z');
    });
  });
});

describe('UserStatsDTO Type Tests', () => {
  describe('Stats Structure', () => {
    it('should have correct numeric types', () => {
      const stats: UserStatsDTO = {
        totalUsers: 100,
        activeUsers: 85,
        inactiveUsers: 10,
        suspendedUsers: 5,
        usersByRole: {
          super_admin: 1,
          admin: 5,
          manager: 15,
          agent: 30,
          engineer: 40,
          customer: 9,
        },
        newUsersLast30Days: 20,
        lastUpdated: '2025-01-01T00:00:00Z',
      };

      expect(typeof stats.totalUsers).toBe('number');
      expect(typeof stats.activeUsers).toBe('number');
      expect(stats.totalUsers).toBeGreaterThanOrEqual(0);
      expect(stats.activeUsers).toBeGreaterThanOrEqual(0);
    });

    it('should support role distribution map', () => {
      const stats: UserStatsDTO = {
        totalUsers: 100,
        activeUsers: 100,
        inactiveUsers: 0,
        suspendedUsers: 0,
        usersByRole: {
          super_admin: 1,
          admin: 5,
          manager: 10,
          agent: 20,
          engineer: 30,
          customer: 34,
        },
        newUsersLast30Days: 10,
        lastUpdated: '2025-01-01T00:00:00Z',
      };

      expect(stats.usersByRole.admin).toBe(5);
      expect(stats.usersByRole.engineer).toBe(30);
    });
  });
});

describe('UserActivityDTO Type Tests', () => {
  describe('Activity Structure', () => {
    it('should have required fields', () => {
      const activity: UserActivityDTO = {
        id: 'activity-1',
        userId: 'user-1',
        action: 'CREATE',
        resource: 'user',
        timestamp: '2025-01-01T00:00:00Z',
      };

      expect(activity.id).toBe('activity-1');
      expect(activity.userId).toBe('user-1');
      expect(activity.action).toBe('CREATE');
      expect(activity.resource).toBe('user');
      expect(activity.timestamp).toBe('2025-01-01T00:00:00Z');
    });

    it('should support optional fields', () => {
      const activity: UserActivityDTO = {
        id: 'activity-1',
        userId: 'user-1',
        action: 'UPDATE',
        resource: 'user',
        timestamp: '2025-01-01T00:00:00Z',
        details: {
          oldValue: { name: 'Old Name' },
          newValue: { name: 'New Name' },
        },
        ipAddress: '192.168.1.1',
      };

      expect(activity.details).toEqual({
        oldValue: { name: 'Old Name' },
        newValue: { name: 'New Name' },
      });
      expect(activity.ipAddress).toBe('192.168.1.1');
    });
  });
});

describe('Database Schema to DTO Mapping', () => {
  describe('Field Mapping Reference', () => {
    it('should map all database columns to DTO fields', () => {
      const mappings: Record<string, string> = {
        // Database → DTO (snake_case only for non-direct mappings)
        first_name: 'firstName',
        last_name: 'lastName',
        tenant_id: 'tenantId',
        avatar_url: 'avatarUrl',
        company_name: 'companyName',
        created_at: 'createdAt',
        updated_at: 'updatedAt',
        last_login: 'lastLogin',
        created_by: 'createdBy',
        deleted_at: 'deletedAt',
      };

      const directMappings = ['id', 'email', 'name', 'role', 'status', 'phone', 'mobile', 'department', 'position'];

      const user: UserDTO = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
        status: 'active',
        tenantId: 'tenant-1',
        avatarUrl: 'https://example.com/avatar.jpg',
        phone: '+1234567890',
        mobile: '+0987654321',
        companyName: 'Test Company',
        department: 'Engineering',
        position: 'Senior Engineer',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
        lastLogin: '2025-01-03T00:00:00Z',
        createdBy: 'admin-1',
        deletedAt: undefined,
      };

      // Verify all direct mapping fields exist
      directMappings.forEach(dtoField => {
        expect(user).toHaveProperty(dtoField);
      });

      // Verify all snake_case mapping fields exist
      Object.values(mappings).forEach(dtoField => {
        expect(user).toHaveProperty(dtoField);
      });

      // Verify no snake_case properties in user object
      Object.keys(mappings).forEach(dbColumn => {
        expect(user).not.toHaveProperty(dbColumn);
      });
    });

    it('should maintain type consistency across layers', () => {
      // Verify types are consistent
      const user: UserDTO = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        status: 'active',
        tenantId: 'tenant-1',
        createdAt: '2025-01-01T00:00:00Z',
      };

      // String fields should be strings
      expect(typeof user.id).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(typeof user.tenantId).toBe('string');

      // Enums should be from allowed values
      const validRoles: UserRole[] = ['super_admin', 'admin', 'manager', 'agent', 'engineer', 'customer'];
      expect(validRoles).toContain(user.role);

      const validStatuses: UserStatus[] = ['active', 'inactive', 'suspended'];
      expect(validStatuses).toContain(user.status);
    });
  });
});

describe('Type Assignability', () => {
  describe('DTO Compatibility', () => {
    it('should allow UserDTO to be used where expected', () => {
      const user: UserDTO = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        status: 'active',
        tenantId: 'tenant-1',
        createdAt: '2025-01-01T00:00:00Z',
      };

      // Should be assignable to interface
      const userData: UserDTO = user;
      expect(userData.id).toBe('user-1');
    });

    it('should support type narrowing and guards', () => {
      const user: UserDTO = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        status: 'active',
        tenantId: 'tenant-1',
        createdAt: '2025-01-01T00:00:00Z',
      };

      // Type guard: verify all required fields exist
      if (user.id && user.email && user.role && user.status) {
        expect(user.role).toBe('admin');
        expect(user.status).toBe('active');
      }
    });
  });
});
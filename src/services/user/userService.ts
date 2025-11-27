/**
 * Mock User Service
 * Provides mock data for user management operations
 * Implements same interface as Supabase service for factory pattern compatibility
 * 
 * FIELD MAPPING REFERENCE (Mock → DTO):
 * - All fields use camelCase matching UserDTO
 * - No snake_case transformation needed in mock
 * - Validation rules match database constraints
 */

import { 
  UserDTO, 
  UserStatsDTO, 
  CreateUserDTO, 
  UpdateUserDTO,
  UserFiltersDTO,
  UserListResponseDTO,
  UserActivityDTO,
  UserRole,
  UserStatus,
} from '@/types/dtos/userDtos';

/**
 * Mock user data matching UserDTO structure exactly
 */
const mockUsers: UserDTO[] = [
  {
    id: '1',
    email: 'admin@company.com',
    name: 'John Admin',
    firstName: 'John',
    lastName: 'Admin',
    role: 'admin',
    status: 'active',
    tenantId: 'tenant_1',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
    phone: '+1-555-0101',
    companyName: 'Acme Corporation',
    position: 'System Administrator',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    lastLogin: '2024-01-20T14:30:00Z',
    // Security fields with defaults
    mfaMethod: 'none',
    failedLoginAttempts: 0,
    concurrentSessionsLimit: 5,
    passwordChangedAt: '2024-01-01T00:00:00Z',
    securityAlertsEnabled: true,
  },
  {
    id: '2',
    email: 'manager@company.com',
    name: 'Sarah Manager',
    firstName: 'Sarah',
    lastName: 'Manager',
    role: 'manager',
    status: 'active',
    tenantId: 'tenant_1',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
    phone: '+1-555-0102',
    companyName: 'Acme Corporation',
    position: 'Sales Manager',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-20T10:15:00Z',
    lastLogin: '2024-01-20T10:15:00Z',
  },
  {
    id: '3',
    email: 'user@company.com',
    name: 'Mike User',
    firstName: 'Mike',
    lastName: 'User',
    role: 'user',
    status: 'active',
    tenantId: 'tenant_1',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
    phone: '+1-555-0103',
    companyName: 'Acme Corporation',
    position: 'Sales User',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-19T16:45:00Z',
    lastLogin: '2024-01-19T16:45:00Z',
    // Security fields with defaults
    mfaMethod: 'none',
    failedLoginAttempts: 0,
    concurrentSessionsLimit: 5,
    passwordChangedAt: '2024-01-01T00:00:00Z',
    securityAlertsEnabled: true,
  },
];

/**
 * Mock activity logs for testing
 */
const mockActivityLogs: UserActivityDTO[] = [];

/**
 * Mock User Service Implementation
 * Provides development/testing data with consistent structure
 */
class MockUserService {
  /**
   * Get all users with optional filters
   * ✅ Returns: UserDTO[]
   * ✅ Validation: Same rules as Supabase
   */
  async getUsers(filters?: UserFiltersDTO): Promise<UserDTO[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    let users = [...mockUsers];

    // Apply filters
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        users = users.filter(u => filters.status!.includes(u.status));
      }
      if (filters.role && filters.role.length > 0) {
        users = users.filter(u => filters.role!.includes(u.role));
      }
      if (filters.department && filters.department.length > 0) {
        users = users.filter(u => 
          u.department && filters.department!.includes(u.department)
        );
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        users = users.filter(u =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          u.firstName?.toLowerCase().includes(search) ||
          u.lastName?.toLowerCase().includes(search) ||
          u.companyName?.toLowerCase().includes(search)
        );
      }
    }

    return users;
  }

  /**
   * Get a single user by ID
   * ✅ Returns: UserDTO
   * ✅ Validation: Throws on not found
   */
  async getUser(id: string): Promise<UserDTO> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const user = mockUsers.find(u => u.id === id);
    if (!user) {
      throw new Error(`User not found: ${id}`);
    }

    return user;
  }

  /**
   * Create a new user
   * ✅ Returns: UserDTO with generated id and timestamps
   * ✅ Validation: Email uniqueness, required fields, field lengths
   */
  async createUser(data: CreateUserDTO): Promise<UserDTO> {
    await new Promise(resolve => setTimeout(resolve, 400));

    // Validate required fields
    if (!data.email) {
      throw new Error('Email is required');
    }
    if (!data.name) {
      throw new Error('Name is required');
    }
    if (!data.role) {
      throw new Error('Role is required');
    }
    if (!data.status) {
      throw new Error('Status is required');
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('Invalid email format');
    }

    // Check email uniqueness (constraint)
    const existingUser = mockUsers.find(u => u.email === data.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Validate field lengths
    if (data.name.length > 255) {
      throw new Error('Name cannot exceed 255 characters');
    }
    if (data.firstName && data.firstName.length > 100) {
      throw new Error('First name cannot exceed 100 characters');
    }
    if (data.lastName && data.lastName.length > 100) {
      throw new Error('Last name cannot exceed 100 characters');
    }
    if (data.phone && data.phone.length > 50) {
      throw new Error('Phone cannot exceed 50 characters');
    }
    if (data.mobile && data.mobile.length > 50) {
      throw new Error('Mobile cannot exceed 50 characters');
    }
    if (data.companyName && data.companyName.length > 255) {
      throw new Error('Company name cannot exceed 255 characters');
    }
    if (data.department && data.department.length > 100) {
      throw new Error('Department cannot exceed 100 characters');
    }
    if (data.position && data.position.length > 100) {
      throw new Error('Position cannot exceed 100 characters');
    }

    // Validate role
    const validRoles: UserRole[] = ['super_admin', 'admin', 'manager', 'user', 'engineer', 'customer'];
    if (!validRoles.includes(data.role)) {
      throw new Error(`Invalid role: ${data.role}. Allowed roles: ${validRoles.join(', ')}`);
    }

    // Validate status
    const validStatuses: UserStatus[] = ['active', 'inactive', 'suspended'];
    if (!validStatuses.includes(data.status)) {
      throw new Error(`Invalid status: ${data.status}. Allowed statuses: ${validStatuses.join(', ')}`);
    }

    const newUser: UserDTO = {
      id: `user_${Date.now()}`,
      email: data.email,
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      status: data.status,
      tenantId: 'tenant_1', // Default tenant for mock
      avatarUrl: data.avatarUrl,
      phone: data.phone,
      mobile: data.mobile,
      companyName: data.companyName,
      department: data.department,
      position: data.position,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    mockUsers.push(newUser);
    return newUser;
  }

  /**
   * Update a user
   * ✅ Returns: Updated UserDTO
   * ✅ Validation: Email uniqueness if updated, same rules as create, field lengths
   */
  async updateUser(id: string, data: UpdateUserDTO): Promise<UserDTO> {
    await new Promise(resolve => setTimeout(resolve, 350));

    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error(`User not found: ${id}`);
    }

    // If email is being updated, check uniqueness and format
    if (data.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        throw new Error('Invalid email format');
      }

      const existingUser = mockUsers.find(u => 
        u.email === data.email && u.id !== id
      );
      if (existingUser) {
        throw new Error('Email already exists');
      }
    }

    // Validate field lengths if provided
    if (data.name && data.name.length > 255) {
      throw new Error('Name cannot exceed 255 characters');
    }
    if (data.firstName && data.firstName.length > 100) {
      throw new Error('First name cannot exceed 100 characters');
    }
    if (data.lastName && data.lastName.length > 100) {
      throw new Error('Last name cannot exceed 100 characters');
    }
    if (data.phone && data.phone.length > 50) {
      throw new Error('Phone cannot exceed 50 characters');
    }
    if (data.mobile && data.mobile.length > 50) {
      throw new Error('Mobile cannot exceed 50 characters');
    }
    if (data.companyName && data.companyName.length > 255) {
      throw new Error('Company name cannot exceed 255 characters');
    }
    if (data.department && data.department.length > 100) {
      throw new Error('Department cannot exceed 100 characters');
    }
    if (data.position && data.position.length > 100) {
      throw new Error('Position cannot exceed 100 characters');
    }

    // Validate role if provided
    if (data.role) {
      const validRoles: UserRole[] = ['super_admin', 'admin', 'manager', 'user', 'engineer', 'customer'];
      if (!validRoles.includes(data.role)) {
        throw new Error(`Invalid role: ${data.role}. Allowed roles: ${validRoles.join(', ')}`);
      }
    }

    // Validate status if provided
    if (data.status) {
      const validStatuses: UserStatus[] = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(data.status)) {
        throw new Error(`Invalid status: ${data.status}. Allowed statuses: ${validStatuses.join(', ')}`);
      }
    }

    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return mockUsers[userIndex];
  }

  /**
   * Delete a user
   * ✅ Validation: User exists
   */
  async deleteUser(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 250));

    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error(`User not found: ${id}`);
    }

    mockUsers.splice(userIndex, 1);
  }

  /**
   * Reset user password
   * ✅ Validation: User exists
   */
  async resetPassword(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = mockUsers.find(u => u.id === id);
    if (!user) {
      throw new Error(`User not found: ${id}`);
    }

    // Simulate password reset (in production, would send email)
    console.log(`[Mock] Password reset email sent to: ${user.email}`);
  }

  /**
   * Get user statistics
   * ✅ Returns: UserStatsDTO with aggregated data
   */
  async getUserStats(): Promise<UserStatsDTO> {
    const totalUsers = mockUsers.length;
    const activeUsers = mockUsers.filter(u => u.status === 'active').length;
    const inactiveUsers = mockUsers.filter(u => u.status === 'inactive').length;
    const suspendedUsers = mockUsers.filter(u => u.status === 'suspended').length;

    const usersByRole: Record<UserRole, number> = {
      'super_admin': mockUsers.filter(u => u.role === 'super_admin').length,
      'admin': mockUsers.filter(u => u.role === 'admin').length,
      'manager': mockUsers.filter(u => u.role === 'manager').length,
      'user': mockUsers.filter(u => u.role === 'user').length,
      'engineer': mockUsers.filter(u => u.role === 'engineer').length,
      'customer': mockUsers.filter(u => u.role === 'customer').length,
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLast30Days = mockUsers.filter(u =>
      new Date(u.createdAt) > thirtyDaysAgo
    ).length;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      usersByRole,
      newUsersLast30Days,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get available roles
   */
  async getRoles(): Promise<UserRole[]> {
    return ['super_admin', 'admin', 'manager', 'user', 'engineer', 'customer'];
  }

  /**
   * Get available statuses
   */
  async getStatuses(): Promise<UserStatus[]> {
    return ['active', 'inactive', 'suspended'];
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId: string): Promise<UserActivityDTO[]> {
    return mockActivityLogs.filter(log => log.userId === userId);
  }

  /**
   * Log user activity
   */
  async logActivity(activity: Omit<UserActivityDTO, 'id'>): Promise<UserActivityDTO> {
    const activityLog: UserActivityDTO = {
      id: `activity_${Date.now()}`,
      ...activity,
    };
    mockActivityLogs.push(activityLog);
    return activityLog;
  }

  /**
   * Get all tenants
   * ✅ Returns: Array of tenant objects
   */
  async getTenants(): Promise<Array<{ id: string; name: string; status: string }>> {
    // Mock tenants data
    return [
      { id: 'tenant_1', name: 'Acme Corporation', status: 'active' },
      { id: 'tenant_2', name: 'Tech Innovations Inc', status: 'active' },
      { id: 'tenant_3', name: 'Global Solutions Ltd', status: 'active' },
      { id: 'tenant_4', name: 'Enterprise Systems', status: 'inactive' },
    ];
  }
}

export const userService = new MockUserService();
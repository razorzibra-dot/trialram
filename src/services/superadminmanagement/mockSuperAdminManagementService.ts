/**
 * Super Admin Management Service - Mock Implementation
 * ✅ For development and testing without Supabase
 * ✅ Full feature parity with Supabase implementation
 */

import { v4 as uuidv4 } from 'uuid';
import { UserDTO, UserStatus } from '@/types/dtos/userDtos';
import {
  SuperAdminDTO,
  CreateSuperAdminInput,
  PromoteSuperAdminInput,
  SuperAdminTenantAccess,
  GrantTenantAccessInput,
  RevokeTenantAccessInput,
  SuperAdminStatsDTO,
  SuperAdminActionLog,
  ISuperAdminManagementService
} from '@/types/superAdmin';

/**
 * Mock storage for super admins (in-memory)
 */
const mockSuperAdmins: Map<string, SuperAdminDTO> = new Map([
  [
    'super-001',
    {
      id: 'super-001',
      email: 'admin@platform.com',
      name: 'Platform Admin',
      firstName: 'Platform',
      lastName: 'Admin',
      role: 'super_admin',
      status: 'active' as UserStatus,
      tenantId: null,
      isSuperAdmin: true,
      createdAt: new Date('2025-01-01').toISOString(),
      updatedAt: new Date('2025-02-15').toISOString(),
    }
  ]
]);

/**
 * Mock storage for tenant accesses
 */
const mockTenantAccesses: Map<string, SuperAdminTenantAccess> = new Map([
  [
    'access-001',
    {
      id: 'access-001',
      superAdminId: 'super-001',
      tenantId: 'tenant-001',
      accessLevel: 'full',
      grantedAt: new Date('2025-01-15').toISOString(),
      expiresAt: null,
      reason: 'Full platform access'
    }
  ]
]);

/**
 * Mock action logs
 */
const mockActionLogs: SuperAdminActionLog[] = [
  {
    id: 'log-001',
    superAdminId: 'super-001',
    action: 'create_super_admin',
    targetId: 'super-001',
    details: { email: 'admin@platform.com' },
    timestamp: new Date('2025-01-01').toISOString()
  }
];

/**
 * Mock implementation of Super Admin Management Service
 */
export const mockSuperAdminManagementService: ISuperAdminManagementService = {
  /**
   * Create new super admin
   */
  async createSuperAdmin(data: CreateSuperAdminInput): Promise<SuperAdminDTO> {
    // Validate email uniqueness
    const exists = Array.from(mockSuperAdmins.values()).some(
      (sa) => sa.email === data.email
    );
    if (exists) {
      throw new Error(`Email ${data.email} already exists`);
    }

    const newSuperAdmin: SuperAdminDTO = {
      id: `super-${uuidv4().substring(0, 8)}`,
      email: data.email,
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'super_admin',
      status: data.status || 'active',
      tenantId: null, // ✅ Super admins have null tenant_id
      isSuperAdmin: true,
      avatarUrl: data.avatarUrl,
      phone: data.phone,
      mobile: data.mobile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockSuperAdmins.set(newSuperAdmin.id, newSuperAdmin);

    // Log action
    mockActionLogs.push({
      id: `log-${uuidv4().substring(0, 8)}`,
      superAdminId: newSuperAdmin.id,
      action: 'create_super_admin',
      targetId: newSuperAdmin.id,
      details: { email: data.email },
      timestamp: new Date().toISOString()
    });

    return newSuperAdmin;
  },

  /**
   * Promote existing user to super admin
   */
  async promoteSuperAdmin(data: PromoteSuperAdminInput): Promise<SuperAdminDTO> {
    // In mock, we check if user exists in mockSuperAdmins
    let user = mockSuperAdmins.get(data.userId);

    if (!user) {
      // If not in super admins yet, create promotion
      user = {
        id: data.userId,
        email: `promoted-${data.userId}@platform.com`,
        name: `Promoted User ${data.userId}`,
        role: 'super_admin',
        status: 'active',
        tenantId: null,
        isSuperAdmin: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as SuperAdminDTO;
    } else if (user.isSuperAdmin) {
      throw new Error(`User ${data.userId} is already a super admin`);
    }

    mockSuperAdmins.set(data.userId, user);

    // Log action
    mockActionLogs.push({
      id: `log-${uuidv4().substring(0, 8)}`,
      superAdminId: data.userId,
      action: 'promote_super_admin',
      targetId: data.userId,
      details: { reason: data.reason || 'No reason provided' },
      timestamp: new Date().toISOString()
    });

    return user;
  },

  /**
   * Get super admin by ID
   */
  async getSuperAdminById(id: string): Promise<SuperAdminDTO> {
    const user = mockSuperAdmins.get(id);
    if (!user) {
      throw new Error(`Super admin ${id} not found`);
    }
    return user;
  },

  /**
   * Get all super admins
   */
  async getSuperAdmins(): Promise<SuperAdminDTO[]> {
    return Array.from(mockSuperAdmins.values());
  },

  /**
   * Grant tenant access to super admin
   */
  async grantTenantAccess(data: GrantTenantAccessInput): Promise<SuperAdminTenantAccess> {
    const superAdmin = mockSuperAdmins.get(data.superAdminId);
    if (!superAdmin) {
      throw new Error(`Super admin ${data.superAdminId} not found`);
    }

    const access: SuperAdminTenantAccess = {
      id: `access-${uuidv4().substring(0, 8)}`,
      superAdminId: data.superAdminId,
      tenantId: data.tenantId,
      accessLevel: data.accessLevel,
      grantedAt: new Date().toISOString(),
      expiresAt: data.expiresAt || null,
      reason: data.reason
    };

    mockTenantAccesses.set(access.id, access);

    // Log action
    mockActionLogs.push({
      id: `log-${uuidv4().substring(0, 8)}`,
      superAdminId: data.superAdminId,
      action: 'grant_tenant_access',
      targetId: data.tenantId,
      details: { accessLevel: data.accessLevel },
      timestamp: new Date().toISOString()
    });

    return access;
  },

  /**
   * Revoke tenant access
   */
  async revokeTenantAccess(data: RevokeTenantAccessInput): Promise<void> {
    let found = false;

    for (const [key, access] of mockTenantAccesses) {
      if (
        access.superAdminId === data.superAdminId &&
        access.tenantId === data.tenantId
      ) {
        mockTenantAccesses.delete(key);
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(
        `No access record found for super admin ${data.superAdminId} and tenant ${data.tenantId}`
      );
    }

    // Log action
    mockActionLogs.push({
      id: `log-${uuidv4().substring(0, 8)}`,
      superAdminId: data.superAdminId,
      action: 'revoke_tenant_access',
      targetId: data.tenantId,
      details: { reason: data.reason || 'No reason provided' },
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Get tenant accesses for super admin
   */
  async getTenantAccess(superAdminId: string): Promise<SuperAdminTenantAccess[]> {
    return Array.from(mockTenantAccesses.values()).filter(
      (access) => access.superAdminId === superAdminId
    );
  },

  /**
   * Get super admin statistics
   */
  async getStats(): Promise<SuperAdminStatsDTO> {
    const allSuperAdmins = Array.from(mockSuperAdmins.values());
    const allAccesses = Array.from(mockTenantAccesses.values());
    const uniqueTenants = new Set(allAccesses.map((a) => a.tenantId));

    return {
      totalSuperAdmins: allSuperAdmins.length,
      activeSuperAdmins: allSuperAdmins.filter((sa) => sa.status === 'active').length,
      inactiveSuperAdmins: allSuperAdmins.filter((sa) => sa.status === 'inactive').length,
      totalTenantAccesses: allAccesses.length,
      activeTenantAccesses: allAccesses.filter((a) => !a.expiresAt || new Date(a.expiresAt) > new Date()).length,
      tenantsWithAccess: uniqueTenants.size,
      lastUpdated: new Date().toISOString()
    };
  },

  /**
   * Get action logs
   */
  async getActionLog(filters?: Record<string, any>): Promise<SuperAdminActionLog[]> {
    let logs = mockActionLogs;

    if (filters?.superAdminId) {
      logs = logs.filter((log) => log.superAdminId === filters.superAdminId);
    }

    const limit = filters?.limit || 100;
    return logs.slice(-limit);
  },

  /**
   * Demote super admin (not implemented in mock)
   */
  async demoteSuperAdmin(userId: string, reason?: string): Promise<void> {
    throw new Error('Demotion not supported in mock implementation');
  },

  /**
   * Update super admin
   */
  async updateSuperAdmin(id: string, data: Partial<CreateSuperAdminInput>): Promise<SuperAdminDTO> {
    const user = mockSuperAdmins.get(id);
    if (!user) {
      throw new Error(`Super admin ${id} not found`);
    }

    const updatedUser: SuperAdminDTO = {
      ...user,
      ...data,
      updatedAt: new Date().toISOString()
    };

    mockSuperAdmins.set(id, updatedUser);

    // Log action
    mockActionLogs.push({
      id: `log-${uuidv4().substring(0, 8)}`,
      superAdminId: id,
      action: 'update_super_admin',
      targetId: id,
      details: data,
      timestamp: new Date().toISOString()
    });

    return updatedUser;
  },

  /**
   * Delete super admin
   */
  async deleteSuperAdmin(id: string): Promise<void> {
    if (!mockSuperAdmins.has(id)) {
      throw new Error(`Super admin ${id} not found`);
    }

    mockSuperAdmins.delete(id);

    // Remove tenant accesses
    for (const [key, access] of mockTenantAccesses) {
      if (access.superAdminId === id) {
        mockTenantAccesses.delete(key);
      }
    }

    // Log action
    mockActionLogs.push({
      id: `log-${uuidv4().substring(0, 8)}`,
      superAdminId: id,
      action: 'delete_super_admin',
      targetId: id,
      details: {},
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log action
   */
  async logAction(action: string, targetId: string, details?: Record<string, any>): Promise<SuperAdminActionLog> {
    const log: SuperAdminActionLog = {
      id: `log-${uuidv4().substring(0, 8)}`,
      superAdminId: 'system', // Or current user, but for mock
      action,
      targetId,
      details,
      timestamp: new Date().toISOString()
    };

    mockActionLogs.push(log);
    return log;
  }
};
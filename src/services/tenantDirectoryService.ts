/**
 * Mock Tenant Directory Service
 * For development and testing without database
 */

import { TenantDirectoryEntry } from '@/types/superAdmin';

const MOCK_TENANTS: TenantDirectoryEntry[] = [
  {
    tenantId: 'tenant_001',
    name: 'Acme Corporation',
    status: 'active',
    plan: 'professional',
    activeUsers: 24,
    totalContracts: 12,
    totalSales: 450000,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2025-02-12T10:30:00Z',
  },
  {
    tenantId: 'tenant_002',
    name: 'Global Services Inc',
    status: 'active',
    plan: 'enterprise',
    activeUsers: 48,
    totalContracts: 28,
    totalSales: 1200000,
    createdAt: '2024-02-01T09:15:00Z',
    updatedAt: '2025-02-12T09:45:00Z',
  },
  {
    tenantId: 'tenant_003',
    name: 'Tech Startup Ltd',
    status: 'active',
    plan: 'starter',
    activeUsers: 8,
    totalContracts: 3,
    totalSales: 75000,
    createdAt: '2024-06-10T11:20:00Z',
    updatedAt: '2025-02-11T14:22:00Z',
  },
  {
    tenantId: 'tenant_004',
    name: 'Enterprise Solutions',
    status: 'active',
    plan: 'enterprise',
    activeUsers: 156,
    totalContracts: 67,
    totalSales: 3500000,
    createdAt: '2023-11-20T07:00:00Z',
    updatedAt: '2025-02-12T08:15:00Z',
  },
  {
    tenantId: 'tenant_005',
    name: 'Mid-Market Systems',
    status: 'active',
    plan: 'professional',
    activeUsers: 35,
    totalContracts: 18,
    totalSales: 820000,
    createdAt: '2024-03-05T10:30:00Z',
    updatedAt: '2025-02-10T16:45:00Z',
  },
];

export const mockTenantDirectoryService = {
  /**
   * Get all tenants (mock)
   */
  getAllTenants: async (): Promise<TenantDirectoryEntry[]> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log(`✅ (Mock) Fetched ${MOCK_TENANTS.length} tenants`);
    return [...MOCK_TENANTS];
  },

  /**
   * Get specific tenant (mock)
   */
  getTenant: async (tenantId: string): Promise<TenantDirectoryEntry | null> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const tenant = MOCK_TENANTS.find((t) => t.tenantId === tenantId);
    console.log(`✅ (Mock) Fetched tenant: ${tenantId}`);
    return tenant || null;
  },

  /**
   * Get tenants by status (mock)
   */
  getTenantsByStatus: async (
    status: 'active' | 'inactive' | 'suspended'
  ): Promise<TenantDirectoryEntry[]> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const filtered = MOCK_TENANTS.filter((t) => t.status === status);
    console.log(`✅ (Mock) Fetched ${filtered.length} ${status} tenants`);
    return [...filtered];
  },

  /**
   * Get tenant statistics (mock)
   */
  getTenantStats: async (): Promise<{
    totalTenants: number;
    activeTenants: number;
    inactiveTenants: number;
    suspendedTenants: number;
  }> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const stats = {
      totalTenants: MOCK_TENANTS.length,
      activeTenants: MOCK_TENANTS.filter((t) => t.status === 'active').length,
      inactiveTenants: MOCK_TENANTS.filter((t) => t.status === 'inactive').length,
      suspendedTenants: MOCK_TENANTS.filter((t) => t.status === 'suspended').length,
    };
    console.log('✅ (Mock) Fetched tenant statistics:', stats);
    return stats;
  },

  /**
   * Update tenant statistics (mock)
   */
  updateTenantStats: async (
    tenantId: string,
    updates: {
      activeUsers?: number;
      totalContracts?: number;
      totalSales?: number;
    }
  ): Promise<TenantDirectoryEntry> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const tenant = MOCK_TENANTS.find((t) => t.tenantId === tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const updated = {
      ...tenant,
      activeUsers: updates.activeUsers ?? tenant.activeUsers,
      totalContracts: updates.totalContracts ?? tenant.totalContracts,
      totalSales: updates.totalSales ?? tenant.totalSales,
      updatedAt: new Date().toISOString(),
    };

    // Update mock data
    const index = MOCK_TENANTS.findIndex((t) => t.tenantId === tenantId);
    MOCK_TENANTS[index] = updated;

    console.log(`✅ (Mock) Updated tenant statistics for ${tenantId}`);
    return updated;
  },
};
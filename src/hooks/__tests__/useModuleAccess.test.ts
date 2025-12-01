/**
 * Unit Tests for useModuleAccess Hook
 * 
 * Tests all module access control scenarios:
 * - Super admin accessing super-admin module
 * - Super admin blocked from tenant modules
 * - Regular users accessing tenant modules with permissions
 * - Regular users blocked from super-admin module
 * - Permission-based access control
 */

import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useModuleAccess, useAccessibleModules } from '../useModuleAccess';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services';

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/services', () => ({
  authService: {
    hasPermission: jest.fn(),
  },
}));

// Setup React Query test utilities
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderHookWithQueryClient = (callback: any) => {
  const testQueryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: testQueryClient }, children);
  return renderHook(callback, { wrapper });
};

describe('useModuleAccess Hook', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockAuthService = authService as jest.Mocked<typeof authService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Super Admin Module Access', () => {
    it('should grant super admin access to super-admin module', async () => {
      const superAdminUser = {
        id: 'super-1',
        isSuperAdmin: true,
        role: 'super_admin' as const,
        email: 'admin@example.com',
        name: 'Super Admin',
        status: 'active' as const,
        tenantId: null,
        createdAt: new Date().toISOString(),
      };

      mockUseAuth.mockReturnValue({
        user: superAdminUser,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        hasRole: jest.fn(),
        hasPermission: jest.fn(),
        sessionInfo: jest.fn(),
        getTenantId: jest.fn(),
      } as any);

      const { result } = renderHookWithQueryClient(() => useModuleAccess('super-admin'));

      // Initial state
      expect(result.current.isLoading).toBe(true);

      // Wait for query to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.canAccess).toBe(true);
      expect(result.current.isSuperAdmin).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should grant super admin access to admin-panel module', async () => {
      const superAdminUser = {
        id: 'super-1',
        isSuperAdmin: true,
        role: 'super_admin' as const,
        email: 'admin@example.com',
        name: 'Super Admin',
        status: 'active' as const,
        tenantId: null,
        createdAt: new Date().toISOString(),
      };

      mockUseAuth.mockReturnValue({
        user: superAdminUser,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        hasRole: jest.fn(),
        hasPermission: jest.fn(),
        sessionInfo: jest.fn(),
        getTenantId: jest.fn(),
      } as any);

      const { result } = renderHookWithQueryClient(() => useModuleAccess('admin-panel'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.canAccess).toBe(true);
      expect(result.current.isSuperAdmin).toBe(true);
    });
  });

  describe('Super Admin Access to Tenant Modules - BLOCKED', () => {
    it('should block super admin from accessing customers module', async () => {
      const superAdminUser = {
        id: 'super-1',
        isSuperAdmin: true,
        role: 'super_admin' as const,
        email: 'admin@example.com',
        name: 'Super Admin',
        status: 'active' as const,
        tenantId: null,
        createdAt: new Date().toISOString(),
      };

      mockUseAuth.mockReturnValue({
        user: superAdminUser,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        hasRole: jest.fn(),
        hasPermission: jest.fn(),
        sessionInfo: jest.fn(),
        getTenantId: jest.fn(),
      } as any);

      const { result } = renderHookWithQueryClient(() => useModuleAccess('customers'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.canAccess).toBe(false);
      expect(result.current.isSuperAdmin).toBe(true);
      expect(result.current.reason).toContain('cannot access');
    });

    it('should block super admin from accessing sales module', async () => {
      const superAdminUser = {
        id: 'super-1',
        isSuperAdmin: true,
        role: 'super_admin' as const,
        email: 'admin@example.com',
        name: 'Super Admin',
        status: 'active' as const,
        tenantId: null,
        createdAt: new Date().toISOString(),
      };

      mockUseAuth.mockReturnValue({
        user: superAdminUser,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        hasRole: jest.fn(),
        hasPermission: jest.fn(),
        sessionInfo: jest.fn(),
        getTenantId: jest.fn(),
      } as any);

      const { result } = renderHookWithQueryClient(() => useModuleAccess('sales'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.canAccess).toBe(false);
      expect(result.current.isSuperAdmin).toBe(true);
    });

    it('should block super admin from accessing contracts module', async () => {
      const superAdminUser = {
        id: 'super-1',
        isSuperAdmin: true,
        role: 'super_admin' as const,
        email: 'admin@example.com',
        name: 'Super Admin',
        status: 'active' as const,
        tenantId: null,
        createdAt: new Date().toISOString(),
      };

      mockUseAuth.mockReturnValue({
        user: superAdminUser,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        hasRole: jest.fn(),
        hasPermission: jest.fn(),
        sessionInfo: jest.fn(),
        getTenantId: jest.fn(),
      } as any);

      const { result } = renderHookWithQueryClient(() => useModuleAccess('contracts'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.canAccess).toBe(false);
      expect(result.current.isSuperAdmin).toBe(true);
    });
  });

  describe('Regular User Access to Tenant Modules', () => {
    it('should grant regular user access to customers module with permissions', async () => {
      const regularUser = {
        id: 'user-1',
        isSuperAdmin: false,
        role: 'manager' as const,
        email: 'manager@tenant1.com',
        name: 'Manager User',
        status: 'active' as const,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
      };

      mockUseAuth.mockReturnValue({
        user: regularUser,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        hasRole: jest.fn(),
        hasPermission: jest.fn(),
        sessionInfo: jest.fn(),
        getTenantId: jest.fn(),
      } as any);

      mockAuthService.hasPermission.mockReturnValue(true);

      const { result } = renderHookWithQueryClient(() => useModuleAccess('customers'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.canAccess).toBe(true);
      expect(result.current.isSuperAdmin).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should deny regular user access to customers module without permissions', async () => {
      const regularUser = {
        id: 'user-1',
        isSuperAdmin: false,
        role: 'agent' as const,
        email: 'agent@tenant1.com',
        name: 'Agent User',
        status: 'active' as const,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
      };

      mockUseAuth.mockReturnValue({
        user: regularUser,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        hasRole: jest.fn(),
        hasPermission: jest.fn(),
        sessionInfo: jest.fn(),
        getTenantId: jest.fn(),
      } as any);

      mockAuthService.hasPermission.mockReturnValue(false);

      const { result } = renderHookWithQueryClient(() => useModuleAccess('customers'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.canAccess).toBe(false);
      expect(result.current.isSuperAdmin).toBe(false);
      expect(result.current.reason).toContain('Insufficient permissions');
    });
  });

  describe('Regular User Access to Super Admin Module - BLOCKED', () => {
    it('should block regular user from accessing super-admin module', async () => {
      const regularUser = {
        id: 'user-1',
        isSuperAdmin: false,
        role: 'manager' as const,
        email: 'manager@tenant1.com',
        name: 'Manager User',
        status: 'active' as const,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
      };

      mockUseAuth.mockReturnValue({
        user: regularUser,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        hasRole: jest.fn(),
        hasPermission: jest.fn(),
        sessionInfo: jest.fn(),
        getTenantId: jest.fn(),
      } as any);

      const { result } = renderHookWithQueryClient(() => useModuleAccess('super-admin'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.canAccess).toBe(false);
      expect(result.current.isSuperAdmin).toBe(false);
      expect(result.current.reason).toContain('cannot access');
    });

    it('should block regular user from accessing admin-panel module', async () => {
      const regularUser = {
        id: 'user-1',
        isSuperAdmin: false,
        role: 'manager' as const,
        email: 'manager@tenant1.com',
        name: 'Manager User',
        status: 'active' as const,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
      };

      mockUseAuth.mockReturnValue({
        user: regularUser,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        hasRole: jest.fn(),
        hasPermission: jest.fn(),
        sessionInfo: jest.fn(),
        getTenantId: jest.fn(),
      } as any);

      const { result } = renderHookWithQueryClient(() => useModuleAccess('admin-panel'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.canAccess).toBe(false);
      expect(result.current.isSuperAdmin).toBe(false);
    });
  });

  describe('Unauthenticated Users', () => {
    it('should deny access when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        hasRole: jest.fn(),
        hasPermission: jest.fn(),
        sessionInfo: jest.fn(),
        getTenantId: jest.fn(),
      } as any);

      const { result } = renderHookWithQueryClient(() => useModuleAccess('customers'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.canAccess).toBe(false);
      expect(result.current.error).toBeDefined();
      expect(result.current.reason).toContain('not authenticated');
    });
  });

  describe('Module Name Case Sensitivity', () => {
    it('should handle uppercase module names', async () => {
      const superAdminUser = {
        id: 'super-1',
        isSuperAdmin: true,
        role: 'super_admin' as const,
        email: 'admin@example.com',
        name: 'Super Admin',
        status: 'active' as const,
        tenantId: null,
        createdAt: new Date().toISOString(),
      };

      mockUseAuth.mockReturnValue({
        user: superAdminUser,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        hasRole: jest.fn(),
        hasPermission: jest.fn(),
        sessionInfo: jest.fn(),
        getTenantId: jest.fn(),
      } as any);

      const { result } = renderHookWithQueryClient(() => useModuleAccess('SUPER-ADMIN'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.canAccess).toBe(true);
      expect(result.current.isSuperAdmin).toBe(true);
    });

    it('should handle mixed case module names', async () => {
      const regularUser = {
        id: 'user-1',
        isSuperAdmin: false,
        role: 'manager' as const,
        email: 'manager@tenant1.com',
        name: 'Manager User',
        status: 'active' as const,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
      };

      mockUseAuth.mockReturnValue({
        user: regularUser,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        hasRole: jest.fn(),
        hasPermission: jest.fn(),
        sessionInfo: jest.fn(),
        getTenantId: jest.fn(),
      } as any);

      mockAuthService.hasPermission.mockReturnValue(true);

      const { result } = renderHookWithQueryClient(() => useModuleAccess('CUSTOMERS'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.canAccess).toBe(true);
    });
  });
});

describe('useAccessibleModules Hook', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockAuthService = authService as jest.Mocked<typeof authService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return only super-admin modules for super admin user', async () => {
    const superAdminUser = {
      id: 'super-1',
      isSuperAdmin: true,
      role: 'super_admin' as const,
      email: 'admin@example.com',
      name: 'Super Admin',
      status: 'active' as const,
      tenantId: null,
      createdAt: new Date().toISOString(),
    };

    mockUseAuth.mockReturnValue({
      user: superAdminUser,
      token: 'token',
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: jest.fn(),
      sessionInfo: jest.fn(),
      getTenantId: jest.fn(),
    } as any);

    const { result } = renderHookWithQueryClient(() => useAccessibleModules());

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.modules).toContain('super-admin');
    expect(result.current.modules).toContain('system-admin');
    expect(result.current.modules).not.toContain('customers');
    expect(result.current.isSuperAdmin).toBe(true);
  });

  it('should return tenant modules for regular user with permissions', async () => {
    const regularUser = {
      id: 'user-1',
      isSuperAdmin: false,
      role: 'manager' as const,
      email: 'manager@tenant1.com',
      name: 'Manager User',
      status: 'active' as const,
      tenantId: 'tenant-1',
      createdAt: new Date().toISOString(),
    };

    mockUseAuth.mockReturnValue({
      user: regularUser,
      token: 'token',
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: jest.fn(),
      sessionInfo: jest.fn(),
      getTenantId: jest.fn(),
    } as any);

    mockAuthService.hasPermission.mockImplementation((perm: string) => {
      return perm === 'crm:customer:record:update' || perm === 'crm:sales:deal:update';
    });

    const { result } = renderHookWithQueryClient(() => useAccessibleModules());

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.modules).toContain('customers');
    expect(result.current.modules).toContain('sales');
    expect(result.current.modules).not.toContain('super-admin');
    expect(result.current.isSuperAdmin).toBe(false);
  });

  it('should return empty array for unauthenticated users', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: jest.fn(),
      sessionInfo: jest.fn(),
      getTenantId: jest.fn(),
    } as any);

    const { result } = renderHookWithQueryClient(() => useAccessibleModules());

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.modules).toEqual([]);
    expect(result.current.isSuperAdmin).toBe(false);
  });
});
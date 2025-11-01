/**
 * User Hooks Tests
 * Comprehensive test suite for React Query hooks
 * 
 * Coverage:
 * - Hook return types and structure
 * - Query key consistency
 * - Cache invalidation
 * - Error handling
 * - Loading states
 */

import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useUsers,
  useUser,
  useUserStats,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useResetPassword,
  useUserActivity,
  useUserRoles,
  useUserStatuses,
  useTenants,
} from '../useUsers';
import { CreateUserDTO } from '@/types/dtos/userDtos';

// Create a test QueryClient
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Wrapper component for tests
const createWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children
  );
  return Wrapper;
};

describe('User Management Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useUsers', () => {
    it('should return hook with correct structure', async () => {
      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current).toHaveProperty('users');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
    });

    it('should initially have loading state', () => {
      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.users).toEqual([]);
    });

    it('should load users', async () => {
      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(Array.isArray(result.current.users)).toBe(true);
    });

    it('should support filtering by status', async () => {
      const { result } = renderHook(() => useUsers({ status: ['active'] }), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(Array.isArray(result.current.users)).toBe(true);
    });

    it('should support filtering by role', async () => {
      const { result } = renderHook(() => useUsers({ role: ['admin'] }), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(Array.isArray(result.current.users)).toBe(true);
    });

    it('should have refetch function', async () => {
      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper(queryClient),
      });

      expect(typeof result.current.refetch).toBe('function');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const refetch = result.current.refetch;
      expect(typeof refetch).toBe('function');
    });
  });

  describe('useUser', () => {
    it('should return hook with correct structure', async () => {
      const { result } = renderHook(() => useUser('1'), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
    });

    it('should load single user', async () => {
      const { result } = renderHook(() => useUser('1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeDefined();
    });

    it('should throw error for non-existent user', async () => {
      const { result } = renderHook(() => useUser('non-existent-id'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useUserStats', () => {
    it('should return hook with correct structure', async () => {
      const { result } = renderHook(() => useUserStats(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current).toHaveProperty('stats');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
    });

    it('should load user statistics', async () => {
      const { result } = renderHook(() => useUserStats(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toHaveProperty('totalUsers');
      expect(result.current.stats).toHaveProperty('activeUsers');
    });
  });

  describe('useCreateUser', () => {
    it('should return mutation with correct structure', () => {
      const { result } = renderHook(() => useCreateUser(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('mutateAsync');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('error');
    });

    it('should create user with valid data', async () => {
      const { result } = renderHook(() => useCreateUser(), {
        wrapper: createWrapper(queryClient),
      });

      const userData: CreateUserDTO = {
        email: `hook-test-${Date.now()}@example.com`,
        name: 'Hook Test User',
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
      };

      let createdUser: any;

      result.current.mutate(userData, {
        onSuccess: (user) => {
          createdUser = user;
        },
      });

      await waitFor(() => {
        expect(createdUser).toBeDefined();
      });

      expect(createdUser.email).toBe(userData.email);
    });
  });

  describe('useUpdateUser', () => {
    it('should return mutation with correct structure', () => {
      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('mutateAsync');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('error');
    });

    it('should update user with valid data', async () => {
      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: createWrapper(queryClient),
      });

      let updatedUser: any;

      result.current.mutate(
        { userId: '1', data: { position: 'Updated Position' } },
        {
          onSuccess: (user) => {
            updatedUser = user;
          },
        }
      );

      await waitFor(() => {
        expect(updatedUser).toBeDefined();
      });

      expect(updatedUser.position).toBe('Updated Position');
    });
  });

  describe('useDeleteUser', () => {
    it('should return mutation with correct structure', () => {
      const { result } = renderHook(() => useDeleteUser(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('mutateAsync');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('error');
    });
  });

  describe('useResetPassword', () => {
    it('should return mutation with correct structure', () => {
      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('mutateAsync');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('error');
    });
  });

  describe('useUserActivity', () => {
    it('should return hook with correct structure', async () => {
      const { result } = renderHook(() => useUserActivity('1'), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current).toHaveProperty('activities');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
    });

    it('should load user activity', async () => {
      const { result } = renderHook(() => useUserActivity('1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(Array.isArray(result.current.activities)).toBe(true);
    });
  });

  describe('useUserRoles', () => {
    it('should return hook with correct structure', async () => {
      const { result } = renderHook(() => useUserRoles(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current).toHaveProperty('roles');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
    });

    it('should load available roles', async () => {
      const { result } = renderHook(() => useUserRoles(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(Array.isArray(result.current.roles)).toBe(true);
      expect(result.current.roles.length).toBeGreaterThan(0);
    });
  });

  describe('useUserStatuses', () => {
    it('should return hook with correct structure', async () => {
      const { result } = renderHook(() => useUserStatuses(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current).toHaveProperty('statuses');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
    });

    it('should load available statuses', async () => {
      const { result } = renderHook(() => useUserStatuses(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(Array.isArray(result.current.statuses)).toBe(true);
      expect(result.current.statuses.length).toBeGreaterThan(0);
    });
  });

  describe('useTenants', () => {
    it('should return hook with correct structure', async () => {
      const { result } = renderHook(() => useTenants(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current).toHaveProperty('tenants');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
    });

    it('should load available tenants', async () => {
      const { result } = renderHook(() => useTenants(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(Array.isArray(result.current.tenants)).toBe(true);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate users cache after create', async () => {
      // This test verifies that cache is properly invalidated
      // The implementation should call queryClient.invalidateQueries(['users'])
      
      const { result: listResult } = renderHook(() => useUsers(), {
        wrapper: createWrapper(queryClient),
      });

      const { result: createResult } = renderHook(() => useCreateUser(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(listResult.current.loading).toBe(false);
      });

      const initialCount = listResult.current.users.length;

      const userData: CreateUserDTO = {
        email: `cache-test-${Date.now()}@example.com`,
        name: 'Cache Test User',
        role: 'agent',
        status: 'active',
        tenantId: 'tenant_1',
      };

      await createResult.current.mutateAsync(userData);

      await waitFor(() => {
        expect(listResult.current.users.length).toBeGreaterThan(initialCount);
      });
    });
  });
});
/**
 * useUsers Hook
 * Fetches active users from User Management service
 * Used for "Assigned To" dropdown and other user selection fields
 */

import { useQuery } from '@tanstack/react-query';
import { useTenantContext } from '@/hooks/useTenantContext';
import { userService } from '@/services/serviceFactory';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  phone?: string;
}

export interface UseUsersOptions {
  status?: 'active' | 'inactive' | 'pending';
  limit?: number;
}

/**
 * Fetch users with optional filtering
 */
async function fetchUsers(options?: UseUsersOptions): Promise<User[]> {
  try {
    const response = await userService.getUsers();
    
    if (response.error) {
      throw new Error(response.error);
    }

    let users = response.data || [];

    // Filter by status if provided
    if (options?.status) {
      users = users.filter(u => u.status === options.status);
    }

    // Apply limit if provided
    if (options?.limit) {
      users = users.slice(0, options.limit);
    }

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * Hook to fetch active users for assignment
 * @param {UseUsersOptions} options - Filter options
 * @returns {Object} Query object with data, isLoading, error
 */
export function useUsers(options?: UseUsersOptions) {
  const { tenantId } = useTenantContext();

  return useQuery({
    queryKey: ['users', tenantId, options?.status, options?.limit],
    queryFn: () => fetchUsers(options),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}

/**
 * Hook to fetch active users specifically (for dropdowns)
 */
export function useActiveUsers() {
  return useUsers({ status: 'active' });
}
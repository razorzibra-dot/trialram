/**
 * useActiveUsers Hook
 * Shared hook for loading active users for "Assigned To" dropdowns
 * Used across ALL modules for consistency
 * 
 * Features:
 * - Fetches only active users from tenant
 * - Caches results for 5 minutes
 * - Automatically filters by current tenant
 * - Returns standardized User interface
 * - Integrates with serviceFactory pattern
 * 
 * Usage:
 * ```tsx
 * const { data: users = [], isLoading: usersLoading } = useActiveUsers();
 * 
 * <Select loading={usersLoading}>
 *   {users.map(user => (
 *     <Select.Option key={user.id} value={user.id}>
 *       {user.firstName} {user.lastName}
 *     </Select.Option>
 *   ))}
 * </Select>
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import { useTenantContext } from './useTenantContext';
import { userService } from '@/services/serviceFactory';

/**
 * User interface for assignment dropdowns
 * Matches database schema from users table
 */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  phone?: string;
}

/**
 * Fetch active users from the user service
 * Filters for active status only
 * @param tenantId - Current tenant ID for filtering
 * @returns Array of active users
 */
async function fetchActiveUsers(tenantId: string): Promise<User[]> {
  try {
    const response = await userService.getUsers();

    // Support both array responses (Supabase/mock services) and legacy { data } wrappers
    const usersArray = Array.isArray(response)
      ? response
      : Array.isArray((response as any)?.data)
        ? (response as any).data
        : [];

    // Filter for active users only
    const activeUsers = usersArray.filter((u: any) => u.status === 'active');

    return activeUsers as User[];
  } catch (error) {
    console.error('[useActiveUsers] Error fetching active users:', error);
    throw error;
  }
}

/**
 * Hook to fetch active users for assignment dropdowns
 * - Automatically filters by current tenant (via RLS)
 * - Caches results for 5 minutes
 * - Only fetches active users
 * 
 * @returns Query object with data, isLoading, error, refetch
 */
export function useActiveUsers() {
  const { tenantId } = useTenantContext();

  return useQuery({
    queryKey: ['active-users', tenantId],
    queryFn: () => fetchActiveUsers(tenantId!),
    enabled: !!tenantId, // Only fetch if tenant is set
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 3, // Retry failed requests 3 times
  });
}

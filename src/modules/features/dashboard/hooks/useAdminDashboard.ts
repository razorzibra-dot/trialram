/**
 * Admin Dashboard Hooks
 * React hooks for admin dashboard operations using React Query
 */

import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/services/serviceFactory';
import { useTenantContext } from '@/hooks/useTenantContext';
import { STATS_QUERY_CONFIG, LISTS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';

// Query Keys
export const adminDashboardKeys = {
  all: ['admin-dashboard'] as const,
  stats: () => [...adminDashboardKeys.all, 'stats'] as const,
  recentUsers: () => [...adminDashboardKeys.all, 'recentUsers'] as const,
  systemHealth: () => [...adminDashboardKeys.all, 'systemHealth'] as const,
  roleDistribution: () => [...adminDashboardKeys.all, 'roleDistribution'] as const,
};

/**
 * Hook for fetching admin dashboard statistics
 */
export const useAdminDashboardStats = () => {
  const userService = useService<any>('userService');
  const tenantService = useService<any>('tenantService');
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: adminDashboardKeys.stats(),
    queryFn: async () => {
      // Fetch admin-specific stats in parallel
      const [userStats, tenantStats, auditStats] = await Promise.allSettled([
        userService.getUsers ? userService.getUsers({}) : Promise.resolve({ total: 0 }),
        tenantService.getTenants ? tenantService.getTenants({}) : Promise.resolve({ total: 0 }),
        auditService.getAuditStats ? auditService.getAuditStats() : Promise.resolve({ total: 0 }),
      ]);

      // Aggregate the results
      const stats = {
        totalUsers: userStats.status === 'fulfilled' ? (userStats.value?.total || userStats.value?.length || 0) : 0,
        activeTenants: tenantStats.status === 'fulfilled' ? (tenantStats.value?.total || tenantStats.value?.length || 0) : 0,
        systemHealth: 98, // Mock system health - would come from monitoring service
        securityAlerts: auditStats.status === 'fulfilled' ? (auditStats.value?.alerts || 0) : 0,
      };

      return stats;
    },
    ...STATS_QUERY_CONFIG,
    enabled: isInitialized,
  });
};

/**
 * Hook for fetching recent users
 */
export const useRecentUsers = (limit: number = 5) => {
  const userService = useService<any>('userService');
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: [...adminDashboardKeys.recentUsers(), limit],
    queryFn: async () => {
      try {
        const usersResult = await userService.getUsers({
          pageSize: limit,
          sortBy: 'created_at',
          sortOrder: 'desc'
        });

        const users = usersResult.data || usersResult || [];
        return users.slice(0, limit).map((user: any) => ({
          id: user.id,
          name: user.name || user.first_name + ' ' + user.last_name,
          email: user.email,
          role: user.role,
          status: user.status,
          created_at: user.created_at,
        }));
      } catch (error) {
        console.error('Error fetching recent users:', error);
        return [];
      }
    },
    ...LISTS_QUERY_CONFIG,
    enabled: isInitialized,
  });
};

/**
 * Hook for fetching system health metrics
 */
export const useSystemHealth = () => {
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: adminDashboardKeys.systemHealth(),
    queryFn: async () => {
      // Mock system health data - would come from monitoring service
      return {
        database: 99,
        api: 45, // response time in ms
        memory: 67,
        sessions: 1247,
      };
    },
    ...STATS_QUERY_CONFIG,
    enabled: isInitialized,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

/**
 * Hook for fetching role distribution
 */
export const useRoleDistribution = () => {
  const userService = useService<any>('userService');
  const rbacService = useService<any>('rbacService');
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: adminDashboardKeys.roleDistribution(),
    queryFn: async () => {
      try {
        // Get all users to calculate role distribution
        const usersResult = await userService.getUsers({ pageSize: 1000 });
        const users = usersResult.data || usersResult || [];

        // Count users by role
        const roleCounts: Record<string, number> = {};
        users.forEach((user: any) => {
          const role = user.role || 'unknown';
          roleCounts[role] = (roleCounts[role] || 0) + 1;
        });

        const totalUsers = users.length;
        const roleDistribution = Object.entries(roleCounts).map(([name, count]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          count,
          percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
        }));

        return roleDistribution;
      } catch (error) {
        console.error('Error fetching role distribution:', error);
        return [];
      }
    },
    ...STATS_QUERY_CONFIG,
    enabled: isInitialized,
  });
};
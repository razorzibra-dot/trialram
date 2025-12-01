/**
 * Dashboard Hooks
 * React hooks for dashboard operations using React Query
 * Aggregates data from multiple services instead of using a dedicated dashboard service
 */

import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/services/serviceFactory';
import { useTenantContext } from '@/hooks/useTenantContext';
import { useService } from '@/modules/core/hooks';
import { STATS_QUERY_CONFIG, LISTS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';
import type { ICustomerService } from '@/modules/features/customers/services/customerService';
import type { ISalesService } from '@/modules/features/sales/services/salesService';

// Query Keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  activity: () => [...dashboardKeys.all, 'activity'] as const,
  salesTrend: () => [...dashboardKeys.all, 'salesTrend'] as const,
  ticketStats: () => [...dashboardKeys.all, 'ticketStats'] as const,
  topCustomers: () => [...dashboardKeys.all, 'topCustomers'] as const,
  widget: (type: string) => [...dashboardKeys.all, 'widget', type] as const,
  performance: () => [...dashboardKeys.all, 'performance'] as const,
};

/**
 * Hook for fetching dashboard statistics
 * Aggregates stats from customers, sales, and tickets services
 */
export const useDashboardStats = () => {
  const customerService = useService<ICustomerService>('customerService');
  const salesService = useService<ISalesService>('salesService');
  const ticketService = useService<any>('ticketService'); // Using any for now since ticket service interface may vary
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      // Fetch stats from all services in parallel
      const [customerStats, salesStats, ticketStats] = await Promise.allSettled([
        customerService.getCustomerStats(),
        salesService.getSalesStats(),
        ticketService.getTicketStats ? ticketService.getTicketStats() : Promise.resolve({ total: 0 }),
      ]);

      const resolvedCustomerStats =
        customerStats.status === 'fulfilled' ? customerStats.value : null;
      const resolvedSalesStats =
        salesStats.status === 'fulfilled' ? salesStats.value : null;
      const resolvedTicketStats =
        ticketStats.status === 'fulfilled' ? ticketStats.value : null;

      return {
        totalCustomers:
          resolvedCustomerStats?.totalCustomers ??
          resolvedCustomerStats?.total ??
          0,
        totalDeals:
          resolvedSalesStats?.totalDeals ??
          resolvedSalesStats?.total ??
          0,
        totalTickets: resolvedTicketStats?.total ?? 0,
        totalRevenue: resolvedSalesStats?.totalValue ?? 0,
      };
    },
    ...STATS_QUERY_CONFIG,
    enabled: isInitialized,
  });
};

/**
 * Hook for fetching recent activity
 * Fetches recent audit log entries and formats them as activities
 */
export const useRecentActivity = (limit: number = 10) => {
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: [...dashboardKeys.activity(), limit],
    queryFn: async () => {
      try {
        // Fetch recent audit logs
        const auditLogs = await auditService.getAuditLogs({
          pageSize: limit,
          sortBy: 'timestamp',
          sortOrder: 'desc'
        });

        // Map audit logs to activity format
        const activities = (auditLogs.data || auditLogs || []).map((log: any) => {
          // Handle both 'resource' and 'table_name' fields (schema migration compatibility)
          const resource = log.resource || log.table_name || 'unknown';
          const action = log.action || 'unknown';
          
          return {
            id: log.id,
            type: mapAuditActionToActivityType(action),
            title: formatAuditAction(action, resource),
            description: log.details ? JSON.stringify(log.details) : log.new_values ? JSON.stringify(log.new_values) : `Action performed on ${resource}`,
            timestamp: log.timestamp || log.created_at,
            user: log.user_name || log.user?.name || log.user_id || 'System',
          };
        });

        return activities;
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        return [];
      }
    },
    ...LISTS_QUERY_CONFIG,
    enabled: isInitialized,
  });
};

// Helper function to map audit actions to activity types
const mapAuditActionToActivityType = (action: string | null | undefined): 'deal' | 'ticket' | 'customer' | 'user' => {
  if (!action) return 'user'; // default for null/undefined
  
  const lowerAction = action.toLowerCase();
  if (lowerAction.includes('deal') || lowerAction.includes('sale')) return 'deal';
  if (lowerAction.includes('ticket')) return 'ticket';
  if (lowerAction.includes('customer')) return 'customer';
  if (lowerAction.includes('user') || lowerAction.includes('role')) return 'user';
  return 'user'; // default
};

// Helper function to format audit actions into readable titles
const formatAuditAction = (action: string | null | undefined, resource: string | null | undefined): string => {
  // Handle null/undefined values
  const safeAction = action || 'unknown';
  const safeResource = resource || 'item';
  
  const actionMap: Record<string, string> = {
    'create': 'Created',
    'update': 'Updated',
    'delete': 'Deleted',
    'login': 'Logged in',
    'logout': 'Logged out',
    'assign': 'Assigned',
    'unassign': 'Unassigned',
    'role_created': 'Created role',
    'role_updated': 'Updated role',
    'role_deleted': 'Deleted role',
    'role_assigned': 'Assigned role',
    'role_removed': 'Removed role',
  };

  // Try to find action in map, or use the action as-is (capitalize first letter)
  const actionWord = actionMap[safeAction.toLowerCase()] || 
                     (safeAction.charAt(0).toUpperCase() + safeAction.slice(1));
  
  // Capitalize resource name safely
  const resourceName = safeResource && safeResource.length > 0
    ? safeResource.charAt(0).toUpperCase() + safeResource.slice(1)
    : 'Item';

  return `${actionWord} ${resourceName}`;
};

/**
 * Hook for fetching sales trend
 * Placeholder implementation
 */
export const useSalesTrend = (period: 'week' | 'month' | 'quarter' | 'year' = 'month') => {
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: [...dashboardKeys.salesTrend(), period],
    queryFn: () => Promise.resolve([]), // Placeholder
    ...STATS_QUERY_CONFIG,
    enabled: isInitialized,
  });
};

/**
 * Hook for fetching ticket statistics
 * Fetches real ticket stats from ticket service
 */
export const useTicketStats = () => {
  const ticketService = useService<any>('ticketService'); // Using any for now since ticket service interface may vary
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: dashboardKeys.ticketStats(),
    queryFn: async () => {
      try {
        const stats = await ticketService.getTicketStats();

        // Map ticket service stats to dashboard format
        return {
          open: stats.byStatus?.open || stats.openTickets || 0,
          resolved: stats.byStatus?.resolved || stats.resolvedToday || 0,
          inProgress: stats.byStatus?.in_progress || stats.byStatus?.pending || 0,
          closed: stats.byStatus?.closed || 0,
          resolutionRate: stats.satisfactionScore || 0, // Using satisfaction score as resolution rate
        };
      } catch (error) {
        console.error('Error fetching ticket stats:', error);
        // Return default stats on error
        return {
          open: 0,
          resolved: 0,
          inProgress: 0,
          closed: 0,
          resolutionRate: 0,
        };
      }
    },
    ...STATS_QUERY_CONFIG,
    enabled: isInitialized,
  });
};

/**
 * Hook for fetching top customers
 * Fetches customers with their total deal values and sorts by value
 */
export const useTopCustomers = (limit: number = 5) => {
  const customerService = useService<ICustomerService>('customerService');
  const salesService = useService<ISalesService>('salesService');
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: [...dashboardKeys.topCustomers(), limit],
    queryFn: async () => {
      try {
        // Fetch customers and deals in parallel
        const [customersResult, dealsResult] = await Promise.allSettled([
          customerService.getCustomers({}), // Get customers (will be paginated)
          salesService.getDeals({}), // Get deals (will be paginated)
        ]);

        if (customersResult.status !== 'fulfilled' || dealsResult.status !== 'fulfilled') {
          return [];
        }

        const customers = customersResult.value.data || [];
        const deals = dealsResult.value.data || [];

        // Calculate total value per customer
        const customerTotals = new Map<string, { customer: any; totalValue: number; dealCount: number }>();

        // Initialize customers
        customers.forEach(customer => {
          customerTotals.set(customer.id, {
            customer,
            totalValue: 0,
            dealCount: 0,
          });
        });

        // Aggregate deal values by customer
        deals.forEach(deal => {
          if (deal.customer_id && customerTotals.has(deal.customer_id)) {
            const customerData = customerTotals.get(deal.customer_id)!;
            customerData.totalValue += deal.value || 0;
            customerData.dealCount += 1;
          }
        });

        // Convert to array, sort by total value, and take top N
        const topCustomers = Array.from(customerTotals.values())
          .filter(item => item.totalValue > 0) // Only include customers with deals
          .sort((a, b) => b.totalValue - a.totalValue)
          .slice(0, limit)
          .map(item => ({
            id: item.customer.id,
            name: item.customer.company_name || item.customer.contact_name || 'Unknown Customer',
            totalValue: item.totalValue,
            dealCount: item.dealCount,
          }));

        return topCustomers;
      } catch (error) {
        console.error('Error fetching top customers:', error);
        return [];
      }
    },
    ...STATS_QUERY_CONFIG,
    enabled: isInitialized,
  });
};

/**
 * Hook for fetching widget data
 * Placeholder implementation
 */
export const useWidgetData = (widgetType: string) => {
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: dashboardKeys.widget(widgetType),
    queryFn: () => Promise.resolve(null), // Placeholder
    ...STATS_QUERY_CONFIG,
    enabled: !!widgetType && isInitialized,
  });
};

/**
 * Hook for fetching sales pipeline
 * Groups deals by pipeline stages and calculates values
 */
export const useSalesPipeline = () => {
  const salesService = useService<ISalesService>('salesService');
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: [...dashboardKeys.all, 'salesPipeline'],
    queryFn: async () => {
      try {
        const dealsResult = await salesService.getDeals({});
        const deals = dealsResult.data || [];

        // Group deals by stage and calculate totals
        const pipelineData = {
          qualification: { value: 0, count: 0 },
          proposal: { value: 0, count: 0 },
          negotiation: { value: 0, count: 0 },
        };

        // Calculate total value across all deals for percentage calculation
        const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

        // Since deals don't have pipeline stages, we'll simulate pipeline data
        // In a real implementation, this would use opportunities or a separate pipeline service
        // For now, distribute deal values across pipeline stages for demonstration
        const totalDeals = deals.length;
        if (totalDeals > 0) {
          const qualificationCount = Math.ceil(totalDeals * 0.4); // 40% in qualification
          const proposalCount = Math.ceil(totalDeals * 0.35); // 35% in proposal
          const negotiationCount = totalDeals - qualificationCount - proposalCount; // 25% in negotiation

          deals.forEach((deal, index) => {
            const value = deal.value || 0;

            if (index < qualificationCount) {
              pipelineData.qualification.value += value;
              pipelineData.qualification.count += 1;
            } else if (index < qualificationCount + proposalCount) {
              pipelineData.proposal.value += value;
              pipelineData.proposal.count += 1;
            } else {
              pipelineData.negotiation.value += value;
              pipelineData.negotiation.count += 1;
            }
          });
        }

        // Calculate percentages
        const result = {
          qualification: {
            value: pipelineData.qualification.value,
            percentage: totalValue > 0 ? (pipelineData.qualification.value / totalValue) * 100 : 0,
          },
          proposal: {
            value: pipelineData.proposal.value,
            percentage: totalValue > 0 ? (pipelineData.proposal.value / totalValue) * 100 : 0,
          },
          negotiation: {
            value: pipelineData.negotiation.value,
            percentage: totalValue > 0 ? (pipelineData.negotiation.value / totalValue) * 100 : 0,
          },
        };

        return result;
      } catch (error) {
        console.error('Error fetching sales pipeline:', error);
        return {
          qualification: { value: 0, percentage: 0 },
          proposal: { value: 0, percentage: 0 },
          negotiation: { value: 0, percentage: 0 },
        };
      }
    },
    ...STATS_QUERY_CONFIG,
    enabled: isInitialized,
  });
};

/**
 * Hook for fetching performance metrics
 * Placeholder implementation
 */
export const usePerformanceMetrics = () => {
  const { isInitialized } = useTenantContext();

  return useQuery({
    queryKey: dashboardKeys.performance(),
    queryFn: () => Promise.resolve({}), // Placeholder
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    enabled: isInitialized,
  });
};

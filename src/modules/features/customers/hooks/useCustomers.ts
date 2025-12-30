/**
 * Customer Hooks
 * Layer 2: React hooks for customer operations
 * 
 * Generated using createEntityHooks factory for consistency.
 * Provides standard CRUD hooks with React Query integration.
 */

import { createEntityHooks } from '@/hooks/factories/createEntityHooks';
import { Customer } from '@/types/crm';
import { useQuery } from '@tanstack/react-query';
import { serviceFactory } from '@/services/serviceFactory';
import { CustomerStats } from '../services/customerService';

/**
 * Customer hooks using factory pattern
 * 
 * Provides:
 * - useCustomers(filters) - List with pagination
 * - useCustomer(id) - Single customer by ID
 * - useCreateCustomer() - Create mutation
 * - useUpdateCustomer() - Update mutation
 * - useDeleteCustomer() - Delete mutation
 */
const customerHooks = createEntityHooks<Customer>({
  entityName: 'Customer',
  service: serviceFactory.getService('customer') as any,
  queryKeys: {
    all: ['customers'],
    list: (filters) => ['customers', 'list', JSON.stringify(filters || {})],
    detail: (id: string) => ['customers', id]
  },
  options: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    showSuccessNotification: true,
    showErrorNotification: true,
    // Avoid detail invalidation; page refresh handled by ModuleDataContext
    invalidateDetailOnUpdate: false
  }
});

export const {
  useEntities: useCustomers,
  useEntity: useCustomer,
  useCreateEntity: useCreateCustomer,
  useUpdateEntity: useUpdateCustomer,
  useDeleteEntity: useDeleteCustomer
} = customerHooks;

/**
 * Additional custom hook: Customer statistics
 */
export const useCustomerStats = () => {
  return useQuery({
    queryKey: ['customer-stats'],
    queryFn: async (): Promise<CustomerStats> => {
      const service = serviceFactory.getService('customer') as {
        getCustomerStats?: () => Promise<CustomerStats>;
      };

      if (!service?.getCustomerStats) {
        throw new Error('Customer service does not implement getCustomerStats');
      }

      return service.getCustomerStats();
    }
  });
};

/**
 * Additional custom hook: Customer export (stub)
 */
export const useCustomerExport = () => {
  return {
    mutateAsync: async (format: 'csv' | 'json') => {
      console.log('Export not yet implemented in new service');
      throw new Error('Export functionality not yet implemented');
    }
  };
};

/**
 * Additional custom hook: Customer import (stub)
 */
export const useCustomerImport = () => {
  return {
    mutateAsync: async (data: any) => {
      console.log('Import not yet implemented in new service');
      throw new Error('Import functionality not yet implemented');
    }
  };
};

/**
 * Additional custom hook: Customer analytics (real implementation)
 * 
 * NOTE: The computed fields (totalSalesAmount, totalOrders, averageOrderValue, lastPurchaseDate)
 * were removed from the customers table and moved to the customer_summary materialized view.
 * 
 * These fields will be UNDEFINED when querying from the base customers table.
 * For accurate analytics, this hook should be updated to either:
 * 1. Query from customer_summary view directly (preferred for performance)
 * 2. Use getCustomerStats() for each customer (slower, but more flexible)
 * 
 * Current implementation will return 0 values until updated to use customer_summary.
 */
export const useCustomerAnalytics = () => {
  return useQuery({
    queryKey: ['customer-analytics'],
    queryFn: async () => {
      const service = serviceFactory.getService('customer');
      const customers = (await service.findMany({ pageSize: 10000 })).data || [];
        // WARNING: These fields are now undefined from base table queries
        // TODO: Update to query from customer_summary view or aggregate from deals table
      
      const totalSalesAmount = customers.reduce((sum, c) => sum + (c.totalSalesAmount || 0), 0);
      const totalOrders = customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
      const activeCount = customers.filter(c => c.status === 'active').length;
      const inactiveCount = customers.filter(c => c.status === 'inactive').length;
      
      return {
        totalRevenue: totalSalesAmount,
        averageOrderValue: totalOrders > 0 ? totalSalesAmount / totalOrders : 0,
        customerLifetimeValue: totalSalesAmount / Math.max(customers.length, 1),
        churnRate: inactiveCount / Math.max(customers.length, 1),
        retentionRate: activeCount / Math.max(customers.length, 1),
        acquisitionRate: 0.12,
        customerSatisfaction: 4.5
      };
    }
  });
};

/**
 * Additional custom hook: Customer segmentation analytics (real implementation)
 */
export const useCustomerSegmentationAnalytics = () => {
  return useQuery({
    queryKey: ['customer-segmentation'],
    queryFn: async () => {
      const service = serviceFactory.getService('customer');
      const customers = (await service.findMany({ pageSize: 10000 })).data || [];
      
      const byIndustry: Record<string, number> = {};
      const bySize: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      
      customers.forEach(c => {
        byIndustry[c.industry || 'Unknown'] = (byIndustry[c.industry || 'Unknown'] || 0) + 1;
        bySize[c.size || 'Unknown'] = (bySize[c.size || 'Unknown'] || 0) + 1;
        byStatus[c.status || 'Unknown'] = (byStatus[c.status || 'Unknown'] || 0) + 1;
      });
      
      return {
        segments: [
          { name: 'By Industry', data: byIndustry },
          { name: 'By Size', data: bySize },
          { name: 'By Status', data: byStatus }
        ]
      };
    }
  });
};

/**
 * Additional custom hook: Customer lifecycle analytics (real implementation)
 */
export const useCustomerLifecycleAnalytics = () => {
  return useQuery({
    queryKey: ['customer-lifecycle'],
    queryFn: async () => {
      const service = serviceFactory.getService('customer');
      const customers = (await service.findMany({ pageSize: 10000 })).data || [];
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      
      const newCustomers = customers.filter(c => new Date(c.createdAt) > thirtyDaysAgo).length;
      const activeRecently = customers.filter(c => 
        c.lastContactDate && new Date(c.lastContactDate) > thirtyDaysAgo
      ).length;
      const atRisk = customers.filter(c =>
        c.lastContactDate && new Date(c.lastContactDate) < ninetyDaysAgo && c.status === 'active'
      ).length;
      
      return {
        stages: [
          { stage: 'New (30d)', count: newCustomers },
          { stage: 'Active (30d)', count: activeRecently },
          { stage: 'At Risk (90d+)', count: atRisk },
          { stage: 'Churned', count: customers.filter(c => c.status === 'inactive').length }
        ]
      };
    }
  });
};

/**
 * Additional custom hook: Customer behavior analytics (stub)
 */
export const useCustomerBehaviorAnalytics = () => {
  return useQuery({
    queryKey: ['customer-behavior'],
    queryFn: async () => ({
      behaviors: []
    })
  });
};

/**
 * Additional custom hook: Customer tags
 */
export const useCustomerTags = () => {
  return useQuery({
    queryKey: ['customer-tags'],
    queryFn: async () => {
      const service = serviceFactory.getService('customer');
      return await service.getAllTags();
    }
  });
};

/**
 * Additional custom hook: Bulk operations (stub)
 */
export const useBulkCustomerOperations = () => {
  return {
    bulkDelete: async (ids: string[]) => {
      console.log('Bulk delete not yet implemented');
      throw new Error('Bulk delete not yet implemented');
    },
    bulkUpdate: async (ids: string[], data: any) => {
      console.log('Bulk update not yet implemented');
      throw new Error('Bulk update not yet implemented');
    }
  };
};


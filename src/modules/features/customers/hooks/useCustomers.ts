/**
 * Customer Hooks
 * Standardized React hooks for customer operations using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCustomerStore } from '../store/customerStore';
import { CustomerFilters, CreateCustomerData, ICustomerService } from '../services/customerService';
import { useService } from '@/modules/core/hooks/useService';
import { LISTS_QUERY_CONFIG, DETAIL_QUERY_CONFIG, STATS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';
import { handleError } from '@/modules/core/utils/errorHandler';
import type { Customer, CustomerTag } from '@/types/crm';
import { useNotification } from '@/hooks/useNotification';

/**
 * Query key factory for consistent cache management
 * Ensures all queries can be invalidated correctly
 */
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters: CustomerFilters) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  stats: () => [...customerKeys.all, 'stats'] as const,
  tags: () => [...customerKeys.all, 'tags'] as const,
  analytics: () => [...customerKeys.all, 'analytics'] as const,
  segmentation: () => [...customerKeys.all, 'segmentation'] as const,
  lifecycle: () => [...customerKeys.all, 'lifecycle'] as const,
  behavior: () => [...customerKeys.all, 'behavior'] as const,
} as const;

/**
 * Fetch customers with filters and pagination
 * Uses store for local state management
 *
 * @param filters - Optional filters (search, status, etc.)
 * @returns Query result with data, loading, error states
 *
 * @example
 * const { data: customers, isLoading, error } = useCustomers({
 *   status: 'active'
 * });
 */
export const useCustomers = (filters: CustomerFilters = {}) => {
  const service = useService<ICustomerService>('customerService');
  const { setCustomers, setLoading, setError } = useCustomerStore();

  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: async () => {
      try {
        setLoading(true);
        const response = await service.getCustomers(filters);
        setCustomers(response.data);
        return response;
      } catch (error) {
        const message = handleError(error, 'useCustomers');
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    ...LISTS_QUERY_CONFIG,
  });
};

/**
 * Fetch single customer by ID
 *
 * @param id - Customer ID
 * @returns Query result with customer data
 *
 * @example
 * const { data: customer } = useCustomer(customerId);
 */
export const useCustomer = (id: string) => {
  const service = useService<ICustomerService>('customerService');
  const { setSelectedCustomer } = useCustomerStore();

  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: async () => {
      const customer = await service.getCustomer(id);
      setSelectedCustomer(customer);
      return customer;
    },
    ...DETAIL_QUERY_CONFIG,
    enabled: !!id,
  });
};

/**
 * Fetch customer statistics
 *
 * @returns Query result with stats
 *
 * @example
 * const { data: stats } = useCustomerStats();
 */
export const useCustomerStats = () => {
  const service = useService<ICustomerService>('customerService');

  return useQuery({
    queryKey: customerKeys.stats(),
    queryFn: () => service.getCustomerStats(),
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Create new customer mutation
 *
 * @returns Mutation object with mutate function
 *
 * @example
 * const { mutate: createCustomer } = useCreateCustomer();
 * createCustomer({ name: 'ACME Corp' });
 */
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const service = useService<ICustomerService>('customerService');
  const store = useCustomerStore();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: (data: CreateCustomerData) => service.createCustomer(data),
    onSuccess: (newCustomer) => {
      (store as any).addCustomer(newCustomer);
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
      success('Customer created successfully');
    },
    onError: (error) => {
      const message = handleError(error, 'useCreateCustomer');
      error(message);
    },
  });
};

/**
 * Update customer mutation
 */
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const service = useService<ICustomerService>('customerService');
  const store = useCustomerStore();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCustomerData> }) =>
      service.updateCustomer(id, data),
    onSuccess: (updatedCustomer) => {
      (store as any).updateCustomer(updatedCustomer.id, updatedCustomer);
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(updatedCustomer.id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
      success('Customer updated successfully');
    },
    onError: (error) => {
      const message = handleError(error, 'useUpdateCustomer');
      error(message);
    },
  });
};

/**
 * Delete customer mutation
 */
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  const service = useService<ICustomerService>('customerService');
  const store = useCustomerStore();
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: (id: string) => service.deleteCustomer(id),
    onSuccess: (_, id) => {
      (store as any).removeCustomer(id);
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
      success('Customer deleted successfully');
    },
    onError: (error) => {
      const message = handleError(error, 'useDeleteCustomer');
      error(message);
    },
  });
};

/**
 * Export customers mutation
 */
export const useCustomerExport = () => {
  const service = useService<ICustomerService>('customerService');
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: (format: 'csv' | 'json') => service.exportCustomers(format),
    onSuccess: () => {
      success('Customers exported successfully');
    },
    onError: (error) => {
      const message = handleError(error, 'useCustomerExport');
      error(message);
    },
  });
};

/**
 * Import customers mutation
 */
export const useCustomerImport = () => {
  const queryClient = useQueryClient();
  const service = useService<ICustomerService>('customerService');
  const { success, error } = useNotification();

  return useMutation({
    mutationFn: (data: string) => service.importCustomers(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
      success('Customers imported successfully');
    },
    onError: (error) => {
      const message = handleError(error, 'useCustomerImport');
      error(message);
    },
  });
};

/**
 * Fetch customer tags
 *
 * @returns Query result with tags data
 *
 * @example
 * const { data: tags } = useCustomerTags();
 */
export const useCustomerTags = () => {
  const service = useService<ICustomerService>('customerService');

  return useQuery({
    queryKey: customerKeys.tags(),
    queryFn: () => service.getTags(),
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Bulk customer operations mutation
 */
export const useBulkCustomerOperations = () => {
  const queryClient = useQueryClient();
  const service = useService<ICustomerService>('customerService');
  const store = useCustomerStore();

  return useMutation({
    mutationFn: async ({
      operation,
      ids,
      updates
    }: {
      operation: 'delete' | 'update';
      ids: string[];
      updates?: Partial<CreateCustomerData>
    }) => {
      if (operation === 'delete') {
        return service.bulkDeleteCustomers(ids);
      } else if (operation === 'update' && updates) {
        return service.bulkUpdateCustomers(ids, updates);
      }
      throw new Error('Invalid bulk operation');
    },
    onSuccess: (_, { operation, ids, updates }) => {
      if (operation === 'delete') {
        ids.forEach(id => (store as any).removeCustomer(id));
      } else if (operation === 'update' && updates) {
        // For updates, we need to refetch since we don't have the updated data
        queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      }
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
    },
    onError: (error) => {
      handleError(error, 'useBulkCustomerOperations');
    },
  });
};

/**
 * Fetch customer analytics
 *
 * @param filters - Optional filters for analytics
 * @returns Query result with analytics data
 *
 * @example
 * const { data: analytics } = useCustomerAnalytics();
 */
export const useCustomerAnalytics = (filters?: {
  dateRange?: { start: string; end: string };
  segment?: string;
  industry?: string;
}) => {
  const service = useService<ICustomerService>('customerService');

  return useQuery({
    queryKey: customerKeys.analytics(),
    queryFn: () => service.getCustomerAnalytics(filters),
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Fetch customer segmentation analytics
 *
 * @returns Query result with segmentation data
 *
 * @example
 * const { data: segmentation } = useCustomerSegmentationAnalytics();
 */
export const useCustomerSegmentationAnalytics = () => {
  const service = useService<ICustomerService>('customerService');

  return useQuery({
    queryKey: customerKeys.segmentation(),
    queryFn: () => service.getCustomerSegmentationAnalytics(),
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Fetch customer lifecycle analytics
 *
 * @returns Query result with lifecycle data
 *
 * @example
 * const { data: lifecycle } = useCustomerLifecycleAnalytics();
 */
export const useCustomerLifecycleAnalytics = () => {
  const service = useService<ICustomerService>('customerService');

  return useQuery({
    queryKey: customerKeys.lifecycle(),
    queryFn: () => service.getCustomerLifecycleAnalytics(),
    ...STATS_QUERY_CONFIG,
  });
};

/**
 * Fetch customer behavior analytics
 *
 * @returns Query result with behavior data
 *
 * @example
 * const { data: behavior } = useCustomerBehaviorAnalytics();
 */
export const useCustomerBehaviorAnalytics = () => {
  const service = useService<ICustomerService>('customerService');

  return useQuery({
    queryKey: customerKeys.behavior(),
    queryFn: () => service.getCustomerBehaviorAnalytics(),
    ...STATS_QUERY_CONFIG,
  });
};

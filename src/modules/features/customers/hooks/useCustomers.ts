/**
 * Customer Hooks
 * React hooks for customer operations
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useInvalidateQueries } from '@/modules/core/hooks/useQuery';
import { useCustomerStore } from '../store/customerStore';
import { CustomerFilters, CreateCustomerData, ICustomerService } from '../services/customerService';
import { useService } from '@/modules/core/hooks/useService';
import { useTenantContext } from '@/hooks/useTenantContext';
import { LISTS_QUERY_CONFIG, DETAIL_QUERY_CONFIG, STATS_QUERY_CONFIG } from '@/modules/core/constants/reactQueryConfig';

/**
 * Hook for fetching customers with pagination and filtering
 */
export function useCustomers(filters: CustomerFilters = {}) {
  const customerService = useService<ICustomerService>('customerService');
  const setCustomers = useCustomerStore((state) => state.setCustomers);
  const setPagination = useCustomerStore((state) => state.setPagination);
  const setError = useCustomerStore((state) => state.setError);
  const customers = useCustomerStore((state) => state.customers);
  const pagination = useCustomerStore((state) => state.pagination);
  const isLoading = useCustomerStore((state) => state.isLoading);
  const error = useCustomerStore((state) => state.error);
  
  const { isInitialized: isTenantInitialized } = useTenantContext();

  const queryKey = [
    'customers',
    filters.search,
    filters.status,
    filters.industry,
    filters.size,
    filters.assignedTo,
    filters.tags?.join(','),
    filters.dateRange?.start,
    filters.dateRange?.end,
    filters.page,
    filters.pageSize,
  ];

  const query = useQuery(
    queryKey,
    async () => {
      try {
        return await customerService.getCustomers(filters);
      } catch (err) {
        console.error('[useCustomers] Error fetching customers:', err);
        throw err;
      }
    },
    {
      ...LISTS_QUERY_CONFIG,
      enabled: isTenantInitialized,
      onSuccess: (data) => {
        const customerArray = Array.isArray(data) ? data : (data?.data || []);
        const pageNum = data?.page || 1;
        const pageSize = data?.pageSize || 20;
        const total = data?.total || (Array.isArray(data) ? data.length : 0);
        
        setCustomers(customerArray);
        setPagination({
          page: pageNum,
          pageSize: pageSize,
          total: total,
        });
        setError(null);
      },
      onError: (error) => {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch customers';
        if (!errorMsg.includes('Tenant context not initialized')) {
          setError(errorMsg);
        }
      },
    }
  );

  return {
    customers,
    pagination,
    isLoading: query.isLoading || isLoading,
    error: query.error || error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching a single customer
 */
export function useCustomer(id: string) {
  const customerService = useService<ICustomerService>('customerService');
  const setSelectedCustomer = useCustomerStore((state) => state.setSelectedCustomer);
  const { isInitialized: isTenantInitialized } = useTenantContext();

  return useQuery(
    ['customer', id],
    () => customerService.getCustomer(id),
    {
      ...DETAIL_QUERY_CONFIG,
      enabled: !!id && isTenantInitialized,
      onSuccess: (customer) => {
        setSelectedCustomer(customer);
      },
    }
  );
}

/**
 * Hook for creating a customer
 */
export function useCreateCustomer() {
  const customerService = useService<ICustomerService>('customerService');
  const addCustomer = useCustomerStore((state) => state.addCustomer);
  const { invalidate } = useInvalidateQueries();

  return useMutation(
    (data: CreateCustomerData) => customerService.createCustomer(data),
    {
      onSuccess: (customer) => {
        addCustomer(customer);
        invalidate(['customers']);
      },
      showSuccessNotification: true,
      successMessage: 'Customer created successfully',
    }
  );
}

/**
 * Hook for updating a customer
 */
export function useUpdateCustomer() {
  const customerService = useService<ICustomerService>('customerService');
  const updateCustomer = useCustomerStore((state) => state.updateCustomer);
  const { invalidate } = useInvalidateQueries();

  return useMutation(
    ({ id, data }: { id: string; data: Partial<CreateCustomerData> }) =>
      customerService.updateCustomer(id, data),
    {
      onSuccess: (customer) => {
        updateCustomer(customer.id, customer);
        invalidate(['customers']);
        invalidate(['customer', customer.id]);
      },
      showSuccessNotification: true,
      successMessage: 'Customer updated successfully',
    }
  );
}

/**
 * Hook for deleting a customer
 */
export function useDeleteCustomer() {
  const customerService = useService<ICustomerService>('customerService');
  const removeCustomer = useCustomerStore((state) => state.removeCustomer);
  const { invalidate } = useInvalidateQueries();

  return useMutation(
    (id: string) => customerService.deleteCustomer(id),
    {
      onSuccess: (_, id) => {
        removeCustomer(id);
        invalidate(['customers']);
      },
      showSuccessNotification: true,
      successMessage: 'Customer deleted successfully',
    }
  );
}

/**
 * Hook for bulk operations
 */
export function useBulkCustomerOperations() {
  const customerService = useService<ICustomerService>('customerService');
  const bulkDeleteCustomers = useCustomerStore((state) => state.bulkDeleteCustomers);
  const bulkUpdateCustomers = useCustomerStore((state) => state.bulkUpdateCustomers);
  const clearSelection = useCustomerStore((state) => state.clearSelection);
  const { invalidate } = useInvalidateQueries();

  const bulkDelete = useMutation(
    (ids: string[]) => customerService.bulkDeleteCustomers(ids),
    {
      onSuccess: (_, ids) => {
        bulkDeleteCustomers(ids);
        clearSelection();
        invalidate(['customers']);
      },
      showSuccessNotification: true,
      successMessage: 'Customers deleted successfully',
    }
  );

  const bulkUpdate = useMutation(
    ({ ids, updates }: { ids: string[]; updates: Partial<CreateCustomerData> }) =>
      customerService.bulkUpdateCustomers(ids, updates),
    {
      onSuccess: (customers, { ids, updates }) => {
        bulkUpdateCustomers(ids, updates);
        clearSelection();
        invalidate(['customers']);
      },
      showSuccessNotification: true,
      successMessage: 'Customers updated successfully',
    }
  );

  return {
    bulkDelete,
    bulkUpdate,
  };
}

/**
 * Hook for customer tags
 */
export function useCustomerTags() {
  const customerService = useService<ICustomerService>('customerService');
  const setTags = useCustomerStore((state) => state.setTags);
  const addTag = useCustomerStore((state) => state.addTag);
  const tags = useCustomerStore((state) => state.tags);

  const tagsQuery = useQuery(
    ['customer-tags'],
    () => customerService.getTags(),
    {
      ...LISTS_QUERY_CONFIG,
      onSuccess: setTags,
    }
  );

  const createTag = useMutation(
    ({ name, color }: { name: string; color: string }) =>
      customerService.createTag(name, color),
    {
      onSuccess: (tag) => {
        addTag(tag);
      },
      showSuccessNotification: true,
      successMessage: 'Tag created successfully',
    }
  );

  return {
    tags,
    isLoading: tagsQuery.isLoading,
    createTag,
    refetch: tagsQuery.refetch,
  };
}

/**
 * Hook for customer statistics
 */
export function useCustomerStats() {
  const customerService = useService<ICustomerService>('customerService');
  const { isInitialized: isTenantInitialized } = useTenantContext();

  return useQuery(
    ['customer-stats'],
    async () => {
      try {
        if (typeof customerService.getCustomerStats !== 'function') {
          throw new Error('getCustomerStats is not available on customer service');
        }
        return await customerService.getCustomerStats();
      } catch (error) {
        console.error('[useCustomerStats] Error fetching stats:', error);
        throw error;
      }
    },
    {
      ...STATS_QUERY_CONFIG,
      enabled: isTenantInitialized,
    }
  );
}

/**
 * Hook for customer export
 */
export function useCustomerExport() {
  const customerService = useService<ICustomerService>('customerService');

  return useMutation(
    (format: 'csv' | 'json' = 'csv') => customerService.exportCustomers(format),
    {
      onSuccess: (data, format) => {
        const blob = new Blob([data], { 
          type: format === 'csv' ? 'text/csv' : 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `customers.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      showSuccessNotification: true,
      successMessage: 'Customers exported successfully',
    }
  );
}

/**
 * Hook for customer import
 */
export function useCustomerImport() {
  const customerService = useService<ICustomerService>('customerService');
  const { invalidate } = useInvalidateQueries();

  return useMutation(
    (csv: string) => customerService.importCustomers(csv),
    {
      onSuccess: (result) => {
        invalidate(['customers']);
        if (result.errors.length > 0) {
          console.warn('[useCustomerImport] Import completed with errors:', result.errors);
        }
      },
      showSuccessNotification: true,
      successMessage: 'Customers imported successfully',
    }
  );
}

/**
 * Hook for customer search
 */
export function useCustomerSearch() {
  const customerService = useService<ICustomerService>('customerService');

  return useCallback(
    (query: string) => customerService.searchCustomers(query),
    [customerService]
  );
}

/**
 * Customer Hooks
 * React hooks for customer operations
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useInvalidateQueries } from '@/modules/core/hooks/useQuery';
import { useCustomerStore } from '../store/customerStore';
import { CustomerService, CustomerFilters, CreateCustomerData } from '../services/customerService';
import { inject } from '@/modules/core/services/ServiceContainer';
import { useTenantContext } from '@/hooks/useTenantContext';

// Get customer service instance
const getCustomerService = () => inject<CustomerService>('customerService');

/**
 * Hook for fetching customers with pagination and filtering
 */
export function useCustomers(filters: CustomerFilters = {}) {
  const setCustomers = useCustomerStore((state) => state.setCustomers);
  const setPagination = useCustomerStore((state) => state.setPagination);
  const setError = useCustomerStore((state) => state.setError);
  const customers = useCustomerStore((state) => state.customers);
  const pagination = useCustomerStore((state) => state.pagination);
  const isLoading = useCustomerStore((state) => state.isLoading);
  const error = useCustomerStore((state) => state.error);
  
  // Get tenant context to check if tenant is initialized
  // Uses the same reliable pattern as Dashboard hooks
  const { isInitialized: isTenantInitialized, tenantId } = useTenantContext();

  // Create a stable query key by serializing filter values
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

  console.log('[useCustomers] Query state:', { 
    isTenantInitialized, 
    tenantId,
    enabled: isTenantInitialized,
    customersCount: customers.length
  });

  const query = useQuery(
    queryKey,
    async () => {
      console.log('[useCustomers] Query function executing with filters:', filters);
      try {
        const result = await getCustomerService().getCustomers(filters);
        console.log('[useCustomers] Query function resolved with result:', result);
        return result;
      } catch (err) {
        console.error('[useCustomers] Query function caught error:', err);
        throw err;
      }
    },
    {
      // Only run query when tenant is initialized
      enabled: isTenantInitialized,
      onSuccess: (data) => {
        console.log('[useCustomers] onSuccess callback triggered with data:', data);
        setCustomers(data.data);
        setPagination({
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
        });
        setError(null);
      },
      onError: (error) => {
        console.log('[useCustomers] onError callback triggered with error:', error);
        // Only set error if it's not a tenant initialization issue
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch customers';
        if (!errorMsg.includes('Tenant context not initialized')) {
          setError(errorMsg);
        }
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
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
  const setSelectedCustomer = useCustomerStore((state) => state.setSelectedCustomer);
  const { isInitialized: isTenantInitialized } = useTenantContext();

  return useQuery(
    ['customer', id],
    () => getCustomerService().getCustomer(id),
    {
      enabled: !!id && isTenantInitialized,
      onSuccess: (customer) => {
        setSelectedCustomer(customer);
      },
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook for creating a customer
 */
export function useCreateCustomer() {
  const addCustomer = useCustomerStore((state) => state.addCustomer);
  const { invalidate } = useInvalidateQueries();

  return useMutation(
    (data: CreateCustomerData) => getCustomerService().createCustomer(data),
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
  const updateCustomer = useCustomerStore((state) => state.updateCustomer);
  const { invalidate } = useInvalidateQueries();

  return useMutation(
    ({ id, data }: { id: string; data: Partial<CreateCustomerData> }) =>
      getCustomerService().updateCustomer(id, data),
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
  const removeCustomer = useCustomerStore((state) => state.removeCustomer);
  const { invalidate } = useInvalidateQueries();

  return useMutation(
    (id: string) => getCustomerService().deleteCustomer(id),
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
  const bulkDeleteCustomers = useCustomerStore((state) => state.bulkDeleteCustomers);
  const bulkUpdateCustomers = useCustomerStore((state) => state.bulkUpdateCustomers);
  const clearSelection = useCustomerStore((state) => state.clearSelection);
  const { invalidate } = useInvalidateQueries();

  const bulkDelete = useMutation(
    (ids: string[]) => getCustomerService().bulkDeleteCustomers(ids),
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
      getCustomerService().bulkUpdateCustomers(ids, updates),
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
  const setTags = useCustomerStore((state) => state.setTags);
  const addTag = useCustomerStore((state) => state.addTag);
  const tags = useCustomerStore((state) => state.tags);

  const tagsQuery = useQuery(
    ['customer-tags'],
    () => getCustomerService().getTags(),
    {
      onSuccess: setTags,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const createTag = useMutation(
    ({ name, color }: { name: string; color: string }) =>
      getCustomerService().createTag(name, color),
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
  const { isInitialized: isTenantInitialized } = useTenantContext();

  return useQuery(
    ['customer-stats'],
    () => getCustomerService().getCustomerStats(),
    {
      enabled: isTenantInitialized,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

/**
 * Hook for customer export
 */
export function useCustomerExport() {
  return useMutation(
    (format: 'csv' | 'json' = 'csv') => getCustomerService().exportCustomers(format),
    {
      onSuccess: (data, format) => {
        // Download the file
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
  const { invalidate } = useInvalidateQueries();

  return useMutation(
    (csv: string) => getCustomerService().importCustomers(csv),
    {
      onSuccess: (result) => {
        invalidate(['customers']);
        if (result.errors.length > 0) {
          console.warn('Import completed with errors:', result.errors);
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
  return useCallback(
    (query: string) => getCustomerService().searchCustomers(query),
    []
  );
}

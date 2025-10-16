/**
 * Customer Hooks
 * React hooks for customer operations
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useInvalidateQueries } from '@/modules/core/hooks/useQuery';
import { useCustomerStore } from '../store/customerStore';
import { CustomerService, CustomerFilters, CreateCustomerData } from '../services/customerService';
import { inject } from '@/modules/core/services/ServiceContainer';

// Get customer service instance
const getCustomerService = () => inject<CustomerService>('customerService');

/**
 * Hook for fetching customers with pagination and filtering
 */
export function useCustomers(filters: CustomerFilters = {}) {
  const {
    setCustomers,
    setPagination,
    setLoading,
    setError,
    customers,
    pagination,
    isLoading,
    error,
  } = useCustomerStore();

  const query = useQuery(
    ['customers', filters],
    () => getCustomerService().getCustomers(filters),
    {
      onSuccess: (data) => {
        setCustomers(data.data);
        setPagination({
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
        });
        setError(null);
      },
      onError: (error) => {
        setError(error instanceof Error ? error.message : 'Failed to fetch customers');
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
  const { setSelectedCustomer } = useCustomerStore();

  return useQuery(
    ['customer', id],
    () => getCustomerService().getCustomer(id),
    {
      enabled: !!id,
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
  const { addCustomer } = useCustomerStore();
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
  const { updateCustomer } = useCustomerStore();
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
  const { removeCustomer } = useCustomerStore();
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
  const { bulkDeleteCustomers, bulkUpdateCustomers, clearSelection } = useCustomerStore();
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
  const { setTags, addTag, tags } = useCustomerStore();

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
  return useQuery(
    ['customer-stats'],
    () => getCustomerService().getCustomerStats(),
    {
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

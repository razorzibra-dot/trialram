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

// Get customer service instance with error handling
const getCustomerService = () => {
  try {
    const service = inject<CustomerService>('customerService');
    if (!service) {
      throw new Error('CustomerService instance is null or undefined');
    }
    return service;
  } catch (error) {
    console.warn('[useCustomers] Failed to get customer service:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

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
    customersCount: customers?.length ?? 0
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
        console.log('[useCustomers] Data type:', typeof data);
        console.log('[useCustomers] Is array?', Array.isArray(data));
        console.log('[useCustomers] data.data:', data?.data);
        console.log('[useCustomers] data.total:', data?.total);
        console.log('[useCustomers] data.page:', data?.page);
        
        // Extract the customer array - handle both formats
        const customerArray = Array.isArray(data) ? data : (data?.data || []);
        const pageNum = data?.page || 1;
        const pageSize = data?.pageSize || 20;
        const total = data?.total || (Array.isArray(data) ? data.length : 0);
        
        console.log('[useCustomers] Setting customers with:', { customerArray: customerArray.length, pageNum, pageSize, total });
        
        setCustomers(customerArray);
        setPagination({
          page: pageNum,
          pageSize: pageSize,
          total: total,
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
    async () => {
      try {
        const service = getCustomerService();
        const protoMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(service) || {});
        const ownMethods = Object.getOwnPropertyNames(service || {});
        
        console.log('[useCustomerStats] Retrieved service:', {
          type: typeof service,
          constructor: (service as any)?.constructor?.name || 'unknown',
          hasGetCustomerStats: typeof (service as any)?.getCustomerStats,
          protoMethodsCount: protoMethods.length,
          protoMethods: protoMethods,
          ownMethods: ownMethods,
          isGetCustomerStatsCallable: typeof (service as any)?.getCustomerStats === 'function'
        });
        
        if (typeof (service as any)?.getCustomerStats !== 'function') {
          console.error('[useCustomerStats] ✗ getCustomerStats is not a function!', {
            service,
            type: typeof (service as any)?.getCustomerStats
          });
          throw new Error(`getCustomerStats is not a function. Got type: ${typeof (service as any)?.getCustomerStats}`);
        }
        
        const result = await (service as any).getCustomerStats();
        console.log('[useCustomerStats] ✓ Retrieved stats:', result);
        return result;
      } catch (error) {
        console.error('[useCustomerStats] ✗ Error retrieving stats:', error);
        throw error;
      }
    },
    {
      enabled: isTenantInitialized,
      onSuccess: (data) => {
        // Log data format information
        console.log('[useCustomerStats] onSuccess callback triggered with data:', data);
        console.log('[useCustomerStats] Data type:', typeof data);
        console.log('[useCustomerStats] Is array?', Array.isArray(data));
        console.log('[useCustomerStats] Data structure:', {
          totalCustomers: (data as any)?.totalCustomers,
          activeCustomers: (data as any)?.activeCustomers,
          inactiveCustomers: (data as any)?.inactiveCustomers,
          prospectCustomers: (data as any)?.prospectCustomers,
          byIndustry: (data as any)?.byIndustry,
          bySize: (data as any)?.bySize,
          byStatus: (data as any)?.byStatus,
        });
        
        // Ensure we have the expected structure
        if (!data || typeof data !== 'object') {
          console.warn('[useCustomerStats] ⚠️ Stats data is not an object:', data);
        }
        
        // Verify all required fields exist (from Supabase service)
        const requiredFields = ['totalCustomers', 'activeCustomers', 'prospectCustomers'];
        const missingFields = requiredFields.filter(field => !(field in (data as any)));
        if (missingFields.length > 0) {
          console.warn('[useCustomerStats] ⚠️ Missing fields in stats:', missingFields);
        } else {
          console.log('[useCustomerStats] ✅ All required fields present - stats are valid!');
        }
      },
      onError: (error) => {
        console.error('[useCustomerStats] onError callback triggered with error:', error);
      },
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

/**
 * Shared hook for customer selection dropdowns
 * Provides consistent customer list with React Query caching across all modules
 * 
 * Usage pattern (similar to useActiveUsers):
 * - Fetches active customers for dropdown selection
 * - 5-minute cache to reduce database load
 * - Tenant-filtered via RLS
 * - Returns formatted options ready for Select component
 * 
 * @example
 * ```tsx
 * import { useCustomersDropdown } from '@/hooks/useCustomersDropdown';
 * 
 * const { data: customerOptions = [], isLoading } = useCustomersDropdown();
 * 
 * <Select
 *   options={customerOptions}
 *   loading={isLoading}
 *   placeholder="Select customer"
 * />
 * ```
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { serviceFactory } from '@/services/serviceFactory';
import { Customer } from '@/types/crm';
import { useOptionalModuleData } from '@/contexts/ModuleDataContext';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';

/**
 * Customer dropdown option format
 * Matches Ant Design Select option structure
 */
export interface CustomerDropdownOption {
  label: string;
  value: string;
  customer: Customer; // Full customer object for additional rendering
}

/**
 * Fetch active customers from the customer service
 * Uses factory service pattern to route to correct backend (Supabase/Mock)
 * Filters for active status only
 * @returns Array of active customers
 */
async function fetchActiveCustomers(): Promise<Customer[]> {
  try {
    console.log('[useCustomersDropdown] ⚡ Fetching active customers via factory service...');
    console.log('[useCustomersDropdown] API Mode:', import.meta.env.VITE_API_MODE);
    
    const svc = serviceFactory.getService('customer') as any;

    // Try the newer findMany/getAll shape first; fallback to legacy getCustomers if present
    const response = typeof svc.findMany === 'function'
      ? await svc.findMany({ status: 'active', pageSize: 500 })
      : typeof svc.getAll === 'function'
      ? await svc.getAll({ status: 'active', pageSize: 500 })
      : typeof svc.getCustomers === 'function'
      ? await svc.getCustomers({ status: 'active' })
      : [];

    console.log('[useCustomersDropdown] ✅ Response received:', {
      isArray: Array.isArray(response),
      hasData: response && typeof response === 'object' && 'data' in response,
      responseType: typeof response,
      dataLength: Array.isArray(response) ? response.length : response?.data?.length
    });

    // ✅ Support both array responses (Supabase) and paginated { data } wrappers (Mock)
    const customersArray = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];

    console.log('[useCustomersDropdown] 📦 Customers extracted:', {
      count: customersArray.length,
      sample: customersArray[0] ? {
        id: customersArray[0].id,
        company_name: customersArray[0].company_name,
        contact_name: customersArray[0].contact_name,
        status: customersArray[0].status,
        tenant_id: customersArray[0].tenant_id
      } : 'NO CUSTOMERS FOUND'
    });

    if (customersArray.length === 0) {
      console.warn('[useCustomersDropdown] ⚠️ NO CUSTOMERS FOUND - Check:');
      console.warn('  1. Database has customers for your tenant');
      console.warn('  2. RLS policies allow access');
      console.warn('  3. Tenant context is initialized');
    }

    return customersArray as Customer[];
  } catch (error) {
    console.error('[useCustomersDropdown] ❌ Error fetching customers:', error);
    return []; // Return empty array on error to prevent undefined
  }
}

/**
 * Fetch active customers for dropdown selection
 * 
 * Features:
 * - React Query caching (5 minutes)
 * - Tenant isolation via RLS
 * - Active customers only
 * - Formatted for Ant Design Select
 * - Uses factory service pattern (routes to Supabase/Mock)
 * 
 * @returns React Query result with customerOptions array
 */
export const useCustomersDropdown = () => {
  // Opportunistically read preloaded module data if available
  const moduleCtx = useOptionalModuleData();
  const currentTenant = useCurrentTenant();
  const preloadedActiveCustomers: Customer[] | undefined = useMemo(() => {
    const raw = moduleCtx?.data?.moduleData?.customers;
    if (!raw) return undefined;

    // Support both array and { data } shapes
    const list: Customer[] = Array.isArray(raw)
      ? (raw as Customer[])
      : Array.isArray((raw as any)?.data)
      ? ((raw as any).data as Customer[])
      : [];

    if (!list.length) return [];
    return list.filter(c => (c as any)?.status === 'active');
  }, [moduleCtx?.data?.moduleData?.customers]);

  const enabled = !!currentTenant?.id && !preloadedActiveCustomers; // Only fetch if tenant ready and no preloaded data

  return useQuery({
    queryKey: ['customers', 'dropdown', 'active', currentTenant?.id || 'none'],
    queryFn: fetchActiveCustomers,
    // Enterprise React Query defaults
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000,
    enabled,
    initialData: preloadedActiveCustomers,
    select: (customers): CustomerDropdownOption[] => {
      const arr = Array.isArray(customers) ? customers : [];
      return arr.map(customer => ({
        label: `${(customer as any).companyName || (customer as any).company_name || ''}${(customer as any).contactName || (customer as any).contact_name ? ' • ' + ((customer as any).contactName || (customer as any).contact_name) : ''}`,
        value: customer.id,
        customer,
      }));
    },
  });
};

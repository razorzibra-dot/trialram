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

import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/services/serviceFactory';
import { Customer } from '@/types/crm';

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
    
    // ✅ Use factory service - routes to Supabase or Mock based on VITE_API_MODE
    // ✅ Note: SupabaseCustomerService doesn't support page/pageSize, only status filter
    const response = await customerService.getCustomers({ 
      status: 'active'
    });

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
  return useQuery({
    queryKey: ['customers', 'dropdown', 'active'],
    queryFn: fetchActiveCustomers,
    staleTime: 0, // ⚠️ TEMP: Force fresh fetch every time for debugging
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    // ❌ REMOVED initialData - it was preventing queryFn from being called!
    refetchOnMount: true, // Force refetch when component mounts
    refetchOnWindowFocus: false,
    select: (customers): CustomerDropdownOption[] => {
      if (!Array.isArray(customers)) {
        console.warn('[useCustomersDropdown] Select received non-array:', typeof customers);
        return [];
      }
      console.log('[useCustomersDropdown] Transforming customers to options, count:', customers.length);
      return customers.map(customer => ({
        label: `${customer.company_name}${customer.contact_name ? ' • ' + customer.contact_name : ''}`,
        value: customer.id,
        customer,
      }));
    },
  });
};

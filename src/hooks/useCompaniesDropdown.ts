/**
 * Shared hook for company selection dropdowns
 * Provides consistent company list with React Query caching across all modules
 * 
 * Usage pattern (similar to useActiveUsers):
 * - Fetches active companies for dropdown selection
 * - 5-minute cache to reduce database load
 * - Tenant-filtered via RLS
 * - Returns formatted options ready for Select component
 * 
 * @example
 * ```tsx
 * import { useCompaniesDropdown } from '@/hooks/useCompaniesDropdown';
 * 
 * const { data: companyOptions = [], isLoading } = useCompaniesDropdown();
 * 
 * <Select
 *   options={companyOptions}
 *   loading={isLoading}
 *   placeholder="Select company"
 * />
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/serviceFactory';

/**
 * Company interface matching database schema
 */
export interface Company {
  id: string;
  name: string;
  domain?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  size?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive' | 'suspended';
  plan?: 'free' | 'pro' | 'enterprise';
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Company dropdown option format
 * Matches Ant Design Select option structure
 */
export interface CompanyDropdownOption {
  label: string;
  value: string;
  company: Company; // Full company object for additional rendering
}

/**
 * Fetch active companies from the company service
 * Uses factory service pattern to route to correct backend (Supabase/Mock)
 * Filters for active status only
 * @returns Array of active companies
 */
async function fetchActiveCompanies(): Promise<Company[]> {
  try {
    console.log('[useCompaniesDropdown] ⚡ Fetching active companies via factory service...');
    console.log('[useCompaniesDropdown] API Mode:', import.meta.env.VITE_API_MODE);
    
    // ✅ Use factory service - routes to Supabase or Mock based on VITE_API_MODE
    const response = await companyService.getCompanies({ 
      status: 'active'
    });

    console.log('[useCompaniesDropdown] ✅ Response received:', {
      isArray: Array.isArray(response),
      hasData: response && typeof response === 'object' && 'data' in response,
      responseType: typeof response,
      dataLength: Array.isArray(response) ? response.length : response?.data?.length
    });

    // ✅ Support both array responses (Supabase) and paginated { data } wrappers (Mock)
    const companiesArray = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];

    console.log('[useCompaniesDropdown] 📦 Companies extracted:', {
      count: companiesArray.length,
      sample: companiesArray[0] ? {
        id: companiesArray[0].id,
        name: companiesArray[0].name,
        industry: companiesArray[0].industry,
        status: companiesArray[0].status,
        tenant_id: companiesArray[0].tenant_id
      } : 'NO COMPANIES FOUND'
    });

    if (companiesArray.length === 0) {
      console.warn('[useCompaniesDropdown] ⚠️ NO COMPANIES FOUND - Check:');
      console.warn('  1. Database has companies for your tenant');
      console.warn('  2. RLS policies allow access');
      console.warn('  3. Tenant context is initialized');
    }

    return companiesArray as Company[];
  } catch (error) {
    console.error('[useCompaniesDropdown] ❌ Error fetching companies:', error);
    return []; // Return empty array on error to prevent undefined
  }
}

/**
 * Fetch active companies for dropdown selection
 * 
 * Features:
 * - React Query caching (5 minutes)
 * - Tenant isolation via RLS
 * - Active companies only
 * - Formatted for Ant Design Select
 * - Uses factory service pattern (routes to Supabase/Mock)
 * 
 * @returns React Query result with companyOptions array
 */
export const useCompaniesDropdown = () => {
  return useQuery({
    queryKey: ['companies', 'dropdown', 'active'],
    queryFn: fetchActiveCompanies,
    staleTime: 0, // ⚠️ TEMP: Force fresh fetch every time for debugging
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    // ❌ REMOVED initialData - it was preventing queryFn from being called!
    refetchOnMount: true, // Force refetch when component mounts
    refetchOnWindowFocus: false,
    select: (companies): CompanyDropdownOption[] => {
      if (!Array.isArray(companies)) {
        console.warn('[useCompaniesDropdown] Select received non-array:', typeof companies);
        return [];
      }
      console.log('[useCompaniesDropdown] Transforming companies to options, count:', companies.length);
      return companies.map(company => ({
        label: `${company.name}${company.industry ? ' • ' + company.industry : ''}`,
        value: company.id,
        company,
      }));
    },
  });
};

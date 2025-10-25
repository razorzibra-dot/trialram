/**
 * useCompanySizes Hook
 * Fetches company size options dynamically from configuration
 * Supports both mock and Supabase modes
 */

import { useQuery } from '@tanstack/react-query';
import { useTenantContext } from '@/hooks/useTenantContext';

export interface CompanySize {
  id: string;
  name: string;
  description?: string;
  minEmployees?: number;
  maxEmployees?: number;
}

/**
 * Mock company sizes data
 */
const MOCK_COMPANY_SIZES: CompanySize[] = [
  { id: '1', name: 'Startup', description: 'Startup companies', minEmployees: 1, maxEmployees: 50 },
  { id: '2', name: 'Small', description: 'Small businesses', minEmployees: 51, maxEmployees: 250 },
  { id: '3', name: 'Medium', description: 'Medium-sized companies', minEmployees: 251, maxEmployees: 1000 },
  { id: '4', name: 'Large', description: 'Large enterprises', minEmployees: 1001, maxEmployees: 5000 },
  { id: '5', name: 'Enterprise', description: 'Enterprise-level organizations', minEmployees: 5001 },
];

/**
 * Fetch company sizes from mock data or API
 * In future, this can be extended to fetch from Supabase
 */
async function fetchCompanySizes(): Promise<CompanySize[]> {
  // Currently returns mock data
  // TODO: In future, fetch from Supabase configuration table
  return MOCK_COMPANY_SIZES;
}

/**
 * Hook to fetch company sizes
 * @returns {Object} Query object with data, isLoading, error
 */
export function useCompanySizes() {
  const { tenant } = useTenantContext();

  return useQuery({
    queryKey: ['companySizes'],
    queryFn: fetchCompanySizes,
    enabled: !!tenant?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
}
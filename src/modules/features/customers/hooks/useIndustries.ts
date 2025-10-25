/**
 * useIndustries Hook
 * Fetches industry options dynamically from configuration
 * Supports both mock and Supabase modes
 */

import { useQuery } from '@tanstack/react-query';
import { useTenantContext } from '@/hooks/useTenantContext';

export interface Industry {
  id: string;
  name: string;
  description?: string;
}

/**
 * Mock industries data
 */
const MOCK_INDUSTRIES: Industry[] = [
  { id: '1', name: 'Technology', description: 'Software, IT, Hardware' },
  { id: '2', name: 'Finance', description: 'Banking, Insurance, Investment' },
  { id: '3', name: 'Retail', description: 'Retail, E-commerce, Fashion' },
  { id: '4', name: 'Healthcare', description: 'Healthcare, Pharmaceuticals, Medical Devices' },
  { id: '5', name: 'Manufacturing', description: 'Manufacturing, Industrial, Production' },
  { id: '6', name: 'Education', description: 'Education, Training, E-learning' },
  { id: '7', name: 'Real Estate', description: 'Real Estate, Property Management' },
  { id: '8', name: 'Hospitality', description: 'Hotels, Restaurants, Tourism' },
  { id: '9', name: 'Transportation', description: 'Logistics, Shipping, Airlines' },
  { id: '10', name: 'Telecommunications', description: 'Telecom, Internet, Broadcasting' },
  { id: '11', name: 'Energy', description: 'Oil, Gas, Utilities, Renewable' },
  { id: '12', name: 'Other', description: 'Other industries' },
];

/**
 * Fetch industries from mock data or API
 * In future, this can be extended to fetch from Supabase
 */
async function fetchIndustries(): Promise<Industry[]> {
  // Currently returns mock data
  // TODO: In future, fetch from Supabase configuration table
  return MOCK_INDUSTRIES;
}

/**
 * Hook to fetch industries
 * @returns {Object} Query object with data, isLoading, error
 */
export function useIndustries() {
  const { tenant } = useTenantContext();

  return useQuery({
    queryKey: ['industries'],
    queryFn: fetchIndustries,
    enabled: !!tenant?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
}
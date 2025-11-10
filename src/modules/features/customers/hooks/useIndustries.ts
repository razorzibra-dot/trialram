/**
 * useIndustries Hook
 * Fetches industry options dynamically from reference_data table
 * ✅ Supports both mock and Supabase modes via service factory
 */

import { useQuery } from '@tanstack/react-query';
import { referenceDataService } from '@/services/serviceFactory';
import { ReferenceData } from '@/types/referenceData.types';

export interface Industry {
  id: string;
  name: string;
  description?: string;
}

/**
 * Convert ReferenceData to Industry interface
 */
function mapReferenceDataToIndustry(data: ReferenceData): Industry {
  return {
    id: data.id,
    name: data.label,
    description: data.description,
  };
}

/**
 * Fetch industries from reference_data service
 * ✅ Uses service factory to automatically route between mock and supabase
 */
async function fetchIndustries(): Promise<Industry[]> {
  try {
    const referenceData = await referenceDataService.getReferenceData('industry');
    return referenceData.map(mapReferenceDataToIndustry);
  } catch (error) {
    console.error('Error fetching industries:', error);
    throw error;
  }
}

/**
 * Hook to fetch industries
 * @returns {Object} Query object with data, isLoading, error
 */
export function useIndustries() {
  return useQuery({
    queryKey: ['industries'],
    queryFn: fetchIndustries,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
}
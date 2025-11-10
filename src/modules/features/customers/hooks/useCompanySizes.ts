/**
 * useCompanySizes Hook
 * Fetches company size options dynamically from reference_data table
 * ✅ Supports both mock and Supabase modes via service factory
 */

import { useQuery } from '@tanstack/react-query';
import { referenceDataService } from '@/services/serviceFactory';
import { ReferenceData } from '@/types/referenceData.types';

export interface CompanySize {
  id: string;
  name: string;
  description?: string;
  minEmployees?: number;
  maxEmployees?: number;
}

/**
 * Convert ReferenceData to CompanySize interface
 * Metadata can contain minEmployees and maxEmployees as JSON
 */
function mapReferenceDataToCompanySize(data: ReferenceData): CompanySize {
  const metadata = data.metadata as any || {};
  return {
    id: data.id,
    name: data.label,
    description: data.description,
    minEmployees: metadata.minEmployees,
    maxEmployees: metadata.maxEmployees,
  };
}

/**
 * Fetch company sizes from reference_data service
 * ✅ Uses service factory to automatically route between mock and supabase
 */
async function fetchCompanySizes(): Promise<CompanySize[]> {
  try {
    const referenceData = await referenceDataService.getReferenceData('company_size');
    return referenceData.map(mapReferenceDataToCompanySize);
  } catch (error) {
    console.error('Error fetching company sizes:', error);
    throw error;
  }
}

/**
 * Hook to fetch company sizes
 * @returns {Object} Query object with data, isLoading, error
 */
export function useCompanySizes() {
  return useQuery({
    queryKey: ['companySizes'],
    queryFn: fetchCompanySizes,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
}
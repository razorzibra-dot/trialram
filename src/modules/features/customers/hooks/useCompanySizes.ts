/**
 * useCompanySizes Hook
 * Fetches company size options dynamically from reference_data table
 * ✅ Supports both mock and Supabase modes via service factory
 */

import { useMemo } from 'react';
import { ReferenceData } from '@/types/referenceData.types';
import { useReferenceData } from '@/contexts/ReferenceDataContext';

export interface CompanySize {
  id: string;
  key: string;
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
    key: data.key,
    name: data.label,
    description: data.description,
    minEmployees: metadata.minEmployees,
    maxEmployees: metadata.maxEmployees,
  };
}

export function useCompanySizes() {
  const {
    getRefDataByCategory,
    isLoading,
    error,
    refreshReferenceData,
  } = useReferenceData();

  const companySizes = useMemo(() => {
    return getRefDataByCategory('company_size').map(mapReferenceDataToCompanySize);
  }, [getRefDataByCategory]);

  return {
    data: companySizes,
    companySizes,
    isLoading,
    error,
    refetch: refreshReferenceData,
  };
}
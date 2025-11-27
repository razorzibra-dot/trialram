/**
 * useIndustries Hook
 * Fetches industry options dynamically from reference_data table
 * ✅ Supports both mock and Supabase modes via service factory
 */

import { useMemo } from 'react';
import { ReferenceData } from '@/types/referenceData.types';
import { useReferenceData } from '@/contexts/ReferenceDataContext';

export interface Industry {
  id: string;
  key: string;
  name: string;
  description?: string;
}

/**
 * Convert ReferenceData to Industry interface
 */
function mapReferenceDataToIndustry(data: ReferenceData): Industry {
  return {
    id: data.id,
    key: data.key,
    name: data.label,
    description: data.description,
  };
}

export function useIndustries() {
  const {
    getRefDataByCategory,
    isLoading,
    error,
    refreshReferenceData,
  } = useReferenceData();

  const industries = useMemo(() => {
    return getRefDataByCategory('industry').map(mapReferenceDataToIndustry);
  }, [getRefDataByCategory]);

  return {
    data: industries,
    industries,
    isLoading,
    error,
    refetch: refreshReferenceData,
  };
}
/**
 * useLeadSource Hook
 * Fetches lead source options from reference_data table
 */

import { useMemo } from 'react';
import { ReferenceData } from '@/types/referenceData.types';
import { useReferenceData } from '@/contexts/ReferenceDataContext';

export interface LeadSource {
  id: string;
  key: string;
  label: string;
  metadata?: any;
}

function mapReferenceDataToLeadSource(data: ReferenceData): LeadSource {
  return {
    id: data.id,
    key: data.key,
    label: data.label,
    metadata: data.metadata,
  };
}

export function useLeadSource() {
  const {
    getRefDataByCategory,
    isLoading,
    error,
    refreshReferenceData,
  } = useReferenceData();

  const leadSources = useMemo(() => {
    return getRefDataByCategory('lead_source').map(mapReferenceDataToLeadSource);
  }, [getRefDataByCategory]);

  return {
    data: leadSources,
    leadSources,
    isLoading,
    error,
    refetch: refreshReferenceData,
  };
}

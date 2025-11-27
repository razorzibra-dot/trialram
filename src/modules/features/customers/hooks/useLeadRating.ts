/**
 * useLeadRating Hook
 * Fetches lead rating options from reference_data table
 */

import { useMemo } from 'react';
import { ReferenceData } from '@/types/referenceData.types';
import { useReferenceData } from '@/contexts/ReferenceDataContext';

export interface LeadRating {
  id: string;
  key: string;
  label: string;
  metadata?: any;
}

function mapReferenceDataToLeadRating(data: ReferenceData): LeadRating {
  return {
    id: data.id,
    key: data.key,
    label: data.label,
    metadata: data.metadata,
  };
}

export function useLeadRating() {
  const {
    getRefDataByCategory,
    isLoading,
    error,
    refreshReferenceData,
  } = useReferenceData();

  const leadRatings = useMemo(() => {
    return getRefDataByCategory('lead_rating').map(mapReferenceDataToLeadRating);
  }, [getRefDataByCategory]);

  return {
    data: leadRatings,
    leadRatings,
    isLoading,
    error,
    refetch: refreshReferenceData,
  };
}

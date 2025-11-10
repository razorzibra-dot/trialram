/**
 * useLeadSource Hook
 * Fetches lead source options from reference_data table
 */

import { useQuery } from '@tanstack/react-query';
import { referenceDataService } from '@/services/serviceFactory';
import { ReferenceData } from '@/types/referenceData.types';

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

async function fetchLeadSources(): Promise<LeadSource[]> {
  try {
    const referenceData = await referenceDataService.getReferenceData('lead_source');
    return referenceData.map(mapReferenceDataToLeadSource);
  } catch (error) {
    console.error('Error fetching lead sources:', error);
    throw error;
  }
}

export function useLeadSource() {
  return useQuery({
    queryKey: ['lead_sources'],
    queryFn: fetchLeadSources,
    staleTime: 10 * 60 * 1000,
    retry: 3,
  });
}

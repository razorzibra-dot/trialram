/**
 * useLeadRating Hook
 * Fetches lead rating options from reference_data table
 */

import { useQuery } from '@tanstack/react-query';
import { referenceDataService } from '@/services/serviceFactory';
import { ReferenceData } from '@/types/referenceData.types';

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

async function fetchLeadRatings(): Promise<LeadRating[]> {
  try {
    const referenceData = await referenceDataService.getReferenceData('lead_rating');
    return referenceData.map(mapReferenceDataToLeadRating);
  } catch (error) {
    console.error('Error fetching lead ratings:', error);
    throw error;
  }
}

export function useLeadRating() {
  return useQuery({
    queryKey: ['lead_ratings'],
    queryFn: fetchLeadRatings,
    staleTime: 10 * 60 * 1000,
    retry: 3,
  });
}

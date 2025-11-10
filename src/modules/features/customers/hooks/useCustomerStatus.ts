/**
 * useCustomerStatus Hook
 * Fetches customer status options from reference_data table
 */

import { useQuery } from '@tanstack/react-query';
import { referenceDataService } from '@/services/serviceFactory';
import { ReferenceData } from '@/types/referenceData.types';

export interface CustomerStatus {
  id: string;
  key: string;
  label: string;
  metadata?: any;
}

function mapReferenceDataToCustomerStatus(data: ReferenceData): CustomerStatus {
  return {
    id: data.id,
    key: data.key,
    label: data.label,
    metadata: data.metadata,
  };
}

async function fetchCustomerStatus(): Promise<CustomerStatus[]> {
  try {
    const referenceData = await referenceDataService.getReferenceData('customer_status');
    return referenceData.map(mapReferenceDataToCustomerStatus);
  } catch (error) {
    console.error('Error fetching customer status:', error);
    throw error;
  }
}

export function useCustomerStatus() {
  return useQuery({
    queryKey: ['customer_status'],
    queryFn: fetchCustomerStatus,
    staleTime: 10 * 60 * 1000,
    retry: 3,
  });
}

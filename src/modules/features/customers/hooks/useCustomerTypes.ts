/**
 * useCustomerTypes Hook
 * Fetches customer type options from reference_data table
 */

import { useQuery } from '@tanstack/react-query';
import { referenceDataService } from '@/services/serviceFactory';
import { ReferenceData } from '@/types/referenceData.types';

export interface CustomerType {
  id: string;
  key: string;
  label: string;
  metadata?: any;
}

function mapReferenceDataToCustomerType(data: ReferenceData): CustomerType {
  return {
    id: data.id,
    key: data.key,
    label: data.label,
    metadata: data.metadata,
  };
}

async function fetchCustomerTypes(): Promise<CustomerType[]> {
  try {
    const referenceData = await referenceDataService.getReferenceData('customer_type');
    return referenceData.map(mapReferenceDataToCustomerType);
  } catch (error) {
    console.error('Error fetching customer types:', error);
    throw error;
  }
}

export function useCustomerTypes() {
  return useQuery({
    queryKey: ['customer_types'],
    queryFn: fetchCustomerTypes,
    staleTime: 10 * 60 * 1000,
    retry: 3,
  });
}

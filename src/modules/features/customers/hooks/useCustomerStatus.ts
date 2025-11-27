/**
 * useCustomerStatus Hook
 * Fetches customer status options from reference_data table
 */

import { useMemo } from 'react';
import { ReferenceData } from '@/types/referenceData.types';
import { useReferenceData } from '@/contexts/ReferenceDataContext';

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

export function useCustomerStatus() {
  const {
    getRefDataByCategory,
    isLoading,
    error,
    refreshReferenceData,
  } = useReferenceData();

  const customerStatus = useMemo(() => {
    return getRefDataByCategory('customer_status').map(mapReferenceDataToCustomerStatus);
  }, [getRefDataByCategory]);

  return {
    data: customerStatus,
    customerStatus,
    isLoading,
    error,
    refetch: refreshReferenceData,
  };
}

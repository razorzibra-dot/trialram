/**
 * useCustomerTypes Hook
 * Fetches customer type options from reference_data table
 */

import { useMemo } from 'react';
import { ReferenceData } from '@/types/referenceData.types';
import { useReferenceData } from '@/contexts/ReferenceDataContext';

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

export function useCustomerTypes() {
  const {
    getRefDataByCategory,
    isLoading,
    error,
    refreshReferenceData,
  } = useReferenceData();

  const customerTypes = useMemo(() => {
    return getRefDataByCategory('customer_type').map(mapReferenceDataToCustomerType);
  }, [getRefDataByCategory]);

  return {
    data: customerTypes,
    customerTypes,
    isLoading,
    error,
    refetch: refreshReferenceData,
  };
}

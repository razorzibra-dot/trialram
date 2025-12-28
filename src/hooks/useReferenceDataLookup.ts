import { useCallback } from 'react';
import { useReferenceDataByCategory } from './useReferenceDataOptions';
import { useCurrentTenant } from './useCurrentTenant';

/**
 * Hook for looking up reference data metadata (colors, labels, icons) by key
 * Eliminates hardcoded Record<string, string> mappings
 * 
 * @param category - Reference data category (e.g., 'ticket_status', 'complaint_priority')
 * @returns Lookup functions for metadata, colors, and labels
 * 
 * @example
 * const { getColor, getLabel } = useReferenceDataLookup('ticket_status');
 * <Tag color={getColor('open')}>{getLabel('open')}</Tag>
 */
export const useReferenceDataLookup = (category: string) => {
  const currentTenant = useCurrentTenant();
  const tenantId = currentTenant?.id || '';
  
  // Only fetch data if tenant is available
  const { data = [], isLoading } = useReferenceDataByCategory(tenantId, category);

  /**
   * Get full metadata object for a key
   */
  const getMetadata = useCallback(
    (key: string): Record<string, any> => {
      if (!key) return {};
      const item = data.find((d) => d.key === key);
      return item?.metadata || {};
    },
    [data]
  );

  /**
   * Get badge/tag color for a key (from metadata.badgeColor)
   */
  const getColor = useCallback(
    (key: string): string => {
      if (!key) return 'default';
      const metadata = getMetadata(key);
      return metadata.badgeColor || metadata.color || 'default';
    },
    [getMetadata]
  );

  /**
   * Get display label for a key
   */
  const getLabel = useCallback(
    (key: string): string => {
      if (!key) return '';
      const item = data.find((d) => d.key === key);
      return item?.label || key;
    },
    [data]
  );

  /**
   * Get icon for a key (from metadata.icon)
   */
  const getIcon = useCallback(
    (key: string): string | undefined => {
      const metadata = getMetadata(key);
      return metadata.icon;
    },
    [getMetadata]
  );

  return {
    data,
    isLoading,
    getMetadata,
    getColor,
    getLabel,
    getIcon,
  };
};

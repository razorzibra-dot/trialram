/**
 * useProductSalesFilters Hook
 * Manages filter state with URL synchronization
 * Supports filter presets and search debouncing
 */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductSaleFilters } from '@/types/productSales';
import { useProductSalesStore } from '../store/productSalesStore';

/**
 * Filter preset configuration
 */
export interface FilterPreset {
  name: string;
  filters: ProductSaleFilters;
  description?: string;
}

/**
 * Default filter presets for quick filtering
 */
export const DEFAULT_PRESETS: FilterPreset[] = [
  {
    name: 'All Sales',
    filters: {},
    description: 'Show all product sales',
  },
  {
    name: 'New Sales',
    filters: { status: 'new' },
    description: 'Show only new product sales',
  },
  {
    name: 'Renewed Sales',
    filters: { status: 'renewed' },
    description: 'Show renewed product sales',
  },
  {
    name: 'Expired Sales',
    filters: { status: 'expired' },
    description: 'Show expired product sales',
  },
  {
    name: 'High Value',
    filters: { min_amount: 50000 },
    description: 'Sales over $50,000',
  },
];

/**
 * Hook for managing product sales filters
 * Syncs filters with URL search params and store
 * @returns Filter management utilities
 */
export const useProductSalesFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, setFilters, setSearchText, searchText, resetFilters } = useProductSalesStore();
  const [presets, setPresets] = useState<FilterPreset[]>(DEFAULT_PRESETS);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Sync filters with URL on mount and when filters change
  useEffect(() => {
    // Parse URL params and apply to store
    const params = Object.fromEntries(searchParams);
    if (Object.keys(params).length > 0) {
      const urlFilters: ProductSaleFilters = {
        search: params.search,
        customer_id: params.customer_id,
        product_id: params.product_id,
        status: params.status,
        date_from: params.date_from,
        date_to: params.date_to,
        min_amount: params.min_amount ? Number(params.min_amount) : undefined,
        max_amount: params.max_amount ? Number(params.max_amount) : undefined,
      };

      // Filter out undefined values
      Object.keys(urlFilters).forEach((key) => {
        if (urlFilters[key as keyof ProductSaleFilters] === undefined) {
          delete urlFilters[key as keyof ProductSaleFilters];
        }
      });

      setFilters(urlFilters);
    }
  }, [searchParams]);

  /**
   * Update filters and sync with URL
   */
  const updateFilters = useCallback(
    (newFilters: Partial<ProductSaleFilters>) => {
      const updatedFilters = { ...filters, ...newFilters };

      // Remove undefined values
      Object.keys(updatedFilters).forEach((key) => {
        if (updatedFilters[key as keyof ProductSaleFilters] === undefined) {
          delete updatedFilters[key as keyof ProductSaleFilters];
        }
      });

      setFilters(updatedFilters);

      // Update URL params
      const newParams = new URLSearchParams();
      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value !== undefined) {
          newParams.set(key, String(value));
        }
      });

      setSearchParams(newParams);
    },
    [filters, setFilters, setSearchParams]
  );

  /**
   * Debounced search text update
   */
  const updateSearchText = useCallback(
    (text: string, delay = 300) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        setSearchText(text);
        updateFilters({ search: text || undefined });
      }, delay);

      setSearchTimeout(timeout);
    },
    [searchTimeout, setSearchText, updateFilters]
  );

  /**
   * Apply a preset filter
   */
  const applyPreset = useCallback(
    (presetName: string) => {
      const preset = presets.find((p) => p.name === presetName);
      if (preset) {
        updateFilters(preset.filters);
      }
    },
    [presets, updateFilters]
  );

  /**
   * Save current filters as preset
   */
  const saveAsPreset = useCallback(
    (presetName: string, description?: string) => {
      const newPreset: FilterPreset = {
        name: presetName,
        filters,
        description,
      };

      const existingIndex = presets.findIndex((p) => p.name === presetName);
      if (existingIndex >= 0) {
        const updated = [...presets];
        updated[existingIndex] = newPreset;
        setPresets(updated);
      } else {
        setPresets([...presets, newPreset]);
      }
    },
    [filters, presets]
  );

  /**
   * Delete a preset
   */
  const deletePreset = useCallback(
    (presetName: string) => {
      setPresets(presets.filter((p) => p.name !== presetName));
    },
    [presets]
  );

  /**
   * Clear all filters and reset to defaults
   */
  const clearAllFilters = useCallback(() => {
    resetFilters();
    setSearchParams(new URLSearchParams());
  }, [resetFilters, setSearchParams]);

  return {
    // Current state
    filters,
    searchText,
    presets,

    // Update functions
    updateFilters,
    updateSearchText,
    applyPreset,
    saveAsPreset,
    deletePreset,
    clearAllFilters,

    // Utilities
    hasActiveFilters: Object.keys(filters).length > 0 || searchText.length > 0,
  };
};
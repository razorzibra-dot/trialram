/**
 * Generic Table Selection Hook
 * 
 * Enterprise-grade multi-select functionality for any entity type.
 * 
 * ✅ FEATURES:
 * - Type-safe generic implementation
 * - Select all / deselect all
 * - Individual row toggle
 * - Partial selection detection
 * - Configurable ID extraction
 * 
 * ✅ USE CASES:
 * - Batch delete operations
 * - Bulk export
 * - Mass status updates
 * - Multi-item actions
 * 
 * @example
 * const {
 *   selectedIds,
 *   isSelected,
 *   toggleSelection,
 *   toggleAll,
 *   clearSelection,
 *   isAllSelected,
 *   isPartiallySelected
 * } = useTableSelection<Customer>({
 *   items: customers,
 *   getId: (customer) => customer.id,
 *   disabled: loading
 * });
 */

import { useState, useCallback, useMemo } from 'react';

export interface UseTableSelectionOptions<T> {
  /**
   * Array of items available for selection
   */
  items: T[];
  
  /**
   * Function to extract unique ID from item
   * @default (item) => (item as any).id
   */
  getId?: (item: T) => string;
  
  /**
   * Disable selection (e.g., during loading)
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Initial selected IDs
   * @default []
   */
  initialSelectedIds?: string[];
  
  /**
   * Callback when selection changes
   */
  onSelectionChange?: (selectedIds: string[], selectedItems: T[]) => void;
}

export interface UseTableSelectionResult<T> {
  /**
   * Currently selected item IDs
   */
  selectedIds: string[];
  
  /**
   * Selected item count
   */
  selectedCount: number;
  
  /**
   * Check if an item is selected
   */
  isSelected: (item: T) => boolean;
  
  /**
   * Toggle selection for a single item
   */
  toggleSelection: (item: T) => void;
  
  /**
   * Select all visible items
   */
  selectAll: () => void;
  
  /**
   * Deselect all items
   */
  clearSelection: () => void;
  
  /**
   * Toggle between select all and clear all
   */
  toggleAll: () => void;
  
  /**
   * Check if all items are selected
   */
  isAllSelected: boolean;
  
  /**
   * Check if some (but not all) items are selected
   */
  isPartiallySelected: boolean;
  
  /**
   * Get array of selected items (full objects)
   */
  getSelectedItems: () => T[];
  
  /**
   * Check if selection is disabled
   */
  disabled: boolean;
}

export function useTableSelection<T = any>(
  options: UseTableSelectionOptions<T>
): UseTableSelectionResult<T> {
  const {
    items,
    getId = (item: any) => item.id,
    disabled = false,
    initialSelectedIds = [],
    onSelectionChange,
  } = options;

  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  // Compute selection state
  const availableIds = useMemo(() => items.map(getId), [items, getId]);
  
  const selectedCount = selectedIds.length;
  
  const isAllSelected = useMemo(() => {
    if (availableIds.length === 0) return false;
    return availableIds.every(id => selectedIds.includes(id));
  }, [availableIds, selectedIds]);
  
  const isPartiallySelected = useMemo(() => {
    if (selectedCount === 0) return false;
    return !isAllSelected && availableIds.some(id => selectedIds.includes(id));
  }, [selectedCount, isAllSelected, availableIds, selectedIds]);

  // Check if an item is selected
  const isSelected = useCallback(
    (item: T): boolean => {
      if (disabled) return false;
      const id = getId(item);
      return selectedIds.includes(id);
    },
    [selectedIds, getId, disabled]
  );

  // Toggle selection for a single item
  const toggleSelection = useCallback(
    (item: T) => {
      if (disabled) return;
      
      const id = getId(item);
      setSelectedIds(prev => {
        const newIds = prev.includes(id)
          ? prev.filter(existingId => existingId !== id)
          : [...prev, id];
        
        // Trigger callback with selected items
        if (onSelectionChange) {
          const selectedItems = items.filter(i => newIds.includes(getId(i)));
          onSelectionChange(newIds, selectedItems);
        }
        
        return newIds;
      });
    },
    [disabled, getId, items, onSelectionChange]
  );

  // Select all visible items
  const selectAll = useCallback(() => {
    if (disabled) return;
    
    setSelectedIds(availableIds);
    
    if (onSelectionChange) {
      onSelectionChange(availableIds, items);
    }
  }, [disabled, availableIds, items, onSelectionChange]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    if (disabled) return;
    
    setSelectedIds([]);
    
    if (onSelectionChange) {
      onSelectionChange([], []);
    }
  }, [disabled, onSelectionChange]);

  // Toggle between select all and clear all
  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [isAllSelected, clearSelection, selectAll]);

  // Get selected items (full objects)
  const getSelectedItems = useCallback((): T[] => {
    return items.filter(item => selectedIds.includes(getId(item)));
  }, [items, selectedIds, getId]);

  return {
    selectedIds,
    selectedCount,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleAll,
    isAllSelected,
    isPartiallySelected,
    getSelectedItems,
    disabled,
  };
}

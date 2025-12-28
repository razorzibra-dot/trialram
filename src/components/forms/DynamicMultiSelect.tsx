/**
 * LAYER 8: UI COMPONENT - Dynamic Multi Select
 * ============================================================================
 * Reusable multi-select dropdown component that loads options from reference data
 * Part of 8-layer sync pattern for dynamic data loading architecture
 * 
 * ✅ SYNCHRONIZATION:
 * - Uses useReferenceDataOptions hooks (Layer 7)
 * - Returns values matching types from referenceData.types.ts (Layer 2)
 * - Supports categories, suppliers, status, and custom reference data
 * - Loading and error states built-in
 */

import React, { useMemo } from 'react';
import { Select, Spin, Alert } from 'antd';
import { useStatusOptions, useSuppliers, useReferenceDataByCategory } from '@/hooks/useReferenceDataOptions';

export type DynamicMultiSelectType = 'categories' | 'suppliers' | 'status' | 'custom';

interface DynamicMultiSelectProps {
  type: DynamicMultiSelectType;
  module?: string; // Required for type='status'
  category?: string; // Required for type='custom'
  value?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  allowClear?: boolean;
  tenantId: string;
  className?: string;
  showSearch?: boolean;
  maxTagCount?: number | 'responsive';
  filterOption?: (input: string, option?: any) => boolean;
}

/**
 * DynamicMultiSelect Component
 * 
 * Loads options dynamically from reference data tables for multi-selection
 * Replaces hardcoded dropdown values for multi-select scenarios
 * 
 * @example
 * ```tsx
 * // Load multiple categories
 * <DynamicMultiSelect
 *   type="categories"
 *   tenantId="tenant-1"
 *   value={selectedCategories}
 *   onChange={setSelectedCategories}
 *   placeholder="Select categories"
 * />
 * 
 * // Load multiple suppliers
 * <DynamicMultiSelect
 *   type="suppliers"
 *   tenantId="tenant-1"
 *   value={selectedSuppliers}
 *   onChange={setSelectedSuppliers}
 *   placeholder="Select suppliers"
 *   maxTagCount={3}
 * />
 * 
 * // Load multiple statuses
 * <DynamicMultiSelect
 *   type="status"
 *   module="tickets"
 *   tenantId="tenant-1"
 *   value={selectedStatuses}
 *   onChange={setSelectedStatuses}
 *   placeholder="Select statuses"
 * />
 * 
 * // Load multiple departments from reference data
 * <DynamicMultiSelect
 *   type="custom"
 *   category="department"
 *   tenantId="tenant-1"
 *   value={selectedDepartments}
 *   onChange={setSelectedDepartments}
 *   placeholder="Select departments"
 * />
 * ```
 */
export const DynamicMultiSelect: React.FC<DynamicMultiSelectProps> = ({
  type,
  module,
  category,
  value = [],
  onChange,
  placeholder = 'Select...',
  disabled = false,
  required = false,
  allowClear = true,
  tenantId,
  className,
  showSearch = true,
  maxTagCount = 'responsive',
  filterOption,
}) => {
  // Load data based on type
  const suppliersHook = useSuppliers(tenantId);
  const statusHook = useStatusOptions(tenantId, module || '');
  // For categories, use reference_data with category='product_category'
  const categoriesHook = useReferenceDataByCategory(tenantId, 'product_category');
  const customHook = useReferenceDataByCategory(tenantId, category || '');

  // Determine which hook to use
  const getHookData = () => {
    switch (type) {
      case 'categories':
        return {
          options: categoriesHook.options,
          loading: categoriesHook.loading,
          error: categoriesHook.error,
        };
      case 'suppliers':
        return {
          options: suppliersHook.supplierOptions,
          loading: suppliersHook.loading,
          error: suppliersHook.error,
        };
      case 'status':
        return {
          options: statusHook.statusOptions,
          loading: statusHook.loading,
          error: statusHook.error,
        };
      case 'custom':
        return {
          options: customHook.options,
          loading: customHook.loading,
          error: customHook.error,
        };
      default:
        return {
          options: [],
          loading: false,
          error: null,
        };
    }
  };

  const { options, loading, error } = getHookData();

  // Convert options to Ant Design Select format
  const selectOptions = useMemo(
    () => options.map((opt: any) => ({
      label: opt.label,
      value: opt.value,
      disabled: false,
    })),
    [options]
  );

  // Show error state
  if (error) {
    return (
      <Alert
        message="Error loading options"
        description={(error as Error).message}
        type="error"
        showIcon
        className={className}
      />
    );
  }

  // Render Select with loading spinner
  return (
    <Spin spinning={loading}>
      <Select
        mode="multiple"
        value={value && value.length > 0 ? value : undefined}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled || loading}
        allowClear={allowClear}
        options={selectOptions}
        showSearch={showSearch}
        filterOption={filterOption}
        maxTagCount={maxTagCount}
        status={required && (!value || value.length === 0) ? 'error' : undefined}
        className={className}
        notFoundContent={loading ? <Spin size="small" /> : undefined}
      />
    </Spin>
  );
};

export default DynamicMultiSelect;

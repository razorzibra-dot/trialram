/**
 * LAYER 8: UI COMPONENT - Dynamic Select
 * ============================================================================
 * Reusable dropdown component that loads options from reference data
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
import { useStatusOptions, useCategories, useSuppliers, useReferenceDataByCategory } from '@/hooks/useReferenceDataOptions';

export type DynamicSelectType = 'categories' | 'suppliers' | 'status' | 'custom';

interface DynamicSelectProps {
  type: DynamicSelectType;
  module?: string; // Required for type='status'
  category?: string; // Required for type='custom'
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  allowClear?: boolean;
  tenantId: string;
  className?: string;
  showSearch?: boolean;
  filterOption?: (input: string, option?: any) => boolean;
}

/**
 * DynamicSelect Component
 * 
 * Loads options dynamically from reference data tables
 * Replaces hardcoded dropdown values
 * 
 * @example
 * ```tsx
 * // Load categories
 * <DynamicSelect
 *   type="categories"
 *   tenantId="tenant-1"
 *   value={selectedCategory}
 *   onChange={setSelectedCategory}
 *   placeholder="Select a category"
 * />
 * 
 * // Load sales statuses
 * <DynamicSelect
 *   type="status"
 *   module="sales"
 *   tenantId="tenant-1"
 *   value={selectedStatus}
 *   onChange={setSelectedStatus}
 *   placeholder="Select status"
 * />
 * 
 * // Load priorities from reference data
 * <DynamicSelect
 *   type="custom"
 *   category="priority"
 *   tenantId="tenant-1"
 *   value={selectedPriority}
 *   onChange={setSelectedPriority}
 *   placeholder="Select priority"
 * />
 * ```
 */
export const DynamicSelect: React.FC<DynamicSelectProps> = ({
  type,
  module,
  category,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  required = false,
  allowClear = true,
  tenantId,
  className,
  showSearch = true,
  filterOption,
}) => {
  // Load data based on type
  const categoriesHook = useCategories(tenantId);
  const suppliersHook = useSuppliers(tenantId);
  const statusHook = useStatusOptions(tenantId, module || '');
  const customHook = useReferenceDataByCategory(tenantId, category || '');

  // Determine which hook to use
  const getHookData = () => {
    switch (type) {
      case 'categories':
        return {
          options: categoriesHook.categoryOptions,
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
        value={value || undefined}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled || loading}
        allowClear={allowClear}
        options={selectOptions}
        showSearch={showSearch}
        filterOption={filterOption}
        status={required && !value ? 'error' : undefined}
        className={className}
        notFoundContent={loading ? <Spin size="small" /> : undefined}
      />
    </Spin>
  );
};

export default DynamicSelect;

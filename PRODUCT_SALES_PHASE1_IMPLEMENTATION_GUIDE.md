# Product Sales Module - Phase 1 Implementation Guide
**Based on**: Real State Verification Report  
**Duration**: Days 1-2 (18-20 hours)  
**Status**: Ready to execute ✅  
**Last Updated**: 2025-01-29

---

## 🎯 Phase 1 Objective

Create the **foundation infrastructure** that unblocks all downstream work. Without these 4 components, Phase 2+ cannot proceed.

## ⚠️ CRITICAL BLOCKERS - MUST COMPLETE FIRST

These items completely block all other work. Do NOT skip.

---

# 📌 BLOCKER #1: Create Zustand Store

**File**: `src/modules/features/product-sales/store/productSalesStore.ts`  
**Duration**: 2-3 hours  
**Priority**: 🔴 **CRITICAL - BLOCKS ALL COMPONENTS**  
**Completion Criteria**: All state management in place, tested, components can use hooks

## Task 1.1: Create Store Index Export

**File**: `src/modules/features/product-sales/store/index.ts`

```typescript
// src/modules/features/product-sales/store/index.ts
export { useProductSalesStore } from './productSalesStore';
```

**Verification**: 
- [ ] File created
- [ ] Export works in TypeScript
- [ ] No import errors

---

## Task 1.2: Implement Zustand Store

**File**: `src/modules/features/product-sales/store/productSalesStore.ts`

Create a comprehensive Zustand store with the following structure:

```typescript
// Complete implementation - ~300 lines
import { create } from 'zustand';
import { ProductSale, ProductSaleFilters, ProductSalesAnalytics, ProductSaleFormData } from '@/types/productSales';
import { productSaleService } from '@/services';

// State interface
interface ProductSalesState {
  // ========== PRODUCT SALES DATA ==========
  sales: ProductSale[];
  selectedSale: ProductSale | null;
  
  // ========== LOADING & ERROR ==========
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  error: string | null;
  
  // ========== FILTERS & SEARCH ==========
  filters: ProductSaleFilters;
  searchText: string;
  
  // ========== PAGINATION ==========
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  
  // ========== ANALYTICS ==========
  analytics: ProductSalesAnalytics | null;
  analyticsLoading: boolean;
  
  // ========== MODAL STATE ==========
  modals: {
    createOpen: boolean;
    editOpen: boolean;
    detailOpen: boolean;
  };
  
  // ========== FORM STATE ==========
  formData: Partial<ProductSaleFormData> | null;
  formErrors: Record<string, string>;
  
  // ========== ACTIONS: FETCH ==========
  fetchSales: (filters?: ProductSaleFilters, page?: number, limit?: number) => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  selectSale: (sale: ProductSale | null) => void;
  
  // ========== ACTIONS: FILTERS ==========
  setFilters: (filters: ProductSaleFilters) => void;
  setSearchText: (text: string) => void;
  clearFilters: () => void;
  
  // ========== ACTIONS: PAGINATION ==========
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  
  // ========== ACTIONS: CRUD ==========
  createSale: (data: ProductSaleFormData) => Promise<ProductSale>;
  updateSale: (id: string, data: Partial<ProductSaleFormData>) => Promise<ProductSale>;
  deleteSale: (id: string) => Promise<void>;
  
  // ========== ACTIONS: MODALS ==========
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openEditModal: (sale: ProductSale) => void;
  closeEditModal: () => void;
  openDetailModal: (sale: ProductSale) => void;
  closeDetailModal: () => void;
  
  // ========== ACTIONS: FORM ==========
  setFormData: (data: Partial<ProductSaleFormData>) => void;
  clearFormData: () => void;
  setFormError: (field: string, error: string) => void;
  
  // ========== ACTIONS: STATE ==========
  clearError: () => void;
  reset: () => void;
}

// Initial state
const initialState = {
  sales: [],
  selectedSale: null,
  isLoading: false,
  isSaving: false,
  isDeleting: false,
  error: null,
  filters: {},
  searchText: '',
  currentPage: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 0,
  analytics: null,
  analyticsLoading: false,
  modals: {
    createOpen: false,
    editOpen: false,
    detailOpen: false,
  },
  formData: null,
  formErrors: {},
};

// Create store
export const useProductSalesStore = create<ProductSalesState>((set, get) => ({
  ...initialState,

  // ========== FETCH ACTIONS ==========
  fetchSales: async (filters = {}, page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await productSaleService.getProductSales(filters, page, limit);
      set({
        sales: response.data,
        totalCount: response.total,
        totalPages: response.totalPages,
        currentPage: response.page,
        pageSize: response.limit,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch sales';
      set({ error: message, isLoading: false });
    }
  },

  fetchAnalytics: async () => {
    set({ analyticsLoading: true });
    try {
      const analytics = await productSaleService.getProductSalesAnalytics();
      set({ analytics, analyticsLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch analytics';
      set({ error: message, analyticsLoading: false });
    }
  },

  selectSale: (sale) => {
    set({ selectedSale: sale });
  },

  // ========== FILTER ACTIONS ==========
  setFilters: (filters) => {
    set({ filters, currentPage: 1 }); // Reset to page 1 when filters change
  },

  setSearchText: (text) => {
    set({ searchText: text, filters: { ...get().filters, search: text }, currentPage: 1 });
  },

  clearFilters: () => {
    set({ filters: {}, searchText: '', currentPage: 1 });
  },

  // ========== PAGINATION ACTIONS ==========
  setCurrentPage: (page) => {
    set({ currentPage: page });
  },

  setPageSize: (size) => {
    set({ pageSize: size, currentPage: 1 }); // Reset to page 1 when size changes
  },

  // ========== CRUD ACTIONS ==========
  createSale: async (data) => {
    set({ isSaving: true, error: null });
    try {
      const newSale = await productSaleService.createProductSale(data);
      const { sales, totalCount } = get();
      set({
        sales: [newSale, ...sales],
        totalCount: totalCount + 1,
        isSaving: false,
        modals: { ...get().modals, createOpen: false },
        formData: null,
        formErrors: {},
      });
      return newSale;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create sale';
      set({ error: message, isSaving: false });
      throw error;
    }
  },

  updateSale: async (id, data) => {
    set({ isSaving: true, error: null });
    try {
      const updated = await productSaleService.updateProductSale(id, data);
      const sales = get().sales.map(s => (s.id === id ? updated : s));
      set({
        sales,
        selectedSale: updated,
        isSaving: false,
        modals: { ...get().modals, editOpen: false },
        formData: null,
        formErrors: {},
      });
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update sale';
      set({ error: message, isSaving: false });
      throw error;
    }
  },

  deleteSale: async (id) => {
    set({ isDeleting: true, error: null });
    try {
      await productSaleService.deleteProductSale(id);
      const sales = get().sales.filter(s => s.id !== id);
      const totalCount = get().totalCount - 1;
      set({
        sales,
        totalCount,
        selectedSale: get().selectedSale?.id === id ? null : get().selectedSale,
        isDeleting: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete sale';
      set({ error: message, isDeleting: false });
      throw error;
    }
  },

  // ========== MODAL ACTIONS ==========
  openCreateModal: () => {
    set({
      modals: { ...get().modals, createOpen: true },
      formData: null,
      formErrors: {},
    });
  },

  closeCreateModal: () => {
    set({
      modals: { ...get().modals, createOpen: false },
      formData: null,
      formErrors: {},
    });
  },

  openEditModal: (sale) => {
    set({
      selectedSale: sale,
      modals: { ...get().modals, editOpen: true },
      formData: {
        customer_id: sale.customer_id,
        product_id: sale.product_id,
        units: sale.units,
        cost_per_unit: sale.cost_per_unit,
        delivery_date: sale.delivery_date,
        notes: sale.notes,
        attachments: [],
      },
      formErrors: {},
    });
  },

  closeEditModal: () => {
    set({
      modals: { ...get().modals, editOpen: false },
      formData: null,
      formErrors: {},
    });
  },

  openDetailModal: (sale) => {
    set({
      selectedSale: sale,
      modals: { ...get().modals, detailOpen: true },
    });
  },

  closeDetailModal: () => {
    set({
      modals: { ...get().modals, detailOpen: false },
    });
  },

  // ========== FORM ACTIONS ==========
  setFormData: (data) => {
    set({ formData: { ...get().formData, ...data } });
  },

  clearFormData: () => {
    set({ formData: null, formErrors: {} });
  },

  setFormError: (field, error) => {
    set({ formErrors: { ...get().formErrors, [field]: error } });
  },

  // ========== STATE ACTIONS ==========
  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));

export default useProductSalesStore;
```

**Acceptance Criteria**:
- [ ] Store compiles without errors
- [ ] All state properties initialized
- [ ] All actions implemented
- [ ] Can import and use in components
- [ ] No TypeScript errors
- [ ] Zustand devtools integration works

---

# 📌 BLOCKER #2: Create 8 Custom Hooks

**Duration**: 4-5 hours (30 min - 1 hour each)  
**Priority**: 🔴 **CRITICAL - BLOCKS COMPONENTS**  
**Files to Create**:
1. `useProductSales.ts` - Fetch and list management
2. `useProductSaleForm.ts` - Form state and submission
3. `useProductSaleDetail.ts` - Detail view state
4. `useProductSaleFilters.ts` - Advanced filtering
5. `useProductSaleSearch.ts` - Search functionality
6. `useProductSaleAnalytics.ts` - Analytics data
7. `useProductSaleActions.ts` - CRUD operations
8. `useProductSaleExport.ts` - Export functionality

## Task 2.1: useProductSales Hook

**File**: `src/hooks/useProductSales.ts`

```typescript
import { useEffect, useCallback } from 'react';
import { useProductSalesStore } from '@/modules/features/product-sales/store';
import { ProductSaleFilters } from '@/types/productSales';

export const useProductSales = () => {
  const {
    sales,
    isLoading,
    error,
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    filters,
    fetchSales,
    setCurrentPage,
    setPageSize,
    setFilters,
    selectSale,
    clearError,
  } = useProductSalesStore();

  // Load sales on mount and when filters/pagination changes
  useEffect(() => {
    fetchSales(filters, currentPage, pageSize);
  }, [filters, currentPage, pageSize, fetchSales]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, [setCurrentPage]);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
  }, [setPageSize]);

  const handleFilterChange = useCallback((newFilters: ProductSaleFilters) => {
    setFilters(newFilters);
  }, [setFilters]);

  return {
    sales,
    isLoading,
    error,
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    filters,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    onFilterChange: handleFilterChange,
    selectSale,
    clearError,
  };
};
```

**Acceptance Criteria**:
- [ ] Hook fetches sales on mount
- [ ] Hook refetches when filters change
- [ ] Page change handler works
- [ ] Filter change handler works
- [ ] Error handling works
- [ ] TypeScript strict mode passes

## Task 2.2: useProductSaleForm Hook

**File**: `src/hooks/useProductSaleForm.ts`

```typescript
import { useState, useCallback } from 'react';
import { useProductSalesStore } from '@/modules/features/product-sales/store';
import { ProductSaleFormData } from '@/types/productSales';

interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

export const useProductSaleForm = (onSuccess?: () => void) => {
  const {
    formData,
    formErrors,
    isSaving,
    selectedSale,
    setFormData,
    clearFormData,
    setFormError,
    createSale,
    updateSale,
  } = useProductSalesStore();

  const [validation, setValidation] = useState<FormValidation>({
    isValid: true,
    errors: {},
  });

  const validateForm = useCallback((data: ProductSaleFormData): FormValidation => {
    const errors: Record<string, string> = {};

    if (!data.customer_id) errors.customer_id = 'Customer is required';
    if (!data.product_id) errors.product_id = 'Product is required';
    if (!data.units || data.units <= 0) errors.units = 'Units must be greater than 0';
    if (!data.cost_per_unit || data.cost_per_unit <= 0) errors.cost_per_unit = 'Cost must be greater than 0';
    if (!data.delivery_date) errors.delivery_date = 'Delivery date is required';

    const isValid = Object.keys(errors).length === 0;
    return { isValid, errors };
  }, []);

  const handleSubmit = useCallback(async (data: ProductSaleFormData) => {
    // Validate
    const validation = validateForm(data);
    if (!validation.isValid) {
      setValidation(validation);
      Object.entries(validation.errors).forEach(([field, error]) => {
        setFormError(field, error);
      });
      return false;
    }

    try {
      if (selectedSale) {
        // Update mode
        await updateSale(selectedSale.id, data);
      } else {
        // Create mode
        await createSale(data);
      }
      clearFormData();
      setValidation({ isValid: true, errors: {} });
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Form submission error:', error);
      return false;
    }
  }, [selectedSale, createSale, updateSale, validateForm, clearFormData, setFormError, onSuccess]);

  return {
    formData,
    formErrors,
    isSaving,
    isEditMode: !!selectedSale,
    validation,
    onFormChange: setFormData,
    onSubmit: handleSubmit,
    onClear: clearFormData,
  };
};
```

**Acceptance Criteria**:
- [ ] Form validation works
- [ ] Submit creates new sale
- [ ] Submit updates existing sale
- [ ] Error handling works
- [ ] Success callback fires

## Task 2.3: useProductSaleDetail Hook

**File**: `src/hooks/useProductSaleDetail.ts`

```typescript
import { useCallback } from 'react';
import { useProductSalesStore } from '@/modules/features/product-sales/store';
import { ProductSale } from '@/types/productSales';

export const useProductSaleDetail = () => {
  const {
    selectedSale,
    modals,
    selectSale,
    openDetailModal,
    closeDetailModal,
    openEditModal,
    deleteSale,
    isDeleting,
  } = useProductSalesStore();

  const handleView = useCallback((sale: ProductSale) => {
    selectSale(sale);
    openDetailModal(sale);
  }, [selectSale, openDetailModal]);

  const handleEdit = useCallback(() => {
    if (selectedSale) {
      openEditModal(selectedSale);
    }
  }, [selectedSale, openEditModal]);

  const handleDelete = useCallback(async () => {
    if (selectedSale) {
      try {
        await deleteSale(selectedSale.id);
        closeDetailModal();
        return true;
      } catch (error) {
        console.error('Delete error:', error);
        return false;
      }
    }
    return false;
  }, [selectedSale, deleteSale, closeDetailModal]);

  const handleClose = useCallback(() => {
    closeDetailModal();
  }, [closeDetailModal]);

  return {
    sale: selectedSale,
    isOpen: modals.detailOpen,
    isDeleting,
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onClose: handleClose,
  };
};
```

**Acceptance Criteria**:
- [ ] View detail works
- [ ] Edit button works
- [ ] Delete functionality works
- [ ] Close detail works

## Task 2.4: useProductSaleFilters Hook

**File**: `src/hooks/useProductSaleFilters.ts`

```typescript
import { useCallback } from 'react';
import { useProductSalesStore } from '@/modules/features/product-sales/store';
import { ProductSaleFilters } from '@/types/productSales';

export const useProductSaleFilters = () => {
  const {
    filters,
    setFilters,
    clearFilters,
    currentPage,
    setCurrentPage,
  } = useProductSalesStore();

  const handleStatusFilter = useCallback((status: string) => {
    setFilters({ ...filters, status: status || undefined });
  }, [filters, setFilters]);

  const handleCustomerFilter = useCallback((customerId: string) => {
    setFilters({ ...filters, customer_id: customerId || undefined });
  }, [filters, setFilters]);

  const handleProductFilter = useCallback((productId: string) => {
    setFilters({ ...filters, product_id: productId || undefined });
  }, [filters, setFilters]);

  const handleDateRangeFilter = useCallback((from: string, to: string) => {
    setFilters({
      ...filters,
      date_from: from || undefined,
      date_to: to || undefined,
    });
  }, [filters, setFilters]);

  const handleAmountRangeFilter = useCallback((min: number, max: number) => {
    setFilters({
      ...filters,
      min_amount: min > 0 ? min : undefined,
      max_amount: max > 0 ? max : undefined,
    });
  }, [filters, setFilters]);

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setCurrentPage(1);
  }, [clearFilters, setCurrentPage]);

  return {
    filters,
    onStatusChange: handleStatusFilter,
    onCustomerChange: handleCustomerFilter,
    onProductChange: handleProductFilter,
    onDateRangeChange: handleDateRangeFilter,
    onAmountRangeChange: handleAmountRangeFilter,
    onClearFilters: handleClearFilters,
  };
};
```

**Acceptance Criteria**:
- [ ] Status filter works
- [ ] Customer filter works
- [ ] Product filter works
- [ ] Date range filter works
- [ ] Amount range filter works
- [ ] Clear filters works

## Task 2.5: useProductSaleSearch Hook

**File**: `src/hooks/useProductSaleSearch.ts`

```typescript
import { useState, useCallback, useMemo } from 'react';
import { useProductSalesStore } from '@/modules/features/product-sales/store';

export const useProductSaleSearch = (debounceMs: number = 300) => {
  const { searchText, setSearchText } = useProductSalesStore();
  const [inputValue, setInputValue] = useState(searchText);
  const timeoutRef = useMemo(() => ({ id: null as NodeJS.Timeout | null }), []);

  const handleSearchChange = useCallback((value: string) => {
    setInputValue(value);
    
    if (timeoutRef.id) clearTimeout(timeoutRef.id);
    
    timeoutRef.id = setTimeout(() => {
      setSearchText(value);
    }, debounceMs);
  }, [debounceMs, setSearchText, timeoutRef]);

  const handleClearSearch = useCallback(() => {
    setInputValue('');
    setSearchText('');
  }, [setSearchText]);

  return {
    searchText: inputValue,
    onSearchChange: handleSearchChange,
    onClearSearch: handleClearSearch,
  };
};
```

**Acceptance Criteria**:
- [ ] Search text updates
- [ ] Debounce works
- [ ] Clear search works

## Task 2.6: useProductSaleAnalytics Hook

**File**: `src/hooks/useProductSaleAnalytics.ts`

```typescript
import { useEffect, useCallback } from 'react';
import { useProductSalesStore } from '@/modules/features/product-sales/store';

export const useProductSaleAnalytics = () => {
  const {
    analytics,
    analyticsLoading,
    error,
    fetchAnalytics,
    clearError,
  } = useProductSalesStore();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    isLoading: analyticsLoading,
    error,
    refetch: fetchAnalytics,
    clearError,
  };
};
```

**Acceptance Criteria**:
- [ ] Analytics load on mount
- [ ] Analytics display correctly
- [ ] Error handling works
- [ ] Refetch works

## Task 2.7: useProductSaleActions Hook

**File**: `src/hooks/useProductSaleActions.ts`

```typescript
import { useCallback } from 'react';
import { useProductSalesStore } from '@/modules/features/product-sales/store';
import { ProductSale, ProductSaleFormData } from '@/types/productSales';

export const useProductSaleActions = () => {
  const {
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openDetailModal,
    closeDetailModal,
    createSale,
    updateSale,
    deleteSale,
    isSaving,
    isDeleting,
    error,
    clearError,
  } = useProductSalesStore();

  const handleCreate = useCallback(async (data: ProductSaleFormData) => {
    try {
      await createSale(data);
      closeCreateModal();
      return true;
    } catch (error) {
      console.error('Create error:', error);
      return false;
    }
  }, [createSale, closeCreateModal]);

  const handleUpdate = useCallback(async (id: string, data: Partial<ProductSaleFormData>) => {
    try {
      await updateSale(id, data);
      closeEditModal();
      return true;
    } catch (error) {
      console.error('Update error:', error);
      return false;
    }
  }, [updateSale, closeEditModal]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteSale(id);
      closeDetailModal();
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }, [deleteSale, closeDetailModal]);

  return {
    isSaving,
    isDeleting,
    error,
    onCreate: handleCreate,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openDetailModal,
    closeDetailModal,
    clearError,
  };
};
```

**Acceptance Criteria**:
- [ ] Create action works
- [ ] Update action works
- [ ] Delete action works
- [ ] Modal controls work
- [ ] Error handling works

## Task 2.8: useProductSaleExport Hook

**File**: `src/hooks/useProductSaleExport.ts`

```typescript
import { useCallback, useState } from 'react';
import { useProductSalesStore } from '@/modules/features/product-sales/store';
import { ProductSale } from '@/types/productSales';
import { message } from 'antd';

export const useProductSaleExport = () => {
  const { sales } = useProductSalesStore();
  const [exporting, setExporting] = useState(false);

  const exportToCSV = useCallback(async () => {
    try {
      setExporting(true);
      
      // Prepare CSV header
      const headers = [
        'ID',
        'Customer',
        'Product',
        'Units',
        'Cost per Unit',
        'Total Cost',
        'Delivery Date',
        'Status',
        'Created At',
      ];

      // Prepare CSV rows
      const rows = sales.map(sale => [
        sale.id,
        sale.customer_name || '',
        sale.product_name || '',
        sale.units,
        sale.cost_per_unit,
        sale.total_cost,
        sale.delivery_date,
        sale.status,
        sale.created_at,
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-sales-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      message.success('Sales exported to CSV');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export sales');
    } finally {
      setExporting(false);
    }
  }, [sales]);

  const exportToJSON = useCallback(async () => {
    try {
      setExporting(true);
      
      const jsonContent = JSON.stringify(sales, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-sales-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      message.success('Sales exported to JSON');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export sales');
    } finally {
      setExporting(false);
    }
  }, [sales]);

  return {
    exporting,
    canExport: sales.length > 0,
    exportToCSV,
    exportToJSON,
  };
};
```

**Acceptance Criteria**:
- [ ] CSV export works
- [ ] JSON export works
- [ ] File downloads correctly
- [ ] Error handling works
- [ ] Loading state works

---

# 📌 BLOCKER #3: Create ProductSalesList Component

**File**: `src/modules/features/product-sales/components/ProductSalesList.tsx`  
**Duration**: 2 hours  
**Priority**: 🟡 **HIGH - UNBLOCKS MAIN PAGE**

## Task 3.1: Create Component

Create `src/modules/features/product-sales/components/ProductSalesList.tsx` (~200 lines)

```typescript
import React from 'react';
import { Table, Button, Space, Tag, Popconfirm, Empty, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { ProductSale, PRODUCT_SALE_STATUSES } from '@/types/productSales';

interface ProductSalesListProps {
  data: ProductSale[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onView: (sale: ProductSale) => void;
  onEdit: (sale: ProductSale) => void;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export const ProductSalesList: React.FC<ProductSalesListProps> = ({
  data,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onDelete,
  onRefresh,
}) => {
  const getStatusTag = (status: string) => {
    const statusConfig = PRODUCT_SALE_STATUSES.find(s => s.value === status);
    return statusConfig ? (
      <Tag color={statusConfig.color === 'bg-green-100 text-green-800' ? 'green' : statusConfig.color === 'bg-blue-100 text-blue-800' ? 'blue' : 'red'}>
        {statusConfig.label}
      </Tag>
    ) : null;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const columns: ColumnsType<ProductSale> = [
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: '15%',
      ellipsis: { showTitle: false },
      render: (text) => (
        <Tooltip title={text}>
          {text || '-'}
        </Tooltip>
      ),
    },
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
      width: '15%',
      ellipsis: { showTitle: false },
      render: (text) => (
        <Tooltip title={text}>
          {text || '-'}
        </Tooltip>
      ),
    },
    {
      title: 'Units',
      dataIndex: 'units',
      key: 'units',
      width: '10%',
      align: 'right' as const,
      render: (units) => units.toFixed(2),
    },
    {
      title: 'Unit Cost',
      dataIndex: 'cost_per_unit',
      key: 'cost_per_unit',
      width: '12%',
      align: 'right' as const,
      render: (cost) => formatCurrency(cost),
    },
    {
      title: 'Total Cost',
      dataIndex: 'total_cost',
      key: 'total_cost',
      width: '12%',
      align: 'right' as const,
      render: (total) => <strong>{formatCurrency(total)}</strong>,
      sorter: (a, b) => a.total_cost - b.total_cost,
    },
    {
      title: 'Delivery Date',
      dataIndex: 'delivery_date',
      key: 'delivery_date',
      width: '12%',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '14%',
      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete"
            description="Are you sure you want to delete this sale?"
            onConfirm={async () => {
              try {
                await onDelete(record.id);
              } catch (error) {
                console.error('Delete error:', error);
              }
            }}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (data.length === 0 && !loading) {
    return <Empty description="No product sales found" />;
  }

  return (
    <Table
      columns={columns}
      dataSource={data.map(item => ({ ...item, key: item.id }))}
      loading={loading}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        pageSizeOptions: ['10', '20', '50', '100'],
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} items`,
        onChange: onPageChange,
        onShowSizeChange: (_, size) => onPageSizeChange(size),
      }}
      scroll={{ x: 1200 }}
      size="small"
    />
  );
};
```

**Acceptance Criteria**:
- [ ] Component renders correctly
- [ ] All columns display
- [ ] Pagination works
- [ ] Actions work (view, edit, delete)
- [ ] Status badges display correctly
- [ ] Currency formatting works
- [ ] No console errors

## Task 3.2: Update Component Index

Update `src/modules/features/product-sales/components/index.ts`:

```typescript
export { ProductSaleFormPanel } from './ProductSaleFormPanel';
export { ProductSaleDetailPanel } from './ProductSaleDetailPanel';
export { ProductSalesList } from './ProductSalesList';
```

**Acceptance Criteria**:
- [ ] Export added
- [ ] Can import from components index

---

# 📌 BLOCKER #4: Complete ProductSaleFormPanel

**File**: `src/modules/features/product-sales/components/ProductSaleFormPanel.tsx`  
**Duration**: 2-3 hours  
**Priority**: 🟡 **HIGH - UNBLOCKS FORM**

## Current State
- ✅ Lines 1-50: Imports, props, setup
- ✅ Lines 53-78: Customer/product loading
- ❌ Missing: Form fields render
- ❌ Missing: Form submission
- ❌ Missing: Validation
- ❌ Missing: File uploads

## Task 4.1: Complete the Form Panel

```typescript
// Add after line 78 in ProductSaleFormPanel.tsx

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && productSale) {
      form.setFieldsValue({
        customer_id: productSale.customer_id,
        product_id: productSale.product_id,
        units: productSale.units,
        cost_per_unit: productSale.cost_per_unit,
        delivery_date: dayjs(productSale.delivery_date),
        notes: productSale.notes,
      });
    } else {
      form.resetFields();
    }
  }, [isEditMode, productSale, form]);

  // Handle form submission
  const handleSubmit = async (values: ProductSaleFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (isEditMode && productSale) {
        await productSaleService.updateProductSale(productSale.id, values);
        message.success('Product sale updated successfully');
      } else {
        await productSaleService.createProductSale(values);
        message.success('Product sale created successfully');
      }

      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={isEditMode ? 'Edit Product Sale' : 'Create Product Sale'}
      placement="right"
      width={600}
      onClose={onClose}
      open={visible}
      bodyStyle={{ paddingBottom: 80 }}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={loading} onClick={() => form.submit()}>
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </Space>
      }
    >
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} closable />}

      <Spin spinning={dataLoading}>
        {dataLoading ? (
          <Empty description="Loading..." />
        ) : (
          <Form
            form={form}
            layout="vertical"
            autoComplete="off"
            onFinish={handleSubmit}
          >
            <Form.Item
              label="Customer"
              name="customer_id"
              rules={[{ required: true, message: 'Please select a customer' }]}
            >
              <Select
                placeholder="Select customer"
                optionLabelProp="label"
                filterOption={(input, option) =>
                  ((option?.label as string) || '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {customers.map(customer => (
                  <Select.Option key={customer.id} value={customer.id} label={customer.name}>
                    {customer.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Product"
              name="product_id"
              rules={[{ required: true, message: 'Please select a product' }]}
            >
              <Select
                placeholder="Select product"
                optionLabelProp="label"
                filterOption={(input, option) =>
                  ((option?.label as string) || '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {products.map(product => (
                  <Select.Option key={product.id} value={product.id} label={product.name}>
                    {product.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Units"
              name="units"
              rules={[
                { required: true, message: 'Please enter units' },
                { type: 'number', min: 0.01, message: 'Units must be greater than 0' },
              ]}
            >
              <InputNumber min={0} precision={2} placeholder="0.00" />
            </Form.Item>

            <Form.Item
              label="Cost Per Unit (USD)"
              name="cost_per_unit"
              rules={[
                { required: true, message: 'Please enter cost per unit' },
                { type: 'number', min: 0.01, message: 'Cost must be greater than 0' },
              ]}
            >
              <InputNumber min={0} precision={2} prefix="$" placeholder="0.00" />
            </Form.Item>

            <Form.Item
              label="Delivery Date"
              name="delivery_date"
              rules={[{ required: true, message: 'Please select delivery date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Notes"
              name="notes"
              rules={[{ max: 500, message: 'Notes cannot exceed 500 characters' }]}
            >
              <Input.TextArea rows={4} placeholder="Additional notes..." />
            </Form.Item>

            <Divider />

            <Form.Item>
              <small>
                <strong>Auto-generated:</strong> A service contract will be automatically created
                for this product sale when you save it.
              </small>
            </Form.Item>
          </Form>
        )}
      </Spin>
    </Drawer>
  );
};

export default ProductSaleFormPanel;
```

**Acceptance Criteria**:
- [ ] All form fields render
- [ ] Validation works
- [ ] Submission works (create mode)
- [ ] Submission works (edit mode)
- [ ] Error messages display
- [ ] Success messages display
- [ ] Loading state works
- [ ] Form resets on success

---

## 📊 Phase 1 Completion Checklist

### Zustand Store
- [ ] Store file created at `src/modules/features/product-sales/store/productSalesStore.ts`
- [ ] All state properties implemented
- [ ] All actions implemented and tested
- [ ] Store exports correctly
- [ ] No TypeScript errors

### Custom Hooks (8 files)
- [ ] `useProductSales.ts` - working
- [ ] `useProductSaleForm.ts` - working
- [ ] `useProductSaleDetail.ts` - working
- [ ] `useProductSaleFilters.ts` - working
- [ ] `useProductSaleSearch.ts` - working
- [ ] `useProductSaleAnalytics.ts` - working
- [ ] `useProductSaleActions.ts` - working
- [ ] `useProductSaleExport.ts` - working

### Components
- [ ] `ProductSalesList.tsx` created and functional
- [ ] `ProductSaleFormPanel.tsx` completed with all fields
- [ ] Form validation working
- [ ] Components index updated
- [ ] All imports working

### Testing
- [ ] Store compiles and runs
- [ ] Hooks can be imported in components
- [ ] Components render without errors
- [ ] No console errors or warnings
- [ ] Page still loads (even if incomplete)

---

## ✅ Phase 1 Sign-Off

**Completion Date**: _______________  
**Developer**: _______________  
**Reviewed By**: _______________  

**Blockers Resolved**: 
- [ ] Zustand store created and integrated
- [ ] 8 custom hooks created and integrated
- [ ] ProductSalesList component created
- [ ] ProductSaleFormPanel completed

**Ready for Phase 2**: ✅ YES / ❌ NO

**Notes**: _______________________________________________________________

---

**Next Phase**: Phase 2 - Workflow Integration (Days 3-4)  
**Unblocked Work**: All phase 2+ tasks can now proceed once phase 1 is complete
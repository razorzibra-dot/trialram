/**
 * Product Sales Store
 * Zustand store for product sales state management
 * Handles product sales data, filtering, pagination, and analytics
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ProductSale, ProductSalesFilters, ProductSalesAnalytics } from '@/types/productSales';

/**
 * Product Sales Analytics State
 * Tracks analytics data for dashboard and reporting
 */
export interface ProductSalesAnalyticsState {
  totalSales: number;
  totalRevenue: number;
  averageDealSize: number;
  topProducts: Array<{ id: string; name: string; count: number; revenue: number }>;
  topCustomers: Array<{ id: string; name: string; count: number; revenue: number }>;
  statusDistribution: Record<string, number>;
  monthlyTrend: Array<{ month: string; sales: number; revenue: number }>;
}

/**
 * Product Sales Pagination State
 * Tracks pagination information
 */
export interface ProductSalesPaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Product Sales Store State and Actions
 * Complete state interface for product sales management
 */
export interface ProductSalesStore {
  // ========== Data State ==========
  /** Array of product sales */
  sales: ProductSale[];
  /** Currently selected product sale */
  selectedSale: ProductSale | null;
  /** Analytics data */
  analytics: ProductSalesAnalyticsState | null;

  // ========== Loading/Error States ==========
  /** Main loading state */
  isLoading: boolean;
  /** Creating new sale state */
  isSaving: boolean;
  /** Deleting sale state */
  isDeleting: boolean;
  /** Error message if any */
  error: string | null;

  // ========== Filters and Search ==========
  /** Active filters */
  filters: ProductSalesFilters;
  /** Search text */
  searchText: string;

  // ========== Pagination ==========
  /** Pagination state */
  pagination: ProductSalesPaginationState;

  // ========== Selection ==========
  /** Selected sale IDs for bulk operations */
  selectedSaleIds: string[];

  // ========== View State ==========
  /** Current view mode */
  viewMode: 'table' | 'cards' | 'kanban';
  /** Sort column */
  sortBy: string;
  /** Sort order */
  sortOrder: 'asc' | 'desc';

  // ========== Modal States ==========
  /** Form modal visibility */
  showFormModal: boolean;
  /** Detail modal visibility */
  showDetailModal: boolean;

  // ========== Data Actions ==========
  /**
   * Set all product sales
   * @param sales Array of product sales
   */
  setSales: (sales: ProductSale[]) => void;

  /**
   * Add a new product sale to the list
   * @param sale Product sale to add
   */
  addSale: (sale: ProductSale) => void;

  /**
   * Update an existing product sale
   * @param id Sale ID
   * @param updates Partial updates
   */
  updateSale: (id: string, updates: Partial<ProductSale>) => void;

  /**
   * Delete a product sale from the list
   * @param id Sale ID
   */
  deleteSale: (id: string) => void;

  /**
   * Set the currently selected sale
   * @param sale Product sale or null
   */
  setSelectedSale: (sale: ProductSale | null) => void;

  /**
   * Set analytics data
   * @param analytics Analytics state
   */
  setAnalytics: (analytics: ProductSalesAnalyticsState | null) => void;

  // ========== Loading/Error Actions ==========
  /**
   * Set main loading state
   * @param loading Boolean
   */
  setLoading: (loading: boolean) => void;

  /**
   * Set saving state
   * @param saving Boolean
   */
  setSaving: (saving: boolean) => void;

  /**
   * Set deleting state
   * @param deleting Boolean
   */
  setDeleting: (deleting: boolean) => void;

  /**
   * Set error message
   * @param error Error message or null
   */
  setError: (error: string | null) => void;

  /**
   * Clear error message
   */
  clearError: () => void;

  // ========== Filter Actions ==========
  /**
   * Update filters
   * @param filters Partial filter updates
   */
  setFilters: (filters: Partial<ProductSalesFilters>) => void;

  /**
   * Set search text
   * @param text Search text
   */
  setSearchText: (text: string) => void;

  /**
   * Reset all filters to default
   */
  resetFilters: () => void;

  // ========== Pagination Actions ==========
  /**
   * Set current page
   * @param page Page number
   */
  setCurrentPage: (page: number) => void;

  /**
   * Set page size
   * @param size Items per page
   */
  setPageSize: (size: number) => void;

  /**
   * Update full pagination state
   * @param pagination Partial pagination updates
   */
  setPagination: (pagination: Partial<ProductSalesPaginationState>) => void;

  // ========== Selection Actions ==========
  /**
   * Set selected sale IDs
   * @param ids Array of IDs
   */
  setSelectedSaleIds: (ids: string[]) => void;

  /**
   * Toggle selection of a specific sale
   * @param id Sale ID
   */
  toggleSaleSelection: (id: string) => void;

  /**
   * Select all sales
   */
  selectAllSales: () => void;

  /**
   * Clear all selections
   */
  clearSelection: () => void;

  // ========== View Actions ==========
  /**
   * Set view mode
   * @param mode View mode
   */
  setViewMode: (mode: 'table' | 'cards' | 'kanban') => void;

  /**
   * Set sorting
   * @param sortBy Column to sort by
   * @param sortOrder Sort order
   */
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;

  // ========== Modal Actions ==========
  /**
   * Show form modal
   */
  showForm: () => void;

  /**
   * Hide form modal
   */
  hideForm: () => void;

  /**
   * Show detail modal
   */
  showDetail: () => void;

  /**
   * Hide detail modal
   */
  hideDetail: () => void;

  // ========== Bulk Actions ==========
  /**
   * Bulk update multiple sales
   * @param ids Array of sale IDs
   * @param updates Partial updates
   */
  bulkUpdateSales: (ids: string[], updates: Partial<ProductSale>) => void;

  /**
   * Bulk delete multiple sales
   * @param ids Array of sale IDs
   */
  bulkDeleteSales: (ids: string[]) => void;

  // ========== Utility Actions ==========
  /**
   * Reset entire store to initial state
   */
  reset: () => void;
}

// ========== Initial State ==========
const initialState: Omit<ProductSalesStore, keyof {
  setSales: any;
  addSale: any;
  updateSale: any;
  deleteSale: any;
  setSelectedSale: any;
  setAnalytics: any;
  setLoading: any;
  setSaving: any;
  setDeleting: any;
  setError: any;
  clearError: any;
  setFilters: any;
  setSearchText: any;
  resetFilters: any;
  setCurrentPage: any;
  setPageSize: any;
  setPagination: any;
  setSelectedSaleIds: any;
  toggleSaleSelection: any;
  selectAllSales: any;
  clearSelection: any;
  setViewMode: any;
  setSorting: any;
  showForm: any;
  hideForm: any;
  showDetail: any;
  hideDetail: any;
  bulkUpdateSales: any;
  bulkDeleteSales: any;
  reset: any;
}> = {
  // Data
  sales: [],
  selectedSale: null,
  analytics: null,

  // Loading/Error
  isLoading: false,
  isSaving: false,
  isDeleting: false,
  error: null,

  // Filters
  filters: {},
  searchText: '',

  // Pagination
  pagination: {
    currentPage: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  },

  // Selection
  selectedSaleIds: [],

  // View
  viewMode: 'table',
  sortBy: 'created_at',
  sortOrder: 'desc',

  // Modals
  showFormModal: false,
  showDetailModal: false,
};

/**
 * Create Product Sales Store
 * Zustand store with devtools, subscribeWithSelector, and immer middleware
 */
export const useProductSalesStore = create<ProductSalesStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        // ========== Data Actions ==========
        setSales: (sales) => {
          set((state) => {
            // Filter and validate sales data
            state.sales = (Array.isArray(sales) ? sales : [])
              .filter((sale) => sale && typeof sale === 'object' && sale.id)
              .map((sale) => ({
                ...sale,
                // Ensure all required fields have defaults
                id: sale.id,
                customer_id: sale.customer_id || '',
                customer_name: sale.customer_name || '',
                product_id: sale.product_id || '',
                product_name: sale.product_name || '',
                units: Number(sale.units) || 0,
                cost_per_unit: Number(sale.cost_per_unit) || 0,
                total_cost: Number(sale.total_cost) || 0,
                delivery_date: sale.delivery_date || '',
                warranty_expiry: sale.warranty_expiry || '',
                status: sale.status || 'new',
                notes: sale.notes || '',
                attachments: Array.isArray(sale.attachments) ? sale.attachments : [],
                service_contract_id: sale.service_contract_id || undefined,
                tenant_id: sale.tenant_id || '',
                created_at: sale.created_at || new Date().toISOString(),
                updated_at: sale.updated_at || new Date().toISOString(),
                created_by: sale.created_by || '',
              }));
          });
        },

        addSale: (sale) => {
          set((state) => {
            state.sales.unshift(sale);
            state.pagination.totalCount += 1;
          });
        },

        updateSale: (id, updates) => {
          set((state) => {
            const index = state.sales.findIndex((s) => s.id === id);
            if (index !== -1) {
              Object.assign(state.sales[index], updates);
            }
            if (state.selectedSale?.id === id) {
              Object.assign(state.selectedSale, updates);
            }
          });
        },

        deleteSale: (id) => {
          set((state) => {
            state.sales = state.sales.filter((s) => s.id !== id);
            state.pagination.totalCount -= 1;
            if (state.selectedSale?.id === id) {
              state.selectedSale = null;
            }
          });
        },

        setSelectedSale: (sale) => {
          set((state) => {
            state.selectedSale = sale;
          });
        },

        setAnalytics: (analytics) => {
          set((state) => {
            state.analytics = analytics;
          });
        },

        // ========== Loading/Error Actions ==========
        setLoading: (loading) => {
          set((state) => {
            state.isLoading = loading;
          });
        },

        setSaving: (saving) => {
          set((state) => {
            state.isSaving = saving;
          });
        },

        setDeleting: (deleting) => {
          set((state) => {
            state.isDeleting = deleting;
          });
        },

        setError: (error) => {
          set((state) => {
            state.error = error;
          });
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        // ========== Filter Actions ==========
        setFilters: (filters) => {
          set((state) => {
            state.filters = { ...state.filters, ...filters };
            state.pagination.currentPage = 1; // Reset to first page on filter change
          });
        },

        setSearchText: (text) => {
          set((state) => {
            state.searchText = text;
            state.pagination.currentPage = 1; // Reset to first page on search
          });
        },

        resetFilters: () => {
          set((state) => {
            state.filters = {};
            state.searchText = '';
            state.pagination.currentPage = 1;
          });
        },

        // ========== Pagination Actions ==========
        setCurrentPage: (page) => {
          set((state) => {
            state.pagination.currentPage = Math.max(1, page);
          });
        },

        setPageSize: (size) => {
          set((state) => {
            state.pagination.pageSize = Math.max(1, size);
            state.pagination.currentPage = 1; // Reset to first page on size change
          });
        },

        setPagination: (pagination) => {
          set((state) => {
            state.pagination = { ...state.pagination, ...pagination };
          });
        },

        // ========== Selection Actions ==========
        setSelectedSaleIds: (ids) => {
          set((state) => {
            state.selectedSaleIds = ids;
          });
        },

        toggleSaleSelection: (id) => {
          set((state) => {
            const index = state.selectedSaleIds.indexOf(id);
            if (index > -1) {
              state.selectedSaleIds.splice(index, 1);
            } else {
              state.selectedSaleIds.push(id);
            }
          });
        },

        selectAllSales: () => {
          set((state) => {
            state.selectedSaleIds = state.sales.map((s) => s.id);
          });
        },

        clearSelection: () => {
          set((state) => {
            state.selectedSaleIds = [];
          });
        },

        // ========== View Actions ==========
        setViewMode: (mode) => {
          set((state) => {
            state.viewMode = mode;
          });
        },

        setSorting: (sortBy, sortOrder) => {
          set((state) => {
            state.sortBy = sortBy;
            state.sortOrder = sortOrder;
          });
        },

        // ========== Modal Actions ==========
        showForm: () => {
          set((state) => {
            state.showFormModal = true;
          });
        },

        hideForm: () => {
          set((state) => {
            state.showFormModal = false;
          });
        },

        showDetail: () => {
          set((state) => {
            state.showDetailModal = true;
          });
        },

        hideDetail: () => {
          set((state) => {
            state.showDetailModal = false;
          });
        },

        // ========== Bulk Actions ==========
        bulkUpdateSales: (ids, updates) => {
          set((state) => {
            state.sales = state.sales.map((sale) =>
              ids.includes(sale.id) ? { ...sale, ...updates } : sale
            );
          });
        },

        bulkDeleteSales: (ids) => {
          set((state) => {
            state.sales = state.sales.filter((sale) => !ids.includes(sale.id));
            state.pagination.totalCount = state.sales.length;
            if (state.selectedSale && ids.includes(state.selectedSale.id)) {
              state.selectedSale = null;
            }
          });
        },

        // ========== Utility Actions ==========
        reset: () => {
          set(() => initialState);
        },
      }))
    )
  ),
  {
    name: 'ProductSalesStore', // DevTools name
    version: 1,
  }
);

export default useProductSalesStore;
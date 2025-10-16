/**
 * Sales Store
 * State management for sales-related data
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Deal } from '@/types/crm';

export interface SalesFilters {
  search?: string;
  stage?: string;
  assignedTo?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  minValue?: number;
  maxValue?: number;
  page?: number;
  pageSize?: number;
}

export interface DealStats {
  total: number;
  totalValue: number;
  byStage: Record<string, number>;
  byStageValue: Record<string, number>;
  conversionRate: number;
  averageDealSize: number;
  averageSalesCycle: number;
  monthlyTrend: Array<{
    month: string;
    deals: number;
    value: number;
  }>;
}

export interface SalesState {
  // Data
  deals: Deal[];
  selectedDeal: Deal | null;
  stats: DealStats | null;

  // UI State
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;

  // Filters and Search
  filters: SalesFilters;
  searchQuery: string;
  selectedStage: string;

  // Selection
  selectedDealIds: string[];

  // Pagination
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };

  // View Mode
  viewMode: 'table' | 'kanban' | 'cards';

  // Sorting
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // Actions
  setDeals: (deals: Deal[]) => void;
  addDeal: (deal: Deal) => void;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  removeDeal: (id: string) => void;
  setSelectedDeal: (deal: Deal | null) => void;
  
  // UI Actions
  setLoading: (loading: boolean) => void;
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<SalesFilters>) => void;
  clearFilters: () => void;
  setStats: (stats: DealStats | null) => void;
  
  // Pagination
  setPagination: (pagination: Partial<SalesState['pagination']>) => void;
  
  // Selection
  setSelectedDealIds: (ids: string[]) => void;
  toggleDealSelection: (id: string) => void;
  clearSelection: () => void;
  
  // Bulk Actions
  bulkUpdateDeals: (ids: string[], updates: Partial<Deal>) => void;
  bulkDeleteDeals: (ids: string[]) => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  deals: [],
  selectedDeal: null,
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
  },
  selectedDealIds: [],
};

export const useSalesStore = create<SalesState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        // Data Actions
        setDeals: (deals) => {
          set((state) => {
            state.deals = deals;
          });
        },

        addDeal: (deal) => {
          set((state) => {
            state.deals.unshift(deal);
            state.pagination.total += 1;
          });
        },

        updateDeal: (id, updates) => {
          set((state) => {
            const index = state.deals.findIndex(d => d.id === id);
            if (index !== -1) {
              Object.assign(state.deals[index], updates);
            }
            
            if (state.selectedDeal?.id === id) {
              Object.assign(state.selectedDeal, updates);
            }
          });
        },

        removeDeal: (id) => {
          set((state) => {
            state.deals = state.deals.filter(d => d.id !== id);
            state.pagination.total -= 1;
            
            if (state.selectedDeal?.id === id) {
              state.selectedDeal = null;
            }
            
            state.selectedDealIds = state.selectedDealIds.filter(dId => dId !== id);
          });
        },

        setSelectedDeal: (deal) => {
          set((state) => {
            state.selectedDeal = deal;
          });
        },

        // UI Actions
        setLoading: (loading) => {
          set((state) => {
            state.isLoading = loading;
          });
        },

        setCreating: (creating) => {
          set((state) => {
            state.isCreating = creating;
          });
        },

        setUpdating: (updating) => {
          set((state) => {
            state.isUpdating = updating;
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

        setStats: (stats) => {
          set((state) => {
            state.stats = stats;
          });
        },

        setFilters: (filters) => {
          set((state) => {
            Object.assign(state.filters, filters);
          });
        },

        clearFilters: () => {
          set((state) => {
            state.filters = {};
          });
        },

        // Pagination
        setPagination: (pagination) => {
          set((state) => {
            Object.assign(state.pagination, pagination);
          });
        },

        // Selection
        setSelectedDealIds: (ids) => {
          set((state) => {
            state.selectedDealIds = ids;
          });
        },

        toggleDealSelection: (id) => {
          set((state) => {
            const index = state.selectedDealIds.indexOf(id);
            if (index === -1) {
              state.selectedDealIds.push(id);
            } else {
              state.selectedDealIds.splice(index, 1);
            }
          });
        },

        clearSelection: () => {
          set((state) => {
            state.selectedDealIds = [];
          });
        },

        // Bulk Actions
        bulkUpdateDeals: (ids, updates) => {
          set((state) => {
            state.deals.forEach(deal => {
              if (ids.includes(deal.id)) {
                Object.assign(deal, updates);
              }
            });
          });
        },

        bulkDeleteDeals: (ids) => {
          set((state) => {
            state.deals = state.deals.filter(d => !ids.includes(d.id));
            state.pagination.total -= ids.length;
            state.selectedDealIds = state.selectedDealIds.filter(id => !ids.includes(id));
            
            if (state.selectedDeal && ids.includes(state.selectedDeal.id)) {
              state.selectedDeal = null;
            }
          });
        },

        // Reset
        reset: () => {
          set((state) => {
            Object.assign(state, initialState);
          });
        },
      }))
    ),
    {
      name: 'sales-store',
    }
  )
);

// Selector hooks
export const useDeals = () => useSalesStore((state) => state.deals);
export const useSelectedDeal = () => useSalesStore((state) => state.selectedDeal);
export const useSalesFilters = () => useSalesStore((state) => state.filters);
export const useSalesPagination = () => useSalesStore((state) => state.pagination);
export const useSalesSelection = () => useSalesStore((state) => ({
  selectedIds: state.selectedDealIds,
  selectedDeals: state.deals.filter(d => state.selectedDealIds.includes(d.id)),
}));
export const useSalesLoading = () => useSalesStore((state) => ({
  isLoading: state.isLoading,
  error: state.error,
}));

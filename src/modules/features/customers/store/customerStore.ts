/**
 * Customer Store
 * State management for customer-related data
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Customer, CustomerTag } from '@/types/crm';

export interface CustomerFilters {
  search?: string;
  status?: string;
  industry?: string;
  size?: string;
  assignedTo?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface CustomerState {
  // Data
  customers: Customer[];
  selectedCustomer: Customer | null;
  tags: CustomerTag[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  filters: CustomerFilters;
  
  // Pagination
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  
  // Selection
  selectedCustomerIds: string[];
  
  // Actions
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  removeCustomer: (id: string) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  
  // Tags
  setTags: (tags: CustomerTag[]) => void;
  addTag: (tag: CustomerTag) => void;
  removeTag: (tagId: string) => void;
  
  // UI Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<CustomerFilters>) => void;
  clearFilters: () => void;
  
  // Pagination
  setPagination: (pagination: Partial<CustomerState['pagination']>) => void;
  
  // Selection
  setSelectedCustomerIds: (ids: string[]) => void;
  toggleCustomerSelection: (id: string) => void;
  clearSelection: () => void;
  
  // Bulk Actions
  bulkUpdateCustomers: (ids: string[], updates: Partial<Customer>) => void;
  bulkDeleteCustomers: (ids: string[]) => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  customers: [],
  selectedCustomer: null,
  tags: [],
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
  },
  selectedCustomerIds: [],
};

export const useCustomerStore = create<CustomerState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        // Data Actions
        setCustomers: (customers) => {
          set((state) => {
            state.customers = customers;
          });
        },

        addCustomer: (customer) => {
          set((state) => {
            state.customers.unshift(customer);
            state.pagination.total += 1;
          });
        },

        updateCustomer: (id, updates) => {
          set((state) => {
            const index = state.customers.findIndex(c => c.id === id);
            if (index !== -1) {
              Object.assign(state.customers[index], updates);
            }
            
            // Update selected customer if it's the same one
            if (state.selectedCustomer?.id === id) {
              Object.assign(state.selectedCustomer, updates);
            }
          });
        },

        removeCustomer: (id) => {
          set((state) => {
            state.customers = state.customers.filter(c => c.id !== id);
            state.pagination.total -= 1;
            
            // Clear selected customer if it's the one being removed
            if (state.selectedCustomer?.id === id) {
              state.selectedCustomer = null;
            }
            
            // Remove from selection
            state.selectedCustomerIds = state.selectedCustomerIds.filter(cId => cId !== id);
          });
        },

        setSelectedCustomer: (customer) => {
          set((state) => {
            state.selectedCustomer = customer;
          });
        },

        // Tags
        setTags: (tags) => {
          set((state) => {
            state.tags = tags;
          });
        },

        addTag: (tag) => {
          set((state) => {
            state.tags.push(tag);
          });
        },

        removeTag: (tagId) => {
          set((state) => {
            state.tags = state.tags.filter(t => t.id !== tagId);
            
            // Remove tag from customers
            state.customers.forEach(customer => {
              customer.tags = customer.tags.filter(t => t.id !== tagId);
            });
          });
        },

        // UI Actions
        setLoading: (loading) => {
          set((state) => {
            state.isLoading = loading;
          });
        },

        setError: (error) => {
          set((state) => {
            state.error = error;
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
        setSelectedCustomerIds: (ids) => {
          set((state) => {
            state.selectedCustomerIds = ids;
          });
        },

        toggleCustomerSelection: (id) => {
          set((state) => {
            const index = state.selectedCustomerIds.indexOf(id);
            if (index === -1) {
              state.selectedCustomerIds.push(id);
            } else {
              state.selectedCustomerIds.splice(index, 1);
            }
          });
        },

        clearSelection: () => {
          set((state) => {
            state.selectedCustomerIds = [];
          });
        },

        // Bulk Actions
        bulkUpdateCustomers: (ids, updates) => {
          set((state) => {
            state.customers.forEach(customer => {
              if (ids.includes(customer.id)) {
                Object.assign(customer, updates);
              }
            });
          });
        },

        bulkDeleteCustomers: (ids) => {
          set((state) => {
            state.customers = state.customers.filter(c => !ids.includes(c.id));
            state.pagination.total -= ids.length;
            state.selectedCustomerIds = state.selectedCustomerIds.filter(id => !ids.includes(id));
            
            // Clear selected customer if it's being deleted
            if (state.selectedCustomer && ids.includes(state.selectedCustomer.id)) {
              state.selectedCustomer = null;
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
      name: 'customer-store',
    }
  )
);

// Selector hooks for better performance
export const useCustomers = () => useCustomerStore((state) => state.customers);
export const useSelectedCustomer = () => useCustomerStore((state) => state.selectedCustomer);
export const useCustomerTags = () => useCustomerStore((state) => state.tags);
export const useCustomerFilters = () => useCustomerStore((state) => state.filters);
export const useCustomerPagination = () => useCustomerStore((state) => state.pagination);
export const useCustomerSelection = () => useCustomerStore((state) => ({
  selectedIds: state.selectedCustomerIds,
  selectedCustomers: state.customers.filter(c => state.selectedCustomerIds.includes(c.id)),
}));
export const useCustomerLoading = () => useCustomerStore((state) => ({
  isLoading: state.isLoading,
  error: state.error,
}));

/**
 * Contract Store
 * State management for contract-related data
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Contract } from '@/types/contracts';

export interface ContractFilters {
  search?: string;
  status?: string;
  type?: string;
  customerName?: string;
  assignedTo?: string;
  priority?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  page?: number;
  pageSize?: number;
}

export interface ContractState {
  // Data
  contracts: Contract[];
  selectedContract: Contract | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  filters: ContractFilters;
  
  // Pagination
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  
  // Selection
  selectedContractIds: string[];
  
  // Actions
  setContracts: (contracts: Contract[]) => void;
  addContract: (contract: Contract) => void;
  updateContract: (id: string, updates: Partial<Contract>) => void;
  removeContract: (id: string) => void;
  setSelectedContract: (contract: Contract | null) => void;
  
  // UI Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<ContractFilters>) => void;
  clearFilters: () => void;
  
  // Pagination
  setPagination: (pagination: Partial<ContractState['pagination']>) => void;
  
  // Selection
  setSelectedContractIds: (ids: string[]) => void;
  toggleContractSelection: (id: string) => void;
  clearSelection: () => void;
  
  // Bulk Actions
  bulkUpdateContracts: (ids: string[], updates: Partial<Contract>) => void;
  bulkDeleteContracts: (ids: string[]) => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  contracts: [],
  selectedContract: null,
  isLoading: false,
  error: null,
  filters: {
    page: 1,
    pageSize: 20,
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
  },
  selectedContractIds: [],
};

export const useContractStore = create<ContractState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        // Data Actions
        setContracts: (contracts) => {
          set((state) => {
            state.contracts = contracts;
          });
        },

        addContract: (contract) => {
          set((state) => {
            state.contracts.unshift(contract);
            state.pagination.total += 1;
          });
        },

        updateContract: (id, updates) => {
          set((state) => {
            const index = state.contracts.findIndex(c => c.id === id);
            if (index !== -1) {
              Object.assign(state.contracts[index], updates);
            }
            
            // Update selected contract if it's the same one
            if (state.selectedContract?.id === id) {
              Object.assign(state.selectedContract, updates);
            }
          });
        },

        removeContract: (id) => {
          set((state) => {
            state.contracts = state.contracts.filter(c => c.id !== id);
            state.pagination.total -= 1;
            
            // Clear selected contract if it's the one being removed
            if (state.selectedContract?.id === id) {
              state.selectedContract = null;
            }
            
            // Remove from selection
            state.selectedContractIds = state.selectedContractIds.filter(cId => cId !== id);
          });
        },

        setSelectedContract: (contract) => {
          set((state) => {
            state.selectedContract = contract;
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
            state.filters = { ...state.filters, ...filters };
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
        setSelectedContractIds: (ids) => {
          set((state) => {
            state.selectedContractIds = ids;
          });
        },

        toggleContractSelection: (id) => {
          set((state) => {
            const index = state.selectedContractIds.indexOf(id);
            if (index === -1) {
              state.selectedContractIds.push(id);
            } else {
              state.selectedContractIds.splice(index, 1);
            }
          });
        },

        clearSelection: () => {
          set((state) => {
            state.selectedContractIds = [];
          });
        },

        // Bulk Actions
        bulkUpdateContracts: (ids, updates) => {
          set((state) => {
            state.contracts.forEach(contract => {
              if (ids.includes(contract.id)) {
                Object.assign(contract, updates);
              }
            });
          });
        },

        bulkDeleteContracts: (ids) => {
          set((state) => {
            state.contracts = state.contracts.filter(c => !ids.includes(c.id));
            state.pagination.total -= ids.length;
            state.selectedContractIds = state.selectedContractIds.filter(id => !ids.includes(id));
            
            // Clear selected contract if it's being deleted
            if (state.selectedContract && ids.includes(state.selectedContract.id)) {
              state.selectedContract = null;
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
      name: 'contract-store',
    }
  )
);

// Selector hooks for better performance
export const useContracts = () => useContractStore((state) => state.contracts);
export const useSelectedContract = () => useContractStore((state) => state.selectedContract);
export const useContractFilters = () => useContractStore((state) => state.filters);
export const useContractPagination = () => useContractStore((state) => state.pagination);
export const useContractSelection = () => useContractStore((state) => ({
  selectedIds: state.selectedContractIds,
  selectedContracts: state.contracts.filter(c => state.selectedContractIds.includes(c.id)),
}));
export const useContractLoading = () => useContractStore((state) => ({
  isLoading: state.isLoading,
  error: state.error,
}));
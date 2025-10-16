/**
 * Ticket Store
 * Zustand store for ticket state management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Ticket } from '@/types/crm';
import { TicketFilters, TicketStats } from '../services/ticketService';

export interface TicketState {
  // Data
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  stats: TicketStats | null;
  
  // UI State
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Filters and Search
  filters: TicketFilters;
  searchQuery: string;
  selectedStatus: string;
  selectedPriority: string;
  
  // Selection
  selectedTickets: string[];
  
  // Pagination
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  
  // View Mode
  viewMode: 'table' | 'kanban' | 'cards';
  
  // Sorting
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface TicketActions {
  // Data Actions
  setTickets: (tickets: Ticket[]) => void;
  addTicket: (ticket: Ticket) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  removeTicket: (id: string) => void;
  setSelectedTicket: (ticket: Ticket | null) => void;
  setStats: (stats: TicketStats) => void;
  
  // Loading States
  setLoading: (loading: boolean) => void;
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  
  // Filters and Search
  setFilters: (filters: Partial<TicketFilters>) => void;
  setSearchQuery: (query: string) => void;
  setSelectedStatus: (status: string) => void;
  setSelectedPriority: (priority: string) => void;
  clearFilters: () => void;
  
  // Selection
  setSelectedTickets: (ids: string[]) => void;
  toggleTicketSelection: (id: string) => void;
  selectAllTickets: () => void;
  clearSelection: () => void;
  
  // Pagination
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setPagination: (page: number, pageSize: number, totalPages: number, totalCount: number) => void;
  
  // View Mode
  setViewMode: (mode: 'table' | 'kanban' | 'cards') => void;
  
  // Sorting
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  
  // Utility Actions
  reset: () => void;
}

type TicketStore = TicketState & TicketActions;

const initialState: TicketState = {
  // Data
  tickets: [],
  selectedTicket: null,
  stats: null,
  
  // UI State
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  
  // Filters and Search
  filters: {},
  searchQuery: '',
  selectedStatus: 'all',
  selectedPriority: 'all',
  
  // Selection
  selectedTickets: [],
  
  // Pagination
  currentPage: 1,
  pageSize: 20,
  totalPages: 0,
  totalCount: 0,
  
  // View Mode
  viewMode: 'table',
  
  // Sorting
  sortBy: 'created_at',
  sortOrder: 'desc',
};

export const useTicketStore = create<TicketStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,
      
      // Data Actions
      setTickets: (tickets) => {
        set((state) => {
          state.tickets = tickets;
        });
      },
      
      addTicket: (ticket) => {
        set((state) => {
          state.tickets.unshift(ticket);
          state.totalCount += 1;
        });
      },
      
      updateTicket: (id, updates) => {
        set((state) => {
          const index = state.tickets.findIndex(ticket => ticket.id === id);
          if (index !== -1) {
            state.tickets[index] = { ...state.tickets[index], ...updates };
          }
          
          // Update selected ticket if it's the one being updated
          if (state.selectedTicket?.id === id) {
            state.selectedTicket = { ...state.selectedTicket, ...updates };
          }
        });
      },
      
      removeTicket: (id) => {
        set((state) => {
          state.tickets = state.tickets.filter(ticket => ticket.id !== id);
          state.selectedTickets = state.selectedTickets.filter(ticketId => ticketId !== id);
          state.totalCount = Math.max(0, state.totalCount - 1);
          
          // Clear selected ticket if it's the one being removed
          if (state.selectedTicket?.id === id) {
            state.selectedTicket = null;
          }
        });
      },
      
      setSelectedTicket: (ticket) => {
        set((state) => {
          state.selectedTicket = ticket;
        });
      },
      
      setStats: (stats) => {
        set((state) => {
          state.stats = stats;
        });
      },
      
      // Loading States
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
      
      // Filters and Search
      setFilters: (filters) => {
        set((state) => {
          state.filters = { ...state.filters, ...filters };
          state.currentPage = 1; // Reset to first page when filters change
        });
      },
      
      setSearchQuery: (query) => {
        set((state) => {
          state.searchQuery = query;
          state.filters.search = query;
          state.currentPage = 1;
        });
      },
      
      setSelectedStatus: (status) => {
        set((state) => {
          state.selectedStatus = status;
          if (status === 'all') {
            delete state.filters.status;
          } else {
            state.filters.status = status;
          }
          state.currentPage = 1;
        });
      },
      
      setSelectedPriority: (priority) => {
        set((state) => {
          state.selectedPriority = priority;
          if (priority === 'all') {
            delete state.filters.priority;
          } else {
            state.filters.priority = priority;
          }
          state.currentPage = 1;
        });
      },
      
      clearFilters: () => {
        set((state) => {
          state.filters = {};
          state.searchQuery = '';
          state.selectedStatus = 'all';
          state.selectedPriority = 'all';
          state.currentPage = 1;
        });
      },
      
      // Selection
      setSelectedTickets: (ids) => {
        set((state) => {
          state.selectedTickets = ids;
        });
      },
      
      toggleTicketSelection: (id) => {
        set((state) => {
          const index = state.selectedTickets.indexOf(id);
          if (index === -1) {
            state.selectedTickets.push(id);
          } else {
            state.selectedTickets.splice(index, 1);
          }
        });
      },
      
      selectAllTickets: () => {
        set((state) => {
          state.selectedTickets = state.tickets.map(ticket => ticket.id);
        });
      },
      
      clearSelection: () => {
        set((state) => {
          state.selectedTickets = [];
        });
      },
      
      // Pagination
      setCurrentPage: (page) => {
        set((state) => {
          state.currentPage = page;
        });
      },
      
      setPageSize: (size) => {
        set((state) => {
          state.pageSize = size;
          state.currentPage = 1;
        });
      },
      
      setPagination: (page, pageSize, totalPages, totalCount) => {
        set((state) => {
          state.currentPage = page;
          state.pageSize = pageSize;
          state.totalPages = totalPages;
          state.totalCount = totalCount;
        });
      },
      
      // View Mode
      setViewMode: (mode) => {
        set((state) => {
          state.viewMode = mode;
        });
      },
      
      // Sorting
      setSorting: (sortBy, sortOrder) => {
        set((state) => {
          state.sortBy = sortBy;
          state.sortOrder = sortOrder;
        });
      },
      
      // Utility Actions
      reset: () => {
        set((state) => {
          Object.assign(state, initialState);
        });
      },
    })),
    {
      name: 'ticket-store',
    }
  )
);

// Selector hooks for better performance
export const useTicketData = () => useTicketStore((state) => ({
  tickets: state.tickets,
  selectedTicket: state.selectedTicket,
  stats: state.stats,
  isLoading: state.isLoading,
  totalCount: state.totalCount,
}));

export const useTicketFilters = () => useTicketStore((state) => ({
  filters: state.filters,
  searchQuery: state.searchQuery,
  selectedStatus: state.selectedStatus,
  selectedPriority: state.selectedPriority,
  setFilters: state.setFilters,
  setSearchQuery: state.setSearchQuery,
  setSelectedStatus: state.setSelectedStatus,
  setSelectedPriority: state.setSelectedPriority,
  clearFilters: state.clearFilters,
}));

export const useTicketSelection = () => useTicketStore((state) => ({
  selectedTickets: state.selectedTickets,
  setSelectedTickets: state.setSelectedTickets,
  toggleTicketSelection: state.toggleTicketSelection,
  selectAllTickets: state.selectAllTickets,
  clearSelection: state.clearSelection,
}));

export const useTicketPagination = () => useTicketStore((state) => ({
  currentPage: state.currentPage,
  pageSize: state.pageSize,
  totalPages: state.totalPages,
  totalCount: state.totalCount,
  setCurrentPage: state.setCurrentPage,
  setPageSize: state.setPageSize,
  setPagination: state.setPagination,
}));

export const useTicketUI = () => useTicketStore((state) => ({
  viewMode: state.viewMode,
  sortBy: state.sortBy,
  sortOrder: state.sortOrder,
  isCreating: state.isCreating,
  isUpdating: state.isUpdating,
  isDeleting: state.isDeleting,
  setViewMode: state.setViewMode,
  setSorting: state.setSorting,
}));

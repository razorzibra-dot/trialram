/**
 * UI Store Slice
 */

import { StateCreator } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';
export type Portal = 'tenant' | 'super-admin';

export interface UISlice {
  // State
  theme: Theme;
  sidebarCollapsed: boolean;
  currentPortal: Portal;
  loading: boolean;
  breadcrumbs: Array<{ label: string; href?: string }>;
  pageTitle: string;
  
  // Actions
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentPortal: (portal: Portal) => void;
  setLoading: (loading: boolean) => void;
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; href?: string }>) => void;
  setPageTitle: (title: string) => void;
  resetUI: () => void;
}

export const createUISlice: StateCreator<
  UISlice,
  [['zustand/immer', never], ['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  UISlice
> = (set) => ({
  // Initial state
  theme: 'system',
  sidebarCollapsed: false,
  currentPortal: 'tenant',
  loading: false,
  breadcrumbs: [],
  pageTitle: '',

  // Actions
  setTheme: (theme) => {
    set((state) => {
      state.theme = theme;
    });
    
    // Apply theme to document
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  },

  toggleSidebar: () => {
    set((state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    });
  },

  setSidebarCollapsed: (collapsed) => {
    set((state) => {
      state.sidebarCollapsed = collapsed;
    });
  },

  setCurrentPortal: (portal) => {
    set((state) => {
      state.currentPortal = portal;
    });
  },

  setLoading: (loading) => {
    set((state) => {
      state.loading = loading;
    });
  },

  setBreadcrumbs: (breadcrumbs) => {
    set((state) => {
      state.breadcrumbs = breadcrumbs;
    });
  },

  setPageTitle: (title) => {
    set((state) => {
      state.pageTitle = title;
    });
    
    // Update document title
    document.title = title ? `${title} - CRM Portal` : 'CRM Portal';
  },

  resetUI: () => {
    set((state) => {
      state.loading = false;
      state.breadcrumbs = [];
      state.pageTitle = '';
    });
  },
});

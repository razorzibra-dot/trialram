/**
 * Authentication Store Slice
 */

import { StateCreator } from 'zustand';
import { User } from '@/types/auth';

export interface AuthSlice {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  clearAuth: () => void;
}

export const createAuthSlice: StateCreator<
  AuthSlice,
  [['zustand/immer', never], ['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  AuthSlice
> = (set, get) => ({
  // Initial state
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  login: async (credentials) => {
    set((state) => {
      state.isLoading = true;
      state.error = null;
    });

    try {
      // Import auth service dynamically to avoid circular dependencies
      const { authService } = await import('@/services');
      
      const response = await authService.login(credentials.email, credentials.password);
      
      set((state) => {
        state.user = response.user;
        state.token = response.token;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      });
    } catch (error) {
      set((state) => {
        state.error = error instanceof Error ? error.message : 'Login failed';
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });
      throw error;
    }
  },

  logout: async () => {
    set((state) => {
      state.isLoading = true;
    });

    try {
      const { authService } = await import('@/services');
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set((state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      });
    }
  },

  refreshToken: async () => {
    const { authService } = await import('@/services');
    const newToken = await authService.refreshToken();
    
    set((state) => {
      state.token = newToken;
    });
    
    return newToken;
  },

  setUser: (user) => {
    set((state) => {
      state.user = user;
      state.isAuthenticated = !!user;
    });
  },

  setToken: (token) => {
    set((state) => {
      state.token = token;
    });
  },

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

  hasRole: (role) => {
    const { user } = get();
    return user?.role === role || user?.roles?.includes(role) || false;
  },

  hasPermission: (permission) => {
    const { user } = get();
    return user?.permissions?.includes(permission) || false;
  },

  clearAuth: () => {
    set((state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    });
  },
});

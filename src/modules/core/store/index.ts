/**
 * Core Store Configuration
 * Centralized state management using Zustand
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';

// Store slices
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createUISlice, UISlice } from './slices/uiSlice';
import { createNotificationSlice, NotificationSlice } from './slices/notificationSlice';

// Combined store type
export interface RootStore extends AuthSlice, UISlice, NotificationSlice {}

// Create the main store
export const useStore = create<RootStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((...a) => ({
          ...createAuthSlice(...a),
          ...createUISlice(...a),
          ...createNotificationSlice(...a),
        }))
      ),
      {
        name: 'crm-store',
        partialize: (state) => ({
          // Only persist certain parts of the state
          auth: {
            user: state.user,
            token: state.token,
            isAuthenticated: state.isAuthenticated,
          },
          ui: {
            theme: state.theme,
            sidebarCollapsed: state.sidebarCollapsed,
            currentPortal: state.currentPortal,
          },
        }),
      }
    ),
    {
      name: 'CRM Store',
    }
  )
);

// Selector hooks for better performance
export const useAuth = () => useStore((state) => ({
  user: state.user,
  token: state.token,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  login: state.login,
  logout: state.logout,
  refreshToken: state.refreshToken,
  hasRole: state.hasRole,
  hasPermission: state.hasPermission,
}), shallow);

export const useUI = () => useStore((state) => ({
  theme: state.theme,
  sidebarCollapsed: state.sidebarCollapsed,
  currentPortal: state.currentPortal,
  loading: state.loading,
  setTheme: state.setTheme,
  toggleSidebar: state.toggleSidebar,
  setCurrentPortal: state.setCurrentPortal,
  setLoading: state.setLoading,
}), shallow);

export const useNotifications = () => useStore((state) => ({
  notifications: state.notifications,
  unreadCount: state.unreadCount,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  markAsRead: state.markAsRead,
  markAllAsRead: state.markAllAsRead,
  clearNotifications: state.clearNotifications,
}), shallow);

// Store actions for external use
export const storeActions = {
  auth: {
    login: (credentials: any) => useStore.getState().login(credentials),
    logout: () => useStore.getState().logout(),
    refreshToken: () => useStore.getState().refreshToken(),
  },
  ui: {
    setTheme: (theme: string) => useStore.getState().setTheme(theme),
    toggleSidebar: () => useStore.getState().toggleSidebar(),
    setLoading: (loading: boolean) => useStore.getState().setLoading(loading),
  },
  notifications: {
    add: (notification: any) => useStore.getState().addNotification(notification),
    remove: (id: string) => useStore.getState().removeNotification(id),
    markAsRead: (id: string) => useStore.getState().markAsRead(id),
  },
};

export default useStore;

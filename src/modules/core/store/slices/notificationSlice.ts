/**
 * Notification Store Slice
 */

import { StateCreator } from 'zustand';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  read: boolean;
  timestamp: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationSlice {
  // State
  notifications: Notification[];
  unreadCount: number;

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  getUnreadCount: () => number;
}

export const createNotificationSlice: StateCreator<
  NotificationSlice,
  [['zustand/immer', never], ['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  NotificationSlice
> = (set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,

  // Actions
  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    set((state) => {
      state.notifications.unshift(newNotification);
      state.unreadCount = state.notifications.filter(n => !n.read).length;
    });

    // Auto-remove success notifications after 5 seconds
    if (notification.type === 'success') {
      setTimeout(() => {
        get().removeNotification(newNotification.id);
      }, 5000);
    }
  },

  removeNotification: (id) => {
    set((state) => {
      state.notifications = state.notifications.filter(n => n.id !== id);
      state.unreadCount = state.notifications.filter(n => !n.read).length;
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const notification = state.notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = state.notifications.filter(n => !n.read).length;
      }
    });
  },

  markAllAsRead: () => {
    set((state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    });
  },

  clearNotifications: () => {
    set((state) => {
      state.notifications = [];
      state.unreadCount = 0;
    });
  },

  getUnreadCount: () => {
    return get().notifications.filter(n => !n.read).length;
  },
});

/**
 * Mock Notification Service
 * Handles user notifications, preferences, and alerts (Mock Implementation)
 */

import { authService } from './authService';

export interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read?: boolean;
  read?: boolean;
  read_at?: string;
  action_url?: string;
  action_label?: string;
  category?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  in_app: boolean;
  categories?: Record<string, {
    email: boolean;
    sms: boolean;
    push: boolean;
    in_app: boolean;
  }>;
}

export interface NotificationFilters {
  search?: string;
  is_read?: boolean;
  category?: string;
  userId?: string;
  read?: boolean;
}

class MockNotificationService {
  private mockNotifications: Notification[] = [
    {
      id: '1',
      user_id: 'user_1',
      type: 'success',
      title: 'Welcome Back',
      message: 'You have successfully logged in',
      category: 'system',
      is_read: false,
      read: false,
      tenant_id: 'tenant_1',
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
      updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: '2',
      user_id: 'user_1',
      type: 'info',
      title: 'New Customer Added',
      message: 'Customer TechCorp Solutions has been added to your list',
      category: 'customer',
      is_read: false,
      read: false,
      tenant_id: 'tenant_1',
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
      updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: '3',
      user_id: 'user_1',
      type: 'warning',
      title: 'Order Pending Review',
      message: 'Order #12345 is waiting for your approval',
      category: 'order',
      is_read: false,
      read: false,
      action_url: '/orders/12345',
      action_label: 'Review Order',
      tenant_id: 'tenant_1',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: '4',
      user_id: 'user_1',
      type: 'error',
      title: 'Payment Failed',
      message: 'Payment for invoice #INV-001 failed. Please retry.',
      category: 'payment',
      is_read: true,
      read: true,
      read_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      tenant_id: 'tenant_1',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
      updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    {
      id: '5',
      user_id: 'user_1',
      type: 'info',
      title: 'Report Generated',
      message: 'Your monthly sales report has been generated',
      category: 'report',
      is_read: true,
      read: true,
      read_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      tenant_id: 'tenant_1',
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      updated_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
  ];

  private mockPreferences: NotificationPreferences = {
    email: true,
    sms: false,
    push: true,
    in_app: true,
    categories: {
      customer: { email: true, sms: false, push: true, in_app: true },
      order: { email: true, sms: true, push: true, in_app: true },
      payment: { email: true, sms: true, push: true, in_app: true },
      system: { email: false, sms: false, push: true, in_app: true },
      report: { email: true, sms: false, push: false, in_app: true },
    },
  };

  private unsubscribeCallbacks: Array<(notification: Notification) => void> = [];

  /**
   * Get notifications for current user with optional filters
   */
  async getNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    try {
      let result = [...this.mockNotifications];

      // Apply search filter
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(n =>
          n.title.toLowerCase().includes(searchLower) ||
          n.message.toLowerCase().includes(searchLower)
        );
      }

      // Apply read filter
      if (filters?.is_read !== undefined) {
        result = result.filter(n => (n.read || n.is_read) === filters.is_read);
      } else if (filters?.read !== undefined) {
        result = result.filter(n => (n.read || n.is_read) === filters.read);
      }

      // Apply category filter
      if (filters?.category) {
        result = result.filter(n => n.category === filters.category);
      }

      // Sort by created_at descending
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return result;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences for current user
   */
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      return this.mockPreferences;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      this.mockPreferences = {
        ...this.mockPreferences,
        ...preferences,
      };
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    try {
      const notification = this.mockNotifications.find(n => n.id === id);
      if (notification) {
        notification.read = true;
        notification.is_read = true;
        notification.read_at = new Date().toISOString();
        notification.updated_at = new Date().toISOString();
      }
      return notification || {} as Notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<number> {
    try {
      let count = 0;
      this.mockNotifications.forEach(n => {
        if (!n.read && !n.is_read) {
          n.read = true;
          n.is_read = true;
          n.read_at = new Date().toISOString();
          n.updated_at = new Date().toISOString();
          count++;
        }
      });
      return count;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<void> {
    try {
      const index = this.mockNotifications.findIndex(n => n.id === id);
      if (index > -1) {
        this.mockNotifications.splice(index, 1);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Clear all notifications for current user
   */
  async clearAllNotifications(): Promise<number> {
    try {
      const count = this.mockNotifications.length;
      this.mockNotifications = [];
      return count;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  }

  /**
   * Subscribe to new notifications
   * In mock mode, simulates periodic checks or manual triggers
   */
  subscribeToNotifications(callback: (notification: Notification) => void): () => void {
    // Store callback
    this.unsubscribeCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.unsubscribeCallbacks.indexOf(callback);
      if (index > -1) {
        this.unsubscribeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Simulate receiving a new notification (for testing/demo purposes)
   */
  simulateNewNotification(notification: Partial<Notification>): void {
    const newNotification: Notification = {
      id: Date.now().toString(),
      user_id: 'user_1',
      type: (notification.type || 'info') as Notification['type'],
      title: notification.title || 'New Notification',
      message: notification.message || '',
      category: notification.category || 'system',
      is_read: false,
      read: false,
      tenant_id: 'tenant_1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...notification,
    };

    // Add to list
    this.mockNotifications.unshift(newNotification);

    // Notify all subscribers
    this.unsubscribeCallbacks.forEach(cb => cb(newNotification));
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    try {
      return this.mockNotifications.filter(n => !n.read && !n.is_read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    try {
      const stats = {
        total: this.mockNotifications.length,
        unread: this.mockNotifications.filter(n => !n.read && !n.is_read).length,
        byType: {} as Record<string, number>,
        byCategory: {} as Record<string, number>,
      };

      this.mockNotifications.forEach(n => {
        stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
        if (n.category) {
          stats.byCategory[n.category] = (stats.byCategory[n.category] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  /**
   * Generic notify method - creates and broadcasts a notification
   * Used by toast hooks for unified notifications
   */
  notify(options: {
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
    description?: string;
    duration?: number;
    category?: string;
  }): void {
    try {
      const notification: Notification = {
        id: Date.now().toString(),
        user_id: 'user_1',
        type: options.type,
        title: options.message,
        message: options.description || '',
        category: options.category || 'system',
        is_read: false,
        read: false,
        tenant_id: 'tenant_1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add to notifications list
      this.mockNotifications.unshift(notification);

      // Keep only last 100 notifications
      if (this.mockNotifications.length > 100) {
        this.mockNotifications = this.mockNotifications.slice(0, 100);
      }

      // Notify subscribers
      this.unsubscribeCallbacks.forEach(cb => cb(notification));
    } catch (error) {
      console.error('Error in notify method:', error);
    }
  }
}

export const notificationService = new MockNotificationService();

export default notificationService;
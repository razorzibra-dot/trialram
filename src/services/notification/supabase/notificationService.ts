/**
 * Supabase Notification Service
 * Handles user notifications, preferences, and alerts
 * Extends BaseSupabaseService for common database operations
 */

import { supabase, getSupabaseClient } from '../../supabase/client';

// Simple base service implementation since the import is missing
class BaseSupabaseService {
  constructor(private tableName: string, private useTenant: boolean) {}

  log(message: string, data?: any) {
    console.log(`[${this.constructor.name}] ${message}`, data);
  }

  logError(message: string, error: any) {
    console.error(`[${this.constructor.name}] ${message}`, error);
  }

  subscribeToChanges(options: any, callback: any) {
    // Stub implementation
    return () => {};
  }
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  read_at?: string;
  action_url?: string;
  action_label?: string;
  category?: string;
  is_read?: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: string;
  channel: 'email' | 'in_app' | 'sms' | 'push';
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationFilters {
  userId?: string;
  type?: string;
  read?: boolean;
  tenantId?: string;
}

export class SupabaseNotificationService extends BaseSupabaseService {
  constructor() {
    super('notifications', true);
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    try {
      this.log('Fetching notifications', filters);

      let query = getSupabaseClient()
        .from('notifications')
        .select('*');

      // Apply filters
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.tenantId) {
        query = query.eq('tenant_id', filters.tenantId);
      }
      if (filters?.read !== undefined) {
        query = query.eq('read', filters.read);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) throw error;

      this.log('Notifications fetched', { count: data?.length });
      return data?.map((n) => this.mapNotificationResponse(n)) || [];
    } catch (error) {
      this.logError('Error fetching notifications', error);
      throw error;
    }
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    try {
      this.log('Fetching unread notifications', { userId });

      return this.getNotifications({
        userId,
        read: false,
      });
    } catch (error) {
      this.logError('Error fetching unread notifications', error);
      throw error;
    }
  }

  /**
   * Get notification by ID
   */
  async getNotification(id: string): Promise<Notification | null> {
    try {
      this.log('Fetching notification', { id });

      const { data, error } = await getSupabaseClient()
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data ? this.mapNotificationResponse(data) : null;
    } catch (error) {
      this.logError('Error fetching notification', error);
      throw error;
    }
  }

  /**
   * Create notification
   */
  async createNotification(data: Partial<Notification>): Promise<Notification> {
    try {
      this.log('Creating notification', { user_id: data.user_id });

      const { data: created, error } = await getSupabaseClient()
        .from('notifications')
        .insert([
          {
            user_id: data.user_id,
            recipient_id: data.user_id, // Ensure both are set for backward compatibility
            type: data.type || 'info',
            title: data.title,
            message: data.message,
            data: data.data,
            is_read: false, // Use is_read only - primary field for read status
            action_url: data.action_url,
            action_label: data.action_label,
            category: data.category,
            tenant_id: data.tenant_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      this.log('Notification created successfully', { id: created.id });
      return this.mapNotificationResponse(created);
    } catch (error) {
      this.logError('Error creating notification', error);
      throw error;
    }
  }

  /**
   * Create multiple notifications
   */
  async createNotifications(notifications: Partial<Notification>[]): Promise<Notification[]> {
    try {
      this.log('Creating multiple notifications', { count: notifications.length });

      const { data, error } = await getSupabaseClient()
        .from('notifications')
        .insert(
          notifications.map((n) => ({
            user_id: n.user_id,
            recipient_id: n.user_id, // Ensure both are set for backward compatibility
            type: n.type || 'info',
            title: n.title,
            message: n.message,
            data: n.data,
            is_read: false, // Use is_read only - primary field for read status
            action_url: n.action_url,
            action_label: n.action_label,
            category: n.category,
            tenant_id: n.tenant_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        )
        .select();

      if (error) throw error;

      this.log('Notifications created successfully', { count: data?.length });
      return data?.map((n) => this.mapNotificationResponse(n)) || [];
    } catch (error) {
      this.logError('Error creating notifications', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    try {
      this.log('Marking notification as read', { id });

      const { data, error } = await getSupabaseClient()
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      this.log('Notification marked as read', { id });
      return this.mapNotificationResponse(data);
    } catch (error) {
      this.logError('Error marking notification as read', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      this.log('Marking all notifications as read', { userId });

      const { error, count } = await getSupabaseClient()
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      this.log('All notifications marked as read', { count });
      return count || 0;
    } catch (error) {
      this.logError('Error marking all notifications as read', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: string): Promise<void> {
    try {
      this.log('Deleting notification', { id });

      const { error } = await getSupabaseClient()
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.log('Notification deleted successfully', { id });
    } catch (error) {
      this.logError('Error deleting notification', error);
      throw error;
    }
  }

  /**
   * Clear all notifications for a user
   */
  async clearAllNotifications(userId: string): Promise<number> {
    try {
      this.log('Clearing all notifications', { userId });

      const { error, count } = await getSupabaseClient()
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      this.log('All notifications cleared', { count });
      return count || 0;
    } catch (error) {
      this.logError('Error clearing all notifications', error);
      throw error;
    }
  }

  /**
   * Get notification preferences for a user
   */
  async getPreferences(userId: string): Promise<NotificationPreference[]> {
    try {
      this.log('Fetching notification preferences', { userId });

      const { data, error } = await getSupabaseClient()
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      return data || [];
    } catch (error) {
      this.logError('Error fetching preferences', error);
      throw error;
    }
  }

  /**
   * Update notification preference
   */
  async updatePreference(
    userId: string,
    type: string,
    channel: 'email' | 'in_app' | 'sms' | 'push',
    enabled: boolean
  ): Promise<NotificationPreference> {
    try {
      this.log('Updating notification preference', { userId, type, channel });

      // Try to update existing preference
      let result = await getSupabaseClient()
        .from('notification_preferences')
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('notification_type', type)
        .eq('channel', channel)
        .select()
        .single();

      // If no existing preference, create one
      if (!result.data) {
        result = await getSupabaseClient()
          .from('notification_preferences')
          .insert([
            {
              user_id: userId,
              notification_type: type,
              channel,
              enabled,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      this.log('Preference updated successfully');
      return result.data;
    } catch (error) {
      this.logError('Error updating preference', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
  }> {
    try {
      this.log('Fetching notification statistics', { userId });

      const notifications = await this.getNotifications({ userId });

      const stats = {
        total: notifications.length,
        unread: notifications.filter((n) => !n.read).length,
        byType: {} as Record<string, number>,
      };

      notifications.forEach((n) => {
        stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      this.logError('Error fetching notification statistics', error);
      throw error;
    }
  }

  /**
   * Get aggregated notification preferences for current user
   * Returns preferences in the format expected by NotificationsPage
   */
  async getNotificationPreferences(): Promise<any> {
    try {
      this.log('Fetching aggregated notification preferences');

      // Get current user from auth context
      const { data: { user }, error: authError } = await getSupabaseClient().auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const preferences = await this.getPreferences(user.id);

      // Aggregate preferences into the expected format
      const aggregated = {
        email: true,
        sms: false,
        push: true,
        in_app: true,
        categories: {} as Record<string, any>,
      };

      // Group preferences by notification type
      const typeMap: Record<string, Record<string, boolean>> = {};

      preferences.forEach((pref) => {
        if (!typeMap[pref.notification_type]) {
          typeMap[pref.notification_type] = {};
        }
        typeMap[pref.notification_type][pref.channel] = pref.enabled;
      });

      // Build categories from aggregated preferences
      Object.entries(typeMap).forEach(([type, channels]) => {
        aggregated.categories[type] = {
          email: channels.email ?? true,
          sms: channels.sms ?? false,
          push: channels.push ?? true,
          in_app: channels.in_app ?? true,
        };
      });

      return aggregated;
    } catch (error) {
      this.logError('Error fetching aggregated notification preferences', error);
      // Return defaults on error
      return {
        email: true,
        sms: false,
        push: true,
        in_app: true,
        categories: {},
      };
    }
  }

  /**
   * Update notification preferences for current user
   */
  async updateNotificationPreferences(preferences: Partial<any>): Promise<void> {
    try {
      this.log('Updating notification preferences', preferences);

      // Get current user from auth context
      const { data: { user }, error: authError } = await getSupabaseClient().auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Update global preferences
      const updates: Array<Promise<any>> = [];

      if (preferences.email !== undefined) {
        updates.push(
          this.updatePreference(user.id, 'all', 'email', preferences.email)
        );
      }
      if (preferences.sms !== undefined) {
        updates.push(
          this.updatePreference(user.id, 'all', 'sms', preferences.sms)
        );
      }
      if (preferences.push !== undefined) {
        updates.push(
          this.updatePreference(user.id, 'all', 'push', preferences.push)
        );
      }
      if (preferences.in_app !== undefined) {
        updates.push(
          this.updatePreference(user.id, 'all', 'in_app', preferences.in_app)
        );
      }

      // Update category preferences
      if (preferences.categories) {
        Object.entries(preferences.categories).forEach(([category, channels]) => {
          const channelsObj = channels as Record<string, boolean>;
          if (channelsObj.email !== undefined) {
            updates.push(
              this.updatePreference(user.id, category, 'email', channelsObj.email)
            );
          }
          if (channelsObj.sms !== undefined) {
            updates.push(
              this.updatePreference(user.id, category, 'sms', channelsObj.sms)
            );
          }
          if (channelsObj.push !== undefined) {
            updates.push(
              this.updatePreference(user.id, category, 'push', channelsObj.push)
            );
          }
          if (channelsObj.in_app !== undefined) {
            updates.push(
              this.updatePreference(user.id, category, 'in_app', channelsObj.in_app)
            );
          }
        });
      }

      await Promise.all(updates);
      this.log('Notification preferences updated successfully');
    } catch (error) {
      this.logError('Error updating notification preferences', error);
      throw error;
    }
  }

  /**
   * Subscribe to notifications for current user
   * Automatically gets user ID from auth context
   */
  subscribeToNotifications(callback: (notification: any) => void): () => void {
    let unsubscribeFn: (() => void) | null = null;

    // Get current user and subscribe
    getSupabaseClient().auth.getUser().then(({ data: { user } }) => {
      if (user) {
        unsubscribeFn = this.subscribeToChangesForUser(user.id, callback);
      }
    }).catch((error) => {
      this.logError('Error getting current user for notification subscription', error);
    });

    // Return unsubscribe function that will be set when subscription is ready
    return () => {
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }

  /**
   * Subscribe to notifications for a specific user
   */
  private subscribeToChangesForUser(
    userId: string,
    callback: (payload: any) => void
  ): () => void {
    return this.subscribeToChanges(
      {
        event: '*',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      callback
    );
  }

  /**
   * Subscribe to notifications for a user (legacy method)
   */
  subscribeToNotificationsForUser(
    userId: string,
    callback: (payload: any) => void
  ): () => void {
    return this.subscribeToChangesForUser(userId, callback);
  }

  /**
   * Map database notification response to Notification type
   */
  private mapNotificationResponse(dbNotification: any): Notification {
    // Handle both old schema (is_read, recipient_id) and new schema (read, user_id)
    const read = dbNotification.read !== undefined ? dbNotification.read : (dbNotification.is_read || false);
    const userId = dbNotification.user_id || dbNotification.recipient_id;
    
    return {
      id: dbNotification.id,
      user_id: userId,
      type: (dbNotification.type || 'info') as Notification['type'],
      title: dbNotification.title,
      message: dbNotification.message,
      data: dbNotification.data || {},
      read: read,
      is_read: read,
      read_at: dbNotification.read_at,
      action_url: dbNotification.action_url,
      action_label: dbNotification.action_label,
      category: dbNotification.category || dbNotification.notification_type || 'system',
      tenant_id: dbNotification.tenant_id,
      created_at: dbNotification.created_at,
      updated_at: dbNotification.updated_at,
    };
  }
}

// Export singleton instance
export const supabaseNotificationService = new SupabaseNotificationService();
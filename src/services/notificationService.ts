/**
 * Notification Service
 * Manages user notifications and preferences
 */

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'system' | 'user' | 'alert' | 'reminder';
  is_read: boolean;
  user_id: string;
  link?: string;
  created_at: string;
  read_at?: string;
}

export interface NotificationFilters {
  is_read?: boolean;
  type?: string;
  category?: string;
  search?: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  notification_types: {
    system: boolean;
    user: boolean;
    alert: boolean;
    reminder: boolean;
  };
}

class NotificationService {
  private mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'New Customer Added',
      message: 'A new customer "Acme Corp" has been added to the system.',
      type: 'success',
      category: 'user',
      is_read: false,
      user_id: 'user_1',
      link: '/customers',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
    },
    {
      id: '2',
      title: 'System Maintenance Scheduled',
      message: 'System maintenance is scheduled for tonight at 2:00 AM EST.',
      type: 'warning',
      category: 'system',
      is_read: false,
      user_id: 'user_1',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    },
    {
      id: '3',
      title: 'Contract Expiring Soon',
      message: 'Service contract #SC-001 will expire in 7 days.',
      type: 'warning',
      category: 'alert',
      is_read: true,
      user_id: 'user_1',
      link: '/service-contracts',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
      read_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
    },
    {
      id: '4',
      title: 'New Support Ticket',
      message: 'New support ticket #TKT-1234 has been assigned to you.',
      type: 'info',
      category: 'user',
      is_read: false,
      user_id: 'user_1',
      link: '/tickets',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() // 8 hours ago
    },
    {
      id: '5',
      title: 'Payment Received',
      message: 'Payment of $5,000 received from customer "Tech Solutions Inc".',
      type: 'success',
      category: 'user',
      is_read: true,
      user_id: 'user_1',
      link: '/sales/product-sales',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      read_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString()
    },
    {
      id: '6',
      title: 'Failed Login Attempt',
      message: 'Multiple failed login attempts detected from IP 192.168.1.100.',
      type: 'error',
      category: 'alert',
      is_read: false,
      user_id: 'user_1',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 days ago
    },
    {
      id: '7',
      title: 'Task Reminder',
      message: 'You have 3 pending tasks due today.',
      type: 'info',
      category: 'reminder',
      is_read: true,
      user_id: 'user_1',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      read_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
    },
    {
      id: '8',
      title: 'Database Backup Completed',
      message: 'Automated database backup completed successfully.',
      type: 'success',
      category: 'system',
      is_read: true,
      user_id: 'user_1',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
      read_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString()
    }
  ];

  private mockPreferences: NotificationPreferences = {
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    notification_types: {
      system: true,
      user: true,
      alert: true,
      reminder: true
    }
  };

  async getNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = [...this.mockNotifications];

    if (filters?.is_read !== undefined) {
      filtered = filtered.filter(n => n.is_read === filters.is_read);
    }

    if (filters?.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    if (filters?.category) {
      filtered = filtered.filter(n => n.category === filters.category);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(search) ||
        n.message.toLowerCase().includes(search)
      );
    }

    // Sort by created_at descending (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return filtered;
  }

  async getNotification(id: string): Promise<Notification> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const notification = this.mockNotifications.find(n => n.id === id);
    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  }

  async markAsRead(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const notification = this.mockNotifications.find(n => n.id === id);
    if (notification) {
      notification.is_read = true;
      notification.read_at = new Date().toISOString();
    }
  }

  async markAsUnread(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const notification = this.mockNotifications.find(n => n.id === id);
    if (notification) {
      notification.is_read = false;
      notification.read_at = undefined;
    }
  }

  async markAllAsRead(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const now = new Date().toISOString();
    this.mockNotifications.forEach(n => {
      if (!n.is_read) {
        n.is_read = true;
        n.read_at = now;
      }
    });
  }

  async deleteNotification(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = this.mockNotifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.mockNotifications.splice(index, 1);
    }
  }

  async deleteAllRead(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.mockNotifications = this.mockNotifications.filter(n => !n.is_read);
  }

  async getUnreadCount(): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return this.mockNotifications.filter(n => !n.is_read).length;
  }

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return { ...this.mockPreferences };
  }

  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.mockPreferences = {
      ...this.mockPreferences,
      ...preferences
    };

    return { ...this.mockPreferences };
  }

  async createNotification(data: Omit<Notification, 'id' | 'created_at' | 'is_read'>): Promise<Notification> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newNotification: Notification = {
      ...data,
      id: `notification_${Date.now()}`,
      is_read: false,
      created_at: new Date().toISOString()
    };

    this.mockNotifications.unshift(newNotification);
    return newNotification;
  }

  // Real-time notification simulation
  subscribeToNotifications(callback: (notification: Notification) => void): () => void {
    // Simulate receiving a new notification every 30 seconds
    const interval = setInterval(() => {
      const randomNotifications = [
        {
          title: 'New Message',
          message: 'You have a new message from a customer.',
          type: 'info' as const,
          category: 'user' as const,
          user_id: 'user_1'
        },
        {
          title: 'Task Completed',
          message: 'Your scheduled task has been completed.',
          type: 'success' as const,
          category: 'system' as const,
          user_id: 'user_1'
        },
        {
          title: 'Reminder',
          message: 'You have a meeting in 15 minutes.',
          type: 'warning' as const,
          category: 'reminder' as const,
          user_id: 'user_1'
        }
      ];

      const randomNotification = randomNotifications[Math.floor(Math.random() * randomNotifications.length)];
      
      const notification: Notification = {
        ...randomNotification,
        id: `notification_${Date.now()}`,
        is_read: false,
        created_at: new Date().toISOString()
      };

      this.mockNotifications.unshift(notification);
      callback(notification);
    }, 30000); // Every 30 seconds

    // Return unsubscribe function
    return () => clearInterval(interval);
  }
}

export const notificationService = new NotificationService();
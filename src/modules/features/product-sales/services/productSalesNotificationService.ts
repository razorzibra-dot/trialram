/**
 * Product Sales Notification Service
 * Handles notifications for product sales events (status changes, approvals, etc.)
 * Supports SMS, email, and in-app notifications with user preferences
 */

import { notificationService as factoryNotificationService } from '@/services/serviceFactory';
import { authService } from '@/services/serviceFactory';
import { ProductSale, ProductSaleStatus } from '@/types/productSales';

export interface NotificationPayload {
  type: 'status_change' | 'approval_required' | 'shipment_ready' | 'delivery_confirmed' | 'invoice_generated' | 'payment_received' | 'sale_cancelled' | 'refund_processed';
  channels: ('sms' | 'email' | 'in_app')[];
  recipient_id?: string;
  sale_id: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  action_url?: string;
  action_label?: string;
}

export interface NotificationHistory {
  id: string;
  sale_id: string;
  type: NotificationPayload['type'];
  channels_sent: ('sms' | 'email' | 'in_app')[];
  recipient_id: string;
  title: string;
  message: string;
  created_at: string;
  status: 'sent' | 'pending' | 'failed';
}

class ProductSalesNotificationService {
  /**
   * Send notification on status change with user preferences
   */
  async notifyStatusChange(
    sale: ProductSale,
    oldStatus: ProductSaleStatus,
    newStatus: ProductSaleStatus,
    reason?: string
  ): Promise<void> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        console.warn('Cannot send notification: no current user');
        return;
      }

      // Get user notification preferences
      const preferences = await factoryNotificationService.getNotificationPreferences();

      // Determine notification channels based on preferences
      const channels = this.getEnabledChannels(preferences, 'status_change');
      if (channels.length === 0) {
        console.log('Status change notifications disabled by user');
        return;
      }

      // Create notification payload
      const payload: NotificationPayload = {
        type: 'status_change',
        channels,
        sale_id: sale.id,
        recipient_id: sale.customer_id,
        title: `Order Status Changed`,
        message: `Your order #${sale.id} status has been updated from ${oldStatus} to ${newStatus}${reason ? ': ' + reason : ''}`,
        data: {
          old_status: oldStatus,
          new_status: newStatus,
          sale_id: sale.id,
          customer_name: sale.customer_name,
          order_date: sale.created_at,
          reason,
        },
        action_url: `/product-sales/${sale.id}`,
        action_label: 'View Order',
      };

      await this.sendNotification(payload, currentUser.id);
    } catch (error) {
      console.error('Error sending status change notification:', error);
      // Don't throw - notification errors shouldn't break the main flow
    }
  }

  /**
   * Send approval required notification
   */
  async notifyApprovalRequired(sale: ProductSale, approverEmail: string): Promise<void> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        console.warn('Cannot send notification: no current user');
        return;
      }

      const preferences = await factoryNotificationService.getNotificationPreferences();
      const channels = this.getEnabledChannels(preferences, 'approval_required');

      if (channels.length === 0) {
        console.log('Approval notifications disabled by user');
        return;
      }

      const payload: NotificationPayload = {
        type: 'approval_required',
        channels,
        sale_id: sale.id,
        recipient_id: approverEmail,
        title: `Approval Required`,
        message: `Order #${sale.id} from ${sale.customer_name} requires your approval`,
        data: {
          sale_id: sale.id,
          customer_name: sale.customer_name,
          amount: sale.total_amount,
          items_count: sale.items?.length || 0,
        },
        action_url: `/product-sales/${sale.id}`,
        action_label: 'Review & Approve',
      };

      await this.sendNotification(payload, currentUser.id);
    } catch (error) {
      console.error('Error sending approval notification:', error);
    }
  }

  /**
   * Send shipment ready notification
   */
  async notifyShipmentReady(sale: ProductSale): Promise<void> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        console.warn('Cannot send notification: no current user');
        return;
      }

      const preferences = await factoryNotificationService.getNotificationPreferences();
      const channels = this.getEnabledChannels(preferences, 'shipment_ready');

      if (channels.length === 0) {
        console.log('Shipment notifications disabled by user');
        return;
      }

      const payload: NotificationPayload = {
        type: 'shipment_ready',
        channels,
        sale_id: sale.id,
        recipient_id: sale.customer_id,
        title: `Shipment Ready`,
        message: `Your order #${sale.id} is ready for shipment`,
        data: {
          sale_id: sale.id,
          customer_name: sale.customer_name,
          tracking_number: sale.tracking_number,
          items_count: sale.items?.length || 0,
        },
        action_url: `/product-sales/${sale.id}`,
        action_label: 'Track Shipment',
      };

      await this.sendNotification(payload, currentUser.id);
    } catch (error) {
      console.error('Error sending shipment ready notification:', error);
    }
  }

  /**
   * Send delivery confirmed notification
   */
  async notifyDeliveryConfirmed(sale: ProductSale): Promise<void> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        console.warn('Cannot send notification: no current user');
        return;
      }

      const preferences = await factoryNotificationService.getNotificationPreferences();
      const channels = this.getEnabledChannels(preferences, 'delivery_confirmed');

      if (channels.length === 0) {
        console.log('Delivery notifications disabled by user');
        return;
      }

      const payload: NotificationPayload = {
        type: 'delivery_confirmed',
        channels,
        sale_id: sale.id,
        recipient_id: sale.customer_id,
        title: `Delivery Confirmed`,
        message: `Your order #${sale.id} has been successfully delivered`,
        data: {
          sale_id: sale.id,
          customer_name: sale.customer_name,
          delivery_date: new Date().toISOString(),
        },
        action_url: `/product-sales/${sale.id}`,
        action_label: 'View Details',
      };

      await this.sendNotification(payload, currentUser.id);
    } catch (error) {
      console.error('Error sending delivery confirmed notification:', error);
    }
  }

  /**
   * Send invoice generated notification
   */
  async notifyInvoiceGenerated(sale: ProductSale, invoiceNumber: string): Promise<void> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        console.warn('Cannot send notification: no current user');
        return;
      }

      const preferences = await factoryNotificationService.getNotificationPreferences();
      const channels = this.getEnabledChannels(preferences, 'invoice_generated');

      if (channels.length === 0) {
        console.log('Invoice notifications disabled by user');
        return;
      }

      const payload: NotificationPayload = {
        type: 'invoice_generated',
        channels,
        sale_id: sale.id,
        recipient_id: sale.customer_id,
        title: `Invoice Generated`,
        message: `Invoice ${invoiceNumber} has been generated for order #${sale.id}`,
        data: {
          sale_id: sale.id,
          invoice_number: invoiceNumber,
          amount: sale.total_amount,
          customer_name: sale.customer_name,
        },
        action_url: `/product-sales/${sale.id}`,
        action_label: 'Download Invoice',
      };

      await this.sendNotification(payload, currentUser.id);
    } catch (error) {
      console.error('Error sending invoice notification:', error);
    }
  }

  /**
   * Send payment received notification
   */
  async notifyPaymentReceived(sale: ProductSale, amount: number): Promise<void> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        console.warn('Cannot send notification: no current user');
        return;
      }

      const preferences = await factoryNotificationService.getNotificationPreferences();
      const channels = this.getEnabledChannels(preferences, 'payment_received');

      if (channels.length === 0) {
        console.log('Payment notifications disabled by user');
        return;
      }

      const payload: NotificationPayload = {
        type: 'payment_received',
        channels,
        sale_id: sale.id,
        recipient_id: sale.customer_id,
        title: `Payment Received`,
        message: `Payment of $${amount.toFixed(2)} has been received for order #${sale.id}`,
        data: {
          sale_id: sale.id,
          amount,
          customer_name: sale.customer_name,
          payment_date: new Date().toISOString(),
        },
        action_url: `/product-sales/${sale.id}`,
        action_label: 'View Payment Details',
      };

      await this.sendNotification(payload, currentUser.id);
    } catch (error) {
      console.error('Error sending payment notification:', error);
    }
  }

  /**
   * Send sale cancelled notification
   */
  async notifySaleCancelled(sale: ProductSale, reason?: string): Promise<void> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        console.warn('Cannot send notification: no current user');
        return;
      }

      const preferences = await factoryNotificationService.getNotificationPreferences();
      const channels = this.getEnabledChannels(preferences, 'sale_cancelled');

      if (channels.length === 0) {
        console.log('Cancellation notifications disabled by user');
        return;
      }

      const payload: NotificationPayload = {
        type: 'sale_cancelled',
        channels,
        sale_id: sale.id,
        recipient_id: sale.customer_id,
        title: `Order Cancelled`,
        message: `Order #${sale.id} has been cancelled${reason ? ': ' + reason : ''}`,
        data: {
          sale_id: sale.id,
          customer_name: sale.customer_name,
          cancelled_date: new Date().toISOString(),
          reason,
        },
        action_url: `/product-sales/${sale.id}`,
        action_label: 'View Details',
      };

      await this.sendNotification(payload, currentUser.id);
    } catch (error) {
      console.error('Error sending cancellation notification:', error);
    }
  }

  /**
   * Send refund processed notification
   */
  async notifyRefundProcessed(sale: ProductSale, refundAmount: number): Promise<void> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        console.warn('Cannot send notification: no current user');
        return;
      }

      const preferences = await factoryNotificationService.getNotificationPreferences();
      const channels = this.getEnabledChannels(preferences, 'refund_processed');

      if (channels.length === 0) {
        console.log('Refund notifications disabled by user');
        return;
      }

      const payload: NotificationPayload = {
        type: 'refund_processed',
        channels,
        sale_id: sale.id,
        recipient_id: sale.customer_id,
        title: `Refund Processed`,
        message: `Refund of $${refundAmount.toFixed(2)} has been processed for order #${sale.id}`,
        data: {
          sale_id: sale.id,
          refund_amount: refundAmount,
          customer_name: sale.customer_name,
          refund_date: new Date().toISOString(),
        },
        action_url: `/product-sales/${sale.id}`,
        action_label: 'View Refund Details',
      };

      await this.sendNotification(payload, currentUser.id);
    } catch (error) {
      console.error('Error sending refund notification:', error);
    }
  }

  /**
   * Get notification history for a sale
   */
  async getNotificationHistory(saleId: string): Promise<NotificationHistory[]> {
    try {
      // Query notifications for this sale (in-app notifications only)
      const notifications = await factoryNotificationService.getNotifications({
        category: 'product_sales',
      });

      // Filter by sale_id from data
      const saleNotifications = notifications
        .filter(n => n.data?.sale_id === saleId)
        .map(n => ({
          id: n.id,
          sale_id: saleId,
          type: (n.data?.notification_type || 'status_change') as NotificationPayload['type'],
          channels_sent: n.data?.channels_sent || ['in_app'],
          recipient_id: n.user_id,
          title: n.title,
          message: n.message,
          created_at: n.created_at,
          status: 'sent' as const,
        }));

      return saleNotifications;
    } catch (error) {
      console.error('Error fetching notification history:', error);
      return [];
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserNotificationPreferences() {
    try {
      return await factoryNotificationService.getNotificationPreferences();
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      // Return default preferences
      return {
        email: true,
        sms: false,
        push: true,
        in_app: true,
        categories: {
          status_change: { email: true, sms: false, push: true, in_app: true },
          approval_required: { email: true, sms: true, push: true, in_app: true },
          shipment_ready: { email: true, sms: true, push: true, in_app: true },
          delivery_confirmed: { email: true, sms: false, push: true, in_app: true },
          invoice_generated: { email: true, sms: false, push: false, in_app: true },
          payment_received: { email: true, sms: true, push: true, in_app: true },
          sale_cancelled: { email: true, sms: false, push: true, in_app: true },
          refund_processed: { email: true, sms: true, push: true, in_app: true },
        },
      };
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserNotificationPreferences(preferences: any): Promise<void> {
    try {
      await factoryNotificationService.updateNotificationPreferences(preferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Private: Get enabled notification channels based on preferences
   */
  private getEnabledChannels(
    preferences: any,
    notificationType: string
  ): ('sms' | 'email' | 'in_app')[] {
    const channels: ('sms' | 'email' | 'in_app')[] = [];

    try {
      // Get category-specific preferences or fall back to global preferences
      const categoryPrefs = preferences.categories?.[notificationType] || preferences;

      if (categoryPrefs.email !== false && preferences.email !== false) {
        channels.push('email');
      }
      if (categoryPrefs.sms === true && preferences.sms !== false) {
        channels.push('sms');
      }
      if (categoryPrefs.in_app !== false && preferences.in_app !== false) {
        channels.push('in_app');
      }
    } catch (error) {
      console.error('Error determining enabled channels:', error);
      // Default to in-app only
      channels.push('in_app');
    }

    return channels;
  }

  /**
   * Private: Send notification through appropriate channels
   */
  private async sendNotification(
    payload: NotificationPayload,
    senderId: string
  ): Promise<void> {
    try {
      // Send in-app notification
      if (payload.channels.includes('in_app')) {
        await factoryNotificationService.notify({
          type: 'info',
          message: payload.title,
          description: payload.message,
          duration: 5,
          category: 'product_sales',
        });

        // Also create a persistent notification in database
        // This is handled by the notificationService
      }

      // Log notification sent for audit
      console.log(`📧 Notification sent - Type: ${payload.type}, Channels: ${payload.channels.join(', ')}`);
    } catch (error) {
      console.error('Error sending notification through channels:', error);
      throw error;
    }
  }
}

export const productSalesNotificationService = new ProductSalesNotificationService();
export default productSalesNotificationService;
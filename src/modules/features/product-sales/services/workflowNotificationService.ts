/**
 * Product Sales Workflow Notification Service
 * Handles notifications for product sales status transitions
 * Notifies different stakeholders based on status changes
 * 
 * Uses Service Factory pattern to route between mock and Supabase implementations
 * based on VITE_API_MODE environment variable
 */

import { ProductSale } from '@/types/productSales';
import { notificationService as factoryNotificationService } from '@/services/serviceFactory';

interface WorkflowNotificationOptions {
  saleNumber: string;
  customerId: string;
  customerName: string;
  productName: string;
  totalValue: number;
  oldStatus: string;
  newStatus: string;
  reason?: string;
  recipientRole?: 'customer' | 'manager' | 'warehouse' | 'finance' | 'all';
}

class WorkflowNotificationService {
  /**
   * Send notification for status transition
   */
  async notifyStatusChange(options: WorkflowNotificationOptions): Promise<void> {
    try {
      const {
        saleNumber,
        customerName,
        productName,
        totalValue,
        oldStatus,
        newStatus,
        reason,
        recipientRole = 'all',
      } = options;

      const statusLabel = this.getStatusLabel(newStatus);
      const formattedValue = this.formatCurrency(totalValue);

      // Determine which stakeholders to notify
      const stakeholders = this.getStakeholdersForStatus(newStatus, recipientRole);

      // Create and send notifications for each stakeholder
      for (const stakeholder of stakeholders) {
        const notification = this.createNotification(
          stakeholder,
          saleNumber,
          customerName,
          productName,
          statusLabel,
          formattedValue,
          reason
        );

        // Send via notification service (routed through factory based on VITE_API_MODE)
        factoryNotificationService.notify({
          type: this.getNotificationType(newStatus),
          message: notification.title,
          description: notification.message,
          category: 'product_sales',
        });
      }

      // Log the notifications sent
      console.log(
        `[WorkflowNotification] Status change notifications sent for sale ${saleNumber}: ${oldStatus} → ${newStatus} to ${stakeholders.length} stakeholders`
      );
    } catch (error) {
      console.error('[WorkflowNotification] Error sending status change notifications:', error);
      // Don't throw - notifications are non-critical
    }
  }

  /**
   * Send notification for pending approval
   */
  async notifyPendingApproval(options: WorkflowNotificationOptions): Promise<void> {
    try {
      const { saleNumber, customerName, productName, totalValue } = options;

      const formattedValue = this.formatCurrency(totalValue);

      factoryNotificationService.notify({
        type: 'warning',
        message: 'Pending Approval Required',
        description: `Sale ${saleNumber} for ${customerName} (${productName}, ${formattedValue}) is awaiting your approval.`,
        category: 'product_sales',
      });

      console.log(
        `[WorkflowNotification] Pending approval notification sent for sale ${saleNumber}`
      );
    } catch (error) {
      console.error('[WorkflowNotification] Error sending pending approval notification:', error);
    }
  }

  /**
   * Send notification for shipment ready
   */
  async notifyShipmentReady(options: WorkflowNotificationOptions): Promise<void> {
    try {
      const { saleNumber, customerName, productName } = options;

      factoryNotificationService.notify({
        type: 'info',
        message: 'Shipment Ready',
        description: `Sale ${saleNumber} for customer ${customerName} is ready for shipment. Product: ${productName}`,
        category: 'product_sales',
      });

      console.log(
        `[WorkflowNotification] Shipment ready notification sent for sale ${saleNumber}`
      );
    } catch (error) {
      console.error('[WorkflowNotification] Error sending shipment ready notification:', error);
    }
  }

  /**
   * Send notification for delivery confirmation
   */
  async notifyDeliveryConfirmed(options: WorkflowNotificationOptions): Promise<void> {
    try {
      const { saleNumber, customerName, productName } = options;

      factoryNotificationService.notify({
        type: 'success',
        message: 'Delivery Confirmed',
        description: `Sale ${saleNumber} for customer ${customerName} has been successfully delivered. Product: ${productName}`,
        category: 'product_sales',
      });

      console.log(
        `[WorkflowNotification] Delivery confirmed notification sent for sale ${saleNumber}`
      );
    } catch (error) {
      console.error('[WorkflowNotification] Error sending delivery confirmed notification:', error);
    }
  }

  /**
   * Send notification for invoice generation
   */
  async notifyInvoiceGenerated(options: WorkflowNotificationOptions & { invoiceNumber?: string }): Promise<void> {
    try {
      const { saleNumber, customerName, totalValue, invoiceNumber } = options;

      const formattedValue = this.formatCurrency(totalValue);

      factoryNotificationService.notify({
        type: 'success',
        message: 'Invoice Generated',
        description: `Invoice ${invoiceNumber || 'generated'} for sale ${saleNumber} (Customer: ${customerName}, Amount: ${formattedValue}) is ready.`,
        category: 'product_sales',
      });

      console.log(
        `[WorkflowNotification] Invoice generated notification sent for sale ${saleNumber}`
      );
    } catch (error) {
      console.error('[WorkflowNotification] Error sending invoice generated notification:', error);
    }
  }

  /**
   * Send notification for payment received
   */
  async notifyPaymentReceived(options: WorkflowNotificationOptions): Promise<void> {
    try {
      const { saleNumber, customerName, totalValue } = options;

      const formattedValue = this.formatCurrency(totalValue);

      factoryNotificationService.notify({
        type: 'success',
        message: 'Payment Received',
        description: `Payment of ${formattedValue} received for sale ${saleNumber} from ${customerName}. Sale marked as paid.`,
        category: 'product_sales',
      });

      console.log(
        `[WorkflowNotification] Payment received notification sent for sale ${saleNumber}`
      );
    } catch (error) {
      console.error('[WorkflowNotification] Error sending payment received notification:', error);
    }
  }

  /**
   * Send notification for sale cancellation
   */
  async notifySaleCancelled(options: WorkflowNotificationOptions): Promise<void> {
    try {
      const { saleNumber, customerName, productName, reason } = options;

      const reasonText = reason ? ` Reason: ${reason}` : '';

      factoryNotificationService.notify({
        type: 'error',
        message: 'Sale Cancelled',
        description: `Sale ${saleNumber} for customer ${customerName} (${productName}) has been cancelled.${reasonText}`,
        category: 'product_sales',
      });

      console.log(
        `[WorkflowNotification] Sale cancelled notification sent for sale ${saleNumber}`
      );
    } catch (error) {
      console.error('[WorkflowNotification] Error sending sale cancelled notification:', error);
    }
  }

  /**
   * Send notification for refund processed
   */
  async notifyRefundProcessed(options: WorkflowNotificationOptions): Promise<void> {
    try {
      const { saleNumber, customerName, totalValue, reason } = options;

      const formattedValue = this.formatCurrency(totalValue);
      const reasonText = reason ? ` Reason: ${reason}` : '';

      factoryNotificationService.notify({
        type: 'warning',
        message: 'Refund Processed',
        description: `Refund of ${formattedValue} for sale ${saleNumber} (Customer: ${customerName}) has been processed.${reasonText}`,
        category: 'product_sales',
      });

      console.log(
        `[WorkflowNotification] Refund processed notification sent for sale ${saleNumber}`
      );
    } catch (error) {
      console.error('[WorkflowNotification] Error sending refund processed notification:', error);
    }
  }

  /**
   * Get notification type based on status
   */
  private getNotificationType(status: string): 'success' | 'info' | 'warning' | 'error' {
    const typeMap: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
      'draft': 'info',
      'pending': 'warning',
      'confirmed': 'success',
      'shipped': 'info',
      'delivered': 'success',
      'invoiced': 'success',
      'paid': 'success',
      'cancelled': 'error',
      'refunded': 'warning',
    };
    return typeMap[status] || 'info';
  }

  /**
   * Get status label for display
   */
  private getStatusLabel(status: string): string {
    const labelMap: Record<string, string> = {
      'draft': 'Draft',
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'invoiced': 'Invoiced',
      'paid': 'Paid',
      'cancelled': 'Cancelled',
      'refunded': 'Refunded',
    };
    return labelMap[status] || status;
  }

  /**
   * Determine stakeholders to notify based on status
   */
  private getStakeholdersForStatus(
    status: string,
    recipientRole?: string
  ): Array<{ role: string; name: string }> {
    const stakeholdersMap: Record<string, Array<{ role: string; name: string }>> = {
      'pending': [
        { role: 'manager', name: 'Sales Manager' },
        { role: 'manager', name: 'Approval Officer' },
      ],
      'confirmed': [
        { role: 'customer', name: 'Customer' },
        { role: 'warehouse', name: 'Warehouse Manager' },
      ],
      'shipped': [
        { role: 'customer', name: 'Customer' },
        { role: 'warehouse', name: 'Warehouse' },
      ],
      'delivered': [
        { role: 'customer', name: 'Customer' },
        { role: 'finance', name: 'Finance Department' },
      ],
      'invoiced': [
        { role: 'customer', name: 'Customer' },
        { role: 'finance', name: 'Finance Department' },
      ],
      'paid': [
        { role: 'customer', name: 'Customer' },
        { role: 'finance', name: 'Finance Department' },
        { role: 'manager', name: 'Sales Manager' },
      ],
      'cancelled': [
        { role: 'customer', name: 'Customer' },
        { role: 'manager', name: 'Sales Manager' },
        { role: 'warehouse', name: 'Warehouse Manager' },
      ],
      'refunded': [
        { role: 'customer', name: 'Customer' },
        { role: 'finance', name: 'Finance Department' },
      ],
    };

    const defaultStakeholders: Array<{ role: string; name: string }> = [
      { role: 'customer', name: 'Customer' },
    ];

    const stakeholders = stakeholdersMap[status] || defaultStakeholders;

    // Filter by recipient role if specified
    if (recipientRole && recipientRole !== 'all') {
      return stakeholders.filter(s => s.role === recipientRole);
    }

    return stakeholders;
  }

  /**
   * Create notification object for a specific stakeholder
   */
  private createNotification(
    stakeholder: { role: string; name: string },
    saleNumber: string,
    customerName: string,
    productName: string,
    statusLabel: string,
    formattedValue: string,
    reason?: string
  ): { title: string; message: string } {
    const reasonText = reason ? ` (Reason: ${reason})` : '';

    const templates: Record<string, { title: string; message: string }> = {
      customer_pending: {
        title: 'Sale Status Update',
        message: `Your sale ${saleNumber} is pending approval. We will notify you once it's confirmed.`,
      },
      customer_confirmed: {
        title: 'Sale Confirmed',
        message: `Your sale ${saleNumber} for ${productName} has been confirmed. Estimated delivery: soon.`,
      },
      customer_shipped: {
        title: 'Order Shipped',
        message: `Your order ${saleNumber} for ${productName} has been shipped. You can track it now.`,
      },
      customer_delivered: {
        title: 'Delivery Confirmed',
        message: `Your order ${saleNumber} for ${productName} has been successfully delivered.`,
      },
      customer_invoiced: {
        title: 'Invoice Ready',
        message: `Invoice for sale ${saleNumber} (${formattedValue}) is ready. Please review and process payment.`,
      },
      customer_paid: {
        title: 'Payment Confirmed',
        message: `Payment of ${formattedValue} for sale ${saleNumber} has been received. Thank you!`,
      },
      customer_cancelled: {
        title: 'Sale Cancelled',
        message: `Sale ${saleNumber} has been cancelled${reasonText}. Please contact us for more information.`,
      },
      customer_refunded: {
        title: 'Refund Processed',
        message: `Refund of ${formattedValue} for sale ${saleNumber} has been processed${reasonText}.`,
      },
      manager_pending: {
        title: 'Approval Required',
        message: `Sale ${saleNumber} from customer ${customerName} (${formattedValue}) requires your approval.`,
      },
      manager_cancelled: {
        title: 'Sale Cancelled',
        message: `Sale ${saleNumber} for customer ${customerName} has been cancelled${reasonText}.`,
      },
      manager_paid: {
        title: 'Sale Completed',
        message: `Sale ${saleNumber} for customer ${customerName} (${formattedValue}) has been marked as paid.`,
      },
      warehouse_confirmed: {
        title: 'Order Ready to Pick',
        message: `Sale ${saleNumber} for ${productName} is confirmed. Please prepare for shipment.`,
      },
      warehouse_shipped: {
        title: 'Shipment Dispatched',
        message: `Sale ${saleNumber} has been marked as shipped. Update tracking as needed.`,
      },
      warehouse_cancelled: {
        title: 'Sale Cancelled',
        message: `Sale ${saleNumber} has been cancelled${reasonText}. Please cancel any pending shipments.`,
      },
      finance_delivered: {
        title: 'Ready for Invoicing',
        message: `Sale ${saleNumber} for customer ${customerName} (${formattedValue}) has been delivered. Ready to invoice.`,
      },
      finance_invoiced: {
        title: 'Invoice Generated',
        message: `Invoice for sale ${saleNumber} (Customer: ${customerName}, Amount: ${formattedValue}) has been generated.`,
      },
      finance_paid: {
        title: 'Payment Received',
        message: `Payment of ${formattedValue} for sale ${saleNumber} from ${customerName} has been received.`,
      },
      finance_refunded: {
        title: 'Refund Processed',
        message: `Refund of ${formattedValue} for sale ${saleNumber} has been processed${reasonText}.`,
      },
    };

    const key = `${stakeholder.role}_${statusLabel.toLowerCase()}`;
    const template = templates[key];

    if (template) {
      return template;
    }

    // Default template
    return {
      title: `Sale Status Update: ${statusLabel}`,
      message: `Sale ${saleNumber} for customer ${customerName} (${productName}, ${formattedValue}) status changed to ${statusLabel}${reasonText}.`,
    };
  }

  /**
   * Format currency value
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}

export const workflowNotificationService = new WorkflowNotificationService();
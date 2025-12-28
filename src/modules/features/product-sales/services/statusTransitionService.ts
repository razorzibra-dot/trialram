/**
 * Status Transition Service
 * Handles status transitions with business logic and audit logging
 */

import { ProductSale } from '@/types/productSales';
import { 
  isValidTransition, 
  getValidNextStatuses,
  ProductSaleStatus 
} from '../utils/statusTransitions';
import { auditService } from '@/services';
import { workflowNotificationService } from './workflowNotificationService';

interface StatusTransitionEvent {
  saleId: string;
  fromStatus: ProductSaleStatus;
  toStatus: ProductSaleStatus;
  reason?: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export const statusTransitionService = {
  /**
   * Validate and perform status transition
   */
  async transitionStatus(
    sale: ProductSale,
    newStatus: ProductSaleStatus,
    reason?: string
  ): Promise<{ success: boolean; message: string; sale?: ProductSale; event?: StatusTransitionEvent }> {
    try {
      // Validate transition
      if (!isValidTransition(sale.status as ProductSaleStatus, newStatus)) {
        return {
          success: false,
          message: `Cannot transition from ${sale.status} to ${newStatus}`,
        };
      }

      // Create transition event
      const event: StatusTransitionEvent = {
        saleId: sale.id,
        fromStatus: sale.status as ProductSaleStatus,
        toStatus: newStatus,
        reason,
        timestamp: new Date(),
      };

      // Log the transition
      await auditService.logAction({
        action: 'status_transition',
        resource: 'product_sale',
        resource_id: sale.id,
        details: {
          from_status: event.fromStatus,
          to_status: event.toStatus,
          reason: event.reason,
        },
      });

      // Perform status-specific side effects
      await performStatusSpecificActions(sale, newStatus, event);

      return {
        success: true,
        message: `Sale transitioned from ${sale.status} to ${newStatus}`,
        event,
      };
    } catch (error) {
      console.error('Error transitioning status:', error);
      return {
        success: false,
        message: 'Failed to transition status',
      };
    }
  },

  /**
   * Get valid next statuses
   */
  getValidNextStatuses(currentStatus: ProductSaleStatus): ProductSaleStatus[] {
    return getValidNextStatuses(currentStatus);
  },

  /**
   * Check if transition is valid
   */
  canTransition(fromStatus: ProductSaleStatus, toStatus: ProductSaleStatus): boolean {
    return isValidTransition(fromStatus, toStatus);
  },
};

/**
 * Perform status-specific side effects
 */
async function performStatusSpecificActions(
  sale: ProductSale,
  newStatus: ProductSaleStatus,
  event: StatusTransitionEvent
): Promise<void> {
  switch (newStatus) {
    case 'confirmed':
      // Check inventory and reserve stock
      await handleConfirmedStatus(sale, event);
      break;

    case 'shipped':
      // Create shipment record
      await handleShippedStatus(sale, event);
      break;

    case 'delivered':
      // Update inventory, activate warranty
      await handleDeliveredStatus(sale, event);
      break;

    case 'invoiced':
      // Generate invoice
      await handleInvoicedStatus(sale, event);
      break;

    case 'paid':
      // Activate service contract if exists
      await handlePaidStatus(sale, event);
      break;

    case 'cancelled':
      // Release reserved inventory
      await handleCancelledStatus(sale, event);
      break;

    case 'refunded':
      // Reverse transactions
      await handleRefundedStatus(sale, event);
      break;

    default:
      // No specific actions for other statuses
      break;
  }
}

/**
 * Handle 'confirmed' status transition
 * - Send confirmation notification
 */
async function handleConfirmedStatus(sale: ProductSale, event: StatusTransitionEvent): Promise<void> {
  try {
    // Send confirmation notification
    await workflowNotificationService.notifyStatusChange({
      saleNumber: sale.id,
      customerId: sale.customer_id,
      customerName: sale.customer_name || 'Valued Customer',
      productName: sale.product_name || 'Product',
      totalValue: sale.total_cost,
      oldStatus: event.fromStatus,
      newStatus: event.toStatus,
      reason: event.reason,
      recipientRole: 'all',
    });
  } catch (error) {
    console.error('Error handling confirmed status:', error);
  }
}

/**
 * Handle 'shipped' status transition
 * - Send shipment notification
 */
async function handleShippedStatus(sale: ProductSale, event: StatusTransitionEvent): Promise<void> {
  try {
    // Send shipment notification
    await workflowNotificationService.notifyShipmentReady({
      saleNumber: sale.id,
      customerId: sale.customer_id,
      customerName: sale.customer_name || 'Valued Customer',
      productName: sale.product_name || 'Product',
      totalValue: sale.total_cost,
      oldStatus: event.fromStatus,
      newStatus: event.toStatus,
    });
  } catch (error) {
    console.error('Error handling shipped status:', error);
  }
}

/**
 * Handle 'delivered' status transition
 * - Trigger delivery notifications
 */
async function handleDeliveredStatus(sale: ProductSale, event: StatusTransitionEvent): Promise<void> {
  try {
    console.log('Delivery completed for sale:', sale.id);

    // Send delivery confirmation notification
    await workflowNotificationService.notifyDeliveryConfirmed({
      saleNumber: sale.id,
      customerId: sale.customer_id,
      customerName: sale.customer_name || 'Valued Customer',
      productName: sale.product_name || 'Product',
      totalValue: sale.total_cost,
      oldStatus: event.fromStatus,
      newStatus: event.toStatus,
    });
  } catch (error) {
    console.error('Error handling delivered status:', error);
  }
}

/**
 * Handle 'invoiced' status transition
 * - Send invoice notification
 */
async function handleInvoicedStatus(sale: ProductSale, event: StatusTransitionEvent): Promise<void> {
  try {
    console.log('Invoice generated for sale:', sale.id);

    // Send invoice notification
    await workflowNotificationService.notifyInvoiceGenerated({
      saleNumber: sale.id,
      customerId: sale.customer_id,
      customerName: sale.customer_name || 'Valued Customer',
      productName: sale.product_name || 'Product',
      totalValue: sale.total_cost,
      oldStatus: event.fromStatus,
      newStatus: event.toStatus,
    });
  } catch (error) {
    console.error('Error handling invoiced status:', error);
  }
}

/**
 * Handle 'paid' status transition
 * - Send payment received notification
 */
async function handlePaidStatus(sale: ProductSale, event: StatusTransitionEvent): Promise<void> {
  try {
    console.log('Payment recorded for sale:', sale.id);

    // Send payment received notification
    await workflowNotificationService.notifyPaymentReceived({
      saleNumber: sale.id,
      customerId: sale.customer_id,
      customerName: sale.customer_name || 'Valued Customer',
      productName: sale.product_name || 'Product',
      totalValue: sale.total_cost,
      oldStatus: event.fromStatus,
      newStatus: event.toStatus,
    });
  } catch (error) {
    console.error('Error handling paid status:', error);
  }
}

/**
 * Handle 'cancelled' status transition
 * - Send cancellation notification
 */
async function handleCancelledStatus(sale: ProductSale, event: StatusTransitionEvent): Promise<void> {
  try {
    console.log('Sale cancelled for sale:', sale.id);

    // Send cancellation notification
    await workflowNotificationService.notifySaleCancelled({
      saleNumber: sale.id,
      customerId: sale.customer_id,
      customerName: sale.customer_name || 'Valued Customer',
      productName: sale.product_name || 'Product',
      totalValue: sale.total_cost,
      oldStatus: event.fromStatus,
      newStatus: event.toStatus,
      reason: event.reason || 'Not specified',
    });
  } catch (error) {
    console.error('Error handling cancelled status:', error);
  }
}

/**
 * Handle 'refunded' status transition
 * - Send refund notification
 */
async function handleRefundedStatus(sale: ProductSale, event: StatusTransitionEvent): Promise<void> {
  try {
    console.log('Refund processed for sale:', sale.id);

    // Send refund notification
    await workflowNotificationService.notifyRefundProcessed({
      saleNumber: sale.id,
      customerId: sale.customer_id,
      customerName: sale.customer_name || 'Valued Customer',
      productName: sale.product_name || 'Product',
      totalValue: sale.total_cost,
      oldStatus: event.fromStatus,
      newStatus: event.toStatus,
      reason: event.reason || 'Not specified',
    });
  } catch (error) {
    console.error('Error handling refunded status:', error);
  }
}

export default statusTransitionService;
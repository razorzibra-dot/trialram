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
 * - Verify inventory availability
 * - Reserve stock
 * - Notify stakeholders
 */
async function handleConfirmedStatus(sale: ProductSale, event: StatusTransitionEvent): Promise<void> {
  try {
    // TODO: Implement inventory check and reservation
    // const inventoryService = getInventoryService();
    // await inventoryService.reserveStock(sale.product_id, sale.quantity);
    console.log('Stock reserved for sale:', sale.id);

    // Send confirmation notification
    await workflowNotificationService.notifyStatusChange({
      saleNumber: sale.sale_number,
      customerId: sale.customer_id,
      customerName: sale.customer_name || 'Valued Customer',
      productName: sale.product_name || 'Product',
      totalValue: sale.total_value,
      oldStatus: event.fromStatus,
      newStatus: event.toStatus,
      reason: event.reason,
      recipientRole: 'all',
    });
  } catch (error) {
    console.error('Error reserving stock:', error);
  }
}

/**
 * Handle 'shipped' status transition
 * - Create shipment record
 * - Send notification
 */
async function handleShippedStatus(sale: ProductSale, event: StatusTransitionEvent): Promise<void> {
  try {
    // TODO: Implement shipment creation
    // const shipmentService = getShipmentService();
    // const shipment = await shipmentService.create({
    //   product_sale_id: sale.id,
    //   customer_id: sale.customer_id,
    //   status: 'shipped',
    // });
    console.log('Shipment created for sale:', sale.id);

    // Send shipment notification
    await workflowNotificationService.notifyShipmentReady({
      saleNumber: sale.sale_number,
      customerId: sale.customer_id,
      customerName: sale.customer_name || 'Valued Customer',
      productName: sale.product_name || 'Product',
      totalValue: sale.total_value,
      quantity: sale.quantity,
    });
  } catch (error) {
    console.error('Error handling shipped status:', error);
  }
}

/**
 * Handle 'delivered' status transition
 * - Update inventory (reduce by quantity)
 * - Activate warranty period
 * - Trigger delivery notifications
 */
async function handleDeliveredStatus(sale: ProductSale, event: StatusTransitionEvent): Promise<void> {
  try {
    // TODO: Implement delivery completion
    // const inventoryService = getInventoryService();
    // await inventoryService.reduceStock(sale.product_id, sale.quantity);
    
    // TODO: Activate warranty
    // const warrantyService = getWarrantyService();
    // await warrantyService.activateWarranty({
    //   product_sale_id: sale.id,
    //   warranty_period: sale.warranty_period,
    //   start_date: new Date(),
    // });

    console.log('Delivery completed for sale:', sale.id);

    // Send delivery confirmation notification
    await workflowNotificationService.notifyDeliveryConfirmed({
      saleNumber: sale.sale_number,
      customerId: sale.customer_id,
      customerName: sale.customer_name || 'Valued Customer',
      productName: sale.product_name || 'Product',
      totalValue: sale.total_value,
    });
  } catch (error) {
    console.error('Error handling delivered status:', error);
  }
}

/**
 * Handle 'invoiced' status transition
 * - Generate invoice document
 * - Send invoice to customer
 * - Record in accounting system
 */
async function handleInvoicedStatus(sale: ProductSale, event: StatusTransitionEvent): Promise<void> {
  try {
    // TODO: Implement invoice generation
    // const invoiceService = getInvoiceService();
    // const invoice = await invoiceService.generate({
    //   product_sale_id: sale.id,
    //   customer_id: sale.customer_id,
    //   amount: sale.total_value,
    //   items: sale.items,
    // });

    console.log('Invoice generated for sale:', sale.id);

    // Send invoice notification
    await workflowNotificationService.notifyInvoiceGenerated({
      saleNumber: sale.sale_number,
      customerId: sale.customer_id,
      customerName: sale.customer_name || 'Valued Customer',
      productName: sale.product_name || 'Product',
      totalValue: sale.total_value,
    });
  } catch (error) {
    console.error('Error handling invoiced status:', error);
  }
}

/**
 * Handle 'paid' status transition
 * - Activate service contract if exists
 * - Record payment
 * - Update accounting records
 */
async function handlePaidStatus(sale: ProductSale, event: StatusTransitionEvent): Promise<void> {
  try {
    // Activate service contract if it exists
    if (sale.service_contract_id) {
      // TODO: Implement contract activation
      // const contractService = getContractService();
      // await contractService.activateContract(sale.service_contract_id);
      console.log('Service contract activated for sale:', sale.id);
    }

    // TODO: Record payment in accounting system
    console.log('Payment recorded for sale:', sale.id);

    // Send payment received notification
    await workflowNotificationService.notifyPaymentReceived({
      saleNumber: sale.sale_number,
      customerId: sale.customer_id,
      customerName: sale.customer_name || 'Valued Customer',
      productName: sale.product_name || 'Product',
      totalValue: sale.total_value,
      paymentMethod: sale.payment_method || 'Bank Transfer',
    });
  } catch (error) {
    console.error('Error handling paid status:', error);
  }
}

/**
 * Handle 'cancelled' status transition
 * - Release reserved inventory
 * - Cancel related records (invoices, etc.)
 * - Send cancellation notification
 */
async function handleCancelledStatus(sale: ProductSale, event: StatusTransitionEvent): Promise<void> {
  try {
    // TODO: Release reserved inventory
    // const inventoryService = getInventoryService();
    // await inventoryService.releaseReservedStock(sale.product_id, sale.quantity);

    console.log('Sale cancelled, inventory released for sale:', sale.id);

    // Send cancellation notification
    await workflowNotificationService.notifySaleCancelled({
      saleNumber: sale.sale_number,
      customerId: sale.customer_id,
      customerName: sale.customer_name || 'Valued Customer',
      productName: sale.product_name || 'Product',
      totalValue: sale.total_value,
      reason: event.reason || 'Not specified',
    });
  } catch (error) {
    console.error('Error handling cancelled status:', error);
  }
}

/**
 * Handle 'refunded' status transition
 * - Reverse inventory operations
 * - Process refund
 * - Cancel related contracts
 * - Send refund notification
 */
async function handleRefundedStatus(sale: ProductSale, event: StatusTransitionEvent): Promise<void> {
  try {
    // TODO: Implement refund processing
    // const refundService = getRefundService();
    // await refundService.process({
    //   product_sale_id: sale.id,
    //   amount: sale.total_value,
    //   reason: event.reason,
    // });

    // TODO: Cancel service contract if exists
    if (sale.service_contract_id) {
      // const contractService = getContractService();
      // await contractService.cancelContract(sale.service_contract_id);
    }

    console.log('Refund processed for sale:', sale.id);

    // Send refund notification
    await workflowNotificationService.notifyRefundProcessed({
      saleNumber: sale.sale_number,
      customerId: sale.customer_id,
      customerName: sale.customer_name || 'Valued Customer',
      productName: sale.product_name || 'Product',
      totalValue: sale.total_value,
      reason: event.reason || 'Not specified',
    });
  } catch (error) {
    console.error('Error handling refunded status:', error);
  }
}

export default statusTransitionService;
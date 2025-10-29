/**
 * Status Transition Logic for Product Sales
 * Validates and manages valid status transitions with business rules
 */

export type ProductSaleStatus = 'draft' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'invoiced' | 'paid' | 'cancelled' | 'refunded';

interface TransitionRule {
  from: ProductSaleStatus;
  to: ProductSaleStatus[];
  conditions?: string[];
}

/**
 * Define valid status transitions
 * Represents the workflow for a product sale lifecycle
 */
const transitionRules: TransitionRule[] = [
  {
    from: 'draft',
    to: ['pending', 'cancelled'],
    conditions: ['All required fields filled'],
  },
  {
    from: 'pending',
    to: ['confirmed', 'cancelled'],
    conditions: ['Inventory available', 'Customer approved'],
  },
  {
    from: 'confirmed',
    to: ['shipped', 'cancelled'],
    conditions: ['Shipment created', 'Payment confirmed'],
  },
  {
    from: 'shipped',
    to: ['delivered', 'cancelled'],
    conditions: ['In transit', 'Tracking updated'],
  },
  {
    from: 'delivered',
    to: ['invoiced', 'refunded'],
    conditions: ['Product received', 'Payment ready'],
  },
  {
    from: 'invoiced',
    to: ['paid', 'cancelled'],
    conditions: ['Invoice generated', 'Payment terms agreed'],
  },
  {
    from: 'paid',
    to: ['refunded'],
    conditions: ['Return requested'],
  },
  {
    from: 'cancelled',
    to: [],
    conditions: ['Terminal state'],
  },
  {
    from: 'refunded',
    to: [],
    conditions: ['Terminal state'],
  },
];

/**
 * Check if a status transition is valid
 */
export const isValidTransition = (fromStatus: ProductSaleStatus, toStatus: ProductSaleStatus): boolean => {
  const rule = transitionRules.find(r => r.from === fromStatus);
  return rule ? rule.to.includes(toStatus) : false;
};

/**
 * Get valid next statuses for current status
 */
export const getValidNextStatuses = (currentStatus: ProductSaleStatus): ProductSaleStatus[] => {
  const rule = transitionRules.find(r => r.from === currentStatus);
  return rule ? rule.to : [];
};

/**
 * Get transition conditions
 */
export const getTransitionConditions = (fromStatus: ProductSaleStatus): string[] => {
  const rule = transitionRules.find(r => r.from === fromStatus);
  return rule?.conditions || [];
};

/**
 * Get all available transitions
 */
export const getAllTransitionRules = (): TransitionRule[] => {
  return transitionRules;
};

/**
 * Check if status is terminal (no more transitions allowed)
 */
export const isTerminalStatus = (status: ProductSaleStatus): boolean => {
  const validNextStatuses = getValidNextStatuses(status);
  return validNextStatuses.length === 0;
};

/**
 * Get status display label
 */
export const getStatusLabel = (status: ProductSaleStatus): string => {
  const labels: Record<ProductSaleStatus, string> = {
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
  return labels[status] || status;
};

/**
 * Get status color for UI display
 */
export const getStatusColor = (status: ProductSaleStatus): string => {
  const colors: Record<ProductSaleStatus, string> = {
    'draft': 'default',
    'pending': 'processing',
    'confirmed': 'success',
    'shipped': 'cyan',
    'delivered': 'green',
    'invoiced': 'blue',
    'paid': 'success',
    'cancelled': 'error',
    'refunded': 'warning',
  };
  return colors[status] || 'default';
};

/**
 * Get status description for tooltips
 */
export const getStatusDescription = (status: ProductSaleStatus): string => {
  const descriptions: Record<ProductSaleStatus, string> = {
    'draft': 'Sale is in draft state, not yet submitted',
    'pending': 'Sale is awaiting approval and inventory confirmation',
    'confirmed': 'Sale is confirmed, ready for shipment',
    'shipped': 'Sale has been shipped and is in transit',
    'delivered': 'Product has been delivered to customer',
    'invoiced': 'Invoice has been generated and sent',
    'paid': 'Payment has been received, contract active',
    'cancelled': 'Sale has been cancelled',
    'refunded': 'Sale has been refunded',
  };
  return descriptions[status] || status;
};

export default {
  isValidTransition,
  getValidNextStatuses,
  getTransitionConditions,
  getAllTransitionRules,
  isTerminalStatus,
  getStatusLabel,
  getStatusColor,
  getStatusDescription,
};
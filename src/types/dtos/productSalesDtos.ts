/**
 * Product Sales Service DTOs
 * Standardized data transfer objects for product sales operations
 * Ensures consistent field naming across mock and Supabase implementations
 */

import { AuditMetadataDTO, PaginatedResponseDTO, DistributionDTO, PriorityLevel, AttachmentDTO } from './commonDtos';

/**
 * Product Sale Status Enumeration
 */
export type ProductSaleStatus = 'draft' | 'pending' | 'confirmed' | 'delivered' | 'invoiced' | 'paid' | 'cancelled';

/**
 * Product Sale Item DTO
 * Individual item/line in a product sale
 */
export interface ProductSaleItemDTO {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  totalAmount: number;
  description?: string;
  serialNumber?: string;
  warrantyExpiry?: string;
}

/**
 * Product Sale DTO
 * Complete product sale transaction information
 * 
 * STANDARDIZED FIELD NAMES:
 * - totalSales (not: total, count)
 * - completedSales (not: completed, done)
 * - totalCost (not: amount, price)
 * - itemCount (not: items_count, num_items)
 */
export interface ProductSaleDTO {
  /** Unique product sale identifier */
  id: string;
  
  /** Sale date (ISO 8601) */
  saleDate: string;
  
  /** Associated customer ID */
  customerId: string;
  
  /** Customer name (denormalized) */
  customerName: string;
  
  /** Customer email (denormalized) */
  customerEmail?: string;
  
  /** Sale status */
  status: ProductSaleStatus;
  
  /** List of items in this sale */
  items: ProductSaleItemDTO[];
  
  /** Total number of items */
  itemCount: number;
  
  /** Total sale amount (before tax and discount) */
  subtotal: number;
  
  /** Discount amount */
  discountAmount?: number;
  
  /** Discount percentage */
  discountPercentage?: number;
  
  /** Tax amount */
  taxAmount?: number;
  
  /** Total cost including tax */
  totalCost: number;
  
  /** Currency code (ISO 4217) */
  currency?: string;
  
  /** Payment method: cash, card, check, transfer, etc. */
  paymentMethod?: string;
  
  /** Expected delivery date */
  deliveryDate?: string;
  
  /** Actual delivery date */
  actualDeliveryDate?: string;
  
  /** Delivery address */
  deliveryAddress?: string;
  
  /** Delivery city */
  deliveryCity?: string;
  
  /** Delivery state */
  deliveryState?: string;
  
  /** Delivery country */
  deliveryCountry?: string;
  
  /** Warranty expiry date */
  warrantyExpiry?: string;
  
  /** Sale notes */
  notes?: string;
  
  /** Invoice number/reference */
  invoiceNumber?: string;
  
  /** Invoice date */
  invoiceDate?: string;
  
  /** Invoice PDF URL */
  invoicePdfUrl?: string;
  
  /** Sales representative ID */
  salesRep?: string;
  
  /** Tags for categorization */
  tags?: string[];
  
  /** Attachments */
  attachments?: AttachmentDTO[];
  
  /** Contract generated from this sale */
  contractId?: string;
  
  /** Custom fields */
  customFields?: Record<string, any>;
  
  /** Tenant ID for multi-tenant support */
  tenantId: string;
  
  /** Audit metadata */
  audit: AuditMetadataDTO;
}

/**
 * Product Sales Analytics DTO
 * Key metrics and analytics for product sales
 * 
 * STANDARDIZED FIELD NAMES:
 * - totalSales (not: total, count)
 * - completedSales (not: completed, done)
 * - pendingSales (not: pending, incomplete)
 * - totalRevenue (not: revenue, total_amount)
 * - averageSaleValue (not: avg_value, average_amount)
 */
export interface ProductSalesAnalyticsDTO {
  /** Total number of sales */
  totalSales: number;
  
  /** Number of completed sales */
  completedSales: number;
  
  /** Number of pending sales */
  pendingSales: number;
  
  /** Number of cancelled sales */
  cancelledSales?: number;
  
  /** Total revenue from all sales */
  totalRevenue: number;
  
  /** Average sale value */
  averageSaleValue: number;
  
  /** Total quantity of items sold */
  totalQuantity: number;
  
  /** New sales this month */
  newSalesThisMonth?: number;
  
  /** Revenue this month */
  revenueThisMonth?: number;
  
  /** Month-over-month growth percentage */
  monthlyGrowth?: number;
  
  /** Sales by status distribution */
  byStatus: DistributionDTO;
  
  /** Top selling products */
  topProducts?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  
  /** Sales by customer (top customers) */
  topCustomers?: Array<{
    customerId: string;
    customerName: string;
    totalSales: number;
    revenue: number;
  }>;
  
  /** Revenue by month (last 12 months) */
  revenueByMonth?: Record<string, number>;
  
  /** Sales by product category */
  byProductCategory?: DistributionDTO;
  
  /** Delivery performance */
  onTimeDeliveryRate?: number;
  
  /** Average delivery time (days) */
  averageDeliveryDays?: number;
  
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Create Product Sale Request DTO
 */
export interface CreateProductSaleDTO {
  saleDate?: string;
  customerId: string;
  items: Omit<ProductSaleItemDTO, 'id'>[];
  discountAmount?: number;
  discountPercentage?: number;
  paymentMethod?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryCountry?: string;
  notes?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

/**
 * Update Product Sale Request DTO
 */
export interface UpdateProductSaleDTO {
  status?: ProductSaleStatus;
  items?: Omit<ProductSaleItemDTO, 'id'>[];
  discountAmount?: number;
  discountPercentage?: number;
  deliveryDate?: string;
  actualDeliveryDate?: string;
  deliveryAddress?: string;
  notes?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

/**
 * Product Sale Filters DTO
 */
export interface ProductSaleFiltersDTO {
  search?: string;
  customerId?: string;
  status?: ProductSaleStatus | ProductSaleStatus[];
  minAmount?: number;
  maxAmount?: number;
  dateRange?: {
    from: string;
    to: string;
  };
  deliveryDateRange?: {
    from: string;
    to: string;
  };
  warrantyStatus?: 'active' | 'expiring_soon' | 'expired';
  paymentMethod?: string;
  productId?: string;
  tags?: string[];
  tenantId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'saleDate' | 'totalCost' | 'status' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Product Sale List Response DTO
 */
export type ProductSaleListResponseDTO = PaginatedResponseDTO<ProductSaleDTO>;

/**
 * Bulk Product Sale Update DTO
 */
export interface BulkProductSaleUpdateDTO {
  saleIds: string[];
  status?: ProductSaleStatus;
  tags?: string[];
}

/**
 * Bulk Product Sale Delete DTO
 */
export interface BulkProductSaleDeleteDTO {
  saleIds: string[];
  reason?: string;
}

/**
 * Invoice Generation DTO
 */
export interface GenerateInvoiceDTO {
  productSaleId: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  format?: 'pdf' | 'html' | 'json';
}

/**
 * Sales Report DTO
 */
export interface SalesReportDTO {
  period: string; // 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  startDate: string;
  endDate: string;
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: ProductSaleDTO[];
  topCustomers: CustomerSalesSummaryDTO[];
  trends: TrendDataDTO[];
}

/**
 * Trend Data DTO
 */
export interface TrendDataDTO {
  date: string;
  sales: number;
  revenue: number;
  quantity: number;
}

/**
 * Customer Sales Summary DTO
 */
export interface CustomerSalesSummaryDTO {
  customerId: string;
  customerName: string;
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  lastPurchaseDate?: string;
}

/**
 * Payment Reconciliation DTO
 */
export interface PaymentReconciliationDTO {
  productSaleId: string;
  expectedAmount: number;
  receivedAmount: number;
  paymentStatus: 'pending' | 'partial' | 'complete' | 'overdue';
  lastPaymentDate?: string;
  dueDate?: string;
}
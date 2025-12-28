/**
 * Product Sales Module Types
 * Centralized type definitions for the product sales module
 * Following customer module organization pattern
 */

export interface ProductSale {
  id: string;
  customer_id: string;
  customer_name?: string;
  product_id: string;
  product_name?: string;
  units: number;
  cost_per_unit: number;
  total_cost: number;
  delivery_date: string;
  warranty_expiry: string;
  status: ProductSaleStatus;
  notes?: string;
  attachments: FileAttachment[];
  service_contract_id?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ProductSaleItem {
  id: string;
  product_sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export type ProductSaleStatus = 
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'invoiced'
  | 'paid'
  | 'cancelled'
  | 'refunded';

export interface ProductSaleFilters {
  search?: string;
  customer_id?: string;
  product_id?: string;
  status?: ProductSaleStatus;
  dateRange?: {
    start: string;
    end: string;
  };
  page?: number;
  pageSize?: number;
}

export interface ProductSalesResponse {
  data: ProductSale[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FileAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface ProductSalesAnalytics {
  totalSales: number;
  totalRevenue: number;
  averageDealSize: number;
  topProducts: Array<{
    id: string;
    name: string;
    count: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    count: number;
    revenue: number;
  }>;
  statusDistribution: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    sales: number;
    revenue: number;
  }>;
}

// Form data types
export interface ProductSaleFormData {
  customer_id: string;
  product_id: string;
  units: number;
  cost_per_unit: number;
  delivery_date: string;
  warranty_expiry: string;
  status?: ProductSaleStatus;
  notes?: string;
  attachments?: File[];
}

// Permission types
export interface ProductSalesPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canReject: boolean;
  canViewAudit: boolean;
  canExport: boolean;
  canBulkDelete: boolean;
  canBulkUpdate: boolean;
}

// Status transition types
export interface StatusTransition {
  from: ProductSaleStatus;
  to: ProductSaleStatus;
  label: string;
  description?: string;
  requiresApproval?: boolean;
  allowedRoles?: string[];
}

export interface ValidNextStatuses {
  [key: string]: ProductSaleStatus[];
}

// Notification types
export interface NotificationPreferences {
  user_id: string;
  status_changes: boolean;
  approval_requests: boolean;
  shipment_ready: boolean;
  delivery_confirmed: boolean;
  invoice_generated: boolean;
  payment_received: boolean;
  sale_cancelled: boolean;
  refund_processed: boolean;
  channels: ('in_app' | 'email' | 'sms')[];
  created_at: string;
  updated_at: string;
}

export interface NotificationHistory {
  id: string;
  user_id: string;
  product_sale_id: string;
  type: string;
  title: string;
  message: string;
  channels: string[];
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  error_message?: string;
  created_at: string;
}
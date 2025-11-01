export interface Customer {
  id: string;
  companyName: string;
  contactName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  status: 'active' | 'inactive' | 'prospect' | 'suspended';
  customerType?: 'individual' | 'business' | 'enterprise';
  creditLimit?: number;
  paymentTerms?: string;
  taxId?: string;
  annualRevenue?: number;
  totalSalesAmount?: number;
  totalOrders?: number;
  averageOrderValue?: number;
  lastPurchaseDate?: string;
  tags: CustomerTag[];
  notes?: string;
  assignedTo?: string;
  source?: string;
  rating?: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  deletedAt?: string;
}

export interface CustomerTag {
  id: string;
  name: string;
  color: string;
}

// Sale/Deal unified interface
export interface Sale {
  id: string;
  sale_number?: string;
  title: string;
  description?: string;

  // Customer Relationship
  customer_id: string;
  customer_name?: string;

  // Financial Information
  value: number;
  amount: number; // Alias for value for backend compatibility
  currency: string;
  probability: number;
  weighted_amount?: number;

  // Sales Process
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  status: 'open' | 'won' | 'lost' | 'cancelled';
  source?: string;
  campaign?: string;

  // Dates
  expected_close_date?: string;
  actual_close_date?: string;
  last_activity_date?: string;
  next_activity_date?: string;

  // Assignment
  assigned_to: string;
  assigned_to_name?: string;

  // Additional Information
  notes?: string;
  tags?: string[];
  competitor_info?: string;

  // Products/Items
  items?: SaleItem[];

  // System Information
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Sale Item for product-based sales
export interface SaleItem {
  id: string;
  sale_id: string;
  product_id?: string;
  product_name: string;
  product_description?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  line_total: number;
}

// Alias for backward compatibility
export type Deal = Sale;

export interface Ticket {
  id: string;
  ticket_number?: string;
  title: string;
  description: string;

  // Customer Relationship
  customer_id?: string; // Optional to match backend nullable
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;

  // Status and Classification
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'general' | 'feature_request';
  sub_category?: string;
  source?: string;

  // Assignment and Reporting
  assigned_to?: string; // Optional to match backend
  assigned_to_name?: string;
  reported_by?: string;
  reported_by_name?: string;

  // Dates and SLA
  due_date?: string;
  resolved_at?: string;
  closed_at?: string;
  first_response_date?: string;

  // Time Tracking
  estimated_hours?: number;
  actual_hours?: number;
  first_response_time?: number; // in minutes
  resolution_time?: number; // in minutes
  is_sla_breached?: boolean;

  // Resolution and Notes
  resolution?: string;
  tags?: string[];

  // Relationships
  comments?: TicketComment[];
  attachments?: TicketAttachment[];

  // System Information
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Ticket Comment interface
export interface TicketComment {
  id: string;
  ticket_id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_role?: string;
  created_at: string;
  updated_at?: string;
  parent_id?: string; // For threaded comments
  replies?: TicketComment[];
}

// Ticket Attachment interface
export interface TicketAttachment {
  id: string;
  ticket_id: string;
  filename: string;
  original_filename?: string;
  file_path?: string;
  file_url?: string;
  content_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_by_name?: string;
  created_at: string;
}

// Ticket form data interface
export interface TicketFormData {
  title: string;
  description: string;
  customer_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'general' | 'feature_request';
  sub_category?: string;
  assigned_to?: string;
  due_date?: string;
  estimated_hours?: number;
  tags?: string[];
}

// Ticket filters interface
export interface TicketFilters {
  status?: string;
  priority?: string;
  category?: string;
  assigned_to?: string;
  customer_id?: string;
  reported_by?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  is_overdue?: boolean;
  is_sla_breached?: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'basic' | 'premium' | 'enterprise';
  users_count: number;
  created_at: string;
  updated_at: string;
}

// User interface moved to auth.ts to avoid conflicts
// Use User from '@/types/auth' instead

export interface DashboardStats {
  total_customers: number;
  active_deals: number;
  total_deal_value: number;
  open_tickets: number;
  monthly_revenue: number;
  conversion_rate: number;
  avg_deal_size: number;
  ticket_resolution_time: number;
}

export type {
  Contract,
  ContractTemplate,
  ContractParty,
  ContractAnalytics,
  ContractFilters,
  RenewalReminder,
  DigitalSignature,
  ApprovalRecord,
  SignatureStatus,
  ContractAttachment,
  TemplateField,
  MonthlyContractStats,
  StatusDistribution,
  TypeDistribution
} from './contracts';
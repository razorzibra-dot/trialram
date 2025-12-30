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

export interface CustomerInteraction {
  id: string;
  customerId: string;
  type: 'call' | 'meeting' | 'email' | 'note' | 'visit' | 'demo' | 'presentation' | 'follow_up' | 'other';
  direction?: 'inbound' | 'outbound'; // For calls/emails
  subject: string;
  description?: string;
  interactionDate: string;
  durationMinutes?: number;
  outcome?: 'successful' | 'unsuccessful' | 'pending' | 'cancelled';
  outcomeNotes?: string;
  contactPerson?: string; // Customer contact involved
  performedBy: string;
  performedByName?: string; // For display
  participants?: string[]; // Other participants (user IDs)
  location?: string; // For meetings/visits
  attachments?: CustomerInteractionAttachment[];
  tags?: string[];
  followUpRequired?: boolean;
  followUpDate?: string;
  nextAction?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CustomerInteractionAttachment {
  id: string;
  interactionId: string;
  filename: string;
  originalFilename?: string;
  filePath?: string;
  fileUrl?: string;
  contentType: string;
  fileSize: number;
  uploadedBy: string;
  uploaded_by_name?: string;
  created_at: string;
}


// Sales Pipeline Entities

export interface Opportunity {
  id: string;
  title: string;
  description?: string;

  // Customer Relationship
  customer_id: string;
  customer_name?: string; // For display

  // Financial Information
  estimated_value: number;
  currency: string;
  probability: number; // 0-100
  weighted_value?: number; // calculated: estimated_value * probability / 100

  // Sales Process
  stage: 'prospecting' | 'qualification' | 'needs_analysis' | 'proposal' | 'negotiation' | 'decision' | 'contract';
  status: 'open' | 'won' | 'lost' | 'on_hold' | 'cancelled';
  source?: string;
  campaign?: string;

  // Dates
  expected_close_date?: string;
  last_activity_date?: string;
  next_activity_date?: string;

  // Assignment
  assigned_to: string;
  assigned_to_name?: string; // For display

  // Additional Information
  notes?: string;
  tags?: string[];
  competitor_info?: string;
  pain_points?: string[];
  requirements?: string[];

  // Products/Items (proposed)
  proposed_items?: OpportunityItem[];

  // System Information
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  converted_to_deal_id?: string; // When opportunity becomes a deal
}

export interface OpportunityItem {
  id: string;
  opportunity_id: string;
  product_id?: string;
  product_name: string;
  product_description?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  line_total: number;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  deal_number?: string;
  title: string;
  description?: string;

  // Customer Relationship
  customer_id: string;
  customer_name?: string; // For display

  // Financial Information
  value: number;
  currency: string;

  // Deal Type: PRODUCT or SERVICE
  deal_type: 'PRODUCT' | 'SERVICE';

  // Sales Process
  status: 'won' | 'lost' | 'cancelled';
  source?: string;
  campaign?: string;

  // Dates
  close_date: string; // When the deal was closed
  expected_close_date?: string; // Original expected date

  // Assignment
  assigned_to: string;
  assigned_to_name?: string; // For display

  // Additional Information
  notes?: string;
  tags?: string[];
  competitor_info?: string;
  win_loss_reason?: string; // Why won or lost
  // ✅ stage and probability belong to opportunities table only, NOT deals

  // Products/Items (final)
  items?: DealItem[];

  // Relationships
  opportunity_id?: string; // Link to original opportunity if converted
  contract_id?: string; // Link to generated contract if deal is won

  // Conversion traceability (idempotency checks)
  converted_to_order_id?: string;
  converted_to_contract_id?: string;

  // Payment Processing
  payment_terms?: string; // net_30, net_60, cod, etc.
  payment_status?: 'pending' | 'partial' | 'paid' | 'overdue';
  payment_due_date?: string;
  paid_amount?: number;
  outstanding_amount?: number;
  payment_method?: string; // bank_transfer, check, credit_card, etc.

  // Revenue Recognition
  revenue_recognized?: number;
  revenue_recognition_status?: 'not_started' | 'in_progress' | 'completed';
  revenue_recognition_method?: 'immediate' | 'installments' | 'milestone' | 'time_based';
  recognition_schedule?: RevenueRecognitionSchedule[];

  // System Information
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface DealItem {
  id: string;
  deal_id: string;
  product_id?: string;
  product_name: string;
  product_description?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  discount_type?: 'fixed' | 'percentage';
  tax: number;
  tax_rate?: number;
  service_id?: string;
  duration?: string;
  notes?: string;
  line_total: number;
}

export interface RevenueRecognitionSchedule {
  id: string;
  deal_id: string;
  installment_number: number;
  amount: number;
  recognized_amount: number;
  recognition_date: string; // When revenue should be recognized
  actual_recognition_date?: string; // When it was actually recognized
  status: 'pending' | 'recognized' | 'cancelled';
  description?: string;
  milestone?: string; // For milestone-based recognition
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface SalesActivity {
  id: string;
  activity_type: 'call' | 'meeting' | 'email' | 'demo' | 'proposal' | 'follow_up' | 'negotiation' | 'presentation' | 'site_visit' | 'other';
  subject: string;
  description?: string;

  // Relationships
  opportunity_id?: string;
  deal_id?: string;
  customer_id: string;

  // Timing
  start_date: string;
  end_date?: string;
  duration_minutes?: number;

  // Participants
  performed_by: string;
  performed_by_name?: string; // For display
  participants?: string[]; // Other participants (user IDs)
  contact_person?: string; // Customer contact

  // Outcome
  outcome?: 'successful' | 'unsuccessful' | 'pending' | 'cancelled' | 'rescheduled';
  outcome_notes?: string;
  next_action?: string;
  next_action_date?: string;

  // Additional
  location?: string; // For meetings, calls
  attachments?: string[]; // File URLs/IDs
  tags?: string[];

  // System Information
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Alias for backward compatibility
export type Sale = Deal;

export interface Ticket {
  id: string;
  ticket_number?: string;
  title: string;
  description: string;

  // Customer Relationship
  customer_id?: string; // Optional to match backend nullable
  customer_name?: string; // Added for display purposes

  // Status and Classification
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'general' | 'feature_request';
  sub_category?: string;
  source?: string;

  // Assignment and Reporting
  assigned_to?: string; // Optional to match backend
  assigned_to_name?: string; // Added for display purposes
  reported_by?: string;

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

  // SLA Tracking
  sla_target?: number; // SLA target in hours
  sla_start?: string; // When SLA clock started

  // Resolution and Notes
  resolution?: string;
  notes?: string; // Internal notes for ticket creation rules
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
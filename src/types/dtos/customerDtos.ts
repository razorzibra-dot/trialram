/**
 * Customer Service DTOs
 * Standardized data transfer objects for customer operations
 * Ensures consistent field naming across mock and Supabase implementations
 */

import { AuditMetadataDTO, EntityStatus, PaginatedResponseDTO, DistributionDTO } from './commonDtos';

/**
 * Customer Profile DTO
 * Complete customer information
 * 
 * STANDARDIZED FIELD NAMES:
 * - Status: 'active' | 'inactive' | 'prospect' | 'inactive'
 * - Industry: string (e.g., 'Technology', 'Finance')
 * - Company size: 'startup' | 'small' | 'medium' | 'enterprise'
 */
export interface CustomerDTO {
  /** Unique customer identifier */
  id: string;
  
  /** Customer name */
  name: string;
  
  /** Customer email */
  email: string;
  
  /** Customer phone number */
  phone?: string;
  
  /** Customer company name */
  companyName?: string;
  
  /** Business industry */
  industry?: string;
  
  /** Company size: startup, small, medium, or enterprise */
  companySize?: 'startup' | 'small' | 'medium' | 'enterprise';
  
  /** Customer address */
  address?: string;
  
  /** Customer city */
  city?: string;
  
  /** Customer state/province */
  state?: string;
  
  /** Customer country */
  country?: string;
  
  /** Postal/ZIP code */
  postalCode?: string;
  
  /** Customer status: active, inactive, or prospect */
  status: 'active' | 'inactive' | 'prospect';
  
  /** Customer type: individual or organization */
  type?: 'individual' | 'organization';
  
  /** Annual revenue (if applicable) */
  annualRevenue?: number;
  
  /** Number of employees */
  numberOfEmployees?: number;
  
  /** Website URL */
  website?: string;
  
  /** Customer tags for categorization */
  tags?: string[];
  
  /** Primary contact person name */
  primaryContactName?: string;
  
  /** Primary contact phone */
  primaryContactPhone?: string;
  
  /** Primary contact email */
  primaryContactEmail?: string;
  
  /** Customer notes/description */
  notes?: string;
  
  /** Tenant ID for multi-tenant support */
  tenantId: string;
  
  /** Audit metadata */
  audit: AuditMetadataDTO;
}

/**
 * Customer Statistics DTO
 * Key metrics and statistics for customer base
 * 
 * STANDARDIZED FIELD NAMES (fixed from previous customer.ts):
 * - totalCustomers (not: total)
 * - activeCustomers (not: active)
 * - prospectCustomers (not: prospects)
 * - inactiveCustomers (not: inactive)
 */
export interface CustomerStatsDTO {
  /** Total number of customers */
  totalCustomers: number;
  
  /** Number of active customers */
  activeCustomers: number;
  
  /** Number of prospect customers */
  prospectCustomers: number;
  
  /** Number of inactive customers */
  inactiveCustomers: number;
  
  /** New customers added this month */
  newCustomersThisMonth: number;
  
  /** Customer churn rate (percentage) */
  churnRate: number;
  
  /** Customers by industry */
  byIndustry: DistributionDTO;
  
  /** Customers by company size */
  bySize: DistributionDTO;
  
  /** Customers by status */
  byStatus: DistributionDTO;
  
  /** Customers by region */
  byRegion?: DistributionDTO;
  
  /** Top industries by customer count */
  topIndustries?: Array<{ industry: string; count: number }>;
  
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Create Customer Request DTO
 * Data required to create a new customer
 */
export interface CreateCustomerDTO {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  industry?: string;
  companySize?: 'startup' | 'small' | 'medium' | 'enterprise';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  status?: 'active' | 'inactive' | 'prospect';
  type?: 'individual' | 'organization';
  annualRevenue?: number;
  numberOfEmployees?: number;
  website?: string;
  tags?: string[];
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  notes?: string;
}

/**
 * Update Customer Request DTO
 * Data for updating an existing customer (all fields optional)
 */
export interface UpdateCustomerDTO {
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  industry?: string;
  companySize?: 'startup' | 'small' | 'medium' | 'enterprise';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  status?: 'active' | 'inactive' | 'prospect';
  type?: 'individual' | 'organization';
  annualRevenue?: number;
  numberOfEmployees?: number;
  website?: string;
  tags?: string[];
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  notes?: string;
}

/**
 * Customer Filters DTO
 * Filtering parameters for customer list queries
 */
export interface CustomerFiltersDTO {
  search?: string;
  status?: 'active' | 'inactive' | 'prospect';
  industry?: string;
  companySize?: 'startup' | 'small' | 'medium' | 'enterprise';
  region?: string;
  tags?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  tenantId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt' | 'status';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Customer List Response DTO
 */
export type CustomerListResponseDTO = PaginatedResponseDTO<CustomerDTO>;

/**
 * Customer Tag DTO
 */
export interface CustomerTagDTO {
  id: string;
  name: string;
  color?: string;
  description?: string;
  usageCount: number;
  tenantId: string;
}

/**
 * Bulk Customer Update DTO
 */
export interface BulkCustomerUpdateDTO {
  customerIds: string[];
  updates: Partial<UpdateCustomerDTO>;
}

/**
 * Bulk Customer Delete DTO
 */
export interface BulkCustomerDeleteDTO {
  customerIds: string[];
  reason?: string;
}

/**
 * Customer Export DTO
 */
export interface CustomerExportDTO {
  filters?: CustomerFiltersDTO;
  fields?: (keyof CustomerDTO)[];
  format: 'csv' | 'excel' | 'json';
}

/**
 * Customer Activity DTO
 */
export interface CustomerActivityDTO {
  customerId: string;
  lastSaleDate?: string;
  lastTicketDate?: string;
  totalSalesValue?: number;
  totalTickets?: number;
  totalContracts?: number;
}

/**
 * Customer Interaction DTO
 * Tracks all customer interactions
 */
export interface CustomerInteractionDTO {
  /** Unique interaction identifier */
  id: string;

  /** Customer ID this interaction belongs to */
  customerId: string;

  /** Tenant ID for multi-tenant support */
  tenantId: string;

  /** Type of interaction */
  interactionType: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'social_media' | 'website_visit' | 'support_ticket' | 'sales_inquiry' | 'complaint' | 'feedback';

  /** Direction of interaction */
  direction: 'inbound' | 'outbound' | 'internal';

  /** Interaction subject/title */
  subject?: string;

  /** Detailed description */
  description?: string;

  /** Priority level */
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  /** Contact person involved */
  contactPerson?: string;

  /** Contact method used */
  contactMethod?: string;

  /** Additional contact details */
  contactDetails?: Record<string, any>;

  /** When the interaction occurred */
  interactionDate: string;

  /** Duration in minutes (for calls/meetings) */
  durationMinutes?: number;

  /** Scheduled date/time */
  scheduledAt?: string;

  /** Completion date/time */
  completedAt?: string;

  /** Current status */
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

  /** Interaction outcome */
  outcome?: string;

  /** Whether follow-up is required */
  followUpRequired?: boolean;

  /** Follow-up date */
  followUpDate?: string;

  /** Assigned user */
  assignedTo?: string;

  /** User who created this interaction */
  createdBy: string;

  /** User who last updated */
  updatedBy?: string;

  /** Categorization tags */
  tags?: string[];

  /** Additional metadata */
  metadata?: Record<string, any>;

  /** Internal notes */
  notes?: string;

  /** Audit timestamps */
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

/**
 * Customer Preferences DTO
 * Stores customer-specific preferences
 */
export interface CustomerPreferencesDTO {
  /** Unique preferences identifier */
  id: string;

  /** Customer ID these preferences belong to */
  customerId: string;

  /** Tenant ID for multi-tenant support */
  tenantId: string;

  /** Communication preferences */
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  phoneCalls?: boolean;
  marketingEmails?: boolean;
  newsletterSubscription?: boolean;

  /** Preferred contact method */
  preferredContactMethod?: 'email' | 'phone' | 'sms' | 'mail' | 'in_person';

  /** Preferred contact time */
  preferredContactTime?: 'morning' | 'afternoon' | 'evening' | 'anytime';

  /** Customer timezone */
  timezone?: string;

  /** Preferred language */
  language?: string;

  /** Business preferences */
  preferredPaymentTerms?: string;
  preferredShippingMethod?: string;
  specialInstructions?: string;

  /** Privacy preferences */
  dataSharingConsent?: boolean;
  marketingConsent?: boolean;
  consentDate?: string;
  consentSource?: string;

  /** Custom preferences */
  customPreferences?: Record<string, any>;

  /** Audit fields */
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Customer Segment DTO
 * Defines customer segments for targeting
 */
export interface CustomerSegmentDTO {
  /** Unique segment identifier */
  id: string;

  /** Tenant ID for multi-tenant support */
  tenantId: string;

  /** Segment name */
  name: string;

  /** Segment description */
  description?: string;

  /** Segment type */
  segmentType: 'automatic' | 'manual' | 'dynamic';

  /** Segment category */
  category?: string;

  /** Segmentation criteria/rules */
  criteria?: Record<string, any>;
  rules?: Record<string, any>;

  /** Visual properties */
  color?: string;
  icon?: string;
  priority?: number;

  /** Statistics */
  customerCount?: number;
  lastCalculatedAt?: string;

  /** Status flags */
  isActive?: boolean;
  isSystemSegment?: boolean;

  /** Audit fields */
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Customer Analytics DTO
 * Stores calculated metrics and insights
 */
export interface CustomerAnalyticsDTO {
  /** Unique analytics identifier */
  id: string;

  /** Customer ID these analytics belong to */
  customerId: string;

  /** Tenant ID for multi-tenant support */
  tenantId: string;

  /** Lifecycle metrics */
  customerSince?: string;
  totalInteractions?: number;
  lastInteractionDate?: string;
  daysSinceLastInteraction?: number;

  /** Value metrics */
  lifetimeValue?: number;
  averageOrderValue?: number;
  totalOrders?: number;
  totalRevenue?: number;

  /** Engagement metrics */
  emailOpenRate?: number;
  emailClickRate?: number;
  websiteVisits?: number;
  supportTickets?: number;

  /** Satisfaction metrics */
  satisfactionScore?: number; // 1-5 scale
  npsScore?: number; // -100 to 100
  churnRiskScore?: number; // 0-1 scale

  /** Segmentation scores */
  segmentScores?: Record<string, any>;

  /** Predicted lifetime value */
  predictedLifetimeValue?: number;

  /** Trend data */
  monthlyMetrics?: Record<string, any>;
  quarterlyMetrics?: Record<string, any>;
  yearlyMetrics?: Record<string, any>;

  /** Custom analytics */
  customMetrics?: Record<string, any>;

  /** Calculation timestamps */
  lastCalculatedAt?: string;
  nextCalculationAt?: string;

  /** Audit fields */
  createdAt: string;
  updatedAt?: string;
}

/**
 * Customer Segment Membership DTO
 * Links customers to their segments
 */
export interface CustomerSegmentMembershipDTO {
  /** Unique membership identifier */
  id: string;

  /** Customer ID */
  customerId: string;

  /** Segment ID */
  segmentId: string;

  /** Tenant ID for multi-tenant support */
  tenantId: string;

  /** Assignment details */
  assignedAt: string;
  assignedBy?: string;
  autoAssigned?: boolean;

  /** Membership status */
  isActive?: boolean;
  expiresAt?: string;
}
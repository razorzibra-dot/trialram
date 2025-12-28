/**
 * Sales/Deals Service DTOs
 * Standardized data transfer objects for sales pipeline management
 * Ensures consistent field naming across mock and Supabase implementations
 */

import { AuditMetadataDTO, PaginatedResponseDTO, DistributionDTO, PriorityLevel } from './commonDtos';

/**
 * Lead Status Enumeration
 */
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted' | 'lost' | 'cancelled';

/**
 * Lead Qualification Status Enumeration
 */
export type LeadQualificationStatus = 'new' | 'contacted' | 'qualified' | 'unqualified';

/**
 * Lead Stage Enumeration
 */
export type LeadStage = 'awareness' | 'interest' | 'consideration' | 'intent' | 'evaluation' | 'purchase';

/**
 * Lead DTO
 * Complete lead information for sales prospect management
 *
 * STANDARDIZED FIELD NAMES:
 * - Status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted' | 'lost' | 'cancelled'
 * - Qualification Status: 'new' | 'contacted' | 'qualified' | 'unqualified'
 * - Stage: 'awareness' | 'interest' | 'consideration' | 'intent' | 'evaluation' | 'purchase'
 * - Score: leadScore (0-100)
 */
export interface LeadDTO {
  /** Unique lead identifier */
  id: string;

  /** Personal information */
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  mobile?: string;

  /** Lead details */
  source?: string;
  campaign?: string;
  leadScore: number;
  qualificationStatus: LeadQualificationStatus;

  /** Business information */
  industry?: string;
  companySize?: string;
  jobTitle?: string;
  budgetRange?: string;
  timeline?: string;

  /** Status and stage */
  status: LeadStatus;
  stage: LeadStage;

  /** Assignment */
  assignedTo?: string;
  assignedToName?: string;

  /** Conversion tracking */
  convertedToCustomer: boolean;
  convertedCustomerId?: string;
  convertedAt?: string;

  /** Notes and follow-up */
  notes?: string;
  nextFollowUp?: string;
  lastContact?: string;

  /** Tenant ID for multi-tenant support */
  tenantId: string;

  /** Audit metadata */
  audit: AuditMetadataDTO;
}

/**
 * Create Lead Request DTO
 */
export interface CreateLeadDTO {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  source?: string;
  campaign?: string;
  leadScore?: number;
  qualificationStatus?: LeadQualificationStatus;
  industry?: string;
  companySize?: string;
  jobTitle?: string;
  budgetRange?: string;
  timeline?: string;
  status?: LeadStatus;
  stage?: LeadStage;
  assignedTo?: string;
  notes?: string;
  nextFollowUp?: string;
}

/**
 * Update Lead Request DTO
 */
export interface UpdateLeadDTO {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  source?: string;
  campaign?: string;
  leadScore?: number;
  qualificationStatus?: LeadQualificationStatus;
  industry?: string;
  companySize?: string;
  jobTitle?: string;
  budgetRange?: string;
  timeline?: string;
  status?: LeadStatus;
  stage?: LeadStage;
  assignedTo?: string;
  convertedToCustomer?: boolean;
  convertedCustomerId?: string;
  convertedAt?: string;
  notes?: string;
  nextFollowUp?: string;
  lastContact?: string;
}

/**
 * Lead Filters DTO
 */
export interface LeadFiltersDTO {
  search?: string;
  email?: string;
  companyName?: string;
  source?: string;
  campaign?: string;
  status?: LeadStatus | LeadStatus[];
  qualificationStatus?: LeadQualificationStatus | LeadQualificationStatus[];
  stage?: LeadStage | LeadStage[];
  assignedTo?: string;
  industry?: string;
  leadScoreMin?: number;
  leadScoreMax?: number;
  convertedToCustomer?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
  tenantId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'leadScore' | 'companyName' | 'nextFollowUp';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Lead List Response DTO
 */
export type LeadListResponseDTO = PaginatedResponseDTO<LeadDTO>;

/**
 * Lead Conversion Metrics DTO
 */
export interface LeadConversionMetricsDTO {
  totalLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  averageConversionTime: number; // in days
  bySource: DistributionDTO;
  byStage: DistributionDTO;
}

/**
 * Deal/Sale Status Enumeration (matching database schema)
 */
export type DealStatus = 'won' | 'lost' | 'cancelled';

/**
 * Sales Activity Type Enumeration
 */
export type SalesActivityType = 'call' | 'meeting' | 'email' | 'demo' | 'proposal' | 'follow_up' | 'negotiation' | 'presentation' | 'site_visit' | 'other';

/**
 * Sales Activity Outcome Enumeration
 */
export type SalesActivityOutcome = 'successful' | 'unsuccessful' | 'pending' | 'cancelled' | 'rescheduled';

/**
 * Deal Stage Info DTO (for UI display - not stored in deals table)
 */
export interface DealStageInfoDTO {
  stage: string;
  label: string;
  displayOrder: number;
  color?: string;
  probability?: number;
}

/**
 * Deal DTO
 * Complete deal/sales opportunity information
 *
 * STANDARDIZED FIELD NAMES (matching database schema exactly):
 * - Status: 'won' | 'lost' | 'cancelled'
 * - Value: value (not: dealAmount, total, price)
 * - Deal Number: dealNumber (unique identifier)
 */
export interface DealDTO {
  /** Unique deal identifier */
  id: string;

  /** Deal number (auto-generated, e.g., D-2025-0001) */
  dealNumber?: string;

  /** Deal title/name */
  title: string;

  /** Deal description */
  description?: string;

  /** Associated customer ID */
  customerId: string;

  /** Customer name (denormalized for convenience) */
  customerName?: string;

  /** Deal value in base currency */
  value: number;

  /** Currency code (ISO 4217) */
  currency: string;

  /** Deal status */
  status: DealStatus;

  /** Deal type: PRODUCT or SERVICE */
  dealType: 'PRODUCT' | 'SERVICE';

  /** Deal source */
  source?: string;

  /** Associated campaign */
  campaign?: string;

  /** Actual close date */
  closeDate: string;

  /** Expected close date */
  expectedCloseDate?: string;

  /** Sales representative assigned to this deal */
  assignedTo: string;

  /** Assigned user name (denormalized) */
  assignedToName?: string;

  /** Internal notes */
  notes?: string;

  /** Deal tags for categorization */
  tags?: string[];

  /** Competitor information */
  competitorInfo?: string;

  /** Win/loss reason */
  winLossReason?: string;

  /** Associated opportunity ID */
  opportunityId?: string;

  /** Tenant ID for multi-tenant support */
  tenantId: string;

  /** Audit metadata */
  audit: AuditMetadataDTO;
}

/** Deal Item DTO */
export interface DealItemDTO {
  id?: string;
  dealId?: string;
  productId?: string;
  productName?: string;
  productDescription?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  discountType?: 'fixed' | 'percentage';
  tax?: number;
  taxRate?: number;
  serviceId?: string;
  duration?: string;
  notes?: string;
  lineTotal?: number;
}

/**
 * Sales Statistics DTO
 * Key metrics and KPIs for sales pipeline
 *
 * STANDARDIZED FIELD NAMES (improved from previous patterns):
 * - totalDeals (not: total, count)
 * - openDeals (not: active, pending)
 * - closedWonDeals (not: closed_won, won)
 * - closedLostDeals (not: closed_lost, lost)
 * - totalPipelineValue (not: pipelineValue)
 * - averageDealSize (not: avg_deal_value)
 */
export interface SalesStatsDTO {
  /** Total number of deals */
  totalDeals: number;

  /** Number of open/active deals */
  openDeals: number;

  /** Number of deals won (closed_won) */
  closedWonDeals: number;

  /** Number of deals lost (closed_lost) */
  closedLostDeals: number;

  /** Total value of all deals in pipeline */
  totalPipelineValue: number;

  /** Total value of won deals this period */
  totalWonValue?: number;

  /** Average deal size */
  averageDealSize: number;

  /** Sales win rate (percentage) */
  winRate: number;

  /** Average sales cycle length (days) */
  averageSalesCycleDays?: number;

  /** Forecast accuracy (percentage) */
  forecastAccuracy?: number;

  /** Sales velocity (deals closed per month) */
  salesVelocity?: number;

  /** Deals by stage distribution */
  byStage: DistributionDTO;

  /** Deals by status distribution */
  byStatus: DistributionDTO;

  /** Deals by sales rep (top performers) */
  byAssignee?: DistributionDTO;

  /** Deals by source */
  bySource?: DistributionDTO;

  /** Revenue forecast for next period */
  revenueForecast?: number;

  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Create Deal Request DTO
 */
export interface CreateDealDTO {
  title: string;
  description?: string;
  customerId: string;
  value: number;
  currency?: string;
  status?: DealStatus;
  assignedTo: string;
  closeDate: string;
  expectedCloseDate?: string;
  source?: string;
  campaign?: string;
  notes?: string;
  tags?: string[];
  competitorInfo?: string;
  opportunityId?: string;
  /** Required: dealType must be provided on create */
  dealType: 'PRODUCT' | 'SERVICE';
  /** Optional line items */
  items?: DealItemDTO[];
}

/**
 * Update Deal Request DTO
 */
export interface UpdateDealDTO {
  title?: string;
  description?: string;
  value?: number;
  currency?: string;
  status?: DealStatus;
  assignedTo?: string;
  closeDate?: string;
  expectedCloseDate?: string;
  source?: string;
  campaign?: string;
  notes?: string;
  tags?: string[];
  competitorInfo?: string;
  winLossReason?: string;
  opportunityId?: string;
  /** Note: Changing dealType is not allowed via update; it must be set on create */
  items?: DealItemDTO[];
}

/**
 * Deal Filters DTO
 */
export interface DealFiltersDTO {
  search?: string;
  customerId?: string;
  status?: DealStatus | DealStatus[];
  assignedTo?: string;
  minValue?: number;
  maxValue?: number;
  source?: string;
  campaign?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  tenantId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'title' | 'value' | 'closeDate' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Deal List Response DTO
 */
export type DealListResponseDTO = PaginatedResponseDTO<DealDTO>;

/**
 * Sales Activity DTO
 * Complete sales activity information for tracking sales interactions
 *
 * STANDARDIZED FIELD NAMES (matching database schema exactly):
 * - activity_type: SalesActivityType enum
 * - subject: activity subject/title
 * - outcome: SalesActivityOutcome enum
 */
export interface SalesActivityDTO {
  /** Unique sales activity identifier */
  id: string;

  /** Type of sales activity */
  activityType: SalesActivityType;

  /** Activity subject/title */
  subject: string;

  /** Activity description */
  description?: string;

  /** Associated opportunity ID (if activity is for opportunity) */
  opportunityId?: string;

  /** Associated deal ID (if activity is for deal) */
  dealId?: string;

  /** Customer ID */
  customerId: string;

  /** Customer name (denormalized) */
  customerName?: string;

  /** Activity start date/time */
  startDate: string;

  /** Activity end date/time */
  endDate?: string;

  /** Duration in minutes */
  durationMinutes?: number;

  /** User who performed the activity */
  performedBy: string;

  /** Performed by user name (denormalized) */
  performedByName?: string;

  /** Additional participants (user IDs) */
  participants?: string[];

  /** Contact person name */
  contactPerson?: string;

  /** Activity outcome */
  outcome?: SalesActivityOutcome;

  /** Outcome notes */
  outcomeNotes?: string;

  /** Next action to take */
  nextAction?: string;

  /** Next action date */
  nextActionDate?: string;

  /** Activity location */
  location?: string;

  /** File attachments */
  attachments?: string[];

  /** Activity tags */
  tags?: string[];

  /** Related record title (opportunity or deal title) */
  relatedRecordTitle?: string;

  /** Tenant ID for multi-tenant support */
  tenantId: string;

  /** Audit metadata */
  audit: AuditMetadataDTO;
}

/**
 * Create Sales Activity Request DTO
 */
export interface CreateSalesActivityDTO {
  activityType: SalesActivityType;
  subject: string;
  description?: string;
  opportunityId?: string;
  dealId?: string;
  customerId: string;
  startDate: string;
  endDate?: string;
  durationMinutes?: number;
  performedBy: string;
  participants?: string[];
  contactPerson?: string;
  outcome?: SalesActivityOutcome;
  outcomeNotes?: string;
  nextAction?: string;
  nextActionDate?: string;
  location?: string;
  attachments?: string[];
  tags?: string[];
}

/**
 * Update Sales Activity Request DTO
 */
export interface UpdateSalesActivityDTO {
  activityType?: SalesActivityType;
  subject?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  durationMinutes?: number;
  participants?: string[];
  contactPerson?: string;
  outcome?: SalesActivityOutcome;
  outcomeNotes?: string;
  nextAction?: string;
  nextActionDate?: string;
  location?: string;
  attachments?: string[];
  tags?: string[];
}

/**
 * Sales Activity Filters DTO
 */
export interface SalesActivityFiltersDTO {
  search?: string;
  activityType?: SalesActivityType | SalesActivityType[];
  opportunityId?: string;
  dealId?: string;
  customerId?: string;
  performedBy?: string;
  outcome?: SalesActivityOutcome | SalesActivityOutcome[];
  dateRange?: {
    from: string;
    to: string;
  };
  tenantId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'startDate' | 'subject' | 'activityType' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Sales Activity List Response DTO
 */
export type SalesActivityListResponseDTO = PaginatedResponseDTO<SalesActivityDTO>;

/**
 * Sales Forecast DTO
 */
export interface SalesForecastDTO {
  month: string;
  forecastedAmount: number;
  actualAmount?: number;
  closedDeals?: number;
  predictedClosedDeals?: number;
}

/**
 * Sales Rep Performance DTO
 */
export interface SalesRepPerformanceDTO {
  userId: string;
  userName: string;
  totalDeals: number;
  closedDeals: number;
  totalRevenue: number;
  winRate: number;
  averageDealSize: number;
  salesCycleAverage: number;
  quota?: number;
  quotaAttainment?: number; // percentage
}

/**
 * Customer Sales Summary DTO
 */
export interface CustomerSalesSummaryDTO {
  customerId: string;
  customerName: string;
  totalDeals: number;
  openDeals: number;
  closedDeals: number;
  totalPipeline: number;
  closedValue: number;
  lastSaleDate?: string;
  primarySalesRep?: string;
}
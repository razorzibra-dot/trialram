/**
 * Sales/Deals Service DTOs
 * Standardized data transfer objects for sales pipeline management
 * Ensures consistent field naming across mock and Supabase implementations
 */

import { AuditMetadataDTO, PaginatedResponseDTO, DistributionDTO, PriorityLevel } from './commonDtos';

/**
 * Deal/Sale Status Enumeration
 */
export type DealStatus = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

/**
 * Deal Stage Enumeration
 */
export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

/**
 * Deal DTO
 * Complete deal/sales opportunity information
 * 
 * STANDARDIZED FIELD NAMES:
 * - Status: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
 * - Amount: dealAmount (not: value, total, price)
 * - Probability: winProbability (not: probability_percentage)
 */
export interface DealDTO {
  /** Unique deal identifier */
  id: string;
  
  /** Deal title/name */
  title: string;
  
  /** Deal description */
  description?: string;
  
  /** Associated customer ID */
  customerId: string;
  
  /** Customer name (denormalized for convenience) */
  customerName: string;
  
  /** Deal amount/value in base currency */
  dealAmount: number;
  
  /** Expected deal amount (if different from actual) */
  expectedAmount?: number;
  
  /** Current deal stage in pipeline */
  stage: DealStage;
  
  /** Deal status */
  status: DealStatus;
  
  /** Sales representative assigned to this deal */
  assignedTo?: string;
  
  /** Win probability (0-100) */
  winProbability: number;
  
  /** Expected close date (ISO 8601) */
  expectedCloseDate: string;
  
  /** Actual close date if closed */
  actualCloseDate?: string;
  
  /** Deal source: website, referral, cold_call, etc. */
  source?: string;
  
  /** Associated product/service IDs */
  productIds?: string[];
  
  /** Deal priority */
  priority?: PriorityLevel;
  
  /** Deal tags for categorization */
  tags?: string[];
  
  /** Internal notes */
  notes?: string;
  
  /** Number of items/products in this deal */
  itemCount?: number;
  
  /** Currency code (ISO 4217) */
  currency?: string;
  
  /** Discount percentage (0-100) */
  discountPercentage?: number;
  
  /** Tax amount */
  taxAmount?: number;
  
  /** Total with tax */
  totalWithTax?: number;
  
  /** Tenant ID for multi-tenant support */
  tenantId: string;
  
  /** Audit metadata */
  audit: AuditMetadataDTO;
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
  dealAmount: number;
  stage: DealStage;
  status?: DealStatus;
  assignedTo?: string;
  winProbability?: number;
  expectedCloseDate: string;
  source?: string;
  productIds?: string[];
  priority?: PriorityLevel;
  tags?: string[];
  notes?: string;
}

/**
 * Update Deal Request DTO
 */
export interface UpdateDealDTO {
  title?: string;
  description?: string;
  dealAmount?: number;
  stage?: DealStage;
  status?: DealStatus;
  assignedTo?: string;
  winProbability?: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  source?: string;
  productIds?: string[];
  priority?: PriorityLevel;
  tags?: string[];
  notes?: string;
}

/**
 * Deal Filters DTO
 */
export interface DealFiltersDTO {
  search?: string;
  customerId?: string;
  stage?: DealStage | DealStage[];
  status?: DealStatus | DealStatus[];
  assignedTo?: string;
  minAmount?: number;
  maxAmount?: number;
  priority?: PriorityLevel;
  source?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  tenantId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'title' | 'dealAmount' | 'expectedCloseDate' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Deal List Response DTO
 */
export type DealListResponseDTO = PaginatedResponseDTO<DealDTO>;

/**
 * Deal Stage Info DTO
 */
export interface DealStageInfoDTO {
  stage: DealStage;
  label: string;
  displayOrder: number;
  color?: string;
  probability?: number; // default win probability for this stage
}

/**
 * Deal Conversion Metrics DTO
 */
export interface DealConversionMetricsDTO {
  stageFrom: DealStage;
  stageTo: DealStage;
  conversionRate: number;
  averageDaysToConvert: number;
  totalConverted: number;
  totalAttempted: number;
}

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
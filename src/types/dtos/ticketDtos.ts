/**
 * Ticket/Support Service DTOs
 * Standardized data transfer objects for support ticket management
 * Ensures consistent field naming across mock and Supabase implementations
 */

import { AuditMetadataDTO, PaginatedResponseDTO, DistributionDTO, PriorityLevel, AttachmentDTO, UserBasicDTO } from './commonDtos';

/**
 * Ticket Status Enumeration
 */
export type TicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'waiting_response' | 'resolved' | 'closed' | 'reopened';

/**
 * Ticket Category Enumeration
 */
export type TicketCategory = 'technical' | 'billing' | 'sales' | 'feedback' | 'complaint' | 'feature_request' | 'other';

/**
 * Ticket Comment DTO
 */
export interface TicketCommentDTO {
  id: string;
  ticketId: string;
  author: UserBasicDTO;
  content: string;
  isInternal: boolean; // only visible to support team
  attachments?: AttachmentDTO[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Ticket DTO
 * Complete support ticket information
 * 
 * STANDARDIZED FIELD NAMES:
 * - totalTickets (not: total, count)
 * - openTickets (not: open, pending)
 * - resolvedTickets (not: resolved, closed)
 * - averageResolutionTime (in hours, not minutes)
 * - averageResponseTime (in hours, not minutes)
 */
export interface TicketDTO {
  /** Unique ticket identifier */
  id: string;
  
  /** Ticket number (user-friendly identifier) */
  ticketNumber: string;
  
  /** Ticket title/subject */
  title: string;
  
  /** Detailed description */
  description: string;
  
  /** Associated customer ID */
  customerId: string;
  
  /** Customer name (denormalized) */
  customerName: string;
  
  /** Customer email (denormalized) */
  customerEmail: string;
  
  /** Ticket status */
  status: TicketStatus;
  
  /** Ticket priority */
  priority: PriorityLevel;
  
  /** Ticket category */
  category: TicketCategory;
  
  /** Support agent assigned to this ticket */
  assignedTo?: string;
  
  /** Assigned agent name */
  assignedToName?: string;
  
  /** First response time (ISO timestamp) */
  firstResponseAt?: string;
  
  /** Time to first response (hours) */
  firstResponseTime?: number;
  
  /** Resolution time (ISO timestamp) */
  resolvedAt?: string;
  
  /** Time to resolution (hours) */
  resolutionTime?: number;
  
  /** Close time (ISO timestamp) */
  closedAt?: string;
  
  /** Customer satisfaction rating (1-5) */
  satisfactionRating?: number;
  
  /** Satisfaction comment */
  satisfactionComment?: string;
  
  /** SLA target response time (hours) */
  slaTargetResponseTime?: number;
  
  /** SLA target resolution time (hours) */
  slaTargetResolutionTime?: number;
  
  /** Is SLA breached */
  isSlaBreach?: boolean;
  
  /** Related tickets (linked issues) */
  relatedTickets?: string[];
  
  /** Comments/activity */
  comments?: TicketCommentDTO[];
  
  /** Number of comments */
  commentCount?: number;
  
  /** Attachments */
  attachments?: AttachmentDTO[];
  
  /** Tags for categorization */
  tags?: string[];
  
  /** Internal notes (visible only to support) */
  internalNotes?: string;
  
  /** Reopened count */
  reopenCount?: number;
  
  /** Tenant ID for multi-tenant support */
  tenantId: string;
  
  /** Audit metadata */
  audit: AuditMetadataDTO;
}

/**
 * Ticket Statistics DTO
 * Key metrics and KPIs for support operations
 * 
 * STANDARDIZED FIELD NAMES:
 * - totalTickets (not: total, count)
 * - openTickets (not: open, pending)
 * - resolvedTickets (not: resolved, closed)
 * - averageResolutionTime (in hours)
 * - averageResponseTime (in hours)
 */
export interface TicketStatsDTO {
  /** Total number of tickets */
  totalTickets: number;
  
  /** Number of open tickets */
  openTickets: number;
  
  /** Number of resolved tickets */
  resolvedTickets: number;
  
  /** Number of closed tickets */
  closedTickets: number;
  
  /** Number of reopened tickets */
  reopenedTickets?: number;
  
  /** Average time to first response (hours) */
  averageResponseTime: number;
  
  /** Average time to resolution (hours) */
  averageResolutionTime: number;
  
  /** Customer satisfaction score (0-100) */
  satisfactionScore: number;
  
  /** Average satisfaction rating (1-5) */
  avgSatisfactionRating?: number;
  
  /** SLA compliance rate (percentage) */
  slaComplianceRate?: number;
  
  /** Tickets with SLA breaches */
  slaBreachCount?: number;
  
  /** First response time SLA compliance */
  responseTimeSlaCompliance?: number;
  
  /** Resolution time SLA compliance */
  resolutionTimeSlaCompliance?: number;
  
  /** Ticket reopen rate (percentage) */
  reopenRate?: number;
  
  /** New tickets today */
  newTicketsToday?: number;
  
  /** Overdue tickets */
  overdueTickets?: number;
  
  /** Tickets by status distribution */
  byStatus: DistributionDTO;
  
  /** Tickets by priority distribution */
  byPriority: DistributionDTO;
  
  /** Tickets by category distribution */
  byCategory: DistributionDTO;
  
  /** Tickets by assigned agent */
  byAssignee?: DistributionDTO;
  
  /** Volume trend (last 7 days) */
  volumeTrend?: Record<string, number>;
  
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Create Ticket Request DTO
 */
export interface CreateTicketDTO {
  title: string;
  description: string;
  customerId: string;
  priority?: PriorityLevel;
  category?: TicketCategory;
  attachmentUrls?: string[];
  tags?: string[];
}

/**
 * Update Ticket Request DTO
 */
export interface UpdateTicketDTO {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: PriorityLevel;
  category?: TicketCategory;
  assignedTo?: string;
  internalNotes?: string;
  tags?: string[];
}

/**
 * Ticket Filters DTO
 */
export interface TicketFiltersDTO {
  search?: string;
  customerId?: string;
  status?: TicketStatus | TicketStatus[];
  priority?: PriorityLevel | PriorityLevel[];
  category?: TicketCategory | TicketCategory[];
  assignedTo?: string;
  isSlaBreach?: boolean;
  satisfactionRating?: number; // minimum rating
  dateRange?: {
    from: string;
    to: string;
  };
  tenantId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'priority' | 'status' | 'resolutionTime';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Ticket List Response DTO
 */
export type TicketListResponseDTO = PaginatedResponseDTO<TicketDTO>;

/**
 * Add Comment Request DTO
 */
export interface AddCommentDTO {
  content: string;
  isInternal?: boolean;
  attachmentUrls?: string[];
}

/**
 * Ticket Assignment DTO
 */
export interface AssignTicketDTO {
  ticketId: string;
  assignedTo: string;
  notes?: string;
}

/**
 * Bulk Ticket Update DTO
 */
export interface BulkTicketUpdateDTO {
  ticketIds: string[];
  status?: TicketStatus;
  priority?: PriorityLevel;
  assignedTo?: string;
  tags?: string[];
}

/**
 * Support Agent Performance DTO
 */
export interface SupportAgentPerformanceDTO {
  agentId: string;
  agentName: string;
  totalTicketsAssigned: number;
  resolvedTickets: number;
  resolutionRate: number;
  avgResolutionTime: number;
  avgResponseTime: number;
  satisfactionScore: number;
  slaComplianceRate: number;
  activeTickets: number;
}

/**
 * Ticket Report DTO
 */
export interface TicketReportDTO {
  period: string; // 'daily', 'weekly', 'monthly'
  startDate: string;
  endDate: string;
  stats: TicketStatsDTO;
  agentPerformance: SupportAgentPerformanceDTO[];
  categoryBreakdown: Record<TicketCategory, number>;
  priorityBreakdown: Record<PriorityLevel, number>;
}

/**
 * SLA Configuration DTO
 */
export interface SlaConfigDTO {
  id: string;
  name: string;
  description?: string;
  priority: PriorityLevel;
  responseTimeHours: number;
  resolutionTimeHours: number;
  isActive: boolean;
}

/**
 * Satisfaction Survey DTO
 */
export interface SatisfactionSurveyDTO {
  ticketId: string;
  rating: number; // 1-5
  comment?: string;
  categories?: {
    responseSpeed: number;
    resolutionQuality: number;
    agentKnowledge: number;
    overallSatisfaction: number;
  };
}
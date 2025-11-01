/**
 * Service Contract Types
 * Complete TypeScript type definitions for the Service Contract module
 * 
 * Synchronization: These types must align exactly with:
 * - Database schema: supabase/migrations/20250130000018_*.sql
 * - Mock service: src/services/serviceContractService.ts
 * - Supabase service: src/services/supabase/serviceContractService.ts
 * 
 * Last Updated: 2025-01-30
 * Version: 1.0.0
 */

import { z } from 'zod';

/**
 * ============================================================
 * Core Service Contract Type
 * ============================================================
 * Matches database table: service_contracts
 */
export interface ServiceContractType {
  // Identification
  id: string;
  contractNumber: string;
  title: string;
  description?: string;

  // Related Entities
  customerId: string;
  customerName: string;
  productId?: string;
  productName?: string;

  // Service Details
  serviceType: 'support' | 'maintenance' | 'consulting' | 'training' | 'hosting' | 'custom';
  status: 'draft' | 'pending_approval' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'urgent';

  // Financial
  value: number;
  currency: string;
  billingFrequency?: 'monthly' | 'quarterly' | 'annually' | 'one_time';
  paymentTerms?: string;

  // Service Delivery Terms
  slaTerms?: string;
  renewalTerms?: string;
  serviceScope?: string;
  exclusions?: string;

  // Dates
  startDate: string;
  endDate: string;
  estimatedCompletionDate?: string;

  // Renewal
  autoRenew: boolean;
  renewalPeriodMonths?: number;
  lastRenewalDate?: string;
  nextRenewalDate?: string;

  // Scheduling
  deliverySchedule?: string;
  scheduledHoursPerWeek?: number;
  timeZone?: string;

  // Assignment
  assignedToUserId?: string;
  assignedToName?: string;
  secondaryContactId?: string;
  secondaryContactName?: string;

  // Approval & Compliance
  approvalStatus?: 'approved' | 'rejected' | 'pending' | 'in_review';
  approvedByUserId?: string;
  approvedAt?: string;
  complianceNotes?: string;

  // Organization
  tags?: string[];
  customFields?: Record<string, any>;

  // Audit
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt: string;
  deletedAt?: string;
  tenantId: string;
}

/**
 * ============================================================
 * Service Contract Document Type
 * ============================================================
 * Matches database table: service_contract_documents
 */
export interface ServiceContractDocumentType {
  id: string;
  serviceContractId: string;
  fileName: string;
  fileType: 'pdf' | 'doc' | 'docx' | 'xlsx' | 'xls' | 'pptx' | 'txt' | 'jpg' | 'png' | 'gif' | 'other';
  fileSize: number;
  filePath: string;
  documentType: 'sla_document' | 'schedule' | 'attachment' | 'email' | 'signed_contract' | 'amendment' | 'other';
  uploadedByUserId?: string;
  uploadedByName?: string;
  description?: string;
  tags?: string[];
  isActive: boolean;
  versionNumber: number;
  parentDocumentId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  tenantId: string;
}

/**
 * ============================================================
 * Service Delivery Milestone Type
 * ============================================================
 * Matches database table: service_delivery_milestones
 */
export interface ServiceDeliveryMilestoneType {
  id: string;
  serviceContractId: string;
  milestoneName: string;
  description?: string;
  sequenceNumber: number;
  plannedDate?: string;
  actualDate?: string;
  deliverableDescription?: string;
  acceptanceCriteria?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  completionPercentage: number;
  assignedToUserId?: string;
  assignedToName?: string;
  notes?: string;
  dependencies?: string[];
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

/**
 * ============================================================
 * Service Contract Issue Type
 * ============================================================
 * Matches database table: service_contract_issues
 */
export interface ServiceContractIssueType {
  id: string;
  serviceContractId: string;
  issueTitle: string;
  issueDescription?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'sla_breach' | 'resource' | 'schedule' | 'scope' | 'budget' | 'other';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
  resolutionNotes?: string;
  resolutionDate?: string;
  assignedToUserId?: string;
  assignedToName?: string;
  reportedDate: string;
  targetResolutionDate?: string;
  impactDescription?: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

/**
 * ============================================================
 * Service Contract Activity Log Type
 * ============================================================
 * Matches database table: service_contract_activity_log
 */
export interface ServiceContractActivityLogType {
  id: string;
  serviceContractId: string;
  activityType: string;
  activityDescription?: string;
  changes?: Record<string, any>;
  userId?: string;
  userName?: string;
  activityDate: string;
  tenantId: string;
}

/**
 * ============================================================
 * Input Types for CRUD Operations
 * ============================================================
 */

export interface ServiceContractCreateInput {
  title: string;
  description?: string;
  customerId: string;
  customerName: string;
  productId?: string;
  productName?: string;
  serviceType: string;
  priority?: string;
  value: number;
  currency?: string;
  billingFrequency?: string;
  paymentTerms?: string;
  slaTerms?: string;
  renewalTerms?: string;
  serviceScope?: string;
  exclusions?: string;
  startDate: string;
  endDate: string;
  estimatedCompletionDate?: string;
  autoRenew?: boolean;
  renewalPeriodMonths?: number;
  deliverySchedule?: string;
  scheduledHoursPerWeek?: number;
  timeZone?: string;
  assignedToUserId?: string;
  assignedToName?: string;
  secondaryContactId?: string;
  secondaryContactName?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface ServiceContractUpdateInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  value?: number;
  currency?: string;
  billingFrequency?: string;
  paymentTerms?: string;
  slaTerms?: string;
  renewalTerms?: string;
  serviceScope?: string;
  exclusions?: string;
  startDate?: string;
  endDate?: string;
  estimatedCompletionDate?: string;
  autoRenew?: boolean;
  renewalPeriodMonths?: number;
  deliverySchedule?: string;
  scheduledHoursPerWeek?: number;
  timeZone?: string;
  assignedToUserId?: string;
  assignedToName?: string;
  secondaryContactId?: string;
  secondaryContactName?: string;
  approvalStatus?: string;
  complianceNotes?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface ServiceContractDocumentCreateInput {
  serviceContractId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  documentType: string;
  description?: string;
  tags?: string[];
}

export interface ServiceDeliveryMilestoneCreateInput {
  serviceContractId: string;
  milestoneName: string;
  description?: string;
  sequenceNumber: number;
  plannedDate?: string;
  deliverableDescription?: string;
  acceptanceCriteria?: string;
  assignedToUserId?: string;
  assignedToName?: string;
  notes?: string;
  dependencies?: string[];
}

export interface ServiceContractIssueCreateInput {
  serviceContractId: string;
  issueTitle: string;
  issueDescription?: string;
  severity: string;
  category: string;
  assignedToUserId?: string;
  assignedToName?: string;
  targetResolutionDate?: string;
  impactDescription?: string;
}

/**
 * ============================================================
 * Filter Types
 * ============================================================
 */

export interface ServiceContractFilters {
  search?: string;
  status?: string;
  serviceType?: string;
  customerId?: string;
  customerName?: string;
  assignedTo?: string;
  priority?: string;
  approvalStatus?: string;
  dateRange?: { start: string; end: string };
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * ============================================================
 * Statistics Types
 * ============================================================
 */

export interface ServiceContractStats {
  total: number;
  byStatus: Record<string, number>;
  byServiceType: Record<string, number>;
  activeContracts: number;
  pendingApprovalContracts: number;
  expiredContracts: number;
  totalValue: number;
  averageValue: number;
  totalDocuments: number;
  openIssues: number;
  upcomingMilestones: number;
}

export interface ServiceContractDashboardData {
  stats: ServiceContractStats;
  recentContracts: ServiceContractType[];
  upcomingRenewals: ServiceContractType[];
  pendingApprovals: ServiceContractType[];
  openIssues: ServiceContractIssueType[];
}

/**
 * ============================================================
 * Wizard Form Step Types
 * ============================================================
 * For multi-step form navigation
 */

export interface ServiceContractWizardStep {
  stepNumber: number;
  title: string;
  description: string;
  requiredFields: string[];
  isComplete: boolean;
}

export interface ServiceContractWizardData {
  // Step 1: Basic Information
  title?: string;
  description?: string;
  customerId?: string;
  customerName?: string;
  productId?: string;
  productName?: string;
  serviceType?: string;

  // Step 2: Service Details
  slaTerms?: string;
  serviceScope?: string;
  exclusions?: string;

  // Step 3: Financial Terms
  value?: number;
  currency?: string;
  billingFrequency?: string;
  paymentTerms?: string;

  // Step 4: Dates & Renewal
  startDate?: string;
  endDate?: string;
  autoRenew?: boolean;
  renewalPeriodMonths?: number;

  // Step 5: Team & Assignment
  assignedToUserId?: string;
  assignedToName?: string;
  secondaryContactId?: string;
  secondaryContactName?: string;

  // Step 6: Scheduling
  deliverySchedule?: string;
  scheduledHoursPerWeek?: number;
  timeZone?: string;

  // Step 7: Documents
  documents?: File[];

  // Step 8: Review
  ready?: boolean;
}

/**
 * ============================================================
 * Validation Schemas using Zod
 * ============================================================
 * These schemas enforce database constraints at the application layer
 */

export const ServiceContractCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  customerId: z.string().uuid(),
  customerName: z.string().min(1).max(255),
  productId: z.string().uuid().optional(),
  productName: z.string().max(255).optional(),
  serviceType: z.enum(['support', 'maintenance', 'consulting', 'training', 'hosting', 'custom']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  value: z.number().min(0).max(999999.99),
  currency: z.string().max(3).default('USD'),
  billingFrequency: z.enum(['monthly', 'quarterly', 'annually', 'one_time']).optional(),
  paymentTerms: z.string().optional(),
  slaTerms: z.string().optional(),
  renewalTerms: z.string().optional(),
  serviceScope: z.string().optional(),
  exclusions: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  estimatedCompletionDate: z.string().datetime().optional(),
  autoRenew: z.boolean().default(false),
  renewalPeriodMonths: z.number().int().min(1).max(360).optional(),
  deliverySchedule: z.string().optional(),
  scheduledHoursPerWeek: z.number().int().min(1).max(168).optional(),
  timeZone: z.string().max(50).optional(),
  assignedToUserId: z.string().uuid().optional(),
  assignedToName: z.string().max(255).optional(),
  secondaryContactId: z.string().uuid().optional(),
  secondaryContactName: z.string().max(255).optional(),
  tags: z.string().array().optional(),
  customFields: z.record(z.any()).optional(),
});

export const ServiceContractUpdateSchema = ServiceContractCreateSchema.partial();

export type ServiceContractCreate = z.infer<typeof ServiceContractCreateSchema>;
export type ServiceContractUpdate = z.infer<typeof ServiceContractUpdateSchema>;
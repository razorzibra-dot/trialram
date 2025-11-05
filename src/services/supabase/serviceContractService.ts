/**
 * Service Contract Supabase Service
 * Production implementation using Supabase PostgreSQL
 * 
 * Synchronization: Must match exactly with:
 * - Mock service: src/services/serviceContractService.ts
 * - Types: src/types/serviceContract.ts
 * 
 * Last Updated: 2025-01-30
 * Version: 1.0.0
 */

import { supabaseClient } from './client';
import {
  ServiceContractType,
  ServiceContractDocumentType,
  ServiceDeliveryMilestoneType,
  ServiceContractIssueType,
  ServiceContractCreateInput,
  ServiceContractUpdateInput,
  ServiceContractFilters,
  ServiceContractStats,
  ServiceContractDocumentCreateInput,
  ServiceDeliveryMilestoneCreateInput,
  ServiceContractIssueCreateInput,
} from '@/types/serviceContract';
import { PaginatedResponse } from '@/types/service';

/**
 * Centralized row mapper for database→TypeScript field mapping
 * CRITICAL: Keep synchronized with database schema
 */
function mapServiceContractRow(row: any): ServiceContractType {
  return {
    id: row.id,
    contractNumber: row.contract_number,
    title: row.title,
    description: row.description,
    customerId: row.customer_id,
    customerName: row.customer_name,
    productId: row.product_id,
    productName: row.product_name,
    serviceType: row.service_type,
    status: row.status,
    priority: row.priority,
    value: parseFloat(row.value),
    currency: row.currency,
    billingFrequency: row.billing_frequency,
    paymentTerms: row.payment_terms,
    slaTerms: row.sla_terms,
    renewalTerms: row.renewal_terms,
    serviceScope: row.service_scope,
    exclusions: row.exclusions,
    startDate: row.start_date,
    endDate: row.end_date,
    estimatedCompletionDate: row.estimated_completion_date,
    autoRenew: row.auto_renew,
    renewalPeriodMonths: row.renewal_period_months,
    lastRenewalDate: row.last_renewal_date,
    nextRenewalDate: row.next_renewal_date,
    deliverySchedule: row.delivery_schedule,
    scheduledHoursPerWeek: row.scheduled_hours_per_week,
    timeZone: row.time_zone,
    assignedToUserId: row.assigned_to_user_id,
    assignedToName: row.assigned_to_name,
    secondaryContactId: row.secondary_contact_id,
    secondaryContactName: row.secondary_contact_name,
    approvalStatus: row.approval_status,
    approvedByUserId: row.approved_by_user_id,
    approvedAt: row.approved_at,
    complianceNotes: row.compliance_notes,
    tags: row.tags,
    customFields: row.custom_fields,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
    tenantId: row.tenant_id,
  };
}

function mapDocumentRow(row: any): ServiceContractDocumentType {
  return {
    id: row.id,
    serviceContractId: row.service_contract_id,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: row.file_size,
    filePath: row.file_path,
    documentType: row.document_type,
    uploadedByUserId: row.uploaded_by_user_id,
    uploadedByName: row.uploaded_by_name,
    description: row.description,
    tags: row.tags,
    isActive: row.is_active,
    versionNumber: row.version_number,
    parentDocumentId: row.parent_document_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tenantId: row.tenant_id,
  };
}

function mapMilestoneRow(row: any): ServiceDeliveryMilestoneType {
  return {
    id: row.id,
    serviceContractId: row.service_contract_id,
    milestoneName: row.milestone_name,
    description: row.description,
    sequenceNumber: row.sequence_number,
    plannedDate: row.planned_date,
    actualDate: row.actual_date,
    deliverableDescription: row.deliverable_description,
    acceptanceCriteria: row.acceptance_criteria,
    status: row.status,
    completionPercentage: row.completion_percentage,
    assignedToUserId: row.assigned_to_user_id,
    assignedToName: row.assigned_to_name,
    notes: row.notes,
    dependencies: row.dependencies,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tenantId: row.tenant_id,
  };
}

function mapIssueRow(row: any): ServiceContractIssueType {
  return {
    id: row.id,
    serviceContractId: row.service_contract_id,
    issueTitle: row.issue_title,
    issueDescription: row.issue_description,
    severity: row.severity,
    category: row.category,
    status: row.status,
    resolutionNotes: row.resolution_notes,
    resolutionDate: row.resolution_date,
    assignedToUserId: row.assigned_to_user_id,
    assignedToName: row.assigned_to_name,
    reportedDate: row.reported_date,
    targetResolutionDate: row.target_resolution_date,
    impactDescription: row.impact_description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tenantId: row.tenant_id,
  };
}

/**
 * Service Contract Supabase Service
 */
export const supabaseServiceContractService = {
  /**
   * Get service contracts with filtering and pagination
   */
  async getServiceContracts(filters: ServiceContractFilters = {}): Promise<PaginatedResponse<ServiceContractType>> {
    try {
      let query = supabaseClient.from('service_contracts').select('*', { count: 'exact' });

      // Apply filters
      if (filters.search) {
        const search = filters.search;
        query = query.or(
          `contract_number.ilike.%${search}%,title.ilike.%${search}%,customer_name.ilike.%${search}%,description.ilike.%${search}%`
        );
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.serviceType) {
        query = query.eq('service_type', filters.serviceType);
      }

      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }

      if (filters.assignedTo) {
        query = query.eq('assigned_to_user_id', filters.assignedTo);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.approvalStatus) {
        query = query.eq('approval_status', filters.approvalStatus);
      }

      if (filters.dateRange) {
        query = query
          .gte('start_date', filters.dateRange.start)
          .lte('start_date', filters.dateRange.end);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
      query = query.order(sortBy, sortOrder);

      // Apply pagination
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const startIndex = (page - 1) * pageSize;

      query = query.range(startIndex, startIndex + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: (data || []).map(mapServiceContractRow),
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    } catch (error) {
      console.error('Failed to fetch service contracts', error);
      throw error;
    }
  },

  /**
   * Get single service contract
   */
  async getServiceContract(id: string): Promise<ServiceContractType> {
    try {
      const { data, error } = await supabaseClient
        .from('service_contracts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error(`Service contract ${id} not found`);

      return mapServiceContractRow(data);
    } catch (error) {
      console.error(`Failed to fetch service contract ${id}`, error);
      throw error;
    }
  },

  /**
   * Create service contract
   */
  async createServiceContract(data: ServiceContractCreateInput): Promise<ServiceContractType> {
    try {
      // Validate required fields
      if (!data.title || !data.customerId || !data.serviceType) {
        throw new Error('Required fields missing: title, customerId, serviceType');
      }

      const { data: result, error } = await supabaseClient
        .from('service_contracts')
        .insert([
          {
            contract_number: `SVC-${new Date().getFullYear()}-${String(Math.random()).slice(2, 5)}`,
            title: data.title,
            description: data.description,
            customer_id: data.customerId,
            customer_name: data.customerName,
            product_id: data.productId,
            product_name: data.productName,
            service_type: data.serviceType,
            status: 'draft',
            priority: data.priority || 'medium',
            value: data.value,
            currency: data.currency || 'USD',
            billing_frequency: data.billingFrequency,
            payment_terms: data.paymentTerms,
            sla_terms: data.slaTerms,
            renewal_terms: data.renewalTerms,
            service_scope: data.serviceScope,
            exclusions: data.exclusions,
            start_date: data.startDate,
            end_date: data.endDate,
            estimated_completion_date: data.estimatedCompletionDate,
            auto_renew: data.autoRenew || false,
            renewal_period_months: data.renewalPeriodMonths,
            delivery_schedule: data.deliverySchedule,
            scheduled_hours_per_week: data.scheduledHoursPerWeek,
            time_zone: data.timeZone,
            assigned_to_user_id: data.assignedToUserId,
            assigned_to_name: data.assignedToName,
            secondary_contact_id: data.secondaryContactId,
            secondary_contact_name: data.secondaryContactName,
            tags: data.tags,
            custom_fields: data.customFields,
            created_by: (await supabaseClient.auth.getUser()).data.user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return mapServiceContractRow(result);
    } catch (error) {
      console.error('Failed to create service contract', error);
      throw error;
    }
  },

  /**
   * Update service contract
   */
  async updateServiceContract(id: string, data: ServiceContractUpdateInput): Promise<ServiceContractType> {
    try {
      const updateData: any = {};
      const fieldMap: Record<string, string> = {
        title: 'title',
        description: 'description',
        status: 'status',
        priority: 'priority',
        value: 'value',
        currency: 'currency',
        billingFrequency: 'billing_frequency',
        paymentTerms: 'payment_terms',
        slaTerms: 'sla_terms',
        renewalTerms: 'renewal_terms',
        serviceScope: 'service_scope',
        exclusions: 'exclusions',
        startDate: 'start_date',
        endDate: 'end_date',
        estimatedCompletionDate: 'estimated_completion_date',
        autoRenew: 'auto_renew',
        renewalPeriodMonths: 'renewal_period_months',
        deliverySchedule: 'delivery_schedule',
        scheduledHoursPerWeek: 'scheduled_hours_per_week',
        timeZone: 'time_zone',
        assignedToUserId: 'assigned_to_user_id',
        assignedToName: 'assigned_to_name',
        secondaryContactId: 'secondary_contact_id',
        secondaryContactName: 'secondary_contact_name',
        approvalStatus: 'approval_status',
        complianceNotes: 'compliance_notes',
        tags: 'tags',
        customFields: 'custom_fields',
      };

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && fieldMap[key]) {
          updateData[fieldMap[key]] = value;
        }
      });

      updateData.updated_by = (await supabaseClient.auth.getUser()).data.user?.id;
      updateData.updated_at = new Date().toISOString();

      const { data: result, error } = await supabaseClient
        .from('service_contracts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapServiceContractRow(result);
    } catch (error) {
      console.error(`Failed to update service contract ${id}`, error);
      throw error;
    }
  },

  /**
   * Delete service contract
   */
  async deleteServiceContract(id: string): Promise<void> {
    try {
      const { error } = await supabaseClient.from('service_contracts').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error(`Failed to delete service contract ${id}`, error);
      throw error;
    }
  },

  /**
   * Update service contract status
   */
  async updateServiceContractStatus(id: string, status: string): Promise<ServiceContractType> {
    return this.updateServiceContract(id, { status: status as any });
  },

  /**
   * Get service contract statistics
   */
  async getServiceContractStats(): Promise<ServiceContractStats> {
    try {
      const { data: contracts, error } = await supabaseClient
        .from('service_contracts')
        .select('id, status, service_type, value');

      if (error) throw error;

      const { data: documents } = await supabaseClient
        .from('service_contract_documents')
        .select('id', { count: 'exact' });

      const { data: issues } = await supabaseClient
        .from('service_contract_issues')
        .select('id')
        .eq('status', 'open');

      const { data: milestones } = await supabaseClient
        .from('service_delivery_milestones')
        .select('id')
        .eq('status', 'pending');

      const stats: ServiceContractStats = {
        total: contracts?.length || 0,
        byStatus: {},
        byServiceType: {},
        activeContracts: 0,
        pendingApprovalContracts: 0,
        expiredContracts: 0,
        totalValue: 0,
        averageValue: 0,
        totalDocuments: documents?.length || 0,
        openIssues: issues?.length || 0,
        upcomingMilestones: milestones?.length || 0,
      };

      contracts?.forEach((c: any) => {
        stats.byStatus[c.status] = (stats.byStatus[c.status] || 0) + 1;
        stats.byServiceType[c.service_type] = (stats.byServiceType[c.service_type] || 0) + 1;

        if (c.status === 'active') stats.activeContracts++;
        if (c.status === 'pending_approval') stats.pendingApprovalContracts++;
        if (c.status === 'expired') stats.expiredContracts++;

        stats.totalValue += parseFloat(c.value) || 0;
      });

      stats.averageValue = stats.total > 0 ? stats.totalValue / stats.total : 0;

      return stats;
    } catch (error) {
      console.error('Failed to fetch service contract statistics', error);
      throw error;
    }
  },

  /**
   * Get service contract documents
   */
  async getServiceContractDocuments(contractId: string): Promise<ServiceContractDocumentType[]> {
    try {
      const { data, error } = await supabaseClient
        .from('service_contract_documents')
        .select('*')
        .eq('service_contract_id', contractId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapDocumentRow);
    } catch (error) {
      console.error(`Failed to fetch documents for contract ${contractId}`, error);
      throw error;
    }
  },

  /**
   * Add document to service contract
   */
  async addServiceContractDocument(data: ServiceContractDocumentCreateInput): Promise<ServiceContractDocumentType> {
    try {
      const { data: result, error } = await supabaseClient
        .from('service_contract_documents')
        .insert([
          {
            service_contract_id: data.serviceContractId,
            file_name: data.fileName,
            file_type: data.fileType,
            file_size: data.fileSize,
            file_path: data.filePath,
            document_type: data.documentType,
            description: data.description,
            tags: data.tags,
            is_active: true,
            version_number: 1,
            uploaded_by_user_id: (await supabaseClient.auth.getUser()).data.user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return mapDocumentRow(result);
    } catch (error) {
      console.error('Failed to add document', error);
      throw error;
    }
  },

  /**
   * Get service delivery milestones
   */
  async getServiceDeliveryMilestones(contractId: string): Promise<ServiceDeliveryMilestoneType[]> {
    try {
      const { data, error } = await supabaseClient
        .from('service_delivery_milestones')
        .select('*')
        .eq('service_contract_id', contractId)
        .order('sequence_number', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapMilestoneRow);
    } catch (error) {
      console.error(`Failed to fetch milestones for contract ${contractId}`, error);
      throw error;
    }
  },

  /**
   * Add milestone to service contract
   */
  async addServiceDeliveryMilestone(data: ServiceDeliveryMilestoneCreateInput): Promise<ServiceDeliveryMilestoneType> {
    try {
      const { data: result, error } = await supabaseClient
        .from('service_delivery_milestones')
        .insert([
          {
            service_contract_id: data.serviceContractId,
            milestone_name: data.milestoneName,
            description: data.description,
            sequence_number: data.sequenceNumber,
            planned_date: data.plannedDate,
            deliverable_description: data.deliverableDescription,
            acceptance_criteria: data.acceptanceCriteria,
            status: 'pending',
            completion_percentage: 0,
            assigned_to_user_id: data.assignedToUserId,
            assigned_to_name: data.assignedToName,
            notes: data.notes,
            dependencies: data.dependencies,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return mapMilestoneRow(result);
    } catch (error) {
      console.error('Failed to add milestone', error);
      throw error;
    }
  },

  /**
   * Get service contract issues
   */
  async getServiceContractIssues(contractId: string): Promise<ServiceContractIssueType[]> {
    try {
      const { data, error } = await supabaseClient
        .from('service_contract_issues')
        .select('*')
        .eq('service_contract_id', contractId)
        .order('severity', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapIssueRow);
    } catch (error) {
      console.error(`Failed to fetch issues for contract ${contractId}`, error);
      throw error;
    }
  },

  /**
   * Add issue to service contract
   */
  async addServiceContractIssue(data: ServiceContractIssueCreateInput): Promise<ServiceContractIssueType> {
    try {
      const { data: result, error } = await supabaseClient
        .from('service_contract_issues')
        .insert([
          {
            service_contract_id: data.serviceContractId,
            issue_title: data.issueTitle,
            issue_description: data.issueDescription,
            severity: data.severity,
            category: data.category,
            status: 'open',
            assigned_to_user_id: data.assignedToUserId,
            assigned_to_name: data.assignedToName,
            reported_date: new Date().toISOString().split('T')[0],
            target_resolution_date: data.targetResolutionDate,
            impact_description: data.impactDescription,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return mapIssueRow(result);
    } catch (error) {
      console.error('Failed to add issue', error);
      throw error;
    }
  },

  /**
   * Export service contracts
   */
  async exportServiceContracts(format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      const { data: contracts, error } = await supabaseClient
        .from('service_contracts')
        .select('*')
        .limit(10000);

      if (error) throw error;

      if (format === 'json') {
        return JSON.stringify((contracts || []).map(mapServiceContractRow), null, 2);
      }

      // CSV format
      const headers = [
        'ID',
        'Contract Number',
        'Title',
        'Customer',
        'Service Type',
        'Status',
        'Value',
        'Start Date',
        'End Date',
        'Assigned To',
      ];
      const rows = (contracts || []).map((c: any) => [
        c.id,
        c.contract_number,
        c.title,
        c.customer_name,
        c.service_type,
        c.status,
        c.value,
        c.start_date,
        c.end_date,
        c.assigned_to_name || '',
      ]);

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\r\n');

      return csv;
    } catch (error) {
      console.error('Failed to export service contracts', error);
      throw error;
    }
  },

  /**
   * Bulk update service contracts
   */
  async bulkUpdateServiceContracts(
    ids: string[],
    updates: ServiceContractUpdateInput
  ): Promise<ServiceContractType[]> {
    try {
      const promises = ids.map((id) => this.updateServiceContract(id, updates));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Failed to bulk update service contracts', error);
      throw error;
    }
  },

  /**
   * Bulk delete service contracts
   */
  async bulkDeleteServiceContracts(ids: string[]): Promise<void> {
    try {
      const { error } = await supabaseClient.from('service_contracts').delete().in('id', ids);
      if (error) throw error;
    } catch (error) {
      console.error('Failed to bulk delete service contracts', error);
      throw error;
    }
  },
};
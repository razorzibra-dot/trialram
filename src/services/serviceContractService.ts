/**
 * Service Contract Mock Service
 * Provides mock data and business logic for service contracts (development mode)
 * 
 * Synchronization: Must match exactly with:
 * - Supabase service: src/services/supabase/serviceContractService.ts
 * - Types: src/types/serviceContract.ts
 * - Validation: Applied in both mock and supabase
 * 
 * Last Updated: 2025-01-30
 * Version: 1.0.0
 */

import {
  ServiceContractType,
  ServiceContractDocumentType,
  ServiceDeliveryMilestoneType,
  ServiceContractIssueType,
  ServiceContractActivityLogType,
  ServiceContractCreateInput,
  ServiceContractUpdateInput,
  ServiceContractFilters,
  ServiceContractStats,
  ServiceContractDocumentCreateInput,
  ServiceDeliveryMilestoneCreateInput,
  ServiceContractIssueCreateInput,
} from '@/types/serviceContract';
import { PaginatedResponse } from '@/modules/core/types';

/**
 * Mock data for service contracts
 * These match the database schema exactly
 */
const mockServiceContracts: ServiceContractType[] = [
  {
    id: '1',
    contractNumber: 'SVC-2025-001',
    title: 'Premium 24/7 Support Package',
    description: 'Comprehensive support services including email, phone, and chat support',
    customerId: 'cust-1',
    customerName: 'Acme Corporation',
    productId: 'prod-1',
    productName: 'Enterprise Support Suite',
    serviceType: 'support',
    status: 'active',
    priority: 'high',
    value: 24000.00,
    currency: 'USD',
    billingFrequency: 'monthly',
    paymentTerms: 'Net 30',
    slaTerms: '24/7 support with 4-hour response time for critical issues, 8-hour for high priority',
    renewalTerms: 'Automatic renewal for 12 months at same terms',
    serviceScope: 'Unlimited support tickets, dedicated account manager, quarterly business reviews',
    exclusions: 'Custom development, emergency on-site support beyond 20 hours/month',
    startDate: '2024-01-01',
    endDate: '2025-12-31',
    estimatedCompletionDate: '2025-12-31',
    autoRenew: true,
    renewalPeriodMonths: 12,
    lastRenewalDate: '2024-01-01',
    nextRenewalDate: '2025-01-01',
    deliverySchedule: 'Ongoing, 24/7 availability',
    scheduledHoursPerWeek: 168,
    timeZone: 'America/New_York',
    assignedToUserId: 'user-1',
    assignedToName: 'John Smith',
    secondaryContactId: 'user-2',
    secondaryContactName: 'Jane Doe',
    approvalStatus: 'approved',
    approvedByUserId: 'user-3',
    approvedAt: '2024-01-05',
    complianceNotes: 'Fully compliant with ISO 27001 standards',
    tags: ['support', 'critical', 'enterprise'],
    customFields: { slaMetric: '99.9% uptime', supportTier: 'platinum' },
    createdBy: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedBy: 'user-1',
    updatedAt: '2024-01-05T10:30:00Z',
    tenantId: 'tenant-1',
  },
  {
    id: '2',
    contractNumber: 'SVC-2025-002',
    title: 'Software Maintenance & Updates',
    description: 'Monthly software updates, patches, and maintenance services',
    customerId: 'cust-2',
    customerName: 'Tech Solutions Inc',
    productId: 'prod-2',
    productName: 'Business Intelligence Platform',
    serviceType: 'maintenance',
    status: 'active',
    priority: 'medium',
    value: 12000.00,
    currency: 'USD',
    billingFrequency: 'quarterly',
    paymentTerms: 'Net 45',
    slaTerms: 'Updates deployed within 5 business days of release, emergency patches within 24 hours',
    renewalTerms: 'Auto-renewal annually unless cancelled 30 days prior',
    serviceScope: 'Software updates, security patches, bug fixes, performance optimization',
    exclusions: 'Custom features, training, data migration',
    startDate: '2024-02-01',
    endDate: '2025-01-31',
    estimatedCompletionDate: '2025-01-31',
    autoRenew: true,
    renewalPeriodMonths: 12,
    lastRenewalDate: '2024-02-01',
    nextRenewalDate: '2025-02-01',
    deliverySchedule: 'Monthly maintenance windows on 2nd Tuesday of each month',
    scheduledHoursPerWeek: 40,
    timeZone: 'America/Chicago',
    assignedToUserId: 'user-2',
    assignedToName: 'Jane Doe',
    approvalStatus: 'approved',
    approvedByUserId: 'user-3',
    approvedAt: '2024-02-02',
    complianceNotes: 'Meets HIPAA and SOC 2 compliance requirements',
    tags: ['maintenance', 'critical', 'production'],
    customFields: { deploymentWindow: 'Tuesday 2am EST', rollbackPlan: 'automated' },
    createdBy: 'user-2',
    createdAt: '2024-02-01T00:00:00Z',
    updatedBy: 'user-2',
    updatedAt: '2024-02-05T14:20:00Z',
    tenantId: 'tenant-1',
  },
  {
    id: '3',
    contractNumber: 'SVC-2025-003',
    title: 'IT Consulting Services',
    description: 'Strategic IT consulting and technology advisory services',
    customerId: 'cust-3',
    customerName: 'Global Enterprises Ltd',
    productId: 'prod-3',
    productName: 'Digital Transformation Package',
    serviceType: 'consulting',
    status: 'pending_approval',
    priority: 'high',
    value: 50000.00,
    currency: 'USD',
    billingFrequency: 'one_time',
    paymentTerms: 'Net 60 - 50% upfront, 50% upon completion',
    slaTerms: 'Consulting team available 40 hours/week, response within 24 hours',
    renewalTerms: 'Not applicable - one-time engagement',
    serviceScope: 'Architecture review, technology assessment, implementation roadmap, training',
    exclusions: 'Hands-on implementation, staff augmentation, third-party software licenses',
    startDate: '2025-03-01',
    endDate: '2025-06-30',
    estimatedCompletionDate: '2025-06-30',
    autoRenew: false,
    renewalPeriodMonths: undefined,
    deliverySchedule: 'Phased delivery: Week 1-2 Assessment, Week 3-6 Roadmap Development, Week 7-16 Implementation Support',
    scheduledHoursPerWeek: 40,
    timeZone: 'America/Los_Angeles',
    assignedToUserId: 'user-3',
    assignedToName: 'Mike Johnson',
    secondaryContactId: 'user-4',
    secondaryContactName: 'Sarah Williams',
    approvalStatus: 'pending',
    complianceNotes: 'Pending security assessment and legal review',
    tags: ['consulting', 'strategic', 'high-value'],
    customFields: { projectManager: 'Mike Johnson', budget: '50000', riskLevel: 'medium' },
    createdBy: 'user-3',
    createdAt: '2025-02-01T00:00:00Z',
    updatedBy: 'user-3',
    updatedAt: '2025-02-15T09:45:00Z',
    tenantId: 'tenant-1',
  },
];

const mockDocuments: ServiceContractDocumentType[] = [
  {
    id: 'doc-1',
    serviceContractId: '1',
    fileName: 'Support_SLA_Agreement.pdf',
    fileType: 'pdf',
    fileSize: 245000,
    filePath: '/contracts/SVC-2025-001/Support_SLA_Agreement.pdf',
    documentType: 'sla_document',
    uploadedByUserId: 'user-1',
    uploadedByName: 'John Smith',
    description: 'Official SLA document signed by both parties',
    tags: ['sla', 'official', 'signed'],
    isActive: true,
    versionNumber: 1,
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z',
    tenantId: 'tenant-1',
  },
  {
    id: 'doc-2',
    serviceContractId: '1',
    fileName: 'Service_Schedule_2024.xlsx',
    fileType: 'xlsx',
    fileSize: 156000,
    filePath: '/contracts/SVC-2025-001/Service_Schedule_2024.xlsx',
    documentType: 'schedule',
    uploadedByUserId: 'user-2',
    uploadedByName: 'Jane Doe',
    description: 'Detailed service delivery schedule with milestones',
    tags: ['schedule', 'delivery', 'milestones'],
    isActive: true,
    versionNumber: 2,
    createdAt: '2024-01-10T14:30:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
    tenantId: 'tenant-1',
  },
];

const mockMilestones: ServiceDeliveryMilestoneType[] = [
  {
    id: 'milestone-1',
    serviceContractId: '1',
    milestoneName: 'Support Team Onboarding',
    description: 'Initial setup and team training',
    sequenceNumber: 1,
    plannedDate: '2024-01-10',
    actualDate: '2024-01-12',
    deliverableDescription: 'Trained support team and documentation',
    acceptanceCriteria: 'All team members passed certification',
    status: 'completed',
    completionPercentage: 100,
    assignedToUserId: 'user-1',
    assignedToName: 'John Smith',
    notes: 'Completed ahead of schedule',
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-12T15:30:00Z',
    tenantId: 'tenant-1',
  },
  {
    id: 'milestone-2',
    serviceContractId: '1',
    milestoneName: 'Q1 Business Review',
    description: 'Quarterly performance review and planning',
    sequenceNumber: 2,
    plannedDate: '2024-03-31',
    deliverableDescription: 'Performance report and Q2 action plan',
    acceptanceCriteria: 'Report delivered, action items documented',
    status: 'pending',
    completionPercentage: 0,
    assignedToUserId: 'user-2',
    assignedToName: 'Jane Doe',
    notes: 'Scheduled for Q1 end',
    dependencies: ['milestone-1'],
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z',
    tenantId: 'tenant-1',
  },
];

const mockIssues: ServiceContractIssueType[] = [
  {
    id: 'issue-1',
    serviceContractId: '2',
    issueTitle: 'Delayed Patch Deployment',
    issueDescription: 'February security patch not deployed within SLA window',
    severity: 'high',
    category: 'sla_breach',
    status: 'resolved',
    resolutionNotes: 'Patch deployed with corrective action implemented',
    resolutionDate: '2024-02-15',
    assignedToUserId: 'user-3',
    assignedToName: 'Mike Johnson',
    reportedDate: '2024-02-13',
    targetResolutionDate: '2024-02-15',
    impactDescription: 'Systems were at risk for 48 hours',
    createdAt: '2024-02-13T08:00:00Z',
    updatedAt: '2024-02-15T16:45:00Z',
    tenantId: 'tenant-1',
  },
];

/**
 * Service Contract Service (Mock Implementation)
 */
export const mockServiceContractService = {
  /**
   * Get service contracts with filtering and pagination
   */
  async getServiceContracts(filters: ServiceContractFilters = {}): Promise<PaginatedResponse<ServiceContractType>> {
    try {
      let filtered = [...mockServiceContracts];

      // Apply filters
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.contractNumber.toLowerCase().includes(search) ||
            c.title.toLowerCase().includes(search) ||
            c.customerName.toLowerCase().includes(search) ||
            c.description?.toLowerCase().includes(search)
        );
      }

      if (filters.status) {
        filtered = filtered.filter((c) => c.status === filters.status);
      }

      if (filters.serviceType) {
        filtered = filtered.filter((c) => c.serviceType === filters.serviceType);
      }

      if (filters.customerId) {
        filtered = filtered.filter((c) => c.customerId === filters.customerId);
      }

      if (filters.assignedTo) {
        filtered = filtered.filter((c) => c.assignedToUserId === filters.assignedTo);
      }

      if (filters.priority) {
        filtered = filtered.filter((c) => c.priority === filters.priority);
      }

      if (filters.approvalStatus) {
        filtered = filtered.filter((c) => c.approvalStatus === filters.approvalStatus);
      }

      if (filters.dateRange) {
        filtered = filtered.filter((c) => {
          const startDate = new Date(c.startDate);
          const rangeStart = new Date(filters.dateRange!.start);
          const rangeEnd = new Date(filters.dateRange!.end);
          return startDate >= rangeStart && startDate <= rangeEnd;
        });
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      filtered.sort((a, b) => {
        const aVal = (a as any)[sortBy];
        const bVal = (b as any)[sortBy];
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      // Apply pagination
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      return {
        data: filtered.slice(startIndex, endIndex),
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
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
    const contract = mockServiceContracts.find((c) => c.id === id);
    if (!contract) {
      throw new Error(`Service contract ${id} not found`);
    }
    return contract;
  },

  /**
   * Create service contract
   */
  async createServiceContract(data: ServiceContractCreateInput): Promise<ServiceContractType> {
    // Validate required fields
    if (!data.title || !data.customerId || !data.serviceType) {
      throw new Error('Required fields missing: title, customerId, serviceType');
    }

    if (data.value < 0 || data.value > 999999.99) {
      throw new Error('Value must be between 0 and 999999.99');
    }

    const newContract: ServiceContractType = {
      id: Math.random().toString(36).substr(2, 9),
      contractNumber: `SVC-${new Date().getFullYear()}-${String(mockServiceContracts.length + 1).padStart(3, '0')}`,
      title: data.title,
      description: data.description,
      customerId: data.customerId,
      customerName: data.customerName,
      productId: data.productId,
      productName: data.productName,
      serviceType: data.serviceType as any,
      status: 'draft',
      priority: (data.priority as any) || 'medium',
      value: data.value,
      currency: data.currency || 'USD',
      billingFrequency: data.billingFrequency as any,
      paymentTerms: data.paymentTerms,
      slaTerms: data.slaTerms,
      renewalTerms: data.renewalTerms,
      serviceScope: data.serviceScope,
      exclusions: data.exclusions,
      startDate: data.startDate,
      endDate: data.endDate,
      estimatedCompletionDate: data.estimatedCompletionDate,
      autoRenew: data.autoRenew || false,
      renewalPeriodMonths: data.renewalPeriodMonths,
      deliverySchedule: data.deliverySchedule,
      scheduledHoursPerWeek: data.scheduledHoursPerWeek,
      timeZone: data.timeZone,
      assignedToUserId: data.assignedToUserId,
      assignedToName: data.assignedToName,
      secondaryContactId: data.secondaryContactId,
      secondaryContactName: data.secondaryContactName,
      tags: data.tags,
      customFields: data.customFields,
      createdBy: 'current_user',
      createdAt: new Date().toISOString(),
      updatedBy: 'current_user',
      updatedAt: new Date().toISOString(),
      tenantId: 'tenant-1',
    };

    mockServiceContracts.push(newContract);
    return newContract;
  },

  /**
   * Update service contract
   */
  async updateServiceContract(id: string, data: ServiceContractUpdateInput): Promise<ServiceContractType> {
    const index = mockServiceContracts.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Service contract ${id} not found`);
    }

    const contract = mockServiceContracts[index];
    const updated: ServiceContractType = {
      ...contract,
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: 'current_user',
    };

    mockServiceContracts[index] = updated;
    return updated;
  },

  /**
   * Delete service contract
   */
  async deleteServiceContract(id: string): Promise<void> {
    const index = mockServiceContracts.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Service contract ${id} not found`);
    }
    mockServiceContracts.splice(index, 1);
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
    const contracts = mockServiceContracts;

    const stats: ServiceContractStats = {
      total: contracts.length,
      byStatus: {},
      byServiceType: {},
      activeContracts: 0,
      pendingApprovalContracts: 0,
      expiredContracts: 0,
      totalValue: 0,
      averageValue: 0,
      totalDocuments: mockDocuments.length,
      openIssues: mockIssues.filter((i) => i.status === 'open').length,
      upcomingMilestones: mockMilestones.filter((m) => m.status === 'pending').length,
    };

    contracts.forEach((c) => {
      // Status stats
      stats.byStatus[c.status] = (stats.byStatus[c.status] || 0) + 1;

      // Service type stats
      stats.byServiceType[c.serviceType] = (stats.byServiceType[c.serviceType] || 0) + 1;

      // Specific counts
      if (c.status === 'active') stats.activeContracts++;
      if (c.status === 'pending_approval') stats.pendingApprovalContracts++;
      if (c.status === 'expired') stats.expiredContracts++;

      // Value calculations
      stats.totalValue += c.value;
    });

    stats.averageValue = contracts.length > 0 ? stats.totalValue / contracts.length : 0;

    return stats;
  },

  /**
   * Get service contract documents
   */
  async getServiceContractDocuments(contractId: string): Promise<ServiceContractDocumentType[]> {
    return mockDocuments.filter((d) => d.serviceContractId === contractId);
  },

  /**
   * Add document to service contract
   */
  async addServiceContractDocument(data: ServiceContractDocumentCreateInput): Promise<ServiceContractDocumentType> {
    const doc: ServiceContractDocumentType = {
      id: Math.random().toString(36).substr(2, 9),
      serviceContractId: data.serviceContractId,
      fileName: data.fileName,
      fileType: data.fileType as any,
      fileSize: data.fileSize,
      filePath: data.filePath,
      documentType: data.documentType as any,
      uploadedByUserId: 'current_user',
      uploadedByName: 'Current User',
      description: data.description,
      tags: data.tags,
      isActive: true,
      versionNumber: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tenantId: 'tenant-1',
    };

    mockDocuments.push(doc);
    return doc;
  },

  /**
   * Get service delivery milestones
   */
  async getServiceDeliveryMilestones(contractId: string): Promise<ServiceDeliveryMilestoneType[]> {
    return mockMilestones.filter((m) => m.serviceContractId === contractId);
  },

  /**
   * Add milestone to service contract
   */
  async addServiceDeliveryMilestone(data: ServiceDeliveryMilestoneCreateInput): Promise<ServiceDeliveryMilestoneType> {
    const milestone: ServiceDeliveryMilestoneType = {
      id: Math.random().toString(36).substr(2, 9),
      serviceContractId: data.serviceContractId,
      milestoneName: data.milestoneName,
      description: data.description,
      sequenceNumber: data.sequenceNumber,
      plannedDate: data.plannedDate,
      deliverableDescription: data.deliverableDescription,
      acceptanceCriteria: data.acceptanceCriteria,
      status: 'pending',
      completionPercentage: 0,
      assignedToUserId: data.assignedToUserId,
      assignedToName: data.assignedToName,
      notes: data.notes,
      dependencies: data.dependencies,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tenantId: 'tenant-1',
    };

    mockMilestones.push(milestone);
    return milestone;
  },

  /**
   * Get service contract issues
   */
  async getServiceContractIssues(contractId: string): Promise<ServiceContractIssueType[]> {
    return mockIssues.filter((i) => i.serviceContractId === contractId);
  },

  /**
   * Add issue to service contract
   */
  async addServiceContractIssue(data: ServiceContractIssueCreateInput): Promise<ServiceContractIssueType> {
    const issue: ServiceContractIssueType = {
      id: Math.random().toString(36).substr(2, 9),
      serviceContractId: data.serviceContractId,
      issueTitle: data.issueTitle,
      issueDescription: data.issueDescription,
      severity: data.severity as any,
      category: data.category as any,
      status: 'open',
      assignedToUserId: data.assignedToUserId,
      assignedToName: data.assignedToName,
      reportedDate: new Date().toISOString().split('T')[0],
      targetResolutionDate: data.targetResolutionDate,
      impactDescription: data.impactDescription,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tenantId: 'tenant-1',
    };

    mockIssues.push(issue);
    return issue;
  },

  /**
   * Export service contracts
   */
  async exportServiceContracts(format: 'csv' | 'json' = 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(mockServiceContracts, null, 2);
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
    const rows = mockServiceContracts.map((c) => [
      c.id,
      c.contractNumber,
      c.title,
      c.customerName,
      c.serviceType,
      c.status,
      c.value,
      c.startDate,
      c.endDate,
      c.assignedToName || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\r\n');

    return csv;
  },

  /**
   * Bulk update service contracts
   */
  async bulkUpdateServiceContracts(ids: string[], updates: ServiceContractUpdateInput): Promise<ServiceContractType[]> {
    return ids.map((id) => {
      const index = mockServiceContracts.findIndex((c) => c.id === id);
      if (index !== -1) {
        mockServiceContracts[index] = {
          ...mockServiceContracts[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return mockServiceContracts[index];
    });
  },

  /**
   * Bulk delete service contracts
   */
  async bulkDeleteServiceContracts(ids: string[]): Promise<void> {
    ids.forEach((id) => {
      const index = mockServiceContracts.findIndex((c) => c.id === id);
      if (index !== -1) {
        mockServiceContracts.splice(index, 1);
      }
    });
  },
};
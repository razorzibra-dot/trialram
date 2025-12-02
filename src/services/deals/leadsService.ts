import { LeadDTO, CreateLeadDTO, UpdateLeadDTO, LeadFiltersDTO, LeadListResponseDTO, LeadConversionMetricsDTO } from '@/types/dtos';
import { authService } from '../serviceFactory';

/**
 * Leads Service - Mock Implementation
 * Manages sales leads and prospect data
 */
class MockLeadsService {
  private baseUrl = '/api/leads';

  // Mock data for demonstration
  private mockLeads: LeadDTO[] = [
    {
      id: 'lead_1',
      firstName: 'John',
      lastName: 'Smith',
      companyName: 'TechCorp Inc.',
      email: 'john.smith@techcorp.com',
      phone: '+1-555-0101',
      mobile: '+1-555-0102',
      source: 'website',
      campaign: 'Q1_Digital_Campaign',
      leadScore: 75,
      qualificationStatus: 'qualified',
      industry: 'Technology',
      companySize: 'medium',
      jobTitle: 'CTO',
      budgetRange: '$50K-$100K',
      timeline: '3-6 months',
      status: 'qualified',
      stage: 'consideration',
      assignedTo: 'user_2',
      assignedToName: 'Sarah Johnson',
      convertedToCustomer: false,
      notes: 'High-potential lead from website inquiry. Interested in our enterprise solution.',
      nextFollowUp: '2024-02-15T10:00:00Z',
      lastContact: '2024-01-28T14:30:00Z',
      tenantId: 'tenant_1',
      audit: {
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-28T14:30:00Z',
        createdBy: 'user_1',
        updatedBy: 'user_1',
        version: 1
      }
    },
    {
      id: 'lead_2',
      firstName: 'Jane',
      lastName: 'Doe',
      companyName: 'Manufacturing Plus',
      email: 'jane.doe@manufacturingplus.com',
      phone: '+1-555-0201',
      source: 'referral',
      campaign: 'Partner_Referral_Program',
      leadScore: 60,
      qualificationStatus: 'contacted',
      industry: 'Manufacturing',
      companySize: 'large',
      jobTitle: 'Operations Manager',
      budgetRange: '$25K-$50K',
      timeline: '6-12 months',
      status: 'contacted',
      stage: 'interest',
      assignedTo: 'user_3',
      assignedToName: 'Mike Chen',
      convertedToCustomer: false,
      notes: 'Referred by existing customer. Needs to evaluate ROI before proceeding.',
      nextFollowUp: '2024-02-10T09:00:00Z',
      lastContact: '2024-01-25T16:45:00Z',
      tenantId: 'tenant_1',
      audit: {
        createdAt: '2024-01-20T11:15:00Z',
        updatedAt: '2024-01-25T16:45:00Z',
        createdBy: 'user_1',
        updatedBy: 'user_1',
        version: 1
      }
    },
    {
      id: 'lead_3',
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob.wilson@email.com',
      phone: '+1-555-0301',
      source: 'cold_call',
      leadScore: 25,
      qualificationStatus: 'new',
      industry: 'Retail',
      companySize: 'small',
      jobTitle: 'Owner',
      budgetRange: 'Under $25K',
      timeline: '1-3 months',
      status: 'new',
      stage: 'awareness',
      assignedTo: 'user_2',
      assignedToName: 'Sarah Johnson',
      convertedToCustomer: false,
      notes: 'Initial cold call. Showed mild interest but needs more information.',
      nextFollowUp: '2024-02-05T14:00:00Z',
      tenantId: 'tenant_1',
      audit: {
        createdAt: '2024-01-28T09:30:00Z',
        updatedAt: '2024-01-28T09:30:00Z',
        createdBy: 'user_2',
        updatedBy: 'user_2',
        version: 1
      }
    }
  ];

  /**
   * Get all leads with optional filtering
   */
  async getLeads(filters?: LeadFiltersDTO): Promise<LeadListResponseDTO> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let leads = this.mockLeads.filter(lead => lead.tenantId === user.tenantId);

    // Apply role-based filtering
    if (user.role === 'agent') {
      leads = leads.filter(lead => lead.assignedTo === user.id);
    }

    // Apply filters
    if (filters) {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        leads = leads.filter(lead =>
          lead.firstName?.toLowerCase().includes(search) ||
          lead.lastName?.toLowerCase().includes(search) ||
          lead.companyName?.toLowerCase().includes(search) ||
          lead.email?.toLowerCase().includes(search)
        );
      }

      if (filters.email) {
        leads = leads.filter(lead => lead.email === filters.email);
      }

      if (filters.companyName) {
        leads = leads.filter(lead => lead.companyName?.toLowerCase().includes(filters.companyName.toLowerCase()));
      }

      if (filters.source) {
        leads = leads.filter(lead => lead.source === filters.source);
      }

      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        leads = leads.filter(lead => statuses.includes(lead.status));
      }

      if (filters.qualificationStatus) {
        const qualStatuses = Array.isArray(filters.qualificationStatus) ? filters.qualificationStatus : [filters.qualificationStatus];
        leads = leads.filter(lead => qualStatuses.includes(lead.qualificationStatus));
      }

      if (filters.stage) {
        const stages = Array.isArray(filters.stage) ? filters.stage : [filters.stage];
        leads = leads.filter(lead => stages.includes(lead.stage));
      }

      if (filters.assignedTo) {
        leads = leads.filter(lead => lead.assignedTo === filters.assignedTo);
      }

      if (filters.industry) {
        leads = leads.filter(lead => lead.industry === filters.industry);
      }

      if (filters.leadScoreMin !== undefined) {
        leads = leads.filter(lead => lead.leadScore >= filters.leadScoreMin!);
      }

      if (filters.leadScoreMax !== undefined) {
        leads = leads.filter(lead => lead.leadScore <= filters.leadScoreMax!);
      }

      if (filters.convertedToCustomer !== undefined) {
        leads = leads.filter(lead => lead.convertedToCustomer === filters.convertedToCustomer);
      }

      if (filters.dateRange) {
        leads = leads.filter(lead => {
          const createdAt = new Date(lead.audit.createdAt);
          const from = new Date(filters.dateRange!.from);
          const to = new Date(filters.dateRange!.to);
          return createdAt >= from && createdAt <= to;
        });
      }
    }

    // Sorting
    const sortBy = filters?.sortBy || 'createdAt';
    const sortDirection = filters?.sortDirection || 'desc';

    leads.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'leadScore':
          aValue = a.leadScore;
          bValue = b.leadScore;
          break;
        case 'companyName':
          aValue = a.companyName || '';
          bValue = b.companyName || '';
          break;
        case 'nextFollowUp':
          aValue = a.nextFollowUp ? new Date(a.nextFollowUp).getTime() : 0;
          bValue = b.nextFollowUp ? new Date(b.nextFollowUp).getTime() : 0;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.audit.createdAt).getTime();
          bValue = new Date(b.audit.createdAt).getTime();
          break;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedLeads = leads.slice(startIndex, endIndex);

    return {
      data: paginatedLeads,
      page,
      pageSize,
      total: leads.length,
      totalPages: Math.ceil(leads.length / pageSize),
      hasNextPage: page < Math.ceil(leads.length / pageSize),
      hasPreviousPage: page > 1
    };
  }

  /**
   * Get a single lead by ID
   */
  async getLead(id: string): Promise<LeadDTO> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const lead = this.mockLeads.find(lead =>
      lead.id === id && lead.tenantId === user.tenantId
    );

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Check permissions
    if (user.role === 'agent' && lead.assignedTo !== user.id) {
      throw new Error('Access denied');
    }

    return lead;
  }

  /**
   * Create a new lead
   */
  async createLead(leadData: CreateLeadDTO): Promise<LeadDTO> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    // Validate required fields
    if (!leadData.email && !leadData.phone && !leadData.companyName) {
      throw new Error('At least one contact method (email, phone) or company name is required');
    }

    const newLead: LeadDTO = {
      id: `lead_${Date.now()}`,
      ...leadData,
      leadScore: leadData.leadScore || 0,
      qualificationStatus: leadData.qualificationStatus || 'new',
      status: leadData.status || 'new',
      stage: leadData.stage || 'awareness',
      convertedToCustomer: false,
      tenantId: user.tenantId,
      audit: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.id,
        updatedBy: user.id,
        version: 1
      }
    };

    this.mockLeads.push(newLead);
    return newLead;
  }

  /**
   * Update an existing lead
   */
  async updateLead(id: string, updates: UpdateLeadDTO): Promise<LeadDTO> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const leadIndex = this.mockLeads.findIndex(lead =>
      lead.id === id && lead.tenantId === user.tenantId
    );

    if (leadIndex === -1) {
      throw new Error('Lead not found');
    }

    // Check permissions
    if (user.role === 'agent' && this.mockLeads[leadIndex].assignedTo !== user.id) {
      throw new Error('Access denied');
    }

    this.mockLeads[leadIndex] = {
      ...this.mockLeads[leadIndex],
      ...updates,
      audit: {
        ...this.mockLeads[leadIndex].audit,
        updatedAt: new Date().toISOString()
      }
    };

    return this.mockLeads[leadIndex];
  }

  /**
   * Delete a lead
   */
  async deleteLead(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('delete')) {
      throw new Error('Insufficient permissions');
    }

    const leadIndex = this.mockLeads.findIndex(lead =>
      lead.id === id && lead.tenantId === user.tenantId
    );

    if (leadIndex === -1) {
      throw new Error('Lead not found');
    }

    this.mockLeads.splice(leadIndex, 1);
  }

  /**
   * Convert lead to customer
   */
  async convertToCustomer(id: string, customerId: string): Promise<LeadDTO> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const leadIndex = this.mockLeads.findIndex(lead =>
      lead.id === id && lead.tenantId === user.tenantId
    );

    if (leadIndex === -1) {
      throw new Error('Lead not found');
    }

    this.mockLeads[leadIndex] = {
      ...this.mockLeads[leadIndex],
      convertedToCustomer: true,
      convertedCustomerId: customerId,
      convertedAt: new Date().toISOString(),
      status: 'converted',
      audit: {
        ...this.mockLeads[leadIndex].audit,
        updatedAt: new Date().toISOString()
      }
    };

    return this.mockLeads[leadIndex];
  }

  /**
   * Calculate lead score based on various criteria
   */
  private calculateLeadScore(lead: Partial<LeadDTO>): number {
    let score = 0;

    // Email presence (+10)
    if (lead.email) score += 10;

    // Phone presence (+10)
    if (lead.phone) score += 10;

    // Company name presence (+15)
    if (lead.companyName) score += 15;

    // Job title presence (+10)
    if (lead.jobTitle) score += 10;

    // Industry specified (+5)
    if (lead.industry) score += 5;

    // Company size specified (+5)
    if (lead.companySize) score += 5;

    // Budget range specified (+10)
    if (lead.budgetRange) score += 10;

    // Timeline specified (+10)
    if (lead.timeline) score += 10;

    // Source scoring
    switch (lead.source) {
      case 'referral':
        score += 25;
        break;
      case 'website':
        score += 20;
        break;
      case 'event':
        score += 15;
        break;
      case 'cold_call':
        score += 5;
        break;
      default:
        score += 0;
    }

    // Qualification status scoring
    switch (lead.qualificationStatus) {
      case 'qualified':
        score += 30;
        break;
      case 'contacted':
        score += 15;
        break;
      case 'new':
        score += 5;
        break;
      default:
        score += 0;
    }

    // Stage scoring
    switch (lead.stage) {
      case 'purchase':
        score += 40;
        break;
      case 'evaluation':
        score += 30;
        break;
      case 'consideration':
        score += 20;
        break;
      case 'interest':
        score += 15;
        break;
      case 'awareness':
        score += 5;
        break;
      default:
        score += 0;
    }

    // Company size scoring
    switch (lead.companySize) {
      case 'enterprise':
        score += 20;
        break;
      case 'large':
        score += 15;
        break;
      case 'medium':
        score += 10;
        break;
      case 'small':
        score += 5;
        break;
      case 'startup':
        score += 5;
        break;
      default:
        score += 0;
    }

    // Budget range scoring
    switch (lead.budgetRange) {
      case 'over_500k':
        score += 25;
        break;
      case '250k_500k':
        score += 20;
        break;
      case '100k_250k':
        score += 15;
        break;
      case '50k_100k':
        score += 10;
        break;
      case '25k_50k':
        score += 5;
        break;
      default:
        score += 0;
    }

    // Timeline scoring (sooner is better)
    switch (lead.timeline) {
      case 'immediate':
        score += 20;
        break;
      case '1_3_months':
        score += 15;
        break;
      case '3_6_months':
        score += 10;
        break;
      case '6_12_months':
        score += 5;
        break;
      default:
        score += 0;
    }

    // Cap at 100
    return Math.min(score, 100);
  }

  /**
   * Auto-calculate and update lead score
   */
  async autoCalculateLeadScore(id: string): Promise<LeadDTO> {
    const lead = await this.getLead(id);
    const calculatedScore = this.calculateLeadScore(lead);
    return this.updateLeadScore(id, calculatedScore);
  }

  /**
   * Update lead score
   */
  async updateLeadScore(id: string, score: number): Promise<LeadDTO> {
    if (score < 0 || score > 100) {
      throw new Error('Lead score must be between 0 and 100');
    }

    return this.updateLead(id, { leadScore: score });
  }

  /**
   * Get lead conversion metrics
   */
  async getConversionMetrics(): Promise<LeadConversionMetricsDTO> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const tenantLeads = this.mockLeads.filter(lead => lead.tenantId === user.tenantId);

    const totalLeads = tenantLeads.length;
    const qualifiedLeads = tenantLeads.filter(lead => lead.qualificationStatus === 'qualified').length;
    const convertedLeads = tenantLeads.filter(lead => lead.convertedToCustomer).length;

    // Calculate conversion time (simplified)
    const convertedLeadsWithTime = tenantLeads.filter(lead => lead.convertedToCustomer && lead.convertedAt);
    const averageConversionTime = convertedLeadsWithTime.length > 0
      ? convertedLeadsWithTime.reduce((sum, lead) => {
          const created = new Date(lead.audit.createdAt).getTime();
          const converted = new Date(lead.convertedAt!).getTime();
          return sum + (converted - created);
        }, 0) / convertedLeadsWithTime.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // Source distribution
    const sourceCounts: Record<string, number> = {};
    tenantLeads.forEach(lead => {
      const source = lead.source || 'unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    // Stage distribution
    const stageCounts: Record<string, number> = {};
    tenantLeads.forEach(lead => {
      stageCounts[lead.stage] = (stageCounts[lead.stage] || 0) + 1;
    });

    return {
      totalLeads,
      qualifiedLeads,
      convertedLeads,
      conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
      averageConversionTime,
      bySource: sourceCounts,
      byStage: stageCounts
    };
  }

  /**
   * Bulk update leads
   */
  async bulkUpdateLeads(ids: string[], updates: UpdateLeadDTO): Promise<LeadDTO[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const updatedLeads: LeadDTO[] = [];

    for (const id of ids) {
      try {
        const updatedLead = await this.updateLead(id, updates);
        updatedLeads.push(updatedLead);
      } catch (error) {
        // Skip leads that can't be updated
        console.warn(`Failed to update lead ${id}:`, error);
      }
    }

    return updatedLeads;
  }

  /**
   * Auto-assign lead based on assignment rules
   */
  async autoAssignLead(id: string): Promise<LeadDTO> {
    const lead = await this.getLead(id);

    // Get available users for assignment (sales reps and managers)
    const availableUsers = await this.getAvailableAssignees(lead.tenantId);

    if (availableUsers.length === 0) {
      throw new Error('No available users for lead assignment');
    }

    // Apply assignment rules
    const assignedUserId = this.applyAssignmentRules(lead, availableUsers);

    return this.updateLead(id, {
      assignedTo: assignedUserId
    });
  }

  /**
   * Get available users for lead assignment
   */
  private async getAvailableAssignees(tenantId: string): Promise<Array<{id: string; name: string; workload: number}>> {
    // In a real implementation, this would query the user service
    // For now, return mock data
    return [
      { id: 'user_1', name: 'John Doe', workload: 5 },
      { id: 'user_2', name: 'Sarah Johnson', workload: 3 },
      { id: 'user_3', name: 'Mike Chen', workload: 7 }
    ];
  }

  /**
   * Apply assignment rules to determine the best assignee
   */
  private applyAssignmentRules(lead: LeadDTO, availableUsers: Array<{id: string; name: string; workload: number}>): string {
    // Rule 1: Round-robin assignment (simplest approach)
    // In a real implementation, this could be more sophisticated:
    // - Geographic assignment based on lead location
    // - Expertise-based assignment based on industry
    // - Workload balancing
    // - Skill-based matching

    // For now, use round-robin with workload consideration
    const sortedUsers = availableUsers.sort((a, b) => a.workload - b.workload);
    return sortedUsers[0].id;
  }

  /**
   * Bulk assign leads based on rules
   */
  async bulkAutoAssignLeads(ids: string[]): Promise<LeadDTO[]> {
    const updatedLeads: LeadDTO[] = [];

    for (const id of ids) {
      try {
        const updatedLead = await this.autoAssignLead(id);
        updatedLeads.push(updatedLead);
      } catch (error) {
        console.warn(`Failed to auto-assign lead ${id}:`, error);
      }
    }

    return updatedLeads;
  }

  /**
   * Export leads
   */
  async exportLeads(format: 'csv' | 'json' = 'csv'): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let leads = this.mockLeads.filter(lead => lead.tenantId === user.tenantId);

    // Apply role-based filtering
    if (user.role === 'agent') {
      leads = leads.filter(lead => lead.assignedTo === user.id);
    }

    if (format === 'csv') {
      const headers = [
        'ID', 'First Name', 'Last Name', 'Company', 'Email', 'Phone',
        'Source', 'Lead Score', 'Status', 'Stage', 'Assigned To', 'Created At'
      ];

      const rows = leads.map(lead => [
        lead.id,
        lead.firstName || '',
        lead.lastName || '',
        lead.companyName || '',
        lead.email || '',
        lead.phone || '',
        lead.source || '',
        lead.leadScore.toString(),
        lead.status,
        lead.stage,
        lead.assignedToName || '',
        lead.audit.createdAt
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return csvContent;
    } else {
      return JSON.stringify(leads, null, 2);
    }
  }
}

export const mockLeadsService = new MockLeadsService();
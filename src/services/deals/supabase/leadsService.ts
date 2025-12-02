import { supabase } from '@/services/supabase/client';
import { LeadDTO, CreateLeadDTO, UpdateLeadDTO, LeadFiltersDTO, LeadListResponseDTO, LeadConversionMetricsDTO } from '@/types/dtos';
import { authService } from '../../serviceFactory';

/**
 * Leads Service - Supabase Implementation
 * Manages sales leads and prospect data with database operations
 */
class SupabaseLeadsService {
  private tableName = 'leads';

  /**
   * Get all leads with optional filtering
   */
  async getLeads(filters?: LeadFiltersDTO): Promise<LeadListResponseDTO> {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        assigned_to_user:users!leads_assigned_to_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters) {
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters.email) {
        query = query.eq('email', filters.email);
      }

      if (filters.companyName) {
        query = query.ilike('company_name', `%${filters.companyName}%`);
      }

      if (filters.source) {
        query = query.eq('source', filters.source);
      }

      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        query = query.in('status', statuses);
      }

      if (filters.qualificationStatus) {
        const qualStatuses = Array.isArray(filters.qualificationStatus) ? filters.qualificationStatus : [filters.qualificationStatus];
        query = query.in('qualification_status', qualStatuses);
      }

      if (filters.stage) {
        const stages = Array.isArray(filters.stage) ? filters.stage : [filters.stage];
        query = query.in('stage', stages);
      }

      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      if (filters.industry) {
        query = query.eq('industry', filters.industry);
      }

      if (filters.leadScoreMin !== undefined) {
        query = query.gte('lead_score', filters.leadScoreMin);
      }

      if (filters.leadScoreMax !== undefined) {
        query = query.lte('lead_score', filters.leadScoreMax);
      }

      if (filters.convertedToCustomer !== undefined) {
        query = query.eq('converted_to_customer', filters.convertedToCustomer);
      }

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.from)
          .lte('created_at', filters.dateRange.to);
      }
    }

    // Sorting
    const sortBy = filters?.sortBy || 'created_at';
    const sortDirection = filters?.sortDirection || 'desc';

    // Map sort field names
    const sortFieldMap: Record<string, string> = {
      'createdAt': 'created_at',
      'leadScore': 'lead_score',
      'companyName': 'company_name',
      'nextFollowUp': 'next_follow_up'
    };

    const dbSortField = sortFieldMap[sortBy] || sortBy;
    query = query.order(dbSortField, { ascending: sortDirection === 'asc' });

    // Pagination
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch leads: ${error.message}`);
    }

    const leads: LeadDTO[] = (data || []).map(row => this.mapLeadRow(row));

    const totalPages = Math.ceil((count || 0) / pageSize);

    return {
      data: leads,
      page,
      pageSize,
      total: count || 0,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };
  }

  /**
   * Get a single lead by ID
   */
  async getLead(id: string): Promise<LeadDTO> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        assigned_to_user:users!leads_assigned_to_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch lead: ${error.message}`);
    }

    if (!data) {
      throw new Error('Lead not found');
    }

    return this.mapLeadRow(data);
  }

  /**
   * Create a new lead
   */
  async createLead(leadData: CreateLeadDTO): Promise<LeadDTO> {
    // Validate required fields
    if (!leadData.email && !leadData.phone && !leadData.companyName) {
      throw new Error('At least one contact method (email, phone) or company name is required');
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .insert([{
        first_name: leadData.firstName,
        last_name: leadData.lastName,
        company_name: leadData.companyName,
        email: leadData.email,
        phone: leadData.phone,
        mobile: leadData.mobile,
        source: leadData.source,
        campaign: leadData.campaign,
        lead_score: leadData.leadScore || 0,
        qualification_status: leadData.qualificationStatus || 'new',
        industry: leadData.industry,
        company_size: leadData.companySize,
        job_title: leadData.jobTitle,
        budget_range: leadData.budgetRange,
        timeline: leadData.timeline,
        status: leadData.status || 'new',
        stage: leadData.stage || 'awareness',
        assigned_to: leadData.assignedTo,
        notes: leadData.notes,
        next_follow_up: leadData.nextFollowUp
      }])
      .select(`
        *,
        assigned_to_user:users!leads_assigned_to_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create lead: ${error.message}`);
    }

    return this.mapLeadRow(data);
  }

  /**
   * Update an existing lead
   */
  async updateLead(id: string, updates: UpdateLeadDTO): Promise<LeadDTO> {
    const updateData: any = {};

    if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.companyName !== undefined) updateData.company_name = updates.companyName;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.mobile !== undefined) updateData.mobile = updates.mobile;
    if (updates.source !== undefined) updateData.source = updates.source;
    if (updates.campaign !== undefined) updateData.campaign = updates.campaign;
    if (updates.leadScore !== undefined) updateData.lead_score = updates.leadScore;
    if (updates.qualificationStatus !== undefined) updateData.qualification_status = updates.qualificationStatus;
    if (updates.industry !== undefined) updateData.industry = updates.industry;
    if (updates.companySize !== undefined) updateData.company_size = updates.companySize;
    if (updates.jobTitle !== undefined) updateData.job_title = updates.jobTitle;
    if (updates.budgetRange !== undefined) updateData.budget_range = updates.budgetRange;
    if (updates.timeline !== undefined) updateData.timeline = updates.timeline;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.stage !== undefined) updateData.stage = updates.stage;
    if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo;
    if (updates.convertedToCustomer !== undefined) updateData.converted_to_customer = updates.convertedToCustomer;
    if (updates.convertedCustomerId !== undefined) updateData.converted_customer_id = updates.convertedCustomerId;
    if (updates.convertedAt !== undefined) updateData.converted_at = updates.convertedAt;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.nextFollowUp !== undefined) updateData.next_follow_up = updates.nextFollowUp;
    if (updates.lastContact !== undefined) updateData.last_contact = updates.lastContact;

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        assigned_to_user:users!leads_assigned_to_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update lead: ${error.message}`);
    }

    return this.mapLeadRow(data);
  }

  /**
   * Delete a lead
   */
  async deleteLead(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete lead: ${error.message}`);
    }
  }

  /**
   * Convert lead to customer
   */
  async convertToCustomer(id: string, customerId: string): Promise<LeadDTO> {
    return this.updateLead(id, {
      convertedToCustomer: true,
      convertedCustomerId: customerId,
      convertedAt: new Date().toISOString(),
      status: 'converted'
    });
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
    // Get all leads for current tenant
    const { data: leads, error } = await supabase
      .from(this.tableName)
      .select('qualification_status, stage, converted_to_customer, created_at, converted_at, source');

    if (error) {
      throw new Error(`Failed to fetch conversion metrics: ${error.message}`);
    }

    const totalLeads = leads?.length || 0;
    const qualifiedLeads = leads?.filter(lead => lead.qualification_status === 'qualified').length || 0;
    const convertedLeads = leads?.filter(lead => lead.converted_to_customer).length || 0;

    // Calculate average conversion time
    const convertedLeadsWithTime = leads?.filter(lead => lead.converted_to_customer && lead.converted_at) || [];
    const averageConversionTime = convertedLeadsWithTime.length > 0
      ? convertedLeadsWithTime.reduce((sum, lead) => {
          const created = new Date(lead.created_at).getTime();
          const converted = new Date(lead.converted_at).getTime();
          return sum + (converted - created);
        }, 0) / convertedLeadsWithTime.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // Source distribution
    const sourceCounts: Record<string, number> = {};
    leads?.forEach(lead => {
      const source = lead.source || 'unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    // Stage distribution
    const stageCounts: Record<string, number> = {};
    leads?.forEach(lead => {
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
    const updatePromises = ids.map(id => this.updateLead(id, updates));
    return Promise.all(updatePromises);
  }

  /**
   * Export leads
   */
  async exportLeads(format: 'csv' | 'json' = 'csv'): Promise<string> {
    const { data: leads, error } = await supabase
      .from(this.tableName)
      .select(`
        id, first_name, last_name, company_name, email, phone,
        source, lead_score, status, stage, assigned_to_user(id, first_name, last_name, email), created_at
      `);

    if (error) {
      throw new Error(`Failed to export leads: ${error.message}`);
    }

    if (format === 'csv') {
      const headers = [
        'ID', 'First Name', 'Last Name', 'Company', 'Email', 'Phone',
        'Source', 'Lead Score', 'Status', 'Stage', 'Assigned To', 'Created At'
      ];

      const rows = (leads || []).map(lead => [
        lead.id,
        lead.first_name || '',
        lead.last_name || '',
        lead.company_name || '',
        lead.email || '',
        lead.phone || '',
        lead.source || '',
        lead.lead_score?.toString() || '0',
        lead.status,
        lead.stage,
        lead.assigned_to_user ? `${(lead.assigned_to_user as any).first_name} ${(lead.assigned_to_user as any).last_name}` : '',
        lead.created_at
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

  /**
   * Map database row to LeadDTO
   */
  private mapLeadRow(row: any): LeadDTO {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      companyName: row.company_name,
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      source: row.source,
      campaign: row.campaign,
      leadScore: row.lead_score || 0,
      qualificationStatus: row.qualification_status || 'new',
      industry: row.industry,
      companySize: row.company_size,
      jobTitle: row.job_title,
      budgetRange: row.budget_range,
      timeline: row.timeline,
      status: row.status || 'new',
      stage: row.stage || 'awareness',
      assignedTo: row.assigned_to,
      assignedToName: row.assigned_to_user
        ? `${row.assigned_to_user.first_name} ${row.assigned_to_user.last_name}`.trim()
        : undefined,
      convertedToCustomer: row.converted_to_customer || false,
      convertedCustomerId: row.converted_customer_id,
      convertedAt: row.converted_at,
      notes: row.notes,
      nextFollowUp: row.next_follow_up,
      lastContact: row.last_contact,
      tenantId: row.tenant_id,
      audit: {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        version: row.version || 1
      }
    };
  }
}

export const supabaseLeadsService = new SupabaseLeadsService();
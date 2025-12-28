/**
 * Supabase Leads Service
 * Handles lead operations via Supabase PostgreSQL
 * 
 * ✅ Consistent with deals service pattern
 * ✅ Proper 8-layer sync with database schema
 * ✅ Uses explicit field mapping (no spread operators)
 * 
 * Database Schema (leads table):
 * - id, first_name, last_name, company_name, email, phone, mobile
 * - source, campaign, lead_score, qualification_status
 * - industry, company_size, job_title, budget_range, timeline
 * - status, stage
 * - assigned_to (NO stored assigned_to_name - virtual via JOIN)
 * - converted_to_customer, converted_customer_id, converted_at
 * - notes, next_follow_up, last_contact
 * - tenant_id, created_at, updated_at, created_by, updated_by
 * 
 * ✅ NOW HAS updated_by column (synchronized with deals)
 * ✅ assigned_to_name IS VIRTUAL (via JOIN with users) - consistent with deals
 */

import { supabase } from '@/services/supabase/client';
import { LeadDTO, CreateLeadDTO, UpdateLeadDTO, LeadFiltersDTO, LeadListResponseDTO, LeadConversionMetricsDTO } from '@/types/dtos';
import { authService, customerService } from '../../serviceFactory';
import { mapLeadToCustomerCreateInput } from '../utils/leadToCustomerMapper';
import backendConfig from '@/config/backendConfig';
import { roleService } from '@/services/roleService';

class SupabaseLeadsService {
  private table = 'leads';

  /**
   * Get tenant ID from user with null-safety
   */
  private getTenantId(user: any): string | null {
    return user.tenant_id || user.tenantId || null;
  }

  /**
   * Add tenant filter to query if user has a tenant
   */
  private addTenantFilter(query: any, tenantId: string | null): any {
    if (tenantId) {
      return query.eq('tenant_id', tenantId);
    }
    return query;
  }

  /**
   * Transform database snake_case to TypeScript camelCase
   * ✅ Maps 'leads' table columns correctly
   * ✅ Handles joined user data for assigned_to_name (virtual field)
   * ✅ Handles joined user data for created_by and updated_by names
   */
  private toTypeScript(dbLead: any): LeadDTO {
    // DEBUG: Log raw database response
    console.log('[LeadsService] Raw DB lead data:', {
      id: dbLead.id,
      created_by: dbLead.created_by,
      created_by_user: dbLead.created_by_user,
      updated_by: dbLead.updated_by,
      updated_by_user: dbLead.updated_by_user,
      assigned_to: dbLead.assigned_to,
      assigned_to_user: dbLead.assigned_to_user,
      allKeys: Object.keys(dbLead)
    });

    // Extract assigned user name from joined data only (now virtual via JOIN)
    const assignedToName = dbLead.assigned_to_user?.name 
      || `${dbLead.assigned_to_user?.first_name || ''} ${dbLead.assigned_to_user?.last_name || ''}`.trim()
      || '';

    // Extract created by user name - prefer stored database column to avoid RLS issues
    const createdByName = dbLead.created_by_name  // ✅ Database column (denormalized)
      || dbLead.created_by_user?.name  // Fallback: from JOIN (if RLS allows)
      || `${dbLead.created_by_user?.first_name || ''} ${dbLead.created_by_user?.last_name || ''}`.trim()
      || dbLead.created_by  // Fallback: UUID
      || '';

    // Extract updated by user name - prefer stored database column to avoid RLS issues
    const updatedByName = dbLead.updated_by_name  // ✅ Database column (denormalized)
      || dbLead.updated_by_user?.name  // Fallback: from JOIN (if RLS allows)
      || `${dbLead.updated_by_user?.first_name || ''} ${dbLead.updated_by_user?.last_name || ''}`.trim()
      || dbLead.updated_by  // Fallback: UUID
      || '';

    console.log('[LeadsService] Extracted names:', {
      assignedToName,
      createdByName,
      updatedByName,
      createdBySourced: dbLead.created_by_name ? 'database' : 'fallback',
      updatedBySourced: dbLead.updated_by_name ? 'database' : 'fallback'
    });

    return {
      id: dbLead.id,
      firstName: dbLead.first_name,
      lastName: dbLead.last_name,
      companyName: dbLead.company_name,
      email: dbLead.email,
      phone: dbLead.phone,
      mobile: dbLead.mobile,
      source: dbLead.source,
      campaign: dbLead.campaign,
      leadScore: dbLead.lead_score || 0,
      qualificationStatus: dbLead.qualification_status || 'new',
      industry: dbLead.industry,
      companySize: dbLead.company_size,
      jobTitle: dbLead.job_title,
      budgetRange: dbLead.budget_range,
      timeline: dbLead.timeline,
      status: dbLead.status || 'new',
      stage: dbLead.stage || 'awareness',
      assignedTo: dbLead.assigned_to,
      assignedToName,
      convertedToCustomer: dbLead.converted_to_customer || false,
      convertedCustomerId: dbLead.converted_customer_id,
      convertedAt: dbLead.converted_at,
      notes: dbLead.notes,
      nextFollowUp: dbLead.next_follow_up,
      lastContact: dbLead.last_contact,
      tenantId: dbLead.tenant_id,
      audit: {
        createdAt: dbLead.created_at,
        updatedAt: dbLead.updated_at,
        createdBy: dbLead.created_by,
        createdByName, // ✅ User name for created_by
        updatedBy: dbLead.updated_by,
        updatedByName, // ✅ User name for updated_by
        version: 1
      }
    };
  }

  /**
   * Transform TypeScript camelCase to database snake_case
   * ✅ EXPLICIT FIELD MAPPING - Only includes columns that exist in leads table
   * ✅ Excludes: id (for create), assigned_to_name (virtual via JOIN)
   */
  private toDatabase(lead: Partial<CreateLeadDTO | UpdateLeadDTO>, isCreate: boolean = false): any {
    const dbLead: any = {};
    
    // Map only defined database columns
    if (lead.firstName !== undefined) dbLead.first_name = lead.firstName;
    if (lead.lastName !== undefined) dbLead.last_name = lead.lastName;
    if (lead.companyName !== undefined) dbLead.company_name = lead.companyName;
    if (lead.email !== undefined) dbLead.email = lead.email;
    if (lead.phone !== undefined) dbLead.phone = lead.phone;
    if (lead.mobile !== undefined) dbLead.mobile = lead.mobile;
    if (lead.source !== undefined) dbLead.source = lead.source;
    if (lead.campaign !== undefined) dbLead.campaign = lead.campaign;
    if (lead.leadScore !== undefined) dbLead.lead_score = lead.leadScore;
    if (lead.qualificationStatus !== undefined) dbLead.qualification_status = lead.qualificationStatus;
    if (lead.industry !== undefined) dbLead.industry = lead.industry;
    if (lead.companySize !== undefined) dbLead.company_size = lead.companySize;
    if (lead.jobTitle !== undefined) dbLead.job_title = lead.jobTitle;
    if (lead.budgetRange !== undefined) dbLead.budget_range = lead.budgetRange;
    if (lead.timeline !== undefined) dbLead.timeline = lead.timeline;
    if (lead.status !== undefined) dbLead.status = lead.status;
    if (lead.stage !== undefined) dbLead.stage = lead.stage;
    if (lead.assignedTo !== undefined) dbLead.assigned_to = lead.assignedTo;
    if (lead.notes !== undefined) dbLead.notes = lead.notes;
    if (lead.nextFollowUp !== undefined) dbLead.next_follow_up = lead.nextFollowUp;
    
    // Update-only fields
    if (!isCreate) {
      if ((lead as UpdateLeadDTO).convertedToCustomer !== undefined) {
        dbLead.converted_to_customer = (lead as UpdateLeadDTO).convertedToCustomer;
      }
      if ((lead as UpdateLeadDTO).convertedCustomerId !== undefined) {
        dbLead.converted_customer_id = (lead as UpdateLeadDTO).convertedCustomerId;
      }
      if ((lead as UpdateLeadDTO).convertedAt !== undefined) {
        dbLead.converted_at = (lead as UpdateLeadDTO).convertedAt;
      }
      if ((lead as UpdateLeadDTO).lastContact !== undefined) {
        dbLead.last_contact = (lead as UpdateLeadDTO).lastContact;
      }
    }
    
    return dbLead;
  }

  /**
   * Get all leads with optional filtering
   */
  async getLeads(filters?: LeadFiltersDTO): Promise<LeadListResponseDTO> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      const tenantId = this.getTenantId(user);

      let query = supabase
        .from(this.table)
      .select(`
        *,
        assigned_to_user:assigned_to(
          id,
          first_name,
          last_name,
          email
        )
      `, { count: 'exact' });

      query = this.addTenantFilter(query, tenantId);

      // Apply role-based filtering for agents
      if (user.role === 'agent' && filters?.assignedTo !== user.id) {
        query = query.eq('assigned_to', user.id);
      }

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
      if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo);
      if (filters.industry) query = query.eq('industry', filters.industry);
      if (filters.leadScoreMin !== undefined) query = query.gte('lead_score', filters.leadScoreMin);
      if (filters.leadScoreMax !== undefined) query = query.lte('lead_score', filters.leadScoreMax);
      if (filters.convertedToCustomer !== undefined) query = query.eq('converted_to_customer', filters.convertedToCustomer);
      if (filters.dateRange) {
        query = query.gte('created_at', filters.dateRange.from).lte('created_at', filters.dateRange.to);
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

    const leads: LeadDTO[] = (data || []).map(row => this.toTypeScript(row));

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
    } catch (error) {
      console.error('[Supabase Leads Service] Error fetching leads:', error);
      throw error;
    }
  }

  /**
   * Get a single lead by ID
   * ✅ Returns lead with audit user names from database columns (denormalized to avoid RLS issues)
   */
  async getLead(id: string): Promise<LeadDTO> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select(`*`)
        .eq('id', id)
        .single();

      if (error) {
        console.error('[Supabase] Error fetching lead:', error.message);
        throw new Error(`Failed to fetch lead: ${error.message}`);
      }

      if (!data) {
        throw new Error('Lead not found');
      }

      console.log('[Supabase] Lead fetched successfully:', {
        id: data.id,
        created_by: data.created_by,
        created_by_name: data.created_by_name,
        updated_by: data.updated_by,
        updated_by_name: data.updated_by_name
      });

      return this.toTypeScript(data);
    } catch (error) {
      console.error('[Supabase Leads Service] Error fetching lead:', error);
      throw error;
    }
  }

  /**
   * Create a new lead
   * ✅ PROPER FLOW: Validate, transform, add system fields, insert
   */
  async createLead(leadData: CreateLeadDTO): Promise<LeadDTO> {
    try {
      // Validate required fields
      if (!leadData.email && !leadData.phone && !leadData.companyName) {
        throw new Error('At least one contact method (email, phone) or company name is required');
      }

      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      if (!authService.hasPermission('write')) {
        throw new Error('Insufficient permissions');
      }

      const tenantId = this.getTenantId(user);
      if (!tenantId) {
        throw new Error('Tenant context missing while creating lead');
      }

      // Build database payload
      const dbPayload = this.toDatabase(leadData, true);
      
      const newLead = {
        ...dbPayload,
        tenant_id: tenantId,
        created_by: user.id,
        created_by_name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
        // Note: created_at and updated_at have DEFAULT values in schema
      };

      // Remove undefined fields
      Object.keys(newLead).forEach(key => {
        if (newLead[key] === undefined) {
          delete newLead[key];
        }
      });

      console.log('[Supabase Leads Service] Creating lead with payload:', newLead);

      const { data, error } = await supabase
        .from(this.table)
        .insert([newLead])
        .select(`
          *,
          assigned_to_user:assigned_to(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (error) throw new Error(`Failed to create lead: ${error.message}`);
      if (!data) throw new Error('Lead created but no data returned');

      return this.toTypeScript(data);
    } catch (error) {
      console.error('[Supabase Leads Service] Error creating lead:', error);
      throw error;
    }
  }

  /**
   * Update an existing lead
   * ✅ PROPER FLOW: Transform DTO, add audit, update
   */
  async updateLead(id: string, updates: UpdateLeadDTO): Promise<LeadDTO> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      if (!authService.hasPermission('write')) {
        throw new Error('Insufficient permissions');
      }

      // Use toDatabase to transform DTO → DB format
      const updateData = this.toDatabase(updates, false);

      // ✅ NOW: Add updated_by to track who updated the lead
      // updated_at has a DEFAULT value trigger in the database
      updateData.updated_by = user.id;
      updateData.updated_by_name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

      const { data, error } = await supabase
        .from(this.table)
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          assigned_to_user:assigned_to(
            id,
            first_name,
            last_name,
            email
          ),
          created_by_user:created_by(
            id,
            first_name,
            last_name,
            email
          ),
          updated_by_user:updated_by(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (error) throw new Error(`Failed to update lead: ${error.message}`);
      if (!data) throw new Error('Lead not found');

      return this.toTypeScript(data);
    } catch (error) {
      console.error('[Supabase Leads Service] Error updating lead:', error);
      throw error;
    }
  }

  /**
   * Delete a lead
   */
  async deleteLead(id: string): Promise<void> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      if (!authService.hasPermission('delete')) {
        throw new Error('Insufficient permissions');
      }

      const { error } = await supabase
        .from(this.table)
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Failed to delete lead: ${error.message}`);
    } catch (error) {
      console.error('[Supabase Leads Service] Error deleting lead:', error);
      throw error;
    }
  }

  /**
   * Convert lead to customer
   */
  async convertToCustomer(id: string, customerId?: string): Promise<LeadDTO> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const lead = await this.getLead(id);

    // Enterprise validation: enforce minimum score unless override permission
    const hasOverride = authService.hasPermission('crm:lead:convert:override');
    const MIN_SCORE = backendConfig.businessRules?.leadConversionMinScore ?? 55;
    if (!hasOverride && (lead.leadScore ?? 0) < MIN_SCORE) {
      throw new Error(`Lead score must be at least ${MIN_SCORE} to convert`);
    }

    // If already converted to the same customer, return existing state to keep idempotency
    if (lead.convertedToCustomer && lead.convertedCustomerId && (!customerId || lead.convertedCustomerId === customerId)) {
      return lead;
    }

    let targetCustomerId = customerId;

    // Auto-create a customer when one is not provided using the shared mapper
    if (!targetCustomerId) {
      const customerPayload = mapLeadToCustomerCreateInput(lead);
      const createdCustomer = await customerService.createCustomer(customerPayload);
      targetCustomerId = createdCustomer.id;
    }

    return this.updateLead(id, {
      convertedToCustomer: true,
      convertedCustomerId: targetCustomerId,
      convertedAt: new Date().toISOString(),
      status: 'won',
      leadScore: 100,
      qualificationStatus: 'qualified',
      stage: 'purchase'
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
   * ✅ PROPER FLOW: Apply tenant filter, compute metrics
   */
  async getConversionMetrics(): Promise<LeadConversionMetricsDTO> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      const tenantId = this.getTenantId(user);

      // Get all leads for current tenant
      let query = supabase
        .from(this.table)
        .select('qualification_status, stage, converted_to_customer, created_at, converted_at, source');

      query = this.addTenantFilter(query, tenantId);

      const { data: leads, error } = await query;

      if (error) throw new Error(`Failed to fetch conversion metrics: ${error.message}`);

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
    } catch (error) {
      console.error('[Supabase Leads Service] Error fetching conversion metrics:', error);
      throw error;
    }
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
   * ✅ PROPER FLOW: Apply tenant filter, export to CSV/JSON
   */
  async exportLeads(format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      const tenantId = this.getTenantId(user);

      let query = supabase
        .from(this.table)
        .select(`
          id, first_name, last_name, company_name, email, phone,
          source, lead_score, status, stage, assigned_to_user(id, first_name, last_name, email), created_at
        `);

      query = this.addTenantFilter(query, tenantId);

      const { data: leads, error } = await query;

      if (error) throw new Error(`Failed to export leads: ${error.message}`);

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
    } catch (error) {
      console.error('[Supabase Leads Service] Error exporting leads:', error);
      throw error;
    }
  }

  /**
   * Auto-calculate lead score based on engagement metrics
   * ✅ Returns: Updated LeadDTO with new score
   */
  async autoCalculateLeadScore(id: string): Promise<LeadDTO> {
    try {
      // Fetch current lead
      const lead = await this.getLead(id);
      
      // Calculate score based on engagement
      let score = 0;
      
      // Contact attempts (email, phone, etc.) = 10 points each
      if (lead.email) score += 10;
      if (lead.phone || lead.mobile) score += 10;
      
      // Engagement signals = 15 points each
      if (lead.lastContact) score += 15;
      if (lead.nextFollowUp) score += 15;
      
      // Status progression = 20 points each
      if (lead.stage === 'interest') score += 20;
      if (lead.stage === 'consideration') score += 20;
      if (lead.stage === 'intent') score += 20;
      if (lead.stage === 'evaluation') score += 30;
      if (lead.stage === 'purchase') score += 50;
      
      // Qualification = 25 points
      if (lead.qualificationStatus === 'qualified') score += 25;
      
      // Cap score at 100
      const newScore = Math.min(score, 100);
      
      console.log('[LeadsService] Auto-calculated lead score:', {
        id,
        oldScore: lead.leadScore,
        newScore
      });
      
      // Update lead with new score
      return this.updateLead(id, { leadScore: newScore });
    } catch (error) {
      console.error('[Supabase Leads Service] Error auto-calculating lead score:', error);
      throw error;
    }
  }

  /**
   * Auto-assign lead to an available team member
   * ✅ Returns: Updated LeadDTO with assigned user
   * ✅ Uses database-driven role configuration (tenant-specific)
   */
  async autoAssignLead(id: string): Promise<LeadDTO> {
    try {
      // Get current user's tenant
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');
      
      const tenantId = this.getTenantId(user);
      if (!tenantId) throw new Error('Tenant context missing');
      
      // Fetch current lead
      const lead = await this.getLead(id);
      
      // If already assigned, return as-is
      if (lead.assignedTo) {
        console.log('[LeadsService] Lead already assigned, skipping auto-assign:', id);
        return lead;
      }
      
      // ✅ ENTERPRISE: Get assignable users from database-driven role config
      const assignableUsers = await roleService.getAssignableUsers(tenantId, 'leads');

      if (!assignableUsers || assignableUsers.length === 0) {
        // Fallback: assign to current user if they have write permission
        if (authService.hasPermission('write')) {
          console.warn('[LeadsService] No eligible assignees found; assigning to current user');
          return this.updateLead(id, { assignedTo: user.id });
        }
        throw new Error('No available assignees to assign lead');
      }
      
      // Get lead counts for each user (simple round-robin)
      const userIds = assignableUsers.map(u => u.id);
      const { data: leadCounts } = await supabase
        .from('leads')
        .select('assigned_to', { count: 'exact' })
        .in('assigned_to', userIds);
      
      const userLoadMap: Record<string, number> = {};
      assignableUsers.forEach(u => {
        userLoadMap[u.id] = 0;
      });
      
      leadCounts?.forEach(lead => {
        if (lead.assigned_to && userLoadMap[lead.assigned_to] !== undefined) {
          userLoadMap[lead.assigned_to]++;
        }
      });
      
      // Find user with least assignments
      const assignedUserId = assignableUsers.reduce((prev, current) => {
        return userLoadMap[current.id] < userLoadMap[prev.id] ? current : prev;
      }).id;
      
      console.log('[LeadsService] Auto-assigning lead (database-driven):', {
        leadId: id,
        assignToId: assignedUserId,
        userLoad: userLoadMap,
        assignableRolesCount: assignableUsers.length
      });
      
      // Update lead with assignment
      return this.updateLead(id, { assignedTo: assignedUserId });
    } catch (error) {
      console.error('[Supabase Leads Service] Error auto-assigning lead:', error);
      throw error;
    }
  }

  /**
   * Auto-assign multiple leads in bulk
   * ✅ Returns: Array of updated LeadDTOs
   */
  async bulkAutoAssignLeads(ids: string[]): Promise<LeadDTO[]> {
    try {
      const results: LeadDTO[] = [];
      
      for (const id of ids) {
        try {
          const updated = await this.autoAssignLead(id);
          results.push(updated);
        } catch (err) {
          console.warn(`[LeadsService] Failed to auto-assign lead ${id}:`, err);
          // Continue with next lead
        }
      }
      
      console.log('[LeadsService] Bulk auto-assigned leads:', {
        requested: ids.length,
        successful: results.length
      });
      
      return results;
    } catch (error) {
      console.error('[Supabase Leads Service] Error bulk auto-assigning leads:', error);
      throw error;
    }
  }
}

export const supabaseLeadsService = new SupabaseLeadsService();
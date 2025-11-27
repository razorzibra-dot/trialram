import { supabase } from '@/services/supabase/client';
import { SalesActivityDTO, CreateSalesActivityDTO, UpdateSalesActivityDTO, SalesActivityFiltersDTO } from '@/types/dtos/salesDtos';
import { authService } from '../../serviceFactory';

class SupabaseSalesActivityService {
  private supabaseClient = supabase;

  async getSalesActivities(filters?: SalesActivityFiltersDTO): Promise<SalesActivityDTO[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let query = this.supabaseClient
      .from('sales_activities')
      .select(`
        *,
        customers!inner(company_name),
        users!performed_by(performed_by_name: name)
      `)
      .eq('tenant_id', user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      query = query.eq('performed_by', user.id);
    }

    // Apply filters
    if (filters) {
      if (filters.activityType) {
        const typeFilter = Array.isArray(filters.activityType) ? filters.activityType : [filters.activityType];
        query = query.in('activity_type', typeFilter);
      }
      if (filters.opportunityId) {
        query = query.eq('opportunity_id', filters.opportunityId);
      }
      if (filters.dealId) {
        query = query.eq('deal_id', filters.dealId);
      }
      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      if (filters.performedBy) {
        query = query.eq('performed_by', filters.performedBy);
      }
      if (filters.outcome) {
        const outcomeFilter = Array.isArray(filters.outcome) ? filters.outcome : [filters.outcome];
        query = query.in('outcome', outcomeFilter);
      }
      if (filters.dateRange) {
        query = query
          .gte('start_date', filters.dateRange.from)
          .lte('start_date', filters.dateRange.to);
      }
      if (filters.search) {
        query = query.or(`subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query.order('start_date', { ascending: false });
    if (error) throw error;

    return data.map(row => this.mapActivityRow(row));
  }

  async getSalesActivity(id: string): Promise<SalesActivityDTO> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const { data, error } = await this.supabaseClient
      .from('sales_activities')
      .select(`
        *,
        customers!inner(company_name),
        users!performed_by(performed_by_name: name)
      `)
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (error) throw error;
    return this.mapActivityRow(data);
  }

  async createSalesActivity(activityData: CreateSalesActivityDTO): Promise<SalesActivityDTO> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const { data, error } = await this.supabaseClient
      .from('sales_activities')
      .insert({
        ...activityData,
        tenant_id: user.tenant_id,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapActivityRow(data);
  }

  async updateSalesActivity(id: string, updates: UpdateSalesActivityDTO): Promise<SalesActivityDTO> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const { data, error } = await this.supabaseClient
      .from('sales_activities')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .select()
      .single();

    if (error) throw error;
    return this.mapActivityRow(data);
  }

  async deleteSalesActivity(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('delete')) {
      throw new Error('Insufficient permissions');
    }

    const { error } = await this.supabaseClient
      .from('sales_activities')
      .delete()
      .eq('id', id)
      .eq('tenant_id', user.tenant_id);

    if (error) throw error;
  }

  private mapActivityRow(row: any): SalesActivityDTO {
    return {
      id: row.id,
      activityType: row.activity_type,
      subject: row.subject,
      description: row.description,
      opportunityId: row.opportunity_id,
      dealId: row.deal_id,
      customerId: row.customer_id,
      customerName: row.customers?.company_name,
      startDate: row.start_date,
      endDate: row.end_date,
      durationMinutes: row.duration_minutes,
      performedBy: row.performed_by,
      performedByName: row.users?.performed_by_name,
      participants: row.participants || [],
      contactPerson: row.contact_person,
      outcome: row.outcome,
      outcomeNotes: row.outcome_notes,
      nextAction: row.next_action,
      nextActionDate: row.next_action_date,
      location: row.location,
      attachments: row.attachments || [],
      tags: row.tags || [],
      tenantId: row.tenant_id,
      audit: {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by || row.created_by,
        version: 1
      }
    };
  }
}

export const supabaseSalesActivityService = new SupabaseSalesActivityService();
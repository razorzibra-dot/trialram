import { supabase } from '../../supabase/client';
import { DealDTO, CreateDealDTO, UpdateDealDTO, DealFiltersDTO, SalesStatsDTO } from '@/types/dtos/salesDtos';
import { authService } from '../../serviceFactory';

class SupabaseDealsService {
  private supabase = supabase;

  async getDeals(filters?: DealFiltersDTO): Promise<DealDTO[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let query = this.supabase
      .from('deals')
      .select(`
        *,
        customers!inner(company_name)
      `)
      .eq('tenant_id', user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      query = query.eq('assigned_to', user.id);
    }

    // Apply filters
    if (filters) {
      if (filters.status) {
        const statusFilter = Array.isArray(filters.status) ? filters.status : [filters.status];
        query = query.in('status', statusFilter);
      }
      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      if (filters.minValue !== undefined) {
        query = query.gte('value', filters.minValue);
      }
      if (filters.maxValue !== undefined) {
        query = query.lte('value', filters.maxValue);
      }
      if (filters.source) {
        query = query.eq('source', filters.source);
      }
      if (filters.campaign) {
        query = query.eq('campaign', filters.campaign);
      }
      if (filters.dateRange) {
        query = query
          .gte('close_date', filters.dateRange.from)
          .lte('close_date', filters.dateRange.to);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,deal_number.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(row => this.mapDealRow(row));
  }

  async getDeal(id: string): Promise<DealDTO> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let query = this.supabase
      .from('deals')
      .select(`
        *,
        customers!inner(company_name)
      `)
      .eq('id', id)
      .eq('tenant_id', user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      query = query.eq('assigned_to', user.id);
    }

    const { data, error } = await query.single();
    if (error) throw error;

    return this.mapDealRow(data);
  }

  async createDeal(dealData: CreateDealDTO): Promise<DealDTO> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const dealNumber = `D-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    const { data, error } = await this.supabase
      .from('deals')
      .insert({
        ...dealData,
        deal_number: dealNumber,
        currency: dealData.currency || 'USD',
        status: dealData.status || 'won',
        tenant_id: user.tenant_id,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapDealRow(data);
  }

  async updateDeal(id: string, updates: UpdateDealDTO): Promise<DealDTO> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const { data, error } = await this.supabase
      .from('deals')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .select()
      .single();

    if (error) throw error;
    return this.mapDealRow(data);
  }

  async deleteDeal(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('delete')) {
      throw new Error('Insufficient permissions');
    }

    const { error } = await this.supabase
      .from('deals')
      .delete()
      .eq('id', id)
      .eq('tenant_id', user.tenant_id);

    if (error) throw error;
  }

  async getDealStats(): Promise<SalesStatsDTO> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let query = this.supabase
      .from('deals')
      .select('status, value')
      .eq('tenant_id', user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      query = query.eq('assigned_to', user.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    const wonDeals = data.filter(d => d.status === 'won');
    const lostDeals = data.filter(d => d.status === 'lost');
    const cancelledDeals = data.filter(d => d.status === 'cancelled');

    const totalValue = data.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const wonValue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const averageDealSize = wonDeals.length > 0 ? wonValue / wonDeals.length : 0;
    const winRate = data.length > 0 ? (wonDeals.length / data.length) * 100 : 0;

    const byStatus: Record<string, number> = {};
    data.forEach(deal => {
      byStatus[deal.status] = (byStatus[deal.status] || 0) + 1;
    });

    return {
      totalDeals: data.length,
      openDeals: 0, // Deals don't have open status
      closedWonDeals: wonDeals.length,
      closedLostDeals: lostDeals.length,
      totalPipelineValue: totalValue,
      totalWonValue: wonValue,
      averageDealSize,
      winRate,
      byStage: {},
      byStatus,
      byAssignee: {},
      bySource: {},
      lastUpdated: new Date().toISOString()
    };
  }

  private mapDealRow(row: any): DealDTO {
    return {
      id: row.id,
      dealNumber: row.deal_number,
      title: row.title,
      description: row.description,
      customerId: row.customer_id,
      customerName: row.customers?.company_name,
      value: row.value,
      currency: row.currency,
      status: row.status,
      source: row.source,
      campaign: row.campaign,
      closeDate: row.close_date,
      expectedCloseDate: row.expected_close_date,
      assignedTo: row.assigned_to,
      notes: row.notes,
      tags: row.tags || [],
      competitorInfo: row.competitor_info,
      winLossReason: row.win_loss_reason,
      opportunityId: row.opportunity_id,
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

export const supabaseDealsService = new SupabaseDealsService();
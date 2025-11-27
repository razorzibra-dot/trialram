import { supabase } from '../../supabase/client';
import { Opportunity, OpportunityItem } from '@/types/crm';
import { authService } from '../../serviceFactory';

class SupabaseOpportunityService {
  private supabase = supabase;

  // Column mapping functions for snake_case ↔ camelCase conversion
  private mapOpportunityRow(row: any): Opportunity {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      customer_id: row.customer_id,
      customer_name: row.customer_name,
      estimated_value: row.estimated_value,
      currency: row.currency,
      probability: row.probability,
      weighted_value: row.weighted_value,
      stage: row.stage,
      status: row.status,
      source: row.source,
      campaign: row.campaign,
      expected_close_date: row.expected_close_date,
      last_activity_date: row.last_activity_date,
      next_activity_date: row.next_activity_date,
      assigned_to: row.assigned_to,
      assigned_to_name: row.assigned_to_name,
      notes: row.notes,
      tags: row.tags || [],
      competitor_info: row.competitor_info,
      pain_points: row.pain_points || [],
      requirements: row.requirements || [],
      proposed_items: row.proposed_items || [],
      tenant_id: row.tenant_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
      converted_to_deal_id: row.converted_to_deal_id
    };
  }

  private mapOpportunityToRow(opportunity: Partial<Opportunity>): any {
    return {
      id: opportunity.id,
      title: opportunity.title,
      description: opportunity.description,
      customer_id: opportunity.customer_id,
      customer_name: opportunity.customer_name,
      estimated_value: opportunity.estimated_value,
      currency: opportunity.currency,
      probability: opportunity.probability,
      stage: opportunity.stage,
      status: opportunity.status,
      source: opportunity.source,
      campaign: opportunity.campaign,
      expected_close_date: opportunity.expected_close_date,
      last_activity_date: opportunity.last_activity_date,
      next_activity_date: opportunity.next_activity_date,
      assigned_to: opportunity.assigned_to,
      assigned_to_name: opportunity.assigned_to_name,
      notes: opportunity.notes,
      tags: opportunity.tags,
      competitor_info: opportunity.competitor_info,
      pain_points: opportunity.pain_points,
      requirements: opportunity.requirements,
      proposed_items: opportunity.proposed_items,
      tenant_id: opportunity.tenant_id,
      created_by: opportunity.created_by,
      converted_to_deal_id: opportunity.converted_to_deal_id
    };
  }

  async getOpportunities(filters?: {
    stage?: string;
    status?: string;
    assigned_to?: string;
    customer_id?: string;
    search?: string;
    probability_min?: number;
    probability_max?: number;
  }): Promise<Opportunity[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let query = this.supabase
      .from('opportunities')
      .select('*')
      .eq('tenant_id', user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      query = query.eq('assigned_to', user.id);
    }

    // Apply filters
    if (filters) {
      if (filters.stage) {
        query = query.eq('stage', filters.stage);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters.probability_min !== undefined) {
        query = query.gte('probability', filters.probability_min);
      }
      if (filters.probability_max !== undefined) {
        query = query.lte('probability', filters.probability_max);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data.map(row => this.mapOpportunityRow(row));
  }

  async getOpportunity(id: string): Promise<Opportunity> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const { data, error } = await this.supabase
      .from('opportunities')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Opportunity not found');
    }

    // Check permissions
    if (user.role === 'agent' && data.assigned_to !== user.id) {
      throw new Error('Access denied');
    }

    return this.mapOpportunityRow(data);
  }

  async createOpportunity(opportunityData: Omit<Opportunity, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<Opportunity> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const rowData = this.mapOpportunityToRow({
      ...opportunityData,
      tenant_id: user.tenant_id,
      created_by: user.id
    });

    const { data, error } = await this.supabase
      .from('opportunities')
      .insert([rowData])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapOpportunityRow(data);
  }

  async updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<Opportunity> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    // Check if opportunity exists and user has access
    const existing = await this.getOpportunity(id);

    const rowData = this.mapOpportunityToRow(updates);

    const { data, error } = await this.supabase
      .from('opportunities')
      .update(rowData)
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapOpportunityRow(data);
  }

  async deleteOpportunity(id: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('delete')) {
      throw new Error('Insufficient permissions');
    }

    const { error } = await this.supabase
      .from('opportunities')
      .delete()
      .eq('id', id)
      .eq('tenant_id', user.tenant_id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async getOpportunityStages(): Promise<string[]> {
    return ['prospecting', 'qualification', 'needs_analysis', 'proposal', 'negotiation', 'decision', 'contract'];
  }

  async getOpportunityStats(): Promise<{
    total: number;
    by_stage: Record<string, number>;
    by_status: Record<string, number>;
    total_value: number;
    average_probability: number;
  }> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let query = this.supabase
      .from('opportunities')
      .select('stage, status, estimated_value, probability')
      .eq('tenant_id', user.tenant_id);

    // Apply role-based filtering
    if (user.role === 'agent') {
      query = query.eq('assigned_to', user.id);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const byStage: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalValue = 0;
    let totalProbability = 0;

    data.forEach((opp: any) => {
      byStage[opp.stage] = (byStage[opp.stage] || 0) + 1;
      byStatus[opp.status] = (byStatus[opp.status] || 0) + 1;
      totalValue += opp.estimated_value;
      totalProbability += opp.probability;
    });

    return {
      total: data.length,
      by_stage: byStage,
      by_status: byStatus,
      total_value: totalValue,
      average_probability: data.length > 0 ? totalProbability / data.length : 0
    };
  }

  async convertToDeal(opportunityId: string, dealData: {
    close_date: string;
    win_loss_reason?: string;
    final_items?: OpportunityItem[];
  }): Promise<{ opportunity: Opportunity; deal: any }> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const opportunity = await this.getOpportunity(opportunityId);

    // Update opportunity status
    const updatedOpportunity = await this.updateOpportunity(opportunityId, {
      status: 'won',
      converted_to_deal_id: `deal_${Date.now()}`
    });

    // Create deal (this would normally call the deal service)
    const deal = {
      id: updatedOpportunity.converted_to_deal_id,
      title: opportunity.title,
      description: opportunity.description,
      customer_id: opportunity.customer_id,
      value: opportunity.estimated_value,
      currency: opportunity.currency,
      status: 'won' as const,
      source: opportunity.source,
      campaign: opportunity.campaign,
      close_date: dealData.close_date,
      expected_close_date: opportunity.expected_close_date,
      assigned_to: opportunity.assigned_to,
      notes: opportunity.notes,
      tags: opportunity.tags,
      competitor_info: opportunity.competitor_info,
      win_loss_reason: dealData.win_loss_reason,
      items: dealData.final_items || opportunity.proposed_items,
      opportunity_id: opportunityId,
      tenant_id: opportunity.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: user.id
    };

    return { opportunity: updatedOpportunity, deal };
  }

  async updateStage(id: string, stage: string): Promise<Opportunity> {
    return this.updateOpportunity(id, { stage: stage as any });
  }

  async updateProbability(id: string, probability: number): Promise<Opportunity> {
    return this.updateOpportunity(id, { probability });
  }

  async bulkUpdateOpportunities(ids: string[], updates: Partial<Opportunity>): Promise<Opportunity[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const rowData = this.mapOpportunityToRow(updates);
    const { data, error } = await this.supabase
      .from('opportunities')
      .update(rowData)
      .in('id', ids)
      .eq('tenant_id', user.tenant_id)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return data.map(row => this.mapOpportunityRow(row));
  }

  async searchOpportunities(query: string): Promise<Opportunity[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const searchLower = query.toLowerCase();

    let dbQuery = this.supabase
      .from('opportunities')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .or(`title.ilike.%${searchLower}%,description.ilike.%${searchLower}%,customer_name.ilike.%${searchLower}%`);

    // Apply role-based filtering
    if (user.role === 'agent') {
      dbQuery = dbQuery.eq('assigned_to', user.id);
    }

    const { data, error } = await dbQuery.order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data.map(row => this.mapOpportunityRow(row));
  }
}

export const supabaseOpportunityService = new SupabaseOpportunityService();
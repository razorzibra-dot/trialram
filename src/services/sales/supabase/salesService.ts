/**
 * Supabase Sales Service
 * Handles sales deals and pipeline operations via Supabase PostgreSQL
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);
import { Deal } from '@/types/crm';
import { authService } from '../../serviceFactory';

class SupabaseSalesService {
  private table = 'sales';

  /**
   * Get tenant ID from user with null-safety
   * ⭐ FIX: Handles super admins with null tenant_id
   */
  private getTenantId(user: any): string | null {
    return user.tenant_id || user.tenantId || null;
  }

  /**
   * Add tenant filter to query if user has a tenant
   * ⭐ FIX: Prevents undefined tenant_id queries
   */
  private addTenantFilter(query: any, tenantId: string | null): any {
    if (tenantId) {
      return query.eq('tenant_id', tenantId);
    }
    return query;
  }

  /**
   * Transform database snake_case to TypeScript camelCase
   */
  private toTypeScript(dbDeal: any): Deal {
    // Transform sale_items array to SaleItem interface format
    const items = Array.isArray(dbDeal.sale_items)
      ? dbDeal.sale_items.map((item: any) => ({
          id: item.id,
          sale_id: item.sale_id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_description: item.product_description,
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          discount: Number(item.discount) || 0,
          tax: Number(item.tax) || 0,
          line_total: Number(item.line_total) || 0,
        }))
      : [];

    return {
      id: dbDeal.id,
      sale_number: dbDeal.sale_number,
      title: dbDeal.title,
      description: dbDeal.description,
      customer_id: dbDeal.customer_id,
      customer_name: dbDeal.customer_name,
      value: Number(dbDeal.value) || 0,
      amount: Number(dbDeal.amount) || Number(dbDeal.value) || 0, // Alias for value
      currency: dbDeal.currency || 'USD',
      probability: Number(dbDeal.probability) || 50,
      weighted_amount: dbDeal.weighted_amount,
      stage: dbDeal.stage,
      status: dbDeal.status,
      source: dbDeal.source,
      campaign: dbDeal.campaign,
      expected_close_date: dbDeal.expected_close_date || '',
      actual_close_date: dbDeal.actual_close_date || '',
      last_activity_date: dbDeal.last_activity_date,
      next_activity_date: dbDeal.next_activity_date,
      assigned_to: dbDeal.assigned_to || '',
      assigned_to_name: dbDeal.assigned_to_name || '',
      notes: dbDeal.notes || '',
      tags: Array.isArray(dbDeal.tags) ? dbDeal.tags : [],
      competitor_info: dbDeal.competitor_info,
      items: items,
      tenant_id: dbDeal.tenant_id,
      created_at: dbDeal.created_at,
      updated_at: dbDeal.updated_at,
      created_by: dbDeal.created_by
    };
  }

  /**
   * Transform TypeScript camelCase to database snake_case
   */
  private toDatabase(deal: Partial<Deal>): any {
    const dbDeal: any = {};
    if (deal.id !== undefined) dbDeal.id = deal.id;
    if (deal.sale_number !== undefined) dbDeal.sale_number = deal.sale_number;
    if (deal.title !== undefined) dbDeal.title = deal.title;
    if (deal.description !== undefined) dbDeal.description = deal.description;
    if (deal.customer_id !== undefined) dbDeal.customer_id = deal.customer_id;
    if (deal.customer_name !== undefined) dbDeal.customer_name = deal.customer_name;
    if (deal.value !== undefined) dbDeal.value = deal.value;
    if (deal.amount !== undefined && deal.value === undefined) dbDeal.value = deal.amount; // Map amount to value
    if (deal.amount !== undefined) dbDeal.amount = deal.amount;
    if (deal.currency !== undefined) dbDeal.currency = deal.currency;
    if (deal.probability !== undefined) dbDeal.probability = deal.probability;
    if (deal.weighted_amount !== undefined) dbDeal.weighted_amount = deal.weighted_amount;
    if (deal.stage !== undefined) dbDeal.stage = deal.stage;
    if (deal.status !== undefined) dbDeal.status = deal.status;
    if (deal.source !== undefined) dbDeal.source = deal.source;
    if (deal.campaign !== undefined) dbDeal.campaign = deal.campaign;
    if (deal.expected_close_date !== undefined) dbDeal.expected_close_date = deal.expected_close_date;
    if (deal.actual_close_date !== undefined) dbDeal.actual_close_date = deal.actual_close_date;
    if (deal.last_activity_date !== undefined) dbDeal.last_activity_date = deal.last_activity_date;
    if (deal.next_activity_date !== undefined) dbDeal.next_activity_date = deal.next_activity_date;
    if (deal.assigned_to !== undefined) dbDeal.assigned_to = deal.assigned_to;
    if (deal.assigned_to_name !== undefined) dbDeal.assigned_to_name = deal.assigned_to_name;
    if (deal.notes !== undefined) dbDeal.notes = deal.notes;
    if (deal.tags !== undefined) dbDeal.tags = deal.tags;
    if (deal.competitor_info !== undefined) dbDeal.competitor_info = deal.competitor_info;
    if (deal.tenant_id !== undefined) dbDeal.tenant_id = deal.tenant_id;
    if (deal.created_by !== undefined) dbDeal.created_by = deal.created_by;
    return dbDeal;
  }

  /**
   * Get all deals for the current tenant (with role-based filtering)
   */
  async getDeals(filters?: {
    stage?: string;
    assigned_to?: string;
    customer_id?: string;
    search?: string;
  }): Promise<Deal[]> {
    try {
      console.log('[Supabase Sales Service] 📥 getDeals() called with filters:', filters);
      
      const user = authService.getCurrentUser();
      console.log('[Supabase Sales Service] 👤 Current user:', user);
      
      if (!user) throw new Error('Unauthorized');

      const tenantId = this.getTenantId(user);
      
      let query = supabase
        .from(this.table)
        .select('*, sale_items(*)');

      query = this.addTenantFilter(query, tenantId);
      
      if (tenantId) {
        console.log('[Supabase Sales Service] 🔍 Filtering by tenant:', tenantId);
      } else {
        console.log('[Supabase Sales Service] 🔓 No tenant filter (super admin cross-tenant query)');
      }

      // Apply role-based filtering for agents
      if (user.role === 'agent') {
        query = query.eq('assigned_to', user.id);
        console.log('[Supabase Sales Service] 🎯 Filtering for agent:', user.id);
      }

      // Apply stage filter
      if (filters?.stage) {
        query = query.eq('stage', filters.stage);
        console.log('[Supabase Sales Service] 📊 Filtering by stage:', filters.stage);
      }

      // Apply assigned_to filter
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
        console.log('[Supabase Sales Service] 👥 Filtering by assigned_to:', filters.assigned_to);
      }

      // Apply customer_id filter
      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
        console.log('[Supabase Sales Service] 🏢 Filtering by customer_id:', filters.customer_id);
      }

      const { data, error } = await query;

      console.log('[Supabase Sales Service] 📦 Query result - Data count:', data?.length || 0, 'Error:', error);
      console.log('[Supabase Sales Service] 📋 Raw data:', data);

      if (error) throw error;

      // Apply search filter (client-side)
      let deals = data || [];
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        deals = deals.filter(d =>
          d.title?.toLowerCase().includes(search) ||
          d.customer_name?.toLowerCase().includes(search) ||
          d.description?.toLowerCase().includes(search)
        );
        console.log('[Supabase Sales Service] 🔎 After search filter:', deals.length, 'deals');
      }

      const transformed = deals.map(d => this.toTypeScript(d));
      console.log('[Supabase Sales Service] ✅ Returning', transformed.length, 'deals:', transformed);
      
      return transformed;
    } catch (error) {
      console.error('[Supabase Sales Service] ❌ Error fetching deals:', error);
      throw error;
    }
  }

  /**
   * Get a single deal by ID
   */
  async getDeal(id: string): Promise<Deal> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      const tenantId = this.getTenantId(user);
      let query = supabase
        .from(this.table)
        .select('*, sale_items(*)')
        .eq('id', id);

      query = this.addTenantFilter(query, tenantId);
      const { data, error } = await query.single();

      if (error) throw error;
      if (!data) throw new Error('Deal not found');

      // Check permissions for agents
      if (user.role === 'agent' && data.assigned_to !== user.id) {
        throw new Error('Access denied');
      }

      console.log('[Supabase Sales Service] 📦 Fetched deal with items:', {
        dealId: data.id,
        itemsCount: data.sale_items?.length || 0,
        items: data.sale_items
      });

      return this.toTypeScript(data);
    } catch (error) {
      console.error('[Supabase] Error fetching deal:', error);
      throw error;
    }
  }

  /**
   * Create a new deal
   */
  async createDeal(dealData: Omit<Deal, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<Deal> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      if (!authService.hasPermission('write')) {
        throw new Error('Insufficient permissions');
      }

      const tenantId = this.getTenantId(user);
      const newDeal = {
        ...this.toDatabase(dealData),
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.table)
        .insert([newDeal])
        .select()
        .single();

      if (error) throw error;
      return this.toTypeScript(data);
    } catch (error) {
      console.error('[Supabase] Error creating deal:', error);
      throw error;
    }
  }

  /**
   * Update an existing deal
   */
  async updateDeal(id: string, updates: Partial<Deal>): Promise<Deal> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      if (!authService.hasPermission('write')) {
        throw new Error('Insufficient permissions');
      }

      // Verify ownership for agents
      const tenantId = this.getTenantId(user);
      let fetchQuery = supabase
        .from(this.table)
        .select('*')
        .eq('id', id);
      fetchQuery = this.addTenantFilter(fetchQuery, tenantId);
      
      const { data: existingDeal, error: fetchError } = await fetchQuery.single();

      if (fetchError || !existingDeal) throw new Error('Deal not found');

      if (user.role === 'agent' && existingDeal.assigned_to !== user.id) {
        throw new Error('Access denied');
      }

      const dbUpdates = {
        ...this.toDatabase(updates),
        updated_at: new Date().toISOString()
      };

      let updateQuery = supabase
        .from(this.table)
        .update(dbUpdates)
        .eq('id', id);
      updateQuery = this.addTenantFilter(updateQuery, tenantId);
      
      const { data, error } = await updateQuery.select().single();

      if (error) throw error;
      return this.toTypeScript(data);
    } catch (error) {
      console.error('[Supabase] Error updating deal:', error);
      throw error;
    }
  }

  /**
   * Delete a deal
   */
  async deleteDeal(id: string): Promise<void> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      if (!authService.hasPermission('delete')) {
        throw new Error('Insufficient permissions');
      }

      // Verify ownership for agents
      const tenantId = this.getTenantId(user);
      let fetchQuery = supabase
        .from(this.table)
        .select('*')
        .eq('id', id);
      fetchQuery = this.addTenantFilter(fetchQuery, tenantId);
      
      const { data: existingDeal, error: fetchError } = await fetchQuery.single();

      if (fetchError || !existingDeal) throw new Error('Deal not found');

      if (user.role === 'agent' && existingDeal.assigned_to !== user.id) {
        throw new Error('Access denied');
      }

      let deleteQuery = supabase
        .from(this.table)
        .delete()
        .eq('id', id);
      deleteQuery = this.addTenantFilter(deleteQuery, tenantId);
      
      const { error } = await deleteQuery;

      if (error) throw error;
    } catch (error) {
      console.error('[Supabase] Error deleting deal:', error);
      throw error;
    }
  }

  /**
   * Get all pipeline stages
   */
  async getStages(): Promise<string[]> {
    return ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
  }

  /**
   * Get pipeline statistics
   */
  async getPipelineStats(): Promise<{
    stage: string;
    count: number;
    value: number;
  }[]> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      const tenantId = this.getTenantId(user);
      let query = supabase
        .from(this.table)
        .select('*');

      query = this.addTenantFilter(query, tenantId);

      // Apply role-based filtering for agents
      if (user.role === 'agent') {
        query = query.eq('assigned_to', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const deals = data || [];
      const stages = await this.getStages();

      return stages.map(stage => {
        const stageDeals = deals.filter((d: any) => d.stage === stage);
        return {
          stage,
          count: stageDeals.length,
          value: stageDeals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0)
        };
      });
    } catch (error) {
      console.error('[Supabase] Error fetching pipeline stats:', error);
      throw error;
    }
  }

  // ============================================================
  // Interface compliance methods - aliases for existing methods
  // ============================================================

  async getSales(filters?: Record<string, unknown>): Promise<Deal[]> {
    return this.getDeals(filters);
  }

  async getSale(id: string): Promise<Deal> {
    return this.getDeal(id);
  }

  async createSale(data: Record<string, unknown>): Promise<Deal> {
    return this.createDeal(data as Omit<Deal, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>);
  }

  async updateSale(id: string, data: Record<string, unknown>): Promise<Deal> {
    return this.updateDeal(id, data as Partial<Deal>);
  }

  async deleteSale(id: string): Promise<void> {
    return this.deleteDeal(id);
  }

  async getPipelineStages(): Promise<Array<{ id: string; name: string; order: number }>> {
    const stages = await this.getStages();
    return stages.map(stage => ({ id: stage, name: stage, order: stages.indexOf(stage) }));
  }

  async getSalesAnalytics(period?: string): Promise<Record<string, unknown>> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      const tenantId = this.getTenantId(user);
      let query = supabase
        .from(this.table)
        .select('*');

      query = this.addTenantFilter(query, tenantId);

      // Apply role-based filtering for agents
      if (user.role === 'agent') {
        query = query.eq('assigned_to', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const deals = data || [];
      const totalValue = deals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
      const wonDeals = deals.filter((d: any) => d.stage === 'closed_won');
      const lostDeals = deals.filter((d: any) => d.stage === 'closed_lost');
      const activeDeals = deals.filter((d: any) => !['closed_won', 'closed_lost'].includes(d.stage));

      return {
        totalDeals: deals.length,
        totalValue,
        wonDeals: wonDeals.length,
        wonValue: wonDeals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0),
        lostDeals: lostDeals.length,
        lostValue: lostDeals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0),
        activeDeals: activeDeals.length,
        activeValue: activeDeals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0),
        conversionRate: deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0,
        averageDealSize: wonDeals.length > 0 ? wonDeals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0) / wonDeals.length : 0
      };
    } catch (error) {
      console.error('[Supabase] Error fetching sales analytics:', error);
      throw error;
    }
  }

  // ============================================================
  // Missing methods for hook compliance
  // ============================================================

  async getDealsByCustomer(customerId: string, filters?: Record<string, unknown>): Promise<{ data: Deal[], page: number, pageSize: number, total: number, totalPages: number }> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      const tenantId = this.getTenantId(user);
      let query = supabase
        .from(this.table)
        .select('*, sale_items(*)')
        .eq('customer_id', customerId);

      query = this.addTenantFilter(query, tenantId);

      // Apply role-based filtering for agents
      if (user.role === 'agent') {
        query = query.eq('assigned_to', user.id);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const deals = (data || []).map(d => this.toTypeScript(d));
      return {
        data: deals,
        page: 1,
        pageSize: deals.length,
        total: count || deals.length,
        totalPages: 1
      };
    } catch (error) {
      console.error('[Supabase] Error fetching deals by customer:', error);
      throw error;
    }
  }

  async getSalesStats(): Promise<Record<string, unknown>> {
    return this.getSalesAnalytics();
  }

  async getDealStages(): Promise<string[]> {
    return this.getStages();
  }

  async updateDealStage(id: string, stage: string): Promise<Deal> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      if (!authService.hasPermission('write')) {
        throw new Error('Insufficient permissions');
      }

      const tenantId = this.getTenantId(user);

      // Verify ownership for agents
      let fetchQuery = supabase
        .from(this.table)
        .select('*')
        .eq('id', id);
      fetchQuery = this.addTenantFilter(fetchQuery, tenantId);

      const { data: existingDeal, error: fetchError } = await fetchQuery.single();

      if (fetchError || !existingDeal) throw new Error('Deal not found');

      if (user.role === 'agent' && existingDeal.assigned_to !== user.id) {
        throw new Error('Access denied');
      }

      let updateQuery = supabase
        .from(this.table)
        .update({
          stage,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      updateQuery = this.addTenantFilter(updateQuery, tenantId);

      const { data, error } = await updateQuery.select().single();

      if (error) throw error;
      return this.toTypeScript(data);
    } catch (error) {
      console.error('[Supabase] Error updating deal stage:', error);
      throw error;
    }
  }

  async bulkUpdateDeals(ids: string[], updates: Record<string, unknown>): Promise<Deal[]> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      if (!authService.hasPermission('write')) {
        throw new Error('Insufficient permissions');
      }

      const tenantId = this.getTenantId(user);
      const dbUpdates = {
        ...this.toDatabase(updates as Partial<Deal>),
        updated_at: new Date().toISOString()
      };

      let query = supabase
        .from(this.table)
        .update(dbUpdates)
        .in('id', ids);
      query = this.addTenantFilter(query, tenantId);

      const { data, error } = await query.select();

      if (error) throw error;

      return (data || []).map(d => this.toTypeScript(d));
    } catch (error) {
      console.error('[Supabase] Error bulk updating deals:', error);
      throw error;
    }
  }

  async bulkDeleteDeals(ids: string[]): Promise<void> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      if (!authService.hasPermission('delete')) {
        throw new Error('Insufficient permissions');
      }

      const tenantId = this.getTenantId(user);
      let query = supabase
        .from(this.table)
        .delete()
        .in('id', ids);
      query = this.addTenantFilter(query, tenantId);

      const { error } = await query;

      if (error) throw error;
    } catch (error) {
      console.error('[Supabase] Error bulk deleting deals:', error);
      throw error;
    }
  }

  async searchDeals(query: string): Promise<Deal[]> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      const tenantId = this.getTenantId(user);
      const searchQuery = query.toLowerCase();

      let q = supabase
        .from(this.table)
        .select('*, sale_items(*)');

      q = this.addTenantFilter(q, tenantId);

      // Apply role-based filtering for agents
      if (user.role === 'agent') {
        q = q.eq('assigned_to', user.id);
      }

      const { data, error } = await q;

      if (error) throw error;

      const deals = (data || []).map(d => this.toTypeScript(d));

      // Client-side search across title, customer_name, and description
      return deals.filter(d =>
        d.title.toLowerCase().includes(searchQuery) ||
        d.customer_name?.toLowerCase().includes(searchQuery) ||
        d.description.toLowerCase().includes(searchQuery)
      );
    } catch (error) {
      console.error('[Supabase] Error searching deals:', error);
      throw error;
    }
  }

  async exportDeals(format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      const tenantId = this.getTenantId(user);
      let query = supabase
        .from(this.table)
        .select('*');

      query = this.addTenantFilter(query, tenantId);

      // Apply role-based filtering for agents
      if (user.role === 'agent') {
        query = query.eq('assigned_to', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const deals = (data || []).map(d => this.toTypeScript(d));

      if (format === 'csv') {
        const headers = ['ID', 'Title', 'Customer', 'Value', 'Stage', 'Status', 'Probability', 'Assigned To'];
        const rows = deals.map(d => [
          d.id,
          d.title,
          d.customer_name,
          d.value,
          d.stage,
          d.status,
          d.probability,
          d.assigned_to_name
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csvContent;
      } else {
        return JSON.stringify(deals, null, 2);
      }
    } catch (error) {
      console.error('[Supabase] Error exporting deals:', error);
      throw error;
    }
  }

  async importDeals(csv: string): Promise<{ success: number; errors: string[] }> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      if (!authService.hasPermission('write')) {
        throw new Error('Insufficient permissions');
      }

      const tenantId = this.getTenantId(user);
      const errors: string[] = [];
      let success = 0;
      const lines = csv.trim().split('\n');

      // Skip header
      const dataLines = lines.slice(1);
      const dealsToInsert: any[] = [];

      for (let i = 0; i < dataLines.length; i++) {
        try {
          const values = dataLines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const [, title, customerName, value, stage, status, probability, assignedToName] = values;

          if (!title || !customerName) {
            errors.push(`Row ${i + 2}: Missing required fields (title or customer)`);
            continue;
          }

          dealsToInsert.push({
            title,
            customer_id: 'imported',
            customer_name: customerName,
            value: parseInt(value) || 0,
            amount: parseInt(value) || 0,
            currency: 'USD',
            stage: stage || 'lead',
            status: status || 'open',
            probability: parseInt(probability) || 50,
            expected_close_date: '',
            actual_close_date: '',
            last_activity_date: new Date().toISOString(),
            next_activity_date: '',
            description: '',
            source: 'import',
            campaign: '',
            notes: `Imported from CSV on ${new Date().toLocaleDateString()}`,
            assigned_to: user.id,
            assigned_to_name: assignedToName || 'Unassigned',
            tags: ['imported'],
            tenant_id: tenantId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: user.id
          });
        } catch (error) {
          errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (dealsToInsert.length > 0) {
        const { error } = await supabase
          .from(this.table)
          .insert(dealsToInsert);

        if (error) throw error;
        success = dealsToInsert.length;
      }

      return { success, errors };
    } catch (error) {
      console.error('[Supabase] Error importing deals:', error);
      throw error;
    }
  }
}

export const supabaseSalesService = new SupabaseSalesService();
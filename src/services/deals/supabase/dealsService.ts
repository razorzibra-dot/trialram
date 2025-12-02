/**
 * Supabase Sales Service
 * Handles sales deals and pipeline operations via Supabase PostgreSQL
 */

import { supabase } from '@/services/supabase/client';
import { Deal } from '@/types/crm';
import { authService } from '../../serviceFactory';

class SupabaseDealsService {
  private table = 'deals';

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
    // Transform sale_items array to DealItem interface format
    const items = Array.isArray(dbDeal.sale_items)
      ? dbDeal.sale_items.map((item: any) => ({
          id: item.id,
          deal_id: item.deal_id || item.sale_id,
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

    // Transform recognition_schedule
    const recognitionSchedule = Array.isArray(dbDeal.recognition_schedule)
      ? dbDeal.recognition_schedule.map((schedule: any) => ({
          id: schedule.id,
          deal_id: schedule.deal_id,
          installment_number: Number(schedule.installment_number) || 0,
          amount: Number(schedule.amount) || 0,
          recognized_amount: Number(schedule.recognized_amount) || 0,
          recognition_date: schedule.recognition_date,
          actual_recognition_date: schedule.actual_recognition_date,
          status: schedule.status,
          description: schedule.description,
          milestone: schedule.milestone,
          tenant_id: schedule.tenant_id,
          created_at: schedule.created_at,
          updated_at: schedule.updated_at
        }))
      : [];

    return {
      id: dbDeal.id,
      deal_number: dbDeal.deal_number || dbDeal.sale_number,
      title: dbDeal.title,
      description: dbDeal.description,
      customer_id: dbDeal.customer_id,
      customer_name: dbDeal.customer_name,
      value: Number(dbDeal.value) || 0,
      currency: dbDeal.currency || 'USD',
      status: dbDeal.status,
      source: dbDeal.source,
      campaign: dbDeal.campaign,
      close_date: dbDeal.close_date || dbDeal.actual_close_date || '',
      expected_close_date: dbDeal.expected_close_date || '',
      assigned_to: dbDeal.assigned_to || '',
      assigned_to_name: dbDeal.assigned_to_name || '',
      notes: dbDeal.notes || '',
      tags: Array.isArray(dbDeal.tags) ? dbDeal.tags : [],
      competitor_info: dbDeal.competitor_info,
      win_loss_reason: dbDeal.win_loss_reason,
      items: items,
      opportunity_id: dbDeal.opportunity_id,
      contract_id: dbDeal.contract_id,
      payment_terms: dbDeal.payment_terms,
      payment_status: dbDeal.payment_status,
      payment_due_date: dbDeal.payment_due_date,
      paid_amount: Number(dbDeal.paid_amount) || 0,
      outstanding_amount: Number(dbDeal.outstanding_amount) || 0,
      payment_method: dbDeal.payment_method,
      revenue_recognized: Number(dbDeal.revenue_recognized) || 0,
      revenue_recognition_status: dbDeal.revenue_recognition_status,
      revenue_recognition_method: dbDeal.revenue_recognition_method,
      recognition_schedule: recognitionSchedule,
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
    if (deal.deal_number !== undefined) dbDeal.deal_number = deal.deal_number;
    if (deal.title !== undefined) dbDeal.title = deal.title;
    if (deal.description !== undefined) dbDeal.description = deal.description;
    if (deal.customer_id !== undefined) dbDeal.customer_id = deal.customer_id;
    if (deal.customer_name !== undefined) dbDeal.customer_name = deal.customer_name;
    if (deal.value !== undefined) dbDeal.value = deal.value;
    if (deal.currency !== undefined) dbDeal.currency = deal.currency;
    if (deal.status !== undefined) dbDeal.status = deal.status;
    if (deal.source !== undefined) dbDeal.source = deal.source;
    if (deal.campaign !== undefined) dbDeal.campaign = deal.campaign;
    if (deal.close_date !== undefined) dbDeal.close_date = deal.close_date;
    if (deal.expected_close_date !== undefined) dbDeal.expected_close_date = deal.expected_close_date;
    if (deal.assigned_to !== undefined) dbDeal.assigned_to = deal.assigned_to;
    if (deal.assigned_to_name !== undefined) dbDeal.assigned_to_name = deal.assigned_to_name;
    if (deal.notes !== undefined) dbDeal.notes = deal.notes;
    if (deal.tags !== undefined) dbDeal.tags = deal.tags;
    if (deal.competitor_info !== undefined) dbDeal.competitor_info = deal.competitor_info;
    if (deal.win_loss_reason !== undefined) dbDeal.win_loss_reason = deal.win_loss_reason;
    if (deal.opportunity_id !== undefined) dbDeal.opportunity_id = deal.opportunity_id;
    if (deal.contract_id !== undefined) dbDeal.contract_id = deal.contract_id;
    if (deal.payment_terms !== undefined) dbDeal.payment_terms = deal.payment_terms;
    if (deal.payment_status !== undefined) dbDeal.payment_status = deal.payment_status;
    if (deal.payment_due_date !== undefined) dbDeal.payment_due_date = deal.payment_due_date;
    if (deal.paid_amount !== undefined) dbDeal.paid_amount = deal.paid_amount;
    if (deal.outstanding_amount !== undefined) dbDeal.outstanding_amount = deal.outstanding_amount;
    if (deal.payment_method !== undefined) dbDeal.payment_method = deal.payment_method;
    if (deal.revenue_recognized !== undefined) dbDeal.revenue_recognized = deal.revenue_recognized;
    if (deal.revenue_recognition_status !== undefined) dbDeal.revenue_recognition_status = deal.revenue_recognition_status;
    if (deal.revenue_recognition_method !== undefined) dbDeal.revenue_recognition_method = deal.revenue_recognition_method;
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
        .select('*, sale_items:sale_items!sale_items_deal_id_fkey(*)');

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
        .select('*, sale_items:sale_items!sale_items_deal_id_fkey(*)')
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
        .select('*, sale_items:sale_items!sale_items_deal_id_fkey(*)')
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
        .select('*, sale_items:sale_items!sale_items_deal_id_fkey(*)');

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
        const headers = ['ID', 'Title', 'Customer', 'Value', 'Status', 'Assigned To', 'Payment Status', 'Revenue Recognized'];
        const rows = deals.map(d => [
          d.id,
          d.title,
          d.customer_name,
          d.value,
          d.status,
          d.assigned_to_name,
          d.payment_status,
          d.revenue_recognized
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

  // ============================================================
  // Payment Processing Methods
  // ============================================================

  async processPayment(dealId: string, paymentData: {
    amount: number;
    payment_date: string;
    payment_method: string;
    reference_number?: string;
    notes?: string;
  }): Promise<Deal> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      if (!authService.hasPermission('write')) {
        throw new Error('Insufficient permissions');
      }

      const tenantId = this.getTenantId(user);

      // Get current deal
      let fetchQuery = supabase
        .from(this.table)
        .select('*')
        .eq('id', dealId);
      fetchQuery = this.addTenantFilter(fetchQuery, tenantId);

      const { data: existingDeal, error: fetchError } = await fetchQuery.single();

      if (fetchError || !existingDeal) {
        throw new Error('Deal not found');
      }

      // Check permissions for agents
      if (user.role === 'agent' && existingDeal.assigned_to !== user.id) {
        throw new Error('Access denied');
      }

      const currentPaidAmount = Number(existingDeal.paid_amount) || 0;
      const newPaidAmount = currentPaidAmount + paymentData.amount;
      const newOutstandingAmount = Math.max(0, Number(existingDeal.value) - newPaidAmount);

      const paymentStatus = newOutstandingAmount <= 0 ? 'paid' :
                           newPaidAmount > 0 ? 'partial' : 'pending';

      const dbUpdates = {
        paid_amount: newPaidAmount,
        outstanding_amount: newOutstandingAmount,
        payment_status: paymentStatus,
        payment_method: paymentData.payment_method,
        updated_at: new Date().toISOString()
      };

      let updateQuery = supabase
        .from(this.table)
        .update(dbUpdates)
        .eq('id', dealId);
      updateQuery = this.addTenantFilter(updateQuery, tenantId);

      const { data, error } = await updateQuery.select().single();

      if (error) throw error;
      return this.toTypeScript(data);
    } catch (error) {
      console.error('[Supabase] Error processing payment:', error);
      throw error;
    }
  }

  async updatePaymentStatus(dealId: string, status: 'pending' | 'partial' | 'paid' | 'overdue'): Promise<Deal> {
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
        .eq('id', dealId);
      fetchQuery = this.addTenantFilter(fetchQuery, tenantId);

      const { data: existingDeal, error: fetchError } = await fetchQuery.single();

      if (fetchError || !existingDeal) throw new Error('Deal not found');

      if (user.role === 'agent' && existingDeal.assigned_to !== user.id) {
        throw new Error('Access denied');
      }

      let updateQuery = supabase
        .from(this.table)
        .update({
          payment_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId);
      updateQuery = this.addTenantFilter(updateQuery, tenantId);

      const { data, error } = await updateQuery.select().single();

      if (error) throw error;
      return this.toTypeScript(data);
    } catch (error) {
      console.error('[Supabase] Error updating payment status:', error);
      throw error;
    }
  }

  // ============================================================
  // Revenue Recognition Methods
  // ============================================================

  async recognizeRevenue(dealId: string, recognitionData: {
    amount: number;
    recognition_date: string;
    method: 'immediate' | 'installments' | 'milestone' | 'time_based';
    description?: string;
  }): Promise<Deal> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      if (!authService.hasPermission('write')) {
        throw new Error('Insufficient permissions');
      }

      const tenantId = this.getTenantId(user);

      // Get current deal
      let fetchQuery = supabase
        .from(this.table)
        .select('*')
        .eq('id', dealId);
      fetchQuery = this.addTenantFilter(fetchQuery, tenantId);

      const { data: existingDeal, error: fetchError } = await fetchQuery.single();

      if (fetchError || !existingDeal) {
        throw new Error('Deal not found');
      }

      // Check permissions for agents
      if (user.role === 'agent' && existingDeal.assigned_to !== user.id) {
        throw new Error('Access denied');
      }

      const currentRecognizedAmount = Number(existingDeal.revenue_recognized) || 0;
      const newRecognizedAmount = currentRecognizedAmount + recognitionData.amount;

      const dbUpdates = {
        revenue_recognized: newRecognizedAmount,
        revenue_recognition_status: newRecognizedAmount >= Number(existingDeal.value) ? 'completed' : 'in_progress',
        revenue_recognition_method: recognitionData.method,
        updated_at: new Date().toISOString()
      };

      let updateQuery = supabase
        .from(this.table)
        .update(dbUpdates)
        .eq('id', dealId);
      updateQuery = this.addTenantFilter(updateQuery, tenantId);

      const { data, error } = await updateQuery.select().single();

      if (error) throw error;
      return this.toTypeScript(data);
    } catch (error) {
      console.error('[Supabase] Error recognizing revenue:', error);
      throw error;
    }
  }

  async createRevenueSchedule(dealId: string, scheduleData: {
    installments: Array<{
      amount: number;
      recognition_date: string;
      description?: string;
      milestone?: string;
    }>;
  }): Promise<any[]> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      if (!authService.hasPermission('write')) {
        throw new Error('Insufficient permissions');
      }

      const tenantId = this.getTenantId(user);

      // Verify deal exists and user has access
      let fetchQuery = supabase
        .from(this.table)
        .select('*')
        .eq('id', dealId);
      fetchQuery = this.addTenantFilter(fetchQuery, tenantId);

      const { data: existingDeal, error: fetchError } = await fetchQuery.single();

      if (fetchError || !existingDeal) {
        throw new Error('Deal not found');
      }

      if (user.role === 'agent' && existingDeal.assigned_to !== user.id) {
        throw new Error('Access denied');
      }

      // Create revenue schedule entries
      const scheduleEntries = scheduleData.installments.map((installment, index) => ({
        deal_id: dealId,
        installment_number: index + 1,
        amount: installment.amount,
        recognized_amount: 0,
        recognition_date: installment.recognition_date,
        status: 'pending',
        description: installment.description,
        milestone: installment.milestone,
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('revenue_recognition_schedule')
        .insert(scheduleEntries)
        .select();

      if (error) throw error;

      // Update deal with recognition method
      let updateQuery = supabase
        .from(this.table)
        .update({
          revenue_recognition_method: 'installments',
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId);
      updateQuery = this.addTenantFilter(updateQuery, tenantId);

      await updateQuery;

      return data || [];
    } catch (error) {
      console.error('[Supabase] Error creating revenue schedule:', error);
      throw error;
    }
  }

  async getRevenueSchedule(dealId: string): Promise<any[]> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      const tenantId = this.getTenantId(user);

      // Verify deal exists and user has access
      let dealQuery = supabase
        .from(this.table)
        .select('*')
        .eq('id', dealId);
      dealQuery = this.addTenantFilter(dealQuery, tenantId);

      const { data: deal, error: dealError } = await dealQuery.single();

      if (dealError || !deal) {
        throw new Error('Deal not found');
      }

      if (user.role === 'agent' && deal.assigned_to !== user.id) {
        throw new Error('Access denied');
      }

      // Get revenue schedule
      let scheduleQuery = supabase
        .from('revenue_recognition_schedule')
        .select('*')
        .eq('deal_id', dealId);
      scheduleQuery = this.addTenantFilter(scheduleQuery, tenantId);

      const { data, error } = await scheduleQuery.order('installment_number');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[Supabase] Error fetching revenue schedule:', error);
      throw error;
    }
  }

  // ============================================================
  // Contract Integration Methods
  // ============================================================

  async linkContract(dealId: string, contractId: string): Promise<Deal> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      if (!authService.hasPermission('write')) {
        throw new Error('Insufficient permissions');
      }

      const tenantId = this.getTenantId(user);

      // Verify deal exists and user has access
      let fetchQuery = supabase
        .from(this.table)
        .select('*')
        .eq('id', dealId);
      fetchQuery = this.addTenantFilter(fetchQuery, tenantId);

      const { data: existingDeal, error: fetchError } = await fetchQuery.single();

      if (fetchError || !existingDeal) {
        throw new Error('Deal not found');
      }

      if (user.role === 'agent' && existingDeal.assigned_to !== user.id) {
        throw new Error('Access denied');
      }

      let updateQuery = supabase
        .from(this.table)
        .update({
          contract_id: contractId,
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId);
      updateQuery = this.addTenantFilter(updateQuery, tenantId);

      const { data, error } = await updateQuery.select().single();

      if (error) throw error;
      return this.toTypeScript(data);
    } catch (error) {
      console.error('[Supabase] Error linking contract:', error);
      throw error;
    }
  }

  async getDealsByContract(contractId: string): Promise<Deal[]> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      const tenantId = this.getTenantId(user);

      let query = supabase
        .from(this.table)
        .select('*, sale_items:sale_items!sale_items_deal_id_fkey(*)')
        .eq('contract_id', contractId);

      query = this.addTenantFilter(query, tenantId);

      // Apply role-based filtering for agents
      if (user.role === 'agent') {
        query = query.eq('assigned_to', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(d => this.toTypeScript(d));
    } catch (error) {
      console.error('[Supabase] Error fetching deals by contract:', error);
      throw error;
    }
  }

  async createContractFromDeal(dealId: string, contractData?: {
    template_id?: string;
    start_date?: string;
    end_date?: string;
    auto_renew?: boolean;
    renewal_terms?: string;
    notes?: string;
  }): Promise<{ deal: Deal; contract: any }> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      if (!authService.hasPermission('write')) {
        throw new Error('Insufficient permissions');
      }

      // Get the deal
      const deal = await this.getDeal(dealId);
      if (deal.status !== 'won') {
        throw new Error('Only won deals can be converted to contracts');
      }

      if (deal.contract_id) {
        throw new Error('Deal already has a contract linked');
      }

      // Import contract service dynamically to avoid circular imports
      const { contractService } = await import('../../serviceFactory');

      // Create contract from deal data
      const contractTitle = `${deal.title} - Contract`;
      const contractStartDate = contractData?.start_date || deal.close_date?.split('T')[0] || new Date().toISOString().split('T')[0];
      const contractEndDate = contractData?.end_date || new Date(new Date(contractStartDate).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 1 year from start

      const contractPayload = {
        title: contractTitle,
        type: 'service_agreement' as const,
        status: 'draft' as const,
        customer_id: deal.customer_id,
        parties: [
          {
            id: 'party_customer',
            name: 'Customer', // This would be populated from customer data
            email: 'customer@example.com', // This would be populated from customer data
            role: 'client' as const,
            signature_required: true
          },
          {
            id: 'party_vendor',
            name: user.name,
            email: user.email,
            role: 'vendor' as const,
            signature_required: true
          }
        ],
        value: deal.value,
        total_value: deal.value,
        currency: deal.currency,
        start_date: contractStartDate,
        end_date: contractEndDate,
        auto_renew: contractData?.auto_renew || false,
        renewal_terms: contractData?.renewal_terms || 'Auto-renewal for 1 year unless terminated with 60 days notice',
        approval_stage: 'draft',
        created_by: user.id,
        assigned_to: deal.assigned_to,
        content: `Contract automatically generated from deal: ${deal.title}\n\nDeal Value: ${deal.value} ${deal.currency}\nClose Date: ${deal.close_date}\n\n${contractData?.notes || ''}`,
        template_id: contractData?.template_id || '1',
        tags: [...(deal.tags || []), 'auto-generated', 'from-deal'],
        priority: 'medium' as const,
        reminder_days: [90, 60, 30],
        approval_history: [],
        compliance_status: 'pending_review' as const,
        signature_status: {
          total_required: 2,
          completed: 0,
          pending: ['customer@example.com', user.email]
        },
        attachments: []
      };

      // Create the contract
      const newContract = await contractService.createContract(contractPayload);

      // Link the contract to the deal
      const updatedDeal = await this.linkContract(dealId, newContract.id);

      return {
        deal: updatedDeal,
        contract: newContract
      };
    } catch (error) {
      console.error('[Supabase] Error creating contract from deal:', error);
      throw error;
    }
  }

  async convertDealToContract(dealId: string, options?: {
    createContract?: boolean;
    contractTemplate?: string;
    contractData?: any;
  }): Promise<{ deal: Deal; contract?: any }> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      if (!authService.hasPermission('write')) {
        throw new Error('Insufficient permissions');
      }

      const deal = await this.getDeal(dealId);

      if (deal.status !== 'won') {
        throw new Error('Only won deals can be converted to contracts');
      }

      if (deal.contract_id && !options?.createContract) {
        throw new Error('Deal already has a contract linked');
      }

      if (options?.createContract !== false) {
        // Create new contract from deal
        const result = await this.createContractFromDeal(dealId, {
          template_id: options?.contractTemplate,
          ...options?.contractData
        });

        return result;
      } else {
        // Just update deal status without creating contract
        const updatedDeal = await this.updateDeal(dealId, {
          status: 'won' // Keep as won since contract creation was skipped
        });

        return { deal: updatedDeal };
      }
    } catch (error) {
      console.error('[Supabase] Error converting deal to contract:', error);
      throw error;
    }
  }
}

export const supabaseDealsService = new SupabaseDealsService();
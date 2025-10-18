/**
 * Supabase Sales Service
 * Handles sales pipeline, deals, sales items
 * Extends BaseSupabaseService for common database operations
 */

import { BaseSupabaseService } from './baseService';
import { getSupabaseClient } from './client';
import { Sale, Deal } from '@/types/crm';

export interface SalesFilters {
  status?: string;
  stage?: string;
  assignedTo?: string;
  customerId?: string;
  tenantId?: string;
  dateRange?: { from: string; to: string };
}

export class SupabaseSalesService extends BaseSupabaseService {
  constructor() {
    super('sales', true);
  }

  /**
   * Get all sales with optional filtering
   */
  async getSales(filters?: SalesFilters): Promise<Sale[]> {
    try {
      this.log('Fetching sales', filters);

      let query = getSupabaseClient()
        .from('sales')
        .select(
          `*,
          customer:customers(*),
          items:sales_items(*),
          assigned_user:users(id, firstName, lastName, email)`
        );

      // Apply filters
      if (filters?.tenantId) {
        query = query.eq('tenant_id', filters.tenantId);
      }
      if (filters?.stage) {
        query = query.eq('stage', filters.stage);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }

      // Exclude deleted records
      query = query.is('deleted_at', null);

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) throw error;

      this.log('Sales fetched', { count: data?.length });
      return data?.map((s) => this.mapSaleResponse(s)) || [];
    } catch (error) {
      this.logError('Error fetching sales', error);
      throw error;
    }
  }

  /**
   * Get sale by ID
   */
  async getSale(id: string): Promise<Sale | null> {
    try {
      this.log('Fetching sale', { id });

      const { data, error } = await getSupabaseClient()
        .from('sales')
        .select(
          `*,
          customer:customers(*),
          items:sales_items(*),
          assigned_user:users(id, firstName, lastName, email)`
        )
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data ? this.mapSaleResponse(data) : null;
    } catch (error) {
      this.logError('Error fetching sale', error);
      throw error;
    }
  }

  /**
   * Create new sale
   */
  async createSale(data: Partial<Sale>): Promise<Sale> {
    try {
      this.log('Creating sale', { customer_id: data.customer_id });

      const { data: created, error } = await getSupabaseClient()
        .from('sales')
        .insert([
          {
            sale_number: data.sale_number,
            title: data.title,
            description: data.description,
            customer_id: data.customer_id,
            value: data.value || 0,
            amount: data.amount || 0,
            probability: data.probability || 50,
            stage: data.stage || 'lead',
            status: data.status || 'open',
            expected_close_date: data.expected_close_date,
            actual_close_date: data.actual_close_date,
            assigned_to: data.assigned_to,
            notes: data.notes,
            tenant_id: data.tenant_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select(
          `*,
          customer:customers(*),
          items:sales_items(*),
          assigned_user:users(id, firstName, lastName, email)`
        )
        .single();

      if (error) throw error;

      this.log('Sale created successfully', { id: created.id });
      return this.mapSaleResponse(created);
    } catch (error) {
      this.logError('Error creating sale', error);
      throw error;
    }
  }

  /**
   * Update sale
   */
  async updateSale(id: string, updates: Partial<Sale>): Promise<Sale> {
    try {
      this.log('Updating sale', { id });

      const { data, error } = await getSupabaseClient()
        .from('sales')
        .update({
          title: updates.title,
          description: updates.description,
          value: updates.value,
          probability: updates.probability,
          stage: updates.stage,
          status: updates.status,
          expected_close_date: updates.expected_close_date,
          actual_close_date: updates.actual_close_date,
          assigned_to: updates.assigned_to,
          notes: updates.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(
          `*,
          customer:customers(*),
          items:sales_items(*),
          assigned_user:users(id, firstName, lastName, email)`
        )
        .single();

      if (error) throw error;

      this.log('Sale updated successfully', { id });
      return this.mapSaleResponse(data);
    } catch (error) {
      this.logError('Error updating sale', error);
      throw error;
    }
  }

  /**
   * Delete sale (soft delete)
   */
  async deleteSale(id: string): Promise<void> {
    try {
      this.log('Deleting sale', { id });

      const { error } = await getSupabaseClient()
        .from('sales')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      this.log('Sale deleted successfully', { id });
    } catch (error) {
      this.logError('Error deleting sale', error);
      throw error;
    }
  }

  /**
   * Get sales by stage for pipeline view
   */
  async getSalesByStage(tenantId: string): Promise<Record<string, Sale[]>> {
    try {
      this.log('Fetching sales by stage', { tenantId });

      const sales = await this.getSales({ tenantId });

      const grouped: Record<string, Sale[]> = {
        lead: [],
        qualified: [],
        proposal: [],
        negotiation: [],
        closed_won: [],
        closed_lost: [],
      };

      sales.forEach((sale) => {
        const stage = (sale.stage || 'lead') as keyof typeof grouped;
        if (grouped[stage]) {
          grouped[stage].push(sale);
        }
      });

      return grouped;
    } catch (error) {
      this.logError('Error fetching sales by stage', error);
      throw error;
    }
  }

  /**
   * Get sales statistics and KPIs
   */
  async getSalesStats(tenantId: string): Promise<{
    total: number;
    totalValue: number;
    avgValue: number;
    byStage: Record<string, { count: number; value: number }>;
    closedWon: number;
    closedLost: number;
    conversionRate: number;
  }> {
    try {
      this.log('Fetching sales statistics', { tenantId });

      const sales = await this.getSales({ tenantId });

      const stats = {
        total: sales.length,
        totalValue: 0,
        avgValue: 0,
        byStage: {} as Record<string, { count: number; value: number }>,
        closedWon: 0,
        closedLost: 0,
        conversionRate: 0,
      };

      sales.forEach((s) => {
        stats.totalValue += s.value || 0;

        const stage = s.stage || 'lead';
        if (!stats.byStage[stage]) {
          stats.byStage[stage] = { count: 0, value: 0 };
        }
        stats.byStage[stage].count++;
        stats.byStage[stage].value += s.value || 0;

        if (s.status === 'won') stats.closedWon++;
        if (s.status === 'lost') stats.closedLost++;
      });

      if (sales.length > 0) {
        stats.avgValue = stats.totalValue / sales.length;
      }

      const qualified =
        (stats.byStage['qualified']?.count || 0) + stats.closedWon;
      stats.conversionRate = qualified > 0 ? stats.closedWon / qualified : 0;

      return stats;
    } catch (error) {
      this.logError('Error fetching sales statistics', error);
      throw error;
    }
  }

  /**
   * Update sale stage (move through pipeline)
   */
  async updateStage(
    id: string,
    newStage: string,
    notes?: string
  ): Promise<Sale> {
    try {
      this.log('Updating sale stage', { id, newStage });

      return this.updateSale(id, {
        stage: newStage as Sale['stage'],
        notes: notes || undefined,
      } as any);
    } catch (error) {
      this.logError('Error updating sale stage', error);
      throw error;
    }
  }

  /**
   * Subscribe to sales changes
   */
  subscribeToSales(tenantId: string, callback: (payload: any) => void): () => void {
    return this.subscribeToChanges(
      {
        event: '*',
        table: 'sales',
        filter: `tenant_id=eq.${tenantId}`,
      },
      callback
    );
  }

  /**
   * Map database sale response to UI Sale type
   */
  private mapSaleResponse(dbSale: any): Sale {
    return {
      id: dbSale.id,
      sale_number: dbSale.sale_number,
      title: dbSale.title,
      description: dbSale.description || '',
      customer_id: dbSale.customer_id,
      customer_name: dbSale.customer?.company_name || '',
      value: dbSale.value || 0,
      amount: dbSale.amount || dbSale.value || 0,
      currency: 'USD',
      probability: dbSale.probability || 50,
      weighted_amount: (dbSale.value || 0) * ((dbSale.probability || 50) / 100),
      stage: (dbSale.stage || 'lead') as Sale['stage'],
      status: (dbSale.status || 'open') as Sale['status'],
      source: dbSale.source || '',
      campaign: dbSale.campaign || '',
      expected_close_date: dbSale.expected_close_date || '',
      actual_close_date: dbSale.actual_close_date || '',
      last_activity_date: dbSale.last_activity_date || '',
      next_activity_date: dbSale.next_activity_date || '',
      assigned_to: dbSale.assigned_to,
      assigned_to_name: dbSale.assigned_user?.firstName
        ? `${dbSale.assigned_user.firstName} ${dbSale.assigned_user.lastName}`
        : '',
      notes: dbSale.notes || '',
      tags: dbSale.tags || [],
      competitor_info: dbSale.competitor_info || '',
      items: dbSale.items?.map((item: any) => ({
        id: item.id,
        sale_id: item.sale_id,
        product_id: item.product_id,
        product_name: item.product_name || '',
        product_description: item.product_description || '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount || 0,
        tax: item.tax || 0,
        line_total: item.line_total || item.quantity * item.unit_price,
      })) || [],
      tenant_id: dbSale.tenant_id,
      created_at: dbSale.created_at,
      updated_at: dbSale.updated_at,
      created_by: dbSale.created_by || '',
    };
  }
}

// Export singleton instance
export const supabasesSalesService = new SupabaseSalesService();
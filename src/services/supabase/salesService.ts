/**
 * Supabase Sales Service
 * Handles sales pipeline, deals, sales items
 * Extends BaseSupabaseService for common database operations
 */

import { BaseSupabaseService } from './baseService';
import { getSupabaseClient } from './client';
import { Sale, Deal } from '@/types/crm';
import { SupabaseNotificationService, Notification } from './notificationService';

export interface SalesFilters {
  status?: string;
  stage?: string;
  assignedTo?: string;
  customerId?: string;
  tenantId?: string;
  dateRange?: { from: string; to: string };
}

export class SupabaseSalesService extends BaseSupabaseService {
  private notificationService: SupabaseNotificationService;

  constructor() {
    super('sales', true);
    this.notificationService = new SupabaseNotificationService();
  }

  /**
   * Helper method to get current user's tenant_id
   */
  private async getCurrentUserTenantId(): Promise<string | null> {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Try JWT claims first
        const tenantFromJwt = (user.user_metadata?.tenant_id || 
                              (user as any).app_metadata?.tenant_id);
        if (tenantFromJwt) return tenantFromJwt;
        
        // Fall back to users table
        const { data: userData } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('id', user.id)
          .single();
        return userData?.tenant_id || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user tenant:', error);
      return null;
    }
  }

  /**
   * Helper method to get current user ID
   */
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Create a notification for a sales operation
   */
  private async createSalesNotification(
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string,
    saleId?: string
  ): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      const tenantId = await this.getCurrentUserTenantId();
      
      if (!userId || !tenantId) {
        this.log('Skipping notification: missing user or tenant', { userId, tenantId });
        return;
      }

      await this.notificationService.createNotification({
        user_id: userId,
        type,
        title,
        message,
        category: 'sales',
        action_url: saleId ? `/sales/${saleId}` : undefined,
        action_label: saleId ? 'View Sale' : undefined,
        tenant_id: tenantId,
      } as Partial<Notification>);

      this.log('Sales notification created', { type, title });
    } catch (error) {
      this.logError('Failed to create sales notification', error);
      // Don't throw - continue even if notification fails
    }
  }

  /**
   * Get all sales with optional filtering
   */
  async getSales(filters?: SalesFilters): Promise<Sale[]> {
    try {
      this.log('Fetching sales', filters);

      // Fetch sales without complex relationships (avoid Supabase RLS issues with multiple foreign keys)
      let query = getSupabaseClient()
        .from('sales')
        .select(
          `*,
          customer:customers(*),
          items:sale_items(*)`
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
          items:sale_items(*)`
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

      // Extract items if provided
      const items = data.items;

      // Get current user's tenant_id for RLS compliance
      const supabase = getSupabaseClient();
      let tenantId = data.tenant_id;
      
      if (!tenantId) {
        // Get current user's tenant from auth session
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Try to get tenant_id from JWT claims first
          const tenantFromJwt = (user.user_metadata?.tenant_id || 
                                 (user as any).app_metadata?.tenant_id);
          if (tenantFromJwt) {
            tenantId = tenantFromJwt;
          } else {
            // Fall back to querying users table
            const { data: userData } = await supabase
              .from('users')
              .select('tenant_id')
              .eq('id', user.id)
              .single();
            tenantId = userData?.tenant_id;
          }
        }
        
        if (!tenantId) {
          throw new Error('Cannot determine tenant_id for current user');
        }
      }

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
            source: data.source,
            campaign: data.campaign,
            tags: data.tags,
            tenant_id: tenantId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select(
          `*,
          customer:customers(*),
          items:sale_items(*)`
        )
        .single();

      if (error) throw error;

      // Handle sale items if provided
      if (items && Array.isArray(items) && items.length > 0 && created) {
        console.log('⏳ [SUPABASE] Creating sale items for new sale...');
        try {
          const itemsToInsert = items.map((item: any) => ({
            sale_id: created.id,
            product_id: item.product_id || null,
            product_name: item.product_name,
            product_description: item.product_description || null,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount || 0,
            tax: item.tax || 0,
            line_total: item.line_total,
          }));

          const { error: insertError } = await getSupabaseClient()
            .from('sale_items')
            .insert(itemsToInsert);

          if (insertError) {
            console.warn('⚠️ [SUPABASE] Warning: Could not insert items:', insertError.message);
          } else {
            console.log('🔄 [SUPABASE] Created sale items:', itemsToInsert.length);
          }
        } catch (itemError) {
          console.warn('⚠️ [SUPABASE] Warning: Error creating items, continuing:', itemError);
        }
      }

      this.log('Sale created successfully', { id: created.id });
      
      // Create notification for sale creation
      const mappedSale = this.mapSaleResponse(created);
      await this.createSalesNotification(
        'success',
        'Sale Created',
        `New sale "${data.title || 'Untitled'}" has been created successfully`,
        created.id
      );
      
      return mappedSale;
    } catch (error) {
      this.logError('Error creating sale', error);
      throw error;
    }
  }

  /**
   * Update sale
   * Sanitizes data to exclude undefined/null/empty values to prevent "invalid input syntax for type uuid" errors
   */
  async updateSale(id: string, updates: Partial<Sale>): Promise<Sale> {
    try {
      this.log('Updating sale', { id, updatesKeys: Object.keys(updates) });

      // Helper to check if a value is valid (not undefined, null, or empty string)
      const isValidValue = (val: unknown): boolean => {
        return val !== undefined && val !== null && val !== '';
      };

      // Build update object, excluding invalid values to prevent PostgreSQL UUID errors
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Only include fields that have actual values
      if (isValidValue(updates.title)) updatePayload.title = updates.title;
      if (isValidValue(updates.description)) updatePayload.description = updates.description;
      if (isValidValue(updates.value)) updatePayload.value = updates.value;
      if (isValidValue(updates.probability)) updatePayload.probability = updates.probability;
      if (isValidValue(updates.stage)) updatePayload.stage = updates.stage;
      if (isValidValue(updates.status)) updatePayload.status = updates.status;
      if (isValidValue(updates.expected_close_date)) updatePayload.expected_close_date = updates.expected_close_date;
      if (isValidValue(updates.actual_close_date)) updatePayload.actual_close_date = updates.actual_close_date;
      if (isValidValue(updates.assigned_to)) updatePayload.assigned_to = updates.assigned_to;
      if (isValidValue(updates.notes)) updatePayload.notes = updates.notes;
      if (isValidValue(updates.customer_id)) updatePayload.customer_id = updates.customer_id;
      if (isValidValue(updates.source)) updatePayload.source = updates.source;
      if (isValidValue(updates.campaign)) updatePayload.campaign = updates.campaign;
      if (isValidValue(updates.tags)) updatePayload.tags = updates.tags;

      this.log('Update payload prepared', updatePayload);
      console.log('🔄 [SUPABASE] Making updateSale request:', { id, payload: updatePayload });

      // STEP 1: Do the update (simpler query, less likely to hang)
      console.log('⏳ [SUPABASE] Executing update operation...');
      const { error: updateError } = await getSupabaseClient()
        .from('sales')
        .update(updatePayload)
        .eq('id', id);

      console.log('🔄 [SUPABASE] Update operation response:', { updateError });

      if (updateError) {
        console.error('❌ [SUPABASE] Update error detail:', {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
          fullError: updateError
        });
        throw updateError;
      }

      // STEP 1.5: Handle sale items update if provided
      if (updates.items && Array.isArray(updates.items) && updates.items.length > 0) {
        console.log('⏳ [SUPABASE] Updating sale items...');
        try {
          // Delete existing items for this sale
          const { error: deleteError } = await getSupabaseClient()
            .from('sale_items')
            .delete()
            .eq('sale_id', id);

          if (deleteError) {
            console.warn('⚠️ [SUPABASE] Warning: Could not delete old items:', deleteError.message);
          } else {
            console.log('🔄 [SUPABASE] Deleted existing sale items');
          }

          // Insert new items
          const itemsToInsert = updates.items.map((item: any) => ({
            sale_id: id,
            product_id: item.product_id || null,
            product_name: item.product_name,
            product_description: item.product_description || null,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount || 0,
            tax: item.tax || 0,
            line_total: item.line_total,
          }));

          const { error: insertError } = await getSupabaseClient()
            .from('sale_items')
            .insert(itemsToInsert);

          if (insertError) {
            console.warn('⚠️ [SUPABASE] Warning: Could not insert new items:', insertError.message);
          } else {
            console.log('🔄 [SUPABASE] Inserted new sale items:', itemsToInsert.length);
          }
        } catch (itemError) {
          console.warn('⚠️ [SUPABASE] Warning: Error handling sale items, continuing:', itemError);
        }
      } else if (updates.items !== undefined && (!Array.isArray(updates.items) || updates.items.length === 0)) {
        // If items is explicitly provided but empty, delete all items for this sale
        console.log('⏳ [SUPABASE] Clearing sale items...');
        try {
          const { error: deleteError } = await getSupabaseClient()
            .from('sale_items')
            .delete()
            .eq('sale_id', id);

          if (!deleteError) {
            console.log('🔄 [SUPABASE] Cleared sale items');
          }
        } catch (itemError) {
          console.warn('⚠️ [SUPABASE] Warning: Error clearing items:', itemError);
        }
      }

      // STEP 2: Fetch the updated record separately (more reliable)
      console.log('⏳ [SUPABASE] Fetching updated record...');
      const { data, error: fetchError } = await getSupabaseClient()
        .from('sales')
        .select(
          `*,
          customer:customers(*),
          items:sale_items(*)`
        )
        .eq('id', id)
        .single();

      console.log('🔄 [SUPABASE] Fetch response:', { data, error: fetchError });

      if (fetchError) {
        console.error('❌ [SUPABASE] Fetch error detail:', {
          message: fetchError.message,
          code: fetchError.code,
          details: fetchError.details,
          hint: fetchError.hint,
          fullError: fetchError
        });
        throw fetchError;
      }

      if (!data) {
        console.warn('⚠️ [SUPABASE] Fetch returned no data');
        throw new Error('Fetch returned no data after update');
      }

      this.log('Sale updated successfully', { id, returnedId: data.id });
      
      // Create notification for sale update
      const mappedSale = this.mapSaleResponse(data);
      const updateSummary = Object.entries(updates)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k]) => k)
        .join(', ');
      
      await this.createSalesNotification(
        'info',
        'Sale Updated',
        `Sale "${data.title || 'Untitled'}" has been updated${updateSummary ? ': ' + updateSummary : ''}`,
        data.id
      );
      
      return mappedSale;
    } catch (error) {
      this.logError('Error updating sale', error);
      console.error('❌ [SUPABASE] UpdateSale exception:', error);
      throw error;
    }
  }

  /**
   * Delete sale (soft delete)
   */
  async deleteSale(id: string): Promise<void> {
    try {
      this.log('Deleting sale', { id });

      // Fetch sale before deletion to get its title for notification
      const sale = await this.getSale(id);
      const saleTitle = sale?.title || 'Untitled';

      const { error } = await getSupabaseClient()
        .from('sales')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      this.log('Sale deleted successfully', { id });

      // Create notification for sale deletion
      await this.createSalesNotification(
        'warning',
        'Sale Deleted',
        `Sale "${saleTitle}" has been deleted`
      );
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

      const updatedSale = await this.updateSale(id, {
        stage: newStage as Sale['stage'],
        notes: notes || undefined,
      } as any);

      // Create a more specific notification for stage changes
      await this.createSalesNotification(
        'success',
        'Sale Stage Updated',
        `Sale "${updatedSale.title || 'Untitled'}" has moved to ${newStage}`,
        id
      );

      return updatedSale;
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
   * Ensures all fields are safely accessed with proper defaults
   */
  private mapSaleResponse(dbSale: any): Sale {
    // Safely extract customer name from relationship or fallback to stored value
    let customerName = '';
    if (dbSale.customer && typeof dbSale.customer === 'object') {
      customerName = dbSale.customer.company_name || dbSale.customer.contact_name || '';
    } else if (typeof dbSale.customer_name === 'string') {
      customerName = dbSale.customer_name;
    }

    // Safely extract assigned_to_name
    let assignedToName = '';
    if (dbSale.assigned_user && typeof dbSale.assigned_user === 'object') {
      assignedToName = dbSale.assigned_user.display_name || dbSale.assigned_user.email || '';
    } else if (typeof dbSale.assigned_to_name === 'string') {
      assignedToName = dbSale.assigned_to_name;
    }

    return {
      id: dbSale.id || '',
      sale_number: dbSale.sale_number || '',
      title: dbSale.title || 'Untitled Deal',
      description: dbSale.description || '',
      customer_id: dbSale.customer_id || '',
      customer_name: customerName,
      value: Number(dbSale.value) || 0,
      amount: Number(dbSale.amount || dbSale.value) || 0,
      currency: dbSale.currency || 'USD',
      probability: Number(dbSale.probability) || 50,
      weighted_amount: (Number(dbSale.value) || 0) * ((Number(dbSale.probability) || 50) / 100),
      stage: (dbSale.stage || 'lead') as Sale['stage'],
      status: (dbSale.status || 'open') as Sale['status'],
      source: dbSale.source || '',
      campaign: dbSale.campaign || '',
      expected_close_date: dbSale.expected_close_date || '',
      actual_close_date: dbSale.actual_close_date || '',
      last_activity_date: dbSale.last_activity_date || '',
      next_activity_date: dbSale.next_activity_date || '',
      assigned_to: dbSale.assigned_to || '',
      assigned_to_name: assignedToName,
      notes: dbSale.notes || '',
      tags: Array.isArray(dbSale.tags) ? dbSale.tags : [],
      competitor_info: dbSale.competitor_info || '',
      items: Array.isArray(dbSale.items)
        ? dbSale.items.map((item: any) => ({
            id: item.id || '',
            sale_id: item.sale_id || '',
            product_id: item.product_id || '',
            product_name: item.product_name || '',
            product_description: item.product_description || '',
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
            discount: Number(item.discount) || 0,
            tax: Number(item.tax) || 0,
            line_total: Number(item.line_total) || Number(item.quantity || 0) * Number(item.unit_price || 0),
          }))
        : [],
      tenant_id: dbSale.tenant_id || '',
      created_at: dbSale.created_at || new Date().toISOString(),
      updated_at: dbSale.updated_at || new Date().toISOString(),
      created_by: dbSale.created_by || '',
    };
  }
}

// Export singleton instance
export const supabaseSalesService = new SupabaseSalesService();
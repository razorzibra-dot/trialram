/**
 * Supabase Deals Service
 * Handles deal and opportunity operations via Supabase PostgreSQL
 * 
 * ✅ Uses 'deals' table (not 'sales' for transaction tracking)
 * ✅ Proper 8-layer sync with database schema
 */

import { supabase } from '@/services/supabase/client';
import { Deal, DealItem } from '@/types/crm';
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
   * ✅ Maps 'deals' table columns correctly
   * ✅ Handles nested deal_items relationship
   * ✅ Handles joined customer and user data for names
   * ✅ Removes non-existent payment/revenue fields
   */
  private toTypeScript(dbDeal: any): Deal {
    // Transform deal_items array to DealItem interface format
    // Map database columns to TypeScript interface:
    // - description → product_description
    // - discount_amount/discount_percentage → discount/discount_type
    // - tax_amount/tax_percentage → tax/tax_rate
    const items = Array.isArray(dbDeal.deal_items)
      ? dbDeal.deal_items.map((item: any) => ({
          id: item.id,
          deal_id: item.deal_id,
          product_id: item.product_id,
          service_id: item.service_id,
          product_name: item.product_name,
          product_description: item.description, // DB has 'description', not 'product_description'
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          // Map discount_amount/discount_percentage to discount/discount_type
          discount: Number(item.discount_percentage || item.discount_amount) || 0,
          discount_type: (item.discount_percentage > 0 ? 'percentage' : 'fixed') as 'fixed' | 'percentage',
          // Map tax_amount/tax_percentage to tax/tax_rate
          tax: Number(item.tax_amount) || 0,
          tax_rate: Number(item.tax_percentage) || 0,
          duration: item.duration,
          notes: item.notes,
          line_total: Number(item.line_total) || 0,
        }))
      : [];

    // Extract customer name from joined data or use stored value
    const customerName = dbDeal.customer?.company_name 
      || dbDeal.customer?.contact_name 
      || dbDeal.customer_name 
      || '';

    // Extract assigned user name from joined data or use stored value
    const assignedToName = dbDeal.assigned_user?.name 
      || dbDeal.assigned_to_name 
      || '';

    // ✅ Map all 'deals' table columns to Deal interface
    return {
      id: dbDeal.id,
      deal_number: dbDeal.deal_number,
      title: dbDeal.title,
      description: dbDeal.description,
      customer_id: dbDeal.customer_id,
      customer_name: customerName,
      value: Number(dbDeal.value) || 0,
      currency: dbDeal.currency || 'USD',
      status: dbDeal.status,
      source: dbDeal.source,
      campaign: dbDeal.campaign,
      close_date: dbDeal.close_date || '',
      expected_close_date: dbDeal.expected_close_date || '',
      assigned_to: dbDeal.assigned_to || '',
      assigned_to_name: assignedToName,
      notes: dbDeal.notes || '',
      tags: Array.isArray(dbDeal.tags) ? dbDeal.tags : [],
      competitor_info: dbDeal.competitor_info,
      win_loss_reason: dbDeal.win_loss_reason,
      items: items,
      deal_type: dbDeal.deal_type || 'PRODUCT',
      opportunity_id: dbDeal.opportunity_id,
      contract_id: dbDeal.contract_id,
      tenant_id: dbDeal.tenant_id,
      created_at: dbDeal.created_at,
      updated_at: dbDeal.updated_at,
      created_by: dbDeal.created_by
    };
  }

  /**
   * Transform TypeScript Deal to database insert payload
   * ✅ Maps Deal interface fields to 'deals' table columns ONLY
   * ✅ NEVER includes id for CREATE operations (database generates via gen_random_uuid())
   * ✅ NEVER includes items (handled separately by insertDealItems method)
   * ✅ NEVER includes system fields like created_at, updated_at, created_by (added by service)
   * ✅ Removes unsupported payment/revenue fields (not in 'deals' table)
   * ✅ Only includes defined fields (filters out undefined/null for optional fields)
   */
  private toDatabase(deal: Partial<Deal>, isCreate: boolean = false): any {
    const dbDeal: any = {};
    
    // ✅ CRITICAL: NEVER send id on INSERT - database generates via DEFAULT gen_random_uuid()
    if (!isCreate && deal.id !== undefined) {
      dbDeal.id = deal.id;
    }
    
    // Map only defined database columns
    // Only add field if it's defined (not undefined or null)
    // ✅ FIXED: Removed customer_name and assigned_to_name - these are VIRTUAL fields
    // populated from JOINs in toTypeScript(), NOT stored in deals table
    if (deal.deal_number !== undefined) dbDeal.deal_number = deal.deal_number;
    if (deal.title !== undefined) dbDeal.title = deal.title;
    if (deal.description !== undefined) dbDeal.description = deal.description;
    if (deal.customer_id !== undefined) dbDeal.customer_id = deal.customer_id;
    // ❌ REMOVED: customer_name - NOT a column in deals table (joined from customers)
    if (deal.value !== undefined) dbDeal.value = deal.value;
    if (deal.currency !== undefined) dbDeal.currency = deal.currency;
    if (deal.status !== undefined) dbDeal.status = deal.status;
    if (deal.deal_type !== undefined) dbDeal.deal_type = deal.deal_type;
    if (deal.source !== undefined) dbDeal.source = deal.source;
    if (deal.campaign !== undefined) dbDeal.campaign = deal.campaign;
    if (deal.close_date !== undefined) dbDeal.close_date = deal.close_date;
    if (deal.expected_close_date !== undefined) dbDeal.expected_close_date = deal.expected_close_date;
    if (deal.assigned_to !== undefined) dbDeal.assigned_to = deal.assigned_to;
    // ❌ REMOVED: assigned_to_name - NOT a column in deals table (joined from users)
    if (deal.notes !== undefined) dbDeal.notes = deal.notes;
    if (deal.tags !== undefined && deal.tags.length > 0) dbDeal.tags = deal.tags;
    if (deal.competitor_info !== undefined) dbDeal.competitor_info = deal.competitor_info;
    if (deal.win_loss_reason !== undefined) dbDeal.win_loss_reason = deal.win_loss_reason;
    if (deal.opportunity_id !== undefined) dbDeal.opportunity_id = deal.opportunity_id;
    if (deal.contract_id !== undefined) dbDeal.contract_id = deal.contract_id;
    if ((deal as any).converted_to_order_id !== undefined) dbDeal.converted_to_order_id = (deal as any).converted_to_order_id;
    if ((deal as any).converted_to_contract_id !== undefined) dbDeal.converted_to_contract_id = (deal as any).converted_to_contract_id;
    
    // ✅ NEVER include these in insert payload (added by service or handled separately):
    // - id (database generates via DEFAULT gen_random_uuid())
    // - items (handled separately by insertDealItems method)
    // - contract_id (set after deal creation if won)
    // - tenant_id (added by service)
    // - created_at, updated_at (added by service)
    // - created_by (added by service)
    // - payment_* fields (not in current schema)
    // - revenue_* fields (not in current schema)
    
    return dbDeal;
  }

  /**
   * Get all deals for the current tenant (with role-based filtering)
   */
  async getDeals(filters?: {
    assigned_to?: string;
    customer_id?: string;
    search?: string;
  }): Promise<Deal[]> {
    try {
      console.log('[Supabase Deals Service] 📥 getDeals() called with filters:', filters);
      
      const user = authService.getCurrentUser();
      console.log('[Supabase Deals Service] 👤 Current user:', user);
      
      if (!user) throw new Error('Unauthorized');

      const tenantId = this.getTenantId(user);
      
      // Join customer and assigned user data to get names
      let query = supabase
        .from(this.table)
        .select(`
          *,
          customer:customers(id, company_name, contact_name, email, phone),
          assigned_user:users!deals_assigned_to_fkey(id, name, email)
        `);

      query = this.addTenantFilter(query, tenantId);
      
      if (tenantId) {
        console.log('[Supabase Deals Service] 🔍 Filtering by tenant:', tenantId);
      } else {
        console.log('[Supabase Deals Service] 🔓 No tenant filter (super admin cross-tenant query)');
      }

      // Apply role-based filtering for agents
      if (user.role === 'agent') {
        query = query.eq('assigned_to', user.id);
        console.log('[Supabase Deals Service] 🎯 Filtering for agent:', user.id);
      }

      // Apply assigned_to filter
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
        console.log('[Supabase Deals Service] 👥 Filtering by assigned_to:', filters.assigned_to);
      }

      // Apply customer_id filter
      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
        console.log('[Supabase Deals Service] 🏢 Filtering by customer_id:', filters.customer_id);
      }

      const { data, error } = await query;

      console.log('[Supabase Deals Service] 📦 Query result - Data count:', data?.length || 0, 'Error:', error);
      console.log('[Supabase Deals Service] 📋 Raw data:', data);

      if (error) throw error;

      // Attach deal_items by fetching them separately (avoid PostgREST relationship cache issues)
      let deals = data || [];
      const dealIds = deals.map((d: any) => d.id).filter(Boolean);
      if (dealIds.length > 0) {
        let itemsQuery = supabase.from('deal_items').select('*').in('deal_id', dealIds as any[]);
        itemsQuery = this.addTenantFilter(itemsQuery, tenantId);
        const { data: itemsData, error: itemsError } = await itemsQuery;
        if (itemsError) throw itemsError;
        const itemsByDeal: Record<string, any[]> = (itemsData || []).reduce((acc: any, item: any) => {
          acc[item.deal_id] = acc[item.deal_id] || [];
          acc[item.deal_id].push(item);
          return acc;
        }, {});
        deals = deals.map((d: any) => ({ ...d, deal_items: itemsByDeal[d.id] || [] }));
      }
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        deals = deals.filter(d =>
          d.title?.toLowerCase().includes(search) ||
          d.customer_name?.toLowerCase().includes(search) ||
          d.description?.toLowerCase().includes(search)
        );
        console.log('[Supabase Deals Service] 🔎 After search filter:', deals.length, 'deals');
      }

      const transformed = deals.map(d => this.toTypeScript(d));
      console.log('[Supabase Deals Service] ✅ Returning', transformed.length, 'deals:', transformed);
      
      return transformed;
    } catch (error) {
      console.error('[Supabase Deals Service] ❌ Error fetching deals:', error);
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
      // Join customer and assigned user data to get names
      let query = supabase
        .from(this.table)
        .select(`
          *,
          customer:customers(id, company_name, contact_name, email, phone),
          assigned_user:users!deals_assigned_to_fkey(id, name, email)
        `)
        .eq('id', id);

      query = this.addTenantFilter(query, tenantId);
      const { data, error } = await query.single();

      if (error) throw error;
      if (!data) throw new Error('Deal not found');

      // Check permissions for agents
      if (user.role === 'agent' && data.assigned_to !== user.id) {
        throw new Error('Access denied');
      }

      // Fetch deal items separately
      let itemsQuery = supabase.from('deal_items').select('*').eq('deal_id', id);
      itemsQuery = this.addTenantFilter(itemsQuery, tenantId);
      const { data: itemsData, error: itemsError } = await itemsQuery;
      if (itemsError) throw itemsError;
      data.deal_items = itemsData || [];

      console.log('[Supabase Deals Service] 📦 Fetched deal with items:', {
        dealId: data.id,
        itemsCount: data.deal_items?.length || 0,
        items: data.deal_items
      });

      return this.toTypeScript(data);
    } catch (error) {
      console.error('[Supabase Deals Service] ❌ Error fetching deal:', error);
      throw error;
    }
  }

  /**
   * Create a new deal
   * ✅ PROPER FLOW: Exclude id, extract items, let database generate uuid
   */
  async createDeal(dealData: Omit<Deal, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<Deal> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      if (!authService.hasPermission('write')) {
        throw new Error('Insufficient permissions');
      }

      const tenantId = this.getTenantId(user);
      const now = new Date().toISOString();
      
      // ✅ Extract items BEFORE building payload (handle separately)
      const items = dealData.items || [];

      // ✅ Validate deal_type presence
      if (!('deal_type' in dealData) || (dealData as any).deal_type == null) {
        throw new Error('deal_type is required and must be PRODUCT or SERVICE');
      }
      
      // ✅ REQUIRED FIELDS DEFAULTS:
      // - assigned_to: NOT NULL in schema, must default to current user
      // - close_date: NOT NULL in schema, must always be provided
      // - status: NOT NULL with CHECK constraint, must be valid
      if (!dealData.assigned_to) {
        dealData.assigned_to = user.id;
      }

      // ✅ Guard required fields before hitting RPC/DB
      const sanitizedTitle = (dealData.title || '').trim();
      if (!sanitizedTitle) {
        throw new Error('Title is required');
      }
      dealData.title = sanitizedTitle || 'Untitled Deal';

      // Normalize and require customer_id (supports camelCase just in case)
      const normalizedCustomerId = (dealData.customer_id || (dealData as any).customerId || '').toString().trim();
      if (!normalizedCustomerId) {
        throw new Error('Customer is required');
      }
      dealData.customer_id = normalizedCustomerId;

      // ✅ Ensure close_date and value have safe defaults
      if (!dealData.close_date) {
        dealData.close_date = new Date().toISOString().split('T')[0];
      }
      if (dealData.value === undefined || dealData.value === null) {
        dealData.value = 0;
      }
      
      // ✅ Build database payload following customer service pattern:
      // - Only include defined fields from toDatabase
      // - Let database generate id via DEFAULT gen_random_uuid()
      // - Add system fields: tenant_id, created_at, updated_at, created_by
      // - NEVER send: id, items (both handled separately)
      const dbPayload = this.toDatabase(dealData, true);
      
      const newDeal = {
        ...dbPayload,
        tenant_id: tenantId,
        created_at: now,
        updated_at: now,
        created_by: user.id
      };

      // ✅ CRITICAL: Remove all undefined fields to prevent Supabase from converting to null
      Object.keys(newDeal).forEach(key => {
        if (newDeal[key] === undefined) {
          delete newDeal[key];
        }
      });

      console.log('[Supabase Deals Service] Creating deal with payload:', newDeal);
      console.log('[Supabase Deals Service] Payload keys:', Object.keys(newDeal));
      console.log('[Supabase Deals Service] assigned_to:', newDeal.assigned_to);
      console.log('[Supabase Deals Service] close_date:', newDeal.close_date);
      console.log('[Supabase Deals Service] status:', newDeal.status);

      // Try RPC-based atomic create first (database-side transaction)
      try {
        const rpcPayload = {
          ...newDeal,
          dealType: (dealData as any).deal_type || newDeal.deal_type,
          items: items || [],
          created_by: user.id
        };
        
        console.log('[Supabase Deals Service] 📋 RPC Payload (object):', rpcPayload);
        console.log('[Supabase Deals Service] 📋 RPC Payload title:', rpcPayload.title, 'customer_id:', rpcPayload.customer_id);
        
        const rpcBody = {
          p_json: rpcPayload, // pass object directly (Supabase will send as JSON)
          p_tenant: tenantId
        };

        console.log('[Supabase Deals Service] Attempting RPC create_deal_with_items with body:', rpcBody);
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_deal_with_items', rpcBody as any);
        if (!rpcError && rpcData) {
          // rpcData shape varies; attempt to extract UUID robustly
          let createdId: string | null = null;
          if (typeof rpcData === 'string') createdId = rpcData as string;
          else if (Array.isArray(rpcData) && rpcData.length > 0) {
            const first = rpcData[0] as any;
            if (typeof first === 'string') createdId = first;
            else if (first && typeof first === 'object') createdId = (first.create_deal_with_items as string) || Object.values(first)[0];
          } else if (rpcData && typeof rpcData === 'object') {
            createdId = (rpcData as any).create_deal_with_items || Object.values(rpcData)[0];
          }

          if (createdId) {
            console.log('[Supabase Deals Service] RPC created deal id:', createdId);
            return this.getDeal(createdId as string);
          }
        }
        if (rpcError) console.warn('[Supabase Deals Service] RPC error, falling back to client-side inserts:', rpcError);
      } catch (rpcEx) {
        console.warn('[Supabase Deals Service] RPC create failed, falling back:', rpcEx);
      }

      // Fallback: sequential insert (legacy behavior)
      const { data, error } = await supabase
        .from(this.table)
        .insert([newDeal])
        .select()
        .single();

      if (error) throw error;
      
      // ✅ Insert deal items separately if provided
      if (items.length > 0 && data?.id) {
        console.log('[Supabase Deals Service] Adding', items.length, 'items to deal', data.id);
        await this.insertDealItems(data.id, items);
      }
      
      console.log('[Supabase Deals Service] ✅ Deal created:', data.id);
      return this.toTypeScript(data);
    } catch (error) {
      console.error('[Supabase Deals Service] ❌ Error creating deal:', error);
      throw error;
    }
  }

  /**
   * Insert deal items for a deal
   * ✅ Handles items separately, never in main deal insert
   * ✅ EXPLICIT FIELD MAPPING - Only includes columns that exist in deal_items table
   */
  private async insertDealItems(dealId: string, items: DealItem[]): Promise<void> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      const tenantId = this.getTenantId(user);
      const userId = user.id;
      const now = new Date().toISOString();

      // ✅ EXPLICIT FIELD MAPPING - Map to actual database columns
      // deal_items table has: id, deal_id, product_id, service_id, product_name, description,
      // quantity, unit_price, discount_amount, discount_percentage, tax_amount, tax_percentage,
      // line_total, tenant_id, created_at, updated_at, created_by, updated_by
      const itemsToInsert = items.map(item => ({
        deal_id: dealId,
        product_id: item.product_id || null,
        service_id: item.service_id || null,
        product_name: item.product_name,
        description: item.product_description || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        // Map discount to discount_amount (fixed amount) or discount_percentage
        discount_amount: item.discount_type === 'fixed' ? (item.discount || 0) : 0,
        discount_percentage: item.discount_type === 'percentage' ? (item.discount || 0) : 0,
        // Map tax to tax_amount (fixed amount) or tax_percentage (rate)
        tax_amount: item.tax || 0,
        tax_percentage: item.tax_rate || 0,
        line_total: item.line_total,
        tenant_id: tenantId,
        created_at: now,
        updated_at: now,
        created_by: userId,
        updated_by: userId
      }));

      const { error } = await supabase
        .from('deal_items')
        .insert(itemsToInsert);

      if (error) throw error;
    } catch (error) {
      console.error('[Supabase Deals Service] ❌ Error inserting deal items:', error);
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

      // Normalize updates to avoid undefined access errors
      const safeUpdates = (updates || {}) as Partial<Deal> & Record<string, any>;

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

      // Prevent changing deal_type (accept both snake_case and camelCase)
      const incomingDealType = safeUpdates.deal_type ?? safeUpdates.dealType;
      if (incomingDealType !== undefined && incomingDealType !== existingDeal.deal_type) {
        throw new Error('deal_type is immutable and cannot be changed after creation');
      }

      // Handle items update separately if provided
      const itemsToUpdate = safeUpdates.items as DealItem[] | undefined;
      // Remove items from updates before mapping to DB for deal row
      const updatesForDeal = { ...safeUpdates } as Partial<Deal> & Record<string, any>;
      if (itemsToUpdate) {
        delete updatesForDeal.items;
      }
      // Ensure deal_type isn't sent in updates
      delete updatesForDeal.deal_type;
      delete updatesForDeal.dealType;

      const dbUpdates = {
        ...this.toDatabase(updatesForDeal),
        updated_at: new Date().toISOString()
      };

      console.log('[Supabase Deals Service] 📝 updateDeal - id:', id, 'dbUpdates:', dbUpdates, 'itemsToUpdate:', itemsToUpdate?.length || 0);

      // Try RPC-based atomic update first (database-side transaction)
      try {
        const rpcPayload = {
          id,
          ...dbUpdates,
          items: itemsToUpdate || [],
          updated_by: user.id
        };
        const rpcBody = {
          // Pass object directly (consistent with createDeal)
          p_json: rpcPayload,
          p_tenant: tenantId
        };
        console.log('[Supabase Deals Service] 🔄 Attempting RPC update_deal_with_items with body:', rpcBody);
        const { data: rpcData, error: rpcError } = await supabase.rpc('update_deal_with_items', rpcBody as any);
        
        if (rpcError) {
          console.warn('[Supabase Deals Service] ⚠️ RPC update error, falling back:', rpcError);
        } else if (rpcData) {
          console.log('[Supabase Deals Service] ✅ RPC update succeeded for deal:', id, 'response:', rpcData);
          const updated = await this.getDeal(id);
          console.log('[Supabase Deals Service] ✅ Retrieved updated deal:', updated?.id);
          return updated;
        } else {
          console.warn('[Supabase Deals Service] ⚠️ RPC returned no data, falling back');
        }
      } catch (rpcEx) {
        console.error('[Supabase Deals Service] ❌ RPC update exception, falling back:', rpcEx);
      }

      // Fallback: legacy client-side update + items replace
      console.log('[Supabase Deals Service] 📌 Using fallback client-side update for deal:', id);
      let updateQuery = supabase
        .from(this.table)
        .update(dbUpdates)
        .eq('id', id);
      updateQuery = this.addTenantFilter(updateQuery, tenantId);
      
      const { data, error } = await updateQuery.select().single();

      if (error) {
        console.error('[Supabase Deals Service] ❌ Fallback update query failed:', error);
        throw error;
      }

      console.log('[Supabase Deals Service] ✅ Fallback update succeeded, data:', data?.id);

      // If items were passed, replace existing items (simple transactional behavior)
      if (itemsToUpdate && itemsToUpdate.length > 0 && data?.id) {
        console.log('[Supabase Deals Service] 📌 Deleting and re-inserting', itemsToUpdate.length, 'items for deal:', id);
        // Delete existing items for this deal for current tenant
        let delQuery = supabase.from('deal_items').delete().eq('deal_id', id);
        delQuery = this.addTenantFilter(delQuery, tenantId);
        const { error: delError } = await delQuery;
        if (delError) {
          console.error('[Supabase Deals Service] ❌ Failed to delete existing items:', delError);
          throw delError;
        }
        console.log('[Supabase Deals Service] ✅ Existing items deleted');

        // Insert new items
        await this.insertDealItems(id, itemsToUpdate);
        console.log('[Supabase Deals Service] ✅ New items inserted');
      }

      const finalDeal = this.toTypeScript(data);
      console.log('[Supabase Deals Service] ✅ Deal updated successfully:', finalDeal?.id);
      return finalDeal;
    } catch (error) {
      console.error('[Supabase Deals Service] ❌ Error updating deal:', error);
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
      console.error('[Supabase Deals Service] ❌ Error deleting deal:', error);
      throw error;
    }
  }

  // NOTE: getStages(), getPipelineStats(), and getPipelineStages() removed.
  // Deals have status (won/lost/cancelled), not pipeline stages.
  // Pipeline stages belong to Opportunities. See types/crm.ts for reference.

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

  // NOTE: getPipelineStages() removed - Deals have status (won/lost/cancelled), not pipeline stages.

  /**
   * Get sales analytics - Uses Deal status (won/lost/cancelled) not pipeline stages
   */
  async getSalesAnalytics(period?: string): Promise<Record<string, unknown>> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      const tenantId = this.getTenantId(user);
      let query = supabase
        .from(this.table)
        // Minimal column list for aggregation; include status/value for metrics
        .select('id, value, status', { count: 'exact' });

      query = this.addTenantFilter(query, tenantId);

      // Apply role-based filtering for agents
      if (user.role === 'agent') {
        query = query.eq('assigned_to', user.id);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const deals = data || [];
      const totalDeals = typeof count === 'number' ? count : deals.length;
      const totalValue = deals.reduce((sum: number, deal: any) => sum + (Number(deal.value) || 0), 0);
      const wonDeals = deals.filter((d: any) => d.status === 'won');
      const lostDeals = deals.filter((d: any) => d.status === 'lost');
      const cancelledDeals = deals.filter((d: any) => d.status === 'cancelled');
      // Deals without status are considered active/open
      const activeDeals = deals.filter((d: any) => !d.status || !['won', 'lost', 'cancelled'].includes(d.status));

      const metrics = {
        totalDeals,
        total: totalDeals, // alias for legacy UI expecting `total`
        totalValue,
        wonDeals: wonDeals.length,
        wonValue: wonDeals.reduce((sum: number, deal: any) => sum + (Number(deal.value) || 0), 0),
        lostDeals: lostDeals.length,
        lostValue: lostDeals.reduce((sum: number, deal: any) => sum + (Number(deal.value) || 0), 0),
        cancelledDeals: cancelledDeals.length,
        cancelledValue: cancelledDeals.reduce((sum: number, deal: any) => sum + (Number(deal.value) || 0), 0),
        activeDeals: activeDeals.length,
        activeValue: activeDeals.reduce((sum: number, deal: any) => sum + (Number(deal.value) || 0), 0),
        conversionRate: totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0,
        averageDealSize: wonDeals.length > 0 ? wonDeals.reduce((sum: number, deal: any) => sum + (Number(deal.value) || 0), 0) / wonDeals.length : 0
      } as Record<string, unknown>;

      console.log('[Supabase Deals Service] 📊 Sales analytics', {
        tenantId,
        role: user.role,
        count: totalDeals,
        totalValue: metrics.totalValue,
        won: metrics.wonDeals,
        lost: metrics.lostDeals,
        cancelled: metrics.cancelledDeals,
        active: metrics.activeDeals
      });

      return metrics;
    } catch (error) {
      console.error('[Supabase Deals Service] ❌ Error fetching sales analytics:', error);
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
        .select('*')
        .eq('customer_id', customerId);

      query = this.addTenantFilter(query, tenantId);

      // Apply role-based filtering for agents
      if (user.role === 'agent') {
        query = query.eq('assigned_to', user.id);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Attach deal_items by fetching them separately
      let dealsRaw = data || [];
      const dealIds = dealsRaw.map((d: any) => d.id).filter(Boolean);
      if (dealIds.length > 0) {
        let itemsQuery = supabase.from('deal_items').select('*').in('deal_id', dealIds as any[]);
        itemsQuery = this.addTenantFilter(itemsQuery, tenantId);
        const { data: itemsData, error: itemsError } = await itemsQuery;
        if (itemsError) throw itemsError;
        const itemsByDeal: Record<string, any[]> = (itemsData || []).reduce((acc: any, item: any) => {
          acc[item.deal_id] = acc[item.deal_id] || [];
          acc[item.deal_id].push(item);
          return acc;
        }, {});
        dealsRaw = dealsRaw.map((d: any) => ({ ...d, deal_items: itemsByDeal[d.id] || [] }));
      }

      const deals = (dealsRaw || []).map(d => this.toTypeScript(d));
      return {
        data: deals,
        page: 1,
        pageSize: deals.length,
        total: count || deals.length,
        totalPages: 1
      };
    } catch (error) {
      console.error('[Supabase Deals Service] ❌ Error fetching deals by customer:', error);
      throw error;
    }
  }

  async getSalesStats(): Promise<Record<string, unknown>> {
    return this.getSalesAnalytics();
  }

  // NOTE: getDealStages and updateDealStage removed - Deals have status (won/lost/cancelled), not pipeline stages.
  // Pipeline stages belong to Opportunities. See types/crm.ts for reference.

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
      console.error('[Supabase Deals Service] ❌ Error bulk updating deals:', error);
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
      console.error('[Supabase Deals Service] ❌ Error bulk deleting deals:', error);
      throw error;
    }
  }

  /**
   * Handle deal closure conversions
   * - For PRODUCT deals: create `sales_orders` record and update `deals.converted_to_order_id`
   * - For SERVICE deals: create `service_contracts` record and update `deals.converted_to_contract_id`
   * Idempotent: will not create duplicate downstream records if conversion id exists
   */
  async handleDealClosure(dealId: string): Promise<Deal> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Unauthorized');

      const tenantId = this.getTenantId(user);

      // Fetch current deal
      let fetchQuery = supabase.from(this.table).select('*').eq('id', dealId);
      fetchQuery = this.addTenantFilter(fetchQuery, tenantId);
      const { data: existingDeal, error: fetchError } = await fetchQuery.single();
      if (fetchError || !existingDeal) throw new Error('Deal not found');

      // If already converted, return latest
      if (existingDeal.converted_to_order_id || existingDeal.converted_to_contract_id) {
        // Refresh items and return
        let itemsQuery = supabase.from('deal_items').select('*').eq('deal_id', dealId);
        itemsQuery = this.addTenantFilter(itemsQuery, tenantId);
        const { data: itemsData } = await itemsQuery;
        existingDeal.deal_items = itemsData || [];
        return this.toTypeScript(existingDeal);
      }

      // Only proceed if deal is won (or allow manual conversion)
      if (existingDeal.status !== 'won') {
        throw new Error('Only won deals can be converted');
      }

      // Create downstream record depending on deal_type
      if (existingDeal.deal_type === 'PRODUCT') {
        // Create sales_order
        const now = new Date().toISOString();
        const orderPayload: any = {
          customer_id: existingDeal.customer_id,
          deal_id: existingDeal.id,
          value: existingDeal.value || 0,
          currency: existingDeal.currency || 'USD',
          tenant_id: tenantId,
          created_at: now,
          updated_at: now
        };

        const { data: orderData, error: orderError } = await supabase.from('sales_orders').insert([orderPayload]).select().single();
        if (orderError) throw orderError;

        // Update deal with conversion id
        let updQ = supabase.from(this.table).update({ converted_to_order_id: orderData.id, updated_at: now }).eq('id', dealId);
        updQ = this.addTenantFilter(updQ, tenantId);
        const { error: updError } = await updQ;
        if (updError) throw updError;
      } else if (existingDeal.deal_type === 'SERVICE') {
        const now = new Date().toISOString();
        const contractPayload: any = {
          title: `Contract from deal ${existingDeal.deal_number || existingDeal.id}`,
          description: existingDeal.description || '',
          customer_id: existingDeal.customer_id,
          deal_id: existingDeal.id,
          value: existingDeal.value || 0,
          currency: existingDeal.currency || 'USD',
          tenant_id: tenantId,
          status: 'active',
          created_at: now,
          updated_at: now
        };

        const { data: contractData, error: contractError } = await supabase.from('service_contracts').insert([contractPayload]).select().single();
        if (contractError) throw contractError;

        let updQ = supabase.from(this.table).update({ converted_to_contract_id: contractData.id, updated_at: now }).eq('id', dealId);
        updQ = this.addTenantFilter(updQ, tenantId);
        const { error: updError } = await updQ;
        if (updError) throw updError;
      }

      // Reload deal with items and return
      let itemsQ = supabase.from('deal_items').select('*').eq('deal_id', dealId);
      itemsQ = this.addTenantFilter(itemsQ, tenantId);
      const { data: itemsReload } = await itemsQ;
      const dealFetch = await supabase.from(this.table).select('*').eq('id', dealId).single();
      const resultDeal = (dealFetch.data || existingDeal);
      resultDeal.deal_items = itemsReload || [];
      return this.toTypeScript(resultDeal);
    } catch (error) {
      console.error('[Supabase Deals Service] ❌ Error in handleDealClosure:', error);
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
        .select('*');

      q = this.addTenantFilter(q, tenantId);

      // Apply role-based filtering for agents
      if (user.role === 'agent') {
        q = q.eq('assigned_to', user.id);
      }

      const { data, error } = await q;

      if (error) throw error;

      // Attach deal_items by fetching them separately
      let dealsRaw = data || [];
      const dealIds = dealsRaw.map((d: any) => d.id).filter(Boolean);
      if (dealIds.length > 0) {
        let itemsQuery = supabase.from('deal_items').select('*').in('deal_id', dealIds as any[]);
        itemsQuery = this.addTenantFilter(itemsQuery, tenantId);
        const { data: itemsData, error: itemsError } = await itemsQuery;
        if (itemsError) throw itemsError;
        const itemsByDeal: Record<string, any[]> = (itemsData || []).reduce((acc: any, item: any) => {
          acc[item.deal_id] = acc[item.deal_id] || [];
          acc[item.deal_id].push(item);
          return acc;
        }, {});
        dealsRaw = dealsRaw.map((d: any) => ({ ...d, deal_items: itemsByDeal[d.id] || [] }));
      }

      const deals = (dealsRaw || []).map(d => this.toTypeScript(d));

      // Client-side search across title, customer_name, and description
      return deals.filter(d =>
        d.title.toLowerCase().includes(searchQuery) ||
        d.customer_name?.toLowerCase().includes(searchQuery) ||
        d.description.toLowerCase().includes(searchQuery)
      );
    } catch (error) {
      console.error('[Supabase Deals Service] ❌ Error searching deals:', error);
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
        const headers = ['ID', 'Title', 'Customer', 'Value', 'Status', 'Deal Type', 'Assigned To'];
        const rows = deals.map(d => [
          d.id,
          d.title,
          d.customer_name,
          d.value,
          d.status,
          d.deal_type,
          d.assigned_to_name
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell ?? ''}"`).join(','))
        ].join('\n');

        return csvContent;
      } else {
        return JSON.stringify(deals, null, 2);
      }
    } catch (error) {
      console.error('[Supabase Deals Service] ❌ Error exporting deals:', error);
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
      console.error('[Supabase Deals Service] ❌ Error importing deals:', error);
      throw error;
    }
  }

  // ============================================================
  // Payment Processing Methods
  // ============================================================

  async processPayment(_dealId: string, _paymentData: {
    amount: number;
    payment_date: string;
    payment_method: string;
    reference_number?: string;
    notes?: string;
  }): Promise<Deal> {
    // Payment processing should be implemented in a dedicated payments service
    // The 'deals' table schema does not include payment columns in this project.
    throw new Error('Payment processing is not supported in dealsService. Use the payments service instead.');
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

      // Payment status updates should be performed by a payments service.
      throw new Error('Updating payment status on deals is not supported. Use the payments service.');
    } catch (error) {
      console.error('[Supabase Deals Service] ❌ Error updating payment status:', error);
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

      if (user.role === 'agent' && existingDeal.assigned_to !== user.id) {
        throw new Error('Access denied');
      }

      // Revenue recognition must be handled by a dedicated revenue service/table.
      throw new Error('Revenue recognition is not supported in dealsService. Use the revenue service instead.');
    } catch (error) {
      console.error('[Supabase Deals Service] ❌ Error recognizing revenue:', error);
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
      console.error('[Supabase Deals Service] ❌ Error creating revenue schedule:', error);
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
      console.error('[Supabase Deals Service] ❌ Error fetching revenue schedule:', error);
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
      console.error('[Supabase Deals Service] ❌ Error linking contract:', error);
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
        .select('*')
        .eq('contract_id', contractId);

      query = this.addTenantFilter(query, tenantId);

      // Apply role-based filtering for agents
      if (user.role === 'agent') {
        query = query.eq('assigned_to', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Attach deal_items by fetching them separately
      let dealsRaw = data || [];
      const dealIds = dealsRaw.map((d: any) => d.id).filter(Boolean);
      if (dealIds.length > 0) {
        let itemsQuery = supabase.from('deal_items').select('*').in('deal_id', dealIds as any[]);
        itemsQuery = this.addTenantFilter(itemsQuery, tenantId);
        const { data: itemsData, error: itemsError } = await itemsQuery;
        if (itemsError) throw itemsError;
        const itemsByDeal: Record<string, any[]> = (itemsData || []).reduce((acc: any, item: any) => {
          acc[item.deal_id] = acc[item.deal_id] || [];
          acc[item.deal_id].push(item);
          return acc;
        }, {});
        dealsRaw = dealsRaw.map((d: any) => ({ ...d, deal_items: itemsByDeal[d.id] || [] }));
      }

      return (dealsRaw || []).map(d => this.toTypeScript(d));
    } catch (error) {
      console.error('[Supabase Deals Service] ❌ Error fetching deals by contract:', error);
      throw error;
    }
  }

  /**
   * Get contracts linked to a deal
   * ✅ Defensive implementation - returns empty array if contract_id column doesn't exist
   */
  async getContractsForDeal(dealId: string): Promise<Array<{ id: string; title: string; status: string; created_at: string }>> {
    try {
      // Note: Contracts are typically linked via deal.contract_id column
      // If this relationship doesn't exist in your schema, this method safely returns empty array
      // To implement deal-contract linking:
      // 1. Ensure deals table has contract_id UUID column
      // 2. Or query a deal_contracts junction table if using many-to-many
      
      console.log('[Supabase Deals Service] 📌 getContractsForDeal called for deal:', dealId);
      
      // For now, return empty array to avoid blocking the UI
      // In a production setup, you'd query: SELECT * FROM contracts WHERE deal_id = dealId
      // Or if contracts are linked via deal.contract_id: GET deal.contract_id first, then fetch contract
      
      return [];
    } catch (error) {
      console.error('[Supabase Deals Service] ❌ Error fetching contracts for deal:', error);
      return [];
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
      console.error('[Supabase Deals Service] ❌ Error creating contract from deal:', error);
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
      console.error('[Supabase Deals Service] ❌ Error converting deal to contract:', error);
      throw error;
    }
  }
}

export const supabaseDealsService = new SupabaseDealsService();
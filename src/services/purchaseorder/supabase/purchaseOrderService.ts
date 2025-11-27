/**
 * Supabase Purchase Order Service
 * Handles purchase orders for inventory restocking
 */

import { supabase as supabaseClient } from '@/services/supabase/client';
import { authService } from '../../serviceFactory';
import { PurchaseOrder, PurchaseOrderFormData, PurchaseOrderFilters, PurchaseOrderStats } from '@/types/masters';

export class SupabasePurchaseOrderService {
  /**
   * Get purchase orders with filtering and pagination
   * ⭐ SECURITY: Enforces tenant isolation - only returns orders from current user's tenant
   */
  async getPurchaseOrders(filters?: PurchaseOrderFilters): Promise<{ data: PurchaseOrder[]; total: number; page: number; pageSize: number }> {
    try {
      // ⭐ SECURITY: Get current tenant for isolation
      const currentUser = authService.getCurrentUser();
      const currentTenantId = authService.getCurrentTenantId();

      if (!currentTenantId && currentUser?.role !== 'super_admin') {
        throw new Error('Access denied: No tenant context');
      }

      let query = supabaseClient
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(*),
          items:purchase_order_items(
            *,
            product:products(id, name, sku)
          )
        `);

      // ⭐ SECURITY: Apply tenant isolation - non-super-admins only see their tenant's orders
      if (currentUser?.role !== 'super_admin') {
        query = query.eq('tenant_id', currentTenantId);
      } else if (filters?.supplier_id) {
        // Super admins can filter by specific tenant if requested
        // For now, we'll keep it simple
      }

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }
      if (filters?.date_from) {
        query = query.gte('order_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('order_date', filters.date_to);
      }

      // Exclude deleted records
      query = query.is('deleted_at', null);

      // Apply pagination
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query.range(from, to);

      const { data, error, count } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedData = data?.map((po: any) => this.mapPurchaseOrderResponse(po)) || [];

      return {
        data: mappedData,
        total: count || 0,
        page,
        pageSize
      };
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  }

  /**
   * Get purchase order by ID
   * ⭐ SECURITY: Enforces tenant isolation - can only access orders from own tenant
   */
  async getPurchaseOrder(id: string): Promise<PurchaseOrder> {
    try {
      // ⭐ SECURITY: Get current tenant for isolation
      const currentUser = authService.getCurrentUser();
      const currentTenantId = authService.getCurrentTenantId();

      if (!currentTenantId && currentUser?.role !== 'super_admin') {
        throw new Error('Access denied: No tenant context');
      }

      let query = supabaseClient
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(*),
          items:purchase_order_items(
            *,
            product:products(id, name, sku)
          )
        `)
        .eq('id', id);

      // ⭐ SECURITY: Apply tenant isolation - non-super-admins only see their tenant's orders
      if (currentUser?.role !== 'super_admin') {
        query = query.eq('tenant_id', currentTenantId);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      if (!data) throw new Error('Purchase order not found');

      return this.mapPurchaseOrderResponse(data);
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      throw error;
    }
  }

  /**
   * Create new purchase order
   * ⭐ SECURITY: Enforces tenant isolation - orders are created in current user's tenant
   */
  async createPurchaseOrder(data: PurchaseOrderFormData): Promise<PurchaseOrder> {
    try {
      // ⭐ SECURITY: Get current tenant and validate access
      const currentUser = authService.getCurrentUser();
      const currentTenantId = authService.getCurrentTenantId();

      if (!currentTenantId && currentUser?.role !== 'super_admin') {
        throw new Error('Access denied: No tenant context');
      }

      // Generate PO number
      const poNumber = await this.generatePONumber();

      // Calculate total amount
      const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_price), 0);

      const { data: created, error } = await supabaseClient
        .from('purchase_orders')
        .insert([{
          po_number: poNumber,
          supplier_id: data.supplier_id,
          status: 'draft',
          order_date: data.order_date,
          expected_delivery_date: data.expected_delivery_date,
          total_amount: totalAmount,
          currency: data.currency || 'USD',
          notes: data.notes,
          ordered_by: currentUser?.id,
          ordered_at: new Date().toISOString(),
          tenant_id: currentTenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      // Create purchase order items
      const itemsData = data.items.map(item => ({
        purchase_order_id: created.id,
        product_id: item.product_id,
        quantity_ordered: item.quantity_ordered,
        quantity_received: 0,
        unit_price: item.unit_price,
        total_price: item.quantity_ordered * item.unit_price,
        notes: item.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: itemsError } = await supabaseClient
        .from('purchase_order_items')
        .insert(itemsData);

      if (itemsError) throw itemsError;

      // Fetch the complete order with items
      return this.getPurchaseOrder(created.id);
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  }

  /**
   * Update purchase order
   * ⭐ SECURITY: Enforces tenant isolation - can only update orders from own tenant
   */
  async updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    try {
      // ⭐ SECURITY: Get current tenant and validate access to the order
      const currentUser = authService.getCurrentUser();
      const currentTenantId = authService.getCurrentTenantId();

      if (!currentTenantId && currentUser?.role !== 'super_admin') {
        throw new Error('Access denied: No tenant context');
      }

      // ⭐ SECURITY: First verify the order exists and belongs to accessible tenant
      let verifyQuery = supabaseClient
        .from('purchase_orders')
        .select('tenant_id')
        .eq('id', id)
        .is('deleted_at', null);

      // Apply tenant filter for non-super-admins
      if (currentUser?.role !== 'super_admin') {
        verifyQuery = verifyQuery.eq('tenant_id', currentTenantId);
      }

      const { data: existingOrder, error: verifyError } = await verifyQuery.single();

      if (verifyError || !existingOrder) {
        throw new Error('Purchase order not found or access denied');
      }

      // ⭐ SECURITY: Validate tenant access
      authService.assertTenantAccess(existingOrder.tenant_id);

      let updateQuery = supabaseClient
        .from('purchase_orders')
        .update({
          status: updates.status,
          expected_delivery_date: updates.expected_delivery_date,
          actual_delivery_date: updates.actual_delivery_date,
          notes: updates.notes,
          approved_by: updates.approved_by,
          approved_at: updates.approved_at,
          received_by: updates.received_by,
          received_at: updates.received_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      // Apply tenant filter for non-super-admins
      if (currentUser?.role !== 'super_admin') {
        updateQuery = updateQuery.eq('tenant_id', currentTenantId);
      }

      const { error } = await updateQuery;

      if (error) throw error;

      return this.getPurchaseOrder(id);
    } catch (error) {
      console.error('Error updating purchase order:', error);
      throw error;
    }
  }

  /**
   * Delete purchase order (soft delete)
   * ⭐ SECURITY: Enforces tenant isolation - can only delete orders from own tenant
   */
  async deletePurchaseOrder(id: string): Promise<void> {
    try {
      // ⭐ SECURITY: Get current tenant and validate access to the order
      const currentUser = authService.getCurrentUser();
      const currentTenantId = authService.getCurrentTenantId();

      if (!currentTenantId && currentUser?.role !== 'super_admin') {
        throw new Error('Access denied: No tenant context');
      }

      // ⭐ SECURITY: First verify the order exists and belongs to accessible tenant
      let verifyQuery = supabaseClient
        .from('purchase_orders')
        .select('tenant_id')
        .eq('id', id)
        .is('deleted_at', null);

      // Apply tenant filter for non-super-admins
      if (currentUser?.role !== 'super_admin') {
        verifyQuery = verifyQuery.eq('tenant_id', currentTenantId);
      }

      const { data: existingOrder, error: verifyError } = await verifyQuery.single();

      if (verifyError || !existingOrder) {
        throw new Error('Purchase order not found or access denied');
      }

      // ⭐ SECURITY: Validate tenant access
      authService.assertTenantAccess(existingOrder.tenant_id);

      let deleteQuery = supabaseClient
        .from('purchase_orders')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      // Apply tenant filter for non-super-admins
      if (currentUser?.role !== 'super_admin') {
        deleteQuery = deleteQuery.eq('tenant_id', currentTenantId);
      }

      const { error } = await deleteQuery;

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      throw error;
    }
  }

  /**
   * Approve purchase order
   */
  async approvePurchaseOrder(id: string): Promise<PurchaseOrder> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('Unauthorized');

    return this.updatePurchaseOrder(id, {
      status: 'approved',
      approved_by: currentUser.id,
      approved_at: new Date().toISOString()
    });
  }

  /**
   * Receive purchase order items
   */
  async receivePurchaseOrder(id: string, receivedItems: Array<{ itemId: string; quantityReceived: number }>): Promise<PurchaseOrder> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error('Unauthorized');

      // Update received quantities
      for (const { itemId, quantityReceived } of receivedItems) {
        const { error } = await supabaseClient
          .from('purchase_order_items')
          .update({
            quantity_received: quantityReceived,
            updated_at: new Date().toISOString()
          })
          .eq('id', itemId);

        if (error) throw error;
      }

      // Check if all items are received and update order status
      const order = await this.getPurchaseOrder(id);
      const allReceived = order.items?.every(item => item.quantity_received >= item.quantity_ordered) ?? false;
      const partiallyReceived = order.items?.some(item => item.quantity_received > 0) ?? false;

      let newStatus: PurchaseOrder['status'];
      if (allReceived) {
        newStatus = 'received';
      } else if (partiallyReceived) {
        newStatus = 'partially_received';
      } else {
        newStatus = 'ordered';
      }

      return this.updatePurchaseOrder(id, {
        status: newStatus,
        received_by: currentUser.id,
        received_at: newStatus === 'received' ? new Date().toISOString() : undefined
      });
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      throw error;
    }
  }

  /**
   * Get purchase order statistics
   */
  async getPurchaseOrderStats(): Promise<PurchaseOrderStats> {
    try {
      // ⭐ SECURITY: Get current tenant for isolation
      const currentUser = authService.getCurrentUser();
      const currentTenantId = authService.getCurrentTenantId();

      if (!currentTenantId && currentUser?.role !== 'super_admin') {
        throw new Error('Access denied: No tenant context');
      }

      let query = supabaseClient
        .from('purchase_orders')
        .select('status, total_amount, supplier_id, suppliers(name)')
        .is('deleted_at', null);

      // Apply tenant filter for non-super-admins
      if (currentUser?.role !== 'super_admin') {
        query = query.eq('tenant_id', currentTenantId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats: PurchaseOrderStats = {
        total_orders: data?.length || 0,
        pending_orders: data?.filter(po => po.status === 'pending_approval').length || 0,
        approved_orders: data?.filter(po => po.status === 'approved').length || 0,
        received_orders: data?.filter(po => po.status === 'received').length || 0,
        total_value: data?.reduce((sum, po) => sum + (po.total_amount || 0), 0) || 0,
        average_order_value: 0,
        orders_by_status: {},
        orders_by_supplier: {}
      };

      // Calculate average order value
      stats.average_order_value = stats.total_orders > 0 ? stats.total_value / stats.total_orders : 0;

      // Count by status and supplier
      data?.forEach(order => {
        stats.orders_by_status[order.status] = (stats.orders_by_status[order.status] || 0) + 1;
        const supplierName = (order.suppliers as any)?.name || order.supplier_id;
        stats.orders_by_supplier[supplierName] = (stats.orders_by_supplier[supplierName] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching purchase order statistics:', error);
      throw error;
    }
  }

  /**
   * Generate unique PO number
   */
  private async generatePONumber(): Promise<string> {
    const currentYear = new Date().getFullYear();

    // Get the highest sequence number for this year
    const { data, error } = await supabaseClient
      .from('purchase_orders')
      .select('po_number')
      .like('po_number', `PO-${currentYear}-%`)
      .order('po_number', { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].po_number.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    return `PO-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Map database response to PurchaseOrder type
   */
  private mapPurchaseOrderResponse(data: any): PurchaseOrder {
    return {
      id: data.id,
      po_number: data.po_number,
      supplier_id: data.supplier_id,
      supplier_name: data.supplier?.name,
      status: data.status,
      order_date: data.order_date,
      expected_delivery_date: data.expected_delivery_date,
      actual_delivery_date: data.actual_delivery_date,
      total_amount: data.total_amount,
      currency: data.currency,
      notes: data.notes,
      approved_by: data.approved_by,
      approved_at: data.approved_at,
      ordered_by: data.ordered_by,
      ordered_at: data.ordered_at,
      received_by: data.received_by,
      received_at: data.received_at,
      tenant_id: data.tenant_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      items: data.items?.map((item: any) => ({
        id: item.id,
        purchase_order_id: item.purchase_order_id,
        product_id: item.product_id,
        product_name: item.product?.name,
        product_sku: item.product?.sku,
        quantity_ordered: item.quantity_ordered,
        quantity_received: item.quantity_received,
        unit_price: item.unit_price,
        total_price: item.total_price,
        notes: item.notes,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || []
    };
  }
}

export const supabasePurchaseOrderService = new SupabasePurchaseOrderService();
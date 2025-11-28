/**
 * Purchase Order Service - Mock Implementation
 * Handles purchase orders for inventory restocking
 */

import { PurchaseOrder, PurchaseOrderFormData, PurchaseOrderFilters, PurchaseOrderStats } from '@/types/masters';
import { authService } from '../serviceFactory';

class MockPurchaseOrderService {
  private baseUrl = '/api/purchase-orders';

  // Mock data for demonstration
  private mockPurchaseOrders: PurchaseOrder[] = [
    {
      id: 'po-1',
      po_number: 'PO-2025-0001',
      supplier_id: 'supplier-1',
      supplier_name: 'Tech Supplies Inc.',
      status: 'approved',
      order_date: '2025-01-15',
      expected_delivery_date: '2025-01-30',
      total_amount: 2500.00,
      currency: 'USD',
      notes: 'Monthly restocking order',
      approved_by: 'user-1',
      approved_at: '2025-01-14T10:00:00Z',
      ordered_by: 'user-2',
      ordered_at: '2025-01-15T09:00:00Z',
      tenant_id: 'tenant-1',
      created_at: '2025-01-14T08:00:00Z',
      updated_at: '2025-01-15T09:00:00Z',
      items: [
        {
          id: 'poi-1',
          purchase_order_id: 'po-1',
          product_id: 'product-1',
          product_name: 'Wireless Mouse',
          product_sku: 'WM-001',
          quantity_ordered: 50,
          quantity_received: 50,
          unit_price: 25.00,
          total_price: 1250.00,
          created_at: '2025-01-14T08:00:00Z',
          updated_at: '2025-01-15T09:00:00Z'
        },
        {
          id: 'poi-2',
          purchase_order_id: 'po-1',
          product_id: 'product-2',
          product_name: 'Mechanical Keyboard',
          product_sku: 'KB-002',
          quantity_ordered: 25,
          quantity_received: 25,
          unit_price: 50.00,
          total_price: 1250.00,
          created_at: '2025-01-14T08:00:00Z',
          updated_at: '2025-01-15T09:00:00Z'
        }
      ]
    },
    {
      id: 'po-2',
      po_number: 'PO-2025-0002',
      supplier_id: 'supplier-2',
      supplier_name: 'Office Solutions Ltd.',
      status: 'ordered',
      order_date: '2025-01-20',
      expected_delivery_date: '2025-02-05',
      total_amount: 1800.00,
      currency: 'USD',
      notes: 'Office supplies restocking',
      approved_by: 'user-1',
      approved_at: '2025-01-19T14:00:00Z',
      ordered_by: 'user-3',
      ordered_at: '2025-01-20T11:00:00Z',
      tenant_id: 'tenant-1',
      created_at: '2025-01-19T10:00:00Z',
      updated_at: '2025-01-20T11:00:00Z',
      items: [
        {
          id: 'poi-3',
          purchase_order_id: 'po-2',
          product_id: 'product-3',
          product_name: 'Office Chair',
          product_sku: 'OC-003',
          quantity_ordered: 10,
          quantity_received: 0,
          unit_price: 180.00,
          total_price: 1800.00,
          created_at: '2025-01-19T10:00:00Z',
          updated_at: '2025-01-20T11:00:00Z'
        }
      ]
    }
  ];

  async getPurchaseOrders(filters?: PurchaseOrderFilters): Promise<{ data: PurchaseOrder[]; total: number; page: number; pageSize: number }> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let orders = this.mockPurchaseOrders.filter(po => po.tenant_id === user.tenant_id);

    // Apply filters
    if (filters) {
      if (filters.status) {
        orders = orders.filter(po => po.status === filters.status);
      }
      if (filters.supplier_id) {
        orders = orders.filter(po => po.supplier_id === filters.supplier_id);
      }
      if (filters.date_from) {
        orders = orders.filter(po => po.order_date >= filters.date_from!);
      }
      if (filters.date_to) {
        orders = orders.filter(po => po.order_date <= filters.date_to!);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        orders = orders.filter(po =>
          po.po_number.toLowerCase().includes(search) ||
          po.supplier_name?.toLowerCase().includes(search) ||
          po.notes?.toLowerCase().includes(search)
        );
      }
    }

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      data: orders.slice(startIndex, endIndex),
      total: orders.length,
      page,
      pageSize
    };
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const order = this.mockPurchaseOrders.find(po =>
      po.id === id && po.tenant_id === user.tenant_id
    );

    if (!order) {
      throw new Error('Purchase order not found');
    }

    return order;
  }

  async createPurchaseOrder(data: PurchaseOrderFormData): Promise<PurchaseOrder> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    // Generate PO number
    const poNumber = this.generatePONumber();

    // Calculate total amount
    const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_price), 0);

    const newOrder: PurchaseOrder = {
      id: `po-${Date.now()}`,
      po_number: poNumber,
      supplier_id: data.supplier_id,
      status: 'draft',
      order_date: data.order_date,
      expected_delivery_date: data.expected_delivery_date,
      total_amount: totalAmount,
      currency: data.currency || 'USD',
      notes: data.notes,
      ordered_by: user.id,
      ordered_at: new Date().toISOString(),
      tenant_id: user.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: data.items.map(item => ({
        id: `poi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        purchase_order_id: `po-${Date.now()}`,
        product_id: item.product_id,
        quantity_ordered: item.quantity_ordered,
        quantity_received: 0,
        unit_price: item.unit_price,
        total_price: item.quantity_ordered * item.unit_price,
        notes: item.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    };

    // Set the correct purchase_order_id for items
    newOrder.items = newOrder.items.map(item => ({
      ...item,
      purchase_order_id: newOrder.id
    }));

    this.mockPurchaseOrders.push(newOrder);
    return newOrder;
  }

  async updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('write')) {
      throw new Error('Insufficient permissions');
    }

    const orderIndex = this.mockPurchaseOrders.findIndex(po =>
      po.id === id && po.tenant_id === user.tenant_id
    );

    if (orderIndex === -1) {
      throw new Error('Purchase order not found');
    }

    this.mockPurchaseOrders[orderIndex] = {
      ...this.mockPurchaseOrders[orderIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return this.mockPurchaseOrders[orderIndex];
  }

  async deletePurchaseOrder(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    if (!authService.hasPermission('delete')) {
      throw new Error('Insufficient permissions');
    }

    const orderIndex = this.mockPurchaseOrders.findIndex(po =>
      po.id === id && po.tenant_id === user.tenant_id
    );

    if (orderIndex === -1) {
      throw new Error('Purchase order not found');
    }

    this.mockPurchaseOrders.splice(orderIndex, 1);
  }

  async approvePurchaseOrder(id: string): Promise<PurchaseOrder> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    return this.updatePurchaseOrder(id, {
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString()
    });
  }

  async receivePurchaseOrder(id: string, receivedItems: Array<{ itemId: string; quantityReceived: number }>): Promise<PurchaseOrder> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const order = await this.getPurchaseOrder(id);

    // Update received quantities
    receivedItems.forEach(({ itemId, quantityReceived }) => {
      const item = order.items?.find(i => i.id === itemId);
      if (item) {
        item.quantity_received = quantityReceived;
        item.updated_at = new Date().toISOString();
      }
    });

    // Check if all items are received
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
      received_by: user.id,
      received_at: newStatus === 'received' ? new Date().toISOString() : undefined,
      items: order.items
    });
  }

  async getPurchaseOrderStats(): Promise<PurchaseOrderStats> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const orders = this.mockPurchaseOrders.filter(po => po.tenant_id === user.tenant_id);

    const stats: PurchaseOrderStats = {
      total_orders: orders.length,
      pending_orders: orders.filter(po => po.status === 'pending_approval').length,
      approved_orders: orders.filter(po => po.status === 'approved').length,
      received_orders: orders.filter(po => po.status === 'received').length,
      total_value: orders.reduce((sum, po) => sum + po.total_amount, 0),
      average_order_value: 0,
      orders_by_status: {},
      orders_by_supplier: {}
    };

    // Calculate average order value
    stats.average_order_value = orders.length > 0 ? stats.total_value / orders.length : 0;

    // Count by status
    orders.forEach(order => {
      stats.orders_by_status[order.status] = (stats.orders_by_status[order.status] || 0) + 1;
      const supplierName = order.supplier_name || order.supplier_id;
      stats.orders_by_supplier[supplierName] = (stats.orders_by_supplier[supplierName] || 0) + 1;
    });

    return stats;
  }

  private generatePONumber(): string {
    const currentYear = new Date().getFullYear();
    const existingOrders = this.mockPurchaseOrders.filter(po =>
      po.po_number.startsWith(`PO-${currentYear}-`)
    );

    const nextNumber = existingOrders.length + 1;
    return `PO-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
  }
}

export const mockPurchaseOrderService = new MockPurchaseOrderService();
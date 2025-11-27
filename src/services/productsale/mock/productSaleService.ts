import {
  ProductSale,
  ProductSaleWithDetails,
  ProductSaleFormData,
  ProductSaleFilters,
  ProductSalesResponse,
  FileAttachment
} from '@/types/productSales';
import type { ProductSalesAnalyticsDTO } from '@/types/dtos/productSalesDtos';

interface MockCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface MockProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
}

const mockCustomersMap: Map<string, MockCustomer> = new Map([
  ['a50e8400-e29b-41d4-a716-446655440001', {
    id: 'a50e8400-e29b-41d4-a716-446655440001',
    name: 'ABC Manufacturing',
    email: 'contact@abcmfg.com',
    phone: '+1-555-0101'
  }],
  ['a50e8400-e29b-41d4-a716-446655440002', {
    id: 'a50e8400-e29b-41d4-a716-446655440002',
    name: 'XYZ Logistics',
    email: 'info@xyzlogistics.com',
    phone: '+1-555-0102'
  }],
  ['a50e8400-e29b-41d4-a716-446655440004', {
    id: 'a50e8400-e29b-41d4-a716-446655440004',
    name: 'Innovation Labs',
    email: 'support@innovationlabs.com',
    phone: '+1-555-0104'
  }]
]);

const mockProductsMap: Map<string, MockProduct> = new Map([
  ['950e8400-e29b-41d4-a716-446655440003', {
    id: '950e8400-e29b-41d4-a716-446655440003',
    name: 'Hydraulic Press Machine',
    sku: 'HPM-2024-001',
    price: 75000.00
  }],
  ['950e8400-e29b-41d4-a716-446655440002', {
    id: '950e8400-e29b-41d4-a716-446655440002',
    name: 'Sensor Array Kit',
    sku: 'SAK-2024-001',
    price: 3500.00
  }],
  ['950e8400-e29b-41d4-a716-446655440005', {
    id: '950e8400-e29b-41d4-a716-446655440005',
    name: 'Enterprise CRM License',
    sku: 'ECS-2024-001',
    price: 15000.00
  }]
]);

const mockProductSalesBase: ProductSale[] = [
  {
    id: 'd50e8400-e29b-41d4-a716-446655440001',
    customer_id: 'a50e8400-e29b-41d4-a716-446655440001',
    product_id: '950e8400-e29b-41d4-a716-446655440003',
    units: 1.00,
    cost_per_unit: 75000.00,
    total_cost: 75000.00,
    delivery_date: '2024-09-01',
    warranty_expiry: '2025-09-01',
    status: 'new',
    notes: 'Heavy machinery delivery with installation service included.',
    attachments: [],
    service_contract_id: 'c50e8400-e29b-41d4-a716-446655440001',
    tenant_id: '550e8400-e29b-41d4-a716-446655440001',
    created_at: '2024-06-15T10:30:00Z',
    updated_at: '2024-06-15T10:30:00Z',
    created_by: 'a3c91c65-343d-4ff4-b9ab-f36adb371495'
  },
  {
    id: 'd50e8400-e29b-41d4-a716-446655440002',
    customer_id: 'a50e8400-e29b-41d4-a716-446655440002',
    product_id: '950e8400-e29b-41d4-a716-446655440002',
    units: 2.00,
    cost_per_unit: 3500.00,
    total_cost: 7000.00,
    delivery_date: '2024-08-01',
    warranty_expiry: '2025-08-01',
    status: 'new',
    notes: 'IoT sensor kit for warehouse monitoring.',
    attachments: [],
    service_contract_id: 'c50e8400-e29b-41d4-a716-446655440002',
    tenant_id: '550e8400-e29b-41d4-a716-446655440001',
    created_at: '2024-06-10T14:20:00Z',
    updated_at: '2024-06-10T14:20:00Z',
    created_by: 'd078f352-e074-4b26-bd3d-94d5751aa50c'
  },
  {
    id: 'd50e8400-e29b-41d4-a716-446655440003',
    customer_id: 'a50e8400-e29b-41d4-a716-446655440004',
    product_id: '950e8400-e29b-41d4-a716-446655440005',
    units: 1.00,
    cost_per_unit: 15000.00,
    total_cost: 15000.00,
    delivery_date: '2024-06-01',
    warranty_expiry: '2025-06-01',
    status: 'expired',
    notes: 'CRM software license for startup. Renewal due soon.',
    attachments: [],
    service_contract_id: 'c50e8400-e29b-41d4-a716-446655440003',
    tenant_id: '550e8400-e29b-41d4-a716-446655440002',
    created_at: '2024-06-01T10:00:00Z',
    updated_at: '2024-06-01T10:00:00Z',
    created_by: 'e7bf21ab-b09f-450c-a389-081c1f8179b4'
  }
];

class MockProductSaleService {
  /**
   * Get tenant ID from context or fallback to auth service
   * Ensures tenant isolation for multi-tenant security
   */
  private getTenantId(tenantId?: string): string {
    if (tenantId) return tenantId;

    // Mock tenant ID for testing
    return '550e8400-e29b-41d4-a716-446655440001';
  }

  private joinProductSaleWithDetails(sale: ProductSale): ProductSaleWithDetails {
    const customer = mockCustomersMap.get(sale.customer_id);
    const product = mockProductsMap.get(sale.product_id);

    if (!customer || !product) {
      throw new Error(`Missing customer or product data for sale ${sale.id}`);
    }

    return {
      ...sale,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      },
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price
      }
    };
  }

  // Get all product sales with filtering and pagination
  async getProductSales(
    filters: ProductSaleFilters = {},
    page: number = 1,
    limit: number = 10,
    tenantId?: string
  ): Promise<ProductSalesResponse> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get current tenant and validate authorization
      const finalTenantId = this.getTenantId(tenantId);

      // Filter by tenant first for security
      let filteredSales = mockProductSalesBase.filter(sale => sale.tenant_id === finalTenantId);

      // Apply filters
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredSales = filteredSales.filter(sale => {
          const customer = mockCustomersMap.get(sale.customer_id);
          const product = mockProductsMap.get(sale.product_id);
          return (customer?.name.toLowerCase().includes(searchLower) ?? false) ||
                 (product?.name.toLowerCase().includes(searchLower) ?? false) ||
                 sale.notes.toLowerCase().includes(searchLower);
        });
      }

      if (filters.customer_id) {
        filteredSales = filteredSales.filter(sale => sale.customer_id === filters.customer_id);
      }

      if (filters.product_id) {
        filteredSales = filteredSales.filter(sale => sale.product_id === filters.product_id);
      }

      if (filters.status) {
        filteredSales = filteredSales.filter(sale => sale.status === filters.status);
      }

      if (filters.date_from) {
        filteredSales = filteredSales.filter(sale => sale.delivery_date >= filters.date_from!);
      }

      if (filters.date_to) {
        filteredSales = filteredSales.filter(sale => sale.delivery_date <= filters.date_to!);
      }

      if (filters.min_amount) {
        filteredSales = filteredSales.filter(sale => sale.total_cost >= filters.min_amount!);
      }

      if (filters.max_amount) {
        filteredSales = filteredSales.filter(sale => sale.total_cost <= filters.max_amount!);
      }

      if (filters.sale_id) {
        const saleIdLower = filters.sale_id.toLowerCase();
        filteredSales = filteredSales.filter(sale => sale.id.toLowerCase().includes(saleIdLower));
      }

      if (filters.notes) {
        const notesLower = filters.notes.toLowerCase();
        filteredSales = filteredSales.filter(sale =>
          sale.notes.toLowerCase().includes(notesLower)
        );
      }

      if (filters.min_price) {
        filteredSales = filteredSales.filter(sale => sale.total_cost >= filters.min_price!);
      }

      if (filters.max_price) {
        filteredSales = filteredSales.filter(sale => sale.total_cost <= filters.max_price!);
      }

      if (filters.warranty_status) {
        const now = new Date();
        filteredSales = filteredSales.filter(sale => {
          const warrantyDate = new Date(sale.warranty_expiry);
          const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

          if (filters.warranty_status === 'active') {
            return warrantyDate > now;
          } else if (filters.warranty_status === 'expiring_soon') {
            return warrantyDate > now && warrantyDate <= thirtyDaysFromNow;
          } else if (filters.warranty_status === 'expired') {
            return warrantyDate <= now;
          }
          return true;
        });
      }

      if (filters.start_date) {
        filteredSales = filteredSales.filter(sale => sale.delivery_date >= filters.start_date!);
      }

      if (filters.end_date) {
        filteredSales = filteredSales.filter(sale => sale.delivery_date <= filters.end_date!);
      }

      // Pagination
      const total = filteredSales.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const data = filteredSales.slice(startIndex, endIndex);

      return {
        data,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      console.error('Error fetching product sales:', error);
      throw new Error('Failed to fetch product sales');
    }
  }

  // Get single product sale by ID
  async getProductSaleById(id: string, tenantId?: string): Promise<ProductSale> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      // Get current tenant and validate authorization
      const finalTenantId = this.getTenantId(tenantId);

      const sale = mockProductSalesBase.find(
        s => s.id === id && s.tenant_id === finalTenantId
      );

      if (!sale) {
        throw new Error('Product sale not found');
      }

      return sale;
    } catch (error) {
      console.error('Error fetching product sale:', error);
      throw error;
    }
  }

  // Create new product sale
  async createProductSale(data: ProductSaleFormData, tenantId?: string): Promise<ProductSale> {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      // Get current tenant and validate authorization
      const finalTenantId = this.getTenantId(tenantId);

      // Calculate warranty expiry (delivery date + 1 year)
      const deliveryDate = new Date(data.delivery_date);
      const warrantyExpiry = new Date(deliveryDate);
      warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + 1);

      // Determine status based on warranty expiry
      const now = new Date();
      let status: 'new' | 'renewed' | 'expired' = 'new';
      if (warrantyExpiry < now) {
        status = 'expired';
      }

      const newSale: ProductSale = {
        id: `ps-${Date.now()}`,
        customer_id: data.customer_id,
        product_id: data.product_id,
        units: data.units,
        cost_per_unit: data.cost_per_unit,
        total_cost: data.units * data.cost_per_unit,
        delivery_date: data.delivery_date,
        warranty_expiry: warrantyExpiry.toISOString().split('T')[0],
        status,
        notes: data.notes,
        attachments: [],
        tenant_id: finalTenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system'
      };

      // Add to mock data
      mockProductSalesBase.unshift(newSale);

      return newSale;
    } catch (error) {
      console.error('Error creating product sale:', error);
      throw new Error('Failed to create product sale');
    }
  }

  // Update existing product sale
  async updateProductSale(id: string, data: Partial<ProductSaleFormData>, tenantId?: string): Promise<ProductSale> {
    try {
      await new Promise(resolve => setTimeout(resolve, 600));

      // Get current tenant and validate authorization
      const finalTenantId = this.getTenantId(tenantId);

      const index = mockProductSalesBase.findIndex(
        s => s.id === id && s.tenant_id === finalTenantId
      );

      if (index === -1) {
        throw new Error('Product sale not found');
      }

      const existingSale = mockProductSalesBase[index];
      const updatedSale: ProductSale = {
        ...existingSale,
        ...data,
        total_cost: data.units && data.cost_per_unit
          ? data.units * data.cost_per_unit
          : existingSale.total_cost,
        updated_at: new Date().toISOString()
      };

      // Handle attachments - convert File[] to FileAttachment[] if needed
      if (data.attachments && Array.isArray(data.attachments) && data.attachments.length > 0) {
        // If attachments are File objects, convert them to FileAttachment
        if (data.attachments[0] instanceof File) {
          updatedSale.attachments = (data.attachments as File[]).map((file: File) => ({
            id: `att-${Date.now()}-${Math.random()}`,
            name: file.name,
            size: file.size,
            type: file.type,
            url: `/api/files/att-${Date.now()}`,
            uploaded_at: new Date().toISOString()
          }));
        }
      }

      // Recalculate warranty expiry if delivery date changed
      if (data.delivery_date) {
        const deliveryDate = new Date(data.delivery_date);
        const warrantyExpiry = new Date(deliveryDate);
        warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + 1);
        updatedSale.warranty_expiry = warrantyExpiry.toISOString().split('T')[0];

        // Update status based on new warranty expiry
        const now = new Date();
        if (warrantyExpiry < now) {
          updatedSale.status = 'expired';
        } else {
          updatedSale.status = 'new';
        }
      }

      mockProductSalesBase[index] = updatedSale;
      return updatedSale;
    } catch (error) {
      console.error('Error updating product sale:', error);
      throw new Error('Failed to update product sale');
    }
  }

  // Delete product sale
  async deleteProductSale(id: string, tenantId?: string): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));

      // Get current tenant and validate authorization
      const finalTenantId = this.getTenantId(tenantId);

      const index = mockProductSalesBase.findIndex(
        s => s.id === id && s.tenant_id === finalTenantId
      );

      if (index === -1) {
        throw new Error('Product sale not found');
      }

      mockProductSalesBase.splice(index, 1);
    } catch (error) {
      console.error('Error deleting product sale:', error);
      throw new Error('Failed to delete product sale');
    }
  }

  // Get product sales analytics
  async getProductSalesAnalytics(tenantId?: string): Promise<ProductSalesAnalyticsDTO> {
    try {
      await new Promise(resolve => setTimeout(resolve, 600));

      // Get current tenant and validate authorization
      const finalTenantId = this.getTenantId(tenantId);

      // Filter by tenant
      const tenantSales = mockProductSalesBase.filter(sale => sale.tenant_id === finalTenantId);

      const totalSales = tenantSales.length;
      const totalRevenue = tenantSales.reduce((sum, sale) => sum + sale.total_cost, 0);
      const averageDealSize = totalSales > 0 ? totalRevenue / totalSales : 0;

      // Mock monthly data
      const salesByMonth = [
        { month: '2024-01', sales_count: 5, revenue: 25000 },
        { month: '2024-02', sales_count: 8, revenue: 42000 },
        { month: '2024-03', sales_count: 12, revenue: 68000 },
        { month: '2024-04', sales_count: 15, revenue: 85000 },
        { month: '2024-05', sales_count: 18, revenue: 95000 },
        { month: '2024-06', sales_count: 22, revenue: 125000 }
      ];

      // Top products - calculate from mock data
      const productMap = new Map<string, { count: number; revenue: number; units: number }>();
      tenantSales.forEach(sale => {
        const existing = productMap.get(sale.product_id) || { count: 0, revenue: 0, units: 0 };
        productMap.set(sale.product_id, {
          count: existing.count + 1,
          revenue: existing.revenue + sale.total_cost,
          units: existing.units + sale.units
        });
      });

      const topProducts = Array.from(productMap.entries())
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10)
        .map(([productId, data]) => {
          const product = mockProductsMap.get(productId);
          return {
            productId: productId,
            productName: product?.name || 'Unknown Product',
            quantity: data.units,
            revenue: data.revenue,
          };
        });

      // Top customers - calculate from mock data
      const customerMap = new Map<string, { count: number; revenue: number; lastPurchase: string }>();
      tenantSales.forEach(sale => {
        const existing = customerMap.get(sale.customer_id) || { count: 0, revenue: 0, lastPurchase: '' };
        customerMap.set(sale.customer_id, {
          count: existing.count + 1,
          revenue: existing.revenue + sale.total_cost,
          lastPurchase: sale.created_at > existing.lastPurchase ? sale.created_at : existing.lastPurchase
        });
      });

      const topCustomers = Array.from(customerMap.entries())
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10)
        .map(([customerId, data]) => {
          const customer = mockCustomersMap.get(customerId);
          return {
            customerId: customerId,
            customerName: customer?.name || 'Unknown Customer',
            totalSales: data.count,
            revenue: data.revenue,
          };
        });

      // Status distribution
      const statusCounts = tenantSales.reduce((acc, sale) => {
        acc[sale.status] = (acc[sale.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalSales: totalSales,
        totalRevenue: totalRevenue,
        averageSaleValue: averageDealSize,
        completedSales: totalSales,
        pendingSales: 0,
        totalQuantity: tenantSales.reduce((sum, sale) => sum + sale.units, 0),
        revenueByMonth: Object.fromEntries(
          salesByMonth.map(m => [m.month, m.revenue])
        ),
        topProducts: topProducts,
        topCustomers: topCustomers,
        byStatus: statusCounts,
        lastUpdated: new Date().toISOString(),
      } as ProductSalesAnalyticsDTO;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw new Error('Failed to fetch analytics');
    }
  }

  // Upload file attachment
  async uploadAttachment(saleId: string, file: File): Promise<FileAttachment> {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const attachment: FileAttachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: `/api/files/att-${Date.now()}`,
        uploaded_at: new Date().toISOString()
      };

      // Add attachment to the sale
      const sale = mockProductSalesBase.find(s => s.id === saleId);
      if (sale) {
        sale.attachments.push(attachment);
      }

      return attachment;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw new Error('Failed to upload attachment');
    }
  }

  // Delete file attachment
  async deleteAttachment(saleId: string, attachmentId: string): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const sale = mockProductSalesBase.find(s => s.id === saleId);
      if (sale) {
        const index = sale.attachments.findIndex(att => att.id === attachmentId);
        if (index !== -1) {
          sale.attachments.splice(index, 1);
        }
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      throw new Error('Failed to delete attachment');
    }
  }
}

export const mockProductSaleService = new MockProductSaleService();
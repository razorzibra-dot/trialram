import { 
  ProductSale, 
  ProductSaleFormData, 
  ProductSaleFilters, 
  ProductSalesResponse,
  FileAttachment
} from '@/types/productSales';
import type { ProductSalesAnalyticsDTO } from '@/types/dtos/productSalesDtos';
import { supabaseClient } from './client';
import { multiTenantService } from './multiTenantService';
import { 
  addTenantFilter, 
  applyPagination, 
  applySorting, 
  handleSupabaseError,
  retryQuery 
} from './queryBuilders';

class SupabaseProductSaleService {
  /**
   * Get all product sales with filtering and pagination
   */
  async getProductSales(
    filters: ProductSaleFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<ProductSalesResponse> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();
      let query = supabaseClient.from('product_sales').select('*', { count: 'exact' });

      // Apply tenant filter
      query = addTenantFilter(query, tenantId);

      // Apply filters
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        query = query.or(
          `customer_name.ilike.%${searchLower}%,product_name.ilike.%${searchLower}%,notes.ilike.%${searchLower}%`
        );
      }

      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }

      if (filters.product_id) {
        query = query.eq('product_id', filters.product_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.date_from) {
        query = query.gte('delivery_date', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('delivery_date', filters.date_to);
      }

      if (filters.min_amount) {
        query = query.gte('total_cost', filters.min_amount);
      }

      if (filters.max_amount) {
        query = query.lte('total_cost', filters.max_amount);
      }

      if (filters.sale_id) {
        query = query.ilike('id', `%${filters.sale_id}%`);
      }

      if (filters.customer_name) {
        query = query.ilike('customer_name', `%${filters.customer_name}%`);
      }

      if (filters.product_name) {
        query = query.ilike('product_name', `%${filters.product_name}%`);
      }

      if (filters.notes) {
        query = query.ilike('notes', `%${filters.notes}%`);
      }

      if (filters.warranty_status) {
        const now = new Date().toISOString().split('T')[0];
        const thirtyDaysFromNow = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        if (filters.warranty_status === 'active') {
          query = query.gt('warranty_expiry', now);
        } else if (filters.warranty_status === 'expiring_soon') {
          query = query.lte('warranty_expiry', thirtyDaysFromNow);
          query = query.gt('warranty_expiry', now);
        } else if (filters.warranty_status === 'expired') {
          query = query.lte('warranty_expiry', now);
        }
      }

      if (filters.start_date) {
        query = query.gte('delivery_date', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('delivery_date', filters.end_date);
      }

      if (filters.min_price) {
        query = query.gte('total_cost', filters.min_price);
      }

      if (filters.max_price) {
        query = query.lte('total_cost', filters.max_price);
      }

      // Apply pagination and sorting
      query = applyPagination(query, page, limit);
      query = applySorting(query, 'created_at', 'desc');

      const { data, error, count } = await retryQuery(async () => 
        query
      );

      if (error) throw handleSupabaseError(error);

      // Map database rows to ProductSale interface
      const mappedData = (data || []).map(row => this.mapToProductSale(row));

      return {
        data: mappedData,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching product sales:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch product sales');
    }
  }

  /**
   * Get single product sale by ID
   */
  async getProductSaleById(id: string): Promise<ProductSale> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();
      
      const { data, error } = await retryQuery(async () =>
        supabaseClient
          .from('product_sales')
          .select('*')
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .single()
      );

      if (error) throw handleSupabaseError(error);
      if (!data) throw new Error('Product sale not found');

      return this.mapToProductSale(data);
    } catch (error) {
      console.error('Error fetching product sale:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch product sale');
    }
  }

  /**
   * Create new product sale
   */
  async createProductSale(data: ProductSaleFormData): Promise<ProductSale> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();
      const userId = multiTenantService.getCurrentUserId();

      // Calculate warranty expiry
      const deliveryDate = new Date(data.delivery_date);
      const warrantyExpiry = new Date(deliveryDate);
      warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + 1);

      // Determine status
      const now = new Date();
      let status: 'new' | 'renewed' | 'expired' = 'new';
      if (warrantyExpiry < now) {
        status = 'expired';
      }

      const insertData = {
        customer_id: data.customer_id,
        product_id: data.product_id,
        units: data.units,
        cost_per_unit: data.cost_per_unit,
        total_cost: data.units * data.cost_per_unit,
        delivery_date: data.delivery_date,
        warranty_expiry: warrantyExpiry.toISOString().split('T')[0],
        status,
        notes: data.notes,
        tenant_id: tenantId,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertedData, error } = await retryQuery(async () =>
        supabaseClient
          .from('product_sales')
          .insert([insertData])
          .select()
          .single()
      );

      if (error) throw handleSupabaseError(error);
      if (!insertedData) throw new Error('Failed to create product sale');

      return this.mapToProductSale(insertedData);
    } catch (error) {
      console.error('Error creating product sale:', error);
      throw error instanceof Error ? error : new Error('Failed to create product sale');
    }
  }

  /**
   * Update existing product sale
   */
  async updateProductSale(id: string, data: Partial<ProductSaleFormData>): Promise<ProductSale> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      // Validate ownership
      const { data: existing, error: fetchError } = await supabaseClient
        .from('product_sales')
        .select('id')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (fetchError || !existing) throw new Error('Product sale not found');

      const updateData: any = {
        ...data,
        updated_at: new Date().toISOString()
      };

      // Recalculate total cost and warranty if necessary
      if (data.units || data.cost_per_unit) {
        const { data: current } = await supabaseClient
          .from('product_sales')
          .select('units, cost_per_unit')
          .eq('id', id)
          .single();

        if (current) {
          const units = data.units ?? current.units;
          const costPerUnit = data.cost_per_unit ?? current.cost_per_unit;
          updateData.total_cost = units * costPerUnit;
        }
      }

      if (data.delivery_date) {
        const deliveryDate = new Date(data.delivery_date);
        const warrantyExpiry = new Date(deliveryDate);
        warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + 1);
        updateData.warranty_expiry = warrantyExpiry.toISOString().split('T')[0];

        // Update status based on warranty expiry
        const now = new Date();
        updateData.status = warrantyExpiry < now ? 'expired' : 'new';
      }

      const { data: updatedData, error } = await retryQuery(async () =>
        supabaseClient
          .from('product_sales')
          .update(updateData)
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single()
      );

      if (error) throw handleSupabaseError(error);
      if (!updatedData) throw new Error('Failed to update product sale');

      return this.mapToProductSale(updatedData);
    } catch (error) {
      console.error('Error updating product sale:', error);
      throw error instanceof Error ? error : new Error('Failed to update product sale');
    }
  }

  /**
   * Delete product sale
   */
  async deleteProductSale(id: string): Promise<void> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      const { error } = await retryQuery(async () =>
        supabaseClient
          .from('product_sales')
          .delete()
          .eq('id', id)
          .eq('tenant_id', tenantId)
      );

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error deleting product sale:', error);
      throw error instanceof Error ? error : new Error('Failed to delete product sale');
    }
  }

  /**
   * Get product sales analytics
   */
  async getProductSalesAnalytics(tenantId?: string): Promise<ProductSalesAnalyticsDTO> {
    try {
      const finalTenantId = tenantId || multiTenantService.getCurrentTenantId();

      // Get all product sales
      const { data: sales, error: salesError } = await supabaseClient
        .from('product_sales')
        .select('*')
        .eq('tenant_id', finalTenantId);

      if (salesError) throw handleSupabaseError(salesError);

      const mappedSales = (sales || []).map(s => this.mapToProductSale(s));

      if (mappedSales.length === 0) {
        return {
          totalSales: 0,
          totalRevenue: 0,
          averageSaleValue: 0,
          completedSales: 0,
          pendingSales: 0,
          totalQuantity: 0,
          revenueByMonth: {},
          topProducts: [],
          topCustomers: [],
          byStatus: [],
          lastUpdated: new Date().toISOString(),
        };
      }

      const totalSales = mappedSales.length;
      const totalRevenue = mappedSales.reduce((sum, sale) => sum + sale.total_cost, 0);
      const averageDealSize = totalRevenue / totalSales;

      // Calculate sales by month
      const salesByMonthMap = new Map<string, { count: number; revenue: number }>();
      mappedSales.forEach(sale => {
        const month = sale.delivery_date.substring(0, 7);
        const existing = salesByMonthMap.get(month) || { count: 0, revenue: 0 };
        salesByMonthMap.set(month, {
          count: existing.count + 1,
          revenue: existing.revenue + sale.total_cost
        });
      });

      const salesByMonthArray = Array.from(salesByMonthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b));
      
      const revenueByMonth = Object.fromEntries(
        salesByMonthArray.map(([month, data]) => [month, data.revenue])
      );

      // Top products
      const productMap = new Map<string, { count: number; revenue: number; units: number }>();
      mappedSales.forEach(sale => {
        const key = `${sale.product_id}|${sale.product_name}`;
        const existing = productMap.get(key) || { count: 0, revenue: 0, units: 0 };
        productMap.set(key, {
          count: existing.count + 1,
          revenue: existing.revenue + sale.total_cost,
          units: existing.units + sale.units
        });
      });

      const topProducts = Array.from(productMap.entries())
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10)
        .map(([key, data]) => {
          const [productId, productName] = key.split('|');
          return {
            productId: productId,
            productName: productName,
            quantity: data.units,
            revenue: data.revenue,
          };
        });

      // Top customers
      const customerMap = new Map<string, { count: number; revenue: number; lastPurchase: string }>();
      mappedSales.forEach(sale => {
        const key = `${sale.customer_id}|${sale.customer_name}`;
        const existing = customerMap.get(key) || { count: 0, revenue: 0, lastPurchase: '' };
        customerMap.set(key, {
          count: existing.count + 1,
          revenue: existing.revenue + sale.total_cost,
          lastPurchase: sale.delivery_date > existing.lastPurchase ? sale.delivery_date : existing.lastPurchase
        });
      });

      const topCustomers = Array.from(customerMap.entries())
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10)
        .map(([key, data]) => {
          const [customerId, customerName] = key.split('|');
          return {
            customerId: customerId,
            customerName: customerName,
            totalSales: data.count,
            revenue: data.revenue,
          };
        });

      // Status distribution
      const statusCounts = mappedSales.reduce((acc, sale) => {
        acc[sale.status] = (acc[sale.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: (count / totalSales) * 100
      }));

      // Warranty expiring soon (30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const now = new Date();

      const warrantyExpiringSoon = mappedSales.filter(sale => {
        const warrantyDate = new Date(sale.warranty_expiry);
        return warrantyDate <= thirtyDaysFromNow && warrantyDate >= now;
      });

      return {
        totalSales: totalSales,
        totalRevenue: totalRevenue,
        averageSaleValue: averageDealSize,
        completedSales: totalSales,
        pendingSales: 0,
        totalQuantity: mappedSales.reduce((sum, sale) => sum + sale.units, 0),
        revenueByMonth: revenueByMonth,
        topProducts: topProducts,
        topCustomers: topCustomers,
        byStatus: statusDistribution,
        lastUpdated: new Date().toISOString(),
      } as ProductSalesAnalyticsDTO;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch analytics');
    }
  }

  /**
   * Upload file attachment
   */
  async uploadAttachment(saleId: string, file: File): Promise<FileAttachment> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();
      
      // Verify product sale exists
      const { data: sale, error: saleError } = await supabaseClient
        .from('product_sales')
        .select('id')
        .eq('id', saleId)
        .eq('tenant_id', tenantId)
        .single();

      if (saleError || !sale) throw new Error('Product sale not found');

      // Upload file to storage
      const filePath = `${tenantId}/${saleId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabaseClient.storage
        .from('product-sale-attachments')
        .upload(filePath, file);

      if (uploadError) throw handleSupabaseError(uploadError);

      // Get public URL
      const { data } = supabaseClient.storage
        .from('product-sale-attachments')
        .getPublicUrl(filePath);

      const attachment: FileAttachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: data.publicUrl,
        uploaded_at: new Date().toISOString()
      };

      return attachment;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error instanceof Error ? error : new Error('Failed to upload attachment');
    }
  }

  /**
   * Map database row to ProductSale interface
   */
  private mapToProductSale(row: any): ProductSale {
    return {
      id: row.id,
      customer_id: row.customer_id,
      customer_name: row.customer_name || '',
      product_id: row.product_id,
      product_name: row.product_name || '',
      units: row.units,
      cost_per_unit: row.cost_per_unit,
      total_cost: row.total_cost,
      delivery_date: row.delivery_date,
      warranty_expiry: row.warranty_expiry,
      status: row.status,
      notes: row.notes || '',
      attachments: row.attachments || [],
      service_contract_id: row.service_contract_id,
      tenant_id: row.tenant_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by
    };
  }
}

export { SupabaseProductSaleService };
export const supabaseProductSaleService = new SupabaseProductSaleService();
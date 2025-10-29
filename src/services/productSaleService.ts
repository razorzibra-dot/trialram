import { 
  ProductSale, 
  ProductSaleFormData, 
  ProductSaleFilters, 
  ProductSalesResponse,
  ProductSalesAnalytics,
  FileAttachment
} from '@/types/productSales';
import { pdfTemplateService } from './pdfTemplateService';
import { PDFGenerationResponse } from '@/types/pdfTemplates';

import { authService } from './authService';

// Mock data for development - TENANT-AWARE (Aligned with seed.sql data)
// These UUIDs match the seed.sql sample data for consistency
const mockProductSalesBase: ProductSale[] = [
  {
    id: 'd50e8400-e29b-41d4-a716-446655440001',
    customer_id: 'a50e8400-e29b-41d4-a716-446655440001',
    customer_name: 'ABC Manufacturing',
    product_id: '950e8400-e29b-41d4-a716-446655440003',
    product_name: 'Hydraulic Press Machine',
    units: 1.00,
    cost_per_unit: 75000.00,
    total_cost: 75000.00,
    delivery_date: '2024-09-01',
    warranty_expiry: '2025-09-01',
    status: 'new',
    notes: 'Heavy machinery delivery with installation service included.',
    attachments: [],
    service_contract_id: 'c50e8400-e29b-41d4-a716-446655440001',
    tenant_id: '550e8400-e29b-41d4-a716-446655440001', // Acme Corporation
    created_at: '2024-06-15T10:30:00Z',
    updated_at: '2024-06-15T10:30:00Z',
    created_by: 'a3c91c65-343d-4ff4-b9ab-f36adb371495'
  },
  {
    id: 'd50e8400-e29b-41d4-a716-446655440002',
    customer_id: 'a50e8400-e29b-41d4-a716-446655440002',
    customer_name: 'XYZ Logistics',
    product_id: '950e8400-e29b-41d4-a716-446655440002',
    product_name: 'Sensor Array Kit',
    units: 2.00,
    cost_per_unit: 3500.00,
    total_cost: 7000.00,
    delivery_date: '2024-08-01',
    warranty_expiry: '2025-08-01',
    status: 'new',
    notes: 'IoT sensor kit for warehouse monitoring.',
    attachments: [],
    service_contract_id: 'c50e8400-e29b-41d4-a716-446655440002',
    tenant_id: '550e8400-e29b-41d4-a716-446655440001', // Acme Corporation
    created_at: '2024-06-10T14:20:00Z',
    updated_at: '2024-06-10T14:20:00Z',
    created_by: 'd078f352-e074-4b26-bd3d-94d5751aa50c'
  },
  {
    id: 'd50e8400-e29b-41d4-a716-446655440003',
    customer_id: 'a50e8400-e29b-41d4-a716-446655440004',
    customer_name: 'Innovation Labs',
    product_id: '950e8400-e29b-41d4-a716-446655440005',
    product_name: 'Enterprise CRM License',
    units: 1.00,
    cost_per_unit: 15000.00,
    total_cost: 15000.00,
    delivery_date: '2024-06-01',
    warranty_expiry: '2025-06-01',
    status: 'expired',
    notes: 'CRM software license for startup. Renewal due soon.',
    attachments: [],
    service_contract_id: 'c50e8400-e29b-41d4-a716-446655440003',
    tenant_id: '550e8400-e29b-41d4-a716-446655440002', // Tech Solutions Inc
    created_at: '2024-06-01T10:00:00Z',
    updated_at: '2024-06-01T10:00:00Z',
    created_by: 'e7bf21ab-b09f-450c-a389-081c1f8179b4'
  }
];

class ProductSaleService {
  private baseUrl = '/api/product-sale';

  /**
   * Get tenant ID from context or fallback to auth service
   * Ensures tenant isolation for multi-tenant security
   */
  private getTenantId(tenantId?: string): string {
    if (tenantId) return tenantId;
    
    const user = authService.getCurrentUser();
    if (user && (user as Record<string, unknown>).tenant_id) {
      return (user as Record<string, unknown>).tenant_id as string;
    }
    
    throw new Error('Unauthorized: Unable to determine tenant context');
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
        filteredSales = filteredSales.filter(sale =>
          sale.customer_name?.toLowerCase().includes(searchLower) ||
          sale.product_name?.toLowerCase().includes(searchLower) ||
          sale.notes.toLowerCase().includes(searchLower)
        );
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

      if (filters.customer_name) {
        const customerLower = filters.customer_name.toLowerCase();
        filteredSales = filteredSales.filter(sale => 
          sale.customer_name?.toLowerCase().includes(customerLower)
        );
      }

      if (filters.product_name) {
        const productLower = filters.product_name.toLowerCase();
        filteredSales = filteredSales.filter(sale => 
          sale.product_name?.toLowerCase().includes(productLower)
        );
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
      const user = authService.getCurrentUser() as Record<string, unknown>;

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
        customer_name: 'Customer Name', // Would be fetched from customer service
        product_id: data.product_id,
        product_name: 'Product Name', // Would be fetched from product service
        units: data.units,
        cost_per_unit: data.cost_per_unit,
        total_cost: data.units * data.cost_per_unit,
        delivery_date: data.delivery_date,
        warranty_expiry: warrantyExpiry.toISOString().split('T')[0],
        status,
        notes: data.notes,
        attachments: [], // File uploads would be handled separately
        tenant_id: finalTenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: (user?.id as string) || 'system'
      };

      // Add to mock data
      mockProductSalesBase.unshift(newSale);

      // Auto-generate service contract
      await this.createServiceContract(newSale);

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
  async getProductSalesAnalytics(tenantId?: string): Promise<ProductSalesAnalytics> {
    return this.getAnalytics(tenantId);
  }

  // Get analytics data
  async getAnalytics(tenantId?: string): Promise<ProductSalesAnalytics> {
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

      // Top products
      const topProducts = [
        { product_id: 'prod-001', product_name: 'Enterprise CRM Suite', total_sales: 15, total_revenue: 125000, units_sold: 45 },
        { product_id: 'prod-002', product_name: 'Analytics Dashboard Pro', total_sales: 8, total_revenue: 65000, units_sold: 28 },
        { product_id: 'prod-003', product_name: 'Security Module', total_sales: 5, total_revenue: 35000, units_sold: 15 }
      ];

      // Top customers
      const topCustomers = [
        { customer_id: 'cust-001', customer_name: 'Acme Corporation', total_sales: 3, total_revenue: 45000, last_purchase: '2024-06-15' },
        { customer_id: 'cust-002', customer_name: 'TechStart Inc', total_sales: 2, total_revenue: 28000, last_purchase: '2024-06-10' },
        { customer_id: 'cust-003', customer_name: 'Global Enterprises', total_sales: 4, total_revenue: 85000, last_purchase: '2024-06-20' }
      ];

      // Status distribution
      const statusCounts = tenantSales.reduce((acc, sale) => {
        acc[sale.status] = (acc[sale.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: totalSales > 0 ? (count / totalSales) * 100 : 0
      }));

      // Warranty expiring soon (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const warrantyExpiringSoon = tenantSales.filter(sale => {
        const warrantyDate = new Date(sale.warranty_expiry);
        return warrantyDate <= thirtyDaysFromNow && warrantyDate >= new Date();
      });

      return {
        total_sales: totalSales,
        total_revenue: totalRevenue,
        average_deal_size: averageDealSize,
        sales_by_month: salesByMonth,
        top_products: topProducts,
        top_customers: topCustomers,
        status_distribution: statusDistribution,
        warranty_expiring_soon: warrantyExpiringSoon
      };
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
      const sale = mockProductSales.find(s => s.id === saleId);
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

      const sale = mockProductSales.find(s => s.id === saleId);
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

  // Generate PDF for product sale
  async generatePdf(saleId: string): Promise<PDFGenerationResponse> {
    try {
      const sale = mockProductSales.find(s => s.id === saleId);
      if (!sale) {
        throw new Error('Product sale not found');
      }

      const pdfData = await pdfTemplateService.generatePdf(sale);
      return pdfData;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  // Generate PDF for product sales report
  async generateReportPdf(filters: ProductSaleFilters): Promise<PDFGenerationResponse> {
    try {
      const sales = await this.getProductSales(filters);
      const pdfData = await pdfTemplateService.generateReportPdf(sales);
      return pdfData;
    } catch (error) {
      console.error('Error generating report PDF:', error);
      throw new Error('Failed to generate report PDF');
    }
  }

  // Generate service contract from product sale
  async generateServiceContract(saleId: string): Promise<any> {
    try {
      const sale = await this.getProductSaleById(saleId);
      
      // Generate contract number
      const currentYear = new Date().getFullYear();
      const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const contractNumber = `SC-${currentYear}-${randomSuffix}`;
      
      // Create service contract data
      const serviceContractData = {
        product_sale_id: sale.id,
        contract_number: contractNumber,
        customer_id: sale.customer_id,
        customer_name: sale.customer_name,
        product_id: sale.product_id,
        product_name: sale.product_name,
        start_date: sale.delivery_date,
        end_date: sale.warranty_expiry,
        status: 'active',
        contract_value: sale.total_cost,
        annual_value: sale.total_cost,
        terms: 'Standard service contract terms. Service provider will provide technical support and maintenance.',
        warranty_period: 12,
        service_level: 'standard' as const,
        auto_renewal: true,
        renewal_notice_period: 60,
        tenant_id: sale.tenant_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: sale.created_by
      };
      
      // In production, this would be saved to the database
      console.log('Generated service contract:', serviceContractData);
      
      return serviceContractData;
    } catch (error) {
      console.error('Error generating service contract:', error);
      throw new Error('Failed to generate service contract');
    }
  }

  // Private method to auto-create service contract
  private async createServiceContract(productSale: ProductSale): Promise<void> {
    try {
      // Auto-generate service contract when product sale is created
      await this.generateServiceContract(productSale.id);
    } catch (error) {
      console.error('Error creating service contract:', error);
      // Don't throw error here as it shouldn't block the product sale creation
    }
  }

  // Generate Contract PDF for product sale
  async generateContractPDF(saleId: string): Promise<PDFGenerationResponse> {
    try {
      const sale = await this.getProductSaleById(saleId);
      const templates = await pdfTemplateService.getTemplates();
      const contractTemplate = templates.find(t => t.type === 'contract' && t.isDefault);
      
      if (!contractTemplate) {
        throw new Error('No default contract template found');
      }

      return await pdfTemplateService.generatePDF({
        templateId: contractTemplate.id,
        data: {
          customerName: sale.customer_name,
          companyName: 'Your Company Name',
          deliveryDate: sale.delivery_date,
          totalAmount: `$${sale.total_cost.toFixed(2)}`,
          productName: sale.product_name,
          warrantyPeriod: '1 Year',
          contractNumber: `CNT-${sale.id}`
        },
        fileName: `contract_${sale.id}.pdf`
      });
    } catch (error) {
      console.error('Error generating contract PDF:', error);
      throw new Error('Failed to generate contract PDF');
    }
  }

  // Generate Receipt PDF for product sale
  async generateReceiptPDF(saleId: string): Promise<PDFGenerationResponse> {
    try {
      const sale = await this.getProductSaleById(saleId);
      const templates = await pdfTemplateService.getTemplates();
      const receiptTemplate = templates.find(t => t.type === 'receipt' && t.isDefault);
      
      if (!receiptTemplate) {
        throw new Error('No default receipt template found');
      }

      return await pdfTemplateService.generatePDF({
        templateId: receiptTemplate.id,
        data: {
          customerName: sale.customer_name,
          companyName: 'Your Company Name',
          deliveryDate: sale.delivery_date,
          totalAmount: `$${sale.total_cost.toFixed(2)}`,
          productName: sale.product_name,
          quantity: sale.units.toString(),
          unitPrice: `$${sale.cost_per_unit.toFixed(2)}`,
          receiptNumber: `RCP-${sale.id}`
        },
        fileName: `receipt_${sale.id}.pdf`
      });
    } catch (error) {
      console.error('Error generating receipt PDF:', error);
      throw new Error('Failed to generate receipt PDF');
    }
  }
}

export const productSaleService = new ProductSaleService();
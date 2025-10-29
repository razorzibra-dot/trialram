/**
 * Report Generation Service for Product Sales
 * Generates comprehensive reports in various formats
 */

import { ProductSale, ProductSalesAnalytics } from '@/types/productSales';

export interface ReportConfig {
  title: string;
  subtitle?: string;
  includeSummary: boolean;
  includeCharts: boolean;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  filters?: {
    status?: string;
    customerName?: string;
    productName?: string;
  };
}

export interface ReportSchedule {
  id: string;
  name: string;
  reportType: 'monthly_sales' | 'customer_sales' | 'product_sales' | 'revenue_report';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface MonthlySalesReport {
  month: string;
  totalSales: number;
  totalRevenue: number;
  averageSaleValue: number;
  topProducts: Array<{ name: string; count: number; revenue: number }>;
  topCustomers: Array<{ name: string; count: number; revenue: number }>;
  statusBreakdown: Array<{ status: string; count: number; percentage: number }>;
}

export interface CustomerSalesReport {
  customerName: string;
  totalSales: number;
  totalRevenue: number;
  averageSaleValue: number;
  products: Array<{ name: string; quantity: number; totalValue: number }>;
  recentSales: Array<{ saleNumber: string; date: string; amount: number; status: string }>;
}

export interface ProductSalesReport {
  productName: string;
  totalUnitsSold: number;
  totalRevenue: number;
  averageUnitPrice: number;
  topCustomers: Array<{ name: string; quantity: number; totalValue: number }>;
  sales: Array<{ saleNumber: string; customer: string; quantity: number; value: number; date: string }>;
}

export interface RevenueReport {
  period: string;
  totalRevenue: number;
  totalSales: number;
  averageOrderValue: number;
  revenueByStatus: Array<{ status: string; revenue: number; count: number }>;
  revenueByProduct: Array<{ product: string; revenue: number; count: number }>;
  revenueByCustomer: Array<{ customer: string; revenue: number; count: number }>;
  revenueGrowth: number; // Percentage compared to previous period
}

class ReportGenerationService {
  /**
   * Generate monthly sales report
   */
  generateMonthlySalesReport(
    sales: ProductSale[],
    analytics: ProductSalesAnalytics,
    month: string
  ): MonthlySalesReport {
    const [monthNum, year] = month.split('-').map(Number);
    const monthSales = sales.filter(s => {
      const saleDate = new Date(s.sale_date);
      return saleDate.getMonth() === monthNum - 1 && saleDate.getFullYear() === year;
    });

    return {
      month,
      totalSales: monthSales.length,
      totalRevenue: monthSales.reduce((sum, s) => sum + (s.total_value || 0), 0),
      averageSaleValue: monthSales.length > 0 
        ? monthSales.reduce((sum, s) => sum + (s.total_value || 0), 0) / monthSales.length
        : 0,
      topProducts: analytics.top_products || [],
      topCustomers: analytics.top_customers || [],
      statusBreakdown: this.getStatusBreakdown(monthSales),
    };
  }

  /**
   * Generate customer sales report
   */
  generateCustomerSalesReport(
    sales: ProductSale[],
    customerName: string
  ): CustomerSalesReport {
    const customerSales = sales.filter(s => s.customer_name === customerName);
    const totalRevenue = customerSales.reduce((sum, s) => sum + (s.total_value || 0), 0);

    // Group by product
    const productMap = new Map<string, { quantity: number; totalValue: number }>();
    customerSales.forEach(sale => {
      const existing = productMap.get(sale.product_name || 'Unknown') || { quantity: 0, totalValue: 0 };
      existing.quantity += sale.quantity || 0;
      existing.totalValue += sale.total_value || 0;
      productMap.set(sale.product_name || 'Unknown', existing);
    });

    return {
      customerName,
      totalSales: customerSales.length,
      totalRevenue,
      averageSaleValue: customerSales.length > 0 ? totalRevenue / customerSales.length : 0,
      products: Array.from(productMap.entries()).map(([name, data]) => ({
        name,
        quantity: data.quantity,
        totalValue: data.totalValue,
      })),
      recentSales: customerSales.map(s => ({
        saleNumber: s.sale_number || 'N/A',
        date: new Date(s.sale_date).toLocaleDateString('en-US'),
        amount: s.total_value || 0,
        status: s.status || 'Unknown',
      })),
    };
  }

  /**
   * Generate product sales report
   */
  generateProductSalesReport(
    sales: ProductSale[],
    productName: string
  ): ProductSalesReport {
    const productSales = sales.filter(s => s.product_name === productName);
    const totalRevenue = productSales.reduce((sum, s) => sum + (s.total_value || 0), 0);
    const totalUnits = productSales.reduce((sum, s) => sum + (s.quantity || 0), 0);

    // Group by customer
    const customerMap = new Map<string, { quantity: number; totalValue: number }>();
    productSales.forEach(sale => {
      const existing = customerMap.get(sale.customer_name || 'Unknown') || { quantity: 0, totalValue: 0 };
      existing.quantity += sale.quantity || 0;
      existing.totalValue += sale.total_value || 0;
      customerMap.set(sale.customer_name || 'Unknown', existing);
    });

    return {
      productName,
      totalUnitsSold: totalUnits,
      totalRevenue,
      averageUnitPrice: totalUnits > 0 ? totalRevenue / totalUnits : 0,
      topCustomers: Array.from(customerMap.entries())
        .map(([name, data]) => ({
          name,
          quantity: data.quantity,
          totalValue: data.totalValue,
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 5),
      sales: productSales.map(s => ({
        saleNumber: s.sale_number || 'N/A',
        customer: s.customer_name || 'Unknown',
        quantity: s.quantity || 0,
        value: s.total_value || 0,
        date: new Date(s.sale_date).toLocaleDateString('en-US'),
      })),
    };
  }

  /**
   * Generate revenue report
   */
  generateRevenueReport(
    sales: ProductSale[],
    analytics: ProductSalesAnalytics,
    period: string
  ): RevenueReport {
    const totalRevenue = sales.reduce((sum, s) => sum + (s.total_value || 0), 0);

    return {
      period,
      totalRevenue,
      totalSales: sales.length,
      averageOrderValue: sales.length > 0 ? totalRevenue / sales.length : 0,
      revenueByStatus: this.getRevenueByStatus(sales),
      revenueByProduct: this.getRevenueByProduct(sales),
      revenueByCustomer: this.getRevenueByCustomer(sales),
      revenueGrowth: 0, // Would need previous period data
    };
  }

  /**
   * Export report to HTML
   */
  exportToHTML(report: any, reportType: string, config: ReportConfig): string {
    const currentDate = new Date().toLocaleDateString('en-US');
    
    let reportContent = '';

    switch (reportType) {
      case 'monthly_sales':
        reportContent = this.renderMonthlySalesHTML(report as MonthlySalesReport, config);
        break;
      case 'customer_sales':
        reportContent = this.renderCustomerSalesHTML(report as CustomerSalesReport, config);
        break;
      case 'product_sales':
        reportContent = this.renderProductSalesHTML(report as ProductSalesReport, config);
        break;
      case 'revenue_report':
        reportContent = this.renderRevenueReportHTML(report as RevenueReport, config);
        break;
      default:
        reportContent = '<p>Unknown report type</p>';
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${config.title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #1890ff;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #1890ff;
            margin: 0;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            color: #1890ff;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th {
            background-color: #f0f0f0;
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
            font-weight: bold;
          }
          td {
            border: 1px solid #ddd;
            padding: 10px;
          }
          .summary-box {
            background-color: #f9f9f9;
            border-left: 4px solid #1890ff;
            padding: 15px;
            margin: 15px 0;
          }
          .summary-item {
            display: inline-block;
            margin-right: 30px;
          }
          .summary-label {
            color: #666;
            font-size: 12px;
          }
          .summary-value {
            color: #1890ff;
            font-size: 18px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            color: #999;
            font-size: 12px;
            margin-top: 40px;
            border-top: 1px solid #e0e0e0;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${config.title}</h1>
          ${config.subtitle ? `<p>${config.subtitle}</p>` : ''}
          <p>Generated on ${currentDate}</p>
        </div>
        
        ${reportContent}
        
        <div class="footer">
          <p>This report was automatically generated. Please verify data accuracy.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for monthly sales report
   */
  private renderMonthlySalesHTML(report: MonthlySalesReport, config: ReportConfig): string {
    return `
      <div class="section">
        <h2>Sales Summary</h2>
        <div class="summary-box">
          <div class="summary-item">
            <div class="summary-label">Total Sales</div>
            <div class="summary-value">${report.totalSales}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Revenue</div>
            <div class="summary-value">$${report.totalRevenue.toFixed(2)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Average Sale Value</div>
            <div class="summary-value">$${report.averageSaleValue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Status Breakdown</h2>
        <table>
          <tr>
            <th>Status</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
          ${report.statusBreakdown.map(item => `
            <tr>
              <td>${item.status}</td>
              <td>${item.count}</td>
              <td>${item.percentage.toFixed(1)}%</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div class="section">
        <h2>Top Products</h2>
        <table>
          <tr>
            <th>Product</th>
            <th>Units Sold</th>
            <th>Revenue</th>
          </tr>
          ${report.topProducts.slice(0, 5).map((item: any) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.count}</td>
              <td>$${item.revenue.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div class="section">
        <h2>Top Customers</h2>
        <table>
          <tr>
            <th>Customer</th>
            <th>Purchases</th>
            <th>Total Spent</th>
          </tr>
          ${report.topCustomers.slice(0, 5).map((item: any) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.count}</td>
              <td>$${item.revenue.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  /**
   * Generate HTML for customer sales report
   */
  private renderCustomerSalesHTML(report: CustomerSalesReport, config: ReportConfig): string {
    return `
      <div class="section">
        <h2>Customer Information</h2>
        <div class="summary-box">
          <div class="summary-item">
            <div class="summary-label">Customer Name</div>
            <div class="summary-value">${report.customerName}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Sales</div>
            <div class="summary-value">${report.totalSales}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Revenue</div>
            <div class="summary-value">$${report.totalRevenue.toFixed(2)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Average Sale Value</div>
            <div class="summary-value">$${report.averageSaleValue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Products Purchased</h2>
        <table>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Total Value</th>
          </tr>
          ${report.products.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>$${item.totalValue.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div class="section">
        <h2>Recent Sales</h2>
        <table>
          <tr>
            <th>Sale Number</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
          ${report.recentSales.map(item => `
            <tr>
              <td>${item.saleNumber}</td>
              <td>${item.date}</td>
              <td>$${item.amount.toFixed(2)}</td>
              <td>${item.status}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  /**
   * Generate HTML for product sales report
   */
  private renderProductSalesHTML(report: ProductSalesReport, config: ReportConfig): string {
    return `
      <div class="section">
        <h2>Product Information</h2>
        <div class="summary-box">
          <div class="summary-item">
            <div class="summary-label">Product</div>
            <div class="summary-value">${report.productName}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Units Sold</div>
            <div class="summary-value">${report.totalUnitsSold}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Revenue</div>
            <div class="summary-value">$${report.totalRevenue.toFixed(2)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Average Unit Price</div>
            <div class="summary-value">$${report.averageUnitPrice.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Top Customers</h2>
        <table>
          <tr>
            <th>Customer</th>
            <th>Quantity</th>
            <th>Total Value</th>
          </tr>
          ${report.topCustomers.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>$${item.totalValue.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div class="section">
        <h2>Sales Details</h2>
        <table>
          <tr>
            <th>Sale Number</th>
            <th>Customer</th>
            <th>Quantity</th>
            <th>Value</th>
            <th>Date</th>
          </tr>
          ${report.sales.slice(0, 20).map(item => `
            <tr>
              <td>${item.saleNumber}</td>
              <td>${item.customer}</td>
              <td>${item.quantity}</td>
              <td>$${item.value.toFixed(2)}</td>
              <td>${item.date}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  /**
   * Generate HTML for revenue report
   */
  private renderRevenueReportHTML(report: RevenueReport, config: ReportConfig): string {
    return `
      <div class="section">
        <h2>Revenue Summary</h2>
        <div class="summary-box">
          <div class="summary-item">
            <div class="summary-label">Total Revenue</div>
            <div class="summary-value">$${report.totalRevenue.toFixed(2)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Sales</div>
            <div class="summary-value">${report.totalSales}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Average Order Value</div>
            <div class="summary-value">$${report.averageOrderValue.toFixed(2)}</div>
          </div>
          ${report.revenueGrowth !== 0 ? `
            <div class="summary-item">
              <div class="summary-label">Growth vs Previous Period</div>
              <div class="summary-value">${report.revenueGrowth > 0 ? '+' : ''}${report.revenueGrowth.toFixed(1)}%</div>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="section">
        <h2>Revenue by Status</h2>
        <table>
          <tr>
            <th>Status</th>
            <th>Revenue</th>
            <th>Count</th>
          </tr>
          ${report.revenueByStatus.map(item => `
            <tr>
              <td>${item.status}</td>
              <td>$${item.revenue.toFixed(2)}</td>
              <td>${item.count}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div class="section">
        <h2>Revenue by Product (Top 10)</h2>
        <table>
          <tr>
            <th>Product</th>
            <th>Revenue</th>
            <th>Count</th>
          </tr>
          ${report.revenueByProduct.slice(0, 10).map(item => `
            <tr>
              <td>${item.product}</td>
              <td>$${item.revenue.toFixed(2)}</td>
              <td>${item.count}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div class="section">
        <h2>Revenue by Customer (Top 10)</h2>
        <table>
          <tr>
            <th>Customer</th>
            <th>Revenue</th>
            <th>Count</th>
          </tr>
          ${report.revenueByCustomer.slice(0, 10).map(item => `
            <tr>
              <td>${item.customer}</td>
              <td>$${item.revenue.toFixed(2)}</td>
              <td>${item.count}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  /**
   * Helper: Get status breakdown
   */
  private getStatusBreakdown(sales: ProductSale[]): Array<{ status: string; count: number; percentage: number }> {
    const statusMap = new Map<string, number>();
    sales.forEach(s => {
      const status = s.status || 'Unknown';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    return Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: sales.length > 0 ? (count / sales.length) * 100 : 0,
    }));
  }

  /**
   * Helper: Get revenue by status
   */
  private getRevenueByStatus(sales: ProductSale[]): Array<{ status: string; revenue: number; count: number }> {
    const statusMap = new Map<string, { revenue: number; count: number }>();
    sales.forEach(s => {
      const status = s.status || 'Unknown';
      const existing = statusMap.get(status) || { revenue: 0, count: 0 };
      existing.revenue += s.total_value || 0;
      existing.count += 1;
      statusMap.set(status, existing);
    });

    return Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      revenue: data.revenue,
      count: data.count,
    }));
  }

  /**
   * Helper: Get revenue by product
   */
  private getRevenueByProduct(sales: ProductSale[]): Array<{ product: string; revenue: number; count: number }> {
    const productMap = new Map<string, { revenue: number; count: number }>();
    sales.forEach(s => {
      const product = s.product_name || 'Unknown';
      const existing = productMap.get(product) || { revenue: 0, count: 0 };
      existing.revenue += s.total_value || 0;
      existing.count += 1;
      productMap.set(product, existing);
    });

    return Array.from(productMap.entries())
      .map(([product, data]) => ({
        product,
        revenue: data.revenue,
        count: data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Helper: Get revenue by customer
   */
  private getRevenueByCustomer(sales: ProductSale[]): Array<{ customer: string; revenue: number; count: number }> {
    const customerMap = new Map<string, { revenue: number; count: number }>();
    sales.forEach(s => {
      const customer = s.customer_name || 'Unknown';
      const existing = customerMap.get(customer) || { revenue: 0, count: 0 };
      existing.revenue += s.total_value || 0;
      existing.count += 1;
      customerMap.set(customer, existing);
    });

    return Array.from(customerMap.entries())
      .map(([customer, data]) => ({
        customer,
        revenue: data.revenue,
        count: data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Download report as PDF (requires html2pdf or similar)
   */
  downloadReportAsPDF(html: string, filename: string): void {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const reportGenerationService = new ReportGenerationService();
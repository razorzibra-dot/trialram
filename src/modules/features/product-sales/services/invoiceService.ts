/**
 * Product Sales Invoice Service
 * Handles invoice generation, numbering, and storage for product sales
 */

import { ProductSale, ProductSaleItem } from '@/types/productSales';
import { Customer } from '@/types/crm';
import { Product } from '@/types/masters';
import { pdfTemplateService } from '@/services/pdfTemplateService';
import { auditService } from '@/services';

export interface Invoice {
  id: string;
  sale_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  customer_address?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  tax_rate: number;
  total: number;
  currency: string;
  status: 'draft' | 'generated' | 'sent' | 'viewed' | 'paid';
  generated_at: Date;
  sent_at?: Date;
  paid_at?: Date;
  pdf_url?: string;
  notes?: string;
  payment_terms?: string;
  due_date?: Date;
}

export interface InvoiceLineItem {
  product_id: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
}

interface InvoiceGenerationOptions {
  taxRate?: number;
  paymentTerms?: string;
  notes?: string;
  currency?: string;
}

/**
 * Generate next invoice number
 * Format: INV-YYYY-MM-XXXXX (INV-2025-01-00001)
 */
function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Use timestamp-based sequence for uniqueness
  const timestamp = Date.now().toString().slice(-5);
  const sequence = String(parseInt(timestamp) % 100000).padStart(5, '0');
  
  return `INV-${year}-${month}-${sequence}`;
}

/**
 * Calculate invoice totals
 */
function calculateInvoiceTotals(
  items: InvoiceLineItem[],
  taxRate: number = 0
): { subtotal: number; tax: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Convert ProductSale to InvoiceLineItems
 * Looks up product names from the products array (normalized structure)
 */
function convertSaleItemsToInvoiceItems(
  saleItems: ProductSaleItem[],
  products: Product[],
  taxRate: number = 0
): InvoiceLineItem[] {
  return saleItems.map(item => {
    const product = products.find(p => p.id === item.product_id);
    return {
      product_id: item.product_id,
      product_name: product?.name || 'Product',
      description: item.description || '',
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: taxRate,
      line_total: item.quantity * item.unit_price,
    };
  });
}

/**
 * Format currency value
 */
function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Render invoice HTML from template
 */
function renderInvoiceHTML(invoice: Invoice, template: any): string {
  let html = template.content;

  // Replace template variables
  const replacements: Record<string, string> = {
    invoice_number: invoice.invoice_number,
    date: invoice.generated_at.toLocaleDateString(),
    due_date: invoice.due_date?.toLocaleDateString() || 'Upon Receipt',
    customer_name: invoice.customer_name,
    customer_address: invoice.customer_address || '',
    customer_city: '',
    customer_state: '',
    customer_zip: '',
    subtotal: formatCurrency(invoice.subtotal),
    tax: formatCurrency(invoice.tax),
    total: formatCurrency(invoice.total),
    items: invoice.items
      .map(
        item => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${item.product_name}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(item.unit_price)}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(item.line_total)}</td>
          </tr>
        `
      )
      .join(''),
  };

  // Replace all variables in template
  Object.entries(replacements).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  return html;
}

export const invoiceService = {
  /**
   * Generate invoice from ProductSale
   * Requires customers and products arrays to look up denormalized fields
   */
  async generateInvoice(
    sale: ProductSale,
    saleItems: ProductSaleItem[],
    customers: Customer[],
    products: Product[],
    options: InvoiceGenerationOptions = {}
  ): Promise<Invoice> {
    try {
      const {
        taxRate = 0,
        paymentTerms = 'Net 30',
        notes = '',
        currency = 'USD',
      } = options;

      // Look up customer name
      const customer = customers.find(c => c.id === sale.customer_id);
      const customerName = customer?.name || 'Valued Customer';

      // Generate invoice number
      const invoiceNumber = generateInvoiceNumber();

      // Convert sale items to invoice items
      const invoiceItems = convertSaleItemsToInvoiceItems(saleItems, products, taxRate);

      // Calculate totals
      const { subtotal, tax, total } = calculateInvoiceTotals(invoiceItems, taxRate);

      // Create due date (30 days from now by default)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const invoice: Invoice = {
        id: `inv_${Date.now()}`,
        sale_id: sale.id,
        invoice_number: invoiceNumber,
        customer_id: sale.customer_id,
        customer_name: customerName,
        customer_email: customer?.email,
        customer_address: sale.billing_address || sale.shipping_address,
        items: invoiceItems,
        subtotal,
        tax,
        tax_rate: taxRate,
        total,
        currency,
        status: 'generated',
        generated_at: new Date(),
        due_date: dueDate,
        payment_terms: paymentTerms,
        notes,
      };

      // Log invoice generation
      await auditService.logAction({
        action: 'invoice_generated',
        resource: 'product_sale',
        resource_id: sale.id,
        details: {
          invoice_number: invoiceNumber,
          total,
          tax_rate: taxRate,
        },
      });

      return invoice;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw new Error('Failed to generate invoice');
    }
  },

  /**
   * Get default invoice template
   */
  async getDefaultTemplate() {
    try {
      const templates = await pdfTemplateService.getAllTemplates({
        category: 'invoice',
        is_active: true,
      });

      // Return default template or first active one
      return templates.find(t => t.is_default) || templates[0];
    } catch (error) {
      console.error('Error fetching invoice template:', error);
      return null;
    }
  },

  /**
   * Render invoice to HTML (for PDF conversion)
   */
  async renderInvoiceHTML(invoice: Invoice): Promise<string> {
    try {
      const template = await this.getDefaultTemplate();
      if (!template) {
        throw new Error('No invoice template found');
      }

      return renderInvoiceHTML(invoice, template);
    } catch (error) {
      console.error('Error rendering invoice HTML:', error);
      throw new Error('Failed to render invoice');
    }
  },

  /**
   * Calculate invoice totals
   */
  calculateTotals(items: InvoiceLineItem[], taxRate: number = 0) {
    return calculateInvoiceTotals(items, taxRate);
  },

  /**
   * Generate invoice number
   */
  generateInvoiceNumber() {
    return generateInvoiceNumber();
  },

  /**
   * Format currency
   */
  formatCurrency(value: number, currency: string = 'USD'): string {
    return formatCurrency(value, currency);
  },
};

export default invoiceService;
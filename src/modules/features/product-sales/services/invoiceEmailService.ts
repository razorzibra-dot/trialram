/**
 * Invoice Email Service
 * Handles professional invoice email sending with PDF attachments
 */

import { ProductSale, ProductSaleItem } from '@/types/productSales';
import { Invoice } from './invoiceService';
import { auditService } from '@/services';

export interface InvoiceEmailConfig {
  to: string; // Customer email
  cc?: string[]; // CC recipients (manager, accountant)
  bcc?: string[]; // BCC recipients
  subject?: string;
  customMessage?: string;
  includeTerms?: boolean;
  scheduledFor?: Date;
}

export interface InvoiceEmailResult {
  success: boolean;
  messageId?: string;
  status: 'queued' | 'sent' | 'failed';
  sentAt: Date;
  recipients: {
    to: string[];
    cc: string[];
    bcc: string[];
  };
  error?: string;
}

/**
 * Generate professional invoice email HTML
 */
function generateInvoiceEmailHTML(
  invoice: Invoice,
  sale: ProductSale,
  items: ProductSaleItem[],
  customMessage?: string
): string {
  const formatCurrency = (value: number, currency: string = 'USD'): string => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return formatter.format(value);
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const itemsHTML = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: left; color: #333;">
        ${item.product_name}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #333;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #333;">
        ${formatCurrency(item.unit_price, invoice.currency)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; color: #333;">
        ${formatCurrency(item.quantity * item.unit_price, invoice.currency)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #333;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .invoice-number {
          font-size: 14px;
          opacity: 0.9;
          margin-top: 10px;
        }
        .content {
          padding: 30px;
        }
        .greeting {
          margin-bottom: 20px;
          color: #555;
        }
        .message {
          margin: 20px 0;
          padding: 15px;
          background-color: #f9f9f9;
          border-left: 4px solid #667eea;
          border-radius: 4px;
          color: #555;
        }
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #667eea;
          text-transform: uppercase;
          margin-top: 25px;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }
        .info-row {
          display: flex;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .info-label {
          font-weight: 600;
          color: #333;
          width: 150px;
        }
        .info-value {
          color: #666;
          flex: 1;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background-color: #f0f0f0;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #ddd;
          font-size: 13px;
        }
        .totals {
          margin-top: 20px;
          border-top: 2px solid #ddd;
          padding-top: 15px;
        }
        .total-row {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .total-label {
          font-weight: 600;
          margin-right: 20px;
          color: #333;
          min-width: 150px;
          text-align: right;
        }
        .total-value {
          margin-left: auto;
          text-align: right;
          min-width: 120px;
        }
        .grand-total {
          font-size: 18px;
          font-weight: 700;
          color: #667eea;
          border-top: 1px solid #ddd;
          padding-top: 12px;
        }
        .payment-terms {
          margin-top: 25px;
          padding: 15px;
          background-color: #f0f4ff;
          border-radius: 4px;
          font-size: 13px;
          color: #555;
        }
        .payment-terms strong {
          color: #333;
        }
        .footer {
          background-color: #f9f9f9;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #999;
          border-top: 1px solid #e0e0e0;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 30px;
          border-radius: 4px;
          text-decoration: none;
          margin: 20px 0;
          font-weight: 600;
          font-size: 14px;
        }
        .attachment-note {
          margin-top: 15px;
          padding: 10px;
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          border-radius: 4px;
          font-size: 12px;
          color: #856404;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Invoice</h1>
          <div class="invoice-number">${invoice.invoice_number}</div>
        </div>

        <div class="content">
          <div class="greeting">
            <p>Hello ${invoice.customer_name},</p>
            <p>Thank you for your business. Please find your invoice details below.</p>
          </div>

          ${customMessage ? `<div class="message">${customMessage}</div>` : ''}

          <div class="section-title">Invoice Details</div>
          <div class="info-row">
            <div class="info-label">Invoice Number:</div>
            <div class="info-value">${invoice.invoice_number}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Date:</div>
            <div class="info-value">${formatDate(invoice.generated_at)}</div>
          </div>
          ${invoice.due_date ? `
            <div class="info-row">
              <div class="info-label">Due Date:</div>
              <div class="info-value">${formatDate(invoice.due_date)}</div>
            </div>
          ` : ''}

          <div class="section-title">Bill To</div>
          <div class="info-value">
            <strong>${invoice.customer_name}</strong><br>
            ${invoice.customer_address || 'Address not provided'}
          </div>

          <div class="section-title">Invoice Items</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <div class="total-label">Subtotal:</div>
              <div class="total-value">${formatCurrency(invoice.subtotal, invoice.currency)}</div>
            </div>
            ${invoice.tax > 0 ? `
              <div class="total-row">
                <div class="total-label">Tax (${invoice.tax_rate}%):</div>
                <div class="total-value">${formatCurrency(invoice.tax, invoice.currency)}</div>
              </div>
            ` : ''}
            <div class="total-row grand-total">
              <div class="total-label">Total:</div>
              <div class="total-value">${formatCurrency(invoice.total, invoice.currency)}</div>
            </div>
          </div>

          ${invoice.payment_terms ? `
            <div class="payment-terms">
              <strong>Payment Terms:</strong> ${invoice.payment_terms}
            </div>
          ` : ''}

          ${invoice.notes ? `
            <div class="section-title">Notes</div>
            <p style="color: #666; font-size: 14px;">${invoice.notes}</p>
          ` : ''}

          <div class="attachment-note">
            📎 Invoice PDF is attached to this email. Please download and save it for your records.
          </div>
        </div>

        <div class="footer">
          <p>This is an automated email. Please do not reply directly to this message.</p>
          <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Validate email addresses
 */
function validateEmails(emails: string[]): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emails.every(email => emailRegex.test(email.trim()));
}

/**
 * Mock Invoice Email Service
 * In production, this would integrate with SendGrid, AWS SES, or similar
 */
class MockInvoiceEmailService {
  async sendInvoiceEmail(
    invoice: Invoice,
    sale: ProductSale,
    items: ProductSaleItem[],
    config: InvoiceEmailConfig
  ): Promise<InvoiceEmailResult> {
    try {
      // Validate emails
      const allEmails = [config.to, ...(config.cc || []), ...(config.bcc || [])];
      if (!validateEmails(allEmails)) {
        throw new Error('Invalid email address format');
      }

      // Validate recipient
      if (!config.to || config.to.trim() === '') {
        throw new Error('Recipient email is required');
      }

      // Generate email HTML
      const emailHTML = generateInvoiceEmailHTML(invoice, sale, items, config.customMessage);

      // Generate message ID (mock)
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Log email sending
      console.log(`[Mock] Sending invoice email:`, {
        messageId,
        to: config.to,
        cc: config.cc,
        bcc: config.bcc,
        subject: config.subject || `Invoice ${invoice.invoice_number}`,
        invoiceNumber: invoice.invoice_number
      });

      // Audit log
      await auditService.logAction({
        action: 'invoice_email_sent',
        entity_type: 'invoice',
        entity_id: invoice.id,
        details: {
          invoice_number: invoice.invoice_number,
          recipient: config.to,
          cc_recipients: config.cc || [],
          sale_id: sale.id
        },
        status: 'success'
      });

      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        messageId,
        status: 'sent',
        sentAt: new Date(),
        recipients: {
          to: [config.to],
          cc: config.cc || [],
          bcc: config.bcc || []
        }
      };
    } catch (error) {
      console.error('Failed to send invoice email:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Audit log failure
      await auditService.logAction({
        action: 'invoice_email_sent',
        entity_type: 'invoice',
        entity_id: invoice.id,
        details: {
          invoice_number: invoice.invoice_number,
          error: errorMessage
        },
        status: 'failed'
      });

      return {
        success: false,
        status: 'failed',
        sentAt: new Date(),
        recipients: {
          to: [config.to],
          cc: config.cc || [],
          bcc: config.bcc || []
        },
        error: errorMessage
      };
    }
  }

  /**
   * Send invoice email with PDF attachment
   */
  async sendInvoiceWithAttachment(
    invoice: Invoice,
    sale: ProductSale,
    items: ProductSaleItem[],
    pdfBlob: Blob,
    config: InvoiceEmailConfig
  ): Promise<InvoiceEmailResult> {
    try {
      // Validate emails
      const allEmails = [config.to, ...(config.cc || []), ...(config.bcc || [])];
      if (!validateEmails(allEmails)) {
        throw new Error('Invalid email address format');
      }

      // Validate PDF
      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('Invalid PDF attachment');
      }

      // Generate email HTML
      const emailHTML = generateInvoiceEmailHTML(invoice, sale, items, config.customMessage);

      // Generate message ID (mock)
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Log email sending
      console.log(`[Mock] Sending invoice email with attachment:`, {
        messageId,
        to: config.to,
        cc: config.cc,
        bcc: config.bcc,
        subject: config.subject || `Invoice ${invoice.invoice_number}`,
        invoiceNumber: invoice.invoice_number,
        attachmentSize: pdfBlob.size
      });

      // Audit log
      await auditService.logAction({
        action: 'invoice_email_sent_with_attachment',
        entity_type: 'invoice',
        entity_id: invoice.id,
        details: {
          invoice_number: invoice.invoice_number,
          recipient: config.to,
          cc_recipients: config.cc || [],
          sale_id: sale.id,
          attachment_size: pdfBlob.size
        },
        status: 'success'
      });

      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 800));

      return {
        success: true,
        messageId,
        status: 'sent',
        sentAt: new Date(),
        recipients: {
          to: [config.to],
          cc: config.cc || [],
          bcc: config.bcc || []
        }
      };
    } catch (error) {
      console.error('Failed to send invoice email with attachment:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Audit log failure
      await auditService.logAction({
        action: 'invoice_email_sent_with_attachment',
        entity_type: 'invoice',
        entity_id: invoice.id,
        details: {
          invoice_number: invoice.invoice_number,
          error: errorMessage
        },
        status: 'failed'
      });

      return {
        success: false,
        status: 'failed',
        sentAt: new Date(),
        recipients: {
          to: [config.to],
          cc: config.cc || [],
          bcc: config.bcc || []
        },
        error: errorMessage
      };
    }
  }

  /**
   * Schedule invoice email for later
   */
  async scheduleInvoiceEmail(
    invoice: Invoice,
    sale: ProductSale,
    items: ProductSaleItem[],
    config: InvoiceEmailConfig & { scheduledFor: Date }
  ): Promise<InvoiceEmailResult> {
    try {
      // Validate scheduled date
      if (config.scheduledFor < new Date()) {
        throw new Error('Scheduled date must be in the future');
      }

      const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(`[Mock] Scheduling invoice email:`, {
        queueId,
        scheduledFor: config.scheduledFor,
        invoiceNumber: invoice.invoice_number
      });

      // Audit log
      await auditService.logAction({
        action: 'invoice_email_scheduled',
        entity_type: 'invoice',
        entity_id: invoice.id,
        details: {
          invoice_number: invoice.invoice_number,
          recipient: config.to,
          scheduled_for: config.scheduledFor.toISOString(),
          queue_id: queueId
        },
        status: 'success'
      });

      return {
        success: true,
        status: 'queued',
        sentAt: new Date(),
        recipients: {
          to: [config.to],
          cc: config.cc || [],
          bcc: config.bcc || []
        }
      };
    } catch (error) {
      console.error('Failed to schedule invoice email:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        success: false,
        status: 'failed',
        sentAt: new Date(),
        recipients: {
          to: [config.to],
          cc: config.cc || [],
          bcc: config.bcc || []
        },
        error: errorMessage
      };
    }
  }

  /**
   * Generate email preview HTML
   */
  generateEmailPreview(
    invoice: Invoice,
    sale: ProductSale,
    items: ProductSaleItem[],
    customMessage?: string
  ): string {
    return generateInvoiceEmailHTML(invoice, sale, items, customMessage);
  }
}

export const invoiceEmailService = new MockInvoiceEmailService();
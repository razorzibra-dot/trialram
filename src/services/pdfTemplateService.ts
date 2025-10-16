/**
 * PDF Template Service
 * Manages PDF templates for invoices, contracts, reports, etc.
 */

export interface PDFTemplate {
  id: string;
  name: string;
  category: 'invoice' | 'contract' | 'report' | 'letter' | 'other';
  description: string;
  content: string;
  variables: string[]; // Available variables like {{customer_name}}, {{date}}, etc.
  is_default: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PDFTemplateFilters {
  category?: string;
  is_active?: boolean;
  search?: string;
}

class PDFTemplateService {
  private mockTemplates: PDFTemplate[] = [
    {
      id: '1',
      name: 'Standard Invoice',
      category: 'invoice',
      description: 'Standard invoice template with company branding',
      content: `
        <div style="font-family: Arial, sans-serif; padding: 40px;">
          <h1 style="color: #1890ff;">INVOICE</h1>
          <p><strong>Invoice Number:</strong> {{invoice_number}}</p>
          <p><strong>Date:</strong> {{date}}</p>
          <p><strong>Due Date:</strong> {{due_date}}</p>
          
          <h3>Bill To:</h3>
          <p>{{customer_name}}<br/>
          {{customer_address}}<br/>
          {{customer_city}}, {{customer_state}} {{customer_zip}}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #ddd; padding: 8px;">Description</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Quantity</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Price</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Total</th>
              </tr>
            </thead>
            <tbody>
              {{items}}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; text-align: right;">
            <p><strong>Subtotal:</strong> {{subtotal}}</p>
            <p><strong>Tax:</strong> {{tax}}</p>
            <p><strong>Total:</strong> {{total}}</p>
          </div>
        </div>
      `,
      variables: ['invoice_number', 'date', 'due_date', 'customer_name', 'customer_address', 'customer_city', 'customer_state', 'customer_zip', 'items', 'subtotal', 'tax', 'total'],
      is_default: true,
      is_active: true,
      created_by: 'admin',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Service Contract',
      category: 'contract',
      description: 'Standard service contract template',
      content: `
        <div style="font-family: Arial, sans-serif; padding: 40px;">
          <h1 style="text-align: center;">SERVICE CONTRACT</h1>
          
          <p>This Service Contract ("Agreement") is entered into on {{contract_date}} between:</p>
          
          <p><strong>Service Provider:</strong><br/>
          {{provider_name}}<br/>
          {{provider_address}}</p>
          
          <p><strong>Client:</strong><br/>
          {{client_name}}<br/>
          {{client_address}}</p>
          
          <h3>1. Services</h3>
          <p>{{services_description}}</p>
          
          <h3>2. Term</h3>
          <p>This Agreement shall commence on {{start_date}} and continue until {{end_date}}.</p>
          
          <h3>3. Compensation</h3>
          <p>{{compensation_details}}</p>
          
          <h3>4. Terms and Conditions</h3>
          <p>{{terms_and_conditions}}</p>
          
          <div style="margin-top: 60px;">
            <table style="width: 100%;">
              <tr>
                <td style="width: 50%;">
                  <p>_________________________</p>
                  <p>{{provider_name}}</p>
                  <p>Date: _______________</p>
                </td>
                <td style="width: 50%;">
                  <p>_________________________</p>
                  <p>{{client_name}}</p>
                  <p>Date: _______________</p>
                </td>
              </tr>
            </table>
          </div>
        </div>
      `,
      variables: ['contract_date', 'provider_name', 'provider_address', 'client_name', 'client_address', 'services_description', 'start_date', 'end_date', 'compensation_details', 'terms_and_conditions'],
      is_default: true,
      is_active: true,
      created_by: 'admin',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '3',
      name: 'Monthly Report',
      category: 'report',
      description: 'Monthly business report template',
      content: `
        <div style="font-family: Arial, sans-serif; padding: 40px;">
          <h1 style="color: #1890ff;">Monthly Report</h1>
          <p><strong>Period:</strong> {{report_month}} {{report_year}}</p>
          <p><strong>Generated:</strong> {{generated_date}}</p>
          
          <h2>Executive Summary</h2>
          <p>{{executive_summary}}</p>
          
          <h2>Key Metrics</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;"><strong>Total Revenue</strong></td>
              <td style="border: 1px solid #ddd; padding: 8px;">{{total_revenue}}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;"><strong>New Customers</strong></td>
              <td style="border: 1px solid #ddd; padding: 8px;">{{new_customers}}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;"><strong>Active Contracts</strong></td>
              <td style="border: 1px solid #ddd; padding: 8px;">{{active_contracts}}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;"><strong>Support Tickets</strong></td>
              <td style="border: 1px solid #ddd; padding: 8px;">{{support_tickets}}</td>
            </tr>
          </table>
          
          <h2>Detailed Analysis</h2>
          <p>{{detailed_analysis}}</p>
        </div>
      `,
      variables: ['report_month', 'report_year', 'generated_date', 'executive_summary', 'total_revenue', 'new_customers', 'active_contracts', 'support_tickets', 'detailed_analysis'],
      is_default: false,
      is_active: true,
      created_by: 'admin',
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    },
    {
      id: '4',
      name: 'Business Letter',
      category: 'letter',
      description: 'Professional business letter template',
      content: `
        <div style="font-family: Arial, sans-serif; padding: 40px;">
          <p style="text-align: right;">{{sender_address}}<br/>
          {{sender_city}}, {{sender_state}} {{sender_zip}}<br/>
          {{letter_date}}</p>
          
          <p>{{recipient_name}}<br/>
          {{recipient_title}}<br/>
          {{recipient_company}}<br/>
          {{recipient_address}}<br/>
          {{recipient_city}}, {{recipient_state}} {{recipient_zip}}</p>
          
          <p>Dear {{recipient_name}},</p>
          
          <p>{{letter_body}}</p>
          
          <p>Sincerely,</p>
          
          <p>{{sender_name}}<br/>
          {{sender_title}}</p>
        </div>
      `,
      variables: ['sender_address', 'sender_city', 'sender_state', 'sender_zip', 'letter_date', 'recipient_name', 'recipient_title', 'recipient_company', 'recipient_address', 'recipient_city', 'recipient_state', 'recipient_zip', 'letter_body', 'sender_name', 'sender_title'],
      is_default: false,
      is_active: true,
      created_by: 'admin',
      created_at: '2024-01-20T00:00:00Z',
      updated_at: '2024-01-20T00:00:00Z'
    }
  ];

  async getTemplates(filters?: PDFTemplateFilters): Promise<PDFTemplate[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = [...this.mockTemplates];

    if (filters?.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    if (filters?.is_active !== undefined) {
      filtered = filtered.filter(t => t.is_active === filters.is_active);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search)
      );
    }

    return filtered;
  }

  async getTemplate(id: string): Promise<PDFTemplate> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const template = this.mockTemplates.find(t => t.id === id);
    if (!template) {
      throw new Error('Template not found');
    }

    return template;
  }

  async createTemplate(data: Omit<PDFTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<PDFTemplate> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newTemplate: PDFTemplate = {
      ...data,
      id: `template_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.mockTemplates.push(newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: string, data: Partial<PDFTemplate>): Promise<PDFTemplate> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const index = this.mockTemplates.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Template not found');
    }

    const updatedTemplate: PDFTemplate = {
      ...this.mockTemplates[index],
      ...data,
      updated_at: new Date().toISOString()
    };

    this.mockTemplates[index] = updatedTemplate;
    return updatedTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = this.mockTemplates.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Template not found');
    }

    // Cannot delete default templates
    if (this.mockTemplates[index].is_default) {
      throw new Error('Cannot delete default template');
    }

    this.mockTemplates.splice(index, 1);
  }

  async previewTemplate(id: string, variables: Record<string, string>): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const template = await this.getTemplate(id);
    let content = template.content;

    // Replace variables with provided values
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    });

    return content;
  }

  async duplicateTemplate(id: string): Promise<PDFTemplate> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const template = await this.getTemplate(id);
    
    const duplicatedTemplate: PDFTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (Copy)`,
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.mockTemplates.push(duplicatedTemplate);
    return duplicatedTemplate;
  }

  async setDefaultTemplate(id: string, category: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Remove default flag from all templates in the same category
    this.mockTemplates.forEach(t => {
      if (t.category === category) {
        t.is_default = false;
      }
    });

    // Set the selected template as default
    const template = this.mockTemplates.find(t => t.id === id);
    if (template) {
      template.is_default = true;
    }
  }

  async exportTemplate(id: string): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const template = await this.getTemplate(id);
    const json = JSON.stringify(template, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  async importTemplate(file: File): Promise<PDFTemplate> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const text = await file.text();
    const templateData = JSON.parse(text);
    
    return this.createTemplate({
      ...templateData,
      name: `${templateData.name} (Imported)`,
      is_default: false
    });
  }
}

export const pdfTemplateService = new PDFTemplateService();
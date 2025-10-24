import { Customer, CustomerTag } from '@/types/crm';
import { supabaseClient } from './client';
import { multiTenantService } from './multiTenantService';
import { 
  addTenantFilter, 
  handleSupabaseError,
  retryQuery 
} from './queryBuilders';

class SupabaseCustomerService {
  /**
   * Get all customers with filtering
   */
  async getCustomers(filters?: {
    status?: string;
    industry?: string;
    size?: string;
    assigned_to?: string;
    search?: string;
    tags?: string[];
  }): Promise<Customer[]> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();
      const userId = multiTenantService.getCurrentUserId();

      console.log('[SupabaseCustomerService] getCustomers called with tenantId:', tenantId, 'filters:', filters);

      let query = supabaseClient
        .from('customers')
        .select(`
          *,
          customer_tag_mapping (
            tag_id,
            customer_tags (
              id,
              name,
              color
            )
          )
        `);

      // Apply tenant filter
      query = addTenantFilter(query, tenantId);

      // Apply status filter
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      // Apply industry filter
      if (filters?.industry) {
        query = query.eq('industry', filters.industry);
      }

      // Apply size filter
      if (filters?.size) {
        query = query.eq('size', filters.size);
      }

      // Apply assigned_to filter (role-based for agents)
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      // Apply search filter
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        query = query.or(
          `company_name.ilike.%${searchLower}%,contact_name.ilike.%${searchLower}%,email.ilike.%${searchLower}%,city.ilike.%${searchLower}%,country.ilike.%${searchLower}%`
        );
      }

      console.log('[SupabaseCustomerService] Executing Supabase query...');
      const { data, error } = await retryQuery(async () => query);

      console.log('[SupabaseCustomerService] Query result - data rows:', data?.length || 0, 'error:', error);

      if (error) throw handleSupabaseError(error);

      // Map database rows to Customer interface
      const mappedCustomers = (data || []).map(row => this.mapToCustomer(row));

      console.log('[SupabaseCustomerService] Mapped customers count:', mappedCustomers.length);

      // Filter by tags if provided
      if (filters?.tags && filters.tags.length > 0) {
        const filtered = mappedCustomers.filter(customer =>
          filters.tags!.some(tagId => 
            customer.tags.some(tag => tag.id === tagId)
          )
        );
        console.log('[SupabaseCustomerService] After tag filter count:', filtered.length);
        return filtered;
      }

      console.log('[SupabaseCustomerService] Returning customers:', mappedCustomers.length);
      return mappedCustomers;
    } catch (error) {
      console.error('[SupabaseCustomerService] Error fetching customers:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch customers');
    }
  }

  /**
   * Get single customer by ID
   */
  async getCustomer(id: string): Promise<Customer> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      const { data, error } = await retryQuery(async () =>
        supabaseClient
          .from('customers')
          .select(`
            *,
            customer_tag_mapping (
              tag_id,
              customer_tags (
                id,
                name,
                color
              )
            )
          `)
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .single()
      );

      if (error) throw handleSupabaseError(error);
      if (!data) throw new Error('Customer not found');

      return this.mapToCustomer(data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch customer');
    }
  }

  /**
   * Create new customer
   */
  async createCustomer(
    customerData: Omit<Customer, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>
  ): Promise<Customer> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();
      const userId = multiTenantService.getCurrentUserId();

      const insertData = {
        company_name: customerData.company_name,
        contact_name: customerData.contact_name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        city: customerData.city,
        country: customerData.country,
        industry: customerData.industry,
        size: customerData.size,
        status: customerData.status,
        notes: customerData.notes,
        assigned_to: customerData.assigned_to || userId,
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await retryQuery(async () =>
        supabaseClient
          .from('customers')
          .insert([insertData])
          .select(`
            *,
            customer_tag_mapping (
              tag_id,
              customer_tags (
                id,
                name,
                color
              )
            )
          `)
          .single()
      );

      if (error) throw handleSupabaseError(error);
      if (!data) throw new Error('Failed to create customer');

      return this.mapToCustomer(data);
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error instanceof Error ? error : new Error('Failed to create customer');
    }
  }

  /**
   * Update existing customer
   */
  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      // Validate ownership
      const { data: existing, error: fetchError } = await supabaseClient
        .from('customers')
        .select('id')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (fetchError || !existing) throw new Error('Customer not found');

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Remove fields that shouldn't be updated
      delete (updateData as any).id;
      delete (updateData as any).tenant_id;
      delete (updateData as any).created_at;

      const { data, error } = await retryQuery(async () =>
        supabaseClient
          .from('customers')
          .update(updateData)
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select(`
            *,
            customer_tag_mapping (
              tag_id,
              customer_tags (
                id,
                name,
                color
              )
            )
          `)
          .single()
      );

      if (error) throw handleSupabaseError(error);
      if (!data) throw new Error('Failed to update customer');

      return this.mapToCustomer(data);
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error instanceof Error ? error : new Error('Failed to update customer');
    }
  }

  /**
   * Delete customer
   */
  async deleteCustomer(id: string): Promise<void> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      const { error } = await retryQuery(async () =>
        supabaseClient
          .from('customers')
          .delete()
          .eq('id', id)
          .eq('tenant_id', tenantId)
      );

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error instanceof Error ? error : new Error('Failed to delete customer');
    }
  }

  /**
   * Bulk delete customers
   */
  async bulkDeleteCustomers(ids: string[]): Promise<void> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      const { error } = await retryQuery(async () =>
        supabaseClient
          .from('customers')
          .delete()
          .eq('tenant_id', tenantId)
          .in('id', ids)
      );

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error bulk deleting customers:', error);
      throw error instanceof Error ? error : new Error('Failed to delete customers');
    }
  }

  /**
   * Bulk update customers
   */
  async bulkUpdateCustomers(ids: string[], updates: Partial<Customer>): Promise<void> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Remove fields that shouldn't be updated
      delete (updateData as any).id;
      delete (updateData as any).tenant_id;
      delete (updateData as any).created_at;

      const { error } = await retryQuery(async () =>
        supabaseClient
          .from('customers')
          .update(updateData)
          .eq('tenant_id', tenantId)
          .in('id', ids)
      );

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error bulk updating customers:', error);
      throw error instanceof Error ? error : new Error('Failed to update customers');
    }
  }

  /**
   * Get all customer tags
   */
  async getTags(): Promise<CustomerTag[]> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      const { data, error } = await retryQuery(async () =>
        supabaseClient
          .from('customer_tags')
          .select('*')
          .eq('tenant_id', tenantId)
      );

      if (error) throw handleSupabaseError(error);

      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        color: row.color
      }));
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch tags');
    }
  }

  /**
   * Create new customer tag
   */
  async createTag(name: string, color: string): Promise<CustomerTag> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      const { data, error } = await retryQuery(async () =>
        supabaseClient
          .from('customer_tags')
          .insert([
            {
              name,
              color,
              tenant_id: tenantId,
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .single()
      );

      if (error) throw handleSupabaseError(error);
      if (!data) throw new Error('Failed to create tag');

      return {
        id: data.id,
        name: data.name,
        color: data.color
      };
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error instanceof Error ? error : new Error('Failed to create tag');
    }
  }

  /**
   * Add a tag to a customer
   */
  async addTagToCustomer(customerId: string, tagId: string): Promise<void> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      // Verify customer exists and belongs to tenant
      const { data: customer, error: customerError } = await supabaseClient
        .from('customers')
        .select('id')
        .eq('id', customerId)
        .eq('tenant_id', tenantId)
        .single();

      if (customerError || !customer) throw new Error('Customer not found');

      // Insert tag mapping
      const { error } = await supabaseClient
        .from('customer_tag_mapping')
        .insert([{ customer_id: customerId, tag_id: tagId }]);

      // Ignore duplicate key errors (tag already linked)
      if (error && !error.message.includes('duplicate')) {
        throw handleSupabaseError(error);
      }
    } catch (error) {
      console.error('Error adding tag to customer:', error);
      throw error instanceof Error ? error : new Error('Failed to add tag');
    }
  }

  /**
   * Remove a tag from a customer
   */
  async removeTagFromCustomer(customerId: string, tagId: string): Promise<void> {
    try {
      const { error } = await supabaseClient
        .from('customer_tag_mapping')
        .delete()
        .eq('customer_id', customerId)
        .eq('tag_id', tagId);

      if (error) throw handleSupabaseError(error);
    } catch (error) {
      console.error('Error removing tag from customer:', error);
      throw error instanceof Error ? error : new Error('Failed to remove tag');
    }
  }

  /**
   * Set tags for a customer (replaces all existing tags)
   */
  async setCustomerTags(customerId: string, tagIds: string[]): Promise<void> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      // Verify customer exists and belongs to tenant
      const { data: customer, error: customerError } = await supabaseClient
        .from('customers')
        .select('id')
        .eq('id', customerId)
        .eq('tenant_id', tenantId)
        .single();

      if (customerError || !customer) throw new Error('Customer not found');

      // Delete existing tag mappings
      const { error: deleteError } = await supabaseClient
        .from('customer_tag_mapping')
        .delete()
        .eq('customer_id', customerId);

      if (deleteError) throw handleSupabaseError(deleteError);

      // Insert new tag mappings
      if (tagIds.length > 0) {
        const mappings = tagIds.map(tagId => ({
          customer_id: customerId,
          tag_id: tagId
        }));

        const { error: insertError } = await supabaseClient
          .from('customer_tag_mapping')
          .insert(mappings);

        if (insertError) throw handleSupabaseError(insertError);
      }
    } catch (error) {
      console.error('Error setting customer tags:', error);
      throw error instanceof Error ? error : new Error('Failed to set tags');
    }
  }

  /**
   * Export customers as CSV or JSON
   */
  async exportCustomers(format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      const customers = await this.getCustomers();

      if (format === 'csv') {
        const headers = [
          'Company Name', 'Contact Name', 'Email', 'Phone', 'Address',
          'City', 'Country', 'Industry', 'Size', 'Status', 'Tags', 'Notes', 'Created At'
        ];

        const csvData = customers.map(c => [
          c.company_name,
          c.contact_name,
          c.email,
          c.phone,
          c.address,
          c.city,
          c.country,
          c.industry,
          c.size,
          c.status,
          c.tags.map(t => t.name).join('; '),
          c.notes || '',
          new Date(c.created_at).toLocaleDateString()
        ]);

        return [headers, ...csvData].map(row =>
          row.map(field => `"${field}"`).join(',')
        ).join('\r\n');
      } else {
        return JSON.stringify(customers, null, 2);
      }
    } catch (error) {
      console.error('Error exporting customers:', error);
      throw error instanceof Error ? error : new Error('Failed to export customers');
    }
  }

  /**
   * Import customers from CSV
   */
  async importCustomers(csvData: string): Promise<{ success: number; errors: string[] }> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();
      const userId = multiTenantService.getCurrentUserId();

      const lines = csvData.split('\r\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const dataLines = lines.slice(1);

      let success = 0;
      const errors: string[] = [];

      for (let i = 0; i < dataLines.length; i++) {
        try {
          const values = dataLines[i].split(',').map(v => v.replace(/"/g, '').trim());

          if (values.length !== headers.length) {
            errors.push(`Row ${i + 2}: Invalid number of columns`);
            continue;
          }

          // Extract values
          const email = values[headers.indexOf('Email')] || values[2];
          if (!email || !email.includes('@')) {
            errors.push(`Row ${i + 2}: Invalid email address`);
            continue;
          }

          const customerData = {
            company_name: values[headers.indexOf('Company Name')] || values[0],
            contact_name: values[headers.indexOf('Contact Name')] || values[1],
            email,
            phone: values[headers.indexOf('Phone')] || values[3],
            address: values[headers.indexOf('Address')] || values[4],
            city: values[headers.indexOf('City')] || values[5],
            country: values[headers.indexOf('Country')] || values[6],
            industry: values[headers.indexOf('Industry')] || values[7],
            size: values[headers.indexOf('Size')] || 'small',
            status: 'active',
            tenant_id: tenantId,
            assigned_to: userId,
            notes: values[headers.indexOf('Notes')] || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error } = await supabase
            .from('customers')
            .insert([customerData]);

          if (error) throw error;
          success++;
        } catch (error) {
          errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { success, errors };
    } catch (error) {
      console.error('Error importing customers:', error);
      throw error instanceof Error ? error : new Error('Failed to import customers');
    }
  }

  /**
   * Get list of industries
   */
  async getIndustries(): Promise<string[]> {
    return [
      'Technology',
      'Manufacturing',
      'Software',
      'Retail',
      'Healthcare',
      'Finance',
      'Education',
      'Other'
    ];
  }

  /**
   * Get list of company sizes
   */
  async getSizes(): Promise<string[]> {
    return ['startup', 'small', 'medium', 'enterprise'];
  }

  /**
   * Map database row to Customer interface
   */
  private mapToCustomer(row: any): Customer {
    // Extract tags from the junction table
    const tagMappings = row.customer_tag_mapping || [];
    const tags = tagMappings
      .map((mapping: any) => mapping.customer_tags)
      .filter((tag: any) => tag != null)
      .map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color
      }));

    return {
      id: row.id,
      company_name: row.company_name,
      contact_name: row.contact_name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      city: row.city,
      country: row.country,
      industry: row.industry,
      size: row.size,
      status: row.status,
      tags,
      notes: row.notes,
      tenant_id: row.tenant_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      assigned_to: row.assigned_to
    };
  }
}

export { SupabaseCustomerService };
export const supabaseCustomerService = new SupabaseCustomerService();
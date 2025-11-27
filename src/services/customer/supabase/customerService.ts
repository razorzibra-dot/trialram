import { Customer, CustomerTag } from '@/types/crm';
import { supabase, getSupabaseClient } from '@/services/supabase/client';

import { multiTenantService } from '../../multitenant/supabase/multiTenantService';

// Stub implementations for missing query builders
const addTenantFilter = (query: any, tenantId: string) => query.eq('tenant_id', tenantId);
const handleSupabaseError = (error: any) => error;
const retryQuery = async (fn: () => Promise<any>) => fn();

class SupabaseCustomerService {
  /**
   * Get all customers with filtering
   */
  async getCustomers(filters?: {
    status?: string;
    industry?: string;
    size?: string;
    assigned_to?: string;
    assignedTo?: string;
    search?: string;
    tags?: string[];
  }): Promise<Customer[]> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();
      const userId = multiTenantService.getCurrentUserId();

      console.log('[SupabaseCustomerService] getCustomers called with tenantId:', tenantId, 'filters:', filters);

      let query = getSupabaseClient()
        .from('customers')
        .select(`
          *,
          company:companies!customers_company_id_fkey (
            id,
            name,
            industry,
            size,
            website,
            city,
            country,
            plan
          ),
          customer_tag_mapping:customer_tag_mapping!customer_tag_mapping_customer_id_fkey (
            tag_id,
            customer_tags:customer_tags!customer_tag_mapping_tag_id_fkey (
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
      const assignedFilter = filters?.assigned_to || filters?.assignedTo;
      if (assignedFilter) {
        query = query.eq('assigned_to', assignedFilter);
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
        getSupabaseClient()
          .from('customers')
          .select(`
            *,
            company:companies!customers_company_id_fkey (
              id,
              name,
              industry,
              size,
              website,
              city,
              country,
              plan
            ),
            customer_tag_mapping:customer_tag_mapping!customer_tag_mapping_customer_id_fkey (
              tag_id,
              customer_tags:customer_tags!customer_tag_mapping_tag_id_fkey (
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
   * Validate customer data according to business rules
   */
  private validateCustomerData(customerData: Omit<Customer, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>, tenantId: string): void {
    const errors: string[] = [];

    // Required field validations
    if (!customerData.company_name?.trim()) {
      errors.push('Company name is required');
    } else if (customerData.company_name.length > 255) {
      errors.push('Company name must be less than 255 characters');
    }

    if (!customerData.contact_name?.trim()) {
      errors.push('Contact name is required');
    } else if (customerData.contact_name.length > 255) {
      errors.push('Contact name must be less than 255 characters');
    }

    // Email validation
    if (!customerData.email?.trim()) {
      errors.push('Email is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerData.email)) {
        errors.push('Invalid email format');
      } else if (customerData.email.length > 255) {
        errors.push('Email must be less than 255 characters');
      }
    }

    // Phone validation
    if (customerData.phone && customerData.phone.length > 50) {
      errors.push('Phone number must be less than 50 characters');
    }

    if (customerData.mobile && customerData.mobile.length > 50) {
      errors.push('Mobile number must be less than 50 characters');
    }

    // Website URL validation
    if (customerData.website) {
      try {
        new URL(customerData.website);
        if (customerData.website.length > 500) {
          errors.push('Website URL must be less than 500 characters');
        }
      } catch {
        errors.push('Invalid website URL format');
      }
    }

    // Address validation
    if (customerData.address && customerData.address.length > 500) {
      errors.push('Address must be less than 500 characters');
    }

    if (customerData.city && customerData.city.length > 100) {
      errors.push('City must be less than 100 characters');
    }

    if (customerData.country && customerData.country.length > 100) {
      errors.push('Country must be less than 100 characters');
    }

    // Industry validation
    if (customerData.industry && customerData.industry.length > 100) {
      errors.push('Industry must be less than 100 characters');
    }

    // Size enum validation
    if (customerData.size && !['startup', 'small', 'medium', 'enterprise'].includes(customerData.size)) {
      errors.push('Size must be one of: startup, small, medium, enterprise');
    }

    // Status enum validation
    if (customerData.status && !['active', 'inactive', 'prospect'].includes(customerData.status)) {
      errors.push('Status must be one of: active, inactive, prospect');
    }

    // Customer type enum validation
    if (customerData.customer_type && !['business', 'individual'].includes(customerData.customer_type)) {
      errors.push('Customer type must be one of: business, individual');
    }

    // Credit limit validation
    if (customerData.credit_limit !== undefined) {
      if (typeof customerData.credit_limit !== 'number' || customerData.credit_limit < 0) {
        errors.push('Credit limit must be a positive number');
      } else if (customerData.credit_limit > 999999999.99) {
        errors.push('Credit limit cannot exceed 999,999,999.99');
      }
    }

    // Payment terms validation
    if (customerData.payment_terms && customerData.payment_terms.length > 100) {
      errors.push('Payment terms must be less than 100 characters');
    }

    // Tax ID validation
    if (customerData.tax_id && customerData.tax_id.length > 50) {
      errors.push('Tax ID must be less than 50 characters');
    }

    // Notes validation
    if (customerData.notes && customerData.notes.length > 2000) {
      errors.push('Notes must be less than 2000 characters');
    }

    // Source validation
    if (customerData.source && customerData.source.length > 100) {
      errors.push('Source must be less than 100 characters');
    }

    // Rating validation
    if (customerData.rating && customerData.rating.length > 50) {
      errors.push('Rating must be less than 50 characters');
    }

    // Tags validation
    if (customerData.tags && customerData.tags.length > 10) {
      errors.push('Cannot assign more than 10 tags to a customer');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  private extractNameParts(contactName?: string): { firstName: string; lastName: string } {
    const fallback = 'Customer';
    const trimmed = (contactName || '').trim();
    if (!trimmed) {
      return { firstName: fallback, lastName: fallback };
    }
    const parts = trimmed.split(/\s+/);
    const firstName = parts.shift() || fallback;
    const lastName = parts.length > 0 ? parts.join(' ') : firstName;
    return { firstName, lastName };
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

      // Validate customer data
      this.validateCustomerData(customerData, tenantId);

      // Check email uniqueness within tenant
      const { data: existingCustomer, error: checkError } = await getSupabaseClient()
        .from('customers')
        .select('id')
        .eq('email', customerData.email)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (existingCustomer && !checkError) {
        throw new Error('Email address already exists for this tenant');
      }

      const now = new Date().toISOString();

      const { firstName, lastName } = this.extractNameParts(customerData.contact_name);

      const insertData = {
        company_name: customerData.company_name,
        contact_name: customerData.contact_name,
        first_name: firstName,
        last_name: lastName,
        email: customerData.email,
        phone: customerData.phone,
        mobile: customerData.mobile,
        address: customerData.address,
        city: customerData.city,
        country: customerData.country,
        website: customerData.website,
        industry: customerData.industry,
        size: customerData.size,
        status: customerData.status,
        customer_type: customerData.customer_type,
        credit_limit: customerData.credit_limit,
        payment_terms: customerData.payment_terms,
        tax_id: customerData.tax_id,
        source: customerData.source,
        rating: customerData.rating,
        notes: customerData.notes,
        assigned_to: customerData.assigned_to || userId,
        created_by: userId,
        tenant_id: tenantId,
        created_at: now,
        updated_at: now
      };

      const { data, error } = await retryQuery(async () =>
        getSupabaseClient()
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
      const { data: existing, error: fetchError } = await getSupabaseClient()
        .from('customers')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (fetchError || !existing) throw new Error('Customer not found');

      // Validate updates if they contain customer data fields
      const existingCustomer = this.mapToCustomer(existing);
      const updatedData = { ...existingCustomer, ...updates };

      // Only validate if email or other key fields are being updated
      if (updates.email || updates.company_name || updates.contact_name ||
          updates.phone || updates.website || updates.size || updates.status ||
          updates.customer_type || updates.credit_limit) {
        this.validateCustomerData(updatedData, tenantId);

        // Check email uniqueness if email is being updated
        if (updates.email && updates.email !== existingCustomer.email) {
          const { data: emailCheck, error: emailError } = await getSupabaseClient()
            .from('customers')
            .select('id')
            .eq('email', updates.email)
            .eq('tenant_id', tenantId)
            .neq('id', id)
            .maybeSingle();

          if (emailCheck && !emailError) {
            throw new Error('Email address already exists for this tenant');
          }
        }
      }

      const { firstName, lastName } = this.extractNameParts(updatedData.contact_name);

      const updateData: Record<string, any> = {
        ...updates,
        contact_name: updatedData.contact_name,
        first_name: firstName,
        last_name: lastName,
        updated_at: new Date().toISOString()
      };

      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.tenant_id;
      delete updateData.created_at;

      const { data, error } = await retryQuery(async () =>
        getSupabaseClient()
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
        getSupabaseClient()
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
        getSupabaseClient()
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
      delete updateData.id;
      delete updateData.tenant_id;
      delete updateData.created_at;

      const { error } = await retryQuery(async () =>
        getSupabaseClient()
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
        getSupabaseClient()
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
        getSupabaseClient()
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
      const { data: customer, error: customerError } = await getSupabaseClient()
        .from('customers')
        .select('id')
        .eq('id', customerId)
        .eq('tenant_id', tenantId)
        .single();

      if (customerError || !customer) throw new Error('Customer not found');

      // Insert tag mapping
      const { error } = await getSupabaseClient()
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
      const { error } = await getSupabaseClient()
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
      const { data: customer, error: customerError } = await getSupabaseClient()
        .from('customers')
        .select('id')
        .eq('id', customerId)
        .eq('tenant_id', tenantId)
        .single();

      if (customerError || !customer) throw new Error('Customer not found');

      // Delete existing tag mappings
      const { error: deleteError } = await getSupabaseClient()
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

        const { error: insertError } = await getSupabaseClient()
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

          const { error } = await getSupabaseClient()
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
   * Get customer statistics
   */
  async getCustomerStats(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    prospectCustomers: number;
    inactiveCustomers: number;
    byIndustry: Record<string, number>;
    bySize: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    try {
      const tenantId = multiTenantService.getCurrentTenantId();

      // Fetch all customers for the tenant
      const { data: customerRows, error: customerError } = await retryQuery(async () =>
        getSupabaseClient()
          .from('customers')
          .select('id, status, industry, size')
          .eq('tenant_id', tenantId)
      );

      if (customerError) throw handleSupabaseError(customerError);

      const customers = customerRows || [];

      // Calculate statistics
      const byStatus: Record<string, number> = {};
      const byIndustry: Record<string, number> = {};
      const bySize: Record<string, number> = {};

      customers.forEach(customer => {
        const statusKey = customer.status || 'unknown';
        const industryKey = customer.industry || 'unknown';
        const sizeKey = (customer.size as string | undefined) || 'unknown';

        byStatus[statusKey] = (byStatus[statusKey] || 0) + 1;
        byIndustry[industryKey] = (byIndustry[industryKey] || 0) + 1;
        bySize[sizeKey] = (bySize[sizeKey] || 0) + 1;
      });

      return {
        totalCustomers: customers.length,
        activeCustomers: customers.filter(c => c.status === 'active').length,
        prospectCustomers: customers.filter(c => c.status === 'prospect').length,
        inactiveCustomers: customers.filter(c => c.status === 'inactive').length,
        byIndustry,
        bySize,
        byStatus
      };
    } catch (error) {
      console.error('[SupabaseCustomerService] Error fetching customer stats:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch customer statistics');
    }
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

    const company = row.company || row.companies || null;
    const contactName =
      row.contact_name ||
      [row.first_name, row.last_name].filter(Boolean).join(' ').trim() ||
      row.email ||
      'Unknown contact';

    const companyName =
      row.company_name ||
      company?.name ||
      contactName;

    const industry = row.industry || company?.industry || 'General';
    const size = row.size || company?.size || 'small';

    return {
      id: row.id,
      company_name: companyName,
      contact_name: contactName,
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      website: row.website || company?.website,
      address: row.address,
      city: row.city || company?.city,
      country: row.country || company?.country,
      industry,
      size,
      status: (row.status || 'active') as Customer['status'],
      customer_type: (row.customer_type || 'business') as Customer['customer_type'],
      credit_limit: row.credit_limit,
      payment_terms: row.payment_terms,
      tax_id: row.tax_id,
      annual_revenue: row.annual_revenue,
      total_sales_amount: row.total_sales_amount,
      total_orders: row.total_orders,
      average_order_value: row.average_order_value,
      last_purchase_date: row.last_purchase_date,
      tags,
      notes: row.notes,
      assigned_to: row.assigned_to,
      source: row.source,
      rating: row.rating,
      last_contact_date: row.last_contact_date,
      next_follow_up_date: row.next_follow_up_date,
      tenant_id: row.tenant_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
      deleted_at: row.deleted_at
    };
  }
}

export { SupabaseCustomerService };
export const supabaseCustomerService = new SupabaseCustomerService();
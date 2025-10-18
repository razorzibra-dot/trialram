/**
 * Supabase Customer Service
 * Handles customer management, CRUD operations, search, real-time subscriptions
 * Extends BaseSupabaseService for common database operations
 */

import { BaseSupabaseService, QueryOptions, SubscriptionOptions } from './baseService';
import { getSupabaseClient } from './client';
import { Customer, CustomerTag } from '@/types/crm';

export interface CustomerFilters {
  status?: string;
  industry?: string;
  size?: string;
  tenantId?: string;
  search?: string;
}

export class SupabaseCustomerService extends BaseSupabaseService {
  constructor() {
    super('customers', true);
  }

  /**
   * Get all customers with optional filtering
   */
  async getCustomers(filters?: CustomerFilters): Promise<Customer[]> {
    try {
      this.log('Fetching customers', filters);

      let query = getSupabaseClient().from('customers').select('*');

      // Apply filters
      if (filters?.tenantId) {
        query = query.eq('tenant_id', filters.tenantId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.industry) {
        query = query.eq('industry', filters.industry);
      }
      if (filters?.size) {
        query = query.eq('size', filters.size);
      }

      // Exclude deleted records
      query = query.is('deleted_at', null);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      this.log('Customers fetched', { count: data?.length });
      return data?.map((c) => this.mapCustomerResponse(c)) || [];
    } catch (error) {
      this.logError('Error fetching customers', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(id: string): Promise<Customer | null> {
    try {
      this.log('Fetching customer', { id });

      const { data, error } = await getSupabaseClient()
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data ? this.mapCustomerResponse(data) : null;
    } catch (error) {
      this.logError('Error fetching customer', error);
      throw error;
    }
  }

  /**
   * Create new customer
   */
  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    try {
      this.log('Creating customer', { company_name: data.company_name });

      const { data: created, error } = await getSupabaseClient()
        .from('customers')
        .insert([
          {
            company_name: data.company_name,
            contact_name: data.contact_name,
            email: data.email,
            phone: data.phone,
            mobile: data.mobile,
            website: data.website,
            address: data.address,
            city: data.city,
            country: data.country,
            industry: data.industry,
            size: data.size || 'small',
            status: data.status || 'active',
            customer_type: data.customer_type || 'business',
            credit_limit: data.credit_limit || 0,
            payment_terms: data.payment_terms,
            tax_id: data.tax_id,
            annual_revenue: data.annual_revenue || 0,
            notes: data.notes,
            assigned_to: data.assigned_to,
            source: data.source,
            rating: data.rating,
            tenant_id: data.tenant_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      this.log('Customer created successfully', { id: created.id });
      return this.mapCustomerResponse(created);
    } catch (error) {
      this.logError('Error creating customer', error);
      throw error;
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    try {
      this.log('Updating customer', { id });

      const { data, error } = await getSupabaseClient()
        .from('customers')
        .update({
          company_name: updates.company_name,
          contact_name: updates.contact_name,
          email: updates.email,
          phone: updates.phone,
          mobile: updates.mobile,
          website: updates.website,
          address: updates.address,
          city: updates.city,
          country: updates.country,
          industry: updates.industry,
          size: updates.size,
          status: updates.status,
          credit_limit: updates.credit_limit,
          payment_terms: updates.payment_terms,
          tax_id: updates.tax_id,
          annual_revenue: updates.annual_revenue,
          notes: updates.notes,
          assigned_to: updates.assigned_to,
          source: updates.source,
          rating: updates.rating,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      this.log('Customer updated successfully', { id });
      return this.mapCustomerResponse(data);
    } catch (error) {
      this.logError('Error updating customer', error);
      throw error;
    }
  }

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(id: string): Promise<void> {
    try {
      this.log('Deleting customer', { id });

      const { error } = await getSupabaseClient()
        .from('customers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      this.log('Customer deleted successfully', { id });
    } catch (error) {
      this.logError('Error deleting customer', error);
      throw error;
    }
  }

  /**
   * Search customers by name or email
   */
  async searchCustomers(
    searchTerm: string,
    tenantId?: string
  ): Promise<Customer[]> {
    try {
      this.log('Searching customers', { searchTerm });

      let query = getSupabaseClient()
        .from('customers')
        .select('*')
        .or(
          `company_name.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      query = query.is('deleted_at', null);

      const { data, error } = await query.order('company_name');

      if (error) throw error;

      this.log('Search completed', { count: data?.length });
      return data?.map((c) => this.mapCustomerResponse(c)) || [];
    } catch (error) {
      this.logError('Error searching customers', error);
      throw error;
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(tenantId: string): Promise<{
    total: number;
    active: number;
    byIndustry: Record<string, number>;
    bySize: Record<string, number>;
  }> {
    try {
      this.log('Fetching customer statistics', { tenantId });

      const customers = await this.getCustomers({ tenantId });

      const stats = {
        total: customers.length,
        active: customers.filter((c) => c.status === 'active').length,
        byIndustry: {} as Record<string, number>,
        bySize: {} as Record<string, number>,
      };

      customers.forEach((c) => {
        if (c.industry) {
          stats.byIndustry[c.industry] =
            (stats.byIndustry[c.industry] || 0) + 1;
        }
        if (c.size) {
          stats.bySize[c.size] = (stats.bySize[c.size] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      this.logError('Error fetching customer statistics', error);
      throw error;
    }
  }

  /**
   * Subscribe to customer changes
   */
  subscribeToCustomers(
    tenantId: string,
    callback: (payload: any) => void
  ): () => void {
    return this.subscribeToChanges(
      {
        event: '*',
        table: 'customers',
        filter: `tenant_id=eq.${tenantId}`,
      },
      callback
    );
  }

  /**
   * Map database customer response to UI Customer type
   */
  private mapCustomerResponse(dbCustomer: any): Customer {
    return {
      id: dbCustomer.id,
      company_name: dbCustomer.company_name,
      contact_name: dbCustomer.contact_name,
      email: dbCustomer.email,
      phone: dbCustomer.phone || '',
      mobile: dbCustomer.mobile || '',
      website: dbCustomer.website || '',
      address: dbCustomer.address || '',
      city: dbCustomer.city || '',
      country: dbCustomer.country || '',
      industry: dbCustomer.industry || '',
      size: dbCustomer.size || 'small',
      status: dbCustomer.status || 'active',
      customer_type: dbCustomer.customer_type || 'business',
      credit_limit: dbCustomer.credit_limit || 0,
      payment_terms: dbCustomer.payment_terms || '',
      tax_id: dbCustomer.tax_id || '',
      annual_revenue: dbCustomer.annual_revenue || 0,
      total_sales_amount: dbCustomer.total_sales_amount || 0,
      total_orders: dbCustomer.total_orders || 0,
      average_order_value: dbCustomer.average_order_value || 0,
      last_purchase_date: dbCustomer.last_purchase_date || '',
      tags: dbCustomer.tags || [],
      notes: dbCustomer.notes || '',
      assigned_to: dbCustomer.assigned_to,
      source: dbCustomer.source || '',
      rating: dbCustomer.rating || '',
      last_contact_date: dbCustomer.last_contact_date || '',
      next_follow_up_date: dbCustomer.next_follow_up_date || '',
      tenant_id: dbCustomer.tenant_id,
      created_at: dbCustomer.created_at,
      updated_at: dbCustomer.updated_at,
      created_by: dbCustomer.created_by || '',
    };
  }
}

// Export singleton instance
export const supabaseCustomerService = new SupabaseCustomerService();
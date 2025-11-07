/**
 * Supabase Company Service
 * Handles company/organization management across the platform
 * Extends BaseSupabaseService for common database operations
 */

import { BaseSupabaseService } from './baseService';
import { getSupabaseClient } from './client';

export interface Company {
  id: string;
  name: string;
  domain?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  size?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  registration_number?: string;
  status: 'active' | 'inactive' | 'suspended';
  plan?: 'free' | 'pro' | 'enterprise';
  subscription_status?: 'active' | 'inactive' | 'trial';
  trial_ends_at?: string;
  metadata?: Record<string, any>;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyFilters {
  status?: string;
  plan?: string;
  industry?: string;
  search?: string;
}

export class SupabaseCompanyService extends BaseSupabaseService {
  constructor() {
    super('companies', true);
  }

  /**
   * Get all companies
   */
  async getCompanies(filters?: CompanyFilters): Promise<Company[]> {
    try {
      this.log('Fetching companies', filters);

      let query = getSupabaseClient().from('companies').select('*');

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.plan) {
        query = query.eq('plan', filters.plan);
      }
      if (filters?.industry) {
        query = query.eq('industry', filters.industry);
      }

      // Exclude deleted records
      query = query.is('deleted_at', null);

      const { data, error } = await query.order('name');

      if (error) throw error;

      this.log('Companies fetched', { count: data?.length });
      return data?.map((c) => this.mapCompanyResponse(c)) || [];
    } catch (error) {
      this.logError('Error fetching companies', error);
      throw error;
    }
  }

  /**
   * Get company by ID
   */
  async getCompany(id: string): Promise<Company | null> {
    try {
      this.log('Fetching company', { id });

      const { data, error } = await getSupabaseClient()
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data ? this.mapCompanyResponse(data) : null;
    } catch (error) {
      this.logError('Error fetching company', error);
      throw error;
    }
  }

  /**
   * Get company by domain
   */
  async getCompanyByDomain(domain: string): Promise<Company | null> {
    try {
      this.log('Fetching company by domain', { domain });

      const { data, error } = await getSupabaseClient()
        .from('companies')
        .select('*')
        .eq('domain', domain)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data ? this.mapCompanyResponse(data) : null;
    } catch (error) {
      this.logError('Error fetching company by domain', error);
      throw error;
    }
  }

  /**
   * Create new company
   */
  async createCompany(data: Partial<Company>): Promise<Company> {
    try {
      this.log('Creating company', { name: data.name });

      const { data: created, error } = await getSupabaseClient()
        .from('companies')
        .insert([
          {
            name: data.name,
            domain: data.domain,
            description: data.description,
            logo_url: data.logo_url,
            website: data.website,
            industry: data.industry,
            size: data.size,
            address: data.address,
            city: data.city,
            country: data.country,
            phone: data.phone,
            email: data.email,
            tax_id: data.tax_id,
            registration_number: data.registration_number,
            founded_year: (data as any).founded_year,
            notes: (data as any).notes,
            status: data.status || 'active',
            plan: data.plan || 'pro',
            subscription_status: data.subscription_status || 'active',
            trial_ends_at: data.trial_ends_at,
            metadata: data.metadata,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      this.log('Company created successfully', { id: created.id });
      return this.mapCompanyResponse(created);
    } catch (error) {
      this.logError('Error creating company', error);
      throw error;
    }
  }

  /**
   * Update company
   */
  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    try {
      this.log('Updating company', { id });

      const { data, error } = await getSupabaseClient()
        .from('companies')
        .update({
          name: updates.name,
          domain: updates.domain,
          description: updates.description,
          logo_url: updates.logo_url,
          website: updates.website,
          industry: updates.industry,
          size: updates.size,
          address: updates.address,
          city: updates.city,
          country: updates.country,
          phone: updates.phone,
          email: updates.email,
          tax_id: updates.tax_id,
          registration_number: updates.registration_number,
          founded_year: (updates as any).founded_year,
          notes: (updates as any).notes,
          status: updates.status,
          plan: updates.plan,
          subscription_status: updates.subscription_status,
          trial_ends_at: updates.trial_ends_at,
          metadata: updates.metadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      this.log('Company updated successfully', { id });
      return this.mapCompanyResponse(data);
    } catch (error) {
      this.logError('Error updating company', error);
      throw error;
    }
  }

  /**
   * Delete company (soft delete)
   */
  async deleteCompany(id: string): Promise<void> {
    try {
      this.log('Deleting company', { id });

      const { error } = await getSupabaseClient()
        .from('companies')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      this.log('Company deleted successfully', { id });
    } catch (error) {
      this.logError('Error deleting company', error);
      throw error;
    }
  }

  /**
   * Search companies
   */
  async searchCompanies(searchTerm: string): Promise<Company[]> {
    try {
      this.log('Searching companies', { searchTerm });

      let query = getSupabaseClient()
        .from('companies')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,domain.ilike.%${searchTerm}%`);

      query = query.is('deleted_at', null);

      const { data, error } = await query.order('name');

      if (error) throw error;

      this.log('Search completed', { count: data?.length });
      return data?.map((c) => this.mapCompanyResponse(c)) || [];
    } catch (error) {
      this.logError('Error searching companies', error);
      throw error;
    }
  }

  /**
   * Update company subscription
   */
  async updateSubscription(
    id: string,
    plan: 'free' | 'pro' | 'enterprise',
    status: 'active' | 'inactive' | 'trial'
  ): Promise<Company> {
    try {
      this.log('Updating company subscription', { id, plan, status });

      return this.updateCompany(id, {
        plan,
        subscription_status: status,
        updated_at: new Date().toISOString(),
      } as any);
    } catch (error) {
      this.logError('Error updating subscription', error);
      throw error;
    }
  }

  /**
   * Get company statistics
   */
  async getCompanyStats(): Promise<{
    total: number;
    active: number;
    suspended: number;
    byPlan: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    try {
      this.log('Fetching company statistics');

      const companies = await this.getCompanies();

      const stats = {
        total: companies.length,
        active: companies.filter((c) => c.status === 'active').length,
        suspended: companies.filter((c) => c.status === 'suspended').length,
        byPlan: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
      };

      companies.forEach((c) => {
        if (c.plan) {
          stats.byPlan[c.plan] = (stats.byPlan[c.plan] || 0) + 1;
        }
        stats.byStatus[c.status] = (stats.byStatus[c.status] || 0) + 1;
      });

      return stats;
    } catch (error) {
      this.logError('Error fetching company statistics', error);
      throw error;
    }
  }

  /**
   * Subscribe to company changes
   */
  subscribeToCompanies(callback: (payload: any) => void): () => void {
    return this.subscribeToChanges(
      {
        event: '*',
        table: 'companies',
      },
      callback
    );
  }

  /**
   * Map database company response to Company type
   */
  private mapCompanyResponse(dbCompany: any): Company {
    return {
      id: dbCompany.id,
      name: dbCompany.name,
      domain: dbCompany.domain || '',
      description: dbCompany.description || '',
      logo_url: dbCompany.logo_url || '',
      website: dbCompany.website || '',
      industry: dbCompany.industry || '',
      size: dbCompany.size || '',
      address: dbCompany.address || '',
      city: dbCompany.city || '',
      country: dbCompany.country || '',
      phone: dbCompany.phone || '',
      email: dbCompany.email || '',
      tax_id: dbCompany.tax_id || '',
      registration_number: dbCompany.registration_number || '',
      status: (dbCompany.status || 'active') as Company['status'],
      plan: (dbCompany.plan || 'pro') as Company['plan'],
      subscription_status: (dbCompany.subscription_status || 'active') as Company['subscription_status'],
      trial_ends_at: dbCompany.trial_ends_at,
      metadata: dbCompany.metadata,
      tenant_id: dbCompany.tenant_id,
      created_at: dbCompany.created_at,
      updated_at: dbCompany.updated_at,
    };
  }
}

// Export singleton instance
export const supabaseCompanyService = new SupabaseCompanyService();
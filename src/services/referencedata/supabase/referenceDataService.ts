/**
 * LAYER 4: SUPABASE SERVICE - Reference Data Supabase Implementation
 * ============================================================================
 * Real implementations using Supabase client
 * Used when VITE_API_MODE=supabase
 * Part of 8-layer sync pattern
 */

import { supabase } from '@/services/supabase/client';
import {
  StatusOption,
  ReferenceData,
  ProductCategory,
  Supplier,
  AllReferenceData,
  CreateStatusOptionDTO,
  CreateReferenceDataDTO,
  CreateProductCategoryDTO,
  CreateSupplierDTO,
  UpdateStatusOptionDTO,
  UpdateReferenceDataDTO,
  UpdateProductCategoryDTO,
  UpdateSupplierDTO,
} from '@/types/referenceData.types';

// ============================================================================
// 1. COLUMN MAPPING - snake_case (DB) to camelCase (TypeScript)
// ============================================================================

const mapStatusOption = (row: any): StatusOption => ({
  id: row.id,
  tenantId: row.tenant_id,
  module: row.module,
  statusKey: row.status_key,
  displayLabel: row.display_label,
  description: row.description,
  colorCode: row.color_code,
  sortOrder: row.sort_order,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
});

const mapReferenceData = (row: any): ReferenceData => ({
  id: row.id,
  tenantId: row.tenant_id,
  category: row.category,
  key: row.key,
  label: row.label,
  description: row.description,
  metadata: row.metadata,
  sortOrder: row.sort_order,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
});

const mapProductCategory = (row: any): ProductCategory => ({
  id: row.id,
  tenantId: row.tenant_id,
  name: row.name,
  description: row.description,
  isActive: row.is_active,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
});

const mapSupplier = (row: any): Supplier => {
  const status = row.status ?? (row.is_active ? 'active' : 'inactive');

  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    website: row.website,
    contactPerson: row.contact_person,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    industry: row.industry,
    country: row.country,
    isActive: status === 'active' && !row.deleted_at,
    sortOrder: row.sort_order,
    notes: row.notes,
    taxId: row.tax_id,
    creditLimit: row.credit_limit,
    paymentTerms: row.payment_terms,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    deletedAt: row.deleted_at,
  };
};

// ============================================================================
// 2. SUPABASE SERVICE IMPLEMENTATION
// ============================================================================

class SupabaseReferenceDataService {
  private async resolveTenantId(explicitTenantId?: string): Promise<string | undefined> {
    if (explicitTenantId) {
      return explicitTenantId;
    }

    const { data } = await supabase.auth.getUser();
    return data.user?.user_metadata?.tenant_id;
  }

  /**
   * Load all reference data at once
   */
  async loadAllReferenceData(tenantId: string): Promise<AllReferenceData> {
    return this.getAllReferenceData(tenantId);
  }

  /**
   * Get status options - context calls without module, module calls with module
   * RLS automatically filters by tenant_id via session
   */
  async getStatusOptions(module?: string, tenantId?: string): Promise<StatusOption[]> {
    try {
      let query = supabase
        .from('status_options')
        .select('*')
        .eq('is_active', true);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      if (module) {
        query = query.eq('module', module);
      }

      const { data, error } = await query
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data?.map(mapStatusOption) || [];
    } catch (error) {
      console.error('Error getting status options:', error);
      return [];
    }
  }

  /**
   * Get reference data by category - context calls without category, module calls with category
   * RLS automatically filters by tenant_id via session
   */
  async getReferenceData(category?: string, tenantId?: string): Promise<ReferenceData[]> {
    try {
      let query = supabase
        .from('reference_data')
        .select('*')
        .eq('is_active', true);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data?.map(mapReferenceData) || [];
    } catch (error) {
      console.error('Error getting reference data:', error);
      return [];
    }
  }

  /**
   * Get all active categories from reference_data table with category='product_category'
   * Consistency: Uses reference_data table like all other reference types
   * RLS automatically filters by tenant_id via session
   */
  async getCategories(tenantId?: string): Promise<ProductCategory[]> {
    try {
      let query = supabase
        .from('reference_data')
        .select('*')
        .eq('category', 'product_category')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Map reference_data rows to ProductCategory format
      return data?.map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        name: row.label,
        description: row.description,
        isActive: row.is_active,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
      })) || [];
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  /**
   * Get all active suppliers
   * RLS automatically filters by tenant_id via session
   */
  async getSuppliers(tenantId?: string): Promise<Supplier[]> {
    try {
      let query = supabase
        .from('suppliers')
        .select('*')
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data?.map(mapSupplier) || [];
    } catch (error) {
      console.error('Error getting suppliers:', error);
      return [];
    }
  }

  /**
   * Create status option
   */
  async createStatusOption(dto: CreateStatusOptionDTO): Promise<StatusOption> {
    try {
      const { data, error } = await supabase
        .from('status_options')
        .insert({
          tenant_id: dto.tenantId,
          module: dto.module,
          status_key: dto.statusKey,
          display_label: dto.displayLabel,
          description: dto.description,
          color_code: dto.colorCode,
          sort_order: dto.sortOrder ?? 0,
          is_active: dto.isActive ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return mapStatusOption(data);
    } catch (error) {
      console.error('Error creating status option:', error);
      throw error;
    }
  }

  /**
   * Create reference data
   */
  async createReferenceData(dto: CreateReferenceDataDTO): Promise<ReferenceData> {
    try {
      const { data, error } = await supabase
        .from('reference_data')
        .insert({
          tenant_id: dto.tenantId,
          category: dto.category,
          key: dto.key,
          label: dto.label,
          description: dto.description,
          metadata: dto.metadata ?? {},
          sort_order: dto.sortOrder ?? 0,
          is_active: dto.isActive ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return mapReferenceData(data);
    } catch (error) {
      console.error('Error creating reference data:', error);
      throw error;
    }
  }

  /**
   * Create category
   */
  async createCategory(dto: CreateProductCategoryDTO): Promise<ProductCategory> {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .insert({
          tenant_id: dto.tenantId,
          name: dto.name,
          description: dto.description,
          is_active: dto.isActive ?? true,
          sort_order: dto.sortOrder ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return mapProductCategory(data);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Create supplier
   */
  async createSupplier(dto: CreateSupplierDTO): Promise<Supplier> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          tenant_id: dto.tenantId,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
          website: dto.website,
          contact_person: dto.contactPerson,
          contact_email: dto.contactEmail,
          contact_phone: dto.contactPhone,
          industry: dto.industry,
          country: dto.country,
          status: (dto.isActive ?? true) ? 'active' : 'inactive',
          sort_order: dto.sortOrder ?? 0,
          notes: dto.notes,
          tax_id: dto.taxId,
          credit_limit: dto.creditLimit,
          payment_terms: dto.paymentTerms,
        })
        .select()
        .single();

      if (error) throw error;
      return mapSupplier(data);
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  /**
   * Update status option
   */
  async updateStatusOption(id: string, dto: UpdateStatusOptionDTO): Promise<StatusOption> {
    try {
      const { data, error } = await supabase
        .from('status_options')
        .update({
          display_label: dto.displayLabel,
          description: dto.description,
          color_code: dto.colorCode,
          sort_order: dto.sortOrder,
          is_active: dto.isActive,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapStatusOption(data);
    } catch (error) {
      console.error('Error updating status option:', error);
      throw error;
    }
  }

  /**
   * Update reference data
   */
  async updateReferenceData(id: string, dto: UpdateReferenceDataDTO): Promise<ReferenceData> {
    try {
      const { data, error } = await supabase
        .from('reference_data')
        .update({
          label: dto.label,
          description: dto.description,
          metadata: dto.metadata,
          sort_order: dto.sortOrder,
          is_active: dto.isActive,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapReferenceData(data);
    } catch (error) {
      console.error('Error updating reference data:', error);
      throw error;
    }
  }

  /**
   * Update category
   */
  async updateCategory(id: string, dto: UpdateProductCategoryDTO): Promise<ProductCategory> {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .update({
          name: dto.name,
          description: dto.description,
          is_active: dto.isActive,
          sort_order: dto.sortOrder,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapProductCategory(data);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Update supplier
   */
  async updateSupplier(id: string, dto: UpdateSupplierDTO): Promise<Supplier> {
    try {
      const updatePayload: Record<string, any> = {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        website: dto.website,
        contact_person: dto.contactPerson,
        contact_email: dto.contactEmail,
        contact_phone: dto.contactPhone,
        industry: dto.industry,
        country: dto.country,
        sort_order: dto.sortOrder,
        notes: dto.notes,
        tax_id: dto.taxId,
        credit_limit: dto.creditLimit,
        payment_terms: dto.paymentTerms,
      };

      if (dto.isActive !== undefined) {
        updatePayload.status = dto.isActive ? 'active' : 'inactive';
      }

      const { data, error } = await supabase
        .from('suppliers')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapSupplier(data);
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  }

  /**
   * Delete status option (soft delete)
   */
  async deleteStatusOption(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('status_options')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting status option:', error);
      throw error;
    }
  }

  /**
   * Delete reference data (soft delete)
   */
  async deleteReferenceData(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('reference_data')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting reference data:', error);
      throw error;
    }
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('product_categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Delete supplier (soft delete)
   */
  async deleteSupplier(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ status: 'inactive', deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }

  /**
   * Context-specific methods (for ReferenceDataContext Layer 6)
   * These methods load data without explicit tenantId filtering - RLS policies handle it
   */
  async getAllReferenceData(tenantId?: string): Promise<AllReferenceData> {
    try {
      const resolvedTenantId = await this.resolveTenantId(tenantId);

      let statusQuery = supabase
        .from('status_options')
        .select('*')
        .eq('is_active', true);

      let referenceDataQuery = supabase
        .from('reference_data')
        .select('*')
        .eq('is_active', true);

      let categoriesQuery = supabase
        .from('reference_data')
        .select('*')
        .eq('category', 'product_category')
        .eq('is_active', true);

      let suppliersQuery = supabase
        .from('suppliers')
        .select('*')
        .eq('status', 'active')
        .is('deleted_at', null);

      if (resolvedTenantId) {
        statusQuery = statusQuery.eq('tenant_id', resolvedTenantId);
        referenceDataQuery = referenceDataQuery.eq('tenant_id', resolvedTenantId);
        categoriesQuery = categoriesQuery.eq('tenant_id', resolvedTenantId);
        suppliersQuery = suppliersQuery.eq('tenant_id', resolvedTenantId);
      }

      const [statusRes, refDataRes, categoriesRes, suppliersRes] = await Promise.all([
        statusQuery,
        referenceDataQuery,
        categoriesQuery,
        suppliersQuery,
      ]);

      // Map reference_data rows to ProductCategory format for categories
      const categories = categoriesRes.data?.map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        name: row.label,
        description: row.description,
        isActive: row.is_active,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
      })) || [];

      return {
        statusOptions: statusRes.data?.map(mapStatusOption) || [],
        referenceData: refDataRes.data?.map(mapReferenceData) || [],
        categories,
        suppliers: suppliersRes.data?.map(mapSupplier) || [],
      };
    } catch (error) {
      console.error('Error loading all reference data:', error);
      throw new Error(`Failed to load reference data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// ============================================================================
// 3. EXPORT SINGLETON
// ============================================================================

export const supabaseReferenceDataService = new SupabaseReferenceDataService();
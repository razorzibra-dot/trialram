/**
 * LAYER 4: SUPABASE SERVICE - Reference Data Loader
 * ============================================================================
 * Supabase implementation for reference data loading - queries PostgreSQL database
 * Part of 8-layer sync pattern for dynamic data loading architecture
 * 
 * ✅ SYNCHRONIZATION RULES:
 * 1. Column mapping: snake_case (DB) → camelCase (TypeScript)
 * 2. Field names: exactly match types in referenceData.types.ts
 * 3. Validation: same as mock service
 * 4. Error handling: consistent with mock service
 * 5. Row mappers: centralized for consistency
 */

import { supabase } from '@/services/supabase/client';
import {
  StatusOption,
  ReferenceData,
  ProductCategory,
  Supplier,
  AllReferenceData,
  CreateStatusOptionDTO,
  UpdateStatusOptionDTO,
  CreateReferenceDataDTO,
  UpdateReferenceDataDTO,
  CreateProductCategoryDTO,
  UpdateProductCategoryDTO,
  CreateSupplierDTO,
  UpdateSupplierDTO,
} from '@/types/referenceData.types';

/**
 * Centralized row mappers for consistency
 * Maps database columns (snake_case) to TypeScript types (camelCase)
 * CRITICAL: Keep in sync with database schema
 */

function mapStatusOptionRow(row: any): StatusOption {
  return {
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
  };
}

function mapReferenceDataRow(row: any): ReferenceData {
  return {
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
  };
}

function mapProductCategoryRow(row: any): ProductCategory {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    description: row.description,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

function mapSupplierRow(row: any): Supplier {
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
}

/**
 * Supabase Reference Data Loader Service
 * 
 * Methods:
 * - loadAllReferenceData(): Load all reference data at once
 * - loadStatusOptions(): Load status options for all modules or specific module
 * - loadReferenceData(): Load generic reference data, optionally filtered by category
 * - loadCategories(): Load product categories
 * - loadSuppliers(): Load suppliers
 * 
 * ✅ SYNC RULES:
 * 1. Column names use snake_case (database convention)
 * 2. Row mappers convert to camelCase (TypeScript convention)
 * 3. Filter by is_active=true by default
 * 4. Sort by sort_order by default
 * 5. Validate input same as mock service
 */
export const supabaseReferenceDataLoader = {
  /**
   * Load all reference data at once
   * Used by context provider on app initialization
   */
  async loadAllReferenceData(tenantId: string): Promise<AllReferenceData> {
    try {
      // Get current user's tenant from auth
      const { data: { user } } = await supabase.auth.getUser();
      const userTenantId = user?.user_metadata?.tenant_id || tenantId;

      // Load all data in parallel
      const [statusOptions, referenceData, categories, suppliers] = await Promise.all([
        supabaseReferenceDataLoader.loadStatusOptions(userTenantId),
        supabaseReferenceDataLoader.loadReferenceData(userTenantId),
        supabaseReferenceDataLoader.loadCategories(userTenantId),
        supabaseReferenceDataLoader.loadSuppliers(userTenantId),
      ]);

      return {
        statusOptions,
        referenceData,
        categories,
        suppliers,
      };
    } catch (error) {
      throw new Error(`Failed to load reference data: ${error}`);
    }
  },

  /**
   * Load status options for specific module(s)
   * @param tenantId - Tenant ID (from auth context)
   * @param module - Optional module filter (e.g., 'sales', 'tickets')
   */
  async loadStatusOptions(
    tenantId: string,
    module?: string
  ): Promise<StatusOption[]> {
    try {
      let query = supabase
        .from('status_options')
        .select(`
          id,
          tenant_id,
          module,
          status_key,
          display_label,
          description,
          color_code,
          sort_order,
          is_active,
          created_at,
          updated_at,
          created_by
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (module) {
        query = query.eq('module', module);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapStatusOptionRow);
    } catch (error) {
      throw new Error(`Failed to load status options: ${error}`);
    }
  },

  /**
   * Load generic reference data by category
   * @param tenantId - Tenant ID (from auth context)
   * @param category - Optional category filter (e.g., 'priority', 'severity')
   */
  async loadReferenceData(
    tenantId: string,
    category?: string
  ): Promise<ReferenceData[]> {
    try {
      let query = supabase
        .from('reference_data')
        .select(`
          id,
          tenant_id,
          category,
          key,
          label,
          description,
          metadata,
          sort_order,
          is_active,
          created_at,
          updated_at,
          created_by
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapReferenceDataRow);
    } catch (error) {
      throw new Error(`Failed to load reference data: ${error}`);
    }
  },

  /**
   * Load product categories
   * @param tenantId - Tenant ID (from auth context)
   */
  async loadCategories(tenantId: string): Promise<ProductCategory[]> {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select(`
          id,
          tenant_id,
          name,
          description,
          is_active,
          sort_order,
          created_at,
          updated_at,
          created_by
        `)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapProductCategoryRow);
    } catch (error) {
      throw new Error(`Failed to load product categories: ${error}`);
    }
  },

  /**
   * Load suppliers
   * @param tenantId - Tenant ID (from auth context)
   */
  async loadSuppliers(tenantId: string): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select(`
          id,
          tenant_id,
          name,
          email,
          phone,
          address,
          website,
          contact_person,
          contact_email,
          contact_phone,
          industry,
          country,
          is_active,
          sort_order,
          notes,
          tax_id,
          credit_limit,
          payment_terms,
          created_at,
          updated_at,
          created_by,
          deleted_at
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapSupplierRow);
    } catch (error) {
      throw new Error(`Failed to load suppliers: ${error}`);
    }
  },

  /**
   * Create status option
   */
  async createStatusOption(
    data: CreateStatusOptionDTO
  ): Promise<StatusOption> {
    try {
      if (!data.module || !data.statusKey || !data.displayLabel) {
        throw new Error('Required fields missing: module, statusKey, displayLabel');
      }

      const { data: result, error } = await supabase
        .from('status_options')
        .insert([{
          tenant_id: data.tenantId,
          module: data.module,
          status_key: data.statusKey,
          display_label: data.displayLabel,
          description: data.description || null,
          color_code: data.colorCode || null,
          sort_order: data.sortOrder ?? 0,
          is_active: data.isActive ?? true,
        }])
        .select()
        .single();

      if (error) throw error;
      return mapStatusOptionRow(result);
    } catch (error) {
      throw new Error(`Failed to create status option: ${error}`);
    }
  },

  /**
   * Create reference data
   */
  async createReferenceData(
    data: CreateReferenceDataDTO
  ): Promise<ReferenceData> {
    try {
      if (!data.category || !data.key || !data.label) {
        throw new Error('Required fields missing: category, key, label');
      }

      const { data: result, error } = await supabase
        .from('reference_data')
        .insert([{
          tenant_id: data.tenantId,
          category: data.category,
          key: data.key,
          label: data.label,
          description: data.description || null,
          metadata: data.metadata || {},
          sort_order: data.sortOrder ?? 0,
          is_active: data.isActive ?? true,
        }])
        .select()
        .single();

      if (error) throw error;
      return mapReferenceDataRow(result);
    } catch (error) {
      throw new Error(`Failed to create reference data: ${error}`);
    }
  },

  /**
   * Create product category
   */
  async createCategory(
    data: CreateProductCategoryDTO
  ): Promise<ProductCategory> {
    try {
      if (!data.name) {
        throw new Error('Category name is required');
      }

      const { data: result, error } = await supabase
        .from('product_categories')
        .insert([{
          tenant_id: data.tenantId,
          name: data.name,
          description: data.description || null,
          is_active: data.isActive ?? true,
          sort_order: data.sortOrder ?? 0,
        }])
        .select()
        .single();

      if (error) throw error;
      return mapProductCategoryRow(result);
    } catch (error) {
      throw new Error(`Failed to create product category: ${error}`);
    }
  },

  /**
   * Create supplier
   */
  async createSupplier(
    data: CreateSupplierDTO
  ): Promise<Supplier> {
    try {
      if (!data.name) {
        throw new Error('Supplier name is required');
      }

      const { data: result, error } = await supabase
        .from('suppliers')
        .insert([{
          tenant_id: data.tenantId,
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          website: data.website || null,
          contact_person: data.contactPerson || null,
          contact_email: data.contactEmail || null,
          contact_phone: data.contactPhone || null,
          industry: data.industry || null,
          country: data.country || null,
          status: (data.isActive ?? true) ? 'active' : 'inactive',
          sort_order: data.sortOrder ?? 0,
          notes: data.notes || null,
          tax_id: data.taxId || null,
          credit_limit: data.creditLimit || null,
          payment_terms: data.paymentTerms || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return mapSupplierRow(result);
    } catch (error) {
      throw new Error(`Failed to create supplier: ${error}`);
    }
  },

  /**
   * Update status option
   */
  async updateStatusOption(
    id: string,
    data: UpdateStatusOptionDTO
  ): Promise<StatusOption> {
    try {
      const { data: result, error } = await supabase
        .from('status_options')
        .update({
          display_label: data.displayLabel,
          description: data.description,
          color_code: data.colorCode,
          sort_order: data.sortOrder,
          is_active: data.isActive,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapStatusOptionRow(result);
    } catch (error) {
      throw new Error(`Failed to update status option: ${error}`);
    }
  },

  /**
   * Update reference data
   */
  async updateReferenceData(
    id: string,
    data: UpdateReferenceDataDTO
  ): Promise<ReferenceData> {
    try {
      const { data: result, error } = await supabase
        .from('reference_data')
        .update({
          label: data.label,
          description: data.description,
          metadata: data.metadata,
          sort_order: data.sortOrder,
          is_active: data.isActive,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapReferenceDataRow(result);
    } catch (error) {
      throw new Error(`Failed to update reference data: ${error}`);
    }
  },

  /**
   * Update product category
   */
  async updateCategory(
    id: string,
    data: UpdateProductCategoryDTO
  ): Promise<ProductCategory> {
    try {
      const { data: result, error } = await supabase
        .from('product_categories')
        .update({
          name: data.name,
          description: data.description,
          is_active: data.isActive,
          sort_order: data.sortOrder,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapProductCategoryRow(result);
    } catch (error) {
      throw new Error(`Failed to update product category: ${error}`);
    }
  },

  /**
   * Update supplier
   */
  async updateSupplier(
    id: string,
    data: UpdateSupplierDTO
  ): Promise<Supplier> {
    try {
      const updatePayload: Record<string, any> = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        website: data.website,
        contact_person: data.contactPerson,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone,
        industry: data.industry,
        country: data.country,
        sort_order: data.sortOrder,
        notes: data.notes,
        tax_id: data.taxId,
        credit_limit: data.creditLimit,
        payment_terms: data.paymentTerms,
      };

      if (data.isActive !== undefined) {
        updatePayload.status = data.isActive ? 'active' : 'inactive';
      }

      const { data: result, error } = await supabase
        .from('suppliers')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapSupplierRow(result);
    } catch (error) {
      throw new Error(`Failed to update supplier: ${error}`);
    }
  },

  /**
   * Delete status option (soft delete via is_active)
   */
  async deleteStatusOption(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('status_options')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw new Error(`Failed to delete status option: ${error}`);
    }
  },

  /**
   * Delete reference data (soft delete via is_active)
   */
  async deleteReferenceData(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('reference_data')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw new Error(`Failed to delete reference data: ${error}`);
    }
  },

  /**
   * Delete product category (soft delete via is_active)
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('product_categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw new Error(`Failed to delete product category: ${error}`);
    }
  },

  /**
   * Delete supplier (soft delete via deleted_at)
   */
  async deleteSupplier(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          status: 'inactive',
          deleted_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw new Error(`Failed to delete supplier: ${error}`);
    }
  },
};

export default supabaseReferenceDataLoader;

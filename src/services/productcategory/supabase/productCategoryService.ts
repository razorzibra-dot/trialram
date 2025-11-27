import { supabase } from '@/services/supabase/client';
import { ProductCategory, ProductCategoryFormData } from '@/types/masters';
import { authService } from '../../serviceFactory';

class ProductCategoryService {
  private supabaseClient = supabase;
  private tableName = 'product_categories';

  async getCategories(page: number = 1, limit: number = 10, filters?: {
    search?: string;
    parent_id?: string;
    level?: number;
    is_active?: boolean;
  }, tenantId?: string): Promise<{
    data: ProductCategory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    let query = this.supabaseClient
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('tenant_id', finalTenantId);

    // Apply filters
    if (filters) {
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.parent_id !== undefined) {
        if (filters.parent_id === null) {
          query = query.is('parent_id', null);
        } else {
          query = query.eq('parent_id', filters.parent_id);
        }
      }
      if (filters.level !== undefined) {
        query = query.eq('level', filters.level);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
    }

    // Sort by sort_order, then by name
    query = query.order('sort_order').order('name');

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data || [],
      total,
      page,
      limit,
      totalPages
    };
  }

  async getCategory(id: string, tenantId?: string): Promise<ProductCategory> {
    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    const { data, error } = await this.supabaseClient
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .eq('tenant_id', finalTenantId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Category not found');

    return data;
  }

  async createCategory(data: ProductCategoryFormData, tenantId?: string): Promise<ProductCategory> {
    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    // Check if name already exists for this tenant
    const { data: existing, error: checkError } = await this.supabaseClient
      .from(this.tableName)
      .select('id')
      .eq('name', data.name)
      .eq('tenant_id', finalTenantId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw checkError;
    }

    if (existing) {
      throw new Error('Category name already exists');
    }

    const insertData = {
      name: data.name,
      description: data.description || '',
      parent_id: data.parent_id || null,
      sort_order: data.sort_order || 0,
      is_active: data.is_active !== undefined ? data.is_active : true,
      image_url: data.image_url || null,
      icon: data.icon || null,
      color: data.color || null,
      tenant_id: finalTenantId,
      created_by: user?.id
    };

    const { data: result, error } = await this.supabaseClient
      .from(this.tableName)
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async updateCategory(id: string, data: Partial<ProductCategoryFormData>, tenantId?: string): Promise<ProductCategory> {
    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    // Check if name already exists (excluding current category)
    if (data.name) {
      const { data: existing, error: checkError } = await this.supabaseClient
        .from(this.tableName)
        .select('id')
        .eq('name', data.name)
        .eq('tenant_id', finalTenantId)
        .neq('id', id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        throw new Error('Category name already exists');
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.parent_id !== undefined) updateData.parent_id = data.parent_id;
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.image_url !== undefined) updateData.image_url = data.image_url;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;

    const { data: result, error } = await this.supabaseClient
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', finalTenantId)
      .select()
      .single();

    if (error) throw error;
    if (!result) throw new Error('Category not found');

    return result;
  }

  async deleteCategory(id: string, tenantId?: string): Promise<void> {
    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    // Check if category has children
    const { data: children, error: childrenError } = await this.supabaseClient
      .from(this.tableName)
      .select('id')
      .eq('parent_id', id)
      .eq('tenant_id', finalTenantId)
      .limit(1);

    if (childrenError) throw childrenError;

    if (children && children.length > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    const { error } = await this.supabaseClient
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .eq('tenant_id', finalTenantId);

    if (error) throw error;
  }

  async getCategoryHierarchy(tenantId?: string): Promise<ProductCategory[]> {
    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    const { data, error } = await this.supabaseClient
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', finalTenantId)
      .order('level')
      .order('sort_order')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getRootCategories(tenantId?: string): Promise<ProductCategory[]> {
    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    const { data, error } = await this.supabaseClient
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', finalTenantId)
      .is('parent_id', null)
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getChildCategories(parentId: string, tenantId?: string): Promise<ProductCategory[]> {
    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    const { data, error } = await this.supabaseClient
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', finalTenantId)
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (error) throw error;
    return data || [];
  }
}

export const supabaseProductCategoryService = new ProductCategoryService();
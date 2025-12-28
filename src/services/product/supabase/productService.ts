/**
 * Supabase Product Service
 * Handles product catalog, categories, specifications
 * Extends BaseSupabaseService for common database operations
 */

import { getSupabaseClient } from '@/services/supabase/client';
import type { ProductFilters, Product } from '@/types/masters';
import type { PaginatedResponse } from '@/modules/core/types';
import { multiTenantService } from '../../multitenant/supabase/multiTenantService';

// Simple base service implementation since the import is missing
class BaseSupabaseService {
  constructor(private tableName: string, private useTenant: boolean) {}

  log(message: string, data?: any) {
    console.log(`[${this.constructor.name}] ${message}`, data);
  }

  logError(message: string, error: any) {
    console.error(`[${this.constructor.name}] ${message}`, error);
  }

  subscribeToChanges(options: any, callback: any) {
    // Stub implementation
    return () => {};
  }
}

// ✅ Product type is imported from '@/types/masters' at the top of the file

export class SupabaseProductService extends BaseSupabaseService {
  constructor() {
    super('products', true);
  }

  /**
   * Get all products with optional filtering
   */
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;

    try {
      const tenant = await this.ensureTenantContext();
      const tenantId = (filters as any).tenantId || tenant?.tenantId;
      const client = getSupabaseClient();

      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      const buildQuery = (includeDeletedFilter: boolean) => {
        let query = client
          .from('products')
          .select('*', { count: 'exact' });

        if (tenantId) {
          query = query.eq('tenant_id', tenantId);
        }

        if (filters.status) {
          query = query.eq('status', filters.status);
        }

        const categoryId = (filters as any).categoryId || filters.category;
        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        if (filters.type) {
          query = query.eq('type', filters.type);
        }

        if (filters.price_min !== undefined) {
          query = query.gte('price', filters.price_min);
        }

        if (filters.price_max !== undefined) {
          query = query.lte('price', filters.price_max);
        }

        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
        }

        if (includeDeletedFilter) {
          try {
            query = query.is('deleted_at', null);
          } catch {
            // Column may not exist yet; ignore filter
          }
        }

        return query
          .order('name', { ascending: true })
          .range(start, end);
      };

      const { data, error, count } = await buildQuery(true);

      if (error) {
        if (error.code === '42703' && error.message?.includes('deleted_at')) {
          const { data: retryData, error: retryError, count: retryCount } = await buildQuery(false);
          if (retryError) throw retryError;

          const mappedRetry = (retryData ?? []).map((p) => this.mapProductResponse(p));
          const totalRetry = retryCount ?? mappedRetry.length;

          return {
            data: mappedRetry,
            total: totalRetry,
            page,
            pageSize,
            totalPages: Math.ceil(totalRetry / pageSize),
          };
        }

        throw error;
      }

      const mappedProducts = (data ?? []).map((p) => this.mapProductResponse(p));
      const total = count ?? mappedProducts.length;

      return {
        data: mappedProducts,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      this.logError('Error fetching products', error);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }
  }

  /**
   * Get product by ID
   */
  async getProduct(id: string): Promise<Product | null> {
    try {
      this.log('Fetching product', { id });

      await this.ensureTenantContext();

      const { data, error } = await getSupabaseClient()
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data ? this.mapProductResponse(data) : null;
    } catch (error) {
      this.logError('Error fetching product', error);
      throw error;
    }
  }

  /**
   * Create new product
   */
  async createProduct(data: Partial<Product>): Promise<Product> {
    try {
      this.log('Creating product', { name: data.name });

      const tenant = await this.ensureTenantContext();

      // ✅ NORMALIZED: Remove denormalized fields (category, supplier_name, is_active)
      const { data: created, error } = await getSupabaseClient()
        .from('products')
        .insert([
          {
            name: data.name,
            description: data.description,
            category_id: data.category_id, // ✅ NORMALIZED: Use FK only
            // ✅ REMOVED: category string (denormalized)
            brand: (data as any).brand,
            manufacturer: (data as any).manufacturer,
            type: (data as any).type,
            sku: data.sku,
            price: data.price || 0,
            cost_price: (data as any).cost_price || (data as any).cost,
            currency: data.currency || 'USD',
            // ✅ REMOVED: pricing_tiers, discount_rules (not in database)
            // ✅ REMOVED: specifications (belongs in product_specifications table)
            stock_quantity: data.stock_quantity || 0,
            unit: (data as any).unit,
            reorder_level: data.reorder_level,
            min_stock_level: (data as any).min_stock_level,
            max_stock_level: (data as any).max_stock_level,
            track_stock: (data as any).track_stock,
            status: data.status || 'active', // ✅ NORMALIZED: Use status only
            // ✅ REMOVED: is_active boolean (redundant with status)
            supplier_id: (data as any).supplier_id, // ✅ NORMALIZED: Use FK only
            // ✅ REMOVED: supplier_name string (denormalized)
            image_url: data.image_url,
            // ✅ REMOVED: notes (not in database)
            tags: data.tags,
            tenant_id: data.tenant_id || tenant.tenantId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            // Product hierarchy fields
            parent_id: data.parent_id,
            is_variant: data.is_variant,
            variant_group_id: data.variant_group_id,
          },
        ])
        .select('*')
        .single();

      if (error) throw error;

      this.log('Product created successfully', { id: created.id });
      return this.mapProductResponse(created);
    } catch (error) {
      this.logError('Error creating product', error);
      throw error;
    }
  }

  /**
   * Update product
   */
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    try {
      this.log('Updating product', { id });

      const tenant = await this.ensureTenantContext();

      // ✅ NORMALIZED: Remove denormalized fields (category, supplier_name, is_active)
      const { data, error } = await getSupabaseClient()
        .from('products')
        .update({
          name: updates.name,
          description: updates.description,
          category_id: updates.category_id, // ✅ NORMALIZED: Use FK only
          // ✅ REMOVED: category string (denormalized)
          brand: (updates as any).brand,
          manufacturer: (updates as any).manufacturer,
          type: (updates as any).type,
          sku: updates.sku,
          price: updates.price,
          cost_price: (updates as any).cost_price || (updates as any).cost,
          currency: updates.currency,
          stock_quantity: updates.stock_quantity,
          unit: (updates as any).unit,
          reorder_level: updates.reorder_level,
          min_stock_level: (updates as any).min_stock_level,
          max_stock_level: (updates as any).max_stock_level,
          track_stock: (updates as any).track_stock,
          status: updates.status, // ✅ NORMALIZED: Use status only
          // ✅ REMOVED: is_active boolean (redundant with status)
          supplier_id: (updates as any).supplier_id, // ✅ NORMALIZED: Use FK only
          // ✅ REMOVED: supplier_name string (denormalized)
          image_url: updates.image_url,
          // ✅ REMOVED: notes, specifications (not in database)
          tags: updates.tags,
          tenant_id: updates.tenant_id || tenant.tenantId,
          updated_at: new Date().toISOString(),
          // Product hierarchy fields
          parent_id: updates.parent_id,
          is_variant: updates.is_variant,
          variant_group_id: updates.variant_group_id,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      this.log('Product updated successfully', { id });
      return this.mapProductResponse(data);
    } catch (error) {
      this.logError('Error updating product', error);
      throw error;
    }
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      this.log('Deleting product', { id });

      await this.ensureTenantContext();

      const { error } = await getSupabaseClient()
        .from('products')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      this.log('Product deleted successfully', { id });
    } catch (error) {
      this.logError('Error deleting product', error);
      throw error;
    }
  }

  /**
   * Search products by name or SKU
   */
  async searchProducts(
    searchTerm: string,
    tenantId?: string
  ): Promise<Product[]> {
    try {
      this.log('Searching products', { searchTerm });

      let query = getSupabaseClient()
        .from('products')
        .select(
          `*,
          category:product_categories(*)`
        )
        .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      query = query.is('deleted_at', null);

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;

      this.log('Search completed', { count: data?.length });
      return data?.map((p) => this.mapProductResponse(p)) || [];
    } catch (error) {
      this.logError('Error searching products', error);
      throw error;
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(tenantId?: string): Promise<Product[]> {
    try {
      const tenant = tenantId ? { tenantId } : await this.ensureTenantContext();
      const resolvedTenantId = tenantId || tenant?.tenantId;

      this.log('Fetching low stock products', { tenantId: resolvedTenantId });

      let query = getSupabaseClient()
        .from('products')
        .select('*')
        .eq('status', 'active');

      if (resolvedTenantId) {
        query = query.eq('tenant_id', resolvedTenantId);
      }

      try {
        query = query.is('deleted_at', null);
      } catch {
        // Column may not exist; ignore filter
      }

      const { data, error } = await query.order('name');

      if (error) throw error;

      // Filter products where stock is below reorder level
      const lowStock = data?.filter((p: any) => {
        const reorderLevel = p.reorder_level || 0;
        return p.stock_quantity <= reorderLevel;
      }) || [];

      this.log('Low stock products fetched', { count: lowStock.length });
      return lowStock.map((p) => this.mapProductResponse(p));
    } catch (error) {
      this.logError('Error fetching low stock products', error);
      throw error;
    }
  }

  /**
   * Update product stock
   */
  async updateStock(id: string, quantity: number, action: 'add' | 'subtract' | 'set'): Promise<Product> {
    try {
      this.log('Updating product stock', { id, quantity, action });

      // First get current stock
      const product = await this.getProduct(id);
      if (!product) throw new Error('Product not found');

      let newStock = product.stock_quantity;
      if (action === 'add') {
        newStock += quantity;
      } else if (action === 'subtract') {
        newStock = Math.max(0, newStock - quantity);
      } else {
        newStock = quantity;
      }

      return this.updateProduct(id, { stock_quantity: newStock } as any);
    } catch (error) {
      this.logError('Error updating product stock', error);
      throw error;
    }
  }

  /**
   * Get product statistics
   */
  async getProductStats(tenantId: string): Promise<{
    total: number;
    active: number;
    discontinued: number;
    totalInventoryValue: number;
    averagePrice: number;
  }> {
    try {
      this.log('Fetching product statistics', { tenantId });

      const response = await this.getProducts({ pageSize: 10000, tenantId });
      const products = response.data || [];

      const stats = {
        total: products.length,
        active: products.filter((p) => p.status === 'active').length,
        discontinued: products.filter((p) => p.status === 'discontinued').length,
        totalInventoryValue: 0,
        averagePrice: 0,
      };

      if (products.length > 0) {
        stats.totalInventoryValue = products.reduce(
          (sum, p) => sum + (p.price || 0) * (p.stock_quantity || 0),
          0
        );
        stats.averagePrice = products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length;
      }

      return stats;
    } catch (error) {
      this.logError('Error fetching product statistics', error);
      throw error;
    }
  }

  /**
   * Get product children (products that have this product as parent)
   */
  async getProductChildren(parentId: string): Promise<Product[]> {
    try {
      this.log('Fetching product children', { parentId });

      const tenant = await this.ensureTenantContext();

      const { data, error } = await getSupabaseClient()
        .from('products')
        .select(
          `*,
          category:product_categories(*)`
        )
        .eq('parent_id', parentId)
        .eq('tenant_id', tenant.tenantId)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;

      this.log('Product children fetched', { count: data?.length });
      return data?.map((p) => this.mapProductResponse(p)) || [];
    } catch (error) {
      this.logError('Error fetching product children', error);
      throw error;
    }
  }

  /**
   * Get product parent (product that this product belongs to)
   */
  async getProductParent(childId: string): Promise<Product | null> {
    try {
      this.log('Fetching product parent', { childId });

      const tenant = await this.ensureTenantContext();

      // First get the child product to find its parent_id
      const { data: child, error: childError } = await getSupabaseClient()
        .from('products')
        .select('parent_id')
        .eq('id', childId)
        .eq('tenant_id', tenant.tenantId)
        .single();

      if (childError) throw childError;
      if (!child?.parent_id) return null;

      // Now get the parent product
      const { data: parent, error: parentError } = await getSupabaseClient()
        .from('products')
        .select(
          `*,
          category:product_categories(*)`
        )
        .eq('id', child.parent_id)
        .eq('tenant_id', tenant.tenantId)
        .is('deleted_at', null)
        .single();

      if (parentError && parentError.code !== 'PGRST116') throw parentError;

      return parent ? this.mapProductResponse(parent) : null;
    } catch (error) {
      this.logError('Error fetching product parent', error);
      throw error;
    }
  }

  /**
   * Get complete product hierarchy information
   */
  async getProductHierarchy(productId: string): Promise<{
    product: Product;
    parent?: Product;
    children: Product[];
    siblings: Product[];
  }> {
    try {
      this.log('Fetching product hierarchy', { productId });

      const tenant = await this.ensureTenantContext();

      // Get the product itself
      const product = await this.getProduct(productId);
      if (!product) throw new Error('Product not found');

      // Get parent, children, and siblings in parallel
      const [parent, children] = await Promise.all([
        product.parent_id ? this.getProductParent(productId) : Promise.resolve(null),
        this.getProductChildren(productId)
      ]);

      // Get siblings (other children of the same parent, excluding this product)
      let siblings: Product[] = [];
      if (product.parent_id) {
        const allSiblings = await this.getProductChildren(product.parent_id);
        siblings = allSiblings.filter(s => s.id !== productId);
      }

      return {
        product,
        parent: parent || undefined,
        children,
        siblings
      };
    } catch (error) {
      this.logError('Error fetching product hierarchy', error);
      throw error;
    }
  }

  /**
   * Get product variants (products in the same variant group)
   */
  async getProductVariants(baseProductId: string): Promise<Product[]> {
    try {
      this.log('Fetching product variants', { baseProductId });

      const tenant = await this.ensureTenantContext();

      // First get the base product to find its variant_group_id
      const { data: baseProduct, error: baseError } = await getSupabaseClient()
        .from('products')
        .select('variant_group_id')
        .eq('id', baseProductId)
        .eq('tenant_id', tenant.tenantId)
        .single();

      if (baseError) throw baseError;
      if (!baseProduct?.variant_group_id) return [];

      // Get all variants in the same group (including the base product if it's a variant)
      const { data, error } = await getSupabaseClient()
        .from('products')
        .select(
          `*,
          category:product_categories(*)`
        )
        .eq('variant_group_id', baseProduct.variant_group_id)
        .eq('is_variant', true)
        .eq('tenant_id', tenant.tenantId)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;

      this.log('Product variants fetched', { count: data?.length });
      return data?.map((p) => this.mapProductResponse(p)) || [];
    } catch (error) {
      this.logError('Error fetching product variants', error);
      throw error;
    }
  }

  /**
   * Get root products (products with no parent)
   */
  async getRootProducts(): Promise<Product[]> {
    try {
      this.log('Fetching root products');

      const tenant = await this.ensureTenantContext();

      const { data, error } = await getSupabaseClient()
        .from('products')
        .select(
          `*,
          category:product_categories(*)`
        )
        .or('parent_id.is.null,parent_id.eq.""')
        .eq('tenant_id', tenant.tenantId)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;

      this.log('Root products fetched', { count: data?.length });
      return data?.map((p) => this.mapProductResponse(p)) || [];
    } catch (error) {
      this.logError('Error fetching root products', error);
      throw error;
    }
  }

  /**
    * Subscribe to product changes
    */
  subscribeToProducts(
    tenantId: string,
    callback: (payload: any) => void
  ): () => void {
    return this.subscribeToChanges(
      {
        event: '*',
        table: 'products',
        filter: `tenant_id=eq.${tenantId}`,
      },
      callback
    );
  }

  private async ensureTenantContext() {
    const tenant = multiTenantService.getCurrentTenant();
    
    console.log('[SupabaseProductService] ⚡ ensureTenantContext called');
    console.log('[SupabaseProductService] 📋 Current tenant from multiTenantService:', tenant);
    
    // ✅ Allow super admins (who may have null tenantId)
    if (!tenant) {
      console.error('[SupabaseProductService] ❌ NO TENANT CONTEXT! multiTenantService.getCurrentTenant() returned null');
      console.error('[SupabaseProductService] ❌ This means tenant context was not initialized by AuthContext');
      console.error('[SupabaseProductService] ❌ Check if user is logged in and AuthContext.initializeAuth completed');
      
      // ⚠️ TEMPORARY: Try to bootstrap from localStorage
      const userStr = localStorage.getItem('crm_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          console.warn('[SupabaseProductService] 🔄 Found user in localStorage, attempting bootstrap:', user.email);
          
          // Create temporary tenant context
          const tempTenant: any = {
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role
          };
          
          console.warn('[SupabaseProductService] 🔄 Using temporary tenant context:', tempTenant);
          return tempTenant;
        } catch (e) {
          console.error('[SupabaseProductService] ❌ Failed to parse localStorage user:', e);
        }
      }
      
      this.logError('No tenant context available', new Error('Unauthorized'));
      throw new Error('Unauthorized');
    }

    console.log('[SupabaseProductService] ✅ Tenant context found:', {
      tenantId: tenant.tenantId,
      userId: tenant.userId,
      role: tenant.role
    });
    
    // ✅ Super admins can have null tenantId, that's okay
    if (tenant.tenantId) {
      await getSupabaseClient().auth.updateUser({
        data: {
          tenant_id: tenant.tenantId,
          role: tenant.role,
          user_id: tenant.userId,
        },
      });
    }

    return tenant;
  }

  /**
   * Map database product response to Product type
   */
  private mapProductResponse(dbProduct: any): Product {
    return {
      id: dbProduct.id,
      name: dbProduct.name,
      description: dbProduct.description || '',
      category_id: dbProduct.category_id,
      categoryName: dbProduct.categoryName || dbProduct.category_name, // Support both naming conventions
      sku: dbProduct.sku || dbProduct.code || '', // ✅ Handle both 'sku' and 'code' column names
      price: dbProduct.price || 0,
      cost_price: dbProduct.cost_price || dbProduct.cost, // ✅ FIXED: Map cost_price from DB
      currency: dbProduct.currency || 'USD',
      stock_quantity: dbProduct.stock_quantity || 0,
      min_stock_level: dbProduct.min_stock_level,
      max_stock_level: dbProduct.max_stock_level,
      reorder_level: dbProduct.reorder_level,
      status: (dbProduct.status || 'active') as Product['status'],
      image_url: dbProduct.image_url || '',
      specifications: dbProduct.specifications,
      tags: dbProduct.tags || [],
      brand: dbProduct.brand,
      manufacturer: dbProduct.manufacturer,
      type: dbProduct.type,
      unit: dbProduct.unit,
      weight: dbProduct.weight,
      dimensions: dbProduct.dimensions,
      supplier_id: dbProduct.supplier_id,
      warranty_period: dbProduct.warranty_period || dbProduct.warranty_period_months,
      service_contract_available: dbProduct.service_contract_available,
      notes: dbProduct.notes,
      tenant_id: dbProduct.tenant_id,
      created_at: dbProduct.created_at,
      updated_at: dbProduct.updated_at,
      created_by: dbProduct.created_by,
      // Product hierarchy fields
      parent_id: dbProduct.parent_id,
      is_variant: dbProduct.is_variant,
      variant_group_id: dbProduct.variant_group_id,
    };
  }
}

// Export singleton instance
export const supabaseProductService = new SupabaseProductService();
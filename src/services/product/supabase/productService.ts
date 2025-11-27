/**
 * Supabase Product Service
 * Handles product catalog, categories, specifications
 * Extends BaseSupabaseService for common database operations
 */

import { supabase, getSupabaseClient } from '@/services/supabase/client';

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

export interface Product {
   id: string;
   name: string;
   description?: string;
   category_id?: string;
   sku: string;
   price: number;
   cost?: number;
   currency: string;
   // Advanced pricing
   pricing_tiers?: any[];
   discount_rules?: any[];
   stock_quantity: number;
   reorder_level?: number;
   status: 'active' | 'inactive' | 'discontinued';
   image_url?: string;
   specifications?: Record<string, any>;
   tags?: string[];
   tenant_id: string;
   created_at: string;
   updated_at: string;

   // Product hierarchy fields
   parent_id?: string;
   is_variant?: boolean;
   variant_group_id?: string;
}

export interface ProductFilters {
  status?: string;
  categoryId?: string;
  tenantId?: string;
  search?: string;
}

export class SupabaseProductService extends BaseSupabaseService {
  constructor() {
    super('products', true);
  }

  /**
   * Get all products with optional filtering
   */
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    try {
      this.log('Fetching products', filters);

      const tenant = await this.ensureTenantContext();

      const client = getSupabaseClient();

      let query = client
        .from('products')
        .select(
          `*,
          category:product_categories(*)`
        );

      // Apply filters
      if (filters?.tenantId) {
        query = query.eq('tenant_id', filters.tenantId);
      } else {
        query = query.eq('tenant_id', tenant.tenantId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      // Exclude deleted records
      query = query.is('deleted_at', null);

      const { data, error } = await query.order('name');

      if (error) throw error;

      this.log('Products fetched', { count: data?.length });
      return data?.map((p) => this.mapProductResponse(p)) || [];
    } catch (error) {
      this.logError('Error fetching products', error);
      throw error;
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
        .select(
          `*,
          category:product_categories(*)`
        )
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
            cost_price: (data as any).cost_price || data.cost,
            currency: data.currency || 'USD',
            // Advanced pricing
            pricing_tiers: data.pricing_tiers,
            discount_rules: data.discount_rules,
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
            notes: (data as any).notes,
            specifications: data.specifications,
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
        .select(
          `*,
          category:product_categories(*)`
        )
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
          cost_price: (updates as any).cost_price || updates.cost,
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
          notes: (updates as any).notes,
          specifications: updates.specifications,
          tags: updates.tags,
          tenant_id: updates.tenant_id || tenant.tenantId,
          updated_at: new Date().toISOString(),
          // Product hierarchy fields
          parent_id: updates.parent_id,
          is_variant: updates.is_variant,
          variant_group_id: updates.variant_group_id,
        })
        .eq('id', id)
        .select(
          `*,
          category:product_categories(*)`
        )
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

      const { data, error } = await query.order('name');

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
  async getLowStockProducts(tenantId: string): Promise<Product[]> {
    try {
      this.log('Fetching low stock products', { tenantId });

      const query = getSupabaseClient()
        .from('products')
        .select(
          `*,
          category:product_categories(*)`
        )
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .is('deleted_at', null);

      const { data, error } = await query;

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

      const products = await this.getProducts({ tenantId });

      const stats = {
        total: products.length,
        active: products.filter((p) => p.status === 'active').length,
        discontinued: products.filter((p) => p.status === 'discontinued').length,
        totalInventoryValue: 0,
        averagePrice: 0,
      };

      if (products.length > 0) {
        stats.totalInventoryValue = products.reduce(
          (sum, p) => sum + p.price * p.stock_quantity,
          0
        );
        stats.averagePrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
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
    if (!tenant?.tenantId) {
      this.logError('No tenant context available', new Error('Unauthorized'));
      throw new Error('Unauthorized');
    }

    await getSupabaseClient().auth.updateUser({
      data: {
        tenant_id: tenant.tenantId,
        role: tenant.role,
        user_id: tenant.userId,
      },
    });

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
      sku: dbProduct.sku,
      price: dbProduct.price || 0,
      cost: dbProduct.cost,
      currency: dbProduct.currency || 'USD',
      stock_quantity: dbProduct.stock_quantity || 0,
      reorder_level: dbProduct.reorder_level,
      status: (dbProduct.status || 'active') as Product['status'],
      image_url: dbProduct.image_url || '',
      specifications: dbProduct.specifications,
      tags: dbProduct.tags || [],
      tenant_id: dbProduct.tenant_id,
      created_at: dbProduct.created_at,
      updated_at: dbProduct.updated_at,
      // Product hierarchy fields
      parent_id: dbProduct.parent_id,
      is_variant: dbProduct.is_variant,
      variant_group_id: dbProduct.variant_group_id,
    };
  }
}

// Export singleton instance
export const supabaseProductService = new SupabaseProductService();
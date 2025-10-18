/**
 * Supabase Product Service
 * Handles product catalog, categories, specifications
 * Extends BaseSupabaseService for common database operations
 */

import { BaseSupabaseService } from './baseService';
import { getSupabaseClient } from './client';

export interface Product {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  sku: string;
  price: number;
  cost?: number;
  currency: string;
  stock_quantity: number;
  reorder_level?: number;
  status: 'active' | 'inactive' | 'discontinued';
  image_url?: string;
  specifications?: Record<string, any>;
  tags?: string[];
  tenant_id: string;
  created_at: string;
  updated_at: string;
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

      let query = getSupabaseClient()
        .from('products')
        .select(
          `*,
          category:product_categories(*)`
        );

      // Apply filters
      if (filters?.tenantId) {
        query = query.eq('tenant_id', filters.tenantId);
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

      const { data: created, error } = await getSupabaseClient()
        .from('products')
        .insert([
          {
            name: data.name,
            description: data.description,
            category_id: data.category_id,
            sku: data.sku,
            price: data.price || 0,
            cost: data.cost,
            currency: data.currency || 'USD',
            stock_quantity: data.stock_quantity || 0,
            reorder_level: data.reorder_level,
            status: data.status || 'active',
            image_url: data.image_url,
            specifications: data.specifications,
            tags: data.tags,
            tenant_id: data.tenant_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
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

      const { data, error } = await getSupabaseClient()
        .from('products')
        .update({
          name: updates.name,
          description: updates.description,
          category_id: updates.category_id,
          sku: updates.sku,
          price: updates.price,
          cost: updates.cost,
          currency: updates.currency,
          stock_quantity: updates.stock_quantity,
          reorder_level: updates.reorder_level,
          status: updates.status,
          image_url: updates.image_url,
          specifications: updates.specifications,
          tags: updates.tags,
          updated_at: new Date().toISOString(),
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
    };
  }
}

// Export singleton instance
export const supabaseProductService = new SupabaseProductService();
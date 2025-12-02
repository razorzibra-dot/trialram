/**
 * Product Service
 * Business logic for product master data management
 */

import { BaseService } from '@/modules/core/services/BaseService';
import { PaginatedResponse } from '@/modules/core/types';
import { Product, ProductFormData, ProductFilters } from '@/types/masters';
import { productService as factoryProductService } from '@/services/serviceFactory';
import { referenceDataLoader } from '@/services/serviceFactory';

export interface ProductStats {
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  activeProducts: number;
  inactiveProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
  averagePrice: number;
}

/**
 * Product Service Interface
 * All product operations must implement this interface
 */
export interface IProductService {
  getProducts(filters?: ProductFilters): Promise<PaginatedResponse<Product>>;
  getProduct(id: string): Promise<Product>;
  createProduct(data: ProductFormData): Promise<Product>;
  updateProduct(id: string, data: Partial<ProductFormData>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  updateProductStatus(id: string, status: string): Promise<Product>;
  updateProductStock(id: string, quantity: number): Promise<Product>;
  bulkUpdateProducts(ids: string[], updates: Partial<ProductFormData>): Promise<Product[]>;
  bulkDeleteProducts(ids: string[]): Promise<void>;
  getProductStats(): Promise<ProductStats>;
  searchProducts(query: string): Promise<Product[]>;
  getProductStatuses(): Promise<string[]>;
  getProductCategories(): Promise<string[]>;
  getProductTypes(): Promise<string[]>;
  getLowStockProducts(): Promise<Product[]>;
  getOutOfStockProducts(): Promise<Product[]>;
  exportProducts(format?: 'csv' | 'json'): Promise<string>;
  importProducts(csv: string): Promise<{ success: number; errors: string[] }>;
}

export class ProductService extends BaseService implements IProductService {
  /**
   * Get products with filtering and pagination
   * @param {ProductFilters} filters - Filter options (search, category, status, price range)
   * @returns {Promise<PaginatedResponse<Product>>} Paginated list of products
   * @example
   * const response = await productService.getProducts({ category: 'Software', status: 'active' });
   * console.log(response.data); // Array of products
   * console.log(response.total); // Total count
   */
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    try {
      console.log('[ProductService] ⚡ getProducts called with filters:', filters);
      console.log('[ProductService] Factory service instance:', factoryProductService);
      console.log('[ProductService] Factory service getProducts method:', typeof factoryProductService.getProducts);
      
      // Delegate to factory service (which routes to Supabase or Mock based on API mode)
      console.log('[ProductService] Calling factory service getProducts...');
      let products;
      try {
        products = await factoryProductService.getProducts(filters);
        console.log('[ProductService] ✅ Factory service call completed');
      } catch (factoryError) {
        console.error('[ProductService] ❌ Factory service error:', factoryError);
        throw factoryError;
      }
      
      console.log('[ProductService] Factory service returned:', {
        isArray: Array.isArray(products),
        type: typeof products,
        hasData: products && typeof products === 'object' && 'data' in products,
        length: Array.isArray(products) ? products.length : (products && typeof products === 'object' && 'data' in products ? products.data?.length : 0)
      });
      
      // ✅ FIXED: Transform to paginated response format
      // SupabaseProductService returns Product[] (array)
      // MockProductService returns { data, total, page, limit, totalPages }
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      
      let allProducts: Product[] = [];
      let totalCount = 0;
      
      if (Array.isArray(products)) {
        // Supabase service returns array
        allProducts = products;
        totalCount = products.length;
        console.log('[ProductService] Products is array, length:', products.length);
      } else if (products && typeof products === 'object' && 'data' in products) {
        // Mock service returns paginated response
        allProducts = products.data || [];
        totalCount = products.total || 0;
        console.log('[ProductService] Products is paginated response, total:', totalCount, 'data length:', allProducts.length);
      } else {
        console.warn('[ProductService] Unexpected products format:', products);
      }
      
      // ✅ Apply pagination to array if needed (Supabase returns all, we paginate here)
      const startIndex = Array.isArray(products) ? (page - 1) * pageSize : 0;
      const endIndex = Array.isArray(products) ? startIndex + pageSize : allProducts.length;
      const paginatedData = Array.isArray(products) ? allProducts.slice(startIndex, endIndex) : allProducts;
      
      console.log('[ProductService] Products fetched', { 
        total: totalCount, 
        page, 
        pageSize, 
        returned: paginatedData.length,
        isArray: Array.isArray(products),
        sampleProduct: paginatedData[0] ? {
          id: paginatedData[0].id,
          name: paginatedData[0].name,
          sku: paginatedData[0].sku,
          price: paginatedData[0].price
        } : null
      });
      
      return {
        data: paginatedData,
        total: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      };
    } catch (error) {
      console.error('[ProductService] Error in getProducts:', error);
      // Graceful error handling for tenant context
      if (error instanceof Error && error.message.includes('Tenant context not initialized')) {
        console.warn('[ProductService] Tenant context not initialized, returning empty response');
        return {
          data: [],
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
        };
      }
      this.handleError('Failed to fetch products', error);
      // Return empty response instead of throwing to prevent UI crash
      return {
        data: [],
        total: 0,
        page: filters.page || 1,
        pageSize: filters.pageSize || 20,
        totalPages: 0,
      };
    }
  }

  /**
   * Get a single product by ID
   */
  async getProduct(id: string): Promise<Product> {
    try {
      const product = await factoryProductService.getProduct(id);
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    } catch (error) {
      this.handleError(`Failed to fetch product ${id}`, error);
      throw error;
    }
  }

  /**
   * Create a new product
   */
  async createProduct(data: ProductFormData): Promise<Product> {
    try {
      return await factoryProductService.createProduct(data);
    } catch (error) {
      this.handleError('Failed to create product', error);
      throw error;
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(id: string, data: Partial<ProductFormData>): Promise<Product> {
    try {
      return await factoryProductService.updateProduct(id, data);
    } catch (error) {
      this.handleError(`Failed to update product ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      await factoryProductService.deleteProduct(id);
    } catch (error) {
      this.handleError(`Failed to delete product ${id}`, error);
      throw error;
    }
  }

  /**
   * Update product status
   */
  async updateProductStatus(id: string, status: string): Promise<Product> {
    try {
      const typedStatus = status as 'active' | 'inactive' | 'discontinued';
      return await this.updateProduct(id, { status: typedStatus });
    } catch (error) {
      this.handleError(`Failed to update product status for ${id}`, error);
      throw error;
    }
  }

  /**
   * Update product stock
   */
  async updateProductStock(id: string, quantity: number): Promise<Product> {
    try {
      return await this.updateProduct(id, { stock_quantity: quantity });
    } catch (error) {
      this.handleError(`Failed to update product stock for ${id}`, error);
      throw error;
    }
  }

  /**
   * Bulk update products
   */
  async bulkUpdateProducts(ids: string[], updates: Partial<ProductFormData>): Promise<Product[]> {
    try {
      const promises = ids.map(id => this.updateProduct(id, updates));
      return await Promise.all(promises);
    } catch (error) {
      this.handleError('Failed to bulk update products', error);
      throw error;
    }
  }

  /**
   * Bulk delete products
   */
  async bulkDeleteProducts(ids: string[]): Promise<void> {
    try {
      const promises = ids.map(id => this.deleteProduct(id));
      await Promise.all(promises);
    } catch (error) {
      this.handleError('Failed to bulk delete products', error);
      throw error;
    }
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<ProductStats> {
    try {
      // ✅ Get ALL products for stats calculation (no pagination limit)
      // Use a very large pageSize to get all products, or fetch without pagination
      const response = await this.getProducts({ page: 1, pageSize: 10000 });
      const products = response.data || [];

      console.log('[ProductService] Calculating stats', { 
        productsCount: products.length, 
        totalFromResponse: response.total,
        sampleProduct: products[0]
      });

      const stats: ProductStats = {
        total: response.total || products.length, // Use response.total for accurate count
        byCategory: {},
        byStatus: {},
        byType: {},
        activeProducts: 0,
        inactiveProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalValue: 0,
        averagePrice: 0,
      };

      // Calculate statistics
      products.forEach(product => {
        // ✅ FIXED: Use categoryName if available, otherwise use category_id or 'Other'
        // Category stats - use categoryName if populated, otherwise use category_id or 'Uncategorized'
        const category = product.categoryName || (product.category_id ? `Category-${product.category_id.substring(0, 8)}` : 'Uncategorized');
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

        // Status stats
        const status = product.status || 'active';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

        // Type stats
        const type = product.type || 'Product';
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        // Status counts
        if (status === 'active') stats.activeProducts++;
        else if (status === 'inactive') stats.inactiveProducts++;

        // Stock analysis
        const stockQuantity = product.stock_quantity || 0;
        const reorderLevel = product.reorder_level || 0;
        const minStockLevel = product.min_stock_level || 0;
        
        if (stockQuantity === 0) {
          stats.outOfStockProducts++;
        } else if (stockQuantity <= reorderLevel || stockQuantity <= minStockLevel) {
          stats.lowStockProducts++;
        }

        // Value calculations
        const price = product.price || 0;
        const quantity = product.stock_quantity || 0; // Use 0 instead of 1 for accurate inventory value
        stats.totalValue += price * quantity;
      });

      // Calculate average price
      stats.averagePrice = products.length > 0 ? 
        products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length : 0;

      return stats;
    } catch (error) {
      this.handleError('Failed to fetch product statistics', error);
      throw error;
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: string): Promise<Product[]> {
    try {
      const response = await this.getProducts({ search: query });
      return response.data;
    } catch (error) {
      this.handleError('Failed to search products', error);
      throw error;
    }
  }

  /**
   * Get product statuses from database
   * ✅ DYNAMIC - Loaded from reference_data table
   */
  async getProductStatuses(): Promise<string[]> {
    try {
      const statuses = await referenceDataLoader.loadReferenceData('product_status');
      return statuses.map(s => s.label);
    } catch (error) {
      this.handleError('Failed to fetch product statuses', error);
      return ['active', 'inactive', 'discontinued'];
    }
  }

  /**
   * Get product categories from database
   * ✅ DYNAMIC - Loaded from product_categories table
   */
  async getProductCategories(): Promise<string[]> {
    try {
      const categories = await referenceDataLoader.loadCategories();
      return categories.map(c => c.name);
    } catch (error) {
      this.handleError('Failed to fetch product categories', error);
      return [];
    }
  }

  /**
   * Get product types from database
   * ✅ DYNAMIC - Loaded from reference_data table
   */
  async getProductTypes(): Promise<string[]> {
    try {
      const types = await referenceDataLoader.loadReferenceData('product_type');
      return types.map(t => t.label);
    } catch (error) {
      this.handleError('Failed to fetch product types', error);
      return ['Product', 'Service', 'Digital', 'Subscription', 'Bundle'];
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(): Promise<Product[]> {
    try {
      // Get low stock products from factory service
      const lowStockProducts = await factoryProductService.getLowStockProducts('');
      return lowStockProducts || [];
    } catch (error) {
      // Graceful fallback if service doesn't support it
      try {
        const response = await this.getProducts({ pageSize: 1000 });
        return response.data.filter(product => {
          const stockQuantity = product.stock_quantity || 0;
          const reorderLevel = product.reorder_level || 0;
          return stockQuantity <= reorderLevel && stockQuantity > 0;
        });
      } catch (fallbackError) {
        this.handleError('Failed to fetch low stock products', error);
        throw error;
      }
    }
  }

  /**
   * Get out of stock products
   */
  async getOutOfStockProducts(): Promise<Product[]> {
    try {
      const response = await this.getProducts({ pageSize: 1000 });
      return response.data.filter(product => (product.stock_quantity || 0) === 0);
    } catch (error) {
      this.handleError('Failed to fetch out of stock products', error);
      throw error;
    }
  }

  /**
   * Export products
   */
  async exportProducts(format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      const response = await this.getProducts({ pageSize: 10000 });
      const products = response.data;

      if (format === 'json') {
        return JSON.stringify(products, null, 2);
      }

      // CSV format
      const headers = ['ID', 'Name', 'SKU', 'Category', 'Type', 'Price', 'Stock', 'Status'];
      const rows = products.map(product => [
        product.id,
        product.name,
        product.sku || '',
        product.category || '',
        product.type || '',
        product.price || 0,
        product.stock_quantity || 0,
        product.status || ''
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\r\n');

      return csv;
    } catch (error) {
      this.handleError('Failed to export products', error);
      throw error;
    }
  }

  /**
   * Import products from CSV
   */
  async importProducts(csv: string): Promise<{ success: number; errors: string[] }> {
    try {
      const lines = csv.split('\r\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const errors: string[] = [];
      let success = 0;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        try {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
          const productData: Record<string, string | undefined> = {};

          headers.forEach((header, index) => {
            productData[header.toLowerCase().replace(' ', '_')] = values[index];
          });

          await this.createProduct(productData);
          success++;
        } catch (error) {
          errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { success, errors };
    } catch (error) {
      this.handleError('Failed to import products', error);
      throw error;
    }
  }
}

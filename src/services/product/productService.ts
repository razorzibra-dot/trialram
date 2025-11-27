import { Product, ProductFormData } from '@/types/masters';
import { authService } from '../serviceFactory';

class ProductService {
  private baseUrl = '/api/products';

  // Mock data for demonstration
  // ✅ NORMALIZED: Removed denormalized fields (category, supplier_name, is_active)
  private mockProducts: Product[] = [
    {
      id: '1',
      name: 'Industrial Motor Assembly',
      sku: 'IMA-001',
      type: 'Hardware',
      description: 'High-performance industrial motor assembly for manufacturing equipment',
      category_id: 'cat_1', // ✅ NORMALIZED: category_id instead of category string
      price: 1500,
      currency: 'USD',
      cost_price: 1000,
      stock_quantity: 25,
      min_stock_level: 5,
      max_stock_level: 100,
      unit: 'piece',
      weight: 15.5,
      dimensions: '30x20x15 cm',
      supplier_id: '1', // ✅ NORMALIZED: No supplier_name field
      status: 'active', // ✅ NORMALIZED: Removed is_active (use status only)
      warranty_period: 12,
      service_contract_available: true,
      tags: ['industrial', 'motor', 'assembly'],
      tenant_id: 'tenant_1',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T14:30:00Z',
      // Product hierarchy fields
      parent_id: null,
      is_variant: false,
      variant_group_id: null
    },
    {
      id: '2',
      name: 'Conveyor Belt Component',
      sku: 'CBC-002',
      type: 'Hardware',
      description: 'Durable conveyor belt component for automated production lines',
      category_id: 'cat_2',
      price: 800,
      currency: 'USD',
      cost_price: 500,
      stock_quantity: 50,
      min_stock_level: 10,
      max_stock_level: 200,
      unit: 'piece',
      weight: 8.2,
      dimensions: '25x15x10 cm',
      supplier_id: '2',
      status: 'active',
      warranty_period: 6,
      service_contract_available: true,
      tags: ['conveyor', 'belt', 'component'],
      tenant_id: 'tenant_1',
      created_at: '2024-01-16T09:00:00Z',
      updated_at: '2024-01-22T11:15:00Z',
      // Product hierarchy fields
      parent_id: null,
      is_variant: false,
      variant_group_id: null
    },
    {
      id: '3',
      name: 'Control System Module',
      sku: 'CSM-003',
      type: 'Software',
      description: 'Advanced control system module with programmable logic controller',
      category_id: 'cat_3',
      price: 2000,
      currency: 'USD',
      cost_price: 1300,
      stock_quantity: 15,
      min_stock_level: 3,
      max_stock_level: 50,
      unit: 'piece',
      weight: 5.8,
      dimensions: '20x15x8 cm',
      supplier_id: '3',
      status: 'active',
      warranty_period: 24,
      service_contract_available: true,
      tags: ['control', 'system', 'module', 'plc'],
      tenant_id: 'tenant_1',
      created_at: '2024-01-18T13:00:00Z',
      updated_at: '2024-01-25T16:45:00Z',
      // Product hierarchy fields
      parent_id: null,
      is_variant: false,
      variant_group_id: null
    },
    // Add some hierarchical products for demonstration
    {
      id: '4',
      name: 'Industrial Motor Assembly - 5HP',
      sku: 'IMA-001-5HP',
      type: 'Hardware',
      description: '5HP variant of industrial motor assembly',
      category_id: 'cat_1',
      price: 1600,
      currency: 'USD',
      cost_price: 1100,
      stock_quantity: 10,
      min_stock_level: 2,
      max_stock_level: 50,
      unit: 'piece',
      weight: 16.0,
      dimensions: '32x22x16 cm',
      supplier_id: '1',
      status: 'active',
      warranty_period: 12,
      service_contract_available: true,
      tags: ['industrial', 'motor', 'assembly', '5hp'],
      tenant_id: 'tenant_1',
      created_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-01-25T14:30:00Z',
      // Product hierarchy: variant of product 1
      parent_id: '1',
      is_variant: true,
      variant_group_id: 'motor-assembly-group'
    },
    {
      id: '5',
      name: 'Industrial Motor Assembly - 10HP',
      sku: 'IMA-001-10HP',
      type: 'Hardware',
      description: '10HP variant of industrial motor assembly',
      category_id: 'cat_1',
      price: 2200,
      currency: 'USD',
      cost_price: 1500,
      stock_quantity: 8,
      min_stock_level: 1,
      max_stock_level: 30,
      unit: 'piece',
      weight: 18.5,
      dimensions: '35x25x18 cm',
      supplier_id: '1',
      status: 'active',
      warranty_period: 12,
      service_contract_available: true,
      tags: ['industrial', 'motor', 'assembly', '10hp'],
      tenant_id: 'tenant_1',
      created_at: '2024-01-22T10:00:00Z',
      updated_at: '2024-01-26T14:30:00Z',
      // Product hierarchy: variant of product 1
      parent_id: '1',
      is_variant: true,
      variant_group_id: 'motor-assembly-group'
    }
  ];

  async getProducts(page: number = 1, limit: number = 10, filters?: {
    category?: string;
    status?: string;
    search?: string;
    type?: string;
  }, tenantId?: string): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;
    
    if (!finalTenantId) throw new Error('Unauthorized');

    let products = this.mockProducts.filter(p => p.tenant_id === finalTenantId);

    // Apply filters
    if (filters) {
      // ✅ NORMALIZED: Changed from filters.category (string) to category_id (FK)
      // Note: filters.category should now be category_id when called from components
      if (filters.category) {
        products = products.filter(p => p.category_id === filters.category);
      }
      if (filters.status) {
        products = products.filter(p => p.status === filters.status);
      }
      if (filters.type) {
        products = products.filter(p => p.type === filters.type);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search) ||
          (p.description && p.description.toLowerCase().includes(search))
        );
      }
    }

    // Sort products
    products = products.sort((a, b) => a.name.localeCompare(b.name));

    // Pagination
    const total = products.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const data = products.slice(startIndex, endIndex);

    return {
      data,
      total,
      page,
      limit,
      totalPages
    };
  }

  async getProduct(id: string, tenantId?: string): Promise<Product> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;
    
    if (!finalTenantId) throw new Error('Unauthorized');

    const product = this.mockProducts.find(p => 
      p.id === id && p.tenant_id === finalTenantId
    );

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async createProduct(data: ProductFormData, tenantId?: string): Promise<Product> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;
    
    if (!finalTenantId) throw new Error('Unauthorized');

    // Check if SKU already exists
    const existingSku = this.mockProducts.find(p => 
      p.sku === data.sku && p.tenant_id === finalTenantId
    );
    if (existingSku) {
      throw new Error('SKU already exists');
    }

    // ✅ NORMALIZED: Use category_id, supplier_id (not denormalized strings)
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      name: data.name,
      sku: data.sku,
      type: data.type,
      category_id: data.category_id, // ✅ NORMALIZED: Use category_id FK
      description: data.description || '',
      price: data.price,
      currency: data.currency || 'USD',
      cost_price: data.cost_price || data.price * 0.7, // Default cost as 70% of price
      // Advanced pricing
      pricing_tiers: data.pricing_tiers || [],
      discount_rules: data.discount_rules || [],
      stock_quantity: data.stock_quantity || 0,
      min_stock_level: data.min_stock_level || 5,
      max_stock_level: data.max_stock_level || 100,
      unit: data.unit || 'piece',
      weight: 0,
      dimensions: '',
      supplier_id: data.supplier_id, // ✅ NORMALIZED: No supplier_name
      status: data.status || 'active',
      warranty_period: data.warranty_period || 0,
      service_contract_available: data.service_contract_available || false,
      tags: [],
      tenant_id: finalTenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Product hierarchy fields
      parent_id: data.parent_id || null,
      is_variant: data.is_variant || false,
      variant_group_id: data.variant_group_id || null
    };

    this.mockProducts.push(newProduct);
    return newProduct;
  }

  async updateProduct(id: string, data: Partial<ProductFormData>, tenantId?: string): Promise<Product> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;
    
    if (!finalTenantId) throw new Error('Unauthorized');

    const index = this.mockProducts.findIndex(p => 
      p.id === id && p.tenant_id === finalTenantId
    );

    if (index === -1) {
      throw new Error('Product not found');
    }

    // Check if SKU already exists (excluding current product)
    const existingSku = this.mockProducts.find(p => 
      p.sku === data.sku && p.tenant_id === finalTenantId && p.id !== id
    );
    if (existingSku) {
      throw new Error('SKU already exists');
    }

    // ✅ NORMALIZED: Use category_id, supplier_id (not denormalized strings)
    const updatedProduct: Product = {
      ...this.mockProducts[index],
      ...(data.name && { name: data.name }),
      ...(data.sku && { sku: data.sku }),
      ...(data.type && { type: data.type }),
      ...(data.category_id && { category_id: data.category_id }), // ✅ NORMALIZED
      ...(data.description && { description: data.description }),
      ...(data.price && { price: data.price }),
      ...(data.currency && { currency: data.currency }),
      // Advanced pricing
      ...(data.pricing_tiers !== undefined && { pricing_tiers: data.pricing_tiers }),
      ...(data.discount_rules !== undefined && { discount_rules: data.discount_rules }),
      ...(data.supplier_id !== undefined && { supplier_id: data.supplier_id }), // ✅ NORMALIZED
      ...(data.status && { status: data.status }),
      ...(data.warranty_period && { warranty_period: data.warranty_period }),
      ...(data.service_contract_available !== undefined && { service_contract_available: data.service_contract_available }),
      // Product hierarchy fields
      ...(data.parent_id !== undefined && { parent_id: data.parent_id }),
      ...(data.is_variant !== undefined && { is_variant: data.is_variant }),
      ...(data.variant_group_id !== undefined && { variant_group_id: data.variant_group_id }),
      updated_at: new Date().toISOString()
    };

    this.mockProducts[index] = updatedProduct;
    return updatedProduct;
  }

  async deleteProduct(id: string, tenantId?: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;
    
    if (!finalTenantId) throw new Error('Unauthorized');

    const index = this.mockProducts.findIndex(p => 
      p.id === id && p.tenant_id === finalTenantId
    );

    if (index === -1) {
      throw new Error('Product not found');
    }

    this.mockProducts.splice(index, 1);
  }

  async exportProducts(filters?: {
    category?: string;
    status?: string;
    search?: string;
  }, tenantId?: string): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    let products = this.mockProducts.filter(p => p.tenant_id === finalTenantId);

    // Apply filters
    if (filters) {
      if (filters.category) {
        products = products.filter(p => p.category_id === filters.category);
      }
      if (filters.status) {
        products = products.filter(p => p.status === filters.status);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        products = products.filter(p =>
          p.name.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search) ||
          (p.description && p.description.toLowerCase().includes(search))
        );
      }
    }

    // Generate CSV content
    const headers = [
      'ID', 'Name', 'SKU', 'Category ID', 'Description', 'Price', 'Status', 'Created At'
    ];

    const csvContent = [
      headers.join(','),
      ...products.map(product => [
        product.id,
        `"${product.name}"`,
        product.sku,
        product.category_id || '',
        `"${product.description || ''}"`,
        product.price,
        product.status,
        product.created_at
      ].join(','))
    ].join('\r\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  // Product Hierarchy Methods
  async getProductChildren(parentId: string, tenantId?: string): Promise<Product[]> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    return this.mockProducts.filter(p =>
      p.tenant_id === finalTenantId &&
      p.parent_id === parentId
    );
  }

  async getProductParent(childId: string, tenantId?: string): Promise<Product | null> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    const child = this.mockProducts.find(p =>
      p.id === childId && p.tenant_id === finalTenantId
    );

    if (!child || !child.parent_id) return null;

    return this.mockProducts.find(p =>
      p.id === child.parent_id && p.tenant_id === finalTenantId
    ) || null;
  }

  async getProductHierarchy(productId: string, tenantId?: string): Promise<{
    product: Product;
    parent?: Product;
    children: Product[];
    siblings: Product[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    const product = this.mockProducts.find(p =>
      p.id === productId && p.tenant_id === finalTenantId
    );

    if (!product) throw new Error('Product not found');

    const [parent, children, siblings] = await Promise.all([
      product.parent_id ? this.getProductParent(productId, finalTenantId) : Promise.resolve(null),
      this.getProductChildren(productId, finalTenantId),
      product.parent_id ? this.getProductChildren(product.parent_id, finalTenantId) : Promise.resolve([])
    ]);

    return {
      product,
      parent: parent || undefined,
      children,
      siblings: siblings.filter(s => s.id !== productId)
    };
  }

  async getProductVariants(baseProductId: string, tenantId?: string): Promise<Product[]> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    // Get the base product to find its variant_group_id
    const baseProduct = this.mockProducts.find(p =>
      p.id === baseProductId && p.tenant_id === finalTenantId
    );

    if (!baseProduct) throw new Error('Base product not found');

    const variantGroupId = baseProduct.variant_group_id;
    if (!variantGroupId) return [];

    return this.mockProducts.filter(p =>
      p.tenant_id === finalTenantId &&
      p.variant_group_id === variantGroupId &&
      p.is_variant === true
    );
  }

  async getRootProducts(tenantId?: string): Promise<Product[]> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    return this.mockProducts.filter(p =>
      p.tenant_id === finalTenantId &&
      (p.parent_id === null || p.parent_id === undefined)
    );
  }
}

export const productService = new ProductService();
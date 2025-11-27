import { ProductCategory, ProductCategoryFormData } from '@/types/masters';
import { authService } from '../serviceFactory';

// Mock data for product categories
const mockProductCategories: ProductCategory[] = [
  {
    id: 'cat-1',
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    parent_id: null,
    level: 1,
    sort_order: 1,
    is_active: true,
    image_url: null,
    icon: 'device-desktop',
    color: '#1890ff',
    tenant_id: 'tenant-1',
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'cat-2',
    name: 'Smartphones',
    description: 'Mobile phones and accessories',
    parent_id: 'cat-1',
    level: 2,
    sort_order: 1,
    is_active: true,
    image_url: null,
    icon: 'device-mobile',
    color: '#52c41a',
    tenant_id: 'tenant-1',
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'cat-3',
    name: 'Laptops',
    description: 'Portable computers',
    parent_id: 'cat-1',
    level: 2,
    sort_order: 2,
    is_active: true,
    image_url: null,
    icon: 'device-laptop',
    color: '#faad14',
    tenant_id: 'tenant-1',
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'cat-4',
    name: 'Clothing',
    description: 'Apparel and fashion items',
    parent_id: null,
    level: 1,
    sort_order: 2,
    is_active: true,
    image_url: null,
    icon: 'shirt',
    color: '#f5222d',
    tenant_id: 'tenant-1',
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

class ProductCategoryService {
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

    let filteredCategories = mockProductCategories.filter(cat => cat.tenant_id === finalTenantId);

    // Apply filters
    if (filters) {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredCategories = filteredCategories.filter(cat =>
          cat.name.toLowerCase().includes(searchLower) ||
          cat.description?.toLowerCase().includes(searchLower)
        );
      }
      if (filters.parent_id !== undefined) {
        if (filters.parent_id === null) {
          filteredCategories = filteredCategories.filter(cat => cat.parent_id === null);
        } else {
          filteredCategories = filteredCategories.filter(cat => cat.parent_id === filters.parent_id);
        }
      }
      if (filters.level !== undefined) {
        filteredCategories = filteredCategories.filter(cat => cat.level === filters.level);
      }
      if (filters.is_active !== undefined) {
        filteredCategories = filteredCategories.filter(cat => cat.is_active === filters.is_active);
      }
    }

    // Sort by sort_order, then by name
    filteredCategories.sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.name.localeCompare(b.name);
    });

    const total = filteredCategories.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredCategories.slice(startIndex, endIndex);

    return {
      data: paginatedData,
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

    const category = mockProductCategories.find(cat => cat.id === id && cat.tenant_id === finalTenantId);
    if (!category) throw new Error('Category not found');

    return category;
  }

  async createCategory(data: ProductCategoryFormData, tenantId?: string): Promise<ProductCategory> {
    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    // Check if name already exists for this tenant
    const existing = mockProductCategories.find(cat =>
      cat.name === data.name && cat.tenant_id === finalTenantId
    );
    if (existing) {
      throw new Error('Category name already exists');
    }

    const newCategory: ProductCategory = {
      id: `cat-${Date.now()}`,
      name: data.name,
      description: data.description || '',
      parent_id: data.parent_id || null,
      level: data.parent_id ? 2 : 1, // Simple level calculation
      sort_order: data.sort_order || 0,
      is_active: data.is_active !== undefined ? data.is_active : true,
      image_url: data.image_url || null,
      icon: data.icon || null,
      color: data.color || null,
      tenant_id: finalTenantId,
      created_by: user?.id || 'user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockProductCategories.push(newCategory);
    return newCategory;
  }

  async updateCategory(id: string, data: Partial<ProductCategoryFormData>, tenantId?: string): Promise<ProductCategory> {
    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    const categoryIndex = mockProductCategories.findIndex(cat => cat.id === id && cat.tenant_id === finalTenantId);
    if (categoryIndex === -1) throw new Error('Category not found');

    // Check if name already exists (excluding current category)
    if (data.name) {
      const existing = mockProductCategories.find(cat =>
        cat.name === data.name && cat.tenant_id === finalTenantId && cat.id !== id
      );
      if (existing) {
        throw new Error('Category name already exists');
      }
    }

    const category = mockProductCategories[categoryIndex];
    const updatedCategory = {
      ...category,
      ...data,
      updated_at: new Date().toISOString()
    };

    mockProductCategories[categoryIndex] = updatedCategory;
    return updatedCategory;
  }

  async deleteCategory(id: string, tenantId?: string): Promise<void> {
    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    // Check if category has children
    const hasChildren = mockProductCategories.some(cat =>
      cat.parent_id === id && cat.tenant_id === finalTenantId
    );
    if (hasChildren) {
      throw new Error('Cannot delete category with subcategories');
    }

    const categoryIndex = mockProductCategories.findIndex(cat => cat.id === id && cat.tenant_id === finalTenantId);
    if (categoryIndex === -1) throw new Error('Category not found');

    mockProductCategories.splice(categoryIndex, 1);
  }

  async getCategoryHierarchy(tenantId?: string): Promise<ProductCategory[]> {
    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    const categories = mockProductCategories.filter(cat => cat.tenant_id === finalTenantId);

    // Sort by level, then sort_order, then name
    return categories.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.name.localeCompare(b.name);
    });
  }

  async getRootCategories(tenantId?: string): Promise<ProductCategory[]> {
    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    return mockProductCategories.filter(cat =>
      cat.tenant_id === finalTenantId &&
      cat.parent_id === null &&
      cat.is_active
    ).sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.name.localeCompare(b.name);
    });
  }

  async getChildCategories(parentId: string, tenantId?: string): Promise<ProductCategory[]> {
    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    return mockProductCategories.filter(cat =>
      cat.tenant_id === finalTenantId &&
      cat.parent_id === parentId &&
      cat.is_active
    ).sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.name.localeCompare(b.name);
    });
  }
}

export const productCategoryService = new ProductCategoryService();
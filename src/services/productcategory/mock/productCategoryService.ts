import { ProductCategory, ProductCategoryFormData } from '@/types/masters';
import { authService } from '../../serviceFactory';

class ProductCategoryService {
  private baseUrl = '/api/product-categories';

  // Mock data for demonstration
  private mockCategories: ProductCategory[] = [
    {
      id: 'cat_1',
      name: 'Electronics',
      description: 'Electronic devices and components',
      parent_id: null,
      level: 1,
      path: 'Electronics',
      sort_order: 1,
      is_active: true,
      image_url: null,
      icon: 'device-desktop',
      color: '#3B82F6',
      tenant_id: 'tenant_1',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T14:30:00Z',
      created_by: 'user_1'
    },
    {
      id: 'cat_2',
      name: 'Hardware',
      description: 'Physical hardware components',
      parent_id: null,
      level: 1,
      path: 'Hardware',
      sort_order: 2,
      is_active: true,
      image_url: null,
      icon: 'cog',
      color: '#10B981',
      tenant_id: 'tenant_1',
      created_at: '2024-01-16T09:00:00Z',
      updated_at: '2024-01-22T11:15:00Z',
      created_by: 'user_1'
    },
    {
      id: 'cat_3',
      name: 'Software',
      description: 'Software products and licenses',
      parent_id: null,
      level: 1,
      path: 'Software',
      sort_order: 3,
      is_active: true,
      image_url: null,
      icon: 'code',
      color: '#8B5CF6',
      tenant_id: 'tenant_1',
      created_at: '2024-01-18T13:00:00Z',
      updated_at: '2024-01-25T16:45:00Z',
      created_by: 'user_1'
    },
    {
      id: 'cat_4',
      name: 'Services',
      description: 'Service offerings',
      parent_id: null,
      level: 1,
      path: 'Services',
      sort_order: 4,
      is_active: true,
      image_url: null,
      icon: 'wrench',
      color: '#F59E0B',
      tenant_id: 'tenant_1',
      created_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-01-25T14:30:00Z',
      created_by: 'user_1'
    },
    {
      id: 'cat_5',
      name: 'Consumables',
      description: 'Consumable items',
      parent_id: null,
      level: 1,
      path: 'Consumables',
      sort_order: 5,
      is_active: true,
      image_url: null,
      icon: 'package',
      color: '#EF4444',
      tenant_id: 'tenant_1',
      created_at: '2024-01-22T10:00:00Z',
      updated_at: '2024-01-26T14:30:00Z',
      created_by: 'user_1'
    },
    // Subcategories
    {
      id: 'cat_6',
      name: 'Computers',
      description: 'Computer systems and accessories',
      parent_id: 'cat_1',
      level: 2,
      path: 'Electronics/Computers',
      sort_order: 1,
      is_active: true,
      image_url: null,
      icon: 'device-desktop',
      color: '#1E40AF',
      tenant_id: 'tenant_1',
      created_at: '2024-01-25T10:00:00Z',
      updated_at: '2024-01-26T14:30:00Z',
      created_by: 'user_1'
    },
    {
      id: 'cat_7',
      name: 'Mobile Devices',
      description: 'Smartphones and tablets',
      parent_id: 'cat_1',
      level: 2,
      path: 'Electronics/Mobile Devices',
      sort_order: 2,
      is_active: true,
      image_url: null,
      icon: 'device-mobile',
      color: '#059669',
      tenant_id: 'tenant_1',
      created_at: '2024-01-26T10:00:00Z',
      updated_at: '2024-01-27T14:30:00Z',
      created_by: 'user_1'
    },
    {
      id: 'cat_8',
      name: 'Networking',
      description: 'Network equipment and accessories',
      parent_id: 'cat_1',
      level: 2,
      path: 'Electronics/Networking',
      sort_order: 3,
      is_active: true,
      image_url: null,
      icon: 'wifi',
      color: '#7C3AED',
      tenant_id: 'tenant_1',
      created_at: '2024-01-27T10:00:00Z',
      updated_at: '2024-01-28T14:30:00Z',
      created_by: 'user_1'
    }
  ];

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
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    let categories = this.mockCategories.filter(c => c.tenant_id === finalTenantId);

    // Apply filters
    if (filters) {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        categories = categories.filter(c =>
          c.name.toLowerCase().includes(search) ||
          (c.description && c.description.toLowerCase().includes(search))
        );
      }
      if (filters.parent_id !== undefined) {
        categories = categories.filter(c => c.parent_id === filters.parent_id);
      }
      if (filters.level !== undefined) {
        categories = categories.filter(c => c.level === filters.level);
      }
      if (filters.is_active !== undefined) {
        categories = categories.filter(c => c.is_active === filters.is_active);
      }
    }

    // Sort by sort_order, then by name
    categories = categories.sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.name.localeCompare(b.name);
    });

    // Pagination
    const total = categories.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const data = categories.slice(startIndex, endIndex);

    return {
      data,
      total,
      page,
      limit,
      totalPages
    };
  }

  async getCategory(id: string, tenantId?: string): Promise<ProductCategory> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    const category = this.mockCategories.find(c =>
      c.id === id && c.tenant_id === finalTenantId
    );

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }

  async createCategory(data: ProductCategoryFormData, tenantId?: string): Promise<ProductCategory> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    // Check if name already exists for this tenant
    const existingCategory = this.mockCategories.find(c =>
      c.name === data.name && c.tenant_id === finalTenantId
    );
    if (existingCategory) {
      throw new Error('Category name already exists');
    }

    const newCategory: ProductCategory = {
      id: `cat_${Date.now()}`,
      name: data.name,
      description: data.description || '',
      parent_id: data.parent_id || null,
      level: 1, // Will be calculated by trigger in real implementation
      path: data.name, // Will be calculated by trigger in real implementation
      sort_order: data.sort_order || 0,
      is_active: data.is_active !== undefined ? data.is_active : true,
      image_url: data.image_url || null,
      icon: data.icon || null,
      color: data.color || null,
      tenant_id: finalTenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: user?.id
    };

    this.mockCategories.push(newCategory);
    return newCategory;
  }

  async updateCategory(id: string, data: Partial<ProductCategoryFormData>, tenantId?: string): Promise<ProductCategory> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    const index = this.mockCategories.findIndex(c =>
      c.id === id && c.tenant_id === finalTenantId
    );

    if (index === -1) {
      throw new Error('Category not found');
    }

    // Check if name already exists (excluding current category)
    if (data.name) {
      const existingCategory = this.mockCategories.find(c =>
        c.name === data.name && c.tenant_id === finalTenantId && c.id !== id
      );
      if (existingCategory) {
        throw new Error('Category name already exists');
      }
    }

    const updatedCategory: ProductCategory = {
      ...this.mockCategories[index],
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.parent_id !== undefined && { parent_id: data.parent_id }),
      ...(data.sort_order !== undefined && { sort_order: data.sort_order }),
      ...(data.is_active !== undefined && { is_active: data.is_active }),
      ...(data.image_url !== undefined && { image_url: data.image_url }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.color !== undefined && { color: data.color }),
      updated_at: new Date().toISOString()
    };

    this.mockCategories[index] = updatedCategory;
    return updatedCategory;
  }

  async deleteCategory(id: string, tenantId?: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    const index = this.mockCategories.findIndex(c =>
      c.id === id && c.tenant_id === finalTenantId
    );

    if (index === -1) {
      throw new Error('Category not found');
    }

    // Check if category has children
    const hasChildren = this.mockCategories.some(c =>
      c.parent_id === id && c.tenant_id === finalTenantId
    );

    if (hasChildren) {
      throw new Error('Cannot delete category with subcategories');
    }

    this.mockCategories.splice(index, 1);
  }

  async getCategoryHierarchy(tenantId?: string): Promise<ProductCategory[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    const categories = this.mockCategories.filter(c => c.tenant_id === finalTenantId);

    // Sort by level, then by sort_order, then by name
    return categories.sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.name.localeCompare(b.name);
    });
  }

  async getRootCategories(tenantId?: string): Promise<ProductCategory[]> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    return this.mockCategories.filter(c =>
      c.tenant_id === finalTenantId &&
      (c.parent_id === null || c.parent_id === undefined) &&
      c.is_active
    ).sort((a, b) => a.sort_order - b.sort_order);
  }

  async getChildCategories(parentId: string, tenantId?: string): Promise<ProductCategory[]> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const user = authService.getCurrentUser();
    const finalTenantId = tenantId || user?.tenant_id;

    if (!finalTenantId) throw new Error('Unauthorized');

    return this.mockCategories.filter(c =>
      c.tenant_id === finalTenantId &&
      c.parent_id === parentId &&
      c.is_active
    ).sort((a, b) => a.sort_order - b.sort_order);
  }
}

export const productCategoryService = new ProductCategoryService();
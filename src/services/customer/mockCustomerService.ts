/**
 * Mock Customer Service
 * Matches new camelCase types and GenericCrudService pattern
 * Used for development and testing
 */

import { Customer, CustomerTag } from '@/types/crm';

/**
 * MockCustomerService
 * Implements same interface as real CustomerService
 * All data in camelCase to match TypeScript types
 */
export class MockCustomerService {
  // Mock tags data
  private mockTags: CustomerTag[] = [
    { id: '1', name: 'VIP', color: '#f59e0b' },
    { id: '2', name: 'High Value', color: '#10b981' },
    { id: '3', name: 'New Client', color: '#3b82f6' },
    { id: '4', name: 'At Risk', color: '#ef4444' },
    { id: '5', name: 'Potential Upsell', color: '#8b5cf6' },
    { id: '6', name: 'Long Term', color: '#06b6d4' },
    { id: '7', name: 'Referral Source', color: '#84cc16' },
    { id: '8', name: 'Support Priority', color: '#f97316' }
  ];

  // Mock customers - all in camelCase
  private mockCustomers: Customer[] = [
    {
      id: '1',
      companyName: 'TechCorp Solutions',
      contactName: 'Alice Johnson',
      email: 'alice@techcorp.com',
      phone: '+1-555-0123',
      address: '123 Tech Street',
      city: 'San Francisco',
      country: 'USA',
      industry: 'Technology',
      size: 'enterprise' as any,
      status: 'active' as any,
      tags: [this.mockTags[0], this.mockTags[1]],
      notes: 'Key enterprise client',
      tenantId: 'tenant_1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z',
      assignedTo: 'user_2'
    },
    {
      id: '2',
      companyName: 'Global Manufacturing Inc',
      contactName: 'Bob Smith',
      email: 'bob@globalmanuf.com',
      phone: '+1-555-0456',
      address: '456 Industrial Ave',
      city: 'Detroit',
      country: 'USA',
      industry: 'Manufacturing',
      size: 'medium' as any,
      status: 'active' as any,
      tags: [this.mockTags[5]],
      notes: 'Reliable manufacturing partner',
      tenantId: 'tenant_1',
      createdAt: '2024-01-10T09:15:00Z',
      updatedAt: '2024-01-18T16:45:00Z',
      assignedTo: 'user_3'
    },
    {
      id: '3',
      companyName: 'StartupXYZ',
      contactName: 'Carol Davis',
      email: 'carol@startupxyz.com',
      phone: '+1-555-0789',
      address: '789 Innovation Blvd',
      city: 'Austin',
      country: 'USA',
      industry: 'Software',
      size: 'startup' as any,
      status: 'prospect' as any,
      tags: [this.mockTags[2], this.mockTags[4]],
      notes: 'Promising startup',
      tenantId: 'tenant_1',
      createdAt: '2024-01-05T11:30:00Z',
      updatedAt: '2024-01-19T13:20:00Z',
      assignedTo: 'user_1'
    },
    {
      id: '4',
      companyName: 'Retail Giants LLC',
      contactName: 'David Wilson',
      email: 'david@retailgiants.com',
      phone: '+1-555-0234',
      address: '321 Commerce Way',
      city: 'New York',
      country: 'USA',
      industry: 'Retail',
      size: 'enterprise' as any,
      status: 'active' as any,
      tags: [this.mockTags[0]],
      notes: 'Major retailer with national presence',
      tenantId: 'tenant_1',
      createdAt: '2023-12-01T08:00:00Z',
      updatedAt: '2024-01-20T10:15:00Z',
      assignedTo: 'user_2'
    }
  ];

  /**
   * Get all customers with optional filtering and pagination
   */
  async findMany(filters?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    industry?: string;
  }): Promise<{ data: Customer[]; total: number; page: number; pageSize: number }> {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const search = filters?.search?.toLowerCase();

    let results = this.mockCustomers;

    // Apply status filter
    if (filters?.status) {
      results = results.filter(c => c.status === filters.status);
    }

    // Apply industry filter
    if (filters?.industry) {
      results = results.filter(c => c.industry === filters.industry);
    }

    // Apply search filter
    if (search) {
      results = results.filter(c =>
        c.companyName.toLowerCase().includes(search) ||
        c.contactName.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search)
      );
    }

    // Apply pagination
    const total = results.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const data = results.slice(start, end);

    return { data, total, page, pageSize };
  }

  /**
   * Get single customer by ID
   */
  async findOne(id: string): Promise<Customer | null> {
    const customer = this.mockCustomers.find(c => c.id === id);
    return customer || null;
  }

  /**
   * Create new customer
   */
  async create(data: Partial<Customer>): Promise<Customer> {
    const newCustomer: Customer = {
      id: 'cust_' + Date.now(),
      companyName: data.companyName || '',
      contactName: data.contactName || '',
      status: data.status || 'prospect',
      tags: data.tags || [],
      tenantId: data.tenantId || 'tenant_1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };

    this.mockCustomers.push(newCustomer);
    return newCustomer;
  }

  /**
   * Update customer
   */
  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const index = this.mockCustomers.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error(`Customer ${id} not found`);
    }

    const customer = this.mockCustomers[index];
    const updated: Customer = {
      ...customer,
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.mockCustomers[index] = updated;
    return updated;
  }

  /**
   * Delete customer
   */
  async delete(id: string): Promise<void> {
    const index = this.mockCustomers.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error(`Customer ${id} not found`);
    }

    this.mockCustomers.splice(index, 1);
  }

  /**
   * Get all available tags
   */
  async getAllTags(): Promise<CustomerTag[]> {
    return [...this.mockTags];
  }

  /**
   * Create new tag
   */
  async createTag(name: string, color?: string): Promise<CustomerTag> {
    const tag: CustomerTag = {
      id: 'tag_' + Date.now(),
      name,
      color: color || '#3B82F6'
    };

    this.mockTags.push(tag);
    return tag;
  }

  /**
   * Delete tag
   */
  async deleteTag(tagId: string): Promise<void> {
    const index = this.mockTags.findIndex(t => t.id === tagId);
    if (index === -1) {
      throw new Error(`Tag ${tagId} not found`);
    }

    this.mockTags.splice(index, 1);
    // Remove tag from all customers
    this.mockCustomers.forEach(c => {
      c.tags = c.tags.filter(t => t.id !== tagId);
    });
  }

  /**
   * Get customer stats
   */
  async getCustomerStats(): Promise<{
    totalSalesAmount: number;
    totalOrders: number;
    averageOrderValue: number;
    lastPurchaseDate: string | null;
  }> {
    return {
      totalSalesAmount: 50000,
      totalOrders: 25,
      averageOrderValue: 2000,
      lastPurchaseDate: new Date().toISOString()
    };
  }
}

// Export singleton
export const mockCustomerService = new MockCustomerService();

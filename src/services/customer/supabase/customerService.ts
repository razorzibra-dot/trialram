/**
 * Customer Service
 * Layer 3: Business logic layer extending GenericCrudService
 * 
 * Provides customer-specific business logic on top of GenericCrudService:
 * - Tags management (customer_tag_mapping table)
 * - Stats aggregation
 * - Interaction history
 * - Lifecycle hooks for validation
 */

import { GenericCrudService } from '@/services/core/GenericCrudService';
import { Customer, CustomerTag } from '@/types/crm';
import { CustomerRepository, CustomerRow } from './CustomerRepository';
import { getSupabaseClient } from '@/services/supabase/client';
import { serviceFactory } from '@/services/serviceFactory';
import { QueryFilters } from '@/types/generic';

/**
 * Database row for customer_tag_mapping table
 */
interface CustomerTagMappingRow {
  customer_id: string;
  tag_id: string;
  created_at?: string;
}

/**
 * Database row for customer_tags table
 */
interface CustomerTagRow {
  id: string;
  name: string;
  color?: string;
  tenant_id: string;
  created_at: string;
}

/**
 * CustomerService
 * 
 * Extends GenericCrudService to provide customer-specific operations:
 * - CRUD operations via GenericRepository (inherited)
 * - Tags management (add, remove, get)
 * - Stats updates after mutations
 * - Interaction history
 */
export class CustomerService extends GenericCrudService<Customer, Partial<Customer>, Partial<Customer>, QueryFilters, CustomerRow> {
  private listInFlight: Map<string, Promise<{ data: Customer[]; total: number }>> = new Map();
  private listCache: Map<string, { data: { data: Customer[]; total: number }; timestamp: number }> = new Map();
  private detailInFlight: Map<string, Promise<Customer | null>> = new Map();
  private detailCache: Map<string, { data: Customer | null; timestamp: number }> = new Map();
  private cacheTtlMs = 60 * 1000; // 1 minute short-lived cache to avoid duplicate GETs

  constructor() {
    const repository = new CustomerRepository();
    super(repository);
  }

  /**
   * Lifecycle hook: Called before creating a customer
   * Validates business rules
   */
  protected async beforeCreate(data: Partial<Customer>): Promise<void> {
    // Validate required fields
    if (!data.companyName?.trim()) {
      throw new Error('Company name is required');
    }
    if (!data.contactName?.trim()) {
      throw new Error('Contact name is required');
    }
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }
  }

  /**
   * Lifecycle hook: Called after creating a customer
   * Note: Tags are already saved via the repository (tags field in database)
   * Clears cache to ensure fresh data on next load
   */
  protected async afterCreate(entity: Customer): Promise<void> {
    // Tags are already in the database via the create operation
    // Clear cache to avoid stale lists after create
    try {
      this.listCache.clear();
      this.listInFlight.clear();
      console.log('[CustomerService] Cache cleared after create');
    } catch {
      // Ignore cache clear errors
    }
  }

  /**
   * Lifecycle hook: Called before updating a customer
   * Validates business rules
   */
  protected async beforeUpdate(existing: Customer, data: Partial<Customer>): Promise<void> {
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }
  }

  /**
   * Lifecycle hook: Called after updating a customer
   * Note: Tags are already saved via the repository (tags field in database)
   * No additional tag processing needed here
   */
  protected async afterUpdate(entity: Customer): Promise<void> {
    // Tags are already in the database via the update operation
    // No additional processing needed
  }

  /**
   * Override update to avoid pre-fetching existing entity.
   * This reduces duplicate GETs during save flows while preserving validation.
   */
  async update(id: string, data: Partial<Customer>, _context?: any): Promise<Customer> {
    // Inline minimal validation (mirror beforeUpdate logic without requiring existing entity)
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // Perform update directly in repository (returns updated row via select())
    const updated = await this.repository.update(id, data);

    // Post-update hook
    await this.afterUpdate?.(updated);

    // Invalidate list caches to avoid stale lists after edit
    try {
      this.listCache.clear();
      this.listInFlight.clear();
      console.log('[CustomerService] Cache cleared after update');
    } catch {
      // Ignore cache clear errors
    }

    // Update detail cache to satisfy immediate reads without extra network calls
    try {
      this.detailCache.set(id, { data: updated, timestamp: Date.now() });
    } catch {
      // Ignore cache update errors
    }

    return updated;
  }

  /**
   * Override delete to clear cache after deletion
   */
  async delete(id: string, context?: any): Promise<void> {
    // Call parent delete method
    await super.delete(id, context);

    // Clear cache to avoid stale lists after delete
    try {
      this.listCache.clear();
      this.listInFlight.clear();
      this.detailCache.delete(id);
      this.detailInFlight.delete(id);
      console.log('[CustomerService] Cache cleared after delete');
    } catch {
      // Ignore cache clear errors
    }
  }

  /**
   * Override batchDelete to clear cache after batch deletion
   * Implements cache invalidation per Rule 3A/1A
   */
  async batchDelete(ids: string[], context?: any): Promise<import('@/services/core/GenericCrudService').BatchDeleteResult> {
    console.log('[CustomerService] Starting batch delete for', ids.length, 'customers');
    
    // Call parent batch delete method
    const result = await super.batchDelete(ids, context);
    
    // Clear ALL caches after batch delete (CRITICAL for fresh data)
    try {
      this.listCache.clear();
      this.listInFlight.clear();
      
      // Clear detail cache for all deleted IDs
      result.successIds.forEach(id => {
        this.detailCache.delete(id);
        this.detailInFlight.delete(id);
      });
      
      console.log('[CustomerService] Cache cleared after batch delete:', {
        successCount: result.successCount,
        failureCount: result.failureCount,
      });
    } catch (error) {
      console.error('[CustomerService] Error clearing cache after batch delete:', error);
    }
    
    return result;
  }

  /**
   * Override findOne to include tags
   */
  async findOne(id: string): Promise<Customer | null> {
    const cacheKey = id;
    const cached = this.detailCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.data;
    }

    const inFlight = this.detailInFlight.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const fetchPromise = (async () => {
      // Rely on repository mapping (customers.tags array column) to populate tags
      const customer = await this.repository.findById(id);
      this.detailCache.set(cacheKey, { data: customer, timestamp: Date.now() });
      return customer;
    })();

    this.detailInFlight.set(cacheKey, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      this.detailInFlight.delete(cacheKey);
    }
  }

  /**
   * Override findMany to include tags for each customer
   */
  async findMany(filters?: Record<string, any>): Promise<{ data: Customer[]; total: number }> {
    const cacheKey = JSON.stringify(filters || {});
    const cached = this.listCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.data;
    }

    const inFlight = this.listInFlight.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const fetchPromise = (async () => {
      // Call repository directly; tags come from customers.tags (string[]) mapped to CustomerTag
      const result = await this.repository.findMany(filters);
      this.listCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    })();

    this.listInFlight.set(cacheKey, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      this.listInFlight.delete(cacheKey);
    }
  }

  /**
   * Get tags for a specific customer
   */
  private async getCustomerTags(customerId: string): Promise<CustomerTag[]> {
    const authService = serviceFactory.getService('auth');
    const tenantId = typeof authService?.getCurrentTenant === 'function'
      ? authService.getCurrentTenant()?.id
      : undefined;

    // If tenantId is unavailable (e.g., mock auth), do not filter by tenant to avoid zero results
    const tenantFilter = tenantId ? { tenant_id: tenantId } : {};
    
    const { data, error } = await getSupabaseClient()
      .from('customer_tag_mapping')
      .select(`
        customer_tags:customer_tags!customer_tag_mapping_tag_id_fkey (
          id,
          name,
          color
        )
      `)
      .eq('customer_id', customerId);

    if (error) throw error;

    return (data || [])
      .map(row => row.customer_tags)
      .filter(Boolean)
      .flatMap((tag) => (Array.isArray(tag) ? tag : [tag]))
      .map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color
      }));
  }

  /**
   * Get tags for multiple customers (batch operation)
   */
  private async getCustomerTagsMap(customerIds: string[]): Promise<Map<string, CustomerTag[]>> {
    const { data, error } = await getSupabaseClient()
      .from('customer_tag_mapping')
      .select(`
        customer_id,
        customer_tags:customer_tags!customer_tag_mapping_tag_id_fkey (
          id,
          name,
          color
        )
      `)
      .in('customer_id', customerIds);

    if (error) throw error;

    const tagsMap = new Map<string, CustomerTag[]>();
    
    (data || []).forEach(row => {
      const customerId = row.customer_id;
      const tag = row.customer_tags;
      
      if (!tagsMap.has(customerId)) {
        tagsMap.set(customerId, []);
      }
      
      if (tag) {
        const tagEntries = Array.isArray(tag) ? tag : [tag];
        tagEntries.forEach((t) => {
          tagsMap.get(customerId)!.push({
            id: t.id,
            name: t.name,
            color: t.color
          });
        });
      }
    });

    return tagsMap;
  }

  /**
   * Update customer tags (replace all)
   */
  private async updateCustomerTags(customerId: string, tagIds: string[]): Promise<void> {
    const authService = serviceFactory.getService('auth');
    const tenantId = authService.getCurrentTenant()?.id;

    // Delete existing mappings
    await getSupabaseClient()
      .from('customer_tag_mapping')
      .delete()
      .eq('customer_id', customerId);

    // Insert new mappings
    if (tagIds.length > 0) {
      const mappings = tagIds.map(tagId => ({
        customer_id: customerId,
        tag_id: tagId
      }));

      const { error } = await getSupabaseClient()
        .from('customer_tag_mapping')
        .insert(mappings);

      if (error) throw error;
    }
  }

  /**
   * Get all available tags for tenant
   */
  async getAllTags(): Promise<CustomerTag[]> {
    const authService = serviceFactory.getService('auth');
    const tenantId = authService.getCurrentTenant()?.id;

    const { data, error } = await getSupabaseClient()
      .from('customer_tags')
      .select('id, name, color')
      .eq('tenant_id', tenantId)
      .order('name');

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      color: row.color
    }));
  }

  /**
   * Create a new tag
   */
  async createTag(name: string, color?: string): Promise<CustomerTag> {
    const authService = serviceFactory.getService('auth');
    const tenantId = authService.getCurrentTenant()?.id;
    const userId = authService.getCurrentUser()?.id;

    const { data, error } = await getSupabaseClient()
      .from('customer_tags')
      .insert({
        name,
        color: color || '#3B82F6',
        tenant_id: tenantId,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      color: data.color
    };
  }

  /**
   * Delete a tag
   */
  async deleteTag(tagId: string): Promise<void> {
    // First delete all mappings
    await getSupabaseClient()
      .from('customer_tag_mapping')
      .delete()
      .eq('tag_id', tagId);

    // Then delete the tag
    const { error } = await getSupabaseClient()
      .from('customer_tags')
      .delete()
      .eq('id', tagId);

    if (error) throw error;
  }

  /**
   * Get customer statistics
   * 
   * These fields were removed from the customers table and moved to the customer_summary
   * materialized view. This view aggregates data from sales/deals to compute these metrics.
   */
  async getCustomerStats(customerId?: string): Promise<{
    // Per-customer sales stats (when customerId is provided)
    totalSalesAmount?: number;
    totalOrders?: number;
    averageOrderValue?: number;
    lastPurchaseDate?: string | null;
    // Aggregate customer counts (when no customerId is provided)
    totalCustomers?: number;
    activeCustomers?: number;
    inactiveCustomers?: number;
    prospectCustomers?: number;
    byIndustry?: Record<string, number>;
    bySize?: Record<string, number>;
    byStatus?: Record<string, number>;
    recentlyAdded?: number;
  }> {
    const authService = serviceFactory.getService('auth');
    if (customerId) {
      const { data, error } = await getSupabaseClient()
        .from('customer_summary')
        .select('total_sales_amount, total_orders, average_order_value, last_purchase_date')
        .eq('id', customerId)
        .single();

      if (error) {
        // If customer not in summary view yet (no sales), return zeros
        if (error.code === 'PGRST116') {
          return {
            totalSalesAmount: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            lastPurchaseDate: null
          };
        }
        throw error;
      }

      return {
        totalSalesAmount: data.total_sales_amount || 0,
        totalOrders: data.total_orders || 0,
        averageOrderValue: data.average_order_value || 0,
        lastPurchaseDate: data.last_purchase_date || null
      };
    }

    // Aggregate stats across all customers for the tenant
    const { data, error } = await getSupabaseClient()
      .from('customers')
      .select('status, industry, size, created_at', { count: 'exact' });

    if (error) throw error;

    const customers = data || [];
    const stats = {
      totalCustomers: customers.length,
      activeCustomers: customers.filter((c: any) => c.status === 'active').length,
      inactiveCustomers: customers.filter((c: any) => c.status === 'inactive').length,
      prospectCustomers: customers.filter((c: any) => c.status === 'prospect').length,
      byIndustry: {} as Record<string, number>,
      bySize: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      recentlyAdded: 0,
    };

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    customers.forEach((c: any) => {
      const industry = (c.industry || 'unknown').toLowerCase();
      const size = (c.size || 'unknown').toLowerCase();
      const status = (c.status || 'unknown').toLowerCase();

      stats.byIndustry[industry] = (stats.byIndustry[industry] || 0) + 1;
      stats.bySize[size] = (stats.bySize[size] || 0) + 1;
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      if (c.created_at && new Date(c.created_at) >= thirtyDaysAgo) {
        stats.recentlyAdded += 1;
      }
    });

    return stats;
  }

  /**
   * Email validation helper
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export const customerService = new CustomerService();

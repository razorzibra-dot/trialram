/**
 * Supabase Navigation Service
 * Handles navigation items management via Supabase PostgreSQL
 * ✅ Database-driven: All navigation items are fetched from database
 */

import { supabase } from '@/services/supabase/client';
import { NavigationItem } from '@/types/navigation';
import { authService } from '../../serviceFactory';
import { multiTenantService } from '../../multitenant/supabase/multiTenantService';

class SupabaseNavigationService {
  private tableName = 'navigation_items';

  /**
   * Get all navigation items for current user's tenant
   * ✅ Database-driven: Fetches from navigation_items table
   * ✅ Tenant-aware: Filters by tenant_id or system items
   */
  async getNavigationItems(): Promise<NavigationItem[]> {
    try {
      const currentUser = authService.getCurrentUser();
      const currentTenantId = await multiTenantService.getCurrentTenantId();

      console.log(`[NavigationService] 🔄 Fetching navigation items for user: ${currentUser?.email}, tenant: ${currentTenantId}`);

      // Build query with tenant filtering
      // ✅ Database-driven: Fetch items for current tenant or system items
      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      // Apply tenant filter: show items for current tenant OR system items (available to all)
      if (currentTenantId) {
        // Use PostgREST OR syntax: (tenant_id = X OR is_system_item = true)
        query = query.or(`tenant_id.eq.${currentTenantId},is_system_item.eq.true`);
        console.log(`[NavigationService] 🎯 Query filter: tenant_id = ${currentTenantId} OR is_system_item = true`);
      } else {
        // If no tenant context, only show system items
        query = query.eq('is_system_item', true);
        console.log(`[NavigationService] 🎯 Query filter: is_system_item = true (no tenant context)`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[NavigationService] ❌ Error fetching navigation items:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.warn('[NavigationService] ⚠️ No navigation items found');
        return [];
      }

      console.log(`[NavigationService] 📦 Raw database results: ${data.length} items`);
      data.forEach(item => {
        console.log(`[NavigationService] 📋 DB Item: "${item.label}" (key: ${item.key}, permission: ${item.permission_name}, is_system: ${item.is_system_item})`);
      });

      // ✅ Map database rows to NavigationItem interface (snake_case → camelCase)
      const mappedItems: NavigationItem[] = data.map(row => ({
        id: row.id,
        key: row.key,
        label: row.label,
        parentId: row.parent_id,
        permissionName: row.permission_name,
        isSection: row.is_section || false,
        sortOrder: row.sort_order || 0,
        icon: row.icon,
        routePath: row.route_path,
        tenantId: row.tenant_id,
        isSystemItem: row.is_system_item || false,
        isActive: row.is_active !== false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
      }));

      console.log(`[NavigationService] ✅ Mapped ${mappedItems.length} navigation items`);
      return mappedItems;
    } catch (error) {
      console.error('[NavigationService] ❌ Error in getNavigationItems:', error);
      return [];
    }
  }

  /**
   * Get a single navigation item by key
   */
  async getNavigationItemByKey(key: string): Promise<NavigationItem | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('key', key)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('[Navigation] Error fetching navigation item:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Map to NavigationItem
      return {
        id: data.id,
        key: data.key,
        label: data.label,
        parentId: data.parent_id,
        permissionName: data.permission_name,
        isSection: data.is_section || false,
        sortOrder: data.sort_order || 0,
        icon: data.icon,
        routePath: data.route_path,
        tenantId: data.tenant_id,
        isSystemItem: data.is_system_item || false,
        isActive: data.is_active !== false,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
        updatedBy: data.updated_by,
      };
    } catch (error) {
      console.error('[Navigation] Error in getNavigationItemByKey:', error);
      return null;
    }
  }

  /**
   * Create a new navigation item
   * ✅ Requires navigation:manage or crm:system:config:manage permission
   */
  async createNavigationItem(item: Partial<NavigationItem>): Promise<NavigationItem> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const currentTenantId = await multiTenantService.getCurrentTenantId();

      const insertData: any = {
        key: item.key,
        label: item.label,
        parent_id: item.parentId || null,
        permission_name: item.permissionName || null,
        is_section: item.isSection || false,
        sort_order: item.sortOrder || 0,
        icon: item.icon || null,
        route_path: item.routePath || null,
        tenant_id: item.tenantId || currentTenantId,
        is_system_item: item.isSystemItem || false,
        is_active: item.isActive !== false,
        created_by: currentUser.id,
        updated_by: currentUser.id,
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[Navigation] Error creating navigation item:', error);
        throw new Error(`Failed to create navigation item: ${error.message}`);
      }

      // Map response
      return {
        id: data.id,
        key: data.key,
        label: data.label,
        parentId: data.parent_id,
        permissionName: data.permission_name,
        isSection: data.is_section || false,
        sortOrder: data.sort_order || 0,
        icon: data.icon,
        routePath: data.route_path,
        tenantId: data.tenant_id,
        isSystemItem: data.is_system_item || false,
        isActive: data.is_active !== false,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
        updatedBy: data.updated_by,
      };
    } catch (error) {
      console.error('[Navigation] Error in createNavigationItem:', error);
      throw error;
    }
  }

  /**
   * Update a navigation item
   * ✅ Requires navigation:manage or crm:system:config:manage permission
   */
  async updateNavigationItem(id: string, updates: Partial<NavigationItem>): Promise<NavigationItem> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const updateData: any = {};
      if (updates.key !== undefined) updateData.key = updates.key;
      if (updates.label !== undefined) updateData.label = updates.label;
      if (updates.parentId !== undefined) updateData.parent_id = updates.parentId;
      if (updates.permissionName !== undefined) updateData.permission_name = updates.permissionName;
      if (updates.isSection !== undefined) updateData.is_section = updates.isSection;
      if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.routePath !== undefined) updateData.route_path = updates.routePath;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      updateData.updated_by = currentUser.id;

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[Navigation] Error updating navigation item:', error);
        throw new Error(`Failed to update navigation item: ${error.message}`);
      }

      // Map response
      return {
        id: data.id,
        key: data.key,
        label: data.label,
        parentId: data.parent_id,
        permissionName: data.permission_name,
        isSection: data.is_section || false,
        sortOrder: data.sort_order || 0,
        icon: data.icon,
        routePath: data.route_path,
        tenantId: data.tenant_id,
        isSystemItem: data.is_system_item || false,
        isActive: data.is_active !== false,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
        updatedBy: data.updated_by,
      };
    } catch (error) {
      console.error('[Navigation] Error in updateNavigationItem:', error);
      throw error;
    }
  }

  /**
   * Delete a navigation item (soft delete by setting is_active=false)
   * ✅ Requires navigation:manage or crm:system:config:manage permission
   */
  async deleteNavigationItem(id: string): Promise<void> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from(this.tableName)
        .update({ is_active: false, updated_by: currentUser.id })
        .eq('id', id);

      if (error) {
        console.error('[Navigation] Error deleting navigation item:', error);
        throw new Error(`Failed to delete navigation item: ${error.message}`);
      }
    } catch (error) {
      console.error('[Navigation] Error in deleteNavigationItem:', error);
      throw error;
    }
  }
}

export const supabaseNavigationService = new SupabaseNavigationService();


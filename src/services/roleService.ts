/**
 * Enterprise Role Service
 * Database-driven, tenant-aware role management
 * 
 * ✅ Loads role configurations from database (tenant-specific)
 * ✅ Caches role data for performance
 * ✅ Provides dynamic role queries for Supabase
 * ✅ Generic implementation for all modules
 * 
 * Usage:
 *   const roleService = new RoleService();
 *   const assignableRoles = await roleService.getAssignableRoles('leads');
 *   const roleFilter = roleService.buildRoleFilter(assignableRoles);
 *   query = query.or(roleFilter); // Dynamic role filtering
 */

import { supabase } from '@/services/supabase/client';

export interface TenantRole {
  id: string;
  tenantId: string;
  roleName: string;
  roleKey: string;
  displayName: string;
  description?: string;
  roleLevel: number;
  isActive: boolean;
  isSystemRole: boolean;
}

export interface RolePermission {
  id: string;
  tenantId: string;
  roleId: string;
  permissionToken: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  constraints?: Record<string, any>;
}

export interface AssignableRole {
  roleId: string;
  roleKey: string;
  roleName: string;
  displayName: string;
  roleLevel: number;
  assignmentPriority: number;
}

/**
 * Role Service
 * Centralized service for role management
 */
export class RoleService {
  private roleCache: Map<string, TenantRole[]> = new Map();
  private assignableRoleCache: Map<string, Map<string, AssignableRole[]>> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamps: Map<string, number> = new Map();

  /**
   * Clear cache for a tenant (call after role updates)
   */
  clearCache(tenantId?: string): void {
    if (tenantId) {
      this.roleCache.delete(tenantId);
      this.assignableRoleCache.delete(tenantId);
      this.cacheTimestamps.delete(`roles_${tenantId}`);
      this.cacheTimestamps.delete(`assignable_${tenantId}`);
    } else {
      this.roleCache.clear();
      this.assignableRoleCache.clear();
      this.cacheTimestamps.clear();
    }
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;
    return Date.now() - timestamp < this.cacheTTL;
  }

  /**
   * Get all roles for a tenant
   */
  async getTenantRoles(tenantId: string, forceRefresh = false): Promise<TenantRole[]> {
    const cacheKey = `roles_${tenantId}`;
    
    // Check cache
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      const cached = this.roleCache.get(tenantId);
      if (cached) {
        console.log('[RoleService] Returning cached roles for tenant:', tenantId);
        return cached;
      }
    }

    console.log('[RoleService] Fetching roles from database for tenant:', tenantId);

    // Fetch from database
    const { data, error } = await supabase
      .from('tenant_roles')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('role_level', { ascending: false });

    if (error) {
      console.error('[RoleService] Error fetching tenant roles:', error);
      throw new Error(`Failed to fetch tenant roles: ${error.message}`);
    }

    const roles: TenantRole[] = (data || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      roleName: row.role_name,
      roleKey: row.role_key,
      displayName: row.display_name,
      description: row.description,
      roleLevel: row.role_level,
      isActive: row.is_active,
      isSystemRole: row.is_system_role
    }));

    // Cache the result
    this.roleCache.set(tenantId, roles);
    this.cacheTimestamps.set(cacheKey, Date.now());

    return roles;
  }

  /**
   * Get assignable roles for a specific module
   * Uses database function for optimal performance
   */
  async getAssignableRoles(
    tenantId: string, 
    moduleName: string, 
    forceRefresh = false
  ): Promise<AssignableRole[]> {
    const cacheKey = `assignable_${tenantId}_${moduleName}`;
    
    // Check cache
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      const tenantCache = this.assignableRoleCache.get(tenantId);
      const cached = tenantCache?.get(moduleName);
      if (cached) {
        console.log('[RoleService] Returning cached assignable roles:', { tenantId, moduleName });
        return cached;
      }
    }

    console.log('[RoleService] Fetching assignable roles from database:', { tenantId, moduleName });

    // Call database function
    const { data, error } = await supabase.rpc('get_assignable_roles', {
      p_tenant_id: tenantId,
      p_module_name: moduleName
    });

    if (error) {
      console.error('[RoleService] Error fetching assignable roles:', error);
      throw new Error(`Failed to fetch assignable roles: ${error.message}`);
    }

    const roles: AssignableRole[] = (data || []).map(row => ({
      roleId: row.role_id,
      roleKey: row.role_key,
      roleName: row.role_name,
      displayName: row.display_name,
      roleLevel: row.role_level,
      assignmentPriority: 50 // Default priority
    }));

    // Cache the result
    if (!this.assignableRoleCache.has(tenantId)) {
      this.assignableRoleCache.set(tenantId, new Map());
    }
    this.assignableRoleCache.get(tenantId)!.set(moduleName, roles);
    this.cacheTimestamps.set(cacheKey, Date.now());

    return roles;
  }

  /**
   * Get users with assignable roles for a module
   * Replacement for hardcoded role queries
   */
  async getAssignableUsers(
    tenantId: string,
    moduleName: string
  ): Promise<Array<{ id: string; name: string; email: string; role: string }>> {
    // Get assignable role keys for this module
    const assignableRoles = await this.getAssignableRoles(tenantId, moduleName);
    const roleKeys = assignableRoles.map(r => r.roleKey);

    if (roleKeys.length === 0) {
      console.warn('[RoleService] No assignable roles configured for module:', moduleName);
      return [];
    }

    console.log('[RoleService] Fetching users with roles:', roleKeys);

    // Query users with those roles
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .in('role', roleKeys);

    if (error) {
      console.error('[RoleService] Error fetching assignable users:', error);
      throw new Error(`Failed to fetch assignable users: ${error.message}`);
    }

    return (data || []).map(user => ({
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      email: user.email,
      role: user.role
    }));
  }

  /**
   * Build Supabase OR filter for role-based queries
   * Replaces: .or('role.eq.agent,role.eq.manager,role.eq.admin')
   * With: Dynamic role list from database
   */
  buildRoleFilter(roles: AssignableRole[]): string {
    if (roles.length === 0) {
      console.warn('[RoleService] No roles provided for filter, returning impossible condition');
      return 'role.eq.__NONE__'; // Impossible condition
    }

    const filter = roles.map(role => `role.eq.${role.roleKey}`).join(',');
    console.log('[RoleService] Built role filter:', filter);
    return filter;
  }

  /**
   * Get role by key for a tenant
   */
  async getRoleByKey(tenantId: string, roleKey: string): Promise<TenantRole | null> {
    const roles = await this.getTenantRoles(tenantId);
    return roles.find(r => r.roleKey === roleKey) || null;
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role_id', roleId);

    if (error) {
      console.error('[RoleService] Error fetching role permissions:', error);
      throw new Error(`Failed to fetch role permissions: ${error.message}`);
    }

    return (data || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      roleId: row.role_id,
      permissionToken: row.permission_token,
      canCreate: row.can_create,
      canRead: row.can_read,
      canUpdate: row.can_update,
      canDelete: row.can_delete,
      constraints: row.constraints
    }));
  }

  /**
   * Check if a role has a specific permission
   */
  async hasPermission(
    roleId: string,
    permissionToken: string,
    action: 'create' | 'read' | 'update' | 'delete'
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('role_has_permission', {
      p_role_id: roleId,
      p_permission_token: permissionToken,
      p_action: action
    });

    if (error) {
      console.error('[RoleService] Error checking permission:', error);
      return false;
    }

    return data === true;
  }

  /**
   * Create a new tenant role (admin only)
   */
  async createTenantRole(
    tenantId: string,
    roleData: {
      roleName: string;
      roleKey: string;
      displayName: string;
      description?: string;
      roleLevel: number;
    }
  ): Promise<TenantRole> {
    const { data, error } = await supabase
      .from('tenant_roles')
      .insert([{
        tenant_id: tenantId,
        role_name: roleData.roleName,
        role_key: roleData.roleKey,
        display_name: roleData.displayName,
        description: roleData.description,
        role_level: roleData.roleLevel,
        is_active: true,
        is_system_role: false
      }])
      .select()
      .single();

    if (error) {
      console.error('[RoleService] Error creating tenant role:', error);
      throw new Error(`Failed to create tenant role: ${error.message}`);
    }

    // Clear cache
    this.clearCache(tenantId);

    return {
      id: data.id,
      tenantId: data.tenant_id,
      roleName: data.role_name,
      roleKey: data.role_key,
      displayName: data.display_name,
      description: data.description,
      roleLevel: data.role_level,
      isActive: data.is_active,
      isSystemRole: data.is_system_role
    };
  }

  /**
   * Update a tenant role (admin only)
   */
  async updateTenantRole(
    roleId: string,
    updates: Partial<{
      roleName: string;
      displayName: string;
      description: string;
      roleLevel: number;
      isActive: boolean;
    }>
  ): Promise<TenantRole> {
    const updateData: Record<string, any> = {};
    if (updates.roleName !== undefined) updateData.role_name = updates.roleName;
    if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.roleLevel !== undefined) updateData.role_level = updates.roleLevel;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('tenant_roles')
      .update(updateData)
      .eq('id', roleId)
      .select()
      .single();

    if (error) {
      console.error('[RoleService] Error updating tenant role:', error);
      throw new Error(`Failed to update tenant role: ${error.message}`);
    }

    // Clear cache
    this.clearCache(data.tenant_id);

    return {
      id: data.id,
      tenantId: data.tenant_id,
      roleName: data.role_name,
      roleKey: data.role_key,
      displayName: data.display_name,
      description: data.description,
      roleLevel: data.role_level,
      isActive: data.is_active,
      isSystemRole: data.is_system_role
    };
  }
}

// Singleton instance
export const roleService = new RoleService();

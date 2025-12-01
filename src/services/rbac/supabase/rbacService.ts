/**
 * Supabase RBAC (Role-Based Access Control) Service
 * Handles role and permission management via Supabase PostgreSQL
 */

import { supabase } from '@/services/supabase/client';
import { Permission, Role, UserRole, AuditLog, RoleTemplate, PermissionMatrix } from '@/types/rbac';
import { User } from '@/types/auth';
import { authService } from '../../serviceFactory';
import {
  isSuperAdmin,
  isPlatformRole,
  isPlatformPermission,
  filterRolesByTenant,
  filterPermissionsByTenant,
  canAccessRole,
  canModifyRole,
  getRoleQueryFilters,
  getPermissionQueryFilters,
} from '@/utils/tenantIsolation';
import { invalidateRoleCache } from '@/utils/roleMapping';

class SupabaseRBACService {
  private permissionsTable = 'permissions';
  private rolesTable = 'roles';
  private userRolesTable = 'user_roles';
  private roleTemplatesTable = 'role_templates';
  private auditLogsTable = 'audit_logs';

  /**
   * Get all permissions
   * ⚠️ TENANT ISOLATION: Uses systematic tenant isolation utilities
   * Platform-level permissions are filtered using database flags (category='system' or is_system_permission=true)
   */
  async getPermissions(): Promise<Permission[]> {
    const currentUser = authService.getCurrentUser();

    // Fetch all permissions first
    const { data, error } = await supabase
      .from(this.permissionsTable)
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('[RBAC] Error fetching permissions:', error);
      // ❌ REMOVED: No hardcoded fallback permissions - application must handle database unavailability
      // The system should be 100% database-driven with no hardcoded fallbacks
      throw new Error(`Failed to fetch permissions from database: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // Use systematic tenant isolation utility to filter permissions
    const { filterFn } = getPermissionQueryFilters(currentUser);
    
    // Log before filtering
    const categoryCounts = data.reduce((acc, perm) => {
      const cat = perm.category || 'unknown';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const systemPermCount = data.filter(p => p.is_system_permission === true).length;
    
    console.log('[RBAC] Permissions before filtering:', {
      total: data.length,
      byCategory: categoryCounts,
      systemPermissions: systemPermCount,
      userRole: currentUser?.role,
      userIsSuperAdmin: currentUser?.isSuperAdmin
    });
    
    const filteredData = filterFn(data);
    
    // Log after filtering
    const filteredCategoryCounts = filteredData.reduce((acc, perm) => {
      const cat = perm.category || 'unknown';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('[RBAC] Permissions after filtering:', {
      total: filteredData.length,
      byCategory: filteredCategoryCounts,
      filteredOut: data.length - filteredData.length
    });

    // ✅ Map database rows to Permission interface (snake_case → camelCase)
    const mappedPermissions: Permission[] = filteredData.map(perm => ({
      id: perm.id,
      name: perm.name,
      description: perm.description || '',
      category: perm.category as 'core' | 'module' | 'administrative' | 'system',
      resource: perm.resource || '',
      action: perm.action || '',
      is_system_permission: perm.is_system_permission || false
    }));

    console.log('[RBAC] Permissions fetched:', mappedPermissions.length, 'of', data.length, 'for user role:', currentUser?.role);
    return mappedPermissions;
  }

  /**
   * Get all roles, optionally filtered by tenant
   * ⚠️ TENANT ISOLATION: Uses systematic tenant isolation utilities
   * Platform-level roles are filtered using database flags (is_system_role=true AND tenant_id IS NULL)
   * 
   * ✅ FIXED: Now fetches permissions from role_permissions table and maps them correctly
   */
  async getRoles(tenantId?: string): Promise<Role[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return [];

    const userTenantId = tenantId || currentUser.tenantId;
    const userIsSuperAdmin = isSuperAdmin(currentUser);

    let query = supabase
      .from(this.rolesTable)
      .select('*')
      .order('name', { ascending: true });

    // Get systematic query filters based on user's tenant isolation level
    const { filterFn, excludePlatformRoles, additionalFilter } = getRoleQueryFilters(currentUser);

    // Apply tenant filtering
    if (!userIsSuperAdmin && userTenantId) {
      console.log('[RBAC] Tenant admin - filtering roles by tenant_id and excluding platform roles:', userTenantId);
      // Filter by tenant_id and exclude platform roles (is_system_role=true with no tenant)
      query = query
        .eq('tenant_id', userTenantId)
        .or('is_system_role.eq.false,tenant_id.not.is.null');
    } else if (userIsSuperAdmin) {
      console.log('[RBAC] Super admin - fetching all roles including platform roles');
      // No filtering - super admins can see everything
    } else {
      console.warn('[RBAC] User has no tenant_id and is not super_admin, returning empty roles');
      return [];
    }

    const { data, error } = await query;

    if (error) {
      console.error('[RBAC] Error fetching roles:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Apply systematic filtering using utility functions
    const filteredData = filterRolesByTenant(data, currentUser);

    // ✅ FIX: Fetch permissions for each role from role_permissions table
    const roleIds = filteredData.map(role => role.id);
    
    if (roleIds.length === 0) {
      return [];
    }

    // Fetch all role-permission mappings
    const { data: rolePermissions, error: rolePermissionsError } = await supabase
      .from('role_permissions')
      .select('role_id, permission_id')
      .in('role_id', roleIds);

    if (rolePermissionsError) {
      console.error('[RBAC] Error fetching role permissions:', rolePermissionsError);
      // Continue without permissions - roles will have empty permissions array
    }

    // Map permissions to roles
    const permissionsByRole = new Map<string, string[]>();
    if (rolePermissions) {
      rolePermissions.forEach(rp => {
        const roleId = rp.role_id;
        const permissionId = rp.permission_id;
        if (!permissionsByRole.has(roleId)) {
          permissionsByRole.set(roleId, []);
        }
        permissionsByRole.get(roleId)!.push(permissionId);
      });
    }

    // Map database rows to Role interface (snake_case → camelCase)
    const mappedRoles: Role[] = filteredData.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description || '',
      tenant_id: role.tenant_id,
      permissions: permissionsByRole.get(role.id) || [], // ✅ Populate permissions array
      is_system_role: role.is_system_role || false,
      created_at: role.created_at,
      updated_at: role.updated_at
    }));

    console.log('[RBAC] Roles fetched:', mappedRoles.length, 'of', data.length, 'for user role:', currentUser.role);
    console.log('[RBAC] Permissions mapped for', permissionsByRole.size, 'roles');
    
    return mappedRoles;
  }

  /**
   * Create a new role
   * ⚠️ TENANT ISOLATION: Uses systematic tenant isolation utilities
   * Tenant admins cannot create platform-level roles (is_system_role=true with no tenant_id)
   */
  async createRole(roleData: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    // ⚠️ SECURITY: Use systematic validation to prevent tenant admins from creating platform roles
    if (!canModifyRole(roleData, currentUser)) {
      throw new Error('Access denied: Cannot create platform-level roles. Only super admins can create platform-level roles.');
    }

    // ⚠️ SECURITY: Ensure tenant admins can only create roles for their tenant
    const userIsSuperAdmin = isSuperAdmin(currentUser);
    if (!userIsSuperAdmin && currentUser.tenantId) {
      if (roleData.tenant_id && roleData.tenant_id !== currentUser.tenantId) {
        throw new Error('Access denied: Cannot create roles for other tenants.');
      }
      // Force tenant_id to current user's tenant
      roleData.tenant_id = currentUser.tenantId;
      // Ensure it's not marked as system role if tenant admin is creating it
      if (roleData.is_system_role === true && roleData.tenant_id) {
        // Allow system roles within tenant (like Administrator, Manager), but not platform roles
        // This is fine - system roles can exist within a tenant
      }
    }

    // ✅ FIX: Extract permissions from roleData (permissions are stored in role_permissions table, not roles table)
    const { permissions, ...roleDataWithoutPermissions } = roleData;
    
    const roleToInsert = {
      ...roleDataWithoutPermissions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(this.rolesTable)
      .insert(roleToInsert)
      .select()
      .single();

    if (error) {
      console.error('Error creating role:', error);
      throw new Error(`Failed to create role: ${error.message}`);
    }

    // ✅ FIX: Insert permissions into role_permissions table if provided
    if (permissions && permissions.length > 0) {
      const rolePermissions = permissions.map(permissionId => ({
        role_id: data.id,
        permission_id: permissionId,
        granted_by: currentUser.id,
        granted_at: new Date().toISOString()
      }));

      const { error: insertPermsError } = await supabase
        .from('role_permissions')
        .insert(rolePermissions);

      if (insertPermsError) {
        console.error('[RBAC] Error creating role permissions:', insertPermsError);
        // Rollback role creation
        await supabase.from(this.rolesTable).delete().eq('id', data.id);
        throw new Error(`Failed to create role permissions: ${insertPermsError.message}`);
      }
    }

    // Log the action
    await this.logAction('role_created', 'role', data.id, { role_name: data.name });

    // Invalidate role cache so new role is immediately available
    invalidateRoleCache();

    // ✅ FIX: Fetch the created role with permissions to return complete data
    const createdRole = await this.getRoles(roleDataWithoutPermissions.tenant_id).then(roles => roles.find(r => r.id === data.id));
    if (!createdRole) {
      throw new Error('Failed to fetch created role');
    }

    return createdRole;
  }

  /**
   * Update a role
   * ⚠️ TENANT ISOLATION: Uses systematic tenant isolation utilities
   * Tenant admins cannot modify platform-level roles (is_system_role=true with no tenant_id)
   */
  async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    // First, get the existing role to check permissions
    const { data: existingRole, error: fetchError } = await supabase
      .from(this.rolesTable)
      .select('id, name, description, tenant_id, is_system_role, created_at, updated_at')
      .eq('id', roleId)
      .single();

    if (fetchError || !existingRole) {
      throw new Error('Role not found');
    }

    // ⚠️ SECURITY: Use systematic validation to check if user can access this role
    if (!canAccessRole(existingRole as Role, currentUser)) {
      throw new Error('Access denied: Cannot modify this role. Only super admins can modify platform-level roles.');
    }

    // ⚠️ SECURITY: Use systematic validation to prevent creating platform roles
    const mergedRole = { ...existingRole, ...updates } as Partial<Role>;
    if (!canModifyRole(mergedRole, currentUser)) {
      throw new Error('Access denied: Cannot modify role to platform-level. Only super admins can create platform-level roles.');
    }

    // ⚠️ SECURITY: Prevent tenant admins from modifying roles from other tenants
    const userIsSuperAdmin = isSuperAdmin(currentUser);
    if (!userIsSuperAdmin && currentUser.tenantId && existingRole.tenant_id !== currentUser.tenantId) {
      throw new Error('Access denied: Cannot modify roles from other tenants.');
    }

    // ⚠️ SECURITY: Prevent changing tenant_id to another tenant
    if (!userIsSuperAdmin && updates.tenant_id && updates.tenant_id !== currentUser.tenantId) {
      throw new Error('Access denied: Cannot assign role to another tenant.');
    }

    // ✅ FIX: Extract permissions from updates (permissions are stored in role_permissions table, not roles table)
    const { permissions, ...roleUpdates } = updates;
    
    const updateData = {
      ...roleUpdates,
      updated_at: new Date().toISOString(),
    };

    // Remove permissions from updateData if it was included (it's not a column in roles table)
    delete (updateData as any).permissions;

    // Update role metadata (name, description, etc.) - permissions are handled separately
    // ✅ FIX: Use maybeSingle() to handle cases where RLS might block the select
    const { data, error } = await supabase
      .from(this.rolesTable)
      .update(updateData)
      .eq('id', roleId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[RBAC] Error updating role:', error);
      throw new Error(`Failed to update role: ${error.message}`);
    }

    // ✅ FIX: If no data returned, verify the role exists (might be RLS blocking select)
    if (!data) {
      // Verify role exists by fetching it directly (this will respect RLS)
      const { data: verifyData, error: verifyError } = await supabase
        .from(this.rolesTable)
        .select('id, name')
        .eq('id', roleId)
        .maybeSingle();
      
      if (verifyError) {
        console.error('[RBAC] Error verifying role after update:', verifyError);
        throw new Error(`Failed to verify role update: ${verifyError.message}`);
      }
      
      if (!verifyData) {
        throw new Error('Role not found or access denied');
      }
      
      // Role exists but select was blocked - update was likely successful
      // We'll fetch the full role with permissions below
      console.log('[RBAC] Role update successful but select was blocked by RLS, fetching role separately');
    }

    // ✅ FIX: Update role_permissions table if permissions array was provided
    if (permissions !== undefined && Array.isArray(permissions)) {
      // Get current permissions for this role
      const { data: currentRolePermissions, error: fetchPermsError } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);

      if (fetchPermsError) {
        console.error('[RBAC] Error fetching current role permissions:', fetchPermsError);
        throw new Error(`Failed to fetch current permissions: ${fetchPermsError.message}`);
      }

      const currentPermissionIds = (currentRolePermissions || []).map(rp => rp.permission_id);
      const newPermissionIds = permissions;

      // Find permissions to add (in new but not in current)
      const permissionsToAdd = newPermissionIds.filter(pid => !currentPermissionIds.includes(pid));
      
      // Find permissions to remove (in current but not in new)
      const permissionsToRemove = currentPermissionIds.filter(pid => !newPermissionIds.includes(pid));

      // Remove permissions that are no longer assigned
      if (permissionsToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', roleId)
          .in('permission_id', permissionsToRemove);

        if (deleteError) {
          console.error('[RBAC] Error removing role permissions:', deleteError);
          throw new Error(`Failed to remove permissions: ${deleteError.message}`);
        }
      }

      // Add new permissions
      if (permissionsToAdd.length > 0) {
        const newRolePermissions = permissionsToAdd.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId,
          granted_by: currentUser.id,
          granted_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(newRolePermissions);

        if (insertError) {
          console.error('[RBAC] Error adding role permissions:', insertError);
          throw new Error(`Failed to add permissions: ${insertError.message}`);
        }
      }

      console.log('[RBAC] Updated role permissions:', {
        roleId,
        added: permissionsToAdd.length,
        removed: permissionsToRemove.length
      });
    }

    // Log the action
    await this.logAction('role_updated', 'role', roleId, updates);

    // Invalidate role cache so updated role is immediately available
    invalidateRoleCache();

    // ✅ FIX: Fetch the updated role with permissions to return complete data
    // Use existingRole.tenant_id if available, otherwise use current user's tenant
    const roleTenantId = existingRole.tenant_id || currentUser.tenantId;
    const updatedRole = await this.getRoles(roleTenantId).then(roles => roles.find(r => r.id === roleId));
    if (!updatedRole) {
      // If we can't fetch the role, construct it from the update data and existing role
      // This handles cases where RLS blocks the select but update was successful
      console.warn('[RBAC] Could not fetch updated role, constructing from update data');
      const constructedRole: Role = {
        id: roleId,
        name: (updateData.name as string) || existingRole.name,
        description: (updateData.description as string) || existingRole.description || '',
        tenant_id: existingRole.tenant_id,
        permissions: permissions || [], // Use provided permissions or empty array
        is_system_role: existingRole.is_system_role,
        created_at: existingRole.created_at || new Date().toISOString(),
        updated_at: updateData.updated_at as string
      };
      return constructedRole;
    }

    return updatedRole;
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string): Promise<void> {
    // Check if it's a system role
    const { data: role, error: fetchError } = await supabase
      .from(this.rolesTable)
      .select('is_system_role, name')
      .eq('id', roleId)
      .single();

    if (fetchError) {
      throw new Error('Role not found');
    }

    if (role.is_system_role) {
      throw new Error('Cannot delete system role');
    }

    const { error } = await supabase
      .from(this.rolesTable)
      .delete()
      .eq('id', roleId);

    if (error) {
      console.error('Error deleting role:', error);
      throw new Error(`Failed to delete role: ${error.message}`);
    }

    // Log the action
    await this.logAction('role_deleted', 'role', roleId, { role_name: role.name });

    // Invalidate role cache so deleted role is immediately removed
    invalidateRoleCache();
  }

  /**
   * Assign a role to a user
   */
  async assignUserRole(userId: string, roleId: string): Promise<void> {
    // Check if assignment already exists
    const { data: existing } = await supabase
      .from(this.userRolesTable)
      .select('id')
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (existing && existing.length > 0) {
      return; // Already assigned
    }

    const { error } = await supabase
      .from(this.userRolesTable)
      .insert({
        user_id: userId,
        role_id: roleId,
        assigned_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error assigning role:', error);
      throw new Error(`Failed to assign role: ${error.message}`);
    }

    // Log the action
    await this.logAction('role_assigned', 'user', userId, { role_id: roleId });
  }

  /**
   * Remove a role from a user
   */
  async removeUserRole(userId: string, roleId: string): Promise<void> {
    const { error } = await supabase
      .from(this.userRolesTable)
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) {
      console.error('Error removing role:', error);
      throw new Error(`Failed to remove role: ${error.message}`);
    }

    // Log the action
    await this.logAction('role_removed', 'user', userId, { role_id: roleId });
  }

  /**
   * Get permission matrix (roles vs permissions)
   */
  async getPermissionMatrix(tenantId?: string): Promise<PermissionMatrix> {
    const roles = await this.getRoles(tenantId);
    const permissions = await this.getPermissions();

    const matrix: Record<string, Record<string, boolean>> = {};

    roles.forEach(role => {
      matrix[role.id] = {};
      permissions.forEach(permission => {
        matrix[role.id][permission.id] = role.permissions.includes(permission.id);
      });
    });

    return {
      roles,
      permissions,
      matrix
    };
  }

  /**
   * Get role templates
   */
  async getRoleTemplates(): Promise<RoleTemplate[]> {
    const { data, error } = await supabase
      .from(this.roleTemplatesTable)
      .select('*')
      .eq('is_default', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching role templates:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Create a role from template
   */
  async createRoleFromTemplate(templateId: string, roleName: string, tenantId: string): Promise<Role> {
    const { data: template, error: fetchError } = await supabase
      .from(this.roleTemplatesTable)
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError || !template) {
      throw new Error('Template not found');
    }

    return this.createRole({
      name: roleName,
      description: template.description,
      tenant_id: tenantId,
      permissions: [...template.permissions],
      is_system_role: false
    });
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(filters?: {
    user_id?: string;
    action?: string;
    resource?: string;
    tenant_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<AuditLog[]> {
    let query = supabase
      .from(this.auditLogsTable)
      .select('*')
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.resource) {
        query = query.eq('resource', filters.resource);
      }
      if (filters.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id);
      }
      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Log an action to audit logs
   */
  async logAction(action: string, resource: string, resourceId?: string, details?: Record<string, unknown>): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return;

    try {
      // Get IP address using the new async method
      let ipAddress = await this.getClientIp();
      
      // Validate IP address - INET type only accepts valid IP addresses
      // If IP is not valid (e.g., "client-unknown", "detection-failed"), use NULL
      const isValidIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(ipAddress) || 
                        /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(ipAddress); // IPv4 or IPv6
      
      if (!isValidIP) {
        console.warn('[RBAC] Invalid IP address detected, using NULL:', ipAddress);
        ipAddress = null as any; // Set to null for INET type
      }
      
      // Map resource to table_name for audit_logs schema
      const tableName = resource || 'unknown';
      
      // Get tenant_id - use currentUser.tenantId or fallback to null
      // The RLS policy will handle tenant isolation
      const tenantId = currentUser.tenantId || null;
      
      await supabase
        .from(this.auditLogsTable)
        .insert({
          user_id: currentUser.id,
          action,
          table_name: tableName,  // Use table_name instead of resource
          record_id: resourceId || null,  // Use record_id instead of resource_id
          old_values: null,  // Store details in old_values for now (can be enhanced later)
          new_values: details || null,  // Store details in new_values
          ip_address: ipAddress,  // Will be NULL if invalid IP
          user_agent: navigator.userAgent,
          tenant_id: tenantId  // Use tenantId with fallback to null
        });
    } catch (err) {
      console.error('[RBAC] Error logging action:', err);
    }
  }

  /**
   * Get users with a specific role
   */
  async getUsersByRole(roleId: string): Promise<User[]> {
    const { data: userRoles, error: roleError } = await supabase
      .from(this.userRolesTable)
      .select('user_id')
      .eq('role_id', roleId);

    if (roleError) {
      console.error('Error fetching user roles:', roleError);
      return [];
    }

    if (!userRoles || userRoles.length === 0) {
      return [];
    }

    const userIds = userRoles.map(ur => ur.user_id);

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return [];
    }

    return users || [];
  }

  /**
   * Bulk assign role to multiple users
   */
  async bulkAssignRole(userIds: string[], roleId: string): Promise<void> {
    const assignments = userIds.map(userId => ({
      user_id: userId,
      role_id: roleId,
      assigned_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from(this.userRolesTable)
      .insert(assignments);

    if (error) {
      console.error('Error bulk assigning role:', error);
      throw new Error(`Failed to bulk assign role: ${error.message}`);
    }

    // Log the action
    await this.logAction('roles_bulk_assigned', 'users', undefined, { 
      user_count: userIds.length, 
      role_id: roleId 
    });
  }

  /**
   * Bulk remove role from multiple users
   */
  async bulkRemoveRole(userIds: string[], roleId: string): Promise<void> {
    const { error } = await supabase
      .from(this.userRolesTable)
      .delete()
      .eq('role_id', roleId)
      .in('user_id', userIds);

    if (error) {
      console.error('Error bulk removing role:', error);
      throw new Error(`Failed to bulk remove role: ${error.message}`);
    }

    // Log the action
    await this.logAction('roles_bulk_removed', 'users', undefined, { 
      user_count: userIds.length, 
      role_id: roleId 
    });
  }

  /**
   * Get permissions grouped by category
   */
  getPermissionsByCategory(): Record<string, Permission[]> {
    // This is a synchronous method that would need to cache permissions
    // For now, return empty object - should be called after getPermissions()
    return {};
  }

  /**
   * Validate role permissions (overloaded method)
   * Accepts either:
   * 1. An action string + optional context (for module-specific RBAC checks)
   * 2. An array of permission IDs (for traditional permission validation)
   */
  async validateRolePermissions(
    actionOrPermissions: string | string[],
    context?: Record<string, any>
  ): Promise<boolean | { valid: boolean; invalid: string[] }> {
    // If second parameter exists or first param looks like an action, treat as action check
    if (context || typeof actionOrPermissions === 'string') {
      // Action-based permission check
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        console.warn('[validateRolePermissions] No user found');
        return false;
      }
      
      const action = actionOrPermissions as string;
      
      // Map action to required permission
      const permissionRequired = this.mapActionToPermission(action);
      
      if (!permissionRequired) {
        console.warn(`[validateRolePermissions] Unable to map action "${action}" to permission`);
        return true; // Graceful degradation
      }
      
      try {
        // Get user's roles for their tenant
        const { data: userRoles, error: roleError } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', currentUser.id)
          .eq('tenant_id', currentUser.tenant_id);
        
        if (roleError) {
          console.warn('[validateRolePermissions] Error fetching user roles:', roleError);
          return true; // Graceful degradation
        }
        
        if (!userRoles || userRoles.length === 0) {
          console.warn('[validateRolePermissions] User has no roles assigned');
          return false;
        }
        
        // Get the role IDs
        const roleIds = userRoles.map(ur => ur.role_id);
        
        // Fetch roles to get their permissions
        const { data: roles, error: fetchRolesError } = await supabase
          .from('roles')
          .select('id, permissions')
          .in('id', roleIds)
          .eq('tenant_id', currentUser.tenant_id);
        
        if (fetchRolesError) {
          console.warn('[validateRolePermissions] Error fetching roles:', fetchRolesError);
          return true; // Graceful degradation
        }
        
        // Check if any of the user's roles have the required permission
        const hasPermission = roles?.some(role => {
          const permissions = Array.isArray(role.permissions) ? role.permissions : [];
          return permissions.includes(permissionRequired);
        });
        
        if (hasPermission) {
          console.log(`[validateRolePermissions] User has permission "${permissionRequired}" for action "${action}"`);
        } else {
          console.warn(`[validateRolePermissions] User does not have permission "${permissionRequired}" for action "${action}"`);
        }
        
        return hasPermission || false;
      } catch (error) {
        console.error('[validateRolePermissions] Error validating permissions:', error);
        return true; // Graceful degradation
      }
    }
    
    // Permission array validation (original behavior)
    const permissions = Array.isArray(actionOrPermissions) ? actionOrPermissions : [actionOrPermissions];
    
    // Handle case where permissions might not be an array
    if (!Array.isArray(permissions)) {
      return {
        valid: false,
        invalid: [String(permissions)]
      };
    }

    const allPermissions = await this.getPermissions();
    const validPermissionIds = allPermissions.map(p => p.id);
    const invalid = permissions.filter(p => !validPermissionIds.includes(p));

    return {
      valid: invalid.length === 0,
      invalid
    };
  }

  /**
   * Map action string to required permission
   * Converts action format like "crm:product-sale:record:create" to "crm:product:record:create"
   * Updated to use {resource}:{action} format instead of manage_resource
   */
  private mapActionToPermission(action: string): string | null {
    // Action format: "resource(:or_subresource):operation"
    // e.g., "crm:product-sale:record:create" -> "crm:product:record:create"
    const parts = action.split(':');
    if (parts.length < 2) return null;
    
    const resource = parts[0];
    const operation = parts[1];
    
    // Handle compound resources (e.g., "product_sales" -> "products")
    const resourceMap: Record<string, string> = {
      'product_sales': 'products',
      'service_contracts': 'service_contracts',
      'jobworks': 'jobworks',
      'user_management': 'users',
    };

    const mappedResource = resourceMap[resource] || resource;

    // Return {resource}:{action} format
    return `${mappedResource}:${operation}`;
  }

  /**
   * Unified permission validation interface
   * Single source of truth for all permission checks in the application
   */
  async validatePermission(
    permission: string, 
    context?: Record<string, any>
  ): Promise<boolean> {
    const result = await this.validateRolePermissions(permission, context);
    return Boolean(result);
  }

  /**
   * Validate multiple permissions
   * @param permissions Array of permissions to check
   * @param context Optional context
   * @returns Object with individual results and overall validation
   */
  async validatePermissions(
    permissions: string[], 
    context?: Record<string, any>
  ): Promise<{ [permission: string]: boolean; allValid: boolean; anyValid: boolean }> {
    const results: { [permission: string]: boolean } = {};
    let allValid = true;
    let anyValid = false;

    for (const permission of permissions) {
      const hasPermission = await this.validatePermission(permission, context);
      results[permission] = hasPermission;
      if (!hasPermission) allValid = false;
      if (hasPermission) anyValid = true;
    }

    return {
      ...results,
      allValid,
      anyValid
    };
  }

  /**
   * Check if user has permission (wrapper for backward compatibility)
   */
  hasPermission(permission: string): boolean {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return false;

    // Super admin has all permissions
    if (currentUser.role === 'super_admin') return true;

    // Use authService's hasPermission for direct compatibility
    return authService.hasPermission(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Helper method to get client IP for audit logging
   * 
   * Updated to use the new IP tracking utilities for improved reliability.
   * Now supports both client-side fallbacks and server-side integration.
   * 
   * @returns Client IP address with source identification
   */
  private async getClientIp(): Promise<string> {
    try {
      // Import the IP tracking utilities
      const { getAuditIPInfo } = await import('@/api/middleware/ipTracking');
      
      // Get comprehensive IP information
      const ipInfo = await getAuditIPInfo();
      
      console.log('[RBAC] IP detection result:', {
        ip: ipInfo.ip_address,
        source: ipInfo.source,
        note: ipInfo.note
      });
      
      return ipInfo.ip_address;
    } catch (error) {
      console.warn('[RBAC] Error in IP detection, using fallback:', error);
      return 'detection-failed';
    }
  }

  /**
   * Get element permissions for a tenant
   * @param tenantId - Optional tenant ID filter
   * @returns Promise<ElementPermission[]> - Array of element permissions
   */
  async getElementPermissions(tenantId?: string): Promise<Permission[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return [];

    const userTenantId = tenantId || currentUser.tenantId;
    const userIsSuperAdmin = isSuperAdmin(currentUser);

    let query = supabase
      .from('element_permissions')
      .select('*')
      .order('element_path', { ascending: true });

    // Apply tenant filtering
    if (!userIsSuperAdmin && userTenantId) {
      query = query.eq('tenant_id', userTenantId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[RBAC] Error fetching element permissions:', error);
      return [];
    }

    // Map database rows to Permission interface (snake_case → camelCase)
    const mappedPermissions: Permission[] = (data || []).map(row => ({
      id: row.id,
      name: `element:${row.element_path}:${row.required_role_level}`,
      description: `Element permission for ${row.element_path}`,
      category: 'module',
      resource: row.element_path.split(':')[0],
      action: `${row.element_path.split(':').slice(1).join(':')}:${row.required_role_level}`,
      is_system_permission: false,
      scope: row.conditions || {},
      elementPath: row.element_path
    }));

    console.log('[RBAC] Element permissions fetched:', mappedPermissions.length);
    return mappedPermissions;
  }

  /**
   * Create element permission
   * @param elementData - Element permission data
   * @returns Promise<Permission> - Created permission
   */
  async createElementPermission(elementData: {
    elementPath: string;
    requiredRoleLevel: 'read' | 'write' | 'admin';
    conditions?: Record<string, any>;
    tenantId: string;
  }): Promise<Permission> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    // Security check
    if (!canAccessRole({ is_system_role: false, tenant_id: elementData.tenantId } as Role, currentUser)) {
      throw new Error('Access denied: Cannot create element permissions for this tenant');
    }

    const { data, error } = await supabase
      .from('element_permissions')
      .insert({
        element_path: elementData.elementPath,
        required_role_level: elementData.requiredRoleLevel,
        conditions: elementData.conditions || {},
        tenant_id: elementData.tenantId
      })
      .select()
      .single();

    if (error) {
      console.error('[RBAC] Error creating element permission:', error);
      throw new Error(`Failed to create element permission: ${error.message}`);
    }

    // Log the action
    await this.logAction('element_permission_created', 'element_permission', data.id, {
      element_path: elementData.elementPath,
      required_role_level: elementData.requiredRoleLevel
    });

    // Return as Permission interface
    return {
      id: data.id,
      name: `element:${data.element_path}:${data.required_role_level}`,
      description: `Element permission for ${data.element_path}`,
      category: 'module',
      resource: data.element_path.split(':')[0],
      action: `${data.element_path.split(':').slice(1).join(':')}:${data.required_role_level}`,
      is_system_permission: false,
      scope: data.conditions || {},
      elementPath: data.element_path
    };
  }

  /**
   * Update element permission
   * @param permissionId - Permission ID to update
   * @param updates - Update data
   * @returns Promise<Permission> - Updated permission
   */
  async updateElementPermission(
    permissionId: string,
    updates: Partial<{
      elementPath: string;
      requiredRoleLevel: 'read' | 'write' | 'admin';
      conditions: Record<string, any>;
    }>
  ): Promise<Permission> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    // Get existing permission
    const { data: existing, error: fetchError } = await supabase
      .from('element_permissions')
      .select('*')
      .eq('id', permissionId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Element permission not found');
    }

    // Security check
    if (!canAccessRole({ is_system_role: false, tenant_id: existing.tenant_id } as Role, currentUser)) {
      throw new Error('Access denied: Cannot modify element permissions for this tenant');
    }

    const updateData: any = {};
    if (updates.elementPath) updateData.element_path = updates.elementPath;
    if (updates.requiredRoleLevel) updateData.required_role_level = updates.requiredRoleLevel;
    if (updates.conditions) updateData.conditions = updates.conditions;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('element_permissions')
      .update(updateData)
      .eq('id', permissionId)
      .select()
      .single();

    if (error) {
      console.error('[RBAC] Error updating element permission:', error);
      throw new Error(`Failed to update element permission: ${error.message}`);
    }

    // Log the action
    await this.logAction('element_permission_updated', 'element_permission', permissionId, updates);

    // Return as Permission interface
    return {
      id: data.id,
      name: `element:${data.element_path}:${data.required_role_level}`,
      description: `Element permission for ${data.element_path}`,
      category: 'module',
      resource: data.element_path.split(':')[0],
      action: `${data.element_path.split(':').slice(1).join(':')}:${data.required_role_level}`,
      is_system_permission: false,
      scope: data.conditions || {},
      elementPath: data.element_path
    };
  }

  /**
   * Delete element permission
   * @param permissionId - Permission ID to delete
   */
  async deleteElementPermission(permissionId: string): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    // Get existing permission for security check
    const { data: existing, error: fetchError } = await supabase
      .from('element_permissions')
      .select('tenant_id, element_path')
      .eq('id', permissionId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Element permission not found');
    }

    // Security check
    if (!canAccessRole({ is_system_role: false, tenant_id: existing.tenant_id } as Role, currentUser)) {
      throw new Error('Access denied: Cannot delete element permissions for this tenant');
    }

    const { error } = await supabase
      .from('element_permissions')
      .delete()
      .eq('id', permissionId);

    if (error) {
      console.error('[RBAC] Error deleting element permission:', error);
      throw new Error(`Failed to delete element permission: ${error.message}`);
    }

    // Log the action
    await this.logAction('element_permission_deleted', 'element_permission', permissionId, {
      element_path: existing.element_path
    });
  }

  /**
   * Get permission overrides for user
   * @param userId - User ID to get overrides for
   * @returns Promise<PermissionOverride[]> - Array of permission overrides
   */
  async getPermissionOverrides(userId: string): Promise<any[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return [];

    // Security check - users can only see their own overrides, admins can see all
    if (!isSuperAdmin(currentUser) && currentUser.id !== userId) {
      throw new Error('Access denied: Cannot view permission overrides for other users');
    }

    const { data, error } = await supabase
      .from('permission_overrides')
      .select(`
        *,
        permissions (
          id,
          name,
          description
        )
      `)
      .eq('user_id', userId)
      .eq('tenant_id', currentUser.tenantId || null)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

    if (error) {
      console.error('[RBAC] Error fetching permission overrides:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Create permission override
   * @param overrideData - Override data
   * @returns Promise<any> - Created override
   */
  async createPermissionOverride(overrideData: {
    userId: string;
    permissionId: string;
    resourceType: 'record' | 'field' | 'element';
    resourceId?: string;
    overrideType: 'grant' | 'deny';
    conditions?: Record<string, any>;
    expiresAt?: string;
  }): Promise<any> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    // Security check - only admins can create overrides
    if (!isSuperAdmin(currentUser) && !canAccessRole({ is_system_role: false, tenant_id: currentUser.tenantId } as Role, currentUser)) {
      throw new Error('Access denied: Only administrators can create permission overrides');
    }

    const { data, error } = await supabase
      .from('permission_overrides')
      .insert({
        user_id: overrideData.userId,
        permission_id: overrideData.permissionId,
        resource_type: overrideData.resourceType,
        resource_id: overrideData.resourceId,
        override_type: overrideData.overrideType,
        conditions: overrideData.conditions || {},
        expires_at: overrideData.expiresAt,
        tenant_id: currentUser.tenantId,
        created_by: currentUser.id
      })
      .select()
      .single();

    if (error) {
      console.error('[RBAC] Error creating permission override:', error);
      throw new Error(`Failed to create permission override: ${error.message}`);
    }

    // Log the action
    await this.logAction('permission_override_created', 'permission_override', data.id, {
      user_id: overrideData.userId,
      permission_id: overrideData.permissionId,
      override_type: overrideData.overrideType
    });

    return data;
  }

  // ❌ REMOVED: getDefaultPermissions() method - violates database-driven principle
  // The system must be 100% database-driven with no hardcoded fallbacks
}

export const supabaseRbacService = new SupabaseRBACService();
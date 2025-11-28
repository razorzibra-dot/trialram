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
      // Return default permissions as fallback
      return this.getDefaultPermissions();
    }

    if (!data) {
      return [];
    }

    // Use systematic tenant isolation utility to filter permissions
    const { filterFn } = getPermissionQueryFilters(currentUser);
    const filteredData = filterFn(data);

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
      const ipAddress = await this.getClientIp();
      
      await supabase
        .from(this.auditLogsTable)
        .insert({
          user_id: currentUser.id,
          action,
          resource,
          resource_id: resourceId,
          details: details || {},
          ip_address: ipAddress,
          user_agent: navigator.userAgent,
          tenant_id: currentUser.tenantId  // Fixed: use camelCase tenantId from User object
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
   * Converts action format like "product_sales:create" to "products:create"
   * Updated to use {resource}:{action} format instead of manage_resource
   */
  private mapActionToPermission(action: string): string | null {
    // Action format: "resource(:or_subresource):operation"
    // e.g., "product_sales:create" -> "products:create"
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
   * Get default permissions as fallback
   */
  private getDefaultPermissions(): Permission[] {
    return [
      // Core permissions
      { id: 'read', name: 'Read', description: 'View and read data', category: 'core', resource: '*', action: 'read' },
      { id: 'write', name: 'Write', description: 'Create and edit data', category: 'core', resource: '*', action: 'write' },
      { id: 'delete', name: 'Delete', description: 'Delete data', category: 'core', resource: '*', action: 'delete' },

      // Module permissions using {resource}:{action} format
      { id: 'customers:read', name: 'View Customers', description: 'View customer data and relationships', category: 'module', resource: 'customers', action: 'read' },
      { id: 'customers:create', name: 'Create Customers', description: 'Create new customer records', category: 'module', resource: 'customers', action: 'create' },
      { id: 'customers:update', name: 'Update Customers', description: 'Edit customer information', category: 'module', resource: 'customers', action: 'update' },
      { id: 'customers:delete', name: 'Delete Customers', description: 'Remove customer records', category: 'module', resource: 'customers', action: 'delete' },

      { id: 'sales:read', name: 'View Sales', description: 'View sales processes and deals', category: 'module', resource: 'sales', action: 'read' },
      { id: 'sales:create', name: 'Create Sales', description: 'Create new sales records', category: 'module', resource: 'sales', action: 'create' },
      { id: 'sales:update', name: 'Update Sales', description: 'Edit sales information', category: 'module', resource: 'sales', action: 'update' },
      { id: 'sales:delete', name: 'Delete Sales', description: 'Remove sales records', category: 'module', resource: 'sales', action: 'delete' },

      { id: 'tickets:read', name: 'View Tickets', description: 'View support tickets and issues', category: 'module', resource: 'tickets', action: 'read' },
      { id: 'tickets:create', name: 'Create Tickets', description: 'Create new support tickets', category: 'module', resource: 'tickets', action: 'create' },
      { id: 'tickets:update', name: 'Update Tickets', description: 'Edit ticket information', category: 'module', resource: 'tickets', action: 'update' },
      { id: 'tickets:delete', name: 'Delete Tickets', description: 'Remove ticket records', category: 'module', resource: 'tickets', action: 'delete' },

      { id: 'complaints:read', name: 'View Complaints', description: 'View customer complaints', category: 'module', resource: 'complaints', action: 'read' },
      { id: 'complaints:create', name: 'Create Complaints', description: 'Create complaint records', category: 'module', resource: 'complaints', action: 'create' },
      { id: 'complaints:update', name: 'Update Complaints', description: 'Edit complaint information', category: 'module', resource: 'complaints', action: 'update' },
      { id: 'complaints:delete', name: 'Delete Complaints', description: 'Remove complaint records', category: 'module', resource: 'complaints', action: 'delete' },

      { id: 'contracts:read', name: 'View Contracts', description: 'View service contracts and agreements', category: 'module', resource: 'contracts', action: 'read' },
      { id: 'contracts:create', name: 'Create Contracts', description: 'Create new contracts', category: 'module', resource: 'contracts', action: 'create' },
      { id: 'contracts:update', name: 'Update Contracts', description: 'Edit contract information', category: 'module', resource: 'contracts', action: 'update' },
      { id: 'contracts:delete', name: 'Delete Contracts', description: 'Remove contract records', category: 'module', resource: 'contracts', action: 'delete' },

      { id: 'products:read', name: 'View Products', description: 'View product catalog and inventory', category: 'module', resource: 'products', action: 'read' },
      { id: 'products:create', name: 'Create Products', description: 'Create new product records', category: 'module', resource: 'products', action: 'create' },
      { id: 'products:update', name: 'Update Products', description: 'Edit product information', category: 'module', resource: 'products', action: 'update' },
      { id: 'products:delete', name: 'Delete Products', description: 'Remove product records', category: 'module', resource: 'products', action: 'delete' },

      // Additional module permissions using {resource}:{action} format
      { id: 'product_sales:read', name: 'View Product Sales', description: 'View product sales transactions', category: 'module', resource: 'product_sales', action: 'read' },
      { id: 'product_sales:create', name: 'Create Product Sales', description: 'Create new product sales records', category: 'module', resource: 'product_sales', action: 'create' },
      { id: 'product_sales:update', name: 'Update Product Sales', description: 'Edit product sales information', category: 'module', resource: 'product_sales', action: 'update' },
      { id: 'product_sales:delete', name: 'Delete Product Sales', description: 'Remove product sales records', category: 'module', resource: 'product_sales', action: 'delete' },

      { id: 'jobworks:read', name: 'View Job Works', description: 'View job work orders and tasks', category: 'module', resource: 'jobworks', action: 'read' },
      { id: 'jobworks:create', name: 'Create Job Works', description: 'Create new job work orders', category: 'module', resource: 'jobworks', action: 'create' },
      { id: 'jobworks:update', name: 'Update Job Works', description: 'Edit job work information', category: 'module', resource: 'jobworks', action: 'update' },
      { id: 'jobworks:delete', name: 'Delete Job Works', description: 'Remove job work records', category: 'module', resource: 'jobworks', action: 'delete' },

      { id: 'service_contracts:read', name: 'View Service Contracts', description: 'View service contracts and agreements', category: 'module', resource: 'service_contracts', action: 'read' },
      { id: 'service_contracts:create', name: 'Create Service Contracts', description: 'Create new service contracts', category: 'module', resource: 'service_contracts', action: 'create' },
      { id: 'service_contracts:update', name: 'Update Service Contracts', description: 'Edit service contract information', category: 'module', resource: 'service_contracts', action: 'update' },
      { id: 'service_contracts:delete', name: 'Delete Service Contracts', description: 'Remove service contract records', category: 'module', resource: 'service_contracts', action: 'delete' },

      { id: 'dashboard:view', name: 'View Dashboard', description: 'Access tenant dashboard and analytics', category: 'module', resource: 'dashboard', action: 'view' },
      { id: 'masters:read', name: 'View Masters', description: 'Access master data and configuration', category: 'module', resource: 'masters', action: 'read' },
      { id: 'user_management:read', name: 'View User Management', description: 'Access user and role management interface', category: 'module', resource: 'user_management', action: 'read' },

      // Administrative permissions using {resource}:{action} format
      { id: 'users:read', name: 'View Users', description: 'View user accounts and access', category: 'administrative', resource: 'users', action: 'read' },
      { id: 'users:create', name: 'Create Users', description: 'Create new user accounts', category: 'administrative', resource: 'users', action: 'create' },
      { id: 'users:update', name: 'Update Users', description: 'Edit user accounts', category: 'administrative', resource: 'users', action: 'update' },
      { id: 'users:delete', name: 'Delete Users', description: 'Remove user accounts', category: 'administrative', resource: 'users', action: 'delete' },

      { id: 'roles:read', name: 'View Roles', description: 'View roles and permissions', category: 'administrative', resource: 'roles', action: 'read' },
      { id: 'roles:create', name: 'Create Roles', description: 'Create new roles', category: 'administrative', resource: 'roles', action: 'create' },
      { id: 'roles:update', name: 'Update Roles', description: 'Edit roles and permissions', category: 'administrative', resource: 'roles', action: 'update' },
      { id: 'roles:delete', name: 'Delete Roles', description: 'Remove roles', category: 'administrative', resource: 'roles', action: 'delete' },

      { id: 'analytics:view', name: 'View Analytics', description: 'Access analytics and reports', category: 'administrative', resource: 'analytics', action: 'view' },
      { id: 'settings:read', name: 'View Settings', description: 'Configure system settings', category: 'administrative', resource: 'settings', action: 'read' },
      { id: 'settings:update', name: 'Update Settings', description: 'Update system settings', category: 'administrative', resource: 'settings', action: 'update' },
      { id: 'companies:read', name: 'View Companies', description: 'View company information', category: 'administrative', resource: 'companies', action: 'read' },
      { id: 'companies:update', name: 'Update Companies', description: 'Edit company information', category: 'administrative', resource: 'companies', action: 'update' },

      // System permissions using {resource}:{action} format
      { id: 'platform:admin', name: 'Platform Admin', description: 'Platform administration access', category: 'system', resource: 'platform', action: 'admin' },
      { id: 'system:admin', name: 'Super Admin', description: 'Full system administration', category: 'system', resource: 'system', action: 'admin' },
      { id: 'tenants:manage', name: 'Manage Tenants', description: 'Manage tenant accounts', category: 'system', resource: 'tenants', action: 'manage' },
      { id: 'system:monitor', name: 'System Monitoring', description: 'Monitor system health and performance', category: 'system', resource: 'system', action: 'monitor' }
    ];
  }
}

export const supabaseRbacService = new SupabaseRBACService();
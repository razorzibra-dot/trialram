/**
 * Supabase RBAC (Role-Based Access Control) Service
 * Handles role and permission management via Supabase PostgreSQL
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);
import { Permission, Role, UserRole, AuditLog, RoleTemplate, PermissionMatrix } from '@/types/rbac';
import { User } from '@/types/auth';
import { authService } from '../../serviceFactory';

class SupabaseRBACService {
  private permissionsTable = 'permissions';
  private rolesTable = 'roles';
  private userRolesTable = 'user_roles';
  private roleTemplatesTable = 'role_templates';
  private auditLogsTable = 'audit_logs';

  /**
   * Get all permissions
   */
  async getPermissions(): Promise<Permission[]> {
    const { data, error } = await supabase
      .from(this.permissionsTable)
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching permissions:', error);
      // Return default permissions as fallback
      return this.getDefaultPermissions();
    }

    return data || [];
  }

  /**
   * Get all roles, optionally filtered by tenant
   */
  async getRoles(tenantId?: string): Promise<Role[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return [];

    let query = supabase
      .from(this.rolesTable)
      .select('*')
      .order('name', { ascending: true });

    // If user is super_admin, allow fetching any tenant's roles
    // Otherwise, only return roles for their tenant
    // Note: User object uses camelCase (tenantId), not snake_case (tenant_id)
    const userTenantId = tenantId || currentUser.tenantId;
    
    if (currentUser.role !== 'super_admin' && userTenantId) {
      console.log('[RBAC] Filtering roles by tenant_id:', userTenantId);
      query = query.eq('tenant_id', userTenantId);
    } else if (currentUser.role === 'super_admin') {
      console.log('[RBAC] Super admin - fetching all roles');
    }

    const { data, error } = await query;

    if (error) {
      console.error('[RBAC] Error fetching roles:', error);
      return [];
    }

    console.log('[RBAC] Roles fetched:', data?.length || 0);
    return data || [];
  }

  /**
   * Create a new role
   */
  async createRole(roleData: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    const newRole = {
      ...roleData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(this.rolesTable)
      .insert(newRole)
      .select()
      .single();

    if (error) {
      console.error('Error creating role:', error);
      throw new Error(`Failed to create role: ${error.message}`);
    }

    // Log the action
    await this.logAction('role_created', 'role', data.id, { role_name: data.name });

    return data as Role;
  }

  /**
   * Update a role
   */
  async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(this.rolesTable)
      .update(updateData)
      .eq('id', roleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating role:', error);
      throw new Error(`Failed to update role: ${error.message}`);
    }

    if (!data) {
      throw new Error('Role not found');
    }

    // Log the action
    await this.logAction('role_updated', 'role', roleId, updates);

    return data as Role;
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
      .order('timestamp', { ascending: false });

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
        query = query.gte('timestamp', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('timestamp', filters.end_date);
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
      await supabase
        .from(this.auditLogsTable)
        .insert({
          user_id: currentUser.id,
          action,
          resource,
          resource_id: resourceId,
          details: details || {},
          ip_address: this.getClientIp(),
          user_agent: navigator.userAgent,
          tenant_id: currentUser.tenantId,  // Fixed: use camelCase tenantId from User object
          timestamp: new Date().toISOString()
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
   * Converts action format like "product_sales:create" to "manage_product_sales"
   */
  private mapActionToPermission(action: string): string | null {
    // Action format: "resource(:or_subresource):operation"
    // e.g., "product_sales:create" -> "manage_product_sales"
    const parts = action.split(':');
    if (parts.length < 2) return null;
    
    const resource = parts[0];
    const operation = parts[1];
    
    // For most operations, we need the "manage_resource" permission
    switch (operation) {
      case 'create':
      case 'edit':
      case 'delete':
      case 'change_status':
      case 'approve':
      case 'reject':
      case 'bulk_delete':
      case 'bulk_update_status':
      case 'create_with_contract':
      case 'edit_fields':
      case 'export':
      case 'view_audit':
      case 'bulk_export':
        return `manage_${resource}`;
      
      case 'view':
      case 'view_details':
        return `manage_${resource}`;
      
      default:
        return `manage_${resource}`;
    }
  }

  /**
   * Helper method to get client IP (returns placeholder in browser)
   */
  private getClientIp(): string {
    // In a browser environment, we can't get the real IP
    // The server should capture this from the request
    return 'browser-client';
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

      // Module permissions
      { id: 'manage_customers', name: 'Manage Customers', description: 'Manage customer data', category: 'module', resource: 'customers', action: 'manage' },
      { id: 'manage_sales', name: 'Manage Sales', description: 'Manage sales processes', category: 'module', resource: 'sales', action: 'manage' },
      { id: 'manage_tickets', name: 'Manage Tickets', description: 'Manage support tickets', category: 'module', resource: 'tickets', action: 'manage' },
      { id: 'manage_complaints', name: 'Manage Complaints', description: 'Handle complaints', category: 'module', resource: 'complaints', action: 'manage' },
      { id: 'manage_contracts', name: 'Manage Contracts', description: 'Manage contracts', category: 'module', resource: 'contracts', action: 'manage' },
      { id: 'manage_products', name: 'Manage Products', description: 'Manage products', category: 'module', resource: 'products', action: 'manage' },

      // Administrative permissions
      { id: 'manage_users', name: 'Manage Users', description: 'Manage user accounts', category: 'administrative', resource: 'users', action: 'manage' },
      { id: 'manage_roles', name: 'Manage Roles', description: 'Manage roles', category: 'administrative', resource: 'roles', action: 'manage' },
      { id: 'view_analytics', name: 'View Analytics', description: 'Access analytics', category: 'administrative', resource: 'analytics', action: 'view' },
      { id: 'manage_settings', name: 'Manage Settings', description: 'Configure settings', category: 'administrative', resource: 'settings', action: 'manage' },

      // System permissions
      { id: 'super_admin', name: 'Super Admin', description: 'Full system access', category: 'system', resource: 'system', action: 'admin' },
    ];
  }
}

export const supabaseRbacService = new SupabaseRBACService();
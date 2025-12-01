/**
 * Element-Level Permission Service
 * Handles granular permission evaluation for UI elements, fields, and components
 *
 * Follows strict layer synchronization rules:
 * - Database: snake_case columns with constraints
 * - Types: camelCase interface matching DB exactly
 * - Service: SELECT with column mapping (snake → camel)
 * - Factory: route to correct backend
 * - Module: use factory (never direct imports)
 * - Hooks: loading/error/data states + cache invalidation
 * - UI: form fields = DB columns + tooltips documenting constraints
 */

import { supabase } from '@/services/supabase/client';
import {
  Permission,
  ElementPermission,
  PermissionOverride,
  PermissionContext,
  PermissionTemplate
} from '@/types/rbac';
import { User } from '@/types/auth';
import { authService } from '@/services/serviceFactory';
import { isSuperAdmin } from '@/utils/tenantIsolation';

type PermissionLike = Pick<Permission, 'name' | 'scope'> & Partial<Permission>;

class ElementPermissionService {
  private permissionsCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Evaluate element-level permission with context
   * @param elementPath - Path to the UI element (e.g., "contacts:list:button.create")
   * @param action - Action to check ('visible' | 'enabled' | 'editable' | 'accessible')
   * @param context - Permission evaluation context
   * @returns Promise<boolean> - Whether the action is permitted
   */
  async evaluateElementPermission(
    elementPath: string,
    action: 'visible' | 'enabled' | 'editable' | 'accessible',
    context: PermissionContext
  ): Promise<boolean> {
    try {
      const cacheKey = `${context.user.id}:${elementPath}:${action}:${JSON.stringify(context)}`;
      const cached = this.getCachedResult(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Normalise incoming element path to always be crm-prefixed
      const normalizedElementPath = elementPath.startsWith('crm:')
        ? elementPath
        : `crm:${elementPath}`;

      // Check hierarchical permissions (exact → scoped → global)
      const permissionChecks = new Set<string>();
      permissionChecks.add(`${normalizedElementPath}:${action}`); // Element + action
      permissionChecks.add(normalizedElementPath); // Element without action (backward compatibility)

      const segments = normalizedElementPath.split(':').filter(Boolean);
      if (segments.length >= 3) {
        // crm:user:list → crm:user:list:*
        permissionChecks.add(`${segments.slice(0, 3).join(':')}:*`);
      }
      if (segments.length >= 2) {
        // crm:user → crm:user:*
        permissionChecks.add(`${segments.slice(0, 2).join(':')}:*`);
      }

      permissionChecks.add(`crm:*:${action}`); // Any element performing same action
      permissionChecks.add('crm:*'); // Full wildcard

      for (const permission of permissionChecks) {
        if (await this.hasPermission(permission, context)) {
          this.setCachedResult(cacheKey, true);
          return true;
        }
      }

      // Check permission overrides
      const hasOverride = await this.checkPermissionOverrides(elementPath, action, context);
      if (hasOverride !== null) {
        this.setCachedResult(cacheKey, hasOverride);
        return hasOverride;
      }

      this.setCachedResult(cacheKey, false);
      return false;
    } catch (error) {
      console.error('[ElementPermissionService] Error evaluating permission:', error);
      // Fail-safe: deny access on error
      return false;
    }
  }

  /**
   * Check if user has a specific permission with context evaluation
   * @param permission - Permission string to check
   * @param context - Permission evaluation context
   * @returns Promise<boolean> - Whether permission is granted
   */
  private async hasPermission(permission: string, context: PermissionContext): Promise<boolean> {
    try {
      // Get user's roles for their tenant
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', context.user.id)
        .eq('tenant_id', context.user.tenantId || null);

      if (roleError) {
        console.warn('[ElementPermissionService] Error fetching user roles:', roleError);
        return false;
      }

      if (!userRoles || userRoles.length === 0) {
        return false;
      }

      // Get role IDs
      const roleIds = userRoles.map(ur => ur.role_id);

      // Fetch roles with permissions
      const { data: roles, error: fetchRolesError } = await supabase
        .from('roles')
        .select(`
          id,
          name,
          tenant_id,
          role_permissions (
            permission_id,
            permissions (
              id,
              name,
              scope,
              element_path,
              parent_permission_id
            )
          )
        `)
        .in('id', roleIds)
        .eq('tenant_id', context.user.tenantId || null);

      if (fetchRolesError) {
        console.warn('[ElementPermissionService] Error fetching roles:', fetchRolesError);
        return false;
      }

      // Check if any role has the required permission
      for (const role of roles || []) {
        const rolePermissions = role.role_permissions || [];
        for (const rp of rolePermissions) {
          const permissionRecord = Array.isArray(rp.permissions)
            ? rp.permissions[0]
            : rp.permissions;
          if (!permissionRecord) {
            continue;
          }
          if (this.matchesPermission(permissionRecord as PermissionLike, permission, context)) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('[ElementPermissionService] Error in hasPermission:', error);
      return false;
    }
  }

  /**
   * Check permission overrides for specific elements
   * @param elementPath - Element path to check
   * @param action - Action being performed
   * @param context - Permission context
   * @returns Promise<boolean | null> - Override result or null if no override
   */
  private async checkPermissionOverrides(
    elementPath: string,
    action: string,
    context: PermissionContext
  ): Promise<boolean | null> {
    try {
      const { data: overrides, error } = await supabase
        .from('permission_overrides')
        .select(`
          override_type,
          conditions,
          expires_at,
          permissions!inner(name)
        `)
        .eq('user_id', context.user.id)
        .eq('resource_type', 'element')
        .eq('resource_id', elementPath)
        .eq('tenant_id', context.user.tenantId || null)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      if (error) {
        console.warn('[ElementPermissionService] Error fetching overrides:', error);
        return null;
      }

      if (!overrides || overrides.length === 0) {
        return null;
      }

      // Check most recent override
      const override = overrides[0];
      if (override.override_type === 'grant') {
        return true;
      } else if (override.override_type === 'deny') {
        return false;
      }

      return null;
    } catch (error) {
      console.error('[ElementPermissionService] Error checking overrides:', error);
      return null;
    }
  }

  /**
   * Match permission with wildcard support and context evaluation
   * @param permission - Permission object from database
   * @param requiredPermission - Required permission string
   * @param context - Permission context
   * @returns boolean - Whether permission matches
   */
  private matchesPermission(
    permission: PermissionLike,
    requiredPermission: string,
    context: PermissionContext
  ): boolean {
    // Handle wildcards
    const permPattern = permission.name.replace(/\*/g, '.*');
    const regex = new RegExp(`^${permPattern}$`);

    if (!regex.test(requiredPermission)) {
      return false;
    }

    // Check scope/context constraints
    if (permission.scope) {
      return this.evaluateScopeConstraints(permission.scope, context);
    }

    return true;
  }

  /**
   * Evaluate scope constraints from permission
   * @param scope - Scope constraints from permission
   * @param context - Permission context
   * @returns boolean - Whether constraints are satisfied
   */
  private evaluateScopeConstraints(scope: any, context: PermissionContext): boolean {
    try {
      // Tenant constraint
      if (scope.tenant_id === 'current' && scope.tenant_id !== context.tenant.id) {
        return false;
      }

      // Department constraint
      if (scope.department && !scope.department.includes(context.user.department)) {
        return false;
      }

      // Role constraint
      if (scope.role && !scope.role.includes(context.user.role)) {
        return false;
      }

      // Custom conditions
      if (scope.conditions) {
        return this.evaluateCustomConditions(scope.conditions, context);
      }

      return true;
    } catch (error) {
      console.error('[ElementPermissionService] Error evaluating scope constraints:', error);
      return false;
    }
  }

  /**
   * Evaluate custom conditions
   * @param conditions - Custom condition object
   * @param context - Permission context
   * @returns boolean - Whether conditions are met
   */
  private evaluateCustomConditions(conditions: any, context: PermissionContext): boolean {
    // Implement custom condition evaluation logic
    // Example: { "recordOwner": true } - only allow if user owns the record
    if (conditions.recordOwner && context.recordId) {
      // Check if user owns the record (implementation depends on specific use case)
      return this.checkRecordOwnership(context.recordId, context.user.id);
    }

    return true;
  }

  /**
   * Check if user owns a specific record
   * @param recordId - Record ID to check
   * @param userId - User ID to check ownership for
   * @returns boolean - Whether user owns the record
   */
  private checkRecordOwnership(recordId: string, userId: string): boolean {
    // Implementation depends on the specific record type
    // This is a placeholder - actual implementation would query the specific table
    return true; // Placeholder
  }

  /**
   * Get cached permission result
   * @param key - Cache key
   * @returns boolean | null - Cached result or null if not cached/expired
   */
  private getCachedResult(key: string): boolean | null {
    const cached = this.permissionsCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }
    if (cached) {
      this.permissionsCache.delete(key); // Remove expired cache
    }
    return null;
  }

  /**
   * Set cached permission result
   * @param key - Cache key
   * @param result - Permission result to cache
   */
  private setCachedResult(key: string, result: boolean): void {
    this.permissionsCache.set(key, {
      data: result,
      timestamp: Date.now()
    });
  }

  /**
   * Clear permission cache for user
   * @param userId - User ID to clear cache for
   */
  clearUserCache(userId: string): void {
    for (const [key] of this.permissionsCache) {
      if (key.startsWith(`${userId}:`)) {
        this.permissionsCache.delete(key);
      }
    }
  }

  /**
   * Get element permissions for a tenant
   * @param tenantId - Tenant ID to get permissions for
   * @returns Promise<ElementPermission[]> - Array of element permissions
   */
  async getElementPermissions(tenantId?: string): Promise<ElementPermission[]> {
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
      console.error('[ElementPermissionService] Error fetching element permissions:', error);
      return [];
    }

    // Map database rows to ElementPermission interface (snake_case → camelCase)
    return (data || []).map(row => ({
      id: row.id,
      elementPath: row.element_path,
      permissionId: row.permission_id,
      requiredRoleLevel: row.required_role_level,
      conditions: row.conditions || {},
      tenantId: row.tenant_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  /**
   * Get permission templates
   * @param tenantId - Optional tenant ID filter
   * @returns Promise<PermissionTemplate[]> - Array of permission templates
   */
  async getPermissionTemplates(tenantId?: string): Promise<PermissionTemplate[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return [];

    const userTenantId = tenantId || currentUser.tenantId;
    const userIsSuperAdmin = isSuperAdmin(currentUser);

    let query = supabase
      .from('permission_templates')
      .select('*')
      .order('name', { ascending: true });

    // Apply tenant filtering
    if (!userIsSuperAdmin && userTenantId) {
      query = query.eq('tenant_id', userTenantId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ElementPermissionService] Error fetching permission templates:', error);
      return [];
    }

    // Map database rows to PermissionTemplate interface
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      template: row.template || {},
      applicableTo: row.applicable_to,
      tenantId: row.tenant_id,
      createdAt: row.created_at
    }));
  }
}

export const elementPermissionService = new ElementPermissionService();
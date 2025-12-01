/**
 * Dynamic Permission Manager
 * Handles context-aware permission evaluation and temporary permissions
 * Follows factory pattern and tenant isolation rules
 */

import { supabase } from '@/services/supabase/client';
import { PermissionContext, Permission } from '@/types/rbac';
import { User } from '@/types/auth';
import { authService } from '../serviceFactory';
import { isSuperAdmin } from '@/utils/tenantIsolation';

class DynamicPermissionManager {
  private tempPermissionsCache = new Map<string, { permissions: string[], expiresAt: number }>();

  /**
   * Evaluate permissions based on dynamic business rules and context
   */
  async evaluateDynamicPermissions(userId: string, context: PermissionContext): Promise<string[]> {
    const dynamicPermissions: string[] = [];

    // Business rule: Department-based permissions
    if (context.user.department) {
      dynamicPermissions.push(...this.getDepartmentBasedPermissions(context.user.department, context));
    }

    // Business rule: Role-based dynamic permissions
    if (context.user.role) {
      dynamicPermissions.push(...this.getRoleBasedPermissions(context.user.role, context));
    }

    // Business rule: Record ownership permissions
    if (context.recordId) {
      dynamicPermissions.push(...this.getRecordOwnershipPermissions(userId, context.recordId, context));
    }

    // Business rule: Time-based permissions
    dynamicPermissions.push(...this.getTimeBasedPermissions(context));

    // Business rule: Location-based permissions (if location data available)
    if (context.metadata?.location) {
      dynamicPermissions.push(...this.getLocationBasedPermissions(context.metadata.location, context));
    }

    return [...new Set(dynamicPermissions)]; // Remove duplicates
  }

  /**
   * Assign temporary permissions for specific context/session
   */
  async assignTemporaryPermissions(
    userId: string,
    permissions: string[],
    options: { expiresIn: string; context: PermissionContext }
  ): Promise<void> {
    const expiresAt = this.calculateExpiry(options.expiresIn);

    // Store in cache for fast access
    this.tempPermissionsCache.set(`${userId}:${options.context.resource}`, {
      permissions,
      expiresAt
    });

    // Store in database for persistence across sessions
    await this.storeTemporaryPermissions(userId, permissions, expiresAt, options.context);

    // Invalidate permission cache
    await this.invalidatePermissionCache(userId);
  }

  /**
   * Check if user has temporary permission
   */
  hasTemporaryPermission(userId: string, permission: string, context?: PermissionContext): boolean {
    const cacheKey = context?.resource ? `${userId}:${context.resource}` : userId;
    const tempPerms = this.tempPermissionsCache.get(cacheKey);

    if (!tempPerms) return false;

    // Check if expired
    if (Date.now() > tempPerms.expiresAt) {
      this.tempPermissionsCache.delete(cacheKey);
      return false;
    }

    return tempPerms.permissions.includes(permission);
  }

  /**
   * Get department-based dynamic permissions
   */
  private getDepartmentBasedPermissions(department: string, context: PermissionContext): string[] {
    const permissions: string[] = [];

    switch (department.toLowerCase()) {
      case 'sales':
        permissions.push(
          'crm:leads:owner.self:view',
          'crm:deals:owner.self:edit',
          'crm:contacts:department.sales:view'
        );
        break;

      case 'marketing':
        permissions.push(
          'crm:campaigns:create',
          'crm:analytics:marketing:view',
          'crm:contacts:segment.view'
        );
        break;

      case 'support':
        permissions.push(
          'crm:tickets:assigned.self:edit',
          'crm:complaints:assigned.self:resolve',
          'crm:knowledge:base:view'
        );
        break;

      case 'finance':
        permissions.push(
          'crm:invoices:view',
          'crm:payments:process',
          'crm:reports:financial:view'
        );
        break;

      case 'hr':
        permissions.push(
          'crm:users:department.self:manage',
          'crm:reports:hr:view',
          'crm:training:assign'
        );
        break;
    }

    return permissions;
  }

  /**
   * Get role-based dynamic permissions
   */
  private getRoleBasedPermissions(role: string, context: PermissionContext): string[] {
    const permissions: string[] = [];

    switch (role.toLowerCase()) {
      case 'manager':
        permissions.push(
          'crm:team.members:view',
          'crm:reports:team:view',
          'crm:approvals:team:process'
        );
        break;

      case 'senior':
      case 'lead':
        permissions.push(
          'crm:mentoring:provide',
          'crm:code:review',
          'crm:standards:enforce'
        );
        break;

      case 'junior':
      case 'trainee':
        permissions.push(
          'crm:training:access',
          'crm:supervision:required'
        );
        break;
    }

    return permissions;
  }

  /**
   * Get record ownership permissions
   */
  private getRecordOwnershipPermissions(userId: string, recordId: string, context: PermissionContext): string[] {
    const permissions: string[] = [];

    // Check if user owns the record
    if (this.isRecordOwner(userId, recordId, context.resource)) {
      permissions.push(
        `${context.resource}:record.${recordId}:owner.edit`,
        `${context.resource}:record.${recordId}:owner.delete`,
        `${context.resource}:record.${recordId}:owner.share`
      );
    }

    return permissions;
  }

  /**
   * Get time-based permissions
   */
  private getTimeBasedPermissions(context: PermissionContext): string[] {
    const permissions: string[] = [];
    const now = new Date();
    const hour = now.getHours();

    // Business hours permissions
    if (hour >= 9 && hour <= 17) {
      permissions.push('crm:business.hours:access');
    }

    // Emergency access (outside business hours)
    if ((hour < 9 || hour > 17) && context.metadata?.emergency) {
      permissions.push('crm:emergency.access:granted');
    }

    return permissions;
  }

  /**
   * Get location-based permissions
   */
  private getLocationBasedPermissions(location: any, context: PermissionContext): string[] {
    const permissions: string[] = [];

    // Office-based permissions
    if (location.type === 'office') {
      permissions.push('crm:office.resources:access');
    }

    // Remote work permissions
    if (location.type === 'remote') {
      permissions.push('crm:remote.work:allowed');
    }

    // Travel permissions
    if (location.type === 'travel') {
      permissions.push('crm:travel.expenses:submit');
    }

    return permissions;
  }

  /**
   * Check if user owns a record
   */
  private async isRecordOwner(userId: string, recordId: string, resource?: string): Promise<boolean> {
    if (!resource) return false;

    try {
      let query;

      switch (resource) {
        case 'crm:leads':
        case 'crm:deals':
          query = supabase
            .from('sales')
            .select('assigned_to')
            .eq('id', recordId)
            .eq('assigned_to', userId);
          break;

        case 'crm:tickets':
        case 'crm:complaints':
          query = supabase
            .from('tickets')
            .select('assigned_to')
            .eq('id', recordId)
            .eq('assigned_to', userId);
          break;

        case 'crm:customers':
          query = supabase
            .from('customers')
            .select('created_by')
            .eq('id', recordId)
            .eq('created_by', userId);
          break;

        default:
          return false;
      }

      const { data, error } = await query;
      return !error && data && data.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Calculate expiry timestamp
   */
  private calculateExpiry(expiresIn: string): number {
    const now = Date.now();
    const [value, unit] = expiresIn.split(/(\d+)/).filter(Boolean);

    const numValue = parseInt(value);

    switch (unit) {
      case 's': return now + (numValue * 1000);
      case 'm': return now + (numValue * 60 * 1000);
      case 'h': return now + (numValue * 60 * 60 * 1000);
      case 'd': return now + (numValue * 24 * 60 * 60 * 1000);
      default: return now + (60 * 60 * 1000); // Default 1 hour
    }
  }

  /**
   * Store temporary permissions in database
   */
  private async storeTemporaryPermissions(
    userId: string,
    permissions: string[],
    expiresAt: number,
    context: PermissionContext
  ): Promise<void> {
    const tempPerms = permissions.map(permission => ({
      user_id: userId,
      permission_id: permission,
      resource_type: 'temporary',
      resource_id: context.resource || 'global',
      override_type: 'grant' as const,
      conditions: {
        context: context,
        expires_at: new Date(expiresAt).toISOString()
      },
      expires_at: new Date(expiresAt).toISOString(),
      tenant_id: context.tenant.id,
      created_by: userId
    }));

    await supabase.from('permission_overrides').insert(tempPerms);
  }

  /**
   * Invalidate permission cache
   */
  private async invalidatePermissionCache(userId: string): Promise<void> {
    // Clear local cache
    for (const [key] of this.tempPermissionsCache) {
      if (key.startsWith(userId)) {
        this.tempPermissionsCache.delete(key);
      }
    }

    // Invalidate any global permission caches
    // This would integrate with your caching system
  }

  /**
   * Clean up expired temporary permissions
   */
  async cleanupExpiredPermissions(): Promise<void> {
    const now = new Date().toISOString();

    // Remove from database
    await supabase
      .from('permission_overrides')
      .delete()
      .lt('expires_at', now);

    // Clean local cache
    for (const [key, value] of this.tempPermissionsCache) {
      if (Date.now() > value.expiresAt) {
        this.tempPermissionsCache.delete(key);
      }
    }
  }

  /**
   * Get permission inheritance hierarchy
   */
  async getPermissionHierarchy(permission: string): Promise<string[]> {
    const hierarchy: string[] = [permission];

    // Find parent permissions
    const { data: permData } = await supabase
      .from('permissions')
      .select('parent_permission_id')
      .eq('name', permission)
      .single();

    if (permData?.parent_permission_id) {
      const { data: parentPerm } = await supabase
        .from('permissions')
        .select('name')
        .eq('id', permData.parent_permission_id)
        .single();

      if (parentPerm) {
        hierarchy.push(...await this.getPermissionHierarchy(parentPerm.name));
      }
    }

    return hierarchy;
  }

  /**
   * Check permission with inheritance
   */
  async hasPermissionWithInheritance(
    userId: string,
    permission: string,
    context: PermissionContext
  ): Promise<boolean> {
    const hierarchy = await this.getPermissionHierarchy(permission);

    for (const perm of hierarchy) {
      if (await this.checkPermission(userId, perm, context)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check permission (internal method)
   */
  private async checkPermission(
    userId: string,
    permission: string,
    context: PermissionContext
  ): Promise<boolean> {
    // Check temporary permissions first
    if (this.hasTemporaryPermission(userId, permission, context)) {
      return true;
    }

    // Check dynamic permissions
    const dynamicPerms = await this.evaluateDynamicPermissions(userId, context);
    if (dynamicPerms.includes(permission)) {
      return true;
    }

    // Check static permissions via RBAC service
    return authService.hasPermission(permission);
  }
}

export const dynamicPermissionManager = new DynamicPermissionManager();
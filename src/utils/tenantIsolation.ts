/**
 * Tenant Isolation Utilities
 * 
 * Systematic approach to tenant isolation using database flags instead of hardcoded values.
 * This ensures consistency across all modules and layers.
 * 
 * ⚠️ CRITICAL: All tenant isolation logic should use these utilities, not hardcoded checks.
 */

import { authService } from '@/services/serviceFactory';
import { Permission, Role } from '@/types/rbac';
import { User } from '@/types/auth';

/**
 * Permission category constants
 */
export const PERMISSION_CATEGORIES = {
  CORE: 'core',
  MODULE: 'module',
  ADMINISTRATIVE: 'administrative',
  SYSTEM: 'system',
} as const;

/**
 * Check if current user is a super admin
 * Uses database-driven permission check, not hardcoded role name
 */
export function isSuperAdmin(user?: User | null): boolean {
  if (!user) {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return false;
    user = currentUser;
  }
  
  // Check both role and permission for robustness
  return (
    user.role === 'super_admin' || 
    authService.hasPermission('super_admin') ||
    (user as any).is_super_admin === true
  );
}

/**
 * Check if a role is a platform-level (system) role
 * Platform roles are identified by:
 * - is_system_role = true AND tenant_id IS NULL
 * OR
 * - name = 'super_admin' (fallback check, but prefer database flags)
 */
export function isPlatformRole(role: Role): boolean {
  // Primary check: system role with no tenant (platform-level)
  if (role.is_system_role === true && !role.tenant_id) {
    return true;
  }
  
  // Secondary check: explicit super_admin role name (for backward compatibility)
  // This should be removed once all roles are properly flagged in database
  if (role.name === 'super_admin' && role.is_system_role === true) {
    return true;
  }
  
  return false;
}

/**
 * Check if a permission is a platform-level (system) permission
 * Platform permissions are identified by:
 * - category = 'system'
 * OR
 * - is_system_permission = true
 */
export function isPlatformPermission(permission: Permission): boolean {
  // Primary check: system category
  if (permission.category === PERMISSION_CATEGORIES.SYSTEM) {
    return true;
  }
  
  // Secondary check: system permission flag
  if (permission.is_system_permission === true) {
    return true;
  }
  
  return false;
}

/**
 * Filter roles based on tenant isolation rules
 * - Super admins: See all roles
 * - Tenant admins: Only see roles for their tenant, excluding platform roles
 */
export function filterRolesByTenant(roles: Role[], user?: User | null): Role[] {
  if (!user) {
    user = authService.getCurrentUser();
  }
  
  if (!user) {
    return [];
  }
  
  const userIsSuperAdmin = isSuperAdmin(user);
  const userTenantId = user.tenantId;
  
  // Super admins see everything
  if (userIsSuperAdmin) {
    return roles;
  }
  
  // Tenant admins: Filter by tenant_id and exclude platform roles
  if (userTenantId) {
    return roles.filter(role => {
      // Must belong to user's tenant
      if (role.tenant_id !== userTenantId) {
        return false;
      }
      
      // Exclude platform-level roles
      if (isPlatformRole(role)) {
        return false;
      }
      
      return true;
    });
  }
  
  // User with no tenant: return empty (shouldn't happen, but handle gracefully)
  return [];
}

/**
 * Filter permissions based on tenant isolation rules
 * - Super admins: See all permissions
 * - Tenant admins: Only see tenant-level permissions (exclude platform permissions)
 */
export function filterPermissionsByTenant(
  permissions: Permission[],
  user?: User | null
): Permission[] {
  if (!user) {
    user = authService.getCurrentUser();
  }
  
  if (!user) {
    return [];
  }
  
  const userIsSuperAdmin = isSuperAdmin(user);
  
  // Super admins see everything
  if (userIsSuperAdmin) {
    return permissions;
  }
  
  // Tenant admins: Exclude platform-level permissions
  return permissions.filter(permission => !isPlatformPermission(permission));
}

/**
 * Validate if user can access a specific role
 * - Super admins: Can access any role
 * - Tenant admins: Can only access roles from their tenant (not platform roles)
 */
export function canAccessRole(role: Role, user?: User | null): boolean {
  if (!user) {
    user = authService.getCurrentUser();
  }
  
  if (!user) {
    return false;
  }
  
  const userIsSuperAdmin = isSuperAdmin(user);
  
  // Super admins can access any role
  if (userIsSuperAdmin) {
    return true;
  }
  
  // Tenant admins: Check tenant match and exclude platform roles
  if (user.tenantId) {
    // Must belong to user's tenant
    if (role.tenant_id !== user.tenantId) {
      return false;
    }
    
    // Cannot access platform roles
    if (isPlatformRole(role)) {
      return false;
    }
    
    return true;
  }
  
  return false;
}

/**
 * Validate if user can access a specific permission
 * - Super admins: Can access any permission
 * - Tenant admins: Can only access tenant-level permissions (not platform permissions)
 */
export function canAccessPermission(permission: Permission, user?: User | null): boolean {
  if (!user) {
    user = authService.getCurrentUser();
  }
  
  if (!user) {
    return false;
  }
  
  const userIsSuperAdmin = isSuperAdmin(user);
  
  // Super admins can access any permission
  if (userIsSuperAdmin) {
    return true;
  }
  
  // Tenant admins: Cannot access platform permissions
  return !isPlatformPermission(permission);
}

/**
 * Validate if user can create/modify a role
 * - Super admins: Can create/modify any role
 * - Tenant admins: Can only create/modify roles for their tenant (cannot create platform roles)
 */
export function canModifyRole(role: Partial<Role>, user?: User | null): boolean {
  if (!user) {
    user = authService.getCurrentUser();
  }
  
  if (!user) {
    return false;
  }
  
  const userIsSuperAdmin = isSuperAdmin(user);
  
  // Super admins can modify any role
  if (userIsSuperAdmin) {
    return true;
  }
  
  // Tenant admins: Cannot create/modify platform roles
  if (role.is_system_role === true && !role.tenant_id) {
    return false;
  }
  
  // Cannot create/modify super_admin role
  if (role.name === 'super_admin') {
    return false;
  }
  
  // Must belong to user's tenant
  if (user.tenantId && role.tenant_id && role.tenant_id !== user.tenantId) {
    return false;
  }
  
  return true;
}

/**
 * Get tenant-scoped query filters for roles
 * Returns Supabase query modifiers based on user's tenant isolation level
 */
export function getRoleQueryFilters(user?: User | null) {
  if (!user) {
    user = authService.getCurrentUser();
  }
  
  if (!user) {
    return {
      filterFn: (query: any) => query.eq('id', '00000000-0000-0000-0000-000000000000'), // Return nothing
      excludePlatformRoles: true,
    };
  }
  
  const userIsSuperAdmin = isSuperAdmin(user);
  const userTenantId = user.tenantId;
  
  if (userIsSuperAdmin) {
    // Super admins: No filtering
    return {
      filterFn: (query: any) => query,
      excludePlatformRoles: false,
    };
  }
  
  if (userTenantId) {
    // Tenant admins: Filter by tenant_id and exclude platform roles
    // Note: The actual filtering is done in getRoles() method, this is just metadata
    return {
      filterFn: (query: any) => query.eq('tenant_id', userTenantId),
      excludePlatformRoles: true,
      // Additional filter: exclude roles where is_system_role=true AND tenant_id IS NULL
      additionalFilter: (roles: Role[]) => roles.filter(role => !isPlatformRole(role)),
    };
  }
  
  // User with no tenant: return nothing
  return {
    filterFn: (query: any) => query.eq('id', '00000000-0000-0000-0000-000000000000'),
    excludePlatformRoles: true,
  };
}

/**
 * Get tenant-scoped query filters for permissions
 * Returns filter function based on user's tenant isolation level
 */
export function getPermissionQueryFilters(user?: User | null) {
  if (!user) {
    user = authService.getCurrentUser();
  }
  
  if (!user) {
    return {
      filterFn: (permissions: Permission[]) => [],
    };
  }
  
  const userIsSuperAdmin = isSuperAdmin(user);
  
  if (userIsSuperAdmin) {
    // Super admins: No filtering
    return {
      filterFn: (permissions: Permission[]) => permissions,
    };
  }
  
  // Tenant admins: Exclude platform permissions
  return {
    filterFn: (permissions: Permission[]) => filterPermissionsByTenant(permissions, user),
  };
}


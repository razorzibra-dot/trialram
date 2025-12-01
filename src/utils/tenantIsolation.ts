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
  // ✅ Database-driven: Only use database flags, no hardcoded role names
  // Platform roles are identified by: is_system_role = true AND tenant_id IS NULL
  return role.is_system_role === true && !role.tenant_id;
}

/**
 * Check if a permission is a platform-level (system) permission
 * Platform permissions are identified by:
 * - category = 'system'
 * OR
 * - is_system_permission = true
 */
export function isPlatformPermission(permission: Permission): boolean {
  // ✅ FIX: Only filter out permissions with category='system' (platform-level permissions)
  // is_system_permission=true means the permission is system-defined (built-in), 
  // but tenant admins can still see and assign these to roles
  // Only category='system' permissions are truly platform-level and should be hidden from tenant admins
  
  // Primary check: system category (these are always platform permissions)
  if (permission.category === PERMISSION_CATEGORIES.SYSTEM) {
    return true;
  }
  
  // Check for platform-level permission names (super admin only)
  // These are platform control permissions that should be hidden from tenant admins
  const platformPermissionNames = [
    'crm:platform:control:admin',
    'super_admin',
    'crm:platform:tenant:manage',
    'system_monitoring',
    'crm:system:platform:admin'
  ];
  if (platformPermissionNames.some(name => permission.name === name || permission.name.startsWith('platform:'))) {
    return true;
  }
  
  // ✅ FIX: is_system_permission=true alone does NOT mean platform permission
  // It just means the permission is system-defined (built-in), but tenant admins can use it
  // Only category='system' permissions are filtered out
  
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
  
  // ❌ REMOVED: Cannot create/modify super_admin role - violates database-driven principle
  // Instead, prevent modification of any system role (is_system_role = true)
  // This allows database-driven control without hardcoded role names
  
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

/**
 * ⚠️ SECURITY: Determine if tenant_id field should be visible in UI forms
 * 
 * **Security Rule**: Tenant users should NEVER see or be able to select tenant_id.
 * Only super admins can see/manage tenant_id fields.
 * 
 * **Rationale**: 
 * - Prevents data tampering and security breaches
 * - Tenant_id is automatically set from current user context in backend services
 * - Super admins need to see tenant_id for cross-tenant management
 * 
 * @param user - Current user (optional, will fetch from authService if not provided)
 * @returns true if tenant_id field should be visible (super admin only), false otherwise
 * 
 * @example
 * ```typescript
 * // In form component
 * const shouldShowTenantId = shouldShowTenantIdField();
 * 
 * {shouldShowTenantId && (
 *   <Form.Item name="tenantId" label="Tenant">
 *     <Select>...</Select>
 *   </Form.Item>
 * )}
 * ```
 */
export function shouldShowTenantIdField(user?: User | null): boolean {
  // Always hide for tenant users - only super admins can see tenant_id
  return isSuperAdmin(user);
}

/**
 * ⚠️ SECURITY: Get tenant_id value to use in forms (for super admins only)
 * 
 * For tenant users, this returns null and tenant_id should be set automatically
 * by backend services from current user context.
 * 
 * @param user - Current user (optional, will fetch from authService if not provided)
 * @param providedTenantId - Tenant ID provided in form data (for super admins)
 * @returns Tenant ID to use, or null if should be auto-set by backend
 */
export function getFormTenantId(user?: User | null, providedTenantId?: string | null): string | null {
  const currentUser = user || authService.getCurrentUser();
  
  // Super admins can specify tenant_id
  if (isSuperAdmin(currentUser)) {
    return providedTenantId || null;
  }
  
  // Tenant users: return null - backend will auto-set from current user context
  return null;
}

/**
 * ⚠️ SECURITY: Check if Organization section should be shown in forms
 * 
 * **Security Rule**: Organization section (tenant selection) should ONLY be visible to super admins.
 * Tenant users should NEVER see organization/tenant selection sections.
 * 
 * This function uses database-driven checks (isSuperAdmin) - no hardcoded role names.
 * 
 * @param user - Current user (optional, will fetch from authService if not provided)
 * @returns true if Organization section should be shown (super admins only), false otherwise
 * 
 * @example
 * ```typescript
 * // In form component
 * const showOrgSection = shouldShowOrganizationSection();
 * 
 * {showOrgSection && (
 *   <Card title="Organization">
 *     <Form.Item name="tenantId">...</Form.Item>
 *   </Card>
 * )}
 * ```
 */
export function shouldShowOrganizationSection(user?: User | null): boolean {
  // ✅ Database-driven: Uses isSuperAdmin which checks database flags, not hardcoded role names
  // Only super admins can see organization/tenant selection sections
  return isSuperAdmin(user);
}

/**
 * ⚠️ SECURITY: Check if user can access element permissions
 *
 * **Security Rule**: Users can only access element permissions for their tenant.
 * Super admins can access all element permissions.
 *
 * @param elementPermission - Element permission object
 * @param user - Current user (optional, will fetch from authService if not provided)
 * @returns true if user can access the element permission, false otherwise
 */
export function canAccessElementPermission(
  elementPermission: { tenantId: string },
  user?: User | null
): boolean {
  if (!user) {
    user = authService.getCurrentUser();
  }

  if (!user) {
    return false;
  }

  const userIsSuperAdmin = isSuperAdmin(user);

  // Super admins can access any element permission
  if (userIsSuperAdmin) {
    return true;
  }

  // Tenant users can only access element permissions for their tenant
  return user.tenantId === elementPermission.tenantId;
}

/**
 * ⚠️ SECURITY: Filter element permissions by tenant
 *
 * **Security Rule**: Automatically filter element permissions based on user's tenant access.
 * Super admins see all, tenant users see only their tenant's permissions.
 *
 * @param elementPermissions - Array of element permissions to filter
 * @param user - Current user (optional, will fetch from authService if not provided)
 * @returns Filtered array of element permissions
 */
export function filterElementPermissionsByTenant(
  elementPermissions: Array<{ tenantId: string }>,
  user?: User | null
): Array<{ tenantId: string }> {
  if (!user) {
    user = authService.getCurrentUser();
  }

  if (!user) {
    return [];
  }

  const userIsSuperAdmin = isSuperAdmin(user);

  // Super admins see everything
  if (userIsSuperAdmin) {
    return elementPermissions;
  }

  // Filter by tenant
  if (user.tenantId) {
    return elementPermissions.filter(perm => perm.tenantId === user.tenantId);
  }

  return [];
}

/**
 * ⚠️ SECURITY: Get tenant-scoped query filters for element permissions
 *
 * Returns Supabase query modifiers for element permissions based on user's tenant isolation level.
 *
 * @param user - Current user (optional, will fetch from authService if not provided)
 * @returns Query filter functions for element permissions
 */
export function getElementPermissionQueryFilters(user?: User | null) {
  if (!user) {
    user = authService.getCurrentUser();
  }

  if (!user) {
    return {
      filterFn: (query: any) => query.eq('id', '00000000-0000-0000-0000-000000000000'), // Return nothing
    };
  }

  const userIsSuperAdmin = isSuperAdmin(user);
  const userTenantId = user.tenantId;

  if (userIsSuperAdmin) {
    // Super admins: No filtering
    return {
      filterFn: (query: any) => query,
    };
  }

  if (userTenantId) {
    // Tenant users: Filter by tenant_id
    return {
      filterFn: (query: any) => query.eq('tenant_id', userTenantId),
    };
  }

  // User with no tenant: return nothing
  return {
    filterFn: (query: any) => query.eq('id', '00000000-0000-0000-0000-000000000000'),
  };
}


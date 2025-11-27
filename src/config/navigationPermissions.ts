/**
 * Navigation Permissions Configuration
 * 
 * Defines permission requirements and role-based access for all navigation items.
 * This configuration ensures navigation items are only visible to users with appropriate permissions.
 * 
 * @see src/utils/navigationFilter.ts for filtering logic
 * @see src/components/layout/EnterpriseLayout.tsx for implementation
 */

export interface NavigationPermission {
  /** Permission ID required to see this item */
  permission?: string;
  /** Role required to see this item */
  requiredRole?: string | string[];
  /** If true, user needs ANY of the listed permissions/roles */
  requireAny?: boolean;
}

export interface NavigationItemConfig extends NavigationPermission {
  key: string;
  label: string;
  /** Child navigation items for submenu groups */
  children?: NavigationItemConfig[];
  /** If true, this is a section group (divider) */
  isSection?: boolean;
}

/**
 * Complete navigation structure with permission annotations
 */
export const navigationConfig: NavigationItemConfig[] = [
  // ============================================
  // TENANT ITEMS - Available to tenant users only
  // ⚠️ CRITICAL: Super admins (role='super_admin') should NOT see these items
  // They have separate super-admin routes and should be isolated
  // ============================================
  {
    key: '/tenant/dashboard',
    label: 'Dashboard',
    permission: 'dashboard:view',
    requiredRole: ['admin', 'manager', 'agent', 'engineer', 'customer'],
  },
  {
    key: '/tenant/customers',
    label: 'Customers',
    permission: 'customers:manage',
    requiredRole: ['admin', 'manager', 'agent', 'engineer', 'customer'],
  },
  {
    key: '/tenant/sales',
    label: 'Sales',
    permission: 'sales:manage',
    requiredRole: ['admin', 'manager', 'agent', 'engineer', 'customer'],
  },
  {
    key: '/tenant/product-sales',
    label: 'Product Sales',
    permission: 'products:manage',
    requiredRole: ['admin', 'manager', 'agent', 'engineer', 'customer'],
  },
  {
    key: '/tenant/contracts',
    label: 'Contracts',
    permission: 'contracts:manage',
    requiredRole: ['admin', 'manager', 'agent', 'engineer', 'customer'],
  },
  {
    key: '/tenant/service-contracts',
    label: 'Service Contracts',
    permission: 'service_contracts:manage',
    requiredRole: ['admin', 'manager', 'agent', 'engineer', 'customer'],
  },
  {
    key: '/tenant/tickets',
    label: 'Support Tickets',
    permission: 'tickets:manage',
    requiredRole: ['admin', 'manager', 'agent', 'engineer', 'customer'],
  },
  {
    key: '/tenant/complaints',
    label: 'Complaints',
    permission: 'complaints:manage',
    requiredRole: ['admin', 'manager', 'agent', 'engineer', 'customer'],
  },
  {
    key: '/tenant/job-works',
    label: 'Job Works',
    permission: 'job_works:manage',
    requiredRole: ['admin', 'manager', 'user', 'engineer', 'customer'],
  },

  // ============================================
  // ADMINISTRATION SECTION - Tenant Admin only (NOT for super admins)
  // ⚠️ CRITICAL: Super admins have separate super-admin routes
  // They should NOT see these tenant admin items
  // ============================================
  {
    key: 'admin-section',
    label: 'Administration',
    isSection: true,
    requiredRole: 'admin',
  },
  {
    key: '/tenant/masters',
    label: 'Masters',
    permission: 'masters:read',
    requiredRole: 'admin',
    children: [
      {
        key: '/tenant/masters/companies',
        label: 'Companies',
        permission: 'companies:manage',
      },
      {
        key: '/tenant/masters/products',
        label: 'Products',
        permission: 'products:manage',
      },
    ],
  },
  {
    key: '/tenant/users',
    label: 'User Management',
    permission: 'users:manage',
    requiredRole: 'admin',
    children: [
      {
        key: '/tenant/users/list',
        label: 'Users',
        permission: 'users:manage',
      },
      {
        key: '/tenant/users/roles',
        label: 'Roles',
        permission: 'roles:manage',
      },
      {
        key: '/tenant/users/permissions',
        label: 'Permissions',
        permission: 'roles:manage',
      },
    ],
  },
  {
    key: '/tenant/configuration',
    label: 'Configuration',
    permission: 'settings:manage',
    requiredRole: 'admin',
    children: [
      {
        key: '/tenant/configuration/tenant',
        label: 'Tenant Settings',
        permission: 'settings:manage',
      },
      {
        key: '/tenant/configuration/pdf-templates',
        label: 'PDF Templates',
        permission: 'settings:manage',
      },
    ],
  },
  {
    key: '/tenant/notifications',
    label: 'Notifications',
    permission: 'settings:manage',
    requiredRole: 'admin',
  },
  {
    key: '/tenant/logs',
    label: 'Audit Logs',
    permission: 'view_audit_logs',
    requiredRole: 'admin',
  },

];

/**
 * Permission categories for organization and documentation
 */
export const permissionCategories = {
  core: {
    name: 'Core',
    description: 'Basic read/write/delete operations',
    permissions: ['read', 'write', 'delete'],
  },
  module: {
    name: 'Module',
    description: 'Module-specific operations',
    permissions: [
      'customers:read', 'customers:create', 'customers:update', 'customers:delete',
      'sales:read', 'sales:create', 'sales:update', 'sales:delete',
      'tickets:read', 'tickets:create', 'tickets:update', 'tickets:delete',
      'complaints:read', 'complaints:create', 'complaints:update', 'complaints:delete',
      'contracts:read', 'contracts:create', 'contracts:update', 'contracts:delete',
      'service_contracts:read', 'service_contracts:create', 'service_contracts:update', 'service_contracts:delete',
      'products:read', 'products:create', 'products:update', 'products:delete',
      'product_sales:read', 'product_sales:create', 'product_sales:update', 'product_sales:delete',
      'jobworks:read', 'jobworks:create', 'jobworks:update', 'jobworks:delete',
    ],
  },
  administrative: {
    name: 'Administrative',
    description: 'Administrative operations',
    permissions: [
      'users:read', 'users:create', 'users:update', 'users:delete',
      'roles:read', 'roles:create', 'roles:update', 'roles:delete',
      'analytics:view',
      'settings:read', 'settings:update',
      'companies:read', 'companies:update',
      'masters:read',
      'user_management:read',
      'dashboard:view',
    ],
  },
  system: {
    name: 'System',
    description: 'System-level operations',
    permissions: [
      'platform:admin',
      'system:admin',
      'tenants:manage',
      'system:monitor',
    ],
  },
};

/**
 * Role hierarchy for inheritance
 * Higher roles inherit permissions from lower roles
 */
export const roleHierarchy = {
  customer: 0,
  user: 1,
  engineer: 2,
  manager: 3,
  admin: 4,
};
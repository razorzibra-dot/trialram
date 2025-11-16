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
    permission: 'read',
    requiredRole: ['admin', 'manager', 'agent', 'engineer', 'customer'],
  },
  {
    key: '/tenant/customers',
    label: 'Customers',
    permission: 'manage_customers',
    requiredRole: ['admin', 'manager', 'agent', 'engineer', 'customer'],
  },
  {
    key: '/tenant/sales',
    label: 'Sales',
    permission: 'manage_sales',
    requiredRole: ['admin', 'manager', 'agent', 'engineer', 'customer'],
  },
  {
    key: '/tenant/product-sales',
    label: 'Product Sales',
    permission: 'manage_product_sales',
    requiredRole: ['admin', 'manager', 'agent', 'engineer', 'customer'],
  },
  {
    key: '/tenant/contracts',
    label: 'Contracts',
    permission: 'manage_contracts',
    requiredRole: ['admin', 'manager', 'agent', 'engineer', 'customer'],
  },
  {
    key: '/tenant/service-contracts',
    label: 'Service Contracts',
    permission: 'manage_service_contracts',
    requiredRole: ['admin', 'manager', 'agent', 'engineer', 'customer'],
  },
  {
    key: '/tenant/tickets',
    label: 'Support Tickets',
    permission: 'manage_tickets',
    requiredRole: ['admin', 'manager', 'agent', 'engineer', 'customer'],
  },
  {
    key: '/tenant/complaints',
    label: 'Complaints',
    permission: 'manage_complaints',
    requiredRole: ['admin', 'manager', 'agent', 'engineer', 'customer'],
  },
  {
    key: '/tenant/job-works',
    label: 'Job Works',
    permission: 'manage_job_works',
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
    permission: 'manage_companies',
    requiredRole: 'admin',
    children: [
      {
        key: '/tenant/masters/companies',
        label: 'Companies',
        permission: 'manage_companies',
      },
      {
        key: '/tenant/masters/products',
        label: 'Products',
        permission: 'manage_products',
      },
    ],
  },
  {
    key: '/tenant/users',
    label: 'User Management',
    permission: 'manage_users',
    requiredRole: 'admin',
    children: [
      {
        key: '/tenant/users/list',
        label: 'Users',
        permission: 'manage_users',
      },
      {
        key: '/tenant/users/roles',
        label: 'Roles',
        permission: 'manage_roles',
      },
      {
        key: '/tenant/users/permissions',
        label: 'Permissions',
        permission: 'manage_roles',
      },
    ],
  },
  {
    key: '/tenant/configuration',
    label: 'Configuration',
    permission: 'manage_settings',
    requiredRole: 'admin',
    children: [
      {
        key: '/tenant/configuration/tenant',
        label: 'Tenant Settings',
        permission: 'manage_settings',
      },
      {
        key: '/tenant/configuration/pdf-templates',
        label: 'PDF Templates',
        permission: 'manage_settings',
      },
    ],
  },
  {
    key: '/tenant/notifications',
    label: 'Notifications',
    permission: 'manage_settings',
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
      'manage_customers',
      'manage_sales',
      'manage_tickets',
      'manage_complaints',
      'manage_contracts',
      'manage_service_contracts',
      'manage_products',
      'manage_product_sales',
      'manage_job_works',
    ],
  },
  administrative: {
    name: 'Administrative',
    description: 'Administrative operations',
    permissions: [
      'manage_users',
      'manage_roles',
      'view_analytics',
      'manage_settings',
      'manage_companies',
    ],
  },
  system: {
    name: 'System',
    description: 'System-level operations',
    permissions: [
      'platform_admin',
      'super_admin',
      'manage_tenants',
      'system_monitoring',
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
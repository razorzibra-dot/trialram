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
  /** Route path for navigation */
  routePath?: string;
  /** Icon for the menu item */
  icon?: string;
  /** Sort order for display */
  sortOrder?: number;
}

/**
 * ⚠️ DEPRECATED: Hardcoded navigation config removed
 * 
 * Navigation items are now stored in the database (navigation_items table).
 * Use the `useNavigation()` hook to fetch navigation items from the database.
 * 
 * @deprecated Use `useNavigation()` hook instead
 * @see src/hooks/useNavigation.ts
 * @see src/services/navigation/navigationService.ts
 * 
 * Migration path:
 * - Replace `import { navigationConfig } from '@/config/navigationPermissions'` 
 * - With `const { configItems } = useNavigation()`
 * - Use `configItems` instead of `navigationConfig`
 */
export const navigationConfig: NavigationItemConfig[] = [];

/**
 * ⚠️ DEPRECATED: Hardcoded permission categories removed
 * 
 * Permission categories and permission lists should be fetched from the database.
 * All permissions are stored in the `permissions` table with a `category` column.
 * 
 * To get permissions by category:
 * - Use `rbacService.getPermissions()` to fetch all permissions from database
 * - Filter by `category` field: 'core', 'module', 'administrative', 'system'
 * - Or use `rbacService.getPermissionsByCategory(category)` if available
 * 
 * @deprecated Use database-driven permissions via `rbacService.getPermissions()`
 * @see src/services/rbac/rbacService.ts
 * @see src/services/rbac/supabase/rbacService.ts
 * 
 * Migration path:
 * - Replace `import { permissionCategories } from '@/config/navigationPermissions'`
 * - With `const permissions = await rbacService.getPermissions()`
 * - Filter by category: `permissions.filter(p => p.category === 'module')`
 */

/**
 * ⚠️ DEPRECATED: Role hierarchy removed - use database-driven approach
 * 
 * Role hierarchy should be fetched from database (roles table with hierarchy_level column).
 * For now, navigation uses permission-based checks only, which are fully database-driven.
 * 
 * If hierarchy is needed in the future, add a hierarchy_level column to roles table
 * and fetch it dynamically via rbacService.getRoles().
 * 
 * @deprecated Use permission-based checks instead (database-driven)
 */
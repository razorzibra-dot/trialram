/**
 * Navigation Filter Utility
 * 
 * Provides functions to filter navigation items based on user permissions and roles.
 * This ensures that users can only see navigation items they have access to.
 * 
 * Features:
 * - Permission-based filtering
 * - Role-based filtering
 * - Nested item filtering (children)
 * - Dynamic section visibility (only shows if children are visible)
 * - Caching for performance
 * 
 * @see src/config/navigationPermissions.ts for navigation configuration
 */

import { NavigationItemConfig } from '@/config/navigationPermissions';

/**
 * Navigation filter context
 * Contains user permissions and roles for filtering decisions
 */
export interface NavigationFilterContext {
  /** User's current role */
  userRole: string;
  /** Permissions assigned to user */
  userPermissions: string[];
  /** Function to check if user has a permission */
  hasPermission: (permission: string) => boolean;
  /** Function to check if user has a role */
  hasRole: (role: string | string[]) => boolean;
}

/**
 * Filter result with visibility information
 */
export interface FilteredNavigationItem extends NavigationItemConfig {
  /** Whether this item is visible to the user */
  isVisible: boolean;
  /** Whether any of this item's children are visible */
  hasVisibleChildren: boolean;
  /** Filtered children array (only visible children) */
  filteredChildren?: FilteredNavigationItem[];
}

/**
 * Check if an item should be visible based on permissions and roles
 * 
 * @param item - Navigation item to check
 * @param context - Navigation filter context with user permissions/roles
 * @returns true if the item should be visible
 * 
 * @example
 * const isVisible = isItemVisible(dashboardItem, {
 *   userRole: 'admin',
 *   userPermissions: ['read', 'manage_users'],
 *   hasPermission: (p) => userPermissions.includes(p),
 *   hasRole: (r) => r === userRole,
 * });
 */
export function isItemVisible(
  item: NavigationItemConfig,
  context: NavigationFilterContext
): boolean {
  // Section items are visible if they have visible children
  if (item.isSection) {
    return true; // Will be filtered based on children visibility
  }

  // Check role requirement
  if (item.requiredRole) {
    if (!context.hasRole(item.requiredRole)) {
      return false;
    }
  }

  // Check permission requirement
  if (item.permission) {
    if (!context.hasPermission(item.permission)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if an item has visible children
 * 
 * @param item - Navigation item with potential children
 * @param context - Navigation filter context
 * @returns true if any children are visible
 */
export function hasVisibleChildren(
  item: NavigationItemConfig,
  context: NavigationFilterContext
): boolean {
  if (!item.children || item.children.length === 0) {
    return false;
  }

  return item.children.some((child) => isItemVisible(child, context));
}

/**
 * Filter and prepare navigation items for rendering
 * 
 * Recursively filters navigation items based on permissions and roles.
 * Only includes items the user has access to.
 * Dynamic sections only appear if they have visible children.
 * 
 * @param items - Navigation items to filter
 * @param context - Navigation filter context
 * @returns Filtered navigation items with visibility information
 * 
 * @example
 * const filteredItems = filterNavigationItems(navigationConfig, {
 *   userRole: 'admin',
 *   userPermissions: ['read', 'manage_users'],
 *   hasPermission: (p) => userPermissions.includes(p),
 *   hasRole: (r) => r === userRole,
 * });
 * 
 * // Only render items where isVisible === true
 * const visibleItems = filteredItems.filter(item => item.isVisible);
 */
export function filterNavigationItems(
  items: NavigationItemConfig[],
  context: NavigationFilterContext
): FilteredNavigationItem[] {
  return items
    .map((item) => {
      // Check if item is visible
      const isVisible = isItemVisible(item, context);

      // Filter children if they exist
      const filteredChildren = item.children
        ? filterNavigationItems(item.children, context)
        : [];

      // Check if any children are visible
      const childVisibility = filteredChildren.filter((c) => c.isVisible);
      const hasVisibleChildItems = childVisibility.length > 0;

      // For section items, visibility depends on having visible children
      const finalIsVisible = item.isSection ? hasVisibleChildItems : isVisible;

      return {
        ...item,
        isVisible: finalIsVisible,
        hasVisibleChildren: hasVisibleChildItems,
        filteredChildren: filteredChildren.length > 0 ? filteredChildren : undefined,
      };
    })
    .filter((item) => item.isVisible);
}

/**
 * Get navigation path breadcrumbs with permission checking
 * 
 * @param pathname - Current route pathname
 * @param items - Navigation items to search
 * @param context - Navigation filter context
 * @returns Breadcrumb items including only those user has access to
 */
export function getPermissionAwareBreadcrumbs(
  pathname: string,
  items: NavigationItemConfig[],
  context: NavigationFilterContext
): Array<{ key: string; label: string; href?: string }> {
  const breadcrumbs: Array<{ key: string; label: string; href?: string }> = [
    { key: 'home', label: 'Home', href: '/' },
  ];

  function findPath(
    currentItems: NavigationItemConfig[],
    path: string
  ): NavigationItemConfig[] | null {
    for (const item of currentItems) {
      if (item.key === path) {
        return [item];
      }

      if (item.children) {
        const childPath = findPath(item.children, path);
        if (childPath) {
          return [item, ...childPath];
        }
      }
    }

    return null;
  }

  const path = findPath(items, pathname);

  if (path) {
    path.forEach((item) => {
      if (!item.isSection && isItemVisible(item, context)) {
        breadcrumbs.push({
          key: item.key,
          label: item.label,
          href: item.key.startsWith('/') ? item.key : undefined,
        });
      }
    });
  }

  return breadcrumbs;
}

/**
 * Get all visible navigation items (flat list)
 * Useful for search or filtering
 * 
 * @param items - Navigation items
 * @param context - Navigation filter context
 * @returns Flat array of all visible items
 */
export function getAllVisibleItems(
  items: NavigationItemConfig[],
  context: NavigationFilterContext
): NavigationItemConfig[] {
  const visible: NavigationItemConfig[] = [];

  function collect(currentItems: NavigationItemConfig[]) {
    for (const item of currentItems) {
      if (isItemVisible(item, context) && !item.isSection) {
        visible.push(item);
      }

      if (item.children) {
        collect(item.children);
      }
    }
  }

  collect(items);
  return visible;
}

/**
 * Create a navigation filter context from auth data
 * 
 * Helper function to create the context object needed for filtering.
 * 
 * @param userRole - User's role
 * @param userPermissions - User's permissions
 * @returns Navigation filter context
 */
export function createNavigationFilterContext(
  userRole: string,
  userPermissions: string[]
): NavigationFilterContext {
  return {
    userRole,
    userPermissions,
    hasPermission: (permission: string): boolean => {
      return userPermissions.includes(permission);
    },
    hasRole: (role: string | string[]): boolean => {
      if (Array.isArray(role)) {
        return role.includes(userRole);
      }
      return role === userRole;
    },
  };
}

/**
 * Validate that a user can access a specific navigation item
 * 
 * @param itemKey - Navigation item key to validate
 * @param items - Navigation items to search
 * @param context - Navigation filter context
 * @returns true if user can access the item
 */
export function canAccessNavigationItem(
  itemKey: string,
  items: NavigationItemConfig[],
  context: NavigationFilterContext
): boolean {
  function search(currentItems: NavigationItemConfig[]): boolean {
    for (const item of currentItems) {
      if (item.key === itemKey) {
        return isItemVisible(item, context);
      }

      if (item.children && search(item.children)) {
        return true;
      }
    }

    return false;
  }

  return search(items);
}
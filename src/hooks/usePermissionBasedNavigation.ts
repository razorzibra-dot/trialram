/**
 * Permission-Based Navigation Hook
 * 
 * Provides convenient access to permission-filtered navigation items.
 * Use this hook in components that need to display navigation based on permissions.
 * 
 * @see src/utils/navigationFilter.ts for filtering logic
 * @see src/config/navigationPermissions.ts for navigation configuration
 * 
 * @example
 * ```tsx
 * const { filteredItems, isVisible, hasAccess } = usePermissionBasedNavigation();
 * 
 * return (
 *   <nav>
 *     {filteredItems.map(item => (
 *       <a key={item.key} href={item.key} style={{
 *         display: item.isVisible ? 'block' : 'none'
 *       }}>
 *         {item.label}
 *       </a>
 *     ))}
 *   </nav>
 * );
 * ```
 */

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { navigationConfig } from '@/config/navigationPermissions';
import {
  filterNavigationItems,
  createNavigationFilterContext,
  canAccessNavigationItem,
  getAllVisibleItems,
  getPermissionAwareBreadcrumbs,
  FilteredNavigationItem,
  NavigationFilterContext,
} from '@/utils/navigationFilter';

interface UsePermissionBasedNavigationResult {
  /** Filtered navigation items based on user permissions */
  filteredItems: FilteredNavigationItem[];
  /** Get user permissions based on their role */
  getUserPermissions: (role: string) => string[];
  /** Check if a specific navigation item is visible */
  isItemVisible: (itemKey: string) => boolean;
  /** Check if user has access to a navigation item */
  canAccess: (itemKey: string) => boolean;
  /** Get all visible navigation items (flat list) */
  visibleItems: FilteredNavigationItem[];
  /** Get breadcrumbs for current path */
  breadcrumbs: Array<{ key: string; label: string; href?: string }>;
  /** Filter context for advanced usage */
  filterContext: NavigationFilterContext;
}

/**
 * Hook to get permission-filtered navigation items
 * 
 * Integrates with AuthContext to filter navigation based on user permissions and roles.
 * Results are memoized to avoid unnecessary recalculations.
 * 
 * @returns Object containing filtered items and utility functions
 * 
 * @throws Error if useAuth is called outside AuthProvider context
 */
export function usePermissionBasedNavigation(): UsePermissionBasedNavigationResult {
  const { user, hasPermission, hasRole, getUserPermissions } = useAuth();

  // Use DB-driven permissions via AuthContext

  /**
   * Create filter context from user data
   */
  const filterContext = useMemo(() => {
    if (!user) {
      return createNavigationFilterContext('customer', ['read']);
    }
    const userPermissions = getUserPermissions();
    return createNavigationFilterContext(user.role, userPermissions);
  }, [user]);

  /**
   * Get filtered navigation items
   */
  const filteredItems = useMemo(() => {
    return filterNavigationItems(navigationConfig, filterContext);
  }, [filterContext]);

  /**
   * Get all visible items (flat list)
   */
  const visibleItems = useMemo(() => {
    return getAllVisibleItems(navigationConfig, filterContext);
  }, [filterContext]);

  /**
   * Get breadcrumbs for current path
   */
  const breadcrumbs = useMemo(() => {
    if (typeof window === 'undefined') return [];
    const pathname = window.location.pathname;
    return getPermissionAwareBreadcrumbs(pathname, navigationConfig, filterContext);
  }, [filterContext]);

  /**
   * Check if an item is visible
   */
  const isItemVisible = (itemKey: string): boolean => {
    return filteredItems.some((item) => item.key === itemKey && item.isVisible);
  };

  /**
   * Check if user can access an item
   */
  const canAccess = (itemKey: string): boolean => {
    return canAccessNavigationItem(itemKey, navigationConfig, filterContext);
  };

  return {
    filteredItems,
    getUserPermissions,
    isItemVisible,
    canAccess,
    visibleItems,
    breadcrumbs,
    filterContext,
  };
}

/**
 * Hook to check if user can access a specific navigation item
 * 
 * @param itemKey - Navigation item key to check
 * @returns true if user can access the item
 * 
 * @example
 * ```tsx
 * if (useCanAccessNavItem('/tenant/users')) {
 *   return <UserManagementLink />;
 * }
 * ```
 */
export function useCanAccessNavItem(itemKey: string): boolean {
  const { canAccess } = usePermissionBasedNavigation();
  return canAccess(itemKey);
}

/**
 * Hook to get visible navigation items of a specific type
 * 
 * @param category - Navigation category (e.g., 'admin', 'common')
 * @returns Filtered items matching the category
 * 
 * @example
 * ```tsx
 * const adminItems = useVisibleNavItems('admin');
 * ```
 */
export function useVisibleNavItems(category?: string): FilteredNavigationItem[] {
  const { filteredItems } = usePermissionBasedNavigation();

  return useMemo(() => {
    if (!category) return filteredItems;

    // Filter by category if needed
    // This is a basic example - extend based on your needs
    const categoryKeywords = {
      admin: ['admin', 'users', 'configuration', 'settings'],
      common: ['dashboard', 'customers', 'sales'],
      superadmin: ['super-admin', 'tenants'],
    };

    const keywords = categoryKeywords[category as keyof typeof categoryKeywords] || [];

    return filteredItems.filter((item) =>
      keywords.some((keyword) => item.key?.toLowerCase().includes(keyword))
    );
  }, [filteredItems, category]);
}

/**
 * Hook to get navigation breadcrumbs
 * 
 * @returns Array of breadcrumb items for current path
 * 
 * @example
 * ```tsx
 * const breadcrumbs = useNavBreadcrumbs();
 * return <Breadcrumb items={breadcrumbs} />;
 * ```
 */
export function useNavBreadcrumbs(): Array<{ key: string; label: string; href?: string }> {
  const { breadcrumbs } = usePermissionBasedNavigation();
  return breadcrumbs;
}
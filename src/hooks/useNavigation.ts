/**
 * Navigation Hook
 * Fetches navigation items from database and provides filtering based on permissions
 * ✅ Database-driven: All navigation items come from navigation_items table
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { navigationService } from '@/services/serviceFactory';
import { NavigationItem, NavigationItemConfig, buildNavigationHierarchy, mapNavigationItemToConfig } from '@/types/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createNavigationFilterContext, filterNavigationItems, FilteredNavigationItem } from '@/utils/navigationFilter';

export interface UseNavigationResult {
  /** Raw navigation items from database */
  items: NavigationItem[];
  /** Hierarchical navigation structure */
  hierarchicalItems: NavigationItem[];
  /** Navigation items as config format (for compatibility) */
  configItems: NavigationItemConfig[];
  /** Filtered navigation items based on user permissions */
  filteredItems: FilteredNavigationItem[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Refetch function */
  refetch: () => void;
}

/**
 * Hook to fetch and filter navigation items from database
 * ✅ Database-driven: Fetches from navigation_items table
 * ✅ Permission-aware: Filters based on user's permissions
 */
export function useNavigation(): UseNavigationResult {
  const { user, getUserPermissions } = useAuth();

  // Fetch navigation items from database
  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery<NavigationItem[]>({
    queryKey: ['navigation-items', user?.tenantId],
    queryFn: async () => {
      console.log('[useNavigation] 🔄 Fetching navigation items from database...');
      const navItems = await navigationService.getNavigationItems();
      console.log(`[useNavigation] 📦 Fetched ${navItems.length} navigation items from database`);
      navItems.forEach(item => {
        console.log(`[useNavigation] 📋 Item: "${item.label}" (key: ${item.key}, permission: ${item.permissionName})`);
      });
      return navItems;
    },
    enabled: !!user, // Only fetch when user is authenticated
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Build hierarchical structure
  const hierarchicalItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return buildNavigationHierarchy(items);
  }, [items]);

  // Convert to config format for compatibility
  const configItems = useMemo(() => {
    if (!hierarchicalItems || hierarchicalItems.length === 0) return [];
    return hierarchicalItems.map(mapNavigationItemToConfig);
  }, [hierarchicalItems]);

  // Filter based on user permissions
  const filteredItems = useMemo(() => {
    if (!user || !configItems || configItems.length === 0) {
      console.log('[useNavigation] ⚠️ Cannot filter navigation: user, configItems, or permissions missing');
      return [];
    }

    const userPermissions = getUserPermissions();
    console.log(`[useNavigation] 🔐 User permissions for filtering:`, userPermissions);
    console.log(`[useNavigation] 👤 User role: ${user.role}`);

    const filterContext = createNavigationFilterContext(user.role, userPermissions);
    console.log('[useNavigation] 🎯 Starting navigation filtering...');

    const filtered = filterNavigationItems(configItems, filterContext);
    console.log(`[useNavigation] ✅ Navigation filtering complete: ${filtered.length} items visible`);

    return filtered;
  }, [user, configItems, getUserPermissions]);

  return {
    items,
    hierarchicalItems,
    configItems,
    filteredItems,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}


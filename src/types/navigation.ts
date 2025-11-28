/**
 * Navigation Types
 * 
 * Types for database-driven navigation system
 * Matches navigation_items table schema (snake_case → camelCase)
 */

export interface NavigationItem {
  id: string;
  key: string;
  label: string;
  parentId: string | null;
  permissionName: string | null;
  isSection: boolean;
  sortOrder: number;
  icon: string | null;
  routePath: string | null;
  tenantId: string | null;
  isSystemItem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  // Computed fields (not in DB)
  children?: NavigationItem[];
}

/**
 * Navigation item configuration for UI
 * Extends NavigationItem with permission checking
 */
export interface NavigationItemConfig {
  key: string;
  label: string;
  permission?: string;
  requiredRole?: string | string[];
  requireAny?: boolean;
  children?: NavigationItemConfig[];
  isSection?: boolean;
  routePath?: string;
  icon?: string;
  sortOrder?: number;
}

/**
 * Create NavigationItemConfig from NavigationItem
 */
export function mapNavigationItemToConfig(item: NavigationItem): NavigationItemConfig {
  return {
    key: item.key,
    label: item.label,
    permission: item.permissionName || undefined,
    isSection: item.isSection,
    routePath: item.routePath || undefined,
    icon: item.icon || undefined,
    sortOrder: item.sortOrder,
    children: item.children?.map(mapNavigationItemToConfig),
  };
}

/**
 * Build hierarchical navigation structure from flat list
 */
export function buildNavigationHierarchy(items: NavigationItem[]): NavigationItem[] {
  // Create a map of items by ID
  const itemMap = new Map<string, NavigationItem>();
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Build hierarchy
  const rootItems: NavigationItem[] = [];
  items.forEach(item => {
    const mappedItem = itemMap.get(item.id)!;
    if (item.parentId) {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(mappedItem);
      } else {
        // Parent not found, treat as root
        rootItems.push(mappedItem);
      }
    } else {
      rootItems.push(mappedItem);
    }
  });

  // Sort by sortOrder
  const sortItems = (items: NavigationItem[]) => {
    items.sort((a, b) => a.sortOrder - b.sortOrder);
    items.forEach(item => {
      if (item.children) {
        sortItems(item.children);
      }
    });
  };

  sortItems(rootItems);
  return rootItems;
}


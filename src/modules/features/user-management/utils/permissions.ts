import { Permission } from '@/types/rbac';

/**
 * Group permissions by their category.
 * Returns a record where keys are category names and values are arrays of permissions.
 */
export function groupPermissionsByCategory(
  permissions: Permission[]
): Record<string, Permission[]> {
  return permissions.reduce((acc, permission) => {
    const category = permission.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
}

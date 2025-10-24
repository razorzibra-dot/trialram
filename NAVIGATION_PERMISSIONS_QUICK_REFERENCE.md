# Permission-Based Navigation - Quick Reference

## Quick Start

### 1. Use in a Component

```typescript
import { usePermissionBasedNavigation } from '@/hooks/usePermissionBasedNavigation';

function MyComponent() {
  const { filteredItems, canAccess } = usePermissionBasedNavigation();

  return (
    <>
      {filteredItems.map(item => (
        <div key={item.key}>
          {item.label}
          {item.hasVisibleChildren && (
            <ul>
              {item.filteredChildren?.map(child => (
                <li key={child.key}>{child.label}</li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {canAccess('/tenant/users') && (
        <AdminLink />
      )}
    </>
  );
}
```

### 2. Add New Navigation Item

Edit `src/config/navigationPermissions.ts`:

```typescript
{
  key: '/tenant/new-feature',
  label: 'New Feature',
  permission: 'manage_new_feature',  // Add permission
  requiredRole: 'admin',              // Optional: restrict by role
  children: [
    {
      key: '/tenant/new-feature/sub',
      label: 'Sub Item',
      permission: 'manage_new_feature',
    }
  ]
}
```

### 3. Check User Access

```typescript
import { useCanAccessNavItem } from '@/hooks/usePermissionBasedNavigation';

function AdminSection() {
  const canAccess = useCanAccessNavItem('/tenant/users');

  if (!canAccess) return <AccessDenied />;
  return <AdminPanel />;
}
```

## Key Concepts

### Visibility Rules

1. **Permission Required**: User must have the permission
2. **Role Required**: User must have the role (if specified)
3. **Section Visibility**: Section only shows if children are visible
4. **Child Filtering**: Children are recursively filtered

### Permission Levels

```
core        → read, write, delete
module      → manage_customers, manage_sales, etc.
admin       → manage_users, manage_roles, manage_settings
system      → super_admin, manage_tenants, platform_admin
```

### Role Hierarchy

```
customer < agent < engineer < manager < admin < super_admin
```

## Common Scenarios

### Admin Navigation Only

```typescript
{
  key: '/admin-only',
  label: 'Admin Only',
  requiredRole: 'admin',              // Only admin sees this
  permission: 'manage_settings',      // Must have permission
}
```

### Multiple Roles Allowed

```typescript
{
  key: '/multi-role',
  label: 'Available to Admins & Managers',
  requiredRole: ['admin', 'manager'], // Either role can see
  permission: 'manage_sales',
}
```

### Dynamic Section (Shows Only if Children Visible)

```typescript
{
  key: 'admin-section',
  label: 'Administration',
  isSection: true,                    // Dynamic visibility
  requiredRole: 'admin',
  children: [
    { key: '/users', label: 'Users', permission: 'manage_users' },
    { key: '/roles', label: 'Roles', permission: 'manage_roles' },
  ]
}
```

### Hide Section from Non-Admins

```typescript
// Users without 'admin' role won't see this section at all
{
  key: 'admin-section',
  label: 'Administration',
  isSection: true,
  requiredRole: 'admin',  // Filters entire section
  children: [ ... ]
}
```

## Testing & Debugging

### Run Tests

```typescript
import { runNavigationFilterTests } from '@/utils/navigationFilterTests';
runNavigationFilterTests();  // Outputs to console
```

### Check User Permissions

```typescript
import { useAuth } from '@/contexts/AuthContext';

function DebugComponent() {
  const { user, hasPermission, hasRole } = useAuth();

  console.log('User Role:', user?.role);
  console.log('Can manage users:', hasPermission('manage_users'));
  console.log('Is admin:', hasRole('admin'));
}
```

### Validate Configuration

```typescript
import { validateNavigationConfig } from '@/utils/navigationFilterTests';

const issues = validateNavigationConfig();
if (issues.length > 0) {
  console.warn('Navigation config issues:', issues);
}
```

### Get Filtered Items in Console

```typescript
import { filterNavigationItems, createNavigationFilterContext } from '@/utils/navigationFilter';
import { navigationConfig } from '@/config/navigationPermissions';

const context = createNavigationFilterContext('admin', ['manage_users', 'manage_settings']);
const filtered = filterNavigationItems(navigationConfig, context);
console.table(filtered);
```

## Files Changed/Created

### New Files
- ✅ `src/config/navigationPermissions.ts` - Navigation configuration
- ✅ `src/utils/navigationFilter.ts` - Filtering logic
- ✅ `src/utils/navigationFilterTests.ts` - Test suite
- ✅ `src/hooks/usePermissionBasedNavigation.ts` - React hook
- ✅ `PERMISSION_BASED_NAVIGATION.md` - Full documentation

### Modified Files
- ✅ `src/components/layout/EnterpriseLayout.tsx` - Integration

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Item not appearing | Check permission in navigationConfig |
| Wrong items visible | Verify role in createNavigationFilterContext |
| Section always hidden | Check child permissions - section only shows if children visible |
| Breadcrumbs not working | Verify items have proper permissions |
| Performance slow | Check React DevTools, ensure proper memoization |

## API Reference

### usePermissionBasedNavigation()

```typescript
const {
  filteredItems,           // FilteredNavigationItem[] - visible items
  getUserPermissions,      // (role: string) => string[]
  isItemVisible,          // (itemKey: string) => boolean
  canAccess,              // (itemKey: string) => boolean
  visibleItems,           // FilteredNavigationItem[] - flat list
  breadcrumbs,            // Array<{ key, label, href? }>
  filterContext,          // NavigationFilterContext
} = usePermissionBasedNavigation();
```

### useCanAccessNavItem(itemKey)

```typescript
const canAccess = useCanAccessNavItem('/tenant/users');
// boolean
```

### useVisibleNavItems(category?)

```typescript
const items = useVisibleNavItems('admin');
// FilteredNavigationItem[]
```

### useNavBreadcrumbs()

```typescript
const breadcrumbs = useNavBreadcrumbs();
// Array<{ key, label, href? }>
```

## Navigation Config Template

```typescript
{
  // Unique identifier
  key: '/path/to/item',
  
  // Display label
  label: 'Item Label',
  
  // Required permission (optional)
  permission: 'permission_id',
  
  // Required role (optional)
  requiredRole: 'admin' | ['admin', 'manager'],
  
  // Is this a section group? (optional)
  isSection: true,
  
  // Child items (optional)
  children: [
    { key: '...', label: '...', permission: '...' },
  ],
}
```

## Integration Checklist

- [ ] Review `src/config/navigationPermissions.ts`
- [ ] Update permissions for your navigation items
- [ ] Test with different roles
- [ ] Run test suite: `runNavigationFilterTests()`
- [ ] Check all expected items appear for each role
- [ ] Verify sections show/hide correctly
- [ ] Test breadcrumbs
- [ ] Check performance with React DevTools
- [ ] Deploy to staging
- [ ] Deploy to production

## Support & Questions

1. See `PERMISSION_BASED_NAVIGATION.md` for full documentation
2. Check `src/utils/navigationFilterTests.ts` for examples
3. Review component source code
4. Run validation: `validateNavigationConfig()`

---

**Status**: ✅ Production-Ready  
**Last Updated**: 2024  
**Version**: 1.0.0
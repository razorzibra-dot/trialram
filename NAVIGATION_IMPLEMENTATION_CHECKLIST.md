# Permission-Based Navigation Implementation Checklist

## For Development Teams

Use this checklist when implementing permission-based navigation features.

---

## 📋 Pre-Implementation Review

- [ ] Read `PERMISSION_BASED_NAVIGATION.md` (complete guide)
- [ ] Read `NAVIGATION_PERMISSIONS_QUICK_REFERENCE.md` (quick start)
- [ ] Review `src/config/navigationPermissions.ts` (structure)
- [ ] Review `src/hooks/usePermissionBasedNavigation.ts` (hook API)
- [ ] Run existing tests: `npm run test` or `runNavigationFilterTests()`

---

## 🔧 Adding New Navigation Items

### Preparation
- [ ] Identify permission requirement
- [ ] Determine if role restriction needed
- [ ] Check if this is a submenu or top-level item
- [ ] Verify permission exists in permission list

### Implementation
- [ ] Open `src/config/navigationPermissions.ts`
- [ ] Find appropriate section (common, admin, superadmin)
- [ ] Add new item with structure:
  ```typescript
  {
    key: '/path/to/item',
    label: 'Display Name',
    permission: 'permission_id',
    requiredRole: 'admin',  // if needed
    children: [ /* if submenu */ ]
  }
  ```
- [ ] Ensure unique `key`
- [ ] Verify permission ID is correct
- [ ] Check role name matches defined roles

### Testing
- [ ] Run tests: `runNavigationFilterTests()`
- [ ] Manually test with different roles
- [ ] Verify item appears for authorized users
- [ ] Verify item hidden from unauthorized users
- [ ] Check console for errors

### Validation
- [ ] Run: `validateNavigationConfig()`
- [ ] No duplicate key warnings
- [ ] Permission exists
- [ ] Role is valid

---

## 🎨 Using Navigation in Components

### Display Navigation Menu
- [ ] Import hook: `usePermissionBasedNavigation`
- [ ] Get filtered items: `const { filteredItems } = ...`
- [ ] Map items to UI components
- [ ] Handle nested children with `filteredChildren`
- [ ] Show sections only if `hasVisibleChildren`

Example:
```typescript
const { filteredItems } = usePermissionBasedNavigation();

{filteredItems.map(item => (
  <div key={item.key}>
    <Link href={item.key}>{item.label}</Link>
    {item.hasVisibleChildren && (
      <ul>
        {item.filteredChildren?.map(child => (
          <li key={child.key}>
            <Link href={child.key}>{child.label}</Link>
          </li>
        ))}
      </ul>
    )}
  </div>
))}
```

### Check Access to Specific Item
- [ ] Import: `useCanAccessNavItem`
- [ ] Call with item key: `const canAccess = useCanAccessNavItem('/path')`
- [ ] Use boolean result to show/hide feature

Example:
```typescript
const canViewUsers = useCanAccessNavItem('/tenant/users');

if (!canViewUsers) {
  return <AccessDenied />;
}

return <UsersPanel />;
```

### Get Breadcrumbs
- [ ] Import: `useNavBreadcrumbs`
- [ ] Get breadcrumbs: `const breadcrumbs = useNavBreadcrumbs()`
- [ ] Use with Breadcrumb component

Example:
```typescript
import { Breadcrumb } from 'antd';
const breadcrumbs = useNavBreadcrumbs();
return <Breadcrumb items={breadcrumbs} />;
```

---

## 👥 Role & Permission Setup

### Define Role Permissions

Edit role permission map in layout or hook:

- [ ] Map role to permissions array
- [ ] Use standard permission names
- [ ] Ensure completeness (all needed permissions included)

```typescript
const rolePermissionMap = {
  custom_role: [
    'read',
    'write',
    'manage_customers',
    // ... all needed permissions
  ]
}
```

### Permission Categories

Use consistent permission prefixes:

- [ ] `read`, `write`, `delete` (core)
- [ ] `manage_*` (module operations)
- [ ] Custom permissions for specific features

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Run full test suite
- [ ] All tests pass
- [ ] No warnings

Command:
```typescript
import { runNavigationFilterTests } from '@/utils/navigationFilterTests';
runNavigationFilterTests();
```

### Manual Testing by Role

For each role, verify:

- [ ] **super_admin**: All items visible
- [ ] **admin**: Admin section visible, super-admin section hidden
- [ ] **manager**: Limited admin features visible
- [ ] **agent**: Only customer-facing items visible
- [ ] **customer**: Only read-only content visible

### Specific Scenarios

- [ ] Sections show/hide correctly
- [ ] Nested items are properly indented
- [ ] Breadcrumbs work for all items
- [ ] Back button works
- [ ] Menu item clicks navigate correctly

### Browser Console

- [ ] No errors logged
- [ ] No warnings logged
- [ ] Permission validation passes

---

## 🔍 Debugging

### Items Not Appearing

1. [ ] Check permission in config
2. [ ] Verify user has permission
3. [ ] Run: `runNavigationFilterTests()`
4. [ ] Log filtered items:
   ```typescript
   const { filteredItems } = usePermissionBasedNavigation();
   console.log('Filtered items:', filteredItems);
   ```

### Section Not Showing

1. [ ] Check child permissions
2. [ ] Verify children are visible
3. [ ] Sections only show if children visible
4. [ ] Log:
   ```typescript
   const section = navigationConfig.find(i => i.key === 'your-section');
   console.log('Section visible:', section.isVisible);
   console.log('Visible children:', section.filteredChildren?.length);
   ```

### Wrong Items Visible

1. [ ] Verify user role: `console.log(user.role)`
2. [ ] Verify permissions: `console.log(userPermissions)`
3. [ ] Check permission check:
   ```typescript
   console.log('Has permission:', hasPermission('permission_id'));
   ```

### Performance Issues

1. [ ] Check React DevTools for renders
2. [ ] Verify memoization working
3. [ ] Check for unnecessary re-renders
4. [ ] Profile with DevTools

---

## 📊 Verification Steps

### Before Deployment

- [ ] All navigation items configured
- [ ] All permissions defined
- [ ] All roles set up correctly
- [ ] Tests passing
- [ ] No console errors
- [ ] No console warnings
- [ ] Documentation updated
- [ ] Team trained on changes

### Configuration Validation

```typescript
import { validateNavigationConfig } from '@/utils/navigationFilterTests';

const issues = validateNavigationConfig();
if (issues.length > 0) {
  console.error('Configuration issues:', issues);
  // Fix before deployment
}
```

### Build Verification

```bash
npm run build
# Should complete without errors
# Warnings are OK if not related to navigation
```

---

## 🚀 Deployment Checklist

- [ ] Code reviewed and approved
- [ ] Tests passing (100% pass rate)
- [ ] No errors in console
- [ ] All roles tested
- [ ] Documentation updated
- [ ] Team notified of changes
- [ ] Rollback plan in place
- [ ] Monitoring set up for issues

---

## 📚 Reference Quick Links

| Document | Purpose |
|----------|---------|
| `PERMISSION_BASED_NAVIGATION.md` | Complete implementation guide |
| `NAVIGATION_PERMISSIONS_QUICK_REFERENCE.md` | Quick start guide |
| `src/config/navigationPermissions.ts` | Navigation configuration |
| `src/utils/navigationFilter.ts` | Filtering logic |
| `src/hooks/usePermissionBasedNavigation.ts` | React hooks |
| `src/components/layout/EnterpriseLayout.tsx` | Layout integration |

---

## 🎯 Common Tasks

### Add Menu Item
- [ ] Edit `src/config/navigationPermissions.ts`
- [ ] Add item with permission
- [ ] Test visibility
- [ ] Run tests

### Change Permissions
- [ ] Update permission in `navigationConfig`
- [ ] Update role permission map if needed
- [ ] Test affected roles
- [ ] Run tests

### Hide Menu Section
- [ ] Remove permission from children
- [ ] Section hides automatically when no visible children
- [ ] Test section is hidden
- [ ] Run tests

### Debug Visibility
```typescript
import { filterNavigationItems, createNavigationFilterContext } from '@/utils/navigationFilter';
import { navigationConfig } from '@/config/navigationPermissions';

const context = createNavigationFilterContext('admin', ['manage_users']);
const filtered = filterNavigationItems(navigationConfig, context);
console.table(filtered);
```

---

## ✅ Sign-Off

- [ ] Implementation complete
- [ ] Tests passing
- [ ] Documentation reviewed
- [ ] Team trained
- [ ] Deployment approved

**Implemented by:** _______________  
**Date:** _______________  
**Tested by:** _______________  
**Date:** _______________  
**Approved by:** _______________  
**Date:** _______________

---

## 📞 Questions or Issues?

1. Check `PERMISSION_BASED_NAVIGATION.md` - Troubleshooting section
2. Run `validateNavigationConfig()` - Check for config issues
3. Run `runNavigationFilterTests()` - Verify filtering works
4. Review component source code
5. Check browser console for errors

**Remember:** The navigation system automatically handles all filtering - no need for manual role checks in components! ✨
# Permission-Based Navigation Implementation Guide

## Overview

This document describes the complete implementation of permission-based navigation in the PDS-CRM application. The system ensures that navigation items are only visible to users with appropriate permissions and roles.

## Table of Contents

1. [Architecture](#architecture)
2. [Core Components](#core-components)
3. [Configuration](#configuration)
4. [Usage](#usage)
5. [Integration](#integration)
6. [Testing](#testing)
7. [Migration Guide](#migration-guide)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Architecture

### System Design

The permission-based navigation system follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Component Layer                          │
│  (EnterpriseLayout, SidebarMenu, etc.)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Hook Layer                               │
│  (usePermissionBasedNavigation, useCanAccessNavItem, etc.)  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Utility Layer                              │
│  (filterNavigationItems, isItemVisible, etc.)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                Configuration Layer                          │
│  (navigationConfig, navigationPermissions)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Auth Context                               │
│  (hasPermission, hasRole, user, etc.)                       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User Login
   ↓
2. AuthContext stores user + permissions
   ↓
3. Component renders EnterpriseLayout
   ↓
4. Layout calls usePermissionBasedNavigation hook
   ↓
5. Hook creates FilterContext (role + permissions)
   ↓
6. filterNavigationItems filters config based on context
   ↓
7. Only visible items rendered in UI
```

## Core Components

### 1. Navigation Configuration
**File:** `src/config/navigationPermissions.ts`

Defines the complete navigation structure with permission annotations.

**Key Types:**
- `NavigationPermission`: Permission/role requirements
- `NavigationItemConfig`: Complete navigation item with children
- `navigationConfig`: Main navigation structure array

**Example:**
```typescript
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
    // ... more children
  ],
}
```

### 2. Navigation Filter Utility
**File:** `src/utils/navigationFilter.ts`

Core filtering logic that determines item visibility.

**Key Functions:**
- `isItemVisible(item, context)`: Check if item is visible
- `filterNavigationItems(items, context)`: Filter complete navigation tree
- `hasVisibleChildren(item, context)`: Check if item has visible children
- `canAccessNavigationItem(itemKey, items, context)`: Validate access

**Example:**
```typescript
const context = createNavigationFilterContext('admin', ['manage_users']);
const filtered = filterNavigationItems(navigationConfig, context);
const visible = filtered.filter(item => item.isVisible);
```

### 3. Permission-Based Navigation Hook
**File:** `src/hooks/usePermissionBasedNavigation.ts`

React hook for components to access filtered navigation.

**Main Hook:**
- `usePermissionBasedNavigation()`: Get filtered items and utilities
- `useCanAccessNavItem(itemKey)`: Check access to specific item
- `useVisibleNavItems(category)`: Get items in specific category
- `useNavBreadcrumbs()`: Get breadcrumbs for current path

**Example:**
```typescript
const { filteredItems, canAccess, visibleItems } = usePermissionBasedNavigation();

if (canAccess('/tenant/users')) {
  // Render user management link
}
```

### 4. Enterprise Layout Integration
**File:** `src/components/layout/EnterpriseLayout.tsx`

Main layout component that implements permission-based navigation.

**Changes:**
- Uses `usePermissionBasedNavigation()` hook
- Filters menu items before rendering
- Only shows sections with visible children
- Permission-aware breadcrumbs

## Configuration

### Navigation Item Structure

Each navigation item can have:

```typescript
interface NavigationItemConfig extends NavigationPermission {
  key: string;                    // Unique identifier / route
  label: string;                  // Display label
  permission?: string;            // Required permission
  requiredRole?: string | string[]; // Required role(s)
  isSection?: boolean;            // Is this a section group?
  children?: NavigationItemConfig[]; // Nested items
}
```

### Permission Types

**Core Permissions:**
- `read` - View data
- `write` - Create and edit data
- `delete` - Delete data

**Module Permissions:**
- `manage_customers` - Customer management
- `manage_sales` - Sales management
- `manage_tickets` - Support tickets
- `manage_contracts` - Contracts
- `manage_products` - Products
- `manage_product_sales` - Product sales
- `manage_job_works` - Job works
- `manage_complaints` - Complaints

**Administrative Permissions:**
- `manage_users` - User management
- `manage_roles` - Role management
- `manage_settings` - System settings
- `manage_companies` - Company information
- `view_analytics` - Analytics access

**System Permissions:**
- `super_admin` - Full system access
- `manage_tenants` - Tenant management
- `platform_admin` - Platform administration
- `system_monitoring` - System monitoring

### Role Hierarchy

```
customer (level 0)
  ↓
agent (level 1)
  ↓
engineer (level 2)
  ↓
manager (level 3)
  ↓
admin (level 4)
  ↓
super_admin (level 5)
```

Higher roles inherit permissions from lower roles.

## Usage

### Basic Usage in Components

```typescript
import { usePermissionBasedNavigation } from '@/hooks/usePermissionBasedNavigation';

export function MyNavigationComponent() {
  const { filteredItems, canAccess } = usePermissionBasedNavigation();

  return (
    <nav>
      {filteredItems.map((item) => (
        <a key={item.key} href={item.key}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}
```

### Checking Access

```typescript
import { useCanAccessNavItem } from '@/hooks/usePermissionBasedNavigation';

export function AdminSection() {
  const canAccessAdmin = useCanAccessNavItem('/tenant/users');

  if (!canAccessAdmin) {
    return <div>Access Denied</div>;
  }

  return <AdminPanel />;
}
```

### Getting Visible Items by Category

```typescript
import { useVisibleNavItems } from '@/hooks/usePermissionBasedNavigation';

export function AdminMenu() {
  const adminItems = useVisibleNavItems('admin');

  return (
    <ul>
      {adminItems.map((item) => (
        <li key={item.key}>
          <a href={item.key}>{item.label}</a>
        </li>
      ))}
    </ul>
  );
}
```

### Breadcrumbs with Permissions

```typescript
import { useNavBreadcrumbs } from '@/hooks/usePermissionBasedNavigation';
import { Breadcrumb } from 'antd';

export function PermissionAwareBreadcrumbs() {
  const breadcrumbs = useNavBreadcrumbs();

  return <Breadcrumb items={breadcrumbs} />;
}
```

## Integration

### Step 1: Update Navigation Configuration

Edit `src/config/navigationPermissions.ts`:

1. Review the existing navigation structure
2. Add permissions to each item
3. Add `requiredRole` where needed
4. Define section groups with `isSection: true`

```typescript
{
  key: '/tenant/new-feature',
  label: 'New Feature',
  permission: 'manage_new_feature',  // Add this
  requiredRole: 'admin',             // Add this if needed
  children: [
    // ... children
  ]
}
```

### Step 2: Update Auth Service

Ensure `src/services/authService.ts` correctly implements:
- `hasPermission(permission: string): boolean`
- `hasRole(role: string): boolean`
- `getCurrentUser(): User`

### Step 3: Use in Layout

The `EnterpriseLayout` component is already integrated. Verify it uses:

```typescript
const { user, logout, hasRole, hasPermission } = useAuth();
const { filteredItems } = usePermissionBasedNavigation();
```

### Step 4: Test Permission Filtering

Run the test suite to verify filtering works correctly:

```typescript
import { runNavigationFilterTests } from '@/utils/navigationFilterTests';

// In development
if (process.env.NODE_ENV === 'development') {
  runNavigationFilterTests();
}
```

## Testing

### Unit Tests

The implementation includes comprehensive tests in `src/utils/navigationFilterTests.ts`:

**Test Categories:**
1. Permission-based filtering
2. Role-based filtering
3. Nested item filtering
4. Dynamic section visibility
5. Breadcrumb generation
6. Visible items collection
7. Navigation item access validation

**Run Tests:**
```typescript
import { runNavigationFilterTests } from '@/utils/navigationFilterTests';

// Run in browser console or test runner
runNavigationFilterTests();
```

**Expected Output:**
```
✅ [PASS] Permission Filtering: Dashboard visible with read permission
✅ [PASS] Permission Filtering: Job Works hidden without manage_job_works
✅ [PASS] Role Filtering: Admin can see User Management
✅ [PASS] Role Filtering: Agent cannot see User Management
... (more tests)
📈 Summary: 20 passed, 0 failed out of 20 tests
🎉 All tests passed!
```

### Validation

Check configuration for issues:

```typescript
import { validateNavigationConfig } from '@/utils/navigationFilterTests';

const issues = validateNavigationConfig();
issues.forEach(issue => {
  console.log(`[${issue.severity.toUpperCase()}] ${issue.message}`);
});
```

## Migration Guide

### From Old Navigation (Hard-coded Menu Items)

**Before:**
```typescript
const getMenuItems = (): MenuProps['items'] => {
  if (user?.role === 'admin') {
    return [/* admin items */];
  } else if (user?.role === 'manager') {
    return [/* manager items */];
  }
  return [/* common items */];
};
```

**After:**
```typescript
const { filteredItems } = usePermissionBasedNavigation();
// Items automatically filtered based on permissions
```

### Step-by-Step Migration

1. **Review Current Navigation Structure**
   - List all navigation items
   - Identify permission requirements
   - Note role restrictions

2. **Update Navigation Configuration**
   - Add items to `navigationConfig` in `src/config/navigationPermissions.ts`
   - Add permission annotations
   - Add role restrictions

3. **Update Components**
   - Replace hardcoded menu generation with hook
   - Use `usePermissionBasedNavigation()` hook
   - Remove role-based conditionals

4. **Test Thoroughly**
   - Test each role's visibility
   - Verify sections appear/disappear
   - Check breadcrumbs work correctly

5. **Deploy**
   - Monitor for any issues
   - Check browser console for warnings
   - Verify all users can access their content

## Best Practices

### 1. Permission Naming

Use consistent, descriptive permission names:

```typescript
// ✅ Good
'manage_customers'
'view_analytics'
'manage_product_sales'

// ❌ Bad
'cust_mgmt'
'see_stats'
'prod_sale'
```

### 2. Role Definition

Define roles clearly with consistent permissions:

```typescript
// ✅ Good - Clear hierarchy
admin:   [all permissions for tenant]
manager: [read, write, view_analytics]
agent:   [read, write for own data]

// ❌ Bad - Inconsistent
admin:   [everything]
user:    [something]
viewer:  [unclear permissions]
```

### 3. Section Organization

Group related items in sections:

```typescript
// ✅ Good - Clear organization
{
  key: 'admin-section',
  label: 'Administration',
  isSection: true,
  children: [
    { key: '/tenant/users', ... },
    { key: '/tenant/roles', ... },
    { key: '/tenant/settings', ... },
  ]
}

// ❌ Bad - Mixed together
[
  { key: '/dashboard', ... },
  { key: '/users', ... },
  { key: '/sales', ... },
  { key: '/settings', ... },
]
```

### 4. Dynamic Sections

Use `isSection: true` and `requiredRole` for dynamic sections:

```typescript
// ✅ Good - Section only shows if children visible
{
  key: 'admin-section',
  label: 'Administration',
  isSection: true,
  requiredRole: 'admin',  // Only admin sees this section
  children: [ ... ]
}

// ❌ Bad - Static sections
{
  key: 'admin-section',
  label: 'Administration',
  children: [ ... ]
}
```

### 5. Cache and Memoization

The system automatically memoizes filtered results for performance:

```typescript
// ✅ Hook handles memoization
const { filteredItems } = usePermissionBasedNavigation();

// ✅ Memoize in custom components
const filtered = useMemo(() => {
  return filterNavigationItems(navigationConfig, filterContext);
}, [filterContext]);
```

## Troubleshooting

### Issue: Navigation Items Not Appearing

**Diagnosis:**
1. Check user permissions: `console.log(user.role, userPermissions)`
2. Verify permission in config: `navigationConfig.find(item => item.key === '/your/path')`
3. Run tests: `runNavigationFilterTests()`

**Solution:**
```typescript
import { filterNavigationItems, createNavigationFilterContext } from '@/utils/navigationFilter';

const context = createNavigationFilterContext(user.role, permissions);
const filtered = filterNavigationItems(navigationConfig, context);
console.log('Filtered items:', filtered);
```

### Issue: Section Not Showing

**Common Cause:** No children have visible permissions

**Diagnosis:**
```typescript
const item = navigationConfig.find(i => i.key === 'admin-section');
const visibleChildren = item.children.filter(child => 
  isItemVisible(child, context)
);
console.log('Visible children:', visibleChildren);
```

**Solution:**
- Add permission to child items
- Check child item permissions
- Verify role requirements

### Issue: User Can Access Item They Shouldn't

**Diagnosis:**
```typescript
const hasAccess = canAccessNavigationItem(
  '/restricted/path',
  navigationConfig,
  filterContext
);
console.log('Can access:', hasAccess);
```

**Solution:**
1. Check permission definition
2. Verify user permissions list
3. Check role hierarchy
4. Run validation: `validateNavigationConfig()`

### Issue: Performance Problems

**Solution:**
1. Check that hooks are properly memoized
2. Avoid unnecessary re-renders
3. Use `useMemo` and `useCallback` in custom components
4. Profile with React DevTools

### Issue: Breadcrumbs Not Working

**Diagnosis:**
```typescript
const breadcrumbs = getPermissionAwareBreadcrumbs(
  window.location.pathname,
  navigationConfig,
  filterContext
);
console.log('Breadcrumbs:', breadcrumbs);
```

**Solution:**
1. Verify current pathname is correct
2. Check that items have proper permissions
3. Ensure path exists in configuration

## Production Checklist

- [ ] All permissions defined in `navigationConfig`
- [ ] All roles have correct permission mappings
- [ ] No duplicate navigation keys
- [ ] Sections properly configured with `isSection: true`
- [ ] All tests pass: `runNavigationFilterTests()`
- [ ] No console warnings or errors
- [ ] Breadcrumbs working correctly
- [ ] All roles tested for visibility
- [ ] Performance acceptable (use React DevTools)
- [ ] Documentation updated
- [ ] Team trained on new system

## Additional Resources

- **Auth Context**: `src/contexts/AuthContext.tsx`
- **RBAC Service**: `src/services/rbacService.ts`
- **Permission Config**: `src/config/navigationPermissions.ts`
- **Filter Utility**: `src/utils/navigationFilter.ts`
- **Hook**: `src/hooks/usePermissionBasedNavigation.ts`
- **Layout Component**: `src/components/layout/EnterpriseLayout.tsx`

## Support

For questions or issues:
1. Check this documentation
2. Review the test suite
3. Check browser console for errors
4. Review component source code
5. Run `validateNavigationConfig()`
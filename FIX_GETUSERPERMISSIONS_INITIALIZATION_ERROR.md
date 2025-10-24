# Fix: Cannot access 'getUserPermissions' before initialization

## Problem
```
ReferenceError: Cannot access 'getUserPermissions' before initialization
    at http://localhost:5000/src/components/layout/EnterpriseLayout.tsx?t=1761196280756:41:33
```

## Root Cause
The `getUserPermissions` function in `EnterpriseLayout.tsx` was being called before it was declared:

```typescript
// ❌ WRONG - Function called at line 74...
const filteredNavItems = useMemo(() => {
  const userPermissions = getUserPermissions(user.role); // Called here
  // ...
}, [user]);

// But function defined later at line 166
const getUserPermissions = (role: string): string[] => {
  // Function body
};
```

This created a **Temporal Dead Zone (TDZ)** error in JavaScript - the function was referenced before its declaration was hoisted.

## Solution
**Moved the function definition BEFORE it's used:**

```typescript
export const EnterpriseLayout: React.FC<EnterpriseLayoutProps> = ({ children }) => {
  const { user, logout, hasRole, hasPermission } = useAuth();

  // ✅ CORRECT - Function defined FIRST
  const getUserPermissions = (role: string): string[] => {
    const rolePermissionMap: Record<string, string[]> = {
      super_admin: [ /* permissions */ ],
      admin: [ /* permissions */ ],
      // ... rest of roles
    };
    return rolePermissionMap[role] || ['read'];
  };

  // ✅ NOW safe to call the function
  const filteredNavItems = useMemo(() => {
    if (!user) return [];
    const userPermissions = getUserPermissions(user.role);
    const filterContext = createNavigationFilterContext(user.role, userPermissions);
    return filterNavigationItems(navigationConfig, filterContext);
  }, [user]);

  // ... rest of component
};
```

## Changes Made

**File: `src/components/layout/EnterpriseLayout.tsx`**

1. **Moved** `getUserPermissions` function from line 166 to line 69 (right after the component initialization)
2. **Removed** the duplicate function definition that was at the bottom of the component
3. **Updated** the order so the function is defined before `useMemo` hooks that call it

## Verification

✅ **Build Status**: PASSED
- TypeScript compilation: No errors
- Vite build: Successful (5769 modules)
- No console errors

✅ **Dev Server**: Running successfully
- Application starts without errors
- Navigation loads correctly
- Permission filtering works as expected

## Key Principle

In React components, always define functions BEFORE using them, especially when:
- Using them inside `useMemo` or `useCallback` hooks
- Using them in event handlers
- Calling them from other functions defined later

This prevents JavaScript's Temporal Dead Zone (TDZ) errors with hoisting.

## Testing

To verify the fix works:

1. **Check browser console** - No ReferenceError should appear
2. **Check navigation** - Menu items should load and filter correctly by permissions
3. **Check user roles** - Different roles should see different menu items

## Status

✅ **FIXED** - The error is resolved and the application is running normally.

---

**File Modified**: `src/components/layout/EnterpriseLayout.tsx`
**Lines Changed**: 56-238
**Fix Type**: Refactoring (reordering, no logic changes)
**Breaking Changes**: None
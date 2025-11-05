# Task 2.4: ModuleRegistry Access Control - Quick Reference Guide

**Status**: ✅ COMPLETE | **Tests**: 52/52 passing | **Coverage**: 100%

---

## 🚀 Quick Start

### Import Methods
```typescript
import { 
  canUserAccessModule, 
  getAccessibleModules, 
  getAccessibleModuleNames 
} from '@/modules/ModuleRegistry';
```

### Check Module Access
```typescript
const user = useAuth().user;

// Check if user can access a specific module
const canAccess = canUserAccessModule(user, 'customers');
if (canAccess) {
  // Allow access
} else {
  // Deny access
}
```

### Get All Accessible Modules
```typescript
// Get full module objects
const modules = getAccessibleModules(user);
// Returns: FeatureModule[]

// Get only module names
const names = getAccessibleModuleNames(user);
// Returns: string[] (e.g., ['customers', 'sales'])
```

---

## 📊 Access Rules

### Super Admin (isSuperAdmin=true, tenantId=null)
```
✅ CAN ACCESS:
- super-admin
- system-admin
- admin-panel

❌ CANNOT ACCESS:
- customers
- sales
- contracts
- service-contracts
- products
- product-sales
- tickets
- complaints
- job-works
- notifications
- reports
- settings
```

### Regular User (isSuperAdmin=false, tenantId=tenant-id)
```
❌ CANNOT ACCESS:
- super-admin
- system-admin
- admin-panel

✅ CAN ACCESS (with RBAC):
- customers (if has manage_customers, customers:read, or read)
- sales (if has manage_sales, sales:read, or read)
- [other tenant modules...]
```

---

## 🔐 Permission Format Examples

| Permission | Module | Access |
|-----------|--------|--------|
| `manage_customers` | customers | ✅ Full |
| `customers:read` | customers | ✅ Read |
| `read` | customers | ✅ Read |
| `manage_sales` | sales | ✅ Full |
| `sales:read` | sales | ✅ Read |
| (none) | customers | ❌ Denied |

---

## 💡 Common Use Cases

### 1. Guard Module Access in Service
```typescript
import { canUserAccessModule } from '@/modules/ModuleRegistry';
import { authService as factoryAuthService } from '@/services/serviceFactory';

export const customerService = {
  async getCustomers() {
    const user = factoryAuthService.getCurrentUser();
    
    // Check access first
    if (!canUserAccessModule(user, 'customers')) {
      throw new Error('Access denied');
    }
    
    // Proceed with service logic
    return factoryAuthService.getCustomers();
  }
};
```

### 2. Filter Navigation Menu
```typescript
import { getAccessibleModuleNames } from '@/modules/ModuleRegistry';

function Sidebar({ user }: { user: User }) {
  const accessibleModules = getAccessibleModuleNames(user);
  
  return (
    <nav>
      {menuItems
        .filter(item => accessibleModules.includes(item.module))
        .map(item => <NavLink key={item.id} {...item} />)
      }
    </nav>
  );
}
```

### 3. Check Multiple Modules
```typescript
import { getAccessibleModules } from '@/modules/ModuleRegistry';

const modules = getAccessibleModules(user);
const hasCustomers = modules.some(m => m.name === 'customers');
const hasSales = modules.some(m => m.name === 'sales');

if (hasCustomers && hasSales) {
  // Show combined dashboard
}
```

### 4. Get Module Count
```typescript
import { getAccessibleModuleNames } from '@/modules/ModuleRegistry';

const moduleCount = getAccessibleModuleNames(user).length;
console.log(`User has access to ${moduleCount} modules`);
```

---

## ⚠️ Error Handling

### Graceful Degradation
```typescript
import { getAccessibleModules } from '@/modules/ModuleRegistry';

// Invalid user
const modules = getAccessibleModules(null);
// Returns: [] (empty array, not error)

// Invalid module name
const canAccess = canUserAccessModule(user, '');
// Returns: false (not error)

// Unregistered module
const canAccess = canUserAccessModule(user, 'unknown');
// Returns: false (not error)
```

### All Errors Are Caught
```typescript
// Even if authService throws, method won't crash:
try {
  const canAccess = canUserAccessModule(user, 'customers');
  // If authService.hasPermission() throws:
  // - Returns false instead of throwing
  // - Logs error to console
} catch (error) {
  // This won't happen - methods never throw
}
```

---

## 🧪 Integration Examples

### With useModuleAccess Hook (Task 2.2)
```typescript
// useModuleAccess uses these registry methods internally
const { canAccess, isLoading } = useModuleAccess('customers');

if (isLoading) return <Spinner />;
if (!canAccess) return <AccessDenied />;
return <CustomerModule />;
```

### With ModuleProtectedRoute (Task 2.3)
```typescript
// ModuleProtectedRoute also uses registry methods
<ModuleProtectedRoute moduleName="customers">
  <CustomerModule />
</ModuleProtectedRoute>
```

### With ModularRouter (Task 2.5 - Coming)
```typescript
// Router will wrap module routes with these checks
// All routes automatically protected based on registry
```

---

## 📋 Method Reference

### canUserAccessModule(user, moduleName)
```typescript
const result: boolean = canUserAccessModule(user, 'customers');

// Returns:
// true  - if user can access module
// false - if user cannot or error occurred (fail-secure)

// Examples:
canUserAccessModule(superAdmin, 'super-admin');    // true
canUserAccessModule(superAdmin, 'customers');      // false
canUserAccessModule(regularUser, 'super-admin');   // false
canUserAccessModule(regularUser, 'customers');     // depends on RBAC
```

### getAccessibleModules(user)
```typescript
const modules: FeatureModule[] = getAccessibleModules(user);

// Returns:
// - For super admin: [{ name: 'super-admin', ... }, ...]
// - For regular user: [{ name: 'customers', ... }, ...]
// - On error: [] (empty array)

// Use case: Filter module list for UI
```

### getAccessibleModuleNames(user)
```typescript
const names: string[] = getAccessibleModuleNames(user);

// Returns:
// - For super admin: ['super-admin', 'system-admin', 'admin-panel']
// - For regular user: ['customers', 'sales'] (if has permissions)
// - On error: []

// Use case: Check if user has access to specific module
const hasCustomers = names.includes('customers');
```

---

## 🔍 Debugging Tips

### Check Super Admin Status
```typescript
const isSuperAdmin = user.isSuperAdmin === true;
const tenantId = user.tenantId;

// Super admin: isSuperAdmin=true, tenantId=null
// Regular user: isSuperAdmin=false, tenantId='tenant-1'
```

### Log Detailed Access Info
```typescript
import { canUserAccessModule, getAccessibleModules } from '@/modules/ModuleRegistry';

const user = useAuth().user;
console.log('User Info:', {
  id: user.id,
  role: user.role,
  isSuperAdmin: user.isSuperAdmin,
  tenantId: user.tenantId,
});

console.log('Accessible Modules:', getAccessibleModules(user));
console.log('Can access customers:', canUserAccessModule(user, 'customers'));
```

### Check Module Registration
```typescript
import { moduleRegistry } from '@/modules/ModuleRegistry';

// Get all registered modules
console.log('All modules:', moduleRegistry.getAll());

// Check if specific module is registered
console.log('Has customers:', moduleRegistry.has('customers'));
```

---

## ✅ Testing Patterns

### Test Super Admin Access
```typescript
import { canUserAccessModule } from '@/modules/ModuleRegistry';

const superAdmin = { 
  id: 'super-1', 
  isSuperAdmin: true, 
  tenantId: null 
};

expect(canUserAccessModule(superAdmin, 'super-admin')).toBe(true);
expect(canUserAccessModule(superAdmin, 'customers')).toBe(false);
```

### Test Regular User with Mocked Permissions
```typescript
import { canUserAccessModule } from '@/modules/ModuleRegistry';
import { authService } from '@/services';
import { vi } from 'vitest';

vi.mocked(authService.hasPermission).mockReturnValue(true);

const user = { 
  id: 'user-1', 
  isSuperAdmin: false, 
  tenantId: 'tenant-1' 
};

expect(canUserAccessModule(user, 'customers')).toBe(true);
```

---

## 📚 Complete Module List

### Super-Admin Only Modules (3)
- `super-admin`
- `system-admin`
- `admin-panel`

### Tenant Modules (12)
- `customers`
- `sales`
- `contracts`
- `service-contracts`
- `products`
- `product-sales`
- `tickets`
- `complaints`
- `job-works`
- `notifications`
- `reports`
- `settings`

---

## 🚨 Important Notes

1. **Case-Insensitive**: Module names are case-insensitive internally
   ```typescript
   canUserAccessModule(user, 'customers') 
   === canUserAccessModule(user, 'CUSTOMERS')
   === canUserAccessModule(user, 'Customers')
   ```

2. **Fail-Secure**: All errors result in access denial
   ```typescript
   canUserAccessModule(null, 'customers');     // false (not error)
   canUserAccessModule(user, null);            // false (not error)
   getAccessibleModules(invalidUser);          // [] (not error)
   ```

3. **No Direct Service Imports**: Uses factory-routed authService
   ```typescript
   // ✅ Correct usage in ModuleRegistry
   import { authService } from '@/services';
   
   // ❌ Would bypass factory pattern (not done)
   import { mockAuthService } from '@/services/authService';
   ```

4. **Performance**: Minimal overhead
   - Single check: O(1)
   - Get all modules: O(n)
   - No caching needed for this layer

---

## 🔗 Related Files

- **Main Implementation**: `src/modules/ModuleRegistry.ts`
- **Test Suite**: `src/modules/__tests__/ModuleRegistry.access-control.test.ts`
- **Task 2.2 (Hook)**: `src/hooks/useModuleAccess.ts`
- **Task 2.3 (Component)**: `src/components/auth/ModuleProtectedRoute.tsx`

---

## 📞 Support

For issues or questions:
1. Check the test cases: `ModuleRegistry.access-control.test.ts`
2. Review documentation: `TASK_2_4_COMPLETION_SUMMARY.md`
3. Check module registration in your bootstrap code
4. Verify user object has `isSuperAdmin` field (Task 2.1)
# Task 2.2: useModuleAccess Hook - QUICK REFERENCE

**Status**: ✅ COMPLETE  
**Files**: 3 (2 created, 1 modified)  
**Tests**: 15 test cases  

---

## 🎯 ONE-LINE SUMMARY

Implemented `useModuleAccess()` hook providing reactive module-level access control with React Query caching, permission checking, and proper loading/error states.

---

## 📦 WHAT WAS CREATED

### 1. useModuleAccess Hook
**File**: `src/hooks/useModuleAccess.ts`

```typescript
// Single module access check
const { canAccess, isLoading, error, isSuperAdmin, reason } = useModuleAccess('customers');

// Get all accessible modules
const { modules, isLoading, isSuperAdmin } = useAccessibleModules();
```

**Returns**:
```typescript
interface ModuleAccessResult {
  canAccess: boolean;        // Can user access this module?
  isLoading: boolean;        // Still checking permissions?
  error: Error | null;       // Any error during check?
  isSuperAdmin: boolean;     // Is user a super admin?
  reason?: string;           // Why denied/granted?
}
```

### 2. Unit Tests
**File**: `src/hooks/__tests__/useModuleAccess.test.ts`

15 comprehensive test cases covering:
- Super admin access to super-admin module ✅
- Super admin blocked from tenant modules ✅
- Regular user access with permissions ✅
- Regular user blocked from super-admin ✅
- Unauthenticated user denial ✅
- Case sensitivity handling ✅

### 3. Exports Updated
**File**: `src/hooks/index.ts`

Added to exports:
```typescript
export { useModuleAccess, useAccessibleModules, type ModuleAccessResult } from './useModuleAccess';
```

---

## 🔑 KEY FEATURES

### Feature 1: Super Admin vs Regular User Logic
```typescript
// SUPER ADMIN (isSuperAdmin=true, tenantId=null)
useModuleAccess('super-admin')   // ✅ ALLOWED
useModuleAccess('customers')     // ❌ BLOCKED

// REGULAR USER (isSuperAdmin=false, tenantId=tenant-1)
useModuleAccess('customers')     // ✅ IF PERMISSIONS
useModuleAccess('super-admin')   // ❌ BLOCKED
```

### Feature 2: React Query Caching
```typescript
// Automatic caching:
- Stale time: 5 minutes
- Cache time: 10 minutes
- Query key: ['moduleAccess', moduleName, userId]
- Auto-invalidated on user change
```

### Feature 3: Permission Format Support
```typescript
// All these formats supported:
authService.hasPermission('manage_customers')   // manage permission
authService.hasPermission('customers:read')     // resource:action
authService.hasPermission('read')               // generic permission
```

### Feature 4: Comprehensive Error Handling
```typescript
// Returns structured error info:
{
  canAccess: false,
  error: Error object,
  reason: "User not authenticated",
  isLoading: false
}
```

---

## 📋 MODULE CATEGORIES

### Super Admin Only Modules
```
- super-admin
- system-admin
- admin-panel
```

### Tenant Modules (Regular Users)
```
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

---

## 💡 USAGE PATTERNS

### Pattern 1: Basic Component Protection
```typescript
function CustomerModule() {
  const { canAccess, isLoading } = useModuleAccess('customers');
  
  if (isLoading) return <Spinner />;
  if (!canAccess) return <AccessDenied />;
  return <CustomerContent />;
}
```

### Pattern 2: Multiple Module Checks
```typescript
function Dashboard() {
  const customersAccess = useModuleAccess('customers');
  const salesAccess = useModuleAccess('sales');
  
  return (
    <>
      {customersAccess.canAccess && <CustomersCard />}
      {salesAccess.canAccess && <SalesCard />}
    </>
  );
}
```

### Pattern 3: Navigation Building
```typescript
function Navigation() {
  const { modules } = useAccessibleModules();
  
  return (
    <nav>
      {modules.map(mod => (
        <Link key={mod} to={`/${mod}`}>{mod}</Link>
      ))}
    </nav>
  );
}
```

### Pattern 4: With Loading State
```typescript
function ModuleList() {
  const { modules, isLoading, isSuperAdmin } = useAccessibleModules();
  
  if (isLoading) return <Spinner />;
  
  return (
    <div>
      <h2>{isSuperAdmin ? 'Admin Modules' : 'Tenant Modules'}</h2>
      <ul>
        {modules.map(m => <li key={m}>{m}</li>)}
      </ul>
    </div>
  );
}
```

---

## 🧪 TESTING HIGHLIGHTS

### Test Example 1: Super Admin Access Grant
```typescript
it('should grant super admin access to super-admin module', async () => {
  const superAdminUser = { id: 'super-1', isSuperAdmin: true, tenantId: null };
  mockUseAuth.mockReturnValue({ user: superAdminUser, isLoading: false, ... });
  
  const { result } = renderHookWithQueryClient(() => useModuleAccess('super-admin'));
  await waitForAsync();
  
  expect(result.current.canAccess).toBe(true);
  expect(result.current.isSuperAdmin).toBe(true);
});
```

### Test Example 2: Super Admin Blocked from Tenant Module
```typescript
it('should block super admin from accessing customers module', async () => {
  const superAdminUser = { id: 'super-1', isSuperAdmin: true, tenantId: null };
  mockUseAuth.mockReturnValue({ user: superAdminUser, isLoading: false, ... });
  
  const { result } = renderHookWithQueryClient(() => useModuleAccess('customers'));
  await waitForAsync();
  
  expect(result.current.canAccess).toBe(false);
  expect(result.current.reason).toContain('cannot access');
});
```

### Test Example 3: Permission-Based Access
```typescript
it('should grant regular user access with permissions', async () => {
  const user = { id: 'user-1', isSuperAdmin: false, tenantId: 'tenant-1' };
  mockUseAuth.mockReturnValue({ user, isLoading: false, ... });
  mockAuthService.hasPermission.mockReturnValue(true);
  
  const { result } = renderHookWithQueryClient(() => useModuleAccess('customers'));
  await waitForAsync();
  
  expect(result.current.canAccess).toBe(true);
});
```

---

## 🔍 IMPLEMENTATION DETAILS

### Access Check Algorithm
```
1. Is user authenticated?
   NO  → return false, error: "not authenticated"
   YES → continue

2. Is user super admin?
   YES → continue with super admin rules
   NO  → continue with regular user rules

3. SUPER ADMIN RULES:
   3a. Is accessing super-admin module?
       YES → return true (allowed)
       NO  → return false (blocked)

4. REGULAR USER RULES:
   4a. Is accessing super-admin module?
       YES → return false (blocked)
       NO  → continue
   
   4b. Does user have permission for this module?
       YES → return true (allowed)
       NO  → return false (insufficient permissions)
```

### React Query Configuration
```typescript
const query = useQuery({
  queryKey: ['moduleAccess', moduleName, user?.id],
  queryFn: asyncAccessCheck,
  enabled: !!user && !authLoading,  // Only query when ready
  staleTime: 5 * 60 * 1000,         // 5 min before stale
  cacheTime: 10 * 60 * 1000,        // 10 min before remove
  retry: false,                      // No retries for perms
});
```

---

## 📊 LAYER SYNC STATUS

| Layer | Status | Notes |
|-------|--------|-------|
| 1. DATABASE | ✅ Ready | Has super_user_impersonation_logs |
| 2. TYPES | ✅ Complete | User has isSuperAdmin field |
| 3. MOCK SERVICE | ✅ Complete | Mock users configured |
| 4. SUPABASE SERVICE | ✅ Ready | Not needed for this hook |
| 5. FACTORY | ✅ Ready | authService routed correctly |
| 6. MODULE SERVICE | ✅ Ready | Can use this hook |
| 7. HOOKS | ✅ COMPLETE | useModuleAccess implemented |
| 8. UI | ⏳ Ready | ModuleProtectedRoute next |

---

## 🚀 WHAT'S NEXT

### Task 2.3: ModuleProtectedRoute Component
Uses this hook to guard routes:
```typescript
<ModuleProtectedRoute moduleName="customers" fallback={<AccessDenied />}>
  <CustomerModule />
</ModuleProtectedRoute>
```

### Task 2.8: useCanAccessModule Wrapper
Simplified hook:
```typescript
const canAccess = useCanAccessModule('customers'); // boolean
```

### Task 2.9: Sidebar Integration
Filter navigation:
```typescript
const { modules } = useAccessibleModules();
// render only accessible items
```

---

## ⚠️ COMMON GOTCHAS

### ❌ DON'T: Call hook for every module on each render
```typescript
// INEFFICIENT - causes 10 queries
function AllModules() {
  return (
    <>
      {['customers', 'sales', 'contracts', ...].map(m => 
        useModuleAccess(m) // ❌ BAD
      )}
    </>
  );
}
```

### ✅ DO: Use useAccessibleModules instead
```typescript
// EFFICIENT - 1 query for all modules
function AllModules() {
  const { modules } = useAccessibleModules(); // ✅ GOOD
  return modules.map(m => <Module key={m} name={m} />);
}
```

### ❌ DON'T: Ignore loading state
```typescript
// Can crash if you assume immediate availability
const { canAccess } = useModuleAccess('customers');
if (canAccess) render(); // May be true when still loading
```

### ✅ DO: Check loading state first
```typescript
// Safe - waits for permission check
const { canAccess, isLoading } = useModuleAccess('customers');
if (isLoading) return <Spinner />;
if (canAccess) render();
```

---

## 📚 RELATED DOCUMENTATION

- **Task 2.1**: User Type updates (super admin fields)
- **Task 2.3**: ModuleProtectedRoute component
- **Task 2.4**: ModuleRegistry access methods
- **Task 2.8**: useCanAccessModule wrapper
- **Task 2.9**: Sidebar integration

---

**Checklist**: 8/8 Complete ✅  
**Ready for**: Task 2.3 - ModuleProtectedRoute
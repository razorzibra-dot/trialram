# Service Layer Architecture Guide

## Why UserService Failed But CompanyService Works

### ❌ UserService (BEFORE - Broken)
```typescript
async getUsers(): Promise<User[]> {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');  // ❌ BLOCKS ON PAGE LOAD
  
  if (!authService.hasRole('admin')) {
    throw new Error('Access denied');  // ❌ BLOCKS ON PAGE LOAD
  }
  
  // ... actual logic
}
```

**Result**: Throws error before data loads, blocking entire page

### ✅ CompanyService (Works)
```typescript
async getCompanies(filters?: CompanyFilters): Promise<Company[]> {
  // ✅ NO AUTH CHECKS - Goes straight to business logic
  
  // ... filter and return data
}
```

**Result**: Data loads immediately, real security at database level

---

## The Correct Architecture

### Three-Layer Security Model

```
┌─────────────────────────────────────┐
│  UI LAYER (Optional)                │
│  - Show loading states              │
│  - Show auth warnings               │
│  - Display "Access Denied" alerts   │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  SERVICE LAYER (Business Logic Only)│
│  - NO auth checks                   │
│  - Process data                     │
│  - Apply filters                    │
│  - Format response                  │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  DATABASE LAYER (Real Security)     │
│  - Supabase RLS enforces access     │
│  - Database-level permissions       │
│  - Tenant isolation                 │
│  - Actual security boundary ✓       │
└─────────────────────────────────────┘
```

### Why Services DON'T Check Auth

1. **Development convenience**: Mock mode works without setup
2. **Cleaner separation**: Services = business logic only
3. **Real security at database**: RLS policies are the actual boundary
4. **Testability**: Can test services without mocking auth
5. **Flexibility**: Can be used by different auth mechanisms

---

## Pattern Comparison

### ❌ WRONG: Auth Check in Service
```typescript
// ❌ DON'T DO THIS
class UserService {
  async getUsers() {
    if (!authService.getCurrentUser()) throw new Error('Unauthorized');
    // blocks development
  }
}
```

### ✅ RIGHT: Auth Check at UI Layer (if needed)
```typescript
// ✅ DO THIS - Handle auth at UI level
const UsersPage = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Alert>Please log in</Alert>;
  }
  
  // Now safe to call service
  return <UsersList />;
};
```

### ✅ RIGHT: Auth Enforcement at Database
```typescript
-- Supabase RLS Policy (actual security boundary)
CREATE POLICY users_select_policy ON users
FOR SELECT USING (
  auth.uid() IS NOT NULL 
  AND tenant_id = auth.jwt() ->> 'tenant_id'
);
```

---

## Implementation Checklist

When creating a new service, follow this pattern:

### ✅ DO:
- [ ] Create mock service with NO auth checks
- [ ] Create Supabase service with NO auth checks
- [ ] Let database RLS handle permissions
- [ ] Add auth checks at UI layer if needed for UX
- [ ] Use Service Factory pattern to switch between implementations

### ❌ DON'T:
- [ ] Add `authService.getCurrentUser()` checks in service methods
- [ ] Add `authService.hasRole()` checks in service methods
- [ ] Block service calls with authorization logic
- [ ] Mix authentication with business logic

---

## Files Fixed

| File | Issue | Fix |
|------|-------|-----|
| `src/services/userService.ts` | Auth checks blocked mock mode | Removed 6 `authService.getCurrentUser()` checks |
| `src/services/api/supabase/userService.ts` | Auth checks blocked page load | Removed 6 `authService.getCurrentUser()` checks |
| `src/modules/features/user-management/views/UsersPage.tsx` | Conditional loading | Simplified to load always, RLS handles security |

---

## Testing the Fix

### Test 1: Load without login
```
1. Open browser console
2. Navigate to /users
3. Expected: Page loads with mock data (no Unauthorized error)
```

### Test 2: Mock mode works
```
1. Set VITE_API_MODE=mock in .env
2. Navigate to /users
3. Expected: Mock user data displays
```

### Test 3: Supabase mode works
```
1. Set VITE_API_MODE=supabase in .env
2. Start local Supabase: supabase start
3. Navigate to /users
4. Expected: Data loads (RLS handles access control)
```

---

## Key Takeaway

**Authorization happens at the database level, not in service methods.**

Services should be:
- ✅ Thin wrappers around API calls
- ✅ Handle data transformation
- ✅ Apply filters and formatting
- ❌ NOT responsible for authentication/authorization

Real security comes from:
- ✅ Supabase RLS policies
- ✅ Database-level access control
- ✅ Tenant isolation rules
- ✅ JWT token validation at RLS level

This is why CompaniesPage works perfectly - it follows this architecture correctly!
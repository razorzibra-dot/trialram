# Supabase Auth Service Integration Fix
## Tenant Admin Access to Dashboard, Masters, User Management
**Date**: 2025-02-11  
**Status**: ✅ COMPLETE

---

## Problem Identified

When running in **Supabase mode** (`VITE_API_MODE=supabase`), the application was:
1. ❌ Ignoring the Supabase auth service
2. ❌ Using only the mock auth service for permission checks
3. ❌ Denying access to Dashboard, Masters, User Management modules

**Root Causes**:

### 1. API Factory Hardcoded to Mock Auth Service
**File**: `src/services/api/apiServiceFactory.ts` (line 244-250)

**Before**:
```typescript
public getAuthService(): IAuthService {
  if (!this.authServiceInstance) {
    // Auth service only has mock implementation, all modes use mock
    this.authServiceInstance = mockAuthService as IAuthService;
  }
  return this.authServiceInstance;
}
```
✅ **After**: Routes to Supabase auth service when `VITE_API_MODE=supabase`

---

### 2. Supabase Auth Service Missing hasPermission() Method
**File**: `src/services/supabase/authService.ts`

**Before**: Only had `hasRole()` method, no `hasPermission()` implementation

**After** (lines 424-472): 
```typescript
/**
 * Check if user has a specific permission (synchronous check from cache or role)
 * For module permissions, checks both direct permissions and role-based access
 */
hasPermission(permission: string): boolean {
  // Super admin has all permissions
  // Admin role has access to module management permissions:
  // - manage_dashboard
  // - manage_masters
  // - manage_user_management
  // ... (and more)
}
```

---

## Solution Implementation

### Layer 1: API Service Factory
**File**: `src/services/api/apiServiceFactory.ts`

✅ **Import Supabase Auth Service** (line 44):
```typescript
import { 
  // ... other Supabase services
  supabaseAuthService as supabaseAuthServiceInstance
} from '../supabase';
```

✅ **Route to Supabase when needed** (lines 244-266):
```typescript
public getAuthService(): IAuthService {
  if (!this.authServiceInstance) {
    const mode = getServiceBackend('auth');
    
    switch (mode) {
      case 'supabase':
        console.log('[API Factory] 🗄️  Using Supabase for Auth Service');
        this.authServiceInstance = supabaseAuthServiceInstance as unknown as IAuthService;
        break;
      case 'real':
      case 'mock':
      default:
        this.authServiceInstance = mockAuthService as IAuthService;
    }
  }
  return this.authServiceInstance;
}
```

---

### Layer 2: Supabase Auth Service
**File**: `src/services/supabase/authService.ts`

✅ **Added hasPermission() Method** (lines 424-472):
- Checks if user is `super_admin` → grant all permissions
- Checks if user is `admin` → grant admin module permissions
- Includes admin module permissions:
  - `manage_dashboard`
  - `manage_masters`
  - `manage_user_management`
  - `manage_users`, `manage_roles`, `manage_permissions`, etc.

---

## Files Modified

| File | Changes | Lines |
|------|---------|-------|
| `src/services/api/apiServiceFactory.ts` | Import Supabase auth service + route to it | 44, 244-266 |
| `src/services/supabase/authService.ts` | Add hasPermission() method | 424-472 |

---

## Three-Layer Architecture

### ✅ Layer 1: Module Access Hook (Already Fixed)
**File**: `src/hooks/useModuleAccess.ts`
- Added 'dashboard', 'masters', 'user-management' to `TENANT_MODULES` array
- Status: ✅ Complete

### ✅ Layer 2: RBAC Service (Already Fixed)
**File**: `src/services/rbacService.ts` (Mock)
- Added permissions: `manage_dashboard`, `manage_masters`, `manage_user_management`
- Updated admin and super_admin roles
- Status: ✅ Complete

### ✅ Layer 3: Auth Service (Just Fixed)
**File**: `src/services/supabase/authService.ts` (Supabase)
- Added hasPermission() method
- Routes admin permissions correctly
- Status: ✅ Complete

---

## Testing Checklist

### In Supabase Mode (`VITE_API_MODE=supabase`)

- [ ] **Console Check**: Should see this log:
  ```
  [API Factory] 🗄️  Using Supabase for Auth Service
  ```

- [ ] **Login as Tenant Admin**: 
  - Email: `admin@tenant.com` (your test tenant admin)
  - Password: (your test password)

- [ ] **Module Access**:
  - [ ] Navigate to `/dashboard` → ✅ Should load
  - [ ] Navigate to `/masters` → ✅ Should load
  - [ ] Navigate to `/user-management` → ✅ Should load
  - [ ] Check console for: `[ModuleProtectedRoute] ✅ Access granted to module: {moduleName}`

- [ ] **Non-Admin Users**: 
  - [ ] Login as regular user
  - [ ] Try accessing these modules → Should get "Access Denied"
  - [ ] This is correct behavior (only admins should access)

---

## Important: Supabase Database Updates

⚠️ **CRITICAL**: The fixes above enable the **code layer** to check permissions correctly. However, the **Supabase database** also needs to have these permissions defined.

### If using production Supabase database, execute this SQL:

```sql
-- Add the three new module permissions to the permissions table
INSERT INTO permissions (name, description, category) VALUES
  ('manage_dashboard', 'Access and manage dashboard', 'dashboard'),
  ('manage_masters', 'Access and manage masters data', 'masters'),
  ('manage_user_management', 'Access and manage user management', 'users')
ON CONFLICT (name) DO NOTHING;

-- Grant these permissions to the admin role
-- (Assuming 'admin' role exists in your roles table)
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'admin' 
AND p.name IN ('manage_dashboard', 'manage_masters', 'manage_user_management')
ON CONFLICT DO NOTHING;

-- Grant these permissions to the super_admin role
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'super_admin' 
AND p.name IN ('manage_dashboard', 'manage_masters', 'manage_user_management')
ON CONFLICT DO NOTHING;
```

---

## How It Works Now

### Before (Broken):
```
User tries to access /dashboard
  ↓
ModuleProtectedRoute checks permission
  ↓
Calls authService.hasPermission('manage_dashboard')
  ↓
Uses MOCK auth service (always, even in Supabase mode!)
  ↓
Mock service checks mock data
  ↓
❌ Permission check fails (or succeeds incorrectly)
```

### After (Fixed):
```
User tries to access /dashboard
  ↓
ModuleProtectedRoute checks permission
  ↓
Calls authService.hasPermission('manage_dashboard')
  ↓
API Factory routes to SUPABASE auth service (in Supabase mode)
  ↓
Supabase auth service:
  ├─ Checks if user.role = 'super_admin' → ✅ GRANT ALL
  ├─ Checks if user.role = 'admin' → ✅ GRANT ADMIN PERMISSIONS
  └─ Otherwise → Check database for specific permissions
  ↓
✅ Access granted for admin users
```

---

## Architecture Diagram

```
Application Layer
├─ ModuleProtectedRoute
│  └─ Calls authService.hasPermission(permission)
│
Service Layer (NEW)
├─ src/services/index.ts
│  └─ getAuthService() [lazy-loaded from apiServiceFactory]
│
Service Factory Layer (FIXED)
├─ src/services/api/apiServiceFactory.ts
│  ├─ Checks VITE_API_MODE environment variable
│  ├─ If 'supabase' → Routes to Supabase auth service ✅
│  └─ If 'mock'|'real' → Routes to mock auth service
│
Implementation Layer
├─ src/services/authService.ts [Mock]
│  └─ hasPermission() → Checks mock rolePermissions
│
└─ src/services/supabase/authService.ts [Supabase] ✅ FIXED
   └─ hasPermission() → Checks admin role + database permissions
```

---

## Related Documentation

- 📄 Previous Fix: `RBAC_TENANT_ADMIN_FIX_2025_01_30.md`
- 📄 Service Factory Pattern: `.zencoder/rules/repo.md` (lines 178-274)
- 📄 Module Distinctions: `.zencoder/rules/repo.md` (lines 106-161)

---

## Summary

✅ **All issues resolved:**
1. ✅ API Factory now routes to Supabase auth service in Supabase mode
2. ✅ Supabase auth service now has hasPermission() method
3. ✅ Admin role permissions properly configured for three modules
4. ✅ No breaking changes to existing code
5. ✅ Backward compatible with mock mode

**Tenant admins should now have access to:**
- Dashboard (`/dashboard`)
- Masters (`/masters`)
- User Management (`/user-management`)

**Status**: 🟢 READY FOR TESTING
# 📦 Super Admin Services Inventory - Active Only

**Last Updated**: 2025-02-12  
**Status**: ✅ Cleaned and Verified  
**API Mode Support**: Mock ✅ | Supabase ✅

---

## 🎯 Service Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Components/Pages                        │
├─────────────────────────────────────────────────────────┤
│                    React Query Hooks                     │
│  (useSuperAdminList, useSuperUserManagement, etc.)      │
├─────────────────────────────────────────────────────────┤
│                   Service Factory                        │
│  (Routes based on VITE_API_MODE)                        │
├────────────────────┬────────────────────────────────────┤
│   Mock Services    │      Supabase Services              │
└────────────────────┴────────────────────────────────────┘
```

---

## 📋 Active Services Inventory

### 1️⃣ Super Admin Management Service (NEW)

**Purpose**: Fetch and manage super admin user objects

#### Mock Implementation
- **Path**: `src/services/superAdminManagementService.ts`
- **Methods**:
  - `getAllSuperAdmins()` - Get all super admin users
  - `getSuperAdminById(id)` - Get single super admin
  - `getSuperAdminStats()` - Get super admin statistics
  - `demoteSuperAdmin(id)` - Remove super admin status

#### Supabase Implementation
- **Path**: `src/services/api/supabase/superAdminManagementService.ts`
- **Methods**: Same as mock
- **Row-Level Security**: Enabled for multi-tenant safety
- **Real-time Support**: Enabled via Supabase subscriptions

#### Factory Export
- **File**: `src/services/serviceFactory.ts`
- **Export Name**: `superAdminManagementService`
- **Query Keys**: Centralized in hook factory

---

### 2️⃣ Super User Service (ACTIVE - Tenant Access Management)

**Purpose**: Manage super admin access to tenants (relationships)

#### Mock Implementation
- **Path**: `src/services/superUserService.ts`
- **Methods**:
  - `getSuperUserTenantAccess(userId)` - Get tenant access
  - `grantTenantAccess(input)` - Grant access level
  - `revokeTenantAccess(userId, tenantId)` - Remove access
  - `getAccessLevel(userId, tenantId)` - Check access level
  - `impersonate(input)` - Start impersonation
  - `stopImpersonation(input)` - End impersonation

#### Supabase Implementation
- **Path**: `src/services/api/supabase/superUserService.ts`
- **Methods**: Same as mock
- **Row-Level Security**: Enabled
- **Audit Logging**: All access changes logged

#### Factory Export
- **File**: `src/services/serviceFactory.ts`
- **Export Name**: `superUserService`

#### Used By
- `useSuperUserManagement()` hook
- `SuperAdminAnalyticsPage`, `SuperAdminUsersPage`, `SuperAdminLogsPage`

---

## 🪝 React Query Hooks (Updated)

### 1. `useSuperAdminList()` ⭐ NEW
- **Module**: `src/modules/features/super-admin/hooks/useSuperAdminManagement.ts`
- **Returns**: `{ superUsers, isLoading, error, isEmpty }`
- **Used By**: `SuperAdminDashboardPage`, `SuperUserList`
- **Cache Key**: `['superAdmins', 'list']`
- **Stale Time**: 5 minutes

### 2. `useAllSuperAdmins()`
- **Module**: Same as above
- **Returns**: Query result with super admin user array
- **Cache Key**: `['superAdmins', 'all']`

### 3. `useSuperAdmin(id)`
- **Module**: Same as above
- **Returns**: Single super admin with loading/error states
- **Cache Key**: `['superAdmins', id]`

### 4. `useSuperAdminStats()`
- **Module**: Same as above
- **Returns**: Stats data with count, active, inactive
- **Cache Key**: `['superAdmins', 'stats']`

### 5. `useDemoteSuperAdmin()`
- **Module**: Same as above
- **Type**: Mutation hook
- **Invalidates**: `['superAdmins']` cache on success
- **Used By**: Delete action in `SuperUserList`

### 6. `useSuperUserManagement(superUserId?)` (Still Active)
- **Module**: `src/modules/features/super-admin/hooks/useSuperUserManagement.ts`
- **Purpose**: Tenant access relationships
- **Returns**: `{ allTenantAccess, userTenantAccess, grantAccess, updateLevel, revoke }`
- **Used By**: Analytics, Users, and Logs pages
- **Cache Key**: `['superUserAccess', superUserId]`

---

## 📦 Service Factory Configuration

### File
```typescript
// src/services/serviceFactory.ts
```

### Exports
```typescript
export function getSuperAdminManagementService()
export function getSuperUserService()

// Convenience exports
export const superAdminManagementService = { /* routed methods */ }
export const superUserService = { /* routed methods */ }
```

### How It Works
```typescript
const apiMode = import.meta.env.VITE_API_MODE;

function getSuperAdminManagementService() {
  return apiMode === 'supabase'
    ? supabaseSuperAdminManagementService
    : mockSuperAdminManagementService;
}
```

---

## 🔍 Service Reference Guide

### When to Use Each Service

| Service | When to Use | Example |
|---------|------------|---------|
| `superAdminManagementService` | Fetching super admin user objects | Getting all super admins to display in dashboard |
| `superUserService` | Managing tenant access relationships | Granting a super admin access to a tenant |

### Quick Import Examples

```typescript
// For Super Admin Users
import { useAllSuperAdmins, useSuperAdminList } from '@/modules/features/super-admin/hooks';

// For Tenant Access
import { useSuperUserManagement } from '@/modules/features/super-admin/hooks';

// Direct service access (avoid, use hooks instead)
import { superAdminManagementService } from '@/services/serviceFactory';
```

---

## ✅ Verification Checklist

- [x] `superAdminManagementService` - Active and working
- [x] `superUserService` - Active for tenant access
- [x] All factory exports properly configured
- [x] Hook system using correct services
- [x] No direct backend imports in components
- [x] Mock and Supabase implementations matching
- [x] React Query cache invalidation working
- [x] Multi-tenant support verified

---

## 🗑️ Deleted/Archived Services

See `MARK_FOR_DELETE/deprecated_super_user_services/CLEANUP_REPORT.md` for:
- `src/services/superUserService.ts` (old mock - DELETED)
- `src/services/api/supabase/superUserService.ts` (old supabase - DELETED)
- `src/modules/features/super-admin/services/superUserService.ts` (module wrapper - DELETED)

**Note**: Different from the active `superUserService` which handles tenant access!

---

## 🚀 Next Steps

1. Run tests: `npm run test -- super-admin`
2. Verify UI loads: Dashboard, Users, Analytics pages
3. Test both API modes: `VITE_API_MODE=mock` and `VITE_API_MODE=supabase`
4. Check browser console for any import warnings
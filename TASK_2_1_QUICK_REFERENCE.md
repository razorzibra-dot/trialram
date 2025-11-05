---
title: Task 2.1 Quick Reference - User Type Super Admin Fields
description: Quick guide to using new super admin fields in User type
date: 2025-02-20
status: ACTIVE
category: super-admin
---

# Task 2.1 Quick Reference

## New User Fields

### Super Admin Fields Added to `User` Interface

```typescript
// src/types/auth.ts

export interface User {
  // ... existing fields ...
  
  // ⭐ NEW FIELDS (Task 2.1)
  isSuperAdmin: boolean;              // Is user a platform super admin?
  isSuperAdminMode?: boolean;         // Currently impersonating?
  impersonatedAsUserId?: string;      // Which user is being impersonated?
  impersonationLogId?: string;        // Which session log entry?
}
```

---

## Usage Examples

### Checking if User is Super Admin

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user } = useAuth();
  
  // ✅ Check if super admin
  if (user?.isSuperAdmin) {
    console.log('User is a super admin');
  }
  
  // Check impersonation status
  if (user?.isSuperAdminMode) {
    console.log(`Admin is impersonating: ${user.impersonatedAsUserId}`);
  }
}
```

### Type-Safe Super Admin Detection

```typescript
function isSuperAdmin(user: User | null): boolean {
  return user?.isSuperAdmin === true;
}

function isImpersonating(user: User | null): boolean {
  return user?.isSuperAdminMode === true;
}

function getImpersonatedUserId(user: User | null): string | undefined {
  return user?.impersonatedAsUserId;
}
```

### Creating User Objects

```typescript
// Regular user
const regularUser: User = {
  id: 'user-1',
  email: 'user@company.com',
  name: 'John Doe',
  role: 'manager',
  status: 'active',
  tenantId: 'company-123',
  createdAt: new Date().toISOString(),
  isSuperAdmin: false, // Always false for regular users
};

// Super admin (not impersonating)
const superAdmin: User = {
  id: 'super_admin_1',
  email: 'admin@platform.com',
  name: 'Platform Administrator',
  role: 'super_admin',
  status: 'active',
  tenantId: null, // ← Super admins have NULL tenantId
  createdAt: new Date().toISOString(),
  isSuperAdmin: true,
  isSuperAdminMode: false,
  impersonatedAsUserId: undefined,
  impersonationLogId: undefined,
};

// Super admin (impersonating)
const impersonatingAdmin: User = {
  ...superAdmin,
  isSuperAdminMode: true,
  impersonatedAsUserId: 'user-123',
  impersonationLogId: 'log-456',
};
```

---

## Field Details

### `isSuperAdmin: boolean`

**Purpose**: Identifies platform-level super admins  
**Type**: Required (always present)  
**Values**:
- `true` - User is a platform super admin
- `false` - User is a regular tenant user

**Rules**:
- Super admins: `role === 'super_admin'` AND `tenantId === null`
- Regular users: Any role with valid tenantId

**Example**:
```typescript
if (user.isSuperAdmin) {
  // User can access super-admin module only
  // User can impersonate any tenant user
}
```

---

### `isSuperAdminMode?: boolean`

**Purpose**: Indicates current impersonation session  
**Type**: Optional (default: false)  
**Values**:
- `true` - Super admin is currently impersonating another user
- `false` or `undefined` - Not impersonating

**Rules**:
- Only meaningful for super admins (`isSuperAdmin === true`)
- Set to `true` when impersonation session starts
- Set to `false` when impersonation session ends

**Example**:
```typescript
if (user.isSuperAdminMode) {
  // Show "Impersonation Mode" indicator in UI
  // Display impersonated user details
}
```

---

### `impersonatedAsUserId?: string`

**Purpose**: Tracks which user is being impersonated  
**Type**: Optional UUID string  
**Values**:
- UUID of impersonated user when in impersonation mode
- `undefined` when not impersonating

**Rules**:
- Only set when `isSuperAdminMode === true`
- Cleared when impersonation session ends
- Used for audit trail tracking

**Example**:
```typescript
if (user.impersonatedAsUserId) {
  // Fetch details of impersonated user
  const impersonatedUser = await userService.getUser(user.impersonatedAsUserId);
}
```

---

### `impersonationLogId?: string`

**Purpose**: Links to impersonation session log entry  
**Type**: Optional UUID string  
**Values**:
- UUID of log entry in `super_user_impersonation_logs` table
- `undefined` when not impersonating

**Rules**:
- Set when impersonation session starts
- Links to database log for audit trail
- Cleared when session ends

**Example**:
```typescript
if (user.impersonationLogId) {
  // Fetch session details
  const sessionLog = await superUserService.getImpersonationLog(user.impersonationLogId);
}
```

---

## TenantId Changes

### Important: TenantId is Now `string | null`

```typescript
// Regular users (tenant-bound)
user.tenantId = 'company-123';  // String: assigned to specific tenant

// Super admins (platform-wide)
user.tenantId = null;  // Null: platform-level access
```

**Implications**:
- Check for `null` when filtering by tenant
- Super admins can access any tenant data (with proper guards)
- Regular users bound to their tenant

---

## Backward Compatibility

### Existing Code Still Works

```typescript
// ✅ This still works
const user = getCurrentUser();
console.log(user.id, user.email, user.role);

// ✅ New fields are optional for regular users
const regularUser: User = {
  id: 'user-1',
  email: 'user@company.com',
  role: 'agent',
  tenantId: 'company-123',
  createdAt: new Date().toISOString(),
  isSuperAdmin: false,
  // Don't need to set isSuperAdminMode, etc.
};

// ✅ Regular user type-checking still works
if (user.role === 'admin') {
  // Existing permission checks
}
```

### What Changed

| What | Before | After | Impact |
|------|--------|-------|--------|
| `User` interface | 22 fields | 26 fields | No breaking changes |
| `tenantId` type | `string` | `string \| null` | Super admins now have `null` |
| Mock users | No super admin flag | `isSuperAdmin` added | Consistent across app |
| Login method | No super admin fields | All fields set | Auth context updated |

---

## Testing Your Code

### Run Tests
```bash
npm test -- auth.types.test
```

### Check Type Safety
```bash
npm run validate:code
```

### Test with Mock Data
```typescript
import { authService } from '@/services/authService';

// Login as super admin
const response = await authService.login({
  email: 'superadmin@platform.com',
  password: 'password',
});

console.log(response.user.isSuperAdmin);  // true
console.log(response.user.tenantId);      // null
```

---

## Common Patterns

### Pattern 1: Super Admin Gate

```typescript
function SuperAdminOnly() {
  const { user } = useAuth();
  
  if (!user?.isSuperAdmin) {
    return <div>Access Denied</div>;
  }
  
  return <SuperAdminDashboard />;
}
```

### Pattern 2: Show Impersonation Info

```typescript
function ImpersonationBadge() {
  const { user } = useAuth();
  
  if (!user?.isSuperAdminMode) return null;
  
  return (
    <Badge>
      Impersonating: {user.impersonatedAsUserId}
    </Badge>
  );
}
```

### Pattern 3: Context Helper Method

```typescript
// In AuthContext (Phase 2.6)
function isSuperAdmin(): boolean {
  return currentUser?.isSuperAdmin === true;
}

function isImpersonating(): boolean {
  return currentUser?.isSuperAdminMode === true;
}

// Usage:
const { isSuperAdmin, isImpersonating } = useAuth();
```

---

## Next Steps

This completes Task 2.1. The next task (2.2) will:
1. Create `useModuleAccess` hook
2. Use `isSuperAdmin` to determine module access
3. Prevent super admins from accessing regular modules
4. Build on this type foundation

---

## Files Reference

| File | Change | Status |
|------|--------|--------|
| `src/types/auth.ts` | Added 4 super admin fields | ✅ Updated |
| `src/services/authService.ts` | Updated mock users & methods | ✅ Updated |
| `src/types/__tests__/auth.types.test.ts` | Added test suite | ✅ Created |

---

**Last Updated**: 2025-02-20  
**Task Status**: ✅ COMPLETE  
**Ready for**: Task 2.2 (useModuleAccess Hook)
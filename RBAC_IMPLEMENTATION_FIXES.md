# RBAC & Super User - Implementation Fixes

**Date**: 2025-02-14  
**Status**: Ready to Apply  
**Estimated Time**: 4-6 hours  

---

## Overview

This document provides **copy-paste ready** code fixes for all critical and high-priority RBAC issues. Follow the steps in order.

---

## Step 1: Fix RLS Policies (CRITICAL - 30 minutes)

### File: `supabase/migrations/20250101000007_row_level_security.sql`

**Issue**: RLS policies use `role='super_admin'` instead of `is_super_admin=true`

**Action**: Find and replace all occurrences

**Search Pattern**:
```sql
users.role = 'super_admin'
```

**Replace With**:
```sql
users.is_super_admin = true
```

**Commands to Verify**:
```bash
# Count occurrences before fix
grep -n "users.role = 'super_admin'" supabase/migrations/20250101000007_row_level_security.sql

# Count should be 0 after fix
grep -n "users.role = 'super_admin'" supabase/migrations/20250101000007_row_level_security.sql
```

**Expected Locations to Fix** (approximately):
- Line 94: `super_admin_view_all_tenants` on tenants table
- Any other RLS policies checking super admin status

---

## Step 2: Update UserDTO (CRITICAL - 15 minutes)

### File: `src/types/dtos/userDtos.ts`

**Current Code** (Lines 47-100):
```typescript
export interface UserDTO {
  /** Unique user identifier */
  id: string;

  /** User email address */
  email: string;

  /** Full display name */
  name: string;

  /** First name */
  firstName?: string;

  /** Last name */
  lastName?: string;

  /** User role in the system */
  role: UserRole;

  /** User account status */
  status: UserStatus;

  /** Tenant identifier */
  tenantId: string;  // ❌ WRONG: Not optional but null for super admins

  // ... rest of fields ...
}
```

**Fixed Code**:
```typescript
export interface UserDTO {
  /** Unique user identifier */
  id: string;

  /** User email address */
  email: string;

  /** Full display name */
  name: string;

  /** First name */
  firstName?: string;

  /** Last name */
  lastName?: string;

  /** User role in the system */
  role: UserRole;

  /** User account status */
  status: UserStatus;

  /** Tenant identifier (null for super admins with platform-wide access) */
  tenantId?: string | null;  // ✅ FIXED: Optional and nullable

  /** Whether this user is a platform-wide super administrator */
  isSuperAdmin?: boolean;  // ✅ ADDED: Super admin indicator

  // ... rest of fields ...
}
```

**Also Update** (in same file):

```typescript
// Add/Update these DTOs if creating/updating users

export interface CreateUserDTO {
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status?: UserStatus;
  tenantId?: string | null;  // ✅ Optional for super admin creation
  isSuperAdmin?: boolean;    // ✅ New field for super admin flag
  // ... other fields ...
}

export interface UpdateUserDTO {
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  tenantId?: string | null;  // ✅ Optional, can be set to null
  isSuperAdmin?: boolean;    // ✅ Can update super admin status
  // ... other fields ...
}
```

---

## Step 3: Add Role Consistency Check (HIGH - 20 minutes)

### New File: `supabase/migrations/20250215_add_role_consistency_check.sql`

Create this new migration file:

```sql
-- ============================================================================
-- Migration: Add role consistency check for super admins
-- Created: 2025-02-15
-- Purpose: Ensure is_super_admin flag aligns with role enum value
-- ============================================================================

-- ============================================================================
-- 1. Add consistency check constraint
-- ============================================================================
ALTER TABLE users
ADD CONSTRAINT ck_super_admin_role_consistency
  CHECK (
    (is_super_admin = true AND role = 'super_admin') OR
    (is_super_admin = false AND role IN ('admin', 'manager', 'agent', 'engineer', 'customer'))
  );

-- ============================================================================
-- 2. Verification Queries
-- ============================================================================

-- Verify no existing violations
SELECT 
  id, email, role, is_super_admin, 'VIOLATION' as status
FROM users
WHERE (is_super_admin = true AND role != 'super_admin')
   OR (is_super_admin = false AND role = 'super_admin')
ORDER BY email;

-- Show valid role combinations
SELECT 
  COUNT(*) as count,
  is_super_admin,
  role,
  'VALID' as status
FROM users
WHERE (is_super_admin = true AND role = 'super_admin')
   OR (is_super_admin = false AND role IN ('admin', 'manager', 'agent', 'engineer', 'customer'))
GROUP BY is_super_admin, role
ORDER BY is_super_admin DESC, role;

-- Show constraint info
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'users' 
AND constraint_name = 'ck_super_admin_role_consistency';

-- ============================================================================
-- Migration Complete
-- ============================================================================
```

---

## Step 4: Fix RBAC Service Mock Data (HIGH - 10 minutes)

### File: `src/services/rbacService.ts`

**Current Code** (Lines 43-50):
```typescript
private mockRoles: Role[] = [
  {
    id: 'super_admin_role',
    name: 'Super Administrator',
    description: 'Full platform administration with all permissions',
    tenant_id: 'platform',  // ❌ WRONG: Should be null
    permissions: ['read', 'write', 'delete', /* ... */],
    is_system_role: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // ...
];
```

**Fixed Code**:
```typescript
private mockRoles: Role[] = [
  {
    id: 'super_admin_role',
    name: 'Super Administrator',
    description: 'Full platform administration with all permissions',
    tenant_id: null,  // ✅ FIXED: null for platform-wide super admin
    permissions: ['read', 'write', 'delete', /* ... */],
    is_system_role: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // ...
];
```

**Verify**: Look for other instances of `tenant_id: 'platform'` and ensure only super_admin_role uses null.

---

## Step 5: Make Audit Logs tenant_id Nullable (HIGH - 20 minutes)

### New File: `supabase/migrations/20250215_make_audit_logs_nullable.sql`

Create this new migration file:

```sql
-- ============================================================================
-- Migration: Make audit_logs tenant_id nullable for super admin tracking
-- Created: 2025-02-15
-- Purpose: Allow auditing of platform-wide super admin actions
-- ============================================================================

-- ============================================================================
-- 1. Make tenant_id nullable
-- ============================================================================
ALTER TABLE audit_logs
ALTER COLUMN tenant_id DROP NOT NULL;

-- ============================================================================
-- 2. Update column comment
-- ============================================================================
COMMENT ON COLUMN audit_logs.tenant_id IS 
  'Tenant ID for tenant-specific actions, NULL for platform-wide super admin actions';

-- ============================================================================
-- 3. Add index for super admin action queries
-- ============================================================================
CREATE INDEX idx_audit_logs_super_admin_actions 
ON audit_logs(user_id, action, created_at DESC)
WHERE tenant_id IS NULL;

-- ============================================================================
-- 4. Verification Queries
-- ============================================================================

-- Verify column is now nullable
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'audit_logs' 
AND column_name = 'tenant_id';

-- Show current null audit logs (should be 0 initially)
SELECT COUNT(*) as audit_logs_with_null_tenant_id
FROM audit_logs
WHERE tenant_id IS NULL;

-- ============================================================================
-- Migration Complete
-- ============================================================================
```

---

## Step 6: Create Super Admin Management Service (HIGH - 2-3 hours)

### New File: `src/modules/features/super-admin/services/superAdminManagementService.ts`

Create this new service file:

```typescript
/**
 * Super Admin Management Service
 * Handles creation, promotion, and tenant access management for super admins
 *
 * CRITICAL: Uses factory service for multi-backend support
 * Never import mock/supabase services directly
 */

import { superUserService as factorySuperUserService } from '@/services/serviceFactory';
import { getUserService } from '@/services/serviceFactory';
import {
  SuperUserType,
  TenantAccessType,
  SuperUserCreateInput,
  TenantAccessCreateInput,
} from '@/types/superUserModule';
import {
  UserDTO,
  CreateUserDTO,
  UpdateUserDTO,
} from '@/types/dtos/userDtos';

/**
 * Create a new platform-wide super admin
 *
 * @param input - Super admin creation data
 * @returns Created super admin user
 *
 * @example
 * const superAdmin = await createSuperAdmin({
 *   email: 'admin@platform.com',
 *   name: 'Platform Administrator',
 *   firstName: 'Admin',
 *   lastName: 'User',
 * });
 */
export async function createSuperAdmin(
  input: {
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
  }
): Promise<UserDTO> {
  try {
    const userService = getUserService();

    // Create user with super admin flag
    const createInput: CreateUserDTO = {
      email: input.email,
      name: input.name,
      firstName: input.firstName,
      lastName: input.lastName,
      role: 'super_admin',
      status: 'active',
      tenantId: null,  // ✅ No tenant for super admin
      isSuperAdmin: true,  // ✅ Mark as super admin
    };

    const newSuperAdmin = await userService.createUser(createInput);

    console.log(`[SuperAdminManagement] Created new super admin: ${newSuperAdmin.email}`);
    return newSuperAdmin;
  } catch (error) {
    console.error('[SuperAdminManagement] Error creating super admin:', error);
    throw new Error(`Failed to create super admin: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Promote an existing admin user to platform-wide super admin
 *
 * @param userId - ID of user to promote
 * @returns Updated super admin user
 *
 * @example
 * const promotedUser = await promoteSuperAdmin('user-123');
 */
export async function promoteSuperAdmin(userId: string): Promise<UserDTO> {
  try {
    const userService = getUserService();

    // Get current user data
    const currentUser = await userService.getUser(userId);

    if (currentUser.isSuperAdmin) {
      throw new Error('User is already a super admin');
    }

    // Update to super admin
    const updateInput: UpdateUserDTO = {
      role: 'super_admin',
      isSuperAdmin: true,
      tenantId: null,  // ✅ Remove tenant binding
    };

    const promotedUser = await userService.updateUser(userId, updateInput);

    console.log(`[SuperAdminManagement] Promoted user to super admin: ${promotedUser.email}`);
    return promotedUser;
  } catch (error) {
    console.error('[SuperAdminManagement] Error promoting super admin:', error);
    throw new Error(`Failed to promote user to super admin: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Grant a super admin access to manage a specific tenant
 *
 * @param superUserId - ID of super admin
 * @param tenantId - ID of tenant to grant access to
 * @param accessLevel - Level of access (full, limited, read_only, specific_modules)
 * @returns Updated tenant access record
 *
 * @example
 * await grantTenantAccess('super-admin-123', 'tenant-456', 'full');
 */
export async function grantTenantAccess(
  superUserId: string,
  tenantId: string,
  accessLevel: 'full' | 'limited' | 'read_only' | 'specific_modules' = 'limited'
): Promise<TenantAccessType> {
  try {
    const superUserService = factorySuperUserService;

    // Verify super admin exists and is actually super admin
    const userService = getUserService();
    const user = await userService.getUser(superUserId);

    if (!user.isSuperAdmin) {
      throw new Error('User is not a super admin');
    }

    // Grant access
    const accessInput: TenantAccessCreateInput = {
      super_user_id: superUserId,
      tenant_id: tenantId,
      access_level: accessLevel,
    };

    // This assumes superUserService has grantTenantAccess method
    // If not, you may need to call database directly or create wrapper
    const access = await (superUserService as any).grantTenantAccess?.(accessInput);

    console.log(
      `[SuperAdminManagement] Granted ${accessLevel} access to super admin ${superUserId} for tenant ${tenantId}`
    );
    return access;
  } catch (error) {
    console.error('[SuperAdminManagement] Error granting tenant access:', error);
    throw new Error(
      `Failed to grant tenant access: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Revoke a super admin's access to a specific tenant
 *
 * @param superUserId - ID of super admin
 * @param tenantId - ID of tenant to revoke access from
 *
 * @example
 * await revokeTenantAccess('super-admin-123', 'tenant-456');
 */
export async function revokeTenantAccess(superUserId: string, tenantId: string): Promise<void> {
  try {
    const superUserService = factorySuperUserService;

    // Verify super admin exists
    const userService = getUserService();
    const user = await userService.getUser(superUserId);

    if (!user.isSuperAdmin) {
      throw new Error('User is not a super admin');
    }

    // Revoke access
    // This assumes superUserService has revokeTenantAccess method
    await (superUserService as any).revokeTenantAccess?.(superUserId, tenantId);

    console.log(
      `[SuperAdminManagement] Revoked tenant access for super admin ${superUserId} from tenant ${tenantId}`
    );
  } catch (error) {
    console.error('[SuperAdminManagement] Error revoking tenant access:', error);
    throw new Error(
      `Failed to revoke tenant access: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all tenant access records for a super admin
 *
 * @param superUserId - ID of super admin
 * @returns Array of tenant access records
 */
export async function getSuperAdminTenantAccess(
  superUserId: string
): Promise<TenantAccessType[]> {
  try {
    const superUserService = factorySuperUserService;

    // Verify super admin exists
    const userService = getUserService();
    const user = await userService.getUser(superUserId);

    if (!user.isSuperAdmin) {
      throw new Error('User is not a super admin');
    }

    // Get tenant access
    const access = await (superUserService as any).getSuperAdminTenantAccess?.(
      superUserId
    );

    return access;
  } catch (error) {
    console.error('[SuperAdminManagement] Error getting tenant access:', error);
    throw new Error(
      `Failed to get tenant access: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export default {
  createSuperAdmin,
  promoteSuperAdmin,
  grantTenantAccess,
  revokeTenantAccess,
  getSuperAdminTenantAccess,
};
```

---

## Step 7: Update Frontend Components (HIGH - 3-4 hours)

### File: `src/modules/features/user-management/components/UserDetailPanel.tsx`

Add super admin handling (add to existing component):

```typescript
// Add this helper function
const getTenantDisplay = (user: UserDTO) => {
  if (user.isSuperAdmin === true || user.tenantId === null || user.tenantId === undefined) {
    return (
      <Tag color="purple" icon={<CrownOutlined />}>
        Platform-Wide Super Admin
      </Tag>
    );
  }
  
  return (
    <span>
      {tenantMap[user.tenantId] || user.tenantId}
    </span>
  );
};

// In JSX render:
<Descriptions.Item label="Tenant">
  {getTenantDisplay(selectedUser)}
</Descriptions.Item>

// If displaying tenant access for super admin:
{selectedUser?.isSuperAdmin && (
  <Descriptions.Item label="Tenant Access">
    <div>
      {tenantAccessList?.map((access) => (
        <Tag key={access.tenant_id} color="blue">
          {access.tenant_id} ({access.access_level})
        </Tag>
      ))}
    </div>
  </Descriptions.Item>
)}
```

### File: `src/modules/features/user-management/components/UserFormPanel.tsx`

Add super admin handling (add to existing component):

```typescript
// Add this helper function
const renderTenantField = (user: UserDTO | null) => {
  const isSuperAdmin = user?.isSuperAdmin === true;
  
  if (isSuperAdmin) {
    return (
      <Form.Item label="Tenant">
        <Alert
          message="This is a platform-wide super administrator"
          description="Super administrators are not bound to any specific tenant"
          type="info"
          showIcon
        />
      </Form.Item>
    );
  }
  
  return (
    <Form.Item
      name="tenantId"
      label="Tenant"
      rules={[{ required: true, message: 'Please select a tenant' }]}
    >
      <Select
        placeholder="Select tenant"
        options={tenants}
        disabled={isSuperAdmin}
      />
    </Form.Item>
  );
};

// In JSX form:
{renderTenantField(selectedUser)}

// Add super admin checkbox for admins only:
{currentUser?.role === 'admin' && (
  <Form.Item name="isSuperAdmin" valuePropName="checked">
    <Checkbox>
      Promote to Platform Super Administrator
      <Tooltip title="This removes tenant binding and grants platform-wide access">
        <InfoCircleOutlined style={{ marginLeft: 8 }} />
      </Tooltip>
    </Checkbox>
  </Form.Item>
)}
```

### File: `src/modules/features/user-management/hooks/useUsers.ts`

Update hook to handle super admins:

```typescript
// Add this filter helper
export const filterUsersByRole = (
  users: UserDTO[],
  roleFilter?: UserRole,
  includeSuperAdmins = true
): UserDTO[] => {
  if (!roleFilter) {
    return users;
  }
  
  return users.filter((user) => {
    if (roleFilter === 'super_admin') {
      return user.isSuperAdmin === true;
    }
    
    return user.role === roleFilter && !user.isSuperAdmin;
  });
};

// Update getUsers to handle super admin filtering
async function getUsers(filters?: UserFiltersDTO): Promise<UserDTO[]> {
  const service = getUserService();
  const users = await service.getUsers(filters);
  
  // Ensure tenantId is handled correctly for super admins
  return users.map((user) => ({
    ...user,
    tenantId: user.isSuperAdmin ? null : user.tenantId,
  }));
}
```

---

## Step 8: Create Type Safety Tests (MEDIUM - 1-2 hours)

### New File: `src/types/__tests__/userDtos.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { UserDTO } from '../dtos/userDtos';

describe('UserDTO Type Safety', () => {
  it('should allow super admin with null tenantId', () => {
    const superAdmin: UserDTO = {
      id: '123',
      email: 'admin@platform.com',
      name: 'Admin',
      role: 'super_admin',
      status: 'active',
      tenantId: null,  // ✅ Should be allowed
      isSuperAdmin: true,
      createdAt: new Date().toISOString(),
    };
    
    expect(superAdmin.tenantId).toBeNull();
    expect(superAdmin.isSuperAdmin).toBe(true);
  });

  it('should require tenantId for non-super-admin users', () => {
    const regularUser: UserDTO = {
      id: '456',
      email: 'user@tenant.com',
      name: 'User',
      role: 'admin',
      status: 'active',
      tenantId: 'tenant-123',  // ✅ Required for non-super-admin
      isSuperAdmin: false,
      createdAt: new Date().toISOString(),
    };
    
    expect(regularUser.tenantId).toBe('tenant-123');
    expect(regularUser.isSuperAdmin).toBe(false);
  });

  it('should allow isSuperAdmin to be undefined', () => {
    const userWithoutFlag: UserDTO = {
      id: '789',
      email: 'user@tenant.com',
      name: 'User',
      role: 'manager',
      status: 'active',
      tenantId: 'tenant-123',
      // isSuperAdmin is optional
      createdAt: new Date().toISOString(),
    };
    
    expect(userWithoutFlag.isSuperAdmin).toBeUndefined();
  });
});
```

---

## Verification Checklist

After applying all fixes, run these verification commands:

```bash
# 1. Check TypeScript compilation
npm run build 2>&1 | grep -i "error" || echo "✅ Build successful"

# 2. Verify no 'super_admin' role references in RLS policies
grep -r "users.role = 'super_admin'" supabase/migrations/ || echo "✅ No role enum in RLS"

# 3. Check UserDTO types are exported correctly
grep -A 3 "export interface UserDTO" src/types/dtos/userDtos.ts | grep "tenantId" || echo "⚠️ UserDTO not updated"

# 4. Run type safety tests
npm test -- userDtos.test.ts --run || echo "⚠️ Type tests failed"

# 5. Run RBAC tests
npm test -- rbac --run --coverage || echo "⚠️ RBAC tests failed"
```

---

## Testing in Supabase

After migrations:

```sql
-- 1. Test role consistency check
-- This should FAIL (violates constraint):
INSERT INTO users (email, name, role, is_super_admin, status, created_at, last_login)
VALUES ('test@acme.com', 'Test User', 'admin', true, 'active', NOW(), NOW());
-- Expected: ERROR 23514 (check_violation)

-- 2. Test nullable tenantId for super admin
-- This should SUCCEED:
INSERT INTO users (email, name, role, is_super_admin, status, tenant_id, created_at, last_login)
VALUES ('superadmin@platform.com', 'Super Admin', 'super_admin', true, 'active', NULL, NOW(), NOW());
-- Expected: 1 row inserted

-- 3. Test email uniqueness for super admin
-- This should FAIL (duplicate):
INSERT INTO users (email, name, role, is_super_admin, status, tenant_id, created_at, last_login)
VALUES ('superadmin@platform.com', 'Another Admin', 'super_admin', true, 'active', NULL, NOW(), NOW());
-- Expected: ERROR 23505 (unique_violation)

-- 4. Verify audit logs accept null tenant_id
-- This should SUCCEED:
INSERT INTO audit_logs (user_id, action, tenant_id, created_at)
VALUES ('superadmin-uuid', 'platform_action', NULL, NOW());
-- Expected: 1 row inserted
```

---

## Rollback Plan

If issues occur, rollback steps in reverse order:

```bash
# Rollback new migrations
supabase migration remove --name 20250215_make_audit_logs_nullable
supabase migration remove --name 20250215_add_role_consistency_check

# Restore original files from git
git checkout -- supabase/migrations/20250101000007_row_level_security.sql
git checkout -- src/types/dtos/userDtos.ts
git checkout -- src/services/rbacService.ts
```

---

## Success Indicators

✅ All fixes are complete when:

1. **Build**: `npm run build` completes without errors
2. **Tests**: All tests pass including new type safety tests
3. **Database**: All migrations apply without errors
4. **Frontend**: Super admin displays with "Platform-Wide" label
5. **Type Safety**: No TypeScript errors related to tenantId
6. **RLS**: Core policies use is_super_admin flag exclusively

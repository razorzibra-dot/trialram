# RBAC & Super User - Quick Reference & Action Plan

**Version**: 1.0  
**Date**: 2025-02-14  
**Status**: Ready for Implementation  
**Target**: 100% RBAC Compliance

---

## 🎯 What's Working ✅

| Component | Status | Details |
|-----------|--------|---------|
| **Database Schema** | ✅ Solid | tenant_id properly nullable, constraints correct |
| **Enum Definition** | ✅ Correct | All 6 roles defined correctly |
| **Super User Tables** | ✅ Excellent | Proper many-to-many with tenant access |
| **Indexes** | ✅ Optimized | Composite indexes for performance |
| **Seed Data** | ✅ Valid | Super admins correctly set to tenant_id=NULL |
| **Super User RLS** | ✅ Correct | Uses is_super_admin=true flag (Migration 20250214) |
| **Tenant Isolation** | ✅ Strong | Email uniqueness per tenant/global working |

---

## 🔴 Critical Issues (Fix Now)

### Issue 1: RLS Policies Use Wrong Field

**Problem**: Core RLS policies use `role='super_admin'` instead of `is_super_admin=true`

**Location**: `supabase/migrations/20250101000007_row_level_security.sql`

**Impact**: Security risk - role enum can be manipulated

**Fix** (5 minutes):
```bash
# Find all instances:
grep -n "users.role = 'super_admin'" supabase/migrations/20250101000007_row_level_security.sql

# Replace with:
sed -i "s/users\.role = 'super_admin'/users.is_super_admin = true/g" supabase/migrations/20250101000007_row_level_security.sql
```

**Verification**:
```sql
-- Test that super admin still has access
SELECT * FROM tenants; -- Should return all tenants for super admin
```

---

### Issue 2: UserDTO tenantId Type Mismatch

**Problem**: UserDTO says `tenantId: string` but super admins have `tenantId=NULL`

**Location**: `src/types/dtos/userDtos.ts` Line 70

**Impact**: Type errors when super admin data flows through app

**Fix** (5 minutes):
```typescript
// Change from:
tenantId: string;

// Change to:
tenantId?: string | null;
isSuperAdmin?: boolean;
```

---

### Issue 3: Missing Role Consistency Check

**Problem**: Database allows `role='admin', is_super_admin=true` (invalid state)

**Location**: Database constraints

**Impact**: Data inconsistency

**Fix** (Create new migration):
```sql
-- File: supabase/migrations/20250215_add_role_consistency_check.sql

ALTER TABLE users
ADD CONSTRAINT ck_super_admin_role_consistency
  CHECK (
    (is_super_admin = true AND role = 'super_admin') OR
    (is_super_admin = false AND role IN ('admin', 'manager', 'agent', 'engineer', 'customer'))
  );
```

---

### Issue 4: RBAC Service Mock Data Wrong

**Problem**: Super admin role defined with tenant_id='platform' (should be NULL)

**Location**: `src/services/rbacService.ts` Line 46

**Fix** (2 minutes):
```typescript
// Change from:
tenant_id: 'platform',

// Change to:
tenant_id: null,
```

---

## 🟠 High Priority Gaps (This Week)

### Gap 1: No Super Admin Creation Workflow

**Problem**: Cannot create or manage super admins

**Required**:
```typescript
// Create: src/modules/features/super-admin/services/superAdminManagementService.ts

export const superAdminManagementService = {
  // Create new super admin (unbound to any tenant)
  createSuperAdmin: async (email: string, name: string) => {
    // 1. Create user with role='super_admin', is_super_admin=true, tenant_id=NULL
    // 2. Return new super admin with empty tenant access list
  },
  
  // Promote existing admin to super admin
  promoteSuperAdmin: async (userId: string) => {
    // 1. Update role to 'super_admin'
    // 2. Set is_super_admin=true
    // 3. Set tenant_id=NULL
  },
  
  // Grant super admin access to a tenant
  grantTenantAccess: async (superUserId: string, tenantId: string, accessLevel: string) => {
    // 1. Add row to super_user_tenant_access
    // 2. Return updated super admin with new tenant
  },
  
  // Revoke super admin access to a tenant
  revokeTenantAccess: async (superUserId: string, tenantId: string) => {
    // 1. Delete from super_user_tenant_access
    // 2. Return updated super admin
  }
};
```

**Effort**: 2-3 hours  
**Priority**: HIGH - Cannot operate without this

---

### Gap 2: Frontend Doesn't Handle tenantId=NULL

**Problem**: Components crash or display badly when super admin tenantId is NULL

**Required Updates**:
1. **UserDetailPanel.tsx**: Show "Platform-Wide" for super admin
2. **UserFormPanel.tsx**: Disable tenant selection for super admin
3. **useUsers.ts hook**: Filter by is_super_admin flag
4. **User list**: Show super admin indicator

**Example Fix**:
```typescript
// In UserDetailPanel.tsx
const getTenantDisplay = (user: UserDTO) => {
  if (user.isSuperAdmin || user.tenantId === null) {
    return <Tag color="purple">Platform-Wide Super Admin</Tag>;
  }
  return <span>{getTenantName(user.tenantId)}</span>;
};

// In UserFormPanel.tsx
const renderTenantField = () => {
  if (selectedUser?.isSuperAdmin) {
    return <Alert message="This is a platform-wide super admin" type="info" />;
  }
  return <Select options={tenants} />;
};
```

**Effort**: 3-4 hours  
**Priority**: HIGH - UX breaks without this

---

### Gap 3: Audit Trail Cannot Track Super Admin Actions

**Problem**: audit_logs.tenant_id is NOT NULL, but super admins have no tenant

**Fix** (Create new migration):
```sql
-- File: supabase/migrations/20250215_make_audit_logs_nullable.sql

ALTER TABLE audit_logs
ALTER COLUMN tenant_id DROP NOT NULL;

-- Update comment
COMMENT ON COLUMN audit_logs.tenant_id IS 
  'Tenant ID (NULL for platform-wide super admin actions)';
```

**Verification**:
```sql
-- Should now be able to insert audit logs for super admin actions
INSERT INTO audit_logs (user_id, action, tenant_id, created_at)
VALUES ('super-admin-uuid', 'create_user', NULL, NOW());
```

**Effort**: 30 minutes  
**Priority**: HIGH - Compliance requirement

---

## 🟡 Medium Priority (Next Week)

- [ ] Update User Management module for super admin support
- [ ] Create comprehensive documentation for workflows
- [ ] Add integration tests for RBAC isolation
- [ ] Add type safety tests for UserDTO
- [ ] Update RBAC service mock data for all roles

---

## 📋 Quick Checklist

### Before Deployment

- [ ] All RLS policies use `is_super_admin = true` (not role enum)
- [ ] UserDTO tenantId is optional/nullable
- [ ] Role consistency check constraint exists
- [ ] Audit log tenant_id is nullable
- [ ] Super admin creation workflow works
- [ ] Frontend displays super admin correctly
- [ ] All tests pass

### Validation Commands

```bash
# 1. Check for remaining role enum usage in RLS
grep -r "users.role = 'super_admin'" supabase/migrations/

# 2. Verify UserDTO types
grep -A 2 "tenantId:" src/types/dtos/userDtos.ts

# 3. Test database constraints
psql -U postgres -d postgres -c \
  "SELECT constraint_name FROM information_schema.table_constraints 
   WHERE table_name='users' AND constraint_name LIKE '%super_admin%';"

# 4. Run integration tests
npm test -- super-admin --coverage

# 5. Run type check
tsc --noEmit
```

---

## 📊 RBAC Role Hierarchy (Reference)

```
┌─────────────────────────────────────────────┐
│     SUPER_ADMIN (Platform-Wide)             │
│     role='super_admin'                      │
│     is_super_admin=true                     │
│     tenant_id=NULL                          │
│     Can manage: ALL TENANTS                 │
│     Permissions: ALL SYSTEM PERMISSIONS     │
└─────────────────────────────────────────────┘
           ↓ CAN MANAGE
┌─────────────────────────────────────────────┐
│     ADMIN (Tenant-Scoped)                   │
│     role='admin'                            │
│     is_super_admin=false                    │
│     tenant_id=specific_tenant               │
│     Can manage: OWN TENANT                  │
│     Permissions: TENANT MANAGEMENT          │
└─────────────────────────────────────────────┘
           ↓ CAN MANAGE
┌─────────────────────────────────────────────┐
│  MANAGER/ENGINEER/AGENT (Tenant-Scoped)    │
│  Various roles based on job function        │
│  is_super_admin=false                       │
│  tenant_id=specific_tenant                  │
│  Can manage: LIMITED TO ROLE                │
│  Permissions: ROLE-SPECIFIC                 │
└─────────────────────────────────────────────┘
```

---

## 🚀 Implementation Timeline

### Week 1: Critical Fixes
- [ ] Day 1-2: Fix RLS policies + UserDTO + Role consistency
- [ ] Day 3-4: Fix audit trail + RBAC service mock
- [ ] Day 5: Testing + Validation

### Week 2: Gap Implementation
- [ ] Day 1-2: Create super admin management service
- [ ] Day 3-4: Update frontend components
- [ ] Day 5: Integration testing

### Week 3: Documentation & Testing
- [ ] Days 1-2: Write comprehensive docs
- [ ] Days 3-5: Create test suite + edge cases

### Week 4: Verification
- [ ] Days 1-2: Type safety verification
- [ ] Days 3-4: RLS policy testing
- [ ] Day 5: Performance testing + review

---

## 💡 Key Rules to Remember

### Rule 1: Role vs Flag Consistency
```sql
-- VALID:
role='super_admin' AND is_super_admin=true AND tenant_id IS NULL  ✅
role='admin' AND is_super_admin=false AND tenant_id IS NOT NULL  ✅

-- INVALID:
role='admin' AND is_super_admin=true  ❌
role='super_admin' AND is_super_admin=false  ❌
is_super_admin=true AND tenant_id IS NOT NULL  ❌
```

### Rule 2: Tenant Isolation
```typescript
// SUPER ADMIN: Can query all tenants
const allCustomers = await superAdminService.getAllCustomers();

// ADMIN: Can only query own tenant
const ownTenantCustomers = await adminService.getCustomers(tenantId);

// REGULAR USER: Can only query assigned tenant
const myCustomers = await userService.getCustomers(getCurrentTenantId());
```

### Rule 3: Email Uniqueness
```sql
-- SUPER ADMIN emails: Globally unique
superadmin1@platform.admin  ✅ Unique across system

-- TENANT USER emails: Unique per tenant
admin@acme.com (Acme Corporation)  ✅
admin@techcorp.com (Tech Solutions)  ✅

-- Same email, different tenants is OK for regular users
```

---

## 🔗 Related Documentation

- **Full Audit Report**: `RBAC_SUPER_USER_AUDIT_REPORT.md`
- **Super User Module**: `src/modules/features/super-admin/DOC.md`
- **User Management RBAC**: `src/modules/features/user-management/PERMISSIONS.md`
- **Database Migrations**: `supabase/migrations/`

---

## 📞 Questions?

Refer to the full audit report for:
- Detailed findings per issue
- Risk assessment
- Success criteria
- Migration scripts

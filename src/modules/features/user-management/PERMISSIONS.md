# User Management Module - Permissions Reference

**Version**: 1.0.0  
**Last Updated**: 2025-02-07  
**Status**: Complete - Phase 3.2 Implementation  

---

## Overview

This document defines all permissions available in the User Management module and describes the role-based access control (RBAC) hierarchy that governs who can perform which actions.

## Permission Categories

Permissions follow a `resource:action` format for clarity and consistency:

### User Management Permissions

| Permission | Code | Description | Roles | Usage |
|-----------|------|-------------|-------|-------|
| **List Users** | `user:list` | View all users in tenant | Admin, Manager, User | UsersPage, Reports |
| **View User Details** | `user:view` | View individual user profile | Admin, Manager, User | UserDetailPanel, Profile |
| **Create User** | `user:create` | Create new user account | Admin | UserFormPanel |
| **Edit User** | `user:edit` | Modify user information | Admin, Manager* | UserFormPanel, Inline edit |
| **Delete User** | `user:delete` | Remove user account | Admin | Bulk actions |
| **Reset Password** | `user:reset_password` | Force password reset for user | Admin, Manager* | Action menu |

### Role Management Permissions

| Permission | Code | Description | Roles | Usage |
|-----------|------|-------------|-------|-------|
| **Manage Roles** | `role:manage` | Create, edit, delete roles | Super-Admin, Admin | RoleManagementPage |
| **View Roles** | `role:view` | View role definitions | Admin, Manager | RoleManagementPage |
| **Assign Roles** | `role:assign` | Assign roles to users | Admin, Manager* | UserFormPanel |

### Permission Management Permissions

| Permission | Code | Description | Roles | Usage |
|-----------|------|-------------|-------|-------|
| **Manage Permissions** | `permission:manage` | Modify permission matrix | Super-Admin | PermissionMatrixPage |
| **View Permissions** | `permission:view` | View permission definitions | Super-Admin, Admin | PermissionMatrixPage |

### Tenant Management Permissions

| Permission | Code | Description | Roles | Usage |
|-----------|------|-------------|-------|-------|
| **Manage Tenant Users** | `tenant:users` | Manage users across tenants | Super-Admin | Super-Admin panel |
| **View Tenant Info** | `tenant:view` | View tenant information | Admin | Settings |

---

## Role Hierarchy

The system implements a strict hierarchical role structure where upper roles include all permissions of lower roles:

```
┌─────────────────────┐
│   Super-Admin       │  ← All permissions (system-wide)
│                     │
└──────────┬──────────┘
           │
      Includes:
           │
    ┌──────▼──────┐
    │    Admin    │  ← All user management permissions (tenant-scoped)
    │             │
    └──────┬──────┘
           │
      Includes:
           │
    ┌──────▼──────┐
    │   Manager   │  ← Limited user management (view, edit, reset)
    │             │
    └──────┬──────┘
           │
      Includes:
           │
    ┌──────▼──────┐
    │    User     │  ← View-only permissions
    │             │
    └──────┬──────┘
           │
      Includes:
           │
    ┌──────▼──────┐
    │    Guest    │  ← No permissions
    │             │
    └─────────────┘
```

---

## Role Permission Matrix

### Super-Admin Role
**Scope**: System-wide (all tenants)  
**Tenant Isolation**: None - can manage all tenants

| Permission | Allowed | Scope |
|-----------|---------|-------|
| `user:list` | ✅ Yes | All tenants |
| `user:view` | ✅ Yes | All tenants |
| `user:create` | ✅ Yes | All tenants |
| `user:edit` | ✅ Yes | All tenants |
| `user:delete` | ✅ Yes | All tenants |
| `user:reset_password` | ✅ Yes | All tenants |
| `user:crm:role:record:update` | ✅ Yes | All tenants |
| `role:manage` | ✅ Yes | System |
| `role:view` | ✅ Yes | System |
| `role:assign` | ✅ Yes | All tenants |
| `permission:manage` | ✅ Yes | System |
| `permission:view` | ✅ Yes | System |
| `tenant:users` | ✅ Yes | All |
| `tenant:view` | ✅ Yes | All |

**Usage Example**:
```typescript
// Super-admin can delete any admin user
canPerformUserAction('super-admin', 'tenant-1', 'admin', 'tenant-2', 'delete') // → true
```

---

### Admin Role
**Scope**: Tenant-scoped (can only manage own tenant)  
**Tenant Isolation**: Strict - cannot access other tenants

| Permission | Allowed | Scope | Restrictions |
|-----------|---------|-------|--------------|
| `user:list` | ✅ Yes | Own tenant only | |
| `user:view` | ✅ Yes | Own tenant only | |
| `user:create` | ✅ Yes | Own tenant only | |
| `user:edit` | ✅ Yes | Own tenant only | Cannot edit super-admins |
| `user:delete` | ✅ Yes | Own tenant only | Cannot delete other admins or super-admins |
| `user:reset_password` | ✅ Yes | Own tenant only | |
| `user:crm:role:record:update` | ✅ Yes | Own tenant only | |
| `role:manage` | ❌ No | N/A | |
| `role:view` | ✅ Yes | Own tenant only | |
| `role:assign` | ✅ Yes | Own tenant only | |
| `permission:manage` | ❌ No | N/A | |
| `permission:view` | ✅ Yes | Own tenant only | |
| `tenant:users` | ❌ No | N/A | |
| `tenant:view` | ✅ Yes | Own tenant only | |

**Usage Example**:
```typescript
// Admin in tenant-1 can create users in tenant-1
canPerformUserAction('admin', 'tenant-1', 'user', 'tenant-1', 'create') // → true

// Admin in tenant-1 cannot create users in tenant-2
canPerformUserAction('admin', 'tenant-1', 'user', 'tenant-2', 'create') // → false

// Admin cannot delete another admin
canPerformUserAction('admin', 'tenant-1', 'admin', 'tenant-1', 'delete') // → false
```

---

### Manager Role
**Scope**: Tenant-scoped (limited user management)  
**Tenant Isolation**: Strict - cannot access other tenants

| Permission | Allowed | Scope | Restrictions |
|-----------|---------|-------|--------------|
| `user:list` | ✅ Yes | Own tenant only | |
| `user:view` | ✅ Yes | Own tenant only | |
| `user:create` | ❌ No | N/A | Cannot create users |
| `user:edit` | ✅ Yes | Own tenant only | Can only edit regular users |
| `user:delete` | ❌ No | N/A | Cannot delete users |
| `user:reset_password` | ✅ Yes | Own tenant only | Only for regular users |
| `user:crm:role:record:update` | ❌ No | N/A | Cannot manage roles |
| `role:manage` | ❌ No | N/A | |
| `role:view` | ✅ Yes | Own tenant only | |
| `role:assign` | ❌ No | N/A | |
| `permission:manage` | ❌ No | N/A | |
| `permission:view` | ✅ Yes | Own tenant only | |
| `tenant:users` | ❌ No | N/A | |
| `tenant:view` | ✅ Yes | Own tenant only | |

**Usage Example**:
```typescript
// Manager can edit users in own tenant
canPerformUserAction('manager', 'tenant-1', 'user', 'tenant-1', 'edit') // → true

// Manager cannot delete users
canPerformUserAction('manager', 'tenant-1', 'user', 'tenant-1', 'delete') // → false

// Manager cannot create users
canPerformUserAction('manager', 'tenant-1', 'user', 'tenant-1', 'create') // → false
```

---

### User Role
**Scope**: Self-only (can only view own profile)  
**Tenant Isolation**: Strict - cannot access other users

| Permission | Allowed | Scope | Restrictions |
|-----------|---------|-------|--------------|
| `user:list` | ✅ Yes | Self only | Can see own profile |
| `user:view` | ✅ Yes | Self only | Can view own details |
| `user:create` | ❌ No | N/A | |
| `user:edit` | ❌ No | N/A | Cannot edit others |
| `user:delete` | ❌ No | N/A | |
| `user:reset_password` | ❌ No | N/A | |
| `user:crm:role:record:update` | ❌ No | N/A | |
| `role:manage` | ❌ No | N/A | |
| `role:view` | ✅ Yes | Own roles only | |
| `role:assign` | ❌ No | N/A | |
| `permission:manage` | ❌ No | N/A | |
| `permission:view` | ✅ Yes | Own permissions only | |
| `tenant:users` | ❌ No | N/A | |
| `tenant:view` | ✅ Yes | Own tenant only | |

**Usage Example**:
```typescript
// User can view own profile
canPerformUserAction('user', 'tenant-1', 'user', 'tenant-1', 'view', userId) // → true (if userId matches current user)

// User cannot create users
canPerformUserAction('user', 'tenant-1', 'user', 'tenant-1', 'create') // → false
```

---

### Guest Role
**Scope**: No access  
**Tenant Isolation**: Complete - no access to any user management

| Permission | Allowed |
|-----------|---------|
| All | ❌ No |

**Usage Example**:
```typescript
// Guest cannot access any user management features
hasPermission('guest', UserPermission.USER_LIST) // → false
hasPermission('guest', UserPermission.USER_VIEW) // → false
```

---

## Permission Usage in Code

### Checking Single Permission

```typescript
import { hasPermission } from '@/modules/features/user-management/guards/permissionGuards';

// Check if user has permission
if (hasPermission(userRole, UserPermission.USER_CREATE)) {
  // Show create button
}
```

### Checking Action Permission

```typescript
import { canPerformUserAction } from '@/modules/features/user-management/guards/permissionGuards';

// Check if can perform action on target user
const canEdit = canPerformUserAction(
  currentUserRole,      // 'admin'
  currentTenantId,      // 'tenant-1'
  targetUserRole,       // 'user'
  targetTenantId,       // 'tenant-1'
  'edit'                // action
);

if (canEdit) {
  // Show edit button
}
```

### Using React Hooks

```typescript
import { usePermissions } from '@/modules/features/user-management/hooks/usePermissions';

export const UsersPage = () => {
  const { canCreate, canEdit, canDelete } = usePermissions();

  return (
    <div>
      {canCreate && <Button>Create User</Button>}
      {canEdit && <Button>Edit User</Button>}
      {canDelete && <Button>Delete User</Button>}
    </div>
  );
};
```

### Using Permission Guards Component

```typescript
import { PermissionGuard } from '@/modules/features/user-management/components/PermissionGuard';
import { UserPermission } from '@/modules/features/user-management/guards/permissionGuards';

export const UserActions = () => {
  return (
    <>
      <PermissionGuard permission={UserPermission.USER_CREATE}>
        <Button>Create User</Button>
      </PermissionGuard>

      <PermissionGuard
        permissions={[UserPermission.USER_EDIT, UserPermission.USER_DELETE]}
        requireAll={false}
      >
        <Button>Edit or Delete</Button>
      </PermissionGuard>
    </>
  );
};
```

---

## Permission Enforcement Rules

### Cross-Tenant Access Rules

1. **Super-Admin Exception**: Can access all tenants
2. **Admin/Manager Rule**: Strictly tenant-scoped, cannot access other tenants
3. **User Rule**: Can only access own profile
4. **Guest Rule**: No access to any user management

### Role-Based Restrictions

1. **Admin Protection**: Only super-admin can delete other admins
2. **Self-Permission**: Users can always view their own profile
3. **Tenant Boundary**: Admins/Managers cannot cross tenant boundaries
4. **Role Escalation Prevention**: Lower roles cannot create higher roles

### Action-Specific Rules

| Action | Can Perform | Restrictions |
|--------|-------------|--------------|
| `create` | Admin, Super-Admin | Can only create in own tenant (except Super-Admin) |
| `edit` | Admin, Manager, Super-Admin | Admin/Manager own tenant only; Manager cannot edit Admins |
| `delete` | Admin, Super-Admin | Admin cannot delete other Admins; Super-Admin can delete anyone |
| `reset_password` | Admin, Manager, Super-Admin | Admin/Manager own tenant only |
| `view` | All roles (own scope) | Users see own only; Admins see tenant; Super-Admin sees all |

---

## Testing Permission Enforcement

### Test Scenarios

```typescript
// Test 1: Admin can manage users in own tenant
expect(
  canPerformUserAction('admin', 'tenant-1', 'user', 'tenant-1', 'edit')
).toBe(true);

// Test 2: Admin cannot manage users in other tenants
expect(
  canPerformUserAction('admin', 'tenant-1', 'user', 'tenant-2', 'edit')
).toBe(false);

// Test 3: Super-Admin can manage across tenants
expect(
  canPerformUserAction('super-admin', 'tenant-1', 'user', 'tenant-2', 'delete')
).toBe(true);

// Test 4: Admin cannot delete other admins
expect(
  canPerformUserAction('admin', 'tenant-1', 'admin', 'tenant-1', 'delete')
).toBe(false);

// Test 5: Manager cannot create users
expect(
  canPerformUserAction('manager', 'tenant-1', 'user', 'tenant-1', 'create')
).toBe(false);

// Test 6: User can only view own profile
expect(
  hasPermission('user', UserPermission.USER_VIEW)
).toBe(true);

expect(
  hasPermission('user', UserPermission.USER_CREATE)
).toBe(false);
```

---

## Implementation Checklist

- [x] Define permission codes and categories
- [x] Document role hierarchy
- [x] Create permission matrix for each role
- [x] Specify tenant isolation rules
- [x] Define cross-tenant access rules
- [x] Document permission enforcement
- [x] Provide code usage examples
- [x] Include test scenarios
- [x] TypeScript enum implementation
- [x] React hooks implementation
- [x] Component guards implementation

---

## Related Files

| File | Purpose |
|------|---------|
| `guards/permissionGuards.ts` | Core permission system |
| `hooks/usePermissions.ts` | React hooks for permission checks |
| `components/PermissionGuard.tsx` | React components for conditional rendering |
| `guards/__tests__/permissionGuards.test.ts` | Permission system tests |
| `services/__tests__/userRbac.test.ts` | RBAC integration tests |

---

## Maintenance Notes

### Adding New Permissions

1. Add permission code to `UserPermission` enum in `guards/permissionGuards.ts`
2. Update `ROLE_PERMISSIONS` map with permission assignments
3. Update this document with new permission details
4. Add test cases for new permission
5. Update affected components and hooks

### Changing Role Hierarchy

1. Modify `ROLE_PERMISSIONS` in `guards/permissionGuards.ts`
2. Update role permission matrix section in this document
3. Review and update affected components
4. Run full test suite to verify no regressions
5. Update changelog and notify team

### Auditing Permissions

- Use `getPermissionGuard()` to audit all permissions for a role
- Use `getRolePermissions()` to list all permissions for specific role
- Check `ROLE_PERMISSIONS` object for current permission matrix
- Review test coverage with `npm run test -- permissionGuards`
# User Management & RBAC - Factory Pattern Migration Guide

## Quick Reference for Developers

### The Problem
User Management and RBAC services were importing directly from mock services, bypassing the factory pattern. This causes **"Unauthorized" errors** when using Supabase mode because:

```typescript
// ❌ WRONG - Bypasses factory, won't work in Supabase mode
import { userService } from '@/services/userService';
import { rbacService } from '@/services/rbacService';

// When VITE_API_MODE=supabase, these still call mock implementations
// Mock implementations call authService.getCurrentUser() which may fail in Supabase context
const users = await userService.getUsers();
```

### The Solution
Always import from the service factory, which automatically routes to the correct backend:

```typescript
// ✅ CORRECT - Uses factory pattern, works in all modes
import { userService, rbacService } from '@/services/serviceFactory';

// Automatically routes to mock or Supabase based on VITE_API_MODE
const users = await userService.getUsers();
```

## Find & Replace Patterns

### User Service Migration

**Old Pattern** (find):
```typescript
import { userService } from '@/services/userService';
```

**New Pattern** (replace with):
```typescript
import { userService as factoryUserService } from '@/services/serviceFactory';
```

**Usage Update**:
```typescript
// Old
const users = await userService.getUsers();

// New
const users = await factoryUserService.getUsers();
```

### RBAC Service Migration

**Old Pattern** (find):
```typescript
import { rbacService } from '@/services/rbacService';
```

**New Pattern** (replace with):
```typescript
import { rbacService as factoryRbacService } from '@/services/serviceFactory';
```

**Usage Update**:
```typescript
// Old
const roles = await rbacService.getRoles();

// New
const roles = await factoryRbacService.getRoles();
```

## Component Examples

### UserManagementPage.tsx - BEFORE
```typescript
import { userService } from '@/services/userService';

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        // ❌ This might fail in Supabase mode
        const data = await userService.getUsers();
        setUsers(data);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    loadUsers();
  }, []);

  return <div>...</div>;
}
```

### UserManagementPage.tsx - AFTER
```typescript
import { userService as factoryUserService } from '@/services/serviceFactory';

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        // ✅ This works in all modes (mock and supabase)
        const data = await factoryUserService.getUsers();
        setUsers(data);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    loadUsers();
  }, []);

  return <div>...</div>;
}
```

### RoleManagementPage.tsx - BEFORE
```typescript
import { rbacService } from '@/services/rbacService';

export function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const loadRoles = async () => {
      // ❌ Bypasses factory pattern
      const data = await rbacService.getRoles();
      setRoles(data);
    };
    loadRoles();
  }, []);

  return <div>...</div>;
}
```

### RoleManagementPage.tsx - AFTER
```typescript
import { rbacService as factoryRbacService } from '@/services/serviceFactory';

export function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const loadRoles = async () => {
      // ✅ Uses factory pattern
      const data = await factoryRbacService.getRoles();
      setRoles(data);
    };
    loadRoles();
  }, []);

  return <div>...</div>;
}
```

## Common Method Mappings

### User Service

| Method | Old Import | New Import | Notes |
|--------|-----------|-----------|-------|
| `getUsers()` | `userService` | `factoryUserService` | Get all users with filters |
| `getUser(id)` | `userService` | `factoryUserService` | Get single user |
| `createUser()` | `userService` | `factoryUserService` | Create new user |
| `updateUser()` | `userService` | `factoryUserService` | Update user details |
| `deleteUser()` | `userService` | `factoryUserService` | Delete user |
| `resetPassword()` | `userService` | `factoryUserService` | Reset user password |
| `getRoles()` | `userService` | `factoryUserService` | Get available roles |
| `getPermissions()` | `userService` | `factoryUserService` | Get permissions list |

### RBAC Service

| Method | Old Import | New Import | Notes |
|--------|-----------|-----------|-------|
| `getPermissions()` | `rbacService` | `factoryRbacService` | Get all permissions |
| `getRoles()` | `rbacService` | `factoryRbacService` | Get all roles |
| `createRole()` | `rbacService` | `factoryRbacService` | Create new role |
| `updateRole()` | `rbacService` | `factoryRbacService` | Update role |
| `deleteRole()` | `rbacService` | `factoryRbacService` | Delete role |
| `getPermissionMatrix()` | `rbacService` | `factoryRbacService` | Get role-permission matrix |
| `getRoleTemplates()` | `rbacService` | `factoryRbacService` | Get predefined templates |
| `assignUserRole()` | `rbacService` | `factoryRbacService` | Assign role to user |
| `removeUserRole()` | `rbacService` | `factoryRbacService` | Remove role from user |

## Files to Update

### User Management Module
- [ ] `src/modules/features/user-management/views/UserManagementPage.tsx`
- [ ] `src/modules/features/user-management/views/RoleManagementPage.tsx`
- [ ] `src/modules/features/user-management/views/PermissionMatrixPage.tsx`
- [ ] `src/modules/features/user-management/views/UsersPage.tsx`
- [ ] Any hooks in `src/modules/features/user-management/hooks/`
- [ ] Any services in `src/modules/features/user-management/services/`

### Check for These Files
```bash
# Find all files importing old userService
grep -r "from '@/services/userService'" src/

# Find all files importing old rbacService
grep -r "from '@/services/rbacService'" src/
```

## Verification Steps

After updating imports:

1. **Check TypeScript compilation**:
   ```bash
   npm run build
   ```

2. **Test in Mock Mode** (should work):
   ```bash
   VITE_API_MODE=mock npm run dev
   ```

3. **Test in Supabase Mode** (should also work):
   ```bash
   VITE_API_MODE=supabase npm run dev
   ```

4. **Verify No "Unauthorized" Errors**:
   - Check browser console
   - Verify user list loads
   - Verify role management works
   - Verify no auth-related errors

## Alternative Pattern (Also Valid)

If you prefer, you can use the generic `getService()` method:

```typescript
import { serviceFactory } from '@/services/serviceFactory';

// Get user service
const userServiceImpl = serviceFactory.getService('user');
const users = await userServiceImpl.getUsers();

// Get RBAC service
const rbacServiceImpl = serviceFactory.getService('rbac');
const roles = await rbacServiceImpl.getRoles();
```

But the **convenience exports** pattern is recommended:

```typescript
import { userService, rbacService } from '@/services/serviceFactory';

const users = await userService.getUsers();
const roles = await rbacService.getRoles();
```

## Common Issues & Solutions

### Issue: "Unauthorized" Error
**Cause**: Still using direct import from mock service in Supabase mode
**Solution**: Change import to use factory pattern
```typescript
// ❌ Wrong
import { userService } from '@/services/userService';

// ✅ Right
import { userService } from '@/services/serviceFactory';
```

### Issue: Service not found error
**Cause**: Typo in import or wrong file path
**Solution**: Check the import path
```typescript
// Make sure it's exactly this:
import { userService, rbacService } from '@/services/serviceFactory';

// NOT this:
import { userService } from '@/services/serviceFactory'; // Missing rbacService
```

### Issue: TypeScript errors after migration
**Cause**: Type definitions might differ between mock and Supabase
**Solution**: Check the exact return types in serviceFactory.ts exports

## Rollback Plan

If issues arise, you can temporarily revert:

```typescript
// Temporary - only for debugging
import { userService as backupUserService } from '@/services/userService';

// Use backup if factory fails
const users = await (factoryUserService || backupUserService).getUsers();
```

But this should only be temporary - always complete the migration properly.

## Support

If you encounter issues:

1. Check `.zencoder/rules/repo.md` for architecture details
2. Check `USER_MANAGEMENT_FACTORY_PATTERN_IMPLEMENTATION.md` for complete documentation
3. Verify environment variable: `VITE_API_MODE` should be `mock` or `supabase`
4. Check browser console for specific error messages
5. Enable debug logging in serviceFactory.ts to see which implementation is being used

## Summary

**Rule**: Always import user and RBAC services from the factory, never directly.

```typescript
// ✅ DO THIS
import { userService, rbacService } from '@/services/serviceFactory';

// ❌ DON'T DO THIS
import { userService } from '@/services/userService';
import { rbacService } from '@/services/rbacService';
```

This ensures your code works in ALL modes: mock, supabase, and future real API.
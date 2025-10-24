# UserService Column Naming Fix

## Problem
After fixing the "Unauthorized" error, the UsersPage encountered a new error:
```
Error: Failed to fetch users: column users.createdAt does not exist
```

## Root Cause
There's a naming convention mismatch between:
- **TypeScript User Type**: Uses camelCase (`createdAt`, `firstName`, `lastName`, `tenantId`, etc.)
- **Supabase Database**: Uses snake_case (`created_at`, `first_name`, `last_name`, `tenant_id`, etc.)

When the Supabase service tried to query using `.order('createdAt', ...)`, it failed because the column is actually `created_at`.

## Database Column Mapping

| TypeScript | Database | Field Type |
|-----------|----------|-----------|
| `createdAt` | `created_at` | Timestamp |
| `updatedAt` | `updated_at` | Timestamp |
| `lastLogin` | `last_login` | Timestamp |
| `firstName` | `first_name` | String |
| `lastName` | `last_name` | String |
| `tenantId` | `tenant_id` | UUID (FK) |
| `avatar` | `avatar_url` | String |
| `company_name` | `company_name` | String |

## Solution Implemented

### 1. Added Transformation Methods
Two helper methods were added to `SupabaseUserService`:

```typescript
// Convert database snake_case to TypeScript camelCase
private toTypeScript(dbUser: any): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.first_name,
    lastName: dbUser.last_name,
    tenantId: dbUser.tenant_id,
    avatar: dbUser.avatar_url,
    createdAt: dbUser.created_at,
    lastLogin: dbUser.last_login,
    // ... other fields
  };
}

// Convert TypeScript camelCase to database snake_case
private toDatabase(user: Partial<User>): any {
  const dbUser: any = {};
  if (user.firstName !== undefined) dbUser.first_name = user.firstName;
  if (user.lastName !== undefined) dbUser.last_name = user.lastName;
  // ... etc
}
```

### 2. Updated Query Methods
All database queries now use snake_case column names:

**Before:**
```typescript
.order('createdAt', { ascending: false })
.eq('tenantId', filters.tenantId)
```

**After:**
```typescript
.order('created_at', { ascending: false })
.eq('tenant_id', filters.tenantId)
```

### 3. Applied Transformations
All returned data is transformed back to TypeScript format:

```typescript
// Single user
return this.toTypeScript(data);

// Multiple users
return (data || []).map(dbUser => this.toTypeScript(dbUser));
```

### 4. Fixed Import
Changed mock service import from:
```typescript
import { User } from '@/types/crm'; // ❌ Wrong
```

To:
```typescript
import { User } from '@/types/auth'; // ✅ Correct
```

## Files Modified
- `src/services/api/supabase/userService.ts` - Added transformations and fixed column names
- `src/services/userService.ts` - Fixed User type import

## Testing Checklist
- [ ] Users page loads without errors
- [ ] Users list displays correctly
- [ ] User filtering works (by role, status, tenant)
- [ ] Creating a new user works
- [ ] Updating user information works
- [ ] Deleting users works
- [ ] Search functionality works

## Best Practices for Future Development

1. **Database Conventions**: Supabase/PostgreSQL use snake_case for column names
2. **TypeScript Conventions**: TypeScript/JavaScript use camelCase for properties
3. **Always Transform**: When working with Supabase, implement transformation methods for consistency
4. **Type Safety**: Use strict type checking to catch mismatches early
5. **Documentation**: Document the mapping between database and TypeScript field names

## Related Issues Fixed
- ✅ "column users.createdAt does not exist" error
- ✅ User type import mismatch
- ✅ Column naming convention inconsistency
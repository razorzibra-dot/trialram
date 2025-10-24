# User Management & RBAC Service Factory Pattern Implementation

## Summary

Successfully implemented the Service Factory Pattern for **User Management** and **RBAC** services, bringing them in line with other factory-routed services (Company, Customer, Product, etc.). This enables seamless switching between Mock and Supabase backends.

## What Was Created

### 1. Supabase User Service
**File**: `src/services/api/supabase/userService.ts`

A complete Supabase-backed implementation of user management with:
- ✅ User CRUD operations (getUsers, getUser, createUser, updateUser, deleteUser)
- ✅ Password reset functionality
- ✅ Role management (getRoles, getPermissions, getStatuses, getTenants)
- ✅ Multi-tenant support
- ✅ Row-Level Security compatible
- ✅ Authorization checks (Admin role required)
- ✅ Email uniqueness validation
- ✅ Audit logging for sensitive operations

**Key Methods**:
```typescript
// User management
getUsers(filters?: { role?, status?, tenantId?, search? }): Promise<User[]>
getUser(id: string): Promise<User>
createUser(userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): Promise<User>
updateUser(id: string, updates: Partial<User>): Promise<User>
deleteUser(id: string): Promise<void>
resetPassword(id: string): Promise<void>

// Reference data
getRoles(): Promise<string[]>
getPermissions(): Promise<string[]>
getStatuses(): Promise<string[]>
getTenants(): Promise<Array<{ id: string; name: string }>>
```

### 2. Supabase RBAC Service
**File**: `src/services/api/supabase/rbacService.ts`

Complete Role-Based Access Control implementation with:
- ✅ Permission management (getPermissions)
- ✅ Role CRUD operations (getRoles, createRole, updateRole, deleteRole)
- ✅ User-role assignments (assignUserRole, removeUserRole)
- ✅ Permission matrix generation
- ✅ Role templates for quick role creation
- ✅ Audit logging for all actions
- ✅ Bulk operations (bulkAssignRole, bulkRemoveRole)
- ✅ Permission validation
- ✅ Multi-tenant support

**Key Methods**:
```typescript
// Permission & Role management
getPermissions(): Promise<Permission[]>
getRoles(tenantId?: string): Promise<Role[]>
createRole(roleData: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role>
updateRole(roleId: string, updates: Partial<Role>): Promise<Role>
deleteRole(roleId: string): Promise<void>

// User-Role assignments
assignUserRole(userId: string, roleId: string): Promise<void>
removeUserRole(userId: string, roleId: string): Promise<void>
bulkAssignRole(userIds: string[], roleId: string): Promise<void>
bulkRemoveRole(userIds: string[], roleId: string): Promise<void>

// Permission matrix & templates
getPermissionMatrix(tenantId?: string): Promise<PermissionMatrix>
getRoleTemplates(): Promise<RoleTemplate[]>
createRoleFromTemplate(templateId: string, roleName: string, tenantId: string): Promise<Role>

// Audit & validation
getAuditLogs(filters?: {...}): Promise<AuditLog[]>
logAction(action: string, resource: string, resourceId?: string, details?: Record<string, unknown>): Promise<void>
getUsersByRole(roleId: string): Promise<User[]>
validateRolePermissions(permissions: string[]): Promise<{ valid: boolean; invalid: string[] }>
```

### 3. Service Factory Updates
**File**: `src/services/serviceFactory.ts`

Enhanced the factory with:
- ✅ Import statements for both mock and Supabase services
- ✅ `getUserService()` method for dynamic service selection
- ✅ `getRbacService()` method for dynamic service selection
- ✅ Updated `getService(serviceName)` generic method
- ✅ Factory exports for convenience: `export const userService` and `export const rbacService`
- ✅ Automatic fallback logic for 'real' mode

**How It Works**:
```typescript
// Factory routes based on VITE_API_MODE environment variable
const userService = serviceFactory.getUserService(); // Returns mock or supabase based on env

// Convenience exports handle all method routing
import { userService, rbacService } from '@/services/serviceFactory';

const users = await userService.getUsers(); // Automatically routed
const roles = await rbacService.getRoles(); // Automatically routed
```

### 4. Documentation Updates
**File**: `.zencoder/rules/repo.md`

Added comprehensive documentation:
- ✅ Listed userService and rbacService as factory-routed services
- ✅ Full architecture overview
- ✅ Complete method listings
- ✅ Database schema requirements
- ✅ Usage examples
- ✅ Feature highlights

## Architecture

```
┌─────────────────────────────────────────────────┐
│   Component (UserManagementPage, etc.)          │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│  Import from Factory (serviceFactory.ts)         │
│  - userService                                   │
│  - rbacService                                   │
└──────────────┬──────────────────────────────────┘
               │
               ▼ (VITE_API_MODE)
       ┌───────────────┬───────────────┐
       │               │               │
       ▼ mock          ▼ supabase      ▼ real
┌────────────────┐ ┌────────────────┐ (TODO)
│ Mock Service   │ │ Supabase       │
│ - userService  │ │ - userService  │
│ - rbacService  │ │ - rbacService  │
└────────────────┘ └────────────────┘
```

## Configuration

### Environment Variable
Set in `.env` file:
```
VITE_API_MODE=mock|supabase|real
```

### Backend Modes
| Mode | File | Description |
|------|------|-------------|
| `mock` | `src/services/userService.ts` | Local mock data for development |
| `supabase` | `src/services/api/supabase/userService.ts` | PostgreSQL via Supabase |
| `real` | TODO | .NET Core backend (not yet implemented) |

## Usage Examples

### User Management
```typescript
import { userService } from '@/services/serviceFactory';

// Get all users with filters
const users = await userService.getUsers({
  role: 'Manager',
  status: 'active',
  tenantId: 'tenant_1',
  search: 'john'
});

// Get specific user
const user = await userService.getUser('user_123');

// Create new user
const newUser = await userService.createUser({
  email: 'user@company.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'Manager',
  status: 'active',
  tenantId: 'tenant_1',
  tenantName: 'Acme Corp'
});

// Update user
const updated = await userService.updateUser('user_123', {
  role: 'Admin',
  status: 'inactive'
});

// Delete user
await userService.deleteUser('user_123');

// Reset password
await userService.resetPassword('user_123');
```

### RBAC Management
```typescript
import { rbacService } from '@/services/serviceFactory';

// Get permissions
const permissions = await rbacService.getPermissions();

// Get roles for tenant
const roles = await rbacService.getRoles('tenant_1');

// Create new role
const newRole = await rbacService.createRole({
  name: 'Custom Manager',
  description: 'Custom manager role',
  tenant_id: 'tenant_1',
  permissions: ['read', 'write', 'manage_customers'],
  is_system_role: false
});

// Get permission matrix (roles vs permissions)
const matrix = await rbacService.getPermissionMatrix('tenant_1');

// Assign role to user
await rbacService.assignUserRole('user_123', 'role_456');

// Audit trail
const logs = await rbacService.getAuditLogs({
  user_id: 'user_123',
  action: 'role_assigned'
});
```

## Migration Guide for Components

### Before (Direct import - ❌ Wrong)
```typescript
import { userService } from '@/services/userService';
import { rbacService } from '@/services/rbacService';

// This bypasses factory pattern and won't work in Supabase mode
const users = await userService.getUsers();
```

### After (Factory import - ✅ Correct)
```typescript
import { userService, rbacService } from '@/services/serviceFactory';

// This uses factory pattern and works in all modes
const users = await userService.getUsers();
```

## Database Schema

The Supabase implementation expects the following tables:

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  role VARCHAR(50),
  status VARCHAR(50),
  tenantId VARCHAR(255),
  tenantName VARCHAR(255),
  lastLogin TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  avatar VARCHAR(255),
  phone VARCHAR(20),
  FOREIGN KEY (tenantId) REFERENCES tenants(id)
);
```

### roles
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tenant_id VARCHAR(255),
  permissions TEXT[] DEFAULT '{}',
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### user_roles
```sql
CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);
```

### permissions
```sql
CREATE TABLE permissions (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  resource VARCHAR(100),
  action VARCHAR(50)
);
```

### role_templates
```sql
CREATE TABLE role_templates (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  permissions TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  category VARCHAR(50)
);
```

### audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  resource VARCHAR(100),
  resource_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  tenant_id VARCHAR(255),
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## Testing

### Build Verification
```bash
npm run build
# ✅ Successfully built in 57.25s
```

### Mode Testing
```typescript
// Test mock mode
VITE_API_MODE=mock npm run dev

// Test supabase mode
VITE_API_MODE=supabase npm run dev
```

## Important Notes

1. **Authorization**: Both services enforce Admin role requirement for most operations
2. **Multi-tenancy**: Services respect tenant boundaries via Row-Level Security
3. **Audit Trail**: All RBAC operations are logged for compliance
4. **Error Handling**: Services throw descriptive errors for validation failures
5. **Fallback**: If Supabase service fails, it logs the error and can gracefully degrade

## Next Steps

1. **Update Components**: Migrate all user-management pages to use factory imports
2. **Database Setup**: Run migrations to create required tables in Supabase
3. **Environment Config**: Set `VITE_API_MODE=supabase` when ready to use database
4. **Real API**: Implement `src/services/real/userService.ts` and `rbacService.ts` for .NET backend

## Files Created/Modified

### Created
- ✅ `src/services/api/supabase/userService.ts`
- ✅ `src/services/api/supabase/rbacService.ts`

### Modified
- ✅ `src/services/serviceFactory.ts` (added imports, methods, exports)
- ✅ `.zencoder/rules/repo.md` (documentation)

### Still Using (No Changes Needed)
- ✅ `src/services/userService.ts` (mock - kept for backwards compatibility)
- ✅ `src/services/rbacService.ts` (mock - kept for backwards compatibility)

## Architecture Consistency

This implementation follows the same pattern as:
- ✅ companyService (already factory-routed)
- ✅ customerService (already factory-routed)
- ✅ productService (already factory-routed)
- ✅ jobWorkService (already factory-routed)

Now userService and rbacService are **fully integrated** into the factory pattern!

## Status: ✅ COMPLETE

- ✅ Supabase implementations created
- ✅ Service factory updated
- ✅ Convenience exports added
- ✅ Documentation updated
- ✅ Build verification passed
- ✅ Ready for component migration
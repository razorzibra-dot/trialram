---
title: User Management API Reference
description: Complete API documentation for user management service methods
version: 2.0.0
lastUpdated: 2025-02-08
category: api-reference
---

# User Management API Reference

Complete documentation of all service methods in the User Management module.

## Table of Contents

- [User Operations](#user-operations)
- [User Statistics](#user-statistics)
- [Metadata Operations](#metadata-operations)
- [Activity & Audit](#activity--audit)
- [Data Types](#data-types)
- [Error Handling](#error-handling)

---

## User Operations

### getUsers()

Fetch all users with optional filters.

```typescript
getUsers(filters?: UserFiltersDTO): Promise<UserDTO[]>
```

**Parameters**:
- `filters` (optional) - Filter criteria:
  - `status`: Filter by user status (active, inactive, suspended)
  - `role`: Filter by user role (super_admin, admin, manager, agent, engineer, customer)
  - `department`: Filter by department
  - `search`: Full-text search on name/email
  - `dateFrom`: Filter users created after date
  - `dateTo`: Filter users created before date
  - `tenantId`: Multi-tenant filter (filtered by current tenant in production)

**Returns**: `UserDTO[]` - Array of user objects

**Example**:
```typescript
import { userService } from '@/modules/features/user-management/services/userService';

// Get all users
const allUsers = await userService.getUsers();

// Get active managers
const managers = await userService.getUsers({
  status: 'active',
  role: 'manager'
});

// Search for users
const results = await userService.getUsers({
  search: 'john@example.com'
});

// Date range filter
const recentUsers = await userService.getUsers({
  dateFrom: new Date('2025-02-01'),
  dateTo: new Date('2025-02-08')
});
```

**Error Handling**:
```typescript
try {
  const users = await userService.getUsers();
} catch (error) {
  console.error('Failed to fetch users:', error.message);
}
```

---

### getUser()

Fetch a single user by ID.

```typescript
getUser(id: string): Promise<UserDTO>
```

**Parameters**:
- `id` (required, string) - Unique user identifier (UUID)

**Returns**: `UserDTO` - Single user object

**Throws**: `Error` if user not found or access denied

**Example**:
```typescript
try {
  const user = await userService.getUser('123e4567-e89b-12d3-a456-426614174000');
  console.log(`User: ${user.firstName} ${user.lastName}`);
} catch (error) {
  if (error.message.includes('not found')) {
    console.error('User does not exist');
  }
}
```

---

### createUser()

Create a new user.

```typescript
createUser(data: CreateUserDTO): Promise<UserDTO>
```

**Parameters**:
- `data` (required) - User creation data:
  - `email` (required) - Must be unique, valid email format
  - `firstName` (required) - User's first name
  - `lastName` (required) - User's last name
  - `role` (required) - User role (super_admin, admin, manager, agent, engineer, customer)
  - `status` (optional) - Initial status (active, inactive, suspended), defaults to 'active'
  - `tenantId` (optional) - Tenant ID for multi-tenant environments
  - `phone` (optional) - Phone number
  - `mobile` (optional) - Mobile number
  - `companyName` (optional) - Company name
  - `department` (optional) - Department name
  - `position` (optional) - Job position

**Returns**: `UserDTO` - Created user object with generated ID and timestamps

**Throws**: 
- Error if email already exists
- Error if validation fails

**Example**:
```typescript
const newUser = await userService.createUser({
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'manager',
  phone: '+1-555-0123',
  department: 'Sales',
  companyName: 'Acme Corp'
});

console.log(`Created user: ${newUser.id}`);
```

**Validation Rules**:
- Email: Must match pattern `^[^\s@]+@[^\s@]+\.[^\s@]+$` and be unique
- Role: Must be one of valid role enums
- Name fields: Min 1, Max 255 characters

---

### updateUser()

Update an existing user.

```typescript
updateUser(id: string, data: UpdateUserDTO): Promise<UserDTO>
```

**Parameters**:
- `id` (required, string) - User ID to update
- `data` (required) - Fields to update (all optional):
  - `email` - Updated email (must be unique if changed)
  - `firstName` - Updated first name
  - `lastName` - Updated last name
  - `role` - Updated role
  - `status` - Updated status
  - `phone` - Updated phone
  - `mobile` - Updated mobile
  - `department` - Updated department
  - `position` - Updated position

**Returns**: `UserDTO` - Updated user object

**Throws**: Error if validation fails or user not found

**Example**:
```typescript
const updated = await userService.updateUser('user-id', {
  role: 'admin',
  status: 'active',
  department: 'Administration'
});

console.log('User updated successfully');
```

---

### deleteUser()

Delete a user (soft delete in production).

```typescript
deleteUser(id: string): Promise<void>
```

**Parameters**:
- `id` (required, string) - User ID to delete

**Returns**: `void`

**Throws**: Error if user not found

**Example**:
```typescript
await userService.deleteUser('user-id');
console.log('User deleted');
```

**Note**: In production (Supabase mode), this performs a soft delete by setting `deleted_at` timestamp. In mock mode, the user is removed from the list.

---

### resetPassword()

Trigger password reset for a user.

```typescript
resetPassword(id: string): Promise<void>
```

**Parameters**:
- `id` (required, string) - User ID for password reset

**Returns**: `void`

**Throws**: Error if user not found

**Example**:
```typescript
await userService.resetPassword('user-id');
console.log('Password reset initiated');
```

**Note**: In production, this integrates with Supabase Auth to send a password reset email.

---

## User Statistics

### getUserStats()

Get aggregated user statistics.

```typescript
getUserStats(): Promise<UserStatsDTO>
```

**Returns**: `UserStatsDTO` containing:
- `totalUsers` (number) - Total active users
- `totalByRole` (object) - Count by role
- `totalByStatus` (object) - Count by status
- `newUsersThisMonth` (number) - Users created this month
- `newUsersThisWeek` (number) - Users created this week
- `activeToday` (number) - Users active today
- `suspendedCount` (number) - Suspended users count

**Example**:
```typescript
const stats = await userService.getUserStats();

console.log(`Total users: ${stats.totalUsers}`);
console.log(`Admins: ${stats.totalByRole.admin}`);
console.log(`Active today: ${stats.activeToday}`);
```

---

## Metadata Operations

### getRoles()

Get all available user roles.

```typescript
getRoles(): Promise<UserRole[]>
```

**Returns**: `UserRole[]` - Array of valid role values

**Example**:
```typescript
const roles = await userService.getRoles();
// Returns: ['super_admin', 'admin', 'manager', 'agent', 'engineer', 'customer']
```

---

### getStatuses()

Get all available user statuses.

```typescript
getStatuses(): Promise<UserStatus[]>
```

**Returns**: `UserStatus[]` - Array of valid status values

**Example**:
```typescript
const statuses = await userService.getStatuses();
// Returns: ['active', 'inactive', 'suspended']
```

---

### getTenants()

Get available tenants for user assignment (multi-tenant mode only).

```typescript
getTenants(): Promise<TenantDTO[]>
```

**Returns**: `TenantDTO[]` - Array of tenant objects

**Example**:
```typescript
const tenants = await userService.getTenants();
tenants.forEach(tenant => {
  console.log(`${tenant.id}: ${tenant.name}`);
});
```

---

## Activity & Audit

### getUserActivity()

Get activity log for a specific user.

```typescript
getUserActivity(userId: string): Promise<UserActivityDTO[]>
```

**Parameters**:
- `userId` (required, string) - User ID to get activity for

**Returns**: `UserActivityDTO[]` - Array of activity records

**Example**:
```typescript
const activities = await userService.getUserActivity('user-id');

activities.forEach(activity => {
  console.log(`${activity.action} on ${activity.timestamp}`);
});
```

---

### logActivity()

Log a user activity or audit event.

```typescript
logActivity(activity: Omit<UserActivityDTO, 'id'>): Promise<UserActivityDTO>
```

**Parameters**:
- `activity` (required) - Activity details:
  - `userId` - User performing the action
  - `action` - Type of action (login, logout, create, update, delete, etc.)
  - `resourceType` - Type of resource affected
  - `resourceId` - ID of resource affected
  - `changes` - Object describing what changed
  - `status` - Result status (success, failure)
  - `metadata` - Additional context

**Returns**: `UserActivityDTO` - Created activity record

**Example**:
```typescript
const activity = await userService.logActivity({
  userId: 'user-123',
  action: 'update',
  resourceType: 'user',
  resourceId: 'user-456',
  changes: { role: 'admin', status: 'active' },
  status: 'success',
  metadata: { ipAddress: '192.168.1.1' }
});

console.log(`Activity logged: ${activity.id}`);
```

---

## Data Types

### UserDTO

Complete user object representing a user in the system.

```typescript
interface UserDTO {
  id: string;                    // UUID
  email: string;                 // Unique email
  name: string;                  // Full name
  firstName: string;             // First name
  lastName: string;              // Last name
  role: UserRole;                // User role
  status: UserStatus;            // User status
  tenantId: string;              // Multi-tenant ID
  avatarUrl?: string;            // Avatar image URL
  phone?: string;                // Phone number
  mobile?: string;               // Mobile number
  companyName?: string;          // Company name
  department?: string;           // Department
  position?: string;             // Job position
  lastLogin?: Date;              // Last login timestamp
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
  deletedAt?: Date;              // Soft delete timestamp
  createdBy?: string;            // Creator user ID
}
```

### CreateUserDTO

Input data for creating a new user.

```typescript
interface CreateUserDTO {
  email: string;                 // Required
  firstName: string;             // Required
  lastName: string;              // Required
  role: UserRole;                // Required
  status?: UserStatus;           // Optional, defaults to 'active'
  tenantId?: string;             // Optional
  phone?: string;                // Optional
  mobile?: string;               // Optional
  companyName?: string;          // Optional
  department?: string;           // Optional
  position?: string;             // Optional
}
```

### UpdateUserDTO

Input data for updating an existing user (all fields optional).

```typescript
interface UpdateUserDTO {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  phone?: string;
  mobile?: string;
  department?: string;
  position?: string;
}
```

### UserStatsDTO

Aggregated user statistics.

```typescript
interface UserStatsDTO {
  totalUsers: number;
  totalByRole: Record<string, number>;
  totalByStatus: Record<string, number>;
  newUsersThisMonth: number;
  newUsersThisWeek: number;
  activeToday: number;
  suspendedCount: number;
}
```

### UserActivityDTO

User activity or audit log entry.

```typescript
interface UserActivityDTO {
  id: string;                    // UUID
  userId: string;                // User performing action
  action: string;                // Action type
  resourceType: string;          // Resource affected
  resourceId: string;            // Resource ID
  changes?: Record<string, any>; // Changes made
  status: 'success' | 'failure'; // Result status
  metadata?: Record<string, any>;// Additional context
  timestamp: Date;               // When action occurred
}
```

---

## Error Handling

### Common Errors

**Validation Errors**:
```typescript
Error: "Invalid email format"
Error: "Email already exists"
Error: "Invalid role: unknown_role"
Error: "Invalid status: unknown_status"
```

**Not Found Errors**:
```typescript
Error: "User not found"
Error: "Tenant not found"
```

**Access Errors**:
```typescript
Error: "Unauthorized access"
Error: "You do not have permission to perform this action"
```

### Error Handling Pattern

```typescript
import { userService } from '@/modules/features/user-management/services/userService';

async function safeUserOperation() {
  try {
    const user = await userService.getUser('user-id');
    return user;
  } catch (error) {
    if (error.message.includes('not found')) {
      console.error('User does not exist');
    } else if (error.message.includes('Unauthorized')) {
      console.error('Access denied');
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}
```

---

## Best Practices

1. **Always use factory-routed services**: Import from `serviceFactory`, never directly from mock/supabase services
2. **Handle errors appropriately**: Check error messages and provide user feedback
3. **Use hooks in components**: Prefer React Query hooks over direct service calls in UI
4. **Validate before submission**: Check validation rules before creating/updating users
5. **Cache invalidation**: Hooks handle this automatically via React Query
6. **Multi-tenant safety**: Always include `tenantId` filter in production environments
7. **Audit logging**: Log important user actions for compliance

---

## Related Documentation

- [Module Documentation](./DOC.md)
- [React Hooks Reference](./HOOKS.md)
- [Permissions Reference](./PERMISSIONS.md)
- [Layer Synchronization Rules](./.zencoder/rules/standardized-layer-development.md)

---

**Version**: 2.0.0  
**Status**: Complete  
**Last Updated**: 2025-02-08  
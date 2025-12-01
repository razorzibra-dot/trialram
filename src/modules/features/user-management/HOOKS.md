---
title: User Management Hooks Reference
description: Complete reference for all React Query hooks in the User Management module
version: 2.0.0
lastUpdated: 2025-02-08
category: hooks-reference
---

# User Management Hooks Reference

Complete documentation of all React Query hooks in the User Management module for data fetching, mutations, and state management.

## Table of Contents

- [Query Hooks (Data Fetching)](#query-hooks-data-fetching)
- [Mutation Hooks (State Changes)](#mutation-hooks-state-changes)
- [Permission Hooks](#permission-hooks)
- [Activity Hooks](#activity-hooks)
- [Query Keys](#query-keys)
- [Cache Management](#cache-management)
- [Best Practices](#best-practices)

---

## Query Hooks (Data Fetching)

Query hooks use React Query for caching and automatic state management.

### useUsers()

Fetch all users with optional filters.

```typescript
useUsers(filters?: UserFiltersDTO): {
  users: UserDTO[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<UserDTO[]>;
}
```

**Parameters**:
- `filters` (optional) - Filter by status, role, department, search, date range

**Returns**:
- `users` - Array of user objects
- `loading` - Loading state
- `error` - Error object or null
- `refetch` - Function to manually refetch

**Cache**: 5 minutes (staleTime)

**Example**:
```typescript
import { useUsers } from '@/modules/features/user-management/hooks';

function UsersList() {
  const { users, loading, error, refetch } = useUsers({
    status: 'active',
    role: 'manager'
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.firstName} {user.lastName}</div>
      ))}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

---

### useUser()

Fetch a single user by ID.

```typescript
useUser(id: string): {
  user?: UserDTO;
  loading: boolean;
  error: Error | null;
}
```

**Parameters**:
- `id` - User ID (only fetches if ID is provided)

**Returns**:
- `user` - Single user object (undefined while loading)
- `loading` - Loading state
- `error` - Error object or null

**Cache**: 10 minutes (staleTime)

**Example**:
```typescript
function UserDetail({ userId }) {
  const { user, loading, error } = useUser(userId);

  if (loading) return <div>Loading user...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div>
      <h1>{user.firstName} {user.lastName}</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </div>
  );
}
```

---

### useUserStats()

Fetch aggregated user statistics.

```typescript
useUserStats(): {
  stats?: UserStatsDTO;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<UserStatsDTO>;
}
```

**Returns**:
- `stats` - Statistics object with counts by role/status
- `loading` - Loading state
- `error` - Error object or null
- `refetch` - Manual refetch function

**Cache**: 10 minutes (staleTime)

**Example**:
```typescript
function StatsPanel() {
  const { stats, loading } = useUserStats();

  if (loading) return <div>Loading stats...</div>;
  if (!stats) return null;

  return (
    <div>
      <p>Total Users: {stats.totalUsers}</p>
      <p>Admins: {stats.totalByRole.admin}</p>
      <p>Active Today: {stats.activeToday}</p>
    </div>
  );
}
```

---

### useUserRoles()

Fetch all available user roles.

```typescript
useUserRoles(): {
  roles: UserRole[];
  loading: boolean;
}
```

**Returns**:
- `roles` - Array of role values
- `loading` - Loading state

**Cache**: 1 hour (staleTime)

**Example**:
```typescript
function RoleSelect() {
  const { roles, loading } = useUserRoles();

  return (
    <select disabled={loading}>
      <option>Select role...</option>
      {roles.map(role => (
        <option key={role} value={role}>{role}</option>
      ))}
    </select>
  );
}
```

---

### useUserStatuses()

Fetch all available user statuses.

```typescript
useUserStatuses(): {
  statuses: UserStatus[];
  loading: boolean;
}
```

**Returns**:
- `statuses` - Array of status values
- `loading` - Loading state

**Cache**: 1 hour (staleTime)

---

### useTenants()

Fetch all available tenants.

```typescript
useTenants(): {
  tenants: TenantDTO[];
  loading: boolean;
  error: Error | null;
}
```

**Returns**:
- `tenants` - Array of tenant objects
- `loading` - Loading state
- `error` - Error object or null

**Cache**: 1 hour (staleTime)

---

### useUserActivity()

Fetch activity log for a specific user.

```typescript
useUserActivity(userId: string): UserActivity[] {
  // Replaces field with "activities" in return
}
```

**Parameters**:
- `userId` - User ID to fetch activity for

**Returns**:
- `activities` - Array of activity records
- `loading` - Loading state
- `error` - Error object or null

**Cache**: 2 minutes (staleTime)

**Example**:
```typescript
function UserActivityLog({ userId }) {
  const { activities, loading } = useUserActivity(userId);

  return (
    <div>
      {activities.map(activity => (
        <div key={activity.id}>
          {activity.action} - {new Date(activity.timestamp).toLocaleString()}
        </div>
      ))}
    </div>
  );
}
```

---

## Mutation Hooks (State Changes)

Mutation hooks handle CREATE, UPDATE, DELETE operations.

### useCreateUser()

Create a new user.

```typescript
useCreateUser(): {
  mutate: (data: CreateUserDTO) => Promise<UserDTO>;
  isPending: boolean;
  error: Error | null;
}
```

**Returns**:
- `mutate` - Function to create user
- `isPending` - Loading state during mutation
- `error` - Error object or null

**Cache Invalidation**: 
- User list queries
- Statistics queries
- New user detail query

**Example**:
```typescript
function CreateUserForm() {
  const { mutate: createUser, isPending, error } = useCreateUser();

  const handleSubmit = async (data: CreateUserDTO) => {
    try {
      const newUser = await createUser(data);
      console.log('User created:', newUser.id);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit({ ...formData });
    }}>
      {/* form fields */}
      <button disabled={isPending}>{isPending ? 'Creating...' : 'Create'}</button>
      {error && <div className="error">{error.message}</div>}
    </form>
  );
}
```

---

### useUpdateUser()

Update an existing user.

```typescript
useUpdateUser(userId: string): {
  mutate: (data: UpdateUserDTO) => Promise<UserDTO>;
  isPending: boolean;
  error: Error | null;
}
```

**Parameters**:
- `userId` - ID of user to update

**Returns**:
- `mutate` - Function to update user
- `isPending` - Loading state
- `error` - Error object or null

**Cache Invalidation**:
- User detail query
- User list queries
- Statistics queries

**Example**:
```typescript
function EditUserForm({ userId }) {
  const { mutate: updateUser, isPending } = useUpdateUser(userId);

  const handleSubmit = async (updates: UpdateUserDTO) => {
    await updateUser(updates);
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(formData);
    }}>
      {/* form fields */}
      <button disabled={isPending}>
        {isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

---

### useDeleteUser()

Delete a user (soft delete in production).

```typescript
useDeleteUser(): {
  mutate: (userId: string) => Promise<void>;
  isPending: boolean;
  error: Error | null;
}
```

**Returns**:
- `mutate` - Function to delete user (pass user ID)
- `isPending` - Loading state
- `error` - Error object or null

**Cache Invalidation**:
- User detail query
- User list queries
- Statistics queries

**Example**:
```typescript
function DeleteUserButton({ userId }) {
  const { mutate: deleteUser, isPending } = useDeleteUser();

  const handleDelete = async () => {
    if (confirm('Are you sure?')) {
      await deleteUser(userId);
    }
  };

  return (
    <button onClick={handleDelete} disabled={isPending} className="danger">
      {isPending ? 'Deleting...' : 'Delete User'}
    </button>
  );
}
```

---

### useResetPassword()

Send password reset for a user.

```typescript
useResetPassword(): {
  mutate: (userId: string) => Promise<void>;
  isPending: boolean;
  error: Error | null;
}
```

**Returns**:
- `mutate` - Function to reset password (pass user ID)
- `isPending` - Loading state
- `error` - Error object or null

**Example**:
```typescript
function ResetPasswordButton({ userId }) {
  const { mutate: resetPassword, isPending } = useResetPassword();

  return (
    <button 
      onClick={() => resetPassword(userId)} 
      disabled={isPending}
    >
      {isPending ? 'Sending...' : 'Reset Password'}
    </button>
  );
}
```

---

## Permission Hooks

Permission hooks provide access control in components.

### usePermissions()

Get all permission checks for current user.

```typescript
usePermissions(): {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageRoles: boolean;
  canResetPassword: boolean;
  canViewList: boolean;
  canPerformAction: (targetRole, targetTenant, action) => boolean;
  hasPermission: (permission) => boolean;
  userRole: string;
  userTenantId: string;
}
```

**Returns**:
- `canCreate` - Can create new users
- `canEdit` - Can edit users
- `canDelete` - Can delete users
- `canManageRoles` - Can manage roles
- `canResetPassword` - Can reset passwords
- `canViewList` - Can view user list
- `canPerformAction` - Check action on specific target
- `hasPermission` - Check single permission
- `userRole` - Current user's role
- `userTenantId` - Current user's tenant

**Example**:
```typescript
function UserActions({ targetUser }) {
  const { canEdit, canDelete, canPerformAction } = usePermissions();

  const canEditThis = canPerformAction(targetUser.role, targetUser.tenantId, 'edit');
  const canDeleteThis = canPerformAction(targetUser.role, targetUser.tenantId, 'delete');

  return (
    <div>
      {canEditThis && <button>Edit</button>}
      {canDeleteThis && <button>Delete</button>}
    </div>
  );
}
```

---

### useHasPermission()

Check a single permission.

```typescript
useHasPermission(permission: UserPermission): boolean
```

**Parameters**:
- `permission` - Permission to check

**Returns**: `boolean` - True if user has permission

**Example**:
```typescript
function ManageRolesPanel() {
  const hasPermission = useHasPermission('crm:role:record:update');

  if (!hasPermission) {
    return <div>You don't have permission to manage roles</div>;
  }

  return <RolesForm />;
}
```

---

### useUserManagementPermissions()

Get user management specific permissions (backward compatibility).

```typescript
useUserManagementPermissions(): {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageRoles: boolean;
  canResetPassword: boolean;
  canViewList: boolean;
  canManageUsers: boolean;
  // ... more
}
```

---

### useRequirePermission()

Require a permission and assert it.

```typescript
useRequirePermission(permission: UserPermission): {
  required: UserPermission;
  hasPermission: boolean;
  assertPermission: () => void;
}
```

**Returns**:
- `required` - The required permission
- `hasPermission` - Whether user has it
- `assertPermission` - Throws if user lacks permission

**Example**:
```typescript
function AdminOnlyPanel() {
  const { assertPermission, hasPermission } = useRequirePermission('super_admin_access');

  useEffect(() => {
    try {
      assertPermission();
    } catch (error) {
      // Handle permission denied
    }
  }, [assertPermission]);

  if (!hasPermission) return <div>Access Denied</div>;

  return <AdminContent />;
}
```

---

## Activity Hooks

Activity tracking and audit logging hooks.

### useUserActivity()

Fetch user activity with filters.

```typescript
useUserActivity(filters?: ActivityFilters): {
  data: UserActivity[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

**Parameters**:
- `filters.userId` - Filter by user
- `filters.action` - Filter by action type
- `filters.resource` - Filter by resource type
- `filters.startDate` - Filter start date
- `filters.endDate` - Filter end date

**Cache**: 5 minutes (staleTime)

---

### useUserActivityLog()

Fetch activity for a specific user.

```typescript
useUserActivityLog(userId: string): {
  data: UserActivity[];
  loading: boolean;
  error: Error | null;
}
```

**Parameters**:
- `userId` - User ID to fetch activity for

**Cache**: 2 minutes (staleTime)

---

### useLogActivity()

Log a user activity event.

```typescript
useLogActivity(): {
  mutate: (activity: ActivityDTO) => Promise<UserActivity>;
  isPending: boolean;
  error: Error | null;
}
```

**Cache Invalidation**: All activity queries

---

### useActivityStats()

Get activity statistics.

```typescript
useActivityStats(): {
  data?: ActivityStats;
  loading: boolean;
  error: Error | null;
}
```

**Returns**:
- `totalActivities` - Total activity count
- `activeUsers` - Unique users with activities
- `failedAttempts` - Failed operation count
- `averageActivityPerDay` - Daily average

**Cache**: 30 minutes (staleTime)

---

### useBulkLogActivity()

Log multiple activities at once.

```typescript
useBulkLogActivity(): {
  mutate: (activities: ActivityDTO[]) => Promise<UserActivity[]>;
  isPending: boolean;
  error: Error | null;
}
```

**Cache Invalidation**: All activity queries

---

### useTrackActivity()

Convenience hook for tracking activity with error handling.

```typescript
useTrackActivity(): (
  action: string,
  resource: string,
  resourceId: string,
  options?: TrackOptions
) => Promise<void>
```

**Example**:
```typescript
function UserForm() {
  const trackActivity = useTrackActivity();

  const handleCreateUser = async (userData) => {
    await trackActivity('CREATE', 'USER', userData.id, {
      description: `Created new user ${userData.email}`,
      onSuccess: () => console.log('Activity tracked'),
      onError: (error) => console.error('Failed to track', error)
    });
  };
}
```

---

### useActivityByDateRange()

Filter activities by date range.

```typescript
useActivityByDateRange(startDate: Date, endDate: Date): {
  data: UserActivity[];
  loading: boolean;
  error: Error | null;
}
```

---

### useActivityByAction()

Filter activities by action type.

```typescript
useActivityByAction(action: UserActivity['action']): {
  data: UserActivity[];
  loading: boolean;
}
```

---

### useFailedLoginAttempts()

Get failed login attempts (security tracking).

```typescript
useFailedLoginAttempts(): {
  data: UserActivity[];
  loading: boolean;
}
```

---

### useRecentUserActions()

Get recent user actions.

```typescript
useRecentUserActions(limit?: number): {
  data: UserActivity[];
  loading: boolean;
}
```

---

## Query Keys

All query keys are centralized for consistency.

```typescript
const USER_QUERY_KEYS = {
  all: ['users'],
  lists: () => ['users', 'list'],
  list: (filters?) => ['users', 'list', { filters }],
  details: () => ['users', 'detail'],
  detail: (id) => ['users', 'detail', id],
  stats: () => ['users', 'stats'],
  activity: () => ['users', 'activity'],
  activityUser: (userId) => ['users', 'activity', userId],
};

const ACTIVITY_QUERY_KEYS = {
  all: ['user-activity'],
  lists: () => ['user-activity', 'list'],
  list: (filters) => ['user-activity', 'list', filters],
  detail: (id) => ['user-activity', 'detail', id],
  userActivity: (userId) => ['user-activity', 'user', userId],
  stats: () => ['user-activity', 'stats'],
};
```

---

## Cache Management

### Manual Invalidation

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { USER_QUERY_KEYS } from '@/modules/features/user-management/hooks';

function MyComponent() {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    // Invalidate all user queries
    queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
  };

  const handleRefreshList = () => {
    // Invalidate only user list queries
    queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
  };

  const handleRefreshUser = (userId: string) => {
    // Invalidate specific user
    queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.detail(userId) });
  };
}
```

### Cache Timing

- **User List**: 5 minutes
- **User Detail**: 10 minutes
- **Statistics**: 10 minutes
- **Activity**: 5 minutes
- **User Activity**: 2 minutes
- **Metadata** (roles/statuses): 1 hour

---

## Best Practices

1. **Always handle loading state**: Show spinner while `loading` is true
2. **Always handle errors**: Display error messages to users
3. **Use proper cache invalidation**: Mutations automatically invalidate related queries
4. **Prefer query keys**: Use centralized query key constants
5. **Check permissions**: Use permission hooks before rendering sensitive UIs
6. **Combine filters**: Use filter objects for complex queries
7. **Manual refresh**: Provide refetch buttons for user control
8. **Debounce search**: Debounce search input before triggering queries
9. **Pagination**: Implement pagination for large datasets
10. **Error boundary**: Wrap components with error boundary for safety

---

## Related Documentation

- [API Reference](./API.md)
- [Module Documentation](./DOC.md)
- [Permissions Reference](./PERMISSIONS.md)
- [React Query Documentation](https://tanstack.com/query/latest/)

---

**Version**: 2.0.0  
**Status**: Complete  
**Last Updated**: 2025-02-08  
---
title: User Management Module
description: Complete documentation for the User Management module including user administration, role management, permissions matrix, and RBAC integration
lastUpdated: 2025-01-15
relatedModules: [super-admin, notifications, audit-logs]
category: module
status: production
---

# User Management Module

## Overview

The User Management module provides comprehensive user administration capabilities including user creation, role assignment, permission matrix visualization, and role-based access control (RBAC). It serves as the central hub for managing users, roles, and permissions across the entire application.

## Module Structure

```
user-management/
├── components/              # Reusable UI components
│   ├── UserDetailPanel.tsx       # Side drawer for user details
│   ├── UserFormPanel.tsx         # Side drawer for create/edit
│   └── UsersList.tsx             # Users list component
├── hooks/                   # Custom React hooks
│   ├── useUsers.ts               # React Query hooks for user operations
├── services/                # Business logic
│   ├── userService.ts            # Service factory-routed service
│   └── index.ts
├── store/                   # State management
│   └── (managed via service factory)
├── views/                   # Page components
│   ├── UsersPage.tsx             # Users list page
│   ├── RoleManagementPage.tsx    # Role management page
│   ├── PermissionMatrixPage.tsx  # Permission matrix visualization
│   └── UserManagementPage.tsx    # Main navigation page
├── index.ts                 # Module entry point
├── routes.tsx               # Route definitions (NESTED)
└── DOC.md                  # This file
```

## Key Features

### 1. User Management
- Create, read, update, and delete users
- User status management (Active, Inactive, Suspended)
- Bulk user operations
- User search and filtering
- Avatar and profile pictures
- Contact information (Email, Phone)

### 2. Role Management
- Create custom roles
- Assign predefined role templates
- Role-based user assignment
- Role cloning from templates
- Role hierarchy visualization

### 3. Permissions Matrix
- Visual permission grid
- Role-permission mapping
- Resource-action combinations
- Permission categories
- Bulk permission updates
- Export permission matrix

### 4. RBAC System
- Role-based access control
- Permission validation
- Resource protection
- Action authorization
- Multi-tenant support

## Module Structure (Routes)

```
/tenant/user-management        # Backward compatibility redirect
/tenant/users                  # Users module root
├── /tenant/users/list         # Users list page
├── /tenant/users/roles        # Role management page
├── /tenant/users/permissions  # Permission matrix page
└── /tenant/users/:id          # User detail page
```

**Route Navigation:**
- `/tenant/user-management` → redirects to `/tenant/users/list`
- `/tenant/users` → redirects to `/tenant/users/list`
- `/tenant/users/list` → UsersPage component
- `/tenant/users/roles` → RoleManagementPage component
- `/tenant/users/permissions` → PermissionMatrixPage component

## Architecture

### Component Layer

#### UsersPage.tsx (Users List)
- Ant Design Table with user list
- User columns: ID, Name, Email, Role, Status, Actions
- Search by name, email, role
- Filter by status, role
- Pagination: 50 users per page
- Row actions: View, Edit, Deactivate, Delete
- Create user button
- Bulk operations

#### RoleManagementPage.tsx
- List of all roles
- Create new role
- Edit role details
- Assign permissions to roles
- Role templates display
- Clone from template
- Delete roles

#### PermissionMatrixPage.tsx
- Grid visualization: Roles × Permissions
- Checkboxes for permission assignment
- Resource category grouping
- Bulk select/deselect
- Permission descriptions
- Export as CSV
- Save changes

#### UserDetailPanel.tsx
- Read-only user details
- User profile information
- Current role assignment
- Assigned permissions display
- Activity history
- Edit button to switch to form

#### UserFormPanel.tsx
- Create new user form
- Edit existing user form
- Fields: Email, First Name, Last Name, Role, Status
- Role dropdown with search
- Form validation
- Submit/Cancel buttons

### State Management

The User Management module uses the factory-routed User Service via React Query for state management, avoiding local Zustand store complexity for this administrative module.

### API/Hooks (React Query)

#### useUsers Hook

```typescript
// Get all users
const { data: users, isLoading } = useUsers(filters);

// Get single user
const { data: user } = useUser(userId);

// Create user
const createMutation = useCreateUser();
await createMutation.mutateAsync(userData);

// Update user
const updateMutation = useUpdateUser(userId);
await updateMutation.mutateAsync(updates);

// Delete user
const deleteMutation = useDeleteUser(userId);
await deleteMutation.mutateAsync();

// Get roles
const { data: roles } = useRoles();

// Get permissions
const { data: permissions } = usePermissions();
```

## Data Types & Interfaces

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  tenantId: string;
  avatar?: string;
  phone?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
  isSystemPermission: boolean;
}

interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  category: string;
}

interface UserFilter {
  status?: string[];
  role?: string[];
  tenantId?: string;
  searchQuery?: string;
}
```

## Integration Points

### 1. Super Admin Module
- System-level user management
- Tenant user administration
- System role creation

### 2. Notifications Module
- Notify on user role changes
- Alert on permission updates
- User activity notifications

### 3. Audit Logs Module
- Log user management actions
- Track permission changes
- Record role assignments

## RBAC & Permissions

```typescript
// Required Permissions
- users:view              // View users
- users:create            // Create users
- users:edit              // Edit users
- users:delete            // Delete users
- roles:view              // View roles
- roles:create            // Create roles
- roles:edit              // Edit roles
- roles:delete            // Delete roles
- permissions:view        // View permissions
- permissions:manage      // Manage permissions

// Role-Based Access
Super Admin:
  - Full access to all user management features
  - Can manage system roles
  - Can manage system permissions
  
Admin:
  - Can manage tenant users
  - Can create/edit/delete custom roles
  - Can assign roles to users
  
Manager:
  - Can view users and roles
  - Cannot create/edit/delete users or roles
```

## Common Use Cases

### 1. Creating a New User

```typescript
const createUser = async (userData: Partial<User>) => {
  const mutation = useCreateUser();
  try {
    const result = await mutation.mutateAsync({
      email: 'newuser@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'manager',
      status: 'active',
      tenantId: 'tenant_123',
    });
    notification.success('User created successfully');
    refetchUsers();
  } catch (error) {
    notification.error('Failed to create user');
  }
};
```

### 2. Assigning Role to User

```typescript
const assignRole = async (userId: string, roleId: string) => {
  const mutation = useUpdateUser(userId);
  await mutation.mutateAsync({
    role: roleId,
  });
};
```

### 3. Getting Permission Matrix

```typescript
const { data: roles } = useRoles();
const { data: permissions } = usePermissions();

// Create matrix: roles × permissions
const matrix = roles.map(role => ({
  role: role.name,
  permissions: permissions.map(perm => ({
    name: perm.name,
    granted: role.permissions.includes(perm.id),
  })),
}));
```

### 4. Filtering Users by Role

```typescript
const { data: managers } = useUsers({
  role: ['manager'],
  status: ['active'],
});
```

## Route Navigation

### Correct Route Access

```typescript
// Programmatic navigation
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navigate to specific routes
navigate('/tenant/users/list');           // Users list
navigate('/tenant/users/roles');          // Role management
navigate('/tenant/users/permissions');    // Permission matrix
navigate(`/tenant/users/${userId}`);      // User detail
```

### Navigation Configuration

The module is integrated with `src/config/navigationPermissions.ts`:

```typescript
Key: /tenant/users
├─ Label: "User Management"
├─ Permission: manage_users
├─ Children:
│  ├─ Key: /tenant/users/list
│  │  ├─ Label: "Users"
│  │  └─ Permission: manage_users
│  ├─ Key: /tenant/users/roles
│  │  ├─ Label: "Roles"
│  │  └─ Permission: manage_roles
│  └─ Key: /tenant/users/permissions
│     ├─ Label: "Permissions"
│     └─ Permission: manage_roles
```

## Troubleshooting

### Issue: Routes not working
**Cause**: Routes nested incorrectly  
**Solution**: Verify routes.tsx has nested format with parent `/list` route

### Issue: Cannot navigate to roles page
**Cause**: Missing permission or incorrect route  
**Solution**: Check `/tenant/users/roles` path and user permissions

### Issue: User list not loading
**Cause**: Service not initialized or API error  
**Solution**: Verify user service in factory and check API response

### Issue: Role assignment not persisting
**Cause**: Mutation error or validation failure  
**Solution**: Check error message and validate role exists

## Related Documentation

- [Super Admin Module](../super-admin/DOC.md)
- [RBAC & Permissions](../../docs/architecture/RBAC_AND_PERMISSIONS.md)
- [Service Factory Pattern](../../docs/architecture/SERVICE_FACTORY.md)
- [Navigation Permissions](../../docs/architecture/NAVIGATION_PERMISSIONS.md)

## Version Information

- **Last Updated**: 2025-01-15
- **Module Version**: 1.0.0
- **Production Status**: ✅ Ready
- **Last Fixed**: 2025-01-15 (Nested routes setup)
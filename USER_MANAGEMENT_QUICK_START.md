---
title: User Management Module - Quick Start Guide
description: Fast reference guide for using the standardized User Management module
date: 2025-01-30
author: AI Agent
version: 1.0.0
status: active
---

# User Management Module - Quick Start Guide

## 🚀 Quick Links

- **Full Documentation**: `/src/modules/features/user-management/DOC.md`
- **DTO Definitions**: `/src/types/dtos/userDtos.ts`
- **Service Factory**: `/src/services/serviceFactory.ts`
- **React Hooks**: `/src/modules/features/user-management/hooks/useUsers.ts`
- **Tests**: `/src/services/__tests__/userServiceSync.test.ts`

---

## 📦 What's Standardized

✅ All 8 layers synchronized  
✅ Consistent field naming (camelCase DTOs)  
✅ Identical validation rules  
✅ React Query cache management  
✅ Multi-backend support (Mock/Supabase)  

---

## 💻 Common Code Patterns

### Pattern 1: Fetch Users with Filters

```typescript
import { useUsers } from '@/modules/features/user-management/hooks';

function UserList() {
  const { users, loading, error } = useUsers({
    status: ['active'],
    role: ['admin', 'manager'],
    search: 'john'
  });

  if (loading) return <Spin />;
  if (error) return <Alert type="error" message={error.message} />;

  return (
    <Table
      dataSource={users}
      columns={[
        { dataIndex: 'email', title: 'Email' },
        { dataIndex: 'name', title: 'Name' },
        { dataIndex: 'role', title: 'Role' },
        { dataIndex: 'status', title: 'Status' },
      ]}
    />
  );
}
```

### Pattern 2: Create New User

```typescript
import { useCreateUser } from '@/modules/features/user-management/hooks';
import { CreateUserDTO } from '@/types/dtos/userDtos';

function CreateUserForm() {
  const { mutate: createUser, isPending } = useCreateUser();
  const [form] = Form.useForm();

  const handleSubmit = (values: CreateUserDTO) => {
    createUser(values, {
      onSuccess: (newUser) => {
        message.success(`User ${newUser.email} created`);
        form.resetFields();
      },
      onError: (error) => {
        message.error(error.message);
      },
    });
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true },
          { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' }
        ]}
        tooltip="Maximum 255 characters, must be unique"
      >
        <Input type="email" placeholder="user@example.com" />
      </Form.Item>

      <Form.Item
        name="name"
        label="Full Name"
        rules={[{ required: true }]}
      >
        <Input placeholder="John Doe" />
      </Form.Item>

      <Form.Item
        name="firstName"
        label="First Name"
        tooltip="Optional, helps with personalization"
      >
        <Input placeholder="John" />
      </Form.Item>

      <Form.Item
        name="lastName"
        label="Last Name"
        tooltip="Optional"
      >
        <Input placeholder="Doe" />
      </Form.Item>

      <Form.Item
        name="role"
        label="Role"
        rules={[{ required: true }]}
        tooltip="Database enum: super_admin, admin, manager, agent, engineer, customer"
      >
        <Select
          placeholder="Select role"
          options={[
            { label: 'Super Admin', value: 'super_admin' },
            { label: 'Admin', value: 'admin' },
            { label: 'Manager', value: 'manager' },
            { label: 'Agent', value: 'agent' },
            { label: 'Engineer', value: 'engineer' },
            { label: 'Customer', value: 'customer' },
          ]}
        />
      </Form.Item>

      <Form.Item
        name="status"
        label="Status"
        rules={[{ required: true }]}
        tooltip="Database enum: active, inactive, suspended"
      >
        <Select
          placeholder="Select status"
          options={[
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Suspended', value: 'suspended' },
          ]}
        />
      </Form.Item>

      <Form.Item
        name="phone"
        label="Phone"
        tooltip="Optional, max 50 characters"
      >
        <Input placeholder="+1-555-0000" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={isPending}>
          Create User
        </Button>
      </Form.Item>
    </Form>
  );
}
```

### Pattern 3: Update User

```typescript
import { useUpdateUser } from '@/modules/features/user-management/hooks';
import { UpdateUserDTO } from '@/types/dtos/userDtos';

function EditUserForm({ userId }: { userId: string }) {
  const { mutate: updateUser, isPending } = useUpdateUser(userId);
  const [form] = Form.useForm();

  const handleSubmit = (values: UpdateUserDTO) => {
    updateUser(values, {
      onSuccess: () => {
        message.success('User updated successfully');
      },
      onError: (error) => {
        message.error(error.message);
      },
    });
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      {/* Same fields as create, but all optional */}
      <Form.Item name="email" label="Email">
        <Input />
      </Form.Item>
      {/* ... other fields ... */}
      <Button type="primary" htmlType="submit" loading={isPending}>
        Update User
      </Button>
    </Form>
  );
}
```

### Pattern 4: Delete User

```typescript
import { useDeleteUser } from '@/modules/features/user-management/hooks';

function UserActions({ userId, userName }: { userId: string; userName: string }) {
  const { mutate: deleteUser, isPending } = useDeleteUser();

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete User',
      content: `Are you sure you want to delete ${userName}?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        deleteUser(userId, {
          onSuccess: () => {
            message.success('User deleted');
          },
          onError: (error) => {
            message.error(error.message);
          },
        });
      },
    });
  };

  return (
    <Button danger loading={isPending} onClick={handleDelete}>
      Delete User
    </Button>
  );
}
```

### Pattern 5: Get User Statistics

```typescript
import { useUserStats } from '@/modules/features/user-management/hooks';

function UserStatsCard() {
  const { stats, loading } = useUserStats();

  return (
    <Card loading={loading} title="User Statistics">
      <Statistic
        title="Total Users"
        value={stats?.totalUsers || 0}
      />
      <Statistic
        title="Active Users"
        value={stats?.activeUsers || 0}
      />
      <Statistic
        title="Inactive Users"
        value={stats?.inactiveUsers || 0}
      />
    </Card>
  );
}
```

### Pattern 6: Direct Service Call (Advanced)

```typescript
import { moduleUserService } from '@/modules/features/user-management/services/userService';

// In a non-React component
async function getActiveUsers() {
  const users = await moduleUserService.getUsers({
    status: ['active']
  });
  return users;
}
```

---

## 📋 Field Reference

### Available Fields

```typescript
UserDTO {
  id: string                    // Generated by database
  email: string                 // Required, unique
  name: string                  // Required
  firstName?: string            // Optional
  lastName?: string             // Optional
  role: UserRole               // Required: super_admin|admin|manager|agent|engineer|customer
  status: UserStatus           // Required: active|inactive|suspended
  tenantId: string             // Required, set automatically
  avatarUrl?: string           // Optional
  phone?: string               // Optional, max 50 chars
  mobile?: string              // Optional
  companyName?: string         // Optional
  department?: string          // Optional
  position?: string            // Optional
  createdAt: string            // Generated by database (ISO)
  updatedAt?: string           // Generated by database (ISO)
  lastLogin?: string           // Set by authentication
  createdBy?: string           // User who created this user
  deletedAt?: string           // Set on soft delete
}
```

### Validation Rules

```typescript
// Email
- Required: Yes
- Format: Must be valid email (contains @)
- Max Length: 255
- Unique: Yes

// Name
- Required: Yes
- Type: String
- Max Length: 255

// FirstName / LastName
- Required: No
- Type: String

// Role
- Required: Yes
- Valid Values: ['super_admin', 'admin', 'manager', 'agent', 'engineer', 'customer']

// Status
- Required: Yes
- Valid Values: ['active', 'inactive', 'suspended']

// Phone
- Required: No
- Max Length: 50
```

---

## 🔍 Filter Options

```typescript
UserFiltersDTO {
  status?: UserStatus[]              // Filter by status(es)
  role?: UserRole[]                  // Filter by role(s)
  department?: string[]              // Filter by department(s)
  search?: string                    // Search in name, email, company
  createdAfter?: string              // Date range start (ISO)
  createdBefore?: string             // Date range end (ISO)
}

// Example:
const filters: UserFiltersDTO = {
  status: ['active', 'inactive'],
  role: ['admin', 'manager'],
  search: 'john',
  createdAfter: '2025-01-01',
};

const users = await useUsers(filters);
```

---

## 🎯 Common Tasks

### Get All Users
```typescript
const { users } = useUsers();
```

### Get User by ID
```typescript
const { user } = useUser('user_123');
```

### Filter Active Admins
```typescript
const { users } = useUsers({
  status: ['active'],
  role: ['admin']
});
```

### Search Users
```typescript
const { users } = useUsers({
  search: 'john doe'
});
```

### Create User
```typescript
const { mutate: createUser } = useCreateUser();
createUser({
  email: 'user@example.com',
  name: 'John Doe',
  role: 'agent',
  status: 'active'
});
```

### Update User Status
```typescript
const { mutate: updateUser } = useUpdateUser(userId);
updateUser({ status: 'inactive' });
```

### Delete User
```typescript
const { mutate: deleteUser } = useDeleteUser();
deleteUser(userId);
```

### Get Statistics
```typescript
const { stats } = useUserStats();
console.log(stats.totalUsers);
console.log(stats.usersByRole);
```

---

## ⚙️ Environment Configuration

### Set API Mode

```bash
# .env file
VITE_API_MODE=mock        # Development with mock data
VITE_API_MODE=supabase    # Production with Supabase
```

### Running in Different Modes

```bash
# Mock mode (default for development)
npm run dev

# With Supabase
VITE_API_MODE=supabase npm run dev

# Build for production
npm run build
```

---

## 🧪 Testing

### Run Tests

```bash
# Run user service sync tests
npm run test -- userServiceSync

# Run with coverage
npm run test -- --coverage userServiceSync

# Watch mode
npm run test -- --watch userServiceSync
```

### What's Tested

- ✅ Mock service structure
- ✅ Supabase service structure
- ✅ Field naming consistency (camelCase)
- ✅ Validation rules parity
- ✅ Error handling
- ✅ Type consistency
- ✅ Statistics accuracy

---

## 🐛 Troubleshooting

### Issue: "Email already exists"

**Cause**: Email is not unique  
**Solution**: Use a different email address

```typescript
// ❌ Will fail if email exists
createUser({ email: 'john@example.com', ... })

// ✅ Use unique email
createUser({ email: `john_${Date.now()}@example.com`, ... })
```

### Issue: "Invalid role" Error

**Cause**: Role is not one of the allowed values  
**Solution**: Use valid role

```typescript
// ❌ WRONG
createUser({ role: 'superuser' })

// ✅ CORRECT
createUser({ role: 'super_admin' })
```

### Issue: Type Errors

**Cause**: Using old `User` type instead of `UserDTO`  
**Solution**: Update imports

```typescript
// ❌ WRONG
import { User } from '@/types/auth'

// ✅ CORRECT
import { UserDTO } from '@/types/dtos/userDtos'
```

### Issue: Stale Data in UI

**Cause**: React Query cache not invalidated  
**Solution**: Hooks automatically handle this, but you can manually refetch

```typescript
const { users, refetch } = useUsers();

// Manual refresh
refetch();

// Or invalidate cache directly
queryClient.invalidateQueries({ queryKey: ['users'] });
```

### Issue: Unauthorized Access

**Cause**: Row-Level Security policy  
**Solution**: Verify user has permission and correct tenant

---

## 📚 Additional Resources

- **Full Documentation**: `/src/modules/features/user-management/DOC.md`
- **DTO Definitions**: `/src/types/dtos/userDtos.ts`
- **Service Factory**: `/docs/architecture/SERVICE_FACTORY.md`
- **React Query**: `https://tanstack.com/query/latest`
- **Supabase RLS**: `https://supabase.com/docs/guides/auth/row-level-security`

---

## ✅ Checklist Before Shipping

- [ ] Import hooks from `/hooks/useUsers`
- [ ] Import DTOs from `/types/dtos/userDtos`
- [ ] Use `UserDTO`, `CreateUserDTO`, `UpdateUserDTO`
- [ ] Add form validation matching database rules
- [ ] Add tooltips with database constraints
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Test with `VITE_API_MODE=mock`
- [ ] Test with `VITE_API_MODE=supabase`
- [ ] Run tests: `npm run test -- userServiceSync`

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-30  
**Ready for**: Production ✅
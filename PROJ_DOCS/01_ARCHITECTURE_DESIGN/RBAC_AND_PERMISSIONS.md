---
title: RBAC & Permissions Architecture
description: Role-based access control with Row-Level Security and multi-tenant isolation
category: Architecture
lastUpdated: 2025-01-20
status: Active
relatedModules: all
---

# RBAC & Permissions Architecture

## 🎯 Overview

**RBAC (Role-Based Access Control)** is a three-tier security system that protects data and features in a multi-tenant environment:

1. **Application Layer** - Component visibility and feature access
2. **API Layer** - Service factory enforces permissions
3. **Database Layer** - PostgreSQL Row-Level Security (RLS) prevents direct access

**Why This Matters:**
- Prevents unauthorized data access across tenants
- Controls feature visibility based on user role
- Audit logs all permission changes
- Compliant with data protection regulations

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────┐
│         User Performs Action                 │
│      (e.g., View Customer List)              │
└─────────────────────┬────────────────────────┘
                      │
        ┌─────────────▼─────────────┐
        │  Application Layer        │
        │  Check permission         │
        │  Show/hide component      │
        │  Enable/disable features  │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │  Service Factory Layer    │
        │  Validate permission      │
        │  Add tenant context       │
        │  Route to API             │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │  Database Layer (RLS)     │
        │  PostgreSQL enforces      │
        │  tenant_id filtering      │
        │  Row-level security       │
        └──────────────────────────┘
```

---

## 📊 Permission Matrix

### Core Permission Categories

```typescript
enum PermissionCategory {
  CUSTOMER = 'customer',
  SALES = 'sales',
  PRODUCT = 'product',
  TICKET = 'ticket',
  NOTIFICATION = 'notification',
  USER_MANAGEMENT = 'user_management',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  AUDIT = 'audit',
  RBAC = 'rbac'
}

enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  EXPORT = 'export'
}
```

### Permission Format

```typescript
// Full permission: "{category}_{action}"
const permissions = [
  'customer_read',        // View customers
  'customer_create',      // Create new customer
  'customer_update',      // Update customer data
  'customer_delete',      // Delete customer
  'sales_read',           // View sales
  'sales_create',         // Create new sale
  'sales_update',         // Update sale
  'sales_delete',         // Delete sale
  'product_read',         // View products
  'product_create',       // Create product
  'settings_update',      // Change settings
  'reports_export',       // Export reports
  'audit_read',           // View audit logs
  'rbac_manage',          // Manage roles and permissions
];
```

### Standard Roles

| Role | Purpose | Permissions |
|------|---------|-------------|
| **Super Admin** | Full system access | All permissions + RBAC management |
| **Admin** | Manage operations | All data operations + user management |
| **Manager** | Manage team & data | Create/update/delete own team's data |
| **User** | Basic operations | Read + create own records |
| **Viewer** | Read-only access | Read-only on assigned data |

---

## 🗄️ Database Schema

### `permissions` Table

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Permission identifier
  name VARCHAR UNIQUE NOT NULL,              -- e.g., "customer_read"
  description TEXT,                         -- Human-readable description
  
  -- Categorization (REQUIRED)
  category VARCHAR NOT NULL,                -- e.g., "customer", "sales"
  resource VARCHAR NOT NULL,                -- e.g., "customers", "sales"
  action VARCHAR NOT NULL,                  -- e.g., "read", "create"
  
  -- Classification
  is_system_permission BOOLEAN DEFAULT true, -- Built-in vs custom
  
  -- Metadata
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Example data
INSERT INTO permissions (name, description, category, resource, action, is_system_permission) VALUES
('customer_read', 'View customer records', 'customer', 'customers', 'read', true),
('customer_create', 'Create new customer', 'customer', 'customers', 'create', true),
('sales_export', 'Export sales reports', 'sales', 'sales', 'export', true);
```

### `roles` Table

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Role identification
  name VARCHAR NOT NULL,                    -- e.g., "Manager", "User"
  description TEXT,
  
  -- Multi-tenant (REQUIRED)
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Permissions array
  permissions UUID[] DEFAULT ARRAY[]::UUID[],  -- Array of permission IDs
  
  -- Classification
  is_system_role BOOLEAN DEFAULT false,     -- System roles can't be deleted
  
  -- Metadata
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(tenant_id, name),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
```

### `user_roles` Table

```sql
CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  
  -- When assignment occurred
  assigned_at TIMESTAMP DEFAULT now(),
  
  PRIMARY KEY (user_id, role_id)
);
```

### `role_templates` Table

```sql
CREATE TABLE role_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template identification
  name VARCHAR NOT NULL,                    -- e.g., "Sales Manager Template"
  description TEXT,
  
  -- Permissions
  permissions UUID[] DEFAULT ARRAY[]::UUID[],  -- Pre-defined permission set
  
  -- Multi-tenant (REQUIRED)
  category VARCHAR NOT NULL,                -- e.g., "sales", "customer_service"
  
  -- Classification
  is_default BOOLEAN DEFAULT false,         -- Suggested for new roles
  
  -- Metadata
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(name)
);
```

### `audit_logs` Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who performed the action
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- What action was performed
  action VARCHAR NOT NULL,                  -- e.g., "role_assigned", "permission_granted"
  resource VARCHAR NOT NULL,                -- e.g., "users", "roles"
  resource_id VARCHAR,                      -- e.g., user_id that was modified
  
  -- Details of the action
  details JSONB,                            -- Additional context
  
  -- Request metadata
  ip_address INET,
  user_agent TEXT,
  
  -- Multi-tenant (REQUIRED)
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Timestamp
  timestamp TIMESTAMP DEFAULT now(),
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Index for fast queries
CREATE INDEX idx_audit_logs_tenant_user ON audit_logs(tenant_id, user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

---

## 🔐 Row-Level Security (RLS) Policies

### Tenant Isolation RLS

```sql
-- Enable RLS on all data tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Example: Users can only see their own tenant's users
CREATE POLICY "Users see own tenant" ON users
  FOR SELECT
  USING (tenant_id = auth.jwt_claim('tenant_id')::uuid);

-- Example: Users can only see roles in their tenant
CREATE POLICY "Roles are tenant-scoped" ON roles
  FOR SELECT
  USING (tenant_id = auth.jwt_claim('tenant_id')::uuid);

-- Example: Audit logs only visible to own tenant
CREATE POLICY "Audit logs visible to own tenant" ON audit_logs
  FOR SELECT
  USING (tenant_id = auth.jwt_claim('tenant_id')::uuid);
```

### Permission-Based RLS

```sql
-- More restrictive: Check specific permission in JWT
CREATE POLICY "Can only update customer if has permission" ON customers
  FOR UPDATE
  USING (
    tenant_id = auth.jwt_claim('tenant_id')::uuid
    AND 'customer_update' = ANY(auth.jwt_claim('permissions')::text[])
  );

-- Audit sensitive operations
CREATE TRIGGER audit_customer_deletion AFTER DELETE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_function();
```

---

## 🛠️ Service Implementation

### RBAC Service Interface

**Location**: `src/services/rbacService.ts` (mock) and `src/services/api/supabase/rbacService.ts` (Supabase)

```typescript
interface IRBACService {
  // Permissions
  getPermissions(): Promise<Permission[]>;
  getPermissionsByCategory(category: string): Promise<Permission[]>;
  
  // Roles
  getRoles(tenantId: string): Promise<Role[]>;
  getRoleTemplates(): Promise<RoleTemplate[]>;
  createRole(data: RoleData, tenantId: string): Promise<Role>;
  updateRole(id: string, data: RoleData, tenantId: string): Promise<Role>;
  deleteRole(id: string, tenantId: string): Promise<void>;
  createRoleFromTemplate(templateId: string, roleName: string, tenantId: string): Promise<Role>;
  
  // User Assignments
  assignUserRole(userId: string, roleId: string, tenantId: string): Promise<void>;
  removeUserRole(userId: string, roleId: string, tenantId: string): Promise<void>;
  bulkAssignRole(userIds: string[], roleId: string, tenantId: string): Promise<void>;
  bulkRemoveRole(userIds: string[], roleId: string, tenantId: string): Promise<void>;
  
  // Permission Matrix
  getPermissionMatrix(tenantId: string): Promise<PermissionMatrix>;
  validateRolePermissions(roleId: string, requiredPermissions: string[]): Promise<boolean>;
  
  // Audit
  getAuditLogs(filters?: AuditLogFilters): Promise<AuditLog[]>;
  logAction(action: string, resource: string, resourceId: string, details: any, tenantId: string): Promise<void>;
}
```

### Implementing Get User Permissions

```typescript
// src/services/rbacService.ts (Mock)
export const mockRBACService = {
  getPermissions: async (): Promise<Permission[]> => {
    return mockPermissions;
  },

  getPermissionsByCategory: async (category: string): Promise<Permission[]> => {
    return mockPermissions.filter(p => p.category === category);
  },

  validateRolePermissions: async (roleId: string, requiredPermissions: string[]): Promise<boolean> => {
    const role = mockRoles.find(r => r.id === roleId);
    if (!role) return false;
    return requiredPermissions.every(perm => role.permissions.includes(perm));
  },

  // ... other methods
};

// src/services/api/supabase/rbacService.ts (Supabase)
export const supabaseRBACService = {
  getPermissions: async (): Promise<Permission[]> => {
    const { data, error } = await supabase
      .from('permissions')
      .select('*');
    if (error) throw error;
    return data || [];
  },

  getPermissionsByCategory: async (category: string): Promise<Permission[]> => {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('category', category);
    if (error) throw error;
    return data || [];
  },

  validateRolePermissions: async (roleId: string, requiredPermissions: string[]): Promise<boolean> => {
    const { data: role, error } = await supabase
      .from('roles')
      .select('permissions')
      .eq('id', roleId)
      .single();
    if (error) return false;
    
    const rolePermissions = role.permissions || [];
    return requiredPermissions.every(perm => rolePermissions.includes(perm));
  },

  // ... other methods
};
```

---

## 🎯 Application Layer: Checking Permissions

### In Components

```typescript
import { useSessionStore } from '@/stores/sessionStore';
import { rbacService } from '@/services/serviceFactory';

function CustomerList() {
  const { currentUser } = useSessionStore();
  const [canCreate, setCanCreate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    // Check if user has permissions
    const checkPermissions = async () => {
      const hasCreate = currentUser?.permissions?.includes('customer_create') ?? false;
      const hasDelete = currentUser?.permissions?.includes('customer_delete') ?? false;
      
      setCanCreate(hasCreate);
      setCanDelete(hasDelete);
    };

    checkPermissions();
  }, [currentUser]);

  return (
    <div>
      {/* Show create button only if user has permission */}
      {canCreate && (
        <Button type="primary" onClick={() => showCreateModal()}>
          Create Customer
        </Button>
      )}

      <Table
        columns={[
          { title: 'Name', dataIndex: 'name' },
          {
            title: 'Actions',
            render: (_, record) => (
              <Space>
                <Button type="link">Edit</Button>
                {/* Show delete button only if user has permission */}
                {canDelete && (
                  <Button type="link" danger onClick={() => deleteCustomer(record.id)}>
                    Delete
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
        dataSource={customers}
      />
    </div>
  );
}
```

### In Hooks

```typescript
// src/hooks/usePermission.ts
export function usePermission() {
  const { currentUser } = useSessionStore();

  return {
    hasPermission: (permission: string): boolean => {
      if (!currentUser) return false;
      return currentUser.permissions?.includes(permission) ?? false;
    },

    hasAnyPermission: (permissions: string[]): boolean => {
      if (!currentUser) return false;
      return permissions.some(p => currentUser.permissions?.includes(p));
    },

    hasAllPermissions: (permissions: string[]): boolean => {
      if (!currentUser) return false;
      return permissions.every(p => currentUser.permissions?.includes(p));
    },

    hasRole: (role: string): boolean => {
      if (!currentUser) return false;
      return currentUser.roles?.includes(role) ?? false;
    },
  };
}

// Usage in component
function Dashboard() {
  const { hasPermission, hasRole } = usePermission();

  if (!hasRole('Admin') && !hasRole('Manager')) {
    return <div>Access Denied</div>;
  }

  return (
    <div>
      {hasPermission('reports_export') && (
        <Button onClick={exportReport}>Export Report</Button>
      )}
    </div>
  );
}
```

---

## 🔄 Permission Flow Example

**Scenario**: User tries to create a customer

```
┌─────────────────────────────────────────────┐
│ 1. User clicks "Create Customer" button     │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│ 2. Component checks permission in store     │
│    hasPermission('customer_create')?        │
└────────────────────┬────────────────────────┘
                     │
            ┌────────┴────────┐
            │                 │
        NO  ▼                 ▼ YES
      ┌─────────────┐  ┌──────────────────┐
      │ Hide button │  │ Show form & call │
      │ or disable  │  │ service function │
      └─────────────┘  └────────┬─────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ 3. Service Factory gets │
                    │    from store:          │
                    │    - tenantId           │
                    │    - userId             │
                    │    - permissions        │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ 4. Route to backend:    │
                    │    - Mock (dev) or      │
                    │    - Supabase (prod)    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ 5. Backend API layer:   │
                    │    - Validate token     │
                    │    - Check permission   │
                    │    - Add tenant context │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ 6. Database RLS layer:  │
                    │    - Check JWT tenant   │
                    │    - Enforce isolation  │
                    │    - Insert record      │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ 7. Create audit log     │
                    │    - Log user action    │
                    │    - Log timestamp      │
                    │    - Log IP address     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ 8. Return to component  │
                    │    - Show success toast │
                    │    - Refresh data       │
                    │    - Update cache       │
                    └────────────────────────┘
```

---

## 🚀 Standard Role Templates

### Sales Manager Template

```json
{
  "name": "Sales Manager Template",
  "category": "sales",
  "permissions": [
    "customer_read",
    "customer_create",
    "customer_update",
    "sales_read",
    "sales_create",
    "sales_update",
    "sales_delete",
    "product_read",
    "reports_export",
    "notification_read"
  ],
  "is_default": false
}
```

### Customer Support Template

```json
{
  "name": "Customer Support Template",
  "category": "support",
  "permissions": [
    "customer_read",
    "customer_update",
    "ticket_read",
    "ticket_create",
    "ticket_update",
    "notification_read",
    "notification_create"
  ],
  "is_default": false
}
```

### Admin Template

```json
{
  "name": "Admin Template",
  "category": "admin",
  "permissions": [
    "customer_read",
    "customer_create",
    "customer_update",
    "customer_delete",
    "sales_read",
    "sales_create",
    "sales_update",
    "sales_delete",
    "product_read",
    "product_create",
    "product_update",
    "product_delete",
    "ticket_read",
    "ticket_create",
    "ticket_update",
    "ticket_delete",
    "user_management_read",
    "user_management_create",
    "user_management_update",
    "user_management_delete",
    "rbac_manage",
    "reports_export",
    "settings_update",
    "audit_read"
  ],
  "is_default": true
}
```

---

## ✅ Implementation Checklist

When implementing RBAC:

- [ ] Database schema created with `category` field on permissions table
- [ ] RLS policies enabled on all multi-tenant tables
- [ ] Service factory routes to mock and Supabase implementations
- [ ] `usePermission()` hook available in components
- [ ] All API calls include tenant context
- [ ] Audit logs created for permission changes
- [ ] Role templates defined for common roles
- [ ] Permission validation in service layer
- [ ] Components check permissions before showing features
- [ ] RLS prevents unauthorized direct queries
- [ ] Tested permission escalation scenarios
- [ ] Tested multi-tenant isolation

---

## 🚨 Common Issues & Solutions

### Issue: "Permission Denied" in Supabase

**Cause**: RLS policy not allowing the query
```sql
-- Debug: Check which policies are preventing access
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customers';
```

**Solution**: Verify JWT contains tenant_id
```sql
SELECT auth.jwt_claim('tenant_id');  -- Should return UUID, not NULL
```

### Issue: Permissions Not Showing in UI

**Cause**: Permissions array empty in currentUser
```typescript
// Debug
const { currentUser } = useSessionStore();
console.log('User permissions:', currentUser.permissions);
```

**Solution**: Ensure JWT token includes permissions claim
```typescript
// Check JWT payload
const jwt = localStorage.getItem('sb-auth-token');
const decoded = JSON.parse(atob(jwt.split('.')[1]));
console.log('JWT permissions:', decoded.permissions);
```

### Issue: Role Not Applying to User

**Cause**: user_roles record not created
```sql
-- Debug
SELECT * FROM user_roles WHERE user_id = 'user_uuid';
```

**Solution**: Ensure both user and role exist in correct tenant
```sql
SELECT * FROM users WHERE id = 'user_uuid' AND tenant_id = 'tenant_uuid';
SELECT * FROM roles WHERE id = 'role_uuid' AND tenant_id = 'tenant_uuid';
```

---

## 🔗 Related Documentation

- [Service Factory Pattern](./SERVICE_FACTORY.md) - Permission enforcement at API layer
- [Session Management](./SESSION_MANAGEMENT.md) - Storing user permissions
- [Authentication System](./AUTHENTICATION.md) - JWT token with permission claims
- [RBAC Schema Fix Guide](./RBAC_SCHEMA_FIX_GUIDE.md) - Database migration instructions

---

**Last Updated**: 2025-01-20  
**Status**: ✅ Active and Maintained  
**Maintainer**: Architecture Team  
**Related Modules**: All 16 Feature Modules
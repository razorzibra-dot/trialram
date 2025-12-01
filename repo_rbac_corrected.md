## 2. RBAC (Role-Based Access Control) System

### 2.1 Role Hierarchy & Responsibilities

**Database Role Names vs User Type Enum Mapping:**

| Database Role | User Type Enum | Tenant Scope | Responsibilities |
|---------------|----------------|--------------|------------------|
| `super_admin` | `super_admin` | **Platform-level** | Platform administration, cross-tenant access, impersonation |
| `Administrator` | `admin` | **Single tenant** | Full tenant management, user lifecycle, role assignment |
| `Manager` | `manager` | **Single tenant** | Team management, limited user editing, password resets |
| `User` | `agent` | **Single tenant** | Standard CRM operations, limited user editing |
| `Engineer` | `engineer` | **Single tenant** | Technical operations, product management, limited user editing |
| `Customer` | `customer` | **Single tenant** | Read-only access to own data and basic CRM features |

**Role Responsibilities Detailed:**

**Super Admin (`super_admin`):**
- Platform-level access across all tenants
- Can impersonate any tenant user
- Access only to super-admin modules (never tenant modules)
- System configuration and monitoring
- Cross-tenant data access for support and maintenance

**Administrator (`admin`):**
- Full tenant-level administration
- Create, edit, delete tenant users (except other admins)
- Assign roles and manage permissions
- Configure tenant settings and features
- Access to all tenant modules based on permissions

**Manager (`manager`):**
- Team oversight within department
- Edit user profiles and reset passwords
- Cannot delete users or change role assignments
- Department-level reporting and analytics
- Limited administrative functions

**User (`agent`):**
- Standard CRM operations (customers, sales, tickets)
- Edit own profile and basic user information
- No user management capabilities
- Department-specific access based on permissions

**Engineer (`engineer`):**
- Technical operations (products, services, tickets)
- Product catalog and service management
- Edit user profiles for technical support
- Limited user management for technical issues

**Customer (`customer`):**
- Read-only access to own data
- Basic CRM portal for tracking requests
- View dashboards and basic reporting
- No user management capabilities

### 2.2 Permission System

**Permission Structure:**
```typescript
interface Permission {
  id: string;           // unique identifier
  name: string;         // human-readable name
  description: string;  // detailed description
  category: 'core' | 'module' | 'administrative' | 'system';
  resource: string;     // affected resource
  action: string;       // allowed action
}
```

**Database-Driven Permission System:**
- Permissions stored in `permissions` table
- Roles contain array of permission IDs
- User roles defined in `user_roles` table with tenant isolation
- Permission validation through `role_permissions` junction table

**Core Permission Categories:**

**1. Core Permissions (Basic Operations):**
- `read` - View and read data (global access)
- `write` - Create and edit data (global access)
- `delete` - Delete data (global access)

**2. Module Permissions (Feature-Specific):**
- `crm:customer:record:update` - Full customer management
- `crm:sales:deal:update` - Sales process management
- `manage_tickets` - Support ticket management
- `manage_products` - Product catalog management
- `manage_contracts` - Contract lifecycle management
- `crm:support:complaint:update` - Complaint handling

**3. Administrative Permissions (User Management):**
- `crm:user:record:update` - User account management
- `crm:role:record:update` - Role and permission management
- `crm:analytics:insight:view` - Analytics and reporting access
- `crm:system:config:manage` - System configuration

**4. System Permissions (Platform-Level):**
- `super_admin` - Platform administrator (super_admin role only)
- `tenant:users` - Tenant user management
- `user:crm:role:record:update` - User role assignment

**User-Specific Permissions (from PermissionGuard):**
- `user:list` - View user lists
- `user:view` - View user details
- `user:create` - Create new users
- `user:edit` - Edit user profiles
- `user:delete` - Delete users
- `user:reset_password` - Reset user passwords
- `user:crm:role:record:update` - Assign roles to users

**Permission Validation Flow:**
1. Check synchronous permission cache
2. Validate against user's role permissions
3. Apply tenant isolation rules
4. Enforce role hierarchy restrictions
5. Log access attempts for audit trail

### 2.3 Module Access Control

**Super Admin Modules (Platform-level only):**
```typescript
const SUPER_ADMIN_ONLY_MODULES = [
  'super-admin', 
  'system-admin', 
  'admin-panel'
];
```

**Tenant Modules (RBAC-controlled):**
```typescript
const TENANT_MODULES = [
  'customers', 'sales', 'contracts', 'service-contracts',
  'products', 'product-sales', 'tickets', 'complaints',
  'job-works', 'notifications', 'reports', 'settings'
];
```

**Access Control Logic:**
```typescript
// Super Admin: Can ONLY access super-admin modules
if (user.isSuperAdmin) {
  return isSuperAdminModule(moduleName);
}

// Regular User: Can access tenant modules based on RBAC
if (isTenantModule(moduleName)) {
  return authService.hasPermission(`manage_${moduleName}`);
}
```

**Role-Based Permission Matrix (Fallback System):**

| Role | User Management | Customer Mgmt | Sales Mgmt | Product Mgmt | Ticket Mgmt | Analytics |
|------|----------------|---------------|------------|--------------|-------------|-----------|
| `super_admin` | **All** (`*`) | All | All | All | All | All |
| `admin` | Full | Full | Full | Full | Full | View |
| `manager` | View/Edit/Reset | Full | Full | Full | Full | View |
| `agent` | View/Edit only | Full | Full | View | Full | View |
| `engineer` | View/Edit only | View | View | Full | Full | View |
| `customer` | View own only | View own | View own | View | View own | View own |

**User Action Permissions by Role:**

| Action | admin | manager | agent | engineer | customer |
|--------|-------|---------|-------|----------|----------|
| Create User | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit User | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete User | ✅* | ❌ | ❌ | ❌ | ❌ |
| Reset Password | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Users | ✅ | ✅ | ✅ | ✅ | ✅ |

*Cannot delete other admins (security measure)

**Permission Implementation Details:**

**1. Role Mapping (Database to TypeScript):**
```typescript
// From authService.ts - Role mapping
const roleMap: Record<string, User['role']> = {
  'Administrator': 'admin',
  'Manager': 'manager', 
  'User': 'agent',
  'Engineer': 'engineer',
  'Customer': 'customer',
  'super_admin': 'super_admin'
};
```

**2. Basic Role Permissions (Fallback System):**
```typescript
const basicRolePermissions: Record<string, string[]> = {
  'super_admin': ['*'], // Super admin has all permissions
  'admin': [
    'read', 'write', 'delete',
    'crm:user:record:update', 'crm:role:record:update', 'crm:customer:record:update', 'crm:sales:deal:update',
    'manage_tickets', 'manage_contracts', 'manage_products', 'view_dashboard'
  ],
  'manager': [
    'read', 'write', 'crm:customer:record:update', 'crm:sales:deal:update', 'manage_tickets',
    'manage_contracts', 'manage_products', 'view_dashboard'
  ],
  'user': [
    'read', 'write', 'crm:customer:record:update', 'manage_tickets', 'view_dashboard'
  ],
  'engineer': [
    'read', 'write', 'manage_products', 'manage_tickets', 'view_dashboard'
  ],
  'customer': [
    'read', 'view_dashboard'
  ]
};
```

**3. Tenant Isolation Rules:**
- All regular users must have matching tenant_id for data access
- Super admins bypass tenant restrictions (tenantId=null)
- RLS policies enforce tenant isolation at database level
- Cross-tenant access attempts are logged and blocked

**4. Action-to-Permission Mapping:**
```typescript
// From rbacService.ts - Action mapping
private mapActionToPermission(action: string): string | null {
  const parts = action.split(':');
  if (parts.length < 2) return null;
  
  const resource = parts[0];
  const operation = parts[1];
  
  // Most operations require "manage_resource" permission
  switch (operation) {
    case 'create':
    case 'edit':
    case 'delete':
    case 'change_status':
    case 'approve':
    case 'reject':
    case 'bulk_delete':
    case 'export':
    case 'view_audit':
      return `manage_${resource}`;
    
    case 'view':
    case 'view_details':
      return `manage_${resource}`;
    
    default:
      return `manage_${resource}`;
  }
}
```

---

## 3. Service Layer Architecture
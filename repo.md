# PDS CRM Application - Repository Documentation

**Last Updated:** November 16, 2025  
**Current Architecture:** Service Factory Pattern with 24 Unified Services  
**RBAC System:** Database-Driven Role-Based Access Control  
**Phase:** Production-Ready Implementation  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [RBAC (Role-Based Access Control) System](#2-rbac-role-based-access-control-system)
3. [Service Layer Architecture](#3-service-layer-architecture)
4. [Application Modules](#4-application-modules)
5. [Layer Sync Rules](#5-layer-sync-rules)
6. [Database Schema](#6-database-schema)
7. [Implementation Guidelines](#7-implementation-guidelines)
8. [Development Standards](#8-development-standards)
9. [Rules for Future Implementation](#9-rules-for-future-implementation)

---

## 1. System Overview

### 1.1 Architecture Pattern

The CRM application follows a **Service Factory Architecture** with:
- **24 unified services** with mock/supabase switching capability
- **ES6 Proxy-based delegation** (68% code reduction from traditional approach)
- **Multi-tenant architecture** with RLS (Row Level Security) enforcement
- **16 feature modules** with consistent registration pattern
- **Database-driven RBAC** with fallback permission system

### 1.2 Core Components

```
┌─────────────────────────────────────────────────────┐
│         Application (React Components)              │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  Service Proxies (authService, productService...)   │ ◄── Exports
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│     createServiceProxy(registryKey: string)         │ ◄── Proxy Factory
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│      ServiceFactory Class                           │
│   ├─ getService(serviceName): any                   │
│   ├─ getApiMode(): ApiMode                          │
│   └─ serviceRegistry: { [key]: ServiceEntry }       │ ◄── Core
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   ┌─────────────┐    ┌─────────────┐
   │  Mock Mode  │    │ Supabase    │
   │  Services   │    │ Services    │
   └─────────────┘    └─────────────┘
```

### 1.3 API Modes

- **Mock Mode** (`VITE_API_MODE=mock`): Development and testing with simulated data
- **Supabase Mode** (`VITE_API_MODE=supabase`): Production with PostgreSQL backend
- **Real API Mode** (`VITE_API_MODE=real`): Future integration with real backend services

---

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

**Role Mapping Implementation:**
```typescript
const roleMap: Record<string, User['role']> = {
  'Administrator': 'admin',
  'Manager': 'manager', 
  'User': 'agent',
  'Engineer': 'engineer',
  'Customer': 'customer',
  'super_admin': 'super_admin'
};
```

### 2.2 Role Responsibilities Detailed

**Super Admin (`super_admin`) - Platform Level (Level 1):**
- **Tenant Management:** Create, update, delete, and manage all tenants in the system
- **System Administration:** Full access to system configuration and setup
- **Role & Permission Management:** Manage system roles, permissions, and access control
- **System Monitoring:** Access to system logs, audit trails, and monitoring dashboards
- **Tenant Billing:** Manage tenant subscriptions, billing cycles, and payment processing
- **Feature Management:** Control tenant feature accessibility based on subscription plans
- **Tenant Configuration:** Set up and configure CRM features for subscribed tenants
- **Cross-tenant Operations:** Access to all tenant data for support and maintenance
- **Platform Analytics:** Access to platform-wide analytics and reporting
- **System Security:** Manage platform security settings and compliance
- **Tenant Onboarding:** Assist with tenant setup and initial configuration
- **Tenant Complaint Management:** Handle tenant-level complaints and escalations
- **No tenant isolation** - bypasses all RLS policies for platform management

**Administrator (`admin`) - Tenant Level (Level 2):**
- **Tenant CRM Operations:** Full management of tenant's CRM features and business operations
- **User Management:** Create, edit, delete tenant users (except other administrators)
- **Role Assignment:** Assign and manage roles within the tenant (Manager, Engineer, User, Customer)
- **Business Configuration:** Configure tenant settings, workflows, and business rules
- **Data Management:** Full access to tenant data (customers, sales, tickets, products, contracts)
- **Feature Access Control:** Manage feature access for subordinate roles as per business needs
- **Reporting & Analytics:** Access to tenant-level reports and analytics
- **Business Rules:** Configure business processes and approval workflows
- **Integration Management:** Manage third-party integrations and API access
- **Security Management:** Configure tenant security settings and access controls
- **Cannot Create/Manage Tenants** - restricted to tenant-level operations only
- **Tenant isolation enforced** - only access own tenant data

**Manager (`manager`) - Tenant Level (Level 3):**
- **Department Management:** Team oversight and department-level operations
- **User Profile Management:** Edit user profiles and reset passwords for subordinate users
- **Limited Administrative Functions:** Cannot delete users or change role assignments
- **Business Operations:** Full access to business operations except financial details
- **Department Reporting:** Access to department-level analytics and reporting
- **Workflow Management:** Manage approval workflows and business processes
- **Resource Management:** Allocate resources and manage department activities
- **Performance Monitoring:** Monitor team performance and KPIs
- **Customer Management:** Full access to customer relationship management
- **Sales Management:** Complete sales process management
- **Support Management:** Full access to ticket and complaint management
- **Financial Access:** **NO access to financial details, billing, or subscription information**
- **Role Customization:** Administrator can adjust role permissions based on business needs
- **Tenant isolation enforced** - only access own tenant data

**Engineer (`engineer`) - Tenant Level (Level 4):**
- **Technical Operations:** Product catalog management and service delivery
- **Product Management:** Full product catalog and inventory management
- **Service Management:** Manage service contracts and delivery processes
- **Technical Support:** Resolve technical issues and provide technical assistance
- **Job Work Management:** Manage job works, assignments, and completion tracking
- **System Configuration:** Limited access to technical system configuration
- **Quality Assurance:** Ensure quality standards and compliance
- **Documentation:** Maintain technical documentation and procedures
- **Integration Support:** Support technical integrations and troubleshooting
- **User Support:** Limited user management for technical support purposes
- **Role Customization:** Administrator can adjust role permissions based on technical needs
- **Limited Business Access:** Primarily technical focus with business access as needed
- **Tenant isolation enforced** - only access own tenant data

**User (`agent`) - Tenant Level (Level 5):**
- **Standard CRM Operations:** Day-to-day CRM activities and customer interactions
- **Customer Interactions:** Manage customer relationships and communications
- **Sales Activities:** Support sales processes and lead management
- **Ticket Management:** Handle support tickets and customer requests
- **Data Entry:** Create and update customer, sales, and service data
- **Reporting:** Basic reporting and data analysis
- **Profile Management:** Edit own profile and basic personal information
- **Communication:** Send and receive customer communications
- **Workflow Execution:** Execute assigned business processes and workflows
- **No User Management:** Cannot manage other users or system settings
- **Limited Administrative Access:** Restricted to operational functions
- **Role Customization:** Administrator can adjust role permissions based on operational needs
- **Department-specific Access:** Access limited to assigned department or function
- **Tenant isolation enforced** - only access own tenant data

**Customer (`customer`) - Tenant Level (Level 6):**
- **Self-Service Portal:** Access to customer portal for self-service functionality
- **Request Tracking:** Track their own requests, tickets, and service history
- **Profile Management:** Manage their own profile and company information
- **Communication:** Communicate with tenant's team through CRM interface
- **Document Access:** Access shared documents and resources
- **Service History:** View service history and transaction records
- **Basic Analytics:** Limited access to basic reporting and analytics
- **Feedback Management:** Submit feedback and ratings
- **No Administrative Access:** No access to user management or system settings
- **Read-Primary Access:** Primarily read-only with limited interactive capabilities
- **Tenant Restriction:** **ONLY access to their own data and records**
- **Role Customization:** Minimal customization as per tenant business requirements
- **Strict tenant isolation** - extremely restricted access scope

### 2.3 Role Customization and System Roles

**System Roles vs Custom Roles:**
- **System Roles:** Fixed roles (super_admin, admin, manager, engineer, agent, customer) that cannot be deleted or renamed
- **Custom Roles:** Administrator can create custom roles with specific feature access as per business needs
- **Permission Inheritance:** Custom roles inherit from system roles and can be customized further
- **Role Assignment:** Administrator assigns roles and can adjust access permissions based on business requirements

**Role Hierarchy and Access Levels:**
1. **Level 1 (Super Admin):** Platform-level access across all tenants
2. **Level 2 (Administrator):** Full tenant-level CRM operations, no tenant management
3. **Level 3 (Manager):** Department management with restricted financial access
4. **Level 4 (Engineer):** Technical operations with business access as needed
5. **Level 5 (User):** Standard CRM operations with operational focus
6. **Level 6 (Customer):** Self-service portal with restricted data access

**Business Needs Customization:**
- Administrator has full authority to adjust role permissions within tenant boundaries
- Role customization respects system role constraints and security boundaries
- Financial access is strictly controlled and only available to Administrator level
- Custom roles can be created to accommodate specific business workflows
- All role changes must maintain tenant isolation and security policies

### 2.3 Permission System

**Database-Driven Permission Structure:**
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

**Permission Categories:**

**1. Core Permissions (Basic Operations):**
- `read` - View and read data (global access)
- `write` - Create and edit data (global access)
- `delete` - Delete data (global access)

**2. Module Permissions (Feature-Specific):**
- `manage_customers` - Full customer management
- `manage_sales` - Sales process management
- `manage_tickets` - Support ticket management
- `manage_products` - Product catalog management
- `manage_contracts` - Contract lifecycle management
- `manage_service_contracts` - Service contract management
- `manage_complaints` - Complaint handling
- `manage_product_sales` - Product sales operations
- `manage_job_works` - Job work operations

**3. Administrative Permissions (User Management):**
- `manage_users` - User account management
- `manage_roles` - Role and permission management
- `view_analytics` - Analytics and reporting access
- `manage_settings` - System configuration
- `view_audit_logs` - Audit log access

**4. System Permissions (Platform-Level):**
- `super_admin` - Platform administrator (super_admin role only)
- `manage_tenants` - Tenant management (super_admin only)
- `view_all_tenants` - Cross-tenant visibility (super_admin only)

### 2.4 Permission Implementation Details

**Fallback Permission System (When Database Permissions Unavailable):**
```typescript
const basicRolePermissions: Record<string, string[]> = {
  'super_admin': ['*'], // Super admin has all permissions
  'admin': [
    'read', 'write', 'delete',
    'manage_users', 'manage_roles', 'manage_customers', 'manage_sales',
    'manage_tickets', 'manage_contracts', 'manage_products', 
    'manage_service_contracts', 'manage_complaints', 'manage_product_sales',
    'manage_job_works', 'view_dashboard', 'view_audit_logs'
  ],
  'manager': [
    'read', 'write', 'manage_customers', 'manage_sales', 'manage_tickets',
    'manage_contracts', 'manage_products', 'manage_service_contracts',
    'manage_complaints', 'manage_product_sales', 'manage_job_works',
    'view_dashboard', 'view_audit_logs'
  ],
  'agent': [
    'read', 'write', 'manage_customers', 'manage_sales', 'manage_tickets',
    'manage_complaints', 'view_dashboard'
  ],
  'engineer': [
    'read', 'write', 'manage_products', 'manage_tickets', 
    'manage_job_works', 'view_dashboard'
  ],
  'customer': [
    'read', 'view_dashboard'
  ]
};
```

**Action-to-Permission Mapping:**
```typescript
private mapActionToPermission(action: string): string | null {
  const parts = action.split(':');
  if (parts.length < 2) return null;
  
  const resource = parts[0];
  const operation = parts[1];
  
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

### 2.5 Module Access Control

**Super Admin Modules (Platform-level only):**
```typescript
const SUPER_ADMIN_ONLY_MODULES = [
  'super-admin', 
  'system-admin', 
  'admin-panel',
  'tenant-management',
  'audit-logs'
];
```

**Tenant Modules (RBAC-controlled):**
```typescript
const TENANT_MODULES = [
  'customers', 'sales', 'contracts', 'service-contracts',
  'products', 'product-sales', 'tickets', 'complaints',
  'jobworks', 'notifications', 'reports', 'settings',
  'masters', 'dashboard', 'user-management', 'configuration'
];
```

**Access Control Logic:**
```typescript
if (user.isSuperAdmin) {
  return isSuperAdminModule(moduleName);
}

if (isTenantModule(moduleName)) {
  return authService.hasPermission(`manage_${moduleName}`);
}
```

### 2.6 Tenant Isolation Rules

- **Regular users:** Must have matching `tenant_id` for data access
- **Super admins:** Bypass tenant restrictions (`tenantId=null`)
- **RLS policies:** Enforce tenant isolation at database level
- **Cross-tenant access:** Attempts are logged and blocked
- **Tenant validation:** Security checks prevent tenant ID tampering

**⚠️ CRITICAL: Role and Permission Isolation for Tenant Admins**

**Tenant admins (Administrator role) must NOT see or access:**
1. **Super Admin Role**: The `super_admin` role should never appear in role dropdowns or role management for tenant admins
2. **Platform-Level Permissions**: Permissions with `category='system'` or `is_system_permission=true` should be hidden from tenant admins
   - Examples: `super_admin`, `platform_admin`, `tenants:manage`, `system_monitoring`
3. **Other Tenants' Roles**: Tenant admins can only see roles for their own tenant (`tenant_id` must match)

**Implementation Requirements:**
- ⚠️ **USE SYSTEMATIC UTILITIES**: All tenant isolation logic must use `src/utils/tenantIsolation.ts` utilities, NOT hardcoded checks
- `userService.getRoles()` must fetch roles from `rbacService.getRoles()` (which applies systematic tenant isolation)
- `rbacService.getRoles()` must use `filterRolesByTenant()` utility to filter roles
- `rbacService.getPermissions()` must use `filterPermissionsByTenant()` utility to filter permissions
- `rbacService.createRole()` and `updateRole()` must use `canModifyRole()` utility for validation
- All role/permission access checks must use `isSuperAdmin()`, `canAccessRole()`, `canAccessPermission()` utilities

**Correct Implementation (Fully Dynamic Database-Driven Approach):**
```typescript
// ✅ CORRECT: Use fully dynamic database-driven utilities
import {
  isSuperAdmin,
  filterRolesByTenant,
  filterPermissionsByTenant,
  canModifyRole,
  canAccessRole,
} from '@/utils/tenantIsolation';
import {
  getValidUserRoles,
  isValidUserRole,
  mapUserRoleToDatabaseRole,
  isPlatformRoleByName,
} from '@/utils/roleMapping';

// ✅ CORRECT: Get valid roles from database (fully dynamic)
async getRoles(): Promise<UserRole[]> {
  // Fetches roles from database - no hardcoded values
  return await getValidUserRoles();
}

// ✅ CORRECT: Validate role using database check
async validateRole(role: string): Promise<void> {
  const isValid = await isValidUserRole(role);
  if (!isValid) {
    const validRoles = await getValidUserRoles();
    throw new Error(`Invalid role. Allowed: ${validRoles.join(', ')}`);
  }
}

// ✅ CORRECT: Map role using database lookup
async assignRole(userRole: UserRole): Promise<void> {
  // Looks up actual database role name - no hardcoded mapping
  const dbRoleName = await mapUserRoleToDatabaseRole(userRole);
  // Check if platform role using database flags
  const isPlatform = await isPlatformRoleByName(userRole);
  // ... rest of implementation
}

// ✅ CORRECT: Filter roles using database-driven utilities
async getRoles(tenantId?: string): Promise<Role[]> {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) return [];
  
  // Fetch all roles from database
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) return [];
  
  // Use systematic utility to filter based on tenant isolation rules
  return filterRolesByTenant(data || [], currentUser);
}
```

**❌ WRONG: Hardcoded values (DO NOT USE)**
```typescript
// ❌ WRONG: Hardcoded role array
const roles = ['admin', 'manager', 'user']; // Should fetch from database

// ❌ WRONG: Hardcoded role mapping
const roleMap = { 'admin': 'Administrator' }; // Should lookup from database

// ❌ WRONG: Hardcoded role name check
if (role.name === 'super_admin') return false; // Should use database flags

// ❌ WRONG: Hardcoded permission name check
if (['super_admin', 'platform_admin'].includes(perm.name)) return false; // Should use database flags
```

**Future-Proof Design:**
- ✅ All roles are fetched from database - adding new roles requires NO code changes
- ✅ All role mappings are derived from database - no hardcoded mappings
- ✅ Platform role detection uses database flags (`is_system_role`, `tenant_id`) - not hardcoded names
- ✅ Permission validation uses database flags (`category`, `is_system_permission`) - not hardcoded names
- ✅ Role cache (5 min TTL) ensures performance while staying dynamic
- ✅ Cache invalidation on role create/update/delete ensures consistency

**Why This Matters:**
- Prevents tenant admins from accidentally creating super admin users
- Maintains clear separation between platform-level and tenant-level operations
- Ensures tenant admins can only manage their own tenant's resources
- Prevents privilege escalation attacks

### 2.7 Permission Validation Flow

1. **Check synchronous permission cache** (for performance)
2. **Validate against user's role permissions** (database-driven)
3. **Apply tenant isolation rules** (RLS enforcement)
4. **Enforce role hierarchy restrictions** (role-based access)
5. **Log access attempts** for audit trail

### 2.8 Permission Checking Rules - CRITICAL

**⚠️ NEVER HARDCODE ROLE-BASED PERMISSIONS IN APPLICATION CODE**

**Rules:**
1. **Always use dynamic permissions from database**: Permissions are stored in `permissions` table, assigned to roles via `role_permissions`, and loaded into `user.permissions` array at login/session restore.
2. **Use `authService.hasPermission(permission)` for all checks**: This method checks `user.permissions` array dynamically loaded from database.
3. **NO hardcoded role checks**: Never check `if (user.role === 'admin')` or `if (user.role === 'super_admin')` to grant permissions. Only use role checks for UI display or logging purposes.
4. **NO hardcoded permission maps**: Never create static maps like `ROLE_PERMISSIONS: Record<UserRole, Permission[]>` in application code. These should only exist in database seed data.
5. **Fallback permissions are temporary**: Fallback permission systems should only be used when database is unavailable, and should log warnings when used.
6. **Permission format**: Use `{resource}:{action}` format (e.g., `users:update`, `users:manage`, `customers:read`).
7. **Super admin handling**: Super admins should have all permissions in database, not hardcoded bypasses. If super admin needs special handling, it should be via database permission `super_admin` or `platform_admin`, not code-level checks.

**Correct Implementation:**
```typescript
// ✅ CORRECT: Use dynamic permissions from database
const canEdit = authService.hasPermission('users:update') || 
                authService.hasPermission('users:manage');

// ❌ WRONG: Hardcoded role check
if (user.role === 'admin') return true;

// ❌ WRONG: Hardcoded permission map
const ROLE_PERMISSIONS = { 'admin': ['users:update', ...] };
```

**Database-Driven Permission Flow:**
1. User logs in → `authService.login()` fetches user from database
2. User's role is resolved → `user_roles` table links to `roles` table
3. Role permissions are fetched → `role_permissions` table links to `permissions` table
4. Permissions are attached to user → `user.permissions = ['users:manage', 'customers:read', ...]`
5. Permission checks use `user.permissions` → `authService.hasPermission()` checks this array

**Why This Matters:**
- Permissions can be changed in database without code changes
- Administrators can customize role permissions per tenant
- No code deployment needed for permission updates
- Consistent permission checking across all modules
- Single source of truth (database) for all permissions

### 2.9 Permission Hook Property Name Consistency - CRITICAL

**⚠️ ISSUE: Permission Checks Failing Despite Correct Permissions**

**Problem:**
Permission checks appear to fail even when:
- Permissions are correctly loaded from database (`user.permissions` array is populated)
- Permission guard functions return `canEdit: true`
- `authService.hasPermission()` correctly returns `true`

**Root Cause:**
Component code uses different property names than what the permission hook returns, causing `undefined` values and failed permission checks.

**Example of the Issue:**
```typescript
// ❌ PROBLEM: Component expects canEditUsers but hook returns canEdit
const { canEditUsers } = usePermissions(); // canEditUsers is undefined!
// Result: hasPermission = false even though canEdit = true

// ✅ SOLUTION: Hook must provide both property names
const { canEdit, canEditUsers } = usePermissions(); // Both available
```

**Resolution:**
Permission hooks must provide backward compatibility aliases for all permission properties:

```typescript
// ✅ CORRECT: Provide both standard and module-specific property names
export function usePermissions(): UsePermissionsReturn {
  const permissionGuard = getPermissionGuard(userRole);
  
  return {
    ...permissionGuard, // Includes: canCreate, canEdit, canDelete, etc.
    // Backward compatibility aliases
    canCreateUsers: permissionGuard.canCreate,
    canEditUsers: permissionGuard.canEdit,
    canDeleteUsers: permissionGuard.canDelete,
    canResetPasswords: permissionGuard.canResetPassword,
  };
}
```

**Best Practices to Avoid This Issue:**

1. **Standardize Property Names**: Use consistent naming across all modules:
   - Standard: `canCreate`, `canEdit`, `canDelete`, `canViewList`
   - Module aliases: `canCreateUsers`, `canEditUsers`, `canDeleteUsers` (for user management)

2. **Always Provide Aliases**: When creating permission hooks, provide both:
   - Standard property names (`canEdit`)
   - Module-specific aliases (`canEditUsers`, `canEditCustomers`, etc.)

3. **Reactive to Permission Changes**: Permission hooks must recompute when permissions are loaded:
   ```typescript
   const userPermissions = currentUser?.permissions || [];
   const permissionGuard = useMemo(() => {
     return getPermissionGuard(userRole);
   }, [userRole, userPermissions]); // ⚠️ Include userPermissions in dependencies
   ```

4. **Wait for Permissions to Load**: Components should handle loading state:
   ```typescript
   const { canEditUsers, isLoading } = usePermissions();
   const permissionsLoaded = !!(currentUser?.permissions?.length > 0);
   
   // Don't show "Permission Denied" until permissions are loaded
   const hasPermission = useMemo(() => {
     if (!permissionsLoaded && isLoading) {
       return true; // Optimistically allow until permissions load
     }
     return canEditUsers;
   }, [canEditUsers, permissionsLoaded, isLoading]);
   ```

5. **Debug Logging**: Add comprehensive logging to permission hooks:
   ```typescript
   console.log('[usePermissions] Returning permission result:', {
     canEdit: res.canEdit,
     canEditUsers: res.canEditUsers,
     userPermissions: currentUser?.permissions
   });
   ```

**Checklist for New Modules:**
- [ ] Permission hook provides both standard and module-specific property names
- [ ] Hook dependencies include `userPermissions` to react to permission loading
- [ ] Components handle loading state before showing "Permission Denied"
- [ ] Debug logging added to permission hooks for troubleshooting
- [ ] Property names are consistent with existing modules

**Common Mistakes to Avoid:**
- ❌ Using `canEditUsers` when hook only returns `canEdit`
- ❌ Not including `userPermissions` in `useMemo` dependencies
- ❌ Showing "Permission Denied" before permissions are loaded
- ❌ Hardcoding permission checks instead of using hooks
- ❌ Not providing backward compatibility aliases

---

## 3. Service Layer Architecture

### 3.1 Service Factory Pattern

The **Service Factory** implements a **dual-mode backend system** with **24 core services** that dynamically switch between Mock (development/testing) and Supabase (production) implementations.

**Service Registry (24 Services):**

| Service Key | Description | Mock Implementation | Supabase Implementation |
|-------------|-------------|-------------------|----------------------|
| `auth` | Authentication & session management | ✅ | ✅ |
| `servicecontract` | Service contract lifecycle | ✅ | ✅ |
| `productsale` | Product sales operations | ✅ | ✅ |
| `sales` | Sales & deal management | ✅ | ✅ |
| `customer` | Customer management | ✅ | ✅ |
| `jobwork` | Job work operations | ✅ | ✅ |
| `product` | Product catalog & inventory | ✅ | ✅ |
| `company` | Company/organization management | ✅ | ✅ |
| `user` | User management | ✅ | ✅ |
| `rbac` | Role-based access control | ✅ | ✅ |
| `uinotification` | Client-side UI notifications | ✅ (Special) | N/A |
| `notification` | Backend notifications | ✅ | ✅ |
| `tenant` | Tenant management + metrics + directory | ✅ | ✅ |
| `multitenant` | Tenant context (infrastructure-level) | N/A | ✅ (Special) |
| `ticket` | Ticket/issue tracking | ✅ | ✅ |
| `superadminmanagement` | Super admin lifecycle | ✅ | ✅ |
| `superadmin` | Super admin dashboard | ✅ | ⚠️ (TODO) |
| `contract` | Contract module | ✅ | ✅ |
| `rolerequest` | Role elevation requests | ✅ | ✅ |
| `audit` | Audit logs, compliance, metrics, retention | ✅ | ✅ |
| `compliancenotification` | Compliance alerts | ✅ | ✅ |
| `impersonation` | Impersonation session management | ✅ (Special) | ✅ (Special) |
| `ratelimit` | Rate limiting & session controls | ✅ | ✅ |
| `referencedata` | Reference data & dropdowns | ✅ | ✅ |

### 3.2 Proxy Pattern Implementation

**Before (900+ lines of boilerplate):**
```typescript
export const authService = {
  get instance() { return serviceFactory.getAuthService(); },
  login: (...args) => serviceFactory.getAuthService().login(...args),
  logout: (...args) => serviceFactory.getAuthService().logout(...args),
  // ... 50+ more method wrappers
};
```

**After (1 line via proxy):**
```typescript
export const authService = createServiceProxy('auth');
```

**Proxy Factory Function:**
```typescript
function createServiceProxy(serviceRegistryKey: string): any {
  return new Proxy(
    { get instance() { return serviceFactory.getService(serviceRegistryKey); } },
    {
      get(target, prop) {
        if (prop === 'instance') return target.instance;

        const service = serviceFactory.getService(serviceRegistryKey);
        if (!service || !(prop in service)) {
          console.warn(`Property "${String(prop)}" not found on ${serviceRegistryKey}`);
          return undefined;
        }

        const value = service[prop];
        return typeof value === 'function' ? value.bind(service) : value;
      },
    }
  );
}
```

### 3.3 Service Resolution Flow

1. **Environment Configuration:** `VITE_API_MODE` determines backend mode
2. **Proxy Trap Triggered** → `get(target, 'methodName')`
3. **Service Resolution** → `serviceFactory.getService('serviceKey')`
4. **Mode-Based Routing:**
   ```
   if (apiMode === 'supabase') → return entry.supabase
   if (apiMode === 'mock') → return entry.mock
   if (apiMode === 'real') → return entry.supabase (fallback)
   ```
5. **Method Binding** → `value.bind(service)` to preserve context
6. **Execution** → Original function invoked with correct `this` context

### 3.4 Special Services

Some services use custom routing logic:

**Impersonation Service:**
```typescript
impersonation: {
  special: () => {
    if (this.apiMode === 'supabase') return supabaseImpersonationService;
    return { 
      getImpersonationLogs: async () => [],
      getActiveImpersonations: async () => [] 
    };
  }
}
```

**UI Notification Service:**
```typescript
uinotification: {
  special: () => mockUINotificationService,  // Always mock (client-only)
}
```

**Multi-tenant Service:**
```typescript
multitenant: {
  special: () => supabaseMultiTenantService,  // Always supabase (infrastructure)
}
```

### 3.5 Backward Compatibility Aliases

For maintaining compatibility with existing code:
```typescript
export const auditDashboardService = auditService;
export const auditRetentionService = auditService;
export const auditComplianceReportService = auditService;
export const tenantMetricsService = tenantService;
export const tenantDirectoryService = tenantService;
export const impersonationRateLimitService = rateLimitService;
```

---

## 4. Application Modules

### 4.1 Module Registration Pattern

All modules are registered in `src/modules/bootstrap.ts` following a consistent pattern:

```typescript
export async function registerFeatureModules(): Promise<void> {
  // Customer module
  const { customerModule } = await import('./features/customers');
  registerModule(customerModule);

  // Sales module
  const { salesModule } = await import('./features/sales');
  registerModule(salesModule);

  // ... continuing for all modules
}
```

### 4.2 Registered Modules (16 Total)

**Core Business Modules:**

1. **Customer Module** (`customers`)
   - Customer management and profiles
   - Customer interaction tracking
   - Customer analytics and reporting

2. **Sales Module** (`sales`)
   - Lead and opportunity management
   - Sales pipeline tracking
   - Deal lifecycle management

3. **Ticket Module** (`tickets`)
   - Support ticket creation and tracking
   - Ticket assignment and escalation
   - Resolution workflow management

4. **Product Sales Module** (`product-sales`)
   - Product catalog management
   - Sales order processing
   - Inventory tracking

5. **Contracts Module** (`contracts`)
   - Contract creation and management
   - Contract lifecycle tracking
   - Renewal and expiration management

6. **Service Contracts Module** (`service-contracts`)
   - Service agreement management
   - SLA tracking and compliance
   - Service delivery monitoring

7. **Job Works Module** (`jobworks`)
   - Work order management
   - Job tracking and completion
   - Resource allocation

8. **Complaints Module** (`complaints`)
   - Complaint registration and tracking
   - Resolution workflow
   - Customer feedback management

**Administrative Modules:**

9. **User Management Module** (`user-management`)
   - User account lifecycle management
   - Role assignment and permissions
   - User activity monitoring

10. **Masters Module** (`masters`)
    - Reference data management
    - System configuration
    - Master data maintenance

11. **Configuration Module** (`configuration`)
    - System settings management
    - Feature toggles
    - Environment configuration

12. **Audit Logs Module** (`audit-logs`)
    - System audit trail
    - Compliance reporting
    - Security event tracking

**Platform Modules:**

13. **Super Admin Module** (`super-admin`)
    - Platform administration
    - Cross-tenant management
    - System monitoring

14. **Notifications Module** (`notifications`)
    - Notification management
    - Alert configuration
    - Communication tracking

**Dashboard & Analytics:**

15. **Dashboard Module** (`dashboard`)
    - Analytics and reporting
    - KPI visualization
    - Performance metrics

### 4.3 Module Structure Standard

Each module follows a consistent structure:
```
src/modules/features/[module-name]/
├── index.ts                 # Module registration
├── routes.tsx              # Route definitions
├── components/             # React components
│   ├── views/             # Page components
│   ├── forms/             # Form components
│   └── shared/            # Shared components
├── services/              # Module-specific services
├── hooks/                 # Custom React hooks
├── types/                 # Module type definitions
└── utils/                 # Utility functions
```

---

## 5. Layer Sync Rules

### 5.1 Service Layer Synchronization

**Rule 1: Service Interface Consistency**
- All services must implement the same interface across mock and supabase implementations
- Method signatures must be identical
- Return types must be consistent
- Error handling patterns must match

**Rule 2: React Query Integration**
- All data fetching must use React Query hooks
- Consistent query keys for cache management
- Loading/error/data states in all hooks
- Cache invalidation on mutations

**Rule 3: Type Safety**
- DTOs (Data Transfer Objects) must match database schema exactly
- TypeScript types imported from centralized location
- No `any` types in public APIs
- Strict type checking enabled

### 5.2 Permission Layer Synchronization

**Rule 4: RBAC Consistency**
- Database permissions must match TypeScript permission checks
- Role mappings must be consistent across all layers
- Permission validation must follow the same flow in all services
- Tenant isolation must be enforced consistently

**Rule 5: Module Access Control**
- Module registration must respect role-based access
- Super admin modules must be restricted to super_admin role
- Tenant modules must enforce tenant isolation
- Permission checks must be centralized

### 5.3 Data Layer Synchronization

**Rule 6: Database Schema Alignment**
- TypeScript interfaces must reflect database schema exactly
- Field names must use consistent naming (camelCase vs snake_case)
- Foreign key relationships must be maintained in types
- Default values must be reflected in interfaces

**Rule 7: RLS Policy Consistency**
- All database queries must respect tenant isolation
- RLS policies must match application-level access control
- Cross-tenant access attempts must be logged
- Security validations must be consistent across layers

---

## 6. Database Schema

### 6.1 Core Tables

**Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  tenant_id UUID REFERENCES tenants(id),
  status VARCHAR(50) DEFAULT 'active',
  avatar_url TEXT,
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

**Roles Table:**
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  tenant_id UUID REFERENCES tenants(id),
  permissions TEXT[] DEFAULT '{}',
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**User Roles Table:**
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  role_id UUID REFERENCES roles(id),
  tenant_id UUID REFERENCES tenants(id),
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

**Permissions Table:**
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Audit Logs Table:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  tenant_id UUID REFERENCES tenants(id),
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### 6.2 RLS Policies

**Users RLS Policy:**
```sql
-- Super admins can see all users
CREATE POLICY "Super admins can see all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- Regular users can only see users from their tenant
CREATE POLICY "Users can see their tenant users" ON users
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );
```

**Audit Logs RLS Policy:**
```sql
-- Super admins can see all audit logs
CREATE POLICY "Super admins can see all audit logs" ON audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- Regular users can only see their tenant's audit logs
CREATE POLICY "Users can see their tenant audit logs" ON audit_logs
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );
```

---

## 7. Implementation Guidelines

### 7.1 New Service Implementation

**Step 1: Define Interface**
```typescript
// src/services/[service]/types.ts
export interface I[ServiceName]Service {
  getData(): Promise<DataType[]>;
  createData(data: CreateDataType): Promise<DataType>;
  updateData(id: string, data: UpdateDataType): Promise<DataType>;
  deleteData(id: string): Promise<void>;
}
```

**Step 2: Implement Mock Service**
```typescript
// src/services/[service]/[serviceName]Service.ts
import { I[ServiceName]Service } from './types';

export const mock[ServiceName]Service: I[ServiceName]Service = {
  async getData() {
    return mockData;
  },
  // ... other methods
};
```

**Step 3: Implement Supabase Service**
```typescript
// src/services/[service]/supabase/[serviceName]Service.ts
import { supabase } from '@/lib/supabase';
import { I[ServiceName]Service } from './types';

export const supabase[ServiceName]Service: I[ServiceName]Service = {
  async getData() {
    const { data, error } = await supabase
      .from('[table_name]')
      .select('*');
    
    if (error) throw error;
    return data;
  },
  // ... other methods
};
```

**Step 4: Register in Service Factory**
```typescript
// src/services/serviceFactory.ts
import { supabase[ServiceName]Service } from './[service]/supabase/[serviceName]Service';
import { mock[ServiceName]Service } from './[service]/[serviceName]Service';

const serviceRegistry = {
  [serviceName]: {
    mock: mock[ServiceName]Service,
    supabase: supabase[ServiceName]Service,
    description: '[Service description]'
  }
};
```

**Step 5: Export Service Proxy**
```typescript
export const [serviceName]Service = createServiceProxy('[serviceName]');
```

### 7.2 New Module Implementation

**Step 1: Create Module Structure**
```bash
mkdir -p src/modules/features/[module-name]/{components/{views,forms,shared},services,hooks,types,utils}
```

**Step 2: Define Module Interface**
```typescript
// src/modules/features/[module-name]/types.ts
import { FeatureModule } from '@/modules/core/types';

export const [moduleName]Module: FeatureModule = {
  name: '[module-name]',
  routes: [],
  services: ['[service-name]'],
  components: {},
  dependencies: ['core', 'shared'],
  async initialize() {
    console.log('[Module] initialized');
  },
};
```

**Step 3: Register Routes**
```typescript
// src/modules/features/[module-name]/routes.tsx
import { lazy } from 'react';

export const [ModuleName]Page = lazy(() => import('./components/views/[ModuleName]Page'));

// Add to module routes array
```

**Step 4: Register in Bootstrap**
```typescript
// src/modules/bootstrap.ts
const { [moduleName]Module } = await import('./features/[module-name]');
registerModule([moduleName]Module);
```

### 7.3 Permission Implementation

**Step 1: Add Permission to Database**
```sql
INSERT INTO permissions (name, description, category, resource, action)
VALUES ('manage_[resource]', '[Description]', 'module', '[resource]', 'manage');
```

**Step 2: Add to Role Permissions**
```sql
UPDATE roles 
SET permissions = array_append(permissions, 'manage_[resource]')
WHERE name IN ('admin', 'manager');
```

**Step 3: Update TypeScript Types**
```typescript
// src/types/rbac.ts
export interface Permission {
  // ... existing fields
  // add new permission
}
```

**Step 4: Update Fallback Permissions**
```typescript
// src/services/auth/supabase/authService.ts
const basicRolePermissions = {
  // ... update relevant roles
  '[role]': [
    // ... existing permissions
    'manage_[resource]'
  ]
};
```

**Step 5: Use in Components**
```typescript
// In React components
if (!authService.hasPermission('manage_[resource]')) {
  return <AccessDenied />;
}
```

---

## 8. Development Standards

### 8.1 Code Quality Rules

**TypeScript Standards:**
- Use strict mode
- No `any` types in public APIs
- Use interfaces for all data structures
- Prefer const over let
- Use arrow functions for functional components

**React Standards:**
- Use functional components with hooks
- Use React Query for data fetching
- Implement proper error boundaries
- Use TypeScript for prop types
- Follow React best practices

**Service Standards:**
- Implement consistent error handling
- Use async/await patterns
- Return proper types from all methods
- Log operations appropriately
- Follow the service factory pattern

### 8.2 Security Standards

**Authentication & Authorization:**
- Always validate user permissions
- Implement tenant isolation
- Use RLS policies for data security
- Log security events
- Follow principle of least privilege

**Data Validation:**
- Validate all inputs
- Use parameterized queries
- Sanitize user inputs
- Implement rate limiting
- Use HTTPS in production

**Audit Requirements:**
- Log all user actions
- Track permission changes
- Monitor failed access attempts
- Implement audit log retention
- Provide audit trail export

### 8.3 Performance Standards

**Service Performance:**
- Implement caching where appropriate
- Use React Query for client-side caching
- Optimize database queries
- Implement pagination for large datasets
- Use lazy loading for modules

**UI Performance:**
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Optimize bundle size
- Use code splitting
- Implement proper loading states

---

## 9. Rules for Future Implementation

### 9.1 Adding New Features

**Rule 1: Service First**
- Always create a service layer before UI
- Implement both mock and supabase versions
- Follow the service factory pattern
- Add appropriate TypeScript interfaces

**Rule 2: Permission Planning**
- Design permissions during feature planning
- Update RBAC system before UI implementation
- Test permission enforcement
- Document permission requirements

**Rule 3: Module Registration**
- Register all new modules in bootstrap.ts
- Follow the established module structure
- Implement proper lazy loading
- Add route definitions

### 9.2 Modifying Existing Features

**Rule 4: Backward Compatibility**
- Maintain existing API signatures
- Use deprecation warnings for breaking changes
- Provide migration paths
- Update documentation

**Rule 5: Testing Requirements**
- Test all permission scenarios
- Verify tenant isolation
- Test both mock and supabase modes
- Validate audit logging

### 9.3 Database Changes

**Rule 6: Migration Planning**
- Always create database migrations
- Plan for data compatibility
- Update TypeScript interfaces
- Test RLS policies

**Rule 7: Schema Evolution**
- Use UUIDs for new primary keys
- Implement proper foreign key constraints
- Add appropriate indexes
- Plan for audit trail updates

### 9.4 Security Updates

**Rule 8: Permission Reviews**
- Regular security audits
- Review role assignments
- Validate RLS policies
- Monitor access patterns

**Rule 9: Compliance Requirements**
- Maintain audit logs
- Implement data retention policies
- Provide compliance reporting
- Regular security assessments

### 9.5 Performance Optimization

**Rule 10: Continuous Improvement**
- Monitor service performance
- Optimize database queries
- Review cache strategies
- Implement performance metrics

**Rule 11: Scalability Planning**
- Design for multi-tenant scale
- Plan for increased user loads
- Consider data partitioning
- Implement proper monitoring

---

## 10. Change Management

### 10.1 Implementation Checklist

**Before Implementing Changes:**
- [ ] Review current architecture
- [ ] Check existing permissions
- [ ] Verify tenant isolation
- [ ] Plan migration strategy
- [ ] Update documentation

**During Implementation:**
- [ ] Follow established patterns
- [ ] Maintain TypeScript safety
- [ ] Test permission scenarios
- [ ] Validate RLS policies
- [ ] Monitor performance

**After Implementation:**
- [ ] Update documentation
- [ ] Verify all tests pass
- [ ] Check audit logging
- [ ] Review security impact
- [ ] Update deployment guides

### 10.2 Review Criteria

**Architecture Review:**
- [ ] Follows service factory pattern
- [ ] Implements proper RBAC
- [ ] Maintains tenant isolation
- [ ] Uses consistent patterns

**Security Review:**
- [ ] Permission validation
- [ ] Tenant isolation enforcement
- [ ] Audit trail completeness
- [ ] RLS policy compliance

**Performance Review:**
- [ ] Service efficiency
- [ ] Database optimization
- [ ] Caching implementation
- [ ] Memory usage patterns

---

## 11. Emergency Procedures

### 11.1 Security Incidents

**Immediate Response:**
1. Isolate affected systems
2. Audit recent changes
3. Review access logs
4. Implement temporary restrictions
5. Notify stakeholders

**Investigation Steps:**
1. Review audit logs
2. Check permission changes
3. Validate RLS policies
4. Examine user access patterns
5. Identify breach vector

### 11.2 System Failures

**Service Failures:**
1. Check service health
2. Review error logs
3. Validate database connections
4. Test fallback mechanisms
5. Implement workarounds

**Database Issues:**
1. Check RLS policies
2. Validate tenant isolation
3. Review recent migrations
4. Test data consistency
5. Implement recovery procedures

---

## 12. Conclusion

This documentation serves as the **ruleset for future implementation** and **criteria for making any changes** to ensure all layers remain in sync and consistent with the current code structure and implemented design.

**Key Principles:**
1. **Consistency:** All implementations must follow established patterns
2. **Security:** Permission validation and tenant isolation are mandatory
3. **Performance:** Optimize for both user experience and system efficiency
4. **Maintainability:** Code must be well-documented and follow standards
5. **Scalability:** Design for growth and multi-tenant architecture

**References:**
- **Service Factory:** `src/services/serviceFactory.ts`
- **Authentication Service:** `src/services/auth/supabase/authService.ts`
- **RBAC Service:** `src/services/rbac/supabase/rbacService.ts`
- **Bootstrap Module:** `src/modules/bootstrap.ts`
- **RBAC Types:** `src/types/rbac.ts`
- **Architecture Guide:** `ARCHITECTURE.md`

---

**Document Owner:** Development Team  
**Review Cycle:** Monthly  
**Last Reviewed:** November 16, 2025  
**Next Review:** December 16, 2025
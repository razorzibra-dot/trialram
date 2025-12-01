# RBAC Database Structure and Seeded Data Implementation

## 1. Database Schema Overview

The RBAC (Role-Based Access Control) system is implemented across multiple database tables with row-level security (RLS) policies and multi-tenant support. The system combines tenant-scoped user roles with platform-wide super user management.

---

## 2. Core RBAC Tables

### 2.1 Users Table

**Purpose**: Stores all users (tenant-scoped and platform super admins)

**Schema**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role user_role NOT NULL DEFAULT 'agent',
  status user_status NOT NULL DEFAULT 'active',
  
  -- Tenant relationship (nullable for super admins)
  tenant_id UUID NULLABLE REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Additional information
  avatar_url VARCHAR(500),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  company_name VARCHAR(255),
  department VARCHAR(100),
  position VARCHAR(100),
  
  -- Super admin flag (added in migration 20250212)
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Unique constraint per tenant
  CONSTRAINT unique_email_per_tenant UNIQUE(email, tenant_id),
  
  -- Tenant requirement for non-super users
  CONSTRAINT ck_tenant_id_for_regular_users 
    CHECK (is_super_admin = true OR tenant_id IS NOT NULL),
  
  -- Role consistency enforcement (migration 20250216)
  CONSTRAINT ck_super_admin_role_consistency
    CHECK (
      (is_super_admin = true AND role = 'super_admin' AND tenant_id IS NULL) OR
      (is_super_admin = false AND role IN ('admin', 'manager', 'agent', 'engineer', 'customer') AND tenant_id IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_is_super_admin ON users(is_super_admin) WHERE is_super_admin = true;
CREATE INDEX idx_users_super_admin_status ON users(is_super_admin, status);
CREATE UNIQUE INDEX idx_unique_email_per_tenant ON users(email, tenant_id) WHERE is_super_admin = false AND tenant_id IS NOT NULL;
CREATE UNIQUE INDEX idx_unique_super_admin_email ON users(email) WHERE is_super_admin = true;
```

**Key Characteristics**:
- Regular users: `is_super_admin=FALSE`, `tenant_id=NOT NULL`, `role IN (admin/manager/agent/engineer/customer)`
- Super admins: `is_super_admin=TRUE`, `tenant_id=NULL`, `role=super_admin`
- Email unique per tenant for regular users, globally unique for super admins
- Tenant-independent super admins for platform-wide management

---

### 2.2 Permissions Table

**Purpose**: Defines system-wide permissions (global, not tenant-specific)

**Schema**:
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  resource VARCHAR(100),
  action VARCHAR(100),
  category VARCHAR(50) DEFAULT 'general',
  is_system_permission BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permissions_category ON permissions(category);
```

**Current Permissions (31 total)**: System-wide permissions organized by resource
- **Dashboard**: view_dashboard (1)
- **Customers**: view_customers, create_customers, edit_customers, delete_customers, crm:customer:record:update (5)
- **Sales**: view_sales, create_sales, edit_sales, crm:sales:deal:update (4)
- **Tickets**: view_tickets, create_tickets, edit_tickets, manage_tickets (4)
- **Contracts**: view_contracts, create_contracts, edit_contracts, manage_contracts (4)
- **Service Contracts**: view_service_contracts, crm:contract:service:update (2)
- **Products**: view_products, manage_products (2)
- **Product Sales**: view_product_sales, crm:product-sale:record:update (2)
- **Complaints**: view_complaints, crm:support:complaint:update (2)
- **Job Works**: view_job_works, manage_job_works (2)
- **Administrative**: crm:user:record:update, crm:role:record:update, view_reports, export_data, crm:system:config:manage, manage_companies (6)

---

### 2.3 Roles Table

**Purpose**: Defines tenant-specific roles with permissions

**Schema**:
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_system_role BOOLEAN DEFAULT FALSE,
  permissions JSONB DEFAULT '[]'::JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  CONSTRAINT unique_role_per_tenant UNIQUE(name, tenant_id)
);

CREATE INDEX idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX idx_roles_is_system_role ON roles(is_system_role);
```

**Current Seeded Roles**:

**Acme Corporation (550e8400-e29b-41d4-a716-446655440001)**
- Super Administrator: Full platform administration + all permissions
- Administrator: Full tenant permissions
- Manager: Business operations with analytics and management access (19 permissions)
- Agent: Customer service with basic operations (5 permissions)
- Engineer: Technical engineer with product and job work access (7 permissions)

**Tech Solutions Inc (550e8400-e29b-41d4-a716-446655440002)**
- Super Administrator: Full platform administration + all permissions
- Administrator: Full tenant permissions
- Manager: Business operations with analytics and management access (19 permissions)

**Global Trading Ltd (550e8400-e29b-41d4-a716-446655440003)**
- Super Administrator: Full platform administration + all permissions

---

### 2.4 Role Permissions Mapping Table

**Purpose**: Many-to-many relationship between roles and permissions

**Schema**:
```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  CONSTRAINT unique_role_permission UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
```

**Current Mappings**: 133+ total mappings
- Each Administrator role: ~24 permissions
- Each Manager role: ~19 permissions
- Agent role: ~9 permissions
- Engineer role: ~7 permissions

---

### 2.5 User Roles Assignment Table

**Purpose**: Many-to-many relationship between users and roles

**Schema**:
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  CONSTRAINT unique_user_role_per_tenant UNIQUE(user_id, role_id, tenant_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_tenant_id ON user_roles(tenant_id);
```

**Current Assignments** (7 assignments):
- admin@acme.com → Super Administrator (Acme)
- manager@acme.com → Manager (Acme)
- engineer@acme.com → Engineer (Acme)
- user@acme.com → Agent (Acme)
- admin@techsolutions.com → Administrator (Tech Solutions)
- manager@techsolutions.com → Manager (Tech Solutions)
- admin@globaltrading.com → Super Administrator (Global Trading)

---

### 2.6 Role Templates Table

**Purpose**: Pre-configured role templates for quick role creation

**Schema**:
```sql
CREATE TABLE role_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'custom',
  permissions JSONB DEFAULT '[]'::JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  tenant_id UUID NULLABLE REFERENCES tenants(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  CONSTRAINT unique_template_per_tenant UNIQUE(name, tenant_id)
);

CREATE INDEX idx_role_templates_tenant_id ON role_templates(tenant_id);
CREATE INDEX idx_role_templates_is_default ON role_templates(is_default);
CREATE INDEX idx_role_templates_category ON role_templates(category);
```

---

### 2.7 Audit Logs Table

**Purpose**: Activity audit trail for compliance and tracking

**Schema**:
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NULLABLE REFERENCES users(id) ON DELETE SET NULL,
  
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  
  changes JSONB,
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

---

## 3. Super User Module Tables

Added in migration 20250211 to support platform-wide administrator management.

### 3.1 Super User Tenant Access Table

**Purpose**: Track which tenants a super user can manage and their access level

**Schema**:
```sql
CREATE TABLE super_user_tenant_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    super_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    access_level access_level_enum NOT NULL DEFAULT 'limited',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uk_super_user_tenant_access_unique UNIQUE (super_user_id, tenant_id),
    CONSTRAINT ck_super_user_tenant_access_not_null
        CHECK (super_user_id IS NOT NULL AND tenant_id IS NOT NULL)
);

CREATE INDEX idx_super_user_tenant_access_super_user_id ON super_user_tenant_access(super_user_id);
CREATE INDEX idx_super_user_tenant_access_tenant_id ON super_user_tenant_access(tenant_id);
CREATE INDEX idx_super_user_tenant_access_composite ON super_user_tenant_access(super_user_id, tenant_id);
CREATE INDEX idx_super_user_tenant_access_access_level ON super_user_tenant_access(access_level);
```

**Access Levels** (Enum: access_level_enum):
- `full`: Complete access with all operations
- `limited`: Restricted access for specific operations
- `read_only`: Read-only access for auditing
- `specific_modules`: Access to specific modules only

**Current Seeded Data** (6 mappings):
- Super User 1: Full access to all 3 tenants
- Super User 2: Limited access to Acme + Tech Solutions
- Super User 3 (Auditor): Read-only access to all 3 tenants

---

### 3.2 Super User Impersonation Logs Table

**Purpose**: Audit trail for super user impersonation sessions

**Schema**:
```sql
CREATE TABLE super_user_impersonation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    super_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    impersonated_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    reason VARCHAR(500),
    login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    logout_at TIMESTAMP WITH TIME ZONE,
    actions_taken JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ck_super_user_impersonation_logs_login_before_logout
        CHECK (logout_at IS NULL OR logout_at > login_at)
);

CREATE INDEX idx_super_user_impersonation_logs_super_user_id ON super_user_impersonation_logs(super_user_id);
CREATE INDEX idx_super_user_impersonation_logs_impersonated_user_id ON super_user_impersonation_logs(impersonated_user_id);
CREATE INDEX idx_super_user_impersonation_logs_tenant_id ON super_user_impersonation_logs(tenant_id);
CREATE INDEX idx_super_user_impersonation_logs_login_at ON super_user_impersonation_logs(login_at DESC);
```

**Current Seeded Data** (5 audit logs):
- 3 completed impersonation sessions
- 1 active impersonation session (ongoing, logout_at=NULL)

---

### 3.3 Tenant Statistics Table

**Purpose**: Store aggregated metrics for tenant dashboard

**Schema**:
```sql
CREATE TABLE tenant_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    metric_type metric_type_enum NOT NULL,
    metric_value DECIMAL(15, 2),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ck_tenant_statistics_metric_value_non_negative
        CHECK (metric_value IS NULL OR metric_value >= 0)
);

CREATE INDEX idx_tenant_statistics_tenant_id ON tenant_statistics(tenant_id);
CREATE INDEX idx_tenant_statistics_metric_type ON tenant_statistics(metric_type);
CREATE INDEX idx_tenant_statistics_recorded_at ON tenant_statistics(recorded_at DESC);
```

**Metric Types** (Enum: metric_type_enum):
- `active_users`
- `total_contracts`
- `total_sales`
- `total_transactions`
- `disk_usage`
- `api_calls_daily`

**Current Seeded Data** (18 metrics):
- Acme: 6 metrics
- Tech Solutions: 6 metrics
- Global Trading: 6 metrics

---

### 3.4 Tenant Configuration Overrides Table

**Purpose**: Store configuration overrides for specific tenants

**Schema**:
```sql
CREATE TABLE tenant_config_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    config_key VARCHAR(255) NOT NULL,
    config_value JSONB NOT NULL,
    override_reason VARCHAR(500),
    created_by UUID NULLABLE REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uk_tenant_config_overrides_unique UNIQUE (tenant_id, config_key),
    CONSTRAINT ck_tenant_config_overrides_expires_after_created
        CHECK (expires_at IS NULL OR expires_at > created_at)
);

CREATE INDEX idx_tenant_config_overrides_tenant_id ON tenant_config_overrides(tenant_id);
CREATE INDEX idx_tenant_config_overrides_config_key ON tenant_config_overrides(config_key);
CREATE INDEX idx_tenant_config_overrides_expires_at ON tenant_config_overrides(expires_at DESC) WHERE expires_at IS NOT NULL;
```

---

## 4. Enums

### 4.1 User Role Enum (user_role)
```sql
CREATE TYPE user_role AS ENUM (
  'super_admin',      -- Platform administrator
  'admin',            -- Tenant administrator
  'manager',          -- Business manager
  'agent',            -- Customer service agent
  'engineer',         -- Technical engineer
  'customer'          -- External customer
);
```

### 4.2 User Status Enum (user_status)
```sql
CREATE TYPE user_status AS ENUM (
  'active',      -- Active user
  'inactive',    -- Inactive user
  'suspended'    -- Suspended user
);
```

### 4.3 Access Level Enum (access_level_enum)
```sql
CREATE TYPE access_level_enum AS ENUM (
    'full',               -- Full access
    'limited',            -- Limited access
    'read_only',          -- Read-only
    'specific_modules'    -- Specific modules only
);
```

### 4.4 Metric Type Enum (metric_type_enum)
```sql
CREATE TYPE metric_type_enum AS ENUM (
    'active_users',
    'total_contracts',
    'total_sales',
    'total_transactions',
    'disk_usage',
    'api_calls_daily'
);
```

---

## 5. Row Level Security (RLS) Policies

### 5.1 Permissions Table Policies

**READ Policy**: All authenticated users can view permissions (system-wide)
```sql
CREATE POLICY "users_view_all_permissions" ON permissions
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.deleted_at IS NULL));
```

**CREATE/UPDATE Policies**: Only admins and super_admin can create/update
```sql
CREATE POLICY "admins_create_permissions" ON permissions
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin') AND users.deleted_at IS NULL));
```

---

### 5.2 Roles Table Policies

**READ Policy**: Users can view roles in their tenant; super_admin can view all
```sql
CREATE POLICY "users_view_tenant_roles" ON roles
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() 
      AND users.role = 'super_admin' AND users.deleted_at IS NULL)
    OR tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid() AND users.deleted_at IS NULL LIMIT 1)
  );
```

**CREATE/UPDATE/DELETE Policies**: Tenant admins can manage (except system roles)
- Cannot delete system roles
- Cannot update system roles

---

### 5.3 User Roles Table Policies

**READ Policy**: Users can view their own assignments; admins view tenant assignments
```sql
CREATE POLICY "users_view_tenant_user_roles" ON user_roles
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
    OR user_id = auth.uid()
    OR tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid() LIMIT 1)
  );
```

**CREATE/DELETE Policies**: Tenant admins can assign/remove roles

---

### 5.4 Role Templates Table Policies

**READ Policy**: Users can view default templates and tenant-specific templates
```sql
CREATE POLICY "users_view_role_templates" ON role_templates
  FOR SELECT
  USING (
    is_default = TRUE
    OR tenant_id IS NULL
    OR tenant_id = (SELECT tenant_id FROM users WHERE users.id = auth.uid() LIMIT 1)
  );
```

**CREATE/UPDATE Policies**: Admins in their tenant
**DELETE Policy**: Only super_admin

---

### 5.5 Super User Module Policies

**Super User Tenant Access**:
- SELECT: Super users see their own records; admins see all
- INSERT/UPDATE/DELETE: Super users only

**Impersonation Logs**:
- SELECT: Super users see their own; admins see all
- INSERT: Only super users can create (when impersonating)
- UPDATE: Super users or admins

**Tenant Statistics**:
- SELECT: Admins see all; super users see their assigned tenants
- INSERT/UPDATE: Admins only

**Tenant Config Overrides**:
- SELECT: Admins see all; super users see their assigned tenants
- INSERT/UPDATE/DELETE: Admins only

---

## 6. Constraints and Data Integrity

### 6.1 Key Constraints

**Super Admin Role Consistency** (ck_super_admin_role_consistency)
```sql
CHECK (
  (is_super_admin = true AND role = 'super_admin' AND tenant_id IS NULL) OR
  (is_super_admin = false AND role IN ('admin', 'manager', 'agent', 'engineer', 'customer') AND tenant_id IS NOT NULL)
)
```

Enforces:
- Super admins: `role=super_admin` AND `is_super_admin=true` AND `tenant_id=NULL`
- Regular users: `role IN (admin/manager/agent/engineer/customer)` AND `is_super_admin=false` AND `tenant_id NOT NULL`

**Unique Constraints**:
- `unique_role_per_tenant`: Each role name unique per tenant
- `unique_email_per_tenant`: Regular user emails unique per tenant
- `unique_super_admin_email`: Super admin emails globally unique
- `unique_user_role_per_tenant`: Each user-role assignment unique per tenant
- `unique_role_permission`: Each role-permission mapping unique
- `uk_super_user_tenant_access_unique`: One access level per super user per tenant
- `uk_tenant_config_overrides_unique`: One config key per tenant

---

## 7. Seeded Test Data

### 7.1 Tenants (3)

| Name | Domain | Plan | Status |
|------|--------|------|--------|
| Acme Corporation | acme-corp.local | enterprise | active |
| Tech Solutions Inc | tech-solutions.local | premium | active |
| Global Trading Ltd | global-trading.local | enterprise | active |

### 7.2 Users (12)

**Acme Corporation** (4 regular users):
- admin@acme.com (role: admin, is_super_admin: false)
- manager@acme.com (role: manager, is_super_admin: false)
- engineer@acme.com (role: engineer, is_super_admin: false)
- user@acme.com (role: agent, is_super_admin: false)

**Tech Solutions Inc** (2 regular users):
- admin@techsolutions.com (role: admin, is_super_admin: false)
- manager@techsolutions.com (role: manager, is_super_admin: false)

**Global Trading Ltd** (1 regular user):
- admin@globaltrading.com (role: admin, is_super_admin: false)

**Platform Super Admins** (3 super users):
- superuser1@platform.admin (role: super_admin, is_super_admin: true, tenant_id: null)
- superuser2@platform.admin (role: super_admin, is_super_admin: true, tenant_id: null)
- superuser.auditor@platform.admin (role: super_admin, is_super_admin: true, tenant_id: null)

### 7.3 Permissions (31)

Organized by resource:
- Dashboard: 1 permission
- Customers: 5 permissions
- Sales: 4 permissions
- Tickets: 4 permissions
- Contracts: 4 permissions
- Service Contracts: 2 permissions
- Products: 2 permissions
- Product Sales: 2 permissions
- Complaints: 2 permissions
- Job Works: 2 permissions
- Administrative: 6 permissions

### 7.4 Roles (9)

**Acme Corporation** (5 roles):
- Super Administrator (24 permissions)
- Administrator (24 permissions)
- Manager (19 permissions)
- Agent (9 permissions)
- Engineer (7 permissions)

**Tech Solutions Inc** (3 roles):
- Super Administrator (24 permissions)
- Administrator (24 permissions)
- Manager (19 permissions)

**Global Trading Ltd** (1 role):
- Super Administrator (24 permissions)

### 7.5 User-Role Assignments (7)

- admin@acme.com → Super Administrator (Acme)
- manager@acme.com → Manager (Acme)
- engineer@acme.com → Engineer (Acme)
- user@acme.com → Agent (Acme)
- admin@techsolutions.com → Administrator (Tech Solutions)
- manager@techsolutions.com → Manager (Tech Solutions)
- admin@globaltrading.com → Super Administrator (Global Trading)

### 7.6 Super User Tenant Access (6)

**Super User 1**: Full access to Acme, Tech Solutions, Global Trading
**Super User 2**: Limited access to Acme, Tech Solutions
**Super User 3 (Auditor)**: Read-only access to Acme, Tech Solutions, Global Trading

### 7.7 Impersonation Logs (5)

- 3 completed sessions (with logout_at)
- 1 active session (logout_at=NULL)
- Includes: reason, actions_taken, ip_address, user_agent

### 7.8 Tenant Statistics (18)

Metrics per tenant: active_users, total_contracts, total_sales, total_transactions, disk_usage, api_calls_daily

### 7.9 Tenant Configuration Overrides

- Acme: max_users, api_rate_limit, feature_flags
- Tech Solutions: maintenance_mode, beta_features
- Global Trading: compliance_mode

---

## 8. Multi-Tenant Isolation

### 8.1 Isolation Strategy

**Data Segregation**:
- Each tenant's data is completely isolated using `tenant_id` field
- Regular users cannot query or modify data from other tenants
- RLS policies enforce tenant boundaries at database level

**Super User Access Control**:
- Super users have explicit `super_user_tenant_access` mappings
- Access levels (full, limited, read_only) control what they can do
- No implicit cross-tenant access

### 8.2 RLS Policy Flow

1. **Regular User Query**: Database checks `tenant_id` in RLS policy
   - User can only see data where `tenant_id = users.tenant_id`

2. **Super User Query**: Database checks `super_user_tenant_access` table
   - Super user can see data only for assigned tenants
   - Access level determines CRUD operations

3. **Denied Access**: RLS policy returns no rows or error

---

## 9. Implementation Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Layer                       │
│                    (Supabase Auth)                           │
└──────────────────────────────┬──────────────────────────────┘
                               │ auth.uid()
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Authorization Layer                         │
│                  (RLS Policies)                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Query Permission Check:                             │   │
│  │ - Is user authenticated? → Check user_id in users   │   │
│  │ - Is it a super admin? → Check is_super_admin flag  │   │
│  │ - Access level? → Check super_user_tenant_access    │   │
│  │ - Tenant match? → Check tenant_id filter            │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Approved queries
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   RBAC Permission Check                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Operation Permission Check:                         │   │
│  │ - Get user roles: SELECT FROM user_roles            │   │
│  │ - Get role permissions: SELECT FROM role_permissions│   │
│  │ - Check permission: Is 'crm:customer:record:update' allowed?  │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Granted permissions
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Access Layer                          │
│                  (Business Logic)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Execute operation with filtered data                │   │
│  │ - Only returns data for current tenant               │   │
│  │ - Audits action to audit_logs table                  │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Filtered results
                               ▼
                         ┌─────────────┐
                         │  User App   │
                         └─────────────┘
```

---

## 10. Current Implementation Status

### 10.1 Fully Implemented

✅ Core RBAC Tables (users, roles, permissions, role_permissions, user_roles)
✅ Super User Module Tables (tenant_access, impersonation_logs, statistics, config_overrides)
✅ Multi-tenant data isolation
✅ RLS policies for all RBAC tables
✅ Constraint enforcement (super admin consistency, unique constraints)
✅ Super user access levels (full, limited, read_only)
✅ Impersonation audit logging
✅ Seeded test data (12 users, 31 permissions, 9 roles)
✅ Tenant-specific role templates
✅ Audit logs table
✅ Indexes for performance optimization

### 10.2 Key Features

**Multi-Tenant Support**:
- Tenant-scoped users and roles
- Tenant-independent super admins
- Complete data isolation via RLS

**Role-Based Access Control**:
- Hierarchical role system (Super Admin → Admin → Manager → Agent → Engineer)
- Granular permissions (31 permissions across 10 categories)
- Role templates for quick role creation

**Super User Management**:
- Platform-wide administrators
- Access level control (full/limited/read-only)
- Impersonation audit trail
- Per-tenant statistics and config overrides

**Security**:
- Database-level RLS enforcement
- Constraint-based data integrity
- Audit logging for all critical actions
- Role consistency checks

### 10.3 Performance Optimizations

- Indexed lookups on `tenant_id`, `user_id`, `role_id`
- Composite indexes for common query patterns
- Filtered indexes for super admin queries
- Separate indexes for email uniqueness

---

## 11. Database Migrations Reference

**RBAC-Related Migrations**:

1. `20250101000001` - Init tenants and users (core RBAC tables)
2. `20250101000009` - Fix RBAC schema (role_templates, permissions updates)
3. `20250101000010` - Add RBAC RLS policies (authorization)
4. `20250101000011` - Fix RBAC RLS policies v2
5. `20250101000012` - Enable RLS on RBAC tables
6. `20250211` - Super user schema (4 new tables)
7. `20250212` - Add is_super_admin column to users
8. `20250213` - Make super users tenant-independent
9. `20250214` - Add super user RLS policies
10. `20250216` - Add role consistency check constraint

---

## 12. Summary

The RBAC system implements a comprehensive, secure, and scalable multi-tenant role-based access control system with:
- 7 core RBAC tables
- 4 super user management tables
- 31 system permissions
- 9 seeded roles across 3 tenants
- 12 seeded users (9 regular + 3 super admins)
- Database-level RLS enforcement
- Complete audit trail capabilities
- Flexible access levels for super users
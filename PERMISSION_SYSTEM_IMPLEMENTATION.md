# CRM Permission System - Atomic Token Implementation

## Overview

This document describes the implementation of atomic permission tokens for the CRM system, following the specified format: `<app>:<domain>:<resource>[:<scope>][:<action>]`.

## Permission Format

### Structure
```
crm:<domain>:<resource>[:<scope>][:<action>]
```

### Components
- **app**: Always "crm" for this application
- **domain**: Business domain (contact, deal, support, contract, user, etc.)
- **resource**: Specific resource within the domain (record, ticket, pipeline, etc.)
- **scope**: Optional scope modifier (field.email, service, etc.)
- **action**: CRUD operation (read, create, update, delete) or specific action (move, export, etc.)

## Business Domains

### Contact Management
**Domain**: `contact`
**Resources**: `record`
**Permissions**:
- `crm:customer:record:read` - View customer contact records
- `crm:customer:record:create` - Create new customer contact records
- `crm:customer:record:update` - Update customer contact records
- `crm:customer:record:delete` - Delete customer contact records
- `crm:customer:record:field.email:update` - Update customer email field

### Deal Management
**Domain**: `deal`
**Resources**: `record`, `pipeline`
**Permissions**:
- `crm:deal:record:read` - View sales deal records
- `crm:deal:record:create` - Create new sales deal records
- `crm:deal:record:update` - Update sales deal records
- `crm:deal:record:delete` - Delete sales deal records
- `crm:deal:pipeline:move` - Move deals through sales pipeline stages

### Support System
**Domain**: `support`
**Resources**: `ticket`, `complaint`
**Permissions**:
- `crm:support:ticket:read` - View support ticket records
- `crm:support:ticket:create` - Create new support ticket records
- `crm:support:ticket:update` - Update support ticket records
- `crm:support:ticket:delete` - Delete support ticket records
- `crm:support:complaint:read` - View customer complaint records
- `crm:support:complaint:create` - Create new customer complaint records
- `crm:support:complaint:update` - Update customer complaint records
- `crm:support:complaint:delete` - Delete customer complaint records

### Contract Management
**Domain**: `contract`
**Resources**: `record`, `service`
**Permissions**:
- `crm:contract:record:read` - View contract records
- `crm:contract:record:create` - Create new contract records
- `crm:contract:record:update` - Update contract records
- `crm:contract:record:delete` - Delete contract records
- `crm:contract:service:read` - View service contract records
- `crm:contract:service:create` - Create new service contract records
- `crm:contract:service:update` - Update service contract records
- `crm:contract:service:delete` - Delete service contract records

### Product Management
**Domain**: `product`
**Resources**: `record`
**Permissions**:
- `crm:product:record:read` - View product records
- `crm:product:record:create` - Create new product records
- `crm:product:record:update` - Update product records
- `crm:product:record:delete` - Delete product records

### Job Work Management
**Domain**: `job`
**Resources**: `work`
**Permissions**:
- `crm:job:work:read` - View job work records
- `crm:job:work:create` - Create new job work records
- `crm:job:work:update` - Update job work records
- `crm:job:work:delete` - Delete job work records

### User Management
**Domain**: `user`
**Resources**: `record`
**Permissions**:
- `crm:user:record:read` - View user records
- `crm:user:record:create` - Create new user records
- `crm:user:record:update` - Update user records
- `crm:user:record:delete` - Delete user records

### Role Management
**Domain**: `role`
**Resources**: `record`
**Permissions**:
- `crm:role:record:read` - View role records
- `crm:role:record:create` - Create new role records
- `crm:role:record:update` - Update role records
- `crm:role:record:delete` - Delete role records

### Permission Management
**Domain**: `permission`
**Resources**: `record`
**Permissions**:
- `crm:permission:record:read` - View permission records
- `crm:permission:record:create` - Create new permission records
- `crm:permission:record:update` - Update permission records
- `crm:permission:record:delete` - Delete permission records

### Tenant Management
**Domain**: `tenant`
**Resources**: `record`
**Permissions**:
- `crm:tenant:record:read` - View tenant records
- `crm:tenant:record:create` - Create new tenant records
- `crm:tenant:record:update` - Update tenant records
- `crm:tenant:record:delete` - Delete tenant records

### Company Management
**Domain**: `company`
**Resources**: `record`
**Permissions**:
- `crm:company:record:read` - View company records
- `crm:company:record:create` - Create new company records
- `crm:company:record:update` - Update company records
- `crm:company:record:delete` - Delete company records

### Audit & Compliance
**Domain**: `audit`
**Resources**: `log`
**Permissions**:
- `crm:audit:log:read` - View audit log records
- `crm:audit:log:export` - Export audit log data

### Dashboard & Analytics
**Domain**: `dashboard`, `report`, `analytics`
**Resources**: `view`
**Permissions**:
- `crm:dashboard:panel:view` - Access dashboard and analytics
- `crm:report:record:view` - Access reports and analytics
- `crm:analytics:insight:view` - Access analytics data

### System Administration
**Domain**: `system`, `platform`, `settings`
**Resources**: `admin`, `manage`
**Permissions**:
- `crm:system:platform:admin` - Full system administration access
- `crm:platform:control:admin` - Platform-level administration access
- `crm:system:config:manage` - Manage system settings and configuration

### Data Operations
**Domain**: `data`
**Resources**: `export`, `import`
**Permissions**:
- `crm:data:export` - Export data and reports
- `crm:data:import` - Import data into the system

### Notification Management
**Domain**: `notification`
**Resources**: `manage`
**Permissions**:
- `crm:notification:channel:manage` - Manage system notifications

### Masters/Reference Data
**Domain**: `master`
**Resources**: `data`
**Permissions**:
- `crm:master:data:read` - View master and reference data
- `crm:master:data:manage` - Manage master and reference data

## Implementation Details

### Database Schema
Permissions are stored in the `permissions` table with the following structure:
- `id`: UUID primary key
- `name`: Permission token (e.g., "crm:customer:record:read")
- `description`: Human-readable description
- `resource`: Resource component (e.g., "contact")
- `action`: Action component (e.g., "record:read")
- `category`: Permission category (module, administrative, system)
- `is_system_permission`: Boolean flag for system permissions

### Role-Permission Assignment
Permissions are assigned to roles through the `role_permissions` table:
- `role_id`: Reference to roles table
- `permission_id`: Reference to permissions table
- `granted_by`: User who granted the permission
- `granted_at`: Timestamp of assignment

### Navigation Integration
Navigation items reference permissions in the `navigation_items` table:
- `permission_name`: Links to permission.name for access control

### Authentication Service
The `hasPermission()` method in the auth service:
- Performs direct string matching against user permissions
- Supports resource:action pattern matching
- Handles synonyms (:read vs :view, :create vs :write)
- Supports legacy permission format fallbacks

## Migration from Legacy Permissions

### Old Format → New Format Mapping

| Legacy Permission | New Atomic Permission |
|-------------------|----------------------|
| `customers:manage` | `crm:customer:record:read` |
| `sales:manage` | `crm:deal:record:read` |
| `contracts:manage` | `crm:contract:record:read` |
| `tickets:manage` | `crm:support:ticket:read` |
| `complaints:manage` | `crm:support:complaint:read` |
| `products:manage` | `crm:product:record:read` |
| `job_works:manage` | `crm:job:work:read` |
| `crm:user:record:update` | `crm:user:record:read` |
| `crm:role:permission:assign` | `crm:role:record:read` |
| `companies:manage` | `crm:company:record:read` |
| `crm:dashboard:panel:view` | `crm:dashboard:panel:view` |
| `crm:reference:data:read` | `crm:master:data:read` |
| `crm:system:config:manage` | `crm:system:config:manage` |
| `view_audit_logs` | `crm:audit:log:read` |

## Benefits of Atomic Permissions

1. **Granular Control**: Each permission represents a specific action on a specific resource
2. **Composable**: Permissions can be combined to create complex access patterns
3. **Discoverable**: Clear naming scheme makes permissions easy to understand and find
4. **Future-Proof**: Easy to add new permissions following the established pattern
5. **Audit-Friendly**: Clear separation of concerns for compliance and auditing

## Usage Examples

### Checking Permissions in Components
```typescript
import { useAuth } from '@/contexts/AuthContext';

function CustomerList() {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('crm:customer:record:create');
  const canEdit = hasPermission('crm:customer:record:update');
  const canDelete = hasPermission('crm:customer:record:delete');

  // Component logic...
}
```

### Navigation Filtering
Navigation items automatically filter based on user permissions:
```sql
-- Navigation items are only shown if user has the required permission
SELECT * FROM navigation_items
WHERE permission_name IN (SELECT permission FROM user_permissions)
```

### Role Assignment
Roles are assigned specific permissions:
```sql
-- Administrator role gets all contact management permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Administrator'
  AND p.name LIKE 'crm:contact:%';
```

## Validation and Testing

### Permission Validation
- All permissions follow the `crm:<domain>:<resource>[:<scope>][:<action>]` format
- Permissions are validated at creation time
- Database constraints ensure format consistency

### Testing Strategy
- Unit tests for permission checking logic
- Integration tests for role-permission assignments
- End-to-end tests for navigation filtering
- Database validation scripts for permission integrity

## Future Extensions

### Field-Level Permissions
```typescript
crm:customer:record:field.email:update
crm:customer:record:field.phone:update
crm:deal:record:field.value:update
```

### Workflow Permissions
```typescript
crm:deal:pipeline:move:stage.qualified
crm:support:ticket:assign:team.technical
```

### Time-Based Permissions
```typescript
crm:audit:log:read:period.last_30_days
crm:report:record:view:schedule.monthly
```

---

**Document Version**: 1.0
**Date**: November 28, 2025
**Status**: Implemented and Active
# RBAC Permission Naming Convention - Audit Report

**Date**: November 22, 2025  
**Status**: CRITICAL - Mixed permission formats causing inconsistencies  
**Impact**: Permission checks may fail silently, maintenance difficulty

## Current Permission Formats Found

### 1. Legacy `manage_*` Format (168+ references)
```
manage_customers, manage_sales, manage_users, manage_roles, manage_tickets,
manage_contracts, manage_products, manage_complaints, manage_job_works,
manage_settings, manage_companies, manage_tenants, etc.
```

### 2. New `{resource}:{action}` Format (89+ references)
```
customers:read, customers:create, customers:update, customers:delete,
sales:create, sales:read, sales:update, sales:delete,
tickets:read, tickets:create, tickets:update, tickets:delete,
products:read, products:create, products:update, products:delete,
contracts:read, contracts:create, contracts:update, contracts:delete
```

### 3. Mixed Module-Specific Formats
```
super_user:manage_users, super_user:manage_tenants, super_user:view_audit_logs
user:list, user:create, user:edit, user:delete
product_sales:create, product_sales:manage_invoices, product_sales:view_analytics
```

## Target Standard: `{resource}:{action}` Format

**Format**: `{resource}:{action}` where:
- `resource`: Module/resource name (singular, lowercase)
- `action`: Specific action (read, create, update, delete, export, import, etc.)

**Examples**:
- `customers:read`, `customers:create`, `customers:update`, `customers:delete`
- `sales:read`, `sales:create`, `sales:update`, `sales:delete`
- `users:read`, `users:create`, `users:update`, `users:delete`
- `tickets:read`, `tickets:create`, `tickets:update`, `tickets:delete`
- `products:read`, `products:create`, `products:update`, `products:delete`
- `contracts:read`, `contracts:create`, `contracts:update`, `contracts:delete`

## Comprehensive Mapping: Legacy → New Format

### Module Permissions
| Legacy Format | New Format |
|---------------|------------|
| `manage_customers` | `customers:read` (general access) |
| `manage_sales` | `sales:read` (general access) |
| `manage_tickets` | `tickets:read` (general access) |
| `manage_contracts` | `contracts:read` (general access) |
| `manage_products` | `products:read` (general access) |
| `manage_complaints` | `complaints:read` (general access) |
| `manage_job_works` | `jobworks:read` (general access) |
| `manage_product_sales` | `product_sales:read` (general access) |
| `manage_service_contracts` | `service_contracts:read` (general access) |

### Administrative Permissions
| Legacy Format | New Format |
|---------------|------------|
| `manage_users` | `users:read` (general access) |
| `manage_roles` | `roles:read` (general access) |
| `manage_settings` | `settings:read` (general access) |
| `manage_companies` | `companies:read` (general access) |
| `view_analytics` | `analytics:view` |
| `view_dashboard` | `dashboard:view` |

### System Permissions
| Legacy Format | New Format |
|---------------|------------|
| `super_admin` | `system:admin` |
| `manage_tenants` | `tenants:manage` |
| `system_monitoring` | `system:monitor` |
| `platform_admin` | `platform:admin` |

## Implementation Strategy

### Phase 1: Mock RBAC Service Updates
- Update `src/services/rbac/rbacService.ts`
- Convert all default permissions to new format
- Update role templates and permission mappings

### Phase 2: Supabase RBAC Service Updates
- Update `src/services/rbac/supabase/rbacService.ts`
- Update default permissions in fallback system
- Update permission mapping logic

### Phase 3: Authentication Service Updates
- Update `src/services/auth/authService.ts`
- Update `src/services/auth/supabase/authService.ts`
- Convert all role permission arrays to new format

### Phase 4: Component & Hook Updates
- Update `src/config/navigationPermissions.ts`
- Update permission checks in components
- Update hooks that use permission validation

### Phase 5: Database Migration
- Create migration to rename permissions in database
- Update seed data with new permission names

## Files Requiring Updates

### High Priority (Core RBAC)
1. `src/services/rbac/rbacService.ts` - Mock service
2. `src/services/rbac/supabase/rbacService.ts` - Supabase service
3. `src/services/auth/authService.ts` - Auth service
4. `src/services/auth/supabase/authService.ts` - Supabase auth

### Medium Priority (Configuration)
5. `src/config/navigationPermissions.ts` - Navigation config
6. `src/hooks/usePermission.ts` - Permission hook
7. `src/hooks/useModuleAccess.ts` - Module access hook

### Lower Priority (Components)
8. Module-specific permission constants
9. Component-level permission checks
10. Test files

## Testing Strategy

1. **Backward Compatibility**: Ensure both formats work during transition
2. **Permission Validation**: Test all permission checks work correctly
3. **Role Assignment**: Verify role templates work with new format
4. **Navigation**: Ensure menu/navigation respects new permissions
5. **Audit Trail**: Verify audit logging uses new format

## Migration Timeline

- **Day 1**: Core RBAC services (Phases 1-2)
- **Day 2**: Authentication services (Phase 3)
- **Day 3**: Configuration and hooks (Phase 4)
- **Day 4**: Database migration (Phase 5)
- **Day 5**: Testing and validation

## Success Criteria

✅ All permissions use `{resource}:{action}` format  
✅ Mock service updated with new format  
✅ Supabase service updated with new format  
✅ Authentication services updated  
✅ Navigation permissions updated  
✅ Permission checks work correctly  
✅ No regressions in access control  
✅ Tests pass with new format
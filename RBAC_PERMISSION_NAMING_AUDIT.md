# RBAC Permission Naming Convention - Audit Report

**Date**: November 22, 2025  
**Status**: CRITICAL - Mixed permission formats causing inconsistencies  
**Impact**: Permission checks may fail silently, maintenance difficulty

## Current Permission Formats Found

### 1. Legacy `manage_*` Format (168+ references)
```
crm:customer:record:update, crm:sales:deal:update, crm:user:record:update, crm:role:record:update, manage_tickets,
manage_contracts, manage_products, crm:support:complaint:update, manage_job_works,
crm:system:config:manage, manage_companies, crm:platform:tenant:manage, etc.
```

### 2. New `{resource}:{action}` Format (89+ references)
```
crm:customer:record:read, crm:customer:record:create, crm:customer:record:update, crm:customer:record:delete,
crm:sales:deal:create, crm:sales:deal:read, crm:sales:deal:update, crm:sales:deal:delete,
crm:support:ticket:read, crm:support:ticket:create, crm:support:ticket:update, crm:support:ticket:delete,
crm:product:record:read, crm:product:record:create, crm:product:record:update, crm:product:record:delete,
crm:contract:record:read, crm:contract:record:create, crm:contract:record:update, crm:contract:record:delete
```

### 3. Mixed Module-Specific Formats
```
crm:platform:user:manage, crm:platform:tenant:manage, crm:platform:audit:view
user:list, user:create, user:edit, user:delete
crm:product-sale:record:create, product_sales:manage_invoices, product_sales:crm:analytics:insight:view
```

## Target Standard: `{resource}:{action}` Format

**Format**: `{resource}:{action}` where:
- `resource`: Module/resource name (singular, lowercase)
- `action`: Specific action (read, create, update, delete, export, import, etc.)

**Examples**:
- `crm:customer:record:read`, `crm:customer:record:create`, `crm:customer:record:update`, `crm:customer:record:delete`
- `crm:sales:deal:read`, `crm:sales:deal:create`, `crm:sales:deal:update`, `crm:sales:deal:delete`
- `crm:user:record:read`, `crm:user:record:create`, `crm:user:record:update`, `crm:user:record:delete`
- `crm:support:ticket:read`, `crm:support:ticket:create`, `crm:support:ticket:update`, `crm:support:ticket:delete`
- `crm:product:record:read`, `crm:product:record:create`, `crm:product:record:update`, `crm:product:record:delete`
- `crm:contract:record:read`, `crm:contract:record:create`, `crm:contract:record:update`, `crm:contract:record:delete`

## Comprehensive Mapping: Legacy → New Format

### Module Permissions
| Legacy Format | New Format |
|---------------|------------|
| `crm:customer:record:update` | `crm:customer:record:read` (general access) |
| `crm:sales:deal:update` | `crm:sales:deal:read` (general access) |
| `manage_tickets` | `crm:support:ticket:read` (general access) |
| `manage_contracts` | `crm:contract:record:read` (general access) |
| `manage_products` | `crm:product:record:read` (general access) |
| `crm:support:complaint:update` | `crm:support:complaint:read` (general access) |
| `manage_job_works` | `crm:project:record:read` (general access) |
| `crm:product-sale:record:update` | `crm:product-sale:record:read` (general access) |
| `crm:contract:service:update` | `crm:contract:service:read` (general access) |

### Administrative Permissions
| Legacy Format | New Format |
|---------------|------------|
| `crm:user:record:update` | `crm:user:record:read` (general access) |
| `crm:role:record:update` | `crm:role:record:read` (general access) |
| `crm:system:config:manage` | `crm:system:config:read` (general access) |
| `manage_companies` | `crm:company:record:read` (general access) |
| `crm:analytics:insight:view` | `crm:analytics:insight:view` |
| `view_dashboard` | `crm:dashboard:panel:view` |

### System Permissions
| Legacy Format | New Format |
|---------------|------------|
| `super_admin` | `system:admin` |
| `crm:platform:tenant:manage` | `crm:platform:tenant:manage` |
| `system_monitoring` | `system:monitor` |
| `crm:platform:control:admin` | `platform:admin` |

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
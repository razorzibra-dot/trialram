# RBAC Permission Naming Convention Standard

## Overview
This document establishes the standard permission naming convention for the RBAC system to ensure consistency across all modules and components.

## Standard Format
**Target Format**: `{resource}:{action}`

### Examples
- `crm:customer:record:read` - View customer data
- `crm:customer:record:create` - Create new customers
- `crm:customer:record:update` - Edit customer information
- `crm:customer:record:delete` - Delete customer records
- `crm:user:record:create` - Create new users
- `sales:approve` - Approve sales
- `products:export` - Export product data

## Conversion Rules

### Resource Naming
- Use singular form (customer, not customers)
- Use lowercase with underscores if needed (product_sales)
- Match module/entity names exactly

### Action Naming
- `read` - View/list data (replaces `manage_X` for view operations)
- `create` - Add new records
- `update` - Edit existing records  
- `delete` - Remove records
- `approve` - Approve workflows
- `reject` - Reject workflows
- `export` - Export data
- `import` - Import data
- `view_audit` - Access audit logs
- `manage_X` - Full CRUD operations (when specific actions aren't needed)

## Migration Process

### Phase 1: Database Updates
1. Update permissions table seed data
2. Update role templates
3. Run data migration scripts

### Phase 2: Service Layer Updates  
1. Update mock RBAC service permissions
2. Update permission validation logic
3. Update permission mapping functions

### Phase 3: Component Updates
1. Update permission guards
2. Update usePermission hooks
3. Update component-level checks

### Phase 4: Testing & Validation
1. Test all permission checks work correctly
2. Verify no regressions in functionality
3. Update documentation

## Legacy Permission Examples

| Legacy Format | New Standard Format | Notes |
|---------------|---------------------|-------|
| `crm:customer:record:update` | `crm:customer:record:read` | For view operations |
| `crm:customer:record:update` | `crm:customer:record:create` | For create operations |
| `crm:customer:record:update` | `crm:customer:record:update` | For update operations |
| `user:list` | `crm:user:record:read` | Standardized |
| `crm:user:record:update` | `crm:user:record:create` | Context-specific |
| `view_audit` | `audit:view` | More specific |

## Implementation Checklist

- [ ] Database permissions seed data updated
- [ ] Mock RBAC service updated
- [ ] Supabase RBAC service updated  
- [ ] Permission guards updated
- [ ] usePermission hooks updated
- [ ] Role templates updated
- [ ] Component permission checks updated
- [ ] Documentation updated
- [ ] Tests pass
- [ ] No regressions

## Benefits

1. **Consistency**: All permissions follow the same pattern
2. **Clarity**: Permission names clearly indicate resource and action
3. **Maintainability**: Easier to understand and modify permissions
4. **Scalability**: Standard format supports new resources and actions
5. **Debugging**: Clear permission names aid in troubleshooting

## References

- RBAC_SERVICE_STANDARDIZATION_PLAN.md
- COMPREHENSIVE_MODULE_STANDARDIZATION_CHECKLIST.md
- MODULE_SERVICE_STANDARDIZATION_RULES.md

---

**Last Updated**: November 22, 2025
**Status**: Implementation Ready
**Next Step**: Begin fix1-2 - Audit all permission references in codebase
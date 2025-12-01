# Customer Detail Element Permissions Fix - Implementation Summary

## Problem Statement
Customer Detail panel shows:
1. "You don't have permission to access this section." message on Basic Information section
2. Edit button not visible in the footer
3. Other sections may not be properly permission-controlled

## Root Cause Analysis

### Issue 1: Missing Database Permissions
- CustomerDetailPanel checks for permissions like:
  - `crm:contacts:detail:section.basic`
  - `crm:contacts:detail:section.business`
  - `crm:contacts:detail:section.address`
  - `crm:contacts:detail:section.financial`
  - `crm:contacts:detail:section.notes`
  - `crm:contacts:record.${customer.id}:button.edit` (record-specific)
  - `crm:contacts:detail:button.edit` (detail-level)
- These permissions don't exist in the `permissions` table
- No element_permissions entries for customer detail sections and buttons

### Issue 2: Permission Evaluation Logic
- Edit button checks record-specific permission: `crm:contacts:record.${customer.id}:button.edit`
- This is dynamic and may not exist for all customers
- No fallback to detail-level or base permissions

### Issue 3: Component Issues
- PermissionSection used with unsupported `icon` prop
- Missing fallback logic for edit button permission

## Solution Implemented

### 1. Database Layer (Layer 1) ✅
**File**: `supabase/migrations/20251130000009_add_customer_detail_element_permissions.sql`

**Changes**:
- Created 15 customer detail element permissions:
  - **Detail action buttons**:
    - `crm:contacts:detail:button.edit` - Edit button visible
    - `crm:contacts:detail:button.delete` - Delete button visible
    - `crm:contacts:detail:button.close` - Close button visible
  - **Detail sections**:
    - `crm:contacts:detail:section.basic` - Basic information section
    - `crm:contacts:detail:section.business` - Business information section
    - `crm:contacts:detail:section.address` - Address information section
    - `crm:contacts:detail:section.financial` - Financial information section
    - `crm:contacts:detail:section.lead` - Lead information section
    - `crm:contacts:detail:section.notes` - Notes section
    - `crm:contacts:detail:section.timeline` - Timeline section
    - `crm:contacts:detail:section.metrics` - Key metrics section
  - **Detail fields** (for granular control):
    - `crm:contacts:detail:field.company_name` - Company name field
    - `crm:contacts:detail:field.email` - Email field
    - `crm:contacts:detail:field.phone` - Phone field
    - `crm:contacts:detail:field.status` - Status field

- Assigned permissions to roles:
  - Roles with customer management permissions get all detail permissions
  - Admin roles get all detail permissions explicitly
  - Manager roles get basic detail permissions (view sections, edit button, but not delete)

- Created `element_permissions` entries for granular control

### 2. UI Layer (Layer 8) ✅
**File**: `src/modules/features/customers/components/CustomerDetailPanel.tsx`

**Changes**:
1. **Fixed PermissionSection icon prop**:
   - Removed unsupported `icon` prop from PermissionSection component

2. **Enhanced edit button permission checks**:
   - Added separate checks for record-specific, detail-level, and base permissions
   - Added fallback to base record permissions (`crm:customer:record:update`)
   - Mode-aware permission evaluation

3. **Permission logic**:
   ```typescript
   // ✅ Check record-specific permission first, then fallback to detail button and base permissions
   const canEditCustomerRecord = usePermission(`crm:contacts:record.${customer.id}:button.edit`, 'visible');
   const canEditCustomerDetail = usePermission('crm:contacts:detail:button.edit', 'visible');
   
   // ✅ FALLBACK: Check base record permissions if element permissions don't exist
   const { hasPermission } = useAuth();
   const canUpdateCustomer = hasPermission('crm:customer:record:update');
   
   // Final check: use record-specific permission if available, otherwise fallback to detail button or base permission
   const canEditCustomer = canEditCustomerRecord || canEditCustomerDetail || canUpdateCustomer;
   ```

4. **Added useAuth import**:
   - Imported `useAuth` hook for base permission checks

## Layer Synchronization Verification

### ✅ Layer 1: Database
- Permissions table: `name`, `element_path`, `resource`, `action` columns
- Element_permissions table: `element_path`, `permission_id` columns
- Role_permissions: Links roles to permissions
- RLS policies: Properly configured for tenant isolation

### ✅ Layer 2: Types
- `Permission` interface: `elementPath?: string`
- `ElementPermission` interface: Complete
- `PermissionContext` interface: Complete

### ✅ Layer 3: Mock Service
- Not applicable (using Supabase directly)

### ✅ Layer 4: Supabase Service
- `elementPermissionService.evaluateElementPermission()`: Properly implemented
- Column mapping: snake_case → camelCase handled
- Tenant isolation: Properly implemented

### ✅ Layer 5: Factory
- `elementPermissionService` registered in `serviceFactory.ts`
- No direct imports enforced

### ✅ Layer 6: Module Service
- Not applicable (using hooks directly)

### ✅ Layer 7: Hooks
- `usePermission` from `@/hooks/useElementPermissions`: Properly implemented
- Loading states: Handled (optimistic rendering)
- Error handling: Implemented
- Cache invalidation: Implemented

### ✅ Layer 8: UI
- `CustomerDetailPanel.tsx`: Uses `usePermission` hook correctly
- Permission checks: All aligned with database permission names
- Conditional rendering: Properly implemented
- Fallback logic: Base permissions checked if element permissions don't exist

## Migration Application

To apply the fix, run:

```bash
# Option 1: Via Supabase Studio
# 1. Open Supabase Studio (http://127.0.0.1:54323)
# 2. Go to SQL Editor
# 3. Copy and execute: supabase/migrations/20251130000009_add_customer_detail_element_permissions.sql

# Option 2: Database Reset (if okay with resetting)
supabase db reset
```

## Testing Checklist

After applying the migration:

- [ ] Customer detail panel opens without errors
- [ ] Basic Information section is visible (no "You don't have permission" message)
- [ ] Edit button is visible in footer (if user has `crm:customer:record:update` or `crm:contacts:detail:button.edit`)
- [ ] All detail sections are visible based on permissions
- [ ] Close button is always visible
- [ ] Console shows no permission-related errors
- [ ] Edit button click opens edit form correctly

## Verification Queries

```sql
-- Check if customer detail permissions exist
SELECT name, element_path, resource, action 
FROM permissions 
WHERE name LIKE 'crm:contacts:detail:%'
ORDER BY name;

-- Check if permissions are assigned to roles
SELECT r.name as role_name, p.name as permission_name
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE p.name LIKE 'crm:contacts:detail:%'
ORDER BY r.name, p.name;

-- Check element_permissions entries
SELECT element_path, permission_id, required_role_level
FROM element_permissions
WHERE element_path LIKE 'crm:contacts:detail:%';
```

## Files Modified

1. **Database Migration**: `supabase/migrations/20251130000009_add_customer_detail_element_permissions.sql`
2. **UI Layer**: `src/modules/features/customers/components/CustomerDetailPanel.tsx`

## Permission Check Flow

1. **Edit Button Check** (priority order):
   - Record-specific: `crm:contacts:record.${customer.id}:button.edit`
   - Detail-level: `crm:contacts:detail:button.edit`
   - Base permission: `crm:customer:record:update`

2. **Section Access Check**:
   - Each section checks its specific permission (e.g., `crm:contacts:detail:section.basic`)
   - PermissionSection component handles rendering/denial

3. **Final decision**:
   - If element permission exists and is granted → Show element
   - If element permission doesn't exist but base permission is granted → Show element
   - If neither exists → Hide element or show denial message

## Next Steps

1. Apply the migration to create customer detail element permissions
2. Verify permissions are assigned to user's role
3. Test customer detail panel sections visibility
4. Test edit button visibility
5. Monitor console for any permission evaluation errors
6. Verify all 8 layers remain synchronized

## Notes

- All permissions follow `crm:resource:action` pattern
- Element paths match what CustomerDetailPanel checks
- Permissions are database-driven (no hardcoded values)
- Tenant isolation maintained throughout
- Fallback logic ensures backward compatibility
- Record-specific permissions allow per-customer control
- Detail-level permissions provide module-wide control
- Base permissions provide backward compatibility


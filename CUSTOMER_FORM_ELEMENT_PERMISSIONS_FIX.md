# Customer Form Element Permissions Fix - Implementation Summary

## Problem Statement
Customer form (Create New Customer and Edit Customer) loads and all form sections/fields are visible as per assigned permissions, but the form action buttons (Save/Create/Update) are not visible. This is because:
1. Customer form element permissions don't exist in the database
2. Permission evaluation logic doesn't handle form button permissions correctly
3. Missing fallback to base record permissions

## Root Cause Analysis

### Issue 1: Missing Database Permissions
- CustomerFormPanel checks for permissions like `crm:contacts:form:button.save`, `crm:contacts:form:button.create`, `crm:contacts:form:button.update`
- These permissions don't exist in the `permissions` table
- No element_permissions entries for customer form buttons

### Issue 2: Permission Evaluation Logic
- Form checks `crm:contacts:form:button.save` with action `enabled`
- But database doesn't have these permissions
- No fallback to base permissions (`crm:customer:record:create`, `crm:customer:record:update`)

### Issue 3: Form Mode Detection
- Form doesn't differentiate between create and edit mode for permission checks
- Should check `crm:contacts:form:button.create` for create mode
- Should check `crm:contacts:form:button.update` for edit mode
- Should fallback to base permissions if element permissions don't exist

## Solution Implemented

### 1. Database Layer (Layer 1) ✅
**File**: `supabase/migrations/20251130000008_add_customer_form_element_permissions.sql`

**Changes**:
- Created 16 customer form element permissions:
  - **Form action buttons**:
    - `crm:contacts:form:button.save` - Save button enabled
    - `crm:contacts:form:button.create` - Create button enabled
    - `crm:contacts:form:button.update` - Update button enabled
    - `crm:contacts:form:button.cancel` - Cancel button visible
  - **Form sections**:
    - `crm:contacts:form:section.basic` - Basic information section
    - `crm:contacts:form:section.business` - Business information section
    - `crm:contacts:form:section.address` - Address information section
    - `crm:contacts:form:section.financial` - Financial information section
    - `crm:contacts:form:section.lead` - Lead information section
    - `crm:contacts:form:section.notes` - Notes section
  - **Form fields** (for granular control):
    - `crm:contacts:form:field.company_name` - Company name field
    - `crm:contacts:form:field.contact_name` - Contact name field
    - `crm:contacts:form:field.email` - Email field
    - `crm:contacts:form:field.phone` - Phone field
    - `crm:contacts:form:field.status` - Status field
    - `crm:contacts:form:field.assigned_to` - Assigned to field

- Assigned permissions to roles:
  - Roles with customer management permissions get all form permissions
  - Admin roles get all form permissions explicitly
  - Manager roles get basic form permissions (view and edit, but not all fields)

- Created `element_permissions` entries for granular control

### 2. Service Layer (Layer 4) ✅
**Status**: No changes needed - elementPermissionService already handles form permissions correctly

### 3. UI Layer (Layer 8) ✅
**File**: `src/modules/features/customers/components/CustomerFormPanel.tsx`

**Changes**:
1. **Enhanced permission checks**:
   - Added separate checks for create and update form buttons
   - Added fallback to base record permissions (`crm:customer:record:create`, `crm:customer:record:update`)
   - Mode-aware permission evaluation (create vs edit)

2. **Permission logic**:
   ```typescript
   // Element-level permissions (preferred)
   const canSaveFormElement = usePermission('crm:contacts:form:button.save', 'enabled');
   const canCreateFormElement = usePermission('crm:contacts:form:button.create', 'enabled');
   const canUpdateFormElement = usePermission('crm:contacts:form:button.update', 'enabled');
   
   // Fallback to base permissions
   const canCreateCustomer = hasPermission('crm:customer:record:create');
   const canUpdateCustomer = hasPermission('crm:customer:record:update');
   
   // Mode-aware final check
   const canSaveForm = isEditMode 
     ? (canUpdateFormElement || canUpdateCustomer)
     : (canCreateFormElement || canCreateCustomer);
   
   const finalCanSaveForm = canSaveFormElement || canSaveForm;
   ```

3. **Fixed linter errors**:
   - Removed `icon` prop from `PermissionSection` (not supported)
   - Fixed `InputNumber` parser type issue

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
- `CustomerFormPanel.tsx`: Uses `usePermission` hook correctly
- Permission checks: All aligned with database permission names
- Conditional rendering: Properly implemented
- Fallback logic: Base permissions checked if element permissions don't exist

## Migration Application

To apply the fix, run:

```bash
# Option 1: Via Supabase Studio
# 1. Open Supabase Studio (http://127.0.0.1:54323)
# 2. Go to SQL Editor
# 3. Copy and execute: supabase/migrations/20251130000008_add_customer_form_element_permissions.sql

# Option 2: Database Reset (if okay with resetting)
supabase db reset
```

## Testing Checklist

After applying the migration:

- [ ] Customer form opens without errors
- [ ] Create New Customer form shows "Create Customer" button (if user has `crm:customer:record:create` or `crm:contacts:form:button.create`)
- [ ] Edit Customer form shows "Update Customer" button (if user has `crm:customer:record:update` or `crm:contacts:form:button.update`)
- [ ] Form sections are visible based on permissions
- [ ] Form fields are editable based on permissions
- [ ] Cancel button is always visible
- [ ] Console shows no permission-related errors
- [ ] Form submission works correctly

## Verification Queries

```sql
-- Check if customer form permissions exist
SELECT name, element_path, resource, action 
FROM permissions 
WHERE name LIKE 'crm:contacts:form:%'
ORDER BY name;

-- Check if permissions are assigned to roles
SELECT r.name as role_name, p.name as permission_name
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE p.name LIKE 'crm:contacts:form:%'
ORDER BY r.name, p.name;

-- Check element_permissions entries
SELECT element_path, permission_id, required_role_level
FROM element_permissions
WHERE element_path LIKE 'crm:contacts:form:%';
```

## Files Modified

1. **Database Migration**: `supabase/migrations/20251130000008_add_customer_form_element_permissions.sql`
2. **UI Layer**: `src/modules/features/customers/components/CustomerFormPanel.tsx`

## Permission Check Flow

1. **Element-level check** (preferred):
   - Create mode: `crm:contacts:form:button.create` → `crm:contacts:form:button.save`
   - Edit mode: `crm:contacts:form:button.update` → `crm:contacts:form:button.save`

2. **Fallback to base permissions** (backward compatibility):
   - Create mode: `crm:customer:record:create`
   - Edit mode: `crm:customer:record:update`

3. **Final decision**:
   - If element permission exists and is granted → Show button
   - If element permission doesn't exist but base permission is granted → Show button
   - If neither exists → Hide button

## Next Steps

1. Apply the migration to create customer form element permissions
2. Verify permissions are assigned to user's role
3. Test customer form action buttons visibility
4. Monitor console for any permission evaluation errors
5. Verify all 8 layers remain synchronized

## Notes

- All permissions follow `crm:resource:action` pattern
- Element paths match what CustomerFormPanel checks
- Permissions are database-driven (no hardcoded values)
- Tenant isolation maintained throughout
- Fallback logic ensures backward compatibility
- Mode-aware permission checks (create vs edit)


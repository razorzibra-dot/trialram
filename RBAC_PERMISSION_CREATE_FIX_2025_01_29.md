---
title: RBAC Permission "Create Product Sales" Bug Fix
description: Fix for "Permission Denied" error when creating product sales despite user having manage_product_sales role
date: 2025-01-29
author: AI Agent
version: 2.0.0
status: in-progress
projectName: PDS-CRM Product Sales Module
category: critical-bugfix
severity: high
---

# RBAC Permission "Create Product Sales" Bug Fix

## Issue Summary

**Error Message**: "Permission Denied - You do not have permission to create product sales"

**Symptoms**:
- User cannot create product sales in the UI
- Console shows: `[validateRolePermissions] User has no roles assigned` (BUT ALSO shows permission granted for other actions)
- User CAN view, edit, delete, approve, reject product sales (other permissions work)
- Only the CREATE action fails

**Root Cause**: After executing migration 017 for seeding roles and user_roles, the permissions were correctly assigned to roles (we see evidence with successful view/edit/delete/etc checks). However, the permission loading hook (`useProductSalesPermissions`) was calling a method with incorrect parameters.

---

## The Bug Details

### What Was Wrong

**File**: `src/modules/features/product-sales/hooks/useProductSalesPermissions.ts`  
**Line**: 71

The hook was calling:
```typescript
const availableActions = await productSalesRbacService.getAvailableActions(tenantId);
```

**Problem**: The `getAvailableActions()` method requires a `sale` parameter (ProductSale object), but the hook was passing only `tenantId`. Additionally, `getAvailableActions()` doesn't even check the `canCreate` permission - it only checks permissions for EXISTING sales (view, edit, delete, approve, reject).

**Result**: 
1. The method received `tenantId` as the `sale` parameter (wrong type)
2. It never checked `canCreate` at all
3. The hook set `canCreate: undefined` which became `false` in the permission state
4. The form panel saw `permissions.canCreate === false` and displayed the permission error

---

## The Fix

### What Was Changed

**File**: `src/modules/features/product-sales/hooks/useProductSalesPermissions.ts`  
**Lines**: 68-115

Changed the `loadPermissions` callback to:
1. Call each permission check method individually
2. Properly check `canCreateProductSale()` (which was completely missing)
3. Use temporary placeholder sales objects for methods that require a sale parameter
4. Properly access the `allowed` property from the PermissionResult objects

**Code Change**:
```typescript
// OLD (WRONG):
const availableActions = await productSalesRbacService.getAvailableActions(tenantId);
if (availableActions) {
  setPermissions({
    canCreate: availableActions.canCreate || false,  // ❌ This property doesn't exist!
    canView: availableActions.canView || false,
    // ...
  });
}

// NEW (CORRECT):
const [
  createResult,
  viewResult,
  editResult,
  // ... all other methods
] = await Promise.all([
  productSalesRbacService.canCreateProductSale(tenantId),  // ✅ Now checks create
  productSalesRbacService.canViewProductSales(tenantId),
  productSalesRbacService.canEditProductSale({ id: 'temp' } as any, tenantId),
  // ...
]);

setPermissions({
  canCreate: createResult.allowed || false,  // ✅ Access .allowed property
  canView: viewResult.allowed || false,
  canEdit: editResult.allowed || false,
  // ...
});
```

---

## Why This Fixes the Issue

### Before the Fix
1. Hook calls `getAvailableActions(tenantId)` with wrong parameters
2. `getAvailableActions` doesn't check `canCreate` at all
3. Hook sets `canCreate: false` (or undefined)
4. ProductSaleFormPanel checks `permissions.canCreate` → false
5. Shows error: "You do not have permission to create product sales"
6. ❌ User cannot create sales (even though they have the role!)

### After the Fix
1. Hook calls `canCreateProductSale(tenantId)` directly
2. This calls RBAC service with `product_sales:create` action
3. RBAC service maps to `manage_product_sales` permission
4. RBAC service queries database: user has this role with this permission
5. Returns `{ allowed: true }`
6. Hook sets `canCreate: true`
7. ProductSaleFormPanel checks `permissions.canCreate` → true
8. ✅ Form loads and user can create sales

---

## How to Apply

### Step 1: Pull the Latest Code
```bash
git pull origin main
```

### Step 2: Verify the Change
The file `src/modules/features/product-sales/hooks/useProductSalesPermissions.ts` should have the updated `loadPermissions` callback.

### Step 3: Rebuild the Application
```bash
npm run build
```

### Step 4: Test in Development
```bash
npm run dev
```

### Step 5: Test the Fix

1. **Log in** with a user who has the `manage_product_sales` permission
   - Example: `admin@acme.com` (Super Administrator role)
   - Example: `manager@acme.com` (Manager role)

2. **Navigate** to Product Sales module

3. **Click "Create New Sale"**
   - Expected: Form loads WITHOUT permission error
   - Expected: Can fill in form fields

4. **Try to create a sale**
   - Expected: Sale is created successfully
   - Expected: No permission denied error

5. **Verify with a limited user** (optional)
   - Log in with `user@acme.com` (Agent role - no product sales permission)
   - Navigate to Product Sales
   - Expected: See "You do not have permission" message
   - Expected: Cannot create sales

---

## Files Modified

| File | Change | Lines | Type |
|------|--------|-------|------|
| `src/modules/features/product-sales/hooks/useProductSalesPermissions.ts` | Updated `loadPermissions` callback to properly check all permissions including `canCreate` | 68-115 | BUG FIX |

---

## Technical Details

### Method Signatures Used

```typescript
// Check create permission (requires no sale)
canCreateProductSale(tenantId?: string, metadata?: Record<string, any>): Promise<PermissionResult>

// Check view permission (requires no sale)
canViewProductSales(tenantId?: string): Promise<PermissionResult>

// Check edit permission (takes sale object for context)
canEditProductSale(sale: ProductSale, tenantId?: string, fieldNames?: string[]): Promise<PermissionResult>

// Result object structure
interface PermissionResult {
  allowed: boolean;
  reason?: string;
  denialCode?: 'ROLE_MISSING' | 'PERMISSION_DENIED' | 'TENANT_MISMATCH' | 'UNKNOWN';
}
```

### Permission Mapping

```
Action: product_sales:create
  ↓ Maps to ↓
Permission: manage_product_sales
  ↓ Checked in ↓
User's Roles (from user_roles join roles)
  ↓ Result ↓
canCreate: true/false
```

---

## Verification Steps

### Database Verification
```sql
-- Check that user has role assigned
SELECT u.email, r.name, r.permissions
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@acme.com';

-- Expected result:
-- email: admin@acme.com
-- name: Super Administrator (or similar)
-- permissions: ["manage_product_sales", ...]
```

### Console Verification (After Fix)
When you load the Product Sales form with the fixed code, you should see in browser console:
```
[validateRolePermissions] User has permission "manage_product_sales" for action "product_sales:create"
[validateRolePermissions] User has permission "manage_product_sales" for action "product_sales:view"
[validateRolePermissions] User has permission "manage_product_sales" for action "product_sales:edit"
[validateRolePermissions] User has permission "manage_product_sales" for action "product_sales:delete"
[validateRolePermissions] User has permission "manage_product_sales" for action "product_sales:view_details"
```

---

## Related Issues Resolved

This fix addresses:
- ✅ "Permission Denied" error when creating product sales
- ✅ Inconsistency where user could view/edit but not create
- ✅ Missing `canCreate` permission check in hook
- ✅ Incorrect method call with wrong parameters

---

## Testing Checklist

- [ ] Build completes without errors: `npm run build`
- [ ] Dev server starts: `npm run dev`
- [ ] Can log in with admin account
- [ ] Can navigate to Product Sales module
- [ ] Can click "Create New Sale" without error
- [ ] Can fill in form fields
- [ ] Can submit form to create a sale
- [ ] Sale appears in the list
- [ ] Limited users cannot create sales (Agent role)
- [ ] No console errors related to permissions

---

## Known Limitations

- The fix uses temporary placeholder sales objects (`{ id: 'temp' } as any`) for methods that require a sale parameter but are being checked in a context where no sale exists yet
- This is acceptable because these permission checks don't actually use the sale data - they only check if the user's role has the required permission
- In the future, these methods could be refactored to have both variants (with/without sale)

---

## Prevention for Future

To prevent similar issues:
1. ✅ Always check that method calls match the signature
2. ✅ Test permission checks in the UI (not just in database)
3. ✅ Verify all permission results are properly accessed (use `.allowed` property)
4. ✅ Include `canCreate` checks when loading all permissions
5. ✅ Test with both admin and limited users

---

## Support & Questions

If you encounter issues:
1. Check browser console for permission check logs
2. Verify user is logged in with correct role
3. Run database verification queries above
4. Check that migration 017 was applied
5. Clear browser cache and session

---

## Version History

| Version | Date | Status | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-28 | Superseded | Initial fix document (incorrect diagnosis) |
| 2.0.0 | 2025-01-29 | Current | Correct root cause: hook calling wrong method with wrong params |
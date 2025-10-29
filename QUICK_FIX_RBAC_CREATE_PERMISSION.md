---
title: Quick Fix - RBAC Create Permission Issue
description: Step-by-step guide to fix "Permission Denied" error for product sales creation
date: 2025-01-29
version: 1.0.0
---

# Quick Fix Guide - RBAC Create Permission Issue

## Problem
You're getting "Permission Denied - You do not have permission to create product sales" error, even though you have the correct role assigned.

## Root Cause
The permission loading hook was calling the wrong method with incorrect parameters and not checking the `canCreate` permission at all.

## Solution Applied
✅ **Fixed File**: `src/modules/features/product-sales/hooks/useProductSalesPermissions.ts`

The hook now properly checks all permissions including `canCreate` by calling individual permission check methods.

---

## What You Need to Do

### 1. **Pull the Latest Code**
```bash
git pull origin main
```

### 2. **Rebuild the Application**
```bash
npm run build
```

✅ **Build Status**: PASSED (no TypeScript errors)

### 3. **Start Development Server**
```bash
npm run dev
```

### 4. **Test the Fix**

#### Test 1: Login and Navigate
1. Open http://localhost:5173
2. Log in with: **admin@acme.com** / password: **password**
3. Navigate to **Product Sales** module

#### Test 2: Create Product Sale
1. Click **"Create New Sale"** button
2. **Expected Result**: 
   - ✅ Form opens WITHOUT "Permission Denied" error
   - ✅ Can see all form fields
   - ✅ Can enter data

3. Fill in the form:
   - Customer: Select any customer
   - Product: Select any product
   - Quantity: 100
   - Unit Price: 1000
   - Click **Save**

4. **Expected Result**:
   - ✅ Sale is created successfully
   - ✅ Appears in the sales list
   - ✅ No permission errors

#### Test 3: Verify Browser Console
1. Open **Developer Tools** (F12)
2. Go to **Console** tab
3. **You should see logs like**:
   ```
   [validateRolePermissions] User has permission "manage_product_sales" for action "product_sales:create"
   [validateRolePermissions] User has permission "manage_product_sales" for action "product_sales:view"
   [validateRolePermissions] User has permission "manage_product_sales" for action "product_sales:edit"
   ```

---

## Verification Checklist

| Check | Status | Details |
|-------|--------|---------|
| Build succeeds | ✅ | No TypeScript errors |
| Form opens | 📋 | No "Permission Denied" error |
| Can create sale | 📋 | Sale is saved to database |
| Console logs show permission granted | 📋 | Look for "User has permission" logs |
| Other actions work | 📋 | View, Edit, Delete all work |

---

## What Changed?

**Before (Broken)**:
```typescript
// Called wrong method with wrong parameters
const availableActions = await productSalesRbacService.getAvailableActions(tenantId);
// ❌ This method requires a sale object, not tenantId
// ❌ This method doesn't even check canCreate
```

**After (Fixed)**:
```typescript
// Calls each permission method correctly
const createResult = await productSalesRbacService.canCreateProductSale(tenantId);
// ✅ This checks product_sales:create action
// ✅ This returns a PermissionResult with .allowed property
// ✅ Hook now properly sets canCreate: true/false
```

---

## If You Still Get an Error

### Check 1: Database Seeding
Verify that users are assigned to roles:
```bash
supabase psql

-- Inside psql:
SELECT u.email, r.name FROM user_roles ur
  JOIN users u ON ur.user_id = u.id
  JOIN roles r ON ur.role_id = r.id
  WHERE u.email = 'admin@acme.com';
```

**Expected Result**: Should show one row with email and role name

### Check 2: Browser Cache
Clear your browser cache:
1. Press **Ctrl+Shift+Delete** (Windows) or **Cmd+Shift+Delete** (Mac)
2. Clear **All time** → **Cache**
3. Refresh the page (Ctrl+F5)

### Check 3: Console Logs
Look for error messages in the browser console (F12):
- If you see `[validateRolePermissions] User has no roles assigned` → Re-run migrations
- If you see `[validateRolePermissions] Unable to map action` → There's a new action type not mapped

### Check 4: Re-run Migrations
```bash
supabase db reset
# or
supabase db push
```

---

## Users & Roles for Testing

| Email | Password | Tenant | Role | Can Create Sales? |
|-------|----------|--------|------|-------------------|
| admin@acme.com | password | Acme | Super Admin | ✅ YES |
| manager@acme.com | password | Acme | Manager | ✅ YES |
| engineer@acme.com | password | Acme | Engineer | ✅ YES |
| user@acme.com | password | Acme | Agent | ❌ NO |
| admin@techsolutions.com | password | Tech Solutions | Admin | ✅ YES |

---

## Summary

| Item | Status | Details |
|------|--------|---------|
| **Issue** | 🔧 FIXED | Hook was calling wrong method |
| **Root Cause** | 🔍 IDENTIFIED | Missing `canCreate` permission check |
| **Solution** | ✅ IMPLEMENTED | Updated hook to check all permissions correctly |
| **Testing** | 📋 REQUIRED | Follow Test 1, 2, 3 above |
| **Build** | ✅ SUCCESS | Compiled without errors |

---

## Next Steps

1. ✅ Run `npm run build` (already done, passed)
2. ✅ Pull latest code: `git pull origin main`
3. ✅ Run dev server: `npm run dev`
4. 📋 Test with admin account (see Test 1-3 above)
5. 📋 Test with limited user (Optional)
6. 📋 Verify console logs show permission granted
7. ✅ Deploy to production when ready

---

## Technical Details (For Reference)

### Permission Flow
```
User clicks "Create New Sale"
    ↓
ProductSaleFormPanel uses useProductSalesPermissions hook
    ↓
Hook calls canCreateProductSale(tenantId)
    ↓
RBAC Service converts action to permission: product_sales:create → manage_product_sales
    ↓
Queries database: user_roles + roles tables
    ↓
Checks if user's roles contain "manage_product_sales" permission
    ↓
Returns { allowed: true/false }
    ↓
Hook sets permissions.canCreate = true/false
    ↓
Form shows/hides based on permission
```

### Files Modified
- `src/modules/features/product-sales/hooks/useProductSalesPermissions.ts` (Lines 68-115)

### Related Services
- `src/modules/features/product-sales/services/productSalesRbacService.ts` (unchanged)
- `src/services/api/supabase/rbacService.ts` (unchanged)
- `src/services/serviceFactory.ts` (unchanged)

---

## Questions?

If something doesn't work as expected:
1. Check the console for error messages
2. Verify database seeding (Check 1 above)
3. Review the detailed fix document: `RBAC_PERMISSION_CREATE_FIX_2025_01_29.md`
4. Check your user's role in the database

---

**Last Updated**: 2025-01-29  
**Status**: Ready for Testing  
**Build**: ✅ SUCCESS
---
title: Product Sales RBAC Permission Fix
description: Complete guide to fix "Permission Denied" error when creating product sales
date: 2025-01-28
author: AI Agent
version: 1.0.0
status: active
projectName: PDS-CRM Product Sales Module
category: bugfix
severity: critical
---

# Product Sales RBAC Permission Fix - Complete Guide

## Issue Summary

**Error**: "You do not have permission to create product sales"

**Root Cause**: Users were not assigned to any roles in the database. The RBAC system queries the `user_roles` table to find the user's roles and check permissions, but this table was empty.

**Affected Component**: Product Sales Module (all RBAC permission checks)

---

## What Was Fixed

### 1. ✅ Missing Role Assignments (Primary Fix)
- **File**: `supabase/seed.sql` (updated)
- **New Migration**: `supabase/migrations/20250101000017_seed_roles_and_user_roles.sql` (created)
- **What**: Added role creation and user-to-role assignments for all seed users

### 2. ✅ Ant Design Spin Component Warnings
- **Files Updated**:
  - `src/modules/features/product-sales/components/ProductSaleFormPanel.tsx`
  - `src/modules/features/product-sales/components/ProductSalesList.tsx`
  - `src/modules/features/product-sales/components/InvoiceEmailModal.tsx`
- **What**: Fixed `tip` prop warnings by removing tips from non-nested Spin components

---

## How to Apply the Fix

### Option 1: Using Supabase CLI (Recommended)

#### Step 1: Reset and Re-seed Database

```bash
# Navigate to project root
cd c:\Users\RZ\source\repos\PDS-CRM-Application\CRMV9_NEWTHEME

# Ensure Supabase is running
supabase start

# Reset the database and re-apply migrations
supabase db reset

# The seed data will be automatically applied
```

#### Step 2: Verify the Fix

```bash
# Connect to Supabase and run verification queries
supabase psql

-- Inside psql console:
SELECT COUNT(*) as role_count FROM roles;
SELECT COUNT(*) as user_role_count FROM user_roles;
SELECT u.email, r.name FROM user_roles ur
  JOIN users u ON ur.user_id = u.id
  JOIN roles r ON ur.role_id = r.id
  ORDER BY u.email;
```

### Option 2: Manual SQL Execution

If you prefer manual execution:

```bash
# 1. Connect to Supabase
supabase psql

# 2. Inside psql, execute the migration file
\i supabase/migrations/20250101000017_seed_roles_and_user_roles.sql

# 3. Execute the seed script
\i supabase/seed.sql
```

### Option 3: Through Supabase Dashboard

1. Go to **SQL Editor** in Supabase Dashboard
2. Create a new query
3. Paste contents of `supabase/migrations/20250101000017_seed_roles_and_user_roles.sql`
4. Execute the query
5. Repeat with `supabase/seed.sql` (sections 14-15 only)

---

## What Gets Fixed

### Roles Created Per Tenant

#### Acme Corporation (tenant_id: 550e8400-e29b-41d4-a716-446655440001)
- **Super Administrator** → `crm:product-sale:record:update` permission
- **Administrator** → `crm:product-sale:record:update` permission
- **Manager** → `crm:product-sale:record:update` permission
- **Agent** → Limited permissions (no product sales)
- **Engineer** → `crm:product-sale:record:update` permission

#### Tech Solutions Inc (tenant_id: 550e8400-e29b-41d4-a716-446655440002)
- **Super Administrator** → `crm:product-sale:record:update` permission
- **Administrator** → `crm:product-sale:record:update` permission
- **Manager** → `crm:product-sale:record:update` permission

#### Global Trading Ltd (tenant_id: 550e8400-e29b-41d4-a716-446655440003)
- **Super Administrator** → `crm:product-sale:record:update` permission

### Users Assigned to Roles

| Email | Tenant | Role | Can Create Sales? |
|-------|--------|------|-------------------|
| admin@acme.com | Acme | Super Admin | ✅ YES |
| manager@acme.com | Acme | Manager | ✅ YES |
| engineer@acme.com | Acme | Engineer | ✅ YES |
| user@acme.com | Acme | Agent | ❌ NO |
| admin@techsolutions.com | Tech Solutions | Administrator | ✅ YES |
| manager@techsolutions.com | Tech Solutions | Manager | ✅ YES |
| admin@globaltrading.com | Global Trading | Super Admin | ✅ YES |

---

## Technical Details

### Database Schema

**Roles Table** (`roles`)
```sql
- id: UUID (primary key)
- name: VARCHAR (e.g., "Manager")
- description: TEXT
- tenant_id: UUID (foreign key to tenants)
- is_system_role: BOOLEAN
- permissions: JSONB array of permission strings
- created_at, updated_at: TIMESTAMPS
```

**User Roles Table** (`user_roles`)
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- role_id: UUID (foreign key to roles)
- tenant_id: UUID (foreign key to tenants)
- assigned_at: TIMESTAMP
- assigned_by: UUID (foreign key to users)
- CONSTRAINT: unique(user_id, role_id, tenant_id)
```

### Permission Resolution Flow

```
1. User attempts action (e.g., create product sale)
   ↓
2. productSalesRbacService.canCreateProductSale() called
   ↓
3. Maps action to permission: "crm:product-sale:record:create" → "crm:product-sale:record:update"
   ↓
4. rbacService.validateRolePermissions() called
   ↓
5. Queries user_roles table: SELECT role_id WHERE user_id = ? AND tenant_id = ?
   ↓
6. For each role_id, queries roles table: SELECT permissions WHERE id = ?
   ↓
7. Checks if "crm:product-sale:record:update" exists in role permissions
   ↓
8. Returns TRUE (allowed) or FALSE (denied)
```

---

## Verification Checklist

After applying the fix, verify:

- [ ] Database has been reset/migrations applied
- [ ] New migration `20250101000017_seed_roles_and_user_roles.sql` exists
- [ ] Seed data updated with role assignments (lines 479-722)
- [ ] Roles table has 10+ records
- [ ] User_roles table has 7+ records (one per seed user)
- [ ] User is logged in with admin or manager account
- [ ] Can create product sale without permission error
- [ ] No "User has no roles assigned" warnings in console
- [ ] No Ant Design Spin `tip` warnings in console

---

## Testing the Fix

### Test Case 1: Create Product Sale (Admin User)

**User**: admin@acme.com  
**Tenant**: Acme Corporation  
**Role**: Super Administrator

1. Log in to application
2. Navigate to Product Sales module
3. Click "Create New Sale"
4. Expected: Form loads without permission error
5. Expected: Can create sale successfully

### Test Case 2: Create Product Sale (Manager User)

**User**: manager@acme.com  
**Tenant**: Acme Corporation  
**Role**: Manager

1. Log in to application
2. Navigate to Product Sales module
3. Click "Create New Sale"
4. Expected: Form loads without permission error
5. Expected: Can create sale successfully

### Test Case 3: Create Product Sale (Agent User - Should Fail)

**User**: user@acme.com  
**Tenant**: Acme Corporation  
**Role**: Agent

1. Log in to application
2. Navigate to Product Sales module
3. Try to access create form
4. Expected: Permission denied message appears
5. Expected: Form is disabled/unavailable

---

## Code Changes Summary

### New Migration File
**Path**: `supabase/migrations/20250101000017_seed_roles_and_user_roles.sql`
- Creates roles for 3 tenants
- Assigns users to appropriate roles
- ~100 lines of SQL

### Modified Files

#### 1. supabase/seed.sql
**Lines Added**: 479-722  
**Section**: "14. ROLES - CREATE SYSTEM ROLES FOR EACH TENANT"  
**What**: Inserts roles and user_role assignments

#### 2. src/modules/features/product-sales/components/ProductSaleFormPanel.tsx
**Line 252**: Changed `<Spin size="large" tip="..." />` to `<Spin size="large" spinning fullscreen />`  
**Why**: Fixes Ant Design Spin tip prop warning

#### 3. src/modules/features/product-sales/components/ProductSalesList.tsx
**Line 394**: Changed `<Spin size="large" tip="..." />` to `<Spin size="large" spinning />`  
**Why**: Fixes Ant Design Spin tip prop warning

#### 4. src/modules/features/product-sales/components/InvoiceEmailModal.tsx
**Line 175**: Removed `tip="Processing..."` from Spin component  
**Why**: Fixes Ant Design Spin tip prop warning

---

## Troubleshooting

### Issue: Still Getting "User has no roles assigned" Warning

**Solution**:
1. Verify database reset was applied: `SELECT COUNT(*) FROM user_roles;` should return > 0
2. Verify user is logged in: Check browser console for current user info
3. Verify migration was applied: Check Supabase migrations list
4. Clear browser cache and session: Hard refresh or incognito window

### Issue: Roles Table is Empty

**Solution**:
1. Run migration manually: `supabase db push`
2. Or execute migration SQL directly in Supabase Dashboard
3. Verify migration file exists: `supabase/migrations/20250101000017_seed_roles_and_user_roles.sql`

### Issue: User is Assigned to Wrong Role

**Solution**:
1. Check `user_roles` table: Which role_id is assigned to user_id?
2. Check `roles` table: What permissions does that role have?
3. Manual fix: `DELETE FROM user_roles WHERE user_id = ?` then re-run migrations
4. Or use application UI to reassign roles (if admin panel available)

### Issue: Permission Still Denied After Fix

**Solution**:
1. Verify user's role has "crm:product-sale:record:update" permission
2. Check `roles.permissions` JSONB column contains "crm:product-sale:record:update"
3. Verify user's tenant_id matches role's tenant_id
4. Check browser console for detailed permission check logs

---

## Related Files & References

- **Product Sales RBAC Service**: `src/modules/features/product-sales/services/productSalesRbacService.ts`
- **RBAC Service**: `src/services/api/supabase/rbacService.ts`
- **Permission Validation**: Lines 450-522 in `src/services/api/supabase/rbacService.ts`
- **Repository Rules**: `.zencoder/rules/repo.md` (see RBAC section)
- **Service Factory Pattern**: `.zencoder/rules/repo.md` (see Service Factory section)

---

## FAQ

**Q: Why do I need roles if I'm already authenticated?**  
A: Authentication (are you logged in?) is separate from Authorization (can you do X?). Roles control permissions for specific actions.

**Q: Can I assign custom permissions to roles?**  
A: Yes, via the Admin panel or directly in database. Permissions are stored in `roles.permissions` JSONB array.

**Q: What's the difference between "crm:product-sale:record:update" and "crm:sales:deal:update"?**  
A: These are separate modules:
- `crm:product-sale:record:update` = Product Sales module (inventory transactions)
- `crm:sales:deal:update` = Sales module (deals and opportunities)

**Q: Can a user have multiple roles?**  
A: Yes, via multiple `user_roles` records for the same user_id with different role_ids.

**Q: How do I add a new permission?**  
A: 
1. Add permission string to role's `permissions` JSONB array
2. Or insert new record in `permissions` table (optional for documentation)
3. Restart application for permission checks to use new permission

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-28 | Initial fix: Added role creation and user assignments + Ant Design Spin warnings |

---

## Next Steps

1. ✅ Apply the database fix using one of the three options above
2. ✅ Verify with the provided test cases
3. ✅ Test login with different users
4. ✅ Create product sales without permission errors
5. 📖 Review RBAC documentation: `.zencoder/rules/repo.md`
6. 🔄 For custom roles, use Admin panel or modify seed data

---

## Support

For additional issues or questions:
1. Check console logs for specific error messages
2. Review RBAC Service error messages in browser console
3. Verify user has proper role assigned
4. Check tenant_id matches between user and roles
5. Review `productSalesRbacService.ts` for permission check logic
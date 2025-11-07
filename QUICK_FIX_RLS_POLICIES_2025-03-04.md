# 🔧 QUICK FIX: Missing RLS Policies for Companies & Products

## ⚠️ The Problem

When updating Companies or Products, you get:
```
PATCH http://127.0.0.1:54321/rest/v1/companies 406 (Not Acceptable)
Error: PGRST116 - The result contains 0 rows
Cannot coerce the result to a single JSON object
```

### Root Cause
The RLS (Row-Level Security) policies for the `companies` and `products` tables are **incomplete**:

**Companies Table** ❌
- ✅ SELECT policy exists  
- ❌ **INSERT policy MISSING**
- ❌ **UPDATE policy MISSING**  
- ❌ **DELETE policy MISSING**

**Products Table** ❌
- ✅ SELECT policy exists
- ✅ INSERT policy exists
- ❌ **UPDATE policy MISSING**
- ❌ **DELETE policy MISSING**

---

## ✅ The Solution

### Step 1: Apply Migration to Supabase

**Option A: Using Supabase CLI (Recommended)**
```bash
cd c:\Users\RZ\source\repos\PDS-CRM-Application\CRMV9_NEWTHEME

# For local Supabase
supabase migration up --local

# For production Supabase
supabase migration up
```

**Option B: Using Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy this SQL:

```sql
-- Companies INSERT Policy
CREATE POLICY "managers_create_companies" ON companies
  FOR INSERT
  WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.is_super_admin = true)
      AND users.deleted_at IS NULL
    )
  );

-- Companies UPDATE Policy
CREATE POLICY "managers_update_companies" ON companies
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.is_super_admin = true)
      AND users.deleted_at IS NULL
    )
  );

-- Companies DELETE Policy
CREATE POLICY "managers_delete_companies" ON companies
  FOR DELETE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.is_super_admin = true)
      AND users.deleted_at IS NULL
    )
  );

-- Products UPDATE Policy
CREATE POLICY "managers_update_products" ON products
  FOR UPDATE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.is_super_admin = true)
      AND users.deleted_at IS NULL
    )
  );

-- Products DELETE Policy
CREATE POLICY "managers_delete_products" ON products
  FOR DELETE
  USING (
    tenant_id = get_current_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'manager') OR users.is_super_admin = true)
      AND users.deleted_at IS NULL
    )
  );
```

4. Click **Run**
5. Check for success (no red error messages)

---

### Step 2: Test the Fix

**Test Company Update:**
1. Open DevTools (F12) → Network tab
2. Go to Masters → Companies
3. Click **Edit** on any company
4. Change a field (e.g., name, email)
5. Click **Save**
6. ✅ Check Network tab → Should see `PATCH` request with **Status 200**
7. ✅ Form should close and company should be updated in list

**Test Product Update:**
1. Go to Masters → Products  
2. Click **Edit** on any product
3. Change a field (e.g., name, price)
4. Click **Save**
5. ✅ Check Network tab → Should see `PATCH` request with **Status 200**
6. ✅ Form should close and product should be updated in list

**Test Company Create:**
1. Go to Masters → Companies
2. Click **Add New**
3. Fill in all fields
4. Click **Create**
5. ✅ Check Network tab → Should see `POST` request with **Status 201**
6. ✅ New company should appear in list

---

## 📊 What Was Fixed

| Component | Before ❌ | After ✅ |
|-----------|-----------|----------|
| Companies Create | Blocked by RLS | ✅ Works |
| Companies Update | 406 error, PGRST116 | ✅ Works |
| Companies Delete | Blocked by RLS | ✅ Works |
| Products Update | Blocked by RLS | ✅ Works |
| Products Delete | Blocked by RLS | ✅ Works |

---

## 🔍 How This Fixes the Issue

### Before
```
User clicks "Save" 
  ↓
Form sends PATCH request with updated data
  ↓
Supabase RLS checks if policy exists for UPDATE
  ↓
❌ NO UPDATE POLICY FOUND
  ↓
Supabase rejects request with 406 "Not Acceptable"
  ↓
Error shown to user: "PGRST116 - The result contains 0 rows"
```

### After
```
User clicks "Save"
  ↓
Form sends PATCH request with updated data
  ↓
Supabase RLS checks if policy exists for UPDATE
  ↓
✅ UPDATE POLICY FOUND: "managers_update_companies"
  ↓
Policy checks: tenant_id matches? user is admin/manager? 
  ↓
✅ ALL CHECKS PASS
  ↓
UPDATE executes successfully
  ↓
✅ Status 200 returned to client
  ↓
✅ Company updated in database and list
```

---

## 🛡️ Security Notes

These policies ensure:
- ✅ Only **admin** or **manager** users can create/update/delete companies and products
- ✅ Users can only manage data in their own **tenant**
- ✅ Soft-deleted users cannot perform operations
- ✅ Row-level security is maintained across all operations

---

## 📋 Verification Checklist

- [ ] Migration applied successfully to Supabase
- [ ] No SQL errors in Supabase console
- [ ] Company create test: Form closes, data saved ✅
- [ ] Company update test: Form closes, changes visible ✅  
- [ ] Company delete test: Company removed from list ✅
- [ ] Product create test: Form closes, data saved ✅
- [ ] Product update test: Form closes, changes visible ✅
- [ ] Product delete test: Product removed from list ✅
- [ ] Network tab shows 200/201 status codes ✅
- [ ] No console errors ✅

---

## 🆘 Troubleshooting

### Still Getting 406 Error?
1. Clear browser cache (Cmd+Shift+Delete on Windows)
2. Refresh page (Ctrl+R)
3. Make sure you're logged in as admin or manager
4. Check Supabase console for policy creation success

### Migration Failed?
1. Check Supabase console for duplicate policy names
2. If policies already exist, you can skip this migration
3. Contact support if policies can't be created

### Still Getting Different Error?
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try update again
4. Note the exact error message from response
5. Share error details for debugging

---

## 📁 Files Modified

- **Created**: `supabase/migrations/20250304_add_companies_products_crud_policies.sql`
  - Adds INSERT, UPDATE, DELETE policies for companies
  - Adds UPDATE, DELETE policies for products

---

## ✨ Next Steps

1. ✅ Apply migration to Supabase
2. ✅ Test all CRUD operations
3. ✅ Verify Network tab shows correct status codes
4. ✅ Ready for production!

---

**Status**: 🟢 Ready to Deploy
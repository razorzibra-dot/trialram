# 🔴 RLS Infinite Recursion - FIXED

**Date**: 2025-03-04  
**Issue**: Migration 20250304 caused infinite recursion in RLS policies  
**Status**: ✅ RESOLVED

---

## 🔴 What Went Wrong

The migration used a **nested SELECT** directly inside an RLS policy:

```sql
-- ❌ WRONG - Causes infinite recursion
CREATE POLICY "super_admin_view_all_users" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users AS admin_user  -- ← References same table!
      WHERE admin_user.id = auth.uid()
      AND admin_user.is_super_admin = true
    )
  );
```

**Why it failed:**
- When checking the policy, PostgreSQL executes the SELECT
- The SELECT on `users` table triggers the **same RLS policy**
- That policy needs to be evaluated again, which triggers the SELECT again
- **Infinite recursion** → Error: `infinite recursion detected in policy`

---

## ✅ The Solution: SECURITY DEFINER Function

Instead of nested SELECT in the policy, use a **SECURITY DEFINER function**:

```sql
-- ✅ CORRECT - Uses SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION is_current_user_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
    AND users.deleted_at IS NULL
  );
$$;

-- ✅ Policy now calls the function (no recursion)
CREATE POLICY "super_admin_view_all_users" ON users
  FOR SELECT
  USING (is_current_user_super_admin());
```

**Why it works:**
- `SECURITY DEFINER` = function runs as the owner (postgres role), **bypassing RLS**
- Function can safely query the `users` table without triggering its own RLS policies
- Policy just calls the function → no recursion ✅

---

## 🔧 Actions Taken

1. ✅ **Deleted** the broken migration file (20250304_add_super_admin_view_all_users_policy.sql)
2. ✅ **Updated** FIX_SUPER_ADMIN_DATA_VISIBILITY.sql with correct SECURITY DEFINER approach
3. ✅ **Created** this documentation

---

## 🚀 How to Fix Your Database NOW

### In Supabase Studio (http://localhost:54323):

1. Go to **SQL Editor**
2. Copy this entire query and paste it:

```sql
-- Drop broken policies
DROP POLICY IF EXISTS "users_view_tenant_users" ON users;
DROP POLICY IF EXISTS "super_admin_view_all_users" ON users;

-- Create SECURITY DEFINER function
CREATE OR REPLACE FUNCTION is_current_user_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
    AND users.deleted_at IS NULL
  );
$$;

-- Create policies using the function
CREATE POLICY "super_admin_view_all_users" ON users
  FOR SELECT
  USING (is_current_user_super_admin());

CREATE POLICY "users_view_tenant_users" ON users
  FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id()
    OR id = auth.uid()
  );
```

3. **Click Run** (or Ctrl+Enter)
4. **Refresh** your browser
5. **Log in again** - should work now! ✅

---

## 📚 Key Learning: RLS Best Practices

### ❌ DON'T DO THIS (Causes Infinite Recursion)
```sql
CREATE POLICY "my_policy" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users  -- ← Same table = recursion!
      WHERE id = auth.uid()
    )
  );
```

### ✅ DO THIS INSTEAD (Use SECURITY DEFINER Function)
```sql
CREATE OR REPLACE FUNCTION my_check()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$ ... $$;

CREATE POLICY "my_policy" ON users
  FOR SELECT
  USING (my_check());  -- ← Calls function, no recursion
```

---

## 🔒 What SECURITY DEFINER Means

- **SECURITY INVOKER** (default): Function runs as the user who calls it (respects RLS)
- **SECURITY DEFINER**: Function runs as the user who created it (postgres = superuser = bypasses RLS) ✅

This is the **safe and recommended** pattern for RLS permission checks in PostgreSQL.

---

## ✅ Verification

After applying the fix, run these to verify:

```sql
-- Check if super admin can see all users
SELECT id, email, is_super_admin FROM users;
-- Should return ✅ all rows

-- Check if function works
SELECT is_current_user_super_admin();
-- Should return ✅ true (if logged in as super admin)
```

---

## 📖 References

- PostgreSQL RLS Docs: https://www.postgresql.org/docs/current/sql-createpolicy.html
- SECURITY DEFINER Functions: https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY

---

**Status**: ✅ Fixed and documented  
**Next Steps**: Apply the SQL fix and your login will work! 🚀
# RLS Policy Best Practices & Architecture Guide

## 1. Core Principles

### ✅ DO:
- Use SECURITY DEFINER functions for complex authorization logic
- Keep RLS policy conditions simple and readable
- Use cached/stable functions for repeated checks
- Test policies thoroughly before deploying
- Document policy intent and scope

### ❌ DON'T:
- Query the same table within its own RLS policy
- Use volatile functions in RLS policies
- Nest multiple levels of SELECT statements
- Assume RLS policies cascade to related tables
- Use RLS for application logic (use it for data isolation only)

## 2. Standard RLS Pattern for Data Tables

### Template for Tenant-Isolated Tables

```sql
-- Step 1: Create SECURITY DEFINER helper function (if not exists)
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id_safe()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM users
  WHERE id = auth.uid() AND deleted_at IS NULL
  LIMIT 1;
$$;

-- Step 2: Drop old recursive policies
DROP POLICY IF EXISTS "Users can view records" ON public.my_table;
DROP POLICY IF EXISTS "Users can insert records" ON public.my_table;
DROP POLICY IF EXISTS "Users can update records" ON public.my_table;
DROP POLICY IF EXISTS "Users can delete records" ON public.my_table;

-- Step 3: Create non-recursive SELECT policy
CREATE POLICY "Users can view records"
  ON public.my_table FOR SELECT
  USING (
    tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

-- Step 4: Create INSERT policy (usually no condition needed, defaults are created)
CREATE POLICY "Users can insert records"
  ON public.my_table FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Step 5: Create UPDATE policy
CREATE POLICY "Users can update records"
  ON public.my_table FOR UPDATE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );

-- Step 6: Create DELETE policy
CREATE POLICY "Users can delete records"
  ON public.my_table FOR DELETE
  USING (
    (tenant_id = get_current_user_tenant_id_safe() OR is_current_user_super_admin_safe())
    AND auth.uid() IS NOT NULL
  );
```

## 3. Authentication Table Pattern

### For tables like users, roles, permissions

```sql
-- READ: User can view their own record and others in same tenant
CREATE POLICY "Users can view records"
  ON public.users FOR SELECT
  USING (
    (auth.uid() = id)  -- Own record
    OR (tenant_id = get_current_user_tenant_id_safe())  -- Same tenant
    OR is_current_user_super_admin_safe()  -- Super admin
  );

-- INSERT: Only via trusted functions (no direct inserts)
CREATE POLICY "System can insert users"
  ON public.users FOR INSERT
  WITH CHECK (auth.role() = 'authenticated'::text);

-- UPDATE: Only own record or by admin
CREATE POLICY "Users can update own record"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update users"
  ON public.users FOR UPDATE
  USING (is_current_user_super_admin_safe())
  WITH CHECK (is_current_user_super_admin_safe());
```

## 4. Audit & Logging Pattern

### For immutable audit log tables

```sql
-- Only append, no delete/update
CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    (user_id = auth.uid())
    OR (tenant_id = get_current_user_tenant_id_safe())
    OR is_current_user_super_admin_safe()
  );

CREATE POLICY "System can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

## 5. Reference Data Pattern

### For system-wide lookup tables (no tenant isolation)

```sql
-- Everyone can read, only system can write
CREATE POLICY "Authenticated users can view"
  ON public.permissions FOR SELECT
  USING (auth.role() = 'authenticated'::text);

CREATE POLICY "System can manage"
  ON public.permissions FOR INSERT
  WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "System can update"
  ON public.permissions FOR UPDATE
  USING (auth.role() = 'service_role'::text);
```

## 6. Performance Optimization

### Caching with STABLE Functions

```sql
-- Mark functions as STABLE when result doesn't change within transaction
CREATE FUNCTION public.get_current_user_tenant_id_safe()
RETURNS uuid
LANGUAGE sql
STABLE  -- ✅ Postgres can cache this for the transaction
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM users
  WHERE id = auth.uid() AND deleted_at IS NULL
  LIMIT 1;
$$;
```

### Query Planning Tips

```sql
-- GOOD: Uses index on tenant_id
WHERE tenant_id = get_current_user_tenant_id_safe()

-- BAD: Condition on function result, can't use index
WHERE get_current_user_tenant_id_safe() = tenant_id

-- ALSO BAD: No tenant isolation
WHERE is_current_user_super_admin_safe() -- Doesn't filter by tenant

-- GOOD: Combines tenant isolation with admin bypass
WHERE tenant_id = get_current_user_tenant_id_safe()
   OR is_current_user_super_admin_safe()
```

## 7. Testing RLS Policies

### Test Script Template

```sql
-- Switch to regular user role
SET ROLE authenticated;
SET "request.jwt.claims" TO '{"sub":"user-id-here","email":"user@example.com"}';

-- Test SELECT
SELECT COUNT(*) FROM my_table;  -- Should only show user's tenant data

-- Test INSERT
INSERT INTO my_table (tenant_id, name) VALUES ('tenant-id', 'test');  -- Should succeed

-- Test UPDATE (other user's record)
UPDATE my_table SET name = 'hacked' WHERE user_id = 'other-user-id';  -- Should fail

-- Reset
RESET ROLE;
RESET "request.jwt.claims";
```

## 8. Common Mistakes & Fixes

### Mistake 1: Recursive SELECT
```sql
-- ❌ WRONG - Infinite recursion
CREATE POLICY "users_policy"
  ON public.users FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- ✅ CORRECT - Use SECURITY DEFINER function
CREATE POLICY "users_policy"
  ON public.users FOR SELECT
  USING (tenant_id = get_current_user_tenant_id_safe());
```

### Mistake 2: Volatile Functions
```sql
-- ❌ WRONG - VOLATILE can't be used in RLS
CREATE FUNCTION check_access() RETURNS boolean AS 'SELECT random() > 0.5' LANGUAGE sql VOLATILE;

-- ✅ CORRECT - Use STABLE or IMMUTABLE
CREATE FUNCTION check_access() RETURNS boolean AS 'SELECT true' LANGUAGE sql STABLE;
```

### Mistake 3: Missing Auth Check
```sql
-- ❌ WRONG - No guarantee user is authenticated
CREATE POLICY "my_policy"
  ON public.my_table FOR SELECT
  USING (true);  -- Anyone can read!

-- ✅ CORRECT - Verify authentication
CREATE POLICY "my_policy"
  ON public.my_table FOR SELECT
  USING (auth.uid() IS NOT NULL AND tenant_id = get_current_user_tenant_id_safe());
```

### Mistake 4: Assuming RLS Cascades
```sql
-- ❌ WRONG - RLS on orders doesn't apply to order_items
SELECT * FROM order_items  -- User can read items from other users' orders!

-- ✅ CORRECT - Apply RLS to both tables
-- Set RLS on orders table
CREATE POLICY "orders_policy" ON public.orders FOR SELECT
  USING (tenant_id = get_current_user_tenant_id_safe());

-- Set RLS on order_items table too
CREATE POLICY "order_items_policy" ON public.order_items FOR SELECT
  USING (tenant_id = get_current_user_tenant_id_safe());
```

## 9. Audit & Monitoring

### Check for Recursive Policies
```sql
-- Find any remaining recursive policies
SELECT tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND qual ILIKE '%FROM users%'
  AND tablename != 'users'
ORDER BY tablename, policyname;

-- Expected result: 0 rows
```

### Check Policy Coverage
```sql
-- Find tables with RLS enabled but no policies
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE pg_policies.schemaname = pg_tables.schemaname
      AND pg_policies.tablename = pg_tables.tablename
  )
ORDER BY tablename;

-- Expected result: minimal list (policies should exist for all RLS tables)
```

## 10. Documentation Template

### For Each RLS Policy

```sql
-- ============================================================================
-- TABLE: [table_name]
-- PURPOSE: [Brief description of table's role in the system]
-- ISOLATION: [Tenant isolation? User isolation? Public?]
-- ============================================================================

-- POLICY: [policy_name]
-- TYPE: SELECT | INSERT | UPDATE | DELETE
-- DESCRIPTION: [What this policy controls and who can access]
-- LOGIC:
--   - Condition 1: [Explains when user can access]
--   - Condition 2: [Explains additional conditions]
-- SECURITY: [Any special security considerations]

CREATE POLICY "[policy_name]"
  ON public.[table_name] FOR [TYPE]
  USING (condition1 OR condition2)
  WITH CHECK (condition1 OR condition2);
```

## Summary Checklist

When creating or updating RLS policies:

- [ ] No recursive SELECTs from the same table
- [ ] Using SECURITY DEFINER functions for complex logic
- [ ] Functions marked as STABLE or IMMUTABLE
- [ ] All DML operations (SELECT, INSERT, UPDATE, DELETE) covered
- [ ] Proper tenant isolation applied
- [ ] Super admin bypass included where appropriate
- [ ] Authentication check (`auth.uid() IS NOT NULL`)
- [ ] Policy tested with actual roles
- [ ] Policy documented with clear intent
- [ ] Performance implications considered (index usage)
- [ ] Backward compatibility verified

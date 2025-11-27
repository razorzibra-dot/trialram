-- ============================================================================
-- RLS POLICY AUDIT REPORT
-- ============================================================================
-- Checking all RLS policies in the public schema for potential recursion issues
--
-- A recursion issue occurs when:
-- 1. A table T has an RLS policy with a SELECT statement
-- 2. That SELECT statement queries table T itself
-- 3. The query is triggered during data access, causing the policy to re-check
-- 4. This creates an infinite loop
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN qual ILIKE '%FROM users%' AND tablename = 'users' THEN 'RECURSIVE - USERS'
    WHEN qual ILIKE '%FROM user_roles%' AND tablename = 'user_roles' THEN 'RECURSIVE - USER_ROLES'
    WHEN qual ILIKE '%FROM roles%' AND tablename = 'roles' THEN 'RECURSIVE - ROLES'
    WHEN qual ILIKE '%FROM role_permissions%' AND tablename = 'role_permissions' THEN 'RECURSIVE - ROLE_PERMISSIONS'
    WHEN qual ILIKE '%FROM permissions%' AND tablename = 'permissions' THEN 'RECURSIVE - PERMISSIONS'
    ELSE 'OK'
  END AS risk_status,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY risk_status DESC, tablename, policyname;

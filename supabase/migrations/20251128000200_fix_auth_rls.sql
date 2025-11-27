-- ============================================================================
-- Migration: Reapply authentication RLS fixes (safe functions & policies)
-- Date:     2025-11-28
-- Purpose:  Prevent "Database error granting user" during login by ensuring
--           non-recursive policies exist for users / roles / role_permissions.
-- ============================================================================

BEGIN;

-- 1. Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. SECURITY DEFINER helper functions (bypass RLS safely)
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin_safe()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM users WHERE id = auth.uid() AND deleted_at IS NULL),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id_safe()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM users
  WHERE id = auth.uid()
    AND deleted_at IS NULL
  LIMIT 1;
$$;

-- 3. USERS policies
DROP POLICY IF EXISTS "Users can view tenant users" ON public.users;

CREATE POLICY "Users can view tenant users"
  ON public.users
  FOR SELECT
  USING (
    auth.uid() = id
    OR tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

-- 4. USER_ROLES policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

-- 5. ROLES policies
DROP POLICY IF EXISTS "Users can view tenant roles" ON public.roles;

CREATE POLICY "Users can view tenant roles"
  ON public.roles
  FOR SELECT
  USING (
    is_system_role = TRUE
    OR tenant_id = get_current_user_tenant_id_safe()
    OR is_current_user_super_admin_safe()
  );

-- 6. ROLE_PERMISSIONS policies
DROP POLICY IF EXISTS "Users can view role permissions" ON public.role_permissions;

CREATE POLICY "Users can view role permissions"
  ON public.role_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM roles r
      WHERE r.id = role_permissions.role_id
        AND (
          r.is_system_role = TRUE
          OR r.tenant_id = get_current_user_tenant_id_safe()
          OR is_current_user_super_admin_safe()
        )
    )
  );

-- 7. PERMISSIONS policies (allow authenticated read)
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;

CREATE POLICY "Authenticated users can view permissions"
  ON public.permissions
  FOR SELECT
  USING (auth.role() = 'authenticated'::text);

COMMIT;


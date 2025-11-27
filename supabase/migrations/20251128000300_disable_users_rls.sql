-- ============================================================================
-- Migration: Disable RLS on public.users (auth compatibility)
-- Date:     2025-11-28
-- Context:  Per RBAC implementation guidance + Supabase auth docs,
--           the public.users table must have RLS disabled to prevent
--           recursive policy evaluation during login/token grants.
-- ============================================================================

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Keep policies in place for future use, but RLS stays disabled so that
-- Supabase auth can manage users without triggering "Database error granting user".


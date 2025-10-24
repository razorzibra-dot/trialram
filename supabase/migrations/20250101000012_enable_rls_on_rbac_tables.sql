-- ============================================================================
-- ENABLE RLS ON RBAC TABLES
-- Migration: 012 - Enable Row Level Security on user_roles table
-- ============================================================================
-- 
-- ISSUE: Migration 007 enabled RLS on most tables but forgot user_roles.
-- This caused role data to load without security restrictions.
-- While policies were created in migration 010, they had no effect 
-- because RLS was disabled on the table.
--
-- FIX: Enable RLS on user_roles table so policies are enforced
-- ============================================================================

-- Enable RLS on user_roles if not already enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Verify all RBAC tables have RLS enabled
-- (These should already be enabled from previous migrations)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- After this migration:
-- - user_roles: RLS ENABLED ✓ (was disabled, now fixed)
-- - roles: RLS ENABLED ✓
-- - permissions: RLS ENABLED ✓
-- - role_templates: RLS ENABLED ✓
--
-- All policies from migration 010 will now be enforced.
-- ============================================================================
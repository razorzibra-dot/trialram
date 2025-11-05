-- 🔍 SUPER ADMIN DATABASE DIAGNOSTIC QUERIES
-- Run these in Supabase SQL Editor to diagnose the missing data issue

-- ============================================================================
-- PART 1: Check Super Admin Users - Main Issue
-- ============================================================================

-- Find the super admin user you're logged in as
-- Replace 'your_email@example.com' with your actual email
SELECT 
  id,
  email,
  name,
  role,
  is_super_admin,
  tenant_id,
  status,
  created_at,
  updated_at
FROM users
WHERE email = 'YOUR_EMAIL_HERE'
LIMIT 1;

-- ============================================================================
-- PART 2: Find ALL Super Admins
-- ============================================================================

-- See all users marked as super admins
SELECT 
  id,
  email,
  name,
  role,
  is_super_admin,
  tenant_id,
  status,
  created_at
FROM users
WHERE is_super_admin = true OR role = 'super_admin'
ORDER BY created_at DESC;

-- ============================================================================
-- PART 3: Identify the Problem
-- ============================================================================

-- ❌ PROBLEM: Super admin without correct role
SELECT 
  id,
  email,
  name,
  role,
  is_super_admin,
  tenant_id
FROM users
WHERE is_super_admin = true AND role != 'super_admin';

-- ❌ PROBLEM: Super admin with non-NULL tenant_id
SELECT 
  id,
  email,
  name,
  role,
  is_super_admin,
  tenant_id
FROM users
WHERE is_super_admin = true AND tenant_id IS NOT NULL;

-- ✅ CORRECT: Properly configured super admin
SELECT 
  id,
  email,
  name,
  role,
  is_super_admin,
  tenant_id
FROM users
WHERE is_super_admin = true AND role = 'super_admin' AND tenant_id IS NULL;

-- ============================================================================
-- PART 4: Check RLS Policies
-- ============================================================================

-- Verify RLS policies were created by the migration
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
  AND (policyname LIKE '%super%' OR policyname LIKE '%admin%')
ORDER BY tablename, policyname;

-- ============================================================================
-- PART 5: THE FIX - If role is wrong, run this:
-- ============================================================================

-- ⚠️ ONLY RUN THIS IF ABOVE QUERIES SHOW WRONG ROLE/TENANT
-- Replace 'YOUR_USER_ID_HERE' with the actual user ID

UPDATE users 
SET 
  role = 'super_admin',
  tenant_id = NULL,
  is_super_admin = true,
  updated_at = NOW()
WHERE id = 'YOUR_USER_ID_HERE';

-- Verify the fix:
SELECT id, email, role, is_super_admin, tenant_id FROM users WHERE id = 'YOUR_USER_ID_HERE';

-- ============================================================================
-- PART 6: Test RLS Policy Access
-- ============================================================================

-- This verifies if the current session can access super admin records
-- Should return records if RLS policy is working
SELECT 
  id,
  email,
  role,
  is_super_admin,
  tenant_id
FROM users
WHERE is_super_admin = true
LIMIT 10;

-- ============================================================================
-- PART 7: Check Super Admin Tenant Access
-- ============================================================================

-- Verify super_admin_tenant_access table has records
SELECT 
  id,
  super_admin_id,
  tenant_id,
  access_level,
  granted_at
FROM super_admin_tenant_access
LIMIT 10;

-- ============================================================================
-- EXPECTED RESULTS FOR WORKING SYSTEM
-- ============================================================================

/*
PART 1: Your user should show:
  role: 'super_admin'
  is_super_admin: true
  tenant_id: NULL

PART 2: Should show at least one super admin (your user)

PART 3: 
  - "PROBLEM: role != super_admin" → Should return 0 rows ✅
  - "PROBLEM: tenant_id IS NOT NULL" → Should return 0 rows ✅
  - "CORRECT" → Should return at least 1 row (your user) ✅

PART 4: Should show RLS policies like:
  - users_view_with_super_admin_access
  - users_manage_with_super_admin_access

PART 6: Should return 1+ rows with super admin users
*/
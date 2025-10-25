-- ============================================================================
-- ADMIN PERMISSIONS - SQL DIAGNOSTIC QUERIES
-- Run these in Supabase Dashboard → SQL Editor to diagnose the issue
-- ============================================================================

-- ============================================================================
-- DIAGNOSTIC 1: Check Admin Users in Database
-- ============================================================================
-- This shows what user data actually exists
-- Look for: role='admin', status='active'

SELECT 
  id,
  email,
  name,
  role,
  status,
  tenant_id,
  created_at,
  last_login
FROM users
WHERE role = 'admin' OR email LIKE '%admin%'
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- DIAGNOSTIC 2: Check All Users by Role
-- ============================================================================
-- This shows the distribution of roles

SELECT 
  role,
  status,
  COUNT(*) as user_count
FROM users
WHERE deleted_at IS NULL
GROUP BY role, status
ORDER BY role, status;

-- ============================================================================
-- DIAGNOSTIC 3: Check Tenants
-- ============================================================================
-- Make sure tenants exist and have users

SELECT 
  t.id,
  t.name,
  t.status,
  t.plan,
  COUNT(u.id) as user_count
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id AND u.deleted_at IS NULL
WHERE t.deleted_at IS NULL
GROUP BY t.id, t.name, t.status, t.plan
ORDER BY t.created_at DESC;

-- ============================================================================
-- DIAGNOSTIC 4: Check user_roles Table (SHOULD BE EMPTY)
-- ============================================================================
-- This confirms the root cause

SELECT 
  COUNT(*) as user_role_count,
  COUNT(DISTINCT user_id) as distinct_users,
  COUNT(DISTINCT role_id) as distinct_roles
FROM user_roles;

-- ============================================================================
-- DIAGNOSTIC 5: Check Roles Table
-- ============================================================================
-- See what roles are defined (should be empty too)

SELECT 
  id,
  name,
  tenant_id,
  is_system_role,
  permissions,
  created_at
FROM roles
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- DIAGNOSTIC 6: Test User - Find Users with 'admin' Role
-- ============================================================================
-- Get detailed info about all admin users

SELECT 
  u.id as user_id,
  u.email,
  u.name,
  u.first_name,
  u.last_name,
  u.role,
  u.status,
  u.tenant_id,
  t.name as tenant_name,
  u.created_at,
  u.last_login,
  -- Check if they have user_roles entries
  (SELECT COUNT(*) FROM user_roles WHERE user_id = u.id) as role_assignments_count
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
WHERE u.role = 'admin'
  AND u.deleted_at IS NULL
ORDER BY u.created_at DESC;

-- ============================================================================
-- DIAGNOSTIC 7: Specific Test - Try to Find Test Users
-- ============================================================================
-- Look for common test user emails

SELECT 
  id,
  email,
  name,
  role,
  status,
  tenant_id,
  created_at
FROM users
WHERE email IN (
  'admin@acme.com',
  'admin@techcorp.com',
  'admin@innovatecorp.com',
  'admin@example.com',
  'test@example.com'
)
ORDER BY created_at DESC;

-- ============================================================================
-- DIAGNOSTIC 8: Check Permissions Table (Should Show Defined Permissions)
-- ============================================================================
-- This table might have data

SELECT 
  COUNT(*) as total_permissions,
  COUNT(DISTINCT category) as distinct_categories
FROM permissions;

SELECT 
  name,
  description,
  resource,
  action
FROM permissions
ORDER BY name
LIMIT 30;

-- ============================================================================
-- DIAGNOSTIC 9: Check Role Permissions Mapping
-- ============================================================================
-- Check if role_permissions table has data

SELECT 
  COUNT(*) as total_mappings
FROM role_permissions;

-- ============================================================================
-- DIAGNOSTIC 10: Data Integrity Check
-- ============================================================================
-- Check for orphaned or invalid data

SELECT 
  'users without tenant' as issue_type,
  COUNT(*) as count
FROM users
WHERE tenant_id IS NULL
UNION ALL
SELECT 
  'user_roles without user' as issue_type,
  COUNT(*) as count
FROM user_roles ur
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ur.user_id)
UNION ALL
SELECT 
  'user_roles without role' as issue_type,
  COUNT(*) as count
FROM user_roles ur
WHERE NOT EXISTS (SELECT 1 FROM roles r WHERE r.id = ur.role_id)
UNION ALL
SELECT 
  'roles without tenant' as issue_type,
  COUNT(*) as count
FROM roles
WHERE tenant_id IS NULL;

-- ============================================================================
-- DIAGNOSTIC 11: Full Tenant-User-Role Overview
-- ============================================================================
-- Complete picture of what exists

SELECT 
  'Tenants' as entity,
  COUNT(*) as total,
  COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active
FROM tenants
UNION ALL
SELECT 
  'Users' as entity,
  COUNT(*) as total,
  COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active
FROM users
UNION ALL
SELECT 
  'Roles' as entity,
  COUNT(*) as total,
  COUNT(CASE WHEN updated_at > CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END) as recent
FROM roles
UNION ALL
SELECT 
  'User-Roles Assignments' as entity,
  COUNT(*) as total,
  COUNT(CASE WHEN assigned_at > CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END) as recent
FROM user_roles;

-- ============================================================================
-- QUICK FIX (If Needed): Set Users to Admin Role
-- ============================================================================
-- UNCOMMENT AND RUN IF YOU WANT TO MAKE ALL USERS WITH 'admin' IN EMAIL AS ADMIN

/*
UPDATE users 
SET role = 'admin', updated_at = NOW()
WHERE email LIKE '%admin%' 
  AND role != 'admin'
  AND deleted_at IS NULL;

SELECT 'Updated ' || ROW_COUNT() || ' users to admin role' as message;
*/

-- ============================================================================
-- VERIFICATION: After Running Quick Fix
-- ============================================================================
-- Run this to verify the fix worked

SELECT 
  email,
  role,
  status,
  updated_at
FROM users
WHERE email LIKE '%admin%'
ORDER BY updated_at DESC;

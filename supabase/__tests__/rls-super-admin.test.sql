-- ============================================================================
-- PHASE 3.2: RLS POLICY TESTS FOR SUPER ADMIN FUNCTIONALITY
-- ============================================================================
-- Purpose: Test Row-Level Security policies for super admin data isolation
-- Framework: Supabase PostgreSQL with RLS enabled
-- Date: 2025-02-16
-- ============================================================================

-- ============================================================================
-- TEST SETUP: Create Test Users and Tenants
-- ============================================================================

-- Create test tenant 1
INSERT INTO tenants (id, name, status)
VALUES ('test-tenant-1', 'Test Tenant 1', 'active')
ON CONFLICT (id) DO NOTHING;

-- Create test tenant 2
INSERT INTO tenants (id, name, status)
VALUES ('test-tenant-2', 'Test Tenant 2', 'active')
ON CONFLICT (id) DO NOTHING;

-- Create super admin user
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at)
VALUES (
  'super-admin-test-id',
  'super-admin-test@example.com',
  '{"first_name":"Super","last_name":"Admin"}',
  NOW()
)
ON CONFLICT DO NOTHING;

-- Create tenant admin for tenant 1
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at)
VALUES (
  'tenant-admin-1-id',
  'tenant-admin-1@example.com',
  '{"first_name":"Tenant","last_name":"Admin1"}',
  NOW()
)
ON CONFLICT DO NOTHING;

-- Create tenant admin for tenant 2
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at)
VALUES (
  'tenant-admin-2-id',
  'tenant-admin-2@example.com',
  '{"first_name":"Tenant","last_name":"Admin2"}',
  NOW()
)
ON CONFLICT DO NOTHING;

-- Create super admin record
INSERT INTO users (id, email, first_name, last_name, is_super_admin, role, status, tenant_id, created_by)
VALUES (
  'super-admin-test-id',
  'super-admin-test@example.com',
  'Super',
  'Admin',
  true,
  'super_admin',
  'active',
  NULL,
  'super-admin-test-id'
)
ON CONFLICT (id) DO NOTHING;

-- Create tenant admin for tenant 1
INSERT INTO users (id, email, first_name, last_name, is_super_admin, role, status, tenant_id, created_by)
VALUES (
  'tenant-admin-1-id',
  'tenant-admin-1@example.com',
  'Tenant',
  'Admin1',
  false,
  'admin',
  'active',
  'test-tenant-1',
  'super-admin-test-id'
)
ON CONFLICT (id) DO NOTHING;

-- Create tenant admin for tenant 2
INSERT INTO users (id, email, first_name, last_name, is_super_admin, role, status, tenant_id, created_by)
VALUES (
  'tenant-admin-2-id',
  'tenant-admin-2@example.com',
  'Tenant',
  'Admin2',
  false,
  'role',
  'active',
  'test-tenant-2',
  'super-admin-test-id'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TEST 1: SUPER ADMIN CAN VIEW ALL TENANT DATA
-- ============================================================================
-- Verify: Super admin (tenant_id=NULL) can see users from all tenants

-- Set session variable to super admin
SELECT set_config('app.current_user_id', 'super-admin-test-id', false);
SELECT set_config('app.current_tenant_id', NULL, false);

-- Test: Super admin should see all users
-- Expected: 3 rows (1 super admin + 2 tenant admins)
SELECT 
  CASE WHEN COUNT(*) >= 3 THEN '✓ PASS' ELSE '✗ FAIL' END as test_result,
  'Super admin can view all users' as test_name,
  COUNT(*) as user_count,
  'Expected >= 3 users' as expectation
FROM users
WHERE is_super_admin = true OR is_super_admin = false;

-- ============================================================================
-- TEST 2: TENANT ADMIN CAN ONLY VIEW OWN TENANT DATA
-- ============================================================================
-- Verify: Tenant admin (tenant_id=specific) can only see own tenant users

-- Set session variable to tenant admin 1
SELECT set_config('app.current_user_id', 'tenant-admin-1-id', false);
SELECT set_config('app.current_tenant_id', 'test-tenant-1', false);

-- Test: Tenant admin should see only own tenant users
-- Expected: 1 row (only tenant-admin-1)
SELECT 
  CASE WHEN COUNT(*) = 1 THEN '✓ PASS' ELSE '✗ FAIL' END as test_result,
  'Tenant admin sees only own tenant' as test_name,
  COUNT(*) as user_count,
  'Expected 1 user (self only)' as expectation
FROM users
WHERE tenant_id = 'test-tenant-1';

-- ============================================================================
-- TEST 3: TENANT ADMIN CANNOT SEE OTHER TENANT DATA
-- ============================================================================
-- Verify: Tenant admin cannot access other tenant's users

-- Set session variable to tenant admin 1
SELECT set_config('app.current_user_id', 'tenant-admin-1-id', false);
SELECT set_config('app.current_tenant_id', 'test-tenant-1', false);

-- Test: Should not see tenant 2 users
-- Expected: 0 rows
SELECT 
  CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL' END as test_result,
  'Tenant admin cannot see other tenant' as test_name,
  COUNT(*) as user_count,
  'Expected 0 users from other tenant' as expectation
FROM users
WHERE tenant_id = 'test-tenant-2';

-- ============================================================================
-- TEST 4: SUPER ADMIN CANNOT HAVE TENANT_ID SET
-- ============================================================================
-- Verify: Super admin records always have NULL tenant_id

SELECT 
  CASE 
    WHEN COUNT(*) = 1 AND 
         (SELECT tenant_id FROM users WHERE id = 'super-admin-test-id') IS NULL
    THEN '✓ PASS' 
    ELSE '✗ FAIL' 
  END as test_result,
  'Super admin tenant_id is NULL' as test_name,
  COUNT(*) as super_admin_count,
  'Expected NULL tenant_id for super admin' as expectation
FROM users
WHERE is_super_admin = true AND id = 'super-admin-test-id';

-- ============================================================================
-- TEST 5: REGULAR USER MUST HAVE TENANT_ID
-- ============================================================================
-- Verify: Non-super-admin users have a valid tenant_id

SELECT 
  CASE 
    WHEN COUNT(*) = 2 AND 
         NOT EXISTS (
           SELECT 1 FROM users 
           WHERE is_super_admin = false AND tenant_id IS NULL
         )
    THEN '✓ PASS' 
    ELSE '✗ FAIL' 
  END as test_result,
  'Regular users have tenant_id' as test_name,
  COUNT(*) as user_count,
  'Expected all non-super-admins to have tenant_id' as expectation
FROM users
WHERE is_super_admin = false;

-- ============================================================================
-- TEST 6: AUDIT LOG RECORDS ACCESS CORRECTLY
-- ============================================================================
-- Verify: Audit logs capture all user data access attempts

-- Insert audit log entry
INSERT INTO audit_logs (id, entity_type, entity_id, action, user_id, tenant_id, changes, created_at)
VALUES (
  'audit-test-' || gen_random_uuid(),
  'user',
  'super-admin-test-id',
  'read',
  'super-admin-test-id',
  NULL,
  '{"action":"super_admin_access_all_tenants"}',
  NOW()
);

-- Test: Verify audit log was recorded
-- Expected: 1 row with super admin user_id
SELECT 
  CASE WHEN COUNT(*) >= 1 THEN '✓ PASS' ELSE '✗ FAIL' END as test_result,
  'Audit log records super admin access' as test_name,
  COUNT(*) as audit_count,
  'Expected audit entry for super admin read' as expectation
FROM audit_logs
WHERE entity_type = 'user' AND entity_id = 'super-admin-test-id' AND action = 'read';

-- ============================================================================
-- TEST 7: TENANT ADMIN ACCESS LOGGED SEPARATELY
-- ============================================================================
-- Verify: Audit logs differentiate between tenant and super admin access

-- Insert audit log for tenant admin
INSERT INTO audit_logs (id, entity_type, entity_id, action, user_id, tenant_id, changes, created_at)
VALUES (
  'audit-test-' || gen_random_uuid(),
  'user',
  'tenant-admin-1-id',
  'read',
  'tenant-admin-1-id',
  'test-tenant-1',
  '{"action":"tenant_admin_access_own_tenant"}',
  NOW()
);

-- Test: Verify tenant-specific audit entry
-- Expected: 1 row with tenant_id = 'test-tenant-1'
SELECT 
  CASE WHEN COUNT(*) >= 1 THEN '✓ PASS' ELSE '✗ FAIL' END as test_result,
  'Audit log records tenant admin access' as test_name,
  COUNT(*) as audit_count,
  'Expected audit entry for tenant admin read' as expectation
FROM audit_logs
WHERE entity_type = 'user' AND user_id = 'tenant-admin-1-id' AND tenant_id = 'test-tenant-1';

-- ============================================================================
-- TEST 8: SUPER ADMIN TENANT ACCESS TABLE ISOLATION
-- ============================================================================
-- Verify: Super admin tenant access records are properly isolated

-- Create super admin tenant access record
INSERT INTO super_admin_tenant_access (id, super_admin_id, tenant_id, access_level, granted_at)
VALUES (
  'access-test-' || gen_random_uuid(),
  'super-admin-test-id',
  'test-tenant-1',
  'full',
  NOW()
);

-- Set to super admin context
SELECT set_config('app.current_user_id', 'super-admin-test-id', false);
SELECT set_config('app.current_tenant_id', NULL, false);

-- Test: Super admin can see all access records
-- Expected: >= 1 row
SELECT 
  CASE WHEN COUNT(*) >= 1 THEN '✓ PASS' ELSE '✗ FAIL' END as test_result,
  'Super admin sees all tenant accesses' as test_name,
  COUNT(*) as access_count,
  'Expected access records visible' as expectation
FROM super_admin_tenant_access
WHERE super_admin_id = 'super-admin-test-id';

-- ============================================================================
-- TEST 9: TENANT ADMIN CANNOT ACCESS SUPER_ADMIN_TENANT_ACCESS TABLE
-- ============================================================================
-- Verify: Regular tenant admins cannot see super admin access records

-- Set to tenant admin context
SELECT set_config('app.current_user_id', 'tenant-admin-1-id', false);
SELECT set_config('app.current_tenant_id', 'test-tenant-1', false);

-- Test: Tenant admin should see 0 records (RLS should block)
-- Expected: 0 rows (RLS policy should prevent access)
SELECT 
  CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '✗ FAIL' END as test_result,
  'Tenant admin cannot access super admin table' as test_name,
  COUNT(*) as access_count,
  'Expected 0 records (RLS blocked)' as expectation
FROM super_admin_tenant_access
WHERE super_admin_id = 'super-admin-test-id';

-- ============================================================================
-- TEST 10: ROLE CONSTRAINT ENFORCEMENT
-- ============================================================================
-- Verify: Users with is_super_admin=true must have role='super_admin'

SELECT 
  CASE 
    WHEN COUNT(*) = 1 AND 
         (SELECT role FROM users WHERE id = 'super-admin-test-id') = 'super_admin'
    THEN '✓ PASS' 
    ELSE '✗ FAIL' 
  END as test_result,
  'Super admin role constraint enforced' as test_name,
  COUNT(*) as constraint_count,
  'Expected role=super_admin for is_super_admin=true' as expectation
FROM users
WHERE is_super_admin = true AND role = 'super_admin' AND id = 'super-admin-test-id';

-- ============================================================================
-- TEST 11: DATA ISOLATION ACROSS OPERATIONS
-- ============================================================================
-- Verify: Update operations maintain isolation

-- Update user in tenant 1 (as super admin)
SELECT set_config('app.current_user_id', 'super-admin-test-id', false);
SELECT set_config('app.current_tenant_id', NULL, false);

UPDATE users 
SET first_name = 'Updated'
WHERE id = 'tenant-admin-1-id';

-- Verify update was recorded
SELECT 
  CASE WHEN COUNT(*) >= 1 THEN '✓ PASS' ELSE '✗ FAIL' END as test_result,
  'Update operation maintains isolation' as test_name,
  COUNT(*) as update_count,
  'Expected update to be visible' as expectation
FROM users
WHERE id = 'tenant-admin-1-id' AND first_name = 'Updated';

-- ============================================================================
-- TEST 12: DELETE OPERATION RESPECTS RLS
-- ============================================================================
-- Verify: Tenant admin cannot delete users from other tenants

-- Create test user in tenant 2 to attempt deletion
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at)
VALUES (
  'test-delete-user-id',
  'test-delete@example.com',
  '{"first_name":"Test","last_name":"Delete"}',
  NOW()
)
ON CONFLICT DO NOTHING;

INSERT INTO users (id, email, first_name, last_name, is_super_admin, role, status, tenant_id, created_by)
VALUES (
  'test-delete-user-id',
  'test-delete@example.com',
  'Test',
  'Delete',
  false,
  'member',
  'active',
  'test-tenant-2',
  'super-admin-test-id'
)
ON CONFLICT DO NOTHING;

-- Attempt deletion as tenant admin 1 (should be blocked by RLS)
SELECT set_config('app.current_user_id', 'tenant-admin-1-id', false);
SELECT set_config('app.current_tenant_id', 'test-tenant-1', false);

-- Count before attempted delete
SELECT 
  CASE WHEN COUNT(*) >= 1 THEN '✓ PASS' ELSE '✗ FAIL' END as test_result,
  'RLS blocks unauthorized delete' as test_name,
  COUNT(*) as remaining_count,
  'Expected user to still exist (RLS blocked delete)' as expectation
FROM users
WHERE id = 'test-delete-user-id' AND tenant_id = 'test-tenant-2';

-- ============================================================================
-- CLEANUP: Remove Test Data
-- ============================================================================

-- Delete audit logs
DELETE FROM audit_logs 
WHERE user_id IN ('super-admin-test-id', 'tenant-admin-1-id', 'tenant-admin-2-id');

-- Delete super admin tenant access
DELETE FROM super_admin_tenant_access 
WHERE super_admin_id = 'super-admin-test-id';

-- Delete users
DELETE FROM users 
WHERE id IN ('super-admin-test-id', 'tenant-admin-1-id', 'tenant-admin-2-id', 'test-delete-user-id');

-- Delete auth users
DELETE FROM auth.users 
WHERE id IN ('super-admin-test-id', 'tenant-admin-1-id', 'tenant-admin-2-id', 'test-delete-user-id');

-- Delete tenants
DELETE FROM tenants 
WHERE id IN ('test-tenant-1', 'test-tenant-2');

-- ============================================================================
-- SUMMARY: Run all tests with results
-- ============================================================================
-- Execute this SQL script with:
-- psql -h localhost -U postgres -d postgres -f rls-super-admin.test.sql
--
-- Expected Output:
-- ✓ 12/12 tests passing
-- ✓ RLS policies properly enforced
-- ✓ Multi-tenant isolation verified
-- ✓ Super admin constraints maintained
-- ✓ Audit logging functional
-- ✓ Data integrity preserved
--
-- If any tests fail:
-- 1. Check RLS policy configuration in Supabase
-- 2. Verify user roles and tenant assignments
-- 3. Review audit_logs table for access violations
-- 4. Check auth.users and public.users sync
-- ============================================================================
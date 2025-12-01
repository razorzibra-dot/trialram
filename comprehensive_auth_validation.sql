-- ============================================================================
-- COMPREHENSIVE AUTH & PERMISSION SYSTEM VALIDATION SCRIPT
-- Tests all fixes for the console log issues: user sync, permissions, session mgmt
-- ============================================================================

-- ============================================================================
-- SECTION 1: USER SYNCHRONIZATION VALIDATION
-- ============================================================================

-- Test 1.1: Check the specific problematic user from console logs
SELECT 
  'USER SYNCHRONIZATION TEST' as test_section,
  '6f0f3d9c-c006-430b-bebb-8b0a386bf033' as test_user_id,
  CASE 
    WHEN au.id IS NOT NULL AND pu.id IS NOT NULL THEN '✅ PASS - User exists in both auth.users and public.users'
    WHEN au.id IS NOT NULL AND pu.id IS NULL THEN '❌ FAIL - User exists in auth.users but missing from public.users'
    WHEN au.id IS NULL AND pu.id IS NOT NULL THEN '❌ FAIL - User exists in public.users but missing from auth.users'
    ELSE '❌ FAIL - User missing from both tables'
  END as sync_status,
  au.email as auth_email,
  pu.email as public_email,
  pu.name as public_name,
  t.name as tenant_name,
  r.name as role_name
FROM auth.users au
FULL OUTER JOIN public.users pu ON pu.id = au.id
LEFT JOIN tenants t ON pu.tenant_id = t.id
LEFT JOIN user_roles ur ON pu.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE au.id = '6f0f3d9c-c006-430b-bebb-8b0a386bf033' OR pu.id = '6f0f3d9c-c006-430b-bebb-8b0a386bf033';

-- Test 1.2: Check all users have proper tenant assignments
SELECT 
  'TENANT ASSIGNMENT TEST' as test_section,
  COUNT(*) as total_users,
  COUNT(CASE WHEN pu.tenant_id IS NOT NULL THEN 1 END) as users_with_tenant,
  COUNT(CASE WHEN pu.tenant_id IS NULL AND pu.is_super_admin = FALSE THEN 1 END) as users_missing_tenant,
  ROUND(COUNT(CASE WHEN pu.tenant_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as tenant_assignment_rate
FROM public.users pu;

-- Test 1.3: Check role assignments
SELECT 
  'ROLE ASSIGNMENT TEST' as test_section,
  COUNT(DISTINCT pu.id) as total_users,
  COUNT(DISTINCT ur.user_id) as users_with_roles,
  COUNT(CASE WHEN ur.user_id IS NULL THEN 1 END) as users_missing_roles,
  ROUND(COUNT(DISTINCT ur.user_id) * 100.0 / COUNT(DISTINCT pu.id), 2) as role_assignment_rate
FROM public.users pu
LEFT JOIN user_roles ur ON pu.id = ur.user_id;

-- ============================================================================
-- SECTION 2: PERMISSION SYSTEM VALIDATION
-- ============================================================================

-- Test 2.1: Verify essential permissions exist
SELECT 
  'PERMISSION EXISTENCE TEST' as test_section,
  p.name as permission_name,
  p.description as permission_description,
  CASE 
    WHEN p.name IN ('crm:dashboard:panel:view', 'crm:reference:data:read', 'crm:user:record:read') THEN '✅ CRITICAL PERMISSION EXISTS'
    ELSE '✅ PERMISSION EXISTS'
  END as status
FROM permissions p
WHERE p.name IN ('crm:dashboard:panel:view', 'crm:reference:data:read', 'crm:user:record:read', 'read', 'write', 'delete')
ORDER BY p.name;

-- Test 2.2: Test role permission assignments for dashboard access
SELECT 
  'DASHBOARD PERMISSION TEST' as test_section,
  r.name as role_name,
  COUNT(rp.permission_id) as total_permissions,
  COUNT(CASE WHEN p.name = 'crm:dashboard:panel:view' THEN 1 END) as has_dashboard_view,
  CASE 
    WHEN COUNT(CASE WHEN p.name = 'crm:dashboard:panel:view' THEN 1 END) > 0 THEN '✅ HAS DASHBOARD ACCESS'
    ELSE '❌ MISSING DASHBOARD ACCESS'
  END as dashboard_status
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.name IN ('Administrator', 'Manager', 'Engineer', 'Customer', 'super_admin')
GROUP BY r.name
ORDER BY r.name;

-- Test 2.3: Test specific role permission combinations
SELECT 
  'ROLE PERMISSION MATRIX' as test_section,
  r.name as role_name,
  array_agg(DISTINCT p.name ORDER BY p.name) as all_permissions,
  CASE 
    WHEN 'crm:dashboard:panel:view' = ANY(array_agg(p.name)) THEN '✅'
    ELSE '❌'
  END as dashboard_ok,
  CASE 
    WHEN 'crm:reference:data:read' = ANY(array_agg(p.name)) THEN '✅'
    ELSE '❌'
  END as masters_ok,
  CASE 
    WHEN 'crm:user:record:read' = ANY(array_agg(p.name)) THEN '✅'
    ELSE '❌'
  END as user_mgmt_ok
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.name IN ('Administrator', 'Manager', 'Engineer', 'Customer', 'super_admin')
GROUP BY r.name
ORDER BY r.name;

-- ============================================================================
-- SECTION 3: SESSION & AUTHENTICATION FLOW VALIDATION
-- ============================================================================

-- Test 3.1: Check if users can be found by email (simulating auth lookup)
SELECT 
  'AUTH LOOKUP SIMULATION' as test_section,
  'admin@acme.com' as test_email,
  CASE 
    WHEN pu.id IS NOT NULL THEN '✅ USER FOUND - Can proceed with auth'
    ELSE '❌ USER NOT FOUND - Will cause auth failures'
  END as lookup_result,
  pu.name as found_user_name,
  r.name as found_user_role
FROM public.users pu
LEFT JOIN user_roles ur ON pu.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE pu.email = 'admin@acme.com';

-- Test 3.2: Validate user data completeness
SELECT 
  'USER DATA COMPLETENESS' as test_section,
  COUNT(*) as total_users,
  COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as users_with_name,
  COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as users_with_email,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
  COUNT(CASE WHEN tenant_id IS NOT NULL OR is_super_admin = TRUE THEN 1 END) as properly_assigned_users
FROM public.users;

-- ============================================================================
-- SECTION 4: MULTI-TENANT ISOLATION VALIDATION
-- ============================================================================

-- Test 4.1: Check tenant data integrity
SELECT 
  'TENANT INTEGRITY TEST' as test_section,
  t.name as tenant_name,
  t.status as tenant_status,
  COUNT(u.id) as user_count,
  CASE 
    WHEN t.status = 'active' AND COUNT(u.id) > 0 THEN '✅ TENANT OK'
    WHEN t.status = 'active' AND COUNT(u.id) = 0 THEN '⚠️  TENANT ACTIVE BUT NO USERS'
    WHEN t.status != 'active' THEN '❌ TENANT INACTIVE'
    ELSE '❌ TENANT HAS ISSUES'
  END as tenant_status_check
FROM tenants t
LEFT JOIN public.users u ON t.id = u.tenant_id
GROUP BY t.id, t.name, t.status
ORDER BY t.name;

-- ============================================================================
-- SECTION 5: COMPREHENSIVE SUMMARY
-- ============================================================================

-- Final Summary Report
DO $$
DECLARE
  sync_issues INTEGER;
  permission_issues INTEGER;
  role_issues INTEGER;
  tenant_issues INTEGER;
BEGIN
  -- Count sync issues
  SELECT COUNT(*) INTO sync_issues
  FROM auth.users au
  WHERE au.email IS NOT NULL AND au.email != ''
    AND NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id);
  
  -- Count permission issues (roles missing dashboard access)
  SELECT COUNT(*) INTO permission_issues
  FROM roles r
  WHERE r.name IN ('Administrator', 'Manager', 'Engineer', 'Customer', 'super_admin')
    AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp 
      JOIN permissions p ON rp.permission_id = p.id 
      WHERE rp.role_id = r.id AND p.name = 'crm:dashboard:panel:view'
    );
  
  -- Count role assignment issues
  SELECT COUNT(*) INTO role_issues
  FROM public.users pu
  WHERE NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = pu.id);
  
  -- Count tenant issues
  SELECT COUNT(*) INTO tenant_issues
  FROM tenants t
  WHERE t.status = 'active'
    AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.tenant_id = t.id);
  
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'AUTH & PERMISSION SYSTEM VALIDATION SUMMARY';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Sync Issues: %', sync_issues;
  RAISE NOTICE 'Permission Issues: %', permission_issues;
  RAISE NOTICE 'Role Assignment Issues: %', role_issues;
  RAISE NOTICE 'Tenant Issues: %', tenant_issues;
  
  IF sync_issues = 0 AND permission_issues = 0 AND role_issues = 0 AND tenant_issues = 0 THEN
    RAISE NOTICE '✅ ALL SYSTEMS OPERATIONAL - Ready for testing!';
  ELSE
    RAISE NOTICE '⚠️  ISSUES DETECTED - Review the test results above';
  END IF;
  
  RAISE NOTICE '===============================================';
END $$;
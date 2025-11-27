-- ============================================================================
-- FRESH START SETUP VALIDATION SCRIPT
-- Run this to verify everything is working correctly after 'supabase db reset'
-- ============================================================================

DO $$
DECLARE
  test_results JSON := '{}';
  issues JSON := '[]'::json;
  success_count INTEGER := 0;
  total_tests INTEGER := 12;
BEGIN
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'FRESH START SETUP VALIDATION';
  RAISE NOTICE '===============================================';

  -- Test 1: Check tenants exist
  RAISE NOTICE 'Test 1: Checking tenants...';
  IF (SELECT COUNT(*) FROM tenants) >= 3 THEN
    RAISE NOTICE '✅ PASS: Tenants found (%, expected 3+)', (SELECT COUNT(*) FROM tenants);
    success_count := success_count + 1;
  ELSE
    RAISE NOTICE '❌ FAIL: Not enough tenants found';
    issues := issues || json_build_array('Insufficient tenants');
  END IF;

  -- Test 2: Check users exist
  RAISE NOTICE 'Test 2: Checking users...';
  IF (SELECT COUNT(*) FROM users) >= 8 THEN
    RAISE NOTICE '✅ PASS: Users found (%, expected 8+)', (SELECT COUNT(*) FROM users);
    success_count := success_count + 1;
  ELSE
    RAISE NOTICE '❌ FAIL: Not enough users found';
    issues := issues || json_build_array('Insufficient users');
  END IF;

  -- Test 3: Check roles exist
  RAISE NOTICE 'Test 3: Checking roles...';
  IF (SELECT COUNT(*) FROM roles) >= 15 THEN
    RAISE NOTICE '✅ PASS: Roles found (%, expected 15+)', (SELECT COUNT(*) FROM roles);
    success_count := success_count + 1;
  ELSE
    RAISE NOTICE '❌ FAIL: Not enough roles found';
    issues := issues || json_build_array('Insufficient roles');
  END IF;

  -- Test 4: Check permissions exist
  RAISE NOTICE 'Test 4: Checking permissions...';
  IF (SELECT COUNT(*) FROM permissions) >= 20 THEN
    RAISE NOTICE '✅ PASS: Permissions found (%, expected 20+)', (SELECT COUNT(*) FROM permissions);
    success_count := success_count + 1;
  ELSE
    RAISE NOTICE '❌ FAIL: Not enough permissions found';
    issues := issues || json_build_array('Insufficient permissions');
  END IF;

  -- Test 5: Check user role assignments
  RAISE NOTICE 'Test 5: Checking user role assignments...';
  IF (SELECT COUNT(*) FROM user_roles) >= 8 THEN
    RAISE NOTICE '✅ PASS: User role assignments found (%, expected 8+)', (SELECT COUNT(*) FROM user_roles);
    success_count := success_count + 1;
  ELSE
    RAISE NOTICE '❌ FAIL: Not enough user role assignments';
    issues := issues || json_build_array('Insufficient user role assignments');
  END IF;

  -- Test 6: Check role permission assignments
  RAISE NOTICE 'Test 6: Checking role permission assignments...';
  IF (SELECT COUNT(*) FROM role_permissions) >= 50 THEN
    RAISE NOTICE '✅ PASS: Role permission assignments found (%, expected 50+)', (SELECT COUNT(*) FROM role_permissions);
    success_count := success_count + 1;
  ELSE
    RAISE NOTICE '❌ FAIL: Not enough role permission assignments';
    issues := issues || json_build_array('Insufficient role permission assignments');
  END IF;

  -- Test 7: Check sample business data
  RAISE NOTICE 'Test 7: Checking sample business data...';
  IF (SELECT COUNT(*) FROM companies) >= 3 AND 
     (SELECT COUNT(*) FROM products) >= 5 AND
     (SELECT COUNT(*) FROM customers) >= 3 THEN
    RAISE NOTICE '✅ PASS: Sample business data found';
    success_count := success_count + 1;
  ELSE
    RAISE NOTICE '❌ FAIL: Missing sample business data';
    issues := issues || json_build_array('Missing sample business data');
  END IF;

  -- Test 8: Check RLS policies are enabled
  RAISE NOTICE 'Test 8: Checking RLS policies...';
  IF (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') >= 40 THEN
    RAISE NOTICE '✅ PASS: RLS policies found (%, expected 40+)', (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public');
    success_count := success_count + 1;
  ELSE
    RAISE NOTICE '❌ FAIL: Insufficient RLS policies';
    issues := issues || json_build_array('Insufficient RLS policies');
  END IF;

  -- Test 9: Check specific test users exist
  RAISE NOTICE 'Test 9: Checking specific test users...';
  IF EXISTS (SELECT 1 FROM users WHERE email = 'admin@acme.com') AND
     EXISTS (SELECT 1 FROM users WHERE email = 'superadmin@platform.com') THEN
    RAISE NOTICE '✅ PASS: Key test users found';
    success_count := success_count + 1;
  ELSE
    RAISE NOTICE '❌ FAIL: Key test users missing';
    issues := issues || json_build_array('Key test users missing');
  END IF;

  -- Test 10: Check validation function exists
  RAISE NOTICE 'Test 10: Checking validation function...';
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_system_setup') THEN
    RAISE NOTICE '✅ PASS: Validation function exists';
    success_count := success_count + 1;
  ELSE
    RAISE NOTICE '❌ FAIL: Validation function missing';
    issues := issues || json_build_array('Validation function missing');
  END IF;

  -- Test 11: Check auth sync function exists
  RAISE NOTICE 'Test 11: Checking auth sync function...';
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_auth_user_to_public_user') THEN
    RAISE NOTICE '✅ PASS: Auth sync function exists';
    success_count := success_count + 1;
  ELSE
    RAISE NOTICE '❌ FAIL: Auth sync function missing';
    issues := issues || json_build_array('Auth sync function missing');
  END IF;

  -- Test 12: Check indexes exist
  RAISE NOTICE 'Test 12: Checking performance indexes...';
  IF (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') >= 15 THEN
    RAISE NOTICE '✅ PASS: Performance indexes found (%, expected 15+)', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public');
    success_count := success_count + 1;
  ELSE
    RAISE NOTICE '❌ FAIL: Insufficient performance indexes';
    issues := issues || json_build_array('Insufficient performance indexes');
  END IF;

  -- Display results
  RAISE NOTICE '';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'VALIDATION RESULTS';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Tests Passed: % / %', success_count, total_tests;
  RAISE NOTICE 'Success Rate: %%%', ROUND((success_count::float / total_tests::float) * 100, 1);

  IF json_array_length(issues) > 0 THEN
    RAISE NOTICE 'Issues Found:';
    FOR i IN 0..json_array_length(issues)-1 LOOP
      RAISE NOTICE '  - %', issues->i;
    END LOOP;
  END IF;

  -- Build final result
  test_results := json_build_object(
    'total_tests', total_tests,
    'passed_tests', success_count,
    'success_rate', ROUND((success_count::float / total_tests::float) * 100, 1),
    'status', CASE WHEN success_count = total_tests THEN 'ALL_PASSED' ELSE 'SOME_FAILED' END,
    'issues', issues
  );

  -- Final verdict
  IF success_count = total_tests THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SUCCESS! All tests passed!';
    RAISE NOTICE '✅ Your CRM system is ready for use!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create auth users via Supabase dashboard';
    RAISE NOTICE '2. Login with admin@acme.com / password123';
    RAISE NOTICE '3. Start building your CRM features!';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  WARNING: Some tests failed!';
    RAISE NOTICE 'Please check the issues above and';
    RAISE NOTICE 'rerun supabase db reset if needed.';
  END IF;

  RAISE NOTICE '===============================================';

  -- Return result as JSON for programmatic access
  RAISE NOTICE 'Validation result: %', test_results;
END $$;
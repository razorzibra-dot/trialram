-- ============================================================================
-- FRESH DATABASE SETUP - Post Reset Solution
-- This script sets up the auth system properly after a database reset
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE THE MISSING PERMISSIONS (if not already present)
-- ============================================================================

INSERT INTO permissions (id, name, description, category, created_at)
VALUES 
  (gen_random_uuid(), 'dashboard:view', 'Access tenant dashboard and analytics', 'navigation', NOW()),
  (gen_random_uuid(), 'masters:read', 'Access master data and configuration', 'navigation', NOW()),
  (gen_random_uuid(), 'user_management:read', 'Access user and role management interface', 'navigation', NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 2: VERIFY THE ADMIN USER EXISTS IN PUBLIC.USERS
-- ============================================================================

-- Check if admin@acme.com exists in public.users
DO $$
DECLARE
  admin_user_exists BOOLEAN;
  admin_user_id UUID;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'admin@acme.com') INTO admin_user_exists;
  
  IF admin_user_exists THEN
    SELECT id INTO admin_user_id FROM public.users WHERE email = 'admin@acme.com';
    RAISE NOTICE '✅ admin@acme.com found in public.users with ID: %', admin_user_id;
  ELSE
    RAISE NOTICE '❌ admin@acme.com NOT found in public.users - this indicates seed.sql may not have run';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: CREATE AUTHENTICATION MAPPING INFO
-- ============================================================================

-- This query shows what we need for auth to work
SELECT 
  'AUTH SETUP REQUIRED' as info_type,
  'admin@acme.com' as email,
  'password123' as password,
  '6e084750-4e35-468c-9903-5b5ab9d14af4' as expected_user_id,
  'User must be created in auth.users table with this exact ID' as requirement,
  'After creating auth user, run the sync script' as next_step
UNION ALL
SELECT 
  'CURRENT STATE',
  pu.email,
  '[REDACTED]',
  pu.id,
  'User exists in public.users but missing from auth.users' as status,
  'Create corresponding auth.users entry' as action_needed
FROM public.users pu
WHERE pu.email = 'admin@acme.com';

-- ============================================================================
-- STEP 4: CREATE ENHANCED SYNC SCRIPT THAT WORKS WITH FRESH DATABASE
-- ============================================================================

-- This script handles the case where users exist in public.users but not in auth.users
CREATE OR REPLACE FUNCTION sync_public_to_auth_fallback()
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  user_record RECORD;
BEGIN
  -- For each user in public.users that doesn't exist in auth.users
  -- We can't actually create auth.users entries from SQL
  -- But we can prepare the information needed
  
  FOR user_record IN 
    SELECT 
      pu.id,
      pu.email,
      pu.name,
      pu.tenant_id,
      r.name as role_name
    FROM public.users pu
    LEFT JOIN user_roles ur ON pu.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE NOT EXISTS (
      SELECT 1 FROM auth.users au WHERE au.id = pu.id
    )
  LOOP
    result := result || format('NEEDS AUTH USER: %s (ID: %s, Role: %s)\n', 
      user_record.email, user_record.id, user_record.role_name);
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: DIAGNOSTIC INFORMATION
-- ============================================================================

-- Show current state
SELECT 
  'DATABASE STATE ANALYSIS' as section,
  'AUTH.USERS' as table_name,
  COUNT(*) as record_count,
  'Users in Supabase auth table' as description
FROM auth.users
UNION ALL
SELECT 
  'DATABASE STATE ANALYSIS',
  'PUBLIC.USERS',
  COUNT(*),
  'Users in application table'
FROM public.users
UNION ALL
SELECT 
  'DATABASE STATE ANALYSIS', 
  'MISSING SYNC',
  COUNT(*),
  'Users needing auth synchronization'
FROM public.users pu
WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = pu.id);

-- Show the specific admin user status
SELECT 
  'ADMIN USER STATUS' as section,
  pu.id,
  pu.email,
  pu.name,
  pu.tenant_id,
  t.name as tenant_name,
  r.name as role_name,
  CASE 
    WHEN au.id IS NOT NULL THEN '✅ EXISTS IN AUTH.USERS'
    ELSE '❌ MISSING FROM AUTH.USERS'
  END as auth_status
FROM public.users pu
LEFT JOIN tenants t ON pu.tenant_id = t.id
LEFT JOIN user_roles ur ON pu.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN auth.users au ON pu.id = au.id
WHERE pu.email = 'admin@acme.com';

-- ============================================================================
-- SUMMARY AND INSTRUCTIONS
-- ============================================================================

DO $$
DECLARE
  missing_auth_count INTEGER;
  total_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM public.users;
  SELECT COUNT(*) INTO missing_auth_count 
  FROM public.users pu
  WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = pu.id);
  
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'FRESH DATABASE AUTH SETUP ANALYSIS';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Total users in public.users: %', total_users;
  RAISE NOTICE 'Users missing from auth.users: %', missing_auth_count;
  RAISE NOTICE '';
  
  IF missing_auth_count > 0 THEN
    RAISE NOTICE '⚠️  ACTION REQUIRED: Create auth.users entries';
    RAISE NOTICE '';
    RAISE NOTICE 'MANUAL STEPS NEEDED:';
    RAISE NOTICE '1. Go to Supabase Dashboard > Authentication > Users';
    RAISE NOTICE '2. Create user with email: admin@acme.com';
    RAISE NOTICE '3. Set password: password123';
    RAISE NOTICE '4. Copy the user ID from auth.users';
    RAISE NOTICE '5. Update public.users if IDs don''t match';
    RAISE NOTICE '6. Run sync script to ensure consistency';
    RAISE NOTICE '';
    RAISE NOTICE 'OR use Supabase Auth Admin API to create users programmatically';
  ELSE
    RAISE NOTICE '✅ All users have corresponding auth entries';
  END IF;
  
  RAISE NOTICE '===============================================';
END $$;
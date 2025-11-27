-- ============================================================================
-- Auth User Synchronization Validation Script
-- Purpose: Verify that auth.users and public.users are properly synchronized
-- Date: 2025-11-22
-- ============================================================================

-- ============================================================================
-- 1. Check for users in auth.users that are missing from public.users
-- ============================================================================
SELECT 
  'Missing in public.users' as issue_type,
  au.id as auth_user_id,
  au.email as auth_email,
  au.created_at as auth_created_at,
  NULL as public_user_id,
  NULL as public_email,
  NULL as public_created_at
FROM auth.users au
WHERE au.email IS NOT NULL
  AND au.email != ''
  AND NOT EXISTS (
    SELECT 1 
    FROM public.users pu 
    WHERE pu.id = au.id
  )

UNION ALL

-- ============================================================================
-- 2. Check for users in public.users that are missing from auth.users
-- ============================================================================
SELECT 
  'Missing in auth.users' as issue_type,
  NULL as auth_user_id,
  NULL as auth_email,
  NULL as auth_created_at,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.created_at as public_created_at
FROM public.users pu
WHERE NOT EXISTS (
  SELECT 1 
  FROM auth.users au 
  WHERE au.id = pu.id
)

UNION ALL

-- ============================================================================
-- 3. Check for email mismatches between auth.users and public.users
-- ============================================================================
SELECT 
  'Email mismatch' as issue_type,
  au.id as auth_user_id,
  au.email as auth_email,
  au.created_at as auth_created_at,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.created_at as public_created_at
FROM auth.users au
JOIN public.users pu ON pu.id = au.id
WHERE au.email != pu.email

ORDER BY issue_type, auth_email, public_email;

-- ============================================================================
-- 4. Summary statistics
-- ============================================================================
SELECT 
  'SUMMARY STATISTICS' as report_section,
  COUNT(DISTINCT au.id) as total_auth_users,
  COUNT(DISTINCT pu.id) as total_public_users,
  COUNT(DISTINCT CASE WHEN au.id = pu.id THEN au.id END) as matching_users,
  COUNT(DISTINCT au.id) - COUNT(DISTINCT CASE WHEN au.id = pu.id THEN au.id END) as missing_in_public,
  COUNT(DISTINCT pu.id) - COUNT(DISTINCT CASE WHEN au.id = pu.id THEN au.id END) as missing_in_auth
FROM auth.users au
FULL OUTER JOIN public.users pu ON pu.id = au.id
WHERE (au.email IS NOT NULL AND au.email != '') OR (pu.email IS NOT NULL AND pu.email != '');

-- ============================================================================
-- 5. Check specific test users mentioned in the checklist
-- ============================================================================
SELECT 
  'Test User Validation' as report_section,
  expected_email,
  expected_id,
  CASE 
    WHEN au.id = expected_id::UUID THEN 'AUTH: MATCH' 
    WHEN pu.id = expected_id::UUID THEN 'PUBLIC: MATCH' 
    WHEN au.id IS NULL AND pu.id IS NULL THEN 'MISSING BOTH'
    WHEN au.id IS NULL THEN 'MISSING IN AUTH'
    WHEN pu.id IS NULL THEN 'MISSING IN PUBLIC'
    ELSE 'ID MISMATCH'
  END as auth_status,
  CASE 
    WHEN pu.id = expected_id::UUID THEN 'PUBLIC: MATCH'
    WHEN au.id = expected_id::UUID THEN 'AUTH: MATCH'
    WHEN au.id IS NULL AND pu.id IS NULL THEN 'MISSING BOTH'
    WHEN au.id IS NULL THEN 'MISSING IN AUTH'
    WHEN pu.id IS NULL THEN 'MISSING IN PUBLIC'
    ELSE 'ID MISMATCH'
  END as public_status,
  au.email as auth_actual_email,
  pu.email as public_actual_email
FROM (
  VALUES 
    ('admin@acme.com', '6e084750-4e35-468c-9903-5b5ab9d14af4'),
    ('manager@acme.com', '2707509b-57e8-4c84-a6fe-267eaa724223'),
    ('engineer@acme.com', '27ff37b5-ef55-4e34-9951-42f35a1b2506'),
    ('user@acme.com', '3ce006ad-3a2b-45b8-b540-4b8634d0e410'),
    ('admin@techsolutions.com', '945ab101-36c0-4ef1-9e12-9d13294deb46'),
    ('manager@techsolutions.com', '4fe9bb56-c5cd-481b-bc7d-2275d7f3ebaf'),
    ('admin@globaltrading.com', 'de2b56b8-bffc-4a54-b1f4-4a058afe5c5f'),
    ('superadmin@platform.com', '465f34f1-e33c-475b-b42d-4feb4feaaf92'),
    ('superadmin2@platform.com', '5782d9ca-ef99-4f57-b9e2-2463d2fbb637'),
    ('superadmin3@platform.com', 'cad16f39-88a0-47c0-826d-bc84ebe59384')
) AS expected_users(expected_email, expected_id)
LEFT JOIN auth.users au ON au.email = expected_users.expected_email
LEFT JOIN public.users pu ON pu.email = expected_users.expected_email
ORDER BY expected_email;
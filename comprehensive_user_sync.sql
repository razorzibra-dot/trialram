-- ============================================================================
-- Comprehensive Missing Users Sync Script
-- Syncs ALL missing auth users to public.users with proper roles and permissions
-- ============================================================================

-- Step 1: Sync ALL missing auth users to public.users
INSERT INTO public.users (
  id,
  email,
  name,
  first_name,
  last_name,
  status,
  tenant_id,
  is_super_admin,
  created_at,
  updated_at,
  last_login
)
SELECT
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'display_name',
    split_part(au.email, '@', 1)
  ) as name,
  split_part(
    COALESCE(
      au.raw_user_meta_data->>'name',
      au.raw_user_meta_data->>'display_name',
      split_part(au.email, '@', 1)
    ),
    ' ',
    1
  ) as first_name,
  CASE 
    WHEN array_length(
      string_to_array(
        COALESCE(
          au.raw_user_meta_data->>'name',
          au.raw_user_meta_data->>'display_name',
          split_part(au.email, '@', 1)
        ),
        ' '
      ),
      1
    ) > 1 
    THEN array_to_string(
      (string_to_array(
        COALESCE(
          au.raw_user_meta_data->>'name',
          au.raw_user_meta_data->>'display_name',
          split_part(au.email, '@', 1)
        ),
        ' '
      ))[2:],
      ' '
    )
    ELSE NULL
  END as last_name,
  'active'::user_status as status,
  CASE
    -- Super admin detection
    WHEN au.email LIKE '%superadmin%' OR au.email LIKE '%@platform.com' OR au.email LIKE '%@platform.%' THEN NULL
    -- Tenant mapping
    WHEN au.email LIKE '%@acme.com' OR au.email LIKE '%@acme.%' THEN 
      COALESCE(
        (SELECT id FROM tenants WHERE name = 'Acme Corporation' LIMIT 1),
        '550e8400-e29b-41d4-a716-446655440001'::UUID  -- Default fallback
      )
    WHEN au.email LIKE '%@techsolutions.com' OR au.email LIKE '%@techsolutions.%' THEN 
      COALESCE(
        (SELECT id FROM tenants WHERE name = 'Tech Solutions Inc' LIMIT 1),
        '550e8400-e29b-41d4-a716-446655440002'::UUID  -- Default fallback
      )
    WHEN au.email LIKE '%@globaltrading.com' OR au.email LIKE '%@globaltrading.%' THEN 
      COALESCE(
        (SELECT id FROM tenants WHERE name = 'Global Trading Ltd' LIMIT 1),
        '550e8400-e29b-41d4-a716-446655440003'::UUID  -- Default fallback
      )
    ELSE 
      COALESCE(
        (SELECT id FROM tenants ORDER BY created_at LIMIT 1),
        '550e8400-e29b-41d4-a716-446655440001'::UUID  -- Default fallback
      )
  END as tenant_id,
  CASE
    WHEN au.email LIKE '%superadmin%' OR au.email LIKE '%@platform.com' OR au.email LIKE '%@platform.%' THEN TRUE
    ELSE FALSE
  END as is_super_admin,
  COALESCE(au.created_at, NOW()) as created_at,
  COALESCE(au.updated_at, NOW()) as updated_at,
  NULL as last_login
FROM auth.users au
WHERE au.email IS NOT NULL
  AND au.email != ''
  AND NOT EXISTS (
    SELECT 1 
    FROM public.users pu 
    WHERE pu.id = au.id
  )
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  status = EXCLUDED.status,
  tenant_id = EXCLUDED.tenant_id,
  is_super_admin = EXCLUDED.is_super_admin,
  updated_at = NOW();

-- Step 2: Create missing tenants if needed
DO $$
DECLARE
  tenant_count INTEGER;
BEGIN
  -- Create Acme Corporation tenant if it doesn't exist
  INSERT INTO tenants (
    id,
    name,
    domain,
    status,
    plan,
    created_at,
    settings
  ) VALUES (
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    'Acme Corporation',
    'acme.com',
    'active',
    'professional',
    NOW(),
    '{"features": {"advanced_analytics": true, "custom_fields": true}}'::jsonb
  )
  ON CONFLICT (name) DO NOTHING;
  
  -- Create Tech Solutions Inc tenant if it doesn't exist
  INSERT INTO tenants (
    id,
    name,
    domain,
    status,
    plan,
    created_at,
    settings
  ) VALUES (
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    'Tech Solutions Inc',
    'techsolutions.com',
    'active',
    'enterprise',
    NOW(),
    '{"features": {"advanced_analytics": true, "custom_fields": true, "api_access": true}}'::jsonb
  )
  ON CONFLICT (name) DO NOTHING;
  
  -- Create Global Trading Ltd tenant if it doesn't exist
  INSERT INTO tenants (
    id,
    name,
    domain,
    status,
    plan,
    created_at,
    settings
  ) VALUES (
    '550e8400-e29b-41d4-a716-446655440003'::UUID,
    'Global Trading Ltd',
    'globaltrading.com',
    'active',
    'professional',
    NOW(),
    '{"features": {"advanced_analytics": true}}'::jsonb
  )
  ON CONFLICT (name) DO NOTHING;

  SELECT COUNT(*) INTO tenant_count FROM tenants WHERE name IN ('Acme Corporation', 'Tech Solutions Inc', 'Global Trading Ltd');
  RAISE NOTICE 'Ensured % tenants exist for user assignment', tenant_count;
END $$;

-- Step 3: Create or ensure standard roles exist for each tenant
DO $$
DECLARE
  tenant_rec RECORD;
  role_id_val UUID;
  admin_role_id UUID;
  manager_role_id UUID;
  engineer_role_id UUID;
  customer_role_id UUID;
BEGIN
  FOR tenant_rec IN SELECT id, name FROM tenants
  LOOP
    -- Administrator role
    INSERT INTO roles (id, name, description, tenant_id, created_at)
    VALUES (gen_random_uuid(), 'Administrator', 'Full administrative access', tenant_rec.id, NOW())
    ON CONFLICT (name, tenant_id) DO UPDATE SET
      description = EXCLUDED.description,
      updated_at = NOW()
    RETURNING id INTO admin_role_id;

    -- Manager role
    INSERT INTO roles (id, name, description, tenant_id, created_at)
    VALUES (gen_random_uuid(), 'Manager', 'Management access with oversight', tenant_rec.id, NOW())
    ON CONFLICT (name, tenant_id) DO UPDATE SET
      description = EXCLUDED.description,
      updated_at = NOW()
    RETURNING id INTO manager_role_id;

    -- Engineer role
    INSERT INTO roles (id, name, description, tenant_id, created_at)
    VALUES (gen_random_uuid(), 'Engineer', 'Technical access for product/service management', tenant_rec.id, NOW())
    ON CONFLICT (name, tenant_id) DO UPDATE SET
      description = EXCLUDED.description,
      updated_at = NOW()
    RETURNING id INTO engineer_role_id;

    -- Customer role
    INSERT INTO roles (id, name, description, tenant_id, created_at)
    VALUES (gen_random_uuid(), 'Customer', 'Limited read-only access', tenant_rec.id, NOW())
    ON CONFLICT (name, tenant_id) DO UPDATE SET
      description = EXCLUDED.description,
      updated_at = NOW()
    RETURNING id INTO customer_role_id;

    RAISE NOTICE 'Created standard roles for tenant: %', tenant_rec.name;
  END LOOP;
END $$;

-- Step 4: Create Super Admin role (global, no tenant)
DO $$
DECLARE
  super_admin_role_id UUID;
BEGIN
  INSERT INTO roles (id, name, description, tenant_id, created_at)
  VALUES (gen_random_uuid(), 'super_admin', 'Platform super administrator with access to all tenants', NULL, NOW())
  ON CONFLICT (name, tenant_id) DO UPDATE SET
    description = EXCLUDED.description,
    updated_at = NOW()
  RETURNING id INTO super_admin_role_id;

  RAISE NOTICE 'Ensured super_admin role exists';
END $$;

-- Step 5: Ensure essential permissions exist
INSERT INTO permissions (id, name, description, category, created_at)
VALUES 
  (gen_random_uuid(), 'dashboard:view', 'Access tenant dashboard and analytics', 'navigation', NOW()),
  (gen_random_uuid(), 'masters:read', 'Access master data and configuration', 'navigation', NOW()),
  (gen_random_uuid(), 'user_management:read', 'Access user and role management interface', 'navigation', NOW())
ON CONFLICT (name) DO NOTHING;

-- Step 6: Assign roles to users based on email patterns
WITH user_role_mapping AS (
  SELECT
    au.id as user_id,
    CASE
      WHEN au.email LIKE '%superadmin%' OR au.email LIKE '%@platform.com' OR au.email LIKE '%@platform.%' THEN 'super_admin'
      WHEN au.email LIKE '%admin%' THEN 'Administrator'
      WHEN au.email LIKE '%manager%' THEN 'Manager'
      WHEN au.email LIKE '%engineer%' THEN 'Engineer'
      WHEN au.email LIKE '%customer%' THEN 'Customer'
      ELSE 'User'  -- Default fallback
    END as role_name,
    CASE
      WHEN au.email LIKE '%superadmin%' OR au.email LIKE '%@platform.com' OR au.email LIKE '%@platform.%' THEN NULL
      WHEN au.email LIKE '%@acme.com' OR au.email LIKE '%@acme.%' THEN 
        (SELECT id FROM tenants WHERE name = 'Acme Corporation' LIMIT 1)
      WHEN au.email LIKE '%@techsolutions.com' OR au.email LIKE '%@techsolutions.%' THEN 
        (SELECT id FROM tenants WHERE name = 'Tech Solutions Inc' LIMIT 1)
      WHEN au.email LIKE '%@globaltrading.com' OR au.email LIKE '%@globaltrading.%' THEN 
        (SELECT id FROM tenants WHERE name = 'Global Trading Ltd' LIMIT 1)
      ELSE (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
    END as tenant_id
  FROM auth.users au
  WHERE au.email IS NOT NULL
    AND au.email != ''
    AND EXISTS (
      SELECT 1 
      FROM public.users pu 
      WHERE pu.id = au.id
    )
)
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
SELECT
  urm.user_id,
  r.id,
  urm.tenant_id,
  NOW()
FROM user_role_mapping urm
JOIN roles r ON r.name = urm.role_name 
  AND (r.tenant_id = urm.tenant_id OR (urm.tenant_id IS NULL AND r.tenant_id IS NULL))
ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

-- Step 7: Create User role if it doesn't exist and assign to any users that need it
DO $$
DECLARE
  tenant_rec RECORD;
  user_role_id UUID;
BEGIN
  FOR tenant_rec IN SELECT id FROM tenants
  LOOP
    INSERT INTO roles (id, name, description, tenant_id, created_at)
    VALUES (gen_random_uuid(), 'User', 'Standard user access', tenant_rec.id, NOW())
    ON CONFLICT (name, tenant_id) DO UPDATE SET
      updated_at = NOW()
    RETURNING id INTO user_role_id;

    -- Assign User role to any users who don't have a role yet
    INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
    SELECT DISTINCT
      u.id,
      user_role_id,
      u.tenant_id,
      NOW()
    FROM public.users u
    WHERE u.tenant_id = tenant_rec.id
      AND NOT EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
      );
  END LOOP;
  
  RAISE NOTICE 'Created User roles and assigned to users without roles';
END $$;

-- Step 8: Grant dashboard permissions to all relevant roles
INSERT INTO role_permissions (role_id, permission_id, granted_by)
SELECT DISTINCT
  r.id as role_id,
  p.id as permission_id,
  NULL::UUID as granted_by
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('Administrator', 'Manager', 'User', 'Engineer', 'Customer')
  AND p.name IN ('dashboard:view', 'masters:read', 'user_management:read')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Step 9: Verify the sync results
SELECT 
  'SYNC SUMMARY' as report_section,
  COUNT(DISTINCT au.id) as total_auth_users,
  COUNT(DISTINCT pu.id) as total_public_users,
  COUNT(DISTINCT CASE WHEN au.id = pu.id THEN au.id END) as successfully_synced,
  COUNT(DISTINCT au.id) - COUNT(DISTINCT CASE WHEN au.id = pu.id THEN au.id END) as still_missing
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE au.email IS NOT NULL AND au.email != '';

-- Detailed user verification for the problematic user
SELECT 
  'SPECIFIC USER CHECK' as report_section,
  pu.id,
  pu.email,
  pu.name,
  pu.tenant_id,
  t.name as tenant_name,
  r.name as role_name,
  array_agg(p.name) as permissions
FROM public.users pu
LEFT JOIN tenants t ON pu.tenant_id = t.id
LEFT JOIN user_roles ur ON pu.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE pu.id = '6f0f3d9c-c006-430b-bebb-8b0a386bf033'
GROUP BY pu.id, pu.email, pu.name, pu.tenant_id, t.name, r.name;
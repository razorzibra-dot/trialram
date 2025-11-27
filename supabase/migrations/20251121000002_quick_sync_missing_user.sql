-- ============================================================================
-- Migration: Quick Sync Missing User
-- Date: 2025-11-21
-- Purpose: Manually sync a specific auth user to public.users if they don't exist
--          This is a temporary fix for users created before the sync trigger
-- ============================================================================

-- Sync the specific user that's causing the error
-- Replace the user ID below with the actual auth user ID if different
DO $$
DECLARE
  target_user_id UUID := '903d5e30-7799-44a1-90c8-f9a448edf64c';
  auth_user_record RECORD;
  user_tenant_id UUID;
  role_name TEXT;
  role_id_val UUID;
BEGIN
  -- Get the auth user
  SELECT * INTO auth_user_record
  FROM auth.users
  WHERE id = target_user_id;

  IF auth_user_record IS NULL THEN
    RAISE NOTICE 'Auth user % not found', target_user_id;
    RETURN;
  END IF;

  -- Check if user already exists in public.users
  IF EXISTS (SELECT 1 FROM public.users WHERE id = target_user_id) THEN
    RAISE NOTICE 'User % already exists in public.users', target_user_id;
    RETURN;
  END IF;

  -- Determine tenant_id and role based on email
  IF auth_user_record.email LIKE '%superadmin%' 
     OR auth_user_record.email LIKE '%@platform.com' 
     OR auth_user_record.email LIKE '%@platform.%' THEN
    user_tenant_id := NULL;
    role_name := 'super_admin';
  ELSE
    -- Map email domain to tenant
    SELECT id INTO user_tenant_id
    FROM tenants
    WHERE (
      CASE 
        WHEN auth_user_record.email LIKE '%@acme.com' OR auth_user_record.email LIKE '%@acme.%' THEN name = 'Acme Corporation'
        WHEN auth_user_record.email LIKE '%@techsolutions.com' OR auth_user_record.email LIKE '%@techsolutions.%' THEN name = 'Tech Solutions Inc'
        WHEN auth_user_record.email LIKE '%@globaltrading.com' OR auth_user_record.email LIKE '%@globaltrading.%' THEN name = 'Global Trading Ltd'
        ELSE FALSE
      END
    )
    LIMIT 1;

    -- Default to first tenant if no match
    IF user_tenant_id IS NULL THEN
      SELECT id INTO user_tenant_id FROM tenants ORDER BY created_at LIMIT 1;
    END IF;

    -- Determine role name from email
    role_name := CASE
      WHEN auth_user_record.email LIKE '%admin%' THEN 'Administrator'
      WHEN auth_user_record.email LIKE '%manager%' THEN 'Manager'
      WHEN auth_user_record.email LIKE '%engineer%' THEN 'Engineer'
      WHEN auth_user_record.email LIKE '%customer%' THEN 'Customer'
      ELSE 'User'
    END;
  END IF;

  -- Insert user into public.users
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
  VALUES (
    target_user_id,
    auth_user_record.email,
    COALESCE(
      auth_user_record.raw_user_meta_data->>'name',
      auth_user_record.raw_user_meta_data->>'display_name',
      split_part(auth_user_record.email, '@', 1)
    ),
    split_part(
      COALESCE(
        auth_user_record.raw_user_meta_data->>'name',
        auth_user_record.raw_user_meta_data->>'display_name',
        split_part(auth_user_record.email, '@', 1)
      ),
      ' ',
      1
    ),
    CASE 
      WHEN array_length(
        string_to_array(
          COALESCE(
            auth_user_record.raw_user_meta_data->>'name',
            auth_user_record.raw_user_meta_data->>'display_name',
            split_part(auth_user_record.email, '@', 1)
          ),
          ' '
        ),
        1
      ) > 1 
      THEN array_to_string(
        (string_to_array(
          COALESCE(
            auth_user_record.raw_user_meta_data->>'name',
            auth_user_record.raw_user_meta_data->>'display_name',
            split_part(auth_user_record.email, '@', 1)
          ),
          ' '
        ))[2:],
        ' '
      )
      ELSE NULL
    END,
    'active'::user_status,
    user_tenant_id,
    CASE
      WHEN auth_user_record.email LIKE '%superadmin%' 
           OR auth_user_record.email LIKE '%@platform.com' 
           OR auth_user_record.email LIKE '%@platform.%' THEN TRUE
      ELSE FALSE
    END,
    COALESCE(auth_user_record.created_at, NOW()),
    COALESCE(auth_user_record.updated_at, NOW()),
    NULL
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

  RAISE NOTICE 'User % synced to public.users', target_user_id;

  -- Assign role via user_roles table
  SELECT id INTO role_id_val
  FROM roles
  WHERE name = role_name
    AND (tenant_id = user_tenant_id OR (user_tenant_id IS NULL AND tenant_id IS NULL))
  LIMIT 1;

  IF role_id_val IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
    VALUES (target_user_id, role_id_val, user_tenant_id, NOW())
    ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;
    
    RAISE NOTICE 'Role % assigned to user %', role_name, target_user_id;
  ELSE
    RAISE WARNING 'Role % not found for user %', role_name, target_user_id;
  END IF;

END $$;

-- Also sync ALL other missing auth users
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
    WHEN au.email LIKE '%superadmin%' OR au.email LIKE '%@platform.com' OR au.email LIKE '%@platform.%' THEN NULL
    WHEN au.email LIKE '%@acme.com' OR au.email LIKE '%@acme.%' THEN 
      (SELECT id FROM tenants WHERE name = 'Acme Corporation' LIMIT 1)
    WHEN au.email LIKE '%@techsolutions.com' OR au.email LIKE '%@techsolutions.%' THEN 
      (SELECT id FROM tenants WHERE name = 'Tech Solutions Inc' LIMIT 1)
    WHEN au.email LIKE '%@globaltrading.com' OR au.email LIKE '%@globaltrading.%' THEN 
      (SELECT id FROM tenants WHERE name = 'Global Trading Ltd' LIMIT 1)
    ELSE (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
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

-- Assign roles for all newly synced users
WITH user_role_mapping AS (
  SELECT
    au.id as user_id,
    CASE
      WHEN au.email LIKE '%superadmin%' OR au.email LIKE '%@platform.com' OR au.email LIKE '%@platform.%' THEN 'super_admin'
      WHEN au.email LIKE '%admin%' THEN 'Administrator'
      WHEN au.email LIKE '%manager%' THEN 'Manager'
      WHEN au.email LIKE '%engineer%' THEN 'Engineer'
      WHEN au.email LIKE '%customer%' THEN 'Customer'
      ELSE 'User'
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
    AND NOT EXISTS (
      SELECT 1 
      FROM user_roles ur 
      WHERE ur.user_id = au.id
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


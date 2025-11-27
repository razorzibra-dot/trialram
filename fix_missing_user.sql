-- ============================================================================
-- Quick Fix: Sync Missing User to public.users
-- Run this directly in Supabase SQL Editor or via psql
-- User ID: 903d5e30-7799-44a1-90c8-f9a448edf64c
-- ============================================================================

-- Step 1: Check if user exists in auth.users
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
    RAISE NOTICE 'Auth user % not found in auth.users', target_user_id;
    RETURN;
  END IF;

  RAISE NOTICE 'Found auth user: % (email: %)', target_user_id, auth_user_record.email;

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

  RAISE NOTICE 'Determined tenant_id: %, role: %', user_tenant_id, role_name;

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
    
    RAISE NOTICE 'Role % (id: %) assigned to user %', role_name, role_id_val, target_user_id;
  ELSE
    RAISE WARNING 'Role % not found for user %. Available roles:', role_name, target_user_id;
    -- Show available roles for debugging
    FOR role_id_val IN SELECT id, name, tenant_id FROM roles WHERE tenant_id = user_tenant_id OR (user_tenant_id IS NULL AND tenant_id IS NULL) LIMIT 10
    LOOP
      RAISE NOTICE '  Available role: % (id: %, tenant_id: %)', role_id_val.name, role_id_val.id, role_id_val.tenant_id;
    END LOOP;
  END IF;

END $$;

-- Step 2: Verify the user was created
SELECT 
  u.id,
  u.email,
  u.name,
  u.tenant_id,
  u.is_super_admin,
  r.name as role_name
FROM public.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.id = '903d5e30-7799-44a1-90c8-f9a448edf64c';


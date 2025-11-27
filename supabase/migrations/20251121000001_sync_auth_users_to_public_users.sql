-- ============================================================================
-- Migration: Sync Auth Users to Public Users Table
-- Date: 2025-11-21
-- Purpose: Ensure all auth.users have corresponding entries in public.users
--          This fixes the issue where auth users exist but database users don't
-- ============================================================================

-- ============================================================================
-- Step 1: Create function to sync auth users to public.users
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_auth_user_to_public_user()
RETURNS TRIGGER AS $$
DECLARE
  user_tenant_id UUID;
  role_name TEXT;
  user_name TEXT;
  is_super_admin_flag BOOLEAN;
BEGIN
  -- Extract user metadata
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  -- Determine if user is super admin (email contains 'superadmin' or 'platform')
  is_super_admin_flag := (
    NEW.email LIKE '%superadmin%' OR 
    NEW.email LIKE '%@platform.com' OR
    NEW.email LIKE '%@platform.%'
  );

  -- Determine tenant_id and role_name based on email domain
  -- Super admins get NULL tenant_id
  IF is_super_admin_flag THEN
    user_tenant_id := NULL;
    role_name := 'super_admin';
  ELSE
    -- Map email domain to tenant_id
    SELECT id INTO user_tenant_id
    FROM tenants
    WHERE (
      CASE 
        WHEN NEW.email LIKE '%@acme.com' OR NEW.email LIKE '%@acme.%' THEN name = 'Acme Corporation'
        WHEN NEW.email LIKE '%@techsolutions.com' OR NEW.email LIKE '%@techsolutions.%' THEN name = 'Tech Solutions Inc'
        WHEN NEW.email LIKE '%@globaltrading.com' OR NEW.email LIKE '%@globaltrading.%' THEN name = 'Global Trading Ltd'
        ELSE FALSE
      END
    )
    LIMIT 1;

    -- Default to first tenant if no match found (for development)
    IF user_tenant_id IS NULL THEN
      SELECT id INTO user_tenant_id FROM tenants ORDER BY created_at LIMIT 1;
    END IF;

    -- Determine role name from email (mapped to roles table names)
    role_name := CASE
      WHEN NEW.email LIKE '%admin%' THEN 'Administrator'
      WHEN NEW.email LIKE '%manager%' THEN 'Manager'
      WHEN NEW.email LIKE '%engineer%' THEN 'Engineer'
      WHEN NEW.email LIKE '%customer%' THEN 'Customer'
      ELSE 'User' -- Default role
    END;
  END IF;

  -- Insert or update user in public.users (role is managed via user_roles table)
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
    NEW.id,
    NEW.email,
    user_name,
    split_part(user_name, ' ', 1),
    CASE 
      WHEN array_length(string_to_array(user_name, ' '), 1) > 1 
      THEN array_to_string((string_to_array(user_name, ' '))[2:], ' ')
      ELSE NULL
    END,
    'active'::user_status,
    user_tenant_id,
    is_super_admin_flag,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW()),
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

  -- Assign role via user_roles table
  INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
  SELECT
    NEW.id,
    r.id,
    user_tenant_id,
    NOW()
  FROM roles r
  WHERE r.name = role_name
    AND (r.tenant_id = user_tenant_id OR (user_tenant_id IS NULL AND r.tenant_id IS NULL))
  ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 2: Create trigger to auto-sync new auth users
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_user_to_public_user();

-- ============================================================================
-- Step 3: Sync existing auth users that don't have public.users entries
-- ============================================================================

-- Insert missing users from auth.users into public.users (role is managed via user_roles table)
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
    -- Super admins get NULL tenant_id
    WHEN au.email LIKE '%superadmin%' OR au.email LIKE '%@platform.com' OR au.email LIKE '%@platform.%' THEN NULL
    -- Map email domain to tenant
    WHEN au.email LIKE '%@acme.com' OR au.email LIKE '%@acme.%' THEN 
      (SELECT id FROM tenants WHERE name = 'Acme Corporation' LIMIT 1)
    WHEN au.email LIKE '%@techsolutions.com' OR au.email LIKE '%@techsolutions.%' THEN 
      (SELECT id FROM tenants WHERE name = 'Tech Solutions Inc' LIMIT 1)
    WHEN au.email LIKE '%@globaltrading.com' OR au.email LIKE '%@globaltrading.%' THEN 
      (SELECT id FROM tenants WHERE name = 'Global Trading Ltd' LIMIT 1)
    -- Default to first tenant if no match
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

-- Assign roles via user_roles table for newly synced users
-- This uses a CTE to determine the role name and tenant_id, then joins with roles table
WITH user_role_mapping AS (
  SELECT
    au.id as user_id,
    CASE
      -- Super admin role
      WHEN au.email LIKE '%superadmin%' OR au.email LIKE '%@platform.com' OR au.email LIKE '%@platform.%' THEN 'super_admin'
      -- Regular user roles based on email pattern
      WHEN au.email LIKE '%admin%' THEN 'Administrator'
      WHEN au.email LIKE '%manager%' THEN 'Manager'
      WHEN au.email LIKE '%engineer%' THEN 'Engineer'
      WHEN au.email LIKE '%user%' THEN 'User'
      WHEN au.email LIKE '%customer%' THEN 'Customer'
      ELSE 'User' -- Default role
    END as role_name,
    CASE
      -- Super admins have NULL tenant_id
      WHEN au.email LIKE '%superadmin%' OR au.email LIKE '%@platform.com' OR au.email LIKE '%@platform.%' THEN NULL
      -- Map email domain to tenant
      WHEN au.email LIKE '%@acme.com' OR au.email LIKE '%@acme.%' THEN 
        (SELECT id FROM tenants WHERE name = 'Acme Corporation' LIMIT 1)
      WHEN au.email LIKE '%@techsolutions.com' OR au.email LIKE '%@techsolutions.%' THEN 
        (SELECT id FROM tenants WHERE name = 'Tech Solutions Inc' LIMIT 1)
      WHEN au.email LIKE '%@globaltrading.com' OR au.email LIKE '%@globaltrading.%' THEN 
        (SELECT id FROM tenants WHERE name = 'Global Trading Ltd' LIMIT 1)
      -- Default to first tenant if no match
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
      JOIN roles r ON ur.role_id = r.id
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

-- ============================================================================
-- Step 4: Update existing users to match auth users (if email changed)
-- ============================================================================

UPDATE public.users pu
SET
  email = au.email,
  name = COALESCE(
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'display_name',
    pu.name,
    split_part(au.email, '@', 1)
  ),
  updated_at = NOW()
FROM auth.users au
WHERE pu.id = au.id
  AND pu.email != au.email;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show auth users without public.users entries (should be empty after migration)
SELECT 
  au.id,
  au.email,
  'Missing in public.users' as status
FROM auth.users au
WHERE au.email IS NOT NULL
  AND au.email != ''
  AND NOT EXISTS (
    SELECT 1 
    FROM public.users pu 
    WHERE pu.id = au.id
  );

-- Show count of synced users
SELECT 
  COUNT(*) as total_auth_users,
  COUNT(pu.id) as synced_users,
  COUNT(*) - COUNT(pu.id) as missing_users
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE au.email IS NOT NULL AND au.email != '';


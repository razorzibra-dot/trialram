-- Migration: Ensure acme@admin.com user exists and has Administrator role
-- Purpose: Fix user role assignment for admin user
-- Date: 2025-11-28

DO $$
DECLARE
  admin_user_id UUID;
  admin_role_id UUID;
  tenant_id_val UUID;
  auth_user_id UUID;
  user_email TEXT;
  verify_email TEXT;
  verify_role TEXT;
  verify_count INTEGER;
BEGIN
  -- Step 1: Check if user exists in auth.users (try both email formats)
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email IN ('acme@admin.com', 'admin@acme.com')
  LIMIT 1;

  IF auth_user_id IS NULL THEN
    RAISE NOTICE 'User admin@acme.com does not exist in auth.users. Please create the user first by logging in.';
    RETURN;
  END IF;

  RAISE NOTICE 'Found auth user: %', auth_user_id;

  -- Step 2: Get or create user in public.users
  SELECT id, tenant_id INTO admin_user_id, tenant_id_val
  FROM public.users
  WHERE email IN ('acme@admin.com', 'admin@acme.com')
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    -- User doesn't exist in public.users, create it
    -- Find tenant for acme.com domain
    SELECT id INTO tenant_id_val
    FROM tenants
    WHERE name = 'Acme Corporation'
    LIMIT 1;

    IF tenant_id_val IS NULL THEN
      -- Get first tenant as fallback
      SELECT id INTO tenant_id_val FROM tenants ORDER BY created_at LIMIT 1;
    END IF;

    -- Get email from auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = auth_user_id;
    
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
      updated_at
    )
    VALUES (
      auth_user_id,
      user_email,
      'Admin User',
      'Admin',
      'User',
      'active'::user_status,
      tenant_id_val,
      false,
      NOW(),
      NOW()
    )
    RETURNING id INTO admin_user_id;

    RAISE NOTICE 'Created user in public.users: %', admin_user_id;
  ELSE
    RAISE NOTICE 'User already exists in public.users: %', admin_user_id;
  END IF;

  -- Step 3: Find Administrator role for this tenant
  SELECT id INTO admin_role_id
  FROM roles
  WHERE name = 'Administrator'
    AND (tenant_id = tenant_id_val OR (tenant_id IS NULL AND tenant_id_val IS NULL))
  LIMIT 1;

  IF admin_role_id IS NULL THEN
    RAISE NOTICE 'Administrator role not found for tenant: %. Trying to find any Administrator role.', tenant_id_val;
    SELECT id INTO admin_role_id
    FROM roles
    WHERE name = 'Administrator'
    LIMIT 1;
  END IF;

  IF admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Administrator role not found in database. Please run the seed migration first.';
  END IF;

  RAISE NOTICE 'Found Administrator role: %', admin_role_id;

  -- Step 4: Ensure user has Administrator role assigned
  INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
  VALUES (admin_user_id, admin_role_id, tenant_id_val, NOW())
  ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE
  SET assigned_at = NOW();

  RAISE NOTICE 'User role assignment completed successfully';

  -- Step 5: Verify the assignment
  SELECT 
    u.email,
    r.name,
    COUNT(DISTINCT p.id)
  INTO verify_email, verify_role, verify_count
  FROM users u
  JOIN user_roles ur ON u.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  JOIN role_permissions rp ON r.id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE u.id = admin_user_id
    AND (p.name LIKE 'users:%' OR p.name = 'user_management:read')
  GROUP BY u.email, r.name;

  IF verify_email IS NOT NULL THEN
    RAISE NOTICE 'Verification: User % has role % with % user management permissions', 
      verify_email, verify_role, verify_count;
  ELSE
    RAISE NOTICE 'Warning: Could not verify role assignment. User may need to log out and log back in.';
  END IF;

EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE NOTICE 'Warning: Could not verify role assignment. User may need to log out and log back in.';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error: %', SQLERRM;
END $$;

-- Final verification query
SELECT 
  'Final Verification' as status,
  u.email,
  u.id as user_id,
  r.name as role_name,
  COUNT(DISTINCT p.id) as user_management_permission_count,
  STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name) as permissions
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.email IN ('acme@admin.com', 'admin@acme.com')
  AND (p.name LIKE 'users:%' OR p.name = 'user_management:read')
GROUP BY u.email, u.id, r.name;


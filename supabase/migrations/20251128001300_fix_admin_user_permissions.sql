-- Migration: Fix admin user permissions
-- Purpose: Ensure acme@admin.com user has Administrator role with all permissions
-- Date: 2025-11-28

-- Step 1: Verify the user exists and get their ID
DO $$
DECLARE
  admin_user_id UUID;
  admin_role_id UUID;
  tenant_id_val UUID;
  perm_count INTEGER;
BEGIN
  -- Find the user
  SELECT id, tenant_id INTO admin_user_id, tenant_id_val
  FROM users
  WHERE email = 'acme@admin.com'
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'User acme@admin.com not found. Please create the user first.';
    RETURN;
  END IF;

  RAISE NOTICE 'Found user acme@admin.com with ID: %', admin_user_id;
  RAISE NOTICE 'User tenant_id: %', tenant_id_val;

  -- Find the Administrator role for this tenant
  SELECT id INTO admin_role_id
  FROM roles
  WHERE name = 'Administrator'
    AND (tenant_id = tenant_id_val OR (tenant_id IS NULL AND tenant_id_val IS NULL))
  LIMIT 1;

  IF admin_role_id IS NULL THEN
    RAISE NOTICE 'Administrator role not found for tenant: %', tenant_id_val;
    RETURN;
  END IF;

  RAISE NOTICE 'Found Administrator role with ID: %', admin_role_id;

  -- Ensure user has Administrator role assigned
  INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
  VALUES (admin_user_id, admin_role_id, tenant_id_val, NOW())
  ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE
  SET assigned_at = NOW();

  RAISE NOTICE 'User role assignment verified/updated';

  -- Verify permissions for Administrator role
  SELECT COUNT(*) INTO perm_count
  FROM role_permissions rp
  JOIN permissions p ON rp.permission_id = p.id
  WHERE rp.role_id = admin_role_id
    AND p.name IN ('users:read', 'users:create', 'users:update', 'users:delete', 'users:manage', 'user_management:read');

  RAISE NOTICE 'Administrator role has % user management permissions', perm_count;
END $$;

-- Step 2: Check if user exists
SELECT 
  'User Check' as check_type,
  u.email,
  u.id as user_id,
  u.tenant_id,
  CASE WHEN u.id IS NULL THEN 'NOT FOUND' ELSE 'EXISTS' END as status
FROM users u
WHERE u.email = 'acme@admin.com'
LIMIT 1;

-- Step 3: Check all users with 'admin' in email
SELECT 
  'All Admin Users' as check_type,
  u.email,
  u.id as user_id,
  u.tenant_id
FROM users u
WHERE u.email LIKE '%admin%'
ORDER BY u.email;

-- Step 4: Check user's role assignment
SELECT 
  'User Role Assignment' as check_type,
  u.email,
  u.id as user_id,
  r.name as role_name,
  r.id as role_id,
  ur.assigned_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'acme@admin.com';

-- Step 5: Check what roles exist
SELECT 
  'Available Roles' as check_type,
  r.name as role_name,
  r.id as role_id,
  r.tenant_id,
  COUNT(ur.user_id) as user_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
WHERE r.name IN ('Administrator', 'Manager', 'super_admin')
GROUP BY r.name, r.id, r.tenant_id
ORDER BY r.name, r.tenant_id;

-- Step 6: Check Administrator role permissions
SELECT 
  'Administrator Permissions' as check_type,
  r.name as role_name,
  p.name as permission_name,
  p.resource,
  p.action
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'Administrator'
  AND (p.name LIKE 'users:%' OR p.name = 'user_management:read')
ORDER BY p.name;


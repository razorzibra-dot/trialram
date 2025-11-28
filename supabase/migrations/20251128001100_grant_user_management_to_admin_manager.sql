-- Migration: Grant full user management access to admin and manager roles
-- Purpose: Ensure admin and manager roles have all user management permissions
-- Date: 2025-11-28
--
-- ⚠️ CRITICAL: This migration ensures admin and manager roles have all granular
-- user management permissions required for permission hooks to work correctly.
-- See Repo.md section 2.9 for details on permission hook property name consistency.
--
-- ✅ Uses normalized role names: 'admin' and 'manager' (not 'Administrator' and 'Manager')
--
-- This migration is idempotent and safe to run multiple times. It will:
-- 1. Create granular permissions if they don't exist (users:read, users:create, users:update, users:delete)
-- 2. Assign all user management permissions to admin role
-- 3. Assign all user management permissions to manager role
--
-- Note: The isolated_reset migration (20251126000001) already includes these permissions
-- and assignments, so this migration is primarily for fixing existing databases.

-- First, ensure granular user management permissions exist
-- These are needed for fine-grained permission checks in the application
-- ⚠️ These permissions are checked by authService.hasPermission() and must exist

INSERT INTO permissions (name, description, category, resource, action, is_system_permission)
VALUES
  ('users:read', 'Read user information', 'module', 'users', 'read', false),
  ('users:create', 'Create new users', 'module', 'users', 'create', false),
  ('users:update', 'Update user information', 'module', 'users', 'update', false),
  ('users:delete', 'Delete users', 'module', 'users', 'delete', false)
ON CONFLICT (name) DO NOTHING;

-- Grant all user management permissions to admin role
-- admin should have full user management access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name IN (
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'users:manage',
    'user_management:read'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Grant all user management permissions to manager role
-- manager should also have full user management access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager'
  AND p.name IN (
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'users:manage',
    'user_management:read'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );

-- Verify the permissions were assigned
DO $$
DECLARE
  admin_count INTEGER;
  manager_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM role_permissions rp
  JOIN roles r ON rp.role_id = r.id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE r.name = 'admin'
    AND p.name IN ('users:read', 'users:create', 'users:update', 'users:delete', 'users:manage', 'user_management:read');
  
  SELECT COUNT(*) INTO manager_count
  FROM role_permissions rp
  JOIN roles r ON rp.role_id = r.id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE r.name = 'manager'
    AND p.name IN ('users:read', 'users:create', 'users:update', 'users:delete', 'users:manage', 'user_management:read');
  
  RAISE NOTICE 'admin role now has % user management permissions', admin_count;
  RAISE NOTICE 'manager role now has % user management permissions', manager_count;
END $$;


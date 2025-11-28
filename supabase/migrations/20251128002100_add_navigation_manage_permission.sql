-- ============================================================================
-- Migration: Add navigation:manage permission
-- Date: 2025-11-28
-- Purpose: Add permission for managing navigation items
-- ============================================================================

BEGIN;

-- Add navigation:manage permission
INSERT INTO permissions (name, description, category, resource, action, is_system_permission)
VALUES (
  'navigation:manage',
  'Manage navigation items and menu structure',
  'administrative',
  'navigation',
  'manage',
  false
) ON CONFLICT (name) DO NOTHING;

-- Grant navigation:manage to admin and manager roles (for all tenants)
DO $$
DECLARE
  admin_role_id UUID;
  manager_role_id UUID;
  nav_permission_id UUID;
BEGIN
  -- Get permission ID
  SELECT id INTO nav_permission_id
  FROM permissions
  WHERE name = 'navigation:manage'
  LIMIT 1;

  IF nav_permission_id IS NULL THEN
    RAISE EXCEPTION 'Navigation permission not found';
  END IF;

  -- Grant to admin role for all tenants
  FOR admin_role_id IN
    SELECT id FROM roles WHERE name = 'admin'
  LOOP
    INSERT INTO role_permissions (role_id, permission_id, granted_at)
    VALUES (admin_role_id, nav_permission_id, NOW())
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;

  -- Grant to manager role for all tenants
  FOR manager_role_id IN
    SELECT id FROM roles WHERE name = 'manager'
  LOOP
    INSERT INTO role_permissions (role_id, permission_id, granted_at)
    VALUES (manager_role_id, nav_permission_id, NOW())
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Added navigation:manage permission
-- - Granted to admin and manager roles for all tenants
-- ============================================================================


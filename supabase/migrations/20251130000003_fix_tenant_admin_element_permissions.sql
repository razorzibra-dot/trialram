-- ============================================================================
-- FIX TENANT ADMIN ELEMENT PERMISSIONS
-- Ensures tenant_admin roles get all necessary UI element permissions
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: UPDATE ELEMENT PERMISSIONS ASSIGNMENT FOR TENANT_ADMIN
-- ============================================================================

-- First, ensure tenant_admin roles get ALL element permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.element_path IS NOT NULL
  AND r.name = 'tenant_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 2: ENSURE USER MANAGEMENT ELEMENT PERMISSIONS FOR TENANT_ADMIN
-- ============================================================================

-- Make sure tenant_admin gets specific user management UI permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
  -- User list permissions
  'crm:user:list:view:accessible',
  'crm:user:list:button.create:visible',
  'crm:user:list:button.export:visible',
  'crm:user:list:filters:visible',
  'crm:user:list:button.refresh:visible',
  -- Per-user action permissions
  'crm:user.*:button.edit:visible',
  'crm:user.*:button.resetpassword:visible',
  'crm:user.*:button.delete:visible',
  -- Legacy admin permissions (if they exist)
  'crm:admin:users:list:view',
  'crm:admin:roles:assign:enabled'
)
WHERE r.name = 'tenant_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 3: ENSURE ALL ADMIN ROLES HAVE COMPREHENSIVE ACCESS
-- ============================================================================

-- Make sure any role with user management permissions gets UI permissions
WITH admin_roles AS (
  SELECT DISTINCT r.id
  FROM roles r
  JOIN role_permissions rp ON rp.role_id = r.id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE p.name IN (
    'crm:user:record:create',
    'crm:user:record:update',
    'crm:user:record:delete'
  )
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT ar.id, p.id
FROM admin_roles ar
CROSS JOIN permissions p
WHERE p.element_path IS NOT NULL
  AND p.element_path LIKE 'user:%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 4: VALIDATION QUERY
-- ============================================================================

-- Optional: Log what we assigned for debugging
DO $$
DECLARE
  tenant_admin_count INTEGER;
  element_perms_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT r.id) INTO tenant_admin_count
  FROM roles r
  WHERE r.name = 'tenant_admin';

  SELECT COUNT(DISTINCT rp.role_id) INTO element_perms_count
  FROM role_permissions rp
  JOIN permissions p ON p.id = rp.permission_id
  WHERE p.element_path IS NOT NULL;

  RAISE NOTICE 'Assigned element permissions to % tenant_admin roles', tenant_admin_count;
  RAISE NOTICE 'Total roles with element permissions: %', element_perms_count;
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - tenant_admin roles now get all element-level permissions
-- - User management UI permissions explicitly assigned
-- - Any role with user CRUD permissions gets UI permissions
-- ============================================================================

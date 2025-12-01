-- ============================================================================
-- User Management Element Permissions
-- Ensures UI-level permissions exist for Users/Role modules post reset
-- ============================================================================

BEGIN;

-- Insert missing element-level permissions for user management screens
INSERT INTO permissions (name, description, resource, action, category, is_system_permission, element_path) VALUES
  ('crm:user:list:view:accessible', 'Allow access to the user list view', 'user', 'list:view:accessible', 'administrative', true, 'user:list:view'),
  ('crm:user:list:button.create:visible', 'Show the create user button', 'user', 'list:button.create:visible', 'administrative', true, 'user:list:button.create'),
  ('crm:user:list:button.export:visible', 'Show the export users button', 'user', 'list:button.export:visible', 'administrative', true, 'user:list:button.export'),
  ('crm:user:list:filters:visible', 'Enable advanced filters on the user list', 'user', 'list:filters:visible', 'administrative', true, 'user:list:filters'),
  ('crm:user:list:button.refresh:visible', 'Show the refresh button on user list', 'user', 'list:button.refresh:visible', 'administrative', true, 'user:list:button.refresh'),
  ('crm:user.*:button.edit:visible', 'Enable edit action within per-user menus', 'user', 'record:button.edit:visible', 'administrative', true, 'user:record:button.edit'),
  ('crm:user.*:button.resetpassword:visible', 'Enable reset password action on user rows', 'user', 'record:button.resetpassword:visible', 'administrative', true, 'user:record:button.resetpassword'),
  ('crm:user.*:button.delete:visible', 'Enable delete action on user rows', 'user', 'record:button.delete:visible', 'administrative', true, 'user:record:button.delete')
ON CONFLICT (name) DO NOTHING;

-- Grant the new permissions to any role that already manages user records
WITH new_permissions AS (
  SELECT id FROM permissions
  WHERE name IN (
    'crm:user:list:view:accessible',
    'crm:user:list:button.create:visible',
    'crm:user:list:button.export:visible',
    'crm:user:list:filters:visible',
    'crm:user:list:button.refresh:visible',
    'crm:user.*:button.edit:visible',
    'crm:user.*:button.resetpassword:visible',
    'crm:user.*:button.delete:visible'
  )
),
user_management_roles AS (
  SELECT DISTINCT rp.role_id
  FROM role_permissions rp
  JOIN permissions p ON p.id = rp.permission_id
  WHERE p.name IN (
    'crm:user:record:read',
    'crm:user:record:create',
    'crm:user:record:update',
    'crm:user:record:delete'
  )
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT umr.role_id, np.id
FROM user_management_roles umr
CROSS JOIN new_permissions np
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;


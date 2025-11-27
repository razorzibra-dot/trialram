-- Migration: Verify Administrator and Manager role permissions
-- Purpose: Debug script to check what permissions are assigned
-- Date: 2025-11-28

-- Check what permissions Administrator role has
SELECT 
  r.name as role_name,
  p.name as permission_name,
  p.resource,
  p.action
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name IN ('Administrator', 'Manager')
  AND (p.name LIKE 'users:%' OR p.name = 'user_management:read')
ORDER BY r.name, p.name;

-- Count permissions for each role
SELECT 
  r.name as role_name,
  COUNT(*) as user_management_permission_count
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name IN ('Administrator', 'Manager')
  AND (p.name LIKE 'users:%' OR p.name = 'user_management:read')
GROUP BY r.name;


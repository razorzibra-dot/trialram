-- ============================================================================
-- Migration: Add Customer Detail Element-Level Permissions
-- Date: 2025-11-30
-- Problem: Customer detail panel shows "You don't have permission to access this section"
--          Action buttons (Edit) not visible
-- Solution: Create comprehensive customer detail element permissions and assign to roles
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: INSERT CUSTOMER DETAIL ELEMENT PERMISSIONS
-- ============================================================================

-- Customer detail action buttons
INSERT INTO permissions (name, description, resource, action, category, is_system_permission, element_path) VALUES
-- Detail action buttons
('crm:contacts:detail:button.edit', 'Edit button visible on customer detail', 'contacts', 'detail:button.edit', 'module', true, 'crm:contacts:detail:button.edit'),
('crm:contacts:detail:button.delete', 'Delete button visible on customer detail', 'contacts', 'detail:button.delete', 'module', true, 'crm:contacts:detail:button.delete'),
('crm:contacts:detail:button.close', 'Close button visible on customer detail', 'contacts', 'detail:button.close', 'module', true, 'crm:contacts:detail:button.close'),

-- Detail sections
('crm:contacts:detail:section.basic', 'Basic information section accessible on customer detail', 'contacts', 'detail:section.basic', 'module', true, 'crm:contacts:detail:section.basic'),
('crm:contacts:detail:section.business', 'Business information section accessible on customer detail', 'contacts', 'detail:section.business', 'module', true, 'crm:contacts:detail:section.business'),
('crm:contacts:detail:section.address', 'Address information section accessible on customer detail', 'contacts', 'detail:section.address', 'module', true, 'crm:contacts:detail:section.address'),
('crm:contacts:detail:section.financial', 'Financial information section accessible on customer detail', 'contacts', 'detail:section.financial', 'module', true, 'crm:contacts:detail:section.financial'),
('crm:contacts:detail:section.lead', 'Lead information section accessible on customer detail', 'contacts', 'detail:section.lead', 'module', true, 'crm:contacts:detail:section.lead'),
('crm:contacts:detail:section.notes', 'Notes section accessible on customer detail', 'contacts', 'detail:section.notes', 'module', true, 'crm:contacts:detail:section.notes'),
('crm:contacts:detail:section.timeline', 'Timeline section accessible on customer detail', 'contacts', 'detail:section.timeline', 'module', true, 'crm:contacts:detail:section.timeline'),
('crm:contacts:detail:section.metrics', 'Key metrics section accessible on customer detail', 'contacts', 'detail:section.metrics', 'module', true, 'crm:contacts:detail:section.metrics'),

-- Detail fields (for granular control)
('crm:contacts:detail:field.company_name', 'Company name field visible on customer detail', 'contacts', 'detail:field.company_name', 'module', true, 'crm:contacts:detail:field.company_name'),
('crm:contacts:detail:field.email', 'Email field visible on customer detail', 'contacts', 'detail:field.email', 'module', true, 'crm:contacts:detail:field.email'),
('crm:contacts:detail:field.phone', 'Phone field visible on customer detail', 'contacts', 'detail:field.phone', 'module', true, 'crm:contacts:detail:field.phone'),
('crm:contacts:detail:field.status', 'Status field visible on customer detail', 'contacts', 'detail:field.status', 'module', true, 'crm:contacts:detail:field.status')
ON CONFLICT (name) DO UPDATE SET
  element_path = EXCLUDED.element_path,
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- ============================================================================
-- STEP 2: ASSIGN CUSTOMER DETAIL PERMISSIONS TO ROLES
-- ============================================================================

-- Assign all customer detail permissions to roles that have customer record permissions
WITH customer_management_roles AS (
  SELECT DISTINCT r.id, r.name
  FROM roles r
  JOIN role_permissions rp ON rp.role_id = r.id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE p.name IN (
    'crm:customer:record:read',
    'crm:customer:record:update',
    'crm:customer:record:delete',
    'crm:contacts:list:view',
    'crm:contacts:detail:view'
  )
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT cmr.id, p.id
FROM customer_management_roles cmr
CROSS JOIN permissions p
WHERE p.name IN (
  'crm:contacts:detail:button.edit',
  'crm:contacts:detail:button.delete',
  'crm:contacts:detail:button.close',
  'crm:contacts:detail:section.basic',
  'crm:contacts:detail:section.business',
  'crm:contacts:detail:section.address',
  'crm:contacts:detail:section.financial',
  'crm:contacts:detail:section.lead',
  'crm:contacts:detail:section.notes',
  'crm:contacts:detail:section.timeline',
  'crm:contacts:detail:section.metrics',
  'crm:contacts:detail:field.company_name',
  'crm:contacts:detail:field.email',
  'crm:contacts:detail:field.phone',
  'crm:contacts:detail:field.status'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign detail permissions to admin roles explicitly
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.name LIKE 'crm:contacts:detail:%'
AND r.name IN ('tenant_admin', 'admin', 'super_admin', 'Administrator')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign basic detail permissions to manager roles (view sections, but not all actions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.name IN (
  'crm:contacts:detail:button.edit',
  'crm:contacts:detail:button.close',
  'crm:contacts:detail:section.basic',
  'crm:contacts:detail:section.business',
  'crm:contacts:detail:section.address',
  'crm:contacts:detail:section.financial',
  'crm:contacts:detail:section.lead',
  'crm:contacts:detail:section.notes',
  'crm:contacts:detail:section.timeline',
  'crm:contacts:detail:section.metrics',
  'crm:contacts:detail:field.company_name',
  'crm:contacts:detail:field.email',
  'crm:contacts:detail:field.phone',
  'crm:contacts:detail:field.status'
)
AND r.name IN ('manager', 'Manager', 'sales_manager', 'support_manager', 'project_manager')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 3: CREATE ELEMENT PERMISSIONS ENTRIES (for element_permissions table)
-- ============================================================================

-- Insert element permissions for customer detail elements
INSERT INTO element_permissions (element_path, permission_id, required_role_level, tenant_id)
SELECT 
  p.element_path,
  p.id,
  CASE 
    WHEN p.name LIKE '%button.edit%' OR p.name LIKE '%button.delete%' THEN 'write'
    WHEN p.name LIKE '%button.close%' THEN 'read'
    WHEN p.name LIKE '%section%' THEN 'read'
    WHEN p.name LIKE '%field%' THEN 'read'
    ELSE 'read'
  END,
  NULL -- Global element permissions (available to all tenants)
FROM permissions p
WHERE p.element_path LIKE 'crm:contacts:detail:%'
  AND p.element_path IS NOT NULL
ON CONFLICT (element_path, permission_id, tenant_id) DO NOTHING;

-- ============================================================================
-- STEP 4: VALIDATION
-- ============================================================================

DO $$
DECLARE
  detail_perms_count INTEGER;
  role_assignments_count INTEGER;
  element_perms_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO detail_perms_count
  FROM permissions
  WHERE name LIKE 'crm:contacts:detail:%';

  SELECT COUNT(*) INTO role_assignments_count
  FROM role_permissions rp
  JOIN permissions p ON p.id = rp.permission_id
  WHERE p.name LIKE 'crm:contacts:detail:%';

  SELECT COUNT(*) INTO element_perms_count
  FROM element_permissions
  WHERE element_path LIKE 'crm:contacts:detail:%';

  RAISE NOTICE '✅ Created % customer detail permissions', detail_perms_count;
  RAISE NOTICE '✅ Assigned customer detail permissions to roles (% assignments)', role_assignments_count;
  RAISE NOTICE '✅ Created % element permission entries', element_perms_count;
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Created 15 customer detail element permissions (buttons, sections, fields)
-- - Assigned permissions to roles with customer management access
-- - Created element_permissions entries for granular control
-- - All permissions follow crm:resource:action pattern
-- - Element paths properly formatted for element-level permission evaluation
-- ============================================================================


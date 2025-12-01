-- ============================================================================
-- Migration: Add Dashboard Element-Level Permissions
-- Date: 2025-11-30
-- Problem: Dashboard controls not loading after element-level permission implementation
--          Missing element permissions for dashboard widgets, buttons, and sections
-- Solution: Create comprehensive dashboard element permissions and assign to roles
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: INSERT DASHBOARD ELEMENT PERMISSIONS
-- ============================================================================

-- Dashboard panel/view permissions
-- ✅ Element paths match what DashboardPage checks (without action suffix)
INSERT INTO permissions (name, description, resource, action, category, is_system_permission, element_path) VALUES
-- Main dashboard access
('crm:dashboard:panel:view', 'Access dashboard and analytics', 'dashboard', 'view', 'module', true, 'crm:dashboard:panel:view'),
('crm:dashboard:stats:view', 'View dashboard statistics', 'dashboard', 'stats:view', 'module', true, 'crm:dashboard:stats:view'),

-- Dashboard widgets
('crm:dashboard:widget.recentactivity:view', 'View recent activity widget', 'dashboard', 'widget.recentactivity:view', 'module', true, 'crm:dashboard:widget.recentactivity:view'),
('crm:dashboard:widget.topcustomers:view', 'View top customers widget', 'dashboard', 'widget.topcustomers:view', 'module', true, 'crm:dashboard:widget.topcustomers:view'),
('crm:dashboard:widget.ticketstats:view', 'View ticket statistics widget', 'dashboard', 'widget.ticketstats:view', 'module', true, 'crm:dashboard:widget.ticketstats:view'),
('crm:dashboard:widget.salespipeline:view', 'View sales pipeline widget', 'dashboard', 'widget.salespipeline:view', 'module', true, 'crm:dashboard:widget.salespipeline:view'),

-- Dashboard sections
('crm:dashboard:section.quickactions:view', 'View quick actions section', 'dashboard', 'section.quickactions:view', 'module', true, 'crm:dashboard:section.quickactions:view'),

-- Dashboard buttons
('crm:dashboard:button.downloadreport', 'Download dashboard report', 'dashboard', 'button.downloadreport', 'module', true, 'crm:dashboard:button.downloadreport'),
('crm:dashboard:button.newcustomer', 'Create new customer from dashboard', 'dashboard', 'button.newcustomer', 'module', true, 'crm:dashboard:button.newcustomer'),
('crm:dashboard:button.createdeal', 'Create new deal from dashboard', 'dashboard', 'button.createdeal', 'module', true, 'crm:dashboard:button.createdeal'),
('crm:dashboard:button.newticket', 'Create new ticket from dashboard', 'dashboard', 'button.newticket', 'module', true, 'crm:dashboard:button.newticket')
ON CONFLICT (name) DO UPDATE SET
  element_path = EXCLUDED.element_path,
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- ============================================================================
-- STEP 2: ASSIGN DASHBOARD PERMISSIONS TO ROLES
-- ============================================================================

-- Assign all dashboard permissions to tenant_admin and super_admin roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.name IN (
  'crm:dashboard:panel:view',
  'crm:dashboard:stats:view',
  'crm:dashboard:widget.recentactivity:view',
  'crm:dashboard:widget.topcustomers:view',
  'crm:dashboard:widget.ticketstats:view',
  'crm:dashboard:widget.salespipeline:view',
  'crm:dashboard:section.quickactions:view',
  'crm:dashboard:button.downloadreport',
  'crm:dashboard:button.newcustomer',
  'crm:dashboard:button.createdeal',
  'crm:dashboard:button.newticket'
)
AND r.name IN ('tenant_admin', 'admin', 'super_admin', 'Administrator')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign dashboard view permissions to manager roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.name IN (
  'crm:dashboard:panel:view',
  'crm:dashboard:stats:view',
  'crm:dashboard:widget.recentactivity:view',
  'crm:dashboard:widget.topcustomers:view',
  'crm:dashboard:widget.ticketstats:view',
  'crm:dashboard:widget.salespipeline:view',
  'crm:dashboard:section.quickactions:view'
)
AND r.name IN ('manager', 'Manager', 'sales_manager', 'support_manager', 'project_manager')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign basic dashboard view to all other roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.name = 'crm:dashboard:panel:view'
AND r.name NOT IN ('tenant_admin', 'admin', 'super_admin', 'Administrator', 'manager', 'Manager', 'sales_manager', 'support_manager', 'project_manager')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 3: CREATE ELEMENT PERMISSIONS ENTRIES (for element_permissions table)
-- ============================================================================

-- Insert element permissions for dashboard elements
INSERT INTO element_permissions (element_path, permission_id, required_role_level, tenant_id)
SELECT 
  p.element_path,
  p.id,
  CASE 
    WHEN p.name LIKE '%button%' THEN 'write'
    WHEN p.name LIKE '%widget%' OR p.name LIKE '%section%' THEN 'read'
    ELSE 'read'
  END,
  NULL -- Global element permissions (available to all tenants)
FROM permissions p
WHERE p.element_path LIKE 'crm:dashboard:%'
  AND p.element_path IS NOT NULL
ON CONFLICT (element_path, permission_id, tenant_id) DO NOTHING;

-- ============================================================================
-- STEP 4: VALIDATION
-- ============================================================================

DO $$
DECLARE
  dashboard_perms_count INTEGER;
  role_assignments_count INTEGER;
  element_perms_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dashboard_perms_count
  FROM permissions
  WHERE name LIKE 'crm:dashboard:%';

  SELECT COUNT(*) INTO role_assignments_count
  FROM role_permissions rp
  JOIN permissions p ON p.id = rp.permission_id
  WHERE p.name LIKE 'crm:dashboard:%';

  SELECT COUNT(*) INTO element_perms_count
  FROM element_permissions
  WHERE element_path LIKE 'crm:dashboard:%';

  RAISE NOTICE '✅ Created % dashboard permissions', dashboard_perms_count;
  RAISE NOTICE '✅ Assigned dashboard permissions to roles (% assignments)', role_assignments_count;
  RAISE NOTICE '✅ Created % element permission entries', element_perms_count;
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Created 11 dashboard element permissions (panel, stats, widgets, sections, buttons)
-- - Assigned permissions to appropriate roles (admin, manager, user)
-- - Created element_permissions entries for granular control
-- - All permissions follow crm:resource:action pattern
-- - Element paths properly formatted for element-level permission evaluation
-- ============================================================================


-- ============================================================================
-- Migration: Add Customer Form Element-Level Permissions
-- Date: 2025-11-30
-- Problem: Customer form action buttons (Save/Create/Update) not visible
--          Missing element permissions for customer form sections and buttons
-- Solution: Create comprehensive customer form element permissions and assign to roles
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: INSERT CUSTOMER FORM ELEMENT PERMISSIONS
-- ============================================================================

-- Customer form action buttons
INSERT INTO permissions (name, description, resource, action, category, is_system_permission, element_path) VALUES
-- Form action buttons
('crm:contacts:form:button.save', 'Save button enabled on customer form', 'contacts', 'form:button.save', 'module', true, 'crm:contacts:form:button.save'),
('crm:contacts:form:button.create', 'Create button enabled on customer form', 'contacts', 'form:button.create', 'module', true, 'crm:contacts:form:button.create'),
('crm:contacts:form:button.update', 'Update button enabled on customer form', 'contacts', 'form:button.update', 'module', true, 'crm:contacts:form:button.update'),
('crm:contacts:form:button.cancel', 'Cancel button visible on customer form', 'contacts', 'form:button.cancel', 'module', true, 'crm:contacts:form:button.cancel'),

-- Form sections
('crm:contacts:form:section.basic', 'Basic information section accessible', 'contacts', 'form:section.basic', 'module', true, 'crm:contacts:form:section.basic'),
('crm:contacts:form:section.business', 'Business information section accessible', 'contacts', 'form:section.business', 'module', true, 'crm:contacts:form:section.business'),
('crm:contacts:form:section.address', 'Address information section accessible', 'contacts', 'form:section.address', 'module', true, 'crm:contacts:form:section.address'),
('crm:contacts:form:section.financial', 'Financial information section accessible', 'contacts', 'form:section.financial', 'module', true, 'crm:contacts:form:section.financial'),
('crm:contacts:form:section.lead', 'Lead information section accessible', 'contacts', 'form:section.lead', 'module', true, 'crm:contacts:form:section.lead'),
('crm:contacts:form:section.notes', 'Notes section accessible', 'contacts', 'form:section.notes', 'module', true, 'crm:contacts:form:section.notes'),

-- Form fields (for granular control)
('crm:contacts:form:field.company_name', 'Company name field editable', 'contacts', 'form:field.company_name', 'module', true, 'crm:contacts:form:field.company_name'),
('crm:contacts:form:field.contact_name', 'Contact name field editable', 'contacts', 'form:field.contact_name', 'module', true, 'crm:contacts:form:field.contact_name'),
('crm:contacts:form:field.email', 'Email field editable', 'contacts', 'form:field.email', 'module', true, 'crm:contacts:form:field.email'),
('crm:contacts:form:field.phone', 'Phone field editable', 'contacts', 'form:field.phone', 'module', true, 'crm:contacts:form:field.phone'),
('crm:contacts:form:field.status', 'Status field editable', 'contacts', 'form:field.status', 'module', true, 'crm:contacts:form:field.status'),
('crm:contacts:form:field.assigned_to', 'Assigned to field editable', 'contacts', 'form:field.assigned_to', 'module', true, 'crm:contacts:form:field.assigned_to')
ON CONFLICT (name) DO UPDATE SET
  element_path = EXCLUDED.element_path,
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- ============================================================================
-- STEP 2: ASSIGN CUSTOMER FORM PERMISSIONS TO ROLES
-- ============================================================================

-- Assign all customer form permissions to roles that have customer record permissions
WITH customer_management_roles AS (
  SELECT DISTINCT r.id, r.name
  FROM roles r
  JOIN role_permissions rp ON rp.role_id = r.id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE p.name IN (
    'crm:customer:record:create',
    'crm:customer:record:update',
    'crm:customer:record:read',
    'crm:contacts:list:view',
    'crm:contacts:list:button.create:visible'
  )
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT cmr.id, p.id
FROM customer_management_roles cmr
CROSS JOIN permissions p
WHERE p.name IN (
  'crm:contacts:form:button.save',
  'crm:contacts:form:button.create',
  'crm:contacts:form:button.update',
  'crm:contacts:form:button.cancel',
  'crm:contacts:form:section.basic',
  'crm:contacts:form:section.business',
  'crm:contacts:form:section.address',
  'crm:contacts:form:section.financial',
  'crm:contacts:form:section.lead',
  'crm:contacts:form:section.notes',
  'crm:contacts:form:field.company_name',
  'crm:contacts:form:field.contact_name',
  'crm:contacts:form:field.email',
  'crm:contacts:form:field.phone',
  'crm:contacts:form:field.status',
  'crm:contacts:form:field.assigned_to'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign form permissions to admin roles explicitly
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.name LIKE 'crm:contacts:form:%'
AND r.name IN ('tenant_admin', 'admin', 'super_admin', 'Administrator')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign basic form permissions to manager roles (view and edit, but not all fields)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.name IN (
  'crm:contacts:form:button.save',
  'crm:contacts:form:button.update',
  'crm:contacts:form:button.cancel',
  'crm:contacts:form:section.basic',
  'crm:contacts:form:section.business',
  'crm:contacts:form:section.address',
  'crm:contacts:form:section.lead',
  'crm:contacts:form:section.notes',
  'crm:contacts:form:field.company_name',
  'crm:contacts:form:field.contact_name',
  'crm:contacts:form:field.email',
  'crm:contacts:form:field.phone',
  'crm:contacts:form:field.status'
)
AND r.name IN ('manager', 'Manager', 'sales_manager', 'support_manager', 'project_manager')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 3: CREATE ELEMENT PERMISSIONS ENTRIES (for element_permissions table)
-- ============================================================================

-- Insert element permissions for customer form elements
INSERT INTO element_permissions (element_path, permission_id, required_role_level, tenant_id)
SELECT 
  p.element_path,
  p.id,
  CASE 
    WHEN p.name LIKE '%button.save%' OR p.name LIKE '%button.create%' OR p.name LIKE '%button.update%' THEN 'write'
    WHEN p.name LIKE '%button.cancel%' THEN 'read'
    WHEN p.name LIKE '%section%' THEN 'read'
    WHEN p.name LIKE '%field%' THEN 'write'
    ELSE 'read'
  END,
  NULL -- Global element permissions (available to all tenants)
FROM permissions p
WHERE p.element_path LIKE 'crm:contacts:form:%'
  AND p.element_path IS NOT NULL
ON CONFLICT (element_path, permission_id, tenant_id) DO NOTHING;

-- ============================================================================
-- STEP 4: VALIDATION
-- ============================================================================

DO $$
DECLARE
  form_perms_count INTEGER;
  role_assignments_count INTEGER;
  element_perms_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO form_perms_count
  FROM permissions
  WHERE name LIKE 'crm:contacts:form:%';

  SELECT COUNT(*) INTO role_assignments_count
  FROM role_permissions rp
  JOIN permissions p ON p.id = rp.permission_id
  WHERE p.name LIKE 'crm:contacts:form:%';

  SELECT COUNT(*) INTO element_perms_count
  FROM element_permissions
  WHERE element_path LIKE 'crm:contacts:form:%';

  RAISE NOTICE '✅ Created % customer form permissions', form_perms_count;
  RAISE NOTICE '✅ Assigned customer form permissions to roles (% assignments)', role_assignments_count;
  RAISE NOTICE '✅ Created % element permission entries', element_perms_count;
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Created 16 customer form element permissions (buttons, sections, fields)
-- - Assigned permissions to roles with customer management access
-- - Created element_permissions entries for granular control
-- - All permissions follow crm:resource:action pattern
-- - Element paths properly formatted for element-level permission evaluation
-- ============================================================================


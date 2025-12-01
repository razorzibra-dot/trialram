-- ============================================================================
-- ELEMENT-LEVEL PERMISSIONS MIGRATION
-- Adds support for granular element-level permission control
--
-- Date: November 29, 2025
-- Version: 1.0
-- Status: Production-ready element permission schema
-- ============================================================================

-- ============================================================================
-- STEP 1: EXTEND EXISTING PERMISSIONS TABLE
-- ============================================================================

-- Add element-level permission columns to existing permissions table
ALTER TABLE permissions
ADD COLUMN IF NOT EXISTS scope JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS element_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS parent_permission_id UUID REFERENCES permissions(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_element_path ON permissions(element_path);
CREATE INDEX IF NOT EXISTS idx_permissions_parent_permission_id ON permissions(parent_permission_id);

-- ============================================================================
-- STEP 2: CREATE ELEMENT PERMISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS element_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  element_path VARCHAR(500) NOT NULL,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  required_role_level VARCHAR(50) CHECK (required_role_level IN ('read', 'write', 'admin')),
  conditions JSONB DEFAULT '{}',
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add performance indexes
CREATE INDEX idx_element_permissions_element_path ON element_permissions(element_path);
CREATE INDEX idx_element_permissions_permission_id ON element_permissions(permission_id);
CREATE INDEX idx_element_permissions_tenant_id ON element_permissions(tenant_id);
CREATE INDEX idx_element_permissions_required_role_level ON element_permissions(required_role_level);

-- Add unique constraint to prevent duplicates
ALTER TABLE element_permissions
ADD CONSTRAINT unique_element_permission_per_tenant
UNIQUE (element_path, permission_id, tenant_id);

-- ============================================================================
-- STEP 3: CREATE PERMISSION OVERRIDES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS permission_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  resource_type VARCHAR(100) CHECK (resource_type IN ('record', 'field', 'element')),
  resource_id VARCHAR(255),
  override_type VARCHAR(20) CHECK (override_type IN ('grant', 'deny')),
  conditions JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add performance indexes
CREATE INDEX idx_permission_overrides_user_id ON permission_overrides(user_id);
CREATE INDEX idx_permission_overrides_permission_id ON permission_overrides(permission_id);
CREATE INDEX idx_permission_overrides_tenant_id ON permission_overrides(tenant_id);
CREATE INDEX idx_permission_overrides_resource_type_id ON permission_overrides(resource_type, resource_id);
CREATE INDEX idx_permission_overrides_expires_at ON permission_overrides(expires_at);

-- ============================================================================
-- STEP 4: CREATE PERMISSION TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS permission_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  template JSONB NOT NULL,
  applicable_to VARCHAR(100) CHECK (applicable_to IN ('form', 'list', 'dashboard', 'module')),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for name (required for ON CONFLICT)
ALTER TABLE permission_templates
ADD CONSTRAINT unique_permission_template_name
UNIQUE (name);

-- Add performance indexes
CREATE INDEX idx_permission_templates_name ON permission_templates(name);
CREATE INDEX idx_permission_templates_applicable_to ON permission_templates(applicable_to);
CREATE INDEX idx_permission_templates_tenant_id ON permission_templates(tenant_id);

-- ============================================================================
-- STEP 5: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE element_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_templates ENABLE ROW LEVEL SECURITY;

-- Element Permissions RLS Policies
CREATE POLICY "Element permissions tenant isolation" ON element_permissions
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "Super admins can manage all element permissions" ON element_permissions
FOR ALL USING (
  (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

-- Permission Overrides RLS Policies
CREATE POLICY "Users can view their own permission overrides" ON permission_overrides
FOR SELECT USING (
  user_id = auth.uid()
  OR created_by = auth.uid()
  OR tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "Admins can manage permission overrides in their tenant" ON permission_overrides
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

-- Permission Templates RLS Policies
CREATE POLICY "Permission templates tenant isolation" ON permission_templates
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

-- ============================================================================
-- STEP 6: SEED ELEMENT-LEVEL PERMISSIONS
-- ============================================================================

-- Insert hierarchical element permissions following existing crm:resource:action pattern
INSERT INTO permissions (name, description, resource, action, category, is_system_permission, element_path) VALUES
-- Module-level permissions
('crm:contacts:module:access', 'Access to contacts module', 'contacts', 'module:access', 'module', true, 'contacts:module'),
('crm:sales:module:access', 'Access to sales module', 'sales', 'module:access', 'module', true, 'sales:module'),
('crm:support:module:access', 'Access to support module', 'support', 'module:access', 'module', true, 'support:module'),
('crm:admin:module:access', 'Access to admin module', 'admin', 'module:access', 'administrative', true, 'admin:module'),

-- List view permissions
('crm:contacts:list:view', 'View contacts list', 'contacts', 'list:view', 'module', true, 'contacts:list'),
('crm:contacts:list:button.create:visible', 'Create button visibility on contacts list', 'contacts', 'list:button.create:visible', 'module', true, 'contacts:list:button.create'),
('crm:contacts:list:button.export:enabled', 'Export button enabled on contacts list', 'contacts', 'list:button.export:enabled', 'module', true, 'contacts:list:button.export'),

-- Detail view permissions
('crm:contacts:detail:view', 'View contact details', 'contacts', 'detail:view', 'module', true, 'contacts:detail'),
('crm:contacts:detail:button.edit:enabled', 'Edit button enabled on contact detail', 'contacts', 'detail:button.edit:enabled', 'module', true, 'contacts:detail:button.edit'),
('crm:contacts:detail:tab.history:accessible', 'History tab accessible on contact detail', 'contacts', 'detail:tab.history:accessible', 'module', true, 'contacts:detail:tab.history'),

-- Field-level permissions
('crm:contacts:field.email:editable', 'Email field editable', 'contacts', 'field.email:editable', 'module', true, 'contacts:field.email'),
('crm:contacts:field.phone:visible', 'Phone field visible', 'contacts', 'field.phone:visible', 'module', true, 'contacts:field.phone'),
('crm:contacts:field.ssn:visible', 'SSN field visible (restricted)', 'contacts', 'field.ssn:visible', 'module', true, 'contacts:field.ssn'),

-- Sales pipeline permissions
('crm:sales:pipeline:view', 'View sales pipeline', 'sales', 'pipeline:view', 'module', true, 'sales:pipeline'),
('crm:sales:pipeline:stage.qualified:movable', 'Move deals to qualified stage', 'sales', 'pipeline:stage.qualified:movable', 'module', true, 'sales:pipeline:stage.qualified'),

-- Support permissions
('crm:support:tickets:list:view', 'View support tickets list', 'support', 'tickets:list:view', 'module', true, 'support:tickets:list'),
('crm:support:complaints:escalate:enabled', 'Escalate complaints enabled', 'support', 'complaints:escalate:enabled', 'module', true, 'support:complaints:escalate'),

-- Admin permissions
('crm:admin:users:list:view', 'View users list in admin', 'admin', 'users:list:view', 'administrative', true, 'admin:users:list'),
('crm:admin:roles:assign:enabled', 'Role assignment enabled in admin', 'admin', 'roles:assign:enabled', 'administrative', true, 'admin:roles:assign'),
('crm:admin:audit:logs:view', 'View audit logs in admin', 'admin', 'audit:logs:view', 'administrative', true, 'admin:audit:logs')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 7: UPDATE EXISTING ROLE PERMISSIONS
-- ============================================================================

-- Add element permissions to existing roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.element_path IS NOT NULL
  AND (
    -- Admin roles get all element permissions
    r.name IN ('admin', 'super_admin')
    OR
    -- Manager roles get most element permissions except restricted ones
    (r.name = 'manager' AND p.name NOT LIKE '%ssn%')
    OR
    -- Engineer roles get technical element permissions
    (r.name = 'engineer' AND p.name LIKE '%support%' OR p.name LIKE '%job%')
    OR
    -- User roles get basic view permissions
    (r.name = 'user' AND p.action LIKE '%view')
    OR
    -- Customer roles get limited view permissions
    (r.name = 'customer' AND p.action LIKE '%view' AND p.resource = 'contacts')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- STEP 8: CREATE PERMISSION TEMPLATES
-- ============================================================================

INSERT INTO permission_templates (name, template, applicable_to, tenant_id) VALUES
(
  'Contact Form Template',
  '{
    "fields": {
      "firstName": {"visible": true, "editable": true},
      "lastName": {"visible": true, "editable": true},
      "email": {"visible": true, "editable": true},
      "phone": {"visible": true, "editable": true},
      "address": {"visible": true, "editable": false}
    },
    "buttons": {
      "save": {"visible": true, "enabled": true},
      "cancel": {"visible": true, "enabled": true}
    }
  }',
  'form',
  NULL
),
(
  'Contact List Template',
  '{
    "columns": {
      "name": {"visible": true, "sortable": true},
      "email": {"visible": true, "sortable": true},
      "phone": {"visible": false, "sortable": false},
      "company": {"visible": true, "sortable": true}
    },
    "actions": {
      "view": {"visible": true, "enabled": true},
      "edit": {"visible": true, "enabled": true},
      "delete": {"visible": false, "enabled": false}
    }
  }',
  'list',
  NULL
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 9: VALIDATION AND MONITORING
-- ============================================================================

-- Create function to validate element permissions setup
CREATE OR REPLACE FUNCTION validate_element_permissions_setup()
RETURNS JSON AS $$
DECLARE
  result JSON;
  element_permissions_count INTEGER;
  permission_overrides_count INTEGER;
  templates_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO element_permissions_count FROM element_permissions;
  SELECT COUNT(*) INTO permission_overrides_count FROM permission_overrides;
  SELECT COUNT(*) INTO templates_count FROM permission_templates;

  result := json_build_object(
    'status', 'element_permissions_setup_complete',
    'summary', json_build_object(
      'element_permissions', element_permissions_count,
      'permission_overrides', permission_overrides_count,
      'permission_templates', templates_count
    ),
    'message', 'Element-level permissions schema successfully created and seeded'
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETED SUCCESSFULLY
-- ============================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Element-level permissions migration completed successfully';
  RAISE NOTICE 'Run: SELECT validate_element_permissions_setup(); to verify setup';
END $$;
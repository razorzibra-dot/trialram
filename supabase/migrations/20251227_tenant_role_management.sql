-- =====================================================
-- Enterprise Multi-Tenant Role Management System
-- =====================================================
-- Purpose: Enable tenant-specific role configurations
-- Benefits:
--   ✅ Tenant-specific role names (e.g., "Sales Rep" vs "Agent")
--   ✅ Flexible role hierarchies per tenant
--   ✅ Permission-based access control
--   ✅ No hardcoded role checks in application
-- =====================================================

-- =====================================================
-- 1. Tenant Roles Table
-- =====================================================
-- Stores tenant-specific role definitions
CREATE TABLE IF NOT EXISTS tenant_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  role_key TEXT NOT NULL, -- Normalized key (e.g., 'agent', 'manager')
  display_name TEXT NOT NULL, -- Tenant-specific display name
  description TEXT,
  role_level INTEGER NOT NULL DEFAULT 0, -- Hierarchy level (0=lowest, 100=highest)
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system_role BOOLEAN NOT NULL DEFAULT false, -- Cannot be deleted
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Ensure role uniqueness per tenant
  UNIQUE(tenant_id, role_key),
  UNIQUE(tenant_id, role_name)
);

-- Indexes for performance
CREATE INDEX idx_tenant_roles_tenant ON tenant_roles(tenant_id);
CREATE INDEX idx_tenant_roles_key ON tenant_roles(role_key);
CREATE INDEX idx_tenant_roles_active ON tenant_roles(is_active) WHERE is_active = true;

-- =====================================================
-- 2. Role Permissions Table
-- =====================================================
-- Maps roles to permission tokens (granular access control)
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES tenant_roles(id) ON DELETE CASCADE,
  permission_token TEXT NOT NULL, -- e.g., 'crm:lead:create', 'crm:lead:assign'
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_read BOOLEAN NOT NULL DEFAULT false,
  can_update BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  constraints JSONB, -- Additional constraints (e.g., {"scope": "own", "conditions": {...}})
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique permission per role
  UNIQUE(role_id, permission_token)
);

-- Indexes for performance
CREATE INDEX idx_role_permissions_tenant ON role_permissions(tenant_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_token ON role_permissions(permission_token);

-- =====================================================
-- 3. Role Assignment Configuration
-- =====================================================
-- Defines which roles can be assigned to leads/deals/tickets
CREATE TABLE IF NOT EXISTS role_assignment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL, -- 'leads', 'deals', 'tickets', etc.
  role_id UUID NOT NULL REFERENCES tenant_roles(id) ON DELETE CASCADE,
  can_be_assigned BOOLEAN NOT NULL DEFAULT true,
  assignment_priority INTEGER NOT NULL DEFAULT 50, -- For auto-assignment (lower = higher priority)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(tenant_id, module_name, role_id)
);

-- Indexes for performance
CREATE INDEX idx_role_assignment_tenant_module ON role_assignment_config(tenant_id, module_name);
CREATE INDEX idx_role_assignment_role ON role_assignment_config(role_id);

-- =====================================================
-- 4. RLS Policies
-- =====================================================

-- Tenant Roles RLS
ALTER TABLE tenant_roles ENABLE ROW LEVEL SECURITY;

-- Users can view roles in their tenant
CREATE POLICY tenant_roles_select_policy ON tenant_roles
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Only admins can manage roles
CREATE POLICY tenant_roles_insert_policy ON tenant_roles
  FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
    AND (
      (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
    )
  );

CREATE POLICY tenant_roles_update_policy ON tenant_roles
  FOR UPDATE
  USING (
    tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
    AND (
      (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
    )
    AND (is_system_role = false OR (SELECT role FROM auth.users WHERE id = auth.uid()) = 'super_admin')
  );

CREATE POLICY tenant_roles_delete_policy ON tenant_roles
  FOR DELETE
  USING (
    tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
    AND (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
    AND is_system_role = false
  );

-- Role Permissions RLS
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY role_permissions_select_policy ON role_permissions
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY role_permissions_manage_policy ON role_permissions
  FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
    AND (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Role Assignment Config RLS
ALTER TABLE role_assignment_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY role_assignment_config_select_policy ON role_assignment_config
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY role_assignment_config_manage_policy ON role_assignment_config
  FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
    AND (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- =====================================================
-- 5. Helper Functions
-- =====================================================

-- Get assignable roles for a module in a tenant
CREATE OR REPLACE FUNCTION get_assignable_roles(
  p_tenant_id UUID,
  p_module_name TEXT
)
RETURNS TABLE (
  role_id UUID,
  role_key TEXT,
  role_name TEXT,
  display_name TEXT,
  role_level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tr.id,
    tr.role_key,
    tr.role_name,
    tr.display_name,
    tr.role_level
  FROM tenant_roles tr
  INNER JOIN role_assignment_config rac 
    ON rac.role_id = tr.id 
    AND rac.tenant_id = tr.tenant_id
  WHERE 
    tr.tenant_id = p_tenant_id
    AND tr.is_active = true
    AND rac.module_name = p_module_name
    AND rac.can_be_assigned = true
  ORDER BY 
    rac.assignment_priority ASC,
    tr.role_level DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if a role has a specific permission
CREATE OR REPLACE FUNCTION role_has_permission(
  p_role_id UUID,
  p_permission_token TEXT,
  p_action TEXT -- 'create', 'read', 'update', 'delete'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_result BOOLEAN;
BEGIN
  SELECT 
    CASE p_action
      WHEN 'create' THEN can_create
      WHEN 'read' THEN can_read
      WHEN 'update' THEN can_update
      WHEN 'delete' THEN can_delete
      ELSE false
    END INTO v_result
  FROM role_permissions
  WHERE role_id = p_role_id
    AND permission_token = p_permission_token;
  
  RETURN COALESCE(v_result, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. Seed Default Roles for Existing Tenants
-- =====================================================
-- Create default role structure for each tenant

INSERT INTO tenant_roles (tenant_id, role_name, role_key, display_name, description, role_level, is_system_role, is_active)
SELECT 
  t.id,
  'Agent',
  'agent',
  'Agent',
  'Front-line user with limited permissions',
  10,
  true,
  true
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_roles tr 
  WHERE tr.tenant_id = t.id AND tr.role_key = 'agent'
);

INSERT INTO tenant_roles (tenant_id, role_name, role_key, display_name, description, role_level, is_system_role, is_active)
SELECT 
  t.id,
  'Manager',
  'manager',
  'Manager',
  'Team manager with elevated permissions',
  50,
  true,
  true
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_roles tr 
  WHERE tr.tenant_id = t.id AND tr.role_key = 'manager'
);

INSERT INTO tenant_roles (tenant_id, role_name, role_key, display_name, description, role_level, is_system_role, is_active)
SELECT 
  t.id,
  'Admin',
  'admin',
  'Administrator',
  'Full administrative access within tenant',
  100,
  true,
  true
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_roles tr 
  WHERE tr.tenant_id = t.id AND tr.role_key = 'admin'
);

-- =====================================================
-- 7. Seed Role Assignment Config (All modules)
-- =====================================================
-- Allow agent, manager, admin to be assigned to leads, deals, tickets

INSERT INTO role_assignment_config (tenant_id, module_name, role_id, can_be_assigned, assignment_priority)
SELECT 
  tr.tenant_id,
  module.name,
  tr.id,
  true,
  CASE tr.role_key
    WHEN 'agent' THEN 10
    WHEN 'manager' THEN 20
    WHEN 'admin' THEN 30
    ELSE 50
  END
FROM tenant_roles tr
CROSS JOIN (
  VALUES ('leads'), ('deals'), ('tickets'), ('complaints'), ('service_contracts')
) AS module(name)
WHERE tr.role_key IN ('agent', 'manager', 'admin')
  AND NOT EXISTS (
    SELECT 1 FROM role_assignment_config rac
    WHERE rac.tenant_id = tr.tenant_id
      AND rac.module_name = module.name
      AND rac.role_id = tr.id
  );

-- =====================================================
-- 8. Update Triggers
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tenant_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenant_roles_updated_at_trigger
  BEFORE UPDATE ON tenant_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_roles_updated_at();

CREATE TRIGGER role_permissions_updated_at_trigger
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_roles_updated_at();

CREATE TRIGGER role_assignment_config_updated_at_trigger
  BEFORE UPDATE ON role_assignment_config
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_roles_updated_at();

-- =====================================================
-- 9. Comments
-- =====================================================

COMMENT ON TABLE tenant_roles IS 'Tenant-specific role definitions with custom names and hierarchies';
COMMENT ON TABLE role_permissions IS 'Granular permission mappings for each role';
COMMENT ON TABLE role_assignment_config IS 'Defines which roles can be assigned to entities in each module';
COMMENT ON FUNCTION get_assignable_roles IS 'Returns roles that can be assigned to entities in a specific module';
COMMENT ON FUNCTION role_has_permission IS 'Check if a role has a specific permission action';

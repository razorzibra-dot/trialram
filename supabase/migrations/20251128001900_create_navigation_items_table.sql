-- ============================================================================
-- Migration: Create navigation_items table for database-driven navigation
-- Date: 2025-11-28
-- Purpose: Store navigation structure in database instead of hardcoded config
-- ============================================================================

-- Navigation Items Table
-- Stores the complete navigation structure with hierarchical support
CREATE TABLE IF NOT EXISTS navigation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES navigation_items(id) ON DELETE CASCADE,
    permission_name VARCHAR(100),
    is_section BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    icon VARCHAR(100),
    route_path VARCHAR(500),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    is_system_item BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_navigation_items_parent_id ON navigation_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_navigation_items_tenant_id ON navigation_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_navigation_items_key ON navigation_items(key);
CREATE INDEX IF NOT EXISTS idx_navigation_items_sort_order ON navigation_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_navigation_items_active ON navigation_items(is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for navigation_items
-- SELECT: Users can see navigation items for their tenant or system items
CREATE POLICY "users_view_navigation_items" ON navigation_items
  FOR SELECT
  USING (
    -- Super admins can see all
    is_current_user_super_admin_safe()
    OR
    -- Users can see items for their tenant
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND tenant_id IS NOT NULL
    )
    OR
    -- Users can see system items (available to all tenants)
    (
      is_system_item = TRUE
      AND tenant_id IS NULL
    )
    OR
    -- Active items only
    is_active = TRUE
  );

-- INSERT: Only super admins or users with navigation:manage permission can create items
CREATE POLICY "admins_insert_navigation_items" ON navigation_items
  FOR INSERT
  WITH CHECK (
    -- Super admins can create any navigation item
    is_current_user_super_admin_safe()
    OR
    -- Users with navigation:manage permission can create items for their tenant
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND tenant_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid()
          AND (p.name = 'navigation:manage' OR p.name = 'crm:system:config:manage')
      )
    )
  );

-- UPDATE: Only super admins or users with navigation:manage permission can update items
CREATE POLICY "admins_update_navigation_items" ON navigation_items
  FOR UPDATE
  USING (
    -- Super admins can update any navigation item
    is_current_user_super_admin_safe()
    OR
    -- Users with navigation:manage permission can update items for their tenant
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND tenant_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid()
          AND (p.name = 'navigation:manage' OR p.name = 'crm:system:config:manage')
      )
    )
  )
  WITH CHECK (
    -- Same checks for the updated row
    is_current_user_super_admin_safe()
    OR
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND tenant_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid()
          AND (p.name = 'navigation:manage' OR p.name = 'crm:system:config:manage')
      )
    )
  );

-- DELETE: Only super admins or users with navigation:manage permission can delete items
CREATE POLICY "admins_delete_navigation_items" ON navigation_items
  FOR DELETE
  USING (
    -- Super admins can delete any navigation item
    is_current_user_super_admin_safe()
    OR
    -- Users with navigation:manage permission can delete items for their tenant
    (
      tenant_id = get_current_user_tenant_id_safe()
      AND tenant_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid()
          AND (p.name = 'navigation:manage' OR p.name = 'crm:system:config:manage')
      )
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_navigation_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER navigation_items_updated_at
  BEFORE UPDATE ON navigation_items
  FOR EACH ROW
  EXECUTE FUNCTION update_navigation_items_updated_at();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Created navigation_items table with hierarchical support (parent_id)
-- - Added indexes for performance
-- - Enabled RLS with tenant-aware policies
-- - Created policies for SELECT, INSERT, UPDATE, DELETE
-- - Policies use SECURITY DEFINER functions (no recursion)
-- - System items (is_system_item=TRUE, tenant_id=NULL) are visible to all tenants
-- - Tenant-specific items are only visible to users in that tenant
-- ============================================================================


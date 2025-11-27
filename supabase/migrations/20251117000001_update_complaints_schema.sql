-- ============================================================================
-- PHASE 5: COMPLAINTS SCHEMA NORMALIZATION
-- Migration: Update complaints schema to match TypeScript types
-- ============================================================================

-- ============================================================================
-- 1. UPDATE COMPLAINTS TABLE TO MATCH TYPESCRIPT INTERFACE
-- ============================================================================

-- Rename and update existing columns to match TypeScript interface
ALTER TABLE complaints
DROP COLUMN IF EXISTS complaint_number,
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS assigned_to,
DROP COLUMN IF EXISTS resolution,
DROP COLUMN IF EXISTS resolved_at,
DROP COLUMN IF EXISTS created_by;

-- Add new columns to match TypeScript Complaint interface
ALTER TABLE complaints
ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'breakdown' CHECK (type IN ('breakdown', 'preventive', 'software_update', 'optimize')),
ADD COLUMN IF NOT EXISTS assigned_engineer_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS engineer_resolution TEXT,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;

-- Update existing status values to match TypeScript enum
UPDATE complaints SET status = 'new' WHERE status = 'open';
UPDATE complaints SET status = 'in_progress' WHERE status = 'in_progress';
UPDATE complaints SET status = 'closed' WHERE status = 'resolved' OR status = 'closed';

-- Add check constraint for status
ALTER TABLE complaints
DROP CONSTRAINT IF EXISTS complaints_status_check,
ADD CONSTRAINT complaints_status_check CHECK (status IN ('new', 'in_progress', 'closed'));

-- ============================================================================
-- 2. CREATE COMPLAINT_COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS complaint_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  content TEXT NOT NULL,

  -- Threaded comments support
  parent_id UUID REFERENCES complaint_comments(id) ON DELETE CASCADE,

  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_complaint_comments_complaint_id ON complaint_comments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_user_id ON complaint_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_tenant_id ON complaint_comments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_parent_id ON complaint_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_created_at ON complaint_comments(created_at);

-- ============================================================================
-- 3. CREATE COMPLAINTS_WITH_DETAILS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW complaints_with_details AS
SELECT
  c.id,
  c.title,
  c.description,
  c.customer_id,
  cust.company_name AS customer_name,
  cust.contact_name AS customer_contact_name,
  cust.email AS customer_email,
  c.type,
  c.status,
  c.priority,
  c.assigned_engineer_id,
  COALESCE(u.name, u.email) AS assigned_engineer_name,
  c.engineer_resolution,
  c.tenant_id,
  c.created_at,
  c.updated_at,
  c.closed_at,

  -- Comments as JSON array
  COALESCE(
    json_agg(
      json_build_object(
        'id', cc.id,
        'complaint_id', cc.complaint_id,
        'user_id', cc.user_id,
        'content', cc.content,
        'created_at', cc.created_at,
        'parent_id', cc.parent_id
      )
    ) FILTER (WHERE cc.id IS NOT NULL),
    '[]'::json
  ) AS comments

FROM complaints c
LEFT JOIN customers cust ON c.customer_id = cust.id
LEFT JOIN users u ON c.assigned_engineer_id = u.id
LEFT JOIN complaint_comments cc ON c.id = cc.complaint_id AND cc.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.title, c.description, c.customer_id, cust.company_name,
         cust.contact_name, cust.email, c.type, c.status, c.priority,
         c.assigned_engineer_id, u.name, u.email, c.engineer_resolution,
         c.tenant_id, c.created_at, c.updated_at, c.closed_at;

-- ============================================================================
-- 4. ADD RLS POLICIES
-- ============================================================================

-- Enable RLS on complaint_comments
ALTER TABLE complaint_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for complaints (already exists, but ensure it's correct)
DROP POLICY IF EXISTS users_view_tenant_complaints ON complaints;
DROP POLICY IF EXISTS admins_manage_tenant_complaints ON complaints;
DROP POLICY IF EXISTS super_admin_view_all_complaints ON complaints;

CREATE POLICY users_view_tenant_complaints ON complaints
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY admins_manage_tenant_complaints ON complaints
  FOR ALL USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'manager', 'engineer')
    )
  );

CREATE POLICY super_admin_view_all_complaints ON complaints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- RLS policies for complaint_comments
DROP POLICY IF EXISTS users_view_tenant_complaint_comments ON complaint_comments;
DROP POLICY IF EXISTS users_manage_own_complaint_comments ON complaint_comments;
DROP POLICY IF EXISTS admins_manage_tenant_complaint_comments ON complaint_comments;
DROP POLICY IF EXISTS super_admin_view_all_complaint_comments ON complaint_comments;

CREATE POLICY users_view_tenant_complaint_comments ON complaint_comments
  FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY users_manage_own_complaint_comments ON complaint_comments
  FOR ALL USING (
    tenant_id = get_current_user_tenant_id() AND
    user_id = auth.uid()
  );

CREATE POLICY admins_manage_tenant_complaint_comments ON complaint_comments
  FOR ALL USING (
    tenant_id = get_current_user_tenant_id() AND
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'manager', 'engineer')
    )
  );

CREATE POLICY super_admin_view_all_complaint_comments ON complaint_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- ============================================================================
-- 5. ADD TRIGGERS
-- ============================================================================

CREATE TRIGGER complaint_comments_updated_at_trigger
  BEFORE UPDATE ON complaint_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. UPDATE TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE complaints IS 'Customer complaints (normalized - use complaints_with_details view for enriched data)';
COMMENT ON TABLE complaint_comments IS 'Complaint comments and threaded discussions';
COMMENT ON VIEW complaints_with_details IS 'Complaints with customer and engineer details, including comments';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- - Updated complaints table to match TypeScript Complaint interface
-- - Created complaint_comments table for threaded discussions
-- - Created complaints_with_details view with enriched data
-- - Added proper RLS policies for multi-tenant security
-- - Added performance indexes
-- ============================================================================
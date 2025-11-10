-- ============================================================================
-- PHASE 1.5: DYNAMIC DATA LOADING ARCHITECTURE
-- Seed Script: Reference Data - Status Options and Generic Reference Data
-- ============================================================================
-- This script populates status_options and reference_data tables with
-- test data for all CRM modules
-- ============================================================================

-- Set client timezone to UTC for consistent timestamps
SET timezone = 'UTC';

-- Get first tenant ID (assuming at least one tenant exists)
-- For testing, we'll use a specific tenant_id - adjust as needed
-- In production, this should be configured per tenant

-- ============================================================================
-- 1. SEED STATUS_OPTIONS FOR SALES MODULE
-- ============================================================================

INSERT INTO status_options (tenant_id, module, status_key, display_label, color_code, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'sales', 'pending', 'Pending', '#FFA500', 10, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'sales', 'qualified', 'Qualified', '#4169E1', 20, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'sales', 'proposal_sent', 'Proposal Sent', '#9370DB', 30, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'sales', 'negotiation', 'Negotiation', '#20B2AA', 40, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'sales', 'won', 'Won', '#228B22', 50, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'sales', 'lost', 'Lost', '#DC143C', 60, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1))
ON CONFLICT (tenant_id, module, status_key) DO NOTHING;

-- ============================================================================
-- 2. SEED STATUS_OPTIONS FOR TICKETS MODULE
-- ============================================================================

INSERT INTO status_options (tenant_id, module, status_key, display_label, color_code, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'tickets', 'open', 'Open', '#FF6B6B', 10, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'tickets', 'in_progress', 'In Progress', '#4ECDC4', 20, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'tickets', 'waiting_customer', 'Waiting for Customer', '#FFA500', 30, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'tickets', 'resolved', 'Resolved', '#95E1D3', 40, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'tickets', 'closed', 'Closed', '#38ADA9', 50, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'tickets', 'rejected', 'Rejected', '#DC143C', 60, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1))
ON CONFLICT (tenant_id, module, status_key) DO NOTHING;

-- ============================================================================
-- 3. SEED STATUS_OPTIONS FOR CONTRACTS MODULE
-- ============================================================================

INSERT INTO status_options (tenant_id, module, status_key, display_label, color_code, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'contracts', 'draft', 'Draft', '#A9A9A9', 10, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'contracts', 'sent_for_approval', 'Sent for Approval', '#FFA500', 20, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'contracts', 'approved', 'Approved', '#228B22', 30, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'contracts', 'signed', 'Signed', '#4169E1', 40, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'contracts', 'active', 'Active', '#32CD32', 50, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'contracts', 'expired', 'Expired', '#DC143C', 60, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'contracts', 'terminated', 'Terminated', '#8B0000', 70, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1))
ON CONFLICT (tenant_id, module, status_key) DO NOTHING;

-- ============================================================================
-- 4. SEED STATUS_OPTIONS FOR JOBWORK MODULE
-- ============================================================================

INSERT INTO status_options (tenant_id, module, status_key, display_label, color_code, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'jobwork', 'scheduled', 'Scheduled', '#4169E1', 10, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'jobwork', 'in_progress', 'In Progress', '#20B2AA', 20, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'jobwork', 'completed', 'Completed', '#228B22', 30, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'jobwork', 'pending_approval', 'Pending Approval', '#FFA500', 40, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'jobwork', 'cancelled', 'Cancelled', '#DC143C', 50, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1))
ON CONFLICT (tenant_id, module, status_key) DO NOTHING;

-- ============================================================================
-- 5. SEED STATUS_OPTIONS FOR COMPLAINTS MODULE
-- ============================================================================

INSERT INTO status_options (tenant_id, module, status_key, display_label, color_code, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'complaints', 'filed', 'Filed', '#FF6B6B', 10, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'complaints', 'under_investigation', 'Under Investigation', '#FFA500', 20, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'complaints', 'resolution_proposed', 'Resolution Proposed', '#9370DB', 30, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'complaints', 'resolved', 'Resolved', '#228B22', 40, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'complaints', 'closed', 'Closed', '#38ADA9', 50, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1))
ON CONFLICT (tenant_id, module, status_key) DO NOTHING;

-- ============================================================================
-- 6. SEED STATUS_OPTIONS FOR SERVICE_CONTRACT MODULE
-- ============================================================================

INSERT INTO status_options (tenant_id, module, status_key, display_label, color_code, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'serviceContract', 'draft', 'Draft', '#A9A9A9', 10, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'serviceContract', 'pending', 'Pending', '#FFA500', 20, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'serviceContract', 'active', 'Active', '#32CD32', 30, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'serviceContract', 'on_hold', 'On Hold', '#FFD700', 40, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'serviceContract', 'completed', 'Completed', '#228B22', 50, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'serviceContract', 'cancelled', 'Cancelled', '#DC143C', 60, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1))
ON CONFLICT (tenant_id, module, status_key) DO NOTHING;

-- ============================================================================
-- 7. SEED REFERENCE_DATA - PRIORITIES
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'priority', 'low', 'Low', '{"color":"#228B22","icon":"ArrowDown","weight":1}'::jsonb, 10, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'priority', 'medium', 'Medium', '{"color":"#FFA500","icon":"ArrowRight","weight":2}'::jsonb, 20, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'priority', 'high', 'High', '{"color":"#FF6B6B","icon":"ArrowUp","weight":3}'::jsonb, 30, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'priority', 'critical', 'Critical', '{"color":"#DC143C","icon":"AlertTriangle","weight":4}'::jsonb, 40, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1))
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 8. SEED REFERENCE_DATA - SEVERITIES
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'severity', 'minor', 'Minor', '{"color":"#A9A9A9","icon":"Bug","weight":1}'::jsonb, 10, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'severity', 'major', 'Major', '{"color":"#FFA500","icon":"AlertCircle","weight":2}'::jsonb, 20, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'severity', 'critical', 'Critical', '{"color":"#FF6B6B","icon":"AlertTriangle","weight":3}'::jsonb, 30, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'severity', 'blocker', 'Blocker', '{"color":"#DC143C","icon":"AlertOctagon","weight":4}'::jsonb, 40, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1))
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 9. SEED REFERENCE_DATA - DEPARTMENTS
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'department', 'sales', 'Sales', '{"icon":"TrendingUp","color":"#4169E1"}'::jsonb, 10, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'department', 'support', 'Support', '{"icon":"Headphones","color":"#20B2AA"}'::jsonb, 20, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'department', 'engineering', 'Engineering', '{"icon":"Wrench","color":"#9370DB"}'::jsonb, 30, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'department', 'operations', 'Operations', '{"icon":"Zap","color":"#FFD700"}'::jsonb, 40, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'department', 'billing', 'Billing', '{"icon":"DollarSign","color":"#228B22"}'::jsonb, 50, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1))
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 10. SEED REFERENCE_DATA - INDUSTRIES
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'industry', 'technology', 'Technology', '{"icon":"Code","color":"#4169E1"}'::jsonb, 10, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'industry', 'finance', 'Finance', '{"icon":"BarChart","color":"#228B22"}'::jsonb, 20, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'industry', 'healthcare', 'Healthcare', '{"icon":"Heart","color":"#DC143C"}'::jsonb, 30, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'industry', 'manufacturing', 'Manufacturing', '{"icon":"Package","color":"#FF8C00"}'::jsonb, 40, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'industry', 'retail', 'Retail', '{"icon":"ShoppingCart","color":"#9370DB"}'::jsonb, 50, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1))
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 11. SEED REFERENCE_DATA - COMPETENCY LEVELS
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'competency_level', 'beginner', 'Beginner', '{"level":1,"color":"#A9A9A9"}'::jsonb, 10, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'competency_level', 'intermediate', 'Intermediate', '{"level":2,"color":"#FFD700"}'::jsonb, 20, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'competency_level', 'advanced', 'Advanced', '{"level":3,"color":"#4169E1"}'::jsonb, 30, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'competency_level', 'expert', 'Expert', '{"level":4,"color":"#228B22"}'::jsonb, 40, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1))
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 12. SEED REFERENCE_DATA - PRODUCT TYPES
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'product_type', 'hardware', 'Hardware', '{"icon":"Monitor","color":"#4169E1"}'::jsonb, 10, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'product_type', 'software', 'Software', '{"icon":"Code","color":"#20B2AA"}'::jsonb, 20, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'product_type', 'service', 'Service', '{"icon":"Briefcase","color":"#9370DB"}'::jsonb, 30, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'product_type', 'subscription', 'Subscription', '{"icon":"RefreshCw","color":"#FFD700"}'::jsonb, 40, true, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1))
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 13. SEED TEST DATA - PRODUCT CATEGORIES (if table exists)
-- ============================================================================

INSERT INTO product_categories (tenant_id, name, description, is_active, sort_order, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'Software Licenses', 'Cloud and desktop software licenses', true, 10, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'Hardware', 'Computer hardware and peripherals', true, 20, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'Services', 'Professional services and consulting', true, 30, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'Support Plans', 'Maintenance and support plans', true, 40, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1))
ON CONFLICT (name, tenant_id) DO NOTHING;

-- ============================================================================
-- 14. SEED TEST DATA - SUPPLIERS (if table exists)
-- ============================================================================

INSERT INTO suppliers (tenant_id, name, email, phone, address, contact_person, contact_email, is_active, sort_order, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'Tech Supplies Inc', 'info@techsupplies.com', '+1-800-TECH-SUP', '123 Tech Ave, San Francisco, CA', 'John Smith', 'john@techsupplies.com', true, 10, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'Global Hardware Ltd', 'sales@globalhw.com', '+44-20-7946-0958', '456 Hardware Rd, London, UK', 'Sarah Johnson', 'sarah@globalhw.com', true, 20, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'Software Direct', 'contact@swdirect.com', '+1-415-555-0100', '789 Software Lane, Palo Alto, CA', 'Mike Chen', 'mike@swdirect.com', true, 30, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'Enterprise Solutions', 'enterprise@esolutions.com', '+1-212-555-0200', '321 Enterprise Blvd, New York, NY', 'Lisa Brown', 'lisa@esolutions.com', true, 40, (SELECT id FROM users WHERE role = 'super_user' LIMIT 1))
ON CONFLICT (name, tenant_id) DO NOTHING;

-- ============================================================================
-- Verification Queries (for testing)
-- ============================================================================

-- Verify status_options data
-- SELECT count(*) as status_count FROM status_options WHERE is_active = true;

-- Verify reference_data
-- SELECT count(*) as ref_count FROM reference_data WHERE is_active = true;

-- Verify grouped by module
-- SELECT module, count(*) FROM status_options GROUP BY module;

-- Verify grouped by category
-- SELECT category, count(*) FROM reference_data GROUP BY category;
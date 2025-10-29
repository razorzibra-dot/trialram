-- ============================================================================
-- SEED ROLES AND USER ROLE ASSIGNMENTS
-- Migration: 017 - Populate roles and assign users to roles
-- ============================================================================
-- This migration creates system roles for each tenant and assigns seed users to those roles
-- Required for RBAC system to work with seeded test users

-- ============================================================================
-- 1. CREATE ROLES FOR EACH TENANT BASED ON ROLE TEMPLATES
-- ============================================================================

-- Acme Corporation (tenant: 550e8400-e29b-41d4-a716-446655440001)
INSERT INTO roles (name, description, tenant_id, is_system_role, permissions, created_at, updated_at)
VALUES
  (
    'Super Administrator',
    'Full platform administration with all permissions',
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    TRUE,
    '[
      "manage_users", "view_users", "create_user", "edit_user", "delete_user", "reset_password",
      "manage_roles", "view_roles", "create_role", "edit_role", "delete_role", "assign_role",
      "manage_permissions", "view_audit_logs",
      "view_reports", "create_customer", "edit_customer", "delete_customer", "view_customer",
      "manage_contracts", "manage_tickets", "manage_sales", "manage_products", "manage_job_works", "manage_product_sales"
    ]'::JSONB,
    NOW(),
    NOW()
  ),
  (
    'Administrator',
    'Tenant administrator with full tenant permissions',
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    TRUE,
    '[
      "manage_users", "view_users", "create_user", "edit_user", "delete_user", "reset_password",
      "manage_roles", "view_roles", "create_role", "edit_role", "delete_role", "assign_role",
      "manage_permissions", "view_audit_logs",
      "view_reports", "create_customer", "edit_customer", "delete_customer", "view_customer",
      "manage_contracts", "manage_tickets", "manage_sales", "manage_products", "manage_job_works", "manage_product_sales"
    ]'::JSONB,
    NOW(),
    NOW()
  ),
  (
    'Manager',
    'Business operations manager with analytics access',
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    TRUE,
    '[
      "view_users", "view_reports", "create_customer", "edit_customer", "view_customer",
      "manage_contracts", "manage_sales", "manage_products", "manage_job_works", "manage_product_sales"
    ]'::JSONB,
    NOW(),
    NOW()
  ),
  (
    'Agent',
    'Customer service agent with basic operations',
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    TRUE,
    '[
      "view_users", "view_customer", "create_customer", "edit_customer", "manage_tickets"
    ]'::JSONB,
    NOW(),
    NOW()
  ),
  (
    'Engineer',
    'Technical engineer with product and job work access',
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    TRUE,
    '[
      "view_users", "view_reports", "view_customer", "manage_products", "manage_job_works", "manage_product_sales", "manage_tickets"
    ]'::JSONB,
    NOW(),
    NOW()
  )
ON CONFLICT (name, tenant_id) DO NOTHING;

-- Tech Solutions Inc (tenant: 550e8400-e29b-41d4-a716-446655440002)
INSERT INTO roles (name, description, tenant_id, is_system_role, permissions, created_at, updated_at)
VALUES
  (
    'Super Administrator',
    'Full platform administration with all permissions',
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    TRUE,
    '[
      "manage_users", "view_users", "create_user", "edit_user", "delete_user", "reset_password",
      "manage_roles", "view_roles", "create_role", "edit_role", "delete_role", "assign_role",
      "manage_permissions", "view_audit_logs",
      "view_reports", "create_customer", "edit_customer", "delete_customer", "view_customer",
      "manage_contracts", "manage_tickets", "manage_sales", "manage_products", "manage_job_works", "manage_product_sales"
    ]'::JSONB,
    NOW(),
    NOW()
  ),
  (
    'Administrator',
    'Tenant administrator with full tenant permissions',
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    TRUE,
    '[
      "manage_users", "view_users", "create_user", "edit_user", "delete_user", "reset_password",
      "manage_roles", "view_roles", "create_role", "edit_role", "delete_role", "assign_role",
      "manage_permissions", "view_audit_logs",
      "view_reports", "create_customer", "edit_customer", "delete_customer", "view_customer",
      "manage_contracts", "manage_tickets", "manage_sales", "manage_products", "manage_job_works", "manage_product_sales"
    ]'::JSONB,
    NOW(),
    NOW()
  ),
  (
    'Manager',
    'Business operations manager with analytics access',
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    TRUE,
    '[
      "view_users", "view_reports", "create_customer", "edit_customer", "view_customer",
      "manage_contracts", "manage_sales", "manage_products", "manage_job_works", "manage_product_sales"
    ]'::JSONB,
    NOW(),
    NOW()
  )
ON CONFLICT (name, tenant_id) DO NOTHING;

-- Global Trading Ltd (tenant: 550e8400-e29b-41d4-a716-446655440003)
INSERT INTO roles (name, description, tenant_id, is_system_role, permissions, created_at, updated_at)
VALUES
  (
    'Super Administrator',
    'Full platform administration with all permissions',
    '550e8400-e29b-41d4-a716-446655440003'::UUID,
    TRUE,
    '[
      "manage_users", "view_users", "create_user", "edit_user", "delete_user", "reset_password",
      "manage_roles", "view_roles", "create_role", "edit_role", "delete_role", "assign_role",
      "manage_permissions", "view_audit_logs",
      "view_reports", "create_customer", "edit_customer", "delete_customer", "view_customer",
      "manage_contracts", "manage_tickets", "manage_sales", "manage_products", "manage_job_works", "manage_product_sales"
    ]'::JSONB,
    NOW(),
    NOW()
  )
ON CONFLICT (name, tenant_id) DO NOTHING;

-- ============================================================================
-- 2. ASSIGN USERS TO ROLES
-- ============================================================================

-- Acme Corporation users
-- admin@acme.com (Super Administrator role)
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
SELECT 
  u.id,
  r.id,
  '550e8400-e29b-41d4-a716-446655440001'::UUID,
  NOW()
FROM users u
CROSS JOIN roles r
WHERE u.email = 'admin@acme.com'
  AND r.name = 'Super Administrator'
  AND r.tenant_id = '550e8400-e29b-41d4-a716-446655440001'::UUID
ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

-- manager@acme.com (Manager role)
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
SELECT 
  u.id,
  r.id,
  '550e8400-e29b-41d4-a716-446655440001'::UUID,
  NOW()
FROM users u
CROSS JOIN roles r
WHERE u.email = 'manager@acme.com'
  AND r.name = 'Manager'
  AND r.tenant_id = '550e8400-e29b-41d4-a716-446655440001'::UUID
ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

-- engineer@acme.com (Engineer role)
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
SELECT 
  u.id,
  r.id,
  '550e8400-e29b-41d4-a716-446655440001'::UUID,
  NOW()
FROM users u
CROSS JOIN roles r
WHERE u.email = 'engineer@acme.com'
  AND r.name = 'Engineer'
  AND r.tenant_id = '550e8400-e29b-41d4-a716-446655440001'::UUID
ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

-- user@acme.com (Agent role)
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
SELECT 
  u.id,
  r.id,
  '550e8400-e29b-41d4-a716-446655440001'::UUID,
  NOW()
FROM users u
CROSS JOIN roles r
WHERE u.email = 'user@acme.com'
  AND r.name = 'Agent'
  AND r.tenant_id = '550e8400-e29b-41d4-a716-446655440001'::UUID
ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

-- Tech Solutions users
-- admin@techsolutions.com (Administrator role)
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
SELECT 
  u.id,
  r.id,
  '550e8400-e29b-41d4-a716-446655440002'::UUID,
  NOW()
FROM users u
CROSS JOIN roles r
WHERE u.email = 'admin@techsolutions.com'
  AND r.name = 'Administrator'
  AND r.tenant_id = '550e8400-e29b-41d4-a716-446655440002'::UUID
ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

-- manager@techsolutions.com (Manager role)
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
SELECT 
  u.id,
  r.id,
  '550e8400-e29b-41d4-a716-446655440002'::UUID,
  NOW()
FROM users u
CROSS JOIN roles r
WHERE u.email = 'manager@techsolutions.com'
  AND r.name = 'Manager'
  AND r.tenant_id = '550e8400-e29b-41d4-a716-446655440002'::UUID
ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

-- Global Trading users
-- admin@globaltrading.com (Super Administrator role)
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
SELECT 
  u.id,
  r.id,
  '550e8400-e29b-41d4-a716-446655440003'::UUID,
  NOW()
FROM users u
CROSS JOIN roles r
WHERE u.email = 'admin@globaltrading.com'
  AND r.name = 'Super Administrator'
  AND r.tenant_id = '550e8400-e29b-41d4-a716-446655440003'::UUID
ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

-- ============================================================================
-- 3. VERIFICATION QUERIES
-- ============================================================================
-- Uncomment these to verify the seeding worked:
-- SELECT COUNT(*) as role_count FROM roles;
-- SELECT COUNT(*) as user_role_count FROM user_roles;
-- SELECT u.email, r.name, r.tenant_id FROM user_roles ur
--   JOIN users u ON ur.user_id = u.id
--   JOIN roles r ON ur.role_id = r.id
--   ORDER BY u.email;
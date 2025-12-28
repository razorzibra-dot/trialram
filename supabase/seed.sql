-- ============================================================================
-- COMPREHENSIVE DATABASE SEED DATA FOR ENTERPRISE CRM
-- This file contains essential seed data for development and testing
--
-- Date: December 5, 2025
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 1: SEED DATA INSERTION
-- ============================================================================

-- Insert sample tenants (only if they don't exist)
INSERT INTO tenants (id, name, domain, plan, status)
SELECT * FROM (VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Acme Corporation', 'acme.com', 'enterprise', 'active'),
  ('b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid, 'Tech Solutions Inc', 'techsolutions.example', 'premium', 'active'),
  ('c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid, 'Global Trading Ltd', 'globaltrading.example', 'basic', 'active')
) AS v(id, name, domain, plan, status)
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE tenants.id = v.id);

-- Product-Sale Permissions (required for product-sales module access)
INSERT INTO permissions (name, description, category, resource, action, is_system_permission) VALUES
('crm:product-sale:record:read', 'View product sale records', 'module', 'product-sale', 'record:read', true),
('crm:product-sale:record:create', 'Create product sale records', 'module', 'product-sale', 'record:create', true),
('crm:product-sale:record:update', 'Update product sale records', 'module', 'product-sale', 'record:update', true),
('crm:product-sale:record:delete', 'Delete product sale records', 'module', 'product-sale', 'record:delete', true)
ON CONFLICT (name) DO NOTHING;

-- Lead permissions (aligns with modulePermissionMap leads entry)
INSERT INTO permissions (name, description, category, resource, action, is_system_permission) VALUES
('crm:lead:record:read', 'View lead records', 'module', 'lead', 'record:read', true),
('crm:lead:record:create', 'Create lead records', 'module', 'lead', 'record:create', true),
('crm:lead:record:update', 'Update lead records', 'module', 'lead', 'record:update', true),
('crm:lead:record:delete', 'Delete lead records', 'module', 'lead', 'record:delete', true)
ON CONFLICT (name) DO NOTHING;

-- Note: Leads navigation item is seeded in migration 20251128002000_seed_navigation_items.sql

-- Grant lead read permission to tenant_admin role (Acme tenant) for navigation visibility
DO $$
DECLARE
  lead_read_id UUID;
  tenant_admin_role_id UUID;
BEGIN
  SELECT id INTO lead_read_id FROM permissions WHERE name = 'crm:lead:record:read' LIMIT 1;
  SELECT id INTO tenant_admin_role_id FROM roles WHERE name = 'tenant_admin' AND tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' LIMIT 1;

  IF lead_read_id IS NOT NULL AND tenant_admin_role_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (tenant_admin_role_id, lead_read_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
END $$;

-- Update role name for tenant admin to match user preference
UPDATE roles SET name = 'tenant_admin' WHERE name = 'Administrator' AND tenant_id IS NOT NULL;

-- Role permissions are assigned by migrations, skipping here

-- Insert sample auth users (only if they don't exist)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  email_change,
  reauthentication_token,
  phone_change,
  phone_change_token,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
SELECT * FROM (VALUES
  ('00000000-0000-0000-0000-000000000000'::uuid, '6e084750-4e35-468c-9903-5b5ab9d14af4'::uuid, 'authenticated', 'authenticated', 'admin@acme.com', crypt('password123', gen_salt('bf', 8)), '', '', '', '', '', '', '', '', NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"name": "Admin User"}'::jsonb, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000000'::uuid, '2707509b-57e8-4c84-a6fe-267eaa724223'::uuid, 'authenticated', 'authenticated', 'manager@acme.com', crypt('password123', gen_salt('bf', 8)), '', '', '', '', '', '', '', '', NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"name": "Sales Manager"}'::jsonb, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000000'::uuid, '27ff37b5-ef55-4e34-9951-42f35a1b2506'::uuid, 'authenticated', 'authenticated', 'engineer@acme.com', crypt('password123', gen_salt('bf', 8)), '', '', '', '', '', '', '', '', NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"name": "Sales Rep"}'::jsonb, NOW(), NOW())
) AS v(instance_id, id, aud, role, email, encrypted_password, confirmation_token, recovery_token, email_change_token_new, email_change_token_current, email_change, reauthentication_token, phone_change, phone_change_token, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = v.id);

-- Insert public users with proper tenant assignment (override sync function if needed)
INSERT INTO users (id, email, name, first_name, last_name, tenant_id, is_super_admin, status) VALUES
('6e084750-4e35-468c-9903-5b5ab9d14af4', 'admin@acme.com', 'Admin User', 'Admin', 'User', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false, 'active'),
('2707509b-57e8-4c84-a6fe-267eaa724223', 'manager@acme.com', 'Sales Manager', 'Sales', 'Manager', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false, 'active'),
('27ff37b5-ef55-4e34-9951-42f35a1b2506', 'engineer@acme.com', 'Sales Rep', 'Sales', 'Rep', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false, 'active')
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    tenant_id = EXCLUDED.tenant_id,
    is_super_admin = EXCLUDED.is_super_admin,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Ensure a deterministic super-admin auth + public user exists and capture its id by email
DO $$
DECLARE
  super_auth_id UUID;
BEGIN
  -- Create auth user only if an auth record for this email doesn't exist (auth.users may not have a unique constraint on email)
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  SELECT '00000000-0000-0000-0000-000000000000'::uuid, uuid_generate_v4(), 'authenticated', 'authenticated', 'superadmin@crm.com', crypt('password123', gen_salt('bf', 8)), NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"name": "Super Admin"}'::jsonb, NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@crm.com');

  SELECT id INTO super_auth_id FROM auth.users WHERE email = 'superadmin@crm.com' LIMIT 1;

  IF super_auth_id IS NOT NULL THEN
    INSERT INTO users (id, email, name, first_name, last_name, tenant_id, is_super_admin, status)
    VALUES (super_auth_id, 'superadmin@crm.com', 'Super Admin', 'Super', 'Admin', NULL, true, 'active')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      tenant_id = EXCLUDED.tenant_id,
      is_super_admin = EXCLUDED.is_super_admin,
      status = EXCLUDED.status,
      updated_at = NOW();
  END IF;
END $$;

-- Assign user roles directly (FRS-compliant roles)
-- Super admin role (tenant_id is NULL)
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by)
SELECT u.id, r.id, NULL, (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1)
FROM users u, roles r
WHERE u.email = 'superadmin@crm.com' AND r.name = 'super_admin' AND r.is_system_role = true
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id AND ur.tenant_id IS NULL);

-- Tenant admin roles - ensure admin@acme.com gets tenant_admin role
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by)
SELECT u.id, r.id, u.tenant_id, (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1)
FROM users u, roles r
WHERE u.email = 'admin@acme.com' AND r.name = 'tenant_admin' AND r.tenant_id = u.tenant_id
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id AND ur.tenant_id = u.tenant_id);

-- Additional explicit role assignment for admin@acme.com (failsafe)
DO $$
DECLARE
    user_id_val UUID;
    role_id_val UUID;
    tenant_id_val UUID;
BEGIN
    -- Get the user ID for admin@acme.com
    SELECT id, tenant_id INTO user_id_val, tenant_id_val
    FROM users
    WHERE email = 'admin@acme.com'
    LIMIT 1;

    -- Get the role ID for tenant_admin
    SELECT id INTO role_id_val
    FROM roles
    WHERE name = 'tenant_admin' AND tenant_id = tenant_id_val
    LIMIT 1;

    -- Insert if not exists
    IF user_id_val IS NOT NULL AND role_id_val IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by)
        VALUES (user_id_val, role_id_val, tenant_id_val, (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1))
        ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;
    END IF;
END $$;

INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by)
SELECT u.id, r.id, u.tenant_id, (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1)
FROM users u, roles r
WHERE u.email = 'manager@acme.com' AND r.name = 'Manager' AND r.tenant_id = u.tenant_id
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id AND ur.tenant_id = u.tenant_id);

INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by)
SELECT u.id, r.id, u.tenant_id, (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1)
FROM users u, roles r
WHERE u.email = 'engineer@acme.com' AND r.name = 'Engineer' AND r.tenant_id = u.tenant_id
AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id AND ur.tenant_id = u.tenant_id);

-- Insert sample companies (FOR ALL TENANTS with proper status field)
INSERT INTO companies (name, address, phone, email, tenant_id, status) 
SELECT * FROM (VALUES
  ('Demo Manufacturing Inc', '123 Industrial Ave, Detroit, MI, USA', '+1-313-555-0100', 'contact@demomfg.com', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'active'::entity_status),
  ('Acme Solutions Corp', '456 Tech Blvd, Austin, TX, USA', '+1-512-555-0200', 'info@acmesolutions.com', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid, 'active'::entity_status),
  ('Global Services Ltd', '789 Service St, Miami, FL, USA', '+1-305-555-0300', 'sales@globalservices.com', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid, 'active'::entity_status)
) AS v(name, address, phone, email, tenant_id, status)
WHERE NOT EXISTS (
  SELECT 1 FROM companies c WHERE c.email = v.email AND c.tenant_id = v.tenant_id
);

-- Insert product categories as reference_data (category = 'product_category')
-- This provides consistent dropdown data loading across all modules using reference_data table
INSERT INTO reference_data (id, tenant_id, category, key, label, description, sort_order, is_active) 
SELECT * FROM (VALUES
  -- Acme Corporation categories
  ('11111111-1111-1111-1111-111111111101'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'product_category', 'electronics', 'Electronics', 'Electronic products and components', 1, true),
  ('11111111-1111-1111-1111-111111111102'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'product_category', 'software', 'Software', 'Software solutions and licenses', 2, true),
  ('11111111-1111-1111-1111-111111111103'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'product_category', 'services', 'Services', 'Professional services and support', 3, true),
  -- Tech Solutions categories
  ('11111111-1111-1111-1111-111111111201'::uuid, 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid, 'product_category', 'cloud_services', 'Cloud Services', 'Cloud hosting and infrastructure', 1, true),
  ('11111111-1111-1111-1111-111111111202'::uuid, 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid, 'product_category', 'support_plans', 'Support Plans', 'Support and maintenance packages', 2, true),
  -- Global Trading categories
  ('11111111-1111-1111-1111-111111111301'::uuid, 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid, 'product_category', 'tools', 'Tools', 'Tools and equipment', 1, true),
  ('11111111-1111-1111-1111-111111111302'::uuid, 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid, 'product_category', 'safety_equipment', 'Safety Equipment', 'Safety and protective equipment', 2, true)
) AS v(id, tenant_id, category, key, label, description, sort_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM reference_data rd 
  WHERE rd.category = v.category AND rd.key = v.key AND rd.tenant_id = v.tenant_id
);

-- Insert sample products (FOR ALL TENANTS to ensure dropdowns work)
INSERT INTO products (name, sku, description, price, cost_price, stock_quantity, tenant_id, status, is_active) 
SELECT * FROM (VALUES
  -- Acme Corporation products
  ('Premium Widget', 'WID-001', 'High-quality industrial widget', 29.99::numeric, 18.50::numeric, 100, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'active'::product_status, true::boolean),
  ('Standard Gadget', 'GAD-001', 'Reliable electronic gadget', 49.99::numeric, 30.00::numeric, 75, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'active'::product_status, true::boolean),
  -- Tech Solutions products
  ('Service Package Basic', 'SRV-001', 'Basic service maintenance package', 99.99::numeric, 60.00::numeric, 50, 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid, 'active'::product_status, true::boolean),
  ('Cloud Hosting Plan', 'CLOUD-001', 'Enterprise cloud hosting', 199.99::numeric, 120.00::numeric, 999, 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid, 'active'::product_status, true::boolean),
  -- Global Trading products  
  ('Advanced Tool Kit', 'TOO-001', 'Complete toolkit for professionals', 79.99::numeric, 45.00::numeric, 30, 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid, 'active'::product_status, true::boolean),
  ('Safety Equipment Set', 'SAFE-001', 'Comprehensive safety equipment', 129.99::numeric, 80.00::numeric, 25, 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid, 'active'::product_status, true::boolean)
) AS v(name, sku, description, price, cost_price, stock_quantity, tenant_id, status, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.sku = v.sku AND p.tenant_id = v.tenant_id
);

-- Insert sample customers
INSERT INTO customers (
  company_name,
  contact_name,
  email,
  phone,
  address,
  city,
  country,
  tenant_id,
  status,
  size,
  customer_type
) VALUES
('Demo Manufacturing Inc', 'Alice Johnson', 'alice.johnson@example.com', '+1-555-1001', '100 Main St', 'New York', 'USA', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'active', 'medium', 'business'),
('Acme Solutions Corp', 'Bob Smith', 'bob.smith@example.com', '+1-555-1002', '200 Oak Ave', 'Los Angeles', 'USA', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', 'prospect', 'small', 'business'),
('Global Services Ltd', 'Carol Williams', 'carol.williams@example.com', '+1-555-1003', '300 Pine Rd', 'Chicago', 'USA', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', 'active', 'enterprise', 'business');

-- Insert sample deals
INSERT INTO deals (customer_id, title, description, value, status, close_date, assigned_to, notes, tenant_id, created_by, deal_type) VALUES
(
  (SELECT id FROM customers WHERE email = 'alice.johnson@example.com' LIMIT 1),
  'Premium Widget Package',
  'Enterprise customer interested in full product suite',
  15000.00,
  'won',
  CURRENT_DATE - INTERVAL '5 days',
  (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1),
  'Closed deal with premium tier discount applied',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1),
  'PRODUCT'
),
(
  (SELECT id FROM customers WHERE email = 'bob.smith@example.com' LIMIT 1),
  'Service Upgrade Deal',
  'Upsell to premium service tier',
  8500.00,
  'won',
  CURRENT_DATE - INTERVAL '2 days',
  (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1),
  'Customer approved for 1-year service contract',
  'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22',
  (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1),
  'SERVICE'
),
(
  (SELECT id FROM customers WHERE email = 'carol.williams@example.com' LIMIT 1),
  'Tool Kit + Support Bundle',
  'Complete tool kit with extended support',
  12000.00,
  'lost',
  CURRENT_DATE + INTERVAL '5 days',
  (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1),
  'Customer chose competitor product',
  'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33',
  (SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1),
  'PRODUCT'
);

-- Insert sample deal items (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_name = 'deal_items'
  ) THEN
    INSERT INTO deal_items (deal_id, product_id, product_name, quantity, unit_price, line_total, tenant_id) VALUES
    -- Deal 1: Premium Widget Package
    (
      (SELECT id FROM deals WHERE title = 'Premium Widget Package' LIMIT 1),
      (SELECT id FROM products WHERE sku = 'WID-001' LIMIT 1),
      'Premium Widget Bundle',
      5,
      2500.00,
      12500.00,
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    ),
    -- Deal 2: Service Upgrade Deal
    (
      (SELECT id FROM deals WHERE title = 'Service Upgrade Deal' LIMIT 1),
      (SELECT id FROM products WHERE sku = 'SRV-001' LIMIT 1),
      'Premium Support Service (Annual)',
      2,
      3500.00,
      7000.00,
      'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'
    ),
    -- Deal 3: Tool Kit + Support Bundle
    (
      (SELECT id FROM deals WHERE title = 'Tool Kit + Support Bundle' LIMIT 1),
      (SELECT id FROM products WHERE sku = 'TOO-001' LIMIT 1),
      'Complete Tool Kit',
      3,
      3200.00,
      9600.00,
      'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33'
    );
  END IF;
END$$;

-- ============================================================================
-- END OF DATABASE SEED DATA
-- ============================================================================

-- Verification: Run SELECT validate_system_setup();
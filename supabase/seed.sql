-- ============================================================================
-- SEED DATA FOR ENTERPRISE CRM SYSTEM
-- Core tables seed data for development and testing
--
-- This file contains essential seed data for:
-- - Permissions and roles
-- - Tenants and users
-- - Sample customers, sales, tickets, and contracts
--
-- Date: November 24, 2025
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Insert default permissions with atomic CRM permission tokens
INSERT INTO permissions (name, description, resource, action, category, is_system_permission) VALUES
-- Contact Management (Customers)
('crm:customer:record:read', 'View customer records', 'contact', 'record:read', 'module', true),
('crm:customer:record:create', 'Create customer records', 'contact', 'record:create', 'module', true),
('crm:customer:record:update', 'Update customer records', 'contact', 'record:update', 'module', true),
('crm:customer:record:delete', 'Delete customer records', 'contact', 'record:delete', 'module', true),
('crm:customer:record:field.email:update', 'Update customer email field', 'contact', 'record:field.email:update', 'module', true),

-- Deal Management (Sales)
('crm:deal:record:read', 'View deal records', 'deal', 'record:read', 'module', true),
('crm:deal:record:create', 'Create deal records', 'deal', 'record:create', 'module', true),
('crm:deal:record:update', 'Update deal records', 'deal', 'record:update', 'module', true),
('crm:deal:record:delete', 'Delete deal records', 'deal', 'record:delete', 'module', true),
('crm:deal:pipeline:move', 'Move deals in pipeline', 'deal', 'pipeline:move', 'module', true),

-- Support System (Tickets)
('crm:support:ticket:read', 'View support tickets', 'support', 'ticket:read', 'module', true),
('crm:support:ticket:create', 'Create support tickets', 'support', 'ticket:create', 'module', true),
('crm:support:ticket:update', 'Update support tickets', 'support', 'ticket:update', 'module', true),
('crm:support:ticket:delete', 'Delete support tickets', 'support', 'ticket:delete', 'module', true),

-- Complaints Management
('crm:support:complaint:read', 'View complaints', 'support', 'complaint:read', 'module', true),
('crm:support:complaint:create', 'Create complaints', 'support', 'complaint:create', 'module', true),
('crm:support:complaint:update', 'Update complaints', 'support', 'complaint:update', 'module', true),
('crm:support:complaint:delete', 'Delete complaints', 'support', 'complaint:delete', 'module', true),

-- Contract Management
('crm:contract:record:read', 'View contract records', 'contract', 'record:read', 'module', true),
('crm:contract:record:create', 'Create contract records', 'contract', 'record:create', 'module', true),
('crm:contract:record:update', 'Update contract records', 'contract', 'record:update', 'module', true),
('crm:contract:record:delete', 'Delete contract records', 'contract', 'record:delete', 'module', true),

-- Service Contract Management
('crm:contract:service:read', 'View service contracts', 'contract', 'service:read', 'module', true),
('crm:contract:service:create', 'Create service contracts', 'contract', 'service:create', 'module', true),
('crm:contract:service:update', 'Update service contracts', 'contract', 'service:update', 'module', true),
('crm:contract:service:delete', 'Delete service contracts', 'contract', 'service:delete', 'module', true),

-- Product Management
('crm:product:record:read', 'View product records', 'product', 'record:read', 'module', true),
('crm:product:record:create', 'Create product records', 'product', 'record:create', 'module', true),
('crm:product:record:update', 'Update product records', 'product', 'record:update', 'module', true),
('crm:product:record:delete', 'Delete product records', 'product', 'record:delete', 'module', true),

-- Job Work Management
('crm:job:work:read', 'View job work records', 'job', 'work:read', 'module', true),
('crm:job:work:create', 'Create job work records', 'job', 'work:create', 'module', true),
('crm:job:work:update', 'Update job work records', 'job', 'work:update', 'module', true),
('crm:job:work:delete', 'Delete job work records', 'job', 'work:delete', 'module', true),

-- User Management
('crm:user:record:read', 'View user records', 'user', 'record:read', 'administrative', true),
('crm:user:record:create', 'Create user records', 'user', 'record:create', 'administrative', true),
('crm:user:record:update', 'Update user records', 'user', 'record:update', 'administrative', true),
('crm:user:record:delete', 'Delete user records', 'user', 'record:delete', 'administrative', true),

-- Role Management
('crm:role:record:read', 'View role records', 'role', 'record:read', 'administrative', true),
('crm:role:record:create', 'Create role records', 'role', 'record:create', 'administrative', true),
('crm:role:record:update', 'Update role records', 'role', 'record:update', 'administrative', true),
('crm:role:record:delete', 'Delete role records', 'role', 'record:delete', 'administrative', true),

-- Permission Management
('crm:permission:record:read', 'View permission records', 'permission', 'record:read', 'administrative', true),
('crm:permission:record:create', 'Create permission records', 'permission', 'record:create', 'administrative', true),
('crm:permission:record:update', 'Update permission records', 'permission', 'record:update', 'administrative', true),
('crm:permission:record:delete', 'Delete permission records', 'permission', 'record:delete', 'administrative', true),

-- Tenant Management
('crm:tenant:record:read', 'View tenant records', 'tenant', 'record:read', 'system', true),
('crm:tenant:record:create', 'Create tenant records', 'tenant', 'record:create', 'system', true),
('crm:tenant:record:update', 'Update tenant records', 'tenant', 'record:update', 'system', true),
('crm:tenant:record:delete', 'Delete tenant records', 'tenant', 'record:delete', 'system', true),

-- Company Management
('crm:company:record:read', 'View company records', 'company', 'record:read', 'module', true),
('crm:company:record:create', 'Create company records', 'company', 'record:create', 'module', true),
('crm:company:record:update', 'Update company records', 'company', 'record:update', 'module', true),
('crm:company:record:delete', 'Delete company records', 'company', 'record:delete', 'module', true),

-- Audit & Compliance
('crm:audit:log:read', 'View audit logs', 'audit', 'log:read', 'system', true),
('crm:audit:log:export', 'Export audit logs', 'audit', 'log:export', 'system', true),

-- Dashboard & Analytics
('crm:dashboard:panel:view', 'Access dashboard and analytics', 'dashboard', 'view', 'module', true),
('crm:report:record:view', 'View reports', 'report', 'view', 'module', true),
('crm:analytics:insight:view', 'Access analytics', 'analytics', 'view', 'module', true),

-- System Administration
('crm:system:platform:admin', 'System administration', 'system', 'admin', 'system', true),
('crm:platform:control:admin', 'Platform administration', 'platform', 'admin', 'system', true),
('crm:system:config:manage', 'Manage system settings', 'settings', 'manage', 'system', true),

-- Data Operations
('crm:data:export', 'Export data and reports', 'data', 'export', 'module', true),
('crm:data:import', 'Import data', 'data', 'import', 'module', true),

-- Notification Management
('crm:notification:channel:manage', 'Manage notifications', 'notification', 'manage', 'module', true),

-- Masters/Reference Data
('crm:master:data:read', 'View master/reference data', 'master', 'data:read', 'module', true),
('crm:master:data:manage', 'Manage master/reference data', 'master', 'data:manage', 'administrative', true)
ON CONFLICT (name) DO NOTHING;
-- Insert default roles for each tenant
-- ✅ Normalized role names to match UserRole enum exactly (no mapping needed)
-- FRS-compliant roles are seeded by the database reset migration (20251126000001_isolated_reset.sql)
-- No additional roles needed here

-- Insert sample users (public.users) — password stored in auth.users
-- Ensure matching auth user exists for public user (FK: users.id -> auth.users.id)
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
) VALUES (
	'00000000-0000-0000-0000-000000000000'::uuid,
	'550e8400-e29b-41d4-a716-446655440010'::uuid,
	'authenticated',
	'authenticated',
	'superadmin@crm.com',
	crypt('password123', gen_salt('bf', 8)),
	'',
	'',
	'',
	'',
	'',
	'',
	'',
	'',
	NOW(),
	'{"provider": "email", "providers": ["email"]}'::jsonb,
	'{"name": "Super Admin"}'::jsonb,
	NOW(),
	NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert auth users for testing
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
) VALUES
-- Super Admin
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  '550e8400-e29b-41d4-a716-446655440010'::uuid,
  'authenticated',
  'authenticated',
  'superadmin@crm.com',
  crypt('password123', gen_salt('bf', 8)),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "Super Admin"}'::jsonb,
  NOW(),
  NOW()
),
-- Acme Admin
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  '6e084750-4e35-468c-9903-5b5ab9d14af4'::uuid,
  'authenticated',
  'authenticated',
  'admin@acme.com',
  crypt('password123', gen_salt('bf', 8)),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "Admin User"}'::jsonb,
  NOW(),
  NOW()
),
-- Acme Sales Manager
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  '2707509b-57e8-4c84-a6fe-267eaa724223'::uuid,
  'authenticated',
  'authenticated',
  'manager@acme.com',
  crypt('password123', gen_salt('bf', 8)),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "Sales Manager"}'::jsonb,
  NOW(),
  NOW()
),
-- Acme Sales Rep
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  '27ff37b5-ef55-4e34-9951-42f35a1b2506'::uuid,
  'authenticated',
  'authenticated',
  'engineer@acme.com',
  crypt('password123', gen_salt('bf', 8)),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "Sales Rep"}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert public users
INSERT INTO users (id, email, name, first_name, last_name, tenant_id, is_super_admin, status) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'superadmin@crm.com', 'Super Admin', 'Super', 'Admin', NULL, true, 'active'),
('6e084750-4e35-468c-9903-5b5ab9d14af4', 'admin@acme.com', 'Admin User', 'Admin', 'User', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false, 'active'),
('2707509b-57e8-4c84-a6fe-267eaa724223', 'manager@acme.com', 'Sales Manager', 'Sales', 'Manager', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false, 'active'),
('27ff37b5-ef55-4e34-9951-42f35a1b2506', 'engineer@acme.com', 'Sales Rep', 'Sales', 'Rep', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false, 'active')
ON CONFLICT (email) DO NOTHING;

-- Assign users to roles (FRS-compliant roles created by migrations)
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT
  u.id,
  r.id,
  '550e8400-e29b-41d4-a716-446655440010'
FROM users u
CROSS JOIN roles r
WHERE
  (u.email = 'superadmin@crm.com' AND r.name = 'super_admin' AND r.is_system_role = true) OR
  (u.email = 'admin@acme.com' AND r.name = 'tenant_admin' AND r.tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') OR
  (u.email = 'manager@acme.com' AND r.name = 'sales_manager' AND r.tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') OR
  (u.email = 'engineer@acme.com' AND r.name = 'sales_representative' AND r.tenant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
ON CONFLICT DO NOTHING;
-- Insert sample companies
INSERT INTO companies (name, registration_number, address, city, state, country, phone, email, tenant_id) VALUES
('Demo Manufacturing Inc', 'REG001', '123 Industrial Ave', 'Detroit', 'MI', 'USA', '+1-313-555-0100', 'contact@demomfg.com', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('Acme Solutions Corp', 'REG002', '456 Tech Blvd', 'Austin', 'TX', 'USA', '+1-512-555-0200', 'info@acmesolutions.com', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'),
('Global Services Ltd', 'REG003', '789 Service St', 'Miami', 'FL', 'USA', '+1-305-555-0300', 'sales@globalservices.com', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33')
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO products (name, code, description, category, unit_price, cost_price, quantity_in_stock, tenant_id) VALUES
('Premium Widget', 'WID-001', 'High-quality industrial widget', 'Components', 29.99, 18.50, 100, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('Standard Gadget', 'GAD-001', 'Reliable electronic gadget', 'Electronics', 49.99, 30.00, 75, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('Service Package Basic', 'SRV-001', 'Basic service maintenance package', 'Services', 99.99, 60.00, 50, 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'),
('Advanced Tool Kit', 'TOO-001', 'Complete toolkit for professionals', 'Tools', 79.99, 45.00, 30, 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33')
ON CONFLICT DO NOTHING;

-- Insert sample customers
INSERT INTO customers (
  first_name,
  last_name,
  email,
  phone,
  address,
  city,
  state,
  country,
  company_id,
  tenant_id,
  status,
  size,
  customer_type
) VALUES
('Alice', 'Johnson', 'alice.johnson@example.com', '+1-555-1001', '100 Main St', 'New York', 'NY', 'USA', (SELECT id FROM companies WHERE name = 'Demo Manufacturing Inc' LIMIT 1), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'active', 'medium', 'business'),
('Bob', 'Smith', 'bob.smith@example.com', '+1-555-1002', '200 Oak Ave', 'Los Angeles', 'CA', 'USA', (SELECT id FROM companies WHERE name = 'Acme Solutions Corp' LIMIT 1), 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22', 'prospect', 'small', 'business'),
('Carol', 'Williams', 'carol.williams@example.com', '+1-555-1003', '300 Pine Rd', 'Chicago', 'IL', 'USA', (SELECT id FROM companies WHERE name = 'Global Services Ltd' LIMIT 1), 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33', 'active', 'enterprise', 'business')
ON CONFLICT DO NOTHING;

-- Seed reference data defaults (industries, sizes, types, statuses, lead metadata)
WITH tenants AS (
  SELECT id
  FROM public.tenants
),
defaults AS (
  -- category, key, label, description, metadata_json, sort_order
  VALUES
    -- Industries
    ('industry', 'manufacturing', 'Manufacturing', 'Industrial & manufacturing businesses', '{"icon":"factory"}', 1),
    ('industry', 'technology', 'Technology', 'Software, hardware, and IT services', '{"icon":"laptop"}', 2),
    ('industry', 'finance', 'Financial Services', 'Banking, insurance, and fintech', '{"icon":"bank"}', 3),
    ('industry', 'healthcare', 'Healthcare', 'Medical providers and life sciences', '{"icon":"medical"}', 4),
    ('industry', 'retail', 'Retail & Consumer', 'Retail stores and consumer brands', '{"icon":"retail"}', 5),

    -- Company size
    ('company_size', 'startup', 'Startup (1-50)', 'Early-stage teams up to 50 employees', '{"minEmployees":1,"maxEmployees":50}', 1),
    ('company_size', 'small', 'Small (51-200)', 'Growing companies with 51-200 employees', '{"minEmployees":51,"maxEmployees":200}', 2),
    ('company_size', 'medium', 'Medium (201-1000)', 'Established companies with 201-1000 employees', '{"minEmployees":201,"maxEmployees":1000}', 3),
    ('company_size', 'enterprise', 'Enterprise (1000+)', 'Global enterprises with 1000+ employees', '{"minEmployees":1001}', 4),

    -- Customer type
    ('customer_type', 'business', 'Business', 'B2B customers and organizations', '{"icon":"building"}', 1),
    ('customer_type', 'individual', 'Individual', 'B2C customers and consumers', '{"icon":"user"}', 2),
    ('customer_type', 'government', 'Government / Public Sector', 'Agencies and government entities', '{"icon":"government"}', 3),

    -- Customer status
    ('customer_status', 'active', 'Active', 'Currently engaged customer', '{"emoji":"\uD83D\uDFE2","badgeColor":"green"}', 1),
    ('customer_status', 'prospect', 'Prospect', 'Pre-sales prospect under evaluation', '{"emoji":"\uD83D\uDD35","badgeColor":"blue"}', 2),
    ('customer_status', 'inactive', 'Inactive', 'Dormant customer with no recent activity', '{"emoji":"\u26AA","badgeColor":"default"}', 3),
    ('customer_status', 'suspended', 'Suspended', 'Temporarily blocked due to issues', '{"emoji":"\uD83D\uDD34","badgeColor":"red"}', 4),

    -- Lead source
    ('lead_source', 'referral', 'Referral', 'Brought in by an existing contact or client', '{"emoji":"\uD83E\uDD1D"}', 1),
    ('lead_source', 'website', 'Website', 'Captured from corporate website or landing page', '{"emoji":"\uD83C\uDF10"}', 2),
    ('lead_source', 'event', 'Event / Webinar', 'Generated from marketing events or webinars', '{"emoji":"\uD83C\uDFAF"}', 3),
    ('lead_source', 'email_campaign', 'Email Campaign', 'Marketing automation or newsletter response', '{"emoji":"\u2709"}', 4),
    ('lead_source', 'partner', 'Partner / Channel', 'Submitted by a channel or alliance partner', '{"emoji":"\uD83E\uDD1D"}', 5),

    -- Lead rating
    ('lead_rating', 'hot', 'Hot', 'High-intent lead ready for conversion', '{"emoji":"\uD83D\uDD25"}', 1),
    ('lead_rating', 'warm', 'Warm', 'Engaged lead that needs nurturing', '{"emoji":"\uD83C\uDF21"}', 2),
    ('lead_rating', 'cold', 'Cold', 'Low-engagement lead requiring long-term follow-up', '{"emoji":"\u2744"}', 3),
    ('lead_rating', 'nurture', 'Nurture', 'Long-term nurture program candidate', '{"emoji":"\uD83C\uDF31"}', 4)
)
INSERT INTO public.reference_data (
  id,
  tenant_id,
  category,
  key,
  label,
  description,
  metadata,
  sort_order,
  is_active,
  created_at,
  updated_at
)
SELECT
  uuid_generate_v4(),
  t.id,
  d.column1,
  d.column2,
  d.column3,
  d.column4,
  d.column5::jsonb,
  d.column6,
  true,
  NOW(),
  NOW()
FROM tenants t
CROSS JOIN defaults d
WHERE NOT EXISTS (
  SELECT 1
  FROM public.reference_data r
  WHERE r.tenant_id = t.id
    AND r.category = d.column1
    AND r.key = d.column2
);

-- Backfill customer display fields for seeded data
UPDATE customers c
SET company_name = comp.name,
    contact_name = TRIM(CONCAT_WS(' ', NULLIF(c.first_name, ''), NULLIF(c.last_name, ''))),
    industry = COALESCE(c.industry, 'General Business'),
    size = COALESCE(c.size, 'medium')
FROM companies comp
WHERE c.company_id = comp.id
  AND (c.company_name IS NULL OR c.contact_name IS NULL OR c.industry IS NULL OR c.size IS NULL);

-- Insert sample sales
INSERT INTO sales (customer_id, sale_date, total_amount, tax_amount, discount_amount, status, notes, tenant_id) VALUES
((SELECT id FROM customers WHERE email = 'alice.johnson@example.com' LIMIT 1), CURRENT_DATE - INTERVAL '30 days', 149.97, 0, 0, 'completed', 'Premium Widget Sale - First sale to new customer', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
((SELECT id FROM customers WHERE email = 'bob.smith@example.com' LIMIT 1), CURRENT_DATE - INTERVAL '15 days', 49.99, 0, 0, 'completed', 'Service Package Deal - Discount applied for loyalty', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'),
((SELECT id FROM customers WHERE email = 'carol.williams@example.com' LIMIT 1), CURRENT_DATE + INTERVAL '7 days', 179.98, 0, 0, 'pending', 'Tool Kit Purchase - Awaiting payment confirmation', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33')
ON CONFLICT DO NOTHING;

-- Insert sample sale items
INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price, tenant_id) VALUES
((SELECT id FROM sales WHERE notes ILIKE '%First sale%' LIMIT 1), (SELECT id FROM products WHERE code = 'WID-001' LIMIT 1), 3, 29.99, 89.97, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
((SELECT id FROM sales WHERE notes ILIKE '%First sale%' LIMIT 1), (SELECT id FROM products WHERE code = 'GAD-001' LIMIT 1), 2, 49.99, 99.98, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
((SELECT id FROM sales WHERE notes ILIKE '%Discount applied for loyalty%' LIMIT 1), (SELECT id FROM products WHERE code = 'SRV-001' LIMIT 1), 1, 49.99, 49.99, 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'),
((SELECT id FROM sales WHERE notes ILIKE '%Awaiting payment confirmation%' LIMIT 1), (SELECT id FROM products WHERE code = 'TOO-001' LIMIT 1), 2, 79.99, 159.98, 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33')
ON CONFLICT DO NOTHING;

-- Insert sample contracts
INSERT INTO contracts (customer_id, title, contract_type, start_date, end_date, total_value, status, terms, tenant_id) VALUES
((SELECT id FROM customers WHERE email = 'alice.johnson@example.com' LIMIT 1), 'Annual Maintenance Contract', 'service_agreement', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 2500.00, 'active', 'Standard maintenance terms apply', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
((SELECT id FROM customers WHERE email = 'bob.smith@example.com' LIMIT 1), 'Service Agreement 2025', 'service_agreement', CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months', 1200.00, 'draft', 'Custom service level agreement', 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'),
((SELECT id FROM customers WHERE email = 'carol.williams@example.com' LIMIT 1), 'Enterprise Support Contract', 'service_agreement', CURRENT_DATE, CURRENT_DATE + INTERVAL '2 years', 5000.00, 'active', '24/7 enterprise support included', 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33')
ON CONFLICT DO NOTHING;

-- Note: Service contracts require product_sale_id and product_id, skipping for now

-- Note: Job works require product_id and other fields, skipping for now

-- Insert sample tickets
INSERT INTO tickets (customer_id, title, description, category, priority, status, assigned_to, tenant_id) VALUES
((SELECT id FROM customers WHERE email = 'alice.johnson@example.com' LIMIT 1), 'Widget Malfunction', 'Premium widget stopped working after installation', 'technical', 'high', 'open', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
((SELECT id FROM customers WHERE email = 'bob.smith@example.com' LIMIT 1), 'Service Package Inquiry', 'Questions about service package features', 'sales', 'medium', 'in_progress', NULL, 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'),
((SELECT id FROM customers WHERE email = 'carol.williams@example.com' LIMIT 1), 'Billing Discrepancy', 'Invoice amount does not match agreed pricing', 'billing', 'high', 'resolved', NULL, 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33')
ON CONFLICT DO NOTHING;

INSERT INTO complaints (customer_id, title, description, type, priority, status, assigned_engineer_id, tenant_id) VALUES
((SELECT id FROM customers WHERE email = 'alice.johnson@example.com' LIMIT 1), 'Poor Installation Quality', 'Installation team was unprofessional and left mess', 'breakdown', 'medium', 'new', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
((SELECT id FROM customers WHERE email = 'bob.smith@example.com' LIMIT 1), 'Delayed Delivery', 'Service package delivery was 2 weeks late', 'preventive', 'low', 'in_progress', NULL, 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'),
((SELECT id FROM customers WHERE email = 'carol.williams@example.com' LIMIT 1), 'Product Defect', 'Tool kit arrived with missing components', 'optimize', 'high', 'closed', NULL, 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33')
ON CONFLICT DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, is_read, action_url, metadata, tenant_id) VALUES
((SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1), 'System Maintenance', 'Scheduled maintenance will occur tonight at 2 AM', 'system', false, '/maintenance', '{"maintenance_start": "2025-11-25T02:00:00Z"}', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
((SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1), 'New Customer Registration', 'Alice Johnson has registered as a new customer', 'user_action', false, '/customers/alice-johnson', '{"customer_id": "sample-id"}', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
((SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1), 'Contract Expiring Soon', 'Annual Maintenance Contract expires in 30 days', 'deadline_reminder', false, '/contracts/annual-maintenance', '{"days_remaining": 30}', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
ON CONFLICT DO NOTHING;
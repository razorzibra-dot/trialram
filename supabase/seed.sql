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
-- Insert default permissions
INSERT INTO permissions (name, description, resource, action, category) VALUES
-- User permissions
('users.read', 'View users', 'users', 'read', 'core'),
('users.create', 'Create users', 'users', 'create', 'core'),
('users.update', 'Update users', 'users', 'update', 'core'),
('users.delete', 'Delete users', 'users', 'delete', 'core'),

-- Customer permissions
('customers.read', 'View customers', 'customers', 'read', 'core'),
('customers.create', 'Create customers', 'customers', 'create', 'core'),
('customers.update', 'Update customers', 'customers', 'update', 'core'),
('customers.delete', 'Delete customers', 'customers', 'delete', 'core'),

-- Sales permissions
('sales.read', 'View sales', 'sales', 'read', 'core'),
('sales.create', 'Create sales', 'sales', 'create', 'core'),
('sales.update', 'Update sales', 'sales', 'update', 'core'),
('sales.delete', 'Delete sales', 'sales', 'delete', 'core'),

-- Ticket permissions
('tickets.read', 'View tickets', 'tickets', 'read', 'core'),
('tickets.create', 'Create tickets', 'tickets', 'create', 'core'),
('tickets.update', 'Update tickets', 'tickets', 'update', 'core'),
('tickets.delete', 'Delete tickets', 'tickets', 'delete', 'core'),

-- Contract permissions
('contracts.read', 'View contracts', 'contracts', 'read', 'core'),
('contracts.create', 'Create contracts', 'contracts', 'create', 'core'),
('contracts.update', 'Update contracts', 'contracts', 'update', 'core'),
('contracts.delete', 'Delete contracts', 'contracts', 'delete', 'core'),

-- Audit permissions
('audit.read', 'View audit logs', 'audit', 'read', 'core'),

-- Tenant permissions
('tenants.read', 'View tenants', 'tenants', 'read', 'admin'),
('tenants.create', 'Create tenants', 'tenants', 'create', 'admin'),
('tenants.update', 'Update tenants', 'tenants', 'update', 'admin'),
('tenants.delete', 'Delete tenants', 'tenants', 'delete', 'admin'),

-- Role permissions
('roles.read', 'View roles', 'roles', 'read', 'admin'),
('roles.create', 'Create roles', 'roles', 'create', 'admin'),
('roles.update', 'Update roles', 'roles', 'update', 'admin'),
('roles.delete', 'Delete roles', 'roles', 'delete', 'admin'),

-- Permission permissions
('permissions.read', 'View permissions', 'permissions', 'read', 'admin'),
('permissions.create', 'Create permissions', 'permissions', 'create', 'admin'),
('permissions.update', 'Update permissions', 'permissions', 'update', 'admin'),
('permissions.delete', 'Delete permissions', 'permissions', 'delete', 'admin')
ON CONFLICT (name) DO NOTHING;
-- Insert default roles for each tenant
-- ✅ Normalized role names to match UserRole enum exactly (no mapping needed)
INSERT INTO roles (name, description, tenant_id, is_system_role) VALUES
-- System roles (tenant_id will be set when tenant is created)
('super_admin', 'Super administrator with full system access', NULL, true),
('admin', 'Administrator with full tenant access', NULL, true),
('manager', 'Manager with departmental access', NULL, true),
('user', 'Standard user with limited access', NULL, true),
('engineer', 'Engineer with technical access', NULL, true),
('customer', 'Customer with read-only access', NULL, true),
('sales_rep', 'Sales representative', NULL, true),
('support_agent', 'Support agent', NULL, true),
('contract_manager', 'Contract manager', NULL, true)
ON CONFLICT DO NOTHING;
-- Tenants already seeded by isolated reset migration

-- Roles already seeded by isolated reset migration

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

INSERT INTO users (id, email, name, first_name, last_name, tenant_id, is_super_admin, status) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'superadmin@crm.com', 'Super Admin', 'Super', 'Admin', NULL, true, 'active')
ON CONFLICT (email) DO NOTHING;
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

INSERT INTO complaints (customer_id, title, description, complaint_type, severity, status, assigned_to, tenant_id) VALUES
((SELECT id FROM customers WHERE email = 'alice.johnson@example.com' LIMIT 1), 'Poor Installation Quality', 'Installation team was unprofessional and left mess', 'service_quality', 'medium', 'open', NULL, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
((SELECT id FROM customers WHERE email = 'bob.smith@example.com' LIMIT 1), 'Delayed Delivery', 'Service package delivery was 2 weeks late', 'delivery', 'low', 'in_progress', NULL, 'b1ffc999-9c0b-4ef8-bb6d-6bb9bd380a22'),
((SELECT id FROM customers WHERE email = 'carol.williams@example.com' LIMIT 1), 'Product Defect', 'Tool kit arrived with missing components', 'product_quality', 'high', 'resolved', NULL, 'c2eed999-9c0b-4ef8-bb6d-6bb9bd380a33')
ON CONFLICT DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, is_read, action_url, metadata, tenant_id) VALUES
((SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1), 'System Maintenance', 'Scheduled maintenance will occur tonight at 2 AM', 'system', false, '/maintenance', '{"maintenance_start": "2025-11-25T02:00:00Z"}', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
((SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1), 'New Customer Registration', 'Alice Johnson has registered as a new customer', 'user_action', false, '/customers/alice-johnson', '{"customer_id": "sample-id"}', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
((SELECT id FROM users WHERE email = 'superadmin@crm.com' LIMIT 1), 'Contract Expiring Soon', 'Annual Maintenance Contract expires in 30 days', 'deadline_reminder', false, '/contracts/annual-maintenance', '{"days_remaining": 30}', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
ON CONFLICT DO NOTHING;
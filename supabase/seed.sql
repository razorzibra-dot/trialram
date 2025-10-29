-- ============================================================================
-- SEED DATA - Development Test Data
-- ============================================================================

-- ============================================================================
-- 0. RESET DATA - Clear all tables before seeding
-- ============================================================================

-- Delete all data from tables (in reverse order of foreign keys)
DELETE FROM job_works;
DELETE FROM service_contracts;
DELETE FROM product_sales;
DELETE FROM customer_tag_mapping;
DELETE FROM contracts;
DELETE FROM sales;
DELETE FROM customers;
DELETE FROM customer_tags;
DELETE FROM products;
DELETE FROM product_categories;
DELETE FROM companies;
DELETE FROM users;
DELETE FROM tenants;

-- Reset sequences
ALTER SEQUENCE IF EXISTS tenants_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS companies_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS product_categories_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS customers_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS sales_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS contracts_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS product_sales_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS service_contracts_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS job_works_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS customer_tags_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS customer_tag_mapping_id_seq RESTART WITH 1;

-- ============================================================================
-- 1. TENANTS & USERS
-- ============================================================================

-- Insert test tenants
INSERT INTO tenants (id, name, domain, status, plan, created_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001'::UUID, 'Acme Corporation', 'acme-corp.local', 'active', 'enterprise', NOW()),
  ('550e8400-e29b-41d4-a716-446655440002'::UUID, 'Tech Solutions Inc', 'tech-solutions.local', 'active', 'premium', NOW()),
  ('550e8400-e29b-41d4-a716-446655440003'::UUID, 'Global Trading Ltd', 'global-trading.local', 'active', 'enterprise', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test users
INSERT INTO users (id, email, name, tenant_id, role, status, created_at, last_login)
VALUES
  -- Acme Corp Users
  ('a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID, 'admin@acme.com', 'Admin Acme', '550e8400-e29b-41d4-a716-446655440001'::UUID, 'admin', 'active', NOW(), NOW()),
  ('d078f352-e074-4b26-bd3d-94d5751aa50c'::UUID, 'manager@acme.com', 'Manager Acme', '550e8400-e29b-41d4-a716-446655440001'::UUID, 'manager', 'active', NOW(), NOW()),
  ('beac6dda-c64f-4341-9f35-12c19f519639'::UUID, 'engineer@acme.com', 'Engineer Acme', '550e8400-e29b-41d4-a716-446655440001'::UUID, 'engineer', 'active', NOW(), NOW()),
  ('c0885ddd-4d5f-4be6-b717-527d385a2c07'::UUID, 'user@acme.com', 'User Acme', '550e8400-e29b-41d4-a716-446655440001'::UUID, 'agent', 'active', NOW(), NOW()),
  
  -- Tech Solutions Users
  ('e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID, 'admin@techsolutions.com', 'Admin Tech', '550e8400-e29b-41d4-a716-446655440002'::UUID, 'admin', 'active', NOW(), NOW()),
  ('e7b329f4-6a50-4ea7-97eb-aec2d0e6565b'::UUID, 'manager@techsolutions.com', 'Manager Tech', '550e8400-e29b-41d4-a716-446655440002'::UUID, 'manager', 'active', NOW(), NOW()),
  
  -- Global Trading Users
  ('bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID, 'admin@globaltrading.com', 'Admin Global', '550e8400-e29b-41d4-a716-446655440003'::UUID, 'admin', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 2. MASTER DATA - COMPANIES
-- ============================================================================

INSERT INTO companies (id, tenant_id, name, address, phone, email, industry, status, created_at)
VALUES
  ('750e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'Acme Manufacturing Unit', '123 Industrial Park, New York', '+1-212-555-0001', 'manufacturing@acme.com', 'Manufacturing', 'active', NOW()),
  ('750e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'Acme Sales Division', '456 Commerce Street, Los Angeles', '+1-213-555-0002', 'sales@acme.com', 'Sales', 'active', NOW()),
  ('750e8400-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'Tech Solutions HQ', '789 Silicon Valley, San Jose', '+1-408-555-0003', 'info@techsolutions.com', 'Technology', 'active', NOW()),
  ('750e8400-e29b-41d4-a716-446655440004'::UUID, '550e8400-e29b-41d4-a716-446655440003'::UUID, 'Global Trading HQ', '321 Trade Center, Singapore', '+65-6555-0004', 'contact@globaltrading.com', 'Trading', 'active', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. PRODUCT CATEGORIES & PRODUCTS
-- ============================================================================

-- Insert product categories
INSERT INTO product_categories (id, tenant_id, name, description, created_at)
VALUES
  ('850e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'Electronics', 'Electronic components and devices', NOW()),
  ('850e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'Machinery', 'Industrial machinery and equipment', NOW()),
  ('850e8400-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'Services', 'Professional services', NOW()),
  ('850e8400-e29b-41d4-a716-446655440004'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'Software', 'Software products and licenses', NOW()),
  ('850e8400-e29b-41d4-a716-446655440005'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'Consulting', 'Consulting services', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert products
INSERT INTO products (id, tenant_id, category_id, name, sku, price, currency, status, created_at)
VALUES
  ('950e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, '850e8400-e29b-41d4-a716-446655440001'::UUID, 'Industrial Control Module', 'ICM-2024-001', 5000.00, 'USD', 'active', NOW()),
  ('950e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, '850e8400-e29b-41d4-a716-446655440001'::UUID, 'Sensor Array Kit', 'SAK-2024-001', 3500.00, 'USD', 'active', NOW()),
  ('950e8400-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, '850e8400-e29b-41d4-a716-446655440002'::UUID, 'Hydraulic Press Machine', 'HPM-2024-001', 75000.00, 'USD', 'active', NOW()),
  ('950e8400-e29b-41d4-a716-446655440004'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, '850e8400-e29b-41d4-a716-446655440003'::UUID, 'Installation & Setup Service', 'INST-2024-001', 250.00, 'USD', 'active', NOW()),
  ('950e8400-e29b-41d4-a716-446655440005'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, '850e8400-e29b-41d4-a716-446655440004'::UUID, 'Enterprise CRM License', 'CRM-ENT-2024', 15000.00, 'USD', 'active', NOW()),
  ('950e8400-e29b-41d4-a716-446655440006'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, '850e8400-e29b-41d4-a716-446655440005'::UUID, 'Business Consulting', 'CONS-2024-001', 3000.00, 'USD', 'active', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. CUSTOMERS
-- ============================================================================

INSERT INTO customers (id, tenant_id, company_name, contact_name, email, phone, city, country, industry, status, customer_type, created_at)
VALUES
  ('a50e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'ABC Manufacturing', 'John Smith', 'contact@abcmfg.com', '+1-310-555-0101', 'Chicago', 'USA', 'Manufacturing', 'active', 'business', NOW()),
  ('a50e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'XYZ Logistics', 'Sarah Johnson', 'info@xyzlog.com', '+1-312-555-0102', 'Houston', 'USA', 'Logistics', 'active', 'business', NOW()),
  ('a50e8400-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'Summit Industries', 'Mike Chen', 'sales@summit.com', '+1-415-555-0103', 'San Francisco', 'USA', 'Manufacturing', 'active', 'enterprise', NOW()),
  ('a50e8400-e29b-41d4-a716-446655440004'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'Innovation Labs', 'Emily Davis', 'hello@innovlabs.com', '+1-650-555-0201', 'Mountain View', 'USA', 'Technology', 'active', 'business', NOW()),
  ('a50e8400-e29b-41d4-a716-446655440005'::UUID, '550e8400-e29b-41d4-a716-446655440003'::UUID, 'Eastern Traders', 'David Wong', 'business@easterntraders.com', '+65-6555-0301', 'Singapore', 'Singapore', 'Trading', 'active', 'enterprise', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. SALES
-- ============================================================================

INSERT INTO sales (id, tenant_id, customer_id, customer_name, title, value, amount, stage, status, created_at)
VALUES
  ('b50e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'a50e8400-e29b-41d4-a716-446655440001'::UUID, 'ABC Manufacturing', 'Control Module Supply', 10000.00, 10000.00, 'closed_won', 'won', NOW()),
  ('b50e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'a50e8400-e29b-41d4-a716-446655440002'::UUID, 'XYZ Logistics', 'Hydraulic Press Installation', 85000.00, 85000.00, 'closed_won', 'won', NOW()),
  ('b50e8400-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'a50e8400-e29b-41d4-a716-446655440004'::UUID, 'Innovation Labs', 'CRM License Deal', 20000.00, 20000.00, 'proposal', 'open', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. CONTRACTS
-- ============================================================================

INSERT INTO contracts (id, tenant_id, contract_number, title, type, customer_id, value, total_value, start_date, end_date, status, created_at)
VALUES
  ('f50e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'CNT-2024-001', 'Equipment Supply Agreement', 'purchase_order'::contract_type, 'a50e8400-e29b-41d4-a716-446655440001'::UUID, 150000.00, 150000.00, NOW()::DATE, (NOW() + INTERVAL '1 year')::DATE, 'active'::contract_status, NOW()),
  ('f50e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'CNT-2024-002', 'Maintenance & Support Agreement', 'service_agreement'::contract_type, 'a50e8400-e29b-41d4-a716-446655440002'::UUID, 50000.00, 50000.00, (NOW() - INTERVAL '3 months')::DATE, (NOW() + INTERVAL '9 months')::DATE, 'active'::contract_status, NOW() - INTERVAL '3 months'),
  ('f50e8400-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'CNT-2024-003', 'Software License Agreement', 'custom'::contract_type, 'a50e8400-e29b-41d4-a716-446655440004'::UUID, 45000.00, 45000.00, NOW()::DATE, (NOW() + INTERVAL '1 year')::DATE, 'pending_approval'::contract_status, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6B. PRODUCT SALES (Required for Service Contracts)
-- ============================================================================

INSERT INTO product_sales (id, tenant_id, customer_id, customer_name, product_id, product_name, units, cost_per_unit, total_cost, delivery_date, warranty_expiry, status, created_at)
VALUES
  ('d50e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'a50e8400-e29b-41d4-a716-446655440001'::UUID, 'ABC Manufacturing', '950e8400-e29b-41d4-a716-446655440003'::UUID, 'Hydraulic Press Machine', 1.00, 75000.00, 75000.00, (NOW() - INTERVAL '3 months')::DATE, (NOW() + INTERVAL '9 months')::DATE, 'new'::product_sale_status, NOW() - INTERVAL '3 months'),
  ('d50e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'a50e8400-e29b-41d4-a716-446655440002'::UUID, 'XYZ Logistics', '950e8400-e29b-41d4-a716-446655440002'::UUID, 'Sensor Array Kit', 2.00, 3500.00, 7000.00, (NOW() - INTERVAL '2 months')::DATE, (NOW() + INTERVAL '10 months')::DATE, 'new'::product_sale_status, NOW() - INTERVAL '2 months'),
  ('d50e8400-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'a50e8400-e29b-41d4-a716-446655440004'::UUID, 'Innovation Labs', '950e8400-e29b-41d4-a716-446655440005'::UUID, 'Enterprise CRM License', 1.00, 15000.00, 15000.00, (NOW() - INTERVAL '6 months')::DATE, (NOW() + INTERVAL '6 months')::DATE, 'expired'::product_sale_status, NOW() - INTERVAL '6 months')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. SERVICE CONTRACTS
-- ============================================================================

INSERT INTO service_contracts (id, tenant_id, product_sale_id, contract_number, customer_id, customer_name, product_id, product_name, start_date, end_date, contract_value, annual_value, status, service_level, created_at)
VALUES
  ('c50e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'd50e8400-e29b-41d4-a716-446655440001'::UUID, 'SRVCT-2024-001', 'a50e8400-e29b-41d4-a716-446655440001'::UUID, 'ABC Manufacturing', '950e8400-e29b-41d4-a716-446655440003'::UUID, 'Hydraulic Press Machine', (NOW() - INTERVAL '2 months')::DATE, (NOW() + INTERVAL '10 months')::DATE, 60000.00, 60000.00, 'active'::service_contract_status, 'premium'::service_level, NOW() - INTERVAL '2 months'),
  ('c50e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'd50e8400-e29b-41d4-a716-446655440002'::UUID, 'SRVCT-2024-002', 'a50e8400-e29b-41d4-a716-446655440002'::UUID, 'XYZ Logistics', '950e8400-e29b-41d4-a716-446655440002'::UUID, 'Sensor Array Kit', NOW()::DATE, (NOW() + INTERVAL '1 year')::DATE, 12000.00, 12000.00, 'active'::service_contract_status, 'standard'::service_level, NOW()),
  ('c50e8400-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'd50e8400-e29b-41d4-a716-446655440003'::UUID, 'SRVCT-2024-003', 'a50e8400-e29b-41d4-a716-446655440004'::UUID, 'Innovation Labs', '950e8400-e29b-41d4-a716-446655440005'::UUID, 'Enterprise CRM License', (NOW() - INTERVAL '6 months')::DATE, (NOW() + INTERVAL '6 months')::DATE, 18000.00, 18000.00, 'expired'::service_contract_status, 'enterprise'::service_level, NOW() - INTERVAL '6 months')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. JOB WORKS
-- ============================================================================

INSERT INTO job_works (id, tenant_id, customer_id, customer_name, job_ref_id, product_id, product_name, pieces, size, base_price, default_price, final_price, status, priority, due_date, created_at)
VALUES
  ('e50e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'a50e8400-e29b-41d4-a716-446655440001'::UUID, 'ABC Manufacturing', 'JOB-2024-001', '950e8400-e29b-41d4-a716-446655440003'::UUID, 'Hydraulic Press Machine', 1.00, 'Large', 75000.00, 75000.00, 75000.00, 'in_progress'::job_work_status, 'high'::job_work_priority, (NOW() + INTERVAL '7 days')::DATE, NOW()),
  ('e50e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'a50e8400-e29b-41d4-a716-446655440003'::UUID, 'Summit Industries', 'JOB-2024-002', '950e8400-e29b-41d4-a716-446655440002'::UUID, 'Sensor Array Kit', 5.00, 'Medium', 3500.00, 3500.00, 17500.00, 'pending'::job_work_status, 'medium'::job_work_priority, (NOW() + INTERVAL '14 days')::DATE, NOW()),
  ('e50e8400-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'a50e8400-e29b-41d4-a716-446655440002'::UUID, 'XYZ Logistics', 'JOB-2024-003', '950e8400-e29b-41d4-a716-446655440001'::UUID, 'Industrial Control Module', 10.00, 'Small', 5000.00, 5000.00, 50000.00, 'completed'::job_work_status, 'low'::job_work_priority, (NOW() - INTERVAL '3 days')::DATE, NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. RBAC - PERMISSIONS
-- ============================================================================

INSERT INTO permissions (id, name, description, resource, action)
VALUES
  -- Dashboard & View permissions
  ('00000000-0000-0000-0000-000000000001'::UUID, 'view_dashboard', 'View dashboard and analytics', 'dashboard', 'view'),
  
  -- Customer Management
  ('00000000-0000-0000-0000-000000000101'::UUID, 'view_customers', 'View customer data', 'customers', 'view'),
  ('00000000-0000-0000-0000-000000000102'::UUID, 'create_customers', 'Create new customers', 'customers', 'create'),
  ('00000000-0000-0000-0000-000000000103'::UUID, 'edit_customers', 'Edit customer information', 'customers', 'edit'),
  ('00000000-0000-0000-0000-000000000104'::UUID, 'delete_customers', 'Delete customers', 'customers', 'delete'),
  ('00000000-0000-0000-0000-000000000105'::UUID, 'manage_customers', 'Full customer management', 'customers', 'manage'),
  
  -- Sales Management
  ('00000000-0000-0000-0000-000000000201'::UUID, 'view_sales', 'View sales records', 'sales', 'view'),
  ('00000000-0000-0000-0000-000000000202'::UUID, 'create_sales', 'Create sales records', 'sales', 'create'),
  ('00000000-0000-0000-0000-000000000203'::UUID, 'edit_sales', 'Edit sales records', 'sales', 'edit'),
  ('00000000-0000-0000-0000-000000000204'::UUID, 'manage_sales', 'Full sales management', 'sales', 'manage'),
  
  -- Tickets Management
  ('00000000-0000-0000-0000-000000000301'::UUID, 'view_tickets', 'View support tickets', 'tickets', 'view'),
  ('00000000-0000-0000-0000-000000000302'::UUID, 'create_tickets', 'Create support tickets', 'tickets', 'create'),
  ('00000000-0000-0000-0000-000000000303'::UUID, 'edit_tickets', 'Edit support tickets', 'tickets', 'edit'),
  ('00000000-0000-0000-0000-000000000304'::UUID, 'manage_tickets', 'Full ticket management', 'tickets', 'manage'),
  
  -- Contracts Management
  ('00000000-0000-0000-0000-000000000401'::UUID, 'view_contracts', 'View contracts', 'contracts', 'view'),
  ('00000000-0000-0000-0000-000000000402'::UUID, 'create_contracts', 'Create contracts', 'contracts', 'create'),
  ('00000000-0000-0000-0000-000000000403'::UUID, 'edit_contracts', 'Edit contracts', 'contracts', 'edit'),
  ('00000000-0000-0000-0000-000000000404'::UUID, 'manage_contracts', 'Full contract management', 'contracts', 'manage'),
  
  -- Service Contracts
  ('00000000-0000-0000-0000-000000000501'::UUID, 'view_service_contracts', 'View service contracts', 'service_contracts', 'view'),
  ('00000000-0000-0000-0000-000000000502'::UUID, 'manage_service_contracts', 'Manage service contracts', 'service_contracts', 'manage'),
  
  -- Product Management
  ('00000000-0000-0000-0000-000000000601'::UUID, 'view_products', 'View products', 'products', 'view'),
  ('00000000-0000-0000-0000-000000000602'::UUID, 'manage_products', 'Manage products and catalog', 'products', 'manage'),
  
  -- Product Sales
  ('00000000-0000-0000-0000-000000000701'::UUID, 'view_product_sales', 'View product sales', 'product_sales', 'view'),
  ('00000000-0000-0000-0000-000000000702'::UUID, 'manage_product_sales', 'Manage product sales', 'product_sales', 'manage'),
  
  -- Complaints Management
  ('00000000-0000-0000-0000-000000000801'::UUID, 'view_complaints', 'View complaints', 'complaints', 'view'),
  ('00000000-0000-0000-0000-000000000802'::UUID, 'manage_complaints', 'Manage complaints', 'complaints', 'manage'),
  
  -- Job Works
  ('00000000-0000-0000-0000-000000000901'::UUID, 'view_job_works', 'View job works', 'job_works', 'view'),
  ('00000000-0000-0000-0000-000000000902'::UUID, 'manage_job_works', 'Manage job works', 'job_works', 'manage'),
  
  -- Administrative
  ('00000000-0000-0000-0000-000000001001'::UUID, 'manage_users', 'Manage user accounts', 'users', 'manage'),
  ('00000000-0000-0000-0000-000000001002'::UUID, 'manage_roles', 'Manage roles and permissions', 'roles', 'manage'),
  ('00000000-0000-0000-0000-000000001003'::UUID, 'view_reports', 'View reports and analytics', 'reports', 'view'),
  ('00000000-0000-0000-0000-000000001004'::UUID, 'export_data', 'Export data', 'data', 'export'),
  ('00000000-0000-0000-0000-000000001005'::UUID, 'manage_settings', 'Manage system settings', 'settings', 'manage'),
  ('00000000-0000-0000-0000-000000001006'::UUID, 'manage_companies', 'Manage company information', 'companies', 'manage')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 10. RBAC - ROLES (Default roles for each tenant)
-- ============================================================================

-- Acme Corporation Roles
INSERT INTO roles (id, name, description, tenant_id, is_system_role, created_by)
VALUES
  ('10000000-0000-0000-0000-000000000001'::UUID, 'Administrator', 'Full administrative access to tenant', '550e8400-e29b-41d4-a716-446655440001'::UUID, true, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, 'Manager', 'Business operations manager', '550e8400-e29b-41d4-a716-446655440001'::UUID, true, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000003'::UUID, 'Agent', 'Customer service agent', '550e8400-e29b-41d4-a716-446655440001'::UUID, true, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000004'::UUID, 'Engineer', 'Technical engineer', '550e8400-e29b-41d4-a716-446655440001'::UUID, true, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),

-- Tech Solutions Roles
  ('10000000-0000-0000-0000-000000000005'::UUID, 'Administrator', 'Full administrative access to tenant', '550e8400-e29b-41d4-a716-446655440002'::UUID, true, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, 'Manager', 'Business operations manager', '550e8400-e29b-41d4-a716-446655440002'::UUID, true, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),

-- Global Trading Roles
  ('10000000-0000-0000-0000-000000000007'::UUID, 'Administrator', 'Full administrative access to tenant', '550e8400-e29b-41d4-a716-446655440003'::UUID, true, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 11. RBAC - ROLE PERMISSIONS (Map permissions to roles)
-- ============================================================================

-- Admin Role Permissions (Acme Corporation)
INSERT INTO role_permissions (role_id, permission_id, granted_by) -- Fixed: using actual user UUIDs
VALUES
  -- Admin has all permissions
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000101'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000102'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000103'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000104'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000105'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000201'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000202'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000203'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000204'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000301'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000302'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000303'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000304'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000401'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000402'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000403'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000404'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000501'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000502'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000601'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000602'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000701'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000702'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000801'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000802'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000901'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000902'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000001001'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000001002'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000001003'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000001004'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000001005'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000001006'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),

-- Manager Role Permissions (Acme Corporation)
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000101'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000102'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000103'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000201'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000202'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000203'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000301'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000302'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000303'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000401'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000402'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000403'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000501'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000502'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000601'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000701'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000702'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000001003'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),

-- Agent Role Permissions (Acme Corporation)
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000101'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000102'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000103'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000301'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000302'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000303'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000801'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000802'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),

-- Engineer Role Permissions (Acme Corporation)
  ('10000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000601'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000602'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000701'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000702'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000901'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000902'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),
  ('10000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000301'::UUID, 'a3c91c65-343d-4ff4-b9ab-f36adb371495'::UUID),

-- Tech Solutions - Admin Role Permissions
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000101'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000102'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000103'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000104'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000105'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000201'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000202'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000203'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000204'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000301'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000302'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000303'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000304'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000401'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000402'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000403'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000404'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000501'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000502'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000601'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000602'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000701'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000702'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000801'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000802'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000901'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000902'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000001001'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000001002'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000001003'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000001004'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000001005'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000001006'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),

-- Tech Solutions - Manager Role Permissions
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000101'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000102'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000103'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000201'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000202'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000203'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000301'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000302'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000303'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000401'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000402'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000403'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000501'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000502'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000601'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000701'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000702'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000001003'::UUID, 'e7bf21ab-b09f-450c-a389-081c1f8179b4'::UUID),

-- Global Trading - Admin Role Permissions
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000101'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000102'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000103'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000104'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000105'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000201'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000202'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000203'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000204'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000301'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000302'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000303'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000304'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000401'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000402'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000403'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000404'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000501'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000502'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000601'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000602'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000701'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000702'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000801'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000802'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000901'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000902'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000001001'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000001002'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000001003'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000001004'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000001005'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000001006'::UUID, 'bedef1ef-6595-43f6-bb68-0acbba97e151'::UUID)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- 12. CUSTOMER TAGS (NEW - After Migration 008)
-- ============================================================================

INSERT INTO customer_tags (id, tenant_id, name, color, created_at)
VALUES
  -- Acme Corporation Tags
  ('f60e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'Priority', '#FF4D4F', NOW()),
  ('f60e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'VIP', '#13C2C2', NOW()),
  ('f60e8400-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'Enterprise', '#1890FF', NOW()),
  ('f60e8400-e29b-41d4-a716-446655440004'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'Inactive', '#BFBFBF', NOW()),
  
  -- Tech Solutions Tags
  ('f60e8400-e29b-41d4-a716-446655440005'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'Strategic Partner', '#FAAD14', NOW()),
  ('f60e8400-e29b-41d4-a716-446655440006'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'Prospect', '#722ED1', NOW()),
  
  -- Global Trading Tags
  ('f60e8400-e29b-41d4-a716-446655440007'::UUID, '550e8400-e29b-41d4-a716-446655440003'::UUID, 'Long-term', '#52C41A', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 13. CUSTOMER TAG MAPPINGS (LINKING TAGS TO CUSTOMERS)
-- ============================================================================

INSERT INTO customer_tag_mapping (id, customer_id, tag_id, created_at)
VALUES
  -- ABC Manufacturing - Priority, Enterprise
  ('e60e8400-e29b-41d4-a716-446655440001'::UUID, 'a50e8400-e29b-41d4-a716-446655440001'::UUID, 'f60e8400-e29b-41d4-a716-446655440001'::UUID, NOW()),
  ('e60e8400-e29b-41d4-a716-446655440002'::UUID, 'a50e8400-e29b-41d4-a716-446655440001'::UUID, 'f60e8400-e29b-41d4-a716-446655440003'::UUID, NOW()),
  
  -- XYZ Logistics - VIP
  ('e60e8400-e29b-41d4-a716-446655440003'::UUID, 'a50e8400-e29b-41d4-a716-446655440002'::UUID, 'f60e8400-e29b-41d4-a716-446655440002'::UUID, NOW()),
  
  -- Summit Industries - Enterprise
  ('e60e8400-e29b-41d4-a716-446655440004'::UUID, 'a50e8400-e29b-41d4-a716-446655440003'::UUID, 'f60e8400-e29b-41d4-a716-446655440003'::UUID, NOW()),
  
  -- Innovation Labs - Prospect
  ('e60e8400-e29b-41d4-a716-446655440005'::UUID, 'a50e8400-e29b-41d4-a716-446655440004'::UUID, 'f60e8400-e29b-41d4-a716-446655440006'::UUID, NOW()),
  
  -- Eastern Traders - Long-term
  ('e60e8400-e29b-41d4-a716-446655440006'::UUID, 'a50e8400-e29b-41d4-a716-446655440005'::UUID, 'f60e8400-e29b-41d4-a716-446655440007'::UUID, NOW())
ON CONFLICT (customer_id, tag_id) DO NOTHING;

-- ============================================================================
-- 14. ROLES - CREATE SYSTEM ROLES FOR EACH TENANT
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
-- 15. USER ROLE ASSIGNMENTS - ASSIGN USERS TO ROLES
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
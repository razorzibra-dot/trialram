-- ============================================================================
-- SEED DATA - Development Test Data
-- ============================================================================

-- ============================================================================
-- 0. RESET DATA - Clear all tables before seeding
-- ============================================================================

-- Delete all data from tables (in reverse order of foreign keys)
DELETE FROM super_user_impersonation_logs;
DELETE FROM super_user_tenant_access;
DELETE FROM tenant_statistics;
DELETE FROM tenant_config_overrides;
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
-- IMPORTANT: is_super_admin must be explicitly set to false for regular users per constraint ck_super_admin_role_consistency
INSERT INTO users (id, email, name, tenant_id, role, status, is_super_admin, created_at, last_login)
VALUES
  -- Acme Corp Users (Tenant-scoped regular users)
  ('5278ae57-db79-4120-b285-6a2082779b0c'::UUID, 'admin@acme.com', 'Admin Acme', '550e8400-e29b-41d4-a716-446655440001'::UUID, 'admin', 'active', FALSE, NOW(), NOW()),
  ('92ec9125-1dae-44c4-abc8-a2ba741a6f3b'::UUID, 'manager@acme.com', 'Manager Acme', '550e8400-e29b-41d4-a716-446655440001'::UUID, 'manager', 'active', FALSE, NOW(), NOW()),
  ('b1010925-d7ac-40ed-851a-f27d2dce6b9b'::UUID, 'engineer@acme.com', 'Engineer Acme', '550e8400-e29b-41d4-a716-446655440001'::UUID, 'engineer', 'active', FALSE, NOW(), NOW()),
  ('74c70038-a4b0-4fc1-a0b7-ac9dbba6734a'::UUID, 'user@acme.com', 'User Acme', '550e8400-e29b-41d4-a716-446655440001'::UUID, 'agent', 'active', FALSE, NOW(), NOW()),
  
  -- Tech Solutions Users (Tenant-scoped regular users)
  ('15372c20-b39b-4475-b579-7f5929c891e9'::UUID, 'admin@techsolutions.com', 'Admin Tech', '550e8400-e29b-41d4-a716-446655440002'::UUID, 'admin', 'active', FALSE, NOW(), NOW()),
  ('ca9c1627-17b7-49b8-8b1b-7ba69308850f'::UUID, 'manager@techsolutions.com', 'Manager Tech', '550e8400-e29b-41d4-a716-446655440002'::UUID, 'manager', 'active', FALSE, NOW(), NOW()),
  
  -- Global Trading Users (Tenant-scoped regular users)
  ('2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID, 'admin@globaltrading.com', 'Admin Global', '550e8400-e29b-41d4-a716-446655440003'::UUID, 'admin', 'active', FALSE, NOW(), NOW()),
  
  -- Platform Super Administrators (Tenant-independent, for global management)
  -- IMPORTANT: Super admins must have role='super_admin', is_super_admin=true, and tenant_id=NULL per constraint
  ('4e0f4f70-73c7-45ac-a948-6ba225ca36d0'::UUID, 'superuser1@platform.admin', 'Super User 1', NULL::UUID, 'super_admin', 'active', TRUE, NOW(), NOW()),
  ('b4c9831c-4be7-4f28-b4b5-37a9a230084d'::UUID, 'superuser2@platform.admin', 'Super User 2', NULL::UUID, 'super_admin', 'active', TRUE, NOW(), NOW()),
  ('0cfdd140-593b-4750-9745-6a1e60a1e7bd'::UUID, 'superuser.auditor@platform.admin', 'Super User Auditor', NULL::UUID, 'super_admin', 'active', TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 1B. VERIFY SUPER ADMINISTRATORS
-- ============================================================================
-- Show all super administrators (tenant-independent users with global access)

-- Verification: Show super administrators
SELECT email, is_super_admin, tenant_id, role 
FROM users 
WHERE is_super_admin = true
ORDER BY email;


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

INSERT INTO sales (id, tenant_id, customer_id, title, value, stage, status, created_at)
VALUES
  ('b50e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'a50e8400-e29b-41d4-a716-446655440001'::UUID, 'Control Module Supply', 10000.00, 'closed_won', 'won', NOW()),
  ('b50e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'a50e8400-e29b-41d4-a716-446655440002'::UUID, 'Hydraulic Press Installation', 85000.00, 'closed_won', 'won', NOW()),
  ('b50e8400-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'a50e8400-e29b-41d4-a716-446655440004'::UUID, 'CRM License Deal', 20000.00, 'proposal', 'open', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. CONTRACTS
-- ============================================================================

INSERT INTO contracts (id, tenant_id, contract_number, title, type, customer_id, value, start_date, end_date, status, created_at)
VALUES
  ('f50e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'CNT-2024-001', 'Equipment Supply Agreement', 'purchase_order'::contract_type, 'a50e8400-e29b-41d4-a716-446655440001'::UUID, 150000.00, NOW()::DATE, (NOW() + INTERVAL '1 year')::DATE, 'active'::contract_status, NOW()),
  ('f50e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'CNT-2024-002', 'Maintenance & Support Agreement', 'service_agreement'::contract_type, 'a50e8400-e29b-41d4-a716-446655440002'::UUID, 50000.00, (NOW() - INTERVAL '3 months')::DATE, (NOW() + INTERVAL '9 months')::DATE, 'active'::contract_status, NOW() - INTERVAL '3 months'),
  ('f50e8400-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'CNT-2024-003', 'Software License Agreement', 'custom'::contract_type, 'a50e8400-e29b-41d4-a716-446655440004'::UUID, 45000.00, NOW()::DATE, (NOW() + INTERVAL '1 year')::DATE, 'pending_approval'::contract_status, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6B. PRODUCT SALES (Required for Service Contracts)
-- ============================================================================

INSERT INTO product_sales (id, tenant_id, customer_id, product_id, units, cost_per_unit, total_cost, delivery_date, warranty_expiry, status, created_at)
VALUES
  ('d50e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'a50e8400-e29b-41d4-a716-446655440001'::UUID, '950e8400-e29b-41d4-a716-446655440003'::UUID, 1.00, 75000.00, 75000.00, (NOW() - INTERVAL '3 months')::DATE, (NOW() + INTERVAL '9 months')::DATE, 'new'::product_sale_status, NOW() - INTERVAL '3 months'),
  ('d50e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'a50e8400-e29b-41d4-a716-446655440002'::UUID, '950e8400-e29b-41d4-a716-446655440002'::UUID, 2.00, 3500.00, 7000.00, (NOW() - INTERVAL '2 months')::DATE, (NOW() + INTERVAL '10 months')::DATE, 'new'::product_sale_status, NOW() - INTERVAL '2 months'),
  ('d50e8400-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'a50e8400-e29b-41d4-a716-446655440004'::UUID, '950e8400-e29b-41d4-a716-446655440005'::UUID, 1.00, 15000.00, 15000.00, (NOW() - INTERVAL '6 months')::DATE, (NOW() + INTERVAL '6 months')::DATE, 'expired'::product_sale_status, NOW() - INTERVAL '6 months')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. SERVICE CONTRACTS (New Enterprise Schema)
-- ============================================================================

INSERT INTO service_contracts (
  id, tenant_id, contract_number, title, description, customer_id,
  product_id, service_type, status, priority, value, currency,
  billing_frequency, start_date, end_date, auto_renew, renewal_period_months,
  sla_terms, service_scope, created_at
)
VALUES
  ('c50e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 
   'SVC-2025-001', 'Premium Support Contract', 'Comprehensive 24/7 support services',
   'a50e8400-e29b-41d4-a716-446655440001'::UUID,
   '950e8400-e29b-41d4-a716-446655440003'::UUID,
   'support', 'active', 'high', 24000.00, 'USD', 'monthly',
   (NOW() - INTERVAL '2 months')::DATE, (NOW() + INTERVAL '10 months')::DATE, TRUE, 12,
   '24/7 support with 4-hour response time for critical issues',
   'Includes email, phone, and chat support', NOW() - INTERVAL '2 months'),
   
  ('c50e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID,
   'SVC-2025-002', 'Maintenance & Support', 'Scheduled maintenance and technical support',
   'a50e8400-e29b-41d4-a716-446655440002'::UUID,
   '950e8400-e29b-41d4-a716-446655440002'::UUID,
   'maintenance', 'active', 'medium', 12000.00, 'USD', 'quarterly',
   NOW()::DATE, (NOW() + INTERVAL '1 year')::DATE, TRUE, 12,
   'Quarterly maintenance with 48-hour response time',
   'Includes preventive maintenance and repairs', NOW()),
   
  ('c50e8400-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID,
   'SVC-2025-003', 'Consulting Services', 'Strategic business consulting engagement',
   'a50e8400-e29b-41d4-a716-446655440004'::UUID,
   '950e8400-e29b-41d4-a716-446655440005'::UUID,
   'consulting', 'expired', 'low', 18000.00, 'USD', 'one_time',
   (NOW() - INTERVAL '6 months')::DATE, (NOW() + INTERVAL '6 months')::DATE, FALSE, NULL,
   'On-demand consulting with dedicated account manager',
   'Includes strategic analysis and recommendations', NOW() - INTERVAL '6 months')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7B. SERVICE CONTRACT DOCUMENTS
-- ============================================================================

INSERT INTO service_contract_documents (
  id, tenant_id, service_contract_id, file_name, file_type, file_size,
  file_path, document_type, uploaded_by_name, description, version_number, created_at
)
VALUES
  ('d60e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID,
   'c50e8400-e29b-41d4-a716-446655440001'::UUID, 'SLA-Premium-Support-v1.pdf', 'pdf', 245000,
   '/contracts/SVC-2025-001/sla.pdf', 'sla_document', 'Admin Acme', 'Premium support SLA terms', 1, NOW()),
  
  ('d60e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID,
   'c50e8400-e29b-41d4-a716-446655440001'::UUID, 'Service-Schedule-2025.xlsx', 'xlsx', 128000,
   '/contracts/SVC-2025-001/schedule.xlsx', 'schedule', 'Admin Acme', 'Annual service schedule', 1, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7C. SERVICE DELIVERY MILESTONES
-- ============================================================================

INSERT INTO service_delivery_milestones (
  id, tenant_id, service_contract_id, milestone_name, description,
  sequence_number, planned_date, deliverable_description,
  status, completion_percentage, assigned_to_name, notes, created_at
)
VALUES
  ('e70e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID,
   'c50e8400-e29b-41d4-a716-446655440001'::UUID, 'System Setup', 'Initial system deployment and configuration',
   1, NOW()::DATE, 'Production environment ready', 'completed', 100, 'Engineer Acme',
   'Completed ahead of schedule', NOW() - INTERVAL '1 month'),
   
  ('e70e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID,
   'c50e8400-e29b-41d4-a716-446655440001'::UUID, 'User Training', 'Comprehensive user training program',
   2, (NOW() + INTERVAL '30 days')::DATE, 'All users trained and certified',
   'in_progress', 75, 'Manager Acme', 'Training sessions ongoing', NOW()),
   
  ('e70e8400-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID,
   'c50e8400-e29b-41d4-a716-446655440001'::UUID, 'Go-Live Support', 'Post-launch support and optimization',
   3, (NOW() + INTERVAL '60 days')::DATE, 'System fully operational',
   'pending', 0, 'Engineer Acme', 'Scheduled for next phase', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7D. SERVICE CONTRACT ISSUES
-- ============================================================================

INSERT INTO service_contract_issues (
  id, tenant_id, service_contract_id, issue_title, issue_description,
  severity, category, status, assigned_to_name, reported_date,
  impact_description, created_at
)
VALUES
  ('f80e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID,
   'c50e8400-e29b-41d4-a716-446655440001'::UUID, 'Response time exceeded', 
   'Support ticket response delayed by 2 hours', 'medium', 'sla_breach',
   'resolved', 'Manager Acme', CURRENT_DATE - INTERVAL '5 days',
   'Minor impact - resolved within 24 hours', NOW() - INTERVAL '5 days'),
   
  ('f80e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID,
   'c50e8400-e29b-41d4-a716-446655440002'::UUID, 'Resource availability',
   'Need additional engineering resources for peak support', 'high', 'resource',
   'open', 'Manager Acme', CURRENT_DATE,
   'May impact service delivery during peak hours', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. JOB WORKS
-- ============================================================================

INSERT INTO job_works (id, tenant_id, customer_id, job_ref_id, product_id, pieces, size, base_price, default_price, final_price, status, priority, due_date, created_at)
VALUES
  ('e50e8400-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'a50e8400-e29b-41d4-a716-446655440001'::UUID, 'JOB-2024-001', '950e8400-e29b-41d4-a716-446655440003'::UUID, 1.00, 'Large', 75000.00, 75000.00, 75000.00, 'in_progress'::job_work_status, 'high'::job_work_priority, (NOW() + INTERVAL '7 days')::DATE, NOW()),
  ('e50e8400-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'a50e8400-e29b-41d4-a716-446655440003'::UUID, 'JOB-2024-002', '950e8400-e29b-41d4-a716-446655440002'::UUID, 5.00, 'Medium', 3500.00, 3500.00, 17500.00, 'pending'::job_work_status, 'medium'::job_work_priority, (NOW() + INTERVAL '14 days')::DATE, NOW()),
  ('e50e8400-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'a50e8400-e29b-41d4-a716-446655440002'::UUID, 'JOB-2024-003', '950e8400-e29b-41d4-a716-446655440001'::UUID, 10.00, 'Small', 5000.00, 5000.00, 50000.00, 'completed'::job_work_status, 'low'::job_work_priority, (NOW() - INTERVAL '3 days')::DATE, NOW() - INTERVAL '4 days')
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
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 10. RBAC - ROLES (Default roles for each tenant)
-- ============================================================================

-- Acme Corporation Roles
INSERT INTO roles (id, name, description, tenant_id, is_system_role, created_by)
VALUES
  ('10000000-0000-0000-0000-000000000001'::UUID, 'Administrator', 'Full administrative access to tenant', '550e8400-e29b-41d4-a716-446655440001'::UUID, true, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, 'Manager', 'Business operations manager', '550e8400-e29b-41d4-a716-446655440001'::UUID, true, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000003'::UUID, 'Agent', 'Customer service agent', '550e8400-e29b-41d4-a716-446655440001'::UUID, true, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000004'::UUID, 'Engineer', 'Technical engineer', '550e8400-e29b-41d4-a716-446655440001'::UUID, true, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),

-- Tech Solutions Roles
  ('10000000-0000-0000-0000-000000000005'::UUID, 'Administrator', 'Full administrative access to tenant', '550e8400-e29b-41d4-a716-446655440002'::UUID, true, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, 'Manager', 'Business operations manager', '550e8400-e29b-41d4-a716-446655440002'::UUID, true, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),

-- Global Trading Roles
  ('10000000-0000-0000-0000-000000000007'::UUID, 'Administrator', 'Full administrative access to tenant', '550e8400-e29b-41d4-a716-446655440003'::UUID, true, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 11. RBAC - ROLE PERMISSIONS (Map permissions to roles)
-- ============================================================================

-- Admin Role Permissions (Acme Corporation)
INSERT INTO role_permissions (role_id, permission_id, granted_by) -- Fixed: using actual user UUIDs
VALUES
  -- Admin has all permissions
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000101'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000102'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000103'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000104'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000105'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000201'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000202'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000203'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000204'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000301'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000302'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000303'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000304'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000401'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000402'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000403'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000404'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000501'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000502'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000601'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000602'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000701'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000702'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000801'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000802'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000901'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000902'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000001001'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000001002'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000001003'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000001004'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000001005'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000001006'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),

-- Manager Role Permissions (Acme Corporation)
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000101'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000102'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000103'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000201'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000202'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000203'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000301'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000302'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000303'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000401'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000402'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000403'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000501'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000502'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000601'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000701'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000702'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000001003'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),

-- Agent Role Permissions (Acme Corporation)
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000101'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000102'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000103'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000301'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000302'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000303'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000801'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000802'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),

-- Engineer Role Permissions (Acme Corporation)
  ('10000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000601'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000602'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000701'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000702'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000901'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000902'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),
  ('10000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000301'::UUID, '5278ae57-db79-4120-b285-6a2082779b0c'::UUID),

-- Tech Solutions - Admin Role Permissions
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000101'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000102'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000103'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000104'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000105'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000201'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000202'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000203'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000204'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000301'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000302'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000303'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000304'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000401'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000402'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000403'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000404'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000501'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000502'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000601'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000602'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000701'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000702'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000801'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000802'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000901'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000902'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000001001'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000001002'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000001003'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000001004'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000001005'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000001006'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),

-- Tech Solutions - Manager Role Permissions
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000101'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000102'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000103'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000201'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000202'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000203'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000301'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000302'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000303'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000401'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000402'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000403'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000501'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000502'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000601'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000701'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000702'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),
  ('10000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000001003'::UUID, '15372c20-b39b-4475-b579-7f5929c891e9'::UUID),

-- Global Trading - Admin Role Permissions
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000101'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000102'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000103'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000104'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000105'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000201'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000202'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000203'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000204'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000301'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000302'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000303'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000304'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000401'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000402'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000403'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000404'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000501'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000502'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000601'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000602'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000701'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000702'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000801'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000802'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000901'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000902'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000001001'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000001002'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000001003'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000001004'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000001005'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID),
  ('10000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000001006'::UUID, '2dfdab55-61d3-4987-93f2-64a3db93fde8'::UUID)
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

-- ============================================================================
-- 16. SUPER USER MODULE - TENANT ACCESS ASSIGNMENTS
-- ============================================================================
-- Note: Super users are already created in section 1B. Now we assign tenant access.

-- Super User 1: Full Access to All Tenants
INSERT INTO super_user_tenant_access (id, super_user_id, tenant_id, access_level, created_at, updated_at)
VALUES
  ('d7e8ef00-e29b-41d4-a716-446655440001'::UUID, '4e0f4f70-73c7-45ac-a948-6ba225ca36d0'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'full'::access_level_enum, NOW(), NOW()),
  ('d7e8ef00-e29b-41d4-a716-446655440002'::UUID, '4e0f4f70-73c7-45ac-a948-6ba225ca36d0'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'full'::access_level_enum, NOW(), NOW()),
  ('d7e8ef00-e29b-41d4-a716-446655440003'::UUID, '4e0f4f70-73c7-45ac-a948-6ba225ca36d0'::UUID, '550e8400-e29b-41d4-a716-446655440003'::UUID, 'full'::access_level_enum, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Super User 2: Limited Access to First Two Tenants
INSERT INTO super_user_tenant_access (id, super_user_id, tenant_id, access_level, created_at, updated_at)
VALUES
  ('d7e8ef00-e29b-41d4-a716-446655440004'::UUID, 'b4c9831c-4be7-4f28-b4b5-37a9a230084d'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'limited'::access_level_enum, NOW(), NOW()),
  ('d7e8ef00-e29b-41d4-a716-446655440005'::UUID, 'b4c9831c-4be7-4f28-b4b5-37a9a230084d'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'limited'::access_level_enum, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Super User 3: Read-Only Access to All Tenants (Auditor)
INSERT INTO super_user_tenant_access (id, super_user_id, tenant_id, access_level, created_at, updated_at)
VALUES
  ('d7e8ef00-e29b-41d4-a716-446655440006'::UUID, '0cfdd140-593b-4750-9745-6a1e60a1e7bd'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'read_only'::access_level_enum, NOW(), NOW()),
  ('d7e8ef00-e29b-41d4-a716-446655440007'::UUID, '0cfdd140-593b-4750-9745-6a1e60a1e7bd'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'read_only'::access_level_enum, NOW(), NOW()),
  ('d7e8ef00-e29b-41d4-a716-446655440008'::UUID, '0cfdd140-593b-4750-9745-6a1e60a1e7bd'::UUID, '550e8400-e29b-41d4-a716-446655440003'::UUID, 'read_only'::access_level_enum, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 18. SUPER USER MODULE - IMPERSONATION LOGS (Historical Data)
-- ============================================================================

INSERT INTO super_user_impersonation_logs (
  id, super_user_id, impersonated_user_id, tenant_id, reason, login_at, logout_at, 
  actions_taken, ip_address, user_agent, created_at, updated_at
)
VALUES
  -- Completed impersonation sessions
  ('e8f8ef00-e29b-41d4-a716-446655440001'::UUID, 
   '4e0f4f70-73c7-45ac-a948-6ba225ca36d0'::UUID, 
   '5278ae57-db79-4120-b285-6a2082779b0c'::UUID,
   '550e8400-e29b-41d4-a716-446655440001'::UUID,
   'Troubleshoot customer access issue',
   NOW() - INTERVAL '7 days',
   NOW() - INTERVAL '7 days' + INTERVAL '45 minutes',
   '{"actions": ["view_customer_list", "review_customer_profile", "check_access_logs"]}'::JSONB,
   '192.168.1.100',
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
   NOW() - INTERVAL '7 days',
   NOW() - INTERVAL '7 days'
  ),
  
  ('e8f8ef00-e29b-41d4-a716-446655440002'::UUID,
   '4e0f4f70-73c7-45ac-a948-6ba225ca36d0'::UUID,
   '92ec9125-1dae-44c4-abc8-a2ba741a6f3b'::UUID,
   '550e8400-e29b-41d4-a716-446655440001'::UUID,
   'Review manager dashboard and reports',
   NOW() - INTERVAL '5 days',
   NOW() - INTERVAL '5 days' + INTERVAL '2 hours',
   '{"actions": ["view_dashboard", "export_report", "review_metrics"]}'::JSONB,
   '192.168.1.101',
   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
   NOW() - INTERVAL '5 days',
   NOW() - INTERVAL '5 days'
  ),
  
  ('e8f8ef00-e29b-41d4-a716-446655440003'::UUID,
   'b4c9831c-4be7-4f28-b4b5-37a9a230084d'::UUID,
   '15372c20-b39b-4475-b579-7f5929c891e9'::UUID,
   '550e8400-e29b-41d4-a716-446655440002'::UUID,
   'Setup user account permissions',
   NOW() - INTERVAL '3 days',
   NOW() - INTERVAL '3 days' + INTERVAL '1 hour 30 minutes',
   '{"actions": ["create_test_users", "assign_permissions", "verify_access"]}'::JSONB,
   '192.168.1.102',
   'Mozilla/5.0 (X11; Linux x86_64)',
   NOW() - INTERVAL '3 days',
   NOW() - INTERVAL '3 days'
  ),
  
  -- Active impersonation session (ongoing)
  ('e8f8ef00-e29b-41d4-a716-446655440004'::UUID,
   '4e0f4f70-73c7-45ac-a948-6ba225ca36d0'::UUID,
   'b1010925-d7ac-40ed-851a-f27d2dce6b9b'::UUID,
   '550e8400-e29b-41d4-a716-446655440001'::UUID,
   'Monitor engineer activity for compliance',
   NOW() - INTERVAL '2 hours',
   NULL,  -- Still active
   '{"actions": ["view_job_assignments", "check_performance_metrics"]}'::JSONB,
   '192.168.1.103',
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
   NOW() - INTERVAL '2 hours',
   NOW() - INTERVAL '2 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 19. SUPER USER MODULE - TENANT STATISTICS
-- ============================================================================

-- Acme Corporation Statistics
INSERT INTO tenant_statistics (id, tenant_id, metric_type, metric_value, recorded_at, updated_at)
VALUES
  -- Active users
  ('f9f8ef00-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'active_users'::metric_type_enum, 4, NOW(), NOW()),
  -- Total contracts
  ('f9f8ef00-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'total_contracts'::metric_type_enum, 2, NOW(), NOW()),
  -- Total sales
  ('f9f8ef00-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'total_sales'::metric_type_enum, 2, NOW(), NOW()),
  -- Total transactions
  ('f9f8ef00-e29b-41d4-a716-446655440004'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'total_transactions'::metric_type_enum, 15, NOW(), NOW()),
  -- Disk usage (in GB)
  ('f9f8ef00-e29b-41d4-a716-446655440005'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'disk_usage'::metric_type_enum, 5.25, NOW(), NOW()),
  -- API calls daily
  ('f9f8ef00-e29b-41d4-a716-446655440006'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 'api_calls_daily'::metric_type_enum, 342, NOW(), NOW()),

  -- Tech Solutions Inc Statistics
  -- Active users
  ('f9f8ef00-e29b-41d4-a716-446655440007'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'active_users'::metric_type_enum, 2, NOW(), NOW()),
  -- Total contracts
  ('f9f8ef00-e29b-41d4-a716-446655440008'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'total_contracts'::metric_type_enum, 1, NOW(), NOW()),
  -- Total sales
  ('f9f8ef00-e29b-41d4-a716-446655440009'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'total_sales'::metric_type_enum, 1, NOW(), NOW()),
  -- Total transactions
  ('f9f8ef00-e29b-41d4-a716-446655440010'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'total_transactions'::metric_type_enum, 8, NOW(), NOW()),
  -- Disk usage (in GB)
  ('f9f8ef00-e29b-41d4-a716-446655440011'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'disk_usage'::metric_type_enum, 2.10, NOW(), NOW()),
  -- API calls daily
  ('f9f8ef00-e29b-41d4-a716-446655440012'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID, 'api_calls_daily'::metric_type_enum, 156, NOW(), NOW()),

  -- Global Trading Ltd Statistics
  -- Active users
  ('f9f8ef00-e29b-41d4-a716-446655440013'::UUID, '550e8400-e29b-41d4-a716-446655440003'::UUID, 'active_users'::metric_type_enum, 1, NOW(), NOW()),
  -- Total contracts
  ('f9f8ef00-e29b-41d4-a716-446655440014'::UUID, '550e8400-e29b-41d4-a716-446655440003'::UUID, 'total_contracts'::metric_type_enum, 0, NOW(), NOW()),
  -- Total sales
  ('f9f8ef00-e29b-41d4-a716-446655440015'::UUID, '550e8400-e29b-41d4-a716-446655440003'::UUID, 'total_sales'::metric_type_enum, 0, NOW(), NOW()),
  -- Total transactions
  ('f9f8ef00-e29b-41d4-a716-446655440016'::UUID, '550e8400-e29b-41d4-a716-446655440003'::UUID, 'total_transactions'::metric_type_enum, 5, NOW(), NOW()),
  -- Disk usage (in GB)
  ('f9f8ef00-e29b-41d4-a716-446655440017'::UUID, '550e8400-e29b-41d4-a716-446655440003'::UUID, 'disk_usage'::metric_type_enum, 1.50, NOW(), NOW()),
  -- API calls daily
  ('f9f8ef00-e29b-41d4-a716-446655440018'::UUID, '550e8400-e29b-41d4-a716-446655440003'::UUID, 'api_calls_daily'::metric_type_enum, 89, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 20. SUPER USER MODULE - CONFIGURATION OVERRIDES
-- ============================================================================

INSERT INTO tenant_config_overrides (id, tenant_id, config_key, config_value, override_reason, created_by, created_at, expires_at)
VALUES
  -- Acme Corporation Config Overrides
  ('aaf8ef00-e29b-41d4-a716-446655440001'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID, 
   'max_users', '100'::JSONB, 'Capacity expansion approved', '4e0f4f70-73c7-45ac-a948-6ba225ca36d0'::UUID, NOW(), NULL),
  
  ('aaf8ef00-e29b-41d4-a716-446655440002'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID,
   'api_rate_limit', '5000'::JSONB, 'High volume trading support', '4e0f4f70-73c7-45ac-a948-6ba225ca36d0'::UUID, NOW(), NULL),
  
  ('aaf8ef00-e29b-41d4-a716-446655440003'::UUID, '550e8400-e29b-41d4-a716-446655440001'::UUID,
   'maintenance_mode', 'false'::JSONB, 'Emergency maintenance override', '4e0f4f70-73c7-45ac-a948-6ba225ca36d0'::UUID, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
  
  -- Tech Solutions Inc Config Overrides
  ('aaf8ef00-e29b-41d4-a716-446655440004'::UUID, '550e8400-e29b-41d4-a716-446655440002'::UUID,
   'feature_flags', '{"advanced_reporting": true, "custom_workflows": true}'::JSONB, 'Premium feature enablement', 'b4c9831c-4be7-4f28-b4b5-37a9a230084d'::UUID, NOW(), NULL),
  
  -- Global Trading Ltd Config Overrides
  ('aaf8ef00-e29b-41d4-a716-446655440005'::UUID, '550e8400-e29b-41d4-a716-446655440003'::UUID,
   'timezone', '"Asia/Singapore"'::JSONB, 'Regional customization', '4e0f4f70-73c7-45ac-a948-6ba225ca36d0'::UUID, NOW(), NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 21. DYNAMIC REFERENCE DATA - STATUS OPTIONS AND REFERENCE DATA
-- ============================================================================

-- ============================================================================
-- 21.1. SEED STATUS_OPTIONS FOR SALES MODULE
-- ============================================================================

INSERT INTO status_options (tenant_id, module, status_key, display_label, color_code, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'sales', 'pending', 'Pending', '#FFA500', 10, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'sales', 'qualified', 'Qualified', '#4169E1', 20, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'sales', 'proposal_sent', 'Proposal Sent', '#9370DB', 30, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'sales', 'negotiation', 'Negotiation', '#20B2AA', 40, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'sales', 'won', 'Won', '#228B22', 50, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'sales', 'lost', 'Lost', '#DC143C', 60, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1))
ON CONFLICT (tenant_id, module, status_key) DO NOTHING;

-- ============================================================================
-- 21.2. SEED STATUS_OPTIONS FOR TICKETS MODULE
-- ============================================================================

INSERT INTO status_options (tenant_id, module, status_key, display_label, color_code, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'tickets', 'open', 'Open', '#FF6B6B', 10, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'tickets', 'in_progress', 'In Progress', '#4ECDC4', 20, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'tickets', 'waiting_customer', 'Waiting for Customer', '#FFA500', 30, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'tickets', 'resolved', 'Resolved', '#95E1D3', 40, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'tickets', 'closed', 'Closed', '#38ADA9', 50, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'tickets', 'rejected', 'Rejected', '#DC143C', 60, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1))
ON CONFLICT (tenant_id, module, status_key) DO NOTHING;

-- ============================================================================
-- 21.3. SEED STATUS_OPTIONS FOR CONTRACTS MODULE
-- ============================================================================

INSERT INTO status_options (tenant_id, module, status_key, display_label, color_code, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'contracts', 'draft', 'Draft', '#A9A9A9', 10, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'contracts', 'sent_for_approval', 'Sent for Approval', '#FFA500', 20, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'contracts', 'approved', 'Approved', '#228B22', 30, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'contracts', 'signed', 'Signed', '#4169E1', 40, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'contracts', 'active', 'Active', '#32CD32', 50, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'contracts', 'expired', 'Expired', '#DC143C', 60, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'contracts', 'terminated', 'Terminated', '#8B0000', 70, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1))
ON CONFLICT (tenant_id, module, status_key) DO NOTHING;

-- ============================================================================
-- 21.4. SEED STATUS_OPTIONS FOR JOBWORK MODULE
-- ============================================================================

INSERT INTO status_options (tenant_id, module, status_key, display_label, color_code, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'jobwork', 'scheduled', 'Scheduled', '#4169E1', 10, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'jobwork', 'in_progress', 'In Progress', '#20B2AA', 20, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'jobwork', 'completed', 'Completed', '#228B22', 30, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'jobwork', 'pending_approval', 'Pending Approval', '#FFA500', 40, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'jobwork', 'cancelled', 'Cancelled', '#DC143C', 50, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1))
ON CONFLICT (tenant_id, module, status_key) DO NOTHING;

-- ============================================================================
-- 21.5. SEED STATUS_OPTIONS FOR COMPLAINTS MODULE
-- ============================================================================

INSERT INTO status_options (tenant_id, module, status_key, display_label, color_code, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'complaints', 'filed', 'Filed', '#FF6B6B', 10, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'complaints', 'under_investigation', 'Under Investigation', '#FFA500', 20, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'complaints', 'resolution_proposed', 'Resolution Proposed', '#9370DB', 30, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'complaints', 'resolved', 'Resolved', '#228B22', 40, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'complaints', 'closed', 'Closed', '#38ADA9', 50, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1))
ON CONFLICT (tenant_id, module, status_key) DO NOTHING;

-- ============================================================================
-- 21.6. SEED STATUS_OPTIONS FOR SERVICE_CONTRACT MODULE
-- ============================================================================

INSERT INTO status_options (tenant_id, module, status_key, display_label, color_code, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'serviceContract', 'draft', 'Draft', '#A9A9A9', 10, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'serviceContract', 'pending', 'Pending', '#FFA500', 20, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'serviceContract', 'active', 'Active', '#32CD32', 30, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'serviceContract', 'on_hold', 'On Hold', '#FFD700', 40, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'serviceContract', 'completed', 'Completed', '#228B22', 50, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'serviceContract', 'cancelled', 'Cancelled', '#DC143C', 60, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1))
ON CONFLICT (tenant_id, module, status_key) DO NOTHING;

-- ============================================================================
-- 21.7. SEED REFERENCE_DATA - PRIORITIES
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'priority', 'low', 'Low', '{"color":"#228B22","icon":"ArrowDown","weight":1}'::jsonb, 10, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'priority', 'medium', 'Medium', '{"color":"#FFA500","icon":"ArrowRight","weight":2}'::jsonb, 20, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'priority', 'high', 'High', '{"color":"#FF6B6B","icon":"ArrowUp","weight":3}'::jsonb, 30, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'priority', 'critical', 'Critical', '{"color":"#DC143C","icon":"AlertTriangle","weight":4}'::jsonb, 40, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1))
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.8. SEED REFERENCE_DATA - SEVERITIES
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'severity', 'minor', 'Minor', '{"color":"#A9A9A9","icon":"Bug","weight":1}'::jsonb, 10, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'severity', 'major', 'Major', '{"color":"#FFA500","icon":"AlertCircle","weight":2}'::jsonb, 20, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'severity', 'critical', 'Critical', '{"color":"#FF6B6B","icon":"AlertTriangle","weight":3}'::jsonb, 30, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'severity', 'blocker', 'Blocker', '{"color":"#DC143C","icon":"AlertOctagon","weight":4}'::jsonb, 40, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1))
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.9. SEED REFERENCE_DATA - DEPARTMENTS
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'department', 'sales', 'Sales', '{"icon":"TrendingUp","color":"#4169E1"}'::jsonb, 10, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'department', 'support', 'Support', '{"icon":"Headphones","color":"#20B2AA"}'::jsonb, 20, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'department', 'engineering', 'Engineering', '{"icon":"Wrench","color":"#9370DB"}'::jsonb, 30, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'department', 'operations', 'Operations', '{"icon":"Zap","color":"#FFD700"}'::jsonb, 40, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'department', 'billing', 'Billing', '{"icon":"DollarSign","color":"#228B22"}'::jsonb, 50, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1))
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.10. SEED REFERENCE_DATA - INDUSTRIES
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
SELECT 
  t.id,
  'industry',
  industries.key,
  industries.label,
  industries.metadata::jsonb,
  industries.sort_order,
  true,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM tenants t
CROSS JOIN (
  VALUES
    ('technology', 'Technology', '{"icon":"Code","color":"#4169E1"}', 10),
    ('finance', 'Finance', '{"icon":"BarChart","color":"#228B22"}', 20),
    ('healthcare', 'Healthcare', '{"icon":"Heart","color":"#DC143C"}', 30),
    ('manufacturing', 'Manufacturing', '{"icon":"Package","color":"#FF8C00"}', 40),
    ('retail', 'Retail', '{"icon":"ShoppingCart","color":"#9370DB"}', 50),
    ('education', 'Education', '{"icon":"BookOpen","color":"#4169E1"}', 60),
    ('consulting', 'Consulting', '{"icon":"Briefcase","color":"#228B22"}', 70),
    ('energy', 'Energy', '{"icon":"Zap","color":"#FFD700"}', 80),
    ('transportation', 'Transportation & Logistics', '{"icon":"Truck","color":"#FF8C00"}', 90)
) AS industries(key, label, metadata, sort_order)
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.11. SEED REFERENCE_DATA - COMPETENCY LEVELS
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'competency_level', 'beginner', 'Beginner', '{"level":1,"color":"#A9A9A9"}'::jsonb, 10, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'competency_level', 'intermediate', 'Intermediate', '{"level":2,"color":"#FFD700"}'::jsonb, 20, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'competency_level', 'advanced', 'Advanced', '{"level":3,"color":"#4169E1"}'::jsonb, 30, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'competency_level', 'expert', 'Expert', '{"level":4,"color":"#228B22"}'::jsonb, 40, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1))
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.11.5. SEED REFERENCE_DATA - COMPANY SIZES
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, description, metadata, sort_order, is_active, created_by)
SELECT 
  t.id,
  'company_size',
  sizes.key,
  sizes.label,
  sizes.description,
  sizes.metadata::jsonb,
  sizes.sort_order,
  true,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM tenants t
CROSS JOIN (
  VALUES
    ('startup', 'Startup (1-50 employees)', 'Small startup company', '{"minEmployees":1,"maxEmployees":50,"icon":"Zap","color":"#4169E1"}', 10),
    ('small', 'Small Business (51-200 employees)', 'Small business', '{"minEmployees":51,"maxEmployees":200,"icon":"Users","color":"#20B2AA"}', 20),
    ('medium', 'Medium Enterprise (201-1000 employees)', 'Mid-sized enterprise', '{"minEmployees":201,"maxEmployees":1000,"icon":"Building","color":"#9370DB"}', 30),
    ('large', 'Large Enterprise (1001-5000 employees)', 'Large enterprise', '{"minEmployees":1001,"maxEmployees":5000,"icon":"Building2","color":"#FFD700"}', 40),
    ('enterprise', 'Enterprise (5000+ employees)', 'Large corporation', '{"minEmployees":5001,"maxEmployees":999999,"icon":"Building3","color":"#FF8C00"}', 50)
) AS sizes(key, label, description, metadata, sort_order)
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.12. SEED REFERENCE_DATA - PRODUCT TYPES
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
VALUES
  ((SELECT id FROM tenants LIMIT 1), 'product_type', 'hardware', 'Hardware', '{"icon":"Monitor","color":"#4169E1"}'::jsonb, 10, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'product_type', 'software', 'Software', '{"icon":"Code","color":"#20B2AA"}'::jsonb, 20, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'product_type', 'service', 'Service', '{"icon":"Briefcase","color":"#9370DB"}'::jsonb, 30, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)),
  ((SELECT id FROM tenants LIMIT 1), 'product_type', 'subscription', 'Subscription', '{"icon":"RefreshCw","color":"#FFD700"}'::jsonb, 40, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1))
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.13. SEED REFERENCE_DATA - TICKET STATUSES (For Tickets Module)
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
SELECT 
  t.id,
  'ticket_status',
  statuses.key,
  statuses.label,
  statuses.metadata::jsonb,
  statuses.sort_order,
  true,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM tenants t
CROSS JOIN (
  VALUES
    ('open', 'Open', '{"icon":"AlertCircle","color":"#2196F3"}', 10),
    ('in_progress', 'In Progress', '{"icon":"Loader","color":"#FF9800"}', 20),
    ('resolved', 'Resolved', '{"icon":"CheckCircle","color":"#4CAF50"}', 30),
    ('closed', 'Closed', '{"icon":"X","color":"#9E9E9E"}', 40),
    ('on_hold', 'On Hold', '{"icon":"Pause","color":"#F44336"}', 50)
) AS statuses(key, label, metadata, sort_order)
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.14. SEED REFERENCE_DATA - TICKET PRIORITIES
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
SELECT 
  t.id,
  'ticket_priority',
  priorities.key,
  priorities.label,
  priorities.metadata::jsonb,
  priorities.sort_order,
  true,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM tenants t
CROSS JOIN (
  VALUES
    ('low', 'Low', '{"icon":"ArrowDown","color":"#4CAF50","weight":1}', 10),
    ('medium', 'Medium', '{"icon":"ArrowRight","color":"#FFA500","weight":2}', 20),
    ('high', 'High', '{"icon":"ArrowUp","color":"#FF6B6B","weight":3}', 30),
    ('urgent', 'Urgent', '{"icon":"AlertTriangle","color":"#DC143C","weight":4}', 40)
) AS priorities(key, label, metadata, sort_order)
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.15. SEED REFERENCE_DATA - TICKET CATEGORIES
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
SELECT 
  t.id,
  'ticket_category',
  categories.key,
  categories.label,
  categories.metadata::jsonb,
  categories.sort_order,
  true,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM tenants t
CROSS JOIN (
  VALUES
    ('billing', 'Billing', '{"icon":"DollarSign","color":"#228B22","department":"billing"}', 10),
    ('technical', 'Technical', '{"icon":"Tool","color":"#4169E1","department":"support"}', 20),
    ('sales', 'Sales Inquiry', '{"icon":"TrendingUp","color":"#20B2AA","department":"sales"}', 30),
    ('general', 'General', '{"icon":"HelpCircle","color":"#9370DB","department":"support"}', 40),
    ('escalation', 'Escalation', '{"icon":"AlertTriangle","color":"#FF8C00","department":"management"}', 50)
) AS categories(key, label, metadata, sort_order)
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.16. SEED REFERENCE_DATA - TICKET DEPARTMENTS
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
SELECT 
  t.id,
  'ticket_department',
  depts.key,
  depts.label,
  depts.metadata::jsonb,
  depts.sort_order,
  true,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM tenants t
CROSS JOIN (
  VALUES
    ('support', 'Support', '{"icon":"Headphones","color":"#20B2AA"}', 10),
    ('sales', 'Sales', '{"icon":"TrendingUp","color":"#4169E1"}', 20),
    ('billing', 'Billing', '{"icon":"DollarSign","color":"#228B22"}', 30),
    ('technical', 'Technical', '{"icon":"Wrench","color":"#9370DB"}', 40)
) AS depts(key, label, metadata, sort_order)
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.17. SEED REFERENCE_DATA - TICKET TAGS
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
SELECT 
  t.id,
  'ticket_tag',
  tags.key,
  tags.label,
  tags.metadata::jsonb,
  tags.sort_order,
  true,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM tenants t
CROSS JOIN (
  VALUES
    ('bug', 'Bug', '{"icon":"Bug","color":"#FF6B6B"}', 10),
    ('feature', 'Feature Request', '{"icon":"Star","color":"#FFD700"}', 20),
    ('urgent', 'Urgent', '{"icon":"AlertTriangle","color":"#FF8C00"}', 30),
    ('documentation', 'Documentation', '{"icon":"FileText","color":"#4169E1"}', 40),
    ('question', 'Question', '{"icon":"HelpCircle","color":"#20B2AA"}', 50)
) AS tags(key, label, metadata, sort_order)
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.18. SEED REFERENCE_DATA - CONTRACT TYPES
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
SELECT 
  t.id,
  'contract_type',
  types.key,
  types.label,
  types.metadata::jsonb,
  types.sort_order,
  true,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM tenants t
CROSS JOIN (
  VALUES
    ('service_agreement', 'Service Agreement', '{"icon":"FileText","color":"#4169E1"}', 10),
    ('purchase_order', 'Purchase Order', '{"icon":"ShoppingCart","color":"#20B2AA"}', 20),
    ('nda', 'Non-Disclosure Agreement', '{"icon":"Lock","color":"#9370DB"}', 30),
    ('licensing', 'Licensing Agreement', '{"icon":"Certificate","color":"#228B22"}', 40),
    ('custom', 'Custom', '{"icon":"Wrench","color":"#FF8C00"}', 50)
) AS types(key, label, metadata, sort_order)
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.19. SEED REFERENCE_DATA - CONTRACT STATUSES
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
SELECT 
  t.id,
  'contract_status',
  statuses.key,
  statuses.label,
  statuses.metadata::jsonb,
  statuses.sort_order,
  true,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM tenants t
CROSS JOIN (
  VALUES
    ('draft', 'Draft', '{"icon":"FileText","color":"#9E9E9E"}', 10),
    ('pending_approval', 'Pending Approval', '{"icon":"Clock","color":"#FFA500"}', 20),
    ('active', 'Active', '{"icon":"CheckCircle","color":"#4CAF50"}', 30),
    ('expired', 'Expired', '{"icon":"AlertCircle","color":"#FF6B6B"}', 40),
    ('terminated', 'Terminated', '{"icon":"X","color":"#DC143C"}', 50)
) AS statuses(key, label, metadata, sort_order)
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.20. SEED REFERENCE_DATA - CONTRACT PRIORITIES
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
SELECT 
  t.id,
  'contract_priority',
  priorities.key,
  priorities.label,
  priorities.metadata::jsonb,
  priorities.sort_order,
  true,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM tenants t
CROSS JOIN (
  VALUES
    ('low', 'Low', '{"icon":"ArrowDown","color":"#4CAF50","weight":1}', 10),
    ('medium', 'Medium', '{"icon":"ArrowRight","color":"#FFA500","weight":2}', 20),
    ('high', 'High', '{"icon":"ArrowUp","color":"#FF6B6B","weight":3}', 30),
    ('critical', 'Critical', '{"icon":"AlertTriangle","color":"#DC143C","weight":4}', 40)
) AS priorities(key, label, metadata, sort_order)
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.21. SEED REFERENCE_DATA - COMPANY STATUSES (For Masters Module)
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
SELECT 
  t.id,
  'company_status',
  statuses.key,
  statuses.label,
  statuses.metadata::jsonb,
  statuses.sort_order,
  true,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM tenants t
CROSS JOIN (
  VALUES
    ('active', 'Active', '{"icon":"CheckCircle","color":"#4CAF50"}', 10),
    ('inactive', 'Inactive', '{"icon":"X","color":"#9E9E9E"}', 20),
    ('pending', 'Pending', '{"icon":"Clock","color":"#FFA500"}', 30),
    ('archived', 'Archived', '{"icon":"Archive","color":"#757575"}', 40)
) AS statuses(key, label, metadata, sort_order)
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.22. SEED REFERENCE_DATA - PRODUCT STATUSES (For Masters Module)
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
SELECT 
  t.id,
  'product_status',
  statuses.key,
  statuses.label,
  statuses.metadata::jsonb,
  statuses.sort_order,
  true,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM tenants t
CROSS JOIN (
  VALUES
    ('active', 'Active', '{"icon":"CheckCircle","color":"#4CAF50"}', 10),
    ('discontinued', 'Discontinued', '{"icon":"X","color":"#F44336"}', 20),
    ('pending', 'Pending', '{"icon":"Clock","color":"#FFA500"}', 30),
    ('archived', 'Archived', '{"icon":"Archive","color":"#757575"}', 40)
) AS statuses(key, label, metadata, sort_order)
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.23. SEED REFERENCE_DATA - PRODUCT UNITS (For Masters Module)
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
SELECT 
  t.id,
  'product_unit',
  units.key,
  units.label,
  units.metadata::jsonb,
  units.sort_order,
  true,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM tenants t
CROSS JOIN (
  VALUES
    ('piece', 'Piece', '{"icon":"Box","abbreviation":"pc"}', 10),
    ('box', 'Box', '{"icon":"Package","abbreviation":"box"}', 20),
    ('kg', 'Kilogram', '{"icon":"Weight","abbreviation":"kg"}', 30),
    ('liter', 'Liter', '{"icon":"Droplet","abbreviation":"L"}', 40),
    ('meter', 'Meter', '{"icon":"Ruler","abbreviation":"m"}', 50),
    ('hour', 'Hour', '{"icon":"Clock","abbreviation":"hr"}', 60),
    ('day', 'Day', '{"icon":"Calendar","abbreviation":"day"}', 70),
    ('month', 'Month', '{"icon":"Calendar","abbreviation":"month"}', 80),
    ('year', 'Year', '{"icon":"Calendar","abbreviation":"yr"}', 90),
    ('set', 'Set', '{"icon":"Layers","abbreviation":"set"}', 100)
) AS units(key, label, metadata, sort_order)
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.24. SEED REFERENCE_DATA - CUSTOMER STATUSES (For Customers Module)
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
SELECT 
  t.id,
  'customer_status',
  statuses.key,
  statuses.label,
  statuses.metadata::jsonb,
  statuses.sort_order,
  true,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM tenants t
CROSS JOIN (
  VALUES
    ('active', 'Active', '{"icon":"CheckCircle","color":"#4CAF50","emoji":"✅"}', 10),
    ('inactive', 'Inactive', '{"icon":"X","color":"#9E9E9E","emoji":"❌"}', 20),
    ('prospect', 'Prospect', '{"icon":"Clock","color":"#FFA500","emoji":"⏳"}', 30),
    ('suspended', 'Suspended', '{"icon":"AlertCircle","color":"#F44336","emoji":"🛑"}', 40)
) AS statuses(key, label, metadata, sort_order)
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.25. SEED REFERENCE_DATA - CUSTOMER TYPES (For Customers Module)
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
SELECT 
  t.id,
  'customer_type',
  types.key,
  types.label,
  types.metadata::jsonb,
  types.sort_order,
  true,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM tenants t
CROSS JOIN (
  VALUES
    ('business', 'Business', '{"icon":"Building","emoji":"🏢"}', 10),
    ('individual', 'Individual', '{"icon":"User","emoji":"👤"}', 20),
    ('corporate', 'Corporate', '{"icon":"Building2","emoji":"🏛️"}', 30),
    ('government', 'Government', '{"icon":"Building3","emoji":"🏛️"}', 40)
) AS types(key, label, metadata, sort_order)
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.26. SEED REFERENCE_DATA - LEAD SOURCES (For Customers Module)
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
SELECT 
  t.id,
  'lead_source',
  sources.key,
  sources.label,
  sources.metadata::jsonb,
  sources.sort_order,
  true,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM tenants t
CROSS JOIN (
  VALUES
    ('referral', 'Referral', '{"icon":"Users","emoji":"👥"}', 10),
    ('website', 'Website', '{"icon":"Globe","emoji":"🌐"}', 20),
    ('sales_team', 'Sales Team', '{"icon":"Phone","emoji":"📞"}', 30),
    ('event', 'Event', '{"icon":"Target","emoji":"🎯"}', 40),
    ('other', 'Other', '{"icon":"MoreHorizontal","emoji":"📋"}', 50)
) AS sources(key, label, metadata, sort_order)
ON CONFLICT (tenant_id, category, key) DO NOTHING;

-- ============================================================================
-- 21.27. SEED REFERENCE_DATA - LEAD RATINGS (For Customers Module)
-- ============================================================================

INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
SELECT 
  t.id,
  'lead_rating',
  ratings.key,
  ratings.label,
  ratings.metadata::jsonb,
  ratings.sort_order,
  true,
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM tenants t
CROSS JOIN (
  VALUES
    ('hot', 'Hot Lead', '{"icon":"Flame","emoji":"🔥","weight":3}', 30),
    ('warm', 'Warm Lead', '{"icon":"Sun","emoji":"☀️","weight":2}', 20),
    ('cold', 'Cold Lead', '{"icon":"Snowflake","emoji":"❄️","weight":1}', 10)
) AS ratings(key, label, metadata, sort_order)
ON CONFLICT (tenant_id, category, key) DO NOTHING;
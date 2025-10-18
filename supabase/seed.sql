-- ============================================================================
-- SEED DATA - Development Test Data
-- ============================================================================

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
  ('650e8400-e29b-41d4-a716-446655440001'::UUID, 'admin@acme.com', 'Admin Acme', '550e8400-e29b-41d4-a716-446655440001'::UUID, 'admin', 'active', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440002'::UUID, 'manager@acme.com', 'Manager Acme', '550e8400-e29b-41d4-a716-446655440001'::UUID, 'manager', 'active', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440003'::UUID, 'engineer@acme.com', 'Engineer Acme', '550e8400-e29b-41d4-a716-446655440001'::UUID, 'engineer', 'active', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440004'::UUID, 'user@acme.com', 'User Acme', '550e8400-e29b-41d4-a716-446655440001'::UUID, 'agent', 'active', NOW(), NOW()),
  
  -- Tech Solutions Users
  ('650e8400-e29b-41d4-a716-446655440005'::UUID, 'admin@techsolutions.com', 'Admin Tech', '550e8400-e29b-41d4-a716-446655440002'::UUID, 'admin', 'active', NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440006'::UUID, 'manager@techsolutions.com', 'Manager Tech', '550e8400-e29b-41d4-a716-446655440002'::UUID, 'manager', 'active', NOW(), NOW()),
  
  -- Global Trading Users
  ('650e8400-e29b-41d4-a716-446655440007'::UUID, 'admin@globaltrading.com', 'Admin Global', '550e8400-e29b-41d4-a716-446655440003'::UUID, 'admin', 'active', NOW(), NOW())
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
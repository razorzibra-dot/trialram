-- ============================================================================
-- DROPDOWN DEBUG QUERIES
-- Run these in Supabase SQL Editor to diagnose empty dropdowns
-- ============================================================================

-- 1. Check your current user's tenant_id
SELECT 
  u.id as user_id,
  u.email,
  u.tenant_id,
  t.name as tenant_name
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
WHERE u.email = 'YOUR_EMAIL_HERE';  -- Replace with your login email

-- 2. Check products in database
SELECT 
  id,
  name,
  sku,
  status,
  is_active,
  tenant_id,
  deleted_at
FROM products
ORDER BY created_at DESC
LIMIT 20;

-- 3. Check customers in database  
SELECT
  id,
  company_name,
  contact_name,
  status,
  tenant_id
FROM customers
ORDER BY created_at DESC
LIMIT 20;

-- 4. Check companies in database
SELECT
  id,
  name,
  status,
  tenant_id,
  deleted_at
FROM companies
ORDER BY created_at DESC
LIMIT 20;

-- 5. Check if RLS is blocking (run as your user)
-- This will show what products YOUR user can see
SELECT count(*) as visible_products_count
FROM products
WHERE is_active = true AND status = 'active';

-- 6. QUICK FIX: Add sample products for YOUR tenant
-- First, get your tenant_id from query #1, then run:
/*
INSERT INTO products (name, sku, description, price, cost_price, stock_quantity, tenant_id, status, is_active)
VALUES 
  ('Test Product 1', 'TEST-001', 'Test product for dropdown', 99.99, 50.00, 100, 'YOUR_TENANT_ID_HERE', 'active', true),
  ('Test Product 2', 'TEST-002', 'Another test product', 149.99, 75.00, 50, 'YOUR_TENANT_ID_HERE', 'active', true);

INSERT INTO customers (company_name, contact_name, email, phone, address, city, country, tenant_id, status, size, customer_type)
VALUES
  ('Test Company 1', 'John Doe', 'john@test.com', '+1-555-0001', '123 Test St', 'Test City', 'USA', 'YOUR_TENANT_ID_HERE', 'active', 'medium', 'business'),
  ('Test Company 2', 'Jane Smith', 'jane@test.com', '+1-555-0002', '456 Test Ave', 'Test Town', 'USA', 'YOUR_TENANT_ID_HERE', 'active', 'small', 'business');

INSERT INTO companies (name, address, phone, email, tenant_id, status)
VALUES
  ('Test Corp 1', '789 Test Blvd', '+1-555-0003', 'info@testcorp1.com', 'YOUR_TENANT_ID_HERE', 'active'),
  ('Test Corp 2', '321 Test Lane', '+1-555-0004', 'info@testcorp2.com', 'YOUR_TENANT_ID_HERE', 'active');
*/

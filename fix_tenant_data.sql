-- ============================================
-- FIX TENANT DATA - Add products/customers for YOUR tenant
-- ============================================
-- Run this in Supabase SQL Editor to add data for your actual tenant

-- ⚠️ IMPORTANT: Replace 'YOUR_EMAIL_HERE' with your actual login email
-- Example: 'admin@example.com' or 'user@company.com'

DO $$
DECLARE
  v_tenant_id uuid;
  v_user_email text := 'YOUR_EMAIL_HERE';  -- 👈 CHANGE THIS TO YOUR EMAIL
BEGIN
  -- STEP 1: Get tenant_id for the specified email
  SELECT tenant_id INTO v_tenant_id
  FROM public.users 
  WHERE email = v_user_email
  LIMIT 1;

  -- Check if we found a tenant
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No user found with email: %. Please update v_user_email variable.', v_user_email;
  END IF;

  RAISE NOTICE 'Found tenant_id: % for email: %', v_tenant_id, v_user_email;

  -- STEP 2: Insert products if none exist
  IF NOT EXISTS (SELECT 1 FROM products WHERE tenant_id = v_tenant_id) THEN
    INSERT INTO products (name, sku, description, price, cost_price, stock_quantity, tenant_id, status, is_active) 
    VALUES
      ('Premium Widget', 'WID-001', 'High-quality industrial widget', 29.99, 18.50, 100, v_tenant_id, 'active'::product_status, true),
      ('Standard Gadget', 'GAD-001', 'Reliable electronic gadget', 49.99, 30.00, 75, v_tenant_id, 'active'::product_status, true),
      ('Service Package Basic', 'SRV-001', 'Basic service maintenance package', 99.99, 60.00, 50, v_tenant_id, 'active'::product_status, true),
      ('Cloud Hosting Plan', 'CLOUD-001', 'Enterprise cloud hosting', 199.99, 120.00, 999, v_tenant_id, 'active'::product_status, true),
      ('Advanced Tool Kit', 'TOO-001', 'Complete toolkit for professionals', 79.99, 45.00, 30, v_tenant_id, 'active'::product_status, true),
      ('Safety Equipment Set', 'SAFE-001', 'Comprehensive safety equipment', 129.99, 80.00, 25, v_tenant_id, 'active'::product_status, true);
    
    RAISE NOTICE 'Inserted % products for tenant %', 6, v_tenant_id;
  ELSE
    RAISE NOTICE 'Products already exist for tenant %', v_tenant_id;
  END IF;

  -- STEP 3: Insert companies if none exist
  IF NOT EXISTS (SELECT 1 FROM companies WHERE tenant_id = v_tenant_id) THEN
    INSERT INTO companies (name, address, phone, email, tenant_id, status) 
    VALUES
      ('Demo Manufacturing Inc', '123 Industrial Ave, Detroit, MI, USA', '+1-313-555-0100', 'contact@demomfg.com', v_tenant_id, 'active'::entity_status),
      ('Acme Solutions Corp', '456 Tech Blvd, Austin, TX, USA', '+1-512-555-0200', 'info@acmesolutions.com', v_tenant_id, 'active'::entity_status),
      ('Global Services Ltd', '789 Service St, Miami, FL, USA', '+1-305-555-0300', 'sales@globalservices.com', v_tenant_id, 'active'::entity_status);
    
    RAISE NOTICE 'Inserted % companies for tenant %', 3, v_tenant_id;
  ELSE
    RAISE NOTICE 'Companies already exist for tenant %', v_tenant_id;
  END IF;
END $$;

-- STEP 4: Verify the data was inserted (check counts)
-- ⚠️ Replace 'YOUR_EMAIL_HERE' below as well
SELECT 
  'Products' as table_name,
  count(*) as count
FROM products 
WHERE tenant_id = (SELECT tenant_id FROM public.users WHERE email = 'YOUR_EMAIL_HERE' LIMIT 1)
UNION ALL
SELECT 
  'Companies' as table_name,
  count(*) as count
FROM companies 
WHERE tenant_id = (SELECT tenant_id FROM public.users WHERE email = 'YOUR_EMAIL_HERE' LIMIT 1)
UNION ALL
SELECT 
  'Customers' as table_name,
  count(*) as count
FROM customers 
WHERE tenant_id = (SELECT tenant_id FROM public.users WHERE email = 'YOUR_EMAIL_HERE' LIMIT 1);

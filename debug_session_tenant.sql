-- ============================================
-- DEBUG SESSION vs DATABASE TENANT MISMATCH
-- ============================================
-- Run this in Supabase SQL Editor while logged in

-- Check 1: What does the database think about admin@acme.com?
SELECT 
  'Database User Info' as source,
  id as user_id,
  email,
  tenant_id,
  name,
  role,
  status
FROM public.users
WHERE email = 'admin@acme.com';

-- Check 2: What products exist for admin@acme.com's tenant?
SELECT 
  'Products for admin@acme.com tenant' as info,
  p.id,
  p.name,
  p.sku,
  p.status,
  p.is_active,
  p.tenant_id
FROM products p
WHERE p.tenant_id = (SELECT tenant_id FROM public.users WHERE email = 'admin@acme.com' LIMIT 1)
ORDER BY p.name;

-- Check 3: What companies exist for admin@acme.com's tenant?
SELECT 
  'Companies for admin@acme.com tenant' as info,
  c.id,
  c.name,
  c.status,
  c.tenant_id
FROM companies c
WHERE c.tenant_id = (SELECT tenant_id FROM public.users WHERE email = 'admin@acme.com' LIMIT 1)
ORDER BY c.name;

-- Check 4: What can the CURRENT logged-in user see? (RLS test)
-- This uses RLS - shows only what you can actually access
SELECT 
  'What I can see via RLS' as info,
  count(*) FILTER (WHERE is_active = true AND status = 'active') as active_products,
  count(*) as total_products
FROM products;

SELECT 
  'Companies I can see via RLS' as info,
  count(*) FILTER (WHERE status = 'active') as active_companies,
  count(*) as total_companies
FROM companies;

-- Check 5: List the actual products you can see
SELECT 
  'My visible products' as info,
  id,
  name,
  sku,
  status,
  is_active,
  tenant_id
FROM products
WHERE is_active = true AND status = 'active'
ORDER BY name
LIMIT 20;

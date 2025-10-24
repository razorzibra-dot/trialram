-- ============================================================================
-- ADD TEST AUTHENTICATED USERS FOR LOCAL DEVELOPMENT
-- Migration: 013 - Create test users in Supabase auth
-- ============================================================================
-- 
-- This migration creates test users in the auth schema and links them to app users.
-- In local Supabase, these must be created via the Dashboard, but we create app records here.
--
-- For LOCAL DEVELOPMENT ONLY - Create users manually via Supabase Dashboard:
-- 1. Go to http://localhost:54323
-- 2. Auth → Users → Add User
-- 3. Create these users:
--    - Email: admin@techcorp.com, Password: password123
--    - Email: user@techcorp.com, Password: password123
--
-- After creating in Supabase Dashboard, copy their UUIDs and update this migration,
-- then run: supabase db push
-- ============================================================================

-- Get first tenant ID for linking users
DO $$
DECLARE
  v_tenant_id uuid;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenants found. Run earlier migrations first.';
  END IF;

  -- Admin user - Use UUIDs from Supabase Dashboard
  -- Replace these with actual UUIDs from Supabase auth users
  INSERT INTO users (
    id,
    email,
    firstName,
    lastName,
    role,
    status,
    tenant_id,
    tenantName,
    created_at
  ) VALUES (
    'a3c91c65-343d-4ff4-b9ab-f36adb371495'::uuid,
    'admin@acme.com',
    'Admin',
    'User',
    'admin',
    'active',
    v_tenant_id,
    (SELECT name FROM tenants WHERE id = v_tenant_id LIMIT 1),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

  -- Regular user
  INSERT INTO users (
    id,
    email,
    firstName,
    lastName,
    role,
    status,
    tenant_id,
    tenantName,
    created_at
  ) VALUES (
    'c0885ddd-4d5f-4be6-b717-527d385a2c07'::uuid,
    'user@acme.com',
    'Test',
    'User',
    'user',
    'active',
    v_tenant_id,
    (SELECT name FROM tenants WHERE id = v_tenant_id LIMIT 1),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

END $$;

-- ============================================================================
-- CRITICAL INSTRUCTIONS FOR LOCAL SUPABASE
-- ============================================================================
--
-- Step 1: Create users in Supabase Dashboard
--   - Open: http://localhost:54323
--   - Go to: Authentication → Users
--   - Click: "Add User"
--   - Create User 1:
--     Email: admin@techcorp.com
--     Password: password123
--     Auto Generate Password: OFF
--   - Copy the UUID that appears in the User ID column
--
-- Step 2: Update migration with correct UUIDs
--   - Replace '11111111-1111-1111-1111-111111111111' with admin user UUID
--   - Replace '22222222-2222-2222-2222-222222222222' with test user UUID
--
-- Step 3: Run migration
--   supabase db push
--
-- Step 4: Test login in app
--   - Email: admin@techcorp.com
--   - Password: password123
--
-- ============================================================================
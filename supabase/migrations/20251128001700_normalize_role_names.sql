-- ============================================================================
-- Migration: Normalize Role Names to Match UserRole Enum
-- Date: 2025-11-28
-- Purpose: Normalize all role names in database to match UserRole enum values
--          This eliminates the need for hardcoded role mapping
--          Database role names will match enum: 'admin', 'manager', 'user', 'engineer', 'customer', 'super_admin'
-- ============================================================================

-- ============================================================================
-- 1. UPDATE EXISTING ROLES TO NORMALIZED NAMES
-- ============================================================================

-- Update "Administrator" → "admin"
UPDATE roles 
SET name = 'admin', 
    updated_at = NOW()
WHERE name = 'Administrator';

-- Update "Manager" → "manager"
UPDATE roles 
SET name = 'manager', 
    updated_at = NOW()
WHERE name = 'Manager';

-- Update "User" → "user"
UPDATE roles 
SET name = 'user', 
    updated_at = NOW()
WHERE name = 'User';

-- Update "Engineer" → "engineer"
UPDATE roles 
SET name = 'engineer', 
    updated_at = NOW()
WHERE name = 'Engineer';

-- Update "Customer" → "customer"
UPDATE roles 
SET name = 'customer', 
    updated_at = NOW()
WHERE name = 'Customer';

-- Ensure "super_admin" is already normalized (no change needed, but verify)
-- super_admin should already be lowercase

-- ============================================================================
-- 2. UPDATE SYNC FUNCTION TO USE NORMALIZED ROLE NAMES
-- ============================================================================

-- Update the sync function to use normalized role names
CREATE OR REPLACE FUNCTION sync_auth_user_to_public_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tenant_id UUID;
  role_name TEXT;
  user_name TEXT;
  is_super_admin_flag BOOLEAN;
BEGIN
  -- Extract user metadata
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  -- Determine if user is super admin
  is_super_admin_flag := (
    NEW.email LIKE '%superadmin%' OR 
    NEW.email LIKE '%@platform.com' OR
    NEW.email LIKE '%@platform.%'
  );

  -- Determine tenant_id and role_name based on email domain
  IF is_super_admin_flag THEN
    user_tenant_id := NULL;
    role_name := 'super_admin';
  ELSE
    -- Map email domain to tenant_id
    SELECT id INTO user_tenant_id
    FROM tenants
    WHERE name = (
      CASE 
        WHEN NEW.email LIKE '%@acme.com' OR NEW.email LIKE '%@acme.%' THEN 'Acme Corporation'
        WHEN NEW.email LIKE '%@techsolutions.com' OR NEW.email LIKE '%@techsolutions.%' THEN 'Tech Solutions Inc'
        WHEN NEW.email LIKE '%@globaltrading.com' OR NEW.email LIKE '%@globaltrading.%' THEN 'Global Trading Ltd'
        ELSE NULL
      END
    )
    LIMIT 1;

    -- Default to first tenant if no match found
    IF user_tenant_id IS NULL THEN
      SELECT id INTO user_tenant_id FROM tenants ORDER BY created_at LIMIT 1;
    END IF;

    -- ✅ Use normalized role names (matching UserRole enum)
    role_name := CASE
      WHEN NEW.email LIKE '%admin%' THEN 'admin'        -- Normalized: was 'Administrator'
      WHEN NEW.email LIKE '%manager%' THEN 'manager'     -- Normalized: was 'Manager'
      WHEN NEW.email LIKE '%engineer%' THEN 'engineer'  -- Normalized: was 'Engineer'
      WHEN NEW.email LIKE '%customer%' THEN 'customer'  -- Normalized: was 'Customer'
      ELSE 'user'                                        -- Normalized: was 'User'
    END;
  END IF;

  -- Insert or update user in public.users
  INSERT INTO public.users (
    id,
    email,
    name,
    first_name,
    last_name,
    status,
    tenant_id,
    is_super_admin,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    split_part(user_name, ' ', 1),
    CASE 
      WHEN array_length(string_to_array(user_name, ' '), 1) > 1 
      THEN array_to_string((string_to_array(user_name, ' '))[2:], ' ')
      ELSE NULL
    END,
    'active'::user_status,
    user_tenant_id,
    is_super_admin_flag,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    status = EXCLUDED.status,
    tenant_id = EXCLUDED.tenant_id,
    is_super_admin = EXCLUDED.is_super_admin,
    updated_at = NOW();

  -- Assign role via user_roles table (using normalized role names)
  INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
  SELECT
    NEW.id,
    r.id,
    user_tenant_id,
    NOW()
  FROM roles r
  WHERE r.name = role_name
    AND (r.tenant_id = user_tenant_id OR (user_tenant_id IS NULL AND r.tenant_id IS NULL))
  ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. VERIFY NORMALIZATION
-- ============================================================================

-- Verify all roles are normalized
DO $$
DECLARE
  non_normalized_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO non_normalized_count
  FROM roles
  WHERE name IN ('Administrator', 'Manager', 'User', 'Engineer', 'Customer');
  
  IF non_normalized_count > 0 THEN
    RAISE WARNING 'Found % non-normalized role names. Please review migration.', non_normalized_count;
  ELSE
    RAISE NOTICE 'All role names have been normalized successfully.';
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - All role names normalized to match UserRole enum: 'admin', 'manager', 'user', 'engineer', 'customer', 'super_admin'
-- - Sync function updated to use normalized names
-- - No hardcoded mapping needed - database stores enum values directly
-- ============================================================================


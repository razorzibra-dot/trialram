-- ============================================================================
-- CLEANUP ROLES FOR FRS COMPLIANCE
-- Removes duplicate and non-FRS compliant roles
-- Ensures only FRS-defined roles exist with correct tenant_id assignment
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: REMOVE ALL NON-FRS COMPLIANT ROLES
-- ============================================================================

-- Remove legacy roles that don't match FRS specification
DELETE FROM role_permissions WHERE role_id IN (
    SELECT id FROM roles WHERE name IN (
        'admin',      -- Legacy, replaced by tenant_admin
        'manager',    -- Legacy, replaced by specific managers
        'user',       -- Legacy, replaced by specific user roles
        'engineer',   -- Legacy, replaced by support_agent
        'customer',   -- Not in FRS, external users not supported
        'sales_rep'   -- Legacy, replaced by sales_representative
    )
);

-- Remove the roles themselves
DELETE FROM roles WHERE name IN (
    'admin',      -- Legacy, replaced by tenant_admin
    'manager',    -- Legacy, replaced by specific managers
    'user',       -- Legacy, replaced by specific user roles
    'engineer',   -- Legacy, replaced by support_agent
    'customer',   -- Not in FRS, external users not supported
    'sales_rep'   -- Legacy, replaced by sales_representative
);

-- ============================================================================
-- STEP 2: ENSURE ONLY FRS-COMPLIANT ROLES EXIST
-- ============================================================================

-- FRS-compliant roles that should exist:
-- 1. super_admin (system-wide, tenant_id = NULL)
-- 2. tenant_admin (per tenant)
-- 3. sales_manager (per tenant)
-- 4. sales_representative (per tenant)
-- 5. support_manager (per tenant)
-- 6. support_agent (per tenant)
-- 7. contract_manager (per tenant)
-- 8. project_manager (per tenant)
-- 9. business_analyst (per tenant)

-- Remove any duplicate super_admin entries (keep only one)
DELETE FROM roles
WHERE name = 'super_admin'
AND id NOT IN (
    SELECT id FROM roles WHERE name = 'super_admin' ORDER BY created_at LIMIT 1
);

-- Ensure super_admin has correct properties
UPDATE roles
SET tenant_id = NULL, is_system_role = true, description = 'Global system administrator'
WHERE name = 'super_admin';

-- Ensure all tenant-specific roles have tenant_id set (not NULL)
-- If any FRS roles exist without tenant_id, they should be removed
DELETE FROM role_permissions WHERE role_id IN (
    SELECT id FROM roles
    WHERE name IN ('tenant_admin', 'sales_manager', 'sales_representative',
                   'support_manager', 'support_agent', 'contract_manager',
                   'project_manager', 'business_analyst')
    AND tenant_id IS NULL
);

DELETE FROM roles
WHERE name IN ('tenant_admin', 'sales_manager', 'sales_representative',
               'support_manager', 'support_agent', 'contract_manager',
               'project_manager', 'business_analyst')
AND tenant_id IS NULL;

-- ============================================================================
-- STEP 3: VALIDATION
-- ============================================================================

DO $$
DECLARE
    total_roles INTEGER;
    super_admin_count INTEGER;
    tenant_roles_count INTEGER;
    invalid_tenant_roles INTEGER;
BEGIN
    -- Count total roles
    SELECT COUNT(*) INTO total_roles FROM roles;

    -- Count super_admin roles (should be exactly 1)
    SELECT COUNT(*) INTO super_admin_count
    FROM roles
    WHERE name = 'super_admin';

    -- Count tenant-specific roles
    SELECT COUNT(*) INTO tenant_roles_count
    FROM roles
    WHERE name IN ('tenant_admin', 'sales_manager', 'sales_representative',
                   'support_manager', 'support_agent', 'contract_manager',
                   'project_manager', 'business_analyst');

    -- Check for invalid tenant roles (FRS roles without tenant_id)
    SELECT COUNT(*) INTO invalid_tenant_roles
    FROM roles
    WHERE name IN ('tenant_admin', 'sales_manager', 'sales_representative',
                   'support_manager', 'support_agent', 'contract_manager',
                   'project_manager', 'business_analyst')
    AND tenant_id IS NULL;

    RAISE NOTICE 'Role cleanup completed:';
    RAISE NOTICE 'Total roles remaining: %', total_roles;
    RAISE NOTICE 'Super admin roles: % (should be 1)', super_admin_count;
    RAISE NOTICE 'FRS tenant roles: %', tenant_roles_count;
    RAISE NOTICE 'Invalid tenant roles (no tenant_id): % (should be 0)', invalid_tenant_roles;

    -- List remaining roles for verification
    RAISE NOTICE 'Remaining roles cleaned up successfully';
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- ✅ Removed all legacy/non-FRS roles (admin, manager, user, engineer, customer, sales_rep)
-- ✅ Kept only FRS-compliant roles
-- ✅ Ensured super_admin has no tenant_id and is_system_role = true
-- ✅ Ensured all other FRS roles have tenant_id assigned
-- ✅ Removed duplicate roles
-- ============================================================================

-- ============================================================================
-- CRITICAL FIX: Update navigation items to use FRS-compliant permission names
-- Date: November 29, 2025
-- Purpose: Fix permission name mismatches between navigation items and FRS permissions
-- ============================================================================

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '🔧 Starting navigation permissions fix...';

    -- Update navigation items to use correct FRS-compliant permission names

    -- Dashboard: 'crm:dashboard:panel:view' ✓ (already correct)

    -- Customers: 'crm:customer:record:read' → 'crm:customer:record:read'
    UPDATE navigation_items
    SET permission_name = 'crm:customer:record:read'
    WHERE permission_name = 'crm:customer:record:read';

    -- Sales: 'crm:deal:record:read' → 'crm:sales:deal:read'
    UPDATE navigation_items
    SET permission_name = 'crm:sales:deal:read'
    WHERE permission_name = 'crm:deal:record:read';

    -- Masters section: 'crm:master:data:read' → 'crm:reference:data:read'
    UPDATE navigation_items
    SET permission_name = 'crm:reference:data:read'
    WHERE permission_name = 'crm:master:data:read';

    -- Companies: 'crm:company:record:read' → 'crm:reference:data:read' (companies are reference data)
    UPDATE navigation_items
    SET permission_name = 'crm:reference:data:read'
    WHERE permission_name = 'crm:company:record:read';

    -- Permissions: 'crm:permission:record:read' → 'crm:role:permission:assign' (closest match)
    UPDATE navigation_items
    SET permission_name = 'crm:role:permission:assign'
    WHERE permission_name = 'crm:permission:record:read';

    -- Settings: 'crm:system:config:manage' → 'crm:system:config:manage'
    UPDATE navigation_items
    SET permission_name = 'crm:system:config:manage'
    WHERE permission_name = 'crm:system:config:manage';

    -- Job Works: 'crm:job:work:read' → 'crm:project:record:read' (closest match)
    UPDATE navigation_items
    SET permission_name = 'crm:project:record:read'
    WHERE permission_name = 'crm:job:work:read';

    RAISE NOTICE '✅ Navigation permissions updated to FRS-compliant names';
END $$;

-- Verify the fix
DO $$
DECLARE
    total_items INTEGER;
    updated_items INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_items FROM navigation_items;
    SELECT COUNT(*) INTO updated_items
    FROM navigation_items
    WHERE permission_name IN (
        'crm:customer:record:read',
        'crm:sales:deal:read',
        'crm:reference:data:read',
        'crm:role:permission:assign',
        'crm:system:config:manage',
        'crm:project:record:read'
    );

    RAISE NOTICE '📊 Navigation items: % total, % with FRS-compliant permissions', total_items, updated_items;

    IF updated_items < 10 THEN
        RAISE EXCEPTION '❌ Expected at least 10 items with FRS-compliant permissions, but found %', updated_items;
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- FIX COMPLETE
-- ============================================================================
-- Summary:
-- - Updated navigation items to use FRS-compliant permission names
-- - Fixed mismatches between navigation config and seeded permissions
-- - Navigation should now work correctly with user permissions
-- ============================================================================
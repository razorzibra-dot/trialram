-- ============================================================================
-- Migration: Seed navigation items from current hardcoded config
-- Date: 2025-11-28
-- Purpose: Populate navigation_items table with existing navigation structure
-- ============================================================================

BEGIN;

DO $$
DECLARE
  default_tenant_id UUID;
  system_user_id UUID;
  admin_section_id UUID;
  masters_id UUID;
  users_id UUID;
  config_id UUID;
BEGIN
  -- Get default tenant
  SELECT id INTO default_tenant_id
  FROM tenants
  WHERE name = 'Acme Corporation'
  LIMIT 1;

  -- Get system user (first admin user) for created_by/updated_by
  SELECT id INTO system_user_id
  FROM users
  WHERE email = 'admin@acme.com'
  LIMIT 1;

  -- ============================================
  -- TENANT ITEMS - Available to tenant users only
  -- ============================================
  
  -- Dashboard
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/dashboard',
    'Dashboard',
    NULL,
    'crm:dashboard:panel:view',
    FALSE,
    1,
    '/tenant/dashboard',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Customers
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/customers',
    'Customers',
    NULL,
    'crm:customer:record:read',
    FALSE,
    2,
    '/tenant/customers',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Sales
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/sales',
    'Sales',
    NULL,
    'crm:deal:record:read',
    FALSE,
    3,
    '/tenant/sales',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Product Sales
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/product-sales',
    'Product Sales',
    NULL,
    'crm:product:record:read',
    FALSE,
    4,
    '/tenant/product-sales',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Contracts
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/contracts',
    'Contracts',
    NULL,
    'crm:contract:record:read',
    FALSE,
    5,
    '/tenant/contracts',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Service Contracts
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/service-contracts',
    'Service Contracts',
    NULL,
    'crm:contract:service:read',
    FALSE,
    6,
    '/tenant/service-contracts',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Support Tickets
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/tickets',
    'Support Tickets',
    NULL,
    'crm:support:ticket:read',
    FALSE,
    7,
    '/tenant/tickets',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Complaints
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/complaints',
    'Complaints',
    NULL,
    'crm:support:complaint:read',
    FALSE,
    8,
    '/tenant/complaints',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Job Works
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/job-works',
    'Job Works',
    NULL,
    'crm:job:work:read',
    FALSE,
    9,
    '/tenant/job-works',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- ============================================
  -- ADMINISTRATION SECTION
  -- ============================================
  
  -- Administration Section Header
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    'admin-section',
    'Administration',
    NULL,
    'crm:master:data:read',
    TRUE,
    10,
    NULL,
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Get admin-section ID for children
  SELECT id INTO admin_section_id
  FROM navigation_items
  WHERE key = 'admin-section'
  LIMIT 1;

  -- Masters (with children)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/masters',
    'Masters',
    admin_section_id,
    'crm:master:data:read',
    FALSE,
    11,
    '/tenant/masters',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Get masters ID for children
  SELECT id INTO masters_id
  FROM navigation_items
  WHERE key = '/tenant/masters'
  LIMIT 1;

  -- Companies (child of Masters)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/masters/companies',
    'Companies',
    masters_id,
    'crm:company:record:read',
    FALSE,
    1,
    '/tenant/masters/companies',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Products (child of Masters)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/masters/products',
    'Products',
    masters_id,
    'crm:product:record:read',
    FALSE,
    2,
    '/tenant/masters/products',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- User Management (with children)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/users',
    'User Management',
    admin_section_id,
    'crm:user:record:read',
    FALSE,
    12,
    '/tenant/users',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Get user management ID for children
  SELECT id INTO users_id
  FROM navigation_items
  WHERE key = '/tenant/users'
  LIMIT 1;

  -- Users (child of User Management)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/users/list',
    'Users',
    users_id,
    'crm:user:record:read',
    FALSE,
    1,
    '/tenant/users/list',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Roles (child of User Management)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/users/roles',
    'Roles',
    users_id,
    'crm:role:record:read',
    FALSE,
    2,
    '/tenant/users/roles',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Permissions (child of User Management)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/users/permissions',
    'Permissions',
    users_id,
    'crm:permission:record:read',
    FALSE,
    3,
    '/tenant/users/permissions',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Configuration (with children)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/configuration',
    'Configuration',
    admin_section_id,
    'crm:system:config:manage',
    FALSE,
    13,
    '/tenant/configuration',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Get configuration ID for children
  SELECT id INTO config_id
  FROM navigation_items
  WHERE key = '/tenant/configuration'
  LIMIT 1;

  -- Tenant Settings (child of Configuration)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/configuration/tenant',
    'Tenant Settings',
    config_id,
    'crm:system:config:manage',
    FALSE,
    1,
    '/tenant/configuration/tenant',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- PDF Templates (child of Configuration)
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/configuration/pdf-templates',
    'PDF Templates',
    config_id,
    'crm:system:config:manage',
    FALSE,
    2,
    '/tenant/configuration/pdf-templates',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Notifications
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/notifications',
    'Notifications',
    admin_section_id,
    'crm:notification:channel:manage',
    FALSE,
    14,
    '/tenant/notifications',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;

  -- Audit Logs
  INSERT INTO navigation_items (key, label, parent_id, permission_name, is_section, sort_order, route_path, tenant_id, is_system_item, is_active, created_by, updated_by)
  VALUES (
    '/tenant/logs',
    'Audit Logs',
    admin_section_id,
    'crm:audit:log:read',
    FALSE,
    15,
    '/tenant/logs',
    default_tenant_id,
    TRUE,
    TRUE,
    system_user_id,
    system_user_id
  ) ON CONFLICT (key) DO NOTHING;
END $$;

-- Verify the results
DO $$
DECLARE
  item_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO item_count FROM navigation_items;
  RAISE NOTICE '✅ Navigation items seeded: % items', item_count;
  
  IF item_count < 20 THEN
    RAISE EXCEPTION '❌ Expected at least 20 navigation items, but found %', item_count;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Seeded all navigation items from current hardcoded config
-- - Maintained hierarchical structure (parent_id relationships)
-- - Set is_system_item=TRUE for all items (they're system defaults)
-- - Set tenant_id to default tenant (Acme Corporation)
-- - All items are active by default
-- - Used ON CONFLICT DO NOTHING for idempotency
-- ============================================================================

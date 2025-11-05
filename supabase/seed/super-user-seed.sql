-- =====================================================
-- Super User Module - Seed Data (CORRECTED)
-- =====================================================
-- This file seeds test data for the Super User module
-- including super users, tenant access, impersonation logs,
-- statistics, and configuration overrides.
--
-- Updated: 2025-02-12
-- Changes: Fixed user IDs to match seed.sql, set tenant_id=NULL for super users
-- =====================================================

-- =====================================================
-- IMPORTANT: User IDs are now aligned with seed.sql
-- =====================================================
-- Super User 1: 7c370b02-fed9-45d8-85b8-414ce36a9d4c (admin@acme.com)
-- Super User 2: a17b04b5-e4cd-449f-8611-e5d4062b6cb6 (admin@techsolutions.com)
-- Super User 3: ae50f31a-e11d-42cc-b3ce-8cdcb7d64579 (admin@globaltrading.com)
--
-- Tenant IDs:
-- Tenant 1: 550e8400-e29b-41d4-a716-446655440001 (Acme Corporation)
-- Tenant 2: 550e8400-e29b-41d4-a716-446655440002 (Tech Solutions Inc)
-- Tenant 3: 550e8400-e29b-41d4-a716-446655440003 (Global Trading Ltd)

-- =====================================================
-- PHASE 1: ENSURE BASE TABLES EXIST
-- =====================================================
-- Note: tenants and users tables must exist before seeding
-- User records are created in seed.sql, we just mark them as super admins

-- =====================================================
-- PHASE 1.5: MARK USERS AS SUPER ADMINS (in main seed.sql)
-- =====================================================
-- This is done in seed.sql using UPDATE statement
-- Users must be marked with:
--   is_super_admin = true
--   tenant_id = NULL  (after making tenant_id nullable)

-- =====================================================
-- PHASE 2: SEED SUPER USER TENANT ACCESS
-- =====================================================
-- Tracks which tenants each super user can manage
-- This table defines the access relationships for super users

INSERT INTO super_user_tenant_access (
    id, 
    super_user_id, 
    tenant_id, 
    access_level, 
    created_at, 
    updated_at
) VALUES 
    -- Super User 1 (admin@acme.com): Full platform access (manages all 3 tenants)
    ('550e8400-e29b-41d4-a716-446655500001'::uuid, 
     '7c370b02-fed9-45d8-85b8-414ce36a9d4c'::uuid,
     '550e8400-e29b-41d4-a716-446655440001'::uuid,  -- Acme Corporation
     'full',
     NOW(),
     NOW()),
    
    ('550e8400-e29b-41d4-a716-446655500002'::uuid,
     '7c370b02-fed9-45d8-85b8-414ce36a9d4c'::uuid,
     '550e8400-e29b-41d4-a716-446655440002'::uuid,  -- Tech Solutions Inc
     'full',
     NOW(),
     NOW()),
    
    ('550e8400-e29b-41d4-a716-446655500003'::uuid,
     '7c370b02-fed9-45d8-85b8-414ce36a9d4c'::uuid,
     '550e8400-e29b-41d4-a716-446655440003'::uuid,  -- Global Trading Ltd
     'full',
     NOW(),
     NOW()),
    
    -- Super User 2 (admin@techsolutions.com): Limited access (manages tech + global)
    ('550e8400-e29b-41d4-a716-446655500004'::uuid,
     'a17b04b5-e4cd-449f-8611-e5d4062b6cb6'::uuid,
     '550e8400-e29b-41d4-a716-446655440002'::uuid,  -- Tech Solutions Inc
     'full',
     NOW(),
     NOW()),
    
    ('550e8400-e29b-41d4-a716-446655500005'::uuid,
     'a17b04b5-e4cd-449f-8611-e5d4062b6cb6'::uuid,
     '550e8400-e29b-41d4-a716-446655440003'::uuid,  -- Global Trading Ltd
     'limited',
     NOW(),
     NOW()),
    
    -- Super User 3 (admin@globaltrading.com): Read-only access to global trading
    ('550e8400-e29b-41d4-a716-446655500006'::uuid,
     'ae50f31a-e11d-42cc-b3ce-8cdcb7d64579'::uuid,
     '550e8400-e29b-41d4-a716-446655440003'::uuid,  -- Global Trading Ltd
     'full',
     NOW(),
     NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- PHASE 3: SEED IMPERSONATION AUDIT LOGS
-- =====================================================
-- Historical impersonation sessions for testing

INSERT INTO super_user_impersonation_logs (
    id,
    super_user_id,
    impersonated_user_id,
    tenant_id,
    reason,
    login_at,
    logout_at,
    actions_taken,
    ip_address,
    user_agent,
    created_at,
    updated_at
) VALUES
    -- Session 1: Super User 1 impersonating manager@acme.com in Acme
    ('650e8400-e29b-41d4-a716-446655600001'::uuid,
     '7c370b02-fed9-45d8-85b8-414ce36a9d4c'::uuid,
     '5e543818-4341-4ccf-b5cd-21cd2173735f'::uuid,
     '550e8400-e29b-41d4-a716-446655440001'::uuid,
     'Troubleshooting customer contract issue',
     NOW() - INTERVAL '2 days',
     NOW() - INTERVAL '2 days' + INTERVAL '30 minutes',
     '[{"action": "view_contract", "count": 3}, {"action": "export_pdf", "timestamp": "2025-02-09T14:25:00Z"}]'::jsonb,
     '192.168.1.100',
     'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
     NOW() - INTERVAL '2 days',
     NOW() - INTERVAL '2 days' + INTERVAL '30 minutes'),
    
    -- Session 2: Super User 1 impersonating engineer@acme.com in Acme
    ('650e8400-e29b-41d4-a716-446655600002'::uuid,
     '7c370b02-fed9-45d8-85b8-414ce36a9d4c'::uuid,
     '9c124de0-f75c-44e8-9315-23d5a1f126ae'::uuid,
     '550e8400-e29b-41d4-a716-446655440001'::uuid,
     'Testing new sales feature',
     NOW() - INTERVAL '1 day',
     NOW() - INTERVAL '1 day' + INTERVAL '45 minutes',
     '[{"action": "create_deal", "count": 1}, {"action": "update_contact", "count": 5}]'::jsonb,
     '192.168.1.101',
     'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
     NOW() - INTERVAL '1 day',
     NOW() - INTERVAL '1 day' + INTERVAL '45 minutes'),
    
    -- Session 3: Super User 2 impersonating manager@techsolutions.com - Active/ongoing session
    ('650e8400-e29b-41d4-a716-446655600003'::uuid,
     'a17b04b5-e4cd-449f-8611-e5d4062b6cb6'::uuid,
     'e172c9ba-16e9-4a51-abec-2041de8cdff9'::uuid,
     '550e8400-e29b-41d4-a716-446655440002'::uuid,
     'Support ticket investigation',
     NOW() - INTERVAL '1 hour',
     NULL,
     '[]'::jsonb,
     '192.168.1.102',
     'Mozilla/5.0 (X11; Linux x86_64)',
     NOW() - INTERVAL '1 hour',
     NOW() - INTERVAL '1 hour'),
    
    -- Session 4: Super User 1 in Tech Solutions tenant (historical session - completed)
    ('650e8400-e29b-41d4-a716-446655600004'::uuid,
     '7c370b02-fed9-45d8-85b8-414ce36a9d4c'::uuid,
     'e172c9ba-16e9-4a51-abec-2041de8cdff9'::uuid,
     '550e8400-e29b-41d4-a716-446655440002'::uuid,
     'Debug notification system',
     NOW() - INTERVAL '5 days',
     NOW() - INTERVAL '5 days' + INTERVAL '2 hours',
     '[{"action": "check_logs", "count": 10}]'::jsonb,
     '192.168.1.103',
     'Chrome/120.0.0.0',
     NOW() - INTERVAL '5 days',
     NOW() - INTERVAL '5 days' + INTERVAL '2 hours'),
    
    -- Session 5: Super User 3 in Global Trading (another historical session)
    ('650e8400-e29b-41d4-a716-446655600005'::uuid,
     'ae50f31a-e11d-42cc-b3ce-8cdcb7d64579'::uuid,
     'a50e8400-e29b-41d4-a716-446655440005'::uuid,
     '550e8400-e29b-41d4-a716-446655440003'::uuid,
     'Monthly audit check',
     NOW() - INTERVAL '10 days',
     NOW() - INTERVAL '10 days' + INTERVAL '1 hour',
     '[{"action": "audit_review", "items": 50}]'::jsonb,
     '192.168.1.104',
     'Safari/537.36',
     NOW() - INTERVAL '10 days',
     NOW() - INTERVAL '10 days' + INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- =====================================================
-- PHASE 4: SEED TENANT STATISTICS
-- =====================================================
-- Aggregate metrics for tenant analytics

INSERT INTO tenant_statistics (
    id,
    tenant_id,
    metric_type,
    metric_value,
    recorded_at,
    updated_at
) VALUES
    -- Tenant 1 (Acme) Statistics
    ('750e8400-e29b-41d4-a716-446655700001'::uuid,
     '550e8400-e29b-41d4-a716-446655440001'::uuid,
     'active_users'::metric_type_enum,
     120.00,
     NOW(),
     NOW()),
    
    ('750e8400-e29b-41d4-a716-446655700002'::uuid,
     '550e8400-e29b-41d4-a716-446655440001'::uuid,
     'total_contracts'::metric_type_enum,
     85.00,
     NOW(),
     NOW()),
    
    ('750e8400-e29b-41d4-a716-446655700003'::uuid,
     '550e8400-e29b-41d4-a716-446655440001'::uuid,
     'total_sales'::metric_type_enum,
     250.00,
     NOW(),
     NOW()),
    
    ('750e8400-e29b-41d4-a716-446655700004'::uuid,
     '550e8400-e29b-41d4-a716-446655440001'::uuid,
     'total_transactions'::metric_type_enum,
     1250.00,
     NOW(),
     NOW()),
    
    ('750e8400-e29b-41d4-a716-446655700005'::uuid,
     '550e8400-e29b-41d4-a716-446655440001'::uuid,
     'disk_usage'::metric_type_enum,
     5120.50,
     NOW(),
     NOW()),
    
    ('750e8400-e29b-41d4-a716-446655700006'::uuid,
     '550e8400-e29b-41d4-a716-446655440001'::uuid,
     'api_calls_daily'::metric_type_enum,
     2500.00,
     NOW(),
     NOW()),
    
    -- Tenant 2 (Tech Solutions) Statistics
    ('750e8400-e29b-41d4-a716-446655700007'::uuid,
     '550e8400-e29b-41d4-a716-446655440002'::uuid,
     'active_users'::metric_type_enum,
     65.00,
     NOW(),
     NOW()),
    
    ('750e8400-e29b-41d4-a716-446655700008'::uuid,
     '550e8400-e29b-41d4-a716-446655440002'::uuid,
     'total_contracts'::metric_type_enum,
     42.00,
     NOW(),
     NOW()),
    
    ('750e8400-e29b-41d4-a716-446655700009'::uuid,
     '550e8400-e29b-41d4-a716-446655440002'::uuid,
     'total_sales'::metric_type_enum,
     120.00,
     NOW(),
     NOW()),
    
    ('750e8400-e29b-41d4-a716-446655700010'::uuid,
     '550e8400-e29b-41d4-a716-446655440002'::uuid,
     'disk_usage'::metric_type_enum,
     2560.75,
     NOW(),
     NOW()),
    
    -- Tenant 3 (Global Trading) Statistics
    ('750e8400-e29b-41d4-a716-446655700011'::uuid,
     '550e8400-e29b-41d4-a716-446655440003'::uuid,
     'active_users'::metric_type_enum,
     15.00,
     NOW(),
     NOW()),
    
    ('750e8400-e29b-41d4-a716-446655700012'::uuid,
     '550e8400-e29b-41d4-a716-446655440003'::uuid,
     'total_contracts'::metric_type_enum,
     8.00,
     NOW(),
     NOW()),
    
    ('750e8400-e29b-41d4-a716-446655700013'::uuid,
     '550e8400-e29b-41d4-a716-446655440003'::uuid,
     'total_sales'::metric_type_enum,
     25.00,
     NOW(),
     NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- PHASE 5: SEED TENANT CONFIG OVERRIDES
-- =====================================================
-- Configuration overrides applied by super users

INSERT INTO tenant_config_overrides (
    id,
    tenant_id,
    config_key,
    config_value,
    override_reason,
    created_by,
    created_at,
    expires_at,
    updated_at
) VALUES
    -- Permanent override for Acme (no expiration)
    ('850e8400-e29b-41d4-a716-446655800001'::uuid,
     '550e8400-e29b-41d4-a716-446655440001'::uuid,
     'max_users',
     '{"value": 200, "enabled": true}'::jsonb,
     'Increased user limit for Q2 expansion',
     '7c370b02-fed9-45d8-85b8-414ce36a9d4c'::uuid,
     NOW() - INTERVAL '30 days',
     NULL,
     NOW() - INTERVAL '30 days'),
    
    -- Temporary override for Acme (expires in future)
    ('850e8400-e29b-41d4-a716-446655800002'::uuid,
     '550e8400-e29b-41d4-a716-446655440001'::uuid,
     'feature_beta_sales_analytics',
     '{"enabled": true, "beta_id": "beta_sa_v2"}'::jsonb,
     'Testing new sales analytics feature',
     '7c370b02-fed9-45d8-85b8-414ce36a9d4c'::uuid,
     NOW(),
     NOW() + INTERVAL '30 days',
     NOW()),
    
    -- Temporary override for Tech Solutions (expired)
    ('850e8400-e29b-41d4-a716-446655800003'::uuid,
     '550e8400-e29b-41d4-a716-446655440002'::uuid,
     'maintenance_mode',
     '{"enabled": false, "message": ""}'::jsonb,
     'Maintenance window completed',
     'a17b04b5-e4cd-449f-8611-e5d4062b6cb6'::uuid,
     NOW() - INTERVAL '5 days',
     NOW() - INTERVAL '2 days',
     NOW() - INTERVAL '2 days'),
    
    -- Active temporary override for Tech Solutions
    ('850e8400-e29b-41d4-a716-446655800004'::uuid,
     '550e8400-e29b-41d4-a716-446655440002'::uuid,
     'api_rate_limit',
     '{"requests_per_minute": 2000, "requests_per_hour": 50000}'::jsonb,
     'Increased API rate limit for integration partner',
     'a17b04b5-e4cd-449f-8611-e5d4062b6cb6'::uuid,
     NOW() - INTERVAL '10 days',
     NOW() + INTERVAL '50 days',
     NOW()),
    
    -- Permanent permission change for Global Trading
    ('850e8400-e29b-41d4-a716-446655800005'::uuid,
     '550e8400-e29b-41d4-a716-446655440003'::uuid,
     'allowed_modules',
     '{"sales": true, "contracts": true, "customers": true, "jobworks": false, "products": false}'::jsonb,
     'Limited module access per customer agreement',
     'ae50f31a-e11d-42cc-b3ce-8cdcb7d64579'::uuid,
     NOW() - INTERVAL '60 days',
     NULL,
     NOW() - INTERVAL '60 days')
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify super user tenant access was seeded
SELECT 
    COUNT(*) as super_user_tenant_access_count,
    'super_user_tenant_access' as table_name
FROM super_user_tenant_access;

-- Verify impersonation logs were seeded
SELECT 
    COUNT(*) as impersonation_logs_count,
    'super_user_impersonation_logs' as table_name
FROM super_user_impersonation_logs;

-- Verify tenant statistics were seeded
SELECT 
    COUNT(*) as tenant_statistics_count,
    'tenant_statistics' as table_name
FROM tenant_statistics;

-- Verify tenant config overrides were seeded
SELECT 
    COUNT(*) as tenant_config_overrides_count,
    'tenant_config_overrides' as table_name
FROM tenant_config_overrides;

-- Show super user access mappings
SELECT 
    u.email,
    u.name,
    u.is_super_admin,
    u.tenant_id,
    t.name as managed_tenant,
    suta.access_level
FROM super_user_tenant_access suta
JOIN users u ON suta.super_user_id = u.id
JOIN tenants t ON suta.tenant_id = t.id
ORDER BY u.email, t.name;
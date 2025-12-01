-- ============================================================================
-- ENHANCED DATABASE DATA VALIDATION SCRIPT
-- Task: 4.1.1 - Update check_data.sql with comprehensive queries
-- Task: 4.1.2 - Enhance check_policies.sql scope  
-- Task: 4.1.3 - Add permission format validation
-- Task: 4.1.4 - Add auth user sync validation
-- Task: 4.1.5 - Add migration status checks
-- ============================================================================

-- ============================================================================
-- SECTION 1: CORE TABLE VALIDATION
-- ============================================================================

-- Tenants validation
SELECT 
    'TENANTS' as section,
    tenant_id,
    name as tenant_name,
    domain,
    status,
    plan_type,
    created_at
FROM tenants 
ORDER BY tenant_id;

-- Count tenants by status
SELECT 
    'TENANT_STATUS_COUNTS' as report_type,
    status,
    COUNT(*) as count
FROM tenants 
GROUP BY status;

-- ============================================================================
-- SECTION 2: USER DATA VALIDATION
-- ============================================================================

-- Users validation with tenant information
SELECT 
    'USERS_WITH_TENANTS' as section,
    u.id,
    u.email,
    u.full_name,
    u.is_super_admin,
    u.is_active,
    u.created_at,
    t.name as tenant_name,
    t.id as tenant_id
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
ORDER BY u.email;

-- User count by tenant
SELECT 
    'USER_COUNTS_BY_TENANT' as report_type,
    t.name as tenant,
    COUNT(u.id) as user_count,
    COUNT(CASE WHEN u.is_super_admin THEN 1 END) as super_admin_count
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
GROUP BY t.id, t.name
ORDER BY t.name;

-- Super admin validation
SELECT 
    'SUPER_ADMINS' as section,
    id,
    email,
    full_name,
    is_super_admin,
    tenant_id,
    created_at
FROM users 
WHERE is_super_admin = true
ORDER BY email;

-- ============================================================================
-- SECTION 3: RBAC SYSTEM VALIDATION
-- ============================================================================

-- Roles validation
SELECT 
    'ROLES' as section,
    id,
    name,
    description,
    is_system_role,
    created_at
FROM roles 
ORDER BY name;

-- Permissions validation with format check
SELECT 
    'PERMISSIONS_WITH_FORMAT' as section,
    id,
    name,
    description,
    category,
    resource,
    action,
    CASE 
        WHEN name LIKE '%:%' THEN 'resource:action'
        WHEN name IN ('read', 'write', 'delete', 'super_admin', 'crm:platform:control:admin') THEN 'simple'
        ELSE 'legacy'
    END as format_type,
    is_system_permission,
    created_at
FROM permissions 
ORDER BY category, name;

-- Permission format analysis
SELECT 
    'PERMISSION_FORMAT_ANALYSIS' as report_type,
    CASE 
        WHEN name LIKE '%:%' THEN 'resource:action'
        WHEN name IN ('read', 'write', 'delete', 'super_admin', 'crm:platform:control:admin') THEN 'simple'
        ELSE 'legacy'
    END as format_type,
    COUNT(*) as count
FROM permissions 
GROUP BY format_type
ORDER BY format_type;

-- Role-Permission assignments
SELECT 
    'ROLE_PERMISSIONS' as section,
    r.name as role,
    p.name as permission,
    p.category,
    rp.granted_by,
    u.email as granted_by_user
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
LEFT JOIN users u ON rp.granted_by = u.id
ORDER BY r.name, p.category, p.name;

-- ============================================================================
-- SECTION 4: USER ROLE ASSIGNMENTS
-- ============================================================================

-- User role assignments with tenant context
SELECT 
    'USER_ROLES' as section,
    u.email,
    u.full_name,
    r.name as role,
    t.name as tenant,
    ur.assigned_at
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN tenants t ON ur.tenant_id = t.id
ORDER BY u.email, r.name;

-- ============================================================================
-- SECTION 5: CRM DATA VALIDATION
-- ============================================================================

-- Customers validation
SELECT 
    'CUSTOMERS' as section,
    c.id,
    c.company_name,
    c.contact_person,
    c.email,
    c.phone,
    c.tenant_id,
    t.name as tenant_name,
    c.created_at,
    c.updated_at
FROM customers c
LEFT JOIN tenants t ON c.tenant_id = t.id
ORDER BY c.tenant_id, c.company_name;

-- Customer count by tenant
SELECT 
    'CUSTOMER_COUNTS_BY_TENANT' as report_type,
    t.name as tenant,
    COUNT(c.id) as customer_count
FROM tenants t
LEFT JOIN customers c ON t.id = c.tenant_id
GROUP BY t.id, t.name
ORDER BY t.name;

-- ============================================================================
-- SECTION 6: SALES DATA VALIDATION
-- ============================================================================

-- Sales validation
SELECT 
    'SALES' as section,
    s.id,
    s.title,
    s.stage,
    s.value,
    s.expected_close_date,
    s.customer_id,
    c.company_name as customer,
    s.tenant_id,
    t.name as tenant_name,
    s.created_at
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN tenants t ON s.tenant_id = t.id
ORDER BY s.tenant_id, s.stage, s.created_at DESC;

-- ============================================================================
-- SECTION 7: CONTRACT DATA VALIDATION
-- ============================================================================

-- Contracts validation
SELECT 
    'CONTRACTS' as section,
    ct.id,
    ct.title,
    ct.contract_type,
    ct.status,
    ct.start_date,
    ct.end_date,
    ct.value,
    ct.customer_id,
    c.company_name as customer,
    ct.tenant_id,
    t.name as tenant_name,
    ct.created_at
FROM contracts ct
LEFT JOIN customers c ON ct.customer_id = c.id
LEFT JOIN tenants t ON ct.tenant_id = t.id
ORDER BY ct.tenant_id, ct.contract_type, ct.created_at DESC;

-- ============================================================================
-- SECTION 8: REFERENCE DATA VALIDATION
-- ============================================================================

-- Reference data validation (original content preserved and enhanced)
SELECT 
    'REFERENCE_DATA_BY_TENANT' as section,
    tenant_id,
    category,
    COUNT(*) as count
FROM reference_data 
GROUP BY tenant_id, category 
ORDER BY tenant_id, category;

SELECT 
    'REFERENCE_DATA_SUMMARY' as section,
    'Total records' as label,
    COUNT(*) as count
FROM reference_data;

SELECT 
    'INDUSTRY_REFERENCE' as section,
    *
FROM reference_data 
WHERE category IN ('industry', 'company_size') 
ORDER BY category, sort_order;

-- ============================================================================
-- SECTION 9: AUDIT LOGS VALIDATION
-- ============================================================================

-- Audit logs validation
SELECT 
    'AUDIT_LOGS' as section,
    al.id,
    al.table_name,
    al.record_id,
    al.action,
    al.user_id,
    u.email as user_email,
    al.timestamp,
    al.details
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.timestamp DESC
LIMIT 50;

-- Audit log counts by action
SELECT 
    'AUDIT_ACTION_COUNTS' as report_type,
    action,
    COUNT(*) as count
FROM audit_logs 
GROUP BY action
ORDER BY count DESC;

-- ============================================================================
-- SECTION 10: AUTH USER SYNCHRONIZATION VALIDATION
-- ============================================================================

-- Auth user ID validation (Task 4.1.4)
SELECT 
    'AUTH_USER_SYNC_VALIDATION' as section,
    'admin@acme.com' as email,
    '6e084750-4e35-468c-9903-5b5ab9d14af4'::UUID as expected_id,
    id as actual_id,
    CASE WHEN id = '6e084750-4e35-468c-9903-5b5ab9d14af4'::UUID THEN 'MATCH' ELSE 'MISMATCH' END as status
FROM users WHERE email = 'admin@acme.com'

UNION ALL

SELECT 
    'AUTH_USER_SYNC_VALIDATION' as section,
    'manager@acme.com' as email,
    '2707509b-57e8-4c84-a6fe-267eaa724223'::UUID as expected_id,
    id as actual_id,
    CASE WHEN id = '2707509b-57e8-4c84-a6fe-267eaa724223'::UUID THEN 'MATCH' ELSE 'MISMATCH' END as status
FROM users WHERE email = 'manager@acme.com'

UNION ALL

SELECT 
    'AUTH_USER_SYNC_VALIDATION' as section,
    'superadmin@platform.com' as email,
    '465f34f1-e33c-475b-b42d-4feb4feaaf92'::UUID as expected_id,
    id as actual_id,
    CASE WHEN id = '465f34f1-e33c-475b-b42d-4feb4feaaf92'::UUID THEN 'MATCH' ELSE 'MISMATCH' END as status
FROM users WHERE email = 'superadmin@platform.com';

-- ============================================================================
-- SECTION 11: MIGRATION STATUS CHECKS
-- ============================================================================

-- Migration status validation (Task 4.1.5)
SELECT 
    'MIGRATION_STATUS' as section,
    version,
    inserted_at as executed_at,
    CASE 
        WHEN version = '20251122000002' THEN 'CRITICAL_PERMISSION_MIGRATION'
        WHEN version LIKE '%audit%' THEN 'AUDIT_RELATED'
        WHEN version LIKE '%auth%' THEN 'AUTH_RELATED'
        ELSE 'OTHER'
    END as migration_type
FROM supabase_migrations.schema_migrations
ORDER BY version;

-- ============================================================================
-- SECTION 12: SUMMARY STATISTICS
-- ============================================================================

SELECT 
    'DATABASE_SUMMARY' as section,
    'Total Tenants' as metric,
    COUNT(*) as count
FROM tenants

UNION ALL

SELECT 
    'DATABASE_SUMMARY' as section,
    'Total Users' as metric,
    COUNT(*) as count
FROM users

UNION ALL

SELECT 
    'DATABASE_SUMMARY' as section,
    'Total Roles' as metric,
    COUNT(*) as count
FROM roles

UNION ALL

SELECT 
    'DATABASE_SUMMARY' as section,
    'Total Permissions' as metric,
    COUNT(*) as count
FROM permissions

UNION ALL

SELECT 
    'DATABASE_SUMMARY' as section,
    'Total Customers' as metric,
    COUNT(*) as count
FROM customers

UNION ALL

SELECT 
    'DATABASE_SUMMARY' as section,
    'Total Sales Records' as metric,
    COUNT(*) as count
FROM sales

UNION ALL

SELECT 
    'DATABASE_SUMMARY' as section,
    'Total Contracts' as metric,
    COUNT(*) as count
FROM contracts

UNION ALL

SELECT 
    'DATABASE_SUMMARY' as section,
    'Total Audit Logs' as metric,
    COUNT(*) as count
FROM audit_logs;
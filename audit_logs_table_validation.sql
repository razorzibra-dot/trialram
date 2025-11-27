-- ============================================================================
-- Audit Logs Table Validation Script
-- Phase 4: Database Schema Validation - Audit Logs Table
-- ============================================================================

-- 1. Verify all columns exist with correct types and constraints
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;

-- 2. Verify constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'audit_logs'::regclass
ORDER BY conname;

-- 3. Verify indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'audit_logs'
ORDER BY indexname;

-- 4. Verify RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'audit_logs';

-- 5. Verify RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'audit_logs'
ORDER BY policyname;

-- 6. Test audit trail completeness - Check log distribution by action
SELECT
    action,
    COUNT(*) as log_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT tenant_id) as unique_tenants
FROM audit_logs
GROUP BY action
ORDER BY log_count DESC;

-- 7. Verify log retention - Check log age distribution
SELECT
    CASE
        WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN 'Last hour'
        WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '1 day' THEN 'Last 24 hours'
        WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 'Last week'
        WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 'Last month'
        ELSE 'Older'
    END as time_period,
    COUNT(*) as log_count
FROM audit_logs
GROUP BY
    CASE
        WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN 'Last hour'
        WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '1 day' THEN 'Last 24 hours'
        WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 'Last week'
        WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 'Last month'
        ELSE 'Older'
    END
ORDER BY
    CASE
        WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN 1
        WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '1 day' THEN 2
        WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 3
        WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 4
        ELSE 5
    END;

-- 8. Test log querying - Check entity types being audited
SELECT
    entity_type,
    COUNT(*) as log_count,
    COUNT(DISTINCT entity_id) as unique_entities,
    MIN(created_at) as first_log,
    MAX(created_at) as last_log
FROM audit_logs
WHERE entity_type IS NOT NULL
GROUP BY entity_type
ORDER BY log_count DESC;

-- 9. Check audit log completeness - Users with/without audit trails
SELECT
    'Users with audit logs' as metric,
    COUNT(DISTINCT al.user_id) as count
FROM audit_logs al
WHERE al.user_id IS NOT NULL
UNION ALL
SELECT
    'Total active users' as metric,
    COUNT(*) as count
FROM users
WHERE deleted_at IS NULL
UNION ALL
SELECT
    'Users without audit logs' as metric,
    (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) -
    (SELECT COUNT(DISTINCT user_id) FROM audit_logs WHERE user_id IS NOT NULL) as count;

-- 10. Verify tenant isolation in audit logs
SELECT
    al.tenant_id,
    t.name as tenant_name,
    COUNT(*) as audit_logs_count,
    COUNT(DISTINCT al.user_id) as users_with_logs,
    MIN(al.created_at) as oldest_log,
    MAX(al.created_at) as newest_log
FROM audit_logs al
LEFT JOIN tenants t ON al.tenant_id = t.id
GROUP BY al.tenant_id, t.name
ORDER BY audit_logs_count DESC;

-- 11. Check for orphaned audit log references
SELECT
    'Orphaned user references' as issue,
    COUNT(*) as count
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.user_id IS NOT NULL AND u.id IS NULL
UNION ALL
SELECT
    'Orphaned tenant references' as issue,
    COUNT(*) as count
FROM audit_logs al
LEFT JOIN tenants t ON al.tenant_id = t.id
WHERE t.id IS NULL;

-- 12. Test audit log metadata completeness
SELECT
    'Logs with changes data' as metric,
    COUNT(CASE WHEN changes IS NOT NULL THEN 1 END) as count
FROM audit_logs
UNION ALL
SELECT
    'Logs with description' as metric,
    COUNT(CASE WHEN description IS NOT NULL THEN 1 END) as count
FROM audit_logs
UNION ALL
SELECT
    'Logs with IP address' as metric,
    COUNT(CASE WHEN ip_address IS NOT NULL THEN 1 END) as count
FROM audit_logs
UNION ALL
SELECT
    'Logs with user agent' as metric,
    COUNT(CASE WHEN user_agent IS NOT NULL THEN 1 END) as count
FROM audit_logs;

-- 13. Check audit log resource tracking
SELECT
    resource,
    COUNT(*) as log_count,
    COUNT(DISTINCT resource_id) as unique_resources,
    COUNT(DISTINCT user_id) as unique_actors
FROM audit_logs
WHERE resource IS NOT NULL
GROUP BY resource
ORDER BY log_count DESC;

-- 14. Verify audit log user identification
SELECT
    'Logs with user_email' as metric,
    COUNT(CASE WHEN user_email IS NOT NULL THEN 1 END) as count
FROM audit_logs
UNION ALL
SELECT
    'Logs with user_name' as metric,
    COUNT(CASE WHEN user_name IS NOT NULL THEN 1 END) as count
FROM audit_logs
UNION ALL
SELECT
    'Logs with both email and name' as metric,
    COUNT(CASE WHEN user_email IS NOT NULL AND user_name IS NOT NULL THEN 1 END) as count
FROM audit_logs;

-- 15. Check audit log action distribution
SELECT
    action,
    COUNT(*) as frequency,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM audit_logs
GROUP BY action
ORDER BY frequency DESC;
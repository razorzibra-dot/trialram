-- ============================================================================
-- Ticket Tables Validation Script
-- Phase 4: Database Schema Validation - Ticket Tables
-- ============================================================================

-- ============================================================================
-- 1. TICKETS TABLE VALIDATION
-- ============================================================================

-- 1.1 Verify tickets table columns
SELECT
    'tickets' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'tickets'
ORDER BY ordinal_position;

-- 1.2 Verify tickets table constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'tickets'::regclass
ORDER BY conname;

-- 1.3 Verify tickets table indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'tickets'
ORDER BY indexname;

-- 1.4 Check tickets table RLS
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'tickets';

-- 1.5 Verify tickets table RLS policies
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
WHERE tablename = 'tickets'
ORDER BY policyname;

-- ============================================================================
-- 2. TICKET_COMMENTS TABLE VALIDATION
-- ============================================================================

-- 2.1 Verify ticket_comments table columns
SELECT
    'ticket_comments' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'ticket_comments'
ORDER BY ordinal_position;

-- 2.2 Verify ticket_comments table constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ticket_comments'::regclass
ORDER BY conname;

-- 2.3 Verify ticket_comments table indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'ticket_comments'
ORDER BY indexname;

-- 2.4 Check ticket_comments table RLS
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'ticket_comments';

-- 2.5 Verify ticket_comments table RLS policies
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
WHERE tablename = 'ticket_comments'
ORDER BY policyname;

-- ============================================================================
-- 3. TICKET_ACTIVITIES TABLE VALIDATION
-- ============================================================================

-- 3.1 Verify ticket_activities table columns
SELECT
    'ticket_activities' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'ticket_activities'
ORDER BY ordinal_position;

-- 3.2 Verify ticket_activities table constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ticket_activities'::regclass
ORDER BY conname;

-- 3.3 Verify ticket_activities table indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'ticket_activities'
ORDER BY indexname;

-- 3.4 Check ticket_activities table RLS
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'ticket_activities';

-- 3.5 Verify ticket_activities table RLS policies
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
WHERE tablename = 'ticket_activities'
ORDER BY policyname;

-- ============================================================================
-- 4. TICKET_ATTACHMENTS TABLE VALIDATION
-- ============================================================================

-- 4.1 Verify ticket_attachments table columns
SELECT
    'ticket_attachments' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'ticket_attachments'
ORDER BY ordinal_position;

-- 4.2 Verify ticket_attachments table constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'ticket_attachments'::regclass
ORDER BY conname;

-- 4.3 Verify ticket_attachments table indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'ticket_attachments'
ORDER BY indexname;

-- 4.4 Check ticket_attachments table RLS
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'ticket_attachments';

-- 4.5 Verify ticket_attachments table RLS policies
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
WHERE tablename = 'ticket_attachments'
ORDER BY policyname;

-- ============================================================================
-- 5. CROSS-TABLE RELATIONSHIP VALIDATION
-- ============================================================================

-- 5.1 Check for orphaned ticket_comments (ticket relationship)
SELECT
    'Orphaned ticket_comments (ticket)' as issue,
    COUNT(*) as count
FROM ticket_comments tc
LEFT JOIN tickets t ON tc.ticket_id = t.id
WHERE t.id IS NULL;

-- 5.2 Check for orphaned ticket_activities (ticket relationship)
SELECT
    'Orphaned ticket_activities (ticket)' as issue,
    COUNT(*) as count
FROM ticket_activities ta
LEFT JOIN tickets t ON ta.ticket_id = t.id
WHERE t.id IS NULL;

-- 5.3 Check for orphaned ticket_attachments (ticket relationship)
SELECT
    'Orphaned ticket_attachments (ticket)' as issue,
    COUNT(*) as count
FROM ticket_attachments ta
LEFT JOIN tickets t ON ta.ticket_id = t.id
WHERE t.id IS NULL;

-- 5.4 Check for orphaned tickets (customer relationship)
SELECT
    'Orphaned tickets (customer)' as issue,
    COUNT(*) as count
FROM tickets t
LEFT JOIN customers c ON t.customer_id = c.id
WHERE c.id IS NULL AND t.customer_id IS NOT NULL;

-- 5.5 Check for orphaned tickets (assigned_to relationship)
SELECT
    'Orphaned tickets (assigned_to)' as issue,
    COUNT(*) as count
FROM tickets t
LEFT JOIN users u ON t.assigned_to = u.id
WHERE u.id IS NULL AND t.assigned_to IS NOT NULL;

-- 5.6 Check for orphaned ticket_comments (author relationship)
SELECT
    'Orphaned ticket_comments (author)' as issue,
    COUNT(*) as count
FROM ticket_comments tc
LEFT JOIN users u ON tc.author_id = u.id
WHERE u.id IS NULL AND tc.author_id IS NOT NULL;

-- 5.7 Check for orphaned ticket_activities (performed_by relationship)
SELECT
    'Orphaned ticket_activities (performed_by)' as issue,
    COUNT(*) as count
FROM ticket_activities ta
LEFT JOIN users u ON ta.performed_by = u.id
WHERE u.id IS NULL AND ta.performed_by IS NOT NULL;

-- 5.8 Check for orphaned ticket_attachments (uploaded_by relationship)
SELECT
    'Orphaned ticket_attachments (uploaded_by)' as issue,
    COUNT(*) as count
FROM ticket_attachments ta
LEFT JOIN users u ON ta.uploaded_by = u.id
WHERE u.id IS NULL AND ta.uploaded_by IS NOT NULL;

-- 5.9 Verify tenant isolation across ticket tables
SELECT
    'Tickets per tenant' as metric,
    t.tenant_id,
    tn.name as tenant_name,
    COUNT(*) as ticket_count
FROM tickets t
LEFT JOIN tenants tn ON t.tenant_id = tn.id
GROUP BY t.tenant_id, tn.name
ORDER BY ticket_count DESC;

SELECT
    'Ticket comments per tenant' as metric,
    tc.tenant_id,
    tn.name as tenant_name,
    COUNT(*) as comment_count
FROM ticket_comments tc
LEFT JOIN tenants tn ON tc.tenant_id = tn.id
GROUP BY tc.tenant_id, tn.name
ORDER BY comment_count DESC;

SELECT
    'Ticket activities per tenant' as metric,
    ta.tenant_id,
    tn.name as tenant_name,
    COUNT(*) as activity_count
FROM ticket_activities ta
LEFT JOIN tenants tn ON ta.tenant_id = tn.id
GROUP BY ta.tenant_id, tn.name
ORDER BY activity_count DESC;

SELECT
    'Ticket attachments per tenant' as metric,
    ta.tenant_id,
    tn.name as tenant_name,
    COUNT(*) as attachment_count
FROM ticket_attachments ta
LEFT JOIN tenants tn ON ta.tenant_id = tn.id
GROUP BY ta.tenant_id, tn.name
ORDER BY attachment_count DESC;

-- ============================================================================
-- 6. DATA INTEGRITY VALIDATION
-- ============================================================================

-- 6.1 Check ticket data completeness
SELECT
    'Ticket data completeness' as check_type,
    COUNT(*) as total_tickets,
    COUNT(CASE WHEN title IS NOT NULL THEN 1 END) as with_title,
    COUNT(CASE WHEN description IS NOT NULL THEN 1 END) as with_description,
    COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as with_customer,
    COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned,
    ROUND(
        (COUNT(CASE WHEN title IS NOT NULL AND description IS NOT NULL THEN 1 END)::decimal / NULLIF(COUNT(*), 0)::decimal) * 100, 2
    ) as completeness_pct
FROM tickets;

-- 6.2 Check ticket status distribution
SELECT
    'Ticket status distribution' as check_type,
    status,
    COUNT(*) as count,
    ROUND((COUNT(*)::decimal / SUM(COUNT(*)) OVER ()) * 100, 2) as percentage
FROM tickets
GROUP BY status
ORDER BY count DESC;

-- 6.3 Check ticket priority distribution
SELECT
    'Ticket priority distribution' as check_type,
    priority,
    COUNT(*) as count,
    ROUND((COUNT(*)::decimal / SUM(COUNT(*)) OVER ()) * 100, 2) as percentage
FROM tickets
GROUP BY priority
ORDER BY count DESC;

-- 6.4 Check ticket category distribution
SELECT
    'Ticket category distribution' as check_type,
    category,
    COUNT(*) as count,
    ROUND((COUNT(*)::decimal / SUM(COUNT(*)) OVER ()) * 100, 2) as percentage
FROM tickets
GROUP BY category
ORDER BY count DESC;

-- 6.5 Check ticket SLA compliance
SELECT
    'Ticket SLA compliance' as check_type,
    COUNT(*) as total_tickets,
    COUNT(CASE WHEN is_sla_breached = true THEN 1 END) as breached_sla,
    COUNT(CASE WHEN is_sla_breached = false THEN 1 END) as within_sla,
    ROUND(
        (COUNT(CASE WHEN is_sla_breached = false THEN 1 END)::decimal / NULLIF(COUNT(*), 0)::decimal) * 100, 2
    ) as sla_compliance_pct
FROM tickets;

-- 6.6 Check ticket resolution metrics
SELECT
    'Ticket resolution metrics' as check_type,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_resolution_hours,
    AVG(EXTRACT(EPOCH FROM (first_response_date - created_at))/3600) as avg_first_response_hours,
    AVG(first_response_time) as avg_first_response_minutes,
    AVG(resolution_time) as avg_resolution_time_minutes
FROM tickets
WHERE resolved_at IS NOT NULL;

-- 6.7 Check ticket comment activity
SELECT
    'Ticket comment activity' as check_type,
    COUNT(DISTINCT tc.ticket_id) as tickets_with_comments,
    COUNT(*) as total_comments,
    ROUND(AVG(comment_count), 2) as avg_comments_per_ticket
FROM (
    SELECT ticket_id, COUNT(*) as comment_count
    FROM ticket_comments
    GROUP BY ticket_id
) tc;

-- 6.8 Check ticket activity logging
SELECT
    'Ticket activity logging' as check_type,
    COUNT(DISTINCT ta.ticket_id) as tickets_with_activities,
    COUNT(*) as total_activities,
    ROUND(AVG(activity_count), 2) as avg_activities_per_ticket
FROM (
    SELECT ticket_id, COUNT(*) as activity_count
    FROM ticket_activities
    GROUP BY ticket_id
) ta;

-- 6.9 Check ticket attachment usage
SELECT
    'Ticket attachment usage' as check_type,
    COUNT(DISTINCT ta.ticket_id) as tickets_with_attachments,
    COUNT(*) as total_attachments,
    ROUND(AVG(attachment_count), 2) as avg_attachments_per_ticket,
    SUM(file_size) as total_attachment_size_bytes
FROM (
    SELECT ticket_id, COUNT(*) as attachment_count
    FROM ticket_attachments
    GROUP BY ticket_id
) ta
JOIN ticket_attachments ta2 ON ta.ticket_id = ta2.ticket_id;

-- 6.10 Check ticket assignment distribution
SELECT
    'Ticket assignment distribution' as check_type,
    u.email as assigned_user,
    COUNT(*) as assigned_tickets,
    ROUND((COUNT(*)::decimal / SUM(COUNT(*)) OVER ()) * 100, 2) as percentage
FROM tickets t
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.assigned_to IS NOT NULL
GROUP BY t.assigned_to, u.email
ORDER BY assigned_tickets DESC
LIMIT 10;
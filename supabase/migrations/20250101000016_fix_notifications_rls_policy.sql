-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - FIX NOTIFICATIONS RLS POLICY
-- Migration: 016 - Allow application to insert notifications with proper tenant checks
-- ============================================================================

-- Drop the restrictive policy that was blocking all inserts
DROP POLICY IF EXISTS "system_insert_notifications" ON notifications;

-- Create a new policy that allows users to insert notifications for their tenant
-- The application creates notifications with the correct tenant_id in context
CREATE POLICY "users_create_notifications" ON notifications
  FOR INSERT
  WITH CHECK (tenant_id = get_current_user_tenant_id());

-- This allows the application to insert notifications while maintaining multi-tenant isolation
-- All notifications must have tenant_id matching the current user's tenant
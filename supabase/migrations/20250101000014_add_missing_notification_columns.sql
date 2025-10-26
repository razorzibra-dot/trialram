-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - FIX NOTIFICATIONS TABLE
-- Migration: 014 - Add missing notification columns (action_label, category, data, read, user_id)
-- ============================================================================

-- Add missing columns to notifications table to match service expectations
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS action_label VARCHAR(255),
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- Add user_id as alias/reference to recipient_id for service compatibility
-- This allows the service to use user_id while maintaining foreign key relationship
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Add updated_at column if missing
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create function to sync user_id with recipient_id on insert
CREATE OR REPLACE FUNCTION sync_notification_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is provided, use it as recipient_id
  IF NEW.user_id IS NOT NULL AND NEW.recipient_id IS NULL THEN
    NEW.recipient_id := NEW.user_id;
  END IF;
  -- Keep user_id in sync with recipient_id
  NEW.user_id := NEW.recipient_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS sync_notification_user_id_trigger ON notifications;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER sync_notification_user_id_trigger
BEFORE INSERT OR UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION sync_notification_user_id();

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS notifications_updated_at_trigger ON notifications;

CREATE TRIGGER notifications_updated_at_trigger
BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
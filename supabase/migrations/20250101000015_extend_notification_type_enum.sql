-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - EXTEND NOTIFICATION_TYPE ENUM
-- Migration: 015 - Add missing notification types (info, success, warning, error)
-- ============================================================================

-- In PostgreSQL, we need to:
-- 1. Create a new ENUM type with all values
-- 2. Alter the column to use the new type
-- 3. Drop the old type and cast with CASCADE
-- 4. Rename the new type to the original name

-- Step 1: Create new enum type with all values
CREATE TYPE notification_type_new AS ENUM (
  'system',
  'user',
  'alert',
  'reminder',
  'approval',
  'task_assigned',
  'info',
  'success',
  'warning',
  'error'
);

-- Step 2: Alter the notifications table to use the new type
ALTER TABLE notifications
  ALTER COLUMN type TYPE notification_type_new USING type::text::notification_type_new;

-- Step 3: Drop the old type with CASCADE to remove dependent objects (cast)
DROP TYPE notification_type CASCADE;

-- Step 4: Rename the new type to the original name
ALTER TYPE notification_type_new RENAME TO notification_type;

-- Step 5: Update the comment
COMMENT ON TYPE notification_type IS 'Notification type enumeration including system, user, alert, reminder, approval, task_assigned, info, success, warning, error';
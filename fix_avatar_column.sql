-- Fix: Rename avatar_url column to avatar to match code expectations
-- Date: 2025-11-16
-- Purpose: The code uses 'avatar' but the database has 'avatar_url'

ALTER TABLE users
RENAME COLUMN avatar_url TO avatar;
-- Add deleted_at column to tickets table for soft delete support
-- This enables filtering by deleted_at status in REST API queries
-- Migration: 2025-11-25

ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Add comment for documentation
COMMENT ON COLUMN public.tickets.deleted_at IS 'Soft delete timestamp. When set, ticket is considered deleted. NULL means active.';

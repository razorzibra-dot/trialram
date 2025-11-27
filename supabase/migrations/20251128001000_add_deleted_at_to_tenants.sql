-- ============================================================================
-- Migration: Add deleted_at column to tenants for soft-delete filtering
-- Date:      2025-11-28
-- Purpose:   User management services filter tenants with deleted_at IS NULL.
--            The column did not exist, causing PostgREST 400 errors. This
--            migration adds the column and supporting index.
-- ============================================================================

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS tenants_deleted_at_idx
  ON public.tenants (deleted_at);


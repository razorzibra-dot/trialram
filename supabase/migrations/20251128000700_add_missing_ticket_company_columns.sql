-- ============================================================================
-- Migration: add columns referenced by application code but missing post-reset
-- ============================================================================

-- 1) Ensure tickets table has soft-delete timestamp
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_tickets_deleted_at
  ON public.tickets(deleted_at);

-- 2) Ensure companies table exposes the subscription/plan metadata
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS plan VARCHAR(100);


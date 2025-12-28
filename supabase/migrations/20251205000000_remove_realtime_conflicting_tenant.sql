-- Migration: Remove conflicting realtime tenant to avoid Realtime seeding duplicate errors
-- This migration is safe to run in dev/local and ensures Realtime's seed can insert its tenant.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tenants'
  ) THEN
    -- Always remove by name if present
    DELETE FROM public.tenants WHERE name = 'realtime-dev';

    -- If tenants table has an external_id column, remove by external_id as well
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'external_id'
    ) THEN
      DELETE FROM public.tenants WHERE external_id = 'realtime-dev';
    END IF;
  END IF;
END
$$;

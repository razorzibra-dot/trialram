-- ============================================================================
-- Migration: Restore missing relationship constraints for PostgREST nesting
-- Date:     2025-11-28
-- ============================================================================

-- 1. sale_items -> deals (optional relationship for deal line items)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sale_items'
      AND column_name = 'deal_id'
  ) THEN
    ALTER TABLE public.sale_items ADD COLUMN deal_id UUID;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sale_items_deal_id_fkey'
  ) THEN
    ALTER TABLE public.sale_items
      ADD CONSTRAINT sale_items_deal_id_fkey
      FOREIGN KEY (deal_id)
      REFERENCES public.deals(id)
      ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_sale_items_deal_id ON public.sale_items(deal_id);

-- 2. ticket_comments -> tickets / users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ticket_comments_ticket_id_fkey'
  ) THEN
    ALTER TABLE public.ticket_comments
      ADD CONSTRAINT ticket_comments_ticket_id_fkey
      FOREIGN KEY (ticket_id)
      REFERENCES public.tickets(id)
      ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ticket_comments_author_id_fkey'
  ) THEN
    ALTER TABLE public.ticket_comments
      ADD CONSTRAINT ticket_comments_author_id_fkey
      FOREIGN KEY (author_id)
      REFERENCES public.users(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

-- 3. ticket_attachments -> tickets / users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ticket_attachments_ticket_id_fkey'
  ) THEN
    ALTER TABLE public.ticket_attachments
      ADD CONSTRAINT ticket_attachments_ticket_id_fkey
      FOREIGN KEY (ticket_id)
      REFERENCES public.tickets(id)
      ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ticket_attachments_uploaded_by_fkey'
  ) THEN
    ALTER TABLE public.ticket_attachments
      ADD CONSTRAINT ticket_attachments_uploaded_by_fkey
      FOREIGN KEY (uploaded_by)
      REFERENCES public.users(id)
      ON DELETE SET NULL;
  END IF;
END
$$;


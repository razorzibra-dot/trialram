-- Migration: Add missing foreign keys and columns to restore PostgREST relationships
-- Created: 2025-11-24

BEGIN;

-- 1) Add missing industry column on customers if it does not exist
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS industry character varying(100);

-- 2) customer_tag_mapping: ensure customer_id foreign key exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customer_tag_mapping_customer_id_fkey'
  ) THEN
    ALTER TABLE public.customer_tag_mapping
      ADD CONSTRAINT customer_tag_mapping_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
  END IF;
END$$;

-- 3) ticket_comments: add ticket_id FK -> tickets(id) if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ticket_comments_ticket_id_fkey'
  ) THEN
    ALTER TABLE public.ticket_comments
      ADD CONSTRAINT ticket_comments_ticket_id_fkey
      FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;
  END IF;
END$$;

-- 4) ticket_attachments: add ticket_id FK -> tickets(id) if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ticket_attachments_ticket_id_fkey'
  ) THEN
    ALTER TABLE public.ticket_attachments
      ADD CONSTRAINT ticket_attachments_ticket_id_fkey
      FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;
  END IF;
END$$;

-- 5) sale_items: add nullable deal_id column and FK to deals(id) if missing
ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS deal_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sale_items_deal_id_fkey'
  ) THEN
    -- Only create FK if deals table exists
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'deals' AND relkind = 'r') THEN
      ALTER TABLE public.sale_items
        ADD CONSTRAINT sale_items_deal_id_fkey
        FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;
    END IF;
  END IF;
END$$;

COMMIT;

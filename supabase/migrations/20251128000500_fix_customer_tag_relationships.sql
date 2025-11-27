-- ============================================================================
-- Migration: Establish foreign keys for customer_tag_mapping relationships
-- Date:     2025-11-28
-- Purpose:  Ensure PostgREST can discover the relationship between
--           customers ↔ customer_tag_mapping ↔ customer_tags so the nested
--           selects in SupabaseCustomerService keep working after resets.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'customer_tag_mapping_customer_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'customer_tag_mapping'
  ) THEN
    ALTER TABLE public.customer_tag_mapping
      ADD CONSTRAINT customer_tag_mapping_customer_id_fkey
      FOREIGN KEY (customer_id)
      REFERENCES public.customers(id)
      ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'customer_tag_mapping_tag_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'customer_tag_mapping'
  ) THEN
    ALTER TABLE public.customer_tag_mapping
      ADD CONSTRAINT customer_tag_mapping_tag_id_fkey
      FOREIGN KEY (tag_id)
      REFERENCES public.customer_tags(id)
      ON DELETE CASCADE;
  END IF;
END
$$;


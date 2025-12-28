-- Migration: Add deal_type, contract_id and extend deal_items for PRODUCT/SERVICE support
-- Date: 2025-12-04
-- Purpose: Add deal_type, contract reference and service-related fields to deal_items

BEGIN;

-- Add deal_type to deals
ALTER TABLE IF EXISTS deals
  ADD COLUMN IF NOT EXISTS deal_type VARCHAR(20) NOT NULL DEFAULT 'PRODUCT' CHECK (deal_type IN ('PRODUCT','SERVICE'));

-- Add contract_id to deals as nullable FK
ALTER TABLE IF EXISTS deals
  ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

-- Conversion traceability columns to prevent duplicate downstream records
ALTER TABLE IF EXISTS deals
  ADD COLUMN IF NOT EXISTS converted_to_order_id UUID;

ALTER TABLE IF EXISTS deals
  ADD COLUMN IF NOT EXISTS converted_to_contract_id UUID;

-- Indexes for deals
CREATE INDEX IF NOT EXISTS idx_deals_deal_type ON deals(deal_type);
CREATE INDEX IF NOT EXISTS idx_deals_status_type ON deals(status, deal_type);
CREATE INDEX IF NOT EXISTS idx_deals_contract_id ON deals(contract_id);

-- Extend deal_items
ALTER TABLE IF EXISTS deal_items
  ADD COLUMN IF NOT EXISTS service_id UUID;

ALTER TABLE IF EXISTS deal_items
  ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) DEFAULT 0 NOT NULL;

ALTER TABLE IF EXISTS deal_items
  ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'fixed' NOT NULL;

ALTER TABLE IF EXISTS deal_items
  ADD COLUMN IF NOT EXISTS tax NUMERIC(12,2) DEFAULT 0 NOT NULL;

ALTER TABLE IF EXISTS deal_items
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 0 NOT NULL;

ALTER TABLE IF EXISTS deal_items
  ADD COLUMN IF NOT EXISTS duration VARCHAR(50);

ALTER TABLE IF EXISTS deal_items
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Constraint: product_id XOR service_id (exclusive)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_name = 'deal_items'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'deal_items' AND c.conname = 'chk_deal_items_product_or_service') THEN
      ALTER TABLE deal_items ADD CONSTRAINT chk_deal_items_product_or_service CHECK (
        (product_id IS NOT NULL AND service_id IS NULL) OR
        (product_id IS NULL AND service_id IS NOT NULL)
      );
    END IF;
  END IF;
END$$;

-- Add indexes where useful
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_name = 'deal_items'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_deal_items_product_id ON deal_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_deal_items_service_id ON deal_items(service_id);
  END IF;
END$$;

COMMIT;

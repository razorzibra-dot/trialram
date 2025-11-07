-- ============================================================================
-- Migration: Add Missing Product Columns
-- Date: 2025-02-11
-- ============================================================================

-- Add missing columns to products table to support extended product data

ALTER TABLE products
ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON products(manufacturer);

-- Add comments for documentation
COMMENT ON COLUMN products.manufacturer IS 'Product manufacturer name';
COMMENT ON COLUMN products.notes IS 'Additional notes about the product';
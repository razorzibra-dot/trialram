-- Add product hierarchy columns to products table
-- Migration: 20251118000001 - Add Product Hierarchy

-- Add hierarchy columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES products(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_variant BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS variant_group_id TEXT;

-- Add indexes for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_products_parent_id ON products(parent_id);
CREATE INDEX IF NOT EXISTS idx_products_variant_group_id ON products(variant_group_id);
CREATE INDEX IF NOT EXISTS idx_products_is_variant ON products(is_variant);

-- Add constraint to prevent circular references
-- (This is a basic check; more complex validation would be needed for production)
ALTER TABLE products
ADD CONSTRAINT check_parent_not_self
CHECK (parent_id != id);

-- Add constraint for variant group consistency
-- (Products in same variant group should have same parent or be root variants)
-- This constraint is complex and would need application-level validation

-- Update RLS policies to include hierarchy columns
-- (No changes needed as RLS is already tenant-based)
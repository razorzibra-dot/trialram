-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - ADD SUPPLIER FOREIGN KEY RELATIONSHIPS
-- Migration: 20251119000005 - Add Foreign Key Relationships to Suppliers
-- ============================================================================

-- ============================================================================
-- 1. ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key constraint from products to suppliers
-- First, update any existing NULL values
UPDATE products SET supplier_id = NULL WHERE supplier_id IS NOT NULL AND supplier_id NOT IN (SELECT id FROM suppliers);

-- Add the foreign key constraint
ALTER TABLE products 
ADD CONSTRAINT fk_products_supplier_id 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- Add foreign key constraint from inventory to suppliers
-- First, update any existing NULL values  
UPDATE inventory SET supplier_id = NULL WHERE supplier_id IS NOT NULL AND supplier_id NOT IN (SELECT id FROM suppliers);

-- Add the foreign key constraint
ALTER TABLE inventory 
ADD CONSTRAINT fk_inventory_supplier_id 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Supplier foreign key indexes
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_supplier_id ON inventory(supplier_id);

-- ============================================================================
-- 3. VERIFY CONSTRAINTS WERE ADDED SUCCESSFULLY
-- ============================================================================

-- Verify the constraints exist
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('products', 'inventory', 'purchase_orders', 'purchase_order_items')
AND kcu.column_name LIKE '%supplier_id%';

-- ============================================================================
-- 4. COMMENTS
-- ============================================================================

COMMENT ON COLUMN products.supplier_id IS 'Foreign key to suppliers table for product sourcing';
COMMENT ON COLUMN inventory.supplier_id IS 'Foreign key to suppliers table for inventory sourcing';
COMMENT ON COLUMN purchase_orders.supplier_id IS 'Foreign key to suppliers table for purchase orders';
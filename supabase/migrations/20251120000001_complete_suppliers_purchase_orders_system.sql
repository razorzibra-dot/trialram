-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - COMPLETE SUPPLIERS AND PURCHASE ORDERS SYSTEM
-- Migration: 20251120000001 - Complete Suppliers and Purchase Orders System
-- ============================================================================

-- Drop conflicting triggers from existing tables
DROP TRIGGER IF EXISTS trigger_update_category_path ON product_categories;

-- ============================================================================
-- 1. CREATE SUPPLIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company Information
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  website VARCHAR(255),
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  
  -- Business Information
  industry VARCHAR(100),
  tax_id VARCHAR(100),
  registration_number VARCHAR(100),
  payment_terms VARCHAR(50),
  
  -- Financial Information
  credit_limit DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status & Classification
  status VARCHAR(50) DEFAULT 'active',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_preferred BOOLEAN DEFAULT FALSE,
  
  -- Relationships
  notes TEXT,
  tags VARCHAR(255)[],
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_supplier_per_tenant UNIQUE(company_name, tenant_id)
);

-- ============================================================================
-- 2. CREATE PURCHASE ORDERS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'ordered', 'partially_received', 'received', 'cancelled')),
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  notes TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  ordered_by UUID NOT NULL REFERENCES users(id),
  ordered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  received_by UUID REFERENCES users(id),
  received_at TIMESTAMP WITH TIME ZONE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
  quantity_received INTEGER NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(12,2) NOT NULL CHECK (total_price >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE ALL INDEXES
-- ============================================================================

-- Suppliers indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_name ON suppliers(company_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_preferred ON suppliers(is_preferred);

-- Purchase orders indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_id ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON purchase_order_items(product_id);

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_supplier_id ON inventory(supplier_id);

-- ============================================================================
-- 4. CREATE BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Function to generate PO number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  sequence_number INTEGER;
  po_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;

  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 'PO-' || current_year || '-(\d+)') AS INTEGER)), 0) + 1
  INTO sequence_number
  FROM purchase_orders
  WHERE po_number LIKE 'PO-' || current_year || '-%';

  -- Format: PO-2025-0001
  po_number := 'PO-' || current_year || '-' || LPAD(sequence_number::TEXT, 4, '0');

  RETURN po_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update purchase order total
CREATE OR REPLACE FUNCTION update_purchase_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchase_orders
  SET total_amount = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM purchase_order_items
    WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update product stock when PO items are received
CREATE OR REPLACE FUNCTION update_product_stock_on_receipt()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update stock when quantity_received changes
  IF (TG_OP = 'UPDATE' AND OLD.quantity_received != NEW.quantity_received) OR TG_OP = 'INSERT' THEN
    UPDATE products
    SET
      stock_quantity = stock_quantity + (NEW.quantity_received - COALESCE(OLD.quantity_received, 0)),
      updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. CREATE TRIGGERS
-- ============================================================================

-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS suppliers_updated_at_trigger ON suppliers;
DROP TRIGGER IF EXISTS purchase_orders_updated_at_trigger ON purchase_orders;
DROP TRIGGER IF EXISTS purchase_order_items_updated_at_trigger ON purchase_order_items;
DROP TRIGGER IF EXISTS update_po_total_on_item_change ON purchase_order_items;
DROP TRIGGER IF EXISTS update_stock_on_po_receipt ON purchase_order_items;

-- Create timestamp triggers
CREATE TRIGGER suppliers_updated_at_trigger
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER purchase_orders_updated_at_trigger
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER purchase_order_items_updated_at_trigger
  BEFORE UPDATE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create business logic triggers
CREATE TRIGGER update_po_total_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_purchase_order_total();

CREATE TRIGGER update_stock_on_po_receipt
  AFTER INSERT OR UPDATE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_product_stock_on_receipt();

-- ============================================================================
-- 6. ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Products to suppliers
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS fk_products_supplier_id;

ALTER TABLE products 
ADD CONSTRAINT fk_products_supplier_id 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- Inventory to suppliers
ALTER TABLE inventory 
DROP CONSTRAINT IF EXISTS fk_inventory_supplier_id;

ALTER TABLE inventory 
ADD CONSTRAINT fk_inventory_supplier_id 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON TABLE suppliers IS 'Master supplier/vendor data with tenant isolation';
COMMENT ON TABLE purchase_orders IS 'Purchase orders for inventory management and supplier orders';
COMMENT ON TABLE purchase_order_items IS 'Items within purchase orders';
COMMENT ON COLUMN suppliers.credit_limit IS 'Maximum credit amount available to this supplier';
COMMENT ON COLUMN suppliers.is_preferred IS 'Flag for preferred/premier suppliers';
COMMENT ON COLUMN suppliers.rating IS 'Supplier rating from 1-5 stars';
COMMENT ON COLUMN products.supplier_id IS 'Foreign key to suppliers table for product sourcing';
COMMENT ON COLUMN inventory.supplier_id IS 'Foreign key to suppliers table for inventory sourcing';
COMMENT ON COLUMN purchase_orders.supplier_id IS 'Foreign key to suppliers table for purchase orders';
COMMENT ON FUNCTION generate_po_number() IS 'Generates sequential PO numbers in format PO-YYYY-####';
COMMENT ON FUNCTION update_purchase_order_total() IS 'Automatically updates PO total when items change';
COMMENT ON FUNCTION update_product_stock_on_receipt() IS 'Updates product stock when PO items are received';

-- ============================================================================
-- 8. VERIFICATION QUERY
-- ============================================================================

-- Verify all tables and constraints were created successfully
SELECT 
  'suppliers' as table_name, 
  COUNT(*) as record_count 
FROM suppliers
UNION ALL
SELECT 
  'purchase_orders' as table_name, 
  COUNT(*) as record_count 
FROM purchase_orders
UNION ALL
SELECT 
  'purchase_order_items' as table_name, 
  COUNT(*) as record_count 
FROM purchase_order_items;
-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - PURCHASE ORDERS
-- Migration: 005 - Purchase Orders for Inventory Management
-- ============================================================================

-- ============================================================================
-- 1. PURCHASE ORDERS TABLE
-- ============================================================================

CREATE TABLE purchase_orders (
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

-- ============================================================================
-- 2. PURCHASE ORDER ITEMS TABLE
-- ============================================================================

CREATE TABLE purchase_order_items (
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
-- 3. INDEXES for Performance
-- ============================================================================

CREATE INDEX idx_purchase_orders_tenant_id ON purchase_orders(tenant_id);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_product_id ON purchase_order_items(product_id);

-- ============================================================================
-- 4. TRIGGERS - Purchase Order Timestamp Updates
-- ============================================================================

CREATE TRIGGER purchase_orders_updated_at_trigger
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER purchase_order_items_updated_at_trigger
  BEFORE UPDATE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

-- ============================================================================
-- 6. BUSINESS LOGIC FUNCTIONS
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
-- 7. TRIGGERS for Business Logic
-- ============================================================================

-- Trigger to update totals when items change
CREATE TRIGGER update_po_total_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_purchase_order_total();

-- Trigger to update stock when items are received
CREATE TRIGGER update_stock_on_po_receipt
  AFTER INSERT OR UPDATE ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_product_stock_on_receipt();

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE purchase_orders IS 'Purchase orders for inventory management and supplier orders';
COMMENT ON TABLE purchase_order_items IS 'Items within purchase orders';
COMMENT ON FUNCTION generate_po_number() IS 'Generates sequential PO numbers in format PO-YYYY-####';
COMMENT ON FUNCTION update_purchase_order_total() IS 'Automatically updates PO total when items change';
COMMENT ON FUNCTION update_product_stock_on_receipt() IS 'Updates product stock when PO items are received';
-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON TABLE purchase_orders IS 'Purchase orders for inventory management and supplier orders';
COMMENT ON TABLE purchase_order_items IS 'Items within purchase orders';
COMMENT ON FUNCTION generate_po_number() IS 'Generates sequential PO numbers in format PO-YYYY-####';
COMMENT ON FUNCTION update_purchase_order_total() IS 'Automatically updates PO total when items change';
COMMENT ON FUNCTION update_product_stock_on_receipt() IS 'Updates product stock when PO items are received';
-- ============================================================================
-- MIGRATION: Create Deal Items Table
-- Creates the deal_items table for CRM deal line items
--
-- This table stores individual line items within CRM deals, separate from
-- sale_items which are used for product sales/orders.
--
-- Date: December 6, 2025
-- ============================================================================

-- Create deal_items table for CRM deal line items
CREATE TABLE IF NOT EXISTS deal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    service_id UUID REFERENCES products(id) ON DELETE SET NULL, -- For service deals
    product_name VARCHAR(255),
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Ensure either product_id or service_id is provided
    CONSTRAINT deal_items_product_or_service_check
    CHECK (
        (product_id IS NOT NULL AND service_id IS NULL) OR
        (product_id IS NULL AND service_id IS NOT NULL) OR
        (product_id IS NOT NULL AND service_id IS NOT NULL)
    )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_deal_items_deal_id ON deal_items(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_items_product_id ON deal_items(product_id);
CREATE INDEX IF NOT EXISTS idx_deal_items_service_id ON deal_items(service_id);
CREATE INDEX IF NOT EXISTS idx_deal_items_tenant_id ON deal_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deal_items_tenant_deal ON deal_items(tenant_id, deal_id);

-- Add updated_at trigger
CREATE TRIGGER deal_items_updated_at_trigger
    BEFORE UPDATE ON deal_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE deal_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY "Users can view tenant deal_items" ON deal_items FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "Users can insert tenant deal_items" ON deal_items FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "Users can update tenant deal_items" ON deal_items FOR UPDATE USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "Users can delete tenant deal_items" ON deal_items FOR DELETE USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
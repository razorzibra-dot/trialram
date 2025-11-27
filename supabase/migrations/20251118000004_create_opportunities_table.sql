-- Create opportunities table for sales pipeline management
-- Migration: 20251118000002_create_opportunities_table.sql

-- Drop dependent objects first
DROP VIEW IF EXISTS opportunities_with_details;
DROP VIEW IF EXISTS sales_activities_with_details;
DROP VIEW IF EXISTS deals_with_details;
DROP TABLE IF EXISTS revenue_recognition_schedule;
DROP TABLE IF EXISTS deal_items;
DROP TABLE IF EXISTS opportunity_items;
DROP TABLE IF EXISTS sales_activities;

-- Drop foreign key constraints to break circular dependencies
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS fk_opportunities_converted_to_deal_id;
ALTER TABLE deals DROP CONSTRAINT IF EXISTS fk_deals_opportunity_id;

DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS opportunities;

-- Drop existing table if it exists
DROP TABLE IF EXISTS opportunities;

-- Create deals table first since opportunities references it
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_number VARCHAR(50) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    value DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL CHECK (status IN ('won', 'lost', 'cancelled')),
    source VARCHAR(100),
    campaign VARCHAR(100),
    close_date DATE NOT NULL,
    expected_close_date DATE,
    assigned_to UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    tags JSONB DEFAULT '[]',
    competitor_info TEXT,
    win_loss_reason TEXT,
    opportunity_id UUID, -- Will add FK constraint later
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Create opportunities table
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255), -- For display purposes, denormalized
    estimated_value DECIMAL(15,2) NOT NULL CHECK (estimated_value >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    probability INTEGER NOT NULL DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
    weighted_value DECIMAL(15,2) GENERATED ALWAYS AS (estimated_value * probability / 100) STORED,
    stage VARCHAR(20) DEFAULT 'prospecting' CHECK (stage IN ('prospecting', 'qualification', 'needs_analysis', 'proposal', 'negotiation', 'decision', 'contract')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'on_hold', 'cancelled')),
    source VARCHAR(100),
    campaign VARCHAR(100),
    expected_close_date DATE,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    next_activity_date TIMESTAMP WITH TIME ZONE,
    assigned_to UUID NOT NULL REFERENCES users(id),
    assigned_to_name VARCHAR(255), -- For display purposes, denormalized
    notes TEXT,
    tags JSONB DEFAULT '[]',
    competitor_info TEXT,
    pain_points JSONB DEFAULT '[]',
    requirements JSONB DEFAULT '[]',
    proposed_items JSONB DEFAULT '[]', -- Array of proposed items/products
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    converted_to_deal_id UUID REFERENCES deals(id), -- Link to deal when converted
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create opportunity_items table for detailed item tracking
CREATE TABLE opportunity_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id), -- Optional product reference
    product_name VARCHAR(255) NOT NULL,
    product_description TEXT,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(15,2) NOT NULL CHECK (unit_price >= 0),
    discount DECIMAL(15,2) DEFAULT 0 CHECK (discount >= 0),
    tax DECIMAL(15,2) DEFAULT 0 CHECK (tax >= 0),
    line_total DECIMAL(15,2) GENERATED ALWAYS AS ((quantity * unit_price) - discount + tax) STORED,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for deals.opportunity_id
ALTER TABLE deals ADD CONSTRAINT fk_deals_opportunity_id FOREIGN KEY (opportunity_id) REFERENCES opportunities(id);

-- Create indexes for performance
CREATE INDEX idx_opportunities_tenant_id ON opportunities(tenant_id);
CREATE INDEX idx_opportunities_customer_id ON opportunities(customer_id);
CREATE INDEX idx_opportunities_assigned_to ON opportunities(assigned_to);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_expected_close_date ON opportunities(expected_close_date);
CREATE INDEX idx_opportunities_created_at ON opportunities(created_at);
CREATE INDEX idx_opportunities_converted_to_deal_id ON opportunities(converted_to_deal_id);

CREATE INDEX idx_opportunity_items_opportunity_id ON opportunity_items(opportunity_id);
CREATE INDEX idx_opportunity_items_product_id ON opportunity_items(product_id);
CREATE INDEX idx_opportunity_items_tenant_id ON opportunity_items(tenant_id);

-- Enable RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for opportunities
CREATE POLICY "Users can view tenant opportunities"
ON opportunities FOR SELECT
USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

CREATE POLICY "Users can create opportunities for their tenant"
ON opportunities FOR INSERT
WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

CREATE POLICY "Users can update tenant opportunities"
ON opportunities FOR UPDATE
USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

CREATE POLICY "Users can delete tenant opportunities"
ON opportunities FOR DELETE
USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

-- Create RLS policies for opportunity_items
CREATE POLICY "Users can view tenant opportunity items"
ON opportunity_items FOR SELECT
USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

CREATE POLICY "Users can create opportunity items for their tenant"
ON opportunity_items FOR INSERT
WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

CREATE POLICY "Users can update tenant opportunity items"
ON opportunity_items FOR UPDATE
USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

CREATE POLICY "Users can delete tenant opportunity items"
ON opportunity_items FOR DELETE
USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
);

-- Create trigger for updated_at
CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunity_items_updated_at
    BEFORE UPDATE ON opportunity_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data inserts removed to avoid FK constraint violations with non-existent customer/product records
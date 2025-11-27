-- Create product_categories table for hierarchical product categorization
-- Migration: 20251118000003_create_product_categories.sql

-- Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    path TEXT, -- Full path for quick lookups (e.g., "Electronics/Computers/Laptops")
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    icon VARCHAR(100),
    color VARCHAR(7), -- Hex color code
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT unique_category_name_per_tenant UNIQUE (name, tenant_id),
    CONSTRAINT check_color_format CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Indexes removed to avoid conflicts with existing table schema

-- Create function to update path on insert/update
CREATE OR REPLACE FUNCTION update_category_path()
RETURNS TRIGGER AS $$
BEGIN
    -- Build the full path by concatenating parent paths
    IF NEW.parent_id IS NULL THEN
        NEW.path := NEW.name;
        NEW.level := 1;
    ELSE
        SELECT
            COALESCE(pc.path || '/' || NEW.name, NEW.name),
            COALESCE(pc.level + 1, 1)
        INTO NEW.path, NEW.level
        FROM product_categories pc
        WHERE pc.id = NEW.parent_id;
    END IF;

    -- Update children paths if this is an update
    IF TG_OP = 'UPDATE' AND OLD.name != NEW.name THEN
        UPDATE product_categories
        SET path = replace(path, OLD.path || '/', NEW.path || '/')
        WHERE path LIKE OLD.path || '/%';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain path hierarchy
CREATE TRIGGER trigger_update_category_path
    BEFORE INSERT OR UPDATE ON product_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_category_path();

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view categories in their tenant" ON product_categories
    FOR SELECT USING (
        tenant_id = get_current_user_tenant_id() OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
        )
    );

CREATE POLICY "Users can insert categories in their tenant" ON product_categories
    FOR INSERT WITH CHECK (
        tenant_id = get_current_user_tenant_id() OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
        )
    );

CREATE POLICY "Users can update categories in their tenant" ON product_categories
    FOR UPDATE USING (
        tenant_id = get_current_user_tenant_id() OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
        )
    );

CREATE POLICY "Users can delete categories in their tenant" ON product_categories
    FOR DELETE USING (
        tenant_id = get_current_user_tenant_id() OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
        )
    );

-- Sample data inserts removed to avoid tenant reference issues
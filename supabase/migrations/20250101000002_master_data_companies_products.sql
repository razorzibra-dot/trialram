-- ============================================================================
-- PHASE 2: DATABASE SCHEMA - MASTER DATA
-- Migration: 002 - Companies and Products
-- ============================================================================

-- ============================================================================
-- 1. ENUMS - Master Data Types
-- ============================================================================

CREATE TYPE company_size AS ENUM (
  'startup',
  'small',
  'medium',
  'large',
  'enterprise'
);

CREATE TYPE entity_status AS ENUM (
  'active',
  'inactive',
  'prospect',
  'suspended'
);

CREATE TYPE product_status AS ENUM (
  'active',
  'inactive',
  'discontinued'
);

-- ============================================================================
-- 2. COMPANIES TABLE - Master Company Data
-- ============================================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- Classification
  industry VARCHAR(100),
  size company_size,
  status entity_status DEFAULT 'active',
  
  -- Additional info
  description TEXT,
  logo_url VARCHAR(500),
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_company_per_tenant UNIQUE(name, tenant_id)
);

CREATE INDEX idx_companies_tenant_id ON companies(tenant_id);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_industry ON companies(industry);

-- ============================================================================
-- 3. PRODUCT CATEGORIES TABLE
-- ============================================================================

CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_category_per_tenant UNIQUE(name, tenant_id)
);

CREATE INDEX idx_product_categories_tenant_id ON product_categories(tenant_id);

-- ============================================================================
-- 4. PRODUCTS TABLE - Master Product Data
-- ============================================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Classification
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  category VARCHAR(100),
  brand VARCHAR(100),
  type VARCHAR(50),
  sku VARCHAR(100) NOT NULL,
  
  -- Pricing
  price NUMERIC(12, 2) NOT NULL,
  cost_price NUMERIC(12, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status
  status product_status DEFAULT 'active',
  is_active BOOLEAN DEFAULT TRUE,
  is_service BOOLEAN DEFAULT FALSE,
  
  -- Stock Management
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  reorder_level INTEGER,
  track_stock BOOLEAN DEFAULT TRUE,
  unit VARCHAR(20),
  min_order_quantity INTEGER,
  
  -- Physical Properties
  weight NUMERIC(8, 2),
  dimensions VARCHAR(100),
  
  -- Supplier
  supplier_id UUID,
  supplier_name VARCHAR(255),
  
  -- Additional
  warranty_period_months INTEGER,
  service_contract_available BOOLEAN DEFAULT FALSE,
  tags VARCHAR(255)[],
  image_url VARCHAR(500),
  
  -- Multi-tenant
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_sku_per_tenant UNIQUE(sku, tenant_id)
);

CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);

-- ============================================================================
-- 5. PRODUCT SPECIFICATIONS TABLE
-- ============================================================================

CREATE TABLE product_specifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  value VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_specifications_product_id ON product_specifications(product_id);

-- ============================================================================
-- 6. TRIGGERS - Master Data Timestamp Updates
-- ============================================================================

CREATE TRIGGER companies_updated_at_trigger
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER product_categories_updated_at_trigger
BEFORE UPDATE ON product_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER products_updated_at_trigger
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. INITIAL DATA - Default Categories
-- ============================================================================

-- Insert standard product categories (these will be populated per tenant)
-- The app will handle tenant-specific initialization

COMMENT ON TABLE companies IS 'Master company data with tenant isolation';
COMMENT ON TABLE products IS 'Master product catalog with inventory tracking';
COMMENT ON TABLE product_specifications IS 'Product attribute specifications';
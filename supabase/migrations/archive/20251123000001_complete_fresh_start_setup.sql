-- ============================================================================
-- COMPLETE FRESH START MIGRATION - ONE COMMAND SETUP
-- Run this after 'supabase db reset' to make everything work automatically
-- ============================================================================

-- ============================================================================
-- STEP 1: STANDARD SEED DATA (TENANTS, ROLES, PERMISSIONS, USERS)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CREATE ENUMS AND TYPES
-- ============================================================================

DO $ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;
CREATE TYPE notification_type AS ENUM ('system', 'user_action', 'task_assigned', 'deadline_reminder', 'custom');

-- ============================================================================
-- CREATE CORE TABLES
-- ============================================================================

-- Tenants (Organizations)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    status VARCHAR(20) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users (extends auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    phone VARCHAR(20),
    department VARCHAR(100),
    position VARCHAR(100),
    status user_status DEFAULT 'active',
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    is_super_admin BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles (Role-based access control)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, tenant_id)
);

-- Permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    resource VARCHAR(50),
    action VARCHAR(50),
    is_system_permission BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Role Assignments
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, role_id, tenant_id)
);

-- Role Permission Assignments
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    description TEXT,
    category VARCHAR(100),
    unit_price DECIMAL(12,2) DEFAULT 0,
    cost_price DECIMAL(12,2) DEFAULT 0,
    quantity_in_stock INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    customer_type VARCHAR(50) DEFAULT 'regular',
    status VARCHAR(20) DEFAULT 'active',
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    sale_date DATE DEFAULT CURRENT_DATE,
    total_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sale Items
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contracts
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    contract_type VARCHAR(100),
    start_date DATE,
    end_date DATE,
    total_value DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    terms TEXT,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type notification_type DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- User Policies
CREATE POLICY "Users can view their own record" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own record" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own record" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view tenant users" ON users FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR is_super_admin = TRUE
    OR auth.uid() = id
);

-- Role Policies  
CREATE POLICY "Users can view tenant roles" ON roles FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR is_system_role = TRUE
    OR is_super_admin = TRUE
);

-- Permission Policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view permissions" ON permissions FOR SELECT USING (auth.role() = 'authenticated');

-- User Role Policies
CREATE POLICY "Users can view their own roles" ON user_roles FOR SELECT USING (
    auth.uid() = user_id 
    OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
    OR tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

-- Role Permission Policies
CREATE POLICY "Users can view role permissions" ON role_permissions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role_id = role_permissions.role_id
    )
    OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

-- Tenant-scoped table policies (companies, products, customers, sales, etc.)
CREATE POLICY "Users can view tenant data" ON companies FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "Users can insert tenant data" ON companies FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "Users can update tenant data" ON companies FOR UPDATE USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "Users can delete tenant data" ON companies FOR DELETE USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
);

-- Apply similar policies to other tenant-scoped tables
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT unnest(ARRAY['products', 'customers', 'sales', 'sale_items', 'contracts', 'notifications', 'audit_logs'])
    LOOP
        EXECUTE format('CREATE POLICY "Users can view tenant %1$s" ON %1$s FOR SELECT USING (
            tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
            OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
        )', table_name);
        
        EXECUTE format('CREATE POLICY "Users can insert tenant %1$s" ON %1$s FOR INSERT WITH CHECK (
            tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
            OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
        )', table_name);
        
        EXECUTE format('CREATE POLICY "Users can update tenant %1$s" ON %1$s FOR UPDATE USING (
            tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
            OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
        )', table_name);
        
        EXECUTE format('CREATE POLICY "Users can delete tenant %1$s" ON %1$s FOR DELETE USING (
            tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
            OR (SELECT is_super_admin FROM users WHERE id = auth.uid()) = TRUE
        )', table_name);
    END LOOP;
END $$;

-- ============================================================================
-- INSERT STANDARD SEED DATA
-- ============================================================================

-- Insert Tenants
INSERT INTO tenants (id, name, domain, subscription_plan, status) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Acme Corporation', 'acme.com', 'enterprise', 'active'),
('b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Tech Solutions Inc', 'techsolutions.com', 'professional', 'active'),
('c2ggd99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Global Trading Ltd', 'globaltrading.com', 'basic', 'active');

-- Insert Permissions
INSERT INTO permissions (name, description, category, resource, action) VALUES
('dashboard:view', 'Access tenant dashboard and analytics', 'navigation', 'dashboard', 'view'),
('masters:read', 'Access master data and configuration', 'navigation', 'masters', 'read'),
('user_management:read', 'Access user and role management interface', 'navigation', 'users', 'read'),
('companies:read', 'View companies data', 'core', 'companies', 'read'),
('companies:write', 'Create and update companies', 'core', 'companies', 'write'),
('companies:delete', 'Delete companies', 'core', 'companies', 'delete'),
('products:read', 'View products data', 'core', 'products', 'read'),
('products:write', 'Create and update products', 'core', 'products', 'write'),
('products:delete', 'Delete products', 'core', 'products', 'delete'),
('customers:read', 'View customers data', 'core', 'customers', 'read'),
('customers:write', 'Create and update customers', 'core', 'customers', 'write'),
('customers:delete', 'Delete customers', 'core', 'customers', 'delete'),
('sales:read', 'View sales data', 'core', 'sales', 'read'),
('sales:write', 'Create and update sales', 'core', 'sales', 'write'),
('sales:delete', 'Delete sales', 'core', 'sales', 'delete'),
('contracts:read', 'View contracts data', 'core', 'contracts', 'read'),
('contracts:write', 'Create and update contracts', 'core', 'contracts', 'write'),
('contracts:delete', 'Delete contracts', 'core', 'contracts', 'delete'),
('reports:export', 'Export data and reports', 'core', 'reports', 'export'),
('settings:manage', 'Manage system settings', 'system', 'settings', 'manage');

-- Insert Roles (per tenant)
INSERT INTO roles (name, description, tenant_id, is_system_role) VALUES
('Administrator', 'Full system access for tenant', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('Manager', 'Management level access', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('Engineer', 'Technical user with limited access', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('User', 'Standard user with basic access', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('Customer', 'External customer access', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false),
('Administrator', 'Full system access for tenant', 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('Manager', 'Management level access', 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('Engineer', 'Technical user with limited access', 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('User', 'Standard user with basic access', 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('Customer', 'External customer access', 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a22', false),
('Administrator', 'Full system access for tenant', 'c2ggd99-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('Manager', 'Management level access', 'c2ggd99-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('Engineer', 'Technical user with limited access', 'c2ggd99-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('User', 'Standard user with basic access', 'c2ggd99-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('Customer', 'External customer access', 'c2ggd99-9c0b-4ef8-bb6d-6bb9bd380a33', false),
('super_admin', 'Global system administrator', NULL, true);

-- Insert Role Permissions (assign permissions to roles)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE 
    (r.name = 'Administrator' AND p.name IN ('dashboard:view', 'masters:read', 'user_management:read', 'companies:read', 'companies:write', 'companies:delete', 'products:read', 'products:write', 'products:delete', 'customers:read', 'customers:write', 'customers:delete', 'sales:read', 'sales:write', 'sales:delete', 'contracts:read', 'contracts:write', 'contracts:delete', 'reports:export'))
    OR 
    (r.name = 'Manager' AND p.name IN ('dashboard:view', 'masters:read', 'companies:read', 'companies:write', 'products:read', 'products:write', 'customers:read', 'customers:write', 'sales:read', 'sales:write', 'contracts:read', 'contracts:write', 'reports:export'))
    OR 
    (r.name = 'Engineer' AND p.name IN ('dashboard:view', 'masters:read', 'companies:read', 'products:read', 'products:write', 'customers:read', 'sales:read', 'sales:write', 'contracts:read'))
    OR 
    (r.name = 'User' AND p.name IN ('masters:read', 'companies:read', 'products:read', 'customers:read', 'sales:read', 'contracts:read'))
    OR 
    (r.name = 'Customer' AND p.name IN ('companies:read', 'products:read'))
    OR 
    (r.name = 'super_admin' AND p.name IN ('dashboard:view', 'masters:read', 'user_management:read', 'companies:read', 'companies:write', 'companies:delete', 'products:read', 'products:write', 'products:delete', 'customers:read', 'customers:write', 'customers:delete', 'sales:read', 'sales:write', 'sales:delete', 'contracts:read', 'contracts:write', 'contracts:delete', 'reports:export', 'settings:manage'));

-- Insert Test Users (these will be synced with auth.users)
INSERT INTO users (id, email, name, first_name, last_name, status, tenant_id, is_super_admin, department, position) VALUES
('6e084750-4e35-468c-9903-5b5ab9d14af4', 'admin@acme.com', 'Admin Acme', 'Admin', 'Acme', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false, 'Administration', 'Administrator'),
('2707509b-57e8-4c84-a6fe-267eaa724223', 'manager@acme.com', 'Manager Acme', 'Manager', 'Acme', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false, 'Management', 'Manager'),
('27ff37b5-ef55-4e34-9951-42f35a1b2506', 'engineer@acme.com', 'Engineer Acme', 'Engineer', 'Acme', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false, 'Engineering', 'Engineer'),
('3ce006ad-3a2b-45b8-b540-4b8634d0e410', 'user@acme.com', 'User Acme', 'User', 'Acme', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false, 'Operations', 'User'),
('4df117be-4f36-579d-0014-6c6ab0e15f521', 'customer@acme.com', 'Customer Acme', 'Customer', 'Acme', 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', false, 'Sales', 'Customer'),
('5eg228cf-5047-68ae-1125-7d7bc1f26g632', 'admin@techsolutions.com', 'Admin Tech', 'Admin', 'Tech', 'active', 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a22', false, 'Administration', 'Administrator'),
('6fh339dg-6148-79bf-2236-8e8cd2g37h743', 'manager@techsolutions.com', 'Manager Tech', 'Manager', 'Tech', 'active', 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a22', false, 'Management', 'Manager'),
('7gi44aeh-7259-8acg-3347-9f9de3h48i854', 'admin@globaltrading.com', 'Admin Global', 'Admin', 'Global', 'active', 'c2ggd99-9c0b-4ef8-bb6d-6bb9bd380a33', false, 'Administration', 'Administrator'),
('8hj55bfi-836a-9bdh-4458-a0aef4i59j965', 'superadmin@platform.com', 'CRM Global', 'CRM', 'Global', 'active', NULL, true, 'Platform', 'Super Admin'),
('9ik66cgj-947b-0cei-5569-b1bfg5j6ak076', 'superadmin2@platform.com', 'CRM Global 2', 'CRM', 'Global', 'active', NULL, true, 'Platform', 'Super Admin'),
('0jl77dhk-a58c-1dfj-667a-c2cgh6k7bl187', 'superadmin3@platform.com', 'CRM Global 3', 'CRM', 'Global', 'active', NULL, true, 'Platform', 'Super Admin');

-- Assign Roles to Users
INSERT INTO user_roles (user_id, role_id, tenant_id)
SELECT u.id, r.id, r.tenant_id
FROM users u
JOIN roles r ON 
    (r.name = 'Administrator' AND u.email LIKE '%admin%' AND r.tenant_id = u.tenant_id)
    OR (r.name = 'Manager' AND u.email LIKE '%manager%' AND r.tenant_id = u.tenant_id)
    OR (r.name = 'Engineer' AND u.email LIKE '%engineer%' AND r.tenant_id = u.tenant_id)
    OR (r.name = 'Customer' AND u.email LIKE '%customer%' AND r.tenant_id = u.tenant_id)
    OR (r.name = 'User' AND u.email LIKE '%user@%' AND r.tenant_id = u.tenant_id)
    OR (r.name = 'super_admin' AND u.email LIKE '%superadmin%' AND r.tenant_id IS NULL)
WHERE u.tenant_id = r.tenant_id OR (r.tenant_id IS NULL AND u.tenant_id IS NULL);

-- Insert Sample Companies
INSERT INTO companies (name, registration_number, address, city, state, country, phone, email, tenant_id) VALUES
('Acme Manufacturing Inc', 'REG123456', '123 Industrial Ave', 'Detroit', 'MI', 'USA', '+1-313-555-0100', 'contact@acmemfg.com', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('TechStart Solutions', 'REG789012', '456 Innovation Blvd', 'Austin', 'TX', 'USA', '+1-512-555-0200', 'info@techstart.com', 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
('Global Trade Co', 'REG345678', '789 Commerce St', 'Miami', 'FL', 'USA', '+1-305-555-0300', 'sales@globaltrade.com', 'c2ggd99-9c0b-4ef8-bb6d-6bb9bd380a33');

-- Insert Sample Products
INSERT INTO products (name, code, description, category, unit_price, cost_price, quantity_in_stock, tenant_id) VALUES
('Widget A', 'WID-001', 'High-quality widget for industrial use', 'Components', 25.99, 15.50, 100, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('Widget B', 'WID-002', 'Standard widget for general applications', 'Components', 18.50, 10.25, 150, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('Gadget Pro', 'GAD-001', 'Advanced gadget with smart features', 'Electronics', 89.99, 55.00, 75, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('Tool Kit', 'TOO-001', 'Complete toolkit for maintenance', 'Tools', 45.00, 28.00, 50, 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
('Service Package A', 'SRV-001', 'Premium service package with support', 'Services', 199.99, 120.00, 999, 'c2ggd99-9c0b-4ef8-bb6d-6bb9bd380a33');

-- Insert Sample Customers
INSERT INTO customers (first_name, last_name, email, phone, address, city, state, country, company_id, tenant_id) VALUES
('John', 'Doe', 'john.doe@example.com', '+1-555-0101', '123 Main St', 'New York', 'NY', 'USA', (SELECT id FROM companies WHERE name = 'Acme Manufacturing Inc' LIMIT 1), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('Jane', 'Smith', 'jane.smith@example.com', '+1-555-0102', '456 Oak Ave', 'Los Angeles', 'CA', 'USA', (SELECT id FROM companies WHERE name = 'TechStart Solutions' LIMIT 1), 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
('Bob', 'Johnson', 'bob.johnson@example.com', '+1-555-0103', '789 Pine Rd', 'Chicago', 'IL', 'USA', (SELECT id FROM companies WHERE name = 'Global Trade Co' LIMIT 1), 'c2ggd99-9c0b-4ef8-bb6d-6bb9bd380a33');

-- Insert Sample Sales
INSERT INTO sales (customer_id, sale_date, total_amount, tax_amount, discount_amount, status, tenant_id) VALUES
((SELECT id FROM customers WHERE email = 'john.doe@example.com' LIMIT 1), CURRENT_DATE, 299.95, 24.00, 0.00, 'completed', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
((SELECT id FROM customers WHERE email = 'jane.smith@example.com' LIMIT 1), CURRENT_DATE, 450.00, 36.00, 25.00, 'pending', 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
((SELECT id FROM customers WHERE email = 'bob.johnson@example.com' LIMIT 1), CURRENT_DATE, 125.50, 10.04, 0.00, 'completed', 'c2ggd99-9c0b-4ef8-bb6d-6bb9bd380a33');

-- Insert Sale Items
INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price, tenant_id)
SELECT 
    s.id,
    p.id,
    CASE 
        WHEN p.name = 'Widget A' THEN 5
        WHEN p.name = 'Widget B' THEN 10
        WHEN p.name = 'Gadget Pro' THEN 2
        WHEN p.name = 'Tool Kit' THEN 3
        WHEN p.name = 'Service Package A' THEN 1
        ELSE 1
    END,
    p.unit_price,
    CASE 
        WHEN p.name = 'Widget A' THEN 5 * p.unit_price
        WHEN p.name = 'Widget B' THEN 10 * p.unit_price
        WHEN p.name = 'Gadget Pro' THEN 2 * p.unit_price
        WHEN p.name = 'Tool Kit' THEN 3 * p.unit_price
        WHEN p.name = 'Service Package A' THEN 1 * p.unit_price
        ELSE p.unit_price
    END,
    s.tenant_id
FROM sales s
CROSS JOIN products p
WHERE 
    (s.customer_id = (SELECT id FROM customers WHERE email = 'john.doe@example.com' LIMIT 1) AND p.name IN ('Widget A', 'Gadget Pro'))
    OR (s.customer_id = (SELECT id FROM customers WHERE email = 'jane.smith@example.com' LIMIT 1) AND p.name IN ('Widget B', 'Tool Kit'))
    OR (s.customer_id = (SELECT id FROM customers WHERE email = 'bob.johnson@example.com' LIMIT 1) AND p.name IN ('Service Package A'));

-- Insert Sample Contracts
INSERT INTO contracts (customer_id, title, contract_type, start_date, end_date, total_value, status, tenant_id) VALUES
((SELECT id FROM customers WHERE email = 'john.doe@example.com' LIMIT 1), 'Manufacturing Contract 2024', 'Service Agreement', '2024-01-01', '2024-12-31', 50000.00, 'active', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
((SELECT id FROM customers WHERE email = 'jane.smith@example.com' LIMIT 1), 'Tech Support Agreement', 'Support Contract', '2024-01-15', '2025-01-14', 25000.00, 'active', 'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
((SELECT id FROM customers WHERE email = 'bob.johnson@example.com' LIMIT 1), 'Trade Partnership', 'Partnership Agreement', '2024-03-01', '2026-02-28', 100000.00, 'active', 'c2ggd99-9c0b-4ef8-bb6d-6bb9bd380a33');

-- Insert Sample Notifications
INSERT INTO notifications (user_id, title, message, type, tenant_id) VALUES
((SELECT id FROM users WHERE email = 'admin@acme.com' LIMIT 1), 'System Setup Complete', 'Your CRM system has been successfully configured with sample data.', 'system', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
((SELECT id FROM users WHERE email = 'manager@acme.com' LIMIT 1), 'Welcome to the System', 'You can now start managing your customer relationships.', 'system', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
((SELECT id FROM users WHERE email = 'superadmin@platform.com' LIMIT 1), 'Platform Admin Access', 'You have full platform administration privileges.', 'system', NULL);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_companies_tenant_id ON companies(tenant_id);
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_contracts_tenant_id ON contracts(tenant_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- ============================================================================
-- CREATE FUNCTIONS FOR AUTOMATIC SETUP
-- ============================================================================

-- Function to auto-sync auth users to public.users
CREATE OR REPLACE FUNCTION sync_auth_user_to_public_user()
RETURNS TRIGGER AS $$
DECLARE
  user_tenant_id UUID;
  role_name TEXT;
  user_name TEXT;
  is_super_admin_flag BOOLEAN;
BEGIN
  -- Extract user metadata
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  -- Determine if user is super admin
  is_super_admin_flag := (
    NEW.email LIKE '%superadmin%' OR 
    NEW.email LIKE '%@platform.com' OR
    NEW.email LIKE '%@platform.%'
  );

  -- Determine tenant_id and role_name based on email domain
  IF is_super_admin_flag THEN
    user_tenant_id := NULL;
    role_name := 'super_admin';
  ELSE
    -- Map email domain to tenant_id
    SELECT id INTO user_tenant_id
    FROM tenants
    WHERE (
      CASE 
        WHEN NEW.email LIKE '%@acme.com' OR NEW.email LIKE '%@acme.%' THEN name = 'Acme Corporation'
        WHEN NEW.email LIKE '%@techsolutions.com' OR NEW.email LIKE '%@techsolutions.%' THEN name = 'Tech Solutions Inc'
        WHEN NEW.email LIKE '%@globaltrading.com' OR NEW.email LIKE '%@globaltrading.%' THEN name = 'Global Trading Ltd'
        ELSE FALSE
      END
    )
    LIMIT 1;

    -- Default to first tenant if no match found
    IF user_tenant_id IS NULL THEN
      SELECT id INTO user_tenant_id FROM tenants ORDER BY created_at LIMIT 1;
    END IF;

    -- Determine role name from email
    role_name := CASE
      WHEN NEW.email LIKE '%admin%' THEN 'Administrator'
      WHEN NEW.email LIKE '%manager%' THEN 'Manager'
      WHEN NEW.email LIKE '%engineer%' THEN 'Engineer'
      WHEN NEW.email LIKE '%customer%' THEN 'Customer'
      ELSE 'User'
    END;
  END IF;

  -- Insert or update user in public.users
  INSERT INTO public.users (
    id,
    email,
    name,
    first_name,
    last_name,
    status,
    tenant_id,
    is_super_admin,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    split_part(user_name, ' ', 1),
    CASE 
      WHEN array_length(string_to_array(user_name, ' '), 1) > 1 
      THEN array_to_string((string_to_array(user_name, ' '))[2:], ' ')
      ELSE NULL
    END,
    'active'::user_status,
    user_tenant_id,
    is_super_admin_flag,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    status = EXCLUDED.status,
    tenant_id = EXCLUDED.tenant_id,
    is_super_admin = EXCLUDED.is_super_admin,
    updated_at = NOW();

  -- Assign role via user_roles table
  INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
  SELECT
    NEW.id,
    r.id,
    user_tenant_id,
    NOW()
  FROM roles r
  WHERE r.name = role_name
    AND (r.tenant_id = user_tenant_id OR (user_tenant_id IS NULL AND r.tenant_id IS NULL))
  ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-sync
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_user_to_public_user();

-- ============================================================================
-- CREATE VALIDATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_system_setup()
RETURNS JSON AS $$
DECLARE
  result JSON;
  issues JSON := '[]'::json;
  user_count INTEGER;
  tenant_count INTEGER;
  role_count INTEGER;
  permission_count INTEGER;
  assignment_count INTEGER;
BEGIN
  -- Count records
  SELECT COUNT(*) INTO user_count FROM public.users;
  SELECT COUNT(*) INTO tenant_count FROM tenants;
  SELECT COUNT(*) INTO role_count FROM roles;
  SELECT COUNT(*) INTO permission_count FROM permissions;
  SELECT COUNT(*) INTO assignment_count FROM user_roles;
  
  -- Check for issues
  IF tenant_count = 0 THEN
    issues := issues || json_build_array('No tenants found');
  END IF;
  
  IF role_count = 0 THEN
    issues := issues || json_build_array('No roles found');
  END IF;
  
  IF permission_count = 0 THEN
    issues := issues || json_build_array('No permissions found');
  END IF;
  
  IF assignment_count = 0 THEN
    issues := issues || json_build_array('No user role assignments found');
  END IF;
  
  -- Build result
  result := json_build_object(
    'status', CASE WHEN json_array_length(issues) = 0 THEN 'ready' ELSE 'issues_found' END,
    'summary', json_build_object(
      'users', user_count,
      'tenants', tenant_count,
      'roles', role_count,
      'permissions', permission_count,
      'assignments', assignment_count
    ),
    'issues', issues,
    'next_steps', CASE 
      WHEN json_array_length(issues) = 0 THEN 
        json_build_array(
          'Database setup complete!',
          'Run: SELECT complete_fresh_setup() to finalize',
          'Test login with admin@acme.com / password123'
        )
      ELSE
        json_build_array('Resolve the issues above before proceeding')
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MASTER SETUP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_fresh_setup()
RETURNS TEXT AS $$
DECLARE
  validation_result JSON;
  result TEXT := '';
BEGIN
  -- Run validation
  SELECT validate_system_setup() INTO validation_result;
  
  result := 'Complete fresh setup executed successfully! ' ||
            CASE WHEN validation_result->>'status' = 'ready' 
                 THEN 'System is ready for use.'
                 ELSE 'Issues found - check validation results.' END;
  
  RAISE NOTICE '%', result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EXECUTE SETUP AND SHOW SUMMARY
-- ============================================================================

DO $$
DECLARE
  validation_result JSON;
  user_count INTEGER;
  tenant_count INTEGER;
  role_count INTEGER;
  permission_count INTEGER;
  assignment_count INTEGER;
BEGIN
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'COMPLETE FRESH START MIGRATION - EXECUTING';
  RAISE NOTICE '===============================================';
  
  -- Run complete setup
  PERFORM complete_fresh_setup();
  
  -- Get final counts
  SELECT COUNT(*) INTO user_count FROM public.users;
  SELECT COUNT(*) INTO tenant_count FROM tenants;
  SELECT COUNT(*) INTO role_count FROM roles;
  SELECT COUNT(*) INTO permission_count FROM permissions;
  SELECT COUNT(*) INTO assignment_count FROM user_roles;
  
  RAISE NOTICE '';
  RAISE NOTICE 'SETUP COMPLETE!';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'SYSTEM SUMMARY:';
  RAISE NOTICE '  Tenants: %', tenant_count;
  RAISE NOTICE '  Users: %', user_count;
  RAISE NOTICE '  Roles: %', role_count;
  RAISE NOTICE '  Permissions: %', permission_count;
  RAISE NOTICE '  Role Assignments: %', assignment_count;
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Create auth users via Supabase dashboard or API:';
  RAISE NOTICE '   admin@acme.com / password123';
  RAISE NOTICE '   manager@acme.com / password123';
  RAISE NOTICE '   engineer@acme.com / password123';
  RAISE NOTICE '   user@acme.com / password123';
  RAISE NOTICE '   customer@acme.com / password123';
  RAISE NOTICE '   superadmin@platform.com / password123';
  RAISE NOTICE '';
  RAISE NOTICE '2. The system will automatically sync auth users';
  RAISE NOTICE '3. Test login with admin@acme.com';
  RAISE NOTICE '';
  RAISE NOTICE 'OR run the seed scripts for automatic auth setup:';
  RAISE NOTICE '  npx tsx scripts/seed-auth-users.ts';
  RAISE NOTICE '  tsx scripts/sync-auth-to-sql.ts';
  RAISE NOTICE '';
  RAISE NOTICE '===============================================';
END $$;
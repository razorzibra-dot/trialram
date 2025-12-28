-- ============================================================================
-- MIGRATION: Add Missing Schema Columns
-- Adds preferences, metadata columns to users table and company_id to customers table
-- Also adds missing columns for products and other tables
--
-- This migration fixes schema synchronization issues where application code
-- expects columns that were missing from the database schema.
--
-- Columns Added:
-- - users.preferences: JSONB (default '{}')
-- - users.metadata: JSONB (default '{}')
-- - customers.company_id: UUID (foreign key to companies.id)
-- - products.is_active: BOOLEAN (default TRUE)
-- - products.sku: VARCHAR(100) (renamed from code)
-- - Various deleted_at columns for soft delete functionality
--
-- Date: December 5, 2025 (Updated: December 6, 2025)
-- ============================================================================

-- Add preferences column to users table (expected by application)
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Add metadata column to users table (expected by application)
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add company_id foreign key to customers table (expected by application)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Add index for the new company_id column for performance
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);

-- Add is_active column to products table (expected by application)
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Rename code column to sku in products table for consistency (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'code') THEN
        ALTER TABLE products RENAME COLUMN code TO sku;
    END IF;
END $$;

-- Add deleted_at columns for soft delete functionality
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE service_contracts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE job_works ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
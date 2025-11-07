-- ============================================================================
-- Migration: Add Missing Company Columns
-- Date: 2025-02-11
-- ============================================================================

-- Add missing columns to companies table to support extended company data

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS founded_year VARCHAR(20),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS domain VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'pro',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_companies_registration_number ON companies(registration_number);
CREATE INDEX IF NOT EXISTS idx_companies_tax_id ON companies(tax_id);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_plan ON companies(plan);

-- Add comments for documentation
COMMENT ON COLUMN companies.registration_number IS 'Company registration/incorporation number';
COMMENT ON COLUMN companies.tax_id IS 'Tax identification number (TIN/VAT ID)';
COMMENT ON COLUMN companies.founded_year IS 'Year the company was founded';
COMMENT ON COLUMN companies.notes IS 'Additional notes about the company';
COMMENT ON COLUMN companies.domain IS 'Company domain/website domain';
COMMENT ON COLUMN companies.city IS 'City where company is located';
COMMENT ON COLUMN companies.country IS 'Country where company is located';
COMMENT ON COLUMN companies.plan IS 'Company subscription plan level';
COMMENT ON COLUMN companies.subscription_status IS 'Status of company subscription';
COMMENT ON COLUMN companies.trial_ends_at IS 'When the company trial subscription ends';
COMMENT ON COLUMN companies.metadata IS 'JSON metadata for extended company information';
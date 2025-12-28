-- ============================================================================
-- MIGRATION: 20251227000001 - Sync Leads with Deals Schema
-- ============================================================================
-- Purpose: Make leads table fully consistent with deals table schema
-- Changes:
--   1. Add updated_by column to track who updated the lead
--   2. Remove assigned_to_name column (will be virtual via JOIN)
--   3. Add 'cancelled' status to lead status values
-- ============================================================================

-- ============================================================================
-- 1. Add updated_by column to leads table
-- ============================================================================
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. Drop assigned_to_name column (will become virtual via JOIN)
-- ============================================================================
ALTER TABLE leads
DROP COLUMN IF EXISTS assigned_to_name;

-- ============================================================================
-- 3. Update lead status constraint to include 'cancelled'
-- ============================================================================
-- First, drop the existing constraint
ALTER TABLE leads
DROP CONSTRAINT IF EXISTS check_lead_status;

-- Add new constraint with cancelled status
ALTER TABLE leads
ADD CONSTRAINT check_lead_status CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'cancelled'));

-- ============================================================================
-- 4. Create index on updated_by for query performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_leads_updated_by ON leads(updated_by);

-- ============================================================================
-- Notes:
-- - assigned_to_name is now a VIRTUAL field computed via JOIN with users table
-- - Service will JOIN users table to get: first_name, last_name, email
-- - This eliminates data duplication and ensures consistency
-- - Migration compatible with supabaseLeadsService refactor
-- ============================================================================

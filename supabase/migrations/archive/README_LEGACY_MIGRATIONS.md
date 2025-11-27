# Legacy Migrations Archive

This directory contains migration files that have been superseded by the comprehensive database reset script.

## What's Here

- All migration files from the original 60+ file collection
- Superseded by: `20251124000001_complete_database_reset.sql`
- Kept for historical reference and audit purposes

## Why These Files Were Archived

The consolidated database reset script (`20251124000001_complete_database_reset.sql`) now handles:
- Complete schema creation in one operation
- All Row Level Security (RLS) policies
- Permission system with Resource:Action format
- Seed data for all tenants, roles, and permissions
- Auto-sync functions for authentication
- Performance indexes
- Validation functions

## Cleanup Date
November 23, 2025

## Action Required
No action needed. The new consolidated script is automatically used when running:
```bash
supabase db reset
```

## Historical Note
These files represent the evolution of the database schema and contain valuable insights into the system's architectural decisions. They were retained for reference but are no longer needed for database operations.
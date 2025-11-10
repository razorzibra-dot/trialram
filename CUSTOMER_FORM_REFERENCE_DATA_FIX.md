---
title: Customer Form Reference Data Fix
description: Updated Industry and Company Size dropdowns to fetch from dynamic reference_data table instead of hardcoded values
date: 2025-03-11
author: AI Agent
version: 1.0.0
status: completed
projectName: PDS-CRM-Application
reportType: bug-fix
---

# Customer Form Reference Data Fix

## Problem Statement

The customer form's **Industry** and **Company Size** dropdowns were using **hardcoded mock data** instead of fetching from the dynamic reference data tables in Supabase.

### Issue Details

| Dropdown | Previous | Current |
|----------|----------|---------|
| **Industry** | ❌ Hardcoded 12 values | ✅ Dynamic from `reference_data` table |
| **Company Size** | ❌ Hardcoded 5 values | ✅ Dynamic from `reference_data` table |
| **Assigned To (Users)** | ✅ Already dynamic | ✅ Still working |

### Root Cause

Both hooks had TODO comments indicating future implementation:

```typescript
// Currently returns mock data
// TODO: In future, fetch from Supabase configuration table
return MOCK_INDUSTRIES;
```

However, the infrastructure was **already in place**:
- ✅ Database table: `reference_data` with flexible schema
- ✅ Mock service: `referenceDataService.ts` 
- ✅ Supabase service: `src/services/api/supabase/referenceDataService.ts`
- ✅ Service factory: Already routes `referenceDataService`

---

## Solution

### Files Modified

#### 1. **useIndustries Hook**
- **File**: `src/modules/features/customers/hooks/useIndustries.ts`
- **Change**: Replaced hardcoded mock data with service factory call
- **Query**: Fetches from `reference_data` table with `category='industry'`

**Before**:
```typescript
const MOCK_INDUSTRIES: Industry[] = [
  { id: '1', name: 'Technology', description: '...' },
  // ... 11 more hardcoded values
];

async function fetchIndustries(): Promise<Industry[]> {
  return MOCK_INDUSTRIES;
}
```

**After**:
```typescript
async function fetchIndustries(): Promise<Industry[]> {
  const referenceData = await referenceDataService.getReferenceData('industry');
  return referenceData.map(mapReferenceDataToIndustry);
}
```

#### 2. **useCompanySizes Hook**
- **File**: `src/modules/features/customers/hooks/useCompanySizes.ts`
- **Change**: Replaced hardcoded mock data with service factory call
- **Query**: Fetches from `reference_data` table with `category='company_size'`

**Before**:
```typescript
const MOCK_COMPANY_SIZES: CompanySize[] = [
  { id: '1', name: 'Startup', ... },
  // ... 4 more hardcoded values
];

async function fetchCompanySizes(): Promise<CompanySize[]> {
  return MOCK_COMPANY_SIZES;
}
```

**After**:
```typescript
async function fetchCompanySizes(): Promise<CompanySize[]> {
  const referenceData = await referenceDataService.getReferenceData('company_size');
  return referenceData.map(mapReferenceDataToCompanySize);
}
```

---

## Architecture Overview

### 8-Layer Sync Pattern

```
┌─────────────────────────────────────────────────────┐
│  Layer 6: UI Component                              │
│  CustomerFormPanel.tsx                              │
└────────────────┬────────────────────────────────────┘
                 │ Uses hooks
                 ↓
┌─────────────────────────────────────────────────────┐
│  Layer 5: Custom Hooks                              │
│  useIndustries() & useCompanySizes()                │
│  ✅ Now fetch from service factory                   │
└────────────────┬────────────────────────────────────┘
                 │ Calls service factory
                 ↓
┌─────────────────────────────────────────────────────┐
│  Layer 4: Service Factory                           │
│  referenceDataService (serviceFactory.ts)           │
│  Routes between mock and supabase                   │
└────────────────┬────────────────────────────────────┘
                 │
        ┌────────┴───────────┐
        │                    │
        ↓                    ↓
┌──────────────────┐  ┌──────────────────────────┐
│  Mock Service    │  │  Supabase Service        │
│  (VITE_API_MODE  │  │  (VITE_API_MODE=         │
│   =mock)         │  │   supabase)              │
│                  │  │  Uses RLS for tenant     │
└────────┬─────────┘  │  isolation               │
         │            └──────────┬───────────────┘
         │                       │
         └───────────┬───────────┘
                     ↓
         ┌──────────────────────┐
         │  Database            │
         │  reference_data      │
         │  table               │
         └──────────────────────┘
```

---

## How It Works

### Data Flow

1. **Hook Initialization**
   ```typescript
   useIndustries() // or useCompanySizes()
   ```

2. **Service Factory Call**
   ```typescript
   referenceDataService.getReferenceData('industry')
   ```

3. **Automatic Backend Routing**
   - If `VITE_API_MODE=mock`: Returns mock data
   - If `VITE_API_MODE=supabase`: Queries PostgreSQL via Supabase

4. **Database Query** (Supabase mode)
   ```sql
   SELECT * FROM reference_data 
   WHERE category='industry' 
   AND is_active=true
   ORDER BY sort_order ASC
   ```

5. **Type Mapping**
   - Database fields (`label`, `description`) → Hook interface (`name`, `description`)
   - Metadata JSON → Component props (e.g., `minEmployees`, `maxEmployees`)

6. **React Query Caching**
   - Cache key: `['industries']` or `['companySizes']`
   - Stale time: 10 minutes
   - Auto-refetch on window focus

---

## Benefits

### ✅ Multi-Backend Support
- **Mock Mode** (Development): Uses mock reference data
- **Supabase Mode** (Production): Queries PostgreSQL dynamically
- **No code changes needed** - Service factory handles routing

### ✅ Dynamic Data Management
- Add/edit/delete industries in database
- Changes appear in dropdown immediately after cache expires
- No code deployment needed

### ✅ Scalability
- Support for unlimited reference data categories
- Same pattern works for: priorities, severities, departments, status options, etc.
- Extensible metadata support (JSON format)

### ✅ Tenant Isolation
- Supabase RLS automatically filters by tenant
- Multiple organizations, separate data
- No data leakage

---

## Database Schema

The solution uses the existing **`reference_data`** table:

```sql
CREATE TABLE reference_data (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  category VARCHAR(100) NOT NULL,   -- 'industry', 'company_size', etc.
  key VARCHAR(100) NOT NULL,         -- Unique identifier within category
  label VARCHAR(255) NOT NULL,       -- Display name (e.g., "Technology")
  description TEXT,                  -- Explanation (optional)
  metadata JSONB DEFAULT '{}',       -- Flexible JSON for extra data
  sort_order INTEGER,                -- Display order
  is_active BOOLEAN DEFAULT true,    -- Soft delete
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Example Data

```json
{
  "id": "uuid-1",
  "tenant_id": "tenant-1",
  "category": "industry",
  "key": "technology",
  "label": "Technology",
  "description": "Software, IT, Hardware",
  "metadata": {},
  "sort_order": 1,
  "is_active": true
}
```

---

## Configuration

### Adding New Reference Data

To add a new industry or company size:

**Option 1: Via Database (Supabase Dashboard)**
```sql
INSERT INTO reference_data (tenant_id, category, key, label, description, sort_order, is_active)
VALUES (
  'your-tenant-id',
  'industry',
  'blockchain',
  'Blockchain & Crypto',
  'Cryptocurrency, Web3, Blockchain Technology',
  13,
  true
);
```

**Option 2: Via Mock Service (Development)**
Update `MOCK_INDUSTRIES` or `MOCK_COMPANY_SIZES` in the referenceDataService.ts

---

## Testing

### Verify the Fix

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Navigate to Customer Form**
   - Click "New Customer" or edit existing customer
   - Open "Business Information" section

3. **Check Dropdowns**
   - **Industry**: Should show dynamic list (not hardcoded)
   - **Company Size**: Should show dynamic list (not hardcoded)
   - **Assigned To**: Should show users (already working)

4. **Verify Both Modes**
   ```bash
   # Test with mock data
   VITE_API_MODE=mock npm run dev
   
   # Test with Supabase
   VITE_API_MODE=supabase npm run dev
   ```

### Adding Test Data

To add test data for development:

```sql
-- Add test industries
INSERT INTO reference_data (tenant_id, category, key, label, sort_order, is_active)
SELECT 'mock-tenant-001', 'industry', 'tech', 'Technology', 1, true
UNION ALL SELECT 'mock-tenant-001', 'industry', 'finance', 'Finance', 2, true
UNION ALL SELECT 'mock-tenant-001', 'industry', 'retail', 'Retail', 3, true;

-- Add test company sizes
INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active)
SELECT 'mock-tenant-001', 'company_size', 'startup', 'Startup', '{"minEmployees":1,"maxEmployees":50}'::jsonb, 1, true
UNION ALL SELECT 'mock-tenant-001', 'company_size', 'small', 'Small', '{"minEmployees":51,"maxEmployees":250}'::jsonb, 2, true;
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-03-11 | ✅ Initial fix - Updated hooks to fetch from reference_data table |

---

## Related Documentation

- **Reference Data Service**: `src/services/referenceDataService.ts`
- **Supabase Service**: `src/services/api/supabase/referenceDataService.ts`
- **Service Factory**: `src/services/serviceFactory.ts`
- **Database Schema**: `supabase/migrations/20250315000002_create_reference_data.sql`
- **Customer Module**: `src/modules/features/customers/DOC.md`

---

## Impact Assessment

### ✅ What Changed
- Industry dropdown data source
- Company size dropdown data source
- Hook implementation

### ✅ What Stayed the Same
- Component UI/UX (no visual changes)
- Hook interface/API (same return types)
- Form validation rules
- Database schema (already existed)

### ✅ No Breaking Changes
- Backward compatible
- No API changes
- No component props changed
- Existing customers data unaffected

---

## Future Enhancements

This pattern can be extended to support other dropdowns:

1. **Priorities** - `getReferenceData('priority')`
2. **Severities** - `getReferenceData('severity')`
3. **Departments** - `getReferenceData('department')`
4. **Status Options** - Already using `getStatusOptions(module)`
5. **Custom Fields** - Any category with `getReferenceData('category-name')`

---

**Status**: ✅ Complete and Tested  
**Build**: ✅ Passes (no lint errors in modified files)  
**Mode Support**: ✅ Both mock and supabase  
**Type Safety**: ✅ Full TypeScript types

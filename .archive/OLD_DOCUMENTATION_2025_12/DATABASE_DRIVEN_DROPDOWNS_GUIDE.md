# Database-Driven Dropdowns Implementation Guide

**Date:** December 15, 2025  
**Purpose:** Eliminate ALL hardcoded dropdown values across the application  
**Approach:** Database-driven reference data using `reference_data` table

---

## 🎯 Problem Statement

**BEFORE (❌ Bad Practice):**
```typescript
// ❌ HARDCODED - Values in code
const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

// ❌ HARDCODED - Cannot be changed without code deployment
const STATUS_OPTIONS = ['pending', 'active', 'completed'];
```

**AFTER (✅ Best Practice):**
```typescript
// ✅ DATABASE-DRIVEN - Values from database
const { data: priorities } = useReferenceDataByCategory(tenantId, 'jobwork_priority');

// ✅ TENANT-SPECIFIC - Each tenant can customize
// ✅ DYNAMIC - No code deployment needed to add/modify options
```

---

## 📊 8-Layer Synchronization for Reference Data

### Layer 1: Database (`reference_data` table)
```sql
CREATE TABLE reference_data (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  category VARCHAR(100),  -- 'jobwork_priority', 'complaint_type', etc.
  key VARCHAR(100),       -- 'low', 'medium', 'high'
  label VARCHAR(255),     -- 'Low Priority', 'Medium Priority'
  description TEXT,
  metadata JSONB,         -- {color: '#green', icon: '⚠️', multiplier: 1.5}
  sort_order INTEGER,
  is_active BOOLEAN,
  ...
);
```

### Layer 2: Types (`src/types/referenceData.types.ts`)
```typescript
export interface ReferenceData {
  id: string;
  tenantId: string;
  category: string;  // camelCase
  key: string;
  label: string;
  description?: string;
  metadata?: Record<string, any>;
  sortOrder: number;
  isActive: boolean;
}
```

### Layer 3: Mock Service (`src/services/__tests__/mockReferenceDataService.ts`)
Already implemented - validates constraints, returns test data

### Layer 4: Supabase Service (`src/services/supabase/referenceDataService.ts`)
Already implemented - SELECTs with snake→camel mapping

### Layer 5: Factory (`src/services/serviceFactory.ts`)
```typescript
export const referenceDataService = createReferenceDataService();
```

### Layer 6: React Context (`src/contexts/ReferenceDataContext.tsx`)
Already implemented - Provides caching, auto-refresh, tenant isolation

### Layer 7: Hooks (`src/hooks/useReferenceDataOptions.ts`)
```typescript
export function useReferenceDataByCategory(
  tenantId: string | undefined,
  category: string
) {
  const { getRefDataByCategory, isLoading, error } = useReferenceData();
  
  const data = useMemo(() => {
    return getRefDataByCategory(category);
  }, [category, getRefDataByCategory]);

  return { data, isLoading, error };
}
```

### Layer 8: UI Components
```tsx
export const MyFormPanel: React.FC<Props> = ({ ... }) => {
  const { tenant } = useCurrentTenant();
  
  // ✅ Database-driven dropdowns
  const { data: priorities = [], isLoading } = useReferenceDataByCategory(
    tenant?.id,
    'jobwork_priority'
  );

  return (
    <Select
      loading={isLoading}
      options={priorities.map(p => ({
        label: p.label,
        value: p.key,
      }))}
    />
  );
};
```

---

## 🔧 Migration: Adding Reference Data

### File: `supabase/migrations/YYYYMMDD_comprehensive_reference_data_seed.sql`

```sql
WITH tenants AS (
  SELECT id FROM public.tenants
),
jobwork_priorities AS (
  VALUES
    -- category, key, label, description, metadata, sort_order
    ('jobwork_priority', 'low', 'Low', 'Standard turnaround', 
     '{"color":"default","turnaroundDays":14,"icon":"📊"}', 1),
    ('jobwork_priority', 'medium', 'Medium', 'Expedited turnaround',
     '{"color":"processing","turnaroundDays":7,"icon":"⚠️"}', 2),
    ('jobwork_priority', 'high', 'High', 'Priority turnaround',
     '{"color":"warning","turnaroundDays":3,"icon":"🔴"}', 3)
)
INSERT INTO public.reference_data (
  id, tenant_id, category, key, label, description, metadata, sort_order, is_active
)
SELECT 
  uuid_generate_v4(), t.id, d.column1, d.column2, d.column3, d.column4, 
  d.column5::jsonb, d.column6, true
FROM tenants t CROSS JOIN jobwork_priorities d
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_data r
  WHERE r.tenant_id = t.id AND r.category = d.column1 AND r.key = d.column2
);
```

### Key Points:
1. **Idempotent**: Uses `WHERE NOT EXISTS` - safe to run multiple times
2. **Multi-tenant**: Seeds for ALL tenants (via CROSS JOIN)
3. **Metadata**: Store colors, icons, multipliers, SLAs in `metadata` JSONB
4. **Ordered**: Use `sort_order` for dropdown ordering

---

## 📝 Implementation Pattern (Step-by-Step)

### Example: Converting ComplaintsFormPanel

#### Step 1: Remove Hardcoded Arrays
```typescript
// ❌ BEFORE
const typeOptions = [
  { label: 'Equipment Breakdown', value: 'breakdown' },
  { label: 'Preventive Maintenance', value: 'preventive' },
];

const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
];
```

#### Step 2: Add Hooks
```typescript
// ✅ AFTER
import { useReferenceDataByCategory } from '@/hooks/useReferenceDataOptions';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';

export const ComplaintsFormPanel: React.FC<Props> = ({ ... }) => {
  const { tenant } = useCurrentTenant();
  
  // Database-driven dropdowns
  const { data: complaintTypes = [], isLoading: loadingTypes } = 
    useReferenceDataByCategory(tenant?.id, 'complaint_type');
    
  const { data: priorities = [], isLoading: loadingPriorities } = 
    useReferenceDataByCategory(tenant?.id, 'complaint_priority');
```

#### Step 3: Update Select Components
```typescript
// ✅ Update Select to use dynamic data
<Select
  placeholder="Select type"
  loading={loadingTypes}
  options={complaintTypes.map(t => ({
    label: t.label,
    value: t.key,
  }))}
/>

<Select
  placeholder="Select priority"
  loading={loadingPriorities}
  options={priorities.map(p => ({
    label: p.label,
    value: p.key,
  }))}
/>
```

#### Step 4: Access Metadata (Optional)
```typescript
// If you stored metadata (colors, icons, etc.)
options={priorities.map(p => {
  const metadata = p.metadata as any || {};
  return {
    label: `${metadata.icon || ''} ${p.label}`,
    value: p.key,
  };
})}
```

---

## 🎨 Metadata Patterns

### Store Rich Data in metadata JSONB

```sql
-- Priority with SLA and styling
('complaint_priority', 'urgent', 'Urgent', 'Critical 4-hour SLA',
 '{"color":"error","sla_hours":4,"badgeColor":"red","icon":"🚨"}', 4)

-- Service type with icon
('service_contract_type', 'support', 'Technical Support', 'Ongoing support',
 '{"icon":"HeadsetIcon","badgeColor":"blue"}', 1)

-- Size with multiplier for pricing
('jobwork_size', 'large', 'Large', 'Large jobs (1.5x cost)',
 '{"multiplier":1.5,"icon":"📦📦📦"}', 3)

-- Status with workflow info
('jobwork_status', 'in_progress', 'In Progress', 'Being worked on',
 '{"color":"processing","icon":"⏳","nextStatuses":["completed","cancelled"]}', 2)
```

### Access in UI:
```typescript
const metadata = priority.metadata as any || {};
const slaHours = metadata.sla_hours || 24;
const badgeColor = metadata.badgeColor || 'default';
const icon = metadata.icon || '';
```

---

## 📋 Category Naming Convention

### Format: `{module}_{field_type}`

| Category | Example Values | Used By |
|----------|---------------|---------|
| `jobwork_priority` | low, medium, high, urgent | JobWorksFormPanel |
| `jobwork_status` | pending, in_progress, completed, delivered | JobWorksFormPanel |
| `jobwork_size` | small, medium, large, xlarge | JobWorksFormPanel |
| `complaint_type` | breakdown, preventive, software_update | ComplaintsFormPanel |
| `complaint_priority` | low, medium, high, urgent | ComplaintsFormPanel |
| `complaint_status` | open, acknowledged, investigating, resolved | ComplaintsFormPanel |
| `service_contract_type` | support, maintenance, consulting, training | ServiceContractsPage |
| `service_contract_status` | active, pending, completed, cancelled | ServiceContractsPage |
| `lead_qualification` | new, contacted, qualified, unqualified | LeadFormPanel |
| `lead_stage` | awareness, interest, consideration, intent | LeadFormPanel |
| `lead_status` | new, contacted, qualified, converted, lost | LeadFormPanel |
| `deal_stage` | lead, qualified, proposal, negotiation, won | DealsPage |
| `ticket_priority` | low, medium, high, urgent | TicketsFormPanel |
| `ticket_status` | open, in_progress, pending_customer, resolved | TicketsFormPanel |
| `ticket_category` | technical, billing, feature_request, bug_report | TicketsFormPanel |
| `product_status` | active, inactive, discontinued, out_of_stock | ProductsFormPanel |
| `user_status` | active, inactive, suspended, pending | UsersPage |
| `product_sale_status` | new, active, renewed, expired, cancelled | ProductSalesPage |
| `customer_status` | active, prospect, inactive, suspended | CustomerFormPanel |
| `lead_source` | referral, website, event, email_campaign | CustomerFormPanel |
| `lead_rating` | hot, warm, cold, nurture | CustomerFormPanel |
| `industry` | manufacturing, technology, finance, healthcare | CustomerFormPanel |
| `company_size` | startup, small, medium, enterprise | CustomerFormPanel |
| `customer_type` | business, individual, government | CustomerFormPanel |

---

## ✅ Files Requiring Updates

### Completed:
- ✅ `src/modules/features/jobworks/components/JobWorksFormPanel.tsx`

### Remaining (Apply Same Pattern):

1. **ComplaintsFormPanel.tsx** (~Line 96-107)
   ```typescript
   // Remove:
   const typeOptions = [...]
   const priorityOptions = [...]
   
   // Add:
   const { data: complaintTypes } = useReferenceDataByCategory(tenant?.id, 'complaint_type');
   const { data: priorities } = useReferenceDataByCategory(tenant?.id, 'complaint_priority');
   ```

2. **LeadFormPanel.tsx** (~Line 63-100)
   ```typescript
   // Remove:
   const qualificationStatuses = [...]
   const leadStages = [...]
   const statusOptions = [...]
   const companySizeOptions = [...]
   const industryOptions = [...]
   
   // Add:
   const { data: qualifications } = useReferenceDataByCategory(tenant?.id, 'lead_qualification');
   const { data: stages } = useReferenceDataByCategory(tenant?.id, 'lead_stage');
   const { data: statuses } = useReferenceDataByCategory(tenant?.id, 'lead_status');
   // company_size and industry already use reference data ✅
   ```

3. **ServiceContractsPage.tsx** (~Line 60-67)
   ```typescript
   // Remove:
   const serviceTypeOptions: Array<...> = [
     'support', 'maintenance', 'consulting', ...
   ];
   
   // Add:
   const { data: serviceTypes } = useReferenceDataByCategory(tenant?.id, 'service_contract_type');
   ```

4. **UsersPage.tsx** (~Line 111)
   ```typescript
   // Remove:
   const allStatuses: UserStatus[] = ['active', 'inactive', 'suspended'];
   
   // Add:
   const { data: userStatuses } = useReferenceDataByCategory(tenant?.id, 'user_status');
   ```

5. **TicketsFormPanel.tsx** (if exists)
   ```typescript
   const { data: ticketPriorities } = useReferenceDataByCategory(tenant?.id, 'ticket_priority');
   const { data: ticketStatuses } = useReferenceDataByCategory(tenant?.id, 'ticket_status');
   const { data: ticketCategories } = useReferenceDataByCategory(tenant?.id, 'ticket_category');
   ```

---

## 🧪 Testing Checklist

### 1. Migration Applied Successfully
```sql
-- Verify reference data exists for all tenants
SELECT tenant_id, category, COUNT(*) as count
FROM reference_data
GROUP BY tenant_id, category
ORDER BY tenant_id, category;

-- Should show ~20 categories per tenant
```

### 2. Dropdowns Populate
- [ ] Job Works: Priority, Status, Size dropdowns populate
- [ ] Complaints: Type, Priority dropdowns populate
- [ ] Leads: Qualification, Stage, Status dropdowns populate
- [ ] Service Contracts: Type dropdown populates
- [ ] Users: Status dropdown populates

### 3. No Hardcoded Arrays Remain
```bash
# Search for remaining hardcoded arrays
grep -r "const.*OPTIONS.*=.*\[" src/modules/features --include="*.tsx"
grep -r "const.*STATUSES.*=.*\[" src/modules/features --include="*.tsx"
grep -r "const.*PRIORITIES.*=.*\[" src/modules/features --include="*.tsx"
```

### 4. Build Passes
```bash
npm run build
# Should complete with 0 errors
```

### 5. No Console Errors
```bash
npm run dev
# Open browser console - no errors when opening forms
```

---

## 🎓 Best Practices

### DO ✅
1. **Always use `useReferenceDataByCategory` hook** - Never fetch directly
2. **Show loading states** - `loading={isLoading}` on Select components
3. **Handle empty states** - Show message if no options available
4. **Use metadata for rich data** - Colors, icons, multipliers
5. **Keep categories namespaced** - `{module}_{field}` format
6. **Seed for all tenants** - Use CROSS JOIN in migrations
7. **Make migrations idempotent** - Use WHERE NOT EXISTS
8. **Document metadata structure** - In migration comments

### DON'T ❌
1. **Never hardcode dropdown values** - Always use database
2. **Don't bypass hooks** - Don't call services directly in components
3. **Don't forget tenant context** - Always pass `tenant?.id`
4. **Don't duplicate categories** - Reuse existing categories
5. **Don't skip loading states** - Always show when fetching
6. **Don't modify reference_data structure** - Extend via metadata
7. **Don't forget sort_order** - Controls display order
8. **Don't skip migration testing** - Always verify seed data

---

## 🚀 Deployment Steps

### 1. Apply Migration
```bash
# Development
supabase migration new comprehensive_reference_data_seed
supabase db push

# Production
# Copy migration file to production deployment
# Run via CI/CD or manually
```

### 2. Verify Data
```sql
SELECT category, COUNT(*) FROM reference_data WHERE tenant_id = '<your-tenant-id>' GROUP BY category;
```

### 3. Deploy Code
```bash
git add .
git commit -m "feat: database-driven dropdowns across all modules"
git push
```

### 4. Test in Production
- Open each form
- Verify dropdowns populate
- Check no console errors
- Verify tenant-specific data shown

---

## 📚 Related Documentation

- **Architecture**: `ARCHITECTURE.md` - 8-layer pattern
- **RLS**: `RLS_BEST_PRACTICES.md` - Tenant isolation policies
- **Implementation**: `COMPREHENSIVE_IMPLEMENTATION_GUIDE.md` - Full guide
- **Permissions**: `ELEMENT_PERMISSION_GUIDE.md` - UI element permissions

---

## 🔍 Troubleshooting

### Dropdowns Not Populating

**Problem**: Select shows empty/loading indefinitely

**Check**:
1. Migration applied? `SELECT * FROM reference_data WHERE category = 'your_category'`
2. Tenant ID correct? `console.log(tenant?.id)`
3. RLS policies allow read? Check user permissions
4. Hook called correctly? `console.log({ data, isLoading, error })`

### Wrong Values Shown

**Problem**: Seeing another tenant's data

**Check**:
1. RLS policies enforced? `ALTER TABLE reference_data ENABLE ROW LEVEL SECURITY;`
2. Passing correct tenant ID? Must be from `useCurrentTenant()`
3. User authenticated? Check `auth.uid()`

### Metadata Not Working

**Problem**: Icons, colors not displaying

**Check**:
1. Metadata is JSONB: `SELECT metadata::text FROM reference_data`
2. Parsing correctly: `const metadata = option.metadata as any || {}`
3. Keys match: `metadata.icon`, `metadata.color`, etc.

---

**Migration Created**: `20251215000001_comprehensive_reference_data_seed.sql`  
**Status**: ✅ JobWorks completed, 5 modules remaining  
**Next**: Apply pattern to remaining modules following this guide

# Dropdown Implementation Audit Report

## Summary
This report audits all dropdowns across the application to verify they're correctly implemented and seeded.

## Architecture Overview
- **Layer 8 (Components)**: UI components like dropdowns
- **Layer 7 (Hooks)**: Custom hooks (useIndustries, useCompanySizes, useReferenceData)
- **Layer 6 (Context)**: ReferenceDataContext provides centralized data
- **Layer 5 (Service Factory)**: Routes to mock/supabase services
- **Layers 4-2 (Services)**: Implement actual queries
- **Layer 1 (Database)**: `reference_data` and `status_options` tables

## Two Table Architecture
1. **status_options**: Module-specific statuses (sales, tickets, contracts, jobwork, complaints, service_contracts)
2. **reference_data**: Generic categories (priority, severity, department, industry, competency_level, company_size, product_type)

---

## Audit Results

### ✅ CORRECTLY IMPLEMENTED

#### 1. **Customers Module**
- **File**: `src/modules/features/customers/components/CustomerFormPanel.tsx`
- **Implementation**: Direct hooks
  - `useIndustries()` → Gets from reference_data category 'industry'
  - `useCompanySizes()` → Gets from reference_data category 'company_size'
- **Seeding Status**: ✅ COMPLETE
  - Industries: 9 items seeded for all 3 tenants
  - Company Sizes: 5 items seeded for all 3 tenants
- **Status**: WORKING

---

#### 2. **Tickets Module** 
- **File**: `src/modules/features/tickets/components/TicketsFormPanel.tsx`
- **Implementation**: Uses ReferenceDataContext
  ```typescript
  const { getRefDataByCategory } = useReferenceData();
  const statusOptions = getRefDataByCategory('ticket_status');
  const priorityOptions = getRefDataByCategory('ticket_priority');
  const categoryOptions = getRefDataByCategory('ticket_category');
  const departmentOptions = getRefDataByCategory('ticket_department');
  const suggestedTags = getRefDataByCategory('ticket_tag');
  ```
- **Seeding Status**: ❌ MISSING CATEGORIES
  - `ticket_status` - NOT SEEDED
  - `ticket_priority` - NOT SEEDED
  - `ticket_category` - NOT SEEDED
  - `ticket_department` - NOT SEEDED
  - `ticket_tag` - NOT SEEDED
- **Issue**: These categories need to be added to seed.sql
- **Status**: BROKEN - Returns empty dropdowns

---

#### 3. **Contracts Module**
- **File**: `src/modules/features/contracts/components/ContractFormPanel.tsx`
- **Implementation**: Uses ReferenceDataContext
  ```typescript
  const { getRefDataByCategory } = useReferenceData();
  const typeOptions = getRefDataByCategory('contract_type');
  const statusOptions = getRefDataByCategory('contract_status');
  const priorityOptions = getRefDataByCategory('contract_priority');
  ```
- **Seeding Status**: ❌ MISSING CATEGORIES
  - `contract_type` - NOT SEEDED
  - `contract_status` - NOT SEEDED
  - `contract_priority` - NOT SEEDED
- **Issue**: These categories need to be added to seed.sql
- **Status**: BROKEN - Returns empty dropdowns

---

#### 4. **Sales Module**
- **File**: `src/modules/features/sales/components/SalesDealFormPanel.tsx`
- **Implementation**: Uses `useDealStages()` hook
  - Also uses hardcoded config objects for stages and status
- **Seeding Status**: Unclear - needs investigation
- **Status**: PARTIALLY WORKING - Uses hooks but also has hardcoded data

---

### 📋 MODULES TO AUDIT

Need to check the following modules for dropdown implementations:
- [ ] JobWorks Module
- [ ] Service Contracts Module  
- [ ] Product Sales Module
- [ ] Complaints Module
- [ ] Masters Module (if has dropdowns)
- [ ] Configuration Module (if has dropdowns)

---

## Seeded Reference Data Categories

### Currently Seeded (✅)
- `priority` - 4 items
- `severity` - 4 items
- `department` - 5 items
- `industry` - 9 items ✅ (Fixed)
- `competency_level` - 4 items
- `company_size` - 5 items ✅ (Fixed)
- `product_type` - 3 items

### Missing (❌)
- `ticket_status` - Expected: open, in_progress, resolved, closed, on_hold
- `ticket_priority` - Expected: low, medium, high, urgent
- `ticket_category` - Expected: billing, technical, sales, general, escalation
- `ticket_department` - Expected: support, sales, billing, technical
- `ticket_tag` - Expected: bug, feature_request, urgent, documentation, etc.
- `contract_type` - Expected: service_agreement, purchase_order, nda, custom, licensing
- `contract_status` - Expected: draft, pending_approval, active, expired, terminated
- `contract_priority` - Expected: low, medium, high, critical

---

## Seeded Status Options (For Modules)

### Currently Seeded (✅)
- Sales Module statuses: open, won, lost, cancelled
- Tickets Module statuses: open, in_progress, resolved, closed
- Contracts Module statuses: draft, active, expired, terminated
- JobWork Module statuses: pending, in_progress, completed, cancelled
- Complaints Module statuses: new, under_review, resolved, closed
- Service Contracts Module statuses: draft, pending, active, completed, terminated

---

## Recommendations

### 1. ADD MISSING REFERENCE DATA CATEGORIES
Add the following to `supabase/seed.sql`:

```sql
-- Ticket Reference Data
INSERT INTO reference_data (tenant_id, category, key, label, metadata, sort_order, is_active, created_by)
SELECT * FROM (
  VALUES 
    ('ticket_status', 'open', 'Open', '{"icon":"AlertCircle","color":"#2196F3"}', 10),
    ('ticket_status', 'in_progress', 'In Progress', '{"icon":"Loader","color":"#FF9800"}', 20),
    ('ticket_status', 'resolved', 'Resolved', '{"icon":"CheckCircle","color":"#4CAF50"}', 30),
    ('ticket_priority', 'low', 'Low', '{"icon":"ArrowDown","color":"#4CAF50"}', 10),
    ('ticket_priority', 'medium', 'Medium', '{"icon":"ArrowRight","color":"#FFA500"}', 20),
    ('ticket_priority', 'high', 'High', '{"icon":"ArrowUp","color":"#FF6B6B"}', 30),
    ('ticket_category', 'billing', 'Billing', '{"icon":"DollarSign"}', 10),
    ('ticket_category', 'technical', 'Technical', '{"icon":"Tool"}', 20),
    ('ticket_category', 'sales', 'Sales', '{"icon":"TrendingUp"}', 30),
    ...
) AS data(category, key, label, metadata, sort_order)
CROSS JOIN tenants t
```

### 2. UPDATE TICKET FORM
Change from hardcoded categories to reference_data categories matching what's seeded

### 3. UPDATE CONTRACT FORM  
Change from hardcoded categories to reference_data categories matching what's seeded

### 4. AUDIT REMAINING MODULES
Check JobWorks, ServiceContracts, ProductSales, Complaints modules for proper dropdown implementations

### 5. IMPLEMENT CONSISTENCY PATTERN
Ensure all modules follow one of these patterns:
- **Pattern A (Customers)**: Create dedicated hooks that fetch from reference_data
- **Pattern B (Tickets/Contracts)**: Use ReferenceDataContext with getRefDataByCategory()

Both patterns are valid - choose based on module complexity.

---

## Implementation Checklist

- [ ] Seed all missing reference_data categories
- [ ] Test Tickets module dropdowns
- [ ] Test Contracts module dropdowns  
- [ ] Audit JobWorks module
- [ ] Audit ServiceContracts module
- [ ] Audit ProductSales module
- [ ] Audit Complaints module
- [ ] Verify all dropdowns return data in browser console
- [ ] Run integration tests
- [ ] Verify RLS policies allow access for all users

---

## How to Add Missing Categories

1. Open `supabase/seed.sql`
2. Add new INSERT statements for reference_data
3. Use CROSS JOIN with tenants to apply to all tenants
4. Run `supabase db reset`
5. Test in browser console

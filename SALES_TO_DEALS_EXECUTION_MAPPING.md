# Sales to Deals Renaming - Execution Mapping

This document provides exact file paths and changes for systematic execution of the sales → deals renaming.

---

## Part A: File Moves and Renames

### A.1: Service Layer Consolidation

#### FILES TO MOVE TO `/src/services/deals/mock/`

```
FROM: src/services/sales/mockSalesService.ts
TO:   src/services/deals/mock/mockDealsService.ts
CLASS RENAME: class MockSalesService → class MockDealsService
EXPORT RENAME: export mockSalesService → export mockDealsService
```

#### FILES TO MOVE TO `/src/services/deals/`

```
FROM: src/services/sales/mockLeadsService.ts
TO:   src/services/deals/mock/mockLeadsService.ts
ACTION: Move (no class rename - LeadsService stays as is)
```

```
FROM: src/services/sales/leadsService.ts
TO:   src/services/deals/leadsService.ts
ACTION: Move (no rename)
```

#### FILES TO MOVE TO `/src/services/deals/supabase/`

```
FROM: src/services/sales/supabase/salesService.ts
TO:   src/services/deals/supabase/dealsService.ts
CLASS RENAME: class SalesService → class DealsService
EXPORT RENAME: export supabaseSalesService → export supabaseDealsService
```

```
FROM: src/services/sales/supabase/leadsService.ts
TO:   src/services/deals/supabase/leadsService.ts
ACTION: Move (no rename)
```

#### FILE TO DELETE

```
DELETE: src/services/deals/mockDealService.ts
REASON: Duplicate with mockDealsService (after rename)
```

#### DELETE ENTIRE FOLDER

```
DELETE: src/services/sales/
After moving all files out
```

### A.2: Feature Module Directory Rename

```
FROM DIRECTORY: src/modules/features/sales/
TO DIRECTORY:   src/modules/features/deals/
ACTION: Rename entire folder
```

---

## Part B: Component File Renames (within renamed directory)

All these operations happen AFTER renaming the parent directory:

### B.1: Component Files

```
src/modules/features/deals/components/SalesDealFormPanel.tsx
→ src/modules/features/deals/components/DealFormPanel.tsx
EXPORT RENAME: export const SalesDealFormPanel → export const DealFormPanel
INTERFACE RENAME: interface SalesDealFormPanelProps → interface DealFormPanelProps
```

```
src/modules/features/deals/components/SalesDealDetailPanel.tsx
→ src/modules/features/deals/components/DealDetailPanel.tsx
EXPORT RENAME: export const SalesDealDetailPanel → export const DealDetailPanel
INTERFACE RENAME: interface SalesDealDetailPanelProps → interface DealDetailPanelProps
```

```
src/modules/features/deals/components/SalesList.tsx
→ src/modules/features/deals/components/DealsList.tsx
EXPORT RENAME: export const SalesList → export const DealsList
INTERFACE RENAME: interface SalesListProps → interface DealsListProps
```

### B.2: View File

```
src/modules/features/deals/views/SalesPage.tsx
→ src/modules/features/deals/views/DealsPage.tsx
EXPORT RENAME: export const SalesPage → export const DealsPage
All component imports updated to new names
```

### B.3: Hook Files

```
src/modules/features/deals/hooks/useSales.ts
→ src/modules/features/deals/hooks/useDeals.ts

FUNCTION RENAMES:
- export function useSalesStore() → export function useDealStore()
- export function useDeals() → export function useDeals() [stays same]
- export function useCreateDeal() → [stays same]
- export function useUpdateDeal() → [stays same]
- export function useDeleteDeal() → [stays same]
- export function useSalesStats() → export function useDealStats()
- export function useSalesByCustomer() → export function useDealsByCustomer()
- export function useBulkDeals() → [stays same]
- export function useExportDeals() → [stays same]
```

```
src/modules/features/deals/hooks/useSalesPipeline.ts
→ src/modules/features/deals/hooks/useDealPipeline.ts
FUNCTION RENAME: export function useSalesPipeline() → export function useDealPipeline()
```

### B.4: Store File

```
src/modules/features/deals/store/salesStore.ts
→ src/modules/features/deals/store/dealStore.ts
FUNCTION RENAME: export const useSalesStore → export const useDealStore
STORE STATE UPDATES:
  - setDeals (already correct)
  - addDeal (already correct)
  - updateDeal (already correct)
  - deleteDeal (already correct)
  - clearDeals (already correct)
  - setFilters (already correct)
  - addFilters (already correct)
  - setLoading → setLoading (stays)
  - setError → setError (stays)
  - setPagination → setPagination (stays)
  - All internal 'sales' references → 'deals'
```

### B.5: Service File

```
src/modules/features/deals/services/salesService.ts
→ src/modules/features/deals/services/dealService.ts
INTERFACE RENAME: export interface ISalesService → export interface IDealService
```

---

## Part C: Import Updates

### C.1: Service Factory (`src/services/serviceFactory.ts`)

**IMPORT CHANGES**:
```typescript
// Line ~13: OLD
import { mockSalesService } from './sales/mockSalesService';

// NEW
import { mockDealsService } from './deals/mock/mockDealsService';

---

// Line ~14: OLD
import { mockLeadsService } from './sales/mockLeadsService';

// NEW
import { mockLeadsService } from './deals/mock/mockLeadsService';

---

// Line ~41: OLD
import { supabaseSalesService } from './sales/supabase/salesService';

// NEW
import { supabaseDealsService } from './deals/supabase/dealsService';

---

// Line ~42: OLD
import { supabaseLeadsService } from './sales/supabase/leadsService';

// NEW
import { supabaseLeadsService } from './deals/supabase/leadsService';
```

**REGISTRY ENTRY CHANGE** (around line 253):
```typescript
// OLD
sales: {
  mock: mockSalesService,
  supabase: supabaseSalesService,
  description: 'Sales & deal management'
},

// NEW
deals: {
  mock: mockDealsService,
  supabase: supabaseDealsService,
  description: 'Sales deals and closed opportunities management'
},
```

**EXPORT ADDITION** (at end of file):
```typescript
// NEW EXPORT
export const dealsService = createServiceProxy('deals');

// OPTIONAL: Keep for backward compatibility
export const salesService = createServiceProxy('deals'); // Alias
```

### C.2: Feature Module Index (`src/modules/features/deals/index.ts`)

```typescript
// OLD EXPORTS
export * from './components/SalesList';
export * from './components/SalesDealDetailPanel';
export * from './components/SalesDealFormPanel';
export * from './hooks/useSales';
export * from './store/salesStore';

// NEW EXPORTS
export * from './components/DealsList';
export * from './components/DealDetailPanel';
export * from './components/DealFormPanel';
export * from './hooks/useDeals';
export * from './store/dealStore';
```

### C.3: Component Index (`src/modules/features/deals/components/index.ts`)

```typescript
// OLD
export * from './SalesList';
export * from './SalesDealDetailPanel';
export * from './SalesDealFormPanel';

// NEW
export * from './DealsList';
export * from './DealDetailPanel';
export * from './DealFormPanel';
```

### C.4: Hook Index (`src/modules/features/deals/hooks/index.ts`)

```typescript
// Update all exports from useDeals.ts
// OLD
export { useSalesStore } from './useSales';

// NEW
export { useDealStore } from './useDeals';

// Similar for other hook exports
```

### C.5: Consumer Files - Import Updates

**File**: `src/modules/features/customers/views/CustomerDetailPage.tsx`

```typescript
// OLD (around line 48)
import { useSalesByCustomer } from '@/modules/features/sales/hooks/useSales';

// NEW
import { useDealsByCustomer } from '@/modules/features/deals/hooks/useDeals';

// Also update usage in component:
// OLD
const { sales } = useSalesByCustomer(customerId);

// NEW
const { deals } = useDealsByCustomer(customerId);
```

### C.6: Test Files - Import Updates

**File**: `src/services/__tests__/salesService.test.ts`

```typescript
// OLD (line 2)
import { mockSalesService } from '@/services/salesService';

// NEW
import { mockDealsService } from '@/services/deals/mock/mockDealsService';

// Update all test code references
// OLD
describe('MockSalesService', () => {
  const service = mockSalesService;

// NEW
describe('MockDealsService', () => {
  const service = mockDealsService;
```

**File**: `src/services/__tests__/salesServiceFactory.test.ts`

```typescript
// Update import path and test descriptions
// OLD
import { mockSalesService } from '@/services/sales/mockSalesService';

// NEW
import { mockDealsService } from '@/services/deals/mock/mockDealsService';
```

**File**: `src/modules/features/deals/__tests__/multiTenantSafety.test.ts`

```typescript
// OLD (line 2)
import { mockSalesService } from '@/services/salesService';

// NEW
import { mockDealsService } from '@/services/deals/mock/mockDealsService';

// Update test descriptions from "Sales" to "Deals"
```

---

## Part D: Type/Interface Updates

### D.1: Service Interface Update

**File**: `src/modules/features/deals/services/dealService.ts`

```typescript
// OLD
export interface ISalesService {
  getDeals(filters?: SalesFilters): Promise<PaginatedResponse<Deal>>;
  getDeal(id: string): Promise<Deal>;
  createDeal(data: CreateDealData): Promise<Deal>;
  // ... other methods
}

// NEW
export interface IDealService {
  getDeals(filters?: DealFilters): Promise<PaginatedResponse<Deal>>;
  getDeal(id: string): Promise<Deal>;
  createDeal(data: CreateDealData): Promise<Deal>;
  // ... other methods
}
```

### D.2: Type Imports in Components

**File**: `src/modules/features/deals/components/DealFormPanel.tsx` (renamed from SalesDealFormPanel.tsx)

```typescript
// OLD IMPORTS
import { Deal, Customer, SaleItem } from '@/types/crm';
import { ISalesService } from '../services/salesService';
import { useCreateDeal, useUpdateDeal, useDealStages } from '../hooks/useSales';

// NEW IMPORTS
import { Deal, Customer, DealItem } from '@/types/crm';
import { IDealService } from '../services/dealService';
import { useCreateDeal, useUpdateDeal, useDealStages } from '../hooks/useDeals';
```

**File**: `src/modules/features/deals/components/DealDetailPanel.tsx`

```typescript
// OLD IMPORTS
import { ISalesService } from '../services/salesService';

// NEW IMPORTS
import { IDealService } from '../services/dealService';
```

**File**: `src/modules/features/deals/hooks/useDeals.ts` (renamed from useSales.ts)

```typescript
// OLD IMPORTS
import { useSalesStore } from '../store/salesStore';
import { ISalesService } from '../services/salesService';

// NEW IMPORTS
import { useDealStore } from '../store/dealStore';
import { IDealService } from '../services/dealService';
```

---

## Part E: Database Schema Changes

### E.1: Migration Script

**File**: `database/migrations/XXX_rename_sales_to_deals.sql`

```sql
BEGIN TRANSACTION;

-- Rename tables
ALTER TABLE IF EXISTS sale_items RENAME TO deal_items;
ALTER TABLE IF EXISTS sales RENAME TO deals;

-- Update foreign key column in deal_items
ALTER TABLE deal_items RENAME COLUMN sale_id TO deal_id;

-- Update any RLS policies that reference 'sales'
DROP POLICY IF EXISTS "Users can view their tenant sales" ON deals;
CREATE POLICY "Users can view their tenant deals" ON deals
  FOR SELECT
  USING (tenant_id = auth.jwt()->'app_metadata'->>'tenant_id');

-- Add any other RLS policy updates here

COMMIT;
```

### E.2: Service Layer Query Updates

**File**: `src/services/deals/supabase/dealsService.ts`

```typescript
// Update ALL .from('sales') to .from('deals')
// Update ALL .from('sale_items') to .from('deal_items')
// Update ALL .eq('sale_id', ...) to .eq('deal_id', ...)

// EXAMPLE OLD:
const { data, error } = await getSupabaseClient()
  .from('sales')
  .select('*')
  .eq('id', id);

// EXAMPLE NEW:
const { data, error } = await getSupabaseClient()
  .from('deals')
  .select('*')
  .eq('id', id);
```

---

## Part F: Routing Updates

### F.1: Module Routes (`src/modules/features/deals/routes.tsx`)

```typescript
// Update any route configuration that references old module name
// Verify paths use '/deals' not '/sales'

// Example if applicable:
// OLD
const SalesModule = lazy(() => import('@/modules/features/sales'));

// NEW
const DealsModule = lazy(() => import('@/modules/features/deals'));
```

---

## Part G: Content String Updates

### G.1: Component Content Updates

Update all string references in components:

```typescript
// OLD
<Header>Sales Pipeline</Header>
// NEW
<Header>Deals Pipeline</Header>

// OLD
message.success('Sale created successfully');
// NEW
message.success('Deal created successfully');

// OLD
placeholder="Enter sale number"
// NEW
placeholder="Enter deal number"
```

### G.2: Console Logs Updates

```typescript
// OLD
console.log('[Sales Module] Fetching sales...');
// NEW
console.log('[Deals Module] Fetching deals...');

// OLD
console.error('[SalesDealFormPanel] Error:', error);
// NEW
console.error('[DealFormPanel] Error:', error);
```

---

## Part H: Validation Queries

### H.1: Find Remaining References

```bash
# Find remaining 'sales' module references
grep -r "from '@/modules/features/sales" src/

# Find remaining MockSalesService references
grep -r "MockSalesService\|class.*SalesService" src/

# Find remaining table references
grep -r "\.from('sales')\|\.from('sale_items')" src/

# Find component name references
grep -r "SalesDealFormPanel\|SalesDealDetailPanel" src/

# Find hook name references  
grep -r "useSales\|useSalesPipeline" src/

# Find store references
grep -r "useSalesStore" src/
```

### H.2: Verify New References

```bash
# Verify new imports exist
grep -r "from '@/modules/features/deals" src/

# Verify new service exports
grep -r "dealsService\|mockDealsService" src/

# Verify new component names
grep -r "DealFormPanel\|DealDetailPanel\|DealsList" src/

# Verify new hook names
grep -r "useDeals\|useDealPipeline\|useDealStore" src/
```

---

## Part I: Execution Checklist

- [ ] **Phase 1**: Service layer files moved and renamed
- [ ] **Phase 2**: Feature module directory renamed
- [ ] **Phase 3**: Component files renamed
- [ ] **Phase 4**: Hook files renamed
- [ ] **Phase 5**: Store file renamed
- [ ] **Phase 6**: serviceFactory.ts updated
- [ ] **Phase 7**: All module index files updated
- [ ] **Phase 8**: Consumer files updated (CustomerDetailPage, etc.)
- [ ] **Phase 9**: Test files updated
- [ ] **Phase 10**: Type definitions/imports updated
- [ ] **Phase 11**: Content strings updated (console logs, messages)
- [ ] **Phase 12**: Database migration script created
- [ ] **Phase 13**: RLS policies updated
- [ ] **Phase 14**: Build verification (`npm run build`)
- [ ] **Phase 15**: Type checking (`npm run type-check`)
- [ ] **Phase 16**: Linting verification (`npm run lint`)
- [ ] **Phase 17**: Module runtime test
- [ ] **Phase 18**: Functional testing

---

## Part J: Quick Reference

### File Count Summary

| Category | Count | Status |
|---|---|---|
| Service files to move | 5 | Ready |
| Component files to rename | 3 | Ready |
| Hook files to rename | 2 | Ready |
| Store files to rename | 1 | Ready |
| Service files to rename | 1 | Ready |
| View files to rename | 1 | Ready |
| Index files to update | 3 | Ready |
| Consumer files to update | 1-2 | Ready |
| Test files to update | 3 | Ready |
| Configuration files | 1 | Ready |
| **Total** | **~30** | **Ready** |

---

**Document Version**: 1.0  
**Generated**: December 1, 2025  
**Status**: Ready for Implementation

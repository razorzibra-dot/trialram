# Sales to Deals Module Comprehensive Renaming Audit Report

**Report Date**: December 1, 2025  
**Status**: PENDING EXECUTION  
**Scope**: Complete renaming of "sales" module to "deals" across CRM application  
**Complexity**: HIGH - Requires coordinated updates across multiple layers

---

## Executive Summary

This report identifies all files and references that need to be updated for a complete "sales" → "deals" module migration. The migration is complex because:

1. **Dual module structure exists**: `/src/services/sales` (leads + deals) and `/src/services/deals` (newly created)
2. **Component naming convention**: Current "Sales" terminology refers to closed deals (not business sales activities)
3. **Separate modules must remain unchanged**: `sales-activities`, `product-sales`, `productsale`
4. **Service factory registry**: Must be updated to support both old and new references
5. **Database schema**: Table and column names need coordinated updates

---

## Section 1: Files Requiring Renaming

### 1.1 Service Layer - `/src/services/sales`

**Current State**: 5 files + 1 subdirectory
**Target State**: Move to `/src/services/deals` or consolidate

| Current File Path | Target File Path | File Type | Action | Priority |
|---|---|---|---|---|
| `src/services/sales/mockSalesService.ts` | `src/services/deals/mock/mockDealsService.ts` | TypeScript | Rename + Move | HIGH |
| `src/services/sales/mockLeadsService.ts` | `src/services/deals/mock/mockLeadsService.ts` | TypeScript | Move | MEDIUM |
| `src/services/sales/leadsService.ts` | `src/services/deals/leadsService.ts` | TypeScript | Move | MEDIUM |
| `src/services/sales/supabase/salesService.ts` | `src/services/deals/supabase/dealsService.ts` | TypeScript | Rename + Move | HIGH |
| `src/services/sales/supabase/leadsService.ts` | `src/services/deals/supabase/leadsService.ts` | TypeScript | Move | MEDIUM |
| `src/services/deals/mockDealService.ts` | **DELETE** - Duplicate | TypeScript | Delete | HIGH |

**Notes**:
- `/src/services/deals/` already exists with partial implementation
- Consolidate all sales-related services into `/src/services/deals/`
- Maintain `mockLeadsService` and `leadsService` in deals folder (leads are part of deal pipeline)

### 1.2 Feature Module - `/src/modules/features/sales`

**Current State**: Comprehensive sales/deals module with 28 files
**Target State**: Rename to `/src/modules/features/deals`

#### 1.2.1 Directory Structure to Rename

```
src/modules/features/sales/          →  src/modules/features/deals/
├── __tests__/
├── components/
├── constants/
├── hooks/
├── services/
├── store/
├── views/
├── index.ts
├── routes.tsx
└── DOC.md / SALES_FORMS_ENHANCEMENT_GUIDE.md
```

#### 1.2.2 Component Files to Rename

| Current File | Target File | Type | Changes Required |
|---|---|---|---|
| `SalesDealFormPanel.tsx` | `DealFormPanel.tsx` | Component | Rename class/export + update internal references |
| `SalesDealDetailPanel.tsx` | `DealDetailPanel.tsx` | Component | Rename class/export + update internal references |
| `SalesList.tsx` | `DealsList.tsx` | Component | Rename class/export + update internal references |
| `index.ts` (components) | `index.ts` | Index | Update exports |

#### 1.2.3 Hook Files to Rename

| Current File | Target File | Content Updates |
|---|---|---|
| `useSales.ts` | `useDeals.ts` | Rename file + all hook exports |
| `useSalesPipeline.ts` | `useDealPipeline.ts` | Rename file + hook function |
| `usePayments.ts` | Keep name | No change (still business metric) |
| `useRevenue.ts` | Keep name | No change (still business metric) |
| `index.ts` (hooks) | Update exports | Change `useSales` → `useDeals`, `useSalesPipeline` → `useDealPipeline` |

#### 1.2.4 Store Files to Rename

| Current File | Target File | Content Updates |
|---|---|---|
| `salesStore.ts` | `dealStore.ts` | Rename file + update store name + all state setters |

#### 1.2.5 Service Files to Rename

| Current File | Target File | Content Updates |
|---|---|---|
| `services/salesService.ts` | `services/dealService.ts` | Rename interface `ISalesService` → `IDealService` |

#### 1.2.6 View Files to Rename

| Current File | Target File | Content Updates |
|---|---|---|
| `views/SalesPage.tsx` | `views/DealsPage.tsx` | Update component name + import paths |

#### 1.2.7 Test Files to Rename

| Current File | Target File | Action |
|---|---|---|
| `__tests__/multiTenantSafety.test.ts` | `__tests__/multiTenantSafety.test.ts` | Update import paths |

---

## Section 2: Content Updates Required (Class/Function Names)

### 2.1 Class Names to Rename

| Current Class Name | Target Class Name | File(s) | Type |
|---|---|---|---|
| `MockSalesService` | `MockDealsService` | `src/services/deals/mock/mockDealsService.ts` | Class |
| `SalesService` | `DealsService` | `src/services/deals/supabase/dealsService.ts` | Class |
| `SalesList` | `DealsList` | `src/modules/features/deals/components/DealsList.tsx` | React Component |
| `SalesDealFormPanel` | `DealFormPanel` | `src/modules/features/deals/components/DealFormPanel.tsx` | React Component |
| `SalesDealDetailPanel` | `DealDetailPanel` | `src/modules/features/deals/components/DealDetailPanel.tsx` | React Component |

### 2.2 Interface/Type Names to Rename

| Current Name | Target Name | File(s) | Usage |
|---|---|---|---|
| `ISalesService` | `IDealService` | `src/modules/features/deals/services/dealService.ts` | Service interface |
| `ISalesService` | `IDealService` | `src/services/deals/supabase/dealsService.ts` | Service interface |

### 2.3 Hook Function Names to Rename

| Current Function | Target Function | File |
|---|---|---|
| `useDeals` | `useDeals` | `src/modules/features/deals/hooks/useDeals.ts` |
| `useCreateDeal` | `useCreateDeal` | `src/modules/features/deals/hooks/useDeals.ts` |
| `useUpdateDeal` | `useUpdateDeal` | `src/modules/features/deals/hooks/useDeals.ts` |
| `useDeleteDeal` | `useDeleteDeal` | `src/modules/features/deals/hooks/useDeals.ts` |
| `useSalesStats` | `useDealStats` | `src/modules/features/deals/hooks/useDeals.ts` |
| `useSalesStore` | `useDealStore` | `src/modules/features/deals/hooks/useDeals.ts` |
| `useSalesPipeline` | `useDealPipeline` | `src/modules/features/deals/hooks/useDealPipeline.ts` |
| `useSalesByCustomer` | `useDealsByCustomer` | `src/modules/features/deals/hooks/useDeals.ts` |
| `useBulkDeals` | `useBulkDeals` | `src/modules/features/deals/hooks/useDeals.ts` |
| `useExportDeals` | `useExportDeals` | `src/modules/features/deals/hooks/useDeals.ts` |

### 2.4 Store Names to Rename

| Current Store Export | Target Store Export | File |
|---|---|---|
| `useSalesStore` | `useDealStore` | `src/modules/features/deals/store/dealStore.ts` |
| All store state/actions | Update to use `deal` prefix instead of `sales` | Same file |

### 2.5 Variable Names (Factory/Service References)

| Current Variable | Target Variable | Context | Impact |
|---|---|---|---|
| `mockSalesService` | `mockDealsService` | `src/services/serviceFactory.ts` import | Import statement + export |
| `supabaseSalesService` | `supabaseDealsService` | `src/services/serviceFactory.ts` import | Import statement + export |
| `salesService` | `dealsService` | `src/services/serviceFactory.ts` export | Service factory proxy |
| `factorySalesService` | `factoryDealsService` | Component/hook usage | All consumer updates |

---

## Section 3: Service Factory Registry Updates

### 3.1 File: `src/services/serviceFactory.ts`

**Location**: Registry entry in `buildServiceRegistry()` method

**Current Code** (around line 253):
```typescript
sales: {
  mock: mockSalesService,
  supabase: supabaseSalesService,
  description: 'Sales & deal management'
},
```

**Target Code**:
```typescript
deals: {
  mock: mockDealsService,
  supabase: supabaseDealsService,
  description: 'Sales deals and closed opportunities management'
},
```

**Additional Changes**:

1. **Import statements** (lines 12-14):
   - Change: `import { mockSalesService }` → `import { mockDealsService }`
   - Change: `import { supabaseSalesService }` → `import { supabaseDealsService }`
   - Keep: `import { mockLeadsService }` (leads stay in deals context)

2. **Export statements** (bottom of file):
   - Add/Change: `export const dealsService = createServiceProxy('deals');`
   - Keep for compatibility: `export const salesService = createServiceProxy('sales');` → Point to 'deals'

3. **Registry key**: Keep `sales` as a deprecated alias pointing to `deals`

---

## Section 4: Import Path Updates Required

### 4.1 Files Importing from Sales Module

| File | Current Import | Target Import | Changes |
|---|---|---|---|
| `src/modules/features/customers/views/CustomerDetailPage.tsx` | `from '@/modules/features/sales/hooks/useSales'` | `from '@/modules/features/deals/hooks/useDeals'` | Update hook + path |
| `src/services/__tests__/salesService.test.ts` | `from '@/services/salesService'` | `from '@/services/deals/mock/mockDealsService'` | Update path |
| `src/modules/features/sales/__tests__/multiTenantSafety.test.ts` | Internal paths | Update to `../` paths | Update internal imports |
| `src/services/serviceFactory.ts` | Multiple sales imports | Update to deals imports | See Section 3 |

### 4.2 Module Index Exports

**File**: `src/modules/features/deals/index.ts`

Update all export statements:
- `export * from './components/SalesList'` → `export * from './components/DealsList'`
- `export * from './components/SalesDealDetailPanel'` → `export * from './components/DealDetailPanel'`
- `export * from './components/SalesDealFormPanel'` → `export * from './components/DealFormPanel'`

---

## Section 5: Database Schema Changes

### 5.1 Table Name Changes

| Current Table | Target Table | Impact | Notes |
|---|---|---|---|
| `sales` | `deals` | HIGH | Primary table rename |
| `sale_items` | `deal_items` | HIGH | Foreign key reference |

### 5.2 Column Updates Required

**Table: `sales` → `deals`**
```sql
-- Current columns (rename tables)
ALTER TABLE sales RENAME TO deals;
ALTER TABLE sale_items RENAME TO deal_items;
ALTER TABLE deal_items RENAME COLUMN sale_id TO deal_id;

-- No column name changes needed (these are business values, not module references)
-- Keep: sale_number → deal_number (or rename if desired)
-- Keep: stage, status, etc.
```

### 5.3 Foreign Key Updates

| Constraint | Current | Target | Type |
|---|---|---|---|
| Foreign Key | `sale_id` (in sale_items) | `deal_id` | Column rename |
| Reference | `REFERENCES sales(id)` | `REFERENCES deals(id)` | Table reference |

### 5.4 SQL Migration Script

```sql
-- Migration: Rename sales tables to deals
BEGIN;

-- Rename tables
ALTER TABLE IF EXISTS sale_items RENAME TO deal_items;
ALTER TABLE IF EXISTS sales RENAME TO deals;

-- Update foreign keys in deal_items
ALTER TABLE deal_items RENAME COLUMN sale_id TO deal_id;

-- Update any views that reference the old tables
-- (Update queries in dealService.ts to use new table names)

COMMIT;
```

### 5.5 RLS (Row Level Security) Policies Update

Any RLS policies referencing `'sales'` table need to be updated to `'deals'`.

---

## Section 6: Type/Interface Updates

### 6.1 Service Interface Definition

**File**: `src/modules/features/deals/services/dealService.ts`

**Current**:
```typescript
export interface ISalesService {
  getDeals(...): Promise<...>;
  ...
}
```

**Target**:
```typescript
export interface IDealService {
  getDeals(...): Promise<...>;
  ...
}
```

### 6.2 DTO Types

**Files Affected**: `src/types/dtos/salesDtos.ts`

**Current Type Names**:
- `SalesStatsDTO`
- `SalesActivityDTO`
- `Sale`/`SaleItem`

**Keep As-Is**:
- `SalesStatsDTO` (can remain - it's a DTO, not a module reference)
- `SalesActivityDTO` (belongs to sales-activities module)

**Rename**:
- `Sale` → `Deal`
- `SaleItem` → `DealItem`
- `CreateSaleData` → `CreateDealData`
- `SalesFilters` → `DealFilters`

### 6.3 Type Imports in Components

**Example Updates**:
```typescript
// Old
import { Sale, SaleItem } from '@/types/crm';
import { ISalesService } from '../services/salesService';

// New
import { Deal, DealItem } from '@/types/crm';
import { IDealService } from '../services/dealService';
```

---

## Section 7: Detailed File-by-File Changes Summary

### 7.1 Service Factory Changes

**File**: `src/services/serviceFactory.ts`

**Changes Required**:
1. Line ~13: `import { mockSalesService }` → `import { mockDealsService }`
2. Line ~14: `import { supabaseSalesService }` → `import { supabaseDealsService }`
3. Line ~41-42: Update corresponding Supabase imports
4. Line ~253: Registry entry rename from `sales:` to `deals:`
5. Bottom exports: Add `dealsService` export, update `salesService` if needed

### 7.2 Component Rename Operations

**SalesDealFormPanel.tsx → DealFormPanel.tsx**:
```typescript
// OLD
export const SalesDealFormPanel: React.FC<SalesDealFormPanelProps> = ({...}) => {}
interface SalesDealFormPanelProps {}

// NEW
export const DealFormPanel: React.FC<DealFormPanelProps> = ({...}) => {}
interface DealFormPanelProps {}
```

**SalesDealDetailPanel.tsx → DealDetailPanel.tsx**: Same pattern

**SalesList.tsx → DealsList.tsx**: Same pattern

### 7.3 Hook Consolidation

**useDeals.ts**:
- Rename from `useSales.ts`
- Update hook function names:
  - `useCreateDeal` → stays same
  - `useUpdateDeal` → stays same
  - `useSalesStats` → `useDealStats`
  - Export changes for index file

**useDealPipeline.ts**:
- Rename from `useSalesPipeline.ts`
- Update internal references

### 7.4 Store Consolidation

**dealStore.ts** (rename from `salesStore.ts`):
```typescript
// Update store function name
export const useDealStore = create<DealStore>((set) => ({
  deals: [],
  setDeals: (deals) => set({ deals }),
  // All other setters updated from "sales" → "deal"
  ...
}));
```

---

## Section 8: Files NOT to Rename (Critical Exceptions)

⚠️ **MUST REMAIN UNCHANGED**:

| Module/File | Reason |
|---|---|
| `src/services/sales-activities/*` | Separate feature module for activity tracking |
| `src/modules/features/sales-activities/*` | Will be renamed to deal_activities in future |
| `src/services/productsale/*` | Separate business concept (product sales transactions) |
| `src/modules/features/product-sales/*` | Will remain as is |
| `src/types/dtos/productSalesDtos.ts` | Product sales domain types |
| Any "Sales Manager" role/permission | Job title/department - keep as-is |
| `total_sales` metrics | Business KPI - keep as-is |
| `sales_activities` table | Separate table - rename separately |

---

## Section 9: Consumer Files Requiring Import Updates

### 9.1 Components/Views Using Sales Module

| File Path | Current Import | New Import | Changes |
|---|---|---|---|
| `src/modules/features/customers/views/CustomerDetailPage.tsx` | `useSalesByCustomer` from `@/modules/features/sales/...` | `useDealsByCustomer` from `@/modules/features/deals/...` | Update hook + path |
| `src/modules/features/sales/views/SalesPage.tsx` | Multiple internal imports | All paths update (rename to DealsPage) | Full rewrite with new paths |
| `src/modules/features/contracts/...` | May reference sales data | Update any sales imports | Check contracts module |

### 9.2 Test Files Requiring Updates

| Test File | Current Imports | New Imports |
|---|---|---|
| `src/services/__tests__/salesService.test.ts` | `mockSalesService` from `@/services/salesService` | `mockDealsService` from `@/services/deals/mock/...` |
| `src/modules/features/sales/__tests__/multiTenantSafety.test.ts` | All relative imports | Update paths after folder rename |

---

## Section 10: Routes and Navigation Updates

### 10.1 File: `src/modules/features/deals/routes.tsx`

**Current Route References**:
- Route path may contain `/sales`
- Component imports reference old names

**Updates Needed**:
1. Verify route paths (e.g., `/sales` → `/deals` in navigation)
2. Update component imports
3. Update any route metadata/labels

---

## Section 11: Module Index Updates

### 11.1 Feature Module Index: `src/modules/features/deals/index.ts`

**Current Exports** (example):
```typescript
export * from './components/SalesList';
export * from './components/SalesDealDetailPanel';
export * from './components/SalesDealFormPanel';
export * from './hooks/useSales';
export * from './store/salesStore';
```

**Target Exports**:
```typescript
export * from './components/DealsList';
export * from './components/DealDetailPanel';
export * from './components/DealFormPanel';
export * from './hooks/useDeals';
export * from './store/dealStore';
```

---

## Section 12: Execution Order (Recommended)

1. **Phase 1: Service Layer** (Low risk, isolated)
   - Rename `/src/services/sales/*` files
   - Update `serviceFactory.ts`

2. **Phase 2: Type Definitions** (Low risk, isolated)
   - Update DTOs in `src/types/`
   - Update interfaces

3. **Phase 3: Service Factory Registry** (Medium risk, affects all consumers)
   - Update registry entries
   - Add backward compatibility aliases if needed

4. **Phase 4: Feature Module Structure** (Medium risk, folder operations)
   - Rename `/src/modules/features/sales/` → `/src/modules/features/deals/`
   - Update all file paths

5. **Phase 5: Internal Content Updates** (High risk, many files)
   - Rename components/hooks/stores
   - Update class/function names
   - Update internal imports

6. **Phase 6: Consumer Updates** (High risk, widespread impact)
   - Update all imports in other modules
   - Update test files
   - Verify routing/navigation

7. **Phase 7: Database Updates** (Critical risk - data layer)
   - Run migration scripts
   - Update RLS policies
   - Test data access

8. **Phase 8: Verification** (Full system test)
   - Lint and type checking
   - Build and bundle test
   - Integration testing

---

## Section 13: Risk Assessment

### HIGH RISK AREAS

| Area | Risk | Mitigation |
|---|---|---|
| Database table rename | Data loss if migration fails | Backup before execution, test in dev |
| Service factory registry | All modules depend on this | Maintain backward compatibility aliases |
| Import path changes | Build breaks if missed | Automated search/replace with validation |
| Component exports | Module imports break | Update index.ts files systematically |

### MEDIUM RISK AREAS

| Area | Risk | Mitigation |
|---|---|---|
| Hook function renames | Component breaks | Use TypeScript strict mode for detection |
| Store state names | Store access breaks | Update all consumers systematically |
| Type definitions | Compilation errors | Full type check after updates |

### LOW RISK AREAS

| Area | Risk | Mitigation |
|---|---|---|
| Test file updates | Tests fail | Straightforward path/import updates |
| Documentation updates | No functional impact | Updated as part of content changes |
| Constant/comment updates | No functional impact | Updated during content passes |

---

## Section 14: Validation Checklist

- [ ] All `/src/services/sales/` files moved to `/src/services/deals/`
- [ ] ServiceFactory imports updated and tested
- [ ] ServiceFactory registry entry renamed from `sales` → `deals`
- [ ] `/src/modules/features/sales/` directory renamed to `/src/modules/features/deals/`
- [ ] Component files renamed (SalesDeal* → Deal*)
- [ ] Hook files renamed and exports updated
- [ ] Store file renamed and internal state updated
- [ ] All internal imports within deals module updated
- [ ] CustomerDetailPage imports updated
- [ ] Test files updated with new import paths
- [ ] Type definitions updated (DTOs, interfaces)
- [ ] Database migration script created and tested
- [ ] RLS policies updated for new table names
- [ ] Build passes with `npm run build`
- [ ] No TypeScript errors with strict mode
- [ ] No ESLint errors
- [ ] Module loads without runtime errors
- [ ] Routes resolve correctly
- [ ] Deals functionality tests pass

---

## Section 15: Files Summary Table

### Summary by Category

| Category | File Count | Action |
|---|---|---|
| **Service Tier** | 5 | Move to `/src/services/deals/` |
| **Feature Module Structure** | 1 | Rename directory |
| **Components** | 3 | Rename + content update |
| **Hooks** | 8 | 2 rename files + 6 content updates |
| **Store** | 1 | Rename + content update |
| **Services (Module)** | 1 | Rename + content update |
| **Views** | 1 | Rename + content update |
| **Tests** | 1 | Content update (paths) |
| **Index Files** | 2 | Export updates |
| **Configuration** | 1 | `serviceFactory.ts` updates |
| **Database** | 2 | Table rename + RLS update |
| **Consumers** | 1-2 | Import path updates |
| **Total Files** | **~30-40** | |

---

## Section 16: Implementation Notes

### Critical Success Factors

1. **Parallel execution isn't safe**: Do this phase-by-phase to verify at each step
2. **Backward compatibility**: Consider keeping `salesService` as alias to `dealsService` for gradual migration
3. **Testing**: Full integration test required after database migration
4. **Rollback plan**: Keep git commits atomic for each phase
5. **Communication**: Document changes for team awareness

### Useful Commands for Execution

```bash
# Find all references to old paths
grep -r "from '@/modules/features/sales" src/

# Find all class references
grep -r "SalesDeal\|MockSalesService" src/

# Verify no remaining salesService references (except backward compat)
grep -r "\.from('sales')" src/

# TypeScript strict check
npm run lint
npm run type-check
```

---

## Section 17: Post-Migration Validation

### Must Verify

1. Module loads successfully
2. All CRUD operations work
3. Customer deals view shows correctly
4. Deals pipeline renders
5. Export/import functions work
6. Multi-tenant isolation maintained
7. RLS policies enforce correctly
8. No console errors
9. Performance metrics unchanged

---

**Report End**

Generated: December 1, 2025  
Version: 1.0  
Status: Ready for Implementation

# Sales to Deals Migration - Impact Analysis and Dependencies

This document maps all dependencies and impacts for the sales → deals renaming project.

---

## Section 1: Dependency Graph

### 1.1 Service Factory (Core Dependency)

```
src/services/serviceFactory.ts
├── Imports mockDealsService
├── Imports supabaseDealsService
├── Exports dealsService
└── Registry: 'deals' key
    ├── Used by: All modules importing dealsService
    ├── Impact: ServiceFactory changes affect ALL consumers
    └── Risk: HIGH - Central point of failure
```

### 1.2 Feature Module Dependencies

```
src/modules/features/deals/
├── Components/
│   ├── DealFormPanel.tsx
│   │   └── Depends on: useCreateDeal, useUpdateDeal hooks
│   ├── DealDetailPanel.tsx
│   │   └── Depends on: ISalesService interface
│   └── DealsList.tsx
│       └── Depends on: useDeals hook
├── Hooks/
│   ├── useDeals.ts (was useSales.ts)
│   │   ├── Depends on: serviceFactory.dealsService
│   │   ├── Depends on: useDealStore
│   │   └── Depends on: ISalesService interface
│   └── useDealPipeline.ts (was useSalesPipeline.ts)
│       └── Depends on: useDealStore
├── Store/
│   └── dealStore.ts (was salesStore.ts)
│       ├── Used by: All hooks
│       └── Risk: HIGH - State management
└── Views/
    └── DealsPage.tsx (was SalesPage.tsx)
        ├── Depends on: All components
        ├── Depends on: All hooks
        └── Depends on: dealStore
```

### 1.3 External Module Dependencies

```
src/modules/features/customers/
└── CustomerDetailPage.tsx
    └── Imports: useSalesByCustomer (becomes useDealsByCustomer)
        ├── From: @/modules/features/sales/hooks/useSales
        ├── Becomes: @/modules/features/deals/hooks/useDeals
        └── Impact: MEDIUM - Single import point
```

---

## Section 2: All Affected Files by Type

### 2.1 Files Requiring RENAME Operations

**30 files total** will have path/name changes:

#### Service Tier (5 files)
- [ ] `src/services/sales/mockSalesService.ts` → `src/services/deals/mock/mockDealsService.ts`
- [ ] `src/services/sales/mockLeadsService.ts` → `src/services/deals/mock/mockLeadsService.ts`
- [ ] `src/services/sales/leadsService.ts` → `src/services/deals/leadsService.ts`
- [ ] `src/services/sales/supabase/salesService.ts` → `src/services/deals/supabase/dealsService.ts`
- [ ] `src/services/sales/supabase/leadsService.ts` → `src/services/deals/supabase/leadsService.ts`

#### Feature Module Structure (1 directory)
- [ ] Directory: `src/modules/features/sales/` → `src/modules/features/deals/`

#### Components (3 files)
- [ ] `SalesDealFormPanel.tsx` → `DealFormPanel.tsx`
- [ ] `SalesDealDetailPanel.tsx` → `DealDetailPanel.tsx`
- [ ] `SalesList.tsx` → `DealsList.tsx`

#### Hooks (2 files)
- [ ] `useSales.ts` → `useDeals.ts`
- [ ] `useSalesPipeline.ts` → `useDealPipeline.ts`

#### Store (1 file)
- [ ] `salesStore.ts` → `dealStore.ts`

#### Services (1 file)
- [ ] `salesService.ts` → `dealService.ts`

#### Views (1 file)
- [ ] `SalesPage.tsx` → `DealsPage.tsx`

#### Total: 14 files with path/name changes

### 2.2 Files Requiring CONTENT Updates Only

**16 files** will have content changes without path changes:

#### Configuration (1 file)
- [ ] `src/services/serviceFactory.ts` - Registry + imports

#### Indexes (3 files)
- [ ] `src/modules/features/deals/index.ts` - Exports
- [ ] `src/modules/features/deals/components/index.ts` - Exports
- [ ] `src/modules/features/deals/hooks/index.ts` - Exports

#### Consumers (2 files)
- [ ] `src/modules/features/customers/views/CustomerDetailPage.tsx` - Import paths
- [ ] `src/modules/features/contracts/...` (if exists) - Import paths

#### Tests (3 files)
- [ ] `src/services/__tests__/salesService.test.ts` - Import paths + test names
- [ ] `src/services/__tests__/salesServiceFactory.test.ts` - Import paths
- [ ] `src/modules/features/deals/__tests__/multiTenantSafety.test.ts` - Import paths

#### Internal File Content (6 files)
- [ ] `src/modules/features/deals/routes.tsx` - Route names/metadata
- [ ] `src/modules/features/deals/constants/permissions.ts` - Constants if needed
- [ ] All component files - String references (logs, messages, etc.)
- [ ] All hook files - Store references, console logs
- [ ] All service files - Table references, logging

#### Total: 16 files with content-only changes

---

## Section 3: Database Impact

### 3.1 Table Schema Changes

```
BEFORE:
├── sales (main table)
│   ├── id (PK)
│   ├── deal_number
│   ├── title
│   ├── customer_id (FK)
│   ├── value
│   ├── status
│   ├── stage
│   ├── tenant_id
│   ├── assigned_to
│   ├── created_at
│   ├── updated_at
│   └── deleted_at
└── sale_items (detail table)
    ├── id (PK)
    ├── sale_id (FK) ← RENAME TO deal_id
    ├── product_id
    ├── product_name
    ├── quantity
    ├── unit_price
    └── line_total

AFTER:
├── deals (renamed)
│   ├── id (PK)
│   ├── deal_number (business data - unchanged)
│   ├── title
│   ├── customer_id (FK)
│   ├── value
│   ├── status
│   ├── stage
│   ├── tenant_id
│   ├── assigned_to
│   ├── created_at
│   ├── updated_at
│   └── deleted_at
└── deal_items (renamed)
    ├── id (PK)
    ├── deal_id (FK) ← RENAMED
    ├── product_id
    ├── product_name
    ├── quantity
    ├── unit_price
    └── line_total
```

### 3.2 Query Changes Required

**All queries must be updated**:

```sql
-- OLD: SELECT * FROM sales WHERE id = '123'
-- NEW: SELECT * FROM deals WHERE id = '123'

-- OLD: INSERT INTO sale_items (sale_id, ...) 
-- NEW: INSERT INTO deal_items (deal_id, ...)

-- OLD: WHERE sale_id = deal_id
-- NEW: WHERE deal_id = deal_id

-- OLD: FOREIGN KEY (sale_id) REFERENCES sales(id)
-- NEW: FOREIGN KEY (deal_id) REFERENCES deals(id)
```

### 3.3 Files Requiring Query Updates

- [ ] `src/services/deals/supabase/dealsService.ts` - All Supabase queries
- [ ] `src/services/rbac/dynamicPermissionManager.ts` - Line 252 `.from('sales')`
- [ ] Any migration files or seed scripts

---

## Section 4: Import Path Changes

### 4.1 Import Pattern Changes

**Pattern 1**: Direct service imports
```typescript
// OLD
import { mockSalesService } from '@/services/sales/mockSalesService';

// NEW
import { mockDealsService } from '@/services/deals/mock/mockDealsService';
```

**Pattern 2**: Service factory imports
```typescript
// OLD
import { salesService } from '@/services/serviceFactory';

// NEW
import { dealsService } from '@/services/serviceFactory';
```

**Pattern 3**: Module imports
```typescript
// OLD
import { useSales } from '@/modules/features/sales/hooks/useSales';

// NEW
import { useDeals } from '@/modules/features/deals/hooks/useDeals';
```

**Pattern 4**: Component imports
```typescript
// OLD
import { SalesDealFormPanel } from '@/modules/features/sales/components/SalesDealFormPanel';

// NEW
import { DealFormPanel } from '@/modules/features/deals/components/DealFormPanel';
```

### 4.2 All Files With Import Changes

1. `src/services/serviceFactory.ts` - 4 import statements
2. `src/modules/features/deals/index.ts` - 5 export updates
3. `src/modules/features/deals/components/index.ts` - 3 exports
4. `src/modules/features/deals/hooks/index.ts` - Multiple exports
5. `src/modules/features/deals/views/DealsPage.tsx` - Component imports
6. `src/modules/features/deals/components/DealFormPanel.tsx` - Hook + interface imports
7. `src/modules/features/deals/components/DealDetailPanel.tsx` - Hook + interface imports
8. `src/modules/features/deals/components/DealsList.tsx` - Hook + store imports
9. `src/modules/features/deals/hooks/useDeals.ts` - Store + interface imports
10. `src/modules/features/deals/hooks/useDealPipeline.ts` - Store imports
11. `src/modules/features/customers/views/CustomerDetailPage.tsx` - Hook import
12. `src/services/__tests__/salesService.test.ts` - Mock service import
13. `src/services/__tests__/salesServiceFactory.test.ts` - Mock service import
14. `src/modules/features/deals/__tests__/multiTenantSafety.test.ts` - Mock service import

**Total: ~14 files** with import changes

---

## Section 5: Type System Impact

### 5.1 Interface Changes

| Item | Change | Impact |
|---|---|---|
| `ISalesService` | → `IDealService` | HIGH - Used in components, hooks |
| `Sale` type | → `Deal` type | HIGH - Used everywhere |
| `SaleItem` type | → `DealItem` type | MEDIUM - Used in detail panels |
| `SalesFilters` | → `DealFilters` | MEDIUM - Filter operations |
| `CreateDealData` | (stays same) | LOW - Unchanged |

### 5.2 TypeScript Compilation Impact

**Critical for resolution**:
- All 16 files with content updates must have correct type imports
- All component exports must match import names
- All hook functions must have correct return types
- Service interface must be properly exported from new location

**Command to validate**:
```bash
npm run type-check
```

---

## Section 6: Runtime Dependencies

### 6.1 Initialization Order

1. **serviceFactory.ts** initialized
   - Creates registry with dealsService
   - Must complete before any module loads
   - Risk: If registry entry missing, modules fail to load

2. **deals module** loads
   - Services: dealService interface
   - Hooks: useDeals, useDealPipeline (use dealsService from factory)
   - Store: dealStore (Zustand store)
   - Components: DealFormPanel, DealDetailPanel, DealsList
   - Risk: Circular dependencies if not structured correctly

3. **dealsService** proxy resolves
   - First call to dealsService triggers createServiceProxy
   - Calls serviceFactory.getService('deals')
   - Returns mock or supabase service based on API mode
   - Risk: If registry entry not found, throws "Unknown service" error

### 6.2 Initialization Failures (Common Issues)

**Issue 1**: Missing registry entry
```
Error: Unknown service: deals
  at ServiceFactory.getService()
  at createServiceProxy()
```

**Issue 2**: Circular imports
```
Error: Cannot find module '@/modules/features/deals/hooks/useDeals'
  at Module._load()
```

**Issue 3**: Missing table in database
```
Error: relation "deals" does not exist
  at PostgreSQL.exec()
```

---

## Section 7: Build System Impact

### 7.1 Build Configuration Changes

**No changes needed** to:
- `vite.config.ts`
- `tsconfig.json`
- `eslint.config.js`
- `.zencoder/rules/`

**Potential issues**:
- Build cache may need clearing: `rm -rf dist node_modules/.vite`
- Large build changes may need full rebuild: `npm run build -- --force`

### 7.2 Build Commands to Run

```bash
# Clear build cache
rm -rf dist

# Full type check
npm run type-check

# Full lint check
npm run lint

# Production build
npm run build

# Verify bundle includes deals module
grep -i "deals" dist/index.html || echo "Check assets/"
```

---

## Section 8: Testing Impact

### 8.1 Test Files Affected

```
src/services/__tests__/
├── salesService.test.ts (update imports + test names)
└── salesServiceFactory.test.ts (update imports + test names)

src/modules/features/deals/__tests__/
└── multiTenantSafety.test.ts (update imports)
```

### 8.2 Test Commands

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- salesService.test.ts

# Run with coverage
npm run test -- --coverage

# Watch mode for development
npm run test -- --watch
```

### 8.3 Tests to Create/Update

- [ ] DealFormPanel component tests
- [ ] DealDetailPanel component tests
- [ ] useDeals hook tests
- [ ] dealStore tests
- [ ] Multi-tenant safety tests
- [ ] Service factory tests

---

## Section 9: Documentation Impact

### 9.1 Documentation Files to Update

- [ ] `src/modules/features/deals/DOC.md`
- [ ] `src/modules/features/deals/SALES_FORMS_ENHANCEMENT_GUIDE.md` → `DEALS_FORMS_ENHANCEMENT_GUIDE.md`
- [ ] Any architecture documentation
- [ ] API documentation
- [ ] Component documentation

### 9.2 String References in Comments

```typescript
// Example: Update all comments referencing "sales" in deals context
// OLD: "Sales module for managing closed deals"
// NEW: "Deals module for managing closed opportunities"
```

---

## Section 10: Rollback Strategy

### 10.1 If Migration Fails

**Database Rollback**:
```sql
-- If in transaction and not yet committed, automatic rollback
-- If committed, run reverse migration:

BEGIN;
ALTER TABLE deal_items RENAME COLUMN deal_id TO sale_id;
ALTER TABLE deal_items RENAME TO sale_items;
ALTER TABLE deals RENAME TO sales;
COMMIT;
```

**Code Rollback**:
```bash
git revert <migration-commit-hash>
git reset --hard HEAD~1  # If not yet pushed
```

### 10.2 Testing Before Rollback

- Verify service factory registry
- Verify component loads
- Verify data queries
- Verify RLS policies

---

## Section 11: Success Criteria

### 11.1 Build Verification

- [ ] `npm run build` completes with 0 errors
- [ ] `npm run type-check` passes with 0 errors
- [ ] `npm run lint` passes with 0 errors
- [ ] No "Unknown service" console errors
- [ ] No import path resolution errors

### 11.2 Runtime Verification

- [ ] Deals page loads without errors
- [ ] Form creates new deal successfully
- [ ] Detail panel displays correctly
- [ ] List view renders all deals
- [ ] Pipeline view displays stages
- [ ] Customer detail page shows related deals
- [ ] Multi-tenant isolation maintained
- [ ] All CRUD operations work

### 11.3 Data Verification

- [ ] All existing deals visible in deals table
- [ ] Deal items accessible with correct foreign key
- [ ] RLS policies enforce tenant isolation
- [ ] Queries execute with correct table names

---

## Section 12: Performance Impact

### 12.1 Expected Impact

| Area | Impact | Reason |
|---|---|---|
| Bundle size | Negligible | Same code, different names |
| Runtime performance | None | Same algorithm, different names |
| Database queries | None | Table functions identical |
| Build time | Negligible | Same number of files |

### 12.2 Performance Verification

```bash
# Compare bundle sizes before/after
npm run build
ls -lh dist/assets/ | grep -i deal

# Check query performance
EXPLAIN ANALYZE SELECT * FROM deals;
EXPLAIN ANALYZE SELECT * FROM deal_items WHERE deal_id = '123';
```

---

## Section 13: Cross-Module Impact Matrix

### 13.1 Module Dependencies

| Module | Depends On Sales | Type | Action |
|---|---|---|---|
| **customers** | useSalesByCustomer | Hook import | Update path |
| **contracts** | Possibly references deals | Verify | Check code |
| **product-sales** | Independent | N/A | No changes |
| **sales-activities** | Independent | N/A | No changes |
| **opportunities** | May link to deals | Verify | Check code |
| **dashboard** | May display sales stats | Verify | Check code |

### 13.2 Verification Queries

```bash
# Find all references to sales module
grep -r "@/modules/features/sales" src/modules --exclude-dir=sales

# Find all references to salesService
grep -r "salesService" src/modules

# Find all references to old types
grep -r "ISalesService\|Sale\|SaleItem" src/modules/features --exclude-dir=sales
```

---

## Section 14: Timeline Estimate

### 14.1 Phase Durations

| Phase | Task | Duration | Risk |
|---|---|---|---|
| 1 | Service layer rename | 15 min | LOW |
| 2 | Type definitions | 10 min | LOW |
| 3 | Service factory registry | 15 min | MEDIUM |
| 4 | Feature module rename | 10 min | MEDIUM |
| 5 | Internal content updates | 30 min | MEDIUM |
| 6 | Consumer updates | 20 min | HIGH |
| 7 | Database migration | 30 min | HIGH |
| 8 | Verification | 30 min | HIGH |
| **Total** | | ~2.5 hours | **MEDIUM** |

### 14.2 Critical Path

1. Service layer → ServiceFactory → Feature module → Consumers → Database

---

**Document Version**: 1.0  
**Status**: Ready for Review  
**Last Updated**: December 1, 2025

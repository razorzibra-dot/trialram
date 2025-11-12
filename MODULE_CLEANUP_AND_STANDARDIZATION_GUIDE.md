# Module Cleanup & Standardization Guide

## Executive Summary

This guide establishes a **consistent architecture pattern** for all CRM modules (both tenant and super-admin).
All modules will follow the **FormPanel + ListPage** pattern with NO full-page CRUD views.

**Standardized Architecture:**
```
Module Structure:
├── views/
│   └── ModuleListPage.tsx          (Primary page - table + drawer operations)
│   └── ModuleDetailPage.tsx        (Optional - read-only detail view)
├── components/
│   ├── ModuleFormPanel.tsx         (Drawer for create/edit - ALWAYS drawer, never full page)
│   ├── ModuleDetailPanel.tsx       (Drawer for viewing details)
│   ├── ModuleList.tsx              (Table component)
│   └── ...
├── hooks/
│   ├── useModule.ts                (CRUD hooks)
│   ├── useModuleStatus.ts          (Dynamic reference data)
│   └── ...
├── services/
│   └── moduleService.ts
├── routes.tsx                      (ONLY route list page - no create/edit pages)
└── index.ts
```

---

## PHASE 1: Module Audit Results

### Current State by Module

#### ✅ COMPLIANT MODULES (FormPanel + List Pattern)
1. **Customers** - ⚠️ Has legacy pages (CustomerCreatePage, CustomerEditPage) - CLEANUP NEEDED
   - Uses: CustomerFormPanel (drawer) + CustomerListPage
   - Legacy: CustomerCreatePage.tsx, CustomerEditPage.tsx - DELETE

2. **Complaints** - ⚠️ Has legacy page (ComplaintsPageNew) - ALREADY DELETED
   - Uses: ComplaintsFormPanel (drawer) + ComplaintsPage
   - Status: Clean after deletion

3. **Contracts** - ⚠️ Has full-page Detail view
   - Uses: ContractFormPanel (drawer) + ContractsPage
   - Has: ContractDetailPage.tsx (full page - should be drawer)
   - Status: Needs verification if detail page is actually used

4. **Tickets** - ⚠️ Has full-page Detail view
   - Uses: TicketsFormPanel (drawer) + TicketsPage
   - Has: TicketDetailPage.tsx (full page - should be drawer)
   - Status: Needs verification if detail page is actually used

5. **JobWorks** - ⚠️ Has enhanced form panel
   - Uses: JobWorksFormPanel (drawer) + JobWorksPage
   - Has: JobWorksFormPanelEnhanced.tsx - CONSOLIDATE or DELETE
   - Status: Needs consolidation

6. **Masters (Products & Companies)** - ✅ Compliant
   - Uses: ProductsFormPanel, CompaniesFormPanel (drawers)
   - List pages only
   - Status: Clean

7. **Product Sales** - ✅ Compliant
   - Uses: ProductSaleFormPanel (drawer)
   - List page only
   - Status: Clean

8. **Sales** - ✅ Compliant
   - Uses: SalesDealFormPanel (drawer)
   - List page only
   - Status: Clean

9. **Dashboard** - ⚠️ Has duplicate
   - Has: DashboardPage.tsx, DashboardPageNew.tsx - CLEANUP NEEDED
   - Status: Needs deletion of PageNew

10. **Service Contracts** - ⚠️ Has full-page Detail view
    - Has: ServiceContractsPage.tsx, ServiceContractDetailPage.tsx
    - Status: No FormPanel - needs verification

#### ⚠️ SPECIAL CASES
- **PDF Templates** - Has PDFTemplateFormPanel (drawer)
- **Super Admin** - Has SuperUserFormPanel + multiple detail pages
- **User Management** - Has UserFormPanel (drawer)
- **Notifications, Audit Logs, Configuration** - Read-only views only

---

## PHASE 2: Standard Architecture Pattern

### Best Practice: FormPanel + ListPage

**DO:**
✅ One main list page with **table/grid + inline actions**
✅ Drawer panels (FormPanel, DetailPanel) for CRUD operations  
✅ FormPanel = Create + Edit (single reusable drawer)
✅ DetailPanel = Read-only view (optional drawer)
✅ Dynamic reference data via hooks (useXxxStatus, useXxxTypes, etc.)
✅ Routes contain ONLY: list page, optional detail page (NO create/edit pages)

**DON'T:**
❌ Separate full pages for Create, Edit, Detail views
❌ Static dropdown values - use dynamic hooks
❌ Multiple FormPanel variations (consolidate into one)
❌ Routes pointing to create/edit pages

### Example: CustomerListPage Pattern
```typescript
// views/CustomerListPage.tsx
const CustomerListPage = () => {
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleCreate = () => {
    setSelectedCustomer(null);
    setDrawerMode('create');
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDrawerMode('edit');
  };

  return (
    <>
      <Table columns={...} dataSource={customers} />
      <CustomerFormPanel 
        visible={drawerMode === 'create' || drawerMode === 'edit'}
        customer={selectedCustomer}
        onClose={() => setDrawerMode(null)}
      />
    </>
  );
};
```

### Example: routes.tsx Pattern
```typescript
// DON'T DO:
{
  path: 'customers/new',           // ❌ NO create route
  element: <CustomerCreatePage />
}

// DO:
{
  path: 'customers',
  children: [
    {
      index: true,                  // ✅ List page only
      element: <CustomerListPage />
    },
    {
      path: ':id',                  // ✅ Optional: detail page for read-only
      element: <CustomerDetailPage />
    }
  ]
}
```

---

## PHASE 3: Cleanup Checklist by Module

### PRIORITY 1: Immediate Cleanup (1-2 modules)

#### [ ] CUSTOMERS Module
**Files to DELETE:**
- [ ] `src/modules/features/customers/views/CustomerCreatePage.tsx`
- [ ] `src/modules/features/customers/views/CustomerEditPage.tsx`

**Files to UPDATE:**
- [ ] `src/modules/features/customers/routes.tsx` - Remove create/edit routes
- [ ] `src/modules/features/customers/index.ts` - Remove exports

**Verification:**
- [ ] Confirm CustomerListPage + CustomerFormPanel handles all CRUD
- [ ] Test create/edit via drawer in list page
- [ ] Test delete via list page

---

#### [ ] DASHBOARD Module
**Files to DELETE:**
- [ ] `src/modules/features/dashboard/views/DashboardPageNew.tsx`

**Files to UPDATE:**
- [ ] `src/modules/features/dashboard/routes.tsx` - Keep only DashboardPage
- [ ] `src/modules/features/dashboard/index.ts` - Remove PageNew exports

---

### PRIORITY 2: Consolidation (2-3 modules)

#### [ ] JOBWORKS Module
**Files to CONSOLIDATE:**
- [ ] Review `JobWorksFormPanel.tsx` vs `JobWorksFormPanelEnhanced.tsx`
- [ ] Keep best version, DELETE the other
- [ ] Update imports across module

**Verification:**
- [ ] JobWorksPage uses correct FormPanel
- [ ] Form works for both create and edit

---

#### [ ] CONTRACTS Module
**Decision Point:**
- [ ] Verify if `ContractDetailPage.tsx` is actually used in routes
- IF NOT USED:
  - [ ] Move to archive
  - [ ] Update routes.tsx to remove route
- IF USED:
  - [ ] Convert detail view from full page to drawer (DetailPanel)
  - [ ] Remove create/edit page routes if present

**Files to CHECK:**
- [ ] `ContractDetailPage.tsx` - Full page or drawer?
- [ ] `contracts/routes.tsx` - What routes exist?

---

#### [ ] TICKETS Module
**Same as CONTRACTS - Decision Point:**
- [ ] Verify if `TicketDetailPage.tsx` is actually used
- [ ] Decide: Archive vs. Convert to drawer DetailPanel

---

### PRIORITY 3: Verification (3+ modules)

#### [ ] SERVICE-CONTRACTS Module
- [ ] Check if FormPanel exists or needs to be created
- [ ] Verify routes align with standard pattern

#### [ ] SUPER-ADMIN Module
- [ ] Audit all pages and FormPanels
- [ ] Ensure consistent with standard pattern

---

## PHASE 4: Archive Strategy

### Archive Folder Structure
```
.archive/
├── DELETED_2025_11_MODULES_CLEANUP/
│   ├── customers/
│   │   ├── CustomerCreatePage.tsx.archive
│   │   ├── CustomerEditPage.tsx.archive
│   │   └── DELETION_MANIFEST.md
│   ├── dashboard/
│   │   ├── DashboardPageNew.tsx.archive
│   │   └── DELETION_MANIFEST.md
│   └── ...
└── ARCHIVE_INDEX.md
```

### Deletion Manifest (per module)
```markdown
# Customers Module - Deletion Manifest
Date: 2025-11-10
Reason: Legacy full-page CRUD forms - replaced by drawer FormPanel pattern
Verifier: [Name]

## Files Deleted
- CustomerCreatePage.tsx (414 lines) - Legacy create form
- CustomerEditPage.tsx (618 lines) - Legacy edit form

## Migration Path
Functionality migrated to:
- CustomerFormPanel.tsx - drawer-based create/edit
- CustomerListPage.tsx - new button triggers drawer

## Testing Results
- ✅ Create via drawer works
- ✅ Edit via drawer works  
- ✅ Delete via list works

## Backup Location
.archive/DELETED_2025_11_MODULES_CLEANUP/customers/
```

---

## PHASE 5: Reference Data Pattern

### Standard Hook Pattern for Dynamic Dropdowns
```typescript
// hooks/useCustomerStatus.ts
export const useCustomerStatus = () => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['reference-data:customer-status'],
    queryFn: async () => {
      const response = await referenceDataService.getCustomerStatuses();
      return response;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
```

### Implement for All Modules:
✅ Already Compliant:
- customers (useCustomerStatus, useLeadRating, useIndustries, etc.)
- contracts (should verify)
- sales (should verify)
- products (should verify)

❌ Missing/Needs Creation:
- service-contracts (check if needed)
- tickes (should verify)
- jobworks (should verify)

---

## PHASE 6: Implementation Checklist

### Step 1: Customer Module (TEMPLATE)
```bash
# 1. Archive legacy files
mkdir -p .archive/DELETED_2025_11_MODULES_CLEANUP/customers
mv src/modules/features/customers/views/CustomerCreatePage.tsx .archive/...
mv src/modules/features/customers/views/CustomerEditPage.tsx .archive/...

# 2. Create deletion manifest
# (document in manifest above)

# 3. Update routes.tsx
# Remove: /customers/new route
# Remove: /customers/:id/edit route

# 4. Update index.ts
# Remove: CustomerCreatePage, CustomerEditPage exports

# 5. Test
npm run test -- customers

# 6. Commit
git add .archive/
git add src/modules/features/customers/
git commit -m "refactor(customers): remove legacy full-page CRUD forms

- Delete CustomerCreatePage, CustomerEditPage (replaced by drawer pattern)
- Update routes to remove create/edit routes
- All CRUD now via FormPanel drawer in ListPage
- Archive deletion manifests in .archive/DELETED_2025_11_MODULES_CLEANUP/
"
```

---

## PHASE 7: Completion Index

### Final Architecture Documentation
```markdown
# Module Architecture Completion Index (2025-11-10)

## ✅ Fully Compliant Modules
1. Customers ✅
2. Complaints ✅
3. Masters ✅
4. Product Sales ✅
5. Sales ✅
6. Dashboard ✅

## ✅ Compliant with Notes
1. Contracts - FormPanel + List (detail page: drawer vs full page?)
2. Tickets - FormPanel + List (detail page: drawer vs full page?)
3. JobWorks - FormPanel + List (consolidated FormPanel)
4. Service Contracts - List only (FormPanel needed?)

## Documentation Per Module
See: MODULE_CLEANUP_COMPLETION_INDEX.md
```

---

## Key Files to Create/Update

1. **MODULE_CLEANUP_AND_STANDARDIZATION_GUIDE.md** ← You are here
2. **MODULE_CLEANUP_COMPLETION_INDEX.md** - Per-module status after cleanup
3. **DELETION_MANIFESTS/** - Track all deleted files with reasons
4. **.archive/ARCHIVE_INDEX.md** - Central archive documentation
5. **MODULE_FORM_STANDARDS.md** - FormPanel implementation standards

---

## Success Criteria

✅ **All modules follow FormPanel + ListPage pattern**
✅ **No full-page Create/Edit views** (only drawers)
✅ **All reference data is dynamic** (no static dropdowns)
✅ **Consistent routing** across all modules
✅ **Archived files documented** with deletion manifests
✅ **No dead code** in active routes
✅ **All CRUD operations** accessible from list page
✅ **Tests passing** for all modified modules

---

## Rollback Plan (If Issues Found)

All deleted files are preserved in `.archive/DELETED_2025_11_MODULES_CLEANUP/`

```bash
# To restore a file:
cp .archive/DELETED_2025_11_MODULES_CLEANUP/module-name/filename.archive \
   src/modules/features/module-name/views/filename.tsx

# Or restore from git:
git show HEAD~N:path/to/file > path/to/file
```

---

## Timeline Estimate

| Phase | Task | Estimate |
|-------|------|----------|
| 1 | Audit & Documentation | ✅ Complete |
| 2 | Customers cleanup | 30 min |
| 3 | Dashboard cleanup | 15 min |
| 4 | JobWorks consolidation | 30 min |
| 5 | Contracts/Tickets decision | 45 min |
| 6 | Service-Contracts audit | 30 min |
| 7 | Super-Admin audit | 60 min |
| 8 | Final testing & docs | 60 min |
| **TOTAL** | | **~4.5 hours** |


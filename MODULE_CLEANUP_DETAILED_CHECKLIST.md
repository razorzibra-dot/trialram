# Module Cleanup - Detailed Checklist

**Status:** Ready for execution
**Created:** 2025-11-10
**Last Updated:** 2025-11-10

---

## PRIORITY 1: IMMEDIATE CLEANUP (MUST DO FIRST)

### ✅ Task 1.1: CUSTOMERS Module - Delete Legacy Pages

**Objective:** Remove CustomerCreatePage and CustomerEditPage (replaced by drawer pattern)

**Files to Delete:**
```
✓ src/modules/features/customers/views/CustomerCreatePage.tsx
✓ src/modules/features/customers/views/CustomerEditPage.tsx
```

**Files to Modify:**

#### 1.1.1 UPDATE: `src/modules/features/customers/routes.tsx`
**Current State:**
```typescript
const CustomerCreatePage = React.lazy(() => import('./views/CustomerCreatePage'));
const CustomerEditPage = React.lazy(() => import('./views/CustomerEditPage'));

export const customerRoutes: RouteObject[] = [
  { path: 'customers', children: [
    { index: true, element: <CustomerListPage /> },
    { path: 'new', element: <CustomerCreatePage /> },        // ❌ DELETE THIS
    { path: ':id', element: <CustomerDetailPage /> },
    { path: ':id/edit', element: <CustomerEditPage /> },     // ❌ DELETE THIS
  ]}
];
```

**Action Required:**
- [ ] Remove: `const CustomerCreatePage = React.lazy(...)`
- [ ] Remove: `const CustomerEditPage = React.lazy(...)`
- [ ] Remove: `{ path: 'new', element: <CustomerCreatePage /> }` route
- [ ] Remove: `{ path: ':id/edit', element: <CustomerEditPage /> }` route

**Resulting File:**
```typescript
const CustomerListPage = React.lazy(() => import('./views/CustomerListPage'));
const CustomerDetailPage = React.lazy(() => import('./views/CustomerDetailPage'));

export const customerRoutes: RouteObject[] = [
  { path: 'customers', children: [
    { index: true, element: <CustomerListPage /> },
    { path: ':id', element: <CustomerDetailPage /> },
  ]}
];
```

#### 1.1.2 UPDATE: `src/modules/features/customers/index.ts`
**Action Required:**
- [ ] No exports for CustomerCreatePage or CustomerEditPage (check if they exist)
- [ ] Verify only CustomerListPage, CustomerDetailPage are exported

---

**Verification Checklist:**
- [ ] Routes file has only list + detail routes (no create/edit)
- [ ] No imports of deleted components remain in routes.tsx
- [ ] index.ts has no dangling exports
- [ ] Application starts without errors
- [ ] `/tenant/customers` loads list page
- [ ] Click "Create" button opens drawer (not full page)
- [ ] Click "Edit" button opens drawer (not full page)

**Archive Action:**
```bash
# Create archive
mkdir -p .archive/DELETED_2025_11_MODULES_CLEANUP/customers

# Move files
mv src/modules/features/customers/views/CustomerCreatePage.tsx \
   .archive/DELETED_2025_11_MODULES_CLEANUP/customers/

mv src/modules/features/customers/views/CustomerEditPage.tsx \
   .archive/DELETED_2025_11_MODULES_CLEANUP/customers/

# Create manifest (see section below)
# .archive/DELETED_2025_11_MODULES_CLEANUP/customers/DELETION_MANIFEST.md
```

**Deletion Manifest Content:**
```markdown
# Customers Module - Deletion Manifest

**Date:** 2025-11-10
**Reason:** Legacy full-page CRUD forms replaced by FormPanel drawer pattern
**Verifier:** [Your Name]

## Files Deleted (2)
1. CustomerCreatePage.tsx (414 lines)
   - Old: Full page form for creating customers
   - Replaced by: CustomerFormPanel drawer in CustomerListPage
   
2. CustomerEditPage.tsx (618 lines)
   - Old: Full page form for editing customers
   - Replaced by: CustomerFormPanel drawer in CustomerListPage

## Routes Removed
- `/customers/new` → full page create
- `/customers/:id/edit` → full page edit

## Migration Path
**Before (Legacy):**
- User clicks → navigates to `/customers/new` → CustomerCreatePage
- User clicks → navigates to `/customers/:id/edit` → CustomerEditPage

**After (Current):**
- User clicks → CustomerFormPanel drawer opens with form
- Same FormPanel handles both create and edit modes

## Active CRUD Flow
See: src/modules/features/customers/views/CustomerListPage.tsx
Lines: 82-89 (handleCreate, handleEdit)
Lines: 683 (CustomerFormPanel render)

## Testing Completed
- ✅ Create via drawer works
- ✅ Edit via drawer works
- ✅ Delete via list works
- ✅ List page loads correctly

## Backup Location
.archive/DELETED_2025_11_MODULES_CLEANUP/customers/
```

---

### ✅ Task 1.2: DASHBOARD Module - Delete Legacy PageNew

**Objective:** Remove DashboardPageNew (original version still in use)

**Files to Delete:**
```
✓ src/modules/features/dashboard/views/DashboardPageNew.tsx
```

**Files to Modify:**

#### 1.2.1 UPDATE: `src/modules/features/dashboard/routes.tsx`
**Action Required:**
- [ ] Verify DashboardPageNew is NOT imported (check for lazy import)
- [ ] Ensure only DashboardPage is routed
- [ ] If import exists: Remove it

#### 1.2.2 UPDATE: `src/modules/features/dashboard/index.ts`
**Action Required:**
- [ ] No exports for DashboardPageNew
- [ ] Verify only DashboardPage is exported

**Verification Checklist:**
- [ ] Dashboard page loads at `/tenant/dashboard`
- [ ] No 404 errors
- [ ] Dashboard renders correctly
- [ ] All dashboard widgets work

**Archive Action:**
```bash
# Move file
mv src/modules/features/dashboard/views/DashboardPageNew.tsx \
   .archive/DELETED_2025_11_MODULES_CLEANUP/dashboard/

# Create manifest
# .archive/DELETED_2025_11_MODULES_CLEANUP/dashboard/DELETION_MANIFEST.md
```

**Deletion Manifest Content:**
```markdown
# Dashboard Module - Deletion Manifest

**Date:** 2025-11-10
**Reason:** Legacy redesigned version never integrated - original version in use

## Files Deleted (1)
1. DashboardPageNew.tsx (XXX lines)
   - Old: Redesigned dashboard (never integrated into routes)
   - Active: DashboardPage.tsx is used

## Reason for Legacy Version
- Redesign was created but not fully integrated
- Original DashboardPage.tsx continues to be used
- PageNew was abandoned during development

## Testing Completed
- ✅ Dashboard loads correctly
- ✅ No reference to PageNew in routes
- ✅ No import errors

## Backup Location
.archive/DELETED_2025_11_MODULES_CLEANUP/dashboard/
```

---

## PRIORITY 2: CONSOLIDATION & VERIFICATION (NEXT)

### ⚠️ Task 2.1: JOBWORKS Module - Consolidate FormPanels

**Objective:** Review and consolidate JobWorksFormPanel vs JobWorksFormPanelEnhanced

**Files to Review:**
```
src/modules/features/jobworks/components/JobWorksFormPanel.tsx
src/modules/features/jobworks/components/JobWorksFormPanelEnhanced.tsx
```

**Action Required:**
- [ ] Compare both files - identify differences
- [ ] Determine which is "better" (more recent, more features)
- [ ] Keep the better one, rename to JobWorksFormPanel.tsx
- [ ] Delete the other version
- [ ] Update all imports across the module to use single FormPanel
- [ ] Update components/index.ts exports

**Verification:**
- [ ] JobWorksPage loads list correctly
- [ ] Create job work via drawer works
- [ ] Edit job work via drawer works
- [ ] Form has all necessary fields
- [ ] No import errors

**Archive if Deleting:**
```bash
mv src/modules/features/jobworks/components/JobWorksFormPanelEnhanced.tsx \
   .archive/DELETED_2025_11_MODULES_CLEANUP/jobworks/
```

---

### ⚠️ Task 2.2: CONTRACTS Module - Decision Point

**Objective:** Determine if ContractDetailPage should be full page or drawer

**Current State:**
```
src/modules/features/contracts/views/ContractDetailPage.tsx (exists)
src/modules/features/contracts/components/ContractFormPanel.tsx (drawer for create/edit)
```

**Questions to Answer:**
1. [ ] Is ContractDetailPage.tsx routed in routes.tsx?
   - If YES: Check what route points to it
   - If NO: Should be archived

2. [ ] Is ContractDetailPage.tsx used in ContractsPage?
   - If YES: Link/button to navigate to detail?
   - If NO: It's dead code

3. [ ] Should detail view be full page or drawer?
   - [ ] Full page: Keep as-is, document in routes
   - [ ] Drawer: Create ContractDetailPanel, delete full page, show in drawer

**Decision Flow:**

**IF Detail Page is Used:**
- [ ] Document the usage (what links to it)
- [ ] Keep as full page OR convert to drawer
- [ ] Add to VERIFIED_MODULES list

**IF Detail Page is Not Used:**
- [ ] Archive to .archive/DELETED_2025_11_MODULES_CLEANUP/contracts/
- [ ] Remove from routes.tsx
- [ ] Update index.ts

**Verification:**
- [ ] Test the chosen approach
- [ ] No dead code remains
- [ ] User can view contract details

---

### ⚠️ Task 2.3: TICKETS Module - Decision Point

**Same as CONTRACTS Module (Task 2.2)**

**Current State:**
```
src/modules/features/tickets/views/TicketDetailPage.tsx (exists)
src/modules/features/tickets/components/TicketsFormPanel.tsx (drawer for create/edit)
```

**Decision Process:** Same as contracts module above

---

## PRIORITY 3: VERIFICATION & AUDIT (FINAL)

### ✓ Task 3.1: SERVICE-CONTRACTS Module - Audit

**Objective:** Verify ServiceContracts follows standard pattern

**Current State:**
```
src/modules/features/service-contracts/views/ServiceContractsPage.tsx (list)
src/modules/features/service-contracts/views/ServiceContractDetailPage.tsx (detail)
NO ServiceContractFormPanel.tsx found
```

**Questions to Answer:**
- [ ] Are ServiceContractsPage and ServiceContractDetailPage both routed?
- [ ] Is there a FormPanel or is form embedded in page?
- [ ] Should create/edit be drawer or separate pages?

**Action Required:**
- [ ] IF no FormPanel exists AND service-contracts is data-entry module:
  - [ ] Create ServiceContractFormPanel (drawer)
  - [ ] Update ServiceContractsPage to use drawer for create/edit
  - [ ] Archive detail page or convert to drawer

- [ ] IF service-contracts is read-only:
  - [ ] Document as read-only module
  - [ ] Remove FormPanel requirement

**Verification:**
- [ ] Service contracts can be viewed
- [ ] If data-entry: create/edit works via drawer
- [ ] No dead code

---

### ✓ Task 3.2: SUPER-ADMIN Module - Full Audit

**Objective:** Ensure super-admin module aligns with patterns

**Current State:**
```
Multiple full-page views:
- SuperAdminDashboardPage.tsx
- SuperAdminAnalyticsPage.tsx
- SuperAdminConfigurationPage.tsx
- SuperAdminHealthPage.tsx
- SuperAdminLogsPage.tsx
- SuperAdminUsersPage.tsx
- SuperAdminTenantsPage.tsx
- SuperAdminRoleRequestsPage.tsx
- SuperAdminImpersonationHistoryPage.tsx
```

**Note:** Super-admin is different - it's primarily admin/monitoring views, not CRUD.

**Action Required:**
- [ ] Identify which views are data-entry (need FormPanel)
- [ ] For each data-entry view:
  - [ ] Create FormPanel drawer (if doesn't exist)
  - [ ] Use drawer for create/edit
  - [ ] Archive full-page create/edit views
- [ ] For read-only views:
  - [ ] Keep as-is
  - [ ] Document as display-only
- [ ] Update routes.tsx
- [ ] Update index.ts exports

---

## PRIORITY 4: FINALIZATION

### ✓ Task 4.1: Create Archive Index

**File:** `.archive/ARCHIVE_INDEX.md`

```markdown
# Deleted Files Archive Index
**Created:** 2025-11-10
**Total Files Deleted:** XX

## By Module

### Customers (2 files)
- CustomerCreatePage.tsx
- CustomerEditPage.tsx
See: .archive/DELETED_2025_11_MODULES_CLEANUP/customers/DELETION_MANIFEST.md

### Dashboard (1 file)
- DashboardPageNew.tsx
See: .archive/DELETED_2025_11_MODULES_CLEANUP/dashboard/DELETION_MANIFEST.md

...

## Restoration
To restore a deleted file:
\`\`\`bash
cp .archive/DELETED_2025_11_MODULES_CLEANUP/module/filename \
   src/modules/features/module/views/filename
\`\`\`

Or from git history:
\`\`\`bash
git show COMMIT_HASH:path/to/file > path/to/file
\`\`\`
```

---

### ✓ Task 4.2: Create Completion Index

**File:** `MODULE_CLEANUP_COMPLETION_INDEX.md`

```markdown
# Module Cleanup Completion Index
**Updated:** 2025-11-10

## Modules Cleaned Up (✅)
- [x] Customers - Removed CustomerCreatePage, CustomerEditPage
- [x] Dashboard - Removed DashboardPageNew
- [x] JobWorks - Consolidated FormPanels
- [x] Contracts - Verified/cleaned up
- [x] Tickets - Verified/cleaned up

## Standard Architecture Verification
- [x] All data-entry modules have FormPanel drawer
- [x] All modules have single list page
- [x] No full-page create/edit views
- [x] All reference data is dynamic (no static dropdowns)
- [x] Routes are consistent across modules

## Code Quality
- [x] No dead code remains
- [x] No orphaned imports
- [x] All tests passing
- [x] No unused components

## Documentation
- [x] Deletion manifests created
- [x] Archive index created
- [x] Architecture guide updated
- [x] Per-module cleanup documented
```

---

### ✓ Task 4.3: Final Testing

**Checklist for Each Module:**
- [ ] List page loads
- [ ] Create via drawer works
- [ ] Edit via drawer works (if data-entry)
- [ ] Delete works
- [ ] Search/filter works
- [ ] Detail view works (if applicable)
- [ ] No console errors
- [ ] No broken imports
- [ ] Responsive design works

---

## Execution Timeline

```
PHASE 1A: Customers Module
├─ [ ] Delete legacy pages
├─ [ ] Update routes.tsx
├─ [ ] Update index.ts
├─ [ ] Archive files
├─ [ ] Test
└─ Duration: ~30 min

PHASE 1B: Dashboard Module
├─ [ ] Delete DashboardPageNew
├─ [ ] Verify routes
├─ [ ] Archive files
├─ [ ] Test
└─ Duration: ~15 min

PHASE 2: JobWorks Consolidation
├─ [ ] Compare FormPanels
├─ [ ] Consolidate
├─ [ ] Update imports
└─ Duration: ~30 min

PHASE 3: Contracts & Tickets Decision
├─ [ ] Make decisions
├─ [ ] Execute cleanup
└─ Duration: ~45 min

PHASE 4: Service-Contracts Audit
├─ [ ] Verify pattern
├─ [ ] Create FormPanel if needed
└─ Duration: ~30 min

PHASE 5: Super-Admin Audit
├─ [ ] Full audit
├─ [ ] Cleanup as needed
└─ Duration: ~60 min

PHASE 6: Finalization
├─ [ ] Create archive index
├─ [ ] Create completion index
├─ [ ] Full testing
├─ [ ] Documentation
└─ Duration: ~60 min

TOTAL: ~4.5 hours
```

---

## Success Criteria - COMPLETE CHECKLIST

- [ ] All modules follow FormPanel + ListPage pattern
- [ ] No full-page Create/Edit views exist
- [ ] All reference data is dynamic (useXxxxStatus hooks)
- [ ] Routes contain only list + optional detail pages
- [ ] All deleted files archived with manifests
- [ ] No dead code remains
- [ ] All tests passing
- [ ] All modules can be accessed without errors
- [ ] CRUD operations work via drawers
- [ ] Documentation complete and accurate
- [ ] Archive index created
- [ ] Completion index created

**Final Verification Commit:**
```bash
git commit -m "refactor: standardize all modules to FormPanel + ListPage pattern

BREAKING: Removed full-page create/edit views from:
- Customers (CustomerCreatePage, CustomerEditPage)
- Dashboard (DashboardPageNew)
- JobWorks (consolidated FormPanels)
- [Other modules as applicable]

CHANGES:
- All CRUD now via FormPanel drawer pattern
- Routes simplified (list + optional detail only)
- Reference data converted to dynamic hooks
- Archived deleted files with deletion manifests

MIGRATION:
- Create/edit accessible via drawer in list page
- All existing data preserved
- Same functionality, cleaner architecture

TESTING:
- All CRUD operations tested
- List pages verified
- No broken imports
- No console errors
"
```

---

## Post-Cleanup Maintenance

### Going Forward:
1. **New modules:** Use FormPanel + ListPage pattern from start
2. **Module updates:** Review for pattern compliance before merge
3. **Code reviews:** Check for full-page create/edit forms (reject)
4. **Quarterly audit:** Review all modules for consistency

### Checklist for New Modules:
- [ ] Has FormPanel (drawer for create/edit)?
- [ ] Has ListPage (main page)?
- [ ] Reference data is dynamic (hooks)?
- [ ] Routes: list + optional detail only?
- [ ] No full-page create/edit routes?


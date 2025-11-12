# Module Architecture Quick Reference

**Quick Guide for Clean, Consistent CRM Modules**

---

## 🎯 The Standard Pattern (DO THIS)

```
IDEAL MODULE STRUCTURE:

components/
├── ModuleListPanel.tsx          ← Table/grid of records
├── ModuleFormPanel.tsx          ← Drawer for CREATE & EDIT
├── ModuleDetailPanel.tsx        ← Drawer for READ-ONLY (optional)
└── ...

views/
├── ModuleListPage.tsx           ← Main page (the only full page)
└── ModuleDetailPage.tsx         ← Optional full page for read-only detail

hooks/
├── useModule.ts                 ← CRUD operations (create, update, delete, read)
├── useModuleStatus.ts           ← Dynamic reference data
└── useModuleXxx.ts              ← Other reference data

routes.tsx:
{
  path: 'modules',
  children: [
    { index: true, element: <ModuleListPage /> },      ✅ List page
    { path: ':id', element: <ModuleDetailPage /> },    ✅ Optional detail
  ]
}
```

---

## ❌ What NOT to Do (Legacy Pattern)

```
BAD MODULE STRUCTURE:

views/
├── ModuleListPage.tsx           ← Main list page
├── ModuleDetailPage.tsx         ← Full page detail view
├── ModuleCreatePage.tsx         ❌ Should be drawer in FormPanel
├── ModuleEditPage.tsx           ❌ Should be drawer in FormPanel
└── ...

routes.tsx:
{
  path: 'modules',
  children: [
    { index: true, element: <ModuleListPage /> },
    { path: 'new', element: <ModuleCreatePage /> },        ❌ NO!
    { path: ':id', element: <ModuleDetailPage /> },
    { path: ':id/edit', element: <ModuleEditPage /> },     ❌ NO!
  ]
}
```

---

## 📋 Quick Audit Checklist (30 seconds per module)

For each module, answer YES to all:

- [ ] Main operations happen in **ListPage** (table/list + buttons)?
- [ ] Create/Edit triggered **drawer**, not new page?
- [ ] FormPanel is a **drawer**, not full page?
- [ ] Reference data uses **hooks** (useModuleStatus), not static values?
- [ ] Routes file has **no "new"** or **"edit"** routes?
- [ ] Routes file has **only list + optional detail**?

If NO to any: **Module needs cleanup**

---

## 🔄 CRUD Flow: How It Works

### Current Best Practice (FormPanel Drawer)

```
USER ACTIONS:

1. VIEW LIST
   → ListPage → table of records ✅

2. CREATE NEW
   → Click "Create" button
   → Drawer opens with FormPanel ✅
   → Fill form → Submit
   → Record added → Refresh list

3. EDIT EXISTING
   → Click "Edit" on record
   → Drawer opens with FormPanel ✅
   → Form pre-filled with existing data
   → Change fields → Submit
   → Record updated → Refresh list

4. VIEW DETAIL (optional)
   → Click "View" on record
   → Drawer opens with DetailPanel ✅ (read-only)
   → OR navigate to /module/:id full page

5. DELETE
   → Click "Delete" on record
   → Confirmation popup
   → Record deleted → Refresh list
```

---

## 📊 Module Status by Type

### ✅ COMPLIANT (No Action Needed)

```
CUSTOMERS:
├─ Customers/ListView.tsx ✅
├─ CustomerFormPanel.tsx (drawer) ✅
├─ useCustomerStatus.ts (dynamic) ✅
└─ Routes: List + Detail only ✅

PRODUCTS:
├─ ProductsPage.tsx ✅
├─ ProductsFormPanel.tsx (drawer) ✅
├─ useProductCategory.ts (dynamic) ✅
└─ Routes: List only ✅

SALES:
├─ SalesPage.tsx ✅
├─ SalesDealFormPanel.tsx (drawer) ✅
└─ Routes: List only ✅

PRODUCT SALES:
├─ ProductSalesPage.tsx ✅
├─ ProductSaleFormPanel.tsx (drawer) ✅
└─ Routes: List only ✅

TICKETS:
├─ TicketsPage.tsx ✅
├─ TicketsFormPanel.tsx (drawer) ✅
└─ Routes: List + Detail ✅
```

### ⚠️ NEEDS CLEANUP

```
CUSTOMERS - LEGACY:
├─ CustomerCreatePage.tsx ❌ DELETE
├─ CustomerEditPage.tsx ❌ DELETE
├─ Routes: /new, /:id/edit ❌ REMOVE
└─ Action: DELETE pages, update routes

DASHBOARD:
├─ DashboardPageNew.tsx ❌ DELETE
└─ Action: DELETE unused PageNew

JOBWORKS:
├─ JobWorksFormPanel.tsx
├─ JobWorksFormPanelEnhanced.tsx ❌ CONSOLIDATE
└─ Action: Keep one, delete duplicate

CONTRACTS:
├─ ContractDetailPage.tsx ⚠️ VERIFY USAGE
└─ Action: Keep or convert to drawer?

TICKETS:
├─ TicketDetailPage.tsx ⚠️ VERIFY USAGE
└─ Action: Keep or convert to drawer?
```

---

## 🎨 Component Pattern Examples

### FormPanel (Create + Edit in Drawer)

```typescript
// ✅ GOOD: Single FormPanel handles both modes
interface FormPanelProps {
  visible: boolean;
  record: Record | null;  // null = create, object = edit
  onClose: () => void;
  onSuccess: () => void;
}

const RecordFormPanel: React.FC<FormPanelProps> = ({
  visible,
  record,
  onClose,
  onSuccess
}) => {
  const isEdit = record !== null;
  
  return (
    <Drawer
      title={isEdit ? 'Edit Record' : 'Create Record'}
      onClose={onClose}
      open={visible}
    >
      <Form
        initialValues={isEdit ? record : {}}
        onFinish={(values) => {
          isEdit
            ? updateRecord(record.id, values)
            : createRecord(values);
          onSuccess();
        }}
      >
        {/* Fields */}
      </Form>
    </Drawer>
  );
};

// ❌ BAD: Separate pages for create and edit
const CreatePage = () => { /* create form */ };
const EditPage = ({ id }) => { /* edit form */ };
```

### ListPage Integration

```typescript
// ✅ GOOD: All operations from list page
const ListPage = () => {
  const [mode, setMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<Record | null>(null);

  return (
    <>
      {/* Table with inline actions */}
      <Table
        columns={[
          ...columnDefs,
          {
            title: 'Actions',
            render: (_, record) => (
              <>
                <Button onClick={() => {
                  setSelected(record);
                  setMode('view');
                }}>View</Button>
                <Button onClick={() => {
                  setSelected(record);
                  setMode('edit');
                }}>Edit</Button>
                <Button onClick={() => delete(record.id)}>Delete</Button>
              </>
            )
          }
        ]}
        dataSource={records}
      />

      {/* Drawers for all operations */}
      <FormPanel
        visible={mode === 'create' || mode === 'edit'}
        record={selected}
        onClose={() => setMode(null)}
      />
      <DetailPanel
        visible={mode === 'view'}
        record={selected}
        onClose={() => setMode(null)}
      />
    </>
  );
};
```

---

## 🔌 Reference Data (Dynamic Dropdowns)

### ✅ GOOD: Dynamic via Hooks

```typescript
// hooks/useRecordStatus.ts
export const useRecordStatus = () => {
  return useQuery({
    queryKey: ['reference-data:record-status'],
    queryFn: async () => {
      const response = await api.getReferenceData('record_status');
      return response.map(item => ({
        label: item.display_name,
        value: item.code
      }));
    },
  });
};

// In FormPanel:
const { data: statuses } = useRecordStatus();

<Select name="status" options={statuses} />
```

### ❌ BAD: Static Options

```typescript
// ❌ Hardcoded values
<Select name="status">
  <Option value="active">Active</Option>
  <Option value="inactive">Inactive</Option>
  <Option value="pending">Pending</Option>
</Select>

// ❌ Hardcoded arrays in same file
const statuses = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];
```

---

## 🛣️ Routes Pattern

### ✅ GOOD: Clean Routes

```typescript
// routes.tsx
export const recordRoutes: RouteObject[] = [
  {
    path: 'records',
    children: [
      {
        index: true,
        element: <RecordListPage />        // Main page
      },
      {
        path: ':id',
        element: <RecordDetailPage />      // Optional: detail page
      }
      // ✅ NO "new" route
      // ✅ NO ":id/edit" route
    ]
  }
];
```

### ❌ BAD: Legacy Routes

```typescript
// ❌ DO NOT DO:
{
  path: 'records',
  children: [
    {
      index: true,
      element: <RecordListPage />
    },
    {
      path: 'new',                          // ❌ NO
      element: <RecordCreatePage />
    },
    {
      path: ':id',
      element: <RecordDetailPage />
    },
    {
      path: ':id/edit',                     // ❌ NO
      element: <RecordEditPage />
    }
  ]
}
```

---

## 📝 Cleanup Checklist (Per Module)

```
MODULE: ________________

STRUCTURE CHECK:
[ ] Has FormPanel (drawer for create/edit)?
[ ] Has ListPage as main page?
[ ] Has optional DetailPage?
[ ] NO full-page CreatePage?
[ ] NO full-page EditPage?

REFERENCE DATA CHECK:
[ ] All dropdowns use hooks?
[ ] No static Option values?
[ ] useModuleStatus hook exists?
[ ] Other reference data hooked?

ROUTES CHECK:
[ ] Only list route exists?
[ ] No 'new' route?
[ ] No ':id/edit' route?
[ ] Optional ':id' detail route OK?

CODE QUALITY:
[ ] No dead code?
[ ] No unused imports?
[ ] No orphaned components?
[ ] Tests passing?

CLEANUP NEEDED:
[ ] Files to delete: _________________
[ ] Routes to remove: _________________
[ ] Hooks to create: _________________
[ ] Components to create: _________________
```

---

## 🚀 Quick Start: Converting a Module

**If you find a module with full-page create/edit:**

### Step 1: Verify FormPanel exists
```bash
ls src/modules/features/MODULE/components/ModuleFormPanel.tsx
```

### Step 2: If FormPanel exists
- Update routes.tsx - remove create/edit routes
- Update ListPage - add drawer for create/edit
- Delete legacy pages
- Archive deleted files

### Step 3: If FormPanel doesn't exist
- Create ModuleFormPanel.tsx based on template
- Update ListPage to use drawer
- Delete legacy pages

### Step 4: Update Reference Data
- Identify all dropdowns with static values
- Create useModuleXxx.ts hooks
- Replace static values with hook calls

### Step 5: Verify
```bash
npm run test -- module
npm run build
```

### Step 6: Commit
```bash
git add src/modules/features/module/
git add .archive/
git commit -m "refactor(module): standardize to FormPanel + ListPage pattern"
```

---

## 🎓 Learning Resources

**Read These Files:**
1. `MODULE_CLEANUP_AND_STANDARDIZATION_GUIDE.md` - Full guide
2. `MODULE_CLEANUP_DETAILED_CHECKLIST.md` - Step-by-step instructions
3. This file - Quick reference

**Reference Implementation:**
- Best: `src/modules/features/customers/` (after cleanup)
- Good: `src/modules/features/sales/`
- Good: `src/modules/features/product-sales/`

**Watch For:**
- ❌ Full-page create/edit views
- ❌ Static dropdown values
- ❌ Multiple unused page files
- ✅ Single FormPanel drawer
- ✅ Dynamic reference data
- ✅ Clean routes

---

## 🆘 Troubleshooting

**Problem:** User can't create records
- [ ] Check: Is FormPanel drawer opening?
- [ ] Check: Are create/edit routes removed from routes.tsx?
- [ ] Check: Is ListPage triggering drawer correctly?

**Problem:** Dropdown showing no options
- [ ] Check: Is useModuleXxx hook returning data?
- [ ] Check: No typos in hook usage?
- [ ] Check: Reference data table populated?

**Problem:** Old URLs (/module/new) still work
- [ ] Check: routes.tsx still has old route?
- [ ] Check: Module not properly rebuilt?
- [ ] Run: `npm run build`

**Problem:** Can't find old file (now archived)
- [ ] Check: `.archive/DELETED_2025_11_MODULES_CLEANUP/`
- [ ] Restore: `cp .archive/.../file.archive src/...`
- [ ] Or restore from git: `git show HASH:path`

---

## ✅ Final Verification

After cleanup, verify:

```bash
# 1. No build errors
npm run build

# 2. All tests pass
npm run test

# 3. No TypeScript errors
npm run typecheck

# 4. No lint errors
npm run lint

# 5. Application runs
npm run dev

# 6. Can access list page
navigate to /tenant/module

# 7. Can create via drawer
click "Create" button → drawer opens

# 8. Can edit via drawer
click "Edit" button → drawer opens

# 9. Can delete via list
click "Delete" → record removed

# 10. No console errors
open DevTools → no red errors
```

---

**Last Updated:** 2025-11-10
**Version:** 1.0
**Status:** Ready for implementation


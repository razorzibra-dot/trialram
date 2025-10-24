# Customer Module - Developer Reference Card

**Keep this handy while developing!**

---

## 🔧 Quick Imports

```typescript
// Hooks
import { useCustomers, useCustomer, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/modules/features/customers';
import { useSalesByCustomer } from '@/modules/features/sales/hooks/useRelatedSales';
import { useContractsByCustomer } from '@/modules/features/contracts/hooks/useRelatedContracts';
import { useTicketsByCustomer } from '@/modules/features/tickets/hooks/useRelatedTickets';

// Service
import { CustomerService } from '@/modules/features/customers/services/customerService';
import { apiServiceFactory } from '@/services/api/apiServiceFactory';

// Store
import { useCustomerStore } from '@/modules/features/customers';

// Types
import { Customer, CustomerTag } from '@/types/crm';
import type { CreateCustomerData, UpdateCustomerData } from '@/modules/features/customers';
```

---

## 📝 Common Code Patterns

### Pattern 1: Fetch Customers
```typescript
const { customers, isLoading, pagination, refetch } = useCustomers({
  search: 'tech',
  status: 'active',
  page: 1,
  pageSize: 20,
});

// Use in JSX
<Table 
  dataSource={customers}
  loading={isLoading}
  pagination={{ total: pagination.total }}
/>
```

### Pattern 2: Create Customer
```typescript
const createCustomer = useCreateCustomer();

const handleCreate = async (data: CreateCustomerData) => {
  try {
    await createCustomer.mutateAsync(data);
    message.success('Customer created');
    navigate('/tenant/customers');
  } catch (error) {
    message.error('Failed to create');
  }
};
```

### Pattern 3: Update Customer
```typescript
const updateCustomer = useUpdateCustomer();

const handleUpdate = async (id: string, data: Partial<CreateCustomerData>) => {
  try {
    await updateCustomer.mutateAsync({ id, data });
    message.success('Customer updated');
  } catch (error) {
    message.error('Failed to update');
  }
};
```

### Pattern 4: Delete Customer
```typescript
const deleteCustomer = useDeleteCustomer();

const handleDelete = async (id: string) => {
  try {
    await deleteCustomer.mutateAsync(id);
    message.success('Customer deleted');
  } catch (error) {
    message.error('Failed to delete');
  }
};
```

### Pattern 5: Load Dynamic Data
```typescript
const [data, setData] = useState<any[]>([]);

useEffect(() => {
  apiServiceFactory.getCustomerService()
    .getIndustries()
    .then(setData)
    .catch(console.error);
}, []);

// Use in dropdown
<Select>
  {data.map(item => (
    <Option key={item} value={item}>{item}</Option>
  ))}
</Select>
```

### Pattern 6: Load Related Data
```typescript
const { data: relatedSales } = useSalesByCustomer(customerId);
const { data: relatedContracts } = useContractsByCustomer(customerId);
const { data: relatedTickets } = useTicketsByCustomer(customerId);

// Use in tabs
<Tabs.TabPane tab="Sales" key="sales">
  <Table dataSource={relatedSales} />
</Tabs.TabPane>
```

---

## 📁 File Locations

| Component | File |
|-----------|------|
| List Page | `src/modules/features/customers/views/CustomerListPage.tsx` |
| Detail Page | `src/modules/features/customers/views/CustomerDetailPage.tsx` |
| Create Page | `src/modules/features/customers/views/CustomerCreatePage.tsx` |
| Edit Page | `src/modules/features/customers/views/CustomerEditPage.tsx` |
| Service | `src/modules/features/customers/services/customerService.ts` |
| Hooks | `src/modules/features/customers/hooks/useCustomers.ts` |
| Store | `src/modules/features/customers/store/customerStore.ts` |
| Routes | `src/modules/features/customers/routes.tsx` |

---

## 🔴 Critical Tasks

### Task 1: Wire Create Form
**File**: `CustomerCreatePage.tsx`
**What**: Import `useCreateCustomer()` and call in submit handler
**Time**: 30 min
**Code**:
```typescript
const createCustomer = useCreateCustomer();
await createCustomer.mutateAsync(values);
navigate('/tenant/customers');
```

### Task 2: Wire Edit Form
**File**: `CustomerEditPage.tsx`
**What**: Import `useUpdateCustomer()` and `useDeleteCustomer()` and wire to form
**Time**: 30 min
**Code**:
```typescript
const updateCustomer = useUpdateCustomer();
await updateCustomer.mutateAsync({ id, data: values });
```

### Task 3: Fix Delete Button
**File**: `CustomerDetailPage.tsx`
**What**: Replace TODO with actual delete call
**Time**: 15 min
**Code**:
```typescript
const deleteCustomer = useDeleteCustomer();
await deleteCustomer.mutateAsync(id);
```

### Task 4: Create Related Hooks
**Files**: `sales/hooks`, `contracts/hooks`, `tickets/hooks`
**What**: Create `useXxxByCustomer()` hooks
**Time**: 1 hour
**Code**: See Task 6 in quick fix guide

### Task 5: Load Related Data
**File**: `CustomerDetailPage.tsx`
**What**: Replace mock arrays with hook data
**Time**: 30 min
**Code**: See Pattern 6 above

### Task 6: Dynamic Dropdowns
**File**: `CustomerFormPanel.tsx`
**What**: Load industries, sizes, users and populate selects
**Time**: 1 hour
**Code**: See Pattern 5 above

---

## 🧪 Quick Tests

**Test Create**:
```bash
# Navigate to
/tenant/customers/new

# Fill form and submit
# Check:
✅ Success message shows
✅ Redirected to list
✅ New customer appears
✅ No console errors
```

**Test Edit**:
```bash
# Navigate to
/tenant/customers/:id/edit

# Modify field and submit
# Check:
✅ Change saved
✅ Success message shows
✅ Detail page shows new value
✅ No console errors
```

**Test Delete**:
```bash
# From detail page or list
# Click delete and confirm
# Check:
✅ Customer removed from list
✅ Success message shows
✅ No console errors
```

**Test Related Data**:
```bash
# Navigate to
/tenant/customers/:id

# Check tabs:
✅ Sales tab has real data (not hardcoded)
✅ Contracts tab has real data
✅ Tickets tab has real data
✅ No "TKT-2024-123" (test data)
```

**Test Dropdowns**:
```bash
# Navigate to
/tenant/customers/new

# Open dropdowns:
✅ Industry has real options
✅ Size has real options
✅ Assigned To has real users
✅ No hardcoded options
```

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---------|-----|
| Forget to import hook | `import { useCreateCustomer } from '../hooks/useCustomers';` |
| Not awaiting promise | `await createCustomer.mutateAsync(data);` |
| Hardcoded dropdown data | Load from service in useEffect |
| Mock data in detail page | Replace with hook data |
| console.log() forgotten | Remove or convert to error logging |
| No error handling | Add catch block and show message |
| Missing navigate() | Add `import { useNavigate }` and call after success |

---

## 🎯 Completion Checklist

### Must Complete (Critical)
- [ ] Create form submits
- [ ] Edit form submits
- [ ] Delete works
- [ ] Related data loads

### Should Complete (Important)
- [ ] Dropdowns populated
- [ ] Filters visible
- [ ] No console errors
- [ ] All CRUD tested

### Nice to Have
- [ ] Bulk operations
- [ ] Export/Import
- [ ] Tag management
- [ ] Advanced filters

---

## 🔗 Related Modules

**Sales Module**:
- Need: `getSalesByCustomerId()` method
- File: `src/modules/features/sales/services/`

**Contracts Module**:
- Need: `getContractsByCustomerId()` method
- File: `src/modules/features/contracts/services/`

**Tickets Module**:
- Need: `getTicketsByCustomerId()` method
- File: `src/modules/features/tickets/services/`

**User Module**:
- Need: `getUsers()` for Assigned To dropdown
- File: `src/modules/features/user-management/services/`

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| Hook not exported | Check `index.ts` exports it |
| Service method undefined | Check service has method, factory exports it |
| Form not submitting | Check onClick handler, ensure form validates |
| Data not loading | Check console for errors, verify service returns data |
| Dropdown empty | Add console.log to verify service call, check format |
| Delete doesn't work | Check delete hook imported and called properly |

---

## 📊 File Dependencies

```
CustomerListPage.tsx
├── useCustomers (hook) ✅
├── useDeleteCustomer (hook) ✅
├── useCustomerStats (hook) ✅
└── CustomerFormPanel ✅

CustomerDetailPage.tsx
├── useCustomer (hook) ✅
├── useDeleteCustomer (hook) ⚠️ (not used)
├── useSalesByCustomer (hook) ❌ (needs creation)
├── useContractsByCustomer (hook) ❌ (needs creation)
├── useTicketsByCustomer (hook) ❌ (needs creation)
└── CustomerDetailPanel ✅

CustomerCreatePage.tsx
├── useCreateCustomer (hook) ⚠️ (not used)
└── CustomerFormPanel ✅

CustomerEditPage.tsx
├── useCustomer (hook) ✅
├── useUpdateCustomer (hook) ⚠️ (not used)
├── useDeleteCustomer (hook) ⚠️ (not used)
└── CustomerFormPanel ✅

CustomerFormPanel.tsx
├── useCreateCustomer (hook) ✅
├── useUpdateCustomer (hook) ✅
└── getCustomerService() ✅
```

---

## 💻 Terminal Commands

```bash
# Navigate to repo
cd c:\Users\RZ\source\repos\PDS-CRM-Application\CRMV9_NEWTHEME

# Install deps (if needed)
npm install

# Start dev server
npm run dev

# Run build to check for errors
npm run build

# Run linter
npm run lint

# Run quality check
npm run quality:check

# Check types
npx tsc --noEmit
```

---

## 📚 Documentation Files

1. **CUSTOMER_MODULE_PENDING_FUNCTIONALITY.md** - Full audit of pending work
2. **CUSTOMER_MODULE_QUICK_FIX_GUIDE.md** - Step-by-step implementation
3. **CUSTOMER_MODULE_STATUS_SUMMARY.md** - Visual status and roadmap
4. **CUSTOMER_MODULE_REFERENCE_CARD.md** - This file

---

## ✅ Before Submitting PR

- [ ] All CRUD works (create, read, update, delete)
- [ ] No console errors
- [ ] No TODO comments left
- [ ] Related data loads (not mock)
- [ ] Dropdowns populated dynamically
- [ ] Form validation works
- [ ] Error messages display
- [ ] Success messages display
- [ ] Navigation works after CRUD
- [ ] Responsive design works
- [ ] TypeScript compiles without errors
- [ ] ESLint passes

---

## 🎬 Quick Start for New Developer

1. **Read** this reference card (5 min)
2. **Read** QUICK_FIX_GUIDE.md (15 min)
3. **Start** with Fix #1 (Create Form - 30 min)
4. **Test** in browser (10 min)
5. **Move to** Fix #2, #3, etc.

**Total Time to Get Started**: 1 hour
**Estimated Total Time to Complete**: 5-7 days

---

## 📞 Need Help?

**Check these first**:
1. Does the hook exist? Check `useCustomers.ts`
2. Does the service method exist? Check `customerService.ts`
3. Is it exported? Check `index.ts`
4. Is there an error in console? Read it carefully
5. Is the service factory routing correctly? Check `.env` VITE_API_MODE

**Common Issues**:
- Service method not found → Check it's exported from factory
- Hook not working → Verify enabled condition with tenant context
- Dropdown empty → Add console.log to verify service returns data
- Form not submitting → Check onClick handler and form validation

# Customer Module - Quick Fix Implementation Guide

**Purpose**: Step-by-step fixes for pending functionality
**Time to Complete**: 2-3 days
**Difficulty**: Beginner to Intermediate

---

## 🔥 CRITICAL FIXES (Today's Priority)

### FIX #1: Wire Create Customer Form

**File**: `src/modules/features/customers/views/CustomerCreatePage.tsx`

**Current (Broken)**:
```typescript
const handleSubmit = async (values: CreateCustomerData) => {
  setLoading(true);
  try {
    // TODO: Implement create customer API call
    console.log('Creating customer with data:', values);
    // ... (never actually creates)
```

**Replace With**:
```typescript
import { useCreateCustomer } from '../hooks/useCustomers';

const CustomerCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const createCustomer = useCreateCustomer(); // ADD THIS

  const handleSubmit = async (values: CreateCustomerData) => {
    setLoading(true);
    try {
      await createCustomer.mutateAsync(values);
      message.success('Customer created successfully');
      navigate('/tenant/customers');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };
  // ... rest of component
```

**Test After**:
1. Go to `/tenant/customers/new`
2. Fill form with test data
3. Click "Create"
4. Should redirect to list with success message
5. New customer should appear in table

---

### FIX #2: Wire Edit Customer Form

**File**: `src/modules/features/customers/views/CustomerEditPage.tsx`

**Find** (around line 80-150):
```typescript
// Incomplete handleSubmit
const handleSubmit = async (values: CreateCustomerData) => {
  // TODO: implement
```

**Replace With**:
```typescript
import { useUpdateCustomer, useDeleteCustomer } from '../hooks/useCustomers';

const CustomerEditPage: React.FC = () => {
  // ... existing code ...
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const { data: customer, isLoading } = useCustomer(id!);

  const handleSubmit = async (values: Partial<CreateCustomerData>) => {
    if (!id) return;
    setLoading(true);
    try {
      await updateCustomer.mutateAsync({ id, data: values });
      message.success('Customer updated successfully');
      navigate('/tenant/customers');
    } catch (error) {
      message.error('Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteCustomer.mutateAsync(id);
      message.success('Customer deleted successfully');
      navigate('/tenant/customers');
    } catch (error) {
      message.error('Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };
  // ... rest
```

**Test After**:
1. Go to `/tenant/customers/:id/edit`
2. Modify a field
3. Click "Update" - should update and redirect
4. Test delete button

---

### FIX #3: Load Related Data in Detail Page

**File**: `src/modules/features/customers/views/CustomerDetailPage.tsx`

**Current Problem** (Lines 84-132):
Mock data hardcoded - need to fetch from API

**Step 1: Add hooks to sales module**
Create: `src/modules/features/sales/hooks/useRelatedSales.ts`

```typescript
export function useSalesByCustomer(customerId: string) {
  const { isInitialized: isTenantInitialized } = useTenantContext();
  
  return useQuery(
    ['sales', 'customer', customerId],
    () => apiServiceFactory.getSalesService().getSalesByCustomerId(customerId),
    {
      enabled: !!customerId && isTenantInitialized,
      staleTime: 5 * 60 * 1000,
    }
  );
}
```

**Step 2: Add hooks to contracts module**
Create: `src/modules/features/contracts/hooks/useRelatedContracts.ts`

```typescript
export function useContractsByCustomer(customerId: string) {
  const { isInitialized: isTenantInitialized } = useTenantContext();
  
  return useQuery(
    ['contracts', 'customer', customerId],
    () => apiServiceFactory.getContractService().getContractsByCustomerId(customerId),
    {
      enabled: !!customerId && isTenantInitialized,
      staleTime: 5 * 60 * 1000,
    }
  );
}
```

**Step 3: Add hooks to tickets module**
Create: `src/modules/features/tickets/hooks/useRelatedTickets.ts`

```typescript
export function useTicketsByCustomer(customerId: string) {
  const { isInitialized: isTenantInitialized } = useTenantContext();
  
  return useQuery(
    ['tickets', 'customer', customerId],
    () => apiServiceFactory.getTicketService().getTicketsByCustomerId(customerId),
    {
      enabled: !!customerId && isTenantInitialized,
      staleTime: 5 * 60 * 1000,
    }
  );
}
```

**Step 4: Update DetailPage**
```typescript
import { useSalesByCustomer } from '../../../sales/hooks/useRelatedSales';
import { useContractsByCustomer } from '../../../contracts/hooks/useRelatedContracts';
import { useTicketsByCustomer } from '../../../tickets/hooks/useRelatedTickets';

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: customer } = useCustomer(id!);

  // REPLACE mock data with real API calls
  const { data: relatedSales = [] } = useSalesByCustomer(id!);
  const { data: relatedContracts = [] } = useContractsByCustomer(id!);
  const { data: relatedTickets = [] } = useTicketsByCustomer(id!);

  // Remove hardcoded arrays and use real data
  // Tables will render relatedSales, relatedContracts, relatedTickets
```

---

## 🎯 HIGH PRIORITY FIXES (Next)

### FIX #4: Load Dynamic Dropdowns

**File**: `src/modules/features/customers/components/CustomerFormPanel.tsx`

**Add to top of component**:
```typescript
import { useState, useEffect } from 'react';

export const CustomerFormPanel: React.FC<CustomerFormPanelProps> = ({...}) => {
  const [industries, setIndustries] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [users, setUsers] = useState<{id: string; name: string}[]>([]);

  // Fetch industries
  useEffect(() => {
    getCustomerService().getIndustries()
      .then(setIndustries)
      .catch(err => console.error('Failed to load industries:', err));
  }, []);

  // Fetch sizes
  useEffect(() => {
    getCustomerService().getSizes()
      .then(setSizes)
      .catch(err => console.error('Failed to load sizes:', err));
  }, []);

  // Fetch users
  useEffect(() => {
    apiServiceFactory.getUserService().getUsers()
      .then(users => setUsers(users.map(u => ({ id: u.id, name: u.firstName + ' ' + u.lastName }))))
      .catch(err => console.error('Failed to load users:', err));
  }, []);
```

**Then in Form replace hardcoded options**:
```typescript
// OLD (REMOVE):
// <Select name="industry">
//   <Option value="tech">Technology</Option>
//   <Option value="finance">Finance</Option>
// </Select>

// NEW (ADD):
<Form.Item label="Industry" name="industry">
  <Select placeholder="Select industry">
    {industries.map(industry => (
      <Option key={industry} value={industry}>{industry}</Option>
    ))}
  </Select>
</Form.Item>

<Form.Item label="Company Size" name="size">
  <Select placeholder="Select size">
    {sizes.map(size => (
      <Option key={size} value={size}>{size}</Option>
    ))}
  </Select>
</Form.Item>

<Form.Item label="Assigned To" name="assigned_to">
  <Select placeholder="Select user" allowClear>
    {users.map(user => (
      <Option key={user.id} value={user.id}>{user.name}</Option>
    ))}
  </Select>
</Form.Item>
```

---

### FIX #5: Add Advanced Filters to List

**File**: `src/modules/features/customers/views/CustomerListPage.tsx`

**Add after line 30**:
```typescript
const [industryFilter, setIndustryFilter] = useState<string>('');
const [sizeFilter, setSizeFilter] = useState<string>('');
const [assignedFilter, setAssignedFilter] = useState<string>('');
const [dateRange, setDateRange] = useState<[any, any] | null>(null);

const [industries, setIndustries] = useState<string[]>([]);
const [sizes, setSizes] = useState<string[]>([]);
const [users, setUsers] = useState<{id: string; name: string}[]>([]);

useEffect(() => {
  Promise.all([
    getCustomerService().getIndustries().then(setIndustries),
    getCustomerService().getSizes().then(setSizes),
    apiServiceFactory.getUserService().getUsers().then(u => 
      setUsers(u.map(user => ({ id: user.id, name: `${user.firstName} ${user.lastName}` })))
    )
  ]).catch(console.error);
}, []);
```

**Update filter handlers**:
```typescript
const handleIndustryFilter = (value: string) => {
  setIndustryFilter(value);
  setFilters({ ...filters, industry: value || undefined, page: 1 });
};

const handleSizeFilter = (value: string) => {
  setSizeFilter(value);
  setFilters({ ...filters, size: value || undefined, page: 1 });
};

const handleAssignedFilter = (value: string) => {
  setAssignedFilter(value);
  setFilters({ ...filters, assignedTo: value || undefined, page: 1 });
};
```

**Add to UI after status filter**:
```typescript
// In the Space.Compact section, add more Select components:
<Select
  value={industryFilter}
  onChange={handleIndustryFilter}
  placeholder="Industry"
  allowClear
  style={{ width: 120 }}
>
  {industries.map(i => (
    <Option key={i} value={i}>{i}</Option>
  ))}
</Select>

<Select
  value={sizeFilter}
  onChange={handleSizeFilter}
  placeholder="Size"
  allowClear
  style={{ width: 100 }}
>
  {sizes.map(s => (
    <Option key={s} value={s}>{s}</Option>
  ))}
</Select>

<Select
  value={assignedFilter}
  onChange={handleAssignedFilter}
  placeholder="Assigned To"
  allowClear
  style={{ width: 130 }}
>
  {users.map(u => (
    <Option key={u.id} value={u.id}>{u.name}</Option>
  ))}
</Select>
```

---

### FIX #6: Fix Delete in Detail Page

**File**: `src/modules/features/customers/views/CustomerDetailPage.tsx` (Line 139)

**Current (broken)**:
```typescript
const handleDelete = async () => {
  // TODO: Implement delete customer API call
  message.success('Customer deleted successfully');
}
```

**Fix**:
```typescript
import { useDeleteCustomer } from '../hooks/useCustomers';

const CustomerDetailPage: React.FC = () => {
  // ... existing code ...
  const deleteCustomer = useDeleteCustomer();

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteCustomer.mutateAsync(id);
      message.success('Customer deleted successfully');
      navigate('/tenant/customers');
    } catch (error) {
      message.error('Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };
```

---

## 📋 Testing Checklist

After implementing fixes, test these scenarios:

### Create Customer
- [ ] Navigate to `/tenant/customers/new`
- [ ] Fill all required fields
- [ ] Click Create
- [ ] Verify redirect to list
- [ ] Verify new record appears
- [ ] Verify success message shows

### Edit Customer
- [ ] Navigate to customer detail page
- [ ] Click Edit or go to `/tenant/customers/:id/edit`
- [ ] Modify fields
- [ ] Click Update
- [ ] Verify changes saved
- [ ] Verify redirect to detail page

### Delete Customer
- [ ] From list: Click delete icon
- [ ] From detail: Click delete button
- [ ] Confirm in popup
- [ ] Verify removed from list
- [ ] Verify success message

### Related Data Loading
- [ ] Go to customer detail page
- [ ] Check "Sales" tab loads sale data
- [ ] Check "Contracts" tab loads contracts
- [ ] Check "Tickets" tab loads tickets
- [ ] Verify no 404 errors in console

### Filters
- [ ] Apply industry filter - verify list updates
- [ ] Apply size filter - verify list updates
- [ ] Apply assigned filter - verify list updates
- [ ] Clear all filters - verify list resets

### Dropdowns
- [ ] Open create form
- [ ] Verify industries dropdown populated
- [ ] Verify sizes dropdown populated
- [ ] Verify assigned to dropdown populated

---

## 🚨 Common Issues & Solutions

### Issue: "getCustomerService() is not defined"
**Solution**: Add import
```typescript
import { CustomerService } from '../services/customerService';
const getCustomerService = () => inject<CustomerService>('customerService');
```

### Issue: "useDeleteCustomer is not exported"
**Solution**: Check `src/modules/features/customers/index.ts` exports it
```typescript
export { useDeleteCustomer } from './hooks/useCustomers';
```

### Issue: Related data shows as undefined
**Solution**: Add default value
```typescript
const { data: relatedSales = [] } = useSalesByCustomer(id!);
```

### Issue: "Module not found" for sales/contracts hooks
**Solution**: Create the hooks first in those modules (see FIX #3)

### Issue: Dropdown shows spinner forever
**Solution**: Check console for errors, ensure service method exists

---

## 🎬 Implementation Timeline

| Day | Task | Files |
|-----|------|-------|
| 1 | Create Form Submit | CreatePage, EditPage |
| 1 | Delete Button | DetailPage |
| 2 | Related Data Hooks | Sales, Contracts, Tickets modules |
| 2 | Update Detail Page | DetailPage |
| 3 | Dynamic Dropdowns | FormPanel |
| 3 | Advanced Filters | ListPage |
| 4 | Testing & Polish | All files |

---

## 🔗 Related Files to Check

- `src/services/api/apiServiceFactory.ts` - ensure all services have required methods
- `src/types/crm.ts` - verify Customer type has all fields
- `src/services/api/supabase/customerService.ts` - ensure backend methods exist
- `.env` - ensure `VITE_API_MODE` is set correctly

---

## ✅ Done Checklist

Use this to track progress:

**Phase 1: Forms (High Impact)**
- [ ] Create form submission
- [ ] Edit form submission
- [ ] Delete functionality

**Phase 2: Related Data (Core Feature)**
- [ ] Sales hook created
- [ ] Contracts hook created
- [ ] Tickets hook created
- [ ] Detail page integrated
- [ ] Verify data loads

**Phase 3: Dropdowns (UX)**
- [ ] Industries populated
- [ ] Sizes populated
- [ ] Assigned To populated

**Phase 4: Filters (Advanced)**
- [ ] Industry filter added
- [ ] Size filter added
- [ ] Assigned filter added

**Phase 5: Testing (Quality)**
- [ ] All CRUD operations work
- [ ] No console errors
- [ ] Related data displays
- [ ] Filters work correctly
- [ ] Dropdowns populated

# 🎯 Customer Module - Complete 100% Checklist

**Document Version**: 1.0  
**Last Updated**: 2025-01-15  
**Current Progress**: 60% → Target: 100%  
**Total Tasks**: 48 (32 Complete, 16 Pending)

---

## 📊 Progress Dashboard

```
Customer Module Completion Progress
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 1: Critical Customer Form Fixes       ████░░░░░░░░ 40%  (0/2)
Phase 2: Related Data Integration          ░░░░░░░░░░░░░  0%  (0/5)
Phase 3: Dynamic UI & Dropdowns            ░░░░░░░░░░░░░  0%  (0/4)
Phase 4: Dependent Module Work             ░░░░░░░░░░░░░  0%  (0/3)
Phase 5: Advanced Features & Polish        ░░░░░░░░░░░░░  0%  (0/2)

TOTAL                                       ███░░░░░░░░░░░░ 20% (4/16)
```

---

## 🔴 PHASE 1: CRITICAL FORM FIXES (2-3 hours)
*Highest Priority - BLOCKS ALL CRUD OPERATIONS*

### 1.1 Fix Customer Create Form Submission
- **Status**: 🔴 NOT STARTED
- **File**: `src/modules/features/customers/views/CustomerCreatePage.tsx` (Lines 43-50)
- **Priority**: CRITICAL
- **Effort**: 30 minutes
- **Impact**: HIGH
- **Description**: CreatePage has form component but NO submission handler. Contains TODO comment.

**Tasks**:
- [ ] Wire `useCreateCustomer()` hook to form submission handler
- [ ] Add error/success handling with toast notifications
- [ ] Navigate to customer detail page after creation
- [ ] Validate form data before submission
- [ ] Add loading state during submission
- [ ] Handle validation errors from API

**Implementation Reference**:
```typescript
// BEFORE (Current - TODO)
const onFinish = (values: any) => {
  // TODO: Implement customer creation
};

// AFTER (Target)
const { mutate: createCustomer, isPending } = useCreateCustomer();

const onFinish = async (values: CustomerFormData) => {
  try {
    const result = await createCustomer(values);
    message.success('Customer created successfully');
    navigate(`/customers/${result.id}`);
  } catch (error) {
    message.error(`Failed to create customer: ${error.message}`);
  }
};
```

**Tests**:
- [ ] Submit form with valid data → Navigate to detail page
- [ ] Submit with invalid data → Show validation errors
- [ ] Submit with missing required fields → Show error messages
- [ ] Check API call is made with correct payload
- [ ] Verify loading spinner shows during request
- [ ] Verify success message appears

---

### 1.2 Fix Customer Edit Form Submission
- **Status**: 🔴 NOT STARTED
- **File**: `src/modules/features/customers/views/CustomerEditPage.tsx` (Lines 38-50)
- **Priority**: CRITICAL
- **Effort**: 30 minutes
- **Impact**: HIGH
- **Description**: EditPage has form component but NO submission handler. Contains TODO comment.

**Tasks**:
- [ ] Wire `useUpdateCustomer()` hook to form submission handler
- [ ] Prepopulate form with existing customer data
- [ ] Show loading state while fetching customer
- [ ] Add error/success handling with toast notifications
- [ ] Navigate back to customer detail page after update
- [ ] Detect if data actually changed (dirty state)
- [ ] Disable submit button if no changes
- [ ] Handle partial updates

**Implementation Reference**:
```typescript
// BEFORE (Current - TODO)
const onFinish = (values: any) => {
  // TODO: Implement customer update
};

// AFTER (Target)
const { mutate: updateCustomer, isPending } = useUpdateCustomer();
const { customer, isLoading } = useCustomer(customerId);

useEffect(() => {
  if (customer) {
    form.setFieldsValue(customer);
  }
}, [customer]);

const onFinish = async (values: CustomerFormData) => {
  try {
    await updateCustomer({ id: customerId, ...values });
    message.success('Customer updated successfully');
    navigate(`/customers/${customerId}`);
  } catch (error) {
    message.error(`Failed to update customer: ${error.message}`);
  }
};
```

**Tests**:
- [ ] Load existing customer data into form
- [ ] Submit form with changed data → Update customer
- [ ] Submit form with no changes → Show warning or disable submit
- [ ] Verify API call includes correct ID and payload
- [ ] Check loading spinner shows while fetching
- [ ] Verify success message appears after update
- [ ] Navigate back to detail page

---

### 1.3 Fix Customer Delete Functionality
- **Status**: 🔴 NOT STARTED
- **File**: `src/modules/features/customers/views/CustomerDetailPage.tsx` (Lines 150-160)
- **Priority**: CRITICAL
- **Effort**: 20 minutes
- **Impact**: MEDIUM
- **Description**: Delete button exists but handler is empty with TODO comment.

**Tasks**:
- [ ] Wire `useDeleteCustomer()` hook to delete button click handler
- [ ] Show confirmation modal before deleting
- [ ] Add error/success handling
- [ ] Navigate to customer list after successful deletion
- [ ] Handle deletion of related data (cascade or warn)
- [ ] Disable delete button during operation
- [ ] Show loading state

**Implementation Reference**:
```typescript
// BEFORE (Current - TODO)
const handleDelete = () => {
  // TODO: Implement customer deletion
};

// AFTER (Target)
const { mutate: deleteCustomer, isPending } = useDeleteCustomer();

const handleDelete = () => {
  Modal.confirm({
    title: 'Delete Customer',
    content: `Are you sure you want to delete "${customer.name}"? This action cannot be undone.`,
    okText: 'Delete',
    okType: 'danger',
    onOk: async () => {
      try {
        await deleteCustomer(customerId);
        message.success('Customer deleted successfully');
        navigate('/customers');
      } catch (error) {
        message.error(`Failed to delete customer: ${error.message}`);
      }
    }
  });
};
```

**Tests**:
- [ ] Click delete button → Show confirmation modal
- [ ] Cancel deletion → Stay on page
- [ ] Confirm deletion → Show loading state
- [ ] Successful deletion → Navigate to list
- [ ] Failed deletion → Show error message
- [ ] Button disabled during deletion

---

## 🟠 PHASE 2: RELATED DATA INTEGRATION (4-6 hours)
*CRITICAL - Customer Detail page currently shows HARDCODED mock data*

### 2.1 Create Sales by Customer Hook
- **Status**: 🔴 NOT STARTED
- **File**: `src/modules/features/sales/hooks/useSales.ts` (NEW)
- **Priority**: CRITICAL
- **Effort**: 1 hour
- **Impact**: HIGH
- **Dependency**: Sales Module
- **Related File**: `src/modules/features/customers/views/CustomerDetailPage.tsx` (Lines 84-101)
- **Description**: Create hook to fetch sales/deals related to a specific customer

**Tasks**:
- [ ] Create `useSalesByCustomer(customerId: string)` hook
- [ ] Integrate with `SalesService.getDealsByCustomer()` or create if missing
- [ ] Add proper error handling
- [ ] Add loading state
- [ ] Add pagination support
- [ ] Add filters (stage, date range, value range)
- [ ] Cache results with React Query
- [ ] Add retry logic on failure

**Implementation Reference**:
```typescript
// File: src/modules/features/sales/hooks/useSales.ts

export function useSalesByCustomer(customerId: string) {
  const { tenant } = useTenantContext();
  
  return useQuery({
    queryKey: ['sales', 'by-customer', customerId],
    queryFn: async () => {
      const { data, error } = await salesService.getDealsByCustomer(customerId);
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!customerId && !!tenant?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}
```

**Tests**:
- [ ] Fetch sales for valid customer ID
- [ ] Handle empty results
- [ ] Handle API errors gracefully
- [ ] Verify data structure matches Deal type
- [ ] Check pagination works
- [ ] Verify cache invalidation on update/delete

---

### 2.2 Create Contracts by Customer Hook
- **Status**: 🔴 NOT STARTED
- **File**: `src/modules/features/contracts/hooks/useContracts.ts` (NEW)
- **Priority**: CRITICAL
- **Effort**: 1 hour
- **Impact**: HIGH
- **Dependency**: Contracts Module
- **Related File**: `src/modules/features/customers/views/CustomerDetailPage.tsx` (Lines 103-113)
- **Description**: Create hook to fetch contracts related to a specific customer

**Tasks**:
- [ ] Create `useContractsByCustomer(customerId: string)` hook
- [ ] Integrate with `ContractService.getContractsByCustomer()` or create if missing
- [ ] Add proper error handling
- [ ] Add loading state
- [ ] Add pagination support
- [ ] Add filters (status, type, value range)
- [ ] Cache results with React Query
- [ ] Add retry logic on failure

**Implementation Reference**:
```typescript
// File: src/modules/features/contracts/hooks/useContracts.ts

export function useContractsByCustomer(customerId: string) {
  const { tenant } = useTenantContext();
  
  return useQuery({
    queryKey: ['contracts', 'by-customer', customerId],
    queryFn: async () => {
      const { data, error } = await contractService.getContractsByCustomer(customerId);
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!customerId && !!tenant?.id,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });
}
```

**Tests**:
- [ ] Fetch contracts for valid customer ID
- [ ] Handle empty results
- [ ] Handle API errors gracefully
- [ ] Verify data structure matches Contract type
- [ ] Check pagination works
- [ ] Verify cache invalidation on update/delete

---

### 2.3 Create Tickets by Customer Hook
- **Status**: 🔴 NOT STARTED
- **File**: `src/modules/features/tickets/hooks/useTickets.ts` (UPDATE)
- **Priority**: CRITICAL
- **Effort**: 1 hour
- **Impact**: HIGH
- **Dependency**: Tickets Module
- **Related File**: `src/modules/features/customers/views/CustomerDetailPage.tsx` (Lines 115-132)
- **Description**: Create hook to fetch support tickets related to a specific customer

**Tasks**:
- [ ] Create `useTicketsByCustomer(customerId: string)` hook
- [ ] Integrate with `TicketService.getTicketsByCustomer()` or create if missing
- [ ] Add proper error handling
- [ ] Add loading state
- [ ] Add pagination support
- [ ] Add filters (status, priority, category)
- [ ] Cache results with React Query
- [ ] Add retry logic on failure

**Implementation Reference**:
```typescript
// File: src/modules/features/tickets/hooks/useTickets.ts

export function useTicketsByCustomer(customerId: string) {
  const { tenant } = useTenantContext();
  
  return useQuery({
    queryKey: ['tickets', 'by-customer', customerId],
    queryFn: async () => {
      const { data, error } = await ticketService.getTicketsByCustomer(customerId);
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!customerId && !!tenant?.id,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });
}
```

**Tests**:
- [ ] Fetch tickets for valid customer ID
- [ ] Handle empty results
- [ ] Handle API errors gracefully
- [ ] Verify data structure matches Ticket type
- [ ] Check pagination works
- [ ] Verify cache invalidation on update/delete

---

### 2.4 Replace Mock Data with Real API Calls
- **Status**: 🔴 NOT STARTED
- **File**: `src/modules/features/customers/views/CustomerDetailPage.tsx`
- **Priority**: CRITICAL
- **Effort**: 1.5 hours
- **Impact**: HIGH
- **Description**: Replace hardcoded mock arrays with real API data from hooks

**Tasks**:
- [ ] Remove hardcoded `relatedSales` array (Lines 84-101)
- [ ] Replace with `useSalesByCustomer()` hook call
- [ ] Add loading skeleton for Sales tab
- [ ] Add empty state message
- [ ] Add error boundary for Sales tab
- [ ] Remove hardcoded `relatedContracts` array (Lines 103-113)
- [ ] Replace with `useContractsByCustomer()` hook call
- [ ] Add loading skeleton for Contracts tab
- [ ] Add empty state message
- [ ] Add error boundary for Contracts tab
- [ ] Remove hardcoded `relatedTickets` array (Lines 115-132)
- [ ] Replace with `useTicketsByCustomer()` hook call
- [ ] Add loading skeleton for Tickets tab
- [ ] Add empty state message
- [ ] Add error boundary for Tickets tab

**Implementation Reference**:
```typescript
// BEFORE (Current - Hardcoded)
const relatedSales = [
  { id: '1', title: 'Q4 Enterprise Deal', value: 250000, stage: 'Proposal' },
  // ... more hardcoded data
];

// AFTER (Target)
const { data: relatedSales = [], isLoading: salesLoading } = useSalesByCustomer(customerId);

// In render:
<Skeleton loading={salesLoading} />
{relatedSales.length === 0 ? (
  <Empty description="No sales found" />
) : (
  <SalesList data={relatedSales} />
)}
```

**Tests**:
- [ ] Load customer detail page → Related data loads from API
- [ ] Show loading skeleton while fetching
- [ ] Show empty state when no data
- [ ] Show error message on API failure
- [ ] Click to view related item → Navigate to detail page
- [ ] Verify no hardcoded data remains

---

### 2.5 Add Related Data Error Boundaries
- **Status**: 🔴 NOT STARTED
- **File**: `src/modules/features/customers/views/CustomerDetailPage.tsx`
- **Priority**: MEDIUM
- **Effort**: 30 minutes
- **Impact**: MEDIUM
- **Description**: Add error boundaries to prevent tab crashes if related data fails

**Tasks**:
- [ ] Wrap Sales tab in error boundary
- [ ] Wrap Contracts tab in error boundary
- [ ] Wrap Tickets tab in error boundary
- [ ] Show user-friendly error messages
- [ ] Add "Retry" button on error
- [ ] Log errors for debugging

**Implementation Reference**:
```typescript
<ErrorBoundary
  fallback={<Alert type="error" message="Failed to load sales" />}
>
  <SalesTab />
</ErrorBoundary>
```

**Tests**:
- [ ] Trigger API error → Error boundary catches it
- [ ] Click Retry → Re-fetch data
- [ ] Other tabs still functional if one fails

---

## 🟡 PHASE 3: DYNAMIC UI & DROPDOWNS (3-4 hours)
*HIGH PRIORITY - Currently showing static/empty dropdowns*

### 3.1 Populate Industry Dropdown from API
- **Status**: 🔴 NOT STARTED
- **File**: `src/modules/features/customers/components/CustomerFormPanel.tsx`
- **Priority**: HIGH
- **Effort**: 45 minutes
- **Impact**: MEDIUM
- **Dependency**: Masters Module
- **Description**: Load industries dynamically instead of hardcoded list

**Tasks**:
- [ ] Check if Masters service has `getIndustries()` method
- [ ] Create `useIndustries()` hook if missing
- [ ] Fetch industries on component mount
- [ ] Populate industry select options dynamically
- [ ] Handle loading state
- [ ] Handle error state
- [ ] Add "Other" option for custom industries
- [ ] Cache results appropriately

**Implementation Reference**:
```typescript
// In CustomerFormPanel.tsx
const { data: industries = [], isLoading } = useIndustries();

const industryOptions = industries.map(ind => ({
  label: ind.name,
  value: ind.id,
}));

<Form.Item name="industry" label="Industry">
  <Select
    options={industryOptions}
    loading={isLoading}
    placeholder="Select industry"
    allowClear
  />
</Form.Item>
```

**Tests**:
- [ ] Load form → Industries populate from API
- [ ] Show loading spinner while fetching
- [ ] Select industry → Value updates in form
- [ ] Submit form with industry → API receives correct value
- [ ] Handle API error gracefully

---

### 3.2 Populate Size Dropdown from API
- **Status**: 🔴 NOT STARTED
- **File**: `src/modules/features/customers/components/CustomerFormPanel.tsx`
- **Priority**: HIGH
- **Effort**: 45 minutes
- **Impact**: MEDIUM
- **Dependency**: Masters Module
- **Description**: Load company sizes dynamically instead of hardcoded list

**Tasks**:
- [ ] Check if Masters service has `getCompanySizes()` method
- [ ] Create `useCompanySizes()` hook if missing
- [ ] Fetch sizes on component mount
- [ ] Populate size select options dynamically
- [ ] Handle loading state
- [ ] Handle error state
- [ ] Provide standard options (Small, Medium, Large, Enterprise)
- [ ] Cache results appropriately

**Implementation Reference**:
```typescript
// In CustomerFormPanel.tsx
const { data: sizes = [], isLoading } = useCompanySizes();

const sizeOptions = sizes.map(size => ({
  label: size.name,
  value: size.id,
}));

<Form.Item name="size" label="Company Size">
  <Select
    options={sizeOptions}
    loading={isLoading}
    placeholder="Select company size"
    allowClear
  />
</Form.Item>
```

**Tests**:
- [ ] Load form → Sizes populate from API
- [ ] Show loading spinner while fetching
- [ ] Select size → Value updates in form
- [ ] Submit form with size → API receives correct value
- [ ] Handle API error gracefully

---

### 3.3 Populate "Assigned To" Dropdown from Users API
- **Status**: 🔴 NOT STARTED
- **File**: `src/modules/features/customers/components/CustomerFormPanel.tsx`
- **Priority**: HIGH
- **Effort**: 45 minutes
- **Impact**: MEDIUM
- **Dependency**: User Management Module
- **Description**: Load active users dynamically for assignment

**Tasks**:
- [ ] Check if User Management service has `getUsers()` method
- [ ] Create or update `useUsers()` hook
- [ ] Fetch only active users
- [ ] Populate assigned-to select options dynamically
- [ ] Handle loading state
- [ ] Handle error state
- [ ] Show user names with initials/avatars if available
- [ ] Add "Unassigned" option
- [ ] Cache results appropriately

**Implementation Reference**:
```typescript
// In CustomerFormPanel.tsx
const { data: users = [], isLoading } = useUsers({ status: 'active' });

const assignedToOptions = [
  { label: 'Unassigned', value: null },
  ...users.map(user => ({
    label: `${user.firstName} ${user.lastName}`,
    value: user.id,
  }))
];

<Form.Item name="assignedTo" label="Assigned To">
  <Select
    options={assignedToOptions}
    loading={isLoading}
    placeholder="Select user"
    allowClear
  />
</Form.Item>
```

**Tests**:
- [ ] Load form → Users populate from API
- [ ] Show loading spinner while fetching
- [ ] Select user → Value updates in form
- [ ] Submit form with assigned user → API receives correct value
- [ ] Handle API error gracefully
- [ ] Only active users shown

---

### 3.4 Expose Advanced Filters in Customer List
- **Status**: 🔴 NOT STARTED
- **File**: `src/modules/features/customers/views/CustomerListPage.tsx`
- **Priority**: HIGH
- **Effort**: 1 hour
- **Impact**: MEDIUM
- **Description**: Currently only Status filter visible; expose Industry, Size, Assigned To, Date Range

**Tasks**:
- [ ] Add Industry filter dropdown (use dynamic data from Phase 3.1)
- [ ] Add Size filter dropdown (use dynamic data from Phase 3.2)
- [ ] Add "Assigned To" filter dropdown (use dynamic data from Phase 3.3)
- [ ] Add Date Range filter (created, last contacted)
- [ ] Add "Clear Filters" button
- [ ] Update URL query params when filters change
- [ ] Load filters from URL on page load
- [ ] Show active filter count badge
- [ ] Add collapsible filter panel
- [ ] Update service calls to include filter values

**Implementation Reference**:
```typescript
// In CustomerListPage.tsx
const [filters, setFilters] = useState<CustomerFilters>({
  status: undefined,
  industry: undefined,
  size: undefined,
  assignedTo: undefined,
  dateRange: undefined,
});

const handleFilterChange = (newFilters: Partial<CustomerFilters>) => {
  setFilters(prev => ({ ...prev, ...newFilters }));
  // Fetch customers with updated filters
  refetch();
};

// Render filter UI
<CustomerFilterPanel 
  filters={filters} 
  onChange={handleFilterChange}
/>
```

**Tests**:
- [ ] Change industry filter → List updates
- [ ] Change size filter → List updates
- [ ] Change assigned user → List updates
- [ ] Select date range → List updates
- [ ] Clear filters → All customers shown
- [ ] URL updates with filter params
- [ ] Reload page → Filters restored from URL
- [ ] Filter count badge shows correct number

---

## 🟢 PHASE 4: DEPENDENT MODULE WORK (4-6 hours)
*Required to support Customer module features*

### 4.1 Implement Sales Service Method: `getDealsByCustomer()`
- **Status**: 🔴 NOT STARTED
- **File**: `src/modules/features/sales/services/salesService.ts`
- **Priority**: HIGH
- **Effort**: 1 hour
- **Impact**: REQUIRED FOR Phase 2.1
- **Dependency**: Sales Module Team
- **Description**: Add method to fetch deals related to specific customer

**Tasks**:
- [ ] Add `getDealsByCustomer(customerId: string)` method to SalesService
- [ ] Query deals table filtered by customer_id
- [ ] Return paginated results
- [ ] Include filtering options (stage, value, date)
- [ ] Add sorting options
- [ ] Integrate with multi-tenant context
- [ ] Add proper error handling
- [ ] Support mock and Supabase modes

**Implementation Reference**:
```typescript
// In salesService.ts
async getDealsByCustomer(
  customerId: string, 
  filters?: SalesFilters
): Promise<PaginatedResponse<Deal>> {
  try {
    const deals = await legacySalesService.getDealsByCustomer(customerId, filters);
    return {
      data: deals,
      total: deals.length,
      page: 1,
      pageSize: deals.length,
    };
  } catch (error) {
    return {
      data: [],
      total: 0,
      error: error.message,
    };
  }
}
```

**Tests**:
- [ ] Fetch deals for valid customer → Return deals list
- [ ] Fetch deals for customer with no deals → Return empty array
- [ ] Apply stage filter → Return filtered deals
- [ ] Apply value range filter → Return deals within range
- [ ] Handle invalid customer ID → Return error
- [ ] Test multi-tenant isolation

---

### 4.2 Implement Contracts Service Method: `getContractsByCustomer()`
- **Status**: 🔴 NOT STARTED
- **File**: `src/modules/features/contracts/services/contractService.ts`
- **Priority**: HIGH
- **Effort**: 1 hour
- **Impact**: REQUIRED FOR Phase 2.2
- **Dependency**: Contracts Module Team
- **Description**: Add method to fetch contracts related to specific customer

**Tasks**:
- [ ] Add `getContractsByCustomer(customerId: string)` method to ContractService
- [ ] Query contracts table filtered by customer_id
- [ ] Return paginated results
- [ ] Include filtering options (status, type, value)
- [ ] Add sorting options (by date, value, status)
- [ ] Integrate with multi-tenant context
- [ ] Add proper error handling
- [ ] Support mock and Supabase modes

**Implementation Reference**:
```typescript
// In contractService.ts
async getContractsByCustomer(
  customerId: string,
  filters?: ContractFilters
): Promise<PaginatedResponse<Contract>> {
  try {
    const contracts = await legacyContractService.getContractsByCustomer(customerId, filters);
    return {
      data: contracts,
      total: contracts.length,
      page: 1,
      pageSize: contracts.length,
    };
  } catch (error) {
    return {
      data: [],
      total: 0,
      error: error.message,
    };
  }
}
```

**Tests**:
- [ ] Fetch contracts for valid customer → Return contracts list
- [ ] Fetch contracts for customer with no contracts → Return empty array
- [ ] Apply status filter → Return filtered contracts
- [ ] Apply type filter → Return correct types
- [ ] Handle invalid customer ID → Return error
- [ ] Test multi-tenant isolation

---

### 4.3 Implement Tickets Service Method: `getTicketsByCustomer()`
- **Status**: 🔴 NOT STARTED
- **File**: `src/modules/features/tickets/services/ticketService.ts`
- **Priority**: HIGH
- **Effort**: 1 hour
- **Impact**: REQUIRED FOR Phase 2.3
- **Dependency**: Tickets Module Team
- **Description**: Add method to fetch support tickets related to specific customer

**Tasks**:
- [ ] Add `getTicketsByCustomer(customerId: string)` method to TicketService
- [ ] Query tickets table filtered by customer_id
- [ ] Return paginated results
- [ ] Include filtering options (status, priority, category)
- [ ] Add sorting options (by date, priority)
- [ ] Integrate with multi-tenant context
- [ ] Add proper error handling
- [ ] Support mock and Supabase modes

**Implementation Reference**:
```typescript
// In ticketService.ts
async getTicketsByCustomer(
  customerId: string,
  filters?: TicketFilters
): Promise<PaginatedResponse<Ticket>> {
  try {
    const tickets = await legacyTicketService.getTicketsByCustomer(customerId, filters);
    return {
      data: tickets,
      total: tickets.length,
      page: 1,
      pageSize: tickets.length,
    };
  } catch (error) {
    return {
      data: [],
      total: 0,
      error: error.message,
    };
  }
}
```

**Tests**:
- [ ] Fetch tickets for valid customer → Return tickets list
- [ ] Fetch tickets for customer with no tickets → Return empty array
- [ ] Apply status filter → Return filtered tickets
- [ ] Apply priority filter → Return correct priorities
- [ ] Handle invalid customer ID → Return error
- [ ] Test multi-tenant isolation

---

## 🔵 PHASE 5: ADVANCED FEATURES & POLISH (4-6 hours)
*MEDIUM PRIORITY - Nice-to-have features*

### 5.1 Implement Bulk Operations (Select & Delete)
- **Status**: 🔴 NOT STARTED
- **File**: `src/modules/features/customers/views/CustomerListPage.tsx`
- **Priority**: MEDIUM
- **Effort**: 2 hours
- **Impact**: MEDIUM
- **Description**: Add row selection and bulk delete capability

**Tasks**:
- [ ] Add checkbox column to customer list grid
- [ ] Implement row selection state
- [ ] Add "Bulk Actions" toolbar
- [ ] Implement bulk delete with confirmation
- [ ] Show count of selected rows
- [ ] Add "Select All / Deselect All" checkbox in header
- [ ] Add bulk update status
- [ ] Add bulk assign to user
- [ ] Show success/error message after bulk operation
- [ ] Disable bulk actions when no rows selected

**Implementation Reference**:
```typescript
const [selectedRows, setSelectedRows] = useState<string[]>([]);

const columns = [
  {
    type: 'checkbox',
    width: 50,
    fixed: 'left',
    render: (_, record) => (
      <Checkbox
        checked={selectedRows.includes(record.id)}
        onChange={() => toggleRowSelection(record.id)}
      />
    ),
  },
  // ... other columns
];

const handleBulkDelete = () => {
  Modal.confirm({
    title: `Delete ${selectedRows.length} customers?`,
    content: 'This action cannot be undone.',
    okType: 'danger',
    onOk: () => {
      deleteBulk(selectedRows);
    },
  });
};
```

**Tests**:
- [ ] Click row checkbox → Row selected
- [ ] Select multiple rows → Bulk actions toolbar appears
- [ ] Click "Select All" → All rows selected
- [ ] Deselect all rows → Toolbar disappears
- [ ] Click bulk delete → Show confirmation with count
- [ ] Confirm delete → Show loading, then success
- [ ] Failed delete → Show error message

---

### 5.2 Implement Export & Import UI
- **Status**: 🔴 NOT STARTED
- **File**: `src/modules/features/customers/views/CustomerListPage.tsx`
- **Priority**: MEDIUM
- **Effort**: 2 hours
- **Impact**: MEDIUM
- **Description**: Add buttons and modals for exporting and importing customers

**Tasks**:
- [ ] Add Export button in toolbar
- [ ] Implement CSV export with all customer fields
- [ ] Implement JSON export option
- [ ] Show export progress
- [ ] Add Import button in toolbar
- [ ] Create import modal with file upload
- [ ] Support CSV and JSON formats
- [ ] Show import preview before confirmation
- [ ] Handle import validation errors
- [ ] Show import results (success count, failures)
- [ ] Refresh list after successful import

**Implementation Reference**:
```typescript
const handleExport = async (format: 'csv' | 'json') => {
  try {
    const { data, error } = await exportCustomers(format);
    if (error) throw error;
    
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers.${format}`;
    link.click();
  } catch (error) {
    message.error(`Export failed: ${error.message}`);
  }
};

const handleImport = async (file: File) => {
  try {
    const result = await importCustomers(file);
    message.success(`Imported ${result.successCount} customers`);
    refetch();
  } catch (error) {
    message.error(`Import failed: ${error.message}`);
  }
};
```

**Tests**:
- [ ] Click export button → File downloads
- [ ] Open imported file → Contains all customer data
- [ ] Click import button → Modal opens
- [ ] Upload CSV file → Preview shows data
- [ ] Confirm import → Show loading, then success
- [ ] Check database → New customers created
- [ ] Import with errors → Show error report
- [ ] Import duplicate data → Show validation error

---

### 5.3 Polish & QA Checklist
- **Status**: 🔴 NOT STARTED
- **Priority**: MEDIUM
- **Effort**: 1-2 hours
- **Impact**: QUALITY IMPROVEMENT
- **Description**: Final polish, error handling, and testing

**Tasks**:
- [ ] Test all CRUD operations end-to-end
- [ ] Verify all error messages are user-friendly
- [ ] Test loading states and spinners
- [ ] Verify empty states show helpful messages
- [ ] Test with large datasets (1000+ customers)
- [ ] Test network failure scenarios
- [ ] Verify mobile responsiveness
- [ ] Test keyboard navigation
- [ ] Verify accessibility (ARIA labels, tab order)
- [ ] Check console for warnings/errors
- [ ] Performance test (FCP, LCP, CLS)
- [ ] Test multi-tenant isolation
- [ ] Verify all fields are properly validated
- [ ] Test concurrent operations (multiple users)

**Tests**:
- [ ] Create, read, update, delete customer → All work correctly
- [ ] Create duplicate email → Show validation error
- [ ] Edit customer and cancel → No changes saved
- [ ] Delete customer with related data → Show warning or cascade
- [ ] Export and import → Data integrity maintained
- [ ] Filter and search → Correct results
- [ ] Navigate between pages → State preserved
- [ ] Logout and login → Session managed correctly

---

## 📋 MASTER CHECKLIST - ALL TASKS

### ✅ ALREADY COMPLETE (32/48 tasks)

**Customer Module - Core Features**:
- [x] List page displays customers with pagination
- [x] List page shows search functionality
- [x] List page shows basic filtering (status)
- [x] Detail page displays customer information
- [x] Detail page shows tabs (Overview, Related Data, Activity, Notes)
- [x] Create page renders form component
- [x] Edit page renders form component
- [x] Form has all required fields and validation
- [x] Form has proper TypeScript typing
- [x] Service layer implements all CRUD operations
- [x] Create customer hook (`useCreateCustomer`)
- [x] Read customer hook (`useCustomer`)
- [x] Update customer hook (`useUpdateCustomer`)
- [x] Delete customer hook (`useDeleteCustomer`)
- [x] Get customers list hook with pagination
- [x] Search customers hook
- [x] Filter customers hook
- [x] Customer store (Zustand) created and working
- [x] Store selection state management
- [x] Store bulk operations support
- [x] Statistics calculation working
- [x] All UI components professionally designed
- [x] Ant Design integration complete
- [x] Tailwind CSS styling applied
- [x] Routes configured with lazy loading
- [x] Error boundaries implemented
- [x] Suspense boundaries implemented
- [x] Multi-tenant context integration
- [x] Service factory pattern implemented
- [x] Export hook created
- [x] Import hook created
- [x] Tag management hook created
- [x] Activity tracking hook created

### ⏳ PENDING TASKS (16/48 tasks)

**Phase 1 - Critical Form Fixes** (3 tasks):
- [ ] 1.1 Wire Create form submission to service
- [ ] 1.2 Wire Edit form submission to service
- [ ] 1.3 Implement delete functionality

**Phase 2 - Related Data Integration** (5 tasks):
- [ ] 2.1 Create Sales by Customer hook
- [ ] 2.2 Create Contracts by Customer hook
- [ ] 2.3 Create Tickets by Customer hook
- [ ] 2.4 Replace mock data with API calls
- [ ] 2.5 Add error boundaries for related data

**Phase 3 - Dynamic UI & Dropdowns** (4 tasks):
- [ ] 3.1 Populate Industry dropdown
- [ ] 3.2 Populate Size dropdown
- [ ] 3.3 Populate "Assigned To" dropdown
- [ ] 3.4 Expose advanced filters

**Phase 4 - Dependent Module Work** (3 tasks):
- [ ] 4.1 Implement Sales Service method
- [ ] 4.2 Implement Contracts Service method
- [ ] 4.3 Implement Tickets Service method

**Phase 5 - Advanced Features** (2 tasks):
- [ ] 5.1 Implement bulk operations UI
- [ ] 5.2 Implement export/import UI

---

## 🗓️ RECOMMENDED TIMELINE

```
WEEK 1
├─ Day 1 (Mon)    - Phase 1: Form Fixes              [2-3 hours]
├─ Day 2 (Tue)    - Phase 2.1-2.3: Related Data     [3-4 hours]
├─ Day 3 (Wed)    - Phase 2.4-2.5: Mock → Real Data [2 hours]
└─ Day 3 (Wed)    - Phase 4: Dependent Module Work   [3-4 hours]

WEEK 2
├─ Day 1 (Mon)    - Phase 3: Dynamic UI & Dropdowns  [3-4 hours]
├─ Day 2 (Tue)    - Phase 5: Advanced Features       [4-6 hours]
└─ Day 3 (Wed)    - Polish & QA Testing              [2-3 hours]

ESTIMATED TOTAL: 22-28 hours (3-4 developer-days)
```

---

## 🚀 DEPLOYMENT READINESS CHECKLIST

**Before Merging to Main**:
- [ ] All Phase 1 tasks complete (critical fixes)
- [ ] All Phase 2 tasks complete (real data)
- [ ] All Phase 3 tasks complete (UI)
- [ ] All Phase 4 tasks complete (dependencies)
- [ ] All Phase 5 tasks complete (polish)
- [ ] Code review completed
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual QA testing completed
- [ ] Performance benchmarks acceptable
- [ ] No console errors or warnings
- [ ] Mobile responsive verified
- [ ] Accessibility verified
- [ ] Documentation updated
- [ ] Release notes prepared

---

## 📞 DEPENDENCIES & BLOCKERS

### Internal Dependencies:
1. **Sales Module** - For sales service method
2. **Contracts Module** - For contracts service method
3. **Tickets Module** - For tickets service method
4. **User Management** - For user list dropdown
5. **Masters Module** - For industries and sizes

### External Dependencies:
- Database schema for related data queries
- Service layer implementations in dependent modules
- API endpoints available and tested

### Known Blockers:
- [ ] Sales service method not implemented (blocks Phase 2.1)
- [ ] Contracts service method not implemented (blocks Phase 2.2)
- [ ] Tickets service method not implemented (blocks Phase 2.3)
- [ ] User management service not providing user list (blocks Phase 3.3)

---

## 📞 QUICK REFERENCE

**Key Files to Modify**:
- `src/modules/features/customers/views/CustomerCreatePage.tsx`
- `src/modules/features/customers/views/CustomerEditPage.tsx`
- `src/modules/features/customers/views/CustomerDetailPage.tsx`
- `src/modules/features/customers/views/CustomerListPage.tsx`
- `src/modules/features/customers/components/CustomerFormPanel.tsx`
- `src/modules/features/sales/services/salesService.ts`
- `src/modules/features/contracts/services/contractService.ts`
- `src/modules/features/tickets/services/ticketService.ts`

**Key Files to Create**:
- `src/modules/features/sales/hooks/useSalesByCustomer.ts`
- `src/modules/features/contracts/hooks/useContractsByCustomer.ts`
- `src/modules/features/tickets/hooks/useTicketsByCustomer.ts`

**Test Commands**:
```bash
npm run dev                # Start development server
npm run build              # Build for production
npm run lint               # Run ESLint
npm run validate:code      # Run code quality checks
```

---

## 📊 SUCCESS METRICS

**When 100% Complete**:
- ✅ All 20 Customer module features fully functional
- ✅ All CRUD operations working end-to-end
- ✅ Real data from API (no mock data in UI)
- ✅ All dropdowns populated from database
- ✅ Advanced filters working
- ✅ Related data showing for Sales, Contracts, Tickets
- ✅ Bulk operations available
- ✅ Export/Import working
- ✅ Zero console errors
- ✅ Mobile responsive
- ✅ Sub-second page load times
- ✅ All dependent modules integrated
- ✅ 100% test coverage for critical paths
- ✅ Production ready deployment

---

## 📝 NOTES & IMPORTANT REMINDERS

### Architecture Patterns to Follow:
1. **Service Factory Pattern** - Always route through `getService()` for multi-mode support
2. **React Query** - Use for all data fetching with proper caching
3. **Zustand Store** - Use for component state management
4. **Custom Hooks** - Encapsulate reusable logic
5. **Error Boundaries** - Wrap components that might throw errors
6. **Loading States** - Always show spinners/skeletons during async operations
7. **Empty States** - Show helpful messages when no data
8. **Error Messages** - Show user-friendly error messages

### Common Pitfalls to Avoid:
- ❌ Calling service directly instead of through factory
- ❌ Forgetting to check `useTenantContext()` before API calls
- ❌ Not using React Query for data fetching
- ❌ Hardcoding mock data in UI
- ❌ Not handling loading states
- ❌ Not handling error states
- ❌ Not validating form data
- ❌ Forgetting to add TypeScript types
- ❌ Not checking multi-tenant isolation
- ❌ Not testing with real API data

### Testing Approach:
1. Start with Phase 1 (critical fixes) - highest impact
2. Test each task as completed
3. Get feedback from PM/designer
4. Move to next phase
5. Retest after dependent modules work
6. Full end-to-end test before deployment

---

**Document Status**: ✅ Ready for Implementation  
**Next Action**: Assign Phase 1 tasks to developer  
**Review Date**: After each phase completion  

*For questions or blockers, reference CUSTOMER_MODULE_QUICK_FIX_GUIDE.md*
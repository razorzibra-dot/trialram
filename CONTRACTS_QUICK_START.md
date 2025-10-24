# Contracts Module - Quick Start Guide

## 🎯 What's New?

The Contracts module has been completely refactored with a modern architecture that perfectly matches the Customers module pattern.

---

## 📁 File Structure

```
NEW Files:
├── store/contractStore.ts              → State management (Zustand)
├── components/ContractFormPanel.tsx    → Create/Edit drawer
├── components/ContractDetailPanel.tsx  → View details drawer
└── ARCHITECTURE.md                      → Complete docs

UPDATED Files:
├── views/ContractsPage.tsx             → Main list page (refactored)
├── index.ts                            → Module exports
└── routes.tsx                          → Route updates
```

---

## 🚀 Quick Implementation

### 1. Use the Store
```typescript
import { useContractStore } from '@/modules/features/contracts';

// Get contracts
const contracts = useContractStore((state) => state.contracts);

// Get filters
const filters = useContractStore((state) => state.filters);

// Update filters
const setFilters = useContractStore((state) => state.setFilters);
```

### 2. Use the Hooks
```typescript
import { useContracts, useCreateContract, useDeleteContract } from '@/modules/features/contracts';

// Fetch contracts
const { contracts, pagination, isLoading } = useContracts(filters);

// Create contract
const createContract = useCreateContract();
await createContract.mutateAsync(contractData);

// Delete contract
const deleteContract = useDeleteContract();
await deleteContract.mutateAsync(contractId);
```

### 3. Use the Components
```typescript
import { 
  ContractFormPanel, 
  ContractDetailPanel 
} from '@/modules/features/contracts';

// Render
<ContractFormPanel 
  visible={isVisible}
  contract={selectedContract}
  onClose={() => setVisible(false)}
  onSuccess={() => refetch()}
/>

<ContractDetailPanel
  visible={isVisible}
  contract={selectedContract}
  onClose={() => setVisible(false)}
  onEdit={() => switchToEdit()}
/>
```

---

## 📊 Main Page Features

### Navigate to Contracts
```
http://localhost:5173/tenant/contracts
```

### What You'll See

1. **Statistics Cards** (4 total)
   - Total Contracts
   - Active Contracts
   - Pending Approval
   - Total Value

2. **Alerts Section**
   - Expiring Soon (30 days)
   - Renewals Due

3. **Search & Filters**
   - Search by title/number/customer
   - Filter by status
   - Filter by type

4. **Data Table**
   - Contract info
   - Customer info
   - Type & Status (badges)
   - Value & End Date
   - Actions (View/Edit/Delete)

5. **Pagination**
   - Choose page size
   - Quick jumper
   - Total count

---

## 🎨 Component Usage

### Create New Contract
```typescript
const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | null>(null);
const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

// Open create drawer
<Button onClick={() => {
  setSelectedContract(null);
  setDrawerMode('create');
}}>
  New Contract
</Button>

// Render form
<ContractFormPanel
  visible={drawerMode === 'create' || drawerMode === 'edit'}
  contract={drawerMode === 'edit' ? selectedContract : null}
  onClose={() => setDrawerMode(null)}
  onSuccess={() => {
    setDrawerMode(null);
    refetch();
  }}
/>
```

### View Contract Details
```typescript
// Open detail drawer
<Button onClick={() => {
  setSelectedContract(contract);
  setDrawerMode('view');
}}>
  View
</Button>

// Render detail
<ContractDetailPanel
  visible={drawerMode === 'view'}
  contract={selectedContract}
  onClose={() => setDrawerMode(null)}
  onEdit={() => setDrawerMode('edit')}
/>
```

---

## 🔄 Data Flow

```
User Action
    ↓
Component (ContractsPage)
    ↓
Hook (useContracts, useCreateContract, etc.)
    ↓
React Query
    ↓
Service (ContractService)
    ↓
API/Mock Data
    ↓
Response Back to Store
    ↓
UI Update
```

---

## 📋 Store Structure

### State Properties
```typescript
{
  contracts: Contract[]              // List of contracts
  selectedContract: Contract | null   // Selected for details
  filters: ContractFilters          // Search & filter params
  pagination: { page, pageSize, total }
  selectedContractIds: string[]      // For bulk operations
  isLoading: boolean
  error: string | null
}
```

### Common Actions
```typescript
// Set contracts list
store.setContracts(contracts);

// Add new contract
store.addContract(newContract);

// Update existing
store.updateContract(id, updates);

// Delete contract
store.removeContract(id);

// Set filters
store.setFilters({ status: 'active' });

// Clear filters
store.clearFilters();
```

---

## 🎯 Form Sections

### Basic Information
- Title (required)
- Number (required)
- Description

### Contract Details
- Type (Service Agreement, NDA, Purchase Order, etc.)
- Status (Draft, Active, Pending, etc.)
- Priority (Low, Medium, High, Urgent)

### Party Information
- Customer Name (required)
- Customer Contact
- Assigned To

### Financial
- Contract Value (required)
- Currency
- Payment Terms

### Dates
- Start Date (required)
- End Date (required)

### Renewal
- Auto Renewal (toggle)
- Renewal Period (months)
- Renewal Terms

### Additional
- Compliance Status
- Notes

---

## 🔐 Permissions

### Check Permissions
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { hasPermission } = useAuth();

// Check before showing button
{hasPermission('contracts:create') && (
  <Button onClick={handleCreate}>New Contract</Button>
)}
```

### Required Permissions
- `contracts:view` - View contracts
- `contracts:create` - Create new
- `contracts:update` - Edit/Approve
- `contracts:delete` - Delete

---

## 🔍 Searching & Filtering

### Search
```typescript
// By title, number, or customer
const handleSearch = (value: string) => {
  setFilters({ ...filters, search: value, page: 1 });
};
```

### Filter by Status
```typescript
const statuses = [
  'all', 'draft', 'pending_approval', 'active', 
  'renewed', 'expired', 'terminated'
];

const handleStatusFilter = (status: string) => {
  const value = status === 'all' ? undefined : status;
  setFilters({ ...filters, status: value, page: 1 });
};
```

### Filter by Type
```typescript
const types = [
  'all', 'service_agreement', 'nda', 
  'purchase_order', 'employment', 'custom'
];

const handleTypeFilter = (type: string) => {
  const value = type === 'all' ? undefined : type;
  setFilters({ ...filters, type: value, page: 1 });
};
```

---

## 📊 Statistics

### Available Stats
```typescript
const { data: contractStats } = useContractStats();

{
  total: number,              // Total contracts
  activeContracts: number,    // Currently active
  pendingApproval: number,    // Waiting for approval
  totalValue: number,         // Sum of all values
  averageValue: number,       // Average contract value
  byStatus: { ... },          // Breakdown by status
  byType: { ... }            // Breakdown by type
}
```

---

## 🚨 Alerts

### Expiring Soon (30 days)
```typescript
const { data: expiringContracts } = useExpiringContracts(30);
// Shows alert if any found
```

### Renewals Due (30 days)
```typescript
const { data: renewalsDue } = useContractsDueForRenewal(30);
// Shows alert if any found
```

---

## 💾 CRUD Operations

### Create
```typescript
const createContract = useCreateContract();
await createContract.mutateAsync({
  title: "New Agreement",
  type: "service_agreement",
  status: "draft",
  customer_name: "Acme Corp",
  value: 50000,
  currency: "USD",
  start_date: "2025-01-01",
  end_date: "2025-12-31",
  // ... other fields
});
```

### Read
```typescript
const { data: contract } = useContract(contractId);
// Full contract data with all fields
```

### Update
```typescript
const updateContract = useUpdateContract();
await updateContract.mutateAsync({
  id: contractId,
  data: {
    title: "Updated Title",
    status: "active"
  }
});
```

### Delete
```typescript
const deleteContract = useDeleteContract();
await deleteContract.mutateAsync(contractId);
```

---

## 🏷️ Color Coding

### Status Colors
- ✅ **Active** → Green
- ⏳ **Pending Approval** → Orange  
- 📝 **Draft** → Gray
- ⏰ **Expired** → Red
- 🔄 **Renewed** → Blue

### Type Colors
- 💼 **Service Agreement** → Blue
- 🔐 **NDA** → Purple
- 📦 **Purchase Order** → Green
- 👥 **Employment** → Orange

### Priority Colors
- 🔴 **Urgent** → Red
- 🟠 **High** → Orange
- 🟡 **Medium** → Gold
- 🟢 **Low** → Green

---

## 📱 Responsive Design

### Desktop (≥1200px)
- Full table display
- Side-by-side alerts
- All filters visible

### Tablet (768px-1199px)
- Compact table
- Stacked alerts
- Collapsible filters

### Mobile (<768px)
- Card-based layout
- Single column
- Touch-friendly buttons

---

## ⚡ Performance Tips

1. **Memoize Components**
   ```typescript
   const ContractForm = React.memo(ContractFormPanel);
   ```

2. **Use Selectors**
   ```typescript
   // Good - only re-renders when contracts change
   const contracts = useContractStore(state => state.contracts);
   
   // Bad - re-renders on every store update
   const state = useContractStore();
   ```

3. **Pagination**
   - Load 20 items per page
   - Don't load all at once
   - Use pagination for performance

4. **Caching**
   - React Query caches for 5-10 minutes
   - Manual refetch when needed
   - Invalidate cache on changes

---

## 🧪 Testing

### Unit Test Example
```typescript
test('contractStore - add contract', () => {
  const { result } = renderHook(() => useContractStore());
  act(() => {
    result.current.addContract(mockContract);
  });
  expect(result.current.contracts).toHaveLength(1);
});
```

### Integration Test Example
```typescript
test('Create contract workflow', async () => {
  render(<ContractsPage />);
  fireEvent.click(screen.getByText('New Contract'));
  fireEvent.change(screen.getByLabelText('Title'), { 
    target: { value: 'Test Contract' } 
  });
  fireEvent.click(screen.getByText('Create'));
  expect(await screen.findByText('Test Contract')).toBeInTheDocument();
});
```

---

## 🐛 Debugging

### Check Store State
```typescript
// In browser console
localStorage.getItem('contract-store');
```

### React Query DevTools
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

### Zustand DevTools
```typescript
// Install redux devtools browser extension
// Click Redux in DevTools to see state changes
```

---

## 📚 Related Documentation

- **Architecture Guide**: See `ARCHITECTURE.md`
- **Full Summary**: See `CONTRACTS_REFACTORING_COMPLETE.md`
- **Verification**: See `CONTRACTS_VERIFICATION_CHECKLIST.md`
- **Customers Module**: Similar pattern for reference

---

## ❓ FAQ

**Q: Where do I navigate to see contracts?**
A: `/tenant/contracts`

**Q: How do I create a new contract?**
A: Click "New Contract" button at the top of the page

**Q: Can I bulk delete contracts?**
A: Yes, select multiple rows and use bulk actions

**Q: How are dates formatted?**
A: MM/DD/YYYY for display, YYYY-MM-DD for storage

**Q: Can I export contracts?**
A: Yes, use the export dropdown in the list

**Q: What permissions do I need?**
A: Check with your admin for `contracts:*` permissions

**Q: How do I filter by multiple criteria?**
A: Use search + status filter + type filter together

**Q: Is there a real-time sync?**
A: Currently polling-based, real-time coming soon

---

## 🚀 Getting Started

1. **Navigate** to `/tenant/contracts`
2. **View** the list of contracts
3. **Click** "New Contract" to create
4. **Fill** in the form sections
5. **Save** and it appears in the list
6. **Click** row to view details
7. **Click** Edit to modify
8. **Use** filters to search

---

## 💡 Pro Tips

1. Use search for quick filtering
2. Combine multiple filters
3. Check expiring/renewal alerts
4. Sort by clicking column headers
5. Use pagination for performance
6. Export for reporting
7. Check permissions before actions

---

## 📞 Support

For detailed information:
- See `ARCHITECTURE.md` in contracts folder
- Check inline code comments
- Review Customers module for similar patterns
- Check browser console for errors

---

**Happy contracting! 🎉**

For production deployment, ensure all verification checklist items are complete.
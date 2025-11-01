# Contracts Module Architecture

## Overview
The Contracts module manages contract lifecycle, approvals, renewals, and compliance tracking. It follows a modern modular architecture synchronized with the Customers module pattern, ensuring consistency across the application.

**✨ UI Enhancement**: Forms have been upgraded to enterprise-level styling with professional visual hierarchy, card-based sections, and enhanced UX. See **FORMS_ENHANCEMENT_GUIDE.md** for detailed information.

## Module Structure

```
contracts/
├── components/
│   ├── ContractFormPanel.tsx         # Side drawer for create/edit (enterprise enhanced)
│   ├── ContractDetailPanel.tsx       # Side drawer for viewing details (enterprise enhanced)
│   └── ContractsList.tsx             # Legacy table component (maintained for compatibility)
├── hooks/
│   ├── useContracts.ts               # React Query hooks for contract operations
│   └── useServiceContracts.ts        # Service contracts hooks
├── services/
│   ├── contractService.ts            # Business logic for contracts
│   └── serviceContractService.ts     # Service contracts business logic
├── store/
│   └── contractStore.ts              # Zustand state management
├── views/
│   ├── ContractsPage.tsx             # Main contracts list page
│   └── ContractDetailPage.tsx        # Individual contract details page
├── index.ts                          # Module exports
├── routes.tsx                        # Route definitions
├── DOC.md                            # Architecture documentation
└── FORMS_ENHANCEMENT_GUIDE.md        # UI/UX form enhancements guide
```

## Key Features

### 1. **Contract Management**
- Create, read, update, and delete contracts
- Support for multiple contract types (Service Agreement, NDA, Purchase Order, Employment, Custom)
- Contract status tracking (Draft, Pending Approval, Active, Renewed, Expired, Terminated)
- Priority levels (Low, Medium, High, Urgent)

### 2. **Lifecycle Tracking**
- Track contract start and end dates
- Monitor expiring contracts (within 30 days)
- Track renewals due
- Auto-renewal configuration

### 3. **Financial Management**
- Contract value tracking
- Multi-currency support
- Payment and delivery terms
- Total portfolio value calculations

### 4. **Compliance & Approval**
- Compliance status tracking (Compliant, Non-Compliant, Pending Review)
- Multi-stage approval workflow
- Contract assignment to team members

### 5. **Statistics & Analytics**
- Total contracts count
- Active contracts breakdown
- Pending approvals count
- Contract value aggregation
- Breakdown by type and status

## Component Descriptions

### ContractsPage (Main Page)
- **Type**: React FC
- **Responsibilities**: 
  - Display contract list with filtering
  - Show statistics and alerts
  - Handle CRUD operations
  - Manage drawer states for forms and details

**Features**:
- Statistics cards (Total, Active, Pending, Value)
- Alert section for expiring/renewal contracts
- Advanced filtering (status, type, search)
- Pagination and sorting
- Role-based access control

### ContractFormPanel
- **Type**: React FC (Drawer Component)
- **Props**:
  - `visible`: boolean - Show/hide drawer
  - `contract`: Contract | null - Contract for editing (null for create)
  - `onClose`: () => void - Close handler
  - `onSuccess`: () => void - Success callback

**Form Sections**:
1. Basic Information (Title, Number, Description)
2. Contract Details (Type, Status, Priority)
3. Party Information (Customer, Contact, Assigned To)
4. Financial Information (Value, Currency, Payment Terms)
5. Dates (Start, End)
6. Renewal Settings (Auto-renewal, Period, Terms)
7. Additional Information (Compliance, Notes)

### ContractDetailPanel
- **Type**: React FC (Drawer Component)
- **Props**:
  - `visible`: boolean - Show/hide drawer
  - `contract`: Contract | null - Contract to display
  - `onClose`: () => void - Close handler
  - `onEdit`: () => void - Edit mode switch

**Sections**:
- Key metrics (Value, Days Remaining)
- Basic information
- Party information
- Financial details
- Duration
- Renewal settings
- Compliance status
- Notes

## State Management

### Zustand Store (contractStore.ts)

**State Properties**:
- `contracts`: Contract[] - List of contracts
- `selectedContract`: Contract | null - Currently selected contract
- `filters`: ContractFilters - Active filters
- `pagination`: { page, pageSize, total } - Pagination state
- `isLoading`: boolean - Loading state
- `error`: string | null - Error message
- `selectedContractIds`: string[] - Selected contracts for bulk operations

**Actions**:
- `setContracts()` - Update contract list
- `addContract()` - Add new contract
- `updateContract()` - Update existing contract
- `removeContract()` - Delete contract
- `setFilters()` - Update filters
- `setSelectedContract()` - Set selected contract
- `bulkUpdateContracts()` - Bulk update operations
- `bulkDeleteContracts()` - Bulk delete operations

**Selector Hooks**:
- `useContracts()` - Get contracts list
- `useSelectedContract()` - Get selected contract
- `useContractFilters()` - Get current filters
- `useContractPagination()` - Get pagination state
- `useContractSelection()` - Get selected contracts info
- `useContractLoading()` - Get loading state

## API & Hooks

### React Query Hooks (useContracts.ts)

**Data Fetching Hooks**:
- `useContracts(filters)` - Fetch contracts with pagination and filters
- `useContract(id)` - Fetch single contract
- `useContractStats()` - Fetch contract statistics
- `useExpiringContracts(days)` - Fetch expiring contracts
- `useContractsDueForRenewal(days)` - Fetch renewals due

**Mutation Hooks**:
- `useCreateContract()` - Create new contract
- `useUpdateContract()` - Update contract
- `useDeleteContract()` - Delete contract
- `useUpdateContractStatus()` - Change contract status
- `useApproveContract()` - Approve contract
- `useExportContracts(format)` - Export contracts (CSV/JSON)

### Query Keys Structure
```typescript
contractKeys.all        // ['contracts']
contractKeys.lists()    // ['contracts', 'list']
contractKeys.list()     // ['contracts', 'list', filters]
contractKeys.details()  // ['contracts', 'detail']
contractKeys.detail(id) // ['contracts', 'detail', id]
contractKeys.stats()    // ['contracts', 'stats']
contractKeys.expiring() // ['contracts', 'expiring', days]
contractKeys.renewals() // ['contracts', 'renewals', days]
```

## Service Layer (contractService.ts)

**Class**: ContractService extends BaseService

**Methods**:
- `getContracts(filters)` - Fetch contracts with pagination
- `getContract(id)` - Fetch single contract
- `createContract(data)` - Create new contract
- `updateContract(id, data)` - Update contract
- `deleteContract(id)` - Delete contract
- `getContractStats()` - Fetch statistics
- `getExpiringContracts(days)` - Get expiring contracts
- `getContractsDueForRenewal(days)` - Get renewals
- `updateContractStatus(id, status)` - Update status
- `approveContract(id, approvalData)` - Approve contract
- `exportContracts(format)` - Export contracts

## Data Types

### Contract
```typescript
interface Contract {
  id: string;
  contract_number: string;
  title: string;
  description?: string;
  type: 'service_agreement' | 'nda' | 'purchase_order' | 'employment' | 'custom';
  status: 'draft' | 'pending_approval' | 'active' | 'renewed' | 'expired' | 'terminated';
  customer_id: string;
  customer_name: string;
  customer_contact?: string;
  value: number;
  currency: string;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  renewal_period_months?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  compliance_status: 'compliant' | 'non_compliant' | 'pending_review';
  assigned_to_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

### ContractFilters
```typescript
interface ContractFilters {
  search?: string;
  status?: string;
  type?: string;
  customerName?: string;
  assignedTo?: string;
  priority?: string;
  dateRange?: { start: string; end: string };
  page?: number;
  pageSize?: number;
}
```

## Features Synchronization with Customers Module

The Contracts module has been refactored to match the Customers module pattern:

| Feature | Customers | Contracts |
|---------|-----------|-----------|
| Store | `customerStore.ts` | `contractStore.ts` |
| Hooks | `useCustomers.ts` | `useContracts.ts` |
| Form Panel | `CustomerFormPanel.tsx` | `ContractFormPanel.tsx` |
| Detail Panel | `CustomerDetailPanel.tsx` | `ContractDetailPanel.tsx` |
| Main Page | `CustomerListPage.tsx` | `ContractsPage.tsx` |
| Statistics | Yes | Yes |
| Filtering | Yes | Yes |
| Search | Yes | Yes |
| Pagination | Yes | Yes |
| Bulk Operations | Yes | Yes |
| Export | Basic | CSV/JSON |

## Role-Based Access Control

The module respects the following permissions:
- `contracts:view` - View contracts
- `contracts:create` - Create new contracts
- `contracts:update` - Edit and approve contracts
- `contracts:delete` - Delete contracts
- `contracts:export` - Export contracts

## Integration Points

### With Authentication
- Uses `useAuth()` hook for permission checks
- Supports role-based visibility of actions

### With Notifications
- Uses Sonner toast for user feedback
- Toast notifications for CRUD operations

### With React Router
- Lazy-loaded routes with error boundaries
- Loading states with suspense

## Performance Optimizations

1. **Memoization**: Components use React.memo to prevent unnecessary re-renders
2. **Query Caching**: React Query caches data with configurable stale times
3. **Lazy Loading**: Routes and components are code-split
4. **Zustand Optimization**: Selector hooks prevent store re-renders

## Error Handling

- Service layer includes try-catch blocks
- User-friendly error messages via toast
- Error boundaries for component-level errors
- Detailed logging for debugging

## Testing Considerations

### Unit Tests
- Store actions and selectors
- Service methods with mocked data
- Hook behavior with mock queries

### Integration Tests
- Complete CRUD workflows
- Filter and pagination functionality
- Form validation and submission

### E2E Tests
- User workflows from list to detail
- Create/Edit/Delete operations
- Search and filter interactions

## Future Enhancements

1. **Document Management**: Attach and manage contract documents
2. **eSignature Integration**: Support for digital signatures
3. **Advanced Reporting**: Contract analytics dashboard
4. **Template Library**: Pre-defined contract templates
5. **Notification System**: Automated alerts for renewals
6. **Audit Trail**: Complete change history
7. **Bulk Import**: CSV/Excel upload for contracts

## Migration Guide

If migrating from the old architecture:

1. **Replace Components**: Use new ContractsPage instead of old implementation
2. **Update Imports**: Use new exports from index.ts
3. **Store Integration**: Use contractStore selectors instead of local state
4. **Hook Usage**: Replace old query logic with useContracts hooks
5. **Testing**: Update test suites to use new mocks

## Troubleshooting

### Common Issues

1. **Data Not Updating**
   - Check React Query cache invalidation
   - Verify store state updates
   - Check API response format

2. **Form Not Submitting**
   - Verify form validation rules
   - Check mutation error handlers
   - Review console for error details

3. **Filters Not Working**
   - Verify filter state in store
   - Check query key updates
   - Confirm API filter support

## Related Documentation

- [Customers Module Architecture](../customers/ARCHITECTURE.md)
- [Core Module Services](../../core/ARCHITECTURE.md)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
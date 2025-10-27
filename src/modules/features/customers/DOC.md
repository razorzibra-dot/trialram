---
title: Customers Module
description: Complete documentation for the Customers module including architecture, components, state management, and API
lastUpdated: 2025-01-15
relatedModules: [sales, contracts, notifications, dashboard]
category: module
status: production
---

# Customers Module

## Overview

The Customers module is a core feature that manages customer lifecycle, contact information, account details, and customer relationships. It serves as the primary entity for customer data across the entire application and integrates with sales, contracts, and notification systems.

## Module Structure

```
customers/
├── components/              # Reusable UI components
│   ├── CustomerFormPanel.tsx    # Side drawer for create/edit
│   ├── CustomerDetailPanel.tsx  # Side drawer for viewing details
│   └── CustomersList.tsx        # Legacy table component
├── hooks/                   # Custom React hooks
│   ├── useCustomers.ts          # React Query hooks for customer operations
│   └── useCustomerFilters.ts    # Filter management hooks
├── services/                # Business logic
│   ├── customerService.ts       # Service factory-routed service
│   └── index.ts                 # Service exports
├── store/                   # State management
│   ├── customerStore.ts         # Zustand state for customers
│   └── index.ts
├── views/                   # Page components
│   ├── CustomersPage.tsx        # Main customers list page
│   └── CustomerDetailPage.tsx   # Individual customer details
├── index.ts                 # Module entry point
├── routes.tsx               # Route definitions
└── DOC.md                  # This file
```

## Key Features

### 1. Customer Management
- Create, read, update, and delete customers
- Multiple customer types (Individual, Business, Corporate, Government)
- Account status tracking (Active, Inactive, Suspended, Prospect)
- Contact information management

### 2. Contact & Communication
- Primary and secondary contact information
- Email addresses, phone numbers, websites
- Communication preferences
- Do-not-contact tracking

### 3. Business Information
- Company name and registration details
- Industry and business type classification
- Annual revenue tracking
- Employee count estimation

### 4. Location & Address Management
- Billing and shipping addresses
- Geographic location tracking
- Multi-location support
- Address validation

### 5. Account Hierarchy
- Customer relationships and linkages
- Parent/subsidiary tracking
- Account grouping
- Contact person associations

### 6. Statistics & Analytics
- Total customers count
- Active customers breakdown
- Customer status distribution
- Recent activity tracking
- Customer lifetime value calculations

## Component Descriptions

### CustomersPage (Main Page)

**Type**: React FC  
**Path**: `views/CustomersPage.tsx`

**Responsibilities**:
- Display customer list with advanced filtering
- Show customer statistics and key metrics
- Handle CRUD operations with confirmation dialogs
- Manage drawer states for forms and details
- Permission-based visibility of actions

**Features**:
- Statistics cards (Total, Active, Recent, Lifecycle Value)
- Advanced filtering (status, type, search, industry)
- Pagination and sorting
- Bulk actions (export, update status)
- Role-based access control
- Action buttons with permission checks

**State Management**:
```typescript
const [formVisible, setFormVisible] = useState(false);
const [detailsVisible, setDetailsVisible] = useState(false);
const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
const [filterValues, setFilterValues] = useState<CustomerFilters>({});
```

### CustomerFormPanel

**Type**: React FC (Drawer Component)  
**Path**: `components/CustomerFormPanel.tsx`

**Props**:
```typescript
interface CustomerFormPanelProps {
  visible: boolean;
  customer?: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Form Sections**:
1. Basic Information (Name, Type, Status)
2. Contact Information (Email, Phone, Website)
3. Address (Billing & Shipping)
4. Business Details (Industry, Revenue, Employees)
5. Account Settings (Parent Customer, Tags)
6. Notes & Additional Info

**Validation**:
- Email format validation
- Phone number format
- Required field checks
- Unique customer name per account

### CustomerDetailPanel

**Type**: React FC (Drawer Component)  
**Path**: `components/CustomerDetailPanel.tsx`

**Props**:
```typescript
interface CustomerDetailPanelProps {
  visible: boolean;
  customer?: Customer | null;
  onClose: () => void;
  onEdit: () => void;
}
```

**Display Sections**:
- Key metrics (Lifecycle Value, Recent Orders)
- Contact information
- Business details
- Address information
- Related records (Contracts, Sales, Tickets)
- Activity timeline
- Notes and tags

## State Management

### Zustand Store (customerStore.ts)

**State Structure**:
```typescript
interface CustomerStore {
  // Data
  customers: Customer[];
  selectedCustomer: Customer | null;
  customerStats: CustomerStats | null;

  // UI State
  filters: CustomerFilters;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  isLoading: boolean;
  error: string | null;

  // Selection
  selectedCustomerIds: string[];

  // Actions
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  removeCustomer: (id: string) => void;
  setFilters: (filters: Partial<CustomerFilters>) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  setStats: (stats: CustomerStats) => void;
  bulkUpdateCustomers: (ids: string[], updates: Partial<Customer>) => void;
}
```

**Selector Hooks**:
- `useCustomers()` - Get customers list
- `useCustomerPagination()` - Get pagination state
- `useCustomerFilters()` - Get current filters
- `useCustomerStats()` - Get statistics
- `useSelectedCustomer()` - Get selected customer
- `useCustomerLoading()` - Get loading state

## API & Hooks

### React Query Hooks (useCustomers.ts)

**Data Fetching**:
```typescript
const useCustomers = (filters?: CustomerFilters) 
  => { data: Customer[]; isLoading: boolean; error: Error | null }

const useCustomer = (id: string) 
  => { data: Customer | null; isLoading: boolean; error: Error | null }

const useCustomerStats = () 
  => { data: CustomerStats | null; isLoading: boolean }

const useRecentCustomers = (limit?: number) 
  => { data: Customer[] }
```

**Mutations**:
```typescript
const useCreateCustomer = () 
  => { mutate: (data: CreateCustomerInput) => Promise<Customer> }

const useUpdateCustomer = () 
  => { mutate: (id: string, data: UpdateCustomerInput) => Promise<Customer> }

const useDeleteCustomer = () 
  => { mutate: (id: string) => Promise<void> }

const useBulkUpdateCustomers = () 
  => { mutate: (ids: string[], updates: Partial<Customer>) => Promise<void> }

const useExportCustomers = (format: 'csv' | 'json') 
  => { mutate: () => Promise<Blob> }
```

### Query Keys

```typescript
const customerKeys = {
  all: ['customers'],
  lists: () => ['customers', 'list'],
  list: (filters: CustomerFilters) => ['customers', 'list', filters],
  details: () => ['customers', 'detail'],
  detail: (id: string) => ['customers', 'detail', id],
  stats: () => ['customers', 'stats'],
  recent: (limit: number) => ['customers', 'recent', limit],
};
```

## Service Layer

### Service Factory Pattern

The customers module uses the Service Factory pattern to route between mock and Supabase implementations:

```typescript
// Import from factory
import { customerService as factoryCustomerService } from '@/services/serviceFactory';

// All operations go through factory
const customers = await factoryCustomerService.getCustomers(filters);
```

**Factory Methods**:
- `getCustomers(filters?: CustomerFilters)` - List with pagination
- `getCustomer(id: string)` - Single customer by ID
- `createCustomer(data: CreateCustomerInput)` - Create new
- `updateCustomer(id: string, data: UpdateCustomerInput)` - Update
- `deleteCustomer(id: string)` - Delete
- `getStats()` - Statistics
- `bulkUpdate(ids: string[], updates: Partial<Customer>)` - Bulk update
- `export(format: 'csv' | 'json')` - Export data

**Implementations**:
- **Mock**: `/src/services/customerService.ts` (VITE_API_MODE=mock)
- **Supabase**: `/src/services/api/supabase/customerService.ts` (VITE_API_MODE=supabase)
- **Factory Router**: `/src/services/serviceFactory.ts`

## Data Types

### Customer Interface

```typescript
interface Customer {
  id: string;
  name: string;
  type: 'individual' | 'business' | 'corporate' | 'government';
  status: 'active' | 'inactive' | 'suspended' | 'prospect';
  
  // Contact Information
  email?: string;
  phone?: string;
  website?: string;
  
  // Business Information
  industry?: string;
  annualRevenue?: number;
  employeeCount?: number;
  
  // Addresses
  billingAddress?: Address;
  shippingAddress?: Address;
  
  // Account
  parentCustomerId?: string;
  accountManager?: string;
  tags?: string[];
  notes?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastInteractionAt?: string;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isPrimary?: boolean;
}

interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  prospect: number;
  byIndustry: Record<string, number>;
  recentCount: number;
  totalLifetimeValue: number;
}

interface CustomerFilters {
  search?: string;
  status?: string;
  type?: string;
  industry?: string;
  accountManager?: string;
  dateRange?: { start: string; end: string };
  page?: number;
  pageSize?: number;
}
```

## Integration Points

### With Sales Module
- Link customers to sales/deals
- Track customer sales history
- Display sales statistics on customer detail

### With Contracts Module
- Associate contracts with customers
- Display active/upcoming contracts

### With Notifications Module
- Send notifications to customers
- Track communication preferences
- Store notification history

### With Dashboard
- Display total customers metric
- Show recent customers list
- Track customer trends

### With Authentication
- Permission checks for actions
- User-specific customer filtering
- Audit logging for compliance

## Role-Based Access Control

```typescript
Required Permissions:
- customers:view - View customer list and details
- customers:create - Create new customers
- customers:update - Edit customer information
- customers:delete - Delete customers
- customers:export - Export customer data
- customers:bulk_update - Perform bulk operations
```

**Feature Visibility**:
```typescript
canViewCustomers: hasPermission('customers:view')
canCreateCustomer: hasPermission('customers:create')
canEditCustomer: hasPermission('customers:update')
canDeleteCustomer: hasPermission('customers:delete')
canExportCustomers: hasPermission('customers:export')
canBulkUpdate: hasPermission('customers:bulk_update')
```

## Common Use Cases

### 1. List All Active Customers

```typescript
import { useCustomers } from '@/modules/features/customers/hooks';

export function ActiveCustomersList() {
  const { data: customers, isLoading } = useCustomers({ 
    status: 'active',
    page: 1,
    pageSize: 50
  });

  return (
    <Table
      dataSource={customers}
      loading={isLoading}
      columns={customerColumns}
    />
  );
}
```

### 2. Create New Customer

```typescript
import { useCreateCustomer } from '@/modules/features/customers/hooks';

export function CreateCustomerForm() {
  const createMutation = useCreateCustomer();

  const handleSubmit = async (values: CreateCustomerInput) => {
    try {
      const newCustomer = await createMutation.mutateAsync(values);
      message.success('Customer created successfully');
    } catch (error) {
      message.error('Failed to create customer');
    }
  };

  return <Form onFinish={handleSubmit} />;
}
```

### 3. Export Customers to CSV

```typescript
import { useExportCustomers } from '@/modules/features/customers/hooks';

export function ExportButton() {
  const exportMutation = useExportCustomers('csv');

  const handleExport = async () => {
    const blob = await exportMutation.mutateAsync();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
  };

  return <Button onClick={handleExport}>Export CSV</Button>;
}
```

## Troubleshooting

### Common Issues

**Issue**: Customer list not loading
- Check VITE_API_MODE environment variable
- Verify factory service is imported correctly
- Check browser console for network errors
- Verify permissions allow viewing customers

**Issue**: Create/Update failing silently
- Check form validation messages
- Verify required fields are populated
- Check mutation error state
- Review service layer error handling

**Issue**: Filters not working
- Verify filter state in store
- Check query key updates
- Confirm API supports filters
- Review React Query cache

**Issue**: Data not updating after operation
- Check mutation success callback
- Verify query invalidation
- Check store update logic
- Review cache strategy

## Performance Optimizations

1. **Memoization**: Components use React.memo to prevent unnecessary re-renders
2. **Query Caching**: React Query caches data with configurable stale times
3. **Lazy Loading**: Routes are code-split for better load performance
4. **Virtual Scrolling**: Large lists use virtual scrolling for performance
5. **Pagination**: Data is fetched in pages rather than all at once
6. **Selector Hooks**: Zustand selectors prevent store re-renders

## Testing

### Unit Tests
```typescript
// Test store selectors
describe('customerStore', () => {
  it('should add customer to list', () => {
    const store = useCustomerStore();
    store.addCustomer(mockCustomer);
    expect(store.customers).toContainEqual(mockCustomer);
  });
});

// Test hooks
describe('useCustomers', () => {
  it('should fetch customers with filters', async () => {
    const { result } = renderHook(() => useCustomers({ status: 'active' }));
    await waitFor(() => expect(result.current.data).toBeDefined());
  });
});
```

### Integration Tests
- Complete CRUD workflows
- Filter and pagination functionality
- Form validation and submission

### E2E Tests
- User workflows from list to detail
- Create/Edit/Delete operations
- Search and filter interactions

## Known Issues & Fixes

Refer to the related fix documentation and troubleshooting guides at:
- `/docs/troubleshooting/COMMON_ERRORS.md`
- `/DOCUMENTATION/06_BUG_FIXES_KNOWN_ISSUES/`

## Related Documentation

- **Service Factory**: `/docs/architecture/SERVICE_FACTORY.md` and `.zencoder/rules/repo.md`
- **Sales Module**: `/src/modules/features/sales/DOC.md`
- **Contracts Module**: `/src/modules/features/contracts/DOC.md`
- **React Query**: `/docs/architecture/REACT_QUERY.md`
- **Zustand**: https://github.com/pmndrs/zustand

---

**Version**: 1.0  
**Last Updated**: 2025-01-15  
**Status**: Production  
**Maintenance**: Updated with each significant feature change
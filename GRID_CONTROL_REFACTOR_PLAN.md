# Grid Control Unification & Side Drawer Implementation Plan

## Overview
Comprehensive refactoring of 5 main modules (Customers, Sales, Contracts, Tickets, JobWorks) to ensure consistent grid controls, unified UI patterns, and side drawer-based CRUD operations.

## Modules to Refactor (Phase Order: Simultaneous)

### 1. **Customers Module**
- **File**: `src/modules/features/customers/views/CustomerListPage.tsx`
- **Current Issues**: Uses basic Card wrapper, no proper filters, navigation-based CRUD
- **Target**: Grid control like Companies page, side drawer panels for create/edit/view

### 2. **Sales Module**
- **File**: `src/modules/features/sales/views/SalesPage.tsx`
- **Current Issues**: Uses modals (TODO), no grid pattern, mixed card styling
- **Target**: Unified grid, side drawer panels with deal/stage management

### 3. **Contracts Module**
- **File**: `src/modules/features/contracts/views/ContractsPage.tsx`
- **Current Issues**: Tabs with TODO modals, Alerts, multiple breakdown cards
- **Target**: Unified grid + tabbed contracts/service contracts, side drawers

### 4. **Tickets Module**
- **File**: `src/modules/features/tickets/views/TicketsPage.tsx`
- **Current Issues**: Mixed cards without Card wrapper, modal TODOs
- **Target**: Proper grid with unified layout, side drawer panels

### 5. **JobWorks Module**
- **File**: `src/modules/features/jobworks/views/JobWorksPage.tsx`
- **Current Issues**: Similar to tickets, no proper grid styling
- **Target**: Unified grid control, side drawer panels

## Unified Grid Control Pattern

### Page Layout Structure (Consistent Across All Modules)

```
PageHeader
├── Title
├── Description
├── Breadcrumbs
└── Action Buttons (Add/Import)

Content Area (padding: 24px)
├── Statistics Cards (4 cols)
│   └── Row gutter=[16, 16], xs=24, sm=12, lg=6
│
├── [Optional] Status/Breakdown Cards (module-specific)
│   └── Row gutter=[16, 16], xs=24, sm=12, lg=6
│
└── Main Data Grid Card
    ├── Search & Filter Section
    │   ├── Search Input
    │   ├── Status/Category Filter
    │   └── Clear Button
    │
    ├── Ant Table
    │   ├── Fixed columns
    │   ├── Sortable columns
    │   ├── Status tags/badges
    │   └── Action buttons (View/Edit)
    │
    └── Pagination
        └── Page size selector

Side Drawer Panels (Right Sidebar)
├── DetailPanel (View mode)
├── FormPanel (Create/Edit mode)
└── [Optional] ResultPanel (for special operations)
```

## Key Implementation Details

### 1. Consistent Grid Control Features

All grid controls must have:
- ✅ **Fixed table header** (sticky)
- ✅ **Sortable columns** (by name, date, status, etc.)
- ✅ **Filterable status** (dropdown with all statuses)
- ✅ **Search functionality** (across name, email, etc.)
- ✅ **Pagination** (with page size selector)
- ✅ **Status badges** (with consistent colors)
- ✅ **Action buttons** (View, Edit, Delete with confirmations)
- ✅ **Empty state** (when no data)
- ✅ **Loading state** (skeleton or spinner)
- ✅ **Row selection** (optional, for bulk operations)

### 2. Side Drawer Panel Pattern

All CRUD operations use side drawers:

```tsx
<Drawer
  title="Customer Details"
  placement="right"
  onClose={() => setSelectedItem(null)}
  width={500}
  footer={
    <Space style={{ float: 'right' }}>
      <Button onClick={() => setSelectedItem(null)}>Cancel</Button>
      <Button type="primary" onClick={handleSave}>Save</Button>
    </Space>
  }
>
  {/* Form or Details Content */}
</Drawer>
```

### 3. Consistent Status Color Scheme

```
Active/Success:   #52c41a (green)
Pending/Warning:  #faad14 (orange)
Error/Closed:     #f5222d (red)
Info/Processing:  #1890ff (blue)
Default/Inactive: #d9d9d9 (gray)
```

## File Structure for Each Module

```
src/modules/features/{module}/
├── views/
│   └── {Module}ListPage.tsx          [REFACTOR]
│
├── components/
│   ├── {Module}List.tsx              [UPDATE TABLE PATTERN]
│   ├── {Module}DetailPanel.tsx       [CREATE - View drawer]
│   ├── {Module}FormPanel.tsx         [CREATE - Edit/Create drawer]
│   └── [Optional] {Module}ResultPanel.tsx
│
├── hooks/
│   ├── use{Module}s.ts               [UPDATE - Add form hooks]
│   └── [Optional] use{Module}Detail.ts
│
├── services/
│   └── {module}Service.ts            [UPDATE - Add CRUD methods]
│
├── types/
│   └── {module}.ts                   [UPDATE - Add form types]
│
└── index.ts                          [EXPORT ALL]
```

## Type System Requirements

### Core Data Types
```typescript
// Base entity
interface {Entity} {
  id: string;
  name: string;
  status: 'active' | 'inactive' | ...;
  created_at: string;
  updated_at: string;
  [other fields]: any;
}

// Filter interface
interface {Entity}Filters {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  [other filters]: any;
}

// Stats interface
interface {Entity}Stats {
  total: number;
  active?: number;
  [status-specific counts]: number;
  [by breakdown]: Record<string, number>;
}

// Form data
interface {Entity}FormData {
  [form fields]: any;
}
```

## Service Layer Pattern

Each service must include:

```typescript
// Queries
getAll(filters: Filters): Promise<PaginatedResponse<Entity>>
getById(id: string): Promise<Entity>
getStats(): Promise<Stats>

// Mutations
create(data: FormData): Promise<Entity>
update(id: string, data: FormData): Promise<Entity>
delete(id: string): Promise<void>

// Special operations (module-specific)
```

## Hook Layer Pattern

Each hook must include:

```typescript
// Data fetching
useEntities(filters): {
  data: PaginatedResponse<Entity>
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

// Entity operations
useCreateEntity(): {
  mutate: (data) => Promise
  isPending: boolean
  error: Error | null
}

useUpdateEntity(): { ... }
useDeleteEntity(): { ... }

// Stats
useEntityStats(): {
  data: Stats
  isLoading: boolean
  error: Error | null
}
```

## Migration Steps for Each Module

### Step 1: Type Definitions
- [ ] Review current types in `src/types/{module}.ts`
- [ ] Add missing types (FormData, Stats, Filters if not present)
- [ ] Ensure all fields are properly typed
- [ ] Export from module index

### Step 2: Service Layer
- [ ] Add/update getAll() method with pagination
- [ ] Add/update create(), update(), delete() methods
- [ ] Add/update getStats() method
- [ ] Add proper error handling
- [ ] Add TODO comments for API integration

### Step 3: Hook Layer
- [ ] Create useEntities() hook for data fetching
- [ ] Create useCreateEntity() hook
- [ ] Create useUpdateEntity() hook
- [ ] Create useDeleteEntity() hook
- [ ] Create useEntityStats() hook
- [ ] Add proper error handling and refetch logic

### Step 4: Component Layer
- [ ] Update {Module}List component with Ant Table pattern
- [ ] Create {Module}DetailPanel drawer component
- [ ] Create {Module}FormPanel drawer component
- [ ] Update page component with state management
- [ ] Add proper loading/error states

### Step 5: Integration
- [ ] Test CRUD operations
- [ ] Test filtering/sorting/pagination
- [ ] Test error handling
- [ ] Test responsive behavior

## Detailed Requirements by Module

### Customers Module
- **Grid columns**: Name, Email, Phone, Industry, Status, Created Date, Actions
- **Filters**: Search (name/email), Status (Active/Inactive/Prospect)
- **Stats**: Total, Active, Prospects, Top Industry
- **Drawer**: View/Edit customer details with form

### Sales Module
- **Grid columns**: Deal Name, Customer, Value, Stage, Owner, Expected Close, Actions
- **Filters**: Search, Stage (Lead/Proposal/Negotiation/Closed), Status
- **Stats**: Total Deals, Total Value, Conversion Rate, Avg Deal Size
- **Breakdown**: Pipeline by Stage (visual cards)
- **Drawer**: View/Edit deal with stage progression

### Contracts Module
- **Tabs**: General Contracts / Service Contracts
- **Grid columns**: Contract Name, Type, Customer, Value, Start Date, End Date, Status, Actions
- **Filters**: Search, Status (Active/Expiring/Expired/Pending)
- **Stats**: Total, Active, Pending Approval, Total Value
- **Alerts**: Expiring Soon, Renewals Due
- **Drawer**: View/Edit contract with lifecycle info

### Tickets Module
- **Grid columns**: Ticket ID, Subject, Customer, Priority, Status, Created Date, Actions
- **Filters**: Search, Status (Open/In Progress/Resolved/Closed)
- **Stats**: Total, Open, Resolved Today, Overdue
- **Breakdown**: Status distribution (optional)
- **Drawer**: View/Edit ticket with resolution notes

### JobWorks Module
- **Grid columns**: Job ID, Title, Assignment, Status, Duration, Value, Actions
- **Filters**: Search, Status (Pending/In Progress/Completed/Cancelled)
- **Stats**: Total, In Progress, Completed This Month, Total Value
- **Breakdown**: Status distribution
- **Drawer**: View/Edit job work with assignment details

## Styling & Theme Consistency

### Card Styling
```tsx
<Card
  style={{
    borderRadius: 8,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  }}
>
```

### Spacing
- Page padding: 24px
- Section margin bottom: 24px
- Card gutter: [16, 16] for responsive spacing

### Colors
- Primary: #1890ff (Ant Design default)
- Success: #52c41a
- Warning: #faad14
- Error: #f5222d

## Testing Checklist

For each module:
- [ ] Grid displays data correctly
- [ ] Search/filter functionality works
- [ ] Pagination works with page size change
- [ ] Create drawer opens and form submits
- [ ] Edit drawer opens with data and updates
- [ ] View drawer shows read-only details
- [ ] Delete confirmation works
- [ ] Status changes reflect immediately
- [ ] Loading states appear correctly
- [ ] Error states display with messages
- [ ] Empty state shows when no data
- [ ] Responsive on mobile (xs breakpoint)
- [ ] Sorting works on columns
- [ ] Breadcrumbs work
- [ ] Stats cards load and update

## Deployment Checklist

- [ ] All modules refactored and tested
- [ ] No console errors or warnings
- [ ] Type safety verified (no 'any' types)
- [ ] API integration TODOs marked clearly
- [ ] Documentation updated
- [ ] Git commit messages descriptive
- [ ] Code review completed
- [ ] Performance verified (no layout shifts)

## Success Metrics

✅ **Unified UI**: All 5 modules have identical grid control layout
✅ **Consistent Patterns**: Same drawer pattern for all CRUD operations
✅ **Type Safety**: 95%+ TypeScript coverage
✅ **Code Reduction**: 30-40% less code due to abstraction
✅ **Maintainability**: Clear separation of concerns (Service → Hook → Component)
✅ **Scalability**: Easy to add new modules following same pattern
✅ **Documentation**: Complete architectural documentation for each module

## Future Enhancements

1. **Reusable DataGrid Component**: Wrap Ant Table with common patterns
2. **Bulk Operations**: Multi-select rows with bulk update/delete
3. **Advanced Filtering**: Complex filter builder
4. **Export/Import**: CSV export and import functionality
5. **Custom Dashboards**: User-configurable dashboard widgets
6. **API Integration**: Replace TODO comments with real API calls

## Timeline Estimate

- **Analysis**: 1-2 hours (COMPLETE)
- **Implementation per module**: 2-3 hours each (10-15 hours total)
- **Testing**: 2-3 hours
- **Documentation**: 1-2 hours
- **Total**: 14-20 hours

## Notes

- All existing services/hooks may need updates - review each carefully
- Ensure backward compatibility with existing routes if applicable
- Test with different data sizes (empty, small, large datasets)
- Verify accessibility (keyboard navigation, screen readers)
- Check mobile responsiveness at all breakpoints
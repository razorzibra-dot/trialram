# Tickets Module - Quick Start Guide

## 🚀 Quick Reference for Developers

Everything you need to know to work with the refactored Tickets module at a glance.

---

## 📂 Module Structure

```
src/modules/features/tickets/
├── components/
│   ├── TicketsDetailPanel.tsx    (View details drawer)
│   ├── TicketsFormPanel.tsx      (Create/edit form drawer)
│   └── TicketsList.tsx           (Legacy - deprecated)
├── hooks/
│   └── useTickets.ts             (React Query hooks)
├── services/
│   └── ticketService.ts          (Business logic)
├── store/
│   └── ticketStore.ts            (Zustand store - legacy)
├── views/
│   ├── TicketsPage.tsx           (Main page - refactored)
│   └── TicketDetailPage.tsx      (Detail page)
├── routes.tsx                     (Route configuration)
└── index.ts                       (Module exports)
```

---

## 🎯 Import Statements

### **Using Components**
```typescript
import { TicketsPage } from '@/modules/features/tickets';
import { TicketsDetailPanel, TicketsFormPanel } from '@/modules/features/tickets';
```

### **Using Hooks**
```typescript
import {
  useTickets,
  useTicket,
  useTicketStats,
  useCreateTicket,
  useUpdateTicket,
  useDeleteTicket,
  useUpdateTicketStatus,
  useBulkTickets,
  useSearchTickets,
  useExportTickets,
} from '@/modules/features/tickets';
```

### **Using Service**
```typescript
import { TicketService } from '@/modules/features/tickets';
```

---

## 🔄 Common Tasks

### **Fetch Tickets**
```typescript
const { data: ticketsData, isLoading, error } = useTickets({
  status: 'open',
  priority: 'high',
  page: 1,
  pageSize: 20,
});

// Access the data
console.log(ticketsData?.data);        // Array of tickets
console.log(ticketsData?.total);       // Total count
console.log(ticketsData?.totalPages);  // Number of pages
```

### **Create Ticket**
```typescript
const createTicket = useCreateTicket();

const handleCreate = async () => {
  try {
    const result = await createTicket.mutateAsync({
      title: 'New Ticket',
      description: 'Ticket description',
      priority: 'high',
      customer_id: '123',
      status: 'open',
      due_date: '2024-02-15',
    });
    console.log('Created:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### **Update Ticket**
```typescript
const updateTicket = useUpdateTicket();

const handleUpdate = async (ticketId: string) => {
  try {
    const result = await updateTicket.mutateAsync({
      id: ticketId,
      data: {
        title: 'Updated Title',
        status: 'in_progress',
        priority: 'urgent',
      },
    });
    console.log('Updated:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### **Delete Ticket**
```typescript
const deleteTicket = useDeleteTicket();

const handleDelete = async (ticketId: string) => {
  try {
    await deleteTicket.mutateAsync(ticketId);
    console.log('Deleted');
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### **Get Statistics**
```typescript
const { data: stats, isLoading } = useTicketStats();

console.log(stats?.total);           // Total tickets
console.log(stats?.openTickets);     // Open count
console.log(stats?.resolvedToday);   // Resolved today
console.log(stats?.overdueTickets);  // Overdue count
console.log(stats?.byStatus);        // Status breakdown
console.log(stats?.byPriority);      // Priority breakdown
```

### **Search Tickets**
```typescript
const { data: results, isLoading } = useTickets({
  search: 'login issue',
});
```

### **Update Status**
```typescript
const updateStatus = useUpdateTicketStatus();

const handleStatusChange = async (ticketId: string, newStatus: string) => {
  await updateStatus.mutateAsync({
    id: ticketId,
    status: newStatus,
  });
};
```

### **Export Tickets**
```typescript
const exportTickets = useExportTickets();

const handleExport = () => {
  exportTickets.mutate('csv'); // or 'json'
};
```

---

## 🎨 Component Usage

### **Display Ticket List**
```typescript
import { TicketsPage } from '@/modules/features/tickets';

export const MyPage = () => {
  return <TicketsPage />;
};
```

### **Show Detail Drawer**
```typescript
const [isOpen, setIsOpen] = useState(false);
const [ticket, setTicket] = useState<Ticket | null>(null);

<TicketsDetailPanel
  ticket={ticket}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onEdit={() => {
    // Switch to edit mode
  }}
/>
```

### **Show Form Drawer**
```typescript
const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | null>(null);
const [ticket, setTicket] = useState<Ticket | null>(null);

<TicketsFormPanel
  ticket={drawerMode === 'edit' ? ticket : null}
  mode={drawerMode === 'create' ? 'create' : 'edit'}
  isOpen={drawerMode !== null}
  onClose={() => setDrawerMode(null)}
/>
```

---

## 📊 Data Types

### **Ticket Interface**
```typescript
interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer_id: string;
  customer_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  category?: string;
  tags?: string[];
  due_date?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  tenant_id: string;
}
```

### **Create Ticket Data**
```typescript
interface CreateTicketData {
  title: string;               // Required
  description: string;         // Required
  priority: string;            // Required
  status?: string;             // Optional, defaults to 'open'
  customer_id: string;         // Required
  assigned_to?: string;        // Optional
  category?: string;           // Optional
  tags?: string[];             // Optional
  due_date?: string;           // Optional (YYYY-MM-DD)
}
```

### **Ticket Filters**
```typescript
interface TicketFilters {
  search?: string;             // Search in title, description, customer
  status?: string;             // Filter by status
  priority?: string;           // Filter by priority
  assignedTo?: string;         // Filter by assignee
  customer?: string;           // Filter by customer
  category?: string;           // Filter by category
  dateRange?: {                // Date range filter
    start: string;
    end: string;
  };
  page?: number;               // Page number (1-based)
  pageSize?: number;           // Items per page
}
```

### **Ticket Stats**
```typescript
interface TicketStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  averageResolutionTime: number;
  openTickets: number;
  resolvedToday: number;
  overdueTickets: number;
  satisfactionScore: number;
  responseTime: {
    average: number;
    target: number;
  };
}
```

---

## 🎯 State Management Pattern

### **Drawer Mode State**
```typescript
type DrawerMode = 'create' | 'edit' | 'view' | null;
const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);

// Open for create
setDrawerMode('create');

// Open for edit
setDrawerMode('edit');

// Open for view
setDrawerMode('view');

// Close
setDrawerMode(null);
```

### **Selected Ticket State**
```typescript
const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

// Set when opening drawer
setSelectedTicket(ticket);

// Clear when closing
setSelectedTicket(null);
```

### **Filter State**
```typescript
const [searchText, setSearchText] = useState('');
const [statusFilter, setStatusFilter] = useState<string | undefined>();
const [priorityFilter, setPriorityFilter] = useState<string | undefined>();

// Apply to useTickets
const { data } = useTickets({
  search: searchText,
  status: statusFilter,
  priority: priorityFilter,
});
```

---

## 🔐 Permission Checks

### **Before Action Buttons**
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { hasPermission } = useAuth();

// Show create button
{hasPermission('tickets:create') && (
  <Button onClick={() => setDrawerMode('create')}>New Ticket</Button>
)}

// Show edit button
{hasPermission('tickets:update') && (
  <Button onClick={() => setDrawerMode('edit')}>Edit</Button>
)}

// Show delete button
{hasPermission('tickets:delete') && (
  <Button onClick={() => handleDelete(ticket.id)}>Delete</Button>
)}
```

---

## ⚡ Performance Tips

### **1. Use Proper Filters**
```typescript
// ✅ Good - Only fetch needed data
const { data } = useTickets({ status: 'open', pageSize: 20 });

// ❌ Bad - Fetches all data then filters
const { data } = useTickets();
const filtered = data?.data.filter(t => t.status === 'open');
```

### **2. Memoize Filtered Data**
```typescript
// ✅ Good - Memoized, re-calculates only when dependencies change
const filteredTickets = useMemo(() => {
  return tickets.filter(t => 
    t.title.includes(searchText) && t.status === status
  );
}, [tickets, searchText, status]);

// ❌ Bad - Re-calculates on every render
const filteredTickets = tickets.filter(t => 
  t.title.includes(searchText) && t.status === status
);
```

### **3. Use React Query Cache**
```typescript
// React Query automatically caches results
// Subsequent identical queries return cached data within stale time
const { data: stats1 } = useTicketStats(); // Fetches from API
const { data: stats2 } = useTicketStats(); // Returns cached data (within 10 min)
```

---

## 🐛 Debugging

### **Check React Query DevTools**
```bash
# Install React Query DevTools
npm install @tanstack/react-query-devtools

# Use in your app
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

### **Log Hook State**
```typescript
const { data, isLoading, error } = useTickets();

console.log('Data:', data);        // Shows fetched data
console.log('Loading:', isLoading); // Shows loading state
console.log('Error:', error);      // Shows any errors
```

### **Check Component Props**
```typescript
console.log('Ticket:', ticket);
console.log('Mode:', drawerMode);
console.log('Permissions:', hasPermission('tickets:create'));
```

---

## 🧪 Testing Examples

### **Test Create Flow**
```typescript
it('should create a ticket', async () => {
  const { result } = renderHook(() => useCreateTicket());
  
  const ticket = await result.current.mutateAsync({
    title: 'Test',
    description: 'Test description',
    priority: 'high',
    customer_id: '123',
  });
  
  expect(ticket.id).toBeDefined();
  expect(ticket.title).toBe('Test');
});
```

### **Test Search**
```typescript
it('should search tickets', async () => {
  const { result } = renderHook(() => useTickets({ search: 'login' }));
  
  await waitFor(() => {
    expect(result.current.data).toBeDefined();
  });
  
  const tickets = result.current.data?.data || [];
  tickets.forEach(t => {
    expect(
      t.title.includes('login') ||
      t.description?.includes('login') ||
      t.customer_name?.includes('login')
    ).toBe(true);
  });
});
```

### **Test Permissions**
```typescript
it('should not show create button without permission', () => {
  const { queryByText } = render(
    <TicketsPage />
  );
  
  // Mock no permission
  jest.spyOn(useAuth, 'useAuth').mockReturnValue({
    hasPermission: () => false,
  });
  
  expect(queryByText('New Ticket')).not.toBeInTheDocument();
});
```

---

## 📋 Common Issues & Solutions

### **Issue: Table not showing data**
```typescript
// ✅ Solution: Check loading state
const { data, isLoading } = useTickets();

if (isLoading) return <LoadingSpinner />;
if (!data?.data?.length) return <EmptyState />;

// Make sure data is being fetched
console.log('Data:', data);
```

### **Issue: Drawer not opening**
```typescript
// ✅ Solution: Check state and props
console.log('Drawer mode:', drawerMode);
console.log('Is open:', drawerMode === 'create');

// Make sure handler is triggered
onClick={() => {
  console.log('Opening drawer');
  setDrawerMode('create');
}}
```

### **Issue: Permissions not working**
```typescript
// ✅ Solution: Check permission context
const { hasPermission } = useAuth();
console.log('Has permission:', hasPermission('tickets:create'));

// Make sure permission scope is correct
// Use 'tickets:create' not just 'create'
```

### **Issue: Form not submitting**
```typescript
// ✅ Solution: Check validation
const { data, error } = createTicket;
console.log('Error:', error);

// Make sure all required fields are filled
// - title
// - description
// - customer_id
// - priority
```

---

## 📚 Additional Resources

### **Documentation**
- [TICKETS_REFACTORING_SUMMARY.md](./TICKETS_REFACTORING_SUMMARY.md) - Complete technical details
- [TICKETS_BEFORE_AFTER.md](./TICKETS_BEFORE_AFTER.md) - Before/after comparison
- [TICKETS_VERIFICATION_CHECKLIST.md](./TICKETS_VERIFICATION_CHECKLIST.md) - Testing guide

### **Related Files**
- `src/modules/features/tickets/services/ticketService.ts` - Service layer
- `src/modules/features/tickets/hooks/useTickets.ts` - React Query hooks
- `src/modules/features/tickets/views/TicketsPage.tsx` - Main page
- `src/modules/features/tickets/components/TicketsDetailPanel.tsx` - Detail drawer
- `src/modules/features/tickets/components/TicketsFormPanel.tsx` - Form drawer

### **Ant Design References**
- [Table Component](https://ant.design/components/table/)
- [Drawer Component](https://ant.design/components/drawer/)
- [Form Component](https://ant.design/components/form/)
- [DatePicker Component](https://ant.design/components/date-picker/)

---

## 🎓 Best Practices

1. **Always check permissions before showing actions**
   ```typescript
   hasPermission('tickets:create') && <CreateButton />
   ```

2. **Use proper error handling**
   ```typescript
   try {
     await createTicket.mutateAsync(data);
   } catch (error) {
     toast.error('Failed to create ticket');
   }
   ```

3. **Memoize filtered data to prevent unnecessary re-renders**
   ```typescript
   const filtered = useMemo(() => filterData(), [data, filters]);
   ```

4. **Load only needed data**
   ```typescript
   // Only fetch current page
   const { data } = useTickets({ page: 1, pageSize: 20 });
   ```

5. **Use proper TypeScript types**
   ```typescript
   const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
   const [mode, setMode] = useState<'create' | 'edit' | 'view' | null>(null);
   ```

---

## 🚀 Getting Started Checklist

- [ ] Read this Quick Start guide
- [ ] Review TICKETS_REFACTORING_SUMMARY.md for architecture
- [ ] Check the component files for implementation details
- [ ] Run npm install and npm run dev
- [ ] Test create, read, update, delete operations
- [ ] Verify permissions are working
- [ ] Check browser console for errors
- [ ] Refer back to this guide as needed

---

## 💡 Pro Tips

1. **Use React Query DevTools to inspect cache**
   ```bash
   Open DevTools, look for React Query tab
   Shows cache, queries, and mutations
   ```

2. **Search component code for comments**
   ```bash
   Every major section has JSDoc comments
   Easy to understand intent and usage
   ```

3. **Check permission scopes**
   ```typescript
   // Correct scopes
   'tickets:create'  // Create new tickets
   'tickets:update'  // Edit tickets
   'tickets:delete'  // Delete tickets
   ```

4. **Use filtering over fetching all data**
   ```typescript
   // Better: Filter on server
   { status: 'open' }
   
   // Worse: Fetch all, filter in UI
   // (wastes bandwidth and performance)
   ```

---

## 🤝 Contributing

When adding features to Tickets module:

1. Follow the established 3-layer pattern
2. Update this Quick Start guide
3. Add comprehensive comments
4. Write tests for new functionality
5. Update verification checklist
6. Document breaking changes

---

## 📞 Questions?

1. Check the code comments
2. Review the before/after comparison
3. Look at similar implementations (Customers module)
4. Check React Query documentation
5. Review Ant Design component docs

---

**Ready to work with the Tickets module? You've got everything you need!** 🚀

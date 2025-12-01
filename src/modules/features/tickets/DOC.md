---
title: Tickets Module
description: Complete documentation for the Tickets module including ticket management, drawer-based CRUD, status tracking, and integration with other modules
lastUpdated: 2025-01-15
relatedModules: [customers, notifications, super-admin]
category: module
status: production
---

# Tickets Module

## Overview

The Tickets module manages customer support tickets, issue tracking, and service requests. It provides a modern drawer-based interface for ticket creation, viewing, and management with comprehensive status tracking, priority levels, and assignment capabilities.

## Module Structure

```
tickets/
├── components/              # Reusable UI components
│   ├── TicketsDetailPanel.tsx   # Side drawer for ticket details (read-only)
│   ├── TicketsFormPanel.tsx     # Side drawer for create/edit
│   └── TicketsList.tsx          # Legacy table component
├── hooks/                   # Custom React hooks
│   ├── useTickets.ts            # React Query hooks for ticket operations
├── services/                # Business logic
│   ├── ticketService.ts         # Service factory-routed service
│   └── index.ts
├── store/                   # State management
│   ├── ticketStore.ts           # Zustand state for tickets
├── views/                   # Page components
│   ├── TicketsPage.tsx          # Main tickets list page
│   └── TicketDetailPage.tsx     # Individual ticket details page
├── index.ts                 # Module entry point
├── routes.tsx               # Route definitions
└── DOC.md                  # This file
```

## Key Features

### 1. Ticket Management
- Create, read, update, and delete tickets
- Multiple ticket types (Bug, Feature Request, Support, Enhancement)
- Status tracking (Open, In Progress, On Hold, Resolved, Closed)
- Priority levels (Critical, High, Medium, Low)
- Assignment to team members

### 2. Ticket Details & Information
- Title and description
- Category/Type classification
- Attached files and references
- Custom fields and metadata
- Timestamps (Created, Updated, Resolved)

### 3. Status & Workflow
- Status transitions with validation
- Resolution tracking
- SLA monitoring
- Escalation management
- Note-taking and internal comments

### 4. Filtering & Search
- Search by ticket ID, title, description
- Filter by status, priority, assignee
- Date range filtering
- Custom column sorting
- Saved search filters

## Architecture

### Component Layer

#### TicketsPage.tsx (Main Page)
- Ant Design Table with 8 columns
- Real-time data display
- Statistics cards (Total, Open, In Progress, Resolved)
- Search bar with real-time filtering
- Column sorting and pagination
- Row actions (View, Edit, Delete)
- Bulk operations support

**Features:**
- 50 rows per page
- Responsive design
- Color-coded status indicators
- Priority badge display
- Assignee avatars

#### TicketsDetailPanel.tsx (Read-Only Drawer)
- Formatted ticket information display
- Sections for ticket details, metadata, history
- Status and priority color-coded tags
- Formatted timestamps
- Edit button to switch to edit mode
- Action buttons (Comment, Resolve, Close)

#### TicketsFormPanel.tsx (Create/Edit Drawer)
- Unified form for create and edit operations
- Fields: Title, Description, Type, Status, Priority, Assignee
- DatePicker components for timeline
- Form validation with Zod
- API mutation integration
- Loading state management
- Error handling and display

### State Management (Zustand)

```typescript
interface TicketStore {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  isLoading: boolean;
  error: string | null;
  
  setTickets: (tickets: Ticket[]) => void;
  setSelectedTicket: (ticket: Ticket | null) => void;
  addTicket: (ticket: Ticket) => void;
  updateTicket: (ticket: Ticket) => void;
  deleteTicket: (id: string) => void;
}
```

### API/Hooks (React Query)

#### useTickets Hook

```typescript
// Get all tickets with filters
const { data: tickets, isLoading } = useTickets(filters);

// Create ticket
const createMutation = useCreateTicket();
await createMutation.mutateAsync(ticketData);

// Update ticket
const updateMutation = useUpdateTicket(ticketId);
await updateMutation.mutateAsync(updates);

// Delete ticket
const deleteMutation = useDeleteTicket(ticketId);
await deleteMutation.mutateAsync();
```

**Query Keys:**
- `['tickets']` - All tickets
- `['tickets', { status, priority, assignee }]` - Filtered tickets
- `['ticket', id]` - Single ticket detail

## Data Types & Interfaces

```typescript
interface Ticket {
  id: string;
  title: string;
  description: string;
  type: 'bug' | 'feature-request' | 'support' | 'enhancement';
  status: 'open' | 'in-progress' | 'on-hold' | 'resolved' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assigneeId: string;
  assigneeName: string;
  customerId: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  notes: string[];
  attachments: string[];
  metadata: Record<string, any>;
}

interface TicketFilter {
  status?: string[];
  priority?: string[];
  assigneeId?: string;
  typeId?: string;
  dateRange?: [Date, Date];
  searchQuery?: string;
}
```

## Integration Points

### 1. Customers Module
- Link tickets to customer records
- Bidirectional relationship
- Customer filter on tickets page

### 2. Notifications Module
- Send notifications when ticket status changes
- Notify assignee of new tickets
- Escalation notifications

### 3. Super Admin
- System monitoring and reporting
- Ticket statistics and analytics
- SLA tracking and alerts

### 4. Service Factory Pattern
The tickets module uses the **Service Factory Pattern** to route between mock and Supabase implementations:

```typescript
// Correct usage - via service factory
import { ticketService as factoryTicketService } from '@/services/serviceFactory';

// All operations route to appropriate backend
const tickets = await factoryTicketService.getTickets(filters);
```

## RBAC & Permissions

```typescript
// Required Permissions
- tickets:view       // View tickets
- crm:support:ticket:create     // Create new tickets
- tickets:edit       // Edit existing tickets
- crm:support:ticket:delete     // Delete tickets
- tickets:assign     // Assign to team members
- tickets:resolve    // Resolve/close tickets

// Role-Based Access
Admin:
  - Can view all tickets
  - Can create/edit/delete own tickets
  - Cannot delete others' tickets
  
Manager:
  - Can view all team tickets
  - Can create/edit/reassign
  - Can resolve tickets
  
Support:
  - Can view assigned tickets only
  - Can update status/notes
```

## Common Use Cases

### 1. Creating a New Ticket

```typescript
const createTicket = async (ticketData: Partial<Ticket>) => {
  const mutation = useCreateTicket();
  try {
    const result = await mutation.mutateAsync({
      title: 'Login button not working',
      description: 'User cannot login with valid credentials',
      type: 'bug',
      status: 'open',
      priority: 'high',
      customerId: 'cust_123',
      assigneeId: 'user_456',
    });
    notification.success('Ticket created successfully');
  } catch (error) {
    notification.error('Failed to create ticket');
  }
};
```

### 2. Updating Ticket Status

```typescript
const updateStatus = async (ticketId: string, newStatus: string) => {
  const mutation = useUpdateTicket(ticketId);
  await mutation.mutateAsync({
    status: newStatus,
    updatedAt: new Date().toISOString(),
  });
};
```

### 3. Filtering Tickets by Status

```typescript
const { data: openTickets } = useTickets({
  status: ['open', 'in-progress'],
  sortBy: 'priority',
  sortOrder: 'desc',
});
```

## Troubleshooting

### Issue: Tickets not loading
**Cause**: Service factory not properly configured  
**Solution**: Verify `VITE_API_MODE` in `.env` and check `serviceFactory.ts` exports

### Issue: Cannot create tickets
**Cause**: Missing permissions or validation errors  
**Solution**: Check RBAC permissions and form validation messages

### Issue: Status transitions not allowed
**Cause**: Invalid workflow state  
**Solution**: Check ticket status enum and workflow rules

### Issue: Assignee dropdown empty
**Cause**: User service not initialized  
**Solution**: Verify users are loaded before rendering form

## Related Documentation

- [Customers Module](../customers/DOC.md)
- [Notifications Module](../notifications/DOC.md)
- [Service Factory Pattern](../../docs/architecture/SERVICE_FACTORY.md)
- [RBAC & Permissions](../../docs/architecture/RBAC_AND_PERMISSIONS.md)

## Version Information

- **Last Updated**: 2025-01-15
- **Module Version**: 1.0.0
- **Production Status**: ✅ Ready
- **Last Refactored**: 2025-01-15
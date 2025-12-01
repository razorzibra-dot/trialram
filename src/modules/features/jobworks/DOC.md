---
title: JobWorks Module
description: Complete documentation for the JobWorks module including job work management, scheduling, resource allocation, and completion tracking
lastUpdated: 2025-01-15
relatedModules: [customers, sales, contracts, notifications]
category: module
status: production
---

# JobWorks Module

## Overview

The JobWorks module manages job work scheduling, resource allocation, progress tracking, and completion verification. It serves as the operational management system for customer service jobs, installation work, maintenance, and other field/office operations.

## Module Structure

```
jobworks/
├── components/              # Reusable UI components
│   ├── JobWorksDetailPanel.tsx   # Side drawer for job details (read-only)
│   ├── JobWorksFormPanel.tsx     # Side drawer for create/edit
│   └── JobWorksList.tsx          # Legacy table component
├── hooks/                   # Custom React hooks
│   ├── useJobWorks.ts           # React Query hooks for job operations
├── services/                # Business logic
│   ├── jobWorksService.ts       # Service factory-routed service
│   └── index.ts
├── store/                   # State management
│   ├── jobWorkStore.ts          # Zustand state for job works
├── views/                   # Page components
│   ├── JobWorksPage.tsx         # Main job works list page
│   └── JobWorkDetailPage.tsx    # Individual job work details
├── index.ts                 # Module entry point
├── routes.tsx               # Route definitions
└── DOC.md                  # This file
```

## Key Features

### 1. Job Work Management
- Create, read, update, and delete job works
- Multiple job types (Installation, Maintenance, Support, Consultation)
- Status tracking (Scheduled, In Progress, Completed, Cancelled)
- Priority levels (Critical, High, Medium, Low)
- Assignment to team members/technicians

### 2. Scheduling & Timeline
- Start and end date scheduling
- Duration tracking and estimation
- Timeline visualization
- Deadline alerts and notifications
- Resource availability checking

### 3. Resource Allocation
- Team member assignment
- Skill-based resource allocation
- Workload balancing
- Availability calendar
- Equipment/material tracking

### 4. Progress Tracking
- Real-time status updates
- Completion percentage
- Work notes and logs
- Time tracking
- Quality checks and approvals

### 5. Filtering & Search
- Search by job ID, customer, description
- Filter by status, priority, assignee
- Date range filtering
- Custom column sorting

## Architecture

### Component Layer

#### JobWorksPage.tsx (Main Page)
- Ant Design Table with 8 columns
- Real-time data display
- Statistics cards (Total, In Progress, Completed, Value)
- Search bar with real-time filtering
- Column sorting and pagination
- Row actions (View, Edit, Delete)
- Status color coding

**Features:**
- 50 rows per page
- Responsive design
- Currency formatting for job value
- Date range display
- Status indicators with colors

#### JobWorksDetailPanel.tsx (Read-Only Drawer)
- Formatted job information display
- Sections: Job Details, Timeline, Resources, Notes
- Status and priority color-coded tags
- Formatted dates and currency
- Team member display
- Completion status indicators
- Edit button to switch to edit mode

#### JobWorksFormPanel.tsx (Create/Edit Drawer)
- Unified form for create and edit operations
- Fields: Title, Description, Type, Status, Priority, Customer, Assignee, Dates
- DatePicker components for timeline
- Multi-select for team members
- Form validation with Zod
- Currency input for job value
- API mutation integration
- Error handling and display

### State Management (Zustand)

```typescript
interface JobWorkStore {
  jobWorks: JobWork[];
  selectedJobWork: JobWork | null;
  isLoading: boolean;
  error: string | null;
  
  setJobWorks: (jobWorks: JobWork[]) => void;
  setSelectedJobWork: (jobWork: JobWork | null) => void;
  addJobWork: (jobWork: JobWork) => void;
  updateJobWork: (jobWork: JobWork) => void;
  deleteJobWork: (id: string) => void;
}
```

### API/Hooks (React Query)

#### useJobWorks Hook

```typescript
// Get all job works with filters
const { data: jobWorks, isLoading } = useJobWorks(filters);

// Create job work
const createMutation = useCreateJobWork();
await createMutation.mutateAsync(jobWorkData);

// Update job work
const updateMutation = useUpdateJobWork(jobWorkId);
await updateMutation.mutateAsync(updates);

// Delete job work
const deleteMutation = useDeleteJobWork(jobWorkId);
await deleteMutation.mutateAsync();

// Get statistics
const { data: stats } = useJobWorkStats();
```

**Query Keys:**
- `['jobWorks']` - All job works
- `['jobWorks', { status, priority }]` - Filtered job works
- `['jobWork', id]` - Single job work detail
- `['jobWorkStats']` - Statistics

## Data Types & Interfaces

```typescript
interface JobWork {
  id: string;
  title: string;
  description: string;
  type: 'installation' | 'maintenance' | 'support' | 'consultation';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'critical' | 'high' | 'medium' | 'low';
  customerId: string;
  customerName: string;
  assignedTo: string[];  // Team member IDs
  teamMembers: TeamMember[];
  startDate: string;
  endDate: string;
  estimatedValue: number;
  actualValue?: number;
  completionPercentage: number;
  notes: string[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface JobWorkFilter {
  status?: string[];
  priority?: string[];
  assigneeId?: string;
  customerId?: string;
  dateRange?: [Date, Date];
  searchQuery?: string;
}

interface JobWorkStats {
  total: number;
  inProgress: number;
  completed: number;
  totalValue: number;
}
```

## Integration Points

### 1. Customers Module
- Link job works to customer records
- Customer information display
- Customer filter on job works page

### 2. Sales Module
- Link to sales deals/orders
- Convert to service contracts
- Revenue tracking

### 3. Contracts Module
- Service contract management
- Contract fulfillment tracking

### 4. Notifications Module
- Send notifications for job updates
- Notify team members of assignments
- Completion alerts to customers

### 5. Service Factory Pattern
```typescript
// Correct usage - via service factory
import { jobWorkService as factoryJobWorkService } from '@/services/serviceFactory';

// All operations route to appropriate backend
const jobWorks = await factoryJobWorkService.getJobWorks(filters);
```

## RBAC & Permissions

```typescript
// Required Permissions
- jobworks:view       // View job works
- crm:project:record:create     // Create new job works
- jobworks:edit       // Edit existing job works
- crm:project:record:delete     // Delete job works
- jobworks:assign     // Assign to team members
- jobworks:complete   // Mark as completed

// Role-Based Access
Admin:
  - Can view all job works
  - Can create/edit/delete
  - Can assign to any team member
  
Manager:
  - Can view team job works
  - Can create/edit/reassign
  - Can complete job works
  
Technician:
  - Can view assigned job works only
  - Can update status/progress
  - Can add notes
```

## Common Use Cases

### 1. Creating a New Job Work

```typescript
const createJobWork = async (jobData: Partial<JobWork>) => {
  const mutation = useCreateJobWork();
  try {
    const result = await mutation.mutateAsync({
      title: 'Installation - Server Setup',
      description: 'Install and configure new server at customer site',
      type: 'installation',
      status: 'scheduled',
      priority: 'high',
      customerId: 'cust_123',
      assignedTo: ['user_456', 'user_789'],
      startDate: '2025-01-20T09:00:00Z',
      endDate: '2025-01-20T17:00:00Z',
      estimatedValue: 5000,
    });
    notification.success('Job work created successfully');
  } catch (error) {
    notification.error('Failed to create job work');
  }
};
```

### 2. Updating Progress

```typescript
const updateProgress = async (jobWorkId: string, percentage: number) => {
  const mutation = useUpdateJobWork(jobWorkId);
  await mutation.mutateAsync({
    completionPercentage: percentage,
    updatedAt: new Date().toISOString(),
  });
};
```

### 3. Filtering Job Works by Status

```typescript
const { data: activeJobs } = useJobWorks({
  status: ['scheduled', 'in-progress'],
  sortBy: 'startDate',
  sortOrder: 'asc',
});
```

### 4. Getting Statistics

```typescript
const { data: stats, isLoading } = useJobWorkStats();
// { total: 45, inProgress: 12, completed: 28, totalValue: 125000 }
```

## Troubleshooting

### Issue: Job works not loading
**Cause**: Service factory not properly configured  
**Solution**: Verify `VITE_API_MODE` in `.env` and check `serviceFactory.ts`

### Issue: Cannot assign team members
**Cause**: Team members not loaded or permissions missing  
**Solution**: Check user service initialization and RBAC permissions

### Issue: Date validation errors
**Cause**: End date before start date  
**Solution**: Ensure startDate < endDate in form validation

### Issue: Statistics card showing incorrect values
**Cause**: Query cache not updated  
**Solution**: Invalidate cache after mutations

## Related Documentation

- [Customers Module](../customers/DOC.md)
- [Sales Module](../sales/DOC.md)
- [Contracts Module](../contracts/DOC.md)
- [Service Factory Pattern](../../docs/architecture/SERVICE_FACTORY.md)

## Version Information

- **Last Updated**: 2025-01-15
- **Module Version**: 1.0.0
- **Production Status**: ✅ Ready
- **Last Refactored**: 2025-01-15
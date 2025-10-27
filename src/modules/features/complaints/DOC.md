---
title: Complaints Module
description: Complete documentation for the Complaints module including complaint registration, investigation tracking, resolution management, and customer satisfaction
lastUpdated: 2025-01-15
relatedModules: [customers, tickets, notifications, audit-logs]
category: module
status: production
---

# Complaints Module

## Overview

The Complaints module manages customer complaints, grievances, and issues. It provides a structured process for complaint registration, investigation, resolution, and closure with customer satisfaction tracking and compliance reporting.

## Module Structure

```
complaints/
├── components/              # Reusable UI components
│   ├── ComplaintDetailPanel.tsx      # Side drawer for complaint details
│   ├── ComplaintFormPanel.tsx        # Side drawer for create/edit
│   ├── ComplaintsList.tsx            # Complaints list component
│   └── ResolutionPanel.tsx           # Resolution tracking drawer
├── hooks/                   # Custom React hooks
│   ├── useComplaints.ts              # React Query hooks
├── services/                # Business logic
│   ├── complaintService.ts           # Service factory-routed service
│   └── index.ts
├── store/                   # State management
│   ├── complaintStore.ts             # Zustand state
├── views/                   # Page components
│   ├── ComplaintsPage.tsx            # Main complaints page
│   ├── ComplaintDetailPage.tsx       # Individual complaint details
│   └── ComplaintReportsPage.tsx      # Complaint analytics
├── index.ts                 # Module entry point
├── routes.tsx               # Route definitions
└── DOC.md                  # This file
```

## Key Features

### 1. Complaint Management
- Register customer complaints
- Multiple complaint categories
- Severity/Priority levels
- Complaint tracking number
- Status management (Open, Investigating, Resolved, Closed)
- Reopening capability

### 2. Investigation Process
- Assign to investigation team
- Add investigation notes
- Document findings
- Evidence collection
- Timeline tracking

### 3. Resolution Management
- Proposed resolution
- Resolution approval workflow
- Compensation/remediation tracking
- Implementation verification
- Closure confirmation

### 4. Customer Satisfaction
- Post-resolution survey
- Satisfaction rating (1-5)
- Feedback capture
- Customer communication

### 5. Compliance & Reporting
- Complaint analytics
- Category-wise breakdowns
- Response time metrics
- Resolution rate tracking
- Regulatory compliance reports

## Architecture

### Component Layer

#### ComplaintsPage.tsx
- Ant Design Table with complaints list
- Columns: Complaint #, Customer, Category, Severity, Status, Date, Resolution Date, Satisfaction, Actions
- Search by complaint ID, customer, description
- Filter by status, category, severity, date range
- Create complaint button
- Pagination: 50 complaints per page

#### ComplaintDetailPanel.tsx
- Complaint information display
- Customer details
- Complaint description and category
- Severity and priority
- Investigation status
- Proposed resolution
- Customer satisfaction rating
- Edit button

#### ComplaintFormPanel.tsx
- Create/Edit complaint form
- Customer selection
- Complaint title and description
- Category dropdown
- Severity/Priority selection
- Attachments upload
- Form validation

#### ResolutionPanel.tsx
- Investigation notes area
- Proposed resolution details
- Approval workflow
- Satisfaction survey
- Closure confirmation

### State Management (Zustand)

```typescript
interface ComplaintStore {
  complaints: Complaint[];
  selectedComplaint: Complaint | null;
  isLoading: boolean;
  error: string | null;
  
  setComplaints: (complaints: Complaint[]) => void;
  setSelectedComplaint: (complaint: Complaint | null) => void;
  addComplaint: (complaint: Complaint) => void;
  updateComplaint: (complaint: Complaint) => void;
  deleteComplaint: (id: string) => void;
}
```

### API/Hooks (React Query)

```typescript
// Get all complaints
const { data: complaints } = useComplaints(filters);

// Get single complaint
const { data: complaint } = useComplaint(complaintId);

// Create complaint
const createMutation = useCreateComplaint();
await createMutation.mutateAsync(complaintData);

// Update complaint
const updateMutation = useUpdateComplaint(complaintId);
await updateMutation.mutateAsync(updates);

// Get statistics
const { data: stats } = useComplaintStats();
```

## Data Types & Interfaces

```typescript
interface Complaint {
  id: string;
  complaintNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  // Complaint Details
  title: string;
  description: string;
  category: 'product' | 'service' | 'delivery' | 'billing' | 'quality' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  
  // Status Management
  status: 'open' | 'investigating' | 'resolved' | 'closed' | 'reopened';
  createdAt: string;
  updatedAt: string;
  
  // Investigation
  investigatedBy?: string;
  investigationNotes?: string[];
  investigationStartDate?: string;
  investigationEndDate?: string;
  
  // Resolution
  proposedResolution?: string;
  approvedBy?: string;
  approvalDate?: string;
  compensationAmount?: number;
  compensationType?: 'refund' | 'replacement' | 'credit' | 'discount';
  
  // Customer Satisfaction
  satisfactionRating?: number;  // 1-5
  satisfactionFeedback?: string;
  satisfactionDate?: string;
  
  // Attachments & References
  attachments?: string[];
  relatedTicketId?: string;
  relatedOrderId?: string;
  
  // Metadata
  tags?: string[];
  isEscalated: boolean;
}

interface ComplaintFilter {
  status?: string[];
  category?: string[];
  severity?: string[];
  customerId?: string;
  dateRange?: [Date, Date];
  searchQuery?: string;
}

interface ComplaintStats {
  totalComplaints: number;
  openComplaints: number;
  averageResolutionDays: number;
  customerSatisfactionScore: number;
  resolutionRate: number;
}
```

## Integration Points

### 1. Customers Module
- Customer association
- Customer history
- Customer communication

### 2. Tickets Module
- Link complaints to support tickets
- Track resolution across systems

### 3. Notifications Module
- Complaint registration notification
- Status change alerts
- Customer satisfaction survey invitations
- Escalation alerts

### 4. Audit Logs
- Track complaint changes
- Investigation audit trail
- Approval tracking

## RBAC & Permissions

```typescript
// Required Permissions
- complaints:view         // View complaints
- complaints:create       // Register complaints
- complaints:investigate  // Investigate complaints
- complaints:resolve      // Propose/approve resolution
- complaints:close        // Close complaints
- complaints:report       // Generate reports

// Role-Based Access
Admin/Manager:
  - Full access to all operations
  
Investigator:
  - Can view assigned complaints
  - Can add investigation notes
  - Can propose resolution
  
Customer Service:
  - Can view all complaints
  - Can register new complaints
  - Cannot modify existing complaints
  
Customer:
  - Can view own complaints only
  - Can provide feedback after resolution
```

## Common Use Cases

### 1. Registering a Complaint

```typescript
const registerComplaint = async (complaintData: Partial<Complaint>) => {
  const mutation = useCreateComplaint();
  try {
    const result = await mutation.mutateAsync({
      customerId: 'cust_123',
      title: 'Product damaged on delivery',
      description: 'The product arrived with a dent and scratch',
      category: 'delivery',
      severity: 'high',
      status: 'open',
    });
    notificationService.success('Complaint registered successfully');
    notification.info(`Complaint Number: ${result.complaintNumber}`);
  } catch (error) {
    notificationService.error('Failed to register complaint');
  }
};
```

### 2. Investigating Complaint

```typescript
const investigateComplaint = async (complaintId: string, notes: string) => {
  const mutation = useUpdateComplaint(complaintId);
  await mutation.mutateAsync({
    status: 'investigating',
    investigatedBy: 'user_123',
    investigationStartDate: new Date().toISOString(),
    investigationNotes: [notes],
  });
};
```

### 3. Resolving Complaint

```typescript
const resolveComplaint = async (
  complaintId: string,
  resolution: string,
  compensationType: string,
  amount: number
) => {
  const mutation = useUpdateComplaint(complaintId);
  await mutation.mutateAsync({
    status: 'resolved',
    proposedResolution: resolution,
    compensationType,
    compensationAmount: amount,
    approvedBy: 'user_456',
    approvalDate: new Date().toISOString(),
  });
};
```

### 4. Getting Complaint Statistics

```typescript
const { data: stats } = useComplaintStats();
console.log(`Total: ${stats.totalComplaints}`);
console.log(`Open: ${stats.openComplaints}`);
console.log(`Avg Resolution: ${stats.averageResolutionDays} days`);
console.log(`Satisfaction: ${stats.customerSatisfactionScore}/5`);
```

## Troubleshooting

### Issue: Complaints not loading
**Cause**: Service factory not configured  
**Solution**: Verify `VITE_API_MODE` and service in factory

### Issue: Cannot create complaint
**Cause**: Validation or permission error  
**Solution**: Verify form data and RBAC permissions

### Issue: Investigation notes not saving
**Cause**: API mutation error  
**Solution**: Check network connection and API response

### Issue: Satisfaction survey not appearing
**Cause**: Status not set to resolved  
**Solution**: Ensure complaint is marked as resolved first

## Related Documentation

- [Customers Module](../customers/DOC.md)
- [Tickets Module](../tickets/DOC.md)
- [Customer Service Best Practices](../../docs/architecture/CUSTOMER_SERVICE.md)

## Version Information

- **Last Updated**: 2025-01-15
- **Module Version**: 1.0.0
- **Production Status**: ✅ Ready
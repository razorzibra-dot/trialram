---
title: Audit Logs Module
description: Complete documentation for the Audit Logs module including activity tracking, audit trails, compliance reporting, and system monitoring
lastUpdated: 2025-01-15
relatedModules: [user-management, super-admin, notifications]
category: module
status: production
---

# Audit Logs Module

## Overview

The Audit Logs module provides comprehensive audit trail functionality for tracking all system activities, user actions, data changes, and administrative operations. It ensures compliance, security, and accountability through detailed logging and reporting capabilities.

## Module Structure

```
audit-logs/
├── components/              # Reusable UI components
│   ├── AuditLogDetailPanel.tsx      # Side drawer for log details
│   ├── AuditLogsFilterPanel.tsx     # Advanced filter controls
│   └── AuditLogsList.tsx            # Logs list component
├── hooks/                   # Custom React hooks
│   ├── useAuditLogs.ts              # React Query hooks
├── services/                # Business logic
│   ├── auditLogService.ts           # Service factory-routed service
│   └── index.ts
├── store/                   # State management
│   ├── auditLogStore.ts             # Zustand state
├── views/                   # Page components
│   ├── AuditLogsPage.tsx            # Main audit logs page
│   └── AuditReportPage.tsx          # Report generation page
├── index.ts                 # Module entry point
├── routes.tsx               # Route definitions
└── DOC.md                  # This file
```

## Key Features

### 1. Activity Tracking
- Log all user actions
- Track data changes
- Record administrative operations
- Timestamp all events
- Store user agent and IP information

### 2. Search & Filtering
- Search by user, action, resource
- Filter by date range
- Filter by action type
- Filter by resource type
- Filter by user role

### 3. Compliance Reporting
- Generate compliance reports
- Data retention policies
- Export audit logs
- Regulatory compliance (GDPR, SOX, etc.)
- Access control audit reports

### 4. System Monitoring
- Real-time activity monitoring
- Suspicious activity detection
- Failed login tracking
- Permission change monitoring
- Data access audit

### 5. Alerts & Notifications
- Critical action alerts
- Security alerts
- Compliance alerts
- Scheduled reports

## Architecture

### Component Layer

#### AuditLogsPage.tsx
- Ant Design Table with audit log list
- Columns: Timestamp, User, Action, Resource, Status, Details, IP Address
- Advanced filter panel
- Search functionality
- Export to CSV button
- Pagination: 100 logs per page
- Real-time updates

#### AuditLogDetailPanel.tsx
- Full log detail view
- User information
- Action details
- Before/After values for changes
- IP address and user agent
- Timestamp
- Related records link

#### AuditLogsFilterPanel.tsx
- Date range picker
- User filter (dropdown with search)
- Action type filter (multi-select)
- Resource type filter (multi-select)
- Status filter
- Advanced filters (IP range, etc.)

#### AuditReportPage.tsx
- Report builder
- Pre-built report templates
- Custom report generation
- Report scheduling
- Export options (PDF, Excel, CSV)

### State Management (Zustand)

```typescript
interface AuditLogStore {
  logs: AuditLog[];
  filters: AuditLogFilter;
  isLoading: boolean;
  error: string | null;
  
  setLogs: (logs: AuditLog[]) => void;
  setFilters: (filters: AuditLogFilter) => void;
  addLog: (log: AuditLog) => void;
}
```

### API/Hooks (React Query)

```typescript
// Get audit logs
const { data: logs, isLoading } = useAuditLogs(filters);

// Get log detail
const { data: logDetail } = useAuditLog(logId);

// Get action statistics
const { data: stats } = useAuditLogStats(dateRange);

// Export logs
const exportMutation = useExportAuditLogs();
await exportMutation.mutateAsync({ format: 'csv' });
```

## Data Types & Interfaces

```typescript
interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;  // 'create', 'update', 'delete', 'view', 'export', etc.
  actionType: 'data-modification' | 'access' | 'authentication' | 'configuration' | 'administrative';
  resource: string;  // e.g., 'Customer', 'Order', 'User', 'Role'
  resourceId: string;
  resourceName: string;
  
  // Changes tracking
  changeDetails?: {
    field: string;
    oldValue?: any;
    newValue?: any;
  }[];
  
  // Network info
  ipAddress: string;
  userAgent: string;
  
  // Status
  status: 'success' | 'failure' | 'partial';
  errorMessage?: string;
  
  // Metadata
  tenantId: string;
  timestamp: string;
  duration?: number;  // in milliseconds
}

interface AuditLogFilter {
  dateRange?: [Date, Date];
  userId?: string[];
  action?: string[];
  resource?: string[];
  status?: 'success' | 'failure' | 'partial';
  searchQuery?: string;
}

interface AuditLogReport {
  id: string;
  name: string;
  description: string;
  filters: AuditLogFilter;
  generatedAt: string;
  generatedBy: string;
  format: 'pdf' | 'excel' | 'csv';
  fileUrl: string;
}
```

## Captured Actions

### Authentication Events
- User login (success/failure)
- User logout
- Password change
- Session timeout

### Data Management
- Create customer, order, ticket
- Update customer, order, ticket
- Delete customer, order, ticket
- Bulk operations
- Data export

### Administrative
- User creation/deletion
- Role creation/modification
- Permission changes
- Configuration changes
- System settings updates

### Access Control
- View sensitive data
- Access audit logs
- View reports
- Permission-denied actions

## Integration Points

### 1. User Management
- User action tracking
- Permission change logs
- Role change logs

### 2. Super Admin
- System monitoring
- Compliance reporting
- Security audits

### 3. Notifications
- Alert on critical actions
- Scheduled log summaries

## RBAC & Permissions

```typescript
// Required Permissions
- audit-logs:view           // View audit logs
- audit-logs:export         // Export logs
- audit-logs:generate-report  // Generate reports
- audit-logs:delete         // Delete old logs (retention policy)

// Role-Based Access
Super Admin:
  - Full access to all audit logs
  - Can delete old logs
  
Admin:
  - Can view all audit logs
  - Can generate reports
  
User:
  - Can view own audit logs only
```

## Common Use Cases

### 1. Tracking User Activities

```typescript
const { data: userLogs } = useAuditLogs({
  userId: 'user_123',
  dateRange: [new Date(2025, 0, 1), new Date()],
});
```

### 2. Finding Data Changes

```typescript
const { data: changeLogs } = useAuditLogs({
  action: 'update',
  resource: 'Customer',
  resourceId: 'cust_123',
});
```

### 3. Generating Compliance Report

```typescript
const generateComplianceReport = async (period: 'monthly' | 'quarterly' | 'annual') => {
  const startDate = getStartDateForPeriod(period);
  const endDate = new Date();
  
  const { data: logs } = await useAuditLogs({
    dateRange: [startDate, endDate],
  });
  
  // Filter for sensitive actions
  const sensitiveActions = logs.filter(log => 
    ['delete', 'update', 'export'].includes(log.action)
  );
  
  return generatePDFReport(sensitiveActions);
};
```

### 4. Security Audit

```typescript
const checkSecurityIncidents = async () => {
  const { data: failedLogins } = useAuditLogs({
    action: 'login',
    status: 'failure',
    dateRange: [new Date(Date.now() - 24*60*60*1000), new Date()],
  });
  
  // Alert if too many failed logins from same IP
  const ipGroups = groupBy(failedLogins, 'ipAddress');
  Object.entries(ipGroups).forEach(([ip, logs]) => {
    if (logs.length > 5) {
      notificationService.error({
        message: 'Suspicious Activity Detected',
        description: `${logs.length} failed login attempts from IP ${ip}`,
      });
    }
  });
};
```

## Troubleshooting

### Issue: Audit logs not showing
**Cause**: Service not configured or logging not enabled  
**Solution**: Verify audit log service in factory and check system logging configuration

### Issue: Performance degradation with large log volume
**Cause**: Too many logs in database  
**Solution**: Implement retention policy and archive old logs

### Issue: Export not working
**Cause**: Export service not initialized  
**Solution**: Verify export mutation and check file system permissions

### Issue: User information missing in logs
**Cause**: User service not accessible during logging  
**Solution**: Ensure user context is captured in session

## Related Documentation

- [User Management Module](../user-management/DOC.md)
- [Super Admin Module](../super-admin/DOC.md)
- [Compliance & Audit Guide](../../docs/architecture/COMPLIANCE_AUDIT.md)

## Version Information

- **Last Updated**: 2025-01-15
- **Module Version**: 1.0.0
- **Production Status**: ✅ Ready
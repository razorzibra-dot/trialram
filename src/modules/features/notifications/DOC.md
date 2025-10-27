---
title: Notifications Module
description: Complete documentation for the Notifications module including notification management, preferences, service factory integration, and multi-backend support
lastUpdated: 2025-01-15
relatedModules: [customers, sales, tickets, user-management]
category: module
status: production
---

# Notifications Module

## Overview

The Notifications module manages user notifications, notification preferences, and delivery channels. It supports both data notifications (for managing notification records) and UI notifications (for displaying alerts), with full support for mock, real, and Supabase backends through the Service Factory Pattern.

## Module Structure

```
notifications/
├── components/              # Reusable UI components
│   ├── NotificationDetailPanel.tsx    # Side drawer for notification details
│   ├── NotificationPreferencesPanel.tsx # User preferences drawer
│   └── NotificationsList.tsx          # Notifications list component
├── hooks/                   # Custom React hooks
│   ├── useNotifications.ts           # React Query hooks
├── services/                # Business logic
│   ├── notificationService.ts        # Data service (mock)
│   └── uiNotificationService.ts      # UI notification display
├── store/                   # State management
│   ├── notificationStore.ts          # Zustand state
├── views/                   # Page components
│   ├── NotificationsPage.tsx         # Main notifications page
│   └── NotificationPreferencesPage.tsx
├── index.ts                 # Module entry point
├── routes.tsx               # Route definitions
└── DOC.md                  # This file
```

## Key Features

### 1. Notification Management
- Create, read, update, and delete notifications
- Multiple notification types (Alert, Info, Warning, Error, Success)
- Notification categories (System, Customer, Order, User)
- Read/Unread status tracking
- Notification archival

### 2. Notification Preferences
- User preference management
- Notification delivery channels (Email, SMS, In-App, Push)
- Channel enable/disable toggle
- Frequency settings (Real-time, Daily, Weekly, Never)
- Category-specific preferences

### 3. Multi-Backend Support
- **Mock Service** (Development): `src/services/notificationService.ts`
- **Supabase Service** (Production): `src/services/api/supabase/notificationService.ts`
- **Service Factory**: Routes based on `VITE_API_MODE` environment variable

### 4. Real-Time Features
- WebSocket subscription support
- Real-time notification updates
- Unread count tracking
- Live notification statistics

### 5. Filtering & Search
- Search by notification title/content
- Filter by type, category, read status
- Date range filtering
- Custom sorting

## Architecture

### Component Layer

#### NotificationsPage.tsx (Main Page)
- Ant Design Table with notification list
- Statistics: Total, Unread, Archived
- Search and filter functionality
- Sort by date, type, priority
- Notification actions (Mark as Read, Archive, Delete)
- Pagination support

#### NotificationDetailPanel.tsx (Detail Drawer)
- Read-only notification view
- Formatted timestamp
- Full notification content
- Type and category badges
- Action buttons (Mark as Read, Reply, Archive)
- Related items link

#### NotificationPreferencesPanel.tsx (Preferences)
- Channel selection (Email, SMS, In-App, Push)
- Frequency settings per channel
- Category-specific toggles
- Save/Cancel buttons
- Validation and error handling

### State Management (Zustand)

```typescript
interface NotificationStore {
  notifications: Notification[];
  preferences: NotificationPreferences;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  setNotifications: (notifications: Notification[]) => void;
  setPreferences: (preferences: NotificationPreferences) => void;
  setUnreadCount: (count: number) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
}
```

### API/Hooks (React Query)

#### useNotifications Hook

```typescript
// Get all notifications
const { data: notifications, isLoading } = useNotifications(filters);

// Get unread count
const { data: unreadCount } = useNotificationCount();

// Get preferences
const { data: preferences } = useNotificationPreferences();

// Mark notification as read
const readMutation = useMarkNotificationAsRead();
await readMutation.mutateAsync(notificationId);

// Update preferences
const prefMutation = useUpdateNotificationPreferences();
await prefMutation.mutateAsync(preferences);
```

**Query Keys:**
- `['notifications']` - All notifications
- `['notifications', { status, category }]` - Filtered
- `['notificationCount']` - Unread count
- `['notificationPreferences']` - User preferences

## Data Types & Interfaces

```typescript
interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'alert' | 'info' | 'warning' | 'error' | 'success';
  category: 'system' | 'customer' | 'order' | 'user';
  isRead: boolean;
  isArchived: boolean;
  actionUrl?: string;
  metadata: Record<string, any>;
  createdAt: string;
  readAt?: string;
  archivedAt?: string;
}

interface NotificationPreferences {
  userId: string;
  channels: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    push: boolean;
  };
  frequency: {
    email: 'realtime' | 'daily' | 'weekly' | 'never';
    sms: 'realtime' | 'critical-only' | 'never';
    inApp: 'realtime' | 'summary' | 'never';
  };
  categories: Record<string, boolean>;
  muteUntil?: string;
}

interface NotificationFilter {
  status?: 'unread' | 'read' | 'all';
  category?: string[];
  type?: string[];
  dateRange?: [Date, Date];
  searchQuery?: string;
}
```

## Service Factory Integration

### Critical Setup

**Problem**: NotificationsPage was importing from the wrong service:
```typescript
// WRONG - This is the UI notification service, not data service!
import { notificationService } from '@/services/notificationService';
```

**Solution**: Use Service Factory for all data operations:
```typescript
// CORRECT - Import from factory
import { notificationService as factoryNotificationService } from '@/services/serviceFactory';

// All operations route to appropriate backend
const notifications = await factoryNotificationService.getNotifications(filters);
const preferences = await factoryNotificationService.getNotificationPreferences();
```

### Service Layer

**Data Notification Service** (`src/services/notificationService.ts`):
- Mock notification data
- Mock preferences
- All required methods for CRUD operations

**UI Notification Service** (`src/services/uiNotificationService.ts`):
- Displays toasts and alerts
- Methods: `success()`, `error()`, `warning()`, `info()`
- Used for showing feedback to user actions

**Service Factory** (`src/services/serviceFactory.ts`):
```typescript
export const notificationService = {
  getNotifications: () => getNotificationService().getNotifications(),
  getNotificationPreferences: () => getNotificationService().getNotificationPreferences(),
  updateNotificationPreferences: (prefs) => getNotificationService().updateNotificationPreferences(prefs),
  markAsRead: (id) => getNotificationService().markAsRead(id),
  // ... more methods
};
```

## Integration Points

### 1. Customers Module
- Notify on customer updates
- Customer action notifications

### 2. Sales Module
- Deal/pipeline notifications
- Order confirmation notifications
- Stage change alerts

### 3. Tickets Module
- Ticket assignment notifications
- Status change alerts
- Escalation notifications

### 4. User Management
- User role change notifications
- Permission update alerts

## RBAC & Permissions

```typescript
// Required Permissions
- notifications:view         // View own notifications
- notifications:manage       // Manage preferences
- notifications:archive      // Archive notifications
- notifications:delete       // Delete notifications
- notifications:send         // Send notifications (admin only)

// Role-Based Access
User:
  - Can view own notifications
  - Can update own preferences
  - Can archive/delete own notifications
  
Admin:
  - Can send notifications
  - Can view all notifications (audit)
  - Can manage notification settings
```

## Common Use Cases

### 1. Getting User Notifications

```typescript
const { data: notifications } = useNotifications({
  status: 'unread',
  sortBy: 'createdAt',
  sortOrder: 'desc',
});
```

### 2. Updating Preferences

```typescript
const updatePreferences = async () => {
  const mutation = useUpdateNotificationPreferences();
  await mutation.mutateAsync({
    channels: {
      email: true,
      sms: false,
      inApp: true,
      push: true,
    },
    frequency: {
      email: 'daily',
      sms: 'critical-only',
      inApp: 'realtime',
    },
  });
};
```

### 3. Marking Notifications as Read

```typescript
const markAsRead = async (notificationIds: string[]) => {
  const mutation = useMarkNotificationAsRead();
  for (const id of notificationIds) {
    await mutation.mutateAsync(id);
  }
};
```

### 4. Displaying UI Notifications

```typescript
import { uiNotificationService } from '@/services/uiNotificationService';

// Show success toast
uiNotificationService.success({
  message: 'Notification sent successfully',
  duration: 3,
});

// Show error toast
uiNotificationService.error({
  message: 'Failed to send notification',
  description: 'Please try again',
});
```

## Troubleshooting

### Issue: "notificationService.getNotifications is not a function"
**Cause**: Importing from wrong service file  
**Solution**: Import from `serviceFactory` instead: `import { notificationService as factoryNotificationService } from '@/services/serviceFactory'`

### Issue: Notifications not loading
**Cause**: Service factory not properly configured  
**Solution**: Verify `VITE_API_MODE` and mock service exports

### Issue: Preferences not persisting
**Cause**: Mutation error or validation failure  
**Solution**: Check error message and validate preference object structure

### Issue: Real-time updates not working
**Cause**: WebSocket subscription not initialized  
**Solution**: Verify user is authenticated and subscription hook is called

## Related Documentation

- [Customers Module](../customers/DOC.md)
- [Sales Module](../sales/DOC.md)
- [Service Factory Pattern](../../docs/architecture/SERVICE_FACTORY.md)
- [UI Notification Service](../../docs/architecture/UI_NOTIFICATIONS.md)

## Version Information

- **Last Updated**: 2025-01-15
- **Module Version**: 1.0.0
- **Production Status**: ✅ Ready
- **Last Fixed**: 2025-01-15 (Service factory integration)
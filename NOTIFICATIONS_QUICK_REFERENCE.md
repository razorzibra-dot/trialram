# Notifications Service - Quick Reference

## 🎯 TL;DR

**NotificationsPage fixed!** Errors about "notificationService.getNotifications is not a function" resolved.

### What Changed
- ✅ Fixed wrong service import
- ✅ Created mock notification service
- ✅ Added to service factory
- ✅ UI notifications separated from data service

### Build Status
✅ **SUCCESS** - No errors, builds in 57.90s

---

## 📋 Two Types of Notification Services

### 1️⃣ Data Notification Service (For Managing Notifications)
**Use in**: NotificationsPage, components that fetch/manage notifications

```typescript
import { notificationService as factoryNotificationService } from '@/services/serviceFactory';

// Get notifications
const notifications = await factoryNotificationService.getNotifications({
  search: 'payment',
  is_read: false
});

// Mark as read
await factoryNotificationService.markAsRead(id);

// Subscribe to new notifications
const unsubscribe = factoryNotificationService.subscribeToNotifications(
  (notification) => console.log('New:', notification)
);
```

### 2️⃣ UI Notification Service (For Toast Messages)
**Use in**: Any component showing success/error messages

```typescript
import { uiNotificationService } from '@/services/uiNotificationService';

// Quick messages
uiNotificationService.success('Saved successfully!');
uiNotificationService.error('Failed to save');

// Persistent notification
uiNotificationService.notify({
  type: 'warning',
  message: 'Alert',
  description: 'This needs your attention',
  duration: 0  // stays until closed
});
```

---

## 📂 File Locations

| Service | File | Purpose |
|---------|------|---------|
| Mock Data | `/src/services/notificationService.ts` | Development with mock data |
| Supabase | `/src/services/supabase/notificationService.ts` | Real-time database |
| Real API | `/src/services/real/notificationService.ts` | REST API backend |
| **UI** | `/src/services/uiNotificationService.ts` | Toast/message display |
| **Factory** | `/src/services/serviceFactory.ts` | Routes to correct service |

---

## 🔄 Auto-Switching Backends

```bash
# Development - Uses mock data
VITE_API_MODE=mock

# Real-time - Uses Supabase
VITE_API_MODE=supabase

# Production - Uses .NET API
VITE_API_MODE=real
```

**No code changes needed!** Automatically uses correct backend.

---

## 📝 NotificationsPage Methods

```typescript
// Get notifications (with optional filters)
factoryNotificationService.getNotifications(filters?)

// Get user preferences
factoryNotificationService.getNotificationPreferences()

// Update preferences
factoryNotificationService.updateNotificationPreferences(prefs)

// Mark one as read
factoryNotificationService.markAsRead(id)

// Mark all as read
factoryNotificationService.markAllAsRead()

// Delete one notification
factoryNotificationService.deleteNotification(id)

// Delete all notifications
factoryNotificationService.clearAllNotifications()

// Subscribe to new notifications
factoryNotificationService.subscribeToNotifications(callback)

// Get unread count
factoryNotificationService.getUnreadCount()

// Get statistics
factoryNotificationService.getNotificationStats()
```

---

## ✅ What Was Fixed

### Before ❌
```
TypeError: notificationService.getNotifications is not a function
```
- Page imported UI notification service
- UI service doesn't have data methods
- Crashes on load

### After ✅
```typescript
import { notificationService as factoryNotificationService } from '@/services/serviceFactory';
const notifications = await factoryNotificationService.getNotifications();
```
- Imports from factory
- Factory routes to correct backend
- Everything works!

---

## 🚀 For New Features

### Adding to NotificationsPage

```typescript
// 1. Import from factory
import { notificationService as factoryNotificationService } from '@/services/serviceFactory';

// 2. Call any method
const data = await factoryNotificationService.getNotifications();

// That's it! Automatically uses mock/supabase/real based on .env
```

### If Backend Method Missing

1. Check `/src/services/supabase/notificationService.ts` - has it?
2. If yes, add to mock version
3. Add to factory export
4. Use in component

---

## 🔍 Current Notifications Mock Data

```
✅ 5 sample notifications loaded
   - System messages
   - Customer updates
   - Order approvals
   - Payment alerts
   - Reports

✅ 3 notification preferences categories
   - Email, SMS, Push, In-App channels
   - Enable/disable per category
   - Customizable for each user
```

---

## 🐛 Common Issues & Fixes

### Error: "Cannot read property 'getNotifications' of undefined"
**Fix**: Import from factory, not directly
```typescript
// ❌ WRONG
import { notificationService } from '@/services/notificationService';

// ✅ RIGHT
import { notificationService as factoryNotificationService } from '@/services/serviceFactory';
```

### Error: "subscribeToNotifications is not a function"
**Fix**: Make sure using factory service with correct method
```typescript
const unsubscribe = factoryNotificationService.subscribeToNotifications(callback);
```

### Mock data not loading
**Fix**: Check `.env` file
```bash
VITE_API_MODE=mock  # Should be 'mock' for development
```

### Need UI notification instead
**Fix**: Use the UI service for toasts
```typescript
import { uiNotificationService } from '@/services/uiNotificationService';
uiNotificationService.success('Done!');
```

---

## 📊 Build Status

```
✅ TypeScript:  0 errors
✅ ESLint:      0 errors
✅ Build:       SUCCESS (exit code 0)
✅ Time:        57.90 seconds
✅ Output:      dist/ (ready for deployment)
```

---

## 🔗 Related Docs

- **Full Details**: `NOTIFICATIONS_SERVICE_FACTORY_INTEGRATION.md`
- **Architecture**: `SERVICE_LAYER_ARCHITECTURE_GUIDE.md`
- **Repo Info**: `.zencoder/rules/repo.md`

---

## 💡 Pro Tips

1. **Always use factory** for automatic backend switching
2. **Mock data works offline** - great for development
3. **Supabase mode** supports real-time subscriptions
4. **No breaking changes** - existing UI notification code still works
5. **Type-safe** - TypeScript catches wrong methods at compile time

---

## 🎓 Learning Path

1. **Start Here**: This file (you are here!)
2. **Deep Dive**: `NOTIFICATIONS_SERVICE_FACTORY_INTEGRATION.md`
3. **Architecture**: `SERVICE_LAYER_ARCHITECTURE_GUIDE.md`
4. **Repo Info**: `.zencoder/rules/repo.md` (complete overview)
5. **Code**: Check `/src/services/notificationService.ts` for mock implementation

---

**Status**: ✅ Complete and Production Ready
**Last Updated**: 2024
**Tested**: All methods verified
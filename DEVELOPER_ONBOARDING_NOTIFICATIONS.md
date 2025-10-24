# 👨‍💻 Developer Onboarding - Notification System

Welcome! The application uses **Ant Design's notification system** for all toast-like messages. This guide will get you up to speed quickly.

---

## ⚡ 30-Second Quick Start

```typescript
import { notificationService } from '@/services/notificationService';

// Success
notificationService.successNotify('Success', 'Item created');

// Error
notificationService.errorNotify('Error', 'Failed to create item');

// Quick message (auto-dismisses)
notificationService.success('Done!');
```

That's it! You're ready to use notifications.

---

## 📚 Reading Order

1. **This file** (you are here) - 5 min read
2. `NOTIFICATION_SERVICE_QUICK_REFERENCE.md` - 10 min read
3. `ANTD_NOTIFICATION_MIGRATION_GUIDE.md` - 20 min read
4. Existing components (for examples) - 15 min

**Total Learning Time**: ~50 minutes to expert level

---

## 🎯 Common Scenarios

### 1. Form Submission Success
```typescript
const handleSubmit = async (data: FormData) => {
  try {
    await api.create(data);
    notificationService.successNotify('Success', 'Saved successfully');
    onClose();
  } catch (error) {
    notificationService.errorNotify('Error', 'Failed to save');
  }
};
```

### 2. Delete Confirmation
```typescript
const handleDelete = async (id: string) => {
  if (!confirm('Are you sure?')) return;
  
  try {
    await api.delete(id);
    notificationService.success('Deleted');
  } catch (error) {
    notificationService.error('Delete failed');
  }
};
```

### 3. Loading Operation
```typescript
const handleExport = async () => {
  const hideLoading = notificationService.loading('Exporting...');
  try {
    await api.export();
    hideLoading();
    notificationService.success('Export complete');
  } catch (error) {
    hideLoading();
    notificationService.error('Export failed');
  }
};
```

### 4. Validation Error
```typescript
const handleSubmit = (values: any) => {
  if (!values.email) {
    notificationService.errorNotify(
      'Validation Error',
      'Email is required'
    );
    return;
  }
  // Continue...
};
```

---

## ✅ API Cheat Sheet

### For Quick Feedback (Auto-dismisses in 3 seconds)
```typescript
notificationService.success('Operation successful');
notificationService.error('Something went wrong');
notificationService.warning('Please verify');
notificationService.info('New update available');
```

### For Important Messages (With Title)
```typescript
notificationService.successNotify('Created', 'Customer added');
notificationService.errorNotify('Error', 'Failed to create');
notificationService.warningNotify('Warning', 'Cannot be undone');
notificationService.infoNotify('Info', 'Update available');
```

### For Loading States
```typescript
const hideLoading = notificationService.loading('Processing...');
// Later...
hideLoading();
```

### For Configuration
```typescript
notificationService.closeAll();  // Close all notifications
notificationService.config.setMessageDuration(5);  // Custom duration
notificationService.config.setNotificationPosition('topLeft');  // Custom position
```

---

## 🚫 What NOT to Do

### ❌ Don't use old toast hook
```typescript
// WRONG - This won't work
import { useToast } from '@/hooks/use-toast';
const { toast } = useToast();
```

### ❌ Don't create duplicate imports
```typescript
// WRONG - Import multiple times
import { notificationService } from '@/services/notificationService';
import { notificationService } from '@/services';  // Don't do this
```

### ❌ Don't chain notifications
```typescript
// WRONG - Looks messy
notificationService.success('1');
notificationService.success('2');
notificationService.success('3');

// BETTER - Use persistent notification with details
notificationService.successNotify('Results', '1 item, 2 items, 3 items');
```

---

## 📋 Before Starting a Feature

- [ ] Read this file
- [ ] Look at similar existing component
- [ ] Check `NOTIFICATION_SERVICE_QUICK_REFERENCE.md` for your use case
- [ ] Copy pattern from existing components
- [ ] Test all notification scenarios
- [ ] Verify theme colors are correct

---

## 🧪 Testing Your Notifications

### Manual Testing
```typescript
// Test success
await createItem(data);
// Expect: Green notification saying "Success"

// Test error
await deleteItem(invalidId);
// Expect: Red notification saying "Error"

// Test loading
const hideLoading = notificationService.loading('Working...');
await longOperation();
hideLoading();
// Expect: Loading spinner, then final message
```

### What to Check
- [ ] Notification appears in correct location (top-right)
- [ ] Color matches notification type (green=success, red=error)
- [ ] Message is clear and helpful
- [ ] Auto-dismiss works for quick messages
- [ ] Custom actions work (if any)
- [ ] Multiple notifications stack correctly

---

## 💡 Pro Tips

### Tip 1: Use Consistent Titles
```typescript
// Good - Clear, consistent titles
notificationService.successNotify('Success', 'Customer created');
notificationService.errorNotify('Error', 'Failed to create customer');

// Avoid - Repetitive
notificationService.successNotify('Customer Created', 'Customer created');
```

### Tip 2: Use Description for Details
```typescript
// Good - Title is short, details in description
notificationService.errorNotify('Upload Failed', 'File size exceeds 10MB');

// Avoid - Too much in title
notificationService.errorNotify('Upload Failed: File size exceeds 10MB', '');
```

### Tip 3: Handle All Error Paths
```typescript
// Good - All paths have notifications
try {
  await api.create(data);
  notificationService.successNotify('Success', 'Created');
} catch (error) {
  notificationService.errorNotify('Error', getErrorMessage(error));
}

// Avoid - Missing error notification
try {
  await api.create(data);
  notificationService.successNotify('Success', 'Created');
} catch (error) {
  console.log(error);  // Silent fail - bad UX
}
```

### Tip 4: Close Loading Before Showing Result
```typescript
// Good - Hide loading, then show result
const hideLoading = notificationService.loading('Processing...');
try {
  await api.process();
  hideLoading();
  notificationService.successNotify('Success', 'Done');
} catch (error) {
  hideLoading();
  notificationService.errorNotify('Error', 'Failed');
}

// Avoid - Leave loading visible
const hideLoading = notificationService.loading('Processing...');
await api.process();
notificationService.successNotify('Success', 'Done');
// hideLoading() never called - loading message stays
```

---

## 🔍 Finding Examples

### In This Codebase

**Look at these files for real examples:**

```
✅ src/contexts/SuperAdminContext.tsx         → Multiple notifications
✅ src/components/complaints/ComplaintDetailModal.tsx   → Form handling
✅ src/components/pdf/PDFTemplateFormModal.tsx → Loading states
✅ src/components/configuration/TenantAdminSettings.tsx → Error handling
```

**Search for:** `notificationService` to see all usage

---

## ❓ FAQ

### Q: Should I use message or notification?
**A:** Use `message` (quick dismiss) for simple feedback. Use `notification` (with title) for complex/detailed messages.

### Q: How do I know if notifications work?
**A:** Check browser console (`F12`) for any errors. If no errors, they're working.

### Q: Can I customize notification appearance?
**A:** Yes! They automatically use your app's Ant Design theme. Customize theme in `AntdConfigProvider`.

### Q: How do I show multiple notifications?
**A:** They automatically stack. Call multiple `notificationService` methods.

### Q: Can I add actions to notifications?
**A:** Advanced feature. See `ANTD_NOTIFICATION_MIGRATION_GUIDE.md` for details.

### Q: How long do notifications stay?
**A:** Quick messages: 3 seconds. Persistent: 4.5 seconds. Customize via `config`.

---

## 🐛 Debugging

### Notifications not showing?
```
1. Check console for errors (F12)
2. Verify AntdConfigProvider exists in App.tsx
3. Check import path: '@/services/notificationService'
4. Try notificationService.success('test')
```

### Wrong import?
```typescript
❌ WRONG:
import toast from '@/hooks/use-toast';

✅ CORRECT:
import { notificationService } from '@/services/notificationService';
```

### Component not updating after action?
```typescript
// Make sure to call notification BEFORE state changes
notificationService.successNotify('Success', 'Saved');
onClose();  // Now close modal

// Not:
onClose();
notificationService.successNotify('Success', 'Saved');  // Too late
```

---

## 📞 Need Help?

1. **Quick questions**: Check this file
2. **Code examples**: See `NOTIFICATION_SERVICE_QUICK_REFERENCE.md`
3. **Advanced usage**: See `ANTD_NOTIFICATION_MIGRATION_GUIDE.md`
4. **Existing code**: Search for `notificationService` in components
5. **Team**: Ask a senior developer for code review

---

## 🎓 Your First Notification

Ready to try? Here's your first task:

### Step 1: Find a component
```
Open any component in src/components/
```

### Step 2: Add import
```typescript
import { notificationService } from '@/services/notificationService';
```

### Step 3: Add notification
```typescript
notificationService.success('Hello, World!');
```

### Step 4: Test
```
Run: npm run dev
Look for the notification!
```

### Step 5: Read examples
```
Open: NOTIFICATION_SERVICE_QUICK_REFERENCE.md
Copy patterns from existing components
```

---

## 🎉 You're Ready!

You now have the basics. Time to:

1. ✅ Bookmark this file
2. ✅ Read the Quick Reference
3. ✅ Look at 2-3 existing components
4. ✅ Add notifications to your feature
5. ✅ Ask for code review

---

## 📖 Learning Path

```
Start Here (This File)
        ↓
Quick Reference Guide
        ↓
Migration Guide (Advanced)
        ↓
Review 3-4 Existing Components
        ↓
Implement Your First Feature
        ↓
Expert Level!
```

---

## ⚡ One More Time - Quick Reference

```typescript
// ✅ SUCCESS
notificationService.successNotify('Success', 'Item created');

// ❌ ERROR  
notificationService.errorNotify('Error', 'Failed to create item');

// ⏳ LOADING
const hideLoading = notificationService.loading('Processing...');
// ... do work ...
hideLoading();

// 🚀 QUICK MESSAGE
notificationService.success('Done!');  // Auto-dismisses
```

---

**Welcome to the team!** 🎉

Notifications are now easier and better integrated. Happy coding!

---

**Last Updated**: 2024  
**For Questions**: Refer to main documentation or ask the team  
**Version**: 1.0 - Production Ready
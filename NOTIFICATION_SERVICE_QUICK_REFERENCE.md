# 📢 Notification Service - Quick Reference Guide

## Quick Start

```typescript
import { notificationService } from '@/services/notificationService';

// That's it! Ready to use.
```

---

## Common Use Cases

### 1️⃣ Success Notification After Form Submit
```typescript
const handleSubmit = async (data: FormData) => {
  try {
    await createCustomer(data);
    notificationService.successNotify('Success', 'Customer created successfully');
    onClose();
  } catch (error) {
    notificationService.errorNotify('Error', 'Failed to create customer');
  }
};
```

### 2️⃣ Quick Error Messages
```typescript
const handleDelete = async (id: string) => {
  try {
    await deleteItem(id);
    notificationService.success('Item deleted');  // Quick message
  } catch (error) {
    notificationService.error('Failed to delete');  // Quick message
  }
};
```

### 3️⃣ Validation Error Handling
```typescript
const handleSubmit = (values: any) => {
  if (!values.email) {
    notificationService.errorNotify('Validation Error', 'Email is required');
    return;
  }
  // ... proceed with submission
};
```

### 4️⃣ Async Operations with Loading
```typescript
const handleExport = async () => {
  const hideLoading = notificationService.loading('Generating report...');
  try {
    await generateReport();
    hideLoading();
    notificationService.success('Report generated successfully');
  } catch (error) {
    hideLoading();
    notificationService.error('Failed to generate report');
  }
};
```

### 5️⃣ Detailed Multi-Line Messages
```typescript
notificationService.errorNotify(
  'Upload Failed',
  'File size exceeds 10MB limit. Please choose a smaller file.'
);
```

---

## API Reference

### Quick Messages (Auto-dismiss in 3 seconds)
```typescript
// Success
notificationService.success('Operation successful');
notificationService.success('Saved!', 2);  // Custom: 2 seconds

// Error
notificationService.error('Something went wrong');

// Warning
notificationService.warning('Please verify your input');

// Info
notificationService.info('Processing your request');
```

### Detailed Notifications (With Title & Description)
```typescript
// Success with title and description
notificationService.successNotify('Title', 'Description');
notificationService.successNotify('Created', 'Customer added to system');

// Error with details
notificationService.errorNotify('Error', 'Description of what went wrong');

// Warning notification
notificationService.warningNotify('Warning', 'This action cannot be undone');

// Info notification
notificationService.infoNotify('Info', 'Update will be applied shortly');

// Custom duration (0 = don't auto-dismiss)
notificationService.successNotify('Success', 'Click to dismiss', 0);
```

### Loading Messages
```typescript
// Show loading
const hideLoading = notificationService.loading('Processing...');

// Later, hide it
hideLoading();
```

### Utilities
```typescript
// Close all notifications
notificationService.closeAll();

// Configure defaults
notificationService.config.setMessageDuration(4);  // 4 seconds
notificationService.config.setNotificationPosition('topLeft');
```

---

## Message vs Notification - When to Use

| Feature | Quick Message | Persistent Notification |
|---------|---|---|
| **Use Case** | Brief feedback | Important/detailed info |
| **Auto-dismiss** | Yes (3-4.5 sec) | Yes (4.5 sec default) |
| **Title** | No | Yes |
| **Description** | Single line | Multiple lines supported |
| **Position** | Top center | Top right (configurable) |
| **User Action** | Auto-closes | User can click close |

### Examples

```typescript
// ✅ Quick message - simple feedback
notificationService.success('Saved!');

// ✅ Persistent - complex information
notificationService.successNotify(
  'Import Complete',
  '250 customers imported successfully. 5 errors found in rows 12, 45, 67...'
);

// ✅ Quick message - error feedback
notificationService.error('Failed');

// ✅ Persistent - actionable error
notificationService.errorNotify(
  'Validation Error',
  'Email is invalid. Please enter a valid email address.'
);
```

---

## Common Patterns

### ✅ Form Submission Pattern
```typescript
const handleFormSubmit = async (formData) => {
  try {
    setLoading(true);
    await api.createItem(formData);
    notificationService.successNotify(
      'Success',
      'Item created successfully'
    );
    onClose();  // Close modal
    refreshData();  // Refresh list
  } catch (error) {
    notificationService.errorNotify(
      'Error',
      error.message || 'Failed to create item'
    );
  } finally {
    setLoading(false);
  }
};
```

### ✅ Delete Confirmation Pattern
```typescript
const handleDelete = async (id: string) => {
  if (!window.confirm('Are you sure?')) return;
  
  try {
    await api.deleteItem(id);
    notificationService.success('Deleted successfully');
    refreshData();
  } catch (error) {
    notificationService.errorNotify('Error', 'Failed to delete');
  }
};
```

### ✅ Bulk Operations Pattern
```typescript
const handleBulkAction = async (ids: string[]) => {
  const hideLoading = notificationService.loading('Processing...');
  
  try {
    const results = await api.bulkUpdate(ids);
    hideLoading();
    
    notificationService.successNotify(
      'Success',
      `${results.success} items updated. ${results.failed} failed.`
    );
  } catch (error) {
    hideLoading();
    notificationService.errorNotify('Error', 'Bulk operation failed');
  }
};
```

### ✅ Async Data Loading Pattern
```typescript
const handleImport = async () => {
  const hideLoading = notificationService.loading('Importing data...');
  
  try {
    const response = await api.importData(file);
    hideLoading();
    
    if (response.success > 0) {
      notificationService.successNotify(
        'Import Complete',
        `${response.success} records imported`
      );
    }
    if (response.errors.length > 0) {
      notificationService.warningNotify(
        'Warnings',
        `${response.errors.length} records had errors`
      );
    }
  } catch (error) {
    hideLoading();
    notificationService.errorNotify('Import Failed', error.message);
  }
};
```

---

## Type Reference

```typescript
// Notification types
type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Message types
type MessageType = 'success' | 'error' | 'warning' | 'info' | 'loading';

// Configuration
interface NotificationConfig {
  type: NotificationType;
  message: string;           // Title
  description?: string;      // Subtitle
  duration?: number;         // Seconds (0 = persistent)
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  onClose?: () => void;     // Callback when closed
}
```

---

## Migration Checklist (For New Code)

When creating new components that need notifications:

- [ ] Import: `import { notificationService } from '@/services/notificationService'`
- [ ] **Don't** import old `useToast` hook
- [ ] **Don't** use old toast component
- [ ] Use `notificationService.successNotify()` for success
- [ ] Use `notificationService.errorNotify()` for errors
- [ ] Use `notificationService.success()` for quick messages
- [ ] Use `notificationService.loading()` for async operations
- [ ] Test all notification scenarios
- [ ] Verify theme colors are correct

---

## Troubleshooting

### Issue: Notifications not showing
```
❌ Check: Is AntdConfigProvider in your component tree?
✅ Solution: Ensure App.tsx has <AntdConfigProvider>
```

### Issue: Wrong import path
```typescript
❌ WRONG:
import { useToast } from '@/hooks/use-toast';

✅ CORRECT:
import { notificationService } from '@/services/notificationService';
```

### Issue: Can't call notificationService
```typescript
❌ WRONG:
const { notify } = notificationService;  // Wrong!
notify.success('test');

✅ CORRECT:
notificationService.success('test');     // Direct call
```

### Issue: Multiple notifications stacking
```
❌ Problem: Too many notifications at once
✅ Solution: Use notificationService.closeAll() first if needed
```

---

## Real-World Examples

### Complete Customer Form Component
```typescript
import React, { useState } from 'react';
import { notificationService } from '@/services/notificationService';
import { customerService } from '@/services/customerService';

export const CustomerFormModal: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email) {
      notificationService.errorNotify(
        'Validation Error',
        'Email is required'
      );
      return;
    }

    setLoading(true);
    try {
      await customerService.createCustomer(formData);
      notificationService.successNotify(
        'Success',
        'Customer created successfully'
      );
      // Close modal, refresh list, etc.
    } catch (error) {
      notificationService.errorNotify(
        'Error',
        error instanceof Error ? error.message : 'Failed to create customer'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
};
```

---

## Best Practices

✅ **Do:**
- Keep messages concise and clear
- Use title + description for complex messages
- Show loading state during async operations
- Close loading before showing final message
- Handle all error paths with notifications
- Use appropriate notification type (success/error/warning/info)

❌ **Don't:**
- Show too many notifications at once
- Use error notifications for info messages
- Leave loading notifications hanging
- Use notification for user input dialogs
- Import old `useToast` hook
- Mix old toast and new notification service

---

## Additional Resources

- **Full Documentation**: `ANTD_NOTIFICATION_MIGRATION_GUIDE.md`
- **Migration Complete**: `ANTD_TOAST_MIGRATION_COMPLETE.md`
- **Service Implementation**: `src/services/notificationService.ts`
- **Ant Design Docs**: https://ant.design/components/notification/

---

## Need Help?

1. Check this guide first
2. Review examples in migrated components
3. Look at `src/services/notificationService.ts` for detailed implementation
4. Check Ant Design official documentation

---

**Happy Notifying!** 🎉
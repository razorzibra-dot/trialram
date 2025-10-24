# JobWorks Module - Quick Start Guide

## 🚀 Quick Overview

The JobWorks module has been **completely refactored** from old modals to a modern side-drawer architecture. Everything is synchronized and aligned with the application architecture.

## 📁 Where to Find Things

### Main Page
📍 `src/modules/features/jobworks/views/JobWorksPage.tsx`
- List view with Ant Design Table
- Statistics cards
- Search and pagination
- Drawer state management

### Detail Drawer (Read-Only)
📍 `src/modules/features/jobworks/components/JobWorksDetailPanel.tsx`
- View job work details
- Edit button to switch to edit mode
- Professional presentation

### Form Drawer (Create/Edit)
📍 `src/modules/features/jobworks/components/JobWorksFormPanel.tsx`
- Create new job works
- Edit existing job works
- Form validation and submission

### Business Logic
📍 `src/modules/features/jobworks/services/jobWorksService.ts`
- Interface definitions
- CRUD methods
- Statistics calculations

### Hooks
📍 `src/modules/features/jobworks/hooks/useJobWorks.ts`
- Data fetching with React Query
- Mutations (create, update, delete)
- Cache invalidation

## 🎯 Key Features

### Grid Control
```
┌─────────────┬────────┬──────────┬──────────────┬────────┬────────┬─────────┐
│ Job Work    │ Status │ Priority │ Assigned To  │ Due    │ Cost   │ Actions │
├─────────────┼────────┼──────────┼──────────────┼────────┼────────┼─────────┤
│ Title       │ [Tag]  │ [Tag]    │ Name         │ Date   │ $1,000 │ V E Del │
│ + Customer  │        │          │              │        │        │         │
└─────────────┴────────┴──────────┴──────────────┴────────┴────────┴─────────┘
```

### Search
- Search by job work title
- Search by customer name
- Real-time filtering

### Actions
- **View**: Opens read-only drawer
- **Edit**: Opens form drawer with data
- **Delete**: Asks for confirmation then removes

### Statistics
- Total Job Works
- In Progress Count
- Completed This Month
- Total Value (currency)

## 🔧 Common Tasks

### Add a Column to Table
Edit `JobWorksPage.tsx`:
```typescript
// Find the columns array
const columns: ColumnsType<JobWork> = [
  // ... existing columns ...
  {
    title: 'New Column',
    key: 'field_name',
    dataIndex: 'field_name',
    width: 120,
    render: (value) => value || '-',
  },
];
```

### Add a Form Field
Edit `JobWorksFormPanel.tsx`:
```typescript
<Form.Item
  label="Field Name"
  name="field_key"
  rules={[{ required: true, message: 'Please enter...' }]}
>
  <Input placeholder="..." />
</Form.Item>
```

### Change Status Colors
Edit `JobWorksPage.tsx`:
```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'warning';
    case 'in_progress': return 'processing';
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};
```

### Update Permission Checks
```typescript
// For visibility
{hasPermission('jobworks:create') && (
  <Button>New Job Work</Button>
)}

// For actions
{hasPermission('jobworks:delete') && (
  <Button danger>Delete</Button>
)}
```

## 📊 Data Flow

```
1. Page Load
   ├─ useJobWorks fetches data
   ├─ useJobWorkStats fetches stats
   └─ Table and stats display

2. Create Job Work
   ├─ Click "New Job Work"
   ├─ Form drawer opens
   ├─ Fill form and submit
   ├─ useCreateJobWork mutation runs
   ├─ Cache invalidates
   ├─ Table refreshes
   └─ Success message

3. View Job Work
   ├─ Click "View" button
   ├─ Detail drawer opens
   ├─ Click "Edit" button
   ├─ Detail drawer closes
   ├─ Form drawer opens with data
   └─ Edit and submit

4. Edit Job Work
   ├─ Click "Edit" button
   ├─ Form drawer opens with data
   ├─ Modify fields
   ├─ Click "Update"
   ├─ useUpdateJobWork mutation runs
   ├─ Cache invalidates
   ├─ Table refreshes
   └─ Success message

5. Delete Job Work
   ├─ Click "Delete" button
   ├─ Confirmation dialog
   ├─ Click "Yes"
   ├─ useDeleteJobWork mutation runs
   ├─ Cache invalidates
   ├─ Table refreshes
   └─ Item removed
```

## 🎨 Styling

### Color Scheme
- **Status Colors**: warning, processing, success, error
- **Priority Colors**: default, blue, orange, red
- **Text Colors**: #111827 (dark), #8c8c8c (gray), #ff4d4f (red)

### Components
- **Table**: Ant Design Table with 500px right column
- **Drawers**: 500px width, right side
- **Cards**: 8px border radius, shadow
- **Tags**: Color-coded with labels

## ⚙️ Configuration

### Module Registration
Located in: `src/modules/bootstrap.ts`
```typescript
const { jobWorksModule } = await import('./features/jobworks');
registerModule(jobWorksModule);
```

### Routes
Located in: `src/modules/features/jobworks/routes.tsx`
```typescript
{
  path: 'job-works',
  element: <JobWorksPage />
}
```

### Exports
Located in: `src/modules/features/jobworks/index.ts`
```typescript
export { JobWorksDetailPanel };
export { JobWorksFormPanel };
export * from './services/jobWorksService';
export * from './hooks/useJobWorks';
```

## 🧪 Testing

### Quick Test
1. Navigate to `/job-works`
2. Table should load with data
3. Stats cards should show numbers
4. Click "New Job Work" button
5. Fill form and submit
6. Item should appear in table

### Check Logs
Open browser console and look for:
- No red errors
- Module initialization messages
- Query activity

## 📚 Documentation

- `JOBWORKS_REFACTORING_SUMMARY.md` - Complete technical details
- `JOBWORKS_BEFORE_AFTER.md` - Visual comparison
- `JOBWORKS_VERIFICATION_CHECKLIST.md` - Full testing guide
- `JOBWORKS_REFACTORING_COMPLETE.md` - Project completion report

## 🆘 Troubleshooting

### Table not loading
- Check network tab for API calls
- Verify service is registered
- Check browser console for errors

### Form validation not working
- Ensure field names match interface
- Check required={true} in Form.Item rules
- Verify form hook is initialized

### Drawer not opening
- Check drawerMode state in component
- Verify visible prop is correct
- Check z-index if overlaying issues

### Data not updating
- Verify useQueryClient() is present
- Check cache invalidation in mutations
- Ensure refetch() is called

## 💡 Tips & Tricks

### Refresh Data
```typescript
const handleRefresh = () => {
  refetch();
  message.success('Data refreshed');
};
```

### Format Currency
```typescript
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};
```

### Format Date
```typescript
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};
```

### Check Permission
```typescript
if (hasPermission('jobworks:delete')) {
  // Show delete button
}
```

## 🔗 Related Modules

Similar pattern used in:
- `src/modules/features/customers` - Reference implementation
- `src/modules/features/sales` - Similar pattern (in progress)
- `src/modules/features/tickets` - Similar pattern (future)

## 📞 Support

If you need help:
1. Check the documentation files
2. Review the Customers module for examples
3. Look at useJobWorks hook for hook patterns
4. Check jobWorksService for service patterns

## ✨ Summary

**The JobWorks module is fully refactored, tested, and ready for production.**

- ✅ Modern Ant Design Table grid
- ✅ Side drawer CRUD operations
- ✅ Clean 3-layer architecture
- ✅ Full type safety
- ✅ Production-ready code

**Start using it today!**

---

*Quick Reference v1.0*
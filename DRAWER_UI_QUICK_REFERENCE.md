# Drawer-Based UI - Quick Reference Guide

## 🎯 At a Glance

All admin modules (Users, PDF Templates, Notifications, Companies, Products) now use **side drawer panels** instead of modal popups.

**Key Benefit**: Better user context + consistent patterns across the app

---

## 📦 Available Drawer Components

### User Management Module
```typescript
import { UserDetailPanel } from '@/modules/features/user-management/components/UserDetailPanel';
import { UserFormPanel } from '@/modules/features/user-management/components/UserFormPanel';

// Use:
<UserDetailPanel 
  user={selectedUser}
  open={drawerMode === 'view'}
  onClose={closeDrawer}
  onEdit={() => setDrawerMode('edit')}
/>

<UserFormPanel
  mode={drawerMode === 'create' ? 'create' : 'edit'}
  user={selectedUser}
  open={drawerMode === 'create' || drawerMode === 'edit'}
  onClose={closeDrawer}
  onSave={handleFormSave}
/>
```

### PDF Templates Module
```typescript
import { PDFTemplateDetailPanel } from '@/modules/features/pdf-templates/components/PDFTemplateDetailPanel';
import { PDFTemplateFormPanel } from '@/modules/features/pdf-templates/components/PDFTemplateFormPanel';

// Use:
<PDFTemplateDetailPanel
  template={selectedTemplate}
  open={drawerMode === 'view'}
  onClose={closeDrawer}
/>

<PDFTemplateFormPanel
  mode={drawerMode === 'create' ? 'create' : 'edit'}
  template={selectedTemplate}
  open={drawerMode === 'create' || drawerMode === 'edit'}
  onClose={closeDrawer}
  onSave={handleFormSave}
/>
```

### Notifications Module
```typescript
import { NotificationDetailPanel } from '@/modules/features/notifications/components/NotificationDetailPanel';
import { NotificationPreferencesPanel } from '@/modules/features/notifications/components/NotificationPreferencesPanel';

// Use:
<NotificationDetailPanel
  notification={selectedNotification}
  open={drawerMode === 'details'}
  onClose={closeDrawer}
  onMarkAsRead={handleMarkAsRead}
  onDelete={handleDelete}
/>

<NotificationPreferencesPanel
  open={drawerMode === 'preferences'}
  onClose={closeDrawer}
  preferences={preferences}
  onSaved={fetchPreferences}
/>
```

---

## 🔄 State Management Pattern

### Define State
```typescript
const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | null>(null);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);
```

### Close Handler
```typescript
const closeDrawer = () => {
  setDrawerMode(null);
  setSelectedItem(null);
};
```

### Action Handlers
```typescript
// Create
const handleCreate = () => {
  setSelectedItem(null);
  setDrawerMode('create');
};

// View
const handleView = (item: Item) => {
  setSelectedItem(item);
  setDrawerMode('view');
};

// Edit
const handleEdit = (item: Item) => {
  setSelectedItem(item);
  setDrawerMode('edit');
};
```

---

## 💾 Form Handling

### Unified Save Handler
```typescript
const handleFormSave = async (values: Item) => {
  try {
    if (drawerMode === 'create') {
      await itemService.createItem(values);
      message.success('Item created successfully');
    } else if (drawerMode === 'edit' && selectedItem) {
      await itemService.updateItem(selectedItem.id, values);
      message.success('Item updated successfully');
    }
    await fetchItems();
    closeDrawer();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Operation failed';
    message.error(errorMessage);
  }
};
```

---

## 🎨 Drawer Specifications

| Property | Value |
|----------|-------|
| Width | 550px |
| Placement | right |
| Destroy on close | false (reuse drawer) |
| Animation | Smooth slide-in |
| Padding | Ant Design default (24px) |

---

## 🔒 Permission Checks

### Built-in Permission Support
```typescript
// Each panel component includes permission checks
// Example from UserFormPanel:
if (!hasPermission('users:update')) {
  return <div>No permission to edit users</div>;
}

// Buttons are conditionally rendered based on permissions
{hasPermission('users:delete') && (
  <Button danger onClick={() => handleDelete(user.id)}>
    Delete User
  </Button>
)}
```

---

## 📋 Common Patterns

### Opening Drawers from Table Actions
```typescript
<Table
  columns={[
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleView(record)}>View</Button>
          {hasPermission('items:edit') && (
            <Button onClick={() => handleEdit(record)}>Edit</Button>
          )}
          {hasPermission('items:delete') && (
            <Button danger onClick={() => handleDelete(record.id)}>Delete</Button>
          )}
        </Space>
      )
    }
  ]}
/>
```

### Opening from Row Click
```typescript
<List
  renderItem={(item) => (
    <List.Item 
      onClick={() => handleView(item)}
      style={{ cursor: 'pointer' }}
    >
      {/* Item content */}
    </List.Item>
  )}
/>
```

### Opening from Header Button
```typescript
<PageHeader
  extra={
    <Button 
      type="primary" 
      onClick={handleCreate}
    >
      Create New
    </Button>
  }
/>
```

---

## 🐛 Common Pitfalls to Avoid

### ❌ Don't Mix Multiple Drawer Modes
```typescript
// WRONG - confusing state management
const [showCreateDrawer, setShowCreateDrawer] = useState(false);
const [showEditDrawer, setShowEditDrawer] = useState(false);
const [showViewDrawer, setShowViewDrawer] = useState(false);

// RIGHT - single mode state
const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | null>(null);
```

### ❌ Don't Import Components Directly from Services
```typescript
// WRONG - bypasses factory pattern
import { userService } from '@/services/userService';

// RIGHT - use factory service
import { userService as factoryUserService } from '@/services/serviceFactory';
```

### ❌ Don't Forget to Close Drawer on Save
```typescript
// WRONG - drawer stays open
const handleFormSave = async (values: Item) => {
  await itemService.createItem(values);
  message.success('Created');
  // Drawer still visible!
};

// RIGHT - close drawer after save
const handleFormSave = async (values: Item) => {
  await itemService.createItem(values);
  message.success('Created');
  closeDrawer(); // ✅ Close it
};
```

---

## 🔍 Testing Drawer Components

### Testing Detail Panel
```typescript
it('should display item details in drawer', () => {
  render(
    <ItemDetailPanel
      item={mockItem}
      open={true}
      onClose={jest.fn()}
      onEdit={jest.fn()}
    />
  );
  
  expect(screen.getByText(mockItem.title)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
});
```

### Testing Form Panel
```typescript
it('should save form and close drawer', async () => {
  const onClose = jest.fn();
  const onSave = jest.fn();
  
  render(
    <ItemFormPanel
      mode="create"
      item={null}
      open={true}
      onClose={onClose}
      onSave={onSave}
    />
  );
  
  const submitBtn = screen.getByRole('button', { name: /save/i });
  await userEvent.click(submitBtn);
  
  expect(onSave).toHaveBeenCalled();
});
```

---

## 🚀 Performance Optimization

### Conditional Rendering
Drawers use conditional rendering to avoid unnecessary DOM nodes:
```typescript
{drawerMode === 'view' && <DetailPanel {...props} />}
{(drawerMode === 'create' || drawerMode === 'edit') && <FormPanel {...props} />}
```

### Lazy Loading
For heavy form panels, use React.lazy:
```typescript
const UserFormPanel = lazy(() => 
  import('@/modules/features/user-management/components/UserFormPanel')
    .then(m => ({ default: m.UserFormPanel }))
);

// Use with Suspense:
<Suspense fallback={<Skeleton />}>
  <UserFormPanel {...props} />
</Suspense>
```

---

## 📱 Responsive Behavior

### Mobile-Friendly Drawer
```typescript
const [screenWidth, setScreenWidth] = useState(window.innerWidth);

// Responsive drawer width
const drawerWidth = screenWidth < 768 ? '100%' : 550;

<Drawer width={drawerWidth} {...props}>
  {/* Content */}
</Drawer>
```

---

## 🎓 Learning Resources

### Similar Patterns in App
- Masters Module: `CompanyDetailPanel`, `CompanyFormPanel`
- Notifications: `NotificationDetailPanel`, `NotificationPreferencesPanel`
- Configuration: `ConfigTestResultPanel`

### Component Templates
Copy-paste this structure for new drawer components:

```typescript
import React from 'react';
import { Drawer, Button, Space, Form, message } from 'antd';
import type { [ItemType] } from '@/types';

interface [Item]DetailPanelProps {
  item: [ItemType] | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export const [Item]DetailPanel: React.FC<[Item]DetailPanelProps> = ({
  item,
  open,
  onClose,
  onEdit
}) => {
  if (!item) return null;

  return (
    <Drawer
      title="[Item] Details"
      placement="right"
      onClose={onClose}
      open={open}
      width={550}
      extra={
        onEdit && <Button type="primary" onClick={onEdit}>Edit</Button>
      }
    >
      {/* Display item details */}
    </Drawer>
  );
};
```

---

## ✅ Checklist for New Drawer Implementation

- ✅ Create `[Item]DetailPanel.tsx` with read-only content
- ✅ Create `[Item]FormPanel.tsx` with editable form
- ✅ Update main page with `drawerMode` state
- ✅ Implement `handleView`, `handleCreate`, `handleEdit` handlers
- ✅ Implement `closeDrawer` handler
- ✅ Implement `handleFormSave` with mode checking
- ✅ Replace Modal components with new drawer components
- ✅ Test all CRUD operations
- ✅ Verify permission checks work
- ✅ Update TypeScript types if needed

---

**Last Updated**: January 2025
**Applies to**: User Management, PDF Templates, Notifications, Masters, Configuration modules
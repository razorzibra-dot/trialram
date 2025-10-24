# Grid Control Refactoring - Completion Guide

## Status Summary

### ✅ COMPLETE (Ready for Production)
1. **Customers Module** - Fully refactored with drawer panels
   - CustomerListPage.tsx ✅
   - CustomerDetailPanel.tsx ✅
   - CustomerFormPanel.tsx ✅

### 🔄 IN PROGRESS (Next Steps)
2. **Sales Module** - Page refactored, need drawer components
   - SalesPage.tsx ✅ (refactored)
   - SalesDealDetailPanel.tsx ❌ (TODO)
   - SalesDealFormPanel.tsx ❌ (TODO)

3. **Contracts Module** - Needs complete refactoring
4. **Tickets Module** - Needs complete refactoring
5. **JobWorks Module** - Needs complete refactoring

## Quick Completion Templates

### Template 1: Detail Panel (Copy-Paste Ready)

Use this for creating detail panels (e.g., SalesDealDetailPanel.tsx):

```tsx
/**
 * [Entity] Detail Panel
 * Side drawer for viewing [entity] details in read-only mode
 */

import React from 'react';
import { Drawer, Descriptions, Button, Space, Divider, Tag, Empty } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { [Entity] } from '@/types/crm';

interface [Entity]DetailPanelProps {
  visible: boolean;
  [entity]: [Entity] | null;
  onClose: () => void;
  onEdit: () => void;
}

export const [Entity]DetailPanel: React.FC<[Entity]DetailPanelProps> = ({
  visible,
  [entity],
  onClose,
  onEdit,
}) => {
  if (![entity]) {
    return null;
  }

  const getStatusColor = (status: string) => {
    // Map statuses to colors
    const colorMap: Record<string, string> = {
      'active': 'green',
      'pending': 'orange',
      'closed': 'red',
      // ... add more mappings
    };
    return colorMap[status] || 'default';
  };

  return (
    <Drawer
      title="[Entity] Details"
      placement="right"
      width={500}
      onClose={onClose}
      open={visible}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>Close</Button>
          <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
            Edit
          </Button>
        </Space>
      }
    >
      {[entity] ? (
        <div>
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Basic Information</h3>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Field 1">
              {[entity].field1}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor([entity].status || 'default')}>
                {([entity].status || 'default').toUpperCase()}
              </Tag>
            </Descriptions.Item>
            {/* Add more fields */}
          </Descriptions>

          <Divider />

          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Additional Information</h3>
          <Descriptions column={1} size="small" bordered>
            {/* Add additional fields */}
          </Descriptions>
        </div>
      ) : (
        <Empty description="No record selected" />
      )}
    </Drawer>
  );
};
```

### Template 2: Form Panel (Copy-Paste Ready)

Use this for creating form panels (e.g., SalesDealFormPanel.tsx):

```tsx
/**
 * [Entity] Form Panel
 * Side drawer for creating/editing [entity] information
 */

import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Space, message } from 'antd';
import { [Entity] } from '@/types/crm';
import { useCreate[Entity], useUpdate[Entity] } from '../hooks/use[Entities]';

interface [Entity]FormPanelProps {
  visible: boolean;
  [entity]: [Entity] | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const [Entity]FormPanel: React.FC<[Entity]FormPanelProps> = ({
  visible,
  [entity],
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const create[Entity] = useCreate[Entity]();
  const update[Entity] = useUpdate[Entity]();

  const isEditMode = !!entity];

  useEffect(() => {
    if (visible && [entity]) {
      form.setFieldsValue([entity]);
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, [entity], form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (isEditMode && [entity]) {
        await update[Entity].mutateAsync({
          id: [entity].id,
          ...values,
        });
        message.success('[Entity] updated successfully');
      } else {
        await create[Entity].mutateAsync(values);
        message.success('[Entity] created successfully');
      }

      onSuccess();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={isEditMode ? 'Edit [Entity]' : 'Create New [Entity]'}
      placement="right"
      width={500}
      onClose={onClose}
      open={visible}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
          >
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        autoComplete="off"
      >
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Basic Information</h3>

        <Form.Item
          label="Field 1"
          name="field1"
          rules={[{ required: true, message: 'Please enter field 1' }]}
        >
          <Input placeholder="Enter field 1" />
        </Form.Item>

        <Form.Item
          label="Status"
          name="status"
          initialValue="active"
        >
          <Select>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
        </Form.Item>

        {/* Add more fields */}
      </Form>
    </Drawer>
  );
};
```

### Template 3: List Page (Already Completed for Customers & Sales)

Reference the CustomerListPage.tsx or SalesPage.tsx for the complete pattern.

## Module-Specific Implementation Checklist

### Contracts Module

**Files to Create/Modify:**
- [ ] Modify: `/src/modules/features/contracts/views/ContractsPage.tsx`
- [ ] Create: `/src/modules/features/contracts/components/ContractDetailPanel.tsx`
- [ ] Create: `/src/modules/features/contracts/components/ContractFormPanel.tsx`

**Unique Features:**
- Tabs for "General Contracts" and "Service Contracts"
- Alert section for "Expiring Soon" and "Renewals Due"
- Contract types breakdown

**Grid Columns:**
```
Name (250) | Type (100) | Customer (150) | Value (120) | Status (100) | End Date (120) | Actions (150)
```

**Status Options:**
- active, pending_approval, expiring, expired, terminated

**Stats Cards:**
- Total Contracts
- Active Contracts
- Pending Approval
- Total Value

### Tickets Module

**Files to Create/Modify:**
- [ ] Modify: `/src/modules/features/tickets/views/TicketsPage.tsx`
- [ ] Create: `/src/modules/features/tickets/components/TicketDetailPanel.tsx`
- [ ] Create: `/src/modules/features/tickets/components/TicketFormPanel.tsx`

**Unique Features:**
- Priority visualization (High/Medium/Low)
- Status breakdown cards
- SLA tracking

**Grid Columns:**
```
ID (80) | Subject (250) | Customer (150) | Priority (80) | Status (100) | Created (120) | Actions (150)
```

**Status Options:**
- open, in_progress, resolved, closed

**Stats Cards:**
- Total Tickets
- Open Tickets
- Resolved Today
- Overdue Tickets

### JobWorks Module

**Files to Create/Modify:**
- [ ] Modify: `/src/modules/features/jobworks/views/JobWorksPage.tsx`
- [ ] Create: `/src/modules/features/jobworks/components/JobWorkDetailPanel.tsx`
- [ ] Create: `/src/modules/features/jobworks/components/JobWorkFormPanel.tsx`

**Unique Features:**
- Status distribution cards
- Cost estimation and tracking
- Resource allocation

**Grid Columns:**
```
ID (80) | Title (250) | Assignment (150) | Status (100) | Duration (80) | Value (120) | Actions (150)
```

**Status Options:**
- pending, in_progress, completed, cancelled

**Stats Cards:**
- Total Job Works
- In Progress
- Completed This Month
- Total Value

## Step-by-Step Completion Process

### For Each Module (Use Sales as Reference):

1. **Refactor Page Component**
   - Use SalesPage.tsx as template
   - Replace all entity-specific names and fields
   - Update table columns based on module requirements
   - Update status colors based on module statuses
   - Update stats calculation

2. **Create Detail Panel**
   - Copy DetailPanelTemplate above
   - Add all relevant fields
   - Update status color mapping
   - Organize into sections with Divider

3. **Create Form Panel**
   - Copy FormPanelTemplate above
   - Add all required form fields
   - Add proper validation rules
   - Organize into sections

4. **Update Hooks (if needed)**
   - Ensure useDelete[Entity] exists
   - Ensure useCreate[Entity] exists
   - Ensure useUpdate[Entity] exists
   - Ensure use[Entities] exists with pagination

5. **Test All Functionality**
   - Create operation works
   - Edit operation works
   - View operation works
   - Delete operation works with confirmation
   - Search and filter work
   - Pagination works
   - Status changes are reflected
   - Empty state displays correctly

## Code Quality Checklist

For each module:
- [ ] No console errors or warnings
- [ ] TypeScript types are complete (no 'any')
- [ ] All required fields have validation
- [ ] Status colors are consistent
- [ ] Permissions are checked before showing actions
- [ ] Error messages are user-friendly
- [ ] Loading states show during API calls
- [ ] Responsive design works on mobile
- [ ] Drawer width is 500px
- [ ] Drawer placement is 'right'
- [ ] Card styling uses proper shadow and border radius
- [ ] Spacing follows 24px/16px pattern

## Common Pitfalls to Avoid

1. **Inconsistent Status Colors**: Use the global color map
2. **Missing Permissions**: Always check hasPermission() before showing edit/delete
3. **Broken Pagination**: Ensure setFilters includes page reset on filter change
4. **Missing Drawer Close**: Always have onClose handler
5. **Form Validation**: Add required fields with proper error messages
6. **Loading States**: Show loading while data is fetching
7. **Empty States**: Handle empty data gracefully
8. **Mobile Responsiveness**: Test on xs breakpoint

## Testing Commands

```bash
# Run linter
npm run lint

# Run type check
npm run type-check

# Run specific module tests
npm run test -- --testPathPattern=customers

# Build for production
npm run build
```

## Git Commit Messages

Use conventional commit format:

```
feat: refactor customers grid control with drawer panels

- Replace navigation-based CRUD with side drawer panels
- Implement unified Ant Design Table pattern
- Add search and status filter functionality
- Add pagination with page size selector
- Create CustomerDetailPanel for read-only viewing
- Create CustomerFormPanel for create/edit operations
- Maintain backward compatibility with existing hooks
- Add responsive design (xs/sm/md/lg breakpoints)

Closes #[ISSUE_NUMBER]
```

## Performance Tips

1. Use `useMemo` for expensive computations (status color mapping)
2. Use `useCallback` for event handlers to prevent re-renders
3. Debounce search input to reduce API calls
4. Use `React.memo` for table row components if needed
5. Implement virtual scrolling for large tables (1000+ rows)

## Accessibility Tips

1. Add ARIA labels to buttons and inputs
2. Ensure keyboard navigation works (Tab, Enter, Escape)
3. Test with screen readers
4. Check color contrast (WCAG AA minimum)
5. Test with keyboard-only navigation

## Browser Testing Checklist

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

## Deployment Steps

1. Create feature branch
2. Implement all changes for one module
3. Run lint and type checks
4. Test manually
5. Submit for code review
6. Fix any review comments
7. Merge to main branch
8. Deploy to staging
9. Final QA testing
10. Deploy to production

## Estimated Timeline

- Sales drawer components: 1 hour
- Contracts refactor (includes tabbed interface): 2 hours
- Tickets refactor: 1.5 hours
- JobWorks refactor: 1.5 hours
- Testing and fixes: 2 hours
- **Total: ~8 hours**

## Support & Questions

When implementing:
- Reference Customers module for complete working example
- Check SalesPage for pagination and store integration
- Use DetailPanelTemplate for consistent UI
- Use FormPanelTemplate for consistent form handling
- Follow the color mapping scheme

## Final Checklist Before Merging

- [ ] All 5 modules refactored and tested
- [ ] Grid controls are visually consistent
- [ ] Drawer panels work smoothly
- [ ] Search and filters work correctly
- [ ] Pagination works correctly
- [ ] Stats cards display accurate data
- [ ] Status tags show correct colors
- [ ] Permissions are respected
- [ ] Error handling is in place
- [ ] Empty states display correctly
- [ ] Loading states show properly
- [ ] Mobile responsive design verified
- [ ] Accessibility tested
- [ ] Performance is acceptable
- [ ] Code review passed
- [ ] Documentation is complete
# Standardized Form Pattern - Quick Reference

## When to Use This Pattern

Use this pattern for all **Create/Edit forms** in the CRM application. It ensures consistency across all modules and provides users with a familiar, professional interface.

---

## Form Structure Template

### Drawer-Based Form (Recommended)

```tsx
import React, { useState, useEffect } from 'react';
import {
  Drawer, Form, Input, Select, Button, Card, Row, Col, 
  Tooltip, message, Alert
} from 'antd';
import {
  SaveOutlined, CloseOutlined, InfoCircleOutlined,
  [YourIconHere]OutlinedOutlined
} from '@ant-design/icons';

// Professional styling configuration - Standard Across All Forms
const sectionStyles = {
  card: {
    marginBottom: 20,
    borderRadius: 8,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '2px solid #e5e7eb',
  },
  headerIcon: {
    fontSize: 20,
    color: '#0ea5e9',
    marginRight: 10,
    fontWeight: 600,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
  },
};

interface FormPanelProps {
  visible: boolean;
  record: RecordType | null; // null = create mode, object = edit mode
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordFormPanel: React.FC<FormPanelProps> = ({
  visible,
  record,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!record;

  // Load hooks for dropdowns, permissions, etc.
  const { hasPermission } = useAuth();
  const { data: options } = useReferenceDataByCategory(tenantId, 'category');

  // Initialize form on open
  useEffect(() => {
    if (visible && isEditMode && record) {
      form.setFieldsValue(record);
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, record, isEditMode, form]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (isEditMode) {
        await updateRecord(record.id, values);
        message.success('Record updated successfully');
      } else {
        await createRecord(values);
        message.success('Record created successfully');
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
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <[YourIconHere]OutlinedOutlined style={{ color: '#0ea5e9', fontSize: 20 }} />
          <span>{isEditMode ? 'Edit Record' : 'Create New Record'}</span>
        </div>
      }
      placement="right"
      width={600}
      onClose={onClose}
      open={visible}
      styles={{ body: { padding: 0, paddingTop: 24 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button
            size="large"
            icon={<CloseOutlined />}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleSubmit}
            icon={<SaveOutlined />}
          >
            {isEditMode ? 'Update Record' : 'Create Record'}
          </Button>
        </div>
      }
    >
      <div style={{ padding: '0 24px 24px 24px' }}>
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          autoComplete="off"
        >
          {/* Section 1: Basic Information */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <[YourIconHere]OutlinedOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Section Title</h3>
            </div>

            {/* Fields go here */}
            <Form.Item
              label={
                <span>
                  Field Label <Tooltip title="Help text here"><InfoCircleOutlined /></Tooltip>
                </span>
              }
              name="fieldName"
              rules={[
                { required: true, message: 'Field is required' },
                { max: 255, message: 'Max 255 characters' }
              ]}
            >
              <Input
                size="large"
                placeholder="Example placeholder"
                prefix={<IconOutlined />}
                maxLength={255}
                allowClear
              />
            </Form.Item>
          </Card>

          {/* Section 2: Additional Details */}
          <Card style={sectionStyles.card} variant="borderless">
            <div style={sectionStyles.header}>
              <[AnotherIconHere]OutlinedOutlined style={sectionStyles.headerIcon} />
              <h3 style={sectionStyles.headerTitle}>Another Section</h3>
            </div>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Select Field"
                  name="selectField"
                  rules={[{ required: true, message: 'Please select' }]}
                >
                  <Select
                    size="large"
                    placeholder="Select option"
                    options={options}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Another Field"
                  name="anotherField"
                >
                  <Input size="large" placeholder="Optional field" allowClear />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Form>
      </div>
    </Drawer>
  );
};
```

---

## Key Styling Properties

### Drawer
```tsx
<Drawer
  width={600}                                    // Standard width for forms
  placement="right"                              // Always right side
  styles={{ body: { padding: 0, paddingTop: 24 } }} // Zero side padding, 24px top
>
  <div style={{ padding: '0 24px 24px 24px' }}>  // Content wrapper padding
```

### Section Cards
```tsx
const sectionStyles = {
  card: {
    marginBottom: 20,                    // Space between sections
    borderRadius: 8,                     // Modern rounded corners
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)', // Subtle elevation
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,                    // Below section title
    paddingBottom: 12,                   // Above border line
    borderBottom: '2px solid #e5e7eb',   // Section divider
  },
  headerIcon: {
    fontSize: 20,
    color: '#0ea5e9',                   // Consistent primary color
    marginRight: 10,
    fontWeight: 600,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1f2937',                   // Dark gray for contrast
    margin: 0,
  },
};
```

### Form Fields
```tsx
// Text Input - Always use these properties
<Input
  size="large"                           // Consistent sizing
  placeholder="Clear, descriptive text"
  maxLength={255}                        // Match DB column limits
  allowClear                             // User convenience
  prefix={<IconOutlined />}              // Visual indicator
/>

// Select - Always use these properties
<Select
  size="large"
  placeholder="Select option"
  options={mappedOptions}
  allowClear                             // Optional select
/>

// TextArea - With character count
<Input.TextArea
  rows={3}
  maxLength={500}
  showCount                              // Display char count
  allowClear
/>
```

### Footer Buttons
```tsx
footer={
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
    <Button size="large" icon={<CloseOutlined />} onClick={onClose}>
      Cancel
    </Button>
    <Button
      type="primary"
      size="large"
      loading={loading}
      onClick={handleSubmit}
      icon={<SaveOutlined />}
    >
      {isEditMode ? 'Update' : 'Create'}
    </Button>
  </div>
}
```

---

## Color Palette Reference

```tsx
// Primary/Accent Color
const PRIMARY = '#0ea5e9';     // Used for: icons, highlights, active states

// Text Colors
const TEXT_DARK = '#1f2937';    // Section titles, main text
const TEXT_MEDIUM = '#7A8691';  // Helper text, secondary info
const TEXT_LIGHT = '#9EAAB7';   // Tertiary info, metadata

// Borders & Dividers
const BORDER = '#e5e7eb';       // Section borders, dividers

// Backgrounds
const SHADOW = '0 1px 3px rgba(0, 0, 0, 0.08)'; // Card shadows
```

---

## Icon Size Standards

```tsx
// Drawer Title Icon
fontSize: 20      // Large, prominent

// Section Header Icon
fontSize: 20      // Matches title size

// Form Field Prefix
fontSize: 14      // Default, smaller
```

---

## Spacing Standards

```tsx
// Between Sections
marginBottom: 20  // Space between Card sections

// Section Header
marginBottom: 16  // Title to content
paddingBottom: 12 // Title to border

// Field Spacing (Row/Col)
gutter: 16        // Between columns in grid

// Drawer Content
padding: '0 24px 24px 24px'  // Sides and bottom

// Footer Buttons
gap: 8            // Between buttons
```

---

## Typography Standards

```tsx
// Section Headers
fontSize: 15
fontWeight: 600
color: '#1f2937'

// Helper Text / Constraints
fontSize: 12
color: '#7A8691'

// Secondary Metadata
fontSize: 11
color: '#9EAAB7'

// Regular Form Labels
// Use default Ant Design sizing
```

---

## Form Item Rules Template

```tsx
// Required text field with constraints
{
  required: true,
  message: 'Field name is required'
}

// Max length constraint
{
  max: 255,
  message: 'Max 255 characters'
}

// Min length constraint
{
  min: 3,
  message: 'Minimum 3 characters'
}

// Email validation
{
  type: 'email',
  message: 'Invalid email format'
}

// Combined example
rules={[
  { required: true, message: 'Title is required' },
  { min: 5, message: 'Title must be at least 5 characters' },
  { max: 255, message: 'Max 255 characters' }
]}
```

---

## Responsive Grid Pattern

```tsx
// Two-column layout that stacks on mobile
<Row gutter={16}>
  <Col xs={24} sm={12}>
    {/* First column - full width on mobile, half on tablet+ */}
  </Col>
  <Col xs={24} sm={12}>
    {/* Second column - full width on mobile, half on tablet+ */}
  </Col>
</Row>

// Three-column layout
<Row gutter={16}>
  <Col xs={24} sm={12} md={8}>First</Col>
  <Col xs={24} sm={12} md={8}>Second</Col>
  <Col xs={24} sm={12} md={8}>Third</Col>
</Row>
```

---

## Tooltip Pattern

```tsx
// Always pair with InfoCircleOutlined for constraints
<Form.Item
  label={
    <span>
      Label Name
      <Tooltip title="Clear, concise help text">
        <InfoCircleOutlined style={{ marginLeft: 4 }} />
      </Tooltip>
    </span>
  }
/>

// Use for:
// - DB column constraints (max length, required, format)
// - Field purpose and usage
// - Expected format examples
```

---

## Edit Mode Handling

```tsx
// Initialize form with existing data
useEffect(() => {
  if (visible && isEditMode && record) {
    form.setFieldsValue(record);  // Map field names if needed
  } else if (visible) {
    form.resetFields();
  }
}, [visible, record, isEditMode, form]);

// Read-only fields in edit mode
<Input
  disabled={isEditMode}           // Cannot change email, ID, etc.
/>

// Immutable field indicator in label
label={
  <span>
    Email
    <Tooltip title="Cannot change after creation">
      <InfoCircleOutlined />
    </Tooltip>
  </span>
}
```

---

## Permission Checks

```tsx
// Check before showing form
if (!hasPermission('resource:action')) {
  return <Alert type="error" message="Permission denied" />;
}

// Check before showing fields
{shouldShowField && (
  <Form.Item {...props}>
    <Input />
  </Form.Item>
)}

// Disable based on permission
disabled={!hasPermission('resource:edit')}
```

---

## Examples of Compliant Forms

1. **UserFormPanel** - `src/modules/features/user-management/components/UserFormPanel.tsx`
2. **ComplaintsFormPanel** - `src/modules/features/complaints/components/ComplaintsFormPanel.tsx`
3. **ContractFormPanel** - `src/modules/features/contracts/components/ContractFormPanel.tsx`
4. **TicketsFormPanel** - `src/modules/features/tickets/components/TicketsFormPanel.tsx`

---

## Common Mistakes to Avoid

❌ **Don't**: Use different drawer widths (use 600px standard)  
✅ **Do**: Stick to 600px for standard forms, 800px for complex forms

❌ **Don't**: Use `size="middle"` or other Input sizes  
✅ **Do**: Always use `size="large"` for consistency

❌ **Don't**: Skip `allowClear` on inputs  
✅ **Do**: Add `allowClear` for user convenience

❌ **Don't**: Hardcode colors in styles  
✅ **Do**: Use standard color palette (#0ea5e9, #1f2937, #e5e7eb)

❌ **Don't**: Create custom spacing values  
✅ **Do**: Use standard margins (20px sections, 16px gutters, 24px padding)

❌ **Don't**: Forget maxLength on text inputs  
✅ **Do**: Always add maxLength matching DB column constraints

❌ **Don't**: Skip tooltips on constrained fields  
✅ **Do**: Add InfoCircleOutlined tooltip explaining constraints

❌ **Don't**: Use Modal for complex forms  
✅ **Do**: Use Drawer for forms wider than 600px content

---

## Checklist Before Merge

- [ ] Form uses Drawer with title icon
- [ ] All sections in Card containers with styled headers
- [ ] All text inputs have size="large", maxLength, allowClear
- [ ] All selects have size="large", placeholder
- [ ] All constraints have InfoCircleOutlined tooltips
- [ ] Footer buttons are size="large" with proper spacing
- [ ] Form has requiredMark="optional"
- [ ] Responsive grid layout with xs/sm/md breakpoints
- [ ] Edit mode populates form with existing data
- [ ] Loading states managed properly
- [ ] Error messages are descriptive
- [ ] Colors match standard palette
- [ ] Spacing matches standard values (20px, 16px, 24px)
- [ ] Icons are 20px in headers, consistent throughout
- [ ] No hardcoded color values
- [ ] No custom spacing values
- [ ] Builds without errors
- [ ] Mobile responsive tested

---

## Questions?

Refer to the reference implementations or the complete style guide at:
`USER_MANAGEMENT_FORMS_CONSISTENCY_COMPLETE.md`

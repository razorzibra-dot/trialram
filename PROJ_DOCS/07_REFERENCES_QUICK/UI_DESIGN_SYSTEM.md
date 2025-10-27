# Enterprise UI/UX Design System

## Overview

This document describes the comprehensive enterprise-grade design system implemented for the CRM application. The design is inspired by Salesforce and follows modern professional standards with Ant Design as the component library.

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Components](#components)
5. [Layout System](#layout-system)
6. [Usage Guidelines](#usage-guidelines)
7. [Consistency Rules](#consistency-rules)

---

## Design Philosophy

### Core Principles

1. **Professional & Clean**: Enterprise-grade appearance suitable for business applications
2. **Consistent**: Uniform look and feel across all pages (Admin, Super Admin, Regular Users)
3. **Accessible**: WCAG 2.1 AA compliant with proper contrast ratios
4. **Responsive**: Mobile-first design that works on all screen sizes
5. **Performant**: Optimized for fast loading and smooth interactions

### Design Inspiration

- **Salesforce**: Clean, professional CRM interface
- **Modern SaaS**: Contemporary design patterns
- **Material Design**: Elevation and depth principles
- **Enterprise Standards**: Professional business application aesthetics

---

## Color System

### Primary Colors

```css
Primary Blue: #1B7CED (Main brand color)
Primary Dark: #0B5FD1
Primary Light: #4D9EFF
```

### Neutral Colors

```css
Gray 50:  #F9FAFB (Background)
Gray 100: #F3F4F6 (Subtle background)
Gray 200: #E5E7EB (Borders)
Gray 300: #D1D5DB (Dividers)
Gray 400: #9CA3AF (Disabled text)
Gray 500: #6B7280 (Secondary text)
Gray 600: #4B5563 (Body text)
Gray 700: #374151 (Labels)
Gray 800: #1F2937 (Headings)
Gray 900: #111827 (Primary text)
```

### Semantic Colors

```css
Success: #10B981 (Green)
Warning: #F97316 (Orange)
Error:   #EF4444 (Red)
Info:    #3B82F6 (Blue)
```

### Usage Guidelines

- **Primary Blue**: Buttons, links, active states, brand elements
- **Neutral Grays**: Text, backgrounds, borders, dividers
- **Success Green**: Positive actions, completed states, growth indicators
- **Warning Orange**: Caution states, pending actions, attention needed
- **Error Red**: Errors, destructive actions, decline indicators
- **Info Blue**: Informational messages, help text, neutral actions

---

## Typography

### Font Family

```css
Primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
Monospace: 'JetBrains Mono', 'SF Mono', Monaco, monospace
```

### Font Sizes

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| Display | 48px | 800 | 1.1 | Hero sections |
| H1 | 38px | 700 | 1.2 | Page titles |
| H2 | 30px | 600 | 1.25 | Section titles |
| H3 | 24px | 600 | 1.3 | Subsection titles |
| H4 | 20px | 600 | 1.35 | Card titles |
| H5 | 16px | 600 | 1.4 | Small headings |
| H6 | 14px | 600 | 1.5 | Labels |
| Body Large | 16px | 400 | 1.6 | Large body text |
| Body | 14px | 400 | 1.5715 | Default body text |
| Body Small | 13px | 400 | 1.5 | Small body text |
| Caption | 12px | 500 | 1.4 | Captions, metadata |
| Overline | 11px | 600 | 1.3 | Uppercase labels |

### Typography Rules

1. **Headings**: Use semantic HTML tags (h1-h6)
2. **Body Text**: Default size is 14px
3. **Line Height**: Maintain 1.5715 for body text
4. **Letter Spacing**: Negative for large text, positive for small caps
5. **Font Weight**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

---

## Components

### Core Components

#### 1. PageHeader

Professional page header with breadcrumb, title, description, and actions.

```tsx
import { PageHeader } from '@/components/common/PageHeader';

<PageHeader
  title="Dashboard"
  description="Welcome back! Here's what's happening today."
  breadcrumb={[
    { title: 'Home', href: '/' },
    { title: 'Dashboard' },
  ]}
  extra={
    <Button type="primary">New Customer</Button>
  }
/>
```

**Features:**
- Consistent header across all pages
- Breadcrumb navigation
- Action buttons in header
- Optional back button

#### 2. StatCard

Statistics card for dashboards with trend indicators.

```tsx
import { StatCard } from '@/components/common/StatCard';
import { Users } from 'lucide-react';

<StatCard
  title="Total Customers"
  value={1234}
  description="Active customers"
  icon={Users}
  trend={{ value: 12.5, isPositive: true }}
  color="primary"
/>
```

**Features:**
- Icon support
- Trend indicators (up/down)
- Color variants
- Loading state
- Hover effects

#### 3. DataTable

Enterprise-grade data table with search, filters, and export.

```tsx
import { DataTable } from '@/components/common/DataTable';

<DataTable
  title="Customers"
  description="Manage your customer database"
  columns={columns}
  dataSource={data}
  showSearch
  onSearch={handleSearch}
  showRefresh
  onRefresh={handleRefresh}
  showExport
  onExport={handleExport}
/>
```

**Features:**
- Built-in search
- Refresh button
- Export functionality
- Pagination
- Sorting and filtering
- Responsive design

#### 4. EmptyState

Professional empty state for tables and lists.

```tsx
import { EmptyState } from '@/components/common/EmptyState';

<EmptyState
  title="No customers found"
  description="Get started by adding your first customer"
  action={{
    text: 'Add Customer',
    onClick: handleAddCustomer,
  }}
/>
```

**Features:**
- Custom icon/image
- Action button
- Descriptive text
- Consistent styling

#### 5. EnterpriseLayout

Main application layout with sidebar navigation.

```tsx
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';

<EnterpriseLayout>
  {/* Your page content */}
</EnterpriseLayout>
```

**Features:**
- Collapsible sidebar
- Role-based navigation
- User profile dropdown
- Notifications badge
- Breadcrumb navigation
- Responsive design

### Ant Design Components

All Ant Design components are pre-configured with the enterprise theme:

- **Button**: Primary, default, text, link variants
- **Input**: Text, textarea, password, search
- **Select**: Single, multiple, searchable
- **Table**: Sortable, filterable, paginated
- **Card**: Bordered, borderless, with actions
- **Modal**: Confirmation, form, info
- **Drawer**: Side panel for forms
- **Form**: Validation, layout options
- **Menu**: Sidebar, dropdown, context
- **Badge**: Counts, status dots
- **Tag**: Status, category labels
- **Alert**: Info, success, warning, error
- **Message**: Toast notifications
- **Notification**: Rich notifications

---

## Layout System

### Grid System

Uses Ant Design's 24-column grid system:

```tsx
<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} lg={6}>
    {/* 1/4 width on large screens */}
  </Col>
  <Col xs={24} sm={12} lg={6}>
    {/* 1/4 width on large screens */}
  </Col>
  <Col xs={24} sm={12} lg={6}>
    {/* 1/4 width on large screens */}
  </Col>
  <Col xs={24} sm={12} lg={6}>
    {/* 1/4 width on large screens */}
  </Col>
</Row>
```

### Breakpoints

```css
xs: 480px   (Mobile)
sm: 576px   (Small tablet)
md: 768px   (Tablet)
lg: 992px   (Desktop)
xl: 1200px  (Large desktop)
xxl: 1600px (Extra large)
```

### Spacing System

```css
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
```

### Page Structure

```tsx
<EnterpriseLayout>
  <PageHeader
    title="Page Title"
    description="Page description"
    breadcrumb={breadcrumbItems}
    extra={<Button>Action</Button>}
  />
  
  <div style={{ padding: 24 }}>
    {/* Page content */}
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card>
          {/* Content */}
        </Card>
      </Col>
    </Row>
  </div>
</EnterpriseLayout>
```

---

## Usage Guidelines

### 1. Page Structure

Every page should follow this structure:

```tsx
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PageHeader } from '@/components/common/PageHeader';

export const MyPage: React.FC = () => {
  return (
    <EnterpriseLayout>
      <PageHeader
        title="Page Title"
        description="Page description"
      />
      <div style={{ padding: 24 }}>
        {/* Your content */}
      </div>
    </EnterpriseLayout>
  );
};
```

### 2. Cards

Use cards for grouping related content:

```tsx
<Card
  title="Card Title"
  extra={<Button type="link">View All</Button>}
  bordered={false}
  style={{
    borderRadius: 8,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  }}
>
  {/* Card content */}
</Card>
```

### 3. Forms

Use Ant Design Form with consistent styling:

```tsx
<Form
  layout="vertical"
  form={form}
  onFinish={handleSubmit}
>
  <Form.Item
    label="Customer Name"
    name="name"
    rules={[{ required: true }]}
  >
    <Input placeholder="Enter customer name" />
  </Form.Item>
  
  <Form.Item>
    <Space>
      <Button type="primary" htmlType="submit">
        Save
      </Button>
      <Button onClick={handleCancel}>
        Cancel
      </Button>
    </Space>
  </Form.Item>
</Form>
```

### 4. Tables

Use DataTable component for all data tables:

```tsx
<DataTable
  title="Customers"
  columns={columns}
  dataSource={data}
  showSearch
  onSearch={handleSearch}
  pagination={{
    pageSize: 10,
    showSizeChanger: true,
  }}
/>
```

### 5. Buttons

Follow button hierarchy:

```tsx
// Primary action
<Button type="primary">Save</Button>

// Secondary action
<Button>Cancel</Button>

// Tertiary action
<Button type="text">View Details</Button>

// Danger action
<Button danger>Delete</Button>
```

### 6. Status Indicators

Use consistent status colors:

```tsx
// Success
<Tag color="success">Active</Tag>

// Warning
<Tag color="warning">Pending</Tag>

// Error
<Tag color="error">Inactive</Tag>

// Info
<Tag color="processing">In Progress</Tag>
```

---

## Consistency Rules

### 1. Always Use EnterpriseLayout

Every page must be wrapped in `EnterpriseLayout`:

```tsx
✅ Correct:
<EnterpriseLayout>
  <PageHeader title="Dashboard" />
  {/* content */}
</EnterpriseLayout>

❌ Incorrect:
<div>
  <h1>Dashboard</h1>
  {/* content */}
</div>
```

### 2. Always Use PageHeader

Every page must have a `PageHeader`:

```tsx
✅ Correct:
<PageHeader
  title="Customers"
  description="Manage your customers"
/>

❌ Incorrect:
<h1>Customers</h1>
<p>Manage your customers</p>
```

### 3. Use Consistent Spacing

Always use the spacing system:

```tsx
✅ Correct:
<div style={{ padding: 24 }}>
<Row gutter={[16, 16]}>

❌ Incorrect:
<div style={{ padding: '20px' }}>
<Row gutter={15}>
```

### 4. Use Ant Design Components

Always use Ant Design components instead of HTML elements:

```tsx
✅ Correct:
<Button type="primary">Click Me</Button>
<Input placeholder="Enter text" />
<Card title="Title">Content</Card>

❌ Incorrect:
<button>Click Me</button>
<input placeholder="Enter text" />
<div className="card">Content</div>
```

### 5. Follow Color System

Always use defined colors:

```tsx
✅ Correct:
<div style={{ color: '#111827' }}>
<Tag color="success">Active</Tag>

❌ Incorrect:
<div style={{ color: '#000' }}>
<Tag color="green">Active</Tag>
```

### 6. Use Typography Classes

Use defined typography classes:

```tsx
✅ Correct:
<h1>Page Title</h1>
<p className="text-body">Body text</p>

❌ Incorrect:
<div style={{ fontSize: 32, fontWeight: 'bold' }}>Title</div>
<div style={{ fontSize: 14 }}>Body text</div>
```

### 7. Maintain Responsive Design

Always consider mobile layouts:

```tsx
✅ Correct:
<Col xs={24} sm={12} lg={6}>

❌ Incorrect:
<Col span={6}>
```

---

## File Structure

```
src/
├── theme/
│   └── antdTheme.ts              # Ant Design theme configuration
├── styles/
│   └── enterprise.css            # Global enterprise styles
├── components/
│   ├── layout/
│   │   └── EnterpriseLayout.tsx  # Main layout component
│   ├── common/
│   │   ├── PageHeader.tsx        # Page header component
│   │   ├── StatCard.tsx          # Statistics card
│   │   ├── DataTable.tsx         # Data table component
│   │   └── EmptyState.tsx        # Empty state component
│   └── providers/
│       └── AntdConfigProvider.tsx # Ant Design config provider
└── modules/
    └── features/
        └── [feature]/
            └── views/
                └── [Page].tsx     # Feature pages
```

---

## Migration Guide

### For Existing Pages

1. **Wrap with EnterpriseLayout**:
   ```tsx
   import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
   
   export const MyPage = () => (
     <EnterpriseLayout>
       {/* existing content */}
     </EnterpriseLayout>
   );
   ```

2. **Add PageHeader**:
   ```tsx
   import { PageHeader } from '@/components/common/PageHeader';
   
   <PageHeader
     title="My Page"
     description="Page description"
   />
   ```

3. **Replace Custom Components**:
   - Replace custom tables with `DataTable`
   - Replace custom cards with Ant Design `Card`
   - Replace custom buttons with Ant Design `Button`
   - Replace custom forms with Ant Design `Form`

4. **Update Styling**:
   - Remove inline styles
   - Use Ant Design props
   - Use enterprise CSS classes

---

## Best Practices

### 1. Component Composition

Build pages by composing reusable components:

```tsx
<EnterpriseLayout>
  <PageHeader {...headerProps} />
  <div style={{ padding: 24 }}>
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <StatCard {...statProps} />
      </Col>
      <Col span={24}>
        <DataTable {...tableProps} />
      </Col>
    </Row>
  </div>
</EnterpriseLayout>
```

### 2. Consistent Spacing

Use the spacing system consistently:

```tsx
// Padding
style={{ padding: 24 }}        // Page content
style={{ padding: 16 }}        // Card content
style={{ padding: 8 }}         // Small spacing

// Margins
style={{ marginBottom: 24 }}   // Section spacing
style={{ marginBottom: 16 }}   // Element spacing
style={{ marginBottom: 8 }}    // Small spacing

// Gaps
<Row gutter={[16, 16]}>        // Grid gaps
<Space size="middle">          // Element gaps
```

### 3. Loading States

Always show loading states:

```tsx
<StatCard loading={isLoading} {...props} />
<Card loading={isLoading}>Content</Card>
<Table loading={isLoading} {...props} />
```

### 4. Error Handling

Show user-friendly error messages:

```tsx
import { message } from 'antd';

try {
  await saveData();
  message.success('Data saved successfully');
} catch (error) {
  message.error('Failed to save data');
}
```

### 5. Accessibility

Ensure accessibility:

```tsx
// Use semantic HTML
<Button aria-label="Close">×</Button>

// Provide alt text
<Avatar alt="User name" />

// Use proper form labels
<Form.Item label="Email">
  <Input type="email" />
</Form.Item>
```

---

## Support

For questions or issues with the design system:

1. Check this documentation
2. Review example pages in `src/modules/features/dashboard/views/DashboardPageNew.tsx`
3. Check Ant Design documentation: https://ant.design/
4. Contact the development team

---

## Changelog

### Version 1.0.0 (Current)

- Initial enterprise design system
- Ant Design integration
- Salesforce-inspired theme
- Core components (PageHeader, StatCard, DataTable, EmptyState)
- EnterpriseLayout with sidebar navigation
- Comprehensive color system
- Typography system
- Responsive grid system
- Documentation

---

## Future Enhancements

- Dark mode support
- Additional color themes
- More reusable components
- Animation library
- Icon system
- Illustration library
- Design tokens
- Storybook integration
- Accessibility testing tools
- Performance monitoring
# 🚀 UI/UX Quick Reference Card

**Quick reference for migrating pages to the new enterprise design system**

---

## 📦 Essential Imports

```tsx
// Layout & Common Components
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PageHeader, StatCard, DataTable, EmptyState } from '@/components/common';

// Ant Design Components
import { Row, Col, Card, Button, Table, Form, Input, Select, Space } from 'antd';

// Ant Design Icons
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';

// Lucide Icons (for StatCard)
import { Users, DollarSign, TrendingUp, Target } from 'lucide-react';
```

---

## 🏗️ Basic Page Structure

```tsx
export const MyPage: React.FC = () => {
  return (
    <EnterpriseLayout>
      <PageHeader
        title="Page Title"
        description="Page description"
        breadcrumb={{
          items: [
            { title: 'Dashboard', path: '/tenant/dashboard' },
            { title: 'Current Page' }
          ]
        }}
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            Action
          </Button>
        }
      />

      <div style={{ padding: 24 }}>
        {/* Your content here */}
      </div>
    </EnterpriseLayout>
  );
};
```

---

## 📊 Statistics Grid

```tsx
<Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
  <Col xs={24} sm={12} lg={6}>
    <StatCard
      title="Total Users"
      value={1234}
      description="Active users"
      icon={Users}
      color="primary"
      trend={{ value: 12.5, isPositive: true }}
    />
  </Col>
  <Col xs={24} sm={12} lg={6}>
    <StatCard
      title="Revenue"
      value="$45,231"
      icon={DollarSign}
      color="success"
    />
  </Col>
</Row>
```

---

## 🎨 Color Options

**StatCard colors:**
- `primary` - Blue (#1B7CED)
- `success` - Green (#10B981)
- `warning` - Orange (#F97316)
- `error` - Red (#EF4444)
- `info` - Light Blue (#3B82F6)

---

## 📱 Responsive Grid

```tsx
<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} lg={8}>
    {/* Full width on mobile, half on tablet, third on desktop */}
  </Col>
  <Col xs={24} sm={12} lg={8}>
    {/* Content */}
  </Col>
  <Col xs={24} sm={12} lg={8}>
    {/* Content */}
  </Col>
</Row>
```

**Breakpoints:**
- `xs` - Mobile (0px+)
- `sm` - Tablet (576px+)
- `md` - Small Desktop (768px+)
- `lg` - Desktop (992px+)
- `xl` - Large Desktop (1200px+)

---

## 🃏 Card Component

```tsx
// Simple Card
<Card title="Card Title" bordered={false}>
  Content here
</Card>

// Card with Extra Actions
<Card 
  title="Card Title" 
  bordered={false}
  extra={<Button type="link">More</Button>}
>
  Content here
</Card>

// Loading Card
<Card loading={isLoading}>
  Content here
</Card>
```

---

## 🔘 Button Variants

```tsx
// Primary Button
<Button type="primary" icon={<PlusOutlined />}>
  Add New
</Button>

// Default Button
<Button icon={<EditOutlined />}>
  Edit
</Button>

// Text Button
<Button type="text" icon={<DeleteOutlined />}>
  Delete
</Button>

// Link Button
<Button type="link">
  View Details
</Button>

// Danger Button
<Button danger>
  Delete
</Button>
```

---

## 📋 Data Table

```tsx
<DataTable
  title="Customers"
  columns={columns}
  dataSource={data}
  loading={isLoading}
  showSearch
  onSearch={handleSearch}
  onRefresh={handleRefresh}
  extra={
    <Button type="primary" icon={<PlusOutlined />}>
      Add New
    </Button>
  }
/>
```

---

## 📝 Form Layout

```tsx
<Form layout="vertical" onFinish={handleSubmit}>
  <Row gutter={16}>
    <Col xs={24} lg={12}>
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: 'Please enter name' }]}
      >
        <Input placeholder="Enter name" />
      </Form.Item>
    </Col>
    <Col xs={24} lg={12}>
      <Form.Item label="Email" name="email">
        <Input type="email" placeholder="Enter email" />
      </Form.Item>
    </Col>
  </Row>
  
  <Form.Item>
    <Space>
      <Button type="primary" htmlType="submit">
        Submit
      </Button>
      <Button onClick={handleCancel}>
        Cancel
      </Button>
    </Space>
  </Form.Item>
</Form>
```

---

## 🎯 Common Patterns

### Loading State
```tsx
{isLoading ? (
  <Spin tip="Loading..." />
) : (
  <div>Content</div>
)}
```

### Empty State
```tsx
{data.length === 0 ? (
  <EmptyState
    title="No data found"
    description="Get started by adding your first item"
    action={
      <Button type="primary" icon={<PlusOutlined />}>
        Add Item
      </Button>
    }
  />
) : (
  <div>Content</div>
)}
```

### Error State
```tsx
<Alert
  message="Error"
  description="Something went wrong. Please try again."
  type="error"
  showIcon
  closable
/>
```

---

## 🎨 Spacing

**Use inline styles for spacing:**

```tsx
// Padding
<div style={{ padding: 24 }}>Content</div>

// Margin
<div style={{ marginBottom: 24 }}>Content</div>

// Space between elements
<Space direction="vertical" size="large" style={{ width: '100%' }}>
  <div>Item 1</div>
  <div>Item 2</div>
</Space>
```

**Standard spacing values:**
- Small: 8px
- Medium: 16px
- Large: 24px
- XLarge: 32px

---

## 🏷️ Badges & Tags

```tsx
// Badge
<Badge status="success" text="Active" />
<Badge status="error" text="Inactive" />
<Badge status="processing" text="In Progress" />
<Badge status="warning" text="Pending" />

// Tag
<Tag color="blue">Tag</Tag>
<Tag color="green">Success</Tag>
<Tag color="red">Error</Tag>
<Tag color="orange">Warning</Tag>
```

---

## 🔍 Search & Filter

```tsx
<Space style={{ marginBottom: 16 }}>
  <Input.Search
    placeholder="Search..."
    onSearch={handleSearch}
    style={{ width: 200 }}
  />
  <Select
    placeholder="Filter by status"
    style={{ width: 150 }}
    onChange={handleFilter}
  >
    <Select.Option value="all">All</Select.Option>
    <Select.Option value="active">Active</Select.Option>
    <Select.Option value="inactive">Inactive</Select.Option>
  </Select>
</Space>
```

---

## ✅ Migration Checklist

Quick checklist for each page:

```
[ ] Import EnterpriseLayout
[ ] Import PageHeader
[ ] Import Ant Design components
[ ] Wrap page in EnterpriseLayout
[ ] Add PageHeader with title & description
[ ] Replace grid classes with Row/Col
[ ] Replace custom components with Ant Design
[ ] Use StatCard for statistics
[ ] Add consistent padding (24px)
[ ] Use consistent spacing (16px gutters)
[ ] Test on mobile (xs)
[ ] Test on tablet (sm)
[ ] Test on desktop (lg)
[ ] Remove Tailwind classes
[ ] Remove unused imports
```

---

## 🚫 Common Mistakes

### ❌ DON'T
```tsx
// Don't use Tailwind classes
<div className="p-6 space-y-6">

// Don't use old components
import { Card } from '@/components/ui/card';

// Don't use plain divs for grid
<div className="grid grid-cols-4 gap-4">
```

### ✅ DO
```tsx
// Use inline styles
<div style={{ padding: 24 }}>

// Use Ant Design components
import { Card } from 'antd';

// Use Row/Col for grid
<Row gutter={[16, 16]}>
  <Col xs={24} lg={6}>
```

---

## 📚 Quick Links

- **Full Documentation**: [UI_DESIGN_SYSTEM.md](./UI_DESIGN_SYSTEM.md)
- **Quick Start Guide**: [UI_QUICK_START.md](./UI_QUICK_START.md)
- **Migration Progress**: [UI_MIGRATION_PROGRESS.md](./UI_MIGRATION_PROGRESS.md)
- **Ant Design Docs**: https://ant.design/
- **Example Page**: `src/modules/features/dashboard/views/DashboardPageNew.tsx`

---

## 🛠️ Migration Helper

```bash
# Analyze a page
node scripts/migrate-page-ui.js src/modules/features/your-page/YourPage.tsx
```

---

## 💡 Pro Tips

1. **Always use EnterpriseLayout** - Every page needs it
2. **Always use PageHeader** - Consistency is key
3. **Use Row/Col for all grids** - Responsive by default
4. **Use StatCard for metrics** - Professional look
5. **Test on mobile first** - Mobile-first approach
6. **Use consistent spacing** - 24px padding, 16px gutters
7. **Remove all Tailwind** - Use Ant Design only
8. **Check the examples** - Learn from migrated pages

---

**Keep this reference handy while migrating pages!** 🚀

---

**Version**: 1.0.0  
**Last Updated**: 2024
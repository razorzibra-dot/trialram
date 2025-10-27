# UI/UX Quick Start Guide

## 🚀 Getting Started with the New Design System

This guide will help you quickly start using the new enterprise design system in your pages.

---

## 📦 Installation

The design system is already installed. No additional setup required!

**Included Libraries:**
- ✅ Ant Design (antd)
- ✅ Ant Design Icons (@ant-design/icons)
- ✅ Ant Design Pro Components (@ant-design/pro-components)
- ✅ Lucide React (for additional icons)
- ✅ Day.js (for date handling)

---

## 🎨 Basic Page Template

Copy this template to create a new page:

```tsx
import React from 'react';
import { Row, Col, Card, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PageHeader, DataTable } from '@/components/common';

export const MyPage: React.FC = () => {
  return (
    <EnterpriseLayout>
      {/* Page Header */}
      <PageHeader
        title="My Page"
        description="Page description goes here"
        breadcrumb={[
          { title: 'Home', href: '/' },
          { title: 'My Page' },
        ]}
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            New Item
          </Button>
        }
      />

      {/* Page Content */}
      <div style={{ padding: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              title="Content Card"
              bordered={false}
              style={{
                borderRadius: 8,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              }}
            >
              {/* Your content here */}
            </Card>
          </Col>
        </Row>
      </div>
    </EnterpriseLayout>
  );
};

export default MyPage;
```

---

## 📊 Dashboard Page Template

For dashboard pages with statistics:

```tsx
import React from 'react';
import { Row, Col } from 'antd';
import { Users, DollarSign, Target, Activity } from 'lucide-react';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PageHeader, StatCard } from '@/components/common';

export const DashboardPage: React.FC = () => {
  return (
    <EnterpriseLayout>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's your overview."
      />

      <div style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Users"
              value={1234}
              description="Active users"
              icon={Users}
              trend={{ value: 12.5, isPositive: true }}
              color="primary"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Revenue"
              value="$45,231"
              description="This month"
              icon={DollarSign}
              trend={{ value: 8.2, isPositive: true }}
              color="success"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Active Deals"
              value={89}
              description="In pipeline"
              icon={Target}
              trend={{ value: 3.1, isPositive: false }}
              color="warning"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Activity"
              value={342}
              description="This week"
              icon={Activity}
              trend={{ value: 15.3, isPositive: true }}
              color="info"
            />
          </Col>
        </Row>
      </div>
    </EnterpriseLayout>
  );
};
```

---

## 📋 List Page Template

For pages with data tables:

```tsx
import React, { useState } from 'react';
import { Button, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PageHeader, DataTable } from '@/components/common';

interface DataType {
  id: string;
  name: string;
  email: string;
  status: string;
}

export const ListPage: React.FC = () => {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(false);

  const columns: ColumnsType<DataType> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const handleEdit = (record: DataType) => {
    console.log('Edit:', record);
  };

  const handleDelete = (record: DataType) => {
    console.log('Delete:', record);
  };

  const handleSearch = (value: string) => {
    console.log('Search:', value);
  };

  const handleRefresh = () => {
    console.log('Refresh');
  };

  return (
    <EnterpriseLayout>
      <PageHeader
        title="Items"
        description="Manage your items"
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            Add Item
          </Button>
        }
      />

      <div style={{ padding: 24 }}>
        <DataTable
          title="All Items"
          description="View and manage all items"
          columns={columns}
          dataSource={data}
          loading={loading}
          showSearch
          onSearch={handleSearch}
          showRefresh
          onRefresh={handleRefresh}
          rowKey="id"
        />
      </div>
    </EnterpriseLayout>
  );
};
```

---

## 📝 Form Page Template

For pages with forms:

```tsx
import React from 'react';
import { Form, Input, Select, Button, Space, Card } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PageHeader } from '@/components/common';

export const FormPage: React.FC = () => {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
  };

  const handleCancel = () => {
    form.resetFields();
  };

  return (
    <EnterpriseLayout>
      <PageHeader
        title="Create Item"
        description="Fill in the details below"
        showBack
      />

      <div style={{ padding: 24 }}>
        <Card
          bordered={false}
          style={{
            maxWidth: 800,
            margin: '0 auto',
            borderRadius: 8,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, message: 'Please enter name' }]}
            >
              <Input placeholder="Enter name" size="large" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter valid email' },
              ]}
            >
              <Input placeholder="Enter email" size="large" />
            </Form.Item>

            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select placeholder="Select status" size="large">
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Description"
              name="description"
            >
              <Input.TextArea
                rows={4}
                placeholder="Enter description"
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  size="large"
                >
                  Save
                </Button>
                <Button size="large" onClick={handleCancel}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </EnterpriseLayout>
  );
};
```

---

## 🎯 Common Patterns

### 1. Loading State

```tsx
import { Spin } from 'antd';

{loading ? (
  <div style={{ textAlign: 'center', padding: 48 }}>
    <Spin size="large" />
  </div>
) : (
  <YourContent />
)}
```

### 2. Empty State

```tsx
import { EmptyState } from '@/components/common';

<EmptyState
  title="No items found"
  description="Get started by adding your first item"
  action={{
    text: 'Add Item',
    onClick: handleAdd,
  }}
/>
```

### 3. Confirmation Dialog

```tsx
import { Modal } from 'antd';

const handleDelete = () => {
  Modal.confirm({
    title: 'Are you sure?',
    content: 'This action cannot be undone.',
    okText: 'Yes, delete',
    okType: 'danger',
    cancelText: 'Cancel',
    onOk: () => {
      // Delete logic
    },
  });
};
```

### 4. Success Message

```tsx
import { message } from 'antd';

const handleSave = async () => {
  try {
    await saveData();
    message.success('Saved successfully');
  } catch (error) {
    message.error('Failed to save');
  }
};
```

### 5. Notification

```tsx
import { notification } from 'antd';

notification.success({
  message: 'Success',
  description: 'Your changes have been saved.',
  placement: 'topRight',
});
```

---

## 🎨 Styling Tips

### 1. Card Styling

```tsx
<Card
  bordered={false}
  style={{
    borderRadius: 8,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  }}
>
  Content
</Card>
```

### 2. Button Hierarchy

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

### 3. Status Tags

```tsx
<Tag color="success">Active</Tag>
<Tag color="warning">Pending</Tag>
<Tag color="error">Inactive</Tag>
<Tag color="processing">In Progress</Tag>
```

### 4. Spacing

```tsx
// Page padding
<div style={{ padding: 24 }}>

// Grid gaps
<Row gutter={[16, 16]}>

// Element spacing
<Space size="middle">
```

---

## 📱 Responsive Design

Always use responsive columns:

```tsx
<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} lg={8} xl={6}>
    {/* 1 column on mobile, 2 on tablet, 3 on desktop, 4 on large */}
  </Col>
</Row>
```

**Breakpoints:**
- `xs`: < 576px (Mobile)
- `sm`: ≥ 576px (Tablet)
- `md`: ≥ 768px (Tablet landscape)
- `lg`: ≥ 992px (Desktop)
- `xl`: ≥ 1200px (Large desktop)
- `xxl`: ≥ 1600px (Extra large)

---

## 🔍 Common Imports

```tsx
// Layout
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';

// Common Components
import { PageHeader, StatCard, DataTable, EmptyState } from '@/components/common';

// Ant Design Components
import { 
  Button, 
  Card, 
  Form, 
  Input, 
  Select, 
  Table, 
  Modal, 
  message,
  notification,
  Space,
  Row,
  Col,
  Tag,
  Badge,
  Avatar,
  Dropdown,
  Menu,
} from 'antd';

// Ant Design Icons
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DownloadOutlined,
  UploadOutlined,
  SettingOutlined,
} from '@ant-design/icons';

// Lucide Icons (for StatCard)
import { Users, DollarSign, Target, Activity } from 'lucide-react';
```

---

## ✅ Checklist for New Pages

- [ ] Wrapped in `EnterpriseLayout`
- [ ] Has `PageHeader` with title and description
- [ ] Uses Ant Design components
- [ ] Follows color system
- [ ] Uses consistent spacing (padding: 24)
- [ ] Responsive grid layout
- [ ] Loading states implemented
- [ ] Error handling with messages
- [ ] Proper TypeScript types
- [ ] Accessible (labels, aria attributes)

---

## 🆘 Need Help?

1. **Check Documentation**: `docs/UI_DESIGN_SYSTEM.md`
2. **View Examples**: `src/modules/features/dashboard/views/DashboardPageNew.tsx`
3. **Ant Design Docs**: https://ant.design/components/overview/
4. **Ask Team**: Contact development team

---

## 🎉 You're Ready!

Start building beautiful, consistent pages with the enterprise design system!

**Next Steps:**
1. Copy a template above
2. Customize for your needs
3. Follow the consistency rules
4. Test on different screen sizes
5. Submit for review

Happy coding! 🚀
# Developer Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- VS Code (recommended)

### Installation
```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd CRMV7_github

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup
Create a `.env` file in the root directory:
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK_API=true

# Authentication
VITE_AUTH_TOKEN_KEY=crm_auth_token
VITE_AUTH_REFRESH_TOKEN_KEY=crm_refresh_token

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
```

---

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components (PageHeader, etc.)
│   ├── layout/         # Layout components (EnterpriseLayout)
│   └── ui/             # UI primitives (Button, Input, etc.)
├── modules/
│   ├── core/           # Core functionality
│   └── features/       # Feature modules
│       ├── admin/      # Admin portal pages
│       ├── super-admin/# Super admin portal pages
│       ├── customers/  # Customer management
│       ├── tickets/    # Ticket management
│       ├── service-contracts/ # Contract management
│       └── ...         # Other features
├── services/           # API services
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── App.tsx             # Main application component
```

---

## 🎯 Key Concepts

### 1. Service Layer Pattern

All API calls go through service files:

```typescript
// services/exampleService.ts
import { apiClient } from './apiClient';

export const exampleService = {
  getAll: async () => {
    const response = await apiClient.get('/examples');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await apiClient.get(`/examples/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await apiClient.post('/examples', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/examples/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    await apiClient.delete(`/examples/${id}`);
  },
};
```

### 2. Page Component Pattern

Standard page structure:

```typescript
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message } from 'antd';
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';
import { PageHeader } from '@/components/common';
import { exampleService } from '@/services/exampleService';

export const ExamplePage: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await exampleService.getAll();
      setData(result);
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EnterpriseLayout>
      <PageHeader
        title="Example Page"
        description="Page description"
        breadcrumb={{
          items: [
            { title: 'Home', path: '/' },
            { title: 'Example' },
          ],
        }}
        extra={[
          <Button key="create" type="primary">
            Create New
          </Button>,
        ]}
      />

      <div style={{ padding: 24 }}>
        <Card>
          <Table
            dataSource={data}
            loading={loading}
            rowKey="id"
          />
        </Card>
      </div>
    </EnterpriseLayout>
  );
};
```

### 3. Modal Pattern

Create/Edit modals:

```typescript
const [modalVisible, setModalVisible] = useState(false);
const [form] = Form.useForm();

const handleSubmit = async (values: any) => {
  try {
    await exampleService.create(values);
    message.success('Created successfully');
    setModalVisible(false);
    form.resetFields();
    loadData();
  } catch (error) {
    message.error('Failed to create');
  }
};

return (
  <>
    <Button onClick={() => setModalVisible(true)}>
      Create New
    </Button>

    <Modal
      title="Create Example"
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  </>
);
```

### 4. Permission Checks

Use the `useAuth` hook:

```typescript
import { useAuth } from '@/hooks/useAuth';

const { hasPermission } = useAuth();

// In render
{hasPermission('write') && (
  <Button onClick={handleEdit}>Edit</Button>
)}

// In function
const handleDelete = () => {
  if (!hasPermission('delete')) {
    message.error('Insufficient permissions');
    return;
  }
  // ... delete logic
};
```

---

## 🛠️ Common Tasks

### Adding a New Page

1. **Create the page component:**
```typescript
// src/modules/features/example/views/ExamplePage.tsx
export const ExamplePage: React.FC = () => {
  // ... component code
};
```

2. **Create routes:**
```typescript
// src/modules/features/example/routes.tsx
import { lazy } from 'react';

const ExamplePage = lazy(() => import('./views/ExamplePage'));

export const exampleRoutes = [
  {
    path: 'example',
    element: <ExamplePage />,
  },
];
```

3. **Register routes:**
```typescript
// src/App.tsx or router configuration
import { exampleRoutes } from './modules/features/example/routes';

// Add to routes array
```

### Adding a New Service

1. **Create service file:**
```typescript
// src/services/exampleService.ts
export const exampleService = {
  // ... service methods
};
```

2. **Add TypeScript types:**
```typescript
// src/types/example.ts
export interface Example {
  id: string;
  name: string;
  // ... other fields
}
```

3. **Use in components:**
```typescript
import { exampleService } from '@/services/exampleService';
```

### Adding Mock Data

1. **Check environment variable:**
```typescript
const useMockApi = import.meta.env.VITE_USE_MOCK_API === 'true';
```

2. **Return mock data:**
```typescript
export const exampleService = {
  getAll: async () => {
    if (useMockApi) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return [
        { id: '1', name: 'Example 1' },
        { id: '2', name: 'Example 2' },
      ];
    }
    
    // Real API call
    const response = await apiClient.get('/examples');
    return response.data;
  },
};
```

---

## 🎨 UI Components

### Ant Design Components

Most commonly used components:

```typescript
import {
  Button,
  Card,
  Table,
  Form,
  Input,
  Select,
  DatePicker,
  Modal,
  message,
  Tag,
  Badge,
  Dropdown,
  Menu,
  Space,
  Row,
  Col,
  Statistic,
  Progress,
  Timeline,
  Descriptions,
  Upload,
  Alert,
  Divider,
} from 'antd';
```

### Icons

```typescript
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  UploadOutlined,
  EyeOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
```

### Custom Components

```typescript
// PageHeader
import { PageHeader } from '@/components/common';

<PageHeader
  title="Page Title"
  description="Page description"
  breadcrumb={{
    items: [
      { title: 'Home', path: '/' },
      { title: 'Current Page' },
    ],
  }}
  extra={[
    <Button key="action">Action</Button>,
  ]}
/>

// EnterpriseLayout
import { EnterpriseLayout } from '@/components/layout/EnterpriseLayout';

<EnterpriseLayout>
  {/* Page content */}
</EnterpriseLayout>
```

---

## 📊 Data Visualization

### Using Recharts

```typescript
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Example Area Chart
<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Area
      type="monotone"
      dataKey="revenue"
      stroke="#1890ff"
      fill="#1890ff"
      fillOpacity={0.6}
    />
  </AreaChart>
</ResponsiveContainer>
```

---

## 🔧 Utilities

### Date Formatting

```typescript
import dayjs from 'dayjs';

// Format date
dayjs(date).format('YYYY-MM-DD');
dayjs(date).format('YYYY-MM-DD HH:mm:ss');

// Relative time
dayjs(date).fromNow(); // "2 hours ago"

// Date comparison
dayjs(date1).isBefore(date2);
dayjs(date1).isAfter(date2);
```

### File Size Formatting

```typescript
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
```

### Currency Formatting

```typescript
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};
```

---

## 🐛 Debugging

### Console Logging

```typescript
// Development only
if (import.meta.env.DEV) {
  console.log('Debug info:', data);
}
```

### React DevTools

- Install React DevTools browser extension
- Inspect component props and state
- Profile component performance

### Network Debugging

- Open browser DevTools (F12)
- Go to Network tab
- Filter by XHR/Fetch
- Inspect API requests/responses

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Writing Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ExamplePage } from './ExamplePage';

describe('ExamplePage', () => {
  it('renders page title', () => {
    render(<ExamplePage />);
    expect(screen.getByText('Example Page')).toBeInTheDocument();
  });

  it('loads data on mount', async () => {
    render(<ExamplePage />);
    // ... test assertions
  });
});
```

---

## 📦 Building for Production

### Build Command

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

### Build Output

```
dist/
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── index.html
```

### Environment Variables

Production `.env.production`:
```env
VITE_API_BASE_URL=https://api.production.com
VITE_USE_MOCK_API=false
```

---

## 🔍 Code Style

### TypeScript

```typescript
// Use interfaces for object types
interface User {
  id: string;
  name: string;
  email: string;
}

// Use type for unions
type Status = 'active' | 'inactive' | 'pending';

// Use enums for constants
enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}
```

### React

```typescript
// Use functional components
export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  // ... component code
};

// Use hooks
const [state, setState] = useState(initialValue);
useEffect(() => {
  // ... effect code
}, [dependencies]);

// Use custom hooks
const { data, loading, error } = useData();
```

### Naming Conventions

- **Components:** PascalCase (e.g., `UserList`, `PageHeader`)
- **Files:** PascalCase for components (e.g., `UserList.tsx`)
- **Variables:** camelCase (e.g., `userData`, `isLoading`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Interfaces:** PascalCase with 'I' prefix optional (e.g., `User`, `IUser`)

---

## 🚨 Common Issues

### Issue: Module not found

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port already in use

**Solution:**
```bash
# Kill process on port 5173
npx kill-port 5173

# Or use different port
npm run dev -- --port 3000
```

### Issue: TypeScript errors

**Solution:**
```bash
# Check TypeScript errors
npx tsc --noEmit

# Fix auto-fixable issues
npx eslint --fix src/
```

---

## 📚 Resources

### Documentation
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Ant Design Documentation](https://ant.design/components/overview/)
- [Recharts Documentation](https://recharts.org/en-US/)
- [Vite Documentation](https://vitejs.dev/)

### Internal Documentation
- `IMPLEMENTATION_PROGRESS.md` - Implementation status
- `PHASE_3_COMPLETION_SUMMARY.md` - Feature summary
- `TESTING_CHECKLIST.md` - Testing guide
- `README.md` - Project overview

---

## 💡 Tips & Best Practices

### Performance
- Use `React.memo()` for expensive components
- Use `useMemo()` and `useCallback()` for expensive calculations
- Lazy load routes and components
- Optimize images and assets

### Code Quality
- Write meaningful commit messages
- Add comments for complex logic
- Keep components small and focused
- Extract reusable logic into hooks
- Use TypeScript strictly (no `any` types)

### User Experience
- Always show loading states
- Provide error messages
- Confirm destructive actions
- Show success feedback
- Handle edge cases

### Security
- Validate user input
- Sanitize data before display
- Check permissions before actions
- Use HTTPS in production
- Store sensitive data securely

---

## 🤝 Contributing

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/my-feature

# Create pull request
```

### Commit Message Format

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

**Example:**
```
feat(tickets): add ticket detail page

- Add ticket information display
- Add comments system
- Add attachments management
- Add activity timeline

Closes #123
```

---

## 📞 Support

### Getting Help
- Check documentation first
- Search existing issues
- Ask in team chat
- Create new issue if needed

### Contact
- **Technical Lead:** [Name]
- **Project Manager:** [Name]
- **Email:** support@example.com

---

**Document Version:** 1.0  
**Last Updated:** January 2024  
**Maintained By:** Development Team
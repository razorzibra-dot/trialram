# UI Consistency - Quick Reference Guide

## 🎯 Core Principles

### 1. Side Drawer Pattern (NOT Modal)
```typescript
// ✅ CORRECT: Use Drawer for details
<Drawer
  title="Details"
  placement="right"
  width={500}
  onClose={onClose}
  open={visible}
>
  <Descriptions>{/* Details */}</Descriptions>
  <Form>{/* Form */}</Form>
</Drawer>

// ❌ WRONG: Don't use Modal
<Modal visible={visible} onCancel={onClose}>
  {/* Content */}
</Modal>
```

### 2. Page Layout Structure
```
PageHeader (breadcrumbs + title + actions)
    ↓
StatCard Row (4-column grid, responsive)
    ↓
Filters Card (search, dropdowns, buttons)
    ↓
Content Card (table, list, form)
    ↓
Side Drawer (for details/edit/preview)
```

### 3. Service → Hook → Component Pattern
```typescript
// 1. Service: Business logic
class FeatureService {
  async getData(): Promise<Data> { }
  async create(data: Data): Promise<Data> { }
  async update(id: string, data: Data): Promise<Data> { }
}
export const featureService = new FeatureService();

// 2. Hook: State management
export const useFeature = () => {
  const [data, setData] = useState<Data[]>([]);
  const fetch = useCallback(async () => { }, []);
  const create = useCallback(async (data) => { }, []);
  return { data, fetch, create };
};

// 3. Component: UI rendering
export const FeaturePage = () => {
  const { data, fetch, create } = useFeature();
  return <Page data={data} onCreate={create} />;
};
```

---

## 📁 File Organization

### Standard Module Structure
```
feature/
├── components/       # Reusable UI (Drawers, Cards, Lists)
│   ├── DetailPanel.tsx      # Side drawer component
│   ├── FormPanel.tsx         # Form in drawer
│   └── index.ts              # Export all
├── hooks/            # Custom React hooks
│   ├── useFeature.ts         # Main data hook
│   ├── useFeatureForm.ts     # Form-specific hook
│   └── index.ts
├── services/         # Business logic & API
│   ├── featureService.ts     # Main service
│   └── index.ts
├── types/            # TypeScript definitions
│   ├── feature.ts            # Main types
│   └── index.ts
├── views/            # Page components
│   └── FeaturePage.tsx       # Main page
├── index.ts          # Module export
├── routes.tsx        # Route definitions
└── ARCHITECTURE.md   # Documentation
```

---

## 🎨 UI Components Patterns

### Statistics Card
```typescript
import { StatCard } from '@/components/common';

<StatCard
  title="Total Items"
  value={100}
  icon={Users}              // Lucide icon
  color="primary"           // primary|success|warning|error
  description="+10 today"   // Optional
  loading={isLoading}
/>
```

### Table with Actions
```typescript
const columns: ColumnsType<DataType> = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Actions',
    width: 120,
    render: (_, record) => (
      <Button type="text" onClick={() => handleView(record)}>
        View Details
      </Button>
    ),
  },
];

<Table columns={columns} dataSource={data} />
```

### Drawer Panel
```typescript
interface DetailPanelProps {
  visible: boolean;
  data: DataType | null;
  onClose: () => void;
  isSubmitting?: boolean;
  onSubmit?: (data: DataType) => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  visible,
  data,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  return (
    <Drawer
      title="Details"
      placement="right"
      onClose={onClose}
      open={visible}
      width={500}
      footer={
        <Row gutter={8} justify="end">
          <Button onClick={onClose}>Close</Button>
          <Button
            type="primary"
            loading={isSubmitting}
            onClick={() => onSubmit?.(data)}
          >
            Submit
          </Button>
        </Row>
      }
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="Field">{data?.field}</Descriptions.Item>
      </Descriptions>
    </Drawer>
  );
};
```

### Filter Card
```typescript
<Card>
  <Space style={{ width: '100%' }}>
    <Input
      placeholder="Search..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      prefix={<SearchOutlined />}
      style={{ width: 300 }}
      allowClear
    />
    <Select
      placeholder="Filter..."
      value={filter}
      onChange={setFilter}
      options={[...]}
      style={{ width: 150 }}
      allowClear
    />
    <Button onClick={() => { setSearch(''); setFilter(''); }}>
      Clear
    </Button>
  </Space>
</Card>
```

---

## 🔧 Creating New Features

### Step 1: Define Types
```typescript
// types/feature.ts
export interface Feature {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface FeatureFilters {
  status?: string;
  search?: string;
}

export interface FeatureStats {
  total: number;
  active: number;
  inactive: number;
}

export interface FeatureResponse {
  data: Feature[];
  stats: FeatureStats;
}
```

### Step 2: Create Service
```typescript
// services/featureService.ts
import { Feature, FeatureFilters, FeatureResponse } from '../types/feature';

class FeatureService {
  async getFeatures(filters?: FeatureFilters): Promise<FeatureResponse> {
    // TODO: Replace with API call
    return { data: mockData, stats: { total: 10, active: 8, inactive: 2 } };
  }

  async getFeature(id: string): Promise<Feature> {
    // TODO: Replace with API call
    return mockData.find(f => f.id === id)!;
  }

  async createFeature(data: Feature): Promise<Feature> {
    // TODO: Replace with API call
    return { ...data, id: generateId() };
  }

  async updateFeature(id: string, data: Feature): Promise<Feature> {
    // TODO: Replace with API call
    return { ...data, id };
  }

  async deleteFeature(id: string): Promise<void> {
    // TODO: Replace with API call
  }
}

export const featureService = new FeatureService();
```

### Step 3: Create Hook
```typescript
// hooks/useFeature.ts
import { Feature, FeatureFilters, FeatureStats } from '../types/feature';
import { featureService } from '../services/featureService';

export const useFeature = (filters?: FeatureFilters) => {
  const [data, setData] = useState<Feature[]>([]);
  const [stats, setStats] = useState<FeatureStats>({ total: 0, active: 0, inactive: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await featureService.getFeatures(filters);
      setData(response.data);
      setStats(response.stats);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const create = useCallback(async (feature: Feature) => {
    await featureService.createFeature(feature);
    await fetch();
  }, [fetch]);

  return { data, stats, isLoading, error, fetch, create };
};
```

### Step 4: Create Components
```typescript
// components/FeatureDetailPanel.tsx
export const FeatureDetailPanel: React.FC<DetailPanelProps> = ({
  visible,
  data,
  onClose,
}) => (
  <Drawer
    title="Feature Details"
    placement="right"
    onClose={onClose}
    open={visible}
    width={500}
  >
    <Descriptions column={1} bordered>
      <Descriptions.Item label="ID">{data?.id}</Descriptions.Item>
      <Descriptions.Item label="Name">{data?.name}</Descriptions.Item>
      <Descriptions.Item label="Status">
        <Tag color={data?.status === 'active' ? 'green' : 'red'}>
          {data?.status}
        </Tag>
      </Descriptions.Item>
    </Descriptions>
  </Drawer>
);
```

### Step 5: Create Page
```typescript
// views/FeaturePage.tsx
export const FeaturePage: React.FC = () => {
  const { data, stats, isLoading, fetch, create } = useFeature();
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Feature | null>(null);

  const columns: ColumnsType<Feature> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Actions',
      render: (_, record) => (
        <Button
          type="text"
          onClick={() => {
            setSelectedItem(record);
            setIsPanelVisible(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Features" />
      <div style={{ padding: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <StatCard title="Total" value={stats.total} icon={Users} />
          </Col>
          <Col span={6}>
            <StatCard title="Active" value={stats.active} icon={CheckCircle} />
          </Col>
        </Row>
        <Table columns={columns} dataSource={data} />
      </div>
      <FeatureDetailPanel
        visible={isPanelVisible}
        data={selectedItem}
        onClose={() => setIsPanelVisible(false)}
      />
    </>
  );
};
```

---

## 🎯 Common Tasks

### Add Status Badge
```typescript
const getStatusColor = (status: string) => {
  return {
    active: 'success',
    inactive: 'error',
    pending: 'processing',
  }[status] || 'default';
};

<Tag color={getStatusColor(status)}>{status}</Tag>
```

### Add Loading State
```typescript
<Button loading={isLoading} onClick={handleClick}>
  Load Data
</Button>

<Spin spinning={isLoading}>{/* Content */}</Spin>
```

### Add Search/Filter
```typescript
const [search, setSearch] = useState('');
const filtered = data.filter(item =>
  item.name.toLowerCase().includes(search.toLowerCase())
);
```

### Add Pagination
```typescript
<Table
  dataSource={data}
  pagination={{
    pageSize: 20,
    showSizeChanger: true,
    showTotal: (total) => `Total ${total} items`,
  }}
/>
```

### Add Error Handling
```typescript
try {
  await featureService.create(data);
  message.success('Created!');
} catch (error) {
  const msg = error instanceof Error ? error.message : 'Unknown error';
  message.error(msg);
}
```

---

## 🎨 Color & Status Reference

| Status | Color | Usage |
|--------|-------|-------|
| Pending | `processing` (blue) | Awaiting action |
| Active/Success | `success` (green) | Completed/Approved |
| Inactive/Error | `error` (red) | Failed/Inactive |
| Warning | `warning` (orange) | Needs attention |
| Info | `default` (gray) | Informational |

---

## 📋 Checklist for New Features

- [ ] Create types in `types/xxx.ts`
- [ ] Create service in `services/xxxService.ts`
- [ ] Create hook in `hooks/useXxx.ts`
- [ ] Create components in `components/XxxPanel.tsx`
- [ ] Create page in `views/XxxPage.tsx`
- [ ] Export everything in `index.ts` files
- [ ] Update `ARCHITECTURE.md`
- [ ] Add TODO comments for API integration
- [ ] Test with mock data first
- [ ] Document any custom patterns used
- [ ] Get UI review before implementation

---

## 🐛 Debugging Tips

### Check Data Flow
1. Browser DevTools Network tab: Are API calls correct?
2. React DevTools: Is state updating correctly?
3. Console logs: Are functions being called?
4. Component props: Are they being passed correctly?

### Common Issues
| Issue | Solution |
|-------|----------|
| Data not updating | Check useEffect dependencies |
| Button not responding | Check isLoading/isSubmitting state |
| Drawer not showing | Check visible state binding |
| Form not validating | Check Form.Item rules |
| Table empty | Check columns and dataSource |

---

## 📚 Related Documentation

- **Architecture Details**: `src/modules/features/{module}/ARCHITECTURE.md`
- **Type Definitions**: `src/modules/features/{module}/types/`
- **Service Examples**: `src/modules/features/{module}/services/`
- **Hook Examples**: `src/modules/features/{module}/hooks/`

---

## 🚀 Quick Start Commands

```bash
# Create new feature service
touch src/modules/features/myfeature/services/myfeatureService.ts

# Create new hook
touch src/modules/features/myfeature/hooks/useMyFeature.ts

# Create new component
touch src/modules/features/myfeature/components/MyFeaturePanel.tsx

# Create new page
touch src/modules/features/myfeature/views/MyFeaturePage.tsx

# Run development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

---

## 💡 Pro Tips

1. **Always use side drawers** instead of modals for details/edit
2. **Use the 3-layer pattern** (Service → Hook → Component)
3. **Mock first, API later** - Implement with mock data, then replace
4. **Type everything** - Use TypeScript for type safety
5. **Document as you go** - Add comments and update ARCHITECTURE.md
6. **Test error cases** - Don't just test the happy path
7. **Consider responsive design** - Use Col/Row with responsive props
8. **Handle loading states** - Show spinners for async operations
9. **Provide feedback** - Use message.success/error for user feedback
10. **Keep it DRY** - Extract reusable components and hooks

---

## 📞 Support

For questions or issues:
1. Check `ARCHITECTURE.md` for your module
2. Look at similar implementations in other modules
3. Review the UI_CONSISTENCY_REFACTOR_SUMMARY.md for context
4. Check inline code comments and TODO items
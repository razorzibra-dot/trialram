---
title: Sales Module
description: Complete documentation for the Sales module including deals, stages, workflows, and opportunity management
lastUpdated: 2025-01-15
relatedModules: [customers, products, product-sales, notifications, dashboard]
category: module
status: production
---

# Sales Module

## Overview

The Sales module manages the complete sales pipeline including deals, opportunities, stages, workflows, and sales metrics. It tracks deals from initial contact through closure with comprehensive status tracking, financial metrics, and team collaboration features.

## Module Structure

```
sales/
├── components/              # Reusable UI components
│   ├── SaleFormPanel.tsx        # Side drawer for create/edit deals
│   ├── SaleDetailPanel.tsx      # Side drawer for deal details
│   ├── SalesList.tsx            # Table component
│   └── StageBoard.tsx           # Kanban-style board view
├── hooks/                   # Custom React hooks
│   ├── useSales.ts              # React Query hooks
│   ├── useStages.ts             # Stage management hooks
│   └── useWorkflows.ts          # Workflow hooks
├── services/                # Business logic
│   ├── salesService.ts          # Service factory-routed
│   └── index.ts
├── store/                   # State management
│   ├── salesStore.ts            # Zustand state
│   └── index.ts
├── views/                   # Page components
│   ├── SalesPage.tsx            # Main sales list
│   ├── SaleDetailPage.tsx       # Sale detail view
│   └── SalesPipelineView.tsx    # Kanban pipeline
├── index.ts                 # Module exports
├── routes.tsx               # Route definitions
└── DOC.md                  # This file
```

## Key Features

### 1. Deal Management
- Create, read, update, and delete deals/opportunities
- Deal naming and descriptions
- Amount and currency tracking
- Expected close date management
- Deal probability estimation

### 2. Sales Stages & Pipeline
- Customizable sales stages (Prospecting, Qualification, Proposal, Negotiation, Closed Won/Lost)
- Deal stage tracking and progression
- Stage transition history
- Automated workflow actions on stage change
- Expected timeline per stage

### 3. Opportunity Tracking
- Lead source tracking
- Opportunity priority levels
- Next action tracking
- Follow-up scheduling
- Activity logging

### 4. Deal Attributes
- Customer association
- Product/service linking
- Team member assignment
- Deal type classification (New Business, Expansion, Renewal)
- Competitive information

### 5. Financial Tracking
- Deal value
- Pipeline value
- Expected revenue by date
- Win/loss rate tracking
- Revenue forecasting

### 6. Collaboration
- Deal notes and comments
- Activity timeline
- Task assignments
- Email integration
- Meeting scheduling

### 7. Analytics & Reporting
- Sales pipeline metrics
- Deal count by stage
- Total pipeline value
- Win/loss statistics
- Average deal size
- Sales cycle duration

## Component Descriptions

### SalesPage (Main Page)

**Type**: React FC  
**Path**: `views/SalesPage.tsx`

**Responsibilities**:
- Display sales list with filtering and pagination
- Show sales statistics and pipeline metrics
- Handle CRUD operations
- Manage drawer states
- Permission-based UI

**Features**:
- Statistics cards (Pipeline Total, Deal Count, Average Size, Win Rate)
- Advanced filtering (stage, customer, owner, date range)
- Sorting and pagination
- Bulk actions (export, update stage)
- Role-based visibility

### SaleFormPanel

**Type**: React FC (Drawer Component)  
**Path**: `components/SaleFormPanel.tsx`

**Props**:
```typescript
interface SaleFormPanelProps {
  visible: boolean;
  sale?: Sale | null;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Form Sections**:
1. Basic Information (Name, Amount, Date)
2. Deal Details (Stage, Probability, Type)
3. Customer & Contact (Customer selection, Contact person)
4. Product Information (Products, Services)
5. Team Information (Owner, Collaborators)
6. Workflow (Next Action, Follow-up Date)
7. Notes & Additional

### SaleDetailPanel

**Type**: React FC (Drawer Component)  
**Path**: `components/SaleDetailPanel.tsx`

**Display Sections**:
- Key metrics (Amount, Probability, Close Date)
- Deal information
- Customer details
- Product/Service details
- Team members
- Activity timeline
- Related records
- Notes

### StageBoard (Kanban View)

**Type**: React FC  
**Path**: `components/StageBoard.tsx`

**Features**:
- Drag-and-drop deals between stages
- Stage column view
- Deal cards with key info
- Stage statistics
- Empty state handling
- Loading states

## State Management

### Zustand Store (salesStore.ts)

**State Structure**:
```typescript
interface SalesStore {
  // Data
  sales: Sale[];
  selectedSale: Sale | null;
  stages: Stage[];
  salesStats: SalesStats | null;

  // UI State
  filters: SalesFilters;
  viewMode: 'list' | 'kanban' | 'table';
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  isLoading: boolean;
  error: string | null;

  // Actions
  setSales: (sales: Sale[]) => void;
  addSale: (sale: Sale) => void;
  updateSale: (id: string, sale: Partial<Sale>) => void;
  removeSale: (id: string) => void;
  setStages: (stages: Stage[]) => void;
  setFilters: (filters: Partial<SalesFilters>) => void;
  setViewMode: (mode: 'list' | 'kanban' | 'table') => void;
}
```

**Selector Hooks**:
- `useSales()` - Get sales list
- `useSalesByStage()` - Get sales grouped by stage
- `useSalesStats()` - Get statistics
- `useSelectedSale()` - Get selected sale
- `useSalesFilters()` - Get current filters
- `useSalesViewMode()` - Get view mode

## API & Hooks

### React Query Hooks (useSales.ts)

**Data Fetching**:
```typescript
const useSales = (filters?: SalesFilters) 
  => { data: Sale[]; isLoading: boolean }

const useSale = (id: string) 
  => { data: Sale | null; isLoading: boolean }

const useSalesByStage = (stage: string) 
  => { data: Sale[]; isLoading: boolean }

const useSalesStats = () 
  => { data: SalesStats | null }

const useStages = () 
  => { data: Stage[]; isLoading: boolean }
```

**Mutations**:
```typescript
const useCreateSale = () 
  => { mutate: (data: CreateSaleInput) => Promise<Sale> }

const useUpdateSale = () 
  => { mutate: (id: string, data: UpdateSaleInput) => Promise<Sale> }

const useUpdateSaleStage = () 
  => { mutate: (id: string, stage: string) => Promise<Sale> }

const useDeleteSale = () 
  => { mutate: (id: string) => Promise<void> }

const useExportSales = (format: 'csv' | 'json') 
  => { mutate: () => Promise<Blob> }
```

### Query Keys

```typescript
const salesKeys = {
  all: ['sales'],
  lists: () => ['sales', 'list'],
  list: (filters: SalesFilters) => ['sales', 'list', filters],
  detail: (id: string) => ['sales', 'detail', id],
  byStage: (stage: string) => ['sales', 'stage', stage],
  stats: () => ['sales', 'stats'],
  stages: () => ['sales', 'stages'],
};
```

## Service Layer

### Service Factory Pattern

Uses factory pattern for multi-backend support:

```typescript
import { salesService as factorySalesService } from '@/services/serviceFactory';

const sales = await factorySalesService.getSales(filters);
const updated = await factorySalesService.updateSale(id, data);
```

**Implementations**:
- **Mock**: `/src/services/salesService.ts`
- **Supabase**: `/src/services/api/supabase/salesService.ts`
- **Factory**: `/src/services/serviceFactory.ts`

## Data Types

### Sale Interface

```typescript
interface Sale {
  id: string;
  name: string;
  amount: number;
  currency: string;
  stage: string; // Prospecting, Qualification, etc.
  probability: number; // 0-100
  
  // Dates
  expectedCloseDate: string;
  createdDate: string;
  lastUpdateDate: string;
  
  // Relationships
  customerId: string;
  customerName: string;
  ownerId: string;
  ownerName: string;
  
  // Attributes
  type: 'new_business' | 'expansion' | 'renewal';
  source: string;
  priority: 'low' | 'medium' | 'high';
  
  // Additional
  description?: string;
  notes?: string;
  nextAction?: string;
  followUpDate?: string;
  
  // Products
  products?: SaleProduct[];
  
  // Metadata
  updatedAt: string;
  createdAt: string;
}

interface Stage {
  id: string;
  name: string;
  order: number;
  probability: number;
  description?: string;
}

interface SalesStats {
  totalDeals: number;
  totalPipelineValue: number;
  dealsByStage: Record<string, number>;
  valueByStage: Record<string, number>;
  averageDealSize: number;
  winRate: number;
  averageSalesCycle: number;
}

interface SalesFilters {
  search?: string;
  stage?: string;
  customer?: string;
  owner?: string;
  dateRange?: { start: string; end: string };
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  pageSize?: number;
}
```

## Integration Points

### With Customers Module
- Link sales to customers
- Display customer info on sales
- Customer sales history

### With Products Module
- Associate products/services with sales
- Display product details
- Track product preferences

### With Notifications Module
- Notify on stage changes
- Alert on close dates
- Activity notifications

### With Dashboard
- Display pipeline metrics
- Show sales trends
- Track performance KPIs

## Role-Based Access Control

```typescript
Required Permissions:
- sales:view - View sales/deals
- sales:create - Create new deals
- sales:update - Edit deals
- sales:update_stage - Change deal stage
- sales:delete - Delete deals
- sales:export - Export data
```

## Common Use Cases

### 1. View Sales Pipeline

```typescript
import { useSales, useSalesStats } from '@/modules/features/sales/hooks';

export function SalesPipeline() {
  const { data: sales, isLoading } = useSales();
  const { data: stats } = useSalesStats();

  return (
    <div>
      <StatisticsCards stats={stats} />
      <SalesTable data={sales} loading={isLoading} />
    </div>
  );
}
```

### 2. Create New Deal

```typescript
import { useCreateSale } from '@/modules/features/sales/hooks';

export function CreateSaleForm() {
  const createMutation = useCreateSale();

  const handleSubmit = async (values: CreateSaleInput) => {
    const newSale = await createMutation.mutateAsync(values);
    message.success('Deal created');
  };

  return <Form onFinish={handleSubmit} />;
}
```

### 3. Update Deal Stage (Kanban)

```typescript
import { useUpdateSaleStage } from '@/modules/features/sales/hooks';

export function DealCard({ sale }: { sale: Sale }) {
  const updateStageMutation = useUpdateSaleStage();

  const handleDrop = async (newStage: string) => {
    await updateStageMutation.mutateAsync(sale.id, newStage);
    queryClient.invalidateQueries(['sales']);
  };

  return (
    <Card
      draggable
      onDragEnd={() => handleDrop(newStage)}
    >
      {sale.name} - ${sale.amount}
    </Card>
  );
}
```

## Troubleshooting

### Common Issues

**Issue**: Sales data not loading
- Check VITE_API_MODE environment variable
- Verify factory service imports
- Check browser network requests
- Verify user permissions

**Issue**: Drag-drop in Kanban not working
- Verify React.DnD is properly configured
- Check event handlers
- Verify stage update is being called
- Check mutation errors

**Issue**: Stage change not persisting
- Verify mutation success callback
- Check query invalidation
- Verify API response
- Check store update logic

**Issue**: Statistics not updating
- Trigger stats query refetch
- Verify stats calculation
- Check aggregation logic
- Review cache strategy

## Performance Optimizations

1. **Memoization**: Components use React.memo
2. **Virtual Scrolling**: Large lists use virtualization
3. **Lazy Loading**: Routes are code-split
4. **Query Caching**: React Query caches with stale times
5. **Pagination**: Fetches data in pages
6. **Selector Hooks**: Zustand selectors prevent re-renders

## Testing

### Unit Tests
- Store actions and selectors
- Service methods with mocks
- Hook behavior

### Integration Tests
- Complete deal workflows
- Stage transitions
- Filter functionality

### E2E Tests
- User workflows
- Kanban interactions
- Create/Edit/Delete

## Known Issues & Fixes

Refer to: `/DOCUMENTATION/06_BUG_FIXES_KNOWN_ISSUES/`

Consolidated from multiple fix documents for:
- Sales data integrity
- Stage transitions
- Form validation
- Stage dropdown loading
- Notes field updates

## Related Documentation

- **Service Factory**: `/docs/architecture/SERVICE_FACTORY.md` and `.zencoder/rules/repo.md`
- **Customers Module**: `/src/modules/features/customers/DOC.md`
- **React Query**: `/docs/architecture/REACT_QUERY.md`
- **Zustand**: https://github.com/pmndrs/zustand

---

**Version**: 1.0  
**Last Updated**: 2025-01-15  
**Status**: Production  
**Maintenance**: Updated with each feature change
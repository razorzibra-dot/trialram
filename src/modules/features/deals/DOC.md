---
title: Sales Module
description: Complete documentation for the Sales module including deals, stages, workflows, and opportunity management
lastUpdated: 2025-01-31
relatedModules: [customers, products, product-sales, notifications, dashboard]
category: module
status: production
---

# Sales Module

## 🎉 UI/UX Enhancement Status

**✨ Enterprise Grade Enhancement - Phase 7 (Jan 31, 2025)**

Both form components have been upgraded to enterprise-grade professional interfaces:
- **SalesDealFormPanel**: ✨ Complete redesign with 7 professional card sections
- **SalesDealDetailPanel**: ✨ Complete redesign with key metrics and rich formatting

### Enhancement Highlights
- 📱 **Fully Responsive**: Mobile-first design works perfectly on all devices
- 🎨 **Professional Design**: Card-based sections with icon headers and consistent styling
- ✅ **Enhanced Validation**: Comprehensive error messages and field guidance
- 🛒 **Product Integration**: Full product line item management in deals
- 💰 **Rich Formatting**: Currency, dates, and clickable links
- 📊 **Key Metrics**: Prominent display of deal value, probability, and status
- 📚 **Comprehensive Docs**: 4000+ lines of technical documentation

**See**: `SALES_FORMS_ENHANCEMENT_SUMMARY.md`, `SALES_FORMS_ENHANCEMENT_GUIDE.md`

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

### SalesDealFormPanel ✨ ENHANCED

**Type**: React FC (Drawer Component)  
**Path**: `components/SalesDealFormPanel.tsx`  
**Status**: ✨ Enterprise Enhanced Edition

**Props**:
```typescript
interface SalesDealFormPanelProps {
  visible: boolean;
  deal: Deal | null;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Professional Form Sections** (7 card-based sections):
1. 📄 **Deal Overview** - Deal title with validation
2. 👥 **Customer Information** - Select customer with details preview
3. 💰 **Financial Information** - Deal value and probability
4. 🛒 **Products & Services** - Add/manage product line items
5. 📅 **Sales Pipeline & Timeline** - Stage, dates, status
6. 🎯 **Campaign & Source Information** - Lead source and campaign
7. ✅ **Tags & Additional Notes** - Tags, assignment, notes, description

**Key Features**:
- Large input fields (size="large") for better mobile UX
- Currency formatting with thousands separators
- Auto-calculation of deal value from products
- Responsive grid layout (xs=24, sm=12)
- Comprehensive validation with helpful messages
- Emoji indicators for quick scanning
- Character counters on text areas
- Rich tooltips on all complex fields

**Enhancement Documentation**: `SALES_FORMS_ENHANCEMENT_GUIDE.md`

### SalesDealDetailPanel ✨ ENHANCED

**Type**: React FC (Drawer Component)  
**Path**: `components/SalesDealDetailPanel.tsx`  
**Status**: ✨ Enterprise Enhanced Edition

**Key Metrics Card** (Top Section):
- 💰 Deal Value (formatted with currency)
- 📊 Win Probability (0-100%)
- 🎯 Current Status (color-coded badge with emoji)

**Professional Display Sections** (8 information cards):
1. 📊 **Pipeline Progress** - Visual stage indicator with alert
2. 📄 **Deal Information** - Stage, status, description
3. 📅 **Timeline** - Expected and actual close dates
4. 👥 **Customer Information** - Full customer details with navigation
5. 🛒 **Products & Services** - Product table with quantities and totals
6. 🎯 **Campaign & Source** - Lead source and campaign info (if present)
7. 🏷️ **Tags** - Color-coded tag badges (if present)
8. 📝 **Internal Notes** - Notes with yellow background (if present)
9. 🔗 **Linked Contracts** - All contracts converted from deal (if present)

**Rich Formatting**:
- Currency formatted with thousands separators
- Dates in readable locale format (e.g., "January 31, 2025")
- Clickable email links (mailto:)
- Clickable phone links (tel:)
- Color-coded status badges with emojis
- Em-dashes for empty fields

**Enhancement Documentation**: `SALES_FORMS_ENHANCEMENT_GUIDE.md`

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
- crm:sales:deal:create - Create new deals
- crm:sales:deal:update - Edit deals
- crm:sales:deal:update_stage - Change deal stage
- crm:sales:deal:delete - Delete deals
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
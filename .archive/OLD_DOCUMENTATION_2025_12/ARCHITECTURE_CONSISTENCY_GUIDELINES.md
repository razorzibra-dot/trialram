# Architecture Consistency Guidelines

**Version**: 1.0  
**Last Updated**: November 13, 2025  
**Status**: RECOMMENDED STANDARD

This document defines the standardized patterns for implementing consistent architecture across all feature modules.

---

## Table of Contents

1. [Service Access Layer](#1-service-access-layer)
2. [Hooks Implementation](#2-hooks-implementation)
3. [State Management](#3-state-management)
4. [Page Components](#4-page-components)
5. [Error Handling](#5-error-handling)
6. [Type Safety](#6-type-safety)
7. [Code Organization](#7-code-organization)
8. [Checklist](#8-implementation-checklist)

---

## 1. Service Access Layer

### ✅ Standard Pattern: Use `useService()` Hook

All modules must access services through the `useService()` hook. This ensures:
- Proper React dependency management
- Consistent error handling
- Centralized service configuration
- Type safety

### Implementation

#### Step 1: Define Service Type
```typescript
// src/modules/features/mymodule/services/myModuleService.ts
export interface IMyModuleService {
  getItems(filters: FilterType): Promise<ItemsResponse>;
  getItem(id: string): Promise<Item>;
  createItem(data: CreateItemInput): Promise<Item>;
  updateItem(id: string, data: UpdateItemInput): Promise<Item>;
  deleteItem(id: string): Promise<void>;
}

export class MyModuleService implements IMyModuleService {
  // Implementation...
}
```

#### Step 2: Register in Service Factory
```typescript
// src/services/serviceFactory.ts
export const myModuleService = new MyModuleService();

// or use dependency injection container
container.register('myModuleService', () => new MyModuleService());
```

#### Step 3: Use in Hooks
```typescript
// src/modules/features/mymodule/hooks/useMyModuleItems.ts
import { useService } from '@/modules/core/hooks/useService';
import { IMyModuleService } from '../services/myModuleService';

export const useMyModuleItems = (filters: FilterType) => {
  // ✅ CORRECT: Specify concrete type, not 'any'
  const service = useService<IMyModuleService>('myModuleService');
  
  return useQuery({
    queryKey: ['myModuleItems', filters],
    queryFn: () => service.getItems(filters),
    staleTime: 5 * 60 * 1000,
  });
};
```

### ❌ Anti-Patterns to Avoid

```typescript
// ❌ DON'T: Use inject() directly
const service = inject<MyModuleService>('myModuleService');

// ❌ DON'T: Use 'any' type
const service = useService<any>('myModuleService');

// ❌ DON'T: Create new instances in hooks
const service = new MyModuleService();

// ❌ DON'T: Direct serviceFactory imports
import { myModuleService } from '@/services/serviceFactory';
export const useMyItems = () => {
  // Use myModuleService directly - missing React deps tracking
};
```

---

## 2. Hooks Implementation

### ✅ Standard Hook Structure

```typescript
// src/modules/features/mymodule/hooks/useMyModule.ts

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useService } from '@/modules/core/hooks/useService';
import { useMyModuleStore } from '../store/myModuleStore';
import type { IMyModuleService } from '../services/myModuleService';

/**
 * Query key factory for consistent cache management
 */
export const myModuleKeys = {
  all: ['myModule'] as const,
  lists: () => [...myModuleKeys.all, 'list'] as const,
  list: (filters: FilterType) => [...myModuleKeys.lists(), filters] as const,
  details: () => [...myModuleKeys.all, 'detail'] as const,
  detail: (id: string) => [...myModuleKeys.details(), id] as const,
  stats: () => [...myModuleKeys.all, 'stats'] as const,
} as const;

/**
 * Fetch items with filters and pagination
 * 
 * @param filters - Optional filters
 * @returns Query result with items, loading, error states
 * 
 * @example
 * const { data: items, isLoading, error } = useMyModuleItems({ status: 'active' });
 */
export const useMyModuleItems = (filters: FilterType = {}) => {
  const service = useService<IMyModuleService>('myModuleService');
  const { setItems, setLoading, setError } = useMyModuleStore();

  return useQuery({
    queryKey: myModuleKeys.list(filters),
    queryFn: async () => {
      try {
        setLoading(true);
        const response = await service.getItems(filters);
        setItems(response.data);
        return response;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch items';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 5 * 60 * 1000,      // 5 minutes
    gcTime: 10 * 60 * 1000,         // 10 minutes (garbage collection)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Fetch single item by ID
 */
export const useMyModuleItem = (id: string) => {
  const service = useService<IMyModuleService>('myModuleService');
  const { setSelectedItem } = useMyModuleStore();

  return useQuery({
    queryKey: myModuleKeys.detail(id),
    queryFn: async () => {
      const item = await service.getItem(id);
      setSelectedItem(item);
      return item;
    },
    staleTime: 10 * 60 * 1000,  // 10 minutes (single items last longer)
    enabled: !!id,  // Only run if id is provided
  });
};

/**
 * Create new item mutation
 */
export const useCreateMyModuleItem = () => {
  const queryClient = useQueryClient();
  const service = useService<IMyModuleService>('myModuleService');
  const { addItem } = useMyModuleStore();

  return useMutation({
    mutationFn: (data: CreateItemInput) => service.createItem(data),
    onSuccess: (newItem) => {
      // Update store
      addItem(newItem);
      
      // Invalidate cache
      queryClient.invalidateQueries({ 
        queryKey: myModuleKeys.lists() 
      });
      
      // Update stats cache if applicable
      queryClient.invalidateQueries({ 
        queryKey: myModuleKeys.stats() 
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to create item';
      console.error('[useCreateMyModuleItem] Error:', message);
    },
  });
};

/**
 * Update item mutation
 */
export const useUpdateMyModuleItem = () => {
  const queryClient = useQueryClient();
  const service = useService<IMyModuleService>('myModuleService');
  const { updateItem } = useMyModuleStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateItemInput }) =>
      service.updateItem(id, data),
    onSuccess: (updatedItem) => {
      updateItem(updatedItem);
      
      queryClient.invalidateQueries({ 
        queryKey: myModuleKeys.lists() 
      });
      queryClient.invalidateQueries({ 
        queryKey: myModuleKeys.detail(updatedItem.id) 
      });
    },
  });
};

/**
 * Delete item mutation
 */
export const useDeleteMyModuleItem = () => {
  const queryClient = useQueryClient();
  const service = useService<IMyModuleService>('myModuleService');
  const { removeItem } = useMyModuleStore();

  return useMutation({
    mutationFn: (id: string) => service.deleteItem(id),
    onSuccess: (_, id) => {
      removeItem(id);
      
      queryClient.invalidateQueries({ 
        queryKey: myModuleKeys.lists() 
      });
    },
  });
};
```

### Hook Design Principles

1. **Query Key Factory**: Always use factory pattern for consistency
2. **Comprehensive Error Handling**: Catch, log, and re-throw with context
3. **Store Integration**: Update Zustand store on success
4. **Cache Invalidation**: Invalidate related queries on mutations
5. **Type Safety**: Always specify service type, never use `any`
6. **Documentation**: Include JSDoc with examples
7. **Separation of Concerns**: One hook per operation

---

## 3. State Management

### ✅ Standard Zustand Store Pattern

```typescript
// src/modules/features/mymodule/store/myModuleStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface MyModuleStoreState {
  // === DATA ===
  items: Item[];
  selectedItem: Item | null;
  itemsMap: Record<string, Item>;
  
  // === UI STATE ===
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // === PAGINATION ===
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  
  // === FILTERS ===
  filters: FilterType;
  
  // === ACTIONS ===
  // Data actions
  setItems: (items: Item[]) => void;
  addItem: (item: Item) => void;
  updateItem: (item: Item) => void;
  removeItem: (id: string) => void;
  setSelectedItem: (item: Item | null) => void;
  
  // Loading actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  clearError: () => void;
  
  // Pagination actions
  setPagination: (pagination: Partial<typeof state.pagination>) => void;
  
  // Filter actions
  setFilters: (filters: Partial<FilterType>) => void;
  clearFilters: () => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  items: [],
  selectedItem: null,
  itemsMap: {},
  isLoading: false,
  error: null,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
  },
  filters: {},
};

export const useMyModuleStore = create<MyModuleStoreState>()(
  immer((set) => ({
    ...initialState,
    
    setItems: (items) =>
      set((state) => {
        state.items = items;
        // Rebuild map for fast lookups
        state.itemsMap = Object.fromEntries(items.map((item) => [item.id, item]));
      }),
    
    addItem: (item) =>
      set((state) => {
        state.items.unshift(item);
        state.itemsMap[item.id] = item;
      }),
    
    updateItem: (item) =>
      set((state) => {
        const index = state.items.findIndex((i) => i.id === item.id);
        if (index !== -1) {
          state.items[index] = item;
        }
        state.itemsMap[item.id] = item;
        
        if (state.selectedItem?.id === item.id) {
          state.selectedItem = item;
        }
      }),
    
    removeItem: (id) =>
      set((state) => {
        state.items = state.items.filter((item) => item.id !== id);
        delete state.itemsMap[id];
        
        if (state.selectedItem?.id === id) {
          state.selectedItem = null;
        }
      }),
    
    setSelectedItem: (item) =>
      set((state) => {
        state.selectedItem = item;
      }),
    
    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),
    
    setError: (error) =>
      set((state) => {
        state.error = error;
      }),
    
    clearError: () =>
      set((state) => {
        state.error = null;
      }),
    
    setPagination: (pagination) =>
      set((state) => {
        state.pagination = { ...state.pagination, ...pagination };
      }),
    
    setFilters: (filters) =>
      set((state) => {
        state.filters = { ...state.filters, ...filters };
      }),
    
    clearFilters: () =>
      set((state) => {
        state.filters = {};
      }),
    
    reset: () => set(initialState),
  }))
);
```

### Store Design Principles

1. **Use Immer Middleware**: Simplifies immutable updates
2. **Separate Concerns**: Data, UI state, pagination, filters
3. **Lookup Maps**: Include `itemsMap` for O(1) lookups
4. **Loading States**: Separate flags for each async operation
5. **Error Handling**: Single `error` field with `clearError()` action
6. **Reset Function**: Always include for testing and cleanup
7. **Type Safety**: Full TypeScript interface
8. **Normalized Data**: Avoid nested duplicates

---

## 4. Page Components

### ✅ Standard Page Structure

```typescript
// src/modules/features/mymodule/views/MyModulePage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Space, Table, Input, Select, message, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, StatCard } from '@/components/common';
import {
  useMyModuleItems,
  useMyModuleStats,
  useDeleteMyModuleItem,
} from '../hooks';
import { useMyModuleStore } from '../store/myModuleStore';
import { MyModuleFormPanel } from '../components/MyModuleFormPanel';
import { MyModuleDetailPanel } from '../components/MyModuleDetailPanel';
import { MODULE_PERMISSIONS } from '../constants/permissions';

interface LocalState {
  drawerMode: 'create' | 'edit' | 'view' | null;
  selectedItemId: string | null;
}

export const MyModulePage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  // === LOCAL STATE ===
  const [drawerMode, setDrawerMode] = useState<LocalState['drawerMode']>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  
  // === STORE ===
  const { items, pagination, filters, setFilters, setPagination } = useMyModuleStore();
  const selectedItem = items.find((item) => item.id === selectedItemId) || null;
  
  // === QUERIES ===
  const { isLoading: itemsLoading } = useMyModuleItems(filters);
  const { data: stats, isLoading: statsLoading } = useMyModuleStats();
  const { mutate: deleteItem } = useDeleteMyModuleItem();
  
  // === HANDLERS ===
  
  const handleRefresh = () => {
    // Trigger refetch by clearing and resetting filters
    setPagination({ page: 1 });
    message.success('Data refreshed');
  };
  
  const handleCreate = () => {
    if (!hasPermission(MODULE_PERMISSIONS.CREATE)) {
      message.error('You do not have permission to create items');
      return;
    }
    
    setSelectedItemId(null);
    setDrawerMode('create');
  };
  
  const handleEdit = (itemId: string) => {
    if (!hasPermission(MODULE_PERMISSIONS.UPDATE)) {
      message.error('You do not have permission to edit items');
      return;
    }
    
    setSelectedItemId(itemId);
    setDrawerMode('edit');
  };
  
  const handleView = (itemId: string) => {
    setSelectedItemId(itemId);
    setDrawerMode('view');
  };
  
  const handleDelete = (itemId: string) => {
    if (!hasPermission(MODULE_PERMISSIONS.DELETE)) {
      message.error('You do not have permission to delete items');
      return;
    }
    
    Modal.confirm({
      title: 'Delete Item',
      content: 'Are you sure you want to delete this item?',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => {
        deleteItem(itemId, {
          onSuccess: () => {
            message.success('Item deleted successfully');
            setSelectedItemId(null);
          },
          onError: (error) => {
            message.error('Failed to delete item');
          },
        });
      },
    });
  };
  
  const handleSearch = (value: string) => {
    setSearchText(value);
    setFilters({ search: value });
    setPagination({ page: 1 });
  };
  
  const handleFormSuccess = () => {
    setDrawerMode(null);
    setSelectedItemId(null);
    message.success('Operation completed successfully');
  };
  
  // === TABLE COLUMNS ===
  
  const columns: ColumnsType<Item> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (text, record) => (
        <a onClick={() => handleView(record.id)}>{text}</a>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={statusColorMap[status]}>{status}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleView(record.id)}
          >
            View
          </Button>
          {hasPermission(MODULE_PERMISSIONS.UPDATE) && (
            <Button
              type="link"
              size="small"
              onClick={() => handleEdit(record.id)}
            >
              Edit
            </Button>
          )}
          {hasPermission(MODULE_PERMISSIONS.DELETE) && (
            <Button
              type="link"
              size="small"
              danger
              onClick={() => handleDelete(record.id)}
            >
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ];
  
  // === RENDER ===
  
  return (
    <>
      <PageHeader
        title="My Module"
        description="Manage your items"
        extra={
          <>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={itemsLoading}
            >
              Refresh
            </Button>
            {hasPermission(MODULE_PERMISSIONS.CREATE) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                New Item
              </Button>
            )}
          </>
        }
      />
      
      <div style={{ padding: 24 }}>
        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Items"
              value={stats?.total || 0}
              loading={statsLoading}
            />
          </Col>
          {/* Additional stat cards... */}
        </Row>
        
        {/* Items Table */}
        <Card>
          <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical">
            <Input.Search
              placeholder="Search items..."
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
            />
          </Space>
          
          <Table
            columns={columns}
            dataSource={items}
            loading={itemsLoading}
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: (page, pageSize) => {
                setPagination({ page, pageSize });
              },
            }}
            locale={{
              emptyText: <Empty description="No items found" />,
            }}
          />
        </Card>
      </div>
      
      {/* Form Panel */}
      <MyModuleFormPanel
        visible={drawerMode === 'create' || drawerMode === 'edit'}
        itemId={drawerMode === 'edit' ? selectedItemId : null}
        onClose={() => setDrawerMode(null)}
        onSuccess={handleFormSuccess}
      />
      
      {/* Detail Panel */}
      <MyModuleDetailPanel
        visible={drawerMode === 'view'}
        itemId={selectedItemId}
        onClose={() => setDrawerMode(null)}
        onEdit={() => setDrawerMode('edit')}
        onDelete={() => setDrawerMode(null)}
      />
    </>
  );
};
```

### Page Component Principles

1. **Minimal Local State**: Keep only drawer mode and selections
2. **Store for Data**: Use Zustand for all data state
3. **Permission Guards**: Check permissions before showing UI elements
4. **Hook-Based**: Use custom hooks for all queries
5. **Consistent Structure**: Header → Stats → Content → Panels
6. **Error Handling**: Use message/notification for user feedback
7. **Loading States**: Show spinners on appropriate components
8. **Responsive**: Use Ant Design's Row/Col for responsiveness

---

## 5. Error Handling

### ✅ Standard Error Handling Pattern

```typescript
// src/modules/features/mymodule/utils/errorHandler.ts

export const handleError = (error: unknown, context: string) => {
  // Extract message
  let message = 'An unexpected error occurred';
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = String(error.message);
  }
  
  // Log with context
  console.error(`[${context}] ${message}`, error);
  
  // TODO: Send to error tracking service (Sentry, etc.)
  
  return message;
};

// Usage in hooks:
try {
  const response = await service.getItems(filters);
  return response;
} catch (error) {
  const message = handleError(error, 'useMyModuleItems');
  throw new Error(message);
}

// Usage in components:
catch (error) {
  const message = handleError(error, 'handleDelete');
  message.error(message);
}
```

### Error Handling Principles

1. **Extract Message**: Always convert to string format
2. **Add Context**: Include function/component name in logs
3. **Centralize Logic**: Use utility functions
4. **Log Fully**: Include full error object in console
5. **Report to Service**: Send to error tracking
6. **User Feedback**: Show appropriate UI messages
7. **Don't Hide Details**: Log full errors for debugging

---

## 6. Type Safety

### ✅ Type Safety Checklist

```typescript
// ✅ DO: Explicit service types
const service = useService<IMyModuleService>('myModuleService');

// ✅ DO: Defined filter types
interface FilterType {
  search?: string;
  status?: 'active' | 'inactive';
  page?: number;
  pageSize?: number;
}

// ✅ DO: Response types
interface GetItemsResponse {
  data: Item[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ✅ DO: Input types
interface CreateItemInput {
  name: string;
  description: string;
  status: ItemStatus;
}

// ✅ DO: Enum for constants
enum ItemStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

// ❌ DON'T: Use 'any'
const service = useService<any>('myModuleService');

// ❌ DON'T: Untyped objects
const item: any = { name: 'test' };

// ❌ DON'T: String literals for enums
if (status === 'active') { } // Use Status.ACTIVE

// ❌ DON'T: Implicit return types
const getItem = (id) => { }  // Specify return type
```

---

## 7. Code Organization

### Directory Structure (Recommended)

```
src/modules/features/mymodule/
├── components/
│   ├── index.ts              # Export all components
│   ├── MyModuleFormPanel.tsx
│   ├── MyModuleDetailPanel.tsx
│   └── MyModuleList.tsx
├── hooks/
│   ├── index.ts              # Export all hooks
│   ├── useMyModuleItems.ts
│   ├── useMyModuleStats.ts
│   ├── useCreateMyModuleItem.ts
│   ├── useUpdateMyModuleItem.ts
│   └── useDeleteMyModuleItem.ts
├── services/
│   ├── index.ts              # Export types only
│   ├── myModuleService.ts
│   └── myModuleServiceTypes.ts
├── store/
│   ├── index.ts              # Export store
│   └── myModuleStore.ts
├── types/
│   ├── index.ts              # Export types
│   ├── module.types.ts       # Domain types
│   └── api.types.ts          # API response types
├── constants/
│   ├── index.ts
│   ├── permissions.ts        # Permission constants
│   └── status.ts             # Status enums
├── utils/
│   ├── index.ts
│   ├── errorHandler.ts
│   └── formatters.ts
├── views/
│   ├── index.ts
│   ├── MyModulePage.tsx
│   └── MyModuleDetailPage.tsx
├── index.ts                  # Module exports
├── routes.tsx               # Route definitions
└── DOC.md                   # Module documentation
```

### Export Pattern

```typescript
// src/modules/features/mymodule/index.ts
export * from './components';
export * from './hooks';
export * from './types';
export * from './constants';
export * from './store';

// DO NOT export services directly
// Services should only be accessed via hooks
```

---

## 8. Implementation Checklist

Use this checklist when implementing a new module or updating existing ones:

### Service Layer
- [ ] Define `IMyModuleService` interface with all methods
- [ ] Implement `MyModuleService` class
- [ ] Register service in service factory
- [ ] Include error handling in all methods
- [ ] Add JSDoc comments to public methods
- [ ] Specify return types (never use `any`)

### Hooks Layer
- [ ] Create query key factory
- [ ] Implement `useMyModuleItems` query hook
- [ ] Implement `useMyModuleItem` detail hook
- [ ] Implement `useCreateMyModuleItem` mutation hook
- [ ] Implement `useUpdateMyModuleItem` mutation hook
- [ ] Implement `useDeleteMyModuleItem` mutation hook
- [ ] Configure React Query options (staleTime, gcTime, retry)
- [ ] Include proper error handling
- [ ] Add JSDoc with examples
- [ ] Integrate with Zustand store
- [ ] Invalidate relevant cache keys on mutations

### Store Layer
- [ ] Define `MyModuleStoreState` interface
- [ ] Include data, UI, pagination, and filter state
- [ ] Use Immer middleware
- [ ] Implement all setters following naming convention
- [ ] Include reset function
- [ ] Use itemsMap for O(1) lookups

### Component Layer
- [ ] Create standard page component
- [ ] Use custom hooks (not direct service access)
- [ ] Implement permission checks
- [ ] Create form panel component
- [ ] Create detail panel component
- [ ] Include stats cards
- [ ] Implement search/filter
- [ ] Add table/list view
- [ ] Handle all CRUD operations

### Type Safety
- [ ] Define all request types (Filter, Create, Update)
- [ ] Define all response types
- [ ] Define domain types (Item, etc.)
- [ ] Use enums for status/constants
- [ ] Never use `any` type
- [ ] Specify generic types in hooks

### Documentation
- [ ] Add JSDoc comments to all public functions
- [ ] Include examples in comments
- [ ] Document permission requirements
- [ ] Add README in module (optional)
- [ ] Document any special handling

### Testing
- [ ] Mock service in tests
- [ ] Test all hooks
- [ ] Test error scenarios
- [ ] Test permission checks
- [ ] Test store updates

---

## References

- **Previous Analysis**: See `CONSISTENCY_ANALYSIS_REPORT.md`
- **Service Factory**: `src/services/serviceFactory.ts`
- **useService Hook**: `src/modules/core/hooks/useService.ts`
- **React Query Docs**: https://tanstack.com/query/latest
- **Zustand Docs**: https://github.com/pmndrs/zustand

---

## Questions & Support

If you have questions about these guidelines:
1. Refer to `CONSISTENCY_ANALYSIS_REPORT.md` for context
2. Check existing examples: Customers or Product Sales modules
3. Reach out to architecture team

**Last Updated**: November 13, 2025  
**Maintainer**: Architecture Team

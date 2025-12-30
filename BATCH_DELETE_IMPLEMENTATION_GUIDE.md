# 🗑️ Batch Delete System - Enterprise Implementation Guide

## 📖 Overview

This guide documents the **generic, configurable, and reusable batch delete system** implemented for the PDS CRM application. The system follows enterprise-grade design principles and can be integrated into any module with minimal configuration.

**Last Updated:** December 29, 2025  
**Status:** ✅ Production Ready  
**Version:** 1.0

---

## 🎯 Design Principles

### ✅ Generic & Dynamic (Rule 1)
- **Single implementation works for ALL entity types** (customers, products, deals, tickets, etc.)
- Type-safe generics preserve type information throughout the stack
- No entity-specific code duplication

### ✅ Loosely Coupled (Rule 2)
- Dependency injection via React hooks
- Services passed as parameters, not hardcoded
- Easy to swap implementations for testing/mocking

### ✅ Fully Configurable (Rule 3)
- Customizable confirmation messages
- Flexible error handling strategies
- Configurable batch sizes and behavior
- Custom action buttons and labels

### ✅ Cache Invalidation (Rule 3A/1A - CRITICAL)
- **Automatic cache clearing after batch operations**
- Follows documented cache invalidation patterns
- Prevents stale data bugs

### ✅ Multi-Tenant Aware (Rule 8)
- Tenant filtering handled at service layer
- No cross-tenant data leakage

---

## 🏗️ Architecture

### Component Hierarchy

```
┌─────────────────────────────────────────────────┐
│         CustomerListPage (or any module)        │
│  ┌───────────────────────────────────────────┐  │
│  │  useTableSelection Hook                   │  │
│  │  - Checkbox state management              │  │
│  │  - Select all / Clear all                 │  │
│  │  - Partial selection detection            │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  useBatchDelete Hook                      │  │
│  │  - Progress tracking                      │  │
│  │  - Error aggregation                      │  │
│  │  - Confirmation dialogs                   │  │
│  │  - Cache invalidation trigger             │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  BatchActionsToolbar Component            │  │
│  │  - Selection count display                │  │
│  │  - Delete button (or custom actions)      │  │
│  │  - Clear selection button                 │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│         CustomerService (or any service)        │
│  ┌───────────────────────────────────────────┐  │
│  │  batchDelete(ids: string[])               │  │
│  │  - Calls GenericCrudService.batchDelete   │  │
│  │  - Clears listCache, listInFlight         │  │
│  │  - Clears detailCache for deleted IDs     │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│         GenericCrudService Base Class           │
│  ┌───────────────────────────────────────────┐  │
│  │  batchDelete(ids: string[])               │  │
│  │  - Iterates through IDs                   │  │
│  │  - Checks authorization for each          │  │
│  │  - Calls repository.delete(id)            │  │
│  │  - Aggregates success/failure             │  │
│  │  - Calls afterBatchDelete hook            │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 📦 Core Components

### 1. `useTableSelection` Hook

**File:** `src/hooks/useTableSelection.ts`

**Purpose:** Manages checkbox selection state for any table/list.

**Features:**
- ✅ Generic type parameter `<T>` for any entity
- ✅ Select all / Deselect all
- ✅ Individual row toggle
- ✅ Partial selection detection (indeterminate checkbox)
- ✅ Configurable ID extraction function
- ✅ Selection change callbacks

**Usage Example:**
```typescript
const {
  selectedIds,
  selectedCount,
  isSelected,
  toggleSelection,
  toggleAll,
  clearSelection,
  isAllSelected,
  isPartiallySelected,
} = useTableSelection<Customer>({
  items: customers,
  getId: (customer) => customer.id,
  disabled: loading,
  onSelectionChange: (ids, items) => console.log('Selected:', ids),
});
```

**Key Methods:**
- `isSelected(item)` - Check if item is selected
- `toggleSelection(item)` - Toggle selection for single item
- `toggleAll()` - Toggle between select all and clear all
- `clearSelection()` - Clear all selections
- `getSelectedItems()` - Get full objects of selected items

---

### 2. `useBatchDelete` Hook

**File:** `src/hooks/useBatchDelete.ts`

**Purpose:** Handles batch deletion with progress tracking and error handling.

**Features:**
- ✅ Generic service integration via dependency injection
- ✅ Confirmation dialog (configurable)
- ✅ Progress tracking (N of M deleted)
- ✅ Partial failure handling
- ✅ Success/error callbacks
- ✅ Automatic notifications
- ✅ Cache invalidation trigger

**Usage Example:**
```typescript
const { batchDelete, isDeleting, progress } = useBatchDelete<Customer>({
  service: customerService,  // Injected service
  entityName: 'customer',
  entityNamePlural: 'customers',
  onSuccess: async () => {
    clearSelection();
    await refresh();
  },
  onError: (errors) => {
    console.error('Batch delete errors:', errors);
  },
  confirmBeforeDelete: true,
  confirmMessage: (count) => `Delete ${count} customers? This cannot be undone.`,
});

// Execute batch delete
await batchDelete(['id1', 'id2', 'id3']);
```

**Configuration Options:**
```typescript
interface UseBatchDeleteOptions<T> {
  service: { batchDelete: (ids: string[]) => Promise<BatchDeleteResult> };
  entityName: string;
  entityNamePlural?: string;
  onSuccess?: (result: BatchDeleteResult) => void | Promise<void>;
  onError?: (errors: BatchDeleteError[]) => void | Promise<void>;
  onProgress?: (progress: BatchDeleteProgress) => void;
  confirmBeforeDelete?: boolean;  // Default: true
  confirmMessage?: (count: number) => string;
  batchSize?: number;  // Default: 0 (all at once)
  stopOnError?: boolean;  // Default: false
}
```

**Result Structure:**
```typescript
interface BatchDeleteResult {
  successIds: string[];
  failedIds: string[];
  errors: BatchDeleteError[];
  total: number;
  successCount: number;
  failureCount: number;
}
```

---

### 3. `BatchActionsToolbar` Component

**File:** `src/components/common/BatchActionsToolbar.tsx`

**Purpose:** Visual toolbar displaying selection count and batch actions.

**Features:**
- ✅ Selection count badge
- ✅ Customizable action buttons
- ✅ Loading states per action
- ✅ Confirmation support
- ✅ Clear selection button
- ✅ Responsive design
- ✅ Accessible (ARIA labels)

**Usage Example:**
```typescript
<BatchActionsToolbar
  selectedCount={5}
  totalCount={100}
  onClearSelection={clearSelection}
  actions={[
    {
      label: 'Delete',
      icon: Trash2,
      onClick: () => batchDelete(selectedIds),
      variant: 'destructive',
      loading: isDeleting,
      disabled: !canDelete,
      tooltip: 'Delete selected items',
    },
    {
      label: 'Export',
      icon: Download,
      onClick: handleExport,
      variant: 'default',
    },
  ]}
  className="mb-4"
/>
```

**Action Configuration:**
```typescript
interface BatchAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void | Promise<void>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  loading?: boolean;
  disabled?: boolean;
  confirm?: boolean;
  confirmMessage?: string;
  tooltip?: string;
}
```

---

### 4. Service Layer Integration

#### GenericCrudService

**File:** `src/services/core/GenericCrudService.ts`

**Added Method:**
```typescript
async batchDelete(ids: string[], context?: any): Promise<BatchDeleteResult> {
  // 1. Pre-hook validation
  await this.beforeBatchDelete?.(ids);
  
  // 2. Process each ID
  for (const id of ids) {
    try {
      const entity = await this.repository.findById(id);
      await this.checkDeleteAuthorization?.(entity);
      await this.beforeDelete?.(entity);
      await this.repository.delete(id);
      await this.afterDelete?.(entity);
      // Track success
    } catch (error) {
      // Track failure
    }
  }
  
  // 3. Post-hook (cache clearing happens here in subclasses)
  await this.afterBatchDelete?.(result);
  
  return result;
}
```

**New Hooks:**
- `beforeBatchDelete?(ids: string[])` - Validate entire batch
- `afterBatchDelete?(result: BatchDeleteResult)` - Cache clearing, notifications

#### CustomerService Override

**File:** `src/services/customer/supabase/customerService.ts`

**Implementation:**
```typescript
async batchDelete(ids: string[], context?: any): Promise<BatchDeleteResult> {
  console.log('[CustomerService] Starting batch delete for', ids.length, 'customers');
  
  // Call parent implementation
  const result = await super.batchDelete(ids, context);
  
  // ⚠️ CRITICAL: Clear cache (Rule 3A/1A)
  try {
    this.listCache.clear();
    this.listInFlight.clear();
    
    // Clear detail cache for deleted IDs
    result.successIds.forEach(id => {
      this.detailCache.delete(id);
      this.detailInFlight.delete(id);
    });
    
    console.log('[CustomerService] Cache cleared after batch delete:', {
      successCount: result.successCount,
      failureCount: result.failureCount,
    });
  } catch (error) {
    console.error('[CustomerService] Error clearing cache:', error);
  }
  
  return result;
}
```

---

## 🚀 Integration Guide

### Step 1: Add Imports

```typescript
import { useTableSelection } from '@/hooks/useTableSelection';
import { useBatchDelete } from '@/hooks/useBatchDelete';
import { BatchActionsToolbar } from '@/components/common/BatchActionsToolbar';
import { useService } from '@/hooks/useService';
import { Trash2 } from 'lucide-react';
import { Checkbox } from 'antd';  // Or your UI library
```

### Step 2: Setup Hooks in Component

```typescript
const YourListPage = () => {
  const yourService = useService('yourEntity');  // customer, product, deal, etc.
  const { refresh } = useModuleData();
  
  // Table selection
  const {
    selectedIds,
    selectedCount,
    isSelected,
    toggleSelection,
    toggleAll,
    clearSelection,
    isAllSelected,
    isPartiallySelected,
  } = useTableSelection<YourEntity>({
    items: entities,
    getId: (entity) => entity.id,
  });
  
  // Batch delete
  const { batchDelete, isDeleting } = useBatchDelete<YourEntity>({
    service: yourService,
    entityName: 'item',
    entityNamePlural: 'items',
    onSuccess: async () => {
      clearSelection();
      await refresh();
    },
  });
  
  // ... rest of component
};
```

### Step 3: Add Checkbox Column to Table

```typescript
const columns = [
  // Checkbox column (first column)
  {
    title: (
      <Checkbox
        checked={isAllSelected}
        indeterminate={isPartiallySelected}
        onChange={toggleAll}
        disabled={loading}
      />
    ),
    key: 'selection',
    width: 50,
    align: 'center',
    render: (_, record) => (
      <Checkbox
        checked={isSelected(record)}
        onChange={() => toggleSelection(record)}
        disabled={loading}
      />
    ),
  },
  // ... other columns
];
```

### Step 4: Add BatchActionsToolbar Above Table

```typescript
<BatchActionsToolbar
  selectedCount={selectedCount}
  totalCount={entities.length}
  onClearSelection={clearSelection}
  actions={[
    {
      label: 'Delete',
      icon: Trash2,
      onClick: () => batchDelete(selectedIds),
      variant: 'destructive',
      loading: isDeleting,
      disabled: !canDelete,
    },
  ]}
  className="mb-4"
/>

<Table
  columns={columns}
  dataSource={entities}
  rowKey="id"
  // ... other props
/>
```

### Step 5: Implement Service batchDelete

```typescript
// src/services/yourEntity/supabase/yourEntityService.ts

async batchDelete(ids: string[], context?: any): Promise<BatchDeleteResult> {
  console.log('[YourEntityService] Starting batch delete');
  
  const result = await super.batchDelete(ids, context);
  
  // Clear cache (CRITICAL - Rule 3A/1A)
  try {
    this.listCache.clear();
    this.listInFlight.clear();
    result.successIds.forEach(id => {
      this.detailCache.delete(id);
      this.detailInFlight.delete(id);
    });
    console.log('[YourEntityService] Cache cleared');
  } catch {}
  
  return result;
}
```

---

## ✅ Integration Checklist

Use this checklist when integrating batch delete into a new module:

- [ ] **Imports added** - useTableSelection, useBatchDelete, BatchActionsToolbar
- [ ] **Service injection** - Get service via useService()
- [ ] **Selection hook setup** - Configure useTableSelection with correct type
- [ ] **Batch delete hook setup** - Configure useBatchDelete with callbacks
- [ ] **Checkbox column added** - First column with header checkbox
- [ ] **Toolbar added** - BatchActionsToolbar above table
- [ ] **Service override** - batchDelete method with cache clearing
- [ ] **Permissions checked** - canDelete permission used to disable actions
- [ ] **Testing completed** - Test select all, partial, delete, errors
- [ ] **Console logs added** - Debug logging for cache clearing
- [ ] **Documentation updated** - Add module to list below

---

## 📊 Module Integration Status

| Module | Status | File | Date | Notes |
|--------|--------|------|------|-------|
| Customers | ✅ Complete | `CustomerListPage.tsx` | 2025-12-29 | Reference implementation |
| Products | ⏳ TODO | `ProductListPage.tsx` | - | Use customers as template |
| Deals | ⏳ TODO | `DealListPage.tsx` | - | Use customers as template |
| Tickets | ⏳ TODO | `TicketListPage.tsx` | - | Use customers as template |
| Complaints | ⏳ TODO | `ComplaintListPage.tsx` | - | Use customers as template |
| Service Contracts | ⏳ TODO | `ServiceContractListPage.tsx` | - | Use customers as template |
| Job Works | ⏳ TODO | `JobWorkListPage.tsx` | - | Use customers as template |
| Product Sales | ⏳ TODO | `ProductSaleListPage.tsx` | - | Use customers as template |

---

## 🧪 Testing Guide

### Manual Testing Steps

1. **Select Single Item**
   - [ ] Click checkbox on a row
   - [ ] Verify toolbar appears with count "1 selected"
   - [ ] Verify header checkbox shows indeterminate state

2. **Select All**
   - [ ] Click header checkbox
   - [ ] Verify all rows selected
   - [ ] Verify toolbar shows correct count
   - [ ] Verify header checkbox is checked (not indeterminate)

3. **Clear Selection**
   - [ ] Select some items
   - [ ] Click X button in toolbar
   - [ ] Verify toolbar disappears
   - [ ] Verify all checkboxes unchecked

4. **Batch Delete - Success**
   - [ ] Select 3+ items
   - [ ] Click Delete button
   - [ ] Verify confirmation dialog appears
   - [ ] Click confirm
   - [ ] Verify success notification
   - [ ] Verify items removed from table
   - [ ] Verify selection cleared
   - [ ] **Verify count updates immediately (no F5 needed)**

5. **Batch Delete - Partial Failure**
   - [ ] Select items where some will fail (permission issue, etc.)
   - [ ] Click Delete
   - [ ] Verify warning notification shows partial success
   - [ ] Verify successful deletions removed
   - [ ] Verify failed items still visible

6. **Batch Delete - Cancel**
   - [ ] Select items
   - [ ] Click Delete
   - [ ] Click Cancel in confirmation
   - [ ] Verify no items deleted
   - [ ] Verify selection preserved

7. **Permissions**
   - [ ] Test with user lacking DELETE permission
   - [ ] Verify checkboxes disabled
   - [ ] Verify Delete button disabled
   - [ ] Verify tooltip shows permission message

8. **Cache Verification**
   - [ ] Open browser DevTools console
   - [ ] Perform batch delete
   - [ ] Verify console log: `[YourService] Cache cleared after batch delete`
   - [ ] Verify count updates without page refresh

### Automated Testing (Future)

```typescript
describe('Batch Delete', () => {
  it('should delete multiple items', async () => {
    const { result } = renderHook(() => useBatchDelete({
      service: mockService,
      entityName: 'test',
      confirmBeforeDelete: false,
    }));
    
    const deleteResult = await result.current.batchDelete(['1', '2', '3']);
    
    expect(deleteResult.successCount).toBe(3);
    expect(deleteResult.failureCount).toBe(0);
  });
});
```

---

## 🐛 Troubleshooting

### Issue: Count not updating after delete

**Symptom:** Batch delete succeeds but count stays the same until F5 refresh.

**Cause:** Service cache not cleared after batch delete.

**Solution:**
1. Check service has `batchDelete` override
2. Verify cache clearing code is present
3. Check console for cache clearing log
4. Ensure `onSuccess` callback calls `refresh()`

### Issue: Checkbox not working

**Symptom:** Clicking checkbox doesn't toggle selection.

**Cause:** Incorrect `getId` function or disabled state.

**Solution:**
1. Verify `getId` returns correct unique ID
2. Check `disabled` prop on useTableSelection
3. Verify permission checks

### Issue: Confirmation dialog not showing

**Symptom:** Items delete without confirmation.

**Cause:** `confirmBeforeDelete` set to false.

**Solution:**
1. Set `confirmBeforeDelete: true` in useBatchDelete
2. Or implement custom confirmation via `confirm` prop on action

### Issue: Partial failures not handled

**Symptom:** Batch stops on first error.

**Cause:** Error thrown before completion.

**Solution:**
1. GenericCrudService.batchDelete catches individual errors
2. Check service doesn't have custom error handling that throws

---

## 📚 Related Documentation

- **Cache Invalidation:** See `SERVICE_CACHE_INVALIDATION_CHECKLIST.md`
- **Generic Services:** See `copilot-instructions.md` Rule 1
- **Enterprise Patterns:** See `repo.md` Rule 1A
- **Service Layer:** See `src/services/core/GenericCrudService.ts`
- **Customer Implementation:** See `src/modules/features/customers/views/CustomerListPage.tsx`

---

## 🎯 Success Criteria

- [x] Generic system works for all entity types
- [x] No code duplication across modules
- [x] Type-safe throughout stack
- [x] Cache invalidation automatic
- [x] Configurable and customizable
- [x] Accessible UI (ARIA labels)
- [x] Comprehensive documentation
- [x] Reference implementation (customers)
- [ ] All modules integrated (8 total)
- [ ] Automated tests written

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-29 | Initial implementation with customer module integration |

---

**Maintained By:** Development Team  
**Questions?** See related documentation or check `copilot-instructions.md`

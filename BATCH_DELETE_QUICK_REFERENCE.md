# ⚡ Batch Delete - Quick Integration Reference

**Last Updated:** December 29, 2025  
**For:** Developers integrating batch delete into new modules

---

## 🚀 5-Minute Integration

### 1. Add Imports (30 seconds)

```typescript
import { useTableSelection } from '@/hooks/useTableSelection';
import { useBatchDelete } from '@/hooks/useBatchDelete';
import { BatchActionsToolbar } from '@/components/common/BatchActionsToolbar';
import { useService } from '@/modules/core/hooks/useService';
import { Trash2 } from 'lucide-react';
import { Checkbox } from 'antd';
```

### 2. Setup Hooks (1 minute)

```typescript
const YourListPage = () => {
  const yourService = useService('yourEntity') as any;
  const { refresh } = useModuleData();
  
  // Selection
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
    onSuccess: async () => {
      clearSelection();
      await refresh();
    },
  });
```

### 3. Add Checkbox Column (1 minute)

```typescript
const columns = [
  {
    title: (
      <Checkbox
        checked={isAllSelected}
        indeterminate={isPartiallySelected}
        onChange={toggleAll}
      />
    ),
    key: 'selection',
    width: 50,
    render: (_, record) => (
      <Checkbox
        checked={isSelected(record)}
        onChange={() => toggleSelection(record)}
      />
    ),
  },
  // ... rest of columns
];
```

### 4. Add Toolbar (30 seconds)

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
/>

<Table columns={columns} dataSource={entities} />
```

### 5. Service Implementation (2 minutes)

```typescript
// src/services/yourEntity/supabase/yourEntityService.ts

async batchDelete(ids: string[], context?: any): Promise<BatchDeleteResult> {
  console.log('[YourEntityService] Starting batch delete');
  
  const result = await super.batchDelete(ids, context);
  
  // CRITICAL: Clear cache
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

## ✅ Verification Checklist

- [ ] Imports added
- [ ] Hooks configured
- [ ] Checkbox column added (first column)
- [ ] Toolbar rendered above table
- [ ] Service batchDelete implemented
- [ ] Cache clearing added
- [ ] Console logs present
- [ ] Tested: Select all works
- [ ] Tested: Individual selection works
- [ ] Tested: Batch delete works
- [ ] Tested: Count updates without F5

---

## 🐛 Common Issues

**Issue:** `Property 'batchDelete' missing`  
**Fix:** Add `as any` to service: `useService('entity') as any`

**Issue:** Count not updating after delete  
**Fix:** Verify cache clearing in service batchDelete method

**Issue:** Checkbox not working  
**Fix:** Check `getId` function returns correct field

---

## 📚 Full Documentation

See `BATCH_DELETE_IMPLEMENTATION_GUIDE.md` for:
- Complete architecture
- All configuration options
- Error handling patterns
- Testing guide
- Troubleshooting

---

## 📊 Integration Status

| Module | Status | Developer |
|--------|--------|-----------|
| Customers | ✅ Complete | Reference |
| Products | ⏳ TODO | - |
| Deals | ⏳ TODO | - |
| Tickets | ⏳ TODO | - |

**Add your module to the list when complete!**

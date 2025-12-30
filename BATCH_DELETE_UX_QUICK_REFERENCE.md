# 🎨 Batch Delete UX - Quick Reference Card

**Last Updated:** December 29, 2025  
**Component:** BatchActionsToolbar.tsx  
**Status:** ✅ Production Ready

---

## 🚀 Quick Start

### Import
```typescript
import { BatchActionsToolbar, BatchAction } from '@/components/common/BatchActionsToolbar';
import { useTableSelection } from '@/hooks/useTableSelection';
import { useBatchDelete } from '@/hooks/useBatchDelete';
```

### Use in Component
```typescript
// 1. Setup selection
const {
  selectedIds,
  selectedCount,
  isSelected,
  toggleSelection,
  toggleAll,
  clearSelection,
} = useTableSelection<YourType>(items, (item) => item.id);

// 2. Setup batch delete
const { batchDelete, isDeleting } = useBatchDelete(service);

// 3. Render toolbar
<BatchActionsToolbar
  selectedCount={selectedCount}
  totalCount={items.length}
  onClearSelection={clearSelection}
  actions={[
    {
      label: 'Delete',
      icon: Trash2,
      onClick: () => batchDelete(selectedIds),
      variant: 'destructive',
      loading: isDeleting,
      confirmTitle: 'Delete Items?',
      confirmMessage: <p>Delete {selectedCount} items?</p>,
    },
  ]}
/>
```

---

## 🎨 Visual Design

### Toolbar Colors
```
Light Mode:
- Background: Gradient from-red-50 to-red-50/50
- Border: border-red-200
- Left accent: border-l-4 border-l-red-500

Dark Mode:
- Background: Gradient from-red-950 to-red-950/50
- Border: dark:border-red-900
- Left accent: dark:border-l-red-600
```

### Button Styles
```
Delete Button:
- Type: primary + danger
- Size: large (40px)
- Width: min-width: 140px
- Font: semibold (600)
- Icon: Trash icon (16x16)
- Shadow: md → lg on hover

Clear Button:
- Type: text
- Size: middle (32x32)
- Icon: X icon
- Hover: bg-red-100 (dark: bg-red-900)
```

### Badge Design
```
Selection Badge:
- Size: 40x40px
- Gradient: from-red-500 to-red-600
- Text: White, bold
- Radius: full (circle)
- Shadow: sm
- Indicator: Checkmark overlay (2+ items)
```

---

## ⚡ Animations

### Slide-Down (Toolbar Entry)
```typescript
duration: 0.3s
easing: ease-out
effect: Draws attention to toolbar
```

### Pulse Scale (Delete Button)
```typescript
duration: 0.5s
easing: ease-out
effect: Emphasizes primary action
scale: 1.0 → 1.02 → 1.0
```

### Hover Lift (Button Interaction)
```typescript
duration: 0.2s
effect: Visual feedback on hover
transform: translateY(-2px)
shadow: md → lg
```

---

## 🔧 Props Reference

### BatchActionsToolbarProps
```typescript
interface BatchActionsToolbarProps {
  selectedCount: number;              // Required: Selection count
  totalCount?: number;                // Optional: Total items
  onClearSelection: () => void;       // Required: Clear callback
  actions: BatchAction[];             // Required: Action buttons
  className?: string;                 // Optional: CSS classes
  showSelectAll?: boolean;            // Optional: Show select all
  onSelectAll?: () => void;           // Optional: Select all callback
  selectionMessage?: (count, total) => string;  // Custom message
}

interface BatchAction {
  label: string;                      // Button text
  icon?: LucideIcon;                  // Lucide icon
  onClick: () => void | Promise<void>;  // Click handler
  variant?: 'destructive' | ...;      // Button variant
  loading?: boolean;                  // Loading state
  disabled?: boolean;                 // Disabled state
  confirm?: boolean;                  // Show modal
  confirmTitle?: string;              // Modal title
  confirmMessage?: string | React.ReactNode;  // Modal content
  tooltip?: string;                   // Hover tooltip
}
```

---

## 🎯 Variants

### Simple Delete
```typescript
{
  label: 'Delete',
  icon: Trash2,
  onClick: () => batchDelete(selectedIds),
  variant: 'destructive',
  loading: isDeleting,
}
```

### With Confirmation
```typescript
{
  label: 'Delete',
  icon: Trash2,
  onClick: () => batchDelete(selectedIds),
  variant: 'destructive',
  confirm: true,
  confirmTitle: 'Delete Items?',
  confirmMessage: 'This action cannot be undone.',
}
```

### Custom Message
```typescript
{
  label: 'Delete',
  icon: Trash2,
  onClick: () => batchDelete(selectedIds),
  variant: 'destructive',
  confirmMessage: (
    <div className="space-y-3">
      <p><strong>⚠️ Permanent Deletion</strong></p>
      <p>Deleting {selectedCount} items</p>
      <ul className="list-disc pl-5">
        <li>Cannot be undone</li>
        <li>Data permanently removed</li>
        <li>History cleared</li>
      </ul>
    </div>
  ),
}
```

### Multiple Actions
```typescript
actions={[
  {
    label: 'Delete',
    icon: Trash2,
    onClick: () => batchDelete(selectedIds),
    variant: 'destructive',
  },
  {
    label: 'Archive',
    icon: Archive,
    onClick: () => batchArchive(selectedIds),
  },
  {
    label: 'Export',
    icon: Download,
    onClick: () => batchExport(selectedIds),
  },
]}
```

---

## 📊 Sizing Guide

### Toolbar
```
Height:     40px (content) + 16px (padding) = ~56px total
Padding:    16px horizontal, 16px vertical
Gap:        16px between sections
Min Width:  320px (mobile), 1024px (desktop)
```

### Button
```
Height:     40px (large)
Width:      140px minimum
Padding:    8px horizontal (internal)
Font Size:  14px
Icon Size:  16x16px
```

### Badge
```
Width:      40px
Height:     40px
Font Size:  14px
Font Weight: 700 (bold)
Checkmark:  12x12px (overlay)
```

---

## 🌙 Dark Mode Styles

### Add to Your Component
```typescript
// Automatically applied via Tailwind
// No extra code needed!

// Colors automatically invert:
- text-gray-700 → text-gray-300
- bg-red-50 → bg-red-950
- border-red-200 → border-red-900
- shadow-md → shadow-lg (darker)
```

---

## ♿ Accessibility

### Built-In Features
- `role="toolbar"` attribute
- `aria-label` for toolbar
- Keyboard navigation (Tab, Enter, Escape)
- High color contrast (WCAG AA)
- Focus indicators
- Alt text for icons

### To Add to Your Component
```typescript
// Add aria labels to custom buttons
<Button
  aria-label="Delete selected items"
  title="Delete selected items"
>
  {/* Button content */}
</Button>
```

---

## 🚨 Common Issues & Solutions

### Delete Button Not Visible
```
✓ Check: selectedCount > 0
✓ Check: CSS classes applied
✓ Check: Modal import from 'antd'
✓ Check: Browser dev tools for conflicts
```

### Animation Not Playing
```
✓ Check: showAnimation state updates
✓ Check: CSS animations not disabled
✓ Check: No conflicting Tailwind classes
✓ Verify: useEffect hook is running
```

### Modal Not Appearing
```
✓ Check: Modal import from 'antd'
✓ Check: variant === 'destructive'
✓ Check: Browser console for errors
✓ Check: onClick handler is called
```

### Cache Not Clearing
```
✓ Check: Service implements batchDelete override
✓ Check: listCache.clear() is called
✓ Check: Console logs show cache clearing
✓ Verify: Rule 3A/1A implementation
```

---

## 📈 Performance Optimization

### For Large Lists (1000+ items)
```typescript
// Virtualize table rows
import { List } from 'react-virtualized';

// Use useMemo for selection
const selectedIds = useMemo(
  () => selection.map(item => item.id),
  [selection]
);

// Batch delete in chunks
const chunkSize = 50;
// Process 50 items at a time
```

### Animation Performance
```typescript
// Check: Animation FPS (should be 60)
// Chrome DevTools → Performance tab

// If issues, check:
- No heavy JS during animation
- No layout thrashing
- CSS animations only (no JS)
- GPU acceleration enabled
```

---

## 🧪 Testing Template

```typescript
// Example test setup
describe('BatchActionsToolbar', () => {
  it('should show toolbar when items selected', () => {
    render(
      <BatchActionsToolbar
        selectedCount={3}
        totalCount={10}
        onClearSelection={jest.fn()}
        actions={[/* actions */]}
      />
    );
    
    expect(screen.getByText('3 items selected')).toBeInTheDocument();
  });

  it('should show confirmation modal on delete', async () => {
    const mockDelete = jest.fn();
    render(/* component */);
    
    fireEvent.click(screen.getByText('Delete Selected'));
    
    await waitFor(() => {
      expect(screen.getByText('Delete Customers')).toBeInTheDocument();
    });
  });
});
```

---

## 📝 Implementation Checklist

For each module:

- [ ] Import hooks and component
- [ ] Setup useTableSelection
- [ ] Setup useBatchDelete
- [ ] Add checkbox column to table
- [ ] Render BatchActionsToolbar
- [ ] Implement service.batchDelete()
- [ ] Add cache clearing (Rule 3A/1A)
- [ ] Test in browser
- [ ] Test animations
- [ ] Test modal confirmation
- [ ] Test delete execution
- [ ] Test cache refresh
- [ ] Test mobile responsive
- [ ] Test dark mode

---

## 🔗 Related Files

- `src/components/common/BatchActionsToolbar.tsx` - Main component
- `src/hooks/useTableSelection.ts` - Selection hook
- `src/hooks/useBatchDelete.ts` - Delete hook
- `src/modules/features/customers/views/CustomerListPage.tsx` - Example
- `BATCH_DELETE_ENTERPRISE_UX_GUIDE.md` - Full documentation
- `BATCH_DELETE_UX_VISUAL_SUMMARY.md` - Visual reference

---

## 💬 Need Help?

1. Check the full guide: `BATCH_DELETE_ENTERPRISE_UX_GUIDE.md`
2. See visual examples: `BATCH_DELETE_UX_VISUAL_SUMMARY.md`
3. Review implementation: `CustomerListPage.tsx`
4. Check console logs for errors

---

**Version:** 1.0  
**Status:** ✅ Production Ready  
**Last Updated:** December 29, 2025  
**Enterprise Grade:** ✅ Yes

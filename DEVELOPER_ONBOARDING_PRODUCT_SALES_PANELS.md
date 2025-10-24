# Developer Onboarding - Product Sales Side Panels

Welcome! This guide helps you understand and work with the new Product Sales side panel implementation.

## 🚀 Quick Start (5 minutes)

### 1. Understand the Change

**Old Way (Modals):**
```
User clicks button → Modal pops up center screen → Form/Details shown
```

**New Way (Side Panels):**
```
User clicks button → Drawer slides in from right side → Form/Details shown
```

### 2. Find the Files

```
src/modules/features/product-sales/
├── components/
│   ├── ProductSaleFormPanel.tsx    ← Create/Edit form
│   ├── ProductSaleDetailPanel.tsx  ← View details
│   └── index.ts                    ← Exports
├── views/
│   └── ProductSalesPage.tsx        ← Main page (UPDATED)
└── ...
```

### 3. Basic Usage

```typescript
import { ProductSaleFormPanel, ProductSaleDetailPanel } from '../components';

// Create panel (in your render)
<ProductSaleFormPanel
  visible={showCreateModal}
  productSale={null}
  onClose={() => setShowCreateModal(false)}
  onSuccess={handleFormSuccess}
/>

// Edit panel
<ProductSaleFormPanel
  visible={showEditModal}
  productSale={selectedSale}
  onClose={() => setShowEditModal(false)}
  onSuccess={handleFormSuccess}
/>

// Detail panel
<ProductSaleDetailPanel
  visible={showDetailModal}
  productSale={selectedSale}
  onClose={() => setShowDetailModal(false)}
  onEdit={() => { /* transition to edit */ }}
/>
```

---

## 📚 Learning Path

### Level 1: Understand the Basics (30 minutes)

**Read:**
- [ ] This document (you're reading it!)
- [ ] `PRODUCT_SALES_PANELS_QUICK_START.md`

**Do:**
- [ ] Open Product Sales page in the app
- [ ] Click "Create Sale" - see the side panel open
- [ ] Click "View" on a sale - see the detail panel
- [ ] Click "Edit" in detail panel - see transition to form

**Learn:**
- What are side panels vs. modals?
- How do they differ in user experience?
- Where are the new components?

### Level 2: Work with Components (1 hour)

**Read:**
- [ ] `PRODUCT_SALES_SIDEPANEL_MIGRATION.md` - Full reference
- [ ] Component code: `ProductSaleFormPanel.tsx`
- [ ] Component code: `ProductSaleDetailPanel.tsx`

**Do:**
- [ ] Read through `ProductSalesPage.tsx`
- [ ] Understand the state variables
- [ ] Trace data flow through components
- [ ] Identify service calls

**Learn:**
- What props do components accept?
- How does data flow through the components?
- What services are called?
- How is state managed?

### Level 3: Customize & Extend (2 hours)

**Read:**
- [ ] Architecture section in migration guide
- [ ] Component PropTypes comments

**Do:**
- [ ] Add a new field to the form
- [ ] Modify validation rules
- [ ] Add custom formatting
- [ ] Test the changes

**Learn:**
- How to modify forms?
- How to add new fields?
- Where validation happens?
- How to add custom logic?

### Level 4: Advanced Integration (2-3 hours)

**Read:**
- [ ] Service layer documentation
- [ ] Type definitions in `types/productSales.ts`

**Do:**
- [ ] Create a related feature (e.g., Product Sale Templates)
- [ ] Integrate with other modules
- [ ] Add new business logic
- [ ] Extend with new operations

**Learn:**
- How to integrate with other modules?
- How to follow the same patterns?
- What are the architectural constraints?
- How to maintain consistency?

---

## 🔍 File-by-File Explanation

### ProductSaleFormPanel.tsx

**Purpose:** Create and edit product sales

**Key Sections:**
```typescript
// 1. Props interface - what the component receives
interface ProductSaleFormPanelProps {
  visible: boolean;              // Should panel be shown?
  productSale: ProductSale | null; // Editing this sale (or null to create)
  onClose: () => void;           // Call when user closes
  onSuccess: () => void;         // Call when save succeeds
}

// 2. State - component's internal data
const [form] = Form.useForm();   // Ant Form instance
const [loading, setLoading] = useState(false); // Saving in progress?
const [customers, setCustomers] = useState<Customer[]>([]); // Loaded customers
const [products, setProducts] = useState<Product[]>([]);     // Loaded products

// 3. Effects - run on mount/update
useEffect(() => {
  // Load customers and products when visible
}, [visible]);

// 4. Handlers - respond to user actions
const handleSubmit = async () => {
  // Get form data → Validate → Call service → Handle response
};

// 5. Render - Ant Drawer with Form inside
<Drawer>
  <Form>
    {/* Form fields here */}
  </Form>
</Drawer>
```

**How to Modify:**
```typescript
// Add a new field:
<Form.Item label="New Field" name="new_field">
  <Input placeholder="Enter value" />
</Form.Item>

// Change validation:
rules={[
  { required: true, message: 'Field is required' },
  { pattern: /^[0-9]+$/, message: 'Must be a number' }
]}

// Add custom logic:
const handleSubmit = async () => {
  // Add your logic here before/after service call
  const result = await productSaleService.createProductSale(data);
  // Custom handling
};
```

### ProductSaleDetailPanel.tsx

**Purpose:** Show read-only details

**Key Sections:**
```typescript
// 1. Props - what to display
interface ProductSaleDetailPanelProps {
  visible: boolean;
  productSale: ProductSale | null;
  onClose: () => void;
  onEdit: () => void;
}

// 2. Helper functions - format data
const formatCurrency = (amount: number) => { /* ... */ };
const formatDate = (date: string) => { /* ... */ };
const getStatusColor = (status: string) => { /* ... */ };

// 3. Render - Ant Drawer with Descriptions
<Drawer>
  <Descriptions>
    <Descriptions.Item label="Field Name">
      {productSale.field}
    </Descriptions.Item>
  </Descriptions>
</Drawer>
```

**How to Modify:**
```typescript
// Add a new section:
<Divider />
<h3>New Section</h3>
<Descriptions>
  <Descriptions.Item label="Field">
    {productSale.field}
  </Descriptions.Item>
</Descriptions>

// Change display format:
// Instead of: {productSale.status}
// Use: <Tag color={getStatusColor(productSale.status)}>{productSale.status}</Tag>
```

### ProductSalesPage.tsx

**Purpose:** Main page orchestrating everything

**Key Sections:**
```typescript
// 1. State management
const [showCreateModal, setShowCreateModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [showDetailModal, setShowDetailModal] = useState(false);
const [selectedSale, setSelectedSale] = useState<ProductSale | null>(null);

// 2. Data loading
const loadProductSales = useCallback(async () => {
  const response = await productSaleService.getProductSales(filters, currentPage, pageSize);
  setProductSales(response.data);
}, [filters, currentPage, pageSize]);

// 3. Event handlers
const handleCreateSale = () => { /* ... */ };
const handleEditSale = (sale: ProductSale) => { /* ... */ };
const handleViewSale = (sale: ProductSale) => { /* ... */ };

// 4. Render panels
<ProductSaleFormPanel visible={...} {...} />
<ProductSaleDetailPanel visible={...} {...} />
```

**How to Modify:**
```typescript
// Add a new handler:
const handleCustomAction = (sale: ProductSale) => {
  // Do something with sale
};

// Add a new state:
const [newState, setNewState] = useState(false);

// Wire to UI:
<Button onClick={() => handleCustomAction(selectedSale)}>
  Custom Action
</Button>
```

---

## 🎯 Common Tasks

### Task 1: Add a New Form Field

**Steps:**
1. Open `ProductSaleFormPanel.tsx`
2. Find the form section where you want to add it
3. Add a new `Form.Item`
4. Update the type definition in `types/productSales.ts`
5. Update the service method to handle the new field

**Example:**
```typescript
// In ProductSaleFormPanel.tsx
<Form.Item
  label="Custom Field"
  name="custom_field"
  rules={[{ required: true, message: 'Please enter value' }]}
>
  <Input placeholder="Enter value" />
</Form.Item>

// In types/productSales.ts
export interface ProductSaleFormData {
  // ... existing fields
  custom_field: string; // NEW
}

// In productSaleService
export async function createProductSale(data: ProductSaleFormData) {
  // ... existing code
  // API will use custom_field from data
}
```

### Task 2: Add Validation Rule

**Steps:**
1. Open `ProductSaleFormPanel.tsx`
2. Find the Form.Item with the field
3. Add rule to the `rules` array
4. Test the form

**Example:**
```typescript
// Before
<Form.Item label="Quantity" name="quantity">
  <InputNumber />
</Form.Item>

// After
<Form.Item
  label="Quantity"
  name="quantity"
  rules={[
    { required: true, message: 'Quantity is required' },
    { pattern: /^[0-9]+$/, message: 'Must be a whole number' },
  ]}
>
  <InputNumber />
</Form.Item>
```

### Task 3: Change Panel Width

**Steps:**
1. Open `ProductSaleFormPanel.tsx` or `ProductSaleDetailPanel.tsx`
2. Find the `<Drawer width={550}>`
3. Change `550` to desired width

**Example:**
```typescript
// Before
<Drawer width={550} />

// After - wider panel
<Drawer width={650} />
```

### Task 4: Add Custom Styling

**Steps:**
1. Use inline styles in the component
2. Or use Tailwind classes in the className
3. Or create a CSS module

**Example:**
```typescript
// Inline style
<div style={{ color: 'red', fontWeight: 'bold' }}>
  Important Message
</div>

// Tailwind (if available)
<div className="text-red-600 font-bold">
  Important Message
</div>
```

### Task 5: Debug Issues

**Steps:**
1. Open browser DevTools Console
2. Check for error messages
3. Check Network tab for API calls
4. Use React DevTools to inspect component state
5. Add console.log statements

**Example:**
```typescript
// Add debug logs
const handleSubmit = async () => {
  try {
    console.log('Form data:', values); // See what's being sent
    const result = await productSaleService.createProductSale(data);
    console.log('Success:', result);   // See what was returned
  } catch (error) {
    console.error('Error:', error);    // See the error details
  }
};
```

---

## 🧪 Testing Your Changes

### Manual Testing

```
1. npm run dev
2. Navigate to Product Sales page
3. Test Create:
   [ ] Click Create Sale
   [ ] Panel opens from right
   [ ] Fill form fields
   [ ] Click Create
   [ ] Success message shows
   [ ] Panel closes
   [ ] New sale in list
4. Test Edit:
   [ ] Click Edit on a sale
   [ ] Panel opens with data
   [ ] Modify a field
   [ ] Click Update
   [ ] Success message shows
   [ ] Panel closes
   [ ] Updated data in list
5. Test View:
   [ ] Click View on a sale
   [ ] Detail panel shows
   [ ] Can click Edit
   [ ] Transitions to edit panel
```

### Automated Testing

```typescript
// Example test (if using Jest/Testing Library)
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductSaleFormPanel } from './ProductSaleFormPanel';

test('renders form panel', () => {
  render(
    <ProductSaleFormPanel
      visible={true}
      productSale={null}
      onClose={() => {}}
      onSuccess={() => {}}
    />
  );
  
  expect(screen.getByText('Create New Product Sale')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Select customer')).toBeInTheDocument();
});
```

---

## 🐛 Troubleshooting

### Panel Won't Open

**Cause:** `visible` prop is `false`  
**Fix:** Check that `visible={showCreateModal}` and state is set to `true`

### Form Fields Empty

**Cause:** Data not loaded yet  
**Fix:** Wait for `useEffect` to load customers/products

### Submit Doesn't Work

**Cause:** Form validation failed  
**Fix:** Check form fields have required data; check console errors

### Styles Look Wrong

**Cause:** CSS classes not applied  
**Fix:** Check Tailwind/CSS is imported; run `npm run build`

### API Calls Failing

**Cause:** Service method error  
**Fix:** Check network tab; check API endpoint; check authentication

---

## 📖 References

### Documentation Files

| File | Purpose |
|------|---------|
| `PRODUCT_SALES_PANELS_QUICK_START.md` | Quick reference |
| `PRODUCT_SALES_SIDEPANEL_MIGRATION.md` | Complete guide |
| `PRODUCT_SALES_SIDEPANEL_VERIFICATION.md` | Testing & verification |
| `PRODUCT_SALES_MIGRATION_SUMMARY.md` | Executive summary |

### External Resources

- [Ant Design Drawer](https://ant.design/components/drawer/)
- [Ant Design Form](https://ant.design/components/form/)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)

### Internal Resources

- `src/modules/features/contracts/components/` - Similar implementation
- `src/services/productSaleService.ts` - API methods
- `src/types/productSales.ts` - Type definitions

---

## 💡 Pro Tips

### Tip 1: Use TypeScript Autocomplete
Hover over component props to see documentation and available options.

### Tip 2: Follow Existing Patterns
Look at similar code (like Contracts module) for best practices.

### Tip 3: Check Component Props
Props are well-documented - read them before implementing!

### Tip 4: Use Browser DevTools
React DevTools extension helps inspect component state and props.

### Tip 5: Keep It Simple
Don't over-engineer - follow existing patterns and keep code simple.

---

## 🆘 Getting Help

### When You're Stuck

1. **Check Documentation**
   - Search this file
   - Read the migration guide
   - Check code comments

2. **Debug**
   - Open browser DevTools
   - Check console for errors
   - Check network tab
   - Add console.log statements

3. **Ask for Help**
   - Ask team lead
   - Check Slack
   - Review similar code
   - Create an issue

### Debugging Workflow

```
1. What's the error message?
   → Check console
   
2. When does it happen?
   → Reproduce the issue
   
3. Where does it happen?
   → Add console.log statements
   
4. Why does it happen?
   → Trace the code flow
   
5. How to fix it?
   → Implement solution
   
6. Did it work?
   → Test thoroughly
```

---

## ✅ You're Ready!

You now understand:
- ✅ What changed (modals → side panels)
- ✅ Where the code is
- ✅ How to use the components
- ✅ How to modify them
- ✅ How to debug issues
- ✅ Where to get help

### Next Steps

1. **Read** the Quick Start guide
2. **Explore** the ProductSalesPage code
3. **Make** a small modification
4. **Test** your changes
5. **Ask** questions if stuck

Happy coding! 🚀

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**For Questions:** Ask your team lead or check documentation files
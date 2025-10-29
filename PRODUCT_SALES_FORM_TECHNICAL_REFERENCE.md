# Product Sales Form - Technical Reference

**Date**: January 29, 2025  
**File**: `src/modules/features/product-sales/components/ProductSaleFormPanel.tsx`  
**Build Status**: ✅ Successful (45.06s)

## Architecture Overview

### Component Structure

```
ProductSaleFormPanel
├── State Management
│   ├── Form state (form instance)
│   ├── UI state (loading, error)
│   ├── Permission state
│   ├── Customer state
│   ├── Product state
│   └── Line items state
├── Effects
│   ├── useEffect: Load customers & products
│   ├── useEffect: Populate form on edit
│   └── useEffect: Permission checking
├── Event Handlers
│   ├── handleCustomerChange()
│   ├── handleAddProduct()
│   ├── handleRemoveItem()
│   ├── handleUpdateItemQuantity()
│   ├── handleUpdateItemDiscount()
│   ├── handleSubmit()
│   └── handleClose()
├── Render
│   ├── Drawer wrapper
│   ├── Permission alert
│   ├── Form sections
│   ├── Customer section with card
│   ├── Product section with line items table
│   └── Sale details section
└── Exports
    └── ProductSaleFormPanel component
```

## State Variables

### Form State
```typescript
const [form] = Form.useForm();
```
- Ant Design Form instance for handling form values
- Used for validation, field access, and form reset

### Loading State
```typescript
const [loading, setLoading] = useState(false);              // Form submission
const [dataLoading, setDataLoading] = useState(false);      // Initial data load
const [loadingCustomers, setLoadingCustomers] = useState(false);
const [loadingProducts, setLoadingProducts] = useState(false);
```

### Permission State
```typescript
const [permissionError, setPermissionError] = useState<string | null>(null);
```
- Checked against RBAC service
- Prevents form submission if user lacks permissions

### Customer State
```typescript
const [customers, setCustomers] = useState<Customer[]>([]);
const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
```

### Product State
```typescript
const [products, setProducts] = useState<Product[]>([]);
const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
```

### Line Items State
```typescript
const [saleItems, setSaleItems] = useState<SaleLineItem[]>([]);
```

### Error State
```typescript
const [error, setError] = useState<string | null>(null);
```

## Interfaces & Types

### SaleLineItem
```typescript
interface SaleLineItem {
  id: string;                    // Unique identifier (format: "item-{timestamp}")
  product_id: string;            // Reference to Product
  product_name: string;          // Product name for display
  product_sku: string;           // SKU for reference
  product_description?: string;  // Optional description
  quantity: number;              // Editable quantity (min 1)
  unit_price: number;            // Price from product master
  discount: number;              // Editable discount per line
  tax: number;                   // Tax (reserved for future)
  line_total: number;            // Calculated: (qty × price) - discount + tax
}
```

### ProductSaleFormPanelProps
```typescript
interface ProductSaleFormPanelProps {
  visible: boolean;              // Drawer open/closed state
  productSale: ProductSale | null;  // Sale being edited (null for create)
  onClose: () => void;          // Callback to close drawer
  onSuccess: () => void;        // Callback after successful save
}
```

## Hooks Used

### Internal Hooks

#### useProductSalesPermissions
```typescript
const permissions = useProductSalesPermissions({
  sale: productSale || undefined,
  autoLoad: visible,
});
```

**Returns**:
```typescript
{
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  canApprove: boolean;
  canReject: boolean;
  canChangeStatus: boolean;
  canViewAudit: boolean;
}
```

### External Hooks (Ant Design)
- `Form.useForm()` - Ant Form instance

### React Hooks
- `useState()` - State management
- `useEffect()` - Side effects
- `useMemo()` - Memoized calculation for total

## Effects Lifecycle

### Effect 1: Check Permissions
```typescript
useEffect(() => {
  if (!visible) {
    setPermissionError(null);
    return;
  }
  
  if (isEditMode && !permissions.canEdit) {
    setPermissionError('You do not have permission to edit product sales.');
  } else if (!isEditMode && !permissions.canCreate) {
    setPermissionError('You do not have permission to create product sales.');
  } else {
    setPermissionError(null);
  }
}, [visible, isEditMode, permissions.canCreate, permissions.canEdit]);
```

**Dependencies**: `visible`, `isEditMode`, `permissions.canCreate`, `permissions.canEdit`

### Effect 2: Load Customers & Products
```typescript
useEffect(() => {
  const loadData = async () => {
    if (!visible) return;
    
    try {
      setDataLoading(true);
      setLoadingCustomers(true);
      setLoadingProducts(true);
      setError(null);
      
      const [customersData, productsData] = await Promise.all([
        customerService.getCustomers({ pageSize: 1000 }),
        productService.getProducts({ pageSize: 1000, status: 'active' }),
      ]);
      
      // Handle response format variations
      const custArray = Array.isArray(customersData) ? customersData : customersData?.data || [];
      const prodArray = Array.isArray(productsData) ? productsData : productsData?.data || [];
      
      setCustomers(custArray);
      setProducts(prodArray);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load form data';
      setError(errorMsg);
      console.error('Error loading form data:', err);
    } finally {
      setDataLoading(false);
      setLoadingCustomers(false);
      setLoadingProducts(false);
    }
  };

  loadData();
}, [visible]);
```

**Dependencies**: `visible`  
**Side Effects**: Fetches customers and products when drawer opens

### Effect 3: Populate Form on Edit
```typescript
useEffect(() => {
  if (visible && productSale) {
    const selectedCust = customers.find(c => c.id === productSale.customer_id);
    setSelectedCustomer(selectedCust || null);
    
    // Initialize line items from existing sale
    if (!saleItems.length) {
      const lineItem: SaleLineItem = {
        id: `item-${Date.now()}`,
        product_id: productSale.product_id,
        product_name: productSale.product_name,
        product_sku: '',
        quantity: productSale.quantity,
        unit_price: productSale.unit_price,
        discount: 0,
        tax: 0,
        line_total: productSale.total_value,
      };
      setSaleItems([lineItem]);
    }
    
    form.setFieldsValue({
      sale_number: productSale.sale_number,
      customer_id: productSale.customer_id,
      status: productSale.status,
      sale_date: productSale.sale_date ? dayjs(productSale.sale_date) : null,
      delivery_date: productSale.delivery_date ? dayjs(productSale.delivery_date) : null,
      warranty_period: productSale.warranty_period,
      notes: productSale.notes,
    });
  } else if (visible) {
    form.resetFields();
    setSelectedCustomer(null);
    setSaleItems([]);
  }
}, [visible, productSale, form, customers]);
```

**Dependencies**: `visible`, `productSale`, `form`, `customers`  
**Side Effects**: Populates form with edit data or resets for new sale

## Event Handlers

### handleCustomerChange
```typescript
const handleCustomerChange = (customerId: string) => {
  const customer = customers.find(c => c.id === customerId);
  setSelectedCustomer(customer || null);
};
```

**Purpose**: Update selectedCustomer state and display details card  
**Called**: When customer dropdown value changes

### handleAddProduct
```typescript
const handleAddProduct = () => {
  if (!selectedProductId) {
    message.warning('Please select a product');
    return;
  }

  if (saleItems.find(item => item.product_id === selectedProductId)) {
    message.warning('This product is already in the sale. Update the quantity instead.');
    return;
  }

  const selectedProduct = products.find(p => p.id === selectedProductId);
  if (!selectedProduct) {
    message.error('Product not found');
    return;
  }

  const newItem: SaleLineItem = {
    id: `item-${Date.now()}`,
    product_id: selectedProduct.id,
    product_name: selectedProduct.name,
    product_sku: selectedProduct.sku || '',
    product_description: selectedProduct.description,
    quantity: 1,
    unit_price: selectedProduct.price || 0,
    discount: 0,
    tax: 0,
    line_total: selectedProduct.price || 0,
  };

  setSaleItems([...saleItems, newItem]);
  setSelectedProductId(undefined);
  message.success(`${selectedProduct.name} added to sale`);
};
```

**Purpose**: Add selected product to line items  
**Validations**:
- Product selected
- Product not already in sale
- Product exists in products list

**Called**: When Add button clicked

### handleRemoveItem
```typescript
const handleRemoveItem = (itemId: string) => {
  setSaleItems(saleItems.filter(item => item.id !== itemId));
};
```

**Purpose**: Remove product from line items  
**Called**: When delete icon clicked in line items table

### handleUpdateItemQuantity
```typescript
const handleUpdateItemQuantity = (itemId: string, quantity: number) => {
  setSaleItems(saleItems.map(item => {
    if (item.id === itemId) {
      const lineTotal = (item.unit_price * quantity) - item.discount + item.tax;
      return { ...item, quantity, line_total: lineTotal };
    }
    return item;
  }));
};
```

**Purpose**: Update quantity and recalculate line total  
**Formula**: `line_total = (unit_price × quantity) - discount + tax`  
**Called**: When quantity field changes

### handleUpdateItemDiscount
```typescript
const handleUpdateItemDiscount = (itemId: string, discount: number) => {
  setSaleItems(saleItems.map(item => {
    if (item.id === itemId) {
      const lineTotal = (item.unit_price * item.quantity) - discount + item.tax;
      return { ...item, discount, line_total: lineTotal };
    }
    return item;
  }));
};
```

**Purpose**: Update discount and recalculate line total  
**Formula**: `line_total = (unit_price × quantity) - discount + tax`  
**Called**: When discount field changes

### calculateTotalFromItems (useMemo)
```typescript
const calculateTotalFromItems = useMemo(() => {
  return saleItems.reduce((sum, item) => sum + item.line_total, 0);
}, [saleItems]);
```

**Purpose**: Calculate grand total from all line items  
**Memoization**: Only recalculates when saleItems changes  
**Formula**: `grand_total = Sum(all line_totals)`

### handleSubmit
```typescript
const handleSubmit = async () => {
  try {
    const values = await form.validateFields();
    
    if (saleItems.length === 0) {
      message.error('Please add at least one product to the sale');
      return;
    }

    setLoading(true);
    setError(null);

    // Validate customer exists
    const selectedCust = customers.find(c => c.id === values.customer_id);
    if (!selectedCust) {
      message.error('Selected customer not found');
      setLoading(false);
      return;
    }

    // Use first item (for now, future: support multiple)
    const primaryItem = saleItems[0];
    const primaryProduct = products.find(p => p.id === primaryItem.product_id);

    if (!primaryProduct) {
      message.error('Primary product not found');
      setLoading(false);
      return;
    }

    // Prepare form data
    const formData: ProductSaleFormData = {
      customer_id: values.customer_id,
      customer_name: selectedCust.company_name,
      product_id: primaryItem.product_id,
      product_name: primaryItem.product_name,
      quantity: primaryItem.quantity,
      unit_price: primaryItem.unit_price,
      total_value: calculateTotalFromItems,  // Uses grand total
      status: values.status || 'pending',
      sale_date: values.sale_date?.format('YYYY-MM-DD') || new Date().toISOString().split('T')[0],
      delivery_date: values.delivery_date?.format('YYYY-MM-DD') || '',
      warranty_period: values.warranty_period || 12,
      notes: values.notes,
    };

    if (isEditMode && productSale) {
      await productSaleService.updateProductSale(productSale.id, formData);
      message.success('Product sale updated successfully');
    } else {
      await productSaleService.createProductSale(formData);
      message.success('Product sale created successfully');
    }

    form.resetFields();
    onSuccess();
    onClose();
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to save product sale';
    setError(errorMsg);
    message.error(errorMsg);
    console.error('Error saving product sale:', err);
  } finally {
    setLoading(false);
  }
};
```

**Purpose**: Validate and submit form  
**Validations**:
- All form fields valid
- At least one product added
- Customer exists
- Primary product exists

**Creates/Updates**: ProductSale using service  
**Called**: When Create/Update button clicked

### handleClose
```typescript
const handleClose = () => {
  form.resetFields();
  setError(null);
  setSelectedCustomer(null);
  setSaleItems([]);
  setSelectedProductId(undefined);
  onClose();
};
```

**Purpose**: Close drawer and clean up state  
**Called**: When Cancel clicked or drawer closed

## Service Integration

### Customer Service
```typescript
const [customersData, productsData] = await Promise.all([
  customerService.getCustomers({ pageSize: 1000 }),
  // ...
]);
```

**Method**: `getCustomers(options)`  
**Options**: `{ pageSize: 1000 }`  
**Returns**: `Customer[] | { data: Customer[] }`

### Product Service
```typescript
const [customersData, productsData] = await Promise.all([
  // ...
  productService.getProducts({ pageSize: 1000, status: 'active' }),
]);
```

**Method**: `getProducts(options)`  
**Options**: `{ pageSize: 1000, status: 'active' }`  
**Returns**: `Product[] | { data: Product[] }`

### Product Sale Service
```typescript
if (isEditMode && productSale) {
  await productSaleService.updateProductSale(productSale.id, formData);
} else {
  await productSaleService.createProductSale(formData);
}
```

**Methods**:
- `createProductSale(formData): Promise<ProductSale>`
- `updateProductSale(id, formData): Promise<ProductSale>`

## Response Format Handling

**Problem**: Services might return different response formats
- Array: `Customer[]`
- Object with data: `{ data: Customer[] }`

**Solution**: Handle both formats
```typescript
const custArray = Array.isArray(customersData) 
  ? customersData 
  : customersData?.data || [];
```

## Line Items Table Rendering

### Column Layout
```typescript
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
  <thead>
    <tr style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
      <th style={{ padding: '8px', textAlign: 'left' }}>Product</th>
      <th style={{ padding: '8px', textAlign: 'center', width: '60px' }}>Qty</th>
      <th style={{ padding: '8px', textAlign: 'right', width: '70px' }}>Price</th>
      <th style={{ padding: '8px', textAlign: 'right', width: '70px' }}>Discount</th>
      <th style={{ padding: '8px', textAlign: 'right', width: '70px' }}>Total</th>
      <th style={{ padding: '8px', textAlign: 'center', width: '40px' }}></th>
    </tr>
  </thead>
  <tbody>
    {saleItems.map((item) => (
      <tr key={item.id}>
        {/* Row content */}
      </tr>
    ))}
  </tbody>
</table>
```

### Product Column (Name + Description)
```typescript
<td style={{ padding: '8px' }}>
  <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.product_name}</div>
  {item.product_description && (
    <div style={{ fontSize: '11px', color: '#999' }}>{item.product_description}</div>
  )}
</td>
```

### Quantity Column (Editable)
```typescript
<td style={{ padding: '8px', textAlign: 'center' }}>
  <InputNumber
    min={1}
    value={item.quantity}
    onChange={(val) => handleUpdateItemQuantity(item.id, val || 1)}
    size="small"
    style={{ width: '50px' }}
  />
</td>
```

### Price Column (Display)
```typescript
<td style={{ padding: '8px', textAlign: 'right' }}>
  ${item.unit_price.toFixed(2)}
</td>
```

### Discount Column (Editable)
```typescript
<td style={{ padding: '8px', textAlign: 'right' }}>
  <InputNumber
    min={0}
    value={item.discount}
    onChange={(val) => handleUpdateItemDiscount(item.id, val || 0)}
    size="small"
    style={{ width: '60px' }}
  />
</td>
```

### Total Column (Calculated)
```typescript
<td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
  ${item.line_total.toFixed(2)}
</td>
```

### Action Column (Delete)
```typescript
<td style={{ padding: '8px', textAlign: 'center' }}>
  <Button
    type="text"
    danger
    size="small"
    icon={<DeleteIcon />}
    onClick={() => handleRemoveItem(item.id)}
  />
</td>
```

### Summary Row
```typescript
<tr style={{ backgroundColor: '#fafafa', fontWeight: 600, borderTop: '2px solid #f0f0f0' }}>
  <td colSpan={4} style={{ padding: '8px', textAlign: 'right' }}>
    Total:
  </td>
  <td style={{ padding: '8px', textAlign: 'right' }}>
    ${calculateTotalFromItems.toFixed(2)}
  </td>
  <td></td>
</tr>
```

## Form Sections

### 1. Basic Information Section
```typescript
<h3 style={{ marginBottom: 16, fontWeight: 600 }}>Sale Information</h3>
<Form.Item name="sale_number" rules={[{ required: true }]}>
  <Input placeholder="e.g., PS-2025-001" />
</Form.Item>
```

### 2. Customer Section
```typescript
<h3>Customer Information</h3>
{selectedCustomer && <Alert ... />}  {/* Link alert */}
<Form.Item name="customer_id" rules={[{ required: true }]}>
  <Select onSelect={handleCustomerChange} />
</Form.Item>
{selectedCustomer && <Card>...</Card>}  {/* Details card */}
```

### 3. Product Section
```typescript
<h3>Products/Services</h3>
<div>
  <Select value={selectedProductId} onChange={setSelectedProductId} />
  <Button onClick={handleAddProduct}>Add</Button>
</div>
{saleItems.length > 0 ? (
  <Card><table>...</table></Card>  {/* Line items table */}
) : (
  <Empty />
)}
```

### 4. Sale Details Section
```typescript
<h3>Sale Details</h3>
<Form.Item name="sale_date" rules={[{ required: true }]}>
  <DatePicker />
</Form.Item>
<Form.Item name="delivery_date">
  <DatePicker />
</Form.Item>
<Form.Item name="status" initialValue="pending">
  <Select>
    <Select.Option value="draft">Draft</Select.Option>
    {/* ... */}
  </Select>
</Form.Item>
<Form.Item name="warranty_period" initialValue={12}>
  <InputNumber />
</Form.Item>
```

### 5. Additional Information Section
```typescript
<h3>Additional Information</h3>
<Form.Item name="notes">
  <Input.TextArea rows={3} />
</Form.Item>
```

## Conditional Rendering

### Empty State
```typescript
{saleItems.length > 0 ? (
  <Card><table>...</table></Card>
) : (
  <Empty description="No products added" />
)}
```

### Permission Error
```typescript
{permissionError && <Alert type="error" />}
<Button disabled={!!permissionError} />
<Form disabled={!!permissionError} />
```

### Loading
```typescript
{dataLoading ? (
  <Spin />
) : error ? (
  <Alert type="error" />
) : (
  <Form>...</Form>
)}
```

## Drawer Props

```typescript
<Drawer
  title={isEditMode ? 'Edit Product Sale' : 'Create New Product Sale'}
  placement="right"
  width={650}           // Wider for line items table
  onClose={handleClose}
  open={visible}
  footer={
    <Space>
      <Button onClick={handleClose}>Cancel</Button>
      <Button
        type="primary"
        loading={loading}
        disabled={dataLoading || saleItems.length === 0}
        onClick={handleSubmit}
      >
        {isEditMode ? 'Update' : 'Create'}
      </Button>
    </Space>
  }
/>
```

**Width**: 650px (increased from 550px to accommodate line items table)  
**Placement**: Right  
**Disabled State**: Cannot submit without products

## Future Enhancements

### 1. Multiple Line Item Support
```typescript
// When database schema supports line items table
// Save each item in saleItems to product_sales_items table
if (saleItems.length > 0) {
  for (const item of saleItems) {
    await productSaleService.createLineItem(productSale.id, item);
  }
}
```

### 2. Inventory Management
```typescript
// Check product stock before adding
if (product.stock < selectedQuantity) {
  message.warning(`Only ${product.stock} in stock`);
  return;
}
```

### 3. Bulk Upload
```typescript
// Import products from CSV
const handleBulkImport = async (file) => {
  const items = parseCSV(file);
  setSaleItems(items);
};
```

### 4. Product Variants
```typescript
// Support product variants (color, size, etc.)
const handleSelectVariant = (variant) => {
  newItem.variant = variant;
  newItem.product_sku = variant.sku;
};
```

### 5. Tax Calculation
```typescript
// Auto-calculate tax based on customer location
const taxRate = getTaxRate(selectedCustomer.location);
item.tax = item.line_total * taxRate;
```

## Performance Notes

✅ **Optimized**:
- `useMemo` for calculateTotalFromItems
- Separate loading states prevent blocking
- Products filtered to active status
- Page size limited to 1000

⚠️ **Considerations**:
- If customers > 1000: Add pagination or virtual scroll
- If products > 1000: Add infinite scroll or pagination
- Line items in memory: OK for typical sales (< 100 items)

## Testing

### Unit Test Example
```typescript
test('handleAddProduct adds product to line items', () => {
  const product = { id: 'p1', name: 'Widget', sku: 'W-001', price: 100 };
  setSelectedProductId('p1');
  fireEvent.click(screen.getByText('Add'));
  
  expect(saleItems).toHaveLength(1);
  expect(saleItems[0].product_id).toBe('p1');
  expect(saleItems[0].quantity).toBe(1);
  expect(saleItems[0].unit_price).toBe(100);
});
```

### Integration Test Example
```typescript
test('form submission creates product sale with line items', async () => {
  selectCustomer('ACME Corp');
  addProduct('Widget');
  setQuantity(5);
  setDiscount(10);
  
  fireEvent.click(screen.getByText('Create'));
  
  expect(productSaleService.createProductSale).toHaveBeenCalledWith({
    customer_id: 'cust-1',
    product_id: 'prod-1',
    quantity: 5,
    total_value: 490, // (5 * 100) - 10
  });
});
```

---

**Version**: 1.0  
**Status**: ✅ Complete  
**Last Updated**: January 29, 2025
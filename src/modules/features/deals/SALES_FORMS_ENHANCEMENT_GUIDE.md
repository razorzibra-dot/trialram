# Sales Forms Enhancement - Technical Guide
**Complete Reference for SalesDealFormPanel & SalesDealDetailPanel**

**Version**: 1.0.0  
**Last Updated**: January 31, 2025  
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Component Architecture](#component-architecture)
3. [Form Panel (Create/Edit)](#form-panel-createedit)
4. [Detail Panel (View)](#detail-panel-view)
5. [Configuration Objects](#configuration-objects)
6. [Helper Functions](#helper-functions)
7. [Data Flow](#data-flow)
8. [Styling System](#styling-system)
9. [Responsive Design](#responsive-design)
10. [Validation Rules](#validation-rules)
11. [Service Integration](#service-integration)
12. [Best Practices](#best-practices)
13. [Troubleshooting](#troubleshooting)
14. [Examples](#examples)

---

## Overview

### Purpose
The Sales Forms Enhancement provides enterprise-grade professional UI/UX for deal management with two main components:
1. **SalesDealFormPanel** - Create/edit deals with full validation and product integration
2. **SalesDealDetailPanel** - View deal details with rich formatting and key metrics

### Key Features
- 📱 Responsive design for all screen sizes
- 🎨 Professional card-based sections with icon headers
- ✅ Comprehensive validation with helpful error messages
- 🌍 Multi-language ready (uses emoji indicators)
- 🔗 Service factory integration for multi-backend support
- 📊 Rich data formatting (currency, dates, links)
- 🎯 Mobile-first approach

### Design Philosophy
- **Progressive Enhancement**: Works without JavaScript, enhanced with it
- **Mobile-First**: Design starts on mobile, enhances on larger screens
- **Accessibility First**: Semantic HTML, proper ARIA labels
- **Performance**: Minimal re-renders, efficient data fetching

---

## Component Architecture

### SalesDealFormPanel
**Type**: React Functional Component  
**Props**:
```typescript
interface SalesDealFormPanelProps {
  visible: boolean;        // Drawer visibility
  deal: Deal | null;       // Deal object for edit mode (null for create)
  onClose: () => void;     // Called when drawer closes
  onSuccess: () => void;   // Called after successful save
}
```

**Responsibilities**:
- Render drawer with form
- Manage form state
- Load customers and products
- Validate input
- Submit create/update operations
- Display validation errors

### SalesDealDetailPanel
**Type**: React Functional Component  
**Props**:
```typescript
interface SalesDealDetailPanelProps {
  visible: boolean;        // Drawer visibility
  deal: Deal | null;       // Deal object to display
  onClose: () => void;     // Called when drawer closes
  onEdit: () => void;      // Called when edit button clicked
}
```

**Responsibilities**:
- Render drawer with read-only content
- Load customer details
- Format data for display
- Load linked contracts
- Handle navigation
- Show status alerts

---

## Form Panel (Create/Edit)

### Structure

#### Section 1: Deal Overview
```typescript
<Card style={sectionCardStyle}>
  <div style={sectionHeaderStyle}>
    <FileTextOutlined style={iconStyle} />
    Deal Overview
  </div>
  <Row gutter={16}>
    <Col xs={24}>
      <Form.Item label="Deal Title" name="title" rules={[...]}>
        <Input size="large" placeholder="e.g., Enterprise SaaS Implementation - Acme Corp" allowClear />
      </Form.Item>
    </Col>
  </Row>
</Card>
```

**Fields**:
- **Deal Title**: Text input, required, 3-255 characters

#### Section 2: Customer Information
```typescript
<Form.Item
  label="Select Customer"
  name="customer_id"
  rules={[{ required: true, message: 'Customer is required' }]}
  tooltip="Select or search for a customer to link this deal"
>
  <Select size="large" placeholder="Search by company name or contact..." />
</Form.Item>
```

**Fields**:
- **Customer Selection**: Required, searchable dropdown with details preview
- **Customer Details Card**: Shows contact, email, phone, industry, size (only when selected)

#### Section 3: Financial Information
```typescript
<Form.Item
  label="Deal Value"
  name="value"
  rules={[
    { required: saleItems.length === 0, message: 'Deal value is required' },
    { type: 'number', message: 'Please enter a valid number' }
  ]}
>
  <InputNumber size="large" formatter={(v) => `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
</Form.Item>
```

**Fields**:
- **Deal Value**: Number input, auto-disabled if products added, currency formatting
- **Win Probability**: 0-100% slider, default 50%

#### Section 4: Products & Services
**Adding Products**:
```typescript
const handleAddProduct = () => {
  if (!selectedProductId) {
    message.warning('Please select a product');
    return;
  }
  
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const newItem: SaleItem = {
    id: `item-${Date.now()}`,
    product_id: selectedProduct.id,
    product_name: selectedProduct.name,
    quantity: 1,
    unit_price: selectedProduct.price || 0,
    discount: 0,
    tax: 0,
    line_total: selectedProduct.price || 0,
  };
  
  setSaleItems([...saleItems, newItem]);
  setSelectedProductId(undefined);
  message.success(`${selectedProduct.name} added to deal`);
};
```

**Fields**:
- **Product Selection**: Dropdown with search
- **Products Table**: Shows added products with quantity, price, discount, total
- **Total Display**: Summary row with deal total value

**Updating Products**:
```typescript
// Update quantity
handleUpdateItemQuantity(itemId, quantity) {
  const lineTotal = (unit_price * quantity) - discount + tax;
  // ... update state
}

// Update discount
handleUpdateItemDiscount(itemId, discount) {
  const lineTotal = (unit_price * quantity) - discount + tax;
  // ... update state
}

// Remove item
handleRemoveItem(itemId) {
  setSaleItems(saleItems.filter(item => item.id !== itemId));
}
```

#### Section 5: Sales Pipeline & Timeline
```typescript
<Col xs={24} sm={12}>
  <Form.Item
    label="Deal Stage"
    name="stage"
    initialValue="lead"
    rules={[{ required: true, message: 'Stage is required' }]}
    tooltip="Select the current stage in your sales pipeline"
  >
    <Select size="large" loading={loadingStages} placeholder="Select stage" allowClear>
      {stages.map(stage => {
        const config = stageConfig[stage.id?.toLowerCase()] || { emoji: '📌', label: stage.name };
        return <Select.Option key={stage.id} value={stage.id}>
          <span>{config.emoji} {stage.name}</span>
        </Select.Option>;
      })}
    </Select>
  </Form.Item>
</Col>
```

**Fields**:
- **Deal Stage**: Required dropdown with emoji indicators
- **Expected Close Date**: Date picker
- **Actual Close Date**: Date picker
- **Deal Status**: Dropdown (Open, Won, Lost, Cancelled)

#### Section 6: Campaign & Source
```typescript
<Form.Item
  label="Lead Source"
  name="source"
  tooltip="Where did this lead/opportunity come from?"
>
  <Select size="large" placeholder="Select source" allowClear>
    {Object.entries(sourceConfig).map(([key, config]) => (
      <Select.Option key={key} value={key}>
        <span>{config.emoji} {config.label}</span>
      </Select.Option>
    ))}
  </Select>
</Form.Item>
```

**Fields**:
- **Lead Source**: Optional dropdown with emoji indicators
- **Campaign Name**: Optional text field

#### Section 7: Tags & Notes
```typescript
<Form.Item
  label="Internal Notes"
  name="notes"
  rules={[{ max: 1000, message: 'Notes cannot exceed 1000 characters' }]}
>
  <Input.TextArea
    size="large"
    placeholder="Add private notes visible only to your team..."
    rows={3}
    showCount
    maxLength={1000}
    allowClear
  />
</Form.Item>
```

**Fields**:
- **Tags**: Comma-separated tags (optional)
- **Assigned To**: Sales representative selection (optional)
- **Internal Notes**: TextArea with character counter (max 1000)
- **Deal Description**: TextArea with character counter (max 2000)

### Form Submission

```typescript
const handleSubmit = async () => {
  try {
    // 1. Validate all fields
    const values = await form.validateFields();
    
    // 2. Validate customer selection
    if (!values.customer_id) {
      message.error('Please select a customer');
      return;
    }

    // 3. Calculate deal value
    const dealValue = saleItems.length > 0 ? calculateTotalFromItems : values.value;

    // 4. Parse tags
    const tagsArray = values.tags?.split(',').map(t => t.trim()).filter(Boolean) || [];

    // 5. Build deal object
    const dealData = {
      title: values.title,
      description: values.description,
      value: dealValue,
      stage: String(values.stage || 'lead').toLowerCase(),
      status: values.status || null,
      customer_id: values.customer_id,
      assigned_to: values.assigned_to || null,
      expected_close_date: values.expected_close_date?.toISOString(),
      actual_close_date: values.actual_close_date?.toISOString(),
      probability: values.probability,
      notes: values.notes || null,
      source: values.source || null,
      campaign: values.campaign || null,
      tags: tagsArray,
      items: saleItems,
    };

    // 6. Submit (create or update)
    if (isEditMode && deal?.id) {
      await updateDeal.mutateAsync({ id: deal.id, ...dealData });
      message.success('Deal updated successfully');
    } else {
      await createDeal.mutateAsync(dealData);
      message.success('Deal created successfully');
    }

    // 7. Close and refresh
    onSuccess();
    onClose();
  } catch (error) {
    console.error('Form submission error:', error);
    message.error('Failed to save deal');
  }
};
```

---

## Detail Panel (View)

### Key Metrics Card
Displays three prominent statistics:
```typescript
<Row gutter={16}>
  <Col xs={24} sm={8}>
    <Statistic
      value={deal.value}
      prefix="$"
      valueStyle={{ color: '#0ea5e9', fontSize: 18, fontWeight: 600 }}
    />
  </Col>
  <Col xs={24} sm={8}>
    <Statistic value={deal.probability} suffix="%" />
  </Col>
  <Col xs={24} sm={8}>
    <Tag color={statusInfo.color}>
      {statusInfo.emoji} {statusInfo.label}
    </Tag>
  </Col>
</Row>
```

### Pipeline Progress Card
```typescript
<Progress
  percent={getStageProgress(deal.stage)}
  status="active"
  format={() => `${stageInfo.emoji} ${stageInfo.label}`}
  strokeColor="#0ea5e9"
/>
```

### Information Cards
Each card follows the same pattern:
```typescript
<Card style={infoCardStyle}>
  <div style={cardHeaderStyle}>
    <IconComponent style={iconStyle} />
    Card Title
  </div>
  <Row gutter={16}>
    {/* Card content */}
  </Row>
</Card>
```

### Rich Formatting
```typescript
// Currency - Auto-grouped with thousands separators
formatCurrency(5000) // "$5,000"
formatCurrency(1500000) // "$1,500,000"

// Dates - Readable locale format
formatDate("2025-01-31T00:00:00Z") // "January 31, 2025"

// Links - Clickable
<a href={`mailto:${customer.email}`}>{customer.email}</a>
<a href={`tel:${customer.phone}`}>{customer.phone}</a>

// Em-dash for empty fields
{deal.notes || '—'}
```

---

## Configuration Objects

### Stage Configuration
```typescript
const stageConfig: Record<string, { emoji: string; label: string; color?: string }> = {
  'lead': { emoji: '🎯', label: 'Lead', color: 'default' },
  'qualified': { emoji: '✅', label: 'Qualified', color: 'processing' },
  'proposal': { emoji: '📄', label: 'Proposal', color: 'warning' },
  'negotiation': { emoji: '🤝', label: 'Negotiation', color: 'warning' },
  'closed_won': { emoji: '🎉', label: 'Closed Won', color: 'green' },
  'closed_lost': { emoji: '❌', label: 'Closed Lost', color: 'red' },
};

// Usage
const stageInfo = stageConfig[deal.stage];
// Returns: { emoji: '🎉', label: 'Closed Won', color: 'green' }
```

### Status Configuration
```typescript
const statusConfig: Record<string, { 
  emoji: string; 
  label: string; 
  color: string; 
  bgColor: string 
}> = {
  'open': { emoji: '🔵', label: 'Open', color: 'blue', bgColor: '#e6f4ff' },
  'won': { emoji: '✅', label: 'Won', color: 'green', bgColor: '#f6ffed' },
  'lost': { emoji: '❌', label: 'Lost', color: 'red', bgColor: '#fff1f0' },
  'cancelled': { emoji: '⏸️', label: 'Cancelled', color: 'default', bgColor: '#f5f5f5' },
};
```

### Source Configuration
```typescript
const sourceConfig: Record<string, { emoji: string; label: string }> = {
  'inbound': { emoji: '📩', label: 'Inbound' },
  'outbound': { emoji: '📤', label: 'Outbound' },
  'referral': { emoji: '🤝', label: 'Referral' },
  'website': { emoji: '🌐', label: 'Website' },
  'conference': { emoji: '🎤', label: 'Conference' },
};
```

### How to Add New Configurations
```typescript
// 1. Add to configuration object
const stageConfig = {
  ...stageConfig,
  'custom_stage': { emoji: '🆕', label: 'Custom Stage', color: 'purple' },
};

// 2. Use in form
<Select.Option value="custom_stage">
  <span>{stageConfig['custom_stage'].emoji} {stageConfig['custom_stage'].label}</span>
</Select.Option>

// 3. Everywhere referencing that config will automatically update
```

---

## Helper Functions

### Currency Formatting
```typescript
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Examples
formatCurrency(5000)      // "$5,000"
formatCurrency(1500000)   // "$1,500,000"
formatCurrency(50)        // "$50"
formatCurrency(0)         // "$0"
```

### Date Formatting
```typescript
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Examples
formatDate("2025-01-31")           // "January 31, 2025"
formatDate("2025-01-01")           // "January 1, 2025"
formatDate(undefined)              // "—"
```

### Days Until Close
```typescript
const getDaysUntilClose = (dateString: string | undefined): number | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Examples
getDaysUntilClose("2025-02-28")    // 28 (28 days from today)
getDaysUntilClose("2025-01-15")    // -16 (16 days ago - negative)
getDaysUntilClose(undefined)       // null
```

### Stage Progress
```typescript
const getStageProgress = (stage: string): number => {
  const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won'];
  const index = stages.indexOf(stage);
  return index >= 0 ? ((index + 1) / stages.length) * 100 : 0;
};

// Examples
getStageProgress('lead')           // 20 (1/5)
getStageProgress('proposal')       // 60 (3/5)
getStageProgress('closed_won')     // 100 (5/5)
getStageProgress('closed_lost')    // 0 (not in sequence)
```

---

## Data Flow

### Create Deal Flow
```
1. User opens form
   ↓
2. Load customers and products from services
   ↓
3. Form renders with empty fields
   ↓
4. User fills form and clicks "Create Deal"
   ↓
5. Validate all fields
   ↓
6. Build deal object from form values
   ↓
7. Submit via createDeal.mutateAsync()
   ↓
8. Show success message
   ↓
9. Call onSuccess() and onClose()
   ↓
10. Parent component refreshes list
```

### Edit Deal Flow
```
1. User opens form with existing deal
   ↓
2. Load customers and products from services
   ↓
3. Form renders with deal values pre-filled
   ↓
4. User modifies fields and clicks "Update Deal"
   ↓
5. Validate all fields
   ↓
6. Build deal object from form values
   ↓
7. Submit via updateDeal.mutateAsync()
   ↓
8. Show success message
   ↓
9. Call onSuccess() and onClose()
   ↓
10. Parent component refreshes
```

### Detail View Flow
```
1. User clicks on deal in list
   ↓
2. Detail panel opens with deal data
   ↓
3. Load customer details from service
   ↓
4. Load linked contracts from service
   ↓
5. Render read-only information
   ↓
6. User can:
   - View customer profile
   - Navigate to contracts
   - Edit deal
   - Convert to contract
   - Create product sales
```

---

## Styling System

### Card Style
```typescript
const sectionCardStyle = {
  marginBottom: 20,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  borderRadius: 8,
  border: '1px solid #f0f0f0',
};
```

### Section Header Style
```typescript
const sectionHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: 16,
  paddingBottom: 12,
  borderBottom: '2px solid #0ea5e9',
  color: '#1f2937',
  fontWeight: 600,
  fontSize: 14,
};
```

### Icon Style
```typescript
const iconStyle = {
  marginRight: 8,
  color: '#0ea5e9',
  fontSize: 16,
};
```

### Color Palette
```typescript
const colors = {
  primary: '#0ea5e9',           // Sky blue for icons
  heading: '#1f2937',           // Dark gray
  label: '#374151',             // Medium gray
  text: '#6b7280',              // Light gray
  background: '#fafafa',        // Off-white
  border: '#f0f0f0',            // Light border
  success: '#f6ffed',           // Light green
  warning: '#fff1f0',           // Light red
  info: '#e6f4ff',              // Light blue
};
```

---

## Responsive Design

### Breakpoints
```typescript
// Mobile (default)
xs={24}  // Full width

// Tablet and larger
sm={12}  // Half width

// Example
<Row gutter={16}>
  <Col xs={24} sm={12}>
    {/* Full width on mobile, half on tablet+ */}
  </Col>
  <Col xs={24} sm={12}>
    {/* Full width on mobile, half on tablet+ */}
  </Col>
</Row>
```

### Gutter Spacing
```typescript
// Column spacing
gutter={16}  // 16px gap between columns

// Section spacing
marginBottom: 20  // 20px between sections

// Content padding
padding: 12  // Inside cards/tables
```

### Mobile Considerations
- Large input sizes (44px+)
- Touch-friendly spacing
- No horizontal scrolling
- Clear button hierarchy
- Readable font sizes

---

## Validation Rules

### Title Validation
```typescript
{
  required: true,
  message: 'Deal title is required'
},
{
  min: 3,
  message: 'Deal title must be at least 3 characters'
},
{
  max: 255,
  message: 'Deal title cannot exceed 255 characters'
}
```

### Customer Validation
```typescript
{
  required: true,
  message: 'Customer is required'
}
```

### Value Validation
```typescript
{
  required: saleItems.length === 0,
  message: 'Deal value is required'
},
{
  type: 'number',
  message: 'Please enter a valid number'
}
```

### Probability Validation
```typescript
{
  type: 'number',
  message: 'Please enter 0-100'
}
```

### Stage Validation
```typescript
{
  required: true,
  message: 'Stage is required'
}
```

---

## Service Integration

### Customer Service
```typescript
const customerService = useService<CustomerService>('customerService');

// Load customers
const result = await customerService.getCustomers({ pageSize: 1000 });
// Returns: { data: Customer[], total: number }

// Get specific customer
const customer = await customerService.getCustomer(customerId);
// Returns: Customer
```

### Product Service
```typescript
const productService = useService<ProductServiceInterface>('productService');

// Load active products
const result = await productService.getProducts({ pageSize: 1000, status: 'active' });
// Returns: { data: Product[] }

// Get specific product
const product = await productService.getProduct(productId);
// Returns: Product
```

### Deal Service
```typescript
// NOTE: Deals have status (won/lost/cancelled), not pipeline stages.
// Pipeline stages belong to Opportunities. See types/crm.ts.

const { data: deals } = useDeals();
// Returns: Deal[]

const createDeal = useCreateDeal();
// Returns: UseMutationResult

const updateDeal = useUpdateDeal();
// Returns: UseMutationResult

const salesService = useService<SalesService>('salesService');

// Get contracts for deal
const contracts = await salesService.getContractsForDeal(dealId);
// Returns: Contract[]
```

### Error Handling
```typescript
// Gracefully handle auth context initialization
try {
  const result = await customerService.getCustomers();
} catch (error) {
  if (error.message.includes('Unauthorized') || error.message.includes('Tenant context not initialized')) {
    // Auth context initializing - don't show error
  } else {
    // Show error to user
    message.error(`Failed: ${error.message}`);
  }
}
```

---

## Best Practices

### 1. Always Validate Form Before Submit
```typescript
const values = await form.validateFields();
// Throws error if validation fails
```

### 2. Use Service Factory for Multi-Backend Support
```typescript
// ✅ CORRECT
const service = useService<CustomerService>('customerService');

// ❌ WRONG
import directService from '@/services/customerService';
```

### 3. Properly Handle Loading States
```typescript
const [loading, setLoading] = useState(false);

const load = async () => {
  try {
    setLoading(true);
    const data = await service.getData();
  } finally {
    setLoading(false);
  }
};
```

### 4. Use Configuration Objects for Display Values
```typescript
// ✅ CORRECT - Easy to maintain and update
const config = stageConfig[stage];
return <span>{config.emoji} {config.label}</span>;

// ❌ WRONG - Hardcoded values scattered everywhere
if (stage === 'lead') return <span>🎯 Lead</span>;
if (stage === 'qualified') return <span>✅ Qualified</span>;
```

### 5. Centralize Formatting Logic
```typescript
// ✅ CORRECT - Reusable everywhere
const formatted = formatCurrency(amount);

// ❌ WRONG - Formatting scattered throughout
{deal.value.toFixed(2)} // Limited and inconsistent
```

### 6. Always Include Tooltips on Complex Fields
```typescript
<Form.Item
  label="Deal Value"
  tooltip="Enter manually or add products to calculate"
>
  <InputNumber />
</Form.Item>
```

### 7. Provide Real-World Placeholder Examples
```typescript
// ✅ CORRECT
placeholder="e.g., Enterprise SaaS Implementation - Acme Corp"

// ❌ WRONG
placeholder="Enter deal title"
```

### 8. Group Related Fields in Columns
```typescript
// ✅ CORRECT - Organized
<Row gutter={16}>
  <Col xs={24} sm={12}>
    {/* Field 1 */}
  </Col>
  <Col xs={24} sm={12}>
    {/* Related Field 2 */}
  </Col>
</Row>

// ❌ WRONG - No organization
<Form.Item><Input /></Form.Item>
<Form.Item><Input /></Form.Item>
```

---

## Troubleshooting

### Issue: Form doesn't populate with existing deal data

**Cause**: Form dependency array missing or incorrect

**Solution**:
```typescript
// Make sure dependency array is correct
useEffect(() => {
  if (visible && deal) {
    // Set form values
    form.setFieldsValue(formValues);
  }
}, [visible, deal, form]); // ✅ Correct dependencies
```

### Issue: Stage reverts to 'lead' when editing

**Cause**: Stage value not properly normalized to string

**Solution**:
```typescript
// ✅ CORRECT - Always convert to string
stage: deal.stage ? String(deal.stage).toLowerCase() : 'lead',

// ❌ WRONG - Might be different type
stage: deal.stage || 'lead',
```

### Issue: Products table doesn't update when adding items

**Cause**: setState not properly updating

**Solution**:
```typescript
// ✅ CORRECT - Create new array
setSaleItems([...saleItems, newItem]);

// ❌ WRONG - Mutation
saleItems.push(newItem);
setSaleItems(saleItems);
```

### Issue: Currency formatting shows wrong values

**Cause**: InputNumber parser/formatter mismatch

**Solution**:
```typescript
<InputNumber
  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
  parser={(value) => {
    const num = parseInt(value?.replace(/\$\s?|(,*)/g, '') || '0');
    return isNaN(num) ? 0 : num;
  }}
/>
```

### Issue: Mobile view has horizontal scrolling

**Cause**: Using sm={12} with small breakpoint

**Solution**:
```typescript
// ✅ CORRECT - Full width on mobile
<Col xs={24} sm={12}>
  {/* Field */}
</Col>

// ❌ WRONG - Half width on all screens
<Col sm={12}>
  {/* Field */}
</Col>
```

---

## Examples

### Example 1: Create Deal Flow
```typescript
// Parent component
const handleCreateDeal = () => {
  setFormVisible(true);
  setSelectedDeal(null); // Clear for create mode
};

// Form submission
const handleFormSuccess = () => {
  // Refresh deals list
  refetchDeals();
};

// In JSX
<SalesDealFormPanel
  visible={formVisible}
  deal={selectedDeal}
  onClose={() => setFormVisible(false)}
  onSuccess={handleFormSuccess}
/>
```

### Example 2: Edit Deal Flow
```typescript
const handleEditDeal = (deal: Deal) => {
  setSelectedDeal(deal);
  setFormVisible(true);
};

// Form auto-populates with deal data
```

### Example 3: Display Deal Details
```typescript
<SalesDealDetailPanel
  visible={detailVisible}
  deal={selectedDeal}
  onClose={() => setDetailVisible(false)}
  onEdit={() => {
    handleEditDeal(selectedDeal);
    setDetailVisible(false);
  }}
/>
```

### Example 4: Custom Stage Configuration
```typescript
// Add new stage
const customStages = {
  ...stageConfig,
  'discovery': { emoji: '🔍', label: 'Discovery', color: 'blue' },
  'evaluation': { emoji: '📊', label: 'Evaluation', color: 'processing' },
};

// Use in form
<Select>
  {Object.entries(customStages).map(([key, config]) => (
    <Select.Option key={key} value={key}>
      <span>{config.emoji} {config.label}</span>
    </Select.Option>
  ))}
</Select>
```

---

## References

- **Module**: Sales
- **Components**: SalesDealFormPanel, SalesDealDetailPanel
- **Service Factory**: `src/services/serviceFactory.ts`
- **Types**: `src/types/crm.ts`, `src/types/masters.ts`
- **Related**: Customer Forms Enhancement, Contract Forms Enhancement

---

**Status**: ✅ COMPLETE  
**Version**: 1.0.0  
**Last Updated**: January 31, 2025  
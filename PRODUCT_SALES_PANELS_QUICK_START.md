# Product Sales Side Panels - Quick Start Guide

## 🎯 What Changed?

Product Sales now uses **Side Panels (Drawer)** instead of **Modal Popups**.

### Before vs After

| Feature | Before | After |
|---------|--------|-------|
| **Position** | Center Modal | Right Side Panel |
| **Width** | Full/Responsive | Fixed 550px |
| **Background** | Covered | Visible with overlay |
| **Pattern** | Custom Dialog | Ant Design Drawer |

---

## 📁 File Structure

```
product-sales/
├── components/
│   ├── ProductSaleFormPanel.tsx    ← Create/Edit
│   ├── ProductSaleDetailPanel.tsx  ← View Details
│   └── index.ts
├── views/
│   └── ProductSalesPage.tsx        ← Main Page (UPDATED)
└── ...
```

---

## 💻 Basic Usage

### 1️⃣ Import Components

```typescript
import { ProductSaleFormPanel, ProductSaleDetailPanel } from '../components';
```

### 2️⃣ Create State

```typescript
const [showCreateModal, setShowCreateModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [showDetailModal, setShowDetailModal] = useState(false);
const [selectedSale, setSelectedSale] = useState<ProductSale | null>(null);
```

### 3️⃣ Create Handlers

```typescript
// Create new sale
const handleCreateSale = () => {
  setSelectedSale(null);
  setShowCreateModal(true);
};

// Edit existing sale
const handleEditSale = (sale: ProductSale) => {
  setSelectedSale(sale);
  setShowEditModal(true);
};

// View sale details
const handleViewSale = (sale: ProductSale) => {
  setSelectedSale(sale);
  setShowDetailModal(true);
};

// Success callback
const handleFormSuccess = () => {
  setShowCreateModal(false);
  setShowEditModal(false);
  setShowDetailModal(false);
  setSelectedSale(null);
  loadProductSales();      // Reload list
  loadAnalytics();         // Reload stats
};
```

### 4️⃣ Render Panels

```typescript
{/* Create Panel */}
<ProductSaleFormPanel
  visible={showCreateModal}
  productSale={null}
  onClose={() => setShowCreateModal(false)}
  onSuccess={handleFormSuccess}
/>

{/* Edit Panel */}
<ProductSaleFormPanel
  visible={showEditModal}
  productSale={selectedSale}
  onClose={() => setShowEditModal(false)}
  onSuccess={handleFormSuccess}
/>

{/* Detail Panel */}
<ProductSaleDetailPanel
  visible={showDetailModal}
  productSale={selectedSale}
  onClose={() => setShowDetailModal(false)}
  onEdit={() => {
    setShowDetailModal(false);
    setShowEditModal(true);
  }}
/>
```

---

## 🔑 Component Props

### ProductSaleFormPanel

```typescript
interface ProductSaleFormPanelProps {
  visible: boolean;              // Show/hide drawer
  productSale: ProductSale | null; // null = create, object = edit
  onClose: () => void;           // Close handler
  onSuccess: () => void;         // Success callback
}
```

### ProductSaleDetailPanel

```typescript
interface ProductSaleDetailPanelProps {
  visible: boolean;              // Show/hide drawer
  productSale: ProductSale | null; // Sale to display
  onClose: () => void;           // Close handler
  onEdit: () => void;            // Edit button click handler
}
```

---

## 📊 Form Fields

### ProductSaleFormPanel Includes

**Basic Information**
- Sale Number
- Customer (Dropdown)

**Product Details**
- Product (Dropdown)
- Quantity
- Unit Price
- Total Value (Auto-calculated)
- Warranty Period

**Sale Information**
- Sale Date (Date Picker)
- Delivery Date (Date Picker)
- Status (Dropdown)

**Additional Information**
- Notes (Text Area)

---

## 📋 Detail Panel Shows

**Key Metrics**
- Total Value
- Quantity

**Sale Information**
- Sale Number
- Status
- Sale Date
- Delivery Date

**Customer Information**
- Customer Name
- Customer ID
- Email (if available)

**Product Information**
- Product Name
- Product ID
- Quantity
- Unit Price
- Total Value

**Warranty Information**
- Warranty Period
- Warranty Expiry Date

**Service Contract** (if linked)
- Contract ID
- Status

---

## ✅ Complete Example

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { Button, Table, Card, message } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { ProductSaleFormPanel, ProductSaleDetailPanel } from '../components';
import { productSaleService } from '@/services';
import { ProductSale } from '@/types/productSales';

export const ProductSalesPage: React.FC = () => {
  const [productSales, setProductSales] = useState<ProductSale[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Panel states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<ProductSale | null>(null);

  // Load data
  const loadProductSales = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productSaleService.getProductSales();
      setProductSales(response.data);
    } catch (err) {
      message.error('Failed to load product sales');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProductSales();
  }, [loadProductSales]);

  // Handlers
  const handleCreateSale = () => {
    setSelectedSale(null);
    setShowCreateModal(true);
  };

  const handleEditSale = (sale: ProductSale) => {
    setSelectedSale(sale);
    setShowEditModal(true);
  };

  const handleViewSale = (sale: ProductSale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  const handleFormSuccess = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDetailModal(false);
    setSelectedSale(null);
    loadProductSales();
  };

  // Table columns
  const columns = [
    {
      title: 'Sale #',
      dataIndex: 'sale_number',
      key: 'sale_number',
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: 'Total Value',
      dataIndex: 'total_value',
      key: 'total_value',
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: ProductSale) => (
        <>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewSale(record)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditSale(record)}
          />
        </>
      ),
    },
  ];

  return (
    <>
      <Card
        title="Product Sales"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateSale}
          >
            Create Sale
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={productSales}
          loading={loading}
          rowKey="id"
        />
      </Card>

      {/* Create Panel */}
      <ProductSaleFormPanel
        visible={showCreateModal}
        productSale={null}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Edit Panel */}
      <ProductSaleFormPanel
        visible={showEditModal}
        productSale={selectedSale}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Detail Panel */}
      <ProductSaleDetailPanel
        visible={showDetailModal}
        productSale={selectedSale}
        onClose={() => setShowDetailModal(false)}
        onEdit={() => {
          setShowDetailModal(false);
          setShowEditModal(true);
        }}
      />
    </>
  );
};
```

---

## 🚀 Common Patterns

### Pattern 1: View → Edit
```typescript
// Detail panel Edit button
onEdit={() => {
  setShowDetailModal(false);
  setShowEditModal(true);
}}
```

### Pattern 2: Create → View
```typescript
// After successful create
handleFormSuccess = () => {
  setShowCreateModal(false);
  loadProductSales();
}
```

### Pattern 3: List Refresh
```typescript
// Update list after any change
const loadProductSales = async () => {
  const response = await productSaleService.getProductSales();
  setProductSales(response.data);
};
```

---

## ⚠️ Common Mistakes

### ❌ DON'T: Use wrong prop names

```typescript
// WRONG
<ProductSaleFormPanel
  open={showCreateModal}
  onOpenChange={setShowCreateModal}
/>

// RIGHT
<ProductSaleFormPanel
  visible={showCreateModal}
  onClose={() => setShowCreateModal(false)}
/>
```

### ❌ DON'T: Forget to reset state

```typescript
// WRONG - selectedSale stays set
handleFormSuccess = () => {
  setShowCreateModal(false);
};

// RIGHT - clear selection
handleFormSuccess = () => {
  setShowCreateModal(false);
  setSelectedSale(null);
  loadProductSales();
};
```

### ❌ DON'T: Mix create and edit panels

```typescript
// WRONG - same state for both
<ProductSaleFormPanel
  visible={showModal}
  productSale={selectedSale}
/>

// RIGHT - separate states
<ProductSaleFormPanel visible={showCreateModal} productSale={null} />
<ProductSaleFormPanel visible={showEditModal} productSale={selectedSale} />
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Panel doesn't open | Check `visible={true}` and state is set correctly |
| Form not submitting | Check console for validation errors |
| Data not loading | Verify `productSaleService` methods work |
| Duplicate panels | Use separate `visible` state for each panel |
| Close button not working | Check `onClose={() => setState(false)}` |

---

## 📚 Related Files

- **Components**: `src/modules/features/product-sales/components/`
- **Page**: `src/modules/features/product-sales/views/ProductSalesPage.tsx`
- **Types**: `src/types/productSales.ts`
- **Service**: `src/services/productSaleService.ts`

---

## 🎓 Learning Resources

- [Ant Design Drawer](https://ant.design/components/drawer/)
- [React Hooks](https://react.dev/reference/react)
- [TypeScript](https://www.typescriptlang.org/docs/)

---

**Last Updated**: 2024  
**Status**: Production Ready ✅
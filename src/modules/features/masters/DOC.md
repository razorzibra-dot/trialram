---
title: Masters Module
description: Complete documentation for the Masters module including products and companies management, master data maintenance, and configuration
lastUpdated: 2025-01-15
relatedModules: [customers, sales, product-sales, jobworks]
category: module
status: production
---

# Masters Module

## Overview

The Masters module provides centralized management of master data including products and companies. It serves as the configuration hub for foundational entities that are referenced throughout the application in sales, contracts, and inventory operations.

## Module Structure

```
masters/
├── components/              # Reusable UI components
│   ├── ProductsDetailPanel.tsx      # Side drawer for product details
│   ├── ProductsFormPanel.tsx        # Side drawer for create/edit product
│   ├── CompaniesDetailPanel.tsx     # Side drawer for company details
│   ├── CompaniesFormPanel.tsx       # Side drawer for create/edit company
│   ├── ProductsList.tsx             # Products list component
│   └── CompaniesList.tsx            # Companies list component
├── hooks/                   # Custom React hooks
│   ├── useProducts.ts            # React Query hooks for products
│   └── useCompanies.ts           # React Query hooks for companies
├── services/                # Business logic
│   ├── productService.ts         # Service factory-routed service
│   ├── companyService.ts         # Service factory-routed service
│   └── index.ts
├── store/                   # State management
│   ├── productStore.ts           # Zustand state for products
│   └── companyStore.ts           # Zustand state for companies
├── views/                   # Page components
│   ├── ProductsPage.tsx          # Products management page
│   └── CompaniesPage.tsx         # Companies management page
├── index.ts                 # Module entry point
├── routes.tsx               # Route definitions
└── DOC.md                  # This file
```

## Key Features

### 1. Product Management
- Create, read, update, and delete products
- Product categories and SKU management
- Pricing (Cost, Selling price, Markup)
- Stock/Inventory tracking
- Product specifications
- Active/Inactive status

### 2. Company Management
- Company information
- Contact details (Phone, Email, Website)
- Address and billing information
- Company classification (Vendor, Partner, Internal)
- Rating and review system
- Active/Inactive status

### 3. Master Data Maintenance
- Bulk upload capabilities
- Data validation and integrity checks
- Change tracking and audit log
- Export capabilities (CSV, Excel)
- Import/Export data

### 4. Search & Filtering
- Search by product name, SKU, category
- Search by company name, classification
- Filter by status, category, rating
- Custom sorting

## Architecture

### Component Layer

#### ProductsPage.tsx (Products Management)
- Ant Design Table with product list
- Columns: SKU, Name, Category, Price, Stock, Status, Actions
- Search by name/SKU
- Filter by category, status
- Create product button
- Pagination: 50 products per page
- Row actions: View, Edit, Deactivate, Delete

#### CompaniesPage.tsx (Companies Management)
- Ant Design Table with company list
- Columns: Name, Type, Contact, Rating, Status, Actions
- Search by name
- Filter by classification, rating, status
- Create company button
- Pagination: 50 companies per page
- Row actions: View, Edit, Deactivate, Delete

#### ProductsDetailPanel.tsx
- Product information display
- Category and SKU
- Pricing details
- Stock information
- Specifications
- Edit button to switch to form

#### ProductsFormPanel.tsx
- Create new product form
- Edit existing product form
- Fields: Name, SKU, Category, Description, Cost Price, Selling Price, Stock
- Form validation
- Image upload
- Submit/Cancel buttons

#### CompaniesDetailPanel.tsx
- Company information display
- Contact details
- Address
- Classification and rating
- Active status
- Edit button to switch to form

#### CompaniesFormPanel.tsx
- Create/Edit company form
- Fields: Name, Type, Contact Person, Email, Phone, Website, Address
- Billing address
- Classification dropdown
- Form validation
- Submit/Cancel buttons

### State Management (Zustand)

```typescript
interface ProductStore {
  products: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  
  setProducts: (products: Product[]) => void;
  setSelectedProduct: (product: Product | null) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
}

interface CompanyStore {
  companies: Company[];
  selectedCompany: Company | null;
  isLoading: boolean;
  error: string | null;
  
  setCompanies: (companies: Company[]) => void;
  setSelectedCompany: (company: Company | null) => void;
  addCompany: (company: Company) => void;
  updateCompany: (company: Company) => void;
  deleteCompany: (id: string) => void;
}
```

### API/Hooks (React Query)

```typescript
// Products
const { data: products, isLoading } = useProducts(filters);
const { data: product } = useProduct(productId);
const createMutation = useCreateProduct();
const updateMutation = useUpdateProduct(productId);
const deleteMutation = useDeleteProduct(productId);

// Companies
const { data: companies, isLoading } = useCompanies(filters);
const { data: company } = useCompany(companyId);
const createMutation = useCreateCompany();
const updateMutation = useUpdateCompany(companyId);
const deleteMutation = useDeleteCompany(companyId);
```

## Data Types & Interfaces

```typescript
interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  markup: number;
  stock: number;
  reorderLevel: number;
  unit: string;
  status: 'active' | 'inactive' | 'discontinued';
  specifications?: Record<string, string>;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface Company {
  id: string;
  name: string;
  type: 'vendor' | 'partner' | 'internal' | 'customer';
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  billingAddress?: string;
  taxId?: string;
  rating?: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface ProductFilter {
  category?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface CompanyFilter {
  type?: string;
  status?: 'active' | 'inactive';
  rating?: number;
  searchQuery?: string;
}
```

## Integration Points

### 1. Sales Module
- Product selection in sales deals
- Pricing reference
- Stock availability check

### 2. Product Sales Module
- Product information
- Pricing and stock details

### 3. JobWorks Module
- Company assignment for job locations
- Vendor information

### 4. Customers Module
- Company association with customers

## RBAC & Permissions

```typescript
// Required Permissions
- masters:view         // View products and companies
- crm:reference:data:manage       // Create new master data
- crm:reference:data:manage         // Edit existing data
- crm:reference:data:manage       // Delete master data
- masters:import       // Bulk import data

// Role-Based Access
Admin:
  - Full access to all operations
  
Manager:
  - Can view, create, edit
  - Cannot delete
  
User:
  - Can view only
```

## Common Use Cases

### 1. Creating a New Product

```typescript
const createProduct = async (productData: Partial<Product>) => {
  const mutation = useCreateProduct();
  await mutation.mutateAsync({
    sku: 'PROD-001',
    name: 'Product Name',
    category: 'Electronics',
    costPrice: 100,
    sellingPrice: 150,
    stock: 50,
    unit: 'pieces',
    status: 'active',
  });
};
```

### 2. Updating Company Information

```typescript
const updateCompany = async (companyId: string, updates: Partial<Company>) => {
  const mutation = useUpdateCompany(companyId);
  await mutation.mutateAsync(updates);
};
```

### 3. Filtering Products by Category

```typescript
const { data: electronics } = useProducts({
  category: 'Electronics',
  status: 'active',
});
```

## Troubleshooting

### Issue: Products not loading
**Cause**: Service factory not configured  
**Solution**: Verify `VITE_API_MODE` and product service in factory

### Issue: Cannot create product
**Cause**: Validation errors or missing permissions  
**Solution**: Check form validation and RBAC permissions

### Issue: Stock not updating
**Cause**: Cache not invalidating  
**Solution**: Invalidate query cache after mutations

### Issue: Company lookup empty
**Cause**: Companies not loaded or filtered out  
**Solution**: Verify company service and check filters

## Related Documentation

- [Sales Module](../sales/DOC.md)
- [Product Sales Module](../product-sales/DOC.md)
- [Service Factory Pattern](../../docs/architecture/SERVICE_FACTORY.md)

## Version Information

- **Last Updated**: 2025-01-15
- **Module Version**: 1.0.0
- **Production Status**: ✅ Ready
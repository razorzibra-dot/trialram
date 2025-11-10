---
title: Dynamic Data Loading Architecture - No Hardcoded Dropdowns
description: Comprehensive design for loading all dropdown, list, and reference data from database at runtime
date: 2025-02-12
version: 1.0.0
status: architectural-design
category: database-architecture
author: AI Agent
---

# Dynamic Data Loading Architecture

## Executive Summary

**Problem**: Current implementation hardcodes dropdowns, lists, and enums (categories, statuses, suppliers, etc.) in TypeScript/React components, causing:
- ❌ New categories/statuses require code deployment
- ❌ Multiple sources of truth (database + code)
- ❌ Difficult to add new options at runtime
- ❌ Complex form maintenance
- ❌ Scaling issues for multi-tenant systems

**Solution**: Implement a comprehensive dynamic data loading system where ALL reference data (dropdowns, lists, enums) is loaded from database at application startup and cached with proper invalidation strategy.

**Benefits**:
- ✅ Add new categories/statuses without code deployment
- ✅ Single source of truth (database only)
- ✅ Runtime configuration changes
- ✅ Multi-tenant customization
- ✅ Reduced code complexity

---

## NO STATIC DATA RULESET - Strict Enforcement Policy

### The Golden Rule

**NO HARDCODED REFERENCE DATA IN CODE. ALL REFERENCE DATA MUST COME FROM THE DATABASE.**

This is non-negotiable. Every dropdown, option list, status value, category, or reference data item must be:
1. ✅ Stored in database tables (product_categories, suppliers, status_options, reference_data)
2. ✅ Loaded dynamically at runtime from the database
3. ✅ Cached in ReferenceDataContext or React Query
4. ✅ Displayed via DynamicSelect or DynamicMultiSelect components
5. ❌ **NEVER** hardcoded in .tsx, .ts, .js, or .jsx files

---

### Enforcement Rules

#### Rule 1: No Enum-Style Constants for Reference Data
**❌ FORBIDDEN:**
```typescript
// NEVER DO THIS
const STATUS_OPTIONS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const PRIORITY_LEVELS = ['High', 'Medium', 'Low'];

const DEPARTMENTS = ['Sales', 'Support', 'Engineering'];
```

**✅ CORRECT:**
```typescript
// Use custom hooks from reference data
const { getStatusesByModule } = useReferenceData();
const statuses = getStatusesByModule('sales');

// Or use DynamicSelect component
<DynamicSelect type="status" module="sales" value={status} onChange={setStatus} />
```

#### Rule 2: No Inline Options Arrays in Components
**❌ FORBIDDEN:**
```typescript
export const ProductForm = () => {
  return (
    <Select options={[
      { label: 'Electronics', value: 'electronics' },
      { label: 'Furniture', value: 'furniture' },
      { label: 'Clothing', value: 'clothing' },
    ]} />
  );
};
```

**✅ CORRECT:**
```typescript
export const ProductForm = () => {
  return (
    <DynamicSelect 
      type="categories" 
      value={category} 
      onChange={setCategory} 
    />
  );
};
```

#### Rule 3: No Static Object Mappings for Display Names
**❌ FORBIDDEN:**
```typescript
const statusDisplay: Record<string, string> = {
  'open': 'Open Ticket',
  'in_progress': 'In Progress',
  'closed': 'Closed',
};

export const TicketStatus = ({ status }) => {
  return <span>{statusDisplay[status]}</span>;
};
```

**✅ CORRECT:**
```typescript
const { getStatusesByModule } = useReferenceData();

export const TicketStatus = ({ statusKey }) => {
  const statuses = getStatusesByModule('tickets');
  const status = statuses.find(s => s.statusKey === statusKey);
  return <span>{status?.displayLabel || statusKey}</span>;
};
```

#### Rule 4: No CSV/JSON Files with Hardcoded Reference Data
**❌ FORBIDDEN:**
```typescript
// NEVER create files like these:
// - src/data/statuses.json
// - src/constants/categories.json
// - src/seeds/suppliers.csv
// - config/reference-data.yaml

import staticData from '../data/categories.json';
```

**✅ CORRECT:**
```typescript
// Load from database at runtime
const { categories } = useReferenceData();
```

#### Rule 5: No Default Export of Static Options
**❌ FORBIDDEN:**
```typescript
// NEVER do this in constants files
export const DEFAULT_SUPPLIER_OPTIONS = [
  { id: '1', name: 'Supplier A' },
  { id: '2', name: 'Supplier B' },
];

// Then use in a component
import { DEFAULT_SUPPLIER_OPTIONS } from '@/constants';
```

**✅ CORRECT:**
```typescript
export const useSuppliers = () => {
  const { suppliers } = useReferenceData();
  return suppliers;
};

// Use in component
const suppliers = useSuppliers();
```

#### Rule 6: No Conditional Logic Based on Hardcoded Values
**❌ FORBIDDEN:**
```typescript
if (status === 'pending' || status === 'open' || status === 'awaiting') {
  // show pending badge
}
```

**✅ CORRECT:**
```typescript
const { getStatusesByModule } = useReferenceData();
const statuses = getStatusesByModule('tickets');
const pendingStatuses = statuses.filter(s => s.metadata?.isPending);

if (pendingStatuses.some(s => s.statusKey === status)) {
  // show pending badge
}
```

---

### Code Review Checklist

Before merging any code, verify:

- [ ] **No hardcoded arrays/objects** containing reference data
- [ ] **No magic strings** for statuses, categories, or reference values
- [ ] **No static const/enum** for dropdowns or options
- [ ] **All dropdowns use DynamicSelect or DynamicMultiSelect**
- [ ] **All list data uses custom hooks** (useStatusOptions, useCategories, etc.)
- [ ] **No JSON/CSV files** in src/data or src/constants for reference data
- [ ] **All forms fetch data from ReferenceDataContext** via hooks
- [ ] **Error boundaries** handle reference data loading failures gracefully
- [ ] **Loading states** shown while reference data is fetching

---

### Anti-Patterns Checklist - Search for These During Code Review

Run grep searches in code review to catch violations:

```bash
# Search for hardcoded status strings
grep -r "status.*=" src/ | grep -E "(pending|approved|rejected|completed|open|closed)"

# Search for inline option arrays
grep -r "options.*=" src/ --include="*.tsx" --include="*.ts" | grep "\["

# Search for imported static data files
grep -r "from.*\.json" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules

# Search for hardcoded SELECT options
grep -r "<Select" src/ --include="*.tsx" | grep -v "DynamicSelect"

# Search for static object mappings
grep -r "Record<string" src/ | grep -v "database\|service\|api"
```

---

### Allowed Patterns

The following patterns are **ALLOWED** and **ENCOURAGED**:

✅ **Using ReferenceDataContext:**
```typescript
const { categories, suppliers, getStatusesByModule } = useReferenceData();
```

✅ **Using Custom Hooks:**
```typescript
const categories = useCategories();
const suppliers = useSuppliers();
const statuses = useStatusOptions('sales');
```

✅ **Using DynamicSelect Components:**
```typescript
<DynamicSelect type="categories" value={catId} onChange={setCatId} />
<DynamicSelect type="status" module="sales" value={status} onChange={setStatus} />
<DynamicSelect type="suppliers" value={supplierId} onChange={setSupplierId} />
<DynamicSelect type="custom" category="priority" value={priority} onChange={setPriority} />
```

✅ **Using React Query for Advanced Caching:**
```typescript
const { data: categories, isLoading } = useQuery({
  queryKey: ['reference-data', 'categories'],
  queryFn: () => referenceDataLoader.loadCategories(),
  staleTime: 5 * 60 * 1000,
});
```

✅ **Service Layer Pattern (Database Focus):**
```typescript
// In services/api/supabase/yourModule.ts
const categories = await referenceDataLoader.loadCategories();
const filtered = categories.filter(c => c.isActive);
```

---

### Violations and Corrections

#### Violation Example 1: Hardcoded Status Form
```typescript
// ❌ WRONG
export const TicketForm = () => {
  const [status, setStatus] = useState('open');
  
  return (
    <Select 
      value={status}
      onChange={setStatus}
      options={[
        { label: 'Open', value: 'open' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Closed', value: 'closed' },
      ]}
    />
  );
};

// ✅ CORRECT
export const TicketForm = () => {
  const [status, setStatus] = useState('');
  
  return (
    <DynamicSelect 
      type="status"
      module="tickets"
      value={status}
      onChange={setStatus}
    />
  );
};
```

#### Violation Example 2: Hardcoded Mapping
```typescript
// ❌ WRONG
const STATUS_COLORS: Record<string, string> = {
  'open': 'blue',
  'in_progress': 'orange',
  'closed': 'green',
};

export const StatusBadge = ({ status }: { status: string }) => {
  return <span style={{ color: STATUS_COLORS[status] }}>{status}</span>;
};

// ✅ CORRECT
export const StatusBadge = ({ statusKey }: { statusKey: string }) => {
  const { getStatusesByModule } = useReferenceData();
  const statuses = getStatusesByModule('tickets');
  const status = statuses.find(s => s.statusKey === statusKey);
  
  return (
    <span style={{ color: status?.colorCode }}>
      {status?.displayLabel || statusKey}
    </span>
  );
};
```

#### Violation Example 3: Hardcoded Import
```typescript
// ❌ WRONG (this file should never exist)
// src/constants/supplier-list.json
[
  { "id": "1", "name": "Supplier A" },
  { "id": "2", "name": "Supplier B" }
]

// Then in component:
import suppliers from '../constants/supplier-list.json';

// ✅ CORRECT
export const SupplierSelect = () => {
  const suppliers = useSuppliers();
  return <DynamicSelect type="suppliers" />;
};
```

---

### Enforcement Mechanisms

#### 1. Pre-Commit Hook
Add to `.husky/pre-commit`:
```bash
# Prevent hardcoded reference data patterns
grep -r "const.*OPTIONS\|const.*LIST\|const.*STATUSES" src/ --include="*.ts" --include="*.tsx" && \
  echo "❌ VIOLATION: Hardcoded options/lists detected. Move to database." && exit 1 || true

grep -r "from.*\.json\|from.*\.csv" src/ --include="*.ts" --include="*.tsx" | \
  grep -v node_modules && \
  echo "❌ VIOLATION: Importing static data files. Use dynamic data loading." && exit 1 || true
```

#### 2. ESLint Rules
Add to `.eslintrc.json`:
```json
{
  "rules": {
    "no-hardcoded-enums": "error",
    "no-static-data-imports": "error"
  }
}
```

#### 3. Code Review Template
Add to PR template:
```markdown
## Reference Data Compliance
- [ ] No hardcoded reference data (statuses, categories, suppliers)
- [ ] All dropdowns use DynamicSelect component
- [ ] All form options loaded from ReferenceDataContext
- [ ] No static .json/.csv files imported for reference data
```

#### 4. TypeScript Strict Mode
Enable in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

### Migration Checklist for Existing Code

If migrating existing hardcoded data:

1. **Identify all hardcoded reference data**
   - Search for arrays/objects with labels and values
   - Find all static mappings and enums
   - Locate imported .json/.csv files

2. **Create database records** (if not already done)
   - Insert into product_categories
   - Insert into status_options
   - Insert into reference_data
   - Insert into suppliers

3. **Create custom hook** (if needed)
   - Hook name format: `use[DataType]s()` (e.g., useStatusOptions, useCategories)
   - Return data filtered and mapped for component use

4. **Update component**
   - Remove hardcoded options
   - Replace with DynamicSelect or custom hook
   - Add loading and error states

5. **Test thoroughly**
   - Verify dropdown populates correctly
   - Test with empty database (show fallback)
   - Test with multiple values
   - Test cache invalidation

---

## Architecture Overview

### 3-Layer Data Loading System

```
┌────────────────────────────────────────────────────────┐
│                APPLICATION START                        │
│                                                          │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│   LAYER 1: DATA LOADER SERVICE                          │
│   • Fetches all reference data from database            │
│   • Runs on app initialization                          │
│   • Singleton pattern (loads once)                      │
│   • Error handling with fallbacks                       │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│   LAYER 2: REFERENCE DATA CONTEXT                       │
│   • Provides data to entire React app                   │
│   • Maintains cache with TTL                            │
│   • Broadcasts invalidation events                      │
│   • Handles mutations (add/update/delete)               │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│   LAYER 3: CUSTOM HOOKS & COMPONENTS                    │
│   • useCategories(), useSuppliers(), useStatuses()      │
│   • <DynamicSelect>, <DynamicMultiSelect>               │
│   • Automatic cache refresh on mutations                │
│   • Optimized re-renders                                │
└────────────────────────────────────────────────────────┘
```

---

## Database Schema for Reference Data

### Reference Data Tables (Required)

```sql
-- Categories for products
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, name),
  INDEX idx_tenant_active (tenant_id, is_active)
);

-- Status options for various modules
CREATE TABLE status_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  module VARCHAR(100) NOT NULL, -- 'sales', 'tickets', 'contracts', etc.
  status_key VARCHAR(100) NOT NULL, -- 'pending', 'completed', 'cancelled'
  display_label VARCHAR(255) NOT NULL,
  description TEXT,
  color_code VARCHAR(7), -- '#FF5733'
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, module, status_key),
  INDEX idx_tenant_module (tenant_id, module, is_active)
);

-- Suppliers reference
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, name),
  INDEX idx_tenant_active (tenant_id, is_active)
);

-- Generic reference data for custom dropdowns
CREATE TABLE reference_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  category VARCHAR(100) NOT NULL, -- 'priority', 'severity', 'department', etc.
  key VARCHAR(100) NOT NULL, -- unique identifier
  label VARCHAR(255) NOT NULL, -- display text
  description TEXT,
  metadata JSONB, -- additional data (color, icon, etc.)
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, category, key),
  INDEX idx_tenant_category (tenant_id, category, is_active)
);
```

---

## Implementation Layers

### LAYER 1: Data Loader Service

**File**: `src/services/api/referenceDataLoader.ts`

```typescript
// Types for reference data
export interface CategoryData {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface StatusOption {
  id: string;
  module: string;
  statusKey: string;
  displayLabel: string;
  description?: string;
  colorCode?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface SupplierData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ReferenceDataItem {
  id: string;
  category: string;
  key: string;
  label: string;
  description?: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  sortOrder: number;
}

// Loader service
export const referenceDataLoader = {
  // Load all reference data
  async loadAllReferenceData() {
    const [categories, statuses, suppliers, genericData] = await Promise.all([
      this.loadCategories(),
      this.loadStatusOptions(),
      this.loadSuppliers(),
      this.loadGenericReferenceData(),
    ]);

    return {
      categories,
      statuses,
      suppliers,
      genericData,
      loadedAt: new Date(),
    };
  },

  // Load product categories
  async loadCategories(): Promise<CategoryData[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('id, name, description, is_active, sort_order')
      .eq('tenant_id', getCurrentTenantId())
      .eq('is_active', true)
      .order('sort_order, name');

    if (error) throw error;
    return data || [];
  },

  // Load status options for specific module
  async loadStatusOptions(module?: string): Promise<StatusOption[]> {
    let query = supabase
      .from('status_options')
      .select('*')
      .eq('tenant_id', getCurrentTenantId())
      .eq('is_active', true)
      .order('sort_order, display_label');

    if (module) {
      query = query.eq('module', module);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Load suppliers
  async loadSuppliers(): Promise<SupplierData[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name, email, phone, is_active, sort_order')
      .eq('tenant_id', getCurrentTenantId())
      .eq('is_active', true)
      .order('sort_order, name');

    if (error) throw error;
    return data || [];
  },

  // Load generic reference data
  async loadGenericReferenceData(): Promise<ReferenceDataItem[]> {
    const { data, error } = await supabase
      .from('reference_data')
      .select('*')
      .eq('tenant_id', getCurrentTenantId())
      .eq('is_active', true)
      .order('category, sort_order, label');

    if (error) throw error;
    return data || [];
  },

  // Get specific reference data by category
  async getReferenceByCat egory(category: string): Promise<ReferenceDataItem[]> {
    const { data, error } = await supabase
      .from('reference_data')
      .select('*')
      .eq('tenant_id', getCurrentTenantId())
      .eq('category', category)
      .eq('is_active', true)
      .order('sort_order, label');

    if (error) throw error;
    return data || [];
  },
};
```

---

### LAYER 2: Reference Data Context

**File**: `src/contexts/ReferenceDataContext.tsx`

```typescript
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { referenceDataLoader } from '@/services/api/referenceDataLoader';

// Context types
interface ReferenceDataContextType {
  // Loaded data
  categories: CategoryData[];
  statuses: StatusOption[];
  suppliers: SupplierData[];
  genericData: ReferenceDataItem[];

  // Status
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;

  // Getters (filtered/organized)
  getStatusesByModule: (module: string) => StatusOption[];
  getCategoryById: (id: string) => CategoryData | undefined;
  getSupplierById: (id: string) => SupplierData | undefined;
  getRefDataByCategory: (category: string) => ReferenceDataItem[];

  // Mutations & cache management
  addCategory: (category: CategoryData) => Promise<void>;
  updateCategory: (id: string, updates: Partial<CategoryData>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  addSupplier: (supplier: SupplierData) => Promise<void>;
  updateSupplier: (id: string, updates: Partial<SupplierData>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  // Cache refresh
  invalidateCache: () => Promise<void>;
  refreshData: (type?: 'categories' | 'statuses' | 'suppliers' | 'all') => Promise<void>;
}

const ReferenceDataContext = createContext<ReferenceDataContextType | null>(null);

// Provider component
export const ReferenceDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [genericData, setGenericData] = useState<ReferenceDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Initial load
  useEffect(() => {
    loadAllData();

    // Set up periodic refresh (every 5 minutes)
    const interval = setInterval(loadAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await referenceDataLoader.loadAllReferenceData();
      setCategories(data.categories);
      setStatuses(data.statuses);
      setSuppliers(data.suppliers);
      setGenericData(data.genericData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Failed to load reference data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Getters
  const getStatusesByModule = useCallback(
    (module: string) => statuses.filter((s) => s.module === module),
    [statuses]
  );

  const getCategoryById = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories]
  );

  const getSupplierById = useCallback(
    (id: string) => suppliers.find((s) => s.id === id),
    [suppliers]
  );

  const getRefDataByCategory = useCallback(
    (category: string) => genericData.filter((d) => d.category === category),
    [genericData]
  );

  // Mutations
  const addCategory = useCallback(
    async (category: CategoryData) => {
      setCategories((prev) => [...prev, category]);
      // Optimistic update - actual API call handled elsewhere
    },
    []
  );

  const updateCategory = useCallback(
    async (id: string, updates: Partial<CategoryData>) => {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    },
    []
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    },
    []
  );

  const addSupplier = useCallback(
    async (supplier: SupplierData) => {
      setSuppliers((prev) => [...prev, supplier]);
    },
    []
  );

  const updateSupplier = useCallback(
    async (id: string, updates: Partial<SupplierData>) => {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const deleteSupplier = useCallback(
    async (id: string) => {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    },
    []
  );

  // Cache management
  const invalidateCache = useCallback(async () => {
    await loadAllData();
  }, [loadAllData]);

  const refreshData = useCallback(
    async (type: 'categories' | 'statuses' | 'suppliers' | 'all' = 'all') => {
      if (type === 'all' || type === 'categories') {
        const newCategories = await referenceDataLoader.loadCategories();
        setCategories(newCategories);
      }
      if (type === 'all' || type === 'statuses') {
        const newStatuses = await referenceDataLoader.loadStatusOptions();
        setStatuses(newStatuses);
      }
      if (type === 'all' || type === 'suppliers') {
        const newSuppliers = await referenceDataLoader.loadSuppliers();
        setSuppliers(newSuppliers);
      }
      setLastUpdated(new Date());
    },
    []
  );

  const value: ReferenceDataContextType = {
    categories,
    statuses,
    suppliers,
    genericData,
    isLoading,
    error,
    lastUpdated,
    getStatusesByModule,
    getCategoryById,
    getSupplierById,
    getRefDataByCategory,
    addCategory,
    updateCategory,
    deleteCategory,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    invalidateCache,
    refreshData,
  };

  return (
    <ReferenceDataContext.Provider value={value}>
      {children}
    </ReferenceDataContext.Provider>
  );
};

// Hook to use context
export const useReferenceData = () => {
  const context = useContext(ReferenceDataContext);
  if (!context) {
    throw new Error(
      'useReferenceData must be used within ReferenceDataProvider'
    );
  }
  return context;
};
```

---

### LAYER 3: Custom Hooks & Components

**File**: `src/hooks/useReferenceDataOptions.ts`

```typescript
import { useMemo } from 'react';
import { useReferenceData } from '@/contexts/ReferenceDataContext';

// Hook to get categories as select options
export const useCategories = () => {
  const { categories } = useReferenceData();
  return useMemo(
    () =>
      categories.map((cat) => ({
        label: cat.name,
        value: cat.id,
        description: cat.description,
      })),
    [categories]
  );
};

// Hook to get suppliers as select options
export const useSuppliers = () => {
  const { suppliers } = useReferenceData();
  return useMemo(
    () =>
      suppliers.map((sup) => ({
        label: sup.name,
        value: sup.id,
        email: sup.email,
      })),
    [suppliers]
  );
};

// Hook to get statuses for specific module
export const useStatusOptions = (module: string) => {
  const { getStatusesByModule } = useReferenceData();
  return useMemo(
    () =>
      getStatusesByModule(module).map((status) => ({
        label: status.displayLabel,
        value: status.statusKey,
        color: status.colorCode,
        description: status.description,
      })),
    [module, getStatusesByModule]
  );
};

// Hook to get generic reference data
export const useReferenceDataOptions = (category: string) => {
  const { getRefDataByCategory } = useReferenceData();
  return useMemo(
    () =>
      getRefDataByCategory(category).map((item) => ({
        label: item.label,
        value: item.key,
        description: item.description,
        metadata: item.metadata,
      })),
    [category, getRefDataByCategory]
  );
};
```

**File**: `src/components/forms/DynamicSelect.tsx`

```typescript
import React from 'react';
import { Select, Spin } from 'antd';
import { useReferenceData } from '@/contexts/ReferenceDataContext';

interface DynamicSelectProps {
  type: 'categories' | 'suppliers' | 'status' | 'custom';
  module?: string; // For status: which module
  category?: string; // For custom reference data
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
}

export const DynamicSelect: React.FC<DynamicSelectProps> = ({
  type,
  module,
  category,
  value,
  onChange,
  placeholder,
  allowClear = true,
  disabled = false,
}) => {
  const { categories, suppliers, getStatusesByModule, getRefDataByCategory, isLoading } =
    useReferenceData();

  let options: Array<{ label: string; value: string }> = [];

  if (type === 'categories') {
    options = categories.map((cat) => ({
      label: cat.name,
      value: cat.id,
    }));
  } else if (type === 'suppliers') {
    options = suppliers.map((sup) => ({
      label: sup.name,
      value: sup.id,
    }));
  } else if (type === 'status' && module) {
    options = getStatusesByModule(module).map((status) => ({
      label: status.displayLabel,
      value: status.statusKey,
    }));
  } else if (type === 'custom' && category) {
    options = getRefDataByCategory(category).map((item) => ({
      label: item.label,
      value: item.key,
    }));
  }

  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder || 'Select...'}
      allowClear={allowClear}
      disabled={disabled || isLoading}
      loading={isLoading}
    />
  );
};
```

---

## Integration with 8-Layer Normalization

### Updated 8-Layer Pattern (with Dynamic Data)

```
LAYER 1: DATABASE ✅
├─ Reference data tables (categories, suppliers, status_options, reference_data)
└─ FK relationships to main tables

LAYER 2: TYPESCRIPT TYPES ✅
├─ Product interface uses category_id (UUID)
├─ ReferenceData types for all options
└─ Form data interfaces updated

LAYER 3: MOCK SERVICE ✅
├─ Mock categories, suppliers, statuses
└─ Mock data loader service

LAYER 4: SUPABASE SERVICE ✅
├─ Real data from database
└─ Reference data loader queries

LAYER 5: SERVICE FACTORY ✅
├─ Routes reference data queries
└─ Returns mock or Supabase based on VITE_API_MODE

LAYER 6: MODULE SERVICE ✅
├─ Uses factory for FK lookups
└─ No hardcoded data

LAYER 7: REACT CONTEXT (NEW) ✅
├─ ReferenceDataContext provides all options
├─ Cache management and refresh
└─ Invalidation on mutations

LAYER 8: UI COMPONENTS ✅
├─ DynamicSelect components use context
├─ useCategories, useSuppliers hooks
└─ No hardcoded dropdowns
```

---

## Migration Strategy

### Phase A: Add Reference Data Layer (Week 1)

**Task A.1**: Create reference data tables (0.5 day)
- product_categories table (already exists, seed data)
- suppliers table (already exists, seed data)
- status_options table (new)
- reference_data table (new)

**Task A.2**: Seed initial data (0.5 day)
- Migrate existing hardcoded enums → database
- Populate statuses for all modules
- Populate categories and suppliers

**Task A.3**: Create data loader service (1 day)
- referenceDataLoader.ts
- Mock implementation for VITE_API_MODE=mock
- Supabase implementation for VITE_API_MODE=supabase

**Task A.4**: Create ReferenceDataContext (1 day)
- Provider component with cache management
- useReferenceData hook
- Data refresh and invalidation logic

### Phase B: Update Modules (Week 2-3)

**Task B.1**: Update Products Module (1 day)
- Layer 3 (Mock): Use reference data loader
- Layer 4 (Supabase): Use real queries
- Layer 8 (UI): Replace hardcoded dropdowns with DynamicSelect

**Task B.2**: Update Other Modules (1 day each)
- Sales, Tickets, Contracts, Job Works
- Same pattern: data loader → context → components

### Phase C: Remove Hardcoding (Week 3)

**Task C.1**: Audit hardcoded data
- Search for hardcoded enums/options
- Create mapping document

**Task C.2**: Replace hardcoded references
- Point all selects to DynamicSelect
- Remove static dropdown data

---

## Testing Strategy

### Unit Tests

```typescript
// Test reference data loading
describe('referenceDataLoader', () => {
  test('loadAllReferenceData should return all types', async () => {
    const data = await referenceDataLoader.loadAllReferenceData();
    expect(data.categories).toBeDefined();
    expect(data.statuses).toBeDefined();
    expect(data.suppliers).toBeDefined();
  });

  test('loadStatusOptions should filter by module', async () => {
    const statuses = await referenceDataLoader.loadStatusOptions('sales');
    expect(all(s => s.module === 'sales')).toBe(true);
  });
});
```

### Integration Tests

```typescript
// Test context functionality
describe('ReferenceDataContext', () => {
  test('Should provide categories via hook', () => {
    render(<ReferenceDataProvider><TestComponent /></ReferenceDataProvider>);
    const { result } = renderHook(() => useReferenceData());
    expect(result.current.categories.length).toBeGreaterThan(0);
  });

  test('Should refresh data on mutation', async () => {
    const { result } = renderHook(() => useReferenceData());
    await result.current.refreshData('categories');
    expect(result.current.lastUpdated).toBeDefined();
  });
});
```

---

## Performance Considerations

### Cache Strategy

```typescript
// Cache configuration
const CACHE_CONFIG = {
  INITIAL_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_TTL: 30 * 60 * 1000, // 30 minutes
  AUTO_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  STALE_WHILE_REVALIDATE: 1 * 60 * 1000, // 1 minute
};
```

### Optimization Techniques

1. **Memoization**: useMemo for option derivation
2. **Selective Invalidation**: Only refresh changed data type
3. **Batch Loading**: Load all at once, not individually
4. **Lazy Loading**: Load generic reference data on-demand
5. **Request Deduplication**: Prevent simultaneous identical requests

---

## Security Considerations

### Row-Level Security

```sql
-- Ensure reference data respects tenant_id
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see categories in their tenant"
  ON product_categories
  FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

### Permission Checks

```typescript
// Validate user can modify reference data
const canManageReferences = (user: User) => {
  return user.role === 'admin' || user.role === 'super_admin';
};
```

---

## Rollback Strategy

### If Dynamic Data Breaks

```typescript
// Fallback mechanism
export const fallbackOptions = {
  categories: [
    { id: 'fallback_1', name: 'Default', sortOrder: 0 }
  ],
  statuses: [
    { statusKey: 'pending', displayLabel: 'Pending' }
  ],
  // ... other fallbacks
};
```

---

## Monitoring & Maintenance

### Logs to Track

- ✅ Data load times
- ✅ Cache hit rates
- ✅ Refresh failures
- ✅ Mutation errors
- ✅ Invalid data access

### Maintenance Tasks

- **Weekly**: Review cache hit rates
- **Monthly**: Audit hardcoded data removal
- **Quarterly**: Performance analysis

---

## Success Metrics

| Metric | Target | Current | After |
|--------|--------|---------|-------|
| **Hardcoded Dropdowns** | 0 | 15+ | 0 |
| **Dynamic Options** | 100% | 30% | 100% |
| **Data Load Time** | <500ms | N/A | <200ms |
| **Cache Hit Rate** | >90% | N/A | >95% |
| **Add New Option Time** | <1 min (DB only) | ~30 min (code + deploy) | <1 min |

---

## Checklist for Implementation

- [ ] Database tables created (product_categories, suppliers, status_options, reference_data)
- [ ] Initial data seeded
- [ ] referenceDataLoader service created
- [ ] ReferenceDataContext provider built
- [ ] Custom hooks created (useCategories, useSuppliers, etc.)
- [ ] DynamicSelect component built
- [ ] Products module updated (Layer 3-8)
- [ ] Sales module updated
- [ ] Tickets module updated
- [ ] Contracts module updated
- [ ] Job Works module updated
- [ ] All hardcoded dropdowns removed
- [ ] Unit tests passing (100%)
- [ ] Integration tests passing (100%)
- [ ] Performance benchmarks validated
- [ ] Production deployment complete

---

**Status**: Ready for Implementation  
**Estimated Effort**: 1-2 weeks  
**Team Size**: 2-3 developers + 1 DBA
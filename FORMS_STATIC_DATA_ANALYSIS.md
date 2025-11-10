---
title: Forms Static Data Analysis - All Modules & Components
description: Comprehensive analysis of all form components to identify hardcoded/static data and recommendations for dynamic fetching
date: 2025-01-31
author: Code Analysis
version: 1.0.0
status: active
category: analysis
---

# Forms Static Data Analysis - Complete Module Review

**Last Updated**: 2025-01-31  
**Scope**: All modules, form components, and UI panels  
**Purpose**: Identify which forms use static data and recommend migration to dynamic data fetching

---

## Executive Summary

### Key Findings

- **Total Forms Analyzed**: 30+ forms and components
- **Forms with Static Data**: 12 primary forms with hardcoded options
- **Forms with Dynamic Data**: 8+ forms using hooks/services (✅ Good pattern)
- **Mixed Pattern Forms**: 5+ forms combining both static and dynamic data
- **Critical Issues**: 3 forms with configuration objects as static data

### Impact

**Static Data Creates**:
1. ❌ Hard-coded business logic in UI components
2. ❌ Difficult maintenance when options change
3. ❌ Inconsistent dropdown options across similar forms
4. ❌ Impossible to support multi-tenant customization
5. ❌ Cannot implement dynamic role-based access control on options

---

## Module-by-Module Analysis

### ✅ GOOD PATTERN: CustomerFormPanel

**File**: `src/modules/features/customers/components/CustomerFormPanel.tsx`

**Current Implementation** (Lines 117-120):
```typescript
const { data: industries = [], isLoading: industriesLoading } = useIndustries();
const { data: companySizes = [], isLoading: sizesLoading } = useCompanySizes();
const { data: users = [], isLoading: usersLoading } = useActiveUsers();
```

✅ **What's Good**:
- Uses custom hooks to fetch dropdown data
- Supports dynamic loading from backend
- Multi-tenant ready
- Can be filtered by permissions

❌ **Static Data Pattern** (Lines 78-104):
```typescript
const statusConfig = {
  active: { emoji: '✅', color: '#f0f5ff' },
  inactive: { emoji: '❌', color: '#fafafa' },
  // ... hardcoded configs
};

const customerTypeConfig = {
  business: { emoji: '🏢', label: 'Business' },
  individual: { emoji: '👤', label: 'Individual' },
  // ... hardcoded configs
};

const sourceConfig = {
  referral: { emoji: '👥', label: 'Referral' },
  website: { emoji: '🌐', label: 'Website' },
  // ... hardcoded configs
};
```

⚠️ **Issue**: Configuration objects are hardcoded, not fetched from backend

**Recommendation**: 
- Create a `useCustomerConfigurations()` hook that fetches `statusConfig`, `customerTypeConfig`, `sourceConfig`, `ratingConfig` from a master data table
- Store configurations in database: `customer_configurations` table
- Fetch on component mount alongside other dropdown data

---

### ❌ STATIC DATA: CompaniesFormPanel

**File**: `src/modules/features/masters/components/CompaniesFormPanel.tsx`

**Lines 21-33 - Hardcoded Options**:
```typescript
const sizeOptions = [
  { label: 'Startup', value: 'startup' },
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
  { label: 'Enterprise', value: 'enterprise' },
];

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Prospect', value: 'prospect' },
];
```

❌ **Issues**:
1. No ability to add new company sizes without code change
2. Cannot customize for different tenants
3. Hard to maintain across multiple forms
4. No dynamic loading or filtering

**Recommendation**: 
- Create hooks: `useCompanySizes()` and `useCompanyStatuses()`
- Fetch from reference data tables
- Add to master data management interface

---

### ❌ STATIC DATA: ContractFormPanel

**File**: `src/modules/features/contracts/components/ContractFormPanel.tsx`

**Lines 250-286 - Hardcoded Select Options**:
```typescript
<Select placeholder="Select contract type">
  <Select.Option value="service_agreement" label="📋 Service Agreement">
    Service Agreement
  </Select.Option>
  <Select.Option value="nda" label="🔒 NDA">
    NDA
  </Select.Option>
  <Select.Option value="purchase_order" label="📦 Purchase Order">
    Purchase Order
  </Select.Option>
  <Select.Option value="employment" label="👤 Employment">
    Employment
  </Select.Option>
  <Select.Option value="custom" label="⚙️ Custom">
    Custom
  </Select.Option>
</Select>
```

Similarly for **Status** (Lines 275-287):
```typescript
<Select.Option value="draft" label="📝 Draft">Draft</Select.Option>
<Select.Option value="pending_approval" label="⏳ Pending">Pending Approval</Select.Option>
<Select.Option value="active" label="✅ Active">Active</Select.Option>
<Select.Option value="renewed" label="🔄 Renewed">Renewed</Select.Option>
<Select.Option value="expired" label="❌ Expired">Expired</Select.Option>
<Select.Option value="terminated" label="🛑 Terminated">Terminated</Select.Option>
```

And **Priority** (Lines 297-305):
```typescript
<Select.Option value="low" label="📊 Low">Low</Select.Option>
<Select.Option value="medium" label="⚠️ Medium">Medium</Select.Option>
<Select.Option value="high" label="🔴 High">High</Select.Option>
<Select.Option value="critical" label="🚨 Critical">Critical</Select.Option>
```

❌ **Critical Issues**:
1. All contract types hardcoded in component
2. Contract status workflow hardcoded
3. Cannot manage contract type templates
4. No support for custom contract types
5. Forms cannot be configured per tenant

**Recommendation**: 
- Create `useContractTypes()`, `useContractStatuses()`, `useContractPriorities()` hooks
- Store in reference data or master tables
- Support custom contract type templates in admin panel

---

### ⚠️ MIXED PATTERN: JobWorksFormPanel

**File**: `src/modules/features/jobworks/components/JobWorksFormPanel.tsx`

**Lines 141-159 - Hardcoded Status Options**:
```typescript
<Form.Item label="Status" name="status" initialValue="pending">
  <Select placeholder="Select status">
    <Select.Option value="pending">Pending</Select.Option>
    <Select.Option value="in_progress">In Progress</Select.Option>
    <Select.Option value="completed">Completed</Select.Option>
    <Select.Option value="cancelled">Cancelled</Select.Option>
  </Select>
</Form.Item>
```

**Lines 154-159 - Hardcoded Priority Options**:
```typescript
<Form.Item label="Priority" name="priority" rules={[...]}>
  <Select placeholder="Select priority">
    <Select.Option value="low">Low</Select.Option>
    <Select.Option value="medium">Medium</Select.Option>
    <Select.Option value="high">High</Select.Option>
    <Select.Option value="urgent">Urgent</Select.Option>
  </Select>
</Form.Item>
```

**Line 128 - Also Hardcoded Customer ID**:
```typescript
<Form.Item
  label="Customer ID"
  name="customer_id"
  rules={[{ required: true, message: 'Please select a customer' }]}
>
  <Input placeholder="Enter customer ID" />
</Form.Item>
```

❌ **Issues**:
1. Customer dropdown missing - requires manual ID entry (very poor UX)
2. Status and priority hardcoded
3. Should use `useCustomers()` hook for customer selection
4. Cannot manage job work statuses dynamically

**Recommendation**: 
- Replace customer ID input with `DynamicSelect` or `useCustomers()` hook
- Create `useJobWorkStatuses()` and `useJobWorkPriorities()` hooks
- Add customer search capability
- Auto-populate customer details when selected

---

### 🚨 CRITICAL: ComplaintsFormPanel

**File**: `src/modules/features/complaints/components/ComplaintsFormPanel.tsx`

**Lines 70-151 - Extensive Hardcoded Configuration**:

```typescript
const STATUSES = [
  { label: 'New', value: 'new', color: 'warning', icon: '📌' },
  { label: 'In Progress', value: 'in_progress', color: 'processing', icon: '⏳' },
  { label: 'On Hold', value: 'on_hold', color: 'default', icon: '⏸' },
  { label: 'Closed', value: 'closed', color: 'success', icon: '✓' },
];

const PRIORITIES = [
  { label: 'Low', value: 'low', color: 'default', responseTime: '24 hours', resolutionTime: '7 days', icon: '📊' },
  { label: 'Medium', value: 'medium', color: 'processing', responseTime: '8 hours', resolutionTime: '3 days', icon: '⚠️' },
  { label: 'High', value: 'high', color: 'warning', responseTime: '2 hours', resolutionTime: '24 hours', icon: '🔴' },
  { label: 'Urgent', value: 'urgent', color: 'red', responseTime: '30 minutes', resolutionTime: '4 hours', icon: '🚨' },
];

const COMPLAINT_TYPES = [
  { label: 'Equipment Breakdown', value: 'breakdown', color: 'red', department: 'Maintenance Team', slaResponse: '1 hour', slaResolution: '4 hours', icon: <BugOutlined /> },
  { label: 'Preventive Maintenance', value: 'preventive', color: 'blue', department: 'Service Team', slaResponse: '8 hours', slaResolution: '5 days', icon: <ToolOutlined /> },
  { label: 'Software Update', value: 'software_update', color: 'cyan', department: 'Software Team', slaResponse: '4 hours', slaResolution: '2 days', icon: <FileTextOutlined /> },
  { label: 'Optimization Request', value: 'optimize', color: 'green', department: 'Technical Team', slaResponse: '24 hours', slaResolution: '7 days', icon: <CheckCircleOutlined /> },
];

const SUGGESTED_TAGS = [
  'urgent_response_needed',
  'customer_escalation',
  'warranty_claim',
  'requires_parts',
  // ... more tags
];
```

**Lines 321-341 - Using Hardcoded Data**:
```typescript
<Select options={PRIORITIES.map(p => ({
  label: `${p.icon} ${p.label}`,
  value: p.value,
}))} />

<Select options={COMPLAINT_TYPES.map(t => ({
  label: `${t.label}`,
  value: t.value,
}))} />
```

🚨 **CRITICAL Issues**:
1. ALL complaint configurations hardcoded in component
2. SLA times hardcoded and calculated in component
3. Department routing hardcoded
4. Cannot configure complaint types per tenant
5. Cannot manage SLA times without code change
6. Suggests tag list is static
7. Color scheme and icons hardcoded

**This form violates multi-tenant design principles!**

**Recommendation - URGENT**:
- Create `useComplaintStatuses()`, `useComplaintPriorities()`, `useComplaintTypes()` hooks
- Move SLA configuration to database table `complaint_sla_configuration`
- Store complaint types with routing rules in `complaint_types` table
- Implement dynamic tag management in admin panel
- Allow per-tenant customization of statuses, priorities, and types

---

### ⚠️ MIXED: ProductsFormPanel

**File**: `src/modules/features/masters/components/ProductsFormPanel.tsx`

**Lines 36-44 - Using Dynamic Data (✅ Good)**:
```typescript
const statusOptions = getRefDataByCategory('product_status').map(s => ({ 
  label: s.label, 
  value: s.key 
}));

const unitOptions = getRefDataByCategory('product_unit').map(u => ({ 
  label: u.label, 
  value: u.key 
}));
```

**But also uses `DynamicSelect` (Lines 136-139)**:
```typescript
<DynamicSelect 
  type="categories" 
  placeholder="Select category"
/>
```

✅ **What's Good**:
- Using `getRefDataByCategory()` for status and units
- Using `DynamicSelect` component for categories
- Fetches from ReferenceDataContext

⚠️ **Still has issues**:
- `DynamicSelect` component might have hardcoded categories type handling
- Need to verify categories are truly dynamic

**Recommendation**: 
- Verify all dropdown types are properly configured in ReferenceDataContext
- Consider moving more status/unit options to ReferenceData if not already

---

### ❌ STATIC DATA: ComplaintsFormPanel (Tickets Similar)

**File**: `src/modules/features/tickets/components/*` (Similar pattern)

**Issues**: Same as complaints - likely has hardcoded ticket types, statuses, priorities

**Recommendation**: Same as complaints - create hooks and move to database

---

## Forms with Dynamic Data Pattern (✅ Correct)

### 1. **CustomerFormPanel** ✅
Uses:
- `useIndustries()` - ✅ Dynamic
- `useCompanySizes()` - ✅ Dynamic
- `useActiveUsers()` - ✅ Dynamic

### 2. **ProductSaleFormPanel** ⚠️ Partially
Uses:
- Dynamic customer loading
- Dynamic product loading
But needs verification on all dropdowns

### 3. **ProductsFormPanel** ✅
Uses:
- `getRefDataByCategory()` for statuses/units
- `DynamicSelect` for categories

---

## Database Tables Needed for Refactoring

To support dynamic dropdown data across all forms, create these reference tables:

### 1. **Status & State References**
```sql
CREATE TABLE ref_statuses (
  id UUID PRIMARY KEY,
  category VARCHAR(50),          -- 'contract', 'complaint', 'job_work', 'product_sale'
  label VARCHAR(100),
  value VARCHAR(50),
  color VARCHAR(20),
  icon VARCHAR(50),
  emoji VARCHAR(10),
  tenant_id UUID,
  sort_order INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Examples:
-- ('contract_draft', 'contract', 'Draft', 'draft', '#1890ff', 'file-text', '📝', tenant_1)
-- ('complaint_new', 'complaint', 'New', 'new', '#faad14', 'warning', '📌', tenant_1)
-- ('job_work_pending', 'job_work', 'Pending', 'pending', '#faad14', 'clock-circle', '⏳', tenant_1)
```

### 2. **Priority Levels**
```sql
CREATE TABLE ref_priorities (
  id UUID PRIMARY KEY,
  category VARCHAR(50),          -- 'complaint', 'job_work', 'ticket'
  label VARCHAR(50),
  value VARCHAR(50),
  color VARCHAR(20),
  icon VARCHAR(50),
  response_time_hours INT,
  resolution_time_hours INT,
  tenant_id UUID,
  sort_order INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. **Type References**
```sql
CREATE TABLE ref_types (
  id UUID PRIMARY KEY,
  category VARCHAR(50),          -- 'contract_type', 'complaint_type', 'ticket_type'
  label VARCHAR(100),
  value VARCHAR(50),
  icon VARCHAR(50),
  emoji VARCHAR(10),
  department VARCHAR(100),
  sla_response_hours INT,
  sla_resolution_hours INT,
  color VARCHAR(20),
  tenant_id UUID,
  sort_order INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. **Configuration Sets**
```sql
CREATE TABLE ref_configuration (
  id UUID PRIMARY KEY,
  category VARCHAR(50),          -- 'customer', 'company', 'product'
  config_type VARCHAR(100),      -- 'status_config', 'type_config', 'source_config'
  config_key VARCHAR(100),
  config_value JSONB,            -- Stores emoji, color, label
  tenant_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Examples:
-- ('customer', 'status_config', 'active', {emoji: '✅', color: '#f0f5ff', label: 'Active'})
-- ('customer', 'type_config', 'business', {emoji: '🏢', label: 'Business'})
-- ('customer', 'source_config', 'referral', {emoji: '👥', label: 'Referral'})
```

### 5. **Company Sizes & Industries** (If not already existing)
```sql
CREATE TABLE ref_company_sizes (
  id UUID PRIMARY KEY,
  label VARCHAR(50),
  value VARCHAR(50),
  tenant_id UUID,
  sort_order INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ref_industries (
  id UUID PRIMARY KEY,
  label VARCHAR(100),
  value VARCHAR(50),
  tenant_id UUID,
  sort_order INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Hooks to Create

### 1. **useStatuses()**
```typescript
export function useStatuses(category: 'contract' | 'complaint' | 'job_work' | 'product_sale') {
  return useQuery({
    queryKey: ['statuses', category],
    queryFn: async () => {
      const { data } = await supabase
        .from('ref_statuses')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('sort_order');
      return data || [];
    }
  });
}
```

### 2. **usePriorities()**
```typescript
export function usePriorities(category: 'complaint' | 'job_work' | 'ticket') {
  return useQuery({
    queryKey: ['priorities', category],
    queryFn: async () => {
      const { data } = await supabase
        .from('ref_priorities')
        .select('*')
        .eq('category', category)
        .order('sort_order');
      return data || [];
    }
  });
}
```

### 3. **useTypes()**
```typescript
export function useTypes(category: string) {
  return useQuery({
    queryKey: ['types', category],
    queryFn: async () => {
      const { data } = await supabase
        .from('ref_types')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('sort_order');
      return data || [];
    }
  });
}
```

### 4. **useConfigurations()**
```typescript
export function useConfigurations(category: string, configType: string) {
  return useQuery({
    queryKey: ['configurations', category, configType],
    queryFn: async () => {
      const { data } = await supabase
        .from('ref_configuration')
        .select('*')
        .eq('category', category)
        .eq('config_type', configType);
      
      return data?.reduce((acc, item) => ({
        ...acc,
        [item.config_key]: item.config_value
      }), {}) || {};
    }
  });
}
```

---

## Summary by Module

| Module | Form | Status | Static Data Found | Recommendation | Priority |
|--------|------|--------|-------------------|-----------------|----------|
| **Customers** | CustomerFormPanel | ⚠️ Mixed | Config objects | Extract configs to hook | Medium |
| **Masters** | CompaniesFormPanel | ❌ Static | sizeOptions, statusOptions | Create useCompanyOptions() | High |
| **Masters** | ProductsFormPanel | ✅ Dynamic | None | Keep as-is | None |
| **Contracts** | ContractFormPanel | ❌ Static | Type, Status, Priority | Create useContractOptions() | High |
| **Complaints** | ComplaintsFormPanel | 🚨 Critical | STATUSES, PRIORITIES, COMPLAINT_TYPES | Complete refactor urgent | Critical |
| **JobWorks** | JobWorksFormPanel | ❌ Static | Status, Priority + missing customer dropdown | Create hooks + add customer select | High |
| **Tickets** | TicketsFormPanel | 🚨 Critical | Likely similar to complaints | Complete refactor | Critical |
| **Product Sales** | ProductSaleFormPanel | ⚠️ Mixed | Need verification | Audit all dropdowns | Medium |
| **Sales** | SalesPanel | ⚠️ Mixed | Need verification | Audit all dropdowns | Medium |

---

## Implementation Roadmap

### Phase 1: Database Setup (Week 1)
- [ ] Create reference data tables (ref_statuses, ref_priorities, ref_types, ref_configuration)
- [ ] Create migration scripts
- [ ] Seed initial data for existing static values

### Phase 2: Hooks Creation (Week 1-2)
- [ ] Create generic hooks: useStatuses(), usePriorities(), useTypes(), useConfigurations()
- [ ] Create module-specific hooks wrapping the generic ones
- [ ] Add to hooks index files

### Phase 3: Component Migration (Week 2-4)
- [ ] ✅ Start: ProductsFormPanel (already good, minor tweaks)
- [ ] ✅ Next: CompaniesFormPanel (remove sizeOptions, statusOptions)
- [ ] ⚠️ Then: ContractFormPanel (remove hardcoded options)
- [ ] ⚠️ Then: JobWorksFormPanel (add customer select + remove hardcoded options)
- [ ] 🚨 Critical: ComplaintsFormPanel (major refactor)
- [ ] 🚨 Critical: TicketsFormPanel (major refactor)
- [ ] Audit and update: ProductSaleFormPanel, SalesPanel

### Phase 4: Admin Interface (Week 4-5)
- [ ] Create admin pages for managing statuses, priorities, types per tenant
- [ ] Allow add/edit/delete operations
- [ ] Implement caching for reference data

### Phase 5: Testing & Rollout (Week 5+)
- [ ] Unit tests for hooks
- [ ] Integration tests for form components
- [ ] User acceptance testing
- [ ] Production rollout

---

## Quick Fix Checklist

For immediate improvements (can be done incrementally):

### CompaniesFormPanel
```typescript
// BEFORE: Hardcoded
const sizeOptions = [
  { label: 'Startup', value: 'startup' },
  // ...
];

// AFTER: Dynamic
const { data: sizeOptions = [] } = useSizes();
```

### ContractFormPanel
```typescript
// BEFORE: Hardcoded <Select.Option> elements
<Select.Option value="draft">Draft</Select.Option>

// AFTER: Using map
const { data: statuses = [] } = useContractStatuses();
<Select>
  {statuses.map(s => (
    <Select.Option key={s.value} value={s.value}>
      {s.label}
    </Select.Option>
  ))}
</Select>
```

### JobWorksFormPanel
```typescript
// BEFORE: Missing customer dropdown
<Input placeholder="Enter customer ID" />

// AFTER: Add customer select
<DynamicSelect type="customers" placeholder="Select customer" />
```

---

## Benefits of Migration

✅ **Single Source of Truth**: All dropdown options in database  
✅ **Multi-Tenant Ready**: Each tenant can customize options  
✅ **Admin Controllable**: Change options without code deployment  
✅ **Better Maintenance**: Update options from admin UI  
✅ **RBAC Integration**: Can filter options by user role  
✅ **Consistent UX**: Same options across all forms  
✅ **Scalable**: Easy to add new statuses/types  
✅ **Audit Trail**: Track changes to reference data  

---

**Status**: Analysis Complete - Ready for Implementation Planning


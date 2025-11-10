---
title: Forms Static Data - Quick Reference Guide
description: Quick lookup guide for static data in forms with before/after code examples
date: 2025-01-31
author: Code Analysis
version: 1.0.0
status: active
difficulty: intermediate
estimated-time: 20 minutes
---

# Forms Static Data - Quick Reference & Code Examples

## At a Glance

| Module | Form | Issue | Impact | Fix Effort |
|--------|------|-------|--------|-----------|
| Customers | CustomerFormPanel | Config objects hardcoded | Medium | 2-3 hours |
| Masters/Companies | CompaniesFormPanel | Size & status options hardcoded | High | 1-2 hours |
| Contracts | ContractFormPanel | Type, status, priority options hardcoded | High | 2-3 hours |
| JobWorks | JobWorksFormPanel | Status, priority hardcoded + missing customer dropdown | High | 3-4 hours |
| Complaints | ComplaintsFormPanel | **CRITICAL**: All configs hardcoded | Critical | 4-5 hours |
| Tickets | TicketsFormPanel | Similar to complaints | Critical | 4-5 hours |

---

## Critical Issues (Fix ASAP)

### 🚨 ComplaintsFormPanel - Lines 70-151

**Problem**: SLA configurations, department routing, and all complaint types are hardcoded

**Current Code** (❌ WRONG):
```typescript
// src/modules/features/complaints/components/ComplaintsFormPanel.tsx
const PRIORITIES = [
  { label: 'Low', value: 'low', responseTime: '24 hours', resolutionTime: '7 days' },
  { label: 'Medium', value: 'medium', responseTime: '8 hours', resolutionTime: '3 days' },
  { label: 'High', value: 'high', responseTime: '2 hours', resolutionTime: '24 hours' },
  { label: 'Urgent', value: 'urgent', responseTime: '30 minutes', resolutionTime: '4 hours' },
];

const COMPLAINT_TYPES = [
  { label: 'Equipment Breakdown', value: 'breakdown', department: 'Maintenance Team' },
  { label: 'Preventive Maintenance', value: 'preventive', department: 'Service Team' },
  // ... more types
];

// In render:
<Select options={PRIORITIES.map(p => ({ label: p.label, value: p.value }))} />
<Select options={COMPLAINT_TYPES.map(t => ({ label: t.label, value: t.value }))} />
```

**Why It's Wrong**:
- Cannot change priorities without code change
- Cannot customize for different tenants
- SLA times cannot be updated in admin panel
- Department routing is hardcoded

**Fixed Code** (✅ CORRECT):
```typescript
// Step 1: Create hook for complaint data
// src/modules/features/complaints/hooks/useComplaintOptions.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase/client';

export function useComplaintPriorities() {
  return useQuery({
    queryKey: ['complaint-priorities'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ref_complaint_priorities')
        .select('*')
        .order('sort_order');
      return data || [];
    },
  });
}

export function useComplaintTypes() {
  return useQuery({
    queryKey: ['complaint-types'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ref_complaint_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      return data || [];
    },
  });
}

// Step 2: Use in component
// src/modules/features/complaints/components/ComplaintsFormPanel.tsx
export const ComplaintsFormPanel: React.FC<ComplaintsFormPanelProps> = ({ ... }) => {
  const { data: priorities = [] } = useComplaintPriorities();
  const { data: types = [] } = useComplaintTypes();

  return (
    <Form>
      <Form.Item name="priority" label="Priority">
        <Select placeholder="Select priority">
          {priorities.map(p => (
            <Select.Option key={p.value} value={p.value}>
              {p.icon} {p.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="type" label="Complaint Type">
        <Select placeholder="Select type">
          {types.map(t => (
            <Select.Option key={t.value} value={t.value}>
              {t.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  );
};
```

**Migration Steps**:
1. Create `ref_complaint_priorities` table
2. Create `ref_complaint_types` table
3. Create `useComplaintPriorities()` and `useComplaintTypes()` hooks
4. Replace hardcoded arrays with hook calls
5. Remove `const PRIORITIES`, `const COMPLAINT_TYPES`, `const SUGGESTED_TAGS`

---

## High Priority Issues (Fix Next)

### ❌ CompaniesFormPanel - Lines 21-33

**Problem**: Company sizes and statuses are hardcoded options

**Current Code** (❌ WRONG):
```typescript
// src/modules/features/masters/components/CompaniesFormPanel.tsx
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

export const CompaniesFormPanel: React.FC<...> = (...) => {
  return (
    <Form>
      <Form.Item label="Company Size" name="size">
        <Select options={sizeOptions} />
      </Form.Item>
      <Form.Item label="Status" name="status">
        <Select options={statusOptions} />
      </Form.Item>
    </Form>
  );
};
```

**Fixed Code** (✅ CORRECT):
```typescript
// Step 1: Create hooks
// src/modules/features/masters/hooks/useCompanyOptions.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase/client';

export function useCompanySizes() {
  return useQuery({
    queryKey: ['company-sizes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ref_company_sizes')
        .select('id, label, value')
        .order('sort_order');
      return data?.map(d => ({ label: d.label, value: d.value })) || [];
    },
  });
}

export function useCompanyStatuses() {
  return useQuery({
    queryKey: ['company-statuses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ref_company_statuses')
        .select('id, label, value')
        .order('sort_order');
      return data?.map(d => ({ label: d.label, value: d.value })) || [];
    },
  });
}

// Step 2: Update component
// src/modules/features/masters/components/CompaniesFormPanel.tsx
export const CompaniesFormPanel: React.FC<CompaniesFormPanelProps> = ({...}) => {
  const { data: sizeOptions = [] } = useCompanySizes();
  const { data: statusOptions = [] } = useCompanyStatuses();

  return (
    <Form>
      <Form.Item label="Company Size" name="size">
        <Select options={sizeOptions} placeholder="Select size" />
      </Form.Item>
      <Form.Item label="Status" name="status">
        <Select options={statusOptions} placeholder="Select status" />
      </Form.Item>
    </Form>
  );
};
```

---

### ❌ ContractFormPanel - Lines 250-305

**Problem**: Contract types, statuses, and priorities hardcoded in form

**Current Code** (❌ WRONG):
```typescript
// Lines 250-265: Hardcoded contract types
<Select placeholder="Select contract type">
  <Select.Option value="service_agreement">Service Agreement</Select.Option>
  <Select.Option value="nda">NDA</Select.Option>
  <Select.Option value="purchase_order">Purchase Order</Select.Option>
  <Select.Option value="employment">Employment</Select.Option>
  <Select.Option value="custom">Custom</Select.Option>
</Select>

// Lines 275-286: Hardcoded statuses
<Select placeholder="Select contract status">
  <Select.Option value="draft">Draft</Select.Option>
  <Select.Option value="pending_approval">Pending Approval</Select.Option>
  <Select.Option value="active">Active</Select.Option>
  <Select.Option value="renewed">Renewed</Select.Option>
  <Select.Option value="expired">Expired</Select.Option>
  <Select.Option value="terminated">Terminated</Select.Option>
</Select>
```

**Fixed Code** (✅ CORRECT):
```typescript
// Step 1: Create hooks
// src/modules/features/contracts/hooks/useContractOptions.ts
export function useContractTypes() {
  return useQuery({
    queryKey: ['contract-types'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ref_contract_types')
        .select('*')
        .order('sort_order');
      return data || [];
    },
  });
}

export function useContractStatuses() {
  return useQuery({
    queryKey: ['contract-statuses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ref_contract_statuses')
        .select('*')
        .order('sort_order');
      return data || [];
    },
  });
}

export function useContractPriorities() {
  return useQuery({
    queryKey: ['contract-priorities'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ref_contract_priorities')
        .select('*')
        .order('sort_order');
      return data || [];
    },
  });
}

// Step 2: Update component
// src/modules/features/contracts/components/ContractFormPanel.tsx
export const ContractFormPanel: React.FC<...> = ({...}) => {
  const { data: types = [] } = useContractTypes();
  const { data: statuses = [] } = useContractStatuses();
  const { data: priorities = [] } = useContractPriorities();

  return (
    <Form>
      <Form.Item label="Type" name="type">
        <Select placeholder="Select contract type">
          {types.map(t => (
            <Select.Option key={t.value} value={t.value} label={t.label}>
              {t.icon} {t.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Status" name="status">
        <Select placeholder="Select status">
          {statuses.map(s => (
            <Select.Option key={s.value} value={s.value} label={s.label}>
              {s.emoji} {s.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Priority" name="priority">
        <Select placeholder="Select priority">
          {priorities.map(p => (
            <Select.Option key={p.value} value={p.value} label={p.label}>
              {p.icon} {p.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  );
};
```

---

### ❌ JobWorksFormPanel - Lines 141-159

**Problem 1**: Status and priority options hardcoded  
**Problem 2**: Customer ID must be entered manually (should be a dropdown)

**Current Code** (❌ WRONG):
```typescript
// Line 128-129: Manual customer ID entry (poor UX)
<Form.Item label="Customer ID" name="customer_id">
  <Input placeholder="Enter customer ID" />
</Form.Item>

// Lines 141-146: Hardcoded status
<Form.Item label="Status" name="status" initialValue="pending">
  <Select placeholder="Select status">
    <Select.Option value="pending">Pending</Select.Option>
    <Select.Option value="in_progress">In Progress</Select.Option>
    <Select.Option value="completed">Completed</Select.Option>
    <Select.Option value="cancelled">Cancelled</Select.Option>
  </Select>
</Form.Item>

// Lines 154-159: Hardcoded priority
<Form.Item label="Priority" name="priority">
  <Select placeholder="Select priority">
    <Select.Option value="low">Low</Select.Option>
    <Select.Option value="medium">Medium</Select.Option>
    <Select.Option value="high">High</Select.Option>
    <Select.Option value="urgent">Urgent</Select.Option>
  </Select>
</Form.Item>
```

**Fixed Code** (✅ CORRECT):
```typescript
// Step 1: Create hooks
// src/modules/features/jobworks/hooks/useJobWorkOptions.ts
export function useJobWorkStatuses() {
  return useQuery({
    queryKey: ['jobwork-statuses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ref_jobwork_statuses')
        .select('*')
        .order('sort_order');
      return data || [];
    },
  });
}

export function useJobWorkPriorities() {
  return useQuery({
    queryKey: ['jobwork-priorities'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ref_jobwork_priorities')
        .select('*')
        .order('sort_order');
      return data || [];
    },
  });
}

// Step 2: Update component
// src/modules/features/jobworks/components/JobWorksFormPanel.tsx
import { DynamicSelect } from '@/components/forms';
import { useJobWorkStatuses, useJobWorkPriorities } from '../hooks';

export const JobWorksFormPanel: React.FC<...> = ({...}) => {
  const { data: statuses = [] } = useJobWorkStatuses();
  const { data: priorities = [] } = useJobWorkPriorities();

  return (
    <Form>
      {/* FIX 1: Replace manual ID input with customer dropdown */}
      <Form.Item
        label="Customer"
        name="customer_id"
        rules={[{ required: true, message: 'Please select a customer' }]}
      >
        <DynamicSelect 
          type="customers" 
          placeholder="Search and select customer"
        />
      </Form.Item>

      {/* FIX 2: Use dynamic status options */}
      <Form.Item label="Status" name="status" initialValue="pending">
        <Select placeholder="Select status">
          {statuses.map(s => (
            <Select.Option key={s.value} value={s.value}>
              {s.emoji} {s.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {/* FIX 3: Use dynamic priority options */}
      <Form.Item label="Priority" name="priority">
        <Select placeholder="Select priority">
          {priorities.map(p => (
            <Select.Option key={p.value} value={p.value}>
              {p.icon} {p.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  );
};
```

---

## Medium Priority Issues

### ⚠️ CustomerFormPanel - Lines 78-104

**Problem**: Configuration objects are hardcoded and used to render status, type, rating, and source options

**Current Code** (⚠️ NEEDS IMPROVEMENT):
```typescript
// Lines 78-104: Hardcoded config objects
const statusConfig = {
  active: { emoji: '✅', color: '#f0f5ff' },
  inactive: { emoji: '❌', color: '#fafafa' },
  prospect: { emoji: '⏳', color: '#fffbe6' },
  suspended: { emoji: '🛑', color: '#fff1f0' },
};

const customerTypeConfig = {
  business: { emoji: '🏢', label: 'Business' },
  individual: { emoji: '👤', label: 'Individual' },
  corporate: { emoji: '🏛️', label: 'Corporate' },
  government: { emoji: '🏛️', label: 'Government' },
};

const ratingConfig = {
  hot: { emoji: '🔥', label: 'Hot Lead' },
  warm: { emoji: '☀️', label: 'Warm Lead' },
  cold: { emoji: '❄️', label: 'Cold Lead' },
};

const sourceConfig = {
  referral: { emoji: '👥', label: 'Referral' },
  website: { emoji: '🌐', label: 'Website' },
  // ... more sources
};

// Lines 234-240: Using hardcoded config in render
<Select>
  {Object.entries(statusConfig).map(([key, { emoji }]) => (
    <Select.Option key={key} value={key}>
      {emoji} {key.charAt(0).toUpperCase() + key.slice(1)}
    </Select.Option>
  ))}
</Select>
```

**Why It's Not Good**:
- Config objects hardcoded in component
- Cannot customize emojis/colors per tenant
- Cannot add new statuses without code change
- Difficult to maintain consistency

**Fixed Code** (✅ BETTER):
```typescript
// Step 1: Create hook
// src/modules/features/customers/hooks/useCustomerConfigurations.ts
export function useCustomerStatuses() {
  return useQuery({
    queryKey: ['customer-statuses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ref_customer_statuses')
        .select('*')
        .order('sort_order');
      return data || [];
    },
  });
}

export function useCustomerTypes() {
  return useQuery({
    queryKey: ['customer-types'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ref_customer_types')
        .select('*')
        .order('sort_order');
      return data || [];
    },
  });
}

export function useCustomerRatings() {
  return useQuery({
    queryKey: ['customer-ratings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ref_customer_ratings')
        .select('*')
        .order('sort_order');
      return data || [];
    },
  });
}

export function useCustomerSources() {
  return useQuery({
    queryKey: ['customer-sources'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ref_customer_sources')
        .select('*')
        .order('sort_order');
      return data || [];
    },
  });
}

// Step 2: Update component
// src/modules/features/customers/components/CustomerFormPanel.tsx
export const CustomerFormPanel: React.FC<...> = ({...}) => {
  // Keep existing hooks
  const { data: industries = [] } = useIndustries();
  const { data: companySizes = [] } = useCompanySizes();
  const { data: users = [] } = useActiveUsers();
  
  // Add new hooks
  const { data: statuses = [] } = useCustomerStatuses();
  const { data: types = [] } = useCustomerTypes();
  const { data: ratings = [] } = useCustomerRatings();
  const { data: sources = [] } = useCustomerSources();

  return (
    <Form>
      {/* Status */}
      <Form.Item label="Status" name="status">
        <Select>
          {statuses.map(s => (
            <Select.Option key={s.value} value={s.value}>
              {s.emoji} {s.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {/* Type */}
      <Form.Item label="Customer Type" name="type">
        <Select>
          {types.map(t => (
            <Select.Option key={t.value} value={t.value}>
              {t.emoji} {t.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {/* Rating */}
      <Form.Item label="Rating" name="rating">
        <Select>
          {ratings.map(r => (
            <Select.Option key={r.value} value={r.value}>
              {r.emoji} {r.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {/* Source */}
      <Form.Item label="Source" name="source">
        <Select>
          {sources.map(s => (
            <Select.Option key={s.value} value={s.value}>
              {s.emoji} {s.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  );
};
```

---

## Best Practices Going Forward

### ✅ DO:
```typescript
// 1. Create hooks for dropdown data
export function useMyDropdownOptions() {
  return useQuery({
    queryKey: ['my-options'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ref_my_options')
        .select('*');
      return data || [];
    },
  });
}

// 2. Use in components
const { data: options = [] } = useMyDropdownOptions();
<Select options={options.map(o => ({ label: o.label, value: o.value }))} />

// 3. Store configurations in database
// Table: ref_my_options (id, label, value, emoji, color, sort_order)

// 4. Allow admin to manage options via admin panel
```

### ❌ DON'T:
```typescript
// ❌ DON'T hardcode options in component
const options = [
  { label: 'Option 1', value: 'opt1' },
  { label: 'Option 2', value: 'opt2' },
];

// ❌ DON'T put configuration objects in component
const configs = {
  opt1: { emoji: '📌', color: '#fff' },
  opt2: { emoji: '⏳', color: '#eee' },
};

// ❌ DON'T use multiple hardcoded lists in same component
const statusOptions = [...];
const priorityOptions = [...];
const typeOptions = [...];
```

---

## Implementation Checklist

### For Each Form Migration:

- [ ] Create reference data tables in database
- [ ] Create migration script to seed initial data
- [ ] Create hooks in module's `hooks/` directory
- [ ] Add hooks to `index.ts` for export
- [ ] Update component to use hooks instead of hardcoded data
- [ ] Remove hardcoded arrays/objects from component
- [ ] Test with mock data (VITE_API_MODE=mock)
- [ ] Test with real Supabase data (VITE_API_MODE=supabase)
- [ ] Add error handling for empty dropdown data
- [ ] Add loading state while fetching options
- [ ] Update component tests
- [ ] Create admin interface for managing options

---

**Need help?** Refer to FORMS_STATIC_DATA_ANALYSIS.md for detailed information


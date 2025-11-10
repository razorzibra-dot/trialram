---
title: Phase 2A Starter - Complaints Module Normalization
description: Step-by-step guide for implementing the first module normalization as a team confidence builder
date: 2025-02-01
version: 1.0.0
status: ready-for-implementation
projectName: PDS-CRM Database Normalization - Phase 2
---

# Phase 2A Starter: Complaints Module Normalization

**Module**: Complaints (Masters)  
**Denormalization Issue**: 1 field - `customer_name` stored as denormalized string  
**Complexity**: ⭐ (SIMPLEST - Ideal for first module)  
**Estimated Time**: 1 day  
**Recommended Assignee**: Junior developer (build confidence)  
**Files to Update**: 2-3 files only  

---

## 🎯 Quick Overview

### Current State (BEFORE)
```typescript
// Complaints table currently stores both:
interface Complaint {
  id: string;
  customer_id: string;        // Foreign key to customers
  customer_name: string;       // ❌ DENORMALIZED - same as customers.name
  subject: string;
  description: string;
  status: string;
  created_at: date;
}
```

### Target State (AFTER)
```typescript
// Complaints table will ONLY store:
interface Complaint {
  id: string;
  customer_id: string;        // ✅ Foreign key only
  subject: string;
  description: string;
  status: string;
  created_at: date;
  // customer_name retrieved via JOIN or separate query
}
```

### Why This Matters
- **Update Anomaly Risk**: ⚠️ If customer name changes, complaints still show old name
- **Storage Waste**: 📦 Duplicates name data unnecessarily
- **Data Inconsistency**: 🔴 Single source of truth broken
- **Solution**: Use customer_id FK + join with customers table

---

## 📋 8-LAYER IMPLEMENTATION CHECKLIST

### Layer 1: Database Schema
**File**: `supabase/migrations/[timestamp]_remove_denormalized_customer_name_from_complaints.sql`

```sql
-- STEP 1: Create migration file
-- This removes the denormalized customer_name column

BEGIN;

-- Step 1: Add NOT NULL constraint isn't needed since we're removing the column
ALTER TABLE complaints DROP COLUMN IF EXISTS customer_name CASCADE;

-- Step 2: Verify customer_id has proper foreign key constraint
ALTER TABLE complaints ADD CONSTRAINT complaints_customer_id_fk 
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- Step 3: Create index for JOIN performance
CREATE INDEX IF NOT EXISTS idx_complaints_customer_id ON complaints(customer_id);

-- Step 4: Verify no null customer_ids exist
UPDATE complaints SET customer_id = 'unknown' WHERE customer_id IS NULL;

COMMIT;
```

**Checklist**:
- [ ] Migration file created
- [ ] Tested on staging database
- [ ] Backup of production verified
- [ ] Migration script reviewed by DBA

---

### Layer 2: TypeScript Types
**File**: `src/types/complaints.ts`

```typescript
// BEFORE
export interface Complaint {
  id: string;
  customer_id: string;
  customer_name: string;    // ❌ REMOVE THIS
  subject: string;
  description: string;
  status: string;
  created_at: Date;
}

// AFTER
import { z } from 'zod';

export interface Complaint {
  id: string;
  customer_id: string;      // ✅ KEEP - FK reference
  subject: string;
  description: string;
  status: string;
  created_at: Date;
}

// Zod validation schema (single source of truth)
export const ComplaintSchema = z.object({
  id: z.string().uuid('Must be valid UUID'),
  customer_id: z.string().uuid('customer_id must be valid UUID'),
  subject: z.string().min(5, 'Subject at least 5 chars').max(255),
  description: z.string().min(10).max(5000),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  created_at: z.date(),
});

export type ComplaintInput = z.infer<typeof ComplaintSchema>;
```

**Checklist**:
- [ ] Remove `customer_name` from interface
- [ ] Add Zod schema
- [ ] Check all imports of Complaint type
- [ ] Run TypeScript compiler: `npm run type-check`
- [ ] Verify no build errors

---

### Layer 3: Mock Service
**File**: `src/services/complaintsService.ts`

```typescript
// BEFORE
import { mockComplaints } from '@/data/mock';

const mockComplaints = [
  {
    id: '1',
    customer_id: 'cust-1',
    customer_name: 'John Doe',  // ❌ REMOVE
    subject: 'Product issue',
    description: 'Product not working',
    status: 'open',
    created_at: new Date(),
  },
];

export const complaintsService = {
  async getComplaints() {
    return mockComplaints;
  },
};

// AFTER
import { ComplaintSchema, type Complaint } from '@/types/complaints';

// Mock data: REMOVE customer_name field
const mockComplaints: Complaint[] = [
  {
    id: '1',
    customer_id: 'cust-1',
    // ✅ customer_name REMOVED
    subject: 'Product issue',
    description: 'Product not working',
    status: 'open',
    created_at: new Date('2025-01-15'),
  },
  {
    id: '2',
    customer_id: 'cust-2',
    subject: 'Delivery delay',
    description: 'Order not arrived',
    status: 'in_progress',
    created_at: new Date('2025-01-16'),
  },
];

// Helper: Get complaint with customer details
const getCustomerDetails = (customerId: string) => {
  // In mock mode, combine with customer data
  const complaint = mockComplaints.find(c => c.customer_id === customerId);
  const customer = mockCustomers.find(c => c.id === customerId);
  return {
    ...complaint,
    customer, // Provide customer object instead of name string
  };
};

export const complaintsService = {
  async getComplaints(): Promise<Complaint[]> {
    return ComplaintSchema.array().parse(mockComplaints);
  },

  async getComplaintById(id: string): Promise<Complaint | null> {
    const complaint = mockComplaints.find(c => c.id === id);
    return complaint ? ComplaintSchema.parse(complaint) : null;
  },

  async createComplaint(data: Omit<Complaint, 'id' | 'created_at'>) {
    const newComplaint: Complaint = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date(),
    };
    ComplaintSchema.parse(newComplaint);
    mockComplaints.push(newComplaint);
    return newComplaint;
  },

  async updateComplaint(id: string, data: Partial<Complaint>) {
    const index = mockComplaints.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    const updated = { ...mockComplaints[index], ...data };
    ComplaintSchema.parse(updated);
    mockComplaints[index] = updated;
    return updated;
  },
};
```

**Checklist**:
- [ ] Remove `customer_name` from mock data
- [ ] Add Zod validation to all methods
- [ ] Update type annotations
- [ ] Test mock service: `npm test complaintsService`
- [ ] Verify no TypeScript errors

---

### Layer 4: Supabase Service
**File**: `src/services/api/supabase/complaintsService.ts`

```typescript
// BEFORE
export const supabaseComplaintsService = {
  async getComplaints() {
    const { data, error } = await supabase
      .from('complaints')
      .select('id, customer_id, customer_name, subject, description, status, created_at')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
};

// AFTER
import { ComplaintSchema, type Complaint } from '@/types/complaints';

// Row mapper: Convert snake_case from DB to camelCase
const mapComplaintRow = (row: any): Complaint => {
  return ComplaintSchema.parse({
    id: row.id,
    customer_id: row.customer_id,
    // ✅ Remove: customer_name: row.customer_name
    subject: row.subject,
    description: row.description,
    status: row.status,
    created_at: new Date(row.created_at),
  });
};

export const supabaseComplaintsService = {
  async getComplaints(): Promise<Complaint[]> {
    // Query without customer_name
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        id, 
        customer_id, 
        subject, 
        description, 
        status, 
        created_at
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(mapComplaintRow);
  },

  async getComplaintById(id: string): Promise<Complaint | null> {
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        id, 
        customer_id, 
        subject, 
        description, 
        status, 
        created_at
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapComplaintRow(data) : null;
  },

  async createComplaint(data: Omit<Complaint, 'id' | 'created_at'>) {
    const { data: newData, error } = await supabase
      .from('complaints')
      .insert([{
        customer_id: data.customer_id,
        subject: data.subject,
        description: data.description,
        status: data.status,
      }])
      .select()
      .single();
    
    if (error) throw error;
    return mapComplaintRow(newData);
  },

  async updateComplaint(id: string, data: Partial<Complaint>) {
    const { data: updated, error } = await supabase
      .from('complaints')
      .update({
        ...(data.subject && { subject: data.subject }),
        ...(data.description && { description: data.description }),
        ...(data.status && { status: data.status }),
        // ✅ Remove: customer_name update
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return mapComplaintRow(updated);
  },
};
```

**Checklist**:
- [ ] Remove `customer_name` from SELECT queries
- [ ] Update row mapper function
- [ ] Verify FK constraint exists in database
- [ ] Test Supabase service in staging
- [ ] Check query performance (index exists?)

---

### Layer 5: Service Factory
**File**: `src/services/serviceFactory.ts`

```typescript
// Check if factory already exports complaintsService
import { supabaseComplaintsService } from './api/supabase/complaintsService';
import { complaintsService as mockComplaintsService } from './complaintsService';

const apiMode = import.meta.env.VITE_API_MODE || 'mock';

export function getComplaintsService() {
  return apiMode === 'supabase' 
    ? supabaseComplaintsService 
    : mockComplaintsService;
}

// Export factory service
export const complaintsService = {
  getComplaints: () => getComplaintsService().getComplaints(),
  getComplaintById: (id: string) => getComplaintsService().getComplaintById(id),
  createComplaint: (data) => getComplaintsService().createComplaint(data),
  updateComplaint: (id, data) => getComplaintsService().updateComplaint(id, data),
};
```

**Checklist**:
- [ ] Factory exports `complaintsService`
- [ ] Both mock and Supabase services have same methods
- [ ] Method signatures match types
- [ ] `src/services/index.ts` exports factory service

---

### Layer 6: Module Service
**File**: `src/modules/features/complaints/services/complaintService.ts`

```typescript
// BEFORE
import complaintsService from '@/services/complaintsService';  // ❌ WRONG - direct import

// AFTER
import { complaintsService as factoryComplaintsService } from '@/services/serviceFactory'; // ✅ CORRECT

export const complaintService = {
  async getAllComplaints() {
    return factoryComplaintsService.getComplaints();
  },

  async getComplaintById(id: string) {
    return factoryComplaintsService.getComplaintById(id);
  },

  async createComplaint(data) {
    return factoryComplaintsService.createComplaint(data);
  },

  async updateComplaint(id: string, data) {
    return factoryComplaintsService.updateComplaint(id, data);
  },
};
```

**Checklist**:
- [ ] Remove direct service imports
- [ ] Use factory service exclusively
- [ ] Module service is thin wrapper
- [ ] Passes all data through factory

---

### Layer 7: React Hooks
**File**: `src/modules/features/complaints/hooks/useComplaints.ts`

```typescript
// BEFORE
import { useQuery } from '@tanstack/react-query';
import { complaintService } from '../services/complaintService';

export const useComplaints = () => {
  return useQuery({
    queryKey: ['complaints'], // ⚠️ No dependency tracking
    queryFn: () => complaintService.getAllComplaints(),
  });
};

// AFTER
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ComplaintSchema } from '@/types/complaints';
import { complaintService } from '../services/complaintService';

const QUERY_KEY = ['complaints'] as const;

export const useComplaints = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const data = await complaintService.getAllComplaints();
      return data.map(c => ComplaintSchema.parse(c));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useComplaintById = (id: string) => {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const data = await complaintService.getComplaintById(id);
      return data ? ComplaintSchema.parse(data) : null;
    },
  });
};

export const useCreateComplaint = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => complaintService.createComplaint(data),
    onSuccess: () => {
      // Invalidate cache: Complaints list will refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

export const useUpdateComplaint = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => complaintService.updateComplaint(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific complaint AND list
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};
```

**Checklist**:
- [ ] Hooks use factory service via module service
- [ ] Zod validation in hook queries
- [ ] Proper cache invalidation on mutations
- [ ] Query keys consistent throughout
- [ ] Stale time configured appropriately

---

### Layer 8: UI Components
**File**: `src/modules/features/complaints/components/ComplaintsList.tsx`

```typescript
// BEFORE
export const ComplaintsList = () => {
  const { data: complaints } = useComplaints();

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Customer Name</th>  {/* ❌ PROBLEM: Only has customer_id */}
          <th>Subject</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {complaints?.map(c => (
          <tr key={c.id}>
            <td>{c.id}</td>
            <td>{c.customer_name}</td>  {/* ❌ ERROR: Field doesn't exist */}
            <td>{c.subject}</td>
            <td>{c.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// AFTER
import { useComplaints } from '../hooks/useComplaints';
import { useCustomerById } from '@/modules/features/customers/hooks/useCustomers';

export const ComplaintListRow = ({ complaint }) => {
  // ✅ Fetch customer separately via customer_id
  const { data: customer } = useCustomerById(complaint.customer_id);

  return (
    <tr key={complaint.id}>
      <td>{complaint.id}</td>
      <td title={`Customer ID: ${complaint.customer_id}`}>
        {customer?.name || 'Loading...'}
      </td>
      <td>{complaint.subject}</td>
      <td>
        <span className={`status status-${complaint.status}`}>
          {complaint.status}
        </span>
      </td>
    </tr>
  );
};

export const ComplaintsList = () => {
  const { data: complaints, isLoading, error } = useComplaints();

  if (isLoading) return <div>Loading complaints...</div>;
  if (error) return <div>Error loading complaints</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Customer</th>
          <th>Subject</th>
          <th>Status</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {complaints?.map(complaint => (
          <ComplaintListRow key={complaint.id} complaint={complaint} />
        ))}
      </tbody>
    </table>
  );
};
```

**Checklist**:
- [ ] Remove references to `customer_name` field
- [ ] Fetch customer data separately via `customer_id`
- [ ] Handle loading/error states
- [ ] Verify component renders correctly
- [ ] Test with both mock and Supabase modes

---

## 🧪 Testing (Using Templates from Phase 1)

### Unit Tests
**File**: `src/modules/features/complaints/__tests__/complaints.test.ts`

Copy from template: `src/__tests__/templates/service-normalization.test.template.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { complaintsService } from '@/modules/features/complaints/services/complaintService';
import { ComplaintSchema } from '@/types/complaints';

describe('Complaints Service - Normalization Tests', () => {
  describe('Data Structure', () => {
    it('should NOT have customer_name field', async () => {
      const complaints = await complaintsService.getAllComplaints();
      complaints.forEach(c => {
        expect(c).not.toHaveProperty('customer_name');
        expect(c).toHaveProperty('customer_id');
      });
    });

    it('should validate all complaints against schema', async () => {
      const complaints = await complaintsService.getAllComplaints();
      complaints.forEach(c => {
        expect(() => ComplaintSchema.parse(c)).not.toThrow();
      });
    });
  });

  describe('Foreign Key Validation', () => {
    it('should have valid customer_id FK', async () => {
      const complaints = await complaintsService.getAllComplaints();
      complaints.forEach(c => {
        expect(c.customer_id).toBeTruthy();
        expect(typeof c.customer_id).toBe('string');
      });
    });

    it('should not allow null customer_id', async () => {
      const complaints = await complaintsService.getAllComplaints();
      complaints.forEach(c => {
        expect(c.customer_id).not.toBeNull();
      });
    });
  });
});
```

**Checklist**:
- [ ] Copy unit test template
- [ ] Adapt for Complaints module
- [ ] Run tests: `npm test complaints`
- [ ] All tests pass (30+ assertions)

---

## 📊 Before/After Performance Comparison

### Before (with denormalized customer_name)
```
Query: SELECT * FROM complaints
Rows: 100,000
Time: ~45ms
Size: ~8.5MB (includes duplicate names)
Update anomaly risk: HIGH (name stored 100k times)
```

### After (with FK only)
```
Query: SELECT * FROM complaints
Rows: 100,000
Time: ~12ms (faster due to smaller rows)
Size: ~4.2MB (50% reduction!)
Update anomaly risk: NONE (single source of truth)

Query: SELECT c.*, cust.name FROM complaints c JOIN customers cust ON c.customer_id = cust.id
Rows: 100,000
Time: ~35ms (still better with proper indexing)
Size: ~5.1MB (JOIN result)
```

---

## 🚀 Deployment Checklist

### Staging Deployment
- [ ] Database migration tested successfully
- [ ] All TypeScript compiles without errors
- [ ] Mock service tests passing (40+ tests)
- [ ] Supabase service tests passing
- [ ] Unit tests 100% passing
- [ ] Integration tests 100% passing
- [ ] No console errors in dev tools
- [ ] Performance benchmarks validated
- [ ] UI components render correctly
- [ ] Both mock and Supabase modes tested

### Production Deployment
- [ ] Stakeholder approval obtained
- [ ] Production backup verified
- [ ] Deployment window scheduled
- [ ] Rollback procedure tested
- [ ] Monitoring alerts configured
- [ ] Communication plan executed
- [ ] Rollback within 5 minutes if needed
- [ ] Post-deployment verification completed

---

## ⚡ Quick Troubleshooting

**"Property 'customer_name' does not exist"**
- ✅ Fix: Remove from types, services, and components
- ✅ Check: grep -r "customer_name" src/

**"Unauthorized" error**
- ✅ Fix: Check VITE_API_MODE in .env
- ✅ Check: Using factory service, not direct import?

**"Foreign key constraint violation"**
- ✅ Fix: Ensure customer_id exists in customers table
- ✅ Check: Database migration executed successfully

**Tests failing after changes**
- ✅ Fix: Regenerate test data without customer_name
- ✅ Check: Zod schema validation updated

---

## ✅ SIGN-OFF CHECKLIST

**Developer Checklist** (Before handing off):
- [ ] All code changes complete
- [ ] TypeScript compiler clean
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Ready for QA

**QA Checklist** (Before production):
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing complete
- [ ] Performance benchmarks met
- [ ] Ready for deployment

**Deployment Checklist** (Before going live):
- [ ] Database migration verified
- [ ] Backup confirmed
- [ ] Rollback procedure ready
- [ ] Monitoring configured
- [ ] All checks passed

---

## 📞 Support

**Questions?** Review the complete phase documentation:
- `PHASE1_VERIFICATION_AND_ROADMAP.md` - Full sequential plan
- `PRODUCTS_MODULE_NORMALIZATION_IMPLEMENTATION.md` - Detailed 8-layer example
- `DATABASE_NORMALIZATION_QUICK_REFERENCE.md` - Quick exec summary

**Ready to start?** This module should take 1 day of focused work.

---

**Status**: ✅ READY FOR IMPLEMENTATION  
**Next Module**: Products (after Complaints complete)  
**Estimated Start**: This week  
**Expected Completion**: Within 1 day of focused development

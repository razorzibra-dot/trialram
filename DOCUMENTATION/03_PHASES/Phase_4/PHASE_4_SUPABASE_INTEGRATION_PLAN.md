# Phase 4: Supabase Integration Plan

## 🎯 Phase 4 Objectives

Transform the CRM application from **mock data** to **production-ready Supabase backend**:
- Replace all mock service layers with Supabase queries
- Implement real-time data synchronization
- Ensure multi-tenant data isolation
- Add Row-Level Security (RLS) verification
- Maintain backward compatibility during transition

---

## 📊 Current State Assessment

### ✅ What's Ready
- **Database Schema**: Fully defined in migrations
- **Supabase Configuration**: Local and cloud setup ready
- **Environment Variables**: Already configured (.env)
- **Authentication Context**: Already in place
- **Mock Data**: Working, tested, stable
- **UI Components**: All functional

### ⚠️ What Needs Migration
- **serviceContractService.ts**: Currently uses mock data
- **Other Service Layers**: Same situation
- **Real-time Features**: Not active yet
- **Data Relationships**: Need verification
- **Multi-tenant Isolation**: Needs testing

---

## 🗺️ Phase 4 Implementation Roadmap

### **Stage 1: Foundation Setup (2-3 hours)**
1. Initialize Supabase client in React
2. Create Supabase service wrapper
3. Setup authentication integration
4. Configure multi-tenant context

### **Stage 2: Service Layer Migration (6-8 hours)**
1. Migrate serviceContractService
2. Migrate productSalesService
3. Migrate customerService
4. Update all service methods

### **Stage 3: Real-time Integration (4-5 hours)**
1. Add real-time listeners
2. Implement cache invalidation
3. Setup connection status monitoring
4. Add offline support

### **Stage 4: Testing & Verification (3-4 hours)**
1. Test all CRUD operations
2. Verify multi-tenant isolation
3. Test RLS policies
4. Performance testing

### **Stage 5: Deployment & Cleanup (2-3 hours)**
1. Environment configuration
2. Remove mock data
3. Documentation updates
4. Production checklist

**Total Estimated Time**: 17-23 hours (2-3 days intensive work)

---

## 📁 File Structure Changes

### New Files to Create
```
src/
├── services/
│   ├── supabase/
│   │   ├── client.ts                    # Supabase client initialization
│   │   ├── serviceContractService.ts    # Real implementation
│   │   ├── productSalesService.ts       # Real implementation
│   │   ├── customerService.ts           # Real implementation
│   │   ├── authService.ts               # Auth service
│   │   └── index.ts                     # Barrel exports
│   └── factory.ts                       # Service factory (mock/supabase)
└── utils/
    └── supabase/
        ├── queries.ts                   # Common query builders
        └── rls-policies.ts              # RLS policy verification
```

### Files to Update
```
src/
├── services/
│   ├── serviceContractService.ts        # Add Supabase mode
│   ├── productSalesService.ts           # Add Supabase mode
│   └── index.ts                         # Update exports
├── contexts/
│   └── AuthContext.tsx                  # Add tenant context
└── config/
    └── apiConfig.ts                     # Update mode selection
```

---

## 🔧 Implementation Details

### Step 1: Create Supabase Client (`src/services/supabase/client.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Step 2: Migrate Service Methods

**Example Pattern for serviceContractService:**

#### Before (Mock):
```typescript
async getServiceContractById(id: string): Promise<ServiceContract> {
  const contract = mockServiceContracts.find(c => c.id === id);
  if (!contract) throw new Error('Not found');
  return contract;
}
```

#### After (Supabase):
```typescript
async getServiceContractById(id: string): Promise<ServiceContract> {
  const { data, error } = await supabase
    .from('service_contracts')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', this.getCurrentTenantId())
    .single();
  
  if (error) throw new Error(error.message);
  return this.mapToServiceContract(data);
}
```

### Step 3: Multi-tenant Filtering

All queries must include `tenant_id`:
```typescript
.eq('tenant_id', this.getCurrentTenantId())
```

### Step 4: RLS Policies Verification

Policies should be in migration `20250101000007_row_level_security.sql`

---

## 📋 Service Migration Checklist

### Service: serviceContractService.ts

#### CRUD Operations
- [ ] getServiceContracts - Add `.eq('tenant_id', tenantId)`
- [ ] getServiceContractById - Add tenant filter
- [ ] createServiceContract - Add tenant_id to insert
- [ ] updateServiceContract - Add tenant filter to update
- [ ] renewServiceContract - Create new + update old
- [ ] cancelServiceContract - Add tenant filter

#### Advanced Operations
- [ ] getServiceContractByProductSaleId - Add tenant filter
- [ ] getContractTemplates - Add tenant filter
- [ ] generateContractPDF - Handle async
- [ ] getInvoices - Query related data

#### Query Patterns
- [ ] Filtering (status, service_level, customer_id, date range)
- [ ] Pagination (offset/limit)
- [ ] Sorting (by date, value, status)
- [ ] Joins (with customers, products, invoices)
- [ ] Aggregations (count, sum)

### Service: productSalesService.ts
- [ ] getProductSales
- [ ] getProductSaleById
- [ ] createProductSale
- [ ] updateProductSale
- [ ] getServiceContractFromSale

### Service: customerService.ts
- [ ] getCustomers
- [ ] getCustomerById
- [ ] createCustomer
- [ ] updateCustomer
- [ ] getCustomerContracts
- [ ] getCustomerSales

---

## 🔐 Multi-tenant Implementation

### Required for All Queries:
1. Get current tenant ID from context
2. Add to WHERE clause: `.eq('tenant_id', tenantId)`
3. For INSERT: Include `tenant_id` in data
4. For UPDATE: Always filter by tenant_id first

### Example:
```typescript
private getCurrentTenantId(): string {
  // From AuthContext or session
  return this.authContext.getTenantId();
}

async getServiceContracts(): Promise<ServiceContract[]> {
  const { data } = await supabase
    .from('service_contracts')
    .select('*')
    .eq('tenant_id', this.getCurrentTenantId());
  return data?.map(row => this.mapToServiceContract(row)) || [];
}
```

---

## ⚡ Real-time Features

### Setup Real-time Listeners:
```typescript
// Listen for changes
supabase
  .channel('public:service_contracts')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'service_contracts',
      filter: `tenant_id=eq.${tenantId}`
    },
    (payload) => {
      // Handle INSERT, UPDATE, DELETE
      this.handleDatabaseChange(payload);
    }
  )
  .subscribe();
```

### Cache Invalidation:
- Clear React Query cache on real-time updates
- Refresh component data
- Show update notification

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Test 1: Verify multi-tenant isolation
// Test 2: Verify RLS policies
// Test 3: Verify pagination
// Test 4: Verify filtering
// Test 5: Verify error handling
```

### Integration Tests
```typescript
// Test data flow: Service → Component
// Test real-time updates
// Test concurrent operations
// Test transaction handling
```

### Test Data
Using existing mock data patterns:
- Tenant A: 3 contracts
- Tenant B: 2 contracts
- Verify queries only return tenant-scoped data

---

## 📊 Database Query Examples

### Get Service Contracts with Pagination
```sql
SELECT *
FROM service_contracts
WHERE tenant_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3
```

### Get Contract with All Related Data
```sql
SELECT 
  sc.*,
  c.name AS customer_name,
  p.name AS product_name
FROM service_contracts sc
JOIN customers c ON sc.customer_id = c.id
JOIN products p ON sc.product_id = p.id
WHERE sc.id = $1 AND sc.tenant_id = $2
```

### Count Contracts by Status
```sql
SELECT 
  status,
  COUNT(*) as count
FROM service_contracts
WHERE tenant_id = $1
GROUP BY status
```

---

## 🔗 Integration Points

### AuthContext Integration
```typescript
// In component
const { user, tenant } = useAuth();
const { data } = await serviceContractService.getServiceContracts();
// Automatically filtered to tenant
```

### React Query Integration
```typescript
const { data: contracts } = useQuery({
  queryKey: ['contracts', tenantId],
  queryFn: () => serviceContractService.getServiceContracts()
});
```

---

## ⚠️ Migration Challenges & Solutions

### Challenge 1: Mock Data Consistency
**Problem**: Existing UI expects specific mock data
**Solution**: Keep mock service alongside Supabase for gradual migration

### Challenge 2: Performance
**Problem**: Real data might be slower than mock
**Solution**: Add caching, pagination, lazy loading

### Challenge 3: Authentication
**Problem**: Need to verify JWT tokens
**Solution**: Supabase handles this, just ensure token is in session

### Challenge 4: Offline Support
**Problem**: Real app needs offline mode
**Solution**: Add service worker + IndexedDB sync

---

## 📈 Performance Considerations

### Query Optimization
- Index on `tenant_id` and `status`
- Select only needed columns
- Limit initial page size to 10-20 rows
- Use pagination for large datasets

### Caching Strategy
- Client-side cache with React Query
- Cache TTL: 5 minutes
- Invalidate on mutations
- Real-time listeners for fresh data

### Database Optimization
- Composite indexes on common filters
- Materialized views for complex aggregations
- Connection pooling enabled
- Query timeout: 30 seconds

---

## 🚀 Rollout Strategy

### Phase 4a: Testing Environment
1. Start with local Supabase (`supabase start`)
2. Test all service methods
3. Verify data integrity
4. Performance testing

### Phase 4b: Staging
1. Deploy to staging Supabase
2. Full integration testing
3. Load testing
4. Security audit

### Phase 4c: Production
1. Data migration (if needed)
2. Blue-green deployment
3. Monitor error rates
4. Rollback plan ready

---

## 📝 Verification Checklist

### Before Deployment
- [ ] All service methods tested
- [ ] Multi-tenant isolation verified
- [ ] RLS policies active and tested
- [ ] Real-time listeners working
- [ ] Error handling complete
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Rollback plan ready

### After Deployment
- [ ] Monitor error logs
- [ ] Check query performance
- [ ] Verify data consistency
- [ ] User feedback collected
- [ ] Gradual rollout to 100%

---

## 🔗 Related Files

- **Database Schema**: `supabase/migrations/20250101000005_*.sql`
- **RLS Policies**: `supabase/migrations/20250101000007_*.sql`
- **Current Services**: `src/services/*.ts`
- **Components**: `src/modules/features/service-contracts/views/`

---

## 🎓 Key Concepts for Phase 4

1. **Multi-tenant**: Every query filters by tenant_id
2. **RLS**: Row-level security ensures data isolation
3. **Real-time**: Listen to database changes
4. **Pagination**: Load data efficiently
5. **Caching**: Reduce database load
6. **Error Handling**: Graceful degradation
7. **Type Safety**: Full TypeScript support

---

## ❓ Decision Points

**Ready to proceed with Stage 1: Foundation Setup?**

This will:
1. ✅ Create Supabase client
2. ✅ Setup authentication wrapper
3. ✅ Initialize multi-tenant context
4. ✅ Enable real-time listeners

**Estimated time**: 2-3 hours

---

**Status**: Phase 4 Plan Created
**Next Action**: Implement Stage 1 - Foundation Setup
**Complexity**: Medium
**Risk**: Low (mock data remains as fallback)
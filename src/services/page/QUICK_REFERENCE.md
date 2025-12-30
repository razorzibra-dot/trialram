# Quick Reference - Enterprise Performance Pattern

## Three Rules to Remember

### Rule 1: Reference Data - Context Only
```typescript
✅ const { statusOptions } = useReferenceData();
❌ const data = await referenceDataService.getStatusOptions();
```

### Rule 2: Session Data - SessionService Only
```typescript
✅ const user = sessionService.getCurrentUser();
❌ const { data } = await supabase.from('users').select('*');
```

### Rule 3: Service Caching - In-Flight Dedup
```typescript
✅ Service has Map<cacheKey, Promise> for in-flight requests
❌ Service makes new request on every call
```

### Rule 4: Page-Level Batch Loading
```typescript
✅ <ModuleDataProvider requirements={...}><Page /></ModuleDataProvider>
❌ Component calls useQuery(['customers'], fetchCustomers)
```

## Design Assurances
- **Concurrency safety:** PageDataService and ModuleDataProvider reuse one in-flight promise per cache key (tenant + requirements), preventing duplicate fetches during React 18 StrictMode double-render or rapid navigation.
- **Complex workflows:** Supports parallel fan-out (customers + users + reference) with cached reuse; gate complex pages with feature flags to stage rollout.
- **Separation/loose coupling:** Modules access data via useModuleData/useService routed through the factory; reference data stays in context; session data comes from SessionService cache—no direct Supabase/service imports in modules.
- **Safe pilot/rollback:** Keep legacy hooks available; pilot on Customers first; rollback by removing the ModuleDataProvider wrapper and restoring legacy hooks. Cache remains route-scoped with invalidation on navigation.

---

## When to Use Each Pattern

### SessionService (One Time: On Login)
```typescript
// In AuthContext.tsx
const user = sessionService.getCurrentUser(); // Call once on login

// In any service
const userId = sessionService.getCurrentUser()?.id; // Zero API calls
const tenantId = sessionService.getTenantId(); // Zero API calls
```

### ReferenceDataContext (One Time: App Init)
```typescript
// In components
const { statusOptions } = useReferenceData(); // From app-level context

// In forms
const { categories, suppliers } = useReferenceData(); // No API calls
```

### PageDataService (Per Page: Route Change)
```typescript
// Wrap page with provider
<ModuleDataProvider requirements={REQUIREMENTS}>
  <CustomersPage />
</ModuleDataProvider>

// In components
const { data, isLoading } = useModuleData(); // Batch-loaded data
```

### Service Caching (Inside Services)
```typescript
// In CustomerService.getCustomers()
private inFlight = new Map(); // Track in-flight requests
private cache = new Map(); // Cache results with TTL
// Return cached if fresh → return in-flight if exists → fetch new
```

---

## File Locations

### Core Services
- `src/services/session/SessionService.ts` - User + tenant cache
- `src/services/referencedata/supabase/referenceDataService.ts` - All reference data
- `src/services/page/PageDataService.ts` - Page-level batch loader

### Context Providers
- `src/contexts/AuthContext.tsx` - Loads SessionService on login
- `src/contexts/ReferenceDataContext.tsx` - App-level reference data cache
- `src/contexts/ModuleDataContext.tsx` - Page-level module data cache

### Hooks
- `src/hooks/useSessionManager.ts` - Session management
- `src/hooks/useReferenceDataOptions.ts` - Reference data access
- `src/contexts/ModuleDataContext.tsx` - useModuleData() hook

### Configuration
- `src/config/apiConfig.ts` - API endpoints
- `.github/copilot-instructions.md` - Mandatory rules documentation
- `repo.md` - Project guidelines

---

## Checklist: Before Implementing Any Feature

- [ ] **Reference Data:**
  - [ ] Using `useReferenceData()` or `useModuleData()`?
  - [ ] Not calling `referenceDataService` directly?
  - [ ] Not using `useQuery()` for reference data?

- [ ] **Session Data:**
  - [ ] Using `sessionService.getCurrentUser()`?
  - [ ] Using `sessionService.getTenantId()`?
  - [ ] Not querying users/tenants table?

- [ ] **Service Caching:**
  - [ ] Service has in-flight dedup map?
  - [ ] Service has result cache with TTL?
  - [ ] Cache key includes tenant + filters?

- [ ] **Page-Level Loading:**
  - [ ] Page wrapped with `ModuleDataProvider`?
  - [ ] Requirements defined in `PAGE_REQUIREMENTS`?
  - [ ] Components use `useModuleData()` hook?
  - [ ] No per-component `useQuery()` calls?

---

## Network Tab Expectations

### On First Page Load
```
✅ Expected:
- GET /auth/me (user data) - if not cached
- GET /status_options (reference data) - if not cached
- GET /reference_data (reference data) - if not cached
- GET /suppliers (reference data) - if not cached
- GET /customers (module data) - from PageDataService
- GET /users (module data) - from PageDataService

Total: 2-6 API calls (depends on what's cached)

❌ NOT Expected:
- Multiple calls to same endpoint (dedup failed)
- Per-component calls (should be batch)
- Reference data calls on every page (should cache)
```

### On Page Re-Visit (Within 5 Minutes)
```
✅ Expected:
- 0 API calls (all data from cache)

❌ NOT Expected:
- Any API calls at all
```

### On Navigation to Different Page
```
✅ Expected:
- GET /deals (only new module data)
- GET /products (only new module data)

❌ NOT Expected:
- Reference data calls (should still be cached)
- Session data calls (should still be cached)
```

---

## Performance Targets

| Metric | Target | Measure |
|--------|--------|----------|
| App init | < 200ms | ReferenceDataContext load time |
| Page load | < 250ms | First module data + components render |
| Page re-visit | < 50ms | Cache hit + component render |
| Session API calls | < 10 | Total calls in 10-minute session |
| API call reduction | 80%+ | Compared to non-cached version |

---

## Troubleshooting

### Problem: Network shows multiple calls to same endpoint
**Solution:** Service missing in-flight dedup. Add dedup map and check cache before fetching.

### Problem: Reference data loads on every page
**Solution:** Using `useQuery()` instead of `useReferenceData()`. Switch to context hook.

### Problem: Session data loaded multiple times
**Solution:** SessionService not used. Access via `sessionService.getCurrentUser()` instead of querying database.

### Problem: Page load time still slow
**Solution:** 
1. Check Network tab for sequential calls (should be parallel)
2. Verify ModuleDataProvider is wrapping page (should batch load)
3. Check React Profiler for component render time (not data load time)

### Problem: Stale data after user navigates away and back
**Solution:** Cache TTL too long. Use 5-minute TTL and invalidate on route change.

---

## Code Templates

### Template 1: Define Page Requirements
```typescript
const PAGE_REQUIREMENTS = {
  session: true,
  referenceData: {
    statusOptions: true,
    categories: true,
  },
  module: {
    // Add module data to load
    customers: true,
    users: true,
  },
};
```

### Template 2: Wrap Page with Provider
```typescript
export const CustomersPage = () => {
  return (
    <ModuleDataProvider requirements={PAGE_REQUIREMENTS}>
      <CustomersPageContent />
    </ModuleDataProvider>
  );
};
```

### Template 3: Update Component to Use Context
```typescript
const CustomerList = () => {
  const { data, isLoading, error } = useModuleData();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  const customers = data?.moduleData.customers || [];
  
  return (
    <div>
      {customers.map(customer => (
        <div key={customer.id}>{customer.company_name}</div>
      ))}
    </div>
  );
};
```

### Template 4: Add In-Flight Dedup to Service
```typescript
class MyService {
  private inFlight: Map<string, Promise<T>> = new Map();
  private cache: Map<string, { data: T; timestamp: number }> = new Map();
  
  async getData(tenantId: string): Promise<T> {
    const key = tenantId;
    
    // 1. Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }
    
    // 2. Check in-flight
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key)!;
    }
    
    // 3. Fetch
    const promise = this.fetchData().then(data => {
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    });
    
    this.inFlight.set(key, promise);
    try {
      return await promise;
    } finally {
      this.inFlight.delete(key);
    }
  }
}
```

---

## Decision Tree: Where Should Data Load?

```
Is it user or tenant data?
├─ YES → sessionService.getCurrentUser() / getTenantId()
└─ NO ↓

Is it reference data (status, category, supplier)?
├─ YES → useReferenceData() hook
└─ NO ↓

Is it module-specific data (customers, deals, products)?
├─ YES → Add to PAGE_REQUIREMENTS, use useModuleData()
└─ NO ↓

Is it custom/computed data?
├─ YES → Add to PageDataService.customData(), use useModuleData()
└─ NO ↓

Is it per-component unique data (search results, filters)?
├─ YES → useQuery() with React Query (not cached long-term)
└─ NO ↓

Don't load it OR add to appropriate tier above
```

---

## Anti-Patterns to Avoid

```typescript
// ❌ DON'T: Reference data service in component
const { data } = useQuery(['categories'], 
  () => referenceDataService.getCategories());

// ✅ DO: Use context
const { categories } = useReferenceData();

---

// ❌ DON'T: Query users table in service
const { data: user } = await supabase
  .from('users').select('*').eq('id', userId);

// ✅ DO: Use SessionService
const user = sessionService.getCurrentUser();

---

// ❌ DON'T: Load each component independently
const List = () => useQuery(['customers'], fetchCustomers);
const Stats = () => useQuery(['users'], fetchUsers);

// ✅ DO: Load at page level
<ModuleDataProvider requirements={{customers: true, users: true}}>
  <List />
  <Stats />
</ModuleDataProvider>

---

// ❌ DON'T: Service without caching
async getCustomers() {
  return supabase.from('customers').select('*');
}

// ✅ DO: Add in-flight dedup and result cache
async getCustomers() {
  // Check cache → Check in-flight → Fetch → Cache → Return
}
```

---

## Performance Quick Wins

1. **Add SessionService** (1 hour) → 50% API call reduction
2. **Add ReferenceDataContext** (2 hours) → 30% API call reduction
3. **Add PageDataService to 1 module** (3 hours) → 40% API call reduction
4. **Add in-flight dedup to services** (2 hours) → 20% API call reduction
5. **Apply to all modules** (20 hours) → 80%+ total reduction

**Total: ~28 hours for 80%+ performance improvement**

---

## Related Documentation

- `src/services/page/ENTERPRISE_PERFORMANCE_RULES.md` - Full specification
- `src/services/page/ARCHITECTURE_COMPARISON.md` - Before/after comparison
- `src/services/page/INTEGRATION_CHECKLIST.md` - Step-by-step integration
- `src/services/page/MODULE_IMPLEMENTATION_EXAMPLES.md` - Code examples
- `.github/copilot-instructions.md` - Global guidelines
- `repo.md` - Project standards


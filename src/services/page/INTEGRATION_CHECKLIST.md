# Module Integration Checklist - Single Load Per Page Pattern

## Overview
This checklist ensures modules implement the single-load-per-page pattern, eliminating scattered API calls in favor of coordinated batch loads.

---

## Phase 1: Module Analysis (Before Coding)

### 1.1 Identify Current Data Loading

- [ ] List all hooks that load external data in the module
  ```
  Example: useCustomers(), useUsers(), useReferenceData(), useStatusOptions()
  ```
  
- [ ] Map to actual API calls
  ```
  - useCustomers → GET /customers (module data)
  - useUsers → GET /users (reference)
  - useReferenceData → GET /reference_data (reference - but may be context!)
  - useStatusOptions → GET /status_options (reference - but may be context!)
  ```

- [ ] Document current load pattern
  ```
  Pattern: Scattered
  - App.tsx loads SessionService on init ✓
  - AppProviders loads ReferenceDataContext on init ✓
  - Module mounts, triggers:
    * CustomerList component loads useCustomers() → 1 API call
    * CustomerStats component loads useUsers() → 1 API call
    * CustomerFilters loads useStatusOptions() → 0 API calls (from context)
  
  Total: 2 new API calls per page load
  Ideal: 0 new API calls (load in ModuleDataProvider)
  ```

### 1.2 Define Module Requirements

- [ ] Create `PageDataRequirements` object
  ```typescript
  const CUSTOMERS_PAGE_REQUIREMENTS: PageDataRequirements = {
    session: true, // Already loaded once, no new call
    referenceData: {
      statusOptions: true, // Already loaded, no new call
      categories: true, // Already loaded, no new call
    },
    module: {
      customers: true, // NEW - add to batch load
      users: true, // NEW - add to batch load
    },
  };
  ```

- [ ] Identify immutable vs mutable data
  ```
  Immutable (cache 5+ min):
  - Customers list (users can filter/search)
  - Status options (changes rarely)
  - User list (changes rarely)
  
  Mutable (cache 1 min or less):
  - Currently selected customer (may have been edited elsewhere)
  - User assignments (other admins may reassign)
  ```

---

## Phase 2: Service Implementation

### 2.1 Create Module Data Loaders

- [ ] In `PageDataService.ts`, add module loader method
  ```typescript
  // Example for customers module
  private async loadCustomers(tenantId: string): Promise<CustomerDTO[]> {
    return this.customerService.findMany({
      tenantId,
      limit: 1000,
    });
  }
  
  private async loadUsers(tenantId: string): Promise<UserDTO[]> {
    return this.userService.getUsers({
      tenantId,
      limit: 1000,
    });
  }
  ```

- [ ] Update `getPageData()` to execute module loaders in parallel
  ```typescript
  async getPageData(
    routePath: string,
    requirements: PageDataRequirements
  ): Promise<PageData> {
    // 1. Load session + reference data (already parallel)
    const [sessionData, refData] = await Promise.all([
      this.loadSessionData(),
      this.loadReferenceData(),
    ]);
    
    // 2. Load module data in parallel
    const moduleData: Record<string, unknown> = {};
    
    if (requirements.module?.customers) {
      moduleData.customers = await this.loadCustomers(sessionData.tenantId);
    }
    if (requirements.module?.users) {
      moduleData.users = await this.loadUsers(sessionData.tenantId);
    }
    
    return {
      session: sessionData,
      referenceData: refData,
      moduleData,
    };
  }
  ```

### 2.2 Implement Service Caching

- [ ] Add in-flight deduplication for new module loaders
  ```typescript
  private customersInFlight: Map<string, Promise<CustomerDTO[]>> = new Map();
  private customersCache: Map<string, { data: CustomerDTO[]; timestamp: number }> = new Map();
  
  private async loadCustomers(tenantId: string): Promise<CustomerDTO[]> {
    const cacheKey = tenantId;
    
    // Return fresh cache
    const cached = this.customersCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }
    
    // Reuse in-flight request
    const inFlight = this.customersInFlight.get(cacheKey);
    if (inFlight) return inFlight;
    
    // Fetch and cache
    const promise = this.customerService.findMany({ tenantId }).then(data => {
      this.customersCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    });
    
    this.customersInFlight.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      this.customersInFlight.delete(cacheKey);
    }
  }
  ```

---

## Phase 3: Context & Component Implementation

### 3.1 Create Module Provider Wrapper

- [ ] Wrap module route with `ModuleDataProvider`
  ```typescript
  // src/modules/features/customers/routes.tsx
  export const customersRoutes = [
    {
      path: '/customers',
      element: (
        <ModuleDataProvider requirements={CUSTOMERS_PAGE_REQUIREMENTS}>
          <CustomersPage />
        </ModuleDataProvider>
      ),
    },
  ];
  ```

### 3.2 Replace Component-Level Data Hooks

- [ ] Find all `useCustomers()` calls
  ```typescript
  // ❌ BEFORE
  const CustomerList = () => {
    const { data: customers, isLoading } = useCustomers();
    return <div>{customers?.map(...)}</div>;
  };
  
  // ✅ AFTER
  const CustomerList = () => {
    const { data, isLoading } = useModuleData();
    const customers = data?.moduleData.customers;
    return <div>{customers?.map(...)}</div>;
  };
  ```

- [ ] Find all `useUsers()` calls
  ```typescript
  // ❌ BEFORE
  const AssigneeDropdown = () => {
    const { data: users } = useUsers();
    return <select>{users?.map(...)}</select>;
  };
  
  // ✅ AFTER
  const AssigneeDropdown = () => {
    const { data } = useModuleData();
    const users = data?.moduleData.users;
    return <select>{users?.map(...)}</select>;
  };
  ```

---

## Customer Module Migration Notes (Reference Baseline)

Use this as the reference pattern when migrating other modules to the single-load + cache-first approach.

- Session/Tenant: Seed tenant and user from `SessionService` in hooks (`useCurrentTenant`, `useTenantContext`); no direct Supabase calls for user/tenant lookups. Multi-tenant actions must rely on cached session data.
- ModuleDataProvider: Route requirements include `module: { customers: true, users: true }` and rely on `ModuleDataContext` data instead of ad-hoc queries in components.
- Dropdowns: Customer and product dropdowns use `serviceFactory` with `findMany → getAll → legacy getCustomers/getProducts` fallback; query keys include tenant; `enabled` waits for tenant; use `initialData` from `ModuleDataContext` when available.
- Assigned To: `useAssignedToOptions` depends on tenant cache; ensure `useTenantContext` seeds from `SessionService` so options and label maps hydrate before render.
- Cache invalidation: Customer service clears list caches on update; `ModuleDataContext.refresh()` calls `PageDataService.refreshPageData`, which invalidates route cache and persisted snapshot to pull fresh data after mutations.
- Filters: Customer list search/status/industry/size comparisons are case-insensitive; assigned-to remains exact ID match.
- Persistence TTL: PageDataService is tenant-scoped; refresh/invalidate also clears persisted route snapshot to avoid stale data after edits.

- [ ] Find all `useReferenceData()` calls (reference data already in context!)
  ```typescript
  // ❌ BEFORE (WRONG - calling context twice)
  const { statusOptions } = useReferenceData();
  
  // ✅ AFTER (use module data context)
  const { data } = useModuleData();
  const statusOptions = data?.referenceData?.statusOptions;
  ```

- [ ] Remove all `useQuery()` calls for module/reference data
  ```typescript
  // ❌ BEFORE
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.findMany(),
  });
  
  // ✅ AFTER (no query needed - data already loaded)
  const { data } = useModuleData();
  const customers = data?.moduleData.customers;
  ```

### 3.3 Update Component Prop Passing

- [ ] Remove prop-drilling of loading/error states (use context)
  ```typescript
  // ❌ BEFORE
  const Module = () => {
    const { data, isLoading, error } = useCustomers();
    return <List data={data} isLoading={isLoading} error={error} />;
  };
  
  // ✅ AFTER
  const Module = () => {
    const { data, isLoading, error } = useModuleData();
    return <List data={data?.moduleData.customers} isLoading={isLoading} error={error} />;
  };
  ```

---

## Phase 4: Testing & Validation

### 4.1 Network Verification

- [ ] Open DevTools → Network tab
- [ ] Navigate to module page
- [ ] Verify API calls:
  ```
  Expected on first load:
  ✓ No new customers call (loaded in ModuleDataProvider)
  ✓ No new users call (loaded in ModuleDataProvider)
  ✓ No new reference_data call (already in ReferenceDataContext)
  ✓ No new status_options call (already in ReferenceDataContext)
  
  Total: 0 new API calls for established data
  ```

### 4.2 Performance Profiling

- [ ] Measure page load time before/after
  ```
  Before: ~1.5s (sequential reference data + customers + users)
  After: ~0.8s (parallel reference data + customers + users)
  ```

- [ ] Monitor React Profiler for render times
  ```
  Expected: No re-renders on data load (data already in context)
  ```

### 4.3 Cache Validation

- [ ] Refresh page while on module
  ```
  Expected: 0 API calls (all data from cache)
  Actual: _____ (record)
  ```

- [ ] Navigate away and back
  ```
  Expected: Data reused from cache (5-minute TTL)
  Actual: _____ (record)
  ```

### 4.4 Unit Tests

- [ ] Test `PageDataService.getPageData()` with module requirements
  ```typescript
  it('should load module data in parallel', async () => {
    const service = new PageDataService(...);
    const data = await service.getPageData('/customers', REQUIREMENTS);
    
    expect(data.moduleData.customers).toBeDefined();
    expect(data.moduleData.users).toBeDefined();
    expect(data.referenceData.statusOptions).toBeDefined();
  });
  ```

- [ ] Test module data invalidation on navigation
  ```typescript
  it('should invalidate cache when route changes', () => {
    const context = createTestContext();
    act(() => {
      context.invalidateRoute('/customers');
    });
    expect(context.data).toBeNull();
  });
  ```

---

## Phase 5: Documentation & Knowledge Transfer

### 5.1 Document Module Pattern

- [ ] Add to module README:
  ```markdown
  ## Data Loading Pattern
  
  This module uses single-load-per-page pattern via ModuleDataProvider.
  
  Data is loaded once on page mount in parallel:
  - Session data (user + tenant)
  - Reference data (status options, categories, etc.)
  - Module data (customers, users, etc.)
  
  All components access data via useModuleData() hook.
  ```

### 5.2 Update Integration Guide

- [ ] Add to `INTEGRATION_CHECKLIST.md` status
  ```
  - [ ] Customers module: ✅ COMPLETE
  - [ ] Deals module: ⏳ IN PROGRESS
  - [ ] Products module: ⏳ NOT STARTED
  - [ ] Users module: ⏳ NOT STARTED
  ```

### 5.3 Create Module Rollout Plan

- [ ] Phase 1 (Week 1): Customers + Deals (high-traffic modules)
- [ ] Phase 2 (Week 2): Products + Orders (medium-traffic)
- [ ] Phase 3 (Week 3): Users + Settings (lower-traffic)
- [ ] Phase 4 (Week 4): All remaining modules

---

## Phase 6: Rollback Plan (If Issues Arise)

### 6.1 Revert Strategy

If module data loading causes issues:

- [ ] Keep old hooks (`useCustomers`, `useUsers`, etc.) unchanged
- [ ] Remove ModuleDataProvider wrapper
- [ ] Restore component-level data hooks
- [ ] Document issue in `/ISSUES.md`

### 6.2 Fallback Configuration

- [ ] Add feature flag for module data service
  ```typescript
  const USE_MODULE_DATA_SERVICE = config.featureFlags?.moduleDataService ?? true;
  
  if (USE_MODULE_DATA_SERVICE) {
    return <ModuleDataProvider requirements={REQUIREMENTS}>...</ModuleDataProvider>;
  } else {
    return <OldComponentWithIndividualHooks />;
  }
  ```

---

## Quick Checklist Summary

- [ ] Phase 1: Analyzed current data loading pattern
- [ ] Phase 2: Implemented service loaders with caching
- [ ] Phase 3: Created provider wrapper and updated components
- [ ] Phase 4: Verified network calls and performance
- [ ] Phase 5: Documented module pattern
- [ ] Phase 6: Tested rollback plan (not needed if working!)

---

## Results Expected

**Before Integration:**
- 2-4 API calls per page load (scattered)
- Multiple round-trips (sequential)
- Prop drilling of loading/error states
- Each component loads independently

**After Integration:**
- 0 API calls per page load (reuses cached data)
- Single round-trip on first load (parallel)
- Centralized loading/error state in context
- All components share single data load

**Performance Impact:**
- 30-50% faster page load (parallel vs sequential)
- 0-1 API calls per page navigation (vs 2-4)
- 80-95% reduction in API calls across user session

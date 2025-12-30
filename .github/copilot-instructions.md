# AI Coding Agent Guide (PDS CRM New Theme)

This repository is a modular React + TypeScript application organized around domain "modules", shared services, and strict RBAC/permission-driven navigation. Follow these rules to be immediately productive.

## Architecture Overview
- **Entry points:** `src/main.tsx` (standard) and `src/main-modular.tsx` (module-centric boot). App shell is `src/App.tsx` and `src/modules/App.tsx`.
- **Modular system:** `src/modules/` contains `ModuleRegistry.ts`, `bootstrap.ts`, and feature folders. New features integrate via the registry rather than direct imports.
- **Services layer:** `src/services/` provides domain services. Use `serviceFactory.ts` and `useService.ts` for access. Prefer mock services under `src/services/*/` for tests.
- **Contexts:** Authentication, session, portal, theme, impersonation in `src/contexts/`. Wrap UI in `src/providers/SessionProvider.tsx` and relevant context providers.
- **Permissions & navigation:** RBAC lives in `src/constants/permissionTokens.ts` and `src/constants/modulePermissionMap.ts`; route gating and menu visibility rely on `src/config/navigationPermissions.ts` and hooks like `usePermissionBasedNavigation.ts`.
- **Auth & impersonation:** `src/contexts/AuthContext.tsx`, `src/contexts/ImpersonationContext.tsx`, and related hooks govern user identity, tenant, and impersonation tracking.
- **Common UI & forms:** Reusable components in `src/components/` (auth/common/forms/layout/ui). Follow existing prop patterns; do not bypass contexts.
- **Reference baseline:** Treat the customers module as the reference implementation for ModuleDataProvider + single-load pattern. Follow `src/services/page/INTEGRATION_CHECKLIST.md` when migrating other modules.

## Conventions & Patterns
- **Access checks:** Use `usePermission()`/`useCanAccessModule()` and `useModuleAccess()` to guard components and routes. Never inline string token checks.
- **Navigation:** Use `usePermissionBasedNavigation()` and `useNavigation()`; do not manually push routes without permission evaluation.
- **Session state:** Persist via `useLocalStorage.ts` and `SessionProvider.tsx`. Respect `SessionConfigContext` and `mockSessionConfigService.ts` in tests.
- **Reference data:** Fetch via `useReferenceDataOptions.ts` and `ReferenceDataContext.tsx`; avoid ad‑hoc fetches.
- **Service access:** Retrieve with `useService()`; prefer dependency injection through `serviceFactory.ts` so services remain swappable/mocked.
- **Scroll & UX:** Use `useEnhancedTableScroll.ts` and `useScrollRestoration.ts` for tables and navigation to maintain UX consistency.
- **Error handling:** Surface via components in `src/components/errors/` and `useNotification.ts` rather than `alert()`.

## Development Workflows
- **Tests:** Unit/integration tests in `src/__tests__/` and `src/modules/__tests__/`. Critical suites: `security.test.ts`, `module-access-control.test.ts`, `impersonation-rate-limit.test.ts`, `super-admin-ui.test.tsx`.
- **Run tests:** Use the project’s standard npm/yarn test runner; ensure mocks from `src/services/__tests__/` are used. Keep tests close to features.
- **Build config:** Vite-based React app (see `src/vite-env.d.ts`, `src/polyfills.ts`, `src/buffer-polyfill.ts`). When adding web APIs, update polyfills.
- **Config:** API/backends in `src/config/apiConfig.ts` and `src/config/backendConfig.ts`. Do not hardcode endpoints; extend config files.

## Integration & Boundaries
- **API middleware:** See `src/api/middleware/` for cross‑cutting concerns (auth headers, error mapping). Reuse middleware when adding new calls.
- **PDF templates & exports:** Use `src/services/pdfTemplateService.ts` to generate/handle PDFs.
- **RBAC & tenant:** Combine `useCurrentUser.ts`, `useCurrentTenant.ts`, and `useTenantContext.ts` with permission tokens for multi‑tenant behavior.

## Layer Sync Rules (End-to-End)
- **Database (source of truth):** Columns are snake_case with constraints. Reflect constraints in validation and UI tooltips.
- **Types (domain models):** Define camelCase TypeScript interfaces that match DB columns 1:1. Example: DB `created_at` → type `createdAt` in `src/types/`.
- **Mock service:** Mirror DB fields and enforce the same validation as constraints. Place under `src/services/__tests__/<domain>/` and `src/services/mock*.ts`.
- **Supabase service:** Implement SELECTs returning snake_case; map to camelCase in service. Keep mapping centralized in the service method.
- **Factory routing:** Use `src/services/serviceFactory.ts` to route to Supabase or mock services. No direct service imports in modules.
- **Module service usage:** In features/modules, always obtain services via `useService()` and respect `SessionProvider` and contexts.
- **Hooks contract:** Expose `loading`, `error`, `data` and perform cache invalidation where applicable. Use `useSessionManager.ts`, `useNotification.ts`, and navigation hooks consistently.
- **UI forms:** Fields correspond to DB columns; include tooltips documenting constraints (required, max length, enum). Use components in `src/components/forms/` and `src/components/errors/`.

### Verification Checklist
- **Synchronized layers:** DB ↔ types ↔ mock ↔ Supabase ↔ factory ↔ module ↔ hooks ↔ UI remain consistent.
- **No hardcoding:** Configuration and data come from `src/config/*` and services; never embed constants for endpoints or data.
- **No duplicates:** Remove unused/duplicate files; follow shared components/services.
- **No direct imports:** Features do not import services directly; they use the factory and hooks.
- **Cache discipline:** Hooks implement cache invalidation when mutating data to keep UI in sync.
- **Type safety:** No type mismatches; map snake_case → camelCase deterministically.
- **Validation parity:** Mock and real services enforce identical constraints.
- **Build/tests:** Ensure `src/__tests__/` suites pass; fix lint/build errors before merging.

## ⚡ Enterprise Performance Rules (MANDATORY)

### 🎯 Rule 1: Reference Data - Use Context Only (Zero API Calls)
**CRITICAL:** Reference data (categories, statuses, suppliers) loaded ONCE on app init via `ReferenceDataContext`.

✅ **CORRECT:**
```typescript
// In components: Use context (zero API calls)
import { useReferenceData } from '@/contexts/ReferenceDataContext';
const { categories, statusOptions, suppliers } = useReferenceData();

// In hooks: Use context-based hooks
import { useCategories } from '@/hooks/useReferenceDataOptions';
const { categories } = useCategories();
```

❌ **WRONG:**
```typescript
// ❌ NEVER call services directly from components
const categories = await referenceDataService.getCategories(); // DUPLICATE API CALL!

// ❌ NEVER make separate queries for reference data
await supabase.from('reference_data').select('*'); // BYPASS CACHE!
```

**Service Implementation:**
- Service: `src/services/referencedata/supabase/referenceDataService.ts`
- Context: `src/contexts/ReferenceDataContext.tsx`
- Hooks: `src/hooks/useReferenceDataOptions.ts`
- Pattern: Single `getAllReferenceData()` fetch, all getters return from cache
- Cache: 5-minute TTL, survives React StrictMode double-render

---

### 🎯 Rule 2: Session Data - Use SessionService Only (Zero API Calls)
**CRITICAL:** User + tenant loaded ONCE on login. All services read from `SessionService` cache.

✅ **CORRECT:**
```typescript
// Everywhere: Use SessionService (zero API calls)
import { sessionService } from '@/services/session/SessionService';

const user = sessionService.getCurrentUser(); // Cache
const tenantId = sessionService.getTenantId(); // Cache
const tenant = sessionService.getTenant(); // Cache
```

❌ **WRONG:**
```typescript
// ❌ NEVER query users/tenants in services
const { data: user } = await supabase.from('users').select('*').eq('id', userId).single(); // DUPLICATE!
const { data: tenant } = await supabase.from('tenants').select('*').eq('id', tenantId).single(); // DUPLICATE!

// ❌ NEVER call multiTenantService for user/tenant lookup
await multiTenantService.initializeTenantContext(userId); // MAKES API CALLS!
```

**Integration Points:**
- Service: `src/services/session/SessionService.ts` (singleton)
- AuthContext: `src/contexts/AuthContext.tsx` (calls initializeSession on login)
- MultiTenantService: `src/services/multitenant/supabase/multiTenantService.ts` (uses SessionService)
- All services: Import and use `sessionService` for user/tenant data

**Lifecycle:**
- Login: `sessionService.initializeSession(userId)` (2 API calls: user + tenant)
- Page refresh: `sessionService.getCurrentUser()` (0 API calls: loads from sessionStorage)
- Logout: `sessionService.clearSession()` (clears memory + storage)

---

### 🎯 Rule 3: Service Caching - In-Flight Deduplication (Mandatory)
**CRITICAL:** ALL services with list/detail methods MUST implement in-flight request deduplication.

✅ **CORRECT:**
```typescript
class MyEntityService {
  private listInFlight: Map<string, Promise<Entity[]>> = new Map();
  private listCache: Map<string, { data: Entity[]; timestamp: number }> = new Map();
  private detailInFlight: Map<string, Promise<Entity>> = new Map();
  private detailCache: Map<string, { data: Entity; timestamp: number }> = new();
  private cacheTtlMs = 60 * 1000; // 1 minute

  async getEntities(filters?: Filters): Promise<Entity[]> {
    const cacheKey = `${tenantId}|${JSON.stringify(filters)}`;
    
    // 1. Return fresh cache
    const cached = this.listCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) return cached.data;
    
    // 2. Reuse in-flight request
    const inFlight = this.listInFlight.get(cacheKey);
    if (inFlight) return inFlight;
    
    // 3. Fetch and cache
    const promise = (async () => {
      const result = await this.fetchFromDB(filters);
      this.listCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    })();
    
    this.listInFlight.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      this.listInFlight.delete(cacheKey);
    }
  }
  
  // ⚠️ CRITICAL: Clear cache after mutations!
  async create(data: EntityInput): Promise<Entity> {
    const result = await this.repository.create(data);
    // Clear cache to avoid stale lists
    this.listCache.clear();
    this.listInFlight.clear();
    return result;
  }
  
  async update(id: string, data: EntityInput): Promise<Entity> {
    const result = await this.repository.update(id, data);
    // Clear cache to avoid stale lists
    this.listCache.clear();
    this.listInFlight.clear();
    this.detailCache.delete(id);
    return result;
  }
  
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
    // Clear cache to avoid stale lists
    this.listCache.clear();
    this.listInFlight.clear();
    this.detailCache.delete(id);
    this.detailInFlight.delete(id);
  }
      this.listCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    })();
    
    this.listInFlight.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      this.listInFlight.delete(cacheKey);
    }
  }
}
```

**Apply to ALL services:**
- ✅ NavigationService: `getNavigationItems()` - implemented
- ✅ UserService: `getUsers()`, `getUser(id)` - implemented
- ✅ CustomerService: `findMany()`, `findOne(id)` - implemented
- ✅ ReferenceDataService: `getAllReferenceData()` - implemented
- ⚠️ ALL future entity services MUST follow this pattern

**Why:** React 18 StrictMode renders twice in dev; concurrent component mounts trigger duplicate requests without deduplication.

---

### 🎯 Rule 3A: CRITICAL - Cache Invalidation After Mutations (Mandatory)
**CRITICAL:** ALL mutation methods (create/update/delete) MUST clear service caches to prevent stale data.

❌ **WRONG - Causes Stale Data Bug:**
```typescript
class CustomerService {
  private listCache = new Map();
  
  async create(data: Customer): Promise<Customer> {
    const result = await this.repository.create(data);
    return result;  // ❌ Cache not cleared! Next findMany() returns OLD data
  }
}
```

✅ **CORRECT - Always Clear Cache:**
```typescript
class CustomerService {
  private listCache = new Map();
  private listInFlight = new Map();
  private detailCache = new Map();
  private detailInFlight = new Map();
  
  protected async afterCreate(entity: Customer): Promise<void> {
    // Clear cache to ensure fresh data on next load
    this.listCache.clear();
    this.listInFlight.clear();
    console.log('[CustomerService] Cache cleared after create');
  }
  
  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const result = await this.repository.update(id, data);
    // Clear caches immediately
    this.listCache.clear();
    this.listInFlight.clear();
    this.detailCache.set(id, { data: result, timestamp: Date.now() }); // Update detail cache
    console.log('[CustomerService] Cache cleared after update');
    return result;
  }
  
  async delete(id: string): Promise<void> {
    await super.delete(id);
    // Clear ALL caches
    this.listCache.clear();
    this.listInFlight.clear();
    this.detailCache.delete(id);
    this.detailInFlight.delete(id);
    console.log('[CustomerService] Cache cleared after delete');
  }
}
```

**⚠️ WHY THIS IS CRITICAL:**
- PageDataService calls `customerService.findMany()` after mutations
- If service cache isn't cleared, it returns STALE data
- UI shows old count/data even after refresh completes
- Example bug: Create customer → customersCount stays at 3 instead of 4

**✅ IMPLEMENTATION CHECKLIST:**
- [ ] Clear `listCache` after create/update/delete
- [ ] Clear `listInFlight` after create/update/delete
- [ ] Delete specific `detailCache` entry after update/delete
- [ ] Delete specific `detailInFlight` entry after delete
- [ ] Add console.log for debugging cache clears
- [ ] Test: Create/update/delete should show fresh data immediately

**Apply to ALL entity services:**
- ✅ CustomerService - Fixed 2025-12-29
- ⚠️ DealService - TODO
- ⚠️ ProductService - TODO
- ⚠️ TicketService - TODO
- ⚠️ ComplaintService - TODO
- ⚠️ ALL future entity services

---

### 🎯 Rule 4: React Query Configuration (Mandatory)
**CRITICAL:** All hooks using React Query MUST follow these settings.

✅ **CORRECT:**
```typescript
import { useQuery } from '@tanstack/react-query';

export function useEntities(filters?: Filters) {
  return useQuery({
    queryKey: ['entities', JSON.stringify(filters || {})], // Stable key
    queryFn: () => entityService.getEntities(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false, // Use cache
    retry: 2,
  });
}
```

**App-Level Defaults:**
```typescript
// src/App.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

### 📋 Pre-Implementation Checklist

Before implementing ANY new feature/service, verify:

**Reference Data:**
- [ ] Component uses `useReferenceData()` context (not service calls)
- [ ] No direct `referenceDataService` imports in components
- [ ] Service getters return from `getAllReferenceData()` cache

**Session Data:**
- [ ] Service uses `sessionService.getCurrentUser()` (not queries)
- [ ] Service uses `sessionService.getTenantId()` (not queries)
- [ ] No user/tenant API calls in service methods

**Service Caching:**
- [ ] List method has in-flight deduplication
- [ ] Detail method has in-flight deduplication
- [ ] Cache keys include tenant + filters
- [ ] TTL set to 1-5 minutes

**React Query:**
- [ ] Query keys use `JSON.stringify(filters)`
- [ ] `staleTime: 5 * 60 * 1000` set
- [ ] `refetchOnMount: false` set
- [ ] Cache invalidation on mutations

---

### 🚨 Forbidden Patterns (Auto-Reject)

❌ **NEVER DO THIS:**
```typescript
// 1. Direct reference data service calls in components
const { data } = useQuery(['categories'], () => referenceDataService.getCategories());

// 2. User/tenant queries in services
const user = await supabase.from('users').select('*').single();

// 3. Services without caching
class MyService {
  async getItems() {
    return supabase.from('items').select('*'); // No cache!
  }
}

// 4. Unstable React Query keys
queryKey: ['items', filters] // filters object changes reference!

// 5. Missing refetchOnMount: false
useQuery({ queryKey: ['items'] }); // Will refetch every mount!
```

--- Pointers to Code
- **Factory & access:** `src/services/serviceFactory.ts`, `src/hooks/useService.ts`
- **Supabase services:** `src/services/supabase/`
- **Mocks & tests:** `src/services/__tests__/`, domain-specific mock services
- **Types:** `src/types/` and domain-specific model definitions
- **Hooks:** `src/hooks/` including `usePermission*`, `useSessionManager`, `useReferenceDataOptions`
- **UI forms/errors:** `src/components/forms/`, `src/components/errors/`

## When Adding Features
- **Register module:** Create feature under `src/modules/features/<feature>` and register via `ModuleRegistry.ts`.
- **Gate UI:** Wrap pages/components with permission hooks and load reference/session data via contexts.
- **Service contracts:** Define service interface in `src/services/<domain>/` and expose via `serviceFactory.ts`; provide a mock in `src/services/__tests__/`.
- **Tests first:** Add tests in `src/__tests__/` mirroring patterns in existing suites (security, access control, super‑admin UI).

## Examples
- **Guard a page:** Use `useCanAccessModule('COMPLAINTS')` and render fallback from `src/components/errors/`.
- **Secure navigation:** Generate menu items with `usePermissionBasedNavigation()` so hidden routes don’t appear for unauthorized users.
- **Service usage:** `const ticketService = useService('ticket'); ticketService.addComment(...)` via the factory.

Maintain consistency: leverage contexts, hooks, and the module registry; never bypass RBAC or service factory.

## Agent Reference Docs
- **Functional requirements:** See `FUNCTIONAL_REQUIREMENT_SPECIFICATION.md` and `DEALS_MODULE_FRS_UPDATED_WITH_DEAL_TYPE.md` for module behavior and field constraints.
- **Architecture:** See `ARCHITECTURE.md` for system boundaries and module-service layout.
- **Implementation guide:** See `COMPREHENSIVE_IMPLEMENTATION_GUIDE.md` for end-to-end steps and patterns.
- **RBAC:** See `RBAC_IMPLEMENTATION_COMPLETE.md` and `CENTRALIZED_PERMISSION_CONTEXT_UPDATE.md` for permission tokens, element-level policies, and context wiring.
- **Element permissions:** See `ELEMENT_PERMISSION_GUIDE.md` and `ELEMENT_LEVEL_PERMISSION_IMPLEMENTATION_CHECKLIST.md` for fine-grained UI gating.
- **RLS:** See `RLS_BEST_PRACTICES.md` for row-level security expectations and testing.
- **Auth fixes:** See `CRITICAL_FIXES_RLS_AUTHENTICATION_2025_11_25.md` and `ISSUE_RESOLUTION_COMPLETE_2025_11_25.md` for authentication/RLS resolution history and constraints.
- **Quick fixes:** See `QUICK_FIX_REFERENCE_2025_11_25.md` for known issue patterns and resolutions.
- **Routing/DNS:** See `KONG_DNS_RESOLVER_CONFIG.md` for gateway/DNS config impacting endpoints.
- **Nested endpoints:** See `NESTED_ENDPOINTS_VERIFICATION_REPORT.md` for API path validations.
- **Renaming:** See `SALES_TO_DEALS_RENAMING_COMPLETION_REPORT.md` for domain renaming impacts.
- **Database reset:** See `DATABASE_RESET_GUIDE.md` and `DATABASE_RESET_FIX_COMPLETION_REPORT.md` for recovery workflows.

## Uniform Agent Rules (Critical)
- **Single source of truth:** DB schema (snake_case) defines fields and constraints; all other layers mirror it exactly via deterministic snake→camel mapping.
- **Service access:** Always obtain services via `useService()` routed through `src/services/serviceFactory.ts`. No direct imports from Supabase or mock services in modules.
- **RBAC everywhere:** Guard routes, components, and elements using `usePermission()`, `useCanAccessModule()`, and element guides; menu items generated via `usePermissionBasedNavigation()`.
- **State + cache discipline:** Hooks expose `loading/error/data` and invalidate caches on mutations. Use `useSessionManager.ts` for session flows and `useNotification.ts` for surfaced errors.
- **Config-driven:** Backends and endpoints come from `src/config/apiConfig.ts` and `src/config/backendConfig.ts`. Never hardcode URLs, tokens, or data.
- **UI parity:** Form fields correspond 1:1 to DB columns with tooltips documenting constraints. Reuse `src/components/forms/` and `src/components/errors/`.
- **RLS compliance:** Follow `RLS_BEST_PRACTICES.md`; ensure queries respect tenant/user constraints and align with auth context. Do not bypass middleware.
- **Impersonation tracking:** Respect `ImpersonationContext.tsx` and related hooks; enforce rate limits and audit patterns per tests.
- **NO HARDCODED ROLES:** ⚠️ **CRITICAL ENTERPRISE RULE**: Never hardcode role names in service logic (e.g., `.or('role.eq.agent,role.eq.manager,role.eq.admin')`). Use `src/services/roleService.ts` and database-driven role management. See Enterprise Role Management System section below.
- **IMPORT STANDARDIZATION:** ⚠️ **CRITICAL BUILD RULE**: Use static imports for all services, utilities, and contexts. Use dynamic imports ONLY for route-level lazy loading and module bootstrap. Mixed static/dynamic imports of the same module cause Vite warnings and prevent proper code splitting. See Import Standardization Policy section below.

## Enterprise Role Management System (Database-Driven)
⚠️ **CRITICAL**: This system uses DATABASE-DRIVEN, tenant-specific role configurations. NEVER hardcode role names in queries.

### Architecture Overview
- **Database Schema:** `tenant_roles`, `role_permissions`, `role_assignment_config` tables store tenant-specific role definitions
- **Service Layer:** `src/services/roleService.ts` provides centralized role management with caching
- **Context Layer:** `src/contexts/RoleContext.tsx` distributes role data to React components
- **Hooks:** `useAssignedToOptions`, `useAssignableUsers`, `useTenantRoles` for UI integration

### ❌ WRONG: Hardcoded Roles (OLD PATTERN - DO NOT USE)
```typescript
// ❌ NEVER DO THIS - Breaks in multi-tenant environments
const { data } = await supabase
  .from('users')
  .select('*')
  .or('role.eq.agent,role.eq.manager,role.eq.admin');  // ❌ Hardcoded roles
```

### ✅ CORRECT: Database-Driven Roles (NEW ENTERPRISE PATTERN)
```typescript
// ✅ ALWAYS DO THIS - Loads tenant-specific roles from database
import { roleService } from '@/services/roleService';

// In service method:
async autoAssignLead(leadId: string): Promise<LeadDTO> {
  const user = authService.getCurrentUser();
  const tenantId = user.tenant_id;
  
  // Get assignable users from database-driven role config
  const assignableUsers = await roleService.getAssignableUsers(tenantId, 'leads');
  
  // Query using actual user IDs (no role filtering needed)
  const userIds = assignableUsers.map(u => u.id);
  // ... rest of logic
}
```

### UI Pattern: Assignable User Dropdowns
```typescript
// ✅ Use shared hook for consistent "Assigned To" dropdowns
import { useAssignedToOptions } from '@/hooks/useAssignedToOptions';

const LeadForm = () => {
  const { options, loading } = useAssignedToOptions('leads');
  
  return (
    <Select 
      options={options} 
      loading={loading}
      placeholder="Select assignee"
    />
  );
};
```

### Key Components
1. **Database Migration:** `supabase/migrations/20251227_tenant_role_management.sql`
   - Creates `tenant_roles`, `role_permissions`, `role_assignment_config` tables
   - Seeds default roles (agent, manager, admin) for existing tenants
   - Provides helper functions: `get_assignable_roles()`, `role_has_permission()`

2. **Role Service:** `src/services/roleService.ts`
   - `getTenantRoles(tenantId)` - Get all roles for a tenant
   - `getAssignableRoles(tenantId, moduleName)` - Get roles assignable to module entities
   - `getAssignableUsers(tenantId, moduleName)` - Get users with assignable roles
   - Built-in caching (5min TTL) for performance

3. **Role Context:** `src/contexts/RoleContext.tsx`
   - Provides `<RoleProvider>` wrapping app (in `AppProviders.tsx`)
   - Exports hooks: `useTenantRoles()`, `useAssignableRoles(moduleName)`, `useAssignableUsers(moduleName)`

4. **Shared Hooks:** `src/hooks/useAssignedToOptions.ts`
   - `useAssignedToOptions(moduleName)` - Returns formatted dropdown options
   - `useAssignableUsersDetailed(moduleName)` - Returns full user details
   - Used across ALL modules for consistency

5. **Admin UI:** `src/modules/features/super-admin/views/RoleManagementPage.tsx`
   - Super admin interface to create/edit tenant roles
   - Configure role hierarchy and permissions
   - Set which roles are assignable per module

### Benefits Over Hardcoded Approach
✅ **Tenant-Specific:** Each tenant can have custom role names (e.g., "Sales Rep" vs "Agent")
✅ **No Code Changes:** Adding new roles doesn't require redeployment
✅ **Flexible Hierarchy:** Role levels and permissions configured per tenant
✅ **Module-Specific:** Different roles can be assignable to different modules
✅ **Performance:** Cached role configs with automatic invalidation
✅ **Consistent:** Single source of truth for all role-based queries

### Migration Path from Hardcoded Roles
If you find hardcoded role checks:
1. Replace `.or('role.eq.X,role.eq.Y')` with `roleService.getAssignableUsers()`
2. Update UI dropdowns to use `useAssignedToOptions(moduleName)`
3. Remove any role constants or environment variables for roles
4. Test with multiple tenants to ensure isolation

### Configuration Sources (LEGACY - Removed)
~~Environment-based role config removed~~ - Now purely database-driven

### DO NOT Use These Patterns (Deprecated)
- ❌ `backendConfig.roles.*` (removed - was env-based)
- ❌ `roleConstants.ts` (removed - was hardcoded)
- ❌ `ROLES_ASSIGNABLE_FOR_*` constants (removed)
- ❌ Hardcoded `.or('role.eq...')` filters (replaced with service calls)

## Consistency Enforcement
- **Mapping discipline:** Perform snake_case→camelCase in services only; keep types in `src/types/` strictly camelCase; never mix conventions in UI or hooks.
- **Validation parity:** Mirror DB constraints in mock services and Supabase services; update tooltip/help text consistently.
- **Factory routing check:** Ensure `serviceFactory.ts` selects correct backend (Supabase vs mock) based on environment/config; features never import services directly.
- **Element-level RBAC:** Apply policies from `ELEMENT_PERMISSION_GUIDE.md` and `ELEMENT_LEVEL_PERMISSION_IMPLEMENTATION_CHECKLIST.md` for buttons/inputs.
- **Navigation gating:** Centralize permissions in `navigationPermissions.ts`; use `useNavigation()` helpers and do not push routes manually.
- **Session/auth alignment:** Use `AuthContext.tsx`, `SessionConfigContext.tsx`; adhere to fixes from `CRITICAL_FIXES_RLS_AUTHENTICATION_2025_11_25.md` and `ISSUE_RESOLUTION_COMPLETE_2025_11_25.md`.
- **Endpoint validation:** Validate nested endpoints per `NESTED_ENDPOINTS_VERIFICATION_REPORT.md`; respect gateway per `KONG_DNS_RESOLVER_CONFIG.md`.
- **Renaming consistency:** Follow `SALES_TO_DEALS_RENAMING_COMPLETION_REPORT.md` for domain naming; avoid legacy "sales" names.
- **Cleanup policy:** Remove duplicates and unused files; prefer shared components/services; keep repository clean per cleanup guides.

## Do / Don’t (Non‑negotiable)
- **Do:** Use contexts/providers (`SessionProvider.tsx`) and hooks; route services via factory; map snake→camel in services; document constraints in UI.
- **Do:** Implement cache invalidation on mutations; surface errors with `useNotification.ts`.
- **Don’t:** Directly import services in modules; hardcode endpoints/data; skip RBAC/RLS; leave validation mismatches; forget cache invalidation.

## Quick Consistency Checklist (Per Task)
- DB↔types↔mock↔Supabase↔factory↔module↔hooks↔UI all aligned.
- No hardcoded values; configs used for endpoints/backends.
- No duplicates; shared components/services reused.
- Cache invalidation implemented; tests pass (`src/__tests__/` critical suites).
- Lint/build clean; type mappings correct; validations identical.

---

## CRUD Service Implementation Pattern (CRITICAL - MANDATORY)

### Pre-Implementation Checklist (MUST DO BEFORE CODING)

Before implementing ANY CRUD operation for a module, you MUST:

1. **Read the Database Schema First**
   - Check `supabase/COMPLETE_DATABASE_EXPORT.sql` OR `supabase/complete_database_schema.sql`
   - Note ALL columns that exist in the table
   - Note column data types and constraints
   - Note which columns are auto-generated (id, created_at, updated_at, tenant_id)

2. **Identify Field Categories**
   - **Auto-generated fields** (NEVER send in create/update): `id`, `created_at`, `updated_at`, `deleted_at`
   - **System-set fields** (set by service, not user input): `tenant_id`, `created_by`, `updated_by`
   - **User-provided fields**: All other fields from the input type
   - **Computed/virtual fields**: Fields that exist in types but NOT in database (e.g., `attachments` loaded separately)

3. **Create a Field Mapping Table**
   Document the mapping between TypeScript camelCase and database snake_case:
   ```
   | TypeScript Field | Database Column | In Create? | In Update? |
   |------------------|-----------------|------------|------------|
   | customerId       | customer_id     | YES        | NO         |
   | startDate        | start_date      | YES        | YES        |
   | attachments      | (separate table)| NO         | NO         |
   ```

### Service Implementation Pattern

#### ✅ CORRECT: Explicit Field Mapping (ALWAYS USE THIS)

```typescript
async createEntity(data: EntityCreateInput): Promise<Entity> {
  // Step 1: Build insert object with ONLY valid database columns
  const insertData = {
    // User-provided fields (map camelCase → snake_case)
    customer_id: data.customerId,
    product_id: data.productId,
    title: data.title,
    description: data.description,
    status: data.status || 'draft',
    start_date: data.startDate,
    end_date: data.endDate,
    value: data.value,
    // ... only fields that EXIST in the database table
    
    // System-set fields
    created_by: (await supabaseClient.auth.getUser()).data.user?.id,
    // tenant_id is set by RLS or explicitly if needed
  };

  const { data: result, error } = await supabaseClient
    .from('entities')
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return mapEntityRow(result);
}

async updateEntity(id: string, data: EntityUpdateInput): Promise<Entity> {
  // Step 1: Define EXPLICIT field mapping (only updateable fields)
  const fieldMap: Record<string, string> = {
    title: 'title',
    description: 'description',
    status: 'status',
    startDate: 'start_date',
    endDate: 'end_date',
    value: 'value',
    // ... only fields that CAN be updated
    // DO NOT include: id, customer_id, created_at, created_by, tenant_id
  };

  // Step 2: Build update object from input using the map
  const updateData: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && fieldMap[key]) {
      updateData[fieldMap[key]] = value;
    }
  });

  // Step 3: Add system fields
  updateData.updated_by = (await supabaseClient.auth.getUser()).data.user?.id;
  updateData.updated_at = new Date().toISOString();
}
```

---

## Enterprise-Grade Coding Standards (Generic, Loosely Coupled, Configurable)

⚠️ **MANDATORY**: Scalable code must be generic/dynamic, loosely coupled via dependency injection, and fully configurable for multi-tenant environments.

### Rule 1: Generic & Dynamic Code Over Hardcoded Solutions

**❌ WRONG: Hardcoded Entity-Specific Code**
```typescript
// ❌ Code duplication - same logic for each entity
async getLeads(): Promise<Lead[]> {
  return supabase.from('leads').select('*');
}

async getDeals(): Promise<Deal[]> {
  return supabase.from('deals').select('*');
}

// ❌ Hardcoded validation logic
if (lead.status !== 'qualified' && lead.status !== 'hot') {
  throw new Error('Invalid status');
}
```

**✅ CORRECT: Generic Service Pattern**
```typescript
// ✅ Works for ANY entity with same interface
class GenericEntityService<T extends Entity> {
  constructor(
    private tableName: string,
    private config: EntityConfig<T>
  ) {}

  async findMany(filters?: Record<string, unknown>): Promise<T[]> {
    let query = supabase.from(this.tableName).select('*');
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    
    return query;
  }
}

// ✅ Reuse for all entities
const leadService = new GenericEntityService('leads', leadsConfig);
const dealService = new GenericEntityService('deals', dealsConfig);
const customerService = new GenericEntityService('customers', customersConfig);
```

### Rule 2: Dependency Injection Over Hard-Coded Dependencies

**❌ WRONG: Tightly Coupled - Cannot Test or Extend**
```typescript
class OrderService {
  private emailService = new EmailService();  // Hard-coded
  private notificationService = new NotificationService();  // Hard-coded

  async createOrder(data: OrderData) {
    const order = await this.saveOrder(data);
    this.emailService.send(order);  // Cannot mock for testing
  }
}
```

**✅ CORRECT: Constructor Injection for Loose Coupling**
```typescript
class OrderService {
  constructor(
    private emailService: IEmailService,
    private notificationService: INotificationService,
    private logger: ILogger
  ) {}

  async createOrder(data: OrderData) {
    const order = await this.saveOrder(data);
    await this.emailService.send(order);  // Easy to swap/mock
  }
}

// Production usage
const service = new OrderService(
  new SmtpEmailService(),
  new PushNotificationService(),
  new ConsoleLogger()
);

// Test usage - inject mocks
const testService = new OrderService(
  new MockEmailService(),
  new MockNotificationService(),
  new MockLogger()
);
```

### Rule 3: Centralized Configuration Over Hardcoded Values

**❌ WRONG: Hardcoded Config Scattered Everywhere**
```typescript
// ❌ Different timeout values in different files
class ApiClient {
  private timeout = 30000;  // Customer service timeout
}

class OrderService {
  private timeout = 5000;  // Order service timeout - inconsistent!
  private retries = 2;  // Different retry count
}

// ❌ Environment-specific values hardcoded
const API_URL = 'https://api.example.com';
const CACHE_TTL = 60000;
const LOG_LEVEL = 'debug';
```

**✅ CORRECT: Centralized Configuration**
```typescript
// src/config/appConfig.ts - SINGLE SOURCE OF TRUTH
export const appConfig = {
  api: {
    baseUrl: process.env.VITE_API_URL || 'https://api.example.com',
    timeout: parseInt(process.env.VITE_API_TIMEOUT || '30000'),
    retries: parseInt(process.env.VITE_API_RETRIES || '3'),
  },
  cache: {
    ttlMs: parseInt(process.env.VITE_CACHE_TTL || '300000'),
    maxSize: parseInt(process.env.VITE_CACHE_MAX_SIZE || '100'),
  },
  logging: {
    level: process.env.VITE_LOG_LEVEL || 'info',
  },
} as const;

// All services use same config
class CustomerService {
  constructor(private config: typeof appConfig) {}
  
  async fetch() {
    return apiClient.get('/customers', {
      timeout: this.config.api.timeout,  // Consistent
      retries: this.config.api.retries,
    });
  }
}

class OrderService {
  constructor(private config: typeof appConfig) {}
  
  async fetch() {
    return apiClient.get('/orders', {
      timeout: this.config.api.timeout,  // Same value
      retries: this.config.api.retries,
    });
  }
}
```

### Rule 4: Configuration Objects Over Parameter Overload

**❌ WRONG: Too Many Parameters**
```typescript
// ❌ 8 parameters is unmaintainable
async fetchData(
  entityType: string,
  withDetails: boolean,
  includeDeleted: boolean,
  sortBy: string,
  sortDir: 'asc' | 'desc',
  limit: number,
  offset: number,
  cacheEnabled: boolean
) { /* ... */ }
```

**✅ CORRECT: Options Object Pattern**
```typescript
interface QueryOptions {
  filters?: Record<string, unknown>;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  cache?: { enabled: boolean; ttlMs?: number };
  relations?: string[];
}

async function fetchData(
  entityType: string,
  options: QueryOptions = {}
): Promise<Entity[]> {
  const { 
    filters = {}, 
    limit = 100, 
    sortBy,
    cache = { enabled: true }
  } = options;
  
  // Implementation uses options object
}

// Usage: Clear and maintainable
const leads = await fetchData('leads', {
  filters: { status: 'hot' },
  limit: 50,
  sortBy: 'created_at',
  sortDirection: 'desc',
});
```

### Rule 5: Strategy Pattern for Pluggable Logic

**❌ WRONG: Monolithic with If/Else Chains**
```typescript
// ❌ Adding new export format requires modifying class
class DataExporter {
  async export(data: Entity[], format: 'csv' | 'json' | 'pdf') {
    if (format === 'csv') return this.toCsv(data);
    else if (format === 'json') return this.toJson(data);
    else if (format === 'pdf') return this.toPdf(data);
  }
}
```

**✅ CORRECT: Strategy Pattern for Extensibility**
```typescript
interface ExportStrategy {
  export(data: Entity[]): Promise<Blob>;
  contentType: string;
}

class DataExporter {
  private strategies: Map<string, ExportStrategy> = new Map([
    ['csv', new CsvStrategy()],
    ['json', new JsonStrategy()],
    ['pdf', new PdfStrategy()],
  ]);

  registerStrategy(format: string, strategy: ExportStrategy) {
    this.strategies.set(format, strategy);
  }

  async export(data: Entity[], format: string): Promise<Blob> {
    const strategy = this.strategies.get(format);
    if (!strategy) throw new Error(`Unknown format: ${format}`);
    return strategy.export(data);
  }
}

// ✅ Adding Excel support - NO changes to DataExporter
const exporter = new DataExporter();
exporter.registerStrategy('xlsx', new ExcelStrategy());
```

### Rule 6: Higher-Order Functions to Eliminate Code Duplication

**❌ WRONG: Repeated Caching Logic**
```typescript
// ❌ DRY violation across multiple services
class CustomerService {
  async findMany(filters?: Filters) {
    const cacheKey = `customers:${JSON.stringify(filters)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    
    const result = await supabase.from('customers').select('*');
    this.cache.set(cacheKey, result);
    return result;
  }
}

class OrderService {
  async findMany(filters?: Filters) {
    const cacheKey = `orders:${JSON.stringify(filters)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    
    const result = await supabase.from('orders').select('*');
    this.cache.set(cacheKey, result);
    return result;
  }
}
```

**✅ CORRECT: Reusable Caching Decorator**
```typescript
// ✅ Generic caching for ANY async function
function withCaching<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  prefix: string,
  ttlMs: number = 300000
): T {
  const cache = new Map<string, { data: any; time: number }>();

  return async ((...args: any[]) => {
    const key = `${prefix}:${JSON.stringify(args)}`;
    const entry = cache.get(key);
    
    if (entry && Date.now() - entry.time < ttlMs) {
      return entry.data;
    }
    
    const data = await fn(...args);
    cache.set(key, { data, time: Date.now() });
    return data;
  }) as T;
}

// ✅ Apply to any service
class CustomerService {
  findMany = withCaching(
    this._findMany.bind(this),
    'customers'
  );
  
  private async _findMany(filters?: Filters) {
    return supabase.from('customers').select('*');
  }
}

class OrderService {
  findMany = withCaching(
    this._findMany.bind(this),
    'orders'
  );
  
  private async _findMany(filters?: Filters) {
    return supabase.from('orders').select('*');
  }
}
```

### Rule 7: Composition Over Inheritance

**❌ WRONG: Rigid Class Hierarchy**
```typescript
// ❌ Fragile base class inheritance
class BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  
  async save() { /* ... */ }
}

class Customer extends BaseEntity {
  name: string;
}

class Product extends BaseEntity {
  name: string;
  price: number;
}

// ❌ Changing BaseEntity breaks all subclasses
```

**✅ CORRECT: Composition & Interfaces**
```typescript
// ✅ Flexible, composable interfaces
interface Identifiable {
  id: string;
}

interface Auditable {
  createdAt: Date;
  updatedAt: Date;
}

// ✅ Compose as needed
type Customer = Identifiable & Auditable & {
  name: string;
};

type Product = Identifiable & Auditable & {
  name: string;
  price: number;
};

// ✅ Generic functions work with any composition
function getMetadata<T extends Identifiable & Auditable>(entity: T) {
  return { id: entity.id, createdAt: entity.createdAt };
}
```

### Rule 8: Multi-Tenant Aware by Default

**❌ WRONG: Single-Tenant Code**
```typescript
// ❌ No tenant filtering
async getLeads(): Promise<Lead[]> {
  return supabase.from('leads').select('*');  // Returns ALL tenants' leads!
}
```

**✅ CORRECT: Automatic Tenant Filtering**
```typescript
import { sessionService } from '@/services/session/SessionService';

// ✅ All queries automatically filtered by tenant
async getLeads(filters?: Filters): Promise<Lead[]> {
  const tenantId = sessionService.getTenantId();
  
  let query = supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', tenantId);  // Automatic isolation
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  return query;
}

// Configuration separates by tenant
const config = {
  database: {
    tenantId: sessionService.getTenantId(),
  },
};
```

### Rule 9: Document Trade-offs & Constraints

**Every generic/shared component must include:**

```typescript
/**
 * Generic Entity Service
 * 
 * ✅ PROS:
 * - Reduces boilerplate 80%
 * - Automatic tenant filtering
 * - Built-in caching
 * - Type-safe generics
 * 
 * ❌ CONS:
 * - Cannot handle complex domain logic
 * - Query filters limited to equals (use custom for complex)
 * - Relations loaded separately
 * 
 * ✅ USE WHEN:
 * - Simple CRUD operations
 * - Static reference data
 * - Audit/logging entities
 * 
 * ❌ DO NOT USE FOR:
 * - Complex domain logic (use domain service)
 * - Many-to-many with junctions (use custom query)
 * - Graph queries (use custom query)
 * 
 * @example
 * const service = new GenericEntityService('products', supabase, config);
 * const items = await service.findMany({ filters: { active: true } });
 */
```

### Enterprise Checklist (Before Code Review)

- [ ] No hardcoded values - all config via `appConfig` or environment
- [ ] No direct service instantiation - dependencies injected via constructor
- [ ] No tightly coupled imports - can swap implementations easily
- [ ] No parameter overload - methods use options objects
- [ ] Reusable patterns - can apply same code to 3+ entities
- [ ] Documented constraints - comments explain when/why
- [ ] Tenant-aware - automatic filtering via `sessionService`
- [ ] Type-safe - generics preserve type information
- [ ] Testable - all dependencies mockable
- [ ] Composable - functions combine without side effects

---

  const { data: result, error } = await supabaseClient
    .from('entities')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapEntityRow(result);
}
```

#### ❌ WRONG: Spreading Input Directly (NEVER DO THIS)

```typescript
// ❌ WRONG: Spreads ALL input fields including non-existent columns
async createEntity(data: EntityCreateInput): Promise<Entity> {
  const { data: result, error } = await supabaseClient
    .from('entities')
    .insert([{
      ...data,  // ❌ DANGER: May include fields that don't exist in DB
      created_by: userId,
    }])
    .select()
    .single();
}

// ❌ WRONG: Using toDatabase() without column validation
async updateEntity(id: string, data: EntityUpdateInput): Promise<Entity> {
  const { data: result, error } = await supabaseClient
    .from('entities')
    .update({
      ...toDatabase(data),  // ❌ DANGER: toDatabase doesn't know which columns exist
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
}
```

### Common Pitfalls to Avoid

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Spreading input directly | Sends non-existent columns → 400 Bad Request | Use explicit field mapping |
| Using generic toDatabase() | Doesn't filter out invalid columns | Use explicit field mapping per entity |
| Including computed fields | Fields like `attachments` don't exist in main table | Exclude from insert/update, load separately |
| Including read-only fields | Fields like `id`, `created_at` sent in update | Use fieldMap that excludes these |
| Missing column in schema | Service sends field that DB doesn't have | Always verify against DB schema first |

### Verification Steps (MUST DO AFTER IMPLEMENTATION)

1. **Compare service fields vs database columns**
   - Every field in `insert()` must exist in the table
   - Every field in `update()` must exist in the table
   
2. **Test the CRUD operations**
   - Create: Should succeed without 400 errors
   - Read: Should return all expected fields
   - Update: Should succeed without 400 errors
   - Delete: Should succeed (soft or hard delete)

3. **Check for console errors**
   - No "column X does not exist" errors
   - No "Could not find column" errors
   - No "400 Bad Request" on insert/update

### Field Category Reference

| Category | Examples | In Create | In Update | Notes |
|----------|----------|-----------|-----------|-------|
| Auto-generated | id, created_at, updated_at | ❌ NO | ❌ NO | DB handles these |
| System-set | tenant_id, created_by, updated_by | ✅ SET BY SERVICE | ✅ SET BY SERVICE | Service sets, not user input |
| Immutable | customer_id, product_id | ✅ YES | ❌ NO | Set once, never change |
| Mutable | title, status, description | ✅ YES | ✅ YES | User can modify |
| Computed/Virtual | attachments, documents | ❌ NO | ❌ NO | Loaded from related tables |
| Deprecated/Removed | old_field_name | ❌ NO | ❌ NO | May exist in types but not DB |

### Schema Sync Verification Command

Before implementing, verify database columns:
```sql
-- Check actual columns in a table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'your_table_name' 
ORDER BY ordinal_position;
```

### Module-Specific Verified Patterns

| Module | Create Pattern | Update Pattern | Notes |
|--------|---------------|----------------|-------|
| Deals | Uses `toDatabase()` mapper | Uses `toDatabase()` mapper | ✅ Verified correct |
| Products | Explicit field list | Explicit field list | ✅ Fixed: removed specifications, pricing_tiers, discount_rules, notes |
| Product Sales | Explicit field list | Explicit field list | ✅ Fixed: removed sale_date, excluded attachments |
| Job Works | Explicit field list | Explicit fieldMap | ✅ Fixed: excluded specifications from update |
| Service Contracts | Explicit field list | Explicit fieldMap | ✅ Verified: matches enterprise schema |
| Customers | Explicit field list | Explicit field list | ✅ Verified correct |
| Tickets | Explicit field list | Explicit fieldMap | ✅ Verified correct |
| Complaints | Explicit field list | Explicit field list | ✅ Verified correct |

---
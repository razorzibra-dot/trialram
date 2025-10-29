# Module Standardization Enforcement Plan

**Status**: PHASE 2 - Full Module Standardization  
**Date**: 2025-01-29  
**Target**: 100% Module Service Container Pattern Compliance

---

## Enforcement Rules - MANDATORY FOR ALL MODULES

### RULE 1: Module Definition MUST Include Services Array
```typescript
export const myModule: FeatureModule = {
  name: 'module-name',
  path: '/module-path',
  services: ['serviceName1', 'serviceName2'],  // ✅ REQUIRED - even if empty []
  dependencies: ['core', 'shared'],
  routes: myRoutes,
  components: {},
  async initialize() { ... },
  async cleanup() { ... }
};
```

### RULE 2: Module initialize() MUST Register All Services
```typescript
async initialize() {
  const { registerService } = await import('@/modules/core/services/ServiceContainer');
  
  // Register each service from serviceFactory
  const { serviceA, serviceB } = await import('@/services/serviceFactory');
  registerService('serviceA', serviceA);
  registerService('serviceB', serviceB);
  
  console.log('[Module Name] ✅ Services registered');
}
```

### RULE 3: Components/Pages MUST Use useService() Hook
```typescript
// ✅ CORRECT
import { useService } from '@/modules/core/hooks/useService';

const MyComponent = () => {
  const myService = useService<ServiceType>('serviceName');
  // Use service...
};

// ❌ WRONG - Direct imports prohibited
import { myService } from '@/services';
```

### RULE 4: No Direct Service Imports in Components/Pages
- ❌ `import { serviceA } from '@/services'`
- ❌ `import { serviceA } from '@/services/serviceFactory'`
- ❌ `import { supabaseServiceA } from '@/services/api/supabase/...'`
- ✅ `const serviceA = useService('serviceA')`

### RULE 5: Service Imports Only Allowed In:
1. **Module initialization** - `/src/modules/features/MODULE/index.ts`
2. **Service container** - `/src/modules/core/services/ServiceContainer.ts`
3. **Service factory** - `/src/services/serviceFactory.ts`
4. **Custom hooks** - `/src/modules/features/MODULE/hooks/*.ts` (must use useService)

### RULE 6: Cleanup MUST Unregister Services
```typescript
async cleanup() {
  const { unregisterService } = await import('@/modules/core/services/ServiceContainer');
  unregisterService('serviceA');
  unregisterService('serviceB');
  
  console.log('[Module Name] ✅ Services unregistered');
}
```

### RULE 7: TypeScript Type Safety Required
```typescript
// ✅ CORRECT - Full type safety
const service = useService<NotificationService>('notificationService');

// ⚠️ ACCEPTABLE - When type not available
const service = useService<any>('serviceName');

// ❌ WRONG - No typing
const service = useService('serviceName');
```

---

## Standardization Checklist

### For Each Module, Verify:

- [ ] **Module Definition**
  - [ ] `services: [...]` array defined
  - [ ] All used services listed
  - [ ] `path` property present

- [ ] **Module Initialization**
  - [ ] `initialize()` imports serviceFactory
  - [ ] `initialize()` calls registerService() for each service
  - [ ] Console log with module name and confirmation
  - [ ] Error handling with try/catch

- [ ] **Module Cleanup**
  - [ ] `cleanup()` calls unregisterService() for each service
  - [ ] Proper error handling
  - [ ] Console log with completion message

- [ ] **Components**
  - [ ] No direct imports from `/src/services/`
  - [ ] All services injected via `useService()` hook
  - [ ] Proper TypeScript typing on hook calls
  - [ ] Services initialized in useEffect on mount

- [ ] **Pages/Views**
  - [ ] Same rules as components
  - [ ] Page-level service injection if shared across page
  - [ ] Proper prop drilling to child components

- [ ] **Custom Hooks**
  - [ ] Services injected via `useService()`
  - [ ] Hooks wrap service calls with proper error handling
  - [ ] Return clean interface to components

---

## Module Status & Action Items

### ✅ COMPLIANT MODULES (No Action Needed)
- Sales
- Product Sales
- Customers
- Contracts
- Service Contracts
- Tickets
- JobWorks
- Dashboard
- Masters

### ❌ REQUIRES STANDARDIZATION

#### 1. Notifications Module
**Current**: Uses notificationService from serviceFactory  
**Action**: 
- [ ] Add `services: ['notificationService']` to module definition
- [ ] Update `initialize()` to register notificationService
- [ ] Update all .tsx files to use `useService()` instead of direct import

**Files to Update**:
- `index.ts` - Add service registration
- `views/NotificationsPage.tsx` - Inject service via hook
- `components/NotificationDetailPanel.tsx` - Inject service via hook
- `components/NotificationPreferencesPanel.tsx` - Inject service via hook

#### 2. User Management Module
**Current**: Uses userService, rbacService from serviceFactory  
**Action**:
- [ ] Add `services: ['userService', 'rbacService']` to module definition
- [ ] Update `initialize()` to register both services
- [ ] Update all .tsx files to use `useService()` instead of direct import

**Files to Update**:
- `index.ts` - Add service registration
- `views/UsersPage.tsx` - Inject services via hooks
- `views/UserManagementPage.tsx` - Inject services via hooks
- `views/RoleManagementPage.tsx` - Inject services via hooks
- `views/PermissionMatrixPage.tsx` - Inject services via hooks
- `components/UserFormPanel.tsx` - Inject services via hooks
- `components/UserDetailPanel.tsx` - Inject services via hooks

#### 3. Super Admin Module
**Current**: Empty services, needs to define required services  
**Action**:
- [ ] Identify all services used in views
- [ ] Add to `services: [...]` array
- [ ] Implement `initialize()` with service registration
- [ ] Update all views to use `useService()`

**Files to Update**:
- `index.ts` - Add service registration
- `views/*.tsx` - All 8 view pages need service injection review
- `components/*.tsx` - Review components for service usage

#### 4. Configuration Module
**Current**: Empty services  
**Action**:
- [ ] Check if any services needed
- [ ] If none, `services: []` is acceptable
- [ ] If yes, add and register

#### 5. PDF Templates Module
**Current**: Empty services  
**Action**:
- [ ] Check if pdfTemplateService or similar needed
- [ ] Add if present, register in initialize()

#### 6. Complaints Module
**Current**: Empty services  
**Action**:
- [ ] Check if complaintService exists
- [ ] Add and register if needed

#### 7. Audit Logs Module
**Current**: Empty services  
**Action**:
- [ ] Check if auditService or logsService needed
- [ ] Add and register if present

#### 8. Auth Module
**Status**: Special case - authentication is handled at core level  
**Action**: Leave as is (services: [])

---

## Implementation Order

**Priority 1 (High Impact)**:
1. Notifications (commonly used)
2. User Management (critical functionality)
3. Super Admin (system critical)

**Priority 2 (Medium)**:
4. Configuration
5. PDF Templates

**Priority 3 (Low)**:
6. Complaints
7. Audit Logs

---

## Code Review Template

When reviewing module standardization PRs:

```markdown
## Module Standardization Review

### Checklist
- [ ] Services array properly populated
- [ ] initialize() registers all services using serviceFactory
- [ ] cleanup() unregisters all services
- [ ] All components use useService() hook
- [ ] No direct @/services imports found
- [ ] Proper TypeScript typing on useService calls
- [ ] Console logs for debugging
- [ ] Error handling present

### Files Checked
- [ ] Module definition (index.ts)
- [ ] All views in /views/**/*.tsx
- [ ] All components in /components/**/*.tsx
- [ ] All hooks in /hooks/**/*.ts

### Test Verification
- [ ] Module initializes without errors
- [ ] Services accessible via useService
- [ ] No console errors related to services
- [ ] Functionality unchanged from original
```

---

## ESLint Rules - MUST IMPLEMENT

### Rule 1: No Direct Service Imports in Components
**Pattern**: Enforce that `.tsx` files outside `/services/` directory cannot import from `@/services`

```json
{
  "rules": {
    "no-direct-service-imports": {
      "level": "error",
      "files": ["src/modules/features/**/*.tsx", "src/modules/features/**/*.ts"],
      "exceptions": ["src/modules/features/**/index.ts", "src/modules/features/**/hooks/*.ts"],
      "forbiddenImports": ["@/services", "@/services/api/supabase"]
    }
  }
}
```

### Rule 2: Service Registration Required
**Pattern**: Modules must register services in initialize()

```json
{
  "rules": {
    "service-registration-required": {
      "level": "warn",
      "files": ["src/modules/features/*/index.ts"],
      "checkPattern": "if (services.length > 0) then initialize() must call registerService()"
    }
  }
}
```

---

## Migration Workflow for Existing Modules

### Phase 1: Audit (10 min per module)
1. Open module's index.ts
2. List all services in `services: [...]`
3. Search for service imports in all .tsx files
4. Document findings

### Phase 2: Update Module Definition (5 min)
1. Add/verify `services: [...]` array
2. Ensure `path` property present
3. Save and verify syntax

### Phase 3: Update initialize() (10 min)
1. Copy template from ruleset
2. Add serviceFactory imports
3. Add registerService() calls
4. Add console logging
5. Test in browser

### Phase 4: Update Components (15-30 min)
1. For each .tsx file:
   - Remove direct service imports
   - Add useService hook import
   - Inject services in component/page
   - Add proper TypeScript types
   - Verify functionality

### Phase 5: Test & Verify (10 min)
1. Start dev server
2. Check console for init logs
3. Test module functionality
4. Verify no service errors

### Total per Module: 40-60 minutes

---

## Success Criteria

All modules must satisfy:

1. ✅ 100% of services using useService() hook in components
2. ✅ 0% direct @/services imports in .tsx files (except index.ts)
3. ✅ All modules have services array
4. ✅ initialize() registers all services
5. ✅ cleanup() unregisters all services
6. ✅ Proper TypeScript typing throughout
7. ✅ Console logs present for debugging
8. ✅ All functionality preserved

---

## Enforcement Mechanisms

### Pre-Commit Hook
Prevents commits with violations:
- Checks for direct @/services imports in wrong files
- Validates services array not empty if services used
- Requires initialize() if services registered

### ESLint Rules
Provides IDE warnings during development

### CI/CD Validation
Blocks PR merges with standardization violations

### Automated Audit
Weekly scan reports compliance status

---

## FAQ

**Q: What if my module doesn't use any services?**  
A: Set `services: []` and leave initialize/cleanup minimal.

**Q: Can I import services in custom hooks?**  
A: Only if hooks use `useService()` internally. Never direct imports.

**Q: How do I handle service errors?**  
A: Wrap useService calls in try/catch during data fetching operations.

**Q: What about type definitions?**  
A: Import types from service files, but never the service implementation directly.

**Q: Can I share services between modules?**  
A: Register them in both module's initialize(). Factory pattern handles switching implementations.

---

## Support

For questions or issues:
1. Review `MODULE_SERVICE_STANDARDIZATION_RULES.md`
2. Check Sales module as reference implementation
3. Verify serviceFactory exports service
4. Check ServiceContainer is initialized in core

---

**Last Updated**: 2025-01-29  
**Status**: READY FOR IMPLEMENTATION
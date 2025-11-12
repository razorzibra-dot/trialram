# Module Code Review Checklist
**Version:** 1.0  
**Created:** 2025-11-10  
**Last Updated:** 2025-11-10  
**Status:** Active Code Review Standard

---

## 📋 Quick Reference

Use this checklist during code reviews for any module changes, new modules, or refactoring work.

**Review Phases:**
1. **Pre-Submission** - Developer performs before creating PR
2. **PR Review** - Reviewer checks before approval
3. **Post-Merge** - QA team verifies in staging

---

## ✅ PHASE 1: MODULE STRUCTURE & ORGANIZATION

### 1.1 Directory Structure
- [ ] Module located in `src/modules/features/[module-name]/`
- [ ] No nested module subdirectories (flat structure)
- [ ] Standard subdirectories present:
  - [ ] `views/` - Page components
  - [ ] `components/` - Reusable UI components
  - [ ] `hooks/` - Custom React hooks
  - [ ] `services/` - Business logic and API calls
  - [ ] `types/` - TypeScript interfaces
  - [ ] `store/` - State management (if needed)
  - [ ] `utils/` - Helper functions
- [ ] `__tests__/` folder for unit tests (collocated with source)
- [ ] Documentation files at module root:
  - [ ] `DOC.md` - Module documentation
  - [ ] Other guides if applicable

### 1.2 Module File
- [ ] `index.ts` exports public API only
- [ ] `index.ts` does NOT have business logic
- [ ] `routes.tsx` defines all routes for module
- [ ] Routes use lazy loading with React.lazy()
- [ ] Routes wrapped with ErrorBoundary + Suspense
- [ ] Module exports service instances (not constructors)

### 1.3 Module Registration
- [ ] Module follows FeatureModule interface
- [ ] Module has `initialize()` method
- [ ] Module has `cleanup()` method
- [ ] Services registered via ServiceContainer
- [ ] Dependencies declared in module config
- [ ] Module registered in core/modules.ts or equivalent

---

## ✅ PHASE 2: ARCHITECTURE PATTERN COMPLIANCE

### 2.1 Standard Pattern (FormPanel + ListPage)
**For Data-Entry Modules (CRUD):**
- [ ] ListPage exists as main entry point
- [ ] ListPage displays data in table/list format
- [ ] FormPanel exists for Create/Edit operations
- [ ] FormPanel implemented as drawer (not full page)
- [ ] DetailPanel exists for read-only detail view (optional but recommended)
- [ ] DetailPanel implemented as drawer (not full page)

**For Read-Only Modules (Display):**
- [ ] Single display page sufficient (no FormPanel needed)
- [ ] Clear documentation stating "read-only" purpose
- [ ] No create/edit/delete operations available

### 2.2 Routes Structure - ✅ MUST FOLLOW
**Data-Entry Module Routes:**
```
✅ GOOD:
/tenant/[module]           → List page
/tenant/[module]/:id       → Detail (optional)
[FormPanel drawer in ListPage for create/edit]

❌ BAD (Legacy - NOT ALLOWED):
/tenant/[module]/new       → Create page (FORBIDDEN)
/tenant/[module]/:id/edit  → Edit page (FORBIDDEN)
/tenant/[module]/create    → Create page (FORBIDDEN)
```

**Check in code review:**
- [ ] No `/new` route exists
- [ ] No `/:id/edit` route exists
- [ ] No `/create` route exists
- [ ] Only list and optional detail routes present
- [ ] Routes use `element: <Component />` (not `component: Component`)

### 2.3 Component Patterns
**ListPage Pattern:**
- [ ] Displays all data in table/grid
- [ ] Has "Create" button → opens FormPanel
- [ ] Has "Edit" button for each row → opens FormPanel with data
- [ ] Has "Delete" button/action → handles deletion
- [ ] Has search/filter functionality
- [ ] Has pagination (if applicable)
- [ ] Uses custom hooks for data fetching

**FormPanel Pattern:**
- [ ] Drawer component (not full-page form)
- [ ] Single component handles create AND edit modes
- [ ] Determines mode by checking if `isEdit` prop or data passed
- [ ] Submits via service hook (useXxxMutation)
- [ ] Handles validation before submit
- [ ] Shows success/error toast messages
- [ ] Closes drawer on successful submit
- [ ] Invalidates cache after submit (react-query)

**DetailPanel Pattern:**
- [ ] Read-only drawer component
- [ ] Displays full record details
- [ ] Opens from ListPage when clicking row/detail button
- [ ] No edit/delete actions (if separate from FormPanel)
- [ ] Linked to FormPanel via "Edit" button

---

## ✅ PHASE 3: 8-LAYER SYNCHRONIZATION RULE

**ALL 8 layers must stay synchronized. Check for mismatches:**

### Layer 1: DATABASE (snake_case)
- [ ] Database table columns use snake_case
- [ ] PK/FK constraints properly defined
- [ ] NOT NULL constraints on required fields
- [ ] Unique constraints where applicable
- [ ] Indexes on frequently queried columns

### Layer 2: TYPES (camelCase - match DB exactly)
- [ ] TypeScript interfaces in `types/` folder
- [ ] All DB columns represented in interface
- [ ] Interface names end with appropriate suffix:
  - `XxxDTO` - Data Transfer Object
  - `XxxRecord` - DB record
  - `XxxInput` - Create/Update input
  - `XxxResponse` - API response
- [ ] No extra fields not in DB

### Layer 3: MOCK SERVICE (same fields + validation)
- [ ] Mock data matches TypeScript interface
- [ ] All fields present in mock objects
- [ ] Validation rules same as DB
- [ ] Error cases handled (duplicate, not found, etc.)

### Layer 4: SUPABASE SERVICE (SELECT with mapping)
- [ ] Supabase service explicitly SELECTs all columns
- [ ] Maps snake_case → camelCase on fetch
- [ ] Error handling consistent
- [ ] Retry logic if needed
- [ ] Type-safe (returns interface type)

Example:
```typescript
const response = await supabase
  .from('users')
  .select('user_id, user_name, user_email') // explicit SELECT
  .single();

return {
  userId: response.user_id,      // snake_case → camelCase
  userName: response.user_name,
  userEmail: response.user_email,
};
```

### Layer 5: SERVICE FACTORY (routes to correct backend)
- [ ] Factory selects correct service (mock vs real)
- [ ] Conditional based on environment/config
- [ ] No business logic in factory
- [ ] Returns service instance (not constructor)

### Layer 6: MODULE SERVICE (uses factory, never direct imports)
- [ ] Imports service from factory
- [ ] Does NOT import Supabase directly
- [ ] Does NOT import mock service directly
- [ ] Routes through factory consistently

### Layer 7: HOOKS (loading/error/data states + cache invalidation)
- [ ] Custom hook for each service method
- [ ] Returns: `{ data, loading, error }`
- [ ] Implements react-query caching
- [ ] Cache invalidation on mutations
- [ ] Proper error handling with user messages
- [ ] Loading states for UI feedback

Example:
```typescript
export const useUsers = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });

  const createUserMutation = useMutation({
    mutationFn: (user) => userService.createUser(user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return { data, isLoading, error, createUserMutation };
};
```

### Layer 8: UI (form fields = DB columns + tooltips)
- [ ] Every form field corresponds to DB column
- [ ] Field names match interface property names
- [ ] Form validation matches DB constraints
- [ ] Required fields clearly marked
- [ ] Tooltips/help text for complex fields
- [ ] Error messages specific and helpful

**Verification Checklist (Before Approval):**
```typescript
// 1. Check DB schema
SELECT * FROM information_schema.columns WHERE table_name = 'xxx';

// 2. Check TypeScript interface (should have same fields)
interface XxxDTO {
  // field names should match DB columns (in camelCase)
}

// 3. Check mock data (should have same fields)
const mockXxx = { /* all fields */ }

// 4. Check Supabase service (explicit SELECT)
.select('col1, col2, col3') // should match DB

// 5. Check module service (uses factory)
import { xxxService } from '@/services/serviceFactory';

// 6. Check hooks (has loading/error/data)
const { data, loading, error } = useXxx();

// 7. Check UI form (fields match interface)
<input name="fieldName" /> // matches interface
```

---

## ✅ PHASE 4: TYPE SAFETY

### 4.1 TypeScript Configuration
- [ ] `strict: true` in tsconfig.json
- [ ] No `any` type used (exceptions documented)
- [ ] All props typed (interface or generic)
- [ ] Return types specified for functions
- [ ] Enums used for fixed value sets

### 4.2 Component Types
- [ ] Props interface defined for each component
- [ ] Props interface exported from component file
- [ ] Event handlers typed: `React.ChangeEvent<HTMLInputElement>`
- [ ] Refs typed: `useRef<HTMLInputElement>(null)`
- [ ] State has explicit type: `useState<Type>(initialValue)`

### 4.3 API Response Types
- [ ] API responses have TypeScript types
- [ ] Success and error responses typed
- [ ] Unknown data is NOT used directly (check zod/validation)
- [ ] Type guards used where type is uncertain

---

## ✅ PHASE 5: SERVICE & HOOK ARCHITECTURE

### 5.1 Service Layer
- [ ] Service methods are async (return Promise)
- [ ] Services use dependency injection
- [ ] Services have single responsibility
- [ ] No React hooks in services
- [ ] Error handling with specific error types
- [ ] Logging for debugging (use console but clean up for production)

### 5.2 Hook Layer
- [ ] One hook per service method (pattern: `useXxx()`)
- [ ] Hooks use react-query (useQuery, useMutation)
- [ ] Cache keys are consistent and unique
- [ ] Error states handled gracefully
- [ ] Loading states prevent race conditions
- [ ] Stale data handled appropriately

### 5.3 Dependency Injection
- [ ] Services passed to module via ServiceContainer
- [ ] No direct imports from Supabase in components
- [ ] All data access via hooks (useXxx)
- [ ] Hooks use injected services from ServiceContainer

---

## ✅ PHASE 6: STATE MANAGEMENT

### 6.1 For Simple Modules
- [ ] React Query handles server state
- [ ] Local component state for UI (checked, expanded, etc.)
- [ ] No Zustand/Redux needed

### 6.2 For Complex Modules
- [ ] Zustand store for shared state if needed
- [ ] Store file: `store/[module]Store.ts`
- [ ] Store typed with TypeScript
- [ ] Actions documented
- [ ] Subscriptions cleaned up in useEffect

### 6.3 Cache Management
- [ ] React Query cache invalidation on mutations
- [ ] Cache keys follow pattern: `['entity', id, 'related']`
- [ ] Stale time configured appropriately
- [ ] Garbage collection time reasonable

---

## ✅ PHASE 7: DATA FLOW & IMMUTABILITY

### 7.1 Data Flow
- [ ] Unidirectional data flow (top → down)
- [ ] State updates don't mutate original object
- [ ] Array updates use spread operator or immutable methods
- [ ] Object updates use spread operator

### 7.2 Form Data Handling
- [ ] Form state NOT directly bound to API response
- [ ] Form state normalized before sending to API
- [ ] Form validation separate from API validation
- [ ] Optimistic updates for better UX

---

## ✅ PHASE 8: ERROR HANDLING & VALIDATION

### 8.1 Error Handling
- [ ] Try-catch blocks in service methods
- [ ] Custom error types for different error scenarios
- [ ] Error messages user-friendly (not technical)
- [ ] Errors logged for debugging
- [ ] UI shows error toast with action (retry/dismiss)

### 8.2 Input Validation
- [ ] Form validation before submit (client-side)
- [ ] Server-side validation in mock/Supabase service
- [ ] Validation results returned with errors
- [ ] Form displays specific error per field
- [ ] Validation rules consistent with DB constraints

### 8.3 Error Boundaries
- [ ] Error boundaries wrap page components
- [ ] Fallback UI displays when error occurs
- [ ] Error logged for monitoring
- [ ] User option to retry or go back

---

## ✅ PHASE 9: TESTING REQUIREMENTS

### 9.1 Unit Tests
- [ ] Service methods tested with mock data
- [ ] Hooks tested with react-query mocks
- [ ] Components tested with rendering checks
- [ ] User interactions tested (click, type, submit)
- [ ] Error cases tested

### 9.2 Integration Tests
- [ ] Module-level integration tests
- [ ] Service → Hook → Component flow tested
- [ ] Mock service used (not real Supabase)
- [ ] Cache invalidation tested

### 9.3 Test Coverage
- [ ] Minimum 70% coverage for module
- [ ] Critical paths 100% coverage
- [ ] Edge cases covered
- [ ] Error scenarios tested

### 9.4 Test Files
- [ ] Collocated with source: `Component.test.tsx` next to `Component.tsx`
- [ ] Named consistently: `*.test.tsx` or `*.spec.tsx`
- [ ] Test folder: `__tests__/` for standalone test files
- [ ] Mocks in `__mocks__/` folder or in test files

---

## ✅ PHASE 10: DOCUMENTATION

### 10.1 Code Documentation
- [ ] JSDoc comments for exported functions/components
- [ ] Complex logic has inline comments (reason, not what)
- [ ] README.md at module root (if complex module)
- [ ] DOC.md with module overview:
  - Overview
  - Architecture diagram
  - Key components
  - Data flow
  - How to extend

### 10.2 API Documentation
- [ ] Service methods documented with:
  - Purpose
  - Parameters
  - Return type
  - Error cases
  - Example usage

### 10.3 Type Documentation
- [ ] Interface properties documented
- [ ] Enums documented with explanations
- [ ] Complex types have examples

---

## ✅ PHASE 11: PERFORMANCE

### 11.1 Component Performance
- [ ] Components memoized if re-render expensive (React.memo)
- [ ] Callbacks memoized (useCallback)
- [ ] Selectors memoized (useMemo)
- [ ] No inline functions in render
- [ ] No inline objects in render

### 11.2 Data Fetching Performance
- [ ] Queries not fetched on every render
- [ ] Pagination implemented for large datasets
- [ ] Filters reduce data size before fetch
- [ ] Images lazy-loaded or optimized
- [ ] React Query devtools shows appropriate cache hits

### 11.3 Bundle Size
- [ ] Components lazy-loaded in routes
- [ ] No large libraries imported at top-level
- [ ] Tree-shaking works (ES6 imports)
- [ ] Bundle size measured

---

## ✅ PHASE 12: ACCESSIBILITY (A11Y)

### 12.1 Semantic HTML
- [ ] `<button>` for buttons (not `<div>`)
- [ ] `<a>` for links (not `<div>`)
- [ ] Form inputs have `<label>` elements
- [ ] Headings use `<h1>`, `<h2>`, etc.
- [ ] Lists use `<ul>`, `<ol>`, `<li>`

### 12.2 ARIA
- [ ] Form errors announced with `role="alert"`
- [ ] Modal dialogs have `role="dialog"` with `aria-modal="true"`
- [ ] Icons have `aria-label` if conveying meaning
- [ ] Tables have `<caption>` if needed
- [ ] Skip link for keyboard navigation

### 12.3 Keyboard Navigation
- [ ] All interactive elements keyboard accessible
- [ ] Tab order logical
- [ ] Modals trap focus
- [ ] No keyboard traps
- [ ] Focus visible (not hidden)

### 12.4 Color Contrast
- [ ] Text contrast ratio ≥ 4.5:1
- [ ] Large text contrast ratio ≥ 3:1
- [ ] Color not only way to convey info

---

## ✅ PHASE 13: SECURITY

### 13.1 Data Protection
- [ ] No secrets in code (API keys, passwords)
- [ ] No sensitive data logged
- [ ] Environment variables for configuration
- [ ] Supabase Row Level Security (RLS) enforced
- [ ] Authentication tokens secured

### 13.2 Input Sanitization
- [ ] User input validated before use
- [ ] XSS prevention (React automatically escapes by default)
- [ ] SQL injection prevention (use parameterized queries)
- [ ] CSRF tokens if applicable

### 13.3 Authorization
- [ ] Routes check user permissions
- [ ] Sensitive actions require confirmation
- [ ] API calls authorized (tokens included)
- [ ] Resource ownership verified server-side

---

## ✅ PHASE 14: CODE QUALITY

### 14.1 Linting
- [ ] No ESLint errors
- [ ] No ESLint warnings (or documented exceptions)
- [ ] Formatting consistent (Prettier)
- [ ] No unused variables
- [ ] No unused imports

### 14.2 Code Organization
- [ ] Related functions grouped together
- [ ] Alphabetical exports in index.ts
- [ ] No circular imports
- [ ] File size reasonable (<300 lines for views)
- [ ] Single responsibility principle followed

### 14.3 Code Duplication
- [ ] No copy-paste code (DRY principle)
- [ ] Utility functions extracted
- [ ] Components not duplicated
- [ ] Hooks not duplicated

### 14.4 Naming Conventions
- [ ] Components PascalCase: `UserFormPanel`
- [ ] Functions camelCase: `getUserById`
- [ ] Constants SCREAMING_SNAKE_CASE: `MAX_USERS`
- [ ] Files match export name: `UserFormPanel.tsx`
- [ ] Folders kebab-case: `user-management`

---

## ✅ PHASE 15: ANTI-PATTERNS TO AVOID

### ❌ FORBIDDEN - Full-Page Create/Edit Routes
```typescript
// ❌ DO NOT DO THIS
❌ { path: 'new', element: <CreatePage /> }
❌ { path: ':id/edit', element: <EditPage /> }
❌ { path: 'create', element: <CreatePage /> }

// ✅ DO THIS INSTEAD
✅ FormPanel drawer in ListPage
```

### ❌ FORBIDDEN - Direct Service Imports
```typescript
// ❌ DO NOT DO THIS
import { userService } from '@/modules/features/users/services/userService';

// ✅ DO THIS INSTEAD
import { useUsers } from '@/modules/features/users/hooks/useUsers';
```

### ❌ FORBIDDEN - Direct Supabase Imports in Components
```typescript
// ❌ DO NOT DO THIS
import { supabase } from '@/modules/core/supabase';
const { data } = await supabase.from('users').select('*');

// ✅ DO THIS INSTEAD
const { data } = useUsers(); // via hook
```

### ❌ FORBIDDEN - Inline API Calls in Components
```typescript
// ❌ DO NOT DO THIS
const [users, setUsers] = useState([]);
useEffect(() => {
  fetch('/api/users').then(r => r.json()).then(setUsers);
}, []);

// ✅ DO THIS INSTEAD
const { data: users } = useUsers();
```

### ❌ FORBIDDEN - Mutation Without Cache Invalidation
```typescript
// ❌ DO NOT DO THIS
const createUser = async (user) => {
  await userService.createUser(user);
  // Missing: queryClient.invalidateQueries({ queryKey: ['users'] })
};

// ✅ DO THIS INSTEAD
const createUserMutation = useMutation({
  mutationFn: (user) => userService.createUser(user),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

### ❌ FORBIDDEN - Magic Strings for Cache Keys
```typescript
// ❌ DO NOT DO THIS
useQuery({
  queryKey: ['asdf123'], // What is this?
  queryFn: () => userService.getUsers(),
});

// ✅ DO THIS INSTEAD
const USER_QUERY_KEY = ['users'] as const;
useQuery({
  queryKey: USER_QUERY_KEY,
  queryFn: () => userService.getUsers(),
});
```

### ❌ FORBIDDEN - Prop Drilling
```typescript
// ❌ DO NOT DO THIS
<ParentComponent user={user}>
  <ChildComponent user={user}>
    <GrandchildComponent user={user} />  // Too many levels
  </ChildComponent>
</ParentComponent>

// ✅ DO THIS INSTEAD
<UserContext.Provider value={user}>
  <ParentComponent>
    <ChildComponent>
      <GrandchildComponent /> {/* Uses context */}
    </ChildComponent>
  </ParentComponent>
</UserContext.Provider>
```

### ❌ FORBIDDEN - Inline Objects/Arrays as Props
```typescript
// ❌ DO NOT DO THIS
<Component options={{ id: 1, name: 'Test' }} /> // Creates new object on every render

// ✅ DO THIS INSTEAD
const options = useMemo(() => ({ id: 1, name: 'Test' }), []);
<Component options={options} />
```

### ❌ FORBIDDEN - Large Components (>300 lines)
```typescript
// ❌ DO NOT DO THIS
// UserPage.tsx is 500 lines
function UserPage() {
  // All logic here...
}

// ✅ DO THIS INSTEAD
// Extract into smaller components
export function UserPage() {
  return (
    <>
      <UserFilter />
      <UserTable />
      <UserFormPanel />
    </>
  );
}
```

---

## ✅ PHASE 16: COMMON MISTAKES IN CODE REVIEW

### 16.1 Review Checklist
- [ ] Is there a type mismatch between layers?
- [ ] Are there create/edit routes (should be forbidden)?
- [ ] Is data fetched correctly (using hooks)?
- [ ] Are services used via factory only?
- [ ] Is cache invalidated after mutations?
- [ ] Are components properly memoized?
- [ ] Is error handling present?
- [ ] Are loading states shown?
- [ ] Is accessibility considered?
- [ ] Is security reviewed?

### 16.2 Common Issues Found in PRs
- [ ] ✓ Forgot to invalidate cache after mutation
- [ ] ✓ Used direct service import instead of hook
- [ ] ✓ Created full-page form instead of drawer
- [ ] ✓ Forgot type definition for props
- [ ] ✓ Missing error handling in async function
- [ ] ✓ No loading state during fetch
- [ ] ✓ Component too large (>300 lines)
- [ ] ✓ Prop drilling instead of context
- [ ] ✓ Inline functions in render
- [ ] ✓ Missing JSDoc comments

---

## ✅ FINAL CHECKLIST - Before Merge

**Developer Checklist (Before Creating PR):**
```
[ ] All unit tests pass (npm run test)
[ ] Linting passes (npm run lint)
[ ] TypeScript compiles (npm run typecheck)
[ ] Build succeeds (npm run build)
[ ] No console errors/warnings
[ ] No dead code
[ ] Documentation updated
[ ] 8-layer sync verified
[ ] No forbidden patterns used
[ ] Code formatted (npm run format)
```

**Reviewer Checklist (Before Approving):**
```
[ ] Architecture pattern followed
[ ] All 8 layers synchronized
[ ] Type safety verified
[ ] No forbidden patterns
[ ] Tests adequate coverage
[ ] Documentation clear
[ ] Performance considered
[ ] Accessibility checked
[ ] Security reviewed
[ ] Code quality acceptable
```

**QA Checklist (Post-Merge, in Staging):**
```
[ ] Module loads without errors
[ ] CRUD operations work correctly
[ ] Data displays properly
[ ] Forms validate correctly
[ ] Error handling works
[ ] Search/filter works
[ ] Pagination works (if applicable)
[ ] No console errors/warnings
[ ] Responsive design works
[ ] Cross-browser compatibility verified
```

---

## 📚 Reference Guides

- **MODULE_ARCHITECTURE_QUICK_REFERENCE.md** - Pattern examples
- **MODULE_CLEANUP_AND_STANDARDIZATION_GUIDE.md** - Architecture strategy
- **Existing Modules as Examples:**
  - `customers/` - Standard CRUD module
  - `sales/` - Complex data-entry module
  - `super-admin/` - Admin/monitoring module
  - `masters/` - Reference data module

---

## 🔄 Review Process

### Step 1: Pre-Review (Developer)
1. Run all checks locally
2. Self-review code
3. Verify checklist items
4. Create PR with description

### Step 2: PR Review (Tech Lead/Senior Dev)
1. Check architectural compliance
2. Verify 8-layer sync
3. Review for forbidden patterns
4. Check test coverage
5. Approve or request changes

### Step 3: Post-Review (QA)
1. Merge to main
2. Deploy to staging
3. Test functionality
4. Verify no regressions
5. Mark as ready for production

---

## 📞 Questions During Review?

**"Why this pattern?"**
→ See MODULE_ARCHITECTURE_QUICK_REFERENCE.md (Pattern section)

**"What are the 8 layers?"**
→ See Phase 3 in this document

**"Is this a forbidden pattern?"**
→ See Phase 15 (Anti-patterns)

**"How should I test this?"**
→ See Phase 9 (Testing)

**"What does the code style guide say?"**
→ See Phase 14 (Code Quality)

---

**Version History:**
- v1.0 (2025-11-10) - Initial creation based on module cleanup standards

**Last Reviewed:** 2025-11-10  
**Next Review:** 2025-12-10  
**Status:** ✅ Active and Ready for Use

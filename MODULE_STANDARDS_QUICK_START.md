# Module Standards - Quick Start Guide
**Last Updated:** 2025-11-10  
**Status:** ✅ Active  
**Version:** 1.0

---

## ⚡ 60-Second Summary

All application modules now follow **ONE standard architecture pattern**:

```
✅ STANDARD PATTERN: FormPanel + ListPage (for data-entry modules)

Routes:
/tenant/[module]         → ListPage (show all records)
/tenant/[module]/:id     → DetailPanel (optional, read-only)

Components:
- ListPage: Displays data, has Create/Edit/Delete buttons
- FormPanel: Drawer for create/edit (one component, both modes)
- DetailPanel: Drawer for read-only details (optional)

No more full-page create/edit routes!
```

---

## 🎯 I'm A Developer - What Do I Need to Know?

### Before Starting Work on Any Module
1. **Read:** MODULE_ARCHITECTURE_QUICK_REFERENCE.md (5 min)
2. **Know:** The pattern above (FormPanel + ListPage)
3. **Remember:** No full-page create/edit routes (use drawers instead)

### Creating a New Module
1. **Follow:** Structure of `/src/modules/features/customers/` or `/masters/`
2. **Copy:** Directory structure: views/, components/, hooks/, services/, types/
3. **Use:** FormPanel + ListPage pattern
4. **Add:** Tests in __tests__/ folder
5. **Create:** DOC.md at module root
6. **Reference:** See examples in Sales or Masters modules

### Modifying Existing Module
1. **Check:** MODULE_CODE_REVIEW_CHECKLIST.md (before creating PR)
2. **Verify:** You're not creating full-page create/edit (forbidden!)
3. **Test:** All CRUD operations work
4. **Document:** Update DOC.md if architecture changed

### Before Submitting PR
```
Code Review Checklist (5 min check):
☐ npm run lint     → 0 errors?
☐ npm run typecheck → 0 errors?
☐ npm run build    → Succeeds?
☐ npm run test     → All pass?
☐ No forbidden patterns (see below)
☐ Documentation updated
☐ 8-layer sync verified (if touched DB/types/UI)
```

---

## ❌ FORBIDDEN PATTERNS (Don't Do These!)

### ❌ Full-Page Create/Edit Routes
```typescript
// ❌ FORBIDDEN
{ path: 'new', element: <CreatePage /> }
{ path: ':id/edit', element: <EditPage /> }
{ path: 'create', element: <CreatePage /> }

// ✅ DO THIS INSTEAD
// FormPanel drawer in ListPage for create/edit
```

### ❌ Direct Service Imports in Components
```typescript
// ❌ FORBIDDEN
import { userService } from '@/modules/features/users/services/userService';

// ✅ DO THIS INSTEAD
import { useUsers } from '@/modules/features/users/hooks/useUsers';
```

### ❌ Direct Supabase Imports in Views
```typescript
// ❌ FORBIDDEN
import { supabase } from '@/modules/core/supabase';
const { data } = await supabase.from('users').select('*');

// ✅ DO THIS INSTEAD
const { data } = useUsers();
```

### ❌ Forget Cache Invalidation
```typescript
// ❌ FORBIDDEN
const createUser = async (user) => {
  await userService.createUser(user);
  // Missing: queryClient.invalidateQueries
};

// ✅ DO THIS INSTEAD
const createUserMutation = useMutation({
  mutationFn: (user) => userService.createUser(user),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

---

## ✅ THE 8-LAYER RULE (Most Important!)

Every feature must keep **8 layers synchronized**:

```
1. DATABASE    (columns: snake_case)
2. TYPES       (interface: camelCase, match DB exactly)
3. MOCK        (test data: same fields as DB)
4. SUPABASE    (select explicit columns, snake→camel mapping)
5. FACTORY     (routes to mock or real service)
6. SERVICE     (uses factory, never direct imports)
7. HOOKS       (useXxx returns {data, loading, error})
8. UI          (form fields match interface properties)

All 8 must match or you'll have bugs!
```

**Quick Check:**
```typescript
// 1. DB column: user_name (in database)
// 2. Interface: userName (in types)
// 3. Mock: { userName: "John" }
// 4. Supabase: .select('user_id, user_name').then(r => ({ userId: r.user_id, userName: r.user_name }))
// 5. Factory: returns userService
// 6. Service: uses factory (not direct supabase)
// 7. Hook: const { data } = useUsers() 
// 8. UI: <input name="userName" />
```

---

## 📚 Documentation by Role

### For Developers
- **Quick Pattern Ref:** MODULE_ARCHITECTURE_QUICK_REFERENCE.md
- **Code Review Guide:** MODULE_CODE_REVIEW_CHECKLIST.md
- **Create New Module:** See CLEANUP_EXECUTION_SUMMARY.md (Getting Started section)
- **Stuck?** See troubleshooting in MODULE_ARCHITECTURE_QUICK_REFERENCE.md

### For Code Reviewers
- **Review Process:** MODULE_CODE_REVIEW_CHECKLIST.md (all 16 phases)
- **Architecture Standards:** MODULE_CLEANUP_AND_STANDARDIZATION_GUIDE.md
- **Anti-Patterns:** MODULE_CODE_REVIEW_CHECKLIST.md (Phase 15)
- **Quick Audit:** MODULE_ARCHITECTURE_QUICK_REFERENCE.md (30-sec checklist)

### For Architects
- **Strategy & Vision:** MODULE_CLEANUP_AND_STANDARDIZATION_GUIDE.md
- **Complete Report:** MODULE_STANDARDIZATION_COMPLETE_REPORT.md
- **Pattern Examples:** MODULE_ARCHITECTURE_QUICK_REFERENCE.md
- **Implementation Plan:** MODULE_CLEANUP_DETAILED_CHECKLIST.md

### For Managers/PMs
- **Overview:** CLEANUP_EXECUTION_SUMMARY.md
- **Status Dashboard:** MODULE_CLEANUP_COMPLETION_INDEX.md
- **Final Report:** MODULE_STANDARDIZATION_COMPLETE_REPORT.md

### For QA
- **Test Checklist:** See "Testing" in MODULE_CODE_REVIEW_CHECKLIST.md
- **Module Status:** MODULE_CLEANUP_COMPLETION_INDEX.md
- **Architecture Patterns:** MODULE_ARCHITECTURE_QUICK_REFERENCE.md

---

## 🚀 Common Tasks

### Task: Create New Data-Entry Module
```
1. Create: /src/modules/features/[module-name]/
2. Add folders: views/, components/, hooks/, services/, types/
3. Create: MyPage.tsx in views/
4. Create: MyFormPanel.tsx in components/ (drawer)
5. Create: MyDetailPanel.tsx in components/ (drawer, optional)
6. Create: useMyData() hook
7. Create: myService with factory routing
8. Create: routes.tsx with list + optional detail
9. Create: DOC.md documentation
10. Add: tests in __tests__/
11. Register: module in core/modules.ts
12. Test: all CRUD operations
13. Review: using MODULE_CODE_REVIEW_CHECKLIST.md
```

### Task: Add Field to Existing Module
```
1. Update: Database column (snake_case)
2. Update: TypeScript interface (add camelCase property)
3. Update: Mock service (add field to test data)
4. Update: Supabase service (include in SELECT + mapping)
5. Update: Form component (add input for field)
6. Update: Type interface to include field
7. Test: form field appears and saves correctly
8. Verify: all 8 layers synchronized
```

### Task: Fix Bug in Module
```
1. Read: Module's DOC.md to understand structure
2. Check: MODULE_ARCHITECTURE_QUICK_REFERENCE.md for pattern
3. Debug: Using 8-layer sync rule to find where mismatch is
4. Fix: Update the layer with mismatch
5. Test: Verify fix works
6. Check: npm run lint, typecheck, build, test pass
7. Create: PR with description of fix
8. Review: using MODULE_CODE_REVIEW_CHECKLIST.md
```

---

## 🎓 Pattern Comparison

### ✅ GOOD: FormPanel + ListPage (Standard)
```typescript
// MyPage.tsx (ListPage)
export function MyListPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data } = useMyData();

  const handleCreate = () => {
    setSelectedId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (id) => {
    setSelectedId(id);
    setIsFormOpen(true);
  };

  return (
    <>
      <button onClick={handleCreate}>Create</button>
      <table>
        {data.map(item => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>
              <button onClick={() => handleEdit(item.id)}>Edit</button>
              <button onClick={() => handleDelete(item.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </table>
      {isFormOpen && (
        <MyFormPanel
          itemId={selectedId}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </>
  );
}
```

### ❌ BAD: Full-Page Create (Legacy - Forbidden)
```typescript
// ❌ DO NOT DO THIS!
// /new route → CustomerCreatePage (full page)
// /edit/:id route → CustomerEditPage (full page)
// Creates page reloads, slower UX, harder to maintain
```

---

## 📊 Module Status Quick Reference

| Module | Type | FormPanel | Grade | Status |
|--------|------|-----------|-------|--------|
| customers | Data-Entry | ✅ | A+ | ✅ CLEAN |
| sales | Data-Entry | ✅ | A+ | ✅ OK |
| product-sales | Data-Entry | ✅ | A+ | ✅ OK |
| masters | Data-Entry | ✅ | A+ | ✅ OK |
| jobworks | Data-Entry | ✅ | A | ✅ CONSOL |
| contracts | Data-Entry | ✅ | A | ✅ OK |
| tickets | Data-Entry | ✅ | A | ✅ OK |
| complaints | Data-Entry | ✅ | A | ✅ CLEAN |
| service-contracts | Data-Entry | ✅ | A | ✅ OK |
| user-management | Data-Entry | ✅ | A+ | ✅ OK |
| super-admin | Admin | ⚠️ | A | ✅ OK |
| configuration | Config | ⚠️ | A | ✅ OK |
| auth | Read-Only | ❌ | A | ✅ OK |
| audit-logs | Read-Only | ❌ | A | ✅ OK |
| notifications | Read-Only | ❌ | A | ✅ OK |
| pdf-templates | Read-Only | ❌ | A | ✅ OK |

**Legend:** ✅ CLEAN = Recently cleaned | ✅ CONSOL = Consolidated | ✅ OK = Already correct | ⚠️ = Not applicable for this type

---

## 🔍 Debugging: Use the 8-Layer Sync Rule

**When something isn't working:**

```
1. Form field not saving?
   → Check Layer 8: UI (form field name matches interface)
   → Check Layer 2: Types (interface has property)
   → Check Layer 4: Supabase (column included in SELECT)

2. Data not loading?
   → Check Layer 7: Hooks (useXxx called correctly?)
   → Check Layer 6: Module Service (using factory?)
   → Check Layer 5: Factory (routing to correct service?)
   → Check Layer 4: Supabase (SELECT has all columns?)

3. Type mismatch error?
   → Check Layer 8: UI (form field type correct?)
   → Check Layer 2: Types (interface property typed correctly?)
   → Check Layer 4: Supabase (mapping correct snake→camel?)

4. Cache not updating?
   → Check Layer 7: Hooks (invalidateQueries called?)
   → Verify: queryClient.invalidateQueries({ queryKey: ['entity'] })
```

---

## 📋 Pre-PR Checklist (2 Minutes)

```
BEFORE creating pull request:

☐ Code Review
  ☐ No full-page create/edit routes
  ☐ No direct service imports in components
  ☐ No direct Supabase imports in views
  ☐ Cache invalidation present on mutations

☐ Layers Synchronized
  ☐ DB matches Types
  ☐ Types match Forms
  ☐ Forms match Hooks
  ☐ Services use factory

☐ Testing
  ☐ npm run lint → 0 errors
  ☐ npm run typecheck → 0 errors
  ☐ npm run build → succeeds
  ☐ npm run test → all pass
  ☐ Manual testing: CRUD works

☐ Documentation
  ☐ DOC.md updated
  ☐ Comments added for complex logic
  ☐ JSDoc on exports

☐ Optional but Good
  ☐ Performance optimized (memoization)
  ☐ Accessibility checked
  ☐ Error handling present
```

---

## 🎯 Reference Modules (Copy These Patterns!)

### For Standard Data-Entry Module
**See:** `src/modules/features/masters/`
- Clean FormPanel + ListPage pattern
- Multiple entities (companies, products)
- Proper component organization
- Good example to copy

### For Complex Data-Entry Module
**See:** `src/modules/features/sales/`
- More complex business logic
- Advanced form validation
- Integration with other modules
- Complete implementation

### For Admin Module
**See:** `src/modules/features/super-admin/`
- Multiple view pages (not CRUD)
- Role-based access control
- Admin-specific patterns
- Monitoring/reporting views

### For Read-Only Module
**See:** `src/modules/features/notifications/` or `audit-logs/`
- Display-only pages
- No create/edit operations
- Minimal structure
- Simple and clean

---

## 🚨 Emergency: Things Break After My Change

```
1. Build fails?
   → Run: npm run typecheck
   → Check for type mismatches
   → See: 8-layer sync rule above

2. Tests fail?
   → Run: npm run test
   → Check mock data matches interface
   → Verify: service methods return correct structure

3. Console errors?
   → Check browser console
   → Search for error in MODULE_ARCHITECTURE_QUICK_REFERENCE.md
   → Usually: wrong hook usage or missing dependency

4. Form fields not showing?
   → Check: Component is imported correctly
   → Check: Props passed correctly
   → Verify: Component has required fields

5. Data not saving?
   → Check: useMutation has onSuccess with cache invalidation
   → Verify: Service method is called correctly
   → Test: API endpoint returning data

Quick help: Read troubleshooting section in MODULE_ARCHITECTURE_QUICK_REFERENCE.md
```

---

## 📞 Finding Answers

| Question | Document | Section |
|----------|----------|---------|
| How do I create a new module? | CLEANUP_EXECUTION_SUMMARY.md | Getting Started |
| What's the standard pattern? | MODULE_ARCHITECTURE_QUICK_REFERENCE.md | Standard Pattern |
| How do I code review a PR? | MODULE_CODE_REVIEW_CHECKLIST.md | All sections |
| What patterns are forbidden? | MODULE_CODE_REVIEW_CHECKLIST.md | Phase 15 |
| What are the 8 layers? | MODULE_CODE_REVIEW_CHECKLIST.md | Phase 3 |
| How do I fix a type mismatch? | MODULE_ARCHITECTURE_QUICK_REFERENCE.md | 8-Layer Sync |
| Is my module compliant? | MODULE_ARCHITECTURE_QUICK_REFERENCE.md | 30-Sec Checklist |
| How do I test a module? | MODULE_CODE_REVIEW_CHECKLIST.md | Phase 9 |
| What's our architecture? | MODULE_CLEANUP_AND_STANDARDIZATION_GUIDE.md | Strategy |
| What modules are compliant? | MODULE_STANDARDIZATION_COMPLETE_REPORT.md | Module Summary |

---

## 🎓 Next Steps

### I'm New to the Project
1. Read this document (you're doing it! ✅)
2. Read: MODULE_ARCHITECTURE_QUICK_REFERENCE.md
3. Look at: `/src/modules/features/masters/` (good example)
4. Create a small feature to practice

### I'm Reviewing a PR
1. Use: MODULE_CODE_REVIEW_CHECKLIST.md (16 phases)
2. Check: Anti-patterns section
3. Verify: 8-layer synchronization
4. Approve if all checks pass

### I'm Creating a New Module
1. Copy: Structure of `masters/` module
2. Follow: Pattern templates in CLEANUP_EXECUTION_SUMMARY.md
3. Use: MODULE_CODE_REVIEW_CHECKLIST.md while developing
4. Test thoroughly before creating PR

### I Have Questions
1. Check this document first
2. Then check: MODULE_ARCHITECTURE_QUICK_REFERENCE.md
3. Then check: MODULE_CODE_REVIEW_CHECKLIST.md
4. Then ask colleague

---

## ✅ You're Ready!

You now understand:
- ✅ The standard module pattern (FormPanel + ListPage)
- ✅ Forbidden patterns (don't do these!)
- ✅ The 8-layer synchronization rule
- ✅ Where to find answers
- ✅ How to check if code is correct

**Next:** Pick a module to work on or read MODULE_ARCHITECTURE_QUICK_REFERENCE.md for more details.

---

**Document Version:** 1.0  
**Status:** ✅ Active  
**Last Updated:** 2025-11-10  
**Printable:** Yes (use for desk reference)

# 👥 TEAM ONBOARDING GUIDE - Architecture Standards

**Project**: PDS-CRM Application  
**Version**: 1.0 (February 2025)  
**Status**: ✅ Production Ready  
**Duration**: 1-2 hours for complete onboarding

---

## 🎯 Welcome to the Team!

This guide will help you understand the architecture standards and import patterns used in the PDS-CRM application. Follow the steps in sequence to get up to speed quickly.

**Your Goal**: Be able to write code that passes all ESLint rules and code review on Day 1.

---

## 📋 ONBOARDING CHECKLIST

**Time Estimate**: 1-2 hours

- [ ] **Phase 1** (5 min): Understanding the current state
- [ ] **Phase 2** (15 min): Read DEVELOPER_GUIDE_IMPORT_PATTERNS.md
- [ ] **Phase 3** (5 min): Review 3 key rules
- [ ] **Phase 4** (10 min): Run verification commands
- [ ] **Phase 5** (10 min): Review example files
- [ ] **Phase 6** (10 min): Practice: Fix 2 example violations
- [ ] **Phase 7** (5 min): Code review walkthrough with CODE_REVIEW_CHECKLIST_IMPORTS.md
- [ ] **Phase 8** (5 min): Setup pre-commit checklist
- [ ] **Phase 9** (Optional, 20 min): Deep-dive: Explore COMPLETION_REPORT_100PERCENT.md

**Total Time**: ~1-2 hours

---

## 🚀 PHASE 1: CURRENT STATE (5 min)

### What Just Happened?

The PDS-CRM codebase underwent a complete architecture standardization:

**Before** (January 2025):
- ❌ 4 circular dependencies
- ❌ 30 import violations
- ❌ 8 different ways to import services
- ❌ Types scattered across modules
- ❌ Build issues & type errors

**After** (February 2025):
- ✅ 0 circular dependencies
- ✅ 0 import violations
- ✅ 1 standard way to import services (factory pattern)
- ✅ Types centralized in `@/types/`
- ✅ Perfect builds & type safety

### Why This Matters

**For You as a Developer**:
- 🎯 Clear rules make code predictable
- 🎯 ESLint catches mistakes instantly
- 🎯 Code reviews are faster
- 🎯 Onboarding new people is easier
- 🎯 No more "import wars" or debates

**For the Project**:
- 🎯 Sustainable codebase
- 🎯 Easy to maintain at scale
- 🎯 New features integrated cleanly
- 🎯 Production-ready quality

---

## 📖 PHASE 2: READ THE GUIDE (15 min)

### 📚 Must-Read Documents

**Priority 1** (Read Today):
1. ✅ **DEVELOPER_GUIDE_IMPORT_PATTERNS.md** - 15 min read
   - Shows right way vs wrong way
   - Decision trees for your specific case
   - Common mistakes explained
   - Pre-commit checklist

**Priority 2** (Read Before First PR):
2. ✅ **CODE_REVIEW_CHECKLIST_IMPORTS.md** - 10 min read
   - What reviewers look for
   - 8-layer verification checklist
   - Red flags that block approval
   - Green lights for approval

**Priority 3** (Optional Deep-Dive):
3. ✅ **COMPLETION_REPORT_100PERCENT.md** - 20 min read
   - Full project history
   - Before/after metrics
   - Phase-by-phase breakdown
   - Why each decision was made

---

## 🎓 PHASE 3: KEY RULES (5 min)

### The 3 Golden Rules

**Rule 1: Service Factory Pattern** 🏭

❌ WRONG - Direct imports bypass factory:
```typescript
import { customerService } from '@/services/customerService';
await customerService.getCustomers();
```

✅ RIGHT - Use factory for abstraction:
```typescript
import { customerService as factoryCustomerService } from '@/services/serviceFactory';
await factoryCustomerService.getCustomers();
```

**Why**: Factory lets us switch between mock and Supabase modes seamlessly.

---

**Rule 2: Types from @/types/** 📦

❌ WRONG - Types scattered across code:
```typescript
import { User } from '@/modules/customers/types/user';
import { Product } from '@/modules/products/types/product';
```

✅ RIGHT - All types centralized:
```typescript
import { User, Product } from '@/types';
```

**Why**: One source of truth for types, easier to maintain, prevents circular dependencies.

---

**Rule 3: No Service-to-Module Imports** 🔒

❌ WRONG - Service imports from modules creates circles:
```typescript
// Inside src/services/customerService.ts
import { CustomerModule } from '@/modules/customers/CustomerModule';
```

✅ RIGHT - Services only import from @/types/:
```typescript
// Inside src/services/customerService.ts
import { Customer, CustomerStatus } from '@/types';
```

**Why**: Prevents circular dependencies, services stay reusable.

---

## 🔧 PHASE 4: VERIFY YOUR SETUP (10 min)

### Run These Commands

**1. Check TypeScript Compilation**:
```bash
npx tsc --noEmit
```
Expected: ✅ No errors

**2. Check ESLint (with new rules)**:
```bash
npm run lint
```
Expected: ✅ No errors (only pre-existing @typescript-eslint/no-explicit-any warnings allowed)

**3. Check Build**:
```bash
npm run build
```
Expected: ✅ Build succeeds in ~60 seconds

**4. Test Mock Mode**:
```bash
VITE_API_MODE=mock npm run dev
```
Expected: ✅ App runs, data loads

**5. Test Supabase Mode** (if you have .env.local):
```bash
VITE_API_MODE=supabase npm run dev
```
Expected: ✅ App runs with real data

---

## 📝 PHASE 5: REVIEW EXAMPLES (10 min)

### Example 1: Component Using Services

**RIGHT WAY** ✅:
```typescript
// src/components/customers/CustomerList.tsx
import React from 'react';
import { Customer } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { customerService as factoryCustomerService } from '@/services/serviceFactory';

export const CustomerList: React.FC = () => {
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => factoryCustomerService.getCustomers()
  });

  return (
    <div>
      {customers?.map((customer: Customer) => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
};
```

**What's Right Here**:
- ✅ Imports types from `@/types/`
- ✅ Imports service from `@/services/serviceFactory`
- ✅ Uses factory service in queryFn
- ✅ No circular dependencies possible

---

### Example 2: Module Service

**RIGHT WAY** ✅:
```typescript
// src/modules/features/customers/services/index.ts
import { customerService as factoryCustomerService } from '@/services/serviceFactory';
import { Customer, CustomerStatus } from '@/types';

export const useCustomerService = () => {
  const getActiveCustomers = async () => {
    const all = await factoryCustomerService.getCustomers();
    return all.filter((c: Customer) => c.status === CustomerStatus.ACTIVE);
  };

  return { getActiveCustomers };
};
```

**What's Right Here**:
- ✅ Imports service from factory
- ✅ Imports types from `@/types/`
- ✅ No direct module imports
- ✅ Can be used in components without circular deps

---

### Example 3: Hook (How NOT to do it)

**WRONG WAY** ❌:
```typescript
// This will cause ESLint errors!
import { customerService } from '@/services/customerService';
import { Customer } from '@/modules/customers/types';

export const useCustomers = () => {
  // ERROR: Should use factory!
  // ERROR: Type should be from @/types/!
  const [data, setData] = useState<Customer[]>([]);
};
```

**What's Wrong**:
- ❌ Direct import of service (bypasses factory)
- ❌ Type imported from module (should be @/types/)
- ❌ ESLint will block this on commit

---

## 🎯 PHASE 6: PRACTICE EXERCISES (10 min)

### Exercise 1: Fix This Component

```typescript
// BROKEN - Fix the imports
import React from 'react';
import { productService } from '@/services/productService';
import { Product } from '@/modules/products/types/product';

export const ProductList = () => {
  const [products, setProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    productService.getProducts().then(setProducts);
  }, []);

  return <div>{products.length} products</div>;
};
```

**Your Turn**: Fix this component. Check your answer below.

**SOLUTION**:
```typescript
// FIXED
import React from 'react';
import { productService as factoryProductService } from '@/services/serviceFactory';
import { Product } from '@/types';

export const ProductList = () => {
  const [products, setProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    factoryProductService.getProducts().then(setProducts);
  }, []);

  return <div>{products.length} products</div>;
};
```

**What Changed**:
- ✅ Service import now uses factory
- ✅ Service variable renamed to clarify it's from factory
- ✅ Type import from @/types/
- ✅ Service call uses correct variable name

---

### Exercise 2: Fix This Service File

```typescript
// BROKEN - Fix the imports
// src/services/orderService.ts
import { Order, OrderStatus } from '@/modules/orders/types';
import { customerModule } from '@/modules/customers/CustomerModule';

export const mockOrderService = {
  async getOrders() {
    // This will cause errors!
    const customers = await customerModule.getCustomers();
    return [];
  }
};
```

**Your Turn**: Fix this service. Check your answer below.

**SOLUTION**:
```typescript
// FIXED
// src/services/orderService.ts
import { Order, OrderStatus } from '@/types';

export const mockOrderService = {
  async getOrders() {
    // Services don't call modules - they are standalone
    // If you need related data, call another service via factory
    // This is handled by the calling code (hooks/components)
    return [];
  }
};
```

**What Changed**:
- ✅ Type imports from @/types/ only
- ✅ No module imports (no circular deps)
- ✅ Service is standalone
- ✅ Comments explain the pattern

---

## 📋 PHASE 7: CODE REVIEW GUIDE (5 min)

### What Reviewers Check

Before submitting a PR, check these 5 things:

**1. Service Imports** ✅
- [ ] All services imported from `@/services/serviceFactory`
- [ ] Aliased as `as factory<ServiceName>` for clarity
- [ ] No direct imports from `@/services/<serviceName>.ts`

**2. Type Imports** ✅
- [ ] All types imported from `@/types`
- [ ] No types imported from `@/modules/...`
- [ ] No scattered type definitions

**3. Files Structure** ✅
- [ ] No circular imports (run `npm run lint`)
- [ ] Service files only import from `@/types`
- [ ] Module files import services from factory

**4. ESLint Passes** ✅
- [ ] Run `npm run lint -- <your-file>.tsx`
- [ ] 0 architecture-related errors
- [ ] Green check before commit

**5. Build Succeeds** ✅
- [ ] Run `npm run build`
- [ ] No build errors introduced
- [ ] TypeScript compilation clean

**Full Checklist**: See CODE_REVIEW_CHECKLIST_IMPORTS.md

---

## 📝 PHASE 8: PRE-COMMIT SETUP (5 min)

### Before You Make Your First Commit

**Manual Checklist** (do this now):

1. **For new files you created**:
   ```bash
   npm run lint -- src/your/file/path.tsx
   ```
   Expect: ✅ 0 errors

2. **For files you modified**:
   ```bash
   npm run lint -- src/modified/file.tsx
   ```
   Expect: ✅ 0 errors

3. **Build check**:
   ```bash
   npm run build
   ```
   Expect: ✅ Build succeeds

4. **TypeScript check**:
   ```bash
   npx tsc --noEmit
   ```
   Expect: ✅ 0 errors

### Using Pre-Commit Hooks

If husky is set up, this runs automatically on commit. But always verify manually first!

---

## 🤔 PHASE 9: COMMON QUESTIONS (FAQ)

### Q1: What if I get "no-direct-service-imports" error?

**A**: You imported a service directly instead of using factory.

**Fix**:
```typescript
// Before (WRONG)
import { customerService } from '@/services/customerService';

// After (RIGHT)
import { customerService as factoryCustomerService } from '@/services/serviceFactory';
```

---

### Q2: What if I get "type-import-location" error?

**A**: You imported types from a module instead of from @/types/.

**Fix**:
```typescript
// Before (WRONG)
import { User } from '@/modules/customers/types';

// After (RIGHT)
import { User } from '@/types';
```

---

### Q3: What if TypeScript can't find a type?

**A**: The type might not be centralized yet. Check:

1. Does the type exist in `@/types/`?
2. Is it exported from `@/types/index.ts`?
3. Is the export name correct?

**Check**:
```bash
grep -r "export.*YourType" src/types/
```

If not found, add it to @/types/index.ts

---

### Q4: Can I use both mock and Supabase services?

**A**: Yes, the service factory handles this via environment variables:

```bash
VITE_API_MODE=mock npm run dev      # Test data
VITE_API_MODE=supabase npm run dev  # Real data
```

The factory automatically routes to the correct implementation. You don't need to change your code.

---

### Q5: What if I'm confused about imports?

**A**: Follow this decision tree:

```
Q: Am I in a component or hook?
├─ YES → Import services from @/services/serviceFactory
└─ NO → Go next

Q: Am I in a service file?
├─ YES → Import types from @/types only
└─ NO → Go next

Q: Am I in a module or context?
├─ YES → Import services from @/services/serviceFactory
└─ NO → Import types from @/types

ALL ELSE → Read DEVELOPER_GUIDE_IMPORT_PATTERNS.md
```

---

## 🎓 CONTINUING EDUCATION

### Week 1 Tasks
- [ ] Read all "Priority 1" documents above
- [ ] Make 1-2 PRs with the new patterns
- [ ] Get familiar with code review process
- [ ] Ask questions in team chat

### Week 2 Tasks
- [ ] Read "Priority 2" documents
- [ ] Review 3-5 PRs using the checklist
- [ ] Mentor new team member on patterns (if applicable)
- [ ] Suggest process improvements

### Month 1 Tasks
- [ ] Read "Priority 3" deep-dive documents
- [ ] Contribute to architecture discussions
- [ ] Help document new patterns
- [ ] Train other teams

---

## 📞 SUPPORT & HELP

### Stuck on Something?

1. **Import Pattern Question**?
   → Read: DEVELOPER_GUIDE_IMPORT_PATTERNS.md

2. **ESLint Error**?
   → Read: IMPORT_PATTERNS_QUICK_GUIDE.md (Troubleshooting section)

3. **Code Review Feedback**?
   → Read: CODE_REVIEW_CHECKLIST_IMPORTS.md

4. **Historical Context**?
   → Read: COMPLETION_REPORT_100PERCENT.md

5. **Emergency Issue**?
   → Contact: Your Tech Lead
   → Escalation: See MAINTENANCE_RUNBOOK.md

---

## ✅ YOU'RE READY!

Congratulations! You've completed onboarding to the architecture standards.

**Next Steps**:
1. ✅ Create a new branch
2. ✅ Make a small code change following the patterns
3. ✅ Run `npm run lint` - should pass
4. ✅ Run `npm run build` - should pass
5. ✅ Create your first PR
6. ✅ Reference CODE_REVIEW_CHECKLIST_IMPORTS.md during review

**Welcome to the team!** 🎉

---

## 🔗 QUICK REFERENCE LINKS

| Document | Purpose | Read Time |
|----------|---------|-----------|
| DEVELOPER_GUIDE_IMPORT_PATTERNS.md | Daily reference | 10-15 min |
| CODE_REVIEW_CHECKLIST_IMPORTS.md | Code reviews | 10 min |
| COMPLETION_REPORT_100PERCENT.md | Deep understanding | 20 min |
| IMPORT_PATTERNS_QUICK_GUIDE.md | Troubleshooting | 5 min |
| MAINTENANCE_RUNBOOK.md | Procedures | 10 min |
| .zencoder/rules/repo.md | Architecture overview | 15 min |

---

**Onboarding Complete Date**: _________________  
**Completed By**: _________________  
**Questions/Notes**: _________________  

---

**Document Version**: 1.0  
**Created**: February 2025  
**Last Updated**: February 2025  
**Status**: ✅ ACTIVE - Use for all new team members
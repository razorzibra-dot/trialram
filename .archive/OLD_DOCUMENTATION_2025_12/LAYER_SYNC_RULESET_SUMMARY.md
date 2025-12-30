---
title: Layer Synchronization Ruleset - Executive Summary
description: Overview of complete multi-layer development standardization system
date: 2025-01-30
version: 1.0.0
status: Active
---

# Complete Layer Synchronization Ruleset - Summary

## 🎯 What Was Created

A comprehensive system of 4 standardized ruleset documents that ensure **100% synchronization** across all application layers to prevent field mapping mismatches, service binding issues, and UI control binding problems.

---

## 📦 The 4 Ruleset Documents

Located in: `.zencoder/rules/`

### 1. **standardized-layer-development.md** (Core Ruleset)
- Complete architecture definition
- 6-layer model explanation
- Field mapping standards
- Validation synchronization
- Testing strategies
- Common pitfalls & prevention

**Use**: Understanding the complete system

---

### 2. **layer-sync-implementation-guide.md** (Practical Guide)
- 8-phase feature implementation template
- Real working code examples
- CRUD operations template
- Scenario-based modifications
- Pre-merge checklists

**Use**: When implementing or modifying features

---

### 3. **layer-sync-enforcement.md** (Code Review & CI/CD)
- Comprehensive PR checklist
- Automated check scripts
- Git hooks configuration
- Violation resolution guide
- Merge gate requirements

**Use**: Code reviews and CI/CD setup

---

### 4. **LAYER_SYNC_RULESET_INDEX.md** (Master Index)
- Quick reference guide
- Learning path by role
- FAQ section
- Success indicators
- File cross-reference

**Use**: Navigation and quick lookup

---

## 🚀 Quick Implementation Path

### For Any New Feature: Follow 8 Phases

```
Phase 1: Database     → Create table with constraints
         ↓
Phase 2: Types        → Define TypeScript interface
         ↓
Phase 3: Mock Service → Provide mock data
         ↓
Phase 4: Supabase     → Query database with mapping
         ↓
Phase 5: Factory      → Export method routing
         ↓
Phase 6: Module       → Coordinate data flows
         ↓
Phase 7: Hooks        → Fetch data, manage state
         ↓
Phase 8: UI           → Bind forms to exact fields
```

**Time**: ~2-3 hours per feature  
**Quality**: 100% field synchronization guaranteed

---

## 🔄 Application Architecture (7 Layers)

```
┌─────────────────────────────────────┐
│ UI Layer (React Components)          │  Form fields bind to types
├─────────────────────────────────────┤
│ Hooks Layer (React Hooks)            │  Load data, manage state
├─────────────────────────────────────┤
│ Module Service (Business Logic)      │  Coordinate flows
├─────────────────────────────────────┤
│ Service Factory (Router)             │  Route mock/supabase
├──────────────┬──────────────────────┤
│ Mock Service │ Supabase Service     │  Dual implementation
│ (Dev Data)   │ (Production)         │
├──────────────┴──────────────────────┤
│ Database (PostgreSQL)                │  Source of truth
└─────────────────────────────────────┘
```

**Key Rule**: Every field defined in database must exist in ALL layers

---

## ✅ What This Prevents

### Problem 1: Field Name Mismatches
```
❌ BEFORE: Database has 'user_email', UI uses 'userEmail', service returns 'email'
✅ AFTER:  Consistent camelCase everywhere (snake_case → camelCase mapping centralized)
```

### Problem 2: Type Mismatches
```
❌ BEFORE: Database stores DECIMAL, service returns string, UI expects number
✅ AFTER:  Explicit type conversion with centralized row mappers
```

### Problem 3: Validation Inconsistencies
```
❌ BEFORE: Mock allows invalid data, Supabase rejects, UI allows too
✅ AFTER:  Validation defined once (Zod), used in ALL layers
```

### Problem 4: UI Binding Issues
```
❌ BEFORE: Form field missing from service, field exists in DB but not UI
✅ AFTER:  8-phase template ensures all layers updated together
```

### Problem 5: Service Integration Chaos
```
❌ BEFORE: Direct imports bypass factory, break mock mode, "Unauthorized" errors
✅ AFTER:  Strict factory pattern, works in mock AND supabase mode
```

---

## 📋 Implementation Checklist

Use this for every new feature:

```markdown
### Database
- [ ] Table created with constraints
- [ ] All columns documented

### Types
- [ ] TypeScript interface created
- [ ] Zod validation schema created

### Services
- [ ] Mock service with same structure
- [ ] Supabase query with proper mapping
- [ ] Row mapper function created

### Integration
- [ ] Factory method exported
- [ ] Module service uses factory
- [ ] Hook created with loading/error

### UI
- [ ] Form fields match database names
- [ ] Validation matches constraints
- [ ] Tooltips document limits

### Testing
- [ ] Service parity test added
- [ ] Field mapping test added
- [ ] Form integration test added

### Documentation
- [ ] Database constraints documented
- [ ] Form fields have tooltips
```

---

## 🔧 Key Implementation Patterns

### Pattern 1: Centralized Row Mapper
```typescript
function mapProductRow(row: any): ProductType {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,      // snake_case → camelCase
    price: parseFloat(row.price),     // DECIMAL → number
    stockQty: parseInt(row.stock_qty), // INT → number
    isActive: row.is_active,          // BOOLEAN
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
```

### Pattern 2: Service Factory
```typescript
export const productService = {
  getProducts: () => getBackendService().getProducts(),
  createProduct: (data) => getBackendService().createProduct(data),
  // Routes to mock OR supabase based on VITE_API_MODE
};
```

### Pattern 3: Validation Once, Use Everywhere
```typescript
// Define once
export const ProductSchema = z.object({
  name: z.string().max(100),
  price: z.number().min(0),
});

// Use in all layers
mockService: ProductSchema.parse(input)
supabaseService: ProductSchema.parse(input)
UI validation: Match schema rules exactly
```

---

## 🎓 Reading Guide by Role

### 👨‍💻 **New Developer**
1. Read: Index document (LAYER_SYNC_RULESET_INDEX.md)
2. Study: Real example in `/src/modules/features/customers/`
3. Follow: 8-phase template for first feature
4. Review: Code review comments to learn

**Time**: 1-2 hours to understand

---

### 👀 **Code Reviewer**
1. Read: Enforcement guide (layer-sync-enforcement.md)
2. Use: Checklist template for every PR
3. Reference: Core ruleset for edge cases
4. Enforce: Merge gate requirements

**Time**: 15 min per PR review

---

### 👨‍🔧 **DevOps/Team Lead**
1. Read: All 4 documents
2. Setup: Git hooks with pre-commit checks
3. Configure: ESLint rules to prevent violations
4. Monitor: Quality metrics dashboard

**Time**: 2-3 hours to setup

---

## 🚨 Critical Rules (MUST FOLLOW)

### Rule 1: One Type Definition
```
✅ Type defined once: /src/types/entity.ts
❌ Never repeat type definitions in multiple files
```

### Rule 2: Centralized Validation
```
✅ Validation schema once: ProductSchema = z.object({...})
❌ Never define different validation in mock vs supabase
```

### Rule 3: Explicit Column Mapping
```
✅ SELECT id, name, category_id as categoryId
❌ Never assume database columns match TypeScript names
```

### Rule 4: Factory Pattern for Services
```
✅ import { productService } from '@/services/serviceFactory'
❌ Never import directly from supabase or mock services
```

### Rule 5: Cache Invalidation
```
✅ Invalidate queries on mutation success
❌ Never forget cache invalidation - leads to stale data
```

---

## 🛠️ Setup Instructions

### For Development Team

1. **Read the Rulesets**
   ```bash
   # Read in this order:
   1. .zencoder/rules/LAYER_SYNC_RULESET_INDEX.md       (5 min overview)
   2. .zencoder/rules/standardized-layer-development.md  (30 min - architecture)
   3. .zencoder/rules/layer-sync-implementation-guide.md (30 min - templates)
   ```

2. **Setup Git Hooks**
   ```bash
   # Already in .husky/ but verify:
   npm install husky --save-dev
   npx husky install
   ```

3. **Setup ESLint Rules**
   ```bash
   # Add to .eslintrc.js:
   'no-direct-service-imports': ['error', {...}]
   ```

4. **Create PR Checklist**
   ```bash
   # Add checklist template to PR template:
   .github/PULL_REQUEST_TEMPLATE.md
   ```

5. **First Feature**
   ```bash
   # Follow 8-phase template in implementation guide
   # Use provided code examples
   # Submit for review with completed checklist
   ```

---

## 📊 Success Metrics

When successfully implemented, you'll see:

✅ **Zero field mapping errors** - All fields named consistently  
✅ **No type mismatches** - Type system catches errors before runtime  
✅ **Validation consistency** - Same rules in mock and supabase  
✅ **Faster development** - 8-phase template is repeatable  
✅ **Easier debugging** - Clear data flow through layers  
✅ **Better code reviews** - Checklist catches issues early  
✅ **Lower regression rate** - Tests verify all layer sync  

---

## 🔗 Document Links

All documents located in: `.zencoder/rules/`

| Document | Purpose | Size |
|----------|---------|------|
| `standardized-layer-development.md` | Core architecture & patterns | ~800 lines |
| `layer-sync-implementation-guide.md` | Code templates & examples | ~600 lines |
| `layer-sync-enforcement.md` | Code review & CI/CD | ~500 lines |
| `LAYER_SYNC_RULESET_INDEX.md` | Master index & navigation | ~300 lines |

---

## ❓ Common Questions

**Q: Do I need to follow all 8 phases?**  
A: Yes. Skipping a phase leaves data out of sync. Each phase is essential.

**Q: How long does a feature take with this process?**  
A: 2-3 hours for average CRUD feature. Templates and examples speed it up.

**Q: What if I don't use Zod?**  
A: Define validation in SOME consistent way (Joi, class-validator, etc.). Must be same in all layers.

**Q: Can I modify this ruleset?**  
A: Team lead only. Document changes and communicate to team.

---

## 🎯 Next Steps

1. **Today**: Read this summary (10 min) + Index document (5 min)
2. **Tomorrow**: Read Core ruleset (30 min) + Implementation guide (30 min)
3. **This Week**: Implement first feature following 8-phase template
4. **This Week**: Have code reviewed by someone familiar with rulesets
5. **Next Week**: You're ready to implement features independently

---

## 📞 Support

**For architecture questions**: See `standardized-layer-development.md` sections  
**For implementation help**: See `layer-sync-implementation-guide.md` sections  
**For code review guidance**: See `layer-sync-enforcement.md` checklist  
**For quick lookup**: See `LAYER_SYNC_RULESET_INDEX.md` sections  

---

## ✨ Key Benefits

| Benefit | Impact | Value |
|---------|--------|-------|
| **No Field Mismatches** | Data binds correctly to forms | High |
| **Type Safety** | Catch errors at compile time | Critical |
| **Validation Sync** | Invalid data rejected everywhere | High |
| **Easy Debugging** | Clear data flow UI→Hook→Service→DB | High |
| **Faster Development** | Reusable 8-phase template | Medium |
| **Better Reviews** | Automated checks + checklist | High |
| **Lower Bugs** | Type system + validation catch issues | Critical |

---

## 🎓 Example: Implementing "Add Notes to Product"

Using the new ruleset:

```
1. Database    → ALTER TABLE products ADD COLUMN notes TEXT
2. Type        → Add `notes?: string` to ProductType
3. Mock        → Add notes: 'sample' to mock data
4. Supabase    → Add notes to query SELECT
5. Factory     → No change (auto-routed)
6. Module      → No change (uses factory)
7. Hook        → No change (fetches complete type)
8. UI          → Add <Input.TextArea name="notes" />

Total: 15 minutes
Quality: 100% sync verified
```

---

## 🚀 Ready to Start?

1. ✅ Read this summary
2. ✅ Read `.zencoder/rules/LAYER_SYNC_RULESET_INDEX.md`
3. ✅ Read `.zencoder/rules/standardized-layer-development.md`
4. ✅ Pick a feature to implement
5. ✅ Follow 8-phase template
6. ✅ Submit for review with checklist
7. ✅ Done! All layers perfectly synchronized

---

**Created**: 2025-01-30  
**Version**: 1.0.0  
**Status**: ✅ **ACTIVE** - All rules apply to all development  

---

👉 **Start Reading**: Open `.zencoder/rules/LAYER_SYNC_RULESET_INDEX.md` next
---
description: Layer Synchronization Enforcement Rules - Code review gates and automated checks for multi-layer sync
alwaysApply: true
---

# Layer Synchronization Enforcement Rules

**Purpose**: Ensure 100% synchronization across all application layers through automated checks and code review gates.

---

## Code Review Checklist Template

Every PR adding or modifying features must address this checklist:

```markdown
## Layer Synchronization Review

### Phase 1: Database Schema
- [ ] SQL migration file created (`supabase/migrations/YYYYMMDD_*.sql`)
- [ ] Table/columns defined with exact types
- [ ] Constraints defined (NOT NULL, CHECK, UNIQUE, FK)
- [ ] Column comments document constraints
- [ ] Indexes created for performance
- [ ] Migration tested locally
- [ ] No table/column deletions without archival plan

### Phase 2: TypeScript Types
- [ ] Type interface created in `/src/types/`
- [ ] All database columns represented
- [ ] Field names use camelCase (JavaScript convention)
- [ ] Optional fields marked with `?`
- [ ] Zod/validation schema created
- [ ] Create and Update input types separate
- [ ] Types exported from central location
- [ ] Comments document field constraints

### Phase 3: Mock Service (`src/services/*.ts`)
- [ ] Service method created with same signature as backend
- [ ] Mock data includes all required fields
- [ ] Field names exactly match TypeScript types
- [ ] Validation logic implemented
- [ ] Same error messages as Supabase service
- [ ] No direct Supabase imports
- [ ] Returns exact TypeScript types

### Phase 4: Supabase Service (`src/services/supabase/*.ts`)
- [ ] Service method created
- [ ] SQL query selects all required fields
- [ ] Column names mapped: `snake_case` → `camelCase`
- [ ] Row mapper function created (centralized)
- [ ] Same validation as mock service
- [ ] Parameterized queries (security)
- [ ] Error handling matches mock
- [ ] Returns exact TypeScript types

### Phase 5: Service Factory (`src/services/serviceFactory.ts`)
- [ ] Service method exported
- [ ] Routes correctly to mock/supabase based on `VITE_API_MODE`
- [ ] Same method signature as backends
- [ ] No business logic in factory (routing only)

### Phase 6: Module Service (`src/modules/features/*/services/*.ts`)
- [ ] Imports from factory (not direct backend)
- [ ] Methods coordinate data flows
- [ ] Module-specific logic applied
- [ ] Same types used as backend
- [ ] No data transformation without reason
- [ ] Documentation of each method

### Phase 7: Hooks (`src/modules/features/*/hooks/*.ts`)
- [ ] Hook created for each operation
- [ ] Returns object with: `data`, `loading`, `error`, `refetch`
- [ ] Uses React Query for remote data
- [ ] Loading state handled
- [ ] Error state handled
- [ ] Cache keys consistent and documented
- [ ] Mutations include cache invalidation
- [ ] TypeScript types imported correctly
- [ ] JSDoc comments document parameters and returns

### Phase 8: UI Components (`src/modules/features/*/components/*.tsx`)
- [ ] Form field names match database columns (camelCase)
- [ ] Validation rules match database constraints
- [ ] Input types match TypeScript types
- [ ] Tooltips document database constraints
- [ ] Placeholder text helpful
- [ ] Loading state shown (Spin, disabled buttons)
- [ ] Error messages from validation displayed
- [ ] Success/failure messages shown
- [ ] Form resets on success
- [ ] No data transformation in component

### Phase 9: Tests
- [ ] Unit test for validation rules
- [ ] Integration test: form → service → type
- [ ] Mock vs Supabase parity test
- [ ] Field mapping test
- [ ] All tests passing locally
- [ ] Tests verify field names match
- [ ] Tests verify types match
- [ ] Tests verify validation rules match

### Phase 10: Documentation
- [ ] Database constraints documented in migration
- [ ] TypeScript types have JSDoc comments
- [ ] Form fields have helpful tooltips
- [ ] Module has DOC.md updated
- [ ] Complex logic explained inline
- [ ] No outdated comments
- [ ] README updated if adding new module

### Phase 11: Verification
- [ ] Feature tested with mock mode (`VITE_API_MODE=mock`)
- [ ] Feature tested with supabase mode (`VITE_API_MODE=supabase`)
- [ ] Form values persist correctly
- [ ] Validation errors show for invalid input
- [ ] Field names match in database, UI, and code
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Build succeeds
```

---

## Automated Checks (CI/CD Pipeline)

### Check 1: Type Alignment

```bash
#!/bin/bash
# Script: scripts/check-type-alignment.sh
# Validates TypeScript interface matches database schema

echo "🔍 Checking TypeScript type alignment..."

# 1. Extract database columns from migration
# 2. Extract TypeScript interface fields
# 3. Compare field names and types
# 4. Report mismatches

# FAIL if:
# - Database column not in TypeScript type
# - TypeScript field not in database
# - Field name casing inconsistent
# - Field type incompatible
```

### Check 2: Mock vs Supabase Parity

```bash
#!/bin/bash
# Script: scripts/check-service-parity.sh
# Validates mock and supabase return same structure

echo "🔍 Checking service parity..."

# 1. Run mock service tests
# 2. Run supabase service tests
# 3. Compare returned types
# 4. Compare validation rules

# FAIL if:
# - Different return types
# - Different validation logic
# - Different error messages
```

### Check 3: Query Mapper Validation

```bash
#!/bin/bash
# Script: scripts/check-query-mappers.sh
# Validates Supabase queries map all columns

echo "🔍 Checking query mappers..."

# 1. Extract columns from Supabase SELECT
# 2. Extract fields from TypeScript interface
# 3. Verify mappings (snake_case → camelCase)

# FAIL if:
# - Missing column selection
# - Missing field mapping
# - Naming convention violated
```

### Check 4: Form Field Validation

```bash
#!/bin/bash
# Script: scripts/check-form-validation.sh
# Validates form validation matches database constraints

echo "🔍 Checking form validation..."

# 1. Extract constraints from database migration
# 2. Extract rules from form definition
# 3. Compare validation logic

# FAIL if:
# - Form allows invalid values
# - Form rejects valid values
# - Constraint not enforced
```

---

## Git Hooks (Husky)

### Pre-Commit Hook

```bash
#!/bin/bash
# .husky/pre-commit

echo "🔍 Running pre-commit layer sync checks..."

# 1. Check for type mismatches
npm run check:types-align || exit 1

# 2. Check for unmatched fields
npm run check:field-mapping || exit 1

# 3. Lint TypeScript
npm run lint || exit 1

echo "✅ Pre-commit checks passed"
```

### Pre-Push Hook

```bash
#!/bin/bash
# .husky/pre-push

echo "🔍 Running pre-push layer sync tests..."

# 1. Run all sync tests
npm run test:layer-sync || exit 1

# 2. Build project
npm run build || exit 1

echo "✅ Pre-push checks passed"
```

---

## Violation Resolution Guide

### Violation Type 1: Field Name Mismatch

**Problem Indicator**:
```
❌ Error: database has 'user_email' but code has 'userEmail'
```

**Quick Fix**:
1. Identify the mismatch
2. Choose camelCase for TypeScript (standard)
3. Update all occurrences:
   - TypeScript type: `userEmail`
   - Service select: `user_email as userEmail`
   - Mock data: `userEmail`
   - Form field: `name="userEmail"`
4. Run tests to verify sync

**Prevention**:
- Always use `snake_case` in database
- Always use `camelCase` in TypeScript
- Always map in service: `SELECT column_name as camelCaseName`

---

### Violation Type 2: Type Mismatch

**Problem Indicator**:
```
❌ Error: database DECIMAL(10,2) returned as string, expected number
```

**Quick Fix**:
1. Identify the type mismatch
2. Add explicit type conversion in mapper:
```typescript
price: parseFloat(row.price), // DECIMAL → number
quantity: parseInt(row.quantity, 10), // INT → number
created_at: new Date(row.created_at), // TIMESTAMP → Date
```
3. Verify TypeScript type matches
4. Test with actual Supabase data

**Prevention**:
- Create row mapper functions (centralized)
- Test mock vs supabase with real data
- Use TypeScript strict mode
- Write parity tests

---

### Violation Type 3: Validation Inconsistency

**Problem Indicator**:
```
❌ Mock allows rating=6, but database constraint is max 5
```

**Quick Fix**:
1. Define constraint once (Zod schema):
```typescript
export const RatingSchema = z.number().min(1).max(5);
```
2. Use in all layers:
   - Mock service: `RatingSchema.parse(input.rating)`
   - Supabase service: `RatingSchema.parse(input.rating)`
   - Form validation: `rules={[{ min: 1, max: 5 }]}`
3. Test all paths with invalid data

**Prevention**:
- Define validation schema once (Zod)
- Reuse schema in all layers
- Document database constraints
- Test validation in mock AND supabase

---

### Violation Type 4: Missing Field

**Problem Indicator**:
```
❌ Error: database has column 'department_id' but UI doesn't show it
```

**Quick Fix**:
1. Add field to TypeScript type
2. Add field to mock service mock data
3. Add field to Supabase query SELECT
4. Add field mapper
5. Add form input/display
6. Test end-to-end

**Prevention**:
- When adding database column, follow 8-phase template
- Use code review checklist
- Run tests to catch missing fields

---

### Violation Type 5: Direct Backend Import

**Problem Indicator**:
```
❌ Error: component imports from productService directly
   Should use factory pattern
```

**Quick Fix**:
```typescript
// ❌ WRONG
import { supabaseProductService } from '@/services/supabase/productService';

// ✅ CORRECT
import { productService as factoryService } from '@/services/serviceFactory';
```

**Prevention**:
- Always import from factory in modules
- Module services use factory
- Hooks use module services
- ESLint rule to prevent direct imports

---

## Automated Violation Detection

### ESLint Rule: Prevent Direct Service Imports

```javascript
// .eslintrc.js - ADD custom rule

rules: {
  'no-direct-service-imports': [
    'error',
    {
      message: 'Import services from serviceFactory, not directly',
      bannedImports: [
        '@/services/supabase/*',
        '@/services/*.ts (except factory)',
      ],
      allowedFor: [
        '@/services/serviceFactory.ts',
        '@/services/index.ts',
      ],
    },
  ],
}
```

### TypeScript Strict Checks

```json
// tsconfig.json

{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## Quality Gates for Merge

All PRs must pass these gates:

```markdown
## Merge Gate Checklist

### Code Quality
- [x] ESLint: 0 errors
- [x] TypeScript: 0 errors
- [x] Tests: 100% pass
- [x] Build: Succeeds

### Layer Sync
- [x] Database: Schema valid
- [x] Types: Interface complete
- [x] Services: Parity verified
- [x] Hooks: Cache keys consistent
- [x] UI: Forms sync'd with DB
- [x] Validation: Consistent

### Tests
- [x] Unit: Service logic
- [x] Integration: Form → DB
- [x] Parity: Mock vs Supabase
- [x] Validation: All rules

### Documentation
- [x] Database: Constraints documented
- [x] Types: JSDoc comments
- [x] UI: Field tooltips
- [x] Code: Complex logic explained

### Review
- [x] Code review: 1 approval
- [x] Checklist: All items checked
- [x] No conflicts: Main branch synced
```

---

## Enforcement Severity Levels

### 🔴 CRITICAL (Blocks Merge)

- Field name mismatch between UI and database
- Type mismatch (string vs number)
- Validation inconsistency (mock allows invalid, DB rejects)
- Missing null check leading to runtime error
- Direct backend service import in module
- TypeScript build error
- ESLint error (critical rules)

**Fix**: Must fix before merge is allowed

### 🟠 HIGH (Review Comment)

- Missing cache invalidation
- No loading/error state in UI
- Incomplete type safety
- Missing error handling
- Form field without tooltip
- No test coverage

**Fix**: Should fix before merge (reviewer can approve with comment)

### 🟡 MEDIUM (Suggestion)

- Code style inconsistency
- Missing JSDoc comments
- Suboptimal performance
- Could use better naming

**Fix**: Nice-to-have, reviewer suggests improvement

### 🟢 LOW (Info)

- Minor wording improvement
- Formatting suggestion
- Documentation enhancement

**Fix**: Optional

---

## Agent Enforcement Directives

### When Implementing Features

1. ✅ Follow the 8-phase template
2. ✅ Use exact same types in all layers
3. ✅ Map field names consistently (snake_case → camelCase)
4. ✅ Apply validation in all layers
5. ✅ Document database constraints in UI
6. ✅ Test mock AND supabase implementations
7. ✅ Include cache invalidation in mutations
8. ✅ Add comprehensive tests

### When Reviewing Code

1. ✅ Check field name consistency
2. ✅ Verify type alignment database → UI
3. ✅ Validate all layers have same validation
4. ✅ Ensure factory pattern usage
5. ✅ Verify cache invalidation
6. ✅ Check test coverage
7. ✅ Verify documentation

### When Merging Code

1. ✅ All quality gates passed
2. ✅ All tests passing
3. ✅ ESLint: 0 errors
4. ✅ Build succeeds
5. ✅ Checklist 100% complete
6. ✅ Documentation current
7. ✅ No breaking changes

---

## Common Mistakes to Avoid

| Mistake | Impact | Fix |
|---------|--------|-----|
| Different field names | Data doesn't bind to form | Use camelCase consistently |
| Missing type definition | Any-typing leads to bugs | Define comprehensive type interface |
| Skipping validation in one layer | Invalid data persists | Apply validation in ALL layers |
| No cache invalidation | Stale data shows in UI | Invalidate query keys after mutation |
| Direct service import | Breaks mock mode, "Unauthorized" errors | Import from serviceFactory |
| Forgetting row mapper | Type mismatch at runtime | Create central mapper function |
| Missing null handling | Crashes on optional fields | Mark optional with `?`, check for null |
| No database constraints | Backend allows invalid data | Define CHECK, NOT NULL in migration |
| No form tooltips | Users don't know field limits | Add tooltips documenting constraints |
| Incomplete tests | Bugs in production | Test mock, supabase, validation, parity |

---

## Success Metrics

Track these metrics to ensure layer sync quality:

```markdown
## Layer Sync Quality Metrics

### Defect Rates
- Field mapping errors: < 0.5% of PRs
- Type mismatches: < 1% of PRs
- Validation inconsistencies: < 0.5% of PRs
- Missing cache invalidation: < 2% of PRs

### Code Coverage
- Mock services: > 90%
- Supabase services: > 90%
- Validation logic: 100%
- Form integration: > 85%

### Test Pass Rate
- Pre-commit: 100%
- Pre-push: 100%
- CI/CD: 100%
- Layer sync tests: 100%

### Review Efficiency
- Average review time: < 30 minutes
- Review feedback: < 3 comments per PR
- Merge after review: < 1 hour
- Rollback rate: < 0.1%
```

---

## Escalation Path

If violation detected:

1. **Automated Check Fails** → PR build marked red
2. **Reviewer Flags Issue** → Comment with severity level
3. **Developer Fixes** → Updates code and commits
4. **Re-review** → Reviewer re-approves
5. **Merge** → Code merged to main

**If > 3 violations in same PR**: 
- Pause review
- Discuss with developer
- May require refactor vs incremental fixes

---

**Last Updated**: 2025-01-30  
**Version**: 1.0.0  
**Status**: Active Enforcement
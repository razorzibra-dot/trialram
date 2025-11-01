---
title: Complete Layer Synchronization Ruleset
description: Master index for standardized multi-layer development and enforcement rules
version: 1.0.0
status: Active
lastUpdated: 2025-01-30
---

# Complete Layer Synchronization Ruleset - Master Index

## 📋 Overview

This ruleset ensures **100% synchronization** across all application layers:

1. **Database Layer** - PostgreSQL schema (source of truth)
2. **Mock Service Layer** - Development data
3. **Supabase Service Layer** - Production data
4. **Service Factory** - Multi-backend routing
5. **Module Service Layer** - Business logic coordination
6. **Hooks Layer** - Data fetching & state management
7. **UI Layer** - React components & forms

---

## 📚 Ruleset Documents

### 1. **Core Ruleset**: `standardized-layer-development.md`
**Purpose**: Define all layers, responsibilities, and data flow  
**Contains**:
- Layer definitions and responsibilities
- TypeScript interface standards
- Field mapping & naming conventions
- Validation synchronization
- Synchronization verification checklist
- Common pitfalls & prevention
- Testing & verification strategies
- Enforcement rules

**When to Read**: First - understand the complete architecture

---

### 2. **Implementation Guide**: `layer-sync-implementation-guide.md`
**Purpose**: Practical templates and step-by-step instructions  
**Contains**:
- Complete 8-phase feature implementation template
- Real working code examples for CRUD operations
- Scenario-based modifications (add field, change type, add relationship)
- Pre-merge verification checklist
- Complete working examples

**When to Read**: When implementing a new feature or modifying existing one

---

### 3. **Enforcement Guide**: `layer-sync-enforcement.md`
**Purpose**: Code review gates and automated validation  
**Contains**:
- Comprehensive PR checklist template
- Automated CI/CD checks
- Git hooks configuration
- Violation resolution guide
- ESLint rules for enforcement
- Merge gate requirements
- Quality metrics

**When to Read**: During code review or setting up CI/CD pipeline

---

## 🎯 Quick Start: 8-Phase Feature Implementation

For any new feature, follow these 8 phases in order:

### Phase 1: Database Schema
```sql
-- Create table with all constraints
CREATE TABLE table_name (
  id UUID PRIMARY KEY,
  column_name TYPE NOT NULL,
  CONSTRAINT check_name CHECK (...)
);
```
**Location**: `/supabase/migrations/YYYYMMDD_*.sql`

### Phase 2: TypeScript Types
```typescript
// Define interface matching database exactly
export interface EntityType {
  id: string;
  columnName: string; // camelCase
}

// Define validation schema
export const EntitySchema = z.object({...});
```
**Location**: `/src/types/entity.ts`

### Phase 3: Mock Service
```typescript
// Provide mock data matching database structure
export const mockService = {
  async getEntity(): Promise<EntityType[]> {
    return mockData; // Same structure as database
  },
};
```
**Location**: `/src/services/entityService.ts`

### Phase 4: Supabase Service
```typescript
// Query database and map to types
async getEntity(): Promise<EntityType[]> {
  const { data } = await supabase
    .from('table_name')
    .select('column_name'); // Map: column_name as columnName
}
```
**Location**: `/src/services/supabase/entityService.ts`

### Phase 5: Service Factory
```typescript
// Export method routing to mock/supabase
export const entityService = {
  getEntity: () => getEntityService().getEntity(),
};
```
**Location**: `/src/services/serviceFactory.ts`

### Phase 6: Module Service
```typescript
// Coordinate between UI and backend
export const moduleEntityService = {
  async getEntity() {
    return await entityService.getEntity(); // Use factory
  },
};
```
**Location**: `/src/modules/features/module/services/entityService.ts`

### Phase 7: Custom Hooks
```typescript
// Fetch data and manage state
export function useEntity() {
  const { data, loading, error, refetch } = useQuery({
    queryKey: ['entities'],
    queryFn: () => moduleEntityService.getEntity(),
  });
  return { data, loading, error, refetch };
}
```
**Location**: `/src/modules/features/module/hooks/useEntity.ts`

### Phase 8: UI Component
```typescript
// Bind forms to exact database fields
<Form.Item name="columnName" label="Field Name" tooltip="Field description">
  <Input /> {/* Input type matches database type */}
</Form.Item>
```
**Location**: `/src/modules/features/module/components/EntityForm.tsx`

**See**: `layer-sync-implementation-guide.md` for complete working examples

---

## ⚡ Common Scenarios

### Scenario 1: Add New Field to Existing Entity
1. Add column to database
2. Update TypeScript type
3. Update mock service mock data
4. Update Supabase query + mapper
5. Update UI form
6. Update tests

**Time**: ~30 minutes  
**See**: Section "Scenario 1: Adding a New Form Field to Existing Entity" in implementation guide

---

### Scenario 2: Change Field Type or Constraint
1. Create database migration
2. Update validation schema
3. Update mock validation
4. Update Supabase service (already handles via type conversion)
5. Update UI (validation rules, tooltips)
6. Update tests

**Time**: ~20 minutes  
**See**: Section "Scenario 2: Changing Field Type or Constraint"

---

### Scenario 3: Add New Relationship (Foreign Key)
1. Add FK column to database
2. Update TypeScript type with FK reference
3. Update mock service with reference
4. Update Supabase query with JOIN (if needed)
5. Update UI with selector dropdown
6. Update tests

**Time**: ~45 minutes  
**See**: Section "Scenario 3: Adding a Relationship"

---

## 🔍 Verification Checklist

Before merging ANY code, verify:

### Database & Types ✓
- [ ] Database: All fields have constraints
- [ ] Types: Match database exactly
- [ ] Types: camelCase naming used

### Services ✓
- [ ] Mock: Same structure as database
- [ ] Mock: Same validation rules
- [ ] Supabase: Column mapping correct (snake → camel)
- [ ] Supabase: Row mapper function exists
- [ ] Factory: Method exported and routed

### Integration ✓
- [ ] Module Service: Uses factory
- [ ] Hooks: Loads data correctly
- [ ] UI: Form fields match database names
- [ ] UI: Validation matches database

### Testing ✓
- [ ] Tests: Service parity verified
- [ ] Tests: Field mapping correct
- [ ] Tests: Validation rules match

See full checklist: `standardized-layer-development.md` → "Synchronization Verification Checklist"

---

## 🚫 Critical Rules (ENFORCE)

### ✅ DO
- ✅ Use camelCase in TypeScript
- ✅ Use snake_case in database
- ✅ Map explicitly in queries: `column_name as columnName`
- ✅ Define validation once (Zod schema), reuse everywhere
- ✅ Import from factory in modules
- ✅ Test mock AND supabase implementations
- ✅ Document database constraints in form tooltips
- ✅ Use centralized row mapper functions

### ❌ DON'T
- ❌ Import services directly from backend (use factory)
- ❌ Use inconsistent field names
- ❌ Skip validation in any layer
- ❌ Copy data types without comments
- ❌ Mix database constraints with UI constraints
- ❌ Forget cache invalidation on mutations
- ❌ Leave null values unchecked
- ❌ Transform data types unnecessarily

---

## 🛡️ Code Review Process

### 1. Developer: Implement Feature
- Follow 8-phase template
- Use provided code examples
- Run all tests locally
- Self-review against checklist

### 2. Reviewer: Verify Sync
- Check database schema
- Verify TypeScript types
- Compare mock vs supabase
- Validate form bindings
- Run automated checks

### 3. Merge Gate: Automated
- ESLint: 0 errors
- TypeScript: 0 errors
- Tests: 100% pass
- Build: Success

**See**: `layer-sync-enforcement.md` → "Code Review Checklist Template"

---

## 📊 Quality Metrics

Track these to ensure high quality:

```
Goal: < 0.5% field mapping errors per 100 PRs
Goal: < 1% type mismatches per 100 PRs
Goal: > 90% test coverage
Goal: 100% merge gate pass rate
Goal: < 30 min average review time
```

---

## 🔧 Tools & Scripts

### ESLint Rules
Prevent direct backend imports (use factory instead):
```javascript
'no-direct-service-imports': ['error', {...}]
```

### Git Hooks (Husky)
Pre-commit: Type alignment check  
Pre-push: Layer sync tests

### Tests Required
1. Service parity test (mock vs supabase)
2. Field mapping test
3. Form integration test
4. Validation rules test

---

## 📖 Related Documentation

- **Repository Structure**: `.zencoder/rules/repo.md`
- **Code Quality Standards**: `.zencoder/rules/new-zen-rule.md`
- **Documentation Sync**: `.zencoder/rules/documentation-sync.md`
- **Module Examples**: `/src/modules/features/*/DOC.md`

---

## 🎓 Learning Path

**For New Developers**:
1. Read: `standardized-layer-development.md` (understand architecture)
2. Study: Real module example (e.g., `/src/modules/features/products/`)
3. Follow: 8-phase template for your first feature
4. Review: Code review comments to learn best practices

**For Reviewers**:
1. Read: `layer-sync-enforcement.md` (full checklist)
2. Use: Automated checks to validate
3. Reference: `standardized-layer-development.md` for edge cases
4. Enforce: All quality gates before merge

**For Team Leads**:
1. Setup: Git hooks and ESLint rules
2. Configure: CI/CD automated checks
3. Monitor: Quality metrics dashboard
4. Adjust: Process based on metrics

---

## ❓ FAQ

**Q: Can I skip the mock service for internal features?**  
A: No. Mock service enables development without backend, critical for testing. Always implement.

**Q: What if field name is same in database and TypeScript?**  
A: Still map explicitly in query: `field_name as fieldName`. Consistency matters.

**Q: How do I handle composite fields (e.g., firstName + lastName = fullName)?**  
A: Keep database fields separate. Compose in TypeScript interface or UI component.

**Q: Can I use direct imports for utility services?**  
A: Yes, but use factory pattern for entity services. Only direct import for utilities (validationService, errorHandler).

**Q: What about circular dependencies?**  
A: Use factory pattern to break cycles. Services never import services directly.

**Q: How do I handle enums?**  
A: Define once in database (CREATE TYPE enum), mirror in TypeScript with union types, validate with Zod.

---

## 🚀 Success Indicators

You're doing it right when:

✅ Form field names match database columns  
✅ Type errors caught before compile  
✅ Validation same in all layers  
✅ Mock and supabase return identical types  
✅ Cache invalidation prevents stale data  
✅ No runtime type errors  
✅ Easy to add new fields (5 min per layer)  
✅ Easy to trace data flow (UI → Hook → Service → DB)  
✅ Tests pass 100% in CI/CD  
✅ New developers can implement features without guidance

---

## 📞 Support & Questions

- **Architecture questions**: See `standardized-layer-development.md`
- **Implementation help**: See `layer-sync-implementation-guide.md`
- **Code review guidance**: See `layer-sync-enforcement.md`
- **Real examples**: Check `/src/modules/features/*/` actual code

---

## Version History

- **v1.0.0** (2025-01-30): Initial ruleset with 3 core documents
  - Standardized layer development process
  - Implementation guide with templates
  - Enforcement rules and code review gates

---

**Status**: ✅ **ACTIVE** - All enforcement rules apply to all development  
**Last Updated**: 2025-01-30  
**Next Review**: Quarterly

---

## 📋 Master File Reference

| File | Purpose | When to Read |
|------|---------|-------------|
| `standardized-layer-development.md` | Architecture & patterns | First - understand overall design |
| `layer-sync-implementation-guide.md` | Code templates & examples | When implementing features |
| `layer-sync-enforcement.md` | Code review & CI/CD gates | During PR review or setup |
| `LAYER_SYNC_RULESET_INDEX.md` | This file - Quick reference | Quick lookup & navigation |

---

**👉 Start Here: Read `standardized-layer-development.md` first to understand the complete architecture.**
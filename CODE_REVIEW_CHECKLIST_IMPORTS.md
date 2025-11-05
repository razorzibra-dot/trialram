# ✅ Code Review Checklist - Import Patterns

**Purpose**: Checklist for code reviewers to verify import pattern compliance  
**Audience**: Code reviewers, tech leads, maintainers  
**Last Updated**: February 2025  

---

## 🎯 Pre-Review Automation

Before manual review, verify:

```bash
# Command to run before starting review:
npm run lint && npx tsc --noEmit && npm run build
```

If these pass, most import violations are already caught. Manual review checks for edge cases and architectural intent.

---

## ✅ Service Import Verification

**Question**: Does the code import services?

### Checklist

- [ ] Service imports use `@/services/serviceFactory` (not direct import)
- [ ] Imports use aliasing pattern for clarity: `as factoryServiceName`
- [ ] No imports from `@/services/[serviceName]Service.ts`
- [ ] No imports from `@/services/api/supabase/` directory
- [ ] Service calls are awaited (async pattern)
- [ ] Error handling present for async calls
- [ ] Works with both `VITE_API_MODE=mock` and `VITE_API_MODE=supabase`

### ✅ PASS Examples

```typescript
// Good: Factory import with aliasing
import { complaintService as factoryComplaintService } from '@/services/serviceFactory';

const complaints = await factoryComplaintService.getComplaints(tenantId);
```

```typescript
// Good: Multiple services with clear aliasing
import { 
  complaintService as factoryComplaintService,
  notificationService as factoryNotificationService 
} from '@/services/serviceFactory';

const complaints = await factoryComplaintService.getComplaints();
const notifications = await factoryNotificationService.getNotifications();
```

### ❌ FAIL Examples

```typescript
// Bad: Direct service import
import complaintService from '@/services/complaintService';
// Reason: Bypasses factory, mode switching fails

// Bad: Supabase service import
import { supabaseComplaintService } from '@/services/api/supabase/complaintService';
// Reason: Violates abstraction, breaks when switching modes

// Bad: No error handling
const data = await factoryService.fetch();
setData(data);
// Reason: Silent failures, no user feedback
```

---

## ✅ Type Import Verification

**Question**: Does the code import types?

### Checklist

- [ ] Types imported from `@/types` (not from services)
- [ ] Types use `import type` keyword (not `import`)
- [ ] No duplicate type definitions in component files
- [ ] Types exported from `@/types/index.ts`
- [ ] Type names follow pattern: `TypeName` (PascalCase)
- [ ] No types defined in service files

### ✅ PASS Examples

```typescript
// Good: Type from @/types
import type { ComplaintType, ComplaintStatus } from '@/types';

const complaint: ComplaintType = {
  id: '1',
  title: 'Issue',
  status: 'open' as ComplaintStatus
};
```

```typescript
// Good: Exported and properly re-exported
// src/types/complaints.ts
export type ComplaintType = { /* ... */ };

// src/types/index.ts
export * from './complaints';
```

### ❌ FAIL Examples

```typescript
// Bad: Type from service file
import type { ComplaintType } from '@/services/complaintService';
// Reason: Creates dependency on service for types, scattered definitions

// Bad: Inline type definition
interface ComplaintType {
  id: string;
  title: string;
}
// Reason: Should be in @/types for reuse, centralization

// Bad: Not using type keyword
import { ComplaintType } from '@/types';
// Should be: import type { ComplaintType } from '@/types';
```

---

## ✅ Service Files Verification

**Question**: Is this a service file?

### Checklist (applies if reviewing `src/services/**/*.ts`)

- [ ] No imports from `@/modules/` (prevents circular dependencies)
- [ ] Only imports types from `@/types`
- [ ] No imports from other services (no service-to-service calls)
- [ ] Only pure functions, no React hooks
- [ ] Exports both mock and Supabase implementations
- [ ] Factory correctly routes between implementations
- [ ] Mock service has realistic mock data
- [ ] Supabase service maps columns (snake_case → camelCase)

### ✅ PASS Example

```typescript
// src/services/complaintService.ts (Mock)
import type { ComplaintType } from '@/types';

const mockComplaints: ComplaintType[] = [
  { id: '1', title: 'Test', status: 'open', tenantId: 'tenant_1' }
];

export const mockComplaintService = {
  getComplaints: async (tenantId: string): Promise<ComplaintType[]> => {
    return mockComplaints.filter(c => c.tenantId === tenantId);
  },
};
```

```typescript
// src/services/serviceFactory.ts
import { mockComplaintService } from './complaintService';
import { supabaseComplaintService } from './api/supabase/complaintService';

const apiMode = import.meta.env.VITE_API_MODE || 'mock';

function getComplaintService() {
  return apiMode === 'supabase' ? supabaseComplaintService : mockComplaintService;
}

export const complaintService = {
  getComplaints: (tenantId: string) => getComplaintService().getComplaints(tenantId),
};
```

### ❌ FAIL Examples

```typescript
// Bad: Service importing from module
import type { ComplaintType } from '@/modules/features/complaints/types';
// Reason: Circular dependency with module importing the service

// Bad: Service calling other service
import { notificationService } from '@/services/notificationService';
export const complaintService = {
  create: async (data) => {
    const result = await notificationService.notify(...);
    // ...
  }
};
// Reason: Services should be independent

// Bad: Service using React hooks
import { useState } from 'react';
export const complaintService = {
  getComplaints: () => {
    const [data, setData] = useState([]);
    // ...
  }
};
// Reason: Services are not React components
```

---

## ✅ Hook Files Verification

**Question**: Is this a hook file?

### Checklist (applies if reviewing `src/**/hooks/**/*.ts`)

- [ ] Uses factory service imports (not direct)
- [ ] Properly handles async/await
- [ ] Types imported from `@/types`
- [ ] No imports from service files directly
- [ ] Returns proper loading/error/data state
- [ ] useEffect dependencies correct (or useCallback for functions)
- [ ] Cache invalidation handles (refetch, invalidate queries)
- [ ] No circular imports with components

### ✅ PASS Example

```typescript
import { useState, useEffect } from 'react';
import type { ComplaintType } from '@/types';
import { complaintService as factoryComplaintService } from '@/services/serviceFactory';

export const useComplaints = (tenantId: string) => {
  const [data, setData] = useState<ComplaintType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await factoryComplaintService.getComplaints(tenantId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenantId]);

  return { data, loading, error };
};
```

### ❌ FAIL Examples

```typescript
// Bad: Direct service import
import complaintService from '@/services/complaintService';
// Reason: Bypasses factory pattern

// Bad: Type from service
import type { ComplaintType } from '@/services/complaintService';
// Reason: Types belong in @/types

// Bad: Missing error handling
export const useComplaints = () => {
  const [data, setData] = useState([]);
  useEffect(() => {
    complaintService.fetch().then(setData);
  }, []);
  return data;
};
// Reason: No loading state, no error state, no dependencies

// Bad: Circular import potential
import { useComplaints } from '@/modules/features/complaints/hooks';
import { ComplaintService } from '@/modules/features/complaints/service';
// (if in a service file)
// Reason: Services shouldn't import hooks
```

---

## ✅ Component Files Verification

**Question**: Is this a component file?

### Checklist (applies if reviewing components)

- [ ] Uses factory service imports (not direct)
- [ ] Never imports Supabase directly
- [ ] Types imported from `@/types`
- [ ] Prefers custom hooks for data fetching
- [ ] No direct Supabase client usage
- [ ] Service calls in useEffect or event handlers
- [ ] Error boundaries for error handling
- [ ] Loading states shown to user

### ✅ PASS Example

```typescript
import React, { useEffect, useState } from 'react';
import type { ComplaintType } from '@/types';
import { complaintService as factoryComplaintService } from '@/services/serviceFactory';

export const ComplaintList: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await factoryComplaintService.getComplaints();
        setComplaints(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {complaints.map(c => (
        <div key={c.id}>{c.title}</div>
      ))}
    </div>
  );
};
```

### ❌ FAIL Examples

```typescript
// Bad: Direct service import
import complaintService from '@/services/complaintService';
// Reason: Bypasses factory

// Bad: Direct Supabase usage
import { supabase } from '@/services/supabase';
// Reason: Violates abstraction

// Bad: No error handling
export const List: React.FC = () => {
  const [data, setData] = useState([]);
  useEffect(() => {
    complaintService.fetch().then(setData);
  }, []);
  return <div>{data}</div>;
};
// Reason: No error state, no loading state
```

---

## 🚫 Red Flags

❌ **STOP the review** and request changes if you see:

| Red Flag | Action |
|----------|--------|
| Direct import from `@/services/[serviceName]Service` | Request factory pattern |
| Direct import from `@/services/api/supabase/` | Request factory pattern |
| `import type` from service file | Request `@/types` import |
| Service file importing from `@/modules/` | Reject - circular dependency risk |
| Component calling another component's service | Request separation of concerns |
| No error handling for async calls | Request try/catch blocks |
| No loading state in UI | Request loading indicator |
| Hardcoded Supabase logic in component | Request service layer abstraction |

---

## ✅ Green Lights

✅ **APPROVE if you see**:

- [ ] All service imports from `@/services/serviceFactory`
- [ ] All type imports from `@/types`
- [ ] Service files only import from `@/types`
- [ ] Proper error handling for async operations
- [ ] Loading and error states managed
- [ ] No circular dependencies
- [ ] Code follows the 8-layer architecture pattern
- [ ] Works with both mock and Supabase modes
- [ ] ESLint passes: `npm run lint`
- [ ] TypeScript passes: `npx tsc --noEmit`
- [ ] Build passes: `npm run build`

---

## 📋 Review Workflow

### Before Reviewing

1. [ ] Pull latest main branch
2. [ ] Run `npm install` if dependencies changed
3. [ ] Run `npm run lint && npx tsc --noEmit && npm run build`
4. [ ] Read the PR description to understand the change

### During Review

1. [ ] Use sections above matching the file type
2. [ ] Check each box in the relevant section
3. [ ] Look for red flags from the table
4. [ ] Test locally if complex: `npm run dev`
5. [ ] Verify both modes work if services touched

### After Review

- [ ] **APPROVE** if all checks pass
- [ ] **REQUEST CHANGES** if any red flags found
- [ ] **COMMENT** with specific fixes needed
- [ ] Re-review after developer makes changes

---

## 🆘 Common Review Comments

### Comment: "Use factory pattern for service"

```typescript
// Current:
import complaintService from '@/services/complaintService';

// Suggested:
import { complaintService as factoryComplaintService } from '@/services/serviceFactory';
```

### Comment: "Import type from @/types"

```typescript
// Current:
import type { ComplaintType } from '@/services/complaintService';

// Suggested:
import type { ComplaintType } from '@/types';
```

### Comment: "Add error handling"

```typescript
// Current:
const data = await service.fetch();
setData(data);

// Suggested:
try {
  const data = await service.fetch();
  setData(data);
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error');
}
```

### Comment: "Service can't import from modules"

```typescript
// Current (in a service file):
import { useComplaints } from '@/modules/features/complaints/hooks';
import type { ComplaintType } from '@/modules/features/complaints/types';

// Suggested (in a service file):
import type { ComplaintType } from '@/types';
// Don't import hooks or components in service files!
```

---

## 📚 References

- **Developer Guide**: `DEVELOPER_GUIDE_IMPORT_PATTERNS.md` - What developers should read
- **ESLint Rules**: `.eslintrc.js` - Architecture rules that catch violations
- **Service Factory**: `COMPLETION_GUIDE_PHASES.md` (Phase 2) - Details on factory pattern
- **Type System**: `COMPLETION_GUIDE_PHASES.md` (Phase 3) - Details on type centralization

---

## 💡 Quick Tips

1. **Before reviewing**: Run tests locally with `npm run dev` to verify mode switching works
2. **Use search**: Search file for patterns: `from '@/services/'`, `from '@/modules/`, `import type`
3. **Use ESLint**: If ESLint passes, import patterns are correct
4. **Ask questions**: If unsure, check recent approved PRs for similar changes
5. **Trust the rules**: If ESLint doesn't complain, the pattern is approved

---

**Questions during review?** Check DEVELOPER_GUIDE_IMPORT_PATTERNS.md or ask in team channel.

**Document Version**: 1.0  
**Created**: February 2025  
**Maintained By**: Development Team
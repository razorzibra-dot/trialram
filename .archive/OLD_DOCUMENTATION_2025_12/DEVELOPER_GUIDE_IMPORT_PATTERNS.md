# 📖 Developer Guide - Import Patterns

**Purpose**: Quick reference guide for developers on correct import patterns in the PDS-CRM application.  
**Audience**: All developers working on this project  
**Last Updated**: February 2025  

---

## 🎯 Quick Reference

### When importing a Service

✅ **CORRECT** - Use serviceFactory:
```typescript
import { complaintService } from '@/services/serviceFactory';
import { notificationService, customerService } from '@/services/serviceFactory';
import { productSaleService as factoryProductSaleService } from '@/services/serviceFactory';

// Usage
const complaints = await factoryComplaintService.getComplaints();
const notifications = await notificationService.getNotifications();
```

❌ **WRONG** - Direct service import:
```typescript
import complaintService from '@/services/complaintService';  // ❌ Don't do this
import { complaintService } from '@/services/complaintService';  // ❌ Direct import
import { supabaseComplaintService } from '@/services/api/supabase/complaintService';  // ❌ Never this
```

### When importing a Type

✅ **CORRECT** - Import from @/types:
```typescript
import type { ComplaintType, ComplaintStatus, NotificationType } from '@/types';
import type { ProductSale, ProductSaleStatus } from '@/types';

// Usage
const complaint: ComplaintType = { id: '1', title: 'Test' };
const status: ComplaintStatus = 'open';
```

❌ **WRONG** - Type from service:
```typescript
import type { ComplaintType } from '@/services/complaintService';  // ❌ Wrong source
import type { NotificationType } from '@/services/uiNotificationService';  // ❌ Wrong source
```

### In Service Files

✅ **CORRECT** - Import types from @/types:
```typescript
// src/services/complaintService.ts
import type { ComplaintType, ComplaintStatus } from '@/types';
import type { PaginatedResponse } from '@/types/service';

export const mockComplaintService = {
  getComplaints: async (tenantId: string): Promise<ComplaintType[]> => {
    // Implementation
  }
};
```

❌ **WRONG** - Import from modules:
```typescript
// src/services/complaintService.ts
import type { ComplaintType } from '@/modules/features/complaints/types';  // ❌ Circular!
import { ComplaintModule } from '@/modules/features/complaints';  // ❌ Circular!
import { useComplaints } from '@/modules/features/complaints/hooks';  // ❌ Never in service
```

---

## 🔍 Decision Tree

**Start here when adding an import:**

```
Do I need to import a SERVICE?
├─ YES → Use '@/services/serviceFactory'
│        Example: import { complaintService } from '@/services/serviceFactory'
│        
└─ NO → Do I need to import a TYPE?
        ├─ YES → Use '@/types' 
        │        Example: import type { ComplaintType } from '@/types'
        │        
        └─ NO → Do I need to import a COMPONENT?
                ├─ YES → Use relative path or '@/components'
                │        Example: import ComplaintForm from '@/components/complaints/ComplaintForm'
                │        
                └─ NO → Am I writing a SERVICE file?
                        ├─ YES → Only import types from '@/types', NEVER from @/modules/
                        │        
                        └─ NO → Follow standard import rules
```

---

## 📋 Import Patterns by File Type

### 🧩 In Components/Pages

```typescript
import React, { useState, useEffect } from 'react';

// ✅ DO: Import types from @/types
import type { ComplaintType, NotificationType } from '@/types';

// ✅ DO: Import services via factory
import { complaintService as factoryComplaintService, notificationService } from '@/services/serviceFactory';

// ✅ DO: Import custom hooks
import { useComplaints } from '@/modules/features/complaints/hooks';

// ✅ DO: Import other components
import ComplaintForm from '@/components/complaints/ComplaintForm';
import NotificationBanner from '@/components/notifications/NotificationBanner';

export const ComplaintDetailPage: React.FC = () => {
  const [complaint, setComplaint] = useState<ComplaintType | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      const data = await factoryComplaintService.getComplaints();
      setComplaint(data[0]);
    };
    fetchData();
  }, []);
  
  return <div>{complaint?.title}</div>;
};
```

### 🪝 In Hooks

```typescript
import { useState, useEffect, useCallback } from 'react';

// ✅ DO: Import types from @/types
import type { ComplaintType, ComplaintStatus } from '@/types';

// ✅ DO: Import services via factory
import { complaintService as factoryComplaintService } from '@/services/serviceFactory';

// ❌ DON'T: Import directly from services
// import complaintService from '@/services/complaintService';

export const useComplaints = (tenantId: string) => {
  const [complaints, setComplaints] = useState<ComplaintType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadComplaints = async () => {
      try {
        setLoading(true);
        const data = await factoryComplaintService.getComplaints(tenantId);
        setComplaints(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadComplaints();
  }, [tenantId]);

  return { complaints, loading, error };
};
```

### 🔧 In Service Files

```typescript
// src/services/complaintService.ts (mock implementation)
import type { ComplaintType, ComplaintStatus, PaginatedResponse } from '@/types';

// ✅ DO: Import types from @/types
// ✅ DO: Use only utility imports if needed
// ❌ DON'T: Import from @/modules
// ❌ DON'T: Import from other services

const mockComplaints: ComplaintType[] = [
  { id: '1', title: 'Complaint 1', status: 'open', tenantId: 'tenant_1' },
];

export const mockComplaintService = {
  getComplaints: async (tenantId: string): Promise<ComplaintType[]> => {
    return mockComplaints.filter(c => c.tenantId === tenantId);
  },

  createComplaint: async (data: ComplaintType): Promise<ComplaintType> => {
    const newComplaint = { ...data, id: `complaint_${Date.now()}` };
    mockComplaints.push(newComplaint);
    return newComplaint;
  },

  // ... other methods
};
```

### 🏭 In Service Factory

```typescript
// src/services/serviceFactory.ts
import type { ComplaintType } from '@/types';

// Import both implementations
import { mockComplaintService } from './complaintService';
import { supabaseComplaintService } from './api/supabase/complaintService';

// ✅ DO: Check environment and route to correct implementation
const apiMode = import.meta.env.VITE_API_MODE || 'mock';

function getComplaintService() {
  return apiMode === 'supabase' 
    ? supabaseComplaintService 
    : mockComplaintService;
}

// ✅ DO: Export wrapped service
export const complaintService = {
  getComplaints: (tenantId: string) => getComplaintService().getComplaints(tenantId),
  createComplaint: (data: ComplaintType) => getComplaintService().createComplaint(data),
  // ... all other methods
};

// ✅ DO: Export from index.ts
// Add to src/services/index.ts:
// export { complaintService } from './serviceFactory';
```

---

## 🚫 Common Mistakes & How to Fix Them

### Mistake 1: Direct Service Import in Component

```typescript
// ❌ WRONG
import complaintService from '@/services/complaintService';

// ✅ CORRECT
import { complaintService as factoryComplaintService } from '@/services/serviceFactory';
```

**Why?** Direct import bypasses the factory pattern, preventing mode switching (mock/Supabase).

---

### Mistake 2: Type Import from Service File

```typescript
// ❌ WRONG
import type { ComplaintType } from '@/services/complaintService';

// ✅ CORRECT
import type { ComplaintType } from '@/types';
```

**Why?** Types should be centralized in @/types to prevent circular dependencies.

---

### Mistake 3: Service Importing from Module

```typescript
// ❌ WRONG (in src/services/complaintService.ts)
import type { ComplaintType } from '@/modules/features/complaints/types';
import { useComplaints } from '@/modules/features/complaints/hooks';

// ✅ CORRECT (in src/services/complaintService.ts)
import type { ComplaintType } from '@/types';
```

**Why?** Services importing from modules creates circular dependencies that break builds.

---

### Mistake 4: Missing Factory Aliasing

```typescript
// ⚠️ AMBIGUOUS (when multiple services used)
import { complaintService, notificationService } from '@/services/serviceFactory';

// ✅ BETTER (with aliasing for clarity)
import { complaintService as factoryComplaintService, notificationService as factoryNotificationService } from '@/services/serviceFactory';
```

**Why?** Aliasing makes it clear we're using factory pattern, preventing accidental direct imports.

---

## 📋 Pre-Commit Checklist

Before committing your code, verify:

```bash
# 1. Auto-fix what's possible
npm run lint -- --fix

# 2. Check for import violations
npm run lint | grep -E "(no-direct-service-imports|no-service-module-imports|type-import-location)"
# Should return nothing (no violations)

# 3. Verify TypeScript compiles
npx tsc --noEmit

# 4. Verify build succeeds
npm run build
```

---

## 🆘 Troubleshooting

### Issue: ESLint error "no-direct-service-imports"

**Solution**: Change the import path:
```typescript
// Change this:
import { complaintService } from '@/services/complaintService';

// To this:
import { complaintService as factoryComplaintService } from '@/services/serviceFactory';
```

### Issue: ESLint error "no-service-module-imports"

**Solution**: If you're in a service file, remove module imports:
```typescript
// Remove this (if in a service file):
import { useComplaints } from '@/modules/features/complaints/hooks';

// And replace with (in the service file):
import type { ComplaintType } from '@/types';
```

### Issue: TypeScript error "Cannot find name 'ComplaintType'"

**Solution**: Import the type from @/types:
```typescript
// Change this:
import type { ComplaintType } from '@/services/complaintService';

// To this:
import type { ComplaintType } from '@/types';

// Then verify it exists in src/types/index.ts
```

### Issue: Build fails with circular dependency error

**Solution**: Check if any service file imports from @/modules. Services should only import from @/types:
```bash
# Find the culprit:
grep -n "from '@/modules" src/services/*.ts src/services/**/*.ts

# Fix by moving types to @/types and importing from there
```

---

## 📚 Related Documentation

- **Repository Architecture**: `.zencoder/rules/repo.md` - System-wide architecture patterns
- **Code Review Checklist**: `CODE_REVIEW_CHECKLIST_IMPORTS.md` - What to check when reviewing PRs
- **Service Factory Pattern**: `COMPLETION_GUIDE_PHASES.md` (Phase 2) - Deep dive into factory pattern
- **Type Centralization**: `COMPLETION_GUIDE_PHASES.md` (Phase 3) - Type organization strategy

---

## 💡 Best Practices Summary

| Situation | Pattern | Example |
|-----------|---------|---------|
| Using a service in component | Factory pattern | `import { service as factoryService } from '@/services/serviceFactory'` |
| Defining types | Centralize in @/types | `import type { Type } from '@/types'` |
| In service files | Only @/types imports | `import type { Type } from '@/types'` |
| Multiple services in component | Use aliasing | `import { svc1 as factorySvc1, svc2 as factorySvc2 } from '@/services/serviceFactory'` |
| Creating new service | Update factory | Add getter function to `serviceFactory.ts` |

---

**Remember**: When in doubt, use the decision tree above or ask in the team channel!

**Questions?** Review CODE_REVIEW_CHECKLIST_IMPORTS.md or check recent PRs for examples.

---

**Document Version**: 1.0  
**Created**: February 2025  
**Maintained By**: Development Team
# Import Fixes Checklist - File-by-File Actions

**Status**: Ready for Implementation  
**Total Files**: 30  
**Estimated Time**: 4-6 hours  
**Priority**: CRITICAL → HIGH → MEDIUM  

---

## 🔴 CRITICAL FIXES (Fix Immediately - Before Any Deployment)

### Must fix ALL 4 files - Blocks production builds

---

### CRITICAL #1
**File**: `src/services/serviceContractService.ts`  
**Line**: 28  
**Severity**: 🔴 CRITICAL - Circular Dependency

**Current Issue**:
```typescript
import { PaginatedResponse } from '@/modules/core/types';  // ❌ WRONG
```

**Action**: Replace with centralized type
```typescript
import { PaginatedResponse } from '@/types';  // ✅ CORRECT
```

**Why**: Services should NEVER import from modules. This creates a circular chain:
- modules → services (OK)
- services → modules (❌ CIRCULAR)

**Verification**:
```bash
npx tsc --noEmit  # Should show 0 errors
```

---

### CRITICAL #2
**File**: `src/services/supabase/serviceContractService.ts`  
**Line**: 28  
**Severity**: 🔴 CRITICAL - Circular Dependency

**Current Issue**:
```typescript
import { PaginatedResponse } from '@/modules/core/types';  // ❌ WRONG
```

**Action**: Replace with centralized type
```typescript
import { PaginatedResponse } from '@/types';  // ✅ CORRECT
```

**Note**: Same issue as CRITICAL #1, but in Supabase implementation

---

### CRITICAL #3
**File**: `src/services/superAdminManagementService.ts`  
**Line**: 19  
**Severity**: 🔴 CRITICAL - Circular Dependency

**Current Issue**:
```typescript
import {
  SuperAdminDTO,
  CreateSuperAdminInput,
  PromoteSuperAdminInput,
  SuperAdminTenantAccess,
  GrantTenantAccessInput,
  RevokeTenantAccessInput,
  SuperAdminStatsDTO,
  SuperAdminActionLog,
  ISuperAdminManagementService
} from '@/modules/features/super-admin/types/superAdminManagement';  // ❌ WRONG
```

**Action**: Replace ALL imports with centralized types
```typescript
import {
  SuperAdminDTO,
  CreateSuperAdminInput,
  PromoteSuperAdminInput,
  SuperAdminTenantAccess,
  GrantTenantAccessInput,
  RevokeTenantAccessInput,
  SuperAdminStatsDTO,
  SuperAdminActionLog,
  ISuperAdminManagementService
} from '@/types';  // ✅ CORRECT
```

**Impact**: Affects entire super admin functionality - critical to fix

---

### CRITICAL #4
**File**: `src/services/api/supabase/superAdminManagementService.ts`  
**Line**: 19  
**Severity**: 🔴 CRITICAL - Circular Dependency

**Current Issue**:
```typescript
import {
  SuperAdminDTO,
  CreateSuperAdminInput,
  PromoteSuperAdminInput,
  SuperAdminTenantAccess,
  GrantTenantAccessInput,
  RevokeTenantAccessInput,
  SuperAdminStatsDTO,
  SuperAdminActionLog,
  ISuperAdminManagementService
} from '@/modules/features/super-admin/types/superAdminManagement';  // ❌ WRONG
```

**Action**: Replace ALL imports with centralized types
```typescript
import {
  SuperAdminDTO,
  CreateSuperAdminInput,
  PromoteSuperAdminInput,
  SuperAdminTenantAccess,
  GrantTenantAccessInput,
  RevokeTenantAccessInput,
  SuperAdminStatsDTO,
  SuperAdminActionLog,
  ISuperAdminManagementService
} from '@/types';  // ✅ CORRECT
```

**Note**: Same fix as CRITICAL #3, but in Supabase implementation

**Verification After Critical Fixes**:
```bash
# Run all checks
npx tsc --noEmit
npm run lint
npm run build
```

---

## 🟠 HIGH PRIORITY FIXES (This Sprint)

### Components with Direct Service Imports

---

### HIGH #1
**File**: `src/components/auth/SessionTimeoutWarning.tsx`  
**Line**: (locate via import statement)  
**Type**: Component - UI Pattern Issue

**Current Issue**:
```typescript
import { uiNotificationService } from '@/services/uiNotificationService';  // ❌ WRONG
```

**Problem**: Component directly importing service (bypasses factory pattern)

**Solution - Option A (Recommended - Use Notification Context)**:
```typescript
import { useNotification } from '@/contexts/NotificationContext';  // ✅ CORRECT

export function SessionTimeoutWarning() {
  const { show } = useNotification();
  
  const handleTimeout = () => {
    show('Session timeout warning', 'warning');
  };
  
  return <.../>
}
```

**Solution - Option B (Alternative - Use Service Hook)**:
```typescript
import { useNotificationService } from '@/hooks/useNotificationService';  // ✅ CORRECT

export function SessionTimeoutWarning() {
  const notification = useNotificationService();
  
  const handleTimeout = () => {
    notification.show('Session timeout warning', 'warning');
  };
  
  return <.../>
}
```

**Choose**: Option A if notification context exists, Option B otherwise

---

### HIGH #2  
**File**: `src/components/complaints/ComplaintDetailModal.tsx`  
**Severity**: 🟠 HIGH - 2 Direct Service Imports

**Current Issues**:
```typescript
import { complaintService } from '@/services/complaintService';  // ❌ WRONG
import { uiNotificationService } from '@/services/uiNotificationService';  // ❌ WRONG
```

**Solution - Use Hooks**:
```typescript
import { useComplaintService } from '@/hooks/useComplaintService';  // ✅ CORRECT
import { useNotificationService } from '@/hooks/useNotificationService';  // ✅ CORRECT
// OR use context
import { useNotification } from '@/contexts/NotificationContext';  // ✅ CORRECT

export function ComplaintDetailModal() {
  const { getComplaint } = useComplaintService();
  const { show } = useNotification();
  
  const handleSubmit = async (data) => {
    try {
      await getComplaint(data.id);
      show('Loaded!', 'success');
    } catch (err) {
      show('Error loading complaint', 'error');
    }
  };
  
  return <.../>
}
```

**Verification**:
- [ ] Import only from hooks/contexts
- [ ] Remove direct service imports
- [ ] Test component renders
- [ ] Test error/success messages

---

### HIGH #3
**File**: `src/components/complaints/ComplaintFormModal.tsx`  
**Severity**: 🟠 HIGH - 2 Direct Service Imports

**Current Issues**:
```typescript
import { complaintService } from '@/services/complaintService';  // ❌ WRONG
import { uiNotificationService } from '@/services/uiNotificationService';  // ❌ WRONG
```

**Solution - Same as HIGH #2**:
```typescript
import { useComplaintService } from '@/hooks/useComplaintService';
import { useNotification } from '@/contexts/NotificationContext';
// Use hooks/context instead of service imports
```

---

### HIGH #4
**File**: `src/components/configuration/ConfigurationFormModal.tsx`  
**Severity**: 🟠 HIGH

**Current Issue**:
```typescript
import { notificationService } from '@/services/uiNotificationService';  // ❌ WRONG
```

**Solution**:
```typescript
import { useNotification } from '@/contexts/NotificationContext';  // ✅ CORRECT
// OR
import { useNotificationService } from '@/hooks/useNotificationService';  // ✅ CORRECT
```

---

### HIGH #5
**File**: `src/components/configuration/SuperAdminSettings.tsx`  
**Severity**: 🟠 HIGH

**Current Issue**:
```typescript
import { notificationService } from '@/services/uiNotificationService';  // ❌ WRONG
```

**Solution**:
```typescript
import { useNotification } from '@/contexts/NotificationContext';  // ✅ CORRECT
```

---

### HIGH #6
**File**: `src/components/configuration/TenantAdminSettings.tsx`  
**Severity**: 🟠 HIGH

**Current Issue**:
```typescript
import { notificationService } from '@/services/uiNotificationService';  // ❌ WRONG
```

**Solution**:
```typescript
import { useNotification } from '@/contexts/NotificationContext';  // ✅ CORRECT
```

---

### HIGH #7
**File**: `src/components/contracts/ContractAnalytics.tsx`  
**Severity**: 🟠 HIGH

**Current Issue**:
```typescript
import { notificationService } from '@/services/uiNotificationService';  // ❌ WRONG
```

**Solution**:
```typescript
import { useNotification } from '@/contexts/NotificationContext';  // ✅ CORRECT
```

---

### HIGH #8
**File**: `src/components/contracts/ContractFormModal.tsx`  
**Severity**: 🟠 HIGH

**Current Issue**:
```typescript
import { notificationService } from '@/services/uiNotificationService';  // ❌ WRONG
```

**Solution**:
```typescript
import { useNotification } from '@/contexts/NotificationContext';  // ✅ CORRECT
```

---

### HIGH #9
**File**: `src/components/masters/CompanyFormModal.tsx`  
**Severity**: 🟠 HIGH - 2 Direct Service Imports

**Current Issues**:
```typescript
import { notificationService } from '@/services/uiNotificationService';  // ❌ WRONG
import { companyService } from '@/services/companyService';  // ❌ WRONG
```

**Solution**:
```typescript
import { useNotification } from '@/contexts/NotificationContext';
import { useCompanyService } from '@/hooks/useCompanyService';  // Use factory service via hook
```

---

### HIGH #10
**File**: `src/components/masters/ProductFormModal.tsx`  
**Severity**: 🟠 HIGH - 2 Direct Service Imports

**Current Issues**:
```typescript
import { notificationService } from '@/services/uiNotificationService';  // ❌ WRONG
import { productService } from '@/services/productService';  // ❌ WRONG
```

**Solution**:
```typescript
import { useNotification } from '@/contexts/NotificationContext';
import { useProductService } from '@/hooks/useProductService';  // Use factory service via hook
```

---

### HIGH #11
**File**: `src/components/notifications/TemplateManager.tsx`  
**Severity**: 🟠 HIGH

**Current Issue**:
```typescript
import { templateService } from '@/services/templateService';  // ❌ WRONG
```

**Solution**:
```typescript
import { useTemplateService } from '@/hooks/useTemplateService';  // ✅ CORRECT
// OR create custom hook if doesn't exist
```

---

### HIGH #12
**File**: `src/components/product-sales/ProductSaleDetail.tsx`  
**Severity**: 🟠 HIGH

**Current Issue**:
```typescript
import { serviceContractService } from '@/services/serviceContractService';  // ❌ WRONG
```

**Solution**:
```typescript
import { useServiceContractService } from '@/hooks/useServiceContractService';  // ✅ CORRECT
```

---

### HIGH #13
**File**: `src/components/product-sales/ProductSaleForm.tsx`  
**Severity**: 🟠 HIGH

**Current Issue**:
```typescript
import { productService } from '@/services/productService';  // ❌ WRONG
```

**Solution**:
```typescript
import { useProductService } from '@/hooks/useProductService';  // ✅ CORRECT
```

---

### HIGH #14
**File**: `src/components/syslogs/LogExportDialog.tsx`  
**Severity**: 🟠 HIGH

**Current Issue**:
```typescript
import { notificationService } from '@/services/uiNotificationService';  // ❌ WRONG
```

**Solution**:
```typescript
import { useNotification } from '@/contexts/NotificationContext';  // ✅ CORRECT
```

---

### HIGH #15
**File**: `src/components/syslogs/SystemHealthDashboard.tsx`  
**Severity**: 🟠 HIGH

**Current Issue**:
```typescript
import { notificationService } from '@/services/uiNotificationService';  // ❌ WRONG
```

**Solution**:
```typescript
import { useNotification } from '@/contexts/NotificationContext';  // ✅ CORRECT
```

---

### HIGH #16
**File**: `src/contexts/AuthContext.tsx`  
**Severity**: 🟠 HIGH - Context Layer Issue - 3 Direct Service Imports

**Current Issues**:
```typescript
import { sessionConfigService } from '@/services/sessionConfigService';  // ❌ WRONG
import { uiNotificationService } from '@/services/uiNotificationService';  // ❌ WRONG
import { multiTenantService, type TenantContext } from '@/services/supabase/multiTenantService';  // ❌ MULTIPLE ISSUES
```

**Problems**:
1. Direct service imports (should use factory)
2. Type imported from service (should be from @/types)
3. Importing Supabase-specific service (breaks mock mode)

**Solution**:
```typescript
import { sessionConfigService as factorySessionConfigService }
  from '@/services/serviceFactory';  // ✅ Use factory
import { multiTenantService as factoryMultiTenantService }
  from '@/services/serviceFactory';  // ✅ Use factory
import type { TenantContext } from '@/types';  // ✅ Type from @/types

// In component
const user = await factorySessionConfigService.getUser();
const tenant = await factoryMultiTenantService.getCurrentTenant();
```

---

### HIGH #17
**File**: `src/contexts/SuperAdminContext.tsx`  
**Severity**: 🟠 HIGH - Context Layer Issue - 2 Direct Service Imports

**Current Issues**:
```typescript
import { superAdminService } from '@/services/superAdminService';  // ❌ WRONG
import { uiNotificationService } from '@/services/uiNotificationService';  // ❌ WRONG
```

**Solution**:
```typescript
import { superAdminService as factorySuperAdminService }
  from '@/services/serviceFactory';  // ✅ Use factory
// For notification, consider using a notification context instead

// In component
const admins = await factorySuperAdminService.getSuperAdmins();
```

---

## 🟡 MEDIUM PRIORITY FIXES (Next Sprint)

### Hooks with Service Import Issues

---

### MEDIUM #1
**File**: `src/hooks/use-toast.ts`  
**Severity**: 🟡 MEDIUM - Hook Consistency

**Current Issue**:
```typescript
import { uiNotificationService } from "@/services/uiNotificationService";  // ❌ WRONG
```

**Solution**:
```typescript
import { uiNotificationService as factoryNotificationService }
  from '@/services/serviceFactory';  // ✅ CORRECT
```

---

### MEDIUM #2
**File**: `src/hooks/useNotification.ts`  
**Severity**: 🟡 MEDIUM - 2 Issues (service + type)

**Current Issue**:
```typescript
import { uiNotificationService, type NotificationType } 
  from '@/services/uiNotificationService';  // ❌ BOTH WRONG
```

**Issues**:
1. Service import should use factory
2. Type import from service (should be from @/types)

**Solution**:
```typescript
import type { NotificationType } from '@/types';  // ✅ Type from @/types
import { uiNotificationService as factoryNotificationService }
  from '@/services/serviceFactory';  // ✅ Service from factory
```

---

### MEDIUM #3
**File**: `src/hooks/useTenantContext.ts`  
**Severity**: 🟡 MEDIUM - 3 Issues (service + type + supabase-specific)

**Current Issue**:
```typescript
import { multiTenantService, type TenantContext } 
  from '@/services/supabase/multiTenantService';  // ❌ ALL WRONG
```

**Issues**:
1. Importing from Supabase-specific service (not factory)
2. Type imported from service (should be from @/types)
3. Breaks mock mode support

**Solution**:
```typescript
import type { TenantContext } from '@/types';  // ✅ Type from @/types
import { multiTenantService as factoryMultiTenantService }
  from '@/services/serviceFactory';  // ✅ Service from factory

export function useTenantContext() {
  const [tenant, setTenant] = useState<TenantContext | null>(null);
  
  useEffect(() => {
    // Use factory service instead of supabase-specific
    factoryMultiTenantService.getCurrentTenant().then(setTenant);
  }, []);
  
  return tenant;
}
```

---

### MEDIUM #4
**File**: `src/hooks/useToastCompat.ts`  
**Severity**: 🟡 MEDIUM - Hook Consistency

**Current Issue**:
```typescript
import { notificationService } from '@/services/notificationService';  // ❌ WRONG
```

**Solution**:
```typescript
import { notificationService as factoryNotificationService }
  from '@/services/serviceFactory';  // ✅ CORRECT
```

---

## Summary Checklist

### Phase 1: Critical Fixes
- [ ] `src/services/serviceContractService.ts:28` - Fix circular dependency
- [ ] `src/services/supabase/serviceContractService.ts:28` - Fix circular dependency
- [ ] `src/services/superAdminManagementService.ts:19` - Fix circular dependency
- [ ] `src/services/api/supabase/superAdminManagementService.ts:19` - Fix circular dependency
- [ ] Run: `npx tsc --noEmit` (should show 0 errors)

### Phase 2: High Priority Fixes
- [ ] 15 Component direct service imports → Use hooks/context
- [ ] 2 Context files with service import issues → Use factory pattern

### Phase 3: Medium Priority Fixes
- [ ] 4 Hook files → Use factory pattern
- [ ] 2 Hook files → Fix type import location

### Testing After Each Phase
```bash
# After each fix
npx tsc --noEmit
npm run lint

# After high priority
VITE_API_MODE=mock npm run dev
VITE_API_MODE=supabase npm run dev

# Final verification
npm run build
```

---

## Implementation Tips

### Tip 1: Create Missing Hooks
If hooks don't exist, create them:

```typescript
// src/hooks/useComplaintService.ts (CREATE IF MISSING)
import { useQuery } from '@tanstack/react-query';
import { complaintService as factoryComplaintService }
  from '@/services/serviceFactory';

export function useComplaintService() {
  return {
    getComplaints: () => useQuery({
      queryKey: ['complaints'],
      queryFn: () => factoryComplaintService.getComplaints()
    }),
    getComplaint: (id: string) => useQuery({
      queryKey: ['complaint', id],
      queryFn: () => factoryComplaintService.getComplaint(id)
    }),
    // ... etc
  };
}
```

### Tip 2: Check for Existing Patterns
Before creating hooks, check if they already exist:
```bash
# Search for existing hooks
grep -r "useComplaintService" src/hooks/
grep -r "useProductService" src/hooks/
grep -r "useNotification" src/hooks/
```

### Tip 3: Use ESLint to Find Issues
```bash
# Run linter to find import issues
npm run lint -- --fix

# This may auto-fix some issues
```

### Tip 4: Test Each Fix
After each file change:
```bash
# Quick check
npx tsc --noEmit

# Full check
npm run lint
```

---

**Status**: Ready for Implementation  
**Estimated Completion**: 4-6 hours for all fixes  
**Impact**: Enables proper mock/Supabase mode switching + prevents circular dependencies  
**Next Step**: Start with CRITICAL fixes immediately!
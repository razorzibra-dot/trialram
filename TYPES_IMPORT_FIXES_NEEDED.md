# 🔧 Types Import Fixes Reference

**Purpose**: Quick reference for all import changes needed  
**Status**: Ready for implementation  
**Files Affected**: 50+ across the codebase

---

## Import Changes by Category

### 1️⃣ AUDIT TYPES

**Files to Create/Move From**:
- `src/services/auditService.ts`
- `src/services/auditDashboardService.ts`
- `src/services/auditRetentionService.ts`

#### Changes Needed

```typescript
// ❌ BEFORE (Current Import Pattern)
import { AuditLog } from '@/services/auditService';
import { AuditDashboardMetrics } from '@/services/auditDashboardService';
import { RetentionPolicy } from '@/services/auditRetentionService';

// ✅ AFTER (Centralized Import Pattern)
import { 
  AuditLog,
  AuditDashboardMetrics,
  RetentionPolicy 
} from '@/types/audit';

// OR using centralized index
import { 
  AuditLog,
  AuditDashboardMetrics,
  RetentionPolicy 
} from '@/types';
```

**Files to Update** (Search for):
- `grep -r "from '@/services/auditService'" src/`
- `grep -r "from '@/services/auditDashboardService'" src/`
- `grep -r "from '@/services/auditRetentionService'" src/`

---

### 2️⃣ COMPLIANCE TYPES

**Files to Create/Move From**:
- `src/services/complianceNotificationService.ts`
- `src/services/complianceReportService.ts`

#### Changes Needed

```typescript
// ❌ BEFORE
import { AlertRule, AlertCondition } from '@/services/complianceNotificationService';
import { ComplianceReport } from '@/services/complianceReportService';

// ✅ AFTER
import { 
  AlertRule, 
  AlertCondition,
  ComplianceReport 
} from '@/types/compliance';

// OR
import { AlertRule, ComplianceReport } from '@/types';
```

**Files to Update** (Search for):
- `grep -r "from '@/services/complianceNotificationService'" src/`
- `grep -r "from '@/services/complianceReportService'" src/`

---

### 3️⃣ RATE LIMIT TYPES

**Files to Create/Move From**:
- `src/services/rateLimitService.ts`
- `src/services/impersonationRateLimitService.ts`

#### Changes Needed

```typescript
// ❌ BEFORE
import { RateLimitConfig, RateLimitViolation } from '@/services/rateLimitService';
import { ImpersonationSession } from '@/services/impersonationRateLimitService';

// ✅ AFTER
import { 
  RateLimitConfig, 
  RateLimitViolation,
  ImpersonationSession 
} from '@/types/rateLimit';

// OR
import { RateLimitConfig, ImpersonationSession } from '@/types';
```

**Files to Update** (Search for):
- `grep -r "from '@/services/rateLimitService'" src/`
- `grep -r "from '@/services/impersonationRateLimitService'" src/`

---

### 4️⃣ SERVICE INTERFACE TYPES

**Files to Create/Move From**:
- `src/services/serviceFactory.ts`
- `src/services/api/apiServiceFactory.ts`
- `src/services/serviceIntegrationTest.ts`
- `src/services/serviceLogger.ts`

#### Changes Needed

```typescript
// ❌ BEFORE
import { ApiMode } from '@/services/serviceFactory';
import { IAuthService, IUserService } from '@/services/api/apiServiceFactory';
import { ServiceTestResult } from '@/services/serviceIntegrationTest';
import { LogEntry } from '@/services/serviceLogger';

// ✅ AFTER
import { 
  ApiMode,
  IAuthService,
  IUserService,
  ServiceTestResult,
  LogEntry
} from '@/types/service';

// OR
import { ApiMode, IAuthService, ServiceTestResult } from '@/types';
```

**Files to Update** (Search for):
- `grep -r "from '@/services/serviceFactory'" src/`
- `grep -r "from '@/services/api/apiServiceFactory'" src/`
- `grep -r "from '@/services/serviceIntegrationTest'" src/`
- `grep -r "from '@/services/serviceLogger'" src/`

---

### 5️⃣ CONFIGURATION TYPES

**Files to Create/Move From**:
- `src/services/configurationService.ts`

#### Changes Needed

```typescript
// ❌ BEFORE
import { ConfigurationSetting } from '@/services/configurationService';

// ✅ AFTER
import { ConfigurationSetting } from '@/types/configuration';
// OR
import { ConfigurationSetting } from '@/types';
```

**Files to Update** (Search for):
- `grep -r "from '@/services/configurationService'" src/`

---

### 6️⃣ DASHBOARD TYPES

**Files to Create/Move From**:
- `src/services/dashboardService.ts`

#### Changes Needed

```typescript
// ❌ BEFORE
import { ActivityItem, PipelineStage } from '@/services/dashboardService';

// ✅ AFTER
import { ActivityItem, PipelineStage } from '@/types/dashboard';
// OR
import { ActivityItem, PipelineStage } from '@/types';
```

**Files to Update** (Search for):
- `grep -r "from '@/services/dashboardService'" src/`

---

### 7️⃣ ERROR HANDLING TYPES

**Files to Create/Move From**:
- `src/services/errorHandler.ts`

#### Changes Needed

```typescript
// ❌ BEFORE
import { ServiceError, ErrorContext } from '@/services/errorHandler';

// ✅ AFTER
import { ServiceError, ErrorContext } from '@/types/error';
// OR
import { ServiceError, ErrorContext } from '@/types';
```

**Files to Update** (Search for):
- `grep -r "from '@/services/errorHandler'" src/`

---

### 8️⃣ FILE SERVICE TYPES

**Files to Create/Move From**:
- `src/services/fileService.ts`

#### Changes Needed

```typescript
// ❌ BEFORE
import { FileMetadata } from '@/services/fileService';

// ✅ AFTER
import { FileMetadata } from '@/types/file';
// OR
import { FileMetadata } from '@/types';
```

**Files to Update** (Search for):
- `grep -r "from '@/services/fileService'" src/`

---

### 9️⃣ PERFORMANCE TYPES

**Files to Create/Move From**:
- `src/services/performanceMonitoring.ts`

#### Changes Needed

```typescript
// ❌ BEFORE
import { PerformanceMetric } from '@/services/performanceMonitoring';

// ✅ AFTER
import { PerformanceMetric } from '@/types/performance';
// OR
import { PerformanceMetric } from '@/types';
```

**Files to Update** (Search for):
- `grep -r "from '@/services/performanceMonitoring'" src/`

---

### 🔟 TESTING TYPES

**Files to Create/Move From**:
- `src/services/testUtils.ts`

#### Changes Needed

```typescript
// ❌ BEFORE
import { TestScenario } from '@/services/testUtils';

// ✅ AFTER
import { TestScenario } from '@/types/testing';
// OR
import { TestScenario } from '@/types';
```

**Files to Update** (Search for):
- `grep -r "from '@/services/testUtils'" src/`

---

### 1️⃣1️⃣ NOTIFICATION DUPLICATE FIX

**Files Affected**:
- `src/services/notificationService.ts`
- `src/services/uiNotificationService.ts`

#### Changes Needed

```typescript
// Current problem: Two different Notification type definitions
// src/services/notificationService.ts - Notification
// src/services/uiNotificationService.ts - Notification (different)

// ✅ SOLUTION: Consolidate in types/notifications.ts
// Use clear naming:
// - Notification (from notificationService - core)
// - UINotification (from uiNotificationService - UI)
// OR separate into two files:
// - types/notifications.ts for domain
// - types/ui.ts for UI types

import { Notification } from '@/types/notifications';
import { NotificationType, MessageType } from '@/types/ui';
```

---

### 1️⃣2️⃣ SUPABASE DB TYPES

**Files to Create/Move From**:
- `src/services/api/supabase/complianceNotificationService.ts`
- `src/services/api/supabase/rateLimitService.ts`
- `src/services/supabase/authService.ts`
- `src/services/supabase/baseService.ts`
- `src/services/supabase/companyService.ts`
- `src/services/supabase/contractService.ts`
- `src/services/supabase/multiTenantService.ts`
- `src/services/supabase/productService.ts`
- `src/services/supabase/salesService.ts`
- `src/services/supabase/ticketService.ts`
- `src/services/supabase/notificationService.ts`

#### Changes Needed

```typescript
// ❌ BEFORE (DB-specific types scattered)
import { AlertRuleRow } from '@/services/api/supabase/complianceNotificationService';
import { Company } from '@/services/supabase/companyService';

// ✅ AFTER (All DB types centralized)
import { 
  AlertRuleRow,
  Company,
  PaginationOptions,
  TenantContext
} from '@/types/supabase';

// OR 
import { AlertRuleRow, Company } from '@/types';
```

**Files to Update** (Search for):
- `grep -r "from '@/services/api/supabase/" src/ | grep -v "serviceFactory"`
- `grep -r "from '@/services/supabase/" src/`

---

## 🔍 Search & Replace Commands

### PowerShell Commands (Windows)

```powershell
# Find all instances of scattered type imports
Get-ChildItem -Path "src" -Filter "*.ts" -Recurse | 
  ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match "from\s+['\"]@/services/(audit|compliance|rateLimit)" ) {
      Write-Host "Found in: $($_.FullName)"
    }
  }

# Replace audit service imports
(Get-Content -Path "src/file.ts") -replace 
  "from\s+['\"]@/services/auditService['\"];",
  "from '@/types/audit';" | 
  Set-Content -Path "src/file.ts"
```

### Bash Commands (Linux/Mac)

```bash
# Find scattered imports
grep -r "from '@/services/audit" src/
grep -r "from '@/services/compliance" src/
grep -r "from '@/services/rateLimit" src/

# Replace in file
sed -i "s|from '@/services/auditService'|from '@/types/audit'|g" src/file.ts
sed -i "s|from '@/services/complianceNotificationService'|from '@/types/compliance'|g" src/file.ts
```

---

## 📋 Complete Checklist

### Audit Types - Files to Update
- [ ] Check for imports in `src/modules/` - Replace with `@/types/audit`
- [ ] Check for imports in `src/hooks/` - Replace with `@/types/audit`
- [ ] Check for imports in `src/components/` - Replace with `@/types/audit`
- [ ] Check for imports in other service files - Replace with `@/types/audit`

### Compliance Types - Files to Update
- [ ] Search all `.ts` files for `complianceNotificationService`
- [ ] Search all `.ts` files for `complianceReportService`
- [ ] Replace with `@/types/compliance`

### Rate Limit Types - Files to Update
- [ ] Search all `.ts` files for `rateLimitService`
- [ ] Search all `.ts` files for `impersonationRateLimitService`
- [ ] Replace with `@/types/rateLimit`

### Service Types - Files to Update
- [ ] Search all `.ts` files for `serviceFactory`
- [ ] Search all `.ts` files for `apiServiceFactory`
- [ ] Search all `.ts` files for `serviceIntegrationTest`
- [ ] Search all `.ts` files for `serviceLogger`
- [ ] Replace with `@/types/service`

### Configuration Types - Files to Update
- [ ] Search all `.ts` files for `configurationService`
- [ ] Replace with `@/types/configuration`

### Dashboard Types - Files to Update
- [ ] Search all `.ts` files for `dashboardService` (type imports only)
- [ ] Replace with `@/types/dashboard`

### Error Types - Files to Update
- [ ] Search all `.ts` files for `errorHandler`
- [ ] Replace with `@/types/error`

### File Types - Files to Update
- [ ] Search all `.ts` files for `fileService` (type imports only)
- [ ] Replace with `@/types/file`

### Performance Types - Files to Update
- [ ] Search all `.ts` files for `performanceMonitoring`
- [ ] Replace with `@/types/performance`

### Testing Types - Files to Update
- [ ] Search all `.ts` files for `testUtils`
- [ ] Replace with `@/types/testing`

### Supabase Types - Files to Update
- [ ] Search all `.ts` files for imports from `@/services/api/supabase/`
- [ ] Search all `.ts` files for imports from `@/services/supabase/`
- [ ] Replace with `@/types/supabase`

---

## ✅ Verification Commands

After making changes:

```bash
# Build verification
npm run build

# Lint verification
npm run lint

# Type check
npx tsc --noEmit

# Find remaining scattered imports
grep -r "from '@/services/" src/ | grep -v "serviceFactory" | grep -v "test"

# Verify centralized imports work
node -e "const t = require('./src/types'); console.log('Types available:', Object.keys(t).length)"
```

---

## 📊 Impact Matrix

| Type Category | # of Types | Source Files | Import Fixes | Effort |
|---|---|---|---|---|
| Audit | 11 | 3 | 5-10 | Low |
| Compliance | 11 | 2 | 5-10 | Low |
| Rate Limit | 6 | 2 | 3-8 | Low |
| Service | 14 | 4 | 8-15 | Medium |
| Configuration | 3 | 1 | 2-5 | Low |
| Dashboard | 4 | 1 | 2-5 | Low |
| Error | 2 | 1 | 1-3 | Low |
| File | 1 | 1 | 1-2 | Low |
| Performance | 2 | 1 | 1-3 | Low |
| Testing | 2 | 1 | 1-3 | Low |
| Supabase | 11 | 11 | 15-30 | Medium |

**Total Import Fixes Needed**: 50-100 across codebase

---

## 🎯 Implementation Order

1. ✅ Create new type files
2. ✅ Update `src/types/index.ts`
3. 🔄 Update service files to import types
4. 🔄 Search/replace scattered imports
5. ✅ Build & verify
6. ✅ Commit changes

**Estimated Time**: 2-3 hours

---

**Ready to proceed? Start with creating the type files, then use this reference for all import replacements! 🚀**
# Types Centralization - Completion Guide

**Total Time**: 2-3 hours  
**Phases**: 4 (Create, Update, Fix, Verify)  
**Risk**: Very Low  

---

## Phase 1: Create Type Files (2 hours)

### Step 1.1: Create `audit.ts`

**Location**: `src/types/audit.ts`

```typescript
/**
 * Audit Logging and Dashboard Types
 * Centralized types for audit tracking, retention, and visualization
 */

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  changes?: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  tenantId: string;
}

export interface AuditDashboardMetrics {
  totalActions: number;
  criticalActions: number;
  highRiskActions: number;
  lastUpdated: Date;
}

export interface ActionByType {
  type: string;
  count: number;
  percentage: number;
}

export interface ActionByUser {
  userId: string;
  userName: string;
  actionCount: number;
  lastAction: Date;
}

export interface TimelineEvent {
  timestamp: Date;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  description: string;
}

export interface AuditDashboardData {
  metrics: AuditDashboardMetrics;
  actionsByType: ActionByType[];
  actionsByUser: ActionByUser[];
  timeline: TimelineEvent[];
  summary: string;
}

export interface DashboardFilterOptions {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  actionType?: string;
  resource?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  retentionDays: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogArchive {
  id: string;
  archivedAt: Date;
  fromDate: Date;
  toDate: Date;
  recordCount: number;
  archiveLocation: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface RetentionCleanupResult {
  recordsDeleted: number;
  recordsArchived: number;
  deletionDate: Date;
  status: 'success' | 'partial' | 'failed';
  message: string;
}

export interface RetentionStats {
  totalRecords: number;
  oldestRecord: Date;
  newestRecord: Date;
  averageRecordsPerDay: number;
  projectedCleanupDate: Date;
  projectedDeletedCount: number;
}
```

✅ **Check**: File created, types defined

---

### Step 1.2: Create `compliance.ts`

**Location**: `src/types/compliance.ts`

```typescript
/**
 * Compliance and Alert Management Types
 * Centralized types for compliance rules, alerts, and reporting
 */

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertConditionType = 
  | 'unauthorized_attempts' 
  | 'long_session' 
  | 'sensitive_access' 
  | 'off_hours';

export interface AlertRule {
  ruleId: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  enabled: boolean;
  condition: AlertCondition;
  actions: AlertAction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertCondition {
  type: AlertConditionType;
  threshold?: number;
  parameters?: Record<string, unknown>;
}

export interface BusinessHours {
  startTime: string;
  endTime: string;
  timezone: string;
  daysOfWeek: number[];
}

export interface AlertAction {
  actionId: string;
  type: 'email' | 'sms' | 'notification' | 'webhook';
  recipients: string[];
  template?: string;
  enabled: boolean;
}

export interface ComplianceAlert {
  alertId: string;
  ruleId: string;
  severity: AlertSeverity;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'open' | 'acknowledged' | 'resolved';
  details: Record<string, unknown>;
  affectedResources: string[];
}

export interface NotificationResult {
  notificationId: string;
  alertId: string;
  status: 'sent' | 'failed' | 'pending';
  recipient: string;
  channel: 'email' | 'sms' | 'notification' | 'webhook';
  sentAt: Date;
  error?: string;
}

export interface AlertCheckResult {
  rulesChecked: number;
  alertsTriggered: number;
  failedChecks: number;
  executionTime: number;
  timestamp: Date;
}

export type ComplianceReportType = 
  | 'audit_summary' 
  | 'access_control' 
  | 'data_protection' 
  | 'incident_response' 
  | 'user_activity';

export type ReportExportFormat = 'csv' | 'json' | 'html' | 'pdf';

export interface ReportGenerationOptions {
  reportType: ComplianceReportType;
  startDate: Date;
  endDate: Date;
  format: ReportExportFormat;
  includeDetails: boolean;
  filters?: Record<string, unknown>;
}

export interface ComplianceReport {
  reportId: string;
  type: ComplianceReportType;
  generatedAt: Date;
  generatedBy: string;
  startDate: Date;
  endDate: Date;
  format: ReportExportFormat;
  fileSize: number;
  filePath: string;
  status: 'generated' | 'processing' | 'failed';
  summary: {
    totalRecords: number;
    criticalFindings: number;
    warnings: number;
  };
}
```

✅ **Check**: File created, types defined

---

### Step 1.3: Create `service.ts`

**Location**: `src/types/service.ts`

```typescript
/**
 * Core Service Interface Types
 * Defines service contracts and factory patterns
 */

export type ApiMode = 'mock' | 'supabase' | 'real';

export interface IAuthService {
  login(email: string, password: string): Promise<any>;
  logout(): Promise<void>;
  refreshToken(): Promise<string>;
  getCurrentUser(): Promise<any>;
}

export interface ICustomerService {
  getCustomers(): Promise<any[]>;
  getCustomer(id: string): Promise<any>;
  createCustomer(data: any): Promise<any>;
  updateCustomer(id: string, data: any): Promise<any>;
  deleteCustomer(id: string): Promise<void>;
}

export interface ISalesService {
  getSales(): Promise<any[]>;
  getSale(id: string): Promise<any>;
  createSale(data: any): Promise<any>;
  updateSale(id: string, data: any): Promise<any>;
  deleteSale(id: string): Promise<void>;
}

export interface ITicketService {
  getTickets(): Promise<any[]>;
  getTicket(id: string): Promise<any>;
  createTicket(data: any): Promise<any>;
  updateTicket(id: string, data: any): Promise<any>;
  deleteTicket(id: string): Promise<void>;
}

export interface IContractService {
  getContracts(): Promise<any[]>;
  getContract(id: string): Promise<any>;
  createContract(data: any): Promise<any>;
  updateContract(id: string, data: any): Promise<any>;
  deleteContract(id: string): Promise<void>;
}

export interface IUserService {
  getUsers(): Promise<any[]>;
  getUser(id: string): Promise<any>;
  createUser(data: any): Promise<any>;
  updateUser(id: string, data: any): Promise<any>;
  deleteUser(id: string): Promise<void>;
}

export interface IDashboardService {
  getDashboardMetrics(): Promise<any>;
  getChartData(): Promise<any>;
}

export interface INotificationService {
  getNotifications(): Promise<any[]>;
  createNotification(data: any): Promise<any>;
  markAsRead(id: string): Promise<void>;
}

export interface IFileService {
  uploadFile(file: File): Promise<string>;
  deleteFile(fileId: string): Promise<void>;
  getFileUrl(fileId: string): Promise<string>;
}

export interface IAuditService {
  getAuditLogs(): Promise<any[]>;
  logAction(action: any): Promise<void>;
}

export interface ServiceTestResult {
  serviceName: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  duration: number;
  details?: Record<string, unknown>;
}

export interface IntegrationTestResults {
  timestamp: Date;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: ServiceTestResult[];
  summary: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  message: string;
  data?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
  };
}

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  destination: 'console' | 'file' | 'both';
  filePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
}
```

✅ **Check**: File created, types defined

---

### Step 1.4: Create `rateLimit.ts`

**Location**: `src/types/rateLimit.ts`

```typescript
/**
 * Rate Limiting and Session Management Types
 * Centralized types for rate limits and active sessions
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message: string;
  statusCode: number;
}

export interface RateLimitViolation {
  userId: string;
  endpoint: string;
  timestamp: Date;
  requestCount: number;
  limit: number;
}

export interface RateLimitStats {
  currentRequests: number;
  maxRequests: number;
  windowMs: number;
  remainingRequests: number;
  resetTime: Date;
}

export interface ImpersonationSession {
  sessionId: string;
  adminUserId: string;
  impersonatedUserId: string;
  startTime: Date;
  endTime?: Date;
  actions: ImpersonationAction[];
  reason: string;
}

export interface ImpersonationAction {
  timestamp: Date;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
}

export interface ImpersonationRateLimit {
  adminUserId: string;
  sessionCount: number;
  maxSessions: number;
  lastSessionTime: Date;
}
```

✅ **Check**: File created, types defined

---

### Step 1.5: Create `configuration.ts`

**Location**: `src/types/configuration.ts`

```typescript
/**
 * Configuration Management Types
 * Centralized types for system configuration, settings, and validation
 */

export interface ConfigurationSetting {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  category: string;
  isSecure: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigurationAudit {
  id: string;
  settingId: string;
  key: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  reason: string;
  timestamp: Date;
  tenantId: string;
}

export interface ValidationSchema {
  field: string;
  type: string;
  required: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  customValidator?: (value: any) => boolean;
}
```

✅ **Check**: File created, types defined

---

### Step 1.6: Create Remaining Type Files

**For**: `dashboard.ts`, `error.ts`, `file.ts`, `performance.ts`, `testing.ts`, `supabase.ts`

Refer to `TYPES_CENTRALIZATION_EXECUTION_PLAN.md` for complete content of these files.

✅ **Check**: All 6 files created

---

### Step 1.7: Update `src/types/index.ts`

Add exports for all new type files:

```typescript
// Existing exports...
export * from './auth';
export * from './crm';
export * from './contracts';
// ... other existing exports

// NEW EXPORTS
export * from './audit';
export * from './compliance';
export * from './service';
export * from './rateLimit';
export * from './configuration';
export * from './dashboard';
export * from './error';
export * from './file';
export * from './performance';
export * from './testing';
export * from './supabase';
```

✅ **Check**: All exports added

---

## Phase 2: Update Service Files (45 minutes)

### Step 2.1: Update Audit Services

**Files to Update**:
- `src/services/auditService.ts`
- `src/services/auditDashboardService.ts`
- `src/services/auditRetentionService.ts`

**For Each File**:
1. Remove type definitions (keep them only in `src/types/audit.ts`)
2. Add import at top:
```typescript
import { AuditLog, RetentionPolicy, /* ... */ } from '@/types';
```
3. Keep all function implementations
4. Verify no other files import types from these files

✅ **Check**: 3 files updated

---

### Step 2.2: Update Compliance Services

**Files to Update**:
- `src/services/complianceNotificationService.ts`
- `src/services/complianceReportService.ts`

**For Each File**:
1. Remove type definitions
2. Add import:
```typescript
import { AlertRule, ComplianceAlert, ComplianceReport, /* ... */ } from '@/types';
```
3. Keep all implementations

✅ **Check**: 2 files updated

---

### Step 2.3: Update Core Services

**Files to Update**:
- `src/services/serviceFactory.ts`
- `src/services/api/apiServiceFactory.ts`
- `src/services/configurationService.ts`
- `src/services/errorHandlingService.ts`

**For Each File**:
1. Remove interface definitions
2. Add imports:
```typescript
import { 
  IAuthService, 
  ICustomerService, 
  ISalesService,
  /* ... */
} from '@/types';
import { ConfigurationSetting } from '@/types';
```

✅ **Check**: 4 files updated

---

### Step 2.4: Update Rate Limiting Services

**Files to Update**:
- `src/services/rateLimitService.ts`
- `src/services/impersonationRateLimitService.ts`

**For Each File**:
1. Remove type definitions
2. Add import:
```typescript
import { RateLimitConfig, ImpersonationSession, /* ... */ } from '@/types';
```

✅ **Check**: 2 files updated

---

### Step 2.5: Update Feature Services

**Files to Update**:
- `src/services/dashboardService.ts`
- `src/services/performanceService.ts`
- `src/services/testingService.ts`
- `src/services/fileService.ts`

**For Each File**:
1. Remove type definitions
2. Add appropriate imports
3. Keep all implementations

✅ **Check**: 4 files updated

---

### Step 2.6: Update Supabase Services

**For All Files in** `src/services/api/supabase/`:
1. Extract database row types to `src/types/supabase.ts`
2. Remove type definitions from service files
3. Add import:
```typescript
import { /* DB types from supabase.ts */ } from '@/types';
```

✅ **Check**: All supabase services updated

---

## Phase 3: Fix Imports Across Codebase (30 minutes)

### Step 3.1: Find All Scattered Imports

Search for patterns:
```
import.*from '@/services/audit
import.*from '@/services/compliance
import.*from '@/services/rateLimit
import.*from '@/services/configuration
import.*from '@/services/dashboard
import.*from '@/services/performance
import.*from '@/services/file
import.*from '@/services/error
```

For each match, note the file location.

### Step 3.2: Replace Audit Type Imports

**Pattern**: `import { AuditLog, /* ... */ } from '@/services/auditService'`  
**Replace**: `import { AuditLog, /* ... */ } from '@/types'`

Process all occurrences in:
- Customer module components
- Dashboard components
- Admin components

### Step 3.3: Replace Compliance Type Imports

**Pattern**: `import { AlertRule, /* ... */ } from '@/services/complianceNotificationService'`  
**Replace**: `import { AlertRule, /* ... */ } from '@/types'`

### Step 3.4: Replace Service Type Imports

**Pattern**: `import { IAuthService, /* ... */ } from '@/services/api/apiServiceFactory'`  
**Replace**: `import { IAuthService, /* ... */ } from '@/types'`

### Step 3.5: Replace Rate Limit Imports

**Pattern**: `import { RateLimitConfig, /* ... */ } from '@/services/rateLimitService'`  
**Replace**: `import { RateLimitConfig, /* ... */ } from '@/types'`

### Step 3.6: Continue for Remaining Categories

Follow same pattern for:
- Configuration types
- Dashboard types
- Performance types
- File types
- Error types
- Supabase types

### Step 3.7: Verify All Imports Updated

Search for any remaining:
```
from '@/services/.*Service';
from '@/services/api/.*Service';
```

Should return 0 results for type imports (service implementations are fine).

✅ **Check**: All 50-100+ imports fixed

---

## Phase 4: Verification (15 minutes)

### Step 4.1: Build Test

```bash
npm run build
```

Expected: ✅ Build succeeds with no errors

### Step 4.2: Lint Test

```bash
npm run lint
```

Expected: ✅ No linting errors

### Step 4.3: Type Check

```bash
tsc --noEmit
```

Expected: ✅ All types valid

### Step 4.4: Verify IDE Autocomplete

Open any component file and type:
```typescript
import { 
```

Expected: ✅ All 184+ types visible in autocomplete from `@/types`

### Step 4.5: Verify No Broken Imports

Search for `Cannot find module '@/types'` in editor  
Expected: ✅ No results

### Step 4.6: Final Checks

- [ ] All 11 type files exist in `src/types/`
- [ ] `src/types/index.ts` exports all new types
- [ ] No service files export types
- [ ] All imports use `@/types` path
- [ ] Build passes
- [ ] Lint passes
- [ ] Type check passes

---

## 🎯 Success Checklist

✅ Phase 1 Complete: 11 type files created  
✅ Phase 2 Complete: Service files cleaned  
✅ Phase 3 Complete: All imports unified  
✅ Phase 4 Complete: All verification passed  

**Result**: 51% → 100% type centralization achieved! 🚀
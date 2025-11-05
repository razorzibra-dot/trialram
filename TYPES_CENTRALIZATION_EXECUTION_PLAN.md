# 🚀 Types Centralization - Execution Plan

**Phase**: 1 (Create Missing Type Files)  
**Priority**: HIGH  
**Effort**: 2-3 hours  
**Risk**: LOW (Organizational changes only)  

---

## Quick Overview

### What's Wrong
❌ 50+ types scattered across service files instead of centralized in `/src/types/`

### What We'll Do
✅ Create 11 new type files in `/src/types/` following established patterns

### Expected Result
✅ All types centralized, consistent import paths, better developer experience

---

## Phase 1: Create New Type Files (5 Files High Priority)

### 1️⃣ `src/types/audit.ts` - Audit Logging Types
**Source Files**: `auditService.ts`, `auditDashboardService.ts`, `auditRetentionService.ts`

```typescript
/**
 * Audit Logging and Dashboard Types
 * Centralized types for audit tracking, retention, and visualization
 */

// Core audit log entry
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

// Dashboard metrics
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

// Retention policies
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

---

### 2️⃣ `src/types/compliance.ts` - Compliance & Alerting Types
**Source Files**: `complianceNotificationService.ts`, `complianceReportService.ts`

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
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  timezone: string;
  daysOfWeek: number[]; // 0-6, Sunday=0
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
  executionTime: number; // ms
  timestamp: Date;
}

// Compliance Reporting
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

---

### 3️⃣ `src/types/service.ts` - Core Service Interface Types
**Source Files**: `serviceFactory.ts`, `apiServiceFactory.ts`

```typescript
/**
 * Core Service Interface Types
 * Defines service contracts and factory patterns
 */

export type ApiMode = 'mock' | 'supabase' | 'real';

// Service interfaces
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

// Testing types
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

// Logging types
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

---

### 4️⃣ `src/types/rateLimit.ts` - Rate Limiting Types
**Source Files**: `rateLimitService.ts`, `impersonationRateLimitService.ts`

```typescript
/**
 * Rate Limiting and Session Management Types
 * Centralized types for rate limits and active sessions
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // milliseconds
  message: string;
  statusCode: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export interface RateLimitViolation {
  id: string;
  userId: string;
  endpoint: string;
  timestamp: Date;
  ipAddress: string;
  requestCount: number;
  severity: 'warning' | 'block' | 'critical';
  resolved: boolean;
  resolvedAt?: Date;
}

export interface ActiveSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  lastActivityTime: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export interface RateLimitStats {
  totalViolations: number;
  activeViolations: number;
  mostFrequentUser: string;
  mostFrequentEndpoint: string;
  averageViolationsPerDay: number;
  lastViolation: Date;
}

// Impersonation-specific
export interface ImpersonationSession {
  sessionId: string;
  adminId: string;
  userId: string; // Impersonated user
  startTime: Date;
  endTime?: Date;
  reason: string;
  status: 'active' | 'ended' | 'revoked';
  actions: string[]; // Actions performed during session
}
```

---

### 5️⃣ `src/types/configuration.ts` - Configuration Types
**Source Files**: `configurationService.ts`

```typescript
/**
 * Application Configuration Types
 * Centralized types for system configuration management
 */

export interface ConfigurationSetting {
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'json' | 'secret';
  description: string;
  default?: unknown;
  env?: string; // environment variable name
  updatedAt: Date;
  updatedBy: string;
  category: string;
}

export interface ConfigurationAudit {
  id: string;
  settingKey: string;
  oldValue: unknown;
  newValue: unknown;
  changedAt: Date;
  changedBy: string;
  reason?: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface ValidationSchema {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  minValue?: number;
  maxValue?: number;
  pattern?: string; // regex
  enum?: unknown[];
  customValidator?: (value: unknown) => boolean;
  errorMessage: string;
}
```

---

## 📋 Quick Reference: All Missing Types

**Remaining files to create** (Secondary priority):

### `src/types/error.ts`
- `ServiceError`
- `ErrorContext`

### `src/types/file.ts`
- `FileMetadata`

### `src/types/performance.ts`
- `PerformanceMetric`
- `PerformanceStats`

### `src/types/dashboard.ts`
- `ActivityItem`
- `TopCustomer`
- `TicketStatsData`
- `PipelineStage`

### `src/types/testing.ts`
- `TestScenario`
- `MockDataOptions`

### `src/types/supabase.ts` (Database-specific)
- `AlertRuleRow`
- `ComplianceAlertRow`
- `ImpersonationSessionRow`
- `ImpersonationLimitRow`
- `RateLimitViolationRow`
- `AuthResponse`
- `PaginationOptions`
- `QueryOptions`
- `SubscriptionOptions`
- `Company`
- `CompanyFilters`
- `ContractFilters`
- `TenantContext`
- `Product`
- `ProductFilters`
- `SalesFilters`
- `TicketFilters`

---

## 🔄 Update Process After Creating Files

### 1. Update `src/types/index.ts`
Add exports for new files:

```typescript
// Add to existing exports
export * from './audit';
export * from './compliance';
export * from './configuration';
export * from './service';
export * from './rateLimit';
// ... others
```

### 2. Update Service Files
**Example for `auditService.ts`:**

```typescript
// ❌ BEFORE
export interface AuditLog { ... }

class AuditService { ... }

// ✅ AFTER
import { AuditLog } from '@/types/audit';

class AuditService { ... }
```

### 3. Search and Replace in Codebase
Find all imports:
```bash
grep -r "import.*from.*services.*auditService" src/
```

Replace with:
```typescript
import { AuditLog } from '@/types/audit';
```

---

## ✅ Verification Steps

After making changes:

```bash
# 1. Build check
npm run build

# 2. Lint check
npm run lint

# 3. Type check
npx tsc --noEmit

# 4. Search for remaining scattered types
grep -r "^export interface" src/services/ | grep -v "\.test\."

# 5. Verify new types can be imported
node -e "const t = require('./src/types/index.ts'); console.log('✅ Types exported:', Object.keys(t).length);"
```

---

## 📊 Implementation Order

**Priority Order**:
1. ✅ **Create**: `audit.ts`, `compliance.ts`, `service.ts`, `rateLimit.ts`, `configuration.ts`
2. ✅ **Update**: `src/types/index.ts` with new exports
3. 🔄 **Update**: Service files to import from types
4. 🔄 **Scan**: Codebase for affected imports
5. ✅ **Test**: Build & lint

---

## ⏱️ Time Estimates

- Creating 5 new type files: **30 minutes**
- Updating index.ts: **5 minutes**
- Updating service files: **30 minutes**
- Scanning and fixing imports: **30 minutes**
- Testing & verification: **15 minutes**

**Total**: ~2 hours

---

## 🎯 Success Criteria

- ✅ No types exported from service files
- ✅ All types imported from `@/types` or category-specific paths
- ✅ `npm run build` succeeds with no errors
- ✅ `npm run lint` passes
- ✅ TypeScript compilation succeeds
- ✅ IDE autocomplete works for all centralized types
- ✅ No circular dependencies

---

**Ready to execute? Begin with creating the 5 high-priority type files above! 🚀**
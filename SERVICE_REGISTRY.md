# Service Registry Documentation

**Updated:** November 13, 2025  
**Total Services:** 24  
**Dual Implementations:** Mock + Supabase  
**Factory Pattern:** Registry-based with ES6 Proxy delegation

---

## Service Inventory

| # | Service | Registry Key | Mode | Purpose |
|---|---------|-------------|------|---------|
| 1 | authService | `auth` | M/S | User authentication & session management |
| 2 | serviceContractService | `servicecontract` | M/S | Service contract lifecycle management |
| 3 | contractService | `contract` | M/S | Contract module (different from service contracts) |
| 4 | productSaleService | `productsale` | M/S | Product sales operations |
| 5 | salesService | `sales` | M/S | Sales & deal management |
| 6 | customerService | `customer` | M/S | Customer management |
| 7 | jobWorkService | `jobwork` | M/S | Job work operations |
| 8 | productService | `product` | M/S | Product catalog & inventory |
| 9 | companyService | `company` | M/S | Company/organization management |
| 10 | userService | `user` | M/S | User management & admin |
| 11 | rbacService | `rbac` | M/S | Role-based access control |
| 12 | uiNotificationService | `uinotification` | M | UI notifications (client-side only) |
| 13 | notificationService | `notification` | M/S | Backend notifications |
| 14 | tenantService | `tenant` | M/S | Tenant management, metrics, directory |
| 15 | multiTenantService | `multitenant` | S | Multi-tenant context (infrastructure) |
| 16 | ticketService | `ticket` | M/S | Ticket/issue tracking |
| 17 | superAdminManagementService | `superadminmanagement` | M/S | Super admin lifecycle management |
| 18 | superAdminService | `superadmin` | M/S | Super admin dashboard |
| 19 | roleRequestService | `rolerequest` | M/S | Role elevation requests |
| 20 | auditService* | `audit` | M/S | Audit logs, compliance, metrics, retention |
| 21 | complianceNotificationService | `compliancenotification` | M/S | Compliance alerts |
| 22 | impersonationService | `impersonation` | S | Impersonation session management |
| 23 | rateLimitService | `ratelimit` | M/S | Rate limiting & session controls |
| 24 | referenceDataService | `referencedata` | M/S | Reference data & dropdowns |

**Legend:** M = Mock, S = Supabase | * = Consolidated service

---

## Service Details

### 1. Auth Service
**Registry Key:** `auth`  
**Purpose:** User authentication, login/logout, token management, role-based access  
**Dual Mode:** Mock + Supabase

**Key Methods:**
```typescript
login(email: string, password: string): Promise<AuthResponse>
logout(): Promise<void>
register(email: string, password: string, userData: UserData): Promise<AuthResponse>
getCurrentUser(): Promise<User | null>
getToken(): Promise<string>
isAuthenticated(): Promise<boolean>
hasRole(role: string): Promise<boolean>
hasPermission(permission: string): Promise<boolean>
hasAnyRole(roles: string[]): Promise<boolean>
hasAllPermissions(permissions: string[]): Promise<boolean>
hasAnyPermission(permissions: string[]): Promise<boolean>
isSuperAdmin(): Promise<boolean>
canAccessSuperAdminPortal(): Promise<boolean>
canAccessTenantPortal(): Promise<boolean>
getUserTenant(): Promise<Tenant | null>
getTenantUsers(): Promise<User[]>
getAllTenants(): Promise<Tenant[]>
getUserPermissions(): Promise<string[]>
getAvailableRoles(): Promise<Role[]>
refreshToken(): Promise<string>
getDemoAccounts(): Promise<DemoAccount[]>
getPermissionDescription(permission: string): string
getRoleHierarchy(): Promise<RoleHierarchy>
canManageUser(userId: string): Promise<boolean>
```

---

### 2. Service Contract Service
**Registry Key:** `servicecontract`  
**Purpose:** Service contract lifecycle management (different from Contract module)  
**Dual Mode:** Mock + Supabase

**Key Methods:**
```typescript
getServiceContracts(filters?: ServiceContractFilters): Promise<ServiceContract[]>
getServiceContract(id: string): Promise<ServiceContract>
createServiceContract(data: CreateServiceContractDTO): Promise<ServiceContract>
updateServiceContract(id: string, data: UpdateServiceContractDTO): Promise<ServiceContract>
renewServiceContract(id: string): Promise<ServiceContract>
cancelServiceContract(id: string, reason: string): Promise<void>
getServiceContractByProductSaleId(productSaleId: string): Promise<ServiceContract | null>
getContractTemplates(): Promise<ContractTemplate[]>
generateContractPDF(contractId: string): Promise<Blob>
getExpiringContracts(daysThreshold?: number): Promise<ServiceContract[]>
```

---

### 3. Contract Service
**Registry Key:** `contract`  
**Purpose:** Contract module operations (NOT Service Contracts - this is the Contracts feature module)  
**Dual Mode:** Mock + Supabase

**Key Methods:**
```typescript
getContracts(filters?: ContractFilters): Promise<Contract[]>
getContract(id: string): Promise<Contract>
createContract(data: CreateContractDTO): Promise<Contract>
updateContract(id: string, data: UpdateContractDTO): Promise<Contract>
deleteContract(id: string): Promise<void>
getContractStats(): Promise<ContractStats>
getExpiringContracts(daysThreshold?: number): Promise<Contract[]>
getContractsByCustomer(customerId: string, filters?: any): Promise<Contract[]>
```

---

### 4. Product Sale Service
**Registry Key:** `productsale`  
**Purpose:** Product sales operations and order management  
**Dual Mode:** Mock + Supabase

**Key Methods:**
```typescript
getProductSales(filters?: ProductSaleFilters): Promise<ProductSale[]>
getProductSaleById(id: string): Promise<ProductSale>
createProductSale(data: CreateProductSaleDTO): Promise<ProductSale>
updateProductSale(id: string, data: UpdateProductSaleDTO): Promise<ProductSale>
deleteProductSale(id: string): Promise<void>
getProductSalesAnalytics(): Promise<ProductSaleAnalytics>
uploadAttachment(saleId: string, file: File): Promise<Attachment>
```

---

### 5. Sales Service
**Registry Key:** `sales`  
**Purpose:** Sales pipeline, deals, and opportunity management  
**Dual Mode:** Mock + Supabase

**Key Methods:**
```typescript
getDeals(filters?: DealFilters): Promise<Deal[]>
getDeal(id: string): Promise<Deal>
createDeal(data: CreateDealDTO): Promise<Deal>
updateDeal(id: string, data: UpdateDealDTO): Promise<Deal>
deleteDeal(id: string): Promise<void>
getDealsByCustomer(customerId: string): Promise<Deal[]>
getSalesStats(): Promise<SalesStats>
getDealStages(): Promise<DealStage[]>
updateDealStage(dealId: string, stageId: string): Promise<void>
bulkUpdateDeals(dealIds: string[], updates: Partial<Deal>): Promise<void>
bulkDeleteDeals(dealIds: string[]): Promise<void>
searchDeals(query: string): Promise<Deal[]>
exportDeals(format: 'csv' | 'excel'): Promise<Blob>
importDeals(file: File): Promise<ImportResult>
```

---

### 6. Customer Service
**Registry Key:** `customer`  
**Purpose:** Customer data management, profiles, and relationships  
**Dual Mode:** Mock + Supabase

**Key Methods:**
```typescript
getCustomers(filters?: CustomerFilters): Promise<Customer[]>
getCustomer(id: string): Promise<Customer>
createCustomer(data: CreateCustomerDTO): Promise<Customer>
updateCustomer(id: string, data: UpdateCustomerDTO): Promise<Customer>
deleteCustomer(id: string): Promise<void>
bulkDeleteCustomers(ids: string[]): Promise<void>
bulkUpdateCustomers(ids: string[], updates: Partial<Customer>): Promise<void>
getTags(): Promise<Tag[]>
createTag(name: string): Promise<Tag>
exportCustomers(format: 'csv' | 'excel'): Promise<Blob>
importCustomers(file: File): Promise<ImportResult>
getIndustries(): Promise<Industry[]>
getSizes(): Promise<CompanySize[]>
getCustomerStats(): Promise<CustomerStats>
searchCustomers(query: string): Promise<Customer[]>
```

---

### 7. Job Work Service
**Registry Key:** `jobwork`  
**Purpose:** Job work scheduling, tracking, and management  
**Dual Mode:** Mock + Supabase

**Key Methods:**
```typescript
getJobWorks(filters?: JobWorkFilters): Promise<JobWork[]>
getJobWork(id: string): Promise<JobWork>
createJobWork(data: CreateJobWorkDTO): Promise<JobWork>
updateJobWork(id: string, data: UpdateJobWorkDTO): Promise<JobWork>
deleteJobWork(id: string): Promise<void>
getJobWorkStats(): Promise<JobWorkStats>
```

---

### 8. Product Service
**Registry Key:** `product`  
**Purpose:** Product catalog, inventory, and SKU management  
**Dual Mode:** Mock + Supabase

**Key Methods:**
```typescript
getProducts(filters?: ProductFilters): Promise<Product[]>
getProduct(id: string): Promise<Product>
createProduct(data: CreateProductDTO): Promise<Product>
updateProduct(id: string, data: UpdateProductDTO): Promise<Product>
deleteProduct(id: string): Promise<void>
searchProducts(query: string): Promise<Product[]>
getLowStockProducts(threshold?: number): Promise<Product[]>
updateStock(productId: string, quantity: number): Promise<void>
getProductStats(): Promise<ProductStats>
subscribeToProducts(callback: (products: Product[]) => void): Subscription
```

---

### 9. Company Service
**Registry Key:** `company`  
**Purpose:** Company/organization management and configuration  
**Dual Mode:** Mock + Supabase

**Key Methods:**
```typescript
getCompanies(filters?: CompanyFilters): Promise<Company[]>
getCompany(id: string): Promise<Company>
getCompanyByDomain(domain: string): Promise<Company | null>
createCompany(data: CreateCompanyDTO): Promise<Company>
updateCompany(id: string, data: UpdateCompanyDTO): Promise<Company>
deleteCompany(id: string): Promise<void>
searchCompanies(query: string): Promise<Company[]>
updateSubscription(companyId: string, plan: SubscriptionPlan): Promise<void>
getCompanyStats(): Promise<CompanyStats>
subscribeToCompanies(callback: (companies: Company[]) => void): Subscription
```

---

### 10. User Service
**Registry Key:** `user`  
**Purpose:** User management, profiles, and administration  
**Dual Mode:** Mock + Supabase

**Key Methods:**
```typescript
getUsers(filters?: UserFilters): Promise<User[]>
getUser(id: string): Promise<User>
createUser(data: CreateUserDTO): Promise<User>
updateUser(id: string, data: UpdateUserDTO): Promise<User>
deleteUser(id: string): Promise<void>
resetPassword(userId: string): Promise<void>
getUserStats(): Promise<UserStats>
getRoles(): Promise<Role[]>
getStatuses(): Promise<UserStatus[]>
getUserActivity(userId: string): Promise<ActivityLog[]>
logActivity(userId: string, action: string, details: any): Promise<void>
getTenants(userId: string): Promise<Tenant[]>
```

---

### 11. RBAC Service
**Registry Key:** `rbac`  
**Purpose:** Role-based access control, permissions, and policy management  
**Dual Mode:** Mock + Supabase

**Key Methods:**
```typescript
getPermissions(): Promise<Permission[]>
getRoles(): Promise<Role[]>
createRole(data: CreateRoleDTO): Promise<Role>
updateRole(id: string, data: UpdateRoleDTO): Promise<Role>
deleteRole(id: string): Promise<void>
assignUserRole(userId: string, roleId: string): Promise<void>
removeUserRole(userId: string, roleId: string): Promise<void>
getPermissionMatrix(): Promise<PermissionMatrix>
getRoleTemplates(): Promise<RoleTemplate[]>
```

---

### 12. UI Notification Service
**Registry Key:** `uinotification`  
**Purpose:** Client-side UI notifications and toasts  
**Mode:** Mock only (client-side, no backend)

**Key Methods:**
```typescript
showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error', duration?: number): void
hideNotification(id: string): void
clearNotifications(): void
```

---

### 13. Notification Service
**Registry Key:** `notification`  
**Purpose:** Backend notification system for emails, SMS, push  
**Dual Mode:** Mock + Supabase

**Key Methods:**
```typescript
getNotifications(filters?: NotificationFilters): Promise<Notification[]>
getNotification(id: string): Promise<Notification>
createNotification(data: CreateNotificationDTO): Promise<Notification>
markAsRead(id: string): Promise<void>
markAllAsRead(): Promise<void>
deleteNotification(id: string): Promise<void>
```

---

### 14. Tenant Service ⭐ Consolidated
**Registry Key:** `tenant`  
**Purpose:** Tenant management + metrics + directory (consolidated from 3 services)  
**Dual Mode:** Mock + Supabase  
**Consolidates:** tenantMetricsService, tenantDirectoryService

**Key Methods:**
```typescript
// Core Tenant Methods
getTenants(filters?: TenantFilters): Promise<Tenant[]>
getTenant(id: string): Promise<Tenant>
createTenant(data: CreateTenantDTO): Promise<Tenant>
updateTenant(id: string, data: UpdateTenantDTO): Promise<Tenant>
deleteTenant(id: string): Promise<void>

// Directory Methods (formerly tenantDirectoryService)
getAllTenants(): Promise<TenantDirectoryEntry[]>
getTenantsByStatus(status: TenantStatus): Promise<TenantDirectoryEntry[]>
getTenantStats(): Promise<TenantStats>
updateTenantStats(tenantId: string, stats: Partial<TenantStats>): Promise<void>

// Metrics Methods (formerly tenantMetricsService)
getTenantMetrics(tenantId: string): Promise<TenantMetrics>
getComparisonMetrics(tenantIds: string[]): Promise<MetricsComparison>
getMetricsTrend(tenantId: string, period: TimePeriod): Promise<MetricsTrend[]>
recordMetric(tenantId: string, metric: MetricData): Promise<void>
```

---

### 15. Multi-Tenant Service
**Registry Key:** `multitenant`  
**Purpose:** Multi-tenant context management (infrastructure-level)  
**Mode:** Supabase only (infrastructure service)

**Key Methods:**
```typescript
initializeTenantContext(tenantId: string, userId: string): Promise<void>
getCurrentTenant(): Promise<Tenant | null>
getCurrentTenantId(): Promise<string | null>
getCurrentUserId(): Promise<string | null>
setCurrentTenant(tenantId: string): Promise<void>
subscribe(callback: (tenant: Tenant) => void): Subscription
clearTenantContext(): Promise<void>
hasRole(role: string): boolean
getUserTenants(): Promise<Tenant[]>
switchTenant(tenantId: string): Promise<void>
```

---

### 16. Ticket Service
**Registry Key:** `ticket`  
**Purpose:** Issue/ticket tracking and management  
**Dual Mode:** Mock + Supabase

**Key Methods:**
```typescript
getTickets(filters?: TicketFilters): Promise<Ticket[]>
getTicket(id: string): Promise<Ticket>
createTicket(data: CreateTicketDTO): Promise<Ticket>
updateTicket(id: string, data: UpdateTicketDTO): Promise<Ticket>
deleteTicket(id: string): Promise<void>
searchTickets(query: string): Promise<Ticket[]>
getTicketStats(): Promise<TicketStats>
```

---

### 17. Super Admin Management Service
**Registry Key:** `superadminmanagement`  
**Purpose:** Super admin lifecycle management (create, update, delete, audit)  
**Dual Mode:** Mock + Supabase

**Key Methods:**
```typescript
getSuperAdmins(filters?: SuperAdminFilters): Promise<SuperAdmin[]>
getSuperAdmin(id: string): Promise<SuperAdmin>
createSuperAdmin(data: CreateSuperAdminDTO): Promise<SuperAdmin>
updateSuperAdmin(id: string, data: UpdateSuperAdminDTO): Promise<SuperAdmin>
deleteSuperAdmin(id: string): Promise<void>
getSuperAdminStats(): Promise<SuperAdminStats>
getSuperAdminActivity(superAdminId: string): Promise<ActivityLog[]>
```

---

### 18. Super Admin Service
**Registry Key:** `superadmin`  
**Purpose:** Super admin dashboard and operations  
**Dual Mode:** Mock + Supabase

**Key Methods:**
```typescript
getDashboardStats(): Promise<DashboardStats>
getCompanyStats(): Promise<CompanyStats>
getSystemStats(): Promise<SystemStats>
getRecentActivity(): Promise<ActivityLog[]>
getAlerts(): Promise<Alert[]>
resolveAlert(alertId: string): Promise<void>
getPermissionOverrides(): Promise<PermissionOverride[]>
grantPermissionOverride(userId: string, permission: string): Promise<void>
revokePermissionOverride(userId: string, permission: string): Promise<void>
```

---

### 19. Role Request Service
**Registry Key:** `rolerequest`  
**Purpose:** Role elevation and permission request management  
**Dual Mode:** Mock + Supabase

**Key Methods:**
```typescript
getRequests(filters?: RoleRequestFilters): Promise<RoleRequest[]>
getRequest(id: string): Promise<RoleRequest>
createRequest(data: CreateRoleRequestDTO): Promise<RoleRequest>
updateRequest(id: string, data: UpdateRoleRequestDTO): Promise<RoleRequest>
approveRequest(requestId: string): Promise<void>
rejectRequest(requestId: string, reason: string): Promise<void>
getRequestStats(): Promise<RoleRequestStats>
```

---

### 20. Audit Service ⭐ Consolidated
**Registry Key:** `audit`  
**Purpose:** Audit logs, compliance, metrics, retention (consolidated from 4 services)  
**Dual Mode:** Mock + Supabase  
**Consolidates:** auditDashboardService, auditRetentionService, complianceReportService, impersonationActionTracker

**Key Methods:**
```typescript
// Audit Methods
getAuditLogs(filters?: AuditLogFilters): Promise<AuditLog[]>
getAuditSummary(): Promise<AuditSummary>
getUserActivity(userId: string): Promise<ActivityLog[]>
getSystemChanges(): Promise<SystemChange[]>
exportAuditLog(format: 'csv' | 'excel'): Promise<Blob>

// Retention Methods (formerly auditRetentionService)
getRetentionPolicy(): Promise<RetentionPolicy>
updateRetentionPolicy(policy: RetentionPolicy): Promise<void>

// Compliance Report Methods (formerly complianceReportService)
getComplianceReport(period: TimePeriod): Promise<ComplianceReport>
```

---

### 21. Compliance Notification Service
**Registry Key:** `compliancenotification`  
**Purpose:** Compliance alerts for suspicious activity and policy violations  
**Dual Mode:** Mock + Supabase

**Key Methods:**
```typescript
alertSuspiciousActivity(userId: string, details: SuspiciousActivityDetails): Promise<void>
alertSecurityBreach(breachDetails: SecurityBreachDetails): Promise<void>
alertUnauthorizedAccess(accessAttempt: UnauthorizedAccessAttempt): Promise<void>
```

---

### 22. Impersonation Service
**Registry Key:** `impersonation`  
**Purpose:** Impersonation session management and logging  
**Mode:** Supabase only (complex backend logic)

**Key Methods:**
```typescript
getImpersonationLogs(filters?: ImpersonationLogFilters): Promise<ImpersonationLog[]>
getImpersonationLogsByUserId(userId: string): Promise<ImpersonationLog[]>
getImpersonationLogById(id: string): Promise<ImpersonationLog>
startImpersonation(adminId: string, targetUserId: string): Promise<ImpersonationSession>
endImpersonation(sessionId: string): Promise<void>
getActiveImpersonations(): Promise<ImpersonationSession[]>
```

---

### 23. Rate Limit Service
**Registry Key:** `ratelimit`  
**Purpose:** Rate limiting, session controls, and impersonation limits  
**Dual Mode:** Mock + Supabase  
**Aliases:** impersonationRateLimitService

**Key Methods:**
```typescript
getConfig(): Promise<RateLimitConfig>
updateConfig(config: Partial<RateLimitConfig>): Promise<void>
checkRateLimit(key: string): Promise<boolean>
recordOperationStart(key: string): Promise<void>
recordOperationEnd(key: string): Promise<void>
getStatus(key: string): Promise<RateLimitStatus>

// Impersonation-specific Methods
checkImpersonationRateLimit(userId: string): Promise<boolean>
recordImpersonationStart(userId: string): Promise<void>
recordImpersonationEnd(userId: string): Promise<void>
checkSessionDurationExceeded(sessionId: string): Promise<boolean>

// Admin Methods
getRateLimitStats(): Promise<RateLimitStats>
getActiveSessions(): Promise<Session[]>
forceTerminateSession(sessionId: string): Promise<void>
getViolations(): Promise<RateLimitViolation[]>
clearViolations(key: string): Promise<void>
cleanupExpiredSessions(): Promise<void>
resetRateLimits(): Promise<void>
```

---

### 24. Reference Data Service
**Registry Key:** `referencedata`  
**Purpose:** Reference data, dropdowns, system configuration  
**Dual Mode:** Mock + Supabase  
**Alias:** referenceDataLoader

**Key Methods:**
```typescript
getAllReferenceData(): Promise<ReferenceData>
loadAllReferenceData(): Promise<void>
getStatusOptions(): Promise<StatusOption[]>
getReferenceData(key: string): Promise<any>
getCategories(): Promise<Category[]>
getSuppliers(): Promise<Supplier[]>

createStatusOption(data: CreateStatusOptionDTO): Promise<StatusOption>
createReferenceData(key: string, value: any): Promise<void>
createCategory(name: string): Promise<Category>
createSupplier(data: CreateSupplierDTO): Promise<Supplier>

updateStatusOption(id: string, data: UpdateStatusOptionDTO): Promise<StatusOption>
updateReferenceData(key: string, value: any): Promise<void>
updateCategory(id: string, name: string): Promise<Category>
updateSupplier(id: string, data: UpdateSupplierDTO): Promise<Supplier>

deleteStatusOption(id: string): Promise<void>
deleteReferenceData(key: string): Promise<void>
deleteCategory(id: string): Promise<void>
deleteSupplier(id: string): Promise<void>
```

---

## Service Aliases

Some services are accessible under multiple names for backward compatibility:

```typescript
// All route to 'audit'
auditService
auditDashboardService
auditRetentionService
auditComplianceReportService

// All route to 'tenant'
tenantService
tenantMetricsService
tenantDirectoryService

// Both route to 'ratelimit'
rateLimitService
impersonationRateLimitService

// Both route to 'referencedata'
referenceDataService
referenceDataLoader
```

---

## Usage Patterns

### Import All Services
```typescript
import {
  authService,
  serviceContractService,
  contractService,
  productSaleService,
  salesService,
  customerService,
  jobWorkService,
  productService,
  companyService,
  userService,
  rbacService,
  uiNotificationService,
  notificationService,
  tenantService,
  multiTenantService,
  ticketService,
  superAdminManagementService,
  superAdminService,
  roleRequestService,
  auditService,
  complianceNotificationService,
  impersonationService,
  rateLimitService,
  referenceDataService,
} from '@/services';
```

### Service Factory
```typescript
import { serviceFactory } from '@/services';

// Get service by registry key
const authSvc = serviceFactory.getService('auth');
const productSvc = serviceFactory.getService('product');

// List all available services
const allServices = serviceFactory.listAvailableServices();

// Check current mode
const mode = serviceFactory.getApiMode(); // 'mock' | 'supabase' | 'real'

// Switch mode (debug/test)
serviceFactory.setApiMode('supabase');
```

---

## Consolidation History

| Phase | Action | Services | Result |
|-------|--------|----------|--------|
| Phase 1 | Initial | 64 services | Baseline |
| Phase 2 | Audit consolidation | 64 → ~50 | Reduced 14 services |
| Phase 2 | impersonationActionTracker merge | 50 → 50 | Routed to audit |
| Phase 2 | tenantDirectoryService merge | 50 → 50 | Routed to tenant |
| Phase 2 | tenantMetricsService merge | 50 → 50 | Routed to tenant |
| Phase 3 | Registry cleanup | 50 → 24 | Removed retired entries |

**Total Registry Size:** 24 services (target: 20-22 after Phase 4)

---

## Error Handling

All services follow consistent error patterns:

```typescript
try {
  const data = await authService.login(email, password);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
  } else if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

---

## Performance Notes

**Service Resolution Overhead:** <0.07ms per call  
**Proxy Method Binding:** Negligible (<0.02ms)  
**Memory Per Service:** ~2KB

Total overhead for all 24 services: **~48KB** (negligible impact)

---

## Related Documentation

- **ARCHITECTURE.md** - Overall factory design & patterns
- **src/services/serviceFactory.ts** - Implementation details (497 lines)
- **Dual Mock/Supabase Pattern** - Service strategy
- **Phase 2 Consolidation** - Earlier service reductions
- **Phase 3 Optimization** - Proxy pattern implementation

---

**Last Updated:** November 13, 2025 | **Service Count:** 24 | **Status:** Production-Ready

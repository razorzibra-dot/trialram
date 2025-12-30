# PDS CRM Application - Repository Documentation

**Last Updated:** December 29, 2025  
**Current Architecture:** Service Factory Pattern with 24 Unified Services  
**RBAC System:** Database-Driven Role-Based Access Control  
**Phase:** Production-Ready Implementation  
**Reference Module:** Customers module (canonical ModuleDataProvider + single-load pattern)  
**Integration Guide:** See `src/services/page/INTEGRATION_CHECKLIST.md` for migration steps  
**Critical Fix:** Cache invalidation after mutations (2025-12-29) - See Rule 1A

---

## Table of Contents

1. [System Overview](#1-system-overview)
   - [Rule 1A: Cache Invalidation After Mutations](#-rule-1a-critical---cache-invalidation-after-mutations-mandatory) ⚠️ **CRITICAL**
2. [RBAC (Role-Based Access Control) System](#2-rbac-role-based-access-control-system)
   - [Centralized Permission Context Pattern](#-centralized-permission-context-pattern-critical-for-ui)
3. [Service Layer Architecture](#3-service-layer-architecture)
4. [Application Modules](#4-application-modules)
5. [Layer Sync Rules](#5-layer-sync-rules)
6. [Database Schema](#6-database-schema)
7. [Implementation Guidelines](#7-implementation-guidelines)
8. [Development Standards](#8-development-standards)
9. [Rules for Future Implementation](#9-rules-for-future-implementation)
10. [Tenant ID Security Guidelines](#10-tenant-id-security-guidelines)
11. [Form Success Message Pattern](#11-form-success-message-pattern---critical-ux)
12. [Emergency Procedures](#12-emergency-procedures)
13. [Tenant Validation System](#13-tenant-validation-system---critical-security)
14. [Import Standardization Policy](#14-import-standardization-policy---prevent-vite-warnings)

---

## 1. System Overview

### 1.1 Architecture Pattern

The CRM application follows a **Service Factory Architecture** with:
- **24 unified services** with mock/supabase switching capability
- **ES6 Proxy-based delegation** (68% code reduction from traditional approach)
- **Multi-tenant architecture** with RLS (Row Level Security) enforcement
- **16 feature modules** with consistent registration pattern
- **Database-driven RBAC** with fallback permission system

### 1.2 Core Components

```
┌─────────────────────────────────────────────────────┐
│         Application (React Components)              │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  Service Proxies (authService, productService...)   │ ◄── Exports
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│     createServiceProxy(registryKey: string)         │ ◄── Proxy Factory
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│      ServiceFactory Class                           │
│   ├─ getService(serviceName): any                   │
│   ├─ getApiMode(): ApiMode                          │
│   └─ serviceRegistry: { [key]: ServiceEntry }       │ ◄── Core
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   ┌─────────────┐    ┌─────────────┐
   │  Mock Mode  │    │ Supabase    │
   │  Services   │    │ Services    │
   └─────────────┘    └─────────────┘
```

### 1.3 API Modes

- **Mock Mode** (`VITE_API_MODE=mock`): Development and testing with simulated data
- **Supabase Mode** (`VITE_API_MODE=supabase`): Production with PostgreSQL backend
- **Real API Mode** (`VITE_API_MODE=real`): Future integration with real backend services

### 1.4 Enterprise Performance Optimization Rules

⚠️ **CRITICAL**: All services MUST follow these patterns to avoid redundant API calls and maintain enterprise-grade performance.

#### 🎯 Rule 1A: CRITICAL - Cache Invalidation After Mutations (Mandatory)
**Added:** 2025-12-29  
**Severity:** CRITICAL - Causes stale data bugs if not implemented

**Problem:** Services with in-memory caches (listCache, detailCache) must clear them after create/update/delete operations. Otherwise, subsequent reads return STALE data even after PageDataService refresh.

**Example Bug Scenario:**
1. User creates a customer
2. React Query invalidates its cache
3. PageDataService calls `customerService.findMany()`
4. CustomerService returns cached data (stale!)
5. UI shows old count/data

**✅ MANDATORY Implementation:**
```typescript
// Example: CustomerService
export class CustomerService extends GenericCrudService<Customer, ...> {
  private listCache: Map<string, { data: { data: Customer[]; total: number }; timestamp: number }> = new Map();
  private listInFlight: Map<string, Promise<{ data: Customer[]; total: number }>> = new Map();
  private detailCache: Map<string, { data: Customer | null; timestamp: number }> = new Map();
  private detailInFlight: Map<string, Promise<Customer | null>> = new Map();
  
  /**
   * Clear cache after CREATE
   */
  protected async afterCreate(entity: Customer): Promise<void> {
    try {
      this.listCache.clear();
      this.listInFlight.clear();
      console.log('[CustomerService] Cache cleared after create');
    } catch {}
  }
  
  /**
   * Clear cache after UPDATE
   */
  async update(id: string, data: Partial<Customer>, context?: any): Promise<Customer> {
    const updated = await this.repository.update(id, data);
    await this.afterUpdate?.(updated);
    
    // Invalidate list caches
    try {
      this.listCache.clear();
      this.listInFlight.clear();
      console.log('[CustomerService] Cache cleared after update');
    } catch {}
    
    // Update detail cache with fresh data
    try {
      this.detailCache.set(id, { data: updated, timestamp: Date.now() });
    } catch {}
    
    return updated;
  }
  
  /**
   * Clear cache after DELETE
   */
  async delete(id: string, context?: any): Promise<void> {
    await super.delete(id, context);
    
    // Clear ALL caches
    try {
      this.listCache.clear();
      this.listInFlight.clear();
      this.detailCache.delete(id);
      this.detailInFlight.delete(id);
      console.log('[CustomerService] Cache cleared after delete');
    } catch {}
  }
}
```

**⚠️ CHECKLIST for ALL Entity Services:**
- [ ] afterCreate hook clears listCache + listInFlight
- [ ] update method clears listCache + listInFlight
- [ ] delete method clears all 4 caches (list + detail, both in-flight and cached)
- [ ] Add console.log for debugging
- [ ] Test create/update/delete → UI updates immediately without F5

**Services Status:**
- ✅ CustomerService (`src/services/customer/supabase/customerService.ts`) - Fixed 2025-12-29
- ⚠️ DealService - TODO: Add cache clearing
- ⚠️ ProductService - TODO: Add cache clearing
- ⚠️ TicketService - TODO: Add cache clearing
- ⚠️ ComplaintService - TODO: Add cache clearing
- ⚠️ ServiceContractService - TODO: Add cache clearing
- ⚠️ JobWorkService - TODO: Add cache clearing
- ⚠️ ALL future entity services MUST implement this pattern

**Related Documentation:**
- `ENTITY_MUTATION_REFRESH_PATTERN.md` - Full mutation refresh flow
- `MUTATION_REFRESH_DIAGNOSTIC.md` - Troubleshooting guide
- `MUTATION_REFRESH_QUICK_REFERENCE.md` - Quick reference

---

#### 🎯 Rule 1: Reference Data - Single Load Pattern
**Principle:** Load ALL reference data ONCE on app initialization. Components read from context (zero API calls).

**✅ CORRECT Implementation:**
```typescript
// Service Layer: src/services/referencedata/supabase/referenceDataService.ts
class ReferenceDataService {
  private allDataCache: Map<string, { data: AllReferenceData; timestamp: number }> = new Map();
  private inFlightFetches: Map<string, Promise<AllReferenceData>> = new Map();
  
  async getAllReferenceData(tenantId?: string): Promise<AllReferenceData> {
    // 1. Check cache first
    const cached = this.allDataCache.get(cacheKey);
    if (cached && isFresh(cached)) return cached.data;
    
    // 2. Dedupe in-flight requests
    const inFlight = this.inFlightFetches.get(cacheKey);
    if (inFlight) return inFlight;
    
    // 3. Fetch ONCE: status_options, reference_data, suppliers (3 queries)
    // 4. Extract categories from reference_data client-side (zero extra query)
    // 5. Cache results for 5 minutes
  }
  
  // All getters use cached data (zero API calls)
  async getCategories(tenantId?: string): Promise<ProductCategory[]> {
    const allData = await this.getAllReferenceData(tenantId); // Uses cache
    return allData.categories;
  }
}
```

**Context Layer:** `src/contexts/ReferenceDataContext.tsx`
```typescript
// Load once on mount, serve from memory thereafter
const ReferenceDataProvider = ({ children }) => {
  // Tenant-scoped cache survives React StrictMode double-render
  const tenantCache: Map<string, CacheState> = new Map();
  
  useEffect(() => {
    // Load ALL reference data once per tenant
    fetchAllReferenceData(); // Calls getAllReferenceData service
  }, [tenantId]);
  
  // Components read from context state (zero API calls)
  return <Context.Provider value={{ statusOptions, categories, suppliers }}>
};
```

**Component Usage:**
```typescript
// ✅ Read from context (zero API calls)
const { categories, suppliers } = useReferenceData();
const { options } = useCategories(); // Uses context data
```

**❌ WRONG - DO NOT DO THIS:**
```typescript
// ❌ Direct service calls bypass cache
const categories = await referenceDataService.getCategories();

// ❌ Separate queries for same data
await supabase.from('reference_data').select('*').eq('category', 'product_category');
await supabase.from('reference_data').select('*'); // DUPLICATE!
```

**Performance Impact:**
- Before: 4+ API calls per page load
- After: 3 API calls on first load, 0 thereafter
- Reduction: **75-100%** ⬇️

---

#### 🎯 Rule 2: Session Management - Centralized Cache Pattern
**Principle:** Load user + tenant ONCE on login. All services read from SessionService cache (zero API calls).

**✅ CORRECT Implementation:**
```typescript
// Centralized Service: src/services/session/SessionService.ts
class SessionService {
  private sessionCache: SessionData | null = null; // Memory cache
  
  // Load ONCE on login
  async initializeSession(userId: string): Promise<SessionData> {
    // Single query: user + role + tenant (2 API calls total)
    const userData = await supabase.from('users').select('*, user_roles(role:roles(*))').eq('id', userId).single();
    const tenantData = userData.tenant_id ? await supabase.from('tenants').select('*').eq('id', userData.tenant_id).single() : null;
    
    // Cache in memory + sessionStorage
    this.sessionCache = { user, tenant };
    sessionStorage.setItem('session', JSON.stringify(this.sessionCache));
    return this.sessionCache;
  }
  
  // All services use these (ZERO API calls)
  getCurrentUser(): User | null { return this.sessionCache?.user || null; }
  getTenantId(): string | null { return this.sessionCache?.tenant?.id || null; }
  getTenant(): TenantInfo | null { return this.sessionCache?.tenant || null; }
  
  // Clear on logout
  clearSession(): void {
    this.sessionCache = null;
    sessionStorage.removeItem('session');
  }
}

export const sessionService = SessionService.getInstance();
```

**Service Usage:**
```typescript
// ✅ All services read from cache (zero API calls)
import { sessionService } from '@/services/session/SessionService';

class CustomerService {
  async getCustomers() {
    const tenantId = sessionService.getTenantId(); // Zero API calls
    const user = sessionService.getCurrentUser(); // Zero API calls
    
    // Use cached session data in query
    return supabase.from('customers').select('*').eq('tenant_id', tenantId);
  }
}
```

**AuthContext Integration:**
```typescript
// On login: Initialize once
await sessionService.initializeSession(userId);

// On page refresh: Load from sessionStorage (zero API calls)
const user = sessionService.getCurrentUser();

// On logout: Clear cache
sessionService.clearSession();
```

**❌ WRONG - DO NOT DO THIS:**
```typescript
// ❌ Fetching user/tenant in every service method
class MyService {
  async getData() {
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single(); // DUPLICATE!
    const { data: tenant } = await supabase.from('tenants').select('*').eq('id', user.tenant_id).single(); // DUPLICATE!
  }
}

// ❌ Multiple calls to getCurrentUser/getTenant
await multiTenantService.initializeTenantContext(userId); // Makes API calls
await authService.getCurrentUser(); // Makes more API calls
```

**Performance Impact:**
- Before: 4-6 API calls on login, 3-5 on page refresh, 1-2 per service call
- After: 2 API calls on login, 0 on page refresh, 0 per service call
- Reduction: **80-100%** ⬇️

---

#### 🎯 Rule 3: Service-Level Caching - In-Flight Deduplication
**Principle:** Prevent duplicate requests during React StrictMode double-render and concurrent component mounts.

**✅ CORRECT Implementation:**
```typescript
class UserService {
  // Short-lived cache (1 minute) + in-flight request deduplication
  private listInFlight: Map<string, Promise<User[]>> = new Map();
  private listCache: Map<string, { data: User[]; timestamp: number }> = new Map();
  private cacheTtlMs = 60 * 1000;
  
  async getUsers(filters?: UserFilters): Promise<User[]> {
    const cacheKey = `${tenantId}|${JSON.stringify(filters)}`;
    
    // 1. Return fresh cache
    const cached = this.listCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.data;
    }
    
    // 2. Dedupe concurrent requests
    const inFlight = this.listInFlight.get(cacheKey);
    if (inFlight) return inFlight;
    
    // 3. Fetch and cache
    const fetchPromise = this.fetchUsers(filters);
    this.listInFlight.set(cacheKey, fetchPromise);
    
    try {
      const result = await fetchPromise;
      this.listCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } finally {
      this.listInFlight.delete(cacheKey);
    }
  }
}
```

**Apply to ALL services with list/detail methods:**
- ✅ NavigationService: In-flight cache for `getNavigationItems()`
- ✅ UserService: In-flight cache for `getUsers()` and `getUser(id)`
- ✅ CustomerService: In-flight cache for `findMany()` and `findOne(id)`
- ✅ All other entity services following same pattern

**❌ WRONG - DO NOT DO THIS:**
```typescript
// ❌ No caching - every call hits database
class MyService {
  async getItems() {
    return supabase.from('items').select('*'); // Called multiple times!
  }
}
```

**Performance Impact:**
- Before: 2-4x duplicate requests during page load (React StrictMode)
- After: Single request regardless of component mount count
- Reduction: **50-75%** ⬇️

---

#### 📋 Performance Checklist for New Features

Before implementing ANY new feature, verify:

✅ **Reference Data:**
- [ ] Uses `ReferenceDataContext` (not direct service calls)
- [ ] No separate queries for categories/statuses/suppliers
- [ ] Service methods use `getAllReferenceData()` cache

✅ **Session Data:**
- [ ] Uses `sessionService.getCurrentUser()` (not API calls)
- [ ] Uses `sessionService.getTenantId()` (not queries)
- [ ] No user/tenant fetches in service methods

✅ **Service Caching:**
- [ ] List methods have in-flight deduplication
- [ ] Detail methods have in-flight deduplication
- [ ] Cache keys include tenant + filters
- [ ] TTL set appropriately (1-5 minutes)

✅ **React Query Integration:**
- [ ] Hooks use `staleTime: 5 * 60 * 1000` (5 minutes)
- [ ] Hooks use `refetchOnMount: false`
- [ ] Query keys are stable (JSON.stringify filters)
- [ ] Cache invalidation on mutations

---

#### 🚨 Common Anti-Patterns to AVOID

❌ **Anti-Pattern 1:** Fetching reference data in components
```typescript
// ❌ WRONG
const MyComponent = () => {
  const { data } = useQuery(['categories'], () => referenceDataService.getCategories());
};
```

✅ **Correct:**
```typescript
// ✅ RIGHT
const MyComponent = () => {
  const { categories } = useReferenceData(); // From context
};
```

❌ **Anti-Pattern 2:** Fetching user/tenant in services
```typescript
// ❌ WRONG
class MyService {
  async getData() {
    const user = await this.fetchCurrentUser(); // API call!
    const tenant = await this.fetchTenant(user.tenant_id); // Another API call!
  }
}
```

✅ **Correct:**
```typescript
// ✅ RIGHT
class MyService {
  async getData() {
    const user = sessionService.getCurrentUser(); // Cache
    const tenantId = sessionService.getTenantId(); // Cache
  }
}
```

❌ **Anti-Pattern 3:** No deduplication in services
```typescript
// ❌ WRONG - Multiple components mounting = multiple identical API calls
class MyService {
  async getItems() {
    return supabase.from('items').select('*');
  }
}
```

✅ **Correct:**
```typescript
// ✅ RIGHT - In-flight cache prevents duplicates
class MyService {
  private inFlight: Map<string, Promise<any>> = new Map();
  async getItems() {
    if (this.inFlight.has(key)) return this.inFlight.get(key);
    const promise = supabase.from('items').select('*');
    this.inFlight.set(key, promise);
    return promise;
  }
}
```

---

### 1.5 Performance Monitoring

**Network Tab Verification:**
- [ ] Reference data: Max 3 calls on first load (status_options, reference_data, suppliers)
- [ ] Session data: 2 calls on login (user, tenant), 0 on refresh
- [ ] List endpoints: Single call per unique filter combination
- [ ] No duplicate requests during page load

**Console Log Verification:**
```
[ReferenceDataService] ♻️ Returning cached reference data
[SessionService] 📦 Loaded session from storage
[NavigationService] ⏳ Reusing in-flight fetch
[UserService] ♻️ Returning cached users
```

**Expected Results:**
- Initial app load: ~15-20 API calls total
- Page navigation: 0-3 API calls (only new data)
- Page refresh: 0 API calls (all from cache)

---

## 2. RBAC (Role-Based Access Control) System

### 2.1 Role Hierarchy & Responsibilities

**Database Role Names vs User Type Enum Mapping:**

| Database Role | User Type Enum | Tenant Scope | Responsibilities |
|---------------|----------------|--------------|------------------|
| `super_admin` | `super_admin` | **Platform-level** | Platform administration, cross-tenant access, impersonation |
| `admin` | `admin` | **Single tenant** | Full tenant management, user lifecycle, role assignment |
| `manager` | `manager` | **Single tenant** | Team management, limited user editing, password resets |
| `user` | `user` | **Single tenant** | Standard CRM operations, limited user editing |
| `engineer` | `engineer` | **Single tenant** | Technical operations, product management, limited user editing |
| `customer` | `customer` | **Single tenant** | Read-only access to own data and basic CRM features |

**✅ Role Names Normalized**: Database role names now match UserRole enum exactly. No mapping needed.

**✅ No Role Mapping Needed**: Database role names match UserRole enum exactly:
- Database stores: `'admin'`, `'manager'`, `'user'`, `'engineer'`, `'customer'`, `'super_admin'`
- UserRole enum: `'admin'`, `'manager'`, `'user'`, `'engineer'`, `'customer'`, `'super_admin'`
- Direct usage: `role.name` can be used directly as `UserRole` without mapping

### 2.2 Role Responsibilities Detailed

**Super Admin (`super_admin`) - Platform Level (Level 1):**
- **Tenant Management:** Create, update, delete, and manage all tenants in the system
- **System Administration:** Full access to system configuration and setup
- **Role & Permission Management:** Manage system roles, permissions, and access control
- **System Monitoring:** Access to system logs, audit trails, and monitoring dashboards
- **Tenant Billing:** Manage tenant subscriptions, billing cycles, and payment processing
- **Feature Management:** Control tenant feature accessibility based on subscription plans
- **Tenant Configuration:** Set up and configure CRM features for subscribed tenants
- **Cross-tenant Operations:** Access to all tenant data for support and maintenance
- **Platform Analytics:** Access to platform-wide analytics and reporting
- **System Security:** Manage platform security settings and compliance
- **Tenant Onboarding:** Assist with tenant setup and initial configuration
- **Tenant Complaint Management:** Handle tenant-level complaints and escalations
- **No tenant isolation** - bypasses all RLS policies for platform management

**Administrator (`admin`) - Tenant Level (Level 2):**
- **Tenant CRM Operations:** Full management of tenant's CRM features and business operations
- **User Management:** Create, edit, delete tenant users (except other administrators)
- **Role Assignment:** Assign and manage roles within the tenant (Manager, Engineer, User, Customer)
- **Business Configuration:** Configure tenant settings, workflows, and business rules
- **Data Management:** Full access to tenant data (customers, sales, tickets, products, contracts)
- **Feature Access Control:** Manage feature access for subordinate roles as per business needs
- **Reporting & Analytics:** Access to tenant-level reports and analytics
- **Business Rules:** Configure business processes and approval workflows
- **Integration Management:** Manage third-party integrations and API access
- **Security Management:** Configure tenant security settings and access controls
- **Cannot Create/Manage Tenants** - restricted to tenant-level operations only
- **Tenant isolation enforced** - only access own tenant data

**Manager (`manager`) - Tenant Level (Level 3):**
- **Department Management:** Team oversight and department-level operations
- **User Profile Management:** Edit user profiles and reset passwords for subordinate users
- **Limited Administrative Functions:** Cannot delete users or change role assignments
- **Business Operations:** Full access to business operations except financial details
- **Department Reporting:** Access to department-level analytics and reporting
- **Workflow Management:** Manage approval workflows and business processes
- **Resource Management:** Allocate resources and manage department activities
- **Performance Monitoring:** Monitor team performance and KPIs
- **Customer Management:** Full access to customer relationship management
- **Sales Management:** Complete sales process management
- **Support Management:** Full access to ticket and complaint management
- **Financial Access:** **NO access to financial details, billing, or subscription information**
- **Role Customization:** Administrator can adjust role permissions based on business needs
- **Tenant isolation enforced** - only access own tenant data

**Engineer (`engineer`) - Tenant Level (Level 4):**
- **Technical Operations:** Product catalog management and service delivery
- **Product Management:** Full product catalog and inventory management
- **Service Management:** Manage service contracts and delivery processes
- **Technical Support:** Resolve technical issues and provide technical assistance
- **Job Work Management:** Manage job works, assignments, and completion tracking
- **System Configuration:** Limited access to technical system configuration
- **Quality Assurance:** Ensure quality standards and compliance
- **Documentation:** Maintain technical documentation and procedures
- **Integration Support:** Support technical integrations and troubleshooting
- **User Support:** Limited user management for technical support purposes
- **Role Customization:** Administrator can adjust role permissions based on technical needs
- **Limited Business Access:** Primarily technical focus with business access as needed
- **Tenant isolation enforced** - only access own tenant data

**User (`agent`) - Tenant Level (Level 5):**
- **Standard CRM Operations:** Day-to-day CRM activities and customer interactions
- **Customer Interactions:** Manage customer relationships and communications
- **Sales Activities:** Support sales processes and lead management
- **Ticket Management:** Handle support tickets and customer requests
- **Data Entry:** Create and update customer, sales, and service data
- **Reporting:** Basic reporting and data analysis
- **Profile Management:** Edit own profile and basic personal information
- **Communication:** Send and receive customer communications
- **Workflow Execution:** Execute assigned business processes and workflows
- **No User Management:** Cannot manage other users or system settings
- **Limited Administrative Access:** Restricted to operational functions
- **Role Customization:** Administrator can adjust role permissions based on operational needs
- **Department-specific Access:** Access limited to assigned department or function
- **Tenant isolation enforced** - only access own tenant data

**Customer (`customer`) - Tenant Level (Level 6):**
- **Self-Service Portal:** Access to customer portal for self-service functionality
- **Request Tracking:** Track their own requests, tickets, and service history
- **Profile Management:** Manage their own profile and company information
- **Communication:** Communicate with tenant's team through CRM interface
- **Document Access:** Access shared documents and resources
- **Service History:** View service history and transaction records
- **Basic Analytics:** Limited access to basic reporting and analytics
- **Feedback Management:** Submit feedback and ratings
- **No Administrative Access:** No access to user management or system settings
- **Read-Primary Access:** Primarily read-only with limited interactive capabilities
- **Tenant Restriction:** **ONLY access to their own data and records**
- **Role Customization:** Minimal customization as per tenant business requirements
- **Strict tenant isolation** - extremely restricted access scope

### 2.3 Role Customization and System Roles

**System Roles vs Custom Roles:**
- **System Roles:** Fixed roles (super_admin, admin, manager, engineer, agent, customer) that cannot be deleted or renamed
- **Custom Roles:** Administrator can create custom roles with specific feature access as per business needs
- **Permission Inheritance:** Custom roles inherit from system roles and can be customized further
- **Role Assignment:** Administrator assigns roles and can adjust access permissions based on business requirements

**Role Hierarchy and Access Levels:**
1. **Level 1 (Super Admin):** Platform-level access across all tenants
2. **Level 2 (Administrator):** Full tenant-level CRM operations, no tenant management
3. **Level 3 (Manager):** Department management with restricted financial access
4. **Level 4 (Engineer):** Technical operations with business access as needed
5. **Level 5 (User):** Standard CRM operations with operational focus
6. **Level 6 (Customer):** Self-service portal with restricted data access

**Business Needs Customization:**
- Administrator has full authority to adjust role permissions within tenant boundaries
- Role customization respects system role constraints and security boundaries
- Financial access is strictly controlled and only available to Administrator level
- Custom roles can be created to accommodate specific business workflows
- All role changes must maintain tenant isolation and security policies

### 2.3 Permission System

**Database-Driven Permission Structure:**
```typescript
interface Permission {
  id: string;           // unique identifier
  name: string;         // human-readable name
  description: string;  // detailed description
  category: 'core' | 'module' | 'administrative' | 'system';
  resource: string;     // affected resource
  action: string;       // allowed action
}
```

**Permission Categories:**

**1. Core Permissions (Basic Operations):**
- `read` - View and read data (global access)
- `write` - Create and edit data (global access)
- `delete` - Delete data (global access)

**2. Module Permissions (Feature-Specific):**
- `crm:customer:record:update` - Full customer management
- `crm:sales:deal:update` - Sales process management
- `manage_tickets` - Support ticket management
- `manage_products` - Product catalog management
- `manage_contracts` - Contract lifecycle management
- `crm:contract:service:update` - Service contract management
- `crm:support:complaint:update` - Complaint handling
- `crm:product-sale:record:update` - Product sales operations
- `manage_job_works` - Job work operations

**3. Administrative Permissions (User Management):**
- `crm:user:record:update` - User account management
- `crm:role:record:update` - Role and permission management
- `crm:analytics:insight:view` - Analytics and reporting access
- `crm:system:config:manage` - System configuration
- `view_audit_logs` - Audit log access

**4. System Permissions (Platform-Level):**
- `super_admin` - Platform administrator (super_admin role only)
- `crm:platform:tenant:manage` - Tenant management (super_admin only)
- `view_all_tenants` - Cross-tenant visibility (super_admin only)

### 2.4 Permission Implementation Details

**Fallback Permission System (When Database Permissions Unavailable):**
```typescript
const basicRolePermissions: Record<string, string[]> = {
  'super_admin': ['*'], // Super admin has all permissions
  'admin': [
    'read', 'write', 'delete',
    'crm:user:record:update', 'crm:role:record:update', 'crm:customer:record:update', 'crm:sales:deal:update',
    'manage_tickets', 'manage_contracts', 'manage_products', 
    'crm:contract:service:update', 'crm:support:complaint:update', 'crm:product-sale:record:update',
    'manage_job_works', 'view_dashboard', 'view_audit_logs'
  ],
  'manager': [
    'read', 'write', 'crm:customer:record:update', 'crm:sales:deal:update', 'manage_tickets',
    'manage_contracts', 'manage_products', 'crm:contract:service:update',
    'crm:support:complaint:update', 'crm:product-sale:record:update', 'manage_job_works',
    'view_dashboard', 'view_audit_logs'
  ],
  'agent': [
    'read', 'write', 'crm:customer:record:update', 'crm:sales:deal:update', 'manage_tickets',
    'crm:support:complaint:update', 'view_dashboard'
  ],
  'engineer': [
    'read', 'write', 'manage_products', 'manage_tickets', 
    'manage_job_works', 'view_dashboard'
  ],
  'customer': [
    'read', 'view_dashboard'
  ]
};
```

**Action-to-Permission Mapping:**
```typescript
private mapActionToPermission(action: string): string | null {
  const parts = action.split(':');
  if (parts.length < 2) return null;
  
  const resource = parts[0];
  const operation = parts[1];
  
  switch (operation) {
    case 'create':
    case 'edit':
    case 'delete':
    case 'change_status':
    case 'approve':
    case 'reject':
    case 'bulk_delete':
    case 'export':
    case 'view_audit':
      return `manage_${resource}`;
    
    case 'view':
    case 'view_details':
      return `manage_${resource}`;
    
    default:
      return `manage_${resource}`;
  }
}
```

### 2.5 Module Access Control

**Super Admin Modules (Platform-level only):**
```typescript
const SUPER_ADMIN_ONLY_MODULES = [
  'super-admin', 
  'system-admin', 
  'admin-panel',
  'tenant-management',
  'audit-logs'
];
```

**Tenant Modules (RBAC-controlled):**
```typescript
const TENANT_MODULES = [
  'customers', 'sales', 'contracts', 'service-contracts',
  'products', 'product-sales', 'tickets', 'complaints',
  'jobworks', 'notifications', 'reports', 'settings',
  'masters', 'dashboard', 'user-management', 'configuration'
];
```

**Access Control Logic:**
```typescript
if (user.isSuperAdmin) {
  return isSuperAdminModule(moduleName);
}

if (isTenantModule(moduleName)) {
  return authService.hasPermission(`manage_${moduleName}`);
}
```

### 2.6 Tenant Isolation Rules

- **Regular users:** Must have matching `tenant_id` for data access
- **Super admins:** Bypass tenant restrictions (`tenantId=null`)
- **RLS policies:** Enforce tenant isolation at database level
- **Cross-tenant access:** Attempts are logged and blocked
- **Tenant validation:** Security checks prevent tenant ID tampering

**⚠️ CRITICAL: Role and Permission Isolation for Tenant Admins**

**Tenant admins (Administrator role) must NOT see or access:**
1. **Super Admin Role**: The `super_admin` role should never appear in role dropdowns or role management for tenant admins
2. **Platform-Level Permissions**: Permissions with `category='system'` or `is_system_permission=true` should be hidden from tenant admins
   - Examples: `super_admin`, `crm:platform:control:admin`, `crm:platform:tenant:manage`, `system_monitoring`
3. **Other Tenants' Roles**: Tenant admins can only see roles for their own tenant (`tenant_id` must match)

**Implementation Requirements:**
- ⚠️ **USE SYSTEMATIC UTILITIES**: All tenant isolation logic must use `src/utils/tenantIsolation.ts` utilities, NOT hardcoded checks
- `userService.getRoles()` must fetch roles from `rbacService.getRoles()` (which applies systematic tenant isolation)
- `rbacService.getRoles()` must use `filterRolesByTenant()` utility to filter roles
- `rbacService.getPermissions()` must use `filterPermissionsByTenant()` utility to filter permissions
- `rbacService.createRole()` and `updateRole()` must use `canModifyRole()` utility for validation
- All role/permission access checks must use `isSuperAdmin()`, `canAccessRole()`, `canAccessPermission()` utilities

**Correct Implementation (Fully Dynamic Database-Driven Approach):**
```typescript
// ✅ CORRECT: Use fully dynamic database-driven utilities
import {
  isSuperAdmin,
  filterRolesByTenant,
  filterPermissionsByTenant,
  canModifyRole,
  canAccessRole,
} from '@/utils/tenantIsolation';
import {
  getValidUserRoles,
  isValidUserRole,
  mapUserRoleToDatabaseRole,
  isPlatformRoleByName,
} from '@/utils/roleMapping';

// ✅ CORRECT: Get valid roles from database (fully dynamic)
async getRoles(): Promise<UserRole[]> {
  // Fetches roles from database - no hardcoded values
  return await getValidUserRoles();
}

// ✅ CORRECT: Validate role using database check
async validateRole(role: string): Promise<void> {
  const isValid = await isValidUserRole(role);
  if (!isValid) {
    const validRoles = await getValidUserRoles();
    throw new Error(`Invalid role. Allowed: ${validRoles.join(', ')}`);
  }
}

// ✅ CORRECT: Map role using database lookup
async assignRole(userRole: UserRole): Promise<void> {
  // Looks up actual database role name - no hardcoded mapping
  const dbRoleName = await mapUserRoleToDatabaseRole(userRole);
  // Check if platform role using database flags
  const isPlatform = await isPlatformRoleByName(userRole);
  // ... rest of implementation
}

// ✅ CORRECT: Filter roles using database-driven utilities
async getRoles(tenantId?: string): Promise<Role[]> {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) return [];
  
  // Fetch all roles from database
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) return [];
  
  // Use systematic utility to filter based on tenant isolation rules
  return filterRolesByTenant(data || [], currentUser);
}
```

**❌ WRONG: Hardcoded values (DO NOT USE)**
```typescript
// ❌ WRONG: Hardcoded role array
const validRoles = ['super_admin', 'admin', 'manager', 'user', 'engineer', 'customer']; // Should fetch from database

// ❌ WRONG: Hardcoded role mapping
const roleMap = { 'admin': 'Administrator' }; // Should lookup from database

// ❌ WRONG: Hardcoded role name check
if (role.name === 'super_admin') return false; // Should use database flags

// ❌ WRONG: Hardcoded permission name check
if (['super_admin', 'crm:platform:control:admin'].includes(perm.name)) return false; // Should use database flags

// ❌ WRONG: Hardcoded role validation
if (!['admin', 'manager', 'user'].includes(userRole)) throw new Error('Invalid role'); // Should use isValidUserRole()

// ❌ WRONG: Hardcoded role arrays in navigation config
requiredRole: ['admin', 'manager', 'user'] // Should use permission checks only

// ❌ WRONG: Hardcoded role hierarchy
const roleHierarchy = { admin: 4, manager: 3, ... } // Should fetch from database (hierarchy_level column)
```

**⚠️ ACCEPTABLE: UI Display Only (Not for Security)**
```typescript
// ✅ ACCEPTABLE: Switch statements for UI icons/colors (display only, not security)
switch (role) {
  case 'admin': return <CrownIcon />; // OK for UI display
  case 'manager': return <ManagerIcon />; // OK for UI display
}

// ✅ ACCEPTABLE: Feature-to-permission mapping (not role mapping)
const featurePermissions = {
  customer_management: ['crm:customer:record:read'], // Maps features to permissions (DB-driven)
};

// ⚠️ FALLBACK: Hardcoded hierarchy for UI display only (documented as fallback)
// Should be removed when hierarchy_level column is added to roles table
const roleLevels = { admin: 5, manager: 4, ... }; // Documented as UI-only fallback
```

**Future-Proof Design:**
- ✅ All roles are fetched from database - adding new roles requires NO code changes
- ✅ All role mappings are derived from database - no hardcoded mappings
- ✅ Platform role detection uses database flags (`is_system_role`, `tenant_id`) - not hardcoded names
- ✅ Permission validation uses database flags (`category`, `is_system_permission`) - not hardcoded names
- ✅ Role cache (5 min TTL) ensures performance while staying dynamic
- ✅ Cache invalidation on role create/update/delete ensures consistency

**Why This Matters:**
- Prevents tenant admins from accidentally creating super admin users
- Maintains clear separation between platform-level and tenant-level operations
- Ensures tenant admins can only manage their own tenant's resources
- Prevents privilege escalation attacks

### 2.7 Permission Validation Flow

1. **Check synchronous permission cache** (for performance)
2. **Validate against user's role permissions** (database-driven)
3. **Apply tenant isolation rules** (RLS enforcement)
4. **Enforce role hierarchy restrictions** (role-based access)
5. **Log access attempts** for audit trail

### 2.8 Permission Checking Rules - CRITICAL

**⚠️ NEVER HARDCODE ROLE-BASED PERMISSIONS IN APPLICATION CODE**

**Rules:**
1. **Always use dynamic permissions from database**: Permissions are stored in `permissions` table, assigned to roles via `role_permissions`, and loaded into `user.permissions` array at login/session restore.
2. **Use `authService.hasPermission(permission)` for all checks**: This method checks `user.permissions` array dynamically loaded from database.
3. **NO hardcoded role checks**: Never check `if (user.role === 'admin')` or `if (user.role === 'super_admin')` to grant permissions. Only use role checks for UI display or logging purposes.
4. **NO hardcoded permission maps**: Never create static maps like `ROLE_PERMISSIONS: Record<UserRole, Permission[]>` in application code. These should only exist in database seed data.
5. **Fallback permissions are temporary**: Fallback permission systems should only be used when database is unavailable, and should log warnings when used.
6. **Permission format**: Use `{resource}:{action}` format (e.g., `crm:user:record:update`, `crm:user:record:update`, `crm:customer:record:read`).
7. **Super admin handling**: Super admins should have all permissions in database, not hardcoded bypasses. If super admin needs special handling, it should be via database permission `super_admin` or `crm:platform:control:admin`, not code-level checks.

**Correct Implementation:**
```typescript
// ✅ CORRECT: Use dynamic permissions from database
const canEdit = authService.hasPermission('crm:user:record:update') || 
                authService.hasPermission('crm:user:record:update');

// ❌ WRONG: Hardcoded role check
if (user.role === 'admin') return true;

// ❌ WRONG: Hardcoded permission map
const ROLE_PERMISSIONS = { 'admin': ['crm:user:record:update', ...] };
```

**Database-Driven Permission Flow:**
1. User logs in → `authService.login()` fetches user from database
2. User's role is resolved → `user_roles` table links to `roles` table
3. Role permissions are fetched → `role_permissions` table links to `permissions` table
4. Permissions are attached to user → `user.permissions = ['crm:user:record:update', 'crm:customer:record:read', ...]`
5. Permission checks use `user.permissions` → `authService.hasPermission()` checks this array

**Why This Matters:**
- Permissions can be changed in database without code changes
- Administrators can customize role permissions per tenant
- No code deployment needed for permission updates
- Consistent permission checking across all modules
- Single source of truth (database) for all permissions

### 2.8.1 Navigation Permission Checking - CRITICAL

**⚠️ CRITICAL: Always Use `authService.hasPermission()` for Navigation Filtering**

**Problem:**
Navigation items may not appear for users even when they have the correct permissions in the database. This happens when navigation filtering uses simple array includes checks instead of `authService.hasPermission()`.

**Root Cause:**
The `authService.hasPermission()` method has sophisticated logic to handle:
- **Permission Supersets**: `masters:manage` grants `crm:reference:data:read`, `resource:manage` grants `resource:read`
- **Permission Synonyms**: `:view` is equivalent to `:read`, `:create`/`:update` are equivalent to `:write`
- **Super Admin Handling**: Super admin role automatically grants all permissions
- **Resource/Action Combinations**: Handles complex permission patterns

A simple `userPermissions.includes(permission)` check misses these relationships.

**❌ WRONG: Simple Array Check (DO NOT USE)**
```typescript
// ❌ WRONG: Simple array check misses permission supersets
export function createNavigationFilterContext(
  userRole: string,
  userPermissions: string[]
): NavigationFilterContext {
  return {
    userRole,
    userPermissions,
    hasPermission: (permission: string): boolean => {
      return userPermissions.includes(permission); // ❌ MISSES SUPERSETS!
    },
    // ...
  };
}
```

**✅ CORRECT: Use authService.hasPermission() (ALWAYS USE)**
```typescript
// ✅ CORRECT: Use authService.hasPermission() to handle supersets
import { authService } from '@/services/serviceFactory';

export function createNavigationFilterContext(
  userRole: string,
  userPermissions: string[]
): NavigationFilterContext {
  return {
    userRole,
    userPermissions,
    hasPermission: (permission: string): boolean => {
      // ✅ Use authService.hasPermission() to properly handle permission supersets
      // This ensures that permissions like 'masters:manage' grant 'crm:reference:data:read',
      // and 'resource:manage' grants 'resource:read', etc.
      return authService.hasPermission(permission);
    },
    hasRole: (role: string | string[]): boolean => {
      if (Array.isArray(role)) {
        return role.includes(userRole);
      }
      return role === userRole;
    },
  };
}
```

**Why This Matters:**
- **Permission Supersets**: Users with `masters:manage` should see navigation items requiring `crm:reference:data:read`
- **Consistency**: Navigation filtering uses the same permission logic as the rest of the application
- **Future-Proof**: New permission relationships are automatically handled by `authService.hasPermission()`
- **Admin Access**: Admin users with various `*:manage` permissions will correctly see all navigation items

**Where This Applies:**
- ✅ Navigation filtering (`src/utils/navigationFilter.ts`)
- ✅ Menu visibility checks
- ✅ Route guards
- ✅ Component-level permission checks
- ✅ Any code that filters items based on permissions

**Checklist for Navigation Permission Checks:**
- [ ] Navigation filter uses `authService.hasPermission()` (not simple array check)
- [ ] Permission context is created using `createNavigationFilterContext()` from `navigationFilter.ts`
- [ ] No direct `userPermissions.includes()` checks for navigation items
- [ ] Navigation items are fetched from database (`navigation_items` table)
- [ ] Permission requirements are stored in database (`permission_name` column)

**Common Mistakes to Avoid:**
- ❌ Using `userPermissions.includes(permission)` in navigation filters
- ❌ Creating custom permission check functions instead of using `authService.hasPermission()`
- ❌ Hardcoding permission checks in navigation components
- ❌ Not using `createNavigationFilterContext()` helper function
- ❌ Assuming simple array checks will work for all permission scenarios

**Example Issue:**
- Admin user has `crm:reference:data:read` and `masters:manage` permissions in database
- Navigation item requires `crm:reference:data:read` permission
- Simple array check: `userPermissions.includes('crm:reference:data:read')` → ✅ Works if exact match exists
- But if admin only has `masters:manage` (not `crm:reference:data:read`), simple check fails
- `authService.hasPermission('crm:reference:data:read')` → ✅ Works because it recognizes `masters:manage` grants `crm:reference:data:read`

**Related Files:**
- `src/utils/navigationFilter.ts` - Navigation filtering logic
- `src/hooks/useNavigation.ts` - Navigation hook that uses filtering
- `src/services/auth/supabase/authService.ts` - Permission checking logic
- `src/components/layout/EnterpriseLayout.tsx` - Layout that renders navigation

### 2.9 Permission Hook Property Name Consistency - CRITICAL

**⚠️ ISSUE: Permission Checks Failing Despite Correct Permissions**

**Problem:**
Permission checks appear to fail even when:
- Permissions are correctly loaded from database (`user.permissions` array is populated)
- Permission guard functions return `canEdit: true`
- `authService.hasPermission()` correctly returns `true`

**Root Cause:**
Component code uses different property names than what the permission hook returns, causing `undefined` values and failed permission checks.

**Example of the Issue:**
```typescript
// ❌ PROBLEM: Component expects canEditUsers but hook returns canEdit
const { canEditUsers } = usePermissions(); // canEditUsers is undefined!
// Result: hasPermission = false even though canEdit = true

// ✅ SOLUTION: Hook must provide both property names
const { canEdit, canEditUsers } = usePermissions(); // Both available
```

**Resolution:**
Permission hooks must provide backward compatibility aliases for all permission properties:

```typescript
// ✅ CORRECT: Provide both standard and module-specific property names
export function usePermissions(): UsePermissionsReturn {
  const permissionGuard = getPermissionGuard(userRole);
  
  return {
    ...permissionGuard, // Includes: canCreate, canEdit, canDelete, etc.
    // Backward compatibility aliases
    canCreateUsers: permissionGuard.canCreate,
    canEditUsers: permissionGuard.canEdit,
    canDeleteUsers: permissionGuard.canDelete,
    canResetPasswords: permissionGuard.canResetPassword,
  };
}
```

**Best Practices to Avoid This Issue:**

1. **Standardize Property Names**: Use consistent naming across all modules:
   - Standard: `canCreate`, `canEdit`, `canDelete`, `canViewList`
   - Module aliases: `canCreateUsers`, `canEditUsers`, `canDeleteUsers` (for user management)

2. **Always Provide Aliases**: When creating permission hooks, provide both:
   - Standard property names (`canEdit`)
   - Module-specific aliases (`canEditUsers`, `canEditCustomers`, etc.)

3. **Reactive to Permission Changes**: Permission hooks must recompute when permissions are loaded:
   ```typescript
   const userPermissions = currentUser?.permissions || [];
   const permissionGuard = useMemo(() => {
     return getPermissionGuard(userRole);
   }, [userRole, userPermissions]); // ⚠️ Include userPermissions in dependencies
   ```

4. **Wait for Permissions to Load**: Components should handle loading state:
   ```typescript
   const { canEditUsers, isLoading } = usePermissions();
   const permissionsLoaded = !!(currentUser?.permissions?.length > 0);
   
   // Don't show "Permission Denied" until permissions are loaded
   const hasPermission = useMemo(() => {
     if (!permissionsLoaded && isLoading) {
       return true; // Optimistically allow until permissions load
     }
     return canEditUsers;
   }, [canEditUsers, permissionsLoaded, isLoading]);
   ```

5. **Debug Logging**: Add comprehensive logging to permission hooks:
   ```typescript
   console.log('[usePermissions] Returning permission result:', {
     canEdit: res.canEdit,
     canEditUsers: res.canEditUsers,
     userPermissions: currentUser?.permissions
   });
   ```

**Checklist for New Modules:**
- [ ] Permission hook provides both standard and module-specific property names
- [ ] Hook dependencies include `userPermissions` to react to permission loading
- [ ] Components handle loading state before showing "Permission Denied"
- [ ] Debug logging added to permission hooks for troubleshooting
- [ ] Property names are consistent with existing modules

**Common Mistakes to Avoid:**
- ❌ Using `canEditUsers` when hook only returns `canEdit`
- ❌ Not including `userPermissions` in `useMemo` dependencies
- ❌ Showing "Permission Denied" before permissions are loaded
- ❌ Hardcoding permission checks instead of using hooks
- ❌ Not providing backward compatibility aliases

---

## 🔐 CENTRALIZED PERMISSION CONTEXT PATTERN (Critical for UI)

### 2.9.1 Overview
The application uses a **Centralized Permission Context** pattern in `AuthContext` to prevent duplicate permission evaluation API calls when multiple components mount on the same page. This ensures consistent permission handling across the entire UI.

### 2.9.2 Why Centralization Matters
**Problem**: Without centralization, each component that mounts can trigger identical permission lookups (e.g., `user_roles` → `role_permissions` → `permissions` nested queries), causing:
- Multiple identical API calls on a single page load
- Network bottlenecks and slower page rendering
- Redundant database queries
- Inconsistent permission state across components

**Solution**: `AuthContext` caches and deduplicates permission evaluations so:
- Multiple components use the same cached result
- In-memory cache is keyed by user + tenant + element + action + recordId
- Common element permissions are preloaded at login/session restore
- Total API calls reduced from dozens to one or two per page load

### 2.9.3 Architecture

```
Component/Hook
  ↓
  useAuth().evaluateElementPermission()  ← Use this for element-level checks
  ↓
AuthContext Cache
  ├─→ Hit: Return cached boolean (instant)
  └─→ Miss: Call elementPermissionService (backend)
     ↓
     elementPermissionService.evaluateElementPermission()
     ↓
     Supabase (user_roles → role_permissions → permissions)
```

### 2.9.4 When to Use AuthContext Permission Methods

✅ **USE AuthContext** for:
- UI element visibility checks (button visibility, form fields)
- Action enablement checks (can user perform action)
- Conditional rendering based on permissions
- Bulk permission lookups on component mount
- Any frontend permission evaluation that affects rendering

❌ **DO NOT USE AuthContext** for:
- Server-side permission checks (backend validates independently)
- Permission creation/assignment (use rbacService directly)
- Role management operations (use rbacService directly)
- Audit logging permission changes (use rbacService directly)

### 2.9.5 How to Implement Permission Checks in Components

#### Pattern 1: Simple Permission Check (in-memory permissions)
When `currentUser.permissions` is already loaded (during login/restore):

```typescript
import { useAuth } from '@/contexts/AuthContext';

const MyComponent = () => {
  const { user } = useAuth();
  
  // Direct check - instant, no API call
  const canEditUsers = user?.permissions?.includes('crm:user:record:update');
  
  return (
    <button disabled={!canEditUsers}>
      Edit User
    </button>
  );
};
```

#### Pattern 2: Element-Level Permission Check (with fallback to cache)
Use when you need to evaluate specific element paths with caching:

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

const MyComponent = () => {
  const { evaluateElementPermission } = useAuth();
  const [canView, setCanView] = useState(false);
  
  useEffect(() => {
    const check = async () => {
      // This will:
      // 1. Check in-memory cache first
      // 2. Return cached result if found
      // 3. Only call backend if cache miss
      const result = await evaluateElementPermission('user:list', 'accessible');
      setCanView(result);
    };
    check();
  }, [evaluateElementPermission]);
  
  return canView ? <UserList /> : null;
};
```

#### Pattern 3: Using Preloaded Element Permissions Hook
For user management module, use `usePermissions()` hook which handles preloading:

```typescript
import { usePermissions } from '@/modules/features/user-management/hooks/usePermissions';

const UsersPage = () => {
  const {
    canCreate,       // Preloaded at login
    canEdit,         // Preloaded at login
    canDelete,       // Uses cache or API
    canViewUsers,    // Uses cache or API
    isLoading,       // Permission loading state
  } = usePermissions();
  
  if (isLoading) return <Spinner />;
  
  return (
    <>
      {canCreate && <CreateButton />}
      {canEdit && <EditButton />}
      {canDelete && <DeleteButton />}
    </>
  );
};
```

#### Pattern 4: Conditional Rendering Component
Use for simple permission-based rendering:

```typescript
import { PermissionControlled } from '@/components/common/PermissionControlled';

const MyComponent = () => {
  return (
    <PermissionControlled
      elementPath="user:record"
      action="editable"
      fallback={<span>No permission to edit</span>}
    >
      <EditForm />
    </PermissionControlled>
  );
};
```

### 2.9.6 Cache Behavior & TTL

**Cache Configuration** (in `AuthContext`):
- **Type**: In-memory `Map` per session
- **TTL**: Session lifetime (cleared on logout)
- **Key Format**: `${userId}:${tenantId}:${elementPath}:${action}:${recordId}`
- **Value**: Boolean (permission granted/denied)

**When cache is cleared**:
- On logout
- On user/tenant change
- On permission role assignment (manual clear needed)

### 2.9.7 Rules for Future Implementation

**When adding new permission checks to existing components**:

1. ✅ **ALWAYS**: Check if `user.permissions` is sufficient (instant check)
2. ✅ **ALWAYS**: Use `auth.evaluateElementPermission()` with fallback caching
3. ✅ **ALWAYS**: Add frequently-checked element paths to preload list
4. ✅ **ALWAYS**: Test with DevTools Network tab to verify cache hit
5. ✅ **ALWAYS**: Log cache key format for debugging

**When creating new components that need permissions**:

1. ❌ **NEVER**: Import `elementPermissionService` directly
2. ❌ **NEVER**: Create supabase queries directly in component files
3. ❌ **NEVER**: Call `role_permissions` or `user_roles` tables from UI components
4. ❌ **NEVER**: Store permissions in multiple places (use `user.permissions` from Auth)
5. ❌ **NEVER**: Assume permissions are cached without checking `isLoading` state

### 2.9.8 Key Files Reference

**Core Files**:
- `src/contexts/AuthContext.tsx` - Centralized cache and preloading
- `src/services/rbac/elementPermissionService.ts` - Backend evaluation service
- `src/components/common/PermissionControlled.tsx` - Wrapper component for conditional rendering
- `src/hooks/useElementPermissions.ts` - Hook for element-level checks
- `src/modules/features/user-management/hooks/usePermissions.ts` - Module-specific permission hook

---

### 2.10 Permission Token Format & Multi-Layer Enforcement - CRITICAL

**Canonical Pattern:** `<app>:<domain>:<resource>[:<scope>][:<action>]`  
Each colon represents one semantic dimension. Every token MUST follow this sequence so creation, storage, caching, hooks, UI, and audit logs stay synchronized across all eight layers (Database → Types → Mock Service → Supabase Service → Service Factory → Module Service → Hooks → UI). Tokens that do not match this pattern are invalid and must be blocked during reviews/CI.

**Dimension Breakdown:**

1. **`<app>` – Application / Service Owner**
   - Identifies which product or microservice owns the permission (`crm`, `billing`, `admin`, `analytics`, etc.).
   - Prevents name collisions (`crm:user:record:read` vs `identity:user:record:read`).
   - Enables app-level filtering in admin tooling and Supabase analytics.
   - *Examples:* `crm`, `admin`, `billing`, `analytics`.

2. **`<domain>` – Functional Module**
   - Indicates the business area inside the app (`contact`, `deal`, `report`, `settings`, `user`, `company`, etc.).
   - Drives grouping in RBAC UI (collapsible sections like “Contacts”, “Deals”).
   - Guides backend teams when batching permission seeds per module.
   - *Examples:* `contact`, `deal`, `report`, `settings`, `user`, `task`.

3. **`<resource>` – Entity Type**
   - Describes what object is being protected (`record`, `pipeline`, `dashboard`, `config`, etc.).
   - Must stay consistent inside a domain (Contacts always use `record`, Reports use `dashboard` or `report`).
   - Supports analytics and auditing by resource type.
   - *Examples:* `record`, `pipeline`, `dashboard`, `config`, `report`.

4. **`[:<scope>]` – Optional Qualifier**
   - Adds ownership visibility (`own`, `team`, `org`), field-level targeting (`field.email`), sensitivity markers (`sensitive`, `pii`), or mode flavors (`export`, `assign`, `bulk`).
   - Scope is optional but must follow a documented style per module—never invent ad-hoc scopes without updating this section and `PERMISSION_SYSTEM_IMPLEMENTATION.md`.
   - Multiple scoped variants can exist when mapped to real policies (e.g., `crm:deal:record:own:update`, `crm:deal:record:team:update`).
   - *Examples:* `own`, `team`, `org`, `field.email`, `field.address`, `sensitive`, `export`, `assign`.

5. **`[:<action>]` – Operation Verb**
   - Standard CRUD plus domain verbs (`create`, `read`, `update`, `delete`, `move`, `export`, `share`, `assign`, `archive`, `restore`, etc.).
   - Must align with Supabase policies and `authService.hasPermission()` superset logic (`:manage` grants `:read`, `:update`, etc.).
   - Always include unless the scope encodes the verb—pick one convention per module and document it.
   - *Examples:* `read`, `create`, `update`, `delete`, `move`, `export`, `share`, `assign`.

**Usage Examples:**

- `crm:customer:record:read` → CRM app, Contacts domain, contact rows, read action.
- `crm:customer:record:field.email:update` → CRM Contacts, contact rows, update action limited to email field.
- `crm:deal:pipeline:move` → CRM Deals, pipeline resource, move action.
- `crm:deal:record:own:update` → CRM Deals, own deals only, update action.
- `crm:report:dashboard:share` → CRM Reports, dashboard resource, share action.
- `crm:user:config:assign` → CRM Users, config resource, assign role/users.

**Scope Style Reference:**

- **Ownership:** `own`, `team`, `org` (maps to tenant/user filters in Supabase RLS).
- **Field-Level:** `field.email`, `field.phone`, `field.salary`.
- **Sensitivity:** `sensitive`, `pii`, `financial`.
- **Mode/Flavor:** `export`, `import`, `assign`, `share`, `bulk`, `archive`.

**Cheat Sheet (ask before shipping new permissions):**

1. App? → Which application/service? (`crm`)
2. Domain? → Which module? (`contact`, `deal`, `report`, `settings`, `user`, etc.)
3. Resource? → What entity? (`record`, `pipeline`, `dashboard`, `config`, etc.)
4. Scope? → Any limiter? (`own`, `team`, `field.email`, `export`, etc.)
5. Action? → What operation? (`read`, `update`, `share`, `assign`, etc.)

**Eight-Layer Synchronization (MUST PASS ALL):**

1. **Database:** Insert the full token into `permissions` (`service_app`, `domain`, `resource`, `scope`, `action`). Add migrations/constraints rejecting malformed tokens.
2. **Types:** Update TypeScript interfaces (`src/types/rbac.ts`, DTOs) so camelCase mirrors snake_case columns.
3. **Mock Service:** Mirror the token and validation rules in mock seeds/fixtures so Storybook/tests behave like production.
4. **Supabase Service:** Apply tokens in Supabase service queries and RLS policies, mapping ownership scopes to tenant/team filters.
5. **Factory:** Route through `serviceFactory` (no direct imports) so mock/supabase parity stays intact.
6. **Module Service:** Consume permissions exclusively through service proxies and `authService.hasPermission(token)`; never use `userPermissions.includes`.
7. **Hooks:** Update `usePermissions`, `useModuleAccess`, etc. to expose the new token (with backward-compatible aliases) and invalidate caches when permissions change.
8. **UI:** Enforce the permission in React components, routes, and navigation; document constraints (ownership, field-level limits) directly in tooltips/forms.

**Implementation Workflow:**

1. Design the token using the canonical pattern and document it in feature specs plus `PERMISSION_SYSTEM_IMPLEMENTATION.md`.
2. Create migration + seed updates (`supabase/migrations`, `supabase/seed.sql`) and run `AUTH_SYNC` scripts so tenants receive the new token.
3. Update fallback permission maps only if necessary (log warnings until DB permissions land in staging).
4. Add tests in `src/services/rbac/__tests__` verifying `authService.hasPermission(token)` handles scope + superset logic.
5. Validate navigation, route guards, and hooks rely on `authService.hasPermission(token)` (never simple includes checks).
6. Record verification in `PERMISSION_VERIFICATION_SUMMARY.md` and check off rows in `ELEMENT_LEVEL_PERMISSION_IMPLEMENTATION_CHECKLIST.md`.

**Failure Prevention Rules:**

- Tokens are immutable once shipped; renames require migrations + documentation updates.
- Reject any token missing `<app>` or `<domain>`—missing dimensions break analytics, caching, and Supabase filters.
- Do not overload `scope` with verbs that belong to `action`; pick one place to describe behavior per module.
- Treat any feature/bug fix that bypasses this naming scheme as a release blocker until corrected.
- CI reviewers must confirm the eight-layer checklist before approving PRs.

By enforcing this structure, permissions remain portable across applications, avoid collisions, and deliver predictable behavior whenever new modules or fixes touch the RBAC system.

---

## 3. Service Layer Architecture

### 3.1 Service Factory Pattern

The **Service Factory** implements a **dual-mode backend system** with **24 core services** that dynamically switch between Mock (development/testing) and Supabase (production) implementations.

**Service Registry (24 Services):**

| Service Key | Description | Mock Implementation | Supabase Implementation |
|-------------|-------------|-------------------|----------------------|
| `auth` | Authentication & session management | ✅ | ✅ |
| `servicecontract` | Service contract lifecycle | ✅ | ✅ |
| `productsale` | Product sales operations | ✅ | ✅ |
| `sales` | Sales & deal management | ✅ | ✅ |
| `customer` | Customer management | ✅ | ✅ |
| `jobwork` | Job work operations | ✅ | ✅ |
| `product` | Product catalog & inventory | ✅ | ✅ |
| `company` | Company/organization management | ✅ | ✅ |
| `user` | User management | ✅ | ✅ |
| `rbac` | Role-based access control | ✅ | ✅ |
| `uinotification` | Client-side UI notifications | ✅ (Special) | N/A |
| `notification` | Backend notifications | ✅ | ✅ |
| `tenant` | Tenant management + metrics + directory | ✅ | ✅ |
| `multitenant` | Tenant context (infrastructure-level) | N/A | ✅ (Special) |
| `ticket` | Ticket/issue tracking | ✅ | ✅ |
| `superadminmanagement` | Super admin lifecycle | ✅ | ✅ |
| `superadmin` | Super admin dashboard | ✅ | ⚠️ (TODO) |
| `contract` | Contract module | ✅ | ✅ |
| `rolerequest` | Role elevation requests | ✅ | ✅ |
| `audit` | Audit logs, compliance, metrics, retention | ✅ | ✅ |
| `compliancenotification` | Compliance alerts | ✅ | ✅ |
| `impersonation` | Impersonation session management | ✅ (Special) | ✅ (Special) |
| `ratelimit` | Rate limiting & session controls | ✅ | ✅ |
| `referencedata` | Reference data & dropdowns | ✅ | ✅ |

### 3.2 Proxy Pattern Implementation

**Before (900+ lines of boilerplate):**
```typescript
export const authService = {
  get instance() { return serviceFactory.getAuthService(); },
  login: (...args) => serviceFactory.getAuthService().login(...args),
  logout: (...args) => serviceFactory.getAuthService().logout(...args),
  // ... 50+ more method wrappers
};
```

**After (1 line via proxy):**
```typescript
export const authService = createServiceProxy('auth');
```

**Proxy Factory Function:**
```typescript
function createServiceProxy(serviceRegistryKey: string): any {
  return new Proxy(
    { get instance() { return serviceFactory.getService(serviceRegistryKey); } },
    {
      get(target, prop) {
        if (prop === 'instance') return target.instance;

        const service = serviceFactory.getService(serviceRegistryKey);
        if (!service || !(prop in service)) {
          console.warn(`Property "${String(prop)}" not found on ${serviceRegistryKey}`);
          return undefined;
        }

        const value = service[prop];
        return typeof value === 'function' ? value.bind(service) : value;
      },
    }
  );
}
```

### 3.3 Service Resolution Flow

1. **Environment Configuration:** `VITE_API_MODE` determines backend mode
2. **Proxy Trap Triggered** → `get(target, 'methodName')`
3. **Service Resolution** → `serviceFactory.getService('serviceKey')`
4. **Mode-Based Routing:**
   ```
   if (apiMode === 'supabase') → return entry.supabase
   if (apiMode === 'mock') → return entry.mock
   if (apiMode === 'real') → return entry.supabase (fallback)
   ```
5. **Method Binding** → `value.bind(service)` to preserve context
6. **Execution** → Original function invoked with correct `this` context

### 3.4 Special Services

Some services use custom routing logic:

**Impersonation Service:**
```typescript
impersonation: {
  special: () => {
    if (this.apiMode === 'supabase') return supabaseImpersonationService;
    return { 
      getImpersonationLogs: async () => [],
      getActiveImpersonations: async () => [] 
    };
  }
}
```

**UI Notification Service:**
```typescript
uinotification: {
  special: () => mockUINotificationService,  // Always mock (client-only)
}
```

**Multi-tenant Service:**
```typescript
multitenant: {
  special: () => supabaseMultiTenantService,  // Always supabase (infrastructure)
}
```

### 3.5 Backward Compatibility Aliases

For maintaining compatibility with existing code:
```typescript
export const auditDashboardService = auditService;
export const auditRetentionService = auditService;
export const auditComplianceReportService = auditService;
export const tenantMetricsService = tenantService;
export const tenantDirectoryService = tenantService;
export const impersonationRateLimitService = rateLimitService;
```

---

## 4. Application Modules

### 4.1 Module Registration Pattern

All modules are registered in `src/modules/bootstrap.ts` following a consistent pattern:

```typescript
export async function registerFeatureModules(): Promise<void> {
  // Customer module
  const { customerModule } = await import('./features/customers');
  registerModule(customerModule);

  // Sales module
  const { salesModule } = await import('./features/sales');
  registerModule(salesModule);

  // ... continuing for all modules
}
```

### 4.2 Registered Modules (16 Total)

**Core Business Modules:**

1. **Customer Module** (`customers`)
   - Customer management and profiles
   - Customer interaction tracking
   - Customer analytics and reporting

2. **Sales Module** (`sales`)
   - Lead and opportunity management
   - Sales pipeline tracking
   - Deal lifecycle management

3. **Ticket Module** (`tickets`)
   - Support ticket creation and tracking
   - Ticket assignment and escalation
   - Resolution workflow management

4. **Product Sales Module** (`product-sales`)
   - Product catalog management
   - Sales order processing
   - Inventory tracking

5. **Contracts Module** (`contracts`)
   - Contract creation and management
   - Contract lifecycle tracking
   - Renewal and expiration management

6. **Service Contracts Module** (`service-contracts`)
   - Service agreement management
   - SLA tracking and compliance
   - Service delivery monitoring

7. **Job Works Module** (`jobworks`)
   - Work order management
   - Job tracking and completion
   - Resource allocation

8. **Complaints Module** (`complaints`)
   - Complaint registration and tracking
   - Resolution workflow
   - Customer feedback management

**Administrative Modules:**

9. **User Management Module** (`user-management`)
   - User account lifecycle management
   - Role assignment and permissions
   - User activity monitoring

10. **Masters Module** (`masters`)
    - Reference data management
    - System configuration
    - Master data maintenance

11. **Configuration Module** (`configuration`)
    - System settings management
    - Feature toggles
    - Environment configuration

12. **Audit Logs Module** (`audit-logs`)
    - System audit trail
    - Compliance reporting
    - Security event tracking

**Platform Modules:**

13. **Super Admin Module** (`super-admin`)
    - Platform administration
    - Cross-tenant management
    - System monitoring

14. **Notifications Module** (`notifications`)
    - Notification management
    - Alert configuration
    - Communication tracking

**Dashboard & Analytics:**

15. **Dashboard Module** (`dashboard`)
    - Analytics and reporting
    - KPI visualization
    - Performance metrics

### 4.3 Module Structure Standard

Each module follows a consistent structure:
```
src/modules/features/[module-name]/
├── index.ts                 # Module registration
├── routes.tsx              # Route definitions
├── components/             # React components
│   ├── views/             # Page components
│   ├── forms/             # Form components
│   └── shared/            # Shared components
├── services/              # Module-specific services
├── hooks/                 # Custom React hooks
├── types/                 # Module type definitions
└── utils/                 # Utility functions
```

---

## 5. Layer Sync Rules

### 5.1 Service Layer Synchronization

**Rule 1: Service Interface Consistency**
- All services must implement the same interface across mock and supabase implementations
- Method signatures must be identical
- Return types must be consistent
- Error handling patterns must match

**Rule 2: React Query Integration**
- All data fetching must use React Query hooks
- Consistent query keys for cache management
- Loading/error/data states in all hooks
- Cache invalidation on mutations

**Rule 3: Type Safety**
- DTOs (Data Transfer Objects) must match database schema exactly
- TypeScript types imported from centralized location
- No `any` types in public APIs
- Strict type checking enabled

### 5.2 Permission Layer Synchronization

**Rule 4: RBAC Consistency**
- Database permissions must match TypeScript permission checks
- Role mappings must be consistent across all layers
- Permission validation must follow the same flow in all services
- Tenant isolation must be enforced consistently

**Rule 5: Module Access Control**
- Module registration must respect role-based access
- Super admin modules must be restricted to super_admin role
- Tenant modules must enforce tenant isolation
- Permission checks must be centralized

### 5.3 Data Layer Synchronization

**Rule 6: Database Schema Alignment**
- TypeScript interfaces must reflect database schema exactly
- Field names must use consistent naming (camelCase vs snake_case)
- Foreign key relationships must be maintained in types
- Default values must be reflected in interfaces

**Rule 7: RLS Policy Consistency**
- All database queries must respect tenant isolation
- RLS policies must match application-level access control
- Cross-tenant access attempts must be logged
- Security validations must be consistent across layers

### 5.4 CRUD Service Implementation Pattern (CRITICAL - MANDATORY)

**⚠️ ALWAYS follow this pattern when implementing CREATE/UPDATE operations**

#### Pre-Implementation Checklist (MUST DO BEFORE CODING)

Before implementing ANY CRUD operation for a module:

1. **Read the Database Schema First**
   - Check `supabase/COMPLETE_DATABASE_EXPORT.sql` OR `supabase/complete_database_schema.sql`
   - Note ALL columns that exist in the table
   - Note column data types and constraints
   - Note which columns are auto-generated (id, created_at, updated_at, tenant_id)

2. **Identify Field Categories**
   - **Auto-generated fields** (NEVER send in create/update): `id`, `created_at`, `updated_at`, `deleted_at`
   - **System-set fields** (set by service, not user input): `tenant_id`, `created_by`, `updated_by`
   - **User-provided fields**: All other fields from the input type
   - **Computed/virtual fields**: Fields that exist in types but NOT in database (e.g., `attachments` loaded separately)

3. **Create a Field Mapping Table**
   Document the mapping between TypeScript camelCase and database snake_case:
   ```
   | TypeScript Field | Database Column | In Create? | In Update? |
   |------------------|-----------------|------------|------------|
   | customerId       | customer_id     | YES        | NO         |
   | startDate        | start_date      | YES        | YES        |
   | attachments      | (separate table)| NO         | NO         |
   ```

#### ✅ CORRECT: Explicit Field Mapping (ALWAYS USE THIS)

```typescript
async createEntity(data: EntityCreateInput): Promise<Entity> {
  // Step 1: Build insert object with ONLY valid database columns
  const insertData = {
    // User-provided fields (map camelCase → snake_case)
    customer_id: data.customerId,
    product_id: data.productId,
    title: data.title,
    description: data.description,
    status: data.status || 'draft',
    start_date: data.startDate,
    end_date: data.endDate,
    value: data.value,
    // ... only fields that EXIST in the database table
    
    // System-set fields
    created_by: (await supabaseClient.auth.getUser()).data.user?.id,
    // tenant_id is set by RLS or explicitly if needed
  };

  const { data: result, error } = await supabaseClient
    .from('entities')
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return mapEntityRow(result);
}

async updateEntity(id: string, data: EntityUpdateInput): Promise<Entity> {
  // Step 1: Define EXPLICIT field mapping (only updateable fields)
  const fieldMap: Record<string, string> = {
    title: 'title',
    description: 'description',
    status: 'status',
    startDate: 'start_date',
    endDate: 'end_date',
    value: 'value',
    // ... only fields that CAN be updated
    // DO NOT include: id, customer_id, created_at, created_by, tenant_id
  };

  // Step 2: Build update object from input using the map
  const updateData: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && fieldMap[key]) {
      updateData[fieldMap[key]] = value;
    }
  });

  // Step 3: Add system fields
  updateData.updated_by = (await supabaseClient.auth.getUser()).data.user?.id;
  updateData.updated_at = new Date().toISOString();

  const { data: result, error } = await supabaseClient
    .from('entities')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapEntityRow(result);
}
```

#### ❌ WRONG: Spreading Input Directly (NEVER DO THIS)

```typescript
// ❌ WRONG: Spreads ALL input fields including non-existent columns
async createEntity(data: EntityCreateInput): Promise<Entity> {
  const { data: result, error } = await supabaseClient
    .from('entities')
    .insert([{
      ...data,  // ❌ DANGER: May include fields that don't exist in DB
      created_by: userId,
    }])
    .select()
    .single();
}

// ❌ WRONG: Using toDatabase() without column validation
async updateEntity(id: string, data: EntityUpdateInput): Promise<Entity> {
  const { data: result, error } = await supabaseClient
    .from('entities')
    .update({
      ...toDatabase(data),  // ❌ DANGER: toDatabase doesn't know which columns exist
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
}
```

#### Common Pitfalls to Avoid

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Spreading input directly | Sends non-existent columns → 400 Bad Request | Use explicit field mapping |
| Using generic toDatabase() | Doesn't filter out invalid columns | Use explicit field mapping per entity |
| Including computed fields | Fields like `attachments` don't exist in main table | Exclude from insert/update, load separately |
| Including read-only fields | Fields like `id`, `created_at` sent in update | Use fieldMap that excludes these |
| Missing column in schema | Service sends field that DB doesn't have | Always verify against DB schema first |

#### Field Category Reference

| Category | Examples | In Create | In Update | Notes |
|----------|----------|-----------|-----------|-------|
| Auto-generated | id, created_at, updated_at | ❌ NO | ❌ NO | DB handles these |
| System-set | tenant_id, created_by, updated_by | ✅ SET BY SERVICE | ✅ SET BY SERVICE | Service sets, not user input |
| Immutable | customer_id, product_id | ✅ YES | ❌ NO | Set once, never change |
| Mutable | title, status, description | ✅ YES | ✅ YES | User can modify |
| Computed/Virtual | attachments, documents | ❌ NO | ❌ NO | Loaded from related tables |
| Deprecated/Removed | old_field_name | ❌ NO | ❌ NO | May exist in types but not DB |

#### Module-Specific Verified Patterns

| Module | Create Pattern | Update Pattern | Status |
|--------|---------------|----------------|--------|
| Deals | Uses `toDatabase()` mapper | Uses `toDatabase()` mapper | ✅ Verified correct |
| Products | Explicit field list | Explicit field list | ✅ Fixed: removed specifications, pricing_tiers, discount_rules, notes |
| Product Sales | Explicit field list | Explicit field list | ✅ Fixed: removed sale_date, excluded attachments |
| Job Works | Explicit field list | Explicit fieldMap | ✅ Fixed: excluded specifications from update |
| Service Contracts | Explicit field list | Explicit fieldMap | ✅ Verified: matches enterprise schema |
| Customers | Explicit field list | Explicit field list | ✅ Verified correct |
| Tickets | Explicit field list | Explicit fieldMap | ✅ Verified correct |
| Complaints | Explicit field list | Explicit field list | ✅ Verified correct |

#### Verification Steps (MUST DO AFTER IMPLEMENTATION)

1. **Compare service fields vs database columns**
   - Every field in `insert()` must exist in the table
   - Every field in `update()` must exist in the table
   
2. **Test the CRUD operations**
   - Create: Should succeed without 400 errors
   - Read: Should return all expected fields
   - Update: Should succeed without 400 errors
   - Delete: Should succeed (soft or hard delete)

3. **Check for console errors**
   - No "column X does not exist" errors
   - No "Could not find column" errors
   - No "400 Bad Request" on insert/update

---

## 6. Database Schema

### 6.1 Core Tables

**Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  tenant_id UUID REFERENCES tenants(id),
  status VARCHAR(50) DEFAULT 'active',
  avatar_url TEXT,
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

**Roles Table:**
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  tenant_id UUID REFERENCES tenants(id),
  permissions TEXT[] DEFAULT '{}',
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**User Roles Table:**
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  role_id UUID REFERENCES roles(id),
  tenant_id UUID REFERENCES tenants(id),
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

**Permissions Table:**
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Audit Logs Table:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  tenant_id UUID REFERENCES tenants(id),
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### 6.2 RLS Policies

**Users RLS Policy:**
```sql
-- Super admins can see all users
CREATE POLICY "Super admins can see all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- Regular users can only see users from their tenant
CREATE POLICY "Users can see their tenant users" ON users
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );
```

**Audit Logs RLS Policy:**
```sql
-- Super admins can see all audit logs
CREATE POLICY "Super admins can see all audit logs" ON audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- Regular users can only see their tenant's audit logs
CREATE POLICY "Users can see their tenant audit logs" ON audit_logs
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );
```

---

## 7. Implementation Guidelines

### 7.1 New Service Implementation

**Step 1: Define Interface**
```typescript
// src/services/[service]/types.ts
export interface I[ServiceName]Service {
  getData(): Promise<DataType[]>;
  createData(data: CreateDataType): Promise<DataType>;
  updateData(id: string, data: UpdateDataType): Promise<DataType>;
  deleteData(id: string): Promise<void>;
}
```

**Step 2: Implement Mock Service**
```typescript
// src/services/[service]/[serviceName]Service.ts
import { I[ServiceName]Service } from './types';

export const mock[ServiceName]Service: I[ServiceName]Service = {
  async getData() {
    return mockData;
  },
  // ... other methods
};
```

**Step 3: Implement Supabase Service**
```typescript
// src/services/[service]/supabase/[serviceName]Service.ts
import { supabase } from '@/lib/supabase';
import { I[ServiceName]Service } from './types';

export const supabase[ServiceName]Service: I[ServiceName]Service = {
  async getData() {
    const { data, error } = await supabase
      .from('[table_name]')
      .select('*');
    
    if (error) throw error;
    return data;
  },
  // ... other methods
};
```

**Step 4: Register in Service Factory**
```typescript
// src/services/serviceFactory.ts
import { supabase[ServiceName]Service } from './[service]/supabase/[serviceName]Service';
import { mock[ServiceName]Service } from './[service]/[serviceName]Service';

const serviceRegistry = {
  [serviceName]: {
    mock: mock[ServiceName]Service,
    supabase: supabase[ServiceName]Service,
    description: '[Service description]'
  }
};
```

**Step 5: Export Service Proxy**
```typescript
export const [serviceName]Service = createServiceProxy('[serviceName]');
```

### 7.2 New Module Implementation

**Step 1: Create Module Structure**
```bash
mkdir -p src/modules/features/[module-name]/{components/{views,forms,shared},services,hooks,types,utils}
```

**Step 2: Define Module Interface**
```typescript
// src/modules/features/[module-name]/types.ts
import { FeatureModule } from '@/modules/core/types';

export const [moduleName]Module: FeatureModule = {
  name: '[module-name]',
  routes: [],
  services: ['[service-name]'],
  components: {},
  dependencies: ['core', 'shared'],
  async initialize() {
    console.log('[Module] initialized');
  },
};
```

**Step 3: Register Routes**
```typescript
// src/modules/features/[module-name]/routes.tsx
import { lazy } from 'react';

export const [ModuleName]Page = lazy(() => import('./components/views/[ModuleName]Page'));

// Add to module routes array
```

**Step 4: Register in Bootstrap**
```typescript
// src/modules/bootstrap.ts
const { [moduleName]Module } = await import('./features/[module-name]');
registerModule([moduleName]Module);
```

### 7.3 Permission Implementation

**Step 1: Add Permission to Database**
```sql
INSERT INTO permissions (name, description, category, resource, action)
VALUES ('manage_[resource]', '[Description]', 'module', '[resource]', 'manage');
```

**Step 2: Add to Role Permissions**
```sql
UPDATE roles 
SET permissions = array_append(permissions, 'manage_[resource]')
WHERE name IN ('admin', 'manager');
```

**Step 3: Update TypeScript Types**
```typescript
// src/types/rbac.ts
export interface Permission {
  // ... existing fields
  // add new permission
}
```

**Step 4: Update Fallback Permissions**
```typescript
// src/services/auth/supabase/authService.ts
const basicRolePermissions = {
  // ... update relevant roles
  '[role]': [
    // ... existing permissions
    'manage_[resource]'
  ]
};
```

**Step 5: Use in Components**
```typescript
// In React components
if (!authService.hasPermission('manage_[resource]')) {
  return <AccessDenied />;
}
```

---

## 8. Development Standards

### 8.1 Code Quality Rules

**TypeScript Standards:**
- Use strict mode
- No `any` types in public APIs
- Use interfaces for all data structures
- Prefer const over let
- Use arrow functions for functional components

**React Standards:**
- Use functional components with hooks
- Use React Query for data fetching
- Implement proper error boundaries
- Use TypeScript for prop types
- Follow React best practices

**Service Standards:**
- Implement consistent error handling
- Use async/await patterns
- Return proper types from all methods
- Log operations appropriately
- Follow the service factory pattern

### 8.2 Security Standards

**Authentication & Authorization:**
- Always validate user permissions
- Implement tenant isolation
- Use RLS policies for data security
- Log security events
- Follow principle of least privilege

**Data Validation:**
- Validate all inputs
- Use parameterized queries
- Sanitize user inputs
- Implement rate limiting
- Use HTTPS in production

**Audit Requirements:**
- Log all user actions
- Track permission changes
- Monitor failed access attempts
- Implement audit log retention
- Provide audit trail export

### 8.3 Performance Standards

**Service Performance:**
- Implement caching where appropriate
- Use React Query for client-side caching
- Optimize database queries
- Implement pagination for large datasets
- Use lazy loading for modules

**UI Performance:**
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Optimize bundle size
- Use code splitting
- Implement proper loading states

---

## 9. Rules for Future Implementation

### 9.1 Adding New Features

**Rule 1: Service First**
- Always create a service layer before UI
- Implement both mock and supabase versions
- Follow the service factory pattern
- Add appropriate TypeScript interfaces

**Rule 2: Permission Planning**
- Design permissions during feature planning
- Update RBAC system before UI implementation
- Test permission enforcement
- Document permission requirements

**Rule 3: Module Registration**
- Register all new modules in bootstrap.ts
- Follow the established module structure
- Implement proper lazy loading
- Add route definitions

### 9.2 Modifying Existing Features

**Rule 4: Backward Compatibility**
- Maintain existing API signatures
- Use deprecation warnings for breaking changes
- Provide migration paths
- Update documentation

**Rule 5: Testing Requirements**
- Test all permission scenarios
- Verify tenant isolation
- Test both mock and supabase modes
- Validate audit logging

### 9.3 Database Changes

**Rule 6: Migration Planning**
- Always create database migrations
- Plan for data compatibility
- Update TypeScript interfaces
- Test RLS policies

**Rule 7: Schema Evolution**
- Use UUIDs for new primary keys
- Implement proper foreign key constraints
- Add appropriate indexes
- Plan for audit trail updates

### 9.4 Security Updates

**Rule 8: Permission Reviews**
- Regular security audits
- Review role assignments
- Validate RLS policies
- Monitor access patterns

**Rule 9: Compliance Requirements**
- Maintain audit logs
- Implement data retention policies
- Provide compliance reporting
- Regular security assessments

### 9.5 Performance Optimization

**Rule 10: Continuous Improvement**
- Monitor service performance
- Optimize database queries
- Review cache strategies
- Implement performance metrics

**Rule 11: Scalability Planning**
- Design for multi-tenant scale
- Plan for increased user loads
- Consider data partitioning
- Implement proper monitoring

---

## 10. Change Management

### 10.1 Implementation Checklist

**Before Implementing Changes:**
- [ ] Review current architecture
- [ ] Check existing permissions
- [ ] Verify tenant isolation
- [ ] Plan migration strategy
- [ ] Update documentation

**During Implementation:**
- [ ] Follow established patterns
- [ ] Maintain TypeScript safety
- [ ] Test permission scenarios
- [ ] Validate RLS policies
- [ ] Monitor performance

**After Implementation:**
- [ ] Update documentation
- [ ] Verify all tests pass
- [ ] Check audit logging
- [ ] Review security impact
- [ ] Update deployment guides

### 10.2 Review Criteria

**Architecture Review:**
- [ ] Follows service factory pattern
- [ ] Implements proper RBAC
- [ ] Maintains tenant isolation
- [ ] Uses consistent patterns

**Security Review:**
- [ ] Permission validation
- [ ] Tenant isolation enforcement
- [ ] Audit trail completeness
- [ ] RLS policy compliance

**Performance Review:**
- [ ] Service efficiency
- [ ] Database optimization
- [ ] Caching implementation
- [ ] Memory usage patterns

---

## 12. Emergency Procedures

### 11.1 Security Incidents

**Immediate Response:**
1. Isolate affected systems
2. Audit recent changes
3. Review access logs
4. Implement temporary restrictions
5. Notify stakeholders

**Investigation Steps:**
1. Review audit logs
2. Check permission changes
3. Validate RLS policies
4. Examine user access patterns
5. Identify breach vector

### 11.2 System Failures

**Service Failures:**
1. Check service health
2. Review error logs
3. Validate database connections
4. Test fallback mechanisms
5. Implement workarounds

**Database Issues:**
1. Check RLS policies
2. Validate tenant isolation
3. Review recent migrations
4. Test data consistency
5. Implement recovery procedures

---

## 11. Form Success Message Pattern - CRITICAL UX

### 11.1 ⚠️ CRITICAL RULE: No Duplicate Success Messages

**Problem**: Duplicate success messages appear when both form components and page components show success messages.

**Standard Pattern**:
- **Form Components** (`*FormPanel.tsx`, `*FormModal.tsx`): Should NOT show success messages. They should only call the `onSave`/`onSuccess` callback.
- **Page Components** (`*Page.tsx`): Should show success messages. They handle the actual mutation and know when it succeeds.

**Rationale**:
1. Prevents duplicate notifications
2. Makes form components reusable
3. Page components control the flow and can show appropriate messages
4. Consistent UX across the application

**Example - Correct Pattern**:
```typescript
// ✅ Form Component (UserFormPanel.tsx)
const handleSave = async () => {
  try {
    const values = await form.validateFields();
    await onSave(values); // Just call callback, no message
    form.resetFields();
    onClose();
  } catch (error) {
    message.error(error.message); // Only show errors
  }
};

// ✅ Page Component (UsersPage.tsx)
const handleFormSave = async (values: CreateUserDTO | UpdateUserDTO) => {
  try {
    if (drawerMode === 'edit' && selectedUser) {
      await updateUser.mutateAsync(values as UpdateUserDTO);
      message.success('User updated successfully'); // Show success here
    } else if (drawerMode === 'create') {
      await createUser.mutateAsync(values as CreateUserDTO);
      message.success('User created successfully'); // Show success here
    }
    closeDrawer();
  } catch (error) {
    message.error(error instanceof Error ? error.message : 'Failed to save user');
  }
};
```

**Example - Incorrect Pattern (DUPLICATE)**:
```typescript
// ❌ Form Component (UserFormPanel.tsx) - WRONG
const handleSave = async () => {
  await onSave(values);
  message.success('User updated successfully!'); // ❌ Duplicate message
  onClose();
};

// ❌ Page Component (UsersPage.tsx) - WRONG
const handleFormSave = async (values) => {
  await updateUser.mutateAsync(values);
  message.success('User updated successfully'); // ❌ Duplicate message
  closeDrawer();
};
```

**Files to Check for Duplicates**:
- `src/modules/features/user-management/components/UserFormPanel.tsx` ✅ Fixed
- `src/modules/features/customers/components/CustomerFormPanel.tsx` (form shows, page doesn't - OK)
- `src/modules/features/service-contracts/components/ServiceContractFormModal.tsx` (form shows, page doesn't - OK)
- All other form components should follow the same pattern

**Migration Strategy**:
1. Remove success messages from form components
2. Add success messages to page components that handle mutations
3. Ensure form components only call `onSave`/`onSuccess` callbacks
4. Test each module to ensure no duplicate messages

---

## 12. Tenant Validation System - CRITICAL SECURITY

### 11.1 ⚠️ CRITICAL SECURITY RULE: All Operations Must Validate Tenant TENANT_ID_SECURITY_IMPLEMENTATION.md

**Security Principle**: Every GET/POST/PUT/DELETE operation MUST validate tenant_id. No cross-tenant operations are allowed (except for super admins). All validation attempts are logged for audit purposes.

**Rationale**:
- Prevents unauthorized cross-tenant data access
- Ensures data isolation at the service layer
- Provides comprehensive audit trail for security compliance
- No bypasses or tampering is possible

### 11.2 Centralized Validation System

**Location**: `src/utils/tenantValidation.ts`

**Key Functions**:
- `validateTenantAccess()` - Validates access to existing records (GET/PUT/DELETE)
- `validateTenantForOperation()` - Validates tenant assignment for new records (POST)
- `getOperationTenantId()` - Gets the correct tenant_id to use
- `applyTenantFilter()` - Applies tenant filter to queries

### 12.3 Base Service Class

**Location**: `src/services/base/BaseSupabaseService.ts`

All Supabase services should extend `BaseSupabaseService` to get automatic tenant validation. See `TENANT_VALIDATION_IMPLEMENTATION.md` for detailed usage examples.

### 12.4 Validation Patterns

All CRUD operations must use the validation methods:
- **GET (List)**: Use `applyTenantFilterToQuery()`
- **GET (Single)**: Use `validateTenantAccessForGet()`
- **POST**: Use `validateTenantForCreate()` and `ensureTenantId()`
- **PUT**: Use `validateTenantAccessForUpdate()` and `ensureTenantId()`
- **DELETE**: Use `validateTenantAccessForUpdate()`

### 12.5 Audit Logging

All tenant validation attempts are automatically logged with:
- Operation type, resource, resource ID
- Requested tenant ID, current user tenant ID
- User ID, role, super admin status
- Validation result (ALLOWED/DENIED) and reason

Access audit log: `getValidationAuditLog(limit)`

### 12.6 Security Benefits

1. **No Bypasses**: All operations go through centralized validation
2. **Comprehensive Logging**: Every validation attempt is logged
3. **Audit Trail**: Complete history of all tenant access attempts
4. **Consistent Enforcement**: Same validation logic across all services
5. **Easy Monitoring**: Centralized logging makes monitoring easier

---

## 13. Conclusion

This documentation serves as the **ruleset for future implementation** and **criteria for making any changes** to ensure all layers remain in sync and consistent with the current code structure and implemented design.

**Key Principles:**
1. **Consistency:** All implementations must follow established patterns
2. **Security:** Permission validation and tenant isolation are mandatory
3. **Performance:** Optimize for both user experience and system efficiency
4. **Maintainability:** Code must be well-documented and follow standards
5. **Scalability:** Design for growth and multi-tenant architecture

**References:**
- **Service Factory:** `src/services/serviceFactory.ts`
- **Authentication Service:** `src/services/auth/supabase/authService.ts`
- **RBAC Service:** `src/services/rbac/supabase/rbacService.ts`
- **Bootstrap Module:** `src/modules/bootstrap.ts`
- **RBAC Types:** `src/types/rbac.ts`
- **Architecture Guide:** `ARCHITECTURE.md`

---

**Document Owner:** Development Team  
**Review Cycle:** Monthly  
**Last Reviewed:** December 29, 2025  
**Next Review:** January 29, 2026

---

## 15. Enterprise-Grade Coding Standards (Generic, Loosely Coupled, Configurable)

⚠️ **MANDATORY**: All code must follow these principles for scalability, maintainability, and multi-tenant extensibility.

### Principle 1: Generic & Dynamic Code Over Hardcoded Solutions

**Goal:** Reduce boilerplate by 80%, eliminate duplicate code patterns across entity types.

**❌ PROBLEM: Hardcoded, Non-Reusable Code**
```typescript
// ❌ Duplication - same logic repeated for each entity
async getLeads(): Promise<Lead[]> {
  return supabase.from('leads').select('*');
}

async getDeals(): Promise<Deal[]> {
  return supabase.from('deals').select('*');
}
```

**✅ SOLUTION: Generic Service with Configuration**
```typescript
class GenericEntityService<T extends Entity> {
  constructor(private config: EntityConfig<T>) {}

  async findMany(filters?: Record<string, unknown>): Promise<T[]> {
    let query = supabase.from(this.config.tableName).select('*');
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    const { data } = await query;
    return data.map(row => this.config.transform.fromDatabase(row));
  }
}

// ✅ Reuse for all entities
const leadService = new GenericEntityService(leadsConfig);
const dealService = new GenericEntityService(dealsConfig);
```

**Benefits:**
- Single service class for all entity types
- Configuration per entity (1 place to change validation, fields, mapping)
- Zero duplicate select/filter/order logic
- Easy to add new entities (just create a config)

### Principle 2: Loose Coupling via Dependency Injection

**Goal:** Enable easy swapping of implementations (production ↔ mock), improve testability.

**❌ PROBLEM: Tight Coupling - Hard to Test**
```typescript
class OrderService {
  private emailService = new EmailService();  // Hard-coded dependency
  private notificationService = new NotificationService();  // Hard-coded

  async createOrder(data: OrderData) {
    const order = await this.saveOrder(data);
    this.emailService.send(order);  // Cannot mock in tests
    return order;
  }
}
```

**✅ SOLUTION: Dependency Injection**
```typescript
interface IEmailService {
  send(order: Order): Promise<void>;
}

class OrderService {
  constructor(
    private emailService: IEmailService,
    private notificationService: INotificationService
  ) {}

  async createOrder(data: OrderData) {
    const order = await this.saveOrder(data);
    await this.emailService.send(order);  // Can inject mocks
    return order;
  }
}

// Production: Inject real services
const service = new OrderService(
  new SmtpEmailService(),
  new PushNotificationService()
);

// Testing: Inject mocks
const testService = new OrderService(
  new MockEmailService(),
  new MockNotificationService()
);
```

**Benefits:**
- Services have zero dependencies on concrete implementations
- Can swap implementations without changing OrderService
- All dependencies are mockable for testing
- Easier to implement retry logic and fallbacks

### Principle 3: Centralized Configuration Over Hardcoded Values

**Goal:** Single source of truth for all settings; enable different configs per environment.

**❌ PROBLEM: Scattered Hardcoded Values**
```typescript
class CustomerService {
  private timeout = 5000;  // What about OrderService?
}

class OrderService {
  private timeout = 10000;  // Inconsistent!
}

const API_URL = 'https://api.production.com';  // Not configurable
```

**✅ SOLUTION: Centralized appConfig**
```typescript
// src/config/appConfig.ts - SINGLE SOURCE OF TRUTH
export const appConfig = {
  api: {
    baseUrl: process.env.VITE_API_URL || 'https://api.example.com',
    timeout: parseInt(process.env.VITE_API_TIMEOUT || '30000'),
    retries: parseInt(process.env.VITE_API_RETRIES || '3'),
  },
  cache: {
    ttlMs: parseInt(process.env.VITE_CACHE_TTL || '300000'),
    maxSize: parseInt(process.env.VITE_CACHE_MAX_SIZE || '100'),
  },
  logging: {
    level: process.env.VITE_LOG_LEVEL || 'info',
  },
  features: {
    enableEmailNotifications: process.env.VITE_ENABLE_EMAIL === 'true',
    enableAnalytics: process.env.VITE_ENABLE_ANALYTICS === 'true',
  },
} as const;

// All services use same config
class CustomerService {
  constructor(private config: typeof appConfig) {}
  async fetch() {
    return apiClient.get('/customers', {
      timeout: this.config.api.timeout,
      retries: this.config.api.retries,
    });
  }
}
```

**Benefits:**
- Change settings → edit ONE file
- Different envs have different configs (dev/prod/test)
- Feature flags enable/disable functionality without code changes
- Easy to add new configuration as system grows

### Principle 4: Configuration Objects Over Parameter Overload

**Goal:** Maintainable function signatures that can be extended without breaking callers.

**❌ PROBLEM: Function Signature Bloat**
```typescript
async fetchData(
  entityType: string,
  withDetails: boolean,
  includeDeleted: boolean,
  sortBy: string,
  sortDir: 'asc' | 'desc',
  limit: number,
  offset: number,
  cacheEnabled: boolean
) {
  // Too many parameters - confusing
}
```

**✅ SOLUTION: Options Object Pattern**
```typescript
interface FetchOptions {
  filters?: Record<string, unknown>;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
  sort?: { by: string; direction: 'asc' | 'desc' };
  cache?: { enabled: boolean; ttlMs?: number };
  includeRelations?: string[];
}

async function fetchData(
  entityType: string,
  options: FetchOptions = {}
): Promise<Entity[]> {
  const { filters = {}, limit = 100, sort } = options;
  // Clear, readable implementation
}

// Usage: Crystal clear
const leads = await fetchData('leads', {
  filters: { status: 'hot' },
  limit: 50,
  sort: { by: 'created_at', direction: 'desc' },
});
```

**Benefits:**
- Self-documenting function signatures
- Easy to extend with new options without breaking existing calls
- Defaults are clear and safe
- Calling code is readable and maintainable

### Principle 5: Strategy Pattern for Pluggable Logic

**Goal:** Extend functionality without modifying existing classes.

**❌ PROBLEM: Monolithic with If Chains**
```typescript
class DataExporter {
  async export(data: Entity[], format: 'csv' | 'json' | 'pdf') {
    if (format === 'csv') return this.toCsv(data);
    else if (format === 'json') return this.toJson(data);
    else if (format === 'pdf') return this.toPdf(data);
    // ❌ Adding new format requires modifying this class
  }
}
```

**✅ SOLUTION: Strategy Pattern**
```typescript
interface ExportStrategy {
  export(data: Entity[]): Promise<Blob>;
  getContentType(): string;
}

class DataExporter {
  private strategies: Map<string, ExportStrategy> = new Map([
    ['csv', new CsvExportStrategy()],
    ['json', new JsonExportStrategy()],
    ['pdf', new PdfExportStrategy()],
  ]);

  registerStrategy(format: string, strategy: ExportStrategy) {
    this.strategies.set(format, strategy);
  }

  async export(data: Entity[], format: string): Promise<Blob> {
    const strategy = this.strategies.get(format);
    if (!strategy) throw new Error('Unknown format');
    return strategy.export(data);
  }
}

// ✅ Adding Excel - NO changes to DataExporter
const exporter = new DataExporter();
exporter.registerStrategy('xlsx', new ExcelExportStrategy());
```

**Benefits:**
- Add new strategies without touching existing code
- Each strategy is independently testable
- Strategies registered dynamically
- Follows SOLID principles (Open for extension, Closed for modification)

### Principle 6: Multi-Tenant Awareness by Default

**Goal:** Prevent data leakage across tenants; automatic filtering at service layer.

**❌ PROBLEM: Missing Tenant Context**
```typescript
async getLeads(): Promise<Lead[]> {
  return supabase.from('leads').select('*');
  // ❌ Returns ALL leads from ALL tenants!
}
```

**✅ SOLUTION: Automatic Tenant Filtering**
```typescript
import { sessionService } from '@/services/session/SessionService';

async getLeads(filters?: Filters): Promise<Lead[]> {
  const tenantId = sessionService.getTenantId();
  
  let query = supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', tenantId);  // ALWAYS filter by tenant
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  return query;
}
```

**Benefits:**
- Zero chance of data leakage (tenant filtering at service layer)
- Developers don't need to remember tenant filtering
- Scales safely to new entities and services
- Tenant context comes from centralized SessionService

### Principle 7: Document Trade-offs & Constraints

**Goal:** Help developers understand when to use each pattern, and when NOT to.

```typescript
/**
 * Generic Entity Service
 * 
 * ✅ PROS:
 * - Reduces boilerplate 80%
 * - Automatic tenant filtering
 * - Built-in caching
 * - Type-safe generics
 * 
 * ❌ CONS:
 * - Cannot handle complex domain logic
 * - Query filters limited to equals
 * - Relations loaded separately
 * 
 * ✅ USE WHEN:
 * - Simple CRUD operations
 * - Static reference data
 * - Audit/logging entities
 * 
 * ❌ DO NOT USE FOR:
 * - Complex domain logic (use domain service)
 * - Many-to-many with junctions (use custom query)
 * - Graph queries (use custom query)
 */
```

### Enterprise Checklist (Before Code Review)

- [ ] No hardcoded values - all config via `appConfig` or environment
- [ ] No direct service instantiation - dependencies injected via constructor
- [ ] No tightly coupled imports - can swap implementations easily
- [ ] No parameter overload - methods use options objects
- [ ] Reusable patterns - can apply same code to 3+ entities
- [ ] Documented constraints - comments explain when/why
- [ ] Tenant-aware - automatic filtering via `sessionService`
- [ ] Type-safe - generics preserve type information
- [ ] Testable - all dependencies mockable
- [ ] Composable - functions combine without side effects

---

### 14.1 ⚠️ CRITICAL RULE: Consistent Import Strategy Prevents Vite Warnings

**Problem**: Mixing `static imports` and `dynamic imports (await import(...))` of the same module causes Vite warnings:
```
Module is dynamically imported by A.ts but also statically imported by B.ts.
Dynamic import will not move module into another chunk.
```

**Impact**:
- Prevents proper code splitting and chunking
- Blocks route-level lazy loading optimization
- Creates bundle analysis warnings
- Reduces production performance

### 14.2 🎯 Golden Rule: Static Imports for Core, Dynamic Only for Routes

**Core Layer (Services, Utils, Contexts):**
✅ **ALWAYS use static imports**
```typescript
// Correct: Supabase service uses static imports for utilities
import { getAuditIPInfo } from '@/api/middleware/ipTracking';
import { authService, rbacService } from '@/services/serviceFactory';
import { getValidUserRoles, isPlatformRoleByName } from '@/utils/roleMapping';

async function getClientIp(): Promise<string> {
  const ipInfo = await getAuditIPInfo(); // Static import, async call
  return ipInfo.ip_address;
}
```

❌ **NEVER mix static and dynamic imports of the same module:**
```typescript
// Wrong: Causes Vite warning about mixed imports
import { authService } from '@/services';  // Static

async function login() {
  const { authService } = await import('@/services');  // Dynamic - CONFLICT!
}
```

**Route/Page Layer (React components with lazy loading):**
✅ **ONLY use dynamic imports via React.lazy()**
```typescript
// Correct: Route pages use React.lazy for code splitting
const ProductListPage = React.lazy(() => import('./views/ProductListPage'));
const CustomerListPage = React.lazy(() => import('./views/CustomerListPage'));

// Routes configuration
export const productsRoutes = [
  { path: '/products', element: <ProductListPage /> }
];
```

**Module Initialization (bootstrap.ts):**
✅ **Use dynamic imports for deferred module loading**
```typescript
// Correct: Bootstrap loads modules on demand for deferred initialization
export async function initializeModule(moduleName: string) {
  switch (moduleName) {
    case 'customers':
      const { customerModule } = await import('./features/customers');
      return customerModule;
    case 'deals':
      const { dealsModule } = await import('./features/deals');
      return dealsModule;
  }
}
```

### 14.3 Application by Layer

| Layer | Pattern | Example |
|-------|---------|---------|
| **Services** | Static only | `import { rbacService } from '@/services/serviceFactory'` |
| **Utilities** | Static only | `import { getValidUserRoles } from '@/utils/roleMapping'` |
| **Contexts** | Static only | `import { supabase } from '@/services/supabase/client'` |
| **Hooks** | Static only | `import { authService } from '@/services'` |
| **UI Components** | Static only | `import { RbacService } from '@/services/rbac'` |
| **Page Routes** | Dynamic via React.lazy | `const Page = React.lazy(() => import('./Page'))` |
| **Module Bootstrap** | Dynamic when deferred | `const mod = await import('./module')` |

### 14.4 Conversion Checklist: Static Imports

If you find `await import()` in services/utils/contexts:

**Before (❌ Dynamic):**
```typescript
async getRoles(): Promise<UserRole[]> {
  const { getValidUserRoles } = await import('@/utils/roleMapping');
  return await getValidUserRoles();
}
```

**After (✅ Static):**
```typescript
import { getValidUserRoles } from '@/utils/roleMapping';

async getRoles(): Promise<UserRole[]> {
  return await getValidUserRoles();
}
```

**Steps:**
1. Move import to top of file (outside function)
2. Remove `const { func } = await import(...)` lines
3. Use static import directly in function
4. Rebuild and verify no new Vite warnings

### 14.5 Exception Cases: When to Use Dynamic Imports

**✅ Allowed:**
- Route-level page components via `React.lazy()`
- Module bootstrap/initialization (one-time deferred loads)
- Heavy UI libraries loaded conditionally based on user action
- Circular dependency workarounds (rare, document why)

**Example of valid exception:**
```typescript
// Page routes in features/products/routes.tsx
export const productsRoutes = [
  {
    path: '/products',
    element: <Suspense fallback={<Spinner />}>
      <React.lazy(() => import('./views/ProductListPage'))/>
    </Suspense>
  }
];
```

### 14.6 Detection and Prevention

**How to find violations:**
```bash
# Search for dynamic imports of services/utils
grep -r "await import('@/services" src/
grep -r "await import('@/utils" src/
grep -r "await import('@/contexts" src/

# Search for mixed imports (import X from Y and await import Y)
# Use IDE's "Find All References" to spot patterns
```

**Pre-commit Check:**
```typescript
// In future CI/CD pipeline:
// 1. Run Vite build with --report flag
// 2. Check for mixed dynamic/static import warnings
// 3. Fail build if warnings found (except approved routes)
```

**Build validation:**
```powershell
npm run build 2>&1 | grep "Module is dynamically imported"
# If matches return, fix before commit
```

### 14.7 Best Practices

**✅ DO:**
- Use static imports for all services/utilities
- Use dynamic imports only for route-level lazy loading
- Import at top of file, use result in functions
- Run build after changes to verify no warnings
- Document any exceptions with clear comments

**❌ DON'T:**
- Mix static and dynamic imports of same module
- Import services dynamically inside functions
- Defer loading core utilities
- Use dynamic imports to "avoid circular dependencies" (refactor instead)
- Forget to run build validation

### 14.8 Performance Impact

**Static Imports (✅ Preferred):**
- Immediate availability (no async delay)
- Proper tree-shaking and code splitting
- Clear dependency graph
- Better IDE support and type checking
- Smaller per-route chunks

**Mixed Imports (❌ Anti-pattern):**
- Vite warnings prevent proper chunking
- Services bundle together unpredictably
- Route chunks larger than necessary
- IDE struggles with type resolution
- Build time increases

### 14.9 References

- **Service Factory:** `src/services/serviceFactory.ts`
- **Bootstrap:** `src/modules/bootstrap.ts`
- **Role Mapping:** `src/utils/roleMapping.ts`
- **Vite Docs:** https://vitejs.dev/guide/ssr.html#handling-imports
- **Code Splitting:** https://vitejs.dev/guide/features.html#dynamic-import

---

**Document Owner:** Development Team  
**Review Cycle:** Monthly  
**Last Reviewed:** December 29, 2025  
**Next Review:** January 29, 2026
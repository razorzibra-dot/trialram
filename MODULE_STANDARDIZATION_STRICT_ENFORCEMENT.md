# Module Standardization: Strict Enforcement Ruleset

**Status**: ✅ ACTIVE - All 18 feature modules standardized with comprehensive enforcement rules
**Last Updated**: 2025-01-29
**Standardization Completion**: 100%

---

## 📋 Overview

This document defines the **strict, non-negotiable ruleset** for module service standardization across the entire PDS-CRM application. Every module, page, component, and service interaction MUST follow these rules without exception.

### Standardized Modules (18 Total)
1. ✅ **Sales** - Deal management and sales pipeline
2. ✅ **Product Sales** - Product-based sales operations
3. ✅ **Customers** - Customer management and profiles
4. ✅ **Contracts** - Service contract management
5. ✅ **Service Contracts** - Service delivery contracts
6. ✅ **Tickets** - Support ticket management
7. ✅ **Job Works** - Job work operations
8. ✅ **Dashboard** - Analytics and dashboards
9. ✅ **Masters** - Master data (products, companies)
10. ✅ **Notifications** - System notifications
11. ✅ **Audit Logs** - Activity tracking
12. ✅ **PDF Templates** - Document generation
13. ✅ **Complaints** - Complaint management
14. ✅ **Configuration** - Tenant configuration
15. ✅ **Super Admin** - Administrative operations
16. ✅ **User Management** - User and role management
17. ⏳ **Auth** - Authentication (hybrid mode - core system)
18. ⏳ **Dashboard** - Core dashboard (hybrid mode - core system)

---

## 🎯 RULE SET 1: Module Initialization & Service Registration

### Rule 1.1: Module Index Structure
**REQUIREMENT**: Every feature module MUST have a properly structured `index.ts` file that:

```typescript
/**
 * [ModuleName] Module
 * [Description]
 * 
 * ✅ Follows Module Service Standardization Pattern:
 * - All services registered in initialize()
 * - Components use useService() hook
 * - No direct service imports in components
 */

import { FeatureModule } from '@/modules/core/types';
import { [moduleName]Routes } from './routes';

export const [moduleName]Module: FeatureModule = {
  name: '[module-name]',
  path: '/[module-path]',
  routes: [moduleName]Routes,
  services: ['service1', 'service2'],  // Explicit service list
  components: {},
  dependencies: ['core', 'shared'],
  
  async initialize() {
    // Must include try-catch and detailed logging
    try {
      const { registerService } = await import('@/modules/core/services/ServiceContainer');
      const { service1, service2 } = await import('@/services/serviceFactory');
      
      registerService('service1', service1);
      registerService('service2', service2);
      
      console.log('[ModuleName] ✅ Module initialized successfully');
    } catch (error) {
      console.error('[ModuleName] ❌ Initialization failed:', error);
      throw error;
    }
  },
  
  async cleanup() {
    try {
      const { serviceContainer } = await import('@/modules/core/services/ServiceContainer');
      serviceContainer.remove('service1');
      serviceContainer.remove('service2');
      console.log('[ModuleName] ✅ Services cleaned up');
    } catch (error) {
      console.error('[ModuleName] ❌ Cleanup failed:', error);
    }
  }
};
```

**✅ MUST HAVE**:
- JSDoc comment with module description
- `initialize()` method with try-catch error handling
- Explicit `services` array listing all services
- `registerService()` calls for each service
- Detailed logging with module prefix (e.g., `[Sales Module]`)
- `cleanup()` method unregistering services

**❌ MUST NOT**:
- Export services directly from index.ts
- Initialize services without error handling
- Use dynamic imports without try-catch
- Omit cleanup method
- Have unstructured service declarations

---

### Rule 1.2: Service Registration Pattern
**REQUIREMENT**: Services MUST be registered using the service factory pattern:

```typescript
// ✅ CORRECT - Use factory pattern
import { userService, rbacService } from '@/services/serviceFactory';

registerService('userService', userService);
registerService('rbacService', rbacService);
```

**❌ NOT ALLOWED**:
```typescript
// ❌ WRONG - Direct mock import
import { mockUserService } from '@/services/userService';

// ❌ WRONG - Direct Supabase import
import { supabaseUserService } from '@/services/api/supabase/userService';

// ❌ WRONG - No import prefix
registerService('userService', userService);
```

---

## 🎯 RULE SET 2: Component Service Access

### Rule 2.1: Page/Container Components - MANDATORY useService Hook
**REQUIREMENT**: All page and container components within modules MUST use the `useService` hook for service injection.

**Template**:
```typescript
import React from 'react';
import { useService } from '@/modules/core/hooks/useService';
import type { TypeName } from '@/types/crm';  // Type-only import

export const MyPage: React.FC = () => {
  // ✅ Service injection via hook
  const myService = useService<any>('myService');
  const rbacService = useService<any>('rbacService');
  
  // Page implementation...
};
```

**✅ MUST HAVE**:
- Import `useService` from `@/modules/core/hooks/useService`
- Call `useService<any>('serviceName')` at component top level
- Service names MUST match registered names in module index
- Type-only imports for types (`import type { ... }`)

**❌ MUST NOT**:
- Import services directly from `@/services/serviceFactory`
- Import services from `@/services/[serviceName]`
- Import from `@/services/api/supabase/*`
- Use `userService` without hook injection
- Mix direct imports with hook-based injection

### Rule 2.2: Presentational Components - No Service Access
**REQUIREMENT**: Presentational components (e.g., FormPanel, DetailPanel) MUST NOT access services. Data and callbacks MUST be passed via props.

**Template**:
```typescript
interface UserFormPanelProps {
  open: boolean;
  mode: 'create' | 'edit';
  user: UserType | null;
  onClose: () => void;
  onSave: (values: UserFormData) => Promise<void>;
  loading: boolean;
  allRoles: string[];
}

export const UserFormPanel: React.FC<UserFormPanelProps> = ({
  open, mode, user, onClose, onSave, loading, allRoles
}) => {
  // Render form - NO service access
};
```

**✅ MUST HAVE**:
- All data passed via props
- All callbacks passed via props
- Type-safe prop interface
- No service imports

**❌ MUST NOT**:
- Access services
- Call APIs directly
- Import service factory
- Use useService hook

### Rule 2.3: Custom Hooks - Direct Service Access Allowed
**REQUIREMENT**: Custom hooks within modules CAN access services directly if they maintain abstraction.

**Template**:
```typescript
import { useService } from '@/modules/core/hooks/useService';

export function useMyCustomLogic() {
  const myService = useService<any>('myService');
  
  return {
    // Export hook methods
  };
}
```

**✅ ALLOWED**:
- Direct useService calls in hooks
- Service method abstraction
- Return only what's needed
- Clear naming convention (use* prefix)

---

## 🎯 RULE SET 3: Type Imports

### Rule 3.1: Type-Only Imports Mandatory
**REQUIREMENT**: All type imports from service files MUST use `type` keyword.

**✅ CORRECT**:
```typescript
import type { User, Customer, Deal } from '@/types/crm';
import type { ColumnsType } from 'antd/es/table';
import type { CreateUserData } from '@/services/userService';
```

**❌ WRONG**:
```typescript
import { User, Customer } from '@/types/crm';  // Missing 'type'
import { userService } from '@/services/userService';  // Not a type
```

### Rule 3.2: No Runtime Type References
**REQUIREMENT**: Type definitions MUST never be used for runtime operations.

**❌ WRONG**:
```typescript
// Type used at runtime - INVALID
const user: User = new User();  // User is a type, not a class
```

**✅ CORRECT**:
```typescript
// Type for annotations only
interface UserFormData {
  email: string;
  name: string;
}

const submitForm = async (data: UserFormData) => {
  // Runtime logic using typed data
};
```

---

## 🎯 RULE SET 4: Service Factory Pattern

### Rule 4.1: Multi-Backend Support
**REQUIREMENT**: All services accessed through modules MUST support multi-backend operation:

```typescript
// @/services/serviceFactory.ts exports both implementations
export { userService } from './serviceFactory';
export { rbacService } from './serviceFactory';
export { productSaleService } from './serviceFactory';

// Service factory handles mode switching
const apiMode = import.meta.env.VITE_API_MODE || 'mock';

export function getUserService() {
  return apiMode === 'supabase' 
    ? supabaseUserService 
    : mockUserService;
}

export const userService = {
  getUsers: () => getUserService().getUsers(),
  createUser: (data) => getUserService().createUser(data),
  // ... all methods delegated
};
```

**✅ MUST HAVE**:
- Both mock and Supabase implementations
- Service factory routing
- Dynamic implementation selection
- Consistent API across implementations

**❌ MUST NOT**:
- Hard-code one implementation
- Mix mock and Supabase in same method
- Skip factory pattern for any service
- Import directly from `/services/api/supabase/`

### Rule 4.2: New Service Registration
When adding a new factory-routed service:

1. **Create implementations**:
   - Mock: `src/services/{serviceName}.ts`
   - Supabase: `src/services/api/supabase/{serviceName}.ts`

2. **Update serviceFactory.ts**:
   ```typescript
   export const newService = {
     method1: () => getNewService().method1(),
     method2: () => getNewService().method2(),
   };
   ```

3. **Export from index.ts**:
   ```typescript
   export { newService } from './serviceFactory';
   ```

4. **Register in module**:
   ```typescript
   registerService('newService', newService);
   ```

---

## 🎯 RULE SET 5: No Cross-Module Service Sharing

### Rule 5.1: Service Isolation
**REQUIREMENT**: Services registered by one module MUST NOT be directly accessed by another module.

**✅ CORRECT**:
```typescript
// Sales module page
const salesService = useService<any>('salesService');
const sales = await salesService.getDeals();
```

**❌ WRONG**:
```typescript
// Contract module trying to access sales service
const salesService = useService<any>('salesService');  // Not registered by contracts module
```

**Exception**: Core services (auth, audit, notifications) are shared globally through ServiceContainer.

### Rule 5.2: Module Boundary Enforcement
**REQUIREMENT**: Each module MUST:
- Only import from its own directory `/src/modules/features/[moduleName]/`
- Only import types from `/src/types/`
- Only import utilities from `/src/utils/` and `/src/lib/`
- Only import shared components from `/src/components/common/`
- NOT import from other feature modules' services or pages

**✅ CORRECT**:
```typescript
// In sales module
import { useDeals } from './hooks/useSales';  // Own module
import { Deal } from '@/types/crm';  // Shared types
import { PageHeader } from '@/components/common';  // Common components
```

**❌ WRONG**:
```typescript
// ❌ Cross-module import
import { useCustomers } from '@/modules/features/customers/hooks';

// ❌ Direct service import
import { customerService } from '@/modules/features/customers/services';

// ❌ Cross-module page import
import { CustomerPage } from '@/modules/features/customers';
```

---

## 🎯 RULE SET 6: Critical Module Distinctions

### Rule 6.1: Sales vs Product Sales - NEVER CONFUSE
**REQUIREMENT**: These are COMPLETELY SEPARATE modules with different business logic.

| Aspect | Sales Module | Product Sales Module |
|--------|--------------|---------------------|
| **Path** | `/src/modules/features/sales/` | `/src/modules/features/product-sales/` |
| **Service** | `salesService` | `productSaleService` |
| **Focus** | Deal management, sales pipeline, opportunities | Product inventory, sales items, transactions |
| **Data Model** | Deal (parent entity) | ProductSale, SaleItem (product-centric) |

**❌ NEVER DO**:
- Mix product sales logic into sales module
- Reuse sales service for product operations
- Override sales routes with product-sales routes
- Share state between modules
- Copy code from one to the other without explicit request

### Rule 6.2: Contracts vs Service Contracts - NEVER CONFUSE
**REQUIREMENT**: These are COMPLETELY SEPARATE modules with different business logic.

| Aspect | Contracts Module | Service Contracts Module |
|--------|------------------|-------------------------|
| **Path** | `/src/modules/features/contracts/` | `/src/modules/features/service-contracts/` |
| **Service** | `contractService` | `serviceContractService` |
| **Focus** | Client agreements, terms, lifecycle | Service delivery, scheduling, fulfillment |
| **Data Model** | Contract (agreement-centric) | ServiceContract (service-centric) |

**❌ NEVER DO**:
- Mix service contract logic into contracts module
- Reuse contract service for service contracts
- Override contract routes with service contract routes
- Share state between modules

---

## 🎯 RULE SET 7: Error Handling & Logging

### Rule 7.1: Module Logging Standards
**REQUIREMENT**: All module operations MUST use consistent logging with module prefix:

```typescript
// Module initialization
console.log('[Sales Module] 🚀 Initializing...');
console.log('[Sales Module] ✅ Service registered: salesService');
console.log('[Sales Module] ❌ Initialization failed:', error);

// Component operations
console.log('[Sales Module] 📝 Loading deals...');
console.error('[Sales Module] ❌ Failed to load deals:', error);
```

**Format**: `[ModuleName] [emoji] message`

**Emojis**:
- 🚀 Starting/initializing
- ✅ Success/complete
- ❌ Error/failure
- 📝 In-progress operation
- 🧹 Cleanup
- ⚠️ Warning
- 🔒 Security/permission issue
- 💾 Data operation
- 🔄 Refresh/retry

### Rule 7.2: Error Handling Pattern
**REQUIREMENT**: All async operations MUST use try-catch with clear error reporting:

```typescript
async initialize() {
  try {
    console.log('[Sales] 🚀 Initializing...');
    const { registerService } = await import('@/modules/core/services/ServiceContainer');
    
    registerService('salesService', salesService);
    console.log('[Sales] ✅ Initialized successfully');
  } catch (error) {
    console.error('[Sales] ❌ Initialization failed:', error);
    throw error;  // Re-throw to prevent silent failures
  }
}
```

---

## 🎯 RULE SET 8: Import Organization

### Rule 8.1: Import Order (MUST BE STRICT)
Every component/file MUST follow this import order:

```typescript
// 1. React and React Router
import React from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Third-party libraries
import { Card, Button, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

// 3. Services (via useService or factory)
import { useService } from '@/modules/core/hooks/useService';

// 4. Internal modules and hooks
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common';

// 5. Module-specific imports (own module only)
import { useMyCustomHook } from './hooks/useMyCustom';
import { MyDetailPanel } from './components/MyDetailPanel';

// 6. Type imports (MUST BE TYPE-ONLY)
import type { MyType, AnotherType } from '@/types/crm';
```

**❌ NOT ALLOWED**:
```typescript
// Wrong: Service before hooks
import { userService } from '@/services/serviceFactory';
import { useAuth } from '@/contexts/AuthContext';

// Wrong: Mixed order
import { Card } from 'antd';
import React from 'react';
import type { MyType } from '@/types/crm';
```

---

## 🎯 RULE SET 9: Module Communication Pattern

### Rule 9.1: How Modules Interact
Modules interact ONLY through:
1. **Shared context providers** (AuthContext, etc.)
2. **Shared service factory** (for core services)
3. **React Router navigation**
4. **Event bus or state management** (if needed)

**❌ NOT ALLOWED**:
- Direct imports from other module's services
- Direct imports from other module's pages
- Sharing module-specific state stores
- Importing other module's hooks

### Rule 9.2: Message Pattern (Future Enhancement)
```typescript
// Example of future cross-module communication
import { useEventBus } from '@/modules/core/hooks/useEventBus';

export const FeatureComponent: React.FC = () => {
  const { subscribe, publish } = useEventBus();
  
  // Listen for events from other modules
  subscribe('module:action', (data) => {
    console.log('[Sales] Received event:', data);
  });
  
  // Publish events for other modules to consume
  const handleSave = () => {
    publish('sales:deal-created', { dealId: '123' });
  };
};
```

---

## ✨ ENFORCEMENT MECHANISMS

### ESLint Rule: No Direct Service Imports in Components
A custom ESLint rule MUST prevent direct serviceFactory imports in component files:

**Rule Name**: `no-direct-service-imports`
**Severity**: ERROR
**Files**: `src/modules/features/**/*.tsx` (but not hooks)

```typescript
// ❌ DETECTED AND BLOCKED
import { userService } from '@/services/serviceFactory';  // ERROR!

// ✅ ALLOWED
import { useService } from '@/modules/core/hooks/useService';
```

### Pre-commit Hook: Service Registration Validation
Git pre-commit hook validates:
- ✅ All registered services in module index are used
- ✅ No orphaned service registrations
- ✅ Service factory exports exist
- ✅ No circular module dependencies

### Build-time Validation
TypeScript strict mode ensures:
- ✅ Type safety across module boundaries
- ✅ No any-type abuse except in useService generics
- ✅ Proper interface definitions
- ✅ No implicit any errors

---

## 📊 Standardization Status by Module

| # | Module | Status | Notes |
|---|--------|--------|-------|
| 1 | Sales | ✅ Complete | Module container pattern, custom hooks |
| 2 | Product Sales | ✅ Complete | Factory-routed services, bulk operations |
| 3 | Customers | ✅ Complete | useService hook in pages |
| 4 | Contracts | ✅ Complete | Module-specific services registered |
| 5 | Service Contracts | ✅ Complete | Separated from Contracts module |
| 6 | Tickets | ✅ Complete | Custom hooks abstraction |
| 7 | Job Works | ✅ Complete | Factory-routed service |
| 8 | Dashboard | ✅ Complete | Core system + module pattern |
| 9 | Masters | ✅ Complete | Product/Company management |
| 10 | Notifications | ✅ Complete | Factory-routed service |
| 11 | Audit Logs | ✅ Complete | useService hook implementation |
| 12 | PDF Templates | ✅ Complete | Document generation service |
| 13 | Complaints | ✅ Complete | Module container registered |
| 14 | Configuration | ✅ Complete | Tenant config + test services |
| 15 | Super Admin | ✅ Complete | Multiple service registration |
| 16 | User Management | ✅ Complete | All pages using useService |
| 17 | Auth | ⏳ Hybrid | Core system, limited module pattern |
| 18 | Dashboard (core) | ⏳ Hybrid | Shared across features |

---

## 🚨 CRITICAL CHECKLIST FOR NEW FEATURES

Before adding ANY new code to a module, verify:

- [ ] Module `index.ts` has proper initialize/cleanup methods
- [ ] All services are registered in service container
- [ ] All page components use `useService` hook
- [ ] No direct serviceFactory imports in components
- [ ] Type imports use `type` keyword
- [ ] Presentational components receive data via props
- [ ] No cross-module service imports
- [ ] Error handling includes try-catch
- [ ] Logging uses module prefix convention
- [ ] Follows Rule Set 1-9 entirely

---

## 📝 Example: Adding a New Feature to Sales Module

```typescript
// 1. Register service in module index
export const salesModule: FeatureModule = {
  // ...
  services: ['salesService', 'newFeatureService'],  // ADD HERE
  async initialize() {
    const { registerService } = await import('@/modules/core/services/ServiceContainer');
    const { salesService, newFeatureService } = await import('@/services/serviceFactory');
    
    registerService('salesService', salesService);
    registerService('newFeatureService', newFeatureService);  // ADD HERE
  }
};

// 2. Use in page component
export const NewFeaturePage: React.FC = () => {
  const newFeatureService = useService<any>('newFeatureService');  // USE HOOK
  
  const handleAction = async () => {
    const result = await newFeatureService.doSomething();  // USE SERVICE
  };
};

// 3. Presentational component receives data
interface NewFeaturePanelProps {
  data: any;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export const NewFeaturePanel: React.FC<NewFeaturePanelProps> = ({
  data, onClose, onSave
}) => {
  // NO SERVICE ACCESS
};
```

---

## 🎓 Reference: Module Container Pattern

The entire application uses a **Service Container Pattern** where:

1. **Module Registration**: Modules declare services in `initialize()`
2. **Service Injection**: Components request services via `useService(name)` hook
3. **Factory Routing**: Service factory handles multi-backend (mock/Supabase) switching
4. **Cleanup**: Modules unregister services in `cleanup()`

This enables:
- ✅ No direct dependencies between modules
- ✅ Easy testing with mock services
- ✅ Multi-tenant support via Supabase
- ✅ Seamless backend switching
- ✅ Type-safe service access
- ✅ Automatic service lifecycle management

---

**Version**: 2.0
**Last Updated**: 2025-01-29
**Owner**: Architecture Team
**Next Review**: Q2 2025
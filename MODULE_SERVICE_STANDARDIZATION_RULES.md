# Module Service Standardization Ruleset

**Status**: ✅ **MANDATORY FOR ALL MODULES, PAGES, AND COMPONENTS**

---

## Table of Contents
1. [Core Principles](#core-principles)
2. [Module Initialization Standard](#module-initialization-standard)
3. [Component Service Usage Standard](#component-service-usage-standard)
4. [Page/View Service Usage Standard](#pageview-service-usage-standard)
5. [Hook Service Usage Standard](#hook-service-usage-standard)
6. [Service Import Rules](#service-import-rules)
7. [Compliance Checklist](#compliance-checklist)
8. [Migration Guide](#migration-guide)
9. [Code Review Standards](#code-review-standards)

---

## Core Principles

### 🎯 Single Source of Truth
- **All services MUST be registered in the module's `initialize()` function**
- No exceptions to this rule
- Services registered in the container are the only "approved" services for the module

### 🔒 Loose Coupling
- Components MUST NOT import services directly from `/src/services/`
- Components MUST retrieve services through the module's service container
- This enables testing, mocking, and runtime flexibility

### 📦 Dependency Injection Pattern
- Services are injected via the `useService()` hook
- Removes tight coupling between components and service implementations
- Allows swapping service implementations without changing component code

### 🧩 Module Isolation
- Each module manages its own services
- Modules do not share service instances across module boundaries
- Cross-module communication happens through well-defined interfaces only

---

## Module Initialization Standard

### ✅ Required: Complete Module Definition

Every feature module at `/src/modules/features/{moduleName}/index.ts` MUST implement:

```typescript
import { FeatureModule } from '@/modules/core/types';
import { moduleName_Routes } from './routes';

export const moduleName_Module: FeatureModule = {
  name: 'module-name',
  path: '/module-name',
  
  // REQUIRED: List all services this module uses
  services: ['service1', 'service2'],
  
  routes: moduleName_Routes,
  components: {},
  dependencies: ['core', 'shared'],

  // REQUIRED: Proper service registration
  async initialize() {
    try {
      const { registerService } = await import('@/modules/core/services/ServiceContainer');
      
      // Import service classes
      const { Service1 } = await import('./services/service1');
      const { Service2 } = await import('./services/service2');
      
      // Register each service
      registerService('service1', Service1);
      registerService('service2', Service2);
      
      console.log(`[${this.name}] ✅ Module initialized with services: service1, service2`);
    } catch (error) {
      console.error(`[${this.name}] ❌ Initialization failed:`, error);
      throw error;
    }
  },

  // REQUIRED: Cleanup on module unload
  async cleanup() {
    const { serviceContainer } = await import('@/modules/core/services/ServiceContainer');
    serviceContainer.remove('service1');
    serviceContainer.remove('service2');
    console.log(`[${this.name}] Module cleaned up`);
  },
};
```

### ✅ Module Structure Template

```
/src/modules/features/{moduleName}/
├── index.ts                 (module config, exports)
├── routes.tsx              (route definitions)
├── DOC.md                  (module documentation)
├── services/
│   ├── service1.ts         (service implementation)
│   ├── service2.ts         (service implementation)
│   └── index.ts            (service exports)
├── components/
│   ├── Component1.tsx      (uses useService hook)
│   ├── Component2.tsx      (uses useService hook)
│   └── index.ts            (exports)
├── views/
│   ├── PageView.tsx        (uses useService hook)
│   └── DetailView.tsx      (uses useService hook)
├── hooks/
│   ├── useService1.ts      (wraps service calls)
│   └── index.ts            (exports)
└── store/
    └── moduleStore.ts      (Zustand store)
```

---

## Component Service Usage Standard

### ✅ CORRECT: Use useService() Hook

```typescript
import { FC, useState } from 'react';
import { useService } from '@/modules/core/hooks/useService';
import { YourService } from '../services/yourService';

interface YourComponentProps {
  id: string;
}

export const YourComponent: FC<YourComponentProps> = ({ id }) => {
  const [loading, setLoading] = useState(false);
  
  // ✅ CORRECT: Inject service through useService hook
  const service = useService<YourService>('yourService');

  const handleFetch = async () => {
    setLoading(true);
    try {
      // Service is available and type-safe
      const data = await service.getData(id);
      // process data
    } finally {
      setLoading(false);
    }
  };

  return (
    // Component JSX
    <div>
      {/* Component code */}
    </div>
  );
};

export default YourComponent;
```

### ❌ WRONG: Direct Global Import

```typescript
// ❌ INCORRECT - This bypasses the service container
import { yourService } from '@/services';

export const YourComponent = () => {
  // Direct service access - tight coupling
  const data = await yourService.getData();
};
```

### ❌ WRONG: Direct Supabase Import

```typescript
// ❌ INCORRECT - Breaks abstraction layer
import { supabaseYourService } from '@/services/api/supabase/yourService';

export const YourComponent = () => {
  // Direct Supabase access - not testable
  const data = await supabaseYourService.getData();
};
```

---

## Page/View Service Usage Standard

### ✅ CORRECT: Views Use useService() Hook

```typescript
import { FC } from 'react';
import { useService } from '@/modules/core/hooks/useService';
import { YourService } from '../services/yourService';
import { YourComponent } from '../components/YourComponent';

export const YourPage: FC = () => {
  // ✅ CORRECT: Inject service at page level
  const service = useService<YourService>('yourService');

  const handleAction = async () => {
    const result = await service.performAction();
    return result;
  };

  return (
    <div>
      <YourComponent onAction={handleAction} />
    </div>
  );
};

export default YourPage;
```

### Service Initialization Pattern for Pages

```typescript
import { useEffect, useState } from 'react';
import { useService } from '@/modules/core/hooks/useService';

export const YourPage = () => {
  const service = useService('yourService');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await service.fetchData();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [service]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* render data */}</div>;
};
```

---

## Hook Service Usage Standard

### ✅ CORRECT: Custom Hooks Wrap Service Calls

```typescript
import { useCallback, useState } from 'react';
import { useService } from '@/modules/core/hooks/useService';
import { YourService } from '../services/yourService';

interface UseYourServiceOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const useYourService = (options?: UseYourServiceOptions) => {
  const service = useService<YourService>('yourService');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await service.getData(id);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      setError(err);
      options?.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service, options]);

  return { fetchData, loading, error };
};
```

---

## Service Import Rules

### ✅ ALLOWED: Service Imports in These Contexts

1. **In module's `/services/` directory (for internal implementation)**
   ```typescript
   // ✅ Allowed in src/modules/features/module/services/
   import { baseService } from '../services/baseService';
   ```

2. **In module's `index.ts` during initialization**
   ```typescript
   // ✅ Allowed in initialize() function
   const { Service } = await import('./services/service');
   registerService('service', Service);
   ```

3. **In custom hooks that wrap services**
   ```typescript
   // ✅ Allowed in hooks - wrapping service calls
   const service = useService('serviceName');
   ```

4. **Type imports for TypeScript**
   ```typescript
   // ✅ Allowed for types only
   import type { ServiceInterface } from '../services/service';
   ```

### ❌ NOT ALLOWED: Service Imports in These Contexts

1. **Direct imports from `/src/services/` in components**
   ```typescript
   // ❌ NOT ALLOWED
   import { productService } from '@/services';
   ```

2. **Direct Supabase service imports**
   ```typescript
   // ❌ NOT ALLOWED
   import { supabaseProductService } from '@/services/api/supabase/productService';
   ```

3. **Mixing service access patterns**
   ```typescript
   // ❌ NOT ALLOWED
   import { productService } from '@/services';
   const customerService = useService('customerService');
   ```

4. **Importing services across module boundaries**
   ```typescript
   // ❌ NOT ALLOWED
   // From ProductSalesComponent.tsx
   import { salesService } from '@/modules/features/sales/services/salesService';
   ```

---

## Compliance Checklist

### For New Modules

- [ ] Module has `index.ts` with complete module definition
- [ ] All services are listed in `services` array
- [ ] `initialize()` function properly registers all services
- [ ] `cleanup()` function removes all registered services
- [ ] All components use `useService()` hook
- [ ] No direct imports from `/src/services/`
- [ ] No direct Supabase imports
- [ ] All views/pages use `useService()` hook
- [ ] Custom hooks wrap service calls with `useService()`
- [ ] TypeScript interfaces are properly exported
- [ ] Module documentation (DOC.md) includes service usage examples

### For Existing Modules (Migration)

- [ ] Audit all components for direct service imports
- [ ] Identify all services used by the module
- [ ] Update module's `initialize()` to register services
- [ ] Update all components to use `useService()` hook
- [ ] Update all pages/views to use `useService()` hook
- [ ] Update all custom hooks to use `useService()` hook
- [ ] Remove all direct `/src/services/` imports
- [ ] Remove all direct Supabase imports
- [ ] Test module initialization and service injection
- [ ] Update module documentation

---

## Migration Guide

### Step 1: Identify Module Services

List all services used by the module:

```bash
# Search for all service imports in the module
grep -r "from '@/services" ./src/modules/features/your-module/
grep -r "from '@/services/api/" ./src/modules/features/your-module/
```

### Step 2: Update Module Index

Update `/src/modules/features/{moduleName}/index.ts`:

```typescript
// BEFORE
async initialize() {
  console.log('Module initialized');
}

// AFTER
async initialize() {
  const { registerService } = await import('@/modules/core/services/ServiceContainer');
  const { Service1 } = await import('./services/service1');
  const { Service2 } = await import('./services/service2');
  
  registerService('service1', Service1);
  registerService('service2', Service2);
  
  console.log('Module initialized');
}
```

### Step 3: Update Components

Update all components in the module:

```typescript
// BEFORE
import { service1 } from '@/services';

export const MyComponent = () => {
  const data = service1.getData();
};

// AFTER
import { useService } from '@/modules/core/hooks/useService';

export const MyComponent = () => {
  const service1 = useService('service1');
  const data = service1.getData();
};
```

### Step 4: Update Views/Pages

Update all pages and views in the module:

```typescript
// BEFORE
import { service1, service2 } from '@/services';

export const MyPage = () => {
  const data1 = service1.getData();
  const data2 = service2.getData();
};

// AFTER
import { useService } from '@/modules/core/hooks/useService';

export const MyPage = () => {
  const service1 = useService('service1');
  const service2 = useService('service2');
  
  const data1 = service1.getData();
  const data2 = service2.getData();
};
```

### Step 5: Update Custom Hooks

Update all custom hooks in the module:

```typescript
// BEFORE
import { service1 } from '@/services';

export const useMyService = () => {
  return service1.getData();
};

// AFTER
import { useService } from '@/modules/core/hooks/useService';

export const useMyService = () => {
  const service1 = useService('service1');
  return service1.getData();
};
```

### Step 6: Test & Verify

```bash
# 1. Check for any remaining direct imports
grep -r "from '@/services" ./src/modules/features/your-module/

# 2. Run type checking
npm run type-check

# 3. Run linting
npm run lint

# 4. Test the module
npm run dev
```

---

## Code Review Standards

### Pull Request Checklist for Module Changes

When reviewing PRs that touch modules, verify:

✅ **Service Management**
- [ ] All services are registered in `initialize()`
- [ ] Services are listed in module's `services` array
- [ ] No direct imports from `/src/services/`
- [ ] No direct Supabase imports

✅ **Component Patterns**
- [ ] Components use `useService()` hook
- [ ] Service dependencies are typed
- [ ] Components don't directly import services

✅ **Type Safety**
- [ ] Services are properly typed with generics
- [ ] TypeScript interfaces are exported
- [ ] No `any` types for services

✅ **Documentation**
- [ ] Module DOC.md includes service usage
- [ ] Comments explain service initialization
- [ ] Examples show correct usage patterns

✅ **Testing**
- [ ] Services can be mocked for tests
- [ ] Components can be tested in isolation
- [ ] Module loads without errors

### Examples of What to Reject

```typescript
// ❌ REJECT: Direct service import in component
import { productService } from '@/services';

// ❌ REJECT: Direct Supabase import
import { supabaseProductService } from '@/services/api/supabase/productService';

// ❌ REJECT: Mixing patterns
import { productService } from '@/services';
const customerService = useService('customerService');

// ❌ REJECT: Missing service registration
async initialize() {
  console.log('Initialized');  // No services registered!
}

// ❌ REJECT: Service not in services array
export const myModule = {
  services: [],  // Missing productService!
  async initialize() {
    registerService('productService', ProductService);
  }
};
```

---

## Module Service Dependency Matrix

This matrix shows which services each module should register and use:

| Module | Services | Status |
|--------|----------|--------|
| **sales** | salesService | ✅ Compliant |
| **product-sales** | productSaleService, productService | ❌ Needs Fix |
| **customers** | customerService | ✅ Compliant |
| **contracts** | contractService, serviceContractService | ✅ Compliant |
| **service-contracts** | serviceContractService | ❌ Needs Fix |
| **tickets** | ticketService | ✅ Compliant |
| **jobworks** | jobWorksService | ✅ Compliant |
| **dashboard** | dashboardService | ✅ Compliant |
| **masters** | companyService, productService | ✅ Compliant |
| **audit-logs** | (none) | ✅ Compliant (stub OK) |
| **auth** | (none) | ✅ Compliant (stub OK) |
| **notifications** | (none) | ⚠️ Should register notificationService |
| **user-management** | (none) | ⚠️ Should register userService, rbacService |
| **super-admin** | (none) | ⚠️ Should register admin services |
| **complaints** | (none) | ✅ Compliant (stub OK) |
| **configuration** | (none) | ✅ Compliant (stub OK) |
| **pdf-templates** | (none) | ✅ Compliant (stub OK) |

---

## Enforcement & Automation

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
# Check for direct service imports in components
grep -r "from '@/services" src/modules/features/ --include="*.tsx" 
if [ $? -eq 0 ]; then
  echo "❌ Direct service imports found. Use useService() hook instead."
  exit 1
fi
```

### ESLint Rule (Recommended)

Create custom ESLint rule to prevent direct service imports:

```javascript
// In .eslintrc.js
{
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/services', '@/services/**'],
            message: 'Use useService() hook from service container instead',
            allowTypeImports: true
          }
        ]
      }
    ]
  }
}
```

### CI/CD Integration

Add to GitHub Actions or similar CI:

```yaml
- name: Check Service Pattern Compliance
  run: |
    # Check for direct service imports in components (not in services/ dir)
    violations=$(grep -r "from '@/services" src/modules/features/**/*.tsx 2>/dev/null | grep -v "/services/" | wc -l)
    if [ $violations -gt 0 ]; then
      echo "❌ Service pattern violations found"
      exit 1
    fi
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-29 | Initial ruleset created |
| 1.1 | 2025-01-29 | Added compliance checklist and enforcement rules |

---

## Questions & Support

For questions about this standardization:

1. **Module Pattern**: See `/src/modules/core/types/index.ts` for FeatureModule interface
2. **Service Container**: See `/src/modules/core/services/ServiceContainer.ts`
3. **useService Hook**: See `/src/modules/core/hooks/useService.ts`
4. **Examples**: See `/src/modules/features/sales/index.ts` for best practice implementation

**Last Updated**: 2025-01-29
**Compliance Level**: MANDATORY FOR ALL MODULES
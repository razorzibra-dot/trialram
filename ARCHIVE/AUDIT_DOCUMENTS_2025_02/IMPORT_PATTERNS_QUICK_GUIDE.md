# Import Patterns Quick Reference Guide

## The 8-Layer Architecture & Correct Import Patterns

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: VIEWS & PAGES                                      │
│ (src/App.tsx, src/modules/*/views/*, src/pages/*)          │
├─────────────────────────────────────────────────────────────┤
│ ✅ Can import from: Components, Hooks, Contexts, Utils      │
│ ✅ Can import from: @/types (types only)                    │
│ ❌ CANNOT import from: Services (directly)                  │
│ ⚠️  If need service: Use service via hook or context        │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 2: COMPONENTS                                          │
│ (src/components/*, src/modules/*/components/*)             │
├─────────────────────────────────────────────────────────────┤
│ ✅ Can import from: Sub-components, Hooks, Utils, Types     │
│ ✅ Can import from: Contexts                                │
│ ⚠️  SPECIAL: Service via Hook → import from @/services      │
│ ❌ NEVER import services directly                           │
│                                                             │
│ SERVICE USAGE PATTERN (Choose ONE):                        │
│ • Via Hook: const service = useMyService()                 │
│ • Via Context: const { service } = useContext(MyContext)   │
│ • Via Props: function Component({ service }) { ... }       │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3: HOOKS (Custom React Hooks)                         │
│ (src/hooks/*, src/modules/*/hooks/*)                       │
├─────────────────────────────────────────────────────────────┤
│ ✅ Can import from: Other hooks, Utils, Types               │
│ ✅ ONLY import service via: @/services/serviceFactory       │
│ ✅ Can use: useContext, useState, useEffect                │
│ ❌ NEVER direct service imports (@/services/xxx)           │
│ ❌ NEVER import from components                             │
│                                                             │
│ CORRECT HOOK PATTERN:                                      │
│ import { myService as factoryMyService }                   │
│   from '@/services/serviceFactory';                        │
│                                                             │
│ export const useMyService = () => {                        │
│   return useQuery({                                        │
│     queryFn: () => factoryMyService.getData()              │
│   });                                                       │
│ };                                                          │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 4: CONTEXTS (React Context Providers)                 │
│ (src/contexts/*, src/modules/*/contexts/*)                 │
├─────────────────────────────────────────────────────────────┤
│ ✅ Can import from: Utils, Types, Hooks                    │
│ ✅ ONLY import services via: @/services/serviceFactory      │
│ ✅ Can use: useContext, useState, useReducer               │
│ ❌ NEVER direct service imports                             │
│ ❌ NEVER import from components or views                    │
│                                                             │
│ CORRECT CONTEXT PATTERN:                                   │
│ import { authService as factoryAuthService }               │
│   from '@/services/serviceFactory';                        │
│                                                             │
│ export const MyContext = createContext(...);               │
│ export function MyProvider({ children }) {                 │
│   useEffect(() => {                                        │
│     factoryAuthService.getCurrentUser().then(...)          │
│   }, []);                                                   │
│   return <MyContext.Provider>...</MyContext.Provider>;     │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 5: STATE MANAGEMENT                                   │
│ (src/stores/*, zustand stores, redux slices)               │
├─────────────────────────────────────────────────────────────┤
│ ✅ Can import from: Utils, Types                            │
│ ✅ ONLY import services via: @/services/serviceFactory      │
│ ✅ Can define: Store creation, state updates               │
│ ❌ NEVER direct imports from other layers                   │
│                                                             │
│ CORRECT STATE PATTERN:                                     │
│ import { create } from 'zustand';                          │
│ import { userService as factoryUserService }               │
│   from '@/services/serviceFactory';                        │
│                                                             │
│ export const useUserStore = create((set) => ({             │
│   users: [],                                                │
│   loadUsers: () => {                                        │
│     factoryUserService.getUsers().then(data =>             │
│       set({ users: data })                                 │
│     );                                                       │
│   }                                                          │
│ }));                                                         │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 6: MODELS / TYPES                                     │
│ (src/types/*, src/modules/*/types/*)                       │
├─────────────────────────────────────────────────────────────┤
│ ✅ Can import from: Other types, Utils (type-only)          │
│ ✅ ONLY: Type definitions, interfaces, enums                │
│ ❌ NEVER import services or runtime code                    │
│ ❌ NEVER logic, business rules                              │
│                                                             │
│ CORRECT TYPES PATTERN:                                     │
│ export interface User {                                    │
│   id: string;                                               │
│   email: string;                                            │
│   role: 'admin' | 'user';                                   │
│ }                                                            │
│                                                             │
│ export type UserDTO = User & {                             │
│   createdAt: Date;                                          │
│   updatedAt: Date;                                          │
│ };                                                           │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 7: SERVICES                                            │
│ (src/services/*, src/services/api/supabase/*)              │
├─────────────────────────────────────────────────────────────┤
│ ✅ Can import from: Utils, Types ONLY                       │
│ ✅ ONLY import types: import type { MyType } from '@/types' │
│ ✅ Can use: External APIs, database calls                   │
│ ❌ NEVER import from modules (@/modules/...)               │
│ ❌ NEVER import from components, hooks, contexts           │
│ ❌ NEVER import from views or pages                         │
│                                                             │
│ CORRECT SERVICE PATTERN:                                   │
│ import type { User, UserCreateInput } from '@/types';      │
│                                                             │
│ export const userService = {                               │
│   async getUsers(): Promise<User[]> {                      │
│     // API call...                                          │
│     return data;                                            │
│   },                                                        │
│   async createUser(input: UserCreateInput): Promise<User> {│
│     // API call...                                          │
│     return data;                                            │
│   }                                                          │
│ };                                                           │
│                                                             │
│ ⚠️  FACTORY EXPORT:                                         │
│ // In serviceFactory.ts                                    │
│ export { userService } from './serviceFactory';            │
│ // NOT from direct service file                            │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 8: UTILITIES                                           │
│ (src/utils/*, src/lib/*, src/helpers/*)                    │
├─────────────────────────────────────────────────────────────┤
│ ✅ Can import from: Other utils, Types                      │
│ ✅ ONLY: Helper functions, formatting, calculations        │
│ ❌ NEVER import services, hooks, or business logic         │
│                                                             │
│ CORRECT UTILS PATTERN:                                     │
│ export function formatDate(date: Date): string {           │
│   return date.toLocaleDateString();                        │
│ }                                                            │
│                                                             │
│ export function calculateTax(amount: number): number {     │
│   return amount * 0.1;                                     │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Decision Tree

### "How should I import this?"

```
START: I need to use something in my file
  │
  ├─→ "I need a service (user data, API call, etc.)"
  │    │
  │    ├─→ "I'm in a COMPONENT"
  │    │    └─→ Use a Hook! const data = useMyHook()
  │    │        └─→ The hook imports from serviceFactory
  │    │
  │    ├─→ "I'm in a HOOK"
  │    │    └─→ import { service as factoryService }
  │    │        from '@/services/serviceFactory'
  │    │
  │    ├─→ "I'm in a CONTEXT"
  │    │    └─→ import { service as factoryService }
  │    │        from '@/services/serviceFactory'
  │    │
  │    └─→ "I'm in a SERVICE"
  │         └─→ ❌ WRONG! Services shouldn't need services
  │            └─→ Only import types: import type { MyType }
  │
  ├─→ "I need a TYPE or INTERFACE"
  │    └─→ Always: import type { MyType } from '@/types'
  │        └─→ Never from service files!
  │
  ├─→ "I need another COMPONENT"
  │    └─→ Use relative or alias: import { MyComponent } from '@/components/...'
  │
  └─→ "I need a UTIL FUNCTION"
       └─→ import { myUtil } from '@/utils'
           └─→ Utilities should be standalone
```

---

## Real-World Examples

### ❌ WRONG Way (Current Issues in Repository)

**Component importing service directly**:
```typescript
// ❌ WRONG in src/components/complaints/ComplaintFormModal.tsx
import { complaintService } from '@/services/complaintService';
import { uiNotificationService } from '@/services/uiNotificationService';

export function ComplaintFormModal() {
  const handleSubmit = (data) => {
    complaintService.create(data);
    uiNotificationService.show('Created!');
  };
  return <form>...</form>;
}
```

**Hook with direct service import**:
```typescript
// ❌ WRONG in src/hooks/useNotification.ts
import { uiNotificationService, type NotificationType } 
  from '@/services/uiNotificationService';

export function useNotification() {
  return uiNotificationService;
}
```

**Service importing from module** (Circular!):
```typescript
// ❌ WRONG in src/services/serviceContractService.ts
import { PaginatedResponse } from '@/modules/core/types';  // CIRCULAR!

export const serviceContractService = {
  // ...
};
```

---

### ✅ CORRECT Way

**Component using hook**:
```typescript
// ✅ CORRECT in src/components/complaints/ComplaintFormModal.tsx
import { useComplaintService } from '@/hooks/useComplaintService';
import { useNotification } from '@/contexts/NotificationContext';

export function ComplaintFormModal() {
  const { create } = useComplaintService();
  const { show } = useNotification();

  const handleSubmit = async (data) => {
    await create(data);
    show('Created!', 'success');
  };
  
  return <form>...</form>;
}
```

**Hook using service factory**:
```typescript
// ✅ CORRECT in src/hooks/useComplaintService.ts
import { useQuery } from '@tanstack/react-query';
import { complaintService as factoryComplaintService } 
  from '@/services/serviceFactory';
import type { Complaint } from '@/types';

export function useComplaintService() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => factoryComplaintService.getComplaints()
  });

  return { data, isLoading, error };
}
```

**Hook with correct type imports**:
```typescript
// ✅ CORRECT in src/hooks/useNotification.ts
import type { NotificationType } from '@/types';  // Type from @/types
import { notificationService as factoryNotificationService }
  from '@/services/serviceFactory';  // Service from factory

export function useNotification() {
  const notify = (msg: string, type: NotificationType) => {
    factoryNotificationService.show(msg, type);
  };

  return { notify };
}
```

**Service with only type imports**:
```typescript
// ✅ CORRECT in src/services/serviceContractService.ts
import type { 
  ServiceContractType,
  ServiceContractCreateInput,
  PaginatedResponse  // Type from @/types NOT @/modules
} from '@/types';

export const serviceContractService = {
  async getContracts(): Promise<PaginatedResponse<ServiceContractType>> {
    const response = await fetch('/api/contracts');
    return response.json();
  },

  async createContract(input: ServiceContractCreateInput): Promise<ServiceContractType> {
    const response = await fetch('/api/contracts', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    return response.json();
  }
};
```

**Context using service factory**:
```typescript
// ✅ CORRECT in src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { authService as factoryAuthService }
  from '@/services/serviceFactory';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use factory service
    factoryAuthService.getCurrentUser().then(userData => {
      setUser(userData);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

---

## Import Pattern Checklist

**When writing code in ANY file, ask**:

- [ ] Am I importing a **Type**? 
  - ✅ YES → `import type { MyType } from '@/types'`
  - ❌ NO → NOT from services!

- [ ] Am I importing a **Service**?
  - ✅ In Hook/Context → `from '@/services/serviceFactory'`
  - ✅ In Service → Don't import services!
  - ❌ In Component → Use a Hook instead!

- [ ] Am I importing a **Component**?
  - ✅ YES → `import { MyComponent } from '@/components'`
  - ❌ NO → Don't do it from wrong layer!

- [ ] Am I importing a **Utility**?
  - ✅ YES → `import { myUtil } from '@/utils'`
  - ✅ Utilities only depend on other utils and types

- [ ] Am I importing **across modules**?
  - ⚠️ CAREFUL → Only if in shared area
  - ✅ Module-local → Use relative imports within module
  - ❌ Cross-module logic → Consider moving to service!

- [ ] Am I using a **deep relative path** (../../../)?
  - ✅ Use alias: `@/xxx` instead of `../../../xxx`

- [ ] Am I importing from **@/modules**?
  - ✅ In component/hook of that module → OK
  - ✅ Shared utils/types → OK
  - ❌ In services → ❌ CIRCULAR DEPENDENCY!
  - ❌ Cross-module in services → ❌ WRONG!

---

## Service Factory Pattern Explained

### Why Use Service Factory?

```
Without Factory (WRONG):
  Mock Mode:     Component → complaintService (mock) ✓
  Supabase Mode: Component → complaintService (mock) ✗ WRONG!

With Factory (CORRECT):
  Mock Mode:     Component → serviceFactory → complaintService (mock) ✓
  Supabase Mode: Component → serviceFactory → complaintService (supabase) ✓
```

### Factory Pattern in Action

```typescript
// serviceFactory.ts decides which implementation to use
const apiMode = import.meta.env.VITE_API_MODE || 'mock';

function getComplaintService() {
  if (apiMode === 'supabase') {
    return supabaseComplaintService;  // Real API
  }
  return mockComplaintService;  // For testing
}

export const complaintService = {
  getComplaints: () => getComplaintService().getComplaints(),
  createComplaint: (data) => getComplaintService().createComplaint(data),
  // ... etc
};
```

---

## Files That Need Fixes (Priority Order)

### 🔴 CRITICAL (Fix NOW)
1. `src/services/serviceContractService.ts:28` - Remove module import
2. `src/services/supabase/serviceContractService.ts:28` - Remove module import
3. `src/services/superAdminManagementService.ts:19` - Remove module import
4. `src/services/api/supabase/superAdminManagementService.ts:19` - Remove module import

### 🟠 HIGH (Fix This Sprint)
- 18 Component files - Add service factory / use hooks
- 2 Context files - Use service factory

### 🟡 MEDIUM (Fix Next Sprint)
- 4 Hook files - Use service factory
- 2 Hook files - Fix type imports

---

## Testing Your Imports

```bash
# Check TypeScript (catches import errors)
npx tsc --noEmit

# Check with ESLint
npm run lint

# Test with mock mode
VITE_API_MODE=mock npm run dev

# Test with supabase mode  
VITE_API_MODE=supabase npm run dev

# Build
npm run build
```

---

**Remember**: Every layer has a specific job. Keep imports clean and consistent! 🚀
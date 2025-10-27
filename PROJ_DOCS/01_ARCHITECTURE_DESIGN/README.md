---
title: Architecture Documentation Index
description: Comprehensive guide to PDS-CRM application architecture patterns and systems
category: Architecture
lastUpdated: 2025-01-20
status: Active
---

# Architecture Documentation Index

This directory contains comprehensive documentation of the PDS-CRM application's core architectural patterns, systems, and cross-cutting concerns.

## 📋 Core Architecture Documents

### 1. **[Service Factory Pattern](./SERVICE_FACTORY.md)**
**Most Critical** - The routing layer that determines whether to use mock or Supabase implementations

- ✅ [SERVICE_FACTORY.md](./SERVICE_FACTORY.md) - 650 lines
- **Covers**: Multi-backend routing, factory implementation, adding new services
- **Why This Matters**: Prevents "Unauthorized" errors, ensures proper multi-tenant context
- **Key Concept**: `VITE_API_MODE` environment variable controls routing at runtime
- **Implements**: Mock services for development, Supabase for production

### 2. **[RBAC & Permissions](./RBAC_AND_PERMISSIONS.md)**
**Most Complex** - Role-based access control with Row-Level Security integration

- ✅ [RBAC_AND_PERMISSIONS.md](./RBAC_AND_PERMISSIONS.md) - 680 lines
- **Covers**: Permission matrices, role templates, multi-tenant RLS, audit logging
- **Why This Matters**: Controls data access, security compliance, audit trails
- **Key Concept**: Permissions table has 'category' field (REQUIRED for schema)
- **Implements**: Role templates, permission validation, audit logging

### 3. **[Session Management](./SESSION_MANAGEMENT.md)**
**Most Important for Users** - Session lifecycle, JWT tokens, multi-tenant context

- ✅ [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md) - 620 lines
- **Covers**: Session lifecycle, JWT handling, tenant context, cleanup
- **Why This Matters**: Users stay logged in, tenant data properly isolated
- **Key Concept**: Session state stored in Zustand, JWT in localStorage
- **Implements**: Auto-refresh tokens, session persistence, logout cleanup

### 4. **[React Query](./REACT_QUERY.md)**
**Handles Server State** - Data fetching, caching, synchronization with backend

- ✅ [REACT_QUERY.md](./REACT_QUERY.md) - 590 lines
- **Covers**: Query setup, mutations, background sync, cache invalidation
- **Why This Matters**: Automatic data synchronization, optimistic updates
- **Key Concept**: Server state separate from client state
- **Implements**: useQuery, useMutation, useInfiniteQuery patterns

### 5. **[Authentication System](./AUTHENTICATION.md)**
**Complex Multi-Layer** - JWT, Supabase Auth, MFA support, session validation

- ✅ [AUTHENTICATION.md](./AUTHENTICATION.md) - 650 lines
- **Covers**: Login flow, JWT validation, MFA, password reset, session lifecycle
- **Why This Matters**: Secure user identity verification, account protection
- **Key Concept**: JWT tokens refresh before expiration
- **Implements**: Email/password + MFA, session persistence, token refresh

### 6. **[State Management](./STATE_MANAGEMENT.md)**
**Application Brain** - Zustand for client state, React Query for server state, Context API

- ✅ [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) - 620 lines
- **Covers**: Zustand store structure, context API usage, state patterns
- **Why This Matters**: Consistent application state, predictable data flow
- **Key Concept**: Separation of client and server state
- **Implements**: Global stores, module-specific stores, context providers

---

## 🎯 Quick Navigation Guide

### I need to understand...

**How does data flow from API to component?**
→ Read: [React Query](./REACT_QUERY.md) + [State Management](./STATE_MANAGEMENT.md)

**Why am I getting "Unauthorized" errors?**
→ Read: [Service Factory Pattern](./SERVICE_FACTORY.md) + [Authentication System](./AUTHENTICATION.md)

**How do permissions and roles work?**
→ Read: [RBAC & Permissions](./RBAC_AND_PERMISSIONS.md)

**What happens when a user logs out?**
→ Read: [Session Management](./SESSION_MANAGEMENT.md) + [Authentication System](./AUTHENTICATION.md)

**How should I create a new data-fetching hook?**
→ Read: [React Query](./REACT_QUERY.md) + [State Management](./STATE_MANAGEMENT.md)

**How do I add a new backend service?**
→ Read: [Service Factory Pattern](./SERVICE_FACTORY.md)

**How is user data isolated in multi-tenant?**
→ Read: [Session Management](./SESSION_MANAGEMENT.md) + [RBAC & Permissions](./RBAC_AND_PERMISSIONS.md)

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Components                              │
│                 (Customers, Sales, Tickets, etc.)                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴─────────────┐
                │                          │
         ┌──────▼──────┐         ┌─────────▼────────┐
         │ React Query │         │ Zustand Stores  │
         │(Server State)        │ (Client State)   │
         └──────┬──────┘         └─────────┬────────┘
                │                          │
                └────────────┬─────────────┘
                             │
         ┌───────────────────▼──────────────────┐
         │   Service Factory Pattern            │
         │  (routes based on VITE_API_MODE)    │
         └──────────┬──────────────┬────────────┘
                    │              │
          ┌─────────▼────┐  ┌──────▼────────┐
          │ Mock Service │  │ Supabase API  │
          │(Development) │  │(Production)   │
          └──────────────┘  └───────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
         ┌──────▼──────┐         ┌────────▼───────┐
         │ PostgreSQL  │         │  Supabase RLS  │
         │ (Database)  │         │ (Row Security) │
         └─────────────┘         └────────────────┘
```

### Data Flow Example

```
User Action
    │
    ▼
React Component calls useCustomers()
    │
    ▼
React Query (useQuery)
    │
    ▼
Service Factory determines VITE_API_MODE
    │
    ├─→ mock → Mock Service → In-memory data
    │
    └─→ supabase → Supabase API → PostgreSQL + RLS
    │
    ▼
Response cached in React Query
    │
    ▼
Zustand store updated (if needed)
    │
    ▼
Component re-renders with new data
```

---

## 🔄 Interaction Between Systems

### Session Manager ↔ Authentication
- Session manager maintains user identity
- Authentication validates JWT tokens
- Both work together for session persistence

### Service Factory ↔ Session Manager
- Factory reads user tenant from session
- Passes tenant context to API calls
- Ensures multi-tenant data isolation

### React Query ↔ Zustand
- React Query = server state (from backend)
- Zustand = client state (UI, filters, preferences)
- Both sync through component props

### RBAC ↔ Service Factory
- RBAC defines what user can access
- Service Factory enforces RBAC in API calls
- RLS in Supabase enforces at database level

---

## ✅ Implementation Checklist for New Features

When implementing a new feature, ensure:

**Step 1: Data Fetching**
- [ ] Use React Query for server state (see [REACT_QUERY.md](./REACT_QUERY.md))
- [ ] Create appropriate query keys with tenant context
- [ ] Handle loading and error states

**Step 2: Data Mutation**
- [ ] Use React Query mutations for create/update/delete
- [ ] Implement optimistic updates when appropriate
- [ ] Invalidate related queries after mutation

**Step 3: Client State**
- [ ] Use Zustand only for UI state (filters, modals, etc.)
- [ ] Don't duplicate server state in Zustand
- [ ] See [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md)

**Step 4: Permissions**
- [ ] Define required permissions in RBAC documentation
- [ ] Check user permissions before showing UI
- [ ] Let backend RLS enforce final security
- [ ] See [RBAC_AND_PERMISSIONS.md](./RBAC_AND_PERMISSIONS.md)

**Step 5: Service Implementation**
- [ ] Create mock service (development mode)
- [ ] Create Supabase service (production mode)
- [ ] Add both to service factory
- [ ] See [SERVICE_FACTORY.md](./SERVICE_FACTORY.md)

**Step 6: Authentication Check**
- [ ] Verify JWT tokens are valid
- [ ] Ensure session is not expired
- [ ] Handle 401 Unauthorized gracefully
- [ ] See [AUTHENTICATION.md](./AUTHENTICATION.md)

---

## 🚨 Critical Decisions & Patterns

### 1. **Always Use Service Factory**
❌ **WRONG:**
```typescript
import { supabaseProductService } from '@/services/api/supabase/productService';
const products = await supabaseProductService.getProducts();
```

✅ **RIGHT:**
```typescript
import { productService } from '@/services/serviceFactory';
const products = await productService.getProducts();
```

**Why**: Factory pattern ensures you get the correct implementation based on environment.

### 2. **React Query for All Server State**
❌ **WRONG:**
```typescript
const [products, setProducts] = useState([]);
useEffect(() => {
  productService.getProducts().then(setProducts);
}, []);
```

✅ **RIGHT:**
```typescript
const { data: products } = useQuery({
  queryKey: ['products', tenantId],
  queryFn: () => productService.getProducts()
});
```

**Why**: Automatic caching, background sync, retry logic.

### 3. **Zustand Only for UI State**
❌ **WRONG:**
```typescript
// Don't cache server data in Zustand
const store = create((set) => ({
  products: [],
  fetchProducts: () => api.getProducts().then(p => set({ products: p }))
}));
```

✅ **RIGHT:**
```typescript
// Cache UI state only
const store = create((set) => ({
  filterOpen: false,
  setFilterOpen: (open) => set({ filterOpen: open })
}));
```

**Why**: Zustand state gets stale; React Query handles server state better.

### 4. **Tenant Context in Every API Call**
Every API call must include `tenantId`:
```typescript
queryFn: () => productService.getProducts(tenantId)
```

**Why**: Multi-tenant data isolation, RLS enforcement, audit logging.

---

## 📚 Related Documentation

- **Module Documentation**: See `/src/modules/features/{module}/DOC.md`
- **Repository Info**: See `.zencoder/rules/repo.md`
- **Documentation Rules**: See `.zencoder/rules/documentation-sync.md`
- **Quick Start**: See `START_HERE_DOCUMENTATION.md`

---

## 📝 Version Information

| Component | Version | Last Updated |
|-----------|---------|--------------|
| Architecture Docs | 1.0 | 2025-01-20 |
| React Query Pattern | 5.90.2 | 2025-01-20 |
| Zustand Pattern | 5.0.8 | 2025-01-20 |
| Authentication | JWT + MFA | 2025-01-20 |
| RBAC System | Multi-tenant RLS | 2025-01-20 |
| Service Factory | Dual-backend | 2025-01-20 |

---

## 🔗 Quick Links

- [Service Factory Pattern](./SERVICE_FACTORY.md) - Backend routing
- [RBAC & Permissions](./RBAC_AND_PERMISSIONS.md) - Access control
- [Session Management](./SESSION_MANAGEMENT.md) - User sessions
- [React Query](./REACT_QUERY.md) - Server state
- [Authentication System](./AUTHENTICATION.md) - Identity verification
- [State Management](./STATE_MANAGEMENT.md) - Client state

---

**Last Updated**: 2025-01-20  
**Status**: ✅ Active and Maintained  
**Maintainer**: Architecture Team  
**Related**: All 16 Feature Modules
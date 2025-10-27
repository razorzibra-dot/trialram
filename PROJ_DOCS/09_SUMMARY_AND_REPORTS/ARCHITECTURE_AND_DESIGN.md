---
title: Architecture and Design Decisions
description: System architecture, design patterns, and technical decisions for the PDS CRM application
lastUpdated: 2025-01-27
category: architecture
---

# 🏛️ Architecture and Design Decisions

**Status**: ✅ **ARCHITECTURE VERIFIED & PRODUCTION VALIDATED**  
**Last Updated**: 2025-01-27  
**Design Pattern**: Modular with Service Factory Pattern  
**Backend**: Multi-Backend (Mock, Real, Supabase)

---

## 🎯 Architectural Overview

The PDS CRM application follows a modern, scalable architecture designed for multi-tenant SaaS operations with support for multiple backend implementations.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Module-Based Component Architecture      │  │
│  │  ┌──────────┬──────────┬──────────┬──────────┐  │  │
│  │  │ Customer │  Sales   │Contracts │Dashboard │  │  │
│  │  │  Module  │ Module   │ Module   │ Module   │  │  │
│  │  └──────────┴──────────┴──────────┴──────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │     Context API (Auth, Tenant, Notifications)   │  │
│  │  ┌──────────────────────────────────────────┐   │  │
│  │  │    Global State Management (Zustand)     │   │  │
│  │  └──────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │  Service Factory Pattern              │
        │  (serviceFactory.ts)                  │
        │  • Reads VITE_API_MODE env var       │
        │  • Routes to correct service impl     │
        │  • Supports mock/supabase switching   │
        └──────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │     Service Layer (25+ services)     │
        ├──────────────────────────────────────┤
        │ Mock Services  │ Supabase Services   │
        │ (Development)  │ (Production)        │
        └──────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │          Backend Options             │
        ├──────────────────────────────────────┤
        │ • Mock Data (Development)            │
        │ • .NET Core Backend (Production)     │
        │ • Supabase PostgreSQL (Real-time)    │
        └──────────────────────────────────────┘
```

---

## 🏗️ Core Architecture Patterns

### 1. Service Factory Pattern ✅

**Purpose**: Enable seamless switching between different backend implementations

**Implementation**:
```typescript
// Location: src/services/serviceFactory.ts
const apiMode = import.meta.env.VITE_API_MODE || 'mock';

export function getCustomerService() {
  return apiMode === 'supabase' 
    ? supabaseCustomerService 
    : mockCustomerService;
}

export const customerService = {
  getCustomers: () => getCustomerService().getCustomers(),
  createCustomer: (data) => getCustomerService().createCustomer(data),
  // ... all methods delegated
};
```

**Benefits**:
- ✅ Develop with mock data (fast, no setup required)
- ✅ Test with real Supabase backend
- ✅ Switch via `VITE_API_MODE` environment variable
- ✅ No code changes required for mode switching

**Services Implementing Pattern**:
- ✅ customerService
- ✅ salesService
- ✅ contractService
- ✅ jobWorkService
- ✅ productService
- ✅ productSaleService
- ✅ notificationService
- ✅ ticketService
- ✅ userService
- ✅ rbacService
- ✅ dashboardService
- ✅ And 13+ more services

---

### 2. Modular Architecture ✅

**Structure**: Feature-based modules with self-contained functionality

```
src/modules/
├── core/                    # Core/shared functionality
│   ├── services/           # Core services
│   ├── hooks/              # Core hooks
│   ├── types/              # Core types
│   └── contexts/           # Core contexts
├── features/               # Feature modules (16 modules)
│   ├── customers/          # Customer module
│   │   ├── components/     # Module-specific components
│   │   ├── views/          # Page components
│   │   ├── hooks/          # Module-specific hooks
│   │   ├── services/       # Module service adapters
│   │   ├── store/          # Zustand store
│   │   ├── types/          # Module types
│   │   ├── DOC.md          # Module documentation
│   │   └── routes.tsx      # Module routing
│   ├── sales/              # Sales module
│   ├── contracts/          # Contracts module
│   └── ... (13 more modules)
├── routing/                # Routing configuration
├── shared/                 # Shared components & utilities
└── App.tsx                 # Main app component
```

**Benefits**:
- ✅ Clear separation of concerns
- ✅ Independent module development
- ✅ Easier testing and maintenance
- ✅ Scalability for team growth

---

### 3. Multi-Tenant Architecture ✅

**Implementation**: Row-Level Security (RLS) with Supabase

```typescript
// Tenant Context Management
const multiTenantService = {
  // Initialize context on login
  initializeTenantContext(userId) {
    // Fetch user's tenant and set as current
  },
  
  // Get current tenant ID (used in all queries)
  getCurrentTenantId() {
    return this.currentTenant?.id;
  },
  
  // Switch tenant context
  setCurrentTenant(tenantId) {
    this.currentTenant = this.tenants.find(t => t.id === tenantId);
  }
};
```

**Database Security**:
- ✅ RLS policies on all tables
- ✅ Tenant-based row filtering
- ✅ User-role based access control
- ✅ Audit logging for compliance

**Data Isolation**:
- ✅ Complete tenant data isolation
- ✅ No cross-tenant data leaks possible
- ✅ Tenant switching within same user
- ✅ Multi-organization support

---

### 4. State Management Architecture ✅

**Layers**:

1. **Global State (Context API)**
   - AuthContext - Authentication state
   - TenantContext - Multi-tenant context
   - NotificationContext - Global notifications

2. **Feature State (Zustand)**
   - Module-specific stores
   - Temporary UI state
   - User preferences

3. **Server State (React Query)**
   - Data fetching and caching
   - Background synchronization
   - Real-time updates

**Benefits**:
- ✅ Clear separation of concerns
- ✅ Optimal re-render performance
- ✅ Easy debugging with devtools
- ✅ Predictable state updates

---

### 5. Data Fetching Architecture ✅

**Pattern**: React Query with Service Factory

```typescript
// Module hook using React Query
const useCustomers = () => {
  const queryClient = useQueryClient();
  const customersService = useService<CustomerService>('customerService');
  
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => customersService.getCustomers(),
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
  });
};
```

**Benefits**:
- ✅ Automatic caching
- ✅ Background refetching
- ✅ Optimistic updates
- ✅ Pagination support
- ✅ Infinite queries

---

## 🗄️ Database Architecture

### Schema Overview

```
├── Tenant Management
│   ├── tenants
│   ├── users
│   ├── user_roles
│   └── sessions
│
├── CRM Core
│   ├── customers
│   ├── customer_tags
│   ├── sales
│   ├── sale_items
│   ├── contracts
│   ├── tickets
│   └── complaints
│
├── Master Data
│   ├── companies
│   ├── products
│   ├── product_categories
│   ├── job_works
│   ├── job_work_items
│   └── configurations
│
├── RBAC
│   ├── roles
│   ├── permissions
│   ├── role_templates
│   └── audit_logs
│
└── System
    ├── notifications
    ├── notification_preferences
    └── system_logs
```

### Key Design Decisions

**Multi-Tenancy**:
- ✅ tenant_id on all tables
- ✅ RLS policies enforce isolation
- ✅ Shared infrastructure, isolated data

**Audit & Compliance**:
- ✅ audit_logs table tracks all changes
- ✅ Timestamp on all records
- ✅ User tracking on modifications
- ✅ Soft deletes where needed

**Performance**:
- ✅ Proper indexing on all key fields
- ✅ Foreign key relationships
- ✅ Optimized query patterns
- ✅ Connection pooling

---

## 🔐 Security Architecture

### Authentication Flow

```
User Login
    ↓
Supabase GoTrue Client
    ↓
JWT Token Generation
    ↓
AuthContext Update
    ↓
Tenant Context Initialization
    ↓
Session Establishment
    ↓
Automatic Token Refresh
```

### Authorization

**Role-Based Access Control (RBAC)**:
- ✅ Permission-based navigation
- ✅ Component-level access control
- ✅ API-level permission checks
- ✅ Database RLS policies

**Session Management**:
- ✅ JWT token validation
- ✅ Automatic token refresh
- ✅ Session timeout handling
- ✅ Multi-device support

---

## 🎨 UI Architecture

### Design System

**Framework Stack**:
- ✅ React 18.2.0 - UI framework
- ✅ Ant Design 5.27.5 - Component library
- ✅ Tailwind CSS 3.3.0 - Utility-first styling
- ✅ React Router 6.8.1 - Client-side routing

**Component Hierarchy**:
```
App
├── Layout Components
│   ├── Header/Navigation
│   ├── Sidebar
│   └── Footer
├── Page Components
│   ├── List Pages
│   ├── Detail Pages
│   ├── Create/Edit Pages
│   └── Dashboard Pages
├── Feature Components
│   ├── Forms
│   ├── Tables/Grids
│   ├── Modals/Drawers
│   └── Cards
└── Shared Components
    ├── Buttons
    ├── Inputs
    ├── Icons
    └── Layouts
```

**Accessibility**:
- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast standards
- ✅ Form labels and descriptions

---

## 🚀 Performance Architecture

### Optimization Strategies

1. **Code Splitting**
   - ✅ Module-based lazy loading
   - ✅ Route-based code splitting
   - ✅ Component dynamic imports

2. **Caching**
   - ✅ React Query cache management
   - ✅ Browser cache headers
   - ✅ Service worker for offline

3. **Data Optimization**
   - ✅ Pagination for large datasets
   - ✅ Lazy loading of images
   - ✅ Query optimization in database
   - ✅ Index optimization

4. **Bundle Optimization**
   - ✅ Tree shaking of unused code
   - ✅ Minification and compression
   - ✅ CDN delivery

---

## 📊 Deployment Architecture

### Environment Configuration

**Development**:
```
VITE_API_MODE=mock
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=local-dev-key
```

**Production**:
```
VITE_API_MODE=supabase
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=production-key
```

### Deployment Pipeline

```
Local Development
    ↓
npm run dev (Hot reload with mock data)
    ↓
npm run build (Production build)
    ↓
npm run preview (Verify build)
    ↓
Docker Container (Optional)
    ↓
Cloud Deployment (Vercel, AWS, etc.)
```

---

## 🔗 Integration Points

### Backend Integration

**Supabase**:
- ✅ PostgreSQL database
- ✅ Real-time subscriptions
- ✅ Authentication (GoTrue)
- ✅ File storage

**Third-Party Services**:
- ✅ Email service (SendGrid, Mailgun)
- ✅ SMS service (Twilio)
- ✅ File storage (AWS S3)
- ✅ Analytics (Mixpanel, Segment)

---

## 🎓 Design Principles

### Core Principles

1. **Modularity**
   - Independent, self-contained modules
   - Clear interfaces between modules
   - Low coupling, high cohesion

2. **Scalability**
   - Horizontal scaling support
   - Multi-tenant architecture
   - Efficient resource usage

3. **Maintainability**
   - Clear code organization
   - Comprehensive documentation
   - Consistent conventions

4. **Security**
   - Defense in depth
   - Principle of least privilege
   - Audit trail for all actions

5. **Performance**
   - Fast initial load
   - Efficient caching
   - Optimized queries

6. **User Experience**
   - Responsive design
   - Intuitive navigation
   - Clear feedback

---

## 📈 Architecture Evolution

### Design Decisions Made

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Service Factory Pattern | Enable multi-backend | ✅ Seamless mode switching |
| Modular Architecture | Team scalability | ✅ 16 modules implemented independently |
| Multi-Tenant RLS | Data security | ✅ Complete data isolation |
| React Query | Data state | ✅ Optimal performance with caching |
| Zustand for Local State | Simplicity | ✅ Easy state management |
| Supabase Backend | Fast MVP | ✅ Rapid development |
| Ant Design + Tailwind | UI consistency | ✅ Professional appearance |

---

## 🔗 Related Documentation

- **PHASE_COMPLETION_REPORTS.md** - Implementation timeline
- **IMPLEMENTATION_STATUS.md** - Current component status
- **INTEGRATION_AND_AUDITS.md** - Integration verification
- **TROUBLESHOOTING_AND_FIXES.md** - Known issues

---

## 📝 Architecture Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| Phase 1 | Service Factory | Multi-backend support needed | Enables mode switching |
| Phase 1 | Modular Architecture | Team scalability | Clear module boundaries |
| Phase 2 | Supabase + RLS | Security & real-time | Complete data isolation |
| Phase 3 | React Query | Cache management | Optimal performance |
| Phase 5 | Tenant Context Guards | Race condition fix | Stable initialization |

---

**Status**: VERIFIED & PRODUCTION VALIDATED  
**Last Review**: 2025-01-27  
**Next Review**: On architectural changes or major refactoring
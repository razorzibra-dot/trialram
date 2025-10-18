# Phase 4: Service Router Integration & Unified Multi-Backend Support

**Status**: ✅ COMPLETE

**Date**: 2025-01-24

**Implementation**: Unified service layer with seamless switching between Mock, Real .NET, and Supabase backends

---

## 📊 Overview

Phase 4 completes the service layer integration by creating a unified, intelligent router that seamlessly switches between THREE backend systems without code changes. Combined with Phase 3 Supabase services, this enables developers to switch backends by simply changing an environment variable.

### Key Achievement
**Before Phase 4**: Services were siloed (mock in one folder, real in another, Supabase isolated)
**After Phase 4**: Unified routing with automatic backend selection and component-ready React hooks

---

## 🎯 What Was Implemented

### 1. **Enhanced API Configuration** (`src/config/apiConfig.ts`)

#### New Functions
```typescript
// Get current backend mode
getApiMode(): ApiMode                    // Returns: 'mock' | 'real' | 'supabase'

// Mode detection
isUsingMockApi(): boolean                // Is mock mode
isUsingSupabaseApi(): boolean            // Is Supabase mode
isUsingRealApi(): boolean                // Is real API mode

// Per-service backend override
getServiceBackend(serviceType): ApiMode  // Check service-specific backend
```

#### Features
- ✅ Priority: `VITE_API_MODE` > `VITE_USE_MOCK_API` (backward compatible)
- ✅ Per-service overrides (e.g., `VITE_CUSTOMER_BACKEND=supabase`)
- ✅ Environment detection with console logging
- ✅ Hot-reload support

---

### 2. **Intelligent Service Factory** (`src/services/api/apiServiceFactory.ts`)

#### Multi-Backend Routing
```
User Code
    ↓
getCustomerService()
    ↓
Service Factory Logic
    ├─ Check VITE_CUSTOMER_BACKEND (override)
    ├─ Fall back to VITE_API_MODE (global)
    └─ Return appropriate service instance
        ├─ mockCustomerService (mock)
        ├─ RealCustomerService (real .NET)
        └─ supabaseCustomerService (Supabase)
```

#### Updated Service Methods
Each service getter now intelligently routes:
- `getAuthService()` - Auth service routing
- `getCustomerService()` - Customer service routing
- `getSalesService()` - Sales service routing
- `getTicketService()` - Ticket service routing
- `getContractService()` - Contract service routing
- `getNotificationService()` - Notification service routing
- `getFileService()` - File service routing (real/mock)
- `getAuditService()` - Audit service routing (real/mock)

#### New Methods
```typescript
switchApiMode(newMode: ApiMode): void    // Manual mode switching
getApiMode(): ApiMode                     // Get current mode
```

---

### 3. **Phase 4 Custom React Hooks** (`src/hooks/useSupabase*.ts`)

Four production-ready hooks for component integration:

#### `useSupabaseCustomers.ts`
```typescript
const {
  customers,           // Customer array
  loading,             // Loading state
  error,               // Error message
  refetch,             // Manual refresh
  create,              // Create customer
  update,              // Update customer
  delete,              // Delete customer
  search               // Search customers
} = useSupabaseCustomers();
```

#### `useSupabaseSales.ts`
```typescript
const {
  sales,               // Sales array
  loading, error,      // State management
  refetch,             // Refresh
  create, update, delete, // CRUD
  getByStage,          // Filter by stage
  getByCustomer        // Filter by customer
} = useSupabaseSales();
```

#### `useSupabaseTickets.ts`
```typescript
const {
  tickets,
  loading, error,
  refetch,
  create, update, delete,
  getByStatus,         // Filter by status
  getByPriority,       // Filter by priority
  getByAssignee,       // Filter by assignee
  getSLABreached       // Get SLA violations
} = useSupabaseTickets();
```

#### `useSupabaseContracts.ts`
```typescript
const {
  contracts,
  loading, error,
  refetch,
  create, update, delete,
  getByStatus,         // Filter by status
  getByType,           // Filter by type
  getActive,           // Get active contracts
  getExpiringSoon      // Get contracts expiring soon
} = useSupabaseContracts();
```

#### Usage Example
```typescript
import { useSupabaseCustomers, useSupabaseSales } from '@/hooks';

function Dashboard() {
  const { customers, loading } = useSupabaseCustomers();
  const { sales, loading: salesLoading } = useSupabaseSales();

  if (loading) return <Spinner />;

  return (
    <div>
      <CustomerList customers={customers} />
      <SalesPipeline sales={sales} />
    </div>
  );
}
```

---

### 4. **Updated Environment Files**

#### `.env.example` - Comprehensive Documentation
```bash
# OPTION 1: Global mode (all services use same backend)
VITE_API_MODE=supabase

# OPTION 2: Per-service override (mix backends)
VITE_API_MODE=real
VITE_CUSTOMER_BACKEND=supabase  # Use Supabase for customers
VITE_SALES_BACKEND=supabase     # Use Supabase for sales
VITE_TICKET_BACKEND=real        # Use Real API for tickets
```

#### `.env` Current Settings
```bash
VITE_API_MODE=supabase           # Using Supabase for all services
VITE_USE_MOCK_API=false          # Backward compatibility
```

---

### 5. **Enhanced Service Index** (`src/services/index.ts`)

Added comprehensive Phase 4 documentation explaining:
- Architecture with three backend systems
- How switching works
- Custom hook usage
- Service structure and relationships

---

## 🔄 Backend Switching Logic

### Priority Order
1. **Per-service override** → `VITE_CUSTOMER_BACKEND=supabase`
2. **Global mode** → `VITE_API_MODE=supabase`
3. **Legacy fallback** → `VITE_USE_MOCK_API=true/false`

### Example Scenarios

**Scenario 1: Development with Mock Data**
```bash
# .env
VITE_API_MODE=mock
# All services use: mockCustomerService, mockSalesService, etc.
```

**Scenario 2: Mixed Backend (Supabase + Real API)**
```bash
# .env
VITE_API_MODE=real              # Default to real API
VITE_CUSTOMER_BACKEND=supabase  # Override: customers from Supabase
VITE_SALES_BACKEND=supabase     # Override: sales from Supabase
# Results: Customers & Sales from Supabase, others from Real API
```

**Scenario 3: Production with Supabase**
```bash
# .env
VITE_API_MODE=supabase          # All services use Supabase
# All services use: supabaseCustomerService, supabasesSalesService, etc.
```

---

## 📁 Files Created

### New Hooks
```
src/hooks/
├── useSupabaseCustomers.ts    (400 lines)
├── useSupabaseSales.ts        (350 lines)
├── useSupabaseTickets.ts      (380 lines)
├── useSupabaseContracts.ts    (390 lines)
└── index.ts                   (Export all)
```

### Documentation
```
PHASE_4_SERVICE_ROUTER_INTEGRATION.md  (This file)
```

---

## 📝 Files Modified

### Core Infrastructure
1. **src/config/apiConfig.ts**
   - Added `ApiMode` type
   - Added `getApiMode()` function
   - Added `isUsingSupabaseApi()` function
   - Added `isUsingRealApi()` function
   - Added `getServiceBackend()` function
   - Enhanced console logging

2. **src/services/api/apiServiceFactory.ts**
   - Imported Phase 3 Supabase services
   - Updated constructor to use `currentMode` instead of `useMockApi`
   - Converted all service getters to use multi-backend routing
   - Added `switchApiMode()` with new logic
   - Added `getApiMode()` method
   - Updated environment listener for hot-reload

3. **src/services/index.ts**
   - Comprehensive Phase 4 documentation
   - Architecture overview
   - Backend switching guide
   - Phase 4 features list

4. **.env.example**
   - Added Phase 4 section with full documentation
   - Added per-service backend override examples
   - Improved commenting and organization

5. **.env** (existing)
   - `VITE_API_MODE=supabase` set by default
   - `VITE_USE_MOCK_API=false` for backward compatibility

---

## ✨ Key Features

### 1. **Zero-Code Backend Switching**
```bash
# Change backend without touching code - just edit .env
VITE_API_MODE=mock      # Instant switch to mock data
VITE_API_MODE=real      # Instant switch to .NET backend
VITE_API_MODE=supabase  # Instant switch to Supabase
```

### 2. **Per-Service Granular Control**
```bash
# Use different backends for different services
VITE_CUSTOMER_BACKEND=supabase
VITE_SALES_BACKEND=real
VITE_TICKET_BACKEND=mock
```

### 3. **Backward Compatibility**
```bash
# Old projects still work - legacy env vars supported
VITE_USE_MOCK_API=true
# But VITE_API_MODE takes precedence if set
```

### 4. **React Component Integration**
```typescript
// Phase 4 hooks make it easy for components
import { useSupabaseCustomers } from '@/hooks';

function CustomerList() {
  const { customers, loading, error } = useSupabaseCustomers();
  // Ready to render!
}
```

### 5. **Real-time Data Sync**
```typescript
// Hooks automatically use Supabase subscriptions when available
const { customers } = useSupabaseCustomers();
// Updates in real-time when data changes
```

### 6. **Type Safety**
```typescript
export type ApiMode = 'mock' | 'real' | 'supabase';

function getApiMode(): ApiMode { ... }
// Full TypeScript support with IntelliSense
```

---

## 🚀 How Components Use It

### Before Phase 4 (Manual service handling)
```typescript
import { customerService } from '@/services';

export function CustomerList() {
  const [customers, setCustomers] = useState([]);
  
  useEffect(() => {
    const loadCustomers = async () => {
      const data = await customerService.getCustomers();
      setCustomers(data);
    };
    loadCustomers();
  }, []);
  
  return <div>{/* ... */}</div>;
}
```

### After Phase 4 (Clean hook-based)
```typescript
import { useSupabaseCustomers } from '@/hooks';

export function CustomerList() {
  const { customers, loading, error } = useSupabaseCustomers();
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  
  return <div>{/* ... */}</div>;
}
```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ React Components                                             │
│ ├─ CustomerList                                             │
│ ├─ SalesPipeline                                            │
│ └─ TicketQueue                                              │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │ Phase 4 Custom Hooks    │
        │ ├─ useSupabaseCustomers │
        │ ├─ useSupabaseSales     │
        │ ├─ useSupabaseTickets   │
        │ └─ useSupabaseContracts │
        └────────────┬────────────┘
                     │
        ┌────────────┴────────────────────┐
        │ Service Factory Router          │
        │ (Multi-Backend Routing Logic)   │
        └─┬──────────┬────────────┬───────┘
          │          │            │
    ┌─────▼─┐  ┌────▼────┐  ┌───▼──┐
    │ Mock  │  │ Real API│  │SUPA- │
    │Services│ │Services │  │BASE  │
    │        │  │(.NET)   │  │ ✅   │
    └────────┘  └─────────┘  └──────┘
```

---

## 🔍 Environment Configuration Guide

### Quick Reference

| Setting | Value | Use Case |
|---------|-------|----------|
| `VITE_API_MODE` | `mock` | Development with test data |
| `VITE_API_MODE` | `real` | .NET Core backend |
| `VITE_API_MODE` | `supabase` | PostgreSQL with real-time (Phase 3) |
| `VITE_CUSTOMER_BACKEND` | `supabase` | Override specific service |
| `VITE_USE_MOCK_API` | `true`/`false` | Legacy (still works) |

### Example Configurations

**Development (Mock Data)**
```bash
VITE_API_MODE=mock
VITE_SUPABASE_ENABLE_REALTIME=false
```

**Staging (Real API)**
```bash
VITE_API_MODE=real
VITE_API_BASE_URL=https://api-staging.example.com/api/v1
```

**Production (Supabase)**
```bash
VITE_API_MODE=supabase
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=<production-key>
```

**Mixed (Real + Supabase for specific services)**
```bash
VITE_API_MODE=real
VITE_CUSTOMER_BACKEND=supabase
VITE_SALES_BACKEND=supabase
VITE_TICKET_BACKEND=supabase
```

---

## 📋 Migration Guide for Existing Code

### Existing Code (Still Works ✅)
```typescript
import { customerService } from '@/services';

async function loadCustomers() {
  const customers = await customerService.getCustomers();
  // Automatically uses backend set in VITE_API_MODE
}
```

### New Code (Recommended ✅)
```typescript
import { useSupabaseCustomers } from '@/hooks';

function MyComponent() {
  const { customers, loading, error, refetch } = useSupabaseCustomers();
  // More React-ish, cleaner, better for UI
}
```

### Both Work Together
Existing services and new hooks can coexist. No breaking changes!

---

## 🧪 Testing the Integration

### Test 1: Verify Mock Mode
```bash
# .env
VITE_API_MODE=mock

# Should see: 🎭 MOCK/STATIC DATA in console
npm run dev
```

### Test 2: Verify Supabase Mode
```bash
# .env
VITE_API_MODE=supabase

# Should see: 🗄️ SUPABASE POSTGRESQL in console
npm run dev
```

### Test 3: Verify Real API Mode
```bash
# .env
VITE_API_MODE=real

# Should see: 🔌 REAL .NET CORE BACKEND in console
npm run dev
```

### Test 4: Verify Per-Service Override
```bash
# .env
VITE_API_MODE=real
VITE_CUSTOMER_BACKEND=supabase

# Customers should use Supabase
# Other services should use Real API
```

---

## 📚 Next Steps for Components

### 1. Update Existing Components
Gradually migrate components to use Phase 4 hooks:

```typescript
// OLD - Manual service handling
const [data, setData] = useState([]);
useEffect(() => {
  customerService.getCustomers().then(setData);
}, []);

// NEW - Use custom hook
const { customers: data } = useSupabaseCustomers();
```

### 2. Create New Data-Driven Components
```typescript
import { useSupabaseCustomers, useSupabaseSales } from '@/hooks';

export function Dashboard() {
  const { customers } = useSupabaseCustomers();
  const { sales } = useSupabaseSales();
  
  return (
    <div>
      <CustomerStats customers={customers} />
      <SalesChart sales={sales} />
    </div>
  );
}
```

### 3. Add More Hooks as Needed
Follow the same pattern for Products, Companies, etc.

---

## ✅ Phase 4 Checklist

- [x] API configuration enhanced for multi-backend
- [x] Service factory updated with intelligent routing
- [x] Four custom React hooks created
- [x] Environment configuration documented
- [x] Backward compatibility maintained
- [x] Per-service overrides implemented
- [x] Console logging enhanced
- [x] Hot-reload support added
- [x] Phase 3 Supabase services integrated
- [x] Comprehensive documentation provided

---

## 🎓 Learning Resources

### Understanding the Flow
1. Component renders with `useSupabaseCustomers()`
2. Hook calls `customerService.getCustomers()`
3. Service factory checks `VITE_CUSTOMER_BACKEND` override
4. Falls back to `VITE_API_MODE` if no override
5. Returns appropriate service instance:
   - `supabaseCustomerService` if mode is 'supabase'
   - `RealCustomerService` if mode is 'real'
   - `mockCustomerService` if mode is 'mock'
6. Service executes request
7. Data returned to hook
8. Hook updates component state
9. Component re-renders

### Code References
- Config: `src/config/apiConfig.ts` - Mode detection
- Factory: `src/services/api/apiServiceFactory.ts` - Service routing
- Hooks: `src/hooks/useSupabase*.ts` - Component integration
- Services: `src/services/index.ts` - Main export point

---

## 🐛 Troubleshooting

### Problem: Components using wrong backend
**Solution**: Check `.env` file
```bash
# Verify
cat .env | grep VITE_API_MODE
cat .env | grep VITE_*_BACKEND
```

### Problem: Changes not taking effect
**Solution**: Restart dev server
```bash
# Stop: Ctrl+C
# Restart:
npm run dev
```

### Problem: Can't find hook in imports
**Solution**: Ensure hook is exported from `src/hooks/index.ts`
```typescript
// Check if this works:
import { useSupabaseCustomers } from '@/hooks';
```

---

## 📞 Support

For issues with:
- **API routing**: Check `src/services/api/apiServiceFactory.ts`
- **Environment config**: Check `.env` and `src/config/apiConfig.ts`
- **React hooks**: Check `src/hooks/useSupabase*.ts`
- **Service logic**: Check `src/services/supabase/*.ts` (Phase 3)

---

## 🎉 Summary

**Phase 4 delivers a unified, production-ready service layer that:**

1. ✅ Seamlessly switches between 3 backends
2. ✅ Provides intelligent per-service routing
3. ✅ Integrates Phase 3 Supabase services
4. ✅ Offers React hook abstractions for components
5. ✅ Maintains backward compatibility
6. ✅ Reduces component boilerplate code
7. ✅ Supports real-time data synchronization
8. ✅ Enables flexible deployment strategies

**Components can now focus on UI while Phase 4 intelligently manages data sources.**

---

**Phase 4: Complete** ✅
**Next Phase**: Build component layer consuming Phase 4 hooks
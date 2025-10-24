# GoTrueClient Architecture Diagram

## Before Fix: Broken Architecture (Duplicate Instances)

```
┌─────────────────────────────────────────────────────────────────┐
│                     BROWSER CONTEXT                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐         ┌──────────────────────┐      │
│  │  Supabase Client #1  │         │  Supabase Client #2  │      │
│  │ (in supabase/client) │         │  (in database.ts)    │      │
│  ├──────────────────────┤         ├──────────────────────┤      │
│  │ GoTrueClient         │◄────┐   │ GoTrueClient         │      │
│  │ └─ auth state        │     │   │ └─ auth state        │      │
│  │ └─ session storage   │     │   │ └─ session storage   │      │
│  └──────────────────────┘     │   └──────────────────────┘      │
│            ▲                   │             ▲                   │
│            │                   │             │                   │
│  SAME STORAGE KEY (supabase.auth.token)     │                   │
│            │                   │             │                   │
│            └───────────────────┴─────────────┘                   │
│                      ❌ CONFLICT!                                │
│              Multiple instances competing                         │
│           for same storage key = UNDEFINED                       │
│                     BEHAVIOR                                      │
└─────────────────────────────────────────────────────────────────┘

                    📊 Browser Console:
                    ⚠️ WARNING: Multiple GoTrueClient instances
```

---

## After Fix: Correct Architecture (Single Instance)

```
┌─────────────────────────────────────────────────────────────────┐
│                     BROWSER CONTEXT                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│             ┌──────────────────────────────────┐                 │
│             │   Supabase Client (SINGLETON)    │                 │
│             │   src/supabase/client.ts line23  │                 │
│             ├──────────────────────────────────┤                 │
│             │ GoTrueClient                     │                 │
│             │ ├─ auth state (UNIFIED)          │                 │
│             │ ├─ session storage (SINGLE KEY)  │                 │
│             │ ├─ persistSession: true          │                 │
│             │ ├─ autoRefreshToken: true        │                 │
│             │ └─ detectSessionInUrl: true      │                 │
│             └──────────────────┬───────────────┘                 │
│                                │                                  │
│                  ┌─────────────┼─────────────┐                  │
│                  │             │             │                  │
│          ┌───────▼──────┐  ┌──▼──────────┐ ┌┴──────────┐       │
│          │  database.ts │  │ authService │ │ services/ │       │
│          │ (re-exports) │  │ (imports)   │ │supabase/* │       │
│          └───────┬──────┘  └──┬──────────┘ └┬──────────┘       │
│                  │             │             │                  │
│          ┌───────┴──────┬──────┴─┬──────────┴────────┐         │
│          │              │        │                   │         │
│    ┌─────▼────┐  ┌──────▼──┐ ┌──▼─────┐  ┌────────▼─┐         │
│    │ Dashboard│  │Customer │ │ Factory│  │  Other   │         │
│    │ Module   │  │ Service │ │Pattern │  │ Modules  │         │
│    └──────────┘  └─────────┘ └────────┘  └──────────┘         │
│                                                                   │
│             ✅ SINGLE SOURCE OF TRUTH                           │
│          ✅ UNIFIED AUTH STATE                                  │
│        ✅ CONSISTENT STORAGE KEY                               │
└─────────────────────────────────────────────────────────────────┘

                    📊 Browser Console:
                    ✅ Clean - No warnings
                    ✅ Single auth token in localStorage
```

---

## Import Dependency Flow

### Complete Import Chain

```
Application Start
    │
    ├─→ React App mounts
    │    │
    │    ├─→ AuthContext initializes
    │    │    │
    │    │    └─→ imports authService
    │    │         │
    │    │         └─→ imports from database.ts
    │    │              │
    │    │              └─→ imports from supabase/client.ts
    │    │                  │
    │    │                  └─→ 📦 CREATES supabaseClient (ONCE!)
    │    │                      ├─ GoTrueClient instance
    │    │                      └─ Configured with session persistence
    │    │
    │    ├─→ Modules initialize
    │    │    │
    │    │    ├─→ Dashboard imports dashboardService
    │    │    ├─→ Customers imports customerService  
    │    │    ├─→ Sales imports salesService
    │    │    └─→ All use serviceFactory.ts
    │    │         │
    │    │         └─→ Routes to supabase services
    │    │             │
    │    │             └─→ All use SAME client from supabase/client.ts
    │    │
    │    └─→ Application ready
    │         │
    │         └─→ ✅ Single GoTrueClient manages all auth
    │
    └─→ User interactions
         │
         └─→ All auth operations use same client instance
             ├─ Login ✅
             ├─ Logout ✅
             ├─ Token refresh ✅
             ├─ Session persistence ✅
             └─ Multi-tenant operations ✅
```

---

## File Structure Overview

```
src/
├── services/
│   ├── 📄 database.ts
│   │   ├─ Imports: supabaseClient from ./supabase/client
│   │   ├─ Exports: supabase (re-exported singleton)
│   │   └─ Provides: Generic database helper methods
│   │       └─ All methods use SINGLETON client
│   │
│   ├── 📄 authService.ts
│   │   ├─ Imports: supabase from ./database ✅
│   │   └─ Uses: SINGLETON client for auth operations
│   │
│   ├── supabase/
│   │   ├── 📄 client.ts ⭐ CRITICAL
│   │   │   ├─ Imports: createClient from '@supabase/supabase-js'
│   │   │   ├─ Creates: supabaseClient (EXACTLY ONCE)
│   │   │   │   ├─ persistSession: true
│   │   │   │   ├─ autoRefreshToken: true
│   │   │   │   └─ detectSessionInUrl: true
│   │   │   └─ Exports: supabaseClient + helper functions
│   │   │
│   │   ├── 📄 baseService.ts
│   │   ├── 📄 authService.ts
│   │   ├── 📄 customerService.ts
│   │   ├── 📄 productService.ts
│   │   └── ... (all import client.ts)
│   │
│   ├── 📄 serviceFactory.ts
│   │   ├─ Routes between mock/real/supabase implementations
│   │   └─ All supabase services use SINGLETON client
│   │
│   └── 📄 index.ts
│       └─ Central hub for all services
│
├── modules/
│   └── features/
│       ├── customers/
│       │   └─ Uses serviceFactory → supabase services → SINGLETON
│       ├── dashboard/
│       │   └─ Uses serviceFactory → supabase services → SINGLETON
│       ├── sales/
│       │   └─ Uses serviceFactory → supabase services → SINGLETON
│       └── ... (all use SINGLETON)
│
└── ... (other directories)
```

---

## Execution Flow: User Login Example

```
User clicks "Login" button
    │
    └─→ LoginComponent.onSubmit()
         │
         └─→ authService.login(email, password)
             │
             ├─ Imports supabase from database.ts ✅
             │  │
             │  └─ This is re-exported from supabase/client.ts
             │
             └─→ supabase.auth.signInWithPassword()
                 │
                 └─→ Uses SINGLETON GoTrueClient
                     │
                     ├─ Sends auth request
                     ├─ Receives session token
                     ├─ Saves to localStorage (supabase.auth.token)
                     ├─ Sets up auto-refresh
                     └─ Returns user session
                         │
                         └─→ AuthContext updates
                             │
                             └─→ Component renders
                                 │
                                 └─→ Redirects to dashboard
                                     │
                                     └─→ Dashboard loads data
                                         │
                                         └─→ All API calls include auth token
                                             from SINGLETON client
                                             │
                                             ✅ ONE source of truth!
```

---

## Client Initialization Timeline

```
TIME ─────────────────────────────────────────────────────────────→

0ms   Application boot
      │
10ms  Import src/index.tsx
      │
20ms  React App component mounts
      │
30ms  AuthContext initializes
      │  └─ Imports authService
      │     └─ Imports from database.ts
      │        └─ Imports { supabaseClient } from supabase/client.ts
      │           │
      │           └─→ 🔴 ONCE ONLY: createClient() executes
      │               ├─ Creates GoTrueClient instance
      │               ├─ Configures auth settings
      │               ├─ Sets up event listeners
      │               └─ Exports as supabaseClient
      │
50ms  All subsequent imports reference SAME supabaseClient
      │
      │  Modules import
      │  ├─ Dashboard
      │  ├─ Customers
      │  ├─ Sales
      │  └─ All reference SAME supabaseClient ✅
      │
100ms Application ready
      │
      └─→ User interactions all use SINGLETON
          ├─ Login ✅ (one client)
          ├─ API calls ✅ (same auth token)
          ├─ Logout ✅ (synchronized)
          └─ Session refresh ✅ (one handler)

KEY: 🔴 = Client creation (HAPPENS ONCE)
     ✅ = Uses existing singleton (HAPPENS MANY TIMES)
```

---

## State Management Architecture

```
┌────────────────────────────────────────────────────────────┐
│              UNIFIED AUTH STATE MANAGEMENT                  │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  Supabase Client (SINGLETON)                               │
│  ├─ Internal Auth State                                    │
│  │  ├─ currentUser (from GoTrueClient)                     │
│  │  ├─ currentSession (from GoTrueClient)                  │
│  │  └─ Token refresh handlers                              │
│  │                                                          │
│  ├─ localStorage Persistence                              │
│  │  ├─ supabase.auth.token (SINGLE ENTRY)                 │
│  │  ├─ supabase.auth.expires_at                           │
│  │  └─ supabase.auth.expires_in                           │
│  │                                                          │
│  └─ Event Subscriptions                                   │
│     ├─ onAuthStateChange listeners                         │
│     ├─ Token refresh triggers                              │
│     └─ Session updates                                     │
│                                                              │
│         ↓ Single source for entire app ↓                   │
│                                                              │
│  AuthContext (React)                                       │
│  ├─ currentUser                                            │
│  ├─ currentTenant                                          │
│  ├─ isAuthenticated                                        │
│  ├─ permissions                                            │
│  └─ Helper methods (login, logout, etc)                    │
│                                                              │
│         ↓ Consumed by ↓                                    │
│                                                              │
│  ┌─────────────────────────────────┐                       │
│  │  All Components / Modules        │                       │
│  │  ├─ Reflect auth state           │                       │
│  │  ├─ Use consistent permissions   │                       │
│  │  └─ Share auth tokens            │                       │
│  └─────────────────────────────────┘                       │
│                                                              │
└────────────────────────────────────────────────────────────┘

KEY: ONE source = ONE source of truth = NO conflicts ✅
```

---

## Configuration & Initialization

```
Environment Variables (.env)
│
├─ VITE_SUPABASE_URL
├─ VITE_SUPABASE_ANON_KEY
└─ VITE_SUPABASE_SERVICE_KEY
    │
    └─→ src/services/supabase/client.ts
        │
        ├─→ Validates configuration
        │   ├─ Check VITE_SUPABASE_URL exists
        │   └─ Check VITE_SUPABASE_ANON_KEY exists
        │
        └─→ Creates supabaseClient
            ├─ Parameters:
            │  ├─ supabaseUrl
            │  └─ supabaseAnonKey
            │
            └─→ Options:
                ├─ auth:
                │  ├─ persistSession: true ✅
                │  ├─ autoRefreshToken: true ✅
                │  └─ detectSessionInUrl: true ✅
                │
                └─ realtime:
                   └─ params.eventsPerSecond: 10

Result: ONE singleton instance configured with:
├─ Session persistence (localStorage)
├─ Auto token refresh (no manual refresh needed)
├─ OAuth redirect detection (for providers)
└─ Real-time event management (Supabase features)
```

---

## Session Persistence Mechanism

```
User logs in
│
└─→ authService.login()
    │
    └─→ supabase.auth.signInWithPassword()
        │
        └─→ GoTrueClient handles auth
            │
            ├─ ✅ Request sent to Supabase
            ├─ ✅ Receives token + refresh token
            │
            └─→ Auto-save to localStorage (persistSession: true)
                │
                ├─ localStorage['supabase.auth.token'] = access_token
                ├─ localStorage['supabase.auth.expires_at'] = timestamp
                └─ localStorage['supabase.auth.expires_in'] = seconds
                    │
                    └─→ Auto-restore on page load
                        │
                        └─→ User stays logged in ✅


User refreshes page
│
└─→ Browser loads localStorage
    │
    └─→ supabase/client.ts initializes
        │
        └─→ GoTrueClient auto-restores session
            ├─ Checks localStorage for token
            ├─ Validates token
            ├─ Sets up auto-refresh timer
            └─ User already authenticated ✅


Token expires soon
│
└─→ GoTrueClient (autoRefreshToken: true) handles
    │
    └─→ Auto-requests new token
        │
        ├─ Sends refresh_token to Supabase
        ├─ Receives new access_token
        ├─ Updates localStorage
        └─ No user interruption ✅

KEY: ✅ = Automatic, no manual code needed
```

---

## Summary

### Before Fix ❌
- 2 separate `createClient()` calls
- 2 GoTrueClient instances
- Same localStorage key → Conflict
- Undefined behavior
- Browser warning

### After Fix ✅
- 1 `createClient()` call (in supabase/client.ts)
- 1 GoTrueClient instance (singleton)
- Single localStorage key
- Deterministic behavior
- Clean browser console

**Result:** Unified, predictable, performant authentication system.
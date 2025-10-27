---
title: Session Management Architecture
description: User session lifecycle, JWT tokens, tenant context, and session persistence
category: Architecture
lastUpdated: 2025-01-20
status: Active
relatedModules: auth
---

# Session Management Architecture

## 🎯 Overview

**Session Management** maintains the user's authenticated state, tenant context, and permissions throughout their application usage.

**Key Responsibilities:**
- Keep user logged in across page refreshes
- Maintain tenant context for multi-tenant isolation
- Store JWT tokens securely
- Auto-refresh tokens before expiration
- Clean up on logout

**Why This Matters:**
- Users shouldn't need to re-login on page refresh
- Multi-tenant data must be isolated per session
- Permissions must be available for RBAC checks
- Session must survive temporary connectivity issues

---

## 🏗️ Session Architecture

```
┌─────────────────────────────────────────────┐
│           User Browser                      │
├─────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐  │
│  │ sessionStore (Zustand)               │  │
│  │ - currentUser                        │  │
│  │ - currentTenant                      │  │
│  │ - permissions                        │  │
│  │ - isSessionValid()                   │  │
│  └──────┬───────────────────────────────┘  │
│         │                                   │
│         ▼                                   │
│  ┌──────────────────────────────────────┐  │
│  │ localStorage (Persistent)            │  │
│  │ - sb-auth-token (JWT)                │  │
│  │ - sb-refresh-token (Refresh JWT)     │  │
│  │ - session-expiry                     │  │
│  └──────────────────────────────────────┘  │
│         ▲                                   │
│         │                                   │
├─────────┼───────────────────────────────────┤
│  Network Request:                           │
│  - Add Authorization header                 │
│  - Include tenant_id from store             │
└──────────────────────────────────────────────┘
         │
         ▼
  ┌─────────────────┐
  │  Supabase       │
  │  API Server     │
  │  - Validate JWT │
  │  - Check RLS    │
  │  - Return data  │
  └─────────────────┘
```

---

## 💾 Session Storage

### Zustand Store (In-Memory)

**Location**: `src/stores/sessionStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'active' | 'inactive';
  tenantId: string;
  tenantName: string;
  permissions: string[];
  lastLogin: string;
  avatar?: string;
  phone?: string;
}

interface SessionStore {
  // Current state
  currentUser: SessionUser | null;
  currentTenant: { id: string; name: string } | null;
  isLoading: boolean;
  error: string | null;

  // Session management
  setUser: (user: SessionUser) => void;
  setTenant: (tenant: { id: string; name: string }) => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Session queries
  isAuthenticated: () => boolean;
  isSessionValid: () => boolean;
  getPermissions: () => string[];
  hasPermission: (permission: string) => boolean;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      currentTenant: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ currentUser: user }),
      setTenant: (tenant) => set({ currentTenant: tenant }),
      
      clearSession: () => set({
        currentUser: null,
        currentTenant: null,
        error: null,
      }),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      isAuthenticated: () => {
        const { currentUser } = get();
        return !!currentUser;
      },

      isSessionValid: () => {
        const { currentUser } = get();
        if (!currentUser) return false;
        
        // Check if token is expired
        const token = localStorage.getItem('sb-auth-token');
        if (!token) return false;

        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          const expiryTime = decoded.exp * 1000;
          return Date.now() < expiryTime;
        } catch {
          return false;
        }
      },

      getPermissions: () => {
        const { currentUser } = get();
        return currentUser?.permissions || [];
      },

      hasPermission: (permission: string) => {
        const { currentUser } = get();
        return currentUser?.permissions?.includes(permission) || false;
      },
    }),
    {
      name: 'session-store', // localStorage key
      partialize: (state) => ({
        // Only persist user info, not loading/error
        currentUser: state.currentUser,
        currentTenant: state.currentTenant,
      }),
    }
  )
);
```

### localStorage Structure

```typescript
// JWT Token (handled by Supabase)
localStorage.getItem('sb-auth-token')
// Returns: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Session expiry timestamp
localStorage.getItem('session-expiry')
// Returns: 1706829600000

// Persisted session store
localStorage.getItem('session-store')
// Returns: JSON stringified session state
```

---

## 🔄 Session Lifecycle

### 1. Login Flow

```
User submits login form
        │
        ▼
Supabase authenticates user
        │
        ▼
JWT token created & returned
        │
        ├─→ Stored in localStorage
        ├─→ Stored in sessionStore
        ▼
Fetch user profile & permissions
        │
        ▼
Set currentUser in sessionStore
        │
        ▼
Redirect to dashboard
```

**Code Implementation:**

```typescript
// src/modules/features/auth/services/loginService.ts
export async function login(email: string, password: string) {
  try {
    // 1. Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // 2. Get JWT token from response
    const jwtToken = data.session?.access_token;
    const refreshToken = data.session?.refresh_token;

    // 3. Store tokens
    localStorage.setItem('sb-auth-token', jwtToken);
    localStorage.setItem('sb-refresh-token', refreshToken);

    // 4. Fetch user profile
    const userService = userService as IUserService;
    const user = await userService.getUser(data.user.id, data.user.user_metadata.tenant_id);

    // 5. Fetch permissions
    const rbacService = rbacService as IRBACService;
    const roles = await rbacService.getRoles(user.tenantId);
    const userRoles = roles.filter(r => r.users?.includes(user.id));
    const permissions = userRoles.flatMap(r => r.permissions);

    // 6. Set session store
    const { setUser, setTenant } = useSessionStore();
    setUser({
      ...user,
      permissions,
    });
    setTenant({
      id: user.tenantId,
      name: user.tenantName,
    });

    // 7. Set token expiry (usually 1 hour)
    const expiryTime = new Date().getTime() + (60 * 60 * 1000);
    localStorage.setItem('session-expiry', expiryTime.toString());

    return true;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
```

### 2. Session Persistence (Page Refresh)

```
Page loads
        │
        ▼
Check localStorage for JWT token
        │
        ├─ Not found? → Show login
        │
        ├─ Found? → Continue
        ▼
Check token expiry
        │
        ├─ Expired? → Refresh token
        │
        ├─ Valid? → Continue
        ▼
Restore sessionStore from localStorage
        │
        ▼
Verify JWT still valid with backend
        │
        ├─ Invalid? → Logout
        │
        ├─ Valid? → Continue
        ▼
Set up auto-refresh timer
        │
        ▼
Show dashboard
```

**Code Implementation:**

```typescript
// src/hooks/useSessionPersistence.ts
export function useSessionPersistence() {
  const { setUser, setTenant } = useSessionStore();

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // 1. Check if token exists
        const token = localStorage.getItem('sb-auth-token');
        if (!token) {
          // Not authenticated
          return;
        }

        // 2. Check token expiry
        const expiryTime = localStorage.getItem('session-expiry');
        if (expiryTime && Date.now() > parseInt(expiryTime)) {
          // Token expired, try to refresh
          await refreshToken();
          return;
        }

        // 3. Verify token is still valid with backend
        const { data: user, error } = await supabase.auth.getUser(token);
        if (error) {
          // Invalid token, logout
          logout();
          return;
        }

        // 4. Restore user from localStorage (if available)
        const storedSession = localStorage.getItem('session-store');
        if (storedSession) {
          const { currentUser, currentTenant } = JSON.parse(storedSession);
          setUser(currentUser);
          setTenant(currentTenant);
        }

        // 5. Set up auto-refresh for token
        setupAutoRefresh();
      } catch (error) {
        console.error('Session initialization failed:', error);
        logout();
      }
    };

    initializeSession();
  }, []);
}
```

### 3. Token Auto-Refresh

```
Setup auto-refresh timer
        │
        ├─ Run every 5 minutes
        ▼
Check if token expires in < 10 minutes
        │
        ├─ No? → Wait, run again
        │
        ├─ Yes? → Refresh
        ▼
Get new JWT token from Supabase
        │
        ▼
Store new token in localStorage
        │
        ▼
Update expiry time
        │
        ▼
Continue session
```

**Code Implementation:**

```typescript
// src/services/tokenRefreshService.ts
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const TOKEN_EXPIRY_BUFFER = 10 * 60 * 1000;  // 10 minutes

let refreshTimer: ReturnType<typeof setInterval> | null = null;

export function setupAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);

  refreshTimer = setInterval(async () => {
    try {
      const expiryTime = parseInt(localStorage.getItem('session-expiry') || '0');
      const timeUntilExpiry = expiryTime - Date.now();

      // If token expires in less than 10 minutes, refresh it
      if (timeUntilExpiry < TOKEN_EXPIRY_BUFFER) {
        await refreshToken();
      }
    } catch (error) {
      console.error('Auto-refresh failed:', error);
    }
  }, TOKEN_REFRESH_INTERVAL);
}

export async function refreshToken() {
  try {
    const refreshToken = localStorage.getItem('sb-refresh-token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Get new JWT from Supabase
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) throw error;

    // Update stored tokens
    localStorage.setItem('sb-auth-token', data.session.access_token);
    localStorage.setItem('sb-refresh-token', data.session.refresh_token);

    // Update expiry
    const expiryTime = new Date().getTime() + (60 * 60 * 1000);
    localStorage.setItem('session-expiry', expiryTime.toString());

    console.log('Token refreshed successfully');
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Session invalid, logout
    logout();
  }
}

export function clearAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}
```

### 4. Logout Flow

```
User clicks Logout button
        │
        ▼
Call authentication service logout
        │
        ▼
Remove JWT token from localStorage
        │
        ├─ Remove sb-auth-token
        ├─ Remove sb-refresh-token
        ├─ Remove session-expiry
        ├─ Remove session-store
        ▼
Clear sessionStore
        │
        ├─ Clear currentUser
        ├─ Clear currentTenant
        ├─ Clear permissions
        ▼
Stop auto-refresh timer
        │
        ▼
Notify Supabase of logout
        │
        ▼
Redirect to login page
```

**Code Implementation:**

```typescript
// src/services/logoutService.ts
export async function logout() {
  try {
    // 1. Notify Supabase
    await supabase.auth.signOut();

    // 2. Clear tokens from localStorage
    localStorage.removeItem('sb-auth-token');
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('session-expiry');
    localStorage.removeItem('session-store');

    // 3. Clear session store
    const { clearSession } = useSessionStore();
    clearSession();

    // 4. Stop auto-refresh
    clearAutoRefresh();

    // 5. Log audit event
    const { rbacService } = getServices();
    await rbacService.logAction('logout', 'session', '', {}, '');

    // 6. Redirect to login
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout failed:', error);
    // Still clear locally even if server call fails
    clearLocalSession();
  }
}

function clearLocalSession() {
  localStorage.removeItem('sb-auth-token');
  localStorage.removeItem('sb-refresh-token');
  localStorage.removeItem('session-expiry');
  localStorage.removeItem('session-store');

  const { clearSession } = useSessionStore();
  clearSession();

  clearAutoRefresh();
}
```

---

## 🔐 Security Measures

### 1. JWT Token Validation

```typescript
interface JWTPayload {
  sub: string;                    // User ID
  email: string;
  exp: number;                    // Expiration timestamp
  iat: number;                    // Issued at timestamp
  tenant_id: string;              // Multi-tenant isolation
  permissions: string[];          // RBAC permissions
  roles: string[];                // User roles
}

// Validate JWT structure
export function validateJWT(token: string): JWTPayload | null {
  try {
    // Split token into parts
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode payload
    const decoded = JSON.parse(atob(parts[1]));

    // Check expiration
    if (decoded.exp * 1000 < Date.now()) {
      return null; // Token expired
    }

    return decoded;
  } catch {
    return null; // Invalid token
  }
}
```

### 2. Tenant Context Validation

```typescript
// Ensure user only accesses their tenant
export function validateTenantAccess(requestTenantId: string): boolean {
  const { currentTenant } = useSessionStore();
  
  if (!currentTenant) return false;
  if (currentTenant.id !== requestTenantId) {
    throw new Error('Unauthorized: Tenant mismatch');
  }

  return true;
}
```

### 3. Permission Validation in Middleware

```typescript
// API request middleware
export function createAuthMiddleware() {
  return async (config: AxiosRequestConfig) => {
    // 1. Add JWT to Authorization header
    const token = localStorage.getItem('sb-auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Add tenant context to headers
    const { currentTenant } = useSessionStore();
    if (currentTenant) {
      config.headers['X-Tenant-ID'] = currentTenant.id;
    }

    // 3. Validate session is still valid
    if (!useSessionStore().isSessionValid()) {
      throw new Error('Session expired');
    }

    return config;
  };
}
```

---

## ⚙️ Session Configuration

### Environment Variables

```bash
# .env file
VITE_SESSION_TIMEOUT=3600000              # 1 hour in ms
VITE_TOKEN_REFRESH_INTERVAL=300000        # 5 minutes in ms
VITE_TOKEN_EXPIRY_BUFFER=600000           # 10 minutes in ms
VITE_REMEMBER_ME_DURATION=2592000000      # 30 days in ms
```

### Configuration Object

```typescript
// src/config/sessionConfig.ts
export const SESSION_CONFIG = {
  // Timeouts
  sessionTimeout: import.meta.env.VITE_SESSION_TIMEOUT || 3600000, // 1 hour
  tokenRefreshInterval: import.meta.env.VITE_TOKEN_REFRESH_INTERVAL || 300000, // 5 min
  tokenExpiryBuffer: import.meta.env.VITE_TOKEN_EXPIRY_BUFFER || 600000, // 10 min
  rememberMeDuration: import.meta.env.VITE_REMEMBER_ME_DURATION || 2592000000, // 30 days

  // Storage keys
  storageKeys: {
    authToken: 'sb-auth-token',
    refreshToken: 'sb-refresh-token',
    sessionExpiry: 'session-expiry',
    sessionStore: 'session-store',
  },

  // HTTP headers
  headers: {
    authorization: 'Authorization',
    tenantId: 'X-Tenant-ID',
  },
};
```

---

## 📊 Session Monitoring

### Session Health Check

```typescript
export async function checkSessionHealth(): Promise<SessionHealth> {
  const { currentUser, isSessionValid } = useSessionStore();
  const token = localStorage.getItem('sb-auth-token');

  return {
    isAuthenticated: !!currentUser,
    isSessionValid: isSessionValid(),
    hasValidToken: !!token && validateJWT(token) !== null,
    lastActivity: new Date(),
    tokenExpiresIn: getTokenExpiryTime(),
    userEmail: currentUser?.email,
    tenantId: currentUser?.tenantId,
  };
}

export function getTokenExpiryTime(): number | null {
  const token = localStorage.getItem('sb-auth-token');
  if (!token) return null;

  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded.exp * 1000 - Date.now();
  } catch {
    return null;
  }
}
```

---

## ✅ Implementation Checklist

- [ ] Zustand store created with session state
- [ ] localStorage persistence configured
- [ ] Login flow updates session store
- [ ] Session persistence hook on app load
- [ ] Token auto-refresh implemented
- [ ] Logout clears all session data
- [ ] JWT validation implemented
- [ ] Tenant context included in all requests
- [ ] Auto-refresh timer started on login
- [ ] Auto-refresh timer stopped on logout
- [ ] Error handling for expired sessions
- [ ] Session health check available

---

## 🔗 Related Documentation

- [Authentication System](./AUTHENTICATION.md) - JWT creation and validation
- [RBAC & Permissions](./RBAC_AND_PERMISSIONS.md) - Permission storage in session
- [Service Factory Pattern](./SERVICE_FACTORY.md) - Using tenant context in API calls

---

**Last Updated**: 2025-01-20  
**Status**: ✅ Active and Maintained  
**Maintainer**: Architecture Team
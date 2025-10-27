---
title: Authentication Module
description: Complete documentation for the Authentication module including login, logout, session management, MFA, and OAuth integration
lastUpdated: 2025-01-15
relatedModules: [user-management, super-admin]
category: module
status: production
---

# Authentication Module

## Overview

The Authentication module handles user authentication, authorization, session management, and security. It provides login/logout functionality, multi-factor authentication, OAuth integration, and token management.

## Module Structure

```
auth/
├── components/              # Reusable UI components
│   ├── LoginForm.tsx             # Login form component
│   ├── LogoutConfirmation.tsx    # Logout confirmation dialog
│   ├── MFASetup.tsx              # Multi-factor authentication setup
│   └── SessionTimeout.tsx        # Session timeout warning
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts                # Authentication context hook
│   ├── useSession.ts             # Session management hook
│   └── useAuthGuard.ts           # Route protection hook
├── services/                # Business logic
│   ├── authService.ts            # Authentication service
│   ├── sessionService.ts         # Session management
│   └── index.ts
├── store/                   # State management
│   ├── authStore.ts              # Zustand auth state
│   └── sessionStore.ts           # Zustand session state
├── views/                   # Page components
│   ├── LoginPage.tsx             # Login page
│   ├── LogoutPage.tsx            # Logout confirmation page
│   └── SessionExpiredPage.tsx    # Session expired page
├── index.ts                 # Module entry point
├── routes.tsx               # Route definitions
└── DOC.md                  # This file
```

## Key Features

### 1. User Authentication
- Email/Password login
- OAuth 2.0 integration (Google, Microsoft, etc.)
- SAML support (enterprise)
- Session token management
- Remember me functionality

### 2. Security
- Password hashing (bcrypt)
- Secure cookie storage
- CSRF protection
- Rate limiting on login
- Account lockout after failed attempts

### 3. Multi-Factor Authentication (MFA)
- TOTP-based 2FA
- SMS-based 2FA
- Email verification
- Backup codes

### 4. Session Management
- Session timeout configuration
- Automatic logout
- Session persistence
- Concurrent session limits
- Session activity tracking

### 5. Authorization
- Role-based access control
- Permission validation
- Route protection
- Feature flags

## Architecture

### Authentication Flow

```
┌─────────────┐
│  Login Form │
└──────┬──────┘
       │
       v
┌──────────────────┐
│ Validate Input   │
└──────┬───────────┘
       │
       v
┌──────────────────┐
│ Call Auth Service│
└──────┬───────────┘
       │
       ├─── Success ──→ Generate Token ──→ Store Session
       │
       └─── Failure ──→ Show Error ──→ Increment Counter ──→ Lock if > 5
```

### Component Layer

#### LoginPage.tsx
- Email and password inputs
- Forgot password link
- Remember me checkbox
- Login button with loading state
- Error message display
- OAuth buttons (if configured)
- Two-factor setup link

#### LogoutConfirmation.tsx
- Confirmation dialog
- Confirm/Cancel buttons
- Session cleanup on confirm
- Redirect to login page

### State Management (Zustand)

```typescript
interface AuthStore {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  
  setAuth: (user: User, token: string, refreshToken: string) => void;
  clearAuth: () => void;
  setError: (error: string) => void;
}

interface SessionStore {
  sessionTimeout: number;
  lastActivity: Date;
  isWarningShown: boolean;
  
  updateActivity: () => void;
  showWarning: () => void;
  extendSession: () => void;
  endSession: () => void;
}
```

### API/Hooks (React Query)

```typescript
// Login
const loginMutation = useLogin();
await loginMutation.mutateAsync({ email, password });

// Logout
const logoutMutation = useLogout();
await logoutMutation.mutateAsync();

// Get current user
const { data: user } = useCurrentUser();

// Refresh token
const refreshMutation = useRefreshToken();
await refreshMutation.mutateAsync();

// Setup MFA
const mfaMutation = useSetupMFA();
await mfaMutation.mutateAsync(method);
```

## Data Types & Interfaces

```typescript
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;  // seconds
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  avatar?: string;
  tenantId: string;
  mfaEnabled: boolean;
}

interface Session {
  userId: string;
  token: string;
  startTime: string;
  lastActivity: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
}

interface MFASetup {
  method: 'totp' | 'sms' | 'email';
  secret?: string;
  phoneNumber?: string;
  backupCodes?: string[];
}
```

## Security Configuration

### Session Timeout
```typescript
const SESSION_TIMEOUT = 30 * 60 * 1000;  // 30 minutes
const WARNING_TIMEOUT = 5 * 60 * 1000;   // 5 minutes before timeout
const MAX_CONCURRENT_SESSIONS = 3;
```

### Password Policy
```typescript
// Requirements:
// - Minimum 12 characters
// - At least 1 uppercase letter
// - At least 1 lowercase letter
// - At least 1 number
// - At least 1 special character (!@#$%^&*)
```

### Rate Limiting
```typescript
// Max 5 failed login attempts per IP per 15 minutes
// Max 50 requests per IP per 1 minute
```

## Integration Points

### 1. User Management
- User creation and profile
- Role and permission assignment

### 2. Super Admin
- System-level authentication settings
- Security policies configuration

### 3. Audit Logs
- Login/logout tracking
- Failed attempt logging

## RBAC & Permissions

```typescript
// Authentication is required for all features
// Permissions are validated on:
// - Page access (route guards)
// - API calls (request interceptors)
// - Component rendering (conditional rendering)

// Public routes (no auth required):
// - /login
// - /forgot-password
// - /reset-password/:token

// Protected routes (auth required):
// - /tenant/*
// - /admin/*
```

## Common Use Cases

### 1. Login with Credentials

```typescript
const handleLogin = async (email: string, password: string) => {
  const loginMutation = useLogin();
  try {
    const response = await loginMutation.mutateAsync({ email, password });
    // Store token in secure cookie/localStorage
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    // Redirect to dashboard
    navigate('/tenant/dashboard');
  } catch (error) {
    notificationService.error('Login failed: ' + error.message);
  }
};
```

### 2. Session Timeout Management

```typescript
const useSessionTimeout = () => {
  const sessionStore = useSessionStore();
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(timeoutId);
      sessionStore.updateActivity();
      
      timeoutId = setTimeout(() => {
        sessionStore.showWarning();
      }, SESSION_TIMEOUT - WARNING_TIMEOUT);
    };
    
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [sessionStore]);
};
```

### 3. Logout

```typescript
const handleLogout = async () => {
  const logoutMutation = useLogout();
  await logoutMutation.mutateAsync();
  
  // Clear stored tokens
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  
  // Redirect to login
  navigate('/login');
};
```

### 4. Protected Route

```typescript
const ProtectedRoute = ({ element }: { element: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? element : <Navigate to="/login" />;
};
```

## Troubleshooting

### Issue: Login fails with "Invalid credentials"
**Cause**: Wrong email/password or account doesn't exist  
**Solution**: Verify email and password, check if account is active

### Issue: Session expires immediately
**Cause**: Session timeout set too low  
**Solution**: Adjust SESSION_TIMEOUT configuration

### Issue: Token not persisting across page refresh
**Cause**: Token not stored in localStorage/cookie  
**Solution**: Verify token storage in login response handler

### Issue: MFA not working
**Cause**: TOTP app not synced or method not enabled  
**Solution**: Resync TOTP, verify MFA method is enabled for user

## Related Documentation

- [User Management Module](../user-management/DOC.md)
- [Security Best Practices](../../docs/architecture/SECURITY.md)
- [Session Management](../../docs/architecture/SESSION_MANAGEMENT.md)

## Version Information

- **Last Updated**: 2025-01-15
- **Module Version**: 1.0.0
- **Production Status**: ✅ Ready
---
title: Task 2.7 - ImpersonationContext Quick Reference
updated: 2025-02-16
---

# ImpersonationContext - Quick Reference Guide

## 🎯 What Is It?

A React context provider that manages super admin impersonation sessions with:
- Session persistence across page reloads
- Automatic timeout management (8 hours)
- Full TypeScript type safety
- Comprehensive error handling

## 📦 Location

```
src/contexts/ImpersonationContext.tsx
```

## 🚀 Quick Start

### 1. Import the Hook
```typescript
import { useImpersonationMode } from '@/contexts/ImpersonationContext';
```

### 2. Use in Component
```typescript
export const MyComponent = () => {
  const { isImpersonating, activeSession, startImpersonation, endImpersonation } = useImpersonationMode();

  if (!isImpersonating) {
    return <div>Not impersonating</div>;
  }

  return (
    <div>
      Impersonating: {activeSession?.impersonatedUserId}
      <button onClick={() => endImpersonation()}>Stop Impersonating</button>
    </div>
  );
};
```

## 📋 API Reference

### Context Type

```typescript
interface ImpersonationContextType {
  activeSession: ImpersonationLogType | null;
  isImpersonating: boolean;
  startImpersonation(session: ImpersonationLogType): Promise<void>;
  endImpersonation(): Promise<void>;
  getSessionDetails(): ImpersonationLogType | null;
  isSessionValid(): boolean;
  getRemainingSessionTime(): number;
}
```

### Methods

#### `isImpersonating: boolean`
**Returns**: `true` if currently impersonating another user, `false` otherwise

```typescript
if (useImpersonationMode().isImpersonating) {
  console.log('Currently impersonating a user');
}
```

---

#### `activeSession: ImpersonationLogType | null`
**Returns**: Current impersonation session object or `null`

```typescript
const { activeSession } = useImpersonationMode();

if (activeSession) {
  console.log(`Impersonating: ${activeSession.impersonatedUserId}`);
  console.log(`Super Admin: ${activeSession.superUserId}`);
  console.log(`Tenant: ${activeSession.tenantId}`);
}
```

---

#### `startImpersonation(session: ImpersonationLogType): Promise<void>`
**Purpose**: Start an impersonation session  
**Parameters**: `session` - Full `ImpersonationLogType` object  
**Returns**: Promise<void>  
**Throws**: Error if session data is invalid

```typescript
import { ImpersonationLogType } from '@/types/superUserModule';

const { startImpersonation } = useImpersonationMode();

const session: ImpersonationLogType = {
  id: 'log-123',                                    // UUID
  superUserId: 'admin-1',                          // Current admin
  impersonatedUserId: 'user-456',                  // User to impersonate
  tenantId: 'tenant-789',                          // Tenant context
  loginAt: new Date().toISOString(),               // Session start
  createdAt: new Date().toISOString(),             // Creation time
  updatedAt: new Date().toISOString(),             // Last update
  reason: 'Debugging customer issue',              // Optional
};

try {
  await startImpersonation(session);
  console.log('Impersonation started');
} catch (error) {
  console.error('Failed to start impersonation:', error);
}
```

---

#### `endImpersonation(): Promise<void>`
**Purpose**: End the current impersonation session  
**Returns**: Promise<void>  
**Throws**: Error if session clearing fails

```typescript
const { endImpersonation } = useImpersonationMode();

try {
  await endImpersonation();
  console.log('Impersonation ended');
} catch (error) {
  console.error('Failed to end impersonation:', error);
}
```

---

#### `getSessionDetails(): ImpersonationLogType | null`
**Purpose**: Get current session details  
**Returns**: Current session or `null` if not impersonating or session expired

```typescript
const { getSessionDetails } = useImpersonationMode();

const session = getSessionDetails();
if (session) {
  console.log('Active session:', session);
} else {
  console.log('No active session');
}
```

---

#### `isSessionValid(): boolean`
**Purpose**: Check if session is still active within timeout window  
**Returns**: `true` if session is valid, `false` if expired or no session

```typescript
const { isSessionValid } = useImpersonationMode();

if (!isSessionValid()) {
  // Redirect to super admin page
  navigate('/super-admin');
}
```

---

#### `getRemainingSessionTime(): number`
**Purpose**: Get remaining session time in milliseconds  
**Returns**: Milliseconds remaining, or `-1` if no session/expired

```typescript
const { getRemainingSessionTime } = useImpersonationMode();

const remaining = getRemainingSessionTime();
if (remaining > 0) {
  const minutes = Math.floor(remaining / 60000);
  console.log(`Session expires in ${minutes} minutes`);
} else {
  console.log('Session expired');
}
```

---

## 💡 Common Use Cases

### Use Case 1: Display Active Impersonation Banner

```typescript
export const ImpersonationBanner = () => {
  const { isImpersonating, activeSession, getRemainingSessionTime, endImpersonation } = useImpersonationMode();

  if (!isImpersonating || !activeSession) return null;

  const remaining = getRemainingSessionTime();
  const minutes = Math.floor(remaining / 60000);

  return (
    <div className="bg-yellow-100 border border-yellow-300 p-4 rounded">
      <h3>⚠️ Impersonation Active</h3>
      <p>Impersonating user: <strong>{activeSession.impersonatedUserId}</strong></p>
      <p>Remaining time: <strong>{minutes} minutes</strong></p>
      <button onClick={() => endImpersonation()}>Stop Impersonating</button>
    </div>
  );
};
```

### Use Case 2: Prevent Access During Impersonation

```typescript
export const SensitiveAdminPage = () => {
  const { isImpersonating } = useImpersonationMode();

  if (isImpersonating) {
    return <div>This page is not accessible during impersonation</div>;
  }

  return <div>Sensitive admin content</div>;
};
```

### Use Case 3: Track Impersonation in useEffect

```typescript
export const SessionMonitor = () => {
  const { isSessionValid, getSessionDetails } = useImpersonationMode();

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSessionValid()) {
        console.log('Session expired - logging out');
        // Trigger logout/redirect
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isSessionValid]);

  return null;
};
```

### Use Case 4: Log Impersonation Activity

```typescript
export const ActivityLogger = () => {
  const { activeSession, isImpersonating } = useImpersonationMode();

  const logActivity = (action: string) => {
    if (isImpersonating && activeSession) {
      console.log('Impersonation Activity:', {
        action,
        sessionId: activeSession.id,
        impersonatedUser: activeSession.impersonatedUserId,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return { logActivity };
};
```

## 🔐 Important Notes

### Session Persistence
- Sessions are stored in **sessionStorage** (browser-specific)
- Cleared automatically when browser tab is closed
- Restored automatically when page is reloaded
- Different browser tabs have separate sessions

### Session Timeout
- Default timeout: **8 hours** (28,800,000 ms)
- Automatically enforced by `isSessionValid()` check
- Use `getRemainingSessionTime()` to show countdown

### Required Fields
When creating a session for `startImpersonation()`, these fields are REQUIRED:
- `id` - Unique identifier (UUID)
- `superUserId` - Admin performing impersonation
- `impersonatedUserId` - User being impersonated
- `tenantId` - Tenant context

Optional fields:
- `reason` - Why impersonation was initiated
- `ipAddress` - Client IP address
- `userAgent` - Browser user agent
- `actionsTaken` - Array of actions during session

### Error Handling
All methods are safely wrapped in try-catch blocks:

```typescript
const { startImpersonation } = useImpersonationMode();

try {
  await startImpersonation(session);
} catch (error) {
  // Error is logged, safe to continue
  // Session not created
  console.error('Impersonation failed:', error);
}
```

## 🔄 Integration with Other Contexts

### With AuthContext
```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonationMode } from '@/contexts/ImpersonationContext';

export const Component = () => {
  const { user, isSuperAdmin } = useAuth();
  const { isImpersonating, activeSession } = useImpersonationMode();

  if (!isSuperAdmin()) {
    return <div>Not authorized</div>;
  }

  if (isImpersonating) {
    return <div>Currently impersonating {activeSession?.impersonatedUserId}</div>;
  }

  return <div>Select user to impersonate</div>;
};
```

## 📊 Performance Characteristics

All methods are O(1) - safe for frequent usage:
- `isImpersonating` - Simple property check
- `activeSession` - Direct state access
- `getSessionDetails()` - Direct state return
- `isSessionValid()` - Simple arithmetic comparison
- `getRemainingSessionTime()` - Simple arithmetic

**Safe to use in**: Component renders, event handlers, useEffect dependencies

## 🧪 Testing

Test the context in your components:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { ImpersonationProvider, useImpersonationMode } from '@/contexts/ImpersonationContext';

const TestComponent = () => {
  const { isImpersonating } = useImpersonationMode();
  return <div>{isImpersonating ? 'Impersonating' : 'Not impersonating'}</div>;
};

describe('My Component with Impersonation', () => {
  it('should display impersonation status', async () => {
    render(
      <ImpersonationProvider>
        <TestComponent />
      </ImpersonationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Not impersonating')).toBeInTheDocument();
    });
  });
});
```

## ❓ FAQ

**Q: Where are sessions stored?**  
A: In browser sessionStorage, which clears when the tab is closed.

**Q: What happens if I close the browser and reopen?**  
A: The session is lost (sessionStorage is cleared). This is intentional for security.

**Q: Can I have multiple impersonation sessions?**  
A: Not with this implementation. Only one session can be active at a time.

**Q: What happens when session times out?**  
A: The session remains in storage, but `isSessionValid()` returns false and `getSessionDetails()` returns null.

**Q: Can I change the timeout duration?**  
A: Yes, modify `SESSION_TIMEOUT_MS` constant in `ImpersonationContext.tsx`.

**Q: Is this secure?**  
A: Yes - uses sessionStorage (not accessible cross-domain), validates all data, and has error handling.

## 📚 Related Documentation

- Task 2.6: AuthContext with Super Admin Methods
- Task 2.4: ModuleRegistry for Access Control
- Task 2.8: HTTP Interceptor for Impersonation Headers
- Task 3.5: Impersonation Banner Component
- Task 3.7: Session Timeout Widget

---

**Version**: 2025-02-16  
**Status**: Production Ready ✅
# Session Management - Quick Start Guide

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Read Time**: 5 minutes

---

## 🚀 Get Started in 3 Steps

### Step 1: Wrap Your App with SessionProvider

**File**: `src/modules/App.tsx`

```tsx
import SessionProvider from '@/providers/SessionProvider';

export default function App() {
  return (
    <SessionProvider>
      <Router>
        <AuthProvider>
          {/* Your app content */}
        </AuthProvider>
      </Router>
    </SessionProvider>
  );
}
```

**That's it!** Session management is now active.

### Step 2 (Optional): Customize Configuration

```tsx
import { sessionConfigService } from '@/services/sessionConfigService';

// Set preset for current environment
sessionConfigService.loadPreset('production');

// Or custom config
<SessionProvider config={{
  sessionTimeout: 3600,      // 1 hour
  idleTimeout: 1800,         // 30 minutes
  idleWarningTime: 300,      // 5 minutes
  checkInterval: 10000       // Check every 10 seconds
}}>
  <App />
</SessionProvider>
```

### Step 3 (Optional): Use in Components

```tsx
import { useSessionManager } from '@/hooks/useSessionManager';

export function MyComponent() {
  const { idleTime, timeRemaining, sessionInfo } = useSessionManager();

  return (
    <div>
      <p>Idle for: {idleTime} seconds</p>
      <p>Session valid: {sessionInfo.isValid ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

---

## 📊 What Happens Automatically

1. **User logs in** → Session monitoring starts
2. **User is active** → Idle timer resets automatically
3. **User becomes idle** → After 30 minutes (default):
   - Warning modal appears
   - Countdown shows (5 minutes)
   - User can click "Continue Working"
4. **User doesn't respond** → Auto-logout
5. **Redirect to login** → Session expired

---

## ⚙️ Configuration Presets

### Quick Selection

```typescript
// Development - Very permissive
sessionConfigService.loadPreset('development');
// 8 hour session, 2 hour idle timeout

// Production - Standard security
sessionConfigService.loadPreset('production');
// 1 hour session, 30 minute idle timeout

// High Security - Stricter
sessionConfigService.loadPreset('highSecurity');
// 30 minute session, 15 minute idle timeout

// Low Security - Very permissive
sessionConfigService.loadPreset('lowSecurity');
// 24 hour session, 12 hour idle timeout
```

---

## 🎯 Common Use Cases

### Use Case 1: Configure for Your Tenant

```typescript
// Get tenant config
const tenantConfig = await fetchTenantSessionConfig(tenantId);

// Apply config
<SessionProvider config={tenantConfig}>
  <App />
</SessionProvider>
```

### Use Case 2: Show Current Session Status

```tsx
function SessionStatus() {
  const { sessionInfo } = useSessionManager();

  return (
    <div>
      <p>User: {sessionInfo.user?.email}</p>
      <p>Session expires in: {sessionInfo.timeUntilExpiry}s</p>
      <p>Idle for: {sessionInfo.idleTime}s</p>
    </div>
  );
}
```

### Use Case 3: Allow User Manual Logout

```tsx
function UserMenu() {
  const { handleLogout } = useSessionManager();

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}
```

### Use Case 4: Reset Idle Timer on Specific Events

```tsx
function ImportantForm() {
  const { manualResetIdleTimer } = useSessionManager();

  const handleFormInteraction = () => {
    manualResetIdleTimer(); // Keep session active
  };

  return (
    <form onMouseMove={handleFormInteraction}>
      {/* form content */}
    </form>
  );
}
```

---

## 📱 What Users See

### Normal Workflow
```
User logs in
    ↓
Working actively
    ↓
Continue indefinitely (idle timer resets on activity)
```

### Idle Timeout Workflow
```
User stops working
    ↓
After 30 minutes of inactivity
    ↓
[WARNING MODAL APPEARS]
╔════════════════════════════════╗
║  Session Timeout Warning       ║
║  Your session will expire in:  ║
║         4:35                   ║ ⏱️
║                                ║
║ [Logout Now] [Continue Working]║
╚════════════════════════════════╝
    ↓
User clicks "Continue Working"
    ↓
Modal closes, continue working
```

---

## 🔧 Troubleshooting

### Q: Modal appears immediately after login
**A**: Reset idle timer on login (automatically done, check console logs)

### Q: User logged out while working
**A**: Adjust `idleWarningTime` to give more warning time

### Q: How do I extend session time?
**A**: Change `idleTimeout` in config:
```typescript
<SessionProvider config={{ idleTimeout: 3600 }}>
  {/* 1 hour instead of 30 minutes */}
</SessionProvider>
```

### Q: Can I disable idle detection?
**A**: Set very long timeout:
```typescript
<SessionProvider config={{ idleTimeout: 86400 }}>
  {/* 24 hours - effectively disabled */}
</SessionProvider>
```

### Q: Does it work with multiple tabs?
**A**: Each tab monitors independently (designed for security)

---

## ✅ Verification Checklist

After setup, verify:

- [ ] App doesn't crash on page load
- [ ] Login works normally
- [ ] Can see console logs about session
- [ ] Leave idle for configured time
- [ ] Warning modal appears with countdown
- [ ] Click "Continue Working" to dismiss
- [ ] Can complete work without interruption
- [ ] Logout button works
- [ ] Session data clears properly

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `src/utils/sessionManager.ts` | Core session logic |
| `src/components/auth/SessionExpiryWarningModal.tsx` | Warning UI |
| `src/hooks/useSessionManager.ts` | Component hook |
| `src/providers/SessionProvider.tsx` | App wrapper |
| `src/services/sessionConfigService.ts` | Configuration |

---

## 🎓 Learn More

For detailed documentation, see:
- **Full Guide**: `SESSION_MANAGEMENT_IMPLEMENTATION.md`
- **Code Comments**: In source files
- **Examples**: See components in `src/components/auth/`

---

## 🆘 Support

If you encounter issues:

1. **Check logs**: Open browser console (F12)
2. **Read troubleshooting**: See above
3. **Review full docs**: `SESSION_MANAGEMENT_IMPLEMENTATION.md`
4. **Check code comments**: In source files

---

**Ready to deploy!** 🚀
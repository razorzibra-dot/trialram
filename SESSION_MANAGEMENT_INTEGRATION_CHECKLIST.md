# Session Management - Integration Checklist

**Version**: 1.0.0  
**Status**: Ready for Integration  
**Time to Integrate**: 10 minutes

---

## 📋 Pre-Integration Checklist

### Prerequisites
- [ ] Node.js 16+ installed
- [ ] React 18+ (already in project)
- [ ] TypeScript 5.0+ (already in project)
- [ ] Ant Design 5+ (already in project)
- [ ] React Router 6+ (already in project)
- [ ] Latest code pulled from git

### Environment Setup
- [ ] `.env` file exists
- [ ] `VITE_API_ENVIRONMENT` set (development/production)
- [ ] Development server can run locally
- [ ] Build command works (`npm run build`)

---

## 🚀 Integration Steps

### Step 1: Verify New Files Are in Place

```bash
# Run this to verify all files created:
ls -la src/utils/sessionManager.ts
ls -la src/components/auth/SessionExpiryWarningModal.tsx
ls -la src/hooks/useSessionManager.ts
ls -la src/providers/SessionProvider.tsx
ls -la src/services/sessionConfigService.ts
```

**Checklist**:
- [ ] sessionManager.ts exists
- [ ] SessionExpiryWarningModal.tsx exists
- [ ] useSessionManager.ts exists
- [ ] SessionProvider.tsx exists
- [ ] sessionConfigService.ts exists

### Step 2: Verify Code Updates

**Check src/contexts/AuthContext.tsx**:

Look for these imports at the top:
```typescript
import { sessionConfigService } from '@/services/sessionConfigService';
```

Look for this method:
```typescript
const handleSessionExtension = React.useCallback(() => {
  console.log('[AuthContext] Session extended - user resumed work');
}, []);
```

Look for these lines in sessionManager.startSessionMonitoring:
```typescript
sessionManager.initialize(sessionConfigService.getConfig());
sessionManager.startSessionMonitoring(
  handleSessionExpiry,
  undefined,
  handleSessionExtension
);
```

**Checklist**:
- [ ] Import added
- [ ] handleSessionExtension exists
- [ ] initialize() call added
- [ ] Updated startSessionMonitoring() call

### Step 3: Update App Component

**File**: `src/modules/App.tsx` (or main app file)

Add these imports at the top:
```typescript
import SessionProvider from '@/providers/SessionProvider';
import { sessionConfigService } from '@/services/sessionConfigService';
```

Load configuration (optional but recommended):
```typescript
// Load production preset (or set your own)
sessionConfigService.loadPreset('production');
```

Wrap your app with SessionProvider:
```typescript
export default function App() {
  return (
    <SessionProvider config={sessionConfigService.getConfig()}>
      <BrowserRouter>
        <AuthProvider>
          {/* Your existing app content */}
        </AuthProvider>
      </BrowserRouter>
    </SessionProvider>
  );
}
```

**Checklist**:
- [ ] Imports added
- [ ] sessionConfigService preset loaded (optional)
- [ ] SessionProvider wraps app
- [ ] Config passed to provider

### Step 4: Build & Test

```bash
# Build the project
npm run build

# Expected output:
# ✓ built in 1m 19s (or similar)
# ✓ No TypeScript errors
# ✓ No ESLint warnings
```

**Checklist**:
- [ ] Build succeeds (0 errors)
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] dist/ folder created

### Step 5: Test in Development

```bash
# Start dev server
npm run dev

# Open http://localhost:5173 in browser
```

**Test Checklist**:
- [ ] App loads without errors
- [ ] No console errors on load
- [ ] Can log in successfully
- [ ] Session monitoring starts (check console)
- [ ] Can work normally without interruptions

### Step 6: Test Idle Detection

**How to test quickly**:

1. Open browser DevTools (F12)
2. Switch to production preset with very short timeout:
```javascript
// In browser console:
window.sessionConfigService?.updateConfigValue('idleTimeout', 10);
window.sessionConfigService?.updateConfigValue('idleWarningTime', 5);
```

3. Wait 10 seconds without activity
4. Modal should appear with countdown
5. Click "Continue Working" to dismiss

**Checklist**:
- [ ] Modal appears after idle timeout
- [ ] Countdown timer displays
- [ ] "Continue Working" button works
- [ ] Modal closes on button click
- [ ] Can continue working

### Step 7: Test Auto-Logout

**How to test auto-logout**:

1. Set very short timeout:
```javascript
window.sessionConfigService?.updateConfigValue('idleTimeout', 10);
window.sessionConfigService?.updateConfigValue('idleWarningTime', 3);
```

2. Wait for modal to appear
3. Don't click any button
4. Wait 3 seconds for timer to expire
5. Auto-logout should trigger

**Checklist**:
- [ ] Modal appears
- [ ] Timer counts down
- [ ] Auto-logout occurs when timer = 0
- [ ] Redirected to /login
- [ ] Notification shown

### Step 8: Test Session Extension

**How to test extension**:

1. Set short timeout:
```javascript
window.sessionConfigService?.updateConfigValue('idleTimeout', 10);
window.sessionConfigService?.updateConfigValue('idleWarningTime', 5);
```

2. Wait for modal to appear
3. Click "Continue Working"
4. Modal closes
5. Can continue working indefinitely

**Checklist**:
- [ ] Modal appears
- [ ] "Continue Working" button works
- [ ] Modal closes
- [ ] Idle timer resets
- [ ] Can continue working

---

## ✅ Verification Checklist

### Code Integration
- [ ] All 5 new files in place
- [ ] AuthContext.tsx updated
- [ ] App.tsx wrapped with SessionProvider
- [ ] Imports all resolve (no red squiggles)

### Build Verification
- [ ] `npm run build` succeeds
- [ ] 0 TypeScript errors
- [ ] 0 ESLint warnings
- [ ] dist/ folder created

### Functionality Verification
- [ ] App loads without console errors
- [ ] Login works normally
- [ ] Session starts on login
- [ ] Activity tracked (no console errors)
- [ ] Idle detection triggers after timeout
- [ ] Warning modal appears
- [ ] Countdown timer works
- [ ] "Continue Working" extends session
- [ ] "Logout Now" logs out immediately
- [ ] Auto-logout works if timer expires
- [ ] Redirects to /login on logout
- [ ] Can log back in

### Type Safety
- [ ] No TypeScript errors
- [ ] All imports resolve
- [ ] No red squiggles in IDE
- [ ] IntelliSense works for new exports

### Performance
- [ ] No noticeable slowdown
- [ ] No memory leaks (check DevTools)
- [ ] Console clean (no warnings)
- [ ] Browser DevTools Performance tab smooth

### Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works on Mobile (if applicable)

---

## 🔧 Optional: Advanced Configuration

### Change Session Timeouts

**Option 1: Update Preset**
```typescript
// In src/modules/App.tsx
sessionConfigService.loadPreset('highSecurity');
// or 'development', 'lowSecurity'
```

**Option 2: Custom Config**
```typescript
<SessionProvider config={{
  sessionTimeout: 7200,      // 2 hours
  idleTimeout: 3600,         // 1 hour
  idleWarningTime: 600,      // 10 minutes
  checkInterval: 15000       // 15 seconds
}}>
  {/* app */}
</SessionProvider>
```

**Option 3: From Environment**
```typescript
sessionConfigService.initializeFromEnvironment();
// Uses VITE_API_ENVIRONMENT to load preset
```

### Add Session Info to Page

**In any component**:
```typescript
import { useSessionManager } from '@/hooks/useSessionManager';

export function SessionStatus() {
  const { idleTime, sessionInfo } = useSessionManager();
  
  return (
    <div>
      <p>Idle: {idleTime}s</p>
      <p>Expires in: {sessionInfo.timeUntilExpiry}s</p>
    </div>
  );
}
```

### Manual Reset Idle Timer

**In components that need it**:
```typescript
const { manualResetIdleTimer } = useSessionManager();

// Reset on important action
const handleImportantAction = () => {
  manualResetIdleTimer();
  // ... do action
};
```

---

## 🧪 Testing Commands

### Quick Test Suite
```bash
# 1. Build
npm run build

# 2. Start dev server
npm run dev

# 3. In browser console:
# Test idle timeout
localStorage.setItem('crm_session_debug', 'true');
window.sessionManager.getSessionInfo();

# 4. Leave idle
# Wait for timeout and verify modal appears
```

### Manual Testing Scenarios

**Test 1: Normal Login**
```
1. Go to /login
2. Enter credentials
3. Should see dashboard
4. Check console: '[SessionManager] Activity detected'
```

**Test 2: Idle Warning**
```
1. Log in
2. Set short timeout: 
   sessionConfigService.updateConfigValue('idleTimeout', 30)
3. Wait 30 seconds
4. Modal appears
```

**Test 3: Session Extension**
```
1. Wait for modal
2. Click "Continue Working"
3. Modal closes
4. Idle timer resets to 0
```

**Test 4: Auto-Logout**
```
1. Wait for modal
2. Don't click anything
3. Timer reaches 0
4. Auto-redirect to /login
```

---

## 🆘 Troubleshooting During Integration

### Issue: Files not found
**Solution**: 
- Verify files exist with `ls` command
- Check file paths match exactly
- Ensure IDE detects new files (may need reload)

### Issue: Build fails
**Solution**:
- Run `npm install` to ensure dependencies
- Check for TypeScript errors: `npx tsc --noEmit`
- Check for ESLint issues: `npm run lint`
- Check browser console for import errors

### Issue: Modal doesn't appear
**Solution**:
- Verify SessionProvider wraps app
- Check that user is authenticated
- Check browser console for errors
- Verify idle timeout is configured

### Issue: Type errors
**Solution**:
- Ensure TypeScript version is 5.0+
- Run `npm install` to update types
- Reload IDE (VS Code: Cmd/Ctrl+Shift+P → "Reload Window")
- Check that paths in tsconfig are correct

### Issue: Session logging out immediately
**Solution**:
- Check if handleSessionExtension is defined
- Verify sessionManager.initialize() is called
- Check if token is valid
- See authService.getToken() in console

---

## 📚 Documentation References

After integration, review these docs:

1. **For Quick Start**: `SESSION_MANAGEMENT_QUICK_START.md`
2. **For Configuration**: `SESSION_MANAGEMENT_CONFIG_GUIDE.md`
3. **For Details**: `SESSION_MANAGEMENT_IMPLEMENTATION.md`
4. **For Testing**: `SESSION_MANAGEMENT_VERIFICATION.md`
5. **For Troubleshooting**: `SESSION_MANAGEMENT_IMPLEMENTATION.md` (🐛 section)

---

## ✅ Integration Complete!

Once all checks pass, your session management is integrated and ready.

### Next Steps
- [ ] Review documentation
- [ ] Adjust timeouts for your use case
- [ ] Configure for your environment
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Gather user feedback

### Support
- Check documentation files
- Review code comments in source files
- Check browser console for debug logs
- Look for `[SessionManager]` prefixed logs

---

## 📊 Integration Summary

| Task | Status | Notes |
|------|--------|-------|
| Files Created | ✅ | 5 new files |
| Files Modified | ✅ | 1 file (15 lines) |
| App Wrapped | ⏳ | Needs SessionProvider |
| Build | ⏳ | Test with `npm run build` |
| Tests | ⏳ | Manual testing required |
| Configuration | ⏳ | Optional customization |

---

## 🎯 Success Criteria

Your integration is successful when:

✅ Build passes (0 errors)  
✅ App loads without errors  
✅ Can log in successfully  
✅ Idle detection works  
✅ Warning modal appears  
✅ Session extension works  
✅ Auto-logout works  
✅ No console errors  

**Estimated Time**: 10-15 minutes  
**Difficulty**: Easy  
**Support**: Full documentation provided

---

**Ready to integrate! Follow the steps above and you'll be done in 10 minutes.** ✅
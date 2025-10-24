# Logout Testing Guide - Quick Reference

## 🚀 Quick Test (5 Minutes)

### Step 1: Start the Application
```bash
npm run dev
```

### Step 2: Login
- Open browser to `http://localhost:5173`
- Login with any valid credentials
- Wait for dashboard to load

### Step 3: Test Logout
1. Look for logout button (usually in user menu/avatar)
2. Click logout
3. **Observe**: Should redirect to `/login`
4. **Verify**: Stays on login page (no redirect back to dashboard)

### Step 4: Verify Session Cleared
1. Open DevTools (F12)
2. Go to Application → Local Storage
3. Look for `crm_auth_token` and `crm_user`
4. **Verify**: Both keys should be gone (not present)

### Step 5: Verify Can't Access Protected Routes
1. Try to navigate directly to dashboard URL
2. **Expected**: Redirected back to login
3. **Verify**: Cannot access any protected pages

---

## 🧪 Comprehensive Test (15 Minutes)

### Test 1: Basic Logout ✅

**Procedure**:
1. Login → Click logout → Check results

**Expected**:
- Redirected to `/login`
- `isAuthenticated` = false
- localStorage cleared
- Can't access protected routes

**Check Console**:
```
[ProtectedRoute] User not authenticated, redirecting to login
```

---

### Test 2: Logout Persistence ✅

**Procedure**:
1. Logout successfully
2. Refresh the page (F5)
3. Check if still on login

**Expected**:
- Still on login page
- NOT auto-logged in
- Session not restored

**Why This Matters**:
- Ensures logout is permanent
- Prevents automatic re-login

---

### Test 3: Session Expiry (Requires Config Change) ✅

**Setup** (Optional - for testing idle timeout):
```typescript
// Temporarily edit: src/services/sessionConfigService.ts
// In getConfig() method, change for testing:
const config: SessionConfig = {
  sessionTimeout: 60,        // 1 minute (instead of 3600)
  idleTimeout: 30,          // 30 seconds (instead of 1800)
  idleWarningTime: 5,       // 5 seconds (instead of 300)
  checkInterval: 1000       // 1 second (instead of 10000)
};
```

**Procedure**:
1. Login with modified config
2. Wait for warning modal (should appear in 25 seconds)
3. Click "Logout Now"
4. Verify redirected to login

**Expected**:
- Warning modal appears after idle time
- Logout works from modal
- Session properly cleaned up

---

### Test 4: Session Extension ✅

**Procedure** (with modified config):
1. Login
2. Wait for warning modal
3. Click "Continue Working"
4. Verify modal closes
5. Continue working normally

**Expected**:
- Modal closes
- Session extends
- Idle timer resets
- Can continue working

---

### Test 5: Multiple Logout Attempts ✅

**Procedure**:
1. Login
2. Click logout twice quickly
3. Check browser console

**Expected**:
- First logout completes
- Second logout is handled gracefully
- No errors in console

**Check Console**:
- Should log once: `[SessionProvider] Session expired, logging out...`
- Not repeated twice

---

### Test 6: Browser Tab Close ✅

**Procedure**:
1. Login
2. Open app in two browser tabs
3. Logout in tab 1
4. Try to use tab 2

**Expected**:
- Tab 2 should detect logout
- Redirect to login on next action

---

### Test 7: Network Error During Logout ✅

**Procedure**:
1. Open DevTools Network tab
2. Set throttling to "Offline"
3. Click logout
4. Observe behavior

**Expected**:
- Even with network error
- User still logged out locally
- Redirected to login after delay
- Console shows error but fallback works

---

## 🔍 Debugging Checklist

### Browser Console
```
✅ No red errors
✅ No warnings about undefined variables
✅ Session events logged properly
```

### Application Tab (DevTools)
```
✅ Local Storage: crm_auth_token (removed after logout)
✅ Local Storage: crm_user (removed after logout)
✅ Session Storage: (cleared)
```

### Network Tab
```
✅ Logout API call succeeds (or fails gracefully)
✅ Redirect happens cleanly
```

### Auth State
```
✅ isAuthenticated: false (after logout)
✅ user: null
✅ token: null
```

---

## 🚨 Common Issues & Fixes

### Issue 1: User Redirected Back to Dashboard

**Symptoms**:
- Logout → Login → Dashboard (redirects back)

**Debug Steps**:
1. Check DevTools Console for errors
2. Check if `isAuthenticated` is still `true`
3. Check if tokens still in localStorage

**Fix**:
- Clear browser cache
- Restart dev server: `npm run dev`
- Check if SessionProvider is integrated in AppProviders

**Verify Fix**:
```typescript
// AppProviders.tsx should contain:
<AuthProvider>
  <SessionProvider>
    <ScrollStateProvider>
      {children}
    </ScrollStateProvider>
  </SessionProvider>
</AuthProvider>
```

---

### Issue 2: Logout Takes Too Long (>2 seconds)

**Debug**:
1. Check Network tab for slow API call
2. Check console for errors
3. Monitor state update timing

**Expected**: Logout completes in <500ms

---

### Issue 3: Can Still Access Dashboard After Logout

**Debug Steps**:
1. Logout successfully
2. Directly navigate to `/tenant/dashboard`
3. Check if redirects to `/login`

**Expected**: Should redirect to login

**If Not**:
- Check ProtectedRoute component
- Check AuthContext initialization
- Clear localStorage and try again

---

### Issue 4: Warning Modal Never Appears

**Check**:
1. Is idle timeout configured?
2. Are you actually idle?
3. Try moving mouse/keyboard to ensure not detected as active

**Debug**:
```typescript
// In browser console:
// Get session manager state
sessionStorage.getItem('session_idle_time')
```

---

## 📊 Performance Metrics

### Expected Times
| Action | Expected Time | Actual Time |
|--------|-------|-------|
| Logout Start | 0ms | _____ |
| State Update | <100ms | _____ |
| Navigation | <150ms | _____ |
| **Total** | <150ms | _____ |

---

## ✅ Final Checklist

Before considering logout fixed:

- [ ] User can logout from any page
- [ ] After logout, redirects to `/login`
- [ ] Stays on login page (no redirect back to dashboard)
- [ ] Refresh page after logout → still on login
- [ ] Tokens removed from localStorage
- [ ] Can't access protected routes after logout
- [ ] Session warning modal works (if testing idle)
- [ ] Can extend session from warning modal
- [ ] Multiple logout attempts handled gracefully
- [ ] Error handling works (network offline scenario)
- [ ] Console shows no errors
- [ ] Build succeeds: `npm run build`

---

## 🎯 What to Report if Issues Persist

If logout still redirects back to dashboard, please check:

1. **Is SessionProvider integrated?**
   ```bash
   grep -r "SessionProvider" src/components/providers/AppProviders.tsx
   ```

2. **Build without errors?**
   ```bash
   npm run build
   ```

3. **Console errors?**
   - Take screenshot of DevTools console
   - Note exact error messages

4. **Browser info?**
   - Browser version
   - Operating system
   - Any extensions enabled

5. **Auth state during logout?**
   - Add logs to AuthContext.logout()
   - Check each step completes

---

## 📋 Example Test Report

```markdown
## Logout Fix Verification - PASSED ✅

**Date**: [TODAY]
**Tester**: [NAME]
**Browser**: Chrome 120.0.6099.0
**OS**: Windows 11

### Test Results:
- Basic Logout: ✅ PASS
- Logout Persistence: ✅ PASS  
- Session Clearing: ✅ PASS
- Protected Route Access: ✅ PASS
- Error Handling: ✅ PASS
- Build: ✅ PASS (0 errors)
- Console: ✅ PASS (no errors)

### Issues Found:
- None

### Conclusion:
Logout functionality working correctly. No redirect back to dashboard.
```

---

**🎉 If all tests pass, logout fix is complete and working!**
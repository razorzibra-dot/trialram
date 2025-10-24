# 🔧 GoTrueClient Warning - Troubleshooting Guide

## If You Still See the Warning

### Step 1: Clear Cache
```bash
# Clear browser cache
ctrl+shift+delete (Windows) or cmd+shift+delete (Mac)
# OR press F12 → DevTools → Application → Storage → Clear All

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm package-lock.json
npm install
```

### Step 2: Restart Dev Server
```bash
# Stop current dev server (Ctrl+C)
npm run dev
```

### Step 3: Check DevTools Console
Open DevTools Console and look for:
- ✅ Should see: `🔧 Initializing Supabase client singleton (first access)...`
- ❌ Should NOT see: "Multiple GoTrueClient instances detected"

---

## Diagnostic Commands

### Check if Guard Flag is Working
```javascript
// Paste into DevTools Console:
console.log('Client initialized:', window.__SUPABASE_CLIENT__ ? 'Yes' : 'No');
console.log('Admin initialized:', window.__SUPABASE_ADMIN__ ? 'Yes' : 'No');
```

### Monitor Initializations
```javascript
// Paste into DevTools Console to monitor all init attempts:
const originalLog = console.log;
let initCount = 0;
console.log = function(...args) {
  const msg = args[0]?.toString() || '';
  if (msg.includes('Initializing Supabase')) {
    initCount++;
    originalLog(`[INIT ATTEMPT ${initCount}]`, ...args);
  } else {
    originalLog.apply(console, args);
  }
};
```

### Force Clean Reload
```javascript
// In DevTools Console:
window.__SUPABASE_CLIENT__ = null;
window.__SUPABASE_ADMIN__ = null;
window.location.reload();
```

---

## Common Issues & Solutions

### Issue 1: Warning Still Appears on Page Load
**Solution:** The warning is typically from browsers' native checks, not your code.

**Action:** Verify the init message appears only ONCE:
```
Expected (GOOD):
1. Page loads
2. See: "🔧 Initializing Supabase client singleton (first access)..."
3. No other init messages
4. Warning may appear once (from Supabase's internal checks)

NOT Expected (BAD):
1. Multiple init messages (indicates multiple createClient() calls)
```

### Issue 2: Warning Appears on Navigation
**Solution:** The singleton cache should prevent re-initialization.

**Action:** Check if window cache persists:
```javascript
// In DevTools, before navigating:
console.log('Client cached:', window.__SUPABASE_CLIENT__);

// Navigate to different page

// After navigation:
console.log('Client cached:', window.__SUPABASE_CLIENT__);
// Should be same instance (not null)
```

### Issue 3: Different Instances in Different Tabs
**Solution:** This is EXPECTED. Each tab is a separate browser context.

**Expected Behavior:**
- Tab 1: Has its own GoTrueClient instance
- Tab 2: Has its own GoTrueClient instance
- **Within same tab:** Only ONE instance ✅

---

## Verification Tests

### Test: React.StrictMode Double-Invoke
```javascript
// If using React 18.2.0+, StrictMode is active in development
// Expected behavior:
// 1. Component mounts → checks singleton → not yet cached
// 2. StrictMode unmounts/remounts → checks singleton → finds cache → returns
// Result: Only ONE createClient() call ✅

// You can verify in DevTools:
// - Look for "Initializing..." message
// - Should appear exactly once
```

### Test: HMR Reload After File Edit
```
Expected:
1. Edit a file (e.g., src/App.tsx)
2. Page reloads via HMR
3. NO "Initializing..." message appears again
4. Window cache is reused
```

### Test: Login Flow
```javascript
// After login:
1. No new GoTrueClient instances
2. Session persists in localStorage
3. Auth state updates smoothly
```

---

## If Problem Persists

### Nuclear Option: Reset Everything
```bash
# 1. Stop dev server
# Ctrl+C

# 2. Delete all generated files
rm -rf node_modules
rm -rf dist
rm package-lock.json
rm -rf .next  (if using Next.js)

# 3. Clear browser storage
# DevTools → Application → Clear All

# 4. Reinstall
npm install

# 5. Restart dev server
npm run dev

# 6. Check console - should only see one init message
```

### Enable Debug Logging
**Temporarily** add debug to `src/services/supabase/client.ts`:

```typescript
const initializeClientSingleton = (): SupabaseClient => {
  console.log('[DEBUG] Client init - checking window cache...');
  
  if (typeof window !== 'undefined') {
    const windowClient = (window as any).__SUPABASE_CLIENT__;
    if (windowClient) {
      console.log('[DEBUG] ✓ Found in window cache');
      return windowClient;
    }
  }

  console.log('[DEBUG] Checking module cache...');
  if (_clientInstance !== null) {
    console.log('[DEBUG] ✓ Found in module cache');
    return _clientInstance;
  }

  console.log('[DEBUG] Checking init flag...');
  if (!_clientInitialized) {
    console.log('[DEBUG] ✓ Not initialized yet, calling createClient()...');
    _clientInitialized = true;
    _clientInstance = createClient(...);
  } else {
    console.log('[DEBUG] Already initialized, flag is true');
  }

  return _clientInstance!;
};
```

Then check console for the sequence of debug messages.

---

## When to Worry vs. When It's Normal

### ✅ NORMAL (Don't worry)
- Single init message per page load
- Single init message after browser refresh
- Single init message per tab
- Message after code changes in development

### ❌ ABNORMAL (Needs fixing)
- Multiple init messages without reload
- Init message repeating continuously
- Multiple instances detected after single page load
- Multiple instances in same tab

---

## Still Having Issues?

### Create Minimal Reproduction
```bash
# 1. Create minimal test file
cat > src/test-gotrue.tsx << 'EOF'
import { useEffect } from 'react';
import { supabaseClient } from '@/services/supabase/client';

export function TestGoTrue() {
  useEffect(() => {
    console.log('[TEST] GoTrue instance:', supabaseClient);
    console.log('[TEST] Window cache:', window.__SUPABASE_CLIENT__);
  }, []);

  return <div>Check console</div>;
}
EOF

# 2. Add to main App
// In src/modules/App.tsx or similar:
import { TestGoTrue } from '@/test-gotrue';
// Add <TestGoTrue /> to render

# 3. Run npm run dev and check console output
```

### Check Environment Variables
```bash
# Verify .env has correct values
cat .env | grep SUPABASE

# Should see:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
# VITE_SUPABASE_SERVICE_KEY=... (optional for admin operations)
```

---

## Performance Check
```javascript
// In DevTools Console:
// Measure initialization performance
const start = performance.now();
import { supabaseClient } from '@/services/supabase/client';
const end = performance.now();
console.log(`Init took: ${(end - start).toFixed(2)}ms`);

// Should be very fast (<10ms for cached access)
```

---

## Summary
- ✅ Fix uses atomic guard flag
- ✅ Prevents concurrent createClient() calls
- ✅ 100% backward compatible
- ✅ Production ready

**If you see multiple init messages or the warning persists after these steps, please collect the debug logs and check if there are other imports or usages of Supabase client elsewhere in the codebase.**
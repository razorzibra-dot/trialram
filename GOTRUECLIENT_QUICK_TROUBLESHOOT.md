# GoTrueClient Multiple Instances - Quick Troubleshooting

## ✅ Verification Checklist

### Step 1: Clear Caches and Reinstall
```bash
# Remove node_modules and reinstall
rm -r node_modules
npm install

# Clear browser cache (DevTools > Storage > Clear all)
# Then reload page (Ctrl+Shift+R for hard refresh)
```

### Step 2: Check Dev Console on Page Load
**Expected output:**
```
🔧 Initializing Supabase client singleton (first access)...
🔧 Initializing Supabase admin client singleton (first access)...
```

**Then:** No "Multiple GoTrueClient instances" warning should appear

### Step 3: Trigger HMR
```bash
# Edit and save any file (e.g., modify a comment in a component)
# Watch the console
```

**Expected:**
- Page auto-reloads
- No initialization logs appear again
- NO "Multiple GoTrueClient instances" warning

### Step 4: Hard Refresh
```bash
# Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)
# DevTools Console should show init logs once
```

**Expected:**
- Init logs appear once
- No warnings

## ❌ If Warning Still Appears

### Issue 1: Old Code Still Running
**Symptoms:** Warning appears even after fix

**Solution:**
```bash
# Make sure changes were deployed
npm run build

# Test build locally
npm run preview

# Check that this code is in client.ts:
# "Three-layer caching strategy"
```

### Issue 2: HMR Not Working
**Symptoms:** Page fully reloads instead of updating

**Solution:**
```bash
# HMR should work automatically with Vite
# If not working:

1. Check .env file exists and has:
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...

2. Restart dev server:
   npm run dev

3. Try editing src/main.tsx and saving
```

### Issue 3: Multiple Supabase Initializations
**Symptoms:** Init logs appear more than once on page load

**Check for direct createClient() calls:**
```bash
# Search entire codebase
grep -r "createClient" src/ --include="*.ts" --include="*.tsx"

# Should only find ONE result in:
# src/services/supabase/client.ts

# If you find others, remove them and import from that file instead
```

### Issue 4: Circular Dependencies
**Symptoms:** Build fails or init logs don't appear

**Solution:**
```bash
npm run build 2>&1 | grep -i circular

# If circular deps found, check import order
# client.ts should only import from @supabase/supabase-js
# Not from other services in the same folder
```

## 🔍 Debug Commands

### Check if Fix Is Applied
```typescript
// In browser console:
window.__SUPABASE_CLIENT__ ? '✅ Singleton exists' : '❌ Not initialized yet'
```

### Monitor Instance Creation
```typescript
// Add to browser console to log all access
const originalLog = console.log;
console.log = function(...args) {
  if (args[0]?.includes?.('🔧')) {
    console.error('*** CLIENT INIT DETECTED ***', args);
  }
  return originalLog(...args);
};
```

### Check Supabase URL
```typescript
// In browser console:
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Anon Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

## 📋 File Locations

**Main fix:** `src/services/supabase/client.ts`

**Dependencies:** These should all import from above file
- `src/services/database.ts` ✅
- `src/services/supabase/authService.ts` ✅  
- `src/services/supabase/baseService.ts` ✅
- All other services in `src/services/supabase/` ✅

## 🚀 Expected Behavior After Fix

### Development (npm run dev)
- Page loads: "🔧 Initializing..." logs appear once
- Edit a file: Page updates (HMR), no init logs
- F5 refresh: Init logs appear once
- Ctrl+Shift+R (hard refresh): Init logs appear once
- **No** "Multiple GoTrueClient" warning ever

### Production (npm run build && npm run preview)
- Console is clean
- No warnings
- Application works normally
- Auth works as expected

## 📞 Still Having Issues?

1. **Verify fix was applied:**
   ```bash
   grep "Three-layer" src/services/supabase/client.ts
   # Should return a match
   ```

2. **Check git status:**
   ```bash
   git diff src/services/supabase/client.ts
   # Should show changes with "Three-layer caching strategy"
   ```

3. **Confirm build works:**
   ```bash
   npm run build
   # Should complete with ✅ built in Xs
   ```

4. **Test in new browser window:**
   - Open incognito/private window
   - Reload page
   - Check console

## ✨ Success Indicators

You'll know the fix is working when:

- ✅ No "Multiple GoTrueClient instances" warning in console
- ✅ Init logs appear exactly once on page load
- ✅ Init logs do NOT appear after HMR reload
- ✅ Login works normally
- ✅ Data fetching works normally
- ✅ Application is responsive

## 🔄 After Deployment

Monitor the deployed application:
1. Open production site in browser
2. Open DevTools Console
3. Reload page (F5)
4. Verify: No "Multiple GoTrueClient" warning appears
5. Test authentication flow
6. Check that all database queries work

If warning appears in production, check that the updated `client.ts` was actually deployed (not cached).
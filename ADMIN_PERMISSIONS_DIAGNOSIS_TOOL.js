/**
 * ADMIN PERMISSIONS DIAGNOSIS TOOL
 * ================================
 * Paste this into Browser F12 Console while logged in as admin
 * This will help identify why CRUD buttons are hidden
 */

console.log('%c=== ADMIN PERMISSIONS DIAGNOSIS TOOL ===', 'font-size: 16px; font-weight: bold; color: #1890ff;');

async function diagnoseAdminPermissions() {
  console.log('\n📋 STEP 1: Checking AuthContext...');
  
  // Try to access React DevTools or local storage
  const authState = localStorage.getItem('auth-storage');
  console.log('Auth Storage:', authState ? JSON.parse(authState) : 'NOT FOUND');
  
  const userData = localStorage.getItem('user-data');
  console.log('User Data:', userData ? JSON.parse(userData) : 'NOT FOUND');

  console.log('\n📋 STEP 2: Checking Supabase Session...');
  try {
    // Try to get session from Supabase
    const response = await fetch('/api/auth/session', {
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) {
      const session = await response.json();
      console.log('Session:', session);
    }
  } catch (e) {
    console.log('Could not fetch session:', e.message);
  }

  console.log('\n📋 STEP 3: DOM Analysis - Searching for Hidden/Missing Buttons...');
  
  // Check if Create button exists
  const createButton = document.querySelector('button:has-text("New Deal")') 
    || Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('New Deal'))
    || Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Create'))
    || Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Add'));

  console.log('Create Button Found:', createButton ? 'YES' : 'NO');
  if (createButton) {
    console.log('  - Display:', window.getComputedStyle(createButton).display);
    console.log('  - Visibility:', window.getComputedStyle(createButton).visibility);
    console.log('  - Opacity:', window.getComputedStyle(createButton).opacity);
    console.log('  - Element:', createButton);
  }

  console.log('\n📋 STEP 4: Checking Table Action Buttons...');
  const actionButtons = document.querySelectorAll('[role="button"]');
  console.log(`Found ${actionButtons.length} action buttons`);
  
  let editCount = 0, deleteCount = 0;
  actionButtons.forEach(btn => {
    const text = btn.textContent;
    if (text.includes('Edit')) editCount++;
    if (text.includes('Delete')) deleteCount++;
  });
  
  console.log(`  - Edit buttons: ${editCount}`);
  console.log(`  - Delete buttons: ${deleteCount}`);

  console.log('\n📋 STEP 5: Check User Role in DOM Elements...');
  // Look for any data attributes or text that shows user role
  const userElements = document.querySelectorAll('[data-testid*="user"], [class*="user"], .ant-dropdown-trigger');
  console.log(`Found ${userElements.length} potential user elements`);
  userElements.forEach((el, i) => {
    if (el.textContent.length < 100) {
      console.log(`  [${i}] ${el.textContent.trim().substring(0, 50)}`);
    }
  });

  console.log('\n📋 STEP 6: React Component Tree Check...');
  const root = document.getElementById('root');
  if (root) {
    console.log('React root found');
    // Look for any error boundaries or error messages
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
    if (errorElements.length > 0) {
      console.warn('⚠️  Found error elements:', errorElements.length);
      errorElements.forEach(el => console.warn(el.textContent.substring(0, 100)));
    }
  }

  console.log('\n📋 STEP 7: Network/API Check...');
  // Check if there are any failed network requests
  console.log('Check DevTools Network tab for:');
  console.log('  1. Any 401/403 (Unauthorized/Forbidden) responses');
  console.log('  2. Failed permission API calls');
  console.log('  3. Failed user data API calls');

  console.log('\n' + '='.repeat(50));
  console.log('DIAGNOSIS CHECKLIST:');
  console.log('='.repeat(50));
  console.log('✅ 1. Is user logged in? Check "User Data" above');
  console.log('✅ 2. Is user.role set to "admin"? Check localStorage values');
  console.log('✅ 3. Are buttons in DOM but hidden? Check computed styles above');
  console.log('✅ 4. Are there permission check errors? Check console for warnings');
  console.log('✅ 5. Are there API failures? Check Network tab (F12 → Network)');
  console.log('\n' + '='.repeat(50));
  console.log('NEXT STEPS BASED ON FINDINGS:');
  console.log('='.repeat(50));
  console.log('\n❌ If user.role is NOT "admin":');
  console.log('   → Run in Supabase: UPDATE users SET role=\'admin\' WHERE id=YOUR_USER_ID');
  console.log('   → Then refresh page and re-login');
  
  console.log('\n❌ If buttons are hidden (display: none):');
  console.log('   → Issue: hasPermission() returned false');
  console.log('   → Run: console.log(localStorage.getItem(\'auth-storage\'))');
  console.log('   → Check if permissions are loaded');
  
  console.log('\n❌ If API calls failed (401/403):');
  console.log('   → Issue: Authentication problem');
  console.log('   → Run: localStorage.clear()');
  console.log('   → Refresh page and login again');
}

// Run the diagnosis
diagnoseAdminPermissions();

console.log('\n💡 TIP: Also run this to check the user object more deeply:');
console.log('   console.log("Auth Context:", JSON.parse(localStorage.getItem("auth-storage") || "{}"))');
console.log('   console.log("User Data:", JSON.parse(localStorage.getItem("user-data") || "{}"))');
/**
 * ADVANCED ADMIN PERMISSIONS DIAGNOSTIC
 * 
 * HOW TO USE:
 * 1. Open browser Developer Tools (F12)
 * 2. Copy the entire contents of this file
 * 3. Paste into the Console tab
 * 4. Run: advancedDebugAdminPermissions()
 * 5. Review the output
 * 
 * This will help identify WHY admin buttons are hidden
 */

async function advancedDebugAdminPermissions() {
  console.clear();
  console.log('%c╔════════════════════════════════════════════════════════════════╗', 'color: blue; font-weight: bold;');
  console.log('%c║       ADMIN PERMISSIONS DIAGNOSTIC REPORT                     ║', 'color: blue; font-weight: bold;');
  console.log('%c╚════════════════════════════════════════════════════════════════╝', 'color: blue; font-weight: bold;');

  // ================================================================================
  // SECTION 1: Check Stored Session
  // ================================================================================
  console.log('\n%c═ SECTION 1: Session & User Data ═', 'color: #2196F3; font-weight: bold; font-size: 12px;');

  const storedUser = JSON.parse(localStorage.getItem('crm_user') || 'null');
  const storedToken = localStorage.getItem('crm_auth_token');
  const storedSession = JSON.parse(localStorage.getItem('supabase_session') || 'null');

  console.log('✓ Stored User Object:', storedUser);
  console.log('✓ Auth Token Present:', !!storedToken);
  console.log('✓ Session Present:', !!storedSession);

  if (!storedUser) {
    console.error('❌ NO USER STORED - Not logged in or session expired');
    console.log('\n%c📋 RECOMMENDATION: Log out and log back in', 'color: orange; font-weight: bold;');
    return;
  }

  // ================================================================================
  // SECTION 2: User Details Analysis
  // ================================================================================
  console.log('\n%c═ SECTION 2: User Details Analysis ═', 'color: #2196F3; font-weight: bold; font-size: 12px;');

  const userInfo = {
    'ID': storedUser.id,
    'Email': storedUser.email,
    'Name': storedUser.name,
    'First Name': storedUser.firstName || '(undefined)',
    'Last Name': storedUser.lastName || '(undefined)',
    'ROLE': storedUser.role || '(MISSING - THIS IS THE PROBLEM!)',
    'Status': storedUser.status || '(undefined)',
    'Tenant ID': storedUser.tenantId || storedUser.tenant_id || '(undefined)',
    'Created At': storedUser.createdAt || '(undefined)',
    'Last Login': storedUser.lastLogin || '(undefined)',
  };

  console.table(userInfo);

  // Check for critical issues
  const issues = [];
  if (!storedUser.role) {
    issues.push('❌ CRITICAL: User role is MISSING or NULL');
  } else if (storedUser.role !== 'admin') {
    issues.push(`❌ CRITICAL: User role is '${storedUser.role}' but expected 'admin'`);
  } else {
    console.log('%c✅ User role is correctly set to "admin"', 'color: green; font-weight: bold;');
  }

  if (!storedUser.tenantId && !storedUser.tenant_id) {
    issues.push('⚠️  WARNING: Tenant ID is missing');
  }

  if (storedUser.name === 'undefined undefined') {
    issues.push('⚠️  INFO: Name field has naming issue (camelCase vs snake_case bug)');
  }

  if (issues.length > 0) {
    console.log('\n%c🔴 ISSUES FOUND:', 'color: red; font-weight: bold;');
    issues.forEach(issue => console.log('%c  ' + issue, 'color: red;'));
  }

  // ================================================================================
  // SECTION 3: Permission System Analysis
  // ================================================================================
  console.log('\n%c═ SECTION 3: Permission System ═', 'color: #2196F3; font-weight: bold; font-size: 12px;');

  // Check if authService exists globally
  // The actual authService won't be global, so we'll test through a component
  console.log('Attempting to access permission system...');

  // Try to get authService from React
  try {
    // This is a workaround - we'll check by examining what's available
    const hasAuth = typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';
    console.log('React DevTools Available:', hasAuth);
  } catch (e) {
    console.log('Could not detect React DevTools');
  }

  // ================================================================================
  // SECTION 4: Check Permission Logic
  // ================================================================================
  console.log('\n%c═ SECTION 4: Expected Permission Logic ═', 'color: #2196F3; font-weight: bold; font-size: 12px;');

  if (storedUser.role === 'admin') {
    console.log('%c✅ Admin role has these permissions:', 'color: green; font-weight: bold;');
    const adminPermissions = [
      'read', 'write', 'delete',
      'manage_customers', 'manage_sales', 'manage_tickets', 'manage_complaints',
      'manage_contracts', 'manage_service_contracts', 'manage_products', 'manage_product_sales', 'manage_job_works',
      'manage_users', 'manage_roles', 'view_analytics', 'manage_settings', 'manage_companies'
    ];
    console.table(adminPermissions);

    console.log('\n%c✅ Permission mapping for CRUD operations:', 'color: green; font-weight: bold;');
    const permissionMappings = [
      { 'Check': 'sales:create', 'Action Parsed': 'create', 'Mapped To': 'write', 'Has Permission': adminPermissions.includes('write') },
      { 'Check': 'sales:update', 'Action Parsed': 'update', 'Mapped To': 'write', 'Has Permission': adminPermissions.includes('write') },
      { 'Check': 'sales:delete', 'Action Parsed': 'delete', 'Mapped To': 'delete', 'Has Permission': adminPermissions.includes('delete') },
      { 'Check': 'customers:create', 'Action Parsed': 'create', 'Mapped To': 'write', 'Has Permission': adminPermissions.includes('write') },
      { 'Check': 'customers:update', 'Action Parsed': 'update', 'Mapped To': 'write', 'Has Permission': adminPermissions.includes('write') },
      { 'Check': 'customers:delete', 'Action Parsed': 'delete', 'Mapped To': 'delete', 'Has Permission': adminPermissions.includes('delete') },
    ];
    console.table(permissionMappings);

    console.log('\n%c✅ All CRUD operations SHOULD be allowed for admin', 'color: green; font-weight: bold;');
  } else {
    console.log(`%c❌ User role "${storedUser.role}" does NOT have admin permissions`, 'color: red; font-weight: bold;');
    console.log('\n%c📋 RECOMMENDATION: User needs to be promoted to admin role in database', 'color: orange; font-weight: bold;');
  }

  // ================================================================================
  // SECTION 5: Component-Level Checks
  // ================================================================================
  console.log('\n%c═ SECTION 5: Component Visibility Analysis ═', 'color: #2196F3; font-weight: bold; font-size: 12px;');

  const buttonChecks = [
    { selector: '[title*="New Deal"], [title*="New"], button:has-text("New Deal")', name: 'Create/New Button', type: 'sales' },
    { selector: '[title*="Edit"], button:has-text("Edit")', name: 'Edit Button', type: 'sales' },
    { selector: '[title*="Delete"], button:has-text("Delete")', name: 'Delete Button', type: 'sales' },
  ];

  const buttonStatus = [];
  buttonChecks.forEach(check => {
    const elements = document.querySelectorAll(check.selector);
    const visible = Array.from(elements).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }).length > 0;

    buttonStatus.push({
      'Button': check.name,
      'Module': check.type,
      'Found': elements.length > 0,
      'Visible': visible,
      'Elements': elements.length
    });
  });

  if (buttonStatus.length > 0) {
    console.log('Button Visibility Status:');
    console.table(buttonStatus);
  } else {
    console.log('❌ Could not find buttons - page may not have loaded or module not visited');
  }

  // ================================================================================
  // SECTION 6: Database Query Guide
  // ================================================================================
  console.log('\n%c═ SECTION 6: SQL Queries to Run in Supabase ═', 'color: #2196F3; font-weight: bold; font-size: 12px;');

  const sqlQueries = {
    'Check User Role': `SELECT id, email, name, role, status, tenant_id FROM users WHERE email = '${storedUser.email}';`,
    'Check All Admin Users': `SELECT id, email, name, role, status FROM users WHERE role = 'admin' LIMIT 10;`,
    'Check User Roles Assignments': `SELECT COUNT(*) FROM user_roles WHERE user_id = '${storedUser.id}';`,
    'Check Available Roles': `SELECT id, name, tenant_id FROM roles WHERE tenant_id = '${storedUser.tenantId || storedUser.tenant_id}' LIMIT 10;`
  };

  console.log('%cCopy and paste these into Supabase Dashboard → SQL Editor:', 'color: orange; font-weight: bold;');
  Object.entries(sqlQueries).forEach(([name, query]) => {
    console.log(`\n%c${name}:`, 'color: blue; font-weight: bold;');
    console.log(`%c${query}`, 'color: gray; font-family: monospace;');
  });

  // ================================================================================
  // SECTION 7: Fix Options
  // ================================================================================
  console.log('\n%c═ SECTION 7: Recommended Fixes ═', 'color: #2196F3; font-weight: bold; font-size: 12px;');

  if (!storedUser.role || storedUser.role !== 'admin') {
    console.log('%c🔧 FIX REQUIRED:', 'color: red; font-weight: bold;');
    console.log(`%c  1. User role is '${storedUser.role}' but should be 'admin'`, 'color: red;');
    console.log('%c  2. Run this SQL in Supabase Dashboard:', 'color: orange; font-weight: bold;');
    console.log(`%c     UPDATE users SET role='admin' WHERE id='${storedUser.id}';`, 'color: gray; font-family: monospace;');
    console.log('%c  3. Then reload the page (Ctrl+R)', 'color: orange; font-weight: bold;');
  } else {
    console.log('%c✅ User role is correctly set to admin', 'color: green; font-weight: bold;');
    console.log('%c🔍 If buttons still don\'t show, check:', 'color: orange; font-weight: bold;');
    console.log('%c  1. Refresh page hard (Ctrl+Shift+R)', 'color: orange;');
    console.log('%c  2. Clear localStorage: localStorage.clear()', 'color: orange;');
    console.log('%c  3. Log out and log back in', 'color: orange;');
    console.log('%c  4. Navigate to specific module (Sales, Customers, etc.)', 'color: orange;');
  }

  // ================================================================================
  // SECTION 8: Final Summary
  // ================================================================================
  console.log('\n%c═ SUMMARY ═', 'color: #2196F3; font-weight: bold; font-size: 12px;');

  let diagnosis = 'UNKNOWN - Please check the sections above';
  let severity = '⚠️';

  if (!storedUser.role) {
    diagnosis = '❌ CRITICAL: User role is missing/null in localStorage';
    severity = '🔴';
  } else if (storedUser.role !== 'admin') {
    diagnosis = `❌ CRITICAL: User role is "${storedUser.role}" but should be "admin"`;
    severity = '🔴';
  } else {
    diagnosis = '✅ PASSED: User role is correctly set to "admin"';
    severity = '🟢';
    console.log('\n%cIf buttons are still not visible after this check:', 'color: orange; font-weight: bold;');
    console.log('%c1. Hard refresh: Ctrl+Shift+R', 'color: orange;');
    console.log('%c2. Clear browser cache', 'color: orange;');
    console.log('%c3. Check browser console for errors', 'color: orange;');
  }

  console.log(`\n%c${severity} PRIMARY DIAGNOSIS: ${diagnosis}`, 'color: black; font-weight: bold; font-size: 13px;');

  // ================================================================================
  // Copy SQL Fix to Clipboard
  // ================================================================================
  if (storedUser.role !== 'admin') {
    const sqlFix = `UPDATE users SET role='admin', updated_at=NOW() WHERE id='${storedUser.id}' AND role != 'admin';`;
    console.log('\n%c📋 SQL Fix copied to clipboard (paste in Supabase Dashboard):', 'color: green; font-weight: bold;');
    console.log(sqlFix);
    
    try {
      navigator.clipboard.writeText(sqlFix);
      console.log('%c✅ Copied to clipboard!', 'color: green; font-weight: bold;');
    } catch (err) {
      console.log('%c⚠️  Could not auto-copy. Copy manually from above.', 'color: orange;');
    }
  }

  console.log('\n%c═ END OF DIAGNOSTIC REPORT ═\n', 'color: blue; font-weight: bold;');
}

// ============================================================================
// HELPER: Test Individual Permissions
// ============================================================================
function testPermissions() {
  const storedUser = JSON.parse(localStorage.getItem('crm_user') || '{}');
  console.log('\n%cTesting Permission Checks:', 'color: blue; font-weight: bold;');
  
  const tests = [
    'sales:create',
    'sales:update', 
    'sales:delete',
    'customers:create',
    'customers:update',
    'customers:delete',
    'write',
    'delete',
    'manage_sales'
  ];

  const results = tests.map(perm => ({
    'Permission': perm,
    'Expected': storedUser.role === 'admin' ? '✅ TRUE' : '❌ FALSE',
    'Reason': storedUser.role === 'admin' 
      ? 'Admin role has all permissions'
      : `User is "${storedUser.role}" role, not admin`
  }));

  console.table(results);
}

// ============================================================================
// HELPER: Show Stored Data
// ============================================================================
function showStoredData() {
  console.log('%cStored LocalStorage Data:', 'color: blue; font-weight: bold;');
  console.log({
    'crm_user': JSON.parse(localStorage.getItem('crm_user') || 'null'),
    'crm_auth_token': localStorage.getItem('crm_auth_token') ? '(Present)' : '(Missing)',
    'supabase_session': JSON.parse(localStorage.getItem('supabase_session') || 'null'),
  });
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
console.log('%c\n>>> RUN THIS: advancedDebugAdminPermissions()\n', 'color: green; font-weight: bold; font-size: 14px;');
console.log('>>> Or use these helper functions:', 'color: blue;');
console.log('    - testPermissions()     // Test specific permission checks');
console.log('    - showStoredData()      // Show all stored data\n');

// Auto-run if called
if (typeof advancedDebugAdminPermissions === 'function') {
  advancedDebugAdminPermissions();
}

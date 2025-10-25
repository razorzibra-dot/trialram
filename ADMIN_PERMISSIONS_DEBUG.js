/**
 * Admin Permissions Debug Script
 * 
 * Copy and paste this entire script into your browser console (F12)
 * to debug admin permission issues
 * 
 * Usage:
 * 1. Press F12 to open developer tools
 * 2. Click "Console" tab
 * 3. Copy the entire script
 * 4. Paste and press Enter
 * 5. Run: debugAdminPermissions()
 */

const debugAdminPermissions = () => {
  console.clear();
  console.log('%c🔍 Admin Permissions Debug Tool', 'font-size: 18px; font-weight: bold; color: #1890ff;');
  console.log('%c=====================================', 'color: #1890ff;');

  // ============================================================================
  // 1. USER INFORMATION
  // ============================================================================
  console.group('%c👤 User Information', 'font-weight: bold; color: #52c41a;');
  
  try {
    const user = JSON.parse(localStorage.getItem('crm_user'));
    if (!user) {
      console.error('❌ No user found in localStorage');
      console.groupEnd();
      return;
    }

    console.table({
      'User ID': user.id || '❌ Missing',
      'Email': user.email || '❌ Missing',
      'Role': user.role || '❌ Missing',
      'Tenant ID': user.tenantId || '❌ Missing',
      'Name': user.name || '❌ Missing',
    });

    if (!user.role) {
      console.error('%c⚠️ CRITICAL: User role is not set!', 'color: red; font-weight: bold;');
    }
  } catch (error) {
    console.error('❌ Error reading user from localStorage:', error);
  }
  console.groupEnd();

  // ============================================================================
  // 2. EXPECTED PERMISSIONS BY ROLE
  // ============================================================================
  console.group('%c🔐 Expected Permissions', 'font-weight: bold; color: #52c41a;');

  const rolePermissions = {
    super_admin: ['read', 'write', 'delete', 'manage_customers', 'manage_sales', 'manage_tickets', 'manage_complaints', 'manage_contracts', 'manage_service_contracts', 'manage_products', 'manage_product_sales', 'manage_job_works', 'manage_users', 'manage_roles', 'view_analytics', 'manage_settings', 'manage_companies', 'platform_admin', 'super_admin', 'manage_tenants', 'system_monitoring'],
    admin: ['read', 'write', 'delete', 'manage_customers', 'manage_sales', 'manage_tickets', 'manage_complaints', 'manage_contracts', 'manage_service_contracts', 'manage_products', 'manage_product_sales', 'manage_job_works', 'manage_users', 'manage_roles', 'view_analytics', 'manage_settings', 'manage_companies'],
    manager: ['read', 'write', 'manage_customers', 'manage_sales', 'manage_tickets', 'manage_complaints', 'manage_contracts', 'manage_service_contracts', 'manage_products', 'manage_product_sales', 'view_analytics'],
    agent: ['read', 'write', 'manage_customers', 'manage_tickets', 'manage_complaints'],
    engineer: ['read', 'write', 'manage_products', 'manage_product_sales', 'manage_job_works', 'manage_tickets'],
    customer: ['read']
  };

  const user = JSON.parse(localStorage.getItem('crm_user'));
  const userRole = user?.role || 'unknown';
  const expectedPerms = rolePermissions[userRole] || [];

  console.log(`\nUser Role: %c${userRole}`, 'color: #1890ff; font-weight: bold;');
  console.log(`Expected Permissions (${expectedPerms.length}):`);
  console.table(expectedPerms);

  console.groupEnd();

  // ============================================================================
  // 3. PERMISSION CHECKS
  // ============================================================================
  console.group('%c✅ Permission Checks', 'font-weight: bold; color: #52c41a;');

  const permissionChecks = [
    'customers:read',
    'customers:create',
    'customers:update',
    'customers:delete',
    'sales:read',
    'sales:create',
    'sales:update',
    'sales:delete',
    'write',
    'delete',
    'manage_customers'
  ];

  // Simulate hasPermission logic
  const checkPermission = (permission) => {
    if (userRole === 'super_admin') return true;

    const userPerms = rolePermissions[userRole] || [];

    // Direct match
    if (userPerms.includes(permission)) return true;

    // Parse permission
    const [resource, action] = permission.split(':');
    if (!action) return false;

    const actionMap = {
      'read': 'read',
      'create': 'write',
      'update': 'write',
      'delete': 'delete',
      'manage': `manage_${resource}`
    };

    const mappedPerm = actionMap[action];
    if (mappedPerm && userPerms.includes(mappedPerm)) return true;

    const managePerm = `manage_${resource}`;
    if (userPerms.includes(managePerm)) return true;

    return false;
  };

  const results = {};
  permissionChecks.forEach(perm => {
    results[perm] = checkPermission(perm) ? '✅ ALLOWED' : '❌ DENIED';
  });

  console.table(results);
  console.groupEnd();

  // ============================================================================
  // 4. UI VISIBILITY PREDICTIONS
  // ============================================================================
  console.group('%c👁️ Expected Button Visibility', 'font-weight: bold; color: #52c41a;');

  const visibility = {
    'Create Button': checkPermission('customers:create') || checkPermission('write'),
    'Edit Button': checkPermission('customers:update') || checkPermission('write'),
    'Delete Button': checkPermission('customers:delete') || checkPermission('delete'),
    'Export Button': checkPermission('customers:read') || checkPermission('read'),
    'Import Button': checkPermission('customers:create') || checkPermission('write'),
  };

  Object.entries(visibility).forEach(([button, visible]) => {
    console.log(`${visible ? '✅' : '❌'} ${button}: ${visible ? 'VISIBLE' : 'HIDDEN'}`);
  });

  console.groupEnd();

  // ============================================================================
  // 5. DATABASE STATUS
  // ============================================================================
  console.group('%c📊 Database Status Check', 'font-weight: bold; color: #52c41a;');

  console.log('%cNote: These checks are estimates based on your local storage.', 'color: orange; font-style: italic;');
  console.log(`User role in database should be: %c${userRole}`, 'color: #1890ff; font-weight: bold;');
  console.log(`user_roles table status: %cRequires direct SQL query to verify`, 'color: orange;');
  console.log(`roles table status: %cRequires direct SQL query to verify`, 'color: orange;');

  console.groupEnd();

  // ============================================================================
  // 6. RECOMMENDATIONS
  // ============================================================================
  console.group('%c📋 Recommendations', 'font-weight: bold; color: #fa8c16;');

  const issues = [];

  if (!user || !user.id) {
    issues.push('❌ User not found in localStorage - Try logging out and back in');
  }

  if (!userRole || userRole === 'unknown') {
    issues.push('❌ User role is not set - Check that user has role assigned in users table');
  }

  if (!checkPermission('customers:update')) {
    issues.push('❌ Cannot update customers - Admin should have this permission');
  }

  if (!checkPermission('customers:delete')) {
    issues.push('❌ Cannot delete customers - Admin should have this permission');
  }

  if (issues.length === 0) {
    console.log('%c✅ No obvious issues found!', 'color: green; font-weight: bold;');
    console.log('If buttons are still not visible:');
    console.log('1. Hard refresh page (Ctrl+Shift+R)');
    console.log('2. Clear browser cache');
    console.log('3. Check that user_roles table is populated in Supabase');
    console.log('4. Verify roles table has admin role');
  } else {
    console.log('Detected issues:');
    issues.forEach(issue => console.log(`  ${issue}`));
  }

  console.groupEnd();

  // ============================================================================
  // 7. SQL QUERIES TO RUN IN SUPABASE
  // ============================================================================
  console.group('%c📝 SQL Queries to Debug Database', 'font-weight: bold; color: #9254de;');

  console.log('%cCopy and paste these queries in Supabase SQL Editor:', 'font-style: italic;');

  console.log('\n1️⃣  Check user data:');
  console.log(`
    SELECT id, email, role, tenant_id FROM users 
    WHERE id = '${user?.id || '[YOUR_USER_ID]'}';
  `);

  console.log('\n2️⃣  Check if roles exist:');
  console.log(`
    SELECT id, name, tenant_id FROM roles 
    WHERE tenant_id = '${user?.tenantId || '[YOUR_TENANT_ID]'}' 
    LIMIT 10;
  `);

  console.log('\n3️⃣  Check user role assignments:');
  console.log(`
    SELECT ur.user_id, ur.role_id, r.name, r.permissions
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = '${user?.id || '[YOUR_USER_ID]'}';
  `);

  console.log('\n4️⃣  Count all role assignments:');
  console.log(`
    SELECT COUNT(*) as total_assignments FROM user_roles;
  `);

  console.groupEnd();

  // ============================================================================
  // 8. NEXT STEPS
  // ============================================================================
  console.group('%c🚀 Next Steps', 'font-weight: bold; color: #1890ff;');

  console.log(`
1. If buttons are NOT showing:
   - Run the SQL queries above to check database
   - If user_roles is empty, run the fix script
   - See: ADMIN_PERMISSIONS_QUICK_FIX.md

2. If buttons ARE showing but actions fail:
   - Check browser Network tab for API errors
   - Check server logs for permission errors

3. To run the database fix:
   - Option A: Run migration: supabase db push
   - Option B: Run SQL in Supabase editor
   - Option C: See ADMIN_PERMISSIONS_QUICK_FIX.md
  `);

  console.groupEnd();

  console.log('%c=====================================', 'color: #1890ff;');
  console.log('%c✨ Debug Complete! Check recommendations above.', 'font-size: 14px; font-weight: bold; color: #52c41a;');
};

// Run the debug function
debugAdminPermissions();

// Export for reuse
window.debugAdminPermissions = debugAdminPermissions;
console.log('%cℹ️  To run again, type: debugAdminPermissions()', 'color: blue; font-style: italic;');
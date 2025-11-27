#!/usr/bin/env node

/**
 * Verify Frontend Auth State
 * Simulates browser localStorage after a login
 */

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function simulateBrowserLogin() {
  console.log('[BROWSER_SIM] Simulating frontend login...\n');

  try {
    // Step 1: Sign in via Supabase auth
    console.log('[1] Signing in as admin@acme.com...');
    const signInResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: 'admin@acme.com',
        password: 'password123'
      })
    });

    const signInData = await signInResponse.json();
    const userId = signInData.user.id;
    const accessToken = signInData.access_token;
    console.log(`✓ Signed in: ${signInData.user.email}\n`);

    // Step 2: Fetch user from DB
    console.log('[2] Fetching user data...');
    const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=*`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}` }
    });
    const users = await userResponse.json();
    const user = users[0];
    console.log(`✓ User loaded: ${user.email}\n`);

    // Step 3: Fetch user role
    console.log('[3] Fetching user role...');
    const roleResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&select=role_id,roles(id,name)`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}` }
    });
    const userRoles = await roleResponse.json();
    const roleId = userRoles[0]?.role_id;
    const roleName = userRoles[0]?.roles?.name;
    console.log(`✓ Role loaded: ${roleName}\n`);

    // Step 4: Fetch role permissions
    console.log('[4] Fetching role permissions...');
    const permsResponse = await fetch(`${SUPABASE_URL}/rest/v1/role_permissions?role_id=eq.${roleId}&select=permission_id`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}` }
    });
    const rolePerms = await permsResponse.json();
    const permIds = rolePerms.map(rp => rp.permission_id);

    // Step 5: Fetch permission names
    const permDetailsResponse = await fetch(`${SUPABASE_URL}/rest/v1/permissions?id=in.(${permIds.join(',')})&select=id,name`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}` }
    });
    const perms = await permDetailsResponse.json();
    const permNames = [...new Set(perms.map(p => p.name))];
    console.log(`✓ Permissions loaded (${permNames.length} unique)\n`);

    // Step 6: Build crm_user object (as it would be stored in localStorage)
    const roleMap = {
      'Administrator': 'admin',
      'Manager': 'manager',
      'User': 'agent',
      'Engineer': 'engineer',
      'Customer': 'customer'
    };

    const crm_user = {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      role: roleMap[roleName] || 'agent',
      status: user.status || 'active',
      tenantId: user.tenant_id,
      createdAt: user.created_at,
      lastLogin: new Date().toISOString(),
      isSuperAdmin: user.is_super_admin === true,
      isSuperAdminMode: false,
      permissions: permNames
    };

    console.log('[RESULT] crm_user object that would be stored in localStorage:\n');
    console.log(JSON.stringify(crm_user, null, 2));

    console.log('\n[VERIFICATION]');
    console.log(`✓ User ID: ${crm_user.id}`);
    console.log(`✓ Email: ${crm_user.email}`);
    console.log(`✓ Role: ${crm_user.role}`);
    console.log(`✓ Permissions: ${crm_user.permissions.length} permissions loaded`);
    console.log(`  - dashboard:view: ${crm_user.permissions.includes('dashboard:view') ? '✓' : '✗'}`);
    console.log(`  - masters:read: ${crm_user.permissions.includes('masters:read') ? '✓' : '✗'}`);
    console.log(`  - user_management:read: ${crm_user.permissions.includes('user_management:read') ? '✓' : '✗'}`);
    console.log(`  - users:manage: ${crm_user.permissions.includes('users:manage') ? '✓' : '✗'}`);
    console.log(`  - sales:manage: ${crm_user.permissions.includes('sales:manage') ? '✓' : '✗'}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

simulateBrowserLogin();

#!/usr/bin/env node

/**
 * Test Login Script
 * Simulates a browser login and checks if permissions are loaded correctly
 */

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function testLogin() {
  console.log('[TEST] Starting login test...\n');

  try {
    // Step 1: Sign in
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

    if (!signInResponse.ok) {
      throw new Error(`Sign-in failed: ${signInResponse.status} ${signInResponse.statusText}`);
    }

    const signInData = await signInResponse.json();
    const userId = signInData.user.id;
    const accessToken = signInData.access_token;
    console.log(`✓ Signed in successfully. User ID: ${userId}\n`);

    // Step 2: Fetch user data
    console.log('[2] Fetching user data from public.users...');
    const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!userResponse.ok) {
      throw new Error(`Fetch users failed: ${userResponse.status}`);
    }

    const users = await userResponse.json();
    if (!Array.isArray(users) || users.length === 0) {
      throw new Error('No user found in database');
    }

    const user = users[0];
    console.log(`✓ User found: ${user.email}\n`);

    // Step 3: Fetch user roles
    console.log('[3] Fetching user roles...');
    const rolesResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&select=role_id,roles(id,name)`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!rolesResponse.ok) {
      throw new Error(`Fetch roles failed: ${rolesResponse.status}`);
    }

    const userRoles = await rolesResponse.json();
    if (!Array.isArray(userRoles) || userRoles.length === 0) {
      throw new Error('No role found for user');
    }

    const roleData = userRoles[0];
    const roleId = roleData.role_id;
    const roleName = roleData.roles.name;
    console.log(`✓ Role found: ${roleName}\n`);

    // Step 4: Fetch role permissions
    console.log('[4] Fetching role permissions...');
    const permsResponse = await fetch(`${SUPABASE_URL}/rest/v1/role_permissions?role_id=eq.${roleId}&select=permission_id`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!permsResponse.ok) {
      throw new Error(`Fetch role_permissions failed: ${permsResponse.status}`);
    }

    const rolePerms = await permsResponse.json();
    if (!Array.isArray(rolePerms) || rolePerms.length === 0) {
      console.log('⚠ No permissions found for role');
    } else {
      const permIds = rolePerms.map(rp => rp.permission_id);
      console.log(`✓ Found ${permIds.length} permission assignments\n`);

      // Step 5: Fetch permission details
      console.log('[5] Fetching permission names...');
      const permDetailsResponse = await fetch(`${SUPABASE_URL}/rest/v1/permissions?id=in.(${permIds.join(',')})&select=id,name`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (permDetailsResponse.ok) {
        const perms = await permDetailsResponse.json();
        const uniquePerms = [...new Set(perms.map(p => p.name))];
        console.log(`✓ Permission names (${uniquePerms.length} unique):`);
        uniquePerms.sort().forEach(p => console.log(`  - ${p}`));
      }
    }

    console.log('\n[SUMMARY]');
    console.log(`✓ User: ${user.email}`);
    console.log(`✓ Role: ${roleName}`);
    console.log('✓ All data fetched successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testLogin();

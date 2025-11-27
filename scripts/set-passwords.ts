/**
 * Script to set passwords for existing Supabase auth users
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const users = [
  'admin@acme.com',
  'manager@acme.com',
  'engineer@acme.com',
  'user@acme.com',
  'admin@techsolutions.com',
  'manager@techsolutions.com',
  'admin@globaltrading.com',
  'superadmin@platform.com',
  'superadmin2@platform.com',
  'superadmin3@platform.com',
];

async function setPasswords() {
  console.log('Setting passwords for existing users...');

  // Get all users first
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  if (!userList?.users) {
    console.error('No users found');
    return;
  }

  console.log(`Found ${userList.users.length} users`);

  for (const email of users) {
    try {
      const user = userList.users.find(u => u.email === email);

      if (!user) {
        console.log(`⚠️  User ${email} not found`);
        continue;
      }

      console.log(`Updating password for ${email} (ID: ${user.id})`);

      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: 'password123',
      });

      if (error) {
        console.error(`❌ Error setting password for ${email}:`, error.message);
      } else {
        console.log(`✅ Set password for ${email}`);
      }
    } catch (error) {
      console.error(`❌ Error setting password for ${email}:`, error);
    }
  }

  console.log('Done!');
}

setPasswords().catch(console.error);
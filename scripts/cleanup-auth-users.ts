/**
 * ============================================================================
 * CLEANUP AUTH USERS SCRIPT
 * ============================================================================
 * 
 * This script removes the test auth users created by seed-auth-users.ts.
 * Useful for cleanup and testing scenarios.
 * 
 * Usage:
 *   tsx scripts/cleanup-auth-users.ts
 * 
 * ============================================================================
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const TEST_USER_EMAILS = [
  'admin@acme.com',
  'manager@acme.com', 
  'engineer@acme.com',
  'user@acme.com',
  'customer@acme.com',
  'admin@techsolutions.com',
  'manager@techsolutions.com',
  'admin@globaltrading.com',
  'superadmin@platform.com',
  'superadmin2@platform.com',
  'superadmin3@platform.com',
];

async function cleanupAuthUsers(): Promise<void> {
  console.log('\n🧹 Cleaning up Auth Users');
  console.log('='.repeat(60));

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let successCount = 0;
  let errorCount = 0;

  for (const email of TEST_USER_EMAILS) {
    try {
      // First get user by email to get UUID
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users?.users?.find(u => u.email === email);

      if (!user) {
        console.log(`⏭️  ${email} (not found)`);
        continue;
      }

      // Delete the user
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        console.error(`❌ Error deleting ${email}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Deleted ${email}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Error deleting ${email}:`, error instanceof Error ? error.message : String(error));
      errorCount++;
    }
  }

  // Remove config file if exists
  const configPath = 'auth-users-config.json';
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
    console.log(`🗑️  Removed ${configPath}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Cleanup Summary');
  console.log('-'.repeat(60));
  console.log(`✅ Successfully deleted: ${successCount} users`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total: ${successCount + errorCount}/${TEST_USER_EMAILS.length}`);
  console.log('='.repeat(60) + '\n');
}

cleanupAuthUsers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
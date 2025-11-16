/**
 * ============================================================================
 * SUPABASE AUTH USER SEEDING SCRIPT
 * ============================================================================
 * 
 * This script creates Supabase Auth users for development/testing.
 * The created user IDs are then used in the database seed.sql file.
 * 
 * Usage:
 *   npx ts-node scripts/seed-auth-users.ts
 * 
 * Prerequisites:
 *   1. Start local Supabase: supabase start
 *   2. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 *   3. Run this script
 *   4. The script outputs user IDs and saves them to auth-users-config.json
 * ============================================================================
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Configuration for test users
interface TestUser {
  email: string;
  password: string;
  displayName: string;
  tenant: string; // Tenant name for reference
}

const TEST_USERS: TestUser[] = [
  // Acme Corporation Users
  {
    email: 'admin@acme.com',
    password: 'password123',
    displayName: 'Admin Acme',
    tenant: 'Acme Corporation',
  },
  {
    email: 'manager@acme.com',
    password: 'password123',
    displayName: 'Manager Acme',
    tenant: 'Acme Corporation',
  },
  {
    email: 'engineer@acme.com',
    password: 'password123',
    displayName: 'Engineer Acme',
    tenant: 'Acme Corporation',
  },
  {
    email: 'user@acme.com',
    password: 'password123',
    displayName: 'User Acme',
    tenant: 'Acme Corporation',
  },
  
  // Tech Solutions Users
  {
    email: 'admin@techsolutions.com',
    password: 'password123',
    displayName: 'Admin Tech',
    tenant: 'Tech Solutions Inc',
  },
  {
    email: 'manager@techsolutions.com',
    password: 'password123',
    displayName: 'Manager Tech',
    tenant: 'Tech Solutions Inc',
  },
  
  // Global Trading Users
  {
    email: 'admin@globaltrading.com',
    password: 'password123',
    displayName: 'Admin Global',
    tenant: 'Global Trading Ltd',
  },

  // Super Users
  {
    email: 'superadmin@platform.com',
    password: 'password123',
    displayName: 'CRM Global',
    tenant: '',
  },
  {
    email: 'superadmin2@platform.com',
    password: 'password123',
    displayName: 'CRM Global',
    tenant: '',
  },
  {
    email: 'superadmin3@platform.com',
    password: 'password123',
    displayName: 'CRM Global',
    tenant: '',
  },
];

interface AuthUserConfig {
  createdAt: string;
  supabaseUrl: string;
  users: Array<{
    email: string;
    displayName: string;
    tenant: string;
    userId: string;
    createdAt: string;
  }>;
}

async function seedAuthUsers(): Promise<void> {
  // Get environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Error: Missing environment variables');
    console.error('   Required: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_KEY');
    console.error('   Set these in .env file');
    process.exit(1);
  }

  // Create admin client (service role bypasses RLS)
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('\n🔐 Supabase Auth User Seeding');
  console.log('='.repeat(60));
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`👥 Creating ${TEST_USERS.length} test users...`);
  console.log('-'.repeat(60));

  const createdUsers: AuthUserConfig['users'] = [];
  let successCount = 0;
  let errorCount = 0;

  // Create each user
  for (const testUser of TEST_USERS) {
    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const userExists = existingUsers?.users?.some(
        (u) => u.email === testUser.email
      );

      if (userExists) {
        console.log(`⏭️  Skipping ${testUser.email} (already exists)`);
        
        // Get the existing user's ID
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users?.find(u => u.email === testUser.email);
        if (existingUser) {
          createdUsers.push({
            email: testUser.email,
            displayName: testUser.displayName,
            tenant: testUser.tenant,
            userId: existingUser.id,
            createdAt: new Date().toISOString(),
          });
        }
        continue;
      }

      // Create new user
      const { data, error } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true, // Auto-confirm email for development
        user_metadata: {
          display_name: testUser.displayName,
          tenant_name: testUser.tenant,
        },
      });

      if (error) {
        console.error(`❌ Error creating ${testUser.email}:`, error.message);
        errorCount++;
        continue;
      }

      if (data?.user?.id) {
        console.log(`✅ Created ${testUser.email}`);
        console.log(`   User ID: ${data.user.id}`);
        console.log(`   Tenant: ${testUser.tenant}`);

        createdUsers.push({
          email: testUser.email,
          displayName: testUser.displayName,
          tenant: testUser.tenant,
          userId: data.user.id,
          createdAt: new Date(data.user.created_at || '').toISOString(),
        });

        successCount++;
      }
    } catch (error) {
      console.error(
        `❌ Error creating ${testUser.email}:`,
        error instanceof Error ? error.message : String(error)
      );
      errorCount++;
    }
  }

  // Save config file
  const configPath = path.join(
    path.dirname(import.meta.url).replace('file:///', '').replace(/^\/([A-Z])/, '$1'),
    '../auth-users-config.json'
  );

  const configContent: AuthUserConfig = {
    createdAt: new Date().toISOString(),
    supabaseUrl,
    users: createdUsers,
  };

  try {
    fs.writeFileSync(configPath, JSON.stringify(configContent, null, 2));
    console.log(`\n💾 Saved config to: auth-users-config.json`);
  } catch (error) {
    console.error(
      `⚠️  Warning: Could not save config file:`,
      error instanceof Error ? error.message : String(error)
    );
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary');
  console.log('-'.repeat(60));
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total: ${successCount + errorCount}/${TEST_USERS.length}`);

  // Print user mapping for documentation
  console.log('\n📋 User Mapping (for SQL seed updates):');
  console.log('-'.repeat(60));
  for (const user of createdUsers) {
    console.log(`${user.email} => ${user.userId}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Auth user seeding complete!');
  console.log('\n📝 Next Steps:');
  console.log(
    '   1. The auth users are now created in Supabase Auth'
  );
  console.log(
    '   2. Update supabase/seed.sql with the user IDs above'
  );
  console.log('   3. Run: supabase db reset');
  console.log('   4. Database users will be synced with auth users');
  console.log('='.repeat(60) + '\n');
}

// Run the seeding
seedAuthUsers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
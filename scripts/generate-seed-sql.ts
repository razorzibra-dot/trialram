/**
 * ============================================================================
 * GENERATE SEED SQL FROM AUTH USERS CONFIG
 * ============================================================================
 * 
 * This script reads auth-users-config.json and generates SQL INSERT statements
 * for the users table with the correct auth user IDs.
 * 
 * Usage:
 *   npx ts-node scripts/generate-seed-sql.ts > supabase/seed-users.sql
 * 
 * Then merge the output into supabase/seed.sql
 * ============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';

interface AuthUser {
  email: string;
  displayName: string;
  tenant: string;
  userId: string;
  createdAt: string;
}

interface AuthUserConfig {
  createdAt: string;
  supabaseUrl: string;
  users: AuthUser[];
}

// Tenant ID mappings (must match the tenant IDs in seed.sql)
const TENANT_MAPPING: Record<string, string> = {
  'Acme Corporation': '550e8400-e29b-41d4-a716-446655440001',
  'Tech Solutions Inc': '550e8400-e29b-41d4-a716-446655440002',
  'Global Trading Ltd': '550e8400-e29b-41d4-a716-446655440003',
};

// Role mapping
const ROLE_MAPPING: Record<string, string> = {
  'admin@acme.com': 'admin',
  'manager@acme.com': 'manager',
  'engineer@acme.com': 'engineer',
  'user@acme.com': 'agent',
  'admin@techsolutions.com': 'admin',
  'manager@techsolutions.com': 'manager',
  'admin@globaltrading.com': 'admin',
};

function generateSeedSQL(config: AuthUserConfig): string {
  let sql = '';

  sql += `-- ============================================================================\n`;
  sql += `-- USERS TABLE - Synced with Auth Users\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- ============================================================================\n\n`;

  sql += `INSERT INTO users (id, email, name, tenant_id, role, status, created_at, last_login)\n`;
  sql += `VALUES\n`;

  const lines: string[] = [];

  for (const user of config.users) {
    const tenantId = TENANT_MAPPING[user.tenant];
    const role = ROLE_MAPPING[user.email] || 'agent';

    if (!tenantId) {
      console.error(`Warning: Unknown tenant: ${user.tenant}`);
      continue;
    }

    const line = `  ('${user.userId}'::UUID, '${user.email}', '${user.displayName}', '${tenantId}'::UUID, '${role}', 'active', NOW(), NOW())`;
    lines.push(line);
  }

  sql += lines.join(',\n');
  sql += `\nON CONFLICT (id) DO NOTHING;\n\n`;

  // Print statistics
  sql += `-- Created ${lines.length} users\n`;

  return sql;
}

function main(): void {
  const configPath = path.join(
    process.cwd(),
    'auth-users-config.json'
  );

  try {
    // Check if config file exists
    if (!fs.existsSync(configPath)) {
      console.error('Error: auth-users-config.json not found');
      console.error('Please run: npx ts-node scripts/seed-auth-users.ts');
      process.exit(1);
    }

    // Read config
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config: AuthUserConfig = JSON.parse(configContent);

    // Generate SQL
    const sql = generateSeedSQL(config);

    // Output SQL
    console.log(sql);
  } catch (error) {
    console.error(
      'Error:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main();
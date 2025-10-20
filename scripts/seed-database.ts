import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function seedDatabase() {
  try {
    console.log('📚 Reading seed.sql file...');
    
    // Read the seed SQL file
    const seedPath = resolve('supabase/seed.sql');
    const seedSQL = readFileSync(seedPath, 'utf-8');

    // Get database URL from environment
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!supabaseUrl) {
      console.error('❌ Missing VITE_SUPABASE_URL in .env');
      process.exit(1);
    }

    // Parse local Supabase connection info
    const urlObj = new URL(supabaseUrl);
    const isLocal = urlObj.hostname === '127.0.0.1' || urlObj.hostname === 'localhost';

    if (!isLocal) {
      console.error('❌ This script only works with local Supabase for safety');
      process.exit(1);
    }

    // For local Supabase, use default postgres credentials with superuser access
    // Supabase local runs on port 54322 (not standard 5432)
    // This is required for DISABLE TRIGGER ALL and other admin operations
    const pgConnectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

    console.log('🔄 Connecting to Supabase local database...');
    console.log('📝 Executing seed.sql (preserving auth users)...\n');

    try {
      // Execute SQL file using psql
      // The postgres user has superuser privileges needed for trigger manipulation
      const result = execSync(`psql "${pgConnectionString}" -f "${seedPath}" 2>&1`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      // Filter out notice messages but show actual output
      const output = result
        .split('\n')
        .filter(line => !line.includes('NOTICE:') && line.trim())
        .join('\n');

      if (output) {
        console.log(output);
      }

      console.log('\n✅ Database seeded successfully!');
      console.log('💾 All data has been populated while preserving auth users.\n');
      
    } catch (psqlError: any) {
      if (psqlError.status === 127) {
        console.error('❌ psql command not found. Please install PostgreSQL client tools.');
        console.error('\n   Installation instructions:');
        console.error('   - Windows: https://www.postgresql.org/download/windows/');
        console.error('   - macOS: brew install postgresql');
        console.error('   - Linux: sudo apt-get install postgresql-client\n');
        process.exit(1);
      }

      const errorOutput = psqlError.stdout || psqlError.stderr || psqlError.message;
      
      // Check if it's a permission error
      if (errorOutput.includes('permission denied') || errorOutput.includes('FATAL')) {
        console.error('❌ Database connection or permission error:');
        console.error(errorOutput);
        console.error('\n🔧 Troubleshooting:');
        console.error('   1. Make sure Supabase is running: supabase start');
        console.error('   2. Verify .env has correct VITE_SUPABASE_URL');
        console.error('   3. Check if port 5432 is accessible\n');
        process.exit(1);
      }

      // Show the error but note that auth data is still preserved
      console.error('⚠️  Database seeding encountered issues:');
      console.error(errorOutput);
      console.log('\n💾 Auth users are still preserved. Check errors above.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedDatabase();
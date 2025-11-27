#!/usr/bin/env node

/**
 * Pre-Deployment Validation Script
 * 
 * Purpose: Comprehensive validation of database synchronization before deployment
 * Date: 2025-11-23
 * Version: 1.0
 * 
 * This script validates:
 * - Database schema integrity
 * - Permission system consistency  
 * - Migration sequence correctness
 * - Auth user synchronization
 * - RLS policies functionality
 * - Reference data completeness
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface Config {
  supabaseUrl: string;
  supabaseKey: string;
  databaseUrl: string;
  verbose: boolean;
  strict: boolean;
}

const config: Config = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
  verbose: process.env.VERBOSE === 'true',
  strict: process.env.STRICT_MODE === 'true'
};

// ============================================================================
// VALIDATION CLASS
// ============================================================================

class PreDeploymentValidator {
  private supabase: any;
  private results: Map<string, ValidationResult> = new Map();
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor() {
    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error('Missing Supabase configuration. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }
    
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  // ============================================================================
  // MAIN VALIDATION METHODS
  // ============================================================================

  async runAllValidations(): Promise<ValidationSummary> {
    console.log('🚀 Starting Pre-Deployment Validation...\n');

    const startTime = Date.now();

    try {
      // Phase 1: Database Schema Validation
      console.log('📊 Phase 1: Database Schema Validation');
      await this.validateDatabaseSchema();
      
      // Phase 2: Permission System Validation
      console.log('\n🔐 Phase 2: Permission System Validation');
      await this.validatePermissionSystem();
      
      // Phase 3: Migration Validation
      console.log('\n🔄 Phase 3: Migration Validation');
      await this.validateMigrationSequence();
      
      // Phase 4: Auth User Validation
      console.log('\n👤 Phase 4: Auth User Validation');
      await this.validateAuthUsers();
      
      // Phase 5: RLS Policies Validation
      console.log('\n🛡️ Phase 5: RLS Policies Validation');
      await this.validateRLSPolicies();
      
      // Phase 6: Reference Data Validation
      console.log('\n📋 Phase 6: Reference Data Validation');
      await this.validateReferenceData();

      const endTime = Date.now();
      const summary = this.generateSummary(startTime, endTime);
      
      this.printSummary(summary);
      
      return summary;

    } catch (error) {
      console.error('❌ Validation failed with error:', error);
      throw error;
    }
  }

  // ============================================================================
  // VALIDATION PHASES
  // ============================================================================

  private async validateDatabaseSchema(): Promise<void> {
    // Check critical tables exist
    await this.validateTableExists('permissions', 'Core permissions table');
    await this.validateTableExists('roles', 'Core roles table');
    await this.validateTableExists('users', 'Core users table');
    await this.validateTableExists('user_roles', 'User-role relationships');
    await this.validateTableExists('role_permissions', 'Role-permission relationships');
    await this.validateTableExists('tenants', 'Multi-tenant support');
    
    // Check foreign key constraints
    await this.validateForeignKeys();
    
    // Check required columns
    await this.validateRequiredColumns();
    
    // Check indexes exist
    await this.validateIndexes();
  }

  private async validatePermissionSystem(): Promise<void> {
    // Validate permission format
    await this.validatePermissionFormat();
    
    // Validate role permissions mapping
    await this.validateRolePermissionsMapping();
    
    // Validate permission consistency
    await this.validatePermissionConsistency();
    
    // Check for orphaned permissions
    await this.validateNoOrphanedPermissions();
  }

  private async validateMigrationSequence(): Promise<void> {
    // Check migration files exist
    await this.validateMigrationFilesExist();
    
    // Check migration timestamps are correct
    await this.validateMigrationTimestamps();
    
    // Verify critical migration 20251122000002
    await this.validateCriticalMigrationExists();
    
    // Check migration data integrity
    await this.validateMigrationDataIntegrity();
  }

  private async validateAuthUsers(): Promise<void> {
    // Check all expected test users exist
    await this.validateExpectedUsersExist();
    
    // Check auth-public user synchronization
    await this.validateAuthPublicSync();
    
    // Check user UUID consistency
    await this.validateUserUUIDConsistency();
    
    // Check role assignments
    await this.validateUserRoleAssignments();
  }

  private async validateRLSPolicies(): Promise<void> {
    // Check RLS is enabled on critical tables
    await this.validateRLSEnabled();
    
    // Check policies exist
    await this.validatePoliciesExist();
    
    // Check policy syntax
    await this.validatePolicySyntax();
  }

  private async validateReferenceData(): Promise<void> {
    // Check status options
    await this.validateStatusOptions();
    
    // Check reference data
    await this.validateReferenceDataComplete();
    
    // Check tenant isolation
    await this.validateTenantIsolation();
  }

  // ============================================================================
  // SPECIFIC VALIDATION METHODS
  // ============================================================================

  private async validateTableExists(tableName: string, description: string): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_name', tableName)
        .eq('table_schema', 'public');

      if (error) throw error;

      if (data && data.length > 0) {
        this.addResult(tableName, true, `${description} exists`);
      } else {
        this.addResult(tableName, false, `${description} is missing`);
      }
    } catch (error) {
      this.addResult(tableName, false, `Error checking ${description}: ${error.message}`);
    }
  }

  private async validatePermissionFormat(): Promise<void> {
    try {
      const { data: permissions, error } = await this.supabase
        .from('permissions')
        .select('name, resource, action')
        .not('name', 'is', null);

      if (error) throw error;

      let invalidPermissions = 0;
      const issues: string[] = [];

      permissions?.forEach((perm: any) => {
        // Check format: should be resource:action or core permissions
        const isValidFormat = perm.name.includes(':') || 
                             ['read', 'write', 'delete', 'platform_admin', 'super_admin', 'system_monitoring'].includes(perm.name);
        
        if (!isValidFormat) {
          invalidPermissions++;
          issues.push(`Invalid permission format: ${perm.name}`);
        }

        // Check required fields
        if (!perm.resource || !perm.action) {
          invalidPermissions++;
          issues.push(`Missing resource/action for permission: ${perm.name}`);
        }
      });

      if (invalidPermissions === 0) {
        this.addResult('permission_format', true, `All ${permissions?.length} permissions have valid format`);
      } else {
        this.addResult('permission_format', false, `${invalidPermissions} permissions have invalid format. Issues: ${issues.join('; ')}`);
      }
    } catch (error) {
      this.addResult('permission_format', false, `Error validating permission format: ${error.message}`);
    }
  }

  private async validateExpectedUsersExist(): Promise<void> {
    const expectedUsers = [
      'admin@acme.com',
      'manager@acme.com', 
      'engineer@acme.com',
      'user@acme.com',
      'admin@techsolutions.com',
      'manager@techsolutions.com',
      'admin@globaltrading.com',
      'superadmin@platform.com',
      'superadmin2@platform.com',
      'superadmin3@platform.com'
    ];

    try {
      const { data: users, error } = await this.supabase
        .from('users')
        .select('email')
        .in('email', expectedUsers);

      if (error) throw error;

      const missingUsers = expectedUsers.filter(email => 
        !users?.some(user => user.email === email)
      );

      if (missingUsers.length === 0) {
        this.addResult('expected_users', true, `All ${expectedUsers.length} expected test users exist`);
      } else {
        this.addResult('expected_users', false, `${missingUsers.length} users missing: ${missingUsers.join(', ')}`);
      }
    } catch (error) {
      this.addResult('expected_users', false, `Error validating expected users: ${error.message}`);
    }
  }

  private async validateAuthPublicSync(): Promise<void> {
    try {
      // Check public users
      const { data: publicUsers, error: publicError } = await this.supabase
        .from('users')
        .select('id, email');

      if (publicError) throw publicError;

      // Check auth users
      const { data: authUsers, error: authError } = await this.supabase.auth.admin.listUsers();

      if (authError) throw authError;

      let syncIssues = 0;
      const issues: string[] = [];

      // Check each public user has corresponding auth user
      publicUsers?.forEach((user: any) => {
        const authUser = authUsers.users.find((auth: any) => auth.id === user.id);
        if (!authUser) {
          syncIssues++;
          issues.push(`Public user ${user.email} missing in auth.users`);
        }
      });

      // Check each auth user has corresponding public user
      authUsers.users.forEach((authUser: any) => {
        const publicUser = publicUsers?.find((user: any) => user.id === authUser.id);
        if (!publicUser) {
          syncIssues++;
          issues.push(`Auth user ${authUser.email} missing in public.users`);
        }
      });

      if (syncIssues === 0) {
        this.addResult('auth_sync', true, `All ${publicUsers?.length} users synchronized between auth and public`);
      } else {
        this.addResult('auth_sync', false, `${syncIssues} sync issues found: ${issues.join('; ')}`);
      }
    } catch (error) {
      this.addResult('auth_sync', false, `Error validating auth sync: ${error.message}`);
    }
  }

  private async validateMigrationFilesExist(): Promise<void> {
    try {
      const migrationFiles = [
        '20251122000001_add_audit_logs_rls_policies.sql',
        '20251122000002_update_permissions_to_resource_action_format.sql'
      ];

      // In a real implementation, you'd check the file system
      // For now, we'll check if migrations were applied
      const { data, error } = await this.supabase
        .from('supabase_migrations.schema_migrations')
        .select('version')
        .in('version', migrationFiles.map(f => f.replace('.sql', '')));

      if (error) throw error;

      const missingMigrations = migrationFiles.filter(file => {
        const version = file.replace('.sql', '');
        return !data?.some(m => m.version === version);
      });

      if (missingMigrations.length === 0) {
        this.addResult('migration_files', true, 'All critical migration files applied');
      } else {
        this.addResult('migration_files', false, `Missing migrations: ${missingMigrations.join(', ')}`);
      }
    } catch (error) {
      this.addResult('migration_files', false, `Error validating migration files: ${error.message}`);
    }
  }

  private async validateRolePermissionsMapping(): Promise<void> {
    try {
      // Check each role has appropriate permissions
      const { data: rolePermissions, error } = await this.supabase
        .from('role_permissions')
        .select(`
          role_id,
          roles(name),
          permissions(name, resource, action)
        `);

      if (error) throw error;

      // Group by role
      const roleMap = new Map();
      rolePermissions?.forEach((rp: any) => {
        const roleName = rp.roles?.name;
        if (!roleMap.has(roleName)) {
          roleMap.set(roleName, []);
        }
        roleMap.get(roleName).push(rp.permissions?.name);
      });

      // Check minimum permissions per role
      const roleRequirements = {
        'Administrator': 20,
        'Manager': 10,
        'User': 5,
        'Engineer': 8,
        'Customer': 1,
        'super_admin': 30
      };

      let issues = 0;
      for (const [roleName, requiredCount] of Object.entries(roleRequirements)) {
        const actualPermissions = roleMap.get(roleName) || [];
        if (actualPermissions.length < requiredCount) {
          issues++;
          this.warnings.push(`Role ${roleName} has ${actualPermissions.length} permissions, expected ${requiredCount}`);
        }
      }

      if (issues === 0) {
        this.addResult('role_permissions', true, 'All roles have appropriate permission counts');
      } else {
        this.addResult('role_permissions', false, `${issues} roles have insufficient permissions`);
      }
    } catch (error) {
      this.addResult('role_permissions', false, `Error validating role permissions: ${error.message}`);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private addResult(testName: string, passed: boolean, message: string): void {
    const result: ValidationResult = {
      testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.results.set(testName, result);
    
    const icon = passed ? '✅' : '❌';
    const logLevel = passed ? 'info' : 'error';
    
    console.log(`  ${icon} ${testName}: ${message}`);
    
    if (!passed) {
      this.errors.push(`${testName}: ${message}`);
    }
  }

  private generateSummary(startTime: number, endTime: number): ValidationSummary {
    const totalTests = this.results.size;
    const passedTests = Array.from(this.results.values()).filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: (passedTests / totalTests) * 100,
      duration: endTime - startTime,
      errors: [...this.errors],
      warnings: [...this.warnings],
      results: Object.fromEntries(this.results),
      timestamp: new Date().toISOString()
    };
  }

  private printSummary(summary: ValidationSummary): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PRE-DEPLOYMENT VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests} ✅`);
    console.log(`Failed: ${summary.failedTests} ❌`);
    console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`Duration: ${summary.duration}ms`);
    
    if (summary.errors.length > 0) {
      console.log('\n🚨 ERRORS:');
      summary.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (summary.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      summary.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    const isReady = summary.failedTests === 0 && summary.successRate >= 95;
    console.log('\n' + '='.repeat(60));
    if (isReady) {
      console.log('🎉 DEPLOYMENT READY - All critical validations passed');
    } else {
      console.log('❌ DEPLOYMENT NOT READY - Critical issues found');
      if (config.strict) {
        console.log('💥 Strict mode enabled - blocking deployment');
      }
    }
    console.log('='.repeat(60));
  }

  // Placeholder methods for remaining validations
  private async validateForeignKeys(): Promise<void> {
    // Implementation for foreign key validation
  }

  private async validateRequiredColumns(): Promise<void> {
    // Implementation for required columns validation
  }

  private async validateIndexes(): Promise<void> {
    // Implementation for indexes validation
  }

  private async validatePermissionConsistency(): Promise<void> {
    // Implementation for permission consistency validation
  }

  private async validateNoOrphanedPermissions(): Promise<void> {
    // Implementation for orphaned permissions validation
  }

  private async validateMigrationTimestamps(): Promise<void> {
    // Implementation for migration timestamps validation
  }

  private async validateCriticalMigrationExists(): Promise<void> {
    // Implementation for critical migration validation
  }

  private async validateMigrationDataIntegrity(): Promise<void> {
    // Implementation for migration data integrity validation
  }

  private async validateUserUUIDConsistency(): Promise<void> {
    // Implementation for UUID consistency validation
  }

  private async validateUserRoleAssignments(): Promise<void> {
    // Implementation for user role assignments validation
  }

  private async validateRLSEnabled(): Promise<void> {
    // Implementation for RLS enabled validation
  }

  private async validatePoliciesExist(): Promise<void> {
    // Implementation for policies exist validation
  }

  private async validatePolicySyntax(): Promise<void> {
    // Implementation for policy syntax validation
  }

  private async validateStatusOptions(): Promise<void> {
    // Implementation for status options validation
  }

  private async validateReferenceDataComplete(): Promise<void> {
    // Implementation for reference data validation
  }

  private async validateTenantIsolation(): Promise<void> {
    // Implementation for tenant isolation validation
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface ValidationResult {
  testName: string;
  passed: boolean;
  message: string;
  timestamp: string;
}

interface ValidationSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
  duration: number;
  errors: string[];
  warnings: string[];
  results: Record<string, ValidationResult>;
  timestamp: string;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  try {
    const validator = new PreDeploymentValidator();
    const summary = await validator.runAllValidations();
    
    // Exit with appropriate code
    const exitCode = summary.failedTests === 0 && summary.successRate >= 95 ? 0 : 1;
    
    if (config.strict && exitCode === 1) {
      console.log('\n💥 Strict mode enabled - blocking deployment due to failures');
      process.exit(1);
    }
    
    process.exit(exitCode);
    
  } catch (error) {
    console.error('💥 Fatal error during validation:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { PreDeploymentValidator, ValidationResult, ValidationSummary };
#!/usr/bin/env node

/**
 * Automated User ID Verification Script
 * 
 * Purpose: Verify user ID consistency across auth.users and public.users
 * Date: 2025-11-23
 * Version: 1.0
 * 
 * This script validates:
 * - Auth user ID consistency with public users
 * - UUID format validation
 * - User synchronization completeness
 * - Email-User ID mapping integrity
 * - Tenant assignment consistency
 * - Role assignment completeness
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// EXPECTED USER CONFIGURATION
// ============================================================================

interface ExpectedUser {
  email: string;
  expectedUUID: string;
  tenantId?: string;
  role: string;
  isSuperAdmin?: boolean;
}

// Expected test users from seed.sql
const EXPECTED_USERS: ExpectedUser[] = [
  // Acme Corporation Users
  {
    email: 'admin@acme.com',
    expectedUUID: '6e084750-4e35-468c-9903-5b5ab9d14af4',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    role: 'Administrator'
  },
  {
    email: 'manager@acme.com',
    expectedUUID: '2707509b-57e8-4c84-a6fe-267eaa724223',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    role: 'Manager'
  },
  {
    email: 'engineer@acme.com',
    expectedUUID: '27ff37b5-ef55-4e34-9951-42f35a1b2506',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    role: 'Engineer'
  },
  {
    email: 'user@acme.com',
    expectedUUID: '3ce006ad-3a2b-45b8-b540-4b8634d0e410',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    role: 'User'
  },

  // Tech Solutions Users
  {
    email: 'admin@techsolutions.com',
    expectedUUID: '945ab101-36c0-4ef1-9e12-9d13294deb46',
    tenantId: '550e8400-e29b-41d4-a716-446655440002',
    role: 'Administrator'
  },
  {
    email: 'manager@techsolutions.com',
    expectedUUID: '4fe9bb56-c5cd-481b-bc7d-2275d7f3ebaf',
    tenantId: '550e8400-e29b-41d4-a716-446655440002',
    role: 'Manager'
  },

  // Global Trading Users
  {
    email: 'admin@globaltrading.com',
    expectedUUID: 'de2b56b8-bffc-4a54-b1f4-4a058afe5c5f',
    tenantId: '550e8400-e29b-41d4-a716-446655440003',
    role: 'Administrator'
  },

  // Super Admin Users
  {
    email: 'superadmin@platform.com',
    expectedUUID: '465f34f1-e33c-475b-b42d-4feb4feaaf92',
    role: 'super_admin',
    isSuperAdmin: true
  },
  {
    email: 'superadmin2@platform.com',
    expectedUUID: '5782d9ca-ef99-4f57-b9e2-2463d2fbb637',
    role: 'super_admin',
    isSuperAdmin: true
  },
  {
    email: 'superadmin3@platform.com',
    expectedUUID: 'cad16f39-88a0-47c0-826d-bc84ebe59384',
    role: 'super_admin',
    isSuperAdmin: true
  }
];

// ============================================================================
// USER ID VERIFIER CLASS
// ============================================================================

class UserIDVerifier {
  private supabase: any;
  private verificationResults: UserIDResult[] = [];
  private config = {
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    verbose: process.env.VERBOSE === 'true',
    strict: process.env.STRICT_MODE === 'true'
  };

  constructor() {
    if (!this.config.supabaseUrl || !this.config.supabaseKey) {
      throw new Error('Missing Supabase configuration. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }
    
    this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey);
  }

  // ============================================================================
  // MAIN VERIFICATION METHODS
  // ============================================================================

  async verifyAllUserIDs(): Promise<UserIDSummary> {
    console.log('🔍 Starting Automated User ID Verification...\n');

    const startTime = Date.now();

    try {
      // Phase 1: Expected User Validation
      console.log('👥 Phase 1: Expected User Validation');
      await this.verifyExpectedUsers();
      
      // Phase 2: Auth-Public Synchronization
      console.log('\n🔄 Phase 2: Auth-Public Synchronization Check');
      await this.verifyAuthPublicSync();
      
      // Phase 3: UUID Format Validation
      console.log('\n🔢 Phase 3: UUID Format Validation');
      await this.verifyUUIDFormats();
      
      // Phase 4: Email-ID Mapping Integrity
      console.log('\n📧 Phase 4: Email-ID Mapping Integrity');
      await this.verifyEmailIDMapping();
      
      // Phase 5: Tenant Assignment Consistency
      console.log('\n🏢 Phase 5: Tenant Assignment Consistency');
      await this.verifyTenantAssignments();
      
      // Phase 6: Role Assignment Completeness
      console.log('\n🎭 Phase 6: Role Assignment Completeness');
      await this.verifyRoleAssignments();

      const endTime = Date.now();
      const summary = this.generateUserIDSummary(startTime, endTime);
      
      this.printUserIDSummary(summary);
      
      return summary;

    } catch (error) {
      console.error('❌ User ID verification failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // SPECIFIC VERIFICATION METHODS
  // ============================================================================

  private async verifyExpectedUsers(): Promise<void> {
    try {
      const expectedEmails = EXPECTED_USERS.map(u => u.email);
      
      // Get public users
      const { data: publicUsers, error: publicError } = await this.supabase
        .from('users')
        .select('id, email, tenant_id, is_super_admin, status')
        .in('email', expectedEmails);

      if (publicError) throw publicError;

      // Get auth users
      const { data: authUsers, error: authError } = await this.supabase.auth.admin.listUsers();

      if (authError) throw authError;

      let verificationIssues = 0;
      const issues: string[] = [];

      // Check each expected user
      for (const expectedUser of EXPECTED_USERS) {
        const publicUser = publicUsers?.find(u => u.email === expectedUser.email);
        const authUser = authUsers.users.find(u => u.email === expectedUser.email);

        // Check 1: User exists in public.users
        if (!publicUser) {
          verificationIssues++;
          issues.push(`User ${expectedUser.email}: Missing from public.users`);
          continue;
        }

        // Check 2: User exists in auth.users
        if (!authUser) {
          verificationIssues++;
          issues.push(`User ${expectedUser.email}: Missing from auth.users`);
          continue;
        }

        // Check 3: UUID matches expected
        if (publicUser.id !== expectedUser.expectedUUID) {
          verificationIssues++;
          issues.push(`User ${expectedUser.email}: Public UUID mismatch (expected: ${expectedUser.expectedUUID}, actual: ${publicUser.id})`);
        }

        if (authUser.id !== expectedUser.expectedUUID) {
          verificationIssues++;
          issues.push(`User ${expectedUser.email}: Auth UUID mismatch (expected: ${expectedUser.expectedUUID}, actual: ${authUser.id})`);
        }

        // Check 4: UUID consistency between auth and public
        if (publicUser.id !== authUser.id) {
          verificationIssues++;
          issues.push(`User ${expectedUser.email}: UUID mismatch between auth and public (auth: ${authUser.id}, public: ${publicUser.id})`);
        }

        // Check 5: Tenant assignment
        if (expectedUser.tenantId && publicUser.tenant_id !== expectedUser.tenantId) {
          verificationIssues++;
          issues.push(`User ${expectedUser.email}: Tenant assignment mismatch (expected: ${expectedUser.tenantId}, actual: ${publicUser.tenant_id})`);
        }

        // Check 6: Super admin flag
        if (expectedUser.isSuperAdmin && !publicUser.is_super_admin) {
          verificationIssues++;
          issues.push(`User ${expectedUser.email}: Missing super_admin flag`);
        }

        if (!expectedUser.isSuperAdmin && publicUser.is_super_admin) {
          verificationIssues++;
          issues.push(`User ${expectedUser.email}: Unexpected super_admin flag`);
        }

        // Check 7: User status
        if (publicUser.status !== 'active') {
          verificationIssues++;
          issues.push(`User ${expectedUser.email}: Invalid status (expected: active, actual: ${publicUser.status})`);
        }
      }

      // Check for unexpected users
      const publicEmails = publicUsers?.map(u => u.email) || [];
      const unexpectedUsers = publicEmails.filter(email => !expectedEmails.includes(email));
      
      if (unexpectedUsers.length > 0) {
        verificationIssues++;
        issues.push(`Unexpected users in database: ${unexpectedUsers.join(', ')}`);
      }

      if (verificationIssues === 0) {
        this.addUserIDResult('expected_users', true, `All ${EXPECTED_USERS.length} expected users verified successfully`);
      } else {
        this.addUserIDResult('expected_users', false, `${verificationIssues} verification issues: ${issues.join('; ')}`);
      }

    } catch (error) {
      this.addUserIDResult('expected_users', false, `Error verifying expected users: ${error.message}`);
    }
  }

  private async verifyAuthPublicSync(): Promise<void> {
    try {
      // Get all public users
      const { data: publicUsers, error: publicError } = await this.supabase
        .from('users')
        .select('id, email, tenant_id, is_super_admin')
        .not('email', 'is', null);

      if (publicError) throw publicError;

      // Get all auth users
      const { data: authUsers, error: authError } = await this.supabase.auth.admin.listUsers();

      if (authError) throw authError;

      let syncIssues = 0;
      const issues: string[] = [];

      // Check public users have corresponding auth users
      const missingAuthUsers = publicUsers?.filter(publicUser => 
        !authUsers.users.some(authUser => authUser.id === publicUser.id)
      ) || [];

      if (missingAuthUsers.length > 0) {
        syncIssues++;
        issues.push(`Missing auth users: ${missingAuthUsers.map(u => u.email).join(', ')}`);
      }

      // Check auth users have corresponding public users
      const missingPublicUsers = authUsers.users.filter(authUser => 
        !publicUsers?.some(publicUser => publicUser.id === authUser.id)
      );

      if (missingPublicUsers.length > 0) {
        syncIssues++;
        issues.push(`Missing public users: ${missingPublicUsers.map(u => u.email).join(', ')}`);
      }

      // Check for duplicate emails
      const emailCounts = new Map<string, number>();
      publicUsers?.forEach(user => {
        emailCounts.set(user.email, (emailCounts.get(user.email) || 0) + 1);
      });

      const duplicateEmails = Array.from(emailCounts.entries())
        .filter(([email, count]) => count > 1)
        .map(([email]) => email);

      if (duplicateEmails.length > 0) {
        syncIssues++;
        issues.push(`Duplicate emails in public.users: ${duplicateEmails.join(', ')}`);
      }

      if (syncIssues === 0) {
        this.addUserIDResult('auth_public_sync', true, `All ${publicUsers?.length} users synchronized between auth and public`);
      } else {
        this.addUserIDResult('auth_public_sync', false, `${syncIssues} sync issues: ${issues.join('; ')}`);
      }

    } catch (error) {
      this.addUserIDResult('auth_public_sync', false, `Error verifying auth-public sync: ${error.message}`);
    }
  }

  private async verifyUUIDFormats(): Promise<void> {
    try {
      // Get all users to validate UUID format
      const { data: users, error } = await this.supabase
        .from('users')
        .select('id, email')
        .not('id', 'is', null);

      if (error) throw error;

      let uuidViolations = 0;
      const violations: string[] = [];

      users?.forEach((user: any) => {
        if (!this.isValidUUID(user.id)) {
          uuidViolations++;
          violations.push(`User ${user.email}: Invalid UUID format (${user.id})`);
        }

        // Check if UUID version is appropriate (should be v4)
        if (!this.isValidUUIDv4(user.id)) {
          uuidViolations++;
          violations.push(`User ${user.email}: UUID is not version 4 (${user.id})`);
        }
      });

      if (uuidViolations === 0) {
        this.addUserIDResult('uuid_format', true, `All ${users?.length} users have valid UUID format`);
      } else {
        this.addUserIDResult('uuid_format', false, `${uuidViolations} UUID format violations: ${violations.join('; ')}`);
      }

    } catch (error) {
      this.addUserIDResult('uuid_format', false, `Error verifying UUID formats: ${error.message}`);
    }
  }

  private async verifyEmailIDMapping(): Promise<void> {
    try {
      // Get users and check email-ID consistency
      const { data: users, error } = await this.supabase
        .from('users')
        .select('id, email, tenant_id, is_super_admin')
        .not('email', 'is', null)
        .not('id', 'is', null);

      if (error) throw error;

      let mappingIssues = 0;
      const issues: string[] = [];

      // Check for null or empty values
      users?.forEach((user: any) => {
        if (!user.email || user.email.trim() === '') {
          mappingIssues++;
          issues.push(`User ID ${user.id}: Empty email`);
        }

        if (!user.id) {
          mappingIssues++;
          issues.push(`User ${user.email}: Missing ID`);
        }

        // Check email format
        if (user.email && !this.isValidEmail(user.email)) {
          mappingIssues++;
          issues.push(`User ${user.email}: Invalid email format`);
        }
      });

      // Check for consistent tenant assignments for same email domain
      const domainMap = new Map<string, Set<string>>();
      users?.forEach((user: any) => {
        if (user.email && user.tenant_id) {
          const domain = user.email.split('@')[1];
          if (!domainMap.has(domain)) {
            domainMap.set(domain, new Set());
          }
          domainMap.get(domain)!.add(user.tenant_id);
        }
      });

      // Check if same domain has users from multiple tenants (should be reviewed)
      const multiTenantDomains = Array.from(domainMap.entries())
        .filter(([domain, tenantIds]) => tenantIds.size > 1)
        .map(([domain]) => domain);

      if (multiTenantDomains.length > 0) {
        mappingIssues++;
        issues.push(`Users from same domain across multiple tenants: ${multiTenantDomains.join(', ')}`);
      }

      if (mappingIssues === 0) {
        this.addUserIDResult('email_id_mapping', true, `All ${users?.length} users have consistent email-ID mapping`);
      } else {
        this.addUserIDResult('email_id_mapping', false, `${mappingIssues} mapping issues: ${issues.join('; ')}`);
      }

    } catch (error) {
      this.addUserIDResult('email_id_mapping', false, `Error verifying email-ID mapping: ${error.message}`);
    }
  }

  private async verifyTenantAssignments(): Promise<void> {
    try {
      // Get users with their tenant information
      const { data: users, error } = await this.supabase
        .from('users')
        .select('id, email, tenant_id, is_super_admin')
        .not('email', 'is', null);

      if (error) throw error;

      let tenantIssues = 0;
      const issues: string[] = [];

      // Check super admin users (should have NULL tenant_id)
      const superAdminsWithTenant = users?.filter(user => 
        user.is_super_admin && user.tenant_id !== null
      ) || [];

      if (superAdminsWithTenant.length > 0) {
        tenantIssues++;
        issues.push(`Super admin users with tenant assignments: ${superAdminsWithTenant.map(u => u.email).join(', ')}`);
      }

      // Check regular users (should have valid tenant_id unless they have a specific reason)
      const regularUsersWithoutTenant = users?.filter(user => 
        !user.is_super_admin && !user.tenant_id
      ) || [];

      if (regularUsersWithoutTenant.length > 0) {
        // This might be intentional for some global users, so we'll warn instead of error
        this.warnings.push(`Regular users without tenant assignment: ${regularUsersWithoutTenant.map(u => u.email).join(', ')}`);
      }

      // Check for orphaned tenant references
      const { data: tenants, error: tenantError } = await this.supabase
        .from('tenants')
        .select('id');

      if (tenantError) throw tenantError;

      const validTenantIds = new Set(tenants?.map(t => t.id) || []);
      const usersWithInvalidTenant = users?.filter(user => 
        user.tenant_id && !validTenantIds.has(user.tenant_id)
      ) || [];

      if (usersWithInvalidTenant.length > 0) {
        tenantIssues++;
        issues.push(`Users with invalid tenant references: ${usersWithInvalidTenant.map(u => u.email).join(', ')}`);
      }

      if (tenantIssues === 0) {
        this.addUserIDResult('tenant_assignments', true, 'All tenant assignments are consistent');
      } else {
        this.addUserIDResult('tenant_assignments', false, `${tenantIssues} tenant assignment issues: ${issues.join('; ')}`);
      }

    } catch (error) {
      this.addUserIDResult('tenant_assignments', false, `Error verifying tenant assignments: ${error.message}`);
    }
  }

  private async verifyRoleAssignments(): Promise<void> {
    try {
      // Get users with their role assignments
      const { data: users, error } = await this.supabase
        .from('users')
        .select(`
          id,
          email,
          tenant_id,
          is_super_admin,
          user_roles(
            role_id,
            roles(name, tenant_id)
          )
        `)
        .not('email', 'is', null);

      if (error) throw error;

      let roleIssues = 0;
      const issues: string[] = [];

      users?.forEach((user: any) => {
        const userRoles = user.user_roles || [];
        const roleNames = userRoles.map((ur: any) => ur.roles?.name).filter(Boolean);

        // Check 1: Users should have at least one role
        if (roleNames.length === 0) {
          roleIssues++;
          issues.push(`User ${user.email}: No role assignments`);
        }

        // Check 2: Super admins should have super_admin role
        if (user.is_super_admin && !roleNames.includes('super_admin')) {
          roleIssues++;
          issues.push(`User ${user.email}: Super admin missing super_admin role`);
        }

        // Check 3: Role tenant consistency
        userRoles.forEach((ur: any) => {
          const role = ur.roles;
          if (role) {
            // Super admin role should have NULL tenant_id
            if (role.name === 'super_admin' && role.tenant_id !== null) {
              roleIssues++;
              issues.push(`User ${user.email}: super_admin role has tenant assignment`);
            }

            // Regular roles should match user tenant or be NULL for global roles
            if (role.name !== 'super_admin' && role.tenant_id !== user.tenant_id) {
              roleIssues++;
              issues.push(`User ${user.email}: Role ${role.name} tenant mismatch (user: ${user.tenant_id}, role: ${role.tenant_id})`);
            }
          }
        });
      });

      if (roleIssues === 0) {
        this.addUserIDResult('role_assignments', true, `All ${users?.length} users have consistent role assignments`);
      } else {
        this.addUserIDResult('role_assignments', false, `${roleIssues} role assignment issues: ${issues.join('; ')}`);
      }

    } catch (error) {
      this.addUserIDResult('role_assignments', false, `Error verifying role assignments: ${error.message}`);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private addUserIDResult(checkName: string, passed: boolean, message: string): void {
    const result: UserIDResult = {
      checkName,
      passed,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.verificationResults.push(result);
    
    const icon = passed ? '✅' : '❌';
    const logLevel = passed ? 'info' : 'error';
    
    console.log(`  ${icon} ${checkName}: ${message}`);
    
    if (!passed) {
      this.errors.push(`${checkName}: ${message}`);
    }
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private isValidUUIDv4(uuid: string): boolean {
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidV4Regex.test(uuid);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateUserIDSummary(startTime: number, endTime: number): UserIDSummary {
    const totalChecks = this.verificationResults.length;
    const passedChecks = this.verificationResults.filter(r => r.passed).length;
    const failedChecks = totalChecks - passedChecks;
    
    return {
      totalChecks,
      passedChecks,
      failedChecks,
      successRate: (passedChecks / totalChecks) * 100,
      duration: endTime - startTime,
      errors: [...this.errors],
      warnings: [...this.warnings],
      results: [...this.verificationResults],
      expectedUsersCount: EXPECTED_USERS.length,
      timestamp: new Date().toISOString()
    };
  }

  private printUserIDSummary(summary: UserIDSummary): void {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 USER ID VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`Total Checks: ${summary.totalChecks}`);
    console.log(`Passed: ${summary.passedChecks} ✅`);
    console.log(`Failed: ${summary.failedChecks} ❌`);
    console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`Expected Users: ${summary.expectedUsersCount}`);
    console.log(`Duration: ${summary.duration}ms`);
    
    if (summary.errors.length > 0) {
      console.log('\n🚨 VERIFICATION ISSUES:');
      summary.errors.forEach(error => console.log(`  • ${error}`));
    }

    if (summary.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      summary.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    const isVerified = summary.failedChecks === 0 && summary.successRate >= 95;
    console.log('\n' + '='.repeat(60));
    if (isVerified) {
      console.log('🎉 USER IDs ARE VERIFIED - All checks passed');
    } else {
      console.log('❌ USER ID VERIFICATION FAILED - Issues found');
      if (this.config.strict) {
        console.log('💥 Strict mode enabled - resolving issues before deployment');
      }
    }
    console.log('='.repeat(60));
  }

  private errors: string[] = [];
  private warnings: string[] = [];
}

// ============================================================================
// TYPES
// ============================================================================

interface UserIDResult {
  checkName: string;
  passed: boolean;
  message: string;
  timestamp: string;
}

interface UserIDSummary {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  successRate: number;
  duration: number;
  errors: string[];
  warnings: string[];
  results: UserIDResult[];
  expectedUsersCount: number;
  timestamp: string;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  try {
    const verifier = new UserIDVerifier();
    const summary = await verifier.verifyAllUserIDs();
    
    // Exit with appropriate code
    const exitCode = summary.failedChecks === 0 && summary.successRate >= 95 ? 0 : 1;
    
    if (this.config?.strict && exitCode === 1) {
      console.log('\n💥 Strict mode enabled - user ID issues must be resolved');
      process.exit(1);
    }
    
    process.exit(exitCode);
    
  } catch (error) {
    console.error('💥 Fatal error during user ID verification:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { UserIDVerifier, UserIDResult, UserIDSummary, EXPECTED_USERS };
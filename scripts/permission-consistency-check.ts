#!/usr/bin/env node

/**
 * Permission Consistency Checks Script
 * 
 * Purpose: Validate permission system consistency across all layers
 * Date: 2025-11-23
 * Version: 1.0
 * 
 * This script validates:
 * - Permission format consistency (resource:action)
 * - Role-permission mapping integrity
 * - Permission inheritance and hierarchy
 * - Auth user permission assignments
 * - Cross-tenant permission isolation
 * - Orphaned permissions detection
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// PERMISSION CONSISTENCY VALIDATOR CLASS
// ============================================================================

class PermissionConsistencyChecker {
  private supabase: any;
  private consistencyResults: ConsistencyResult[] = [];
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
  // MAIN CONSISTENCY CHECK METHODS
  // ============================================================================

  async runAllConsistencyChecks(): Promise<ConsistencySummary> {
    console.log('🔍 Starting Permission Consistency Checks...\n');

    const startTime = Date.now();

    try {
      // Phase 1: Permission Format Consistency
      console.log('📝 Phase 1: Permission Format Consistency');
      await this.checkPermissionFormatConsistency();
      
      // Phase 2: Role-Permission Mapping Integrity
      console.log('\n🔗 Phase 2: Role-Permission Mapping Integrity');
      await this.checkRolePermissionMapping();
      
      // Phase 3: Permission Inheritance Validation
      console.log('\n🌳 Phase 3: Permission Inheritance Validation');
      await this.checkPermissionInheritance();
      
      // Phase 4: Auth User Permission Assignments
      console.log('\n👤 Phase 4: Auth User Permission Assignments');
      await this.checkAuthUserPermissions();
      
      // Phase 5: Cross-Tenant Permission Isolation
      console.log('\n🏢 Phase 5: Cross-Tenant Permission Isolation');
      await this.checkTenantPermissionIsolation();
      
      // Phase 6: Orphaned Resources Detection
      console.log('\n🔍 Phase 6: Orphaned Resources Detection');
      await this.checkOrphanedPermissions();

      const endTime = Date.now();
      const summary = this.generateConsistencySummary(startTime, endTime);
      
      this.printConsistencySummary(summary);
      
      return summary;

    } catch (error) {
      console.error('❌ Permission consistency checks failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // SPECIFIC CONSISTENCY CHECK METHODS
  // ============================================================================

  private async checkPermissionFormatConsistency(): Promise<void> {
    try {
      // Get all permissions from database
      const { data: permissions, error } = await this.supabase
        .from('permissions')
        .select('id, name, resource, action, category, description')
        .not('name', 'is', null);

      if (error) throw error;

      let formatViolations = 0;
      const violations: string[] = [];

      permissions?.forEach((perm: any) => {
        const name = perm.name;
        const resource = perm.resource;
        const action = perm.action;

        // Check 1: Resource:Action format consistency
        if (name.includes(':')) {
          const [expectedResource, expectedAction] = name.split(':');
          if (expectedResource !== resource || expectedAction !== action) {
            formatViolations++;
            violations.push(`Permission ${name}: name format (${expectedResource}:${expectedAction}) doesn't match resource/action fields (${resource}:${action})`);
          }
        }

        // Check 2: Core permissions should not have colon
        const corePermissions = ['read', 'write', 'delete', 'crm:platform:control:admin', 'super_admin', 'system_monitoring'];
        if (corePermissions.includes(name) && name.includes(':')) {
          formatViolations++;
          violations.push(`Core permission ${name} should not contain colon`);
        }

        // Check 3: Module permissions should have resource:action format
        const modulePermissions = ['crm:user:record:update', 'customers:manage', 'sales:manage', 'contracts:manage'];
        if (modulePermissions.some(mp => name.startsWith(mp.split(':')[0] + ':')) && !name.includes(':')) {
          formatViolations++;
          violations.push(`Module permission ${name} should use resource:action format`);
        }

        // Check 4: Resource and action fields should not be null for non-core permissions
        if (!corePermissions.includes(name) && (!resource || !action)) {
          formatViolations++;
          violations.push(`Permission ${name} missing required resource/action fields`);
        }
      });

      if (formatViolations === 0) {
        this.addConsistencyResult('permission_format', true, `All ${permissions?.length} permissions follow consistent format`);
      } else {
        this.addConsistencyResult('permission_format', false, `${formatViolations} format violations found: ${violations.join('; ')}`);
      }

    } catch (error) {
      this.addConsistencyResult('permission_format', false, `Error checking permission format: ${error.message}`);
    }
  }

  private async checkRolePermissionMapping(): Promise<void> {
    try {
      // Get all role-permission relationships
      const { data: rolePermissions, error } = await this.supabase
        .from('role_permissions')
        .select(`
          role_id,
          permission_id,
          granted_by,
          roles(name, tenant_id),
          permissions(name, resource, action)
        `);

      if (error) throw error;

      let mappingIssues = 0;
      const issues: string[] = [];

      // Group by role for analysis
      const roleMap = new Map();
      rolePermissions?.forEach((rp: any) => {
        const roleName = rp.roles?.name;
        const tenantId = rp.roles?.tenant_id;
        const roleKey = `${roleName}_${tenantId || 'global'}`;

        if (!roleMap.has(roleKey)) {
          roleMap.set(roleKey, []);
        }
        roleMap.get(roleKey).push(rp);
      });

      // Check each role's permissions
      for (const [roleKey, permissions] of roleMap) {
        const [roleName, tenantScope] = roleKey.split('_');
        
        // Check for duplicate permissions in same role
        const permissionNames = permissions.map((p: any) => p.permissions?.name);
        const duplicates = permissionNames.filter((name: string, index: number) => permissionNames.indexOf(name) !== index);
        if (duplicates.length > 0) {
          mappingIssues++;
          issues.push(`Role ${roleName} (${tenantScope}): Duplicate permissions - ${duplicates.join(', ')}`);
        }

        // Check permission hierarchy (basic validation)
        const hasRead = permissionNames.includes('read');
        const hasWrite = permissionNames.includes('write');
        const hasManage = permissionNames.some((name: string) => name.includes(':manage'));

        // Users with manage permissions should have read/write
        if (hasManage && (!hasRead || !hasWrite)) {
          mappingIssues++;
          issues.push(`Role ${roleName} (${tenantScope}): Has manage permissions but missing basic read/write permissions`);
        }

        // Check granted_by field is valid
        const invalidGrantedBy = permissions.filter((p: any) => 
          p.granted_by && !this.isValidUUID(p.granted_by)
        );
        if (invalidGrantedBy.length > 0) {
          mappingIssues++;
          issues.push(`Role ${roleName} (${tenantScope}): ${invalidGrantedBy.length} entries with invalid granted_by field`);
        }
      }

      if (mappingIssues === 0) {
        this.addConsistencyResult('role_mapping', true, `All ${rolePermissions?.length} role-permission mappings are consistent`);
      } else {
        this.addConsistencyResult('role_mapping', false, `${mappingIssues} mapping issues: ${issues.join('; ')}`);
      }

    } catch (error) {
      this.addConsistencyResult('role_mapping', false, `Error checking role-permission mapping: ${error.message}`);
    }
  }

  private async checkPermissionInheritance(): Promise<void> {
    try {
      // Define permission hierarchy rules
      const hierarchyRules = [
        {
          parent: 'read',
          children: [],
          description: 'Basic read permission'
        },
        {
          parent: 'write',
          children: ['read'],
          description: 'Write includes read'
        },
        {
          parent: 'delete',
          children: ['write', 'read'],
          description: 'Delete includes write and read'
        }
      ];

      // Check if roles follow hierarchy rules
      const { data: roles, error } = await this.supabase
        .from('roles')
        .select('id, name, permissions')
        .eq('is_system_role', false); // Only check custom roles

      if (error) throw error;

      let hierarchyViolations = 0;
      const violations: string[] = [];

      roles?.forEach((role: any) => {
        const rolePermissions = role.permissions || [];
        
        hierarchyRules.forEach(rule => {
          const hasParent = rolePermissions.includes(rule.parent);
          const missingChildren = rule.children.filter(child => !rolePermissions.includes(child));
          
          if (hasParent && missingChildren.length > 0) {
            hierarchyViolations++;
            violations.push(`Role ${role.name}: Has ${rule.parent} but missing child permissions: ${missingChildren.join(', ')}`);
          }
        });
      });

      if (hierarchyViolations === 0) {
        this.addConsistencyResult('permission_inheritance', true, 'All roles follow permission hierarchy rules');
      } else {
        this.addConsistencyResult('permission_inheritance', false, `${hierarchyViolations} hierarchy violations: ${violations.join('; ')}`);
      }

    } catch (error) {
      this.addConsistencyResult('permission_inheritance', false, `Error checking permission inheritance: ${error.message}`);
    }
  }

  private async checkAuthUserPermissions(): Promise<void> {
    try {
      // Get all users with their roles and permissions
      const { data: users, error } = await this.supabase
        .from('users')
        .select(`
          id,
          email,
          tenant_id,
          is_super_admin,
          user_roles(
            roles(
              name,
              permissions
            )
          )
        `);

      if (error) throw error;

      let permissionIssues = 0;
      const issues: string[] = [];

      users?.forEach((user: any) => {
        const userPermissions = new Set<string>();
        const hasInconsistentPermissions = false;

        // Aggregate permissions from all roles
        user.user_roles?.forEach((ur: any) => {
          const rolePermissions = ur.roles?.permissions || [];
          rolePermissions.forEach((perm: string) => userPermissions.add(perm));
        });

        // Check super admin consistency
        if (user.is_super_admin) {
          const expectedSuperPermissions = ['super_admin', 'crm:platform:control:admin'];
          const missingSuperPerms = expectedSuperPermissions.filter(perm => !userPermissions.has(perm));
          
          if (missingSuperPerms.length > 0) {
            permissionIssues++;
            issues.push(`User ${user.email}: Super admin missing expected permissions: ${missingSuperPerms.join(', ')}`);
          }
        }

        // Check for permission consistency within roles
        user.user_roles?.forEach((ur: any) => {
          const rolePermissions = ur.roles?.permissions || [];
          const roleName = ur.roles?.name;

          // Basic role permission validation
          const hasBasicPerms = rolePermissions.some((perm: string) => 
            ['read', 'write'].includes(perm)
          );

          if (roleName !== 'Customer' && !hasBasicPerms) {
            permissionIssues++;
            issues.push(`User ${user.email}: Role ${roleName} missing basic read/write permissions`);
          }
        });
      });

      if (permissionIssues === 0) {
        this.addConsistencyResult('auth_user_permissions', true, `All ${users?.length} users have consistent permissions`);
      } else {
        this.addConsistencyResult('auth_user_permissions', false, `${permissionIssues} user permission issues: ${issues.join('; ')}`);
      }

    } catch (error) {
      this.addConsistencyResult('auth_user_permissions', false, `Error checking auth user permissions: ${error.message}`);
    }
  }

  private async checkTenantPermissionIsolation(): Promise<void> {
    try {
      // Check that tenant-scoped roles don't have global permissions inappropriately
      const { data: roles, error } = await this.supabase
        .from('roles')
        .select('id, name, tenant_id, permissions')
        .not('tenant_id', 'is', null);

      if (error) throw error;

      let isolationIssues = 0;
      const issues: string[] = [];

      roles?.forEach((role: any) => {
        const rolePermissions = role.permissions || [];
        const tenantId = role.tenant_id;

        // Check for inappropriate global permissions in tenant roles
        const globalPermissions = ['super_admin', 'crm:platform:control:admin', 'system_monitoring'];
        const inappropriatePerms = rolePermissions.filter((perm: string) => 
          globalPermissions.includes(perm)
        );

        if (inappropriatePerms.length > 0) {
          isolationIssues++;
          issues.push(`Tenant role ${role.name} (${tenantId}): Contains global permissions - ${inappropriatePerms.join(', ')}`);
        }

        // Check that tenant roles have appropriate module permissions
        const modulePermissions = rolePermissions.filter((perm: string) => perm.includes(':manage'));
        if (modulePermissions.length === 0 && role.name !== 'Customer') {
          isolationIssues++;
          issues.push(`Tenant role ${role.name} (${tenantId}): Missing module management permissions`);
        }
      });

      if (isolationIssues === 0) {
        this.addConsistencyResult('tenant_isolation', true, 'All tenant roles properly isolated');
      } else {
        this.addConsistencyResult('tenant_isolation', false, `${isolationIssues} isolation issues: ${issues.join('; ')}`);
      }

    } catch (error) {
      this.addConsistencyResult('tenant_isolation', false, `Error checking tenant isolation: ${error.message}`);
    }
  }

  private async checkOrphanedPermissions(): Promise<void> {
    try {
      // Check for permissions not assigned to any role
      const { data: unusedPermissions, error: unusedError } = await this.supabase
        .from('permissions')
        .select('id, name')
        .not('id', 'in', `(${this.buildSubqueryForUsedPermissions()})`);

      if (unusedError) throw unusedError;

      // Check for roles with no permissions
      const { data: emptyRoles, error: emptyError } = await this.supabase
        .from('roles')
        .select('id, name, tenant_id')
        .not('id', 'in', `(${this.buildSubqueryForRolesWithPermissions()})`);

      if (emptyError) throw emptyError;

      // Check for users with no roles
      const { data: usersWithoutRoles, error: usersError } = await this.supabase
        .from('users')
        .select('id, email')
        .not('id', 'in', `(${this.buildSubqueryForUsersWithRoles()})`);

      if (usersError) throw usersError;

      const orphanedItems = [];
      
      if (unusedPermissions && unusedPermissions.length > 0) {
        orphanedItems.push(`Unused permissions: ${unusedPermissions.map(p => p.name).join(', ')}`);
      }

      if (emptyRoles && emptyRoles.length > 0) {
        orphanedItems.push(`Empty roles: ${emptyRoles.map(r => r.name).join(', ')}`);
      }

      if (usersWithoutRoles && usersWithoutRoles.length > 0) {
        orphanedItems.push(`Users without roles: ${usersWithoutRoles.map(u => u.email).join(', ')}`);
      }

      if (orphanedItems.length === 0) {
        this.addConsistencyResult('orphaned_resources', true, 'No orphaned permissions, roles, or users detected');
      } else {
        this.addConsistencyResult('orphaned_resources', false, `Orphaned resources found: ${orphanedItems.join('; ')}`);
      }

    } catch (error) {
      this.addConsistencyResult('orphaned_resources', false, `Error checking orphaned resources: ${error.message}`);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private addConsistencyResult(checkName: string, passed: boolean, message: string): void {
    const result: ConsistencyResult = {
      checkName,
      passed,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.consistencyResults.push(result);
    
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

  private buildSubqueryForUsedPermissions(): string {
    // This would be replaced with actual Supabase query building
    return "SELECT DISTINCT permission_id FROM role_permissions";
  }

  private buildSubqueryForRolesWithPermissions(): string {
    // This would be replaced with actual Supabase query building
    return "SELECT DISTINCT role_id FROM role_permissions";
  }

  private buildSubqueryForUsersWithRoles(): string {
    // This would be replaced with actual Supabase query building
    return "SELECT DISTINCT user_id FROM user_roles";
  }

  private generateConsistencySummary(startTime: number, endTime: number): ConsistencySummary {
    const totalChecks = this.consistencyResults.length;
    const passedChecks = this.consistencyResults.filter(r => r.passed).length;
    const failedChecks = totalChecks - passedChecks;
    
    return {
      totalChecks,
      passedChecks,
      failedChecks,
      successRate: (passedChecks / totalChecks) * 100,
      duration: endTime - startTime,
      errors: [...this.errors],
      results: [...this.consistencyResults],
      timestamp: new Date().toISOString()
    };
  }

  private printConsistencySummary(summary: ConsistencySummary): void {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 PERMISSION CONSISTENCY CHECK SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`Total Checks: ${summary.totalChecks}`);
    console.log(`Passed: ${summary.passedChecks} ✅`);
    console.log(`Failed: ${summary.failedChecks} ❌`);
    console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`Duration: ${summary.duration}ms`);
    
    if (summary.errors.length > 0) {
      console.log('\n🚨 CONSISTENCY ISSUES:');
      summary.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    const isConsistent = summary.failedChecks === 0 && summary.successRate >= 95;
    console.log('\n' + '='.repeat(60));
    if (isConsistent) {
      console.log('🎉 PERMISSION SYSTEM IS CONSISTENT');
    } else {
      console.log('❌ PERMISSION INCONSISTENCIES DETECTED');
      if (this.config.strict) {
        console.log('💥 Strict mode enabled - fixing inconsistencies before deployment');
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

interface ConsistencyResult {
  checkName: string;
  passed: boolean;
  message: string;
  timestamp: string;
}

interface ConsistencySummary {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  successRate: number;
  duration: number;
  errors: string[];
  results: ConsistencyResult[];
  timestamp: string;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  try {
    const checker = new PermissionConsistencyChecker();
    const summary = await checker.runAllConsistencyChecks();
    
    // Exit with appropriate code
    const exitCode = summary.failedChecks === 0 && summary.successRate >= 95 ? 0 : 1;
    
    if (this.config?.strict && exitCode === 1) {
      console.log('\n💥 Strict mode enabled - permission inconsistencies must be resolved');
      process.exit(1);
    }
    
    process.exit(exitCode);
    
  } catch (error) {
    console.error('💥 Fatal error during permission consistency check:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { PermissionConsistencyChecker, ConsistencyResult, ConsistencySummary };